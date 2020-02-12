var ReportWidget = function (config) {
    this.ObjectId = config.ObjectId || "";
    this.Code = config.Code || "";
    this.DisplayName = config.DisplayName || "";
    this.WidgetType = config.WidgetType;
    this.ColumnTitle = config.ColumnTitle || "";
    this.RowTitles = config.RowTitles || [];
    this.Columns = config.Columns || [];
    //this.FilterColumns = config.FilterColumns || [];
    this.SortColumns = config.SortColumns || [];
    this.Categories = config.Categories || [];
    this.Series = config.Series || [];
    this.AxisDimension = config.AxisDimension || "";
    this.XAxisUnit = config.XAxisUnit || "";
    this.YAxisUnit = config.YAxisUnit || "";
    //this.IsUseSql = config.IsUseSql || false;
    //this.CommandText = config.CommandText || "";
    //this.SchemaCode = config.SchemaCode || "";
    //this.ReportSourceAssociations = config.ReportSourceAssociations || [];
    //this.IsSubSheet = config.IsSubSheet || false;
    ////临时存储sql的列
    //this.SqlColumns = [];
    this.ReportSourceType = config.ReportSourceType || _DefaultOptions.ReportSourceType.sheet;
    this.ReportSourceId = config.ReportSourceId || "";
    this.Exportable = config.Exportable || false;
    this.Layout = config.Layout || _DefaultOptions.ReportLayout.OneColumn;
    this.LinkageReports = config.LinkageReports || null;
    this.SourceFilters = config.SourceFilters || null;
    this.ReportWidgetSimpleBoard = config.ReportWidgetSimpleBoard || null;
    this.SimpleBoardRowNumber = config.SimpleBoardRowNumber || 2;
    this.SimpleBoardColumnNumber = config.SimpleBoardColumnNumber || 2;
    this.FrozenHeaderType = config.FrozenHeaderType || _DefaultOptions.ReportFrozenHeaderType.FrozenNone;
    this.DefaultSeriesData = config.DefaultSeriesData||"";
    this.DefaultCategorysData = config.DefaultCategorysData||"";
    //this.FunctionColumns = config.FunctionColumns || [];
    //this.Container = null; 
   
};
ReportWidget.prototype.init = function (filters, target) {
    debugger;
    this.ObjectId = this.ObjectID == undefined ? this.ObjectId : this.ObjectID;
    var that = this;
    if (!that.SortColumns) {
        that.SortColumns = [];
    }

    this.DefaultDataEditContainer = $("#editdefaultdata");
    if (target == null) {
        //var layout = "colspan-12";
        var layout = "colspan-12";
        if (that.Layout == _DefaultOptions.ReportLayout.TwoColumns) {
            layout = "colspan-6";
        }
        var $widget = $('<li id="' + that.ObjectId + '" class="widget h3_bg ' + layout + '" ></li>');
        //widget 头部
        var $widget_head = $('<div class="h3-head widget-header"></div>');
        //编辑默认数据
        var $widget_head_defaultdata = $('<span class="h3defaultdata iconReport-source"></span>');
        var $widget_head_title = $('<div class="head-container"><span class="iconReport-edit-block widgettitleediticon" ></span><span class="h3-head-title ">' + that.DisplayName + '</span></div>');
        //添加编辑框-编辑标题，默认隐藏
        var $widget_head_title_input = $('<input class="h3-head-title-input"></input>');
        var $widget_tools = $('<div class="h3_head_tools"></div>');
        if (that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
            var $widget_head_addRow = $('<span class="h3addrow iconReport-addrow">');
            var $widget_head_addCol = $('<span class="h3addcol iconReport-addcol"></span>');
            $widget_tools.append($widget_head_addRow);
            $widget_tools.append($widget_head_addCol);
            //绑定事件
            $widget_head_addRow.unbind('click').bind('click', function () {
                //最大限制2*3
                if (that.SimpleBoardRowNumber == 3 || (that.SimpleBoardColumnNumber == 3 && that.SimpleBoardRowNumber == 2)) {
                    $.IShowWarn("简易看板最大展示单元格为2*3");
                    return;
                }
                that.SimpleBoardRowNumber += 1;
                that.draw($.ReportDesigner.CurrentWidgetDom);
            });
            $widget_head_addCol.unbind('click').bind('click', function () {
                if (that.SimpleBoardColumnNumber == 3 || (that.SimpleBoardRowNumber == 3 && that.SimpleBoardColumnNumber == 2)) {
                    $.IShowWarn("简易看板最大展示单元格为2*3");
                    return;
                }
                that.SimpleBoardColumnNumber += 1;
                that.draw($.ReportDesigner.CurrentWidgetDom);
            });
        }
        var $widget_head_edit = $('<span class="h3edit iconReport-edit-outline"></span>');
        var $widget_head_change = $('<span class="h3change iconReport-exchange2"  ></span>');
        var $widget_head_setting = $('<span class="h3setting iconReport-setting"  ></span>');

        var $widget_head_remove = $('<span class="h3remove iconReport-close-outline"></span>');
      
        $widget_head.append($widget_head_title);
        $widget_head.append($widget_head_title_input);
        if (IsDev && that.WidgetType != _DefaultOptions.WidgetType.Combined && that.WidgetType != _DefaultOptions.WidgetType.SimpleBoard && that.WidgetType != _DefaultOptions.WidgetType.Detail)
            $widget_tools.append($widget_head_defaultdata);
        $widget_tools.append($widget_head_edit);
       
        $widget_tools.append($widget_head_setting);
        $widget_tools.append($widget_head_change);
        if (that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
            $widget_head_edit.hide();
            $widget_head_change.hide();
            //  $widget_head_setting.hide();
        } else if (that.WidgetType == _DefaultOptions.WidgetType.Detail) {
            $widget_head_change.hide();
        }
        $widget_tools.append($widget_head_remove);
        $widget_head.append($widget_tools);
        $widget.append($widget_head);

        //widget 主题

        var $widget_body = $widget_body = $('<div class="h3-body fixed-height h3-body-' + that.WidgetType + '"></div>');
        $widget.append($widget_body);
        debugger 
        //$widget.attr("data-" + this.WidgetTypeKey, that.WidgetType).attr("data-DisplayName", that.DisplayName).attr('data-widgetid', that.ObjectId);
        $widget.attr("data-widgettype", that.WidgetType).attr("data-DisplayName", that.DisplayName).attr('data-widgetid', that.ObjectId);

        if (that.WidgetType != _DefaultOptions.WidgetType.SimpleBoard) {
            var $widget_guid = $('<div class="h3-guide h3-guide-' + that.WidgetType + '"></div>');
            $widget.append($widget_guid);
        }
        //设置默认数据
        $widget_head_defaultdata.unbind('click').bind('click', function () {
            if (!$.ReportDesigner.EditingWidget || $(this).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                $.ReportDesigner.ControlElementSelected($(this).closest('li.widget'));
            }
            that.EditDefaultData();
           
        });

        //绑定编辑事件
        $widget_head_title.unbind('click').bind('click', function () {
            if (!$.ReportDesigner.EditingWidget || $(this).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                $.ReportDesigner.ControlElementSelected($(this).closest('li.widget'));
            }
            $(this).closest('div.h3-head').find('input.h3-head-title-input').val($.ReportDesigner.EditingWidget.DisplayName).show().focus();
            $(this).hide();
        });

        //失去焦点事件
        $widget_head_title_input.blur(function () {
            if ($(this).val().length > 15) {
                $.IShowWarn('名称过长');
                return;
            }
            $(this).hide();
            $.ReportDesigner.EditingWidget.DisplayName = $(this).val();
            var $span = $(this).closest('div.h3-head').find('span.h3-head-title');
            $span.html($(this).val()).closest("div.head-container").show();


        });
        //回车事件
        $widget_head_title_input.bind('keyup', function (event) {
            if (event.keyCode == '13') {
                $(this).hide();
                $.ReportDesigner.EditingWidget.DisplayName = $(this).val();
                var $span = $(this).closest('div.h3-head').find('span.h3-head-title');
                $span.html($(this).val()).closest("div.head-container").show();
            }
        });
        //编辑事件
        $widget_head_edit.unbind('click').bind('click', function () {
            var target = $(this), floatPanel = null;
            if (!$.ReportDesigner.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                $.ReportDesigner.ControlElementSelected($(target).closest('li.widget'));
            }
            $.ReportDesigner.FloatBoxHide();

            floatPanel = $(this).FloatBox({
                'offsetHeight': 6,
                'height': 300,
                'width': 250,
                'baseDom': $(this).closest('li.widget').get(0),
                'target': $('div.float-panel'),
                'documentClickVisible': false,
                'shownCallback': function () {
                    var divFloatPanel = $('div.float-panel');
                    var divFloatPanelBody = $('<div class="widgetfloatpannelbody"  id="my_float-panel-body" class="float-panel-body">');

                    $('div.float-panel').empty();
                    var widgetId = $(target).closest('li.widget').attr('data-widgetid');
                    var curWidget = $.ReportDesigner.FindWidget(widgetId);
                    if (!$.ReportDesigner.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                        $.ReportDesigner.ControlElementSelected($(target).closest('li.widget'));
                    }

                    var columns = $.IClone(curWidget.Columns);
                    var categories = $.IClone(curWidget.Categories);
                    var series = $.IClone(curWidget.Series);
                    var SortColumns = $.IClone(curWidget.SortColumns);
                    //标题
                    

                    var $ulSeries = $('<ul class="mycolumns series connectedSortable" data-type="series"></ul>');
                    var $ulCategories = $('<ul class="mycolumns categories connectedSortable" data-type="categories"></ul>');
                    if (curWidget.WidgetType != _DefaultOptions.WidgetType.Detail) {

                        //分类
                        var $title1 = null, $title2 = null;
                        if (curWidget.WidgetType == _DefaultOptions.WidgetType.Combined) {
                            $title1 = $('<p class="floatpanelfieldtitle"></p>').html('行字段');
                            $title2 = $('<p class="floatpanelfieldtitle"></p>').html('列字段');
                        } else {
                            $title1 = $('<p class="floatpanelfieldtitle"></p>').html('分类字段');
                            $title2 = $('<p class="floatpanelfieldtitle"></p>').html('系列字段');
                        }
                        //饼图和漏斗图不需要分类
                        if (curWidget.WidgetType != _DefaultOptions.WidgetType.Pie && curWidget.WidgetType != _DefaultOptions.WidgetType.Funnel) {
                            divFloatPanelBody.append($title1);
                            for (var i = 0, len = categories.length; i < len; i++) {
                                var $field = $('<li class="column categoriesfielditem" ></li>').attr('data-code', categories[i].ColumnCode);
                                var $display = $('<div class="column-title handle">').html(categories[i].DisplayName);
                                var $tool = $('<div  class="categoriesfielditemtool"></div>');
                                var $edit = $('<span  class="iconReport-edit-outline categoriesfielditemedit"></span>');
                                var $remove = $('<span  class="iconReport-remove-outline categoriesfielditemremove"></span>');
                                $tool.append($edit);
                                $tool.append($remove);
                                $field.append($display);
                                $field.append($tool);
                                $ulCategories.append($field);
                                $display.mouseover(function () {
                                    $(this).closest("li").css("border", "1px dashed #ccc");
                                    $(this).css("cursor", "move")
                                });
                                $display.mouseout(function () {
                                    $(this).closest("li").css("border", "");
                                });
                            }
                            divFloatPanelBody.append($ulCategories);
                        }

                        //系列
                        divFloatPanelBody.append($title2);
                        for (var i = 0, len = series.length; i < len; i++) {
                            var $field = $('<li class="column categoriesfielditem" ></li>').attr('data-code', series[i].ColumnCode);
                            var $display = $('<div class="column-title handle">').html(series[i].DisplayName);
                            var $tool = $('<div class="categoriesfielditemtool"></div>');
                            var $edit = $('<span class="iconReport-edit-outline categoriesfielditemedit"></span>');
                            var $remove = $('<span class="iconReport-remove-outline categoriesfielditemremove"></span>');
                            $tool.append($edit);
                            $tool.append($remove);
                            $field.append($display);
                            $field.append($tool);
                            $ulSeries.append($field);
                            $display.mouseover(function () {
                                $(this).closest("li").css("border", "1px dashed #ccc");
                                $(this).css("cursor", "move")
                            });
                            $display.mouseout(function () {
                                $(this).closest("li").css("border", "");
                            });
                        }

                        divFloatPanelBody.append($ulSeries);
                    }
                    var $title = $('<p class="floatpanelfieldtitle""></p>').html('值字段');
                    divFloatPanelBody.append($title);
                    var $ul = $('<ul class="mycolumns columns connectedSortable" data-type="columns"></ul>');
                    for (var i = 0, len = columns.length; i < len; i++) {
                        var $field = $('<li class="column categoriesfielditem" ></li>').attr('data-code', columns[i].ColumnCode);
                        var $display = $('<div class="column-title handle">').html(columns[i].DisplayName);
                        var $tool = $('<div class="categoriesfielditemtool" ></div>');
                        var $edit = $('<span class="iconReport-edit-outline categoriesfielditemedit"></span>');
                        var $remove = $('<span class="iconReport-remove-outline categoriesfielditemremove"></span>');
                        $tool.append($edit);
                        $tool.append($remove);
                        $field.append($display);
                        $field.append($tool);
                        $ul.append($field);
                        $display.mouseover(function () {
                            $(this).closest("li").css("border", "1px dashed #ccc");
                            $(this).css("cursor", "move")
                        });
                        $display.mouseout(function () {
                            $(this).closest("li").css("border", "");
                        });
                    }
                    divFloatPanelBody.append($ul);
                    var mycolumns = [];
                    if (that.Categories) {
                        for (var i = 0; i < that.Categories.length; i++) {
                            mycolumns.push(that.Categories[i]);
                        }
                    }
                    if (that.Series) {
                        for (var i = 0; i < that.Series.length; i++) {
                            mycolumns.push(that.Series[i]);
                        }
                    }
                    if (that.Columns) {
                        for (var i = 0; i < that.Columns.length; i++) {
                            mycolumns.push(that.Columns[i]);
                        }
                    }
                    $($ulCategories, $ulSeries, $ul).sortable({
                        handle: '.handle',
                        forcePlaceholderSize: true,
                        connectWith: '.connectedSortable'
                    })
                        .bind('sortupdate', function () {
                            var tmpColumns = [];

                            var $lis = $ulCategories.children('li');
                            $lis.each(function () {
                                var columnCode = $(this).attr('data-code');
                                var column = null;

                                column = $(mycolumns).filter(function () {
                                    return this.ColumnCode == columnCode;
                                });
                                if (column != null && column.length > 0) {
                                    tmpColumns.push(column[0]);
                                }
                            });
                            categories = tmpColumns;
                        });
                    $($ul, $ulCategories, $ulSeries).sortable({
                        handle: '.handle',
                        forcePlaceholderSize: true,
                        connectWith: '.connectedSortable'
                    }).bind('sortupdate', function () {
                        var tmpColumns = [];
                        $lis = $ul.children('li');
                        $lis.each(function () {
                            var columnCode = $(this).attr('data-code');
                            var column = null;

                            column = $(mycolumns).filter(function () {
                                return this.ColumnCode == columnCode;
                            });
                            if (column != null && column.length > 0) {
                                tmpColumns.push(column[0]);
                            }
                        });
                        columns = tmpColumns;
                    });
                    $($ulSeries, $ulSorts, $ul).sortable({
                        handle: '.handle',
                        forcePlaceholderSize: true,
                        connectWith: '.connectedSortable'
                    }).bind('sortupdate', function () {
                        var tmpColumns = [];
                        var $lis = $ulSeries.children('li');
                        $lis.each(function () {
                            var columnCode = $(this).attr('data-code');
                            var column = null;
                            column = $(mycolumns).filter(function () {
                                return this.ColumnCode == columnCode;
                            });
                            if (column != null && column.length > 0) {
                                tmpColumns.push(column[0]);
                            }
                        });
                        series = tmpColumns;
                    });
                    //排序字段

                    var $title_sort = $('<p class="floatpannelsorttitle">排序字段<span  class="sort-add iconReport-new"></span></h4>');
                    divFloatPanelBody.append($title_sort);
                    var $ulSorts = $('<ul class="sortcolumns" data-type="sortcolumns"></ul>');
                    for (var i = 0, len = SortColumns.length; i < len; i++) {
                        var $field = $('<li class="column categoriesfielditem" ></li>').attr('data-code', SortColumns[i].ColumnCode);
                        //var $handle = $('<span class="handle fa fa-arrows"></span>');
                        //$field.append($handle);
                        var $display = $('<div class="column-title handle">').html(SortColumns[i].DisplayName);
                        var $tool = $('<div class="categoriesfielditemtool"></div>');
                        var $edit = null;
                        if (SortColumns[i].Ascending) {
                            $edit = $('<span class="sort fa fa-sort-alpha-asc sottoolicon"></span>');
                        } else {
                            $edit = $('<span class="sort fa fa-sort-alpha-desc sottoolicon"></span>');
                        }
                        var $remove = $('<span class="fa iconReport-remove-outline categoriesfielditemremove"></span>');
                        $tool.append($edit);
                        $tool.append($remove);
                        $field.append($display);
                        $field.append($tool);
                        $ulSorts.append($field);
                        $display.mouseover(function () {
                            $(this).closest("li").css("border", "1px dashed #ccc");
                            $(this).css("cursor", "move")
                        });
                        $display.mouseout(function () {
                            $(this).closest("li").css("border", "");
                        });
                    }
                    divFloatPanelBody.append($ulSorts);
                    $ulSorts.sortable({
                        handle: '.handle',
                        forcePlaceholderSize: true
                    }).bind('sortupdate', function () {
                        var tmpColumns = [];
                        //console.log('sort updated！');
                        var $lis = $ulSorts.children('li');
                        $lis.each(function () {
                            var columnCode = $(this).attr('data-code');
                            var column = null;
                            column = $(SortColumns).filter(function () {
                                return this.ColumnCode == columnCode;
                            });
                            if (column != null && column.length > 0) {
                                tmpColumns.push(column[0]);
                            }
                        });
                        SortColumns = tmpColumns;
                        // that.draw(that.CurrentWidgetDom);

                    });


                    //绑定删除、修改事件
                    divFloatPanelBody.find('ul').find('span.iconReport-edit-outline').unbind('click').bind('click', function () {
                        //绑定编辑事件
                        var columnCode = $(this).closest('li.column').attr('data-code');
                        //var type = $(this).closest('ul').attr('data-type');   
                        curWidget.showColumnEditPanel(columnCode, this, $(this).closest('div.float-panel').get(0));
                    });
                    //删除
                    divFloatPanelBody.find('ul').find('span.iconReport-remove-outline').unbind('click').bind('click', function () {
                        if ($.ReportDesigner.FloatPanels.length > 1) {
                            return;
                        }
                        //绑定编辑事件
                        var type = $(this).closest('ul').attr('data-type');
                        var columnCode = $(this).closest('li.column').attr('data-code');
                        $(this).closest('li.column').remove();
                        if (type != "sortcolumns") {
                            var sort = $("#my_float-panel-body").find(".sortcolumns").find("li[data-code='" + columnCode + "']");
                            if (sort && sort.length > 0) {
                                sort.find('span.iconReport-remove-outline').click();
                            }
                        }
                        if (type == "columns") {
                            var index = -1;
                            for (var i = 0, len = columns.length; i < len; i++) {
                                if (columns[i].ColumnCode == columnCode) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index != -1) {
                                columns.splice(index, 1);

                                //  curWidget.draw();
                            }
                        } else if (type == "categories") {
                            var index = -1;
                            for (var i = 0, len = categories.length; i < len; i++) {
                                if (categories[i].ColumnCode == columnCode) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index != -1) {
                                categories.splice(index, 1);

                                //  curWidget.draw();
                            }
                        } else if (type == "series") {
                            var index = -1;
                            for (var i = 0, len = series.length; i < len; i++) {
                                if (series[i].ColumnCode == columnCode) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index != -1) {
                                series.splice(index, 1);

                                //   curWidget.draw();
                            }
                        }
                        else if (type == "sortcolumns") {
                            var index = -1;
                            for (var i = 0, len = SortColumns.length; i < len; i++) {
                                if (SortColumns[i].ColumnCode == columnCode) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index != -1) {
                                SortColumns.splice(index, 1);

                                //  curWidget.draw();
                            }
                        }
                    });

                    //添加排序字段
                    divFloatPanelBody.find("p").children('span.sort-add').unbind('click').bind('click', function (e) {
                        that.addSortColumnPanel(this, $(this).closest('div.float-panel').get(0));
                        e.stopPropagation();
                        e.preventDefault();
                    });
                    //排序
                    $ulSorts.find('span.sort').unbind('click').bind('click', function (e) {
                        if ($(this).hasClass('fa-sort-alpha-asc')) {
                            $(this).removeClass('fa-sort-alpha-asc').addClass('fa-sort-alpha-desc');
                        } else {
                            $(this).removeClass('fa-sort-alpha-desc').addClass('fa-sort-alpha-asc');
                        }
                        var columnCode = $(this).closest('li.column').attr('data-code');
                        var column = null;
                        column = $(SortColumns).filter(function () {
                            return this.ColumnCode == columnCode;
                        });
                        if (column != null && column.length > 0) {
                            column = column[0];
                            column.Ascending = !column.Ascending;
                        }

                        e.stopPropagation();
                        e.preventDefault();
                    });
                    divFloatPanel.append(divFloatPanelBody);
                    var divFloatPanelFooter = $('<div class="fieldeditfloatbutton">');
                    var $buttonleft = $('<button  type="button" class="masBox-btn btn_ok">确认</button>');
                    $buttonleft.unbind("click").bind("click", function () {
                        that.Columns = columns;
                        that.Categories = categories;
                        that.Series = series;
                        that.SortColumns = SortColumns;
                        that.draw($.ReportDesigner.CurrentWidgetDom);
                        if ($.ReportDesigner.FloatPanels.length > 0) {
                            var num = $.ReportDesigner.FloatPanels.length;
                            for (var i = num; i > 0; i--) {
                                var item = $.ReportDesigner.FloatPanels[i - 1];
                                item.hide();
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    });
                    var $buttonright = $('<button type="button" class="masBox-btn btn_cancel">取消</button>');
                    $buttonright.unbind("click").bind("click", function () {
                        if ($.ReportDesigner.FloatPanels.length > 0) {
                            var num = $.ReportDesigner.FloatPanels.length;
                            for (var i = num; i > 0; i--) {
                                var item = $.ReportDesigner.FloatPanels[i - 1];
                                item.onlyhide();
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    });
                    divFloatPanelFooter.append($buttonleft).append($buttonright);
                    divFloatPanel.append(divFloatPanelFooter);
                    //   divFloatPanelBody.niceScroll({ cursorcolor: "#f1f1f1" });

                }
            });
            floatPanel.show();
            $.ReportDesigner.FloatPanels.push(floatPanel);
        });
        debugger
        //切换图形
        $widget_head_change.unbind('click').bind('click', function (e) {
            debugger;
            var target = $(this), FloatPanel = null;
            if (!$.ReportDesigner.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                $.ReportDesigner.ControlElementSelected($(target).closest('li.widget'));
            }
            $.ReportDesigner.FloatBoxHide();
            FloatPanel = $(this).FloatBox({
                'offsetHeight': 6,
                'height': 150,
                'width': 120,
                'baseDom': $(this).closest('li.widget').get(0),
                'target': $('div.float-panel'),
                'shownCallback': function () {

                    $('div.float-panel').empty();
                    var canChangeTypes = [_DefaultOptions.WidgetType.Combined,
                        _DefaultOptions.WidgetType.Line,
                        _DefaultOptions.WidgetType.Bar,
                        _DefaultOptions.WidgetType.Pie,
                        _DefaultOptions.WidgetType.Radar,
                        _DefaultOptions.WidgetType.Funnel
                    ];
                    var $ul = $('<ul class="widgetchangelist">');
                    for (var i = 0, len = canChangeTypes.length; i < len; i++) {
                        if (canChangeTypes[i] == $.ReportDesigner.EditingWidget.WidgetType) {
                            continue;
                        } else {
                            if (canChangeTypes[i] == _DefaultOptions.WidgetType.Combined) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;"  class="iconReport-report-combined"></span>汇总表</li>')
                            } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Line) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;" class="iconReport-report-line"></span>折线图</li>')
                            } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Bar) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;" class="iconReport-report-bar"></span>柱状图</li>')
                            } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Pie) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;" class="iconReport-report-pie"></span>饼图</li>')
                            } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Radar) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;" class="iconReport-report-radar"></span>雷达图</li>')
                            } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Funnel) {
                                var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;margin-top:5px;font-size: 18px;" class="icon iconReport-report-funnel"></span>漏斗图</li>')
                            }
                            $ul.append($li);
                        }
                    }
                    $('div.float-panel').append($ul);

                    //切换报表类型时改变报表标题
                    var headIndex = $('.h3change.iconReport-exchange2').index(e.target);
                    var changeHeadFlag = false;
                    var HeadText = $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName;
                    var HeadElement = $(e.target).closest('.widget-header').find('.h3-head-title');
                    for (var p in ReportTemplates) {
                        if (ReportTemplates[p].Text == HeadText) {
                            changeHeadFlag = true; break;
                        }
                    }
                    //绑定事件
                    $ul.children('li').each(function () {
                        $(this).unbind('click').bind('click', function () {
                            if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Line) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Line;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Line.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Line.Text;
                                } 
                            } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Combined) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Combined;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Combined.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Combined.Text;
                                } 
                            } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Bar) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Bar;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Bar.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Bar.Text;
                                } 
                            } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Pie) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Pie;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Pie.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Pie.Text;
                                } 
                            } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Radar) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Radar;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Radar.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Radar.Text;
                                } 
                            } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Funnel) {
                                $.ReportDesigner.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Funnel;
                                if (changeHeadFlag == true) {
                                    HeadElement.html(ReportTemplates.Funnel.Text);
                                    $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Funnel.Text;
                                } 
                            }
                            FloatPanel.hide();
                            $.ReportDesigner.EditingWidget.draw($(target).closest('li.widget'));
                        });
                    });
                }
            });
            FloatPanel.show();
            $.ReportDesigner.FloatPanels.push(FloatPanel);
            e.stopPropagation();
            e.preventDefault();
        });

        $widget_head_setting.unbind('click').bind('click', function () {
            var that = this;
            var target = $(this), floatPanel = null;
            if (!$.ReportDesigner.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != $.ReportDesigner.EditingWidget.ObjectId) {
                $.ReportDesigner.ControlElementSelected($(target).closest('li.widget'));
            }
            $.ReportDesigner.FloatBoxHide();
            var mywidgetid = $.ReportDesigner.EditingWidget.ObjectId;
            floatPanel = $(this).FloatBox({
                'offsetHeight': 6,
                'height': 180,
                'width': 180,
                'baseDom': $(this).closest('li.widget').get(0),
                'target': $('div.float-panel'),
                'documentClickVisible': false,
                'shownCallback': function () {
                    var FloatPanel = $('div.float-panel');
                    var FloatPanelBody = $('<div style="height:80%;overflow: auto;">');
                    var FloatPanelFooter = $('<div class="headsettingfooter">');
                    var ButtonLeft = $('<button  type="button" class="masBox-btn btn_ok">确认</button>');
                    var ButtonRight = $('<button type="button" class="masBox-btn btn_cancel">取消</button>');
                    FloatPanelFooter.append(ButtonLeft).append(ButtonRight);
                    ButtonLeft.unbind('click').bind('click', function () {
                        var num = $.ReportDesigner.FloatPanels.length
                        if ($.ReportDesigner.FloatPanels.length > 1) {
                            for (var i = num - 1; i >= 0 ; i--) {
                                if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                    $.ReportDesigner.FloatPanels[i].hide();
                                }
                                else {
                                    $.ReportDesigner.FloatPanels[i].onlyhide();
                                }
                            }
                        }
                        else {
                            floatPanel.hide();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        $.ReportDesigner.LinkageWidgetPanel.hide();
                    });
                    ButtonRight.unbind('click').bind('click', function () {
                        var num = $.ReportDesigner.FloatPanels.length
                        if ($.ReportDesigner.FloatPanels.length > 1) {
                            for (var i = num - 1; i >= 0; i--) {
                                if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                    $.ReportDesigner.FloatPanels[i].hide();
                                }
                                else {
                                    $.ReportDesigner.FloatPanels[i].onlyhide();
                                }
                            }
                        }
                        else {
                            floatPanel.onlyhide();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        $.ReportDesigner.LinkageWidgetPanel.hide();
                    });
                    $('div.float-panel').empty();
                    var $layout = $('<div class="widget-layout"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_myyyll" /><label for="' + mywidgetid + '_myyyll" style="width:100%">一行两列</label></div>');
                    var $export = $('<div class="widget-export"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_myyxdc" /><label for="' + mywidgetid + '_myyxdc" style="width:100%">允许导出</label></div>');
                    var $fixrow = $('<div class="widget-fixrowheader"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdhbt" /><label for="' + mywidgetid + '_mygdhbt" style="width:100%">固定行表头</label></div>');
                    var $fixcol = $('<div class="widget-fixcolheader"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdlbt" /><label for="' + mywidgetid + '_mygdlbt" style="width:100%">固定列表头</label></div>');
                    var $asso = $('<div class="widget-association"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdbb" /><label for="' + mywidgetid + '_mygdbb" style="width:100%">联动报表</label></div>');
                    FloatPanelBody.append($layout);
                    FloatPanelBody.append($export);
                    FloatPanelBody.append($fixrow);
                    FloatPanelBody.append($fixcol);
                    FloatPanelBody.append($asso);
                    $layout.find('input').prop('checked', $.ReportDesigner.EditingWidget.Layout == _DefaultOptions.ReportLayout.TwoColumns);
                    $export.find('input').prop('checked', $.ReportDesigner.EditingWidget.Exportable);
                    $fixrow.find('input').prop('checked', $.ReportDesigner.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowHeader
                        || $.ReportDesigner.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
                    $fixcol.find('input').prop('checked', $.ReportDesigner.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenColumnHeader
                        || $.ReportDesigner.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
                    $asso.find('input').prop('checked', $.ReportDesigner.EditingWidget.LinkageReports && $.ReportDesigner.EditingWidget.LinkageReports.length > 0);
                    if ($.ReportDesigner.EditingWidget.WidgetType != _DefaultOptions.WidgetType.Combined) {
                        //只有明细表和汇总表才有导出和固定表头
                        $export.hide();
                        $fixrow.hide();
                        $fixcol.hide();
                    }
                    if ($.ReportDesigner.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Detail) {
                        $asso.hide();
                        $export.show();
                    } if ($.ReportDesigner.EditingWidget.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                        $asso.hide();
                    }
                    $('div.float-panel').append(FloatPanelBody);

                    //绑定联动报表事件
                    $asso.find('input').bind('change', function () {
                        if (!$(this).is(':checked')) {
                            $.ReportDesigner.EditingWidget.LinkageReports = [];
                            if ($.ReportDesigner.LinkageWidgetPanel) {
                                $.ReportDesigner.LinkageWidgetPanel.hide();
                            }
                        } else {
                            //调用另一个浮动框
                            var target = $(this);
                            $.ReportDesigner.LinkageWidgetPanel = $(this).parent().find("label").FloatBox({
                                'offsetHeight': 6,
                                'height': 120,
                                'width': 150,
                                'base_x': 'left',
                                'base_y': 'top',
                                'baseDom': $(this).closest('div.float-panel').get(0),
                                'target': $('div.linkage-widget'),
                                'shownCallback': function () {
                                    var diclinkage = {};
                                    if ($.ReportDesigner.EditingWidget.LinkageReports && $.ReportDesigner.EditingWidget.LinkageReports.length > 0) {
                                        for (var i = 0; i < $.ReportDesigner.EditingWidget.LinkageReports.length; i++) {
                                            var item = $.ReportDesigner.EditingWidget.LinkageReports[i];
                                            diclinkage[item] = true;
                                        }
                                    }
                                    $('div.linkage-widget').empty();
                                    var $chkAll = $('<div style="margin-left:5px;"><input type="checkbox" style="margin-right:10px;" id="mylinkwidgetcheckall"><label style="width:100%;" for="mylinkwidgetcheckall"> 全选</label></div>');
                                    $('div.linkage-widget').append($chkAll);

                                    for (var i = 0, len = $.ReportDesigner.ReportPage.ReportWidgets.length; i < len; i++) {
                                        if ($.ReportDesigner.ReportPage.ReportWidgets[i].ObjectId != $.ReportDesigner.EditingWidget.ObjectId) {
                                            var widget = $.ReportDesigner.ReportPage.ReportWidgets[i];

                                            var $widget = $('<div id="' + widget.ObjectId + '" style="margin-left:5px;"><input type="checkbox"   id="' + widget.ObjectId + '_input"/><label style="width:100%;"  for="' + widget.ObjectId + '_input"> ' + widget.DisplayName + '</label></div>');
                                            if (diclinkage[$.ReportDesigner.ReportPage.ReportWidgets[i].ObjectId]) {
                                                $widget.find("input").attr("checked", "checked");
                                            }
                                            $('div.linkage-widget').append($widget);
                                        }
                                    }
                                    $('div.linkage-widget').show();

                                    //初始化，当所有子项都勾选的时候全选按钮也勾选
                                    var AllFlag = true;
                                    $('div.linkage-widget').find('input').not("#mylinkwidgetcheckall").each(function () {
                                        if (!$(this).is(':checked')) {
                                            AllFlag = false;
                                        }
                                    })
                                    if (AllFlag) {
                                        $chkAll.find('input').prop('checked', true);
                                    } else {
                                        $chkAll.find('input').prop('checked', false);
                                    }

                                    //绑定全选checkbox事件
                                    $chkAll.find('input').bind('change', function () {
                                        if ($(this).is(':checked')) {
                                            $('div.linkage-widget').find('input').prop('checked', true);
                                        } else {
                                            $('div.linkage-widget').find('input').prop('checked', false);
                                        }
                                    });
                                    //绑定全选checkbox事件
                                    $('div.linkage-widget').find('input').bind('change', function () {
                                        var Flag = true;
                                        $('div.linkage-widget').find('input').not("#mylinkwidgetcheckall").each(function () {
                                            if (!$(this).is(':checked')) {
                                                Flag = false;
                                            }  
                                        })
                                        if (Flag) {
                                            $chkAll.find('input').prop('checked', true);
                                        } else {
                                            $chkAll.find('input').prop('checked', false);
                                        }

                                        
                                    });
                                    

                                },
                                'hiddenCallback': function () {
                                    var linkages = [];
                                    $('div.linkage-widget').find('input').each(function () {
                                        if ($(this).is(':checked')) {
                                            var widgetid = $(this).parent('div').attr('id');
                                            if (widgetid)
                                                linkages.push(widgetid);
                                        }
                                    });
                                    $.ReportDesigner.EditingWidget.LinkageReports = linkages;
                                }
                            });
                            $.ReportDesigner.LinkageWidgetPanel.show();
                            $.ReportDesigner.FloatPanels.push($.ReportDesigner.LinkageWidgetPanel);
                        }
                    });
                    if ($asso.find('input').prop('checked')) {
                        $asso.find('input').change();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    FloatPanel.append(FloatPanelBody).append(FloatPanelFooter);
                },
                'hiddenCallback': function () {
                    debugger 
                    $.ReportDesigner.CurrentWidgetDom = $("#" + that.ObjectId);
                    $(".h3-body-selected").removeClass("h3-body-selected");
                    $.ReportDesigner.CurrentWidgetDom.addClass("h3-body-selected");
                    var widget = null;
                    var widget_id = $(target).closest('li.widget').attr('data-widgetid');
                    if (widget_id != $.ReportDesigner.EditingWidget.ObjectId) {
                        widget = $.ReportDesigner.FindWidget(widget_id);
                    } else {
                        widget = $.ReportDesigner.EditingWidget;
                    }
                    //取值
                    var layout = $('div.float-panel').find('div.widget-layout').children('input').prop('checked');
                    var exportable = $('div.float-panel').find('div.widget-export').children('input').prop('checked');
                    var fixrow = $('div.float-panel').find('div.widget-fixrowheader').children('input').prop('checked');
                    var fixcol = $('div.float-panel').find('div.widget-fixcolheader').children('input').prop('checked');
                    //联动报表
                    var asso = $('div.float-panel').find('div.widget-association').children('input').prop('checked');
                    if (!asso) {
                        widget.LinkageReports = [];
                    }
                    if (layout) { widget.Layout = _DefaultOptions.ReportLayout.TwoColumns; } else { widget.Layout = _DefaultOptions.ReportLayout.OneColumn; }
                    if (exportable) { widget.Exportable = true; } else { widget.Exportable = false; }
                    if (fixcol && fixrow) {
                        widget.FrozenHeaderType = _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader;
                    } else if (fixcol && !fixrow) {
                        widget.FrozenHeaderType = _DefaultOptions.ReportFrozenHeaderType.FrozenColumnHeader;
                    } else if (!fixcol && fixrow) {
                        widget.FrozenHeaderType = _DefaultOptions.ReportFrozenHeaderType.FrozenRowHeader;
                    } else {
                        widget.FrozenHeaderType = _DefaultOptions.ReportFrozenHeaderType.FrozenNone;
                    }
                    if (widget.Layout == _DefaultOptions.ReportLayout.TwoColumns) {
                        if (!$(target).closest('li.widget').hasClass('colspan-6')) {
                            $(target).closest('li.widget').removeClass('colspan-12').addClass('colspan-6');
                            widget.draw($(target).closest('li.widget'));
                        }
                    } else {
                        if (!$(target).closest('li.widget').hasClass('colspan-12')) {
                            $(target).closest('li.widget').removeClass('colspan-6').addClass('colspan-12');
                            widget.draw($(target).closest('li.widget'));
                        }
                    }

                }
            });
            $.ReportDesigner.FloatPanels.push(floatPanel);
            floatPanel.show();

        });
        //绑定删除widget事件
        $widget_head_remove.unbind('click').bind('click', function () {
            if (confirm('您确定要删除吗？')) {
                $(this).closest('li.widget').remove();
                //清空数据源等关联属性             
                var index = -1;

                for (var i = 0, len = $.ReportDesigner.ReportPage.ReportWidgets.length; i < len; i++) {
                    if ($.ReportDesigner.ReportPage.ReportWidgets[i].ObjectId == that.ObjectId) {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    $.ReportDesigner.ReportPage.ReportWidgets.splice(i, 1);
                    $.ReportDesigner.EditingWidget = null;
                }
                $.ReportDesigner.DragZone.find('span').html($($.ReportDesigner.WidgetList).children('li.widget').length + 1);
                return false;
            }


        });
        //绑定切换选中widget事件
        $widget.unbind('click').bind('click', function () {
            $.ReportDesigner.ControlElementSelected(this);
            $.ReportDesigner.CurrentWidgetDom = $widget;
        });

        $.ReportDesigner.WidgetList.append($widget);

        target = $widget;
        $.ReportDesigner.CurrentWidgetDom = $widget;

    }

    this.draw(target);
};
ReportWidget.prototype.draw = function (target) {
    debugger
    var that = this;
    if (!that.Columns) that.Columns = [];
    if (!that.Categories) that.Categories = [];
    if (!that.Series) that.Series = [];
    if (!that.ReportSourceId) {
        $.ReportDesigner.ReportSourceManager.View_SetAllSourceEnabled();
    }
        $.ReportDesigner.CurrentWidgetDom = target;
    if (this.WidgetType == _DefaultOptions.WidgetType.Detail) {
        
        var container = null;

            container= $($.ReportDesigner.CurrentWidgetDom).find('div.h3-body').empty();

        container.addClass('widget-detail ');
        var opt = {
            dragCallBack: function () {
                var field = $.ReportDesigner.CurrentDragField;
                if (!field || !field.Code) return false;
                //明细表不处理计数字段
                if (field.Code == "DefaultCountCode") {
                    return false;
                }
                //字段已经存在报表中不允许再拖
                if (that.IsColumnExist(field.Code)) {
                    $.IShowWarn('报表中已经存在该字段，不允许再次拖动！');
                    return false;
                    //$.IConfirm('提示', '报表中已经存在该字段，不允许再次拖动！', function () {
                    //    return false;
                    //});
                    //$.IShowSuccess("报表中该字段已经覆盖");
                    
                }
                debugger
                //设置数据源
                that.ReportSourceId = field.SourceId;
                $.ReportDesigner.ReportSourceManager.View_SetSourceDisabled(field.SourceId);
                $.ReportDesigner.CurrentWidgetDom.find('div.h3-guide').hide();
                //for (var i = 0, len = that.Columns.length; i < len; i++) {
                //    if (that.Columns[i].ColumnCode == field.Code)
                //    {
                //        return that.getDesignValue(_DefaultOptions.WidgetType.Detail);
                //    }
                //}
                var displayname = field.DisplayName;
                if (field.DisplayName && field.DisplayName.length > FiledLimitLength) {
                    displayname = field.DisplayName.substring(0, FiledLimitLength);
                }
                var column = new ReportWidgetColumn({
                    ColumnCode: field.Code,
                    ColumnName: field.Code,
                    DisplayName: displayname,
                    ColumnType: field.DataType,
                    Formula: field.Formula
                });
                if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                    column.Format = 'yyyy/MM/dd HH:mm:ss';
                    column.FunctionType = _DefaultOptions.Function.YY;

                }

                that.Columns.push(column);
                $.ReportDesigner.CurrentDragField = null;
                //回调获取数据
                return that.getDesignValue(_DefaultOptions.WidgetType.Detail);
            }
        };
        //判断是还原数据还是新建数据
        if (that.Columns != null && that.Columns.length > 0) {
            var res = that.getDesignValue(that.WidgetType);
            if (res) {
                opt.data = res.datas;
                opt.columns = res.columns;
            }
        }
        opt.reportWidget = that;
        var reportDetail = new ReportDetail(opt, container);
        $.ReportDesigner.ReportDetailManagers[that.ObjectId] = reportDetail;

    } else if (this.WidgetType == _DefaultOptions.WidgetType.Bar ||
        this.WidgetType == _DefaultOptions.WidgetType.Line ||
        this.WidgetType == _DefaultOptions.WidgetType.Pie ||
        this.WidgetType == _DefaultOptions.WidgetType.Funnel ||
        this.WidgetType == _DefaultOptions.WidgetType.Radar) {
        var container = $($.ReportDesigner.CurrentWidgetDom).find('div.h3-body').empty();
        var width = container.width();
        var height = container.height();
        $.ReportDesigner.ReportChartManager = container.ChartBase({
            Width: width,
            Height: height,
            ChartType: this.WidgetType,
            ShowCfg: true,
            ShowTitle: false,
            DragDoneCallBack: function (ret) {
                var field = $.ReportDesigner.CurrentDragField;
                if (!field || !field.Code) return false;
                //字段已经存在报表中不允许再拖
                if (that.IsColumnExist(field.Code)) {
                    $.IShowWarn('报表中已经存在该字段，不允许再次拖动！');
                    return false;
                }
                //设置数据源
                that.ReportSourceId = field.SourceId;
                $.ReportDesigner.ReportSourceManager.View_SetSourceDisabled(field.SourceId);
                $.ReportDesigner.CurrentWidgetDom.find('div.h3-guide').hide();
                if (ret.type == "Categories") {
                    if (that.Categories.length > 0) {
                        $.IShowWarn("分类字段只能有一个");
                        return false;
                    }
                    if (field.Code == "DefaultCountCode") {
                        $.IShowWarn("计数字段不能是分类字段");
                        return false;
                    }
                    var column = new ReportWidgetColumn({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        Formula: field.Formula
                    });
                    if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                        column.FunctionType = _DefaultOptions.Function.YY;
                        var sortcolumn = new ReportWidgetColumn({
                            ColumnCode: field.Code,
                            ColumnName: field.Code,
                            DisplayName: field.DisplayName,
                            ColumnType: field.DataType,
                            Formula: field.Formula,
                            Ascending: true
                        });
                        that.SortColumns.push(column);
                    }
                    that.Categories.push(column);
                    $.ReportDesigner.CurrentDragField = null;
                    return that.getDesignValue(that.WidgetType);
                } else if (ret.type == "Series") {
                    if (that.Series.length > 0) {
                        $.IShowWarn("系列字段只能有一个");
                        return false;
                    }
                    if (field.Code == "DefaultCountCode") {
                        $.IShowWarn("计数字段不能是系列字段");
                        return false;
                    }
                    var column = new ReportWidgetColumn({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        Formula: field.Formula
                    });
                    if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                        column.FunctionType = _DefaultOptions.Function.YY;
                        var sortcolumn = new ReportWidgetColumn({
                            ColumnCode: field.Code,
                            ColumnName: field.Code,
                            DisplayName: field.DisplayName,
                            ColumnType: field.DataType,
                            Formula: field.Formula,
                            Ascending: true
                        });
                        that.SortColumns.push(column);
                    }
                    that.Series.push(column);
                    $.ReportDesigner.CurrentDragField = null;
                    return that.getDesignValue(that.WidgetType);
                } else if (ret.type == "Fields") {
                    //如果不为数字类型
                    //if (field.DataType != _DefaultOptions.ColumnType.Numeric) {
                    //    $.IShowWarn('值字段只能为数字类型！');
                    //    return false;
                    //}
                    var column = new ReportWidgetColumn({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        Formula: field.Formula,
                        Format: field.Format
                    });
                    if (field.Code == "DefaultCountCode") {
                        column.FunctionType = _DefaultOptions.Function.Count;
                    }
                    else {
                        column.Format = ",;#.##";
                    }
                    if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                        column.FunctionType = _DefaultOptions.Function.YY;
                    }
                    that.Columns.push(column);
                    $.ReportDesigner.CurrentDragField = null;
                    return that.getDesignValue(that.WidgetType);
                }

            }

        });
        if (this.Categories.length > 0 || this.Series.length > 0 || this.Columns.length > 0) {
            var res = that.getDesignValue(this.WidgetType);
            if (res==null|| (!res.Categories || res.Categories.length == 0) && (!res.Series || res.Series.length == 0 || !res.Series["Data"] || res.Series["Data"].length == 0))
            {
                res = { Series: that.StringToArray(that.ArrayToString(ReportDefaultData[this.WidgetType]["Series"]), false, true), Categories: that.StringToArray(that.ArrayToString(ReportDefaultData[this.WidgetType]["Categories"]), true, false),ShowDemo:true };
            }
            else
            {
                $.extend(res, { ShowDemo:false});
            }
            $.extend($.ReportDesigner.ReportChartManager.ReportWidget, res);
            $.ReportDesigner.ReportChartManager.drawChart();
            $.ReportDesigner.ReportChartManager.drawLegend();
            return;
        }
    } else if (this.WidgetType == _DefaultOptions.WidgetType.Combined) {
        var container = $($.ReportDesigner.CurrentWidgetDom).find('div.h3-body').empty();
        var opt = {
            widget: this,
            dragCallBack: function (ret) {
                var field = $.ReportDesigner.CurrentDragField;
                if (!field || !field.Code) return false;
                $.ReportDesigner.CurrentWidgetDom.find('div.h3-guide').hide();
                //字段已经存在报表中不允许再拖
                if (that.IsColumnExist(field.Code)) {
                    $.IShowWarn('报表中已经存在该字段，不允许再次拖动！');
                    return false;
                }
                //设置数据源
                that.ReportSourceId = field.SourceId;
                $.ReportDesigner.ReportSourceManager.View_SetSourceDisabled(field.SourceId);
                if (ret.type == "Categories") {
                    if (field.Code == "DefaultCountCode") {
                        $.IShowWarn("计数字段不能是行字段");
                        return false;
                    }
                    var column = new ReportWidgetColumn({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        Formula: field.Formula
                    });
                    if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                        column.FunctionType = _DefaultOptions.Function.YY;
                        var sortcolumn = new ReportWidgetColumn({
                            ColumnCode: field.Code,
                            ColumnName: field.Code,
                            DisplayName: field.DisplayName,
                            ColumnType: field.DataType,
                            Formula: field.Formula
                        });
                        that.SortColumns.push(column);
                    }
                    that.Categories.push(column);
                } else if (ret.type == "Series") {
                    if (field.Code == "DefaultCountCode") {
                        $.IShowWarn("计数字段不能是列字段");
                        return false;
                    }
                    var column = new ReportWidgetColumn({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        Formula: field.Formula,
                        Ascending: true
                    });
                    if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                        column.FunctionType = _DefaultOptions.Function.YY;
                        var sortcolumn = new ReportWidgetColumn({
                            ColumnCode: field.Code,
                            ColumnName: field.Code,
                            DisplayName: field.DisplayName,
                            ColumnType: field.DataType,
                            Formula: field.Formula,
                            Ascending: true
                        });
                        that.SortColumns.push(column);
                    }
                    that.Series.push(column);
                    //return that.getDesignValue(that.WidgetType);
                } else if (ret.type == "Field") {
                    if (that.Categories && that.Categories.length > 0 || that.Series && that.Series.length > 0) {
                        //如果不为数字类型
                        //if (field.DataType != _DefaultOptions.ColumnType.Numeric) {
                        //    $.IShowWarn('值字段只能为数字类型！');
                        //    return false;
                        //}
                        if (field.Code == "DefaultCountCode") {
                            if (that.Categories.length == 0 && that.Series.length == 0) {
                                $.IShowWarn('不能单独拖入计数字段！');
                                return false;
                            }
                        }

                        var column = new ReportWidgetColumn({
                            ColumnCode: field.Code,
                            ColumnName: field.Code,
                            DisplayName: field.DisplayName,
                            ColumnType: field.DataType,
                            Formula: field.Formula,
                            Format: field.Format
                        });
                        if (field.Code == "DefaultCountCode") {
                            column.FunctionType = _DefaultOptions.Function.Count;
                        } else {
                           // 汇总表去掉默认勾选小数位
                            //column.Format = ",;#.##";
                        }
                        if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                            column.FunctionType = _DefaultOptions.Function.YY;
                        }
                        that.Columns.push(column);

                        //return that.getDesignValue(that.WidgetType);
                    }
                    else {
                        $.IShowWarn('请先拖入分类或系列！');
                    }

                }
                $.ReportDesigner.CurrentDragField = null;
            }
        };
        var reportCombined = new ReportCombined(opt, container);
    } else if (this.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
        debugger
        var $table = $(target).find('table.table-simpleboard[data-widgetid=\"' + that.ObjectId + '\"]');
        if ($table.length == 0) {
            $table = $('<table  class="table-simpleboard"></table>').attr('data-widgetid', that.ObjectId);
            $(target).find('div.h3-body').append($table);
            if (this.SimpleBoardRowNumber == 0) {
                this.SimpleBoardRowNumber = 2;
                this.SimpleBoardColumnNumber = 2;
            }
        }
        $table.empty();

        for (var i = 0; i < this.SimpleBoardRowNumber; i++) {
            var guid = $.IGuid();
            var $tr = $('<tr id="' + guid + '"></tr>');
            for (var j = 0; j < this.SimpleBoardColumnNumber; j++) {
                var $td = $('<td class="td-simpleboard" style="cursor:pointer;"></td>');
                $tr.append($td);
                //添加说明:
                var $guide = $('<h4 class="h3guide" style="color:#929292;">拖入字段</h4>');
                $td.append($guide);
                //添加删除行、列
                var $div = $('<div class="column-tools"></div>');
                var $span_edit = $('<span class="tool-edit  fa fa-pencil" ></span>');
                var $span_remove = $('<span class="tool-remove fa fa-times"></span>');
                //隐藏简易模板里小块里的设置按钮
                //var $span_editother = $('<span class="tool-editother  iconReport-setting" ></span>');
                //$div.append($span_editother);
                $div.append($span_edit);
                $div.append($span_remove);
                $td.append($div);
                $div.hide();

            }
            $table.append($tr);
        }
        //编辑字段
        $table.find('td').find('span.tool-edit').each(function () {
            $(this).unbind('click').bind('click', function () {
                //判断是否有显示的
                if ($.ReportDesigner.FloatPanels.length > 0) {
                    for (var i = $.ReportDesigner.FloatPanels.length - 1; i >= 0; i--) {
                        $.ReportDesigner.FloatPanels[i].hide();
                    }
                }
                var p = $(this).closest('td').children('p[data-code]');
                if (p.length == 0) {
                    return;
                }
                if ($('#float-panel-field-eidt').is(':visible')) {
                    $.ReportDesigner.FloatPanel.hide();
                    return;
                }
                var columnCode = $(p).attr('data-code');
                that.showColumnEditPanel(columnCode, this, $(this).closest('div.column-tools'));
            });
        });
        $table.find('td').find('span.tool-editother').each(function () {
            $(this).unbind('click').bind('click', function () {
                //判断是否有显示的
                if ($.ReportDesigner.FloatPanels.length > 0) {
                    for (var i = $.ReportDesigner.FloatPanels.length - 1; i >= 0; i--) {
                        $.ReportDesigner.FloatPanels[i].hide();
                    }
                }
                var p = $(this).closest('td').children('p[data-code]');
                if (p.length == 0) {
                    return;
                }
                if ($('#float-panel-field-eidt').is(':visible')) {
                    $.ReportDesigner.FloatPanel.hide();
                    return;
                }
                var columnCode = $(p).attr('data-code');
                var index_tr = $(this).closest('tr').index();
                var index_td = $(this).closest('td').index();
                var simpleBoard = that.getSimpleBoardWidget(index_tr, index_td);
                floatPanel = $(this).FloatBox({
                    'offsetHeight': 6,
                    'height': 180,
                    'width': 180,
                    'baseDom': $(this).closest('td').get(0),
                    'target': $('div.float-panel'),
                    'documentClickVisible': false,
                    'shownCallback': function () {
                        var mywidgetid = simpleBoard.ObjectId;
                        var FloatPanel = $('div.float-panel');
                        var FloatPanelBody = $('<div style="height:80%;overflow: auto;">');
                        var FloatPanelFooter = $('<div class="headsettingfooter">');
                        var ButtonLeft = $('<button  type="button" class="masBox-btn btn_ok">确认</button>');
                        var ButtonRight = $('<button type="button" class="masBox-btn btn_cancel">取消</button>');
                        FloatPanelFooter.append(ButtonLeft).append(ButtonRight);
                        ButtonLeft.unbind('click').bind('click', function () {
                            var num = $.ReportDesigner.FloatPanels.length
                            if ($.ReportDesigner.FloatPanels.length > 1) {
                                for (var i = num - 1; i >= 0 ; i--) {
                                    if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                        $.ReportDesigner.FloatPanels[i].hide();
                                    }
                                    else {
                                        $.ReportDesigner.FloatPanels[i].onlyhide();
                                    }
                                }
                            }
                            else {
                                floatPanel.hide();
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        });
                        ButtonRight.unbind('click').bind('click', function () {
                            var num = $.ReportDesigner.FloatPanels.length
                            if ($.ReportDesigner.FloatPanels.length > 1) {
                                for (var i = num - 1; i >= 0; i--) {
                                    if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                        $.ReportDesigner.FloatPanels[i].hide();
                                    }
                                    else {
                                        $.ReportDesigner.FloatPanels[i].onlyhide();
                                    }
                                }
                            }
                            else {
                                floatPanel.onlyhide();
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        }); 
                    },
                    'hiddenCallback': function () {
                        

                    }
                });
                $.ReportDesigner.FloatPanels.push(floatPanel);
                floatPanel.show();
            });
        });
        //编辑删除
        $table.find('td').find('span.tool-remove').each(function () {
            $(this).unbind("click").bind('click', function () {
                //判断是否有显示的
                if ($.ReportDesigner.FloatPanels.length > 0) {
                    for (var i = $.ReportDesigner.FloatPanels.length - 1; i >= 0; i--) {
                        $.ReportDesigner.FloatPanels[i].hide();
                    }
                }
                $.ReportDesigner.FloatPanel = $(this).FloatBox({
                    'offsetHeight': 6,
                    'height': 70,
                    'width': 90,
                    'baseDom': $(this).closest('div.column-tools').get(0),
                    'target': $('div.simpleboard-column-remove'),
                    'shownCallback': function () {
                        $('div.simpleboard-column-remove').show();
                        //绑定事件
                        //删除td，实际上是删除字段
                        $('div.simpleboard-column-remove').find('li.td-remove').unbind("click").bind('click', function () {
                            var index_tr = $($.ReportDesigner.FloatPanel.opt.baseDom).closest('tr').index();
                            var index_td = $($.ReportDesigner.FloatPanel.opt.baseDom).closest('td').index();
                            var simpleBoard = that.getSimpleBoardWidget(index_tr, index_td);
                            if (!simpleBoard) return;

                            //if (!simpleBoard.ReportSourceId) {
                            //    $.IShowWarn('该单元格还没有绑定数据源！');
                            //    return;
                            //}
                            //if (simpleBoard.Columns.length == 0) return;
                            simpleBoard.Columns = [];
                            simpleBoard.ReportSourceId = "";
                            simpleBoard.SchemaCode = "";
                            simpleBoard.ReportSourceAssociations = [];
                            simpleBoard.FunctionColumns = [];
                            simpleBoard.init(that.ObjectId);
                            $.ReportDesigner.FloatPanel.hide();
                        });
                        //删除本行
                        $('div.simpleboard-column-remove').find('li.row-remove').unbind("click").bind('click', function () {
                            //界面操作
                            var trs = $table.find('tr');
                            var id = $($.ReportDesigner.FloatPanel.opt.baseDom).closest('tr').attr('id');
                            var index = -1;
                            for (var i = 0; i < trs.length; i++) {
                                if ($(trs[i]).attr('id') == id) {
                                    index = i;
                                    break;
                                }
                            }
                            if (index >= 0) {
                                $($.ReportDesigner.FloatPanel.opt.baseDom).closest('tr').remove();
                                that.SimpleBoardRowNumber -= 1;
                                for (var i = that.ReportWidgetSimpleBoard.length - 1; i >= 0; i--) {
                                    if (that.ReportWidgetSimpleBoard[i].RowIndex == index) {
                                        that.ReportWidgetSimpleBoard.splice(i, 1);
                                    } else if (that.ReportWidgetSimpleBoard[i].RowIndex > index) {
                                        that.ReportWidgetSimpleBoard[i].RowIndex -= 1;
                                    }
                                }
                            }
                            $.ReportDesigner.FloatPanel.hide();
                            $table.find('tr:eq(0)').find('td:eq(0)').click();
                        });
                        //删除本列
                        $('div.simpleboard-column-remove').find('li.col-remove').unbind("click").bind('click', function () {
                            var index_col = $($.ReportDesigner.FloatPanel.opt.baseDom).closest('td').index();
                            var $table = $($.ReportDesigner.FloatPanel.opt.baseDom).closest('table');
                            that.SimpleBoardColumnNumber -= 1;
                            for (var i = 0, len = that.SimpleBoardRowNumber; i < len; i++) {
                                var $tr = $table.find('tr:eq(' + i + ')');
                                $tr.find('td:eq(' + index_col + ')').remove();
                            }
                            for (var i = that.ReportWidgetSimpleBoard.length - 1; i >= 0; i--) {
                                if (that.ReportWidgetSimpleBoard[i].ColumnIndex == index_col) {
                                    that.ReportWidgetSimpleBoard.splice(i, 1);
                                } else if (that.ReportWidgetSimpleBoard[i].ColumnIndex > index_col) {
                                    that.ReportWidgetSimpleBoard[i].ColumnIndex -= 1;
                                }
                            }
                            $table.find('tr:eq(0)').find('td:eq(0)').click();
                            $.ReportDesigner.FloatPanel.hide();
                        });
                    }
                });
                $.ReportDesigner.FloatPanel.show();
                $.ReportDesigner.FloatPanels.push($.ReportDesigner.FloatPanel);
            })
        });

        if (this.ReportWidgetSimpleBoard && this.ReportWidgetSimpleBoard.length > 0) {
            //开始初始化
            for (var i = 0, len = this.ReportWidgetSimpleBoard.length; i < len; i++) {
                var simpleBoard = this.ReportWidgetSimpleBoard[i];
                simpleBoard.__proto__ = ReportWidgetSimpleBoard.prototype;
                simpleBoard.init(that.ObjectId);
            }
        }

        //绑定事件
        $('table.table-simpleboard').find('td').each(function () {
            $(this).unbind("mouseenter").bind("mouseenter", function () {
                //$(this).unbind("click").bind("click", function () {
                $.ReportDesigner.ControlElementSelected($(this).closest('li.widget'));
                $('table.table-simpleboard').find('td').css('border', '1px solid silver');
                $(this).css('border', '2px dashed silver');
                $('table.table-simpleboard').find('td').find('div.column-tools').hide();
                $(this).find('div.column-tools').show();
                //初始化一个简易看板字段
                var $row_index = $(this).parent('tr').index();
                var $col_index = $(this).index();
                //var index = $row_index * that.SimpleBoardRowNumber + $col_index;
                debugger
                var simpleBoard = that.getSimpleBoardWidget($row_index, $col_index);
                if (simpleBoard) {
                    if (!$.ReportDesigner.CurrentSimpleBoard || $.ReportDesigner.CurrentSimpleBoard.ObjectId != simpleBoard.ObjectId) {
                        $.ReportDesigner.CurrentSimpleBoard = simpleBoard;
                    } else {
                        return;
                    }
                    $.ReportDesigner.CurrentSimpleBoard.__proto__ = ReportWidgetSimpleBoard.prototype;
                    $.ReportDesigner.CurrentSimpleBoard.init(that.ObjectId);
                } else {
                    var guid = $.IGuid();
                    var simpleBoard = new ReportWidgetSimpleBoard({
                        ObjectId: guid,
                        Code: guid,
                        RowIndex: $row_index,
                        ColumnIndex: $col_index
                    });
                    if (!that.ReportWidgetSimpleBoard) {
                        that.ReportWidgetSimpleBoard = [];
                    }
                    that.ReportWidgetSimpleBoard.push(simpleBoard);
                    $.ReportDesigner.CurrentSimpleBoard = simpleBoard;
                    simpleBoard.init(that.ObjectId);
                }
            });
        });
    }
};
ReportWidget.prototype.getDesignValue = function (WidgetType) {
    debugger
    var that = this;
    var objid = this.ObjectID == undefined ? this.ObjectId : this.ObjectID;
    var param = { 'ReportPage': JSON.stringify($.ReportDesigner.ReportPage), 'ObjectId': objid };
    var res = null, actionName = null;
    if (WidgetType == _DefaultOptions.WidgetType.Bar ||
        WidgetType == _DefaultOptions.WidgetType.Line ||
        WidgetType == _DefaultOptions.WidgetType.Pie ||
        WidgetType == _DefaultOptions.WidgetType.Funnel ||
        WidgetType == _DefaultOptions.WidgetType.Radar) {
        actionName = "LoadChartsData";
    } else if (WidgetType == _DefaultOptions.WidgetType.Detail) {
        actionName = "LoadDesignGridData";
    }
    $.ajax({
        type: "POST",
        url: window._PORTALROOT_GLOBAL + "/Reporting/" + actionName,
        async: false,
        data: $.extend({ Command: actionName }, param),
        dataType: "json",
        success: function (data) {
            debugger 
            if (data.State) {
                if (WidgetType == _DefaultOptions.WidgetType.Bar ||
                    WidgetType == _DefaultOptions.WidgetType.Line ||
                    WidgetType == _DefaultOptions.WidgetType.Pie ||
                    WidgetType == _DefaultOptions.WidgetType.Funnel ||
                    WidgetType == _DefaultOptions.WidgetType.Radar) {
                    //小数位数不足不补0
                    for (var i = 0; i < data.MyChartsDataResult.Series.length; i++) {
                        var precision = data.MyChartsDataResult.Series[i].Precision;
                        if (precision != 0) {
                            for (var j = 0; j < data.MyChartsDataResult.Series[i].Data.length; j++) {
                                var str = data.MyChartsDataResult.Series[i].Data[j].toString();
                               var index = str.indexOf('.');
                               if (index<0) {
                                   index = str.length;
                                   str += '.';
                               }
                               while (str.length <= index + precision) {
                                   str += '0';
                               }
                                data.MyChartsDataResult.Series[i].Data[j] = str;
                            }
                            
                        }
                    }
                    res = {
                        Series: data.MyChartsDataResult.Series,
                        Categories: data.MyChartsDataResult.Categories,
                    }
                    return res;
                    if (that.Columns.length > 0) {

                        var fields = [];
                        for (var i = 0, len = that.Columns.length; i < len; i++) {
                            var column = that.Columns[i];
                            fields.push({ 'Code': column.ColumnCode, 'DisplayName': column.DisplayName });
                        }
                        res["Fields"] = fields;
                    }
                } else if (WidgetType == _DefaultOptions.WidgetType.Detail) {
                    //res = data.SourceData;
                    var columns = [], rows = [];
                    for (var i = 0, len = that.Columns.length; i < len; i++) {
                        var column = that.Columns[i];
                        columns.push({
                            field: column.ColumnCode,
                            title: column.DisplayName,
                            formatter: function (value, row, index) {
                                if (value)
                                    return value;
                                else
                                    return "-";
                            }
                        });
                    }
                    for (var i = 0, len = data.rows.length; i < len; i++) {
                        var tmp = {};
                        for (var j = 0, len2 = columns.length; j < len2; j++) {
                            var row = data.rows[i];
                            var col = columns[j];
                            tmp[col.field] = row[col.field];
                        }
                        rows.push(tmp);
                    }
                    res = { datas: rows, columns: columns };
                }

            }
        }
    });
    return res;
};
ReportWidget.prototype.showColumnEditPanel = function (columnCode, target, baseDom) {
    var that = this;
    //调用另外一个浮动框
    $.ReportDesigner.ColumnEditPanel = $(target).FloatBox({
        'offsetHeight': 6,
        'height': 250,
        'width': 250,
        'base_x': 'innerright',
        'base_y': 'bottom',
        //'baseDom': $(target).closest('div.float-panel').get(0),
        'baseDom': baseDom,
        'target': $('div#float-panel-field-eidt'),
        'documentClickVisible': true,
        'topbox':true,
        'shownCallback': function () {
            var $div_displayname = $('div.displayname');
            debugger
            var $div_functiontypeofnum = $('div.functiontypeofnum');
            var $div_functiontypeofdate = $('div.functiontypeofdate');
            var $div_formula = $('div.formula');
            var $div_formattype = $('div.formattype');
            var $div_customformat = $('div.customformat');
            var $div_dateformat = $('div.dateformat');
            var $div_numberformat = $('div.numberformat');
            var isCategoriesOrSeries = false;
            if (that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                $div_displayname.find("input").attr("maxlength", SimpleBoardFiledLimitLength);
            }
            else
            {
                $div_displayname.find("input").attr("maxlength", FiledLimitLength);
            }
            $("#myfieldbutton").find(".btn_ok").unbind("click").bind("click", function () {
                //简易看板的显示名称不能为空
                if (that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                    if (!$div_displayname.find("input").val()) {
                        $.IShowWarn("显示名称不能为空");
                        return;
                    }
                }
                $.ReportDesigner.ColumnEditPanel.hide();
                event.preventDefault();
                event.stopPropagation();
            });
            $("#myfieldbutton").find(".btn_cancel").unbind("click").bind("click", function () {
                debugger
                $.ReportDesigner.ColumnEditPanel.onlyhide();
                event.preventDefault();
                event.stopPropagation();

            });

            //获取当前编辑的字段
            var column = null;
            for (var i = 0, len = that.Columns.length; i < len; i++) {
                if (that.Columns[i].ColumnCode == columnCode) {
                    column = that.Columns[i];
                    break;
                }
            }
            if (!column) {
                for (var i = 0, len = that.Categories.length; i < len; i++) {
                    if (that.Categories[i].ColumnCode == columnCode) {
                        column = that.Categories[i];
                        isCategoriesOrSeries = true;
                        break;
                    }
                }
            }
            if (!column) {
                for (var i = 0, len = that.Series.length; i < len; i++) {
                    if (that.Series[i].ColumnCode == columnCode) {
                        column = that.Series[i];
                        isCategoriesOrSeries = true;
                        break;
                    }
                }
            }
            if (!column) {
                var simpleBoradId = $(target).closest('td').attr('data-simpleboardid');
                for (var i = 0, len = that.ReportWidgetSimpleBoard.length; i < len; i++) {
                    var simpleBoard = that.ReportWidgetSimpleBoard[i];
                    var simpleBoardID = simpleBoard.ObjectId == undefined ? simpleBoard.ObjectID : simpleBoard.ObjectId;
                    if (simpleBoardID == simpleBoradId && simpleBoard.Columns.length > 0 && simpleBoard.Columns[0].ColumnCode == columnCode) {
                        column = simpleBoard.Columns[0];
                        break;
                    }
                }
            }
            if (!column) {
                $('div#float-panel-field-eidt').children('div').hide();
                $('div#float-panel-field-eidt').append('<span>获取字段失败！</span>');
            }
            that.EditingColumn = column;
            if (column.ColumnCode == "DefaultCountCode") {
                column.FunctionType = _DefaultOptions.Function.Count;
            }
            //开始赋值
            $div_displayname.find('input').val(column.DisplayName);
            if (column.ColumnType == _DefaultOptions.ColumnType.String ||
                column.ColumnType == _DefaultOptions.ColumnType.SingleParticipant ||
                column.ColumnType == _DefaultOptions.ColumnType.MultiParticipant||
                column.ColumnType == _DefaultOptions.ColumnType.Association) {
                $div_functiontypeofnum.hide();
                $div_functiontypeofdate.hide();
                $div_formula.hide();
                $div_formattype.hide();
                $div_customformat.hide();
                $div_dateformat.hide();
                $div_numberformat.hide();
            } else if (column.ColumnType == _DefaultOptions.ColumnType.Numeric) {
                // if (that.WidgetType == _DefaultOptions.WidgetType.Detail || isCategoriesOrSeries) {
                if (isCategoriesOrSeries) {
                    $div_functiontypeofnum.hide();
                } else {
                    $div_functiontypeofnum.show();
                }
                $div_functiontypeofdate.hide();
                if (column.Formula) {
                    $div_formula.show();
                    $div_formula.find(".myedit").unbind("click").bind("click", function () {
                        that;
                        var source = null;
                        for (var i = 0; $.ReportDesigner.ReportSourceManager.SourceArray && i < $.ReportDesigner.ReportSourceManager.SourceArray.length; i++) {
                            var tempsource = $.ReportDesigner.ReportSourceManager.SourceArray[i];
                            if (tempsource.ObjectId == that.ReportSourceId) {
                                source = tempsource;
                                break;
                            }

                        }
                        if (source) {
                            $.ReportDesigner.ReportSourceManager.View_ShowFormulaEditor(column, source, this)
                        }

                    })
                } else {
                    $div_formula.hide();
                }
                $div_formattype.hide();
                $div_customformat.hide();
                $div_dateformat.hide();
                $div_numberformat.show();
                if (that.WidgetType != _DefaultOptions.WidgetType.Detail &&
                    that.WidgetType != _DefaultOptions.WidgetType.SimpleBoard &&
                    that.WidgetType != _DefaultOptions.WidgetType.Combined) {
                    $div_numberformat.find('input#thoudsandth').prop('checked', false);
                    $div_numberformat.find('input#thoudsandth').parent('div').hide();
                    $div_numberformat.find('input#percentage').prop('checked', false)
                    $div_numberformat.find('input#percentage').parent('div').hide();
                }
                //$div_functiontypeofnum.find('select').val(column.FunctionType);
                $div_functiontypeofnum.find('select').val(column.FunctionType).change();
                $div_numberformat.find('input#digits').hide();
                //赋值
                if (column.Format) {
                    var formats = column.Format.split(';');
                    var thoudsandth = false;
                    var percentage = false;
                    var precision = false;
                    var digitslength = 0;
                    for (var i = 0, len = formats.length; i < len; i++) {
                        var format = formats[i];
                        if (format == ',') {
                            thoudsandth = true
                        } else if (format == '%') {
                            percentage = true;
                        } else if (format.indexOf('.') > -1) {
                            //判断小数位的个数
                            precision = true;
                            var digits = format.substr(format.indexOf('.') + 1);
                            digitslength = digits.length;

                        }
                    }
                    $div_numberformat.find('input#thoudsandth').prop('checked', thoudsandth);
                    $div_numberformat.find('input#percentage').prop('checked', percentage);
                    if (precision) {
                        $div_numberformat.find('input#precision').prop('checked', true);
                        $div_numberformat.find('input#digits').val(digits.length);
                        $div_numberformat.find('input#digits').show();
                    }
                    else {
                        $div_numberformat.find('input#precision').prop('checked', false);
                        $div_numberformat.find('input#digits').hide();
                    }

                }
                else
                {
                    $div_numberformat.find('input#thoudsandth').prop('checked', false);
                    $div_numberformat.find('input#percentage').prop('checked', false);
                    $div_numberformat.find('input#precision').prop('checked', false);
                }
            } else if (column.ColumnType == _DefaultOptions.ColumnType.DateTime) {
                $div_functiontypeofnum.hide();
                if (that.WidgetType == _DefaultOptions.WidgetType.Detail ||that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                    $div_functiontypeofdate.hide();
                } else {
                    $div_functiontypeofdate.show();
                }

                if (column.FunctionType == _DefaultOptions.Function.YY ||
                    column.FunctionType == _DefaultOptions.Function.YYYYMM ||
                    column.FunctionType == _DefaultOptions.Function.YYYYMMDD ||
                    column.FunctionType == _DefaultOptions.Function.JD) {
                    //$div_functiontypeofdate.find('select').val(column.FunctionType);
                    $div_functiontypeofdate.find('select').val(column.FunctionType).change();
                } else {
                    //$div_functiontypeofdate.find('select').val(column.FunctionType == _DefaultOptions.Function.YY);
                    $div_functiontypeofdate.find('select').val(column.FunctionType == _DefaultOptions.Function.YY).change();
                }
                $div_formula.hide();
                $div_formattype.hide();
                $div_customformat.hide();
                if (that.WidgetType == _DefaultOptions.WidgetType.Detail) {
                    $div_dateformat.show();
                } else {
                    $div_dateformat.hide();
                }
                $div_numberformat.hide();

                //$div_dateformat.find('select').val(column.Format);
                $div_dateformat.find('select').val(column.Format).change();
            }
            //绑定小数位数选中事件
            $div_numberformat.find('input#precision').unbind('click').bind('click', function () {
                if (!$(this).is(':checked')) {
                    $div_numberformat.find('input#digits').hide();
                } else {
                    $div_numberformat.find('input#digits').show().val(0);
                }
            });
            $div_numberformat.find('input#thoudsandth').unbind('click').bind('click', function () {
                if ($(this).is(':checked')) {
                    $div_numberformat.find('input#percentage').prop('checked', false);
                }
            });
            //千分位和百分比不能共存
            $div_numberformat.find('input#percentage').unbind('click').bind('click', function () {
                if ($(this).is(':checked')) {
                    $div_numberformat.find('input#thoudsandth').prop('checked', false);
                }
            });
            $('div#float-panel-field-eidt').show();
        },
        'hiddenCallback': function () {
            if (!that.EditingColumn) {
                return;
            }
            $.ReportDesigner.CurrentWidgetDom = $("#" + that.ObjectId);
            $(".h3-body-selected").removeClass("h3-body-selected");
            $.ReportDesigner.CurrentWidgetDom.addClass("h3-body-selected");
            var $div_displayname = $('div.displayname');
            var $div_functiontypeofnum = $('div.functiontypeofnum');
            var $div_functiontypeofdate = $('div.functiontypeofdate');
            var $div_formula = $('div.formula');
            var $div_formattype = $('div.formattype');
            var $div_customformat = $('div.customformat');
            var $div_dateformat = $('div.dateformat');
            var $div_numberformat = $('div.numberformat');
            //取值
            var column = that.EditingColumn;
            column.DisplayName = $div_displayname.find('input').val();
            if (column.ColumnType == _DefaultOptions.ColumnType.DateTime && that.WidgetType != _DefaultOptions.WidgetType.SimpleBoard) {
                column.FunctionType = $div_functiontypeofdate.find('select').val();
                column.Format = $div_dateformat.find('select').val();
            } else if (column.ColumnType == _DefaultOptions.ColumnType.Numeric) {
                column.FunctionType = $div_functiontypeofnum.find('select').val();
                var format = "";
                if ($div_numberformat.find('input#thoudsandth').is(':checked')) {
                    format += ",;";
                }
                if ($div_numberformat.find('input#percentage').is(':checked')) {
                    format += "%;";
                }
                if ($div_numberformat.find('input#precision').is(':checked')) {
                    var tmp = "", digits = $div_numberformat.find('input#digits').val();
                    if (!digits) {
                        digits = 0;
                    }
                    if (digits > 0) {
                        for (var i = 0; i < digits; i++) {
                            tmp += '#';
                        }
                    }
                    format += '#.' + tmp;
                }
                column.Format = format;
            }
            if (that.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                var simpleBoradId = $(target).closest('td').attr('data-simpleboardid');
                var curSimpleBoard = null;
                debugger
                for (var i = 0, len = that.ReportWidgetSimpleBoard.length; i < len; i++) {
                    var obj = that.ReportWidgetSimpleBoard[i].ObjectId == undefined ? that.ReportWidgetSimpleBoard[i].ObjectID : that.ReportWidgetSimpleBoard[i].ObjectId;
                    if (obj == simpleBoradId) {
                        curSimpleBoard = that.ReportWidgetSimpleBoard[i];
                        break;
                    }
                }
                if (curSimpleBoard) {
                    curSimpleBoard.Columns[0] = column;
                    var objid = curSimpleBoard.ObjectId == undefined ? curSimpleBoard.ObjectID : curSimpleBoard.ObjectId;
                    var param = {
                        'ReportPage': JSON.stringify($.ReportDesigner.ReportPage),
                        "WidgetObjectID": that.ObjectId,
                        'ReportWidgetSimpleBoardObjectID': objid,
                        'ColumnCode': column.ColumnCode
                    };
                    curSimpleBoard.PostAction(param);
                }
            } else {

                that.draw($.ReportDesigner.CurrentWidgetDom);
            }
            //判断悬浮框是否存在，如果存在，同步更改显示名称
            if ($('div.float-panel').is(':visible')) {
                //var $lis = $('div.float-panel').find('li[data-code="' + column.ColumnCode + '"]');
                //$($lis).each(function () {
                //    $($(this).children('div')[0]).html(column.DisplayName);
                //});
                $.ReportDesigner.FloatPanels[0].opt.shownCallback();
            }

        }
    });
    $.ReportDesigner.ColumnEditPanel.show();
    $.ReportDesigner.FloatPanels.push($.ReportDesigner.ColumnEditPanel);

};
ReportWidget.prototype.addSortColumnPanel = function (target, baseDom) {
    var that = this;
    //调用另外一个浮动框
    $.ReportDesigner.SortEditPanel = $(target).FloatBox({
        'offsetHeight': 6,
        'height': 250,
        'width': 150,
        'base_x': 'innerright',
        'base_y': 'bottom',
        //'baseDom': $(target).closest('div.float-panel').get(0),
        'baseDom': baseDom,
        'target': $('div#sortcolumns'),
        'shownCallback': function () {
            $('div#sortcolumns').children('ul').empty();
            var columns = [];
            var newColumn = [];
            if (!that.Columns) {
                newColumn = [];
            }
            else
            {
                for (var i = 0; i < that.Columns.length;i++) {
                    if (that.Columns[i].ColumnCode == "DefaultCountCode" || that.Columns[i].ColumnType != _DefaultOptions.ColumnType.Numeric) continue;
                    newColumn.push(that.Columns[i])
                }
            }

            if (!that.Categories) {
                that.Categories = [];
            }
            if (!that.Series) {
                that.Series = [];
            }

            if (that.WidgetType == _DefaultOptions.WidgetType.Detail) {
                //columns = newColumn.concat(that.Categories).concat(that.Series).concat(that.Columns);
                columns = newColumn.concat(that.Categories).concat(that.Series)
            }
            else {
                columns = newColumn.concat(that.Categories).concat(that.Series);
            }
            $(columns).each(function () {
                //判断是否已经是排序字段了
                var column = null;
                var columnCode = this.ColumnCode;
                var $li = $('<li style="padding-left:5px;">').attr('data-code', columnCode);
                if (!that.SortColumns) {
                    $li.append('<input type="checkbox" id="sortietm_' + columnCode + '" />');
                    $li.append('<label style="width:100%" for="sortietm_' + columnCode + '">' + this.DisplayName + '</label>');
                    $('div#sortcolumns').children('ul').append($li);
                } else {
                    column = $(that.SortColumns).filter(function () {
                        return this.ColumnCode == columnCode;
                    });
                    if (!column || column.length == 0) {
                        $li.append('<input type="checkbox"  id="sortietm_' + columnCode + '"/>');
                        $li.append('<label style="width:100%" for="sortietm_' + columnCode + '">' + this.DisplayName + '</label>');
                        $('div#sortcolumns').children('ul').append($li);
                    }
                    //else {
                    //    $li.append('<input type="checkbox"   id="sortietm_' + columnCode + '"  checked />');
                    //    $li.append('<label style="width:100%" for="sortietm_' + columnCode + '">' + this.DisplayName + '</label>');
                    //    $('div#sortcolumns').children('ul').append($li);
                    //}
                }

            });
        },
        'hiddenCallback': function () {
            $.ReportDesigner.CurrentWidgetDom = $("#" + that.ObjectId);
            $(".h3-body-selected").removeClass("h3-body-selected");
            $.ReportDesigner.CurrentWidgetDom.addClass("h3-body-selected");
            var selectedColumns = [];
            var $lis = $('div#sortcolumns').children('ul').children('li');
            $($lis).each(function () {
                if ($(this).children('input').is(':checked')) {
                    selectedColumns.push($(this).attr('data-code'));
                }
            });
            var columns = that.Columns.concat(that.Categories).concat(that.Series);
            $(selectedColumns).each(function () {
                var columnCode = this;
                var column = $(columns).filter(function () {
                    return columnCode == this.ColumnCode;
                });
                if (column != null && column.length > 0) {
                    that.SortColumns.push(column[0]);
                }
            });
            that.draw($.ReportDesigner.CurrentWidgetDom);
            that.dispalySortColumns();
            $.ReportDesigner.FloatPanels[0].opt.shownCallback();
        }

    });
    $.ReportDesigner.SortEditPanel.show();
    $.ReportDesigner.FloatPanels.push($.ReportDesigner.SortEditPanel);
};
ReportWidget.prototype.dispalySortColumns = function () {
    var that = this;
    var $ulSorts = $('ul.sortcolumns');
    $ulSorts.empty();
    for (var i = 0, len = that.SortColumns.length; i < len; i++) {
        var $field = $('<li class="column"></li>').attr('data-code', that.SortColumns[i].ColumnCode);
        //var $handle = $('<span class="handle  fa fa-arrows"></span>');
        //$field.append($handle);
        var $display = $('<div class="column-title handle">').html(that.SortColumns[i].DisplayName);
        $display.mouseover(function () {
            $(this).closest("li").css("border", "1px dashed #ccc").css("cursor", "move");
        });
        $display.mouseout(function () {
            $(this).closest("li").css("border", "");
        });
        var $tool = $('<div style="float:right"></div>');
        var $edit = null;
        if (that.SortColumns[i].Ascending) {
            $edit = $('<span style="margin-right:10px;" class="sort fa fa-sort-alpha-asc"></span>');
        } else {
            $edit = $('<span style="margin-right:10px;" class="sort fa fa-sort-alpha-desc"></span>');
        }
        var $remove = $('<span style="margin-right:10px;" class="fa fa-times"></span>');
        $tool.append($edit);
        $tool.append($remove);
        $field.append($display);
        $field.append($tool);
        $ulSorts.append($field);
    }
    $('div.float-panel').find(".float-panel-body").append($ulSorts);
    //排序
    $ulSorts.find('span.sort').unbind('click').bind('click', function () {
        if ($(this).hasClass('fa-sort-alpha-asc')) {
            $(this).removeClass('fa-sort-alpha-asc').addClass('fa-sort-alpha-desc');
        } else {
            $(this).removeClass('fa-sort-alpha-desc').addClass('fa-sort-alpha-asc');
        }
        var columnCode = $(this).closest('li.column').attr('data-code');
        var column = null;
        column = $(that.SortColumns).filter(function () {
            return this.ColumnCode == columnCode;
        });
        if (column != null && column.length > 0) {
            column = column[0];
            column.Ascending = !column.Ascending;
        }
        that.draw($.ReportDesigner.CurrentWidgetDom);
    });
    $ulSorts.sortable({
        handle: '.handle',
        forcePlaceholderSize: true
    }).bind('sortupdate', function () {
        var tmpColumns = [];
        //console.log('sort updated！');
        var $lis = $ulSorts.children('li');
        $lis.each(function () {
            var columnCode = $(this).attr('data-code');
            var column = null;
            column = $(that.SortColumns).filter(function () {
                return this.ColumnCode == columnCode;
            });
            if (column != null && column.length > 0) {
                tmpColumns.push(column[0]);
            }
        });
        that.SortColumns = tmpColumns;
        that.draw($.ReportDesigner.CurrentWidgetDom);
    });

};
ReportWidget.prototype.getSimpleBoardWidget = function ($row_index, $col_index) {

    if (!this.ReportWidgetSimpleBoard || this.ReportWidgetSimpleBoard.length == 0) {
        return null;
    }
    for (var i = 0, len = this.ReportWidgetSimpleBoard.length ; i < len; i++) {
        var simpleBoard = this.ReportWidgetSimpleBoard[i];
        if (simpleBoard.RowIndex == $row_index && simpleBoard.ColumnIndex == $col_index) {
            return simpleBoard;
        }
    }
    return null;
};
ReportWidget.prototype.IsColumnExist = function (columncode) {
    var column = null;
    column = $(this.Columns).filter(function () {
        return this.ColumnCode == columncode;
    });
    if (!column || column.length == 0) {
        column = $(this.Categories).filter(function () {
            return this.ColumnCode == columncode;
        });
        if (!column || column.length == 0) {
            column = $(this.Series).filter(function () {
                return this.ColumnCode == columncode;
            });
            if (!column || column.length == 0) {
                return false;
            }
            return true;
        } else {
            return true;
        }
    } else {
        return true;
    }
};
ReportWidget.prototype.ClearFloatBox = function () {
    if ($.ReportDesigner.FloatPanels.length > 0) {
        var num = $.ReportDesigner.FloatPanels.length;
        for (var i = num - 1; i >= 0; i--) {
            $.ReportDesigner.FloatPanels[i].hide();
        }
        return;
    }
}
ReportWidget.prototype.EditDefaultData = function () {
    var that = this;
    var datachange = function () {
        var data1 = [];
        var data2 = [];
        var DefaultSeriesData = $("#defaultdata1").val();
        var DefaultCategorysData = $("#defaultdata2").val();
        if (DefaultSeriesData == "" || DefaultCategorysData == "") {
            $.IShowWarn("", "默认数据不能为空");
            return;
        }
        try {
            $("#editdefaultdataresult").empty();
            switch (that.WidgetType) {
                //case _DefaultOptions.WidgetType.Detail:
                //    var table = $('<table class="detail"></table>');
                //    $("#editdefaultdataresult").append(table);
                //    table.bootstrapTable({ data: that.StringToArray(DefaultCategorysData), columns: that.StringToArray(DefaultSeriesData), height: $("#editdefaultdataresult").height() - 40 })
                //    break;
                case _DefaultOptions.WidgetType.Line:
                case _DefaultOptions.WidgetType.Bar:
                case _DefaultOptions.WidgetType.Pie:
                case _DefaultOptions.WidgetType.Area:
                case _DefaultOptions.WidgetType.Funnel:
                case _DefaultOptions.WidgetType.Radar:
                    var chartType = 0;
                    switch (that.WidgetType) {
                        case _DefaultOptions.WidgetType.Line: chartType = 0;
                            break;
                        case _DefaultOptions.WidgetType.Bar: chartType = 1;
                            break;
                        case _DefaultOptions.WidgetType.Pie: chartType = 2;
                            break;
                        case _DefaultOptions.WidgetType.Radar: chartType = 3;
                            break;
                        case _DefaultOptions.WidgetType.Funnel: chartType = 4;
                            break;
                    }
                    $("#editdefaultdataresult").ChartBase({
                        ChartType: chartType,
                        Width: $("#editdefaultdataresult").width(),
                        Height: $("#editdefaultdataresult").height(),
                        BarGap: 5,
                        Series:  that.StringToArray(DefaultSeriesData,false,true),
                        Categories: that.StringToArray(DefaultCategorysData,true,false),
                        ShowSeries: true,
                        ShowDemo:true,
                        setCfg: false,
                    });
                    break;
            }
            that.CheckDefaultSeriesData = true;
        }
        catch (e) {
            that.CheckDefaultSeriesData = false;
            //$.IShowWarn("", e.description);
        }
    }
    var showCallback = function () {
        that.CheckDefaultData1 = true;
        $("#editdefaultdataresult").empty();
        if (that.DefaultSeriesData != void 0 && that.DefaultSeriesData.length != 0 ) {
            $("#defaultdata1").val(that.DefaultSeriesData);
        }
        else {
            $("#defaultdata1").val(that.ArrayToString(ReportDefaultData[that.WidgetType]["Series"]));
        }
        if (that.DefaultCategorysData != void 0 && that.DefaultCategorysData.length != 0 ) {
            $("#defaultdata2").val(that.DefaultCategorysData);
        }
        else {
            $("#defaultdata2").val(that.ArrayToString(ReportDefaultData[that.WidgetType]["Categories"]));
        }
        datachange();
    }
    $("#defaultdata1").unbind("change").bind("change", function () {
        datachange();
    });
    $("#defaultdata2").unbind("change").bind("change", function () {
        datachange();
    });
    var toolButtons = [];
    var reset = {
        "Text": '重置', Theme: 'btn btn-warning btn-custom', 'position': 'left', CallBack: function () {
            $("#defaultdata1").val(that.ArrayToString(ReportDefaultData[that.WidgetType]["Series"]));
            $("#defaultdata2").val(that.ArrayToString(ReportDefaultData[that.WidgetType]["Categories"]));
            datachange();
        }
    };
    var saveaction = {
        "Text": '确定', "Theme": 'btn_ok', CallBack: function () {
            if (!that.CheckDefaultSeriesData) {
                $.IShowWarn("", "错误的数据");
                return;
            }
            that.DefaultSeriesData = $("#defaultdata1").val();
            that.DefaultCategorysData = $("#defaultdata2").val();
            that.draw($.ReportDesigner.CurrentWidgetDom)
            modal.hide();
        }
    };
    var cancelBtn = {
        "Text": '取消', "Theme": 'btn_cancel', CallBack: function () {
            modal.hide();
        }
    };
    toolButtons.push(saveaction);
    toolButtons.push(cancelBtn);
    toolButtons.push(reset);
    
    var displayname =that.DisplayName==""? '设置默认数据源':'设置默认数据源' + "-" + that.DisplayName;
    modal = $.IModal({
        Title: displayname,
        Width: '1100px',
        Height: '480px',
        OnShowCallback: showCallback,
        OnHiddenCallback: null,
        ShowBack: false,
        HasIframe: false,
        ContentUrl: '',
        Content: that.DefaultDataEditContainer,
        ToolButtons: toolButtons
    });
};
ReportWidget.prototype.StringToArray = function (str,iscategories,isseries) {
    if (str == null || str == void 0) {
        return null;
    }
    var array = str.split(';');//设定分割符为“;”
    if (array == void 0) {
        return null;
    }
    var arraynew = [];
    for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var itemnew = JSON.parse(item);
        if (iscategories)
        {
            itemnew = {key:itemnew,value:itemnew}
        }
        if (isseries)
        {
            itemnew = { Name: itemnew["Name"], Code: itemnew["Name"], Data: itemnew["Data"] };
        }
        arraynew.push(itemnew);
    }
    return arraynew;
};
ReportWidget.prototype.ArrayToString = function (array) {
    if(array==void 0||array.length==0)
    {
        return "";
    }
    var result = "";
    var newarray=[]
    for (var i = 0; i < array.length; i++)
    {
        var item = array[i];
        newarray.push(JSON.stringify(item));
    }
    return newarray.join(";");
}
