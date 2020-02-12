//交叉分析表

//#region 变量
// 行标题数组，最后保存到数据库，转为字符串
var RowTitle = null;
//#endregion

//#region 初始化的虚拟方法
function AbstractFun() {
    //是否支持钻取
    ckSupportDrill = $("#ckSupportDrill");
    //钻取配置模块:默认隐藏
    DrillPanel = $("#DrillPanel").hide();
    //钻取方式
    slSelectType = $("#slSelectType");
    //选择图表
    slReportCode = $("#slReportCode");
    //选择的图表，至少有一个
    ckCharts = $("input[type='checkbox'][name='ckCharts']");
    //默认图表
    SelChartType = $("#SelChartType");
    //x轴
    SelAxisDimension = $("#SelAxisDimension");
    //Y坐标轴单位
    txtAxisUnit = $("#txtAxisUnit");
    //X坐标轴单位
    txtXAxisUnit = $("#txtXAxisUnit");

    //默认选一个
    ckCharts.prop("checked", true);

    slRowTitleId1 = $("#slRowTitleId1");
    txtRowParamName1 = $("#txtRowParamName1");
    slRowTitleId2 = $("#slRowTitleId2");
    txtRowParamName2 = $("#txtRowParamName2");
    slColumnTitleId = $("#slColumnTitleId");
    txtColumnParamName = $("#txtColumnParamName");

    //选择改变事件
    ckCharts.change(function () {
        SelChartType.html("");
        ckCharts.each(function () {
            if ($(this).prop("checked")) {
                SelChartType.append("<option value='" + $(this).val() + "'>" + GetChartName($(this).val()) + "</option>");
            }
        });
        if (SelChartType.html() == "") {
            ShowWarn(T("Script_RP_OneChart", "至少有一个图表!"));
            ckCharts.first().prop("checked", true);
            ckCharts.change();
        }
    });
    ckCharts.change();

    //注册事件
    ckSupportDrill.change(function () {
        if (ckSupportDrill.prop("checked")) {
            DrillPanel.show();
        }
        else {
            DrillPanel.hide();
        }
    });

    slSelectType.change(function () {
        if (slSelectType.val() == "0") {//选择当前报表
            slReportCode.closest("tr").hide();
        }
        else {
            slReportCode.closest("tr").show();
            LoadReportCodes();
        }
    });
    slSelectType.change();
}
//#endregion

//#region 获取报表的显示名称
function GetChartName(ChartType) {
    switch (ChartType) {
        case EnumChartType.Line:
            return T("ReportViewManager_Line", "折线图");

        case EnumChartType.Bar:
            return T("ReportTemplate_Histogram", "柱状图");

        case EnumChartType.Pie:
            return T("ReportTemplate_Pie", "饼图");

        case EnumChartType.Area:
            return T("ReportViewManager_Area", "面积图");

        case EnumChartType.Radar:
            return T("ReportViewManager_Radar", "雷达图");
    }
}
//#endregion

//#region 加载钻取可选择报表模板数据
function LoadReportCodes() {
    //已经加载过的话，就返回
    if (slReportCode.attr("IsLoaded") == "true") return;
    //加载报表模板数据
    PostAjax($.Controller.ReportTemplate.LoadReportCodes,null, function (data) {
        slReportCode.attr("IsLoaded", "true");
        for (var i in data) {
            slReportCode.append("<option value='" + data[i].Value + "'>" + data[i].Text + "[" + data[i].Value + "]" + "</option>");
        }
        if (ReportTemplate.DrillCode != null && ReportTemplate.DrillCode != "") {
            slReportCode.val(ReportTemplate.DrillCode);
        }
    });
}
//#endregion

//#region 编辑状态，加载完报表模板配置数据
function LoadReportTemplateComplete(result) {
    if (!result.Success) {
        $.H3Dialog.Warn({ content: $.Lang(result.Message) });
        return false;
    } else {
        data = result.Extend;
    }
    //从数据库读取数据
    ReportTemplate = data.ReportTemplate;
    CurrentSource = data.ReportSource;
    ResourceDatas[CurrentSource.Code] = data.SourceData;

    //编辑模式
    ReportTemplate.IsEdit = true;
    //将后台读取到的枚举值，数值的，改为字符串
    switch (ReportTemplate.DefaultChart) {
        case 0:
        case "0":
            ReportTemplate.DefaultChart = EnumChartType.Line;
            break;
        case 1:
        case "1":
            ReportTemplate.DefaultChart = EnumChartType.Bar;
            break;
        case 2:
        case "2":
            ReportTemplate.DefaultChart = EnumChartType.Pie;
            break;
        case 3:
        case "3":
            ReportTemplate.DefaultChart = EnumChartType.Area;
        case 4:
        case "4":
            ReportTemplate.DefaultChart = EnumChartType.Radar;
            break;
        default:
            ReportTemplate.DefaultChart = EnumChartType.Line;
    }
    //默认值
    SelChartType.val(ReportTemplate.DefaultChart);

    ckCharts.prop("checked", false);
    for (var i in ReportTemplate.Charts) {
        $("input[type='checkbox'][name='ckCharts']").eq(ReportTemplate.Charts[i]).prop("checked", true);
    }

    SelAxisDimension.val(ReportTemplate.AxisDimension);
    txtAxisUnit.val(ReportTemplate.AxisUnit);
    txtXAxisUnit.val(ReportTemplate.XAxisUnit);

    //隐藏数据源选择，编辑下数据源不允许修改
    $("#divReportSource").html(CurrentSource.DisplayName);
    txtCode.val(ReportTemplate.Code);
    txtDisplayName.val(ReportTemplate.DisplayName);
    txtCode.SetDisabled();

    //存在钻取的图表
    if (ReportTemplate.DrillCode != null && ReportTemplate.DrillCode != "") {
        //启用钻取
        ckSupportDrill.prop("checked", true);
        ckSupportDrill.change();
        //判断是否选择当前报表
        if (ReportTemplate.DrillCode == ReportTemplate.Code) {
            slSelectType.val("0");
        }
        else {
            slSelectType.val("1");
        }
        slSelectType.change();
    }

    //加载数据源的可选择字段
    LoadTree(ObjectClone(CurrentSource.Columns));

    RowTitle = ReportTemplate.RowTitle == null ? null : ReportTemplate.RowTitle.split(";");
    ShowColumnTitle();
    if (ReportTemplate.Columns != null && ReportTemplate.Columns.length > 0) {
        if (ReportTemplate.Columns.length > 1)
            $("#ColumnSetting").find("tr:first").html("");
        for (var i in ReportTemplate.Columns)
            ShowCountColumn(ReportTemplate.Columns[i]);
    }

    //过滤条件
    ParameterColumns = ReportTemplate.Parameters;
    if (ParameterColumns != null) {
        for (var i = 0, j = ParameterColumns.length; i < j; i++) {
            AddToParamsSetting(ParameterColumns[i]);
        }
    }

    CreateRowTitleData();
}
//#endregion

