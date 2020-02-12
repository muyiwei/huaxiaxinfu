module.controller('unreadworkitemCtrl', function ($rootScope, $scope, $http, $ionicPopup, $ionicModal, $ionicActionSheet, $ionicScrollDelegate, $ionicTabsDelegate, commonJS, focus) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";

    $scope.init = function () {
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间
        $scope.worksheetUrl = "";
        $scope.initCompleted = false;
        $scope.exception = false;
        $scope.searchKey = "";
        // 待办任务集合
        $scope.circulateItems = [];
        // 是否加载完成
        $scope.loadCompleted = false;
        $scope.totalCount = 0;
        // 排序方式
        $scope.sortActionIndex = 1;  // 默认是1
        $scope.sortKey = "ReceiveTime";
        $scope.sortDirection = "Desc";
        $scope.userId = $scope.user.ObjectID;
        $scope.selectItemMode = false;
        $scope.selectItems = [];
    }
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("待阅任务");
            //设置header 右边按钮
            $scope.SetDingMenu();
        }
        if ($scope.userId != $scope.user.ObjectID) {
            $scope.init();
            $scope.loadMoreUnreadWorkItem();
        } else {
            $scope.RefreshCirculateItem();
        }
    });
    // 每次离开入View时触发
    $scope.$on("$ionicView.afterLeave", function () {
        $scope.searchKey = "";
        $scope.focus = false;
        $scope.goToUnread();
        if ($rootScope.dingMobile.isDingMobile && dd) {
            dd.biz.navigation.setRight({
                show: false
            })
        }

    })
    // 刷新待阅
    $scope.RefreshCirculateItem = function () {
        console.log("refreshUnreadWorkItem");
        if (!$scope.initCompleted) {
            commonJS.loadingHide();
            return;
        }
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/RefreshCirculateItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&userCode=" + $scope.user.Code;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + encodeURIComponent($scope.searchKey);
            url += "&lastTime=" + $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&existsLength=" + $scope.circulateItems.length;
            url += "&readWorkItem=false";
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/RefreshCirculateItems";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                keyWord: encodeURIComponent($scope.searchKey),
                lastTime: $scope.lastRefreshTime.Format("yyyy-MM-dd HH:mm:ss"),
                existsLength: $scope.circulateItems.length,
                readWorkItem: false
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            var resultValue = result;
            // 检查是否存在已经办完的任务
            for (var i = 0; i < $scope.circulateItems.length; i++) {
                if (resultValue.ExistsIds.indexOf($scope.circulateItems[i].ObjectID) == -1) {
                    $scope.setBadge($scope.totalCount - 1);
                    $scope.circulateItems.splice(i, 1);
                    i--;
                }
            }

            if (resultValue.CirculateItems && resultValue.CirculateItems.length > 0) {
                for (var i = resultValue.CirculateItems.length - 1; i > -1; i--) {
                    if ($scope.existsCirculateItem(resultValue.CirculateItems[i])) continue;
                    $scope.circulateItems.splice(0, 0, resultValue.CirculateItems[i]);
                }
            }
            if ($scope.circulateItems.length < 10
            && resultValue.ExistsIds.length > 0
            && $scope.circulateItems.length < resultValue.ExistsIds.length) {// 重新加载一次
                $scope.loadMoreUnreadWorkItem();
            }

            $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            $scope.setBadge(resultValue.TotalCount);
            $scope.$broadcast("scroll.refreshComplete");
            commonJS.loadingHide();
            if ($scope.exception) {
                $scope.loadCompleted = false;
            }
            $scope.exception = false;

            //执行已阅后判断是否还有待阅任务，没有退出selectItemMode模式
            if ($scope.circulateItems.length == 0) {
                $scope.goToUnread();
            }
            else if ($scope.allRead) {
                angular.forEach($scope.circulateItems, function (item, index, full) {
                    $scope.circulateItems[index].checked = true;
                });
            }
            if ($scope.circulateItems.length > 0) {
                $scope.SetDingMenu();
            }
        })
        .error(function (ex) {
            $scope.loadCompleted = true;
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.refreshComplete");
        });
    };
    // 加载更多
    $scope.loadMoreUnreadWorkItem = function () {
        console.log("loadMoreUnreadWorkItem");
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/LoadCirculateItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + encodeURI($scope.searchKey);
            url += "&lastTime=" + $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss");
            url += "&sortKey=" + encodeURI($scope.sortKey);
            url += "&sortDirection=" + encodeURI($scope.sortDirection);
            url += "&readWorkItem=false";
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/LoadCirculateItems";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                keyWord: encodeURIComponent($scope.searchKey),
                sortKey: encodeURIComponent($scope.sortKey),
                sortDirection: encodeURI($scope.sortDirection),
                lastTime: $scope.lastLoadTime.Format("yyyy-MM-dd HH:mm:ss"),
                readWorkItem: false
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            var resultValue = result;
            if ($scope.circulateItems.length == 0) {
                // 设置刷新时间
                $scope.lastRefreshTime = commonJS.getDateFromJOSN(resultValue.RefreshTime);
            }

            if (resultValue.CirculateItems && resultValue.CirculateItems.length > 0) {
                for (var i = 0; i < resultValue.CirculateItems.length; i++) {
                    if ($scope.existsCirculateItem(resultValue.CirculateItems[i])) continue;
                    $scope.circulateItems.push(resultValue.CirculateItems[i]);
                }
            }
            $scope.initCompleted = true;
            $scope.lastLoadTime = commonJS.getDateFromJOSN(resultValue.LastTime);
            $scope.loadCompleted = resultValue.LoadComplete;
            $scope.setBadge(resultValue.TotalCount);
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.exception = false;
            $scope.SetDingMenu();
        })
        .error(function () {
            console.log("加载待办出现异常");
            $scope.initCompleted = true;
            $scope.exception = true;
            $scope.loadCompleted = true;
            commonJS.loadingHide();
            $scope.$broadcast("scroll.infiniteScrollComplete");
        });
    };
    // 打开待阅
    $scope.openCirculateItem = function (CirculateItemId) {
        if (!CirculateItemId) return;
        if ($scope.selectItemMode == true) {
            angular.forEach($scope.circulateItems, function (data, index, full) {
                if (data.ObjectID == CirculateItemId) {
                    data.checked = !data.checked;
                    $scope.itemChangeed(CirculateItemId);
                }
            });
            return;
        }

        $scope.worksheetUrl = $scope.setting.workItemUrl + CirculateItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken + "&IsApp=true";
        commonJS.GetWorkItemSheetUrl($scope, $scope.worksheetUrl, CirculateItemId);
    }
    //判断待阅是否已阅
    $scope.existsCirculateItem = function (circulateItem) {
        if (!$scope.circulateItems || $scope.circulateItems.length == 0) return false;
        for (var i = 0; i < $scope.circulateItems.length; i++) {
            if ($scope.circulateItems[i].ObjectID == circulateItem.ObjectID) return true;
        }
        return false;
    };
    //设置Badge
    $scope.setBadge = function (totalCount) {
        if (totalCount > 0) {
            $rootScope.badge.unreadworkitem = totalCount > 99 ? "99+" : totalCount;
        }
        else if ($scope.circulateItems.length == 0) {
            $rootScope.badge.unreadworkitem = 0;
        }
    };
    //进入选择状态
    $scope.goToRead = function () {
        $scope.selectItems = [];
        $scope.allRead = false;
        $scope.selectItemMode = true;
        $scope.SetDingMenu();
    }
    //退出选择状态
    $scope.goToUnread = function () {
        $scope.selectItems = [];
        $scope.allRead = false;
        $scope.selectItemMode = false;
        $scope.SetDingMenu();
    }

    $scope.SetDingMenu = function () {
        var text = $scope.selectItemMode ? "取消标记" : "标记已阅";
        if ($scope.circulateItems.length == 0) { } else {
            if ($rootScope.dingMobile.isDingMobile && dd) {
                //设置header 右边按钮
                dd.biz.navigation.setMenu({
                    items: [{ "id": "1", text: text }],
                    onSuccess: function () {
                        if ($scope.selectItemMode) {
                            $scope.$apply(function () {
                                $scope.goToUnread();
                            })
                        } else {
                            $scope.$apply(function () {
                                $scope.goToRead();
                            })
                        }
                    }
                });
            }
        }

        if ($rootScope.dingMobile.isDingMobile && dd && $rootScope.badge.unreadworkitem == 0) {
            dd.biz.navigation.setRight({
                show: false
            })
        }

    }
    //全选事件
    $scope.$watch('allRead', function (newVal, oldVal) {
        var checked = false;
        if (newVal == true) {
            checked = true;
        }
        angular.forEach($scope.circulateItems, function (item, index, full) {
            $scope.circulateItems[index].checked = checked;
        });
    })
    //搜索
    $scope.doSearch = function () {
        $scope.scrollTop();
        $scope.lastRefreshTime = new Date();   // 最后刷新时间
        $scope.lastLoadTime = new Date();      // 最后加载时间\
        $scope.circulateItems = [];
        $scope.loadMoreUnreadWorkItem();
    }
    //清除搜索内容
    $scope.clearSearch = function () {
        $scope.searchKey = "";
        $scope.doSearch();
    }
    //选中、取消选中 $event,
    $scope.itemChangeed = function (itemid) {
        //$event.stopPropagation();
        var isSelected = true;
        var sourceselectItems = $scope.selectItems;
        angular.forEach($scope.selectItems, function (id, index, full) {
            if (id == itemid) {
                //取消选中
                isSelected = false;
                sourceselectItems.splice(index, 1);
            }
        })
        if (isSelected) {
            sourceselectItems.push(itemid)
        }
        $scope.selectItems = sourceselectItems;
    }
    //执行已阅
    $scope.readItem = function () {
        if ($scope.allRead) {
            //确认提示
            confirm("是否全部已阅？", $scope.httpreadItems);
        } else {
            $scope.httpreadItems();
        }
    }
    //执行批量已阅
    $scope.httpreadItems = function () {
        var selectItems = "";
        var url = "";
        var params = null;

        $scope.allRead = $scope.allRead ? true : false;
        if ($scope.selectItems.length == 0 && !$scope.allRead) {
            alert("请选择待阅任务");
            return;
        }
        angular.forEach($scope.selectItems, function (data, index, full) {
            selectItems = data + ";" + selectItems;
        })
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/ReadCirculateItems?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&CirculateItemIDs=" + encodeURI(selectItems);
            url += "&ReadAll=" + $scope.allRead;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/ReadCirculateItems";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                CirculateItemIDs: encodeURI(selectItems),
                ReadAll: $scope.allRead
            }
        }
        commonJS.getHttpData(url, params)
       .success(function (data) {
           $scope.selectItems = [];
           $scope.RefreshCirculateItem();
       })
       .error(function (data) {
           $scope.RefreshCirculateItem();
       })
    }
    //执行单个已阅
    $scope.httpreadItem = function (circulateID, index) {
        $scope.circulateItems.splice(index, 1);
        $scope.selectItems = [];
        $scope.selectItems.push(circulateID);
        $scope.httpreadItems(false);
    }
    // 滚动到顶部
    $scope.scrollTop = function () {
        $scope.displayTop = false;
        $ionicScrollDelegate.scrollTop(true);
    };
    $scope.getScrollPosition = function () {
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    };
    $scope.init();
    $scope.loadMoreUnreadWorkItem();
});