/**
* 该文件为编辑页面专用
* 1 - 在页面上注册管理按钮
* 2 - 绑定各按钮的事件
*/
var _edit_core_GlobalString = { "Top_DesignMode": "设计模式", "Top_ViewMode": "浏览模式" };
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Top_DesignMode,Top_ViewMode" }, function (data) {
//    if (data.IsSuccess) {
//        _edit_core_GlobalString = data.TextObj;
//    }
//}, "json");

function StartEdit() {
    if (typeof (window.OT_EditorModel) == "undefined" || !window.OT_EditorModel) {
        window.OT_EditorModel = true;
        $("#content-wrapper").addClass("edit-model");
        $("#admin_console_editpage").html(_edit_core_GlobalString.Top_ViewMode);
        $("#admin_console_editpage1").html(_edit_core_GlobalString.Top_ViewMode);

        //添加部件初始化
        InitEditModel_ControlAdd();

        //管理部件初始化
        InitEditModel_InstManage();

        EnableDrag();
    }
    else {
        //if (window.parent.GetURLParameter("_editmode") == "1") {
        //    window.parent.location = window.parent.location.href.replace("_editmode=1", "");
        //}

        $("#content-wrapper").removeClass("edit-model");
        $("#admin_console_editpage").html(_edit_core_GlobalString.Top_DesignMode);
        $("#admin_console_editpage1").html(_edit_core_GlobalString.Top_DesignMode);

        $(".webpart-fold").removeClass("webpart-fold");

        var parts = $("div[part]");

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            $(part).find(".tool-button").remove();
        }
        //禁止拖动
        $('div[ot_webpart_inst]').css("cursor", "");
        $('div[ot_webpart_inst]').ligerDrag({
            disabled: true
        });
        window.OT_EditorModel = false;
    }
}

//拖动栈
var DragStack = {
    //源部件
    SourceWebPart: undefined,
    //源分区ID
    SourcePartID: undefined,
    //源分区内的WebPartID集合
    SourceWebPartIDs: [],
    //部件ID
    WebPartInstanceID: undefined,
    Proxy: undefined,
    MouseStart: {
        x: 0,
        y: 0
    },
    //部件代码的原点相对Mouse的偏移
    OriginOffsetToMouse: {
        x: 0,
        y: 0
    }
}

//启用拖动
var EnableDrag = function () {
    var _Wrapper = $("#content-wrapper");
    var _WrapperOffset = {
        x: _Wrapper.offset().left,
        y: _Wrapper.offset().top
    }
    //所有分区
    var _Parts = $(".part");

    //所有部件
    var _WebParts = $("[ot_webpart_inst]");

    $(".drag-handler").unbind(".draggable").bind("mousedown.draggable", function (e) {
        if (!$(e.target).is(".drag-handler")) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        //源部件
        DragStack.SourceWebPart = $(this).parents("[ot_webpart_inst]:first");
        //源部件ID
        DragStack.WebPartInstanceID = DragStack.SourceWebPart.attr("ot_webpart_inst");
        //代理
        DragStack.Proxy = $("<div class='drag-proxy'></div>")
            .width(DragStack.SourceWebPart.width() / 2)
            .height(DragStack.SourceWebPart.height() / 2)
            .css("left", DragStack.SourceWebPart.offset().left - _WrapperOffset.x)
            .css("top", DragStack.SourceWebPart.offset().top - _WrapperOffset.y);
        DragStack.Proxy.appendTo(_Wrapper);
        DragStack.MouseStart = {
            x: e.pageX,
            y: e.pageY
        }
        DragStack.OriginOffsetToMouse = {
            x: DragStack.SourceWebPart.offset().left - e.pageX,
            y: DragStack.SourceWebPart.offset().top - e.pageY
        }

        DragStack.SourceWebPart.addClass("dragging");
        //源分区ID
        DragStack.SourcePartID = DragStack.SourceWebPart.parents(".part:first").attr("part");
        //源分区内的所有WebPartID集合
        DragStack.SourceWebPartIDs = [];
        DragStack.SourceWebPart.parents(".part:first").find("[ot_webpart_inst]").each(function () {
            DragStack.SourceWebPartIDs.push($(this).attr("ot_webpart_inst"));
        });

        //移动
        $(document).unbind(".draggable").bind("mousemove.draggable", function (e) {
            DragStack.Proxy.css("left", e.pageX - _WrapperOffset.x).css("top", e.pageY - _WrapperOffset.y);

            //判断鼠标是否在其他WebPart内部
            for (var i = 0; i < _WebParts.length; i++) {
                if ($(_WebParts[i]).attr("ot_webpart_inst") != DragStack.WebPartInstanceID) {
                    var _Offset = $(_WebParts[i]).offset();
                    var _Width = $(_WebParts[i]).width();
                    var _Height = $(_WebParts[i]).height();
                    if (_Offset.left < e.pageX && _Offset.top < e.pageY && _Offset.left + _Width > e.pageX && _Offset.top + _Height > e.pageY) {
                        //在中心前面,置于前面
                        if (_Offset.top + _Height / 2 > e.pageY) {
                            $(_WebParts[i]).before(DragStack.SourceWebPart);
                        }
                        else {
                            $(_WebParts[i]).after(DragStack.SourceWebPart);
                        }
                        return;
                    }
                }
            }

            //判断鼠标是否在某个分区内
            for (var i = 0; i < _Parts.length; i++) {
                var _Offset = $(_Parts[i]).offset();
                var _Width = $(_Parts[i]).width();
                var _Height = $(_Parts[i]).height();
                if (_Offset.left < e.pageX && _Offset.top < e.pageY && _Offset.left + _Width > e.pageX && _Offset.top + _Height > e.pageY) {
                    if ($(_Parts[i]).find("[ot_webpart_inst='" + DragStack.WebPartInstanceID + "']").length == 1) {
                        //已经在分区内
                        return;
                    }
                    //在中心前面,并且该区内有WebPart,置于第一个WebPart前面
                    if (_Offset.top + _Height / 2 > e.pageY && $(_Parts[i]).find("[ot_webpart_inst]").length > 0) {
                        $(_Parts[i]).find("[ot_webpart_inst]:first").before(DragStack.SourceWebPart);
                    }
                    else {
                        $(_Parts[i]).append(DragStack.SourceWebPart);
                    }
                    return;
                }
            }
        });

        //放置
        $(document).one("mouseup", function (e) {
            DragStack.Proxy.remove();
            DragStack.SourceWebPart.removeClass("dragging");

            var _Changed = false;
            //当前分区ID
            var _CurrentPartID = DragStack.SourceWebPart.parents(".part").attr("part");
            if (_CurrentPartID != DragStack.SourcePartID) {
                _Changed = true;
            }

            //当前分区的WebPartID集合
            var _CurrentWebPartIDs = [];
            DragStack.SourceWebPart.parents(".part").find("[ot_webpart_inst]").each(function (index) {
                var _thisWebPartInstanceID = $(this).attr("ot_webpart_inst");
                _CurrentWebPartIDs.push(_thisWebPartInstanceID);

                if (!_Changed && _thisWebPartInstanceID != DragStack.SourceWebPartIDs[index]) {
                    _Changed = true;
                }
            });
            if (_CurrentWebPartIDs.length != DragStack.SourceWebPartIDs.length) {
                _Changed = true;
            }

            if (_Changed) {
                $.ajax({
                    url: "Ajax/PortalAdminHandler.ashx",
                    dataType: "json",
                    async: true,
                    data: {
                        method: "PageWebPartSort",
                        partid: _CurrentPartID,
                        webpartids: JSON.stringify(_CurrentWebPartIDs)
                    },
                    success: function (data) {
                        if (data == "PortalSessionOut") {
                            //刷新页面转到登录
                            parent.location.reload();
                            return;
                        }
                    },
                    error: function (msg) {
                    }
                });
            }

            $(document).unbind("mousemove.draggable");
        });
    })
}

