module.controller('addressListCtrl', function ($scope, $rootScope, $stateParams, $state,$ionicScrollDelegate, $ionicLoading, httpService, OrgInfoService, commonJS) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        commonJS.loadingShow();
        $scope.loadAllComplete = false;//遮罩之前的数据
        $scope.init();
        $scope.loadOrg();
    });
    $scope.$on("$ionicView.beforeLeave", function (scopes, states) {
        //commonJS.loadingShow();
        $scope.loadAllComplete = false;//遮罩之前的数据
    });
    //初始化变量
    $scope.init = function () {
        $scope.OrgUnits = [];
        $scope.OrgUsers = [];
        $scope.userOU = {};
        $scope.RootId = "";//存储根节点
        $scope.SearchMode = false;
        $scope.searchKey = "";
    };
    //加载组织
    $scope.loadOrg = function () {
        commonJS.loadingShow();
        var orgId = $stateParams.id ? $stateParams.id : "";
        var url = "";
        var loginfrom = "";
        var params = null;
        var isJsonp = false;
        if (window.cordova) {
            var isJsonp = true;
            url = $scope.setting.appServiceUrl + "/GetOrganizationByParent?callback=JSON_CALLBACK";
            url += "&userCode=" + $scope.user.Code;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&parentId=" + orgId;
        } else {
            url = $scope.setting.httpUrl + "/Mobile/GetOrganizationByParent";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                parentId: orgId
            }
        }
        OrgInfoService.GetOrgInfo(url, params, isJsonp).then(function (result) {
           // console.log(result)
            var resultValue = result;
            if (!resultValue) return;
            $scope.OrgUnits = resultValue.orgUnits;
            $scope.OrgUsers = resultValue.orgUsers;
            $scope.userOU = resultValue.userOU;//当前用户组织
            $scope.RootId = resultValue.RootId;
        }).finally(function () {
            $ionicScrollDelegate.scrollTop(true);
            commonJS.loadingHide();
            $scope.loadAllComplete = true;
        });
    }
    // 打开指定用户详情
    $scope.openUser = function (objectId, index) {
        $scope.CancelSearch();
        $rootScope.userIndex = index;
        $state.go("userDetail", {
            id: objectId
        });
    }
    //打开用户OU 
    $scope.openUserOU = function (objectId) {
        if ($scope.RootId == objectId) return;
        if (objectId != "") {
            $state.go("addressListItem", {
                id: objectId
            });
        }
    }
    // 搜索用户
    $scope.doSearch = function () {
        $ionicScrollDelegate.scrollTop(true);
        $scope.loadComplete = false;
        var url = "";
        var params = null;
        var isJsonp = false;
        if ($scope.searchKey == "") return;
        commonJS.loadingShow();
        if (window.cordova) {
            var isJsonp = true;
            url = $scope.setting.appServiceUrl + "/SearchUser?callback=JSON_CALLBACK";
            url += "&userCode=" + $scope.user.Code;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&parentId=";// + $scope.parentId;
            url += "&searchKey=" + $scope.searchKey;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/NewSearchUser";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                parentId: "",// $scope.parentId,
                searchKey: $scope.searchKey
            }
        }
        OrgInfoService.GetOrgInfo(url, params, isJsonp).then(function (result) {
            if (!result) return
            $scope.OrgUsers_Search = result.orgUsers;
            $scope.loadComplete = true;
            commonJS.loadingHide();
        }).finally(function () {
            commonJS.loadingHide();
        });
    }
    //清空搜索内容
    $scope.CancelSearch = function () {
        $scope.searchKey = "";
        $scope.OrgUsers_Search = [];
    }
});