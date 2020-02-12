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

            ////添加到服务
            //this.AddSchema();
        },

        //AddSchema: function () {
        //    MobileObjArray.RadioButtonList.addSchema(this.DataField, this);
        //},

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
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldResult = this.ResponseContext.ReturnData[this.DataField];
            if (!oldResult) {
                return {};
            }

            if (oldResult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        },

        //设置默认值
        InitValue: function () {
            var item = '';
            if (this.Value == void 0) {
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
                if (value != "") {
                    if (!this.Editable) {
                        this.$InputBody.find('span').html(value);
                    } else {
                        this.$InputBody.val(value);
                    }
                }
            }
        },

        HtmlRender: function () {
            $(this.Element).addClass("SheetRadioButtonList");
            //组标示
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
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            } else {
                var text = this.Required ? "请选择(必填)&lrm;" : "请选择";
                var options = "<option  value=''>" + text + "</option>";
                for (var i = 0; i < defaultitems.length; i++) {
                    options += "<option value='" + defaultitems[i] + "'>" + defaultitems[i] + "</option>";
                }
                this.$InputBody.append(options);
                this.$InputBody.attr("placeholder", text);
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
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


        //处理必填红色*号
        Validate: function () {
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

        AddItem: function (value, text) {
            if (text || value) {
                var option = $("<option value='" + value + "'>" + text + "</option>");
                this.$InputBody.append(option);
            }
        },

        ClearItems: function () {
            if (this.Editable) {
                return this.$InputBody.find('option').removeProp('selected');
            } else {
                return this.$InputBody.find('span').html('');
            }
        }
    });
})(jQuery);