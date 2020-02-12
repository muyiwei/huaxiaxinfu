(function ($) {
    
    function Chart(target) {
        var IsMobile = isMobile();
        //饼图
        this.Pie = function (opt) {
            opt = $.extend({}, DefaultOPT, opt);
            opt.IsMobile = IsMobile;
            return new Pie(opt, target);
        }
        //折线图
        this.Line = function (opt) {
            opt = $.extend({}, DefaultOPT, opt);
            opt.IsMobile = IsMobile;
            return new Line(opt, target);
        }
        //雷达图
        this.Radar = function (opt) {
            opt = $.extend({}, DefaultOPT, opt);
            opt.IsMobile = IsMobile;
            return new Radar(opt, target);
        }
        //漏斗图
        this.Funnel = function (opt) {
            opt = $.extend({}, DefaultOPT, opt);
            opt.IsMobile = IsMobile;
            //opt.ShowType = 1;//1：显示有折角漏斗图，2：显示无折角漏斗图
            return new Funnel(opt, target);
        }
        //柱状图
        this.Bar = function (opt) {
            opt = $.extend({}, DefaultOPT, opt);
            opt.IsMobile = IsMobile;
            return new Bar(opt, target);
        }
    }

    var DefaultOPT = {
        ShowDownLoad: false
    }
    const HideSec = 4000;
    //饼图
    var Pie = function (opt, target) {
        this.opt = $.extend({}, opt);
        this.outer = target || $('body');
        this.outer.html("");
        this.wrap = $('<div class="PieChartWrap"></div>');

        this.opt.Width = bitwise(this.opt.Width);
        this.opt.Height = bitwise(this.opt.Height);
        this.wrap.css({
            width: this.opt.Width,
            height: this.opt.Height
        });
        this.ToolTip = $('<div class="ChartToolTip"><div class="TipName"></div><div class="TipData"></div></div>');
        this.TipName = this.ToolTip.find('.TipName');
        this.TipData = this.ToolTip.find('.TipData');
        this.ToolTipWrap = $('<div class="ChartToolTopWrap"></div>').append(this.ToolTip);
        this.ColorLen = this.opt.Colors.length;
        this.OriWidth = this.opt.Width;

        this.init();
    }
    Pie.prototype = {
        init: function () {
            if (this.opt.Width == 0 || this.opt.Height == 0)
                return;
            this.canvasF = document.createElement('canvas');
            if (!this.canvasF.getContext) {
                return;
            }
            this.cxtF = this.canvasF.getContext('2d');
            this.cacheF = document.createElement('canvas');
            this.cacheCxt = this.cacheF.getContext('2d');
            this.canvasF.className = 'PieChartCanvas';

            this.wrap.append(this.canvasF).append(this.ToolTipWrap).appendTo(this.outer);
            showDownload(this);

            this.canW = document.createElement('canvas');
            this.cxtW = this.canW.getContext('2d');
            this.canW.className = 'PieChartCanvas';
            this.wrap.append(this.canW);


            this.sizePerc = this.opt.FullMode ? 60 : 85; // 饼图所占画布百分比大小

            this.borderWidth = 1; // 边框宽度
            this.borderStyle = "#fff"; // 边框颜色
            this.gradientColour = "#ddd"; // 边框渐变尾色
            this.maxPullOutDist = 10; //点击偏离圆心距离 
            this.pullOutLabelFont = "bold 12px 'Microsoft YaHei'"; // 描述字体
            this.fontzie = 12;
            this.chartStartAngle = -.5 * Math.PI; // 起始角度为12点钟方向
            this.PerCent = this.chartStartAngle;
            this.curSlice = -1; // 偏移量的索引值，默认为-1没有偏移量
            this.chartData = []; // 饼图数据
            this.chartColors = this.opt.Colors; // 饼图颜色
            this.totalValue = 0; // 饼图数据总值
            this.canvasWidth = this.opt.Width; // 画布宽度
            this.canvasHeight = this.opt.Height; // 画布高度
            this.centreX = bitwise(this.canvasWidth / 2); // 画布中心位置X
            this.centreY = bitwise(this.canvasHeight / 2); // 画布中心位置Y
            this.chartRadius = bitwise(Math.min(this.canvasWidth, this.canvasHeight) * this.sizePerc / 100 / 2); // 饼图半径
            this.whiteSpace = { top: this.centreY - this.chartRadius, left: this.centreX - this.chartRadius }

            this.progress = 0;
            this.formatData();

            this.opt.Width += this.Direction.L + this.Direction.R;
            this.opt.Height += this.Direction.T + this.Direction.B;
            this.canvasF.style.left = -this.Direction.L + "px";
            this.canvasF.style.top = -this.Direction.T + "px";

            this.canvasF.width = this.opt.Width;
            this.canvasF.height = this.opt.Height;
            this.canW.width = this.opt.Width;
            this.canW.height = this.opt.Height;
            this.scaleWidth = this.opt.Width;
            this.scaleHeight = this.opt.Height;

            if (window.devicePixelRatio) {
                this.scaleWidth = this.opt.Width * window.devicePixelRatio;
                this.scaleHeight = this.opt.Height * window.devicePixelRatio;
                this.canW.style.width = this.cacheF.style.width = this.canvasF.style.width = this.opt.Width + "px";
                this.canW.style.height = this.cacheF.style.height = this.canvasF.style.height = this.opt.Height + "px";
                this.canW.height = this.cacheF.height = this.canvasF.height = this.scaleHeight;
                this.canW.width = this.cacheF.width = this.canvasF.width = this.scaleWidth;
                this.cxtF.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cxtW.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cacheCxt.scale(window.devicePixelRatio, window.devicePixelRatio);
            }

            this.draw();
            this.bind();
        },
        formatData: function () {
            var that = this;
            $.each(that.opt.Series, function (index, item) {
                //增加多条数据循环遍历处理
                that.chartData[index] = {};
                that.chartData[index]['value'] = parseFloat(item.Data[0]);
                that.chartData[index]['discri'] = item.Name;
                that.totalValue += parseFloat(item.Data[0]) - (that.opt.Min < 0 ? that.opt.Min : 0);
                var cate = that.opt.Categories[0];
                that.chartData[index]['Category'] = cate;
                that.chartData[index]['OriginalData'] = item.Data[0];
                that.chartData[index]['SeriesCode'] = item.Code;
                cate && (that.chartData[index]['CateCode'] = that.opt.CateCodes[cate]);
            });

            var currentPos = 0;
            for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                var point = that.chartData[slice];
                var val = that.opt.Min < 0 ? point['value'] - that.opt.Min : point['value'];
                point['startAngle'] = 2 * Math.PI * currentPos;
                point['endAngle'] = 2 * Math.PI * (currentPos + (val / that.totalValue));
                point['midAngle'] = (point['startAngle'] + point['endAngle']) / 2 + that.chartStartAngle;
                currentPos += val / that.totalValue;

                point['width'] = bitwise(Math.max(String(point['value']).length + 5, String(point['discri']).length) * 13);

                //格式化数据
                point['align'] = that.getAlign(point['midAngle']);
                var offPoint = {
                    x: Math.cos(point['midAngle']),
                    y: Math.sin(point['midAngle'])
                }
                point['sPoint'] = {
                    x: bitwise(that.centreX + offPoint.x * (that.chartRadius)),
                        y: bitwise(that.centreY + offPoint.y * (that.chartRadius))
                }
                point['mPoint'] = {
                    x: bitwise(that.centreX + offPoint.x * (that.chartRadius + that.maxPullOutDist)),
                        y: bitwise(that.centreY + offPoint.y * (that.chartRadius + that.maxPullOutDist))
                }
                var hPadding;
                if (point['align'] == 'left') {
                    hPadding = 10;
                } else {
                    hPadding = -10;
                }

                point['ePoint'] = {
                    x: bitwise(that.centreX + offPoint.x * (that.chartRadius + that.maxPullOutDist) + hPadding),
                        y: bitwise(that.centreY + offPoint.y * (that.chartRadius + that.maxPullOutDist))
                }
            }
            // 防止文本重叠(判断终点y坐标之间的距离，若距离小于30，则其中一个X坐标平移)
            var arr = [];
            that.location();
        },
        location: function () {
            //将值分为四个象限分别处理，一三象限逆时针方向绘制，二四象限顺时针方向处理
            var that = this,
                MinHeight = 16;

            if (that.chartData.length === 1) {
                that.chartData[0]['align'] = "right";
            };

            var Direction = { L: 0, T: 0, R: 0, B: 0 };
            var Quadrants = { first: [], sec: [], third: [], fou: []};
            for (var i = 0, len = that.chartData.length; i < len; i++) {
                var point = that.chartData[i];
                point.index = i;
                if (point.align == 'left') { //一，四象限
                    Direction.R = Math.max(Direction.R, (point["discri"].length + 6) * that.fontzie + point["ePoint"].x);
                    if (point.midAngle >= 0 && point.midAngle <= Math.PI / 2) {
                        Quadrants.fou.push(point);
                        continue;
                    }
                    Quadrants.first.push(point);
                    continue;
                } else {//二，三象限
                    Direction.L = Math.min(Direction.L, point["ePoint"].x - (point["discri"].length + 6) * that.fontzie);
                    if (point.midAngle >= Math.PI / 2 && point.midAngle <= Math.PI) {
                        Quadrants.third.push(point);
                        continue;
                    }
                    Quadrants.sec.push(point);
                    continue;
                }
            }
            //console.log("l:" + Direction.L + " ,r:" + Direction.R);
            //左右留白
            Direction.R = Direction.R - that.opt.Width;
            Direction.R = Direction.R > 0 ? parseInt(Direction.R) : 0;
            Direction.L = Direction.L > 0 ? 0 : Math.abs(parseInt(Direction.L));

            //计算上下距离
            Quadrants.first.reverse();
            Quadrants.third.reverse();
            for (var k in Quadrants) {
                if (Quadrants.hasOwnProperty(k)) {

                    var quadrant = Quadrants[k];
                    //格式化数据
                    for (var j = 1, l = quadrant.length; j < l; j++) {
                        var curPoint = quadrant[j];
                        var lastPoint = quadrant[j - 1];
                        var h = Math.abs(curPoint['ePoint'].y - lastPoint['ePoint'].y);
                        if (h < MinHeight) {
                            switch (k) {
                                case "first":
                                case "sec":
                                    {
                                        curPoint.ePoint.y = lastPoint['ePoint'].y - MinHeight;
                                        j == l - 1 && (Direction.T = Math.min(curPoint.ePoint.y - 2*that.fontzie, Direction.T));
                                    }
                                    break;
                                case "third":
                                case "fou":
                                    {
                                        curPoint.ePoint.y = lastPoint['ePoint'].y + MinHeight;
                                        j == l - 1 && (Direction.B = Math.max(curPoint.ePoint.y + 2 * that.fontzie, Direction.B));
                                    }
                                    break;
                            }
                        } else {
                            switch (k) {
                                case "first":
                                case "sec":
                                    {
                                        if (curPoint['ePoint'].y > lastPoint['ePoint'].y) {
                                            curPoint.ePoint.y = lastPoint['ePoint'].y - MinHeight;
                                        }
                                        j == l - 1 && (Direction.T = Math.min(curPoint.ePoint.y - 2 * that.fontzie, Direction.T));
                                    }
                                    break;
                                case "third":
                                case "fou":
                                    {
                                        if (curPoint['ePoint'].y < lastPoint['ePoint'].y) {
                                            curPoint.ePoint.y = lastPoint['ePoint'].y + MinHeight;
                                        }
                                        j == l - 1 && (Direction.B = Math.max(curPoint.ePoint.y + 2 * that.fontzie, Direction.B));
                                    }
                                    break;
                            }
                        }
                    }
                }
            }

            Direction.T = Direction.T > 0 ? 0 : Math.abs(parseInt(Direction.T));
            Direction.B = Direction.B - that.opt.Height;
            Direction.B = Direction.B > 0 ? parseInt(Direction.B) : 0;
            that.Direction = Direction;
            console.log(Direction);

            that.Points = Array.prototype.concat.call(Quadrants.first, Quadrants.sec, Quadrants.third, Quadrants.fou);
        },
        draw: function () {
            var that = this;
            //that.cxtW.translate(that.Direction.L, that.Direction.T);
            that.cxtW.fillStyle = "#fff";
            that.cxtW.beginPath();
            that.cxtW.moveTo(that.centreX, that.centreY);
            that.cxtW.arc(that.centreX, that.centreY, that.chartRadius + 1, that.chartStartAngle, that.PerCent, true);
            that.PerCent = that.chartStartAngle + Math.PI * that.progress * 2;
            that.cxtW.fill();

            that.cxtF.save();
            that.cxtF.translate(that.Direction.L, that.Direction.T);
            that.cxtF.strokeStyle = '#fff';
            for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                len === 1 && (that.cxtF.strokeStyle = that.chartColors[slice % that.ColorLen]);
                that.cxtF.beginPath();
                that.cxtF.moveTo(that.centreX, that.centreY);
                that.cxtF.arc(that.centreX, that.centreY, that.chartRadius, that.chartData[slice]['startAngle'] + that.chartStartAngle, that.chartData[slice]['endAngle'] + that.chartStartAngle, false);
                that.cxtF.lineTo(that.centreX, that.centreY);
                that.cxtF.fillStyle = that.chartColors[slice % that.ColorLen];
                that.cxtF.fill();
                that.cxtF.stroke();
                that.cxtF.closePath();
            }
            that.cxtF.restore();
            that.opt.IsMobile && (that.PerCent = 1.5 * Math.PI);
            that.animatePie();
            //console.time("pie");
        },
        animatePie: function () {
            var that = this;
            if (that.PerCent >= 1.5 * Math.PI) {
                that.PerCent = 0;
                //that.cxtW.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                var u = navigator.userAgent;
                if (u.indexOf('Trident') > -1 || u.indexOf('MSIE') > -1) {
                    that.canW.removeNode(true);
                } else {

                    that.canW.remove();
                }
                

                that.opt.FullMode && that.drawSlice();
                //console.timeEnd("pie");
                return;
            }
            that.cxtW.clearRect(that.centreX - that.chartRadius, that.centreY - that.chartRadius, 2 * that.chartRadius, 2 * that.chartRadius);
            that.cxtW.beginPath();
            that.cxtW.moveTo(that.centreX, that.centreY);
            that.cxtW.arc(that.centreX, that.centreY, that.chartRadius + 1, that.chartStartAngle, that.PerCent, true);
            that.cxtW.fill();
            var tip = (102 - that.progress * 100) / 8;
            tip = tip == 0 ? 0.01 : tip / 100;
            that.progress += tip;
            that.PerCent = that.chartStartAngle + Math.PI * that.progress * 2;
            that.AnimationID = requestAnimationFrame(function () { that.animatePie.call(that); });
        },
        drawSlice: function () {
            var that = this;
            that.cxtF.save();
            that.cxtF.translate(that.Direction.L, that.Direction.T);
            that.cxtF.font = that.pullOutLabelFont;
            that.cxtF.textBaseline = "middle";
            for (var i = 0, len = that.Points.length; i < len; i++) {
                //画线
                var point = that.Points[i];
                that.cxtF.fillStyle = that.chartColors[point.index % that.ColorLen];
                var align = point['align'];
                that.cxtF.textAlign = align;

                var pad;
                if (align == 'left') {
                    pad = 2;
                } else {
                    pad = -2;
                }
                that.cxtF.save();
                that.cxtF.strokeStyle = that.chartColors[point.index % that.ColorLen];
                that.cxtF.beginPath();
                var per = (point['value'] - (that.opt.Min < 0 ? that.opt.Min : 0)) / that.totalValue * 100;
                per = isInteger(per) ? per : per.toFixed(2);
                that.cxtF.fillText(point['discri'] + '(' + per + "%)", point['ePoint'].x + pad, point['ePoint'].y);

                that.cxtF.moveTo(point['sPoint'].x, point['sPoint'].y);
                that.cxtF.quadraticCurveTo(point['mPoint'].x, point['mPoint'].y, point['ePoint'].x, point['ePoint'].y);

                that.cxtF.stroke();
                that.cxtF.restore();
            }
            that.cxtF.restore();
            //var rate = window.devicePixelRatio || 1;
            that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
        },
        getClickIndex: function (e) { 
            var that = this;
            var offsetA = $(that.canvasF).offset();
            var mouseX = e.pageX - offsetA.left - that.Direction.L;
            var mouseY = e.pageY - offsetA.top - that.Direction.T;
            var xFromCentre = mouseX - that.centreX;
            var yFromCentre = mouseY - that.centreY;
            var distanceFromCentre = Math.sqrt(Math.pow(Math.abs(xFromCentre), 2) + Math.pow(Math.abs(yFromCentre), 2));
            if (distanceFromCentre <= that.chartRadius) {
                var clickAngle = Math.atan2(yFromCentre, xFromCentre) - that.chartStartAngle;
                if (clickAngle < 0) clickAngle = 2 * Math.PI + clickAngle;
                for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                    if (clickAngle >= that.chartData[slice]['startAngle'] && clickAngle <= that.chartData[slice]['endAngle']) {
                        return slice;
                    }
                }
            }
            return -1;
        },
        bind: function (e) {
            var that = this;
            new slider(that);
            //var rate = window.devicePixelRatio || 1;
            if (!that.opt.IsMobile) {
                that.ToolTipWrap.click(function (e) {
                    var slice = that.getClickIndex.call(that,e);

                    if (slice === -1) {
                        return;
                    }
                    var ret = {
                        'Name': that.chartData[slice]['discri'],
                        'Data': that.chartData[slice]['value'],
                        'Category': that.chartData[slice]['Category'],
                        'SeriesCode': that.chartData[slice]['SeriesCode'],
                        'CateCode': that.chartData[slice]['CateCode']
                    };
                    that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                    return;
                });

                that.ToolTipWrap.mousemove(function (e) {
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    var i = that.getClickIndex(e);
                    if (i === -1) {
                        that.ToolTip.fadeOut(200);
                        return;
                    }
                    var startAngle = that.chartData[i]['startAngle'] + that.chartStartAngle;
                    var endAngle = that.chartData[i]['endAngle'] + that.chartStartAngle;

                    that.cxtF.save();
                    that.cxtF.translate(that.Direction.L, that.Direction.T);
                    that.cxtF.globalAlpha = 0.5;
                    that.cxtF.beginPath();
                    that.cxtF.moveTo(that.centreX, that.centreY);
                    that.cxtF.arc(that.centreX, that.centreY, that.chartRadius + that.maxPullOutDist, startAngle, endAngle, false);
                    // that.cxtF.lineTo(startX, startY);
                    that.cxtF.fillStyle = that.chartColors[i % that.ColorLen];
                    that.cxtF.fill();
                    that.cxtF.restore();

                    var off = $(this).offset();

                    that.TipName.text(that.chartData[i]['discri']);
                    that.TipData.text(that.chartData[i]['Category'] + '：' + that.chartData[i]['OriginalData']);

                    var left = e.pageX - off.left - that.Direction.L,
                        isleft = left < that.OriWidth / 2;
                    that.ToolTip.css({
                        right: isleft ? "auto" : that.OriWidth - left,
                        left: isleft ? left : "auto",
                        top: e.pageY - off.top - 55
                    }).show();
                });

                that.ToolTipWrap.mouseout(function () {
                    that.ToolTip.fadeOut();
                });
            } else if (that.opt.FullMode) {
                that.ToolTip.addClass("ChartToolTipMobile");
                that.ToolTipWrap.tabMobile(function (e) {

                    var i = that.getClickIndex.call(that, e);
                    if (i === -1) {
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;
                        that.ToolTip.hide();
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                        that.cxtF.drawImage(that.cacheF,0, 0, that.opt.Width, that.opt.Height);
                        return;
                    }

                    that.TimeOut && window.clearTimeout(that.TimeOut);
                    that.TimeOut = null;
                    that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    var startAngle = that.chartData[i]['startAngle'] + that.chartStartAngle;
                    var endAngle = that.chartData[i]['endAngle'] + that.chartStartAngle;

                    that.cxtF.save();
                    that.cxtF.translate(that.Direction.L, that.Direction.T);
                    that.cxtF.globalAlpha = 0.5;
                    that.cxtF.beginPath();
                    that.cxtF.moveTo(that.centreX, that.centreY);
                    that.cxtF.arc(that.centreX, that.centreY, that.chartRadius + that.maxPullOutDist, startAngle, endAngle, false);
                    that.cxtF.fillStyle = that.chartColors[i % that.ColorLen];
                    that.cxtF.fill();
                    that.cxtF.restore();

                    var off = $(that.canvasF).offset();

                    that.TipName.text(that.chartData[i]['discri']);
                    that.TipData.text(that.chartData[i]['Category'] + '：' + that.chartData[i]['OriginalData']);

                    var left = e.pageX - off.left - that.Direction.L,
                        isleft = left < that.OriWidth / 2;
                    that.ToolTip.css({
                        right: isleft ? "auto" : that.OriWidth - left,
                        left: isleft ? left : "auto",
                        top: e.pageY - off.top - 55
                    }).show();

                    that.TimeOut = window.setTimeout(function () {
                        that.TimeOut = null;
                        that.ToolTip.hide();
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    }, HideSec);

                    var ret = {
                        'Name': that.chartData[i]['discri'],
                        'Data': that.chartData[i]['value'],
                        'Category': that.chartData[i]['Category'],
                        'SeriesCode': that.chartData[i]['SeriesCode'],
                        'CateCode': that.chartData[i]['CateCode']
                    };
                    that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                });
            }
        },
        getAlign: function (angel) {
            // angel -= this.chartStartAngle;
            // console.log(angel)
            var per = Math.PI / 2;
            if (angel > per * 3 || angel < per) {
                return 'left';
            } else if (angel > per && angel < per * 3) {
                return 'right';
            }
        },
        Refresh: function (data) {
            var that = this;
            that.AnimationID && window.cancelAnimationFrame(that.AnimationID);
        }
    }
    //折线图
    var Line = function (opt, target) {
        this.opt = opt || {};
        this.opt.CateLength = this.opt.Categories ? this.opt.Categories.length : 0;
        this.outer = target || $('body');
        this.outer.html("");
        this.wrap = $('<div class="LineChartWrap"></div>');
        this.wrap.css({
            width: this.opt.Width,
            height: this.opt.Height
        });
        this.padding = 12; //右偏移量
        this.paddingL = 60;
        this.CanWidth = this.opt.Width - 2 * this.padding;
        this.progress = 0;

        this.ToolTip = $('<div class="ChartToolTip"><div class="TipName"></div><div class="TipData"></div></div>');
        this.TipName = this.ToolTip.find('.TipName');
        this.TipData = this.ToolTip.find('.TipData');
        this.ToolTipWrap = $('<div class="ChartToolTopWrap"></div>').append(this.ToolTip);
        this.img = 0;
        this.radius = 8;
        this.LineWidth = this.opt.IsMobile ? 2 : 2;
        this.CircleRadiu = this.opt.IsMobile ? 3 : 3;
        this.fontSize = 12;
        this.ColorLen = this.opt.Colors.length;
        //折线图横坐标最小刻度  目前只针对移动端
        this.minPerWidth = 40;

        this.showIndex = 0;
        this.showLength = this.opt.CateLength;
        var perW = this.opt.Width / this.showLength;

        while (this.minPerWidth > perW) {
            perW = this.opt.Width / --this.showLength;
        }

        this.range = this.opt.CateLength - this.showLength;
        this.HasBind = false;

        //if (this.opt.IsMobile) {
        //    var k = this.opt.Width / this.opt.Categories.length ;
        //    if (k < this.minPerWidth) {
        //        this.opt.Width = this.minPerWidth * this.opt.Categories.length + 2 * this.padding;
        //    }
        //}

        this.init();
    }
    Line.prototype = {
        init: function () {
            if (this.opt.Width == 0 || this.opt.Height == 0)
                return;
            this.canvasF = document.createElement('canvas');
            this.canvasBack = document.createElement('canvas');
            this.canvasF.className = this.canvasBack.className = 'LineChartCanvas';
            this.cacheF = document.createElement('canvas');

            this.canvasF.width = this.cacheF.width = this.canvasBack.width = this.opt.Width;
            this.canvasF.height = this.cacheF.height = this.canvasBack.height = this.opt.Height;
            this.cxtF = this.canvasF.getContext('2d');
            this.cxtBack = this.canvasBack.getContext("2d");
            this.cacheCxt = this.cacheF.getContext("2d");

            this.scaleWidth = this.opt.Width;
            this.scaleHeight = this.opt.Height;

            if (window.devicePixelRatio) {
                this.scaleWidth = this.opt.Width * window.devicePixelRatio;
                this.scaleHeight = this.opt.Height * window.devicePixelRatio;
                this.canvasF.style.width = this.cacheF.style.width = this.canvasBack.style.width = this.opt.Width + "px";
                this.canvasF.style.height = this.cacheF.style.height = this.canvasBack.style.height = this.opt.Height + "px";
                this.canvasF.height = this.cacheF.height = this.canvasBack.height = this.scaleHeight;
                this.canvasF.width = this.cacheF.width = this.canvasBack.width = this.scaleWidth;
                this.cxtF.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cxtBack.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cacheCxt.scale(window.devicePixelRatio, window.devicePixelRatio);
            }

            if (this.opt.Series.length == 0 || this.opt.Categories.length == 0) return;
            this.wrap.append(this.canvasBack).append(this.canvasF).append(this.ToolTipWrap).appendTo(this.outer);

            drawBackGrid(this);

            if (!this.opt.IsMobile && this.showLength < this.opt.CateLength) {
                this.ScrollStep = this.opt.CateLength - this.showLength + 1;
                this.ScrollWrap = $('<div class="ChartScrollWrap"></div>');
                this.ScrollWrap.css({ "top": this.opt.Height - 4, "left": this.Axis.yLabelWidth }).width(this.opt.Width - this.Axis.yLabelWidth - this.padding);
               
                var t = this.showIndex + this.showLength;
                for (var i = 1; i <= this.ScrollStep; i++) {
                    var ww = (i / this.ScrollStep * 100).toFixed(2) + "%";
                    this.ScrollWrap.append("<i class='BarTip' style='left:" + ww + "' data-text='" + this.opt.Categories[t + i - 2] + "'></i>");
                }

                ww = (1 / this.ScrollStep * 100).toFixed(2) + "%";
                this.ScrollBar = $('<div class="ChartScrollBar"></div>').width(ww).appendTo(this.ScrollWrap);
                this.ScrollIcon = $('<i class="BarIcon1"></i>').css("left", ww).appendTo(this.ScrollWrap);
                this.ScrollWrap.appendTo(this.wrap);
            }

            this.animateData();
            showDownload(this);
        },
        Slider: function () {
            this.cxtF.clearRect(0, 0, this.canvasF.width, this.canvasF.height);
            drawBackGrid(this);
            this.progress = 1;
            this.HasBind = true;
            this.drawLine();
        },
        formatData: function () {
            var that = this;

            that.DrawData = [];
            that.TextPos = [];

            var range = that.showIndex + that.showLength;
            $.each(that.opt.Series, function (index, item) {
                var drawData = [];
                $.each(item.Data, function (i, v) {
                    if (i < that.showIndex || i >= range) return true;
                    var val = parseFloat(v);
                    var aPoint = {};
                    var ind = i - that.showIndex;

                    aPoint.x = bitwise(that.Axis.yLabelWidth + ((ind + 0.5) / that.opt.CateLength) * that.DrawWidth);
                    aPoint.y = (val- that.opt.Min) / (that.opt.Max - that.opt.Min) * that.DrawHeight;
                    aPoint.y = bitwise(that.Axis.endPoint - aPoint.y);
                    aPoint.Name = item.Name;
                    aPoint.Data = val;
                    aPoint.OriginalData = v;
                    aPoint.Category = that.opt.Categories[i];
                    aPoint.SeriesCode = item.Code;
                    aPoint.Category && (aPoint.CateCode = that.opt.CateCodes[aPoint.Category]);

                    drawData.push(aPoint);
                    index === 0 && that.TextPos.push(aPoint.x);
                });
                that.DrawData.push(drawData);
            });

            that.cxtF.font = '12px Microsoft YaHei';
            that.cxtF.lineJoin = 'round';
            that.cxtF.lineWidth = that.LineWidth;
            that.cxtF.fillStyle = "#fff";
        },
        //绘制数据内容
        drawLine: function () {
            var that = this;
            var progressDots = Math.ceil(that.progress * that.opt.CateLength);
            if (progressDots >= that.opt.CateLength + 1) {
                that.cacheCxt.clearRect(0, 0, this.canvasF.width, this.canvasF.height)
                that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
                that.HasBind == false && this.bind();
                //console.timeEnd("line");
                return;
            }
            var progressFragment = (that.progress * that.opt.CateLength) - Math.floor(that.progress * that.opt.CateLength);

            that.cxtF.clearRect(0, 0, this.scaleWidth, this.scaleHeight);
            //画内部多边形
            $.each(that.DrawData, function (j, item) {
                that.cxtF.save();
                //绘制线段
                that.cxtF.strokeStyle = that.opt.Colors[j % that.ColorLen];
                that.cxtF.beginPath();
                //console.log(item.length);
                $.each(item, function (index, point) {
                    if (index <= progressDots) {
                        var px = index === 0 ? item[0].x : item[index - 1].x,
                            py = index === 0 ? item[0].y : item[index - 1].y;

                        var nextX = point.x,
                            nextY = point.y;

                        index === progressDots && (nextX = px + ((nextX - px) * progressFragment), nextY = py + ((nextY - py) * progressFragment));
                        index === 0 ? that.cxtF.moveTo(nextX, nextY) : that.cxtF.lineTo(nextX, nextY);
                    }
                });
                that.cxtF.stroke();

                //画圆点
                $.each(item, function (index, point) {
                    if (index < progressDots) {
                        that.cxtF.beginPath();
                        that.cxtF.arc(point.x, point.y, that.CircleRadiu, 0, Math.PI * 2);
                        that.cxtF.fill();
                        that.cxtF.stroke();
                    }
                });
                that.cxtF.restore();
            });
            var tip = (101 - that.progress * 100) / 10/2;
            tip = tip == 0 ? 0.01 : tip / 100;
            that.progress += tip;

            that.AnimationID = requestAnimationFrame(function () { that.drawLine.call(that); });
        },
        animateData: function () {
            var that = this;
            that.opt.IsMobile ? that.progress = 1 : that.progress = 0;
            //console.log("开始");
            that.drawLine();
            //console.time("line");
        },
        bind: function () {
            var that = this;
            var offset = that.ToolTipWrap.offset();

            if (that.showLength < that.opt.CateLength && that.HasBind == false) {
                new sliderBar(that);
            }

            that.HasBind = true;

            if (!that.opt.IsMobile) {
                that.ToolTipWrap.unbind("mousemove.chart").bind("mousemove.chart", function (e) {
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);

                    var point = {
                        x: e.pageX - offset.left,
                        y: e.pageY - offset.top
                    }

                    var index = Math.floor((point.x - that.Axis.yLabelWidth) / that.Axis.xLabelWidth);
                    if (index < that.opt.CateLength && index > -1) {
                        var tar = { a: 0, p: {}, len: 10000 }
                        $.each(that.DrawData, function (i, item) {
                            var p = item[index];
                            var l = Math.abs(p.y - point.y);
                            if (tar.len > l) {
                                tar.a = i;
                                tar.len = l;
                                tar.p = p;
                            }
                        });
                        that.cxtF.save();
                        //画线
                        that.cxtF.beginPath();
                        var datass = that.DrawData[tar.a];
                        if (datass) {
                            that.cxtF.globalAlpha = 1;
                            that.cxtF.moveTo(datass[0].x, datass[0].y);
                            for (var i = 1, l = datass.length; i < l; i++) {
                                that.cxtF.lineTo(datass[i].x, datass[i].y);
                            }
                            that.cxtF.lineWidth = that.LineWidth + 1;
                            that.cxtF.strokeStyle = that.opt.Colors[tar.a % that.ColorLen];
                            that.cxtF.stroke();
                        }
                        that.cxtF.closePath();

                        that.cxtF.globalAlpha = 0.5;
                        that.cxtF.beginPath();
                        that.cxtF.moveTo(tar.p.x, tar.p.y);
                        that.cxtF.arc(tar.p.x, tar.p.y, that.radius, 0, Math.PI * 2);
                        // that.cxtF.fillText(tar.p.Name + ':' + tar.p.Data, tar.p.x + that.radius, tar.p.y);
                        that.cxtF.fillStyle = that.opt.Colors[tar.a % that.ColorLen];
                        that.cxtF.fill();
                        that.cxtF.restore();

                        that.TipName.text(tar.p.Category);
                        that.TipData.text(tar.p.Name + '：' + tar.p.OriginalData);
                        that.ToolTip.removeAttr('style');
                        if (index >= Math.floor(that.opt.CateLength / 2)) {
                            that.ToolTip.css({
                                left: "auto",
                                right: that.opt.Width - tar.p.x + 10,
                                top: tar.p.y - 20
                            }).show();
                        } else {
                            that.ToolTip.css({
                                left: tar.p.x + 10,
                                right: "auto",
                                top: tar.p.y - 20
                            }).show();
                        }

                    }
                });
                that.ToolTipWrap.unbind("mouseleave.chart").bind("mouseleave.chart", function (e) {
                    that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    that.ToolTip.fadeOut(200);
                });
                that.ToolTipWrap.unbind("click.chart").bind("click.chart",function (e) {
                    doClick(e, this);
                });
            } else if (that.opt.FullMode) {
                new slider(that);

                that.ToolTip.addClass("ChartToolTipMobile");
                that.ToolTipWrap.tabMobile(function (e) {
                    //offset = that.ToolTipWrap.offset();
                    offset = $(that.canvasF).offset();
                    var point = {
                        x: e.pageX - offset.left,
                        y: e.pageY - offset.top
                    }
                    var index = Math.floor((point.x - that.Axis.yLabelWidth) / that.Axis.xLabelWidth);

                    if (index < that.opt.CateLength && index > -1) {
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;

                        var tar = { a: 0, p: {}, len: 10000 }
                        $.each(that.DrawData, function (i, item) {
                            var p = item[index];
                            var l = Math.abs(p.y - point.y);
                            if (tar.len > l) {
                                tar.a = i;
                                tar.len = l;
                                tar.p = p;
                            }
                        });
                        that.cxtF.save();
                        //画线
                        that.cxtF.beginPath();
                        var datass = that.DrawData[tar.a];
                        if (datass) {
                            that.cxtF.globalAlpha = 1;
                            that.cxtF.moveTo(datass[0].x, datass[0].y);
                            for (var i = 1, l = datass.length; i < l; i++) {
                                that.cxtF.lineTo(datass[i].x, datass[i].y);
                            }
                            that.cxtF.lineWidth = that.LineWidth + 1;
                            that.cxtF.strokeStyle = that.opt.Colors[tar.a];
                            that.cxtF.stroke();
                        }
                        that.cxtF.closePath();

                        that.cxtF.globalAlpha = 0.5;
                        that.cxtF.beginPath();
                        that.cxtF.moveTo(tar.p.x, tar.p.y);
                        that.cxtF.arc(tar.p.x, tar.p.y, that.radius, 0, Math.PI * 2);
                        that.cxtF.fillStyle = that.opt.Colors[tar.a % that.ColorLen];
                        that.cxtF.fill();
                        that.cxtF.restore();

                        that.TipName.text(tar.p.Category);
                        that.TipData.text(tar.p.Name + '：' + tar.p.OriginalData);
                        that.ToolTip.removeAttr('style');
                        if (index >= Math.floor(that.opt.CateLength / 2)) {
                            that.ToolTip.css({
                                right: that.opt.Width - tar.p.x + 10,
                                top: tar.p.y - 20
                            }).show();
                        } else {
                            that.ToolTip.css({
                                left: tar.p.x + 10,
                                top: tar.p.y - 20
                            }).show();
                        }

                        that.TimeOut = window.setTimeout(function () {
                            that.TimeOut = null;
                            that.ToolTip.hide();
                            that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                            that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                        }, HideSec);
                    }

                    doClick(e, that.ToolTipWrap[0]);
                })
            }

            function doClick(e, tt) {
                var offset = $(tt).offset();
                var point = {
                    x: e.pageX - offset.left,
                    y: e.pageY - offset.top
                }

                var index = Math.floor((point.x - that.Axis.yLabelWidth) / that.Axis.xLabelWidth);

                if (index < that.opt.CateLength && index > -1) {
                    $.each(that.DrawData, function (i, item) {
                        var p = item[index];
                        var l = Math.sqrt(Math.pow(Math.abs(point.x - p.x), 2) + Math.pow(Math.abs(point.y - p.y), 2));
                        if (l <= that.radius) {
                            var ret = {
                                'Name': p.Name,
                                'Data': p.Data,
                                'Category': p.Category,
                                'SeriesCode': p.SeriesCode,
                                'CateCode': p.CateCode
                            }
                            tar = ret;
                            tar.point = p;
                            tar.index = i;
                            that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                            return false;
                        }
                    });
                }
            }
        },
        unbind: function () {
            var that = this;
            
            if (!that.opt.IsMobile) {
                that.ToolTipWrap.unbind("mousemove.chart");
                that.ToolTipWrap.unbind("mouseleave.chart");
                that.ToolTipWrap.unbind("click.chart");
            }
        },
        Refresh: function (data) {
            var that = this;
            that.AnimationID && window.cancelAnimationFrame(that.AnimationID);
        }
    }
    //柱状图
    var Bar = function (opt, target) {
        this.opt = opt || {};
        this.opt.CateLength = this.opt.Categories ? this.opt.Categories.length : 0;
        this.outer = target || $('body');
        this.outer.html("");
        this.wrap = $('<div class="LineChartWrap"></div>');
        this.wrap.css({
            width: this.opt.Width,
            height: this.opt.Height
        });
        this.padding = 12;
        this.CanWidth = this.opt.Width - 2 * this.padding;
        this.progress = 0;

        this.ToolTip = $('<div class="ChartToolTip"><div class="TipName"></div><div class="TipData"></div></div>');
        this.TipName = this.ToolTip.find('.TipName');
        this.TipData = this.ToolTip.find('.TipData');
        this.ToolTipWrap = $('<div class="ChartToolTopWrap"></div>').append(this.ToolTip);

        this.img = 0;
        this.radius = 8;
        this.LineWidth = 1;
        this.fontSize = 12;
        //柱子最小宽度
        this.barMinWidth = this.opt.IsMobile ? 15 : 10;
        this.showLength = this.opt.CateLength;
        this.showIndex = 0;
        
        var w = this.opt.Width / (this.opt.Series.length + 1),
            perW = w / this.showLength;

        while (this.barMinWidth > perW && this.showLength>1) {
            perW = w / --this.showLength;
        }

        this.range = this.opt.CateLength - this.showLength;

        perW = perW;
        this.opt.Series.length == 1 && (perW = perW / 2);
        this.BarGap = perW;
        w = this.BarGap / this.opt.Series.length / 2;
        //this.BarMargin = w > 3 ? w : 3;
        this.BarMargin = perW / 5;


        this.ColorLen = this.opt.Colors.length;
        this.HasBind = false;

        this.init();
    }
    Bar.prototype = {
        init: function () {
            if (this.opt.Width == 0 || this.opt.Height == 0)
                return;
            this.canvasF = document.createElement('canvas');
            this.canvasBack = document.createElement('canvas');
            this.canvasF.className = this.canvasBack.className = 'LineChartCanvas';
            this.cacheF = document.createElement('canvas');
            this.wrap.append(this.canvasBack).append(this.canvasF).append(this.ToolTipWrap);
            if (typeof window.G_vmlCanvasManager != "undefined") {
                this.canvasF = window.G_vmlCanvasManager.initElement(this.canvasF);
            }

            this.cxtF = this.canvasF.getContext('2d');
            this.cxtBack = this.canvasBack.getContext("2d");
            this.cacheCxt = this.cacheF.getContext("2d");
            this.canvasF.width = this.canvasBack.width = this.opt.Width;
            this.canvasF.height = this.canvasBack.height = this.opt.Height;

            if (window.devicePixelRatio) {
                this.canvasF.style.width = this.cacheF.style.width = this.canvasBack.style.width = this.opt.Width + "px";
                this.canvasF.style.height = this.cacheF.style.height = this.canvasBack.style.height = this.opt.Height + "px";
                this.canvasF.height = this.cacheF.height = this.canvasBack.height = this.opt.Height * window.devicePixelRatio;
                this.canvasF.width = this.cacheF.width = this.canvasBack.width = this.opt.Width * window.devicePixelRatio;
                this.cxtF.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cxtBack.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cacheCxt.scale(window.devicePixelRatio, window.devicePixelRatio);
            }

            if (this.opt.Series.length == 0 || this.opt.Categories.length == 0) return;

            drawBackGrid(this);

            if (!this.opt.IsMobile && this.showLength < this.opt.CateLength) {
                this.ScrollStep = this.opt.CateLength - this.showLength + 1;
                this.ScrollWrap = $('<div class="ChartScrollWrap"></div>');
                this.ScrollWrap.css({ "top": this.opt.Height - 4, "left": this.Axis.yLabelWidth }).width(this.opt.Width - this.Axis.yLabelWidth - this.padding);

                var t = this.showIndex + this.showLength;
                for (var i = 1; i <= this.ScrollStep; i++) {
                    var ww = (i / this.ScrollStep * 100).toFixed(2) + "%";
                    this.ScrollWrap.append("<i class='BarTip' style='left:" + ww + "' data-text='" + this.opt.Categories[t + i - 2] + "'></i>");
                }

                ww = (1 / this.ScrollStep * 100).toFixed(2) + "%";
                this.ScrollBar = $('<div class="ChartScrollBar"></div>').width(ww).appendTo(this.ScrollWrap);
                this.ScrollIcon = $('<i class="BarIcon1"></i>').css("left", ww).appendTo(this.ScrollWrap);
                this.ScrollWrap.appendTo(this.wrap);
            }

            this.animateData();
            showDownload(this);

            this.wrap.appendTo(this.outer);
        },
        Slider: function () {
            drawBackGrid(this);
            this.progress =100;
            this.HasBind = true;
            this.drawLine();
        },
        formatData: function () {
            var that = this;
            that.DrawData = [];
            that.TextPos = [];

            var cateW = that.Axis.xLabelWidth - that.BarGap;
            var itemW = bitwise(cateW / that.opt.Series.length);
            that.BarWidth = itemW;
            if (that.opt.Series.length == 0) return;
            var range = that.showIndex + that.showLength;
            $.each(that.opt.Series, function (index, item) {
                var drawData = [];
                $.each(item.Data, function (i, v) {
                    if (i < that.showIndex || i >= range) return true;
                    var val = parseFloat(v);
                    var aPoint = {};
                    var ind = i - that.showIndex;
                    
                    aPoint.tX = bitwise(that.Axis.yLabelWidth + itemW * index + 0.5 * that.BarGap + that.Axis.xLabelWidth * ind);
                    aPoint.H = bitwise((val - that.opt.Min) / (that.opt.Max - that.opt.Min) * that.DrawHeight);
                    aPoint.tY = bitwise(that.Axis.endPoint - aPoint.H);
                    aPoint.W = itemW;
                    aPoint.Name = item.Name;
                    aPoint.Data = val;
                    aPoint.OriginalData = v;
                    aPoint.Category = that.opt.Categories[i];
                    aPoint.SeriesCode = item.Code;
                    aPoint.Category && (aPoint.CateCode = that.opt.CateCodes[aPoint.Category]);

                    drawData.push(aPoint);
                    index === 0 && that.TextPos.push(bitwise(that.Axis.yLabelWidth + (ind + 0.5) * that.Axis.xLabelWidth));
                });
                that.DrawData.push(drawData);
            });
            that.cxtF.font = '12px Microsoft YaHei';
        },
        //绘制数据内容
        drawLine: function () {
            var that = this;
            if (that.progress > 100) {
                that.cacheCxt.clearRect(0, 0, this.canvasF.width, this.canvasF.height)
                if (that.opt.IsMobile)
                {
                    that.cxtF.textAlign = "center";
                    that.cxtF.font = "12px Arial";
                    var numW = that.cxtF.measureText("0.12345678").width / 10;
                    var maxN = Math.round(that.BarWidth / numW);
                    maxN = maxN > 0 ? maxN : 1;
                    var w = that.BarWidth / 2;
                    //画数值
                    $.each(that.DrawData, function (j, item) {
                        that.cxtF.save();
                        that.cxtF.fillStyle = that.opt.Colors[j % that.ColorLen];
                        $.each(item, function (index, p) {
                            var text = p.Data + "";
                            text = text.length > maxN ? (maxN > 2 ? text.substr(0, maxN - 2) + '..' : text.substr(0, maxN) + '..') : text;
                            that.cxtF.fillText(text, bitwise(p.tX + w), bitwise(p.tY -2));
                        });
                        that.cxtF.restore();
                    });
                    //end
                }

                //that.cacheCxt.drawImage(that.canvasF, 0, 0);
                that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
                that.HasBind === false && that.bind();
                //console.timeEnd("bar");
                return;
            }

            that.cxtF.clearRect(0, 0, this.canvasF.width, this.canvasF.height);
            // 画内部多边形
            $.each(that.DrawData, function (j, item) {
                that.cxtF.save();
                //绘制线段
                that.cxtF.fillStyle = that.opt.Colors[j % that.ColorLen];
                $.each(item, function (index, p) {
                    var h = p.H;
                    that.cxtF.beginPath();
                    that.cxtF.moveTo(p.tX, p.tY);
                    that.cxtF.fillRect(bitwise(p.tX + that.BarMargin / 2), bitwise(p.tY + h * (1 - that.progress / 100)), p.W - that.BarMargin, bitwise(h * that.progress / 100));
                });
                that.cxtF.restore();
            });

            var tip = (101 - that.progress) / 8;
            tip = tip == 0 ? 1 : tip;
            that.progress += tip;
            that.AnimationID = requestAnimationFrame(function () { that.drawLine.call(that) });
        },
        animateData: function () {
            var that = this;
            //that.progress = 0;
            that.opt.IsMobile ? that.progress = 100 : that.progress = 0;
            that.drawLine();
            //console.time("bar");
        },
        bind: function () {
            var that = this;

            if (that.showLength < that.opt.CateLength && that.HasBind == false) {
                new sliderBar(that);
            }

            that.HasBind = true;

            var tar = {};
            if (!that.opt.IsMobile) {
                that.ToolTipWrap.unbind("mousemove.chart").bind("mousemove.chart", function (e) {
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);

                    var offset = $(this).offset();
                    var point = {
                        x: e.pageX - offset.left,
                        y: e.pageY - offset.top
                    }

                    var index = Math.floor((point.x - that.Axis.yLabelWidth) / that.Axis.xLabelWidth);

                    var w = (point.x - that.Axis.yLabelWidth) % that.Axis.xLabelWidth - that.BarGap / 2;
                    var itemW = (that.Axis.xLabelWidth - that.BarGap) / that.opt.Series.length;
                    var ind = Math.floor(w / itemW);

                    if (index >= that.opt.CateLength || index < 0 || ind < 0 || ind >= that.opt.Series.length) return;
                    tar = that.DrawData[ind][index];

                    //画线

                    that.cxtF.save();
                    that.cxtF.globalAlpha = 0.3;
                    that.cxtF.fillStyle = "#A3CBF2";
                    
                    that.cxtF.fillRect(bitwise(that.Axis.yLabelWidth + that.BarWidth  * ind + 0.5*that.BarGap + that.Axis.xLabelWidth * index), that.padding, that.BarWidth, that.DrawHeight);
                    that.cxtF.restore();

                    that.TipData.html("");
                    var cate = "";
                    that.TipData.append("<div style='color:#fff'>" + tar.Name + ':' + tar.OriginalData + "</div>")
                   
                    //悬浮层显示
                    that.TipName.text(tar.Category);
                    var off = $(this).offset();
                    var top = point.y > (that.opt.Height / 2) ? point.y - 70 : point.y;
                     if (point.x < that.opt.Width / 2) {
                        that.ToolTip.css({
                            left: point.x + that.Axis.yLabelWidth,
                            top: top,
                            right: 'auto'
                        }).show();
                    } else {
                        that.ToolTip.css({
                            right: that.opt.Width - point.x,
                            left: 'auto',
                            top: top
                        }).show();
                    }
                });
                that.ToolTipWrap.unbind("mouseleave.chart").bind("mouseleave.chart", function (e) {
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    that.ToolTip.fadeOut(200);
                });
                that.ToolTipWrap.unbind("click.chart").bind("click.chart", function (e) {
                    doClick(e, this);
                });
            } else if (that.opt.FullMode) {

                that.ToolTip.addClass("ChartToolTipMobile");
                that.ToolTipWrap.tabMobile(function (e) {
                    tar = null;
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    doClick(e, that.canvasF);
                    //doClick(e, that.ToolTipWrap[0]);

                    if (tar == null) return;

                    that.TipData.html("");
                    var cate = "";
                    that.TipData.append("<div style='color:#fff'>" + tar.Name + ':' + tar.OriginalData + "</div>")

                    var offset = that.ToolTipWrap.offset();
                    var point = {
                        x: e.pageX - offset.left,
                        y: e.pageY - offset.top
                    }
                    var w = that.ToolTipWrap.width()/2;

                    var x = that.DrawWidth / that.opt.CateLength;
                    if (tar) {
                        //画线
                        that.cxtF.save();
                        that.cxtF.globalAlpha = 0.3;
                        that.cxtF.fillStyle = "#A3CBF2";

                        that.cxtF.fillRect(bitwise(that.Axis.yLabelWidth + that.BarWidth * tar.index + 0.5 * that.BarGap + that.Axis.xLabelWidth * tar.index1), that.padding, that.BarWidth, that.DrawHeight);
                        that.cxtF.restore();

                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;
                        that.TipData.html("<div style='color:#fff'>" + tar.Name + ':' + tar.Data + "</div>"); //悬浮层显示
                        var top = point.y > (that.opt.Height / 3) ? point.y - 70 : point.y;
                        that.TipName.text(tar.Category);
                        if (point.x <= w) {
                            that.ToolTip.css({
                                left: point.x,
                                top: top,
                                right: 'auto'
                            }).show();
                        } else {
                            that.ToolTip.css({
                                right: that.opt.Width - point.x,
                                left: 'auto',
                                top: top
                            }).show();
                        }
                        that.TimeOut = window.setTimeout(function () {
                            that.TimeOut = null;
                            that.ToolTip.hide();
                        }, HideSec);
                    }
                })
            }

            function doClick(e, tt) {
                var offset = $(tt).offset();
                var point = {
                    x: e.pageX - offset.left,
                    y: e.pageY - offset.top
                }

                var index = Math.floor((point.x - that.Axis.yLabelWidth) / that.Axis.xLabelWidth);

                var w = (point.x - that.Axis.yLabelWidth) % that.Axis.xLabelWidth - that.BarGap / 2;
                var itemW = (that.Axis.xLabelWidth - that.BarGap) / that.opt.Series.length;
                var ind = Math.floor(w / itemW);

                if (index >= that.opt.CateLength || index < 0 || ind < 0 || ind >= that.opt.Series.length) return;
                tar = that.DrawData[ind][index];
                tar.point = point;
                tar.index = ind;
                tar.index1 = index;
                if (point.y < tar.tY) return;
                var ret = {
                    'Name': tar.Name,
                    'Data': tar.Data,
                    'Category': tar.Category,
                    'SeriesCode': tar.SeriesCode,
                    'CateCode': tar.CateCode
                }
                that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                return false;
            }
        },
        unbind: function () {
            var that = this;
            if (!that.opt.IsMobile) {
                that.ToolTipWrap.unbind("mousemove.chart");
                that.ToolTipWrap.unbind("mouseleave.chart");
                that.ToolTipWrap.unbind("click.chart");
            }
        },
        Refresh: function (data) {
            var that = this;
            that.AnimationID && window.cancelAnimationFrame(that.AnimationID);
        }
    }
    //雷达图
    var Radar = function (opt, target) {
        this.opt = opt || {};
        this.opt.CateLength = this.opt.Categories ? this.opt.Categories.length : 0;
        this.outer = target || $('body');
        this.outer.html("");
        this.wrap = $('<div class="RadarChartWrap"></div>');

        this.sizePerc = 70; // 雷达图所占画布百分比大小
        this.radius = 8; // 鼠标选中悬浮半径

        this.ToolTip = $('<div class="ChartToolTip"><div class="TipName"></div><div class="TipData"></div></div>');
        this.TipName = this.ToolTip.find('.TipName');
        this.TipData = this.ToolTip.find('.TipData');
        this.ToolTipWrap = $('<div class="ChartToolTopWrap"></div>').append(this.ToolTip);
        this.ColorLen = this.opt.Colors.length;
        this.fontsize = 12;
        this.OriWidth = this.opt.Width;

        this.init();
    }
    Radar.prototype = {
        init: function () {
            if (this.opt.Width == 0 || this.opt.Height == 0)
                return;
            this.canvasF = document.createElement('canvas');
            this.canvasBack = document.createElement("canvas");
            this.cacheF = document.createElement("canvas");
            this.cxtF = this.canvasF.getContext('2d');
            this.cxtBack = this.canvasBack.getContext('2d');
            this.cacheCxt = this.cacheF.getContext('2d');
            this.canvasF.className = this.canvasBack.className = 'RadarChartCanvas';


            this.wrap.css({
                width: this.opt.Width,
                height: this.opt.Height
            });
            this.wrap.append(this.canvasBack).append(this.canvasF).append(this.ToolTipWrap).appendTo(this.outer);
            showDownload(this);

            this.canvasWidth = this.opt.Width;
            this.canvasHeight = this.opt.Height;
            this.centreX = bitwise(this.canvasWidth / 2);
            this.centreY = bitwise(this.canvasHeight / 2);
            this.chartRadius = bitwise(Math.min(this.canvasWidth, this.canvasHeight) * this.sizePerc / 100 / 2); // 雷达图半径

            this.formatData();
            this.opt.Width += this.Direction.L + this.Direction.R;
            this.opt.Height += this.Direction.B + this.Direction.T;
            this.canvasBack.style.left = this.canvasF.style.left = -this.Direction.L + "px";
            this.canvasBack.style.top = this.canvasF.style.top = -this.Direction.T + "px";

            this.canvasF.width = this.canvasBack.width = this.cacheF.width = this.opt.Width;
            this.canvasF.height = this.canvasBack.height = this.cacheF.height = this.opt.Height;
            this.scaleWidth = this.opt.Width;
            this.scaleHeight = this.opt.Height;

            if (window.devicePixelRatio) {
                this.scaleWidth = this.opt.Width * window.devicePixelRatio;
                this.scaleHeight = this.opt.Height * window.devicePixelRatio;
                this.canvasF.style.width = this.canvasBack.style.width = this.cacheF.style.width = this.opt.Width + "px";
                this.canvasF.style.height = this.canvasBack.style.height = this.cacheF.style.height = this.opt.Height + "px";
                this.canvasF.height = this.canvasBack.height = this.cacheF.height = this.scaleHeight;
                this.canvasF.width = this.canvasBack.width = this.cacheF.width = this.scaleWidth;
                this.cxtF.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cxtBack.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cacheCxt.scale(window.devicePixelRatio, window.devicePixelRatio);
            }


            this.drawBack();
            this.animateData();
        },
        formatData: function () {
            var that = this;
            that.DrawData = [];
            that.Angels = [];
            that.perAngels = 2 * Math.PI / that.opt.CateLength;
            $.each(that.opt.Series, function (index, aitem) {
                var drawData = [];
                var backData = [];
                $.each(aitem.Data, function (i, v) {
                    var val = parseFloat(v);
                    var aPoint = {};
                    var item = (val - that.opt.Min) / (that.opt.Max - that.opt.Min);
                    var angel = that.perAngels * i;
                    aPoint.x = bitwise(Math.sin(angel) * that.chartRadius * item);
                    aPoint.y = bitwise(Math.cos(angel) * that.chartRadius * item);
                    aPoint.Name = aitem.Name;
                    aPoint.Data = val;
                    aPoint.OriginalData = v;
                    aPoint.Category = that.opt.Categories[i];
                    aPoint.SeriesCode = item.Code;
                    aPoint.Category && (aPoint.CateCode = that.opt.CateCodes[aPoint.Category]);

                    drawData.push(aPoint);

                });
                that.DrawData.push(drawData);
            });
            var BackData = [];
            var data = { Fir: [], FirE:null, Sec: [], SecE: null, Thi: [], ThiE: null, Fou: [], FouE: null };//从最低端开始，顺时针方向，每90度划分为一个象限，并非为标准的象限
            for (var i = 0, l = that.opt.CateLength; i < l; i++) {
                var angel = that.perAngels * i;
                BackData.push({
                    x: bitwise(that.centreX + Math.sin(angel) * that.chartRadius),
                    y: bitwise(that.centreY + Math.cos(angel) * that.chartRadius),
                    angel: angel,
                    align: that.getAlign(angel),
                    text: that.opt.Categories[i]
                });
            }
            var hasMid = that.opt.CateLength % 4===0;
            
            for (var i = 0, l = BackData.length; i < l; i++) {
                var t = BackData[i];
                t.tx = t.x;
                t.ty = t.y;
                switch(t.angel){
                    case 0: {
                        t.y += 12;
                        data.FirE = t;
                    }break;
                    case Math.PI/2:{
                        data.SecE = t;
                    }break;
                    case Math.PI: {
                        t.y -= 12;
                        data.ThiE = t;
                    }break;
                    case Math.PI*3/2:{
                        data.FouE = t;
                    }break;
                    default:{
                        if(t.angel < Math.PI/2){
                            data.Fir.push(t);
                        }else if(t.angel <Math.PI){
                            data.Sec.push(t);
                        }else if(t.angel < Math.PI*3/2){
                            data.Thi.push(t);
                        }else if(t.angel < Math.PI*2){
                            data.Fou.push(t);
                        }
                    }break;
                }
            }

            data.Fir.reverse();
            data.Thi.reverse();
            var range = 16, Direction = { T: 0, L: 0, R: 0, B: 0 };
            function checkV(arr,type){
                for (var i = 0, l = arr.length; i < l; i++) {
                    var item = arr[i];
                    item.align=="left" && (item.x += 12);
                    item.align=="right" && (item.x -= 12);
                    switch(type){
                        case "first":
                        case "forth": {
                            //第一象限
                            if(i==0){
                                if(hasMid){
                                    var s = Math.abs(that.centreY-item.y)
                                    s < range && (item.y += (range - s));
                                }
                                continue
                            }
                            var s = item.y - arr[i - 1].y;
                            s < range && (item.y += (range - s));
                            if (i == l - 1) {
                                var s = data.FirE.y - item.y;
                                if (s < range)
                                    data.FirE.y = item.y + range;
                            }
                            var length = item.text ? item.text.length : 0;
                            type == "first" ? (Direction.R = Math.max(Direction.R, item.x + that.fontsize * (length + 4))) : (Direction.L = Math.max(Direction.L, that.fontsize * length - item.x));
                        }break;
                        case "second":
                        case "third": {
                            if (i == 0) {
                                if (hasMid) {
                                    var s = Math.abs(that.centreY-item.y)
                                    s < range && (item.y += (range - s));
                                }
                                continue
                            }
                            var s = arr[i - 1].y- item.y;
                            s < range && (item.y -= (range - s));
                            if (i == l - 1 && hasMid) {
                                var s = item.y - data.ThiE.y;
                                if (s < range)
                                    data.ThiE.y = item.y - range;
                            }
                            Direction.T = Math.min(Direction.T, item.y);
                            var length = item.text ? item.text.length : 0;
                            type == "second" ? (Direction.R = Math.max(Direction.R, item.x + that.fontsize * (length + 4))) : (Direction.L = Math.max(Direction.L, that.fontsize * length - item.x));
                        }break;
                    }
                }
                return arr;
            }

            data.Fir = checkV(data.Fir, "first");
            data.Sec = checkV(data.Sec, "second");
            data.Thi = checkV(data.Thi, "third");
            data.Fou = checkV(data.Fou, "forth");

            Direction.L = Direction.L > 0 ? parseInt(Direction.L) : 0;
            Direction.R = Direction.R - that.opt.Width;
            Direction.R = Direction.R > 0 ? parseInt(Direction.R) : 0;
            Direction.T = hasMid ? data.ThiE.y : Direction.T;
            Direction.T = Direction.T < 0 ? parseInt(Math.abs(Direction.T - that.fontsize * 2)) : 0;
            var d = data.FirE.y + 2*that.fontsize - that.opt.Height;
            Direction.B = d > 0 ? parseInt(d) : 0;
            console.log(Direction);
            that.Direction = Direction;

            //hasMid === true && (that.BackData = Array.prototype.concat.call(data.FirE, data.Fir.reverse(), data.SecE, data.Sec, data.ThiE, data.Thi.reverse(), data.FouE, data.Fou));
            //hasMid === false && (that.BackData = Array.prototype.concat.call(data.FirE, data.Fir.reverse(), data.Sec, data.Thi.reverse(), data.Fou));

            that.BackData = Array.prototype.concat.call(data.FirE, data.Fir.reverse());
            data.SecE && that.BackData.push(data.SecE);
            that.BackData = Array.prototype.concat.call(that.BackData ,data.Sec);
            data.ThiE && that.BackData.push(data.ThiE);
            that.BackData = Array.prototype.concat.call(that.BackData, data.Thi.reverse());
            data.FouE && that.BackData.push(data.FouE);
            that.BackData = Array.prototype.concat.call(that.BackData, data.Fou);

            
        },
        drawBack: function () {
            var that = this;
            var isTrue = false;
            //画底部背景
            that.cxtBack.save();
            that.cxtBack.translate(that.Direction.L, that.Direction.T);
            //that.cxtBack.fillStyle = (isTrue = !isTrue) ? "#ECECEC" : "#fff";
            that.cxtBack.strokeStyle = "#ddd";
            that.cxtBack.clearRect(0, 0, that.canvasBack.width, that.canvasBack.height);
            that.cxtBack.lineWidth = 1;
            for (var j = 5; j > 0; j--) {
                that.cxtBack.beginPath();
                for (var i = 0; i < that.opt.CateLength + 1; i++) {
                    var angel = (2 * Math.PI / that.opt.CateLength) * i;
                    var x = bitwise(that.centreX + Math.sin(angel) * that.chartRadius * j / 5);
                    var y = bitwise(that.centreY + Math.cos(angel) * that.chartRadius * j / 5);
                    if (i == 0) {
                        that.cxtBack.moveTo(x, y);
                        continue;
                    }
                    that.cxtBack.lineTo(x, y);
                }
            that.cxtBack.stroke();
            }

            that.cxtBack.beginPath();
            that.cxtBack.fillStyle = '#999';
            that.cxtBack.font = "bold 12px Arial";
            that.cxtBack.textBaseline = "middle";
            for (var i = 0, l = that.BackData.length;i<l; i++) {
                var item = that.BackData[i];
                that.cxtBack.moveTo(that.centreX, that.centreY);
                that.cxtBack.lineTo(item.tx, item.ty);
                that.cxtBack.textAlign = item.align;
                that.cxtBack.fillText("  "+item.text+"  ", item.x, item.y);//加空格防止文本被挡住
            }
            that.cxtBack.stroke();
            that.cxtBack.closePath();
            that.cxtBack.restore();
        },
        drawRadar: function () {
            var that = this;
            if (that.progress > 100) {
                //var rate = window.devicePixelRatio || 1;
                that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
                this.bind();
                //console.timeEnd("radar");
                return;
            }
            var per = that.progress / 100.0;
            that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
            //画内部多边形
            that.cxtF.save();
            that.cxtF.lineJoin = 'round';
            that.cxtF.strokeStyle = '#fff';
            that.cxtF.lineWidth = 2;

            that.cxtF.translate(that.Direction.L, that.Direction.T);
            $.each(that.DrawData, function (index, item) {
                that.cxtF.save();
                that.cxtF.fillStyle = that.opt.Colors[index % that.ColorLen];
                $.each(item, function (i, point) {
                    that.cxtF.beginPath();
                    that.cxtF.arc(point.x * per + that.centreX, point.y * per + that.centreY, 4, 0, Math.PI * 2);
                    that.cxtF.closePath();
                    that.cxtF.fill();
                    that.cxtF.stroke();
                });

                that.cxtF.beginPath();
                $.each(item, function (i, point) {
                    that.cxtF.lineTo(point.x * per + that.centreX, point.y * per + that.centreY);
                });
                that.cxtF.strokeStyle = that.opt.Colors[index % that.ColorLen];
                that.cxtF.closePath();
                that.cxtF.stroke();
                that.cxtF.restore();
            });
            that.cxtF.restore();
            var tip = (101 - that.progress) / 8;
            tip = tip == 0 ? 1 : tip;
            that.progress += tip;
            that.AnimationID = requestAnimationFrame(function () { that.drawRadar.call(that) });
        },
        getAlign: function (angel) {

            if (angel > 0 && angel < Math.PI) {
                return 'left';
            } else if (angel > Math.PI && angel < Math.PI * 2) {
                return 'right';
            } else {
                return 'center';
            }
        },
        animateData: function () {
            var that = this;
            that.opt.IsMobile ? that.progress = 100 : that.progress = 0;
            that.drawRadar();
            //console.time("radar");
        },
        getClickIndex: function (e) {
            var that = this;
            var offsetA = $(that.canvasF).offset();
            var mouseX = e.pageX - offsetA.left - that.Direction.L;
            var mouseY = e.pageY - offsetA.top - that.Direction.T;
            var xFromCentre = mouseX - that.centreX;
            var yFromCentre = mouseY - that.centreY;
            var distanceFromCentre = Math.sqrt(Math.pow(Math.abs(xFromCentre), 2) + Math.pow(Math.abs(yFromCentre), 2));
            var index = -1;
            if (distanceFromCentre <= that.chartRadius) {
                var clickAngle = Math.atan2(yFromCentre, xFromCentre) - Math.PI / 2;
                if (clickAngle < 0) {
                    clickAngle = -clickAngle;
                } else {
                    clickAngle = 2 * Math.PI - clickAngle;
                }
                index = Math.round(clickAngle / that.perAngels);
                index = index === that.opt.CateLength ? 0 : index;
            }
            return index;
        },
        bind: function () {
            var that = this;
            new slider(that);
            var offsetA = $(that.canvasF).offset();

            function doClick(e, curroffset) {
                var index = that.getClickIndex.call(that,e);
                if (index === -1) {
                    return;
                }

                var x = e.pageX - curroffset.left - that.centreX;
                var y = e.pageY - curroffset.top - that.centreY;
              
                $.each(that.DrawData, function (i, item) {
                    var p = item[index];
                    var l = Math.sqrt(Math.pow(Math.abs(x - p.x), 2) + Math.pow(Math.abs(y - p.y), 2)); 
                     if (l <= that.radius) {
                        var ret = {
                            'Name': p.Name,
                            'Data': p.Data,
                            'Category': p.Category,
                            'SeriesCode': p.SeriesCode,
                            'CateCode': p.CateCode
                        }
                        that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                        return false;
                    }
                });
            }

            if (!that.opt.IsMobile) {
                that.ToolTipWrap.click(function (e) {
                    var CurrentoffsetA = $(this).offset();
                    doClick(e, CurrentoffsetA);
                });

                that.ToolTipWrap.mousemove(function (e) {
                    var index = that.getClickIndex(e);
                    if (index === -1) {
                        return;
                    }
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    that.cxtF.save();
                    that.cxtF.translate(that.Direction.L, that.Direction.T);
                    that.cxtF.globalAlpha = 0.5;
                    that.TipData.html("");
                    var cate = "";
                    $.each(that.DrawData, function (i, item) {
                        var color = that.opt.Colors[i % that.ColorLen];
                        var p = item[index];
                        that.cxtF.beginPath();
                        that.cxtF.fillStyle = color;
                        that.cxtF.moveTo(p.x + that.centreX, p.y + that.centreY);
                        that.cxtF.arc(p.x + that.centreX, p.y + that.centreY, that.radius, 0, Math.PI * 2);
                        that.cxtF.fill();
                        cate === "" && (cate = p.Category);
                        that.TipData.append("<div style='color:" + color + "'>" + p.Name + ':' + p.OriginalData + "</div>")
                    });
                    that.cxtF.restore();
                    //悬浮层显示
                    that.TipName.text(cate);
                    var off = $(this).offset();

                    var left = e.pageX - off.left - that.Direction.L;
                    var isleft = left < that.OriWidth / 2;
                    var bottomHei = that.opt.Height - (e.pageY - off.top);
                    var topVal = (e.pageY - off.top);
                    if (that.ToolTip.height() > bottomHei) {
                        topVal = that.opt.Height - that.ToolTip.height();
                    }
                    //debugger
                    that.ToolTip.css({
                        right: isleft ? "auto" : that.OriWidth - left,
                        left: isleft ? left : "auto",
                        top: topVal
                    }).show();
                });

                that.ToolTipWrap.mouseleave(function (e) {
                    that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    that.ToolTip.fadeOut(200);
                });
            } else if (that.opt.FullMode) {
                that.ToolTipWrap.tabMobile(function (e) {
                    that.ToolTip.addClass("ChartToolTipMobile");
                    var index = that.getClickIndex.call(that,e);
                    //var rate = window.devicePixelRatio || 1;
                    if (index === -1) {
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;
                        that.ToolTip.hide();
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                        return;
                    }

                    that.TimeOut && window.clearTimeout(that.TimeOut);
                    that.TimeOut = null;
                    that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    that.cxtF.save();
                    that.cxtF.translate(that.Direction.L, that.Direction.T);
                    that.cxtF.globalAlpha = 0.5;
                    that.TipData.html("");
                    var cate = "";
                    $.each(that.DrawData, function (i, item) {
                        var color = that.opt.Colors[i % that.ColorLen];
                        var p = item[index];
                        that.cxtF.beginPath();
                        that.cxtF.fillStyle = color;
                        that.cxtF.moveTo(p.x + that.centreX, p.y + that.centreY);
                        that.cxtF.arc(p.x + that.centreX, p.y + that.centreY, that.radius, 0, Math.PI * 2);
                        that.cxtF.fill();
                        cate === "" && (cate = p.Category);
                        that.TipData.append("<div style='color:" + color + "'>" + p.Name + ':' + p.OriginalData + "</div>")
                    });
                    that.cxtF.restore();
                    //悬浮层显示
                    that.TipName.text(cate);
                    var off = $(that.canvasF).offset();
                    var left = e.pageX - off.left - that.Direction.L;
                    var isleft = left < that.OriWidth/2;

                    that.ToolTip.css({
                        right: isleft ? "auto" : that.OriWidth - left,
                        left: isleft ? left : "auto",
                        top: e.pageY - off.top
                    }).show();

                    that.TimeOut = window.setTimeout(function () {
                        that.TimeOut = null;
                        that.ToolTip.hide();
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    }, HideSec);

                    doClick(e, off);
                });
            }
        },
        Refresh: function (data) {
            var that = this;
            that.AnimationID && window.cancelAnimationFrame(that.AnimationID);
        }
    }
    //漏斗图
    var Funnel = function (opt, target) {
        this.opt = $.extend({}, opt);
        this.outer = target || $('body');
        this.outer.html("");
        this.wrap = $('<div class="FunnelChartWrap"></div>');
        this.wrap.css({
            width: this.opt.Width,
            height: this.opt.Height
        });
        this.ToolTip = $('<div class="ChartToolTip"><div class="TipName"></div><div class="TipData"></div></div>');
        this.TipName = this.ToolTip.find('.TipName');
        this.TipData = this.ToolTip.find('.TipData');
        this.ToolTipWrap = $('<div class="ChartToolTopWrap"></div>').append(this.ToolTip);
        this.img = 0;
        this.ColorLen = this.opt.Colors.length;
        this.OriWidth = this.opt.Width;
        this.init();
    }
    Funnel.prototype = {
        init: function () {
           // debugger
            if (this.opt.Width == 0 || this.opt.Height == 0)
                return;
            this.canvasF = document.createElement('canvas');
            if (!this.canvasF.getContext) {
                return;
            }
            this.cxtF = this.canvasF.getContext('2d');
            this.canvasF.className = 'FunnelChartCanvas';
            this.cacheF = document.createElement("canvas");
            this.cacheCxt = this.cacheF.getContext('2d');

            this.wrap.append(this.canvasF).append(this.ToolTipWrap).appendTo(this.outer);
            showDownload(this);

            this.sizePerc = 70; // 漏斗图所占画布百分比大小
            this.BiLi = 5 / 3; //漏斗图高宽比
            this.borderWidth = 1; // 边框宽度
            this.pullOutLabelFont = "bold 12px 'Microsoft YaHei'"; // 描述字体
            this.curSlice = -1; // 偏移量的索引值，默认为-1没有偏移量
            this.chartData = []; // 数据
            this.chartColors = this.opt.Colors; // 颜色
            this.totalValue = 0; // 饼图数据总值
            this.canvasWidth = this.opt.Width; // 画布宽度
            this.canvasHeight = this.opt.Height; // 画布高度
            this.centreX = bitwise(this.canvasWidth / 2 - this.canvasWidth / 10); // 画布中心位置X
            this.centreY = bitwise(this.canvasHeight / 2); // 画布中心位置Y
            this.chartW = bitwise(this.canvasWidth * this.sizePerc / 100 / 2); // 漏斗图半径
            this.chartH = bitwise(this.canvasHeight * this.sizePerc / 100 / 2); // 漏斗图半径
            var ctw = bitwise(this.chartH * this.BiLi);
            this.chartW > ctw && (this.chartW = ctw);
            this.angelT = this.chartW / 2.5 / this.chartH;
            this.fontsize = 12;

            this.formatData();
            this.opt.Width += this.Direction.L + this.Direction.R;
            this.opt.Height += this.Direction.B;
            this.canvasF.style.left = -this.Direction.L + "px";

            this.canvasF.width = this.cacheF.width = this.opt.Width;
            this.canvasF.height = this.cacheF.height = this.opt.Height;
            this.scaleWidth = this.opt.Width;
            this.scaleHeight = this.opt.Height;

            if (window.devicePixelRatio) {
                this.scaleWidth = this.opt.Width * window.devicePixelRatio;
                this.scaleHeight = this.opt.Height * window.devicePixelRatio;
                this.canvasF.style.width = this.cacheF.style.width = this.opt.Width + "px";
                this.canvasF.style.height = this.cacheF.style.height = this.opt.Height + "px";
                this.canvasF.height = this.cacheF.height = this.scaleHeight;
                this.canvasF.width = this.cacheF.width = this.scaleWidth;
                this.cxtF.scale(window.devicePixelRatio, window.devicePixelRatio);
                this.cacheCxt.scale(window.devicePixelRatio, window.devicePixelRatio);
            }


            this.draw();
            this.bind();
        },
        formatData: function () {
            //防止文本重叠
            var that = this;
            var minVal = that.opt.Min < 0 ? that.opt.Min : 0;
            $.each(that.opt.Series, function (index, item) {
                //增加多条数据循环遍历处理
                var obj = {};
                index = parseInt(index);
                obj.value = parseFloat(item.Data[0]);
                obj.discri = item.Name;
                that.totalValue += parseFloat(item.Data[0]) - minVal;

                var cate = that.opt.Categories[0];
                obj.Category = cate;
                obj.OriginalData = item.Data[0];
                obj.SeriesCode = item.Code;
                cate && (obj.CateCode = that.opt.CateCodes[cate]);
                that.chartData.push(obj);
            });
            var currentPos = 0;
            var notTransfer = true;
            var range = 0.75;
            //switch (that.opt.ShowType) {
            //    case 1: {//1：显示有折角漏斗图
            for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                var point = that.chartData[slice];
                var percent = currentPos + ((point['value'] - minVal) / that.totalValue);
                currentPos = percent;
                var offPoint = {
                    x: that.centreX - that.chartW,
                    y: that.centreY - that.chartH
                }
                var tan = Math.tan();
                point.NeedLeft = false;
                point['per'] = percent;
                if (slice == 0) {
                    point['TLPoint'] = {
                        x: offPoint.x,
                        y: offPoint.y
                    }
                    point['TRPoint'] = {
                        x: that.centreX + that.chartW,
                        y: offPoint.y
                    }
                } else {
                    point['TLPoint'] = that.chartData[slice - 1]['BLPoint'];
                    point['TRPoint'] = that.chartData[slice - 1]['BRPoint'];
                }

                if (percent >= range) {
                    if (notTransfer === true) {
                        point['MLPoint'] = {
                            x: that.centreX - that.chartW + that.chartH * 2 * range * that.angelT,
                            y: offPoint.y + that.chartH * 2 * range
                        }
                        point['MRPoint'] = {
                            x: that.centreX + that.chartW - that.chartH * 2 * range * that.angelT,
                            y: offPoint.y + that.chartH * 2 * range
                        }
                        notTransfer = false;
                    }
                    point['BLPoint'] = {
                        x: that.centreX - that.chartW + that.chartH * 2 * range * that.angelT,
                        y: offPoint.y + percent * 2 * that.chartH
                    }
                    point['BRPoint'] = {
                        x: that.centreX + that.chartW - that.chartH * 2 * range * that.angelT,
                        y: offPoint.y + percent * 2 * that.chartH
                    }
                } else {
                    point['BLPoint'] = {
                        x: offPoint.x + that.angelT * 2 * percent * that.chartH,
                        y: offPoint.y + percent * 2 * that.chartH
                    }
                    point['BRPoint'] = {
                        x: offPoint.x + 2 * that.chartW - that.angelT * 2 * percent * that.chartH,
                        y: offPoint.y + percent * 2 * that.chartH
                    }
                }
                point['sPoint'] = {
                    x: (point['TRPoint'].x + point['BRPoint'].x) / 2,
                    y: (point['TLPoint'].y + point['BLPoint'].y) / 2
                }
                var padding = 20;
                point['mPoint'] = {
                    x: point['sPoint'].x + padding,
                    y: point['sPoint'].y
                }

                point['poly'] = [];
                point['poly'].push(point['TLPoint']);
                if (point['MLPoint']) {
                    point['poly'].push(point['MLPoint']);
                }
                point['poly'].push(point['BLPoint'], point['BRPoint']);
                if (point['MRPoint']) {
                    point['poly'].push(point['MRPoint']);
                }
                point['poly'].push(point['TRPoint']);
            }
            //    } break;
            //    case 2: {//2：显示无折角漏斗图
            //        //var padY = 2, hh = this.chartH - padY * (that.chartData.length - 1)/2;
            //        //for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
            //        //    var point = that.chartData[slice];
            //        //    var percent = currentPos + (point['value'] / that.totalValue);
            //        //    currentPos = percent;
            //        //    var offPoint = {
            //        //        x: that.centreX - that.chartW,
            //        //        y: that.centreY - that.chartH
            //        //    }

            //        //    that.angelT = this.chartW * (1 - range);
            //        //    point.NeedLeft = false;
            //        //    point['per'] = percent;
            //        //    if (slice == 0) {
            //        //        point['TLPoint'] = {
            //        //            x: offPoint.x,
            //        //            y: offPoint.y
            //        //        }
            //        //        point['TRPoint'] = {
            //        //            x: that.centreX + that.chartW,
            //        //            y: offPoint.y
            //        //        }
            //        //    } else {
            //        //        var BL = that.chartData[slice - 1]['BLPoint'];
            //        //        point['TLPoint'] = {
            //        //            x: BL.x,
            //        //            y: BL.y + padY
            //        //        }
            //        //        var BR = that.chartData[slice - 1]['BRPoint'];
            //        //        point['TRPoint'] = {
            //        //            x: BR.x,
            //        //            y: BR.y + padY
            //        //        }
            //        //    }

            //        //        point['BLPoint'] = {
            //        //            x: offPoint.x + that.angelT * percent,
            //        //            y: offPoint.y + percent * 2 * hh + padY * slice
            //        //        }
            //        //        point['BRPoint'] = {
            //        //            x: offPoint.x + 2 * that.chartW - that.angelT * percent,
            //        //            y: offPoint.y + percent * 2 * hh + padY * slice
            //        //        }

            //        //    point['sPoint'] = {
            //        //        x: (point['TRPoint'].x + point['BRPoint'].x) / 2,
            //        //        y: (point['TLPoint'].y + point['BLPoint'].y) / 2
            //        //    }
            //        //    var padding = 20;
            //        //    point['mPoint'] = {
            //        //        x: point['sPoint'].x + padding,
            //        //        y: point['sPoint'].y
            //        //    }

            //        //    point['poly'] = [];
            //        //    point['poly'].push(point['TLPoint']);
            //        //    point['poly'].push(point['BLPoint'], point['BRPoint']);
            //        //    point['poly'].push(point['TRPoint']);
            //        //}
            //    } break;
            //}

            var NeedLeft = false, Direction = { T: 0, L: 0, B: 0, R: 0 };
            if (that.chartData.length > 0) {
                var kP = that.chartData[0];
                Direction.R = Math.max(Direction.R, (kP["ePoint"] ? kP["ePoint"].x : kP["mPoint"].x) + that.fontsize * (kP["discri"].length + 6));
            }
            for (var i = 1, len = that.chartData.length; i < len; i++) {
                var index = i - 1;
                var sPoint = that.chartData[index];
                var mPoint = that.chartData[i];
                var kk = Math.abs(sPoint['mPoint'].y - mPoint['mPoint'].y);
                if (kk < 14 || (sPoint['ePoint'] && sPoint['ePoint'].y > mPoint['mPoint'].y)) {
                    var top = sPoint['ePoint'] ? sPoint['ePoint'].y + 14 : mPoint['mPoint'].y + 14 - kk;
                    if (!NeedLeft) {//描述文本显示在右边
                        if (top > that.opt.Height - 16) {
                            NeedLeft = true;
                            mPoint['sPoint'].x = (mPoint['TLPoint'].x + mPoint['BLPoint'].x) / 2 + 12;
                            var padding = 20;
                            mPoint['mPoint'] = {
                                x: mPoint['sPoint'].x - padding,
                                y: mPoint['sPoint'].y
                            }
                            mPoint.NeedLeft = true;

                        } else {
                            mPoint['ePoint'] = {
                                x: mPoint['mPoint'].x + 5,
                                y: top
                            }
                        }
                        Direction.R = Math.max(Direction.R,(mPoint["ePoint"] ? mPoint["ePoint"].x : mPoint["mPoint"].x) + that.fontsize * (mPoint["discri"].length + 6));
                        Direction.B = Math.max(Direction.B, top + 2 * that.fontsize);
                    } else {  //描述文本显示在坐标
                        mPoint['sPoint'].x = (mPoint['TLPoint'].x + mPoint['BLPoint'].x) / 2 + 12;
                        var padding = 20;
                        mPoint['mPoint'] = {
                            x: mPoint['sPoint'].x - padding,
                            y: mPoint['sPoint'].y
                        }
                        mPoint.NeedLeft = true;
                        mPoint['ePoint'] = {
                            x: mPoint['mPoint'].x - 5,
                            y: top
                        }
                        Direction.L = Math.max(Direction.L, that.fontsize * (mPoint["discri"].length + 6) - (mPoint["ePoint"] ? mPoint["ePoint"].x : mPoint["mPoint"].x));
                        Direction.B = Math.max(Direction.B, top + 2 * that.fontsize);
                    }
                } else {
                    Direction.R = Math.max(Direction.R, (mPoint["ePoint"] ? mPoint["ePoint"].x : mPoint["mPoint"].x) + that.fontsize * (mPoint["discri"].length + 6));
                    Direction.B = Math.max(Direction.B, mPoint.y + 2*that.fontsize);
                }
            }
            Direction.L = Direction.L > 0 ? parseInt(Direction.L) : 0;
            Direction.R -= that.opt.Width;
            Direction.R = Direction.R > 0 ? parseInt(Direction.R) : 0;
            Direction.B -= that.opt.Height;
            Direction.B = Direction.B > 0 ? parseInt(Direction.B) : 0;
            that.Direction = Direction;
            console.log(Direction);
        },
        draw: function () {
            var that = this;
            that.cxtF.save();
            that.cxtF.translate(that.Direction.L, that.Direction.T);
                that.cxtF.globalAlpha = 1;
            for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                var point = that.chartData[slice];
                that.cxtF.save();
                that.cxtF.beginPath();
                that.cxtF.moveTo(point['TLPoint'].x, point['TLPoint'].y);
                that.cxtF.lineTo(point['TRPoint'].x, point['TRPoint'].y);
                if (!!point['MRPoint']) {
                    that.cxtF.lineTo(point['MRPoint'].x, point['MRPoint'].y);
                }
                that.cxtF.lineTo(point['BRPoint'].x, point['BRPoint'].y);
                that.cxtF.lineTo(point['BLPoint'].x, point['BLPoint'].y);
                if (!!point['MLPoint']) {
                    that.cxtF.lineTo(point['MLPoint'].x, point['MLPoint'].y);
                }
                that.cxtF.fillStyle = that.chartColors[slice % that.ColorLen];
                that.cxtF.fill();
                that.cxtF.closePath();
                that.cxtF.restore();
            }
            that.cxtF.restore();

            that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
            that.divS = $('<div style="background-color:#fff"></div>');
            that.divS.css({
                width: that.opt.Width,
                height: that.opt.Height,
                position: 'absolute',
                bottom: 0,
                left: 0
            });
            that.divS.appendTo(that.wrap);

            that.AnimationID = requestAnimationFrame(function () { that.animateFunnel(); });
        },
        animateFunnel: function () {
            var that = this;

            if (that.opt.IsMobile) {
                that.divS.remove();
                that.drawSlice();
                that.bind();
            } else {
                that.divS.animate({ height: 0 }, 2000, function () {
                    var u = navigator.userAgent;
                    if (u.indexOf('Trident') > -1 || u.indexOf('MSIE') > -1) {
                        $(this).removeNode(true);
                    } else {

                        $(this).remove();
                    }
                  
                    that.drawSlice();
                    that.bind();
                });
            }
        },
        drawSlice: function () {
            var that = this;
            var minVal = that.opt.Min < 0 ? that.opt.Min : 0;

            that.cxtF.save();
            that.cxtF.translate(that.Direction.L, that.Direction.T);
            that.cxtF.textBaseline = "middle";
            that.cxtF.globalAlpha = that.opt.IsMobile ? 1 : 0.9;
            that.cxtF.font = that.pullOutLabelFont;
            for (var slice = 0, len = that.chartData.length; slice < len; slice++) {
                var point = that.chartData[slice];
                point.NeedLeft && (that.cxtF.textAlign = 'right');
                that.cxtF.fillStyle = that.chartColors[slice % that.ColorLen];

                //画线
                that.cxtF.beginPath();
                that.cxtF.moveTo(point['sPoint'].x - 10, point['sPoint'].y);
                //that.cxtF.lineTo(point['mPoint'].x, point['mPoint'].y);
                var per = (point['value'] - minVal) / that.totalValue * 100;
                per = isInteger(per) ? per : per.toFixed(2);


                if (!!point['ePoint']) {
                    //that.cxtF.lineTo(point['ePoint'].x, point['ePoint'].y);
                    that.cxtF.quadraticCurveTo(point['mPoint'].x, point['mPoint'].y,point['ePoint'].x, point['ePoint'].y);
                    that.cxtF.fillText(point['discri'] + "(" + per + "%)", point['ePoint'].x + (point.NeedLeft ? -2 : 2), point['ePoint'].y);
                } else {
                    that.cxtF.lineTo(point['mPoint'].x, point['mPoint'].y);
                    that.cxtF.fillText(point['discri'] + "(" + per + "%)", point['mPoint'].x + (point.NeedLeft ? -2 : 2), point['mPoint'].y);
                }
                that.cxtF.strokeStyle = that.chartColors[slice % that.ColorLen];
                that.cxtF.stroke();
            }
            that.cxtF.restore();
            that.cacheCxt.drawImage(that.canvasF, 0, 0, that.opt.Width, that.opt.Height);
        },
        bind: function (e) {
            var that = this;
            new slider(that);

            var offsetA = $(that.canvasF).offset();
            that.ToolTipWrap.click(function (e) {
                var CurrentoffsetA = $(this).offset();
                doClick(e, CurrentoffsetA); 
            });

            function doClick(e, curroffset) {
                var mouseX = e.pageX - curroffset.left;
                var mouseY = e.pageY - curroffset.top;
                var i = that.pointInPolygon.call(that, mouseX, mouseY);
 
                if (i != -1) {
                    var ret = {
                        'Name': that.chartData[i]['discri'],
                        'Data': that.chartData[i]['value'],
                        'Category': that.chartData[i]['Category'],
                        'SeriesCode': that.chartData[i]['SeriesCode'],
                        'CateCode': that.chartData[i]['CateCode']
                    }
                    that.opt.ClickChartCBack && that.opt.ClickChartCBack(ret);
                    return;
                }
            }

            if (!that.opt.IsMobile) {
                that.ToolTipWrap.mousemove(function (e) {
                    var off = $(this).offset();
                    var mouseX = e.pageX - off.left;
                    var mouseY = e.pageY - off.top;
                    var i = that.pointInPolygon.call(that,mouseX, mouseY);
                    that.cxtF.clearRect(0, 0, that.opt.Width, that.opt.Height);
                    //that.cxtF.drawImage(that.cacheF, 0, 0);
                    that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);

                    if (i != -1) {
                        that.cxtF.save();
                        that.cxtF.translate(that.Direction.L, that.Direction.T);
                        that.cxtF.globalAlpha = 0.2;
                        that.cxtF.beginPath();
                        that.cxtF.moveTo(that.chartData[i]['TLPoint'].x, that.chartData[i]['TLPoint'].y);
                        that.cxtF.lineTo(that.chartData[i]['TRPoint'].x, that.chartData[i]['TRPoint'].y);
                        if (!!that.chartData[i]['MRPoint']) {
                            that.cxtF.lineTo(that.chartData[i]['MRPoint'].x, that.chartData[i]['MRPoint'].y);
                        }
                        that.cxtF.lineTo(that.chartData[i]['BRPoint'].x, that.chartData[i]['BRPoint'].y);
                        that.cxtF.lineTo(that.chartData[i]['BLPoint'].x, that.chartData[i]['BLPoint'].y);
                        if (!!that.chartData[i]['MLPoint']) {
                            that.cxtF.lineTo(that.chartData[i]['MLPoint'].x, that.chartData[i]['MLPoint'].y);
                        }
                        that.cxtF.fillStyle = '#fff';
                        that.cxtF.fill();

                        that.cxtF.restore();
                       
                       // debugger;
                        that.TipName.text(that.chartData[i]['discri']);
                        that.TipData.text(that.chartData[i]['Category'] + '：' + that.chartData[i]['OriginalData']);

                        var left = e.pageX - off.left - that.Direction.L,
                            isleft = left < that.OriWidth / 2;
                        that.ToolTip.css({
                            right: isleft ? "auto" : that.OriWidth - left,
                            left: isleft ? left : "auto",
                            top: e.pageY - off.top - 55
                        }).show();
                    } else {
                        that.ToolTip.fadeOut(200);
                    }
                });

                that.ToolTipWrap.mouseout(function () {
                    that.ToolTip.fadeOut();
                });
            } else if (that.opt.FullMode) {
                that.ToolTip.addClass("ChartToolTipMobile");
                that.ToolTipWrap.tabMobile(function (e) {
                    var mouseX = e.pageX - offsetA.left;
                    var mouseY = e.pageY - offsetA.top;
                    var i = that.pointInPolygon(mouseX, mouseY);

                    if (i != -1) {
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;

                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleHeight);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                        that.cxtF.save();
                        that.cxtF.translate(that.Direction.L, that.Direction.T);
                        that.cxtF.globalAlpha = 0.2;
                        that.cxtF.beginPath();
                        that.cxtF.moveTo(that.chartData[i]['TLPoint'].x, that.chartData[i]['TLPoint'].y);
                        that.cxtF.lineTo(that.chartData[i]['TRPoint'].x, that.chartData[i]['TRPoint'].y);
                        if (!!that.chartData[i]['MRPoint']) {
                            that.cxtF.lineTo(that.chartData[i]['MRPoint'].x, that.chartData[i]['MRPoint'].y);
                        }
                        that.cxtF.lineTo(that.chartData[i]['BRPoint'].x, that.chartData[i]['BRPoint'].y);
                        that.cxtF.lineTo(that.chartData[i]['BLPoint'].x, that.chartData[i]['BLPoint'].y);
                        if (!!that.chartData[i]['MLPoint']) {
                            that.cxtF.lineTo(that.chartData[i]['MLPoint'].x, that.chartData[i]['MLPoint'].y);
                        }
                        that.cxtF.fillStyle = '#fff';
                        that.cxtF.fill();

                        that.cxtF.restore();

                        that.TipName.text(that.chartData[i]['discri']);
                        that.TipData.text(that.chartData[i]['Category'] + '：' + that.chartData[i]['OriginalData']);
                        var off = $(this).offset();
                        var left = e.pageX - off.left - that.Direction.L,
                            isleft = left < that.OriWidth / 2;
                        that.ToolTip.css({
                            right: isleft ? "auto" : that.OriWidth - left,
                            left: isleft ? left : "auto",
                            top: e.pageY - off.top - 55
                        }).show();

                        that.TimeOut = window.setTimeout(function () {
                            that.TimeOut = null;
                            that.ToolTip.hide();
                            that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                            that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                        }, HideSec);
                    }
                    else {
                        that.TimeOut && window.clearTimeout(that.TimeOut);
                        that.TimeOut = null;
                        that.ToolTip.hide();
                        that.cxtF.clearRect(0, 0, that.scaleWidth, that.scaleWidth);
                        that.cxtF.drawImage(that.cacheF, 0, 0, that.opt.Width, that.opt.Height);
                    }

                    doClick(e, that.canvasF);
                });
            }
        },
        pointInPolygon: function (x, y) {
           // debugger
            var that = this;
            x -= that.Direction.L || parseInt($(that.canvasF).css("left")), y -= +that.Direction.T || parseInt($(that.canvasF).css("top"));
            for (var k = 0, len = that.chartData.length; k < len; k++) {
                var px = x,
                    py = y,
                    flag = false;
                var poly = that.chartData[k]['poly'];
                for (var i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
                    var sx = poly[i].x,
                        sy = poly[i].y,
                        tx = poly[j].x,
                        ty = poly[j].y
                    // 点与多边形顶点重合
                    if ((sx === px && sy === py) || (tx === px && ty === py)) {
                        return 'on'
                    }
                    // 判断线段两端点是否在射线两侧
                    if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
                        // 线段上与射线 Y 坐标相同的点的 X 坐标
                        var x = sx + (py - sy) * (tx - sx) / (ty - sy)
                        // 点在多边形的边上
                        if (x === px) {
                            return 'on'
                        }
                        // 射线穿过多边形的边界
                        if (x > px) {
                            flag = !flag
                        }
                    }
                }
                if (flag) {
                    return k;
                }
            }
            return -1;
        },
        getAlign: function (angel) {
            var per = Math.PI / 2;
            if (angel > per * 3 || angel < per) {
                return 'left';
            } else if (angel > per && angel < per * 3) {
                return 'right';
            }
        },
        Refresh: function (data) {
            var that = this;
            that.AnimationID && window.cancelAnimationFrame(that.AnimationID);
        }
    }

    $.fn.Chart = function () {
        var target = $(this);
        return new Chart(target);
    }

    function drawBackGrid(that) {
        that.Axis = new ChartAxis(that);
        that.opt.Max = that.Axis.yLabels[that.Axis.steps - 1];
        that.opt.Min = that.Axis.yLabels[0];
        

        that.cxtBack.clearRect(0, 0, that.canvasBack.width, that.canvasBack.height);
        that.cxtBack.save();
        that.cxtBack.strokeStyle = '#ddd';
        that.cxtBack.fillStyle = "#000";
        that.cxtBack.font = '12px Microsoft YaHei';
        var scaleHeight = that.DrawHeight = that.Axis.endPoint - that.Axis.startPoint;
        var scaleWidth = that.DrawWidth = that.Axis.xLabelWidth * that.opt.CateLength;
        var perH = scaleHeight / that.Axis.steps,
            perW = that.Axis.xLabelWidth;
        that.opt.Max = Math.max.apply(null, that.Axis.yLabels);

        that.formatData();

        that.cxtBack.save();
        that.cxtBack.translate(bitwise(that.Axis.yLabelWidth), bitwise(that.Axis.startPoint));
        that.cxtBack.lineWidth = 1;
        //绘制最底部X轴
        that.cxtBack.beginPath();
        that.cxtBack.moveTo(0, scaleHeight);
        that.cxtBack.lineTo(scaleWidth, scaleHeight);
        that.cxtBack.stroke();
        //绘制底部X轴上的刻度线
        //that.cxtBack.lineWidth = 1;
        for (var i = 0; i <= that.showLength; i++) {
            that.cxtBack.beginPath();
            that.cxtBack.moveTo(perW * i, scaleHeight);
            that.cxtBack.lineTo(perW * i, scaleHeight + 6);
            that.cxtBack.stroke();
        }
        //h绘制X坐标虚线
        that.cxtBack.setLineDash && that.cxtBack.setLineDash([1, 2]);
        that.cxtBack.beginPath();
        //画X轴
        for (var i = 0; i < that.Axis.steps; i++) {
            that.cxtBack.moveTo(0, perH * i);
            that.cxtBack.lineTo(scaleWidth, perH * i);
        }
        that.cxtBack.stroke();
        that.cxtBack.restore();
        //绘制纵坐标文本值
        that.cxtBack.save();
        that.cxtBack.translate(0, that.Axis.startPoint);
        that.cxtBack.textAlign = 'right';
        that.cxtBack.textBaseline = 'middle';
        for (var i = 0; i <= that.Axis.steps; i++) {
            that.cxtBack.fillText(that.Axis.yLabels[i], that.Axis.yLabelWidth - 2, (that.Axis.steps - i) * perH);
        }
        that.cxtBack.restore();

        //绘制横坐标
        that.cxtBack.textBaseline = "top";
        if (that.Axis.xLabelRotation > 0) {
            that.cxtBack.save();
            that.cxtBack.textAlign = "right";
        } else {
            that.cxtBack.textAlign = "center";
        }

        var y = that.Axis.endPoint + 4;
        // that.Axis.xLabelRotation == 0 && (y += 3);
        var xlabel = that.Axis.xLabels;
        for (var i = 0, l = xlabel.length; i < l; i++) {
            if (that.Axis.xLabelRotation > 0) {
                that.cxtBack.save();
                if (that.Axis.xLabelRotation >= 60) {
                    that.cxtBack.translate(that.TextPos[i] - that.fontSize * 0.5, y);
                } else if (that.Axis.xLabelRotation >= 20) {
                    that.cxtBack.translate(that.TextPos[i] + that.Axis.xLabelWidth / 2 - that.fontSize * 1, y);
                } else {
                    that.cxtBack.translate(that.TextPos[i] + that.Axis.xLabelWidth / 2 - that.fontSize * 0.5, y);
                }
                that.cxtBack.rotate(-(that.Axis.xLabelRotation * (Math.PI / 180)));
                that.cxtBack.fillText(xlabel[i], 0, 0);
                that.cxtBack.restore();
            } else {
                that.cxtBack.fillText(xlabel[i], that.TextPos[i], y);
            }
        }
        that.cxtBack.restore();
    }

    function ChartAxis(that) {
        this.fontSize = 12;
        this.height = that.opt.Height;
        this.width = that.opt.Width;
        this.font = '12px Microsoft YaHei'
        this.ctx = that.cxtBack;
        //this.min = that.opt.Min;
        //this.max = that.opt.Max;
        this.getMax(that);
        this.st = Math.max(that.opt.Categories ? that.opt.Categories.length:5,that.opt.Series ? that.opt.Series.length:5);
        this.st = this.st < 5? 5 : (this.st>10?10:this.st);
        //to do 最大最小值重新计算
        this.xLabels = that.opt.Categories.slice(that.showIndex, that.showIndex + that.showLength);
        //console.log(this.xLabels);
        this.fit();
    }
    ChartAxis.prototype = {
        fit: function (that) {
            this.startPoint = this.fontSize;
            this.endPoint = this.height - (this.fontSize * 1.5);

            var cachedHeight = this.endPoint - this.startPoint,
                cachedYLabelWidth;
            //this.calculateScaleRange(this.max, this.min, cachedHeight, this.fontSize, false);
            this.StandardY(this.max, this.min, this.st);

            this.buildYLabels();
            this.calculateXLabelRotation();

            //while ((cachedHeight > this.endPoint - this.startPoint)) {
            //    cachedHeight = this.endPoint - this.startPoint;
            //    cachedYLabelWidth = this.yLabelWidth;
            //    this.calculateScaleRange(this.max, this.min, cachedHeight, this.fontSize, false);
            //    this.buildYLabels();

            //    if (cachedYLabelWidth < this.yLabelWidth) {
            //        this.calculateXLabelRotation();
            //    }
            //}
            this.formatValue();
        },

        getMax: function (that) {
            this.max = this.min = 0;
            if (that.opt && that.opt.Series) {
                for (var i = 0, len = that.opt.Series.length; i < len; i++) {
                    var seri = that.opt.Series[i].Data,
                        max = Math.max.apply(null, seri),
                        min = Math.min.apply(null, seri);
                    this.max = this.max > max ? this.max : max;
                    this.min = this.min > min ? min : this.min;
                }
            }
            if (this.max == this.min)
            {
                this.max = this.min + 10;
            }
        },

        StandardY: function (max, min, steps) {
            var k = max.toString(), tmpmin = min,
                l = k.indexOf(".");
            l = l < 0 ? 0 : (k.length - k.indexOf(".") - 1);
            max = Math.ceil(max * Math.pow(10, l));
            min = Math.floor(min * Math.pow(10, l));
            var tmax = max, tmin = min;

            var tmpmax, tmpmin, corstep, tmpstep, tmpnumber, temp, extranumber;
            if (max <= min)
                return;
            corstep = (max - min) / steps;
            if (Math.pow(10, parseInt(Math.log(corstep) / Math.log(10))) == corstep) {
                temp = Math.pow(10, parseInt(Math.log(corstep) / Math.log(10)));
            } else {
                temp = Math.pow(10, (parseInt(Math.log(corstep) / Math.log(10)) + 1));
            }
            tmpstep = (corstep / temp).toFixed(6);
            //选取规范步长
            if (tmpstep >= 0 && tmpstep <= 0.1) {
                tmpstep = 0.1;
            } else if (tmpstep >= 0.100001 && tmpstep <= 0.2) {
                tmpstep = 0.2;
            } else if (tmpstep >= 0.200001 && tmpstep <= 0.25) {
                tmpstep = 0.25;
            } else if (tmpstep >= 0.250001 && tmpstep <= 0.5) {
                tmpstep = 0.5
            } else {
                tmpstep = 1;
            }
            tmpstep = tmpstep * temp;
            if (parseInt(min / tmpstep) != (min / tmpstep)) {
                if (min < 0) {
                    min = (-1) * Math.ceil(Math.abs(min / tmpstep)) * tmpstep;
                } else {
                    min = parseInt(Math.abs(min / tmpstep)) * tmpstep;
                }

            }
            if (parseInt(max / tmpstep) != (max / tmpstep)) {
                max = parseInt(max / tmpstep + 1) * tmpstep;
            }
            tmpnumber = (max - min) / tmpstep;
            if (tmpnumber < steps) {
                extranumber = steps - tmpnumber;
                tmpnumber = steps;
                if (extranumber % 2 == 0) {
                    max = max + tmpstep * parseInt(extranumber / 2);
                } else {
                    max = max + tmpstep * parseInt(extranumber / 2 + 1);
                }
                min = min - tmpstep * parseInt(extranumber / 2);
            }
            steps = tmpnumber;
            var stepValue = (max - min) / steps;

            //坐标数据优化
            if (min < 0 && tmpmin >=0) {
                min = 0;
                steps = Math.ceil(max / stepValue);
                max = steps * stepValue;
            }

            var t = max - tmax;
            while (t > stepValue) {
                max -= stepValue;
                steps--;
                t = max - tmax;
            }
            var m = tmin - min;
            while (m > stepValue) {
                min += stepValue;
                steps--;
                m = tmin - min;
            }

            stepValue = stepValue / Math.pow(10, l);
            max /= Math.pow(10, l), min /= Math.pow(10, l)

            this.steps = steps;
            this.stepValue = stepValue;
            this.min = min;
            this.max = max;
        },

        formatValue: function () {
            this.yLabelWidth += 6;
            this.xScalePaddingRight = 6;
            this.endPoint = bitwise(this.height - this.fontSize * 1.5 - Math.sin(toRadians(this.xLabelRotation)) * this.longestlabelText - 4);
            this.endPoint = bitwise(this.endPoint < this.height / 2 ? this.height / 2 : this.endPoint);
            this.xLabelRotation === 0 && (this.endPoint -= 5);
            this.xLabelWidth = (this.width - this.xScalePaddingRight - this.yLabelWidth) / this.xLabels.length;
        },

        buildYLabels: function () {
            this.yLabels = [];

            var stepDecimalPlaces = this.getDecimalPlaces(this.stepValue);

            for (var i = 0; i <= this.steps; i++) {
                this.yLabels.push((this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces));
            }
            this.yLabelWidth = this.longestText(this.ctx, this.font, this.yLabels);
        },

        //计算x坐标轴的偏向角和距离
        calculateXLabelRotation: function () {
            this.ctx.font = this.font;

            var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
                lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
                firstRotated,
                lastRotated;

            this.xScalePaddingRight = lastWidth / 2 + 3;
            this.xScalePaddingLeft = (firstWidth / 2 > this.yLabelWidth + 10) ? firstWidth / 2 : this.yLabelWidth + 10;

            this.xLabelRotation = 0;
            var originalLabelWidth = this.longestText(this.ctx, this.font, this.xLabels),
                cosRotation,
                firstRotatedWidth;
            this.xLabelWidth = this.longestlabelText = originalLabelWidth;

            var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

            while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)) {
                cosRotation = Math.cos(toRadians(this.xLabelRotation));

                firstRotated = cosRotation * firstWidth;
                lastRotated = cosRotation * lastWidth;

                if (firstRotated + this.fontSize / 2 > this.yLabelWidth + 8) {
                    this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
                }
                this.xScalePaddingRight = this.fontSize / 2;

                this.xLabelRotation++;
                this.xLabelWidth = cosRotation * originalLabelWidth;

            }
            if (this.xLabelRotation > 0) {
                this.endPoint -= Math.sin(toRadians(this.xLabelRotation)) * originalLabelWidth + 3;
            }
        },

        calculateX: function (index) {
            var isRotated = (this.xLabelRotation > 0),
                // innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
                innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                valueWidth = innerWidth / (this.xLabels.length - ((this.offsetGridLines) ? 0 : 1)),
                valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

            if (this.offsetGridLines) {
                valueOffset += (valueWidth / 2);
            }

            return Math.round(valueOffset);
        },

        //calculateScaleRange: function (maxValue, minValue, drawingSize, textSize, integersOnly) {
        //    var minSteps = 2,
        //        maxSteps = Math.floor(drawingSize / (textSize * 1.5)),
        //        skipFitting = (minSteps >= maxSteps);

        //    if (maxValue === minValue) {
        //        maxValue += 0.5;
        //        if (minValue >= 0.5) {
        //            minValue -= 0.5;
        //        } else {
        //            maxValue += 0.5;
        //        }
        //    }

        //    var valueRange = Math.abs(maxValue - minValue),
        //        rangeOrderOfMagnitude = this.calculateOrderOfMagnitude(valueRange),
        //        graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
        //        graphMin = Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
        //        graphRange = graphMax - graphMin,
        //        stepValue = Math.pow(10, rangeOrderOfMagnitude),
        //        numberOfSteps = Math.round(graphRange / stepValue);

        //    while ((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
        //        if (numberOfSteps > maxSteps) {
        //            stepValue *= 2;
        //            numberOfSteps = Math.round(graphRange / stepValue);

        //            if (numberOfSteps % 1 !== 0) {
        //                skipFitting = true;
        //            }
        //        } else {
        //            if (integersOnly && rangeOrderOfMagnitude >= 0) {
        //                if (stepValue / 2 % 1 === 0) {
        //                    stepValue /= 2;
        //                    numberOfSteps = Math.round(graphRange / stepValue);
        //                } else {
        //                    break;
        //                }
        //            } else {
        //                stepValue /= 2;
        //                numberOfSteps = Math.round(graphRange / stepValue);
        //            }

        //        }
        //    }

        //    if (skipFitting) {
        //        numberOfSteps = minSteps;
        //        stepValue = graphRange / numberOfSteps;
        //    }
        //    this.steps = numberOfSteps;
        //    this.stepValue = stepValue;
        //    this.min = graphMin;
        //    this.max = graphMin + (numberOfSteps * stepValue);

        //},

        calculateOrderOfMagnitude: function (val) {
            return Math.floor(Math.log(val) / Math.LN10);
        },

        getDecimalPlaces: function (num) {
            if (num % 1 !== 0 && isNumber(num)) {
                return num.toString().split(".")[1].length;
            } else {
                return 0;
            }
        },

        longestText: function (ctx, font, arrayOfStrings) {
            ctx.font = font;
            var longest = 0;
            for (var i = 0, len = arrayOfStrings.length; i < len; i++) {
                var textWidth = ctx.measureText(arrayOfStrings[i]).width;
                longest = (textWidth > longest) ? textWidth : longest;
            }
            return longest;
        }
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    function setCanvasCfg(context, opt) {
        if (window.devicePixelRatio) {
            context.canvas.style.width = opt.Width + "px";
            context.canvas.style.height = opt.Height + "px";
            context.canvas.height = opt.Height * window.devicePixelRatio;
            context.canvas.width = opt.Width * window.devicePixelRatio;
            context.scale(window.devicePixelRatio, window.devicePixelRatio);
        } else {
            context.canvas.height = opt.Height;
            context.canvas.width = opt.Width;
        }
    }

    //判断是否是移动端
    function isMobile() {
        if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
            return true;
        }
        return false;
    }

    $.fn.tabMobile = function (fn) {
        this[0].addEventListener('touchstart', function (e) {
            $(this).data('start', e);
            $(this).data('end', null);
        }, false);

        this[0].addEventListener('touchmove', function (e) {
            $(this).data('end', e);
        }, false);

        this[0].addEventListener('touchend', function (event) {
            var s = $(this).data('start');
            if (!s) return;
            var se = s.touches[0];
            var e = $(this).data('end');
            var ee = e && e.touches[0];
            if (se) {
                if (ee) {

                    if (Math.abs(se.pageX - ee.pageX) < 7 && Math.abs(se.pageY - ee.pageY) < 7) {
                        fn && fn(se);
                        event.preventDefault();
                    }
                } else {
                    fn && fn(se);
                    event.preventDefault();
                }
            }
        })
    }

    function base64Img2Blob(code) {
        var parts = code.split(';base64,');
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;

        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    }

    function downloadFile(fileName, content) {
        var aLink = document.createElement('a');
        var blob = base64Img2Blob(content); //new Blob([content]);
        // var blob = new Blob([content]);
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, false); //initEvent 不加后两个参数在FF下会报错
        aLink.download = fileName;
        aLink.href = URL.createObjectURL(blob);

        aLink.dispatchEvent(evt);
    }

    function isInteger(val) {
        return (val | 0) === val;
    }

    //启用下载功能
    function showDownload(that) {
        if (!that.opt.ShowDownLoad) return;
        var $btn = $("<span style='width:34px; height:22px; line-height:22px; font-size: 12px; border-radius:3px; background:#429CF3; color:#fff; text-align:center; position: absolute; top:1px; right:1px; cursor:pointer'>下载</span>");
        that.wrap.append($btn);
        $btn.click(function (event) {
            var type = "image/png";
            var canvas = that.canvasF;
            downloadFile("报表", canvas.toDataURL(type));
        });
    }

    function bitwise(k) {
        return (k + 0.5) << 0;
    }

    function slider(tar) {
        
        this.target = tar.canvasF;
        this.tarBack = tar.canvasBack;
        this.tabControl = tar.ToolTipWrap[0];
        this.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        this.startPos = {};
        this.range = this.target.offsetWidth - $(this.target).parent("div").width();
        this.toprange = this.target.offsetHeight - $(this.target).parent("div").height();

        if (this.range <= 0 && this.toprange <=0) return;
        tar.opt.IsMobile ? this.bindMobileEvent() : this.bindPcEvent();
    }

    slider.prototype = {
        bindMobileEvent: function() {
            var that = this;

            that.tabControl.addEventListener("touchstart", start, false);

            function start(event) {
            	//console.log("start");
                var touch = event.targetTouches[0];
                that.startPos = {
                    x: touch.pageX,
                    y: touch.pageY
                }
                that.startleft = parseInt(that.target.style.left || 0);
                that.starttop = parseInt(that.target.style.top || 0);
                that.tabControl.addEventListener('touchmove', moveM, false);
                that.tabControl.addEventListener('touchend', endM, false);
            }

            function moveM(event) {
                // 当屏幕有多个touch或者页面被缩放过， 就不执行move操作
                if (event.targetTouches.length > 1 || event.scale && event.scale !== 1) return;
                var touch = event.targetTouches[0];
                var endPos = {
                    x: touch.pageX - that.startPos.x,
                    y: touch.pageY - that.startPos.y
                };
                //isScrolling = Math.abs(endPos.x) < Math.abs(endPos.y) ? 1 : 0; //isScrolling为1时，表示纵向滑动，0为横向滑动
                if ( Math.abs(endPos.x) > 5) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
                    var left = that.startleft + endPos.x;
                    left = left >= 0 ? 0 : (left < -that.range ? -that.range : left);
                    //console.log(left);
                    that.target.style.left = left + 'px';
                    that.tarBack && (that.tarBack.style.left = left + 'px');
                }
                if (Math.abs(endPos.y) > 5) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
                    var top = that.starttop + endPos.y;
                    top = top >= 0 ? 0 : (top < -that.toprange ? -that.toprange : top);
                    that.target.style.top = top + 'px';
                    that.tarBack && (that.tarBack.style.top = top + 'px');
                }
            }

            function endM(event) {
            	//console.log("end");
                //解绑事件
            	that.tabControl.removeEventListener('touchmove', moveM, false);
            	that.tabControl.removeEventListener('touchend', endM, false);
            }
        },
        bindPcEvent: function () {
            var that = this;
            that.tabControl = $(that.tabControl);

            that.tabControl.bind("mousedown.chart", start);

            function start(e) {
                //console.log("start");
                e = e || window.event;
                that.startPos = {
                    x: e.pageX,
                    y: e.pageY
                }
                that.startleft = parseInt(that.target.style.left || 0);
                that.starttop = parseInt(that.target.style.top || 0);
                that.tabControl.bind('mousemove.chart', move);
                $(window).bind('mouseup.chart', end);
            }

            function move(e) {
                e = e || window.event;
                e.preventDefault(); // 阻止选中文本
                var endPos = {
                    x: e.pageX - that.startPos.x,
                    y: e.pageY - that.startPos.y
                };
                if (Math.abs(endPos.x) > 5) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
                    var left = that.startleft + endPos.x;
                    left = left >= 0 ? 0 : (left < -that.range ? -that.range : left);
                    //console.log(left);
                    that.target.style.left = left + 'px';
                    that.tarBack && (that.tarBack.style.left = left + 'px');
                }
                if (Math.abs(endPos.y) > 5) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
                    var top = that.starttop + endPos.y;
                    top = top >= 0 ? 0 : (top < -that.toprange ? -that.toprange : top);
                    that.target.style.top = top + 'px';
                    that.tarBack && (that.tarBack.style.top = top + 'px');
                }
            }

            function end(event) {
                //console.log("end");
                //解绑事件
                that.tabControl.unbind('mousemove.chart', move);
                $(window).unbind('mouseup.chart', end);
            }
        }
    }

    function sliderBar(tar) {
        if (!!tar) {
            this.chart = tar;
            this.tabControl = this.chart.opt.IsMobile ? this.chart.ToolTipWrap[0] : this.chart.ScrollWrap;
            this.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
            this.startPos = {};
            this.showIndex = this.chart.showIndex;
            this.range = this.chart.range;

            if (this.range <= 0) return;
            this.chart.opt.IsMobile ? this.bindMobileEvent() : this.bindPcEvent();
        }
    }
    sliderBar.prototype = {
        bindMobileEvent: function () {
            var that = this;

            that.tabControl.addEventListener("touchstart", start, false);
            that.SlideGap = 30;

            function start(event) {
                //console.log("start");
                var touch = event.targetTouches[0];
                that.startPos = {
                    x: touch.pageX,
                    y: touch.pageY
                }
                that.tabControl.addEventListener('touchmove', move, false);
                that.tabControl.addEventListener('touchend', end, false);
            }

            function move(event) {
                // 当屏幕有多个touch或者页面被缩放过， 就不执行move操作
                if (event.targetTouches.length > 1 || event.scale && event.scale !== 1) return;
                var touch = event.targetTouches[0];
                endPos = {
                    x: touch.pageX - that.startPos.x,
                    y: touch.pageY - that.startPos.y
                };
                isScrolling = Math.abs(endPos.x) < Math.abs(endPos.y) ? 1 : 0; //isScrolling为1时，表示纵向滑动，0为横向滑动
                if (isScrolling === 0 && Math.abs(endPos.x) > that.SlideGap) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
           
                    var index = endPos.x > 0 ? Math.floor(endPos.x / that.SlideGap) : Math.ceil(endPos.x / that.SlideGap);
                    index = that.showIndex - index;
                    //console.log(index);
                    if (index == that.chart.showIndex || index < 0 || index > that.range) return;
                    that.chart.showIndex = index;
                    that.chart.Slider.call(that.chart);
                }
            }

            function end(event) {
                //console.log("end");
                //解绑事件
                that.showIndex = that.chart.showIndex;
                that.tabControl.removeEventListener('touchmove', move, false);
                that.tabControl.removeEventListener('touchend', end, false);
            } 
        },
        bindPcEvent: function () {
            var that = this;
            that.per = that.tabControl.width() / that.chart.ScrollStep;
            var left = that.tabControl.offset().left;

            that.ScrollIcon = that.chart.ScrollIcon;
            that.ScrollIcon.bind("mousedown.chartscroll", start);

            that.chart.ScrollWrap.bind("click.chartscroll", function (e) {
                var dx = e.pageX - $(this).offset().left - that.per
                var index = Math.round(dx / that.per);

                if (index == that.chart.showIndex || index < 0 || index > that.range) return;
                that.chart.showIndex = index;
                that.showIndex = that.chart.showIndex;
                that.chart.Slider.call(that.chart);
                var w = that.per * (that.showIndex + 1);
                that.chart.ScrollBar.width(w);
                that.chart.ScrollIcon.css("left", w);
            });

            function start(e) {
                //console.log("start");
                that.chart.unbind.call(that.chart);
                e = e || window.event;
                that.startPos = {
                    x: e.pageX,
                    y: e.pageY
                }

                $(window).bind('mouseup.chartscroll', end);
                $(window).bind("mousemove.chartscroll", move);

                return false;
            }

            function move(e) {
                e = e || window.event;
                e.preventDefault(); // 阻止选中文本
                var endPos = {
                    x: e.pageX - that.startPos.x
                };

                if (endPos.x != 0) {
                    var w = e.pageX - left;
                    if (w < that.per) return;
                    that.chart.ScrollBar.width(w);
                    that.chart.ScrollIcon.css("left", w);
                }

                if (Math.abs(endPos.x) > that.per/2) {
                    event.preventDefault(); //阻止触摸事件的默认行为，即阻止滚屏
                    var index = Math.round(endPos.x / that.per);
                    index = that.showIndex + index;
                    //console.log(index);
                    if(index== that.chart.showIndex || index <0 || index > that.range) return;
                    that.chart.showIndex = index;
                    that.chart.Slider.call(that.chart);
                }
            }

            function end(event) {
                //console.log("end");
                //解绑事件
                that.chart.bind.call(that.chart);
                that.showIndex = that.chart.showIndex;
                var w = that.per *  (that.showIndex + 1);
                that.chart.ScrollBar.width(w);
                that.chart.ScrollIcon.css("left", w);
                $(window).unbind('mouseup.chartscroll');
                $(window).unbind("mousemove.chartscroll");

            }
        }
    }
}(jQuery));
//requestAnimationFrame  全兼容模式
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz', 'o', 'ms'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };

    var $ToolTip = $('<div class="tool-tip" style="display: none;"></div>').appendTo($("body"));
    $("body").off("mouseenter.charttip").on("mouseenter.charttip", "i.BarTip", function () {
       // debugger
        var $that = $(this);
        var offset = $that.offset();
        $ToolTip.html($that.attr("data-text")).css({ left: offset.left + ($that.outerWidth() - $ToolTip.outerWidth()) / 2 - $(window).scrollLeft(), bottom: $(window).height() - offset.top + 6 + $(window).scrollTop() }).toggle();
        return false;
    });

    $("body").off("mouseleave.charttip").on("mouseleave.charttip", ".BarTip", function () {
        $ToolTip.hide();
    });
}());
