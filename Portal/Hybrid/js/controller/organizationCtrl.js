module.controller('organizationCtrl', function ($rootScope, $scope, $state, $stateParams, $timeout, $ionicModal, $http, $ionicScrollDelegate, commonJS) {
    var u = navigator.userAgent;
    var ios = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    $scope.userId = "";
    $scope.parentParentId = "";
    $scope.loadComplete = false;
    $scope.searchKey = "";
    $scope.init = function () {
        $scope.isCompany = false;
        $scope.OrgUnits = [];
        $scope.OrgUsers = [];
        $scope.parentId = "";
        $scope.parentParentId = "";
        $scope.ParentName = "";
        $scope.DividerDisplay = false;
        $scope.displaySearchButton = false;
        $scope.loadComplete = false;
        $scope.myObj = {};
    };
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $scope.searchKey = "";
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("通讯录");
        }
        if ($scope.userId != $scope.user.ObjectID) {
            $scope.init();
            $scope.loadOrg();
            $scope.userId = $scope.user.ObjectID;
        }
        $ionicScrollDelegate.resize();
    });
    //加载组织
    $scope.loadOrg = function () {
        var orgId = $stateParams.id;
        var url = "";
        var loginfrom = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetOrganizationByParent?callback=JSON_CALLBACK";
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
        commonJS.getHttpData(url, params)
        .success(function (result) {
            console.log(result)
            var resultValue = result;
            if (!resultValue) return;
            $scope.OrgUnits = resultValue.orgUnits;
            $scope.OrgUsers = resultValue.orgUsers;
            if ($scope.OrgUnits.length > 0 && $scope.OrgUsers.length > 0) {
                $scope.DividerDisplay = true;
            }
            $scope.ParentName = resultValue.parentName;
            $scope.loadComplete = true;
            $scope.parentId = resultValue.parentId;
            $scope.parentParentId = resultValue.parentParentId || "";
            $scope.userOU = resultValue.userOU;
            $scope.parentUnits = resultValue.parentUnits;
            $scope.isCompany = $scope.parentParentId == "";

            var reg = new RegExp("(^|&)loginfrom=([^&]*)(&|$)");
            var r = top.window.location.search.substr(1).match(reg);
            if (r != null) loginfrom = unescape(r[2]);
            if (typeof (WeixinJSBridge) != "undefined") {
                loginfrom = "wechat";
            }

            $scope.bpmbreadcrumb = { "top": "44px" }
            if ((loginfrom == "dingtalk" && dd && dd.version) || loginfrom == "wechat") {//钉钉、微信端
                if (loginfrom == "dingtalk" && dd && dd.version) {
                    if (!$scope.isCompany) {
                        $scope.myObj = { "top": "85px" }//为了兼容手机屏幕，PC端问题纯属正常现象
                        $scope.bpmcontent = { "top": "85px" }
                        $scope.bpmbreadcrumb = { "top": "0px" }
                    }
                    else
                        $scope.myObj = { "top": "44px" }
                }
                if (loginfrom == "wechat") {
                    if (!$scope.isCompany) {
                        $scope.myObj = { "top": "132px" }
                        $scope.bpmcontent = { "top": "131px" }
                    }
                    else {
                        $scope.myObj = { "top": "88px" }
                    }
                }
            } else {  //PC、APP 
                if (!$scope.isCompany) {
                    $scope.myObj = { "top": "131px" }
                    $scope.bpmcontent = { "top": "85px" }
                }
                else
                    $scope.myObj = { "top": "86px" }

            }

            $scope.getcss();
            commonJS.loadingHide();
        }).error(function (e) {
            commonJS.loadingHide();
        });
    }


    //$scope.bpmbreadcrumb
    //$scope.bpmcontent
    //$scope.bpmsearchcontent
    $scope.getcss = function () {
        if ($rootScope.loginfrom == "dingtalk") {
            if (!$scope.isCompany) {
                $scope.bpmbreadcrumb = {
                    "top": "0px"
                }
                if ($scope.searchKey != "") {
                    $scope.myObj = { "top": "44px" }
                }
            }
        } else if ($rootScope.loginfrom == "wechat") {
            if (!$scope.isCompany) {
                $scope.bpmbreadcrumb = {
                    "top": "44px"
                }
                if ($scope.searchKey != "") {
                    $scope.myObj = { "top": "85px" }
                }
            }
        }
        else if ($rootScope.loginfrom == "app") {
            if (!$scope.isCompany) {
                if ($scope.searchKey != "") {
                    if (ios) {
                        $scope.myObj = { "top": "54px" }
                    } else {
                        $scope.myObj = { "top": "85px" }
                    }
                } else {
                    $scope.myObj = { "top": "130px" }
                    if (ios) {
                    } else {
                        $scope.bpmcontent = { "top": "130px" }
                    }
                }
            }
        }
        if (ios) {
            $scope.myObj = {}
        }
    }

    // 打开指定组织
    $scope.openUnit = function (objectId) {
        if (objectId == "") {
            $state.go("home.index")
        } else {
            $state.go("organization", {
                id: objectId
            });
        }
    }
    //打开用户OU 
    $scope.openUserOU = function () {
        if ($scope.userOU.objectId != "") {
            $state.go("organization", {
                id: $scope.userOU.objectId
            });
        }
    }
    // 打开指定用户
    $scope.openUser = function (objectId, index) {
        $scope.clearSearch();
        $rootScope.userIndex = index;
        $state.go("user", {
            id: objectId
        });
    }
    // 点击电话
    $scope.openTel = function () {
        event.stopPropagation();
    }
    // 搜索用户
    $scope.doSearch = function (searchKey) {
        $ionicScrollDelegate.scrollTop(true);
        $scope.loadComplete = false;
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/SearchUser?callback=JSON_CALLBACK";
            url += "&userCode=" + $scope.user.Code;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&parentId=";// + $scope.parentId;
            url += "&searchKey=" + $scope.searchKey;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/SearchUser";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                parentId: "",// $scope.parentId,
                searchKey: $scope.searchKey
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            if (!result) return
            $scope.OrgUsers_Search = result.orgUsers;
            $scope.loadComplete = true;
            commonJS.loadingHide();
            $scope.getcss();
        }).error(function () {
            commonJS.loadingHide();
        });
    }
    //清空搜索内容
    $scope.clearSearch = function () {
        $scope.searchKey = "";
        $scope.OrgUsers_Search = [];
    }
});
