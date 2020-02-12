(function ($) {
    //$.fn.FormTextBox = function () {
    //    return $.MobileControlManager.Run.call(this, "FormTextBox", arguments);
    //};

    // 构造函数
    $.MobileControls.FormTextBox = function (element, options, sheetInfo) {
        $.MobileControls.FormTextBox.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormTextBox.Inherit($.MobileControls.BaseClass, {
        //控件渲染函数
        Render: function () {
            //是否可见

            //渲染Html页面
            this.HtmlRender();
            //渲染模式
            this.ModeRender();
            //渲染校验模式
            //this.BindEvent();

            if (this.Value) {
                this.SetValue(this.Value);
            }
            //新建的话如果有placeholder则显示
            if (this.PlaceHolder) {
                this.SetPlaceHolder(this.PlaceHolder);
            }
        },

        //渲染html内容
        HtmlRender: function () {
            this.$Input = $("<input type='text'>").attr("name", this.DataField);          
            this.$InputBody.append(this.$Input);
        },

        //渲染模式：邮件、电话、身份证
        ModeRender: function () {
            switch (this.Mode) {
                case "Email":
                    this.Expression = /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$/;
                    this.ErrorAlert = "错误的邮箱格式!";
                    break;
                case "Mobile":
                    this.Expression = /^1[3-8]\d{9}$/;
                    this.ErrorAlert = "错误的手机格式!";
                    break;
                case "Telephone":
                    this.Expression = /^(0\d{2,3}-)?\d{7,8}(-\d{1,4})?$/;
                    this.ErrorAlert = "错误的电话格式!";
                    break;
                case "Card":
                    this.Expression = /^\d{15}(\d{2}[A-Za-z0-9])?$/
                    this.ErrorAlert = "错误的身份证格式!";
                    break;
            }

        },

        //绑定事件
        BindEvent: function () {
            $(this.$Input).unbind("keyup.FormTextBox").bind("keyup.FormTextBox", this, function (e) {
                var that = e.data;
                that.OnChange();
            });
        },

        //值改变
        ValChange: function () {
            //this.Validate();
        },
       
        //设置值
        SetValue: function (v) {
            $(this.$Input).val(v);
            //this.ValChange();
        },

        GetValue: function () {
            //对手机端输入的Emoji表情符进行过滤
            var v = $(this.$Input).val().trim();

            return v.replace(/[\uD800-\uDFFF]/g, '');
        },

        Reset: function () {
            $(this.$Input).val('');
        }      

    });
})(jQuery);