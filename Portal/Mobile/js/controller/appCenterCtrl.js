module.controller('appCenterCtrl', function ($scope, $rootScope, $ionicHistory, $state, commonJS, appCenterService, focus) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $rootScope.hideTabs = false;
        $scope.removeSession();
        //设置钉钉头部
        if ($rootScope.dingMobile.isDingMobile) { 
            $scope.SetDingDingHeader($rootScope.languages.tabs.AppCenter);
            dd.biz.navigation.setRight({ show: false, });
            dd.biz.navigation.setLeft({ show: false, });
        }
    });
    $scope.init = function () {
        $scope.getAppList();
    };

    $scope.removeSession = function () {
        // 清理应用中心缓存
        if (window.sessionStorage.getItem("H3.queryListCtrl.decodeURI.hash")) {
            _url = window.sessionStorage.getItem("H3.queryListCtrl.decodeURI.hash");
            window.sessionStorage.removeItem("H3.queryListCtrl.decodeURI.hash");
        }
    };


    $scope.getAppList = function () {
        var url = $scope.setting.httpUrl + '/mobile/GetAppList';
        var options = {
            AppCode: "",
            //DisplayName:""
        };
        $scope.AllApps = [];
        if (window.cordova) {
            url = $scope.setting.appServiceUrl + '/GetAppList?callback=JSON_CALLBACK';
            url += '&mobileToken=' + $scope.user.MobileToken;
            url += '&userCode=' + $scope.user.Code;
            url += '&AppCode=';
        }

        commonJS.loadingShow();
        appCenterService.getAppList(url, options, window.cordova).then(function (result) {
            commonJS.loadingHide();
            window.console.log(result);
            var allApps = [];
            //移动端应用中心过滤流程中心
            for (var i = 0; i < result.AllApps.length; i++) {
                if (result.AllApps[i].AppCode != "Workflow") {
                    allApps.push(result.AllApps[i]);
                }
            }
            $scope.AllApps = allApps;

        }, function (reason) {
            commonJS.loadingHide();
            commonJS.showShortMsg("setcommon f15", reason, 2000);
        })
    }


    $scope.openAppCenterItem = function (AppCode, DisplayName) {
        $state.go("appCenterItem", { 'AppCode': AppCode, 'DisplayName': DisplayName });
    }


    $scope.init();
});