module.controller('myInstanceTabCtrl', function ($rootScope, $scope, $http, $timeout, $filter, $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, $ionicGesture, commonJS) {
    commonJS.loadingShow();
    $scope.pullingText = "松开刷新";
    $scope.refreshingText = "努力加载中...";
    $scope.tabNames = ['进行中', '已完成', '已取消'];
    $scope.slectIndex = 0;
    $scope.searchKey = "";
    $scope.activeSlide = function (index) {//点击时候触发
        if ($scope.searchKey != "") {
            $scope.clearSearch(function () {
                $scope.slectIndex = index;
                $ionicSlideBoxDelegate.slide(index);
            });
        } else {
            $scope.slectIndex = index;
            $ionicSlideBoxDelegate.slide(index);
        }
    };
    $scope.slideChanged = function (index) {//滑动时候触发
        if ($scope.searchKey != "") {
            $scope.clearSearch(function () {
                $scope.slectIndex = index;
            });
        } else {
            $scope.slectIndex = index;
        }
    };
    $scope.$watch("instances", function (newVal, oldVal) {
        if ($scope.instances)
            $scope.currentTab = $scope.getCurrentTab($scope.slectIndex);
    }, true);
    $scope.$watch("slectIndex", function (newVal, oldVal) {
        // 滚动到顶部
        $ionicScrollDelegate.scrollTop(true);
        if ($scope.instances) {
            $scope.currentTab = $scope.getCurrentTab(newVal);
        }
    });
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("我的流程");
        }
        $scope.activeSlide(0);
        //禁用拖动内容打开侧栏菜单，与我的流程冲突
        $ionicSideMenuDelegate.canDragContent(false);
        $scope.init();
        //加载我的实例
        $scope.loadAllData();
    });
    // 每次离开View时触发
    $scope.$on("$ionicView.afterLeave", function () {
        $ionicSideMenuDelegate.canDragContent(true);
    })
    //初始化
    $scope.init = function () {
        $scope.worksheetUrl = "";
        $scope.exception = false;
        $scope.displayTop = false;
        //我的流程对象
        $scope.instances = {};
        // 是否加载完成
        $scope.totalCount = 0;
    };
    $scope.openInstance = function (instanceId) {
        if (!instanceId) return;
        $scope.worksheetUrl = $scope.setting.instanceSheetUrl + instanceId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.OpenInstanceSheet($scope, $scope.worksheetUrl, instanceId);
    }
    // 搜索
    $scope.doSearch = function (callback) {
        $scope.scrollTop();
        $scope.currentTab.lastReloadTime = new Date().getTime().toString();    // 最后加载时间  
        $scope.loadMore(callback);
    }
    //清空搜索内容
    $scope.clearSearch = function (callback) {
        $scope.searchKey = "";
        $scope.doSearch(callback);
    }
    //加载面板信息
    $scope.loadAllData = function () {
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/LoadAllInstances?callback=JSON_CALLBACK&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/LoadAllInstances";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken
            };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            console.log(result.Extend)
            if (result.Success) {
                $scope.instances = result.Extend;
                commonJS.loadingHide();
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        })
        .error(function (ex) {
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast('scroll.infiniteScrollComplete');
        })
    };
    //获取当前的Tab
    $scope.getCurrentTab = function (tab) {
        switch (tab) {
            case 0:
                return $scope.instances.unfinished;
                break;
            case 1:
                return $scope.instances.finished;
                break;
            case 2:
                return $scope.instances.cancel;
                break;
        }
    }
    //上拉刷新
    $scope.doRefresh = function () {
        $scope.lastRefshTime = new Date();
        var url = "";
        var params = null;
        if (window.cordova) {
            var url = $scope.setting.httpUrl + "/RefreshInstancesByState?callback=JSON_CALLBACK&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&keyWord=" + encodeURI($scope.searchKey);
            url += "&lastTime=" + commonJS.getDateFromJOSN($scope.currentTab.lastRefreshTime).Format("yyyy-MM-dd HH:mm:ss");
            url += "&instanceState=" + $scope.currentTab.InstanceState;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/RefreshInstancesByState";
            params = {
                userId: $scope.user.ObjectID,
                mobileToken: $scope.user.MobileToken,
                keyWord: encodeURI($scope.searchKey),
                lastTime: commonJS.getDateFromJOSN($scope.currentTab.lastRefreshTime).Format("yyyy-MM-dd HH:mm:ss"),
                instanceState: $scope.currentTab.InstanceState
            };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            if (result.Success) {
                //更新对象数据
                $scope.updateInstances(result.Extend, "refresh");
                commonJS.loadingHide();
                $scope.$broadcast('scroll.refreshComplete');
            }
        })
        .error(function (ex) {
            $scope.exception = true;
            commonJS.loadingHide();
            $scope.$broadcast('scroll.infiniteScrollComplete');
        })
    };
    //下拉加载
    $scope.loadMore = function (callback) {
        if ($scope.currentTab) {
            commonJS.loadingShow();
            var url = "";
            var params = null;
            if (window.cordova) {
                url = $scope.setting.httpUrl + "/LoadInstancesByState?callback=JSON_CALLBACK&userId=" + $scope.user.ObjectID;
                url += "&mobileToken=" + $scope.user.MobileToken;
                url += "&keyWord=" + encodeURI($scope.searchKey);
                url += "&lastTime=" + commonJS.getDateFromJOSN($scope.currentTab.lastReloadTime).Format("yyyy-MM-dd HH:mm:ss");
                url += "&instanceState=" + $scope.currentTab.InstanceState;
            }
            else {
                url = $scope.setting.httpUrl + "/Mobile/LoadInstancesByState";;
                params = {
                    userId: $scope.user.ObjectID,
                    mobileToken: $scope.user.MobileToken,
                    keyWord: encodeURI($scope.searchKey),
                    lastTime: commonJS.getDateFromJOSN($scope.currentTab.lastReloadTime).Format("yyyy-MM-dd HH:mm:ss"),
                    instanceState: $scope.currentTab.InstanceState
                };
            }
            commonJS.getHttpData(url, params)
           .success(function (result) {
               if (result.Success) {
                   //更新对象数据
                   $scope.updateInstances(result.Extend, "load");
                   commonJS.loadingHide();
                   $scope.$broadcast('scroll.infiniteScrollComplete');
               }
               if (callback) {
                   callback();
               }
           })
           .error(function (ex) {
               $scope.exception = true;
               commonJS.loadingHide();
               $scope.$broadcast('scroll.infiniteScrollComplete');
           })
        }
    };
    //更新数据,type:load/refresh
    $scope.updateInstances = function (obj, type) {
        switch ($scope.slectIndex) {
            case 0:
                $scope.mergeData($scope.currentTab.list, $scope.instances.unfinished, obj, type);
                break;
            case 1:
                $scope.mergeData($scope.currentTab.list, $scope.instances.finished, obj, type);
                break;
            case 2:
                $scope.mergeData($scope.currentTab.list, $scope.instances.cancel, obj, type);
                break;
        }
    };
    /**
     * 合并数组中的数据,保证不重复
     *  @param {array} list   页面用于显示数据的临时数组
     *  @param {object} obj   每一个tab页对应的实例对象
     *  @param {object} ret   服务器返回的实例数据
     *  @param {string} type  加载方式
     *  @returns void
    **/
    $scope.mergeData = function (list, obj, ret, type) {
        if ($scope.searchKey != "") {
            list = [];
            obj.list = [];
        }
        if (type == "load") {
            obj.moredata = ret.moredata;
            obj.lastReloadTime = ret.lastReloadTime;
            if (ret.list && ret.list.length > 0) {
                for (var i = 0; i < ret.list.length; i++) {
                    if ($scope.existsInstance(list, ret.list[i])) continue;
                    obj.list.push(ret.list[i]);
                }
            }
        } else if (type == "refresh") {
            obj.lastRefreshTime = ret.lastRefreshTime;
            if (ret.list && ret.list.length > 0) {
                for (var i = ret.list.length - 1; i > -1; i--) {
                    if ($scope.existsInstance($scope.currentTab.list, ret.list[i])) continue;
                    obj.list.splice(0, 0, ret.list[i]);
                }
            }
        }
    };
    //判断是否已经包含该对象
    $scope.existsInstance = function (list, obj) {
        if (!list || list.length == 0) return false;
        for (var i = 0; i < list.length; i++) {
            if (list[i].ObjectID == obj.ObjectID) return true;
        }
        return false;
    };
    // 滚动到顶部
    $scope.scrollTop = function () {
        $scope.displayTop = false;
        $ionicScrollDelegate.scrollTop(true);
    };
    $scope.getScrollPosition = function () {
        $scope.displayTop = (event.detail.scrollTop > 60);
        event.stopPropagation();
    };
    //封装的HTTP方法
    $scope.Request = function (url, param) {
        if (param) {
            return $http({ url: url, params: param });
        }
        return $http.jsonp(url);
    }
});