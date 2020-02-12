(function ($) {
    var hasDown = false;
    var SimpleDrag = function (target) {
        var content = $('#content')
       
        target.mousedown(function (e) {
            if (hasDown) return;
            var that = $(this);
            //if (that.hasClass('field-select')) return;//已经被使用的字符不允许拖动
            if ($(e.target).hasClass('fa-edit')) return;//todo  待定
            hasDown = true;
            var offset = that.offset();
            if (that.hasClass('field')) {
                //如果不可拖到当前正在编辑的图形，则返回
                if ($(that).closest('li.source').hasClass('disabled')) {
                    hasDown = false;
                    return;
                   
                }

                //if (!$.ReportDesigner.EditingWidget) {
                //    return;
                //}
                if (that.attr('data-code') == 'DefaultCountCode') {
                    if (!$.ReportDesigner.EditingWidget || ($.ReportDesigner.EditingWidget && $.ReportDesigner.EditingWidget.WidgetType == _DefaultOptions.WidgetType.Detail))
                    {
                        hasDown = false;
                        return;
                    }
                }
                //这里改变拖拽图形的形状；
                $.ReportDesigner.DragItem = $('<li class="targetItem field" data-datatype="' + that.attr('data-datatype') + '" data-code="' + that.attr('data-code') + '" data-parentcode="' + that.attr('data-parentcode') + '">' + that.attr('data-displayname') + '</li>');
                $.ReportDesigner.CurrentDragField = { 'Code': that.attr('data-code'), 'DisplayName': that.attr('data-name'), 'DataType': that.attr('data-datatype'), 'DisplayName': that.attr('data-displayname'), 'Formula': that.attr('data-formula'), 'SourceId': that.closest('li.source').attr('data-sourceid'), 'AssociationSchemaCode': that.attr('data-associationschemaCode'), 'OptionalValues': that.attr('data-optionalvalues'),'DataDictItemName':that.attr("data-datadictitemname") };
            } else {
                $.ReportDesigner.DragItem = $('<li class="targetItem template" data-displayname="' + that.attr('data-displayname') + '" data-widgettype="' + that.attr('data-widgettype') + '"><span  class="' + that.attr('data-icon') + '"></span>' + that.attr('data-displayname') + '</li>');
                $.ReportDesigner.CurrentDrag = $.ReportDesigner.DragItem;
            }
            $.ReportDesigner.DragItem.css({
                left: offset.left,
                top: offset.top
            });
            //判断是否已经存在了，如果存在就不添加
            if (that.parent().find('li.targetItem').length > 0) return;
            that.parent().append($.ReportDesigner.DragItem);
            $(document).bind('mousemove', function (ev) {
                ev.preventDefault();
                //var _x = ev.pageX - 100;
                //var _y = ev.pageY - 30;
                var _x = ev.clientX - 100;
                var _y = ev.clientY - 30;
                if ($.ReportDesigner.DragItem) {
                    $.ReportDesigner.DragItem.css({
                        left: _x + 'px',
                        top: _y + 'px'
                    });
                }
                
            });
            $(document).one('mouseup', function () {
                if (hasDown) {
                    hasDown = false;
                    $('li.targetItem').remove();
                    if ($.ReportDesigner.DragItem) {
                        $.ReportDesigner.DragItem = null;
                    }
                    $(this).unbind('mousemove');
                }
            });
        });

        

    };
    /*
     *  @param callback  拖动回调函数
     *  @param postData [key]  拖动传递的数据
    
    */
    $.fn.SimpleDrag = function () {
        return new SimpleDrag(this);
    }
}(jQuery))