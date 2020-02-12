// RadioButtonList控件
; (function ($) {
    //控件执行
    $.fn.SheetRadioButtonList = function () {
        return $.MvcSheetUI.Run.call(this, "SheetRadioButtonList", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetRadioButtonList = function (element, ptions, sheetInfo) {
        $.MvcSheetUI.Controls.SheetRadioButtonList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetRadioButtonList.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            //不可见返回
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }

            //渲染前端
            this.HtmlRender();

            //绑定选择事件
            $(this.Element).unbind("change.SheetRadioButtonList").bind("change.SheetRadioButtonList", [this], function (e) {
                //e.data[0].RemoveInvalidText(e.data[0].Element, "*", false);
                //debugger
                e.data[0].Validate();
                e.data[0].RunScript(this, e.data[0].OnChange);
            });
        },

        GetValue: function () {
            var value = "";
            $(this.Element).find("input").each(function () {
                if (this.checked)
                    value = $(this).val();
            });
            return value;
        },

        //设置控件的值
        SetValue: function (value) {
            $(this.Element).find("input").each(function () {
                if (this.value == value)
                    $(this).prop("checked", "checked");
            });
            if (this.IsMobile) {
                this.Mask.text(this.GetText());
                if (this.OnChange) {
                    this.RunScript(this, this.OnChange);
                }
                if (this.Editable) {
                    if (this.Mask.text() == '' || this.Mask.text() == SheetLanguages.Current.PleaseSelect) {
                        this.Mask.text(SheetLanguages.Current.PleaseSelect);
                        this.Mask.css({ 'color': '#797f89' });
                    } else {
                        this.Mask.css({ 'color': '#2c3038' });
                    }
                }
            }
            //手动触发change事件,以触发联动
            $(this.Element).trigger("change");
        },
        GetText: function () {
            if (this.OnChange) {
                this.RunScript(this, this.OnChange);
            }
            return $(this.Element).find("input:checked").next().text();
        },
        SetReadonly: function (flag) {
            if (flag) {
                $(this.Element).find("input").prop("disabled", true);
            }
            else {
                $(this.Element).find("input").prop("disabled", false);
            }
        },

        //设置一行显示数目
        SetColumns: function () {
            if (this.RepeatColumns && /^([1-9]\d*)$/.test(this.RepeatColumns)) {
                var width = (100 / this.RepeatColumns) + "%";
                var divs = $(this.Element).find("div"),
                    i;
                for (i = 0; i < divs.length; i++) {
                    $(divs[i]).css({ "width": width });
                }
            }
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;
            result[this.DataField] = this.SheetInfo.BizObject.DataItems[this.DataField];
            if (!result[this.DataField]) {
                alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField);
                return {};
            }

            // if (result[this.DataField].V != this.GetValue())
            {
                result[this.DataField].V = this.GetValue();
                return result;
            }
            return {};
        },

        //设置默认值
        InitValue: function () {
            if (this.SheetInfo.SheetMode == $.MvcSheetUI.SheetMode.Originate && !this.V) {
                if (this.DefaultSelected) {
                    if ($(this.Element).find("input:checked").length === 0) {
                        $(this.Element).find("input").first().prop("checked", "checked");
                        this.V = $(this.Element).find("input").first().val();
                    }
                    // 如果设置了SelectedValue，其优先级大于数据字典的默认值
                    if (this.SelectedValue) {
                        if ($(this.Element).find("input[type='radio'][value='" + this.SelectedValue + "']").length == 1) {
                            $(this.Element).find("input[type='radio'][value='" + this.SelectedValue + "']").prop("checked", "checked");
                            this.V = $(this.Element).find("input[type='radio'][value='" + this.SelectedValue + "']").val();
                        }
                    }
                }
            }

            $(this.Element).find("input[type='radio'][value='" + this.V + "']").prop("checked", "checked");

            if (this.IsMobile) {
                var text = $(this.Element).find("input[type='radio'][value='" + this.V + "']").text();
                if (!text) {
                    text = $(this.Element).find("input[type='radio'][value='" + this.V + "']").parent().find("label").text();
                }
                if (this.Editable) {
                    this.Mask.html(text);
                }
                else {
                    //移动端不可编辑
                    $(this.Element).html(text);
                }
            }
        },

        HtmlRender: function () {
            if (!this.Visiable) { $(this.Element).hide(); return; }
            $(this.Element).addClass("SheetRadioButtonList");
            //组标示
            //this.SheetGropName = this.DataField + "_" + Math.floor(Math.random() * 1000);//设置统一的name                        
            this.SheetGropName = this.DataField + "_" + $.MvcSheetUI.NewGuid();//设置统一的name                        

            var existedHtml = $(this.Element).html();

            $(this.Element).html("");

            if (this.MasterDataCategory) {
                var that = this;
                var cmdParam = JSON.stringify([this.MasterDataCategory]);
                if ($.MvcSheetUI.CacheData && $.MvcSheetUI.CacheData[cmdParam]) {
                    var cacheData = $.MvcSheetUI.CacheData[cmdParam];
                    for (var key in cacheData) {
                        that.AddRadioItem.apply(that, [cacheData[key].Code, cacheData[key].EnumValue, cacheData[key].IsDefault]);
                    }
                    that.InitValue.apply(that);
                    that.DoRepeatDirection.apply(that);
                    if (that.IsMobile && that.Editable)
                        that.ionicInit($.MvcSheetUI.IonicFramework);
                }
                else {
                    $.MvcSheet.GetSheet({
                        "Command": "GetMetadataByCategory",
                        "Param": cmdParam
                    },
                        function (data) {
                            if (data) {
                                //将数据缓存
                                if (!$.MvcSheetUI.CacheData) { $.MvcSheetUI.CacheData = {}; }
                                if (data.Successful != null && !data.Successful) {// 执行报错则输出日志
                                    return;
                                }
                                $.MvcSheetUI.CacheData[cmdParam] = data;

                                for (var i = 0, len = data.length; i < len; i++) {
                                    that.AddRadioItem.apply(that, [data[i].Code, data[i].EnumValue, data[i].IsDefault]);
                                }
                            }
                            //初始化默认值
                            that.InitValue.apply(that);
                            that.DoRepeatDirection.apply(that);
                            if (that.IsMobile && that.Editable)
                                that.ionicInit($.MvcSheetUI.IonicFramework);
                            if ($.MvcSheetUI.MvcRuntime != null) {
                                $.MvcSheetUI.MvcRuntime.Display.Run($("body"));
                            }
                        }, null, this.DataField.indexOf(".") == -1);
                }
            }
            else if (this.DefaultItems) {
                var items = this.DefaultItems.split(';');
                for (var i = 0; i < items.length; i++) {
                    this.AddRadioItem.apply(this, [items[i], items[i], false]);
                }
                this.InitValue();
                this.DoRepeatDirection();
                if (this.IsMobile && this.Editable)
                    this.ionicInit($.MvcSheetUI.IonicFramework);
            }
            else {
                $(this.Element).html(existedHtml);
                this.InitValue();
                if (this.IsMobile && this.Editable)
                    this.ionicInit($.MvcSheetUI.IonicFramework);
            }
            //add by hxc
            if (this.DefaultSelected) {
                $(this.Element).find("input").trigger("change");
            }

        },

        //SetCheckView: function (item, value, checkitem) {  //不可编辑时,设置图标字体
        //    var checkbox = $("<i class='icon-checkbox-unchecked'></i>");
        //    if (this.Editable) {
        //        checkbox = $("<input type='radio' />");
        //    }
        //    else {
        //        if (this.V) {
        //            if (checkitem == value) {
        //                checkbox = $("<i class='icon-checkbox-checked'></i>");
        //            }
        //        }
        //    }
        //    this.AddRadioItem.apply(this, [checkbox, value, item])
        //},

        RenderMobile: function () {
            this.MobileOptions = [];
            this.HtmlRender();
            //不可用
            if (!this.Editable) {
                $(this.Element).addClass(this.Css.Readonly);
            }
            else {
                this.MoveToMobileContainer();
                this.pupIcon = $("<i class='icon ion-ios-arrow-right'></i>").insertAfter(this.Mask);
                $(this.Element).closest("div.item").addClass("item-icon-right");
                $(this.Element).hide();
                this.SetValue();
            }
        },

        ionicInit: function (ionic) {
            var that = this;
            that.Mask.attr("data-tap-disabled", "true");//处理tap影响第二次点击
            //只往上一级，只能通过控件绑定click事件，防止DisplayRule属性存在时出现异常
            $(this.Element.parentElement).unbind('click.showChoice').bind('click.showChoice', function (e) {
                ionic.$ionicModal.fromTemplateUrl(_PORTALROOT_GLOBAL+'/Mobile/form/templates/radio_popover.html', {
                    scope: ionic.$scope
                }).then(function (popover) {
                    popover.scope.header = that.N;
                    popover.scope.RadioListDisplay = that.MobileOptions;
                    popover.scope.RadioListValue = that.GetValue();
                    popover.show();
                    popover.scope.hide = function () {
                        popover.hide();
                    };
                    popover.scope.clickRadio = function (value, text) {
                        for (var i = 0; i < $(that.Element).find("input").length; i++) {
                            if ($($($(that.Element).find("input"))[i])[0].value === text)
                                //触发原始radio的change事件
                                $(that.Element).find("input").trigger("change");
                        }
                        that.SetValue(value);
                        $(that.Mask).html(text);
                        that.Validate();
                        $(that.Element).find("input").trigger("change", text);

                    };
                    popover.scope.reset = function () {
                        that.InitValue.apply(that);
                        popover.hide();
                    }
                    popover.scope.searchFocus = false;
                    popover.scope.searchAnimate = function () {
                        popover.scope.searchFocus = !popover.scope.searchFocus;
                    };
                    popover.scope.searChange = function () {
                        popover.scope.searchNum = $(".active .popover .list").children('label').length;
                    };

                });
                return;
            });
        },

        DoRepeatDirection: function () {
            //横向展示
            if (this.RepeatDirection == "Horizontal") {
                $(this.Element).find("[SheetGropName='" + this.SheetGropName + "']").css("float", "left");
            }

            //设置一行显示数目
            this.SetColumns();

            // 显示红色*号提示
            if (this.Editable && this.Required) {
                var inputs = $(this.Element).find("input");
                for (var i = 0; i < inputs.length; i++) {
                    if ($(inputs[i]).prop("checked"))
                        this.RemoveInvalidText(this.Element, "*", false);
                }
            }
        },

        AddRadioItem: function (value, text, isDefault) {
            if (text || value) {
                var option = $("<div SheetGropName='" + this.SheetGropName + "'></div>");
                var id = $.MvcSheetUI.NewGuid();
                var radio = $("<input type='radio' />").prop("name", this.SheetGropName).prop("id", id).val(value);//.text(text || value)
                if (this.DefaultSelected) {
                    radio.prop("checked", isDefault);
                }
                if (!this.Editable) {//不可用
                    radio.prop("disabled", true);
                }
                var span = $("<label for='" + id + "'  style=\"padding-left:3px\">" + (text || value) + "</label>");
                $(this.Element).append(option);
                option.append(radio);
                option.append(span);
                if (this.IsMobile) {
                    option.attr("style", "display:none;");
                    var MobileOption = {
                        DataField: this.DataField,
                        Value: value,
                        Text: text
                    };
                    this.MobileOptions.push(MobileOption);
                }
            }
        }
    });
})(jQuery);