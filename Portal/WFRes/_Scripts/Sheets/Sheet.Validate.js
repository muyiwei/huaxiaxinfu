/*
表单联动规则，由 SheetBizDropDownList 控件进行实现
Authine 2013-9
*/

var _Sheet_Validate_GlobalString = { "Sheet_Validate_Msg0": "验证规则设置错误：" };
//获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_Validate_Msg0" }, function (data) {
//    if (data.IsSuccess) {
//        _Sheet_Validate_GlobalString = data.TextObj;
//    }
//}, "json");

Sheet.Validate = function (sheet) {
    this.requiredValue = "requiredfield";
    this.name = "vaildationrule";
    this.sheet = sheet;

    this.init();
}

Sheet.Validate.prototype = {
    init: function () {
        $("input,select,textarea,div").each(function (o) {
            var validaterule = $(this).attr(o.name);
            if (validaterule) {
                o.registerEvent(this.id, validaterule);
            }
        }, [this]);
    },
    // 注册计算事件主方法
    registerEvent: function (id, eventExpress) {
        debugger
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

            filterCtrl.unbind("change." + id).bind("change." + id, [this], function (e) {
                e.data[0].selectChanged($("#" + id), eventExpress);
            });

            filterCtrl.change();
        }
    },
    selectChanged: function (obj, eventExpress) {
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

        if (v) {
            if (!obj.attr("lang")) {
                obj.attr("lang", this.requiredValue);
            } else if (obj.attr("lang").indexOf(this.requiredValue) == -1) {
                obj.attr("lang", obj.attr("lang") + "," + this.requiredValue);
            }
        }
        else {
            var required = obj.attr("lang");
            if (required) {
                obj.attr("lang", required.replace(this.requiredValue, ""));
                obj.parent().find(".error").remove();
            }
        }
    }

    // End
}