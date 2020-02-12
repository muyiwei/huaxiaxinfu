/*
H3 表单引用脚本
*/
// NTKO 附件对象
var NTKO_AttachInfo = new Array(); // 保存服务器上的控件列表信息
var NTKO_AttachObj = new Array();  // NTKO 控件对象

var _Sheet_GlobalString = {
    "Sheet_Loading": "数据加载中……",
    "Sheet_Wait": "系统正在处理{0}操作,请稍候。。。",
    "Sheet_Search": "搜索：",
    "Sheet_Close": "关闭",
    "Sheet_More": "更多..."
};
//获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_Loading,Sheet_Wait,Sheet_Search,Sheet_Close,Sheet_More" }, function (data) {
//    if (data.IsSuccess) {
//        _Sheet_GlobalString = data.TextObj;
//    }
//}, "json");

// 页面初始化设置信息
var pageInfo =
{
    LockImage: '<%=ResolveUrl("~/WFRes/images/WaitProcess.gif")%>'   // 锁屏时显示图片
};

var Sheet = function () {
    this.autoHiddenEmptyRow = false;  // 是否隐藏空值行
    this.style = {
        inputMouseOut: "inputMouseOut",
        inputMouseMove: "inputMouseMove",
        inputMouseEnter: "inputMouseEnter"
    };
    $(function () {
        sheet.Computation = new Sheet.Computation(sheet);
        sheet.Linkage = new Sheet.Linkage(sheet);
        sheet.Validate = new Sheet.Validate(sheet);
        sheet.Display = new Sheet.Display(sheet);
        sheet.Format = new Sheet.Format(sheet);
        vidiator.initValiate();     // 初始化表单验证样式

        if (sheet.init) sheet.init();

        // 注册输入框鼠标样式
        $("input,textarea").unbind("mouseover.style").bind("mouseover.style",
            function () {
                $(this).removeClass(sheet.style.inputMouseOut).addClass(sheet.style.inputMouseMove);
            })
            .unbind("mouseenter.style").bind("mouseenter.style",
            function () {
                $(this).removeClass(sheet.style.inputMouseMove).addClass(sheet.style.inputMouseEnter);
            })
            .unbind("mouseout.style").bind("mouseout.style",
            function () {
                $(this).removeClass(sheet.style.inputMouseEnter).removeClass(sheet.style.inputMouseMove).addClass(sheet.style.inputMouseOut);
            });

        $(".editor").each(function (n, o) {
            var id = o.id;
            var w = $(this).width();
            var h = $(this).height();
            CKEDITOR.replace(id, { height: h, width: w });
        });

        $(".tableStyle>tbody>tr").each(function () {
            if ($(this).find("lable,input,select,textarea,span").length == 0
                && !$.trim($(this).text())) {
                $(this).hide();
            }
        });
    });
}

