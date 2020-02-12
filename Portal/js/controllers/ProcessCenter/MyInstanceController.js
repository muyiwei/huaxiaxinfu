app.controller('MyInstanceController', ['$scope', '$rootScope', '$translate', '$http', '$timeout', '$state', '$stateParams', '$compile', '$interval', '$filter', 'ControllerConfig', 'datecalculation', 'jq.datables',
    function ($scope, $rootScope, $translate, $http, $timeout, $state, $stateParams, $compile, $interval, $filter, ControllerConfig, datecalculation, jqdatables) {
        var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
        $scope.init = function () {
            $scope.InstanceState = 0;
            switch ($stateParams.State) {
                case "Unfinished": $scope.InstanceState = 0; break;
                case "Finished": $scope.InstanceState = 1; break;
                case "Unspecified": $scope.InstanceState = 100; break;
                default: break;
            }
            if ($stateParams.SchemaCode != "") {
                $scope.WorkflowCode = $stateParams.SchemaCode;
            }
            $("#sheetWorkflow").width($(window).width() * 0.2);
        }

        $scope.$on('$viewContentLoaded', function (event) {
            $scope.init();
        });

        $scope.getLanguage = function () {
            $scope.LanJson = {
                search: $translate.instant("uidataTable.search"),
                ProcessName: $translate.instant("QueryTableColumn.ProcessName"),
                WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
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
                sOpenInANewTap: $translate.instant("uidataTable.OpenInANewTap"),
                Portal_TimeMsg: $translate.instant("msgGlobalString.Portal_TimeMsg")
            }
        }
        $scope.getLanguage();
        // 获取语言
        $rootScope.$on('$translateChangeEnd', function () {
            $scope.getLanguage();
            $state.go($state.$current.self.name, {}, { reload: true });
        });

        $scope.WorkflowOptions = {
            Editable: true,
            Visiable: true,
            Mode: "WorkflowTemplate",
            AllowSearch: true,
            IsMultiple: true,
            IsSearch: true,
            IsFrequentFlow: true,
            PlaceHolder: $scope.LanJson.WorkFlow
        }

        // 获取列定义
        $scope.getColumns = function () {
            var columns = [];
            columns.push({
                "mData": "Priority",
                "sClass": "center hide1024",
                "mRender": function (data, type, full) {
                    var rtnstring = "";
                    //紧急程度
                    if (full.Priority == "0") {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" style=\"margin-left:5px;\"></i>";
                    } else if (full.Priority == "1") {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" style=\"color:green;margin-left:5px;\"></i>";
                    } else {
                        rtnstring = "<i class=\"glyphicon glyphicon-bell\" style=\"color:red;margin-left:5px;\"></i>";
                    }
                    return rtnstring;
                }
            });
            columns.push({
                "mData": "InstanceName",
                "mRender": function (data, type, full) {
                    return "<a target='_blank' href='" + PortalRoot + "/InstanceSheets.html?InstanceId=" + full.InstanceID + "'  title='" + data + "'>" + data + "</a>";
                }
            });
            columns.push({ "mData": "WorkflowName" });
            columns.push({
                "mData": "CreatedTime",
                "sClass": "center hide1024",
                "mRender": function (data, type, full) {
                    return "<span id='CreatedTime'>" + data + "</span>";
                }
            });

            //完成时间
            columns.push({
                "mData": "FinishedTime",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<span id='FinishedTime' ng-show=\"InstanceState==1\">" + data + "</span>";
                }
            });

            //取消时间
            columns.push({
                "mData": "FinishedTime",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    return "<span id='CancelTime' ng-show=\"InstanceState==2\">" + data + "</span>";
                }
            });

            //审批环节
            columns.push({
                "mData": "ApproverLink",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    var link = data.split(",");
                    var text = "";
                    if (link.length == 1) {
                        text = data;
                    } else {
                        text = link[0] + "...";
                    }
                    return "<span  data-toggle='tooltip' data-placement='left' class='ApproverLink' ng-show=\"InstanceState==0\" title=\"" + data + "\">" + text + "</span>";
                }
            });
            //审批人
            columns.push({
                "mData": "Approver",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    var link = data.split(",");
                    var text = "";
                    if (full.Exceptional == true) {
                        text = "出现异常，请与管理员联系！";
                    }
                    else if (link.length == 1) {
                        text = data;
                    }
                    else {
                        text = link[0] + "...";
                    }
                    return "<span data-toggle=\"tooltip\" data-placement=\"left\" class='Approver InstanceExceptionInfo' ng-show=\"InstanceState==0\" title=\"" + data + "\">" + text + "</span>";

                }
            });
            return columns;
        }

        $scope.getVisibleColumns = function (InstanceState) {
            var columns = [];
            if ($scope.InstanceState == 0) {
                columns.push({ "aTargets": [0], "bVisible": true });
            } else {
                columns.push({ "aTargets": [0], "bVisible": false });
            }
            return columns;
        }
        $scope.options_MyInstance = {
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
            "sAjaxSource": ControllerConfig.Instance.QueryMyInstance,
            "fnServerData": function (sSource, aDataSet, fnCallback) {
                $.ajax({
                    "dataType": 'json',
                    "type": 'POST',
                    "url": sSource,
                    "data": aDataSet,
                    "success": function (json) {
                        if (json.ExceptionCode == 1 && json.Success == false) {
                            $state.go("platform.login");
                        }
                        fnCallback(json);
                    },
                    "error": function (XMLHttpRequest, textStatus, errorThrown) {
                        if (XMLHttpRequest.status == 401) {
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
                    { "name": "instanceName", "value": $scope.InstanceName },
                    { "name": "workflowCode", "value": $scope.WorkflowCode },
                    { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                    { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                    { "name": "state", "value": $scope.InstanceState }
                    );
            },
            "aoColumns": $scope.getColumns(), // 字段定义
            "aoColumnDefs": $scope.getVisibleColumns($scope.InstanceState),
            // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
            "initComplete": function (settings, json) {
                var filter = $(".searchContainer");
                filter.find("button").unbind("click.DT").bind("click.DT", function () {
                    $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                    $("#tabMyInstance").dataTable().fnDraw();
                });
                filter.find("select").unbind("change.Load").bind("change.Load", function () {
                    $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                    $("#tabMyInstance").dataTable().fnDraw();
                });
                //应用中心—流程列表
                $("#sheetWorkflow").SheetUIManager().SetValue($stateParams.SchemaCode);
            },
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                if (aData.InstanceState == "2" && aData.Approver == "" && aData.ApproverLink == "") {
                    $(nRow).addClass("InstanceException");
                }
                $compile(nRow)($scope);
            },
            "fnDrawCallback": function () {
                var options = {
                    height: 1000
                }
                $("[data-toggle='tooltip']").tooltip(options);
                jqdatables.trcss();

                if ($scope.InstanceState == 0) {
                    //进行中
                    this.find("td #FinishedTime").parent().hide();
                    this.find("td #CancelTime").parent().hide();
                    this.find("th[id=ApproverLink]").css("width", "110px");
                    this.find("th[id=Approver]").css("width", "110px");
                }
                if ($scope.InstanceState == 1) {
                    //已完成
                    this.find("td #CancelTime").parent().hide();
                    this.find("td .ApproverLink").parent().hide();
                    this.find("td .Approver").parent().hide();
                    this.find("th[id=FinishTime]").css("width", "110px");
                }
                if ($scope.InstanceState == 2) {
                    this.find("td #Priority").parent().hide();
                    this.find("td #FinishedTime").parent().hide();
                    this.find("td .ApproverLink").parent().hide();
                    this.find("td .Approver").parent().hide();
                    this.find("th[id=CancelTime]").css("width", "110px");
                }
            }
        }




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