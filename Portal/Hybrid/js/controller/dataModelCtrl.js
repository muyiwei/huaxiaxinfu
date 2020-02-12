module.controller('dataModelCtrl',
function ($rootScope, $scope, $http, $state, $stateParams, $ionicLoading, $ionicScrollDelegate, $ionicModal, $window, $ionicActionSheet, commonJS) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";

    //数据模型数据
    $scope.DataModelData = [];

    $scope.init = function () {
        $scope.DataModelCode = $stateParams.DataModelCode;//数据模型编码
        $scope.QueryCode = $stateParams.QueryCode;//查询编码
        $scope.FromRowNum = 0;
        $scope.ShowCount = 10;

        $scope.exception = false;
        $scope.loadCompleted = false;
        $scope.NoThisWebPart = false;
    };

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $scope.init();
        $scope.loadMoreData();
    });

    // 加载更多
    $scope.loadMoreData = function (refresh) {
        if (refresh) {
            $scope.FromRowNum = 0;
            $scope.ShowCount = $scope.DataModelData.length;
        } else {
            $scope.FromRowNum = $scope.DataModelData.length;
            $scope.ShowCount = 10;
        }
        if ($scope.DataModelCode == "" || $scope.QueryCode == "") {
            if (refresh) {
                $scope.$broadcast("scroll.refreshComplete");
            } else {
                $scope.$broadcast("scroll.infiniteScrollComplete");
            }
            return;
        }

        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetDataModelData?callback=JSON_CALLBACK&userId=" + $scope.user.ObjectID;
            url += "&DataModelCode=" + $scope.DataModelCode;
            url += "&QueryCode=" + $scope.QueryCode;
            url += "&SortBy=";
            url += "&FromRowNum=" + $scope.FromRowNum;
            url += "&ShowCount=" + $scope.ShowCount;
        } else {
            url = $scope.setting.httpUrl + "/Mobile/GetDataModelData";
            params = {
                userId: $scope.user.ObjectID,
                DataModelCode: $scope.DataModelCode,
                QueryCode: $scope.QueryCode,
                SortBy: "",
                FromRowNum: $scope.FromRowNum,
                ShowCount: $scope.ShowCount
            };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            if (result.Extend && result.Extend.length > 0) {
                for (var i = 0; i < result.Extend.length; i++) {
                    if ($scope.existsData(result.Extend[i])) continue;
                    $scope.DataModelData.push(result.Extend[i]);
                }
            }
            if (result.Extend.length < $scope.ShowCount) {
                $scope.loadCompleted = true;
            }
            if (refresh) {
                $scope.$broadcast("scroll.refreshComplete");
            } else {
                $scope.$broadcast("scroll.infiniteScrollComplete");
            }
            $scope.exception = false;
            commonJS.loadingHide();
        })
        .error(function (ex) {
            $scope.loadCompleted = true;
            commonJS.loadingHide();
            if (refresh) {
                $scope.$broadcast("scroll.refreshComplete");
            } else {
                $scope.$broadcast("scroll.infiniteScrollComplete");
            }
            $scope.exception = true;
        })
    };

    $scope.existsData = function (data) {
        if (!$scope.DataModelData || $scope.DataModelData.length == 0) return false;
        for (var i = 0; i < $scope.DataModelData.length; i++) {
            if ($scope.DataModelData[i].ObjectID == data.ObjectID) return true;
        }
        return false;
    };

    $scope.openItem = function (InstanceId) {
        if (!InstanceId) return;
        $scope.worksheetUrl = $scope.setting.instanceSheetUrl + InstanceId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.OpenInstanceSheet($scope, $scope.worksheetUrl, InstanceId);
    }

    // 滚动到顶部
    $scope.scrollTop = function () {
        this.$parent.displayTop = false;
        $ionicScrollDelegate.scrollTop(true);
    };

    $scope.getScrollPosition = function () {
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    }

    $scope.back = function () {
        $state.go("home.index");
    }
});
