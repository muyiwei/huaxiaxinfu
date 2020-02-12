// RadioButtonList控件
; (function ($) {
    // 构造函数
    $.MobileControls.FormRadioButtonList = function (element, ptions, sheetInfo) {
        $.MobileControls.FormRadioButtonList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormRadioButtonList.Inherit($.MobileControls.BaseClass, {
        Render: function () {         
            //渲染前端
            this.HtmlRender();
            this.BindEnvens();

            //初始化默认值
            this.InitValue();

            ////添加到服务
            //this.AddSchema();
        },

        //AddSchema: function () {
        //    MobileObjArray.RadioButtonList.addSchema(this.DataField, this);
        //},

        GetValue: function () {
            return this.$InputBody.val();
        },
        SetValue: function (value) {
            this.$InputBody.val(value);
        },

        GetText: function () {
            return $(this.$InputBody).find('option:selected').text();
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

        //设置默认值
        InitValue: function () {

            var item = this.Value || this.DefaultValue;
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
            this.$InputBody.append("<option  value=''></option>");
            for (var i = 0; i < defaultitems.length; i++) {
                $option = $('<option value="' + defaultitems[i] + '">' + defaultitems[i] + '</option>');
                this.$InputBody.append($option);
            }
            this.$InputBody.attr("placeholder", "请选择");
            var $contnt = $(this.Element).find('div.ControlContent');
            if ($contnt.length > 0) {
                $contnt.removeClass('readonly');
            }
        },

        //绑定事件
        BindEnvens: function () {

            $(this.$InputBody).unbind("change").bind("change", this, function (e) {
                var that = e.data;
                that.OnChange();
                that.Validate();
            });
        },

        OnChange:function(){},
        Reset: function () {
            return this.$InputBody.find('span').html('');
        },


        //处理必填红色*号
        Validate: function () {
            var check = true;
            //if (this.Editable && this.Required) {
            //    check = false;
            //    if ($(this.$InputBody).val() == "" || $(this.$InputBody).val() == void 0) {
            //        check = false;
            //    } else {
            //        check = true;
            //    }
            //    if (check) {
            //        this.RemoveInvalidText(this.$InputBody, "必填");
            //    }
            //    else {
            //        this.AddInvalidText(this.$InputBody, "必填");
            //    }
            //}

            return check;
        },

        AddItem: function (value, text) {
            if (text || value) {
                var option = $("<option value='" + value + "'>" + text + "</option>");
                this.$InputBody.append(option);
            }
        },

        CleanItems: function () {
            if (this.Editable) {
                return this.$InputBody.find('option').removeProp('selected');
            } else {
                return this.$InputBody.find('span').html('');
            }
        }
    });
})(jQuery);