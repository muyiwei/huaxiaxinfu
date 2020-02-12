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
            if (!this.Visible ) {
                $(this.Element).hide(); return;
            }

            if (!this.Value) {
                this.Value = "--";
            }
            this.$Input = $("<Label name='" + this.DataField + "'>");//.attr("name", this.DataField);//.text(this.Value);
            if (this.Value) {
                //修改时间，在新增模式下 显示"系统自动生成"字样
                if (this.ResponseContext.IsCreateMode && this.DataField == "ModifiedTime") {
                    this.$Input.text("系统自动生成");
                    this.$Input.css({ "color": "#808080", "font-style": "italic" });
                } else {
                    if (this.Value.indexOf("/Date(") > -1) {
                        this.$Input.text(new Date(this.Value.replace(/-/g, "/")).Format("yyyy-mm-dd hh:ii"));
                    }
                    else {
                        this.$Input.text(this.Value);
                    }
                }
                
            }
            this.$InputBody.append(this.$Input);
        }
    });
})(jQuery);