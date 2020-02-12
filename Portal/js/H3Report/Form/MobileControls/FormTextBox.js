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
            this.IsInGridView = (this.ObjectId != null && this.ObjectId != "");
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
            //新建的话如果有placeholder则显示
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
            if (this.Editable) {
                if (this.Required) {
                    this.$Input = $("<input type='text' name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + "(必填)" + "'>");
                } else {
                    this.$Input = $("<input type='text' name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + "'>");
                    if (!this.Editable) {
                        this.$Input.removeAttr('placeholder');
                    }
                }
            } else {
                $(this.Element).css("align-items", "flex-start");
                this.$Input = $('<div class="ta-readonly"></div>');
            }
            this.$InputBody.append(this.$Input);
            if (!this.IsCreateMode && (this.Mode == 'Mobile' || this.Mode == 'Telephone') && this.Value) {
                var mobileIconContainer = '<div class="phoneIcon" style="border-left:1px solid #e4e4e4;padding-left:12px;margin-left:12px">' +
                                                '<a href="tel:' + this.Value + '" style="' +
                                                    'width:20px;' +
                                                    'height:20px;' +
                                                    'line-height:20px;' +
                                                    'text-align:center;' +
                                                    'display:inline-block;' +
                                                    'color:#fff;transform:scale(0.8) rotate(180deg);' +
                                                    'cursor:pointer;background:url(../../../Content/Images/phone.svg) no-repeat;' +
                                                    'border:noone">' +
                                                '</a>' +
                                          '</div>'
                //var $mobileIconContainer = $('<div class="phoneIcon" style="border-left:1px solid #e4e4e4;padding-left:12px;margin-left:12px"></div>');

                //var $Icon = $('<a href="tel:' + this.Value + '">').css({
                //    "width": "20px",
                //    "height": "20px",
                //    "line-height": "20px",
                //    "text-align": "center",
                //    "display": "inline-block",
                //    "color": "#fff",
                //    "transform": "scale(0.8) rotate(180deg)",
                //    "cursor": "pointer",
                //    "background": "url(../../../Content/Images/phone.svg) no-repeat",
                //    "border": 'none'
                //});
                //$Icon.attr("href", "tel:" + this.Value);
                //$mobileIconContainer.append($Icon);
                this.$InputBody.addClass("RightArrow").append(mobileIconContainer);
            }
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
            //部分手机不支持keyup，所以添加了blur事件
            $(this.$Input).off("keyup.SheetTextBox blur.SheetTextBox").on("keyup.SheetTextBox blur.SheetTextBox", this, function (e) {
                var that = e.data;
                that.OnChange();
            });
        },

        //值改变
        ValChange: function () {
            this.Validate();
        },
        //设置PlaceHolder
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },

        //设置值
        SetValue: function (v) {
            if (v == null) return;
            v = (v + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            this.Value = v;
            if (this.$Input == void 0) return;
            if (!this.Editable) {
                this.$Input.html(v);
            }
            else {
                this.$Input.val(v);
            }
            this.ValChange();
        },

        GetValue: function () {
            if (!this.Editable) {
                var v = this.Value;
                return v == null ? "" : v;
            }
            else {
                //对手机端输入的Emoji表情符进行过滤
                var v = "";
                if (this.$Input != void 0)
                    v = this.$Input.val().trim();
                return v.replace(/[\uD800-\uDFFF]/g, '');
            }
        },

        Reset: function () {
            this.$Input.val('');
        },

        //设置只读
        SetReadonly: function (v) {
            if (v) {
                this.$Input.prop("readonly", "readonly");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
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
                    if (this.Mode) {
                        var exp1 = '';
                        var exp2 = '';
                        var err = '';
                        switch (this.Mode) {
                            case "Email":
                                exp1 = /^\w+([-+.]\w+)*@\w+([-+.]\w+)*\.\w+([-.]\w+)*$/;
                                err = "邮箱格式错误!";
                                break;
                            case "Mobile":
                            case "Telephone":
                                exp1 = /^1[3-8]\d{9}$/;
                                exp2 = /^(0\d{2,3}-)?\d{7,8}(-\d{1,4})?$/;
                                err = "电话或手机号码格式错误!";
                                break;
                            case "Card":
                                exp1 = /^\d{15}(\d{2}[A-Za-z0-9])?$/
                                err = "身份证格式错误!";
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
                                this.invalidText = err;
                                return false;
                            }
                        } else {
                            if (!isValid1) {
                                this.invalidText = err;
                                return false;
                            }
                        }
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
                    if (this.Mode) {
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
                                err = "错误的电话或手机号码格式!";
                                break;
                            case "Card":
                                exp1 = /^\d{15}(\d{2}[A-Za-z0-9])?$/
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
                        //电话要验证手机和固话，其他只需要验证一个
                        if (this.Mode == "Mobile" || this.Mode == "Telephone") {
                            if (!isValid1 && !isValid2) {
                                this.AddInvalidText(this.$Input, err);
                                return false;
                            }
                        } else {
                            if (!isValid1) {
                                this.AddInvalidText(this.$Input, err);
                                return false;
                            }
                        }
                    }
                }
            }
            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (this.ComputationRule == null && !this.Visible) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }

            if (("" + oldResult.Value) != this.GetValue()) {
                result[this.DataField] = this.GetValue().trim();
                return result;
            }

            return {};
        }
    });
})(jQuery);