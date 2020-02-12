(function ($) {
    $.fn.FormButton = function () {
        return $.ControlManager.Run.call(this, "FormButton", arguments);
    };

    // 构造函数
    $.Controls.FormButton = function (element, options, sheetInfo) {
        $.Controls.FormButton.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormButton.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            this.Action = this.DataField;
            //渲染Html页面
            this.HtmlRender();

            //绑定事件
            this.BindEvent();
        },
        //渲染html内容
        HtmlRender: function () {
            this.$Input = $("<button class=\"btn btn-default btn-block\">").attr("name", this.DataField).addClass("form-control").text(this.DisplayName);
            this.$InputBody.append(this.$Input);
        },
        //绑定事件
        BindEvent: function () {
            $(this.$Input).unbind("click.FormButton").bind("click.FormButton", this, function (e) {
                var that = e.data;
                $.SmartForm.OnAction(that);
                return false;
            });
        }
    });
})(jQuery);