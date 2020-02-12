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
            this.IsInGridView = !$.isEmptyObject(this.ObjectId);

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

            if ($.isNumeric(this.Value)) {
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
                this.$Input = $("<pre style='border:none;'>");
            }
            else {
                this.$Input = $("<input type='text' name = '" + this.DataField + "' class='form-control'>");
            }
            this.$InputBody.append(this.$Input);
        },

        ModeRender: function () {
            this.Expression = /^-{0,1}[0-9]+\.{0,1}[0-9]*$/;
            this.ErrorAlert = "请输入数字!";
        },

        //绑定事件
        BindEvent: function () {
            //$(this.$Input).unbind("keypress.FormNumber").bind("keypress.FormNumber", this, function (event) {
            //    //var that = event.data;
            //    //var eventObj = event || e;
            //    //var keyCode = eventObj.keyCode || eventObj.which;
            //    //return keyCode >= 48 && keyCode <= 57 || keyCode == 46;
            //});

            this.$Input.off("change.FormNumber").on("change.FormNumber", this, function (event) {
                var $this = $(this);
                var that = event.data;
                that.ValChange.apply(that);
                that.Required && ($this.val() != "" && $this.removeAttr("style"));
            });
            //值改变的时候触发事件，快速响应change事件。主要在有计算情况下
            this.$Input.off("input.SheetTextBox propertyChange.SheetTextBox").on("input.SheetTextBox propertyChange.SheetTextBox", this, function (event) {
                var that = event.data;
                //that.ValChange.apply(that);
                that.OnChange();
                //that.Validate();
            });
        },

        //值改变
        ValChange: function () {
            var vStr = this.GetValue();
            if ($.isNumeric(vStr)) {
                vStr += '';
                if (vStr.indexOf(".") > -1) {
                    if (vStr.split('.')[0].length > this.IntegerMaxLength) {
                        vStr = vStr.split('.')[0].substring(0, this.IntegerMaxLength) + vStr.split('.')[1];
                    }
                }
                else if (vStr.length > this.IntegerMaxLength) {
                    vStr = vStr.substring(0, this.IntegerMaxLength);
                }

                if ($.isNumeric(this.DecimalPlaces)) {
                    var v = parseFloat(vStr).toFixed(this.DecimalPlaces);
                    //$(this.$Input).val(v);
                    if (this.ShowMode == this.NumberMode.Kbit)
                        v = $.IToKbit(v);
                    this.$Input.val(v);
                }
            }
            else {
                //$(this.$Input).val("");
                this.$Input.val("");
            }
            this.OnChange();
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (v == null) return;
            if (v === "" && this.GetValue() === "") return;
            if (this.GetValue() != "" && this.GetValue() == v) return;
            if (!$.isNumeric(v)) {
                v = "";
            }

            if (!this.Visible) {
                this.Value = v;
                return;
            }

            if (!this.Editable) {
                if ($.isNumeric(this.DecimalPlaces) && v != "") {
                    v = parseFloat(v).toFixed(this.DecimalPlaces);
                }
                if (this.ShowMode == this.NumberMode.Kbit)
                    v = $.IToKbit(v);
                this.$Input.text(v);
            }
            else {
                if (this.ShowMode == this.NumberMode.Kbit)
                    v = $.IToKbit(v);
                $(this.$Input).val(v);
            }
            this.ValChange();
        },

        //设置placeholder add:20160408
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString();//.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },

        GetText: function () {
            return this.GetValue() + "";
        },

        GetValue: function () {
            if (!this.Visible) {
                if (this.Value == null/* || isNaN(this.Value)*/) {
                    return "";
                } else if (isNaN(this.Value)) {
                    if (this.ShowMode == 0) {
                        var val = this.Value.replace(/,/gi, '');
                        if (isNaN(val))
                            return "";
                        else
                            return val;
                    }
                    return "";
                }
                return this.Value;
            }
            if (!this.Editable) {
                //预防显示规则冲突
                if (this.$Input != null) {
                    var val = this.$Input.text();
                    if (this.ShowMode == this.NumberMode.Kbit)
                        val = val.replace(/,/gi, '');
                    return val;
                }
                return "";
            }
            else {
                if (this.$Input != null) {
                    var val = this.$Input.val();
                    if (this.ShowMode == this.NumberMode.Kbit)
                        val = val.replace(/,/gi, '');
                    return val;
                }
                return "";
            }
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
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && val.trim() == "") {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            val += '';
            if (val.trim() != "" && this.Expression && !this.Expression.test(val)) {
                this.AddInvalidText(this.$Input, this.ErrorAlert);
                return false;
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {
            };
            if (this.ComputationRule == null && !this.Visible) return result;
            var oldresult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldresult) {
                return {
                };
            }

            if (("" + oldresult.Value) != this.GetValue()) {
                if (this.GetValue() == null) {
                    result[this.DataField] = "";
                } else {
                    var getValueResult = this.GetValue() + "";
                    result[this.DataField] = getValueResult.trim();
                }
                return result;
            }

            return {
            };
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