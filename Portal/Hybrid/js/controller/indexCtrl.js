module.controller('indexController', function ($rootScope, $scope, $state, $http, $stateParams,
     $ionicSlideBoxDelegate, $timeout, commonJS) {
    commonJS.loadingShow();
    $scope.init = function () {
        //加载轮播图
        //加载九宫格
        $scope.activeIndex = 1;
        $scope.SlideShowDisplay = false;//是否显示轮播图
        $scope.SlideShows = [];
        $scope.AppFunctionNodes = [];

        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetHybridApp?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&appCode=";
        } else {
            url = $scope.setting.httpUrl + "/HybridApp/GetHybridApp";
            params = { appCode: "" };
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            if (!angular.isDefined(result.Success)) {
                $timeout(function () {
                    $scope.init();
                }, 1000 * 0.5);
                return;
            }

            commonJS.loadingHide();
            if (result.Message == "登录超时！") {
                $state.go("login");
            }
            if (result.Success && result.Extend) {
                $scope.url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0];
                $scope.SlideShows = result.Extend.SlideShows;
                $scope.AppFunctionNodes = result.Extend.AppFunctionNodes;
                $scope.SlideShowDisplay = result.Extend.SlideShowDisplay;
            }
        })
        .error(function (ex) {
            commonJS.loadingHide();
        })
    }
    
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        //设置钉钉Header
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("首页");
        }
        if ($rootScope.dingMobile.isDingMobile && dd) {
            dd.biz.navigation.setRight({
                show: false//控制按钮显示， true 显示， false 隐藏， 默认true
            });
        }

        //打开表单页面
        if ($scope.jpushWorkItemId != "") {
            $scope.worksheetUrl = $scope.setting.workItemUrl + $scope.jpushWorkItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
            commonJS.GetWorkItemSheetUrl($scope, $scope.worksheetUrl, $scope.jpushWorkItemId);
            $scope.jpushWorkItemId = "";
        }
    });
    // 打开待办
    $scope.openWorkItem = function (workItemId) {
        if (!workItemId) return;
        $scope.worksheetUrl = $scope.setting.workItemUrl + workItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.openWorkItem($scope, $scope.worksheetUrl, workItemId);
    }

    //滑动图片的点击事件
    $scope.coverFlowClick = function () {
        var index = $ionicSlideBoxDelegate.currentIndex();
        console.log("coverFlowClick index = ", index);
    }
    //此事件对应的是pager-click属性，当显示图片是有对应数量的小圆点，这是小圆点的点击事件
    $scope.pageClick = function (index) {
        console.log("pageClick index = ", index);
        $scope.activeIndex = index;
    };

    //当图片切换后，触发此事件，注意参数
    $scope.slideHasChanged = function ($index) {
        console.log("slideHasChanged index = ", $index);
    };

    //这是属性delegate-handle的验证使用的，其实没必要重定义，直接使用$ionicSlideBoxDelegate就可以
    $scope.delegateHandle = $ionicSlideBoxDelegate;
    $scope.init();
    $rootScope.$on("LoginIn", function () {
        $scope.init();
    });
});
