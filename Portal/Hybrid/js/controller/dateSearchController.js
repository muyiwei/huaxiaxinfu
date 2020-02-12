module.controller('dateSearchCtrl', function ($scope, $sce, focus, commonJS) {
    $scope.showCancelButton = false; //是否显示取消按钮
    //聚焦
    focus("searchinput");

    //显示隐藏取消按钮
    $scope.showCancelBtn = function () {
        $scope.showCancelButton = true;
    }
    $scope.hideCancelBtn = function () {
        $scope.showCancelButton = false;
        $scope.$parent.datemodal.hide();
    }

    //取消按钮事件
    $scope.cancelSearch = function () {
        $scope.search.searchKey = "";
        $scope.showCancelButton = false;
        $scope.$parent.datemodal.hide();

        return false;
    }

    // 搜索
    $scope.doSearchDate = function () {
        //
        $scope.$parent.doSearch();
        $scope.$parent.datemodal.hide();
    }

    //打开日期选择框
    $scope.openDateSelect = function ()
    {
       $scope.$parent.openDateSelectModal();
    }

    //返回
    $scope.back = function () {
        $scope.$parent.datemodal.hide();
    }

});