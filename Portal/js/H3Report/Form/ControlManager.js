// 控件管理器
(function ($) {
    //核心属性
    $.ControlManager = {
        //页面参数属性、事件的属性
        PreDataKey: "data-",
        //已经渲染过后的标示前缀
        SheetIDKey: "jcontrolid",
        //数据项属性
        DataFieldKey: "DataField",
        //控件名称
        SheetControlKey: "controlkey",

        // 控件数量
        ControlCount: 0,
        // 管理器
        Controls: {},
        // 管理器备份，在移动端多个表单间切换时使用
        Controls_bak: {},
        //表单自定义js脚本，在移动端多个表单间切换时使用
        CustomJSScript_bak: {},

        // ** $.fn.Sheet{control}
        // ** 会调用这个方法,并传入作用域(this)
        // ** control [control]  控件名
        // ** parm [args] 参数(数组):从后台加载出来的相关数据
        Run: function (control, args) {
            // 读取默认属性
            var p;

            // 当前的ID
            var currentSheetIDKey = 0;
            //如果只有一个的话，就会返回
            var isOneControl = 0;

            //循环页面上的控件
            this.each(function () {
                if (!$(this).attr("data-" + $.ControlManager.SheetIDKey)) {
                    //edit by xc
                    p = $.Controls.GetDefaultOptions(control);
                    if (args.length > 0) {
                        // Error:DataItem 应该是没必要的
                        $.extend(p, { DataItem: args[0] });
                        // 后台属性覆盖
                        $.extend(p, args[0]);
                    }
                    //edit end

                    // 控件数量加1
                    $.ControlManager.ControlCount++;
                    // 添加控件属性
                    currentSheetIDKey = $.ControlManager.SheetIDKey + "-" + $.ControlManager.ControlCount.toString();
                    var datafield = $(this).attr("data-" + $.ControlManager.DataFieldKey.toLocaleLowerCase());
                    p[$.ControlManager.DataFieldKey] = $(this).attr("data-" + $.ControlManager.DataFieldKey.toLocaleLowerCase());
                    $(this).attr("data-" + $.ControlManager.SheetIDKey, currentSheetIDKey);
                    // new 控件
                    $.ControlManager.Controls[currentSheetIDKey] = new $.Controls[control](this, p, $.SmartForm.ResponseContext);
                }
                isOneControl++;
            });

            //如果是一个的话，返回当前控件管理器
            if (isOneControl == 1) {
                return $.ControlManager.Controls[$(this).attr("data-" + $.ControlManager.SheetIDKey)];
            }
        },

        ClearControls: function () {

            this.Controls = {};
            this.ControlCount = 0;
        },

        // 保存事件，获取所有控件的保存后返回的值
        SaveSheetData: function () {
            var SheetData = {};
            for (var control in this.Controls) {
                var controlManager = this.Controls[control];
                //字表中的control不调用SaveDataField，由子表自己调用SaveDataField保存值
                if (!$.isFunction(controlManager.SaveDataField) || controlManager.DataField == void 0 || (controlManager.DataField + "").indexOf(".") != -1 || controlManager.DataField == "Comments") continue;
                $.extend(SheetData, controlManager.SaveDataField());
            }
            return SheetData;
        },

        // 获取控件Dom元素(JQuery对象)，参数可以是数据项名称，也可以是#id
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

        // 读取数据，参数可以是数据项名称，也可以是#id
        GetControlValue: function (datafiled) {
            var control = this.GetElement(datafiled);
            var vals = new Array();
            for (var i = 0; i < control.length; i++) {
                var manager = $(control[i]).JControl();
                if (manager) {
                    vals.push(manager.GetValue());
                }
            }
            return vals.length == 0 ? null : (vals.length == 1 ? vals[0] : vals);
        },

        // 设置数据项前端控件的值
        // 参数1：数据项名称，参数2：数据项的值
        SetControlValue: function (datafiled, val, BizObjectId) {
            var control = this.GetElement(datafiled, BizObjectId);
            for (var i = 0; i < control.length; i++) {
                var manager = $(control[i]).JControl();
                if (manager) {
                    manager.SetValue(val);
                }
            }

        },

        // 函数：控件校验
        Validate: function (ActionControl) {
            var flag = true;
            for (var control in this.Controls) {
                var controlManager = this.Controls[control];

                if (ActionControl != null && ActionControl.Action == $.SmartForm.Action_Save && !(controlManager instanceof $.Controls.FormAttachment)) {
                    //保存的时候，需要校验附件是上传完整
                    continue;
                }

                if (!$.isFunction(controlManager.Validate)) continue;
                if (controlManager.DataField == void 0) continue;
                //控件不可见不校验
                if (!$(controlManager.Element).is(":visible") || $(controlManager.Element).css('visibility') == 'hidden') continue;
                if (!controlManager.Validate(ActionControl.Action) && flag) {
                    flag = false;

                    // 自动定位到验证失败的控件
                    if (controlManager.IsMobile) {
                        var $elment = $(controlManager.Element);
                        //edit by xc
                        //// 滚动高度为，当前元素相对页面顶部的top+元素自身height - 手机页口可视高度 - 底部操作按钮高度
                        //var $par = $elment.closest(".ionic-scroll.sheetcontent").children(".scroll");
                        //var bottomToolBarHeight = 50;
                        ////获取$par的translateY值
                        //var ty = $par.length > 0 ? -parseInt(getTranslateY($par[0])) : 0;
                        //var top = $elment.offset().top - $(window).height() + bottomToolBarHeight + $elment.height() + ty;
                        var top = $elment.position().top;
                        //end
                        H3Config.GlobalScrollDelegate.scrollTo(null, top, true);

                        $.IShowError("提示", "抱歉，[" + controlManager.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + "]选项" + controlManager.invalidText);
                        $elment.find("input").focus();
                    }
                }
            }
            return flag;
        }
    };

    //var getTranslateY = function (node) {
    //    var regRule = /translate(Y|\dd)?\(\s*(\w+\s*,)?\s*([^,]+)(\s*,[^)]+)?\s*\)/;
    //    var regRule2 = /matrix\(.*,\s*(\w+)\s*\)/;
    //    var transform = node.style.transform;
    //    var reg;
    //    if (!transform) {
    //        return null;
    //    }
    //    reg = regRule.exec(transform);
    //    if (null === reg) {
    //        reg = regRule2.exec(transform);
    //        return reg ? reg[1] : null;
    //    }
    //    return reg[3];
    //}


})(jQuery);