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
//// 获取本地化字符串
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


//使用说明
//①$.MvcSheetUI.MvcRuntime = new Sheet();初始化，建立缓存
//②$.MvcSheetUI.MvcRuntime.init($("body"));会使用缓存，提高性能
//③$.MvcSheetUI.MvcRuntime.init(ele);也可以任意使用某元素，但要确定ele其中的计算规则与其他区域无瓜葛
var Sheet = function (container) {
    this.autoHiddenEmptyRow = false;  // 是否隐藏空值行
    this.AttrDatafield = "data-datafield";
    this.init(container);
}

Sheet.prototype = {
    // 函数初始化事件
    init: function (container) {
        this.container = container;

        this.Computation = new Sheet.Computation(this);
        this.Validate = new Sheet.Validate(this);
        this.Display = new Sheet.Display(this);

        this.autoFinishWorkItem();
        if (this.autoHiddenEmptyRow) {
            this.hiddenEmptyRow();
        }
    },
    //更小粒度$.MvcSheetUI.MvcRuntime($("div"));
    Run: function (newContainner) {
        this.Computation.Run(newContainner);
        this.Validate.Run(newContainner);
        this.Display.Run(newContainner);
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
        var ctl = startObj.find("select[" + this.AttrDatafield + "='" + dataField + "'],div[" + this.AttrDatafield + "='" + dataField + "'],input[" + this.AttrDatafield + "='" + dataField + "'],span[" + this.AttrDatafield + "='" + dataField + "'],table[" + this.AttrDatafield + "='" + dataField + "'],textarea[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            for (var i = 0; i < ctl.length; i++) {
                var c = $(ctl[i]);
                if (c.is("span")) {
                    if (c.find("input").length > 0) return c.find("input");
                    if (c.attr("data-type")
                            && c.attr("data-type") == "SheetLabel"
                            && c.attr("data-bindtype")
                            && c.attr("data-bindtype") == "OnlyData") {
                        return c;
                    }
                    continue;
                }
                if (c.is("div")) {
                    if (c.find("input").length > 0) return c.find("input");
                    return c;
                }
                else {
                    return c;
                }
            }
        }
        startObj = startObj.parent();
        if (startObj.is("body")) return null;
        return this.findControlByDataField(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    getDataFieldValue: function (startObj, dataField) {
        var ctl = startObj.find("input[" + this.AttrDatafield + "='" + dataField + "'],select[" + this.AttrDatafield + "='" + dataField + "'],textarea[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            if (ctl[0].type == "checkbox") {
                return ctl[0].checked;
            }
            return ctl.val();
        }
        ctl = startObj.find("span[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            if (ctl.find("input").length > 0) {
                return ctl.find("input").is(":checked");
            }

            if (ctl.find("input").length > 0) return ctl.find("input").is(":checked");
            if (ctl.attr("data-type")
                    && ctl.attr("data-type") == "SheetLabel"
                    && ctl.attr("data-bindtype")
                    && ctl.attr("data-bindtype") == "OnlyData") {
                return ctl.html();
            }
        }
        ctl = startObj.find("table[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            var input = ctl.find("input");
            for (var i = 0; i < input.length; i++) {
                if (input[i].checked) return input[i].value;
            }
            return "";
        }
        ctl = startObj.find("div[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            ///选人控件赋值单独处理
            var userCode = "";
            ctl.each(function () {
                if ($(this).attr("data-type") == "SheetUser")
                {
                    userCode = $(this).SheetUser().GetValue();
                    return false;
                }
            });
            if (userCode != "") return userCode;

            var input = ctl.find("input");
            var text = "";
            for (var i = 0; i < input.length; i++) {
                if (input[i].checked) {
                    if (ctl.attr("data-type") == "SheetRadioButtonList")
                    {
                        text += $(input[i]).parent().find("label").html();
                    } else {
                        text += input[i].value;
                    }
                }
            }

            if (text == "")
            {
                var radioText = "";
                ctl.each(function () {
                    if ($(this).attr("data-type") == "SheetRadioButtonList") {
                        if ($(this).find("span").length > 0) {
                            radioText = $(this).find("span").html();
                        } else {
                            radioText = $(this).html();
                        }
                        return false;
                    }
                });
                if (radioText != "") return radioText;
            }
            return text;
        }

        startObj = startObj.parent();
        if (startObj.is("body") || startObj.is("html")) return null;
        return this.getDataFieldValue(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    getDataFieldControlValue: function (startObj, dataField) {
        var ctl = startObj.find("input[" + this.AttrDatafield + "='" + dataField + "'],textarea[" + this.AttrDatafield + "='" + dataField + "'],select[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            return ctl.val();
        }
        ctl = startObj.find("span[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            return ctl.html();
        }
        startObj = startObj.parent();
        if (startObj.is("body") || startObj.is("html")) return null;
        return this.getDataFieldValue(startObj, dataField);
    },
    // 获取离源控件最近的DataField控件的值
    setDataFieldControlValue: function (startObj, dataField, value) {
        var ctl = startObj.find("input[" + this.AttrDatafield + "='" + dataField + "'],textarea[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            ctl.val(value);
            return;
        }
        ctl = startObj.find("span[" + this.AttrDatafield + "='" + dataField + "']");
        if (ctl.length > 0) {
            ctl.html(value);
            return;
        }
        startObj = startObj.parent();
        if (startObj.is("body") || startObj.is("html")) return;
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
                param[item.toLowerCase()] = this.getDataFieldControlValue(startCtrl, options[item]);
                if (!param[item.toLowerCase()])
                    param[item.toLowerCase()] = options[item];
            }
            // 兼容旧版本而存在
            for (var item in options) {
                if (!param[item.toLowerCase()]) {
                    param[options[item]] = this.getDataFieldControlValue(startCtrl, item);
                }
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

// 打印模式
var winPrint = function () {
    window.print();
}

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