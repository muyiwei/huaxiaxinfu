// Label控件
(function ($) {

    // 控件实例执行方式
    $.fn.SheetLabel = function () {
        return $.MvcSheetUI.Run.call(this, "SheetLabel", arguments);
    };

    // 控件定义
    $.MvcSheetUI.Controls.SheetLabel = function (element, options, sheetInfo) {
        $.MvcSheetUI.Controls.SheetLabel.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承事件
    $.MvcSheetUI.Controls.SheetLabel.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }
            //没有这个属性，宽度无效
            $(this.Element).css("display", "block")

            if (this.BindType.toLowerCase() == this.BindTypeEnum.OnlyData) {
                var val = this.V;

                var lbl = $(this.Element);
                if (val && (val = $.trim(val))) {
                    var strs = val.split("\n");
                    $(strs).each(function (i) {
                        if (i > 0) {
                            lbl.append("<br />");
                        }
                        lbl.text(this.toString());
                        //lbl.append($("<span></span>").text(this.toString()));
                    });
                }
                else {
                    lbl.text("");
                }
            }
            else if (!$(this.Element).text()) {
                $(this.Element).text(this.Text || this.N || "");
            }
            else if (!$(this.Element).text().trim()) {
                if (this.DataField) {
                    $(this.Element).text(this.DataField);
                }
            }
            // 绑定焦点事件
            if (this.OnClick) {
                $(this.Element).unbind("click.SheetLabel").bind("click.SheetLabel", [this], function (e) {
                    var that = e.data[0];
                    (new Function(that.OnClick)).apply(that.Element, arguments);
                });
            }
        },
        GetValue: function () {
            return $(this.Element).text() || this.DataField;
        },
        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable
                || this.BindType.toLowerCase() == this.BindTypeEnum.OnlyVisiable) return result;
            result[this.DataField] = $.MvcSheetUI.GetSheetDataItem(this.DataField);// this.DataItem;

            if (!result[this.DataField]) {
                if (this.DataField.indexOf(".") == -1) { alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField); }
                return {};
            }
            if (result[this.DataField].V != $(this.Element).html()) {
                result[this.DataField].V = $(this.Element).html();
                return result;
            }
            return {};
        }
    });
})(jQuery);