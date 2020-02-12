/// <reference path="SheetDesigner.js" />
/// <reference path="jquery.select.js" />
$.fn.Dragable = function (DropContainer) {
    var container = null;

    for (var i = 0, len = this.length; i < len; i++) {
        var dragObj = $(this[i]);
        var drag = dragObj.ligerDrag({
            proxy: function (e) {
                var target = e.target;
                if (target.attr("data-for")) {
                    var targetId = target.attr("data-for");
                    target = $("#" + targetId);
                }
                var proxy = target.clone().css({
                    position: "absolute",
                    width: target.width(),
                    height: target.height(),
                    "z-index": 101
                })
                proxy.appendTo("body");
                proxy.keydown(function (e) { target.keydown(); }).keyup(function (e) { target.keyup(); });
                return proxy;
            },
            revert: true,
            receive: DropContainer.Controls.colControls
        });

        // 在设计模式切换的时候，该方法会重复执行。
        // 故先unbind拖拽相关事件，再bind，防止事件方法多次执行
        drag.unbind("startDrag");
        drag.bind("startDrag", function (e) {
            if (DropContainer.PropertyPanel.SelectedProperty) {
                DropContainer.PropertyPanel._PropertyChanged(DropContainer.PropertyPanel.SelectedProperty,
                    DropContainer.PropertyPanel.PropertyChanged);
            }
            e.target.click();
            this.set({ cursor: "not-allowed" });
            if (container) container.removeClass("ControlContainer");
        });

        drag.unbind("dragEnter");
        drag.bind("dragEnter", function (receive, source, e) {
            this.set({ cursor: "pointer" });
            if (container) container.removeClass("ControlContainer");
            if ($(receive).attr("id") != $(e.target).parents().attr("id")) {
                $(receive).addClass("ControlContainer");
            }
            container = $(receive);
        });

        drag.unbind("dragLeave");
        drag.bind("dragLeave", function (receive, source, e) {
            this.set({ cursor: "not-allowed" });
        });

        drag.unbind("drop");
        drag.bind("drop", function (receive, source, e) {
            if (!this.proxy) return;
            this.proxy.hide();
            $(receive).removeClass("ControlContainer");

            var system = source.data("system");
            if (system) {
                DropContainer.BindDropedEvent($(receive), source);
            }
            else {
                var id = source[0].id;
                if (!id) return;
                var parent = $(receive).parent();
                var i = 0;
                while (i < 5 && parent.length > 0) {
                    if (parent[0].id == id) return;
                    parent = parent.parent();
                    i++;
                }

                if ($(receive).find("#" + id).length > 0) return;
                $("#" + id).appendTo($(receive));
                e.stopPropagation();
            }
        });
    }

    return this;
};

// 基本属性窗口
SheetDesigner.DropContainer = function (Designer, PropertyPanel, DropContainerCell) {
    this.PropertyPanel = PropertyPanel;
    this.Designer = Designer;
    this.Controls = {
        DesignerControls: "*[data-datafield]", // 获取所有可支持设计的 Control
        colControls: DropContainerCell,
        DesignerContent: $(".DesignerContent"),           // 设计区内容
        divPropertyControl: $("#divPropertyControl"),  //基本属性窗口 DIV
        txtControlId: $("#txtControlId"),              // 控件ID
        txtItemName: $("#txtItemName"),                // 数据项名称
        txtItemType: $("#txtItemType"),                // 数据项类型
        selControlType: $("#selControlType"),          // 控件类型
        treeData: $("#treeData")
    };
    this.Initial();
};

