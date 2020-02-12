// SheetInstancePrioritySelector控件
(function ($) {
    //控件执行
    $.fn.SheetOriginatorUnit = function () {
        return $.MvcSheetUI.Run.call(this, "SheetOriginatorUnit", arguments);
    };

    $.MvcSheetUI.Controls.SheetOriginatorUnit = function (element, options, sheetInfo) {
        $.MvcSheetUI.Controls.SheetOriginatorUnit.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MvcSheetUI.Controls.SheetOriginatorUnit.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            var $element = $(this.Element);
            var that = this;
            // 绑定change事件
            $element.unbind("change.SheetOriginatorUnit").bind("change.SheetOriginatorUnit", function () {
                if ($.isFunction(that.OnChange)) {
                    that.OnChange.apply(this);
                }
                else {
                    (new Function(that.OnChange)).apply(this);
                }
            });
            var parentUnits = $.MvcSheetUI.SheetInfo.DirectParentUnits;
            if (parentUnits) {
                $element.empty();
                for (var key in parentUnits) {
                    $element.append("<option value='" + key + "'>" + parentUnits[key] + "</option>");
                }
                this.V = $.MvcSheetUI.SheetInfo.OriginatorOU; //当前流程发起人OU
                if (this.V && this.V != "") {
                    $element.val(this.V);
                }

                var length = 0;
                for (var key in $.MvcSheetUI.SheetInfo.DirectParentUnits) {
                    length++;
                }

                // 非发起模式或者不存在兼职情况，则不可编辑
                //if (!this.Originate || length == 1) {
                //非发起环节或者不存在兼职情况，则不可编辑                
                if ($.MvcSheetUI.SheetInfo.ActivityCode != $.MvcSheetUI.SheetInfo.StartActivityCode || length == 1 || $.MvcSheetUI.QueryString("Mode").toLowerCase() == "view") {
                    $element.after("<label style='width:100%;'>" + $element.children("option:selected").text() + "</label>");
                    $element.hide();
                } 
            }
        },
        RenderMobile: function () {

            //返回对象属性的个数
            function countObjectProperties(obj){
                var count=0;
                for(var key in obj){
                    if(obj.hasOwnProperty(key)){
                        count++;
                    }
                }
                return count;
            }

            var $element = $(this.Element);
            var parentUnits = $.MvcSheetUI.SheetInfo.DirectParentUnits;
            $element.empty();
            for (var key in parentUnits) {
                $element.append("<option value='" + key + "'>" + parentUnits[key] + "</option>");
            }
            var ionic = $.MvcSheetUI.IonicFramework;
            var that = this;
            $element.hide();

            var arrowElement = $('<i class="icon ion-ios-arrow-right"></i>');
            var inputLabel = $("<span class='input-label'></span>");
            that.Mask = inputLabel;
            var ParentElement = $element.closest('.detail');
            ParentElement.append(inputLabel);
            ParentElement.append(arrowElement);
            
            
            that.V = $.MvcSheetUI.SheetInfo.OriginatorOU;
            if (that.V && that.V != "") {
                that.Mask.html(parentUnits[that.V]);
                $element.val(that.V);
            }
            
            ParentElement.unbind("click.showSelect").bind("click.showSelect", function () {
                ionic.$ionicModal.fromTemplateUrl(_PORTALROOT_GLOBAL+'/Mobile/form/templates/radio_popover.html', {
                    scope: ionic.$scope
                }).then(function (popover) {
                    popover.scope.header = SheetLanguages.Current.BasicInfo.divOriginateOUName;
                    popover.scope.RadioListDisplay = [];

                    console.log($element.val());
                    popover.scope.RadioListValue = $element.val();

                    for (var key in parentUnits) {
                        var emptyOption = {
                            Value: key,
                            Text: parentUnits[key]
                        };
                        popover.scope.RadioListDisplay.push(emptyOption);
                    }

                    popover.show();
                    popover.scope.hide = function () {
                        popover.hide();
                    }
                    popover.scope.clickRadio = function (value, text) {
                        $element.val(value);
                        $(that.Mask).html(text);
                    }
                    popover.scope.searchFocus = false;
                    popover.scope.searchAnimate = function () {
                        popover.scope.searchFocus = !popover.scope.searchFocus;
                    };
                });
                return;
            });

            var length = countObjectProperties(parentUnits);
            if ($.MvcSheetUI.SheetInfo.ActivityCode != $.MvcSheetUI.SheetInfo.StartActivityCode || length == 1 || $.MvcSheetUI.QueryString("Mode").toLowerCase() == "view") {
                that.Mask.text($element.children("option:selected").text());
                arrowElement.hide();
                ParentElement.addClass("uneditableOU");
                ParentElement.unbind("click.showSelect");
            } else {
                ParentElement.addClass("editableOU");
            }

        },
        GetText: function () {
            return $(this.Element).children("option:selected").text();
        },
        // 返回数据值
        SaveDataField: function () {
            $.MvcSheetUI.ParentUnitID = $(this.Element).val();
        }
    });
})(jQuery);