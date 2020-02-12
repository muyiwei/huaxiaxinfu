/*
    应用中心-查询列表
*/
app.controller('BizQueryViewController', ['$rootScope', '$scope', '$http', '$state', '$stateParams', '$translate', '$modal', '$compile', '$timeout', '$filter', '$interval', 'jq.datables', 'datecalculation', 'ControllerConfig',
function ($rootScope, $scope, $http, $state, $stateParams, $translate, $modal, $compile, $timeout, $filter, $interval, jqdatables, datecalculation, Controller) {
    var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
    $scope.GridData = [];
    $scope.DisplayFormats = [];
    //进入视图触发
    $scope.$on('$viewContentLoaded', function (event) {
        $scope.DisplayFormats = [];
        $scope.init();
    });
    $scope.init = function () {
        $scope.SchemaCode = $stateParams.SchemaCode;
        $scope.QueryCode = $stateParams.QueryCode;
        $scope.FunctionCode = $stateParams.FunctionCode;
        $.ajax({
            async: false,
            type: "POST",
            url: Controller.RunBizQuery.GetBizQueryViewData,
            cache: false,
            dataType: "json",
            data: {
                schemaCode: $scope.SchemaCode,
                queryCode: $scope.QueryCode,
                functionCode:$scope.FunctionCode,
                random: new Date().getTime()
            },
            success: function (data, header, config, status) {
                if (data.Success == false) {
                    if (data.Message)
                    {
                        alert(data.Message);
                    }
                    return;
                }
                // 获取到自定义JavaScript,动态执行
                if (data.Extend.Javascript) {
                    eval(data.Extend.Javascript);
                }

                //显示格式
                $scope.DisplayFormats = data.Extend.DisplayFormats;
                //功能按钮
                $scope.BizQueryActions = data.Extend.ActionFilter.Data.Extend.BizQueryActions;
                //帅选条件
                $scope.FilterData = data.Extend.ActionFilter.Data.Extend.FilterData;
                //默认显示查询结果
                $scope.ListDefault = data.Extend.ActionFilter.Data.Extend.ListDefault;
                //列名
                var GirdColumns = data.Extend.ActionFilter.Data.Extend.GirdColumns;
                //添加选择按钮
                $scope.GirdColumns = [];
                $scope.GirdColumns.push({
                    display: $.Lang("BizQuery.Propertys.IndexNo"),
                    name: "IndexNo"
                })
                $scope.GirdColumns.push({
                    display: $.Lang("BizQuery.Propertys.Choose"),
                    name: "ChooseObjectID"
                })
                angular.forEach(GirdColumns, function (data, index, full) {
                    //系统保留字段变成中文
                    var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
                    if (array.indexOf(data.display) != -1) {
                        data.display = $.Lang("BizQuery.Propertys." + data.display);
                    }
                    $scope.GirdColumns.push(data);
                })
                //功能按钮处理  ng-click
                angular.forEach($scope.BizQueryActions, function (data, index, full) {
                    //if (data.IsDefault == 1) {
                    //    data.DisplayName = $.Lang("BizQuery.DefualtActionName." + data.ActionCode);
                    //}
                    var array = ["AddNew", "Edit", "Delete"]
                    if (array.indexOf(data.ActionCode) != -1) {
                        data.DisplayName = $.Lang("BizQuery.DefualtActionName." + data.ActionCode);
                    }

                    if (data.ActionType == 0) {
                        var BizMethodName = data.BizMethodName;
                        var DisplayName = data.DisplayName;
                        var ifConfirm = data.Confirm == 1 ? true : false;
                        $scope.BizQueryActions[index].url = "InvokeMethod('" + BizMethodName + "','" + DisplayName + "'," + ifConfirm + ")"
                    }
                    else if (data.ActionType == 1) {
                        var BizSheetCode = data.BizSheetCode;
                        var ifWithID = data.WithID == 1 ? true : false;
                        var AfterSave = data.AfterSave;
                        $scope.BizQueryActions[index].url = "OpenSheet('" + BizSheetCode + "'," + ifWithID + "," + AfterSave + ")"
                    }
                    else if (data.ActionType == 2) {
                        var Url = data.Url;
                        var ifWithID = data.WithID == 1 ? true : false;
                        $scope.BizQueryActions[index].url = "OpenUrl('" + Url + "'," + ifWithID + ")";
                    }
                });

                // 数据加载完成
                if ($scope.loaded) {
                    $scope.loaded.call($scope);
                }

            },
            error: function (data, header, config, status) {
            }
        });
    };
    //标记是否完成设置默认值
    $scope.FinishedFuncFlag = false;
    $scope.FinishedFunc = function () {
        $scope.FinishedFuncFlag = true;
        //设置默认值
        SetDefaultSearchValue();

        // 查询条件加载完成
        if ($scope.filterCompleted) {
            $scope.filterCompleted.call($scope);
        }
    };
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
            searchBtnName: $.Lang("GlobalButton.Search"),
            CallFail: $.Lang("BizQuery.CallFail")
        }
    };
    $scope.getLanguage();
    $scope.UserOptions = {
        Editable: true, Visiable: true, OrgUnitVisible: false
    };
    $scope.DepartmentOptions = {
        Editable: true, Visiable: true, UserVisible: false, OrgUnitVisible: true
    };

    //设置查询条件默认值
    var SetDefaultSearchValue = function () {
        var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
        angular.forEach($scope.FilterData, function (data, index, full) {
            //设置成中文值
            if (array.indexOf(data.PropertyName) != -1) {
                data.PropertyName = $.Lang("BizQuery.Propertys." + data.PropertyName);
            }
            if (data.DefaultValue) {
                //文本，时间
                if (data.DisplayType == 0) {
                    if (data.FilterType == 2 && (data.LogicType == 'DateTime' || data.LogicType == 'Int' || data.LogicType == 'Double')) {
                        //范围查询不做处理
                    } else {
                        // $("#" + data.PropertyCode + "").val(data.DefaultValue);
                    }
                }
                    //下拉框
                else if (data.DisplayType == 1) {
                    $("#" + data.PropertyCode + "").val(data.DefaultValue);
                }
                    //单选按钮
                else if (data.DisplayType == 2) {
                    $("input[name='" + data.PropertyCode + "'][value='" + data.DefaultValue + "']").attr("checked", true);
                }
                    //复选按钮
                else if (data.DisplayType == 3) {
                    var a = data.DefaultValue.split(";");
                    angular.forEach(a, function (value, index, full) {
                        if (value != null && value != "") {
                            $("[name='" + data.PropertyCode + "'][value='" + value + "']").attr("checked", true);
                        }
                    })
                }
                    //选人控件
                else if (data.DisplayType == 5) {
                    //Todo  此处定时操作会引起党存在多个选人控件的时候 个别选人控件会渲染失效。 暂时无更好方案代替
                    var setValue = $interval(function () {
                        if ($("#" + data.PropertyCode).SheetUser) {
                            $("#" + data.PropertyCode).SheetUser().SetValue(data.DefaultValue);
                            $interval.cancel(setValue);
                        }
                    }, 200)
                }
            }
        })
    };
    //获取查询条件值
    var GetSearchConditions = function () {
        var condition = {};
        angular.forEach($scope.FilterData, function (data, index, full) {
            if (data.DisplayType == 0) {
                if (data.FilterType == 2 && (data.LogicType == 'DateTime' || data.LogicType == 'Int' || data.LogicType == 'Long' || data.LogicType == 'Double')) {
                    //范围查询
                    var start = $("#" + data.PropertyCode + "").val();
                    var end = $("#" + data.PropertyCode + "1").val();
                    if (data.LogicType == 'DateTime' && start != "" && end != "") {
                        if (new Date(start).getTime() > new Date(end).getTime()) {
                            $.notify({ message: "时间区间错误", status: "danger" });
                            $("#" + data.PropertyCode + "1").css("color", "red");
                            return false;
                        } else {
                            $("#" + data.PropertyCode + "1").css("color", "#555");
                        }

                    } else {
                        if (parseFloat(start) > parseFloat(end)) {
                            $.notify({ message: "数值区间错误", status: "danger" });
                            $("#" + data.PropertyCode + "1").css("color", "red");
                            return false;
                        } else {
                            $("#" + data.PropertyCode + "1").css("color", "#555");
                        }
                    }
                    condition[data.PropertyCode] = { start: start, end: end };

                } else {
                    condition[data.PropertyCode] = $("#" + data.PropertyCode + "").val();
                }
            } else if (data.DisplayType == 1) {
                condition[data.PropertyCode] = $("#" + data.PropertyCode + " option:selected").val();
            }
            else if (data.DisplayType == 2) {
                condition[data.PropertyCode] = $("input[name='" + data.PropertyCode + "']:checked").val();
            } else if (data.DisplayType == 3) {
                condition[data.PropertyCode] = "";
                $("input[name='" + data.PropertyCode + "']:checked").each(function (dex, element) {
                    condition[data.PropertyCode] = $(element).val() + ";" + condition[data.PropertyCode];
                });
            } else if (data.DisplayType == 5) {
                if ($("#" + data.PropertyCode).SheetUser) {
                    if ($scope.initComplete) {
                        condition[data.PropertyCode] = $("#" + data.PropertyCode).SheetUser().GetValue();
                    }
                }
            }
        })
        condition = JSON.stringify(condition);
        return condition;
    };
    $scope.getColumns = function () {
        var columns = [];
        angular.forEach($scope.GirdColumns, function (data, index, full) {
            if (data.name == "IndexNo") {
                columns.push({
                    "mData": "IndexNo",
                    "bSortable": false,
                    "width": 40,
                    "mRender": function (data, type, full, index) {
                        return startNo + index.row + 1;
                    }
                });
            } else if (data.name == "ChooseObjectID") {
                columns.push({
                    "mData": "ObjectID",
                    "bSortable": false,
                    "width": 40,
                    "mRender": function (data, type, full) {
                        return '<input type="radio" name="selectRow" ng-model="SelectBizObjectId" value="' + data + '" />';
                    }
                });
            } else if (data.name != "ChooseObjectID" && data.name != "IndexNo") {
                columns.push({
                    "mData": data.name,
                    "bSortable": (data.type == "HyperLink" || data.type == "TimeSpan") ? false : true,
                    "width": data.width || 40,
                    "mRender": function (data, type, full) {
                        if (typeof (data) == "string" && data.indexOf("Date") >= 0) {
                            data = datecalculation.changeDateFormat(data);
                        }

                        if (data && (data + "").indexOf("</a>") == -1) {
                            return "<span title='" + data + "'>" + data + "</span>"
                        }
                        return data;
                    }
                });
            }
        })
        return columns;
    };
    var startNo = 0;//记录当前页的初始序号
    $scope.BizViewOptions = function () {
        var options = {
            "bProcessing": true,
            "bAutoWidth": false,     //  自动计算宽度
            "bServerSide": true,    // 是否读取服务器分页
            "paging": true,         // 是否启用分页
            "bPaginate": true,      // 分页按钮  
            "bLengthChange": false, // 每页显示多少数据
            "bFilter": false,        // 是否显示搜索栏  
            "searchDelay": 1000,    // 延迟搜索
            "iDisplayLength": 10,   // 每页显示行数  
            "bSort": true,         // 排序    
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
            "sAjaxSource": "RunBizQuery/GetGridDataForPortal",
            "fnServerData": function (sSource, aDataSet, fnCallback) {
                for (var key in aDataSet) {
                    if (aDataSet[key].name == "iDisplayStart") {
                        startNo = aDataSet[key].value;
                        break;
                    }
                }
                $.ajax({
                    "dataType": 'json',
                    "type": 'POST',
                    "url": sSource,
                    "data": aDataSet,
                    "success": function (json) {
                        json = $scope.onBeforeShowData(json);
                         
                        if ($scope.fnCallback) {
                            json = $scope.fnCallback.call($scope, json);
                        }
                        fnCallback(json);
                        if (json.JavaScriptExtend) {
                            json.JavaScriptExtend = json.JavaScriptExtend.replace(/&amp;&amp;/g, '&&');
                            var javaScriptTemp = $("<script type='text/javascript' id='JavaScriptExtend'>" + json.JavaScriptExtend + " </script>");
                            $('body').append(javaScriptTemp);
                        }
                    },
                    "error": function (json) {
                        $.notify({ message: "服务器内部错误", status: "danger" });
                    }
                });
            },
            "fnServerParams": function (aoData) {  // 增加自定义查询条件
                if (!$scope.FinishedFuncFlag) {
                    $scope.FinishedFunc();
                }
                $scope.Conditions = GetSearchConditions();
                aoData.push(
                    { "name": "schemaCode", "value": $scope.SchemaCode },
                    { "name": "queryCode", "value": $scope.QueryCode },
                    { "name": "filterStr", "value": $scope.Conditions },
                    { "name": "random", "value": new Date().getTime() }
                    );
            },
            "sAjaxDataProp": 'Rows',
            "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
            "sPaginationType": "full_numbers",
            "aoColumns": $scope.getColumns(),
            "initComplete": function (settings, json) {
                $("#BizViewTable").find("th:first").removeClass("sorting_asc");//解决问题：配置不需要排序，但是却有排序的图标
                $scope.initComplete = true;
                var filter = $(".searchBtn");
                filter.find("a").unbind("click.DT").bind("click.DT", function () {
                    $("#BizViewTable").dataTable().fnDraw();
                });
            },
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                if ($scope.fnRowCallback) {
                    $scope.fnRowCallback.call(this, nRow, aData, iDisplayIndex, iDisplayIndexFull);
                }
                $compile(nRow)($scope);
                $(nRow).bind("click", function () {
                    $scope.$apply(function () {
                        $scope.SelectBizObjectId = aData.ObjectID;
                    })
                })
            },
            "fnDrawCallback": function () {
                $("#BizViewTable").find("th:first").removeClass("sorting_asc");
                jqdatables.trcss();

                if ($scope.fnDrawCallback) {
                    $scope.fnDrawCallback.call(this, nRow, aData, iDisplayIndex, iDisplayIndexFull);
                }
            }
        }
        return options;
    };
    $scope.onBeforeShowData = function (json) {
        for (var i = 0; i < json.Rows.length; i++) {
            var row = json.Rows[i];
            for (var p in row) {
                //时间格式
                if (typeof (row[p]) == "string" && row[p].match(/^\/Date\(\-*[0-9]+\)\/$/)) {
                    var d = new Date();
                    var dateValue = parseFloat(row[p].match(/\-*[0-9]+/)[0]);
                    if (parseInt(dateValue) > 0) {
                        d.setTime(dateValue);
                        if (typeof ($scope.DisplayFormats) != "undefined" && $scope.DisplayFormats && $scope.DisplayFormats[p]) {
                            row[p] = $filter("date")(d, $scope.DisplayFormats[p]);
                        } else {
                            row[p] = $filter("date")(d, "yyyy/MM/dd hh:mm:ss");
                        }
                    }
                    else {
                        row[p] = "";
                    }
                } else {

                    //格式转换
                    if (typeof ($scope.DisplayFormats) != "undefined" && $scope.DisplayFormats && $scope.DisplayFormats[p]) {
                        var val = $scope.DisplayFormats[p];
                        var matches = $scope.DisplayFormats[p].match(/{[A-z]+[A-z0-9]*}/g);
                        if (matches) {
                            $(matches).each(function () {
                                var _propertyName = this.match(/[A-z]+/)[0];
                                if (row[_propertyName]) {
                                    val = val.replace(this, row[_propertyName]);
                                }
                                else {
                                    val = val.replace(this, "");
                                }
                            });
                        }
                        row[p] = val;
                    }
                }
            }
            if (row.ObjectID) {
                CurrentRows[row.ObjectID] = row;
            }

        }
        return json
    };
    var EditBizObjectUrl = $.Controller.RunBizQuery.EditBizObject.replace("..", "");
    var Param_BizObjectID = "BizObjectID";
    var Param_SchemaCode = "SchemaCode";
    var NotifyObj = null;
    //功能按钮
    $scope.InvokeMethod = function (BizMethodName, DisplayName, IfConfirm) {
        var bizObjectId = GetSelectedBizObjectId();
        if (bizObjectId) {
            //调用方法业务对象(ID为bizObjectId)的方法(methodName)
            if (IfConfirm) {
                // 弹出模态框
                var modalInstance = $modal.open({
                    templateUrl: 'template/ProcessCenter/ConfirmModal.html',
                    size: "sm",
                    controller: function ($scope, $modalInstance) {
                        $scope.Title = $translate.instant("WarnOfNotMetCondition.Tips");
                        $scope.Message = "将执行方法[" + DisplayName + "]?";
                        $scope.Button_OK = true;
                        $scope.Button_OK_Text = $translate.instant("QueryTableColumn.Button_OK");
                        $scope.Button_Cancel = true;
                        $scope.Button_Cancel_Text = $translate.instant("QueryTableColumn.Button_Cancel");
                        $scope.ok = function () {
                            $modalInstance.close();  // 点击确定按钮
                        };
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel'); // 退出
                        }
                    }
                });
                //弹窗点击确定的回调事件
                modalInstance.result.then(function () {
                    DoInvokeMethod(BizMethodName, DisplayName, bizObjectId);
                });
            }
            else {
                DoInvokeMethod(methodName, DisplayName, bizObjectId);
            }
        }
        else {
            if (NotifyObj != null) {
                NotifyObj.close();
            }
            //请选择
            NotifyObj = $.notify({ message: "请选择一项", status: "danger" });
        }
    }
    $scope.OpenSheet = function (BizSheetCode, IfWithID, AfterSave) {
        debugger;
        if (IfWithID) {
            var bizObjectId = GetSelectedBizObjectId();
            if (bizObjectId) {
                //打开表单,参数包含BizObjectID
                window.open(PortalRoot + EditBizObjectUrl + "?" + Param_BizObjectID + "=" + bizObjectId + "&" + Param_SchemaCode + "=" + $scope.SchemaCode + "&SheetCode=" + BizSheetCode + "&Mode=Work&AfterSave=" + (isNaN(AfterSave) ? "" : AfterSave));
            }
            else {
                if (NotifyObj != null) {
                    NotifyObj.close();
                }
                //请选择
                NotifyObj = $.notify({ message: "请选择一项", status: "danger" });
                return;
            }
        }
        else {
            //打开表单,参数不包含BizObjectID,即可新建
            window.open(PortalRoot + EditBizObjectUrl + "?SheetCode=" + BizSheetCode + "&Mode=Originate&" + Param_SchemaCode + "=" + $scope.SchemaCode + "&AfterSave=" + (isNaN(AfterSave) ? "" : AfterSave));
        }
    }
    $scope.OpenUrl = function (url, IfWithID) {
        var bizObjectId = GetSelectedBizObjectId();
        if (bizObjectId) {
            url = url.replace(/{BizObjectID}/g, bizObjectId).replace(/{ObjectID}/g, bizObjectId);
            //参数: 业务对象ID
            if (CurrentRows[bizObjectId] && url.match(/{[_A-z0-9]+}/g)) {
                $(url.match(/{[_A-z0-9]+}/g)).each(function () {
                    var p = this.match(/[_A-z0-9]+/);
                    url = url.replace(this, CurrentRows[bizObjectId][p] || "");
                });
            }
        }
        else if (url.indexOf("{") > -1 && url.indexOf("}") > -1 && url.indexOf("{") < url.indexOf("}")) {
            //请选择
            if (NotifyObj != null) {
                NotifyObj.close();
            }
            //请选择
            NotifyObj = $.notify({ message: "请选择一项", status: "danger" });
            return;
        }
        //else {
        window.open(url);
        // }
    }
    var GetSelectedBizObjectId = function () {
        if ($scope.SelectBizObjectId) {
            return $scope.SelectBizObjectId;
        } else {
            return;
        }
    }
    var DoInvokeMethod = function (methodName, displayName, bizObjectId) {
        var Param_BizObjectID = "BizObjectID";
        var Param_SchemaCode = "SchemaCode";
        var BizObjectHandlerUrl = $.Controller.RunBizQuery.InvokeMethod.replace("../", "");
        $.ajax({
            type: "post",
            url: BizObjectHandlerUrl,
            cache: false,
            async: false,
            dataType: "json",
            data: {
                bizSchemaCode: $stateParams.SchemaCode,//SchemaCode,
                bizObjectID: bizObjectId,
                methodName: methodName
            },
            success: function (result) {
                if (result == "PortalSessionOut") {
                    //显示或者打开登录对话框
                    $state.go("platform.login", { ParamUrl: "" });
                }
                if (result.Result) {
                    if (result.NeedRefresh) {
                        //方法执行成功后刷新页面
                        $state.go($state.$current.self.name, {}, { reload: true });
                    }
                    else {
                        $.notify({ message: (displayName || methodName) + "执行完成", status: "success" });
                    }
                }
                else {
                    var content = "[" + displayName + "]";
                    content += $scope.LanJson.CallFail;
                    if (result.Errors) {
                        content += ":";
                        content += $.Lang(result.Errors[0]);
                    }
                    $.notify({ message: content, status: "danger" });
                }
            },
            error: function (msg) {
                var content = "调用失败:";
                if (msg.status == "500") {
                    content += "服务器内部错误";
                }
                else {
                    content += msg.statusText;
                }
                $.notify({ message: content, status: "danger" });
            }
        });
    }
}]);