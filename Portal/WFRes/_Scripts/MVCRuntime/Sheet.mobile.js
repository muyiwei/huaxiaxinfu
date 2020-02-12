/// <reference path="../../../Mobile/Scripts/jquery-2.1.3.min.js" />
/// <reference path="../../../Mobile/AppFramework/appframework.js" />
/// <reference path="../../../Mobile/AppFramework/ui/appframework.ui.js" />


var SheetMobileEnvironment =
    {
        //删除附件
        RemoveAttachmentByID: function (_AttachmentID, _Obj, _DataField) {
            var r = $("[data-target='RemovedFiles'][data-field='" + _DataField + "']");
            var ids = (r.val() || "").split(";") || [];
            if ($.inArray(_AttachmentID, ids) == -1) {
                r.val(r.val() + _AttachmentID + ";");
            }

            $(_Obj).parent("[data-attachment-id]").remove();
        },

        //异步提交部分表单
        SubmitSheetPart: function () {
            var _SheetMobileHandler = SheetMobileHandler;

            //TODO:提交新添加的附件
            {
                //所有上传控件是否有错
                var _FileExtensionsError = false;
                //验证FileExtensions
                $("input[type='file']").each(function () {
                    var _FormGroup = $(this).parents(".form-group:first");
                    _FormGroup.find("label.error").remove();
                    //当前控件是否有错
                    var _thisControlError = false;

                    var _FileExtensions = $(this).attr("data-file-extensions");
                    if (_FileExtensions) {
                        //扩展名数组
                        var _ExtentionArray = _FileExtensions.split(";");

                        for (var i = _ExtentionArray.length - 1; i >= 0; i--) {
                            if (_ExtentionArray[i] && _ExtentionArray[i].lastIndexOf(".") > -1 && _ExtentionArray[i].lastIndexOf(".") < _ExtentionArray[i].length - 1) {
                                _ExtentionArray[i] = (_ExtentionArray[i].substring(_ExtentionArray[i].lastIndexOf(".") + 1, _ExtentionArray[i].length)).toLowerCase();
                            }
                            else {
                                _ExtentionArray.splice(i, 1);
                            }
                        }

                        //如果扩展名限制有效
                        if (_ExtentionArray.length > 0) {
                            $(this.files).each(function () {
                                if (this.name.indexOf(".") == -1) {
                                    _thisControlError = true;
                                    _FileExtensionsError = true;
                                }
                                else {
                                    if ($.inArray((this.name.substring(this.name.lastIndexOf(".") + 1, this.name.length)).toLowerCase(), _FileExtensions) > -1) {
                                    }
                                    else {
                                        _thisControlError = true;
                                        _FileExtensionsError = true;
                                    }
                                }
                            });
                        }
                    }

                    //如果当前控件有错
                    if (_thisControlError) {
                        //添加错误信息
                        $('<label class="error"><span class="Sheet_mobile_Extention">扩展名应为</span>\"' + $(this).attr("data-file-extensions") + '\".</label>').appendTo(_FormGroup);

                        //滚动到此
                        $(document).scrollTop(_FormGroup.offset().top + 50);
                    }
                });
                //如果存在扩展名错误
                if (_FileExtensionsError) {
                    //关闭提交框
                    $('.action-panel').hide();

                    return false;
                }

                $("input[type='file']").each(function () {
                    var _SchemaCode = $(this).attr("data-schema-code");
                    var _DataField = $(this).attr("data-field");
                    //添加的附件的ID
                    var _AddedFiles = $("[data-target='AddedFiles'][data-field='" + _DataField + "']");
                    var _AddedAttachmentIDs = $(_AddedFiles).val() || "";

                    if (_DataField && this.files) {
                        $(this.files).each(function () {
                            var m_data = new FormData();
                            m_data.append("Command", "UploadAttachments");
                            m_data.append("SchemaCode", _SchemaCode);
                            m_data.append("DataField", _DataField);
                            m_data.append("Attachments", this);

                            var ajaxRequest = $.ajax({
                                type: "POST",
                                url: _SheetMobileHandler,
                                async: false,
                                contentType: false,
                                processData: false,
                                data: m_data,
                                success: function (_AttachmentIdString) {
                                    if (_AttachmentIdString) {
                                        _AddedAttachmentIDs += _AttachmentIdString + ";";
                                    }
                                },
                                error: function (msg) {

                                }
                            });

                            ajaxRequest.done(function (xhr, textStatus) {

                            });
                        });
                        _AddedFiles.val(_AddedAttachmentIDs);
                    }
                });
            }

            //TODO:提交子表行
            {
                $(".panel[data-field][data-target='Detail-Items']").each(function () {
                    var _DataField = $(this).attr("data-field");
                    var txtRowData = $("[data-field='" + _DataField + "'][data-target='RowData']");
                    var _RowDataArray = [];
                    if (_DataField && txtRowData.length > 0) {
                        //子表的每行
                        $(this).find("[data-row-id]").each(function () {
                            var _RowData = {};
                            _RowData["ObjectID"] = $(this).attr("data-row-id");

                            $(this).find("[data-column-name]").each(function () {
                                _RowData[$(this).attr("data-column-name")] = $(this).children(".input-mask").text();
                            });

                            _RowDataArray.push(_RowData);
                        });

                        txtRowData.val(JSON.stringify(_RowDataArray));
                    }
                });
            }

            return true;
        }
    }

