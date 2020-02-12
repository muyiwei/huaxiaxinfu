//报表部件,简易看板
var ReportWidgetSimpleBoard = function (config) {
    this.ObjectId = config.ObjectId || "";
    this.Code = config.Code || "";
    this.DisplayName = config.DisplayName || "";
    this.WidgetType = config.WidgetType;
    this.ColumnTitle = config.ColumnTitle || "";;
    this.RowTitles = config.RowTitles || [];
    this.Columns = config.Columns || [];
    this.SortColumns = config.SortColumns || [];
    this.Categories = config.Categories || [];
    this.Series = config.Series || [];
    this.AxisDimension = config.AxisDimension || "";
    this.XAxisUnit = config.XAxisUnit || "";
    this.YAxisUnit = config.YAxisUnit || "";
    this.ReportSourceId = config.ReportSourceId || "";
    //this.IsUseSql = config.IsUseSql || false;
    //this.CommandText = config.CommandText || "";
    //this.SchemaCode = config.SchemaCode || "";
    //this.ReportSourceAssociations = config.ReportSourceAssociations || [];
    //this.IsSubSheet = config.IsSubSheet || false;
    this.Exportable = config.Exportable || false;
    this.Layout = config.Layout || _DefaultOptions.ReportLayout.OneColumn;
    this.LinkageReports = config.LinkageReports || [];
    this.SourceFilters = config.SourceFilters || [];
    //临时存储sql的列
    //this.SqlColumns = [];
    this.RowIndex = config.RowIndex || 0;
    this.ColumnIndex=config.ColumnIndex||0;
};

