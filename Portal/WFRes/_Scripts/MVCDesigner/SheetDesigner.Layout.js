SheetDesigner.Layout = function (DropContainer, PropertyPanel, ClipBoard, colContainer) {
    this.Controls = null;
    this.ClipBoard = ClipBoard;
    this.DropContainer = DropContainer;
    this.PropertyPanel = PropertyPanel;
    this.Initial(colContainer);
}

SheetDesigner.Layout.prototype = {
    Initial: function (colContainer) {
        this.Controls = {
            DesignerContent: $(".DesignerContent"),
            sheetContainer: $(".DesignerContent .panel-body"),    // 表单容器
            tableContainer: ".divContent",
            detailContainer: ".tableContent",
            colContainer: colContainer,
            sheetControls: "*[data-datafield]",
            divInsertTable: $("#divInsertTable"),
            divInsertRow: $("#divInsertRow"),
            selTableColCount: $("#selTableColCount"),
            divTableColWidth: $("#divTableColWidth"),
            tableRowCount: $("#tableRowCount"),
            selColumns: $("#selColumns"),
            divColumns: $("#divColumns"),
            sheetContainerMenu: "sheetContainerMenu",
            tableContainerMenu: "tableContainerMenu",
            colContainerMenu: "colContainerMenu",
            controlContainerMenu: "controlContainerMenu",
            divSplitCell: $("#divSplitCell"),
            selSplitColumns: $("#selSplitColumns"),
            divSplitColumns: $("#divSplitColumns"),
            splitCellInfo: $("#splitCellInfo")
        }

        // 插入表格 列数change事件
        this.Controls.selTableColCount.unbind("change.Layout").bind("change.Layout", [this], function (e) {
            e.data[0].ResetTableColumns(parseInt(this.value));
        });

        // Change 事件
        this.Controls.selColumns.unbind("change.Layout").bind("change.Layout", [this], function (e) {
            e.data[0].ResetColumns(parseInt(this.value));
        });
        this.Controls.selSplitColumns.unbind("change.Layout").bind("change.Layout", [this], function (e) {
            e.data[0].ResetSplitColumns(parseInt(this.value));
        });

        // 表单容器 ----------------------------------------------------------
        this.Controls.sheetContainer.unbind("contextMenu").contextMenu(this.Controls.sheetContainerMenu, {
            bindings: {
                "InsertTable": function (t, l) {
                    // 插入表格
                    l.args.InsertTableDialog();
                }
            }, args: this
        });
        this.InitialTableMenu();
        this.InitialColMenu();
        this.InitialControlMenu();
    },
    Refresh: function () {
        this.InitialTableMenu();
        this.InitialColMenu();
        this.InitialControlMenu();
    },
    InitialControlMenu: function () {
        // 控件 ----------------------------------------------------------
        this.Controls.sheetContainer.find(this.Controls.sheetControls).unbind("contextMenu").contextMenu(this.Controls.controlContainerMenu, {
            bindings: {
                "Change": function (t, l) {
                    // 变更
                    l.args.DropContainer.ChangeControl($(t));
                },
                "Copy": function (t, l) {
                    // 复制
                    l.args.ClipBoard.Copy($(t));
                },
                "Cut": function (t, l) {
                    // 剪切
                    l.args.ClipBoard.Cut($(t));
                },
                "Remove": function (t, l) {
                    // 移除
                    l.args.ClipBoard.Remove($(t));
                }
            }, args: this
        });
    },
    InitialTableMenu: function () {
        // 表格容器 ----------------------------------------------------------
        $(this.Controls.tableContainer).unbind("contextMenu").contextMenu(this.Controls.tableContainerMenu, {
            bindings: {
                "DeleteTable": function (t, l) {
                    // 删除表格
                    l.args.RemoveTable($(t));
                }
            }, args: this
        });
        $(this.Controls.detailContainer).unbind("contextMenu").contextMenu(this.Controls.tableContainerMenu, {
            bindings: {
                "DeleteTable": function (t, l) {
                    // 删除表格
                    l.args.RemoveTable($(t));
                }
            }, args: this
        });
    },
    InitialColMenu: function () {
        // 单元格容器 ----------------------------------------------------------
        this.Controls.DesignerContent.find(this.Controls.colContainer).unbind("contextMenu").contextMenu(this.Controls.colContainerMenu, {
            bindings: {
                "InsertBeforeRow": function (t, l) {
                    // 向上插入行
                    l.args.InsertRowDialog($(t), true);
                },
                "InsertAfterRow": function (t, l) {
                    // 向下插入行
                    l.args.InsertRowDialog($(t), false);
                },
                "Paste": function (t, l) {
                    // 黏贴
                    l.args.ClipBoard.Paste($(t));
                },
                "MergeCol": function (t, l) {
                    // 合并单元格
                    l.args.MergeCol($(t));
                },
                "MergeRow": function (t, l) {
                    // 合并整行
                    l.args.MergeRow($(t));
                },
                "DeleteCol": function (t, l) {
                    // 删除单元格
                    l.args.RemoveCol($(t));
                },
                "DeleteRow": function (t, l) {
                    // 删除整行
                    l.args.RemoveRow($(t));
                },
                "SplitCell": function (t, l) {
                    //拆分单元格
                    l.args.SplitCellDialog($(t));
                }
            }, args: this
        });
    },
    // 删除单元格
    RemoveCol: function (col) {
        col.remove();
    },
    // 删除行
    RemoveRow: function (col) {
        var p = $(col).parent();
        if (p.hasClass("row")) p.remove();
    },
    // 合并单元格
    MergeCol: function (col) {
        this.PropertyPanel.MegerColumns(null, this);
    },
    // 合并整行
    MergeRow: function (col) {
        var p = $(col).parent();
        if (!p.hasClass("row")) return;
        this.PropertyPanel.MegerColumns(p.find(this.Controls.colContainer), this);
    },
    GetControlID: function () {
        var id = "div" + Math.round(Math.random() * 1000000, 0);
        if ($("#" + id).length > 0) id = "ctl" + Math.round(Math.random() * 1000000, 0);
        return id;
    },

    // 插入表格
    InsertTableDialog: function () {
        $.ligerDialog.open({
            title: "插入表格",
            target: this.Controls.divInsertTable,
            height: 280,
            isHidden: true,
            DesignerLayout: this,
            width: 500,
            buttons: [
               {
                   text: '确定', onclick: function (item, dialog) {

                       // 验证行数
                       var tableRowCount = dialog.options.DesignerLayout.Controls.tableRowCount.val();
                       if (isNaN(tableRowCount)) { return; }

                       // 验证列宽
                       var num = 0,
                           valid = true,
                           colWidths = [],
                           cols = dialog.options.DesignerLayout.Controls.divTableColWidth.find("input");
                       $.each(cols, function (n, txt) {
                           if (isNaN(txt.value)) return;
                           var v = parseInt(txt.value);
                           if (v <= 0) valid = false;
                           colWidths.push(v);
                           num += v;
                       });
                       if (!valid || num != 12) {
                           alert("输入的列宽不合法或者总和不等于12!");
                           return;
                       }
                       dialog.options.DesignerLayout.InsertTable(tableRowCount, colWidths);
                       dialog.close();
                   }
               },
               {
                   text: '取消', onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });
    },
    InsertTable: function (tableRowCount, colWidths) {
        var i,
            j,
            len,
            css;
        var html = "<div class=\"nav-icon fa fa-chevron-right bannerTitle\">";
        html += "<label id=\"" + this.GetControlID() + "\">标题</label>";
        html += "</div>";
        html += "<div class=\"divContent\" id=\"" + Date.now() + "\">";

        for (i = 0; i < tableRowCount; i++) {
            html += "<div class=\"row\">";

            for (j = 0, len = colWidths.length; j < len; j++) {
                css = "designer col-md-" + colWidths[j];
                html += "<div id=\"" + this.GetControlID() + "\" class=\"" + css + "\"></div>";
            }

            html += "</div>";
        }
        html += "</div>";

        $(html).appendTo(this.Controls.sheetContainer);
        // 重置右键菜单
        this.Refresh();
        // 重置可拖拽
        this.DropContainer.Refresh();
        // 重置可设计
        this.PropertyPanel.Refresh();
    },
    ResetTableColumns: function (count) {
        var cols = this.Controls.divTableColWidth.find("input");
        var length = cols.length;
        if (length < count) {
            var html = "<input type=\"text\" class=\"NewColumn\" value=\"0\" maxlength=\"2\" style=\"width: 20px;\" />";
            for (var i = length; i < count; i++) {
                $(html).appendTo(this.Controls.divTableColWidth);
            }
        }
        else if (length > count) {
            for (var i = length - 1; i >= count; i--) {
                cols[i].remove();
            }
        }
    },

    // 删除表格
    RemoveTable: function (table) {
        var obj = table.prev();

        if (obj.hasClass("bannerTitle")) {
            this.ClipBoard.Remove([obj[0], table[0]]);
        }
        else {
            this.ClipBoard.Remove(table);
        }
    },

    // 插入行
    InsertRowDialog: function (col, before) {
        $.ligerDialog.open({
            title: "插入行",
            target: this.Controls.divInsertRow,
            height: 260,
            isHidden: true,
            DesignerLayout: this,
            width: 500,
            buttons: [
               {
                   text: '确定', onclick: function (item, dialog) {
                       var num = 0;
                       var valid = true;
                       var colWidths = new Array();
                       var cols = dialog.options.DesignerLayout.Controls.divColumns.find("input");
                       $.each(cols, function (n, txt) {
                           if (isNaN(txt.value)) return;
                           var v = parseInt(txt.value);
                           if (v <= 0) valid = false;
                           colWidths.push(v);
                           num += v;
                       });
                       if (!valid || num != 12) {
                           alert("输入的列宽不合法或者总和不等于12!");
                           return;
                       }
                       dialog.options.DesignerLayout.InsertRow(col, before, colWidths);
                       dialog.close();
                   }
               },
               {
                   text: '取消', onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });
    },
    InsertRow: function (col, before, colWidths) {
        var row = $("<div class=\"row designer\"></div>");
        var css;
        for (var i in colWidths) {
            css = "designer col-md-" + colWidths[i];
            $("<div id=\"" + this.GetControlID() + "\" class=\"" + css + "\"></div>").appendTo(row);
        }
        if (before) {
            row.insertBefore(col.parent());
        }
        else {
            row.insertAfter(col.parent());
        }
        // 重置右键菜单
        this.Refresh();
        // 重置可拖拽
        this.DropContainer.Refresh();
        // 重置可设计
        this.PropertyPanel.Refresh();
    },
    ResetColumns: function (count) { // 重置添加列的行
        var cols = this.Controls.divColumns.find("input");
        var length = cols.length;
        if (length < count) {
            var html = "<input type=\"text\" class=\"NewColumn\" value=\"0\" maxlength=\"2\" style=\"width: 20px;\" />";
            for (var i = length; i < count; i++) {
                $(html).appendTo(this.Controls.divColumns);
            }
        }
        else if (length > count) {
            for (var i = length - 1; i >= count; i--) {
                cols[i].remove();
            }
        }
    },
    ResetSplitColumns: function (count) {
        var cols = this.Controls.divSplitColumns.find("input");
        var length = cols.length;
        if (length < count) {
            var html = "<input type=\"text\" class=\"NewColumn\" value=\"0\" maxlength=\"2\" style=\"width: 20px;\" />";
            for (var i = length; i < count; i++) {
                $(html).appendTo(this.Controls.divSplitColumns);
            }
        }
        else if (length > count) {
            for (var i = length - 1; i >= count; i--) {
                cols[i].remove();
            }
        }
    },
    // 拆分单元格
    SplitCellDialog: function (col) {
        var widthInputs,
        widthNum = this.PropertyPanel._getWidthNum(col.attr("class")),
        averageWidth;

        if (widthNum < 2) {
            return;
        }

        // 根据拆分单元格的宽度确定可拆分项数
        this.Controls.selSplitColumns.empty();
        for (i = 1; i <= widthNum; i++) {
            this.Controls.selSplitColumns.append('<option value="' + i + '">' + i + '</option>');
        }
        // 默认拆分成2个
        this.Controls.selSplitColumns.val(2);
        this.Controls.selSplitColumns.trigger("change");

        widthInputs = this.Controls.divSplitColumns.find("input");
        averageWidth = Math.round(widthNum / widthInputs.length);

        // 自动填充每个单元格的宽度
        for (var i = 0, len = widthInputs.length; i < len; i++) {
            $(widthInputs[i]).val(averageWidth);
            if (averageWidth * len > widthNum && i == 0) {
                $(widthInputs[i]).val(averageWidth - 1);
            }
            if (averageWidth * len < widthNum && i == 0) {
                $(widthInputs[i]).val(averageWidth + 1);
            }
        }

        this.Controls.splitCellInfo.text("注：所有列之和必须等于" + widthNum + "。");

        var that = this;
        $.ligerDialog.open({
            title: "拆分单元格",
            target: this.Controls.divSplitCell,
            height: 260,
            isHidden: true,
            DesignerLayout: this,
            width: 500,
            buttons: [
               {
                   text: '确定', onclick: function (item, dialog) {
                       var num = 0;
                       var valid = true;
                       var colWidths = [];
                       widthInputs = that.Controls.divSplitColumns.find("input");
                       $.each(widthInputs, function (n, txt) {
                           if (isNaN(txt.value)) return;
                           var v = parseInt(txt.value);
                           if (v <= 0) valid = false;
                           colWidths.push(v);
                           num += v;
                       });
                       if (!valid || num != widthNum) {
                           alert("输入的列宽不合法或者总和不等于" + widthNum + "!");
                           return;
                       }

                       // 用after方法附加新cell，需要将colWidths反转
                       colWidths.reverse();
                       for (i = 0; i < colWidths.length; i++) {
                           var newCell = $('<div id="' + that.GetControlID() + '" class="col-md-' + colWidths[i] + '"></div>');
                           if (i == colWidths.length - 1) {
                               newCell.append(col.html());
                           }
                           col.after(newCell);

                           // 给新增的单元格绑定click.Property事件
                           newCell.Designable(that.PropertyPanel);
                       }
                       col.remove();

                       // 重新初始化单元格的contextMenu事件
                       that.InitialColMenu();

                       dialog.close();
                   }
               },
               {
                   text: '取消', onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });
    }
};