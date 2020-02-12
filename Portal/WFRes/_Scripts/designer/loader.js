/// <reference path="Activity.js" />
/// <reference path="ActivityDrag.js" />
/// <reference path="ActivityDock.js" />
/// <reference path="ActivityModel.js" />
/// <reference path="Line.js" />
/// <reference path="misc.js" />
/// <reference path="Workflow.js" />
/// <reference path="WorkflowDocument.js" />
/// <reference path="Package.js" />
/// <reference path="TraceManager.js" />
/// <reference path="Property.js" />

var workflow;
var svg;
var body;
var layout;
var wp;
var thumbnail_container;
var thumbnail_workspace;
//IE8和IE9不支持console
var console = window.console || { log: function (t) { } };
var WorkflowCode = $.fn.getUrlParam("WorkflowCode");//流程编码
var WorkflowVersion = $.fn.getUrlParam("Version") || -1;//流程版本
var url = window.location.toString();
var InstanceID = url.substring(url.lastIndexOf('/') + 1, url.length);
var InstanceContext = null;
var workflowMode = null;
var ActivityDockCalculaterWorker;
$(function () {
    //debugger;
    //加载脚本
    var WorkflowScripts = [];
    var _PORTALROOT_GLOBAL = window.localStorage.getItem("H3.PortalRoot");

    //加载可选的活动模板
    $.ajax({
        url: _PORTALROOT_GLOBAL + "/WorkflowDesigner/SetActivityTemplates",
        type: 'post',
        dataType: "json",
        data: {},
        async: false,//同步执行
        success: function (data) {
            ActivityTemplateConfigs = data;
        }
    });

    //活动节点参数
    // if (WorkflowCode) {
    $.ajax({
        url: _PORTALROOT_GLOBAL + "/WorkflowDesigner/RegisterActivityTemplateConfigs",
        type: 'post',
        dataType: "json",
        data: { WorkflowCode: WorkflowCode, WorkflowVersion: WorkflowVersion, InstanceID: InstanceID },
        async: false,//同步执行
        success: function (data) {
            if (WorkflowCode == null && WorkflowVersion == -1) {
                WorkflowTemplate = data.WorkflowTemplate;//流程模板
                InstanceContext = data.InstanceContext;
                workflowMode = 3;
            } else {
                Package = data.Package;//流程包编码
                ClauseName = data.ClauseName;
                WorkflowTemplate = data.WorkflowTemplate;//流程模板
                pageData.EntryCondition = data.EntryCondition;//前置条件
                BizMethods = data.BizMethods;
                MapTypes = data.MapTypes;//数据映射方式
                DataItems = data.DataItems;
                DataDisposalTypes = data.DataDisposalTypes;
                WorkflowNames = data.WorkflowNames;//流程名称映射
                IsControlUsable = data.IsControlUsable;
                pageData.ParAbnormalPolicy = data.ParAbnormalPolicy;//参与者策略
                pageData.SyncOrASync = data.SyncOrASync;//同步异步
                pageData.OriginatorParAbnormalPolicy = data.OriginatorParAbnormalPolicy;//参与者策略
                pageData.ParticipantMode = data.ParticipantMode;//参与方式:单人/多人
                pageData.ParticipateMethod = data.ParticipateMethod;//可选参与方式:并行/串行
                pageData.SubmittingValidation = data.SubmittingValidation;//提交时检查
                pageData.LockLevel = data.LockLevel;//表单锁
                pageData.LockPolicy = data.LockPolicy;//锁策略
                pageData.OvertimePolicy = data.OvertimePolicy;//超时策略
                pageData.NotifyCondition = data.NotifyCondition;//发送条件
                pageData.ApprovalDataItem = data.ApprovalDataItem;//审批结果
                pageData.CommentDataItem = data.CommentDataItem;//意见数据项
                pageData.SheetCodes = data.SheetCodes;
                pageData.DataItemsSelect = data.DataItemsSelect;//可选择的数据项
            }
        }
    });
    //debugger;
    //可选的通知方式
    $.ajax({
        url: _PORTALROOT_GLOBAL + "/WorkflowDesigner/SetNotifyTypes",
        type: 'post',
        dataType: "json",
        data: {},
        async: false,//同步执行
        success: function (data) {
            pageData.NotifyTypes = data;
        }
    });
    // }
    //脚本加载完成后事件
    var loadFinished = function () {
        //debugger;
        if (workflowMode == WorkflowMode.Designer) {
            //初始化流程操作按钮
            $("#ToolBar").AspLinkToolBar({
                items: [
                    { id: "btnSave", text: "保存", click: function (item) { WorkflowDocument.SaveWorkflow(); }, icon: "save" },
                    { id: "btnSave", text: "校验", click: function (item) { WorkflowDocument.FullValidateWorkflow(); }, icon: "Validate" },
                    { id: "btnSave", text: "发布", click: function (item) { WorkflowDocument.PublishWorkflow(); }, icon: "Publish" },
                    //{ id: "btnImport", text: "导入", click: function (item) { WorkflowDocument.ImportWorkflow(); }, icon: "table" },
                    //{ id: "btnExport", text: "导出", click: function (item) { WorkflowDocument.ExportWorkflow(); }, icon: "table" },
                    { id: "btnSaveAsImage", text: "存为图片", click: function (item) { WorkflowDocument.SaveAsImage(); }, icon: "fa fa-picture-o" },
                    //{ line: true },
                    { id: "btnHeight", text: "等高度", icon: "SameHeight", click: function (item) { workflow.setSameStyle(WorkflowSettings.SameStyle.Height); } },
                    { id: "btnWidth", text: "等宽度", icon: "SameWidth", click: function (item) { workflow.setSameStyle(WorkflowSettings.SameStyle.Width); } },
                    { id: "btnSize", text: "等大小", icon: "SameSize", click: function (item) { workflow.setSameStyle(WorkflowSettings.SameStyle.Size); } },
                    { id: "btnVertical", text: "竖排等距", icon: "VEqual", click: function (item) { workflow.setSameStyle(WorkflowSettings.SameStyle.VerticalDistance); } },
                    { id: "btnHorizontal", text: "横排等距", icon: "HEqual", click: function (item) { workflow.setSameStyle(WorkflowSettings.SameStyle.HorizontalDistance); } },
                    { id: "btnUndo", text: "撤销", icon: "Undo", click: function (item) { TraceManager.Undo(); } },
                    { id: "btnRedo", text: "重做", icon: "Redo", click: function (item) { TraceManager.Redo(); } }
                ]
            });

            //提示文字
            $("[toolbarid=btnUndo]").css("overflow", "visible").attr("title", "撤销(Ctrl+Z)")
            $("[toolbarid=btnRedo]").css("overflow", "visible").attr("title", "重做(Ctrl+Y)")

            //显示痕迹
            //$("[toolbarid=btnUndo]").append("<ul id='ulPrevTraces'></ul>");
            //$("[toolbarid=btnRedo]").append("<ul id='ulNextTraces'></ul>");
        }

        body = $("body:first");
        //流程模板对象
        workflow = new Workflow("div.workspace");

        ////线条画布对象
        //svg = $("svg:first");
        //如果支持SVG
        //ERROR:For Debug
        if (document.implementation.hasFeature("org.w3c.svg", "1.0")) {
            //使用Svg
            workflow.UtilizeSvg = true;
            svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                .addClass("workspace_svg")
                .attr("version", "1.1");
            svg.css("width", "100%").css("height", "100%");
        }
        else {
            //不使用Svg
            workflow.UtilizeSvg = false;
            //使用DIV画线
            svg = $("<div></div>").addClass("workspace_svg");
        }
        $(workflow.workspace).children(":first").before(svg);
        //debugger;
        if (workflowMode == WorkflowMode.Designer || workflowMode == WorkflowMode.ViewWithProperty) {
            layout = $("#divDesigner").ligerLayout({ isRightCollapse: true, rightWidth: 380 });
            wp = new WorkflowProperty(layout, WorkflowDocument);
        }

        ActivityModelInit();

        //宽和高
        $(workflow.workspace).width(WorkflowSettings.MinInnerWidth);
        $(workflow.workspace).height(WorkflowSettings.MinInnerHeight);

        //在流程图中添加点击时自动生成活动和线条的箭头
        if ($(workflow.workspace).find("." + WorkflowStyleClassName.WorkflowAotuArrow).length == 0) {
            var arrow = $("<div class='" + WorkflowStyleClassName.WorkflowAotuArrow + "'></div>");
            arrow.clone().addClass(WorkflowStyleClassName.WorkflowAotuArrowLeft).appendTo(workflow.workspace);
            arrow.clone().addClass(WorkflowStyleClassName.WorkflowAotuArrowUp).appendTo(workflow.workspace);
            arrow.clone().addClass(WorkflowStyleClassName.WorkflowAotuArrowRight).appendTo(workflow.workspace);
            arrow.clone().addClass(WorkflowStyleClassName.WorkflowAotuArrowDown).appendTo(workflow.workspace);
        }

        //在流程图中添加活动移动时对齐的线
        if ($(workflow.workspace).find("." + WorkflowStyleClassName.ActivityDockLine).length == 0) {
            //<div class="dock_line dock_line_horizontal dock_line_top"></div>
            var dockLine = $("<div class='" + WorkflowStyleClassName.ActivityDockLine + "' ></div>");
            var dockLine_horizontal = dockLine.clone().addClass(WorkflowStyleClassName.ActivityDockLineHorizontal);
            dockLine_horizontal.clone().addClass(WorkflowStyleClassName.ActivityDockLineTop).appendTo(workflow.workspace);
            dockLine_horizontal.clone().addClass(WorkflowStyleClassName.ActivityDockLineMiddle).appendTo(workflow.workspace);
            dockLine_horizontal.clone().addClass(WorkflowStyleClassName.ActivityDockLineBottom).appendTo(workflow.workspace);

            var dockLine_vertical = dockLine.clone().addClass(WorkflowStyleClassName.ActivityDockLineVertical);
            dockLine_vertical.clone().addClass(WorkflowStyleClassName.ActivityDockLineOffsetLeft).appendTo(workflow.workspace);
            dockLine_vertical.clone().addClass(WorkflowStyleClassName.ActivityDockLineCenter).appendTo(workflow.workspace);
            dockLine_vertical.clone().addClass(WorkflowStyleClassName.ActivityDockLineRight).appendTo(workflow.workspace);
        }
        //debugger;
        if (typeof (WorkflowTemplate) != "undefined" && WorkflowTemplate) {
            WorkflowDocument.LoadWorkflow(WorkflowTemplate, true);
        }
        else if ($.fn.getUrlParam("WorkflowCode")) {
            WorkflowDocument.InitWorkflow(decodeURI($.fn.getUrlParam("WorkflowCode")));
        }

        if (workflowMode == WorkflowMode.Designer || workflowMode == WorkflowMode.ViewWithProperty) {
            //显示流程标题
            WorkflowDocument.DisplayWorkflowFullName();
        }

        var outerContainerSize = {
            width: $(workflow.outerContainer).css("width"),
            height: $(workflow.outerContainer).css("height")
        }

        //开发人员预留接口,在流程加载完成后执行
        if (typeof (LoadWorflowFinished) == "function") {
            LoadWorflowFinished();
        }

        if (workflowMode == WorkflowMode.Designer) {
            thumbnail_container = $(".div-thumbnail");
        }
        var _MonitorWorkflowSize = function () {
            //活动拖动\调整大小时不处理
            if (!ActivityDragStack.IsDragging && !ActivityResizeStack.Resizing
                && (!WorkflowEventStack.CurrentMultiAction || WorkflowEventStack.CurrentMultiAction == WorkflowMultiActionType.None)
                && $(workflow.workspace).is(":visible")) {
                if (outerContainerSize.width != $(workflow.outerContainer).css("width") || outerContainerSize.height != $(workflow.outerContainer).css("height")) {
                    outerContainerSize.width = $(workflow.outerContainer).css("width");
                    outerContainerSize.height = $(workflow.outerContainer).css("height");
                    workflow.autoFit();
                    //更新缩略图
                    if (typeof (TraceManager) != "undefined" && TraceManager.UpdateThumbnail)
                        TraceManager.UpdateThumbnail();
                }
            }
            setTimeout(_MonitorWorkflowSize, 200);
        }

        //监控流程设计区域大小变化
        setTimeout(_MonitorWorkflowSize, 200);
    }
    var scriptIndex = 0;
    var loadJs = function () {
        if (scriptIndex < WorkflowScripts.length)
            $.ajax({
                url: _PORTALROOT_GLOBAL + "/WFRes/_Scripts/designer/" + WorkflowScripts[scriptIndex],
                cache: true,
                dataType: "script",
                success: function (a, b, c) {
                    scriptIndex++;
                    loadJs();
                },
                error: function (a, b, c) {
                }
                //success: loadJs
            });
        else
            _WorkflowDesigner_GlobalString = $.Lang("Designer");
            loadFinished();
    }
    loadJs();
});

var outerContainerSize = {

}