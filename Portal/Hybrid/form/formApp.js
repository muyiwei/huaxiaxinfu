// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
// 'ionic-datepicker' is found in ionic-datepicker.js
angular.module('formApp', ['ionic', 'formApp.controllers', 'formApp.services', 'formApp.directives', 'ion-datetime-picker', 'ngIOS9UIWebViewPatch', 'ngCordova', 'oc.lazyLoad'])
    .run(function ($ionicPlatform, $location, $timeout, $rootScope, $ionicPickerI18n,
        $cordovaToast, $ionicHistory, $state, $cordovaNetwork, $cordovaPush, $templateCache) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.cordova && window.cordova.InAppBrowser) {
                window.open = window.cordova.InAppBrowser.open;
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
            //禁止屏幕旋转
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.screenorientation) {
                window.cordova.plugins.screenorientation.setOrientation("portrait")
            }
            //禁止键盘搜索按钮关闭表单
            $(document).keydown(function (event) {
                if (event.keyCode == 13) {
                    if (event.currentTarget.activeElement.type != "textarea") {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            });
        });
        // 主界面和登录界面双击物理返回键退出
        $ionicPlatform.registerBackButtonAction(
            function (e) { }, 100);

        //时间控件自定义设定
        $ionicPickerI18n.weekdays = ["日", "一", "二", "三", "四", "五", "六"];
        $ionicPickerI18n.months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        $ionicPickerI18n.ok = "确定";
        $ionicPickerI18n.cancel = "清空";

        //单选、下拉、多选模板
        var begin = "<ion-modal-view class='bpm-mobile-select'>" +
        "<ion-header-bar class='bar-dark'>" +
          "<h1 class='title'>{{header}}</h1>" +
          "<button class='button button-clear button-icon ion-close-circled item-right' ng-click='modal.hide()'></button>" +
        "</ion-header-bar>" +
        "<ion-header-bar class='bar-subheader item-input-inset'>" +
          "<label class='item-input-wrapper'>" +
            "<i class='icon ion-ios-search placeholder-icon'></i>" +
            "<input type='search' placeholder='Search' ng-model='searchText'>" +
          "</label>" +
        "</ion-header-bar>" +
        "<ion-content>" +
          "<ion-list>";
        var checkbox = "<ion-checkbox ng-repeat='item in CheckListDisplay| filter:searchText'" +
                             "ng-model='item.checked'" +
                             "ng-checked='item.checked' ng-click='clickCheckList()'>{{item.text}}" +
                        "</ion-checkbox>";
        var radio = "<ion-radio ng-repeat='item in RadioListDisplay | filter:searchText'" +
                             "ng-model='RadioListValue'" +
                             "ng-value='item.Value'" +
                             "ng-click='clickRadio(item.Value,item.Text)'>{{item.Text}}" +
                  "</ion-radio>";
        var end = "</ion-list>" +
          "</ion-content>" +
        "</ion-modal-view>";

        var style = "<style>" +
            ".bpm-mobile-select {top: 190px;}" +
            ".bpm-mobile-select ion-list div.list{padding-bottom:190px;}" +
            ".bpm-mobile-select ion-list div.list label div.item-content{padding-bottom: 10px;padding-top: 10px;}" +
            "</style>";
        $templateCache.put('checkbox_autocomplete.html', begin + checkbox + style + end);
        $templateCache.put('radio_autocomplete.html', begin + radio + style + end);
    })
    //.constant('$ionicLoadingConfig', {
    //    template: "<ion-spinner icon=\"bubbles\" class=\"spinner-balanced\"></ion-spinner>"
    //})
    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
        // 修改默认显示效果
        // $ionicConfigProvider.platform.ios.tabs.style("standard");
        // $ionicConfigProvider.platform.ios.tabs.position("bottom");
        $ionicConfigProvider.platform.android.tabs.style("standard");
        $ionicConfigProvider.platform.android.tabs.position("bottom");
        // $ionicConfigProvider.platform.ios.navBar.alignTitle("center");
        $ionicConfigProvider.platform.android.navBar.alignTitle("center");
        // 设置返回文本为空和箭头图标  // previousTitleText("")
        //$ionicConfigProvider.platform.ios.backButton.icon("ion-android-arrow-back");//ion-ios-arrow-thin-left
        //$ionicConfigProvider.platform.android.backButton.icon("ion-android-arrow-back");
        $ionicConfigProvider.backButton.previousTitleText(false).text("").icon("ion-android-arrow-back");
        $ionicConfigProvider.platform.ios.views.transition("ios");
        $ionicConfigProvider.platform.android.views.transition("android");
        $stateProvider
            .state('form', {
                url: '/form',
                abstract: true,
                templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/empty.html' },
                controller: "mainCtrl",
                params: {
                    dataField: "",
                    loadUrl: "",
                    loadOptions: "",
                    initUsers: null,
                    isMutiple: false,
                    options: null
                }
            })
            .state('form.detail', {
                url: '/detail',
                views: {
                    'form-detail': {
                        templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/formDetail.html' },
                        controller: 'formSheetCtrl'
                    }
                }
            })
            .state('form.sheetquery', {
                url: '/sheetquery/:datafield/:rownum',
                views: {
                    'form-detail': {
                        templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/sheetQuery.html' },
                        controller: 'sheetQueryCtrl'
                    }
                }
            })
            .state('form.sheetuser', {
                url: '/sheetuser',
                views: {
                    'form-detail': {
                        templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/sheetUser.html' },
                        controller: 'sheetUserCtrl'
                    }
                }
            })
        //传阅、征询、转发路由
         .state('form.fetchuser', {
             url: '/fetchuser',
             views: {
                 'form-detail': {
                     templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/FetchUser.html' },
                     controller: 'fetchUserCtrl'
                 }
             }
         })
        //流程状态
        .state('form.instancestate', {
            url: '/instancestate/:Mode/:InstanceID/:WorkflowCode/:WorkflowVersion',
            views: {
                'form-detail': {
                    templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/instanceState.html' },
                    controller: 'instanceStateCtrl'
                }
            },
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                    _PORTALROOT_GLOBAL + "/WFRes/assets/stylesheets/sheet.css",
                    _PORTALROOT_GLOBAL + "/WFRes/_Content/designer/css/designer.css",
                    //_PORTALROOT_GLOBAL + "/Mobile/Scroll/iscroll-zoom.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/Activity.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/ActivityDrag.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/ActivityModel.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/Line.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/Workflow.js",
                    _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/WorkflowDocument.js",
                    ]).then(function () {
                        return $ocLazyLoad.load([
                            _PORTALROOT_GLOBAL + "/WFRes/_Scripts/jquery/jquery.lang.js",
                            _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/misc.js",
                            _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/MobileLoader.js"
                        ]);
                    })
                }]
            }
        })
        .state('form.downLoadFile', {
            url: 'downLoadFile/:url/:extension',
            cache: false,
            views: {
                'form-detail': {
                    templateUrl: function () { return _PORTALROOT_GLOBAL + '/Hybrid/form/templates/downLoadFile.html' },
                    controller: 'downLoadFileCtrl'
                }
            }
        })

        $urlRouterProvider.otherwise("/form/detail");
    });