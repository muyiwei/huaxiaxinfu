(function ($) {
   


    // 构造函数
    $.MobileControls.FormNumber = function (element, options, sheetInfo) {
        $.MobileControls.FormNumber.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormNumber.Inherit($.MobileControls.BaseClass, {
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
            this.$Input = $("<input type='number'>").attr("name", this.DataField);
            this.$InputBody.append(this.$Input);
        },

        ModeRender: function () {
            this.Expression = /^-{0,1}[0-9]+\.{0,1}[0-9]*$/;
            this.ErrorAlert = "请输入数字!";
        },

        //绑定事件
        BindEvent: function () {
            $(this.$Input).unbind("keyup.SheetTextBox").bind("keyup.SheetTextBox", this, function (e) {
                var that = e.data;
                
                that.OnChange.apply(that);
            });
            $(this.$Input).unbind("change.SheetTextBox").bind("change.SheetTextBox", this, function (e) {
                var that = e.data;
                that.ValChange.apply(that);
                
            });

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
            if (v === "" && this.GetValue() === "") return;
            if (this.GetValue() != "" && this.GetValue() == v) return;
            if (!$.isNumeric(v)) {
                v = "";
            }
            
            $(this.$Input).val(v);
            this.ValChange();
        },

        GetValue: function () {
            if (!this.Visible) {
                if (this.Value == null || isNaN(this.Value)) {
                    return "";
                }
                return this.Value;
            }

            //对手机端输入的Emoji表情符进行过滤
            if (this.$Input != null) {
                var v = $(this.$Input).val();
                return v.replace(/[\uD800-\uDFFF]/g, '');
            }
            return "";
        },
        //设置placeholder
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },
        Reset: function () {
            $(this.$Input).val('');
        },

        GetNum: function () {
            var v = this.GetValue();
            if ($.isNumeric(v)) {
                return parseFloat(v);
            }
            else {
                return 0.0;
            }
        }
    });

})(jQuery);