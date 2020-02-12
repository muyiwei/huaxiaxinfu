/* 报表配置 */

//#region 变量
//编辑模式下的Code
var TemplateCode;
//左侧树形菜单父节点
var ParentID;
//异步处理地址
//var PostUrl = "../Ajax/ReportHandler/ReportTemplateHandler.ashx";

//报表管理器
var TableManger;
//报表数据源
var ReportSources = new Array();
//当前选中的数据源
var CurrentSource = null;
//报表展示列
var TableDisplayColumns = new Array();
//模板已选择的列
var TemplateColumns = new Array();
//数据源数据:前5行数据
var ResourceDatas = new Array();
//报表模板
ReportTemplate = new ReportTemplateSetting();
//过滤参数记录
var ParameterColumns = new Array();
//#endregion

//#region 初始化入口
function TemplateInit() {
    TemplateCode = arguments[0];
    ParentID = arguments[1];

    //报表数据源
    seleportSource = $("#seleportSource");
    //报表设置的展示div
    tableSetting = $("#tableSetting");

    txtCode = $("#txtCode");
    txtDisplayName = $("#txtDisplayName");

    //字段编辑模块
    ColumnPanel = $("#ColumnPanel").hide();
    lbColumnCode = $("#lbColumnCode");
    txtColumnDisplayName = $("#txtColumnDisplayName");
    txtColumnDisplayName.change(txtColumnDisplayName_Change);
    slFunctionType = $("#slFunctionType");
    slFunctionType.change(slFunctionType_Change);
    txtLinkRule = $("#txtLinkRule");
    txtLinkRule.change(txtLinkRule_Change);

    txtColumnWidth = $("#txtColumnWidth");
    txtColumnWidth.change(txtColumnWidth_Change);
    sltDisplayType = $("#sltDisplayType");
    sltDisplayType.change(sltDisplayType_Change);

    //过滤参数模块
    ParamPanel = $("#ParamPanel").hide();
    lbPColCode = $("#lbPColCode");
    slPColType = $("#slPColType");
    txtParamDes = $("#txtParamDes");
    txtFixedValue = $("#txtFixedValue");
    slSystem = $("#slSystem");
    slOrgnization = $("#slOrgnization");
    txtDefaultValue = $("#txtDefaultValue");
    slDataTime = $("#slDataTime");
    ckAllowNull = $("#ckAllowNull");
    ckIsShow = $("#ckIsShow");

    //工具栏
    $("#H3ToolBar").AspLinkToolBar();
    $(".H3Panel").BuildPanel({ excludeIDs: ["tableSetting", "paramsSetting"], leftSpace: false });
    //布局
    $("#BodyContent").ligerLayout({ leftWidth: 150, rightWidth: 250, height: '100%', space: 1 });

    //过滤参数类型
    LoadParameterType();
    //过滤参数改变事件
    slPColType.change(slPColType_Change);
    //过滤参数的固定值修改
    txtFixedValue.change(txtFixedValue_Change);
    //过滤参数的系统参数值改变
    slSystem.change(slSystem_Change);
    //组织权限修改
    slOrgnization.change(slOrgnization_Change);
    //过滤默认值修改
    txtDefaultValue.change(txtDefaultValue_Change);
    //时间默认范围修改
    slDataTime.change(slDataTime_Change);
    //允许为空修改
    ckAllowNull.change(ckAllowNull_Change);
    //是否显示修改
    ckIsShow.change(ckIsShow_Change);
    //描述修改
    txtParamDes.change(txtParamDes_Change);

    //按钮
    btnView = $("#btnView");
    btnView.click(btnView_Click);

    //抽象方法:为了给交叉分析表扩展用
    AbstractFun();

    if (TemplateCode != "") {
        LoadReportTemplateSetting();
    }
    else {
        //报表数据源下拉
        LoadReportSource();

        //数据源改变
        seleportSource.change(seleportSource_Change);
        seleportSource.change();
    }

    $("tr:not([property])[group]").click(function () {
        if ($(this).find("td:first").hasClass("Expanded")) {
            $(this).find("td:first").removeClass("Expanded");
            $(this).find("td:first").addClass("Fold");
            $("tr[property][group='" + $(this).attr("group") + "']").hide();
        }
        else {
            $(this).find("td:first").removeClass("Fold");
            $(this).find("td:first").addClass("Expanded");
            $("tr[property][group='" + $(this).attr("group") + "']").show();
            if ($(this).closest("tbody").attr("id") == ParamPanel.attr("id"))
                slPColType.change();
            else
                Column_Click(ColumnPanel.attr("ColumnCode"));
        }
    });

    // 属性说明
    $(".PropertyTable tr").unbind("click.desc").bind("click.desc", function () {
        var td = $(this).find("td:eq(1)");
        var title = td.html();
        var desc = td.attr("desc");
        $("#desc_title").html(title || "");
        $("#desc_content").html(desc || "");

    });

    // 设置属性表的高度
    $(".content-r-item").height($(window).height() - 120);
};
//#endregion

