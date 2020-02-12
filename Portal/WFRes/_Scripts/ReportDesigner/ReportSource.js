/* 报表数据源 */

//#region 变量、参数
//报表数据源编码
var SourceCode = "";
//父节点ID
var ParentID = "";
//异步处理地址
//var PostUrl = "../Ajax/ReportHandler/ReportSource.ashx";
//var PostUrl = $.Controller.ReportSource
var EnumSorceType = {
    H3System: "H3System",
    DbConnection: "DbConnection"
}
var EnumDataSourceType = {
    Table: "Table",
    View: "View",
    SQL: "SQL"
}
var EnumReportSourceColumnType = {
    TableColumn: 0,
    CustomColumn: 1,
    RuleColumn: 2
}
//列表格管理器
var ColumnsTableManger = null;
// 数据源列数据
var OriginalColumnData = null;

//数据源定义，与后台表结构一致
var ReportSource = new ReportSourceSetting();

//加载字段
var NeedLoadColumn = false;

//当前行信息
var TempField = null;
//#endregion

//#region 初始化函数:入口
function SettingInit(SourceCodeParam, ParentIDParam) {
    SourceCode = SourceCodeParam;
    ParentID = ParentIDParam;
    //input
    txtCode = $("#txtCode");//编码
    txtSourceName = $("#txtSourceName");//名称
    //txtWhereStr = $("#txtWhereStr");//条件
    txtSql = $("#txtSql");//sql语句
    txtColumnName = $("#txtColumnName");//弹窗的列名
    txtDataRuleText = $("#txtDataRuleText");//弹窗的列规则
    txtColumnCode = $("#txtColumnCode");//弹窗的列编码
    txtDisplayName = $("#txtDisplayName");//弹窗的列显示名称
    //radio
    rbSorceType = $("input[name='rbSorceType']");//报表数据源配置类型
    rblDataSourceType = $("input[name='rblDataSourceType']");//数据源类型
    //select
    lstDbConnection = $("#lstDbConnection");//报表数据源
    lstTables = $("#lstTables");//表或视图
    selOrderRule = $("#selOrderRule");//排序规则
    //lable
    lbSourceType = $("#lbSourceType");
    //button
    btnAddField = $("#btnAddField");
    btnSaveFiledInfo = $("#btnSaveFiledInfo");
    //弹出框
    EidtFiledDialog = $("#EidtFiledDialog");
    //工具栏
    $("#H3ToolBar").AspLinkToolBar();
    $("#FieldToolBar").AspLinkToolBar({ IsFixed: false });
    //编辑字段信息
    $("#FiledDialogPanle").BuildPanel();
    $("#DialogButtons").AspLinkToolBar({ IsFixed: false });
    //向导步骤
    $("#H3Wizard").H3Wizard(
        {
            guideId: "Guide",
            onFinish: FinishFun,
            onNextStep: NextStepFun,
            onAfterShowStep: onAfterShowStep,
            excludeIDs: ["Step3Content"]
        });

    //绑定数据源改变
    $(rbSorceType).change(SorceType_Change);
    $(rblDataSourceType).change(DataSourceType_Change);

    //改变数据源更改字段信息
    //lstSchemaListValue.change(SourceChangedThenColunmsChange);
    lstTables.change(SourceChangedThenColunmsChange);
    txtSql.change(SourceChangedThenColunmsChange);

    //添加字段事件
    btnAddField.click(btnAddField_Click);
    btnSaveFiledInfo.click(btnSaveFiledInfo_Click);
    $("input[name='CustomType']").change(CustomType_Change);
    //预览事件
    $("#btnView").click(function () {
        if (ColumnsTableManger == null || ColumnsTableManger.rows == null || ColumnsTableManger.rows.length == 0) {
            ShowWarn(T("Script_RP_Warn1", "没有字段配置，预览不了数据!"));
            return;
        }
        //字段信息
        ShowDialog(ReportSource.DisplayName, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=BPA/ReportSourceView.html&ViewType=Source");
    });
    if (SourceCode != "") {
        LoadSourceSetting();
    }
    else {
        $("#divWorkflow").SheetWorkflow({ Editable: true, Visiable: true, IsMultiple: false, Mode: "Package", Originate: true, OnChange: function () { SourceChangedThenColunmsChange() } });
        //触发事件
        $(rbSorceType).change();
    }

    $("#txtSqlLen").html(T("Script_RP_WordCount", "字数:") + txtSql.val().length);
    txtSql.keyup(function () {
        $("#txtSqlLen").html(T("Script_RP_WordCount", "字数:") + txtSql.val().length);
    });
}
//#endregion

//#region 字段相关事件

//删除字段事件
function btnDelField_Click(index) {
    var row = ColumnsTableManger.getRow(index);
    for (var i = 0, j = ReportSource.Columns.length; i < j; i++) {
        if (ReportSource.Columns[i].ColumnCode == row.ColumnCode) {
            ReportSource.Columns.splice(i, 1)
            break;
        }
    }
    ColumnsTableManger.deleteRow(index);
}

//添加字段事件
function btnAddField_Click() {
    ClearFiledDialogData();
    //var row = ColumnsTableManger.getSelectedRow();
    ////参数1:rowdata(非必填)
    ////参数2:插入的位置 Row Data 
    ////参数3:之前或者之后(非必填)
    //ColumnsTableManger.addEditRow(row);
    //return;
    var parentIndex = isNaN(arguments[0]) ? null : arguments[0];
    EidtFiledDialog.attr("isCreateNew", true);
    EidtFiledDialog.attr("parentIndex", parentIndex);
    FiledDialog = $.ligerDialog.open({
        target: EidtFiledDialog,
        height: 550,
        width: 800,
        showMax: true
    });
    //下拉框
    txtColumnName.ligerComboBox({
        tree: {
            data: OriginalColumnData,
            idFieldName: 'ColumnName',
            textFieldName: 'DisplayName',
            checkbox: false,
            btnClickToToggleOnly: false
        },
        valueField: 'ColumnName',
        textField: 'DisplayName',
        valueFieldID: 'ColumnName',
        selectBoxWidth: 360,
        selectBoxHeight: 260,
        treeLeafOnly: true
    });
    //初始化数据
    txtDisplayName.val("");
    txtColumnCode.SetEnabled();
    txtColumnCode.val("");

    $("input[name='CustomType'][value='TableColumn']").attr("checked", "checked");
    $("input[name='CustomType']").change();
}

//编辑字段事件
function btnEditField_Click(index) {
    //ColumnsTableManger.beginEdit(index);
    //return;
    ClearFiledDialogData();
    var field = ColumnsTableManger.getRow(index);
    TempField = field;
    EidtFiledDialog.attr("isCreateNew", false);
    EidtFiledDialog.attr("rowIndex", index);
    if (field.ParentColumnCode) {
        EidtFiledDialog.attr("parentIndex", field.ParentIndex);
    }
    FiledDialog = $.ligerDialog.open({
        target: EidtFiledDialog,
        height: 550,
        width: 800,
        showMax: true
    });
    //下拉框
    var columnNameManager = txtColumnName.ligerComboBox({
        tree: {
            data: CreateTreeData(OriginalColumnData),
            idFieldName: 'ColumnName',
            textFieldName: 'DisplayName',
            checkbox: false,
            btnClickToToggleOnly: false
        },
        valueField: 'ColumnName',
        textField: 'DisplayName',
        valueFieldID: 'ColumnName',
        selectBoxWidth: 360,
        selectBoxHeight: 260,
        treeLeafOnly: true
    });
    $("input[name='CustomType']").prop("checked", false);
    switch (field.ReportSourceColumnType) {
        case EnumReportSourceColumnType.TableColumn:
            $("input[name='CustomType']").eq(0).prop("checked", true);
            break;
        case EnumReportSourceColumnType.CustomColumn:
            //自定义列头
            $("input[name='CustomType']").eq(1).prop("checked", true);
            break;
        case EnumReportSourceColumnType.RuleColumn:
            //自定义规则
            $("input[name='CustomType']").eq(2).prop("checked", true);
            break;
        default:
            break;
    }
    $("input[name='CustomType']").change();
    txtColumnCode.SetDisabled();
    txtColumnCode.val(field.ColumnCode);
    txtDisplayName.val(field.DisplayName);
    columnNameManager.setValue(field.ColumnName);
    txtColumnName.val(field.ColumnName);
    txtDataRuleText.val(field.DataRuleText);

    selOrderRule.val("Null");
    if (field.IsOrderColumn) {
        if (field.Ascending)
            selOrderRule.val("ASC")
        else
            selOrderRule.val("DESC")
    }
}

//#region按钮取消事件
//function btnEditField_CancelEdit(index) {
//    var rowData = ColumnsTableManger.getRow(index);
//    ColumnsTableManger.cancelEdit(index);
//    if (rowData.ColumnCode == null) {
//        ColumnsTableManger.deleteRow(index);
//    }
//}
//#endregion

//#region 行确定
//function btnEditField_Submit(index) {
//    var newRow = new ReportSourceColumnSetting();
//    var rowData = ColumnsTableManger.getRow(index);
//    var isNew = rowData.__status == "add";
//    if (rowData.ColumnCode == null) {
//        ShowWarn("编码不能未空!");
//        return;
//    }
//    newRow.ColumnCode = rowData.ColumnCode;
//    if (rowData.ColumnName != null) {
//        newRow.ReportSourceColumnType = ReportSourceColumnType.TableColumn;
//        newRow.ColumnName = rowData.ColumnName;
//    }
//    else if (rowData.DataRuleText != null) {
//        newRow.ReportSourceColumnType = ReportSourceColumnType.RuleColumn;
//        newRow.DataRuleText = rowData.DataRuleText;
//    }
//    else {
//        newRow.ReportSourceColumnType = ReportSourceColumnType.CustomColumn;
//    }
//    newRow.DisplayName = rowData.DisplayName;
//    ColumnsTableManger.endEdit(index);
//}
//#endregion

//保存字段事件
function btnSaveFiledInfo_Click() {
    var newRow = new ReportSourceColumnSetting();
    if (txtColumnCode.val() == "") {
        ShowWarn(T("CodeNotNull", "编码必填"));
        return;
    }
    else {
        //校验编码规范
        var reg = new RegExp("^[a-zA-Z][a-zA-Z0-9_-]*");
        var r = txtColumnCode.val().match(reg);
        if (r == null || r[0] != r.input) {
            ShowWarn(T("Script_RP_Warn2", "编码不符合规范，必须以字母开始,且只能包含字母、数字、下划线和-"));
            return;
        }
    }
    //自定义类型
    var customType = $("input[name='CustomType']:checked").val();
    if (customType == "RuleColumn") {
        if (txtDataRuleText.val() == "") {
            ShowWarn(T("Script_RP_CustomRuleNull", "没有自定义规则"));
            return;
        }
        newRow.ReportSourceColumnType = EnumReportSourceColumnType.RuleColumn;
        newRow.DataRuleText = txtDataRuleText.val();
        if (!isNaN(newRow.DataRuleText)) {//如果是数字
            newRow.DataType = EnumDataType.Numeric;
        }
    }
    else if (customType == "CustomColumn") {
        newRow.ReportSourceColumnType = EnumReportSourceColumnType.CustomColumn;
    }
    else {
        if ($("#ColumnName").val() == "") {
            ShowWarn(T("EditReportSource_SelectField", "选择字段"));
            return;
        }
        else {
            newRow.ReportSourceColumnType = EnumReportSourceColumnType.TableColumn;
            for (var i in OriginalColumnData) {
                if (OriginalColumnData[i].ColumnCode == $("#ColumnName").val()
                    && (OriginalColumnData[i].ParentColumnCode == null || OriginalColumnData[i].ParentColumnCode == "")) {
                    newRow.DataType = OriginalColumnData[i].DataType;
                }
            }
        }
    }

    newRow.ColumnCode = txtColumnCode.val();
    newRow.ColumnName = $("#ColumnName").val();// txtColumnName.val();
    newRow.DisplayName = txtDisplayName.val();

    if (selOrderRule.val() == "ASC") {
        newRow.IsOrderColumn = true;
        newRow.Ascending = true;
    }
    else if (selOrderRule.val() == "DESC") {
        newRow.IsOrderColumn = true;
        newRow.Ascending = false;
    }
    else {
        newRow.IsOrderColumn = false;
    }
    if (EidtFiledDialog.attr("isCreateNew").toLowerCase() == "true") {//新增
        var parentIndex = EidtFiledDialog.attr("parentIndex");
        for (var i = 0, j = ReportSource.Columns.length; i < j; i++) {
            if (ReportSource.Columns[i].ColumnCode == txtColumnCode.val()) {
                ShowWarn(T("Script_RP_CodeExist", "编码已经存在"));
                return;
            }
        }
        if (parentIndex) {
            if (newRow.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn) {
                ShowWarn(T("Script_RP_Warn3", "自定义列头下不允许再增加自定义列头"));
                return;
            }
            var parentRow = ColumnsTableManger.getRow(parentIndex);
            newRow.ParentColumnCode = parentRow.ColumnCode;
            newRow.ParentIndex = parentIndex;
        }
        ReportSource.Columns.push(newRow);
        LoaColumnTable(ReportSource.Columns);
    }
    else {
        var rowIndex = EidtFiledDialog.attr("rowIndex");
        var editRow = ColumnsTableManger.getRow(rowIndex);
        newRow.ParentColumnCode = editRow.ParentColumnCode;
        var parentIndex = EidtFiledDialog.attr("parentIndex");
        if (parentIndex) {
            if (newRow.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn) {
                ShowWarn(T("Script_RP_Warn3", "自定义列头下不允许再增加自定义列头"));
                return;
            }
        }
        switch (customType) {
            case "TableColumn":
                newRow.DataRuleText = "";
                break;
            case "CustomColumn":
                //自定义列头
                newRow.DataRuleText = "";
                newRow.ColumnName = "";
                selOrderRule.val("Null");
                break;
            case "RuleColumn":
                //自定义规则
                selOrderRule.val("Null");
                break;
            default:
                break;
        }
        UpdateColumnByCode(editRow.ColumnCode, newRow);
        ColumnsTableManger.updateRow(ColumnsTableManger.getRow(rowIndex), newRow);
    }
    FiledDialog.close();
}

//根据Code查找列
function UpdateColumnByCode(ColumnCode, RowData) {
    for (var i = 0, j = ReportSource.Columns.length; i < j; i++) {
        if (ReportSource.Columns[i].ColumnCode == ColumnCode) {
            ReportSource.Columns[i].DisplayName = RowData.DisplayName;
            ReportSource.Columns[i].ColumnName = RowData.ColumnName;
            ReportSource.Columns[i].ReportSourceColumnType = RowData.ReportSourceColumnType;
            ReportSource.Columns[i].DataRuleText = RowData.DataRuleText;
            break;
        }
    }
}

//字段类型改变事件:是否自定义或列头
function CustomType_Change() {
    var customType = $("input[name='CustomType']:checked").val();
    if (customType == "RuleColumn") {
        //txtColumnName.val("");
        txtColumnName.ligerGetComboBoxManager().setDisabled();
        txtDataRuleText.SetEnabled();
        selOrderRule.SetEnabled();

        txtColumnName.closest("tr").hide();
        txtDataRuleText.closest("tr").show();
        selOrderRule.closest("tr").hide();
    }
    else if (customType == "CustomColumn") {
        txtColumnName.ligerGetComboBoxManager().setDisabled();
        //txtColumnName.val("");
        txtDataRuleText.SetDisabled();
        //txtDataRuleText.val("");
        selOrderRule.SetDisabled();
        //selOrderRule.val("Null");

        txtColumnName.closest("tr").hide();
        txtDataRuleText.closest("tr").hide();
        selOrderRule.closest("tr").hide();
    }
    else {
        txtColumnName.ligerGetComboBoxManager().setEnabled();
        //txtColumnName.val("");
        txtDataRuleText.SetDisabled();
        //txtDataRuleText.val("");
        selOrderRule.SetEnabled();

        txtColumnName.closest("tr").show();
        txtDataRuleText.closest("tr").hide();
        selOrderRule.closest("tr").show();
    }
}

//清除字段信息
function ClearFiledDialogData() {
    EidtFiledDialog.attr("parentIndex",null);
    txtColumnName.val("");
    txtColumnCode.val("");
    txtDisplayName.val("");
    selOrderRule.val("Null");
    txtDataRuleText.val("");
}
//#endregion

//#region 向导相关事件

//下一步事件
function NextStepFun(eventOptions) {
    switch (eventOptions.selected) {
        case 1://步骤一：1.判断必录项；2.需要判断是否跳过第二步骤
            StepOneFun(eventOptions);
            break;
        case 2:
            StepSecFun(eventOptions);
            break;
    }
}

//步骤显示加载前的事件
function onAfterShowStep(options) {
    if (options.selected == 2) {//第二步骤：加载表视图
        $(rblDataSourceType).change();
    }
    else if (options.selected == 3) {//最后一步骤
        PreShowStepTree();
    }
}

//第一步完成事件:校验编码、名称必录
function StepOneFun(eventOptions) {
    //校验编码必录
    if ($(txtCode).val() == "") {
        eventOptions.isCancel = true;
        ShowWarn(T("CodeNotNull", "编码必填"));
        return;
    }
    //判断是否跳过第二步骤
    if ($(":radio[name='rbSorceType']:checked").val() == EnumSorceType.H3System) {
        var divWorkflowValue = $("#divWorkflow").SheetUIManager().GetValue();
        if (divWorkflowValue == null || divWorkflowValue == "") {
            eventOptions.isCancel = true;
            ShowWarn(T("Script_RP_SelectMode", "请选择数据模型！"));
            return;
        }

        eventOptions.nextSelectd = 3;
    }
}

//第二步骤完成事件：校验表或Sql是否为空
function StepSecFun(eventOptions) {
    var dataSourceType = $(":radio[name='rblDataSourceType']:checked").val();
    switch (dataSourceType) {
        case EnumDataSourceType.Table:
        case EnumDataSourceType.View:
            if (lstTables.val() == null) {
                ShowWarn(lbSourceType.text() + T("Script_RP_Required", "必选!"));
                eventOptions.isCancel = true;
            }
            break;
        case EnumDataSourceType.SQL:
            if (txtSql.val() == "") {
                ShowWarn(T("Script_RP_Warn4", "Sql必填!"));
                eventOptions.isCancel = true;
            }
            else if (new RegExp(/order\s+by/).test(txtSql.val().toLowerCase())) {
                ShowWarn(T("Script_RP_Warn12", "Sql语句中不能包含order by!"));
                eventOptions.isCancel = true;
            }
            else {
                PostAjax($.Controller.ReportSource.SqlValidation, { dbCode: lstDbConnection.val(), sqlData: txtSql.val() }, function (data) {
                    if (!data.Success) {
                        ShowWarn(T("Script_RP_Warn5", "Sql语句有误！"));
                        eventOptions.isCancel = true;
                    }
                });
            }
            break;
    }
}

//第三步骤显示前事件:加载字段信息
function PreShowStepTree() {
    if (!ReportSource.IsEdit) {
        //新增的时候才需要重新加载
        ReportSource.Code = txtCode.val();
    }

    ReportSource.DisplayName = txtSourceName.val();
    ReportSource.Description = "Description";
    ReportSource.ReportSourceType = $(":radio[name='rbSorceType']:checked").val();
    if (ReportSource.ReportSourceType == EnumSorceType.H3System) {
        var divWorkflowValue = $("#divWorkflow").SheetUIManager().GetValue();
        if (divWorkflowValue != null && divWorkflowValue != "") {
            //H3业务系统的话，选择数据模型
            //由于选数据模型的控件改变，没有数据模型的数据库信息，这里写死I_
            //var schemaParam = $(lstSchemaListValue).find("option[value^=" + $(lstSchemaListValue).val() + "]").val();// lstSchemaList.val().split("@");
            ReportSource.SchemaCode = divWorkflowValue;

            ReportSource.TableNameOrCommandText = "I_" + divWorkflowValue;
        }
    }
    else {
        if (lstDbConnection.val() != null) {
            ReportSource.DbCode = lstDbConnection.val();
        }
        //数据库连接的话，选择表、视图或SQL
        ReportSource.DataSourceType = $(":radio[name='rblDataSourceType']:checked").val();
        switch (ReportSource.DataSourceType) {
            case EnumDataSourceType.Table:
            case EnumDataSourceType.View:
                if (lstTables.val() != null)
                    ReportSource.TableNameOrCommandText = lstTables.val();
                break;
            case EnumDataSourceType.SQL:
                if (txtSql.val() != null)
                    ReportSource.TableNameOrCommandText = txtSql.val();
                break;
        }
    }

    if (ReportSource.Columns == null || NeedLoadColumn) {
        NeedLoadColumn = false;
        var param = {
            ReportSourceSetting: JSON.stringify(ReportSource)
        };
        PostAjax($.Controller.ReportSource.LoadCloumnData, param, function (data) {
            if (!data.Success) {
                ShowWarn(data.Message);
            }
            OriginalColumnData = data.Extend;
            //保留原来一样的字段
            for (var i = 0; i < OriginalColumnData.length; i++) {
                var columnData = ColumnsTableManger == null ? null : ColumnsTableManger.getRow(i);
                //同一个字段名称的时候,显示名和排序保留
                if (columnData != null && OriginalColumnData[i].ColumnName.toLowerCase() == columnData.ColumnName.toLowerCase()) {
                    OriginalColumnData[i].DisplayName = columnData.DisplayName;
                    OriginalColumnData[i].IsOrderColumn = columnData.IsOrderColumn;
                    OriginalColumnData[i].Ascending = columnData.Ascending;
                }
            }
            ReportSource.Columns = OriginalColumnData;
            LoaColumnTable(ReportSource.Columns);
        });
    }
    else {
        //加载
        LoaColumnTable(ReportSource.Columns);
    }
}

//完成事件:保存更新
function FinishFun() {
    ReportSource.Columns = ColumnsTableManger.rows;
    var Command = ReportSource.IsEdit ? "UpdateReportSourceSetting" : "AddReportSourceSetting";
    var param = {
        reportSourceSetting: JSON.stringify(ReportSource)
    };
    PostAjax($.Controller.ReportSource[Command], param, function (data) {
        var saveResult = data;
        if (saveResult.Success) {
            top.ReloadNode(ParentID);
            ShowSuccess($.Lang("msgGlobalString.SaveSucced"));
            if (!ReportSource.IsEdit) {
                top.workTab.setHeader(top.workTab.getSelectedTabItemID(), ReportSource.DisplayName);
                top.$("iframe[id='" + top.workTab.getSelectedTabItemID() + "']").attr("src", _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=BPA/EditReportSource.html&ReportSourceCode=" + ReportSource.Code + "&ParentID=" + ParentID);
            }
        }
        else {
            if (saveResult.Extend) {
                if (ReportSource.IsEdit) {
                    ShowWarn($.format($.Lang(saveResult.Message), data.Extend));
                } else {
                    var errorArry = new Array();
                    for (var i = 0 ; i < saveResult.Extend.length; i++) {
                        var errorMsg = $.format(saveResult.Message, saveResult.Extend[i][0], saveResult.Extend[i][1]);
                        errorArry.push(errorArry);
                    }
                    ShowMultiMsg(errorArry);
                }

            } else {
                ShowWarn($.Lang(saveResult.Message));
            }
        }
    });
}

//#endregion

//#region 下拉框、单选框改变事件
//数据源配置类型改变事件
function SorceType_Change() {
    var SorceType = $(":radio[name='rbSorceType']:checked").val();
    LoadSorceBySorceType(SorceType);
    //if (ReportSource.IsEdit) {
    //    //lstSchemaList.val(ReportSource.SchemaCode + "@" + ReportSource.TableNameOrCommandText);
    //    lstSchemaListValue.val(ReportSource.SchemaCode);
    //}
    SourceChangedThenColunmsChange();
}

function LoadSorceBySorceType(SorceType) {
    if (SorceType == EnumSorceType.H3System) {
        $("#trH3System").show();
        $(lstDbConnection).parent().parent().hide();
        //if ($(lstSchemaList).children().length > 0) return;
    }
    else {
        $(lstDbConnection).parent().parent().show();
        $("#trH3System").hide();
        if ($(lstDbConnection).children().length > 0) return;
    }

    if (SorceType == EnumSorceType.H3System) {
        return;
    }
    var param = { sorceType: SorceType };
    PostAjax($.Controller.ReportSource.SorceTypeChange, param, function (data) {
        var objs = data;
        for (var j in objs) {
            if (objs[j].Value.indexOf("Engine") > -1) {
                objs[j].Text = T("EngineDatabase", "引擎数据库");
            }
            if (objs[j].Value.indexOf("Log") > -1) {
                objs[j].Text = T("LogDatabase", "日志数据库");
            }
        }
        if (SorceType == EnumSorceType.H3System) {
            //for (var i in objs) {
            //    $(lstSchemaList).append("<option value='" + objs[i].Value + "'>" + objs[i].Text + "</option>");
            //}
        }
        else {
            for (var i in objs) {
                $(lstDbConnection).append("<option value='" + objs[i].Value + "'>" + objs[i].Text + "</option>");
            }
        }
    });
}

//数据源类型改变事件
function DataSourceType_Change() {
    var dataSourceType = $(":radio[name='rblDataSourceType']:checked").val();
    switch (dataSourceType) {
        case EnumDataSourceType.Table:
            lbSourceType.text(T("EditReportSource_DataSheet", "数据表"));
            lbSourceType.parent().parent().show();
            txtSql.parent().parent().hide();
            LoadTables();
            break;
        case EnumDataSourceType.View:
            lbSourceType.text(T("EditReportSource_View", "视图"));
            lbSourceType.parent().parent().show();
            txtSql.parent().parent().hide();
            LoadViews();
            break;
        case EnumDataSourceType.SQL:
            lbSourceType.parent().parent().hide();
            txtSql.parent().parent().show();
            break;
    }

    SourceChangedThenColunmsChange();
}

//数据源类型改变或数据类型改变的话，判断是否需要重新加载字段信息
function SourceChangedThenColunmsChange() {
    var SorceType = $(":radio[name='rbSorceType']:checked").val();
    if (ReportSource.ReportSourceType != SorceType) {
        NeedLoadColumn = true;
        //ReportSource.Columns = null;
    }
    else {
        if (SorceType == EnumSorceType.H3System) {
            //如果是H3业务系统的话,判断数据模型是否一样
            if ($("#divWorkflow").SheetUIManager().GetValue() != ReportSource.SchemaCode + "@" + ReportSource.TableNameOrCommandText) {
                NeedLoadColumn = true;
                //ReportSource.Columns = null;
            }
            else if (!ReportSource.IsEdit) {//数据模型一样，则保留原来的数据
                ReportSource.Columns = OriginalColumnData;
            }
        }
        else {//如果是数据连接的话，判断连接库、表是否相同
            if (lstDbConnection.val() != ReportSource.DbCode) {
                NeedLoadColumn = true;
                //ReportSource.Columns = null;
            }
            else {//如果连接池一样，则判断表两类型是否一样
                var DataSourceType = $(":radio[name='rblDataSourceType']:checked").val();
                if (DataSourceType != ReportSource.DataSourceType) {
                    NeedLoadColumn = true;
                    //ReportSource.Columns = null;
                }
                else {
                    switch (DataSourceType) {
                        case EnumDataSourceType.Table:
                        case EnumDataSourceType.View:
                            if (lstTables.val() != "" && lstTables.val() != null) {
                                if (lstTables.val() != ReportSource.TableNameOrCommandText) {
                                    NeedLoadColumn = true;
                                    //ReportSource.Columns = null;
                                }
                                else if (!ReportSource.IsEdit) {
                                    ReportSource.Columns = OriginalColumnData;
                                }
                            }
                            break;
                        case EnumDataSourceType.SQL:
                            var pattern = new RegExp("[\\s]", "gi");//去掉所有的空格、回车、换行符
                            if (txtSql.val().replace(pattern, "") != ReportSource.TableNameOrCommandText.replace(pattern, "")) {
                                NeedLoadColumn = true;
                                //ReportSource.Columns = null;
                            }
                            else if (!ReportSource.IsEdit) {
                                ReportSource.Columns = OriginalColumnData;
                            }
                            break;
                    }
                }
            }
        }
    }
}
//#endregion

//#region 表格相关

//表格列
function GetColumnNames() {
    return [
        { display: T("EditReportSource_FieldCode", '字段编码'), id: "ParentColumn", name: "ColumnCode", editor: { type: 'text' } },
        { display: T("EditReportSource_FieldName", '字段名称'), name: "ColumnName", editor: { type: 'select', data: OriginalColumnData, valueField: "ColumnCode", textField: "DisplayName" } },
        { display: T("DisplayName", '显示名称'), name: "DisplayName", editor: { type: 'text' } },
        { display: T("EditReportSource_DataRule", '数据规则'), name: "DataRuleText", editor: { type: 'text' } },
        {
            display: T("Button_Edit", '编辑'), name: "Edit", render: function (rowdata, index, value) {
                var btnEditRow = "<div style='float:left;margin-right:5px'><a style='float:left;' href='javascript:void(0);' onclick='btnEditField_Click(" + index + ")' >" + T("Button_Edit", "编辑") + "</a></div>";
                var btnDelRow = "<div style='float:left;margin-right:5px'><a style='float:left;' href='javascript:void(0);' onclick='btnDelField_Click(" + index + ")' >" + T("Button_Remove") + "</a></div>";
                var btnAddRow = "";
                if (rowdata.ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn) {
                    btnAddRow = "<div style='float:left;'><a style='float:left;' href='javascript:void(0);' onclick='btnAddField_Click(" + index + ")' >" + T("Script_RP_AddChildColumn", "添加子列") + "</a></div>";
                }
                return btnEditRow + btnDelRow + btnAddRow;
            }
        }
    ];
}

//创建树数据
function CreateTreeData(data) {
    var treeData = new Array();
    if (data != null) {
        for (var i = 0, j = data.length; i < j; i++) {
            if (data[i].ParentColumnCode == null || data[i].ParentColumnCode == "") {
                var dataTmp = data[i];
                if (data[i].ReportSourceColumnType == EnumReportSourceColumnType.CustomColumn)
                    dataTmp.ChildrenColumns = GetChildren(dataTmp.ColumnCode, data);
                treeData.push(dataTmp);
            }
        }
    }
    return treeData;
}

//读取子节点
function GetChildren(parentCode, data) {
    var dataList = new Array();
    for (var i = 0, j = data.length; i < j; i++) {
        if (data[i].ParentColumnCode == parentCode) {
            dataList.push(data[i]);
        }
    }
    return dataList.length == 0 ? null : dataList;
}

//显示列表格
function LoaColumnTable(data) {
    var dataList = { Rows: new Array(), Total: 0 }
    dataList.Rows = CreateTreeData(data);
    dataList.Total = dataList.Rows.length;
    if (ColumnsTableManger == null) {
        //创建表格
        ColumnsTableManger = $("#ColumnTable").ligerGrid({
            columns: GetColumnNames(),
            width: '99%',
            height: 'auto',
            rownumbers: true,
            data: dataList,
            dataAction: "local",
            usePager: false,
            allowAdjustColWidth: true,
            rownumbers: true,
            enabledSort: false,
            //Error:编辑功能 先屏蔽，后续再改进
            //enabledEdit: true,
            //clickToEdit: false,
            columnWidth: "auto",
            tree: { columnId: 'ParentColumn', childrenName: 'ChildrenColumns' }
        });
    }
    else {
        ColumnsTableManger.loadData(dataList);
    }
}

//#endregion

//#region 数据源保存事件
function btnSave_Click(obj) {
    //先加载字段信息
    PreShowStepTree();
    //在保存
    FinishFun();
    return false;
}
//#endregion

//#region 数据源删除事件
function DelReportSource(obj) {
    if (ConfirmDel(obj)) {
        PostAjax($.Controller.ReportSource.DelReportSource, { sourceCode: SourceCode }, function (data) {
            if (data.Success) {
                ShowSuccess("msgGlobalString.DeleteSucced");
                top.ReloadNode(ParentID);
                top.workTab.removeTabItem(top.workTab.getSelectedTabItemID());
            } else {
                if (data.Extend) {
                    ShowWarn($.format($.Lang(data.Message), data.Extend));
                } else {
                    ShowWarn($.Lang("msgGlobalString.DeleteFailed"));
                }
            }
        });
    }
}
//#endregion
//#region 数据加载事件
//编辑时，加载数据项
function LoadSourceSetting() {
    PostAjax(
        $.Controller.ReportSource.LoadSourceSetting,
        { sourceCode: SourceCode },
        function (result) {
            if (!result.Success) {
                return false;
            }
            var data = result.Extend;
            ReportSource = data.ReportSource;
            OriginalColumnData = data.OriginalColumnData;

            $("#divWorkflow").SheetWorkflow({ Editable: true, Visiable: true, IsMultiple: false, Mode: "Package", Originate: true, DefaultValue: ReportSource.SchemaCode, OnChange: function () { SourceChangedThenColunmsChange() } });

            ReportSource.IsEdit = true;
            txtCode.SetDisabled();
            txtCode.val(ReportSource.Code);//编码
            txtSourceName.val(ReportSource.DisplayName);//名称


            rbSorceType.eq(ReportSource.ReportSourceType).attr("checked", true)
            //数据库的枚举修改
            if (ReportSource.ReportSourceType == "0") {
                ReportSource.ReportSourceType = EnumSorceType.H3System;
                LoadSorceBySorceType(ReportSource.ReportSourceType);
                // lstSchemaList.val(ReportSource.SchemaCode + "@" + ReportSource.ExecuteTableName);
                //lstSchemaListText.val(ReportSource.SchemaCode);
            }
            else {
                ReportSource.ReportSourceType = EnumSorceType.DbConnection;
                LoadSorceBySorceType(ReportSource.ReportSourceType);
                lstDbConnection.val(ReportSource.DbCode);
            }

            rblDataSourceType.eq(ReportSource.DataSourceType).attr("checked", true)
            if (ReportSource.DataSourceType == "0") {
                ReportSource.DataSourceType = EnumDataSourceType.Table;
            }
            else if (ReportSource.DataSourceType == "1") {
                ReportSource.DataSourceType = EnumDataSourceType.View;
            }
            else {
                ReportSource.DataSourceType = EnumDataSourceType.SQL;
                txtSql.val(ReportSource.TableNameOrCommandText);
            }

            LoaColumnTable(ReportSource.Columns);
        });
}

//加载数据表列表
function LoadTables() {
    PostAjax($.Controller.ReportSource.LoadTables,
        { dbCode: lstDbConnection.val() },
        function (data) {
            lstTables.empty();
            for (var i in data) {
                lstTables.append("<option value='" + data[i] + "'>" + data[i] + "</option>");
            }
            lstTables.val(ReportSource.TableNameOrCommandText);
        });
}

//加载视图列表
function LoadViews() {
    PostAjax($.Controller.ReportSource.LoadViews,
        { dbCode: lstDbConnection.val() },
        function (data) {
            lstTables.empty();
            for (var i in data) {
                lstTables.append("<option value='" + data[i] + "'>" + data[i] + "</option>");
            }
            lstTables.val(ReportSource.TableNameOrCommandText);
        });
}

//#endregion
