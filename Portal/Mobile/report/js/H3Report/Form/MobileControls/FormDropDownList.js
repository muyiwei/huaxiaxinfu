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
            //初始化默认值
            this.InitValue();
            this.BindEvent();
            //不可用
            if (!this.Editable) {
                this.SetReadonly(true);
            }
        },

        //渲染前端
        HtmlRender: function () {
            var that = this;

            $(this.Element).addClass("SheetDropDownList")
            this.GropName = this.DataField;//设置统一的name

            if (this.DataDictItemName != null && this.DataDictItemValue != null && this.DataDictItemValue != void 0) {
                defaultitems = this.DataDictItemValue;
            } else {
                defaultitems = $(this.Element).attr('data-defaultitems');
                if (defaultitems != "" && defaultitems != void 0) {
                    defaultitems = eval('(' + defaultitems + ')');
                }
            }
            if (!this.Editable) {
                this.$InputBody.append("<span></span>");
                $(this.Element).removeClass('item-select');
            } else {
                var text = this.Required ? "请选择(必填)&lrm;" : "请选择";
                var options = "<option  value=''>" + text + "</option>";
                for (var i = 0; i < defaultitems.length; i++) {
                    if (defaultitems[i]) {
                        options += "<option value='" + defaultitems[i] + "'>" + defaultitems[i] + "</option>";
                    }
                }
                this.$InputBody.append(options);
                this.$InputBody.attr("placeholder", text);
            }
        },

        ClearItems: function () {
            this.OptionValues = {};
            if (this.Editable) {
                return this.$InputBody.find('option').remove();
            }
            else {
                return this.$InputBody.find('span').html('');
            }
        },

        AddItem: function (value, text) {
            if ((text || value) && this.Editable) {
                var txt = "";
                if (text) {
                    txt = text;
                } else {
                    txt = value;
                }
                this.$InputBody.append($("<option>").val(value).text(txt));
                this.OptionValues[value] = txt;
            }
        },

        //绑定事件
        BindEvent: function () {
            $(this.$InputBody).unbind("change").bind("change", this, function (e) {
                var that = e.data;
                that.OnChange();
                that.Validate();
            });
        },

        Reset: function () {
            if (this.Editable) {
                return this.$InputBody.find('option').removeProp('selected');
            } else {
                return this.$InputBody.find('span').html('');
            }

        },

        //设置默认值
        InitValue: function () {
            var item = '';
            if (this.Value==void 0) {
                item = this.DefaultValue;
            } else {
                item = this.Value;
            }
            //var item = this.Value || this.DefaultValue;
            if (item != void 0 && item != "" && item.length > 0) {
                var value = "";
                if (item.constructor == Array) {
                    value = item[0];
                } else {
                    value = item;
                }
                if (value) {
                    if (!this.Editable) {
                        this.$InputBody.find('span').html(value);
                    } else {
                        this.$InputBody.val(value);
                    }

                }
            }
        },

        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (!this.Visible) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }
            if (oldResult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        },

        GetValue: function () {
            if (!this.Editable) {
                return this.Value;
            }
            else {
                return this.$InputBody.val();

            }
        },
        SetValue: function (value) {
            if (!this.Editable) {
                this.Value = value;
                if (this.OptionValues[value])
                    this.$InputBody.find('span').html(this.OptionValues[value]);
                else
                    this.$InputBody.find('span').html(value);
            } else {
                this.$InputBody.val(value);
            }
            this.OnChange();
        },

        GetText: function () {
            if (!this.Editbale) {
                return $(this.$InputBody).find('span').html();
            } else {
                return $(this.$InputBody).find('option:selected').text();
            }

        },

        //校验
        Validate: function () {
            //不可编辑

            var check = true;
            if (this.Editable && this.Required) {
                check = false;
                if ($(this.$InputBody).val() == "" || $(this.$InputBody).val() == void 0) {
                    check = false;
                } else {
                    check = true;
                }
                if (check) {
                    this.RemoveInvalidText(this.$InputBody, "必填");
                }
                else {
                    this.AddInvalidText(this.$InputBody, "必填");
                }
            }

            return check;
        },

        SetReadonly: function (flag) {
            if (flag) {
                this.$InputBody.prop("disabled", "disabled");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                this.$InputBody.removeProp("disabled");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }

        }
    });
})(jQuery);