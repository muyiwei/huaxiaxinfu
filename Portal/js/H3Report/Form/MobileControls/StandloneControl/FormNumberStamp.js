(function ($) {

    //暂定已双竖线分隔值

    // 构造函数
    $.MobileControls.FormNumberStamp = function (element, options, sheetInfo) {
        $.MobileControls.FormNumberStamp.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormNumberStamp.Inherit($.MobileControls.BaseClass, {
        //控件渲染函数
        Render: function () {


            //渲染Html页面
            this.HtmlRender();
            //渲染校验模式
            this.ModeRender();
            //绑定事件
            //this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            this.SetValue(this.Value);

            //新建的话如果有placeholder则显示
            if (this.PlaceHolder) {
                this.SetPlaceHolder(this.PlaceHolder);
            }
        },

        //渲染html内容
        HtmlRender: function () {
            this.$InputDiv = $('<div>').attr("name", this.DataField);
            this.$Input1 = $("<input type='number'>").addClass('filter-input');
            this.$Input2 = $("<input type='number'>").addClass('filter-input');
            this.$InputDiv.append(this.$Input1);
            this.$InputDiv.append('<span class="filter-span">至</span>');
            this.$InputDiv.append(this.$Input2);
            this.$InputBody.append(this.$InputDiv);
        },

        ModeRender: function () {
            this.Expression = /^-{0,1}[0-9]+\.{0,1}[0-9]*$/;
            this.ErrorAlert = "请输入数字!";
        },

        //绑定事件
        BindEvent: function () {
        },

        //值改变
        ValChange: function () {
            //var vStr = this.GetValue();
            //if ($.isNumeric(vStr)) {
            //    if (vStr.indexOf(".") > -1) {
            //        if (vStr.split('.')[0].length > this.IntegerMaxLength) {
            //            vStr = vStr.split('.')[0].substring(0, this.IntegerMaxLength) + vStr.split('.')[1];
            //        }
            //    }
            //    else if (vStr.length > this.IntegerMaxLength) {
            //        vStr = vStr.substring(0, this.IntegerMaxLength);
            //    }

            //    if ($.isNumeric(this.DecimalPlaces)) {
            //        var v = parseFloat(vStr).toFixed(this.DecimalPlaces);
            //        this.SetValue(v);
            //    }

            //}
            //this.OnChange();
            //this.$Input.trigger("change");
            //this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (typeof (v) == "undefined") return;
            if (v === "" && this.GetValue() === "") return;
            if (this.GetValue() != "" && this.GetValue() == v) return;
            var v1 = "", v2 = "";
            var tmps = v.split(';');
            if (!$.isNumeric(tmps[0])) {
                v1 = "";
            } else {
                v1 = tmps[0];
            }
            if (!$.isNumeric(tmps[1])) {
                v2 = "";
            } else {
                v2 = tmps[1];
            }

            $(this.$Input1).val(v1);
            $(this.$Input2).val(v2);
            //this.ValChange();
        },

        GetValue: function () {
            var v1, v2;
            //对手机端输入的Emoji表情符进行过滤
            if (this.$Input1 != null) {
                var v = $(this.$Input1).val();

                v1 = v.replace(/[\uD800-\uDFFF]/g, '');
                if (!$.isNumeric(v1)) {
                    v1 = 0;
                }
            }
            if (this.$Input2 != null) {
                var v = $(this.$Input2).val();
                v2 = v.replace(/[\uD800-\uDFFF]/g, '');
                if (!$.isNumeric(v2)) {
                    v2 = 0;
                }
            }
            return v1 + ";" + v2;
        },
        //设置placeholder
        SetPlaceHolder: function (ph) {

        },
        Reset: function () {
            $(this.$Input1).val('');
            $(this.$Input2).val('');
        }
    });

})(jQuery);