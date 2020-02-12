app.controller('ShowReportControler', ['$scope', "$rootScope", "$translate", "$timeout","$compile",
    "$http", "$state", "$stateParams",
    "$filter", "ControllerConfig",
function ($scope, $rootScope, $translate, $timeout, $compile, $http, $state, $stateParams, $filter, ControllerConfig) {
    $scope.$on('$viewContentLoaded', function (event) {
        $scope.init();
    });
    $scope.init = function () {
        
        $scope.UnfinishedText = $translate.instant("InstanceController.Unfinished");
        $scope.FinishedText = $translate.instant("InstanceController.Finished");
        $scope.CanceledText = $translate.instant("InstanceController.Canceled");
        $scope.UnspecifiedText = $translate.instant("InstanceController.Unspecified");
        if ($scope.user) {
            $scope.Originator = $scope.user.ObjectID;
        }
        
       
    }
    $scope.getLanguage = function () {
        $scope.LanJson = {
            search: $translate.instant("uidataTable.search"),
            ProcessName: $translate.instant("QueryTableColumn.ProcessName"),
            WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
            Originator: $translate.instant("QueryTableColumn.Originator"),
            StartTime: $translate.instant("QueryTableColumn.StartTime"),
            EndTime: $translate.instant("QueryTableColumn.EndTime"),
            sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
            sZeroRecords: $translate.instant("uidataTable.sZeroRecords_NoRecords"),
            sInfo: $translate.instant("uidataTable.sInfo"),
            sProcessing: $translate.instant("uidataTable.sProcessing"),
            UnfinishedText: $translate.instant("InstanceState.Unfinished"),
            FinishedText: $translate.instant("InstanceState.Finished"),
            CanceledText: $translate.instant("InstanceState.Canceled"),
            UnspecifiedText: $translate.instant("InstanceState.Unspecified"),

            //权限
            QueryInstanceByProperty_NotEnoughAuth1: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth1"),
            QueryInstanceByProperty_NotEnoughAuth2: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth2"),
            QueryInstanceByProperty_NotEnoughAuth3: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth3"),
        }
    }
    $scope.getLanguage();


    // 获取语言
    $rootScope.$on('$translateChangeEnd', function () {
        $scope.getLanguage();
        $state.go($state.$current.self.name, {}, { reload: true });
    });
    //用户控件
    $scope.UserOptions = {
      
        Editable: true, Visiable: true, OrgUnitVisible: true, V: $scope.Originator, IsMultiple: true, PlaceHolder: $scope.LanJson.Originator
    }
    //V: $scope.user.ObjectID
    //流程模板控件
    $scope.WorkflowOptions = {
        Editable: true, Visiable: true, Mode: "WorkflowTemplate", IsMultiple: true, PlaceHolder: $scope.LanJson.WorkFlow
    }
    $scope.options = function () {
        var ionic ={
            $scope: $scope,
            $compile: $compile
            }
        var option = {
            SourceCode: $stateParams.ReportCode,
            PortalRoot: window.localStorage.getItem("H3.PortalRoot"),
            TableShowObj: $("#ReportView"),
            dParamShowObj: $("#ParamContent"),
            ReportFiters: $("#ReportFiters"),
            ReportPage: $("#ReportPage"),
            Ionic: ionic
           
        }
        return option;
    }

    // 查询
    $scope.Search = function () {
        ReportViewManager.Reload();
    }

    // 导出
    $scope.ExportReport = function () {
        ReportViewManager.ExportReport();
    }

}]);