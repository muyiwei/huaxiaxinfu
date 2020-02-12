//------流程相关数据----------
app.controller('workflowController', ['$scope', '$http', '$state', '$stateParams', function ($scope, $http, $state, $stateParams) {
    //获取待办信息
    debugger;
    $scope.GetUnfinishWorkItems = function () {
        $http({
            //url: "PortalWorkflow/GetWorkflowInfo?type=" + $stateParams.type + "&pageIndex=" + $stateParams.pageIndex + "&pageSize=13"
            method: 'POST',
            url: "WorkItem/GetUnfinishWorkItems",
            data: { "PageIndex": 1, "PageSize": 10 }
        }).success(function (result) {
            $scope.UnfinishWorkItems = result.Rows;
            $scope.UWM = result.Rows.length > 0 ? "ng-hide" : "";
        });
    }
    $scope.GetUnfinishWorkItems();

    //获取待阅
    $scope.GetUnReadWorkItems = function () {
        $http({
            //url: "PortalWorkflow/GetWorkflowInfo?type=" + $stateParams.type + "&pageIndex=" + $stateParams.pageIndex + "&pageSize=13"
            method: 'POST',
            url: "CirculateItem/GetUnReadWorkItems",
            data: { "PageIndex": 1, "PageSize": 10 }
        }).success(function (result) {
            $scope.UnReadWorkItems = result.Rows;
            $scope.URM = result.Rows.length > 0 ? "ng-hide" : "";
        });
    }
    $scope.GetUnReadWorkItems();

    //获取我的流程
    $scope.QueryMyInstance = function () {
        $http({
            //url: "PortalWorkflow/GetWorkflowInfo?type=" + $stateParams.type + "&pageIndex=" + $stateParams.pageIndex + "&pageSize=13"
            method: 'POST',
            url: "Instance/QueryMyInstance",
            data: { "PageIndex": 1, "PageSize": 10, "state": 100 }
        }).success(function (result) { 
            var data = result.Rows;
            for (var i = 0; i < data.length; i++) {
                switch (data[i].InstanceState) {
                    case "4":
                        data[i].stateName = "已完成";
                        break;
                    case "5":
                        data[i].stateName = "已取消";
                        break;
                    default:
                        data[i].stateName = "进行中";
                }
            }
            $scope.MyInstance = data;
        });
    }
    $scope.QueryMyInstance();

    //获取已办任务
    $scope.GetFinishWorkItems = function () {
        $http({
            //url: "PortalWorkflow/GetWorkflowInfo?type=" + $stateParams.type + "&pageIndex=" + $stateParams.pageIndex + "&pageSize=13"
            method: 'POST',
            url: "WorkItem/GetFinishWorkItems",
            data: { "PageIndex": 1, "PageSize": 10 }
        }).success(function (result) {
            $scope.FinishWorkItems = result.Rows;
        });
    }
    $scope.GetFinishWorkItems(); 
    
    var $flow_li = $('#flow ul li');
    $flow_li.hover(function () {
        $(this).addClass('selected').siblings().removeClass('selected');
        var index = $flow_li.index(this);
        $('div.flow_box > div').eq(index).show().siblings().hide();
        $("#workflow_more").attr("href", $(this).attr("flag"));
    });


}]);

//------流程相关数据：END----------