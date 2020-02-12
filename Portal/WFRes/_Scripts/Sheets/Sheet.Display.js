/*
表单联动规则，由 SheetBizDropDownList 控件进行实现
Authine 2013-9
*/

var _Sheet_Display_GlobalString = { "Sheet_Display_Msg0": "显示规则设置错误：" };
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_Display_Msg0" }, function (data) {
//    if (data.IsSuccess) {
//        _Sheet_Display_GlobalString = data.TextObj;
//    }
//}, "json");

Sheet.Display = function (sheet) {
    this.name = "displayrule";
    this.sheet = sheet;
    this.init();
}

Sheet.Display.prototype = {
    init: function () {
        $("input,span,textarea,select").each(function (o) {
            var displayrule = $(this).attr(o.name);
            if (displayrule) {
                o.registerEvent(this.id, displayrule);
            }
        }, [this]);
    },
    // 注册计算事件主方法
    registerEvent: function (id, eventExpress) {
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
                alert(_Sheet_Display_GlobalString.Sheet_Display_Msg0 + eventExpress); return;
            }

            dataField = fieldArray[i].substring(0, index);
            rule += "'" + this.sheet.getDataFieldValue(obj, dataField) + "'";
            rule += fieldArray[i].substring(index + 1);
        }

        var v = this.sheet.getResultValue(rule);// eval(rule);
        if (v) {
            var row = obj.parent().parent();
            if (row.is("tr")) row.show();
            obj.show();
        }
        else {
            obj.hide();
            var row = obj.parent().parent();
            var hasControl = false;
            row.find("span,input,select,textarea").each(function () {
                if ($(this).is(":visible")) hasControl = true;
            });
            if (!hasControl) row.hide();
        }
    }
}