//#region 字段树拖动事件

//#region树节点拖动事件
function onDragging(g, p, current, e) {
    var nodedata = this.draggingNode;
    if (!nodedata) return false;
    //自定义列头页不能拖拽
    if (nodedata.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn) return false;
    var nodes = this.draggingNodes ? this.draggingNodes : [nodedata];
    if (g.nodeDropIn == null) g.nodeDropIn = -1;
    var pageX = e.pageX;
    var pageY = e.pageY;
    var visit = false;
    var validRange = this.validRange;

    if ((($(e.target).closest("table").hasClass("CrossSettingTable") && e.target.id != "paramsSetting")
        || (e.target.id == "paramsSetting" && nodedata.ReportSourceColumnType == EnumReportSourceColumnType.TableColumn))
        && nodedata.ReportSourceColumnType != EnumReportSourceColumnType.CustomColumn
        && $(e.target).closest("table").attr("id") != "ReportDataView") {
        this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-add").addClass("l-drop-yes");
    }
    else {
        this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes  l-drop-add").addClass("l-drop-no");
    }
    return false;
}
//#endregion

//#region树节点拖动停止事件
function onStopDrag(g, p, current, e) {
    if (!this.draggingNodes || !this.draggingNodes.length) return false;
    var dragNode = this.draggingNodes[0];
    var tableObj = $(e.target).closest("table");
    if (tableObj.attr("id") == "ColumnTitleSetting") {
        //添加列标题
        AddColumnTitle(dragNode);
    }
    else if (tableObj.attr("id") == "RowTitleSetting") {
        //添加行标题
        AddRowTitle(dragNode);
    }
    else if (tableObj.attr("id") == "ColumnSetting") {
        //添加统计字段
        AddColumn(dragNode);
    }
    else if (e.target.id == "paramsSetting" && dragNode.ReportSourceColumnType == EnumReportSourceColumnType.TableColumn) {
        //添加参数
        AddParamColumn(dragNode);
    }

    return false;
}
//#endregion

//#endregion

//#region 清空数据
function ClearData() {
    ClearColumns();
    ParameterColumns.length = 0;
    ColumnPanel.hide();
    ParamPanel.hide();
    ColumnPanel.removeAttr("TemplateKey");
    ParamPanel.removeAttr("ColumnCode");
    $("#paramsSetting").html("");

    //清除列、行标题和统计字段
    ClearColumnTitle();
    ClearRowTitle();
    ClearColumnsData();
    $("#ReportDataView").html("");
}
//#endregion

//#region 取出某列的数据,不重复,且过滤掉空数据
function GetColumnData(ColumnName) {
    //没有配置列标题，直接返回null数据
    if (ColumnName == null) return null;

    var columnDatas = new Array();
    //Error:此处用了缓存，有可能该列就没数据
    var sourceDatas = ObjectClone(ResourceDatas[CurrentSource.Code].Rows);
    for (var i in sourceDatas) {
        var isExist = false;
        if (sourceDatas[i][ColumnName] == null) continue;
        for (var j in columnDatas) {
            if (columnDatas[j] == sourceDatas[i][ColumnName]) {
                isExist = true;
                break;
            }
        }
        if (isExist) continue;
        columnDatas.push(sourceDatas[i][ColumnName]);
    }

    return columnDatas;
}
//#endregion

//#region  列标题相关事件

//#region 添加列标题
function AddColumnTitle() {
    if (RowTitle != null && ReportTemplate.Columns != null && ReportTemplate.Columns.length > 1) {
        ShowWarn(T("Script_RP_Warn6", "有行标题，且统计字段多于1个时，不允许添加列标题!"));
        return;
    }

    ReportTemplate.ColumnTitle = arguments[0].ColumnCode;
    var drillParam = new DrillParam();
    drillParam.Title = drillParam.Code = drillParam.Name = arguments[0].ColumnCode;
    ReportTemplate.ColumnDrillParam = drillParam;
    ShowColumnTitle();
    LoadGird();
};
//#endregion

//#region 显示列标题
function ShowColumnTitle() {
    if (ReportTemplate.ColumnTitle == null || ReportTemplate.ColumnTitle == "") return;
    var tableObj = $("#ColumnTitleSetting");
    var columns = GetColumnData(ReportTemplate.ColumnTitle);
    var colWidth = (100.00 / columns.length) + "%";
    //列头只能一列
    if (ReportTemplate.ColumnTitle != null) {
        tableObj.find("thead>tr").remove();
    }

    var trRow = $("<tr></tr>");
    for (var i in columns) {
        var tdCell = $("<td>" + columns[i] + "</td>").width(colWidth);
        ColumnTitleDrag(tdCell);
        trRow.append(tdCell);
    }
    if (columns.length == 0) {
        trRow.append("<td></td>");
    }
    tableObj.find("thead").append(trRow);
}
//#endregion