//#region 抽象方法
function AbstractFun() { }
//#endregion

//#region 编辑模式，加载报表模板数据
function LoadReportTemplateSetting() {
    PostAjax(
       $.Controller.ReportTemplate.LoadReportTemplateSetting,
       { templateCode: TemplateCode },
       LoadReportTemplateComplete);
}

//加载完事件
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
    //隐藏数据源选择，编辑下数据源不允许修改
    $("#divReportSource").html(CurrentSource.DisplayName);
    txtCode.val(ReportTemplate.Code);
    txtDisplayName.val(ReportTemplate.DisplayName);
    txtCode.SetDisabled();

    //加载数据源的可选择字段
    LoadTree(ObjectClone(CurrentSource.Columns));

    //展示表格
    TemplateColumns = InitChildColumns(ReportTemplate.Columns);
    ParameterColumns = ReportTemplate.Parameters;

    for (var i = 0, j = TemplateColumns.length; i < j; i++) {
        if (TemplateColumns[i].ParentColumnCode == null || TemplateColumns[i].ParentColumnCode == "") {
            //显示列
            var displayColumn = AddToTableDisplayColumn(TemplateColumns[i]);
            if (TemplateColumns[i].children) {
                $.each(TemplateColumns[i].children, function (i, n) {
                    AddToTableDisplayColumn(n, displayColumn);
                });
            }
            //for (var k = 0, l = TemplateColumns.length; k < l; k++) {
            //    if (TemplateColumns[k].ParentColumnCode == TemplateColumns[i].ColumnCode) {
            //        AddToTableDisplayColumn(TemplateColumns[k], displayColumn);
            //    }
            //}
        }
    }

    if (ParameterColumns != null) {
        for (var i = 0, j = ParameterColumns.length; i < j; i++) {
            AddToParamsSetting(ParameterColumns[i]);
        }
    }
    LoadGird();
}

//#endregion

//#region 加载报表数据源
function LoadReportSource() {
    PostAjax($.Controller.ReportTemplate.LoadReportSource, {}, function (result) {
        if (result.Success) {
            ReportSources = result.Extend;
            for (var i = 0, j = ReportSources.length; i < j; i++) {
                seleportSource.append("<option value='" + ReportSources[i].Code + "'>" + ReportSources[i].DisplayName + "</option>");
            }
        } else {
            $.H3Dialog.Warn({ content: $.Lang(result.Message) });
        }
    });
}
//#endregion

//#region  加载数据源数据
//加载数据源数据
function LoadSourceData(SourceCode) {
    if (ResourceDatas[SourceCode] == null) {
        var param = {
            sourceCode: SourceCode
        };
        PostAjax($.Controller.ReportTemplate.LoadSourceData, param, function (data) {
            ResourceDatas[SourceCode] = data;
        });
    }
}
//#endregion

//#region 加载过滤参数类型数据
function LoadParameterType() {
    for (var key in EnumParameterType) {
        slPColType.append("<option value='" + EnumParameterType[key] + "'>" + key + "</option>");
    }
}
//#endregion

//#region 数据源改变事件
function seleportSource_Change() {
    for (var i = 0, j = ReportSources.length; i < j; i++) {
        if (ReportSources[i].Code == $(this).val()) {
            CurrentSource = ReportSources[i];
            LoadSourceData($(this).val());
            LoadTree(ObjectClone(CurrentSource.Columns));
            ClearData();//清空列
        }
    }
    //加载表格
    LoadGird();
}
//#endregion

//#region 表格相关事件：加载表格、拖拽

//加载表格
function LoadGird() {
    if (TableManger == null) {
        //创建表格
        TableManger = tableSetting.ligerGrid({
            columns: TableDisplayColumns,
            width: '99%',
            height: 'auto',
            rownumbers: true,
            data: ResourceDatas[CurrentSource.Code],
            dataAction: "local",
            usePager: false,
            allowAdjustColWidth: true,
            rownumbers: true,
            enabledSort: false,
            colDraggable: true,
            onColStartDrag: onColStartDrag,
            onColDragging: onColDragging,
            onColStopDrag: onColStopDrag
        });
    }
    else {
        TableManger.set('columns', TableDisplayColumns);
        if (TableDisplayColumns.length > 0)
            TableManger.set('data', ResourceDatas[CurrentSource.Code]);
        else
            TableManger.set('data', null);
        TableManger.reRender();
    }
}

