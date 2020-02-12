module.controller('dateRangeSelectCtl', function ($scope, $sce) {
    // 搜索
    $scope.doSearchDate = function () {

        $scope.$parent.datemodal.hide();
        $scope.$parent.dateselectmodal.hide();
        $scope.$parent.doSearch();
    }

    //返回
    $scope.back = function ()
    {
        $scope.$parent.dateselectmodal.hide();
    }

});