/// <reference path="SheetDesigner.js" />

// 属性面板控件类别
var PropertyPanelControlType = {
    TextBox: "TextBox",
    DropDownList: "DropDownList"
};

// 属性中需要弹出界面设置的类型 
var PropertySettingType = [
    {
        type: "DisplayRule", controlId: "divDisplayRule", css: "liger-popupedit",
        initfunc: function (id) {
            var val = $("#" + id).val();
            $("#txtDisplayRule").val(val);
        },
        submitfunc: function (e) {
            var val = $.trim($("#txtDisplayRule").val());
            Designer.PropertyPanel.SaveProertyCacheValue(e.element.id, val);
            e.setText(val);
        },
        clearfunc: function (id) {
            Designer.PropertyPanel.SaveProertyCacheValue(id, "");
        }
    },
    {
        type: "ComputationRule", controlId: "divComputationRule", css: "liger-popupedit",
        initfunc: function (id) {
            var val = $("#" + id).val();
            $("#txtComputationRule").val(val);
        },
        submitfunc: function (e) {
            var val = $.trim($("#txtComputationRule").val());
            Designer.PropertyPanel.SaveProertyCacheValue(e.element.id, val);
            e.setText(val);
        },
        clearfunc: function (id) {
            Designer.PropertyPanel.SaveProertyCacheValue(id, "");
        }
    },
    {
        type: "VaildationRule", controlId: "divVaildationRule", css: "liger-popupedit",
        initfunc: function (id) {
            var val = $("#" + id).val();
            $("#txtVaildationRule").val(val);
        },
        submitfunc: function (e) {
            var val = $.trim($("#txtVaildationRule").val());
            Designer.PropertyPanel.SaveProertyCacheValue(e.element.id, val);
            e.setText(val);
        },
        clearfunc: function (id) {
            Designer.PropertyPanel.SaveProertyCacheValue(id, "");
        }
    }
]

//属性面板类
var PropertyPanel = function () {
    this.SelectedCtrlProperty = null,    //当前属性面板选中的控件属性（包括控件基本,WorkSheet,规则属性）
    this.PropertyPanelCtrlType = PropertyPanelControlType; //属性面板控件类别
    this.RichPropertyClass = "richProperty";

    this.Controls = {
        tabProperty: $("#tabProperty"), //基本属性表格
        p_ID: $("#p_ID"), //控件ID
        p_ItemName: $("#p_ItemName"),//数据项名称
        p_ItemType: $("#p_ItemType"), //数据项类型
        p_CtrlType: $("#p_CtrlType"), //控件类型
        p_DisplayName: $("#p_DisplayName"), //显示名称
        //p_ddlBindingValueType: $("#p_ddlBindingValueType"), //绑定值类型
        //p_ddlBindingValueRanges: $("select[id$='p_ddlBindingValueRanges']"),//选项值范围（数据字典）
        //p_BindingValueRanges: $("#p_BindingValueRanges"), //自定义值范围（用;分割）
        p_DefaultValue: $("#p_DefaultValue"), //初始值
        p_Width: $("#p_Width"), //宽度文本框
        p_WidthType: $("#p_WidthType"), //宽度类别（px,%）
        p_Height: $("#p_Height"), //高度文本框
        p_HeightType: $("#p_HeightType"), //高度类别(px,%)
        p_Style: $("#p_Style"), //样式名称
        p_Visible: $("#p_Visible"), //是否可见
        p_Description: $("#p_Description"), //描述
        /*WorkSheet*/
        divSheetProperty: $("#divSheetProperty"), // 表单属性
        tbSheetProperty: $("#tbSheetProperty"),   // 表单属性
        divBasic: $("#divBasic"),
        divTDTitle: $("#divTDTitle"),
        div_WorkSheet: $("#div_WorkSheet"), //worksheet Div
        tabProperty_WorkSheet: $("#tabProperty_WorkSheet"), //worksheet表格
        propertyTitle: $(".propertyTitle"),

        /*TR*/
        tr_p_DisplayName: $("#tr_p_DisplayName"), //显示名称行
        tr_p_BindingValueType: $("#tr_p_BindingValueType"), //绑定值类型行
        tr_p_BindingValueRanges: $("#tr_p_BindingValueRanges"), //绑定值范围行
        tr_p_DefaultValue: $("#tr_p_DefaultValue"), //初始值
        tr_p_CtrlType: $("#tr_p_CtrlType"), //控件类型
        tr_p_Style: $("#tr_p_Style"), //样式名称
        /*单元格表格*/
        td_Width: $("#td_Width"),
        td_Height: $("#td_Height"),
        td_Style: $("#td_Style"),
        //属性面板
        content_r: $(".content_r_item"),
        desc_title: $("#desc_title"),
        desc_content: $("#desc_content"),
        SelectedPropertyControl: null
    };

    this.Initial();     //初始化
};

