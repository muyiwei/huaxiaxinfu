/*
表单联动规则，由 SheetBizDropDownList 控件进行实现
Authine 2013-9
*/

Sheet.Validate = function (sheet) {
    this.requiredValue = "data-requiredfield";
    this.AttrName = "data-vaildationrule";
    this.sheet = sheet;
    this.controls = [];

    this.init();
}

Sheet.Validate.prototype = {
    init: function () {
        // debugger;
        this.controls.length = 0;
        if (!this.sheet.container) {
            this.sheet.container = $("input[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],span[" + this.AttrName + "]");
        }
        else {
            this.sheet.container = $(this.sheet.container.context).find("input[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],span[" + this.AttrName + "]");
        }

        this.sheet.container.each(function (o) {
            // 子表模板中的不做处理
            if ($(this).closest("tr").length > 0 && $(this).closest("tr").hasClass("template")) return;
            var validaterule = $(this).attr(o.AttrName);
            if (validaterule) {
                o.registerEvent(this.id, validaterule);
            }
        }, [this]);

        $.each(this.controls, function (index, obj) {
            $(obj).change();
        });
    },
    //$.MvcSheetUI.MvcRuntime.Validate.Run($("div"));
    Run: function (newContainner) {
        var tmpcontrols = [];

        var container = newContainner.find("input[" + this.AttrName + "],textarea[" + this.AttrName + "],select[" + this.AttrName + "],div[" + this.AttrName + "],span[" + this.AttrName + "]");


        container.each(function (o) {
            // 子表模板中的不做处理
            if ($(this).closest("tr").length > 0 && $(this).closest("tr").hasClass("template")) return;
            var validaterule = $(this).attr(o.AttrName);
            if (validaterule) {
                o.registerEvent(this.id, validaterule, tmpcontrols);
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
                alert(_Sheet_Validate_GlobalString.Sheet_Validate_Msg0 + eventExpress); return;
            }

            dataField = fieldArray[i].substring(0, index);

            // 获取控件
            var filterCtrl = this.sheet.findControlByDataField($("#" + id), dataField);
            if (!filterCtrl) return;

            filterCtrl.unbind("change.Validate" + id).bind("change.Validate" + id, [this], function (e) {
                if ($("#" + id).length == 0) {
                    return;
                }
                // console.log(id)
                e.data[0].selectChanged($("#" + id), eventExpress);
            });

            if (!this.contains(dataField)) {
                this.controls.push(filterCtrl);
            }

            if (tmpcontrols) {
                tmpcontrols.push(filterCtrl);
            }


            // filterCtrl.change();
        }
    },
    contains: function (datafield) {
        var result = false;
        $.each(this.controls, function (index, obj) {
            if ($(obj).attr("data-datafield") == datafield) result = true;
        });
        return result;
    },
    selectChanged: function (obj, eventExpress) {
        //debugger
        var fieldArray = eventExpress.split("{");
        var dataField;
        var isCount = false;
        var rule = fieldArray[0];

        for (var i = 1; i < fieldArray.length; i++) {
            var index = fieldArray[i].indexOf("}");
            if (index == -1) {
                alert(_Sheet_Validate_GlobalString.Sheet_Validate_Msg0 + eventExpress); return;
            }

            dataField = fieldArray[i].substring(0, index);
            rule += "'" + this.sheet.getDataFieldValue(obj, dataField) + "'";
            rule += fieldArray[i].substring(index + 1);
        }
        var v = this.sheet.getResultValue(rule);

        var dataType = obj.attr("data-type");
        var dataType = obj.attr("data-type");
        var IsMobile = "";
        var g = new RegExp("(^|&)IsMobile=([^&]*)(&|$)", 'i');
        var r2 = top.window.location.search.substr(1).match(g);
        if (r2 != null) IsMobile = unescape(r2[2]);
        if (IsMobile) {
            var dataType = obj.attr("data-type");
            if (v) {
                if (dataType == "SheetDropDownList"
                    || dataType == "SheetCheckboxList"
                    || dataType == "SheetRadioButtonList"
                    || dataType == "SheetTextBox"
                    || dataType == "SheetRichTextBox") {
                    var manager = null;
                    switch (dataType) {
                        case "SheetDropDownList": manager = $(obj).SheetDropDownList(); break;
                        case "SheetCheckboxList": manager = $(obj).SheetCheckboxList(); break;
                        case "SheetRadioButtonList": manager = $(obj).SheetRadioButtonList(); break;
                        case "SheetTextBox": manager = $(obj).SheetTextBox(); obj.attr("data-Required", true); break;
                        case "SheetRichTextBox": manager = $(obj).SheetRichTextBox(); break;
                        default: break;
                    }
                    manager.Required = true;
                    manager.Validate();
                } else {
                    obj.parent().attr("data-Required", true);
                }
            }

            else {
                if (dataType == "SheetDropDownList"
                    || dataType == "SheetCheckboxList"
                    || dataType == "SheetRadioButtonList"
                    || dataType == "SheetTextBox" || dataType == "SheetRichTextBox") {
                    var manager = null;
                    switch (dataType) {
                        case "SheetDropDownList": manager = $(obj).SheetDropDownList(); break;
                        case "SheetCheckboxList": manager = $(obj).SheetCheckboxList(); break;
                        case "SheetRadioButtonList": manager = $(obj).SheetRadioButtonList(); break;
                        case "SheetTextBox":
                        case "SheetRichTextBox":
                            manager = $(obj).SheetTextBox();
                            obj.removeAttr("data-Required");
                            break;
                        default: break;
                    }
                    manager.Required = false;
                    manager.RemoveInvalidText(manager.Element);
                } else {
                    obj.parent().removeAttr("data-Required");
                    obj.parent().removeClass($.MvcSheetUI.Css.inputError);
                    var o = obj.parent().next();
                    if (o.hasClass("InvalidText")) o.remove();
                }
            }

        } else {
            if (v) {
                if (dataType == "SheetDropDownList"
                    || dataType == "SheetCheckboxList"
                    || dataType == "SheetRadioButtonList") {
                    var manager = null;
                    switch (dataType) {
                        case "SheetDropDownList": manager = $(obj).SheetDropDownList(); break;
                        case "SheetCheckboxList": manager = $(obj).SheetCheckboxList(); break;
                        case "SheetRadioButtonList": manager = $(obj).SheetRadioButtonList(); break;
                        default: break;
                    }
                    manager.Required = true;
                    manager.Validate();
                } else {
                    obj.attr("data-Required", true);
                    var manager = $(obj).SheetUIManager();
                    if (manager) {
                        manager.Required = true;
                    }
                }
            }
            else {
                if (dataType == "SheetDropDownList"
                    || dataType == "SheetCheckboxList"
                    || dataType == "SheetRadioButtonList") {
                    var manager = null;
                    switch (dataType) {
                        case "SheetDropDownList": manager = $(obj).SheetDropDownList(); break;
                        case "SheetCheckboxList": manager = $(obj).SheetCheckboxList(); break;
                        case "SheetRadioButtonList": manager = $(obj).SheetRadioButtonList(); break;
                        default: break;
                    }
                    manager.Required = false;
                    manager.RemoveInvalidText(manager.Element);
                } else {
                    obj.removeAttr("data-Required");
                    obj.removeClass($.MvcSheetUI.Css.inputError);
                    var o = obj.next();
                    if (o.hasClass("InvalidText")) o.remove();

                    var manager = $(obj).SheetUIManager();
                    if (manager) {
                        manager.Required = false;
                    }
                }
            }
        }
        obj.trigger("change");

    }

    // End
}