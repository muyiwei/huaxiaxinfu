module.controller('worksheetCtrl', function ($rootScope, $scope, $sce) {
    
    if ($rootScope.dingMobile.isDingMobile) {
        $scope.workItemUrl = $rootScope.worksheetUrl;
    } else {
        $scope.workItemUrl = $sce.trustAsResourceUrl($scope.$parent.worksheetUrl);
    }
});