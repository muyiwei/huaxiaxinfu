module.controller('inputGroupCtrl', function ($scope,$rootScope) {

    $scope.init = function () {
       //显示控制器
        $scope.$on('$ionicView.enter',function(){
            $rootScope.hideTabs=false;
        });
        $scope.show=false;//控制标题栏是否显示
        $scope.transrate=0;//控制标题栏透明度
    };

    $scope.init();
});
