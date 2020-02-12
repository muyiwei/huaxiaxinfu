module.controller('settingCtrl', function ($scope, $ionicPlatform, $state, $ionicSideMenuDelegate, commonJS) {
    $scope.languages = [
        { text: "中文", value: "chinaese" },
        { text: "English", value: "english" }
    ];
    $scope.allowModifyService = config.defaultAllowModifyService;
    $scope.save = function () {
        $scope.getWorkItemUrl();
        $scope.setLocalStorage();
        $state.go("login");
    };
    $scope.goback = function () {
        $state.go("login");
    };
    $scope.checkService = function () {
        if (!$scope.setting.httpUrl) {
            commonJS.alert("请输入服务地址");
        }
        window.open($scope.setting.httpUrl, "_system");
    }
});