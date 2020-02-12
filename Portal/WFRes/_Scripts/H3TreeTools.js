/*
 * 添加树形菜单工具按钮的方法：
 * 1.定义按钮
 * 2.在TreeToolBar里添加按钮；TreeToolBar的标示与树形菜单有ToolBarCode对应
 * 3.DoBtnActon里添加按钮执行方法
 * 根据上面3点就可以添加按钮，其他代码可以不理
 */

//#region 多语言取数接口
var _Script_GlobalString = {
    //IsLocal: true,
    "Button_Refresh": "刷新",
    "Script_TreeTool_AddFolder": "新增目录",
    "AddProcessFolder_Process": "流程目录",
    "EditBizTreeNode_AddBizService": "添加业务服务",
    "ListBizObjectSchema_NewDefine": "数据模型",
    "Script_TreeTool_AddPackage": "新建流程包",
    "DefaultSheet_Form": "新增表单",
    "Script_TreeTool_NewWorkflow": "新增流程",
    "FunctionAclByUnit_SetAcl": "权限设置",
    "Button_Remove": "删除",
    "Settings_Lock": "锁定",
    "Settings_Unlock": "解锁",
    "Script_TreeTool_MasterData": "主数据",
    "Script_TreeTool_NewServiceMethod": "添加服务方法",
    "Script_TreeTool_NewBizMethod": "添加业务方法",
    "BizObjectSchemaViewList_Add": "添加视图",
    "EditListenerPolicy_Listener": "监听实例",
    "Button_TimeJob": "定时作业",
    "EditBizObjectSchemaAssociationList_CreateAssociation": "添加关联关系",
    "EditBizTreeNode_AddBizRule": "新建业务规则",
    "EditBizRuleTable_AddDecisionMatrix": "添加决策表",
    "Script_TreeTool_ExportPackage": "导出流程包",
    "Script_TreeTool_ImportPackage": "导入流程包",
    "Function_BPA_ReportSource": "报表数据源",
    "Script_TreeTool_Summary": "明细汇总表",
    "Script_TreeTool_Cross": "交叉分析表",
    "Script_TreeTool_NewApp": "添加应用程序",
    "Script_TreeTool_ImportMasterData": "导入主数据",
    "Button_Export": "导出",
    "Script_TreeTool_ImportService": "导入业务服务",
    "Script_TreeTool_ImportBizRule": "导入业务规则",
    "Script_TreeTool_ImportApp": "导入应用程序",
    "Script_TreeTool_AddReport":"新增报表目录",
    "Script_TreeTool_AddReportPage": "新增报表页",
    "Button_RemoveReport": "删除目录",
    "Button_RemoveReportPage": "删除报表页",
    "Script_TreeTool_LeadingInReport": "导入报表页",
    "Script_TreeTool_LeadingOutReport": "导出报表页",
    "Script_TreeTool_ReportEdit": "编辑报表名称"
    //qiancheng
};



