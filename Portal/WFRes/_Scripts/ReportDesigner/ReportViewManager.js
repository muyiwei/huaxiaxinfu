$.fn.LoadReport = function (options) {
    if ("undefined" != typeof FilterManager) {
        var undefined;
        FilterManager = undefined;
    }
    ReportViewManager.LoadReport(options.SourceCode, options.PortalRoot, options.TableShowObj, options.dParamShowObj, "", true);
}



//报表显示管理器
var _ReportViewManager_GlobalString = $.Languages.ReportSourceView;

//显示类型
var EnumViewType = {
    //明细汇总表
    Summary: "Summary",
    //交叉分析表
    Cross: "Cross",
    //数据源
    Source: "Source"
};

//浏览器版本控制
var Browser = {
    //userAgent: navigator.userAgent.toLowerCase(),
    version: (navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, '0'])[1],
    safari: /webkit/.test(navigator.userAgent.toLowerCase()),
    opera: /opera/.test(navigator.userAgent.toLowerCase()),
    msie: /msie/.test(navigator.userAgent.toLowerCase()) && !/opera/.test(navigator.userAgent.toLowerCase()),
    mozilla: /mozilla/.test(navigator.userAgent.toLowerCase()) && !/(compatible|webkit)/.test(navigator.userAgent.toLowerCase())
}
//管理器
var ReportViewManager = {
    //#region 变量或配置
    //根站点路径
    PortalRoot: window.localStorage.getItem("H3.PortalRoot") || "",
    //异步处理地址
    PostUrl: (window.localStorage.getItem("H3.PortalRoot") || "") + $.Controller.ReportView.ReportViewController,
    //报表基础类库地址
    ReportBaseSrc: "/WFRes/_Scripts/ReportDesigner/ReportBase.js",
    //过滤管理器js地址
    FilterManagerSrc: "/WFRes/_Scripts/ReportDesigner/FilterManager.js",
    //ligerUI地址
    LigerUISrc: "/WFRes/_Scripts/ligerUI/ligerui.all.js",
    //echarts的js路径
    EchartsSrc: "/WFRes/_Scripts/Echarts/echarts-plain-original.js",
    //报表源编码
    SourceCode: null,
    //展示的类型:Summary-明细汇总表;Source-数据源预览
    ViewType: EnumViewType.Source,
    //表格显示对象，展示表格的div对象，用$("#divId")
    TableShowObj: null,
    //过滤条件显示对象，过滤条件的div对象，用$("#divId")
    ParamShowObj: null,
    //是否前端访问报表
    IsPortal: false,
    //图形的Div
    ChartObj: $("<div></div>"),

    //报表源配置
    ReportSource: {},
    //报表表格管理器
    H3GridManager: null,
    //每页显示数量选择器
    PageSizeOptions: [5, 100, 150, 200, 300, 500, 1000],
    //显示宽度
    Width: "100%",
    //报表显示高度
    Height: "99%",

    //#endregion

    //加载报表配置,参数次序：
    //@SourceCode:报表模板编码,必填
    //@PortalRoot:Portal站点路径；必填
    //@TableShowObj:表格显示对象，展示表格的div对象，用$("#divId")，必填
    //@ParamShowObj:过滤条件显示对象，过滤条件的div对象，用$("#divId")，必填
    //@ViewType:展示的类型:Summary-明细汇总表;Source-数据源预览；非必填，报表没保存时，预览使用
    LoadReport: function () {
        this.SourceCode = arguments[0];
        this.PortalRoot = arguments[1];
        this.TableShowObj = arguments[2];
        this.ParamShowObj = arguments[3];
        this.ViewType = arguments[4];
        this.IsPortal = arguments[5];
        //Error:报表权限
        //加载基础类库
        this.LoadJsFile(this.ReportBaseSrc);
        //展示的编码为空时,
        if (!this.SourceCode) {
            switch (this.ViewType) {
                case EnumViewType.Source:
                    this.ReportSource = parent.ReportSource;
                    break;
                default:
                    this.ReportSource = parent.ReportTemplate;
            }
        }
        else {//编码不为空，从服务端取配置数据
            var method = "LoadSourceSetting";
            var parm = { sourceCode: this.SourceCode };
            this.PostAjax(method, parm, function (data) {
                if (data) {
                    ReportViewManager.ReportSource = data;
                    ReportViewManager.ViewType = ReportViewManager.ReportSource.ReportType == 0 ? "Summary" : "Cross";
                }
            });
            if (ReportViewManager.ReportSource && ReportViewManager.ReportSource.Columns)
                ReportViewManager.ReportSource.Columns = this.InitChildColumns(ReportViewManager.ReportSource.Columns);
        }

        //显示过滤参数
        this.ShowParameters();
        //显示表格
        this.ShowTableView();
    },
    //显示报表
    ShowTableView: function () {
        if (this.ViewType == EnumViewType.Cross) {
            this.ShowEcharts(false);
        }
        else {
            this.ShowligerGrid();
        }
    },

    //重新加载
    Reload: function () {

        if (this.ViewType == EnumViewType.Cross) {
            this.ReloadEcharts();
        }
        else {
            this.ReloadligerGrid();
        }
    },

    //导出报表
    ExportReport: function () {
        if (this.ViewType == EnumViewType.Cross) {
            this.ExportEchartsReport();
        }
        else {
            var containParent = false;
            for (var i in this.ReportSource.Columns) {
                if (this.ReportSource.Columns[i].ReportSourceColumnType == 1) {
                    containParent = true;
                    break;
                }
            }
            if (containParent) {
                var the = this;
                $.ligerDialog.confirm(_ReportViewManager_GlobalString.ReportViewManager_ChildTableNotSupported, function (result) {
                    if (result) the.ExportligerReport();
                })
            } else {
                this.ExportligerReport();
            }
        }
    },

    //#region 明细汇总表

    //展示LigerUi表格报表
    ShowligerGrid: function () {
        if ("undefined" == typeof $.ligerDialog) {
            this.LoadJsFile(this.LigerUISrc);
        }

        var FilterResult = this.GetFilterData(false);
        if (!FilterResult.VerifyResult) return;
        var FilterDatas = FilterResult.FilterData;

        var parms = {};
        var method = "";
        if (this.ViewType == EnumViewType.Source) {
            method = "LoadSourceData";
            parms = {
                reportSourceSetting: JSON.stringify(this.ReportSource),
                filterDatas: JSON.stringify(FilterDatas)
            };
        }
        else if (this.ViewType == EnumViewType.Summary) {
            method = "LoadSummaryData";
            var childrendColumns = this.GetChildrenColumns(this.ReportSource.Columns);
            parms = {
                reportTemplateSetting: JSON.stringify(this.ReportSource),
                childColumns: JSON.stringify(childrendColumns),
                filterDatas: JSON.stringify(FilterDatas)
            };

        }
        //this.CreateCloumns(this.ReportSource.Columns),
        this.TableShowObj.ligerGrid({
            columns: this.CreateCloumns(this.ReportSource.Columns),
            enabledSort: true,
            width: this.Width,
            pageSizeOptions: this.PageSizeOptions,
            height: this.Height,
            headerRowHeight: 30,
            url: this.PostUrl + method,
            dataAction: "server", //服务器排序
            usePager: true,       //服务器分页
            pageSize: this.PageSizeOptions[0],
            rownumbers: true,
            allowHideColumn: false,
            columnWidth: "auto",
            parms: parms
        });
        this.H3GridManager = this.TableShowObj.ligerGetGridManager();
    },

    //重载LigerUi表格报表
    ReloadligerGrid: function () {
        var FilterResult = this.GetFilterData(true);
        if (!FilterResult.VerifyResult) return;
        var FilterDatas = FilterResult.FilterData;
        if (this.H3GridManager == null) {
            var parms = {};
            var method = "";
            if (this.ViewType == EnumViewType.Source) {
                method = "LoadSourceData";
                parms = {
                    reportSourceSetting: JSON.stringify(this.ReportSource),
                    filterDatas: JSON.stringify(FilterDatas)
                };
            }
            else if (this.ViewType == EnumViewType.Summary) {
                method = "LoadSummaryData";
                var childrendColumns = this.GetChildrenColumns(this.ReportSource.Columns);
                parms = {
                    reportTemplateSetting: JSON.stringify(this.ReportSource),
                    childColumns: JSON.stringify(childrendColumns),
                    filterDatas: JSON.stringify(FilterDatas)
                };
            }

            this.TableShowObj.ligerGrid({
                columns: this.CreateCloumns(this.ReportSource.Columns),
                enabledSort: true,
                width: this.Width,
                pageSizeOptions: this.PageSizeOptions,
                height: this.Height,
                headerRowHeight: 30,
                url: this.PostUrl + method,
                dataAction: "server", //服务器排序
                usePager: true,       //服务器分页
                pageSize: this.PageSizeOptions[0],
                rownumbers: true,
                allowHideColumn: false,
                columnWidth: "auto",
                parms: parms
            });
            this.H3GridManager = this.TableShowObj.ligerGetGridManager();
        }
        else {
            this.H3GridManager.setParm("filterDatas", JSON.stringify(FilterDatas));
            this.H3GridManager.reload();
        }
    },
    //获取子列数据
    GetChildrenColumns: function (columns) {
        var childColumns = new Array();
        $.each(columns, function (i, n) {
            if (n.children) {
                $.each(n.children, function (j, k) {
                    childColumns.push(k);
                })
            }
        })
        return childColumns;
    },
    //将子列加载到父列,并删除子列
    InitChildColumns: function (columns) {
        var allColumns = new Array();
        $.each(columns, function (i, n) {
            if (!n.ParentColumnCode) {
                $.each(columns, function (j, k) {
                    if (k.ParentColumnCode == n.ColumnCode) {
                        if (!n["children"]) n["children"] = new Array();
                        n["children"].push(k);
                    }
                })
                allColumns.push(n);
            }
        })
        return allColumns;
    },
    //导出明细汇总表
    ExportligerReport: function () {
        var FilterResult = this.GetFilterData();
        if (!FilterResult.VerifyResult) return;
        var FilterDatas = FilterResult.FilterData;
        this.PostAjax(
            "ExportligerReport",
            {
                reportTemplateSetting: JSON.stringify(this.ReportSource),
                filterDatas: JSON.stringify(FilterDatas)
            },
            function (data) {
                window.location.href = data.FileUrl;
            });
    },
    //#endregion

    //#region 交叉分析表

    //展示Echart图形报表:交叉分析表时使用
    ShowEcharts: function (isShowMsg) {
        var ReportData = null;
        var FilterResult = this.GetFilterData(isShowMsg);
        if (!FilterResult.VerifyResult) return;
        var FilterDatas = FilterResult.FilterData;
        this.PostAjax(
            "LoadChartsData",
            {
                reportTemplateSetting: JSON.stringify(this.ReportSource),
                filterDatas: JSON.stringify(FilterDatas)
            },
            function (jsonData) {
                ReportData = jsonData;
            });

        if (ReportData == null) return;

        //#region 预先加载图形现在必要元素
        //加载echarts类库
        if ("undefined" == typeof echarts) {
            this.LoadJsFile(this.EchartsSrc);
            ////添加图形显示区域
            //this.TableShowObj.before(this.ChartObj);
        }
        //添加图形显示区域
        this.TableShowObj.before(this.ChartObj);

        //#endregion

        ReportData.FilterDatas = FilterDatas;
        //显示echarts图形
        ChartManager.ShowChart(this.ChartObj, this.ReportSource, ReportData);
        //显示数据表格
        GridManager.ShowGrid(this.TableShowObj, this.ReportSource, ReportData);
    },

    //重载Echart图形报表:交叉分析表时使用
    ReloadEcharts: function () {
        this.ShowEcharts(true);
    },

    //导出交叉分析表
    ExportEchartsReport: function () {
        var FilterResult = this.GetFilterData(true);
        if (!FilterResult.VerifyResult) return;
        var FilterDatas = FilterResult.FilterData;
        this.PostAjax(
            "ExportEchartsReport",
            {
                reportTemplateSetting: JSON.stringify(this.ReportSource),
                filterDatas: JSON.stringify(FilterDatas)
            },
            function (data) {
                window.location.href = data.FileUrl;
            });
    },
    //#endregion

    //显示过滤参数
    ShowParameters: function () {
        if (this.ReportSource.Parameters != null && this.ReportSource.Parameters.length > 0) {
            if ("undefined" == typeof FilterManager)
                this.LoadJsFile(this.FilterManagerSrc);
            FilterManager.Load(this.ReportSource.Parameters, this.ParamShowObj, this.PortalRoot);
            FilterManager.ShowFilter();
        }
        else {
            this.ParamShowObj.hide();
        }
    },

    //获取过滤条件数据
    //@isShowMsg 是否显示信息，第一次加载的话，不显示信息
    GetFilterData: function (isShowMsg) {
        var FilterResult = {
            //校验结果
            VerifyResult: true,

            FilterData: null
        };

        if ("undefined" == typeof FilterManager)
            return FilterResult;

        var FilterData = FilterManager.GetFilterData();
        if (this.ValiteFilterData(FilterData, isShowMsg)) {
            FilterResult.VerifyResult = true;
            FilterResult.FilterData = FilterData;
        }
        else {
            FilterResult.VerifyResult = false;
        }

        return FilterResult;
    },

    //校验过滤数据的权限
    ValiteFilterData: function (FilterDatas, isShowMsg) {
        //有过滤参数不允许为空却为空时，不呈现数据
        for (var d in FilterDatas) {
            var filterData = FilterDatas[d];
            if (filterData.AllowNull == false && ((filterData.DefaultValue == "" || filterData.DefaultValue == undefined) || (filterData.ParameterType == EnumParameterType.DateTime && filterData.DefaultValue == ";"))) {
                if (isShowMsg) {
                    var msg = filterData.DisplayName + "," + _ReportViewManager_GlobalString.ReportViewManager_Msg0;
                    //预览时显示提示信息
                    $("#msg").html("<div class='msgprint' style='clear:both;overflow:auto;'>" + msg + "</div>");
                    window.setTimeout(function () {
                        $(".msgprint").fadeOut(500);
                        //如果动画结束则删除节点
                        if (!$(".msgprint").is(":animated")) {
                            $(".msgprint").remove();
                        }
                    }, 5000);
                }
                return false;
            }
        }
        var inclueOrg = false;
        //查找过滤参数：有组织机构时，需要校验权限
        for (var i in FilterDatas) {
            if (FilterDatas[i].DefaultValue == "") continue;
            if (FilterDatas[i].ParameterType == EnumParameterType.Orgnization
                && FilterDatas[i].ParameterValue == 1) {
                inclueOrg = true;
                break;
            }
        }
        var result = true;
        if (inclueOrg) {
            //后台验权
            var parm = { filterDatas: JSON.stringify(FilterDatas) };
            this.PostAjax("ValiteFilterData", parm, function (data) {
                if (!data.Success) {
                    //if (isShowMsg) {
                    //    ShowWarn($.format($.Lang(data.Message), data.Extend));
                    //}
                    if (isShowMsg) {
                        var msg = $.format($.Lang(data.Message), data.Extend);
                        //预览时显示提示信息
                        $("#msg").html("<div class='msgprint' style='clear:both;overflow:auto;'>" + msg + "</div>");
                        window.setTimeout(function () {
                            $(".msgprint").fadeOut(500);
                            //如果动画结束则删除节点
                            if (!$(".msgprint").is(":animated")) {
                                $(".msgprint").remove();
                            }
                        }, 5000);
                    }


                    result = false;
                }
            });
        }
        return result;
    },

    //创建表格列
    CreateCloumns: function (Columns, ParentColumnCode) {
        var cols = new Array();
        if (Columns == null)
            return cols;

        var temp = Columns;

        for (var i = 0, j = Columns.length; i < j; i++) {
            if (ParentColumnCode && Columns[i].ParentColumnCode != null
                && Columns[i].ParentColumnCode != ParentColumnCode) {
                continue;
            }
            var column = {
                display: Columns[i].DisplayName || Columns[i].ColumnCode,
                name: Columns[i].ColumnCode,
            };

            if (Columns[i].DataType == EnumDataType.DateTime) {
                column.type = "date";
                column.format = "yyyy-MM-dd hh:mm:ss";

            }

            if (Columns[i].DataType == EnumDataType.Numeric) {
                column.totalSummary = {
                    type: this.GetFunctionType(Columns[i].FunctionType),
                    render: function (result, column, data) {
                        var renderhtml = "";
                        if (column.totalSummary.type) {
                            var types = column.totalSummary.type.split(',');
                            if (types == 'sum')
                                renderhtml = "Sum=" + result.sum.toFixed(2);
                            else if (types == 'count')
                                renderhtml = "Count=" + result.count;
                            else if (types == 'max')
                                renderhtml = "Max=" + result.max.toFixed(2);
                            else if (types == 'min')
                                renderhtml = "Min=" + result.min.toFixed(2);
                            else if (types == 'avg')
                                renderhtml = "Avg=" + result.avg.toFixed(2);
                        }

                        return "<div>" + renderhtml + "</div>";//"<div>" + _ReportViewManager_GlobalString.ReportViewManager_Total + ":" + data.SummaryColumns[column.columnname] + "</div>";
                    }
                };
            }
            if (Columns[i].ReportSourceColumnType == 1) {//等于报表头
                column.columns = this.CreateCloumns(Columns[i].ChildrenColumns || Columns[i].children, Columns[i].ColumnCode);
            }
            // 链接规则
            if (Columns[i].LinkRule) {
                column.linkrule = Columns[i].LinkRule;
                column.render = function (rowdata, index, value, column) {
                    var href = column.linkrule;
                    if (href.indexOf("{") > -1) {
                        var parts = href.split("{");
                        for (var i = 1, len = parts.length; i < len; i++) {
                            var param = parts[i].substring(0, parts[i].indexOf("}"));
                            href = href.replace("{" + param + "}", (rowdata[param] || ""));
                        }
                    }
                    var link = '<a target="_blank" href="' + href + '">' + value + '</a>';
                    return link;
                }
            }
            if (Columns[i].ColumnWidth && Columns[i].ColumnWidth != "0") {
                column.width = Columns[i].ColumnWidth;
            }
            cols.push(column);
        }
        return cols;
    },
    //汇总方式
    GetFunctionType: function (FunctionType) {
        switch (FunctionType) {
            case 0:
            case "0":
                return "count";
                break;
            case 1:
            case "1":
                return "sum";
                break;
            case 2:
            case "2":
                return "avg";
                break;
            case 3:
            case "3":
                return "min";
                break;
            case 4:
            case "4":
                return "max";
                break;
        }
    },

    //后台交互取数
    PostAjax: function (method, parm, callBack) {
        $.ajax({
            url: this.PostUrl + method,
            dataType: "JSON",
            type: "POST",
            cache: false,
            async: false,//是否异步
            data: parm,
            success: callBack
        });
    },

    //动态加载js类库
    LoadJsFile: function (url) {
        //动态加载echarts，支持ie8
        $.ajax({
            url: this.PortalRoot + url,
            type: "GET",
            dataType: "script",
            async: false,//同步请求
            //cache: true,//添加缓存经常奔溃
            global: false
        });
    }
};