Sheet.prototype = {
    // 函数初始化事件
    init: function () {
        this.autoFinishWorkItem();
        if (this.autoHiddenEmptyRow) {
            this.hiddenEmptyRow();
        }
    },
    // 计算结果值
    getResultValue: function (express) {
        if (express.indexOf("return") == -1)
            return eval(express);
        else {
            return new Function(express).call(this);
        }
    },
    // 获取URL参数的值，相当于 Request.QueryString
    getQueryString: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return unescape(r[2]);
        return null;
    },
    // 判断浏览器是否IE 
    isIE: function () {
        return (!!window.ActiveXObject || "ActiveXObject" in window);
    },
    // 打印预览
    preview: function () {
        document.write("<object id=\"WebBrowser\" classid=\"CLSID:8856F961-340A-11D0-A96B-00C04FD705A2\" height=\"0\" width=\"0\"></object>");
        document.all.WebBrowser.ExecWB(7, 1);
    },
    // 自动完成任务
    autoFinishWorkItem: function () {
        var parmAction = this.getQueryString("ParmAction");
        if (parmAction == "Submit") {
            var submits = $("#divTopBars a:contains('提交')");
            if (submits.length == 0)
                submits = $("#divTopBars a:contains('通过')");
            if (submits.length == 0)
                submits = $("#divTopBars a:contains('已阅')");
            if (submits.length > 0) {
                var submitId = submits[0].id;
                __doPostBack(submitId, "");
            }
        }
        else if (parmAction == "Return") {
            var returns = $("#divTopBars a:contains('驳回')");
            if (returns.length == 0)
                returns = $("#divTopBars a:contains('退回')");
            if (returns.length > 0) {
                var returnId = returns[0].id;
                __doPostBack(returnId, "");
            }
        }
    },
    // 设置工具栏随滚动条进行滚动
    setToolBarScroll: function () {
        $("input[class='toolbar']").each(function () {
            var divTopBars = $(this).parent();
            var divBlackArea = divTopBars.next();
            if (this.value == "1") {// 置于顶端
                // 设置空白区域显示，防止工具栏盖住流程名称
                if (divBlackArea.html() == "") divBlackArea.show();
                divTopBars.css("position", "absolute")
                          .css("width", divTopBars.parent().width());
                divTopBars.parent().resize(function () { divTopBars.css("width", divTopBars.parent().width()); });
                // 设置 Windows 滚动事件
                $(window).scroll(function () {
                    divTopBars.css("top", $(document).scrollTop());
                });
            }
            else {
                // 设置空白区域隐藏
                if (divBlackArea.html() == "") divBlackArea.hide();
            }
        });
    },
    // 隐藏不需要看到的空行
    hiddenEmptyRow: function () {
        $("#tbTable tr,#tbBasicInfo tr").each(function (index) {
            if (index > 2) {
                if ($(this).find("table[id^='tbComment']").length > 0) {
                    if ($.trim($(this).find("table[id^='tbComment']").text()) == ""
                        && $(this).find("select").length == 0
                        && $(this).find("td").length == 2
                    ) {
                        $(this).hide();
                    }
                }
            }
        });
    },
    // 解除锁屏幕操作
    unLockScreen: function () {
        $("#divLock").remove();
        $("#frameLock").remove();
    },
    // 锁定屏幕操作
    lockScreen: function (msg) {
        var sWidth, sHeight, top;
        sWidth = $(document).width();
        sHeight = $(document).height();
        top = $(document).scrollTop() + $(window).height() / 2;
        $("<iframe></iframe>")
                .attr("id", "frameLock")
                .css("position", "absolute")
                .css("top", 0)
                .css("left", 0)
                .css("width", sWidth)
                .css("height", sHeight)
                .css("zIndex", 9999)
                .css("backgroundColor", "Transparent")
                .css("frameborder", 0)
                .css("filter", "Alpha(Opacity=0)")
                .css("allowtransparency", true)
                .appendTo("body");
        $("<div></div>")
                .html("<table id=\"spanLockMessage\" border=\"0\" style=\"width:" + sWidth + "px;font-size:26px;font-weight:bold;position:absolute;top:" + top + "px\"><tr><td align=\"center\"><img src=\"" + pageInfo.LockImage + "\"></td></tr></table>")
                .attr("id", "divLock")
                .css("position", "absolute")
                .css("top", 0)
                .css("left", 0)
                .css("width", sWidth)
                .css("height", sHeight)
                .css("zIndex", 10000)
                .css("backgroundColor", "#CCCCCC")
                .css("filter", "progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=25,finishOpacity=55")
                .css("opacity", "0.6")
                .css("allowtransparency", true)
                .appendTo("body");
        $(window).scroll(function () {
            $("#spanLockMessage").css("top", $(document).scrollTop() + $(window).height() / 2);
        });
    },
    // FUN:获取控件的值，兼容文本框、下拉框、单选框三种类型的控件
    getControlValue: function (id) {
        var ctl = document.getElementById(id);
        if (ctl != null && ctl.type != null) {
            return $(ctl).val();
        }
        if ($("input[name='" + id + "']").length > 0) {
            return $("input[name='" + id + "']:checked").val();
        }
        return "";
    },
    // 设置控件为只读状态
    setControlReadOnly: function (itemName) {
        var ctl = this.findControlByDataField(window, itemName);
        if (ctl.length > 0) {
            ctl.keydown(function (e) {
                return false;
            });
        }
    },
    // 查找离源控件最近的DataField控件
    findControlByDataField: function (startObj, dataField) {
        var ctl = startObj.find("select[datafield='" + dataField + "'],input[datafield='" + dataField + "'],span[datafield='" + dataField + "'],table[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            if (ctl.is("span")) {
                if (ctl.find("input").length > 0) return ctl.find("input");
            }
            return ctl;
        }
        startObj = startObj.parent();
        if (startObj.is("body")) return null;
        return this.findControlByDataField(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    getDataFieldValue: function (startObj, dataField) {
        var ctl = startObj.find("input[datafield='" + dataField + "'],select[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            return ctl.val();
        }
        ctl = startObj.find("span[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            if (ctl.find("input").length > 0) {
                return ctl.find("input").is(":checked");
            }
            return ctl.html();
        }
        ctl = startObj.find("table[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            var input = ctl.find("input");
            for (var i = 0; i < input.length; i++) {
                if (input[i].checked) return input[i].value;
            }
            return "";
        }

        startObj = startObj.parent();
        if (startObj.is("body")) return null;
        return this.getDataFieldValue(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    getDataFieldControlValue: function (startObj, dataField) {
        var ctl = startObj.find("input[datafield='" + dataField + "'],textarea[datafield='" + dataField + "'],select[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            return ctl.val();
        }
        ctl = startObj.find("span[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            return ctl.html();
        }
        startObj = startObj.parent();
        if (startObj.is("body") || startObj.is("html")) return null;
        return this.getDataFieldValue(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    setDataFieldControlValue: function (startObj, dataField, value) {
        var ctl = startObj.find("input[datafield='" + dataField + "'],textarea[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            ctl.val(value);
            return;
        }
        ctl = startObj.find("span[datafield='" + dataField + "']");
        if (ctl.length > 0) {
            ctl.html(value);
            return;
        }
        startObj = startObj.parent();
        if (startObj.is("body")) return;
        return this.setDataFieldControlValue(startObj, dataField, value);
    },
    // 执行业务服务方法，返回的是单个值
    // serviceCode:业务服务Code
    // methodName:方法名称
    // options:传递的输入参数,格式:{数据项:业务属性,数据项:业务属性}
    // [startCtrl],开始查找的控件名称
    // [propertyName],返回对象中的属性名称
    executeService: function (serviceCode, methodName, options, startCtrl, propertyName) {
        var result;
        var returnValue = this.executeBizService(serviceCode, methodName, options, startCtrl);
        if (propertyName) {
            result = returnValue[propertyName]
        }
        else {
            for (var o in returnValue) {
                result = returnValue[o];
                break;
            }
        }
        return result;
    },
    // 执行业务服务方法，返回的是实体对象JOSN
    // serviceCode:业务服务Code
    // methodName:方法名称
    // options:传递的输入参数,格式:{数据项:业务属性,数据项:业务属性}
    // [startCtrl],开始查找的控件名称
    // [propertyName],返回对象中的属性名称
    executeBizService: function (serviceCode, methodName, options, startCtrl) {
        var param = { cmd: "ExecuteServiceMethod", "ServiceCode": serviceCode, "MethodName": methodName };
        if (!startCtrl) startCtrl = $("body");
        if (options) {
            for (var item in options) {
                param[item] = this.getDataFieldControlValue(startCtrl, options[item]);
            }

            // 兼容旧版本而存在
            for (var item in options) {
                param[options[item]] = this.getDataFieldControlValue(startCtrl, item);
            }
        }
        var returnValue;
        $.ajax({
            type: "POST",
            async: false,
            url: _PORTALROOT_GLOBAL + "/AjaxServices.aspx",
            data: param,
            dataType: "json",
            success: function (data) {
                returnValue = data;
            },
            error: function (e) {
                var msg = e.toString();
                alert(msg);
            }
        });
        return returnValue;
    }
    // End prototype
}

var sheet = new Sheet();

// 打印模式
var winPrint = function () {
    //sheet.isIE() ? sheet.preview() : window.print();
    $(function () {
        $("a").each(function () {
            var t = $(this);
            $("<span>" + t.text() + "</span>").insertAfter(t);
            $(this).hide();
        });
        window.print();
    });
}

/* -----------------------------------------------
显示用户头像 Start
-----------------------------------------------*/
function insertAfter(newElement, targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
        parent.appendChild(newElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

function ShowUnitTips(src) {
    HideUnitTips(src);
    var querierCtrl = $(src);
    var url = querierCtrl.attr("url"); //  src["url"];
    src.id = src["name"];
    var TipID = src.id + "_TipsDiv";
    var TipsDiv = document.getElementById(TipID);
    if (TipsDiv == null) {
        TipsDiv = document.createElement("div");
        TipsDiv.id = TipID;
        TipsDiv.style["border"] = "1px solid #5FC12F";
        TipsDiv.style["backgroundColor"] = "#FFFFFF";
        TipsDiv.style["position"] = "absolute";
        TipsDiv.style["zIndex"] = "10";
        insertAfter(TipsDiv, src);
        TipsDiv.style["color"] = "black";
    }
    {
        var tipText = document.createElement("span");
        tipText.style["color"] = "red";
        tipText.innerHTML = _Sheet_GlobalString.Sheet_Loading;
        TipsDiv.appendChild(tipText);
        var top, left;
        top = parseInt(querierCtrl.offset().top) + parseInt(querierCtrl.height()) + 2;       // 输入框距离上边的位置
        left = querierCtrl.offset().left;                                                    // 输入框距离左边的位置
        $(TipsDiv).css("top", top)
                  .css("left", left);
    }
    TipsDiv.style["display"] = "";

    if (src.value == "") {
        src.parentNode.removeChild(TipsDiv);
        return;
    }

    if (url != null && url.indexOf('?') >= 0) {
        url = url + "&" + Math.random();
    }
    else {
        url = url + "?" + Math.random();
    }
    url = url + "&FindKey=" + encodeURI(src.value) + "&src=" + src.id;

    XmlHttpGetMethodSyn(url, TipsDiv, ShowTipBack);
}

function ShowTipBack(src) {
    var iframeDiv = "<iframe style=\"position: absolute; z-index: -1; filter: alpha(opacity=0);width:0px;height:0px;\"></iframe>";
    if (src.innerHTML.length > 0) {
        src.innerHTML = iframeDiv + src.innerHTML;
    }
    if (src.offsetHeight > 200) {
        src.style["height"] = "200px";
        src.style["paddingRight"] = "16px";
        src.style["overflowY"] = "scroll";
    }
}
function HideUnitTips(src) {
    var TipID = src.id + "_TipsDiv";
    var TipsDiv = document.getElementById(TipID);

    if (TipsDiv != null) {
        src.parentNode.removeChild(TipsDiv);
    }
}

function SelectTipItem(row, nameControlId, idControlId, Text, Value) {
    // IE7: window.opener.document.getElementById(nameControlId).value=Text;
    document.getElementById(nameControlId).value = Text;
    document.getElementById(idControlId).value = Value;
    var div = row.parentElement.parentElement.parentElement;
    div.parentNode.removeChild(div);
    // HideUnitTips(src.parentElement.parentElement.parentElement.parentElement);
    document.getElementById(nameControlId).style.color = "";
}

function KeySelectUnitTip(src) {
    if (event.keyCode == 13) {
        var tipDiv = src.parentNode.lastChild;

        if (tipDiv.tagName != "DIV" ||
            tipDiv.style["display"] == "none" ||
            tipDiv.childNodes.length == 0 ||
            tipDiv.lastChild.tagName != "TABLE") {
            ShowUnitTips(src);
        }
        else {
            for (i = tipTable.rows.length - 1; i >= 0; i--) {
                if (tipTable.rows[i].style['backgroundColor'] == "orange") {
                    tipTable.rows[i].onclick();
                    break;
                }
            }
        }
        event.keyCode = 0;
        event.cancelBubble = true;
        return false;
    }
    return true;
}
/* -----------------------------------------------
显示用户头像 End
-----------------------------------------------*/

/***********************************************************************************************
下列框选人操作
***********************************************************************************************/
var currentObj;

// 从组织架构中获取数据，进行下拉框选人列表进行绑定
var setUserListSelect = function (selectUserListUrl, listType, txtUserNames, txtUserIDs, selectType, unitId, roleName, companySelectable, segmentSelectable, orgUnitSelectable, groupSelectable, userSelectable, category, selectMore, unitType, selfUnit) {
    if (selfUnit == null) selfUnit = "0"; // 兼容旧版本
    var isCompanySelectable, isSegmentSelectable, isOrgUnitSelectable, isGroupSelectable, isUserSelectable;
    isCompanySelectable = true; // companySelectable == 1;
    isSegmentSelectable = segmentSelectable == 1;
    isOrgUnitSelectable = orgUnitSelectable == 1;
    isGroupSelectable = groupSelectable == 1;
    isUserSelectable = userSelectable == 1;
    var method = listType;

    $.ajax({
        url: selectUserListUrl,
        data: {
            UnitID: unitId,
            "ListType": method,
            "UserVisible": isUserSelectable,
            "OUVisible": isOrgUnitSelectable,
            "SegmentVisible": isSegmentSelectable,
            "GroupVisible": isGroupSelectable,
            "RoleName": roleName,
            "CategoryCodes": category,
            "OnlyDisplayOwnUnits": selfUnit
        },
        cache: false,
        async: true,
        type: "POST",
        dataType: "html",
        success: function (data) {
            if (data == null) return;
            if (typeof (data) == "undefined") return;
            try {
                data = eval(data);
                $.setUserListDefault(txtUserNames, txtUserIDs, selectType, data, selectMore, unitType);

            } catch (e) { }
        },
        error: function (e) {
            // alert(e);
        }
    });
}

$.extend({
    lockScreen: function (obj) { // 锁屏
        var msg = _Sheet_GlobalString.Sheet_Wait.replace("{0}", obj.innerText);
        sheet.lockScreen(msg);
    },
    unlockScreen: function (obj) { // 解锁
        sheet.unLockScreen();
    },
    // 用户搜索自动匹配
    autoComplete: function (tableID, value) {
        var table = $("#" + tableID);
        var tr, trs;
        trs = table.find("tr");
        trs.each(function (n) {
            tr = trs[n];
            if (tr.innerText.indexOf(value) > -1) {
                $(tr).show();
            }
            else {
                $(tr).hide();
            }
        })
    },
    // 关闭选择用户框
    closeUserSelect: function () {
        if ($("#divSelectUser").length > 0) {
            $("#divSelectUser").html("");
            $("#divSelectUser").hide();
        }
    },
    // 设置单项项
    setUserSingleSelect: function (userName, userID, id, value) {
        $("#" + userName).val(value);
        $("#" + userID).val(id);
        $.closeUserSelect();
    },
    // 判断数值中是否存在值
    containsValue: function (values, value, splitChar) {
        if ($.trim(values) == "") return false;
        var arr = values.split(splitChar);
        for (var i = 0; i < arr.length; i++) {
            if ($.trim(arr[i]) == $.trim(value)) return true;
        }
        return false;
    },
    // 设置用户多选
    setUserMutiSelect: function (userName, userID, id, value, checked) {
        var names = $.trim($("#" + userName).val());
        var ids = $.trim($("#" + userID).val());
        var arr = ids.split(";");
        if (checked) {// 设置选中
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == id) {
                    return;
                }
            }
            ids += (ids == "" || ids.substr(ids.length - 1) == ";") ? id : ";" + id;
            names += (names == "" || names.substr(names.length - 1) == ";") ? value : ";" + value;
        }
        else {// 设置非选中
            ids = "";
            var index = 0;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == id) { index = i; continue; }
                ids += ids == "" ? arr[i] : ";" + arr[i];
            }
            arr = names.split(";");
            names = "";
            for (var i = 0; i < arr.length; i++) {
                if (i == index) continue;
                names += names == "" ? arr[i] : ";" + arr[i];
            }
        }
        $("#" + userName).val(names);
        $("#" + userID).val(ids);
    },
    /// 设置默认选人
    /*
    userList 数据格式：
    userList = {
    Users : [
    {ID:"ID1",Value:"Name1",Checked:true}
    ,{ID:"ID2",Value:"Name2",Checked:true}
    ,{ID:"ID3",Value:"Name3",Checked:true}
    ]
    }
    }
    selectType : 0 表示单选  1 表示多选
    */
    setUserListDefault: function (txtUserNames, txtUserIDs, selectType, userList, selectMore, unitType) {
        var top, left, width;
        obj = $("#" + txtUserNames);
        currentObj = obj;
        width = obj.width();                                            // 输入框的宽度
        top = parseInt(obj.offset().top) + parseInt(obj.height()) + 8;  // 输入框距离上边的位置
        left = obj.offset().left;                                       // 输入框距离左边的位置
        var idValues = $("#" + txtUserIDs).val();                       // 获取已经选定的值
        var html;
        var mouseoverColor = "#5FC12F";
        var mouseoutColor = "#CCCCCC";

        if ($("#divSelectUser").length == 0) {
            $("<div></div>")
                .attr("id", "divSelectUser")
                .css("position", "absolute")
                .css("zIndex", 100)
                .css("border", "1px solid #5FC12F")
                .css("backgroundColor", mouseoutColor)
            // .css("filter", "progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=10,finishOpacity=100")
            // .css("opacity", "0.9")
            //.css("allowtransparency", true)
                .appendTo("body");
        }
        var closeWidth = 63;
        var trValues = "";
        var id, value, checked;
        var selectMode = "";
        if (selectType == 1) {// 多选项
            for (var i = 0; i < userList.Users.length; i++) {
                if (unitType != 8 && unitType != 9 && unitType != 14 && userList.Users[i].Type == "User") continue;  // 可选单位和人时，不显示人
                id = userList.Users[i].ID;
                value = userList.Users[i].Value;
                checked = (idValues.indexOf(userList.Users[i].ID) > -1) ? "checked=\"checked\"" : "";
                trValues += "<tr onmousemove=\"this.bgColor='" + mouseoverColor + "';\" onmouseout=\"this.bgColor='" + mouseoutColor + "';\"><td style=\"font-size:13px\"><input type=\"checkbox\" id=" + id + " " + checked + " onclick=\"$.setUserMutiSelect('" + txtUserNames + "','" + txtUserIDs + "',this.id,'" + value + "',this.checked);\"> " + value + "</td></tr>";
            }
            selectMode = "Multi";
        }
        else {// 单选项
            for (var i = 0; i < userList.Users.length; i++) {
                if (unitType != 8 && unitType != 9 && unitType != 14 && userList.Users[i].Type == "User") continue; // 可选单位和人时，不显示人
                id = userList.Users[i].ID;
                value = userList.Users[i].Value;
                trValues += "<tr onmousemove=\"this.bgColor='" + mouseoverColor + "';\" onmouseout=\"this.bgColor='" + mouseoutColor + "';\" onclick=\"$.setUserSingleSelect('" + txtUserNames + "','" + txtUserIDs + "','" + id + "','" + value + "')\"><td style=\"font-size:13px\"><a style=\"cursor:hand\">" + value + "</a></td></tr>";
            }
            selectMode = "Single";
        }

        var more = "var urlVar = _PORTALROOT_GLOBAL+'/SelectUser.aspx?UserControl=" + txtUserNames + "&UnitType=" + unitType + "&VisibleUnitType=31&VisibleType=3&";
        more += "VisibleUnits=&VisbileCategories=&StartSelectableLevel=0&EndSelectableLevel=100&ExpandToLevel=1&Mode=" + selectMode + "&UserIDControl=" + txtUserIDs + "';";
        more += "var childWindowProperties='toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=510,left=' + (window.screen.width - 600)/2 +',top='+ (window.screen.height - 510)/2; ";
        more += "window.open(urlVar, '', childWindowProperties);"
        var html = "<table style=\"font-size:13px\" border=\"0\" style=\"width:100%\"><tr><td style=\"width:" + (width - closeWidth) + "px;\">";
        html += _Sheet_GlobalString.Sheet_Search + "<input type=\"text\" value=\"\" onkeyup=\"$.autoComplete('tdSelectUser',this.value)\" style=\"width:" + (width - closeWidth - 60) + "px\"></td><td style=\"width:" + closeWidth + "px\">"
        html += "<input type=\"button\" value=\"" + _Sheet_GlobalString.Sheet_Close + "\" onclick=\"$.closeUserSelect();\"></td></tr>";
        html += "</table>";
        html += "<div style=\"height:210px;overflow-x:hidden;overflow-y:auto;width:100%\">";
        html += "<table id=\"tdSelectUser\" style=\"font-size:13px;width:100%;\" border=\"0\">";
        html += trValues;
        // 需要显示更多
        if (typeof (selectMore) != "undefined" && selectMore == "1") {
            html += "<tr><td style=\"height:26px;\"><a href=\"#\" onclick=\"javascript:" + more + "\">" + _Sheet_GlobalString.Sheet_More + "</a></td></tr>";
        }
        html += "<tr><td style=\"height:36px;\">&nbsp;</td></tr>";
        html += "</table>";
        html += "</div>";

        var div = $("#divSelectUser");
        div.html(html)
            .css("top", top - 4)
            .css("left", left)
            .css("width", width)
            .css("height", "228px")
            .css("lang", "")
            .show();

        // 判断当前鼠标是否在控件范围内
        $("body").click(function (event) {
            if (div.length > 0) {
                var top = currentObj.offset().top;
                var bottom = parseInt(div.offset().top) + parseInt(div.height());
                var left = currentObj.offset().left;
                var right = parseInt(currentObj.offset().left) + parseInt(currentObj.width());
                if (event.pageY < top ||
                    event.pageY > bottom ||
                    event.pageX < left ||
                    event.pageX > right) {
                    $("#divSelectUser").html("");
                    $("#divSelectUser").hide();
                }
            }
        });
    }
});

// 检测浏览器是否是 IPad 类型
function isBrowseIPad() {
    var ua = navigator.userAgent.toLowerCase();
    var s;
    s = ua.match(/iPad/i);

    if (s == "ipad") {
        return true;
    }
    else {
        return false;
    }
}


// 以下拉框方式显示主数据
function openFrameSelectUser(ctlId, url, height, width) {
    var top, left;
    var ctl = $("#" + ctlId);
    top = parseInt(ctl.offset().top) + parseInt(ctl.height()) + 4;   // 输入框距离上边的位置
    left = ctl.offset().left;                                        // 输入框距离左边的位置
    if (!height) height = "500px";
    if (!width) width = window.screen.width - left; //  "300px";

    var div = $("#divFrameSelectUser");
    if (div.length == 0) {// Div 不存在，则首先创建Div
        $("<div id=\"divFrameSelectUser\" style=\"display:none;background-color:#FFFFFF;\"><iframe id=\"frmSelectUser\" frameborder=\"0\" height=\"" + height + "\" width=\"" + width + "\" src=\"" + url + "\"></div>").appendTo("body");
    }
    div = $("#divFrameSelectUser");
    if (ctl.val() == "") {
        if (window.frames["frmSelectUser"].document.getElementById("SelectedUsers"))
            window.frames["frmSelectUser"].document.getElementById("SelectedUsers").length = 0;
        if (window.frames["frmSelectUser"].document.getElementById("SelectUser1_SelectedUserIds"))
            window.frames["frmSelectUser"].document.getElementById("SelectUser1_SelectedUserIds").value = "";
        if (window.frames["frmSelectUser"].document.getElementById("SelectUser1_SelectedUserNames"))
            window.frames["frmSelectUser"].document.getElementById("SelectUser1_SelectedUserNames").value = "";
    }
    // 设置位置
    div.css("position", "absolute")
                .css("zIndex", 1)
                .css("lang", "")
                .css("border", "0px solid #5FC12F")
                .css("top", top)
                .css("left", left)
                .css("width", width)
                .css("height", height)
                .show();
    // 注册鼠标移入事件
    div.mouseover(function () {
        div.attr("lang", "1");
    });
    div.mouseout(function (e) {
        if (e.clientY < parseInt(this.style.top)
                    || e.clientY >= parseInt(this.style.top) + parseInt(this.style.height)
                    || e.clientX < parseInt(this.style.left)
                    || e.clientX >= parseInt(this.style.left) + parseInt(this.style.width)
                )
            div.hide();
    });
    ctl.mouseout(function () {
        setTimeout(
                    function () {
                        if (div.attr("lang") == null || div.attr("lang") == "") {
                            div.hide();
                        }
                    }, 500);
    });
};

// 打开主数据选择界面
// Create By HuangJie 2012-8-30
// 参数1：打开的路径
// 参数2：{数据项1:属性,数据项2:属性}，也可以是 {数据项1:属性,控件ClientID:属性}
// 参数3：绑定的业务对象名称
// 参数4：业务对象Load方法的名称
// 参数5：业务对象获取明细方法的名称
// 参数6：绑定的输出参数
// 参数7：业务对象查询的编码
// 参数8: 显示主数据控件的所在容器类型
function openMasterDataWindow(ctrl, url, inputMappings, schemaCode, listObjectMethod, singleDetailObjectMethod, outputParams, queryCode, containType) {
    var height = 550;
    var width = 700;
    var parm = "";
    var parmValue = "";

    $.each(inputMappings, function (k, v) {
        var ctl = sheet.findControlByDataField(ctrl, k);
        if (ctl) {
            parmValue = sheet.getControlValue(ctl.attr("id"));
            if (parmValue) {
                parm += parm == "" ? "" : "|";
                parm += v + "," + parmValue;
            }
        }
    });
    url += "?SchemaCode=" + encodeURI(schemaCode);
    url += "&ListObjectMethod=" + encodeURI(listObjectMethod);
    url += "&SingleDetailObjectMethod=" + encodeURI(singleDetailObjectMethod);
    url += "&OutputParams=" + encodeURI(outputParams);
    url += "&QueryCode=" + encodeURI(queryCode);
    url += "&ContainType=" + containType;
    url += "&CtrlID=" + ctrl.attr("id");
    if (parm != "") url += "&InputParam=" + encodeURI(parm);
    var childWindowProperties = "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=" + width + ",height=" + height + ",";
    childWindowProperties += "left=" + (window.screen.width - width) / 2 + ",top=" + (window.screen.height - height) / 2 + ";";
    popupWindow = window.open(url, "MasterData", childWindowProperties);
    if (popupWindow) {
        window.popupWindow.focus();
    }
}

// 以下拉框方式显示主数据
function openMasterDataFrame(ctl, url, inputMappings, schemaCode, listObjectMethod, singleDetailObjectMethod, outputParams, queryCode, containType, height, width) {
    var top, left;
    top = parseInt(ctl.offset().top) + parseInt(ctl.height()) + 4;   // 输入框距离上边的位置
    left = ctl.offset().left;                                        // 输入框距离左边的位置

    var divId = ctl.attr("id") + "_MasterData";
    var div = $("#" + divId);

    // 构造选择主数据的 URL 地址
    var parm = "";
    var parmValue = "";
    $.each(inputMappings, function (k, v) {
        var ctl = sheet.findControlByDataField(ctrl, k);
        if (ctl) {
            parmValue = sheet.getControlValue(ctl.attr("id"));
            if (parmValue) {
                parm += parm == "" ? "" : "|";
                parm += v + "," + parmValue;
            }
        }
    });
    url += "?SchemaCode=" + encodeURI(schemaCode);
    url += "&ListObjectMethod=" + encodeURI(listObjectMethod);
    url += "&SingleDetailObjectMethod=" + encodeURI(singleDetailObjectMethod);
    url += "&OutputParams=" + encodeURI(outputParams);
    url += "&QueryCode=" + encodeURI(queryCode);
    url += "&ContainType=" + containType;
    url += "&CtrlID=" + ctl.attr("id");
    if (parm != "") url += "&InputParam=" + encodeURI(parm);
    url += "&OpenType=1";
    url += "&Width=" + width;

    if (div.length == 0) {// Div 不存在，则首先创建Div
        $("<div id=\"" + divId + "\" style=\"display:none;\"><iframe id=\"" + ctl.attr("id") + "_frmMasterData\" frameborder=\"0\" height=\"" + height + "\" width=\"" + width + "\" src=\"" + url + "\"></div>").appendTo("body");
    }
    div = $("#" + divId);
    var frame = $("#frmMasterData");
    // 设置位置
    div.css("position", "absolute")
                .css("zIndex", 1)
                .css("lang", "")
                .css("border", "0px solid #5FC12F")
                .css("top", top)
                .css("left", left)
                .css("width", width)
                .css("height", height)
                .show();
    // 注册鼠标移入事件
    div.mouseover(function () {
        div.attr("lang", "1");
    });
    div.mouseout(function (e) {
        if (e.clientY < parseInt(this.style.top)
                    || e.clientY >= parseInt(this.style.top) + parseInt(this.style.height)
                    || e.clientX < parseInt(this.style.left)
                    || e.clientX >= parseInt(this.style.left) + parseInt(this.style.width)
                )
            div.hide();
    });

    ctl.mouseout(function () {
        setTimeout(
                    function () {
                        if (div.attr("lang") == null || div.attr("lang") == "") {
                            div.hide();
                        }
                    }, 500);
    });
}