(function ($) {
    //入口
    $.fn.ReportView = function (ReportCode) {
        return $.ReportViewManager.Run($(this), ReportCode);
    };
    //管理器，为以后一个界面多个报表做铺垫
    $.ReportViewManager = {
        Managers: [],
        Run: function ($el, ReportCode) {
            var elementid = $el.attr("id");
            if ($.isEmptyObject(elementid)) {
                elementid = $.IGuid();
                $el.attr("id", elementid);
            }
            if (!this.Managers[elementid]) {
                this.Managers[elementid] = new ReportView($el, ReportCode);
            }
            return this.Managers[elementid];
        }
    }
})(jQuery);

//浏览器版本控制
var Browser = {
    //userAgent: navigator.userAgent.toLowerCase(),
    version: (navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, '0'])[1],
    safari: /webkit/.test(navigator.userAgent.toLowerCase()),
    opera: /opera/.test(navigator.userAgent.toLowerCase()),
    msie: /msie/.test(navigator.userAgent.toLowerCase()) && !/opera/.test(navigator.userAgent.toLowerCase()),
    mozilla: /mozilla/.test(navigator.userAgent.toLowerCase()) && !/(compatible|webkit)/.test(navigator.userAgent.toLowerCase())
}
var UserInf;//用于Organization的默认值;
//报表展示
var ReportView = function ($el, ReportCode) {
    this.ReportOptions = $.extend(true, true, {}, ReportBase);
    this.ReportCode = ReportCode;
    this.$Element = $el;
    this.PostUrl = "/ReportView/DoReportAction/";
    this.ReportSetting = null;
    this.UserInf = null;
    this.ChartManagers = {};
    this.Actions = {
        LoadReportSetting: "LoadReportSetting",
        LoadChartsData: "LoadChartsData",
        LoadGridData: "LoadGridData",
        ValidateOrg: "ValidateOrg"
    };
    this.Init();
}