//#region 列标题拖拽事件
function ColumnTitleDrag(tdCell) {
    tdCell.ligerDrag({
        proxyX: 2, proxyY: 2,
        proxy: function (draggable, e) {
            if (ReportTemplate.ColumnTitle == null) return null;
            var obj = (e.target || e.srcElement);
            if (obj.tagName.toLowerCase() == "td") {
                var content = ReportTemplate.ColumnTitle;
                var proxy = $("<div class='l-drag-proxy' name='dragDiv' style='display:none'><div name='dragDiv' class='l-drop-icon l-drop-no'></div></div>").appendTo('body');
                proxy.append(content);
                return proxy;
            }
            return null;
        },
        onDrag: function (current, e) {
            var obj = (e.target || e.srcElement);
            if ($(obj).attr("name") != "dragDiv" && $(obj).closest("table").attr("id") != "ColumnTitleSetting") {
                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no").addClass("l-icon-delete");
                this.action = "delete";
                return;
            }
            else {
                this.proxy.find(".l-drop-icon:first").removeClass("l-icon-delete").addClass("l-drop-no");
                this.action = null;
                return;
            }
        },
        onStopDrag: function (current, e) {
            if (this.action == null) return;
            this.action = null;
            RemoveColumnTitle();
        }
    });
}
//#endregion

//#region 移除列标题
function RemoveColumnTitle() {
    ReportTemplate.ColumnTitle = null;
    ReportTemplate.ColumnDrillParam = null;
    $("#ColumnTitleSetting").find("thead>tr").html("");
    ShowCountColumnAsColumnTitle();
    LoadGird();
}
//#endregion

//#region 清空列标题
function ClearColumnTitle() {
    ReportTemplate.ColumnTitle = null;
    ReportTemplate.ColumnDrillParam = null;
    $("#ColumnTitleSetting").find("thead>tr>td").each(function (i) {
        if (i == 0) {
            $(this).html("");
        }
        else {
            $(this).remove();
        }
    });
}
//#endregion

//#endregion

//#region 行标题相关事件

//#region 清空行标题
function ClearRowTitle() {
    RowTitle = null;
    ReportTemplate.RowDrillParam = null;
    CreateRowTitleData();
}
//#endregion

//#region 添加行标题
function AddRowTitle() {
    var currentCol = ObjectClone(arguments[0]);
    if (RowTitle == null) {
        RowTitle = new Array();
    }
    if (ExistRowTitle(currentCol.ColumnCode)) {
        ShowWarn(T("Script_RP_Warn7", "不允许重复添加行标题!"));
        return;
    }
    if (ReportTemplate.ColumnTitle != null && ReportTemplate.Columns != null && ReportTemplate.Columns.length > 1) {
        ShowWarn(T("Script_RP_Warn8", "有列标题,且有多个统计字段时，不允许添加行标题!"));
        return;
    }
    //自定义列头页不允许添加
    if (currentCol.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn) {
        return;
    }
    if (RowTitle.length > 1) {
        ShowWarn(T("Script_RP_Warn9", "行标题最多只能两个;"));
        return;
    }
    RowTitle.push(currentCol.ColumnCode);

    var rowDrillParam = new DrillParam();
    rowDrillParam.Title = rowDrillParam.Code = rowDrillParam.Name = currentCol.ColumnCode;
    if (ReportTemplate.RowDrillParam == null) {
        ReportTemplate.RowDrillParam = new Array();
    }
    ReportTemplate.RowDrillParam.push(rowDrillParam);

    CreateRowTitleData();
}
//#endregion

//#region 判断是否存在行标题
function ExistRowTitle(ColumnCode) {
    for (var i = 0, j = RowTitle.length; i < j; i++) {
        if (RowTitle[i] == ColumnCode) {
            return true;
        }
    }
    return false;
}
//#endregion

//#region  行标题拖拽事件
function RowTitleTdCellDrag(tdCell) {
    tdCell.ligerDrag({
        proxyX: 2, proxyY: 2,
        proxy: function (draggable, e) {
            if (RowTitle == null) return null;
            var obj = (e.target || e.srcElement);
            var content = $(obj).html();
            var proxy = $("<div class='l-drag-proxy' name='dragDiv' style='display:none'><div class='l-drop-icon l-drop-no' name='dragDiv'></div></div>").appendTo('body');
            proxy.append(content);
            return proxy;
        },
        onDrag: function (current, e) {
            var obj = (e.target || e.srcElement);
            if ($(obj).attr("name") != "dragDiv" && $(obj).closest("table").attr("id") != "RowTitleSetting") {
                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no").addClass("l-icon-delete");
                this.action = "delete";
                return;
            }
            else {
                this.proxy.find(".l-drop-icon:first").removeClass("l-icon-delete").addClass("l-drop-no");
                this.action = null;
                return;
            }
        },
        onStopDrag: function (current, e) {
            if (this.action == null) return;
            this.action = null;
            var code = this.target.attr("ColumnCode");
            RemoveRowTitle(code);
        }
    });
}
//#endregion

//#region 移除行标题
function RemoveRowTitle(ColumnCode) {
    var index = $.inArray(ColumnCode, RowTitle);
    RowTitle.splice(index, 1);
    if (RowTitle.length == 0) RowTitle = null;

    if (ReportTemplate.RowDrillParam != null) {
        for (var i = 0; i < ReportTemplate.RowDrillParam.length; i++) {
            if (ReportTemplate.RowDrillParam[i].Title == ColumnCode) {
                index = i;
                break;
            }
        }
        ReportTemplate.RowDrillParam.splice(index, 1);
        if (ReportTemplate.RowDrillParam.length == 0) ReportTemplate.RowDrillParam = null;
    }
    CreateRowTitleData();
}
//#endregion

