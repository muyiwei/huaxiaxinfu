$(function () {
    $.ReportDesigner.$CombinedTablePropertys = $("#CombinedTablePropertys");
    $.ReportDesigner.$CombinedRowTitlePropertys = $("#CombinedRowTitlePropertys");
    $.ReportDesigner.$CombinedColumnTitlePropertys = $("#CombinedColumnTitlePropertys");
    $.ReportDesigner.$CombinedColumnsPropertys = $("#CombinedColumnsPropertys");
    $.ReportDesigner.$ColumnInfo = $("#ColumnInfo");
    $.ReportDesigner.$TableView = $("#TableView");
});

jQuery.extend(
    $.ReportDesigner,
    {
        BindReportSetting: function (validate) {
            if (!this.BindParameter(validate)) {
                return false;
            }

            //列标题
            var $ColumnTitle = this.$CombinedColumnTitlePropertys.find("li");
            this.ReportSetting.ColumnTitle = null;
            if ($ColumnTitle.length > 0) {
                var Column = this.GetSourceColumnByCode($ColumnTitle.attr("data-ColumnCode"));
                Column.DisplayName = $ColumnTitle.find("div.ColumnName").text();
                Column.ColumnType = $ColumnTitle.attr("data-ColumnType");
                this.ReportSetting.ColumnTitle = Column;
            }
            //行标题
            var $RowTitles = this.$CombinedRowTitlePropertys.find("li");
            this.ReportSetting.RowTitles = [];
            if ($RowTitles.length > 0) {
                for (var i = 0; i < 2 && i < $RowTitles.length; i++) {
                    var Column = this.GetSourceColumnByCode($($RowTitles[i]).attr("data-ColumnCode"));
                    Column.DisplayName = $($RowTitles[i]).find("div.ColumnName").text();
                    Column.ColumnType = $($RowTitles[i]).attr("data-ColumnType");
                    this.ReportSetting.RowTitles.push(Column); // (this.ReportSetting.RowTitles == "" ? "" : ";") + $($RowTitles[i]).attr("data-ColumnCode");
                }
            }
            //统计字段
            var $Columns = this.$CombinedColumnsPropertys.find("li");
            this.ReportSetting.Columns = [];
            for (var j = 0; j < $Columns.length; j++) {
                var ColumnCode = $($Columns[j]).attr("data-ColumnCode");
                var Function = $($Columns[j]).attr("data-FunctionType");
                var Column = this.GetSourceColumnByCode(ColumnCode);
                if (Column != null) {
                    Column.DisplayName = $($Columns[j]).find("div.ColumnName").text();
                    Column.FunctionType = Function;
                    this.ReportSetting.Columns.push(Column);
                }
            }
            //图表配置
            var $Charts = this.$CombinedTablePropertys.find(":radio[name='ckCharts']:checked");
            this.ReportSetting.Charts = [];
            for (var i = 0; i < $Charts.length; i++) {
                this.ReportSetting.Charts.push($($Charts[i]).val());
            }
            //默认图表
            this.ReportSetting.DefaultChart = $("#SelChartType").val();
            //行坐标
            this.ReportSetting.AxisDimension = $("#SelAxisDimension").val();
            this.ReportSetting.XAxisUnit = $("#txtXAxisUnit").val();
            this.ReportSetting.YAxisUnit = $("#txtYAxisUnit").val();

            if (validate) {
                if ($.isEmptyObject(this.ReportSetting.Charts)) {
                    $.IShowError("至少必须选择一个图表!");
                    return false;
                }

                if ($.isEmptyObject(this.ReportSetting.ColumnTitle)
                    && $.isEmptyObject(this.ReportSetting.RowTitles)) {
                    $.IShowError("行标题或列标题，至少有一个维度!");
                    return false;
                }
                //为仪表盘时规定格式;
                if (this.ReportSetting.Charts[0] == ReportBase.ChartType.Gauge)
                {
                    if(this.ReportSetting.Columns.length!=2||this.ReportSetting.RowTitles.length!=1)
                    {
                        $.IShowError("仪表盘时，请选择一个行标题，两个统计字段!");
                        return false;
                    }
                }
                return true;
            }
        },

        InitReportSetting: function () {
            this.NeedRefreshView = false;
            this.$DesignerCombinedTable.show();
            this.$CombinedTablePropertys.show();
            this.$CombinedColumnTitlePropertys.show();
            this.$CombinedRowTitlePropertys.show();
            this.$CombinedColumnsPropertys.show();

            this.InitParameter();
            //图表配
            for (var i = 0; !$.isEmptyObject(this.ReportSetting.Charts) && i < this.ReportSetting.Charts.length; i++) {
                this.$CombinedTablePropertys.find(":radio[name='ckCharts'][value='" + this.ReportSetting.Charts[i] + "']").prop("checked", true)
            }
            //默认图表
            $("#SelChartType").val(this.ReportSetting.DefaultChart);
            //行坐标
            $("#SelAxisDimension").val(this.ReportSetting.AxisDimension);
            $("#txtXAxisUnit").val(this.ReportSetting.XAxisUnit);
            $("#txtYAxisUnit").val(this.ReportSetting.YAxisUnit);
            //行标题
            if (!$.isEmptyObject(this.ReportSetting.RowTitles)) {
                var RowTitles = this.ReportSetting.RowTitles;
                for (var i = 0; i < RowTitles.length; i++) {
                    if (!$.isEmptyObject(RowTitles[i]))
                        this.AddRowTitle(RowTitles[i].ColumnCode, RowTitles[i]);
                }
            }
            //列标题
            if (!$.isEmptyObject(this.ReportSetting.ColumnTitle)) {
                this.AddColumnTitle(this.ReportSetting.ColumnTitle.ColumnCode, this.ReportSetting.ColumnTitle);
            }
            //统计字段
            if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                for (var i = 0; i < this.ReportSetting.Columns.length; i++) {
                    this.AddColumns(this.ReportSetting.Columns[i].ColumnCode, this.ReportSetting.Columns[i].DisplayName);
                }
            }
            this.NeedRefreshView = true;
            this.RefreshView();
        },

        //添加行标题
        AddRowTitle: function (ColumnCode, InitColumn) {

            if (this.$CombinedColumnTitlePropertys.find("li[data-ColumnCode]").length > 0
                && this.$CombinedColumnsPropertys.find("li[data-ColumnCode]").length > 1) {
                $.IShowError("有列标题,且有多个统计字段时，不允许添加行标题!");
                return;
            }

            if (this.$CombinedRowTitlePropertys.find("li[data-ColumnCode]").length == 2) {
                $.IShowError("行标题最多只能两个");
                return;
            }

            if (this.$CombinedRowTitlePropertys.find("li[data-ColumnCode='" + ColumnCode + "']").length > 0) {
                $.IShowError("该列已经添加了！");
                return;
            }
            Column = InitColumn == null ? this.GetSourceColumnByCode(ColumnCode) : InitColumn;
            if (Column == null) {
                $.IShowError("该列不存在了！");
                return;
            }
            this.RenderColumnItem(this.$CombinedRowTitlePropertys, Column, Column.DisplayName);
        },

        //添加列标题
        AddColumnTitle: function (ColumnCode, InitColumn) {
            if (this.$CombinedRowTitlePropertys.find("li[data-ColumnCode]").length > 0
                && this.$CombinedColumnsPropertys.find("li[data-ColumnCode]").length > 1) {
                $.IShowError("有行标题，且统计字段多于1个时，不允许添加列标题!");
                return;
            }

            if (this.$CombinedColumnTitlePropertys.find("li[data-ColumnCode='" + ColumnCode + "']").length > 0) {
                $.IShowError("该列已经添加了！");
                return;
            }
            Column = InitColumn == null ? this.GetSourceColumnByCode(ColumnCode) : InitColumn;
            if (Column == null) {
                $.IShowError("该列不存在了！");
                return;
            }

            this.$CombinedColumnTitlePropertys.find("li").detach();
            this.RenderColumnItem(this.$CombinedColumnTitlePropertys, Column, Column.DisplayName);
        },

        //添加指标字段
        AddColumns: function (ColumnCode, DisplayName) {

            if (this.$CombinedColumnsPropertys.find("li[data-ColumnCode='" + ColumnCode + "']").length > 0) {
                $.IShowError("该列已经添加了！");
                return;
            }
            Column = this.GetSourceColumnByCode(ColumnCode);
            if (Column == null) {
                $.IShowError("该列不存在了！");
                return;
            }
            if (Column.ColumnType != this.ColumnType.Numeric) {
                $.IShowError("只有数值型的才可以作为统计字段！");
                return;
            }
            //有行标题 且有列标题时；只能有一个统计字段,清空原来的，添加新的
            if (this.$CombinedRowTitlePropertys.find("li[data-ColumnCode]").length > 0
                && this.$CombinedColumnTitlePropertys.find("li[data-ColumnCode]").length > 0) {
                this.$CombinedColumnsPropertys.find("li").detach();
            }
            this.RenderColumnItem(this.$CombinedColumnsPropertys, Column, DisplayName || Column.DisplayName);
        },

        //渲染字段项
        RenderColumnItem: function ($Container, Column, DisplayName) {
            var that = this;
            var ColumnCode = Column.ColumnCode;
            var ContainerId = $Container.attr("Id");
            var $columnItem = $("<li>").addClass("ColumnItem");
            $columnItem.attr("data-ContainerId", ContainerId);
            $columnItem.attr("data-ColumnCode", ColumnCode);
            $columnItem.attr("data-ColumnType", Column.ColumnType);
            $columnItem.attr("data-FunctionType", Column.FunctionType);

            $columnItem.append("<div class='ColumnName'>" + DisplayName + "</div>");
            $columnItem.append("<div class='ColumnGroup'></div>");
            var $btnEdit = $("<i class='fa fa-pencil-square-o'></i>");
            var $btnRemove = $("<i class='fa fa-trash-o'></i>");


            $columnItem.find("div.ColumnGroup").append($btnEdit);
            $columnItem.find("div.ColumnGroup").append($btnRemove);
            $Container.find("ul").append($columnItem);

            that.RefreshView.apply(that);
            $btnRemove.click(function () {
                $(this).closest("li").detach();
                that.$ColumnInfo.hide();
                that.RefreshView.apply(that);
            });

            if (ContainerId == "CombinedColumnsPropertys") {
                //统计字段
                $btnEdit.click(function () {
                    var ColumnCode = $(this).closest("li").attr("data-ColumnCode");
                    that.ShowEditColumn.apply(that, [$(this), ColumnCode, $Container.attr("Id")]);
                });
            }
            else if (ContainerId == "CombinedRowTitlePropertys") {
                //行标题
                $btnEdit.click(function () {
                    var ColumnCode = $(this).closest("li").attr("data-ColumnCode");
                    that.ShowEditRowTitle.apply(that, [$(this), ColumnCode, $Container.attr("Id")]);
                });
            }
            else if (ContainerId == "CombinedColumnTitlePropertys") {
                //列标题
                $btnEdit.click(function () {
                    var ColumnCode = $(this).closest("li").attr("data-ColumnCode");
                    that.ShowEditColumnTitle.apply(that, [$(this), ColumnCode, $Container.attr("Id")]);
                });
            }

            //排序
            $Container.find("ul").sortable({
                forcePlaceholderSize: true,
                placeholder: "ColumnItem",
                stop: function () {
                    that.RefreshView.apply(that);
                }
            });
        },

        //显示编辑行标题
        ShowEditRowTitle: function ($Trigger, ColumnCode, ContainerId) {
            var that = this;
            var Column = this.GetSourceColumnByCode(ColumnCode);
            var ColumnItem = $("#" + ContainerId).find("li.ColumnItem[data-ColumnCode='" + ColumnCode + "']");
            var DisplayName = ColumnItem.find("div.ColumnName").text();
            var ColumnType = ColumnItem.attr("data-ColumnType");

            var $Content = $("<div>");
            //名称
            var $NameItem = $("<div>").addClass("propertyItem");
            var $NameEdit = $("<input maxlength=5>").val(DisplayName);
            $NameItem.append("<div class='ItemName'>名称</div>");
            $NameItem.append($("<div class='ItemGroup'>").append($NameEdit));
            $NameEdit.change(function () {
                ColumnItem.find("div.ColumnName").text($(this).val());
                that.RefreshView.apply(that);
            });

            //类型
            var $FunctionItem = $("<div>").addClass("propertyItem");
            var $FunctionEdit = $("<select>");
            for (var key in this.ColumnType) {
                $FunctionEdit.append("<option value='" + this.ColumnType[key] + "'>" + key + "</option>");
            }
            $FunctionEdit.val(ColumnItem.attr("data-ColumnType"));
            $FunctionItem.append("<div class='ItemName'>字段类型</div>");
            $FunctionItem.append($("<div class='ItemGroup'>").append($FunctionEdit));
            $FunctionEdit.change(function () {
                ColumnItem.attr("data-ColumnType", $(this).val());
                that.RefreshView.apply(that);
            });

            $Content.append($NameItem);
            $Content.append($FunctionItem);
            this.ShowPopover($Content, $Trigger);
        },
        //显示编辑列标题
        ShowEditColumnTitle: function ($Trigger, ColumnCode, ContainerId) {
            this.ShowEditRowTitle($Trigger, ColumnCode, ContainerId);
        },
        //显示编辑统计字段
        ShowEditColumn: function ($Trigger, ColumnCode, ContainerId) {
            var that = this;
            var Column = this.GetSourceColumnByCode(ColumnCode);
            if (Column == null) {
                this.$ColumnInfo.hide();
                return;
            }

            var ColumnItem = $("#" + ContainerId).find("li.ColumnItem[data-ColumnCode='" + ColumnCode + "']");
            var DisplayName = ColumnItem.find("div.ColumnName").text();

            var $Content = $("<div>");
            var $NameItem = $("<div>").addClass("propertyItem");
            var $NameEdit = $("<input maxlength=5>").val(DisplayName);
            $NameItem.append("<div class='ItemName'>名称</div>");
            $NameItem.append($("<div class='ItemGroup'>").append($NameEdit));
            $NameEdit.change(function () {
                ColumnItem.find("div.ColumnName").text($(this).val());
                that.RefreshView.apply(that);
            });

            var $FunctionItem = $("<div>").addClass("propertyItem");
            var $FunctionEdit = $("<select>");
            for (var key in this.Function) {
                $FunctionEdit.append("<option value='" + this.Function[key] + "'>" + this.GetFunctionName(this.Function[key]) + "</option>");
            }
            $FunctionEdit.val(ColumnItem.attr("data-FunctionType"));
            $FunctionItem.append("<div class='ItemName'>汇总</div>");
            $FunctionItem.append($("<div class='ItemGroup'>").append($FunctionEdit));
            $FunctionEdit.change(function () {
                ColumnItem.attr("data-FunctionType", $(this).val());
                that.RefreshView.apply(that);
            });

            $Content.append($NameItem);
            $Content.append($FunctionItem);

            this.ShowPopover($Content, $Trigger);
        },

        //刷新表
        RefreshView: function () {
            if (!this.NeedRefreshView) return;
            this.BindReportSetting(false);

            this.$TableView.html("");
            var $Table = $("<table>").addClass("table table-bordered table-condensed");
            this.$TableView.append($Table);

            //列标题数据
            var ColumnFiled = this.ReportSetting.ColumnTitle;// == null ? null : this.GetSourceColumnByCode(this.ReportSetting.ColumnTitle.ColumnCode);
            var ColumnTitleData = ColumnFiled == null ? null : this.GetDataByColumnCode(ColumnFiled.ColumnCode);
            //行标题数据
            var RowTitles = this.ReportSetting.RowTitles;//== "" ? [] : this.ReportSetting.RowTitles.split(';');
            var RowFiled = null;
            var RowData = null;
            var SubRowFiled = null;
            var SubRowData = null;
            if (RowTitles.length > 0) {
                RowFiled = RowTitles[0];
                RowData = this.GetDataByColumnCode(RowFiled.ColumnCode);
            }
            if (RowTitles.length > 1) {
                SubRowFiled = RowTitles[1];
                SubRowData = this.GetDataByColumnCode(SubRowFiled.ColumnCode);
            }

            var $ReportHead = $("<tr>");
            $Table.append($("<thead>").append($ReportHead));
            //报表头
            if (RowFiled != null) {
                $ReportHead.append("<th>" + RowFiled.DisplayName + "</th>");
                if (SubRowFiled != null) {
                    $ReportHead.append("<th>" + SubRowFiled.DisplayName + "</th>");
                }
            }
            else {
                $ReportHead.append("<th></th>");
            }
            //列标题数据
            if (ColumnTitleData != null) {
                for (var i = 0; i < ColumnTitleData.length; i++) {
                    $ReportHead.append("<th>" + ColumnTitleData[i] + "</th>");
                }
            }
            else {
                //没有列标题
                if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                    for (var i = 0; i < this.ReportSetting.Columns.length; i++) {
                        $ReportHead.append("<th>" + this.ReportSetting.Columns[i].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[i].FunctionType) + "]" + "</th>");
                    }
                }
                else {
                    $ReportHead.append("<th>统计</th>");
                }
            }

            //报表数据
            if (RowData != null) {
                //第一级行标题数据
                for (var i = 0; i < RowData.length; i++) {
                    var $firstTd = $("<td>").text(RowData[i]);
                    var RowValue = RowData[i];

                    if (SubRowData != null) {
                        //第二级行标题
                        $firstTd.attr("rowspan", SubRowData.length);
                        for (var j = 0; j < SubRowData.length; j++) {
                            var $rowTR = $("<tr>");
                            var SubRowValue = SubRowData[j];
                            if (j == 0) {
                                $rowTR.append($firstTd);
                            }

                            $rowTR.append("<td>" + SubRowValue + "</td>");
                            if (ColumnTitleData != null) {
                                //列数据
                                for (var k = 0; k < ColumnTitleData.length; k++) {
                                    var ColumnValue = ColumnTitleData[k];
                                    if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                                        for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                                            $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], RowTitles[0].ColumnCode, RowValue, RowTitles[1].ColumnCode, SubRowValue, this.ReportSetting.ColumnTitle, ColumnValue) + "</td>");
                                        }
                                    }
                                    else {
                                        //统计
                                        $rowTR.append("<td>" + this.CalculationResult(null, RowTitles[0].ColumnCode, RowValue, RowTitles[1].ColumnCode, SubRowValue, this.ReportSetting.ColumnTitle, ColumnValue) + "</td>");
                                    }
                                }
                            }
                            else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                                for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                                    $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[k], RowTitles[0].ColumnCode, RowValue, RowTitles[1].ColumnCode, SubRowValue) + "</td>");
                                }
                            }
                            else {
                                //统计
                                $rowTR.append("<td>" + this.CalculationResult(null, RowTitles[0].ColumnCode, RowValue, RowTitles[1].ColumnCode, SubRowValue) + "</td>");
                            }
                            $Table.append($rowTR);
                        }
                    }
                    else {
                        //没有第二级行标题
                        var $rowTR = $("<tr>");
                        $rowTR.append($firstTd);
                        if (ColumnTitleData != null) {
                            //列数据
                            for (var k = 0; k < ColumnTitleData.length; k++) {
                                var ColumnValue = ColumnTitleData[k];
                                if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                                    for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                                        $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], RowTitles[0].ColumnCode, RowValue, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                                    }
                                }
                                else {
                                    //统计
                                    $rowTR.append("<td>" + this.CalculationResult(null, RowTitles[0].ColumnCode, RowValue, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                                }
                            }
                        }
                        else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                            for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                                $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[k], RowTitles[0].ColumnCode, RowValue, null, null) + "</td>");
                            }
                        }
                        else {
                            //统计
                            $rowTR.append("<td>" + this.CalculationResult(null, RowTitles[0].ColumnCode, RowValue, null, null) + "</td>");
                        }
                        $Table.append($rowTR);
                    }
                }
            }
            else if (ColumnTitleData != null) {
                //没有行标题
                var $firstTD = $("<td>");
                if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                    for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                        var $rowTR = $("<tr>").append($firstTD);
                        $Table.append($rowTR);
                        $firstTD.text(this.ReportSetting.Columns[l].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[l].FunctionType) + "]");
                        for (var k = 0; k < ColumnTitleData.length; k++) {
                            //列数据
                            var ColumnValue = ColumnTitleData[k];
                            $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], null, null, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                        }
                    }
                }
                else if (!$.isEmptyObject(ColumnTitleData)) {
                    //统计
                    var $rowTR = $("<tr>").append($firstTD);
                    $firstTD.text("统计");
                    $Table.append($rowTR);
                    for (var k = 0; k < ColumnTitleData.length; k++) {
                        //列数据
                        var ColumnValue = ColumnTitleData[k];
                        $rowTR.append("<td>" + this.CalculationResult(null, null, null, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                    }
                }
            }
        },

        //计算统计结果
        //@Column 统计字段，为空的话，是统计数量
        CalculationResult: function (Column, RowTitle, RowValue, SubRowTile, SubRowValue, ColumnTile, ColumnValue) {
            var Result = (Column != null && parseInt(Column.FunctionType) == ReportBase.Function.Min) ? null : 0;
            var Count = 0;
            for (var i = 0; i < this.SourceData.length; i++) {
                var rowData = this.SourceData[i];
                if ((RowTitle == "" || rowData[RowTitle] == RowValue)
                    && (SubRowTile == "" || rowData[SubRowTile] == SubRowValue)
                    && (ColumnTile == "" || rowData[ColumnTile] == ColumnValue)) {
                    if (Column == null) {
                        Result++;
                    }
                    else {
                        var val = rowData[Column.ColumnCode];
                        switch (parseInt(Column.FunctionType)) {
                            case this.Function.Count:
                                Result++;
                                break;
                            case this.Function.Sum:
                                Result += val;
                                break;
                            case this.Function.Avg:
                                Result += val;
                                Count++;
                                break;
                            case this.Function.Min:
                                if (Result == null) {
                                    Result = val;
                                } else {
                                    Result = Result > val ? val : Result;
                                }
                                break;
                            case this.Function.Max:
                                Result = Result > val ? Result : val;
                                break;
                        }
                    }
                }
            }

            if (Count > 0) {
                Result = Result / Count;
            }

            return Result;
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

        GetDataByColumnCode: function (ColumnCode) {
            //没有配置列标题，直接返回null数据
            if ($.isEmptyObject(ColumnCode)) return null;

            var columnDatas = new Array();
            for (var i in this.SourceData) {
                var isExist = false;
                if (this.SourceData[i][ColumnCode] == null) continue;
                for (var j in columnDatas) {
                    if (columnDatas[j] == this.SourceData[i][ColumnCode]) {
                        isExist = true;
                        break;
                    }
                }
                if (isExist) continue;
                columnDatas.push(this.SourceData[i][ColumnCode]);
            }

            return columnDatas;
        }
    }
  );