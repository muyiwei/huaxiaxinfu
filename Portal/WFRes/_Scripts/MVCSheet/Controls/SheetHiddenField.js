// SheetHiddenField控件

; (function ($) {
    //控件执行
    $.fn.SheetHiddenField = function () {
        return $.MvcSheetUI.Run.call(this, "SheetHiddenField", arguments);
    };

    $.MvcSheetUI.Controls.SheetHiddenField = function (element, options, sheetInfo) {
        $.MvcSheetUI.Controls.SheetHiddenField.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MvcSheetUI.Controls.SheetHiddenField.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            var $element = $(this.Element);
            var hiddenFields = $.MvcSheetUI.SheetInfo.HiddenFields;
            if (hiddenFields) {
                for (var key in hiddenFields) {
                    if ($element.attr("id") == key) {
                        $element.val(hiddenFields[key]);
                        break;
                    }
                }
            }
        },
        // 返回数据值,该值需要和其他的区别处理
        SaveDataField: function () {
            var $element = $(this.Element);
            var hiddenFields = $.MvcSheetUI.SheetInfo.HiddenFields;
            if (!hiddenFields || !hiddenFields[$element.attr("id")]) {
                $.MvcSheetUI.HiddenFields[$element.attr("id")] = $element.val();
            }
            else if (hiddenFields[$element.attr("id")] != $element.val()) {
                $.MvcSheetUI.HiddenFields[$element.attr("id")] = $element.val();
            }
            return {};
        }
    });
})(jQuery);