//#region 按钮定义
//多个节点会用到的按钮
var RefreshTree = { id: "RefreshTree", icon: "icon-shuaxin", text: $.Lang("H3TreeTools.Button_Refresh", "刷新") };
var BizFolder = { id: "BizFolder", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.Script_TreeTool_AddFolder", "新增目录") };
var BizWFFolder = { id: "BizWFFolder", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.AddProcessFolder_Process", "流程目录") };
var BizService = { id: "BizService", icon: "icon-yewufuwu", text: $.Lang("H3TreeTools.EditBizTreeNode_AddBizService", "添加业务服务") };
var BizObject = { id: "BizObject", icon: "icon-liuchengshujumoxing", text: $.Lang("H3TreeTools.ListBizObjectSchema_NewDefine", "数据模型") };
var BizWorkflowPackage = { id: "icon-liuchengshujumoxing", icon: "icon-liuchengshujumoxing", text: $.Lang("H3TreeTools.Script_TreeTool_AddPackage", "新建流程包") };
var BizSheet = { id: "BizSheet", icon: "fa fa-file-o", text: $.Lang("H3TreeTools.DefaultSheet_Form", "新增表单") };
var BizWorkflow = { id: "BizWorkflow", icon: "icon-liuchengmoxing", text: $.Lang("H3TreeTools.Script_TreeTool_NewWorkflow", "新增流程") };
var BizWFFolderAcl = { id: "BizWFFolderAcl", icon: "icon-quanxianshezhi", text: $.Lang("H3TreeTools.FunctionAclByUnit_SetAcl", "权限设置") };
//普通目录
var BizDelete = { id: "BizDelete", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//表单
var BizDeleteBizSheet = { id: "BizDeleteBizSheet", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//流程目录
var BizDeleteBizWFFolder = { id: "BizDeleteBizWFFolder", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//流程包目录
var BizDeleteBizWorkflowPackage = { id: "BizDeleteBizWorkflowPackage", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//业务规则
var BizDeleteRuleFolder = { id: "BizDeleteRuleFolder", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//ServiceFolder 业务服务
var BizDeleteServiceFolder = { id: "BizDeleteServiceFolder", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//报表目录 ReportTemplateFolder
var BizDeleteReportTemplateFolder = { id: "BizDeleteReportTemplateFolder", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
//流程模板 BizWorkflow
var BizDeleteBizWorkflow = { id: "BizDeleteBizWorkflow", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除") };
var BizLocker = { id: "BizLocker", icon: "fa fa-unlock-alt", text: $.Lang("H3TreeTools.Settings_Lock", "锁定") };
var BizUnLock = { id: "BizUnLock", icon: "fa fa-unlock", text: $.Lang("H3TreeTools.Settings_Unlock", "解锁") };
var BizMasterData = { id: "BizObject", icon: "icon-zhushujushili", text: $.Lang("H3TreeTools.Script_TreeTool_MasterData", "主数据") };
//业务服务菜单
var BizServiceMethod = { id: "BizServiceMethod", icon: "icon-yewufuwu", text: $.Lang("H3TreeTools.Script_TreeTool_NewServiceMethod", "添加服务方法") };
//添加业务方法
var AddSchemaMethod = { id: "AddSchemaMethod", icon: "icon-shujumoxingzidingyifangfa", text: $.Lang("H3TreeTools.Script_TreeTool_NewBizMethod", "添加业务方法") };
//数据模型菜单
var BizSchemaView = { id: "BizSchemaView", icon: "icon-xitongxianshi", text: $.Lang("H3TreeTools.BizObjectSchemaViewList_Add", "添加视图") };
//var BizQuery = { id: "BizQuery", icon: "BizQuery", text: "添加查询" };
var BizListener = { id: "BizListener", icon: "icon-jiantingshili", text: $.Lang("H3TreeTools.EditListenerPolicy_Listener", "监听实例") };
var BizScheduleInvoker = { id: "BizScheduleInvoker", icon: "fa fa-clock-o", text: $.Lang("H3TreeTools.Button_TimeJob", "定时作业") };
var BizSchemaAssociation = { id: "BizSchemaAssociation", icon: "fa fa-exchange", text: $.Lang("H3TreeTools.EditBizObjectSchemaAssociationList_CreateAssociation", "添加关联关系") };
var CreateBizRuleTable = { id: "CreateBizRuleTable", icon: "icon-yewuguize", text: $.Lang("H3TreeTools.EditBizTreeNode_AddBizRule", "添加业务规则") };
var AddDecisionMatrix = { id: "AddDecisionMatrix", icon: "icon-menu", text: $.Lang("H3TreeTools.EditBizRuleTable_AddDecisionMatrix", "添加决策表") };
var ExportPackage = { id: "ExportPackage", icon: "fa fa-download", text: $.Lang("H3TreeTools.Script_TreeTool_ExportPackage", "导出流程包") };
var ImportPackage = { id: "ImportPackage", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_ImportPackage", "导入流程包") };
var TB_ReportSource = { id: "ReportSource", icon: "icon-baobiaoshujuyuan", text: $.Lang("H3TreeTools.Function_BPA_ReportSource", "报表数据源") };
var ReportTemplate_Summary = { id: "ReportTemplate_Summary", icon: "icon-charubiaoge", text: $.Lang("H3TreeTools.Script_TreeTool_Summary", "明细汇总表") };
var ReportTemplate_Cross = { id: "ReportTemplate_Cross", icon: "icon-bangding", text: $.Lang("H3TreeTools.Script_TreeTool_Cross", "交叉分析表") };
var AppAdd = { id: "EditApp", icon: "fa fa-th", text: $.Lang("H3TreeTools.Script_TreeTool_NewApp", "添加应用程序") };
var AppDelete = { id: "DeleteApp", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_Remove", "删除应用程序") };
//主数据导入导出
var ImportBizMasterData = { id: "ImportBizMasterData", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_ImportMasterData", "导入主数据") };
var ExportBizMasterData = { id: "ExportBizMasterData", icon: "fa fa-download", text: $.Lang("H3TreeTools.Button_Export", "导出") }; //主数据、数据模型导出
//业务服务导入导出
var ImportBizService = { id: "ImportBizService", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_ImportService", "导入业务服务") };
var ExportBizService = { id: "ExportBizService", icon: "fa fa-download", text: $.Lang("H3TreeTools.Button_Export", "导出") };
//业务规则导入导出
var ImportBizRule = { id: "ImportBizRule", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_ImportBizRule", "导入业务规则") };
var ExportBizRule = { id: "ExportBizRule", icon: "fa fa-download", text: $.Lang("H3TreeTools.Button_Export", "导出") };
//应用程序导入导出
var ImportApp = { id: "ImportApp", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_ImportApp", "导入应用程序") };
var ExportApp = { id: "ExportApp", icon: "fa fa-download", text: $.Lang("H3TreeTools.Button_Export", "导出") };

//业务服务目录
var ServiceFolder = { id: "ServiceFolder", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.Script_TreeTool_AddFolder", "新建目录") };
//业务规则目录
var RuleFolder = { id: "RuleFolder", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.Script_TreeTool_AddFolder", "新建目录") };
//报表目录
var ReportTemplateFolder = { id: "ReportTemplateFolder", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.Script_TreeTool_AddFolder", "新建目录") };

//新增报表目录qiancheng
var Report = { id: "Report", icon: "fa fa-folder-o", text: $.Lang("H3TreeTools.Script_TreeTool_AddReport", "新建目录") };
//新增报表页
var ReportFolder = { id: "ReportFolder", icon: "icon-charubiaoge", text: $.Lang("H3TreeTools.Script_TreeTool_AddReportPage", "新建报表模板") };
//删除目录
var Reportdelete = { id: "Reportdelete", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_RemoveReport", "删除目录") };
//删除报表页
var ReportPagedelete = { id: "ReportPagedelete", icon: "fa fa-minus", text: $.Lang("H3TreeTools.Button_RemoveReportPage", "删除报表模型") };

var LeadingInReport = { id: "LeadingInReport", icon: "fa fa-upload", text: $.Lang("H3TreeTools.Script_TreeTool_LeadingInReport", "导入报表页") };

var LeadingOutReport = { id: "LeadingOutReport", icon: "fa fa-download", text: $.Lang("H3TreeTools.Script_TreeTool_LeadingOutReport", "导出报表页") };
var ReportEdit = { id: "ReportEdit", icon: "fa fa-edit", text: $.Lang("H3TreeTools.Script_TreeTool_ReportEdit", "编辑报表名称") };
//#endregion
// 获取注册信息
var licenseInfo = null;
if (!$.Controller) {
    window.location.href =(_PORTALROOT_GLOBAL||'')+ '/index.html#/platform/login';
}
$.ajax({
    url: $.Controller.AdminIndex.GetLicense,
    dataType: "JSON",
    type: "GET",
    cache: false,
    async: false,//同步执行
    success: function (data) {
        if (data.Success) {
            licenseInfo = data.Extend;
        }
    },
    error: function (res) {
        window.location.href = (_PORTALROOT_GLOBAL || '') + '/index.html#/platform/login';
    }
});
if (licenseInfo == null) {
    window.location.href = (_PORTALROOT_GLOBAL || '') + '/index.html#/platform/login';
}
//#region 添加到对应的节点上面
//节点添加按钮
var TreeToolBar = {
    //组织机构
    "TB_Company": [RefreshTree],
    //业务规则
    "TB_BizRule": licenseInfo.BizRule ? [RuleFolder, CreateBizRuleTable, ImportBizRule, RefreshTree] : [],
    //规则目录
    "RuleFolder": [RuleFolder, CreateBizRuleTable, ImportBizRule, BizDeleteRuleFolder, RefreshTree],
    //规则实例的工具，添加决策表
    "BizRule": [AddDecisionMatrix, ExportBizRule, RefreshTree],
    //流程模型
    "TB_ProcessModel": [BizWFFolder, RefreshTree],
    //普通目录
    "BizFolder": [BizFolder, BizMasterData, ImportBizMasterData, BizDelete, RefreshTree],
    //流程目录
    "BizWFFolder": [BizWFFolder, BizWorkflowPackage, ImportPackage, BizWFFolderAcl, BizDeleteBizWFFolder, RefreshTree],
    //业务服务目录
    "ServiceFolder": [ServiceFolder, BizService, ImportBizService, BizDeleteServiceFolder, RefreshTree],
    //流程包
    "BizWorkflowPackage": [BizSheet, BizWorkflow, $.extend(false, { NodeType: "BizWorkflowPackage" }, BizDeleteBizWorkflowPackage)
        , ExportPackage, BizLocker, BizUnLock, RefreshTree],
    "BizService": licenseInfo.BizBus ? [ExportBizService] : [],
    //数据模型、主数据
    "BizObject": [AddSchemaMethod, BizScheduleInvoker, BizSchemaAssociation, ExportBizMasterData, RefreshTree],
    //表单
    "BizSheet": [$.extend(false, { NodeType: "BizSheet" }, BizDeleteBizSheet)],
    //流程模板
    "BizWorkflow": [$.extend(false, { NodeType: "BizWorkflow" }, BizDeleteBizWorkflow)],
    //业务服务
    "TB_BizService": licenseInfo.BizBus ? [ServiceFolder, BizService, ImportBizService, RefreshTree] : [],
    //主数据目录
    "TB_BizMasterData": [BizFolder, BizMasterData, ImportBizMasterData, RefreshTree],
    //业务方法
    "TB_BizMethod": [AddSchemaMethod, RefreshTree],
    //报表数据源
    "TB_ReportSource": licenseInfo.BPA ? [TB_ReportSource, RefreshTree] : [],
    //报表目录
    "ReportTemplateFolder": licenseInfo.BPA ? [ReportTemplateFolder, ReportTemplate_Summary, ReportTemplate_Cross, BizDeleteReportTemplateFolder, RefreshTree] : [],
    "Apps": licenseInfo.Apps ? [AppAdd, RefreshTree, ImportApp] : [],
    "AppNavigation": [AppDelete, ExportApp],
    "": [],
    "TB_ReportPage": [Report, ReportFolder,LeadingInReport, RefreshTree],
    "ReportFolder": [Report, ReportFolder, Reportdelete, LeadingInReport,RefreshTree],
    "ReportFolderPage": [ReportEdit,LeadingOutReport, ReportPagedelete, RefreshTree]
};
//#endregion

//按钮操作
function DoBtnActon(btnObj, treeData) {
    switch (btnObj.id) {
        case RefreshTree.id:
            var nodeData = menuTree.getDataByID(treeData.Code) == null ? menuTree.getDataByID(treeData.ObjectID) : menuTree.getDataByID(treeData.Code);
            var nodeTarget = menuTree.getNodeDom(nodeData);
            $(nodeTarget).find(".l-children").remove();

            var RemoveNodeFun = function (children) {
                for (var i = 0; i < children.length; i++) {
                    for (var j = 0; j < top.menuTree.nodes.length; j++) {
                        if (top.menuTree.nodes[j]["treedataindex"] == children[i].treedataindex) {
                            top.menuTree.nodes.splice(j, 1);
                            if (children[i].children != null)
                                if (RemoveNodeFun(children[i].children));
                            break;
                        }
                    }
                }
            };

            if (nodeData.children != null) {
                RemoveNodeFun(nodeData.children);
            }

            $(nodeTarget).find(".l-expandable-close").addClass("l-expandable-open").removeClass("l-expandable-close");
            nodeData.LoadDataUrl += "&Refresh=1";
            top.menuTree.loadData(nodeTarget, nodeData.LoadDataUrl);
            break;
            //qiancheng 报表目录新建
        case Report.id:
            //debugger
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/AddReport.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code) + "&ObjectType=" + encodeURI(btnObj.id));
            break;
        case ReportEdit.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/AddReportPage.html&ID=" + encodeURI(treeData.ObjectID) + "&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code) + "&ObjectType=" + encodeURI("ReportFolder"));
            break;
        case ReportFolder.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/AddReportPage.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code) + "&ObjectType=" + encodeURI("ReportFolder"));
            break;
        case Reportdelete.id:
            var msg = "<span style='color:red;'>将要删除报表目录，确认删除？<span>";
            $.ligerDialog.confirm(msg, function (result) {
                if (result) {
                    var deleteUrl = $.Controller.ReportFolder.DeleteFolder;
                    $.ajax({
                        url: deleteUrl,
                        dataType: "json",
                        type: "post",
                        data: { nodeId: encodeURI(treeData.ObjectID), nodeCode: encodeURI(treeData.Code), objectType: (bizNodeType == null ? "" : bizNodeType) },
                        success: function (data) {
                            if (data.Success) {
                                top.workTab.removeTabItem(treeData.ObjectID);
                                top.ReloadNode(treeData.ParentID);
                            }
                            else {
                                top.$.H3Dialog.Error({ content: $.Lang(data.Message) });
                            }
                        }
                    });
                }
            });
            break;
        case ReportPagedelete.id:
            var msg = "<span style='color:red;'>删除报表页将一并删除报表页相关的数据源、报表部件等数据，确认删除？<span>";
            $.ligerDialog.confirm(msg, function (result) {
                if (result) {
                    var deleteUrl = $.Controller.ReportFolder.DeleteFolder;
                    $.ajax({
                        url: deleteUrl,
                        dataType: "json",
                        type: "post",
                        data: { nodeId: encodeURI(treeData.ObjectID), nodeCode: encodeURI(treeData.Code), objectType: (bizNodeType == null ? "" : bizNodeType) },
                        success: function (data) {
                            if (data.Success) {
                                top.workTab.removeTabItem(treeData.ObjectID);
                                top.ReloadNode(treeData.ParentID);
                            }
                            else {
                                top.$.H3Dialog.Error({ content: $.Lang(data.Message) });
                            }
                        }
                    });
                }
            });
            break;
            //导入报表模型
        case LeadingInReport.id:
            ShowDialog
               (
                   LeadingInReport.text,
                  _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/ReportImportHandler.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
               );
            break;
            //导出报表模型
        case LeadingOutReport.id:
            var iframeObj = $("LeadingOutReportiframe").length == 0 ? $("<iframe id='LeadingOutReportiframe'></iframe>") : $("LeadingOutReportiframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", _PORTALROOT_GLOBAL + "/Report/Export?ReportCode=" + encodeURI(treeData.Code));

            break;
        case BizFolder.id:
        case BizWFFolder.id:
        case ServiceFolder.id:
        case RuleFolder.id:
        case ReportTemplateFolder.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/AddProcessFolder.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code) + "&ObjectType=" + encodeURI(btnObj.id));
            break;
        case BizDeleteRuleFolder.id:
        case BizDeleteServiceFolder.id:
        case BizDeleteReportTemplateFolder.id:
        case BizDeleteBizWorkflow.id:
        case BizDeleteBizWFFolder.id:
        case BizDeleteBizWorkflowPackage.id:
        case BizDeleteBizSheet.id:
        case BizDelete.id:
            var bizNodeType = $(btnObj).attr("NodeType");
            var msg = "<span style='color:red;'>删除主数据目录，将导致关联的主数据查询不能使用，确认删除？<span>";
            switch (btnObj.id) {
                case "BizDeleteBizWorkflowPackage":
                    //msg = "<span style='color:red;'>删除流程包会将相关的流程数据一并删除，确认删除？<span>";
                    msg = "<span style='color:red;'>删除流程包，确认删除？<span>";
                    break;
                case "BizDeleteBizWFFolder":
                    msg = "<span style='color:red;'>删除流程目录，确认删除？<span>";
                    break;
                case "BizDeleteServiceFolder":
                    msg = "<span style='color:red;'>删除业务服务目录，确认删除？<span>";
                    break;
                case "BizDeleteRuleFolder":
                    msg = "<span style='color:red;'>删除业务规则目录，确认删除？<span>";
                    break;
                case "BizDeleteReportTemplateFolder":
                    msg = "<span style='color:red;'>删除报表模型目录，确认删除？<span>";
                    break;
                case "BizDeleteBizWorkflow":
                    msg = "<span style='color:red;'>删除流程模板，确认删除？<span>";
                    break;
                case "BizDeleteBizSheet":
                    msg = "<span style='color:red;'>删除表单，确认删除？<span>";
                    break;
            }
            var canDel = true;
            //流程包先判断是否可删除
            if (btnObj.id == "BizDeleteBizWorkflowPackage" || btnObj.id == "BizDeleteBizWorkflow")
            {
                canDel = false;
                var deleteCheckUrl = $.Controller.ProcessFolder.DeleteProcessCheck;
                $.ajax({
                    url: deleteCheckUrl,
                    dataType: "json",
                    type: "post",
                    data: { nodeId: encodeURI(treeData.ObjectID), nodeCode: encodeURI(treeData.Code), objectType: (bizNodeType == null ? "" : bizNodeType) },
                    async:false,
                    success: function (data) {
                        if (data.Success) {
                            canDel = true;
                        }
                        else {
                            top.$.H3Dialog.Warn({ content: $.Lang(data.Message) });
                        }
                    }
                });
            }
            if (canDel) {
                $.ligerDialog.confirm(msg, function (result) {
                    if (result) {
                        var deleteUrl = $.Controller.ProcessFolder.DeleteFolder;
                        $.ajax({
                            url: deleteUrl,
                            dataType: "json",
                            type: "post",
                            data: { nodeId: encodeURI(treeData.ObjectID), nodeCode: encodeURI(treeData.Code), objectType: (bizNodeType == null ? "" : bizNodeType) },
                            success: function (data) {
                                if (data.Success) {
                                    top.workTab.removeTabItem(treeData.ObjectID);
                                    top.ReloadNode(treeData.ParentID);
                                }
                                else {
                                    top.$.H3Dialog.Error({ content: $.Lang(data.Message) });
                                }
                            }
                        });
                    }
                });
            }
            break;
        case BizServiceMethod.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditBizServiceMethod.html&ServiceCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            break;
        case BizObject.id://数据模型
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/CreateBizObjectSchema.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code) + "&ObjectType=" + encodeURI(btnObj.id));
            break;
            //case BizSchemaView.id:
            //    ShowDialog(btnObj.title, "ProcessModel/EditBizObjectSchemaView.aspx?SchemaCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            //    break
            //case BizQuery.id:
            //    ShowDialog(btnObj.title, "ProcessModel/EditBizQuery.aspx?SchemaCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            //    break
        case BizListener.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditListenerPolicy.html?SchemaCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            break;
        case BizScheduleInvoker.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditScheduleInvoker.html&SchemaCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            break;
        case BizSchemaAssociation.id:
            ShowDialog(btnObj.title, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditBizObjectSchemaAssociation.html&SchemaCode=" + encodeURI(treeData.Code) + "&ParentID=" + encodeURI(treeData.ObjectID));
            break;
        case BizLocker.id:
            $.ligerDialog.confirm('确定锁定？', function (result) {
                if (result) {
                    $.ajax({
                        url: _PORTALROOT_GLOBAL + "/FunctionNodeLocker/DoLock?SchemaCode=" + encodeURI(treeData.Code),
                        dataType: "json",
                        success: function (data) {
                            if (data.Success) {
                                $.H3Dialog.Success({ content: $.Lang(data.Message) });
                            }
                            else {
                                top.$.H3Dialog.Error({ content: $.Lang(data.Message) });
                            }
                            top.ReloadNode(treeData.ParentID);
                        }
                    });
                }
            });
            break;
        case BizUnLock.id:
            $.ligerDialog.confirm('确定解锁？', function (result) {
                if (result) {
                    $.ajax({
                        url: _PORTALROOT_GLOBAL + "/FunctionNodeLocker/DoUnLock?SchemaCode=" + encodeURI(treeData.Code),
                        dataType: "json",
                        success: function (data) {
                            if (data.Success) {
                                $.H3Dialog.Success({ content: $.Lang(data.Message) });
                            }
                            else {
                                top.$.H3Dialog.Error({ content: $.Lang(data.Message) });
                            }
                            top.ReloadNode(treeData.ParentID);
                        }
                    });
                }
            });
            break;
        case BizService.id:
            top.f_addTab(
                {
                    tabid: new Date().getTime(),
                    text: BizService.text,
                    url: "ProcessModel/EditBizService.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                });
            break;
        case BizWorkflowPackage.id:
            ShowDialog(BizWorkflowPackage.text, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditBizWorkflowPackage.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code));
            break;
        case BizSheet.id:
            ShowDialog(BizSheet.text, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/WorkSheetEdit.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code));
            break;
        case BizWFFolderAcl.id:
            top.f_addTab(
                {
                    tabid: treeData.ObjectID + "_" + BizWFFolderAcl.id,
                    text: treeData.Text + "_" + BizWFFolderAcl.text,
                    url: "ProcessModel/WorkflowFolderAcl.html&WorkflowFolderCode=" + encodeURI(treeData.Code)
                });
            break;
        case BizWorkflow.id:
            ShowDialog(BizWorkflow.text, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditBizWorkflowPackage.html&ObjectType=" + BizWorkflow.id + "&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code));
            break;
        case AddSchemaMethod.id:
            var schemaCode = encodeURI(treeData.Code.replace("_MDMethod", ""));
            var parentID = encodeURI(treeData.ObjectID);
            ShowDialog(AddSchemaMethod.text, _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/EditBizObjectSchemaMethod.html&SchemaCode=" + schemaCode + "&ParentID=" + parentID);
            break;
        case CreateBizRuleTable.id:
            var parentID = encodeURI(treeData.ObjectID);
            top.f_addTab(
            {
                tabid: ReverseStr(parentID),
                text: CreateBizRuleTable.text,
                url: "BizRule/EditBizRuleTable.html&ParentID=" + parentID + "&ParentCode=" + encodeURI(treeData.Code)
            });
            break;
        case AddDecisionMatrix.id:
            var parentID = encodeURI(treeData.ObjectID);
            var parentCode = encodeURI(treeData.Code);
            top.f_addTab(
                {
                    tabid: new Date().getTime(),
                    text: AddDecisionMatrix.text,
                    url: "BizRule/EditBizRuleDecisionMatrix.html&ParentID=" + parentID + "&RuleCode=" + parentCode
                });
            break;
        case ExportPackage.id://导出流程包
            var iframeObj = $("ExportPackageiframe").length == 0 ? $("<iframe id='ExportPackageiframe'></iframe>") : $("ExportPackageiframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", _PORTALROOT_GLOBAL + "/WorkflowPackageImport/Export?PackageCode=" + encodeURI(treeData.Code));
            break;
        case ImportPackage.id://导入流程包
            ShowDialog
                (
                    ImportPackage.text,
                   _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/PackageImportHandler.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                );
            break;
        case ExportBizRule.id://导出业务规则
            var iframeObj = $("ExportBizRuleiframe").length == 0 ? $("<iframe id='ExportBizRuleiframe'></iframe>") : $("ExportBizRuleiframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", _PORTALROOT_GLOBAL + "/BizRuleImport/DownLoad?ruleCode=" + encodeURI(treeData.Code));
            break;
        case ImportBizRule.id://导入业务规则
            ShowDialog
                (
                    ImportBizRule.text,
                    _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=BizRule/BizRuleImportHandler.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                );
            break;
        case TB_ReportSource.id:
            var parentID = encodeURI(treeData.ObjectID);
            var parentCode = encodeURI(treeData.Code);
            top.f_addTab(
            {
                tabid: new Date().getTime(),
                text: TB_ReportSource.text,
                url: "BPA/EditReportSource.html&ParentID=" + parentID + "&ParentCode=" + parentCode
            });
            break;
        case ReportTemplate_Summary.id:
            var parentID = encodeURI(treeData.ObjectID);
            var parentCode = encodeURI(treeData.Code);
            top.f_addTab(
            {
                tabid: new Date().getTime(),
                text: ReportTemplate_Summary.text,
                url: "BPA/ReportTemplate_Summary.html&ParentID=" + parentID + "&ParentCode=" + parentCode
            });
            break;
        case ReportTemplate_Cross.id:
            var parentID = encodeURI(treeData.ObjectID);
            var parentCode = encodeURI(treeData.Code);
            top.f_addTab(
            {
                tabid: new Date().getTime(),
                text: ReportTemplate_Cross.text,
                url: "BPA/ReportTemplate_Cross.html&ParentID=" + parentID + "&ParentCode=" + parentCode
            });
            break;
        case AppAdd.id:
            {
                var parentID = encodeURI(treeData.ObjectID);
                var parentCode = encodeURI(treeData.Code);
                top.f_addTab(
                {
                    tabid: new Date().getTime(),
                    text: $.Lang("Apps.AddApp"),
                    url: "Apps/EditApp.html"
                });
            }
            break;
        case AppDelete.id:
            $.ligerDialog.confirm('删除应用中心菜单目录，确定删除？', function (result) {
                if (result) {
                    var nodeType = $(btnObj).attr("NodeType") == null ? "" : $(btnObj).attr("NodeType");
                    $.ajax({
                        //url: "Apps/EditApp.html?AppCode=" + treeData.Code + "&Action=Delete",
                        url: $.Controller.Apps.DelApp,
                        dataType: "json",
                        data: { appCode: treeData.Code },
                        type: "post",
                        success: function (data) {
                            if (data.Success) {
                                top.workTab.removeTabItem(treeData.ObjectID);
                                top.ReloadNode(treeData.ParentID);
                            } else {
                                $.H3Dialog.Warn({ content: $.Lang("msgGlobalString.DeleteFailed") });
                            }

                        }
                    });
                }
            });
            break;
        case ExportApp.id: //导出应用程序
            var iframeObj = $("ExportAppiframe").length == 0 ? $("<iframe id='ExportAppiframe'></iframe>") : $("ExportAppiframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", $.Controller.Apps.ExportApp + "?code=" + encodeURI(treeData.Code));
            break;
        case ImportApp.id: //导入应用程序 
            ShowDialog
                (
                    ImportApp.text,
                    //"Apps/AppImportHandler.aspx?ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                    _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=Apps/ImportApp.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                );
            break;
        case ExportBizMasterData.id: //导出主数据
            var iframeObj = $("ExportBizMasterDataIframe").length == 0 ?
                $("<iframe id='ExportBizMasterDataIframe'></iframe>") : $("ExportBizMasterDataIframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", _PORTALROOT_GLOBAL + $.Controller.BizObjectSchema.ExportBizMasterData + "?bizMasterDataCode=" + encodeURI(treeData.Code));
            break;
        case ImportBizMasterData.id: //导入主数据
            ShowDialog
                (
                    ImportBizMasterData.text,
                    _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/BizMasterDataImportHandler.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                );
            break;
        case ExportBizService.id: //导出业务服务
            var iframeObj = $("ExportBizServiceIframe").length == 0 ?
                $("<iframe id='ExportBizServiceIframe'></iframe>") : $("ExportBizServiceIframe");
            iframeObj.hide();
            iframeObj.appendTo($("body"));
            iframeObj.attr("src", _PORTALROOT_GLOBAL + "/BizServiceHandler/DownLoad?serviceCode=" + encodeURI(treeData.Code));
            break;
        case ImportBizService.id://导入业务服务
            ShowDialog
                (
                    ImportBizService.text,
                    _PORTALROOT_GLOBAL + "/admin/TabMaster.html?url=ProcessModel/BizServiceImportHandler.html&ParentID=" + encodeURI(treeData.ObjectID) + "&ParentCode=" + encodeURI(treeData.Code)
                );
            break;
        default:
            alert("[" + btnObj.title + "],该功能还未实现");
            break;
    }
}

$(function () {
    $("#treeToolbar").hover(function () { $(this).show(); }, function () { CreanTreeBar(); });

    document.onclick = function (e) {
        var e = e ? e : window.event;
        var tar = e.srcElement || e.target;
        if (tar != null
            && tar.id != "treeToolbar"
            && tar.offsetParent != null
            && tar.offsetParent.id != "menuTree") {
            $("#treeToolbar").hide()
        }

        var tabid = $(this).find("#div_WorkSpace").find(".l-selected").attr("tabid");
        if (tabid != undefined)
        {
            //此处是为了适应页面折叠以后，报表页签width 没有只适应，需要重新修改样式
            $(window.frames[tabid].document).find("#widget_wrapper").find("li").each(function () {
                $(this).find(".BaseChartWrapOuter").css("width", "100%");
                $(this).find(".LineChartWrap").css("width", "100%");
                $(this).find(".LineChartCanvas").css("width", "100%");
                $(this).find(".BaseChartCategories").css("width", "96%");
                
            });
        }
    }
});

//字符串反转，新建业务规则时，tabid为ParentID反转
function ReverseStr(str)
{
    if (str)
    {
        return str.split("").reverse().join("");
    }
    return str;
}

function CreanTreeBar() {
    $("#treeToolbar").attr("ToolBarCode", null)
    $("#treeToolbar").html("");
    $("#treeToolbar").hide();
}

//添加工具栏
function ItemOver(node, e) {
    if ($("#treeToolbar").attr("ToolBarCode") == node.data.ObjectID) { return; }
    CreanTreeBar();
    if (node.data.ToolBarCode == null) { return; }
    var btnArray = TreeToolBar[node.data.ToolBarCode];
    if (btnArray == null || btnArray.length == 0) { return; }

    var btns = [];
    var toolBarCode = node.data.ToolBarCode;
    //根据是否锁定设置流程包的ToolBar
    if (toolBarCode == "BizWorkflowPackage") {
        var isLock = node.data.IsLock;
        if (isLock) {
            if (node.data.IsLockedByCurrentUser) {
                for (var x = 0; x < btnArray.length; x++) {
                    if (btnArray[x].id != "BizLocker") {
                        btns.push(btnArray[x]);
                    }
                }
            }
            else { //被别人锁定时，只可以刷新
                for (var x = 0; x < btnArray.length; x++) {
                    if (btnArray[x].id == "RefreshTree") {
                        btns.push(btnArray[x]);
                    }
                }
            }
        }
        else {
            for (var x = 0; x < btnArray.length; x++) {
                if (btnArray[x].id != "BizUnLock") {
                    btns.push(btnArray[x]);
                }
            }
        }
    }
        //根据是否锁定设置数据模型、表单、流程的ToolBar
    else if (toolBarCode == "BizObject" || toolBarCode == "BizSheet" || toolBarCode == "BizWorkflow") {
        if (node.data.IsLock && !node.data.IsLockedByCurrentUser) {
            for (var x = 0; x < btnArray.length; x++) {
                if (btnArray[x].id == "RefreshTree") {
                    btns.push(btnArray[x]);
                }
            }
        }
        else {
            btns = btnArray;
        }
        //引用了共享流程包只可以刷新
        if (node.data.OwnSchemaCode) {
            btns = [];
            for (var x = 0; x < btnArray.length; x++) {
                if (btnArray[x].id == "RefreshTree") {
                    btns.push(btnArray[x]);
                }
            }
        }
    }//系统报表禁止编辑和删除
    else if (toolBarCode == "ReportFolder" || toolBarCode == "ReportFolderPage") {
            for (var x = 0; x < btnArray.length; x++) {
                if (btnArray[x].id != "Reportdelete" && btnArray[x].id != "ReportEdit" || btnArray[x].id != "ReportPagedelete") {
                    btns.push(btnArray[x]);
                }
            }  
    }
    else { btns = btnArray; }

    var l_body = $(node.targetItem);
    var span = l_body.children("span");
    var fontsize = 12;
    var iocn = l_body.children("div.l-tree-icon");
    var btnDiv = $("#treeToolbar").css("position", "absolute");
    btnDiv.attr("ToolBarCode", node.data.ObjectID);
    //单击事件
    for (var i = 0; i < btns.length; i++) {
        btns[i].render = function () {
            CreanTreeBar();
            DoBtnActon(this, node.data);
        };
    } 
    //系统报表禁止编辑和删除
    if (node.data.Code == "SystemReportDesigner" ||
   node.data.Code == "SystemReportDesigner_10001" ||
   node.data.Code == "SystemReportDesigner_10002" ||
   node.data.Code == "SystemReportDesigner_10003" ||
   node.data.Code == "SystemReportDesigner_10004" ||
   node.data.Code == "SystemReportDesigner_10005" ||
   node.data.Code == "SystemReportDesigner_10006")
    {
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].id == "Reportdelete" || btns[i].id == "ReportEdit" || btns[i].id == "ReportPagedelete") {
                btns.splice(i, 1);
            }
        }
    }

    btnDiv.TreeToolBar({ items: btns });

    //计算文本宽度
    var preObject = $("<pre>").hide().html(span.text()).appendTo(document.body);
    var spanWidth = preObject.width();
    preObject.remove();

    btnDiv.css("top", iocn.offset().top);
    var textLeft = iocn.offset().left + spanWidth + 40,
        menuLeft = $("#div_leftMenu").width() + 15;
    // 节点文本过长时，取LeftMenu的宽度
    btnDiv.css("left", Math.min(textLeft, menuLeft));

    btnDiv.css("z-index", 100);
    btnDiv.show();
}

function setBtnVisable(node, btns) {
    var isLock = node.data.IsLock;
    if (isLock) {
        if (node.data.IsLockedByCurrentUser) {
            var index = -1;
            for (var x = 0; x < btns.length; x++) {
                if (btns[x].id == "BizLocker") {
                    index = x;
                    break;
                }
            }
            if (index != -1) { btns.splice(index, 1); }
        }
        else { //被别人锁定时，只可以刷新
            var btnArray = [];
            for (var x = 0; x < btns.length; x++) {
                if (btns[x].id == "RefreshTree") {
                    btnArray[0] = btns[x];
                    break;
                }
            }
            btns = btnArray;
        }
    }
    else {
        var index = -1;
        for (var x = 0; x < btns.length; x++) {
            if (btns[x].id == "BizUnLock") {
                index = x;
                break;
            }
        }
        if (index != -1) { btns.splice(index, 1); }
    }
}

function ItemOut(node) {
    //CreanTreeBar();
}

//树型菜单的工具栏
(function ($) {
    $.fn.TreeToolBar = function (options) {
        _buildBatItem = function (item) {
            var barItem = $('<div class="l-toolbar-item l-panel-btn l-toolbar-item-hasicon" style="width:22px;padding:0px;"><div class="l-panel-btn-l"></div><div class="l-panel-btn-r"></div></div>');
            barItem.append("<div class='l-icon " + item.icon + "' style='left:0px;line-height:20px'></div>");
            barItem.attr("title", item.text);
            barItem.attr("id", item.id);

            if (item.NodeType != null) {
                barItem.attr("NodeType", item.NodeType);
            }

            if (item.render) {
                barItem.bind("click", item.render);
            }

            barItem.hover(function () {
                if ($(this).hasClass("l-toolbar-item-disable")) return;
                $(this).addClass("l-panel-btn-over");
            }, function () {
                if ($(this).hasClass("l-toolbar-item-disable")) return;
                $(this).removeClass("l-panel-btn-over");
            });
            return barItem;
        }

        return $(this).each(function () {
            var treeBar = $(this);
            //按钮数量
            var items = options.items;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                treeBar.append(new _buildBatItem(item));
            }
            treeBar.css("background", "#E0E0F2");
            return treeBar;
        });
    }
})(jQuery);


