module.controller('mulSheetsCtrl', function ($rootScope, $scope, commonJS) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $scope.mulSheets = $rootScope.mulSheets;
        commonJS.loadingHide();
    });

    $scope.openInstanceSheet = function (url) {
        if (!url) return;
        $scope.worksheetUrl = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + url;
        commonJS.openWorkItem($scope, $scope.worksheetUrl);
    }
});
