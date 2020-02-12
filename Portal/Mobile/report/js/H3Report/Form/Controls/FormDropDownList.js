// FormDropDownList控件
; (function ($) {
    //控件执行
    $.fn.FormDropDownList = function () {
        return $.ControlManager.Run.call(this, "FormDropDownList", arguments);
    };

    // 构造函数
    $.Controls.FormDropDownList = function (element, options, sheetInfo) {
        $.Controls.FormDropDownList.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormDropDownList.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            this.OptionValues = {};

            //渲染前端
            this.HtmlRender();

            //绑定事件
            this.BindEvent();

            //初始化默认值
            this.InitValue();

            //不可用
            if (!this.Editable) {
                this.SetReadonly(true);
            }
        },

        //渲染前端
        HtmlRender: function () {
            if (!this.Editable) {
                this.$Input = $("<pre style='border:none;'>");
                $(this.$InputBody).append(this.$Input);
            }
            else {
                this.$Input = $("<select class='form-control form-group-margin'><option  value=''>--请选择--</option></select>");
                if (this.DataDictItemName) {
                    if (this.DataDictItemValue && $.isArray(this.DataDictItemValue)) {
                        var options = this.DataDictItemValue;
                        for (var i = 0, len = options.length; i < len; i++) {
                            this.AddItem(options[i])
                        }
                    }
                }
                else {
                    if (!$.isEmptyObject(this.DefaultItems)) {
                        for (var i = 0; i < this.DefaultItems.length; i++) {
                            if (this.DefaultItems[i]) {
                                this.AddItem(this.DefaultItems[i])
                            }
                        }
                    }
                }
                $(this.$InputBody).append(this.$Input);
            }
        },

        //绑定事件
        BindEvent: function () {
            $(this.$Input).unbind("change.FormDropDownList").bind("change.FormDropDownList", this, function (e) {
                var that = e.data;
                that.OnChange.apply(that);
                that.Validate.apply(that);

                that.Required && (this.value && $(this).removeAttr("style").siblings(".dropdownlist").css({ "outline": "none", "box-shadow": "none" }));
            });
        },

        //设置默认值
        InitValue: function () {
            var item = "";
            if (this.Value == void 0) {
                item = this.DefaultValue;
            } else {
                item = this.Value;
            }
            //var item = this.Value || this.DefaultValue;
            if (item != void 0) {
                if (!this.Editable) {
                    this.$Input.text(item);
                }
                else {
                    this.$Input.val(item);
                }
            }
        },

        //校验
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && $.isEmptyObject(val)) {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldresult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldresult) {
                return {};
            }
            if (oldresult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        },

        GetValue: function () {
            var val = "";
            if (!this.Editable) {
                if (this.$Input) {
                    val = this.$Input.text();
                }
            }
            else {
                if (this.$Input)
                    val = this.$Input.val();
            }
            return val;
        },

        GetText: function () {
            if (!this.Editable) {
                return this.$Input.text();
            }
            else {
                return this.$Input.find(":checked").text();
            }
        },

        SetValue: function (value) {
            if (value == void 0) {
                if (!this.Editable) {
                    this.$Input.text('');
                } else {
                    this.$Input.val('');
                }
                return;
            }
            this.Value = value;
            if (!this.Editable) {
                if (this.Visible) {
                    if (this.OptionValues[value]) {
                        this.$Input.text(this.OptionValues[value]);
                    }
                    else {
                        this.$Input.text(value);
                    }
                }
            }
            else {
                this.$Input.val(value);
                this.$Input.change();
            }
            this.OnChange();
        },

        SetReadonly: function (flag) {
            if (flag) {
                this.$Input.prop("disabled", "disabled");
            }
            else {
                this.$Input.removeProp("disabled");
            }

        },


        ClearItems: function () {
            this.OptionValues = {};
            if (!this.Editable) {
                return this.$Input.text("");
            }
            else {
                return this.$Input.empty();
            }
        },

        AddItem: function (value, text) {
            if (value == null && text == null) return;

            var txt = "";
            if (text) {
                txt = text;
            } else {
                txt = value;
            }
            this.OptionValues[value] = txt;

            if (this.Editable) {
                this.$Input.append($("<option value='" + value + "'>" + txt + "</option>"));
            }
        }
    });
})(jQuery);