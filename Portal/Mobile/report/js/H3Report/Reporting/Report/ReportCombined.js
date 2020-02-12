
var ReportCombined = function (opt, container) {
        var DefaultOpts = {
            dragCallBack: null,
            widget:null
        };
        
        this.opt = $.extend({}, DefaultOpts, opt);
        this.Widget = this.opt.widget;
        this.$Container = container;
        this.isDragMouseUp = true;
    //数据table,没有表头，包含汇总行，汇总列
        this.ValueTable = null;
    //列表头table
        this.ColumnTable = null;
    //行表头数;
        this.RowTable = null;
    //仅有行字段列字段；
        this.OnlyHeader = null;
    //------------------------------------new------------------------------------------------------ 
    //------------------------------------Old----------------------------------------------------
    //数据源
        this.SourceData = null;
    //数据源的列
        this.SourceColumns = null;
    //维度数据
        this.Series = { Filed: null, Data: null };
    //分类
        this.Category = {
            MasterCategory: { Filed: null, Data: null },
            SubCategory: { Filed: null, Data: null },
        };

        this.Init();
    }

ReportCombined.prototype = {
    Init: function () {
        var that = this;
        debugger
        //提示加载中
        that.$Container.html("正在加载数据请稍候...");

        if (that.Widget.ReportSourceId) {
            var objid = this.Widget.ObjectID == undefined ? this.Widget.ObjectId : this.Widget.ObjectID;
            that.PostAction("LoadChartsData", { ReportPage: JSON.stringify($.ReportDesigner.ReportPage), ObjectID: objid, isDesign:true }, function (data) {
                if ((data.ValueTable == null || data.ValueTable.length == 0) && (data.ColumnTable == null || data.ColumnTable.length == 0) && (data.RowTable == null || data.RowTable.length == 0)) {
                    that.$Container.empty();
                    //初始状态
                    that.BuildDesignTable.apply(that);
                    return;
                }
               
                that.ValueTable = data.ValueTable;
                //列表头table
                that.ColumnTable = data.ColumnTable;
                //行表头数;
                that.RowTable = data.RowTable;
                if ((data.ColumnTable["ColumnHeaderTableLastLine"] != null && data.ValueTable != null && data.ColumnTable["ColumnHeaderTableLastLine"].length * data.ValueTable.length > 40000) || (data.ColumnTable["ColumnHeaderTableLastSecondLine"] != null && data.ValueTable != null && data.ColumnTable["ColumnHeaderTableLastSecondLine"].length * data.ValueTable.length > 40000)) {
                    $.IShowWarn("提示", "数量超过显示限制");
                    return ;
                }
                //仅有行字段列字段；
                that.OnlyHeader = data.OnlyHeader;
                //列路径，用于联动
                that.ColumnRoad = data.ColumnRoad;
                //行路径，用于联动
                that.RowRoad = data.RowRoad;
                that.OnlyHeaderTable = data.OnlyHeaderTable;
                //开始渲染
                that.BuildTable.apply(that);
            });
        } else {
            that.$Container.empty();
            //初始状态
            that.BuildDesignTable.apply(that);
        }
    },
    BuildTable: function () {
        var $Table = $("<table>").addClass("table table-bordered table-condensed orgtable");
        this.$Container.html("");
        var $TableThead = $("<thead>");
        var $TableBody = $("<tbody>");
        var that = this;
        
        //1.填列标题；
        //这里要考虑联动，每个格子需要记录行code，列code;
        var colspanCount = 0, rowspanCount = 0,tmp=0;
        if (that.Widget.Series.length == 0) {
            var $tr = $('<tr>');
            if (that.Widget.Columns.length == 0) {
                var $th = $('<th rowspan="1" colspan="' + (that.Widget.Categories.length + 1) + '">').html('请将字段拖到此处创建列分组').css({ 'vertical-align': 'middle' });
                $tr.append($th).css({ 'height': '60px' });

            } else {
                var $th = $('<th rowspan="1" colspan="' + (that.Widget.Categories.length + this.ValueTable[0].length) + '">').html('请将字段拖到此处创建列分组').css({  'vertical-align': 'middle' });
                $tr.append($th).css({ 'height': '60px' });
            }
            $TableThead.append($tr);
        }
        //1.填列标题；
        if (this.ColumnTable != null && !$.isEmptyObject(this.ColumnTable)) {
            var $Tr, $Th, $Td;
            var RowCounter = 0;
            for (var key in this.ColumnTable) {
                rowspanCount++;
                var TempColumnCode = key;
                if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine") {
                    continue;
                }
                $Tr = $("<tr>");
                //最后一列不绑定点击联动
                var ColumnCounter = 0;
                for (var i = 0; i < this.ColumnTable[key].length - 1; i++) {
                    var mytd = this.ColumnTable[key][i];
                    if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine" || i == 0 || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Th = $('<th  row="' + RowCounter + '" title="' + mytd.Value + '" col="' + ColumnCounter + '" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                    }
                    else {
                        $Th = $('<th   row="' + RowCounter + '" title="' + mytd.Value + '" col="' + ColumnCounter + '" class="unittd" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                      
                    }
                    $Tr.append($Th.clone());
                    ColumnCounter = ColumnCounter + mytd.ColSpan;
                    colspanCount = ColumnCounter;
                }
                var mytd1 = this.ColumnTable[key][this.ColumnTable[key].length - 1];
                var $Th1 = $('<th  data-columncode="' + TempColumnCode + '" rowspan="' + mytd1.RowSpan + '" colspan="' + mytd1.ColSpan + '" data-value="' + mytd1.Value + '" >').html(mytd1.Value);
                $Tr.append($Th1.clone());
                $TableThead.append($Tr.clone());
                $TableThead.css({ 'border': '2px dashed silver' });
              
                ColumnCounter++;
            }
        }
        
        var Counter = 0;
        //2.填行表头，同时填数据表,
        //判断是否存在categories
        if (that.Widget.Categories.length == 0 && that.Widget.Columns.length == 0) {
            var $tr = $('<tr >');
            var $tdCategory = $('<td class="categories" rowspan="5" colspan="1">').html("请将字段拖到此处创建行分组").css({'vertical-align':'middle' });
            var $tdColumns = $('<td class="columns" rowspan="5" colspan="' + colspanCount + '">').html("请将字段拖到此处显示值").css({  'vertical-align': 'middle', 'min-width': '120px' });
            $tr.append($tdCategory).append($tdColumns).css({'height':'200px'});
            $TableBody.append($tr);
            $tdCategory.css({ 'border-right': '2px dashed silver' });
            
        } else if (that.Widget.Categories.length == 0 && that.Widget.Columns.length > 0) {
            for (var key in this.ColumnTable) {
                rowspanCount++;
                var TempColumnCode = key;
                if (key != "ColumnHeaderTableLastLine" && key != "ColumnHeaderTableLastSecondLine") {
                    continue;
                }
                tmp++;
                $Tr = $("<tr>");
                for (var i = 0; i < this.ColumnTable[key].length; i++) {
                    var mytd = this.ColumnTable[key][i];
                    if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine" || i == 0 || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Th = $('<th class="categories"  title="' + mytd.Value + '" row="' + RowCounter + '" col="' + ColumnCounter + '" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                    }
                    else { 
                        $Th = $('<th class="categories"  title="' + mytd.Value + '" row="' + RowCounter + '" col="' + ColumnCounter + '" class="unittd" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                    }
                    $Tr.append($Th.clone());
                    $TableBody.append($Tr);
                }
            }
            var $tr = $('<tr >');
            var $tdCategory = $('<td class="categories" rowspan="5" colspan="1">').html("请将字段拖到此处创建行分组").css({ 'vertical-align': 'middle' });
            $tr.append($tdCategory);
            for (var ValueJ = 0; ValueJ < this.ValueTable[0].length; ValueJ++) {
                var ValueTableItem = this.ValueTable[0][ValueJ];
                if (ValueTableItem == "-" || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                    $Td = $('<td  class="columns" rowspan="5" colspan="1" row="' + 0 + '" col="' + ValueJ + '" title="' + ValueJ + '">').html(ValueTableItem).css({ 'vertical-align': 'middle' });
                }
                else {
                    $Td = $('<td  class="unittd columns" rowspan="5" colspan="1"  row="' + 0 + '" col="' + ValueJ + '" title="' + ValueJ + '">').html(ValueTableItem).css({ 'vertical-align': 'middle' });
                }
                $tr.append($Td.clone())
            }
            $tdCategory.css({ 'border-right': '2px dashed silver' });
            $tr.css({ 'height': '200px' });
            $TableBody.append($tr);
            ////添加汇总
            //$td = $('<td rowspan="' + rowspanCount + '" colspan="' + that.Widget.Columns.length + '">').html('汇总').css({'vertical-align':'middle'});
            //$TableThead.children('tr:eq(0)').append($td);
        }
        else {
            //添加最后一行或二行
            
            for (var key in this.ColumnTable) {
                rowspanCount++;
                var TempColumnCode = key;
                if (key != "ColumnHeaderTableLastLine" && key != "ColumnHeaderTableLastSecondLine") {
                    continue;
                }
                tmp++;
                $Tr = $("<tr>");
                for (var i = 0; i < this.ColumnTable[key].length; i++) {
                    var mytd = this.ColumnTable[key][i];
                    if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine" || i == 0 || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Th = $('<th class="categories" title="' + mytd.Value + '" row="' + RowCounter + '" col="' + ColumnCounter + '" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                    }
                    else {
                        $Th = $('<th class="categories" title="' + mytd.Value + '" row="' + RowCounter + '" col="' + ColumnCounter + '" class="unittd" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value);
                    }
                    $Tr.append($Th.clone());
                    $TableBody.append($Tr);
                }
            }
            if (this.RowTable != null && !$.isEmptyObject(this.RowTable)) {
                for (var RowI = 0; RowI < this.RowTable.length; RowI++) {
                    $Tr = $("<tr>");
                    for (var RowJ = 0; RowJ < this.RowTable[RowI].length; RowJ++) {
                        var MyRowTd = this.RowTable[RowI][RowJ];
                        if (that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                            $Th = $('<th class="categories" title="' + MyRowTd.Value + '" data-columncode="' + MyRowTd.ColumnCode + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value);
                        }
                        else {
                            $Th = $('<th class="unittd categories" title="' + MyRowTd.Value + '" data-columncode="' + MyRowTd.ColumnCode + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value);
                        }
                        $Tr.append($Th.clone());
                    }
                   
                    //填数据
                    for (var ValueJ = 0; ValueJ < this.ValueTable[RowI].length; ValueJ++) {

                        var ValueTableItem = this.ValueTable[RowI][ValueJ];
                        if (ValueTableItem == "-" || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                            $Td = $('<td class="columns"  rowspan="1" colspan="1" row="' + RowI + '" title="' + ValueJ + '" col="' + ValueJ + '">').html(ValueTableItem);
                        }
                        else {
                            $Td = $('<td  class="unittd columns" rowspan="1" colspan="1"  row="' + RowI + '" title="' + ValueJ + '" col="' + ValueJ + '">').html(ValueTableItem);

                        }
                        $Tr.append($Td.clone());
                    }
                    
                    //end填数据
                    $TableBody.append($Tr.clone());
                }
            }
        }
        if (that.Widget.Categories.length>0 && that.Widget.Columns.length == 0) {
            var $td = $('<td class="columns" colspan="' + colspanCount + '" rowspan="' + (this.RowTable.length + tmp) + '">').html("请将字段拖到此处显示值").css({  'vertical-align': 'middle', 'min-width': '120px' });
            $TableBody.children('tr:eq(0)').append($td);
        }
        if (this.RowTable && this.RowTable.length>0)
        {
            var that = this;
            $TableBody.children('tr').each(function () {
                $(this).children('th:eq(' + (that.RowTable[0].length - 1) + ')').css({ 'border-right': '2px dashed silver' });
            });
            $TableBody.children('tr:first').css({ 'border-top': '2px dashed silver' });
        }
        
        $Table.append($TableThead).append($TableBody);
        this.$Container.append($Table);
       
            
        $TableThead.on('mouseup', function () {
            if (!$.ReportDesigner.DragItem) return;
            $(this).hasClass('over') && $(this).removeClass('over');

            if (that.isDragMouseUp === false) {
                that.isDragMouseUp = true;
                return false;
            }

            if (!that.opt.dragCallBack) {
                return;
            }
            var data = that.opt.dragCallBack({ type: 'Series' });
            that.Init();
        });
        //绑定拖曳事件
        $Table.on('mouseup', '.categories,.columns', function () {
            if (!$.ReportDesigner.DragItem) return;
            $(this).hasClass('over') && $(this).removeClass('over');

            if (that.isDragMouseUp === false) {
                that.isDragMouseUp = true;
                return false;
            }

            if (!that.opt.dragCallBack) {
                return;
            }
            if ($(this).hasClass('categories')) {


                //执行回调函数，返回数据
                var data = that.opt.dragCallBack({ type: 'Categories' });
                that.Init();

            } else if ($(this).hasClass('series')) {

                var data = that.opt.dragCallBack({ type: 'Series' });
                that.Init();
            } else if ($(this).hasClass('columns')) {
                var data = that.opt.dragCallBack({ type: 'Field' });
                that.Init();
            }

        });

    },
    BuildDesignTable: function () {
        var that = this;
        var $table = $('<table class="combinedTable"></table>');
        this.$Container.append($table);
        $table.css({
            width: this.$Container.width()-4,
            height: this.$Container.height()-4
        });

        var $rowSeries = $("<tr></tr>");
        //var $rowTd = $('<td rowspan="" class="row_group" style="width:150px;">将字段拖到此处创建行分组</td>');
        var $tdSeries = $('<td colspan="5" class="series" style="color:#929292;">将字段拖到此</br>处创建列分组</td>');
        $rowSeries.append($tdSeries);       
        $table.append($rowSeries);
        var $rowCategory = $("<tr></tr>");
        var $tdCategory = $('<td rowspan="4" style="width:100px;color:#929292;" class="category" >将字段拖到此处创建行分组</td>');
        $rowCategory.append($tdCategory);
        var $tdColumns = $('<td colspan="4" rowspan="4"></td>');
        $rowCategory.append($tdColumns);
        
        $columnsTable = $('<table  class="column"></table>');
        $tdColumns.append($columnsTable);
        //for (var i = 0; i < 4; i++) {
            $columnsTable.append('<tr><td colspan="4" rowspan="4"></td></tr>');
        //}
        $table.append($rowCategory);

        $table.on('mouseup', '.category,.series', function () {
            $(this).hasClass('over') && $(this).removeClass('over');

            if (that.isDragMouseUp === false) {
                that.isDragMouseUp = true;
                return false;
            }

            if (!that.opt.dragCallBack) {
                return;
            }
            if (!$.ReportDesigner.DragItem) {
                return;
            }
            if ($(this).hasClass('category')) {

                console.log('创建行分组');
                
                //执行回调函数，返回数据
                var data = that.opt.dragCallBack({type:'Categories'});
                that.Init();
                
            } else if ($(this).hasClass('series')) {

                console.log('创建列分组');
                var data = that.opt.dragCallBack({ type: 'Series' });
                that.Init();
            }
           
        });

        $columnsTable.on('mouseup','', function (e) {
            $(this).hasClass('over') && $(this).removeClass('over');

            if (that.isDragMouseUp === false) {
                that.isDragMouseUp = true;
                return false;
            }
            if (!$.ReportDesigner.DragItem) {
                return;
            }

            if (!that.opt.dragCallBack) {
                return;
            }
            console.log('创建指标');
            var data = that.opt.dragCallBack({ type: 'Field' });
            that.Init();
        });
    },
    ComputeOrgWidth: function (Dom) {
        var that = this;
        that.lastsecondline = [];
        that.lastline = [];
        Dom.find("[data-columncode='ColumnHeaderTableLastSecondLine']").each(function () {
            var $this = $(this);
            that.lastsecondline.push($this.css("width"));
        })
        Dom.find("[data-columncode='ColumnHeaderTableLastLine']").each(function () {
            var $this = $(this);
            that.lastline.push($this.css("width"));
        })
    },
    ComputerWidth: function (Dom) {
        var that = this;
        var ColumnHeaderTableLastSecondLineCounter = 0;
        var ColumnHeaderTableLastLineCounter = 0;
        //计算最后两行的宽度
        Dom.find("[data-columncode='ColumnHeaderTableLastSecondLine']").each(function () {
            var $this = $(this);
            $this.css("width", that.lastsecondline[ColumnHeaderTableLastSecondLineCounter]);
            ColumnHeaderTableLastSecondLineCounter++;
        });
        Dom.find("[data-columncode='ColumnHeaderTableLastLine']").each(function () {
            var $this = $(this);
            $this.css("width", that.lastline[ColumnHeaderTableLastLineCounter]);
            ColumnHeaderTableLastLineCounter++;
        });
    },
    ReLoad: function () {
        this.Init();
    },
    //提交数据接口
    PostAction: function (ActionName, Parameter, CallBack) {
        $.ajax({
            type: "POST",
            url: "/Portal/Reporting/" + ActionName,
            data: $.extend({ Command: ActionName }, Parameter),
            dataType: "json",
            success: CallBack
        });
    }
    };

