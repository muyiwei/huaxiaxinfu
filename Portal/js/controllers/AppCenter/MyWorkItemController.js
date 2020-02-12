/*
    应用中心——任务列表
*/
app.controller('MyWorkItemController', ['$rootScope', '$scope', "$translate", "$http", "$state", "$filter", "$compile",
    "$stateParams", "jq.datables", "ControllerConfig",
function ($rootScope, $scope, $translate, $http, $state, $filter, $compile, $stateParams, jqdatables, ControllerConfig) {
    $scope.WorkflowCode = $stateParams.SchemaCode;
    $scope.State = $stateParams.State;
    $scope.FunctionCode = $stateParams.FunctionCode;

    //进入视图触发
    $scope.$on('$viewContentLoaded', function (event) {
    });

    // 获取语言
    $rootScope.$on('$translateChangeEnd', function () {
        $scope.getLanguage();
        $state.go($state.$current.self.name, {}, { reload: true });
    });
    $scope.getLanguage = function () {
        $scope.LanJson = {
            search: $translate.instant("uidataTable.search"),
            ProcessName: $translate.instant("QueryTableColumn.ProcessName"),
            WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
            StartTime: $translate.instant("QueryTableColumn.StartTime"),
            EndTime: $translate.instant("QueryTableColumn.EndTime"),
            sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
            sZeroRecords: $translate.instant("uidataTable.sZeroRecords"),
            sInfo: $translate.instant("uidataTable.sInfo"),
            sProcessing: $translate.instant("uidataTable.sProcessing")
        }
    }
    $scope.getLanguage();
    //初始化流程模板
    $scope.WorkflowOptions = {
        Editable: true,
        Mode: "WorkflowTemplate",
        Visiable: true,
        IsMultiple: false,
        PlaceHolder: $scope.LanJson.WorkFlow
    }

    $scope.getColumns = function () {
        var columns = [];
        columns.push({
            "mData": "InstanceName",
            "mRender": function (data, type, full) {
                //打开待办表单
                return "<a ui-toggle-class='show' target='.app-aside-right' targeturl='WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a>";
            }
        });
        columns.push({
            "mData": "DisplayName",
            "mRender": function (data, type, full) {
                ////打开流程状态
                //return "<a ui-sref='app.InstanceDetail({InstanceID:\"" + full.InstanceId + "\"})'><span>" + data + "</span></a>";

                //打开流程状态
                return "<td><a ui-toggle-class='show' target='.app-aside-right' targeturl='index.html#/InstanceDetail/" + full.InstanceId + "/" + full.ObjectID + "/" + "/'>" + data + "</a></td>";
            }
        });
        if (window.screen.width > 1024) {
            columns.push({ "mData": "ReceiveTime", "sClass": "center" });
        }
        if (window.screen.width > 414) {
            columns.push({ "mData": "FinishTime", "sClass": "center" });
            columns.push({
                "mData": "OriginatorName",
                "mRender": function (data, type, full) {
                    return "<a ng-click=\"showUserInfoModal('" + full.Originator + "');\" new-Bindcompiledhtml>" + data + "</a>";
                }
            });
        }
        if (window.screen.width > 1024) {
            columns.push({ "mData": "OriginatorOUName" });
        }
        return columns;
    }

    // TODO:下面的需要获取语言
    $scope.options = {
        "bProcessing": true,
        "bServerSide": true,    // 是否读取服务器分页
        "paging": true,         // 是否启用分页
        "bPaginate": true,      // 分页按钮  
        "bLengthChange": false, // 每页显示多少数据
        "bFilter": false,        // 是否显示搜索栏  
        "searchDelay": 1000,    // 延迟搜索
        "iDisplayLength": 10,   // 每页显示行数  
        "bSort": false,         // 排序  
        "singleSelect": true,
        "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息  
        "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
        "language": {           // 语言设置
            "sLengthMenu": $scope.LanJson.sLengthMenu,
            "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i>" + $scope.LanJson.sZeroRecords,
            "sInfo": $scope.LanJson.sInfo,
            "infoEmpty": "",
            "sProcessing": $scope.LanJson.sProcessing,
            "paginate": {
                "first": "<<",
                "last": ">>",
                "previous": "<",
                "next": ">"
            }
        },
        "sAjaxSource": ControllerConfig.WorkItem.GetMyWorkItem,
        "sAjaxDataProp": 'Rows',
        "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
        "sPaginationType": "full_numbers",
        "fnServerParams": function (aoData) {  // 增加自定义查询条件
            aoData.push(
                { "name": "FunctionCode", "value": $stateParams.FunctionCode },
                { "name": "State", "value": 100 },
                { "name": "StartTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                { "name": "EndTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                { "name": "WorkflowCode", "value": $scope.WorkflowCode }
                );
        },
        "aoColumns": $scope.getColumns(), // 字段定义
        // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
        "initComplete": function (settings, json) {
            var filter = $(".searchContainer");
            filter.find("button").unbind("click.DT").bind("click.DT", function () {
                $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                $("#tabWorkItem").dataTable().fnDraw();
            });
        },
        //创建行，未绘画到屏幕上时调用
        "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
            $compile(nRow)($scope);
        },
        "fnDrawCallback": function () {
            jqdatables.trcss();
        }
    }
}]);