//开始拖拽
function onColStartDrag(g, p, curent, e) {
    if (e.button == 2) return false;
    if (g.colresizing) return false;
    this.set('cursor', 'default');
    var src = g._getSrcElementByEvent(e);

    //console.log(src.hcell);
    //console.log(src.column);
    //console.log(src.column.issystem);
    //console.log(src.hcelltext);

    if (!src.hcell || !src.column || src.column.issystem || !src.hcelltext) return false;
    if ($(src.hcell).css('cursor').indexOf('resize') != -1) return false;
    this.draggingColumn = src.column;
    g.coldragging = true;

    Column_Click(this.draggingColumn.ColumnCode);

    var gridOffset = g.grid.offset();
    this.validRange = {
        top: gridOffset.top,
        bottom: gridOffset.top + g.gridheader.height(),
        left: gridOffset.left - 10,
        right: gridOffset.left + g.grid.width() + 10
    };

    return true;
}

//拖动中
function onColDragging(g, p, current, e) {
    this.set('cursor', 'default');
    var column = this.draggingColumn;
    if (!column) return false;
    if (!g.coldragging) return false;
    if (g.colresizing) return false;
    if (g.colDropIn == null)
        g.colDropIn = -1;
    if (g.colDelete == null) {
        g.colDelete = false;
    }
    var pageX = e.pageX;
    var pageY = e.pageY;
    var visit = false;
    var gridOffset = g.grid.offset();
    var validRange = this.validRange;
    if (pageX < validRange.left || pageX > validRange.right
        || pageY > validRange.bottom || pageY < validRange.top) {
        g.colDelete = true;
        g.colDroptip.hide();
        this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes").addClass("l-icon-delete");
        return;
    }
    else {
        g.colDelete = false;
        this.proxy.find(".l-drop-icon:first").removeClass("l-icon-delete");
    }
    for (var colid in g._columns) {
        var col = g._columns[colid];
        if (column == col) {
            visit = true;
            continue;
        }
        if (col.issystem) continue;
        var sameLevel = col['__level'] == column['__level'];
        var isAfter = !sameLevel ? false : visit ? true : false;
        if (column.frozen != col.frozen) isAfter = col.frozen ? false : true;
        if (g.colDropIn != -1 && g.colDropIn != colid) continue;
        var cell = document.getElementById(col['__domid']);
        var offset = $(cell).offset();
        var range = {
            top: offset.top,
            bottom: offset.top + $(cell).height(),
            left: offset.left - 10,
            right: offset.left + 10
        };
        if (isAfter) {
            var cellwidth = $(cell).width();
            range.left += cellwidth;
            range.right += cellwidth;
        }

        if (sameLevel && pageX > range.left && pageX < range.right && pageY > range.top && pageY < range.bottom) {
            var height = p.headerRowHeight;
            if (col['__rowSpan']) height *= col['__rowSpan'];
            g.colDroptip.css({
                left: range.left + 5,
                top: range.top - 9,
                height: height + 9 * 2
            }).show();
            g.colDropIn = colid;
            g.colDropDir = isAfter ? "right" : "left";
            this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no").addClass("l-drop-yes");
            break;
        }
        else if (g.colDropIn != -1) {
            g.colDropIn = -1;
            g.colDroptip.hide();
            this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes").addClass("l-drop-no");
        }
    }

    return false;
}

//拖动结束
function onColStopDrag(g, p, current, e) {
    var column = this.draggingColumn;
    g.coldragging = false;
    if (g.colDelete) {
        g.colDelete = false;
        RemoveTableDisplayColumn(column);
        LoadGird();
    }
    else {
        if (g.colDropIn != -1) {
            var targetColumn = g._columns[g.colDropIn];
            g.changeCol.ligerDefer(g, 0, [column, g.colDropIn, g.colDropDir == "right"]);
            ChangeCol(column, targetColumn, g.colDropDir == "right");
            g.colDropIn = -1;
        }
    }
    g.colDroptip.hide();
    this.set('cursor', 'default');
    return false;
}
//#endregion

//#region 树相关事件,绑定 拖拽
//绑定树
function LoadTree(data) {
    $("#divSourceColumns").ligerTree({
        data: data,
        idFieldName: 'ColumnCode',
        textFieldName: 'DisplayName',
        parentIDFieldName: 'ParentColumnCode',
        checkbox: false,
        nodeDraggable: true,
        onDragging: onDragging,
        onStopDrag: onStopDrag,
        render: function (nodedata) {
            var text = nodedata["DisplayName"] + "[" + nodedata["ColumnCode"] + "]";
            return "<span title='" + text + "'>" + text + "</span>";
        }
    });
}

//节点拖动事件
function onDragging(g, p, current, e) {
    var nodedata = this.draggingNode;
    if (!nodedata) return false;
    var nodes = this.draggingNodes ? this.draggingNodes : [nodedata];
    if (g.nodeDropIn == null) g.nodeDropIn = -1;
    var pageX = e.pageX;
    var pageY = e.pageY;
    var visit = false;
    var validRange = this.validRange;

    if ((e.target.id == "paramsSetting" && nodedata.ReportSourceColumnType == EnumReportSourceColumnType.TableColumn)
        || e.target.className.indexOf("l-grid") > -1) {
        this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-add").addClass("l-drop-yes");
    }
    else {
        this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes  l-drop-add").addClass("l-drop-no");
    }
    return false;
}

