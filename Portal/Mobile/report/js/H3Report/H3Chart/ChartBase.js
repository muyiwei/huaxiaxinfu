(function ($) {
    /**
     * 图形基础拖入框 参数说明
     * 分为横向柱形图和纵向柱形图
     * @param  width        chart图宽度
     * @param  height       chart图高度
     * @param  ChartType    图形类别，为整型 0:折线图,1:柱状图,2:饼图,3:雷达图,4:漏斗图
     * @param  ShowTitle    是否显示标题
     * @param  DragDoneCallBack  配置报表所需回掉函数（调用插件是需要重写 ）    
     *    提供一个参数 {type:'',operate:'',mess:''} 
     *    type:返回消息类型，值如下(Series:系列,Categories:类别,Fields:字段,Error:错误)
     *    operate:为对应的操作，值如下(Add:新增，Edit:修改,Delete:删除)单击字段时返回Edit
     *    mess:消息内容，为字符串,当修改字段时mess为所需要修改的字段
     *    例如：{type:'Series'}  表示拖拽配置的为系列 {type:'Error',mess:'xxxxxx'}返回的数据格式错误等
     *    回掉函数返回的数据类型:{ Series:[{Name:'',Data:''}],Categories:[],Fields:[{Code:'',DisplayName:''}],}
     *    配置字段时需要返回Fields的值
     *    例如：{
     *               Fields:[],//配置的时候需要配置该参数，显示的时候不需要配置该参数
     *               Categories: ['Jim', 'Lucy', 'Lily', 'Adele', 'Novak'],
     *               Series = [{
     *                   'Name': '语文',
     *                   'Data': [88, 56, 78, 34, 99],
     *                   'Code':'xxxx'
     *                }, {
     *                   'Name': '数学',
     *                   'Data': [20, 78, 45, 89, 22],
     *                   'Code':'xxxx'
     *                }, {
     *                   'Name': '英语',
     *                   'Data': [50, 87, 56, 45, 67],
     *                   'Code':'xxxx'
     *                }];
     *           }
     *@param ClickChartCBack 回掉函数，用于点击图表所执行的回调，需要重写
     *    提供一个参数 {'Name':'','Data':'','Category':'','CateCode':'','SeriesCode':''} 
     *    Name:点击图表字段名
     *    Data:点击图表数值
     *    Category:点击图标系列
     *    CateCode:类别Code
     *    SeriesCode:系列Code
     *    例如：{'Name':'语文','Data':'78',Category:'jim'}
     */


    var ChartType = ['折线图', '柱状图', '饼图', '雷达图', '漏斗图'];
    var ChartTypeE = ['Line', 'vBar', 'Pie', 'Radar', 'Funnel'];
    var WidgetType = {
        Line: 0,
        Bar: 1,
        Pie: 2,
        Radar: 3,
        Funnel: 4
    }
    var DefaultData = {};
    var DefaultOPT = {
        ChartType: 1,
        Width: 400,
        Height: 300,
        ShowSeries: true,
        setCfg: true,
        SetField: false,
        ShowDemo: false,
        Colors: ['#69A8E8', '#82B986', '#F4D67C', '#F07F77', '#6BD6E9', '#F5769D', '#F2D39E', '#C6ABF2', '#F8B892', '#CB9E9E', '#C888D4', '#9EC66F', '#D288A7', '#88B0B6', '#94CAB1', '#BCBCE4', '#7185B9', '#FFC973', '#95D1E7', '#CAC4B3']
    }

    var colorLen = DefaultOPT.Colors.length;

    function ChartBase(opt, BaseWrap) {
        this.Htmls = ['<div class="BaseChartWrapOuter"></div>',
            '<div class="BaseChartTitle"></div>',
            '<div class="BaseChartChart"></div>',
            '<div class="BaseChartCategories"></div>',
            '<div class="BaseChartSeries"><div class="BaseChartLengend"><div class="SeriesUL"><a class="bar_all bar_all_up bar-animate" data-type="show" title="点击展示或隐藏部分系列"><i class="chart-arrow"></i></a><a class="bar_all bar_all_up bar_all_left" data-type="left" title="上一页"><i class="chart-arrow"></i></a><a class="bar_all bar_all_up bar_all_right" data-type="right" title="下一页"><i class="chart-arrow"></i></a></div></div></div>',
            '<div class="BaseChartField"></div>',
            '<div class="BaseChartFieldSet clearfix"></div>'
        ];

        this.opt = $.extend({}, DefaultOPT, opt);

        var that = this;
        //接收的参数汇总
        that.ReportWidget = {
            Series: that.opt.Series || [],
            ShowSeries: that.opt.ShowSeries,
            Categories: [],
            CateCodes: {},
            Fields: [],
            ShowDemo: that.opt.ShowDemo,
            IgnoreSeries: [],
            SeriesColor: that.opt.Colors,
            SeriesIndex: 0,
            SeriesCount: that.opt.Series && Math.ceil(that.opt.Series.length / 10)
        }

        //传给图表插件数据整合
        that.DisplayData = {
            Width: 400,
            Height: 300,
            Max: 0,
            Min: Number.MAX_VALUE,
            Categories: [],
            CateCodes: {},
            CateLength: 6,
            // Data: [],
            Colors: [],
            Series: [],
            ClickChartCBack: function (ret) {
                that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
            },
            BarGap: 20,
            ChartType: ''
        }

        that.BaseWrap = BaseWrap || $('body');

        that.init();
    }

    ChartBase.prototype = {
        init: function () {
            var that = this;
            that.IsMobile = isMobile();
            that.Wrap = $(that.Htmls[0]);
            that.Title = $(that.Htmls[1]);
            that.Title.text(ChartType[that.opt.ChartType]);
            that.Chart = $(that.Htmls[2]);
            that.Categories = $(that.Htmls[3]);
            that.Series = $(that.Htmls[4]);
            that.Fields = $(that.Htmls[5]);
            that.FieldSet = $(that.Htmls[6]);
            that.SeriesUL = that.Series.find('.SeriesUL');
            that.SeriesLeft = that.Series.find(".bar_all_left");
            that.SeriesRight = that.Series.find(".bar_all_right");
            this.Up = that.Series.find('.bar-animate');
            this.opt.Width = this.opt.Width - 17;

            //如果是火狐浏览器 解决火狐浏览器的兼容性问题
            var u = navigator.userAgent;
            if (u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1) {
                this.opt.Height = this.opt.Height - 30;
            } else {
                this.opt.Height = this.opt.Height - 10;
            }
            //debugger
            that.Wrap.css({
                width: this.opt.Width,
                height: this.opt.Height
            });
            that.DemoText = $("<i class='demotext'>样例数据</i>").appendTo(that.Wrap);

            if (!that.IsMobile) {
                //that.Series.find(".bar_all_right,.bar_all_left").hide();
            } else {
                //that.Series.find(".bar_all_left").hide();
                that.IsMobile && (that.ReportWidget.SeriesCount > 1 && that.SeriesRight.show());
            }

            that.TitleHeight = 35;
            //that.DragPlaceHeight = !!that.opt.setCfg ? 100 : 50;
            if (!!that.opt.setCfg) {
                that.DragPlaceHeight = 100;
                if (that.opt.ChartType == 2 || that.opt.ChartType == 6) {
                    that.DragPlaceHeight = 50;
                }
            } else {
                //if (that.opt.ShowSeries) {
                that.DragPlaceHeight = 30;
                that.Series.addClass("showChart");
                //}
                //else {
                //    that.DragPlaceHeight = 0;
                //}
            }

            that.dragContain = $(that.opt.dragContain);

            if (that.opt.Categories) {
                for (var k = 0, len = that.opt.Categories.length; k < len; k++) {
                    var item = that.opt.Categories[k];
                    that.ReportWidget.Categories.push(item["value"]);
                    that.ReportWidget.CateCodes[item["value"]] = item["key"];
                }
            }
            that.ClickMouseDown = false; //判断是是否鼠标拖拽时释放事件
            if (that.opt.setCfg) {
                if (that.opt.ChartType == _DefaultOptions.WidgetType.Funnel) {
                    that.opt.ChartType = 4;
                } else if (that.opt.ChartType == _DefaultOptions.WidgetType.Radar) {
                    that.opt.ChartType = 3;
                }
            }
            that.DisplayData.ChartType = ChartTypeE[that.opt.ChartType];
            that.DisplayData.Height = that.opt.ShowTitle ? that.opt.Height - that.TitleHeight - that.DragPlaceHeight : that.opt.Height - that.DragPlaceHeight;
            that.Fields.height(that.DisplayData.Height);
            that.Fields.append(that.Chart);
            that.Fields.append(that.FieldSet);

            that.DisplayData.Width = that.opt.Width;
            if (that.opt.ShowTitle) {
                that.BaseWrap.append(that.Wrap.append(that.Title).append(that.Fields).append(that.Categories).append(that.Series));
            } else {
                that.BaseWrap.append(that.Wrap.append(that.Fields).append(that.Categories).append(that.Series));
            }
            //事件绑定
            that.bindDrag();
            that.fillText();
            that.bind();
            that.drawChart();
        },
        //绑定配置模式相关事件
        bindDrag: function () {
            var that = this;
            //感应鼠标拖拽位置
            $(document).unbind("mousemove.chartbase").bind('mousemove.chartbase', function (event) {
                if (that.BaseWrap) {
                    that.BaseWrap.find('.BaseChartCategories,.BaseChartSeries,.BaseChartChart').each(function (index, el) {
                        $(this).removeClass('BaseChartHover');
                        var p = $(this).offset();
                        var x1 = p.left;
                        var x2 = p.left + $(this).width();
                        var y1 = p.top;
                        var y2 = p.top + $(this).height();

                        if (x1 < event.pageX && event.pageX < x2 && y1 < event.pageY && event.pageY < y2) {
                            $(this).addClass('BaseChartHover');
                        }
                    });;
                }
            });

            if (that.opt.SetField) {
                //删除配置的系列或者类别
                that.Wrap.on('click', '.bar_close', function () {
                    if ($(this).attr('data-f') === 'Cate') {
                        that.Categories.html("");
                        that.ReportWidget.Categories = [];
                        that.opt.DragDoneCallBack({ 'type': 'Categories', 'operate': 'Delete' })
                        console.log('类别已删除');
                    } else if ($(this).attr('data-f') === 'Series') {
                        that.Series.html("");
                        that.ReportWidget.Series = [];
                        that.ReportWidget.IgnoreSeries = [];
                        that.opt.DragDoneCallBack({ 'type': 'Series', 'operate': 'Delete' })
                        console.log('系列已删除');
                    }

                    that.opt.DelCallBack && that.opt.DelCallBack();
                    //to do 给chart赋值上默认的图像
                    that.drawChart();
                    return false;
                });

                //删除配置的字段
                that.Wrap.on('click', '.fieldDel', function (event) {
                    var DragData = that.opt.DragDoneCallBack({ 'type': 'Fields', 'operate': 'Delete', 'mess': $(this).attr('data-f') });
                    $.extend(that.ReportWidget, DragData);
                    that.analysData('Fields');
                    that.drawChart();
                    return false;
                });

                //点击配置的字段，返回给调用插件做进行操作
                that.Wrap.on('click', '.fieldItem', function (event) {
                    var DragData = that.opt.DragDoneCallBack({ 'type': 'Fields', 'operate': 'Edit', 'mess': $(this).find('.fieldDel').attr('data-f') });
                    $.extend(that.ReportWidget, DragData);
                    that.analysData('Fields');
                    that.drawChart();
                    return false;
                });

                //鼠标悬浮字段区域可进行编辑
                that.Fields.bind('mouseenter', function (event) {
                    that.FieldSet.finish();
                    that.FieldSet.show(300);
                });

                that.Fields.bind('mouseleave', function (event) {
                    that.FieldSet.finish();
                    that.FieldSet.hide(300);
                });
            }
        },
        mouseupHandle: function (event) {
            var $this = $(event.target);
            var that = this;
            if ($this.hasClass('BaseChartHover')) {
                $this.removeClass('BaseChartHover');
            }
            $this.html("");

            if (!that.opt.DragDoneCallBack) {
                return;
            }
            //类别区域释放
            if ($this.hasClass('BaseChartCategories') || $this.parent().hasClass('BaseChartCategories')) {
                var DragData = that.opt.DragDoneCallBack({ 'type': 'Categories', 'operate': 'Add' });
                that.doRetData(DragData);
                that.analysData('Categories', $this);
            }
            //系列区域释放
            if ($this.hasClass('BaseChartSeries') || $this.parent().hasClass('BaseChartSeries')) {
                var DragData = that.opt.DragDoneCallBack({ 'type': 'Series', 'operate': 'Add' });
                //$.extend(that.ReportWidget, DragData);
                that.doRetData(DragData);
                that.analysData('Series', $this);
            }
            //字段区域释放
            if ($this.hasClass('ChartToolTip') || $this.hasClass('ChartToolTopWrap') || $this.hasClass('PieChartCanvas') || $this.hasClass('FunnelChartCanvas')) {
                var DragData = that.opt.DragDoneCallBack({ 'type': 'Fields', 'operate': 'Add' });
                //$.extend(that.ReportWidget, DragData);
                that.doRetData(DragData);
                that.analysData('Fields', $this);
            }
            that.drawChart();
        },
        doRetData: function (data) {
            if (data === void 0) return;
            var that = this;
            var Cates = data.Categories;
            $.extend(that.ReportWidget, data);
            if (Cates) {
                if (typeof Cates[0] === "object") {
                    that.ReportWidget.Categories = [];
                }
                for (var k = 0; k < Cates.length; k++) {
                    var item = Cates[k];
                    if (item && item['key'] && item['value']) {
                        that.ReportWidget.Categories.push(item["value"]);
                        that.ReportWidget.CateCodes[item["value"]] = item["key"];
                    }
                    else {
                        break;
                    }
                }
            }
        },
        bind: function () {
            var that = this;
            that.Wrap.on('click', '.SeriesLi', function () {
                that.TimeOut && window.clearTimeout(that.TimeOut);
                that.TimeOut = null;
                var cItem = $($(this).find('i')[0]);
                var isGray = cItem.attr('data-gray');
                var text = $(this).text();
                if (isGray === '1') {
                    cItem.css('background-color', cItem.attr('data-c'));
                    $(this).css("color", "#333");
                    that.ReportWidget.IgnoreSeries.splice(that.ReportWidget.IgnoreSeries.indexOf(text), 1);
                } else {
                    cItem.css('background-color', "#aaa");
                    $(this).css("color", "#aaa");
                    that.ReportWidget.IgnoreSeries.push(text);
                }
                cItem.attr('data-gray', isGray === "1" ? '0' : '1');
                that.TimeOut = window.setTimeout(function () { that.drawChart.call(that); }, 400);

                return false;
            });

            if (isMobile()) {
                that.SeriesUL.find(".SeriesLi").each(function () {
                    $(this).tabM(function (e) {
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;
                        var tar = $(e.target);

                        var cItem, text, cLi;
                        if (tar.hasClass('SeriesLi')) {
                            cItem = $(tar.find('i')[0]);
                            cLi = tar;
                            text = tar.text();
                        } else {
                            cItem = tar;
                            cLi = tar.parent('.SeriesLi');
                            text = cLi.text();
                        }

                        var isGray = cItem.attr('data-gray');
                        if (isGray === '1') {
                            cItem.css('background-color', cItem.attr('data-c'));
                            cLi.css("color", "#333");
                            that.ReportWidget.IgnoreSeries.splice(that.ReportWidget.IgnoreSeries.indexOf(text), 1);
                        } else {
                            cItem.css('background-color', "#aaa");
                            cLi.css("color", "#aaa");
                            that.ReportWidget.IgnoreSeries.push(text);
                        }
                        cItem.attr('data-gray', isGray === "1" ? '0' : '1');
                        that.TimeOut = window.setTimeout(function () { that.drawChart.call(that); }, 600);
                    })
                });
            } else {

            }
        },
        fillText: function () {
            var that = this;
            var colorLen = that.opt.Colors.length;
            //if (that.opt.ShowSeries) {
            if ($.isArray(that.ReportWidget.Series) && that.ReportWidget.Series.length > 0) {

                that.Series.children('span:eq(0)').remove();
                var $wrap = $("<div id='wrapUl0' class='wrapUl'>");

                that.SeriesUL.append($wrap);
                $.each(that.ReportWidget.Series, function (index, val) {
                    if (index % 10 == 0 && index != 0) {
                        $wrap = $("<div id='wrapUl" + index / 10 + "' class='wrapUl'>").appendTo(that.SeriesUL);
                        that.IsMobile && $wrap.hide();
                    }
                    $wrap.append('<span class="SeriesLi"><i data-c="' + that.opt.Colors[index % colorLen] + '" data-gray="0" style="background-color:' + that.opt.Colors[index % colorLen] + '"></i>' + val['Name'] + '</span>');
                });

            } else if (that.opt.setCfg) {
                that.Series.prepend('<span style="color:#929292;">将字段拖到此处创建系列</span>');
            }
            //}

            if (that.opt.setCfg === true) {
                if ($.isArray(that.ReportWidget.Categories) && that.ReportWidget.Categories.length > 0) {
                    //根据设置的width值进行计算
                    var len = that.ReportWidget.Categories.length,
                        perWidth = that.opt.Width / len;

                    $.each(that.ReportWidget.Categories, function (index, item) {
                        var sp = $('<span class="BaseChartCateItem"></span>');
                        sp.text(item);
                        sp.css({
                            'margin-left': 15,
                            //width: perWidth
                        });
                        that.Categories.append(sp);
                    });
                } else {
                    if (that.opt.ChartType == WidgetType.Pie || that.opt.ChartType == WidgetType.Funnel) {
                        that.Categories.hide();
                    } else if (that.opt.setCfg) {
                        that.Categories.append('<span style="color:#929292;">将字段拖到此处创建分类</span>');
                    }
                }
            } else {
                that.Categories.hide();
            }

            var height = that.SeriesUL.height();
            if ((!that.opt.setCfg && height > 30) || (!!that.opt.setCfg && height > 50)) {
                //console.log('大于');
                this.Up.show();
                that.Wrap.on('click', '.bar_all', function (event) {
                    event.preventDefault();
                    var type = $(this).attr('data-type');
                    switch (type) {
                        case 'show': {
                            $(this).attr('data-type', 'hide');
                            $(this).removeClass("bar_all_up").addClass("bar_all_down");
                            that.SeriesUL.css({ top: 30 - height });
                            that.SeriesUL.css("z-index", 11000);
                        } break;
                        case 'hide': {
                            $(this).attr('data-type', 'show');
                            $(this).removeClass("bar_all_down").addClass("bar_all_up");
                            that.SeriesUL.css({ top: 0 });
                            that.SeriesUL.css("z-index", 0);
                        } break;
                        case 'left': {
                            that.ReportWidget.SeriesIndex--;
                            that.ReportWidget.SeriesIndex == 0 && $(this).hide();
                            that.SeriesRight.show();
                            that.drawChart.call(that);
                            that.SeriesUL.find(".wrapUl").hide().end().find("#wrapUl" + that.ReportWidget.SeriesIndex).show();
                            height = that.SeriesUL.height();
                            height <= 30 ? (that.SeriesUL.find(".bar-animate").hide()) : (that.SeriesUL.find(".bar-animate").show());
                            that.SeriesUL.css({ top: 30 - height });
                        } break;
                        case 'right': {
                            that.ReportWidget.SeriesIndex++;
                            that.ReportWidget.SeriesIndex == that.ReportWidget.SeriesCount - 1 && $(this).hide();
                            that.SeriesLeft.show();
                            that.drawChart.call(that);
                            that.SeriesUL.find(".wrapUl").hide().end().find("#wrapUl" + that.ReportWidget.SeriesIndex).show();
                            height = that.SeriesUL.height();
                            height <= 30 ? (that.SeriesUL.find(".bar-animate").hide()) : (that.SeriesUL.find(".bar-animate").show());
                            that.SeriesUL.css({ top: 30 - height });
                        } break;
                    }
                    return false;
                });
            }
        },
        ForMatData: function () { //格式化数据
            var forData = [];
            this.DisplayData.Max = 0;
            this.DisplayData.Colors = [];
            this.DisplayData.Series = [];
            this.DisplayData.FullMode = this.ReportWidget.ShowSeries;
            this.DisplayData.Categories = this.ReportWidget.Categories;
            this.DisplayData.CateCodes = this.ReportWidget.CateCodes;
            var seCount = this.ReportWidget.Series.length;
            if (seCount > 0) {
                this.DisplayData.CateLength = this.ReportWidget.Series[0].Data.length;
            }

            var startIndex = 0, endIndex = seCount;

            this.IsMobile && (startIndex = this.ReportWidget.SeriesIndex * 10,
                               endIndex = (Math.ceil(seCount / 10) - 1) > this.ReportWidget.SeriesIndex ? (this.ReportWidget.SeriesIndex + 1) * 10 : seCount);

            if (this.ReportWidget.IgnoreSeries.length > 0) {
                for (var j = startIndex; j < endIndex; j++) {
                    var kk = this.ReportWidget.Series[j];
                    if (this.ReportWidget.IgnoreSeries.indexOf(String(kk['Name'])) < 0) {
                        this.DisplayData.Series.push(kk);
                        this.DisplayData.Colors.push(this.ReportWidget.SeriesColor[j % colorLen]);
                    }
                }
            } else {
                if (this.IsMobile) {
                    for (var j = startIndex; j < endIndex; j++) {
                        this.DisplayData.Series.push(this.ReportWidget.Series[j]);
                        this.DisplayData.Colors.push(this.ReportWidget.SeriesColor[j % colorLen]);
                    }
                } else {
                    this.DisplayData.Series = this.ReportWidget.Series;
                    this.DisplayData.Colors = this.ReportWidget.SeriesColor;
                }
            }

            for (var i = 0, len = this.DisplayData.Series.length; i < len; i++) {
                if (this.DisplayData.Series[i].Data == void 0 || this.DisplayData.Series[i].Data.length == 0) return false;
                var Max = this.DisplayData.Series[i].Data ? Math.max.apply(null, this.DisplayData.Series[i].Data) : 0;
                var Min = this.DisplayData.Series[i].Data ? Math.min.apply(null, this.DisplayData.Series[i].Data) : 0;

                if ($.isNumeric(Max)) {
                    this.DisplayData.Max = Math.max(this.DisplayData.Max, Max);
                    this.DisplayData.Min = Math.min(this.DisplayData.Min, Min);
                } else {
                    //this.opt.DragDoneCallBack({ 'type': 'Error', 'Mess': '数据格式错误!' });
                    alert("数据格式错误!");
                    return false;
                }
            }

            if (this.DisplayData.Series.length > 0 && this.DisplayData.Min <= 0) {
                if (this.DisplayData.Min <= 0) {
                    this.DisplayData.Min -= Math.abs(this.DisplayData.Min) / 10;
                } else {
                    this.DisplayData.Min = 0;
                }
            }
            return true;
        },
        //ShowCategories: function () {
        //    var that = this;
        //    that.Categories.show();
        //    that.DragPlaceHeight = 100;
        //    that.DisplayData.Height = that.opt.ShowTitle ? that.opt.Height - that.TitleHeight - that.DragPlaceHeight : that.opt.Height - that.DragPlaceHeight;
        //},
        //HideCategories: function () {
        //    var that = this;
        //    if (that.ReportWidget.Categories && that.DisplayData.Categories.length > 0 && that.ReportWidget.Series && that.ReportWidget.Series.length > 0 && that.ReportWidget.Series[0].Data && that.ReportWidget.Series[0].Data.length > 0) {
        //        that.Categories.hide();
        //        that.DragPlaceHeight = 50;
        //        that.DisplayData.Height = that.opt.ShowTitle ? that.opt.Height - that.TitleHeight - that.DragPlaceHeight : that.opt.Height - that.DragPlaceHeight;
        //    }
        //},
        drawDefaultChart: function () {
            this.DisplayData.Max = 90;
            this.DisplayData.Min = 10;
            this.DisplayData.CateLength = 3;
            this.DisplayData.Categories = ['分类1', '分类2', '分类3'];
            this.DisplayData.CateCodes = {};
            this.DisplayData.FullMode = true;
            this.DisplayData.Colors = ['#69A8E8', '#82B986', '#F4D67C', '#F07F77', '#F5769D', '#6BD6E9', '#F2D39E', '#C6ABF2'];
            this.DisplayData.Series = [{ 'Name': '系列1', 'Data': [90, 10, 71] }, { 'Name': '系列2', 'Data': [70, 50, 90] }, { 'Name': '系列3', 'Data': [46, 88, 28] }];
            if (this.opt.ChartType == WidgetType.Radar) {
                this.DisplayData.Categories = ['类别1', '类别2', '类别3', '类别4', '类别5', '类别6', '类别7'];
                this.DisplayData.CateLength = 7;
                this.DisplayData.Series = [{
                    'Name': '系列1',
                    'Data': [90, 20, 60, 40, 80, 66, 45]
                }, {
                    'Name': '系列2',
                    'Data': [40, 80, 55, 76, 33, 45, 78]
                }, {
                    'Name': '系列3',
                    'Data': [10, 24, 33, 54, 58, 45, 66]
                }];
            } else if (this.opt.ChartType == WidgetType.Funnel) {
                this.DisplayData.Categories = ['分类1'];
                this.DisplayData.CateLength = 1;
                this.DisplayData.Series = [{
                    'Name': '系列1',
                    'Data': [10]
                }, {
                    'Name': '系列2',
                    'Data': [20]
                }, {
                    'Name': '系列3',
                    'Data': [40]
                }, {
                    'Name': '系列4',
                    'Data': [66]
                }, {
                    'Name': '系列5',
                    'Data': [75]
                }, {
                    'Name': '系列6',
                    'Data': [90]
                }];
            }
        },
        //用于数据拖拽完成后显示图表
        drawChart: function () {

            var that = this;
            //if (!$.isArray(that.ReportWidget.Categories)) {
            that.doRetData(that.ReportWidget);
            //}

            //that.HideCategories();
            if (that.ReportWidget.Categories && that.ReportWidget.Categories.length > 0 && that.ReportWidget.Series && that.ReportWidget.Series.length > 0 && that.ReportWidget.Series[0].Data) {
                var bool = that.ForMatData();
                bool === false && that.drawDefaultChart();
            } else {
                this.drawDefaultChart();
                console.log('显示默认图表');
            }

            that.ReportWidget.ShowDemo ? that.DemoText.show() : that.DemoText.hide();

            var ChartFun = null;
            switch (that.opt.ChartType) {
                case WidgetType.Line: //折线图
                    {
                        ChartFun = that.Chart.Chart().Line;
                        //that.Charting ? that.Charting.Refresh(that.DisplayData) : that.Charting = that.Chart.Chart().Line(that.DisplayData);
                    }
                    break;
                case WidgetType.Bar: //柱状图
                    {
                        ChartFun = that.Chart.Chart().Bar;
                    }
                    break;
                case WidgetType.Pie: //饼图
                    {
                        ChartFun = that.Chart.Chart().Pie;
                    }
                    break;
                case WidgetType.Radar: //雷达图
                    {
                        ChartFun = that.Chart.Chart().Radar;
                    }
                    break;
                case WidgetType.Funnel: //漏斗图
                    {
                        ChartFun = that.Chart.Chart().Funnel;
                    }
                    break;
            }
            if (that.Charting) {
                that.Charting.Refresh(that.DisplayData);
                delete that.Charting;
                //return;
            }
            that.Charting = ChartFun(that.DisplayData);
        },
        analysData: function (type, target) {
            var that = this;
            var colorLen = that.opt.Colors.length;
            switch (type) {
                case 'Series':
                    {
                        if ($.isArray(that.ReportWidget.Series) && that.ReportWidget.Series.length > 0) {

                            var Legend = $('<div class="BaseChartLengend"></div>');
                            var ul = $('<div class="SeriesUL"></div>');
                            $.each(that.ReportWidget.Series, function (index, val) {
                                ul.append('<span class="SeriesLi"><i data-c="' + that.opt.Colors[index % colorLen] + '" data-gray="0" style="background-color:' + that.opt.Colors[index % colorLen] + '"></i>' + val['Name'] + '</span>');
                            });
                            Legend.append(ul);
                            target.append(Legend);
                            //target.append('<a class="bar_close" data-f="Series">×</a>');
                            console.log('系列已配置');
                        }
                    }
                    break;
                case 'Categories':
                    {
                        if ($.isArray(that.ReportWidget.Categories) && that.ReportWidget.Categories.length > 0) {
                            //根据设置的width值进行计算
                            var $this = target;
                            var len = that.ReportWidget.Categories.length,
                                perWidth = that.opt.Width / len;

                            $.each(that.ReportWidget.Categories, function (index, item) {
                                var sp = $('<span class="BaseChartCateItem"></span>');
                                sp.text(item);
                                sp.css({
                                    'margin-left': 15,
                                    //width: perWidth
                                });
                                $this.append(sp);
                            });

                            console.log('类别已配置');
                        }
                    }
                    break;
                case 'Fields':
                    {
                        that.FieldSet.html('');
                        if ($.isArray(that.ReportWidget.Fields) && that.ReportWidget.Fields.length > 0) {
                            $.each(that.ReportWidget.Fields, function (index, val) {
                                that.FieldSet.append('<span class="fieldItem">' + val.DisplayName + '<i class="fieldDel" data-f="' + val.Code + '">X</i></span>');
                            });
                            console.log('字段已配置');
                        }
                        if ($.isArray(that.ReportWidget.Series) && that.ReportWidget.Series.length > 0) {
                            that.Series.html("");
                            var Legend = $('<div class="BaseChartLengend"></div>');
                            var ul = $('<div class="SeriesUL"></div>');
                            $.each(that.ReportWidget.Series, function (index, val) {
                                ul.append('<span class="SeriesLi"><i data-c="' + that.opt.Colors[index % colorLen] + '" data-gray="0" style="background-color:' + that.opt.Colors[index % colorLen] + '"></i>' + val['Name'] + '</span>');
                            });
                            Legend.append(ul);
                            that.Series.append(Legend);
                            //that.Series.append('<a class="bar_close" data-f="Series">×</a>');
                        }
                        // that.ReportWidget.Data = that.DragData.Data;
                    };
            }
        },
        drawLegend: function () {
            var that = this;
            var colorLen = that.opt.Colors.length;
            if ($.isArray(that.ReportWidget.Series) && that.ReportWidget.Series.length > 0 && that.opt.ShowSeries) {


                that.SeriesUL.parent().siblings('span').remove();
                that.SeriesUL.html("");
                $.each(that.ReportWidget.Series, function (index, val) {
                    that.SeriesUL.append('<span class="SeriesLi"><i data-c="' + that.opt.Colors[index % colorLen] + '" data-gray="0" style="background-color:' + that.opt.Colors[index % colorLen] + '"></i>' + val['Name'] + '</span>');
                });
                console.log('系列已配置');
            }

            if ($.isArray(that.ReportWidget.Categories) && that.ReportWidget.Categories.length > 0) {
                //根据设置的width值进行计算
                that.Categories.html("");
                var len = that.ReportWidget.Categories.length,
                    perWidth = that.opt.Width / len;

                $.each(that.ReportWidget.Categories, function (index, item) {
                    var sp = $('<span class="BaseChartCateItem"></span>');
                    sp.text(item);
                    sp.css({
                        'margin-left': 15,
                        //width: perWidth
                    });
                    that.Categories.append(sp);
                });

                console.log('类别已配置');
            }
        },
        clear: function () {
            var that = this;
            $(document).unbind("mousemove.chartbase");
            that.DisplayData = null;
        }
    };

    $.fn.ChartBase = function (opt) {
        return new ChartBase(opt, this);
        //var that = this;
        //var args = Array.prototype.slice.call(arguments, 1);
        //$(that).each(function () {
        //    var $this = $(this);
        //    var ChartObject = $this.data("ChartObject");
        //    ChartObject && delete ChartObject;
        //    $(this).data("ChartObject", new ChartBase(opt, that));
        //})
        //return $(that);
    }

    function isMobile() {
        if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
            return true;
        }
        return false;
    }

    $.fn.tabM = function (fn) {
        this[0].addEventListener('touchstart', function (e) {
            $(this).data('start', e);
            $(this).data('end', null);
        }, false);

        this[0].addEventListener('touchmove', function (e) {
            $(this).data('end', e);
        }, false);

        this[0].addEventListener('touchend', function (event) {
            var s = $(this).data('start');
            var se = s.touches[0];
            var e = $(this).data('end');
            var ee = e && e.touches[0];
            if (se) {
                var tar = se.target.tagName.toUpperCase();
                if (tar !== 'SPAN' && tar !== 'I') {
                    return;
                }
                if (ee) {
                    if (Math.abs(se.pageX - ee.pageX) < 10 && Math.abs(se.pageY - ee.pageY) < 10) {
                        fn && fn(se);
                        event.preventDefault(); event.stopPropagation();
                    }
                } else {
                    fn && fn(se);
                    event.preventDefault(); event.stopPropagation();
                }
            }
        })
    }
}(jQuery));