PropertyPanel.prototype = {
    //绑定属性面板
    Bind: function () {
        this.Controls.desc_title.html("");
        this.Controls.desc_content.html("");
        //赋值给属性面板的 当前选中的控件属性
        this.SelectedCtrlProperty = Designer.SelectedCtrlProperty;
        Designer.ControlClick = true;
        this.Controls.p_ID.val(this.SelectedCtrlProperty.ControlId || "");       //控件ID

        //还原显示表格基本属性中的行
        this.Controls.tabProperty.find("tr:gt(0)").show();
        //还原属性面板控件的Enable状态
        $(".data").find("select,input").removeAttr("disabled");
        this.Controls.p_ID.attr("disabled", "disabled");  //控件ID不可编辑,禁止用户去修改（防止后台有相同ID时，取不到ID值）

        //显示WorkSheet部分
        this.Controls.div_WorkSheet.show();
        this.Controls.tabProperty_WorkSheet.show();
        this.Controls.divBasic.show();
        this.Controls.divTDTitle.hide();
        this.Controls.divSheetProperty.hide();
        this.Controls.tbSheetProperty.hide();
        //隐藏部分行
        this.Controls.tr_p_DisplayName.hide();
        this.Controls.tr_p_BindingValueType.hide();
        this.Controls.tr_p_BindingValueRanges.hide();
        this.Controls.tr_p_DefaultValue.hide();

        //根据控件类型，显示或隐藏部分行
        switch (this.SelectedCtrlProperty.LogicType) {
            case DesignerControls.SheetActionPanel.DisplayName:
                {
                    //隐藏WorkSheet内容
                    this.Controls.div_WorkSheet.hide();
                    this.Controls.tabProperty_WorkSheet.hide();
                    //只显示控件ID和控件类别
                    this.Controls.tabProperty.find("tr:gt(0)").hide();
                    this.Controls.tr_p_CtrlType.show();
                    break;
                }
            case DesignerControls.Label.DisplayName:
                {
                    //隐藏WorkSheet内容
                    this.Controls.div_WorkSheet.hide();
                    this.Controls.tabProperty_WorkSheet.hide();
                    //只显示控件ID,控件类别和显示名称
                    this.Controls.tabProperty.show();
                    this.Controls.tabProperty.find("tr:gt(0)").hide();
                    this.Controls.tr_p_CtrlType.show();
                    this.Controls.tr_p_DisplayName.show();
                    break;
                }
            case DesignerControls.SheetLabel.DisplayName:
                {
                    //显示控件ID,数据项名称,数据项类型,控件类型,显示名称
                    //this.Controls.tabProperty.find("tr:gt(4)").hide();
                    this.Controls.tr_p_CtrlType.show();
                    this.Controls.tr_p_Style.show();
                    this.Controls.tr_p_DisplayName.show();
                    break;
                }
            case DesignerControls.SheetTextBox.DisplayName:
            case DesignerControls.SheetRichTextBox.DisplayName:
                {
                    this.Controls.tr_p_BindingValueType.hide();
                    this.Controls.tr_p_BindingValueRanges.hide();
                    this.Controls.tr_p_DefaultValue.show();
                    break;
                }
            case DesignerControls.SheetDropDownList.DisplayName:
            case DesignerControls.SheetBizDropDownList.DisplayName:
            case DesignerControls.SheetRadioButtonList.DisplayName:
                {
                    this.Controls.tr_p_BindingValueType.show();
                    this.Controls.tr_p_BindingValueRanges.show();
                    break;
                }
        }

        this.Controls.p_ID.val(this.SelectedCtrlProperty.ControlId);  //控件ID
        this.Controls.p_ItemName.text(this.SelectedCtrlProperty.ItemName); //数据项名称
        this.Controls.p_ItemType.text(this.SelectedCtrlProperty.ItemType); //数据项类型
        this.Controls.p_CtrlType.text(this.SelectedCtrlProperty.LogicType); //控件类别
        this.Controls.p_DisplayName.val(this.SelectedCtrlProperty.DisplayName); //显示名称
        this.Controls.p_Description.val(this.SelectedCtrlProperty.Description); //描述信息
        this.Controls.p_DefaultValue.val(this.SelectedCtrlProperty.DefaultValue); //初始值
        this.Controls.p_Width.val(this.SelectedCtrlProperty.Width); //宽度
        this.Controls.p_WidthType.setSelectedValue(this.SelectedCtrlProperty.WidthType); //宽度方式
        this.Controls.p_Height.val(this.SelectedCtrlProperty.Height); //高度
        this.Controls.p_HeightType.setSelectedValue(this.SelectedCtrlProperty.HeightType); //高度方式
        this.Controls.p_Style.val(this.SelectedCtrlProperty.Style); //样式名称
        this.Controls.p_Description.val(this.SelectedCtrlProperty.Description);  //描述
        // this.Controls.p_Visible[0].checked = (this.SelectedCtrlProperty.Visible || this.SelectedCtrlProperty.Visible == 1);
        this.Controls.p_DisplayName.focus();

        //WorkSheet属性
        var workSheetPropertyArray = this.SelectedCtrlProperty.WorkSheetProperty;
        if (workSheetPropertyArray != null) {
            //移除WorkSheet表格内的所有行
            this.Controls.tabProperty_WorkSheet.children("tbody").children().remove();

            for (var i = 0; i < workSheetPropertyArray.length; i++) {
                if (workSheetPropertyArray[i].Name == "DataField")
                    continue;
                var css = (workSheetPropertyArray[i].Value && workSheetPropertyArray[i].Value != workSheetPropertyArray[i].DefaultValue) ? "titleChanged" : "title";

                var html = "<tr>"
                    + "<td class=\"" + css + "\" desc=\"" + workSheetPropertyArray[i].Description + "\">" + workSheetPropertyArray[i].Name + "</td>"
                    + "<td class=\"data\">"
                    + this._GenerateWorkSheetContorlHtml(this.SelectedCtrlProperty.Id, workSheetPropertyArray[i]);
                +"</td></tr>";
                this.Controls.tabProperty_WorkSheet.append(html);
            }
            //this.Controls.tabProperty_WorkSheet.find("." + this.RichPropertyClass).each(function (n) {
            //    $(this).RichTextBind($(this).attr("desc"));
            //});
            this._BindPropertyDescPrompt();
            //绑定WorkSheet功能
            this._BindWorkSheetOperate();
            //增加点击事件，弹出窗口
            $(".liger-popupedit").each(function () {
                $(this).ligerPopupEdit({
                    onButtonClick: function () {
                        Designer.PropertyPanel.PropertyPopSetting(this);
                    },
                    onClearClick: function () {
                        var id = this.element.id;
                        for (var i = 0; i < PropertySettingType.length; i++) {
                            if (id.indexOf(PropertySettingType[i].type) > -1) {
                                PropertySettingType[i].clearfunc.call(this, id);
                                break;
                            }
                        }
                    }
                    , width: "80px"
                });
            });
        }
        else {
            this.Controls.tabProperty_WorkSheet.children("tbody").children().remove();
        }
        event.stopPropagation();
        //end;
    },
    PropertyPopSetting: function (ligerObject) {
        var popId = null;
        var popfun = null;
        var popInit = null;
        var id = ligerObject.element.id;
        for (var i = 0; i < PropertySettingType.length; i++) {
            if (id.indexOf(PropertySettingType[i].type) > -1) {
                popId = PropertySettingType[i].controlId;
                popfun = PropertySettingType[i].submitfunc;
                popInit = PropertySettingType[i].initfunc;
                break;
            }
        }
        if (!popId) return;
        Designer.PopWindow(
            {
                id: popId,
                sumbitfunc: function () { popfun.call(this, ligerObject); },
                initfunc: function () { popInit.call(this, ligerObject.element.id); }
            });
    },
    SaveProertyCacheValue: function (id, val) {
        var ItemName = id.substring(id.lastIndexOf("_") + 1);
        var defaultValue = "";
        for (var i = 0; i < Designer.SelectedCtrlProperty.WorkSheetProperty.length; i++) {
            if (Designer.SelectedCtrlProperty.WorkSheetProperty[i].Name == ItemName) {
                Designer.SelectedCtrlProperty.WorkSheetProperty[i].Value = val;
                defaultValue = Designer.SelectedCtrlProperty.WorkSheetProperty[i].DefaultValue;
                break;
            }
        }
        // 设置属性编辑面板的显示样式
        var parentTd = null;
        parentTd = $("#" + id).parent();
        while (!parentTd.is("td")) { parentTd = parentTd.parent(); }
        parentTd.prev().attr("class", defaultValue == val ? "title" : "titleChanged");

        // 将JOSN对象保存到设计器的控件中
        $("#" + Designer.SelectedCtrlProperty.Id).attr("property", JSON.stringify(Designer.SelectedCtrlProperty));
        Designer.DesignerChanged = true;
    },
    //根据控件ID,WorkSheetProperty属性,Item名称生成对应的控件
    _GenerateWorkSheetContorlHtml: function (ParentID, WorkSheetItem) {
        if (WorkSheetItem == null) return "";

        var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
        var html = "";
        //保证唯一
        var id = "pWorkSheet_" + ParentID + "_" + WorkSheetItem.Name;
        var defaultVal = WorkSheetItem.Value || WorkSheetItem.DefaultValue;
        var ctrlClass = "";
        for (var i = 0; i < PropertySettingType.length; i++) {
            if (WorkSheetItem.Name == PropertySettingType[i].type) {
                ctrlClass = "class=\"" + PropertySettingType[i].css + "\"";
            }
        }

        var richProperty = WorkSheetItem.RichProperty ? this.RichPropertyClass : "";
        switch (WorkSheetItem.RenderType) {
            case PropertyPanelControlType.TextBox:
                {
                    var type = (WorkSheetItem.DefaultValue && !isNaN(WorkSheetItem.DefaultValue)) ? "number" : "text";
                    html = "<input type=\"" + type + "\" id=\"" + id + "\" style=\"width:94%\" " + ctrlClass + " placeholder=\"" + WorkSheetItem.PlaceHolder + "\" value=\"" + defaultVal + "\" />";
                    // html = "<input type=\"text\" id=\"" + id + "\" style=\"width:94%\" class=\"" + richProperty + "\" desc=\"" + WorkSheetItem.Description + "\" placeholder=\"" + WorkSheetItem.PlaceHolder + "\" value=\"" + defaultVal + "\" />";
                    break;
                }
            case PropertyPanelControlType.DropDownList:
                {
                    html = "<select id=\"" + id + "\" style=\"width:97%\">";

                    for (var i = 0, j = WorkSheetItem.ValueRange.length; i < j; i++) {
                        var selectedHtml = "";
                        //绑定当前的值
                        if (defaultVal == WorkSheetItem.ValueRange[i]) {
                            selectedHtml = "selected=\"selected\"";
                        }
                        html += "<option value='" + WorkSheetItem.ValueRange[i] + "' " + selectedHtml + " >" +
                            WorkSheetItem.ValueRange[i] + "</option>";
                    }
                    html += "</select>";
                    break;
                }
        }

        return html;
    },
    //ID规则为  "pWorkSheet_" + 页面对应控件ID + "_" + Sheet属性ItemName;
    _BindWorkSheetOperate: function () {
        //textbox
        this.Controls.tabProperty_WorkSheet.find("input[id^='pWorkSheet_'][type='text'],input[id^='pWorkSheet_'][type='number'],select[id^='pWorkSheet_']")
            .change(function () {
                var val = $(this).val();
                Designer.PropertyPanel.SaveProertyCacheValue(this.id, val);
            });
    },
    _GetWorkSheetPropertyItemIndex: function (name) {
        for (var i = 0; i < Designer.SelectedCtrlProperty.WorkSheetProperty.length; i++) {
            if (Designer.SelectedCtrlProperty.WorkSheetProperty[i].Name == name) {
                return i;
            }
        }
        return -1;
    },
    //绑定属性面板信息提示
    _BindPropertyDescPrompt: function () {
        this.Controls.content_r.find("tr").click(function () {
            var _this = Designer.PropertyPanel;
            var title = $(this).find("td:eq(0)").html();  //标题
            var desc = $(this).find("td:eq(0)").attr("desc"); //描述
            if (desc == undefined) desc = "";

            _this.Controls.desc_title.text(title);
            _this.Controls.desc_content.text(desc);
            _this.Controls.SelectedPropertyControl = $(this).find("input,select");
        })

        //增加tab键,自动选择下一行
        this.Controls.content_r.find("td").children().focus(function () {
            $(this).parents("tr").eq(0).click();
        });
    },
    //初始化
    Initial: function () {
        this._BindPropertyDescPrompt();
        // 显示或者隐藏属性面板
        this.Controls.propertyTitle.click(function () {
            var table = $(this).next();
            if (table.is(":hidden")) {
                table.show();
                $(this).find("img").attr("src", "images/up.gif");
            }
            else {
                table.hide();
                $(this).find("img").attr("src", "images/down.gif");
            }
        });
        // 控件ID
        this.Controls.p_ID.change(function () {
            var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
            if (!SelectedCtrlProperty) return;

            //保存当前控件的ID
            var tempID = SelectedCtrlProperty.Id;
            SelectedCtrlProperty.Id = $(this).val();
            if ($(this).val() == "") {
                alert("控件ID不能为空！");
                $(this).val(tempID);
                $(this).select();
                return;
            }

            //先赋值Property给控件，再修改Id
            $("#" + tempID).attr("property", JSON.stringify(SelectedCtrlProperty));
            $("#" + tempID).attr("id", $(this).val());
            Designer.DesignerChanged = true;
        });

        //显示名称
        this.Controls.p_DisplayName.change(function () {
            var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
            if (!SelectedCtrlProperty) return;

            SelectedCtrlProperty.DisplayName = $(this).val();
            $("#" + SelectedCtrlProperty.Id).html($(this).val());
            $("#" + SelectedCtrlProperty.Id).attr("property", JSON.stringify(SelectedCtrlProperty));
            Designer.DesignerChanged = true;
        });

        //初始值
        this.Controls.p_DefaultValue.change(function () {
            var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
            if (!SelectedCtrlProperty) return;

            SelectedCtrlProperty.DefaultValue = $(this).val();
            $("#" + SelectedCtrlProperty.Id).val($(this).val());
            $("#" + SelectedCtrlProperty.Id).attr("property", JSON.stringify(SelectedCtrlProperty));
            Designer.DesignerChanged = true;
        });

        //修改样式
        this.Controls.p_Style.change(function () {

            var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
            if (!SelectedCtrlProperty) return;

            var style = "";
            var _this = Designer.PropertyPanel;  //获取设计器当前的属性面板对象

            //宽度
            var w = _this.Controls.p_Width.val();
            if (w != "" && w != 0) {
                var w_type = (parseInt(_this.Controls.p_WidthType.val()) == 0) ? "px" : "%";
                style = style + "width:" + w + w_type + ";";
                SelectedCtrlProperty.Width = w;
                SelectedCtrlProperty.WidthType = parseInt(_this.Controls.p_WidthType.val());
            }

            //高度
            var h = _this.Controls.p_Height.val();
            if (h != "" && h != 0) {
                var h_type = (parseInt(_this.Controls.p_HeightType.val()) == 0) ? "px" : "%";
                style = style + "height:" + h + h_type + ";";
                SelectedCtrlProperty.Height = h;
                SelectedCtrlProperty.HeightType = parseInt(_this.Controls.p_HeightType.val());
            }

            if (style != "") {
                $("#" + SelectedCtrlProperty.Id).attr("style", style);
            }
            var _class = _this.Controls.p_Style.val();
            if (_class == "") {
                $("#" + SelectedCtrlProperty.Id).addClass(_class);
            }
            SelectedCtrlProperty.Style = _class;
            $("#" + SelectedCtrlProperty.Id).attr("property", JSON.stringify(SelectedCtrlProperty));

            Designer.DesignerChanged = true;
        });

        this.Controls.p_Width.change(function () {
            Designer.PropertyPanel.Controls.p_Style.change();
        });

        this.Controls.p_WidthType.change(function () {
            Designer.PropertyPanel.Controls.p_Style.change();
        });

        this.Controls.p_Height.change(function () {
            Designer.PropertyPanel.Controls.p_Style.change();
        });

        this.Controls.p_HeightType.change(function () {
            Designer.PropertyPanel.Controls.p_Style.change();
        });

        ////可见性
        //this.Controls.p_Visible.change(function (e) {
        //    var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
        //    if (!SelectedCtrlProperty) return;
        //    SelectedCtrlProperty.Visible = $(this).is(":checked") ? true : false;
        //    $("#" + SelectedCtrlProperty.Id).attr("property", JSON.stringify(SelectedCtrlProperty));
        //    e.preventDefault();
        //});
        //描述
        this.Controls.p_Description.change(function () {
            var SelectedCtrlProperty = Designer.SelectedCtrlProperty;
            if (!SelectedCtrlProperty) return;

            SelectedCtrlProperty.Description = $(this).val();
            $("#" + SelectedCtrlProperty.Id).attr("property", JSON.stringify(SelectedCtrlProperty));
            Designer.DesignerChanged = true;
        });

        //---------------单元格编辑操作--------------------

        this.Controls.td_Width.unbind("change").change(function () {
            if (Designer.TabLogic.SelectedTabCell == null) return;
            var width = $(this).val();
            if (width) {
                $(Designer.TabLogic.SelectedTabCell).attr("width", width);
                Designer.DesignerChanged = true;
                // alert($(Designer.TabLogic.SelectedTabCell).attr("width"));
            }
        });

        this.Controls.td_Height.unbind("change").change(function () {
            if (Designer.TabLogic.SelectedTabCell == null) return;
            var height = $(this).val();
            if (height) {
                $(Designer.TabLogic.SelectedTabCell).attr("height", height);
                Designer.DesignerChanged = true;
            }
        });

        this.Controls.td_Style.unbind("change").change(function () {
            if (Designer.TabLogic.SelectedTabCell == null) return;
            var _class = $(this).val();
            if (_class) {
                $(Designer.TabLogic.SelectedTabCell).attr("class", _class);
                Designer.DesignerChanged = true;
            }
        });
    }
};

