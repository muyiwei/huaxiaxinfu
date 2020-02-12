//文本框(SheetTextBox/SheetBizTextBox/SheetTime)
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
            //渲染校验模式
            this.ModeRender();
            //绑定事件
            this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            if (this.Value) {
                this.SetValue(this.Value);
            }
            if (this.ResponseContext.IsCreateMode) {
                this.SetValue("系统自动生成");
                this.$Input.css({ "color": "#999", "font-style": "normal" });
            } else {
                this.$Input.css({ "color": "#999", "font-style": "normal" });
            }
            // 不可编辑
            this.SetReadonly(true);
        },

        //渲染html内容
        HtmlRender: function () {
            //if (this.IsMultiple) {
            //    if (this.Required) {
            //        this.$Input = $("<textarea>").attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName + '(必填)');
            //    } else {
            //        this.$Input = $("<textarea>").attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName);
            //        if ($.FormManager.ResponseContext != null && typeof ($.FormManager.ResponseContext) != "undefined" && !$.FormManager.ResponseContext.IsCreateMode) {
            //            this.$Input.removeAttr('placeholder');
            //        }
            //        if (!this.Editable) {
            //            this.$Input.removeAttr('placeholder');
            //        }
            //    }
            //}
            //else {
                //if (this.Required) {
                //    this.$Input = $("<input type='text'>").attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName + '(必填)');
                //} else {
                //    this.$Input = $("<input type='text'>").attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName);
                //    if ($.FormManager.ResponseContext != null && typeof ($.FormManager.ResponseContext) != "undefined" && !$.FormManager.ResponseContext.IsCreateMode) {
                //        this.$Input.removeAttr('placeholder');
                //    }
                //    if (!this.Editable) {
                //        this.$Input.removeAttr('placeholder');
                //    }
                //}
            //}
            this.$Input = $("<input type='text'>").attr("name", this.DataField).css({"border":"none","background-color":"#fff"});
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
            $(this.$Input).unbind("keyup.SheetTextBox").bind("keyup.SheetTextBox", this, function (e) {
                var that = e.data;
                //that.ValChange();
                that.OnChange();
                that.Validate();
            });
        },

        //值改变
        ValChange: function () {
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            $(this.$Input).val(v);
            this.ValChange();
        },

        GetValue: function () {
            if (!this.Editable) {
                return this.Value;
            }
            else {
                //对手机端输入的Emoji表情符进行过滤
                var v = $(this.$Input).val().trim();

                return v.replace(/[\uD800-\uDFFF]/g, '');
            }
        },

        Reset: function () {
            $(this.$Input).val('');
        },

        //设置只读
        SetReadonly: function (v) {
            if (v) {
                this.$Input.prop("readonly", "readonly");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }

                //if (this.IsMultiple) {
                //    var $pre = $("<pre>").html(v);
                //    $pre.after(this.$Input);
                //    this.$Input.height($pre.height());
                //}

                if (this.Mode == "Mobile") {
                    this.$Input.hide();
                    var val = this.$Input.val();
                    var $Tel = $('<a>').attr('href', 'tel:' + val).text('+' + val);
                    this.$Input.parent().append($Tel);
                }
            }

            else {
                this.$Input.removeProp("readonly");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            //if (this.Required && !$.isEmptyObject(val) && !this.$Title.hasClass("has-input")) {
            //    this.$Title.addClass("has-input");
            //}
            //else if ($.isEmptyObject(val)) {
            //    this.$Title.removeClass("has-input");
            //}

            if (this.Required) {
                if (val != null && val.trim() == "") {
                    this.AddInvalidText(this.$Input, "必填");
                    return false;
                } else {
                    //检验输入字符串长度
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
                    if (this.Expression && !this.Expression.test(val)) {
                        this.AddInvalidText(this.$Input, this.ErrorAlert);
                        return false;
                    }
                }

            } else {
                if (!$.isEmptyObject(val) && val.length > 0) {
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
                    if (this.Expression && !this.Expression.test(val)) {
                        this.AddInvalidText(this.$Input, this.ErrorAlert);
                        return false;
                    }
                }
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