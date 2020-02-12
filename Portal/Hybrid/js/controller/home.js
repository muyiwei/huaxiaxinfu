module.controller('homeCtrl', function ($scope, $ionicTabsDelegate, $state, $ionicGesture,
    $ionicSideMenuDelegate, commonJS) {
    // 向左移动，隐藏左侧菜单
    $scope.totalUnfinishedCount = 0;
    $scope.AppName = config.defaultAppName;
    var element = angular.element(document.querySelector(".view-container"));
    $ionicGesture.on("dragleft", function () {
        $ionicSideMenuDelegate.toggleLeft(false);
    }, element);

    $scope.toggleLeftSideMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.loginOut = function () {
        // 清空本地存储的 MobileToken
        $scope.user.MobileToken = "";
        $scope.isLoginOut = true;
        window.localStorage.setItem("OThinker.H3.Mobile.User", JSON.stringify($scope.user));
        $state.go("login");
    }
    // 切换Tab事件
    $scope.tabSelected = function (e) {
        //Badge
        $scope.GetBadge();
        // 离线检测
        console.log("check online...");
        if (!commonJS.checkOnline()) {
            $scope.clientInfo.isOffline = true;
        }
    }
    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes) {
        $ionicSideMenuDelegate.toggleLeft(false);
    });
});