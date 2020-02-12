// FormDropDownList控件
; (function ($) {

    // 构造函数
    $.MobileControls.FormAclScope = function (element, options, sheetInfo) {
        $.MobileControls.FormAclScope.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormAclScope.Inherit($.MobileControls.BaseClass, {
        //控件渲染函数
        Render: function () {
            
            //渲染前端
            this.HtmlRender();
            //初始化默认值
            this.InitValue();
            //this.BindEvent();
            
            
        },

        //渲染前端
        HtmlRender: function () {
            var that = this;

            $(this.Element).addClass("SheetDropDownList")
            this.GropName = this.DataField;//设置统一的name
            defaultitems = $(this.Element).attr('data-DefaultItems');
            if (defaultitems != "" && defaultitems != void 0) {
                defaultitems = eval('(' + defaultitems + ')');
            }
            this.$InputBody.css({ "top": "1px", "bottom": "1px" }).append("<option  value=''></option>");
            for (var i = 0; i < defaultitems.length; i++) {
                $option = $('<option value="' + defaultitems[i].Value + '">' + defaultitems[i].Text + '</option>');
                this.$InputBody.append($option);
            }
            this.$InputBody.attr("placeholder", "请选择");

        },

        CleanItems: function () {
            if (this.Editable) {
                return this.$InputBody.find('option').removeProp('selected');
            } else {
                return this.$InputBody.find('span').html('');
            }

        },

        AddItem: function (value, text) {
            if ((text || value) && this.Editable) {
                this.$InputBody.append($('<option>').val(value).text(value || text));
            }
        },

        //绑定事件
        BindEvent: function () {
            $(this.$InputBody).unbind("change").bind("change", this, function (e) {
                var that = e.data;
                //that.OnChange();
                //that.Validate();
            });
        },

        Reset: function () {
            //this.$InputBody.find('option').removeProp('selected');
            //this.$InputBody.find('option:eq(0)').attr('selected', true);
            //return;
            this.$InputBody.val('');
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
                    this.$InputBody.val(value);
                }
            }
        },
        GetValue: function () {
            return this.$InputBody.val();
        },
        SetValue: function (value) {
            this.$InputBody.val(value);
        },

        GetText: function () {
            return $(this.$InputBody).find('option:selected').text();
        },

        //校验
        Validate: function () {
            //不可编辑

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