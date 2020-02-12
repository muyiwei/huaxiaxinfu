app.controller('QueryParticipantWorkItemController', ['$scope', "$rootScope", "$translate", "$http", "$timeout", "$state", "$filter", "$compile", "ControllerConfig", "datecalculation", "jq.datables",
    function ($scope, $rootScope, $translate, $http, $timeout, $state, $filter, $compile, ControllerConfig, datecalculation, jqdatables) {
        var PortalRoot = window.localStorage.getItem("H3.PortalRoot");

        $scope.State = 0;
        $scope.$on("$viewContentLoaded", function (event) {
            $scope.Participant = $scope.user == undefined ? "" : $scope.user.ObjectID;
            $("#sheetWorkflow").width($(window).width() * 0.2);
        })

        $scope.getLanguage = function () {
            $scope.LanJson = {
                search: $translate.instant("uidataTable.search"),
                ProcessName: $translate.instant("QueryTableColumn.ProcessName"),
                WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
                Originator: $translate.instant("QueryTableColumn.Originator"),
                Approver: $translate.instant("QueryTableColumn.Approver"),
                StartTime: $translate.instant("QueryTableColumn.ReceiveStartTime"),
                EndTime: $translate.instant("QueryTableColumn.ReceiveEndTime"),
                sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
                sZeroRecords: $translate.instant("uidataTable.sZeroRecords"),
                sInfo: $translate.instant("uidataTable.sInfo"),
                sProcessing: $translate.instant("uidataTable.sProcessing"),
                UnfinishedText: $translate.instant("InstanceState.Unfinished"),
                FinishedText: $translate.instant("InstanceState.Finished"),
                CanceledText: $translate.instant("InstanceState.Canceled"),
                UnspecifiedText: $translate.instant("InstanceState.Unspecified"),
                SequenceNo: $translate.instant("InstanceDetail.SequenceNo"),
                sOpenInANewTap: $translate.instant("uidataTable.OpenInANewTap"),
                Portal_TimeMsg: $translate.instant("msgGlobalString.Portal_TimeMsg"),
                //权限
                QueryInstanceByProperty_NotEnoughAuth1: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth1"),
                QueryInstanceByProperty_NotEnoughAuth2: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth2"),
                QueryInstanceByProperty_NotEnoughAuth3: $translate.instant("NotEnoughAuth.QueryInstanceByProperty_NotEnoughAuth3"),
                QueryParticipantWorkItem_NoParticipant: $translate.instant("NotEnoughAuth.QueryParticipantWorkItem_NoParticipant"),
                DataFilter_NotEnoughAuth: $translate.instant("NotEnoughAuth.DataFilter_NotEnoughAuth"),
            }
        }
        $scope.getLanguage();
        // 获取语言
        $rootScope.$on('$translateChangeEnd', function () {
            $scope.getLanguage();
            $state.go($state.$current.self.name, {}, { reload: true });
        });

        $scope.WorkflowOptions = {
            Editable: true, Visiable: true, Mode: "WorkflowTemplate", AllowSearch: true, IsMultiple: true, IsSearch: true, IsFrequentFlow: true, PlaceHolder: $scope.LanJson.WorkFlow
        }
        $scope.UserOptions = {
            Editable: true, Visiable: true, AllowSearch: true, IsMultiple: true, IsSearch: true, IsFrequentFlow: true, OrgUnitVisible: false, V: $scope.user == undefined ? "" : $scope.user.ObjectID, PlaceHolder: $scope.LanJson.Approver
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
                    return "<a target='_blank' title='" + data + "' href='" + PortalRoot + "/WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a>";

                }
            });
            columns.push({ "mData": "WorkflowName" });
            columns.push({
                "mData": "SequenceNo",
                "mRender": function (data, type, full) {
                    return "<span   title='" + data + "' >" + data + "</span>";
                }
            });
            columns.push({
                "mData": "DisplayName",
                "sClass": "center hide414",
                "mRender": function (data, type, full) {
                    data = data != "" ? data : full.ActivityCode;
                    return "<a ui-toggle-class='show' target='.app-aside-right' targeturl='WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a>";
                }
            });
            columns.push({
                "mData": "ParticipantName",
                "sClass": "center hide1024",
                "mRender": function (data, type, full) {
                    return "<a ng-click=\"showUserInfoModal('" + full.Participant + "');\" new-Bindcompiledhtml>" + data + "</a>";
                }
            });
            columns.push({ "mData": "ParticipantOUName", "sClass": "center hide1024", });
            columns.push({
                "mData": "ReceiveTime", "sClass": "center hide414", "mRender": function (data, type, full) {
                    return "<span id=\"ReceiveTime\">" + data + "</span>";
                }
            });
            columns.push({
                "mData": "FinishTime", "sClass": "center hide414", "mRender": function (data, type, full) {
                    return "<span id=\"FinishTime\">" + data + "</span>";
                }
            });
            //if ($scope.State == 0) {
            //    columns.push({ "mData": "ReceiveTime", "sClass": "center hide414" });
            //} else {
            //    columns.push({ "mData": "FinishTime", "sClass": "center hide414" });
            //}
            return columns;
        }

        $scope.dtOptions_tabQueryParticipantWorkItem = {
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
            "sAjaxSource": ControllerConfig.WorkItem.QueryParticipantWorkItems,
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
                        if (json.ExtendProperty != null && json.ExtendProperty.Success == false) {
                            // 没有权限，弹出提示
                            if (json.ExtendProperty.Message == "QueryInstanceByProperty_NotEnoughAuth1") {
                                $.notify({ message: $scope.LanJson.QueryInstanceByProperty_NotEnoughAuth1, status: "danger" });
                            } else if (json.ExtendProperty.Message == "QueryInstanceByProperty_NotEnoughAuth2") {
                                $.notify({ message: $scope.LanJson.QueryInstanceByProperty_NotEnoughAuth2, status: "danger" });
                            } else if (json.ExtendProperty.Message == "QueryInstanceByProperty_NotEnoughAuth3") {
                                $.notify({ message: $scope.LanJson.QueryInstanceByProperty_NotEnoughAuth3, status: "danger" });
                            }
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
                    { "name": "participant", "value": $scope.Participant },
                    { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                    { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                    { "name": "state", "value": $scope.State },
                    { "name": "sequenceNo", "value": $scope.SequenceNo }
                    );
            },
            "aoColumns": $scope.getColumns(),  // 字段定义           
            // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
            "initComplete": function (settings, json) {
                var filter = $(".searchContainer");
                filter.find("button").unbind("click.DT").bind("click.DT", function () {
                    $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                    $scope.Participant = $("#sheetUser").SheetUIManager().GetValue();
                    $("#tabQueryParticipantWorkItem").dataTable().fnDraw();
                });
                filter.find("select").unbind("change.Load").bind("change.Load", function () {
                    $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                    $scope.Participant = $("#sheetUser").SheetUIManager().GetValue();
                    $("#tabQueryParticipantWorkItem").dataTable().fnDraw();
                });
            },
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                $compile(nRow)($scope);
            },
            //datables被draw完后调用
            "fnDrawCallback": function () {

                if ($scope.State == 0) {
                    //进行中
                    this.find("td #FinishTime").parent().hide();
                    this.find("th[id=ReceiveTime]").css("width", "110px");
                }
                if ($scope.State == 1 || $scope.State == 2) {
                    //已完成
                    this.find("td #ReceiveTime").parent().hide();
                    this.find("th[id=FinishTime]").css("width", "110px");
                }
                jqdatables.trcss();
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

app.directive('resize', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            $("#sheetUser").width((newValue.w - 100) * 0.3);
            $("#sheetWorkflow").width((newValue.w - 100) * 0.7);
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
})