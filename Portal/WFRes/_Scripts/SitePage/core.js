/**
* 定义全局的变量, 有效的Themes
*/
var H3Portal_Available_Themes = ",default,gray,blue,";
/**
* 字义全局变量，记录是否打开了Dialog
*/
var H3Portal_IsOpenDialog = false;

/**
* 定义全局的变量, 记录浏览器或者平台的一些属性
*/
var H3Portal_Platform = {};
/**
* 定义全局的变量, 是否移动平台
*/
H3Portal_Platform.IsMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));

/**
* 定义全局的变量, 是否支持Touch事件
*/
H3Portal_Platform.IsSupportTouch = "ontouchend" in document ? true : false;

/**
* 定义全局的变量, 移动平台下, 不支持Touch事件, 或者不响应TouchEnd事件的, 则需要点击
*/
H3Portal_Platform.IsNeedClick = H3Portal_Platform.IsMobile && (!H3Portal_Platform.IsSupportTouch || (/UCBrowser/.test(navigator.userAgent) && /Android/.test(navigator.userAgent)));

/**
* 绑定添加部件的事件

* @method BindAddControlEvent
* @param {Object} btn 区位里的添加按钮
*/
function BindAddControlEvent(btn)
{
    btn.onclick = function ()
    {
        var p = this.Part;
        window.OT_SelectedPart = p;

        //先弹出选择部件[pageid, part]
        OpenDialogWithUrl(GetLanguageText("UI_DIALOGTITLE_SELECTWEBPART"), _SitePath + "PortalService/WebPartList.aspx?pageid=" + _PageId + "&part=" + $(p).attr("part"));
    }
}

/**
* 绑定编辑部件实例的事件

* @method BindEditWebPartInstEvent
* @param {Object} btn 区位里的编辑按钮
*/
function BindEditWebPartInstEvent(btn) {
    btn.onclick = function () {
        var p = this.Inst;
        window.OT_SelectedInst = p;
        var instid = $(p).attr("ot_webpart_inst");
        if (!instid)
            return;
        var insttitle = $(p).attr("ot_webpart_inst_title");

        //弹出编辑实例页面[instid]
        OpenDialogWithUrl(GetLanguageText("UI_DIALOGTITLE_WEBPARTEDIT") + "[" + (insttitle || instid) + "]", _SitePath + "PortalService/WebPartInstEdit.aspx?instid=" + instid, 700, 630);
    }
}

/**
* 绑定删除部件的事件

* @method BindRemoveWebPartInstEvent
* @param {Object} btn 区位里的删除按钮
*/
function BindRemoveWebPartInstEvent(btn) {
    btn.onclick = function () {
        var p = this.Inst;
        //window.OT_SelectedInst = p;

        var instid = $(p).attr("ot_webpart_inst");
        if (!instid)
            return;

        if (!confirm(GetLanguageText("SS_CONFIRM_DELETEWEBPART")))
            return;

        GetWebPartData("Ajax/PortalAdminHandler.ashx", null, { ctl_inst_id: instid, method: "RemoveWebPartFromPage" }, "json",
        function (data, textStatus) {
            if (data.Error)
            {
                alert(data.Error);
                return;
            }
            //将实例从页面删除
            $(p).remove();
        },
        null);
    }
}

