var ReportDetail = function (opt, container) {
    var DefaultOpts = {
        data: null,
        columns: [],
        reportWidget:null,
        dragCallBack: null
    };
    this.opt = $.extend({}, DefaultOpts, opt);
    this.Container = container;
    this.Table =  $('<table class="detail"></table>');
    this.ReportWidget = opt.reportWidget;
    this.init(this.opt);
    this.loader = true;
}

ReportDetail.prototype = {
    init: function (opt) {
        var that = this;
        this.Container.empty();
        this.Container.append(this.Table);        
        this.Table.css({
            width: this.Container.width(),
            height: this.Container.height()-15
        });
        that.isDragMouseUp = true; //判断是是否鼠标拖拽时释放事件
        //绑定事件
        //1、先不处理交换顺序
        if (this.loader)
        {
            this.loader = false;
            that.bindDrag();
        }
        //2、处理交换顺序
        if (opt.columns.length == 0 && !opt.data) {
            that.drawTemplateDetail();
        } else {
            that.drawDetail({datas:opt.data,columns:opt.columns});
            //that.Table.bootstrapTable({ data: opt.data, columns: opt.columns, height: that.Container.height() - 10 });
        }
    },
    bindDrag: function () {
        var that = this;
        that.Table.on('mousemove', function (ev) {
            if (!$(this).hasClass('over')) {
                $(this).addClass('over');
            }
        });

        that.Table.on('mouseout', function () {
            if ($(this).hasClass('over')) {
                $(this).removeClass('over');
            }
        });

        //判断是否是拖拽释放
        that.Table.on('mousedown', function (ev) {
            that.isDragMouseUp = false;

        });

        //拖拽释放绑定事件
        that.Table.on('mouseup', function (e) {
            $(this).hasClass('over') && $(this).removeClass('over');

            if (that.isDragMouseUp === false) {
                that.isDragMouseUp = true;
                return false;
            }

            //此处破坏掉bootstraptable
            $(this).bootstrapTable('destroy');

            if (!that.opt.dragCallBack) {
                return;
            }
            //执行回调函数，返回数据
            var data = that.opt.dragCallBack();
            that.drawDetail(data);
        });
    },
    mouseUp: function (ev) {
        
        var that = this;
        //此处破坏掉bootstraptable
        if (!that.opt.dragCallBack) {
            return;
        }
        //执行回调函数，返回数据
        var data = that.opt.dragCallBack();
        if (data) {
            that.Table.bootstrapTable('destroy');
            that.drawDetail(data);
        }
    },
    //绘制模板数据
    drawTemplateDetail: function () {
        var that = this;
        that.Table.bootstrapTable('destroy');
        if (that.ReportWidget.DefaultData1 && that.ReportWidget.DefaultData2)
        {
            that.Table.bootstrapTable({
                columns: that.ReportWidget.DefaultData1,
                data: that.ReportWidget.DefaultData2
            });
        }
        else
        {
            that.Table.bootstrapTable({
                columns: ReportDefaultData[7]["data1"],
                data: ReportDefaultData[7]["data2"]
            });
        }
        
    },
    //数据结构{data:datas,columns:[]}
    drawDetail: function (data) {
        var that = this;
        that.Table.bootstrapTable({ data: data.datas, columns: data.columns, height: that.Container.height() - 40 });
    }
};

