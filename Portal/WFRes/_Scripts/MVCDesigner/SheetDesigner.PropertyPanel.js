/// <reference path="SheetDesigner.js" />

// 属性面板控件类别
var PropertyPanelControlType = {
    TextBox: "TextBox",
    DropDownList: "DropDownList"
};

var MasterData;
$.get(PortalRoot + "/MVCDesigner/GetMasterDataCategory", function (data) {
    MasterData = data; //已经是JSON格式
});

// 父文本框绑定
$.fn.RichTextBind = function () {
    $(this).unbind("click.Property").bind("click.Property", function () {
        var o = this;
        var message = $(this).parent().prev().attr("desc");
        var title = $(this).parents("td:first").prev().text();

        $("#divRichText .richTextTitle").html(message);
        $("#divRichText textarea").val(o.value);
        $.ligerDialog.open({
            title: title,
            target: $("#divRichText"),
            height: 390,
            isHidden: true,
            width: 600,
            buttons: [
               {
                   text: '确定', onclick: function (item, dialog) {
                       o.value = $("#divRichText textarea").val();
                       $(o).change();
                       dialog.close();
                   }
               },
               {
                   text: '取消', onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });

        $("#divRichText textarea").focus();
    });

    return $(this);
}

// 父文本框绑定
$.fn.Designable = function (PropertyPanel) {
    $(this).attr("tabindex", "0");
    $(this).unbind("click.Property").bind("click.Property",
            [PropertyPanel], function (e) {
                var target = $(e.target);
                if (target.attr("data-for")) {
                    var targetId = target.attr("data-for");
                    target = $("#" + targetId);
                }

                if (e.data[0].SelectedControl) {
                    var id = e.data[0].SelectedControl.attr("id");
                    if (id == target.attr("id")) return;
                }

                e.data[0].BindClick(e.ctrlKey, target);
                e.stopPropagation();

                // 因为stopPropagation，需要隐藏contextMenu
                $("#jqContextMenu").hide();
                $("#jqContextMenuShadow").hide();
            });
    return $(this);
}

//属性面板类
SheetDesigner.PropertyPanel = function (DesignerControls) {
    this.DesignerContent = "DesignerContent";
    this.RichPropertyClass = "richProperty";
    this.PropertyTitleClass = "propertyTitle";
    this.PropertyChanged = "titleChanged";
    this.SheetClass = "Sheet";
    this.HtmlClass = "Html";
    this.ControlClass = "Control";
    this.SelectedControl = null;             // 获取当前正在编辑的控件
    this.SelectedProperty = null;
    this.SelectedArray = [];

    this.Controls = {
        PropertyTitle: $("." + this.PropertyTitleClass),

        txtId: $("#txtId"),              // 控件ID
        lblControlType: $("#lblControlType"), // 控件类型
        txtCssClass: $("#txtCssClass"),  // 控件的Css名称
        txtHeight: $("#txtHeight"),      // 控件的高度
        txtWidth: $("#txtWidth"),        // 控件的宽度
        chkVisiable: $("#chkVisiable"),  // 是否可见,不可见则设置样式为：hidden
        txtDisplayName: $("#txtDisplayName"), // 显示文本
        txtEnglishText: $("#txtEnglishText"), // 英文文本
        selHeight: $("#selHeight"),      // 控件的高度类型
        selWidth: $("#selWidth"),        // 控件的宽度类型
        DIV_DisplayRule: $("#DIV_DisplayRule"), // 单元格的DisplayRule

        //属性面板
        content_r: $(".content_r_item"),
        desc_title: $("#desc_title"),
        desc_content: $("#desc_content"),
        DesignerContent: $(".DesignerContent"),
        DesignerControls: DesignerControls,

        controlProperty: $(".controlProperty"),
        controlEvent: $(".controlEvent"),

        SheetProperty: $("tr[data-group='Sheet'],tr[group='Sheet']"),
        HtmlProperty: $("tr[data-group='Html'],tr[group='Html']"),
        ControlProperty: "tr[data-group='Control'],tr[group='Control']",
        ControlEvent: "tr[data-group='Event'],tr[group='Event']",

        txtJavascript: $("#txtJavascript"),                 // 表单属性Javascript
        txtPrint: $("#txtPrint"),                           // 表单打印模板
        PropertyTable: $(".PropertyTable")
    };

    this.Initial();     //初始化
};

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

function Guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

SheetDesigner.PropertyPanel.prototype = {
    //初始化
    Initial: function () {
        // 显示或者隐藏属性面板
        this._BindPropertyTitleClick();
        // 设置描述内容的显示
        this._BindPropertyDescPrompt();
        // 绑定富文本框编辑属性
        this._BindRichProperty();

        this.Controls.txtId.unbind("change.Property").bind("change.Property", [this], function (e) {
            var oldId = e.data[0].SelectedControl.attr("id");
            if (!e.data[0].ValidateID(this.value)) {
                alert("控件ID不允许包含特殊字符!");
                this.value = oldId;
                return;
            }
            if (!oldId || this.value != oldId) {
                if ($("#" + this.value).length > 0) {
                    alert("控件ID重复!");
                    this.value = oldId || "";
                }
            }
            e.data[0].SelectedControl.attr("id", this.value);
        });
        this.Controls.DIV_DisplayRule.unbind("change.Property").bind("change.Property", [this], function (e) {
            // debugger
            e.data[0].SelectedControl.attr("data-Celldisplayrule", this.value);
            var oldId = e.data[0].SelectedControl.attr("id");
            if (!oldId) {
                oldId = "div" + Guid();
                $("#txtId").val(oldId);
                e.data[0].SelectedControl.attr("id", oldId);
            }
        });
        this.Controls.txtCssClass.unbind("change.Property").bind("change.Property", [this], function (e) {
            e.data[0].SelectedControl.attr("class", this.value);
        });
        this.Controls.txtHeight.unbind("change.Property").bind("change.Property", [this], function (e) {
            if (!this.value) {
                e.data[0].SelectedControl.css("height", "");
            }
            else
                e.data[0].SelectedControl.css("height", this.value + e.data[0].Controls.selHeight.val());
        });
        this.Controls.txtWidth.unbind("change.Property").bind("change.Property", [this], function (e) {
            if (!this.value) {
                e.data[0].SelectedControl.css("width", "");
            }
            else
                e.data[0].SelectedControl.css("width", this.value + e.data[0].Controls.selWidth.val());
        });
        this.Controls.txtDisplayName.unbind("change.Property").bind("change.Property", [this], function (e) {
            if (e.data[0].SelectedControl)
                e.data[0].SelectedControl.html($.trim(this.value.replace(/\n/g, "<br>")));
        });
        this.Controls.txtEnglishText.unbind("change.Property").bind("change.Property", [this], function (e) {
            if (e.data[0].SelectedControl)
                e.data[0].SelectedControl.attr("data-en_us", $.trim(this.value.replace(/\n/g, "<br>")));
        });
        this.Controls.selHeight.unbind("change.Property").bind("change.Property", [this], function (e) {
            e.data[0].SelectedControl.css("height", e.data[0].Controls.txtHeight.val() + this.value);
        });
        this.Controls.selWidth.unbind("change.Property").bind("change.Property", [this], function (e) {
            e.data[0].SelectedControl.css("width", e.data[0].Controls.txtWidth.val() + this.value);
        });
        this.Controls.chkVisiable.unbind("change.Property").bind("change.Property", [this], function (e) {
            if (this.checked) {
                e.data[0].SelectedControl.removeClass("hidden");
            }
            else {
                e.data[0].SelectedControl.addClass("hidden");
            }
        });

        // 注册所有的控件事件
        $(".DesignerContent").find(this.Controls.DesignerControls).Designable(this);
    },
    Refresh: function (container) {
        $(".DesignerContent").find(this.Controls.DesignerControls).Designable(this);
    },
    ValidateID: function (val) {
        var str = "\"\\/? ,&;><^+-()@#!~`。|{}*$";
        while (str.length > 0) {
            if (val.indexOf(str.substring(0, 1)) > -1) {
                return false;
            }
            str = str.substring(1);
        }
        return true;
    },
    // 绑定 Dom 显示
    BindDom: function (control) {
        var dom = $(".content_m2 > ul").find(".dom");
        if (dom.length == 0) {
            dom = $("<li class=\"dom\">|&nbsp;&nbsp;</li>");
            dom.appendTo($(".content_m2 > ul"));
        }
        else {
            dom.html("|&nbsp;&nbsp;");
        }

        $("<span style=\"padding:2px\">></span><span style=\"background-color:#FFFFFF\">" + control[0].tagName + "</span> ").appendTo(dom);
        var p = control.parent();
        var tagName = p[0].tagName;
        var index = 0;
        var parents = [];
        var divContinue = control.hasClass("sheetContainer");
        while (tagName) {
            var domSpan;
            if (tagName.toLowerCase() != "div" || !divContinue) {
                var span = dom.find("span");
                parents.push(p);
                domSpan = $("<span data-id=\"" + index + "\"></span>").text(tagName).bind("click",
                    function () {
                        var n = $(this).attr("data-id");
                        parents[n].click();
                    });
                span.eq(0).before(domSpan);
                if (p.hasClass("sheetContainer")) divContinue = true;
            }
            index++;
            p = p.parent();
            if (p.length == 0) break;
            tagName = p[0].tagName;
            if (tagName.toLowerCase() == "html") break;
            if (domSpan && tagName.toLowerCase() != "div" || !divContinue) {
                domSpan.before($("<span style=\"padding:2px\">></span>"));
            }
        }
    },
    // 绑定属性面板
    BindClick: function (ctrlKey, control) {
        if (!ctrlKey) {
            $(".DesignerContent .ControlSelected").removeClass("ControlSelected");
            this.SelectedArray.length = 0;
        }

        if (this.SelectedProperty && this.SelectedProperty.length > 0) {
            this.SelectedProperty.change();
        }

        this._addMergeCell(control);

        this.BindDom(control);
        this.Controls.desc_title.html("");
        this.Controls.desc_content.html("");

        this.SelectedControl = control;
        this.SelectedControl.addClass("ControlSelected");

        // 初始值绑定
        this.Controls.txtId.val(control.attr("id") || "");
        this.Controls.txtDisplayName.val($.trim(this.SelectedControl.html().replace(/<br>/g, "\n")));
        // debugger;
        this.Controls.DIV_DisplayRule.val(control.attr("data-Celldisplayrule") || "");

        var enTxt = $.trim(this.SelectedControl.attr("data-en_us")) || "";
        this.Controls.txtEnglishText.val(enTxt.replace(/<br>/g, "\n"));
        this.Controls.txtCssClass.val(control.attr("class") || "");
        this.Controls.chkVisiable.attr("checked", !control.hasClass("hidden"));
        // TODO:Height/Width
        // this.Controls.txtId.focus();
        if (control.data("type")) this.Controls.lblControlType.html(control.data("type"));
        else {
            this.Controls.lblControlType.html(control[0].tagName);
        }
        if (control.hasClass("divContent")
            || control.hasClass("DesignerContent")
            || control.hasClass("panel-body")) {// 是表单容器
            this.Controls.SheetProperty.show();
            this.Controls.HtmlProperty.hide(); 
            $(this.Controls.DIV_DisplayRule).parent().parent().show();
            $(this.Controls.ControlProperty).hide();
            $(this.Controls.ControlEvent).hide();
        }
        else if (this.IsControl(control)) {
            this.Controls.SheetProperty.hide();
            this.Controls.HtmlProperty.show(); 
            $(this.Controls.DIV_DisplayRule).parent().parent().hide();
            $(this.Controls.ControlProperty).show();
            $(this.Controls.ControlEvent).show();
        }
        else {
            this.Controls.SheetProperty.hide();
            this.Controls.HtmlProperty.show(); 
            $(this.Controls.DIV_DisplayRule).parent().parent().show();
            $(this.Controls.ControlProperty).hide();
            $(this.Controls.ControlEvent).hide();
        }
        if (this.SelectedControl.is("label") || this.SelectedControl.is("span")) {
            this.Controls.txtDisplayName.parent().parent().show();
            this.Controls.txtEnglishText.parent().parent().show();
        }
        else {
            this.Controls.txtDisplayName.parent().parent().hide();
            this.Controls.txtEnglishText.parent().parent().hide();
        }
        if (!control.hasClass("divContent") && !control.hasClass("panel-body")) {// 是表单容器
            this.Controls.txtId.val(this.SelectedControl.attr("id") || "");
            // debugger;
            this.Controls.DIV_DisplayRule.val(this.SelectedControl.attr("data-Celldisplayrule") || "");

            this.Controls.txtCssClass.val(this.SelectedControl.attr("class") || "");
            var style = this.SelectedControl.attr("style");
            this.Controls.txtHeight.val("");
            this.Controls.txtWidth.val("");
            if (style) {
                if (style.indexOf("height:") > -1) {
                    var height = style.substring(style.indexOf("height:") + 7);
                    height = height.substring(0, height.indexOf(";"));
                    if (height.indexOf("px") > -1) {
                        //this.Controls.selHeight.options[1].selected = true;
                        this.Controls.selHeight.setSelectedIndex(1);
                    }
                    this.Controls.txtHeight.val(height.replace("px", "").replace("%", ""));
                }
                if (style.indexOf("width:") > -1) {
                    var width = style.substring(style.indexOf("width:") + 7);
                    width = width.substring(0, width.indexOf(";"));
                    if (width.indexOf("px") > -1) {
                        // this.Controls.selWidth.options[1].selected = true;
                        this.Controls.selWidth.setSelectedIndex(1);
                    }
                    this.Controls.txtWidth.val(width.replace("px", "").replace("%", ""));
                }
            };
        }
        // 如果 datafield 值不为空，则表示为 data-field 属性,绑定 SheetControls 的属性值
        if (this.IsControl(control)) {
            var controlType = control.data("type");
            $("tr[group='Control']").remove();
            $("tr[group='Event']").remove();

            if (SheetControls[controlType]) {
                if (SheetControls[controlType].DesignProperties && SheetControls[controlType].DesignProperties.length > 0) {
                    this._BindProperty(control, SheetControls[controlType].DesignProperties, $(this.Controls.ControlProperty));
                }
                else {
                    $(this.Controls.ControlProperty).hide();
                }
                if (SheetControls[controlType].DesignEvents && SheetControls[controlType].DesignEvents.length > 0) {
                    this._BindProperty(control, SheetControls[controlType].DesignEvents, $(this.Controls.ControlEvent), true);
                }
                else {
                    $(this.Controls.ControlEvent).hide();
                }
            }
        }
        // 重新绑定属性显示信息
        this._BindPropertyDescPrompt();
        // 绑定属性改变事件
        this._BindPropertyChanged();
        // 绑定富文本框编辑属性
        this._BindRichProperty();
        if (event.stopPropagation) event.stopPropagation();
        //end;
    },

    _addMergeCell: function (control) {
        // 不是单元格
        if (!control.parent().hasClass("row")) {
            return;
        }

        if (this.SelectedArray.length > 0) {
            var selectedone = this.SelectedArray[0];

            // 不属于同一个divContent
            if (selectedone.parents(".divContent").attr("id") != control.parents(".divContent").attr("id")) {
                return;
            }

            // 已选中
            if (selectedone.attr("id") === control.attr("id")) {
                return;
            }

            var hasSameWidth = this._getWidthNum(selectedone.attr("class")) === this._getWidthNum(control.attr("class"));

            if (this.SelectedArray.length == 1) {
                // 同一行 
                if (selectedone.parent().index() === control.parent().index()) {
                    this.SelectedArray.push(control);
                }
                else {
                    // 同一列 列的宽度相同
                    if (selectedone.index() === control.index() && hasSameWidth) {
                        this.SelectedArray.push(control);
                    }
                }
            }
            else {
                var selectedtwo = this.SelectedArray[1];
                // 已选择的单元格是同一行的
                if (selectedone.parent().index() === selectedtwo.parent().index()) {
                    if (selectedone.parent().index() === control.parent().index()) {
                        this.SelectedArray.push(control);
                    }
                }

                // 已选择的单元格是同一列的
                if (selectedone.index() === selectedtwo.index()) {
                    if (selectedone.index() === control.index() && hasSameWidth) {
                        this.SelectedArray.push(control);
                    }
                }
            }
        }
        else {
            this.SelectedArray.push(control);
        }
    },

    _getWidthNum: function (className) {
        var widthNum = 0;
        if (className && className.indexOf("col-md-") > -1) {
            var widthNum = className.split("col-md-")[1];
            if (widthNum.indexOf(" ") > -1) {
                widthNum = widthNum.substring(0, widthNum.indexOf(" "));
            }
            if (!isNaN(widthNum)) {
                widthNum = parseInt(widthNum);
            }
        }
        return widthNum;
    },
    _adjustCellWidth: function (cells, widthNum) { // 把单元格用row包起来加入cell里后，需要重新计算单元格的宽度
        var widthNums = [];
        for (var j = 0; j < cells.length; j++) {
            widthNums.push(Math.round(this._getWidthNum($(cells[j]).attr("class")) * (12.0 / widthNum)));
        }
        var widthNumSum = 0;
        for (j = 0; j < widthNums.length; j++) {
            widthNumSum += widthNums[j];
        }
        if (widthNumSum > 12) { // 宽度之和不能大于12
            for (j = 0; j < widthNums.length; j++) {
                if (widthNums[j] > 1) {
                    widthNums[j] = widthNums[j] - 1;
                    break;
                }
            }
        }

        // 修改宽度样式
        for (j = 0; j < cells.length; j++) {
            var cell = $(cells[j]);
            var oldWidthClassName = "col-md-" + this._getWidthNum(cell.attr("class"));
            cell.removeClass(oldWidthClassName).addClass("col-md-" + widthNums[j]);
        }
    },
    // 合并单元格
    MegerColumns: function (cols, sheetLayout) {

        if (!cols) {
            cols = this.SelectedArray;
        }

        if (cols.length < 2) {
            return;
        }

        var cells = [];
        for (var i = 0, len = cols.length; i < len; i++) {
            cells.push($(cols[i]));
        }

        // colspan 列合并
        if (cells[0].parent().index() === cells[1].parent().index()) {
            // 按单元格位置排序
            cells.sort(function (c1, c2) {
                return c1.index() - c2.index();
            });

            var preIndex = undefined;
            for (i = 0, len = cells.length; i < len; i++) {
                // 是否是没有合并过的单元格
                //if (cells[i].attr("colspan") || cells[i].attr("rowspan")) {
                //    return;
                //}
                // 是否是连续的单元格
                if (preIndex) {
                    if (preIndex + 1 != cells[i].index()) {
                        return;
                    }
                }
                preIndex = cells[i].index();
            }

            // 合并
            var firstCell = cells[0];
            var newWidthNum = this._getWidthNum(firstCell.attr("class"));
            for (i = 1, len = cells.length; i < len; i++) {
                var cell = cells[i];
                firstCell.append(cell.html());
                newWidthNum += this._getWidthNum(cell.attr("class"));
                cell.remove();
            }
            if (newWidthNum > 0) {
                firstCell.removeClass("col-md-" + this._getWidthNum(firstCell.attr("class")));
                firstCell.addClass("col-md-" + newWidthNum);
                firstCell.attr("colspan", cells.length);
            }

            this.SelectedArray.length = 0;
        }
        else if (cells[0].index() === cells[1].index()) { // rowspan 行合并
            // 按单元格位置排序
            cells.sort(function (c1, c2) {
                return c1.parent().index() - c2.parent().index();
            });

            preIndex = undefined;
            for (i = 0, len = cells.length; i < len; i++) {
                // 是否是没有合并过的单元格
                //if (cells[i].attr("colspan") || cells[i].attr("rowspan")) {
                //    return;
                //}
                // 是否是连续的单元格
                if (preIndex) {
                    if (preIndex + 1 != cells[i].parent().index()) {
                        return;
                    }
                }
                preIndex = cells[i].parent().index();
            }

            // 合并
            var newRow = cells[0].parent(),
                newCell = cells[0].attr("rowspan", cells.length),
                newLeftCell = $('<div id="' + Date.now() + '"></div>').css({ "border": "0" }),
                newRightCell = $('<div id="' + Date.now() + '"></div>').css({ "border": "0" }),
                leftRow,
                rightRow,
                leftCells,
                rightCells;

            for (i = 0, len = cells.length; i < len; i++) {
                // 把每行左边的单元格用row包起来放入newLeftCell中
                leftCells = cells[i].prevAll(); //倒序
                if (leftCells.length > 0) {
                    // 按单元格位置排序
                    leftCells.sort(function (c1, c2) {
                        return $(c1).index() - $(c2).index();
                    });

                    // 计算newLeftCell的宽度
                    var newWidthNum = 0;
                    for (var j = 0; j < leftCells.length; j++) {
                        newWidthNum += this._getWidthNum($(leftCells[j]).attr("class"));
                    }
                    if (newWidthNum && !newLeftCell.attr("class")) {
                        newLeftCell.attr("class", "col-md-" + newWidthNum);
                    }

                    this._adjustCellWidth(leftCells, newWidthNum);

                    // 把每行左边的单元格用leftRow包起
                    leftRow = $('<div class="row"></div>').css({ "border": "0" });
                    leftRow.append(leftCells);

                    // 把leftRow放入newLeftCell中
                    newLeftCell.append(leftRow);
                }

                // 把每行右边的单元格用row包起来放入newRightCell中
                rightCells = cells[i].nextAll();
                if (rightCells.length > 0) {
                    // 计算newRightCell的宽度
                    newWidthNum = 0;
                    for (var j = 0; j < rightCells.length; j++) {
                        newWidthNum += this._getWidthNum($(rightCells[j]).attr("class"));
                    }
                    if (newWidthNum && !newRightCell.attr("class")) {
                        newRightCell.attr("class", "col-md-" + newWidthNum);
                    }

                    // 重新计算宽度
                    this._adjustCellWidth(rightCells, newWidthNum);

                    // 把每行右边的单元格用rightRow包起
                    rightRow = $('<div class="row"></div>').css({ "border": "0" });
                    rightRow.append(rightCells);

                    // 把rightRow放入newRightCell中
                    newRightCell.append(rightRow);
                }

                if (i != 0) {
                    // 把要合并的单元格的内容集中到第一个中
                    newCell.append(cells[i].html());
                    // 移除合并后多余的行
                    cells[i].parent().remove();
                }
            }

            // 把cell添加到新行中
            newRow.empty();
            if (newLeftCell.children().length > 0) {
                newRow.append(newLeftCell);
            }
            newRow.append(newCell);
            if (newRightCell.children().length > 0) {
                newRow.append(newRightCell);
            }
            newCell.height(newCell.parent().height() - 2);

            // 清除SelectedArray
            this.SelectedArray.length = 0;

            // 给新增的单元格绑定click.Property事件
            this.Refresh();

            // 重新初始化单元格的contextMenu事件
            sheetLayout.InitialColMenu();
        }
    },
    // 获取是否是 Worksheet 控件
    IsControl: function (control) {
        return control.attr("data-datafield");
    },
    // 获取当前控件的所属类型
    GetControlType: function (control) {
        var controlType = control.attr("data-control");
    },
    _BindProperty: function (control, properties, parentControl, richProperty) {
        if (properties) {
            var group = parentControl.eq(0).data("group");
            for (var i = properties.length - 1; i >= 0; i--) {
                var css = "";
                var v = control.attr("data-" + properties[i].Name.toLowerCase()) || "";
                if (v && v != properties[i].DefaultValue) {
                    css = this.PropertyChanged;
                }
                var html = "<tr group=\"" + group + "\">";
                html += "<td></td>";
                html += "<td class=\"" + css + "\" desc=\"" + properties[i].Description + "\">";
                html += properties[i].Name;
                html += "</td>";
                html += "<td class=\"data\" colspan=\"2\">";
                html += this._GenerateWorkSheetContorlHtml(control.attr("id"), v, properties[i], richProperty, control.attr("data-" + properties[i].Name.toLowerCase()) == undefined);
                html += "</td>";
                html += "</tr>";
                $(html).insertAfter(parentControl.eq(0));
                //if (properties[i].Popup) {
                //    PropertyGuide[properties[i].Popup].call(this, $(html).find("input"),
                //        properties[i].Popup,
                //        properties[i].Height,
                //        properties[i].Width);
                //}
            }
        }
    },
    //根据控件ID,WorkSheetProperty属性,Item名称生成对应的控件
    _GenerateWorkSheetContorlHtml: function (controlId, propertyValue, sheetProperty, richProperty, displayDefaultValue) {
        var controlId = controlId + "_" + sheetProperty.Name;
        var html = "";
        // 保证唯一
        var defaultVal = sheetProperty.DefaultValue;
        if (typeof (sheetProperty.DefaultValue) == "undefined") {
            defaultVal = "";
        }
        var val = propertyValue;
        if (!val && displayDefaultValue) {
            val = defaultVal;
        }
        // var val = propertyValue || defaultVal;
        if (sheetProperty.RichProperty || richProperty) {
            html = "<textarea id=\"" + controlId + "\" class=\"" + this.RichPropertyClass + "\" data-property=\"" + sheetProperty.Name + "\" data-defaultvalue=\"" + defaultVal + "\" style=\"width: 95%; height: 50px;\">" + propertyValue + "</textarea>";
        }
        else if (sheetProperty.Name.toLowerCase() == "datafield") {
            html = "<label data-defaultvalue=\"" + defaultVal + "\" data-property=\"" + sheetProperty.Name + "\" id=\"" + controlId + "\" style=\"width:95%\">" + val + "</label>";
        }
        else if (sheetProperty.ValueRange) {
            html = "<select id=\"" + controlId + "\" style=\"width:95%\" data-property=\"" + sheetProperty.Name + "\" data-defaultvalue=\"" + defaultVal + "\">";

            for (var i = 0, j = sheetProperty.ValueRange.length; i < j; i++) {
                var selectedHtml = "";
                // 绑定当前的值
                if (val.toString().toLowerCase() == sheetProperty.ValueRange[i].toString().toLowerCase()) {
                    selectedHtml = "selected=\"selected\"";
                }
                html += "<option value='" + sheetProperty.ValueRange[i] + "' " + selectedHtml + " >" +
                    sheetProperty.ValueRange[i] + "</option>";
            }
            html += "</select>";
        }
        else if (sheetProperty.Name.toLowerCase() == "masterdatacategory") {
            html = "<select id=\"" + controlId + "\" style=\"width:95%\" data-property=\"" + sheetProperty.Name + "\" data-defaultvalue=\"" + defaultVal + "\">";
            // 从后台获取所有的主数据

            html += "<option value=''></option>";
            if (MasterData != undefined) {
                for (var i = 0; i < MasterData.length; i++) {
                    var selectedHtml = "";
                    if (val.toString() == MasterData[i]) {
                        selectedHtml = "selected=\"selected\"";
                    }
                    html += "<option value='" + MasterData[i] + "' " + selectedHtml + " >" +
                       MasterData[i] + "</option>";
                }
            }
            html += "</select>";
        }
        else {
            var type = "text";
            if (defaultVal && !isNaN(defaultVal)) type = "number";
            html = "<input type=\"" + type + "\" data-defaultvalue=\"" + defaultVal + "\" data-property=\"" + sheetProperty.Name + "\" id=\"" + controlId + "\" style=\"width:95%\"";
            if (sheetProperty.PlaceHolder)
                html += " placeholder=\"" + sheetProperty.PlaceHolder + "\"";
            if (sheetProperty.Popup) {
                html += " data-Popup=\"" + sheetProperty.Popup + "\"";
                if (sheetProperty.Popup)
                    html += " data-Description=\"" + sheetProperty.Description + "\"";
            }
            if (sheetProperty.Height)
                html += " data-Height=\"" + sheetProperty.Height + "\"";
            if (sheetProperty.Width)
                html += " data-Width=\"" + sheetProperty.Width + "\"";
            html += " value=\"" + val + "\" />";
            //if (sheetProperty.Popup) {
            //    PropertyGuide[sheetProperty.Popup].call(this, html.find("input"), sheetProperty.Popup, sheetProperty.Height, sheetProperty.Width);
            //}
        }
        return html;
    },
    // 绑定属性的事件
    _BindPropertyChanged: function () {
        this.Controls.PropertyTable.find("input[data-property],textarea[data-property],select[data-property]")
            .unbind("change.Property").bind("change.Property",
                [this],
                function (e) {
                    e.data[0]._PropertyChanged($(this), e.data[0].PropertyChanged);
                }).unbind("click.Property").bind("click.Property",
                [this],
                function (e) {
                    e.data[0].SelectedProperty = $(this);
                });
    },
    // 属性 Change 事件
    _PropertyChanged: function (PropertyControl, PropertyChangedClass) {
        var defaultValue = PropertyControl.data("defaultvalue");
        var property = PropertyControl.data("property");
        var id = PropertyControl.attr("id");
        var id = id.substring(0, id.lastIndexOf("_"));
        if (PropertyControl.val() == defaultValue.toString()) {
            //$("#" + id).removeAttr("data-" + property)
            $("[id='" + id + "']").removeAttr("data-" + property.toLowerCase());
            PropertyControl.parent().prev().removeClass(PropertyChangedClass);
        }
        else {
            PropertyControl.parent().prev().addClass(PropertyChangedClass);
            //$("#" + id).attr("data-" + property.toLowerCase(), PropertyControl.val());
            $("[id='" + id + "']").attr("data-" + property.toLowerCase(), PropertyControl.val());

        }
    },
    // 显示对应的属性
    _BindPropertyTitleClick: function () {
        this.Controls.PropertyTitle.unbind("click.Property").bind("click.Property", function () {
            var group = $(this).attr("data-group");
            var trs = $(this).parent().find("tr[group='" + group + "']");
            var hidden = trs.eq(0).is(":hidden");
            if (hidden) {
                trs.show();
                $(this).find("td").eq(0).removeClass("Fold").addClass("Expanded");
            }
            else {
                trs.hide();
                $(this).find("td").eq(0).removeClass("Expanded").addClass("Fold");
            }
        });
    },
    //绑定属性面板信息提示
    _BindPropertyDescPrompt: function () {
        this.Controls.PropertyTable.find("tr").unbind("click.Porperty").bind("click.Porperty", [this],
            function (e) {
                var title = $(this).find("td:eq(1)").html();  //标题
                var desc = $(this).find("td:eq(1)").attr("desc"); //描述
                if (desc == undefined) desc = "";

                e.data[0].Controls.desc_title.text(title);
                e.data[0].Controls.desc_content.text(desc);
            })

        //增加tab键,自动选择下一行
        this.Controls.PropertyTable.find("td").children().focus(function () {
            $(this).parents("tr").eq(0).click();
        });
    },
    //绑定属性面板信息提示
    _BindRichProperty: function () {
        this.Controls.PropertyTable.find("textarea").RichTextBind();
        this.Controls.PropertyTable.find("input[data-Popup]").each(function () {
            var popupName = $(this).attr("data-Popup");
            var h = $(this).attr("data-Height");
            var w = $(this).attr("data-Width");
            var description = $(this).attr("data-Description");
            PropertyGuide[popupName].call(this, $(this), popupName, description, h, w);
        });
    }
};