var SheetDetailEnvironment = {
    //编辑过的行的ID
    ModifiedRowIDs: [],
    //Body下可见的子成员
    VisibleChildren: [],
    //模态框
    Modal: undefined,

    //滚动高度
    ScrollTop: 0,

    //添加行
    AddRow: function (_Obj) {
        var _DataField = $(_Obj).parents(".panel[data-field]:first").attr("data-field");
        var _Editor = $("[data-target='Detail-Editor'][data-field='" + _DataField + "']");
        var _Clone = _Editor.clone();

        var _NewId = $.uuid()
        _Clone.children(":first").attr("data-row-id", _NewId);
        $(_Obj).parents("ul:first").before(_Clone.html());

        //初始化移动端输入方式
        $("[data-row-id='" + _NewId + "']").find(".form-group").each(function (em) {
            var _InputObj = $(this).find("input[type!=file]:visible,select,textarea");
            if (_InputObj.length == 1) {
                InitMobileInput(_InputObj);
            }
        });
    },
    //移除行
    RemoveRow: function (_Obj) {
        var _DetailView = $(_Obj).parents("[data-target='detail-view'][data-field='" + _DataField + "']:first");
        var _DataField = $(_DataField).attr("data-field");

        //如果当前行是在只允许存在单行的组里,删除当前行时,显示"添加"按钮
        var _SingleDetailGroup = $(_Obj).parents(".form-group[data-field-type='single-row']");
        if (_SingleDetailGroup.length > 0) {
            _SingleDetailGroup.find(".subtable-add").show();
        }

        //移除控件
        $(_Obj).parents("[data-row-id]").remove();

        //保存所有行数据
        this.SaveAllRowData(_DetailView, _DataField);
    },
}