//#region 构造行标题数据
function CreateRowTitleData() {
    var tableObj = $("#RowTitleSetting");
    var trLength = tableObj.find("tr").length - 1;
    tableObj.find("tr").each(function (i) {
        //不是第一个或最后一个时，移除
        if (i != 0 && i != trLength) {
            $(this).remove();
        }
        else {
            $(this).find("td").each(function (i) {
                if (i == 0) {
                    $(this).html("");
                }
                else {
                    $(this).remove();
                }
            });
        }
    });

    if (RowTitle != null && RowTitle.length > 0) {
        for (var i in RowTitle) {
            var ColumnCode = RowTitle[i];
            var SourceColumn = GetColumnFromCurrentSource(ColumnCode);
            var columns = GetColumnData(ColumnCode);
            var isFirtRowTitle = i == 0;
            var trLen = tableObj.find("tr").length - 1;

            tableObj.find("tr").each(function (i) {
                if (i == 0) {
                    if (isFirtRowTitle) {
                        $(this).find("td").attr("ColumnCode", ColumnCode).html(SourceColumn.DisplayName);
                        RowTitleTdCellDrag($(this).find("td"));
                    }
                    else {
                        var tdCell = $("<td>" + SourceColumn.DisplayName + "</td>").attr("ColumnCode", ColumnCode);
                        //tdCell.dblclick(RemoveRowTitle);
                        RowTitleTdCellDrag(tdCell);

                        $(this).append(tdCell);
                    }
                }
                else {
                    if (isFirtRowTitle) {
                        for (var j in columns) {
                            $(this).before($("<tr></tr>").append($("<td>" + columns[j] + "</td>").attr("ColumnCode", ColumnCode)));
                        }
                    }
                    else {
                        var tdCell = $("<td></td>");
                        if (i != trLen) {
                            var newTable = $("<table class='CrossSettingTable'></table>");
                            for (var j in columns) {
                                var newtrTrow = $("<tr><td>" + columns[j] + "</td></tr>");
                                newTable.append(newtrTrow);
                            }
                            tdCell.attr("ColumnCode", ColumnCode).append(newTable);
                        }
                        $(this).append(tdCell);
                    }
                }
            });
        }
    }
    LoadGird();
}
//#endregion

function GetColumnFromCurrentSource(ColumnCode) {
    for (var i in CurrentSource.Columns) {
        if (CurrentSource.Columns[i].ColumnCode == ColumnCode)
            return CurrentSource.Columns[i];
    }
}

//#endregion

//#region 统计字段相关事件

//#region 添加统计字段
function AddColumn() {
    var currentCol = ObjectClone(arguments[0]);

    //decimal类型的字段，才能用于统计
    if (currentCol.DataType == EnumDataType.DateTime) {
        ShowWarn(T("Script_RP_Warn11", "日期不能作为统计字段!"));
        return;
    }

    if (currentCol.DataType == EnumDataType.String) {
        currentCol.FunctionType = EnumFunctionType.Count;
    }

    if (ExistColumn(currentCol)) {
        ShowWarn(T("Script_RP_Warn10", "已经添加过该字段!"));
        return;
    }

    //有行标题 且有列标题时；只能有一个统计字段,清空原来的，添加新的
    if (RowTitle != null && ReportTemplate.ColumnTitle != null) {
        ClearColumnsData();
    }

    if (ReportTemplate.Columns == null) {
        ReportTemplate.Columns = new Array();
    }

    ReportTemplate.Columns.push(currentCol);
    ShowCountColumn(currentCol);
    LoadGird();
}
//#endregion

//#region 校验是否已经存在
function ExistColumn(currentCol) {
    if (ReportTemplate.Columns == null) return false;
    for (var i in ReportTemplate.Columns) {
        if (ReportTemplate.Columns[i].ColumnCode == currentCol.ColumnCode) {
            return true;
        }
    }
    return false;
}
//#endregion

//#region 清空统计字段
function ClearColumnsData() {
    ReportTemplate.Columns = null;
    $("#ColumnSetting").find("tr:first>td").each(function (i) {
        if (i == 0) {
            $(this).html("");
        }
        else {
            $(this).remove();
        }
    });
    ColumnPanel.hide();
    ColumnPanel.removeAttr("ColumnCode");
}
//#endregion

//#region 显示统计字段
function ShowCountColumn(currentCol) {
    var linkObj = $("<a href='javascript:ColumnCell_Click(\"" + currentCol.ColumnCode + "\");' >" + currentCol.DisplayName + "</a>");
    if (ReportTemplate.Columns.length == 1) {
        $("#ColumnSetting").find("tr:first>td").attr("ColumnCode", currentCol.ColumnCode).append(linkObj);
        ColumnCellDrag($("#ColumnSetting").find("tr:first>td"));
    }
    else {
        var tdCell = $("<td></td>").attr("ColumnCode", currentCol.ColumnCode).append(linkObj);
        $("#ColumnSetting").find("tr:first").append(tdCell);
        ColumnCellDrag(tdCell);
    }

    ShowCountColumnAsColumnTitle();
}
//#endregion


//#region 统计字段作为列头显示
function ShowCountColumnAsColumnTitle() {
    //没有列头的时候，统计字段作为列头
    if (ReportTemplate.ColumnTitle == null) {
        var tableObj = $("#ColumnTitleSetting");
        var headRow = tableObj.find("thead>tr");
        headRow.html("");
        if (ReportTemplate.Columns == null) {
            headRow.append("<td></td>");
            return;
        }
        var colWidth = (100.00 / ReportTemplate.Columns.length) + "%";
        for (var i in ReportTemplate.Columns) {
            var tdCell = $("<td ColumnCode='" + ReportTemplate.Columns[i].ColumnCode + "'>" + ReportTemplate.Columns[i].DisplayName + "</td>").width(colWidth);
            headRow.append(tdCell);
        }
    }
}
//#endregion

