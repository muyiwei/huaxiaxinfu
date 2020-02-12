var workflow;
var svg;
var workflowMode

var InstanceContext = null;
var WorkflowCode = "";//流程编码
var WorkflowVersion = -1;//流程版本
var InstanceID = "";//流程实例ID

var MobileLoader = {
    ShowWorkflow: function (InstanceID, WorkflowCode, WorkflowVersion, PortalRoot) {
        workflowMode = 4;
        WorkflowVersion = WorkflowVersion == "" ? -1 : WorkflowVersion;
        var _PORTALROOT_GLOBAL = PortalRoot;
        var random = new Date().getTime();
        if ($.MvcSheetUI.SheetInfo.SheetMode == 3) {
            $("#itemInstanceInfo").hide();
        }

        //加载可选的活动模板
        $.ajax({
            url: _PORTALROOT_GLOBAL + "/WorkflowDesigner/SetActivityTemplates",
            type: 'post',
            dataType: "json",
            data: {
                random: random
            },
            async: false,//同步执行
            success: function (data) {
                ActivityTemplateConfigs = data;
            }
        });
        $.ajax({
            url: _PORTALROOT_GLOBAL + "/WorkflowDesigner/RegisterActivityTemplateConfigs",
            type: 'post',
            dataType: "json",
            data: { WorkflowCode: WorkflowCode, WorkflowVersion: WorkflowVersion, InstanceID: InstanceID, random: random },
            async: false,//同步执行
            success: function (data) {
                WorkflowTemplate = data.WorkflowTemplate;//流程模板
                InstanceContext = data.InstanceContext;
            }
        });
        ActivityModelInit();

        if (typeof (WorkflowTemplate) != "undefined" && WorkflowTemplate) {
            //if (!workflow) {
            workflow = new Workflow(".workspace", WorkflowTemplate.WorkflowCode);

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

            $(workflow.workspace).prepend(svg);
            WorkflowDocument.LoadWorkflow(WorkflowTemplate, false, true);

            //var zoomMin = $(workflow.outerContainer).width() / $(workflow.workspace).outerWidth();
            //if (zoomMin > 1) {
            //    zoomMin = 1;
            //}
            //window.workflowScroll = new IScroll($(workflow.outerContainer).get(0),
            //        {
            //            zoom: true,
            //            zoomMin: zoomMin,
            //            zoomMax: 1,
            //            scrollX: true,
            //            scrollY: false
            //        });
            //window.workflowScroll.on("refresh", function () {
            //    $(workflow.outerContainer).height(window.workflowScroll.scale * $(workflow.workspace).outerHeight());
            //    if (window.instanceScroll) {
            //        window.instanceScroll.refresh();
            //    }
            //})
            //window.workflowScroll.zoom(zoomMin);

            //window.instanceScroll = new IScroll("#divInstanceState",
            //        {
            //            scrollX: false,
            //            scrollY: true
            //        });

            //setTimeout(function () {
            //    window.instanceScroll.refresh();
            //}, 200)

            //WorkflowDocument.ViewAsImage();
            //}
        }
    }
}