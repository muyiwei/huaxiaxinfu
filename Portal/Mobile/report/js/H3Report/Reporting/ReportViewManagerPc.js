$.fn.LoadReportFiters = function (options) {
    
    //console.log(options)
    var reportViewManager = new ReportViewManager(options.ReportFiters, options.ReportPage, options.SourceCode, null, options.Ionic, options.PortalRoot);
}

$.fn.LoadReportPage = function (options) {
   // console.log(options)
   // var reportViewManager = new ReportViewManager($("#ReportFiters"), $("#ReportPage"), "report123");
}

//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//公共函数
var CommonFunction = {
    ActionExlceUrl:"/Reporting/PreExportTable",
    ActionUrl: "/Reporting",
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
            url: this.ActionUrl + "/" + action,
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

//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//报表展示
window.ReportViewManager = function ($filterContainer, $widgetContainer, reportCode, applist, ionic, PortalRoot) {
    CommonFunction.ActionExlceUrl = PortalRoot + "/Reporting/PreExportTable";
    CommonFunction.ActionUrl = PortalRoot + "/Reporting";
    var that = this;
    this.Options = $.extend({}, _DefaultOptions);
    //报表配置
    this.ReportPage = null;
    //与后台交互的事件
    this.LoadReportPage = "LoadReportPage";
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
    this.Init(ionic);
};
ReportViewManager.prototype = {
    Init: function (ionic) {
        var that = this;
        CommonFunction.Post(CommonFunction.LoadReportPage,
            { Code: this.Code },
            function (data) {
                if (!data.State) {
                    that.$WidgetContainer.html("报表不存在!");
                    return;
                }
                that.ReportPage = data.ReportPage;
                that.CurrentUser = data.CurrentUser;
                that.boolDic = data.boolDic;
                //校验
                if (that.ValidateReportPage.apply()) {
                    //过滤器构造，把过滤器改变时，触发的事件传过去，也是OnChange的回调函数
                    that.FilterManager = new FilterManager(ionic, that.$FilterContainer, data.ReportPage.Filters, that.CurrentUser, that.boolDic, function () {
                        that.ReLoadAllReport.apply(that);
                    });
                    //创建布局，并异步加载每个报表
                    that.CreateLayout.apply(that);
                }
            }, this.$filterContainer ? true : false);
    },
    // 校验
    ValidateReportPage: function () {
        return true;
    },
    // 创建布局和容器；error:这里需要根据reportwidget的配置确定一行1列还是一行两列；
    CreateLayout: function () {
        //没有报表容器，则返回
        //if (this.$WidgetContainer == null || this.$WidgetContainer.length == 0) return;
        var that = this;
        var $row;
        var WidgetCounter = 0;
        var AnotherCounter = 0;
        var newcow = true;
        for (var i = 0; i < that.ReportPage.ReportWidgets.length; ++i) {
            var layout = that.ReportPage.ReportWidgets[i].Layout;
            //#region 布局
            var $col = $("<div>");
            // 分行
            switch (layout) {
                case that.Options.ReportLayout.OneColumn:
                    //一行一个
                    $row = $("<div>").addClass("row");
                    that.$WidgetContainer.append($row);
                    $col.addClass("col-md-12");
                    break;
                case that.Options.ReportLayout.TwoColumns:
                    if (newcow) {
                        //添加行
                        $row = $("<div>").addClass("row");
                        that.$WidgetContainer.append($row);
                    }
                    $col.addClass("col-md-6");
                    break;
            }
            $row.append($col);
            //#endregion 布局

            // 读取报表配置
            var widget = that.ReportPage.ReportWidgets[i];
            //创建报表容器
            if (layout == _DefaultOptions.ReportLayout.OneColumn) {
                if (WidgetCounter.toString().indexOf('.') > -1) {
                    WidgetCounter = WidgetCounter.toString().split('.')[0] - 0 + 1 + 1;
                }
                else {
                    WidgetCounter++;
                }
                newcow = true;
            }
            else if (layout == _DefaultOptions.ReportLayout.TwoColumns) {

                WidgetCounter = WidgetCounter - 0 + 0.5;
                if (WidgetCounter.toString().indexOf('.') > -1 && (i + 1) < that.ReportPage.ReportWidgets.length && that.ReportPage.ReportWidgets[i + 1].Layout == _DefaultOptions.ReportLayout.OneColumn)
                    newcow = true;
                else
                    newcow = false;
            }
            else {
                WidgetCounter++;
            }
            that.CreateWidget(widget, $col, WidgetCounter, AnotherCounter);
            //显示报表
            that.CreateReport(widget);
            AnotherCounter++;
        }
    },
    // 创建一个
    CreateWidget: function (widget, $col, WidgetCounter, AnotherCounter) {
        var that = this;
        var Panelheight = 455;
        //全屏切换
        var location = "myleft";
        var thisWidgetCount = AnotherCounter;
        if (AnotherCounter == (this.ReportPage.ReportWidgets.length - 1) && AnotherCounter > 0)
            location = "myright";
        if (this.ReportPage.ReportWidgets.length > 2 && AnotherCounter != 0 && AnotherCounter != (this.ReportPage.ReportWidgets.length - 1))
            location = "mycenter";
        if (this.ReportPage.ReportWidgets.length == 1)
            location = "";
        //end全屏切换
        var $pannel = $("<div style='height:450px;    background-color: transparent; '>").addClass("panel panel-primary widget-messaging mypanel");//.css("width","300px");

        var $heading = $("<div>").addClass("panel-heading " + location + "");
        var $title = $("<div style='padding: 10px 0px 10px 0px;font-size: 16px;font-weight: 700;color:#565656;'>").addClass("panel-title");
        var $titletext = $("<div style='overflow: hidden;text-overflow: ellipsis;white-space: nowrap;'>").text(widget.DisplayName);

        $pannel.css("width", "99.5%")
        $pannel.css("position", "absolute");
        WidgetCounter = WidgetCounter.toString()
        if (WidgetCounter.toString().indexOf('.') > -1) {
            var top = (WidgetCounter.split('.')[0] - 0) * Panelheight + "px";
            $pannel.css("top", top);
        }
        else {
            var top = (WidgetCounter - 1) * Panelheight + "px";
            $pannel.css("top", top);
        }
        //----------------------------------导出,全屏 保存为图片-----------------------------------
        var $body = $("<div>").addClass("panel-body").attr("id", widget.ObjectID).css("min-height", "400px").css("max-height", "400px").css("position", "absolute").css("background-color", "#fff").height("100%");
        var $Leftbutton = $("<a class='icon iconReport-privious myreportleftbutton'  style='color:#565656;font-size:28px;'>");
        $Leftbutton.unbind("click").bind("click", function () {
            if (location != "myleft") {
                $(this).parent().find(".reportfullscreena").click();
                $("#" + that.ReportPage.ReportWidgets[thisWidgetCount - 1].ObjectID).parent().find(".reportfullscreena").click();
            }
        });
        var $Rightbutton = $("<a class='icon iconReport-next myreportrightbutton'  style='color:#565656;font-size:28px;'>");
        $Rightbutton.unbind("click").bind("click", function () {
            if (location != "myright" && that.ReportPage.ReportWidgets.length != 1) {
                $(this).parent().find(".reportfullscreena").click();
                $("#" + that.ReportPage.ReportWidgets[thisWidgetCount + 1].ObjectID).parent().find(".reportfullscreena").click();
            }
        });
        var $AExport = $("<a class='reportexporta'>");
        $AExport.unbind("click").bind("click", function () {
            var filterData = null;
            if (that.FilterManager) {
                filterData = that.FilterManager.GetValue();
            }
            $.ajax({
                url: CommonFunction.ActionExlceUrl,
                type: 'POST',
                dataType: 'json',
                data: { WidgetID: widget.ObjectID, Code: that.ReportPage.Code, FilterDataJson: JSON.stringify(filterData), dir: that.ReportManagers[widget.ObjectID].dir, orderby: that.ReportManagers[widget.ObjectID].orderby },
                success: function (data) {
                    if (data.Result == "true" || data.Result == "True" || data.Result === true) {
                        window.location.href = data.url;
                    }
                    else {
                        $.IShowWarn("提示", data.Msg);
                    }

                },
                error: function (err) { }
            });
        })
        var $IExport = $("<i class='icon iconReport-export-excel'  style='color:#565656;font-size:30px;'>");
        var $ExportText = $("<div style='position:absolute;z-index:999999999;background-color:#fff;border:solid 1px #e2e2e2;margin-left:-20px;margin-top:10px;'>").html("<p class='reportheadermenu' style='font-weight:normal;'>导出EXCEL</p>");
        $AExport.append($IExport).append($ExportText);
        var $AFullScreen = $("<a  class='reportfullscreena'>");
        var $IFullScreen = $("<i class='icon iconReport-expand' style='color:#565656;font-size:25px;'>");
        var $FullScreenText = $("<div style='position:absolute;z-index:999999999;background-color:#fff;border:solid 1px #e2e2e2;margin-left:-20px;margin-top:10px;'>").html("<p class='reportheadermenu' style='font-weight:normal;'>全屏</p>");
        $AFullScreen.unbind("click").bind("click", function () {
         
            var fullwidth = window.screen.availWidth;
            var fullheight = window.screen.availHeight;
            if ($pannel.hasClass("Full")) {
                $pannel.css("height", "450px");
                $pannel.css("width", "99%");
                $IFullScreen.removeClass("icon iconReport-collapse").addClass("icon iconReport-expand");
                $FullScreenText.html("<p class='reportheadermenu'>全屏</p>");
                $body.css("max-height", 400 + "px");
                $pannel.removeClass("Full");
                if (widget.WidgetType == _DefaultOptions.WidgetType.Detail)
                    $pannel.find(".panel-footer-reportview").css("height", "40px");
            } else {
                $pannel.addClass("Full")
                $pannel.css("width", fullwidth + "px");
                $pannel.css("height", fullheight + "px");
                $IFullScreen.removeClass("icon iconReport-expand").addClass("icon iconReport-collapse");
                $FullScreenText.html("<p class='reportheadermenu'>缩小</p>");
                $body.css("max-height", window.screen.availHeight - 130 + "px");
                if (widget.WidgetType == _DefaultOptions.WidgetType.Detail)
                    $pannel.find(".panel-footer-reportview").css("height", "100px");
            }
            var width = $pannel.find(".orgtable").width();
            $pannel.find(".table-column-freezen").css("width", width);
            var headerwidth = $pannel.find(".orgtable").find("thead").find("th").eq(0).css("width");
            $pannel.find(".table-row-freezen").css("width", headerwidth);
            $pannel.find(".table-onlyheader-freezen").css("width", headerwidth);

            if (widget.WidgetType == _DefaultOptions.WidgetType.Combined) {
                var $tableorg = $("#" + widget.ObjectID + " .orgtable")
                var $tablecolumn = $("#" + widget.ObjectID + " .table-column-freezen");
                var $tablerow = $("#" + widget.ObjectID + " .table-row-freezen");
                var $tableonlyheader = $("#" + widget.ObjectID + " .table-onlyheader-freezen");
                var reportmanger = that.ReportManagers[widget.ObjectID];
                reportmanger.ComputeOrgWidth($tableorg);
                reportmanger.ComputerWidth($tablecolumn);
                reportmanger.ComputerWidth($tablerow);
                reportmanger.ComputerWidth($tableonlyheader);
            }
            that.ReportManagers[widget.ObjectID].FullScreenTrigger();
        });
        $AFullScreen.append($IFullScreen).append($FullScreenText);
        var $SaveAsImg = $("<a class='icon iconReport-privious myreportleftbutton'  style='color:#565656;font-size:18px;display:block;'>");
        $SaveAsImg.unbind("click").bind("click", function () {
            html2canvas($pannel, {
                onrendered: function (canvas) {
                    var url = canvas.toDataURL();
                    var $imgA = $("<a>").attr("href", url).attr("download", "abc.jpg").appendTo("body");
                    $imgA[0].click();
                    $imgA.remove();
                }
            });
        })
        if ((widget.WidgetType == _DefaultOptions.WidgetType.Detail || widget.WidgetType == _DefaultOptions.WidgetType.Combined) && widget.Exportable) {
            $title.append($AFullScreen).append($AExport).append($Rightbutton).append($Leftbutton);
        }
        else {
            $title.append($AFullScreen).append($Rightbutton).append($Leftbutton);
        }
        //  $title.append($SaveAsImg);
        //----------------------------------end导出,全屏 保存为图片-----------------------------------
        $body.css("overflow", "auto")
        $col.append($pannel);
        $pannel.append($heading);
        $heading.append($title.append($titletext));
        $pannel.append($body);
    },
    //创建报表
    CreateReport: function (widget) {
        var reportId = widget.ObjectID;
        var reportManager = null;
        var filterData = null;
        if (this.FilterManager) {
            debugger
            filterData = this.FilterManager.GetValue();
        }
        var index = 0;
        for (var i = 0; i < this.ReportPage.ReportWidgets.length; i++) {
            if (this.ReportPage.ReportWidgets[i].ObjectID == widget.ObjectID) {
                index = i;
                break;
            }
        }
        var color = CommonFunction.Colors[index];
        if (this.ReportManagers[widget.ObjectID] == null) {
            switch (widget.WidgetType) {
                case this.Options.WidgetType.Detail:
                    //明细表
                    
                    this.ReportManagers[widget.ObjectID] = new GridViewManager(this.ReportPage, widget, filterData, this);
                    break;
                case this.Options.WidgetType.Combined:
                    //汇总表
                    this.ReportManagers[widget.ObjectID] = new ChartTableManager(this.ReportPage, widget, filterData, this);
                    break;
                case this.Options.WidgetType.SimpleBoard:
                    //简易看板
                    this.ReportManagers[widget.ObjectID] = new SimpleBoardManager(this.ReportPage, widget, filterData, this, color);
                    break;
                default:
                    //图表
                    this.ReportManagers[widget.ObjectID] = new ChartManager(this.ReportPage, widget, filterData, this);
                    break;
            }
        }
    },
    // 获取单个报表数据 PC端未用到，但保留
    GetReport: function (filterValues, widget, reportPage, UnitFilterDataJson) {
        if (reportPage) {
            this.ReportPage = reportPage;
        }
        if (this.FilterManager) {
            this.FilterManager.SetValue(filterValues);
        }
        if (!widget)
            return;

        if (this.ReportManagers[widget.ObjectID] != null) {
            this.ReportManagers[widget.ObjectID].ReLoad(filterValues, UnitFilterDataJson);
        }
        else {
            this.CreateReport(widget);
        }
    },
    // 刷新接口
    ReLoadAllReport: function () {
        var filterData = this.FilterManager.GetValue();
        // 检验过滤条件的必填选
        if (!this.CheckRequired(filterData)) {
            return;
        }
        for (var code in this.ReportManagers) {
            this.ReportManagers[code].ReLoad(filterData);
        }
    },
    // 检验过滤条件的必填选
    CheckRequired: function (filterData) {
       
        for (var k = 0; k < this.ReportPage.Filters.length; k++) {
            var filter = this.ReportPage.Filters[k];
            if (filter.AllowNull != undefined && !filter.AllowNull) {
                var data = filterData[filter.ColumnCode.toLowerCase()];
                if (!$.isArray(data) || data.length == 0) {
                    $.IShowWarn("提示", "过滤条件[" + filter.DisplayName + "*]必填");
                    return false;
                }
                if (data.length == 1 && (data[0] == null || data[0] == "")) {
                    $.IShowWarn("提示", "过滤条件[" + filter.DisplayName + "*]必填");
                    return false;
                }

                if (data.length == 2 && (data[0] == null || data[0] == "") && (data[1] == null || data[1] == "")) {
                    $.IShowWarn("提示", "过滤条件[" + filter.DisplayName + "*]必填");
                    return false;
                }
            }
        }
        return true;
    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//过滤器管理器
var FilterManager = function (ionic,filterContainer, filters, currentUser, boolDic, bindFun) {
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
    this.Ionic = ionic;
    this.Init();
};
FilterManager.prototype = {
    Init: function () {
        // TODO:构造Dom对象，并注册Dom对象的事件
        var $row = null;
        var filterCount = 0;
        if (this.filterContainer) {
            
            for (var k = 0; k < this.Filters.length; k++) {
                if (!this.Filters[k].Visible) {
                    var $filterControl = $(this.GetControl(this.Filters[k]));
                    if ($.isArray(this.Filters[k].FilterValue)) {

                        this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = this.Filters[k].FilterValue;
                    }
                    else {
                        if (this.Filters[k].FilterType == _DefaultOptions.FilterType.Organization) {
                            if (this.Filters[k].FilterValue == 2) {
                                this.Ionic.$scope.UserOptions.V = this.Ionic.$scope.user.ParentID;
                            } else if (this.Filters[k].FilterValue == 1) {
                                this.Ionic.$scope.UserOptions.V = this.Ionic.$scope.user.ObjectID;
                            } else {
                                this.Ionic.$scope.UserOptions.V = "";
                            }
                            var OrgID = this.Ionic.$scope.UserOptions.V + ";"
                            this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = [OrgID];
                        } else {
                            this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = [this.Filters[k].FilterValue];
                        } 
                    }
                    continue;
                }

                if (filterCount % 3 == 0) {
                    $row = $("<div class=\"row\" style='margin-bottom:5px;'></div>");
                    this.filterContainer.append($row);
                }
                var Keys = "";
                if (this.Filters[k].AllowNull != undefined && !this.Filters[k].AllowNull) {
                    Keys= "*";
                }
                if (Keys != "") {
                    var $colTitle = $("<div  class='col-md-1 reportfiltertext'>").html("<span style='line-height:30px;' title='" + this.Filters[k].DisplayName + "'>" + this.Filters[k].DisplayName + "<span style='color:red'>" + Keys + "</span></span>");
                    $row.append($colTitle);
                }
                else
                {
                    var $colTitle = $("<div  class='col-md-1 reportfiltertext'>").html("<span style='line-height:30px;' title='" + this.Filters[k].DisplayName + "'>" + this.Filters[k].DisplayName + "</span>");
                    $row.append($colTitle);
                }
              

                var $colControl = $("<div class='reportfilteritem col-md-3'>");
                var $filterControl = $(this.GetControl(this.Filters[k]));

                $colControl.append($filterControl);
                $row.append($colControl);
               

                var childScope = this.Ionic.$scope.$new(true);
                childScope.UserOptions = angular.copy(this.Ionic.$scope.UserOptions);
                //如果是选人控件，则设置初始值
                if (this.Filters[k].FilterType == _DefaultOptions.FilterType.Organization) {
                    debugger
                    if (this.Filters[k].FilterValue == 2) {
                        childScope.UserOptions.V = this.Ionic.$scope.user.ParentID;
                    } else if (this.Filters[k].FilterValue == 1) {
                        childScope.UserOptions.V = this.Ionic.$scope.user.ObjectID;
                    } else {
                        childScope.UserOptions.V = "";
                    }
                    var OrgID = childScope.UserOptions.V + ";"
                    this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = [OrgID];
                }
              
                this.Ionic.$compile($colControl.contents())(childScope);//手动编译angular指令 
                if ((this.Filters[k].FilterType == _DefaultOptions.FilterType.FixedValue || this.Filters[k].FilterType == _DefaultOptions.FilterType.MasterData) && !(this.boolDic && this.boolDic[this.Filters[k].ColumnCode])) {
                    var options = this.Filters[k].FilterValue == null || this.Filters[k].FilterValue == "" ? "" : this.Filters[k].FilterValue.split(";");
                    $filterControl.multiselect({
                        buttonText: function (options, select) {
                            if (options.length === 0) {
                                return "";
                            }
                            else {
                                var labels = [];
                                options.each(function () {
                                    if ($(this).attr("label") !== undefined) {
                                        labels.push($(this).attr("label"));
                                    }
                                    else {
                                        labels.push($(this).html());
                                    }
                                });
                                return labels.join(",") + "";
                            }
                        },
                        onChange: function () {
                            //$.ListView.RefreshView();
                        },
                        selectedClass: "multiselect-selected"
                    });
                    // $filterControl.multiselect("select", options);
                }
                filterCount++;
                this.RegisterChangeEvent(this.Filters[k], $filterControl);
                
                if ($.isArray(this.Filters[k].FilterValue)) {
                   
                    if (this.Filters[k].FilterType != _DefaultOptions.FilterType.FixedValue && this.Filters[k].FilterType != _DefaultOptions.FilterType.MasterData&&this.Filters[k].FilterType != _DefaultOptions.FilterType.Boolean)
                        this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = this.Filters[k].FilterValue;
                    if (this.Filters[k].FilterType == _DefaultOptions.FilterType.FixedValue && this.boolDic && this.boolDic[filter.ColumnCode]) {
                        if (this.Filters[k].FilterValue.indexOf("是") > -1 && this.Filters[k].FilterValue.indexOf("否") > -1) {
                            //this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = "1;0";
                        }
                        else if (this.Filters[k].FilterValue.indexOf("是") > -1 && !this.Filters[k].FilterValue.indexOf("否") > -1) {
                            //this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = "1";
                        }
                        else if (!this.Filters[k].FilterValue.indexOf("是") > -1 && this.Filters[k].FilterValue.indexOf("是") > -1) {
                            // this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = "0";
                        }
                    }
                }
                else {
                    if (this.Filters[k].FilterType != _DefaultOptions.FilterType.FixedValue && this.Filters[k].FilterType != _DefaultOptions.FilterType.MasterData && this.Filters[k].FilterType != _DefaultOptions.FilterType.Boolean && this.Filters[k].FilterType != _DefaultOptions.FilterType.Organization)
                        this.filterValues[this.Filters[k].ColumnCode.toLowerCase()] = [this.Filters[k].FilterValue];
                }
            }

            //时间控件
            if (this.filterContainer.find("input[data-controlkey='DateTime']").length > 0) {
                this.filterContainer.find("input[data-controlkey='DateTime']").datetimepicker({
                    language: 'zh-CN',
                    todayBtn: true,
                    autoclose: true,
                    format: "yyyy-mm-dd",
                    //startView: 2, // 选择器打开后首先显示的视图
                    minView: 2 // 选择器能够提供的最精确的视图
                });
            }

            //收缩显示
            if (filterCount > 3) {
                this.filterContainer.find("div.row:gt(0)").hide();

                var $btnPanel = $('<div class="text-center">');
                var $group = $('<div class="btn-group" role="group">');
                var $btn = $(' <a href="javascript:void(0);" style="color:#4a535e"><i class="fa mr5 fa-angle-double-down"></i><span>更多筛选条件</span></a>');
                $btnPanel.append($group.append($btn));
                var that = this;
                $btn.click(function () {
                    if ($(this).find("i").hasClass("fa-angle-double-down")) {
                        that.filterContainer.find("div.row:gt(0)").show("fast");
                        $(this).find("i").removeClass("fa-angle-double-down").addClass("fa-angle-double-up");
                        $(this).find("span").text("收起")
                    }
                    else {
                        that.filterContainer.find("div.row:gt(0)").hide("fast");
                        $(this).find("i").removeClass("fa-angle-double-up").addClass("fa-angle-double-down");
                        $(this).find("span").text("更多筛选条件")
                    }
                });
                this.filterContainer.append($btnPanel);
            }
        }
    },
    // 设置选人控件的值
    SetSheetUserValue: function (UnitID, PlaceHolderName, $Control) {
        var ObjManager = {
            Editable: true, Visiable: true, OrgUnitVisible: true, V: UnitID, PlaceHolder: PlaceHolderName
        };
        $Control.SetValue(ObjManager);
    },
    //值改变事件
    OnChange: function () {
        //触发外部的改变事件
        if ($.isFunction(this.BindFun)) {
            this.BindFun.apply();
        }
    },
    //绑定事件
    RegisterChangeEvent: function (filter, $filterControl) {
        // 绑定 Change 事件
        var that = this;
        
        if ($filterControl) {
            switch (filter.FilterType) {
                case _DefaultOptions.FilterType.Numeric:
                case _DefaultOptions.FilterType.DateTime:
                    {
                        $filterControl.find("input").bind("change", [this, filter.ColumnCode], function (e) {
                            var inputs = e.data[0].filterContainer.find("[id='" + e.data[1] + "'] >input");

                            e.data[0].filterValues[e.data[1].toLowerCase()] = [
                                inputs[0].value ? inputs[0].value.trim() : null,
                                inputs[1].value ? inputs[1].value.trim() : null
                            ];
                            if (that.ValidateFilter())
                                e.data[0].OnChange.apply(e.data[0]);
                        });
                    } break;
                case _DefaultOptions.FilterType.Organization:
                    {
                        $("[id='" + filter.ColumnCode + "']").bind("change", function (e) {
                            var datas = [];
                            var da = $.MvcSheetUI.GetControlValue(this.id);
                            if (da.length > 1) {
                                for (var ia = 0; ia < da.length; ia++) {
                                    datas.push(da[ia]);
                                }
                                that.filterValues[this.id.toLowerCase()] = datas;
                            } else {
                                if (da == "") {
                                    var ds = [];
                                    that.filterValues[this.id.toLowerCase()] = ds;
                                } else {
                                    that.filterValues[this.id.toLowerCase()] = da;
                                }
                             
                            }

                          
                            
                            if (that.ValidateFilter())
                                that.OnChange.apply(that);
                        });
                    }; break;

                case _DefaultOptions.FilterType.WorkflowTemple:
                    //流程模板控件
                    {
                      

                        $("[id='" + filter.ColumnCode + "']").unbind("click.workflow").bind("click.workflow", function (e) {
                            
                            var datas = [];
                            var da = $.MvcSheetUI.GetControlValue(this.id);
                            if (da == "") {
                                var ds = [];
                                that.filterValues[this.id.toLowerCase()] = ds;
                            }
                            else
                            {
                                if (da.length > 1) {
                                    for (var ia = 0; ia < da.length; ia++) {
                                        datas.push(da[ia]);
                                    }
                                    that.filterValues[this.id.toLowerCase()] = datas;
                                } else {
                                    if (da == "") {
                                        var ds = [];
                                        that.filterValues[this.id.toLowerCase()] = ds;
                                    } else {
                                        that.filterValues[this.id.toLowerCase()] = da;
                                    }

                                }
                            }
                            if (that.ValidateFilter()) {
                                that.OnChange.apply(that);
                            }
                        });
                    };
                    break;
                case _DefaultOptions.FilterType.FixedValue:
                case _DefaultOptions.FilterType.MasterData:
                case _DefaultOptions.FilterType.Boolean:
                    {

                        if ($filterControl.hasClass("mydropdown")) {
                            $filterControl.bind("change", [this, filter.ColumnCode], function (e) {
                                var v = [];
                                v = $(this).val();
                                e.data[0].filterValues[e.data[1].toLowerCase()] = v;
                                if (that.ValidateFilter())
                                    e.data[0].OnChange.apply(e.data[0]);
                            });
                        }
                        else {
                            $filterControl.find("input").bind("change", [this, filter.ColumnCode], function (e) {
                                var inputs = e.data[0].filterContainer.find("[id='" + e.data[1] + "']").find("input:checked");
                                e.data[0].filterValues[e.data[1].toLowerCase()] = []
                                for (var i = 0; i < inputs.length; i++) {
                                    e.data[0].filterValues[e.data[1].toLowerCase()].push($(inputs[i]).val().trim());
                                }
                                if (that.ValidateFilter())
                                    e.data[0].OnChange.apply(e.data[0]);
                            });
                        }
                    } break;

                case _DefaultOptions.FilterType.Association:
                    {
                        $("[id='" + filter.ColumnCode + "']").FormQuery().OnChange = function (e) {
                            that.filterValues[this.Element.id.toLowerCase()] = [this.GetValue()];
                            if (that.ValidateFilter())
                                that.OnChange.apply(that);
                        }
                    } break;
                default:
                    {
                        $filterControl.bind("change", [this, filter.ColumnCode], function (e) {
                            e.data[0].filterValues[e.data[1].toLowerCase()] = [this.value.trim()];
                            if (that.ValidateFilter())
                                e.data[0].OnChange.apply(e.data[0]);
                        });
                    } break;
            }
        }
    },
    // 获取控件
    GetControl: function (filter) {
       
        var that = this;
        if (filter.FilterType == _DefaultOptions.FilterType.String) {// 文本类型
            var $input = $("<input type=\"text\" class=\"form-control myform-control\" maxlength=\"64\">");
            if (filter.FilterValue) {
                $input.val(filter.FilterValue);
            }
            return $input;
        } else if (filter.FilterType == _DefaultOptions.FilterType.WorkflowTemple) {//流程模板
            var $input = $("<div ui-jq='SheetWorkflow' ui-options='WorkflowOptions' id='" + filter.ColumnCode + "' data-datafield='" + filter.ColumnCode + "'></div>");
            return $input;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.Organization) {// 组织类型

            var $input = $("<div  id='" + filter.ColumnCode + "' ui-jq='SheetUser'ui-options='UserOptions' data-datafield='" + filter.ColumnCode + "'></div>");

            switch (parseInt(filter.OrganizationType)) {
                case _DefaultOptions.OrganizationType.User:
                    $input.attr("data-OrgUnitVisible", false);
                    break;
                case _DefaultOptions.OrganizationType.Dept:
                    $input.attr("data-UserVisible", false);
                    break;
            }
            //选人控件
            //var SheetUser = $input.FormUser();
            //$input.removeClass("form-group");
            ////loadreportsetting 时加进去
            //switch (filter.FilterValue) {//function(UnitID,Code,Type,$Control){
            //    case "1": {
            //        this.SetSheetUserValue(this.CurrentUser.UserId, this.CurrentUser.UserCode, this.CurrentUser.UserType, this.CurrentUser.UserDisplayName, SheetUser);
            //        filter.FilterValue = this.CurrentUser.UserId;
            //        break;
            //    }
            //    case "2": {
            //        this.SetSheetUserValue(this.CurrentUser.UserParentOUId, this.CurrentUser.UserParentOUCode, this.CurrentUser.OrganizationUnitType, this.CurrentUser.UserParentOUDisplayName, SheetUser);
            //        filter.FilterValue = this.CurrentUser.UserParentOUId;
            //        break;
            //    }
            //    case "3": {
            //        filter.FilterValue = null;
            //        break;
            //    }
            //}
            return $input;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.Numeric) {// 数值类型
            var DefaultValue = filter.FilterValue == null ? "" : filter.FilterValue.split(";");
            $input = $("<div>").addClass("input-group").attr("id", filter.ColumnCode);
            $input.append($("<div class='input-group-addon' style=''>从</div>"));
            var beginval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 0 ? DefaultValue[0] : "";
            var $begin = $("<input class='form-control myform-control'>").attr("data-controlkey", "Numeric").val(beginval);
            //限制输入内容只能为数字
            $begin.keyup(function () {
                if (this.value.length==1) {
                    this.value = this.value.replace(/[^0-9]/g,'');
                } else {
                    this.value = this.value.replace(/\D/g, '');
                }
            });

            $input.append($begin);
            $input.append($("<div class='input-group-addon' style=''>至</div>"));
            var endval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 1 ? DefaultValue[1] : "";
            var $end = $("<input class='form-control myform-control'>").attr("data-controlkey", "Numeric").val(endval);
            //限制输入内容只能为数字
            $end.keyup(function () {
                if (this.value.length == 1) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                } else {
                    this.value = this.value.replace(/\D/g, '');
                }
            });
            $input.append($end);

            return $input;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.DateTime) {// 日期类型
            var beginvalue, endvalue;
            var myDate = new Date();
            switch (filter.FilterValue)//1=当天；2=本周；3=本月;4=本季度；5=本年度;
            {
                case "1":
                    beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                    endvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                    break;
                case "2":
                    beginvalue = that.getFirstAndLastdayweek()[0];
                    endvalue = that.getFirstAndLastdayweek()[1];
                    break;
                case "3":
                    beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + "01";
                    endvalue = that.getFirstAndLastMonthDay(myDate.getFullYear(), (myDate.getMonth() - 0 + 1));
                    break;
                case "4":
                    beginvalue = that.GetFirstAndLastDayQuarter()[0];
                    endvalue = that.GetFirstAndLastDayQuarter()[1];
                    break;

                case "5":
                    beginvalue = myDate.getFullYear() + "-" + "01" + "-" + "01";
                    endvalue = myDate.getFullYear() + "-" + "12" + "-" + "31";
                    break;
            }
            $input = $("<div>").addClass("input-group").attr("id", filter.ColumnCode);
            $input.append($("<div class='input-group-addon' style=''>从</div>"));
            $input.append($("<input class='form-control myform-control mydatetimepicker mytimestart'>").attr("data-controlkey", "DateTime").val(beginvalue));
            $input.append($("<div class='input-group-addon' style=''>至</div>"));
            $input.append($("<input class='form-control  myform-control mydatetimepicker mytimestart'>").attr("data-controlkey", "DateTime").val(endvalue));

            var $btnGroup = $('<div class="input-group-btn" style="display:none;">');
            var $btn = $('<button data-toggle="dropdown" class="btn btn-default dropdown-toggle"style="width: 15px;padding-left: 0px;padding-right:0px;" type="button"><span class="caret"></span></button>');
            var $ul = $('<ul class="dropdown-menu pull-right">');
            $ul.append('<li data-type="1"><a href="#">当天</a></li>');
            $ul.append('<li data-type="2"><a href="#">本周</a></li>');
            $ul.append('<li data-type="3"><a href="#">本月</a></li>');
            $ul.append('<li data-type="4"><a href="#">本季度</a></li>');
            $ul.append('<li data-type="5"><a href="#">本年度</a></li>');
            $ul.find("li").click(function () {
               
                var type = $(this).data("type");
                switch (type + "")//1=当天；2=本周；3=本月;4=本季度；5=本年度;
                {
                    case "1":
                        beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                        endvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + myDate.getDate();
                        break;
                    case "2":
                        beginvalue = that.getFirstAndLastdayweek()[0];
                        endvalue = that.getFirstAndLastdayweek()[1];
                        break;
                    case "3":
                        beginvalue = myDate.getFullYear() + "-" + (myDate.getMonth() - 0 + 1) + "-" + "01";
                        endvalue = that.getFirstAndLastMonthDay(myDate.getFullYear(), (myDate.getMonth() - 0 + 1));
                        break;
                    case "4":
                        beginvalue = that.GetFirstAndLastDayQuarter()[0];
                        endvalue = that.GetFirstAndLastDayQuarter()[1];
                        break;

                    case "5":
                        beginvalue = myDate.getFullYear() + "-" + "01" + "-" + "01";
                        endvalue = myDate.getFullYear() + "-" + "12" + "-" + "31";
                        break;
                }
                $input.find("input[data-controlkey='DateTime']:first").val(beginvalue);
                $input.find("input[data-controlkey='DateTime']:last").val(endvalue);
                $input.find("input[data-controlkey='DateTime']:last").change();
            });

            $btnGroup.append($btn).append($ul);
            $input.append($btnGroup);

            filter.FilterValue = [beginvalue, endvalue];
            return $input;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.MasterData) {// 数据字典
            var itemValue = filter.FilterValue;// "拿到这个数据字典的显示名，在去后台请求它的子集";
            var select = "<select class=\"form-control mydropdown\" multiple=\"multiple\">";
            if (itemValue) {
                var items = itemValue.split(";;");
                for (var i = 0; items && i < items.length; i++) {
                    var item = items[i].split("::");
                    select += "<option value=\"" + item[1] + "\">" + item[1] + "</option>";
                }
            }
            select += "</select>";
            return select;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.FixedValue) {
            var options = filter.FilterValue == null || filter.FilterValue == "" ? "" : filter.FilterValue.split(";");
            if (this.boolDic && this.boolDic[filter.ColumnCode]) {
                $input = $("<div>").attr("id", filter.ColumnCode);
                if (options != "" && options.length > 0) {
                    for (var j = 0; j < options.length; j++) {
                        var $label;
                        if (this.boolDic && this.boolDic[filter.ColumnCode]) {
                            if (options[j] == "是")
                                $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="1" > ' + options[j]);
                            else
                                $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="0"  > ' + options[j]);
                            $input.append($label);
                        }
                        else {

                            $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px">').append('<input type="checkbox" value="' + options[j] + '"  checked> ' + options[j]);;
                        }
                    }
                }
                return $input;
            }
            else {
                var select = "<select class=\"form-control mydropdown\" multiple=\"multiple\">";
                for (var j = 0; j < options.length; j++) {
                    var value = options[j];
                    var key = options[j];
                    select += "<option value=\"" + key + "\">" + value + "</option>";
                }
                select += "</select>";
                return select;
            }
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.Boolean) {
            var options = filter.FilterValue == null || filter.FilterValue == "" ? "" : filter.FilterValue.split(";");
            $input = $("<div>").attr("id", filter.ColumnCode);
            if (options != "" && options.length > 0) {
                for (var j = 0; j < options.length; j++) {
                    var $label;
                    if (options[j] == "是")
                        $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="1" > ' + options[j]);
                    else
                        $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="0"  > ' + options[j]);
                    $input.append($label);
                }
            }
            return $input;
        }
        else if (filter.FilterType == _DefaultOptions.FilterType.Association) {

            var $input = $("<span class='mydropdown' id='" + filter.ColumnCode + "' data-boschemacode='" + filter.AssociationSchemaCode + "'></span>");
            $input.FormQuery();
            return $input;
        }
    },
    SetValue: function (filterValues) {
        this.filterValues = filterValues;
    },
    GetValue: function () {
        return this.filterValues;
    },
    ValidateFilter: function () {
        var $ReportFilters = this.filterContainer;
        if (this.Filters && $ReportFilters && $ReportFilters.length > 0) {
            var checkerror = false;
            var errorresult = "";
            for (var i = 0; i < this.Filters.length; i++) {
                var filter = this.Filters[i];

                if (!filter.Visible || filter.AllowNull) continue;
                var $filterControl = $ReportFilters.find("[id='" + filter.ColumnCode + "']");
                switch (filter.FilterType) {
                    case _DefaultOptions.FilterType.Numeric:
                    case _DefaultOptions.FilterType.DateTime:
                        {
                            var inputs = $filterControl.find("input");
                            if (!inputs[0].value && !inputs[1].value) {
                                checktrue = true;
                                errorresult += filter.DisplayName + "必填" + ";";
                            }
                        } break;
                    case _DefaultOptions.FilterType.Organization:
                        {
                           
                            var value = $filterControl.SelectedValue;
                            if (!value) {
                                checktrue = true;
                                errorresult += filter.DisplayName + "必填" + ";";
                            }
                        }; break;
                    case _DefaultOptions.FilterType.FixedValue:
                    case _DefaultOptions.FilterType.MasterData:
                        {
                            var value = $filterControl.val();
                            if (!value || value.length == 0) {
                                checktrue = true;
                                errorresult += filter.DisplayName + "必填" + ";";
                            }
                        } break;

                    case _DefaultOptions.FilterType.Association:
                        {
                            if (!$filterControl.FormQuery().GetValue()) {
                                checktrue = true;
                                errorresult += filter.DisplayName + "必填" + ";";
                            }
                        } break;
                    default:
                        {
                            var value = $filterControl.value;
                            if (!value) {
                                checktrue = true;
                                errorresult += filter.DisplayName + "必填" + ";";
                            }

                        } break;
                }
            }
            if (checkerror) {
                $.IShowWarn("提示", errorresult);
                return false;
            }
            return true;
        }
        if (!filter.AllowNull) {
            if (filter.IsSqlWhere) {
                if (values[0]) {
                    $.IShowWarn("提示", filter.DisplayName + "必填");
                    $(inputs[0]).focus();
                    return false
                }
            }
            else {
                if (values.length == 1) {
                    if (values[0]) {
                        $.IShowWarn("提示", filter.DisplayName + "必填");
                        $(inputs[0]).focus();
                        return false
                    }
                }
                else {
                    if (values[0] && values[1]) {
                        $.IShowWarn("提示", filter.DisplayName + "必填");
                        $(inputs[0]).focus();
                        return false
                    }
                }
            }
            return true;
        }
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
        if (time.getDay() != 0) {
            time.setDate(time.getDate() - time.getDay() + 1);
        }
        else {
            time.setDate(time.getDate() - 6);
        }
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
            return [firstdate, lastdate];
        } else if (month >= 4 && month <= 6) {
            var firstdate = year + '-' + 04 + '-01';
            var day = new Date(year, 6, 0);
            var lastdate = year + '-' + 06 + '-' + day.getDate();//获取第二季度最后一天日期    
            return [firstdate, lastdate];
        } else if (month >= 7 && month <= 9) {
            var firstdate = year + '-07-01';
            var day = new Date(year, 9, 0);
            var lastdate = year + '-09-' + day.getDate();//获取第三季度最后一天日期
            return [firstdate, lastdate];
        } else if (month >= 10 && month <= 12) {
            var firstdate = year + '-' + 10 + '-01';
            var day = new Date(year, 12, 0);
            var lastdate = year + '-' + 12 + '-' + day.getDate();//获取第四季度最后一天日期
            return [firstdate, lastdate];
        }

    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//图表插件
var ChartManager = function (reportPage, widget, filterData, ReportViewManager) {
    this.ReportViewManager = ReportViewManager;
    //报表页
    this.ReportPage = reportPage;
    //报表配置
    this.Widget = widget;
    //过滤数据
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
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
    this.$Container.append(this.$ChartElement);
    //数据源
    this.SourceData = null;
    //数据源的列
    this.SourceColumns = null;
    this.MyChartsDataResult = null;
    this.UnitFilterDataJson = null;
    //初始化
    this.Init();
};
ChartManager.prototype = {
    //初始化
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);

        var that = this;
        //echarts参数
        //提示加载中
        that.$ChartElement.html("正在加载数据请稍候...");
        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadChartsData,
            { FilterData: JSON.stringify(that.FilterData), ObjectId: that.Widget.ObjectID, Code: that.ReportPage.Code, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson) },
            function (data) {
                if (!data.State) {
                    that.$ChartElement.html("数据源不正确!");
                    return;
                }
                if (that.Widget.WidgetType == _DefaultOptions.WidgetType.Area || that.Widget.WidgetType == _DefaultOptions.WidgetType.Gauge) {
                    that.$ChartElement.html("不支持的图表类型!");
                    return;
                }
                //if ((!data.MyChartsDataResult.Categories || data.MyChartsDataResult.Categories.length == 0) && (!data.MyChartsDataResult.Series || data.MyChartsDataResult.Series.length == 0)) {
                //    CommonFunction.ShowNoneItemImg(that.$ChartElement);
                //    return;
                //}
                that.UnitFilterDataJson = data.UnitFilterDataJson;
                //数据源 数据
                that.SourceData = data.SourceData;
                //数据源 列
                that.SourceColumns = data.SourceColumns;
                that.MyChartsDataResult = data.MyChartsDataResult;
                //小数位数不足不补0
                for (var i = 0; i < data.MyChartsDataResult.Series.length; i++) {
                    var precision = data.MyChartsDataResult.Series[i].Precision;
                    if (precision != 0) {
                        for (var j = 0; j < data.MyChartsDataResult.Series[i].Data.length; j++) {
                            var str = data.MyChartsDataResult.Series[i].Data[j].toString();
                            var index = str.indexOf('.');
                            if (index < 0) {
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

                //开始渲染echarts
                that.BindChart.apply(that, [that.Widget.WidgetType]);
                //that.BindDataFun[that.Widget.WidgetType].apply(that);
            });
    },
    //渲染报表
    BindChart: function (WidgetType) {
        var ShowDemo = false;
        var chartType = 0;
        var showseries = true;
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
        var height = this.$Container.height() - 50;
        if (height <= 0)
            height = 400;
        var width = this.$Container.width() - 50;
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
            }
        });
    },
    //重新加载
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.FilterData = filterData;
        this.Init();
    },
    FullScreenTrigger: function () {
        if (this.ChartObject) {
            this.ChartObject.clear();
            this.ChartObject = null;
        }
        this.BindChart.apply(this, [this.Widget.WidgetType]);
    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//汇总表
var ChartTableManager = function (reportPage, widget, filterData, ReportViewManager) {
    this.ReportViewManager = ReportViewManager;
    //报表页
    this.ReportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
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
    this.UnitFilterDataJson = null;
    //存储table最后两行的宽度
    this.lastsecondline = [];
    this.lastline = [];
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
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
        var that = this;
        //提示加载中
        that.$Container.html("正在加载数据请稍候...");
        // 由于Mvc的JsonResult的Date Format为 "\/Date()\/"
        if (that.Widget.CreatedTime.indexOf("/Date(") > -1) {
            var CreatedTimedate = new Date(parseInt(that.Widget.CreatedTime.replace("/Date(", "").replace(")/", ""), 10));
            if (CreatedTimedate.toLocaleDateString().toLocaleLowerCase() == "invalid date") {
                that.Widget.CreatedTime = new Date();
            }
            else {
                that.Widget.CreatedTime = CreatedTimedate.toLocaleDateString();
            }
        }

        if (that.Widget.ModifiedTime.indexOf("/Date(") > -1) {
            var CreatedTimedate = new Date(parseInt(that.Widget.ModifiedTime.replace("/Date(", "").replace(")/", ""), 10));
            if (CreatedTimedate.toLocaleDateString().toLocaleLowerCase() == "invalid date") {
                that.Widget.ModifiedTime = new Date();
            }
            else {
                that.Widget.ModifiedTime = CreatedTimedate.toLocaleDateString();
            }
        }

        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadChartsData,
            { FilterData: JSON.stringify(that.FilterData), ObjectId: that.Widget.ObjectID, Code: that.ReportPage.Code, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson) },
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
        var top = 0;
        var left = 0;

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
                for (var i = 0; i < this.ColumnTable[key].length; i++) {
                    var mytd = this.ColumnTable[key][i];
                    if (key == "ColumnHeaderTableLastLine" || key == "ColumnHeaderTableLastSecondLine" || i == 0 || that.Widget.LinkageReports == null || that.Widget.LinkageReports.length == 0 || (ColumnCounter == 0 && i == this.ColumnTable[key].length - 1)) {
                        $Th = $('<th style="width:' + mytd.ColSpan *140+ 'px" row="' + RowCounter + '" data-code="' + mytd.Code + '" col="' + ColumnCounter + '" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value == "" ? "--" : mytd.Value);

                    }
                    else {
                        $Th = $('<th  style="width:' + mytd.ColSpan * 140 + 'px" row="' + RowCounter + '" data-code="' + mytd.Code + '" col="' + ColumnCounter + '" class="unittd" data-columncode="' + TempColumnCode + '" rowspan="' + mytd.RowSpan + '" colspan="' + mytd.ColSpan + '" data-value="' + mytd.Value + '" >').html(mytd.Value == "" ? "--" : mytd.Value);
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
                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length > 0) {
                                for (var key in that.Widget.LinkageReports) {
                                    var Objectid = that.Widget.LinkageReports[key];
                                    if (that.ReportViewManager.ReportManagers[Objectid]) {
                                        that.ReportViewManager.ReportManagers[Objectid].ReLoad(that.FilterData, UnitFilterDataJson);
                                    }
                                }
                            }
                        });
                    }
                    $Tr.append($Th.clone(true));
                    ColumnCounter = ColumnCounter + mytd.ColSpan;
                }
                //var mytd1 = this.ColumnTable[key][this.ColumnTable[key].length - 1];
                //var $Th1 = $('<th  data-columncode="' + TempColumnCode + '" rowspan="' + mytd1.RowSpan + '" colspan="' + mytd1.ColSpan + '" data-value="' + mytd1.Value + '" >').html(mytd1.Value == "" ? "--" : mytd1.Value);
                //$Tr.append($Th1.clone(true));
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
                        $Th = $('<th  style="width:' + MyRowTd.ColSpan * 140 + 'px"  data-columncode="' + MyRowTd.ColumnCode + '" data-code="' + MyRowTd.Code + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value == "" ? "--" : MyRowTd.Value);
                    }
                    else {
                        $Th = $('<th  style="width:' + MyRowTd.ColSpan * 140 + 'px"  class="unittd" data-code="' + MyRowTd.Code + '" data-columncode="' + MyRowTd.ColumnCode + '" data-value="' + MyRowTd.Value + '" rowspan="' + MyRowTd.RowSpan + '" colspan="' + MyRowTd.ColSpan + '">').html(MyRowTd.Value == "" ? "--" : MyRowTd.Value);
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
                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length > 0) {
                                for (var key in that.Widget.LinkageReports) {
                                    var Objectid = that.Widget.LinkageReports[key];
                                    if (that.ReportViewManager.ReportManagers[Objectid]) {
                                        that.ReportViewManager.ReportManagers[Objectid].ReLoad(that.FilterData, UnitFilterDataJson);
                                    }
                                }
                            }
                        });
                    }
                    $Tr.append($Th.clone(true));
                }
                //行表头冻结
                if (FlagFreezenRow) {
                    $FreezenTableRowTbody.append($Tr.clone(true));
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
                            if (that.Widget.LinkageReports != null && that.Widget.LinkageReports.length > 0) {
                                for (var key in that.Widget.LinkageReports) {
                                    var Objectid = that.Widget.LinkageReports[key];
                                    if (that.ReportViewManager.ReportManagers[Objectid]) {
                                        that.ReportViewManager.ReportManagers[Objectid].ReLoad(that.FilterData, UnitFilterDataJson);
                                    }
                                }
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
       
        //给table的每一个td设置一个悬浮属性
        that.$Container.find('.table tbody').find("td").each(function () {
          
            $(this).prop("title", $(this).text());
        });
        that.$Container.find('.table tbody').find("th").each(function () {

            $(this).prop("title", $(this).text());
        });
        that.$Container.find('.table thead').find("th").each(function () {

            $(this).prop("title", $(this).text());
        });

        //列表头冻结
        if (FlagFreezenColumn) {
            this.$Container.append($FreezenColumnTable);
            //$FreezenColumnTable.css("width", "100%");
            this.ComputeOrgWidth($Table);
            var ColumnHeaderTableLastSecondLineCounter = 0;
            var ColumnHeaderTableLastLineCounter = 0;
            //计算最后两行的宽度
            this.ComputerWidth($FreezenColumnTable, that.lastsecondline, that.lastline);

            //给table的每一个td设置一个悬浮属性
            that.$Container.find('.table tbody').find("td").each(function () {

                $(this).prop("title", $(this).text());
            });
            that.$Container.find('.table tbody').find("th").each(function () {

                $(this).prop("title", $(this).text());
            });
            that.$Container.find('.table thead').find("th").each(function () {

                $(this).prop("title", $(this).text());
            });
        }
        //行表头冻结
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
        if (FlagFreezenColumn || FlagFreezenRow) {
            this.$Container.scroll(function () {

                var ScrollY = $(this)[0].scrollTop + (top - 0) + "px";
                var ScrollX = $(this)[0].scrollLeft + (left - 0) + "px";
                if (FlagFreezenColumn) {
                    $FreezenColumnTable.css("top", ScrollY);
                    $FreezenOnlyHeaderTable.css("top", ScrollY);
                }

                if (FlagFreezenRow) {
                    $FreezenRowTable.css("left", ScrollX);

                    $FreezenOnlyHeaderTable.css("left", ScrollX);
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
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.FilterData = filterData;
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.Init();
    },
    FullScreenTrigger: function () {

    }
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//明细表
var GridViewManager = function (reportPage, widget, filterData, ReportViewManager) {
    this.ReportPage = reportPage;
    this.ReportViewManager = ReportViewManager;
    this.Widget = widget;
    this.FilterData = filterData;
    this, UnitFilterDataJson = null;//JSON.stringify(that.UnitFilterDataJson)
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
    this.SourceColumns = null;
    //定义过滤器
    this.GetQueryParams();
    this.SourceData = null;
    this.mydatatable = null;
    this.PageIndex = 0;
    this.PageLength = 15;
    this.Page_Turn = null;
    this.Total = 0;
    this.FirstLineWidths = [];
    this.HasLoad = false;
    this.Init();
    this.columns = [];
    this.CodesHasSort = [];
    this.Numeric = false;
    this.dir = null;//排序 正序或者倒序
    this.orderby = null;//排序字段
};
GridViewManager.prototype = {
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
        $(this.$Container).css("overflow", "hidden");
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
        var $PanelFooter = $("<div class='panel-footer-reportview'>");
        $TableDiv.append($PanelFooter);
        //翻页
        var html = '';
        html += '<div class="Page_Turn">';
        html += '    <div style="float:right;" class="Page_Total"><span>共0条</span></div>';
        html += '    <div class="Page_Size dropup" style="float:right">';
        html += '        <select class="Page_Size_Select">';
        html += '            <option value="10">10</option>';
        html += '            <option value="20">20</option>';
        html += '            <option value="50">50</option>';
        html += '            <option value="100">100</option>';
        html += '        </select>';
        html += '        <button class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
        html += '            <span>10</span>';
        html += '            <i class="fa fa-chevron-down"></i>';
        html += '        </button>';
        html += '        <ul class=" dropdown-menu">';
        html += '            <li><a>10</a></li>';
        html += '            <li><a>20</a></li>';
        html += '            <li><a>50</a></li>';
        html += '            <li><a>100</a></li>';
        html += '        </ul>';
        html += '    </div>';
        html += '    <div class="btn-group Page_Turn_ButtonGroup" style="width: 100px;">';
        html += '        <i class="btn fa fa-chevron-left Page_Num_Pre"  style="background-color:#fff;"></i>';
        html += '        <i class="btn fa fa-chevron-right Page_Num_Next"></i>';
        html += '    </div>';
        html += '    <div class="Page_Num" style="float:right">';
        html += '        <input type="text" value="0" class="mypagenuminput" /><label class="mypagenumlabel">/0</label>';
        html += '    </div>';
        html += '</div>';
        this.Page_Turn = $(html);
        $PanelFooter.append(this.Page_Turn);
        //绑定操作
        this.Page_Turn.find(".Page_Size ul li a").unbind("click").bind("click", function () {
            var $this = $(this);
            var value = $this.html() - 0;
            $(".Page_Size").find("button span").html(value);
            if (that.mydatatable != null)
                that.mydatatable.page.len(value).draw();
        });
        console.log(this.ReportPage);
        console.log(this.Widget);
       
        CommonFunction.Post(
           CommonFunction.LoadGridData,
           { FilterData: JSON.stringify(that.FilterData), WidgetID: that.Widget.ObjectID, Code: that.ReportPage && that.ReportPage.Code ? that.ReportPage.Code : that.ReportPage.Code, UnitFilterDataJson: JSON.stringify(that.UnitFilterDataJson), "start": 0, "length": 0 },
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
                               order.push([j+1, dir]);
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
                               var $Th1 = $("<th colspan='1' rowspan='1'>").attr("data-class", "gridview-th").attr("data-field", childnode.Code).attr("data-align", align).text(childnode.DisplayName).attr('title',childnode.DisplayName);//.css("width", width);
                               $Tr1.append($Th1);
                               that.columns[childnode.Code] = childnode.Code;
                               columns.push({
                                   data: childnode.Code, title: childnode.DisplayName, render: function (aa, bb, cc, dd) {
                                       if (aa) {
                                           if ($.isArray(aa)) {
                                               var value = aa;
                                               if (value.length > 0) {
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
                           var $Th = $("<th colspan='" + count + "' rowspan='1'>").attr("data-class", "gridview-th").attr("data-field", node.Code).attr("data-align", align).text(node.DisplayName).attr('title', node.DisplayName);//.css("width", width);
                           $Tr.append($Th);
                          
                       }
                       else {
                           var $Th = $("<th colspan='1' rowspan='2'>").attr("data-class", "gridview-th").attr("data-field", node.Code).attr("data-align", align).text(node.DisplayName).attr('title', node.DisplayName);//.css("width", width);
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
                       var $Th = $("<th>").attr("data-class", "gridview-th").attr("data-field", column.ColumnCode).attr("data-align", align).text(column.DisplayName).attr('title',column.DisplayName);//.css("width", width);
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
                 // 标题栏渲染完成
               }
             
               that.mydatatable = $Table.DataTable({
                   "autoWidth": true,
                   "deferRender": true,
                   "filter": false,
                   "info": true,
                   "lengthChange": true,
                   "lengthMenu": [10, 20, 50, 100],
                   "pageLength": that.Page_Turn.find(".Page_Size button span").html() - 0,
                   "paginate": true,
                   "order": order,
                   "ordering": true,
                   "processing": true,
                   "fixedColumns": false,
                   "paginationType": "full_numbers",
                   "scrollInfinite": true,
                   "scrollCollapse": true,
                   "scrollY": "400px",
                   "scrollX": "100%",
                   "serverSide": true,
                   "dom": 'rt',
                   "columns": columns,
                   "ajax": {
                       "url": CommonFunction.ActionUrl+"/"+CommonFunction.LoadGridData + "?Command=" + CommonFunction.LoadGridData + "&WidgetID=" + that.Widget.ObjectID + "&Code=" + that.ReportPage.Code,
                       "type": "Post",
                       "dataSrc": "data",
                       data: function (d) {
                       
                           var param = {};
                           param.start = d.start;
                           param.length = d.length;
                           that.$Container.parent().scrollTop(0);
                           //if (d.order && that.HasLoad && (d.order.length == 1)) {
                           //    param.orderby = d.columns[d.order[0].column].data;
                           //    param.dir = d.order[0].dir;
                           //}
                           if (d.order && that.HasLoad &&(d.order.length == 1)) {
                               
                               param.orderby = d.columns[d.order[0].column].data;
                               param.dir = d.order[0].dir;
                           }
                           that.dir = param.dir;
                           that.orderby = param.orderby;
                           param["FilterData"] = JSON.stringify(that.FilterData);
                           param["UnitFilterDataJson"] = JSON.stringify(that.UnitFilterDataJson);
                           return param;
                       },
                   },
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
                   //PC端分页
                   "drawCallback": function (settings) {
                       
                       //给table的每一个td设置一个悬浮事件
                       that.$Container.find('.dataTables_scrollBody .table tbody').find("td").each(function () {
                            $(this).prop("title", $(this).text());
                         
                       });
                       var pageinfo = that.mydatatable.page.info();
                       var currentpagenum = pageinfo.page + 1;
                       var totalpagenum = pageinfo.pages;
                       var $Page_Num_Pre = that.Page_Turn.find(".Page_Num_Pre");
                       var $Page_Num_Next = that.Page_Turn.find(".Page_Num_Next");
                       that.Page_Turn.find(".Page_Total span").html("共" + pageinfo.recordsTotal + "条");
                       that.Page_Turn.find(".mypagenuminput").val(currentpagenum);
                       that.Page_Turn.find(".mypagenumlabel").html("/" + totalpagenum);
                       if (currentpagenum == 1) {
                           $Page_Num_Pre.unbind("click");
                           if (!$Page_Num_Pre.hasClass("disabled"))
                               $Page_Num_Pre.addClass("disabled");
                       }
                       else {
                           $Page_Num_Pre.removeClass("disabled");
                           $Page_Num_Pre.unbind("click").bind("click", function () {
                               that.mydatatable.page('previous').draw('page');
                           });
                       }
                       if (currentpagenum == totalpagenum) {
                           $Page_Num_Next.unbind("click");
                           if (!$Page_Num_Next.hasClass("disabled"))
                               $Page_Num_Next.addClass("disabled");
                       }
                       else {
                           $Page_Num_Next.removeClass("disabled");
                           $Page_Num_Next.unbind("click").bind("click", function () {
                               that.mydatatable.page('next').draw('page');
                           });
                       }
                       if (totalpagenum == 0) {
                           that.Page_Turn.find(".mypagenuminput").val("0");
                           $Page_Num_Pre.unbind("click");
                           if (!$Page_Num_Pre.hasClass("disabled"))
                               $Page_Num_Pre.addClass("disabled");
                           $Page_Num_Next.unbind("click");
                           if (!$Page_Num_Next.hasClass("disabled"))
                               $Page_Num_Next.addClass("disabled");
                       }
                   },
                   "createdRow": function (row, data, index) {
                       var $row = $(row);
                       if (data[CommonFunction.BizObjectId]) {
                           var SchemaCode = data[CommonFunction.BizObjectId]["SchemaCode"];
                           var objectid = data[CommonFunction.BizObjectId][CommonFunction.BizObjectId]
                           $row.unbind("click").bind("click", function () {
                               $.ISideModal.Show('/Sheet/DefaultSheet/' + SchemaCode + '?SchemaCode=' + SchemaCode + '&BizObjectId=' + objectid + '');
                           })
                       }
                   }
               }
           ).on('init.dt', function () {
               //- that.$Container.find(".dataTables_scrollHead").css("height").replace("px", "") - 50
               that.$Container.find('.dataTables_scrollBody').css("max-height", that.$Container.css("height").replace("px", "")+25  + 'px').css("height","320px");
               that.Page_Turn.find(".mypagenuminput").unbind("blur").bind("blur", function () {
                   var pagenum = $(this).val() - 1;
                   var pageinfo = that.mydatatable.page.info();
                   var totalpagenum = pageinfo.pages;
                   if (pagenum > totalpagenum)
                       pagenum = totalpagenum;
                   if (pagenum < 0)
                       pagenum = 0;
                   that.mydatatable.page(pagenum).draw('page');
               });
               that.Page_Turn.find(".mypagenuminput").unbind("keydown").bind("keydown", function (e) {
                   if (e.which == 13) {
                       var pagenum = $(this).val() - 1;
                       var pageinfo = that.mydatatable.page.info();
                       var totalpagenum = pageinfo.pages;
                       if (pagenum > totalpagenum)
                           pagenum = totalpagenum;
                       if (pagenum < 0)
                           pagenum = 0;
                       that.mydatatable.page(pagenum).draw('page');
                       return false;
                   }
               });
               that.HasLoad = true;
           });
           });
    },
    ComputerWidth: function () {
        var that = this;
        that.$Container.find('.dataTables_scrollHeadInner table').css("width", that.$Container.find('.dataTables_scrollBody table').scrollWidth + "px");
        that.$Container.find('.dataTables_scrollBody').attr("id", that.Widget.ObjectID + "_dataTables_scrollBody");
        var scrollwidht = document.getElementById(that.Widget.ObjectID + "_dataTables_scrollBody").offsetWidth - document.getElementById(that.Widget.ObjectID + "_dataTables_scrollBody").scrollWidth;
        var headwidth = that.$Container.find('.dataTables_scrollBody').css("width").replace("px", "") - scrollwidht + "px";
        that.$Container.find('.dataTables_scrollHeadInner').css("width", headwidth).css("margin-top","-5px");
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
        window[this.Widget.ObjectID + "_GetQueryParams"] = function (params) {
            that.$Container.parent().scrollTop(0);
            params["FilterData"] = JSON.stringify(that.FilterData);
            return params;
        };
        window[this.Widget.ObjectID + "_ResponseHandler"] = function (params) {
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
        this.columns = [];
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.FilterData = filterData;
        this.GetQueryParams();
        this.Init();
    },
    FullScreenTrigger: function () {
        var pannel = this.$Container.parent();
        this.$Container.find('.dataTables_scrollBody').css("max-height", this.$Container.css("height").replace("px", "") - this.$Container.find(".dataTables_scrollHead").css("height").replace("px", "") - 50 + 'px');
       
        this.mydatatable.ajax.reload();
    },
};
//********************************************   华丽分割线   ********************************************
//********************************************   华丽分割线   ********************************************
//简易看板
var SimpleBoardManager = function (reportPage, widget, filterData, ReportViewManager, color) {
    this.ReportViewManager = ReportViewManager;
    this.ReportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
    this.SourceColumns = null;
    this.SimpleBoardChildManagers = [];
    this.allColor = color;
    //定义过滤器
    this.SourceData = null;
    this.UnitFilterDataJson = null;
    this.Init();
}
SimpleBoardManager.prototype = {
    Init: function () {
        this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID);
        this.$Container.html("");
        var num = Math.floor(Math.random(0, 6) * 6);
        this.CreateLayout();
       
        for (var i = 0; this.Widget.ReportWidgetSimpleBoard != null && i < this.Widget.ReportWidgetSimpleBoard.length; i++) {
            var ReportWidgetSimpleBoard = this.Widget.ReportWidgetSimpleBoard[i];
            if (!ReportWidgetSimpleBoard.ReportSourceId) continue;
            this.SimpleBoardChildManagers[ReportWidgetSimpleBoard.ObjectID] = new SimpleBoardChildManager(this.ReportPage, this.Widget, this.FilterData, ReportWidgetSimpleBoard, this.allColor, this.ReportViewManager, this.UnitFilterDataJson);
        }
    },
    CreateLayout: function () {
        var RowNum = this.Widget.SimpleBoardRowNumber - 0;
        var ColumnNum = this.Widget.SimpleBoardColumnNumber - 0;
        var $table = $('<table >');
        $table.addClass("Mytable_SimpleBoard");
        $table.attr("id", this.Widget.ObjectID + "_table");
        var $tablebody = $('<tbody>');
        $table.append($tablebody);
        for (var i = 0; i < RowNum; i++) {
            var heigth = 100 / RowNum + "%";
            var $tr = $('<tr heigth="' + heigth + '">');
            $table.append($tr);
            for (var j = 0; j < ColumnNum; j++) {
                var width = 100 / ColumnNum + "%";
                var $td = $('<td width="' + width + '">').css("padding", '24px');
                var $divimg = $("<div style='float:left;' class='myimg'>");
                var $positiondiv = $("<div style=''>")
                $img = $("<i class='iconReport-Personnel_015' style='height: 40px;width: 40px;display: block;line-height: 40px;text-align: center;font-size: 22px;background-color: " + this.allColor + ";border-radius: 20px;color:#fff;'>");
                $divimg.append($positiondiv.append($img));
                var $div = $("<div style='float:left; margin-left:10px; text-align:left;padding-top:10px;' class='mydata'><span style='color:#929292;'>暂无数据...</span></div>");
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
var SimpleBoardChildManager = function (reportPage, widget, filterData, widgetsimpleboard, allColor, ReportViewManager, UnitFilterDataJson) {
    this.ReportViewManager = ReportViewManager;
    this.reportPage = reportPage;
    this.Widget = widget;
    this.FilterData = filterData;
    this.WidgetSimpleBoard = widgetsimpleboard;
    //报表容器
    this.$Container = this.ReportViewManager.$WidgetContainer.find("#" + this.Widget.ObjectID); ("#" + this.Widget.ObjectID + "_table");
    this.Text = null;
    this.Value = null;
    this.allColor = allColor;
    this.UnitFilterDataJson = UnitFilterDataJson;
    this.Init();
}
SimpleBoardChildManager.prototype = {
    Init: function () {
        var that = this;
        //加载报表数据源数据
        CommonFunction.Post(
            CommonFunction.LoadSimpleBoard,
            { "FilterData": JSON.stringify(that.FilterData), "WidgetObjectId": that.Widget ? that.Widget.ObjectID : null, "ReportPageObjectId": that.reportPage ? that.reportPage.Code : null, "ReportWidgetSimpleBoardObjectId": that.WidgetSimpleBoard ? that.WidgetSimpleBoard.ObjectID : null, "UnitFilterDataJson": JSON.stringify(that.UnitFilterDataJson), "WidgetSimpleBoard": JSON.stringify(that.Widget) },
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
        if (true) {
            var $div = $("<div style='float:left; margin-left:10px; text-align:left;' class='mydata'>");
            var $positiondiv1 = $("<div style=''>");
            var $Text = $("<p>").addClass("myReportWidgetSimpleBoardText").html(this.Text).css({ color: '#565656', 'font-size': '14px', margin: 0 });
            var $Value = $("<p>").addClass("myReportWidgetSimpleBoardValue").html(this.Value).css({ "color": this.allColor, 'font-size': '16px', margin: 0 });
            var $td = this.$Container.find('tr:eq(' + this.WidgetSimpleBoard.RowIndex + ')').children('td:eq(' + this.WidgetSimpleBoard.ColumnIndex + ')');
            $div.append($positiondiv1.append($Value).append($Text));
            $td.find(".mydata").hide();
            $td.append($div)
        }
    },
    ReLoad: function (filterData, UnitFilterDataJson) {
        this.FilterData = filterData;
        this.UnitFilterDataJson = UnitFilterDataJson;
        this.Init();
    }
};
