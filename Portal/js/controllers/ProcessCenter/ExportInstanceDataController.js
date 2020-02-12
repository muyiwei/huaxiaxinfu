app.controller('ExportInstanceDataController', ['$rootScope', '$scope', '$translate', '$http', '$state', '$timeout', '$filter', '$compile', 'ControllerConfig',
    function ($rootScope, $scope, $translate, $http, $state, $timeout, $filter, $compile, ControllerConfig) {
        $scope.$on('$viewContentLoaded', function (event) {
            $scope.WorkflowCode = "";
            $scope.checkAll = false;
            $scope.StringDisplay = true;
            $scope.StringEditAble = false;
            $scope.LogicRelation = "AND";
            //获取要查询的项//表字段  
            $scope.chkColumns = "";
            // Select查询条件,所有选项
            $scope.Conditions = [];
            $scope.tabData = null;
            $scope.tableInitialed = false;
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
                sZeroRecords: $translate.instant("uidataTable.sZeroRecords_NoRecords"),
                sInfo: $translate.instant("uidataTable.sInfo"),
                sProcessing: $translate.instant("uidataTable.sProcessing"),
                Originator: $translate.instant("QueryTableColumn.Originator"),
                WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
                StartTime: $translate.instant("QueryTableColumn.StartTime"),
                EndTime: $translate.instant("QueryTableColumn.EndTime"),
                //权限
                DataFilter_WorkflowRequired: $translate.instant("NotEnoughAuth.DataFilter_WorkflowRequired"),
                DataFilter_NotEnoughAuth: $translate.instant("NotEnoughAuth.DataFilter_NotEnoughAuth"),
            }
        }
        $scope.getLanguage();

        $scope.WorkflowOptions = {
            Editable: true, Visiable: true, Mode: "WorkflowTemplate", IsMultiple: false, IsSearch: true, IsFrequentFlow: true, PlaceHolder: $scope.LanJson.WorkFlow,
            OnChange: function (e) {
                $scope.WorkflowCode = $("#sheetWorkflow").SheetUIManager().GetValue();
                $scope.GetShowColumns();
            }
        }
        $scope.UserOptions = {
            Editable: true, Visiable: true, OrgUnitVisible: true, V: $scope.user == undefined ? "" : $scope.user.ObjectID, PlaceHolder: $scope.LanJson.Originator
        }
        $scope.SearchUserOptions = {
            Editable: true, Visiable: true, OrgUnitVisible: true,
            OnChange: function () {
                $scope.ItemsValue = $("#SearchUser").SheetUIManager().GetValue();
                $scope.ItemsValueChange();
            }
        }

        //流程模板改变
        $scope.GetShowColumns = function () {           

            //1、清空现有条件
            //2、获得所有可作查询条件的数据项
            //3、获取可查询的数据项
            $scope.tableInitialed = false;

            if (!$scope.WorkflowCode) {
                // 清空数据
                return;
            }

            $http({
                url: ControllerConfig.Instance.ChangeWorkflowCode,
                params: {
                    WorkflowCode: $scope.WorkflowCode
                }
            })
            .success(function (result, header, config, status) {
                // 绑定流程模板的数据项
                $scope.WorkflowItems = result[0];
                $scope.SearchColumns = result[1];



                var tabContext = $("#tabTemplate").html();
                var table = $("<table id=\"tabData\" class=\"table table-striped m-b-none\"></table>");
                table.html(tabContext);
                table.find(".theadtr_ExportInstanceData").html("<th ng-repeat=\"column in SearchColumns\" ng-show=\"column.Selected\">{{column.Text}}</th>");
                $(".table-responsive").html(table);
                $compile(table)($scope);
                $scope.options.aoColumns = $scope.getColumns();
                $scope.checkAll = true;
                $scope.selectAll();
                if ($scope.tabData) {
                    $scope.tabData.fnClearTable();
                    $scope.tabData.fnDestroy();
                }
            })
            .error(function (result, header, config, status) {

            })
        }

        //数据项改变,  Items.Value 数据项的值
        $scope.WorkflowItemChange = function () {
            //0、清空值
            $scope.ItemsValue = "";
            //1、重新绑定关系操作符下拉选项
            $scope.LogicRelations = [];
            //2、显示相应的输入框
            $scope.StringDisplay = false;
            $scope.DateTimeDisplay = false;
            $scope.ParticipantDisplay = false;
            $scope.BoolDisplay = false;

            if ($scope.ItemsCode == "" || $scope.ItemsCode == null) {
                return;
            }
            else if ($scope.ItemsCode.indexOf("|String") > -1) {
                $scope.LogicRelations = [
                    { Text: "==", Value: "=" },
                    { Text: "!=", Value: "<>" },
                    { Text: "包含", Value: "Contain" },
                    { Text: "不包含", Value: "NotContain" },
                    { Text: "为空", Value: "IsNull" },
                    { Text: "不为空", Value: "IsNotNull" },
                ];
                $scope.StringDisplay = true;
                $scope.StringEditAble = true;
            }
            else if ($scope.ItemsCode.indexOf("|DateTime") > -1) {
                $scope.LogicRelations = [
                    { Text: "==", Value: "=" },
                    { Text: "!=", Value: "<>" },
                    { Text: ">", Value: ">" },
                    { Text: ">=", Value: ">=" },
                    { Text: "<", Value: "<" },
                    { Text: "<=", Value: "<=" },
                ];
                $scope.DateTimeDisplay = true;
            }
            else if ($scope.ItemsCode.indexOf("|Numeric") > -1) {
                $scope.LogicRelations = [
                    { Text: "==", Value: "=" },
                    { Text: "!=", Value: "<>" },
                    { Text: ">", Value: ">" },
                    { Text: ">=", Value: ">=" },
                    { Text: "<", Value: "<" },
                    { Text: "<=", Value: "<=" },
                ];
                $scope.StringDisplay = true;
                $scope.StringEditAble = true;
            }
            else if ($scope.ItemsCode.indexOf("|Participant") > -1) {
                $scope.LogicRelations = [
                    { Text: "==", Value: "=" },
                    { Text: "!=", Value: "<>" },
                ];
                $scope.ParticipantDisplay = true;
            }
            else if ($scope.ItemsCode.indexOf("|Bool") > -1) {
                $scope.LogicRelations = [
                    { Text: "==", Value: "==" },
                ];
                $scope.BoolDisplay = true;
            }
        }

        //(操作符)比较符号改变 ,Relation.Value 逻辑关系的值
        $scope.RelationChange = function () {
            if ($scope.RelationValue == "IsNull" || $scope.RelationValue == "IsNotNull") {
                $scope.ItemsValue = "";
                $scope.StringEditAble = false;
            } else {
                $scope.StringEditAble = true;
            }
        }

        //查询数据项值发生变化
        $scope.ItemsValueChange = function () {
        }

        //添加查询条件
        $scope.addCondition = function () {
            // 数据项 
            if ($scope.ItemsCode == "" || $scope.ItemsCode == undefined) {
                return;
            }
            // AND/OR的连接   
            if ($scope.LogicRelation == "" || $scope.LogicRelation == undefined) {
                return;
            }
            // 比较符号
            if ($scope.RelationValue == "" || $scope.RelationValue == undefined) {
                return;
            }
            // 值
            if ($scope.ItemsValue == undefined) {
                return;
            }
            //值为空，并且是时间或者数值类型
            if ($scope.ItemsValue == "" && ($scope.ItemsCode.indexOf("DateTime") > -1
               || $scope.ItemsCode.indexOf("Numeric") > -1)) {
                return false;
            }
            //值中包含特殊字符
            if ($scope.ItemsValue != null && ($scope.ItemsValue.indexOf("'") != -1 || $scope.ItemsValue.indexOf(";") != -1 || $scope.ItemsValue.indexOf("|String") != -1)) {
                alert("值中包含特殊字符");
                return;
            }
            //判断选人控件的值

            //逻辑关系+数据项+比较符号+值
            var conditionText = $scope.LogicRelation + " " + $scope.ItemsCode.split('|')[0] + " " + $scope.RelationValue + " " + $scope.ItemsValue;
            var conditionValue = $scope.LogicRelation + " " + ";" + $scope.ItemsCode.split('|')[0] + ";" + $scope.RelationValue + ";" + $scope.ItemsValue + ";";
            addCondition(conditionText, conditionValue);
        }

        function addCondition(conditionText, conditionValue) {
            for (var i = 0; i < $scope.Conditions.length; i++) {
                if ($scope.Conditions[0].Value == conditionValue) {
                    return;
                }
            }
            $scope.Conditions.push({
                Text: conditionText,
                Value: conditionValue
            });
            updateSqlText();
        }

        $scope.ConditionFinshed = function () {
            $timeout(function () {
                //$compile($("option:selected"))($scope);
            }, 1000 * 2);
        }

        //移除选中的条件
        $scope.RemoveCondition = function (conditionValue) {
            var condition = [];
            for (var i = 0; i < $scope.Conditions.length; i++) {
                if ($scope.Conditions[i].Value == conditionValue)
                    continue;
                condition.push({
                    Text: $scope.Conditions[i].Text,
                    Value: $scope.Conditions[i].Value
                });
            }
            $scope.Conditions = condition;
            updateSqlText();
        }

        // 重新更新SqlText
        function updateSqlText() {
            //循环查询条件选项
            var sql = "";
            for (var i = 0; i < $scope.Conditions.length; i++) {
                sql += $scope.Conditions[i].Value;
            }
            $scope.ConditionsString = sql;
            $scope.ConditionFinshed();
        }

        $scope.selectAll = function () {
            for (var item in $scope.SearchColumns) {
                $scope.SearchColumns[item].Selected = $scope.checkAll;
            }
        }

        $scope.getColumns = function () {
            var columns = [];
            $scope.chkColumns = "";
            for (var item in $scope.SearchColumns) {
                //查询的列
                columns.push({
                    "mData": $scope.SearchColumns[item].Value,
                    mRender: function (data, type, full) {
                        return data || "";
                    }
                });

                if ($scope.SearchColumns[item].Selected) {
                    //导出的列
                    $scope.chkColumns = $scope.chkColumns + $scope.SearchColumns[item].Value + ",";
                }
            }
            $scope.chkColumns = $scope.chkColumns.substring(0, $scope.chkColumns.length - 1);
            return columns;
        }
               

        $scope.options = {
            "bProcessing": true,
            "paging": true,         // 是否启用分页
            "bPaginate": true,      // 分页按钮  
            "bLengthChange": false, // 每页显示多少数据
            "bFilter": false,       // 是否显示搜索栏  
            "searchDelay": 1000,    // 延迟搜索
            "iDisplayLength": 10,   // 每页显示行数  
            "bSort": false,         // 排序  
            "singleSelect": true,
            "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息  
            "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
            "bServerSide": true,    // 是否读取服务器分页
            "sAjaxSource": ControllerConfig.Instance.QueryInstanceData,
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
                            if (json.ExtendProperty.Message == "DataFilter_NotEnoughAuth") {
                                $.notify({ message: $scope.LanJson.DataFilter_NotEnoughAuth, status: "danger" });
                            }
                        }
                        fnCallback(json);
                    },
                    "error": function (XMLHttpRequest, textStatus, errorThrown) {
                        if (XMLHttpRequest.status == 401) {
                            window.location =window.localStorage.getItem('H3.PortalRoot')+ "/index.html#/platform/login";
                        }
                    }
                });
            },
            "fnServerParams": function (aoData) {  // 增加自定义查询条件
                $scope.StartTime = $("#StartTime").val();
                $scope.EndTime = $("#EndTime").val();
                aoData.push(
                    { "name": "Originator", "value": $scope.Originator },
                    { "name": "WorkflowCode", "value": $scope.WorkflowCode },//$scope.WorkflowCode
                    { "name": "StartTime", "value": $scope.StartTime },
                    { "name": "EndTime", "value": $scope.EndTime },
                    { "name": "Conditions", "value": $scope.ConditionsString },
                    { "name": "Columns", "value": $scope.chkColumns } //  "DropDownList,DropDownList_multi"
                    );
            },
            "language": {           // 语言设置
                "sLengthMenu": $scope.LanJson.sLengthMenu,
                "sZeroRecords": "<i class=\"icon-emoticon-smile\"></i> " + $scope.LanJson.sZeroRecords,
                "sInfo": $scope.LanJson.sInfo,
                "infoEmpty": "",
                "sProcessing": $scope.LanJson.sProcessing,
                "search": "_INPUT_",
                "paginate": {
                    "first": "<<",
                    "last": ">>",
                    "previous": "<",
                    "next": ">"
                }
            },
            "columnsDef": [{
                "targets": 0,
                "orderable": false
            }],
            "sAjaxDataProp": 'Rows',
            "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
            "sPaginationType": "full_numbers",
            "aoColumns": [{ "mData": "Name" }],
            "initComplete": function (settings, json) {
            },
            // 创建行，未绘画到屏幕上时调用
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                // 将添加的angular事件添加到作用域中
                angular.forEach(angular.element(nRow).find("td"), function (e, index) {
                    angular.element(e).attr("ng-show", "SearchColumns[" + index + "].Selected").attr("title", $(e).text());
                });
                $compile(angular.element(nRow))($scope);
            }
        }

        $scope.QueryInstanceData = function () {
            $scope.checkAll = true;
            $scope.selectAll();
            $scope.getColumns();
            if (!$scope.tableInitialed) {
                $scope.tableInitialed = true;
                $scope.Originator = $("#sheetUser").SheetUIManager().GetValue();
                $scope.tabData = $("#tabData").dataTable($scope.options);
            }
            else {
                $scope.Originator = $("#sheetUser").SheetUIManager().GetValue();
                $scope.tabData.fnDraw();
            }
        }

        /*
            /Instance/ExportIntanceData?Originator=&WorkflowCode=SheetDropDownList&StartTime=&EndTime=&Conditions=&Columns=Name,CreatedBy,CreatedTime,ModifiedBy,ModifiedTime,DropDownList,DropDownList_multi
        */
        //导出Excel
        $scope.ExportIntanceData = function () {
            $scope.getColumns();
            var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
            //TOD:判断权限
            $http({
                url: ControllerConfig.Instance.ExportDataValidateWFInsAdmin,
                params: {
                    Originator: $scope.Originator,
                    WorkflowCode: $scope.WorkflowCode,
                    Columns: $scope.chkColumns
                }
            })
            .success(function (result, header, config, status) {
                if (!result.Success) {
                    return;
                }
            })
            .error(function (result) {
                return;
            })

            if ($scope.WorkflowCode == undefined || $scope.chkColumns == "") return
            var url = PortalRoot + "/" + ControllerConfig.Instance.ExportIntanceData + "?Originator=" + $scope.Originator + "&WorkflowCode=" + $scope.WorkflowCode + "&StartTime=" + $scope.StartTime + "&EndTime=" + $scope.EndTime + "&Conditions=" + $scope.ConditionsString + "&Columns=" + $scope.chkColumns;
            window.location.href = url;
        }



        //监听日期是否合法
        $scope.getwdatePickerOptions = function () {
            var picked = function (dp) {
                console.log(dp);
                var date = dp.cal.getDateStr();
                var ele = dp.srcEl;
                var ele2 = $(ele).closest(".row").find("input[ui-jq='wdatePicker']").not(ele);
                if (ele2.val().trim() == "") {
                    return;
                }
                if (ele.id == "EndTime") {
                    if (ele2.val() > date) {
                        ele.value = "";
                        alert("开始时间不得大于结束时间!");
                    }
                } else if (ele.id = "StartTime") {
                    if (date > ele2.val()) {
                        ele.value = "";
                        alert("开始时间不得大于结束时间!");
                    }
                }

            }
            return { onpicked: picked, oncleared: picked };
        }


    }]);