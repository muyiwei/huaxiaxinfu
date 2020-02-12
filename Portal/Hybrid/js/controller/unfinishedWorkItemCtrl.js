module.controller('unfinishedWorkItemCtrl', function ($rootScope, $scope, $http, $state, $ionicTabsDelegate,
    $ionicActionSheet, $ionicScrollDelegate, $ionicModal, commonJS, focus) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";
    $scope.init = function () {
        $scope.showCancelButton = false; //是否显示取消按钮
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.worksheetUrl = "";
        $scope.displayTop = false;
        $scope.searchKey = "";
        $scope.initCompleted = false;
        $scope.exception = false;
        $scope.displaySearchButton = false;
        $scope.unfinishedWorkItems = [];
        // 是否加载完成
        $scope.loadCompleted = false;
        $scope.totalCount = 0;
        // 排序方式
        $scope.sortActionIndex = 1;  // 默认是1
        $scope.sortKey = "ReceiveTime";
        $scope.sortDirection = "Desc";
        $scope.userId = $scope.user.ObjectID;
    }
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("待办");
        }
        if ($scope.userId != $scope.user.ObjectID) {
            $scope.init();
            $scope.loadMoreUnfishedWorkItem();
        }
        else {
            $scope.refreshUnfinishedWorkItem();
        }
        //打开表单页面
        if ($scope.jpushWorkItemId != "") {
            $scope.openWorkItem($scope.jpushWorkItemId);
            $scope.jpushWorkItemId = "";
        }
    });
    // 每次离开入View时触发
    $scope.$on("$ionicView.afterLeave", function () {
        $scope.searchKey = "";
        $scope.focus = false;
    })
    // 加载更多
    $scope.loadMoreUnfishedWorkItem = function () {
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetWorkItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + $scope.searchKey;
            url += "&lastTime=" + $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&sortKey=" + $scope.sortKey;
            url += "&sortDirection=" + $scope.sortDirection;
            url += "&finishedWorkItem=" + false;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/GetWorkItems";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss"),
                sortKey: $scope.sortKey,
                sortDirection: $scope.sortDirection,
                finishedWorkItem: false
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            var resultValue = result;
            if ($scope.unfinishedWorkItems.length == 0) {
                // 设置刷新时间
                $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.RefreshTime);
            }
            if (resultValue.WorkItems && resultValue.WorkItems.length > 0) {
                for (var i = 0; i < resultValue.WorkItems.length; i++) {
                    if ($scope.existsWorkItem(resultValue.WorkItems[i])) continue;
                    $scope.unfinishedWorkItems.push(resultValue.WorkItems[i]);
                }
            }
            $scope.initCompleted = true;
            $scope.lastLoadTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            $scope.loadCompleted = resultValue.LoadComplete;
            $scope.setBadge(resultValue.TotalCount);
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.exception = false;
        })
        .error(function () {
            console.log("加载待办出现异常");
            $scope.initCompleted = true;
            $scope.exception = true;
            $scope.loadCompleted = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        })
    }
    // 刷新待办
    $scope.refreshUnfinishedWorkItem = function () {
        if (!$scope.initCompleted) {
            commonJS.loadingHide();
            return;
        }
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetRefreshWorkItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + $scope.searchKey;
            url += "&lastTime=" + $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&finishedWorkItem=false";
            url += "&existsLength=" + $scope.unfinishedWorkItems.length;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/GetRefreshWorkItems";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss"),
                finishedWorkItem: false,
                existsLength: $scope.unfinishedWorkItems.length,
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            var resultValue = result;
            // 检查是否存在已经办完的任务
            for (var i = 0; i < $scope.unfinishedWorkItems.length; i++) {
                if (resultValue.ExistsIds.indexOf($scope.unfinishedWorkItems[i].ObjectID) == -1) {
                    $scope.setBadge($scope.totalCount - 1);
                    $scope.unfinishedWorkItems.splice(i, 1);
                    i--;
                }
            }

            if (resultValue.WorkItems && resultValue.WorkItems.length > 0) {
                for (var i = resultValue.WorkItems.length - 1; i > -1; i--) {
                    if ($scope.existsWorkItem(resultValue.WorkItems[i])) continue;
                    $scope.unfinishedWorkItems.splice(0, 0, resultValue.WorkItems[i]);
                }
            }
            if ($scope.unfinishedWorkItems.length < 10
              && resultValue.ExistsIds.length > 0
              && $scope.unfinishedWorkItems.length < resultValue.ExistsIds.length) {// 重新加载一次
                $scope.loadMoreUnfishedWorkItem();
            }

            $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            $scope.setBadge(resultValue.TotalCount);
            $scope.$broadcast("scroll.refreshComplete");
            commonJS.loadingHide();
            if ($scope.exception) {
                $scope.loadCompleted = false;
            }
            $scope.exception = false;
        })
        .error(function (ex) {
            $scope.loadCompleted = true;
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
        });
    }
    //
    $scope.existsWorkItem = function (workItem) {
        if (!$scope.unfinishedWorkItems || $scope.unfinishedWorkItems.length == 0) return false;
        for (var i = 0; i < $scope.unfinishedWorkItems.length; i++) {
            if ($scope.unfinishedWorkItems[i].ObjectID == workItem.ObjectID) return true;
        }
        return false;
    };
    //设置Badge
    $scope.setBadge = function (totalCount) {
        //待办数量，在Controller中
        if (totalCount > 0) {
            $rootScope.badge.unfinishedworkitem = totalCount > 99 ? "99+" : totalCount;
        }
        else if ($scope.unfinishedWorkItems.length == 0) {
            $rootScope.badge.unfinishedworkitem = 0;
        }

        if (window.plugins && window.plugins.jPushPlugin) {// 设置极光推送的数字
            window.plugins.jPushPlugin.setApplicationIconBadgeNumber($scope.totalCount);
        }
    };
    // 搜索
    $scope.doSearch = function () {
        $scope.scrollTop();
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.unfinishedWorkItems = [];
        $scope.loadMoreUnfishedWorkItem();
    }
    //清空搜索内容
    $scope.clearSearch = function () {
        $scope.searchKey = "";
        $scope.doSearch();
    }
    // 打开待办
    $scope.openWorkItem = function (workItemId) {
        if (!workItemId) return;
        $scope.worksheetUrl = $scope.setting.workItemUrl + workItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.GetWorkItemSheetUrl($scope, $scope.worksheetUrl, workItemId);
    }
    // 完成一个任务
    $scope.finishWorkItem = function (workItemId) {
        for (var i = 0; i < $scope.unfinishedWorkItems.length; i++) {
            if ($scope.unfinishedWorkItems[i].ObjectID == workItemId) {
                if ($scope.totalCount > 0) {
                    $scope.setBadge($scope.totalCount - 1);
                }
                $scope.unfinishedWorkItems.splice(i, 1);
            }
        }
    }
    // 关闭表单
    $scope.closeWorkItem = function () {
        $scope.modalForm.hide();
    }
    // 排序操作
    $scope.showActionsheet = function () {
        var sortButtons = [
                { text: "<i class=\"icon ion-ios-arrow-thin-up\"></i>按接收时间正序", key: "ReceiveTime", direction: "ASC" },
                { text: "<i class=\"icon ion-ios-arrow-thin-down\"></i>按接收时间倒序", key: "ReceiveTime", direction: "DESC" },
                { text: "<i class=\"icon ion-ios-arrow-thin-up\"></i>按发起时间正序", key: "CreatedTime", direction: "ASC" },
                { text: "<i class=\"icon ion-ios-arrow-thin-down\"></i>按发起时间倒序", key: "CreatedTime", direction: "DESC" },
        ];
        for (var i = 0; i < sortButtons.length; i++) {
            if ($scope.sortActionIndex == i) {
                sortButtons[i].text = "<span class=\"sheetActionPanel selectedAction\">" + sortButtons[i].text + "<i class=\"radio-icon selectedActionIcon disable-pointer-events ion-checkmark\"></i></span>";
            }
            else {
                sortButtons[i].text = "<span class=\"sheetActionPanel\">" + sortButtons[i].text + "</span>";
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
                $scope.unfinishedWorkItems = [];
                $scope.lastLoadTime = new Date();
                $scope.lastRefreshTime = new Date();
                //$scope.loadMoreUnfishedWorkItem();
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
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    }
    // 打开消息推送的待办
    if ($scope.jpushWorkItemId) {
        $scope.openWorkItem($scope.jpushWorkItemId);
        $scope.jpushWorkItemId = "";
    }
    $scope.init();
    $scope.loadMoreUnfishedWorkItem();
});