//隐藏用户清空按钮
var HideClearUser = function () {
    $(".button.ClearUser").hide();
}
var ShowClearUser = function () {
    $(".button.ClearUser").show();
}
var SelectUser = function (_Obj) {
    //选择控件
    var _Selector = $(_Obj).find("[data-type='user-selector']");
    var _SelectorID = $(_Selector).attr("id");
    var _SelectPanelID = "_UserSelectorPanel" + _SelectorID

    //获取控件配置信息
    var _OptionString = $(_Selector).attr("data-user-selector-option") || "";
    var _Config = {};
    try {
        eval("_Config=" + _OptionString);
    }
    catch (e) {

    }

    //选择框
    var _SelectPanel = $("#" + _SelectPanelID);
    if (_SelectPanel.length == 0) {
        var _DataTitle = $(_Selector).prev().text();

        var _UserNameControl = $(_Selector).children("span");
        var _UserIDControl = $(_Selector).children("input");

        $.ui.addContentDiv(
            _SelectPanelID,
            "<div style='width: 100%; border: 1px solid #cccccc; line-height: 24px; padding-left: 8px;min-height: 28px;'><span data-target='UserNames'></span></div>"
            + "<input data-target='UserIDs' type='hidden' />"
            + "<div data-target='user-tree'></div>",
            _DataTitle);

        var _SelectPanel = $("#" + _SelectPanelID);

        //清空按钮
        var _ClearUser = $(".ClearUser");
        if (_ClearUser.length == 0) {
            $("#pageTitle").after('<a class="button ClearUser" style="visibility: visible;float: right;">'
                + _Sheet_mobile_GlobalString.Sheet_mobile_Clear + '</a>');
            _ClearUser = $(".ClearUser");
            _ClearUser.bind("tap", function () {
                $("[data-target='UserNames']:visible").text("").change();
                $("[data-target='UserIDs']:visible").val("").change();
            })
        }

        _SelectPanel.attr("data-unload", "HideClearUser").attr("data-load", "ShowClearUser");

        var _NewNameControl = $(_SelectPanel).find("[data-target='UserNames']").text($(_UserNameControl).text());
        var _NewIDControl = $(_SelectPanel).find("[data-target='UserIDs']").val($(_UserIDControl).val());
        var _UserTree = $(_SelectPanel).find("[data-target='user-tree']");

        $(_NewNameControl).bind("change", function () {
            _UserNameControl.text($(this).text()).change();
        });
        $(_NewIDControl).bind("change", function () {
            _UserIDControl.val($(this).val()).change();
        });

        var _LoadData = function () {
            var _IsMulti = !(_Config && _Config.SelectMode == "0");
            var _CurrentExpandNode = undefined;
            $(_UserTree).ligerTree({
                checkbox: false,
                idFieldName: 'Code',
                textFieldName: 'Text',
                iconFieldName: "Icon",
                btnClickToToggleOnly: false,
                isExpand: true,
                isLeaf: function (a) {
                    return a.IsLeaf;
                },
                delay: function (e) {
                    var node = e.data;
                    if (node == null) return false;
                    if (node.IsLeaf == null) return false;
                    if (node.LoadDataUrl == null) return false;
                    if (!node.IsLeaf && node.children == null) {
                        return node.LoadDataUrl;
                    }
                    return false;
                },
                onBeforeExpand: function (_Node) {
                    _CurrentExpandNode = _Node;
                },
                onSuccess: function (a, b) {
                    var _SelectedValues = (_NewIDControl.val() || "").split(";");
                    if (_CurrentExpandNode && _CurrentExpandNode.data && _CurrentExpandNode.data.children) {
                        //设置选中的节点为选中状态,
                        $(_CurrentExpandNode.data.children).each(function (index) {
                            if (this.IsLeaf && $.inArray(this.Code, _SelectedValues) > -1) {
                                $(_CurrentExpandNode.target)
                                    .children(".l-children").children("li:eq(" + index + ")").find(".l-body:first").find("span:last")
                                    .addClass("l-user-selected");
                            }
                        });
                    }
                },
                url: _PortalRoot + "/Mobile/Ajax/MobileSheetHandler.ashx?Command=LoadSeletableOrgChildren&ParentID=&Options=" + _OptionString,
                onSelect: function (_Node) {
                    if (!_Node.data.Selectable)
                        return;

                    //单选模式:选中并关闭
                    if (!_IsMulti) {
                        _NewNameControl.text(_Node.data.Text).change();
                        _NewIDControl.val(_Node.data.Code).change();

                        $.ui.goBack();
                        return;
                    }
                    else {
                        var _SelectedValues = (_NewIDControl.val() || "").split(";");
                        if ($.inArray(_Node.data.Code, _SelectedValues) >= 0) {
                            return;
                        }
                        _NewIDControl.val((_NewIDControl.val() || "") + _Node.data.Code + ";").change();
                        _NewNameControl.text((_NewNameControl.text() || "") + _Node.data.Text + ";").change();
                    }
                },
                onCancelSelect: function (_Node) {
                    //取消选中
                    var _SelectedValues = (_NewIDControl.val() || "").split(";");
                    var _SelectedTexts = (_NewNameControl.text() || "").split(";");
                    var _Index = $.inArray(_Node.data.Code, _SelectedValues);

                    _SelectedValues.splice(_Index, 1);
                    _SelectedTexts.splice(_Index, 1);

                    if (_Index > -1) {
                        _NewIDControl.val(_SelectedValues.join(";")).change();
                        _NewNameControl.text(_SelectedTexts.join(";"));
                    }

                    $(_Node.target).find(".l-body:first").find("span:last").removeClass("l-user-selected");
                }
            });
        }

        var _PortalRoot = $(_Selector).attr("data-portal-root");
        //加载样式和脚本
        if (!$(_UserTree).ligerTree) {
            $("body:first").append("<link rel='stylesheet' type='text/css' href='" + _PortalRoot + "/WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-tree.css' />");
            $.ajax({
                url: _PortalRoot + "/WFRes/_Scripts/ligerUI/ligerui.all.js",
                type: "GET",
                dataType: "script",
                async: false,//同步请求
                global: false,
                success: function () {
                    _LoadData();
                }
            });
        }
        else {
            _LoadData();
        }
    }
    $.ui.loadContent(_SelectPanelID);
    //显示返回
    $.ui.setBackButtonVisibility(true);

    //setTimeout(function () { $("#" + _ID).focus(); }, 300);
}