//图形管理器
var ChartManager = {
    //报表图形:设置参数就可以显示
    ReportChart: null,
    //标示图形是否释放，释放的话，ReportChart不可用，需要重新init实例化对象
    IsDispose: false,
    //显示图形
    ShowChart: function (ChartObj, ReportSource, ReportData) {
        ChartObj.show();
        ChartObj.bind("contextmenu", function (ev) { return false; });

        //设置参数
        this.ClearData();
        if (ReportSource.Code == null || ReportSource.Code == "")
            this.SetTitle(_ReportViewManager_GlobalString.ReportViewManager_Preview);
        else
            this.SetTitle(ReportSource.DisplayName);

        //设置数据
        this.SetChartData(ReportSource, ReportData);

        //设置显示区域样式
        ChartObj.height(this.GetChartAraeHeight(ReportSource));
        ChartObj.css("border", "1px solid #ccc");
        ChartObj.css("padding", "10px");

        this.SetTools(ChartObj, ReportSource, ReportData);
        //行列转制
        if (this.IsChangeRank)
            this.ChangeRank(ReportSource);

        //释放后实例不再可用
        if (this.ReportChart && this.ReportChart.dispose && !this.IsDispose) {
            this.ReportChart.dispose();
            this.IsDispose = true;
        }

        //没有数据时，不展示图形
        if (ReportData.ReportData.length == 0) {
            ChartObj.hide();
            return;
        }
        //开始初始化并渲染图形，设置释放标示
        this.IsDispose = false;
        var chartElement = ChartObj[0];
        this.ReportChart = echarts.init(chartElement);
        this.ReportChart.setOption(this.Option);
        if (ReportSource.DrillCode != null && ReportSource.DrillCode != "") {
            this.ReportChart.on(echarts.config.EVENT.CLICK, function (param) {
                ChartManager.ChartClick(this, param, ReportSource, ReportData);
            });
        }
    },

    //报表点击事件
    ChartClick: function (chartEvent, param, ReportSource, ReportData) {
        var FilterDatas = ReportData.FilterDatas;
        var seriesIndex = param.seriesIndex;
        var dataIndex = param.dataIndex;
        var serie = chartEvent.getSeries()[seriesIndex];
        var DrillParams = serie.DrillParams[dataIndex];
        //var data = series[seriesIndex];
        var DrillCode = ReportSource.DrillCode;
        var params = "&randkey=" + Math.random();
        var paramsKeys = new Array();
        for (var key in DrillParams) {
            params += "&" + key + "=" + encodeURI(DrillParams[key]);
            paramsKeys.push(key);
        }
        switch (ReportViewManager.IsPortal) {//前台钻取和后台钻取,地址不一致
            case true:
                if (FilterManager.GetQueryString("NeedBack") == null) {
                    //修改当前的报表地址，钻取返回的时候，能保留过滤参数的修改
                    var backUrl = window.location.origin + window.location.pathname + "#/app/ShowReport/" + ReportSource.Code + "/";
                    for (var i in FilterDatas) {
                        if (FilterDatas[i].ParameterType == EnumParameterType.DateTime) continue;
                        if (FilterDatas[i].DefaultValue == "") continue;
                        if (paramsKeys.indexOf(FilterDatas[i].ColumnCode) < 0) {
                            params += "&" + FilterDatas[i].ColumnCode + "=" + encodeURI(FilterDatas[i].DefaultValue);
                        }
                        if (backUrl.indexOf("&") > -1)
                            backUrl += "&";
                        backUrl += FilterDatas[i].ColumnCode + "=" + encodeURI(FilterDatas[i].DefaultValue);
                    }
                    window.history.replaceState(window.history.state, "", backUrl);
                }
                //params = params.substring(1, params.length);
                window.location.href = window.location.origin + window.location.pathname + "#/app/ShowReport/" + DrillCode + "/NeedBack=true" + params;
                break;
            default:
                if (QueryString("NeedBack") == null) {
                    //修改当前的报表地址，钻取返回的时候，能保留过滤参数的修改
                    var backUrl = window.location.origin + window.location.pathname + "?Code=" + ReportSource.Code + "&url=BPA/ReportSourceView.html";
                    for (var i in FilterDatas) {
                        if (FilterDatas[i].ParameterType == EnumParameterType.DateTime) continue;
                        if (FilterDatas[i].DefaultValue == "") continue;
                        if (paramsKeys.indexOf(FilterDatas[i].ColumnCode) < 0) {
                            params += "&" + FilterDatas[i].ColumnCode + "=" + encodeURI(FilterDatas[i].DefaultValue);
                        }
                        if (backUrl.indexOf("?") < 0)
                            backUrl += "?";
                        else
                            backUrl += "&";

                        backUrl += FilterDatas[i].ColumnCode + "=" + encodeURI(FilterDatas[i].DefaultValue);
                    }
                    window.history.replaceState(window.history.state, "", backUrl);
                }
                window.location.href = window.location.origin + window.location.pathname + "?url=BPA/ReportSourceView.html&ViewType=Cross&NeedBack=true&Code=" + DrillCode + params;
                break;
        }
    },

    //图形展示区域的高度
    GetChartAraeHeight: function (ReportSource) {
        //if (ReportSource.DefaultChart == "pie")
        //    return 500 + this.LegendRow * 30;
        //return 400 + this.LegendRow * 30;

        var maxLength = 0;
        if (this.Option.xAxis != null) {
            for (var i = 0; i < this.Option.xAxis[0].data.length; i++) {
                var str = new String(this.Option.xAxis[0].data[i]);
                var byteCount = 0;
                for (var j = 0; j < str.length; j++) {
                    var c = str.charCodeAt(j);
                    if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                        byteCount += 1;
                    }
                    else {
                        byteCount += 2;
                    }
                }
                if (maxLength < byteCount) {
                    maxLength = byteCount;
                }
            }
        }

        var addHeight = 0;
        if (maxLength > 0) {
            //console.log(maxLength);
            addHeight = 8;
            var frist = 30;
            for (i = 0; i < maxLength; i++) {
                frist = frist / ((i % 2) + 1);
                //console.log(frist);
                addHeight += frist;
            }
            //console.log(addHeight);
            this.SetGridBottom(addHeight);
        }
        return 400 + addHeight;
    },

    //设置工具
    SetTools: function (ChartObj, ReportSource, ReportData) {
        //清空原来的工具栏
        if ($(".chartTypeToolBar").length > 0)
            $(".chartTypeToolBar").remove();
        //重新设置工具栏，不然绑定事件的数据源无法变化
        var toolBar = $("<div class='chartTypeToolBar'></div>");
        var btnLine = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_Line + "</a>");
        var btnBar = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_Bar + "</a>");
        var btnPie = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_Pie + "</a>");
        var btnArea = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_Area + "</a>");
        var btnRadar = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_Radar + "</a>");
        var btnChangeRank = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_ReplacementCoordinate + "</a>");
        var btnChangeLegend = $("<a href='javascript:void(0)'>" + _ReportViewManager_GlobalString.ReportViewManager_ReplacementRanks + "</a>");



        btnLine.click(function () {
            ReportSource.DefaultChart = EnumChartType.Line;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnBar.click(function () {
            ReportSource.DefaultChart = EnumChartType.Bar;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnPie.click(function () {
            if (ChartManager.IsChangeRank) {
                ChartManager.IsChangeRank = false;
            }
            ReportSource.DefaultChart = EnumChartType.Pie;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnArea.click(function () {
            ReportSource.DefaultChart = EnumChartType.Area;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnRadar.click(function () {
            ReportSource.DefaultChart = EnumChartType.Radar;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnChangeRank.click(function () {
            if (ReportSource.DefaultChart == EnumChartType.Pie) return;
            if (ReportSource.DefaultChart == EnumChartType.Radar) return;
            if (ChartManager.IsChangeRank) {
                ChartManager.ChangeRank();
            }
            ChartManager.IsChangeRank = !ChartManager.IsChangeRank;
            ChartManager.ShowChart(ChartObj, ReportSource, ReportData);
        });

        btnChangeLegend.click(function () {
            ChartManager.ChangeLegend();
        });

        for (var i in ReportSource.Charts) {
            switch (ReportSource.Charts[i]) {
                case 0:
                case EnumChartType.Line:
                    toolBar.append(btnLine);
                    break;
                case 1:
                case EnumChartType.Bar:
                    toolBar.append(btnBar);
                    break;
                case 2:
                case EnumChartType.Pie:
                    toolBar.append(btnPie);
                    break;
                case 3:
                case EnumChartType.Area:
                    toolBar.append(btnArea);
                    break;
                case 4:
                case EnumChartType.Radar:
                    toolBar.append(btnRadar);
                    break;
            }
        }

        toolBar.append(btnChangeLegend);
        if (typeof (FilterManager) != "undefined" && FilterManager.GetQueryString("NeedBack") == "true") {
            var btnHistory = $("<a href='javascript:void(0);'>" + _ReportViewManager_GlobalString.ReportViewManager_Return + "</a>");
            btnHistory.click(function () {
                history.back(-1);
            });
            toolBar.append(btnHistory);
        }

        ChartObj.before(toolBar);
    },

    //设置标题
    SetTitle: function (title, subtitle) {
        this.Option.title.text = title;
        this.Option.title.subtext = subtitle;
    },

    //设置分组数据
    SetGroupData: function (data) {
        this.Option.legend.data = data;
    },

    //添加分组数据
    AddGroupData: function (data) {
        //var dataLength = this.Option.legend.data.length - (this.LegendRow - 1);
        //if (dataLength > 0 && (dataLength % 4) == 0) {
        //    this.SetGridBottom((1 + this.LegendRow) * 30);
        //    this.Option.legend.data.push("");
        //    this.LegendRow++;
        //}
        this.Option.legend.data.push(data);
    },

    //行数量
    LegendRow: 1,

    //设置列数据:X轴数据 、 极坐标
    SetColumnData: function (data) {
        if (this.ChartType.toLowerCase() == EnumChartType.Radar.toLowerCase()) {
            for (var i = 0; i < data.length; i++) {
                this.Option.polar[0].indicator.push({ text: data[i] });
                this.Option.polar[0].radius = 150;
                this.Option.polar[0].center = ['50%', 150 * 1.5];
            }
        }
        else {
            this.Option.xAxis[0].data = data;
        }
    },

    //设置Y轴单位
    SetYAxisUnit: function (AxisUnit) {
        if (this.Option.yAxis == null) return;
        this.Option.yAxis[0].name = _ReportViewManager_GlobalString.ReportViewManager_Unit + ":" + AxisUnit;
    },
    //设置X轴单位
    SetXAxisUnit: function (XAxisUnit) {
        if (this.Option.xAxis == null) return;
        this.Option.xAxis[0].name = _ReportViewManager_GlobalString.ReportViewManager_Unit + ":" + XAxisUnit;
    },

    //是否转置横纵坐标
    IsChangeRank: false,

    //横纵坐标置换
    ChangeRank: function () {
        var xAxisTemp = ObjectClone(this.Option.xAxis);
        this.Option.xAxis = ObjectClone(this.Option.yAxis);
        this.Option.yAxis = xAxisTemp;
    },

    //设置网格底部高度,对直角系图形有效
    SetGridBottom: function (height) {
        if (this.Option.grid != null) {
            this.Option.grid.y2 = height;
            this.Option.grid.x2 = 100;

        }
    },

    //获取网格底部高度,用于计算图表显示区域的高度
    GetGridBottom: function () {
        return parseInt(this.Option.grid.y2);
    },

    //清理数据
    ClearData: function (datas) {
        this.Option.title.text = null;
        this.Option.title.subtext = null;
        this.Option.legend.data = [];
        this.Option.series = [];
        this.LegendRow = 1;
    },

    //图形类型
    ChartType: "line",//Bar,Pie

    ItemStyle: null,
    //设置图表类型
    SetChartType: function (chartType) {
        this.Option.xAxis = [{ type: 'category', boundaryGap: false, data: [] }];
        this.Option.yAxis = [{ type: 'value' }];
        this.Option.grid = { y2: 60 };
        this.Option.polar = null;
        switch (chartType) {
            case 0:
            case EnumChartType.Line:
                this.ChartType = "line";
                this.Option.xAxis[0].boundaryGap = false;
                this.Option.xAxis[0].axisLabel = { rotate: 45 };
                this.ItemStyle = null;
                break;
            case 1:
            case EnumChartType.Bar:
                this.ChartType = "bar";
                this.Option.xAxis[0].boundaryGap = true;
                this.Option.xAxis[0].axisLabel = { rotate: 45 };
                this.ItemStyle = null;
                break;
            case 2:
            case EnumChartType.Pie:
                this.ChartType = "pie";
                this.Option.xAxis = null;
                this.Option.yAxis = null;
                this.Option.grid = null;
                this.Option.polar = null;
                break;
            case 3:
            case EnumChartType.Area:
                this.ChartType = "line";
                this.ItemStyle = { normal: { areaStyle: { type: 'default' } } };
                this.Option.xAxis[0].boundaryGap = false;
                this.Option.xAxis[0].axisLabel = { rotate: 45 };
                break;
            case 4:
            case EnumChartType.Radar:
                this.ChartType = "radar";
                this.Option.xAxis = null;
                this.Option.yAxis = null;
                this.Option.grid = null;
                this.Option.polar = [{ indicator: [] }];
                break;
            default:
                this.ChartType = chartType;
                this.Option.xAxis[0].boundaryGap = false;
                this.ItemStyle = null;
                break;
        }
    },

    //设置图表数据
    SetChartData: function (ReportSource, ReportData) {
        //设置图形类型
        if ("undefined" == typeof ReportSource.DefaultChart) ReportSource.DefaultChart = EnumChartType.Line;
        this.SetChartType(ReportSource.DefaultChart);

        //设置Y轴单位
        if (ReportSource.AxisUnit)
            this.SetYAxisUnit(ReportSource.AxisUnit);
        if (ReportSource.XAxisUnit)
            this.SetXAxisUnit(ReportSource.XAxisUnit);

        if (this.ChartType.toLowerCase() == EnumChartType.Pie.toLowerCase()) {
            this.SetPieData(ReportSource, ReportData);
            //行标题作为x轴
            if (ReportSource.AxisDimension == AxisDimension.ColumnTitle) {
                this.ChangePieLegend();
            }
        }
        else if (this.ChartType.toLowerCase() == EnumChartType.Radar.toLowerCase()) {
            this.SetPolarData(ReportSource, ReportData);
            //行标题作为x轴
            if (ReportSource.AxisDimension == AxisDimension.ColumnTitle) {
                this.ChangePolarLegend();
            }
        }
        else {
            this.SetAxisData(ReportSource, ReportData);
            //行标题作为x轴
            if (ReportSource.AxisDimension == AxisDimension.RowTilte) {
                this.ChangeAxisLegend();
            }
        }
    },

    //设置环形图表数据
    SetPieData: function (ReportSource, ReportData) {
        var ColumnData = ReportData.ColumnData;
        var GroupData = ReportData.GroupData;
        var SubGroupData = ReportData.SubGroupData;

        var ColumnDrillData = ReportData.ColumnDrillData;
        var GroupDrillData = ReportData.GroupDrillData;
        var SubGroupDrillData = ReportData.SubGroupDrillData;

        var ExistRowTitle = ReportData.ExistRowTitle;
        var ReportData = ReportData.ReportData;
        //提示
        this.Option.tooltip = { trigger: 'item', formatter: "{a} <br/>{b} : {c} ({d}%)" };

        for (var i = 0; i < ColumnData.length; i++) {
            this.AddGroupData(ColumnData[i]);
        }

        if (ExistRowTitle) {
            //设置了行标题
            var rowTitle = ReportSource.RowTitle.split(";");
            var groupTitle = rowTitle[0];
            var subGroupTitle = rowTitle.length > 1 ? rowTitle[1] : null;
            var columnCode = "CountNum";//有行标题时，最多只能有一个统计字段
            if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                columnCode = ReportSource.Columns[0].ColumnCode;
            }

            //开始循环
            for (var i = 0; i < GroupData.length; i++) {
                if (GroupData[i] == null) continue;
                var groupValue = GroupData[i];
                if (subGroupTitle == null) {//只有一个行标题
                    var serie = { name: groupValue, center: ['50%', '50%'], type: "pie", data: [], DrillParams: [] };
                    var sumValue = 0;

                    if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                        //没有列标题
                        for (var j = 0; j < ReportSource.Columns.length; j++) {
                            var Column = ReportSource.Columns[j];
                            var columnValue = ColumnData[j];
                            var reportValue = 0;
                            for (var k = 0; k < ReportData.length; k++) {
                                if (ReportData[k][groupTitle] == groupValue) {
                                    if (ReportData[k][Column.ColumnCode] != null)
                                        reportValue = ReportData[k][Column.ColumnCode];
                                    break;
                                }
                            }
                            sumValue += reportValue;
                            serie.data.push({ value: reportValue, name: columnValue });

                            var drillParam = {};
                            drillParam[ReportSource.RowDrillParam[0].Code] = GroupDrillData[i];
                            serie.DrillParams.push(drillParam);
                        }
                    }
                    else {
                        for (var j = 0; j < ColumnData.length; j++) {
                            var columnValue = ColumnData[j];
                            var reportValue = 0;
                            for (var k = 0; k < ReportData.length; k++) {
                                if (ReportData[k][groupTitle] == groupValue
                                    && columnValue == ReportData[k][ReportSource.ColumnTitle]) {
                                    if (ReportData[k][columnCode] != null)
                                        reportValue = ReportData[k][columnCode];
                                    break;
                                }
                            }
                            sumValue += reportValue;
                            serie.data.push({ value: reportValue, name: columnValue });

                            var drillParam = {};
                            drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[i];
                            drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];

                            serie.DrillParams.push(drillParam);
                        }
                    }
                    if (sumValue > 0)
                        this.Option.series.push(serie);
                }
                else {//有第二个
                    for (var l = 0; l < SubGroupData.length; l++) {
                        if (SubGroupData[l] == null) continue;
                        var subGroupValue = SubGroupData[l];

                        var serie = { name: groupValue + "." + subGroupValue, center: ['50%', '50%'], type: "pie", data: [], DrillParams: [] };
                        var sumValue = 0;

                        if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                            //没有列标题
                            for (var j = 0; j < ReportSource.Columns.length; j++) {
                                var Column = ReportSource.Columns[j];
                                var columnValue = ColumnData[j];
                                var reportValue = 0;
                                for (var k = 0; k < ReportData.length; k++) {
                                    if (ReportData[k][groupTitle] == groupValue
                                        && ReportData[k][subGroupTitle] == subGroupValue) {
                                        if (ReportData[k][Column.ColumnCode] != null)
                                            reportValue = ReportData[k][Column.ColumnCode];
                                        break;
                                    }
                                }
                                sumValue += reportValue;
                                serie.data.push({ value: reportValue, name: columnValue });

                                var drillParam = {};
                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[i];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];

                                serie.DrillParams.push(drillParam);
                            }
                        }
                        else {
                            for (var j = 0; j < ColumnData.length; j++) {
                                var columnValue = ColumnData[j];
                                var reportValue = 0;
                                for (var k = 0; k < ReportData.length; k++) {
                                    if (ReportData[k][groupTitle] == groupValue
                                        && ReportData[k][subGroupTitle] == subGroupValue
                                        && columnValue == ReportData[k][ReportSource.ColumnTitle]) {
                                        if (ReportData[k][columnCode] != null)
                                            reportValue = ReportData[k][columnCode];
                                        break;
                                    }
                                }
                                sumValue += reportValue;
                                serie.data.push({ value: reportValue, name: columnValue });

                                var drillParam = {};
                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[i];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];
                                drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];
                                serie.DrillParams.push(drillParam);
                            }
                        }
                        if (sumValue > 0)
                            this.Option.series.push(serie);
                    }
                }
            }
        }
        else {
            //没有设置行标题
            for (var key = 0; key < GroupData.length; key++) {
                if (GroupData[key] == null || GroupData[key] == "") continue;

                var serie = { name: GroupData[key], center: ['50%', '50%'], type: "pie", data: [], DrillParams: [] };
                var sumValue = 0;
                var reportValue = 0;
                for (var i = 0; i < ReportData.length; i++) {
                    //找到这一分组的数据
                    if (ReportData[i][key] != null) {
                        reportValue = ReportData[i][key];
                    }
                    sumValue += reportValue;
                    serie.data.push({ value: reportValue, name: ColumnData[i] });
                    var drillParam = {};
                    drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[i];
                    serie.DrillParams.push(drillParam);
                }
                if (sumValue > 0)
                    this.Option.series.push(serie);
            }
        }

        this.SetPieRadiu();
    },

    //#region  计算环的半径大小
    SetPieRadiu: function () {
        //Error:这里会有问题，如果太多的话，就会导致下面的legend或表格展示重叠

        //最大半径
        var maxradius = 150;
        //计算环的半径大小
        var radius = maxradius / this.Option.series.length;//半径
        if (radius < 5) radius = 5;//最小为5;
        for (var i = 0; i < this.Option.series.length; i++) {
            if (parseInt(i) == 0) {
                this.Option.series[i].radius = [0, radius];
            }
            else {
                this.Option.series[i].radius = [this.Option.series[i - 1].radius[1] + 5, this.Option.series[i - 1].radius[1] + 5 + radius];
            }
        }
    },
    //#endregion

    //设置坐标系图形数据
    SetAxisData: function (ReportSource, ReportData) {
        var ColumnData = ReportData.ColumnData;
        var GroupData = ReportData.GroupData;
        var SubGroupData = ReportData.SubGroupData;

        var ColumnDrillData = ReportData.ColumnDrillData;
        var GroupDrillData = ReportData.GroupDrillData;
        var SubGroupDrillData = ReportData.SubGroupDrillData;

        var ExistRowTitle = ReportData.ExistRowTitle;
        var ReportData = ReportData.ReportData;
        this.Option.tooltip = { trigger: 'axis' };

        //设置列数据:X轴数据
        this.SetColumnData(ColumnData);

        if (ExistRowTitle) {
            //设置了行标题
            var rowTitle = ReportSource.RowTitle.split(";");
            var groupTitle = rowTitle[0];
            var subGroupTitle = rowTitle.length > 1 ? rowTitle[1] : null;
            var columnCode = "CountNum";//同时有行标题和列标题时，最多只能有一个统计字段

            for (var key = 0; key < GroupData.length; key++) {
                if (GroupData[key] == null || GroupData[key] == "") continue;
                var groupValue = GroupData[key];

                if (subGroupTitle == null) {
                    //只有一个行标题
                    this.AddGroupData(groupValue);
                    var serie = { name: groupValue, type: this.ChartType, data: [], DrillParams: [] };
                    if (this.ItemStyle != null) {
                        serie.itemStyle = this.ItemStyle;
                    }
                    if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                        //没有列标题
                        for (var j = 0; j < ReportSource.Columns.length; j++) {
                            var Column = ReportSource.Columns[j];
                            var reportValue = 0;
                            for (var i = 0; i < ReportData.length; i++) {
                                if (ReportData[i][groupTitle] == groupValue) {
                                    if (ReportData[i][Column.ColumnCode] != null)
                                        reportValue = ReportData[i][Column.ColumnCode];
                                    break;
                                }
                            }
                            serie.data.push(reportValue);
                            var drillParam = {};
                            drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                            serie.DrillParams.push(drillParam);
                        }
                    }
                    else {
                        if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                            columnCode = ReportSource.Columns[0].ColumnCode;
                        }
                        //有列标题
                        for (var j in ColumnData) {
                            var columnValue = ColumnData[j];
                            var reportValue = 0;
                            for (var i in ReportData) {
                                if (ReportData[i][groupTitle] == groupValue
                                    && columnValue == ReportData[i][ReportSource.ColumnTitle]) {
                                    if (ReportData[i][columnCode] != null)
                                        reportValue = ReportData[i][columnCode];
                                    break;
                                }
                            }
                            serie.data.push(reportValue);
                            var drillParam = {};
                            drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                            drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];
                            serie.DrillParams.push(drillParam);
                        }
                    }
                    this.Option.series.push(serie);
                }
                else {
                    for (var l in SubGroupData) {
                        if (SubGroupData[l] == null) continue;
                        var subGroupValue = SubGroupData[l];
                        //第二个行标题
                        this.AddGroupData(groupValue + "." + subGroupValue);
                        var serie = { name: groupValue + "." + subGroupValue, type: this.ChartType, data: [], DrillParams: [] };
                        if (this.ItemStyle != null) {
                            serie.itemStyle = this.ItemStyle;
                        }

                        if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                            //没有列标题
                            for (var j in ReportSource.Columns) {
                                var Column = ReportSource.Columns[j];
                                var reportValue = 0;
                                for (var i in ReportData) {
                                    if (ReportData[i][groupTitle] == groupValue
                                        && ReportData[i][subGroupTitle] == subGroupValue) {
                                        if (ReportData[i][Column.ColumnCode] != null)
                                            reportValue = ReportData[i][Column.ColumnCode];
                                        break;
                                    }
                                }
                                serie.data.push(reportValue);
                                var drillParam = {};
                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];
                                serie.DrillParams.push(drillParam);
                            }
                        }
                        else {
                            if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                                columnCode = ReportSource.Columns[0].ColumnCode;
                            }
                            for (var j in ColumnData) {
                                var columnValue = ColumnData[j];
                                var reportValue = 0;
                                for (var i in ReportData) {
                                    if (ReportData[i][groupTitle] == groupValue
                                        && ReportData[i][subGroupTitle] == subGroupValue
                                        && columnValue == ReportData[i][ReportSource.ColumnTitle]) {
                                        if (ReportData[i][columnCode] != null)
                                            reportValue = ReportData[i][columnCode];
                                        break;
                                    }
                                }
                                serie.data.push(reportValue);
                                var drillParam = {};

                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];
                                drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];
                                serie.DrillParams.push(drillParam);
                            }
                        }
                        this.Option.series.push(serie);
                    }
                }
            }
        }
        else {
            //没有设置行标题
            for (var key in GroupData) {
                if (GroupData[key] == null || GroupData[key] == "") continue;
                this.AddGroupData(GroupData[key]);
                //找到某一分组
                var serie = { name: GroupData[key], type: this.ChartType, data: [], DrillParams: [] };
                if (this.ItemStyle != null) {
                    serie.itemStyle = this.ItemStyle;
                }
                for (var i in ReportData) {
                    //找到这一分组的数据
                    if (ReportData[i][key] != null) {
                        serie.data.push(ReportData[i][key]);
                    }
                    else {
                        serie.data.push(0);
                    }
                    var drillParam = {};
                    drillParam[ReportSource.ColumnDrillParam.Name] = ReportData[i][ReportSource.ColumnDrillParam.Code];
                    serie.DrillParams.push(drillParam);
                }
                this.Option.series.push(serie);
            }
        }
    },

    //设置极坐标系图表数据
    SetPolarData: function (ReportSource, ReportData) {
        var ColumnData = ReportData.ColumnData;
        var GroupData = ReportData.GroupData;
        var SubGroupData = ReportData.SubGroupData;

        var ColumnDrillData = ReportData.ColumnDrillData;
        var GroupDrillData = ReportData.GroupDrillData;
        var SubGroupDrillData = ReportData.SubGroupDrillData;

        var ExistRowTitle = ReportData.ExistRowTitle;
        var ReportData = ReportData.ReportData;
        this.Option.tooltip = { trigger: 'axis' };

        this.SetColumnData(ColumnData);

        this.Option.series = [];
        var serie = { type: 'radar', data: [], DrillParams: [] };
        this.Option.series.push(serie);

        //设置数据内容
        if (ExistRowTitle) {
            //设置了行标题
            var rowTitle = ReportSource.RowTitle.split(";");
            var groupTitle = rowTitle[0];
            var subGroupTitle = rowTitle.length > 1 ? rowTitle[1] : null;
            var columnCode = "CountNum";//同时有行标题和列标题时，最多只能有一个统计字段

            for (var key = 0; key < GroupData.length; key++) {
                if (GroupData[key] == null || GroupData[key] == "") continue;
                var groupValue = GroupData[key];

                if (subGroupTitle == null) {
                    //只有一个行标题
                    this.AddGroupData(groupValue);
                    var dataValue = { name: groupValue, value: [] };
                    if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                        //没有列标题
                        for (var j = 0; j < ReportSource.Columns.length; j++) {
                            var Column = ReportSource.Columns[j];
                            var reportValue = 0;
                            for (var i = 0; i < ReportData.length; i++) {
                                if (ReportData[i][groupTitle] == groupValue) {
                                    if (ReportData[i][Column.ColumnCode] != null)
                                        reportValue = ReportData[i][Column.ColumnCode];
                                    break;
                                }
                            }
                            dataValue.value.push(reportValue);
                            var drillParam = {};
                            drillParam[groupTitle] = groupValue;
                            drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                            serie.DrillParams.push(drillParam);
                        }
                    }
                    else {
                        if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                            columnCode = ReportSource.Columns[0].ColumnCode;
                        }
                        //有列标题
                        for (var j = 0; j < ColumnData.length; j++) {
                            var columnValue = ColumnData[j];
                            var reportValue = 0;
                            for (var i = 0; i < ReportData.length; i++) {
                                if (ReportData[i][groupTitle] == groupValue
                                    && columnValue == ReportData[i][ReportSource.ColumnTitle]) {
                                    if (ReportData[i][columnCode] != null)
                                        reportValue = ReportData[i][columnCode];
                                    break;
                                }
                            }
                            dataValue.value.push(reportValue);
                            var drillParam = {};

                            drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                            drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];
                            serie.DrillParams.push(drillParam);
                        }
                    }
                    serie.data.push(dataValue);
                }
                else {
                    for (var l = 0; l < SubGroupData.length; l++) {
                        if (SubGroupData[l] == null) continue;
                        var subGroupValue = SubGroupData[l];
                        //第二个行标题
                        this.AddGroupData(groupValue + "." + subGroupValue);
                        var dataValue = { name: groupValue + "." + subGroupValue, value: [] };

                        if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                            //没有列标题
                            for (var j in ReportSource.Columns) {
                                var Column = ReportSource.Columns[j];
                                var reportValue = 0;
                                for (var i = 0; i < ReportData.length; i++) {
                                    if (ReportData[i][groupTitle] == groupValue
                                        && ReportData[i][subGroupTitle] == subGroupValue) {
                                        if (ReportData[i][Column.ColumnCode] != null)
                                            reportValue = ReportData[i][Column.ColumnCode];
                                        break;
                                    }
                                }
                                dataValue.value.push(reportValue);
                                var drillParam = {};
                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];
                                serie.DrillParams.push(drillParam);
                            }
                        }
                        else {
                            if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                                columnCode = ReportSource.Columns[0].ColumnCode;
                            }
                            for (var j = 0; j < ColumnData.length; j++) {
                                var columnValue = ColumnData[j];
                                var reportValue = 0;
                                for (var i in ReportData) {
                                    if (ReportData[i][groupTitle] == groupValue
                                        && ReportData[i][subGroupTitle] == subGroupValue
                                        && columnValue == ReportData[i][ReportSource.ColumnTitle]) {
                                        if (ReportData[i][columnCode] != null)
                                            reportValue = ReportData[i][columnCode];
                                        break;
                                    }
                                }
                                dataValue.value.push(reportValue);
                                var drillParam = {};
                                drillParam[ReportSource.RowDrillParam[0].Name] = GroupDrillData[key];
                                drillParam[ReportSource.RowDrillParam[1].Name] = SubGroupDrillData[l];
                                drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[j];
                                serie.DrillParams.push(drillParam);
                            }
                        }
                        serie.data.push(dataValue);
                    }
                }
            }
        }
        else {
            //没有设置行标题
            for (var key = 0; key < GroupData.length; key++) {
                if (GroupData[key] == null || GroupData[key] == "") continue;
                this.AddGroupData(GroupData[key]);
                //找到某一分组
                var dataValue = { name: GroupData[key], value: [] };

                for (var i = 0; i < ReportData.length; i++) {
                    //找到这一分组的数据
                    if (ReportData[i][key] != null) {
                        dataValue.value.push(ReportData[i][key]);
                    }
                    else {
                        dataValue.value.push(0);
                    }
                    var drillParam = {};
                    drillParam[ReportSource.ColumnDrillParam.Name] = ColumnDrillData[key];
                    serie.DrillParams.push(drillParam);
                }
                serie.data.push(dataValue);
            }
        }
    },

    //行列置换
    ChangeLegend: function () {
        if (this.ChartType.toLowerCase() == EnumChartType.Pie.toLowerCase()) {
            this.ChangePieLegend();
        }
        else if (this.ChartType.toLowerCase() == EnumChartType.Radar.toLowerCase()) {
            this.ChangePolarLegend();
        }
        else {
            this.ChangeAxisLegend();
        }
        this.ReportChart.clear();
        this.ReportChart.setOption(this.Option);
    },

    //饼图置换
    ChangePieLegend: function () {
        var legenddata = ObjectClone(this.Option.legend.data);
        var seriesData = ObjectClone(this.Option.series);

        this.Option.legend.data = [];
        for (var i = 0; i < seriesData.length; i++) {
            var serieName = seriesData[i].name;
            if (this.Option.legend.data.indexOf(serieName) < 0) {
                this.AddGroupData(serieName);
            }
        }

        this.Option.series = [];
        for (var i = 0; i < legenddata.length; i++) {
            var serie = { name: legenddata[i], center: ['50%', '50%'], type: "pie", data: [], DrillParams: [] };
            this.Option.series.push(serie);
            for (var j = 0; j < this.Option.legend.data.length; j++) {
                for (var k = 0; k < seriesData.length; k++) {
                    var seriedata = seriesData[k];
                    if (seriedata.name != this.Option.legend.data[j]) continue;
                    for (var l = 0; l < seriedata.data.length; l++) {
                        if (seriedata.data[l].name == legenddata[i]) {
                            serie.data.push({
                                value: seriedata.data[l].value, name: seriedata.name
                            });
                            serie.DrillParams.push(seriedata.DrillParams[l]);
                        }
                    }
                }
            }
        }
        this.SetPieRadiu();
    },

    //雷达图置换
    ChangePolarLegend: function () {
        var legendData = ObjectClone(this.Option.legend.data);
        var polarData = ObjectClone(this.Option.polar[0].indicator);
        var seriesData = ObjectClone(this.Option.series[0].data);

        this.Option.polar[0].indicator = [];
        for (var i = 0; i < legendData.length; i++) {
            this.Option.polar[0].indicator.push({ text: legendData[i] });
        }

        this.Option.legend.data = [];
        for (var i = 0; i < polarData.length; i++) {
            this.Option.legend.data.push(polarData[i].text);
        }

        this.Option.series[0].data = [];
        for (var i = 0; i < polarData.length; i++) {
            var newData = { name: polarData[i].text, value: [] };
            this.Option.series[0].data.push(newData);
            for (var j = 0; j < legendData.length; j++) {
                for (var k = 0; k < seriesData.length; k++) {
                    if (seriesData[k].name == legendData[j]) {
                        newData.value.push(seriesData[k].value[i]);
                        break;
                    }
                }
            }
        }
    },

    //直角坐标:行列置换
    ChangeAxisLegend: function () {
        if (this.IsChangeRank) {
            this.ChangeRank();
        }
        var legenddata = ObjectClone(this.Option.legend.data);
        var xAxisData = ObjectClone(this.Option.xAxis[0].data);

        this.Option.xAxis[0].data = [];
        for (var i = 0; i < legenddata.length; i++) {
            if (legenddata[i] != null && legenddata[i] != "") {
                this.Option.xAxis[0].data.push(legenddata[i]);
            }
        }

        this.LegendRow = 1;
        this.Option.legend.data = [];
        for (var i = 0; i < xAxisData.length; i++) {
            this.AddGroupData(xAxisData[i]);
        }

        var oldseries = ObjectClone(this.Option.series);
        this.Option.series = [];
        for (var i = 0; i < xAxisData.length; i++) {
            var serie = { name: xAxisData[i], data: [], DrillParams: [] };
            if (this.ItemStyle != null) {
                serie.itemStyle = this.ItemStyle;
            }
            for (var j = 0; j < oldseries.length; j++) {
                serie.data.push(oldseries[j].data[i]);
                serie.DrillParams.push(oldseries[j].DrillParams[i]);
                serie.type = oldseries[j].type;
            }
            this.Option.series.push(serie);
        }

        if (this.IsChangeRank) {
            this.ChangeRank();
        }
    },

    //图形参数
    Option: {
        //标题显示
        title: { text: '报表名称', subtext: '子名称', x: "center" },
        //鼠标提示
        tooltip: {
            trigger: 'axis'//可选为：'item' | 'axis' ,item 显示 x和y轴信息；axix：显示x信息，并把y轴多个值一起显示
        },
        animation: !(Browser.msie && Browser.version == 8.0),//显示动画，ie8版本关闭动画效果
        grid: { y2: 60 },
        //分组数据
        legend: {
            data: ['模块1', '模块2', '模块3'],
            y: "center",         //'top' | 'bottom' | 'center' | {number}（y坐标，单位px） 
            orient: "vertical",
            x: "right"
        },
        //工具栏
        toolbox: {
            //orient: "vertical",
            show: true,
            feature: {
                //dataView: { show: false, readOnly: true },//数据视图
                magicType: { show: true, type: ['stack', 'tiled'] },//显示多种图形
                restore: { show: true },//还原功能
                saveAsImage: { show: true }//保存图片功能
            },
            showTitle: true //多语言问题，去掉title
        },
        //极坐标
        polar: [{ indicator: [] }],
        //x轴
        xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                }
        ],
        //y轴
        yAxis: [{ type: 'value' }],
        //内容数组
        series: [
                {
                    name: '模块1',
                    type: 'line',
                    data: [11, 6, 15, 13, 12, 13, 10]
                },
                {
                    name: '模块2',
                    type: 'line',
                    data: [11, 0, 6, 33, 2, 34, 0]
                },
                {
                    name: '模块3',
                    type: 'line',
                    data: [1, -1, 2, 4, 3, 2, 0]
                }
        ]
    }
};

