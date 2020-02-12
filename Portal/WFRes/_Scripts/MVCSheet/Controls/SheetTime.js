// SheetTime控件
//引用WdatePicker.js
//$.ajax({
//    url: _PORTALROOT_GLOBAL + "/WFRes/_Scripts/Calendar/WdatePicker.js",
//    type: "GET",
//    dataType: "script",
//    async: false,
//    cache: true,
//    global: false
//});

;
(function ($) {
    //控件执行
    $.fn.SheetTime = function () {
        return $.MvcSheetUI.Run.call(this, "SheetTime", arguments);
    };


    $.MvcSheetUI.Controls.SheetTime = function (element, options, sheetInfo) {
        $.MvcSheetUI.Controls.SheetTime.Base.constructor.call(this, element, options, sheetInfo);
    };
    var _OnlyTime = false;
    $.MvcSheetUI.Controls.SheetTime.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            var $element = $(this.Element),
                dataFieldValue = this.V,
                that = this;
            //是否可见
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }

            //设置初始化值
            var displayDate;
            //发起模式
            if (this.Originate && this.Editable) {
                if (dataFieldValue && dataFieldValue != "0001-01-01 00:00:00" && dataFieldValue != "1753-01-01 00:00:00" && dataFieldValue != "9999-12-31 00:00:00") {
                    displayDate = new Date(Date.parse(dataFieldValue.replace(/-/g, "/")));
                } else {
                    if (this.DefaultValue == "CurrentTime") {
                        displayDate = new Date();
                    } else {
                        var ms = Date.parse(this.DefaultValue.replace(/-/g, "/"));
                        if (!isNaN(ms)) {
                            displayDate = new Date(ms);
                        }
                    }
                }
            } else {
                if (dataFieldValue) {
                    if (dataFieldValue == "0001-01-01 00:00:00" || dataFieldValue == "1753-01-01 00:00:00" || dataFieldValue == "9999-12-31 00:00:00") {
                        if (this.DefaultValue == "CurrentTime") {
                            displayDate = new Date();
                        }
                    } else {
                        displayDate = new Date(Date.parse(dataFieldValue.replace(/-/g, "/")));
                    }
                } else {
                    displayDate = "";
                }
            }

            //不可编辑
            if (!this.Editable) {
                $element.after("<label style='width:100%;'>" + this._getDateTimeFormatString(displayDate).replace(/T/g, " ").replace("/Z/g", "") + "</label>");
                $element.val(this._getDateTimeFormatString(displayDate).replace(/T/g, " ").replace("/Z/g", ""));
                $element.hide();
                return;
            }

            //移动端
            if (this.IsMobile) {
                //debugger
                //移动端使用HTML5原生日期时间选择控件
                var inputType;
                switch (this.TimeMode) {
                    case "FullTime":
                    case "SimplifiedTime":
                        inputType = "datetime-local";
                        break;
                    case "OnlyDate":
                        inputType = "date";
                        break;
                    case "OnlyTime":
                        inputType = "time";
                        _OnlyTime = true;
                        break;
                    default:
                        inputType = "date";
                        break;
                }
                $element.attr("type", "text");
                $element.attr('placeholder', SheetLanguages.Current.PleaseInput);
                var that = this;
                //通过IONIC初始化控件
                this.ionicInit(that, $element, inputType, $.MvcSheetUI.IonicFramework, displayDate);
                var ua = window.navigator.userAgent.toLowerCase();
                if (ua.match(/MicroMessenger/i) == 'micromessenger' && ua.toLowerCase().indexOf("android") > -1) {
                    // $element.attr("disabled", true).css("color", "#000");
                }
                // 微信端点击显示日期控件
                this.Element.addEventListener("touchend", function () {
                    event.stopPropagation();
                });
                this.Element.addEventListener("touchstart", function () {
                    event.stopPropagation();
                });
                $element.val(this._getDateTimeFormatString(displayDate).replace("T", " "));
                //绑定change事件
                var that = this;
                $element.unbind("change.SheetTime").bind("change.SheetTime", function () {
                    that.Validate();
                    if (that.OnChange) {
                        that.RunScript(this, that.OnChange);
                    }
                });

            } else {
                // 查看痕迹
                if (this.TrackVisiable && !this.Originate && this.DataField.indexOf(".") == -1) { this.RenderDataTrackLink(); }

                $element.val(this._getDateTimeFormatString(displayDate));

                //绑定click事件
                $element.attr("onclick", "WdatePicker(" + this._getWdatePickerJson() + ")");

                // 绑定修改事件
                $element.attr("onchange", ""); //这行鬼东西不能少，否则无法触发change事件(可能由于WdatePicker的影响)

                if (!!window.ActiveXObject || "ActiveXObject" in window) {
                    $element[0].onchange = function () {
                        that.Validate();
                        if (that.OnChange) {
                            that.RunScript(this, that.OnChange);
                        }
                    };
                } else {
                    $element.unbind("change.SheetTime").bind("change.SheetTime", function () {
                        debugger;
                        that.Validate();
                        if (that.OnChange) {
                            that.RunScript(this, that.OnChange);
                        }
                    });
                }

                //MinValue设置为另外一个控件的数据项，那个控件失去焦点时，重新设置minDate
                if (this.MinValue != "CurrentTime" && isNaN(Date.parse(this.MinValue.replace(/-/g, "/")))) {
                    var $control = $.MvcSheetUI.GetElement(this.MinValue);
                    if ($control) {
                        $control.unbind("blur.MinValue").bind("blur.MinValue", function () {
                            $element.attr("onclick", "WdatePicker(" + that._getWdatePickerJson() + ")");
                        });
                    }
                }
                //MaxValue设置为另外一个控件的数据项，那个控件失去焦点时，重新设置maxDate绑定focus
                if (this.MaxValue != "CurrentTime" && isNaN(Date.parse(this.MaxValue.replace(/-/g, "/")))) {
                    var $control = $.MvcSheetUI.GetElement(this.MaxValue);
                    if ($control) {
                        $control.unbind("blur.MaxValue").bind("blur.MaxValue", function () {
                            $element.attr("onclick", "WdatePicker(" + that._getWdatePickerJson() + ")");
                        });
                    }
                }
            }
        },
        ionicInit: function (that, element, inputType, ionic, displayDate) {
            element.attr("readonly", "readonly");
            ionic.$scope.dateTimeTitle = "选择日期";
            var elementName = that.DataField.replace(".", "") + "element";
            ionic.$scope[elementName] = element;
            element.parent().parent().attr("ion-datetime-picker", "");
            element.parent().parent().attr("data-title", "dateTimeTitle");
            element.parent().parent().attr("cancel-Click", "cancelClick");
            element.parent().parent().attr("element", elementName);
            element.parent().parent().attr(inputType, "");
            if (that.TimeMode != "SimplifiedTime")
                element.parent().parent().attr("seconds", "");
            var ngmodel = that.DataField + that.Options.RowNum;
            element.parent().parent().attr("ng-model", ngmodel);
            ionic.$compile(element.parent().parent())(ionic.$scope);
            ionic.$scope[ngmodel] = displayDate;
            ionic.$scope.$watch(ngmodel, function (newVal, oldVal) {
                var flag = true;
                if (newVal == undefined || newVal.toString() == "Invalid Date") {
                    return;
                }
                if (!_OnlyTime && (that.MinValue && that.MaxValue)) {
                    var formaterNewVal = new Date(newVal);
                    var formaterMinDate = new Date(that.MinValue.replace("-","/"));
                    var formaterMaxDate = new Date(that.MaxValue.replace("-", "/"));
                    if (formaterNewVal < formaterMinDate || formaterNewVal > formaterMaxDate) {
                        //alert(SheetLanguages.Current.SheetTimeDateRange + "：<br/>" + formaterMinDate.format("yyyy-MM-dd") + " ~ " + formaterMaxDate.format("yyyy-MM-dd"));
                        let myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.show({
                            title: '',
                            template: SheetLanguages.Current.SheetTimeDateRange + "：<br/>" + formaterMinDate.format("yyyy-MM-dd") + " ~ " + formaterMaxDate.format("yyyy-MM-dd"),
                        });
                        $.MvcSheetUI.IonicFramework.$timeout(function () {
                            myPopup.close(); 
                        }, 2000);
                        flag = false;
                    }
                }

                if (!newVal || !flag) {
                    that._SetValue("");
                    flag = true;
                }
                else {
                    that._SetValue(new Date(newVal));
                }


                that.RunScript(element, that.OnChange);
                //修改不触发onchang事件问题
                element.change();
                that.Validate();
            });
        },
        MobilePreBack: function () {
            //返回时，检查wdatepicker是否关闭
            if ($dp && typeof ($dp.hide) == "function") {
                $dp.hide();
            }
            return true;
        },
        //根据TimeMode返回对应格式的字符串
        _getDateTimeFormatString: function (dateTime) {
            if (!dateTime) {
                return "";
            }
            var month = dateTime.getMonth() + 1 < 10 ? ("0" + (dateTime.getMonth() + 1)) : (dateTime.getMonth() + 1);
            var day = dateTime.getDate() < 10 ? ("0" + dateTime.getDate()) : dateTime.getDate();
            var hour = dateTime.getHours() < 10 ? ("0" + dateTime.getHours()) : dateTime.getHours();
            var minute = dateTime.getMinutes() < 10 ? ("0" + dateTime.getMinutes()) : dateTime.getMinutes();
            var second = dateTime.getSeconds() < 10 ? ("0" + dateTime.getSeconds()) : dateTime.getSeconds();

            var date = dateTime.getFullYear() + "-" + month + "-" + day;
            var time = hour + ":" + minute + ":" + second;
            var stime = hour + ":" + minute;
            switch (this.TimeMode) {
                case "OnlyDate":
                    return date;
                    break;
                case "FullTime":
                    return date + " " + time;
                    break;
                case "OnlyTime":
                    return time;
                    break;
                case "SimplifiedTime":
                    return date + " " + stime;
                    break;
                default:
                    return date;
                    break;
            }
        },

        //构造WdatePickerJson
        _getWdatePickerJson: function () {
            var onlyTimeMode = false;//add by hxc
            if (this.WdatePickerJson != "") {
                return this.WdatePickerJson;
            } else {
                var p = "";
                switch (this.TimeMode) {
                    case "OnlyDate":
                        p += "dateFmt:'yyyy-MM-dd'";
                        break;
                    case "FullTime":
                        p += "dateFmt:'yyyy-MM-dd HH:mm:ss'";
                        break;
                    case "OnlyTime":
                        p += "dateFmt:'HH:mm:ss'";
                        onlyTimeMode = true;
                        break;
                    case "SimplifiedTime":
                        p += "dateFmt:'yyyy-MM-dd HH:mm'";
                        break;
                    default:
                        p += "dateFmt:'yyyy-MM-dd'";
                        break;
                }

                var minValue;
                if (this.MinValue != "") {
                    if (this.MinValue == "CurrentTime") {
                        minValue = new Date();
                    } else {
                        var ms = Date.parse(this.MinValue.replace(/-/g, "/"));
                        if (!isNaN(ms)) {
                            minValue = new Date(ms);
                        } else {
                            var $control = $(":text[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() +
                                "='" + this.MinValue + "']");
                            if ($control) {
                                var ms = Date.parse($control.val().replace(/-/g, "/"));
                                if (!isNaN(ms)) {
                                    minValue = new Date(ms);
                                }
                            }
                        }
                    }
                }
                if (minValue != undefined && !onlyTimeMode) {
                    p += ",minDate:'" + this._getDateTimeFormatString(minValue) + "'";
                }

                var maxValue;
                if (this.MaxValue != "") {
                    if (this.MaxValue == "CurrentTime") {
                        maxValue = new Date();
                    } else {
                        var ms = Date.parse(this.MaxValue.replace(/-/g, "/"));
                        if (!isNaN(ms)) {
                            maxValue = new Date(ms);
                        } else {
                            var $control = $(":text[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() +
                                "='" + this.MaxValue + "']");
                            if ($control) {
                                var ms = Date.parse($control.val().replace(/-/g, "/"));
                                if (!isNaN(ms)) {
                                    maxValue = new Date(ms);
                                }
                            }
                        }
                    }
                }
                if (maxValue != undefined && !onlyTimeMode) {
                    p += ",maxDate:'" + this._getDateTimeFormatString(maxValue) + "'";
                }
                console.log("{" + p + "}");
                return "{" + p + "}";
            }
        },
        GetText: function () {
            return $(this.Element).val().replace(/T/g, " ").replace(/Z/g, "");
        },
        SetValue: function (obj) {
            if (obj) {
                if (Array.isArray(obj) && obj.length === 1) {
                    obj = obj[0];
                }
                if (obj) {
                    var stamp = Date.parse(obj.replace(/T/g, " ").replace(/-/g, "/"));
                    if (!isNaN(stamp)) {
                        var date = new Date(stamp);
                        $(this.Element).val(this._getDateTimeFormatString(date));
                    }
                }
            }
        },
        _SetValue: function (obj) {
            //if (obj) {
            var value = this._getDateTimeFormatString(obj);
            value = value.replace("T", " ");
            $(this.Element).val(value);
            //  }
        },
        GetValue: function () {
            var v = null;
            if (this.Editable) {
                v = $(this.Element).val();
            } else {
                v = $(this.Element).siblings('label').html();
            }
            return v;
        },
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;

            if (this.DataField) {
                var dataFieldItem = $.MvcSheetUI.GetSheetDataItem(this.DataField);
                if (dataFieldItem) {
                    var value = $(this.Element).val();
                    // if (dataFieldItem.V != value)
                    {
                        result[this.DataField] = dataFieldItem;
                        result[this.DataField].V = value;
                    }
                } else {
                    if (this.DataField.indexOf(".") == -1) { alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField); }
                }
            }
            return result;
        }
    });
})(jQuery);