ReportView.prototype = {
    //初始化
    Init: function () {
        var that = this;
        //加载配置
        that.PostAjax(
            that.Actions.LoadReportSetting,
            { Code: that.ReportCode },
            function (data) {
                that.ReportSetting = data.ReportSetting;
                that.UserInf = data.UserInf;
                that.CreateContainer();
                that.LoadReportView();
            });
    },

    //添加容器
    CreateContainer: function () {
        this.$Element;
        //过滤容器
        if (!$.isEmptyObject(this.ReportSetting.Parameters)) {
            this.$FilterContainer = $("<div>").addClass("FilterContainer").addClass("form-horizontal");
            this.$Element.append(this.$FilterContainer);
        }

        //图表
        if (this.ReportSetting.ReportType == this.ReportOptions.ReportType.CombinedTable
            && !$.isEmptyObject(this.ReportSetting.Charts)) {
            this.$ChartsContainer = $("<div>").addClass("ChartsContainer");
            this.$Element.append(this.$ChartsContainer);
            this.ChartsContainers = {};
            for (var i = 0; i < this.ReportSetting.Charts.length; i++) {
                var $Container;
                var colCss = "col-md-6";
                if (i % 2 == 0) {
                    $Container = $("<div>");
                    $Container.addClass("row");
                    this.$ChartsContainer.append($Container);
                    if (i == this.ReportSetting.Charts.length - 1) {
                        //最后一个
                        colCss = "col-md-12";
                    }
                }
                else {
                    $Container = this.$ChartsContainer.children("div.row:last");
                }
                var chartID = $.IGuid();
                this.ChartsContainers[this.ReportSetting.Charts[i]] = chartID;
                var $col = $("<div>").addClass(colCss).append($("<div>").attr("id", chartID).width("100%").height("400px"));
                $Container.append($col);
            }
        }

        //表格容器
        this.$TableContainer = $("<div>").addClass("TableContainer");
        this.$Element.append(this.$TableContainer);
    },

    //加载报表视图
    LoadReportView: function () {
        this.ShowFilter();
        this.LoadReport();
    },

    //获取当月最后一天日期  
    getFirstAndLastMonthDay: function (year, month) {
        var firstdate = year + '-' + month + '-01';
        var day = new Date(year, month, 0);
        var lastdate = year + '-' + month + '-' + day.getDate();
        return lastdate;
    },

    //获取本周的第一天和最后一天
    getFirstAndLastdayweek: function () {
        var time = new Date();
        time.setDate(time.getDate() - time.getDay() + 1);
        weekfirstday = time.getFullYear() + "-" + (time.getMonth() - 0 + 1) + "-" + time.getDate();
        time.setDate(time.getDate() + 6);
        weekdayLast = time.getFullYear() + "-" + (time.getMonth() - 0 + 1) + "-" + time.getDate();
        return [weekfirstday, weekdayLast];
    },

    //获取本季第一天，最后一天
    GetFirstAndLastDayQuarter: function () {
        var mydate = new Date();
        var month = mydate.getMonth() - 0 + 1;
        var year = mydate.getFullYear();
        if (month >= 1 && month <= 3) {
            var firstdate = year + '-' + 01 + '-01';
            var day = new Date(year, 3, 0);
            var lastdate = year + '-' + 03 + '-' + day.getDate();//获取第一季度最后一天日期
            return [firstdate, lastdate]
        } else if (month >= 4 && month <= 6) {
            var firstdate = year + '-' + 04 + '-01';
            var day = new Date(year, 6, 0);
            var lastdate = year + '-' + 06 + '-' + day.getDate();//获取第二季度最后一天日期    
            return [firstdate, lastdate]
        } else if (month >= 7 && month <= 9) {
            var firstdate = year + '-' + 07 + '-01';
            var day = new Date(year, 9, 0);
            var lastdate = year + '-' + 09 + '-' + day.getDate();//获取第三季度最后一天日期
            return [firstdate, lastdate]
        } else if (month >= 10 && month <= 12) {
            var firstdate = year + '-' + 10 + '-01';
            var day = new Date(year, 12, 0);
            var lastdate = year + '-' + 12 + '-' + day.getDate();//获取第四季度最后一天日期
            return [firstdate, lastdate]
        }

    },
    //设置选人控件的值
    SetSheetUserValue: function (UnitID, Code, Type, DisplayName, $Control) {
        var ObjManager = { "UnitID": UnitID, "Code": null, "DisplayName": DisplayName, "ParentID": null, "Type": Type, "Icon": null, "DepartmentName": null, "Birthday": null, "_Gender": null, "Gender": null, "email": null, "Mobile": null };
        $Control.SetValue(ObjManager);
    },
    //过滤条件
    ShowFilter: function () {
        if ($.isEmptyObject(this.ReportSetting.Parameters)) return;
        for (var i = 0; this.ReportSetting.Parameters != null && i < this.ReportSetting.Parameters.length; i++) {
            var Parameter = this.ReportSetting.Parameters[i];
            if (Parameter.Visible == false) continue;
            if (i % 2 == 0) {
                this.$FilterContainer.append("<div class='form-group' style='margin:0px;margin-bottom:5px;'>");
            }
            var $label = $('<label for="' + Parameter.ColumnCode + '" class="col-md-1 control-label">').text(Parameter.DisplayName);
            var $input = $("<input>").addClass("form-control").attr("id", Parameter.ColumnCode).attr("data-controlkey", "TextBox");
            switch (Parameter.ParameterType) {
                case ReportBase.ParameterType.String:
                    var DefaultValue = Parameter.DefaultValue == "" || Parameter.DefaultValue == null ? "" : Parameter.DefaultValue;
                    $input.val(DefaultValue)
                    break;
                case ReportBase.ParameterType.Numeric:
                    var DefaultValue = Parameter.DefaultValue == null ? "" : Parameter.DefaultValue.split(";");
                    $input = $("<div>").addClass("input-group").attr("id", Parameter.ColumnCode);
                    $input.append($("<div class='input-group-addon'>从</div>"));
                    var beginval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 0 ? DefaultValue[0] : "";
                    var $begin = $("<input class='form-control'>").attr("data-controlkey", "Numeric").val(beginval);
                    $input.append($begin);
                    $input.append($("<div class='input-group-addon'>至</div>"));
                    var endval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 1 ? DefaultValue[1] : "";
                    var $end = $("<input class='form-control'>").attr("data-controlkey", "Numeric").val(endval);
                    $input.append($end);
                    break;
                case ReportBase.ParameterType.DateTime:
                    var beginvalue, endvalue;
                    var myDate = new Date();
                    switch (Parameter.DefaultValue)//1=当天；2=本周；3=本月;4=本季度；5=本年度;
                    {
                        case "1":
                            beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                            endvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                            ; break;
                        case "2": beginvalue = this.getFirstAndLastdayweek()[0];
                            endvalue = this.getFirstAndLastdayweek()[1];
                            break;
                        case "3": beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + "01";
                            endvalue = this.getFirstAndLastMonthDay(myDate.getFullYear(), (myDate.getMonth() - 0 + 1));
                            ; break;
                        case "4": beginvalue = this.GetFirstAndLastDayQuarter()[0];
                            endvalue = this.GetFirstAndLastDayQuarter()[1]; break;
                        case "5": beginvalue = myDate.getFullYear() + "-" + "01" + "-" + "01";
                            endvalue = myDate.getFullYear() + "-" + "12" + "-" + "31"; break;
                    }
                    $input = $("<div>").addClass("input-group").attr("id", Parameter.ColumnCode);
                    $input.append($("<div class='input-group-addon'>从</div>"));
                    $input.append($("<input class='form-control'>").attr("data-controlkey", "DateTime").val(beginvalue));
                    $input.append($("<div class='input-group-addon'>至</div>"));
                    $input.append($("<input class='form-control'>").attr("data-controlkey", "DateTime").val(endvalue));
                    break;
                case ReportBase.ParameterType.Organization:

                    $input = $("<div  id='" + Parameter.ColumnCode + "' ></div>").attr("data-width", "100%").attr("data-controlkey", "SheetUser").attr("data-usedatacache", "false").attr("data-ismultiple", "false");
                    //选人控件
                    var SheetUser = $input.SheetUser();
                    $input.removeClass("form-group");
                    //loadreportsetting 时加进去
                    switch (Parameter.DefaultValue) {//function(UnitID,Code,Type,$Control){
                        case "1": this.SetSheetUserValue(this.UserInf.UserId, this.UserInf.UserCode, this.UserInf.UserType, this.UserInf.UserDisplayName, SheetUser); break;
                        case "2": this.SetSheetUserValue(this.UserInf.UserParentOUId, this.UserInf.UserParentOUCode, this.UserInf.OrganizationUnitType, this.UserInf.UserParentOUDisplayName, SheetUser); break;
                        case "3": this.SetSheetUserValue(this.UserInf.UserId, this.UserInf.UserCode, this.UserInf.UserType, this.UserInf.UserCompanyDisplayName, SheetUser); break;
                    }
                    break;
                case ReportBase.ParameterType.FixedValue:
                    var options = Parameter.ParameterValue == null || Parameter.ParameterValue == "" ? "" : Parameter.ParameterValue.split(";");
                    $input = $("<select>").addClass("input-group").attr("id", Parameter.ColumnCode).addClass("form-control");
                    if (options != "" && options.length > 0) {
                        for (var j = 0; j < options.length; j++) {
                            $input.append($("<option class='form-control' value='" + options[j] + "'>").text(options[j]));
                        }
                    }
                    break;
            }
            this.$FilterContainer.children("div.form-group:last").append($label).append($("<div class='col-md-5'>").append($input));
        }

        //时间控件
        if (this.$FilterContainer.find("input[data-controlkey='DateTime']").length > 0) {
            this.$FilterContainer.find("input[data-controlkey='DateTime']").datetimepicker({
                language: 'zh-CN',
                todayBtn: true,
                autoclose: true,
                format: "yyyy-mm-dd",
                //startView: 2, // 选择器打开后首先显示的视图
                minView: 2 // 选择器能够提供的最精确的视图
            });
        }

        //查询按钮
        var $SearchTool = $("<div>").addClass("text-center");
        var $BtnGroup = $("<div class='btn-group' role='group'>");
        var $BtnSearch = $('<button class="btn btn-default"><i class="fa fa-search"></i>查询</button>');
        $SearchTool.append($BtnGroup.append($BtnSearch));
        this.$FilterContainer.append($SearchTool);

        var that = this;
        if (this.$FilterContainer.find("div.form-group").length > 2) {
            var $BtnToggleSearch = $('<button type="button" class="btn btn-default"><i class="fa fa-angle-double-up"></i><span>收起</span></button>');
            $BtnGroup.append($BtnToggleSearch);
            $BtnToggleSearch.click(function () {
                if ($(this).find("span").text() === "收起") {
                    $(this).find("i").removeClass("fa-angle-double-up").addClass("fa-angle-double-down");
                    $(this).find("span").text("展开");
                    that.$FilterContainer.children("div.form-group:gt(1)").hide();
                }
                else {
                    $(this).find("i").removeClass("fa-angle-double-down").addClass("fa-angle-double-up");
                    $(this).find("span").text("收起");
                    that.$FilterContainer.children("div.form-group").show();
                }
            });
            $BtnToggleSearch.trigger("click");
        }
        $BtnSearch.click(function () {
            that.LoadReport.apply(that);
        });
    },

    //读取过滤数据
    GetFilterData: function () {
        var FilterData = {};
        for (var i = 0; this.ReportSetting.Parameters != null && i < this.ReportSetting.Parameters.length; i++) {
            var Parameter = this.ReportSetting.Parameters[i];
            switch (Parameter.ParameterType) {
                case ReportBase.ParameterType.String:
                    var v = $("#" + Parameter.ColumnCode).val();
                    if (!$.isEmptyObject(v)) {
                        FilterData[Parameter.ColumnCode] = [v];
                    }
                    break;
                case ReportBase.ParameterType.Numeric:
                    var v = [];
                    $("#" + Parameter.ColumnCode).find("input[data-controlkey='Numeric']").each(function () {
                        if ($.isNumeric($(this).val())) {
                            v.push($(this).val());
                        }
                        else {
                            v.push(null);
                        }
                    });
                    if (v.length > 0 && (v[0] != null || v[1] != null)) {
                        FilterData[Parameter.ColumnCode] = v;
                    }
                    break;
                case ReportBase.ParameterType.DateTime:
                    var v = [];
                    $("#" + Parameter.ColumnCode).find("input[data-controlkey='DateTime']").each(function () {
                        if ($.trim($(this).val()) !== "") {
                            v.push($(this).val());
                        }
                        else {
                            v.push(null);
                        }
                    });
                    if (v.length > 0) {
                        FilterData[Parameter.ColumnCode] = v;
                    }
                    break;
                case ReportBase.ParameterType.Organization:
                    var v = $("#" + Parameter.ColumnCode).SheetUser().GetUnitIDs();
                    if (v && v.length > 0) {
                        FilterData[Parameter.ColumnCode] = v;
                    }
                    break;
                case ReportBase.ParameterType.FixedValue:
                    var v = $("#" + Parameter.ColumnCode).val();
                    if (v && v.length > 0) {
                        FilterData[Parameter.ColumnCode] = [v, v];
                    }
                    break;
            }
        }

        return FilterData;
    },

    //加载报表
    LoadReport: function () {
        this.FilterData = this.GetFilterData();

        if (this.ReportSetting.ReportType == this.ReportOptions.ReportType.DataTable) {
            //表格报表
            this.ShowGridReport();
        }
        else {
            //图形报表
            this.ShowChartsReport();
        }
    },

    //表格报表
    ShowGridReport: function () {
        var that = this;
        window.GetQueryParams = function (params) {
            params["FilterData"] = JSON.stringify(that.FilterData);
            return params;
        };

        window.GetRowAttributes = function (row,index) {
            if (row.CountLine) {
                return { class: "CountLine" };
            }
            return {};
        };

        this.$TableContainer.html("");
        var $Table = $("<table>");
        $Table.attr("data-cache", "false");
        $Table.attr("data-toggle", "table");
        //$Table.attr("data-height", "100%");
        $Table.attr("data-url", this.PostUrl + "?Command=" + this.Actions.LoadGridData + "&Code=" + this.ReportCode);
        $Table.attr("data-side-pagination", "server");
        $Table.attr("data-pagination", "true");
        $Table.attr("data-page-list", "[10,20,50,100]");
        $Table.attr("data-columns", "true");
        $Table.attr("data-method", "post");
        $Table.attr("data-row-attributes", "GetRowAttributes");
        $Table.attr("data-query-params", "GetQueryParams");
        $Table.attr("data-content-type", "application/x-www-form-urlencoded");

        var $Tr = $("<tr>");
        for (var i = 0; i < this.ReportSetting.Columns.length; i++) {
            var column = this.ReportSetting.Columns[i];
            var align = "left";
            if (column.ColumnType == 0) {
                align = "right";
            }
            var $Th = $("<th>").attr("data-field", column.ColumnCode).attr("data-align", align).text(column.DisplayName);
            $Tr.append($Th);
        }
        $Table.append($("<thead>").append($Tr));

        this.$TableContainer.append($Table);
        $Table.bootstrapTable();
    },

    //图形报表
    ShowChartsReport: function () {
        var that = this;

        //加载报表数据源数据
        this.PostAjax(
            this.Actions.LoadChartsData,
            { Code: that.ReportCode, FilterData: JSON.stringify(that.FilterData) },
            function (data) {
                that.SourceData = data.SourceData;
                that.SourceColumns = data.SourceColumns;
                that.BuildColumnData();
                that.ChartManager = that.InitChartManager();
                that.ChartTableManager = that.InitChartTableManager();
            });
    },

    BuildColumnData: function () {
        this.ColumnData = {};
        //列标题数据
        this.ColumnData.ColumnFiled = this.ReportSetting.ColumnTitle;
        this.ColumnData.ColumnTitleData = this.ReportSetting.ColumnTitle == null ? null : this.GetDataByColumnCode(this.ReportSetting.ColumnTitle.ColumnCode);
        //行标题数据
        var RowTitles = this.ReportSetting.RowTitles;
        this.ColumnData.RowFiled = null;
        this.ColumnData.RowData = null;
        this.ColumnData.SubRowFiled = null;
        //Error:这里有问题，第二个维度的数据，应该根据第一个维度的数据过滤
        //数据结构应该是这样子 {RowData:[SubRowData]}
        this.ColumnData.SubRowData = null;
        if (RowTitles != null && RowTitles.length > 0) {
            this.ColumnData.RowFiled = RowTitles[0];
            this.ColumnData.RowData = this.GetDataByColumnCode(RowTitles[0].ColumnCode);
        }
        if (RowTitles != null && RowTitles.length > 1) {
            this.ColumnData.SubRowFiled = RowTitles[1];
            this.ColumnData.SubRowData = this.GetDataByColumnCode(RowTitles[1].ColumnCode);
        }
    },

    //根据Code取到数据源字段
    GetSourceColumnByCode: function (ColumnCode) {
        for (var i = 0; i < this.SourceColumns.length; i++) {
            if (this.SourceColumns[i].ColumnCode == ColumnCode) {
                return this.SourceColumns[i];
            }
        }
        return null;
    },

    //读取某列的数据
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
    },

    //初始化图形管理器
    InitChartManager: function () {
        var that = this;
        for (var i = 0; i < that.ReportSetting.Charts.length; i++) {
            that.ChartManagers[that.ReportSetting.Charts[i]] = new ChartManager(
               that.ChartsContainers[that.ReportSetting.Charts[i]],
               parseInt(that.ReportSetting.Charts[i]),
               that.ReportSetting,
               that.SourceData,
               that.ColumnData
               );
        }
    },

    //初始化图形表格管理器
    InitChartTableManager: function () {
        return new ChartTableManager(this.$TableContainer, this.ReportSetting, this.SourceData, this.ColumnData);
    },

    //后台交互取数
    PostAjax: function (Command, Param, callBack, async) {
        $.ajax({
            url: this.PostUrl,
            dataType: "JSON",
            type: "POST",
            cache: false,
            async: async || true,//是否异步
            data: $.extend(true, { Command: Command }, Param),
            success: function (data) {
                if (data.State) {
                    callBack.apply(this, [data]);
                }
                else {
                    $.IShowError(data.Msg);
                }
            }
        });
    }
};

