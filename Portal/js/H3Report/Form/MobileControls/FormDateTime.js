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

            this.BindEvents();

            // 不可编辑
            if (!this.Editable) {
                this.SetReadonly(true);
                return;
            }
        },

        //渲染Html页面
        HtmlRender: function () {
            if (this.Value) {
                if (typeof (dd) != "undefined" && typeof (dd.biz) != "undefined" & typeof (dd.biz.map) != "undefined") {
                    if (this.DateTimeMode == "yyyy-mm-dd") {
                        this.$Input = $("<input type='text' readonly style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-dd') + "'>");
                    } else if (this.DateTimeMode == "hh:ii") {
                        this.$Input = $("<input type='text' readonly style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('hh:mm') + "'>");
                    }
                    else {
                        this.$Input = $("<input type='text' readonly style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-dd hh:mm:ss') + "'>");
                    }
                } else {
                    if (this.DateTimeMode == "yyyy-mm-dd") {
                        this.$Input = $("<input type='date' style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-dd') + "'>");
                    } else if (this.DateTimeMode == "hh:ii") {
                        this.$Input = $("<input type='time' style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('hh:mm') + "'>");
                    } else {
                        this.$Input = $("<input type='datetime-local' style='float:right;padding-right:14px;' value='" + new Date(this.Value.replace(/-/g, "/")).Format('yyyy-MM-ddThh:mm:ss') + "'>");
                    }
                }

            }
            else {
                if (typeof (dd) != "undefined" && typeof (dd.biz) != "undefined" & typeof (dd.biz.map) != "undefined") {
                    this.$Input = $("<input type='text' readonly style='float:right;padding-right:14px;' >");
                } else {
                    if (this.DateTimeMode == "yyyy-mm-dd") {
                        this.$Input = $("<input type='date' style='float:right;padding-right:14px;' >");
                    } else if (this.DateTimeMode == "hh:ii") {
                        this.$Input = $("<input type='time' style='float:right;padding-right:14px;' >");
                    } else {
                        this.$Input = $("<input type='datetime-local' style='float:right;padding-right:14px;' >");
                    }
                }
            }
            if (!this.Editable) {
                this.$Input.css('padding-right', '14px');
            }
            else {
                if (this.Required) {
                    this.$Input.attr('placeholder', '请选择(必填)').addClass("bold");
                } else {
                    this.$Input.attr('placeholder', '请选择').addClass("bold");
                }
            }
            this.$InputBody.append(this.$Input);
            this.$flat = $('<i class="icon icon-arrow-right m-arrow-right"></i>');
            this.$InputBody.append(this.$flat);
            if (this.Editable) {
                $(this.$flat).show();
                var that = this;
                if (typeof (dd) != "undefined" && typeof (dd.biz) != "undefined" & typeof (dd.biz.map) != "undefined") {
                    var handler = function (value) {
                        that.SetValue(value);
                    };
                    this.$InputBody.unbind('click').bind('click', function () {
                        var v = null;
                        if (that.DateTimeMode == "yyyy-mm-dd") {
                            if (that.Value) {
                                v = new Date(that.Value.replace(new RegExp('-', "gm"), '/')).Format('yyyy-MM-dd');
                            } else {
                                v = (new Date()).Format('yyyy-MM-dd');
                            }
                            that.DatePicker(v, handler);
                        } else if (that.DateTimeMode == "hh:ii") {
                            if (that.Value) {
                                v = new Date(that.Value).Format('hh:mm');
                            } else {
                                v = (new Date()).Format('hh:mm');
                            }
                            that.TimePicker(v, handler);
                        } else {
                            if (that.Value) {
                                v = new Date(that.Value.replace(new RegExp('-', "gm"), '/')).Format('yyyy-MM-dd hh:mm:ss');
                            } else {
                                v = (new Date()).Format('yyyy-MM-dd hh:mm:ss');
                            }
                            that.DateTimePicker(v, handler);
                        }
                    });
                }
            } else {
                this.$InputBody.unbind('click');
                $(this.$flat).hide();
            }

        },

        DatePicker: function (value, handler) {
            if (!value) {
                value = (new Date()).Format('yyyy-MM-dd');
            }
            dd.biz.util.datepicker({
                format: 'yyyy-MM-dd',
                value: value,
                onSuccess: function (result) {
                    handler(result.value);
                },
                onFail: function () {

                }
            });
        },
        TimePicker: function (value, handler) {
            dd.biz.util.timepicker({
                format: 'HH:mm',
                value: value,
                onSuccess: function (result) {
                    handler(result.value);
                },
                onFail: function () {

                }
            });
        },
        DateTimePicker: function (value, handler) {
            dd.biz.util.datetimepicker({
                format: 'yyyy-MM-dd HH:mm:ss',
                value: value,
                onSuccess: function (result) {
                    handler(result.value);
                },
                onFail: function () {

                }
            });
        },

        GetValue: function () {
            if (this.Editable) {
                if (this.$Input)
                    return this.$Input.val().replace(/T/g, " ");
                else
                    return "";
            }
            else {
                //return this.Value;
                return this.getFormatDateTime(this.Value);
                //return this.$Input.text();
            }
        },

        //值改变
        ValChange: function () {
            this.OnChange();
            this.Validate();
        },
        getFormatDateTime: function (v) {
            if (v == null) {
                return "";
            }
            var formatDateTime = '';
            if (this.DateTimeMode == "yyyy-mm-dd") {
                if (v instanceof Date) {
                    formatDateTime = new Date(v).Format('yyyy/MM/dd');
                    //formatDateTime = new Date(v).Format('yyyy-MM-dd');
                }
                else if (v.indexOf('Date') > -1)
                    formatDateTime = new Date(parseInt(v.replace('/Date(', '').replace(')/', ''))).Format('yyyy/MM/dd');
                    //formatDateTime = new Date(parseInt(v.replace('/Date(', '').replace(')/', ''))).Format('yyyy-MM-dd');
                else
                    formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy/MM/dd');
                   // formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy-MM-dd');
            }
            else if (this.DateTimeMode == "hh:ii") {
                //formatDateTime = v.substr(0, 5);
                if (v.length > 5) {
                    var reg = /\d{4}(\-|\/|.)\d{1,2}\1\d{1,2}/;
                    if (reg.test(v)) {
                        if (v.length == 10)
                            formatDateTime = "00:00";
                        else
                            formatDateTime = v.slice(11, 16);
                    }
                } else {
                    formatDateTime = v.substr(0, 5);
                }
            }
            else {
                if (v instanceof Date) {
                    formatDateTime = new Date(v).Format('yyyy/MM/dd hh:mm:ss');
                    //formatDateTime = new Date(v).Format('yyyy-MM-dd hh:mm:ss');
                }
                else if (v.indexOf('Date') > -1)
                    formatDateTime = new Date(parseInt(v.replace('/Date(', '').replace(')/', ''))).Format('yyyy/MM/dd hh:mm:ss');
                    //formatDateTime = new Date(parseInt(v.replace('/Date(', '').replace(')/', ''))).Format('yyyy-MM-dd hh:mm:ss');
                else
                    formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy/MM/dd hh:mm:ss');
                    //formatDateTime = new Date(v.replace(/-/g, "/")).Format('yyyy-MM-dd hh:mm:ss');
            }
            return formatDateTime;
        },
        //设置值
        SetValue: function (v) {
            var formatDateTime = "";
            if (v) {
                formatDateTime = this.getFormatDateTime(v);
            }
            //if (formatDateTime=='') {
            //    return;
            //}
            //防止计算规则的年份超出范围。现在只支持四位数字的年份
            if (this.DateTimeMode != "hh:ii") {
                var value = new Date(formatDateTime);
                if (value.getFullYear() != formatDateTime.substring(0, 4)) {
                    return "";
                }
            }

            this.Value = formatDateTime.replace(new RegExp('/',"gm"),'-');
            
            if (this.$Input != undefined && this.$Input != null) {
                this.$Input.val(this.Value);
            }
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
                    $contnt.addClass('readonly').css("padding-right", "0px");
                    $contnt.find('input[type="text"]').css("opacity", 1);
                    $contnt.find('.icon').hide();
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
            if (this.Required && val.trim() == "") {
                this.AddInvalidText(this.$Input, "必填");
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
                        //result[this.DataField] = dataFieldItem;
                        result[this.DataField] = value;
                    }
                }
            }
            return result;
        }
    });
})(jQuery);