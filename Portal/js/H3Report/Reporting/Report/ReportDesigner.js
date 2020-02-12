
//属性
jQuery.extend({
    //设计器
    ReportDesigner: {      
        Actions: {
            LoadReportData: "LoadReportData",
            SaveReportPage: "SaveReportPage",
            LoadBizObjectSchema: "LoadBizObjectSchema",
        },
        OriginalReportPage: null,
        ReportPage: {},
        SourceData: [],
        ReportSourceManager: null,
        ReportDetailManagers: [],
        ReportChartManager: null,
        WidgetTypeKey: 'widgettype',
        FilterColumns: 4//过滤参数字段
    }
});

//函数
jQuery.extend(
    $.ReportDesigner,
    {
        
        //初始化：可选控件，加载已经有的表单数据
        Init: function (ReportCode) { 
            var that = this;
            this.ReportCode = ReportCode;
            this.DragItem = null;
            this.DragWidget = null;
            this.IsLoaded = false;
            //界面布局控件
            this.TemplatesZone = $("#TemplatesZone");//图形模板区
            this.DesignerZone = $("#report-editor");  //设计区  
            this.WidgetList = $("#widget_wrapper");
            this.FilterPanel = $('#h3_param_container');//过滤参数区

            this.FieldEditPanel = $('#field-edit-panel');
            this.FilterEditPanel = $('div.filter-edit-panel');
            this.FilterFooter = $('#myfiltereditfooter');
            this.DragZone = $('div.drag-more');
            this.SourceFilterPanel = $('div.source-filter-panel');
            this.EditingWidget = null;//当前正在编辑的报表图形
            this.CurrentDragField = {};
            this.CurrentWidgetDom = null;
            this.CurrentSimpleBoard = null;
            this.InitReportSources(this.ReportCode);
            this.LoadReport(this.ReportCode);
            this.IsLoaded = true;
            this.FloatPanel = null;
            this.LinkageWidgetPanel = null;
            this.FloatPanels = [];
            this.DesignerZone.css({ 'height': ($('div.edit-center').height() - 45) + 'px' });
            this.TempColumnType = null;//用于存储正在添加的计算字段返回的类型；
            this.TempFormulaColumn = null;
            this.InitScroll();
            this.IsSaving = false;          
        }, 
        //初始化加载报表数据
        LoadReport: function (ReportCode) {
            if (ReportCode == null || ReportCode == void 0 || ReportCode == "") {
                $.IShowError("", "报表不存在");
                setTimeout(function () { window.close(); }, 500);//提示后关闭
                return;
            }
            var that = this;
            var Parameter = { ReportCode: this.ReportCode };
            this.PostAction(
                this.Actions.LoadReportData,
                Parameter,
                function (data) {
                    that.ReportPage = data.ReportPage;
                    that.DataDictItemsName = data.DataDictItemsName;
                    //初始化报表
                    that.InitReportPage.apply(that);
                    
                   
                    if(data.ErrorMsg)
                    {
                        $.IShowWarn("", data.ErrorMsg);
                    }
                });
        },
        //初始化报表
        InitReportPage: function () {
            var that = this;
            //判断ReportPage是否为空
            if (that.ReportPage == null) {
                //初始化一个空的ReportPage
                var config = {
                    Code: that.ReportCode
                }
                var reportPage = new ReportPage(config);
                that.ReportPage = reportPage;
            }
            //初始化报表模板
            that.LoadReportTemplates.apply(that);
            //初始化报表过滤器
            that.InitReportFilter.apply(that);
            //初始化数据源
            that.InitReportSources.apply(that);
            //初始化报表元widget
            if (that.ReportPage.ReportWidgets != null) {
                for (var i = 0, len = that.ReportPage.ReportWidgets.length; i < len; i++) {
                    that.InitReportWidget.apply(that, [that.ReportPage.ReportWidgets[i]]);
                }
            } else {
                that.ReportPage.ReportWidgets = [];
            }
            that.DragZone.find('span').html(that.ReportPage.ReportWidgets.length + 1);
            //绑定拖拽事件
            that.BindDragEvent();
            that.BindSort();



            that.OriginalReportPage = JSON.stringify(that.ReportPage);
        },
        //初始化渲染加载报表图形
        //加载报表图形控件，填充上方图形模板
        InitReportWidget: function (widget) {
            //图形自己渲染自己
            widget.__proto__ = ReportWidget.prototype;
            //var Widget = new ReportWidget(widget);
            widget.init(this.ReportPage.Filters, null);
        },
        //渲染过滤字段//TODO要统一加一个设置默认过滤条件的地方，现在固定值与数据字典是没有默认过滤条件的，sqlwhere类的过滤条件，默认过滤条件必填
        InitReportFilter: function () {
            var that = this;
            if (this.ReportPage.Filters == null) {
                this.ReportPage.Filters = [];
            }
            that.InitDataDictItemsName();
            //展示
            if (this.ReportPage.Filters.length > 0) {
                this.FilterPanel.find(".myhelper").hide();
                for (var i = 0, len = this.ReportPage.Filters.length; i < len; i++) {
                    var filter = this.ReportPage.Filters[i];
                    var parameter = that.RenderFilterColumn(filter);
                    this.FilterPanel.append(parameter);
                }
            }
            else {
                this.FilterPanel.find(".myhelper").show();
            }

            //绑定拖曳事件
            this.FilterPanel.on('mousemove', function () {
                if (!$(this).hasClass('over')) {
                    $(this).addClass('over');
                }
            });
            this.FilterPanel.on('mouseup', function () {
                $(this).hasClass('over') && $(this).removeClass('over');
                if (!$.ReportDesigner.DragItem)
                    return;
                //新增过滤参数
                var field = that.CurrentDragField;
                if (field && field.Code) {
                    //判断是否已经存在，若存在，则取消；error过滤字段的排序，没有考虑
                    var filter = null;
                    filter = $(that.ReportPage.Filters).filter(function () {
                        return this.ColumnCode == field.Code;
                    });
                    if (filter && filter.length > 0) {
                        $.IShowWarn('字段已存在，请检查！');
                        that.CurrentDragField = null;
                        return;
                    }
                    if (field.DataType == _DefaultOptions.ColumnType.MultiParticipant + '') {
                        $.IShowWarn('多参与者类型不能配置为筛选条件！');
                        that.CurrentDragField = null;
                        return;
                    }
                    that.FilterPanel.find(".myhelper").hide();
                    var filterType = null;
                    if (field.DataType == _DefaultOptions.ColumnType.Numeric + '') {
                        filterType = _DefaultOptions.FilterType.Numeric;
                    } else if (field.DataType == _DefaultOptions.ColumnType.DateTime + '') {
                        filterType = _DefaultOptions.FilterType.DateTime;
                    } else if (field.DataType == _DefaultOptions.ColumnType.SingleParticipant + '' ||
                        field.DataType == _DefaultOptions.ColumnType.MultiParticipant + '') {
                        filterType = _DefaultOptions.FilterType.Organization;
                    } else if (field.DataType == _DefaultOptions.ColumnType.String + '') {
                        if (field.OptionalValues && (!$.isEmptyObject(JSON.parse(field.OptionalValues)) || field.DataDictItemName)) {
                            filterType = _DefaultOptions.FilterType.FixedValue;
                        }
                        else {
                            filterType = _DefaultOptions.FilterType.String;
                        }
                    } else if (field.DataType == _DefaultOptions.ColumnType.Association + '') {
                        filterType = _DefaultOptions.FilterType.Association;
                    }
                    else if (field.DataType == _DefaultOptions.ColumnType.Boolean) {
                        //filterType = _DefaultOptions.FilterType.FixedValue;
                        filterType = _DefaultOptions.FilterType.Boolean;
                    }
                    else if (field.DataType == _DefaultOptions.ColumnType.Address) {
                        filterType = _DefaultOptions.FilterType.String;
                    }
                    var reportFilter = new ReportFilter({
                        ColumnCode: field.Code,
                        ColumnName: field.Code,
                        DisplayName: field.DisplayName,
                        ColumnType: field.DataType,
                        FilterType: filterType,
                        AssociationSchemaCode: field.AssociationSchemaCode
                    });
                    //设置布尔型过滤条件的值
                    if (reportFilter.FilterType == _DefaultOptions.FilterType.Boolean) {
                        reportFilter.FilterValue = '是;否';
                    }

                    that.ReportPage.Filters.push(reportFilter);
                    //DOM 操作
                    var parameter = that.RenderFilterColumn(reportFilter);
                    that.FilterPanel.append(parameter);
                    $.ReportDesigner.DragItem.remove();
                    $.ReportDesigner.DragItem = null;
                    that.CurrentDragField = null;
                }


            });
            // 排序
            $("#h3_param_container").sortable({
                helper: "clone",
                cursor: 'move',
                handle: '.cell-title',
                items: '.parameter-cell',
                cancel: ".notdrag,.cell-edit,.cell-remove",
                opacity: 1,
                placeholder: "myplace_holder_parameter_cell",
                revert: true,
                tolerance: "intersect",
                scrollSensitivity: 5,
                scroll: true,
                scrollSpeed: 20,
                start: function (e, ui) {
                    var $this = $(ui.item[0]);
                    var placeholder = $(this).find(".myplace_holder_parameter_cell");
                    var width = $this.css("width");
                    var height = $this.css("height");
                    placeholder.css("width", width).css("height", height);
                },
                over: function (e, ui) {
                },
                stop: function (e, ui) {
                    var newFilters = [];
                    var tempdicfilters = {};
                    for (var i = 0; i < that.ReportPage.Filters.length; i++) {
                        var filter = that.ReportPage.Filters[i];
                        tempdicfilters[filter.ColumnCode] = filter;
                    }
                    that.FilterPanel.find(".parameter-cell").each(function () {
                        var code = $(this).attr("data-code");
                        newFilters.push(tempdicfilters[code]);
                    });
                    that.ReportPage.Filters = newFilters;
                },
                out: function (e, ui) { }
            });

            //new Sortable(h3_param_container, {
            //    group: "name",
            //    handler: ".parameter-cell",
            //    draggable: ".parameter-cell",
            //    ghostClass: "myplace_holder_parameter_cell",
            //    onAdd: function () {

            //    },
            //    onUpdate: function () {
            //        var newFilters = [];
            //        var tempdicfilters = {};
            //        for (var i = 0; i < that.ReportPage.Filters.length; i++) {
            //            var filter = that.ReportPage.Filters[i];
            //            tempdicfilters[filter.ColumnCode] = filter;
            //        }
            //        that.FilterPanel.find(".parameter-cell").each(function () {
            //            var code = $(this).attr("data-code");
            //            newFilters.push(tempdicfilters[code]);
            //        });
            //        that.ReportPage.Filters = newFilters;
            //    }
            //});

        },
        //渲染数据字典下拉框
        InitDataDictItemsName: function () {
            var filterMasterData = $("#filter-edit-panel").find('div.filter-MasterData').find('select');
            filterMasterData.append($('<option value="">请选择</option>')) 
            for (var i = 0; this.DataDictItemsName && i < this.DataDictItemsName.length; i++) {
                var value = this.DataDictItemsName[i];
                filterMasterData.append($('<option value="' + value.id + '">' + value.text + '</option>'))
            }
            //add by xc
            //filterMasterData.DropDownList("Refresh");
        },
        //渲染数据源
        InitReportSources: function () {
            var that = this;
            if (!that.ReportPage.ReportSources) {
                that.ReportPage.ReportSources = [];
            }
            that.ReportSourceManager = new ReportSourceManager(that.ReportPage);
            that.ReportSourceManager.Init();

        },
        //渲染过滤参数
        RenderFilterColumn: function (column) {
            var that = this, floatPanel = null;
            var $cell = $('<li class="parameter-cell">').attr('data-code', column.ColumnCode).attr('data-type', column.ColumnType);
            var $title = $('<div class="cell-title">');
            var $title_name = $('<span class="cell-display">' + column.DisplayName + '</span>');
            var $title_edit = $('<span class="cell-edit iconReport-edit-outline" style="color:#e9bc33;font-size:18px;    cursor: pointer;"></span>');
            var $title_remove = $('<span class="cell-remove iconReport-remove-outline" style="color:#cb4c4c;font-size:18px;    cursor: pointer;"></span>');
            var $body = $('<div class="cell-body"></div>');
            $title.append($title_name);
            $title.append($title_edit);
            if (!column.IsSqlWhere) {
                $title.append($title_remove);
            }
            $cell.append($title);
            //判断拖动的字段数据类型
            if (column.ColumnType == _DefaultOptions.ColumnType.Numeric ||
                column.ColumnType == _DefaultOptions.ColumnType.DateTime) {
                var $limitStart = $('<div class="limit-item"><input class="limit-input" /></div>');
                var $limitTo = $('<div class="limit-item limit-to">-</div>');
                var $limitEnd = $('<div class="limit-item"><input class="limit-input" /></div>');
                $body.append($limitStart);
                $body.append($limitTo);
                $body.append($limitEnd);
            } else if (column.ColumnType == _DefaultOptions.ColumnType.String ||
                column.ColumnType == _DefaultOptions.ColumnType.SingleParticipant ||
                column.ColumnType == _DefaultOptions.ColumnType.MultiParticipant ||
                column.ColumnType == _DefaultOptions.ColumnType.Association ||
                column.ColumnType == _DefaultOptions.ColumnType.Address ||
                column.ColumnType == _DefaultOptions.ColumnType.Boolean
                ) {
                var $item = $('<div class="limit-item"><input class="limit-input"></div>');
                $body.append($item);
            }
            $cell.append($body);
            //绑定事件--删除
            $title_remove.unbind('click').bind('click', function () {
                var parameter = $(this).closest('li.parameter-cell');
                var columnCode = parameter.attr('data-code');
                var index = -1;
                for (var i = 0, len = that.ReportPage.Filters.length; i < len; i++) {
                    if (that.ReportPage.Filters[i].ColumnCode == columnCode) {
                        index = i;
                        break;
                    }
                }
                if (index != -1) {
                    that.ReportPage.Filters.splice(index, 1);
                }
                parameter.remove();
                if (!that.ReportPage.Filters || that.ReportPage.Filters.length == 0)
                    that.FilterPanel.find(".myhelper").show();
                that.FloatBoxHide();
            });
            //绑定事件--编辑
            $title_edit.unbind('click').bind('click', function () {
                $.ReportDesigner.FloatBoxHide();
                var parameter = $(this).closest('li.parameter-cell');
                var columnCode = parameter.attr('data-code');
                var columnType = parameter.attr('data-type');
                var curFilterColumn = null;
                for (var i = 0, len = that.ReportPage.Filters.length; i < len; i++) {
                    if (that.ReportPage.Filters[i].ColumnCode == columnCode) {
                        curFilterColumn = that.ReportPage.Filters[i];
                        break;
                    }
                }
                var target = $(this);
                floatPanel = $(this).FloatBox({
                    'offsetHeight': 3,
                    'minLeft': 10,
                    'height': 400,
                    'width': 620,
                    'baseDom': $(this).closest('div.cell-title').get(0),
                    'target': $('div.float-panel'),
                    'actions': [{ title: "abc", callback: function () { } }],
                    'documentClickVisible': false,
                    'shownCallback': function () {

                        $('div.float-panel').empty();
                        that.FilterEditPanelCopy = that.FilterEditPanel.clone(true);
                        //var filterPanel = that.FilterEditPanel;
                        var filterPanel = that.FilterEditPanelCopy;
                        //加确认取消按钮
                        var $Footer = that.FilterFooter;
                        $Footer.find(".btn_ok").unbind("click").bind("click", function () {
                            if ($.ReportDesigner.FloatPanels.length > 0) {
                                var num = $.ReportDesigner.FloatPanels.length;
                                for (var i = num; i > 0; i--) {
                                    var item = $.ReportDesigner.FloatPanels[i - 1];
                                    item.hide();
                                }
                            }

                        });
                        $Footer.find(".btn_cancel").unbind("click").bind("click", function () {
                            if ($.ReportDesigner.FloatPanels.length > 0) {
                                var num = $.ReportDesigner.FloatPanels.length;
                                for (var i = num; i > 0; i--) {
                                    var item = $.ReportDesigner.FloatPanels[i - 1];
                                    item.onlyhide();
                                }
                            }
                        });
                        $('div.float-panel').append(filterPanel);
                        $('div.float-panel').append($Footer);
                        //that.FilterEditPanel.show();
                        that.FilterEditPanelCopy.show();
                        $Footer.show();
                        var filterName = filterPanel.find('div.filter-name').find('input');
                        filterName.val(curFilterColumn.DisplayName);//显示名称
                        var filterType = filterPanel.find('div.filter-type').find('select');//参数过滤类型，根据具体类型判断
                        //var filterDefaultString = $('div.filter-value-string');
                        var filterDefaultString = filterPanel.find("div.filter-value-string");
                        if (curFilterColumn.FilterType == _DefaultOptions.FilterType.String || curFilterColumn.FilterType == _DefaultOptions.FilterType.Numeric) {
                            filterDefaultString.find('input').val(curFilterColumn.FilterValue);//参数过滤值 不一定有值，根据具体类型判断
                        }
                        //var filterDefaultSelect = $('div.filter-value-select'); //特定类型参数过滤值
                        var filterDefaultSelect = filterPanel.find("div.filter-value-select");
                        //var filterFixed = $('div.filter-value-fixed');//固定值选项
                        var filterFixed = filterPanel.find("div.filter-value-fixed");
                        if (curFilterColumn.FilterType == _DefaultOptions.FilterType.FixedValue) {
                            filterFixed.find('input').val(curFilterColumn.FilterValue);
                        }
                        //var filterOrganizationtype = $('div.filter-organizationtype');//组织类型
                        var filterOrganizationtype = filterPanel.find("div.filter-organizationtype");
                        filterOrganizationtype.find('select').val(curFilterColumn.OrganizationType);
                        //流程模板类型
                        //var filterWorkflowtenple = filterPanel.find("");
                        if (column.IsSqlWhere) {
                            filterPanel.find('div.filter-allownull').hide();
                        }
                        else {
                            filterPanel.find('div.filter-allownull').show();
                        }
                        var filterAllowNull = filterPanel.find('div.filter-allownull').find('input');//是否可以为空
                        filterAllowNull.prop('checked', curFilterColumn.AllowNull);
                        var filterVisible = filterPanel.find('div.filter-visible').find('input');//是否显示
                        filterVisible.prop('checked', curFilterColumn.Visible);
                        var filterMasterData = filterPanel.find('div.filter-MasterData');
                        filterType.empty();

                        var tools = filterPanel.find('div.filter-tools'); //工具栏
                        if (columnType == _DefaultOptions.ColumnType.String) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.String + '">字符查询</option>'));
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.Organization + '">组织机构</option>'));
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.WorkflowTemple + '">流程模板</option>'));
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.FixedValue + '">固定值</option>'));
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.MasterData + '">数据字典</option>'));


                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.String;
                            }
                        } if (columnType == _DefaultOptions.ColumnType.SingleParticipant ||
                            columnType == _DefaultOptions.ColumnType.MultiParticipant) {
                            //filterType.append($('<option value="' + _DefaultOptions.FilterType.String + '">字符查询</option>'));
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.Organization + '">组织机构</option>'));

                            filterType.append($('<option value="' + _DefaultOptions.FilterType.FixedValue + '">固定值</option>'));


                            if (curFilterColumn.FilterType == void 0) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.Organization;
                            }
                        }
                        else if (columnType == _DefaultOptions.ColumnType.Numeric) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.Numeric + '">数字范围</option>'));

                            filterType.append($('<option value="' + _DefaultOptions.FilterType.FixedValue + '">固定值</option>'));
                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.Numeric;
                            }
                        } else if (columnType == _DefaultOptions.ColumnType.DateTime) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.DateTime + '">时间范围</option>'));
                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.DateTime;
                            }
                        } else if (columnType == _DefaultOptions.ColumnType.Association) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.Association + '">关联查询</option>'));

                            filterType.append($('<option value="' + _DefaultOptions.FilterType.FixedValue + '">固定值</option>'));
                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.Association;
                            }
                        } else if (columnType == _DefaultOptions.ColumnType.Boolean) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.Boolean + '">固定值</option>'));
                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.Boolean;// _DefaultOptions.FilterType.FixedValue;
                            }
                        } else if (columnType == _DefaultOptions.ColumnType.Address) {
                            filterType.append($('<option value="' + _DefaultOptions.FilterType.String + '">字符查询</option>'));
                            if (!curFilterColumn.FilterType) {
                                curFilterColumn.FilterType = _DefaultOptions.FilterType.String;
                            }
                        }

                        filterType.val(curFilterColumn.FilterType);
                        if (curFilterColumn.FilterType == _DefaultOptions.FilterType.MasterData) {
                            filterMasterData.find("select").val(curFilterColumn.FilterValue);
                            //filterMasterData.find("select").val(curFilterColumn.FilterValue).change();
                        }

                        //add by xc
                        //filterType.DropDownList("Refresh");

                        ////绑定事件
                        //filterOrganizationtype.find('select').bind('change', function () {
                        //    curFilterColumn.OrganizationType = $(this).val();
                        //});
                        //过滤类型事件
                        filterType.bind('change', function () {
                            console.log("filterType change");
                            var curVal = $(this).val();
                            //curFilterColumn.FilterType = curVal;
                            $(".sheetuser-div").hide();
                            if (curVal == _DefaultOptions.FilterType.String + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.hide();
                                filterDefaultString.show();
                                //filterDefaultString.find("input").val("");
                                filterDefaultString.find("input").attr("placeholder", '多个值用";"隔开');
                                filterFixed.hide();
                                filterMasterData.hide();
                            } else if (curVal == _DefaultOptions.FilterType.WorkflowTemple + '') {
                                filterDefaultString.hide();
                                filterDefaultSelect.hide();
                                filterMasterData.hide();
                                filterOrganizationtype.hide();
                                filterFixed.hide();
                            } else if (curVal == _DefaultOptions.FilterType.Organization + '') {
                                filterOrganizationtype.show();
                                filterDefaultSelect.show();
                                filterDefaultString.hide();
                                filterFixed.hide();
                                filterDefaultSelect.find('select').empty();
                                filterDefaultSelect.find('select').append($('<option  value="">-请选择-</option>'));
                                filterDefaultSelect.find('select').append($('<option value="1">本人</option>'));
                                filterDefaultSelect.find('select').append($('<option value="2">本部门</option>'));
                                //filterDefaultSelect.find('select').append($('<option value="3">所有</option>'));
                                filterMasterData.hide();
                            } else if (curVal == _DefaultOptions.FilterType.FixedValue + '') {
                                

                                filterDefaultSelect.hide();
                                filterDefaultString.hide();
                                filterMasterData.hide();
                                if (columnType == _DefaultOptions.ColumnType.Boolean) {
                                    filterFixed.hide();
                                }
                                else {
                                    filterFixed.show();
                                }

                                if (curFilterColumn.ColumnType == _DefaultOptions.ColumnType.SingleParticipant ||
                                    curFilterColumn.ColumnType == _DefaultOptions.ColumnType.MultiParticipant) {
                                    filterOrganizationtype.show();
                                    filterFixed.hide();
                                    $(".sheetuser-div").show();
                                    filterOrganizationtype.find('select').change();
                                } else {
                                    filterOrganizationtype.hide();
                                }

                            } else if (curVal == _DefaultOptions.FilterType.Boolean + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.hide();
                                filterDefaultString.hide();
                                filterMasterData.hide();
                                filterFixed.hide();
                            }
                            else if (curVal == _DefaultOptions.FilterType.DateTime + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.show();
                                filterDefaultString.hide();
                                filterFixed.hide();
                                filterDefaultSelect.find('select').empty();
                                filterDefaultSelect.find('select').append($('<option value="">-请选择-</option>'));
                                filterDefaultSelect.find('select').append($('<option value="1">当天</option>'));
                                filterDefaultSelect.find('select').append($('<option value="2">本周</option>'));
                                filterDefaultSelect.find('select').append($('<option value="3">本月</option>'));
                                filterDefaultSelect.find('select').append($('<option value="4">本季度</option>'));
                                filterDefaultSelect.find('select').append($('<option value="5">本年度</option>'));
                                filterMasterData.hide();
                            } else if (curVal == _DefaultOptions.FilterType.Numeric + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.hide();
                                filterDefaultString.show();
                                filterDefaultString.find("input").attr("placeholder", '请输入最小值和最大值,并用";"隔开');
                                filterFixed.hide();
                                filterMasterData.hide();
                                filterDefaultSelect.find('select').empty();
                            } else if (curVal == _DefaultOptions.FilterType.Association + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.hide();
                                filterDefaultString.hide();
                                filterFixed.hide();
                                filterMasterData.hide();
                                filterDefaultSelect.find('select').empty();
                            } else if (curVal == _DefaultOptions.FilterType.MasterData + '') {
                                filterOrganizationtype.hide();
                                filterDefaultSelect.hide();
                                filterDefaultString.hide();
                                filterFixed.hide();
                                filterDefaultSelect.find('select').empty();
                                filterMasterData.show();
                            }

                            filterDefaultSelect.find('select').val(curFilterColumn.FilterValue);
                            //curFilterColumn.FilterType = $(this).val();

                            //add by xc
                            filterDefaultSelect.find('select').DropDownList("Refresh", "90%");
                        });

                        filterType.change();
                       
                        filterOrganizationtype.find('select').bind('change', function () {
                            if (filterType.val() == _DefaultOptions.FilterType.FixedValue) {
                                switch ($(this).val()) {
                                    case "0":
                                        $(".filter-value-user").show();
                                        $(".filter-value-organization").hide();
                                        $(".filter-value-all").hide();
                                        break;
                                    case "1":
                                        $(".filter-value-user").hide();
                                        $(".filter-value-organization").show();
                                        $(".filter-value-all").hide();
                                        break;
                                    case "2":
                                        $(".filter-value-user").hide();
                                        $(".filter-value-organization").hide();
                                        $(".filter-value-all").show();
                                        break;
                                }
                            }
                        });
                        if (curFilterColumn.ColumnType == _DefaultOptions.ColumnType.SingleParticipant ||
                               curFilterColumn.ColumnType == _DefaultOptions.ColumnType.MultiParticipant) {
                           
                            $("#userChoose").SheetUser({ UserVisible: true, OrgUnitVisible: false, IsMultiple: true, Editable: true, Visiable: true });
                            $("#organizationChoose").SheetUser({ UserVisible: false, OrgUnitVisible: true, IsMultiple: true, Editable: true, Visiable: true });
                            $("#allChoose").SheetUser({ UserVisible: true, OrgUnitVisible: true, IsMultiple: true, Editable: true, Visiable: true });

                            
                            if (curFilterColumn.FilterType == _DefaultOptions.FilterType.FixedValue) {
                                if (curFilterColumn.FilterValue) {
                                    switch (curFilterColumn.OrganizationType + "") {
                                        case "0":
                                            $("#userChoose").SheetUIManager().SetValue(curFilterColumn.FilterValue.split(';'));
                                            break;
                                        case "1":
                                            $("#organizationChoose").SheetUIManager().SetValue(curFilterColumn.FilterValue.split(';'));
                                            break;
                                        case "2":
                                            $("#allChoose").SheetUIManager().SetValue(curFilterColumn.FilterValue.split(';'));
                                            break;
                                    }
                                }
                                filterOrganizationtype.find('select').change();
                            }
                        }
                        
                        that.FilterEditPanelCopy.find("select").DropDownList({ Width: "90%" });
                    },
                    'hiddenCallback': function () {
                        //var filterPanel = that.FilterEditPanel;
                        var filterPanel = that.FilterEditPanelCopy;
                        var filterName = filterPanel.find('div.filter-name').find('input');
                        var filterType = filterPanel.find('div.filter-type').find('select');//参数过滤类型，根据具体类型判断

                        //var filterDefaultString = $('div.filter-value-string');
                        var filterDefaultString = filterPanel.find('div.filter-value-string');
                        //var filterDefaultSelect = $('div.filter-value-select'); //特定类型参数过滤值
                        var filterDefaultSelect = filterPanel.find('div.filter-value-select');
                        //var filterFixed = $('div.filter-value-fixed');//固定值选项
                        var filterFixed = filterPanel.find('div.filter-value-fixed');
                        //var filterOrganizationtype = $('div.filter-organizationtype');//组织类型
                        var filterOrganizationtype = filterPanel.find('div.filter-organizationtype');

                        var filterAllowNull = filterPanel.find('div.filter-allownull').find('input');//是否可以为空
                        var filterVisible = filterPanel.find('div.filter-visible').find('input');
                        var filterMasterData = filterPanel.find('div.filter-MasterData');
                        curFilterColumn.DisplayName = filterName.val();
                        curFilterColumn.AllowNull = filterAllowNull.prop('checked');
                        curFilterColumn.Visible = filterVisible.prop('checked');
                        curFilterColumn.OrganizationType = filterOrganizationtype.find('select').val();
                        curFilterColumn.FilterType = filterType.val();
                        if (curFilterColumn.FilterType == _DefaultOptions.FilterType.String ||
                            curFilterColumn.FilterType == _DefaultOptions.FilterType.Numeric) {
                            curFilterColumn.FilterValue = filterDefaultString.find('input').val();
                        } else if (curFilterColumn.FilterType == _DefaultOptions.FilterType.FixedValue || curFilterColumn.FilterType == _DefaultOptions.FilterType.Boolean) {
                            if (columnType == _DefaultOptions.ColumnType.SingleParticipant || columnType == _DefaultOptions.ColumnType.MultiParticipant) {
                                var chooseArr = [];
                                switch (curFilterColumn.OrganizationType)
                                {
                                    //人员
                                    case "0":
                                        chooseArr = $("#userChoose").SheetUIManager().GetValue();
                                        break;
                                    //部门
                                    case "1":
                                        chooseArr = $("#organizationChoose").SheetUIManager().GetValue();
                                        break;
                                    //全部
                                    case "2":
                                        chooseArr = $("#allChoose").SheetUIManager().GetValue();
                                        break;
                                }
                                if (chooseArr && chooseArr.length > 0) {
                                    curFilterColumn.FilterValue = chooseArr.join(';');
                                } else {
                                    curFilterColumn.FilterValue = "";
                                }
                            } else {
                                curFilterColumn.FilterValue = filterFixed.find('input').val();
                            }
                        } else if (curFilterColumn.FilterType == _DefaultOptions.FilterType.DateTime ||
                            curFilterColumn.FilterType == _DefaultOptions.FilterType.Organization) {
                            curFilterColumn.FilterValue = filterDefaultSelect.find('select').val();
                        } else if (curFilterColumn.FilterType == _DefaultOptions.FilterType.MasterData + '') {
                            curFilterColumn.FilterValue = filterMasterData.find('select').val();
                        } else if (curFilterColumn.FilterType == _DefaultOptions.FilterType.WorkflowTemple + '') {
                            curFilterColumn.FilterValue = "";
                        }
                        that.FilterPanel.find('li.parameter-cell[data-code="' + curFilterColumn.ColumnCode + '"]').find('span.cell-display').html(curFilterColumn.DisplayName);
                    }
                });
                floatPanel.show();
                $.ReportDesigner.FloatPanels.push(floatPanel);

            });

            return $cell;
        },
        //todo  添加图标
        LoadReportTemplates: function () {
            //加载报表模板
            for (var key in ReportTemplates) {
                var template = $('<li>').addClass('drag drag-template').css("color", "#525252");
                var $container = $('<div >').css({ 'margin-top': '15px' });
                var $icon = $('<span>').addClass('icon ' + ReportTemplates[key].Icon);
                $icon.css({ 'font-size': '22px', 'border': '1px dashed silver', 'padding': '4px' });
                $container.append($icon);
                var $displayName = $('<span>').html((ReportTemplates[key].Text || key)).css("font-size", "12px");
                template.append($container);
                template.append($displayName);
                template.attr("data-" + this.WidgetTypeKey, ReportTemplates[key].Type).attr('data-displayname', (ReportTemplates[key].Text || key)).attr('data-icon', ReportTemplates[key].Icon);
                this.TemplatesZone.append(template);
            }
            $('li.drag-template').hover(function () {
                $(this).children('div ').children('span').css('background-color', '#4B9AEE').css('color', '#fff');
            }, function () {
                $(this).children('div').children('span').css('background-color', '#fff').css('color', '#525252');
            });
        },
        //绑定拖拽控件事件
        BindDragEvent: function () {
            var that = this;
            //var sortable = that.DesignerZone;
            console.log("BindDragEvent");

            this.TemplatesZone.find(".drag").each(function () {
                $(this).SimpleDrag();
            });

            that.TemplatesZone.mouseup(function (ev) {
                $('li.targetItem').remove();
                if ($.ReportDesigner.DragItem) {
                    $.ReportDesigner.DragItem = null;
                }

            });

            this.WidgetList.on('mouseup', function (ev) {
                if ($(ev.target).hasClass('h3edit') || $(ev.target).hasClass('h3setting')) {
                    return;
                }
                //拖字段
                if ($.ReportDesigner.DragItem) {
                    //事件分发
                    //判断拖动类型
                    var isField = $.ReportDesigner.DragItem.hasClass('field') ? true : false;
                    $.ReportDesigner.DragItem.remove();
                    $.ReportDesigner.DragItem = null;
                    if (ev.target.id != "widget_wrapper" && ev.target.id != 'report-editor') {
                        if (!isField) {
                            return;
                        }
                        if (!that.EditingWidget) {
                            return;
                        } 
                        if ($(ev.target).closest('li.widget').attr('id') != that.EditingWidget.ObjectId) {
                            return;
                        }
                        if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Detail) {
                            that.ReportDetailManagers[that.EditingWidget.ObjectId].mouseUp(ev);
                        } else if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Bar ||
                            that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Line ||
                            that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Pie ||
                            that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Funnel ||
                            that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Radar
                            ) {
                            if ($(ev.target).closest('div.h3-body').length > 0 && $(ev.target).closest('div.h3-body').parent('li.widget').attr('id') == that.EditingWidget.ObjectId) {
                                $.ReportDesigner.ReportChartManager.mouseupHandle(ev);
                            } else {
                                return;
                            }
                        } else if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                            if (that.CurrentSimpleBoard) {
                                that.CurrentSimpleBoard.mouseUpHandl();
                            }
                        }
                        return;
                    }

                }

            });

            this.DragZone.on('mouseup', function () {
                //拖曳图形模板
                if (that.CurrentDrag) {
                    $('li.targetItem').remove();
                    $.ReportDesigner.DragItem = null;
                    that.SortableStop();
                    $(this).find('span').html((that.WidgetList.find('li.widget').length) + 1);
                }
            });
        },
        BindSort: function () {
            var that = this;
            $("#widget_wrapper").sortable({
                helper: "clone",
                cursor: 'move',
                handle: '.widget-header',
                items: '.widget',
                cancel: ".notdrag,.h3-head-title-input,.h3_head_tools,.h3edit,.h3change,.h3setting,.h3remove",
                opacity: 1,
                placeholder: "myplace_holder",
                revert: true,
                tolerance: "intersect",
                scrollSensitivity: 5,
                scroll: true,
                scrollSpeed: 20,
                start: function (e, ui) {
                    var $this = $(ui.item[0]);
                    var placeholder = $(this).find(".myplace_holder");
                    if ($this.hasClass("colspan-12")) {
                        placeholder.removeClass("colspan-6");
                        placeholder.addClass("colspan-12");
                    }
                    else {
                        placeholder.removeClass("colspan-12");
                        placeholder.addClass("colspan-6");
                    }
                },
                over: function (e, ui) {
                },
                stop: function (e, ui) {
                    var newReportWidgets = [];
                    var tempdicReportWidgets = {};
                    for (var i = 0; i < that.ReportPage.ReportWidgets.length; i++) {
                        var ReportWidget = that.ReportPage.ReportWidgets[i];
                        tempdicReportWidgets[ReportWidget.ObjectId] = ReportWidget;
                    }
                    that.WidgetList.find("li.widget").each(function () {
                        var ObjectId = $(this).attr("id");
                        newReportWidgets.push(tempdicReportWidgets[ObjectId]);
                    });
                    that.ReportPage.ReportWidgets = newReportWidgets;
                },
                out: function (e, ui) { }
            });

        },
        //图形拖拽停止事件
        SortableStop: function () {
            var that = this;
            var $el = null;

            if (this.CurrentDrag == null) {
                return true;
            }
            else {
                var widget_id = $.IGuid(); 
                var widgetType = this.CurrentDrag.data(this.WidgetTypeKey);
                var displayname = this.CurrentDrag.attr('data-displayname');
                //添加控件
                $el = this.RenderControl(widget_id, widgetType, displayname);
                if ($el != null) {
                    this.WidgetList.append($el);
                    that.AddWidgetGuide(widgetType, $el);
                    //$(item).after($el);
                    //$(item).remove();
                    this.BindDragEvent();
                    this.CurrentDrag = null;
                    var config = {
                        ObjectId: widget_id,
                        Code: widget_id,//没怎么用上
                        DisplayName: displayname,
                        WidgetType: widgetType,
                        ColumnTitle: "",
                        RowTitles: "",
                        Columns: [],
                        Categories: [],
                        Series: [],
                        AxisDimension: "",
                        XAxisUnit: "",
                        YAxisUnit: "",
                        IsUseSql: false,
                        DataSourceCoding:"",
                        CommandText: "",
                        SchemaCode: "",
                        ReportSourceId: '',
                        ReportSourceAssociations: null,
                        SortColumns: [],

                    };
                    if (this.ReportPage.ReportWidgets == null) {
                        this.ReportPage.ReportWidgets = [];
                    }
                    var widget = new ReportWidget(config);
                    this.ReportPage.ReportWidgets.push(widget);
                    //设置控件选择
                    this.ControlElementSelected($el);
                }
                this.CurrentDrag = null;
                return true;
            }
        },
        //根据ID查找ReportPage中的ReportWidget对象
        FindWidget: function (widget_id) {
            if (this.ReportPage.ReportWidgets != null) {
                for (var i = 0, len = this.ReportPage.ReportWidgets.length; i < len; i++) {
                    if (this.ReportPage.ReportWidgets[i].ObjectId == widget_id) {
                        return this.ReportPage.ReportWidgets[i];
                    }
                }
            }
            return null;
        },
        //拖拽一个新图形时渲染控件函数
        RenderControl: function (widget_id, widgetType, displayname) {
            var that = this;
            var layout = "colspan-12";
            var $widget = $('<li id="' + widget_id + '" class="widget h3_bg ' + layout + '" style="display:list-item;"></li>');

            //widget 头部
            var $widget_head = $('<div class="h3-head widget-header"></div>');
            //编辑默认数据
            var $widget_head_defaultdata = $('<span class="h3defaultdata iconReport-source"></span>');
            var $widget_head_title = $('<div class="head-container"><span class="iconReport-edit-block" style="font-size:18px;margin-left:3px;color:#e0e1e4;"></span><span class="h3-head-title ">' + displayname + '</span></div>');
            //添加编辑框-编辑标题，默认隐藏
            var $widget_head_title_input = $('<input class="h3-head-title-input"></input>');
            var $widget_tools = $('<div class="h3_head_tools"></div>');

            if (widgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                var $widget_head_addRow = $('<span class="h3addrow iconReport-addrow">');
                var $widget_head_addCol = $('<span class="h3addcol iconReport-addcol"></span>');
                $widget_tools.append($widget_head_addRow);
                $widget_tools.append($widget_head_addCol);
                //绑定事件
                $widget_head_addRow.unbind('click').bind('click', function () {
                    //最大限制2*3
                    if (that.EditingWidget.SimpleBoardRowNumber == 3 || (that.EditingWidget.SimpleBoardColumnNumber == 3 && that.EditingWidget.SimpleBoardRowNumber == 2)) {
                        $.IShowWarn("简易看板最大展示单元格为2*3");
                        return;
                    }
                    that.EditingWidget.SimpleBoardRowNumber += 1;
                    that.EditingWidget.draw(that.CurrentWidgetDom);
                });
                $widget_head_addCol.unbind('click').bind('click', function () {
                    if (that.EditingWidget.SimpleBoardColumnNumber == 3 || (that.EditingWidget.SimpleBoardRowNumber == 3 && that.EditingWidget.SimpleBoardColumnNumber == 2)) {
                        $.IShowWarn("简易看板最大展示单元格为2*3");
                        return;
                    }
                    that.EditingWidget.SimpleBoardColumnNumber += 1;
                    that.EditingWidget.draw(that.CurrentWidgetDom);
                });
            }
            var $widget_head_edit = $('<span class="h3edit iconReport-edit-outline"></span>');
            var $widget_head_change = $('<span class="h3change iconReport-exchange2" ></span>');
            var $widget_head_setting = $('<span class="h3setting iconReport-setting" ></span>');
            var $widget_head_remove = $('<span class="h3remove iconReport-close-outline"></span>');
          
            $widget_head.append($widget_head_title);
            $widget_head.append($widget_head_title_input);
            if (IsDev && widgetType != _DefaultOptions.WidgetType.Combined && widgetType != _DefaultOptions.WidgetType.SimpleBoard && widgetType != _DefaultOptions.WidgetType.Detail)
                $widget_tools.append($widget_head_defaultdata);
            $widget_tools.append($widget_head_edit);
           
            $widget_tools.append($widget_head_setting);
            $widget_tools.append($widget_head_change);
            if (widgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                $widget_head_edit.hide();
                $widget_head_change.hide();
                // $widget_head_setting.hide();
            } else if (widgetType == _DefaultOptions.WidgetType.Detail) {
                $widget_head_change.hide();
            }

            $widget_tools.append($widget_head_remove);
            $widget_head.append($widget_tools);
            $widget.append($widget_head);

            //widget 主题
            var $widget_body = $widget_body = $('<div class="h3-body fixed-height h3-body-' + widgetType + '"></div>');
            $widget.append($widget_body);
            $widget.attr("data-" + this.WidgetTypeKey, widgetType).attr("data-DisplayName", displayname).attr('data-widgetid', widget_id);

            //此处添加提示引导语div
            if (widgetType != _DefaultOptions.WidgetType.SimpleBoard) {
                var $widget_guid = $('<div class="h3-guide h3-guide-' + widgetType + '"></div>');
                $widget.append($widget_guid);
            }

            $widget_head_defaultdata.unbind('click').bind('click', function () {
                if (!that.EditingWidget || $(this).closest('li.widget').attr('data-widgetid') != that.EditingWidget.ObjectId) {
                    that.ControlElementSelected($(this).closest('li.widget'));
                }
                that.EditingWidget.EditDefaultData(that);

            });
            //绑定编辑事件
            $widget_head_title.unbind('click').bind('click', function () {
                if (!that.EditingWidget || $(this).closest('li.widget').attr('data-widgetid') != that.EditingWidget.ObjectId) {
                    that.ControlElementSelected($(this).closest('li.widget'));
                }
                $(this).closest('div.h3-head').find('input.h3-head-title-input').val(that.EditingWidget.DisplayName).show().focus();
                $(this).hide();
            });

            //失去焦点事件
            $widget_head_title_input.blur(function () {
                $(this).hide();
                that.EditingWidget.DisplayName = $(this).val();
                var $span = $(this).closest('div.h3-head').find('span.h3-head-title');
                $span.html($(this).val()).closest("div.head-container").show();
            });
            //回车事件
            $widget_head_title_input.bind('keyup', function (event) {
                if (event.keyCode == '13') {
                    $(this).hide();
                    that.EditingWidget.DisplayName = $(this).val();
                    var $span = $(this).closest('div.h3-head').find('span.h3-head-title');
                    $span.html($(this).val()).closest("div.head-container").show();
                }
            });
            $widget_head_edit.unbind('click').bind('click', function (e) {
                var target = $(this), FloatPanel = null;
                if (!that.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != that.EditingWidget.ObjectId) {
                    that.ControlElementSelected($(target).closest('li.widget'));
                }
                $.ReportDesigner.FloatBoxHide();

                FloatPanel = $(this).FloatBox({
                    'offsetHeight': 6,
                    'height': 300,
                    'width': 250,
                    'baseDom': $(this).closest('li.widget').get(0),
                    'target': $('div.float-panel'),
                    'documentClickVisible': false,
                    'shownCallback': function () {
                        var divFloatPanel = $('div.float-panel');
                        var divFloatPanelBody = $('<div style="widht:100%;height:80%;overflow:auto;">');
                        divFloatPanel.empty();
                        var columns = $.IClone(that.EditingWidget.Columns);
                        var categories = $.IClone(that.EditingWidget.Categories);;
                        var series = $.IClone(that.EditingWidget.Series);
                        var SortColumns = $.IClone(that.EditingWidget.SortColumns);
                        //标题
                        

                        var $ulCategories = $('<ul class="mycolumns categories connectedSortable" data-type="categories"></ul>');
                        var $ulSeries = $('<ul class="mycolumns series connectedSortable" data-type="series"></ul>');
                        if (that.EditingWidget.WidgetType != _DefaultOptions.WidgetType.Detail) {

                            //分类
                            var $title1 = null, $title2 = null;
                            if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Combined) {
                                $title1 = $('<p style="text-align:center;font-weight:bold;"></p>').html('行字段');
                                $title2 = $('<p style="text-align:center;font-weight:bold;"></p>').html('列字段');
                            } else {
                                $title1 = $('<p style="text-align:center;font-weight:bold;"></p>').html('分类字段');
                                $title2 = $('<p style="text-align:center;font-weight:bold;"></p>').html('系列字段');
                            }
                            //饼图和漏斗图不需要分类
                            if (that.EditingWidget.WidgetType != _DefaultOptions.WidgetType.Pie && that.EditingWidget.WidgetType != _DefaultOptions.WidgetType.Funnel) {
                                divFloatPanelBody.append($title1);

                                for (var i = 0, len = categories.length; i < len; i++) {
                                    var $field = $('<li class="column" style="margin-bottom:3px;margin-left:5px;margin-right:5px;"></li>').attr('data-code', categories[i].ColumnCode);
                                    //var $handle = $('<span class="handle fa fa-arrows"></span>');
                                    //$field.append($handle);
                                    var $display = $('<div class="column-title handle">').html(categories[i].DisplayName);

                                    var $tool = $('<div style="float:right"></div>');
                                    var $edit = $('<span style="margin-right:10px;color:#e9bc33;font-size:18px; cursor: pointer;" class="iconReport-edit-outline"></span>');
                                    var $remove = $('<span style="margin-right:10px;color:#cb4c4c;font-size:18px; cursor: pointer;" class="iconReport-remove-outline"></span>');
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
                                var $field = $('<li class="column" style="margin-bottom:3px;margin-left:5px;margin-right:5px;"></li>').attr('data-code', series[i].ColumnCode);
                                //var $handle = $('<span class="handle fa fa-arrows"></span>');
                                //$field.append($handle);
                                var $display = $('<div class="column-title handle">').html(series[i].DisplayName);
                                var $tool = $('<div style="float:right"></div>');
                                var $edit = $('<span style="margin-right:10px;color:#e9bc33;font-size:18px; cursor: pointer;" class="iconReport-edit-outline"></span>');
                                var $remove = $('<span style="margin-right:10px;color:#cb4c4c;font-size:18px; cursor: pointer;" class="iconReport-remove-outline"></span>');
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
                        var $title = $('<p style="text-align:center;font-weight:bold;"></p>').html('值字段');
                        divFloatPanelBody.append($title);
                        var $ul = $('<ul class="mycolumns columns connectedSortable" data-type="columns"></ul>');
                        for (var i = 0, len = columns.length; i < len; i++) {
                            var $field = $('<li class="column" style="margin-bottom:3px;margin-left:5px;margin-right:5px;"></li>').attr('data-code', columns[i].ColumnCode);
                            //var $handle = $('<span class="handle fa fa-arrows"></span>');
                            //$field.append($handle);
                            var $display = $('<div class="column-title handle">').html(columns[i].DisplayName);
                            // var $display = $('<span style="margin:5px;"></span>').html(columns[i].DisplayName);
                            var $tool = $('<div style="float:right"></div>');
                            var $edit = $('<span style="margin-right:10px;color:#e9bc33;font-size:18px; cursor: pointer;" class="iconReport-edit-outline"></span>');
                            var $remove = $('<span style="margin-right:10px;color:#cb4c4c;font-size:18px; cursor: pointer;" class="iconReport-remove-outline"></span>');
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
                        //排序字段

                        var $title_sort = $('<p style="text-align:center;line-height:20px;height:20px;;font-weight:bold;padding-left:28px;">排序字段<span class="sort-add iconReport-new"></span></>');
                        divFloatPanelBody.append($title_sort);
                        var $ulSorts = $('<ul class="sortcolumns" data-type="sortcolumns"></ul>');
                        for (var i = 0, len = SortColumns.length; i < len; i++) {
                            var $field = $('<li class="column" style="margin-bottom:3px;margin-left:5px;margin-right:5px;"></li>').attr('data-code', SortColumns[i].ColumnCode);
                            //var $handle = $('<span class="handle fa fa-arrows"></span>');
                            //$field.append($handle);
                            var $display = $('<div class="column-title handle">').html(SortColumns[i].DisplayName);
                            var $tool = $('<div style="float:right"></div>');
                            var $edit = null;
                            if (SortColumns[i].Ascending) {
                                $edit = $('<span style="margin-right:10px;" class="sort fa fa-sort-alpha-asc"></span>');
                            } else {
                                $edit = $('<span style="margin-right:10px;" class="sort fa fa-sort-alpha-desc"></span>');
                            }
                            var $remove = $('<span style="margin-right:10px;color:#cb4c4c;font-size:18px; cursor: pointer;" class="fa iconReport-remove-outline"></span>');
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
                            //  that.EditingWidget.draw(that.CurrentWidgetDom);

                        });
                        var mycolumns = [];
                        if (that.EditingWidget.Categories) {
                            for (var i = 0; i < that.EditingWidget.Categories.length; i++) {
                                mycolumns.push(that.EditingWidget.Categories[i]);
                            }
                        }
                        if (that.EditingWidget.Series) {
                            for (var i = 0; i < that.EditingWidget.Series.length; i++) {
                                mycolumns.push(that.EditingWidget.Series[i]);
                            }
                        }
                        if (that.EditingWidget.Columns) {
                            for (var i = 0; i < that.EditingWidget.Columns.length; i++) {
                                mycolumns.push(that.EditingWidget.Columns[i]);
                            }
                        }
                        $($ul, $ulCategories, $ulSeries).sortable({
                            handle: '.handle',
                            forcePlaceholderSize: true,
                            connectWith: '.connectedSortable'
                        })
                            .bind('sortupdate', function () {
                                var tmpColumns = [];
                                var $lis = $ul.children('li');
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
                        $($ulSeries, $ulCategories, $ul).sortable({
                            handle: '.handle',
                            forcePlaceholderSize: true,
                            connectWith: '.connectedSortable'
                        })
                            .bind('sortupdate', function () {
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

                        //绑定删除、修改事件
                        divFloatPanelBody.find('ul').find('span.iconReport-edit-outline').unbind('click').bind('click', function (e) {
                            //绑定编辑事件
                            var columnCode = $(this).closest('li.column').attr('data-code');
                            var type = $(this).closest('ul').attr('data-type');
                            that.EditingWidget.showColumnEditPanel(columnCode, this, $(this).closest('div.float-panel').get(0));
                            e.stopPropagation();
                            e.preventDefault();
                        });
                        //删除
                        divFloatPanelBody.find('ul').find('span.iconReport-remove-outline').unbind('click').bind('click', function (e) {
                            if (that.FloatPanels.length > 1) {
                                return;
                            }
                            //绑定删除事件
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

                                    //   that.EditingWidget.draw(that.CurrentWidgetDom);
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

                                    //    that.EditingWidget.draw(that.CurrentWidgetDom);
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

                                    //   that.EditingWidget.draw(that.CurrentWidgetDom);
                                }
                            } else if (type == "sortcolumns") {
                                var index = -1;
                                for (var i = 0, len = SortColumns.length; i < len; i++) {
                                    if (SortColumns[i].ColumnCode == columnCode) {
                                        index = i;
                                        break;
                                    }
                                }
                                if (index != -1) {
                                    SortColumns.splice(index, 1);

                                    //   that.EditingWidget.draw(that.CurrentWidgetDom);
                                }
                            }

                            //判断是否全部删除数据源字段,还原数据源编辑状态
                            if (columns.length == 0 && categories.length == 0 && series.length == 0) {
                                $.ReportDesigner.ReportSourceManager.View_SetAllSourceEnabled();
                            }
                            e.stopPropagation();
                            e.preventDefault();
                        });
                        //添加排序字段
                        divFloatPanelBody.find('p').children('span.sort-add').unbind('click').bind('click', function () { 
                            that.EditingWidget.addSortColumnPanel(this, $(this).closest('div.float-panel').get(0));
                            e.stopPropagation();
                            e.preventDefault();
                        });
                        //排序
                        $ulSorts.find('span.sort').unbind('click').bind('click', function () { 
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
                            //  that.RportPage.EditingWidget.draw($.ReportDesigner.CurrentWidgetDom);
                            e.stopPropagation();
                            e.preventDefault();
                        });
                        divFloatPanel.append(divFloatPanelBody);
                        var divFloatPanelFooter = $('<div style="text-align: center;"  class="fieldeditfloatbutton">');
                        var $buttonleft = $('<button  type="button" class="masBox-btn btn_ok">确认</button>');
                        $buttonleft.unbind("click").bind("click", function () { 
                            that.EditingWidget.Columns = columns;
                            that.EditingWidget.Categories = categories;
                            that.EditingWidget.Series = series;
                            that.EditingWidget.SortColumns = SortColumns;
                            that.EditingWidget.draw(that.CurrentWidgetDom);
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
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        });
                        divFloatPanelFooter.append($buttonleft).append($buttonright);
                        divFloatPanel.append(divFloatPanelFooter);
                    }
                });
                FloatPanel.show();
                that.FloatPanels.push(FloatPanel);
                e.stopPropagation();
                e.preventDefault();
            });
            $widget_head_change.unbind('click').bind('click', function (e) {
                var target = $(this), FloatPanel = null;
                if (!that.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != that.EditingWidget.ObjectId) {
                    that.ControlElementSelected($(target).closest('li.widget'));
                }
                $.ReportDesigner.FloatBoxHide();

                FloatPanel = $(this).FloatBox({
                    'offsetHeight': 6,
                    'height': 120,
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
                        var $ul = $('<ul style="padding:5px;">');
                        for (var i = 0, len = canChangeTypes.length; i < len; i++) {
                            if (canChangeTypes[i] == that.EditingWidget.WidgetType) {
                                continue;
                            } else {
                                if (canChangeTypes[i] == _DefaultOptions.WidgetType.Combined) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-combined"></span>汇总表</li>')
                                } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Line) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-line"></span>折线图</li>')
                                } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Bar) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-bar"></span>柱状图</li>')
                                } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Pie) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-pie"></span>饼图</li>')
                                } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Radar) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-radar"></span>雷达图</li>')
                                } else if (canChangeTypes[i] == _DefaultOptions.WidgetType.Funnel) {
                                    var $li = $('<li style="cursor:pointer;" widget-type="' + canChangeTypes[i] + '"><span style="margin-right:5px;" class="iconReport-report-funnle"></span>漏斗图</li>')
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
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Line;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Line.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Line.Text;
                                    }
                                } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Combined) {
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Combined;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Combined.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Combined.Text;
                                    }
                                } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Bar) {
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Bar;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Bar.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Bar.Text;
                                    }
                                } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Pie) {
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Pie;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Pie.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Pie.Text;
                                    }
                                } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Radar) {
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Radar;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Radar.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Radar.Text;
                                    }
                                } else if ($(this).attr('widget-type') == _DefaultOptions.WidgetType.Funnel) {
                                    that.EditingWidget.WidgetType = _DefaultOptions.WidgetType.Funnel;
                                    if (changeHeadFlag == true) {
                                        HeadElement.html(ReportTemplates.Funnel.Text);
                                        $.ReportDesigner.ReportPage.ReportWidgets[headIndex].DisplayName = ReportTemplates.Funnel.Text;
                                    }
                                }
                                FloatPanel.hide();
                                that.EditingWidget.draw($(target).closest('li.widget'));
                            });
                        });
                    }
                });
                FloatPanel.show();
                that.FloatPanels.push(FloatPanel);
                e.stopPropagation();
                e.preventDefault();
            });

            $widget_head_setting.unbind('click').bind('click', function (e) {
                var target = $(this), FloatPanel = null;
                if (!that.EditingWidget || $(target).closest('li.widget').attr('data-widgetid') != that.EditingWidget.ObjectId) {
                    that.ControlElementSelected($(target).closest('li.widget'));

                }
                $.ReportDesigner.FloatBoxHide();

                FloatPanel = $(this).FloatBox({
                    'offsetHeight': 6,
                    'height': 180,
                    'width': 200,
                    'baseDom': $(this).closest('li.widget').get(0),
                    'target': $('div.float-panel'),
                    'shownCallback': function () {
                        var mywidgetid = $.ReportDesigner.EditingWidget.ObjectId;
                        var FloatPanelBody = $('<div style="height:80%">');
                        var FloatPanelFooter = $('<div class="headsettingfooter">');
                        var ButtonLeft = $('<button  type="button" class="masBox-btn btn_ok">确认</button>');
                        var ButtonRight = $('<button type="button" class="masBox-btn btn_cancel">取消</button>');
                        FloatPanelFooter.append(ButtonLeft).append(ButtonRight);
                        ButtonLeft.unbind('click').bind('click', function () { 
                            var num = $.ReportDesigner.FloatPanels.length;
                            if (num > 1) {
                                for (var i = num - 1; i >=0; i--) {
                                    if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                        $.ReportDesigner.FloatPanels[i].hide();
                                    }
                                    else {
                                        $.ReportDesigner.FloatPanels[i].onlyhide();
                                    }
                                }
                            }
                            else {
                                FloatPanel.hide();
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        });
                        ButtonRight.unbind('click').bind('click', function () { 
                            var num = $.ReportDesigner.FloatPanels.length;
                            if (num > 1) {
                                for (var i = num - 1; i >=0; i--) 
                                    {
                                    if ($.ReportDesigner.FloatPanels[i].opt.documentClickVisible) {
                                        $.ReportDesigner.FloatPanels[i].hide();
                                    }
                                    else {
                                        $.ReportDesigner.FloatPanels[i].onlyhide();
                                    }
                                }
                            }
                            else {
                                FloatPanel.onlyhide();
                            }
                            event.preventDefault();
                            event.stopPropagation();
                        });
                        $('div.float-panel').empty();

                        var $layout = $('<div class="widget-layout"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_myyyll" /><label for="' + mywidgetid + '_myyyll" style="width:100%" >一行两列</label></div>');
                        var $export = $('<div class="widget-export"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_myyxdc" /><label for="' + mywidgetid + '_myyxdc" style="width:100%" >允许导出</label></div>');
                        var $fixrow = $('<div class="widget-fixrowheader"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdhbt" /><label for="' + mywidgetid + '_mygdhbt" style="width:100%" >固定行表头</label></div>');
                        var $fixcol = $('<div class="widget-fixcolheader"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdlbt" /><label for="' + mywidgetid + '_mygdlbt" style="width:100%" >固定列表头</label></div>');
                        var $asso = $('<div class="widget-association"><input type="checkbox" style="margin-right:10px;margin-left:10px;" id="' + mywidgetid + '_mygdbb" /><label for="' + mywidgetid + '_mygdbb" style="width:100%" >联动报表</label></div>');
                        FloatPanelBody.append($layout);
                        FloatPanelBody.append($export);
                        FloatPanelBody.append($fixrow);
                        FloatPanelBody.append($fixcol);
                        FloatPanelBody.append($asso);
                        $layout.find('input').prop('checked', that.EditingWidget.Layout == _DefaultOptions.ReportLayout.TwoColumns);
                        $export.find('input').prop('checked', that.EditingWidget.Exportable);
                        $fixrow.find('input').prop('checked', that.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowHeader
                            || that.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
                        $fixcol.find('input').prop('checked', that.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenColumnHeader
                            || that.EditingWidget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
                        $asso.find('input').prop('checked', that.EditingWidget.LinkageReports && that.EditingWidget.LinkageReports.length > 0);
                        if (that.EditingWidget.WidgetType != _DefaultOptions.WidgetType.Combined) {
                            //只有明细表和汇总表才有导出,只有汇总表有固定表头
                            $export.hide();
                            $fixrow.hide();
                            $fixcol.hide();
                        }
                        if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Detail) {
                            $asso.hide();
                            $export.show();
                        }
                        if (that.EditingWidget.WidgetType == _DefaultOptions.WidgetType.SimpleBoard) {
                            $asso.hide();
                        }
                        //绑定联动报表事件
                        $asso.find('input').bind('change', function () {
                            if (!$(this).is(':checked')) {
                                that.EditingWidget.LinkageReports = [];
                                if (that.LinkageWidgetPanel) {
                                    that.LinkageWidgetPanel.hide();
                                }
                            } else {
                                //调用另一个浮动框
                                var target = $(this); 
                                that.LinkageWidgetPanel = $(this).parent().find("label").FloatBox({
                                    'offsetHeight': 6,
                                    'height': 120,
                                    'width': 150,
                                    'base_x': 'left',
                                    'base_y': 'top',
                                    'baseDom': $('div.float-panel').get(0),
                                    'target': $('div.linkage-widget'),
                                    'shownCallback': function () {
                                        $('div.linkage-widget').empty();
                                        var $chkAll = $('<div><input type="checkbox" style="margin-right:10px;" id="mylinkwidgetcheckall"><label style="width:100%" for="mylinkwidgetcheckall"> 全选</label></div>');
                                        $('div.linkage-widget').append($chkAll); 
                                        for (var i = 0, len = $.ReportDesigner.ReportPage.ReportWidgets.length; i < len; i++) {
                                            if ($.ReportDesigner.ReportPage.ReportWidgets[i].ObjectId != that.EditingWidget.ObjectId) {
                                                var widget = $.ReportDesigner.ReportPage.ReportWidgets[i];
                                                var checkedpro = "";
                                                if (that.EditingWidget.LinkageReports!=null) {
                                                    for (var j = 0; j < that.EditingWidget.LinkageReports.length; j++) {
                                                        if (that.EditingWidget.LinkageReports[j] == $.ReportDesigner.ReportPage.ReportWidgets[i].ObjectId) {
                                                            checkedpro = "checked=checked";
                                                            break;
                                                        }
                                                    }
                                                }
                                                var $widget = $('<div id="' + widget.ObjectId + '"><input type="checkbox" ' + checkedpro + ' id="' + widget.ObjectId + '_input" /><label style="width:100%;" for="' + widget.ObjectId + '_input" >' + widget.DisplayName + '</label></div>');
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
                                        //绑定全选事件
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
                                                linkages.push($(this).parent('div').attr('id'));
                                            }
                                        });
                                        that.EditingWidget.LinkageReports = linkages;
                                    }
                                });
                                that.LinkageWidgetPanel.show();
                                that.FloatPanels.push(that.LinkageWidgetPanel);
                            }
                        });
                        //先设置联动选择，再添加联动弹出层
                        $('div.float-panel').append(FloatPanelBody).append(FloatPanelFooter); 
                        if ($asso.find('input').prop('checked')) {
                            $asso.find('input').change();
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    },
                    'hiddenCallback': function () {
                        var widget = null;
                        var widget_id = $(target).closest('li.widget').attr('data-widgetid');
                        if (widget_id != that.EditingWidget.ObjectId) {
                            widget = that.FindWidget(widget_id);
                        } else {
                            widget = that.EditingWidget;
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
                        $(target).closest('li.widget').find('div.h3-guide').hide();
                    }
                });
                FloatPanel.show();
                that.FloatPanels.push(FloatPanel);


                e.stopPropagation();
                e.preventDefault();
            });

            //绑定删除widget事件
            $widget_head_remove.unbind('click').bind('click', function () {

                if (confirm('您确定要删除吗？')) {
                    if (that.FloatPanels.length > 0) {
                        for (var i = 0, len = that.FloatPanels.length; i < len; i++) {
                            that.FloatPanels[i].hide();
                        }
                    }
                    $(this).closest('li.widget').remove();
                    //清空数据源等关联属性             
                    var index = -1;

                    for (var i = 0, len = that.ReportPage.ReportWidgets.length; i < len; i++) {
                        if (that.ReportPage.ReportWidgets[i].ObjectId == widget_id) {
                            index = i;
                            break;
                        }
                    }
                    if (index >= 0) {
                        that.ReportPage.ReportWidgets.splice(i, 1);
                        that.EditingWidget = null;
                    }
                    that.DragZone.find('span').html($(that.WidgetList).children('li.widget').length + 1);
                    return false;
                }


            });
            //绑定切换选中widget事件
            $widget.unbind('click').bind('click', function () { that.ControlElementSelected.apply(that, [$(this)]); });
            return $widget;
        },
        AddWidgetGuide: function (widgetType, container) {
            var $div_guide = $(container).find('div.h3-guide');
            var widget_width = $(container).find('div.h3-body').width();
            var widget_height = $(container).find('div.h3-body').height();
            var base_top = $(container).position().top;
            $div_guide.css({ 'position': 'absolute', 'z-index': '999', 'text-align': 'center', 'vertical-middle': 'middle' });
            $div_guide.css({ 'top': base_top + (widget_height - 100) / 2, 'left': (widget_width - 100) / 2 });
            //添加具体的指示语
            if (widgetType == _DefaultOptions.WidgetType.Detail) {

                var $p_text = $('<p style="color:#929292;">将需要展示的</br>字段拖到此处</p>').css({ 'word-break': 'break-all' });
                var $p_icon = $('<p class="iconReport-arrow-down"></p>').css({ 'font-size': '50px', 'color': 'orange' });
                $div_guide.append($p_text);
                $div_guide.append($p_icon);

            }
                //todo
            else if (widgetType == _DefaultOptions.WidgetType.Bar ||
                widgetType == _DefaultOptions.WidgetType.Line ||
                widgetType == _DefaultOptions.WidgetType.Pie ||
                widgetType == _DefaultOptions.WidgetType.Radar) {
                var $p_icon = $('<p class="iconReport-arrow-down"></p>').css({ 'font-size': '50px', 'color': 'orange' });
                var $p_text = $('<p style="color:#929292;">将需要展示的字段拖到此处</p>').css({ 'word-break': 'break-all' });
                $div_guide.append($p_text);
                $div_guide.append($p_icon);

            }
            else if (widgetType == _DefaultOptions.WidgetType.Combined) {
                $div_guide.css({ 'top': base_top + 90 + (widget_height - 90) / 2, 'left': (widget_width - 88) / 2 });
                // var $p_icon = $('<p class="fa fa-arrow-right"></p>').css({ 'font-size': '50px', 'color': 'orange' });
                var $p_text = $('<p style="color:#929292;">将值字段拖到</br>此处进行统计</p>').css({ 'word-break': 'break-all' });
                $div_guide.append($p_text);
                // $div_guide.append($p_icon);
            }
            $div_guide.show();
        }, 
        //切换选中报表
        ControlElementSelected: function ($el) { 
            var that = this;
            //如果是当前widget自己，则不处理
            this.CurrentWidgetDom = $el;
            $('li.widget').removeClass('h3-body-selected');
            $($el).addClass('h3-body-selected');
            var widgetId = $($el).attr('data-widgetid');

            if (this.EditingWidget != null && this.EditingWidget.ObjectId == widgetId) {
                return;
            }
            var widget = this.FindWidget(widgetId);
            //var reportWidget = new ReportWidget(widget);
            widget.__proto__ = ReportWidget.prototype;
            this.EditingWidget = widget;
            if (widget.WidgetType != _DefaultOptions.WidgetType.SimpleBoard) {
                if (widget.ReportSourceId) {
                    that.ReportSourceManager.View_SetSourceDisabled(widget.ReportSourceId);
                } else {
                    that.ReportSourceManager.View_SetAllSourceEnabled();
                }
            }
            else
            {
                that.ReportSourceManager.View_SetAllSourceEnabled();
}

            //if (widget.WidgetType != _DefaultOptions.WidgetType.SimpleBoard && $($el).find('div.h3-body').children('div').length > 0) {
            //    return;
            //}
            //todo add filters
            widget.init(this.ReportPage.Filters, $el);
        },
        //根据columncode获取明细表中的一列或者值中的一列
        GetReportWidgetColumn: function (columncode) {
            var that = this;
            for (var i = 0, len = that.EditingWidget.Columns.length; i < len; i++) {
                if (that.EditingWidget.Columns[i].ColumnCode == columncode) {
                    return that.EditingWidget.Columns[i];
                }
            }
        },
        //保存当前报表
        SaveReport: function () {
            var that = this;
            if (!that.IsLoaded || that.IsSaving) return;
            that.IsSaving = true;
            //如果还存在浮动编辑框，隐藏编辑框执行隐藏事件
            if (that.FloatPanels.length > 0) {
                for (var i = that.FloatPanels.length - 1; i >= 0; i--) {
                    that.FloatPanels[i].hide();
                }
            }

            //保存时校验
            if (!this.SaveValidate())
            {
                that.IsSaving = false;
                return ;
            }

            var Parameter = { ReportPageStr: JSON.stringify(that.ReportPage), ReportCode: this.ReportCode };
            this.PostAction(
                this.Actions.SaveReportPage,
                Parameter,
                function (data) {
                    that.IsSaving = false;
                    $.IShowSuccess(data.Msg);

                    that.OriginalReportPage = JSON.stringify(that.ReportPage);

                });

        },
        SaveValidate:function()
        {
            var that = this;
            if (that.ReportPage.ReportWidgets != null && that.ReportPage.ReportWidgets.length > 0) {
                for (var i = 0, len = that.ReportPage.ReportWidgets.length; i < len; i++) {
                    var widget = that.ReportPage.ReportWidgets[i];
                    if (that.ReportPage.ReportWidgets[i].DisplayName == null || that.ReportPage.ReportWidgets[i].DisplayName.trim() == "") {
                        $.IShowWarn('标题不能为空');
                        return false;
                    }
                    if (widget.WidgetType == "Detail" || widget.WidgetType == _DefaultOptions.WidgetType.Detail) {
                        if (widget.Columns.length == 0) {
                            $.IShowWarn(widget.DisplayName + '的字段不能为空');
                            return false;
                        }
                    } else if (widget.WidgetType == "Funnel" || widget.WidgetType == _DefaultOptions.WidgetType.Funnel) {
                        if (widget.Series == null) {
                            $.IShowWarn(widget.DisplayName + '的系列不能为空');
                            return false;
                        } else if (widget.Columns.length == 0) {
                            $.IShowWarn(widget.DisplayName + '的值不能为空');
                            return false;
                        } else if (widget.Columns.length > 1) {
                            $.IShowWarn(widget.DisplayName + '的值只能为1个');
                            return false;
                        }
                    } else if (widget.WidgetType == "Gauge" || widget.WidgetType == _DefaultOptions.WidgetType.Gauge) {
                        if (widget.Series == null) {
                            $.IShowWarn(widget.DisplayName + '的系列不能为空');
                            return false;
                        } else if (widget.Columns.length < 2) {
                            $.IShowWarn(widget.DisplayName + '的目标或完成不能为空');
                            return false;
                        }
                    } else if (widget.WidgetType == "Pie" || widget.WidgetType == _DefaultOptions.WidgetType.Pie) {
                        if (widget.Categories == null || widget.Categories.length == 0) {
                            if (widget.Series == null || widget.Series.length == 0) {
                                $.IShowWarn(widget.DisplayName + '的分类或系列不能为空');
                                return false;
                            }
                        }
                        if (!widget.Columns || widget.Columns.length == 0) {
                            $.IShowWarn(widget.DisplayName + '的值字段不能为空');
                            return false;
                        } else if (widget.Columns.length > 1) {
                            $.IShowWarn(widget.DisplayName + '的值只能为1个');
                            return false;
                        }
                    }
                    else if (widget.WidgetType == "Line" || widget.WidgetType == _DefaultOptions.WidgetType.Line ||
                        widget.WidgetType == "Bar" || widget.WidgetType == _DefaultOptions.WidgetType.Bar ||
                        widget.WidgetType == "Area" || widget.WidgetType == _DefaultOptions.WidgetType.Area ||
                        widget.WidgetType == "Radar" || widget.WidgetType == _DefaultOptions.WidgetType.Radar ||
                        widget.WidgetType == "Combined" || widget.WidgetType == _DefaultOptions.WidgetType.Combined
                        ) {
                        if (widget.Categories == null || widget.Categories.length == 0) {
                            if (widget.Series == null || widget.Series.length == 0) {
                                $.IShowWarn(widget.DisplayName + '的分类或系列不能为空');
                                return false;
                            }
                        } else if (!widget.Columns || widget.Columns.length == 0) {
                            $.IShowWarn(widget.DisplayName + '的值字段不能为空');
                            return false;
                        }
                        else {
                            //if (widget.Categories.length > 4) {
                            //    $.IShowWarn(widget.DisplayName + '的分类字段不能超过两个');
                            //    return;
                            //} else {
                            //    if (widget.Series != null && (widget.Columns != null && widget.Columns.length > 4)) {
                            //        $.IShowWarn(widget.DisplayName + '当分类和系列字段都存在时值字段不能超过两个');
                            //        return;
                            //    }
                            //}
                        }
                    }

                }
            }
            return true;
        },
        //提交数据接口
        PostAction: function (ActionName, Parameter, CallBack) {
            $.ajax({
                type: "POST",
                url: window._PORTALROOT_GLOBAL + "/Report/" + ActionName,
                data: $.extend({ ActionName: ActionName }, Parameter),
                dataType: "json",
                success: CallBack
            });
        },
        InitScroll: function () {
            //$('#h3_param_container').niceScroll({
            //    cursorcolor: "#ccc",
            //    cursoropacitymin: 0.5,
            //    cursoropacitymax: 0.5,
            //    touchbehavior: false,
            //    cursorwidth: "5px",
            //    cursorborder: "0",
            //    cursorborderradius: "5px",
            //    autohidemode: false,
            //    zindex: 10,
            //    cursorminheight: 40,
            //    mousescrollstep: 60
            //});
            //$('#report-editor').niceScroll({
            //    cursorcolor: "#ccc",
            //    cursoropacitymin: 0.5,
            //    cursoropacitymax: 0.5,
            //    touchbehavior: false,
            //    cursorwidth: "5px",
            //    cursorborder: "0",
            //    cursorborderradius: "5px",
            //    autohidemode: false,
            //    zindex: 10,
            //    cursorminheight: 400,
            //    mousescrollstep: 600,
            //    nativeparentscrolling:false,
            //    preservenativescrolling:false
            //});
            //$('#report-editor').scroll(function () {
            //    var ScrollY = $(this)[0].scrollTop;
            //    var ScrollX = $(this)[0].scrollLeft
            //    $FreezenColumnTable.css("top", ScrollY);
            //    if (!CommonFunction.IsMobile()) {
            //        $FreezenRowTable.css("left", ScrollX);
            //        $FreezenOnlyHeaderTable.css("top", ScrollY);
            //        $FreezenOnlyHeaderTable.css("left", ScrollX);
            //    }
            //})
            var maxheight = $("div.left").css("height").replace("px", "") - 54 + "px";
            $('#ReportSourceZone').css("max-height", maxheight).css("padding-bottom", "4px").css("overflow", "auto").css("max-height", "480px");
            //$('#ReportSourceZone').niceScroll({
            //    cursorcolor: "#ccc",
            //    cursoropacitymin: 0.5,
            //    cursoropacitymax: 0.5,
            //    touchbehavior: false,
            //    cursorwidth: "5px",
            //    cursorborder: "0",
            //    cursorborderradius: "5px",
            //    autohidemode: false,
            //    zindex: 10,
            //    cursorminheight: 400,
            //    mousescrollstep: 40
            //});
        },
        FloatBoxHide: function () {
            var that = this;
            if (that.FloatPanels) {
                var num = that.FloatPanels.length;
                for (var i = num - 1; i >= 0; i--) {
                    that.FloatPanels[i].hide();
                }
            }
        },


    }
);