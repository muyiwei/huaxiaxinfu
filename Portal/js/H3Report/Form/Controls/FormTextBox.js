//文本框(FormTextBox)
(function ($) {
    $.fn.FormTextBox = function () {
        return $.ControlManager.Run.call(this, "FormTextBox", arguments);
    };

    // 构造函数
    $.Controls.FormTextBox = function (element, options, sheetInfo) {
        $.Controls.FormTextBox.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormTextBox.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            //是否在子表里面
            //this.IsInGridView = !$.isEmptyObject(this.ObjectId);
            //渲染Html页面
            this.HtmlRender();
            //渲染校验模式
            //this.ModeRender();
            //绑定事件
            this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            if (this.Value) {
                this.SetValue(this.Value);
            }

            //设置placeholder
            if (this.PlaceHolder) {
                this.SetPlaceHolder(this.PlaceHolder);
            }
            // 不可编辑
            if (!this.Editable) {
                this.SetReadonly(true);
                return;
            }
        },

        //渲染html内容
        HtmlRender: function () {
            if (!this.Editable) {
                this.$Input = $('<pre style="border:none;white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;overflow:auto;word-break:break-all">');
            }
            else {
                this.$Input = $("<input type='text' name='" + this.DataField + "' class='form-control' maxlength='200'>");//.attr("name", this.DataField).addClass("form-control").attr("maxlength", 200);//.width(this.Width)
                if (this.IsMultiple) {
                    this.$Input = $("<textarea name='" + this.DataField + "' class='form-control' maxlength='2000'>");//.attr("name", this.DataField).addClass("form-control").attr("maxlength", 2000);//.width(this.Width)
                }
            }
            this.$InputBody.append(this.$Input);
        },

        //渲染模式：邮件、电话、身份证
        ModeRender: function () {
            switch (this.Mode) {
                case "Email":
                    this.Expression = /^\w+([-+.]\w+)*@\w+([-+.]\w+)*\.\w+([-.]\w+)*$/;
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
            $(this.$Input).off("blur.FormTextBox").on("blur.FormTextBox", this, function (e) {
                var $this = $(this);
                var that = e.data;
                that.ValChange();
                that.Required && ($this.val() != "" && $this.removeAttr("style"));
            });
        },

        //值改变
        ValChange: function () {
            this.OnChange();
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (v == null) return;
            if (!this.Editable) {
                this.Value = (v + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if (this.Visible)
                    this.$Input.html(this.Value);
            }
            else {
                this.$Input.val(v);
            }
            this.ValChange();
        },
        //设置placeholder Add:20160408
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString();//.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },

        GetValue: function () {
            if (!this.Editable) {
                var v = this.Value;
                return v == null ? "" : v;
            }
            else {
                if (this.$Input != void 0) {
                    return this.$Input.val().trim();
                } else {
                    return this.Value || '';
                }
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
            //不可编辑，不可编辑状态为什么还要校验？
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
            //if (!$.isEmptyObject(val) && this.Expression && !this.Expression.test(val)) {
            //    this.AddInvalidText(this.$Input, this.ErrorAlert);
            //    return false;
            //}
            //格式验证
            if (!$.isEmptyObject(val) && this.Mode) {
                var exp1 = '';
                var exp2 = '';
                var err = '';
                switch (this.Mode) {
                    case "Email":
                        exp1 = /^\w+([-+.]\w+)*@\w+([-+.]\w+)*\.\w+([-.]\w+)*$/;
                        err = "错误的邮箱格式!";
                        break;
                    case "Mobile":
                    case "Telephone":
                        exp1 = /^1[3-8]\d{9}$/;
                        exp2 = /^(0\d{2,3}-)?\d{7,8}(-\d{1,4})?$/;
                        //exp2 = /^[0-9-()（）]{7,18}$/;
                        err = "错误的电话或手机号码格式!";
                        break;
                    case "Card":
                        exp1 = /^\d{15}(\d{2}[X0-9])?$/
                        err = "错误的身份证格式!";
                        break;
                    default:
                }
                var isValid1 = true;
                var isValid2 = true;
                if (exp1) {
                    isValid1 = exp1.test(val);
                }
                if (exp2) {
                    isValid2 = exp2.test(val);
                }
                if (this.Mode == "Mobile" || this.Mode == "Telephone") {
                    if (!isValid1 && !isValid2) {
                        if (this.invalidText != err)
                            this.AddInvalidText(this.$Input, err);
                        return false;
                    }
                } else {
                    if (!isValid1) {
                        if (this.invalidText != err)
                            this.AddInvalidText(this.$Input, err);
                        return false;
                    }
                }
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {
            };
            var oldResult = {
            };
            if (this.ComputationRule == null && !this.Visible) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }

            if (("" + oldResult.Value) != this.GetValue()) {
                result[this.DataField] = this.GetValue().trim();
                return result;
            }

            return {
            };
        }
    });
})(jQuery);