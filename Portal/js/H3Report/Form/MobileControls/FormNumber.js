(function ($) {
    $.fn.FormNumber = function () {
        return $.ControlManager.Run.call(this, "FormNumber", arguments);
    };


    // 构造函数
    $.Controls.FormNumber = function (element, options, sheetInfo) {
        $.Controls.FormNumber.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormNumber.Inherit($.Controls.BaseControl, {
        NumberMode: {
            Normal: 0,
            Kbit: 1
        },
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            //是否在子表里面
            this.IsInGridView = (this.ObjectId != null && this.ObjectId != "");
            //整数最大长度，超过21位的话，就会变成科学计数法
            this.IntegerMaxLength = 15;
            //小数最大长度，超过5位的话，就会变成科学计数法
            this.DecimalMaxLength = 5;

            //渲染Html页面
            this.HtmlRender();
            //渲染校验模式
            this.ModeRender();
            //绑定事件
            this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            this.SetValue(this.Value);
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
            if (this.Required) {
                this.$Input = $("<input type='text' name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + '(必填)' + "'>");
            } else {
                this.$Input = $("<input type='text' name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + "'>");
                if (!this.Editable) {
                    this.$Input.removeAttr('placeholder');
                }
            }
            this.$InputBody.append(this.$Input);
        },

        ModeRender: function () {
            this.Expression = /^-{0,1}[0-9]+\.{0,1}[0-9]*$/;
            this.ErrorAlert = "请输入数字!";
        },

        //绑定事件
        BindEvent: function () {
            //$(this.$Input).unbind("keyup.SheetTextBox blur.SheetTextBox").bind("keyup.SheetTextBox blur.SheetTextBox", this, function (e) {
            this.$Input.unbind("input.SheetTextBox propertyChange.SheetTextBox").bind("input.SheetTextBox propertyChange.SheetTextBox", this, function (e) {
                var that = e.data;
                var v = that.$Input.val();
                //考虑到千分位问题，取消type=“number”，要兼容负数情况
                v = v.replace(/,/gi, '');
                if (v != "" && v != "-" && !$.isNumeric(v)) {
                    that.$Input.val("");
                    that.AddInvalidText(that.$Input, that.ErrorAlert);
                }
                else {
                    that.RemoveInvalidText();
                }
                //移动端如果配置了计算规则不会实时触发

                //that.ValChange.apply(that);
                that.TimeOut && window.clearTimeout(that.TimeOut);
                that.TimeOut = setTimeout(function () {
                    that.ValChange.apply(that);
                }, 1000);
            });
            this.$Input.unbind("blur.SheetTextBox").bind("blur.SheetTextBox", this, function (e) {
                var that = e.data;
                var v = that.$Input.val();
                if (v != "") {
                    if (!$.isNumeric(v)) {
                        if (that.ShowMode == that.NumberMode.Kbit) {
                            v = v.replace(/,/gi, '');
                            if ($.isNumeric(v)) {
                                that.RemoveInvalidText();
                                v = $.IToKbit(v);
                                that.$Input.val(v);
                            } else {
                                that.$Input.val("");
                                that.AddInvalidText(that.$Input, that.ErrorAlert);
                            }
                        } else {
                            that.$Input.val("");
                            that.AddInvalidText(that.$Input, that.ErrorAlert);
                        }
                    }
                    else {
                        if ($.isNumeric(that.DecimalPlaces)) {
                            v = parseFloat(v).toFixed(that.DecimalPlaces);
                            that.$Input.val(v);
                        }
                        that.RemoveInvalidText();
                    }
                } else {
                    that.RemoveInvalidText();
                }
                that.ValChange.apply(that);
            });
        },

        //值改变
        ValChange: function () {
            var vStr = this.GetValue();
            if ($.isNumeric(vStr)) {
                if (vStr.indexOf(".") > -1) {
                    if (vStr.split('.')[0].length > this.IntegerMaxLength) {
                        vStr = vStr.split('.')[0].substring(0, this.IntegerMaxLength) + vStr.split('.')[1];
                    }
                }
                else if (vStr.length > this.IntegerMaxLength) {
                    vStr = vStr.substring(0, this.IntegerMaxLength);
                }
                //if ($.isNumeric(this.DecimalPlaces)) {
                //    var v = parseFloat(vStr).toFixed(this.DecimalPlaces);
                //    this.SetValue(v);
                //}
            }
            this.OnChange();
            //this.$Input.trigger("change");
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (v == null) return;
            if (v === "" && this.GetValue() === "") return;
            if (this.GetValue() != "" && (this.GetValue() == v || parseFloat(this.GetValue()) == parseFloat(v))) {
                if (this.ShowMode == this.NumberMode.Kbit) {
                    v = $.IToKbit(v);
                    this.$Input.val(v);
                }
                return;
            }
            if (!$.isNumeric(v)) {
                v = "";
            }
            if (!this.Visible) {
                this.Value = v;
                return;
            }
            if ($.isNumeric(this.DecimalPlaces)) {
                v = parseFloat(v).toFixed(this.DecimalPlaces);
            }
            if (this.ShowMode == this.NumberMode.Kbit)
                v = $.IToKbit(v);
            this.$Input.val(v);
            this.ValChange();
        },

        GetValue: function () {
            if (!this.Visible) {
                if (this.Value == null) {
                    return "";
                } else if (isNaN(this.Value)) {
                    if (this.ShowMode == that.NumberMode.Kbit) {
                        var val = this.Value.replace(/,/gi, '');
                        if (isNaN(val)) {
                            return "";
                        } else {
                            return val;
                        }
                    }
                    return "";
                }
                return this.Value;
            }

            //对手机端输入的Emoji表情符进行过滤
            if (this.$Input != null) {
                var v = this.$Input.val();
                v = v.replace(/[\uD800-\uDFFF]/g, '');
                if (this.ShowMode == this.NumberMode.Kbit) {
                    v = v.replace(/,/gi, '');
                }
                return v;
            }
            return "";

            //if (!this.Editable) {
            //    return this.$Input.text();
            //}
            //else {
            //    //对手机端输入的Emoji表情符进行过滤
            //    var v = $(this.$Input).val();
            //    return v.replace(/[\uD800-\uDFFF]/g, '');
            //}

        },
        //设置placeholder
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },
        Reset: function () {
            this.$Input.val('');
        },

        //设置只读
        SetReadonly: function (v) {
            if (v) {
                this.$Input.prop("readonly", "readonly").attr("type", "text");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                this.$Input.removeProp("readonly").attr("type", "number");
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

            //add by xc  解决小数点输入不方便问题
            var vStr = this.GetValue(), val;
            if ($.isNumeric(vStr)) {
                if (vStr.indexOf(".") > -1) {
                    if (vStr.split('.')[0].length > this.IntegerMaxLength) {
                        vStr = vStr.split('.')[0].substring(0, this.IntegerMaxLength) + vStr.split('.')[1];
                    }
                }
                else if (vStr.length > this.IntegerMaxLength) {
                    vStr = vStr.substring(0, this.IntegerMaxLength);
                }

                if ($.isNumeric(this.DecimalPlaces)) {
                    val = parseFloat(vStr).toFixed(this.DecimalPlaces);
                    this.SetValue(val);
                }
            }
            //end 

            //var val = this.GetValue();
            //if (val!=null && val!=void 0 && $.isNumeric(val) && !this.$Title.hasClass("has-input")) {
            //    this.$Title.addClass("has-input");
            //}
            //else if (!$.isNumeric(val)) {
            //    this.$Title.removeClass("has-input");
            //}

            if (this.Required && (val == undefined || val.trim() == "")) {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }

            if (this.Required && this.Expression && !this.Expression.test(val)) {
                this.AddInvalidText(this.$Input, this.ErrorAlert);
                return false;
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
                result[this.DataField] = this.GetValue() == null ? "" : this.GetValue().toString().trim();
                return result;
            }

            return {};
        },
        GetNum: function () {
            var v = this.GetValue();
            if ($.isNumeric(v)) {
                return parseFloat(v);
            }
            else {
                return 0.0;
            }
        }
    });

})(jQuery);