//节点拖动停止事件
function onStopDrag(g, p, current, e) {
    if (!this.draggingNodes || !this.draggingNodes.length) return false;
    var dragNode = this.draggingNodes[0];
    if (e.target.className.indexOf("l-grid") > -1) {
        //添加展示列
        if (dragNode.ParentColumnCode) {
            ShowWarn(T("Script_RP_ChildError", "子列不允许单独添加！"));
            return
        }
        AddToTemplateColumn(dragNode);
        LoadGird();
    }
    else if (e.target.id == "paramsSetting" && dragNode.ReportSourceColumnType == EnumReportSourceColumnType.TableColumn) {
        //添加参数
        AddParamColumn(dragNode);
    }

    return false;
}
//#endregion

//#region 列操作

/*添加到模板列里面
*@参数1:当前需要添加的列，会克隆，修改后不会修改原始的
*@参数2：可不传，父级列，不克隆，会往该列添加子列
*/
function AddToTemplateColumn() {
    var currentCol = ObjectClone(arguments[0]);
    var parentDisplayCol = arguments[1];
    //检测是否重复:此处不允许重复，是因为在报表数据源的时候，已经自定义了列；ColumnCode是唯一的，这里如果允许重复的话，又得让用户定义一个编码
    for (var i = 0, j = TemplateColumns.length; i < j; i++) {
        if (TemplateColumns[i].ColumnCode == currentCol.ColumnCode) {
            ShowWarn(T("Script_RP_CodeExist", "编码已经存在！"));
            return;
        }
    }
    //添加标示，当前编码_Guid
    //currentCol.ColumnCode = currentCol.ColumnCode + "_" + Guid();
    //显示列
    var displayColumn = AddToTableDisplayColumn(currentCol);

    //模板列：包含所有属性
    TemplateColumns.push(currentCol);

    if (currentCol.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn && currentCol.children != null) {
        for (var i = 0, j = currentCol.children.length; i < j; i++) {
            AddToTableDisplayColumn(currentCol.children[i], displayColumn);
        }
    }
    Column_Click(currentCol.ColumnCode);
}

//添加显示列
// @参数1:当前需要添加的列，会克隆，修改后不会修改原始的
// @参数2：可不传，父级列，不克隆，会往该列添加子列
function AddToTableDisplayColumn() {
    var currentCol = arguments[0];
    var parentDisplayCol = arguments[1];
    //显示列
    var displayColumn = {
        display: "<a onmousemove='return false' onmousedown='return false' href='javascript:Column_Click(\"" + currentCol.ColumnCode + "\");' >" + currentCol.DisplayName + "</a>",
        name: currentCol.ColumnCode,
        ColumnCode: currentCol.ColumnCode
    };

    if (currentCol.DataType == EnumDataType.Numeric) {
        displayColumn.totalSummary = {
            type: slFunctionType.val(currentCol.FunctionType).find(":selected").html().toLowerCase()
        };
    }
    //表格展示的列
    if (parentDisplayCol == null) {
        TableDisplayColumns.push(displayColumn);
    }
    else {
        currentCol.ParentTemplateKey = parentDisplayCol.ColumnCode;
        displayColumn.ParentTemplateKey = parentDisplayCol.ColumnCode;
        if (parentDisplayCol.columns == null) {
            parentDisplayCol.columns = new Array();
        }
        parentDisplayCol.columns.push(displayColumn);
    }
    return displayColumn;
}

//删除表格显示的列
function RemoveTableDisplayColumn(column) {
    if (column.ParentTemplateKey == null) {// 没有父节点
        RemoveTemplateColumn(column);
        for (var i = 0, j = TableDisplayColumns.length; i < j; i++) {
            if (TableDisplayColumns[i].ColumnCode == column.ColumnCode) {
                TableDisplayColumns.splice(i, 1);
                break;
            }
        }

    }
    else {//有父节点，找父节点，删除当前节点
        for (var i = 0, j = TableDisplayColumns.length; i < j; i++) {
            if (TableDisplayColumns[i].ColumnCode == column.ParentTemplateKey) {
                if (TableDisplayColumns[i].columns.length == 1) {
                    //如果改父节点，只有个一个子节点，把父节点全部删除
                    RemoveTableDisplayColumn(TableDisplayColumns[i]);
                }
                else {
                    for (var k = 0, l = TableDisplayColumns[i].columns.length; k < l; k++) {
                        if (TableDisplayColumns[i].columns[k].ColumnCode == column.ColumnCode) {
                            RemoveTemplateColumn(TableDisplayColumns[i].columns[k]);
                            TableDisplayColumns[i].columns.splice(k, 1);
                            break;
                        }
                    }
                }
                break;
            }
        }
    }
}

