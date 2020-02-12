/// <reference path="SheetDesigner.js" />
/// <reference path="SheetDesigner.PropertyPanel.js" />
/// <reference path="SheetDesigner.ClipBoard.js" />

var DesignElem = function (target, workSheetProperty) {
    //目标元素
    this.Target = target;
    //属性,使用空的对象
    this.Property = Designer.SelectedCtrlProperty;
    //增加设计行为
    this.Target.Designable();
};

DesignElem.prototype = {
    Bind: function () {
        this.Target.attr("property", JSON.stringify(this.Property));
        this.Target.attr("id", this.Property.Id);
    }
}

//设计行为插件
; (function ($) {
    $.fn.Designable = function (options) {
        var defaults = {
            AllowContextMenu: true
        }
        var options = $.extend(defaults, options);

        this.each(function () {
            var _elem = $(this);
            if (_elem.hasClass("_subTab")) return; // 直接点击子表，不绑定子表属性，需要点击属性区域
            //增加鼠标点击事件,点击后在属性面板显示属性信息
            _BindClickEvent(_elem);

            if (options.AllowContextMenu) {
                // 增加鼠标右键菜单功能
                _BindContextMenuEvent(_elem);
            }
        });

        //绑定鼠标点击事件
        function _BindClickEvent(obj) {
            obj.unbind("click.Design").bind("click.Design", function (e) {
                //移除其余元素选中状态,显示当前元素选中状态
                $("*").removeClass("selected");
                $(this).addClass("selected");
                // 阻止父元素的默认事件
                // e.preventDefault();

                //绑定属性面板信息
                var _Property = $(this).attr("property");
                var i = 0;
                while (!_Property && i < 3) {
                    var parent = i == 0 ? $(this).parent() : parent.parent();
                    _Property = parent.attr("property");
                    i++;
                }
                if (_Property) {
                    //复制给全局属性
                    Designer.SelectedCtrlProperty = JSON.parse(_Property);
                    //绑定属性面板
                    Designer.PropertyPanel.Bind();
                }
            })
                .mousedown(function (e) { // .unbind("mousedown")
                    //增加右键功能
                    if (e.which == 3) $(this).addClass("selected");
                });
        };

        //绑定鼠标右键事件
        function _BindContextMenuEvent(obj) {
            obj.unbind("contextMenu").contextMenu('mainMenu', {
                bindings: {
                    'cut': function (t) {
                        Designer.ClipBoard.Cut(t);
                        Designer.RemovePropertyToArray(t);
                    },
                    'copy': function (t) {
                        Designer.ClipBoard.Copy(t);
                    },
                    'remove': function (t) {
                        Designer.ClipBoard.Remove(t);
                        Designer.RemovePropertyToArray(t);
                    }
                }
            });
        };

    };
})(jQuery);

