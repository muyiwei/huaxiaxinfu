module.controller('finishedWorkItemCtrl',
function ($rootScope, $scope, $http, $state, $ionicLoading, $ionicScrollDelegate, $ionicModal, $window, $ionicActionSheet, commonJS, focus) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";

    $scope.init = function () {
        $scope.showCancelButton = false; //是否显示取消按钮
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.displayTop = false;
        $scope.userId = $scope.user.ObjectID;
        //搜索条件
        $scope.searchKey = "",
        $scope.worksheetUrl = "";
        $scope.initCompleted = false;
        $scope.exception = false;
        // 待办任务集合
        $scope.finishedWorkItems = [];
        // 是否加载完成
        $scope.loadCompleted = false;
        // 排序方式
        $scope.sortActionIndex = 1;  // 默认是1
        $scope.sortKey = "OT_WorkItemFinished.FinishTime";
        $scope.sortDirection = "Desc";
    };
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("已办任务");
        }

        if ($scope.userId != $scope.user.ObjectID) {
            $scope.init();
            $scope.loadMoreFishedWorkItem();
        }
        else {
            $scope.refreshFinishedWorkItem();
        }
    });
    // 每次离开入View时触发
    $scope.$on("$ionicView.afterLeave", function () {
        $scope.searchKey = "";
        $scope.focus = false;
    })
    // 加载更多
    $scope.loadMoreFishedWorkItem = function () {
        console.log("loadMoreFishedWorkItem");
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
            url += "&finishedWorkItem=" + true;
            url += "&startDate=" ;
            url += "&endDate=";
        } else {
            url = $scope.setting.httpUrl + "/Mobile/GetWorkItems";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss"),
                sortKey: $scope.sortKey,
                sortDirection: $scope.sortDirection,
                finishedWorkItem: true
            };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            if (result.WorkItems && result.WorkItems.length > 0) {
                for (var i = 0; i < result.WorkItems.length; i++) {
                    if ($scope.existsWorkItem(result.WorkItems[i])) continue;
                    $scope.finishedWorkItems.push(result.WorkItems[i]);
                }
            }
            $scope.initCompleted = true;
            $scope.exception = false;
            $scope.lastLoadTime = commonJS.getDateFromJOSN(result.LastTime);
            $scope.loadCompleted = result.LoadComplete;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        })
        .error(function (ex) {
            console.log("加载已办出现异常");
            $scope.initCompleted = true;
            $scope.loadCompleted = true;
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        })
    };
    // 刷新待办
    $scope.refreshFinishedWorkItem = function () {
        if (!$scope.initCompleted) {
            commonJS.loadingHide();
            return;
        }
        console.log("refresh refreshFinishedWorkItem");
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetRefreshWorkItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + $scope.searchKey;
            url += "&lastTime=" + $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&finishedWorkItem=" + true;
            url += "&existsLength=" + $scope.finishedWorkItems.length;
            url += "&startDate=";
            url += "&endDate=" ;
        } else {
            url = $scope.setting.httpUrl + "/Mobile/GetRefreshWorkItems";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: $scope.searchKey,
                lastTime: $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss"),
                finishedWorkItem: true,
                existsLength: $scope.finishedWorkItems.length
            };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            var resultValue = result;
            if (resultValue.WorkItems && resultValue.WorkItems.length > 0) {
                for (var i = resultValue.WorkItems.length - 1; i > -1; i--) {
                    if ($scope.existsWorkItem(resultValue.WorkItems[i])) continue;
                    $scope.finishedWorkItems.splice(0, 0, resultValue.WorkItems[i]);
                }
            }
            $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            if ($scope.exception) {
                $scope.loadCompleted = false;
            }
            $scope.exception = false;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
        })
        .error(function (ex) {
            $scope.exception = true;
            $scope.loadCompleted = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
        })
    };
    $scope.existsWorkItem = function (workItem) {
        if (!$scope.finishedWorkItems || $scope.finishedWorkItems.length == 0) return false;
        for (var i = 0; i < $scope.finishedWorkItems.length; i++) {
            if ($scope.finishedWorkItems[i].ObjectID == workItem.ObjectID) return true;
        }
        return false;
    };
    // 搜索
    $scope.doSearch = function () {
        $scope.scrollTop();
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.finishedWorkItems = [];
        $scope.loadMoreFishedWorkItem();
    }
    //清空搜索内容
    $scope.clearSearch = function () {
        $scope.searchKey = "";
        $scope.doSearch();
    }
    // 排序操作
    $scope.showActionsheet = function () {
        var sortButtons = [
          { text: "<i class=\"icon ion-ios-arrow-up\"></i>按完成时间正序", key: "OT_WORKITEM.FinishTime", direction: "ASC" },
          { text: "<i class=\"icon ion-ios-arrow-down\"></i>按完成时间倒序", key: "OT_WORKITEM.FinishTime", direction: "DESC" },
          { text: "<i class=\"icon ion-ios-arrow-up\"></i>按发起时间正序", key: "CreatedTime", direction: "ASC" },
          { text: "<i class=\"icon ion-ios-arrow-down\"></i>按发起时间倒序", key: "CreatedTime", direction: "DESC" },
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
        this.$parent.displayTop = false;
        $ionicScrollDelegate.scrollTop(true);
    };

    $scope.getScrollPosition = function () {
        // console.log(event.detail.scrollTop);
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    }

    // 打开待办
    $scope.openWorkItem = function (workItemId) {
        if (!workItemId) return;
        $scope.worksheetUrl = $scope.setting.workItemUrl + workItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.GetWorkItemSheetUrl($scope, $scope.worksheetUrl, workItemId);
    }

    // 关闭表单
    $scope.closeWorkItem = function () {
        $scope.modalForm.hide();
    }

    $scope.back = function () {
        $state.go("home.index");
    }

    //点击搜索
    $scope.goToSearch = function () {
        $scope.modal.show();
    }
    //初始化搜索Modal
    $ionicModal.fromTemplateUrl('Search.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function (modal) {
        $scope.modal = modal;
    });
    // Cleanup when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });

    $scope.init();
    $scope.loadMoreFishedWorkItem();
});