//#region  统计字段点击事件
function ColumnCell_Click(ColumnCode) {
    ParamPanel.hide();
    ParamPanel.removeAttr("ColumnCode");
    ColumnPanel.show();
    ColumnPanel.attr("ColumnCode", ColumnCode);
    for (var i = 0, j = ReportTemplate.Columns.length; i < j; i++) {
        if (ReportTemplate.Columns[i].ColumnCode == ColumnCode) {
            $("#lbColumnCode").html(ReportTemplate.Columns[i].ColumnCode);
            txtColumnDisplayName.val(ReportTemplate.Columns[i].DisplayName);
            if (ReportTemplate.Columns[i].DataType == EnumDataType.Numeric) {
                slFunctionType.closest("tr").show();
                slFunctionType.val(ReportTemplate.Columns[i].FunctionType);
            }
            else {
                slFunctionType.closest("tr").hide();
            }
            break;
        }
    }
}
//#endregion

//#region 绑定统计字段拖拽事件
function ColumnCellDrag(tdCell) {
    tdCell.ligerDrag({
        proxyX: 2, proxyY: 2,
        proxy: function (draggable, e) {
            if (ReportTemplate.Columns == null) return null;
            var obj = (e.target || e.srcElement);
            if (obj.tagName.toLowerCase() == "td") {
                var content = $(obj).html();
                var proxy = $("<div class='l-drag-proxy' name='dragDiv' style='display:none'><div name='dragDiv' class='l-drop-icon l-drop-no'></div></div>").appendTo('body');
                proxy.append(content);
                return proxy;
            }
            return null;
        },
        onDrag: function (current, e) {
            var obj = (e.target || e.srcElement);
            if ($(obj).attr("name") != "dragDiv" && $(obj).closest("table").attr("id") != "ColumnSetting") {
                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no").addClass("l-icon-delete");
                this.action = "delete";
                return;
            }
            else {
                this.proxy.find(".l-drop-icon:first").removeClass("l-icon-delete").addClass("l-drop-no");
                this.action = null;
                return;
            }
        },
        onStopDrag: function (current, e) {
            if (this.action == null) return;
            this.action = null;
            var code = this.target.attr("ColumnCode");
            RemoveCountColumn(code, this.target);
        }
    });
}
//#endregion

//#region 移除统计字段
function RemoveCountColumn(ColumnCode, tdCell) {
    ColumnPanel.hide();
    ColumnPanel.removeAttr("ColumnCode");

    if (ReportTemplate.ColumnTitle == null) {
        var tableObj = $("#ColumnTitleSetting");
        var headRow = tableObj.find("thead>tr");
        headRow.find("td[ColumnCode='" + ColumnCode + "']").remove();

        if (ReportTemplate.Columns.length == 1) {
            headRow.append("<td></td>");
        }
    }
    if (ReportTemplate.Columns == null) {
        LoadGird();
        return;
    }
    if (ReportTemplate.Columns.length == 1) {
        ReportTemplate.Columns = null;
        tdCell.html("");
        LoadGird();
        return;
    }
    for (var i in ReportTemplate.Columns) {
        if (ReportTemplate.Columns[i].ColumnCode == ColumnCode) {
            ReportTemplate.Columns.splice(i, 1);
            tdCell.remove();
            LoadGird();
            return;
        }
    }
}
//#endregion

//#region 汇总类型修改
function slFunctionType_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    for (var i = 0, j = ReportTemplate.Columns.length; i < j; i++) {
        if (ReportTemplate.Columns[i].ColumnCode == ColumnCode) {
            ReportTemplate.Columns[i].FunctionType = slFunctionType.val();
            break;
        }
    }
    LoadGird();
}
//#endregion

//#endregion

//#region 加载表格:重写改功能，表格自己写
function LoadGird() {
    SetDrillParam();
    if (ReportTemplate == null) return null;

    //没有列标题，也没有统计字段时，不展示
    if (ReportTemplate.ColumnTitle == null && ReportTemplate.Columns == null) return null;
    //列数据
    var colDatas = GetColumnData(ReportTemplate.ColumnTitle);
    //配置了列标题
    if (colDatas != null) {
        //配置了行标题，则按行标题分组数据
        if (RowTitle != null && RowTitle.length > 0) {
            var groupsDatas = new Array();//第一分组
            var subGroupsDatas = new Array();//第二分组
            groupsDatas = GetColumnData(RowTitle[0]);//行数据
            if (RowTitle.length > 1) {
                //有两个行标题
                subGroupsDatas = GetColumnData(RowTitle[1]);
                ShowSubGroupData(colDatas, groupsDatas, subGroupsDatas);
            }
            else {
                //只有一个行标题
                ShowGroupData(colDatas, groupsDatas);
            }
        }
        else if (ReportTemplate.Columns != null) {
            //没有行标题,统计字段多于1个时
            ShowColumnData(colDatas);
        }
    }
    else {//没有列标题时的展示
        //没有列标题，也没有统计字段，则不展示数据，返回
        if (ReportTemplate.Columns == null) return;
        //配置了行标题，则按行标题分组数据
        if (RowTitle != null && RowTitle.length > 0) {
            var groupsDatas = new Array();//第一分组
            var subGroupsDatas = new Array();//第二分组
            groupsDatas = GetColumnData(RowTitle[0]);//行数据
            if (RowTitle.length > 1) {
                //有两个行标题
                subGroupsDatas = GetColumnData(RowTitle[1]);
                ShowSubGroupDataWithoutColumnTitle(groupsDatas, subGroupsDatas);
            }
            else {
                //只有一个行标题
                ShowGroupDataWithoutColumnTitle(groupsDatas);
            }
        }
    }
}
//#endregion

