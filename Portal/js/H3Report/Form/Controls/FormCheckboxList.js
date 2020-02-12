
//复选框

(function ($) {
    $.fn.FormCheckboxList = function () {
        return $.ControlManager.Run.call(this, "FormCheckboxList", arguments);
    };

    // 构造函数
    $.Controls.FormCheckboxList = function (element, ptions, sheetInfo) {
        $.Controls.FormCheckboxList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormCheckboxList.Inherit($.Controls.BaseControl, {
        Render: function () {
            if (!this.Visible) {
                $(this.Element).hide();
                return;
            }

            this.OptionValues = {};

            //渲染前端
            this.HtmlRender();
            //绑定事件
            this.BindEvent();
            //初始化默认值
            this.InitValue();
        },

        //获取值
        GetValue: function () {
            if (!this.Editable) {
                if (this.$Input) {
                    return this.$Input.html();
                } else {
                    return "";
                }
            }

            if (this.isCheckbox) { // 单选框
                return $(this.Element).find("input").prop("checked");
            }
            else { // 多选框
                var value = "";
                $(this.Element).find("input").each(function () {
                    if (this.checked) {
                        if (value == "") {
                            value += $(this).val()
                        }
                        else {
                            value += ";" + $(this).val();
                        }
                    }
                });
                return value;
            }
        },

        //设置控件的值
        SetValue: function (value) {
            if (value == void 0/* || value == ""*/) {
                return;
            }
            var displaytext = "";
            if (!this.Editable) {
                if (this.Visible) {
                    var items = value;
                    if (!$.isArray(items)) {
                        try { items = (value + "").split(';'); }
                        catch (e) {
                            alert(e)
                        }
                    }
                    if (items != void 0) {
                        for (var i = 0; i < items.length; i++) {

                            if (this.OptionValues[items[i]]) {
                                displaytext += this.OptionValues[items[i]] + ";";
                            }
                            else {
                                displaytext += items[i] + ";";
                            }

                        }
                    }
                }
                if (displaytext != "") {
                    displaytext = displaytext.slice(0, displaytext.length - 1);
                }
                if (this.$Input != undefined)
                    this.$Input.html(displaytext);

                return;
            }
            //先清除所有勾选
            $(this.Element).find("input").prop("checked", false);

            if (this.isCheckbox) {
                $(this.Element).find("input").prop("checked", value);
            }
            else {
                var items = value;
                if (!$.isArray(items)) {
                    try { items = (value + "").split(';'); }
                    catch (e) {
                        alert(e)
                    }

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
            }
            this.OnChange();
        },

        GetText: function () {
            var text = "";
            if (this.Editable) {
                $(this.Element).find("input").each(function () {
                    if (this.checked)
                        text += $(this).text() + ";";
                });
            }
            else {
                text = this.$Input.html();
            }
            return text;
        },

        SetReadonly: function (flag) {
            if (flag) {
                $(this.Element).find("input").attr("readonly", "readonly");
            }
            else {
                $(this.Element).find("input").removeAttr("readonly");
            }
        },

        InitValue: function () {
            //设置默认值
            if ((this.Value === true || this.Value === false)) {
                this.SetValue(this.Value);
                return;
            }
            var items = this.Value || this.DefaultValue;
            if (this.Value == void 0) {
                items = this.DefaultValue;
            } else {
                items = this.Value;
            }
            if (this.isCheckbox) {
                if (items) {
                    this.SetValue(true);
                }
                else {
                    this.SetValue(false);
                }
            }
            else {
                this.SetValue(items);
            }
        },

        HtmlRender: function () {
            var that = this;

            if (that.Editable) {
                //组标示
                $(this.Element).addClass("SheetCheckBoxList");
                this.GropName = this.DataField + $.IGuid();

                // 绑定数据字典
                this.$ListWrap = $("<div class='radiolistwrap'>").appendTo(this.$InputBody);
                if (this.DataDictItemName) {
                    if (this.DataDictItemValue && $.isArray(this.DataDictItemValue)) {
                        var options = this.DataDictItemValue;
                        for (var i = 0, len = options.length; i < len; i++) {
                            that.AddItem.apply(that, [options[i], options[i]]);
                        }
                    }
                }
                else {
                    if (this.DefaultItems) {
                        for (var i = 0; i < this.DefaultItems.length; i++) {
                            that.AddItem.apply(that, [this.DefaultItems[i], this.DefaultItems[i]]);
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
            this.$InputBody.find("input").unbind("change.FormCheckboxList").bind("change.FormCheckboxList", this, function (e) {
                var that = e.data;
                that.Validate.apply(that);
                that.OnChange.apply(that);
                that.Required && ($(this).prop("checked") && that.$ListWrap.removeAttr("style"));
            });
        },

        //处理必填红色*号
        Validate: function () {
            // 单选模式不验证必填
            if (this.isCheckbox) {
                return true;
            }

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

                var txt = "";
                if (text) {
                    txt = text;
                } else {
                    txt = value;
                }
                this.OptionValues[value] = txt;
            }
            else {
                if (text || value) {
                    var id = $.IGuid();
                    var option = "<div style='float:left;' GropName='" + this.GropName + "'></div>";
                    option += "<input type='checkbox' name='" + this.GropName + "' id='" + id + "' value='" + value + "' ";
                    if (!this.Editable) {//不可用
                        option += " disabled='disabled' ";
                    }
                    option += " />";
                    option += " <label for='" + id + "'>" + (text || value) + "</label>";
                    this.$ListWrap.append(option);

                    //var option = $("<div style='float:left;' GropName='" + this.GropName + "'></div>");
                    //var checkbox = $("<input type='checkbox' name='" + this.GropName + "' id='" + id + "' value='" + value + "' />");
                    //if (!this.Editable) {//不可用
                    //    checkbox.prop("disabled", "disabled")
                    //}
                    //var label = $("<label for='" + id + "'>" + (text || value) + "</label>");
                    //option.append(checkbox);
                    //option.append(label);
                    //this.$ListWrap.append(option);
                }
            }
        },

        ClearItems: function () {
            //this.$InputBody.empty();
            this.$ListWrap.empty();

        },

        SaveDataField: function () {
            //如果是权限设置的Visible是false，如果是规则设置的Visible可能仍然是true
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
        }
    });
})(jQuery);