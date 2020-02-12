module.controller('unfinishedInstanceCtrl',
function ($scope, $http, $ionicSideMenuDelegate, $ionicLoading, $ionicScrollDelegate, $ionicModal,
    $window, $ionicActionSheet, commonJS, focus) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";
    $scope.init = function () {
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.displayTop = false;
        $scope.userId = $scope.user.ObjectID;
        $scope.searchKey = "";
        $scope.worksheetUrl = "";
        $scope.initCompleted = false;
        $scope.exception = false;
        // 待办任务集合
        $scope.myInstances = [];
        // 是否加载完成
        $scope.loadCompleted = false;
        // 排序方式
        $scope.sortActionIndex = 1;  // 默认是 1
        $scope.sortKey = "CreatedTime";
        $scope.sortDirection = "Desc";
    }

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($scope.userId != $scope.user.ObjectID) {
            $scope.init();
            $scope.loadMoreInstances();
        }
        else {
            $scope.refreshInstance();
        }
    });
    // 刷新待办
    $scope.refreshInstance = function () {
        if (!$scope.initCompleted) {
            commonJS.loadingHide();
            return;
        }
        console.log("refresh refreshInstance");

        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/RefreshInstances?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + $scope.searchKey;
            url += "&lastTime=" + $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss");
        }
        else {
            url = $scope.setting.httpUrl + "/WeChat/RefreshInstances";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss")
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            //跳转登录页面
            if (result.Message == "登录超时！") {
                $state.go("login");
            }
            var resultValue = result;
            if (resultValue.Instances && resultValue.Instances.length > 0) {
                for (var i = resultValue.Instances.length - 1; i > -1; i--) {
                    if ($scope.existsInstance(resultValue.Instances[i])) continue;
                    $scope.myInstances.splice(0, 0, resultValue.Instances[i]);
                }
            }
            $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
            if ($scope.exception) {
                $scope.loadCompleted = false;
            }
            $scope.exception = false;
        })
        .error(function (ex) {
            $scope.exception = true;
            $scope.loadCompleted = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
        });
    };
    $scope.existsInstance = function (workItem) {
        if (!$scope.myInstances || $scope.myInstances.length == 0) return false;
        for (var i = 0; i < $scope.myInstances.length; i++) {
            if ($scope.myInstances[i].ObjectID == workItem.ObjectID) return true;
        }
        return false;
    };
    // 加载更多
    $scope.loadMoreInstances = function () {
        console.log("loadMoreInstances");
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/LoadInstances?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + $scope.searchKey;
            url += "&lastTime=" + $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&sortKey=" + $scope.sortKey;
            url += "&sortDirection=" + $scope.sortDirection;
        }
        else {
            url = $scope.setting.httpUrl + "/WeChat/LoadInstances";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss"),
                sortKey: $scope.sortKey,
                sortDirection: $scope.sortDirection
            }
        }
        commonJS.getHttpData(url, params)        
        .success(function (result) {
            //跳转登录页面
            if (result.Message == "登录超时！") {
                $state.go("login");
            }
            if (result.Instances && result.Instances.length > 0) {
                for (var i = 0; i < result.Instances.length; i++) {
                    if ($scope.existsInstance(result.Instances[i])) continue;
                    $scope.myInstances.push(result.Instances[i]);
                }
            }
            $scope.initCompleted = true;
            $scope.exception = false;
            $scope.lastLoadTime = commonJS.getDateFromJOSN(result.LastTime);
            $scope.loadCompleted = result.LoadComplete;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        })
        .error(function () {
            console.log("加载已办出现异常");
            $scope.initCompleted = true;
            $scope.loadCompleted = true;
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        });
    };
    // 显示搜索
    $scope.showSearch = function () {
        $scope.displaySearchButton = !$scope.displaySearchButton;
        if (!$scope.displaySearchButton) {
            if ($scope.searchKey) {
                $scope.searchKey = "";
                $scope.doSearch();
            }
        }
        focus("searchKey");
    }
    // 搜索
    $scope.doSearch = function () {
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.myInstances = [];
        $scope.loadMoreInstances();
    }
    // 排序操作
    $scope.showActionsheet = function () {
        var sortButtons = [
          { text: "<i class=\"icon ion-ios-arrow-up\"></i>按发起时间正序", key: "CreatedTime", direction: "ASC" },
          { text: "<i class=\"icon ion-ios-arrow-down\"></i>按发起时间倒序", key: "CreatedTime", direction: "DESC" }
        ];
        for (var i = 0; i < sortButtons.length; i++) {
            if ($scope.sortActionIndex == i) {
                sortButtons[i].text = "<span class=\"sheetActionPanel selectedAction\">" + sortButtons[i].text + "<i class=\"radio-icon selectedActionIcon disable-pointer-events ion-checkmark\"></i></span>"
            }
            else {
                sortButtons[i].text = "<span class=\"sheetActionPanel\">" + sortButtons[i].text + "</span>"
            }
        }

        $ionicActionSheet.show({
            //titleText: "表单操作示例",
            buttons: sortButtons,
            // destructiveText: '删除',
            cancelText: "取消",
            cancel: function () {
                console.log("取消操作");
            },
            buttonClicked: function (index) {
                $scope.sortActionIndex = index;
                $scope.sortKey = this.buttons[index].key;
                $scope.sortDirection = this.buttons[index].direction;
                $scope.finishedWorkItems = [];
                $scope.lastLoadTime = new Date();
                $scope.lastRefreshTime = new Date();
                $scope.loadMoreFishedWorkItem();
                console.log("按钮操作：", index);
                return true;
            },
            destructiveButtonClicked: function () {
                console.log("删除操作");
                return true;
            }
        });
    };

    // 滚动到顶部
    $scope.scrollTop = function () {
        $scope.displayTop = false;
        $ionicScrollDelegate.scrollTop(true);
    };

    $scope.getScrollPosition = function () {
        // console.log(event.detail.scrollTop);
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    }

    // 打开待办
    $scope.openInstance = function (instanceId) {
        if (!instanceId) return;
        $scope.worksheetUrl = $scope.setting.instanceSheetUrl + instanceId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.openWorkItem($scope, $scope.worksheetUrl, instanceId);
    }
    // 关闭表单
    $scope.closeWorkItem = function () {
        $scope.modalForm.hide();
    }


    $scope.init();
    $scope.loadMoreInstances();
});
