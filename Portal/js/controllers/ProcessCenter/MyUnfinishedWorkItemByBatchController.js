//待办-批量模式
app.controller('MyUnfinishedWorkItemByBatchController', ['$scope', "$rootScope", "$translate", "$state",
    "$http", "$interval", "$filter", "$modal", "$compile", "ControllerConfig", "datecalculation", "jq.datables", "$timeout",
    function ($scope, $rootScope, $translate, $state, $http, $interval, $filter, $modal, $compile, ControllerConfig,datecalculation, jqdatables, $timeout) {
        $scope.checkAll = false;
        $scope.init = function () {
            $scope.StartTime = datecalculation.redDays(new Date(), 30);
            $scope.EndTime = datecalculation.addDays(new Date(), 30);
            $("#sheetWorkflow").width($(window).width() * 0.2);
        }
        //进入视图触发
        $scope.$on('$viewContentLoaded', function (event) {
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
                sZeroRecords: $translate.instant("uidataTable.sZeroRecords"),
                sInfo: $translate.instant("uidataTable.sInfo"),
                sProcessing: $translate.instant("uidataTable.sProcessing"),
                WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
                NoSelectWorkItem: $translate.instant("WarnOfNotMetCondition.NoSelectWorkItem"),
                Approval: $translate.instant("WorkItemBatchModal.Approval"),
                DisApproval: $translate.instant("WorkItemBatchModal.DisApproval"),
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
            columns.push(
            {
                "mData": "ObjectID",
                "mRender": function (data, type, full) {
                    return "<input type=\"checkbox\" ng-checked=\"checkAlls\" class=\"WorkItemBatchItem\" data-id=\"" + data + "\"/>";
                }
            });
            columns.push({
                "mData": "Priority",
                "sClass": "hide1024",
                "mRender": function (data, type, full) {
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
            })

            columns.push({
                "mData": "InstanceName",
                "mRender": function (data, type, full) {
                    //打开待办表单
                    return "<a ui-toggle-class='show' target='.app-aside-right' targeturl='WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a>";
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
            columns.push({
                "mData": "ReceiveTime",
                "sClass": "hide414",
            });
            columns.push({
                "mData": "OriginatorName",
                "sClass": "hide414",
                "mRender": function (data, type, full) {
                    return "<a ng-click=\"showUserInfoModal('" + full.Originator + "');\" new-Bindcompiledhtml>" + data + "</a>";
                }
            });
            columns.push({ "mData": "OriginatorOUName", "sClass": "hide1024", });
            return columns;
        };

        $scope.options_UnfinishWorkItemByBatch = {
            "bProcessing": true,
            "bServerSide": true,    // 是否读取服务器分页
            "paging": true,         // 是否启用分页
            "bPaginate": true,      // 分页按钮  
            "bLengthChange": false, // 每页显示多少数据
            "bFilter": false,        // 是否显示搜索栏  
            "searchDelay": 1000,    // 延迟搜索
            "iDisplayLength": 10,   // 每页显示行数  
            "bSort": false,         // 排序  
            "columnDefs": [{
                "orderable": false,
                "className": "select-checkbox",
                "targets": 0
            }],
            "order": [[2, "asc"]],
            "bInfo": true,
            "pagingType": "full_numbers",
            "language": {           // 语言设置
                "sLengthMenu": "每页显示 _MENU_ 条记录",
                "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i>" + $translate.instant("uidataTable.sZeroRecords"),
                "sInfo": $translate.instant("uidataTable.sInfo"),
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
            "sAjaxSource": ControllerConfig.WorkItem.MyUnfinishedWorkItemByBatch,
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
                        if (!$scope.checkAll) {
                            $scope.$apply(function () {
                                $scope.checkAlls = false;
                            });
                        } else {
                            $scope.$apply(function () {
                                $scope.checkAlls = true;
                            });
                        }
                        var checkAllButton = document.querySelectorAll("input[type='checkbox']")[0];
                        checkAllButton.onclick = function () {
                            if ($scope.checkAll) {
                                $scope.$apply(function () {
                                    $scope.checkAlls = true;
                                })

                            } else {
                                $scope.$apply(function () {
                                    $scope.checkAlls = false;
                                })
                            }
                        };
                        var items = angular.element(document.querySelectorAll(".WorkItemBatchItem"));
                        console.log(items);
                        angular.forEach(items, function (data, index, array) {
                            data.onclick = function () {
                                if (!this.checked) {
                                    $scope.$apply(function () {
                                        $scope.checkAll = false;
                                    })
                                }
                                var num = 0;
                                angular.forEach(items, function (data2, index2, array2) {
                                    if (data2.checked) {
                                        num += 1;
                                    }
                                    if (items.length == num) {
                                        $scope.$apply(function () {
                                            $scope.checkAll = true;
                                        })
                                    };
                                });
                            }
                        });
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
                    { "name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd") },
                    { "name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd") },
                    { "name": "workflowCode", "value": $scope.WorkflowCode },
                    { "name": "instanceName", "value": $scope.InstanceName },
                    { "name": "sequenceNo", "value": $scope.SequenceNo }
                    );
            },
            "aoColumns": $scope.getColumns(),
            "initComplete": function (settings, json) {
                var filter = angular.element(document.querySelectorAll(".searchContainer"));
                filter.find("button").off("click.DT").on("click.DT", function () {
                    $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                    angular.element(document.querySelectorAll("#" + settings.sInstance)).dataTable().fnDraw()
                });
            },
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                $compile(nRow)($scope);
            },
            "fnDrawCallback": function () {
                jqdatables.trcss();
            }
        }

        $scope.searchKeyChange = function () {
            if ($scope.searchKey == "") {
                $("#tabUnfinishWorkItemByBatch").dataTable().fnDraw();
            }
        }

        $scope.showCommentModal = function (approval) {  //打开模态 
            $scope.selectedWorkItems = [];
            //$scope.actionText = approval ? "提交" : "拒绝";
            //$translate.instant("WorkItemBatchModal.PleaseInputComment"),

            $scope.actionText = approval ? $scope.LanJson.Approval : $scope.LanJson.DisApproval;

            // 获取所有选中的行
            var items = angular.element(document.querySelectorAll(".WorkItemBatchItem"));
            angular.forEach(items, function (data, index, array) {
                if (data.checked) {
                    $scope.selectedWorkItems.push(data.getAttribute("data-id"));
                }
            });

            // 没有选择任何记录，弹出提示
            if (!$scope.selectedWorkItems.length) {
                $.notify({ message: $scope.LanJson.NoSelectWorkItem, status: "danger" });
                return;
            }

            // 弹出模态框
            var modalInstance = $modal.open({
                templateUrl: 'WorkItemBatchModal.html',    // 指向上面创建的视图
                controller: 'WorkItemBatchModalController',// 初始化模态范围
                // size: size,
                resolve: {
                    params: function () {
                        return {
                            selectedCount: $scope.selectedWorkItems.length,
                            actionText: $scope.actionText
                        };
                    }
                }
            });

            // 弹窗点击确定的回调事件
            modalInstance.result.then(function (commentText) {
                $http({
                    url: ControllerConfig.WorkItem.HandleWorkItemByBatch,
                    params: {
                        Approval: approval,
                        WorkItemIDs: $scope.selectedWorkItems,
                        CommentText: commentText
                    }
                })
                .success(function (result, header, config, status) {
                    $state.go($state.$current.self.name, {}, { reload: true });
                })
                .error(function (result, header, config, status) {
                });
            });
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

// 弹窗的 Controller
app.controller('WorkItemBatchModalController', ['$rootScope', '$scope', '$http', '$state', '$translate', '$modalInstance', 'ControllerConfig', 'params',
    function ($rootScope, $scope, $http, $state, $translate, $modalInstance, ControllerConfig, params) {
        $scope.commentText = "";
        $scope.selectedCount = params.selectedCount;
        $scope.actionText = params.actionText;

        // 获取语言
        $rootScope.$on('$translateChangeEnd', function () {
            $scope.getLanguage();
            $state.go($state.$current.self.name, {}, { reload: true });
        });

        $scope.getLanguage = function () {
            $scope.LanJson = {
                PleaseInputComment: $translate.instant("WorkItemBatchModal.PleaseInputComment"),
            }
        }
        $scope.getLanguage();

        $http({
            url: ControllerConfig.PersonalInfo.GetFrequentlyUsedCommentsByUser
        })
        .success(function (data) {
            $scope.MyComment = data.Rows;
        })
        .error()
        $scope.SetCommentValue = function () {
            $scope.commentText = $scope.Comment;
        }

        $scope.ok = function () {
            $modalInstance.close($scope.commentText);  // 点击确定按钮
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel'); // 退出
        }
    }]);