(function ($) {
    // 所有的控件，都可以通过这个接口选择
    $.fn.JMobileControl = function (options) {
        var jControl;
        var args = arguments;
        $(this).each(function () {
            var $control = $(this);
            //数据项
            var datafield = $control.data($.MobileControlManager.DataFieldKey.toLocaleLowerCase());
            var controlkey = $control.data($.MobileControlManager.SheetControlKey.toLocaleLowerCase());
            if (!controlkey) {
                return jControl;
            }            
            jControl = $.MobileControlManager.Run.call($control, controlkey,[options]);
        });
        return jControl;
    };

    $.MobileControls = {};
    //控件属性
    $.MobileControls.GetDefaultOptions = function (controlKey) {
        var p = {};
        var options = FormControls[controlKey];
        if (options != null) {
            for (var key in options) {
                if (options[key].constructor == String
                    || options[key].constructor == Number
                    || options[key].constructor == Object) {
                    p[key] = options[key] || "";
                }
                else if (options[key].constructor == Array) {
                    for (var i = 0; i < options[key].length; ++i) {
                        p[options[key][i].Name] = options[key][i].DefaultValue || "";
                    }
                }
            }
        }
        return p;
    };
   
})(jQuery);
/**
* 变更成每一个页面一个管理器
*/
$.MobileControlManager = {
    //页面参数属性、事件的属性
    PreDataKey: "data-",
    //已经渲染过后的标示前缀
    SheetIDKey: "jmobilecontrolid",
    //数据项属性
    DataFieldKey: "DataField",
    //控件名称
    SheetControlKey: "controlkey",
    ControlCount:0,
    Controls: {},
    Run: function (control,args) {
        // 读取默认属性
        var p = $.MobileControls.GetDefaultOptions(control);
        if (args.length > 0) {
            // 后台属性覆盖
            $.extend(p, args[0]);
        }

        // 当前的ID
        var currentSheetIDKey = 0;
        //如果只有一个的话，就会返回
        var isOneControl = 0;

        //循环页面上的控件
        this.each(function () {
            if (!$(this).attr("data-" + $.MobileControlManager.SheetIDKey)) {
                // 控件数量加1
                $.MobileControlManager.ControlCount++;
                // 添加控件属性
                currentSheetIDKey = $.MobileControlManager.SheetIDKey + "-" + $.MobileControlManager.ControlCount.toString();
                var datafield = $(this).attr("data-" + $.MobileControlManager.DataFieldKey.toLocaleLowerCase());
                p[$.MobileControlManager.DataFieldKey] = $(this).attr("data-" + $.MobileControlManager.DataFieldKey.toLocaleLowerCase());
                $(this).attr("data-" + $.MobileControlManager.SheetIDKey, currentSheetIDKey);
                // new 控件
                $.MobileControlManager.Controls[currentSheetIDKey] = new $.MobileControls[control](this, p,null);
            }
            isOneControl++;
        });

        //如果是一个的话，返回当前控件管理器
        if (isOneControl == 1) {
            return $.MobileControlManager.Controls[$(this).attr("data-" + $.MobileControlManager.SheetIDKey)];
        }
    },
    ValueTable:{},
    GetControlValue:function(datafield){
        var $control = $('div[data-datafield="' + datafield + '"][data-jmobilecontrolid]');
        if ($control.length > 1)
        {
            var $control = $("ion-view[nav-view='active']").find('div[data-datafield="' + datafield + '"][data-jmobilecontrolid]');
        }
        if ($control.length > 0) { 
            var controlId = $control.attr('data-jmobilecontrolid');
            var value = $.MobileControlManager.Controls[controlId].GetValue();
            $.MobileControlManager.ValueTable[datafield] = value;
            return value;
        }
        return null;
    },
    SetControlValue: function (datafield, value) {
        var $control = $('div[data-datafield="' + datafield + '"][data-jmobilecontrolid]');
        var controlId = $control.attr('data-jmobilecontrolid');
        $.MobileControlManager.Controls[controlId].SetValue(value);
    },
    GetElement: function (datafiled, bizObjectId) {
        var element;
        if (datafiled.indexOf("#") == 0) {
            element = $(datafiled);
        }
        else {
            if (datafiled.indexOf('.') > -1) {
                //如果是子表，创建的时候，得先处理子表的渲染
                this.GetElement(datafiled.split('.')[0]).JControl();
            }
            if ($.isEmptyObject(bizObjectId)) {
                element = $("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "']:not(.table_th)");
            }
            else {
                element = $("[data-ObjectId='" + bizObjectId + "']").find("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "']:not(.table_th)");
            }
        }
        return element;
    },
}


/**
* 先只实现最基本的控件和基本的方法
* 文本框 数字框
*/
$.MobileControls.BaseClass = function (element, options) {
    this.Element = element;
    this.Options = options || {};

    //样式列表
    this.Css = {
        ControlTitle: "ControlTitle",
        ControlContent: "ControlContent"
    };
    //初始化参数
    this.Init();
    //绑定事件
    this.BindEvents();
    //渲染控件前函数
    this.PreRender();
    //渲染控件
    this.Render();  
}

$.MobileControls.BaseClass.prototype = {
    //初始化参数
    Init: function () {
        var g = this, p = this.Options;
        for (var key in p) {
            var elementkey = key.toLowerCase();

            if ($(g.Element).data(elementkey)) {
                if (!p[key]) {
                    p[key] = $(g.Element).data(elementkey);
                }
                else if (p[key].constructor == Boolean) {
                    p[key] = $(g.Element).data(elementkey).constructor == Boolean ?
                       $(g.Element).data(elementkey) :
                        ($(g.Element).data(elementkey).toString().toLowerCase() == "true"
                        || $(g.Element).data(elementkey).toString().toLowerCase() == "1");
                }
                else if (p[key].constructor == Number) {
                    p[key] = parseInt($(g.Element).data(elementkey));
                }
                else {
                    p[key] = $(g.Element).data(elementkey);
                }
            }
        }

        for (var key in this.Options) {
            this[key] = this.Options[key];
        }
    },

    PreRender: function () {
        var controlkey = $(this.Element).attr('data-controlkey');

        if (controlkey == "FormGridView" || controlkey == "FormBoList" || controlkey == "FormAttachement") {
            //不予支持
        } else if (controlkey == "FormUser" || controlkey == "FormCheckboxList") {
            $(this.Element).removeClass("row  form-group").addClass("item item-input item-floating-label item-icon-right");
            //根据是否可以编辑,此处添加点击事件
            var that = this;

            $(this.Element).unbind('click').bind('click', function () {
                var path = "";
                var datafield = $(this).attr('data-datafield');
                switch (controlkey) {
                    case "FormUser":
                        
                        H3Config.GlobalState.go('app.sheetuser', { field: datafield, rowid: that.ObjectId, IsQuery: true, selectionrange: that.SelectionRange, showunactive: that.ShowUnActive });
                        break;
                    case "FormCheckboxList":
                        
                        if (that.isCheckbox == "false" || that.isCheckbox == false) {
                            H3Config.GlobalState.go('app.checkboxlist', { field: datafield, rowid: that.ObjectId, IsQuery: true, selectionrange: that.SelectionRange, showunactive: that.ShowUnActive });
                        }
                        break;
                }
            });
            this.$Title = $("<span style='font-size:14px;'>" + this.DisplayName + "</span>").addClass("has-input").addClass(this.Css.ControlTitle);
            $(this.Element).append(this.$Title);
            if (this.Required) {
                this.$Title.append("<span style='color:red;vertical-align:middle'>*<span>");
            }
            this.$InputBody = $("<div>").addClass("ControlContent");
            $(this.Element).append(this.$InputBody);
            
        } else if (controlkey == "FormDropDownList" || controlkey == "FormRadioButtonList" || controlkey=="FormAclScope") {
            $(this.Element).removeClass("row  form-group").addClass("item item-input item-select");
            this.$Title = $("<span>" + this.DisplayName + "</span>").addClass("input-label has-input").addClass(this.Css.ControlTitle);
            $(this.Element).append(this.$Title);
            if (this.Required) { 
                this.$Title.append("<span style='color:red;vertical-align:middle'>*<span>");
            }
            this.$InputBody = $('<select class="ControlContent" style="padding:7px 48px 7px 16px;"></select>');
            $(this.Element).append(this.$InputBody);
        }
        else if ( controlkey == "FormQuery" ) {
            $(this.Element).removeClass("row  form-group").addClass("item item-input item-icon-right");
            this.$Title = $("<span>" + this.DisplayName + "</span>").addClass("input-label").addClass("has-input").addClass(this.Css.ControlTitle);
            $(this.Element).append(this.$Title);
            if (this.Required) {
                this.$Title.append("<span style='color:red;vertical-align:middle'>*<span>");
            }
            this.$InputBody = $("<div>").addClass("ControlContent");
            $(this.Element).append(this.$InputBody);
        } 
        else {
            if (controlkey == "FormNumber") {
                $(this.Element).empty();
            }
            $(this.Element).removeClass("row  form-group").addClass("item item-input");
            this.$Title = $("<span>" + (this.DisplayName || "") + "</span>").addClass("input-label").addClass("has-input").addClass(this.Css.ControlTitle);
            $(this.Element).append(this.$Title);
            if (this.Required) {
                this.$Title.append("<span style='color:red;vertical-align:middle'>*<span>");
            }
            this.$InputBody = $("<div>").addClass("ControlContent");
            $(this.Element).append(this.$InputBody);
        }
    },

    Render: function () { },

    GetValue: function () { },

    SetValue: function () { },

    BindEvents: function () { }

};


