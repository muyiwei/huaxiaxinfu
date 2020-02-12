/// <reference path="SheetDesigner.js" />
/// <reference path="jquery.select.js" />

//基本属性窗口
var BasicPropertyWindow = function () {
    this.Controls = {
        f_basicProperty: $("#f_basicProperty"),  //基本属性窗口 DIV
        tabBasicProperty: $("#tabBasicProperty"),  //基本属性窗口 TABLE
        b_Id: $("#b_Id"),  //控件ID
        b_ItemName: $("#b_ItemName"),  //数据项名称
        b_ItemType: $("#b_ItemType"), //数据项类型
        b_CtrlType: $("#b_CtrlType"), //控件类型
        b_DisplayName: $("#b_DisplayName"), //显示名称
        b_ddlValueType: $("#b_ddlValueType"), //绑定值类型
        b_ddlValueRanges: $("select[id$='b_ddlValueRanges']"),  //数据字典绑定值范围
        b_ValueRanges: $("#b_ValueRanges"), //自定义绑定值范围
        b_DefaultValue: $("#b_DefaultValue"), //初始值
        b_Width: $("#b_Width"), //宽度
        b_WidthType: $("#b_WidthType"), //宽度类别（px;%)
        b_Height: $("#b_Height"),  //高度
        b_HeightType: $("#b_HeightType"), //高度类别 (px;%)
        b_Style: $("#b_Style"), //样式名称
        b_Visible: $("#b_Visible"), //是否可见
        b_Description: $("#b_Description"), //描述
        tr_b_Style: $("#tr_b_Style"), //样式名称行
        tr_b_DisplayName: $("#tr_b_DisplayName"), //显示名称行
        tr_b_ValueType: $("#tr_b_ValueType"), //绑定值类型行
        tr_b_ValueRanges: $("#tr_b_ValueRanges"), //绑定值范围行
        tr_b_DefaultValue: $("#tr_b_DefaultValue") //初始值行
    };
    this.Init();
};

$.fn.Dragable = function () {
    Designer.drag = this.ligerDrag({
        proxy: "clone",
        revert: true,
        receive: ".designer td,.DragContainer",
        onStartDrag: function () {
            this.set({ cursor: "not-allowed" });
            if (Designer.PropertyPanel.Controls.SelectedPropertyControl != null) {
                Designer.PropertyPanel.Controls.SelectedPropertyControl.blur();
            }
            if (!this.handler.hasClass("_subTab")) this.handler.click();
        },
        onDragEnter: function (receive, source, e) {
            this.set({ cursor: "pointer" });
        },
        onDragLeave: function (receive, source, e) {
            this.set({ cursor: "not-allowed" });
        },
        onDrop: function (receive, source, e) {
            if (!this.proxy) return;
            this.proxy.hide();
            if (source[0].id) {
                var parent = $(receive).parent();
                var i = 0;
                while (i < 5 && parent.length > 0) {
                    if (parent[0].id == source[0].id) return;
                    parent = parent.parent();
                    i++;
                }

                if ($(receive).find("#" + source[0].id).length == 0) {
                    Designer.BasicPropertyWindow.BindDropedEvent(receive, source);
                }
            }
            else {
                Designer.BasicPropertyWindow.BindDropedEvent(receive, source);
            }
            e.stopPropagation();
        }
    });
};

