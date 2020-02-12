//日期控件
(function ($) {
    //控件执行
    $.fn.FormDateTime = function () {
        return $.ControlManager.Run.call(this, "FormDateTime", arguments);
    };


    $.Controls.FormDateTime = function (element, options, sheetInfo) {
        $.Controls.FormDateTime.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.Controls.FormDateTime.Inherit($.Controls.BaseControl, {
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            //渲染Html页面
            this.HtmlRender();

            // 不可编辑
            if (!this.Editable) {
                this.SetReadonly(true);
                return;
            }

            //绑定事件
            this.BindEvent();
        },


        getFormat: function () {
            var format = "yyyy-MM-dd";
            if (this.DateTimeMode == "yyyy-mm-dd hh:ii") {
                format = "yyyy-MM-dd hh:mm";
            }
            if (this.DateTimeMode == "hh:ii") {
                format = "hh:mm";
            }
            return format;
        },

        //渲染Html页面
        HtmlRender: function () {
            var date = new Date();
            var format = this.getFormat();
            console.log("format:", new Date() - date);
            if (!this.Editable) {
                this.$Input = $("<pre>").css("border", "none");
                if (!$.isEmptyObject(this.Value)) {
                    this.$Input.text(new Date(this.Value.replace(/-/g, "/")).Format(format));
                }
            }
            else {
                this.$Input = $("<input type='text' name='" + this.DataField + "' class='form-control'>").addClass("");
                if (!$.isEmptyObject(this.Value)) {
                    this.$Input.val(new Date(this.Value.replace(/-/g, "/")).Format(format))
                }
                var minView = 2;
                var startView = 2;
                if (this.DateTimeMode == "yyyy-mm-dd hh:ii") {
                    minView = 0;
                }
                if (this.DateTimeMode == "hh:ii") {
                    startView = 0;
                    minView = 0;
                }

                console.log("render-part1:", new Date() - date);

                var _self = this;
                window.setTimeout(function () {
                    _self.$Input.datetimepicker({
                        language: 'zh-CN',
                        format: _self.DateTimeMode,
                        todayBtn: true,
                        autoclose: true,
                        startView: startView,
                        minView: minView
                    });
                }, 0);
                console.log("render-datetimepicker:", new Date() - date);
            }
            this.$InputBody.append(this.$Input);
        },

        SetValue: function (value) {
            if (typeof (value) == "undefined" || value == null || value == '') {
                if (this.Editable) {
                    this.$Input.val("");
                }
                else {
                    if (this.Visible) {
                        this.$Input.text("");
                    }
                    //this.$Input.text("");
                    this.Value = "";
                }
                return;
            }
            var temp = value + '';
            if (this.DateTimeMode != "hh:ii") {//日期
                if (!(value instanceof Date)) {
                    if ((value + '').indexOf('Date') > -1) {
                        value = value.replace(/\//g, '').replace(/Date/g, '');
                        value = value.slice(1, value.length - 1);
                        value = parseInt(value);
                    }
                }
                value = new Date(value).Format(this.getFormat());
                //验证是否是合法的日期
                if (new Date(value).getFullYear() != value.substring(0, 4)) {
                    return;
                }
                //如果时间是yyyy-mm-dd,formate是yyyy-mm-dd hh:ii会导致value的时间部分是8
                var flag = false;
                var reg = /\d{4}(\-|\/|.)\d{1,2}\1\d{1,2}/;
                if (reg.test(temp) && temp.length == 10) {
                    flag = true;
                }
                if (this.DateTimeMode == 'yyyy-mm-dd hh:ii' && flag) {
                    var t = new Date(value);
                    var y = t.getFullYear();
                    var m = t.getMonth() + 1;
                    var d = t.getDate();
                    value = y + '-' + (m < 10 ? ('0' + m) : m) + '-' + (d < 10 ? ('0' + d) : d) + ' 00:00';
                }
            } else {//时分
                if (!(value instanceof Date)) {//不是日期格式
                    if ((value + '').indexOf('Date') > -1) {
                        value = value.replace(/\//g, '').replace(/Date/g, '');
                        value = value.slice(1, value.length - 1);
                        value = parseInt(value);
                        value = new Date(value).Format(this.getFormat());
                    } else {
                        if (value.length <= 5 && value.indexOf(':') > -1) {
                            var arr = value.split(':');
                            var h = arr[0];
                            var m = arr[1];
                            if (isNaN(h) || isNaN(m)) {
                                return;
                            }
                            h = parseInt(h);
                            m = parseInt(m);
                            if (h < 0 || h > 23 || m < 0 || m > 59) {
                                return;
                            }
                            value = (h < 10 ? ('0' + h) : h) + ':' + (m < 10 ? ('0' + m) : m);
                        } else {
                            value = new Date(value).Format(this.getFormat());
                        }
                    }
                }
            }
            if (this.Editable) {
                this.$Input.val(value);
            }
            else {
                if (this.Visible) {
                    this.$Input.text(value);
                } else {
                    this.Value = value;
                }
            }
            this.ValChange();
        },

        GetValue: function () {
            if (this.Editable) {
                var time = "";
                if (this.$Input != void 0)
                    time = this.$Input.val();
                //if (isNaN(Date.parse(time.replace(/-/g, '/')))) {
                //    time = '';
                //}
                return time;
            }
            else {
                var time = "";
                if (this.Visible)
                    time = this.$Input.text();
                else {
                    time = this.Value;
                }
                //if (isNaN(Date.parse(time.replace(/-/g, '/')))) {
                //    time = '';
                //}
                return time ? time : "";
            }
        },
        GetText: function () {
            return this.GetValue();
        },

        //绑定事件
        BindEvent: function () {
            $(this.$Input).unbind("keyup.FormDateTime").bind("keyup.FormDateTime", this, function (e) {
                //var that = e.data;
                //that.ValChange();
            });

            $(this.$Input).unbind("change.FormDateTime blur.FormDateTime").bind("change.FormDateTime blur.FormDateTime", this, function (e) {
                var that = e.data;
                that.ValChange();

                that.Required && ($(this).val() != "" && $(this).removeAttr("style"));
            });
        },

        //值改变
        ValChange: function () {
            this.Validate();
            this.OnChange();
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && val.trim() == "") {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            //只要设置了日期就要校验，防止用户输入的时期不正确导致提交后台报错
            if (val) {
                if ((isNaN(Date.parse(val.replace(/-/g, "/"))) && this.DateTimeMode != "hh:ii") /*&& this.Required*/) {
                    this.AddInvalidText(this.$Input, "日期格式不对");
                    return false;
                }
            }
            if (this.DateTimeMode != "hh:ii") {
                var time = val.split('-');
                var year = parseInt(time[0]);
                if (year > 9999) {
                    this.AddInvalidText(this.$Input, "日期格式不对");
                    return false;
                }
            }


            if (this.Expression && !this.Expression.test(val)) {
                this.AddInvalidText(this.$Input, this.ErrorAlert);
                return false;
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },



        //保存数据
        SaveDataField: function () {
            var result = {};
            if (this.ComputationRule == null && !this.Visible) return result;

            if (this.DataField) {
                var dataFieldItem = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
                if (dataFieldItem) {
                    var value = this.GetValue();
                    if (dataFieldItem.Value != value) {
                        result[this.DataField] = value;
                    }
                }
            }
            return result;
        }
    });
})(jQuery);