//删除配置列
function RemoveTemplateColumn(column) {
    var keyArray = new Array();
    keyArray.push(column.ColumnCode);
    //找到所有的子列
    if (column.ParentTemplateKey) {
        for (var i = 0, j = TemplateColumns.length; i < j; i++) {
            if (TemplateColumns[i].ColumnCode == column.ParentTemplateKey) {
                for (var k = 0, l = TemplateColumns[i].children.length; k < l; k++) {
                    if (TemplateColumns[i].children[k].ColumnCode == column.ColumnCode) {
                        TemplateColumns[i].children.splice(k, 1);
                        break;
                    }
                }
            }
        }
    }
    for (var i = 0, j = keyArray.length; i < j; i++) {
        for (var k = 0, l = TemplateColumns.length; k < l; k++) {
            if (TemplateColumns[k].ColumnCode == keyArray[i]) {
                TemplateColumns.splice(k, 1);
                break;
            }
        }
    }
}

//改变次序
function ChangeCol(column, targetColumn, isRight) {
    if (targetColumn == null) return;
    var currentIndex = -1;
    var targetIndex = -1;
    for (var i = 0, j = TemplateColumns.length; i < j; i++) {
        if (column.ColumnCode == TemplateColumns[i].ColumnCode) {
            currentIndex = i;
        }
        if (targetColumn.ColumnCode == TemplateColumns[i].ColumnCode) {
            targetIndex = i;
        }
        if (targetIndex > -1 && currentIndex > -1) break;
    }

    var curentColumn = ObjectClone(TemplateColumns[currentIndex]);

    if (isRight) {
        TemplateColumns.splice(targetIndex + 1, 0, curentColumn);
        TemplateColumns.splice(currentIndex, 1);
    }
    else {
        TemplateColumns.splice(targetIndex, 0, curentColumn);
        TemplateColumns.splice(currentIndex + 1, 1);
    }
}

//清空列
function ClearColumns() {
    TemplateColumns.length = 0;
    TableDisplayColumns.length = 0;
}

//列头点击事件
function Column_Click(ColumnCode) {

    RenderParamPanel(TemplateColumns, ColumnCode);

    //ParamPanel.hide();
    //ParamPanel.removeAttr("ColumnCode");
    //ColumnPanel.show();
    //ColumnPanel.attr("ColumnCode", ColumnCode);
    //for (var i = 0, j = TemplateColumns.length; i < j; i++) {
    //    if (TemplateColumns[i].ColumnCode == ColumnCode) {
    //        lbColumnCode.text(TemplateColumns[i].ColumnCode);
    //        txtColumnDisplayName.val(TemplateColumns[i].DisplayName);
    //        if (TemplateColumns[i].DataType == EnumDataType.Numeric) {
    //            slFunctionType.closest("tr").show();
    //            slFunctionType.val(TemplateColumns[i].FunctionType);
    //        }
    //        else {
    //            slFunctionType.closest("tr").hide();
    //        }
    //        txtLinkRule.val(TemplateColumns[i].LinkRule);
    //        txtColumnWidth.val(TemplateColumns[i].ColumnWidth);
    //        sltDisplayType.val(TemplateColumns[i].DisplayType)
    //        break;
    //    }
    //}
}

//递归所有列
function RenderParamPanel(TemplateColumns, ColumnCode) {
    for (var i = 0, j = TemplateColumns.length; i < j; i++) {
        if (TemplateColumns[i].children) {
            RenderParamPanel(TemplateColumns[i].children, ColumnCode);
        } else if (TemplateColumns[i].ColumnCode == ColumnCode) {
            ParamPanel.hide();
            ParamPanel.removeAttr("ColumnCode");
            ColumnPanel.show();
            ColumnPanel.attr("ColumnCode", ColumnCode);
            lbColumnCode.text(TemplateColumns[i].ColumnCode);
            txtColumnDisplayName.val(TemplateColumns[i].DisplayName);
            if (TemplateColumns[i].DataType == EnumDataType.Numeric) {
                slFunctionType.closest("tr").show();
                slFunctionType.val(TemplateColumns[i].FunctionType);
            }
            else {
                slFunctionType.closest("tr").hide();
            }
            txtLinkRule.val(TemplateColumns[i].LinkRule);
            txtColumnWidth.val(TemplateColumns[i].ColumnWidth);
            sltDisplayType.val(TemplateColumns[i].DisplayType)
            break;
        }
    }
}
//#endregion

//#region 列编辑模块事件

//显示名称修改
function txtColumnDisplayName_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    RenderParamValue(TemplateColumns, ColumnCode, "DisplayName", txtColumnDisplayName.val());

    //改变报表列
    for (var i = 0, j = TableManger.columns.length; i < j; i++) {
        if (TableManger.columns[i].ColumnCode == ColumnCode) {
            var tabTxt = "<a href='javascript:Column_Click(\"" + ColumnCode + "\");' >" + txtColumnDisplayName.val() + "</a>"
            TableManger.columns[i].display = tabTxt;
            TableManger.changeHeaderText(TableManger.columns[i].name, tabTxt);
            break;
        }
    }
}

