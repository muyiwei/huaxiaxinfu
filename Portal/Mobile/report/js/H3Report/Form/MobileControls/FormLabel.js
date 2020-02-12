// Label控件
(function ($) {

    // 控件实例执行方式
    $.fn.FormLabel = function () {
        return $.ControlManager.Run.call(this, "FormLabel", arguments);
    };

    // 控件定义
    $.Controls.FormLabel = function (element, options, sheetInfo) {
        $.Controls.FormLabel.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承事件
    $.Controls.FormLabel.Inherit($.Controls.BaseControl, {
        Render: function () {
            var displayName = $(this.Element).attr('data-displayname');
            if (!this.Visible || (!this.Value && !displayName)) {
                $(this.Element).hide();
                return;
            }
            this.$Input = $("<Label>").attr("name", this.DataField);//.text(this.Value);
            if (this.Value) {
                this.$Input.text(this.Value);
            } else if (displayName != void 0) {
                this.$Input.text(displayName);
            }
            this.$InputBody.append(this.$Input);
            var $contnt = $(this.Element).find('div.ControlContent');
            if ($contnt.length > 0) {
                $contnt.addClass('readonly');
            }
        }
    });
})(jQuery);