/**
* 绑定移动部件的事件

* @method BindRemoveWebPartInstEvent
* @param {Object} btn 区位里的移动按钮
* @param {String} direct 方向[up,down]
*/
function BindMoveWebPartInstEvent(btn, direct) {
    btn.onclick = function () {
        var p = this.Inst;
        var instid = $(p).attr("ot_webpart_inst");
        var part = $(p).attr("ot_part_for");
        if (!instid || !part)
            return;

        //检查part是否存在
        var part_ele = $("div[part='" + part + "']");
        if (!part_ele || part_ele.length == 0)
            return;
        var inst_ele = $(part_ele).find("div[ot_webpart_inst]");
        if (!inst_ele || inst_ele.length == 0)
            return;
        //向上移时第1个，向下移时最后一个，都直接返回
        if (direct == "up") {
            if ($(inst_ele[0]).attr("ot_webpart_inst") == instid)
                return;
        }
        else {
            if ($(inst_ele[inst_ele.length-1]).attr("ot_webpart_inst") == instid)
                return;
        }
        GetWebPartData("Ajax/PortalAdminHandler.ashx", null, { ctl_inst_id: instid, part:part, direct:direct,  method: "OrderPagePart" }, "json",
        function (data, textStatus) {
            if (data.Error) {
                alert(data.Error);
                return;
            }
            //将组件调整显示顺序
            for (var i = 0; i < inst_ele.length; i++)
            {
                if ($(inst_ele[i]).attr("ot_webpart_inst") == instid)
                {
                    if (direct == "up")
                    {
                        part_ele[0].insertBefore(inst_ele[i], inst_ele[i - 1]);
                    }
                    if (direct == "down") {
                        if (i < inst_ele.length - 2)
                            part_ele[0].insertBefore(inst_ele[i], inst_ele[i + 2]);
                        else
                            part_ele[0].appendChild(inst_ele[i]);
                    }
                    break;
                }
            }
        },
        null);
    }
}

/**
* 初始化编辑模式-部件添加

* @method InitEditModel_ControlAdd
*/
function InitEditModel_ControlAdd()
{
    if (typeof (window.OT_EditorModel) == "undefined" || !window.OT_EditorModel)
        return;

    var parts = $("div[part]");

    for (var i = 0; i < parts.length; i++) {
        //给元素增加编辑按钮
        var part = parts[i];

        if ($(part).find(".tool-button").length > 0)
            continue;

        var div = document.createElement("div");
        div.className = "tool-button";
        if ($.trim(part.innerHTML).length == 0)
            part.appendChild(div);
        else
            part.insertBefore(div, part.childNodes[0]);

        var span = document.createElement("span");
        span.className = "button";
        span.innerHTML = GetLanguageText("UI_PAGE_ADDWEBPART");
        div.appendChild(span);
        span.Part = part;

        BindAddControlEvent(span);
    }
}

/**
* 初始化编辑模式-部件实例管理

* @method InitEditModel_InstManage
*/
function InitEditModel_InstManage()
{
    if (typeof (window.OT_EditorModel) == "undefined" || !window.OT_EditorModel)
        return;
    var insts = $("div[ot_webpart_inst]");
    //初始化已有部件的事件
    for (var i = 0; i < insts.length; i++) {
        //给元素增加设置/删除按钮
        var inst = insts[i];
        //如果是继承上级页面的，就不能在本页面编辑
        if ($(inst).attr("ot_page_for") != _PageId)
            continue;
        if ($(inst).find(".tool-button").length > 0)
            continue;
        var div = document.createElement("div");
        div.className = "tool-button";
        if ($.trim(inst.innerHTML).length == 0)
            inst.appendChild(div);
        else
            inst.insertBefore(div, inst.childNodes[0]);

        var span = document.createElement("span");
        span.className = "button edit-button";
        span.innerHTML = GetLanguageText("UI_PAGE_EDITWEBPART");
        div.appendChild(span);
        span.Inst = inst;

        BindEditWebPartInstEvent(span);

        var span = document.createElement("span");
        span.className = "button delete-button";
        span.innerHTML = GetLanguageText("UI_PAGE_REMOVEWEBPART");
        div.appendChild(span);
        span.Inst = inst;

        BindRemoveWebPartInstEvent(span);

        var span = document.createElement("span");
        span.className = "button moveup-button";
        span.title = GetLanguageText("UI_PAGE_MOVEUPWEBPART");
        div.appendChild(span);
        span.Inst = inst;

        BindMoveWebPartInstEvent(span, "up");

        var span = document.createElement("span");
        span.className = "button movedown-button";
        span.title = GetLanguageText("UI_PAGE_MOVEDOWNWEBPART");
        div.appendChild(span);
        span.Inst = inst;

        BindMoveWebPartInstEvent(span, "down");
    }

    //TODO:允许已有部件的拖动排序
    $('div[ot_webpart_inst]').ligerDrag({
        proxy: false, revert: true, disabled:false, receive: 'div[part]',
        onStartDrag: function () {
            this.set({ cursor: "not-allowed" });
        },
        onDragEnter: function (receive, source, e) {
            this.set({ cursor: "pointer" });
            //this.proxy.html("释放注入颜色");
        },
        onDragLeave: function (receive, source, e) {
            this.set({ cursor: "not-allowed" });
            //this.proxy.html("");
        },
        onDrop: function (receive, source, e) {
            var topart = $(receive).attr("part");
            var frompart = $(source).attr("ot_part_for");
            //同一Part下不让拖动
            if (topart == frompart)
                return;
            var instid = $(source).attr("ot_webpart_inst");
            GetWebPartData("Ajax/PortalAdminHandler.ashx", null, { ctl_inst_id: instid, topart: topart, method: "DragPagePart" }, "json",
               function (data, textStatus) {
                   if (data.Error) {
                       alert(data.Error);
                       return;
                   }
                   //把inst加到新的part下
                   $(source).attr("ot_part_for", topart);
                   $(receive).append(source);
               },
               null);
        }
    });

}