//#region 展示分组数据，有一个行标题
//@colDatas 列数据，必填
//@group 第一分组值，必填
function ShowGroupData() {
    var colDatas = arguments[0];
    var groupDatas = arguments[1];
    //列宽
    var colWidth = (100.00 / colDatas.length) + "%";
    //列标题
    var columnTitle = ReportTemplate.ColumnTitle;
    var rowTitle = RowTitle[0];
    //有分组数据时，统计字段最多只能一个
    var column = null;
    if (ReportTemplate.Columns != null && ReportTemplate.Columns.length > 0)
        column = ReportTemplate.Columns[0];


    $("#ReportDataView").html("");
    //开始计算
    for (var i in groupDatas) {
        //每行统计
        var group = groupDatas[i];
        var trRow = $("<tr></tr>");
        for (var j in colDatas) {
            //每列统计
            var col = colDatas[j];
            var tdCell = $("<td></td>").width(colWidth).html(GetSummaryResult(column, col, group));
            trRow.append(tdCell);
        }
        //添加到界面里
        $("#ReportDataView").append(trRow);
    }
}
//#endregion

//#region 展示分组数据，有一个行标题
//@group 第一分组值，必填
function ShowGroupDataWithoutColumnTitle() {
    var groupDatas = arguments[0];
    //列宽
    var colWidth = (100.00 / ReportTemplate.Columns.length) + "%";
    var rowTitle = RowTitle[0];

    $("#ReportDataView").html("");
    //开始计算
    for (var i in groupDatas) {
        //每行统计
        var group = groupDatas[i];
        var trRow = $("<tr></tr>");
        for (var j in ReportTemplate.Columns) {
            //每列统计
            var column = ReportTemplate.Columns[j];
            var tdCell = $("<td></td>").width(colWidth).html(GetSummaryResult(column, null, group));
            trRow.append(tdCell);
        }
        //添加到界面里
        $("#ReportDataView").append(trRow);
    }
}
//#endregion

//#region 有列标题,展示多层分组数据 (两个行标题)
//@colDatas 列标题数据，必填
//@groupDatas 第一分组值，必填
//@subGroupsDatas 第二分组值，必填
function ShowSubGroupData() {
    var colDatas = arguments[0];
    var groupDatas = arguments[1];
    var subGroupsDatas = arguments[2];

    //列宽
    var colWidth = (100.00 / colDatas.length) + "%";

    //有分组数据时，统计字段最多只能一个
    var column = null;
    if (ReportTemplate.Columns != null && ReportTemplate.Columns.length > 0)
        column = ReportTemplate.Columns[0];

    $("#ReportDataView").html("");
    //开始计算
    for (var i in groupDatas) {
        //每行统计
        var group = groupDatas[i];
        for (var k in subGroupsDatas) {
            var subgroup = subGroupsDatas[k];
            var trRow = $("<tr></tr>");
            for (var j in colDatas) {
                var col = colDatas[j];
                var tdCell = $("<td></td>").width(colWidth).html(GetSummaryResult(column, col, group, subgroup));
                trRow.append(tdCell);
            }
            //添加到界面里
            $("#ReportDataView").append(trRow);
        }
    }
}
//#endregion

//#region 没有列标题时，展示多层分组数据（两个行标题）
//@groupDatas 第一分组值，必填
//@subGroupsDatas 第二分组值，必填
function ShowSubGroupDataWithoutColumnTitle() {
    var groupDatas = arguments[0];
    var subGroupsDatas = arguments[1];

    var rowTitle = RowTitle[0];
    var subRowTitle = RowTitle[1];

    //列宽
    var colWidth = (100.00 / ReportTemplate.Columns.length) + "%";

    $("#ReportDataView").html("");
    //开始计算
    for (var i in groupDatas) {
        //每行统计
        var group = groupDatas[i];
        for (var k in subGroupsDatas) {
            var subgroup = subGroupsDatas[k];
            var trRow = $("<tr></tr>");
            for (var j in ReportTemplate.Columns) {
                var column = ReportTemplate.Columns[j];
                var tdCell = $("<td></td>").width(colWidth).html(GetSummaryResult(column, null, group, subgroup));
                trRow.append(tdCell);
            }
            //添加到界面里
            $("#ReportDataView").append(trRow);
        }
    }
}
//#endregion

//#region 展示统计字段数据，没有行标题数据
//@colDatas 列数据
function ShowColumnData() {
    //如果没有统计字段的时候，直接返回
    if (ReportTemplate.Columns == null) return;
    var colDatas = arguments[0];
    $("#ReportDataView").html("");
    //列宽
    var colWidth = (100.00 / colDatas.length) + "%";
    var tableObj = $("#RowTitleSetting");
    var trLength = tableObj.find("tr").length - 1;
    tableObj.find("tr").each(function (i) {
        //不是第一个或最后一个时，移除
        if (i != 0 && i != trLength) {
            $(this).remove();
        }
        else {
            $(this).find("td").each(function (i) {
                if (i == 0) {
                    $(this).html("");
                }
                else {
                    $(this).remove();
                }
            });
        }
    });

    for (var i in ReportTemplate.Columns) {
        var trRow = $("<tr></tr>");
        for (var j in colDatas) {
            col = colDatas[j];
            var tdCell = $("<td></td>").width(colWidth).html(GetSummaryResult(ReportTemplate.Columns[i], col));
            trRow.append(tdCell);
        }
        tableObj.find("thead:first").append("<tr><td>" + ReportTemplate.Columns[i].DisplayName + "[" + GetFunctionType(ReportTemplate.Columns[i].FunctionType) + "]" + "</td></tr>");
        $("#ReportDataView").append(trRow);
    }
}
//#endregion