var _Sheet_mobile_GlobalString = { "Sheet_mobile_Clear": "清空" };
$(function () {
    if (typeof (vidiator) != "undefined") {
        vidiator.paretntClass = "divContent";
        vidiator.errorMessageClass = "error";
        vidiator.inputMouseEnter = "inputMouseEnter";  // 鼠标点击后样式
        vidiator.inputMouseMove = "inputMouseMove";    // 鼠标移到控件时样式
        vidiator.inputMouseOut = "inputMouseOut";      // 鼠标移除时样式
        vidiator.inputError = "inputError";            // 验证错误时显示样式
        vidiator.validErrorZH = "请将表单输入完整.";
        vidiator.validErrorEN = "Please complete the form input.";
    }

    //如果属性是"业务对象"类型的,只能添加单行,并隐藏添加按钮
    $(".form-group[data-field-type='single-row']").each(function () {
        if ($(this).find(".comment-body").length >= 1) {
            $(this).find(".subtable-add").hide();
        }
    })

    //如果页面回传,从子表的隐藏域里恢复显示子表行
    $("[data-target='RowData']").each(function () {
        var _RowData = $(this).val();
        if (_RowData) {
            var _DataField = $(this).attr("data-field");
            var _DetailView = $(this).parents("[data-target='detail-view']:first");
            //移除已有行
            _DetailView.find("[data-row-id]").remove();

            //var _ColumnNames = ["ObjectID"];
            ////从编辑框读取各行
            //$("[data-target='edit-detail'][data-field='" + _DataField + "']").find("[data-column-name]").each(function () {
            //    _ColumnNames.push($(this).attr("data-column-name"));
            //});

            //显示所有行
            var _RowArray = eval(_RowData);

            $(_RowArray).each(function () {
                var _NewRow = $("<div class='comment comment-body' style='margin-left:0' data-row-id='" + this["ObjectID"] + "'></div>");

                var _NewRowContent = $("<div class='comment-text'></div>");

                _DetailView.append(_NewRow);
                for (p in this) {
                    if (p.toLowerCase() != "ObjectID".toLowerCase()) {
                        _NewRowContent.append($("<div class=\"form-group\"><label>" + p + ":</label><br><span data-column-name='" + p + "'>" + this[p] + "</span></div>"));
                    }
                }

                _NewRow.append(_NewRowContent);
                _NewRow.append('<div class="form-group"><a style="color:dodgerblue" onclick="SheetDetailEnvironment.EditRow(this)" class="Sheet_mobile_Edit">编辑</a><a style="padding-left:10px;color:dodgerblue" onclick="SheetDetailEnvironment.RemoveRow(this)" class="Sheet_mobile_Delete">删除</a></div>');

                _DetailView.append(_NewRow);
            });
        }
    });

    ////获取本地化字符串
    //$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_mobile_Wrong,Sheet_mobile_Extention,Sheet_mobile_Edit,Sheet_mobile_Delete,Sheet_mobile_Close,Sheet_mobile_Msg0,Sheet_mobile_Clear" }, function (data) {
    //    if (data.IsSuccess) {
    //        $(".Sheet_mobile_Wrong").text(data.TextObj.Sheet_mobile_Wrong);
    //        $(".Sheet_mobile_Extention").text(data.TextObj.Sheet_mobile_Extention);
    //        $(".Sheet_mobile_Edit").text(data.TextObj.Sheet_mobile_Edit);
    //        $(".Sheet_mobile_Delete").text(data.TextObj.Sheet_mobile_Delete);
    //        $(".Sheet_mobile_Close").text(data.TextObj.Sheet_mobile_Close);

    //        _Sheet_mobile_GlobalString = data.TextObj;

    //        if (typeof (vidiator) != "undefined") {
    //            vidiator.validErrorZH = vidiator.validErrorEN = data.TextObj.Sheet_mobile_Msg0;
    //        }
    //    }
    //}, "json");
})


