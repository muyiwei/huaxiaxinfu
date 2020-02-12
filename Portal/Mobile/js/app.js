/// <reference path="app.js" />
angular.module('starter', ['ui.bootstrap', 'ui.load', 'ui.jq', 'ionic', 'starter.controllers', 'starter.services', 'starter.directives', 'ngCordova', 'ion-datetime-picker'])
    .run(function ($ionicPlatform, $location, $timeout, $rootScope,
        $ionicHistory, $state, $ionicPickerI18n) {
        //时间控件自定义设定
        var lang = window.localStorage.getItem('H3.Language') || 'zh_cn';
        if (lang == 'en_us') {
            $ionicPickerI18n.weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            $ionicPickerI18n.months = ["Jan", "Fed", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Otc", "Nov", "Dec"];
            $ionicPickerI18n.ok = "OK";
            $ionicPickerI18n.cancel = "Clear";
            $ionicPickerI18n.okClass = "button-balanced";
            // $ionicPickerI18n.cancelClass = "button-balanced";
        } else if (lang == 'zh_cn') {
            $ionicPickerI18n.weekdays = ["日", "一", "二", "三", "四", "五", "六"];
            $ionicPickerI18n.months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
            $ionicPickerI18n.ok = "确定";
            $ionicPickerI18n.cancel = "取消";
            $ionicPickerI18n.okClass = "button-balanced";
            // $ionicPickerI18n.cancelClass = "button-balanced";
        }
        //添加事件监听
        $rootScope.$on("$stateChangeStart", function (e, ts, tp, fs, ft) {
            if (fs.name.indexOf("app.") != -1) {
                $("[name='app-view']").find("ion-view").attr("nav-view", "cached");
            }
        })
        //ios表单禁止底部按钮滚动
        if (ionic.Platform.isIOS()) {
            dd.ready(function () {
                dd.ui.webViewBounce.disable();
            })
        }
    })
    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

        $ionicConfigProvider.platform.ios.tabs.style('standard');
        $ionicConfigProvider.platform.ios.tabs.position('bottom');
        $ionicConfigProvider.platform.android.tabs.style('standard');
        $ionicConfigProvider.platform.android.tabs.position('standard');

        //安卓手机不能滑动的bug
        $ionicConfigProvider.scrolling.jsScrolling(true);



        $ionicConfigProvider.platform.ios.navBar.alignTitle('center');
        /*   $ionicConfigProvider.platform.android.navBar.alignTitle('left');*/

        $ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-thin-left');
        $ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');

        $ionicConfigProvider.platform.ios.views.transition('ios');
        $ionicConfigProvider.platform.android.views.transition('android');

        var defaultState = "/tab/home";
        if (window.cordova) {
            defaultState = "/login";
        }
        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

          // setup an abstract state for the tabs directive

          ////表单页-编辑-展示
          //.state('inputGroup', {
          //    url: '/inputGroup',
          //    templateUrl: 'templates/input-group.html',
          //    controller: 'inputGroupCtrl'
          //})
          ////流程详情
          //.state('details', {
          //    url: '/details',
          //    templateUrl: 'templates/details.html',
          //    controller: 'detailsCtrl'
          //})
          ////普通流程详情
          //.state('listDetails', {
          //    url: '/listDetails',
          //    templateUrl: 'templates/listDetails.html',
          //    controller: 'listDetailsCtrl'
          //})


          //底部
            .state('tab', {
                url: '/tab',
                abstract: true,
                templateUrl: 'templates/tabs.html'
            })
            .state('tab.home', {
                url: '/home',
                params: { reload: false, selectIndex: null },
                views: {
                    'tab-home': {
                        templateUrl: 'templates/tab-home.html',
                        controller: 'HomeCtrl'
                    }
                }
            })
            .state('tab.startworkflow', {
                url: '/startworkflow',
                views: {
                    'tab-startworkflow': {
                        templateUrl: 'templates/tab-startworkflow.html',
                        controller: 'startworkflowCtrl'
                    }
                }
            })
            .state('tab.myInstances', {
                url: '/myInstances',
                views: {
                    'tab-myInstances': {
                        templateUrl: 'templates/tab-myInstances.html',
                        controller: 'myInstancesCtrl'
                    }
                }
            })
            //通讯录
             .state('tab.addressList', {
                 url: '/addressList',
                 views: {
                     'tab-addressList': {
                         templateUrl: 'templates/tab-addressList.html',
                         controller: 'addressListCtrl'
                     }
                 }
             })
             //通讯录子页面
            .state('addressListItem', {
                url: '/addressListItem/:id/:DisplayName',
                templateUrl: 'templates/addressListItem.html',
                controller: 'addressListItemCtrl'
            })
             //用户详情
          .state('userDetail', {
              url: '/userDetail/:id',
              templateUrl: 'templates/userDetail.html',
              controller: 'userDetailCtrl'
          })
             //应用中心
            .state('tab.appCenter', {
                url: '/appCenter',
                views: {
                    'tab-appCenter': {
                        templateUrl: 'templates/tab-appCenter.html',
                        controller: 'appCenterCtrl'
                    }
                }
            })
           .state('sheetUser', {
               url: '/sheetUser/:isReport/:displayName/:isQueryList/:queryListType',
               templateUrl: 'templates/sheetUser.html?v=201802241017',
               controller: 'sheetUserCtrl'
           })
          //系统设置
          .state('settings', {
              url: '/settings',
              templateUrl: 'templates/settings.html',
              controller: 'settingsCtrl'
          })
          .state('language', {
              url: '/language',
              templateUrl: 'templates/language.html',
              controller: 'settingsLangCtrl'
          })
          //登陆
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'loginCtrl'
            })


            //应用中心子页面
            .state('appCenterItem', {
                url: '/appCenterItem/:AppCode/:DisplayName',
                templateUrl: 'templates/appCenterItem.html',
                controller: 'appCenterItemCtrl'
            })
             //应用中心
            .state('app', {
                abstract: true,
                url: '/app/:TopAppCode',
                templateUrl: 'templates/app.html'
            })
            .state('app.ShowReport', {
                url: '/report/:ReportCode',
                views: {
                    'app-view': {
                        templateUrl: 'report/templates/ReportView.html',
                        controller: 'ShowReportCtrl'
                    }
                }
            })
            //我的流程
            //.state('app.MyInstance', {
            //    url: '/myInstances',
            //    views: {
            //        'app-view': {
            //            templateUrl: 'templates/tab-myInstances.html',
            //            controller: 'myInstancesCtrl'
            //        }
            //    },
            //    params: {
            //        "SchemaCode":null,
            //        "State":null
            //    }
            //})
            //自定义表单
            //.state('app.EditBizObject', {
            //    url: '/EditBizObject/:SchemaCode/:SheetCode/:Mode/:FunctionCode',
            //    views: {
            //        'app-EditBizObject': {
            //            template: "<div></div>",
            //            controller: "EditBizObjectController",
            //        }
            //    }
            //})
        //查询列表
        //.state('app.BizQueryView', {
        //    url: '/QueryList/:TopAppCode/:SchemaCode/:QueryCode/:FunctionCode/:DisplayName',
        //    views: {
        //        'app-view': {
        //            templateUrl: 'templates/appCenter/queryList.html',
        //            controller: 'queryListCtrl'
        //        }
        //    }
        //});
        .state('app.BizQueryView', {
            url: '/QueryList/:TopAppCode/:AppDisplayName/:SchemaCode/:QueryCode/:FunctionCode/:DisplayName',
            views: {
                'app-view': {
                    templateUrl: 'templates/queryList.html',
                    controller: 'queryListCtrl'
                }
            }
        });
        $urlRouterProvider.otherwise(defaultState);
    });


