// RadioButtonList控件
; (function ($) {
    //控件执行
    $.fn.FormRadioButtonList = function () {
        return $.ControlManager.Run.call(this, "FormRadioButtonList", arguments);
    };

    // 构造函数
    $.Controls.FormRadioButtonList = function (element, ptions, sheetInfo) {
        $.Controls.FormRadioButtonList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormRadioButtonList.Inherit($.Controls.BaseControl, {
        Render: function () {
            //不可见返回
            if (!this.Visible) {
                $(this.Element).hide();
                return;
            }

            //渲染前端
            this.HtmlRender();

            this.BindEvent();

            //初始化默认值
            this.InitValue();
        },

        GetValue: function () {
            var value = "";
            if (!this.Editable) {
                //value = this.$Input.html();
                if (this.$Input) {
                    value = this.$Input.html();
                }
            }
            else {
                $(this.Element).find("input").each(function () {
                    if (this.checked)
                        value = $(this).val();
                });
            }
            return value;
        },

        //设置控件的值
        SetValue: function (value) {
            if (value == void 0) {
                return;
            }

            if (!this.Editable) {
                this.$Input.html(value);
                return;
            }
            //先清除所有勾选
            $(this.Element).find("input").prop("checked", false);

            var items = value;
            if (!$.isArray(items)) {
                items = value.split(';');
            }
            //var items = value.split(';');
            if (items != void 0) {
                for (var i = 0; i < items.length; i++) {
                    $(this.Element).find("input").each(function () {
                        if (this.value == items[i])
                            //$(this).attr("checked", "checked");
                            $(this).prop("checked", true);
                    });
                }
            }
            this.OnChange();
        },

        GetText: function () {
            return $(this.Element).find("input:checked").text();
        },

        SetReadonly: function (flag) {
            if (flag) {
                $(this.Element).find("input").prop("disabled", true);
            }
            else {
                $(this.Element).find("input").removeAttr("disabled");
            }
        },

        //设置一行显示数目
        SetColumns: function () {
            if (this.RepeatColumns && /^([1-9]\d*)$/.test(this.RepeatColumns)) {
                var width = (100 / this.RepeatColumns) + "%";
                var divs = $(this.Element).find("div"),
                    i;
                for (i = 0; i < divs.length; i++) {
                    $(divs[i]).css({ "width": width });
                }
            }
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldresult = this.ResponseContext.ReturnData[this.DataField];
            if (!oldresult) {
                return {};
            }

            if (oldresult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        },

        //设置默认值
        InitValue: function () {
            var item = "";
            //只有在新建表单时候设置DefaultValue
            if (this.Value == void 0) {
                item = this.DefaultValue;
            } else {
                item = this.Value
            }
            //var item = this.Value || this.DefaultValue;
            if (item != void 0) {
                item += '';
                this.SetValue(item);
            }
        },

        HtmlRender: function () {
            if (this.Editable) {
                $(this.Element).addClass("SheetRadioButtonList");
                //组标示
                this.GropName = this.DataField + "_" + $.IGuid();//设置统一的name                        

                this.$ListWrap = $("<div class='radiolistwrap'>").appendTo(this.$InputBody);
                if (this.DataDictItemName) {
                    if (this.DataDictItemValue && $.isArray(this.DataDictItemValue)) {
                        var options = this.DataDictItemValue;
                        for (var i = 0, len = options.length; i < len; i++) {
                            this.AddItem.apply(this, [options[i], options[i]]);
                        }
                    }
                }
                else {
                    if (!$.isEmptyObject(this.DefaultItems)) {
                        for (var i = 0; i < this.DefaultItems.length; i++) {
                            this.AddItem.apply(this, [this.DefaultItems[i], this.DefaultItems[i]]);
                        }
                    }
                }
            }
            else {
                this.$Input = $("<pre>").css("border", "none");
                this.$InputBody.append(this.$Input);
            }
        },

        //绑定事件
        BindEvent: function () {
            this.$InputBody.find("input").unbind("change.FormRadioButtonList").bind("change.FormRadioButtonList", this, function (e) {
                var that = e.data;
                that.OnChange.apply(that);
                that.Validate.apply(that);
                that.Required && ($(this).prop("checked") && that.$ListWrap.removeAttr("style"));
            });
        },

        //处理必填红色*号
        Validate: function () {
            var check = true;
            if (this.Editable && this.Required) {
                check = false;
                var inputs = $(this.$InputBody).find("input");
                for (var i = 0; i < inputs.length; i++) {
                    if ($(inputs[i]).is(":checked")) {
                        check = true;
                        break;
                    }
                }
                if (check) {
                    this.RemoveInvalidText(this.$InputBody.find("label:last"), "必填");
                }
                else {
                    this.AddInvalidText(this.$InputBody.find("label:last"), "必填");
                }
            }

            return check;
        },

        AddItem: function (value, text) {
            if (!this.Editable) {
                return;
            }
            if (text || value) {
                var option = "<div style='float:left;' GropName='" + this.GropName + "'>";
                var id = $.IGuid();
                option += "<input type='radio' name='" + this.GropName + "' id='" + id + "' value='" + value + "' ";
                if (!this.Editable) {//不可用
                    option += " disabled='disabled' ";
                }
                option += "/>";
                option += "<label for='" + id + "'>" + (text || value) + "</label>";
                option += "</div>";
                this.$ListWrap.append(option);

                //var option = $("<div style='float:left;' GropName='" + this.GropName + "'></div>");
                //var id = $.IGuid();
                //var radio = $("<input type='radio' />").attr("name", this.GropName).attr("id", id).text(text || value).val(value);
                ////var radio = $("<input type='radio' name='" + this.GropName + "' id='" + id + "' value='" + value + "'/>" + text || value + "</input>");
                //if (!this.Editable) {//不可用
                //    radio.prop("disabled", "disabled");
                //}
                //var span = $("<label for='" + id + "'>" + (text || value) + "</label>");
                //option.append(radio);
                //option.append(span);
                //this.$ListWrap.append(option);
            }
        },
        ClearItems: function () {
            this.$InputBody.empty();
        }
    });
})(jQuery);