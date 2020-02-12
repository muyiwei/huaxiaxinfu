$(function () {
    $.ReportDesigner.$DataTablePropertys = $("#DataTablePropertys");
    $.ReportDesigner.$DataTableView = $("#DataTableView");
    $.ReportDesigner.$ColumnInfo = $("#ColumnInfo");
});
jQuery.extend(
    $.ReportDesigner,
    {
        //判定配置
        BindReportSetting: function () {
            if (!this.BindParameter()) {
                return false;
            }

            var columntiems = this.$DataTablePropertys.find("li");
            if (columntiems.length == 0) {
                $.IShowError("没有配置字段!");
                return false;
            }
            this.ReportSetting.Columns = [];
            for (var j = 0; j < columntiems.length; j++) {
                var ColumnCode = $(columntiems[j]).attr("data-ColumnCode");
                var Column = this.GetSourceColumnByCode(ColumnCode);
                if (Column != null) {
                    Column.DisplayName = $(columntiems[j]).find("div.ColumnName").text();
                    if ($(columntiems[j]).attr("data-FunctionType")) {
                        Column.FunctionType = $(columntiems[j]).attr("data-FunctionType");
                    }
                    this.ReportSetting.Columns.push(Column);
                }
            }
            return true;
        },

        //初始化报表配置
        InitReportSetting: function () {
            this.$DataTablePropertys.show();
            this.$DesignerDataTable.show();
            this.InitParameter();
            this.InitColumnSetting();
        },

        //初始化列
        InitColumnSetting: function () {
            for (var i = 0; !$.isEmptyObject(this.ReportSetting.Columns) && i < this.ReportSetting.Columns.length; i++) {
                var functionType = this.ReportSetting.Columns[i].ColumnType == this.ColumnType.Numeric ? this.ReportSetting.Columns[i].FunctionType : null;
                this.RenderColumnItem(this.ReportSetting.Columns[i].ColumnCode, this.ReportSetting.Columns[i].DisplayName, functionType);
            }
        },

        AddColumn: function (ColumnCode) {
            var that = this;
            var Column = that.GetColumnByCode(ColumnCode);
            if (Column != null) {
                $.IShowError("该列已经添加了！");
                return;
            }

            Column = that.GetSourceColumnByCode(ColumnCode);
            if (Column == null) {
                $.IShowError("该列不存在了！");
                return;
            }
            this.RenderColumnItem(ColumnCode, Column.DisplayName);
            return true;
        },

        RenderColumnItem: function (ColumnCode, DisplayName, functionType) {
            var that = this;
            var $columnItem = $("<li>").addClass("ColumnItem").attr("data-ColumnCode", ColumnCode);
            if (functionType) {
                $columnItem.attr("data-FunctionType", functionType);
            }
            $columnItem.append("<div class='ColumnName'>" + DisplayName + "</div>");
            $columnItem.append("<div class='ColumnGroup'></div>");
            var $btnEdit = $("<i class='fa fa-pencil-square-o'></i>");
            var $btnRemove = $("<i class='fa fa-trash-o'></i>");

            $columnItem.find("div.ColumnGroup").append($btnEdit);
            $columnItem.find("div.ColumnGroup").append($btnRemove);
            that.$DataTablePropertys.find("ul").append($columnItem);
            that.RefreshView.apply(that);

            $btnRemove.click(function () {
                $(this).closest("li").detach();
                that.RefreshView.apply(that);
            });

            $btnEdit.click(function () {
                var ColumnCode = $(this).closest("li").attr("data-ColumnCode");
                that.ShowEditColumn.apply(that, [ColumnCode, $(this)]);
            });

            //排序
            that.$DataTablePropertys.find("ul").sortable({
                forcePlaceholderSize: true,
                placeholder: "ColumnItem",
                stop: function () {
                    that.RefreshView.apply(that);
                }
            });
        },

        //根据Code取到报表的列
        GetColumnByCode: function (ColumnCode) {
            if (this.$DataTablePropertys.find("li[data-ColumnCode='" + ColumnCode + "']").length > 0) {
                return this.GetSourceColumnByCode(ColumnCode);
            }
            return null;
        },

        //显示编辑列属性
        ShowEditColumn: function (ColumnCode, $el) {
            var that = this;
            var Column = this.GetSourceColumnByCode(ColumnCode);
            if (Column == null) {
                this.$ColumnInfo.hide();
                return;
            }

            var $content = $("<div>");

            var ColumnItem = that.$DataTablePropertys.find("li.ColumnItem[data-ColumnCode='" + ColumnCode + "']");
            var DisplayName = ColumnItem.find("div.ColumnName").text();

            var $NameEdit = $("<input>").width("100%").css("margin-bottom", "10px").attr("data-type", "DisplayName").val(DisplayName);
            $content.append($NameEdit);

            $NameEdit.change(function () {
                ColumnItem.find("div.ColumnName").text($(this).val());
                that.RefreshView.apply(that);
            });

            if (Column.ColumnType == this.ColumnType.Numeric) {
                var $FunctionEdit = $("<select>").width("100%").height("26px").attr("data-type", "DisplayName");
                for (var key in this.Function) {
                    $FunctionEdit.append("<option value='" + this.Function[key] + "'>" + this.GetFunctionName(this.Function[key]) + "</option>");
                }
                $content.append($FunctionEdit);
                if (ColumnItem.attr("data-FunctionType")) {
                    $FunctionEdit.val(ColumnItem.attr("data-FunctionType"));
                }
                $FunctionEdit.change(function () {
                    ColumnItem.attr("data-FunctionType", $(this).val());
                });
            }

            this.ShowPopover($content, $el);
        },

        GetFunctionName: function (FunctionType) {
            switch (parseInt(FunctionType)) {
                case this.Function.Count:
                    return "统计";
                case this.Function.Sum:
                    return "求和";
                case this.Function.Avg:
                    return "平均";
                case this.Function.Min:
                    return "最小值";
                case this.Function.Max:
                    return "最大值";
            }
        },

        //refresh
        RefreshView: function () {
            var columns = [];
            var columntiems = this.$DataTablePropertys.find("li");
            for (var j = 0; j < columntiems.length; j++) {
                var ColumnCode = $(columntiems[j]).attr("data-ColumnCode");

                var DisplayName = $(columntiems[j]).find("div.ColumnName").text();
                var Column = this.GetSourceColumnByCode(ColumnCode);
                columns.push({ field: Column.ColumnCode, title: DisplayName });
            }

            this.$DataTableView.bootstrapTable("destroy");
            this.$DataTableView.bootstrapTable({ data: this.SourceData, columns: columns, height: "100%" });
        }
    }
);