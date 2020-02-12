//异常的流程
app.controller('QueryExceptionalInstanceController', ['$scope', "$translate", "$http", "$state", "$filter", "ControllerConfig", "datecalculation", "jq.datables",
    function ($scope, $translate, $http, $state, $filter, ControllerConfig, datecalculation, jqdatables) {
        $scope.name = "异常的流程";
        $scope.StartTime = datecalculation.redDays(new Date(), 30);
        $scope.EndTime = datecalculation.addDays(new Date(), 30);
        $scope.State = 100;
        $scope.tableExceptionInstance = {
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
                "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i> 您的待办已经全部处理完成",
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
            "sAjaxSource": ControllerConfig.Instance.QueryExceptionInstance,
            "sAjaxDataProp": 'Rows',
            "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
            "sPaginationType": "full_numbers",
            "fnServerParams": function (aoData) {  // 增加自定义查询条件
                console.log("get search key...");
                
                aoData.push(
                    { "name": "instanceName", "value": $scope.InstanceName },
                    { "name": "workflowCode", "value": $scope.WorkflowCode },
                    { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                    { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                    { "name": "userName", "value": $scope.UserName },
                    { "name": "state", "value": 100 }
                    );
            },
            "aoColumns":  // 字段定义
            [
                {
                    "mData": "Priority",
                    "mRender": function (data, type, full) {
                        var color = "";
                        switch (data) {
                            case "0": color = "grey"; break;
                            case "1": color = "green"; break;
                            default: color = "red"; break;
                        }
                        return "<i class=\"glyphicon glyphicon-bell\" style=\"color:" + color + "\"></i>";
                    }
                },
                {
                    "mData": "InstanceName",
                },

                {
                    "mData": "WorkflowName",
                    "mRender": function (data, type, full) {
                        return "<a href=\"javascript:;\">" + data + "</a>";
                    }
                },
                { "mData": "OriginatorName" },
                { "mData": "OriginatorOUName" },
                {
                    "mData": "CreatedTime",
                },
                {
                    "mData": "stayTime",
                    "mRender": function (data, type, full) {
                        return "<span>" + data.Days + "天" + data.Hours + "小时" + data.Minutes + "分" + "</span>";
                    }
                }
            ],
            // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
            "initComplete": function (settings, json) {
                var filter = $(".dataTables_filter");
                filter.html("").css("text-align", "right");
                $(".searchContainer_ExcepptionInstance").appendTo(filter).show();
                filter.parent().attr("class", "col-sm-12");
                filter.find("button").unbind("click.DT").bind("click.DT", function () {
                    $("#tabExceptionIntance").dataTable().fnDraw();
                });
            },
            //datables被draw完后调用
            "fnDrawCallback": function () {
                jqdatables.trcss();
            }
        }
    }]);