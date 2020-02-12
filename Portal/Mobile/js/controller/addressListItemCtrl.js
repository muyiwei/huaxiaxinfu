module.controller('addressListItemCtrl', function ($scope, $rootScope, $stateParams, $state,$ionicScrollDelegate, $ionicLoading, OrgInfoService, httpService, commonJS) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        commonJS.loadingShow();
        $scope.loadComplete = false;//遮罩之前的数据
        $scope.init();//初始化变量
        $scope.loadOrg();
    });
    $scope.$on("$ionicView.beforeLeave", function (scopes, states) {
        commonJS.loadingShow();
        $scope.loadComplete = false;//遮罩之前的数据
    });
    //初始化变量
    $scope.init = function () {
        $scope.OrgUnits = [];
        $scope.OrgUsers = [];
        $scope.SearchMode = false;
        $scope.parentUnits = [];
        $scope.ParentName = "";
        $scope.RootId = "";//根目录id
        $scope.searchKey = "";
        $scope.loadComplete = false;
        $scope.searchComplete = false;
    };
    //加载组织
    $scope.loadOrg = function () {
        commonJS.loadingShow();
        var orgId = $stateParams.id;
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
            //当前
            $scope.userOUId = resultValue.parentId;
            $scope.userOU = resultValue.userOU;
            //路径
            $scope.parentUnits = resultValue.parentUnits;
            $scope.ParentName = resultValue.parentName;
            $scope.RootId = resultValue.RootId;//根目录
        }).finally(function () {
            $scope.loadComplete = true;
            commonJS.loadingHide();
        });
     
    }
    //返回上级组织，返回目录
    $scope.goBack = function () {
        if ($scope.SearchMode) {
            //搜索只搜人员不存在上一层返回
            $("input[type='search']").blur();
            $scope.SearchMode = false;
            $scope.searchItems = [];
            $scope.searchKey = "";
        } else {
            if ($scope.parentUnits.length==1) {
                $state.go("tab.addressList");
            } else {
                var objectId = $scope.parentUnits.slice().reverse()[$scope.parentUnits.length - 1].ObjectID;
                $state.go("addressListItem", {
                    id: objectId
                });
            }
        }

    };
    // 打开指定用户详情
    $scope.openUser = function (objectId, index) {
        $scope.CancelSearch();
        $state.go("userDetail", {
            id: objectId
        });
    }
    //打开用户OU 
    $scope.openUserOU = function (objectId, index) {
        if (objectId != "") {
            $state.go("addressListItem", {
                id: objectId
            });
        }
    }
    // 打开指定组织
    $scope.openUnit = function (objectId) {
        if (objectId == "" || $scope.RootId == objectId) {
            $state.go("tab.addressList")
        } else {
            $state.go("addressListItem", {
                id: objectId
            });
        }
    }
    // 搜索用户
    $scope.doSearch = function () {
        $ionicScrollDelegate.scrollTop(true);
        $scope.searchComplete = false;
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
        }).finally(function () {
            $scope.searchComplete = true;
            commonJS.loadingHide();
        });
    }
    //清空搜索内容
    $scope.CancelSearch = function () {
        $scope.searchKey = "";
        $scope.OrgUsers_Search = [];
    }
});