//图表管理器 Begin
var ChartManager = function (ElementID, ChartType, ReportSetting, SourceData, ColumnData) {
    //界面元素
    this.ElementID = ElementID;
    this.ChartType = ChartType;
    this.ReportSetting = ReportSetting;
    this.SourceData = SourceData;
    this.ColumnData = ColumnData;
    this.Options = $.extend(true, {}, EchartOptions);
    this.require = require;
    // 路径配置
    this.require.config({
        paths: {
            echarts: '/Scripts/echarts/'
        }
    });
    //函数绑定
    this.BindDataFun = [
        this.BindLineData,
        this.BindBarData,
        this.BindPieData,
        this.BindAreaData,
        this.BindRadarData,
        this.BindGauge,
    ];

    this.Init();
};

ChartManager.prototype = {
    //初始化
    Init: function () {
        this.Options.title.text = this.ReportSetting.DisplayName;
        this.BindDataFun[this.ChartType].apply(this);
    },

    //设置坐标系图形数据
    SetAxisData: function () {
        //设置列数据:X轴数据
        this.SetXAxisData();

        //报表数据
        //列标题数据
        var ColumnTitle = $.isEmptyObject(this.ColumnData.ColumnFiled) ? "" : this.ColumnData.ColumnFiled.ColumnCode;
        var ColumnTitleData = this.ColumnData.ColumnTitleData;
        //行标题数据
        var RowTitle = $.isEmptyObject(this.ColumnData.RowFiled) ? "" : this.ColumnData.RowFiled.ColumnCode;
        var RowData = this.ColumnData.RowData;
        var SubRowTitle = $.isEmptyObject(this.ColumnData.SubRowFiled) ? "" : this.ColumnData.SubRowFiled.ColumnCode;
        var SubRowData = this.ColumnData.SubRowData;
        //图表数据
        var seriesData = [];
        var legendData = [];
        if (RowData != null) {
            //第一级行标题数据
            for (var i = 0; i < RowData.length; i++) {
                var RowValue = RowData[i];

                if (SubRowData != null) {
                    for (var j = 0; j < SubRowData.length; j++) {
                        var SubRowValue = SubRowData[j];
                        var serie = this.CreateSerie(RowValue + "." + SubRowValue);// { name: RowValue + "." + SubRowValue, itemStyle: itemStyle, itemStyle: itemStyle, type: charType, data: [] };
                        legendData.push(RowValue + "." + SubRowValue);
                        if (ColumnTitleData != null) {
                            //列数据
                            for (var k = 0; k < ColumnTitleData.length; k++) {
                                var ColumnValue = ColumnTitleData[k];
                                if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                                    for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                                        var value = this.CalculationResult(this.ReportSetting.Columns[l], RowTitle, RowValue, SubRowTitle, SubRowValue, ColumnTitle, ColumnValue);
                                        var name = ColumnValue;
                                        this.AddSerieData(serie, value, name);
                                        //serie.data.push(this.CalculationResult(this.ReportSetting.Columns[l], RowTitle, RowValue, SubRowTitle, SubRowValue, ColumnTitle, ColumnValue));
                                    }
                                }
                                else {
                                    //统计
                                    var value = this.CalculationResult(null, RowTitle, RowValue, SubRowTitle, SubRowValue, ColumnTitle, ColumnValue);
                                    var name = "统计";
                                    this.AddSerieData(serie, value, name);
                                    //serie.data.push(this.CalculationResult(null, RowTitle, RowValue, SubRowTitle, SubRowValue, ColumnTitle, ColumnValue));
                                }
                            }
                        }
                        else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                            for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                                var value = this.CalculationResult(this.ReportSetting.Columns[k], RowTitle, RowValue, SubRowTitle, SubRowValue);
                                var name = this.ReportSetting.Columns[k].DisplayName;
                                this.AddSerieData(serie, value, name);
                                //serie.data.push(this.CalculationResult(this.ReportSetting.Columns[k], RowTitle, RowValue, SubRowTitle, SubRowValue));
                            }
                        }
                        else {
                            //统计
                            var value = this.CalculationResult(null, RowTitle, RowValue, SubRowTitle, SubRowValue);
                            var name = "统计";
                            this.AddSerieData(serie, value, name);
                            // serie.data.push(this.CalculationResult(null, RowTitle, RowValue, SubRowTitle, SubRowValue));
                        }
                        //seriesData.push(serie);
                        this.PushSerieToOptions(serie);
                    }
                }
                else {
                    //没有第二级行标题
                    var serie = this.CreateSerie(RowValue);//{ name: RowValue, type: charType, itemStyle: itemStyle, data: [] };
                    legendData.push(RowValue);
                    if (ColumnTitleData != null) {
                        //列数据
                        for (var k = 0; k < ColumnTitleData.length; k++) {
                            var ColumnValue = ColumnTitleData[k];
                            if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                                for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                                    var value = this.CalculationResult(this.ReportSetting.Columns[l], RowTitle, RowValue, null, null, ColumnTitle, ColumnValue);
                                    var name = ColumnValue;
                                    this.AddSerieData(serie, value, name);
                                    //serie.data.push(this.CalculationResult(this.ReportSetting.Columns[l], RowTitle, RowValue, null, null, this.ReportSetting.ColumnTitle, ColumnValue));
                                }
                            }
                            else {
                                //统计
                                var value = this.CalculationResult(null, RowTitle, RowValue, null, null, ColumnTitle, ColumnValue);
                                var name = ColumnValue;
                                this.AddSerieData(serie, value, name);
                                //serie.data.push(this.CalculationResult(null, RowTitle, RowValue, null, null, this.ReportSetting.ColumnTitle, ColumnValue));
                            }
                        }
                    }
                    else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                        for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                            var value = this.CalculationResult(this.ReportSetting.Columns[k], RowTitle, RowValue, null, null);
                            var name = this.ReportSetting.Columns[k].DisplayName;
                            this.AddSerieData(serie, value, name);
                            //serie.data.push(this.CalculationResult(this.ReportSetting.Columns[k], RowTitle, RowValue, null, null));
                        }
                    }
                    else {
                        //统计
                        var value = this.CalculationResult(null, RowTitle, RowValue, null, null);
                        var name = "统计";
                        this.AddSerieData(serie, value, name);
                        //serie.data.push(this.CalculationResult(null, RowTitle, RowValue, null, null));
                    }
                    //seriesData.push(serie);
                    this.PushSerieToOptions(serie);
                }
            }
        }
        else {
            //没有行标题
            if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                    var serie = this.CreateSerie(this.ReportSetting.Columns[l].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[l].FunctionType) + "]");// { name: this.ReportSetting.Columns[l].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[l].FunctionType) + "]", itemStyle: itemStyle, type: charType, data: [] };
                    legendData.push(this.ReportSetting.Columns[l].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[l].FunctionType) + "]");
                    //seriesData.push(serie);
                    for (var k = 0; ColumnTitleData != null && k < ColumnTitleData.length; k++) {
                        //列数据
                        var ColumnValue = ColumnTitleData[k];
                        var value = this.CalculationResult(this.ReportSetting.Columns[l], null, null, null, null, ColumnTitle, ColumnValue);
                        var name = ColumnValue;
                        this.AddSerieData(serie, value, name);
                        //serie.data.push(this.CalculationResult(this.ReportSetting.Columns[l], null, null, null, null, this.ReportSetting.ColumnTitle, ColumnValue));
                    }
                    this.PushSerieToOptions(serie);
                }
            }
            else {
                //统计
                var serie = this.CreateSerie("统计");//{ name: "统计", type: charType, itemStyle: itemStyle, data: [] };
                legendData.push("统计");
                //seriesData.push(serie);
                for (var k = 0; ColumnTitleData != null && k < ColumnTitleData.length; k++) {
                    //列数据
                    var ColumnValue = ColumnTitleData[k];
                    var value = this.CalculationResult(null, null, null, null, null, ColumnTitle, ColumnValue);
                    var name = ColumnValue;
                    this.AddSerieData(serie, value, name);
                    //serie.data.push(this.CalculationResult(null, null, null, null, null, this.ReportSetting.ColumnTitle, ColumnValue));
                }
                this.PushSerieToOptions(serie);
            }
        }

        //this.Options.series = seriesData;
        this.Options.legend.data = legendData;
    },

    //设置列数据:X轴数据
    SetXAxisData: function () {
        var xAxisData = null;
        if (this.ReportSetting.AxisDimension == ReportBase.AxisDimension.RowTilte) {
            //行标题作为X轴数据
            if (this.ColumnData.RowData != null) {
                if (this.ColumnData.SubRowData != null) {
                    xAxisData = [];
                    for (var i = 0; i < this.ColumnData.SubRowData.length; i++) {
                        var SubRowValue = this.ColumnData.SubRowData[i];
                        for (var j = 0; j < this.ColumnData.RowData.length; j++) {
                            var RowValue = this.ColumnData.RowData[j];
                            var name = RowValue + "." + SubRowValue;
                            xAxisData.push(name);
                        }
                    }
                }
                else {
                    xAxisData = this.ColumnData.RowData;
                }
            }
                //Error:重复代码
            else if ($.isEmptyObject(this.ReportSetting.Columns)) {
                xAxisData = ["统计"];
            }
            else {
                xAxisData = [];
                for (var i = 0; i < this.ReportSetting.Columns.length; i++) {
                    xAxisData.push(this.ReportSetting.Columns[i].DisplayName);
                }
            }
        }
        else if (this.ReportSetting.AxisDimension == ReportBase.AxisDimension.ColumnTitle) {
            //列标题作为X坐标
            if (this.ColumnData.ColumnTitleData != null) {
                xAxisData = this.ColumnData.ColumnTitleData;
            }
                //Error:重复代码
            else if ($.isEmptyObject(this.ReportSetting.Columns)) {
                xAxisData = ["统计"];
            }
            else {
                xAxisData = [];
                for (var i = 0; i < this.ReportSetting.Columns.length; i++) {
                    xAxisData.push(this.ReportSetting.Columns[i].DisplayName);
                }
            }
        }
        this.Options.xAxis[0].data = xAxisData;
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
                        case ReportBase.Function.Count:
                            Result++;
                            break;
                        case ReportBase.Function.Sum:
                            Result += val;
                            break;
                        case ReportBase.Function.Avg:
                            Result += val;
                            Count++;

                            break;
                        case ReportBase.Function.Min:
                            if (Result == null) {
                                Result = val;
                            } else {
                                Result = Result > val ? val : Result;
                            }
                            break;
                        case ReportBase.Function.Max:
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
            case ReportBase.Function.Count:
                return "统计";
            case ReportBase.Function.Sum:
                return "求和";
            case ReportBase.Function.Avg:
                return "平均";
            case ReportBase.Function.Min:
                return "最小值";
            case ReportBase.Function.Max:
                return "最大值";
        }
    },

    //创建图表数据元素
    CreateSerie: function (name) {
        return { name: name, type: "line", data: [] };
    },

    //添加图表数据
    AddSerieData: function (serie, value, name) {
        serie.data.push(value);
    },

    //赋值到图表属性上
    PushSerieToOptions: function (serie) {
        if ($.isEmptyObject(this.Options.series)) {
            this.Options.series = [];
        }
        this.Options.series.push(serie);
    },

    //折线图
    BindLineData: function () {
        var that = this;
        this.Options.tooltip.trigger = 'item';
        that.Options.xAxis[0].boundaryGap = false;
        this.Options.title.subtext = "折线图";
        this.Options.toolbox.feature.saveAsImage.name = this.Options.title.text + "(折线图)";

        this.CreateSerie = function (name) {
            return { name: name, type: "line", data: [] };
        };

        this.AddSerieData = function (serie, value, name) {
            serie.data.push(value);
        };

        that.SetAxisData();

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/line' // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(that.ElementID));
                // 为echarts对象加载数据 
                myChart.setOption(that.Options);
            });
    },

    //柱状图
    BindBarData: function () {
        var that = this;
        this.Options.tooltip.trigger = 'item';
        that.Options.xAxis[0].boundaryGap = true;
        this.Options.title.subtext = "柱状图";
        this.Options.toolbox.feature.saveAsImage.name = this.Options.title.text + "(柱状图)";

        this.CreateSerie = function (name) {
            return { name: name, type: "bar", data: [] };
        };

        this.AddSerieData = function (serie, value, name) {
            serie.data.push(value);
        };

        that.SetAxisData();

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/bar' // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(that.ElementID));
                // 为echarts对象加载数据 
                myChart.setOption(that.Options);
            });
    },

    //饼图
    BindPieData: function () {
        var that = this;
        this.Options.title.subtext = "饼图";
        this.Options.toolbox.feature.saveAsImage.name = this.Options.title.text + "(饼图)";
        this.Options.tooltip.trigger = 'item';
        this.Options.tooltip.formatter = "{a} <br/>{b} : {c} ({d}%)";
        this.Options.xAxis = null;
        this.Options.yAxis = null;
        this.Options.grid = null;
        this.Options.polar = null;
        this.SetXAxisData = function () { };

        this.CreateSerie = function (name) {
            return { name: name, itemStyle: { normal: { lable: { show: false }, labelLine: { show: false } } }, type: "pie", data: [], radius: '55%', center: ['50%', '50%'], sumValue: 0 };
        };

        this.AddSerieData = function (serie, value, name) {
            serie.data.push({ value: value, name: name });
            serie.sumValue += value || 0;
        };

        this.PushSerieToOptions = function (serie) {
            if (serie.sumValue == 0) return;
            if ($.isEmptyObject(this.Options.series)) {
                this.Options.series = [];
            }
            this.Options.series.push(serie);
        };

        that.SetAxisData();

        ////最大半径
        var maxradius = 150;
        //计算环的半径大小
        var radius = maxradius / this.Options.series.length;//半径
        if (radius < 5) radius = 5;//最小为5;
        for (var i = 0; i < this.Options.series.length; i++) {
            if (parseInt(i) == 0) {
                this.Options.series[i].radius = [1, radius];
            }
            else {
                this.Options.series[i].radius = [this.Options.series[i - 1].radius[1] + 5, this.Options.series[i - 1].radius[1] + 5 + radius];
            }
        }

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/pie' // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(that.ElementID));
                // 为echarts对象加载数据 
                myChart.setOption(that.Options);
            });
    },

    //区域图
    BindAreaData: function () {
        var that = this;

        this.Options.tooltip.trigger = 'item';
        that.Options.xAxis[0].boundaryGap = false;
        this.Options.title.subtext = "区域图";
        this.Options.toolbox.feature.saveAsImage.name = this.Options.title.text + "(区域图)";

        this.CreateSerie = function (name) {
            return { name: name, type: "line", data: [], itemStyle: { normal: { areaStyle: { type: 'default' } } } };
        };

        this.AddSerieData = function (serie, value, name) {
            serie.data.push(value);
        };

        that.SetAxisData();

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/line' // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(that.ElementID));
                // 为echarts对象加载数据 
                myChart.setOption(that.Options);
            });
    },
    //仪表盘
    BindGauge: function () {
        var that = this;
        //第一列内容
        var myColumnData = this.ColumnData;
        var ColumnCode = myColumnData.RowFiled.ColumnCode;//第一列ColumnCode
        var RowData = myColumnData.RowData;//第一列的值
        var mySourceData = this.SourceData;//数据源
        var ResultData = {};//分组结果,结构为{"第一列的值":{"第二列的Code":result}}
        var ColumnSetting = this.ReportSetting.Columns;//第二列和第三列的Code，
        //取得需要计算的数据
        for (var i = 0; i < RowData.length; i++) {
            ResultData[RowData[i]] = {};
            //取行数据;
            for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                var e = this.ReportSetting.Columns[k].ColumnCode//列Code
                ResultData[RowData[i]][e] = 0;
                var Count = 0;
                var Result = 0;
                //遍历数据源，根据第一列的值分组//取列数据
                for (var j = 0; j < mySourceData.length; j++) {
                    var q = mySourceData[j][ColumnCode];//第一列值
                    if (q == RowData[i]) {
                        var val = mySourceData[j][e];//数据源值
                        //根据FunctionType计算结果
                        switch (parseInt(this.ReportSetting.Columns[k].FunctionType)) {
                            case ReportBase.Function.Count:
                                {  //统计交叉点数量
                                    if (val = RowData[i]) {
                                        Result++;
                                    }
                                }
                                break;
                            case ReportBase.Function.Sum:
                                Result += val;
                                break;
                            case ReportBase.Function.Avg:
                                Result += val;
                                Count++;
                                break;
                            case ReportBase.Function.Min:
                                if (Result == null) {
                                    Result = val;
                                } else {
                                    Result = Result > val ? val : Result;
                                }
                                break;
                            case ReportBase.Function.Max:
                                Result = Result > val ? Result : val;
                                break;
                        }
                        if (Count > 0)
                            Result = Result / Count;
                        ResultData[RowData[i]][e] = Result;
                    }
                }
            }
        }
        function CreateOption(name, jindu, mubiao) {
            var min = jindu > mubiao ? mubiao : jindu;
            var max = jindu > mubiao ? jindu : mubiao;
            var q = {
                toolbox: {
                    show: true,
                    x: 'right',
                    y: 'top',
                    orient: 'horizontal',
                    feature: {
                        restore: { show: true },//还原功能
                        saveAsImage: { show: true, name: "" }//保存图片功能
                    }
                },
                title: {
                    text: '',
                    subtext: "",
                    x: "center"
                },
                tooltip: {
                    trigger: 'item',
                    position: function (position) {
                        return [position[0], position[1] + 50];
                    }
                },

                series: [
                    {
                        min: 0,
                        max: max,
                        type: 'gauge',
                        detail: { formatter: '{value}' },
                        data: [{ value: jindu, name: name }],
                        axisLine: {
                            lineStyle: {

                                color: [[mubiao * 0.2 / max, '#e54d50'], [mubiao * 0.8 / max, '#ffcc3e'], [1, '#a7cd3f']],
                                width: 10,
                            }
                        },
                        axisTick: {
                            length: 12,
                            lineStyle: {
                                color: 'auto'
                            }
                        },
                        splitLine: {
                            length: 20,
                            lineStyle: {
                                color: 'auto'
                            }
                        },

                        title: {
                            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                fontWeight: 'bolder',
                                fontSize: 20,
                                fontStyle: 'italic'
                            }
                        },
                        detail: {
                            borderWidth: 1,
                            borderColor: '#d4d4d4',
                            textStyle: {
                                color: 'auto',
                                fontWeight: 'bolder',
                            }
                        }
                    }
                ]
            }
            return q;
        }
        var $ChartsContainer = $(".ChartsContainer");
        $ChartsContainer.children().remove()
        var target = this.ReportSetting.Columns[1].ColumnCode;
        var doing = this.ReportSetting.Columns[0].ColumnCode;
        var $ul = $("<ul>").attr("class", "nav nav-tabs").attr("role", "tablist").attr("id", "navTabs").attr("data-supporttab", "true");
        var $tablecontent = $("<div>").attr("class", "tab-content").attr("id", "tabContent").attr("style", "height: 400px;");
        $ChartsContainer.append($ul).append($tablecontent);
        require(
           [
               'echarts',
               'echarts/chart/gauge' // 使用仪表盘就加载bar模块，按需加载
           ],
           function (ec) {
               var firstdiv = "";
               //根据计算结果渲染
               for (var i = 0; i < RowData.length; i++) {

                   var id = $.IGuid();
                   if (i == 0) {
                       firstdiv = id;
                   }
                   var $li = $("<li>").attr("role", "presentation").attr("data-panelid", id);
                   $ul.append($li);
                   var $a = $("<a>").attr("href", "javascript:void(0);").attr("role", "tab").attr("aria-expanded", "true").text(RowData[i]).attr("onclick", "myclick(this);");
                   $li.append($a);
                   $oneChart = $("<div>").attr("id", id).attr("role", "tabpanel").attr("style", "width: 100%;height:400px");
                   $tablecontent.append($oneChart);
                   var myOptions = CreateOption(RowData[i], ResultData[RowData[i]][doing], ResultData[RowData[i]][target]);
                   // 基于准备好的dom，初始化echarts图表
                   var myChart = ec.init(document.getElementById(id));
                   // 为echarts对象加载数据 
                   myChart.setOption(myOptions);
                   if (id != firstdiv) {
                       $("#" + id + "").hide();
                   }
                   else {
                       $("#navTabs").find("[data-panelid=" + id + "]").addClass("myactive");
                   }
               }
           });
        //绑定页签点击事件

        // 使用
        //require(
        //    [
        //        'echarts',
        //        'echarts/chart/gauge' // 使用仪表盘就加载bar模块，按需加载
        //    ],
        //    function (ec) {
        //        // 基于准备好的dom，初始化echarts图表
        //        var myChart = ec.init(document.getElementById(that.ElementID));
        //        // 为echarts对象加载数据 
        //        myChart.setOption(that.Options);
        //    });
    },
    //雷达图
    BindRadarData: function () {
        var that = this;

        this.Options.title.subtext = "雷达图";
        this.Options.toolbox.feature.saveAsImage.name = this.Options.title.text + "(雷达图)";
        this.Options.yAxis = null;
        this.Options.grid = null;
        this.Options.polar = null;
        this.Options.tooltip.trigger = "axis"

        this.CreateSerie = function (name) {
            return { name: name, data: [] };
        };

        this.AddSerieData = function (serie, value, name) {
            var isExist = false;
            for (var i = 0; i < serie.data.length; i++) {
                if (serie.data.name == name) {
                    isExist = true;
                    serie.data.value.push(value);
                    break;
                }
            }
            if (!isExist) {
                serie.data.push({ value: [value], name: name });
            }
        };

        this.PushSerieToOptions = function (serie) {
            var radarsdata = { value: [], name: serie.name };
            if ($.isEmptyObject(this.Options.series)) {
                this.Options.series = [];
                this.Options.series.push({ type: "radar", data: [] });
            }
            for (var i = 0; i < serie.data.length; i++) {
                radarsdata.value.push(serie.data[i].value[0]);
            }
            this.Options.series[0].data.push(radarsdata);
        };

        that.SetAxisData();

        //处理雷达图的polar
        this.Options.polar = [{ indicator: [] }];
        for (var i = 0; i < this.Options.xAxis[0].data.length; i++) {
            this.Options.polar[0].indicator.push({ text: this.Options.xAxis[0].data[i] });
            this.Options.polar[0].radius = 150;
            this.Options.polar[0].center = ['50%', 150 * 1.5];
        }
        this.Options.xAxis = null;

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/radar' // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(that.ElementID));
                // 为echarts对象加载数据 
                myChart.setOption(that.Options);
            });
    },
};