$(document).ready(function () {
    //$("#admin_console_editpage").click(StartEdit);

    //绑定切换模板的事件
    $("#admin_console_pagetemplate").click(function () {
        OpenDialogWithUrl(GetLanguageText("UI_DIALOGTITLE_SELECTTEMPLATE"), _SitePath + "PortalService/TemplateList.aspx?pageid=" + _PageId);
    });

    ////检查URL中是否默认打开编辑模式
    //if (GetURLParameter("_editmode") && GetURLParameter("_editmode") == "1") {
    //    StartEdit();
    //}
});

function showEditDropList(target) {
    var $tar = $(target);
    var tl = $tar.offset().left;
    var tt = $tar.offset().top;
    var tw = $tar.width();
    var th = $tar.height();
    var innerHtml = "<ul class='admin_console_ul'>";
    innerHtml += "<li><span id='admin_console_editpage1' class='btn-admin'>" + GetLanguageText("UI_PAGE_EDITPAGE") + "</span></li>";
    innerHtml += "<li><td><span id='admin_console_pagetemplate1' class='btn-admin'>" + GetLanguageText("UI_PAGE_CHANGETEMPLATE") + "</span></li>";
    if (_IsAdmin) {
        innerHtml += "<li><td><a id='admin_console_pagemanage1' class='btn-admin' href='" + _SitePath + "PortalAdmin/Templates.aspx' target='_blank'>" + GetLanguageText("UI_PAGE_PAGEMANAGE") + "</a></li>";
    }
    innerHtml += "<ul>";
    var div = document.createElement("div");
    div.style.cssText = "width:80px;border:1px solid #EBBE7A; position:absolute; z-index:900;background:white;";
    div.id = "panel_admin_control";
    div.innerHTML = innerHtml;
    div.style.left = tl + "px";
    div.style.top = tt + th + 5 + "px";
    document.body.appendChild(div);

    $("#admin_console_editpage1").click(StartEdit);

    //绑定切换模板的事件
    $("#admin_console_pagetemplate1").click(function () {
        OpenDialogWithUrl(GetLanguageText("UI_DIALOGTITLE_SELECTTEMPLATE"), _SitePath + "PortalService/TemplateList.aspx?pageid=" + _PageId);
    });

    //$(div).hover(function () { $("div[id=panel_admin_control]").show(); }, function () { $("div[id=panel_admin_control]").hide(); });

}