//#region 获取计算结果
//@column:统计字段信息
//@coldata:列数据
//@group:第一分组数据
//@subgroup:第二分组数据
function GetSummaryResult(column, coldata, group, subgroup) {
    //列标题
    var columnTitle = ReportTemplate.ColumnTitle;
    var rowTitle = null;
    if (group != null)
        rowTitle = RowTitle[0];
    var subRowTitle = null;
    if (subgroup != null)
        subRowTitle = RowTitle[1];

    var sourceDatas = ObjectClone(ResourceDatas[CurrentSource.Code].Rows);
    //统计数据
    var summary = 0;
    var datacount = 0;
    for (var i in sourceDatas) {
        var source = sourceDatas[i];
        if (!IsFindRow(source, coldata, group, subgroup)) continue;
        datacount++;
        if (column == null)
            summary++;
        else {
            switch (parseInt(column.FunctionType)) {
                case EnumFunctionType.Count:
                    summary++;
                    break;
                case EnumFunctionType.Sum:
                case EnumFunctionType.Avg:
                    if (!isNaN(source[column.ColumnCode]))
                        summary += source[column.ColumnCode];
                    break;
                case EnumFunctionType.Min:
                    if (!isNaN(source[column.ColumnCode]) && summary > source[column.ColumnCode])
                        summary = source[column.ColumnCode];
                    break;
                case EnumFunctionType.Max:
                    if (!isNaN(source[column.ColumnCode]) && summary < source[column.ColumnCode])
                        summary = source[column.ColumnCode];
                    break;
            }
        }
    }
    if (column != null && parseInt(column.FunctionType) == EnumFunctionType.Avg)
        summary = datacount > 0 ? summary / datacount : 0;
    return summary;
}
//#endregion

//#region 校验数据是否满足条件
//@rowdata 数据源的行数据
//@coldata 列数据
//groupdata 第一分组数据
//subgroupdata 第二分组数据
function IsFindRow(rowdata, coldata, groupdata, subgroupdata) {
    //列标题
    var columnTitle = ReportTemplate.ColumnTitle;
    //第一分组
    var rowTitle = null;
    if (groupdata != null)
        rowTitle = RowTitle[0];
    //第二分组
    var subRowTitle = null;
    if (subgroupdata != null)
        subRowTitle = RowTitle[1];

    if ((coldata == null || rowdata[columnTitle] == coldata)
        && (groupdata == null || rowdata[rowTitle] == groupdata)
        && (subgroupdata == null || rowdata[subRowTitle] == subgroupdata))
        return true;
    else
        return false;
}
//#endregion

//#region  预览相关
function btnView_Click() {
    BuildReportTemplate();

    if (CheckTemplateData()) {
        ShowDialog(ReportTemplate.DisplayName == "" ? T("ReportViewManager_Preview", "预览报表") : ReportTemplate.DisplayName,_PORTALROOT_GLOBAL+ "/admin/TabMaster.html?url=BPA/ReportSourceView.html&ViewType=Cross");
    }
}
//#endregion

//#region 保存事件
function btnSave_Click() {
    BuildReportTemplate();
    if (ReportTemplate.Code == null || ReportTemplate.Code == "") {
        ShowWarn("编码不能为空!");
        return false;
    }

    if (ReportTemplate.DisplayName == null || ReportTemplate.DisplayName == "") {
        ShowWarn("名称不能为空!");
        return false;
    }

    if (!CheckTemplateData()) {
        return false;
    }
    var Command = ReportTemplate.IsEdit ? "UpdateTemplate" : "AddTemplate";
    var param = {
        ReportTemplate: JSON.stringify(ReportTemplate),
        childColumns: "",
    };
    PostAjax($.Controller.ReportTemplate[Command], param, function (data) {
        var saveResult = data;
        if (saveResult.Success) {
            top.ReloadNode(ParentID);
            ShowSuccess($.Lang("msgGlobalString.SaveSucced"));
            if (!ReportTemplate.IsEdit) {
                top.workTab.setHeader(top.workTab.getSelectedTabItemID(), ReportTemplate.DisplayName);
                top.$("iframe[id='" + top.workTab.getSelectedTabItemID() + "']").attr("src", "../admin/TabMaster.html?url=BPA/ReportTemplate_Cross.html&ReportSourceCode=" + ReportTemplate.Code + "&ParentID="+ParentID);
            }
        }
        else {
            var errorMessage = [];
            if (saveResult.Extend) {
                $.each(saveResult.Extend, function (i, k) {
                    errorMessage.push($.Lang(k));
                })
                if (saveResult.Extend.length > 1) {
                    ShowMultiMsg(errorMessage);
                } else {
                    ShowWarn(errorMessage);
                }
            } else {
                ShowWarn(saveResult.Message);
            }
        }
    });
}
//#endregion

//#region 校验模板数据
function CheckTemplateData() {
    //必须配有数据源
    if (ReportTemplate.SourceCode == null || ReportTemplate.SourceCode == "") {
        ShowWarn("必须配有数据源");
        return false;
    }
    //必须有列标题
    if ((ReportTemplate.ColumnTitle == null || ReportTemplate.ColumnTitle == "")
         && ReportTemplate.RowTitle == null || ReportTemplate.RowTitle == "") {
        ShowWarn("列标题或行标题，至少配一个!");
        return false;
    }

    if (RowTitle == null || RowTitle == "") {
        //行标题没有配置时候，统计字段不能为空
        if (ReportTemplate.Columns == null || ReportTemplate.Columns == "") {
            ShowWarn("行标题为空时，统计字段不能为空!");
            return false;
        }
    }

    //设置支持钻取时，验证钻取参数名称不能相同
    if (ReportTemplate.DrillCode != null && ReportTemplate.DrillCode != "") {
        var drillParamNames = [];
        if (ReportTemplate.RowDrillParam != null) {
            for (var r = 0; r < ReportTemplate.RowDrillParam.length; r++) {
                if (!ReportTemplate.RowDrillParam[r].Name) {
                    ShowWarn("钻取参数名称不能为空!");
                    return false;
                }
                drillParamNames.push(ReportTemplate.RowDrillParam[r].Name);
            } 
        }
        if (ReportTemplate.ColumnDrillParam != null) drillParamNames.push(ReportTemplate.ColumnDrillParam.Name);
        for (var x = 0; x < drillParamNames.length; x++) {
            for (var y = x + 1; y < drillParamNames.length; y++) {
                if (drillParamNames[x] == drillParamNames[y]) {
                    ShowWarn("钻取参数名称不能相同!");
                    return false;
                }
            }
        }
    }

    return true;
}
//#endregion