//显示所有操作按钮
var ShowActions = function () {
    var _Actions = [];
    $(".action-panel").children("a").each(function () {
        $(this).attr("data-ignore", "true");
        var _thisAnchor = this;
        _Actions.push({
            text: $(this).text(),
            handler: function () {
                $(_thisAnchor).click();
            }
        })
    })
    $("#afui").actionsheet(_Actions);
}

var InitMobileInput = function (_InputObj) {
    var _Parent = $(_InputObj).parent(".form-group");
    _Parent.addClass("editable");

    if ($(_InputObj).is("input[data-type='date']")) {
        //转为html5控件
        if ($.os.ios) {
            _InputObj.attr("type", "date");
        }
        else {
            _InputObj.attr("onfocus", "WdatePicker()");
        }
    }
    if ($.os.ios && _InputObj.is("input[data-type='number']")) {
        _InputObj.attr("type", "number");
    }

    //临时标识，用来识别当前控件
    var _TmpAttrName = "TmpAttrName";

    $(_InputObj).attr(_TmpAttrName, _TmpAttrName);

    var _DataTitle = $(_InputObj).prev().text();
    var _EditorPanelID = $.uuid();
    var _Mask = $("<label class=\"input-mask\"></label>").text(_InputObj.val());
    _Mask.insertAfter(_InputObj);

    $.ui.addContentDiv(
        _EditorPanelID,
        $("<div>").append(_InputObj).html(),
        _DataTitle);

    _InputObj = $("#" + _EditorPanelID).find("[" + _TmpAttrName + "]");

    $(_InputObj).bind("touchstart", function () { $("pageTitle").text("touchstart") })

    _InputObj.bind("MobileValidateSuccess", function () {
        _Parent.removeClass("error")
    }).bind("MobileValidateFaild", function () {
        _Parent.addClass("error")
    })

    //防止多次快速点击
    var _LastTopTimeStamp = 0;
    $(_Parent).unbind("tap.editable").bind("tap.editable", function (et) {
        if (et.timeStamp - _LastTopTimeStamp < 2000) {
            return;
        }

        _LastTopTimeStamp = et.timeStamp;
        //
        $.ui.loadContent(_EditorPanelID);

        $("#defaultHeader .backButton.button").one("click", function () {
            $(_InputObj).trigger("change");
        })
        //显示返回
        $.ui.setBackButtonVisibility(true);

        setTimeout(function () { $(_InputObj).focus(); }, 300);
    });

    //不显示footer
    $("#" + _EditorPanelID).attr("data-footer", "none");

    _InputObj.unbind("change.editable").bind("change.editable", function () {
        if ($(this).is("select")) {
            var _Text = $(this).find("option").filter(function () { return $(this).prop("selected"); }).text()
                || $(this).find("option").filter(function () { return $(this).prop("selected"); }).val()
                || $(this).find("option:first").text()
                || $(this).find("option:first").val();
            $(_Mask).text(_Text);
        }
        else {
            $(_Mask).text($(this).val());
        }
    }).unbind("ValidateFalse").bind("ValidateFalse", function () {
        $(_Mask).parent().addClass("mobile-error");
    }).removeAttr(_TmpAttrName);
}