//汇总类型修改
function slFunctionType_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    RenderParamValue(TemplateColumns, ColumnCode, "FunctionType", slFunctionType.val());

    //改变报表列
    for (var i = 0, j = TableManger.columns.length; i < j; i++) {
        if (TableManger.columns[i].ColumnCode == ColumnCode) {
            TableManger.columns[i].totalSummary = { type: slFunctionType.find(":selected").html().toLowerCase() };
            LoadGird();
            break;
        }
    }
}

//链接规则修改
function txtLinkRule_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    RenderParamValue(TemplateColumns, ColumnCode, "LinkRule", txtLinkRule.val());
}

//长度规则修改
function txtColumnWidth_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    RenderParamValue(TemplateColumns, ColumnCode, "ColumnWidth", txtColumnWidth.val());
}

//显示类型规则修改
function sltDisplayType_Change() {
    var ColumnCode = ColumnPanel.attr("ColumnCode");
    //改变模板列
    RenderParamValue(TemplateColumns, ColumnCode, "DisplayType", sltDisplayType.val());
}

//递归改变属性值
function RenderParamValue(TemplateColumns, ColumnCode, field, value) {
    for (var i = 0, j = TemplateColumns.length; i < j; i++) {
        if (TemplateColumns[i].children) { RenderParamValue(TemplateColumns[i].children, ColumnCode, field, value); }
        else if (TemplateColumns[i].ColumnCode == ColumnCode) {
            TemplateColumns[i][field] = value;
            break;
        }
    }
}
//#endregion

//#region 按钮事件
//预览
function btnView_Click() {
    BuildReportTemplate();
    if (CheckTemplateData()) {
        //字段信息
        ShowDialog(ReportTemplate.DisplayName == "" ? T("ReportViewManager_Preview", "预览报表") : ReportTemplate.DisplayName, "../admin/TabMaster.html?url=BPA/ReportSourceView.html&ViewType=Summary");
    }
}

