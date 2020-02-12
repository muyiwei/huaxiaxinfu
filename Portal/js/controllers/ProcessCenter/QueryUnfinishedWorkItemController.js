//进行中的任务
app.controller('QueryUnfinishedWorkItemController', ['$scope', "$translate", "$http", "$state", "$filter", "ControllerConfig", "datecalculation",
    function ($scope, $translate, $http, $state, $filter, ControllerConfig, datecalculation) {
        //进入视图触发
        $scope.$on('$viewContentLoaded', function (event) {
            $scope.setFunctionCode("Workspace_MyWorkflow");
        });

        $scope.name = $translate.instant("WorkItemController.QueryUnfinishedWorkItem");
        $scope.StartTime = datecalculation.redDays(new Date(), 30);
        $scope.EndTime = datecalculation.addDays(new Date(), 30);
        $scope.State = 100;
        $scope.dtOptions_tabQueryParticipantWorkItem = {
            "bProcessing": true,
            "bServerSide": true,    // 是否读取服务器分页
            "paging": true,         // 是否启用分页
            "bPaginate": true,      // 分页按钮  
            "bLengthChange": false, // 每页显示多少数据
            "bFilter": true,        // 是否显示搜索栏  
            "searchDelay": 1000,    // 延迟搜索
            "iDisplayLength": 10,   // 每页显示行数  
            "bSort": false,         // 排序  
            "singleSelect": true,
            "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息  
            "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
            "language": {           // 语言设置
                "sLengthMenu": "每页显示 _MENU_ 条记录",
                "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i> 没有找到任务",
                "sInfo": "当前从第 _START_ 到第 _END_ 项，总共有 _TOTAL_ 项",
                "infoEmpty": "",
                "sProcessing": "正在努力加载...",
                "search": "搜索：",
                "paginate": {
                    "first": "<<",
                    "last": ">>",
                    "previous": "<",
                    "next": ">"
                }
            },
            "sAjaxSource": ControllerConfig.WorkItem.QueryUnfinishedWorkItem,
            "sAjaxDataProp": 'Rows',
            "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
            "sPaginationType": "full_numbers",
            "fnServerParams": function (aoData) {  // 增加自定义查询条件
                console.log("get search key...");
                
                aoData.push(
                    { "name": "instanceName", "value": $scope.InstanceName },
                    { "name": "workflowCode", "value": $scope.workflowCode },
                    { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                    { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                    { "name": "users", "value": "18f923a7-5a5e-426d-94ae-a55ad1a4b239" }
                    );
            },
            "aoColumns":  // 字段定义
            [
                {
                    "mData": "InstanceName"
                },
                {
                    "mData": "DisplayName",
                    "mRender": function (data, type, full) {
                        return "<a href=\"javascript:;\">" + data + "</a>";
                    }
                },
                { "mData": "ReceiveTime", "sClass": "center" },
                { "mData": "OriginatorName" },
                { "mData": "OriginatorOUName" }
            ],
            // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
            "initComplete": function (settings, json) {
                var filter = $(".dataTables_filter");
                filter.html("").css("text-align", "right");
                $(".searchContainer_queryParticipantWorkItem").appendTo(filter).show();
                filter.parent().attr("class", "col-sm-12");
                filter.find("button").unbind("click.DT").bind("click.DT", function () {
                    console.log("start search...");
                    $("#tabQueryParticipantWorkItem").dataTable().fnDraw();
                });
            }
        }
    }]);