/**
* 将部件实例添加到页面

* @method AppendControl
* @param {String} instid 部件在页面上的实例id
* @param {Object} part 页面上的区位,供部件停靠,编辑时可为空
*/
function AppendControl(instid, part)
{
    //if (!window.OT_SelectedPart)
    //    return;
    var p = part || window.OT_SelectedPart;
    if (!p)
        return;

    GetWebPartData("Ajax/PortalAdminHandler.ashx", null, { ctl_inst_id: instid, method: "LoadControl" }, null,
        function (data, textStatus) {
            $(p).append(data);
            //还要初始化新添加的部件的事件
            if (typeof (window.OT_EditorModel) != "undefined" && window.OT_EditorModel)
            {
                InitEditModel_InstManage();
            }

            //关闭对话框
            if (window.OT_Dialog)
                window.OT_Dialog.close();
        },
        null);
}

/**
* 将部件实例的HTML添加到页面

* @method AppendControlHTML
* @param {String} html 部件在页面上的实例id
* @param {Object} part 页面上的区位,供部件停靠,编辑时可为空
*/
function AppendControlHTML(html, part) {
    var p = part || window.OT_SelectedPart;
    if (!p)
        return;
    $(p).append(html);
    //还要初始化新添加的部件的事件
    if (typeof (window.OT_EditorModel) != "undefined" && window.OT_EditorModel) {
        InitEditModel_InstManage();
    }
    //关闭对话框
    if (window.OT_Dialog)
        window.OT_Dialog.close();
}

/**
* 统一的打开URL为弹出框

* @method OpenDialogWithUrl
* @param {String} title 弹出窗体标题
* @param {String} url 要打开的页面地址
* @param {Number} w 弹出窗体宽度, 可为空
* @param {Number} h 弹出窗体高度, 可为空
*/
function OpenDialogWithUrl(title, url, w, h) {
    var dialog;
    if (window.OT_Dialog) {
        try { window.OT_Dialog.close(); } catch (x) { }
    }
    dialog = $.ligerDialog.open({ title: title, url: url, width: w || 700, height: h || 520, isResize: true, isHidden: false });
    window.OT_Dialog = dialog;
    H3Portal_IsOpenDialog = true;
    //禁止滚动
    LockPageScroll(true);
}

/**
* 检测页面有没有Dialog
* @method Auto run method
*/
$(function () {
    setInterval(function () {
        if (!window.OT_Dialog)
            return;
        var dialogid = window.OT_Dialog.id;
        if (H3Portal_IsOpenDialog && $("div[ligeruiid=" + dialogid + "]").length <= 0) {
            H3Portal_IsOpenDialog = false;
            //允许滚动
            LockPageScroll(false);
        }
    }, 300);
});

/**
* 锁定页面不让滚动

* @method LockPageScroll
* @param {Boolean} lock 是否锁定
*/
function LockPageScroll(lock) {
    if (lock) {
        $('html, body').css({
            'overflow': 'hidden',
            'height': '100%'
        });
    }
    else {
        $('html, body').css({
            'overflow': 'auto',
            'height': 'auto'
        });
    }
}