//#region 构建数据
function BuildReportTemplate() {
    ReportTemplate.ReportType = EnumReportType.Cross;
    ReportTemplate.Code = txtCode.val();
    ReportTemplate.DisplayName = txtDisplayName.val();
    ReportTemplate.SourceCode = CurrentSource.Code;
    ReportTemplate.DefaultChart = SelChartType.val();
    if (QueryString("ParentCode") != null && QueryString("ParentCode") != "")
        ReportTemplate.FolderCode = QueryString("ParentCode");
    //是否支持钻取
    if (ckSupportDrill.prop("checked")) {
        if (slSelectType.val() == "0") {
            ReportTemplate.DrillCode = ReportTemplate.Code;
        }
        else {
            ReportTemplate.DrillCode = slReportCode.val();
        }
    }
    else {
        ReportTemplate.DrillCode = "";
    }

    if (RowTitle == null || RowTitle == "") {
        ReportTemplate.RowTitle = null;
        ReportTemplate.RowDrillParam = null;
    }
    else {
        ReportTemplate.RowTitle = RowTitle.join(";");
        //构建行标题钻取参数
        var rowDrillParams = new Array();
        var drillParam1 = new DrillParam();
        drillParam1.Title = slRowTitleId1.attr("title");
        drillParam1.Code = ReportTemplate.DrillCode == "" ? drillParam1.Title : slRowTitleId1.val();
        drillParam1.Name = ReportTemplate.DrillCode == "" ? drillParam1.Title : txtRowParamName1.val();
        rowDrillParams.push(drillParam1);
        if (RowTitle.length > 1) {
            var drillParam2 = new DrillParam();
            drillParam2.Title = slRowTitleId2.attr("title");
            drillParam2.Code = ReportTemplate.DrillCode == "" ? drillParam2.Title : slRowTitleId2.val();
            drillParam2.Name = ReportTemplate.DrillCode == "" ? drillParam2.Title : txtRowParamName2.val();
            rowDrillParams.push(drillParam2);
        }
        ReportTemplate.RowDrillParam = rowDrillParams;
    }
    //构建列标题钻取参数
    if (ReportTemplate.ColumnTitle == null || ReportTemplate.ColumnTitle == "") {
        ReportTemplate.ColumnDrillParam = null;
    }
    else {
        var columnDrillParam = new DrillParam();
        columnDrillParam.Title = slColumnTitleId.attr("title");
        columnDrillParam.Code = ReportTemplate.DrillCode == "" ? columnDrillParam.Title : slColumnTitleId.val();
        columnDrillParam.Name = ReportTemplate.DrillCode == "" ? columnDrillParam.Title : txtColumnParamName.val();
        ReportTemplate.ColumnDrillParam = columnDrillParam;
    }
    //过滤参数配置
    ReportTemplate.Parameters = ParameterColumns;

    //选择的图表
    ReportTemplate.Charts = new Array();
    ckCharts.each(function () {
        if ($(this).prop("checked")) {
            ReportTemplate.Charts.push($(this).val());
        }
    });
    //X轴
    ReportTemplate.AxisDimension = SelAxisDimension.val();
    ReportTemplate.AxisUnit = txtAxisUnit.val();
    ReportTemplate.XAxisUnit = txtXAxisUnit.val();
}
//#endregion

//#region 统计字段显示名称修改
function txtColumnDisplayName_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    if (ReportTemplate.Columns == null || ReportTemplate.Columns == "") return;
    for (var i in ReportTemplate.Columns) {
        if (ReportTemplate.Columns[i].ColumnCode == ColumnCode) {
            ReportTemplate.Columns[i].DisplayName = txtColumnDisplayName.val();
            ShowCountColumnAsColumnTitle();
            return;
        }
    }
}
//#endregion

//#region 设置钻取行列标题参数
function SetDrillParam() {
    slRowTitleId1.closest("tr").hide();
    txtRowParamName1.closest("tr").hide();
    slRowTitleId2.closest("tr").hide();
    txtRowParamName2.closest("tr").hide();
    slColumnTitleId.closest("tr").hide();
    txtColumnParamName.closest("tr").hide();

    //设置列钻取参数
    if (ReportTemplate.ColumnDrillParam != null) {
        SetDrillItem(slColumnTitleId, txtColumnParamName, ReportTemplate.ColumnDrillParam);
    }

    //设置行钻取参数
    if (ReportTemplate.RowDrillParam != null && ReportTemplate.RowDrillParam.length > 0) {
        SetDrillItem(slRowTitleId1, txtRowParamName1, ReportTemplate.RowDrillParam[0]);
        if (ReportTemplate.RowDrillParam.length == 2) {
            SetDrillItem(slRowTitleId2, txtRowParamName2, ReportTemplate.RowDrillParam[1]);
        }
    }
}
//#endregion

//#region 设置钻取参数
function SetDrillItem(codeSelect, NameInput, drillParam) {
    if (CurrentSource == null) return;
    codeSelect.closest("tr").show();
    NameInput.closest("tr").show();
    //标题相同时不进行重绘
    if (codeSelect.attr("title") == drillParam.Title) { return; }
    codeSelect.empty();
    codeSelect.attr("title", drillParam.Title);
    var columns = ObjectClone(CurrentSource.Columns);
    for (var c = 0; c < columns.length; c++) {
        codeSelect.append("<option value='" + columns[c].ColumnCode + "'>" + columns[c].DisplayName + "</option>");
    }
    codeSelect.val(drillParam.Code);
    NameInput.val(drillParam.Name);
}
//#endregion
