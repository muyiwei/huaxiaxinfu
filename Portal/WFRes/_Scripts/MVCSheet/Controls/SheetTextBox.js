/// <reference path="../MvcSheetUI.js" />

//文本框(SheetTextBox/SheetBizTextBox/SheetTime)
(function ($) {
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.SheetTextBox = function () {
        return $.MvcSheetUI.Run.call(this, "SheetTextBox", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetTextBox = function (element, options, sheetInfo) {
        this.TextRightAlign = false; // 全局是否右对齐
        this.NumberRightAlign = false; // 数值是否右对齐
        $.MvcSheetUI.Controls.SheetTextBox.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetTextBox.Inherit($.MvcSheetUI.IControl, {
        //控件渲染函数
        Render: function () {
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }
            // 查看痕迹
            if (this.TrackVisiable && !this.Originate && this.DataField.indexOf(".") == -1) { this.RenderDataTrackLink(); }
            // 移动端设置PlaceHolder
            if (this.IsMobile) {
                this.PlaceHolder = this.PlaceHolder || SheetLanguages.Current.PleaseInput;
                // 微信端点击显示日期控件
                if ($.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "wechat") {
                    this.Element.addEventListener("touchstart", function () {
                        event.stopPropagation();
                    });
                }
            }
            $(this.Element).attr("PlaceHolder", this.PlaceHolder);

            if ($.MvcSheetUI.SheetInfo.SheetMode == $.MvcSheetUI.SheetMode.Originate && !this.V) {
                if (this.DefaultValue) {
                    if (this.DefaultValue.indexOf("{") > -1 && this.DefaultValue.indexOf("}") > -1) {
                        var datafield = this.DefaultValue.replace("{", "").replace("}", "");
                        if (datafield) {
                            var data = $.MvcSheetUI.GetSheetDataItem(datafield, 0);
                            if (data)
                                $(this.Element).val(data.V);
                        }
                    } else
                        $(this.Element).val(this.DefaultValue);
                } else
                    $(this.Element).val("");
                //$(this.Element).val(this.DefaultValue || "");
                if (!this.DefaultValue && this.V !== "") {
                    this.SetValue(this.V);
                }
            } else {
                this.SetValue(this.V);
            }

            if (!this.Editable) { // 不可编辑
                this.SetReadonly(true);
                return;
            }
            if (this.TextRightAlign) $(this.Element).addClass("txtAlignRight");
            else if (this.NumberRightAlign && this.IsNubmer()) { $(this.Element).addClass("txtAlignRight"); }
            if (this.ToolTip) $(this.Element).attr("title", this.ToolTip);

            // 注册KeyDown事件
            $(this.Element).unbind("change.SheetTextBox").bind("change.SheetTextBox", [this], function (e) {
                e.data[0]._OnChange();
            });


            // 绑定焦点事件
            $(this.Element).unbind("focus.SheetTextBox").bind("focus.SheetTextBox", [this],
                function (e) {
                    if (e.data[0].FormatRule) {
                        this.value = this.value.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                    }
                    if (e.data[0].OnFocus) {
                        e.data[0].RunScript(this, e.data[0].OnFocus);
                    }
                });
            // 注册KeyUp事件
            if (this.OnKeyUp) {
                $(this.Element).unbind("keyup.SheetTextBox").bind("keyup.SheetTextBox", [this], function (e) {
                    e.data[0].RunScript(this, e.data[0].OnKeyUp);
                });
            }
            // 注册KeyDown事件

            $(this.Element).unbind("keydown.SheetTextBox").bind("keydown.SheetTextBox", [this], function (e) {
                if (e.key == "Enter") return false;
                if (e.data[0].OnKeyDown) {
                    e.data[0].RunScript(this, e.data[0].OnKeyDown);
                }
            });
            // 失去焦点事件
            $(this.Element).unbind("blur.SheetTextBox").bind("blur.SheetTextBox", [this], function (e) {
                if (e.data[0].FormatRule) {
                    e.data[0].GetFromatValue($(e.data[0].Element), e.data[0].GetValue());
                }
            });

            if (this.IsMobile) {
                //移动端的开窗查询
                this._mobilePopup();
            } else {
                this._createPopup();
            }
            //this.Validate();
        },
        IsNubmer: function () {
            return (this.LogicType == 7 || this.LogicType == 9 || this.LogicType == 35);
        },
        SetValue: function (v) {
            $(this.Element).val(v);
            $(this.Element).change();
            if (this.FormatRule) {
                this.GetFromatValue($(this.Element), v);
            }
            //移动
            if (this.IsMobile) {
                this.Mask.html(this.GetText());
            }
        },
        //移动端开窗
        _mobilePopup: function () {
            if (this.PopupWindow == "None") return;

            //1.隐藏当前输入框
            //2.增加显示返回值 a
            //3.增加图标提示点击事件
            //4.item 添加样式 item-icon-right
            //this.ViewInNewContainer = $(this.Element).parent();
            this.ID = $(this.Element).attr("Id");
            $(this.Element).hide();
            $(this.Element).parent().find("[id*=mask]").remove();
            $(this.Element).parent().find("i.icon").remove();
            this.Mask = $("<span></span>").insertAfter(this.Element).attr("id", "mask_" + this.ID);
            this.Mask.text(this.GetText());
            this.Mask.insertAfter(this.Element).attr("id", "mask_" + this.ID);
            var _that = this;
            if (_that.Editable) {
                this.pupIcon = $("<i class='icon ion-ios-arrow-right'></i>").insertAfter(this.Mask);
                $(this.Element).closest("div.item").addClass("item-icon-right");
                $(this.Element).parent().parent().unbind("click.query").bind("click.query", function () {
                    //跳转到查询页面
                    //choosedid用来确认是哪个项目被选中 暂取消
                    //var choosedid = _that.Element.dataset["choosedid"];//outmapping字段所选择的id
                    $.MvcSheetUI.IonicFramework.$state.go("form.sheetquery", { datafield: _that.DataField, rownum: $(this).find("[data-datafield='" + _that.DataField + "']").attr("data-row") }); // , objectid: choosedid
                })
            }

        },
        AfterMobileEditShow: function () {
            if (this.PopupElement)
                this.PopupElement.SheetQuery().AfterMobileEditShow();
        },
        _createPopup: function () {
            var that = this;
            //开窗查询(DisplayText SchemaCode QueryCode InputMappings OutputMappings)
            if (this.PopupWindow == "PopupWindow") { //弹窗模式
                var displayText = this.DisplayText == "" ? "&nbsp;" : this.DisplayText;
                var popupDivId = "popupLink" + (new Date()).getTime();
                var outputParams = "";
                if (this.OutputMappings != "") {
                    outputParams = "&OutputParams=" + encodeURI(this.OutputMappings.replace(/,/g, "|").replace(/:/g, ","));
                }
                var w = that.PopupWidth ? that.PopupWidth : "600px";
                var h = that.PopupHeight ? that.PopupHeight : "400px";
                //弹窗div
                var popupDiv = "<div id='" + popupDivId + "' class='modal fade' tabindex='-1' role='dialog' aria-hidden='true'>"
                popupDiv += "<div class='modal-dialog'>";
                popupDiv += "<div class='modal-content' style='width:" + w + ";'>";
                popupDiv += "<div class='modal-header'>";
                popupDiv += "<button type='button' class='close' data-dismiss='modal'>";
                popupDiv += "<span aria-hidden='true'>&times;</span></button>";
                popupDiv += "<h4 class='modal-title'>" + displayText + "</h4>";
                popupDiv += "</div><div class='modal-body'>";
                popupDiv += "<iframe scrolling='no' frameborder='0' width='100%' height='" + h + "'></iframe>";
                popupDiv += "</div></div></div></div>";
                popupDiv = $(popupDiv);
                //弹窗按钮
                var popupLink = $("<a href='javascript:;' class='popLink'>" + displayText + "</a>");
                popupLink.click(function () {
                    var src = that.PortalRoot + "/admin/TabMaster.html?url=ListMasterData.html&OpenType=1&IsPopup=1&SchemaCode=" + that.SchemaCode +
                        "&QueryCode=" + that.QueryCode + "&CtrlID=" + popupDivId + outputParams + that._getInputParam();
                    popupDiv.find("iframe").attr("src", src);
                    popupDiv.modal("show");
                });
                //在Element后添加弹窗元素
                $(this.Element).after(popupLink).after(popupDiv);
                //弹窗页面双击回调函数(\Portal\WFRes\_Scripts\bizquery.js)
                window[popupDivId] = {};
                window[popupDivId].ListMasterCallBack = function (data) {
                    //将选择的记录值，赋值到界面元素
                    if (data) {
                        for (var field in data) {
                            $.MvcSheetUI.SetControlValue(field, data[field], that.GetRowNumber());
                        }
                    }
                    //关闭弹窗
                    popupDiv.modal("hide");
                };
            } else if (this.PopupWindow == "Dropdown") { //浮动层模式
                var popupDivId = "popupLink" + (new Date()).getTime();
                var outputParams = "";
                if (this.OutputMappings != "") {
                    outputParams = "&OutputParams=" + encodeURI(this.OutputMappings.replace(/,/g, "|").replace(/:/g, ","));
                }
                //浮动层div
                var popupDiv = $("<div style='display:none;z-index:9999;position:absolute;background-color:#f8f8f8;' id='" + popupDivId + "'><iframe scrolling='no' frameborder='0' width='550px' height='320px'></iframe></div>");
                //在Element后添加弹窗元素
                //  $(this.Element).after(popupDiv);
                setTimeout(function () {
                    if (this.DataField && this.DataField.indexOf(".") > -1) {
                        popupDiv
                            .css("top", $(this.Element).offset().top + $(this.Element).height())
                            .css("left", $(this.Element).offset().left);
                        $("body").append(popupDiv);
                    }
                    else {
                        $(this.Element).after(popupDiv);
                    }
                }.bind(this), 0);
                //给focus事件绑定浮动层方法
                $(this.Element).unbind("focus.Popup").bind("focus.Popup", function () {
                    var src = that.PortalRoot + "/admin/TabMaster.html?url=ListMasterData.html&OpenType=1&IsPopup=1&SchemaCode=" + that.SchemaCode +
                        "&QueryCode=" + that.QueryCode + "&CtrlID=" + popupDivId + outputParams + that._getInputParam();
                    popupDiv.find("iframe").attr("src", src);
                    popupDiv.show();
                    var offset = $(that.Element).offset();
                    popupDiv.offset({ top: offset.top + $(that.Element).outerHeight() + 3, left: offset.left });
                });
                //浮动层双击回调函数(\Portal\WFRes\_Scripts\bizquery.js)
                window[popupDivId] = {};
                window[popupDivId].ListMasterCallBack = function (data) {
                    //将选择的记录值，赋值到界面元素
                    if (data) {
                        for (var field in data) {
                            $.MvcSheetUI.SetControlValue(field, data[field], that.GetRowNumber());
                        }
                    }
                    //隐藏浮动层
                    popupDiv.hide();
                };
                //点击界面上的其它元素时，隐藏浮动层（浮动层为iframe，点击不会触发该事件）
                $(document).unbind("click." + popupDivId).bind("click." + popupDivId, function (e) {
                    if (!($(e.target).attr("type") == "text" &&
                            $(e.target).attr($.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase()) == that.DataField)) {
                        popupDiv.hide();
                    }
                });
            }
        },
        _getInputParam: function () {
            var inputParam = "";
            if (this.InputMappings) {
                var items = this.InputMappings.split(",");
                for (var i = 0; i < items.length; i++) {
                    var fields = items[i].split(":");
                    if (fields && fields.length == 2) {
                        if (fields[0] && $.MvcSheetUI.GetSheetDataItem(fields[0], this.GetRowNumber())) {
                            inputParam += fields[1] + "," + $.MvcSheetUI.GetControlValue(fields[0], this.GetRowNumber()) + "|";
                        }
                    }
                }
                if (inputParam) {
                    inputParam = "&InputParam=" + encodeURI(inputParam.substring(0, inputParam.length - 1));
                }
            }
            return inputParam;
        },
        SetReadonly: function (v) {
            if (v) {
                $(this.Element).hide();
                var that = this;
                var lbl = $("<label for='" + $(that.Element).attr("id") + "'></label>");
                if (this.TextRightAlign) lbl.addClass("txtAlignRight").css("width", $(this.Element).width());
                else if (this.NumberRightAlign && this.IsNubmer()) { lbl.addClass("txtAlignRight"); }
                var val = $.trim(this.V);
                if (val != "") {
                    var strs = val.split("\n");
                    $(strs).each(function (i) {
                        if (i > 0) {
                            lbl.append("<br />");
                        }
                        lbl.append($("<span></span>").text(this.toString()));
                    });
                }
                lbl.insertAfter($(this.Element));
                this.GetFromatValue(lbl, this.Element.value);
            } else {
                $(this.Element).show();
                $(this.Element).next().remove();
            }
        },
        //值改变事件
        _OnChange: function (e) {
            // 执行验证
            this.Validate();

            if (this.OnChange) {
                //执行绑定事件
                this.RunScript(this.Element, this.OnChange);
            }

            //是否自动去除前后空格
            if (this.AutoTrim) {
                this.Value = that.Value.trim();
            }
        },
        // 数据验证
        Validate: function (effective, initValid) {
            if (!this.Editable) return true;

            //add by hxc
            $(this.Element).removeClass(this.Css.inputError);
            $(this.Element).siblings("." + this.Css.InvalidText).remove();

            if (initValid) {
                if (this.Required && !this.GetValue()) {
                    this.AddInvalidText(this.Element, "*", false);
                    return false;
                }
            }
            var val = this.GetValue();
            if (!effective) {
                if ($(this.Element).attr("data-required") || this.O.indexOf("R") > -1) this.Required = true;
                else this.Required = false;
                // 必填验证
                if (this.Required && !this.DoValidate(this.Valid.Required, [val], "*")) {
                    this.ValidateResult = false;
                    return false;
                }
                if (this.RegularExpression && val) {
                    if (!this.DoValidate(this.Valid.RegularExpression, [val, this.RegularExpression], this.RegularInvalidText)) {
                        this.ValidateResult = false;
                        return false;
                    }
                }
            }

            // 处理数据逻辑型验证
            switch (this.LogicType) {
                case $.MvcSheetUI.LogicType.Int:
                    if (!this.DoValidate(this.Valid.Integer, [val], SheetLanguages.Current.EnterInteger)) {
                        this.ValidateResult = false;
                        return false;
                    }
                    if (!this.DoValidate(this.Valid.IntegerLength, [val, 10], SheetLanguages.Current.EnterIntegerLength)) {
                        this.ValidateResult = false;
                        return false;
                    };

                    break;
                case $.MvcSheetUI.LogicType.Long:
                    if (!this.DoValidate(this.Valid.Integer, [val], SheetLanguages.Current.EnterInteger)) {
                        this.ValidateResult = false;
                        return false;
                    }
                    if (!this.DoValidate(this.Valid.IntegerLength, [val, 19], SheetLanguages.Current.EnterIntegerLengths)) {
                        this.ValidateResult = false;
                        return false;
                    };
                    break;
                case $.MvcSheetUI.LogicType.Double:
                    if (!this.DoValidate(this.Valid.Number, [val], SheetLanguages.Current.EnterNumber)) {
                        this.ValidateResult = false;
                        return false;
                    }
                    if (!this.DoValidate(this.Valid.NumberLength, [val], SheetLanguages.Current.EnterNumberLength)) {
                        this.ValidateResult = false;
                        return false;
                    }
                    break;
                default:
                    break;
            }
            this.ValidateResult = true;
            return true;
        },
        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;
            result[this.DataField] = $.MvcSheetUI.GetSheetDataItem(this.DataField); // this.SheetInfo.BizObject.DataItems[this.DataField];
            if (!result[this.DataField]) {
                if (this.DataField.indexOf(".") == -1) { alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField); }
                return {};
            }

            // if (("" + result[this.DataField].V) != this.GetValue())
            {
                this.RefreshDataTrackLink();
                result[this.DataField].V = $.trim(this.GetValue());
                return result;
            }

            return {};
        }
    });
})(jQuery);