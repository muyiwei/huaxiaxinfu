(function ($) {
    var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
    //默认值
    var defaults = {
        control: $(this),  //DIV容器
        loadUrl: PortalRoot+ "/BizRuleTable/GeBizRuleTalbe",        //加载规则数据
        saveUrl: PortalRoot + "/BizRuleTable/SaveBizRuleTable",     //保存规则决策表
        exportUrl: PortalRoot + "/BizRuleTable/ExportToExcel",      //导出决策表数据到Excel
        ruleCode: "GF",           //业务规则编码
        matrixCode: "scriptGG",   //业务规则决策表编码
        isView:false
    };

    var instances = [];//缓存实例

    $.fn.BizRuleTable = function () {
        var id = $(this).attr("data-ruleid");
        if (arguments[0]) {
            this.loadUrl = arguments[0].loadUrl;
            this.saveUrl = arguments[0].saveUrl;
            this.exportUrl = arguments[0].exportUrl;
            this.ruleCode = arguments[0].ruleCode;
            this.matrixCode = arguments[0].matrixCode;
            this.isView = arguments[0].isView;
            this.reload = arguments[0].reload;//是否强制重新加载
        }

        //返回已有的实例
        if (id) {
            for (var i = 0; i < instances.length; i++) {
                if (instances[i]["key"] === id) {
                    if (!this.reload) {
                        return instances[i]["value"];
                    } else {
                        instances.splice(i, 1);// //如果是强制重新加载，先删除实例
                    }
                    
                }
            }
        } 

        //新增一个实例对象
        var id = Math.random().toString();
        $(this).attr("data-ruleid", id);
        var ruleTable = new RuleTable({
            control: $(this),
            id: id,
            url: this.loadUrl, //处理Action Url
            ruleCode: this.ruleCode,  //业务规则表编码
            matrixCode: this.matrixCode, //决策表编码
            isView:this.isView //是否查看模式
        });

        instances.push({ key: id, value: ruleTable });

        return ruleTable;
    };


    //定义RuleTable对象
    var RuleTable = function (opt) {
        this.options = $.extend(defaults, opt);
        this.ruleTableModel = {};
        this.init();//
    };

    //定义初始化方法
    RuleTable.prototype.init = function () {
        //debugger;
        this.table = $("<table id='ruleTable_" + this.options.id + "' cellspacing=\"0\" border=\"1\" style=\"border-width:1px;border-style:solid;width:98%;border-coolapse:coolapse;\">");
        var $this = this;
        if (this.options.ruleCode && this.options.matrixCode && this.options.loadUrl) {
            $.ajax({
                url: $this.options.loadUrl,
                type: 'get',
                dataType: "json",
                data: { ruleCode: this.options.ruleCode, matrixCode: this.options.matrixCode,isView:this.options.isView },
                async: false,//
                success: function (result) {
                    if (result) {
                        $this.ruleTableModel = result;
                        $this.renderRuleTalbe(result);

                    } else {

                    }
                }
            });
        }
    };

    //渲染表格
    //计算行数并添加所有行
    //计算第一个单元格跨多少行多少列
    //遍历填充列
    //遍历填充行和单元格数据，遍历到最低层行叶子节点的时候才添加单元格数据
    RuleTable.prototype.renderRuleTalbe = function (ruleTableModel) {
       
        var isView = ruleTableModel.IsView;
        if (ruleTableModel.ToltalRows < 1) { return; }

        //填加所有行
        for (var i = 0; i < ruleTableModel.ToltalRows; i++) {
            this.table.append("<tr></tr>")
        }

        //填充列
        var rowDepth = ruleTableModel.RowDepth;
        var columnDepth = ruleTableModel.ColumnDepth;

        //添加第一个单元格
        this.table.find("tr:first").append("<td colspan=\"" + rowDepth + "\" rowspan=\"" + columnDepth + "\"></td>");

        //渲染列
        var startRowIndex = 0;
        this.renderColumns(startRowIndex, ruleTableModel.ColumnDepth, ruleTableModel.Columns);
        
        //渲染行
        if (ruleTableModel.Rows.length > 0) {
            var startColumnIndex = 0;
            var startRowIndex = ruleTableModel.ColumnDepth;
            this.renderRows(startRowIndex, startColumnIndex, ruleTableModel.RowDepth, ruleTableModel.ColumnDepth, ruleTableModel.Rows, ruleTableModel.Cells,ruleTableModel.MatrixType,isView);
        }

        //添加Table到选定控件
        this.options.control.html("");//先清空控件
        this.table.appendTo(this.options.control);
    };

    //渲染决策表列
    RuleTable.prototype.renderColumns = function (startRowIndex, ColumnDepth, Columns) {
        var $thisTable = $(this)[0];

        $.each(Columns, function (index, col) {
            //计算跨几列
            var colspan = col.CellCount;
            var rowspan = 1;
            if (col.Children.length < 1) { rowspan = ColumnDepth - startRowIndex; }

            var cell = "<td colspan=\"" + colspan + "\"  rowspan=\"" + rowspan + "\" title=\"" + col.Value + "\" >" + col.DisplayName + "</td>";

            $thisTable.table.find("tr:eq(" + startRowIndex + ")").append(cell);

            if (col.Children.length > 0) {
                //递归
                $thisTable.renderColumns(startRowIndex + 1, ColumnDepth, col.Children);
            }

        });
    };

    //渲染决策表行及单元格
    RuleTable.prototype.renderRows = function (startRowIndex, startColumnIndex, RowDepth, ColumnDepth, Rows, Cells, matrixType, isView) {
        var $thisTable = $(this)[0];
        var rowDepthSpan = 0;
        $.each(Rows, function (index, row) {
            //debugger;
            var rowspan = row.CellCount;
            var colspan = 1;
            if (row.Children.length < 1) { colspan = RowDepth - startColumnIndex; }

            var rowIndex = startRowIndex + rowDepthSpan;
            rowDepthSpan += row.CellCount;

            var cell = "<td rowspan=\"" + rowspan + "\" colspan=\"" + colspan + "\" title=\"" + row.Value + "\" >" + row.DisplayName + "</td>";
            $thisTable.table.find("tr:eq(" + rowIndex + ")").append(cell);

            if (row.Children.length > 0) {
                $thisTable.renderRows(rowIndex, startColumnIndex + 1, RowDepth, ColumnDepth, row.Children, Cells, matrixType, isView);
            } else {
                if (Cells != null && Cells.length > 0) {
                    
                    $.each(Cells[rowIndex - ColumnDepth], function (cIndex, cell) {
                      
                        var celldetail = "";
                        if (isView) {
                            var cValue = cell.Value;
                            if (cValue == null) { cValue = ""; }
                            celldetail = "<td >" + cValue + "</td>";
                        }else {
                            var cValue = cell.Value;
                            if (cValue == null) { cValue = ""; }
                            celldetail = "<td ><input rowIndex='" + cell.RowIndex + "' colIndex='" + cell.ColumnIndex + "'  value='" + cValue + "' ></input></td>"; //排序规则
                            if (matrixType == "SelectiveArray") {
                                //选择规则
                                celldetail = "<td ><input rowIndex='" + cell.RowIndex + "' colIndex='" + cell.ColumnIndex + "'  type=\"checkbox\" " + "/></td>"
                                var isChecked = (cell.Value == "" || cell.Value == "False") ? false : cell.Value;

                                if (isChecked) { celldetail = "<td ><input rowIndex='" + cell.RowIndex + "' colIndex='" + cell.ColumnIndex + "'  type=\"checkbox\" "  + " checked=\"checked\" /></td>" };
                            }

                            if (matrixType == "Script") {
                                //脚本规则
                               
                                celldetail = "<td ><textarea style='height:100px'  rowIndex='" + cell.RowIndex + "' colIndex='" + cell.ColumnIndex + "'   " + ">" + cValue + "</textarea></td>";

                            }
                        }
                        $thisTable.table.find("tr:eq(" + rowIndex + ")").append(celldetail);
                        
                    });

                }
            }

        });
    };

    //获取决策表单元格的值
    RuleTable.prototype.getCellsValue = function () {
        //debugger;
        var $thisTable = $(this)[0];
        var Cells = $thisTable.ruleTableModel.Cells;
        var Tablehtml = $thisTable.table;

        $(Tablehtml).find("[rowindex]").each(function () {
            
            var rowIndex = $(this).attr("rowindex");
            var columnIndex = $(this).attr("colindex");
            
            var cellValue = $(this).val();
            //判断控件类型
            if ($(this).is("input:checkbox")) {
                cellValue = $(this).is(":checked");
            } 
            if (Cells[rowIndex][columnIndex]) {
                Cells[rowIndex][columnIndex].Value = cellValue;
            }
        });
        return Cells;
    };

    //保存决策表值
    RuleTable.prototype.save = function () {
        var cells = this.getCellsValue();
        var cellsData = JSON.stringify(cells);

        var resultReturn;
        $.ajax({
            url: this.options.saveUrl,
            type: 'post',
            dataType: "json",
            data: { ruleCode: this.options.ruleCode, matrixCode: this.options.matrixCode, cellString: cellsData },
            async: false,//
            success: function (result) {
                resultReturn = result;
            }
        });

        return resultReturn;
    };


    //获取决策表格的最终值，导Excel使用
    RuleTable.prototype.getTableValue = function () {
        debugger;
        var $thisTable = $(this)[0];
        var Tablehtml = $thisTable.table;
        var tableExcel = [];
        //遍历行
        $(Tablehtml).find("tr").each(function () {
            var trExcel = [];
            //遍历单元格
            $(this).find("td").each(function () {
                var cell = {};
                if ($(this).children().length>0) {
                    //如果有子控件，取子控件里的值
                    var control = $(this).children().eq(0);
                    var cellValue = "";
                    if (control.is("input:checkbox")) {
                        cellValue = control.is(":checked");
                    } else if (control.is("textarea")) {
                        cellValue = $(control).text();
                    } else {
                        cellValue = $(control).val();
                    }
                    cell.Value = cellValue;
                    cell.RowSpan = 1;
                    cell.ColSpan = 1;
                }
                else {

                    cell.Value = $(this).html();
                    cell.RowSpan = $(this).attr("rowspan") || 1;
                    cell.ColSpan = $(this).attr("colspan") || 1;
                }

                trExcel.push(cell);
            });

            tableExcel.push(trExcel);
        });

        var tabeData = JSON.stringify(tableExcel).replace('"','\"');
        $.ajax({
            url: $thisTable.options.exportUrl,
            type: 'post',
            dataType: "json",
            data: { ruleCode: this.options.ruleCode, matrixCode: this.options.matrixCode, tableDataString: tabeData },
            async: false,//
            success: function (result) {
                if (result.Success) {
                    window.location.href = result.Message;
                } 
            }
        });

        return tableExcel;
    };
})($);