//保存
function btnSave_Click() {
    BuildReportTemplate();
    if (CheckTemplateData()) {
        var Command = ReportTemplate.IsEdit ? "UpdateTemplate" : "AddTemplate";
        var childrendColumns = GetChildrenColumns(ReportTemplate.Columns);
        var param = {
            reportTemplate: JSON.stringify(ReportTemplate),
            childColumns: JSON.stringify(childrendColumns),
        };
        PostAjax($.Controller.ReportTemplate[Command], param, function (data) {
            var saveResult = data;
            if (saveResult.Success) {
                top.ReloadNode(ParentID);
                ShowSuccess($.Lang("msgGlobalString.SaveSucced"));
                if (!ReportTemplate.IsEdit) {
                    top.workTab.setHeader(top.workTab.getSelectedTabItemID(), ReportTemplate.DisplayName);
                    top.$("iframe[id='" + top.workTab.getSelectedTabItemID() + "']").attr("src", "../admin/TabMaster.html?url=BPA/ReportTemplate_Summary.html&ReportSourceCode=" + ReportTemplate.Code + "&ParentID=" + ParentID);
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
    return false;
}

//获取子列数据
function GetChildrenColumns(columns) {
    var childColumns = new Array();
    $.each(columns, function (i, n) {
        if (n.children) {
            $.each(n.children, function (j, k) {
                childColumns.push(k);
            })
        }
    })
    return childColumns;
}

//将子列加载到父列,并删除子列
function InitChildColumns(columns) {
    var allColumns = new Array();
    $.each(columns, function (i, n) {
        if (!n.ParentColumnCode) {
            $.each(columns, function (j, k) {
                if (k.ParentColumnCode == n.ColumnCode) {
                    if (!n["children"]) n["children"] = new Array();
                    n["children"].push(k);
                }
            })
            allColumns.push(n);
        }
    })
    return allColumns;
}
//删除
function btnDel_Click(obj) {
    if (ConfirmDel(obj)) {
        PostAjax($.Controller.ReportTemplate.DelReportTemplate, { templateCode: TemplateCode }, function (data) {
            if (data.Success) {
                top.ReloadNode(ParentID);
                top.workTab.removeTabItem(top.workTab.getSelectedTabItemID());
            } else {
                ShowWarn($.Lang("msgGlobalString.DeleteFailed"));
            }
        });
    }
}
//#endregion

function CheckTemplateData() {
    if (ReportTemplate.Code == "") {
        ShowWarn(T("Script_RP_ReportCodeNull", "报表编码不能为空!"));
        return false;
    }
    if (ReportTemplate.SourceCode == "") {
        ShowWarn(T("Script_RP_SourceNull", "数据源不能为空!"));
        return false;
    }
    if (ReportTemplate.DisplayName == "") {
        ShowWarn(T("Script_RP_ReportNameNull", "报表名称不能为空!"));
        return false;
    }
    if (ReportTemplate.Columns == null || ReportTemplate.Columns.length < 1) {
        ShowWarn(T("Script_RP_ReportColumnNull", "报表展示列不能为空!"));
        return false;
    }
    return true;
}

//#region 创建最新报表模板
function BuildReportTemplate() {
    ReportTemplate.Code = txtCode.val();
    ReportTemplate.DisplayName = txtDisplayName.val();
    ReportTemplate.ReportType = EnumReportType.Summary;
    ReportTemplate.SourceCode = CurrentSource.Code;
    ReportTemplate.Columns = TemplateColumns;
    ReportTemplate.Parameters = ParameterColumns;
    if (QueryString("ParentCode") != null && QueryString("ParentCode") != "")
        ReportTemplate.FolderCode = QueryString("ParentCode");
}
//#endregion 

//#region 过滤参数设置相关

//添加过滤参数列
function AddParamColumn(dragNode) {
    if (ParameterColumns == null)
        ParameterColumns = new Array();
    //判断是否存在
    for (var i = 0, j = ParameterColumns.length; i < j; i++) {
        if (ParameterColumns[i].ColumnCode == dragNode.ColumnCode) {
            ShowWarn(T("Script_RP_FilterColumnExist", "已经存在该过滤列"));
            return;
        }
    }
    var ReportTemplateParameter = new ReportTemplateParameterSetting();
    ReportTemplateParameter.ColumnCode = dragNode.ColumnCode;
    ReportTemplateParameter.DisplayName = dragNode.DisplayName;
    ReportTemplateParameter.ParameterType = EnumParameterType.String;
    var paramType = getParameterType(EnumParameterType.String);
    if (dragNode.DataType == EnumDataType.Numeric) {
        ReportTemplateParameter.ParameterType = EnumParameterType.Numeric;
    }
    else if (dragNode.DataType == EnumDataType.DateTime) {
        ReportTemplateParameter.ParameterValue = 0;
        ReportTemplateParameter.ParameterType = EnumParameterType.DateTime;
    }

    ParameterColumns.push(ReportTemplateParameter);
    AddToParamsSetting(ReportTemplateParameter);
}

function AddToParamsSetting(ReportTemplateParameter) {
    paramType = getParameterType(ReportTemplateParameter.ParameterType);
    var linkObj = $('<a href="javascript:void(0);" ><span>' + ReportTemplateParameter.DisplayName + '</span><span>[' + paramType + ']</span></a>');
    var dragTarge = $("<i class='fa fa-arrows'></i>");
    linkObj.attr("ColumnCode", ReportTemplateParameter.ColumnCode);
    linkObj.click(ParamColumn_Click);

    var divObj = $("<div class='DragObj fa fa-arrows'></div>");
    //绑定事件
    divObj.ligerDrag({
        proxyX: 2, proxyY: 2,
        proxy: function (draggable, e) {
            var obj = (e.target || e.srcElement);
            if ($(obj).hasClass("DragObj")) {
                var content = $(obj).html();
                var proxy = $("<div class='l-drag-proxy' name='dragDiv' style='display:none'><div name='dragDiv' class='l-drop-icon l-drop-no'></div></div>").appendTo('body');
                proxy.append(content);
                return proxy;
            }
            return null;
        },
        onDrag: function (current, e) {
            var obj = (e.target || e.srcElement);
            if ($(obj).attr("name") != "dragDiv"
                && !$(obj).hasClass("DragObj")
                && !$(obj).closest("div").hasClass("DragObj")
                && $(obj).closest("div").attr("id") != "paramsSetting") {
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
            var code = this.target.find("a").attr("ColumnCode");
            for (var i = 0, j = ParameterColumns.length; i < j; i++) {
                if (ParameterColumns[i].ColumnCode == code) {
                    ParameterColumns.splice(i, 1)
                    break;
                }
            }
            this.target.remove();
        }
    });

    $("#paramsSetting").append(divObj.append(linkObj));
    linkObj.click();
}

//过滤参数列点击事件
function ParamColumn_Click() {
    var code = $(this).attr("ColumnCode");
    var ParameterColumn = GetParamColumn(code);

    ColumnPanel.hide();
    ColumnPanel.removeAttr("ColumnCode");
    ParamPanel.show();
    ParamPanel.attr("ColumnCode", code);

    ChangeParamPanel(ParameterColumn);
}

//获取过滤参数
function GetParamColumn(ColumnCode) {
    for (var i = 0, j = ParameterColumns.length; i < j; i++) {
        if (ParameterColumns[i].ColumnCode == ColumnCode) {
            return ParameterColumns[i];
            break;
        }
    }
    return null;
}
//#endregion

//#region 清空数据
function ClearData() {
    ClearColumns();
    ParameterColumns.length = 0;
    ColumnPanel.hide();
    ParamPanel.hide();
    ColumnPanel.removeAttr("ColumnCode");
    ParamPanel.removeAttr("ColumnCode");
    $("#paramsSetting").html("");
}
//#endregion

//#region 改变右边过滤参数模块
function ChangeParamPanel(ParameterColumn) {
    if (ParameterColumn == null) {
        return;
    }
    $("a[ColumnCode='" + ParameterColumn.ColumnCode + "']>span").eq(1).text("[" + getParameterType(ParameterColumn.ParameterType) + "]");

    lbPColCode.html(ParameterColumn.ColumnCode);
    slPColType.val(ParameterColumn.ParameterType);
    txtParamDes.val(ParameterColumn.Description);

    ckAllowNull.closest("tr").show();
    ckAllowNull.prop("checked", ParameterColumn.AllowNull == null ? true : ParameterColumn.AllowNull);
    ckIsShow.prop("checked", ParameterColumn.Visible == null ? true : ParameterColumn.Visible);

    txtDefaultValue.closest("tr").hide();
    slDataTime.closest("tr").hide();
    slSystem.closest("tr").hide();
    txtFixedValue.closest("tr").hide();
    slOrgnization.closest("tr").hide();
    //各种参数类型处理
    switch (ParameterColumn.ParameterType) {
        case EnumParameterType.String:
        case EnumParameterType.Numeric:
            txtDefaultValue.closest("tr").show();
            if (ParameterColumn != null) {
                txtDefaultValue.val(ParameterColumn.DefaultValue);
            }
            break;
        case EnumParameterType.DateTime:
            slDataTime.closest("tr").show();
            if (ParameterColumn != null) {
                slDataTime.val(ParameterColumn.ParameterValue);
            }
            else {
                slDataTime.val("0");
            }
            break;
        case EnumParameterType.Orgnization:
            slOrgnization.closest("tr").show();
            if (ParameterColumn != null) {
                slOrgnization.val(ParameterColumn.ParameterValue);
            }
            else {
                slOrgnization.val("0");
            }
            break;
        case EnumParameterType.WorkflowCode:
            break;
        case EnumParameterType.System:
            slSystem.closest("tr").show();
            txtDefaultValue.closest("tr").hide();
            ckAllowNull.closest("tr").hide();
            ckAllowNull.val(false);
            ckIsShow.val(false);
            if (ParameterColumn != null && ParameterColumn.ParameterValue != null) {
                slSystem.val(ParameterColumn.ParameterValue);
            }
            else {
                slSystem.val("0");
                ParameterColumn.ParameterValue = slSystem.val();
            }
            break;
        case EnumParameterType.MasterData:
            txtDefaultValue.closest("tr").show();
            if (ParameterColumn != null) {
                txtDefaultValue.val(ParameterColumn.DefaultValue);
            }
            break;
        case EnumParameterType.FixedValue:
            txtDefaultValue.closest("tr").show();
            txtFixedValue.closest("tr").show();
            if (ParameterColumn != null) {
                txtDefaultValue.val(ParameterColumn.DefaultValue);
                txtFixedValue.val(ParameterColumn.ParameterValue);
            }
            break;
    }
}
//#endregion

//#region 过滤模块内的各种设置改变事件

//#region 过滤参数类型改变事件
function slPColType_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.ParameterType = parseInt($(this).val());
    ChangeParamPanel(ParameterColumn);
}
//#endregion

//#region 固定值修改
function txtFixedValue_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    var ParameterValue = txtFixedValue.val();
    if (ParameterValue.endsWith(";")) {
        ParameterValue = ParameterValue.subString(0, ParameterValue.length - 1)
    }
    ParameterColumn.ParameterValue = ParameterValue;
}
//#endregion

//#region 系统参数值 改变事件
function slSystem_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.ParameterValue = slSystem.val();
}
//#endregion

//#region 组织权限修改
function slOrgnization_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.ParameterValue = slOrgnization.val();
}
//#endregion

//#region 过滤默认值修改
function txtDefaultValue_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.DefaultValue = txtDefaultValue.val();
}
//#endregion

//#region 日期默认范围修改
function slDataTime_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.ParameterValue = slDataTime.val();
}
//#endregion 

//#region 允许为空修改
function ckAllowNull_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.AllowNull = ckAllowNull.prop("checked");
}
//#endregion 

//#region 是否显示修改
function ckIsShow_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.Visible = ckIsShow.prop("checked");
}
//#endregion 

//#region 描述修改
function txtParamDes_Change() {
    var ParameterColumn = GetParamColumn(ParamPanel.attr("ColumnCode"));
    ParameterColumn.Description = txtParamDes.val();
}
//#endregion 