BasicPropertyWindow.prototype = {
    Init: function () {
        $(".dragable").css("z-index", "101");
        // $(".dragable").filter(function () { return !$(this).hasClass("_subTab"); }).unbind();
        $(".dragable").filter(function () { return !$(this).hasClass("_subTab"); }).Dragable();
    },
    ResetDragReceive: function () {
        // 刷新可接收区域
        // $(".dragable").filter(function () { return !$(this).hasClass("_subTab"); }).Dragable();
        $(".dragable").filter(function () { return !$(this).hasClass("_subTab"); }).each(function () {
            $(this).ligerGetDragManager()._setReceive(".designer td,.DragContainer");
        })
    },
    BindDropedEvent: function (container, source) {
        var _container = $(container);
        //获取拖动元素类别
        var _type = $(source).attr("type");
        //是否是系统数据项
        if (source.attr("property") != null) {
            // 控件拖动
            var sourceId = source.attr("id");
            if (!sourceId) { return; }
            var parent = $(container);

            if (parent.find("#" + sourceId).length > 0) {
                return;
            }

            var sourceHtml = source.html();
            var sourceParent = $("#" + sourceId).parent();

            try {
                $("#" + sourceId).appendTo(parent);
            } catch (e) {
                //$(sourceHtml).appendTo(sourceParent);
                //sourceParent.find(".dragable").Dragable();
                //sourceParent.find(".dragable").Designable();
            }
        }
        else {// 拖动的是数据项
            //如果是流程数据项类型,弹出基本属性窗口(数据项类型>0)
            if (parseInt(_type) > 0) {
                this.AlertBasicPropertyWindow(_container, source);
            }
            else {
                Designer.PropertyPanel.Controls.tabProperty_WorkSheet.find("tbody>tr").remove();  //隐藏WorkSheet部分

                var fullName = $(source).attr("fullName");
                //获取拖拽元素模型
                var model = Designer.GetDesignerControlModel(fullName);
                //替换 SheetLabel 文本
                if (parseInt(_type) == DataLogicTypes.SheetLabel.Type) {
                    model = model.replace("SheetLabel", $(source).html()); //显示标题
                }

                //将当前元素变为可设计的元素
                var designElem = new DesignElem($(model));
                designElem.Property.Id = Designer.GetControlID();  //设计元素ID
                // designElem.Property.Id = "lbl" + $(source).attr("DataItem");
                designElem.Property.ItemName = $(source).html();
                designElem.Property.ItemType = "短文本";
                designElem.Property.ItemTypeValue = 14;
                designElem.Property.LogicType = DesignerControls.SheetLabel.DisplayName;
                designElem.Property.FullName = DesignerControls.SheetLabel.FullName;
                designElem.Property.DisplayName = $(source).html();
                designElem.Property.IsSystemItem = true;

                Designer.GetDesignerControlWorkSheetProperty(true, DesignerControls.SheetLabel.FullName, function (d) {
                    designElem.Property.WorkSheetProperty = d;
                    for (var item in designElem.Property.WorkSheetProperty) {
                        if (designElem.Property.WorkSheetProperty[item].Name == "BindType") {
                            designElem.Property.WorkSheetProperty[item].Value = "All";
                            break;
                        }
                    }
                    designElem.Bind();
                    _container.append(designElem.Target);  //添加该模型
                    $("#" + designElem.Property.Id).click();  //点击当前元素
                });
            }
        }
    },
    AlertBasicPropertyWindow: function (container, source) {
        var _this = Designer.BasicPropertyWindow.Controls.f_basicProperty;  //基本属性窗口
        this.InitialProperty(source);

        Designer.PopWindow({
            id: _this.attr("id"),
            sumbitfunc: function (e) {
                // 嵌套子表拖入情况
                // if ($(container).find("table").length > 0) return;
                var fullName = Designer.BasicPropertyWindow.Controls.b_CtrlType.val();
                var htmlModel = Designer.GetDesignerControlModel(fullName);

                if (Designer.BasicPropertyWindow.Controls.b_Id.val() == "") {
                    alert("控件ID不能为空！");
                    return;
                }

                var designElem = new DesignElem($(htmlModel));
                designElem.Property.IsSystemItem = false;
                designElem.Property.Id = Designer.BasicPropertyWindow.Controls.b_Id.val();
                designElem.Property.ControlId = designElem.Property.Id;
                designElem.Property.ItemName = Designer.BasicPropertyWindow.Controls.b_ItemName.text();
                designElem.Property.ItemType = Designer.BasicPropertyWindow.Controls.b_ItemType.text();
                designElem.Property.ItemTypeValue = parseInt(Designer.BasicPropertyWindow.Controls.b_ItemType.attr("ItemTypeValue"));
                designElem.Property.LogicType = Designer.BasicPropertyWindow.Controls.b_CtrlType.getSelectedText();
                designElem.Property.FullName = Designer.BasicPropertyWindow.Controls.b_CtrlType.val();
                designElem.Property.DisplayName = Designer.BasicPropertyWindow.Controls.b_DisplayName.val();
                // designElem.Property.BindingType = Designer.BasicPropertyWindow.Controls.b_ddlValueType.val();
                //绑定值范围
                //var valueRanges;
                //if (parseInt(designElem.Property.BindingType) == 0) {
                //    valueRanges = Designer.BasicPropertyWindow.Controls.b_ddlValueRanges.val();
                //}
                //else {
                //    valueRanges = Designer.BasicPropertyWindow.Controls.b_ValueRanges.val();
                //}
                //designElem.Property.ValueRanges = valueRanges;
                designElem.Property.DefaultValue = Designer.BasicPropertyWindow.Controls.b_DefaultValue.val();

                var _width = Designer.BasicPropertyWindow.Controls.b_Width.val();
                designElem.Property.Width = _width == "" ? 0 : parseFloat(_width);
                designElem.Property.WidthType = Designer.BasicPropertyWindow.Controls.b_WidthType.val();

                var _height = Designer.BasicPropertyWindow.Controls.b_Height.val();
                designElem.Property.Height = _height == "" ? 0 : parseFloat(_height);
                designElem.Property.HeightType = Designer.BasicPropertyWindow.Controls.b_HeightType.val();
                designElem.Property.Style = Designer.BasicPropertyWindow.Controls.b_Style.text();
                designElem.Property.Visible = Designer.BasicPropertyWindow.Controls.b_Visible.is(":checked") ? true : false;
                designElem.Property.Description = Designer.BasicPropertyWindow.Controls.b_Description.text();

                //$.ajax({
                //    type: "POST",
                //    url: "SheetDesignerService.ashx",
                //    data: { Command: "GetControlProperty", ControlFullName: fullName },
                //    dataType: "json",
                //    success: function (data) {

                Designer.GetDesignerControlWorkSheetProperty(true, fullName, function (d) {
                    designElem.Property.WorkSheetProperty = d;
                    designElem.Bind();

                    var style = "z-index:101;";
                    //宽度和高度
                    if (designElem.Property.Width) {
                        var widthType = (parseInt(Designer.BasicPropertyWindow.Controls.b_WidthType.val()) == 0) ? "px" : "%";
                        style = style + "width:" + designElem.Property.Width + widthType + ";"
                    }
                    if (designElem.Property.Height) {
                        var heightType = (parseInt(Designer.BasicPropertyWindow.Controls.b_HeightType.val()) == 0) ? "px" : "%";
                        style = style + "height:" + designElem.Property.Height + heightType + ";"
                    }
                    //样式
                    if (designElem.Property.Style) {
                        style = style + designElem.Property.Style;
                    }

                    if (style != "") {
                        designElem.Target.attr("style", style);
                    }

                    if (fullName == DesignerControls.SheetLabel.FullName) {
                        designElem.Target.html(designElem.Property.DisplayName);
                    }
                    else if (fullName == DesignerControls.SheetTextBox.FullName ||
                        fullName == DesignerControls.SheetRichTextBox.FullName) {
                        designElem.Target.val(designElem.Property.DefaultValue);
                    }

                    //如果是子表
                    if (fullName == DesignerControls.SheetDetail.FullName ||
                        fullName == DesignerControls.SheetGridView.FullName ||
                        fullName == DesignerControls.SheetBizDetail.FullName) {
                        var dataArray = [];  //子表数据
                        $("span[SubTabName='" + designElem.Property.ItemName + "']").each(function () {
                            dataArray.push($(this).html());
                        });
                        var tabHtml = "<table subtab=\"subtab\" class=\"SheetGridView\" cellspacing='0' cellpadding='0' style='width:100%;' id='subTab_" + designElem.Property.Id + "'><tr>";

                        var sheetlabelWorksheet = null;
                        if (!sheetlabelWorksheet) {
                            Designer.GetDesignerControlWorkSheetProperty(false, DesignerControls.SheetLabel.FullName, function (d) {
                                sheetlabelWorksheet = d;
                            });
                        }

                        var columnName, displayName;
                        //生成Html标题
                        for (var k = 0; k < dataArray.length; k++) {
                            //取Label模型
                            columnName = dataArray[k].substring(dataArray[k].indexOf("[") + 1);
                            columnName = columnName.substring(0, columnName.length - 1).toLowerCase();
                            displayName = dataArray[k].substr(0, dataArray[k].indexOf("["));
                            if (columnName == "instanceid" || columnName == "datafield" || columnName == "objectid") continue;
                            var _labelModel = Designer.GetDesignerControlModel(Designer.DesignerControls.SheetLabel.FullName);

                            _labelModel = _labelModel.replace("SheetLabel", displayName); //显示标题

                            //将当前元素变为可设计的元素
                            var _labelElem = new DesignElem($(_labelModel));
                            _labelElem.Property.Id = Designer.GetControlID();  //设计元素ID
                            _labelElem.Property.DisplayName = displayName;
                            _labelElem.Property.Width = 0;
                            _labelElem.Property.WidthType = 0;
                            _labelElem.Property.LogicType = DesignerControls.SheetLabel.DisplayName;
                            _labelElem.Property.FullName = DesignerControls.SheetLabel.FullName;
                            // _labelElem.Property.ItemTypeValue = DesignerControls.SheetLabel.Type;
                            _labelElem.Property.ItemName = columnName;
                            _labelElem.Property.WorkSheetProperty = sheetlabelWorksheet;
                            _labelElem.Bind();

                            var temp = $("<div></div>");  //构造父元素，获取_labelElem绑定后的Html
                            temp.append(_labelElem.Target);
                            tabHtml += "<td class='subTableTH'>" + temp.html() + "</td>";
                        }
                        tabHtml += "</tr></tr>";
                        for (var k = 0; k < dataArray.length; k++) {
                            tabHtml += "<td class='subTableRow'></td>";
                        }
                        tabHtml += "</tr></table>";
                        var html = "<span id=" + Designer.GetControlID() + " class=\"dragable designElem selected\"><b style=\"color:green;\" class=\"subTab\">子表" + designElem.Property.ItemName + "属性</b></span>"
                        // var html = "<b style='color:green;' class='subTab'>子表" + designElem.Property.ItemName + "属性</b>";
                        designElem.Target.append(html);
                        designElem.Target.append(tabHtml);
                    }

                    //添加属性到数组中
                    $(container).append(designElem.Target);

                    if (fullName == DesignerControls.SheetDetail.FullName ||
                        fullName == DesignerControls.SheetGridView.FullName ||
                        fullName == DesignerControls.SheetBizDetail.FullName) {

                        designElem.Target.unbind("contextMenu").contextMenu('deleteMenu', {
                            bindings: {
                                'removeTab': function (t) {
                                    var subTab = $(t).next();
                                    subTab.remove();
                                    Designer.RemovePropertyToArray(t);
                                    $(t).remove();
                                }
                            }
                        });
                        $(container).css("padding-left", "0px");
                        //移除父拖拽功能；
                        $(container).children("table").TabDroppable();
                    }
                    _this.hide();
                    $("#screen").hide();
                    Designer.AddPropertyToArray(designElem.Target);
                    //绑定属性面板
                    designElem.Target.click();
                    if (fullName == DesignerControls.SheetDetail.FullName ||
                        fullName == DesignerControls.SheetGridView.FullName ||
                        fullName == DesignerControls.SheetBizDetail.FullName) {
                        // 绑定可拖拽事件
                        $(container).find(".designElem").Designable();
                        // 设置元素可以重新拖拽
                        Designer.BasicPropertyWindow.Init();
                    }
                    else {
                        // 绑定可拖拽事件
                        designElem.Target.Dragable();
                    }
                });
            }
        });
    },
    //初始化基本属性
    InitialProperty: function (source) {
        var type = $(source).attr("type");  //拖拽对象类别
        // var text = $(source).text();        //拖拽对象内容
        var text = $(source).attr("dataitem");
        var displayName = $(source).html();
        if (displayName.indexOf("[") > -1) displayName = displayName.substring(0, displayName.indexOf("["));

        var Id = Designer.GetControlID();  //生成新ID
        Designer.BasicPropertyWindow.Controls.b_Id.val(Id);  //控件ID
        Designer.BasicPropertyWindow.Controls.b_Id.attr("disabled", "disabled");
        Designer.BasicPropertyWindow.Controls.b_ItemName.text(text); //数据项名称

        //获取类别实体
        var _Property = Designer.GetDataLogicType(type);
        if (_Property) {
            Designer.BasicPropertyWindow.Controls.b_ItemType.attr("ItemTypeValue", type);
            Designer.BasicPropertyWindow.Controls.b_ItemType.text(_Property.DisplayName);  //数据项类别
            Designer.BasicPropertyWindow.Controls.b_DisplayName.val(displayName); //显示名称

            var controlRange = _Property.ControlRange;
            //绑定该数据项类型对应的控件范围
            Designer.BasicPropertyWindow.Controls.b_CtrlType.clearAll();
            for (var i = 0, len = controlRange.length; i < len; i++) {
                var val = controlRange[i];
                for (var t in DesignerControls) {
                    if (DesignerControls[t].FullName == val.FullName) {
                        Designer.BasicPropertyWindow.Controls.b_CtrlType.addOption(DesignerControls[t].DisplayName, DesignerControls[t].FullName);
                        break;
                    }
                }
            }

            //绑定控件类型 Change 事件
            Designer.BasicPropertyWindow.Controls.b_CtrlType.unbind("change").change(function (e) {

                e.stopPropagation();
                var fullName = $(this).val();
                var model = Designer.GetDesignerControlModel(fullName);
                var _width = $(model).attr("m_width") || 0;
                var _height = $(model).attr("m_height") || 0;
                Designer.BasicPropertyWindow.Controls.b_Width.val(_width);
                Designer.BasicPropertyWindow.Controls.b_WidthType.setSelectedIndex(1);
                Designer.BasicPropertyWindow.Controls.b_Height.val(_height);

                //如果是SheetLabel
                if (fullName.indexOf(DataLogicTypes.SheetLabel.DisplayName) > -1) {
                    //显示控件ID,数据项名称,数据项类型,控件类型,显示名称,描述
                    Designer.BasicPropertyWindow.Controls.tabBasicProperty.find("tr:gt(5):not(:last)").hide();
                    //显示样式
                    Designer.BasicPropertyWindow.Controls.tr_b_Style.show();
                    //显示显示名称
                    Designer.BasicPropertyWindow.Controls.tr_b_DisplayName.show();
                }
                else {
                    Designer.BasicPropertyWindow.Controls.tabBasicProperty.find("tr:gt(5):not(:last)").show();
                    Designer.BasicPropertyWindow.Controls.tr_b_DisplayName.hide(); //非Label,隐藏显示名称
                    Designer.BasicPropertyWindow.Controls.tr_b_ValueType.hide();  //隐藏绑定值类型行
                    Designer.BasicPropertyWindow.Controls.tr_b_ValueRanges.hide();  //隐藏绑定值范围行
                    Designer.BasicPropertyWindow.Controls.tr_b_DefaultValue.hide();

                    if (fullName == DesignerControls.SheetTextBox.FullName ||
                        fullName == DesignerControls.SheetRichTextBox.FullName) {
                        Designer.BasicPropertyWindow.Controls.tr_b_DefaultValue.show();
                    }

                    if (fullName == DesignerControls.SheetDropDownList.FullName ||
                            fullName == DesignerControls.SheetRadioButtonList.FullName ||
                            fullName == DesignerControls.SheetBizDropDownList.FullName) {
                        Designer.BasicPropertyWindow.Controls.tr_b_ValueRanges.show();
                        Designer.BasicPropertyWindow.Controls.tr_b_ValueType.show();
                    }
                }
            });

            Designer.BasicPropertyWindow.Controls.b_CtrlType.setSelectedIndex(0);
            Designer.BasicPropertyWindow.Controls.b_CtrlType.change();

        }

    },
    //绑定鼠标右键粘贴菜单
    BindContextMenuEvent: function (obj) {
        $(obj).unbind("contextMenu").contextMenu('plasteMenu', {
            bindings: {
                "plaste": function (parentCtrl) {
                    $(Designer.ClipBoard.Elem).removeClass("selected");
                    Designer.ClipBoard.Plaste(parentCtrl);
                    return;
                }
            }
        });
    }
}