var InitCheckBoxList = function (_InputObj) {
    var _Parent = $(_InputObj).parent();
    _Parent.addClass("editable");

    var _Mask = $("<label>").addClass("input-mask");
    _Parent.append(_Mask);

    var _DataTitle = $(_InputObj).prev().text();
    var _EditorPanelID = $.uuid();

    $.ui.addContentDiv(
        _EditorPanelID,
        $("<div>").append($(_InputObj).show()).html(),
        _DataTitle);

    var _InputObj = $("#" + _EditorPanelID).find("[data-type='CheckBoxList']");

    //防止多次快速点击
    var _LastTopTimeStamp = 0;
    $(_Parent).unbind("tap.editable").bind("tap.editable", function (et) {
        if (et.timeStamp - _LastTopTimeStamp < 2000) {
            return;
        }

        _LastTopTimeStamp = et.timeStamp;
        //
        $.ui.loadContent(_EditorPanelID);
        //显示返回
        $.ui.setBackButtonVisibility(true);
    });

    //不显示footer
    $("#" + _EditorPanelID).attr("data-footer", "none");

    $(_InputObj).find("input[type=checkbox]").unbind("change.editable").bind("change.editable", function () {
        $(_InputObj).trigger("change.editable");
    });
    _InputObj.unbind("change.editable").bind("change.editable", function () {
        var _SelectedItemString = "";
        $(this).find("input[type=checkbox]").each(function () {
            if ($(this).prop("checked")) {
                _SelectedItemString += $(this).parent().find("label").text() + ";";
            }
        });
        $(_Mask).text(_SelectedItemString);
    }).unbind("ValidateFalse").bind("ValidateFalse", function () {
        $(_Mask).parent().addClass("mobile-error");
    }).change();
}

var InitRadioButtonList = function (_InputObj) {
    var _Parent = $(_InputObj).parent();
    _Parent.addClass("editable");

    var _Mask = $("<label>").addClass("input-mask");
    _Parent.append(_Mask);

    var _DataTitle = $(_InputObj).prev().text();
    var _EditorPanelID = $.uuid();

    $.ui.addContentDiv(
        _EditorPanelID,
        $("<div>").append($(_InputObj).show()).html(),
        _DataTitle);

    var _InputObj = $("#" + _EditorPanelID).find("[data-type='RadioButtonList']");

    //防止多次快速点击
    var _LastTopTimeStamp = 0;
    $(_Parent).unbind("tap.editable").bind("tap.editable", function (et) {
        if (et.timeStamp - _LastTopTimeStamp < 2000) {
            return;
        }

        _LastTopTimeStamp = et.timeStamp;
        //
        $.ui.loadContent(_EditorPanelID);
        //显示返回
        $.ui.setBackButtonVisibility(true);
    });

    //不显示footer
    $("#" + _EditorPanelID).attr("data-footer", "none");

    $(_InputObj).find("input[type=radio]").unbind("change.editable").bind("change.editable", function () {
        $(_InputObj).trigger("change.editable");
    });
    _InputObj.unbind("change.editable").bind("change.editable", function () {
        var _SelectedItemString = "";
        $(this).find("input[type=radio]").each(function () {
            if ($(this).prop("checked")) {
                _SelectedItemString = $(this).parent().find("label").text();
            }
        });
        $(_Mask).text(_SelectedItemString);
    }).unbind("ValidateFalse").bind("ValidateFalse", function () {
        $(_Mask).parent().addClass("mobile-error");
    }).change();
}

