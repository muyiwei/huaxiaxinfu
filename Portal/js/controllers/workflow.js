//------�����������----------
app.controller('workflowController', ['$scope', '$http', '$state', '$stateParams', function ($scope, $http, $state, $stateParams) {
    //��ȡ������Ϣ
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

    //��ȡ����
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

    //��ȡ�ҵ�����
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
                        data[i].stateName = "�����";
                        break;
                    case "5":
                        data[i].stateName = "��ȡ��";
                        break;
                    default:
                        data[i].stateName = "������";
                }
            }
            $scope.MyInstance = data;
        });
    }
    $scope.QueryMyInstance();

    //��ȡ�Ѱ�����
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

//------����������ݣ�END----------