
import React, { Component, PropTypes } from 'react';
import { NavBar, Icon , ListView , Toast , RefreshControl , SearchBar} from 'antd-mobile';
import { FormattedMessage , injectIntl , intlShape } from 'react-intl';

import { getOrders } from '../../services/dashboardrequest';
import OrderList from '../../components/orders/orders';
import Search from '../../components/searchbar/searchbar';
import { orderStatusFilter } from '../../utils/orderstatusfilter';
import * as gaPageFilter from '../../utils/gafilter';
import { regularEvent } from '../../config';

// response code
import { RESPONSE_CODE } from '../../config';

class OrdersByStatus extends Component {
    static propTypes = {
        className: PropTypes.string,
    };

    constructor(props, context) {
        super(props, context);

        this.dataSource = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });		

        this.requestData = {
            headers: {
                'Authorization': localStorage.token ? localStorage.token : sessionStorage.token
            },
            body: {
                page: 1,
                rows: 100,
                buyername: localStorage.username ? localStorage.username : sessionStorage.username,
                status: this.props.location.query.status
            },
            url: '/dashboard/queryOrderByStatusPage'
        };

		this.state = {
            dataSource: this.dataSource,
            refreshing: false,
			open: false,
			position: 'left'
		}; 
    }

    requestServer() {
        getOrders(this.requestData).then(function(orders){
            Toast.hide();
            switch( orders.data.respcode ) {
                case RESPONSE_CODE.SUCCESFULL_OLD:
                case RESPONSE_CODE.SUCCESFULL : {
                    this.setState({
                        dataSource: this.dataSource.cloneWithRows(orders.data.rows),
                        refreshing: false
                    }); 
                    return;
                }
                case RESPONSE_CODE.NOTOKEN:
                case RESPONSE_CODE.NOTOKEN_OLD:
                case RESPONSE_CODE.TOKEN_INVALID:
                case RESPONSE_CODE.TOKEN_INVALID_OLD:
                case RESPONSE_CODE.PARAMS_ERROR:
                case RESPONSE_CODE.PARAMS_ERROR_OLD:
                case RESPONSE_CODE.REQUEST_ERROR:
                case RESPONSE_CODE.REQUEST_ERROR_OLD: {
                    Toast.fail( this.props.intl.formatMessage( { id: 'request_tip_serviceError' } , { description: 'Serve Error' } , { defaultMessage: 'Serve Error' }) , 1.5 , () => {
                        delete localStorage.token ? localStorage.token : sessionStorage.token;
                        delete localStorage.username ? localStorage.username : sessionStorage.username;
                        this.context.router.replace('/'); 
                    });                   
                    return;
                }
                case NETWORK_ERROR:
                case NETWORK_ERROR_OLD:{
                    Toast.fail( this.props.intl.formatMessage( { id: 'request_tip_network_error' } , { description: 'Network Error' } , { defaultMessage: 'Network Error' }) , 1.5 );  
                    return;
                }
                default: {
                    break;
                }
            }
        }.bind(this));   
    }

    componentDidMount() {
        this.requestServer();
        gaPageFilter.gaSetPage( '/dashboard/ordersbystatus' , 'The orders by status' );
        ga( 'send' , regularEvent.showDashboardOrderList_ordersbystatus );
    }

    onNavbarLeftClick() {
        gaPageFilter.gaSetPage( '/dashboard/ordersbystatus' , 'The orders by status' );
        this.context.router.goBack(); 
    }

    onRefresh() {
        this.requestServer();
    }

    onScroll() {
        //console.log('sss');
    }

    render() {
		const orderBlocks = (rowData) => {
			const orderProps = {
				ordersInfo: {
                    orderNum: rowData.order_num,
					orderID: rowData.order_id,
					contractNo: rowData.contract_no,
					prductShortTip: rowData.prductShortTip,
					status: rowData.status,
					arriveAta: rowData.arriveAta,
					shipEtd: rowData.shipEtd,
					shipChangeToEtd: rowData.shipChangeToEtd,
					shipEta: rowData.shipEta
				}
			}
			return (
				<div>
					<OrderList {...orderProps} />
				</div>
			);
		};

        let navbarProps = {
            iconName: false,
            leftContent: <Icon type={require('../../assets/svgs/icon_arrow_left.svg')} size="md" style={{color:'#fff'}} />,
            onLeftClick: this.onNavbarLeftClick.bind(this)
        };
        let newDate = new Date();
            newDate.setHours(0);
            newDate.setMinutes(0);
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
        let today = Date.parse(newDate);
        let trargtday = today + 24*3600*1000-1;
        let searchData ={
              "endDate": trargtday,
              "startDate": today,
              "status": this.props.location.query.status,
              "url":'/dashboard/queryOrderByStatusPage'
        };
        return (
            <div className='etdOrdersWrap' style={{ height: '100%' }}>

                <NavBar { ...navbarProps } >
                    { orderStatusFilter( this.props.location.query.status ) }
                </NavBar>
                <Search {...searchData}/>
	            <ListView className="dashboardwrap" 
	                dataSource={this.state.dataSource}
	                renderRow={orderBlocks}
	                initialListSize={3}
	                pageSize={1}
	                scrollRenderAheadDistance={100}
	                style={{
	                    height: document.body.clientHeight / 2,
	                    border: '1px solid #ddd',
	                    margin: '0.1rem 0',
	                }}
	                scrollerOptions={{ scrollbars: true }}
	                refreshControl={
	                    <RefreshControl
                            icon={[
                                <div key="0" className="am-refresh-control-pull"><Icon type={require('../../assets/svgs/icon_arrow_down.svg')} size="md" /></div> , 
                                <div key="1" className="am-refresh-control-release"><Icon type={require('../../assets/svgs/icon_arrow_up.svg')} size="md" /></div> 
                            ]}  
	                        refreshing={this.state.refreshing}
	                        onRefresh={this.onRefresh.bind(this)}
	                    />
	                }
	            />

            </div>
        );
    }
}

OrdersByStatus.contextTypes = {
    router: function contextType() {
        return React.PropTypes.Object;
    }
};

export default injectIntl(OrdersByStatus);
