// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
// 'ionic-datepicker' is found in ionic-datepicker.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngIOS9UIWebViewPatch', 'ngCordova'])
.run(function ($ionicPlatform, $location, $timeout, $rootScope,
    $cordovaToast, $ionicHistory, $state, $cordovaNetwork, $cordovaPush) {
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
        if (window.plugins && window.plugins.jPushPlugin) {
            //启动极光推送服务
            window.plugins.jPushPlugin.init();
            //调试模式
            window.plugins.jPushPlugin.setDebugMode(true);
        }
        //禁止屏幕旋转
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.screenorientation) {
            window.cordova.plugins.screenorientation.setOrientation("portrait")
        }
    });

    // 主界面和登录界面双击物理返回键退出
    $ionicPlatform.registerBackButtonAction(
        function (e) {
            //判断处于哪个页面时双击退出
            var stateId = "";
            if ($ionicHistory.backView()) stateId = $ionicHistory.backView().stateId;
            if (($location.path().indexOf("/home") > -1 || $location.path().indexOf("/login") > -1)
                && stateId != "home.organization") {
                if ($rootScope.backButtonPressedOnceToExit) {
                    ionic.Platform.exitApp();
                }
                else {
                    $rootScope.backButtonPressedOnceToExit = true;
                    $cordovaToast.showShortTop("再按一次退出系统");
                    $timeout(function () {
                        $rootScope.backButtonPressedOnceToExit = false;
                    }, 2000);
                }
            }
            else {
                // 物理返回键回到系统登录界面
                if ($location.path().indexOf("setting") > -1) {
                    $state.go("login");
                }
                else {
                    // 注册物理键点击则返回上一层
                    $ionicHistory.goBack();
                }
            }
            e.preventDefault();
            return false;
        }, 100);
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

    var defaultState = "/home/index";
    if (window.cordova) {
        defaultState = "/login";
    }

    $stateProvider
    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
    })
    .state('setting', {
        url: '/setting',
        templateUrl: 'templates/setting.html',
        controller: 'settingCtrl'
    })
    .state('worksheet', {
        url: '/worksheet',
        templateUrl: 'templates/home/worksheet.html',
        controller: 'worksheetCtrl',
        params: {
            worksheetUrl: "",
        }
    })
    .state('user', {
        url: '/user/:id',
        templateUrl: 'templates/home/user.html',
        controller: 'userCtrl'
    })
    .state('startworkflow', {
        url: '/startworkflow',
        templateUrl: 'templates/home/startworkflow.html',
        controller: 'startworkflowCtrl'
    })
    .state('organization', {
        url: '/organization/:id',
        templateUrl: 'templates/home/organization.html',
        controller: 'organizationCtrl'
    })
    .state('home', {
        url: "/home",
        abstract: true,
        templateUrl: "templates/home.html"
    })

    .state('home.index', {
        url: '/index',
        views: {
            'home-index': {
                templateUrl: 'templates/home/index.html',
                controller: 'indexController'
            }
        }
    })

    .state('home.unfinishedworkitem', {
        url: '/unfinishedworkitem',
        views: {
            'home-unfinishedworkitem': {
                templateUrl: 'templates/home/unfinishedworkitem.html',
                controller: 'unfinishedWorkItemCtrl'
            }
        }
    })
    .state('home.unreadworkitem', {
        url: '/unreadworkitem',
        views: {
            'home-unreadworkitem': {
                templateUrl: 'templates/home/unreadworkitem.html',
                controller: 'unreadworkitemCtrl'
            }
        }
    })
     .state('finishreadworkitem', {
         url: '/finishreadworkitem',
         templateUrl: 'templates/home/finishreadworkitem.html',
         controller: 'finishreadworkitemCtrl'
     })
    .state('home.myinstance', {
        url: '/myinstance',
        views: {
            'home-myinstance': {
                templateUrl: 'templates/home/myInstance.html',
                controller: 'myInstanceTabCtrl'
            }
        }
    })
    .state('finishedworkitem', {
        url: '/finishedworkitem',
        templateUrl: 'templates/home/finishedworkitem.html',
        controller: 'finishedWorkItemCtrl'
    })
    .state('home.unfinishedinstance', {
        url: '/unfinishedinstance',
        views: {
            'home-unfinishedinstance': {
                templateUrl: 'templates/home/unfinishedinstance.html',
                controller: 'unfinishedInstanceCtrl'
            }
        }
    })
    .state('dataModel', {
        url: '/dataModel/:DataModelCode/:QueryCode',
        templateUrl: 'templates/home/dataModel.html',
        controller: 'dataModelCtrl',
    })
        //打开流程，选择表单
     .state('mulSheets', {
         url: '/mulSheets',
         templateUrl: 'templates/home/mulSheets.html',
         controller: 'mulSheetsCtrl',
     })
    $urlRouterProvider.otherwise(defaultState);
});