ReportWidgetSimpleBoard.prototype = {
    //opt{WidgetId,Index,Cols}
    init: function (WidgetId) {
        this.WidgitId = WidgetId;
        
        if ($.ReportDesigner.CurrentSimpleBoard) {
            //this.showReportSource();
            if (this.ReportSourceId) {
                $.ReportDesigner.ReportSourceManager.View_SetSourceDisabled(this.ReportSourceId);
            }
            else
            {
                $.ReportDesigner.ReportSourceManager.View_SetAllSourceEnabled();
            }
        }

        var $table = $('table.table-simpleboard[data-widgetid=\"' + this.WidgitId + '\"]');
        //找到对应的列       
        var $td = $table.find('tr:eq(' + this.RowIndex + ')').children('td:eq(' + this.ColumnIndex + ')');
        //如果已经存在内容，且列编码没有变化，则不重新请求
        if (this.ReportSourceId && this.Columns && this.Columns.length > 0) {
            
            $td.find('.h3guide').hide();
            if ($td.children('p').length > 0 && $($td.children('p')[0]).attr('data-code') == this.Columns[0].ColumnCode) {
                return;
            }
            var objid = this.ObjectId == undefined ? this.ObjectID : this.ObjectId;
            var param = {
                'ReportPage': JSON.stringify($.ReportDesigner.ReportPage),
                "WidgetObjectID": this.WidgitId,
                'ReportWidgetSimpleBoardObjectID': objid,
                'ColumnCode': this.Columns[0].ColumnCode
            };
            this.PostAction(param);
        } else {
            $td.find('.h3guide').show();
            $td.find('p').remove();
        }
        
    },
    //data {Text:'',Value:'',ColumnCode}
    draw: function (data) {
        debugger
        var that = this;
        //先找到widget对象
        var $table = $('table.table-simpleboard[data-widgetid=\"' + this.WidgitId + '\"]');
        //找到对应的列       
        var $td = $table.find('tr:eq(' + that.RowIndex + ')').children('td:eq(' + that.ColumnIndex + ')');
        $td.find('.h3guide').hide();
        var objid = that.ObjectId == undefined ? that.ObjectID : that.ObjectId;
        $td.attr('data-simpleboardid', objid);
        $td.children('p').remove();
        //添加显示的值
        var $columnName = $('<p class="simpleboardcolumnname"></p>').attr('data-name', data.Text).attr('data-code', data.ColumnCode).append('<span >' + data.Text + '</sapn>').append('<input type="textbox" class="simpleboardtextinput"  maxlength=30></input>');
        $td.append('<p class="simpleboardcolumnnamevalue">' + data.Value + '</p>');
        $td.append($columnName);
      
        //绑定事件，编辑名称
        $columnName.hover(function () {
            $(this).addClass('border-dotted-2');
        }, function () {
            $(this).removeClass('border-dotted-2');
        });
        $columnName.unbind("click").bind("click",function (e) {
        //$columnName.dblclick(function (e) {
            var $span = $(this).children('span');
            $span.hide();
            var $input = $(this).children('input');
            $input.val(that.Columns[0].DisplayName).show();
            $input.focus();
            //失去焦点事件
            $input.blur(function () {
                //简易看板的显示名称不能为空
                if (!$input.val()) {
                    $.IShowWarn("显示名称不能为空");
                    return;
                }
                $input.hide();
                that.Columns[0].DisplayName = $input.val();
                $span.show();
                $span.html($input.val());


            });
            //回车事件
            $input.bind('keyup', function (event) {
                if (event.keyCode == '13') {
                    $input.hide();
                    that.Columns[0].DisplayName = $input.val();
                    $span.show();
                    $span.html($input.val());
                }
            });
            e.stopPropagation();
            e.preventDefault();
        });
        
    },
    mouseUpHandl: function () {
        var that = this;
        var field = $.ReportDesigner.CurrentDragField;
        if (!field) { return; }
        //判断是否已存在一个
        var $table = $('table.table-simpleboard[data-widgetid=\"' + this.WidgitId + '\"]');
        //找到对应的列       
        var $td = $table.find('tr:eq(' + that.RowIndex + ')').children('td:eq(' + that.ColumnIndex + ')');
        if ($td.children('p').length > 0) {
            $.IShowWarn('一个单元格只能拖入一个字段');
            return;
        }
        that.ReportSourceId = field.SourceId;
        var displayname = field.DisplayName;
        if (field.DisplayName && field.DisplayName.length > SimpleBoardFiledLimitLength)
        {
            displayname = field.DisplayName.substring(0, SimpleBoardFiledLimitLength);
        }
        var column = new ReportWidgetColumn({
            ObjectId:$.IGuid(),
            ColumnCode: field.Code,
            ColumnName: field.Code,
            DisplayName: displayname,
            ColumnType: field.DataType,
            Formula: field.Formula,
            Format: field.Format
            
        });
        if (field.Code == "DefaultCountCode" || column.ColumnType != _DefaultOptions.ColumnType.Numeric) {
            column.FunctionType = _DefaultOptions.Function.Count;
        }
        else {
            column.Format = ",;#.##";
        }
        if (!that.Columns) {
            that.Columns = [];
        }
        that.Columns[0] = column;
        $.ReportDesigner.CurrentDragField = null;
        var objid = that.ObjectId == undefined ? that.ObjectID : that.ObjectId;
        debugger
        var param = {
            'ReportPage': JSON.stringify($.ReportDesigner.ReportPage),
            "WidgetObjectID": that.WidgitId,
            'ReportWidgetSimpleBoardObjectID': objid,
            'ColumnCode':column.ColumnCode
        };
        that.PostAction(param);
       
        
    },
    PostAction: function (param) {
        var that = this;
        $.ajax({
            type: "POST",
            url: window._PORTALROOT_GLOBAL + "/Reporting/LoadSimpleBoard",
            async: false,
            data: $.extend({ Command: 'LoadSimpleBoard' }, param),
            dataType: "json",
            success: function (data) {
                if (data.State) {
                    var text = data.Text;
                    var value = data.Value;
                    //展示出来
                    that.draw({ 'Text': text, 'Value': value ,'ColumnCode':param.ColumnCode,'SimpleBoardId':that.ObjectId});
                }
            }
        });
    }
};

