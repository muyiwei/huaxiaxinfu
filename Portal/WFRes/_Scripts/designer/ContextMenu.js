// <reference path="Activity.js" />
// <reference path="ActivityDrag.js" />
// <reference path="ActivityDock.js" />
// <reference path="ActivityModel.js" />
// <reference path="Line.js" />
// <reference path="misc.js" />
// <reference path="Workflow.js" />
// <reference path="EditTrace.js" />
/// <reference path="WorkflowTrace.js" />

//var _ContextMenu_GlobalString = {
//    "ContextMenu_Attribute": "属性",
//    "ContextMenu_SetTemplate": "设为模板",
//    "Button_Remove": "删除",
//};
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "ContextMenu_Attribute,ContextMenu_SetTemplate,Button_Remove" }, function (data) {
//    if (data.IsSuccess) {
//        _ContextMenu_GlobalString = data.TextObj;
//    }
//}, "json");

//右侧菜单设置
ContextMenuSettings = {
    //菜单事件命名空间
    EventNameSpace: ".ContextMenu"
}

//右侧菜单堆栈
ContextMenuStack = {
    Target: undefined,
    TargetType: WorkflowElementType.Unspecified,
    ContenxtMenu: undefined,
    ContenxtMenuItem_Edit: undefined,
    ContenxtMenuItem_Delete: undefined
}

var X = "";
var Y = "";
//显示右侧菜单
/*
        e   : 事件
    _Target : 目标
*/
ShowContextMenu = function (e, _Target) {
    //上下文菜单对应的目标
    ContextMenuStack.Target = _Target;

    switch (_Target.WorkflowElementType) {
        case WorkflowElementType.Activity:
            break;
        case WorkflowElementType.Line:
            break;
        case WorkflowElementType.Workflow:
            break;
        case WorkflowElementType.Copy:
            break;
        case WorkflowElementType.Paste:
            break;
        default:
            return;
    }
    //菜单
    if (!ContextMenuStack.ContenxtMenu) {
        ContextMenuStack.ContenxtMenu = $("<ul class='context-menu-list context-menu-root'></ul>");

        //编辑
        ContextMenuStack.ContenxtMenuItem_Edit = $("<li class='context-menu-item icon icon-edit'><span>" + $.Lang("Designer.ContextMenu_Attribute") + "</span></li>").appendTo(ContextMenuStack.ContenxtMenu);
        ContextMenuStack.ContenxtMenuItem_Edit.bind("click" + ContextMenuSettings.EventNameSpace, function () {
            wp.DisplayProperties(ContextMenuStack.Target, true);
        });

        //设为模板
        ContextMenuStack.ContenxtMenuItem_SaveAs = $("<li class='context-menu-item icon icon-template'><span>" + $.Lang("Designer.ContextMenu_SetTemplate") + "</span></li>").appendTo(ContextMenuStack.ContenxtMenu);
        ContextMenuStack.ContenxtMenuItem_SaveAs.bind("click" + ContextMenuSettings.EventNameSpace, function () {
            if (ContextMenuStack.Target && ContextMenuStack.Target.savePropertyAsModel)
                ContextMenuStack.Target.savePropertyAsModel();
        });
        //复制
        ContextMenuStack.ContenxtMenuItem_Copy = $("<li class='context-menu-item icon icon-menu-copy'><span>" + $.Lang("Designer.ContextMenu_Copy") + "</span></li>").appendTo(ContextMenuStack.ContenxtMenu);
        ContextMenuStack.ContenxtMenuItem_Copy.bind("click" + ContextMenuSettings.EventNameSpace, ContextMenu_Copy);
        //粘贴
        ContextMenuStack.ContenxtMenuItem_Paste = $("<li class='context-menu-item icon icon-menu-paste'><span>" + $.Lang("Designer.ContextMenu_Paste") + "</span></li>").appendTo(ContextMenuStack.ContenxtMenu);
        ContextMenuStack.ContenxtMenuItem_Paste.bind("click" + ContextMenuSettings.EventNameSpace, ContextMenu_Paste);

        //删除
        ContextMenuStack.ContenxtMenuItem_Delete = $("<li class='context-menu-item icon icon-delete'><span>" + $.Lang("GlobalButton.Remove") + "</span></li>").appendTo(ContextMenuStack.ContenxtMenu);
        ContextMenuStack.ContenxtMenuItem_Delete.bind("click" + ContextMenuSettings.EventNameSpace, function () {
            if (ContextMenuStack.Target) {
                if (ContextMenuStack.Target.WorkflowElementType == WorkflowElementType.Activity) {
                    workflow.removeActivity(ContextMenuStack.Target.ID);
                } else if (ContextMenuStack.Target.WorkflowElementType == WorkflowElementType.Line) {
                    TraceManager.AddTrace(TraceManager.TraceType.Line.Remove, ContextMenuStack.Target);
                    workflow.removeLine(ContextMenuStack.Target.ID);
                }
            }
        });

        ContextMenuStack.ContenxtMenu.appendTo(workflow.workspace);

        //点击隐藏菜单
        $(document).bind("click" + ContextMenuSettings.EventNameSpace, function () {
            ContextMenuStack.ContenxtMenu.hide();
        });
    }

    //活动、线条显示删除菜单
    if ((_Target.WorkflowElementType == WorkflowElementType.Activity && ContextMenuStack.Target.ToolTipText != "Start" &&
            ContextMenuStack.Target.ToolTipText != "End") || _Target.WorkflowElementType == WorkflowElementType.Line) {
        ContextMenuStack.ContenxtMenuItem_Delete.show();
    } else ContextMenuStack.ContenxtMenuItem_Delete.hide();

    //设为模板
    if (_Target.WorkflowElementType == WorkflowElementType.Activity)
        ContextMenuStack.ContenxtMenuItem_SaveAs.show();
    else ContextMenuStack.ContenxtMenuItem_SaveAs.hide();

    //复制
    if (_Target.WorkflowElementType == WorkflowElementType.Activity && ContextMenuStack.Target.ToolTipText != "Start" &&
        ContextMenuStack.Target.ToolTipText != "End")
        ContextMenuStack.ContenxtMenuItem_Copy.show();
    else ContextMenuStack.ContenxtMenuItem_Copy.hide();

    //粘贴
    if (_Target.WorkflowElementType != WorkflowElementType.Activity && localStorage.getItem("_activityCopy") && localStorage.getItem("_activityWorkflowCopy")) {
        ContextMenuStack.ContenxtMenuItem_Paste.show();
        X = window.event.clientX;
        Y = window.event.clientY;
    } else {
        ContextMenuStack.ContenxtMenuItem_Paste.hide();
    }

    ContextMenuStack.ContenxtMenu.css("left", e.pageX - $(svg)._offset().left)
        .css("top", e.pageY - $(svg)._offset().top)
        .show();
}

//复制节点
function ContextMenu_Copy() {
    //复制流程节点
    if (ContextMenuStack.Target && ContextMenuStack.Target.copyProcessnode)
        ContextMenuStack.Target.copyProcessnode();
}

//粘贴节点
function ContextMenu_Paste() {
    //粘贴流程节点
    if (localStorage.getItem("_activityCopy") && localStorage.getItem("_activityWorkflowCopy")) {
        PasteProcessNode();
    } else {
        $.ligerDialog.confirm($.Lang("Designer.PasteFailed"), function (result) {
            if (result) {
                return;
            }
        });
    }
}

function PasteProcessNode() {
    var _Activity = JSON.parse(localStorage.getItem("_activityCopy"));
    var _activityWorkflowCopy = JSON.parse(localStorage.getItem("_activityWorkflowCopy"));
    var mode = null;
    //活动模板
    var modelHtml = ActivityModelSettings.GetActivityModelByType(_Activity.ActivityType).htmlObject;

    for (var i = 0; i < _activityWorkflowCopy.length; i++) {
        if (_activityWorkflowCopy[i].ActivityCode == _Activity.ActivityCode) {
            mode = _activityWorkflowCopy[i];
        }

    }
    //绘制图形
    var activity = workflow.addActivity($(modelHtml)
        .clone()
        .appendTo(workflow.workspace).show()
        .css("left", X)
        .css("top", Y), ActivityModelSettings.GetActivityModelByType(_Activity.ActivityType), _Activity.ObjectID);
    //设置mode属性,防止被覆盖
    mode.ID = activity.ID;
    //高
    if (mode.Height) {
        $(activity.htmlObject).outerHeight(mode.Height < ActivitySettings.MinOuterHeight ? mode.Height < ActivitySettings.MinOuterHeight : mode.Height);
    }
    //宽
    if (mode.Width)
        $(activity.htmlObject).outerWidth(mode.Width);
    //编码
    mode.ActivityCode = activity.ActivityCode;
    //类型
    mode.ActivityType = activity.ActivityType;
    //文字
    activity.DisplayName = _Activity.DisplayName;
    activity.SetText();
    //颜色
    activity.FontColor = _Activity.FontColor
    activity.SetFontColor();
    //文字大小
    activity.FontSize = _Activity.FontSize;
    activity.SetFontSize();

    //子流程模板编码
    activity.WorkflowCode = mode.WorkflowCode;
    //位置
    activity.savePosition();
    //获取属性
    $.extend(activity, activity, mode);
    WorkflowTemplate.Activities.push(mode);
}