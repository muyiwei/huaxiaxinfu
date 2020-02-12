/*
表单联动规则，由 SheetBizDropDownList 控件进行实现
Authine 2013-9
*/
var _v = "";
var _Sheet_Display_GlobalString = { "Sheet_Display_Msg0": "显示规则设置错误：" };
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_Display_Msg0" }, function (data) {
//    if (data.IsSuccess) {
//        _Sheet_Display_GlobalString = data.TextObj;
//    }
//}, "json");

Sheet.Display = function (sheet) {
    this.AttrName = "data-displayrule";
    this.AttrNameCell = "data-Celldisplayrule";
    this.sheet = sheet;
    this.controls = [];
    this.init();
}

Sheet.Display.prototype = {
    init: function () {
        this.controls.length = 0;
        if (!this.sheet.container) {
            this.sheet.container = $("input[" + this.AttrName + "],span[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],label[" + this.AttrName + "]");

            this.sheet.containerCell = $("input[" + this.AttrNameCell + "],span[" + this.AttrNameCell + "],textarea[" + this.AttrNameCell + "],select[" + this.AttrNameCell + "],div[" + this.AttrNameCell + "],label[" + this.AttrNameCell + "]");

        }
        else {
            this.sheet.container = $(this.sheet.container.context).find("input[" + this.AttrName + "],span[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],label[" + this.AttrName + "]");

            this.sheet.containerCell = $(this.sheet.container.context).find("input[" + this.AttrNameCell + "],span[" + this.AttrNameCell + "],textarea[" + this.AttrNameCell + "],select[" + this.AttrNameCell + "],div[" + this.AttrNameCell + "],label[" + this.AttrNameCell + "]");

        }

        this.sheet.container.each(function (o) {
            if ($(this).parent().parent().hasClass("template")) {
                return;
            }

            var displayrule = $(this).attr(o.AttrName);
            if (displayrule) {
                o.registerEvent(this.id, displayrule);
            }
        }, [this]); 

        this.sheet.containerCell.each(function (o) {
            if ($(this).parent().parent().hasClass("template")) {
                return;
            }

            var displayrule = $(this).attr(o.AttrNameCell);
            if (displayrule) {
                o.registerEvent(this.id, displayrule);
            }
        }, [this]);

        $.each(this.controls, function (index, obj) {
            $(obj).change();
        });
    },
    //$.MvcSheetUI.MvcRuntime.Display.Run($("div"));
    Run: function (newContainner) {
       
        var tmpcontrols = [];

        var container = newContainner.find("input[" + this.AttrName + "],span[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],label[" + this.AttrName + "]");

        var containerCell = newContainner.find("input[" + this.AttrNameCell + "],span[" + this.AttrNameCell + "],textarea[" + this.AttrNameCell + "],select[" + this.AttrNameCell + "],div[" + this.AttrNameCell + "],label[" + this.AttrNameCell + "]");

        container.each(function (o) {
            if ($(this).parent().parent().hasClass("template")) {
                return;
            }

            var displayrule = $(this).attr(o.AttrName);
            if (displayrule) {
                o.registerEvent(this.id, displayrule, tmpcontrols);
            }
        }, [this]);

        containerCell.each(function (o) {
            if ($(this).parent().parent().hasClass("template")) {
                return;
            }

            var displayrule = $(this).attr(o.AttrNameCell);
            if (displayrule) {
                o.registerEvent(this.id, displayrule, tmpcontrols);
            }
        }, [this]);

        $.each(tmpcontrols, function (index, obj) {
            $(obj).change();
        });
    },
    // 注册计算事件主方法
    registerEvent: function (id, eventExpress, tmpcontrols) {
        var fieldArray = eventExpress.split("{");
        var dataField;
        var isCount = false;
        for (var i = 1; i < fieldArray.length; i++) {
            var index = fieldArray[i].indexOf("}");
            if (index == -1) {
                alert(_Sheet_Display_GlobalString.Sheet_Display_Msg0 + eventExpress); return;
            }

            dataField = fieldArray[i].substring(0, index);
            
            // 获取控件
            var filterCtrl = this.sheet.findControlByDataField($("#" + id), dataField);

            if (!filterCtrl) return;
            if (filterCtrl.parents("[data-type='SheetUser']").length > 0) {
                filterCtrl = filterCtrl.parents("[data-type='SheetUser']");
            }

            filterCtrl.unbind("change." + id).bind("change." + id, [this], function (e, val) {
                if ($("#" + id).length == 0) {
                    return;
                }
                _v = val;
                //给整行设置displayrule属性时在移动端会出现两个id一致的DIV
                if ($("[id=" + id + "]").length > 1) {
                    e.data[0].selectChanged($("[id=" + id + "]"), eventExpress);
                } else {
                    e.data[0].selectChanged($("#" + id), eventExpress);
                }
            });

            //选人控件单独绑定


            //有子表时，dataField会一致
            //if (!this.contains(dataField)) {
                this.controls.push(filterCtrl);
             //}

            if (tmpcontrols) {
                tmpcontrols.push(filterCtrl);
            }
        }
    },
    contains: function (datafield) {
        var result = false;
        $.each(this.controls, function (index, obj) {
            if ($(obj).attr("data-datafield") == datafield) result = true;
        });
        return result;
    },
    setDisplay: function (control, display) {
        if (display) {
            control.removeClass("hidden");
            if (control.next().length > 0 &&
                control.next().attr("for") && control.next().attr("for") == control.attr("id")) {
                control.next().removeClass("hidden");
            }
        }
        else {
            control.addClass("hidden");
            if (control.next().length > 0 &&
                control.next().attr("for") && control.next().attr("for") == control.attr("id")) {
                control.next().addClass("hidden");
            }
        }
    },
    selectChanged: function (obj, eventExpress) {
        //if (obj.prop('tagName') == "SPAN") return;
        var fieldArray = eventExpress.split("{");
        var dataField;
        var isCount = false;
        var rule = fieldArray[0];
        var v;
        var reg = new RegExp("^-?[0-9]+(\.[0-9]+)?$");
         for (var i = 1; i < fieldArray.length; i++) {
             var index = fieldArray[i].indexOf("}");
             if (index == -1) {
                 alert(_Sheet_Display_GlobalString.Sheet_Display_Msg0 + eventExpress); return;
             }

             dataField = fieldArray[i].substring(0, index).replace(/"/g, "'");
             var curVal = '';
             if (_v)
             {
                 rule = "'" + _v + "'";
             }
             else
             {
                 curVal = this.sheet.getDataFieldValue(obj, dataField);
                 //兼容数值间的比较,字符串比较（'2'>'11'）会为true
                 if (curVal!=""&&reg.test(curVal)) {
                     rule += curVal;
                 } else {
                     rule += "'" + curVal + "'";
                 }
             }
                 
              rule += fieldArray[i].substring(index + 1).replace(/"/g, "'");
         }
        v = this.sheet.getResultValue(rule);// eval(rule); 
        var IsMobile = "";
        var g = new RegExp("(^|&)IsMobile=([^&]*)(&|$)", 'i');
        var r = top.window.location.search.substr(1).match(g);
        if (r != null) IsMobile = unescape(r[2]);
        if (IsMobile) {
            if (v) {
                //移动端一层一整行
                var detail = obj.parent().parent();
                if (detail.is("div.item")) this.setDisplay(detail, true);//展示detail包括事件
                // 初步验证，不存在DataField，表示不是默认表单控件，不再获取上级节点
                if (!obj.attr("data-DataField")) {
                    this.setDisplay(obj, true);//.show();
                } else if (obj.attr("class").indexOf("SheetGridView") > -1) {
                    this.setDisplay(obj, true);//.show();
                } else {
                    var row = obj.parent().parent();
                    if (row.is("div.row")) this.setDisplay(row, true);//.show();
                    var selectShow = false;
                    if (obj.attr("data-type") == "SheetDropDownList") {
                        if ($.MvcSheetUI.QueryString("Mode") == "View") {
                            selectShow = true;
                        }
                        else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                            //如果是不可编辑，不需要显示下拉框
                            if (obj.next().is("label")) {
                                selectShow = true;
                            }
                        }
                        else {
                            this.setDisplay(obj.parent().find(".select2-container"), true);//.show();
                        }
                    }
                    //文本框
                    if (obj.attr("data-type") == "SheetTextBox") {
                        if ($.MvcSheetUI.QueryString("Mode") == "View") {
                            selectShow = true;
                        }
                        else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                            //如果是不可编辑，不需要显示下拉框
                            if (obj.next().is("label")) {
                                selectShow = true;
                            }
                        }
                    }
                    //富文本框
                    if (obj.attr("data-type") == "SheetRichTextBox") {
                        if ($.MvcSheetUI.QueryString("Mode") == "View") {
                            selectShow = true;
                        }
                        else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                            //如果是不可编辑，不需要显示文本框
                            if (obj.parent().find("div.SheetRichTextBox").length > 0) {
                                selectShow = true;
                            }
                        }
                    }
                    if (!selectShow) {
                        if (obj.attr("data-type") == "SheetLabel") {
                            this.setDisplay(obj, true);
                        }
                        if (obj.attr("data-type") == "SheetUser") {
                            this.setDisplay(row, true);
                        }
                        this.setDisplay(obj.parent(), true);//.show();
                    }
                    if (obj.attr("data-type") == "SheetAttachment") {
                        var that = this;
                        row.prev().each(function () {
                            if ($(this).attr("class").indexOf("hidden") == -1)
                                that.setDisplay($(this), true);//.hide();
                            else
                                that.setDisplay($(this), true);//.show();
                        })
                    }
                }
            }
            else {
                // 初步验证，不存在DataField，表示不是默认表单控件，不再获取上级节点
                if (!obj.attr("data-DataField")) {
                    this.setDisplay(obj, false);//.hide();
                } else if (obj.attr("class").indexOf("SheetGridView") > -1) {
                    this.setDisplay(obj, false);//.hide();
                } else {
                    if (obj.attr("data-type") == "SheetDropDownList") {
                        this.setDisplay(obj.parent().find(".select2-container"), false);//.hide();
                    } else if (obj.attr("data-type") == "SheetLabel") {
                        this.setDisplay(obj, false);//.hide();
                    } else {
                        this.setDisplay(obj.parent(), false);//.hide();
                    }
                    var row = obj.parent().parent();
                    var hasControl = false;
                    if (obj.attr("data-type") == "SheetUser") {
                        this.setDisplay(row, false);//.hide();
                    } else if (obj.attr("data-type") != "SheetAttachment") {
                        row.find("label,span,input,select,textarea").each(function () {
                            if (this.style.display != "none") hasControl = true;
                        });
                        if (!hasControl) {
                            if (obj.attr("data-type") == "SheetDropDownList") {
                                this.setDisplay(obj.parent().find(".select2-container"), false);//.hide();
                            }
                            this.setDisplay(row.parent(), false);//.hide();
                        }
                    } else {
                        var that = this;
                        row.prev().each(function () {
                            if ($(this).attr("class").indexOf("hidden") == -1) {
                                that.setDisplay($(this), false);//.hide();
                            }
                        })
                    }
                }
                //移动端隐藏一整行
                var detail = obj.parent().parent();
                if (detail.is("div.item")) this.setDisplay(detail, false);//展示detail包括事件
            }
        } else {
            if (v) {
                var row = obj.parent().parent();
                if (row.is("div.row")) this.setDisplay(row, true);//.show();
                var selectShow = false;
                if (obj.attr("data-type") == "SheetDropDownList") {
                    if ($.MvcSheetUI.QueryString("Mode") == "View") {
                        selectShow = true;
                    }
                    else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                        //如果是不可编辑，不需要显示下拉框
                        if (obj.next().is("label")) {
                            selectShow = true;
                        }
                    }
                    else {
                        this.setDisplay(obj.parent().find(".select2-container"), true);//.show();
                    }
                }
                //文本框
                if (obj.attr("data-type") == "SheetTextBox") {
                    if ($.MvcSheetUI.QueryString("Mode") == "View") {
                        selectShow = true;
                    }
                    else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                        //如果是不可编辑，不需要显示下拉框
                        if (obj.next().is("label")) {
                            selectShow = true;
                        }
                    }
                }
                //富文本框
                if (obj.attr("data-type") == "SheetRichTextBox") {
                    if ($.MvcSheetUI.QueryString("Mode") == "View") {
                        selectShow = true;
                    }
                    else if ($.MvcSheetUI.QueryString("Mode") == "Work") {
                        //如果是不可编辑，不需要显示文本框
                        if (obj.parent().find("div.SheetRichTextBox").length > 0) {
                            selectShow = true;
                        }
                    }
                }
                if (!selectShow)
                {
                    if (obj.attr("data-popupwindow") == "PopupWindow" || obj.parent().find("label.InvalidText").length) {
                        this.setDisplay(obj.parent().find("label.InvalidText"), true);
                        this.setDisplay(obj.parent().find("a.popLink"), true);
                    }
                    this.setDisplay(obj, true);//.show();
                }
                    
            }
            else {
                if (obj.attr("data-type") == "SheetDropDownList") {
                    this.setDisplay(obj.parent().find(".select2-container"), false);//.hide();
                }
                if (obj.attr("data-popupwindow") == "PopupWindow" || obj.parent().find("label.InvalidText").length) {
                    this.setDisplay(obj.parent().find("label.InvalidText"), false);
                    this.setDisplay(obj.parent().find("a.popLink"), false);
                }
                this.setDisplay(obj, false);//.hide();
                var row = obj.parent().parent();
                var hasControl = false;
                row.find("label,span,input,select,textarea").each(function () {
                    if (this.style.display != "none") hasControl = true;
                });
                if (!hasControl) {
                    if (obj.attr("data-type") == "SheetDropDownList") {
                        this.setDisplay(obj.parent().find(".select2-container"), false);//.hide();
                    }
                    this.setDisplay(row, false);//.hide();
                }
            }
        }
    }
}