SheetDesigner.DropContainer.prototype = {
    Initial: function () {
        $(this.Controls.DesignerControls)
            .filter(function () {
                var tag = this.tagName.toLowerCase();
                return (tag != "td" && tag != "table");
            })
            .css("z-index", "101").Dragable(this);
    },
    Refresh: function () {
        $(this.Controls.DesignerControls).filter(function () {
            var tag = this.tagName.toLowerCase();
            return (tag != "td" && tag != "table");
        }).each(function (e) {
            var m = $(this).ligerGetDragManager();
            if (m) m._setReceive(e.Controls.colControls);
        }, [this]);
    },
    //获取临时生成的控件ID
    GetControlID: function () {
        // this.ControlIndex++;
        // this.Controls.hfdIDIndex.val(this.ControlIndex);  //保存最新的Index值
        var id = "ctl" + Math.round(Math.random() * 1000000, 0);
        if ($("#" + id).length > 0) id = "ctl" + Math.round(Math.random() * 1000000, 0);
        return id;
    },
    // 绑定控件显示
    BindControl: function (container, datafield, displayName, controlId, controlType) {
        if (controlType == "SheetGridView") {// 处理子表
            var li = this.Controls.treeData.find("span[data-datafield='" + datafield + "']").parent().parent().parent();
            var childrens = li.find("span[data-datafield]").filter(function () { return $(this).attr("data-datafield") != datafield; });

            var tableHtml = "<table id=\"" + controlId + "\" data-datafield=\"" + datafield + "\" data-type=\"SheetGridView\" class=\"SheetGridView\">";
            tableHtml += "<tbody>";
            tableHtml += "<tr class=\"OnlyDesigner\"><td colspan=\"" + (childrens.length + 2) + "\" class=\"OnlyDesigner\">";
            tableHtml += "<label data-datafield=\"" + datafield + "\" data-for=\"" + controlId + "\" data-type=\"SheetGridView\">" + datafield + "属性</label>";
            tableHtml += "</td></tr>";
            tableHtml += "<tr class=\"header\">";
            tableHtml += "<td id=\"" + controlId + "_SerialNo\" class=\"rowSerialNo\">序号</td>";
            // 标题列
            for (var i = 0; i < childrens.length; i++) {
                var ctl = $(childrens[i]);
                var childDataField = ctl.attr("data-datafield");
                var displayName = ctl.attr("data-displayname");
                tableHtml += "<td id=\"" + controlId + "_header" + i + "\" data-datafield=\"" + childDataField + "\">";
                tableHtml += "<label id=\"" + controlId + "_Label" + i + "\" data-datafield=\"" + childDataField + "\" data-type=\"SheetLabel\">" + displayName + "</label>";
                tableHtml += "</td>";
            }
            tableHtml += "<td class=\"rowOption\">删除</td>";
            tableHtml += "</tr>";
            tableHtml += "<tr class=\"SheetGridViewTemplate\">";
            tableHtml += "<td></td>";
            // 内容行
            var hasNumColumn = false;
            for (var i = 0; i < childrens.length; i++) {
                var ctl = $(childrens[i]);
                var childDataField = ctl.attr("data-datafield");
                var logicType = ctl.attr("data-logictype");
                var displayName = ctl.attr("data-displayname");
                if (logicType == 7 || logicType == 9 || logicType == 11 || logicType == 18) {
                    hasNumColumn = true;
                }

                tableHtml += "<td id=\"" + controlId + "_control" + i + "\" data-datafield=\"" + childDataField + "\">";

                var dataLogicType = this.GetDataLogicType(logicType);
                if (!dataLogicType || dataLogicType.ControlRange.length < 2) {
                    tableHtml += "</td>";
                    continue;
                }

                var model = this.GetControlModelHTML(childDataField, displayName, dataLogicType.ControlRange[1].DisplayName);
                if (!model) {
                    tableHtml += "</td>";
                    continue;
                }
                tableHtml += $(model).attr("id", controlId + "_control" + i)[0].outerHTML;
                tableHtml += "</td>";
            }
            tableHtml += "<td class=\"rowOption\"><a class=\"delete\"><div class=\"fa fa-minus\"></div></a><a class=\"insert\"><div class=\"fa fa-arrow-down\"></div></a></td>";
            tableHtml += "</tr>";

            // 汇总行
            if (hasNumColumn) {
                tableHtml += "<tr class=\"footer\">";
                tableHtml += "<td></td>";
                for (var i = 0; i < childrens.length; i++) {
                    var ctl = $(childrens[i]);
                    var childDataField = ctl.attr("data-datafield");
                    var logicType = ctl.attr("data-logictype");
                    var displayName = ctl.attr("data-displayname");

                    tableHtml += "<td id=\"" + controlId + "_Stat" + i + "\" data-datafield=\"" + childDataField + "\">";
                    if (logicType == 7 || logicType == 9 || logicType == 11 || logicType == 18) {
                        tableHtml += "<label id=\"" + controlId + "_StatControl" + i + "\" data-datafield=\"" + childDataField + "\" data-type=\"SheetCountLabel\"><span class=\"OnlyDesigner\">统计</span></label></td>";
                    }
                    tableHtml += "</td>";
                }
                tableHtml += "<td></td>";
                tableHtml += "</tr>";
            }


            tableHtml += "</tbody></table>";

            $(tableHtml).css("z-index", 101).appendTo(container).click();
            $("#" + controlId).css("z-index", 101).find("*[data-datafield]").Dragable(this);
        }
        else {
            var model = this.GetControlModelHTML(datafield, displayName, controlType);
            if (!model) return;
            var domModel = $(model);
            if (controlType == "SheetAssociation") {//处理关联关系
                domModel.attr("data-schemacode", $("input[data-datafield='" + datafield + "']").data("schemacode"));
            }
            debugger
            domModel.attr("id", controlId)
                .css("z-index", 101)
                .Dragable(this)
                .appendTo(container)
                .click();
        }
        this.PropertyPanel.Refresh(container);
        this.Designer.SheetLayout.Refresh();
    },
    GetControlModelHTML: function (datafield, displayName, controlType) {
        var model = HtmlModels[controlType];
        if (!model) return null;
        model = model.replace(/{datafield}/g, datafield).replace(/{displayname}/g, displayName);
        return model;
    },
    GetDataLogicType: function (logicType) {
        for (var k in DataLogicTypes) {
            if (DataLogicTypes[k].Type == logicType) {
                return DataLogicTypes[k];
            }
        }
    },
    GetControlModel: function (controlType) {
        return DesignerControls[controlType].Model;
    },
    ChangeControl: function (obj) {
        debugger;
        var datafield = obj.attr("data-datafield");
        var source = this.Controls.treeData.find("span[data-datafield='" + datafield + "']");
        this.BindDropedEvent(obj.parent(), source, obj);
    },
    BindDropedEvent: function (container, source, removeControl) {
        // 获取拖动元素的逻辑类型
        var logicType = source.data("logictype");
        var datafield = source.data("datafield");
        var isSystem = source.data("system").toLowerCase();
        var id = this.GetControlID();

        if (isSystem == "true") {// 系统数据项，直接构造 SheetLabel 显示
            var html = "<label id=\"" + id + "\" data-type=\"SheetLabel\"";
            html += "data-datafield=\"" + datafield + "\" data-bindtype=\"All\">";
            html += "<span class=\"OnlyDesigner\">" + datafield + "</span>";
            html += "</label>";
            $(html).css("z-index", "101").Dragable(this).Designable(this.PropertyPanel).appendTo(container);
            if (removeControl) removeControl.remove()
        }
        else {//弹出窗体选择控件
            this.Controls.txtControlId.val(id);
            // 初始化可选控件下拉框
            var datalogicType = this.GetDataLogicType(logicType);
            this.Controls.selControlType[0].length = 0;
            this.Controls.txtItemName.html(source.html());
            this.Controls.txtItemType.html(datalogicType.DisplayName);
            for (var key in datalogicType.ControlRange) {
                if (datalogicType.ControlRange[key]) {
                    $("<option value=\"" + datalogicType.ControlRange[key].DisplayName + "\">" + datalogicType.ControlRange[key].DisplayName + "</option>").appendTo(this.Controls.selControlType);
                }
            }

            $.ligerDialog.open({
                title: "选择控件",
                target: divPropertyControl,
                height: 300,
                isHidden: true,
                DropContainer: this,
                width: 460,
                buttons: [
{
    text: '确定', onclick: function (item, dialog) {
        debugger
        var displayName = datafield;
        var html = source.html();
        if (html.indexOf("]") > -1) {
            displayName = html.substring(html.indexOf("]") + 1);
        }
        var ctlId = dialog.options.DropContainer.Controls.txtControlId.val();
        if (!dialog.options.DropContainer.PropertyPanel.ValidateID(ctlId)) {
            alert("控件ID不允许包含特殊字符!");
            return;
        }
        if ($("#" + ctlId).length > 0) {
            alert("控件ID重复!");
            return;
        }
        dialog.options.DropContainer.BindControl(
            container,
            datafield,
            displayName,
            ctlId,
            dialog.options.DropContainer.Controls.selControlType.val());
        if (removeControl) removeControl.remove();
        dialog.close();
        //移动端加载子表的时候会通过.tableContent class 来定位容器  以便渲染子表，由于tableContent是在后端aspx 页面添加的，在这里拖拽子表的时候做处理
        if ($("#selControlType").val() == "SheetGridView") {
            if ($("table#" + ctlId).parent().parent().hasClass("designer")) {
                $("table#" + ctlId).parent().parent().removeClass("designer").addClass("tableContent");
            }
        }
    }
},
{
    text: '取消', onclick: function (item, dialog) {
        dialog.close();
    }
}]
            });
        }
    }
}