var BeforeLaunch = function () {
    $("[data-type='checkbox']").each(function () {
        $(this).css("width", "auto").css("float", "right");
        var _Checkbox = $(this).find("input[type=checkbox]");
        var _id = _Checkbox.attr("id");
        _Checkbox.addClass("toggle");
        $(_Checkbox).after('<label for="' + _id + '" style="margin-top: -4px;margin-right: 10px;"> <span></span> </label>');
    })

    //转为参与者选择控件
    $("[data-type='user-selector']").each(function () {
        $(this).parent()
            .addClass("editable")
            .unbind("tap.user-selector").bind("tap.user-selector", function () {
                SelectUser(this);
            })
    });
}

var AfterLaunch = function () {
    if ($.ui.popup) {
        alert = function (msg) { $.ui.popup({ message: msg, title: '<%=Resources.Resource.ResourceManager.GetString("Prompt") %>', cancelText: '<%=Resources.Resource.ResourceManager.GetString("Sheet_Confirm") %>', cancelOnly: true }); }
    }

    $("[data-type='CheckBoxList']").each(function () {
        InitCheckBoxList(this);
    });

    $("[data-type='RadioButtonList']").each(function () {
        InitRadioButtonList(this);
    });

    var _LastTopTimeStamp = 0;
    $("#afui").on("longTap", function (e) {
        if (e.timeStamp - _LastTopTimeStamp < 2000) {
            return;
        }
        _LastTopTimeStamp = e.timeStamp;

        if ($(e.target).is("span")) {
            //初始化查看页面
            if (!_SpanViewPanelID) {
                _SpanViewPanelID = $.uuid();

                $.ui.addContentDiv(_SpanViewPanelID);

                $("#" + _SpanViewPanelID).attr("data-footer", "none");
            }

            //标题
            $("#pageTitle").text($(e.target).prev().text());
            //
            $.ui.updatePanel(_SpanViewPanelID, $("<div>").append($("<span>").html($(e.target).html())).html());

            $.ui.loadContent(_SpanViewPanelID);
        }
    })

    $.ui.setBackButtonText('<%=Resources.Resource.ResourceManager.GetString("Button_Return") %>');

    $("#mainList").find(".form-group").each(function (em) {
        var _InputObj = $(this).find("input[type!=file]:visible,select:visible,textarea:visible");
        if (_InputObj.length == 1) {
            InitMobileInput(_InputObj);
        }
    });

    //子表点击显示详细
    $("[data-target='DetailSummary']").each(function () {
        $(this).parent().addClass("editable");

        var _DataField = $(this).attr("data-field");
        var _DetailView = $(this).children("[data-target='Detail-View']");
        var _Editor = $(this).children("[data-target='Detail-View']");

        var _DataTitle = $(this).prev().text();
        var _EditorPanelID = $.uuid();

        $.ui.addContentDiv(
            _EditorPanelID,
            $(_DetailView).html(),
            _DataTitle);

        $("#" + _EditorPanelID).find(".form-group").each(function (em) {
            var _InputObj = $(this).find("input[type!=file],select,textarea");
            if (_InputObj.length == 1) {
                InitMobileInput(_InputObj);
            }
        });

        $("#" + _EditorPanelID).attr("data-footer", "none").attr("data-field", _DataField).attr("data-target", "Detail-Items");
        //防止多次快速点击
        var _LastTopTimeStamp = 0;
        $(this).parent().unbind("tap.editable").bind("tap.editable", function (et) {
            if (et.timeStamp - _LastTopTimeStamp < 2000) {
                return;
            }
            _LastTopTimeStamp = et.timeStamp;

            console.log("tap");

            //
            $.ui.loadContent(_EditorPanelID);
            //显示返回
            $.ui.setBackButtonVisibility(true);
        })
    });
}