//交叉分析表的表格显示
var GridManager = {
    TableCss: "CrossSettingTable",
    RowTitleSetting: "RowTitleSetting",
    ColumnTitleSetting: "ColumnTitleSetting",
    ShowGrid: function (TableShowObj, ReportSource, ReportData) {
        TableShowObj.html("").css("width", "100%").css("overflow", "auto");
        var head = $("<thead></thead>");
        var table = $("<table></table>").addClass(this.TableCss).css("width", "auto").css("margin", "5px").append(head);
        TableShowObj.append(table);

        //数据分析
        var ColumnData = ReportData.ColumnData;
        var GroupData = ReportData.GroupData;
        var SubGroupData = ReportData.SubGroupData;
        var ExistRowTitle = ReportData.ExistRowTitle;
        var ReportSourceColumns = ReportData.ReportSourceColumns;
        var ReportData = ReportData.ReportData;

        if (ExistRowTitle) {//存在行标题
            var rowTitle = ReportSource.RowTitle.split(";");
            var groupTitle = rowTitle[0];
            var subGroupTitle = rowTitle.length > 1 ? rowTitle[1] : null;
            var columnCode = "CountNum";//有行标题时，最多只能有一个统计字段
            if (ReportSource.Columns != null && ReportSource.Columns.length > 0) {
                columnCode = ReportSource.Columns[0].ColumnCode;
            }
            //报表头
            var trRow = $("<tr></tr>");
            for (var r = 0; r < rowTitle.length; r++) {
                trRow.append("<td>" + this.GetColumnName(rowTitle[r], ReportSourceColumns) + "</td>");
            }
            for (var c = 0; c < ColumnData.length; c++) {
                trRow.append("<td>" + ColumnData[c] + "</td>");
            }
            head.append(trRow);
            //报表体
            //报表为空时，提示没有数据
            if (GroupData == null || GroupData.length == 0) {
                var emptyRow = $("<tr><td colspan=" + (rowTitle.length + ColumnData.length) + ">"
                    + _ReportViewManager_GlobalString.ReportViewManager_NoData + "</td></tr>");
                table.append(emptyRow);
            }
            for (var i = 0; i < GroupData.length; i++) {
                var groupValue = GroupData[i];
                if (subGroupTitle == null) {//没有第二个行标题
                    var groupRow = $("<tr></tr>");
                    table.append(groupRow);
                    groupRow.append("<td>" + groupValue + "</td>");

                    if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                        //没有列标题
                        for (var j = 0; j < ReportSource.Columns.length; j++) {
                            var Column = ReportSource.Columns[j];
                            var reportValue = 0;
                            for (var i = 0; i < ReportData.length; i++) {
                                if (ReportData[i][groupTitle] == groupValue) {
                                    if (ReportData[i][Column.ColumnCode] != null)
                                        reportValue = ReportData[i][Column.ColumnCode];
                                    break;
                                }
                            }
                            groupRow.append("<td>" + reportValue + "</td>");
                        }
                    }
                    else {
                        for (var j = 0; j < ColumnData.length; j++) {
                            var columnValue = ColumnData[j];
                            var reportValue = "-";
                            for (var k = 0; k < ReportData.length; k++) {
                                if (ReportData[k][groupTitle] == groupValue
                                    && columnValue == ReportData[k][ReportSource.ColumnTitle]) {
                                    if (ReportData[k][columnCode]) {
                                        reportValue = ReportData[k][columnCode];
                                    }
                                    break;
                                }
                            }
                            groupRow.append("<td>" + reportValue + "</td>");
                        }
                    }
                }
                else {//有第二个行标题
                    for (var l = 0; l < SubGroupData.length; l++) {
                        var groupRow = $("<tr></tr>");
                        table.append(groupRow);
                        var subGroupValue = SubGroupData[l];
                        if (l == 0) {//添加第一分组
                            groupRow.append($("<td>" + groupValue + "</td>").attr("rowspan", SubGroupData.length));
                        }
                        groupRow.append($("<td>" + subGroupValue + "</td>"));

                        if (ReportSource.ColumnTitle == null || ReportSource.ColumnTitle == "") {
                            //没有列标题
                            for (var j = 0; j < ReportSource.Columns.length; j++) {
                                var Column = ReportSource.Columns[j];
                                var reportValue = 0;
                                for (var k = 0; k < ReportData.length; k++) {
                                    if (ReportData[k][groupTitle] == groupValue
                                        && ReportData[k][subGroupTitle] == subGroupValue) {
                                        if (ReportData[k][Column.ColumnCode] != null)
                                            reportValue = ReportData[k][Column.ColumnCode];
                                        break;
                                    }
                                }
                                groupRow.append("<td>" + reportValue + "</td>");
                            }
                        }
                        else {
                            for (var j = 0; j < ColumnData.length; j++) {
                                var columnValue = ColumnData[j];
                                var reportValue = "-";
                                for (var k in ReportData) {
                                    if (ReportData[k][groupTitle] == groupValue
                                        && ReportData[k][subGroupTitle] == subGroupValue
                                        && columnValue == ReportData[k][ReportSource.ColumnTitle]) {
                                        if (ReportData[k][columnCode]) {
                                            reportValue = ReportData[k][columnCode];
                                        }
                                        break;
                                    }
                                }
                                groupRow.append("<td>" + reportValue + "</td>");
                            }
                        }
                    }
                }
            }
        }
        else {//没有行标题
            //报表头
            var trRow = $("<tr></tr>");
            trRow.append("<td></td>");
            for (var c = 0; c < ColumnData.length; c++) {
                trRow.append("<td>" + ColumnData[c] + "</td>");
            }
            head.append(trRow);
            //报标题
            //报表为空时，提示没有数据
            if (GroupData == null || GroupData.length == 0) {
                var emptyRow = $("<tr><td colspan=" + (1 + ColumnData.length) + ">" +
                    _ReportViewManager_GlobalString.ReportViewManager_NoData + "</td></tr>");
                table.append(emptyRow);
            }
            for (var key in GroupData) {
                var groupRow = $("<tr></tr>");
                table.append(groupRow);
                groupRow.append("<td>" + GroupData[key] + "</td>");
                //找到某一分组
                for (var i = 0; i < ReportData.length; i++) {
                    //找到这一分组的数据
                    if (ReportData[i][key] != null) {
                        groupRow.append("<td>" + ReportData[i][key] + "</td>");
                    }
                    else {
                        groupRow.append("<td>-</td>");
                    }
                }
            }
        }

        //设置单位
        //ReportSource.AxisUnit:列
        //ReportSource.XAxisUnit:列
        if (ReportSource.AxisUnit || ReportSource.XAxisUnit) {
            var rowUnit = ReportSource.AxisUnit;//行标题
            var columnUnit = ReportSource.XAxisUnit;//列标题
            if (ReportSource.AxisDimension == AxisDimension.RowTilte) {
                //x轴设置为行标题的话，x轴单位要给行标题
                rowUnit = ReportSource.XAxisUnit;
                columnUnit = ReportSource.AxisUnit;
            }
            head.find("td").each(function (i) {
                if (i == 0) {
                    if (rowUnit) {
                        $(this).append("(" + rowUnit + ")");
                    }
                }
                else if (columnUnit) {
                    $(this).append("(" + columnUnit + ")");
                }
            });
        }

        //最后重算宽度
        if (table.width() < TableShowObj.width()) {
            table.width("98%");
        }
    },
    GetColumnName: function (ColumnCode, ReportSourceColumns) {
        for (var i = 0; i < ReportSourceColumns.length; i++) {
            if (ReportSourceColumns[i].ColumnCode == ColumnCode)
                return ReportSourceColumns[i].DisplayName;
        }
        return "";
    }
    //Option: {
    //    RowTitle: [""]
    //}
};