/**
* 基于jQuery的Ajax请求

* @method GetWebPartData
* @param {String} url 请求的服务页地址
* @param {String} ajaxType get/post
* @param {Object} data json格式的数据
* @param {String} dataType html/json/text...
* @param {Function} callback 响应成功时的回调方法
* @param {Function} errorCallback 响应失败时的回调方法
*/
function GetWebPartData(url, ajaxType, data, dataType, callback, errorCallback)
{
    $.ajax({
        type: ajaxType || "get",
        url: _SitePath + url,
        data: data,
        dataType: dataType || "html",
        success: function (d, textStatus) {
            if (typeof (callback) == "function")
                callback(d, textStatus);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if(typeof(errorCallback)=="function")
                errorCallback(jqXHR, textStatus, errorThrown);
        }
    });
}

/**
* 获取语言

* @method GetLanguageText
* @param {String} langname 语言名称
*/
function GetLanguageText(langname)
{
    if (typeof (OT_Portal_Language) == "undefined")
        return langname;
    return OT_Portal_Language[langname] || "[LANG_TEXT]";
    //return OT_Portal_Language[langname] || ("@" + langname);
}

/**
* 显示用户的控制面板

* @method ShowControlPanel
* @param {Object} target 目标标签(事件发起标签)
*/
function ShowControlPanel(target,categorycode,userId,url)
{
    var $tar = $(target);
    var tl = $tar.offset().left;
    var tt = $tar.offset().top;
    var tw = $tar.width();
    var th = $tar.height();
    var bw = $(document.body).width();
    var bh = $(document.body).height();
    //此处根据categorycode、userid获取对应的子菜单
    $.ajax({
        url: url,
        data: { "cmd": "GetFunctionNames", "UserID": userId, "CategoryCode": categorycode },
        cache: false,
        async: false,
        type: "POST",
        dataType: "json",
        success: function (data) {
            //alert(data);
            var html = "<div  style=\"margin:10px;\">";
            for (var i = 0; i < data.length; i++) {
                html += "<div class=\"fl\" style=\"width:40px; text-align:center; display:block;\">";
                html += "<div><a href=\"" + data[i].Url + "\"><img src=\"" + data[i].IconUrl + "\" width=\"40px\" height=\"40px\"/></div></a>";
                //html += "<div><a href=\"" + data[i].Url + "\"> " + data[i].DisplayName + "</a></div>";
                html += "</div>";
            }
            html += "<div class=\"clear\"></div>";
            html += "</div>";

            var div = document.createElement("div");
            div.id = "functionPanel";
            div.style.cssText = "width:200px;border:1px solid #dcdcdc; position:absolute; z-index:886; background-color:#fff;";
            div.innerHTML = html;
            var copy = target.cloneNode(true);
            copy.id = "copynode";
            copy.style.margin = "0px";
            copy.style.border = "1px solid #dcdcdc";
            copy.style.position = "absolute";
            copy.style.zIndex = 887;
            copy.style.backgroundColor = "#fff";
            copy.style.borderBottomWidth = "0px";

            //copy显示在原来的位置，遮盖住
            //div显示在下面
            copy.style.left = tl + "px";
            copy.style.top = tt + "px";
            div.style.top = tt + th + "px";
            if (tl + 340 <= bw) {
                //显示在右边
                div.style.left = tl + "px";
            }
            else {
                //显示在左边
                div.style.left = tl + tw - 200 + "px";
            }
            document.body.appendChild(copy);
            document.body.appendChild(div);

            //body绑定点击事件关闭
            $(document.body).bind("click", BodyClickEvent);
            
            $(div).bind("click", function (e) {
                //e.stopPropagation();
                //e.preventDefault();
            });
        }
    });
    function BodyClickEvent(e)
    {
        ClosePanel();
        e.stopPropagation();
        e.preventDefault();
    }

    function ClosePanel()
    {
        try {
            $("div[id*='functionPanel']").remove();
        }
        catch (x) {
        }
        try {
            $("#copynode").remove();
        }
        catch (x) {
        }

        $(document.body).unbind("click", BodyClickEvent);
    }
}