//复选框

(function ($) {
    $.fn.SheetCheckboxList = function () {
        return $.MvcSheetUI.Run.call(this, "SheetCheckboxList", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetCheckboxList = function (element, ptions, sheetInfo) {
        this.CheckListDisplay = [];
        $.MvcSheetUI.Controls.SheetCheckboxList.Base.constructor.call(this, element, ptions, sheetInfo);

    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetCheckboxList.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            if (!this.Visiable) {
                $(this.Element).hide();
                return;
            }

            // 渲染前端
            this.HtmlRender();

            // 初始化默认值
            this.InitValue();

            // 校验操作
            this.Validate();
        },

        //获取值
        GetValue: function () {
            var value = "";
            $(this.Element).find("input").each(function () {
                if (this.checked)
                    value += $(this).val() + ";";
            });
            if (this.IsMobile && !value)
                value = this.DataItem.V;
            return value;
        },

        //移动内容
        MobileAddItem: function (value, text, isDefault) {
            this.CheckListDisplay.push({ text: text, value: value, checked: isDefault });
        },
        //设置控件的值
        SetValue: function (value) {
            if (Array.isArray(value) && value.length == 1) {
                value = value[0];
            }
            if (value) {
                var items = value.split(';');
            }
            //value为""或undefined
            if (this.IsMobile && value !== undefined) {
                $(this.Element).find("input").each(function () {
                    $(this).prop("checked", false);
                });
            }

            if (items != undefined) {
                for (var i = 0; i < items.length; i++) {
                    $(this.Element).find("input").each(function () {
                        if (this.value == items[i])
                            $(this).prop("checked", true);
                    });
                }
            }
            if (this.IsMobile) {
                if (this.OnChange) {
                    this.RunScript(this, this.OnChange);
                }

                this.Mask.text(this.GetText());
                if (this.Editable) {
                    if (this.Mask.text() == '' || this.Mask.text() == SheetLanguages.Current.PleaseSelect) {
                        debugger;
                        this.Mask.text(SheetLanguages.Current.PleaseSelect);
                        this.Mask.css({ 'color': '#797f89' });
                    }else{
                        this.Mask.css({ 'color': '#2c3038' });
                    }
                }
            }
            //手动触发change事件,以触发联动
            $(this.Element).trigger("change");
        },
        GetText: function () {
            var text = "";
            $(this.Element).find("input").each(function () {
                if (this.checked) {
                    if (text) text += ",";
                    text += $(this).next().text();
                }
            });

            //if (this.OnChange) {
            //    this.RunScript(this, this.OnChange);
            //}
            return text;
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

        InitValue: function () {
            //设置默认值
            var _that = this;
            var items = undefined;
            var texts = "";
            if (this.V == undefined || this.V == "") {
                if (this.SelectedValue == undefined || this.SelectedValue == "") return;
                items = this.SelectedValue.split(';');
            }
            else {
                items = this.V.split(';');
            }
            if (items != undefined) {
                $(this.Element).find("input").each(function () {
                    $(this).prop("checked", false);
                });
                for (var i = 0; i < items.length; i++) {
                    $(this.Element).find("input").each(function () {
                        if (this.value == items[i]) {
                            if (texts) texts += "、";
                            texts += $(this).next().text();
                            $(this).prop("checked", true);
                        }
                    });

                    if (_that.IsMobile) {
                        var isChecked = false;
                        for (var x in this.CheckListDisplay) {
                            if (this.CheckListDisplay[x].value == items[i]) {
                                this.CheckListDisplay[x].checked = true;
                            }
                        }
                    }
                }
            }

            if (this.IsMobile) {

                if (this.Editable) {
                    this.Mask.html(texts);
                }
                else {
                    //移动端不可编辑
                    $(this.Element).html(texts);
                }
            }
        },

        MobileInit: function () {
            //跳转到查询页面
            var that = this;
            var ionic = $.MvcSheetUI.IonicFramework;
            //复选框控件使用
            if (this.Editable) {
                that.Mask.attr("data-tap-disabled", "true");//处理tap影响第二次点击
                //只往上一级，只能通过控件绑定click事件，防止DisplayRule属性存在时出现异常
                $(this.Element).parent().unbind('click.MobileCheckListBox').bind("click.MobileCheckListBox", function () {
                    ionic.$ionicModal.fromTemplateUrl(_PORTALROOT_GLOBAL+'/Mobile/form/templates/checkbox_popover.html', {
                        scope: ionic.$scope
                    }).then(function (popover) {
                        popover.scope.header = that.N;
                        popover.scope.CheckListDisplay = that.CheckListDisplay;
                        popover.show();
                        popover.scope.hide = function () {
                            popover.hide();
                            that.Validate();
                        };
                        popover.scope.checkAllSelected = function () {
                            popover.scope.allSelected = true;
                            for (item in popover.scope.CheckListDisplay) {
                                if (popover.scope.CheckListDisplay[item].checked == false) {
                                    popover.scope.allSelected = false;
                                }
                            }
                        };

                        popover.scope.checkAllSelected();

                        popover.scope.clickCheckList = function () {
                            var val = that.MobileGetCheckListValue(popover.scope.CheckListDisplay);
                            that.SetValue(val);
                            popover.scope.checkAllSelected();
                        };
                        popover.scope.selectAll = function () {
                            for (item in popover.scope.CheckListDisplay) {
                                popover.scope.CheckListDisplay[item].checked = true;
                            }
                            var val = that.MobileGetCheckListValue(popover.scope.CheckListDisplay);
                            that.SetValue(val);
                            popover.scope.allSelected = true;
                        };
                        popover.scope.unSelectAll = function () {
                            for (item in popover.scope.CheckListDisplay) {
                                popover.scope.CheckListDisplay[item].checked = false;
                            }
                            var val = that.MobileGetCheckListValue(popover.scope.CheckListDisplay);
                            that.SetValue(val);
                            popover.scope.allSelected = false;
                        };
                        popover.scope.searchFocus = false;
                        popover.scope.searchAnimate = function () {
                            popover.scope.searchFocus = !popover.scope.searchFocus;
                        };
                        popover.scope.searChange = function () {
                            popover.scope.searchNum = $(".active .popover .list").children('label').length;
                        };
                    });
                    return;
                })
            }
        },

        MobileGetCheckListValue: function (display) {
            var v = [];
            if (display && display.length > 0) {
                for (var d in display) {
                    var od = display[d];
                    if (od.checked) { v.push(od.value) };
                }
            }
            if (v.length == 0) { return ''; }
            return v.join(';');
        },

        HtmlRender: function () {
            var that = this;
            //组标示
            if (!this.Visiable) { $(this.Element).hide(); return; }
            $(this.Element).addClass("SheetCheckBoxList");
            this.SheetGropName = this.DataField + "_" + Math.floor(Math.random() * 1000);//设置统一的name

            // 显示红色*号提示
            if (this.Editable && this.Required && !$(this.Element).val() && !this.IsMobile) {
                this.AddInvalidText(this.Element, "*", false);
            }
            var existedHtml = $(this.Element).html();

            $(this.Element).html("");

            if (this.MasterDataCategory) {
                var that = this;
                var cmdParam = JSON.stringify([this.MasterDataCategory]);
                if ($.MvcSheetUI.CacheData && $.MvcSheetUI.CacheData[cmdParam]) {
                    var cacheData = $.MvcSheetUI.CacheData[cmdParam];
                    for (var key in cacheData) {
                        that.AddCheckboxItem.apply(that, [cacheData[key].Code, cacheData[key].EnumValue, cacheData[key].IsDefault]);
                    }
                    that.InitValue.apply(that);

                    that.DoRepeatDirection.apply(that);
                    if (that.IsMobile) {
                        that.MobileInit.apply(that);
                    }
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
                                $.MvcSheetUI.CacheData[cmdParam] = data;

                                for (var i = 0, len = data.length; i < len; i++) {
                                    that.AddCheckboxItem.apply(that, [data[i].Code, data[i].EnumValue, data[i].IsDefault]);
                                }
                            }
                            //初始化默认值
                            that.InitValue.apply(that);
                            that.DoRepeatDirection.apply(that);
                            if (that.IsMobile) {
                                that.MobileInit.apply(that);
                            }
                            if ($.MvcSheetUI.MvcRuntime != null) {
                                $.MvcSheetUI.MvcRuntime.Display.Run($("body"));
                            }
                        }, null, this.DataField.indexOf(".") == -1);
                }
            }
            else if (this.DefaultItems) {
                var items = this.DefaultItems.split(';');
                for (var i = 0; i < items.length; i++) {
                    that.AddCheckboxItem.apply(that, [items[i], items[i], false]);
                }
                this.InitValue();
                if (that.IsMobile) {
                    that.MobileInit.apply(that);
                }
                this.DoRepeatDirection();
            }
            else {
                $(this.Element).html(existedHtml);
                this.InitValue();
                if (that.IsMobile) {
                    that.MobileInit.apply(that);
                }
            }

            //绑定选择事件
            $(that.Element).unbind("click").bind("click", [that], function (e) {
                that.SetInvalidText();
            });
            $(that.Element).unbind("change").bind("change", [that], function (e) {
                e.data[0].RunScript(this, e.data[0].OnChange);
            });
        },

        RenderMobile: function () {
            this.HtmlRender();
            //不可用
            if (!this.Editable) {
                $(this.Element).addClass(this.Css.Readonly);
                if (!this.GetValue())
                    $(this.Element).hide();
            }
            else {
                this.SetValue();
                //var _Mask = this.Mask.text(this.GetText());
                this.Mask.insertAfter($(this.Element));
                this.pupIcon = $("<i class='icon ion-ios-arrow-right'></i>").insertAfter(this.Mask);
                $(this.Element).closest("div.item").addClass("item-icon-right");
                $(this.Element).hide();
            }
        },

        DoRepeatDirection: function () {
            //横向展示
            if (this.RepeatDirection == "Horizontal") {
                //$("div[SheetGropName='" + this.SheetGropName + "']").css("float", "left");
                $(this.Element).find("[SheetGropName='" + this.SheetGropName + "']").css("float", "left");
            }

            //设置行数量
            this.SetColumns();

            //this.SetInvalidText();
        },

        Validate: function (effective, initValid) {
            if (!this.Editable) return true;
            if (initValid || !effective) {
                return this.SetInvalidText(initValid, effective);
            }
            return true;
        },
        //处理必填红色*号
        SetInvalidText: function (initValid, effective) {
            var check = true;
            if (this.Editable && this.Required) {
                check = false;
                var inputs = $(this.Element).find("input");
                for (var i = 0; i < inputs.length; i++) {
                    if ($(inputs[i]).is(":checked")) {
                        check = true;
                        break;
                    }
                }
                if (check) {
                    this.RemoveInvalidText(this.Element, "*", false);
                }
                else {
                    if (effective == false) {
                        this.AddInvalidText(this.Element, "*");
                    } else {
                        this.AddInvalidText(this.Element, "*", false);
                    }
                }
            }

            return check;
        },

        AddCheckboxItem: function (value, text, isDefault) {
            if (text || value) {
                var option = $("<div SheetGropName='" + this.SheetGropName + "'></div>");
                var id = $.MvcSheetUI.NewGuid();
                var checkbox = $("<input type='checkbox' />").attr("name", this.SheetGropName).attr("id", id).val(value);//.text(text || value)
                checkbox.prop("checked", isDefault);
                if (!this.Editable) {//不可用
                    checkbox.prop("disabled", "disabled")
                }
                var label = $("<label for='" + id + "' style=\"padding-left:3px\">" + (text || value) + "</label>");
                $(this.Element).append(option);
                option.append(checkbox);
                option.append(label);
                if (this.IsMobile) {
                    this.MobileAddItem(value, text, isDefault);
                }
            }


        },

        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;
            result[this.DataField] = $.MvcSheetUI.GetSheetDataItem(this.DataField);// this.SheetInfo.BizObject.DataItems[this.DataField];
            if (!result[this.DataField]) {
                if (this.DataField.indexOf(".") == -1) { alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField); }
                return {};
            }
            // if (result[this.DataField].V != this.GetValue())
            {
                result[this.DataField].V = this.GetValue();
                return result;
            }
            return {};
        }
    });
})(jQuery);