var EchartOptions = {
    title: {
        text: '',
        subtext: "",
        x: "center"
    },
    tooltip: {
        trigger: 'item',
        position: function (position) {
            return [position[0], position[1] + 50];
        }
    },
    legend: { data: [], y: "bottom" },
    toolbox: {
        show: true,
        feature: {
            restore: { show: true },//还原功能
            saveAsImage: { show: true, name: "" }//保存图片功能
        }
    },
    xAxis: [{}],
    yAxis: [
    ],
    series: []
};
//图表End

//表格
var ChartTableManager = function ($TableContainer, ReportSetting, SourceData, ColumnData) {
    this.ReportSetting = ReportSetting;
    this.SourceData = SourceData;
    this.$TableView = $TableContainer;
    this.ColumnData = ColumnData;

    this.BuildTable();
};

ChartTableManager.prototype = {
    BuildTable: function () {
        this.$TableView.html("");
        var $Table = $("<table>").addClass("table table-bordered table-condensed");
        var $ReportHead = $("<tr>");

        this.$TableView.append($Table);
        $Table.append($("<thead>").append($ReportHead));

        //列标题数据
        var ColumnFiled = $.isEmptyObject(this.ColumnData.ColumnFiled) ? "" : this.ColumnData.ColumnFiled.ColumnCode;
        var ColumnTitleData = this.ColumnData.ColumnTitleData;

        //行标题数据
        var RowTitle = $.isEmptyObject(this.ColumnData.RowFiled) ? "" : this.ColumnData.RowFiled.ColumnCode;
        var RowData = this.ColumnData.RowData;
        var SubRowTitle = $.isEmptyObject(this.ColumnData.SubRowFiled) ? "" : this.ColumnData.SubRowFiled.ColumnCode;
        var SubRowData = this.ColumnData.SubRowData;


        var RowTitles = this.ReportSetting.RowTitles;
        var RowFiled = this.ColumnData.RowFiled;
        var RowData = this.ColumnData.RowData;
        var SubRowFiled = this.ColumnData.SubRowFiled;
        var SubRowData = this.ColumnData.SubRowData;


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
                                        $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], RowFiled.ColumnCode, RowValue, SubRowFiled.ColumnCode, SubRowValue, ColumnTitle, ColumnValue) + "</td>");
                                    }
                                }
                                else {
                                    //统计
                                    $rowTR.append("<td>" + this.CalculationResult(null, RowFiled.ColumnCode, RowValue, SubRowFiled.ColumnCode, SubRowValue, ColumnTitle, ColumnValue) + "</td>");
                                }
                            }
                        }
                        else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                            for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                                $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[k], RowFiled.ColumnCode, RowValue, SubRowFiled.ColumnCode, SubRowValue) + "</td>");
                            }
                        }
                        else {
                            //统计
                            $rowTR.append("<td>" + this.CalculationResult(null, RowFiled.ColumnCode, RowValue, SubRowFiled.ColumnCode, SubRowValue) + "</td>");
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
                                    $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], RowFiled.ColumnCode, RowValue, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                                }
                            }
                            else {
                                //统计
                                $rowTR.append("<td>" + this.CalculationResult(null, RowFiled.ColumnCode, RowValue, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                            }
                        }
                    }
                    else if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                        for (var k = 0; k < this.ReportSetting.Columns.length; k++) {
                            $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[k], RowFiled.ColumnCode, RowValue, null, null) + "</td>");
                        }
                    }
                    else {
                        //统计
                        $rowTR.append("<td>" + this.CalculationResult(null, RowFiled.ColumnCode, RowValue, null, null) + "</td>");
                    }
                    $Table.append($rowTR);
                }
            }
        }
        else {
            //没有行标题
            var $firstTD = $("<td>");
            if (!$.isEmptyObject(this.ReportSetting.Columns)) {
                for (var l = 0; l < this.ReportSetting.Columns.length; l++) {
                    var $rowTR = $("<tr>").append($firstTD);
                    $Table.append($rowTR);
                    $firstTD.text(this.ReportSetting.Columns[l].DisplayName + "[" + this.GetFunctionName(this.ReportSetting.Columns[l].FunctionType) + "]");
                    for (var k = 0; ColumnTitleData != null && k < ColumnTitleData.length; k++) {
                        //列数据
                        var ColumnValue = ColumnTitleData[k];
                        $rowTR.append("<td>" + this.CalculationResult(this.ReportSetting.Columns[l], null, null, null, null, this.ReportSetting.ColumnTitle.ColumnCode, ColumnValue) + "</td>");
                    }
                }
            }
            else {
                //统计
                var $rowTR = $("<tr>").append($firstTD);
                $firstTD.text("统计");
                $Table.append($rowTR);
                for (var k = 0; ColumnTitleData != null && k < ColumnTitleData.length; k++) {
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
                        case ReportBase.Function.Count:
                            Result++;
                            break;
                        case ReportBase.Function.Sum:
                            Result += val;
                            break;
                        case ReportBase.Function.Avg:
                            Result += val;
                            Count++;

                            break;
                        case ReportBase.Function.Min:
                            if (Result == null) {
                                Result = val;
                            } else {
                                Result = Result > val ? val : Result;
                            }
                            break;
                        case ReportBase.Function.Max:
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
            case ReportBase.Function.Count:
                return "统计";
            case ReportBase.Function.Sum:
                return "求和";
            case ReportBase.Function.Avg:
                return "平均";
            case ReportBase.Function.Min:
                return "最小值";
            case ReportBase.Function.Max:
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
    },
};