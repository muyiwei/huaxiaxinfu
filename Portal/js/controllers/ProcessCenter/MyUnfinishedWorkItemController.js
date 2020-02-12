//待办
app.controller('MyUnfinishedWorkItemController', ['$scope', '$rootScope', "$translate", "$http", "$state", "$compile", "$interval", "$filter", "ControllerConfig", "datecalculation", "jq.datables",
    function ($scope, $rootScope, $translate, $http, $state, $compile, $interval, $filter, ControllerConfig, datecalculation, jqdatables) {
        var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
        $scope.searchKey = "";
        $scope.init = function () {
            $("#sheetWorkflow").width($(window).width() * 0.2);
        }
        //进入视图触发
        $scope.$on('$viewContentLoaded', function (event) {
            $scope.searchKey = "";
            $scope.init();
        });
        // 获取语言
        $rootScope.$on('$translateChangeEnd', function () {
            $scope.getLanguage();
            $state.go($state.$current.self.name, {}, { reload: true });
        });

        $scope.getLanguage = function () {
            $scope.LanJson = {
                search: $translate.instant("uidataTable.search"),
                sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
                sZeroRecords: $translate.instant("uidataTable.sZeroRecords_UnfinishedWorkItem"),
                sInfo: $translate.instant("uidataTable.sInfo"),
                sProcessing: $translate.instant("uidataTable.sProcessing"),
                sOpenInANewTap: $translate.instant("uidataTable.OpenInANewTap"),
                SequenceNo: $translate.instant("InstanceDetail.SequenceNo"),
                ProcessName: $translate.instant("QueryTableColumn.ProcessName"),
                WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
                StartTime: $translate.instant("QueryTableColumn.StartTime"),
                EndTime: $translate.instant("QueryTableColumn.EndTime"),
                Portal_TimeMsg: $translate.instant("msgGlobalString.Portal_TimeMsg")
            }
        }
        $scope.getLanguage();
        //初始化流程模板
        $scope.WorkflowOptions = {
            Editable: true,
            Visiable: true,
            Mode: "WorkflowTemplate",
            AllowSearch: true,
            IsMultiple: true,
            IsSearch: true,
            IsFrequentFlow: true,
            OnChange: "",
            PlaceHolder: $scope.LanJson.WorkFlow
        }
        // 获取列定义
        $scope.getColumns = function () {
            var columns = [];
            columns.push({
                "mData": "Priority",
                "sClass": "hide1024",
                "mRender": function (data, type, full, a) {
                    var rtnstring = "";
                    //紧急程度
                    if (full.Priority == "0") {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" ></i>";
                    } else if (full.Priority == "1") {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" style=\"color:green;\"></i>";
                    } else {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" style=\"color:red;\"></i>";
                    }
                    //是否催办
                    if (full.Urged == false) {
                        rtnstring = rtnstring + "<a> <i class=\"glyphicon glyphicon-bullhorn\"></i></a>";
                    } else {
                        rtnstring = rtnstring + "<a ng-click=\"showUrgeWorkItemInfoModal('" + full.ObjectID + "')\"> <i class=\"glyphicon glyphicon-bullhorn\" style=\"color:orangered;\"></i></a>";
                    }
                    return rtnstring;
                }
            });
            columns.push({
                "mData": "InstanceName",
                "mRender": function (data, type, full) {
                    return "<td><a target='_blank' title='" + data + "' href='" + PortalRoot + "/WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a></td>";
                }
            });
            columns.push({
                "mData": "SequenceNo",
                "mRender": function (data, type, full) {
                    return "<span   title='" + data + "' >" + data + "</span>";
                }
            });
            columns.push({
                "mData": "DisplayName",
                "mRender": function (data, type, full) {
                    //打开流程状态
                    data = data != "" ? data : full.ActivityCode;
                    return "<td><a href='index.html#/InstanceDetail/" + full.InstanceId + "/" + full.ObjectID + "/" + "/' target='_blank'>" + data + "</a></td>";
                }
            });
            columns.push({ "mData": "ReceiveTime", "sClass": "center hide414" });
            columns.push({
                "mData": "OriginatorName",
                "sClass": "hide414",
                "mRender": function (data, type, full) {
                    return "<a ng-click=\"showUserInfoModal('" + full.Originator + "');\" new-Bindcompiledhtml>" + data + "</a>";
                }
            });
            columns.push({ "mData": "OriginatorOUName", "sClass": "hide1024" });
            return columns;
        }

        $scope.options = function () {
            var options = {
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
                "sAjaxSource": ControllerConfig.WorkItem.GetUnfinishWorkItems,
                "fnServerData": function (sSource, aDataSet, fnCallback) {
                    $.ajax({
                        "dataType": 'json',
                        "type": 'POST',
                        "url": sSource,
                        "data": aDataSet,
                        "success": function (json) { 
                            if (json.ExceptionCode == 1 && json.Success == false) {
                                json.Rows = [];
                                json.sEcho = 1;
                                json.Total = 0;
                                json.iTotalDisplayRecords = 0;
                                json.iTotalRecords = 0;
                                $state.go("platform.login");
                            }
                            fnCallback(json);
                        },
                        "error": function (XMLHttpRequest,textStatus,errorThrown) {
                            if (XMLHttpRequest.status == 401)
                            {
                                window.location = window.localStorage.getItem('H3.PortalRoot') + "/index.html#/platform/login";
                            }
                        }
                    });
                },
                "sAjaxDataProp": 'Rows',
                "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
                "sPaginationType": "full_numbers",
                "fnServerParams": function (aoData) {  // 增加自定义查询条件
                    $scope.StartTime = $("#StartTime").val();
                    $scope.EndTime = $("#EndTime").val();
                    aoData.push(
                        { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                        { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                        { "name": "workflowCode", "value": $scope.WorkflowCode },
                        { "name": "instanceName", "value": $scope.InstanceName },
                        { "name": "sequenceNo", "value": $scope.SequenceNo }
                        );
                },
                "aoColumns": $scope.getColumns(), // 字段定义
                // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
                "initComplete": function (settings, json) {
                    var filter = $(".searchContainer");
                    filter.find("button").unbind("click.DT").bind("click.DT", function () {
                        $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                        $("#tabUnfinishWorkitem").dataTable().fnDraw();
                    });
                },
                //创建行，未绘画到屏幕上时调用
                "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    //将添加的angular事件添加到作用域中
                    if (aData.ItemSummary != "") {
                        $(nRow).attr("title", aData.ItemSummary);
                        //angular-tooltip暂不可用
                        //$(nRow).attr("tooltips", "");
                        //$(nRow).attr("tooltip-template", aData.ItemSummary);
                        //$(nRow).attr("tooltip-side", "bottom");
                    }
                },
                //datables被draw完后调用
                "fnDrawCallback": function () {
                    jqdatables.trcss();
                    $compile($("#tabUnfinishWorkitem"))($scope);
                    //重新注册
                    $interval.cancel($scope.interval);
                    //代办页面，只有在第一页要每隔时间段去重新加载
                    var info = $('#tabUnfinishWorkitem').DataTable().page.info();
                    if (info.page == 0) {
                        $scope.registerInterval();
                        $scope.GetItemCount();//刷新左侧微数据
                    }
                }
            }
            return options;
        }

        $scope.searchKeyChange = function () {
            if ($scope.searchKey == "")
                $("#tabUnfinishWorkitem").dataTable().fnDraw();
        }

        $scope.registerInterval = function () {
            $scope.interval = $interval(function () {
                $("#tabUnfinishWorkitem").dataTable().fnDraw();
            }, 90 * 1000);
        }

        $scope.$on("$destroy", function () {
            $interval.cancel($scope.interval);
        })
        //监听日期是否合法
        $scope.getwdatePickerOptions = function () {
            var picked = function (dp) {
                console.log(dp);
                var date = dp.cal.getDateStr();
                var ele = dp.srcEl;
                var ele2 = $(ele).siblings("input[ng-model]");
                if (ele2.val().trim() == "") {
                    return;
                }
                if (ele.id == "EndTime") {
                    if (ele2.val() > date) {
                        ele.value = "";
                        alert($scope.LanJson.Portal_TimeMsg);
                    }
                } else if (ele.id = "StartTime") {
                    if (date > ele2.val()) {
                        ele.value = "";
                        alert($scope.LanJson.Portal_TimeMsg);
                    }
                }

            }
            return { onpicked: picked, oncleared: picked };
        }
    }]);