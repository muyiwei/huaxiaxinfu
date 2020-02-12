// SheetInstancePrioritySelector控件
(function ($) {
    //控件执行
    $.fn.SheetInstancePrioritySelector = function () {
        return $.MvcSheetUI.Run.call(this, "SheetInstancePrioritySelector", arguments);
    };

    $.MvcSheetUI.Controls.SheetInstancePrioritySelector = function (element, options, sheetInfo) {
        $.MvcSheetUI.Controls.SheetInstancePrioritySelector.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MvcSheetUI.Controls.SheetInstancePrioritySelector.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            var $element = $(this.Element);
            var that = this;
            //不可见返回
            if (!this.Visiable) {
                $element.hide();
                return;
            }

            //绑定change事件
            $element.unbind("change.SheetInstancePrioritySelector").bind("change.SheetInstancePrioritySelector", function () {
                if ($.isFunction(that.OnChange)) {
                    that.OnChange.apply(this);
                }
                else {
                    (new Function(that.OnChange)).apply(this);
                }
            });

            var priorities = $.MvcSheetUI.SheetInfo.Priorities;
            if (priorities) {
                $element.empty();
                for (var key in priorities) {
                    $element.append("<option value='" + key + "'>" + priorities[key] + "</option>");
                    if (this.IsMobile) {
                        this.AddMobileItem(key, priorities[key], false);
                    }
                }

                this.V = this.V || this.DefaultValue;
                if (this.V && this.V != "") {
                    $element.val(this.V);
                }
                else {
                    $element.val("Normal");
                    console.log('oyeah');
                }

                //不可编辑
                if (!this.Editable) {
                    $element.after("<label style='width:100%;'>" + $element.children("option:selected").text() + "</label>");
                    $element.hide();
                }

                if (this.IsMobile && this.Editable)
                    this.ionicInit($.MvcSheetUI.IonicFramework);
            }
        },
        RenderMobile: function () {
            //可编辑
            this.MobileOptions = [];
            if (this.Editable) {
                this.constructor.Base.RenderMobile.apply(this);
                this.pupIcon = $("<i class='icon ion-ios-arrow-right'></i>").insertAfter(this.Mask);
                $(this.Element).closest("div.item").addClass("item-icon-right");
                $(this.Element).hide();
            }
            else {
                this.Render();
            }
        },

        ionicInit: function (ionic) {
            var that = this;
            $(this.Element.parentElement.parentElement).unbind('click.showChoice').bind('click.showChoice', function (e) {
                ionic.$ionicModal.fromTemplateUrl(_PORTALROOT_GLOBAL+'/Mobile/form/templates/radio_popover.html', {
                    scope: ionic.$scope
                }).then(function (popover) {                    
                    popover.scope.RadioListDisplay = that.MobileOptions;
                    popover.scope.RadioListValue = that.GetValue();
                    popover.show();
                    popover.scope.hide=function(){
                        popover.hide();
                    }
                    popover.scope.clickRadio = function (value, text) {
                        that.SetValue(value);
                        $(that.Mask).html(text);
                        that.Validate();
                    }
                    popover.scope.reset = function () {
                        popover.scope.RadioListValue = that.DefaultValue;
                        that.SetValue(that.DefaultValue);
                        for (var i = 0; i < that.MobileOptions.length; i++) {
                            if (that.MobileOptions[i].Value === that.DefaultValue)
                                $(that.Mask).html(that.MobileOptions[i].Text);//获取对应的text值
                        }
                        that.Validate();
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

            if (that.IsMobile) {
                var text = that.GetText();
                if (that.Editable) {
                    that.Mask.html(text);
                    $(that.Mask).css({ 'color': '#2c3038' });
                }
                else {
                    //移动端不可编辑
                    $(that.Element).html(text);
                }
            }
        },
        AddMobileItem: function (value, text, isDefault) {
            var MobileOption = {
                DataField: this.DataField,
                Value: value,
                Text: text
            };
            this.MobileOptions.push(MobileOption);
        },
        GetText: function () {
            return $(this.Element).children("option:selected").text();
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
            if (result[this.DataField].V != $(this.Element).val()) {
                $.MvcSheetUI.Priority = $(this.Element).val();
                result[this.DataField].V = $(this.Element).val();
                return result;
            }
            return {};
        }
    });
})(jQuery);