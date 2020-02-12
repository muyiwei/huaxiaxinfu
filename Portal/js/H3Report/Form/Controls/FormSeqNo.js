(function ($) {
    $.fn.FormSeqNo = function () {
        return $.ControlManager.Run.call(this, "FormSeqNo", arguments);
    };

    // 构造函数
    $.Controls.FormSeqNo = function (element, options, sheetInfo) {
        $.Controls.FormSeqNo.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormSeqNo.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            //渲染Html页面
            this.HtmlRender();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            if (this.ResponseContext.IsCreateMode) {
                this.SetValue("系统自动生成");
                this.$Input.css({ "color": "#808080", "font-style": "italic" });
            } else {
                if (this.Value) {
                    this.SetValue(this.Value);
                }
                this.$Input.css({ "color": "#000", "font-style": "normal" });
            }

            // 不可编辑
            this.SetReadonly(true);
        },

        //渲染html内容
        HtmlRender: function () {
            //if (!this.Editable) {
            this.$Input = $("<pre style='border:none'>");//.css("border", "none");
            //} else {
            //   this.$Input = $("<input  type='text'>").attr("name", this.DataField).addClass("form-control").attr("maxlength", 50).css({ "border": "none", "background-color": "#fff" });//.width(this.Width)
            //}
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
            $(this.$Input).unbind("keyup.FromTextBox").bind("keyup.FromTextBox", this, function (e) {
                var that = e.data;
                that.ValChange();
            });
        },

        //值改变
        ValChange: function () {
            this.OnChange();
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            this.Value = v.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            //this.$Input.val(this.Value);
            this.$Input.html(this.Value);
            this.OnChange();
        },

        GetValue: function () {
            if (!this.Editable) {
                return this.Value;
            }
            else {
                return this.$Input.val().trim();
            }
        },

        GetText: function () {
            return this.GetValue();
        },

        //设置只读
        SetReadonly: function (v) {
            if (v) {
                this.$Input.prop("readonly", "readonly");
            }
            else {
                this.$Input.removeProp("readonly");
            }
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            //if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && val != null && val.trim() == "") {

                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            if (!$.isEmptyObject(val)) {
                if (!this.IsMultiple) {
                    //200字符长度
                    if (val.trim().length > 200) {
                        this.AddInvalidText(this.$Input, '字符长度超出限制200个字');
                        return false;
                    }
                } else {
                    if (val.trim().length > 2000) {
                        this.AddInvalidText(this.$Input, '字符长度超出限制2000个字');
                        return false;
                    }
                }
            }
            if (!$.isEmptyObject(val) && this.Expression && !this.Expression.test(val)) {
                this.AddInvalidText(this.$Input, this.ErrorAlert);
                return false;
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            return {};
        }
    });
})(jQuery);