//不同层级展开折叠的样式
var ExpandCollapseStyle = {
    Expand: 'fa-folder-open-o',
    Collapse: 'fa-folder-o',
    Up: 'fa-caret-down',
    Down: 'fa-caret-right'
}
//点击事件展开的层级
var ExpandLevel = {
    Source: 0,
    Sheet: 1
};

var ReportSourceManager = function (config) {
    this.SourceArray = config.ReportSources || [];
    this.CacheSchemaFieldsObj = [];// 表单字段缓存
    this.CacheSchemaDisplayArray = {};//表单显示名称缓存
    this.EditingSource = null;
    this.IsCreating = false;
    this.TreeContainer = $('div#ReportSourceZone').find('ul.source-collection');
    this.BtnAddSource = $("#btnAddSource");
    this.SchemaSelectPanel = $("#sheetselect");
    this.SqlEditor = $('div#custom_sql');
    this.AssociationSetupPanel = $("#associationpanel");
    this.CheckTrue = false; //用于辅助判断sql语句是否校验成功；
    this.TmpSqlColumns = []; //临时存储sql列，辅助sql语句验证
    this.TempSqlWhereColumns = [];
    this.IsNew = false;
    this.NewColumnIncludeOldColumn = false;//用于判断新sqlcolumn是否包含旧sqlcolumn;
    this.lstDbConnection = $("#lstDbConnection");//引擎连接池编码
    this.lstSheet = $("#lstSheet");//ＳＱＬ类型树形菜单
}

