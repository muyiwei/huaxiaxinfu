module.controller('EditBizObjectController',
function ($scope, $rootScope, $compile, queryService, $ionicSlideBoxDelegate, $ionicModal, commonJS, $ionicScrollDelegate, $http, $stateParams, $state) {
    $scope.$on('$ionicView.enter', function (scopes, states) {
        //To-Do
        //增加微信中的返回逻辑,从表单跳转回来,需要 window.history.back();

        document.addEventListener('resume', function () {
            if (dd.ios) {
                $ionicHistory.goBack();
            } else {
                dd.biz.navigation.goBack({});
            }
        })
        //独立APP、移动端
        var url = $scope.setting.httpUrl + "/RunBizQuery/EditBizObjectSheet";
        var isJsonp = false;
        var param = null;
        if (window.cordova) {
            isJsonp = true;
            url = $scope.setting.appServiceUrl + '/EditBizObjectSheet?callback=JSON_CALLBACK';
            url += '&mobileToken=' + $scope.user.MobileToken;
            url += '&userCode=' + $scope.user.Code;
            url += '&BizObjectID=';
            url += '&SchemaCode=' + $stateParams.SchemaCode;
            url += '&SheetCode=' + $stateParams.SheetCode
            url += '&Mode=' + $stateParams.Mode;
            url += '&IsMobile=true';
            url += '&EditInstanceData=';
            url += '&rendom=' + new Date().getTime();
        } else {
            param = {
                BizObjectID: "",
                SchemaCode: $stateParams.SchemaCode,
                SheetCode: $stateParams.SheetCode,
                Mode: $stateParams.Mode,
                IsMobile: true,
                EditInstanceData: "",
                rendom: new Date().getTime()
            };
        }
        queryService.EditBizObjectSheet(url, param, isJsonp).then(function (data) {
            if (data.Success) {
                var setting = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.Setting'));
                bizObjectUrl = setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Message + "&sourceUrl=/appCenterItem&loginfrom=" + $rootScope.loginfrom + "&T=" + new Date().getTime();
                commonJS.openWorkItem($scope, bizObjectUrl);
            } else {
                //$rootScope.back();
                // var message = $translate.instant("msgGlobalString.LackOfAuth");
                //  $.notify({ message: message, status: "danger" });
                window.history.back();
                commonJS.showShortTop(data.Message);
            }
        })
    });
});