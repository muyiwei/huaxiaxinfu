//复选框

(function ($) {
    $.fn.FormCheckbox = function () {
        return $.ControlManager.Run.call(this, "FormCheckbox", arguments);
    };

    // 构造函数
    $.Controls.FormCheckbox = function (element, ptions, sheetInfo) {
        $.Controls.FormCheckbox.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormCheckbox.Inherit($.Controls.BaseControl, {
        Render: function () {
            if (!this.Visible) {
                $(this.Element).hide();
                return;
            }
            //是否在子表里面子表
            this.IsInGridView = !$.isEmptyObject(this.ObjectId);

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
                var val = $(this.Element).find('pre').text()
                return val == '是' ? true : false;
            }
            return $(this.Element).find("input").prop("checked");
        },

        //设置控件的值
        SetValue: function (value) {
            if (!this.Editable) {
                this.$Input.text(value ? "是" : "否");
                return;
            }
            else {
                $(this.Element).find("input").prop("checked", value);
                this.OnChange();
            }
        },

        GetText: function () {
            var text = "";
            $(this.Element).find("input").each(function () {
                if (this.checked)
                    text += $(this).text() + ";";
            });
            console.log("GetText");
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
            var valueLocal = this.Value == null ? this.DefaultValue : this.Value;
            if (!this.Editable) {
                this.$Input.text(valueLocal ? "是" : "否");
                return;
            }
            $(this.$InputBody).find("input").each(function () {
                $(this).prop("checked", valueLocal);
            });
        },

        HtmlRender: function () {
            var that = this;
            if (!this.Editable) {
                this.$Input = $("<pre style='border:none;'>");
                $(this.$InputBody).append(this.$Input);
            }
            else {

                $(this.Element).find(".ControlTitle").text("");
                //组标示
                $(this.Element).addClass("SheetCheckBoxList");
                this.GropName = this.DataField + $.IGuid();

                // 绑定数据字典
                if (this.DataDictItemName) {
                    if (this.DataDictItemValue && $.isArray(this.DataDictItemValue)) {
                        var options = this.DataDictItemValue;
                        for (var i = 0, len = options.length; i < len; i++) {
                            that.AddCheckboxItem.apply(that, [options[i], options[i]]);
                        }
                    }
                }
                else {
                    if (this.DefaultItems) {
                        for (var i = 0; i < this.DefaultItems.length; i++) {
                            that.AddCheckboxItem.apply(that, [this.DefaultItems[i], this.DefaultItems[i]]);
                        }
                    }
                }
                if (that.IsInGridView) {
                    $(that.Element).find("label").text("").css({ left: "50%", marginLeft: "-10px" });
                }
            }
        },
        //绑定事件
        BindEvent: function () {
            this.$InputBody.find("input").unbind("change.FormCheckbox").bind("change.FormCheckbox", this, function (e) {
                var that = e.data;
                that.OnChange.apply(that);
            });
        },

        AddCheckboxItem: function (value, text) {
            if (text || value) {
                var id = $.IGuid();
                var option = "<div GropName='" + this.GropName + "'></div>";
                option += "<input type='checkbox' name='" + this.GropName + "' id='" + id + "' value='" + value + "' ";
                if (!this.Editable) {//不可用
                    checkbox.prop("disabled", "disabled")
                    option += " disabled='disabled' ";
                }
                option += " /> ";
                option += " <label for='" + id + "'>" + (text || value) + "</label> ";
                this.$InputBody.append(option);
            }
        },
        Empty: function () {
            this.$InputBody.empty();
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
        }
    });
})(jQuery);