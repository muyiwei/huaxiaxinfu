


$.fn.LoadReportFiters = function (options) {

    //console.log(options)
    var reportViewManager = new ReportViewManager(options.ReportFiters, options.ReportPage, options.SourceCode, null, options.Ionic, options.PortalRoot);
}

$.fn.LoadReportPage = function (options) {
    // console.log(options)
    // var reportViewManager = new ReportViewManager($("#ReportFiters"), $("#ReportPage"), "report123");
}


//公共函数

var CommonFunction = {
    ActionUrl: "/Portal/Reporting/",
    LoadReportPage: "LoadReportPage",
    //加载明细汇总表
    LoadGridData: "LoadGridData",
    //加载图表数据
    LoadChartsData: "LoadChartsData",
    //加载简易看板
    LoadSimpleBoard: "LoadSimpleBoard",
    BizObjectId: "ObjectId",
    //导出明细表或汇总表
    ExportTable: "ExportTable",
    //Post
    Post: function (action, data, callback, async) {
        //var _measure_start = performance.now();
        //固定与后台的交互的入口，入口后根据Command的分发事件
        var paramData = $.extend({ Command: action }, data);
        $.ajax({
            type: "POST",
            url: this.ActionUrl + action,
            async: async == undefined ? true : async,
            data: paramData,
            dataType: "json",
            success: function (data) {
                //var _measure_end = performance.now();
                //console.log(action + " load time : " + (_measure_end - _measure_start) + "ms");
                if ($.isFunction(callback)) callback.apply(this, [data]);
            },
            error: function (errorData) {
                $.IShowError("数据源表单可能被删除!");
                if ($.isFunction(callback)) {
                    callback.apply(this, [errorData]);
                }
            }
        });
    },
    //读取函数的显示名称
    GetFunctionDisplayName: function (FunctionType) {
        switch (parseInt(FunctionType)) {
            case _DefaultOptions.Function.Count:
                return "统计";
            case _DefaultOptions.Function.Sum:
                return "求和";
            case _DefaultOptions.Function.Avg:
                return "平均";
            case _DefaultOptions.Function.Min:
                return "最小值";
            case _DefaultOptions.Function.Max:
                return "最大值";
        }
    },
    //显示没有数据
    ShowNoneItemImg: function ($container) {
        var rootcode = $container.context.URL.split('/');
        var $img = $("<img src='/" + rootcode[3] + "/css/H3Report/img/NoneReport.png' />").css("margin-top", "3%");
        $container.html("").css("text-align", "center").append($img).append("<div style='color: #dadada;font-size:16px;margin-top: 5px;'>暂无图表数据</div>");
    },
    color: ["#69aae9", "#82ba86", "#f3d87c", "#ef8077", "#f4779c", "#b4a3fa"],
    DetailRowNumber: "DetailRowNumber",
    StringToArray: function (str, iscategories, isseries) {
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
            if (iscategories) {
                itemnew = { key: itemnew, value: itemnew }
            }
            if (isseries) {
                itemnew = { Name: itemnew["Name"], Code: itemnew["Name"], Data: itemnew["Data"] };
            }
            arraynew.push(itemnew);
        }
        return arraynew;
    },
    ArrayToString: function (array) {
        if (array == void 0 || array.length == 0) {
            return "";
        }
        var result = "";
        var newarray = []
        for (var i = 0; i < array.length; i++) {
            var item = array[i];
            newarray.push(JSON.stringify(item));
        }
        return newarray.join(";");
    },
    Colors: ['#4DA9EB', '#00B25E', '#F19333', '#F06065', '#5C7197', "#9D88BF"]
};
//报表展示
window.ReportViewManager = function ($filterContainer, $widgetContainer, reportCode, applist) {
    var that = this;
    this.Options = $.extend({}, _DefaultOptions);
    //报表配置
    this.ReportPage = null;
    //与后台交互的事件
    this.LoadReportPage = "LoadReportPage";
    debugger
    //编码
    this.Code = reportCode;
    //过滤器容器
    this.$FilterContainer = $filterContainer;
    //报表容器
    this.$WidgetContainer = $($widgetContainer);
    // 过滤器
    this.FilterManager = null;
    //bool
    this.boolDic = null;
    //当前用户信息
    this.CurrentUser = null;
    this.applist = applist;
    // 报表管理器集合
    this.ReportManagers = {};
    if (this.applist) {
        that.FilterManager = new FilterManager(null, null, that.CurrentUser, this.boolDic, function () {
            that.ReLoadAllReport.apply(that);
        });
        return;
    }
    this.Init();
};
ReportViewManager.prototype = {
    Init: function () {
        var that = this;
        CommonFunction.Post(CommonFunction.LoadReportPage,
            { Code: this.Code },
            function (data) {
                if (!data.State) {
                    that.$WidgetContainer.html("报表不存在!");
                    return;
                }
                if (that.ValidateReportPage.apply()) {
                    //过滤器构造，把过滤器改变时，触发的事件传过去，也是OnChange的回调函数
                    that.FilterManager = new FilterManager(that.$FilterContainer, data.ReportPage.Filters, that.CurrentUser, that.boolDic, function () {
                        that.ReLoadAllReport.apply(that);
                    });
                }
                that.ReportPage = data.ReportPage;
                that.CurrentUser = data.CurrentUser;
                that.boolDic = data.boolDic;
                //校验
            }, false);
    },
    // 校验
    ValidateReportPage: function () {
        return true;
    },
    //创建报表
    CreateReport: function (widget, mobilehomereport, $scope, UnitFilterDataJson, color) {
        var reportId = widget.ObjectId;
        var reportManager = null;
        var filterData = null;
        if (this.FilterManager) {
            filterData = this.FilterManager.GetValue();
        }
        if (this.ReportManagers[widget.ObjectId] == null) {
            switch (widget.WidgetType) {
                case this.Options.WidgetType.Detail:
                    //明细表
                    this.ReportManagers[widget.ObjectId] = new GridViewManager(this.ReportPage, widget, filterData, this, mobilehomereport, $scope, UnitFilterDataJson);
                    break;
                case this.Options.WidgetType.Combined:
                    //汇总表
                    this.ReportManagers[widget.ObjectId] = new ChartTableManager(this.ReportPage, widget, filterData, this, mobilehomereport, $scope, UnitFilterDataJson);
                    break;
                case this.Options.WidgetType.SimpleBoard:
                    this.ReportManagers[widget.ObjectId] = new SimpleBoardManager(this.ReportPage, widget, filterData, this, mobilehomereport, $scope, UnitFilterDataJson, color);
                    break;
                default:
                    //图表
                    this.ReportManagers[widget.ObjectId] = new ChartManager(this.ReportPage, widget, filterData, this, mobilehomereport, $scope, UnitFilterDataJson);
                    break;
            }
            if (typeof (CurScope) != "undefined" && CurScope) {
                CurScope.$emit('applist.reportloaded');
            }
        }
    },
    // 获取单个报表数据，移动端可调用
    GetReport: function (filterValues, widget, reportPage, notapplist, mobilehomereport, $scope, UnitFilterDataJson, color) {
        if (reportPage) {
            this.ReportPage = reportPage;
        }
        if (this.FilterManager) {
            this.FilterManager.SetValue(filterValues);
        }
        if (!widget)
            return;
        if (this.boolDic && !$.isEmptyObject(this.boolDic)) {
            for (var key in this.boolDic) {
                if (filterValues && filterValues[key] && filterValues[key].length > 0) {
                    if (filterValues[key][0] == "是;" || filterValues[key][0] == "是") {
                        filterValues[key][0] = "1;";
                    } else if (filterValues[key][0] == "否;" || filterValues[key][0] == "否") {
                        filterValues[key][0] = "0;";
                    } else if (filterValues[key] == "是;否;" || filterValues[key] == "是;否") {
                        filterValues[key][0] = "1;0;";
                    }
                }
            }
        }
        if (this.$WidgetContainer.find("#" + widget.ObjectId).length > 0) {
            this.$WidgetContainer.find("#" + widget.ObjectId).remove();
        }
        var $widgetDiv = $("<div>").attr("id", widget.ObjectId).css("height", "100%");
        if (notapplist) {
            this.$WidgetContainer.html("").append($widgetDiv);
        }
        else
            this.$WidgetContainer.append($widgetDiv);

        if (this.ReportManagers[widget.ObjectId] != null) {
            this.ReportManagers[widget.ObjectId].ReLoad(filterValues, UnitFilterDataJson);
        }
        else {
            this.CreateReport(widget, mobilehomereport, $scope, UnitFilterDataJson, color);
        }
    },
    // 刷新接口
    ReLoadAllReport: function () {
        var filterData = this.FilterManager.GetValue();
        for (var code in this.ReportManagers) {
            this.ReportManagers[code].ReLoad(filterData);
        }
    },
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//过滤器管理器
var FilterManager = function (filterContainer, filters, currentUser, boolDic, bindFun) {
    if (filters == null || filters.length == 0) {
        if (filterContainer) {
            filterContainer.remove();
        }
        return;
    }
    this.Filters = $.IClone(filters);
    this.filterValues = {};
    this.CurrentUser = currentUser;
    this.filterContainer = filterContainer;
    this.boolDic = boolDic;
    this.BindFun = bindFun;
    this.Init();
};
FilterManager.prototype = {
    Init: function () {

    },
    SetValue: function (filterValues) {
        this.filterValues = filterValues;
    },
    GetValue: function () {
        return this.filterValues;
    },
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//图表插件
var ChartManager = function (reportPage, widget, filterData, ReportViewManager, mobilehomereport, $scope, UnitFilterDataJson) {
    this.ReportViewManager = ReportViewManager;
    //报表页
    this.ReportPage = reportPage;
    //报表配置
    this.Widget = widget;
    //过滤数据
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
    //报表容器，必然先在页面上占有位置，宽高，才能渲染出来
    this.ElementID = $.IGuid();
    this.$ChartElement = $("<div id='" + this.ElementID + "'>").addClass("echartsbody");
    //edit by xc 图表不需要额外设定高度 不然会上下抖动
    switch (this.Widget.WidgetType) {
        case _DefaultOptions.WidgetType.Line:
        case _DefaultOptions.WidgetType.Bar:
        case _DefaultOptions.WidgetType.Pie:
        case _DefaultOptions.WidgetType.Radar:
        case _DefaultOptions.WidgetType.Funnel: {
            this.$ChartElement.css("height", "100%");
        } break;
        default: {
            this.$ChartElement.css("height", this.$Container.height());
        } break;
    }
    //end

    //this.$ChartElement.css("height", this.$Container.height());
    this.$Container.append(this.$ChartElement);
    //数据源
    this.SourceData = null;
    //数据源的列
    this.SourceColumns = null;
    this.MyChartsDataResult = null;
    this.UnitFilterDataJson = UnitFilterDataJson;
    this.mobilehomereport = mobilehomereport;
    this.$scope = $scope;
    //初始化
    this.Init();
};
ChartManager.prototype = {
    //初始化
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        $("#ReportViewContain").css("width", "100%").find("#" + this.Widget.ObjectId).css("width", "100%").css("overflow", "hidden").css("padding-bottom", "50px");
        var that = this;
        //提示加载中
        that.$ChartElement.html("正在加载数据请稍候...");
        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadChartsData,
            { FilterData: JSON.stringify(that.FilterData), ObjectId: that.Widget.ObjectId,Code:that.ReportPage && that.ReportPage.Code ? that.ReportPage.Code : that.Widget.ParentObjectId, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson) },
            function (data) {
                if (!data.State) {
                    that.$ChartElement.html("数据源不正确!");
                    return;
                }
                if (that.Widget.WidgetType == _DefaultOptions.WidgetType.Area || that.Widget.WidgetType == _DefaultOptions.WidgetType.Gauge) {
                    that.$ChartElement.html("不支持的图表类型!");
                    return;
                }
                that.UnitFilterDataJson = data.UnitFilterDataJson;
                //数据源 数据
                that.SourceData = data.SourceData;
                //数据源 列
                that.SourceColumns = data.SourceColumns;
                that.MyChartsDataResult = data.MyChartsDataResult;
                //开始渲染echarts
                that.BindChart.apply(that, [that.Widget.WidgetType]);
            });
    },
    //渲染报表
    BindChart: function (WidgetType) {
        var ShowDemo = false;
        var chartType = 0;
        var showseries = true;
        if (this.mobilehomereport)
            showseries = false;
        switch (WidgetType) {
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
        var that = this;
        var height = this.$Container.height();
        if (height <= 0)
            height = 400;
        var width = this.$Container.width() - 50;
        width = this.$Container.width();
        if (!that.ReportViewManager.applist) {
            var computerwidth = 0;
            var onewidth = 20;
            for (var key in that.MyChartsDataResult.Categories) {
                computerwidth++;
            }
            if (computerwidth * onewidth > width)
                width = computerwidth * onewidth;
        }
        var Series = that.MyChartsDataResult ? that.MyChartsDataResult.Series : null;
        var Categories = that.MyChartsDataResult ? that.MyChartsDataResult.Categories : null;
        this.$ChartElement.html("");
        if ((!that.MyChartsDataResult.Categories || that.MyChartsDataResult.Categories.length == 0) && (!that.MyChartsDataResult.Series || that.MyChartsDataResult.Series.length == 0 || !that.MyChartsDataResult.Series["Data"] || that.MyChartsDataResult.Series["Data"].length == 0)) {
            ShowDemo = true;
            if (that.Widget.DefaultCategorysData && that.Widget.DefaultSeriesData) {
                var DefaultCategorysData = CommonFunction.StringToArray(that.Widget.DefaultCategorysData, true, false);
                var DefaultSeriesData = CommonFunction.StringToArray(that.Widget.DefaultSeriesData, false, true);
                if (DefaultCategorysData && DefaultSeriesData && DefaultCategorysData.length > 0 && DefaultSeriesData.length > 0) {
                    Series = DefaultSeriesData;
                    Categories = DefaultCategorysData;
                }
                else {
                    CommonFunction.ShowNoneItemImg(that.$ChartElement);
                    return;
                }
            }
        }
        //add by xc 解决js内存泄漏
        if (this.ChartObject) {
            this.ChartObject.clear();
            this.ChartObject = null;
        }
        this.ChartObject = this.$ChartElement.ChartBase({
            ChartType: chartType,
            Width: this.$Container.width(),
            Height: this.$Container.height(),
            BarGap: 5,
            Series: Series,
            Categories: Categories,
            ShowSeries: showseries,
            setCfg: false,
            ShowDemo: ShowDemo,
            ClickChartCBack: function (ret) {
                //联动,作为查询条件；
                that.FilterData = {};
                var UnitFilterDataJson = [];
                var UnitWidget = that.Widget;
                var serievalue = ret.SeriesCode;
                var CategorieValue = ret.CateCode;
                var seriecode = "";
                if (that.Widget.Series && that.Widget.Series.length > 0)
                    seriecode = that.Widget.Series[0];
                var categoriecode = "";
                if (that.Widget.Categories && that.Widget.Categories.length > 0)
                    categoriecode = that.Widget.Categories[0];

                //分类
                if (that.MyChartsDataResult.SerieCode != null && that.MyChartsDataResult.SerieCode != "null") {
                    var value = serievalue;
                    var code = that.MyChartsDataResult.SerieCode;
                    var displayname = that.MyChartsDataResult.SerieDisplayName;
                    var columntype = that.MyChartsDataResult.SerieType;
                    var filtertype;
                    switch (columntype) {
                        case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                        case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                        case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                        case _DefaultOptions.ColumnType.SingleParticipant: filtertype = _DefaultOptions.FilterType.Organization; break;
                        case _DefaultOptions.ColumnType.MultiParticipant: filtertype = _DefaultOptions.FilterType.Organization; break;
                        default: filtertype = _DefaultOptions.FilterType.String; break;
                    }
                    var config = {
                        ColumnCode: code,
                        DisplayName: displayname,
                        FilterType: filtertype,
                        DefaultValue: value,
                        ColumnType: columntype
                    }
                    var UnitFilterDataJsonItem = new ReportFilter(config);

                    UnitFilterDataJson.push(UnitFilterDataJsonItem);
                    that.FilterData[code] = [value];
                }
                //系列
                if (that.MyChartsDataResult.CategoryCode != null && that.MyChartsDataResult.CategoryCode != "null") {
                    var value = CategorieValue;
                    var code = that.MyChartsDataResult.CategoryCode;
                    var displayname = that.MyChartsDataResult.CategoryDisplayName;
                    var columntype = that.MyChartsDataResult.CategoryType;
                    var filtertype;
                    switch (columntype) {
                        case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                        case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                        case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                        case _DefaultOptions.ColumnType.SingleParticipant: filtertype = _DefaultOptions.FilterType.Organization; break;
                        case _DefaultOptions.ColumnType.MultiParticipant: filtertype = _DefaultOptions.FilterType.Organization; break;
                        default: filtertype = _DefaultOptions.FilterType.String; break;
                    }
                    var config = {
                        ColumnCode: code,
                        DisplayName: displayname,
                        FilterType: filtertype,
                        DefaultValue: value,
                        ColumnType: columntype
                    }
                    var UnitFilterDataJsonItem = new ReportFilter(config);
                    UnitFilterDataJson.push(UnitFilterDataJsonItem);
                    that.FilterData[code] = [value];
                }
                if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length > 0) {
                    for (var key in that.Widget.LinkageReports) {
                        var Objectid = that.Widget.LinkageReports[key];
                        if (that.ReportViewManager.ReportManagers[Objectid]) {
                            that.ReportViewManager.ReportManagers[Objectid].ReLoad(that.FilterData, UnitFilterDataJson);
                        }
                    }
                }
                if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length == 1) {
                    that.$scope.Road.push(that.$scope.currentWidget.ObjectId);
                    for (var i = 0 ; i < that.$scope.reportView.ReportPage.ReportWidgets.length; i++) {
                        var item = that.$scope.reportView.ReportPage.ReportWidgets[i];
                        if (item.ObjectId == that.Widget.LinkageReports[0]) {
                            that.$scope.currentWidgetIndex = i;
                            that.$scope.currentWidget = item;
                            that.$scope.ViewModel.currentWidgetName = item.DisplayName;
                            break;
                        }
                    }
                    if (that.$scope.reportView.ReportPage.ReportWidgets.length > 1) {
                        that.$scope.showNavButton = true;
                        if (that.$scope.currentWidgetIndex == that.$scope.reportView.ReportPage.ReportWidgets.length - 1) {
                            that.$scope.hasPrevious = true;
                            that.$scope.hasNext = false;
                        }
                        else if (that.$scope.currentWidgetIndex == 0) {
                            that.$scope.hasNext = true;
                            that.$scope.hasPrevious = false;
                        } else {
                            that.$scope.hasPrevious = true;
                            that.$scope.hasNext = true;
                        }
                    } else {
                        that.$scope.showNavButton = false;
                        that.$scope.hasNext = false;
                    }
                    that.$scope.buttonchange();
                  
                    that.$scope.reportView.GetReport($.IClone(that.$scope.filterValues), that.$scope.currentWidget, null, true, null, that.$scope, UnitFilterDataJson, that.$scope.Colors[that.$scope.currentWidgetIndex % 6])
                }
            }
        });
    },
    //重新加载
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.FilterData = filterData;
        //报表容器
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        //报表容器，必然先在页面上占有位置，宽高，才能渲染出来
        this.ElementID = $.IGuid();
        this.$ChartElement = $("<div id='" + this.ElementID + "'>").addClass("echartsbody");
        this.$ChartElement.css("height", this.$Container.height());
        this.$Container.append(this.$ChartElement);
        this.Init();
    },
    FullScreenTrigger: function () {
        this.BindChart.apply(this, [this.Widget.WidgetType]);
    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//汇总表
var ChartTableManager = function (reportPage, widget, filterData, ReportViewManager, mobilehomereport, $scope, UnitFilterDataJson) {
    this.ReportViewManager = ReportViewManager;
    this.mobilehomereport = mobilehomereport;
    //报表页
    this.ReportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
    //------------------------------------new------------------------------------------------------ 
    //数据table,没有表头，包含汇总行，汇总列
    this.ValueTable = null;
    //列表头table
    this.ColumnTable = null;
    //行表头数;
    this.RowTable = null;
    //仅有行字段列字段；
    this.OnlyHeader = null;
    //列路径，用于联动
    this.ColumnRoad = null;
    //行路径，用于联动
    this.RowRoad = null;
    //联动过滤条件
    this.UnitFilterDataJson = UnitFilterDataJson;
    //存储table最后两行的宽度
    this.lastsecondline = [];
    this.lastline = [];
    this.$scope = $scope;
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
    //----------------------------------------------------------------------------------------
    this.Init();
};
ChartTableManager.prototype = {
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        $("#ReportViewContain").css("width", "100%").find("#" + this.Widget.ObjectId).css("width", "100%").css("overflow", "hidden").css("padding-bottom", "50px");
        //绑定滑动
        var dom = this.$Container[0];
        if (typeof sliderbuild != "undefined" && $.isFunction(sliderbuild)) {
            sliderbuild(dom);
        }
        //end绑定滑动
        var that = this;
        //提示加载中
        that.$Container.html("正在加载数据请稍候...");
        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadChartsData,
            { FilterData: JSON.stringify(that.FilterData), ObjectId: that.Widget.ObjectId, Code: that.ReportPage && that.ReportPage.Code ? that.ReportPage.Code : that.Widget.ParentObjectId, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson) },
            function (data) {
                if (data.State == "false") {
                    $.IShowWarn("提示", data.errorMessage);
                    CommonFunction.ShowNoneItemImg(that.$Container);
                    return false;
                }
                if ((data.ValueTable == null || data.ValueTable.length == 0) || ((data.ValueTable == null || data.ValueTable.length == 0) && (data.RowTable == null || data.RowTable.length == 0))) {
                    CommonFunction.ShowNoneItemImg(that.$Container);
                    return;
                }
                that.ValueTable = data.ValueTable;
                //列表头table
                that.ColumnTable = data.ColumnTable;
                //行表头数;
                that.RowTable = data.RowTable;
                //仅有行字段列字段；
                that.OnlyHeader = data.OnlyHeader;
                //列路径，用于联动
                that.ColumnRoad = data.ColumnRoad;
                //行路径，用于联动
                that.RowRoad = data.RowRoad;
                that.OnlyHeaderTable = data.OnlyHeaderTable;
                //开始渲染echarts
                that.BuildTable.apply(that);
            });
    },
    BuildTable: function () {
        var that = this;
        var $Table = $("<table>").addClass("table table-bordered table-condensed orgtable");
        this.$Container.html("");

        var $TableThead = $("<thead>");
        var $TableBody = $("<tbody>");
        var mobilefrozenSwitch = !that.mobilehomereport;
        var IsMobile = true;
        var top = 0;
        var left = 0;
        if (IsMobile && !that.mobilehomereport) {
            top = ($("#ReportViewContain").position().top - 0) + ($("#ReportViewContain").css("padding").replace("px", "") - 0);
            left = $("#ReportViewContain").css("padding").replace("px", "");
        }
        //----------------------------------------冻结--------------------------
        var $FreezenColumnTable = $("<table style='top:" + top + "px;left:" + left + "px;'>").addClass("table table-bordered table-condensed table-column-freezen");
        var $FreezenTableColumnThead = $("<thead>");
        $FreezenColumnTable.append($FreezenTableColumnThead);
        var FlagFreezenColumn = this.ColumnTable != null && !$.isEmptyObject(this.ColumnTable) && (this.Widget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenColumnHeader || this.Widget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
        var $FreezenRowTable = $("<table style='top:" + top + "px;left:" + left + "px;'>").addClass("table table-bordered table-condensed table-row-freezen");
        var $FreezenTableRowThead = $("<thead>");
        var $FreezenTableRowTbody = $("<tbody>");
        var FlagFreezenRow = this.RowTable != null && !$.isEmptyObject(this.RowTable) && (this.Widget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowHeader || this.Widget.FrozenHeaderType == _DefaultOptions.ReportFrozenHeaderType.FrozenRowAndColumnHeader);
        $FreezenRowTable.append($FreezenTableRowThead);
        $FreezenRowTable.append($FreezenTableRowTbody);
        var $FreezenOnlyHeaderTable = $("<table  style='top:" + top + "px;left:" + left + "px;'>").addClass("table table-bordered table-condensed table-condensed table-onlyheader-freezen");
        //-----------------------------------end冻结----------------------------
        //-----------------------------------New------------------------------------------------
        //这里要考虑联动，每个格子需要记录行code，列code;
        //1.填列标题；
        if (this.ColumnTable != null && !$.isEmptyObject(this.ColumnTable)) {
            var $Tr, $Th, $Td;
            var RowCounter = 0;
            for (var key in this.ColumnTable) {
                var TempColumnCode = key;
                $Tr = $("<tr>");
                //最后一列不绑定点击联动
                var ColumnCounter = 0;
                for (var i = 0; i < this.ColumnTable[key].length - 1; i++) {
                    var mytd = this.ColumnTable[key][i];
                    if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine" || i == 0 || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Th = $('<th  row="' + RowCounter + '" data-code="' + mytd.Code + '" col="' + ColumnCounter + '" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value == "" ? "--" : mytd.Value);

                    }
                    else {
                        $Th = $('<th   row="' + RowCounter + '" data-code="' + mytd.Code + '" col="' + ColumnCounter + '" class="unittd" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value == "" ? "--" : mytd.Value);
                        $Th.unbind("click").bind("click", function () {
                            //联动,作为查询条件；
                            that.FilterData = {};
                            var UnitWidget = that.Widget;
                            var value = $(this).attr("data-code");
                            var code = $(this).attr("data-columncode");
                            var displayname;
                            var columntype;
                            var filtertype;
                            for (var key in that.Widget.Series) {
                                var column = that.Widget.Series[key];
                                if (column.ColumnCode == code) {
                                    displayname = column.DisplayName;
                                    columntype = column.ColumnType;
                                    switch (columntype) {
                                        case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                                        case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                                        case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                                    }
                                }
                            }
                            var config = {
                                ColumnCode: code,
                                DisplayName: displayname,
                                FilterType: filtertype,
                                DefaultValue: value,
                                ColumnType: columntype
                            }
                            var UnitFilterDataJsonItem = new ReportFilter(config);
                            var UnitFilterDataJson = [];
                            UnitFilterDataJson.push(UnitFilterDataJsonItem);
                            that.FilterData[code] = [value];
                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length == 1) {
                                that.$scope.Road.push(that.$scope.currentWidget.ObjectId);
                                for (var i = 0 ; i < that.$scope.reportView.ReportPage.ReportWidgets.length; i++) {
                                    var item = that.$scope.reportView.ReportPage.ReportWidgets[i];
                                    if (item.ObjectId == that.Widget.LinkageReports[0]) {
                                        that.$scope.currentWidgetIndex = i;
                                        that.$scope.currentWidget = item;
                                        that.$scope.ViewModel.currentWidgetName = item.DisplayName;
                                        break;
                                    }
                                }
                                if (that.$scope.reportView.ReportPage.ReportWidgets.length > 1) {
                                    that.$scope.showNavButton = true;
                                    if (that.$scope.currentWidgetIndex == that.$scope.reportView.ReportPage.ReportWidgets.length - 1) {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = false;
                                    }
                                    else if (that.$scope.currentWidgetIndex == 0) {
                                        that.$scope.hasNext = true;
                                        that.$scope.hasPrevious = false;
                                    } else {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = true;
                                    }
                                } else {
                                    that.$scope.showNavButton = false;
                                    that.$scope.hasNext = false;
                                }
                                that.$scope.buttonchange();
                             
                                that.$scope.reportView.GetReport($.IClone(that.$scope.filterValues), that.$scope.currentWidget, null, true, null, that.$scope, UnitFilterDataJson, that.$scope.Colors[that.$scope.currentWidgetIndex % 6])
                            }
                        });
                    }
                    $Tr.append($Th.clone(true));
                    ColumnCounter = ColumnCounter + mytd.ColSpan;
                }
                var mytd1 = this.ColumnTable[key][this.ColumnTable[key].length - 1];
                var $Th1 = $('<th  data-columncode="' + TempColumnCode + '" rowspan="' + mytd1.RowSpan + '" colspan="' + mytd1.ColSpan + '" data-value="' + mytd1.Value + '" >').html(mytd1.Value == "" ? "--" : mytd1.Value);
                $Tr.append($Th1.clone(true));
                $TableThead.append($Tr.clone(true));
                //列表头冻结
                if (FlagFreezenColumn) {
                    $FreezenTableColumnThead.append($Tr.clone(true));
                }
                ColumnCounter++;
            }
        }
        var Counter = 0;
        //2.填行表头，同时填数据表,
        if (this.RowTable != null && !$.isEmptyObject(this.RowTable)) {
            for (var RowI = 0; RowI < this.RowTable.length; RowI++) {
                $Tr = $("<tr>");
                for (var RowJ = 0; RowJ < this.RowTable[RowI].length; RowJ++) {
                    var MyRowTd = this.RowTable[RowI][RowJ];
                    if (that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Th = $('<th  data-columncode="' + MyRowTd.ColumnCode + '" data-code="' + MyRowTd.Code + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value == "" ? "--" : MyRowTd.Value);
                    }
                    else {
                        $Th = $('<th class="unittd" data-code="' + MyRowTd.Code + '" data-columncode="' + MyRowTd.ColumnCode + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value == "" ? "--" : MyRowTd.Value);
                        $Th.unbind("click").bind("click", function () {
                            //联动,作为查询条件；
                            that.FilterData = {};
                            var UnitWidget = that.Widget;
                            var value = $(this).attr("data-code");
                            var code = $(this).attr("data-columncode");
                            var displayname;
                            var columntype;
                            var filtertype;
                            for (var key in that.Widget.Categories) {
                                var column = that.Widget.Categories[key];
                                if (column.ColumnCode == code) {
                                    displayname = column.DisplayName;
                                    columntype = column.ColumnType;
                                    switch (columntype) {
                                        case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                                        case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                                        case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                                    }
                                }
                            }
                            var config = {
                                ColumnCode: code,
                                DisplayName: displayname,
                                FilterType: filtertype,
                                DefaultValue: value,
                                ColumnType: columntype
                            }
                            var UnitFilterDataJsonItem = new ReportFilter(config);
                            var UnitFilterDataJson = [];
                            UnitFilterDataJson.push(UnitFilterDataJsonItem);
                            that.FilterData[code] = [value];
                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length == 1) {
                                that.$scope.Road.push(that.$scope.currentWidget.ObjectId);
                                for (var i = 0 ; i < that.$scope.reportView.ReportPage.ReportWidgets.length; i++) {
                                    var item = that.$scope.reportView.ReportPage.ReportWidgets[i];
                                    if (item.ObjectId == that.Widget.LinkageReports[0]) {
                                        that.$scope.currentWidgetIndex = i;
                                        that.$scope.currentWidget = item;
                                        that.$scope.ViewModel.currentWidgetName = item.DisplayName;
                                        break;
                                    }
                                }
                                if (that.$scope.reportView.ReportPage.ReportWidgets.length > 1) {
                                    that.$scope.showNavButton = true;
                                    if (that.$scope.currentWidgetIndex == that.$scope.reportView.ReportPage.ReportWidgets.length - 1) {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = false;
                                    }
                                    else if (that.$scope.currentWidgetIndex == 0) {
                                        that.$scope.hasNext = true;
                                        that.$scope.hasPrevious = false;
                                    } else {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = true;
                                    }
                                } else {
                                    that.$scope.showNavButton = false;
                                    that.$scope.hasNext = false;
                                }
                                that.$scope.buttonchange();
                             
                                that.$scope.reportView.GetReport($.IClone(that.$scope.filterValues), that.$scope.currentWidget, null, true, null, that.$scope, UnitFilterDataJson, that.$scope.Colors[that.$scope.currentWidgetIndex % 6])
                            }

                        });
                    }
                    $Tr.append($Th.clone(true));
                }
                //行表头冻结
                if (mobilefrozenSwitch) {
                    if (FlagFreezenRow) {
                        $FreezenTableRowTbody.append($Tr.clone(true));
                    }
                }
                //end行表头冻结
                //填数据
                for (var ValueJ = 0; ValueJ < this.ValueTable[RowI].length; ValueJ++) {

                    var ValueTableItem = this.ValueTable[RowI][ValueJ];
                    if (ValueTableItem == "-" || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0) {
                        $Td = $('<td  rowspan="1" colspan="1" row="' + RowI + '" col="' + ValueJ + '">').html(ValueTableItem);
                    }
                    else {
                        $Td = $('<td  class="unittd" rowspan="1" colspan="1"  row="' + RowI + '" col="' + ValueJ + '">').html(ValueTableItem);
                        $Td.unbind("click").bind("click", function () {
                            that.FilterData = {};
                            var UnitFilterDataJson = [];
                            var rownum = $(this).attr("row") - 0;
                            var columnnum = $(this).attr("col") - 0;
                            for (var rowcode in that.RowRoad[rownum]) {
                                var UnitWidget = that.Widget;
                                var value = that.RowRoad[rownum][rowcode];
                                var code = rowcode;
                                var displayname;
                                var columntype;
                                var filtertype;
                                for (var key in that.Widget.Categories) {
                                    var column = that.Widget.Categories[key];
                                    if (column.ColumnCode == code) {
                                        displayname = column.DisplayName;
                                        columntype = column.ColumnType;
                                        switch (columntype) {
                                            case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                                            case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                                            case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                                        }
                                    }
                                }
                                var config = {
                                    ColumnCode: code,
                                    DisplayName: displayname,
                                    FilterType: filtertype,
                                    DefaultValue: value,
                                    ColumnType: columntype
                                }
                                var UnitFilterDataJsonItem = new ReportFilter(config);

                                UnitFilterDataJson.push(UnitFilterDataJsonItem);
                                that.FilterData[code] = [value];

                            }
                            for (var columncode in that.ColumnRoad[columnnum]) {
                                var UnitWidget = that.Widget;
                                var value = that.ColumnRoad[columnnum][columncode];
                                if (typeof value == "undefined")
                                    continue;
                                var code = columncode;
                                var displayname;
                                var columntype;
                                var filtertype;
                                for (var key in that.Widget.Series) {
                                    var column = that.Widget.Series[key];
                                    if (column.ColumnCode == code) {
                                        displayname = column.DisplayName;
                                        columntype = column.ColumnType;
                                        switch (columntype) {
                                            case _DefaultOptions.ColumnType.Numeric: filtertype = _DefaultOptions.FilterType.Numeric; break;
                                            case _DefaultOptions.ColumnType.DateTime: filtertype = _DefaultOptions.FilterType.DateTime; break;
                                            case _DefaultOptions.ColumnType.String: filtertype = _DefaultOptions.FilterType.String; break;
                                        }
                                    }
                                }
                                var config = {
                                    ColumnCode: code,
                                    DisplayName: displayname,
                                    FilterType: filtertype,
                                    DefaultValue: value,
                                    ColumnType: columntype
                                }
                                var UnitFilterDataJsonItem = new ReportFilter(config);
                                UnitFilterDataJson.push(UnitFilterDataJsonItem);
                                that.FilterData[code] = [value];
                            }

                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length == 1) {
                                that.$scope.Road.push(that.$scope.currentWidget.ObjectId);
                                for (var i = 0 ; i < that.$scope.reportView.ReportPage.ReportWidgets.length; i++) {
                                    var item = that.$scope.reportView.ReportPage.ReportWidgets[i];
                                    if (item.ObjectId == that.Widget.LinkageReports[0]) {
                                        that.$scope.currentWidgetIndex = i;
                                        that.$scope.currentWidget = item;
                                        that.$scope.ViewModel.currentWidgetName = item.DisplayName;
                                        break;
                                    }
                                }
                                if (that.$scope.reportView.ReportPage.ReportWidgets.length > 1) {
                                    that.$scope.showNavButton = true;
                                    if (that.$scope.currentWidgetIndex == that.$scope.reportView.ReportPage.ReportWidgets.length - 1) {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = false;
                                    }
                                    else if (that.$scope.currentWidgetIndex == 0) {
                                        that.$scope.hasNext = true;
                                        that.$scope.hasPrevious = false;
                                    } else {
                                        that.$scope.hasPrevious = true;
                                        that.$scope.hasNext = true;
                                    }
                                } else {
                                    that.$scope.showNavButton = false;
                                    that.$scope.hasNext = false;
                                }
                                that.$scope.buttonchange();
                               
                                that.$scope.reportView.GetReport($.IClone(that.$scope.filterValues), that.$scope.currentWidget, null, true, null, that.$scope, UnitFilterDataJson, that.$scope.Colors[that.$scope.currentWidgetIndex % 6])
                            }

                        });
                    }
                    $Tr.append($Td.clone(true));
                }
                //end填数据
                $TableBody.append($Tr.clone(true));
            }
        }
        $Table.append($TableThead).append($TableBody);
        this.$Container.append($Table);
        //列表头冻结
        if (mobilefrozenSwitch) {
            if (FlagFreezenColumn) {
                this.$Container.append($FreezenColumnTable);
               // $FreezenColumnTable.css("width", "100%");
                this.ComputeOrgWidth($Table);
                var ColumnHeaderTableLastSecondLineCounter = 0;
                var ColumnHeaderTableLastLineCounter = 0;
                //计算最后两行的宽度
                this.ComputerWidth($FreezenColumnTable, that.lastsecondline, that.lastline);
            }
        }
        //行表头冻结
        if (mobilefrozenSwitch) {
            if (FlagFreezenRow) {
                //加仅有表头
                for (var key in this.OnlyHeaderTable) {
                    var $onlyTr = $("<tr>");
                    for (var OnlyHeaderCounterJ = 0; OnlyHeaderCounterJ < this.OnlyHeaderTable[key].length; OnlyHeaderCounterJ++) {
                        var onlytd = this.OnlyHeaderTable[key][OnlyHeaderCounterJ];
                        var $onylTh = $('<th  data-columncode="' + key + '"  rowspan="' + onlytd.RowSpan + '" colspan="' + onlytd.ColSpan + '">').html(onlytd.Value == "" ? "--" : onlytd.Value);
                        $onlyTr.append($onylTh);
                    }
                    $FreezenTableRowThead.append($onlyTr);
                }
                $FreezenOnlyHeaderTable.append($FreezenTableRowThead.clone(true));
                this.ComputeOrgWidth($Table);
                this.$Container.append($FreezenRowTable);
                this.$Container.append($FreezenOnlyHeaderTable);
                this.ComputerWidth($FreezenOnlyHeaderTable, this.lastsecondline, this.lastline);
                this.ComputerWidth($FreezenRowTable, this.lastsecondline, this.lastline);
            }
        }
        //绑定滚动事件
        if (mobilefrozenSwitch) {
            {
                var myheight = $("#ReportViewContain").height();
                var mywidth = $("#ReportViewContain").width();
                var paddingleftTop = 0;
                var paddingleftleft = 0;
                var paddingleftheight = myheight;

                var paddingrightTop = 0;
                var paddingrightright = 0;
                var paddingrightheight = myheight;
                var paddingtopTop = 0;
                var paddingtopleft = 5;
                var paddingtopwidth = mywidth;

                $("#paddingleft") && $("#paddingleft").length == 0 && $("#ReportViewContain").append($('<div id="paddingleft" class="paddingleft"></div>'));
                $("#paddingright") && $("#paddingright").length == 0 && $("#ReportViewContain").append($('<div id="paddingright" class="paddingright"></div>'));
                $("#paddingtop") && $("#paddingtop").length == 0 && $("#ReportViewContain").append($('<div id="paddingtop" class="paddingtop"></div>'));
                $("#paddingleft").attr("style", "position:absolute;left:" + paddingleftleft + ";top:" + paddingleftTop + "px;width:5px;height:" + paddingleftheight + "px;z-index:98;background-color:#fff;");
                $("#paddingright").attr("style", "position:absolute;right:" + paddingrightright + ";top:" + paddingrightTop + "px;width:5px;height:" + paddingrightheight + "px;z-index:98;background-color:#fff;");
                $("#paddingtop").attr("style", "position:absolute;left:" + paddingtopleft + "px;top:" + paddingtopTop + "px;width:" + paddingtopwidth + "px;height:5px;z-index:98;background-color:#fff;");

            }
            this.$Container.scroll(function () {
                if (IsMobile) {
                    var ScrollY = (("-" + $(this)[0].scrollTop) - 0) + (5 - 0) + "px";
                    var ScrollX = (("-" + ($(this)[0].scrollLeft) - 0) + (5 - 0)) + "px";
                    if (mobilefrozenSwitch) {
                        $FreezenColumnTable.css("left", ScrollX);
                        $FreezenRowTable.css("top", ScrollY);
                    }
                }
                else {
                    var ScrollY = $(this)[0].scrollTop + (top - 0) + "px";
                    var ScrollX = $(this)[0].scrollLeft + (left - 0) + "px";
                    $FreezenColumnTable.css("top", ScrollY);
                    if (mobilefrozenSwitch) {
                        $FreezenRowTable.css("left", ScrollX);
                        $FreezenOnlyHeaderTable.css("top", ScrollY);
                        $FreezenOnlyHeaderTable.css("left", ScrollX);
                    }
                }
            });
        }
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
            $this.css("min-width", that.lastsecondline[ColumnHeaderTableLastSecondLineCounter]);
            $this.css("max-width", that.lastsecondline[ColumnHeaderTableLastSecondLineCounter]);
            ColumnHeaderTableLastSecondLineCounter++;
        });
        Dom.find("[data-columncode='ColumnHeaderTableLastLine']").each(function () {
            var $this = $(this);
            $this.css("width", that.lastline[ColumnHeaderTableLastLineCounter]);
            $this.css("min-width", that.lastline[ColumnHeaderTableLastLineCounter]);
            $this.css("max-width", that.lastline[ColumnHeaderTableLastLineCounter]);
            ColumnHeaderTableLastLineCounter++;
        });
    },
    //读取某列的数据
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.FilterData = filterData;
        this.UnitFilterDataJson = UnitFilterDataJson;
        //报表容器
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        this.Init();
    },
    FullScreenTrigger: function () {
    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//明细表
var GridViewManager = function (reportPage, widget, filterData, ReportViewManager, mobilehomereport, $scope, UnitFilterDataJson) {
    this.ReportPage = reportPage;
    this.ReportViewManager = ReportViewManager;
    this.Widget = widget;
    this.FilterData = filterData;
    this, UnitFilterDataJson = UnitFilterDataJson;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
    this.SourceColumns = null;
    //定义过滤器
    this.GetQueryParams();
    this.SourceData = null;
    this.mydatatable = null;
    this.PageIndex = 0;
    this.PageLength = 15;
    this.Total = 0;
    this.FirstLineWidths = [];
    this.HasLoad = false;
    this.LoadMoreLoad = false;
    this.Init();
    this.columns = [];
    this.$scope = $scope;
    this.mobilehomereport = mobilehomereport;
    this.CodesHasSort = [];
    this.Numeric = false;
};
GridViewManager.prototype = {
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        if (true && !this.HasLoad) {
            $("#ReportViewContain").css("width", "100%").find("#" + this.Widget.ObjectId).css("width", "100%").css("overflow", "hidden").css("height", "100%").css("padding-bottom", "100px");
            var dom = this.$Container[0];
            if (typeof sliderbuild != "undefined" && $.isFunction(sliderbuild)) {
                sliderbuild(dom, this.LoadMore, this);
            }
        }
        if (true && this.HasLoad) {
            if (this.Total < this.PageIndex * this.PageLength)
                return;
        }
        var that = this;
        //构建表格
        this.$Container.html("");

        var $TableDiv;
        var $Table;
        var $PanelFooter;
        var $TableDiv = $("<div>").css("width", "100%");
        this.$Container.append($TableDiv);
        var $Table = $("<table style='width:100%'>").addClass("table table-striped table-bordered");
        $TableDiv.append($Table);
        var $PanelFooter = $("<div class='panel-footer'>");
        CommonFunction.Post(
           CommonFunction.LoadGridData,
           {
               FilterData: JSON.stringify(that.FilterData), WidgetID: that.Widget.ObjectId, Code: that.ReportPage && that.ReportPage.Code ? that.ReportPage.Code : that.Widget.ParentObjectId, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson), "start": 0, "length": 0
           },
           function (data) {
               if (data.iTotalRecords == 0) {
                   CommonFunction.ShowNoneItemImg(that.$Container);
                   return;
               }
               that.Total = data.iTotalRecords;
               that.Numeric = data.Numeric;
               //数据源 数据
               //数据源 列
               that.SourceColumns = data.SourceColumns;
               var mydata = [];
               var $Tr = $("<tr>");
               var $Tr1 = $("<tr>");
               var columns = [];
               var order = [];
               if (that.Widget.SortColumns) {
                   for (var i = 0; i < that.Widget.SortColumns.length; i++) {
                       var sortitem = that.Widget.SortColumns[i];
                       for (var j = 0; j < that.SourceColumns.length; j++) {
                           var sourceitem = that.SourceColumns[j];
                           if (sortitem.ColumnCode == sourceitem.ColumnCode) {
                               var dir = sortitem.Ascending ? "asc" : "desc";
                               order.push([j, dir]);
                               break;
                           }
                       }
                   }
               }
               if (!$.isEmptyObject(data.ChildCodes)) {
                   //行号
                   var $Th = $("<th colspan='1' rowspan='2'>").attr("data-class", "gridview-th").attr("data-field", "DetailRowNumber").attr("data-align", "left").text("行号");//.css("width", width);
                   $Tr.append($Th);
                   that.columns[CommonFunction.DetailRowNumber] = CommonFunction.DetailRowNumber;
                   columns.push({
                       data: CommonFunction.DetailRowNumber, title: "行号", orderable: false, render: function (aa, bb, cc, dd) {
                           if (aa || aa === 0 || aa === "0") {
                               if ($.isArray(aa)) {
                                   var value = aa;
                                   if (value.length > 1) {
                                       html = "";
                                       html += "<table>";
                                       for (var i = 0; i < value.length; i++) {
                                           var newvalue = value[i] == null ? "--" : value[i];
                                           html += "<tr style='background-color: transparent;height: auto;line-height: inherit;'><td title='" + newvalue + "' style='padding: 0px !important;'>" + newvalue + "</td></tr>";
                                       }
                                       html += "</table>";
                                       return html;

                                   }
                                   else
                                       return "-";
                               }
                               return aa;
                           }
                           return "-";
                       }
                   });
                   //end行号
                   for (var key in data.ChildCodes) {
                       var node = data.ChildCodes[key];
                       if (!$.isEmptyObject(node.ChildeColumnSummary)) {
                           var count = 0;
                           for (var childkey in node.ChildeColumnSummary) {
                               count++;
                               var childnode = node.ChildeColumnSummary[childkey];
                               var $Th1 = $("<th colspan='1' rowspan='1'>").attr("data-class", "gridview-th").attr("data-field", childnode.Code).attr("data-align", align).text(childnode.DisplayName);//.css("width", width);
                               $Tr1.append($Th1);
                               that.columns[childnode.Code] = childnode.Code;
                               columns.push({
                                   data: childnode.Code, title: childnode.DisplayName, render: function (aa, bb, cc, dd) {
                                       if (aa) {
                                           if ($.isArray(aa)) {
                                               var value = aa;
                                               if (value.length > 0) {
                                                   //html = "";
                                                   //for (var i = 0; i < value.length; i++) {
                                                   //    var newvalue = value[i] == null ? "--" : value[i];
                                                   //    html += newvalue + "<br/>";
                                                   //}
                                                   html = "";
                                                   html += "<table style='width:100%'>";
                                                   for (var i = 0; i < value.length; i++) {
                                                       var newvalue = value[i] == null ? "--" : value[i];
                                                       html += "<tr style='background-color: transparent;height: auto;line-height: inherit;'><td title='" + newvalue + "' style='padding: 0px !important;'>" + newvalue + "</td></tr>";
                                                   }
                                                   html += "</table>";
                                                   return html;

                                               }
                                               else
                                                   return "-";
                                           }
                                           return aa;
                                       }
                                       return "-";
                                   }
                               });
                           }
                           var $Th = $("<th colspan='" + count + "' rowspan='1'>").attr("data-class", "gridview-th").attr("data-field", node.Code).attr("data-align", align).text(node.DisplayName);//.css("width", width);
                           $Tr.append($Th);
                       }
                       else {
                           var $Th = $("<th colspan='1' rowspan='2'>").attr("data-class", "gridview-th").attr("data-field", node.Code).attr("data-align", align).text(node.DisplayName);//.css("width", width);
                           $Tr.append($Th);
                           that.columns[node.Code] = node.Code;
                           columns.push({
                               data: node.Code, title: node.DisplayName, render: function (aa, bb, cc, dd) {
                                   if (aa || aa === 0 || aa === "0") {
                                       if ($.isArray(aa)) {
                                           var value = aa;
                                           if (value.length > 1) {
                                               html = "";
                                               html += "<table>";
                                               for (var i = 0; i < value.length; i++) {
                                                   var newvalue = value[i] == null ? "--" : value[i];
                                                   html += "<tr style='background-color: transparent;height: auto;line-height: inherit;'><td title='" + newvalue + "' style='padding: 0px !important;'>" + newvalue + "</td></tr>";
                                               }
                                               html += "</table>";
                                               return html;

                                           }
                                           else
                                               return "-";
                                       }
                                       return aa;
                                   }
                                   return "-";
                               }
                           });
                       }
                   }
                   $Table.append($("<thead>").append($Tr));
                   if ($Tr1.children().length > 0)
                       $Table.find(">thead").append($Tr1);
                   else {
                       $Table.find(">thead").find("th").attr("rowspan", "1");
                   }
               }
               else {
                   //行号
                   var $Th = $("<th colspan='1' rowspan='1'>").attr("data-class", "gridview-th").attr("data-field", "DetailRowNumber").attr("data-align", "left").text("行号");//.css("width", width);
                   $Tr.append($Th);
                   that.columns[CommonFunction.DetailRowNumber] = CommonFunction.DetailRowNumber;
                   columns.push({
                       data: CommonFunction.DetailRowNumber, title: "行号", orderable: false, render: function (aa, bb, cc, dd) {
                           if (aa || aa === 0 || aa === "0")
                               return aa;
                           else
                               return "-";
                       }
                   });
                   //end行号
                   for (var i = 0 ; that.SourceColumns != null && i < that.SourceColumns.length; i++) {
                       var column = that.SourceColumns[i];
                       var align = "left";
                       if (column.ColumnType == 0) {
                           align = "right";
                       }
                       var width = 100 / (that.SourceColumns.length - 0) + "%";
                       var $Th = $("<th>").attr("data-class", "gridview-th").attr("data-field", column.ColumnCode).attr("data-align", align).text(column.DisplayName);//.css("width", width);
                       $Tr.append($Th);
                       that.columns[column.ColumnCode] = column.ColumnCode;
                       columns.push({
                           data: column.ColumnCode, title: column.DisplayName, render: function (aa, bb, cc, dd) {
                               if (aa || aa === 0 || aa === "0")
                                   return aa;
                               else
                                   return "-";
                           }
                       });
                   }
                   $Table.append($("<thead>").append($Tr));
               }
               CommonFunction.Post(
               CommonFunction.LoadGridData,
               { WidgetID: that.Widget.ObjectId, Code: that.ReportPage && that.ReportPage.Code ? that.ReportPage.Code : that.Widget.ParentObjectId, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson), "start": that.PageIndex * that.PageLength, "length": that.PageLength, FilterData: JSON.stringify(that.FilterData) },
                function (data) {
                    if (that.SourceData == null || that.SourceData.length == 0)
                        that.SourceData = data.aaData;
                    else if (that.LoadMoreLoad) {
                        that.SourceData = that.SourceData.concat(data.aaData);
                    }
                    that.mydatatable = $Table.DataTable({
                        "autoWidth": true,
                        "deferRender": true,
                        "filter": false,
                        "info": true,
                        "paginate": false,
                        "ordering": false,
                        "processing": true,
                        "scrollInfinite": true,
                        "scrollY": "100%",
                        "scrollCollapse": true,
                        "serverSide": false,
                        "data": that.SourceData,
                        "fixedColumns": true,
                        "dom": 'rt',
                        "columns": columns,
                        language: {
                            lengthMenu: "每页_MENU_条",
                            paginate: {
                                previous: "上一页",
                                next: "下一页",
                                first: "首页",
                                last: "尾页"
                            },
                            zeroRecords: "没有内容",
                            info: "当前第_START_到_END_条 共_TOTAL_条",
                            infoEmpty: "0条记录",
                            processing: "正在加载数据..."
                        },
                        "drawCallback": function () {
                            if (!that.mobilehomereport) {
                                var height = that.$Container.find(".dataTables_scrollHead").css("height");
                                that.$Container.css("margin-top", height);
                                that.$Container.find(".dataTables_scrollHead").css("position", "absolute").css("top", "5px").css("overflow", "");
                                that.$Container.find(".dataTables_scrollBody").css("overflow", "");
                            }
                        },
                        "createdRow": function (row, data, index) {
                            if (that.$scope) {
                                var $row = $(row);
                                if (data[CommonFunction.BizObjectId]) {
                                    var SchemaCode = data[CommonFunction.BizObjectId]["SchemaCode"];
                                    var objectid = data[CommonFunction.BizObjectId][CommonFunction.BizObjectId]
                                    $row.unbind("click").bind("click", function () {
                                        that.$scope.goSheetDetail(SchemaCode, objectid);
                                    })
                                }
                            }

                        }
                    });
                    if (!that.HasLoad) {
                        that.$Container.scroll(function () {
                            var ScrollX = (("-" + ($(this)[0].scrollLeft) - 0) + (5 - 0)) + "px";
                            that.$Container.find(".dataTables_scrollHead").css("left", ScrollX);
                        });
                        that.HasLoad = true;
                    }
                });
           });
    },
    ComputerWidth: function () {
        var that = this;
        that.$Container.find('.dataTables_scrollHeadInner table').css("width", that.$Container.find('.dataTables_scrollBody table').scrollWidth + "px");
        that.$Container.find('.dataTables_scrollBody').attr("id", that.Widget.ObjectId + "_dataTables_scrollBody");
        var scrollwidht = document.getElementById(that.Widget.ObjectId + "_dataTables_scrollBody").offsetWidth - document.getElementById(that.Widget.ObjectId + "_dataTables_scrollBody").scrollWidth;
        var headwidth = that.$Container.find('.dataTables_scrollBody').css("width").replace("px", "") - scrollwidht + "px";
        that.$Container.find('.dataTables_scrollHeadInner').css("width", headwidth);
        that.$Container.find('.dataTables_scrollHeadInner table').css("width", headwidth);
        var dicwidthvalue = [];
        var firsttdnumber = 0;
        that.$Container.find('.dataTables_scrollBody .table tbody tr').eq(0).find("td").each(function () {
            var $this = $(this);
            var width = $this.css("width");
            dicwidthvalue.push(width);
            firsttdnumber++;
        });
        if (firsttdnumber <= 1)
            return;
        var thiswidthcounter = 0;
        var widthNumber = [];
        that.$Container.find('.dataTables_scrollHead .dataTables_scrollHeadInner table thead tr').each(function () {
            if (thiswidthcounter == 0) {
                var thcounter = 0;
                $(this).find("th").each(function () {
                    var $thisTh = $(this);
                    if ($thisTh.attr("colspan") == "1") {
                        $thisTh.css("width", dicwidthvalue[thcounter]);
                        $thisTh.css("min-width", dicwidthvalue[thcounter]);
                        $thisTh.css("max-width", dicwidthvalue[thcounter]);

                    }
                    else {
                        for (var kkk = thcounter; kkk < thcounter + ($thisTh.attr("colspan") - 0) ; kkk++) {
                            widthNumber.concat(kkk);
                        }
                    }
                    thcounter = thcounter + ($thisTh.attr("colspan") - 0);
                })
            }
            else {
                $(this).find("th").each(function () {
                    for (var jjj = 0; jjj < widthNumber.length; jjj++) {
                        var number = widthNumber[jjj];
                        $(this).css("width", dicwidthvalue[number]);
                        $(this).css("min-width", dicwidthvalue[number]);
                        $(this).css("max-width", dicwidthvalue[number]);
                    }
                });

            }
            $(this).css("width", dicwidthvalue[thiswidthcounter]);
            thiswidthcounter++;
        });
    },
    GetQueryParams: function () {
        var that = this;
        window[this.Widget.ObjectId + "_GetQueryParams"] = function (params) {
            that.$Container.parent().scrollTop(0);
            params["FilterData"] = JSON.stringify(that.FilterData);
            return params;
        };
        window[this.Widget.ObjectId + "_ResponseHandler"] = function (params) {
            if (params.total == 0) {
                CommonFunction.ShowNoneItemImg(that.$Container);
                return params;
            }
            else {
                return params;
            }
        };
    },
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.PageIndex = 0;
        this.Total = 0;
        this.FirstLineWidths = [];
        this.HasLoad = false;
        this.LoadMoreLoad = false;
        this.columns = [];
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.FilterData = filterData;
        this.GetQueryParams();
        //报表容器
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        this.Init();
    },
    FullScreenTrigger: function () {
        var pannel = this.$Container.parent();
        this.$Container.find('.dataTables_scrollBody').css("max-height", this.$Container.css("height").replace("px", "") - this.$Container.find(".dataTables_scrollHead").css("height").replace("px", "") - 50 + 'px');
        //待修正，
        this.mydatatable.ajax.reload();
    },
    LoadMore: function (manager) {
        manager.LoadMoreLoad = true;
        if (manager.PageIndex * manager.PageLength >= manager.Total)
            return;
        manager.PageIndex++;
        CommonFunction.Post(
                  CommonFunction.LoadGridData,
                  { WidgetID: manager.Widget.ObjectId, Code: manager.ReportPage && manager.ReportPage.Code ? manager.ReportPage.Code : manager.Widget.ParentObjectId, UnitFilterDataJson: JSON.stringify(manager.UnitFilterDataJson), "start": manager.PageIndex * manager.PageLength, "length": manager.PageLength, FilterData: JSON.stringify(manager.FilterData) },
                   function (data) {
                       if (data.aaData) {
                           //删除上一页的汇总行
                           if (data.aaData.length > 0 && manager.Numeric) {
                               manager.$Container.find("table tbody tr:last").remove();
                           }
                           for (var i = 0; i < data.aaData.length; i++) {
                               var item = data.aaData[i]
                               var $tr = manager.GetTr(item, manager);

                               if (item[CommonFunction.BizObjectId]) {
                                   var SchemaCode = item[CommonFunction.BizObjectId]["SchemaCode"];
                                   var objectid = item[CommonFunction.BizObjectId][CommonFunction.BizObjectId]
                                   $tr.unbind("click").bind("click", function () {
                                       manager.$scope.goSheetDetail(SchemaCode, objectid);
                                   })
                               }
                               manager.$Container.find("table tbody").append($tr);
                           }
                           manager.ComputerWidth();
                       }
                   });
    },
    GetTr: function (item, manager) {
        var html = "<tr";
        var trclass = this.$Container.find("table tbody").find("tr:last").hasClass("even") ? "odd" : "even";
        html += " class='" + trclass + "' ";
        html += " > ";
        if (manager.columns[CommonFunction.DetailRowNumber]) {
            html += "<td class=' gridview-th'>";
            html += item[CommonFunction.DetailRowNumber];
            html += "</td>";
        }
        for (var key in manager.columns) {
            if (!manager.columns[key] || key == CommonFunction.DetailRowNumber || manager.columns[key] != key) continue;
            html += "<td class=' gridview-th'>";
            var value = "--";
            aa = item[key];
            if (aa) {
                if ($.isArray(aa)) {
                    value = aa;
                    if (value.length > 1) {
                        html = "";
                        html += "<table>";
                        for (var i = 0; i < value.length; i++) {
                            var newvalue = value[i] == null ? "--" : value[i];
                            html += "<tr style='background-color: transparent;height: auto;line-height: inherit;'><td title='" + newvalue + "' style='padding: 0px !important;'>" + newvalue + "</td></tr>";
                        }
                        html += "</table>";
                        value = html;
                    }
                }
                value = aa;
            }
            html += value;
            html += "</td>";
        }
        html += "</tr>";
        return $(html);
    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//简易看板
var SimpleBoardManager = function (reportPage, widget, filterData, ReportViewManager, mobilehomereport, $scope, UnitFilterDataJson, color) {
    this.ReportViewManager = ReportViewManager;
    this.ReportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
    this.SourceColumns = null;
    this.SimpleBoardChildManagers = [];
    this.allColor = color;
    //定义过滤器
    this.SourceData = null;
    this.$scope = $scope;
    this.UnitFilterDataJson = UnitFilterDataJson;
    this.mobilehomereport = mobilehomereport;
    this.Init();
}
SimpleBoardManager.prototype = {
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId);
        this.$Container.html("");
        var num = Math.floor(Math.random(0, 6) * 6);
        this.CreateLayout();
        for (var i = 0; this.Widget.ReportWidgetSimpleBoard != null && i < this.Widget.ReportWidgetSimpleBoard.length; i++) {
            var ReportWidgetSimpleBoard = this.Widget.ReportWidgetSimpleBoard[i];
            if (!ReportWidgetSimpleBoard.ReportSourceId) continue;
            this.SimpleBoardChildManagers[ReportWidgetSimpleBoard.ObjectId] = new SimpleBoardChildManager(this.ReportPage, this.Widget, this.FilterData, ReportWidgetSimpleBoard, this.allColor, this.ReportViewManager, this.mobilehomereport, this.$scope, this.UnitFilterDataJson);
        }
    },
    CreateLayout: function () {
        var RowNum = this.Widget.SimpleBoardRowNumber - 0;
        var ColumnNum = this.Widget.SimpleBoardColumnNumber - 0;
        var $table = $('<table >');
        $table.addClass("Mytable_SimpleBoard");
        $table.attr("id", this.Widget.ObjectId + "_table");
        var $tablebody = $('<tbody>');
        $table.append($tablebody);
        for (var i = 0; i < RowNum; i++) {
            var heigth = 100 / RowNum + "%";
            var $tr = $('<tr heigth="' + heigth + '">');
            $table.append($tr);
            for (var j = 0; j < ColumnNum; j++) {
                var width = 100 / ColumnNum + "%";
                var $td = $('<td width="' + width + '">');

                $td.css("padding-bottom", '24px');

                var $divimg = $("<div style='float:left;' class='myimg'>");
                var $positiondiv = $("<div style=''>")
                $img = $("<i class='iconReport-Personnel_015_o' style='height: 40px;width: 40px;display: block;line-height: 40px;text-align: center;font-size: 22px;background-color: " + this.allColor + ";border-radius: 20px;color:#fff;'>");
                $divimg.append($positiondiv.append($img));
                var $div = $("<div style='float:left; margin-left:10px; text-align:left;padding-top:10px;' class='mydata'><span style='color:#929292;'>加载中...</span></div>");
                $td.append($divimg).append($div);
                $tr.append($td);
            }
        }
        this.$Container.append($table);
    },
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.FilterData = filterData;
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.Init();
    },
    FullScreenTrigger: function () {
        this.$Container.find('.dataTables_scrollBody').css("max-height", this.$Container.css("height").replace("px", "") - 78 + 'px');
    }
};
var SimpleBoardChildManager = function (reportPage, widget, filterData, widgetsimpleboard, allColor, ReportViewManager, mobilehomereport, $scope, UnitFilterDataJson) {
    this.ReportViewManager = ReportViewManager;
    this.reportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    this.WidgetSimpleBoard = widgetsimpleboard;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectId); ("#" + this.Widget.ObjectId + "_table");
    //定义过滤器
    this.Text = null;
    this.Value = null;
    this.allColor = allColor;
    this.$scope = $scope;
    this.UnitFilterDataJson = UnitFilterDataJson;
    this.Init();
}
SimpleBoardChildManager.prototype = {
    Init: function () {
        var that = this;
        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadSimpleBoard,
            { "FilterData": JSON.stringify(that.FilterData), "WidgetObjectId": that.Widget ? that.Widget.ObjectId : null, "ReportPageObjectId": that.reportPage ? that.reportPage.ObjectId : null, "ReportWidgetSimpleBoardObjectId": that.WidgetSimpleBoard ? that.WidgetSimpleBoard.ObjectId : null, "UnitFilterDataJson": JSON.stringify(that.UnitFilterDataJson), "WidgetSimpleBoard": JSON.stringify(that.Widget) },
            function (data) {
                if (!data.State) {
                    var $td = this.$Container.find('tr:eq(' + this.WidgetSimpleBoard.RowIndex + ')').children('td:eq(' + this.WidgetSimpleBoard.ColumnIndex + ')');
                    $td.html("");
                    return;
                }
                that.Text = data.Text;
                //列表头table
                that.Value = data.Value;
                //开始渲染echarts
                that.BuildTable.apply(that);
            });
    },
    BuildTable: function () {
        var that = this;
        var $div = $("<div style='float:left; margin-left:10px; text-align:left;' class='mydata'>");
        var $positiondiv1 = $("<div style=''>");
        var $Text = $("<p>").addClass("myReportWidgetSimpleBoardText").html(this.Text).css({ color: '#565656', 'font-size': '14px', margin: 0 });
        var $Value = $("<p>").addClass("myReportWidgetSimpleBoardValue").html(this.Value).css({ "color": this.allColor, 'font-size': '16px', margin: 0 });
        var $td = this.$Container.find('tr:eq(' + this.WidgetSimpleBoard.RowIndex + ')').children('td:eq(' + this.WidgetSimpleBoard.ColumnIndex + ')');
        $div.append($positiondiv1.append($Value).append($Text));
        $td.find(".mydata").hide();;
        $td.append($div)
        $td.unbind("click").bind("click", function () {
            if (that.$scope && that.WidgetSimpleBoard && that.WidgetSimpleBoard.LinkageReports && that.WidgetSimpleBoard.LinkageReports.length == 1) {
                that.$scope.Road.push(that.$scope.currentWidget.ObjectId);
                for (var i = 0 ; i < that.$scope.reportView.ReportPage.ReportWidgets.length; i++) {
                    var item = that.$scope.reportView.ReportPage.ReportWidgets[i];
                    if (item.ObjectId == that.WidgetSimpleBoard.LinkageReports[0]) {
                        that.$scope.currentWidgetIndex = i;
                        that.$scope.currentWidget = item;
                        that.$scope.ViewModel.currentWidgetName = item.DisplayName;
                        break;
                    }
                }
                if (that.$scope&&that.$scope.reportView.ReportPage.ReportWidgets.length > 1) {
                    that.$scope.showNavButton = true;
                    if (that.$scope.currentWidgetIndex == that.$scope.reportView.ReportPage.ReportWidgets.length - 1) {
                        that.$scope.hasPrevious = true;
                        that.$scope.hasNext = false;
                    }
                    else if (that.$scope.currentWidgetIndex == 0) {
                        that.$scope.hasNext = true;
                        that.$scope.hasPrevious = false;
                    } else {
                        that.$scope.hasPrevious = true;
                        that.$scope.hasNext = true;
                    }
                } else {
                    that.$scope.showNavButton = false;
                    that.$scope.hasNext = false;
                }
                that.$scope.buttonchange();
                
                that.$scope.reportView.GetReport($.IClone(that.$scope.filterValues), that.$scope.currentWidget, null, true, null, that.$scope, null, that.$scope.Colors[that.$scope.currentWidgetIndex % 6]);
            }
        });
    },
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.FilterData = filterData;
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.Init();
    }
};