ReportSourceManager.prototype = {
    //初始化操作
    Init: function () {
        var that = this;
        //加载业务表单数据源

        //显示已经存在的数据源
        this.View_BuildSourceTree();
        //绑定事件
        this.BtnAddSource.unbind("click.Sql").bind('click.Sql', function () {
            that.View_ShowSchemaSelecter();
        });
        //默认展开第一个数据源
        $('div.source-title:eq(0)').click();
    },
    //View 操作
    //构建数据源架构
    View_BuildSourceTree: function () {
        var that = this;
        $(that.SourceArray).each(function () {
            that.View_AddNewSource(this, false);
        });

    },
    //添加一个数据源,isManual判断是否手工新增
    View_AddNewSource: function (source, isManual, NewColumnIncludeOldColumn) {
        var that = this;
        var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
        var $li_source = $('<li>').addClass('source').attr('data-sourceid', objid);
        var $p_title = $('<div class="source-title">').data('sourceid', objid);
        var $span_flag = $('<span>').addClass('flag fa');
        if (isManual) {
            $span_flag.addClass(ExpandCollapseStyle.Expand);
        } else {
            $span_flag.addClass(ExpandCollapseStyle.Collapse);
        }
        $p_title.append($span_flag);
        if (!source.DisplayName) {
            $p_title.append('<div class="title">子表</div>');
        } else {
            $p_title.append('<div class="title">' + source.DisplayName + '</div>');
        }
        //添加编辑、删除图标
        $span_edit = $('<span>').addClass('source-menu menu-edit iconReport-edit-outline').css({ 'position': 'absolute', 'top': '0px', 'font-size': '18px', 'color': '#e9bc33', 'right': '30px', 'line-height': '20px' }).hide();
        $span_remove = $('<span>').addClass('source-menu menu-remove iconReport-remove-outline').css({ 'position': 'absolute', 'top': '0px', 'font-size': '18px', 'color': '#cb4c4c', 'right': '10px', 'line-height': '20px' }).hide();
        $p_title.append($span_edit);
        $p_title.append($span_remove);
        $li_source.append($p_title);
        that.TreeContainer.append($li_source);
        //获取表单集合
        if (isManual) {
            that.View_ExpandHandler($li_source, ExpandLevel.Source);

            //报表编辑区失去焦点,如果当前正在编辑的widget数据源为空，不失去焦点
            if ($.ReportDesigner.EditingWidget && $.ReportDesigner.EditingWidget.ReportSourceId) {
                $.ReportDesigner.EditingWidget = null;
                $('li.h3-body-selected').removeClass('h3-body-selected');
            }
            that.View_SetAllSourceEnabled();
        }
        //绑定事件
        that.View_BindSourceEvent($li_source);
    },
    //绑定数据源点击事件
    View_BindSourceEvent: function (contanier) {
        var that = this;

        //绑定数据源的展开、折叠事件
        $(contanier).children('div.source-title').bind('click', function () {
            var sourceid = $(this).data('sourceid');
            that.EditingSource = that.Obj_GetSourceById(sourceid);
            if ($(this).children('span.flag').hasClass(ExpandCollapseStyle.Collapse)) {
                that.View_ExpandHandler($(this).parent('li'), ExpandLevel.Source);
            } else {
                that.View_CollapseHandler($(this).parent('li'), ExpandLevel.Source);
            }
        });
        //hover
        $(contanier).children('div.source-title').hover(function () {
            $(this).find('span.source-menu').show();
        }, function () {
            $(this).find('span.source-menu').hide();
        });
        //删除数据源
        $(contanier).children('div.source-title').find('span.source-menu').each(function () {
            console.log("编辑删除绑定事件");
            $(this).bind('click', function (e) {
                var sourceId = $(this).parent('div').data('sourceid');
                if ($(this).hasClass('menu-remove')) {
                    //提示确认
                    if (confirm('您确认要删除该数据源吗？')) {
                        //删除数据源
                        that.SqlWhereFiltersRemoveSource(sourceId);
                        //删除查询条件
                        that.ReportFiltersRemoveSource(sourceId);
                        that.Obj_RemoveSource(sourceId);
                        that.View_RemoveSource(sourceId);

                    }
                } else {
                    //编辑数据源   
                    console.log("编辑数据源");
                    that.EditingSource = that.Obj_GetSourceById(sourceId);
                    if (that.EditingSource.IsUseSql) {
                        if (that.EditingSource.IsUseSql) {
                            that.editBeforeSource = new Object();
                            that.editBeforeSource.IsUseSql = that.EditingSource.IsUseSql;
                            that.editBeforeSource.SchemaCode = that.EditingSource.SchemaCode;
                            var sqlColumnsArray = new Array();
                            that.editBeforeSource.SqlColumns = sqlColumnsArray;
                            if (that.editBeforeSource.IsUseSql) {
                                for (var i = 0; i < that.EditingSource.SqlColumns.length; i++) {
                                    that.editBeforeSource.SqlColumns[i] = that.EditingSource.SqlColumns[i].ColumnCode;
                                }
                            }
                        }
                        that.View_ShowSqlEditor(that.EditingSource, false);
                    } else {
                        //记录编辑前数据源的相关值，后续saveAction中要使用
                        that.editBeforeSource = new Object();
                        that.editSchemaCode = that.EditingSource.SchemaCode;
                        that.editBeforeSource.SchemaCode = that.EditingSource.SchemaCode;
                        that.editBeforeSource.IsUseSql = that.EditingSource.IsUseSql;
                        if (that.EditingSource.ReportSourceAssociations!=null&&that.EditingSource.ReportSourceAssociations.length > 0) {
                            that.editBeforeSource.ReportSourceAssociations = true;
                            that.editBeforeSource.sourceAssociationSchemaCode = that.EditingSource.ReportSourceAssociations[0].SchemaCode;
                        } else {
                            that.editBeforeSource.ReportSourceAssociations = false;
                        }
                        that.View_ShowSchemaSelecter(that.EditingSource);
                    }
                }
                e.stopPropagation();
            });
        });
    },
    //删除相关的filters
    ReportFiltersRemoveSource: function (sourceId) {
        for (var i = 0; i < this.SourceArray.length; i++) {
            if (this.SourceArray[i].ObjectId == sourceId || this.SourceArray[i].ObjectID == sourceId) {
                if (!this.SourceArray[i].IsUseSql) {
                    //删除主表查询条件
                    for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                        if ("I" + this.SourceArray[i].SchemaCode == $.ReportDesigner.ReportPage.Filters[j].ColumnCode.split("_")[0]) {
                            $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                            $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                            j = j - 1;
                        }
                    }
                    //删除子表查询条件
                    if (this.SourceArray[i].ReportSourceAssociations) {
                        for (var k = 0; k < this.SourceArray[i].ReportSourceAssociations.length; k++) {
                            for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                                if ($.ReportDesigner.ReportPage.Filters[j].ColumnCode.indexOf("I_" + this.SourceArray[i].ReportSourceAssociations[k].SchemaCode.split("___")[1]) != -1) {
                                    $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                                    $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                                    j = j - 1;
                                }
                            }
                        }
                    }
                } else { //删除自定义SQL查询条件
                    for (var k = 0; k < this.SourceArray[i].SqlColumns.length; k++) {
                        for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                            if (this.SourceArray[i].SqlColumns[k].ColumnCode == $.ReportDesigner.ReportPage.Filters[j].ColumnCode) {
                                $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                                $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                                j = j - 1;
                                break;
                            }
                        }
                    }
                }
                break;
            }
        }

        if (!$.ReportDesigner.ReportPage.Filters || $.ReportDesigner.ReportPage.Filters.length == 0)
            $.ReportDesigner.FilterPanel.find(".myhelper").show();
    },
    //删除sqlwherecolumn相关的filters
    SqlWhereFiltersRemoveSource: function (sourceId) {
        //如果是sql数据源，删除对应的，sqlwherecolumns的filter,删除前校验其他reportsource是否有相同编号的sqlwherecolumns;
        for (var i = 0; i < this.SourceArray.length; i++) {
            if ((this.SourceArray[i].ObjectId == sourceId || this.SourceArray[i].ObjectID == sourceId) && this.SourceArray[i].IsUseSql && this.SourceArray[i].SQLWhereColumns && this.SourceArray[i].SQLWhereColumns.length > 0) {
                for (var k = 0; k < this.SourceArray[i].SQLWhereColumns.length; k++) {
                    for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                        if (this.SourceArray[i].SQLWhereColumns[k].ColumnCode == $.ReportDesigner.ReportPage.Filters[j].ColumnCode) {
                            var hasothercolumn = false;
                            for (var l = 0; l < this.SourceArray.length; l++) {
                                if (this.SourceArray[l].ObjectId == sourceId || !this.SourceArray[l].IsUseSql || !this.SourceArray[l].SQLWhereColumns || this.SourceArray[l].SQLWhereColumns.length == 0) {
                                    continue;
                                }
                                for (var x = 0; x < this.SourceArray[l].SQLWhereColumns.length; x++) {
                                    if (this.SourceArray[l].SQLWhereColumns[x] == $.ReportDesigner.ReportPage.Filters[j].ColumnCode) {
                                        hasothercolumn = true;
                                        break;
                                    }
                                }
                            }
                            if (!hasothercolumn) {
                                //这里为了速度，没有考虑非sql数据源情况的columns
                                $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                                $.ReportDesigner.ReportPage.Filters.splice(j, 1);

                            }
                        }
                    }
                }
            }
        }

        if (!$.ReportDesigner.ReportPage.Filters || $.ReportDesigner.ReportPage.Filters.length == 0)
            $.ReportDesigner.FilterPanel.find(".myhelper").show();
        //end如果是sql数据源，删除对应的，sqlwherecolumns的filter,删除前校验其他reportsource是否有相同编号的sqlwherecolumns;
    },
    //绑定表单点击事件
    View_BindSheetEvent: function (container) {
        var that = this;
        //绑定表单的展开、折叠事件
        $(container).children('div.sheet-title').bind('click', function () {
            var sourceid = $(this).data('sourceid');
            if (sourceid == undefined) {
                sourceid = $(this).parent('li').parent().parent().data('sourceid');
            }
            that.EditingSource = that.Obj_GetSourceById(sourceid);
            if ($(this).children('span.flag').hasClass(ExpandCollapseStyle.Down)) {
                that.View_ExpandHandler($(this).parent('li'), ExpandLevel.Sheet);
            } else {
                that.View_CollapseHandler($(this).parent('li'), ExpandLevel.Sheet);
            }
        });

        //绑定表单的编辑、删除显示
        $(container).children('div.sheet-title').hover(function () {
            if ($(this).parent('li.sheet').hasClass('association')) {
                $(this).find('span.sheet-menu').show();
            } else {
                $(this).find('span.sheet-menu').hide();
            }
        }, function () {
            $(this).find('span.sheet-menu').hide();
        });
        $(container).children('div.sheet-title').find('span.sheet-menu').each(function () {
            $(this).bind('click', function (e) {
                var schemaCode = $(this).closest('li.sheet').attr('data-schemacode');
                if ($(this).hasClass('iconReport-remove-outline')) {
                    that.Obj_RemoveAssociation(schemaCode);


                } else {
                    var displayname = $(this).closest('li.sheet').attr('data-name');
                    that.View_ShowAssociationEditor(schemaCode, displayname, schemaCode);
                }
                e.stopPropagation();
            })
        });

    },
    //绑定新增函数字段点击事件
    View_BindAddFunctionFieldEvent: function (container, source) {
        var that = this;
        //绑定折叠展开
        $(container).children('div').click(function () {
            if ($(this).children('span.flag').hasClass(ExpandCollapseStyle.Down)) {
                $(this).next('ul').show();
                if ($(this).next('ul').children('li').length == 0) {
                    if (!source.FunctionColumns) {
                        source.FunctionColumns = [];
                    }
                    for (var i = 0, len = source.FunctionColumns.length; i < len; i++) {
                        source.FunctionColumns[i].ColumnType = _DefaultOptions.ColumnType.Numeric;
                        that.View_AddFunctionColumn(source, source.FunctionColumns[i]);
                    }
                }
                $(this).children('span.flag').removeClass(ExpandCollapseStyle.Down).addClass(ExpandCollapseStyle.Up);
            } else {
                $(this).next('ul').hide();
                $(this).children('span.flag').removeClass(ExpandCollapseStyle.Up).addClass(ExpandCollapseStyle.Down);
            }
        });
        //绑定函数计算字段新增
        $(container).children('div').children('span.new').unbind('click').bind('click', function (e) {
            that.EditingSource = that.Obj_GetSourceById($(this).closest('li').data('sourceid'));
            that.View_ShowFormulaEditor(null, that.EditingSource, this);
            e.stopPropagation();
        });

    },
    //绑定新增关联关系事件
    View_BindAddRelationEvent: function (container) {
        //var that = this;
        ////绑定新增关联关系
        //$(container).children('span').bind('click', function () {
        //    that.EditingSource = that.Obj_GetSourceById($(this).parent('li').data('sourceid'));
        //    that.View_ShowAssociationEditor();
        //});
    },
    //展开事件
    View_ExpandHandler: function ($el, expandLevel) {
        var that = this;
        if ($($el).closest('li.source').hasClass('disabled')) {
            return;
        }
        var $ul = $el.children('ul');
        if ($ul.length > 0) {
            if (expandLevel == ExpandLevel.Source) {
                var sheettitle = $ul.find("li:first").children('div.sheet-title').eq(0);
                if (sheettitle.find(".flag ").hasClass("fa-caret-right")) {
                    sheettitle.click();
                }
            }
            $ul.show()
            ;
        } else {
            if (expandLevel == ExpandLevel.Source) {
                if (that.EditingSource.IsUseSql) {
                    that.View_ExpandSqlSource(that.EditingSource, $el);
                } else {
                    that.View_ExpandSource(that.EditingSource, $el);
                }
            } else if (expandLevel == ExpandLevel.Sheet) {
                if (that.EditingSource.IsUseSql) {
                    that.View_ExpandSqlSheet(that.EditingSource, $el);
                } else {
                    var schemaCode = $el.attr('data-schemacode');
                    var displayName = $el.attr('data-name');
                    that.View_ExpandSheet($el, schemaCode, displayName);
                }

            }
        }
        if (expandLevel == ExpandLevel.Source) {
            $el.children('div.source-title').children('span.flag').removeClass(ExpandCollapseStyle.Collapse).addClass(ExpandCollapseStyle.Expand);
        } else {
            $el.children('div.sheet-title').children('span.flag').removeClass(ExpandCollapseStyle.Down).addClass(ExpandCollapseStyle.Up);
        }
    },
    //折叠事件
    View_CollapseHandler: function ($el, expandLevel) {
        $el.children('ul').hide();
        if (expandLevel == ExpandLevel.Source) {
            $el.children('div.source-title').children('span.flag').removeClass(ExpandCollapseStyle.Expand).addClass(ExpandCollapseStyle.Collapse);
        } else {
            $el.children('div.sheet-title').children('span.flag').removeClass(ExpandCollapseStyle.Up).addClass(ExpandCollapseStyle.Down);
        }
    },
    //数据源展开事件
    View_ExpandSource: function (source, $li_source) {
        var that = this;

        //判断是sql还是系统表单
        if (source.IsUseSql) {
            that.View_ExpandSqlSource(source, $li_source);
        } else {
            //获取表单集合
            var $ul = $('<ul>');
            $li_source.append($ul);
            //绑定新增关联关系
            // var $li_addRelation = $('<li>').addClass('add-relation').data('sourceid', source.ObjectID).html('新增关联表单').append('<span style="cursor:pointer;" class="new iconReport-new">');
            //绑定计算字段
            var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
            var $li_function = $('<li>').addClass('functionfield-collection').data('sourceid', objid);
            $fc_div = $('<div class="sheet-title">');
            $flag = $('<span style="font-size:18px;color:#4b9aee; cursor: pointer;">').addClass('flag fa ').addClass(ExpandCollapseStyle.Down);
            $fc_div.append($flag);
            $fc_div_title = $('<div class="title">计算字段</div>');
            $fc_div.append($fc_div_title);
            $fc_span_edit = $('<span  class="new iconReport-new">');
            $fc_div.append($fc_span_edit);
            $li_function.append($fc_div);
            var $ul_functionfields = $('<ul>');
            $li_function.append($ul_functionfields);
            $ul.append($li_function);
            // $ul.append($li_addRelation);
            that.View_BindAddFunctionFieldEvent($li_function, source);
            //that.View_BindAddRelationEvent($li_addRelation);
            that.View_RenderSheetArray(source, $ul);
        }
    },
    //展开sql数据源
    View_ExpandSqlSource: function (source, $li_source) {
        var that = this;
        var $sqlul = $('<ul>');
        $li_source.append($sqlul);
        var $li = $('<li>').addClass('sheet').attr('data-name', 'SQL数据源').attr('data-schemacode', 'SQL');
        var $p_sheet = $('<div class="sheet-title">').data('sourceid', source.ObjectID).data('schemacode', 'SQL');
        var $span_direction = $('<span>').addClass('flag fa').addClass(ExpandCollapseStyle.Down);
        $p_sheet.append($span_direction);
        $p_sheet.append('<div class="title"> SQL数据源</span>');
        $li.append($p_sheet);
        $sqlul.append($li);
        that.View_BindSheetEvent($li);
    },
    //表单展开事件
    View_ExpandSheet: function ($el, schemaCode, displayName) {
        var that = this;
        that.Tool_GetSchemaFields(schemaCode, function (columns) {
            var $sheetul = $('<ul class="fields">');
            $el.append($sheetul);
            var isManualSheet = false, subField = null;
            //判断是否手动添加的关联关系表单
            if (that.EditingSource.ReportSourceAssociations) {
                var asso = $(that.EditingSource.ReportSourceAssociations).filter(function () {
                    return this.SchemaCode == schemaCode && this.AssociationMethod == _DefaultOptions.AssociationMethod.Manual;
                });
                if (asso && asso.length > 0) {
                    isManualSheet = true;
                    subField = asso[0].SubField;
                }
            }

            if (columns != null && columns.length > 0) {
                for (var i = 0, len = columns.length; i < len; i++) {
                    var thisColumn = columns[i].ReportWidgetColumn;
                    var thisColumnSummary = columns[i];
                    if (!isManualSheet) {
                        if (thisColumn.ColumnCode == "I" + schemaCode + "_ObjectID" ||
                        thisColumn.ColumnCode == "I" + schemaCode + "_Name" ||
                        thisColumn.ColumnCode == "I" + schemaCode + "_ModifiedBy" ||
                        thisColumn.ColumnCode == "I" + schemaCode + "_ModifiedTime" ||
                        thisColumn.ColumnCode == "I" + schemaCode + "_WorkflowInstanceId") { continue; }
                    }
                    var $field = $('<li class="field"></li>');

                    $field.attr('data-code', thisColumn.ColumnCode);
                    $field.attr('data-name', thisColumn.ColumnName);
                    $field.attr('data-displayname', thisColumn.DisplayName);
                    $field.attr('data-datatype', thisColumn.ColumnType);
                    if (thisColumn.AssociationSchemaCode) {
                        $field.attr('data-associationschemaCode', thisColumn.AssociationSchemaCode);
                    }
                    if (thisColumnSummary.OptionalValues) {
                        $field.attr('data-optionalvalues', thisColumnSummary.OptionalValues);
                    }
                    if (thisColumnSummary.DataDictItemName) {
                        $field.attr('data-datadictitemname', thisColumnSummary.DataDictItemName);
                    }
                    $field.html(thisColumn.DisplayName);
                    $sheetul.append($field);
                }
                //添加计数字段
                var $field = $('<li class="field"></li>');
                $field.attr('data-code', 'DefaultCountCode');
                $field.attr('data-name', 'DefaultCountCode');
                $field.attr('data-displayname', '计数');
                $field.attr('data-datatype', _DefaultOptions.ColumnType.Numeric);
                $field.html('计数');
                $sheetul.append($field);

            }
            //绑定拖曳事件
            $sheetul.find('li.field').each(function () {
                $(this).SimpleDrag();
            });
        });
    },
    //sql数据源表单展开
    View_ExpandSqlSheet: function (source, $li_sheet) {
        var that = this;
        if (source.SqlColumns && source.SqlColumns.length > 0) {
            that.View_BuildSqlSheetStructure(source.SqlColumns, $li_sheet);
        } else {
            that.Tool_GetSqlSchemaFileds(source.CommandText, function (data) {
                source.SqlColumns = data.result;
                that.View_BuildSqlSheetStructure(source.SqlColumns, $li_sheet);
            });
        }

    },
    //sql数据源构建
    View_BuildSqlSheetStructure: function (SqlColumns, parent) {
        var that = this;
        var $fieldul = $('<ul class="fields"></ul>');
        for (var i = 0, len = SqlColumns.length; i < len; i++) {
            var $field = $('<li class="field"></li>');
            var column = SqlColumns[i];
            $field.attr('data-code', column.ColumnCode);
            $field.attr('data-name', column.ColumnName);
            $field.attr('data-datatype', column.ColumnType);
            $field.attr('data-displayname', column.DisplayName);
            $field.html(column.DisplayName);
            $fieldul.append($field);
        }
        //添加计数字段
        var $field = $('<li class="field"></li>');
        $field.attr('data-code', 'DefaultCountCode');
        $field.attr('data-name', 'DefaultCountCode');
        $field.attr('data-datatype', _DefaultOptions.ColumnType.Numeric);
        $field.attr('data-displayname', "计数");
        $field.html('计数');
        $fieldul.append($field);
        parent.append($fieldul);
        //绑定拖曳事件
        $fieldul.find('li.field').each(function () {
            $(this).SimpleDrag();
        });
    },
    //删除一个数据源
    View_RemoveSource: function (sourceId) {
        this.TreeContainer.find('li[data-sourceid="' + sourceId + '"]').remove();
        if ($.ReportDesigner.CurrentWidgetDom != null) {
            $.ReportDesigner.CurrentWidgetDom.click();
        }

    },
    //删除一个表单
    View_RemoveSheet: function (sourceId, schemaCode) {
        this.TreeContainer.find('li[data-sourceid="' + sourceId + '"]').find('li.sheet[data-schemacode="' + schemaCode + '"]').remove();
    },
    //更新数据源选择的表单
    View_UpdateSource: function (source, NewColumnIncludeOldColumn) {
        if (source.IsUseSql) {
            var that = this;
            var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
            $('li.source[data-sourceid="' + objid + '"]').remove();
            //var $ul = $('li.source[data-sourceid="' + source.ObjectId + '"]').children('ul');
            that.Obj_RemoveSource(objid, NewColumnIncludeOldColumn, source);
            if (!NewColumnIncludeOldColumn) {
                that.Obj_AddNewSource(source);
                that.View_AddNewSource(source, true);
            }
            else {
                that.View_AddNewSource(source, true);
            }
        }
        else {
            var that = this;
            var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
            var $ul = $('li.source[data-sourceid="' + objid + '"]').children('ul');
            $ul.find('li.sheet').remove();
            //更新数据源名称
            $('li.source[data-sourceid="' + objid + '"]').children('div.source-title').children('div.title').html(source.DisplayName);
            that.View_RenderSheetArray(source, $ul);
        }
    },
    //渲染已选择的数据源表单
    View_RenderSheetArray: function (source, $el) {
        var that = this;
        var sheetArray = that.Obj_GetSchemaArray(source);
        that.Tool_GetSchemaNames(sheetArray, function (res) {
            var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
            that.CacheSchemaDisplayArray[objid] = res;
            //绑定表单
            for (var i = res.length - 1; i >= 0; i--) {
                var $li = $('<li>').addClass('sheet').attr('data-name', res[i].DisplayName).attr('data-schemacode', res[i].SchemaCode);

                //需要判断哪些是手动添加的关联关系表单

                var $p_sheet = $('<div class="sheet-title">').data('sourceid', objid).data('schemacode', res[i].SchemaCode);
                var $span_direction = $('<span>').addClass('flag fa').addClass(ExpandCollapseStyle.Down);
                $p_sheet.append($span_direction);
                if (that.Tool_IsManualAssociationSheet(that.EditingSource.ReportSourceAssociations, res[i].SchemaCode)) {
                    $li.addClass('association');
                    var $span_asso = $('<span class="sheet-association fa fa-chain" style="margin-left:5px;font-size:8px;"></span>');
                    $p_sheet.append($span_asso);
                }

                if (res[i].DisplayName) {
                    $p_sheet.append('<div class="title">' + res[i].DisplayName + '</span>');
                } else {
                    $p_sheet.append('<div class="title">子表</span>');
                }
                //添加编辑事件（手动添加的关联表单可以有编辑和删除按钮，其他隐藏）
                $span_edit = $('<span>').addClass('sheet-menu menu-edit iconReport-edit-outline').css({ 'position': 'absolute', 'top': '0px', 'font-size': '16px', 'color': '#e9bc33', 'right': '30px', 'line-height': '20px' }).hide();
                $span_remove = $('<span>').addClass('sheet-menu menu-remove iconReport-remove-outline').css({ 'position': 'absolute', 'top': '0px', 'font-size': '16px', 'color': '#cb4c4c', 'right': '10px', 'line-height': '20px' }).hide();
                $p_sheet.append($span_edit);
                $p_sheet.append($span_remove);
                $li.append($p_sheet);
                $el.prepend($li);
                //绑定事件
                that.View_BindSheetEvent($li);
            }
            $el.find("li:first").children('div.sheet-title').eq(0).click();
        });
    },
    //添加函数计算字段
    View_AddFunctionColumn: function (source, column) {
        var that = this;
        var $li = $('<li>').addClass('fc field').attr('data-code', column.ColumnCode).attr('data-name', column.ColumnCode)
            .attr('data-displayname', column.DisplayName).attr('data-formula', column.Formula).attr('data-datatype', column.ColumnType);
        var $columnName = $('<div>').html(column.DisplayName);
        //var $col_edit = $('<span>').addClass('iconReport-edit-outline').css({ 'float': 'right', 'color': '#4b9aee','margin-right':'10px' });
        var $div_fc = $('<div class="fc-title">');
        $div_fc.append('<div class="title">' + column.DisplayName + '</span>');
        var $span_edit = $('<span readonly="readonly">').addClass('fc-edit iconReport-edit-outline');
        var $span_remove = $('<span readonly="readonly">').addClass('fc-remove iconReport-remove-outline');
        $div_fc.append($span_edit);
        $div_fc.append($span_remove);
        $li.append($div_fc);
        var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
        var $parent = $('li.source[data-sourceid="' + objid + '"]').find('li.functionfield-collection');
        $parent.children('ul').append($li).show();
        $parent.children('div').children('span.flag').removeClass(ExpandCollapseStyle.Down).addClass(ExpandCollapseStyle.Up);
        $span_edit.bind('click', function () {
            var columnCode = $(this).closest('li.fc').attr('data-code');
            var column = null;
            column = $(source.FunctionColumns).filter(function () {
                return this.ColumnCode == columnCode
            });
            if (column) {
                that.View_ShowFormulaEditor(column[0], source, this);
            }
        });
        $span_remove.bind('click', function () {
            var $column = $(this).closest('li.fc');
            that.Obj_RemoveFunctionColumn(source, $column.attr('data-code'));
            $column.remove();
        });
        $li.SimpleDrag();

    },
    //更新计算字段
    View_UpdateFunctionColumn: function (source, column) {
        var that = this;
        $('li.source[data-sourceid="' + (source.ObjectId || source.ObjectID) + '"]').find('li.fc[data-code="' + column.ColumnCode + '"]').attr("data-displayname", column.DisplayName).attr("data-formula", column.Formula).find('div.title').html(column.DisplayName);

        //计算字段更新算法后同步刷新右侧报表的计算字段的值
        for (var i = 0; i < $.ReportDesigner.ReportPage.ReportWidgets.length; i++) {
            var ReportWidgetTemp = $.ReportDesigner.ReportPage.ReportWidgets[i];
            var widgettype = ReportWidgetTemp.WidgetType;
            //重置新的计算字段算法
            for (var j = 0; j < ReportWidgetTemp.Columns.length; j++) {
                if (ReportWidgetTemp.Columns[j].ColumnCode == column.ColumnCode && ReportWidgetTemp.Columns[j].Formula != "") {
                    ReportWidgetTemp.Columns[j].Formula = column.Formula;
                    ReportWidgetTemp.Columns[j].DisplayName = column.DisplayName;
                }
                if (ReportWidgetTemp.Series[j] != null  && ReportWidgetTemp.Series[j].ColumnCode == column.ColumnCode && ReportWidgetTemp.Series[j].Formula != "") {
                    ReportWidgetTemp.Series[j].Formula = column.Formula;
                    ReportWidgetTemp.Series[j].DisplayName = column.DisplayName;
                }
                if (ReportWidgetTemp.Categories[j] != null  && ReportWidgetTemp.Categories[j].ColumnCode == column.ColumnCode && ReportWidgetTemp.Categories[j].Formula != "") {
                    ReportWidgetTemp.Categories[j].Formula = column.Formula;
                    ReportWidgetTemp.Categories[j].DisplayName = column.DisplayName;
                }
            }
            if (widgettype == _DefaultOptions.WidgetType.Detail) {
                //获取更新后的数据
                var resDetail = ReportWidgetTemp.getDesignValue(widgettype);
                $.ReportDesigner.ReportDetailManagers[ReportWidgetTemp.Code].ReportWidget = ReportWidgetTemp;
                var opt = {};
                if (resDetail) {
                    opt.data = resDetail.datas;
                    opt.columns = resDetail.columns;
                    opt.reportWidget = ReportWidgetTemp;
                }
                //重绘明细表
                var reportDetail = new ReportDetail(opt, $.ReportDesigner.ReportDetailManagers[ReportWidgetTemp.Code].Container);
                $.ReportDesigner.ReportDetailManagers[ReportWidgetTemp.Code] = reportDetail;
            }
            else if (widgettype == _DefaultOptions.WidgetType.Bar ||
                widgettype == _DefaultOptions.WidgetType.Line ||
                widgettype == _DefaultOptions.WidgetType.Pie ||
                widgettype == _DefaultOptions.WidgetType.Funnel ||
                widgettype == _DefaultOptions.WidgetType.Radar) {
                var reprotCurrentWidgetDom = $('ul#widget_wrapper').find('li#' + ReportWidgetTemp.ObjectId);
                var container = $(reprotCurrentWidgetDom).find('div.h3-body').empty();
                var width = container.width();
                var height = container.height();
                $.ReportDesigner.ReportChartManager = container.ChartBase({
                    Width: width,
                    Height: height,
                    ChartType: widgettype,
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
                            return that.getDesignValue(widgettype);
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
                            return that.getDesignValue(widgettype);
                        } else if (ret.type == "Fields") { 
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
                            return that.getDesignValue(widgettype);
                        }

                    }

                });

                if (ReportWidgetTemp.Categories.length > 0 || ReportWidgetTemp.Series.length > 0 || ReportWidgetTemp.Columns.length > 0) {
                    var resChar = ReportWidgetTemp.getDesignValue(widgettype);
                    if (resChar) {
                        $.extend(resChar, { ShowDemo: false });
                        $.extend($.ReportDesigner.ReportChartManager.ReportWidget, resChar);
                        $.ReportDesigner.ReportChartManager.drawChart();
                        $.ReportDesigner.ReportChartManager.drawLegend();
                    }
                }
            } else if (widgettype == _DefaultOptions.WidgetType.Combined) {
                //获取符合当前widget的报表的容器位置
                var container = $('ul#widget_wrapper').find('li#' + ReportWidgetTemp.ObjectId).find('div.h3-body').empty();
                var opt = {
                    widget: ReportWidgetTemp,
                    dragCallBack: function (ret) {
                        var field = $.ReportDesigner.CurrentDragField;
                        if (!field || !field.Code) return false;
                        $.ReportDesigner.CurrentWidgetDom.find('div.h3-guide').hide();
                        //字段已经存在报表中不允许再拖
                        if (ReportWidgetTemp.IsColumnExist(field.Code)) {
                            $.IShowWarn('报表中已经存在该字段，不允许再次拖动！');
                            return false;
                        }
                        //设置数据源
                        ReportWidgetTemp.ReportSourceId = field.SourceId;
                        $.ReportDesigner.ReportSourceManager.View_SetSourceDisabled(field.SourceId);
                        if (ret.type == "Categories") {
                            if (field.Code == "DefaultCountCode") {
                                $.IShowWarn("计数字段不能是行字段");
                                return false;
                            }
                            var selfcolumn = new ReportWidgetColumn({
                                ColumnCode: field.Code,
                                ColumnName: field.Code,
                                DisplayName: field.DisplayName,
                                ColumnType: field.DataType,
                                Formula: field.Formula
                            });
                            if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                                selfcolumn.FunctionType = _DefaultOptions.Function.YY;
                                var sortcolumn = new ReportWidgetColumn({
                                    ColumnCode: field.Code,
                                    ColumnName: field.Code,
                                    DisplayName: field.DisplayName,
                                    ColumnType: field.DataType,
                                    Formula: field.Formula
                                });
                                ReportWidgetTemp.SortColumns.push(selfcolumn);
                            }
                            ReportWidgetTemp.Categories.push(selfcolumn);
                        } else if (ret.type == "Series") {
                            if (field.Code == "DefaultCountCode") {
                                $.IShowWarn("计数字段不能是列字段");
                                return false;
                            }
                            var selfcolumn = new ReportWidgetColumn({
                                ColumnCode: field.Code,
                                ColumnName: field.Code,
                                DisplayName: field.DisplayName,
                                ColumnType: field.DataType,
                                Formula: field.Formula,
                                Ascending: true
                            });
                            if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                                selfcolumn.FunctionType = _DefaultOptions.Function.YY;
                                var sortcolumn = new ReportWidgetColumn({
                                    ColumnCode: field.Code,
                                    ColumnName: field.Code,
                                    DisplayName: field.DisplayName,
                                    ColumnType: field.DataType,
                                    Formula: field.Formula,
                                    Ascending: true
                                });
                                ReportWidgetTemp.SortColumns.push(selfcolumn);
                            }
                            ReportWidgetTemp.Series.push(selfcolumn);
                        } else if (ret.type == "Field") {
                            if (ReportWidgetTemp.Categories && ReportWidgetTemp.Categories.length > 0 || ReportWidgetTemp.Series && ReportWidgetTemp.Series.length > 0) {

                                if (field.Code == "DefaultCountCode") {
                                    if (ReportWidgetTemp.Categories.length == 0 && ReportWidgetTemp.Series.length == 0) {
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
                                    column.Format = ",;#.##";
                                }
                                if (field.DataType == _DefaultOptions.ColumnType.DateTime) {
                                    column.FunctionType = _DefaultOptions.Function.YY;
                                }
                                ReportWidgetTemp.Columns.push(column);
                            }
                            else {
                                $.IShowWarn('请先拖入分类或系列！');
                            }

                        }
                        $.ReportDesigner.CurrentDragField = null;
                    }
                };
                //重绘报表
                var reportCombined = new ReportCombined(opt, container);
            }
            else if (widgettype == _DefaultOptions.WidgetType.SimpleBoard) {
                //获取符合当前widget的报表，再循环内部最小单位的simpleboard单元格，初始化CurrentSimpleBoard
                $('table.table-simpleboard').find('td').each(function () {
                    if ($(this).find("p[data-code='" + column.ColumnCode + "']")) {
                        var $row_index = $(this).parent('tr').index();
                        var $col_index = $(this).index();
                        var simpleBoard = ReportWidgetTemp.getSimpleBoardWidget($row_index, $col_index);
                        if (simpleBoard) {
                            if (!$.ReportDesigner.CurrentSimpleBoard || $.ReportDesigner.CurrentSimpleBoard.ObjectId != simpleBoard.ObjectId) {
                                $.ReportDesigner.CurrentSimpleBoard = simpleBoard;
                            }
                            $.ReportDesigner.CurrentSimpleBoard.__proto__ = ReportWidgetTemp.ReportWidgetSimpleBoard.prototype;
                            $.ReportDesigner.CurrentSimpleBoard.init(ReportWidgetTemp.ObjectId);
                        }
                    }
                });
                //更新当前符合单元格的计算字段的算法
                if ($.ReportDesigner.CurrentSimpleBoard) {
                    $.ReportDesigner.CurrentSimpleBoard.Columns[0].Formula = column.Formula;
                    $.ReportDesigner.CurrentSimpleBoard.Columns[0].DisplayName = column.DisplayName;

                    var param = {
                        'ReportPage': JSON.stringify($.ReportDesigner.ReportPage),
                        "WidgetObjectID": ReportWidgetTemp.ObjectId,
                        'ReportWidgetSimpleBoardObjectID': $.ReportDesigner.CurrentSimpleBoard.ObjectID,
                        'ColumnCode': column.ColumnCode
                    };
                    //请求数据 重绘表格
                    $.ReportDesigner.CurrentSimpleBoard.PostAction(param);
                }
            }

        }
    },
    //显示计算字段编辑器,column 不为空时为编辑计算字段，否则新增
    View_ShowFormulaEditor: function (column, source, target) {
        //todo
        var thats = this;
        var isNew = false;
        var sources = source;
        if (!column) {
            isNew = true;
            var id = $.IGuid();
            var config = { ObjectId: id, ColumnCode: 'i' + id.replace(new RegExp(/-/g), '') };
            // var config = { ObjectId: id, ColumnCode: column.DisplayName };
            column = new ReportWidgetColumn(config);
            column.ColumnType = _DefaultOptions.ColumnType.Numeric;
        }
        var SchemaCodes = thats.Obj_GetSchemaArray(sources);
        thats.View_CallFormulaEditable(column, target, SchemaCodes, function (column) {
            if (isNew) {
                //column.ColumnCode = column.DisplayName+"_Name";
                //column.ColumnName = column.DisplayName;
                thats.View_AddFunctionColumn(sources, column);
                thats.Obj_AddFunctionColumn(sources, column);
            } else {
                thats.View_UpdateFunctionColumn(sources, column);
            }
        });
    },
    //调用规则编辑器
    View_CallFormulaEditable: function (column, target, SchemaCodes, callback) {
        $(target).FormulaEditable({
            IsButton: true,
            FormulaType: 'DATASOURCE',
            Parameter: SchemaCodes,
            Formula: column.Formula,
            TitleCode: column.ObjectId,
            TitleText: column.DisplayName,
            Immediate: true
        });
        $(target).next('.FormulaControl').change(function () {
            var formula = $(this).attr('formula') || '';
            var columnName = $(this).attr('formula-titletext') || '';
            column.DisplayName = columnName;
            column.Formula = formula;
            if (typeof (callback) == 'function') {
                callback(column);
            }
        });
    },
    //显示关联关系编辑窗口
    View_ShowAssociationEditor: function (schemaCode, displayName, AssociationSchemacode) {
        var that = this, modal = null;
        var source = that.EditingSource;
        var showCallback = function () {
            that.AssociationSetupPanel.find('div.panel-left').empty();
            that.AssociationSetupPanel.find('table.association-table').empty();
            that.AssociationSetupPanel.show();
            //左侧构建应用树
            var events = {
                //构建关联关系时只允许选择一个节点
                onCheck: function (event, treeId, treeNode) {
                    //选择遵循原则
                    var treeObj = AppTree.getTreeObj();
                    //1、选择后其他所有节点都不能选；
                    //2、只有取消当前选中的节点后才能选取其他节点
                    if (!treeNode.checked) {
                        //需要去掉右侧已经建立的,并且删除这个关联关系
                        $('table.association-table').empty();

                        //
                        var nodes = treeObj.getNodes();
                        nodes = treeObj.transformToArray(nodes);
                        $.each(nodes, function () {
                            treeObj.setChkDisabled(this, false, false, false);
                        });
                    } else {
                        var nodes = treeObj.getNodes();
                        nodes = treeObj.transformToArray(nodes);
                        $.each(nodes, function () {
                            treeObj.setChkDisabled(this, true, false, false);
                        });
                        treeObj.setChkDisabled(treeNode, false, false, false);
                    }

                },
                onNodeCreated: function (event, treeId, treeNode) {
                    var parent = treeNode.getParentNode();
                    if (parent && parent.chkDisabled) {
                        AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                    }
                    if (parent && parent.checked) {
                        AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                    }
                    if (schemaCode && treeNode.Code == schemaCode) {
                        //还原关联关系已经选中的节点
                        AppTree.getTreeObj().checkNode(treeNode, true, false, true);
                    }
                }
            };
            var target = that.AssociationSetupPanel.find('div.panel-left');
            that.View_InitAppTree(target, events);
            //右侧构建关联关系
            if (schemaCode) {
                var tmpAssos = [];
                for (var i = 0, len = source.ReportSourceAssociations.length; i < len; i++) {
                    var asso = source.ReportSourceAssociations[i];
                    if (asso.AssociationMethod == _DefaultOptions.AssociationMethod.Manual && asso.SchemaCode == schemaCode) {
                        tmpAssos.push(asso);
                    }
                }
                //构建关联关系表
                that.View_ResotreAssociationTable(tmpAssos, displayName);
            }
            that.AssociationSetupPanel.find('div.panel-right').find('#btn_addRelation').unbind('click').bind('click', function () {
                that.View_AddAssociationRow();
            });

        }; //关联关系弹出后调用的函数-应用树初始化 绑定右侧的新增事件
        var toolButtons = [];
        var okBtn = {
            "Text": '确定', "Theme": 'btn_ok', CallBack: function () {                
                //新增关联关系
                if (!source.ReportSourceAssociations) {
                    source.ReportSourceAssociations = [];
                }
                var tmpAssociations = []; //临时存储，用于判断是否都关联正确后才添加到widget中去
                var trs = $('table.association-table').find('tr');
                if (trs.length > 0) {
                    var hasAssociationSchemacode = false;
                    for (var i = 0, len = trs.length; i < len; i++) {
                        var $tr = $(trs[i]);
                        var tmpSchemaCode = $($tr.find('td:eq(0)')).attr('data-code');
                        var subField = $($($tr.find('td:eq(1)')).children('select')).val();
                        var rootScheamCode = $($($tr.find('td:eq(3)')).children('select')).val();
                        var masterField = $($($tr.find('td:eq(4)')).children('select')).val();
                        if (!masterField || !tmpSchemaCode || !subField) {
                            $.IShowWarn('关联关系未正确建立，请检查...');
                            return;
                        }
                        var nodes = AppTree.getCheckedAll();
                        var reportAssociation = new ReportSourceAssociation();
                        reportAssociation.RootSchemaCode = rootScheamCode;
                        reportAssociation.MasterField = masterField;
                        reportAssociation.SchemaCode = tmpSchemaCode;
                        reportAssociation.SubField = subField;
                        reportAssociation.AssociationMode = _DefaultOptions.AssociationMode.Left;
                        reportAssociation.AssociationMethod = _DefaultOptions.AssociationMethod.Manual;
                        if (nodes && nodes.length > 0 && nodes[0].NodeType == "SubSheet")
                            reportAssociation.IsSubSheet = true;
                        tmpAssociations.push(reportAssociation);
                        if (tmpSchemaCode == AssociationSchemacode) {
                            hasAssociationSchemacode = true;
                        }
                    }
                    //如果为编辑时，如果删除了原关联关系，即删除这个关联关系
                    if (!hasAssociationSchemacode && AssociationSchemacode) {
                        that.Obj_RemoveAssociation(AssociationSchemacode);
                    }
                    //比较是否已经存在相同的关联关系了
                    for (var i = tmpAssociations.length - 1; i >= 0; i--) {
                        var hasExists = false, tmp = tmpAssociations[i];
                        for (var j = 0, len2 = source.ReportSourceAssociations.length; j < len2; j++) {
                            var exist = source.ReportSourceAssociations[j];
                            if (exist.RootSchemaCode == tmp.RootSchemaCode &&
                                exist.MasterField == tmp.MasterField &&
                                 exist.SchemaCode == tmp.SchemaCode &&
                                 exist.SubField == tmp.SubField
                                ) {
                                hasExists = true;
                            }
                        }
                        if (hasExists) {
                            tmpAssociations.splice(i, 1);
                        }
                    }
                    source.ReportSourceAssociations = source.ReportSourceAssociations.concat(tmpAssociations);
                } else {
                    if (schemaCode) {
                        //删除关联表
                        for (var i = source.ReportSourceAssociations.length - 1; i >= 0; i--) {
                            if (source.ReportSourceAssociations[i].SchemaCode == schemaCode && source.ReportSourceAssociations[i].AssociationMethod == _DefaultOptions.AssociationMethod.Manual) {
                                source.ReportSourceAssociations.splice(i, 1);
                            }
                        }
                    }
                }
                that.View_UpdateSource(source);
                modal.hide();
            }
        };
        var cancelBtn = {
            "Text": '取消', "Theme": 'btn_cancel', CallBack: function () {
                modal.hide();
            }
        };
        toolButtons.push(okBtn);
        toolButtons.push(cancelBtn);
        modal = $.IModal({
            Title: '设置关联关系',
            Width: '700px',
            Height: '300px',
            OnShowCallback: showCallback,
            OnHiddenCallback: null,
            ShowBack: false,
            HasIframe: false,
            ContentUrl: '',
            Content: that.AssociationSetupPanel,
            ToolButtons: toolButtons
        });
    },
    //还原新增的关联关系
    View_ResotreAssociationTable: function (associations, displayName) {
        var that = this;
        $(associations).each(function () {
            that.View_AddAssociationRow(this, displayName);
        });
    },
    //添加关联关系的一行
    View_AddAssociationRow: function (association, name) {
        var that = this;
        var $table = $(".association-table");
        var $tr = $('<tr></tr>');
        $table.append($tr);
        var schemaCode = "", displayName = "";
        if (association) {
            schemaCode = association.SchemaCode;
            displayName = name;
        } else {
            var checkNodes = AppTree.getTreeObj().getCheckedNodes(true);
            if (!checkNodes || checkNodes.length == 0) {
                $.IShowWarn('必须先在左侧选择一个关联表单才能建立关联关系');
                return;
            }
            schemaCode = checkNodes[0].Code;
            displayName = checkNodes[0].name;
        }

        that.Tool_GetSchemaFields(schemaCode, function (fields) {
            var $td1 = $('<td style="width:80px;"></td>').attr('data-code', schemaCode).html(displayName);
            $tr.append($td1);
            var $td2 = $('<td style="width:100px;min-width:100px;"></td>');
            var $selectSubField = $('<select style="width:100%;"><option value="">-请选择-</option></select>');
            for (var i = 0, len = fields.length; i < len; i++) {
                var field = fields[i].ReportWidgetColumn;
                var $option = $('<option></option>').val(field.ColumnCode).html(field.DisplayName);
                $selectSubField.append($option);
            }
            $td2.append($selectSubField);
            //add by xc
            $selectSubField.DropDownList({ Width: "100%" });
            //end

            $tr.append($td2);
            var $td3 = $('<td style="width:50px;">值等于</td>')
            $tr.append($td3);
            var $td4 = $('<td style="width:100px;min-width:100px;"></td>');
            var $selectRootSchemaCode = $('<select style="width:100%;"><option value="">-请选择-</option></select>');
            var SheetArray = that.CacheSchemaDisplayArray[that.EditingSource.ObjectID];
            for (var i = 0, len = SheetArray.length; i < len; i++) {
                var field = SheetArray[i];
                var $option = $('<option></option>').val(field.SchemaCode).html(field.DisplayName);
                $selectRootSchemaCode.append($option);
            }
            $td4.append($selectRootSchemaCode);
            //add by xc
            $selectRootSchemaCode.DropDownList({ Width: "100%" });
            //end
            $tr.append($td4);
            var $td5 = $('<td style="width:100px;min-width:100px;"></td>');
            var $selectMasterField = $('<select style="width:100px;"><option value="">-请选择-</option></select>')
            $td5.append($selectMasterField);
            //add by xc
            $selectMasterField.DropDownList({ Width: "100%" });
            //end
            $tr.append($td5);

            $td6 = $('<td style="width:30px;max-width:30px;"></td>');
            var $remove = $('<span><i style="color:#ca4d4b;font-size:18px; cursor: pointer;" class="iconReport-remove-outline"></i></span>');
            $td6.append($remove);
            $tr.append($td6);
            //赋值操作
            if (association) {
                //$selectSubField.val(association.SubField);
                $selectSubField.val(association.SubField).change();
                //$selectRootSchemaCode.val(association.RootSchemaCode);
                $selectRootSchemaCode.val(association.RootSchemaCode).change();
                that.Tool_GetSchemaFields(association.RootSchemaCode, function (columns) {
                    if (columns) {
                        for (var i = 0, len = columns.length; i < len; i++) {
                            var $option = $('<option></option>').val(columns[i].ReportWidgetColumn.ColumnCode).html(columns[i].ReportWidgetColumn.DisplayName);
                            $selectMasterField.append($option);
                        }
                    }
                    $selectMasterField.val(association.MasterField);
                    //add by xc
                    $selectMasterField.DropDownList("Refresh");
                    //end
                });

            }
            //绑定事件
            $selectRootSchemaCode.unbind('change').bind('change', function () {
                var schemaCode = $(this).val();
                var $td = $(this).closest('td').next();
                $td.find('select').empty();
                if (schemaCode) {
                    that.Tool_GetSchemaFields(schemaCode, function (columns) {
                        if (columns) {

                            for (var i = 0, len = columns.length; i < len; i++) {
                                var $option = $('<option></option>').val(columns[i].ReportWidgetColumn.ColumnCode).html(columns[i].ReportWidgetColumn.DisplayName);
                                $td.find('select').append($option);
                            }
                            $td.find('select').DropDownList("Refresh");
                        }
                    });
                }
                    //add by xc
                else {
                    $td.find('select').html('<option value="">-请选择-</option>');
                }
                $td.find('select').DropDownList("Refresh");
                //end
            });
            $remove.unbind('click').bind('click', function () {
                //删除一条记录
                $(this).closest('tr').remove();
            });
        });
    },
    //显示数据源Schema选择窗口,source可为空，为空则新增
    View_ShowSchemaSelecter: function (source,isNew) {
        console.log("View_ShowSchemaSelecter");
        var that = this;
        that.SchemaSelectPanel.find('input:text').val('');
        if (!source || isNew) {
            that.IsNew = true;
            source = new ReportSource({
                ObjectId: $.IGuid()
            });
        } else {
            that.IsNew = false;
            that.SchemaSelectPanel.find('input#source-display').val(source.DisplayName);
        }
        //用于判断是否应该重置报表的显示
        var SchemaCode = source.SchemaCode;
        console.log(SchemaCode);

        this.EditingSource = source;
        var width = '400px', height = '400px', modal = null, sqlModal = null;
        var shownCallback = function () { 
            if (that.EditingSource.SchemaCode) {
                that.View_InitSchemaSelecter(that.EditingSource, that.EditingSource.SchemaCode);
            } else {
                that.View_InitSchemaSelecter(that.EditingSource, null);
            }
        };
        var isSave = false;
        //非匿名函数
        function saveAction() {
            isSave = true;
            console.log("saveAction");
            var displayName = that.SchemaSelectPanel.find('input#source-display').val();
            if (displayName.replace(/[ ]/g, "")) {
                source.DisplayName = displayName;
            } else {
                $.IShowWarn('请先输入数据源显示名称');
                return;
            }

            var nodes = AppTree.getCheckedAll();
            //source.CheckedNodes = nodes;//记录勾选的Node。用于修改时候定位表单
            if (!nodes || nodes.length == 0) {
                $.IShowWarn('请先选择数据源');
                return;
            }
            source.DataSourceCoding = "Engine";//表单默认设置为Engine 编码
            //获取上级node
            source['AppGroup'] = '';
            for (var i = 0; i < nodes.length; i++) {
                var parentNode = nodes[i].getParentNode();
                if (parentNode&&parentNode.NodeType == 'AppGroup') {
                    source['AppGroup'] = parentNode.Code;
                    break;
                }
            }
            if (source.ReportSourceAssociations != void 0) {
                for (var i = source.ReportSourceAssociations.length - 1; i >= 0; i--) {
                    if (source.ReportSourceAssociations[i].AssociationMethod == _DefaultOptions.AssociationMethod.Auto) {
                        source.ReportSourceAssociations.splice(i, 1);
                    }
                }
            }
            //此处排列展示选中的表单，并建立内部关联关系
            that.Obj_CreateReportAssociation(source.SchemaCode, nodes);
          
            modal.hide();

            //建立左侧并排表
            if (that.IsNew) {
                that.Obj_AddNewSource(source);
                that.View_AddNewSource(source, true);
            } else {


                //防止没有改变数据源的情况下（比如只更改数据源名字）清空报表视图
                if (SchemaCode != that.EditingSource.SchemaCode) {
                    //删除相关的查询条件 
                    that.ReportFilterAndWidgetRmove(that.editBeforeSource);
                    //删除编辑前数据源控件关联的widget中的相应字段
                    for (var i = 0, len = $.ReportDesigner.ReportPage.ReportWidgets.length; i < len; i++) {
                        var reportWidget = $.ReportDesigner.ReportPage.ReportWidgets[i];
                        var objid = that.EditingSource.ObjectId || that.EditingSource.ObjectID;
                        if (reportWidget.ReportSourceId == objid) {
                            reportWidget.Columns = [];
                            reportWidget.Categories = [];
                            reportWidget.Series = [];
                            reportWidget.ReportSourceId = null;
                            $.ReportDesigner.CurrentWidgetDom = $('li.widget[id="' + reportWidget.ObjectId + '"]');
                            reportWidget.draw($.ReportDesigner.CurrentWidgetDom);
                        }
                    }
                }


                //当编辑前数据源为sql数据源，点开编辑后选择sql数据源后，又返回选择目录数据源的情况
                if (!that.editBeforeSource.SchemaCode && source.IsUseSql && source.SchemaCode) {
                    source.IsUseSql = false;
                    source.CommandText = "";
                    source.DataSourceCoding = "Engine";
                    source.SqlColumns = new Array();

                    that.EditingSource.IsUseSql = false;
                    that.EditingSource.CommandText = "";
                    that.EditingSource.DataSourceCoding = "Engine";
                    that.EditingSource.SqlColumns = new Array();
                }

                if (that.editBeforeSource.SchemaCode && source.IsUseSql) {
                    source.SchemaCode = "";
                }

                that.View_UpdateSource(source);

            }

        };
        var cancelAction = function () {
            //当取消选择时，若之前为目录数据源，则恢复SchemaCode
            if (that.editSchemaCode) {
                that.EditingSource.SchemaCode = that.editSchemaCode;
            }
            modal.hide();
        };
        var sqlAction = function () {
            modal.hide();
            that.View_ShowSqlEditor(source, that.IsNew);
        };

        var actions = [];
        actions.push({
            Text: "确定", CallBack: saveAction, Theme: 'btn_ok'
        });
        actions.push({
            Text: "取消", CallBack: cancelAction, Theme: 'btn_cancel'
        });
        if (IsDev) {
            actions.push({
                Text: "自定义Sql", CallBack: sqlAction, Theme: 'btn btn-warning btn-custom', 'position': 'left'
            });
        }
        var closeCallbackAction = function () {
            if (!isSave) {
                if (that.editSchemaCode) {
                    that.EditingSource.SchemaCode = that.editSchemaCode;
                }
            }
            that.SchemaSelectPanel.find('div#sheet').empty();
        }
        modal = $.IModal({
            Title: '定义数据源', Width: width, Height: height, OnShowCallback: shownCallback, OnHiddenCallback: closeCallbackAction, Content: that.SchemaSelectPanel, ToolButtons: actions, ShowHeader: true
        });
    },
    //初始化选择的数据源
    View_InitSchemaSelecter: function (source, expandRootCode) {
        var that = this;
        //初始化应用树
        var events = {
            onNodeCreated: function (event, treeId, treeNode) {
                if (that.EditingSource.SchemaCode) {
                    if (treeNode.NodeType == "AppMenu") {
                        //表单
                        if (treeNode.Code == that.EditingSource.SchemaCode) {
                            AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                            //发现了勾选的节点后，将之前已经加载过的节点设置为禁用
                            var tempnode;
                            if (treeNode.level != 0) {
                                for (var i = 0; i < treeNode.level; i++) {
                                    if (i == 0) {
                                        tempnode = treeNode.getParentNode();
                                    } else {
                                        tempnode = tempnode.getParentNode();
                                    }
                                    //对父节点进行同级节点隐藏
                                    AppTree.setRootSiblingsChildCheckDisabled(tempnode);
                                    AppTree.setSiblingsCheckDisabled(tempnode);
                                }
                            } 
                            AppTree.setSiblingsCheckDisabled(treeNode);
                        } else {
                            var tempnodes = AppTree.getTreeObj().getCheckedNodes(true);
                            if (!treeNode.checked && tempnodes.length > 0) {
                                //若当前节点不为选中节点，同时已经有其他节点被选中，则当前节点应为禁用状态
                                AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                            } else {
                                AppTree.getTreeObj().setChkDisabled(treeNode, false);
                            }
                        }
                        return;
                    } else if (treeNode.NodeType == "AppGroup") {
                        //分组
                        if (source.AppGroup != "" && source.AppGroup == treeNode.Code) {
                            //展开分组
                            AppTree.expandNode(treeNode);
                            return;
                        }
                    } else if (treeNode.NodeType == "AppPackage") {
                        //应用
                    }
                }
                //if (that.EditingSource.SchemaCode && treeNode.NodeType == "AppMenu") {
                //    //恢复选中状态
                //    if (treeNode.Code == that.EditingSource.SchemaCode) {
                //        AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                //        return;
                //    } else {
                //        if (!treeNode.checked) {
                //            AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                //            return;
                //        }
                //    }
                //}

                if (that.EditingSource.ReportSourceAssociations && that.EditingSource.ReportSourceAssociations.length > 0) {
                    for (var i = 0, len = that.EditingSource.ReportSourceAssociations.length; i < len; i++) {
                        var association = that.EditingSource.ReportSourceAssociations[i];
                        if (treeNode.Code == association.SchemaCode && treeNode.NodeType != "AppMenu") {
                            AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                        }
                        if (treeNode.Code == association.RootSchemaCode && treeNode.NodeType != "AppMenu") {
                            AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                        }
                    }
                }


                if (treeNode.NodeType == "SubSheet" || treeNode.NodeType == "Association") {
                    var parent = treeNode.getParentNode();
                    if (!parent.checked && parent.chkDisabled) {
                        AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                    }
                    //当主表未选中时，子表也要取消选中
                    if (!parent.checked) {
                        AppTree.getTreeObj().checkNode(treeNode, false, null, null);
                    }

                    //当一个子节点选中时，对其它子节点禁选
                    if (treeNode.checked) {
                        AppTree.setSiblingsCheckDisabled(treeNode);
                    }
                }
            },
            onCheck: function (event, treeId, treeNode) {
                //选择遵循原则
                //1、同节点只能选择一个；
                //2、如果已经出现过一次，则不再出现；
                if (!treeNode.checked) {
                    //取消选中
                    //AppTree.setSiblingsCheckEnabled(treeNode);

                    //当选中主节点和子节点，然后取消父节点勾选时，要将所有子节点同步取消勾选
                    that.cancelChecked(treeNode);

                    if (treeNode.NodeType == "AppMenu") {
                        var tempnode;
                        if (treeNode.level != 0) {
                            for (var i = 0; i < treeNode.level; i++) {
                                if (i == 0) {
                                    tempnode = treeNode.getParentNode();
                                } else {
                                    tempnode = tempnode.getParentNode();
                                }
                                AppTree.setSiblingsCheckEnabled(tempnode);
                                AppTree.setRootSiblingsChildCheckEnabled(tempnode);
                            }
                        }
                        AppTree.setSiblingsCheckEnabled(treeNode);
                        AppTree.setRootSiblingsChildCheckEnabled(treeNode);


                        //取消子节点的选中，用于编辑状态下取消主表时，也要取消子表的选中
                        var childs = treeNode.children;
                        if (childs != null) {
                            for (var i = 0; i < childs.length; i++) {
                                AppTree.getTreeObj().setChkDisabled(childs[i], false, false, true);
                            }
                        }



                        that.SchemaSelectPanel.find('input#source-display').val('');
                    }
                    else if (treeNode.NodeType == "SubSheet") {
                        //释放同级兄弟节点
                        AppTree.setSiblingsCheckEnabled(treeNode);

                    }
                } else {
                    if (treeNode.NodeType == "AppMenu") {
                        source.SchemaCode = treeNode.Code;
                        if (!that.SchemaSelectPanel.find('input#source-display').val()) {
                            that.SchemaSelectPanel.find('input#source-display').val(treeNode.name + '数据源');
                        }
                        var tempnode;
                        if (treeNode.level != 0) {
                            for (var i = 0; i < treeNode.level; i++) {
                                if (i == 0) {
                                    tempnode = treeNode.getParentNode();
                                } else {
                                    tempnode = tempnode.getParentNode();
                                }
                                //对父节点进行同级节点隐藏
                                AppTree.setRootSiblingsChildCheckDisabled(tempnode);
                                AppTree.setSiblingsCheckDisabled(tempnode);
                            }
                        }
                        //设置父节点的同级节点隐藏
                        //var parent = treeNode.getParentNode();
                        //AppTree.hideSiblings(parent);
                        //AppTree.setRootSiblingsChildCheckDisabled(parent);
                        //设置同级节点禁用选中
                        AppTree.setSiblingsCheckDisabled(treeNode);
                    } else if (treeNode.NodeType == "SubSheet" || treeNode.NodeType == "Association") {
                        //设置同级节点禁用选中
                        AppTree.setSiblingsCheckDisabled(treeNode);
                        //选中同时，自动选中父节点
                        var parent = treeNode.getParentNode();
                        AppTree.checkNode(parent, true, false, true);
                        if (!that.SchemaSelectPanel.find('input#source-display').val() && parent.NodeType == "AppMenu") {
                            that.SchemaSelectPanel.find('input#source-display').val(parent.name + '数据源');
                        }

                    }
                }

            },
            onExpand: function (event, treeId, treeNode) {
            },
            onAsyncSuccess: function (event, treeId, treeNode, msg) { 
                if (expandRootCode) {
                    //编辑数据源的时候加载树，直接展开已勾选的节点
                    var Obj = $.parseJSON(msg);
                    var _Nodepath = [];
                    for (var i = 0; i < Obj.length; i++) {
                        _Nodepath = Obj[i].NodePath.split(',');
                        break;
                    }
                    for (var i = _Nodepath.length-1; i >0 ; i--) {
                        var node = AppTree.getTreeNodeByCode(_Nodepath[i]);
                        if (node) {
                            AppTree.expandNode(node);
                        }
                    } 
                }
            }
        };
        that.SchemaSelectPanel.show();
        that.View_InitAppTree(that.SchemaSelectPanel.find('div#sheet'), events, expandRootCode);
    },
    //打开自定义sql编辑框
    View_ShowSqlEditor: function (source, isNew) {



        //判断是否是开发者
        if (!IsDev) {
            $('span.check').css("background-color", "#e2e2e2");
            $('#sql').find(".sql").attr("disabled", "disabled");
        }
        else {
            $('span.check').css("backgroud-color", "#ee984b");
            $('#sql').find(".sql").removeAttr("disabled");
        }
        var oldsqlcolumn = source.SqlColumns;
        var oldsqlwherecolumn = source.TmpSQLWhereColumns;
        var that = this, sqlModal = null;
        var width = "1000px", height = '450px';
        that.NewColumnIncludeOldColumn = false;
        var sqlShownCallback = function () {
            if (source && source.DataSourceCoding) {

                LoadDBConnetData(source.DataSourceCoding);
            } else {
                //初始化数据连接池编码
                LoadDBConnetData(null);
            }

            that.CheckTrue = false;//默认校验失败
            if (source && source.DisplayName) {
                that.SqlEditor.find('input#source-display').val(source.DisplayName);
            }
            if (source && source.CommandText) {
                that.SqlEditor.find('textarea.sql').val(source.CommandText);
            }
            if (source && source.DataSourceCoding) {

                loadDataTable(that, null, source.DataSourceCoding);
            }
            if (source && source.DataSourceCoding == "") {

                loadDataTable(that, null, "Engine");
            }
            if (source && source.SQLWhereColumns && source.SQLWhereColumns.length > 0) {
                that.SqlEditor.find("#sqlcheckwhere").prop("checked", true);
                that.SqlEditor.find(".sqlwherecontent").show();
            }
            else {
                that.SqlEditor.find("#sqlcheckwhere").prop("checked", false);
                that.SqlEditor.find(".sqlwherecontent").hide();
            }
            //给数据连接池编码绑定change事件
            that.lstDbConnection.unbind("change").bind("change", function () {
                var dbcode = that.lstDbConnection.val();
                loadDataTable(that, null, dbcode);
            });
            that.SqlEditor.find("#sqlcheckwhere").unbind("click").bind("click", function () {
                var $this = $(this);
                if ($this.prop("checked")) {
                    that.SqlEditor.find(".sqlwherecontent").show();
                }
                else {
                    that.SqlEditor.find(".sqlwherecontent").hide();
                    that.SqlEditor.find(".sqlwhereheaderbody").html("");
                    if (source && source.SQLWhereColumns) {
                        source.SQLWhereColumns = [];
                    }
                }
            });
            that.SqlEditor.find(".sqlwhereheaderitemadd>span").unbind("click").bind("click", function () {
                // var sqlwhereitem = source.SQLWhereColumns[i];
                var item = $('<div class="sqlwhereheaderbodyitem row" ><div class="sqlwhereheaderbodyitemname"></div><div  class="sqlwhereheaderbodyitemcode"></div><div  class="sqlwhereheaderbodyitemtype"></div><div class="sqlwhereheaderbodyitemremove"></div></div>');
                var inputname = $('<input class="sqlwhereheaderbodyitemnameinput" >');
                //inputname.val(sqlwhereitem.DisplayName);
                var inputCode = $('<input class="sqlwhereheaderbodyitemnameinput" >');
                //inputname.val(sqlwhereitem.ColumnCode);
                var selecttype = $('<select><option value="' + _DefaultOptions.ColumnType.String + '">字符串</option><option value="' + _DefaultOptions.ColumnType.Numeric + '">数字</option><option value="' + _DefaultOptions.ColumnType.DateTime + '">时间</option><option value="' + _DefaultOptions.ColumnType.Association + '">关联查询</option><option value="' + _DefaultOptions.ColumnType.SingleParticipant + '">组织机构</option><option value="' + _DefaultOptions.ColumnType.Boolean + '">布尔</option></select>');
                //selecttype.val(sqlwhereitem.ColumnType);
                var removeitem = $('<span class="fa fa-minus"></span>');
                removeitem.unbind("click").bind("click", function () {
                    var columncode = $(this).closest(".sqlwhereheaderbodyitem").find(".sqlwhereheaderbodyitemcode>input").val();
                    $(this).closest(".sqlwhereheaderbodyitem").remove();
                    var index = -1;
                    for (var j = 0; j < source.SQLWhereColumns.length; j++) {
                        if (columncode == source.SQLWhereColumns[j]) {
                            index = j;
                        }
                    }
                    if (index > 0) {
                        source.SQLWhereColumns.splice(index, 1);
                    }
                });
                item.find(".sqlwhereheaderbodyitemname").append(inputname);
                item.find(".sqlwhereheaderbodyitemcode").append(inputCode);
                item.find(".sqlwhereheaderbodyitemtype").append(selecttype);
                item.find(".sqlwhereheaderbodyitemremove").append(removeitem);
                that.SqlEditor.find(".sqlwhereheaderbody").append(item);
                selecttype.DropDownList({
                    Width: "90%"
                });
            })
            if (source && source.SQLWhereColumns) {
                that.SqlEditor.find(".sqlwhereheaderbody").html("");
                for (var i = 0; i < source.SQLWhereColumns.length; i++) {
                    var sqlwhereitem = source.SQLWhereColumns[i];
                    var item = $('<div class="sqlwhereheaderbodyitem row" ><div class="sqlwhereheaderbodyitemname"></div><div  class="sqlwhereheaderbodyitemcode"></div><div  class="sqlwhereheaderbodyitemtype"></div><div class="sqlwhereheaderbodyitemremove"></div></div>');
                    var inputname = $('<input class="sqlwhereheaderbodyitemnameinput" >');
                    inputname.val(sqlwhereitem.DisplayName);
                    var inputCode = $('<input class="sqlwhereheaderbodyitemnameinput" >');
                    inputCode.val(sqlwhereitem.ColumnCode);
                    var selecttype = $('<select><option value="' + _DefaultOptions.ColumnType.Boolean + '">布尔</option><option value="' + _DefaultOptions.ColumnType.String + '">字符串</option><option value="' + _DefaultOptions.ColumnType.Numeric + '">数字</option><option value="' + _DefaultOptions.ColumnType.DateTime + '">时间</option><option value="' + _DefaultOptions.ColumnType.Association + '">关联查询</option><option value="' + _DefaultOptions.ColumnType.SingleParticipant + '">组织机构</option></select>');
                    selecttype.val(sqlwhereitem.ColumnType);
                    var removeitem = $('<span class="fa fa-minus"></span>');
                    removeitem.unbind("click").bind("click", function () {
                        var columncode = $(this).closest(".sqlwhereheaderbodyitem").find(".sqlwhereheaderbodyitemcode>input").val();
                        $(this).closest(".sqlwhereheaderbodyitem").remove();
                        var index = -1;
                        for (var j = 0; j < source.SQLWhereColumns.length; j++) {
                            if (columncode == source.SQLWhereColumns[j]) {
                                index = j;
                            }
                        }
                        if (index > 0) {
                            source.SQLWhereColumns.splice(index, 1);
                        }
                    });
                    item.find(".sqlwhereheaderbodyitemname").append(inputname);
                    item.find(".sqlwhereheaderbodyitemcode").append(inputCode);
                    item.find(".sqlwhereheaderbodyitemtype").append(selecttype);
                    item.find(".sqlwhereheaderbodyitemremove").append(removeitem);
                    that.SqlEditor.find(".sqlwhereheaderbody").append(item);
                    selecttype.DropDownList({
                        Width: "90%"
                    });
                }
            }
            var $msg = $('div.msg');
            $msg.removeClass('success').removeClass('error');
            $msg.children('span.text').html('');
            var $result = $('div.result');
            $result.empty();
            if (IsDev) {
                $('span.check').unbind('click').bind('click', function () {
                    if (!$('textarea.sql').val().replace(/[ ]/g, "")) {
                        $msg.removeClass('success').addClass('error').find('span.text').html('请先输入sql语句！');
                    } else {
                        var sql = $('textarea.sql').val().replace(/[;]/g, "");
                        //测试代码,这里要做一个校验
                        var columns = new Array();
                        if (that.SqlEditor.find("#sqlcheckwhere").prop("checked")) {
                            that.SqlEditor.find(".sqlwhereheaderbody").find(".sqlwhereheaderbodyitem").each(function () {
                                var $this = $(this);
                                var name = $this.find(".sqlwhereheaderbodyitemname>input").val();
                                var code = $this.find(".sqlwhereheaderbodyitemcode>input").val();
                                var type = $this.find(".sqlwhereheaderbodyitemtype>select").val();
                                var config = {
                                    ColumnCode: code,
                                    ColumnName: code,
                                    DisplayName: name,
                                    ColumnType: type
                                }
                                var column = new ReportWidgetColumn(config);
                                columns.push(column);
                            });
                        }


                        that.Tool_PostAction('CheckSQL', {
                            Sql: sql, Columns: JSON.stringify(columns), DbCode: $("#lstDbConnection").val()
                        }, function (data) {
                            if (!data.status) {
                                $msg.removeClass('success').addClass('error').find('span.text').html(data.message);
                                $result.empty();
                            } else {
                                that.CheckTrue = true;
                                $msg.removeClass('error').addClass('success').find('span.text').html('校验成功！');
                                var cols = data.cols;
                                //构造ReportWidgetColumn
                                that.TmpSqlColumns = cols;
                                that.TempSqlWhereColumns = columns;
                                var rows = data.rows;
                                $result.empty();
                                var $table = $('<table></table>');
                                var $thead = $('<tr></tr>')
                                for (var i = 0, len = cols.length; i < len; i++) {
                                    var $th = $('<th>' + cols[i].ColumnName + '</th>');
                                    $thead.append($th);
                                }
                                $table.append($thead);
                                for (var i = 0, len = rows.length; i < len; i++) {
                                    var $tr = $('<tr></tr>');
                                    for (var j = 0, len2 = cols.length; j < len2; j++) {
                                        var $td = $('<td>' + rows[i][cols[j].ColumnName] + '</td>')
                                        $tr.append($td);
                                    }
                                    $table.append($tr);
                                }
                                $result.append($table);
                            }
                        });
                    }
                });
            }

        };

        var loadDataTable = function (that, expandRootCode, code) {
            var that = that;
            var codes = code;
            var events = {
                onNodeCreated: function (event, treeId, treeNode) {

                    if (treeNode.NodeType == "AppMenu") {
                        //表单
                        //if (treeNode.Code == that.EditingSource.SchemaCode) {
                        //    AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                        //    return;
                        //} else {
                        //    //设置为不可选中状态
                        //    if (!treeNode.checked) {
                        //        AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                        //        return;
                        //    }
                        //}
                    } else if (treeNode.NodeType == "AppGroup") {
                        //分组
                        if (source.AppGroup != "" && source.AppGroup == treeNode.Code) {
                            //展开分组
                            AppTree.expandNode(treeNode);
                            return;
                        }
                    } else if (treeNode.NodeType == "AppPackage") {
                        //应用
                    }




                },
                onCheck: function (event, treeId, treeNode) {
                    //选择遵循原则
                    //1、同节点只能选择一个；
                    //2、如果已经出现过一次，则不再出现；
                    if (!treeNode.checked) {
                        //取消选中
                        AppTree.setSiblingsCheckEnabled(treeNode);
                        if (treeNode.NodeType == "AppMenu") {
                            AppTree.setRootSiblingsChildCheckEnabled(treeNode.getParentNode());
                            that.SchemaSelectPanel.find('input#source-display').val('');
                        }
                    } else {
                        if (treeNode.NodeType == "AppMenu") {
                            source.SchemaCode = treeNode.Code;
                            if (!that.SchemaSelectPanel.find('input#source-display').val()) {
                                that.SchemaSelectPanel.find('input#source-display').val(treeNode.name + '数据源');
                            }
                            //设置父节点的同级节点隐藏
                            var parent = treeNode.getParentNode();
                            //AppTree.hideSiblings(parent);
                            AppTree.setRootSiblingsChildCheckDisabled(parent);
                            //设置同级节点禁用选中
                            AppTree.setSiblingsCheckDisabled(treeNode);
                        } else if (treeNode.NodeType == "SubSheet" || treeNode.NodeType == "Association") {
                            //设置同级节点禁用选中
                            AppTree.setSiblingsCheckDisabled(treeNode);
                            //选中同时，自动选中父节点
                            var parent = treeNode.getParentNode();
                            AppTree.checkNode(parent, true, false, true);
                            if (!that.SchemaSelectPanel.find('input#source-display').val() && parent.NodeType == "AppMenu") {
                                that.SchemaSelectPanel.find('input#source-display').val(parent.name + '数据源');
                            }

                        }
                    }

                },
                onExpand: function (event, treeId, treeNode) {
                    //恢复选中状态

                    var childNode = AppTree.getTreeNodeByCode(treeNode.Code);
                    if (childNode) {
                        AppTree.getTreeObj().setChkDisabled(childNode, false, false, false);
                        AppTree.getTreeObj().checkNode(childNode, true, null, null);
                        return;
                    }



                },
                onAsyncSuccess: function (event, treeId, treeNode, msg) {
                    if (expandRootCode) {
                        var node = AppTree.getTreeNodeByCode(expandRootCode);
                        if (node) {
                            AppTree.expandNode(node);
                        }
                    }
                },
                onClick: function (event, treeId, treeNode) {
                    //注册树节点的点击事件，该方法拼接sql 数据字符串
                    if ($('div#custom_sql').find('textarea.sql').val() == "") {
                        if (treeNode.pId == "DbTable" || treeNode.pId == "DbView") {
                            if (treeNode.children) {
                                var selects = "select "
                                for (var i = 0; i < treeNode.children.length; i++) {
                                    selects = selects + treeNode.children[i].Code;
                                    if (i < treeNode.children.length - 1) {
                                        selects = selects + ","
                                    }
                                }
                                selects = selects + " from " + treeNode.id;

                            }
                            else {
                                var selects = "select * "
                                selects = selects + " from " + treeNode.id;
                            }
                            $('div#custom_sql').find('textarea.sql').val(selects);
                        }
                    } else {
                        if (confirm('您确认要覆盖Sql输入框的值吗？')) {
                            if (treeNode.pId == "DbTable" || treeNode.pId == "DbView") {
                                if (treeNode.children) {
                                    var selects = "select "
                                    for (var i = 0; i < treeNode.children.length; i++) {
                                        selects = selects + treeNode.children[i].Code;
                                        if (i < treeNode.children.length - 1) {
                                            selects = selects + ","
                                        }
                                    }
                                    selects = selects + " from " + treeNode.id;

                                }
                                else {
                                    var selects = "select * "
                                    selects = selects + " from " + treeNode.id;
                                }
                                $('div#custom_sql').find('textarea.sql').val(selects);
                            }
                        }
                    }
                }
            };
            //初始化加载树形菜单，分别展示表格和视图窗口
            that.View_InitAppTreeTable(that.lstSheet.find("div#lstSheetTable"), codes, events);

        }

        var LoadDBConnetData = function (thats) {
            var tha = thats;
            Tool_PostActionType(window._PORTALROOT_GLOBAL + "/ReportSqlSourse/SorceTypeChange", "DbConnection", function (data) {
                var objs = data;
                var va = tha;
                that.lstDbConnection.empty();
                for (var i = 0; i < objs.length; i++) {
                    that.lstDbConnection.append("<option value='" + objs[i].Value + "'>" + objs[i].Text + "</option>");
                }
                if (va != "" && va != null) {
                    that.lstDbConnection.val(va);
                }
            });

        }
        //ajax 请求contral中方法
        var Tool_PostActionType = function (Url, Parameter, CallBack) {
            $.ajax({
                type: "POST",
                url: Url,
                data: { Parameter: Parameter },
                dataType: "json",
                success: CallBack
            });
        }

        //todo删除及更新sql数据源的时候查询issqlwhere的filter，删除编码相同的，还要查询所有的sql的 reportsource，如果仍然存在相同编码的,不删除；
        var sql_OkAction = function () {
            if (!that.CheckTrue && IsDev) {
                $.IShowWarn('请先通过校验Sql语句!');
                return;
            }
            var displayName = that.SqlEditor.find('input#source-display').val();
            if (!displayName.replace(/[ ]/g, "")) {
                $.IShowWarn('请先输入数据源名称!');
                return;
            }
            // source = that.EditingSource;
            source.DisplayName = displayName;
            //判断是否存在sql
            if ($('textarea.sql').val().replace(/[ ]/g, "")) {
                //判断是否校验通过
                if (that.CheckTrue) {
                    var objid = source.ObjectID == undefined ? source.ObjectId : source.ObjectID;
                    that.SqlWhereFiltersRemoveSource(objid);
                    that.CheckTrue = false;

                    // source.EditingSource = that.Obj_GetSourceById(objid);
                    // source.EditingSource = that.EditingSource;
                    //if (source.EditingSource == undefined) {
                    //    for (var i = 0; i < that.SourceArray.length; i++) {
                    //        if (that.SourceArray[i].ObjectID == objid) {
                    //            source.EditingSource = that.SourceArray[i];
                    //        }
                    //    }

                    //}


                    source.IsUseSql = true;
                    source.DataSourceCoding = that.lstDbConnection.val();
                    source.CommandText = $('textarea.sql').val();
                    source.SqlColumns = [];
                    source.SQLWhereColumns = [];
                    var dicSqlcolumns = {
                    };

                    for (var i = 0; i < that.TmpSqlColumns.length; i++) {
                        var col = new ReportWidgetColumn(that.TmpSqlColumns[i]);
                        source.SqlColumns.push(col);
                        dicSqlcolumns[col.ColumnCode] = col;
                    }
                    for (var i = 0; i < that.TempSqlWhereColumns.length; i++) {
                        var col = new ReportWidgetColumn(that.TempSqlWhereColumns[i]);
                        source.SQLWhereColumns.push(col);
                    }
                    //新sqlcolumn是否包含旧sqlcolumn
                    if (oldsqlcolumn && oldsqlcolumn.length > 0) {
                        var boolNewColumnIncludeOldColumn = true;
                        for (var i = 0; i < oldsqlcolumn.length; i++) {
                            var mycolumnname = oldsqlcolumn[i].ColumnCode;
                            if (!dicSqlcolumns[mycolumnname])
                                boolNewColumnIncludeOldColumn = false;

                        }
                        that.NewColumnIncludeOldColumn = boolNewColumnIncludeOldColumn;
                    }

                    //end新sqlcolumn是否包含旧sqlcolumn
                    sqlModal.hide();
                } else if (IsDev) {
                    $.IShowWarn('请先校验通过自定义sql语句！');
                    return;
                }
                else {

                    sqlModal.hide();
                }
                //建立左侧并排表
                if (isNew) {
                    that.Obj_AddNewSource(source);
                    that.View_AddNewSource(source, true);
                    //更新过滤条件
                    that.UpdateSqlFilterColumns(source);
                } else {
                    //更新数据源选择的表单
                    that.View_UpdateSource(source, that.NewColumnIncludeOldColumn || (!that.CheckTrue && !IsDev));
                    //修改过滤条件
                    that.UpdateSqlFilterColumns(source);

                    //如果编辑前为目录数据源，后来为自定义SQL数据源
                    if (that.editBeforeSource.SchemaCode && source.IsUseSql) {
                        source.SchemaCode = "";
                        that.EditingSource.IsUseSql = true;
                        that.EditingSource.SchemaCode = "";
                    }
                }
            }
        };
        var sql_CancelAction = function () {
            //当取消选择时，若之前为目录数据源，则恢复SchemaCode
            if (that.editSchemaCode) {
                that.EditingSource.SchemaCode = that.editSchemaCode;
            }
            sqlModal.hide();
        };
        var sql_ReturnToSchemaSel = function () {
            //当取消选择时，若之前为目录数据源，则恢复SchemaCode
            if (that.editSchemaCode) {
                that.EditingSource.SchemaCode = that.editSchemaCode;
            }
            sqlModal.hide();
            that.View_ShowSchemaSelecter(source, $.ReportDesigner.ReportSourceManager.IsNew);
        };
        var actions = [];
        actions.push({
            Text: "确定", CallBack: sql_OkAction, Theme: 'btn_ok'
        });
        actions.push({
            Text: "取消", CallBack: sql_CancelAction, Theme: 'btn_cancel'
        });
        actions.push({
            Text: "返回", CallBack: sql_ReturnToSchemaSel, Theme: 'btn btn-warning btn-custom', 'position': 'left'
        });
        //打开模态窗口（自定义sql页面）
        sqlModal = $.IModal({
            Title: '自定义sql',
            Width: width,
            Height: height,
            OnShowCallback: sqlShownCallback,
            OnHiddenCallback: function () {
                that.SqlEditor.find('input#source-display').val("");
                that.SqlEditor.find('textarea.sql').val("");
                that.SqlEditor.find("div#lstSheetTable").empty();
                that.SqlEditor.find("div#sqlresult").empty();
                var $msg = that.SqlEditor.find('div.msg');
                $msg.removeClass('success').removeClass('error');
                $msg.children('span.text').html('');
                
            },
            Content: that.SqlEditor,
            ToolButtons: actions,
            ShowHeader: true
        });


    },

    UpdateSqlFilterColumns: function (source) {
        if (source.SQLWhereColumns && source.SQLWhereColumns.length > 0) {
            for (var i = 0; i < source.SQLWhereColumns.length; i++) {
                var field = source.SQLWhereColumns[i];
                //当sqlwherecolumn编码重复的的时候不添加
                //重新渲染过滤字段
                if (field && field.ColumnCode) {
                    //判断是否已经存在，若存在，则取消；error过滤字段的排序，没有考虑
                    var filter = null;
                    filter = $($.ReportDesigner.ReportPage.Filters).filter(function () {
                        return this.ColumnCode == field.ColumnCode;
                    });
                    if (filter && filter.length > 0) {
                        continue;
                    }
                    $.ReportDesigner.FilterPanel.find(".myhelper").hide();
                    var filterType = null;
                    if (field.ColumnType == _DefaultOptions.ColumnType.Numeric + '') {
                        filterType = _DefaultOptions.FilterType.Numeric;
                    } else if (field.ColumnType == _DefaultOptions.ColumnType.DateTime + '') {
                        filterType = _DefaultOptions.FilterType.DateTime;
                    } else if (field.ColumnType == _DefaultOptions.ColumnType.SingleParticipant + '' ||
                        field.ColumnType == _DefaultOptions.ColumnType.MultiParticipant + '') {
                        filterType = _DefaultOptions.FilterType.Organization;
                    } else if (field.ColumnType == _DefaultOptions.ColumnType.String + '') {
                        if (field.OptionalValues && (!$.isEmptyObject(JSON.parse(field.OptionalValues)) || field.DataDictItemName)) {
                            filterType = _DefaultOptions.FilterType.FixedValue;
                        }
                        else {
                            filterType = _DefaultOptions.FilterType.String;
                        }
                    } else if (field.ColumnType == _DefaultOptions.ColumnType.Association + '') {
                        filterType = _DefaultOptions.FilterType.Association;
                    }
                    else if (field.ColumnType == _DefaultOptions.ColumnType.Boolean) {
                        filterType = _DefaultOptions.FilterType.Boolean;
                    }
                    else if (field.ColumnType == _DefaultOptions.ColumnType.Address) {
                        filterType = _DefaultOptions.FilterType.String;
                    }
                    var reportFilter = new ReportFilter({
                        ColumnCode: field.ColumnCode,
                        ColumnName: field.ColumnCode,
                        DisplayName: field.DisplayName,
                        ColumnType: field.ColumnType,
                        FilterType: filterType,
                        AssociationSchemaCode: field.AssociationSchemaCode,
                        IsSqlWhere: true,
                    });
                    reportFilter.AllowNull = false;
                    $.ReportDesigner.ReportPage.Filters.push(reportFilter);
                    //DOM 操作
                    var parameter = $.ReportDesigner.RenderFilterColumn(reportFilter);
                    $.ReportDesigner.FilterPanel.append(parameter);

                }
            }
        }
    },
    //设置数据源可操作，活动正常颜色显示，其他灰显
    View_SetSourceEnabled: function (sourceId) {
        $('li.source[data-sourceid="' + sourceId + '"]').removeClass('disabled');
        $('li.source[data-sourceid!="' + sourceId + '"]').addClass('disabled');
    },
    //设置除此外的所有数据源不可操作，活动正常颜色显示，其他灰显
    View_SetSourceDisabled: function (sourceId) {
        $('li.source[data-sourceid!="' + sourceId + '"]').addClass('disabled');
        $('li.source[data-sourceid="' + sourceId + '"]').removeClass('disabled');
    },
    //设置所有数据源可编辑
    View_SetAllSourceEnabled: function () {
        $('li.source').removeClass('disabled');
    },
    //设置所有数据源不可编辑
    View_SetAllSourceDisabled: function () {
        $('li.source').addClass('disabled');
    },
    //初始化数据源选择树
    /**
    *container 应用数容器
    *events 应用树操作事件数组
    */
    View_InitAppTree: function (container, events, SCode) {
        var that = this;
        var setting = {
            displayType: AppTree.DisplayType.Fixed,
            showSubSheet: true,
            showSubSheetField: false,
            showAssociation: true,
            showField: false,
            showSystem: false,
            showFunction: false,
            showBizProperties: false,
            showAssociationField: true,
            showOrganization: false,
            showCheckbox: true,
            chkStyle: 'checkbox',
            chkDisableInherit: true,
            canCheckTypes: ['AppMenu', 'Association', 'SubSheet'],
            showPost: false,
            events: events,
            target: container,
            SchemeCode: SCode
        };
        AppTree.init(setting);
    },
    //View End
    //渲染sql类型数据源 树形菜单
    View_InitAppTreeTable: function (container, dbcode, events) {
        var that = this;
        var setting = {
            command: "LoadTableAndView",
            displayType: AppTree.DisplayType.Fixed,
            showSubSheet: true,
            showSubSheetField: false,
            showAssociation: true,
            showField: false,
            showSystem: false,
            showFunction: false,
            showBizProperties: false,
            showAssociationField: true,
            showOrganization: false,
            showCheckbox: true,
            chkStyle: 'checkbox',
            chkDisableInherit: true,
            canCheckTypes: [dbcode],
            showPost: false,
            events: events,
            target: container
        };
        AppTree.init(setting);
    },

    //对象操作
    //添加一个数据源
    Obj_AddNewSource: function (source) {
        this.SourceArray.push(source);
    },
    Obj_UpdateSource: function (source) {
        for (var i = 0; i < this.SourceArray.length; i++) {
            if (this.SourceArray[i].ObjectId == source.ObjectID || this.SourceArray[i].ObjectID == source.ObjectID) {
                this.SourceArray[i] = source;
            }
        }
    },
    //根据Id获取数据源
    Obj_GetSourceById: function (sourceId) {
        var source = $(this.SourceArray).filter(function () {
            return this.ObjectID == sourceId;
        });
        if (source) {
            if (source[0] == undefined) {
                for (var i = 0; i < source.prevObject.length; i++) {
                    var obj = source.prevObject[i].ObjectId == undefined ? source.prevObject[i].ObjectID : source.prevObject[i].ObjectId;
                    if (obj == sourceId) {
                        return source.prevObject[i];
                    }

                }

            } else {
                for (var i = 0; i < source.length; i++) {
                    var obj = source[i].ObjectId == undefined ? source[i].ObjectID : source[i].ObjectId;

                    if (obj == sourceId) {
                        return source[i];
                    }

                }
            }

        }
        return null;
    },

    //删除数据源 
    Obj_RemoveSource: function (sourceId, NewColumnIncludeOldColumn, source) {
        var index = -1;
        for (var i = 0, len = this.SourceArray.length; i < len; i++) {
            var obj = this.SourceArray[i].ObjectID == undefined ? this.SourceArray[i].ObjectId : this.SourceArray[i].ObjectID;
            if (obj == sourceId) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            if (NewColumnIncludeOldColumn) {
                this.SourceArray[i] = source;
            }
            else {
                this.SourceArray.splice(index, 1);
                //关联的widget删除字段
                for (var i = 0, len = $.ReportDesigner.ReportPage.ReportWidgets.length; i < len; i++) {
                    var reportWidget = $.ReportDesigner.ReportPage.ReportWidgets[i];

                    if (reportWidget.ReportSourceId == sourceId) {
                        reportWidget.Columns = [];
                        reportWidget.Categories = [];
                        reportWidget.Series = [];
                        reportWidget.ReportSourceId = null;
                        $.ReportDesigner.CurrentWidgetDom = $('li.widget[id="' + reportWidget.ObjectId + '"]');
                        reportWidget.draw($.ReportDesigner.CurrentWidgetDom);
                    }
                }
            }

        }
    },
    //应用树节点选择后获取schemacode集合
    Obj_GetSchemaArray: function (reportSource) {
        var schemaCodes = [];
        if (reportSource.SchemaCode) {
            schemaCodes.push(reportSource.SchemaCode);
        }
        if (reportSource.ReportSourceAssociations) {
            for (var i = 0, len = reportSource.ReportSourceAssociations.length; i < len; i++) {
                var asso = reportSource.ReportSourceAssociations[i];
                if (asso.RootSchemaCode && !schemaCodes.contains(asso.RootSchemaCode)) {
                    schemaCodes.push(asso.RootSchemaCode);
                }
                if (!schemaCodes.contains(asso.SchemaCode)) {
                    schemaCodes.push(asso.SchemaCode);
                }
            }
        }
        return schemaCodes;

    },

    //创建数据源的关联关系对象
    Obj_CreateReportAssociation: function (parentCode, nodes) {
        var tmpNode = null, parentNode = null;
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i].Code == parentCode || nodes[i].id == parentCode) {
                parentNode = nodes[i];
                continue;
            }
            if (nodes[i].pId == parentCode) {
                tmpNode = nodes[i];
                break;
            }
        }
        if (tmpNode != null) {
            if (tmpNode.NodeType == "SubSheet") {
                var association = new ReportSourceAssociation();
                association.RootSchemaCode = parentNode.Code;
                association.MasterField = "I" + parentNode.Code + "_ObjectID";
                association.SchemaCode = tmpNode.Code;
                association.SubField = "I" + tmpNode.Code + "_ParentObjectID";
                association.AssociationMode = _DefaultOptions.AssociationMode.Inner;
                association.IsSubSheet = true;
                this.EditingSource.ReportSourceAssociations.push(association);

            } else if (tmpNode.NodeType == "Association") {
                //如果关联对象为子表，待定
                var association = new ReportSourceAssociation();
                association.RootSchemaCode = parentNode.Code;
                association.MasterField = "I" + parentNode.Code + "_" + tmpNode.id;
                association.SchemaCode = tmpNode.Code;
                association.Mode = _DefaultOptions.AssociationMode.Inner;
                association.SubField = "I" + tmpNode.Code + "_ObjectID";
                this.EditingSource.ReportSourceAssociations.push(association);
            }
            this.Obj_CreateReportAssociation(tmpNode.Code, nodes);
        }
    },

    //添加计算字段
    Obj_AddFunctionColumn: function (source, column) {
        if (!source.FunctionColumns) {
            source.FunctionColumns = [];
        }
        source.FunctionColumns.push(column);
    },
    //删除计算字段
    Obj_RemoveFunctionColumn: function (source, columnCode) {

        for (var i = 0, len = source.FunctionColumns.length; i < len; i++) {
            if (columnCode == source.FunctionColumns[i].ColumnCode) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            source.FunctionColumns.splice(index, 1);
        }
    },
    //删除手动添加的关联查询
    Obj_RemoveAssociation: function (schemaCode) {
        var asso = null;
        for (var i = this.EditingSource.ReportSourceAssociations.length - 1; i >= 0; i--) {
            asso = this.EditingSource.ReportSourceAssociations[i];
            if (asso.AssociationMethod == _DefaultOptions.AssociationMethod.Manual && (asso.SchemaCode == schemaCode || asso.RootSchemaCode == schemaCode)) {
                this.View_RemoveSheet(this.EditingSource.ObjectID, asso.SchemaCode);
                this.EditingSource.ReportSourceAssociations.splice(i, 1);
            }
        }

    },

    //对象操作结束

    //Tool
    //获取表单字段
    Tool_GetSchemaFields: function (schemaCode, callback) {
        var that = this;
        var fields = [];
        if (that.CacheSchemaFieldsObj[schemaCode]) {
            fields = that.CacheSchemaFieldsObj[schemaCode];
            if (callback && typeof (callback) == "function") {
                callback(fields);
            }
        } else {
            that.Tool_PostAction('GetSchemas', { 'SchemaCode': schemaCode }, function (data) {
                fields = data.result;
                //添加到表单-字段关系缓存中
                for (var i = fields.length - 1; i >= 0; i--) {
                    if (fields.ColumnType == _DefaultOptions.ColumnType.Association) {
                        fields.splice(i, 1);
                    }
                }
                that.CacheSchemaFieldsObj[schemaCode] = fields;
                if (callback && typeof (callback) == "function") {
                    callback(fields);
                }
            });
        }
    },
    //获取sql语句的字段
    Tool_GetSqlSchemaFileds: function (sql, callback) {
        var that = this;
        that.Tool_PostAction('GetSQLSchemas', { "Sql": sql, DbCode: $("#lstDbConnection").val() }, function (data) {
            callback(data);
        });
    },

    //批量获取指定应用数组的名称集合
    Tool_GetSchemaNames: function (schemaCodes, callback) {
        var that = this;
        var actionName = "GetSheetDisplayNames";
        var param = { 'Codes': schemaCodes.join(';').trim(';') };
        this.Tool_PostAction(actionName, param, function (data) {
            callback.apply(that, [data.Results]);
        });
    },
    //判断是否是手动添加的关联查询表单
    Tool_IsManualAssociationSheet: function (associations, schemaCode) {
        var sheets = null;
        sheets = $(associations).filter(function () {
            return this.AssociationMethod == _DefaultOptions.AssociationMethod.Manual && this.SchemaCode == schemaCode;
        });
        if (!sheets || sheets.length == 0) {
            return false;
        } else {
            return true;
        }
    },

    Tool_PostAction: function (ActionName, Parameter, CallBack) {
        $.ajax({
            type: "POST",
            url: window._PORTALROOT_GLOBAL + "/Report/" + ActionName,
            data: $.extend({
                ActionName: ActionName
            }, Parameter),
            dataType: "json",
            success: CallBack
        });
    },
    Tool_PostAjax: function (Parameter, CallBack) {
        $.ajax({
            type: "POST",
            url: $.Controller.ReportSource.LoadTables,
            data: { dbCode: Parameter },
            dataType: "json",
            success: CallBack
        });
    },

    //Tool End


    //递归取消所有子节点选中
    cancelChecked: function (node) {
        var childs = node.children;
        if (childs) {
            for (var i = 0; i < childs.length; i++) {
                AppTree.getTreeObj().checkNode(childs[i], false, false);
                this.cancelChecked(childs[i]);
            }
        }
    },
    //删除相关数据源下的报表和查询条件
    ReportFilterAndWidgetRmove: function (beforeSource) {
        if (!beforeSource.IsUseSql) {
            // 删除主表查询条件
            for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                if ("I" + beforeSource.SchemaCode == $.ReportDesigner.ReportPage.Filters[j].ColumnCode.split("_")[0]) {
                    $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                    $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                    j = j - 1;
                }
            }
            // 删除子表查询条件
            if (beforeSource.ReportSourceAssociations) {
                for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                    if ($.ReportDesigner.ReportPage.Filters[j].ColumnCode.indexOf("I_" + beforeSource.sourceAssociationSchemaCode.split("___")[1]) != -1) {
                        $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                        $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                        j = j - 1;
                    }
                }
            }
        } else { // 删除自定义SQL查询条件
            for (var k = 0; k < beforeSource.SqlColumns.length; k++) {
                for (var j = 0; j < $.ReportDesigner.ReportPage.Filters.length; j++) {
                    if (beforeSource.SqlColumns[k] == $.ReportDesigner.ReportPage.Filters[j].ColumnCode) {
                        $.ReportDesigner.FilterPanel.find("li[data-code='" + $.ReportDesigner.ReportPage.Filters[j].ColumnCode + "']").remove();
                        $.ReportDesigner.ReportPage.Filters.splice(j, 1);
                        j = j - 1;
                        break;
                    }
                }
            }
        }
        // break;

        if (!$.ReportDesigner.ReportPage.Filters || $.ReportDesigner.ReportPage.Filters.length == 0) {
            $.ReportDesigner.FilterPanel.find(".myhelper").show();
        }

    }

};

