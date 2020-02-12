//日期控件
(function ($) {
    $.MobileControls.FormDateTimeStamp = function (element, options, sheetInfo) {
        $.MobileControls.FormDateTimeStamp.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MobileControls.FormDateTimeStamp.Inherit($.MobileControls.BaseClass, {
        Render: function () {
            

            //渲染Html页面
            this.HtmlRender();
            this.SetValue(this.Value);
            //this.BindEvents();           
        },

        //渲染Html页面
        HtmlRender: function () {
            this.$InputDiv = $('<div>').attr("name", this.DataField);
            if (this.DateTimeMode == "yyyy-mm-dd") {
                this.$Input1 = $("<input type='date' class='filter-input'>");
                this.$Input2 = $("<input type='date' class='filter-input' >");
            } else {
                this.$Input1 = $("<input type='datetime-local' class='filter-input'>");
                this.$Input2 = $("<input type='datetime-local' class='filter-input'>");
            }
            this.$InputDiv.append(this.$Input1);
            this.$InputDiv.append('<span  class="filter-span">至</span>');
            this.$InputDiv.append(this.$Input2);
            this.$InputDiv.on("change.date", ".filter-input", function (e) {
                this.value = new Date(this.value.replace(/-/g, "/")).Format('yyyy-MM-dd');
                e.preventDefault();
            })
            this.$InputBody.append(this.$InputDiv);
        },

        GetValue: function () {
            var v1, v2;
            if ($(this.$Input1).val() == "") {
                v1 = '1753-01-01 00:00:00';
            } else {
                v1 = $(this.$Input1).val();
            }
            if ($(this.$Input2).val() == "") {
                v2 = '9999-01-01 00:00:00';
            } else {
                v2 = $(this.$Input2).val();
            }
            return v1 + ";" + v2;
        },

        //值改变
        ValChange: function () {
           // this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (typeof (v) == "undefined") return;
            var formatDateTime1 = "", formatDateTime2 = "";
            if (!$.isEmptyObject(v)) {
                var values = v.split(';');
                if (this.DateTimeMode == "yyyy-mm-dd") {
                    if (!$.isEmptyObject(values[0]) && values[0].indexOf("1753-01-01") == values[0].indexOf("9999-01-01")) {
                        formatDateTime1 = new Date(values[0].replace(/-/g, "/")).Format('yyyy-MM-dd');
                    } else {
                        formatDateTime1 = "";
                    }
                    if (!$.isEmptyObject(values[1]) && values[1].indexOf("1753-01-01") == values[1].indexOf("9999-01-01")) {
                        formatDateTime2 = new Date(values[1].replace(/-/g, "/")).Format('yyyy-MM-dd');
                    } else {
                        formatDateTime2 = "";
                    }
                    
                }
                else {
                    if (!$.isEmptyObject(values[0]) && values[0].indexOf("1753-01-01") == values[0].indexOf("9999-01-01")) {
                        formatDateTime1 = new Date(values[0].replace(/-/g, "/")).Format('yyyy-MM-ddThh:mm:ss');
                    } else {
                        formatDateTime1 = "";
                    }
                    if (!$.isEmptyObject(values[1]) && values[1].indexOf("1753-01-01") == values[1].indexOf("9999-01-01")) {
                        formatDateTime2 = new Date(values[1].replace(/-/g, "/")).Format('yyyy-MM-ddThh:mm:ss');
                    } else {
                        formatDateTime2 = "";
                    }
                }
            }
            this.$Input1.val(formatDateTime1);
            this.$Input2.val(formatDateTime2);
            this.ValChange();
        },

        Reset: function () {
            $(this.$Input1).val('');
            $(this.$Input2).val('');
        },

        BindEvents: function () {
            //$(this.$Input).unbind("change.FormDateTime").bind("change.FormDateTime", this, function (e) {
            //    var that = e.data;
            //    that.OnChange();
            //    that.Validate();
            //});
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