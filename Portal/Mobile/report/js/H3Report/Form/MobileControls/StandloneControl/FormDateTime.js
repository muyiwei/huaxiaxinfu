//日期控件
(function ($) {
    $.MobileControls.FormDateTime = function (element, options, sheetInfo) {
        $.MobileControls.FormDateTime.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MobileControls.FormDateTime.Inherit($.MobileControls.BaseClass, {
        Render: function () {
            

            //渲染Html页面
            this.HtmlRender();

            //this.BindEvents();           
        },

        //渲染Html页面
        HtmlRender: function () {
            if (!$.isEmptyObject(this.Value)) {
                if (this.DateTimeMode == "yyyy-mm-dd") {
                    this.$Input = $("<input type='date' style='float:right;margin-right:-18px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-dd') + "'>");
                } else {
                    this.$Input = $("<input type='datetime-local' style='float:right;margin-right:-18px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-ddThh:mm:ss') + "'>");
                }
            }
            else {
                if (this.DateTimeMode == "yyyy-mm-dd") {
                    this.$Input = $("<input type='date' style='float:right;margin-right:-18px;' >");
                } else {
                    this.$Input = $("<input type='datetime-local' style='float:right;margin-right:-18px;' >");
                }
            }
            this.$InputBody.append(this.$Input);
            this.$flat = $('<i class="icon icon-arrow-right m-arrow-right"></i>');
            this.$InputBody.append(this.$flat);
        },

        GetValue: function () {
            return $(this.$Input).val();
        },

        //值改变
        ValChange: function () {
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            var formatDateTime = "";
            if (!$.isEmptyObject(v)) {
                if (this.DateTimeMode == "yyyy-mm-dd") {
                    formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy-MM-dd');
                }
                else {
                    formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy-MM-ddThh:mm:ss');
                }
            }
            this.$Input.val(formatDateTime);
            this.ValChange();
        },

        Reset: function () {
            $(this.$Input).val('');
        },

        BindEvents: function () {
            $(this.$Input).unbind("change.FormDateTime").bind("change.FormDateTime", this, function (e) {
                var that = e.data;
                that.OnChange();
                that.Validate();
            });
        },

        SetReadonly: function (flag) {
            if (flag) {
                $(this.$Input).attr("disabled", "disabled").attr("type", "text");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            } else {
                $(this.$Input).removeAttr('disabled').attr("type", "date");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            //if (!this.Editable) return true;

            var val = this.GetValue();
            if (isNaN(Date.parse(val)) && this.Required) {
                this.AddInvalidText(this.$InputBody, "日期格式不对");
                return false;
            }
            if (this.Required && val.trim() == "") {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }

          
            return true;
        }
    });
})(jQuery);