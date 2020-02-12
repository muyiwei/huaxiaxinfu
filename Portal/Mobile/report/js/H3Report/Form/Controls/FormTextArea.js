//多行文本框(FormTextArea)
(function ($) {
    $.fn.FormTextArea = function () {
        return $.ControlManager.Run.call(this, "FormTextArea", arguments);
    };

    // 构造函数
    $.Controls.FormTextArea = function (element, options, sheetInfo) {
        $.Controls.FormTextArea.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormTextArea.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            //渲染Html页面
            this.HtmlRender();
            //绑定事件
            this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            if (this.Value) {
                this.SetValue(this.Value);
            }

            //设置placeholder
            if (this.PlaceHolder) {
                this.SetPlaceHolder(this.PlaceHolder);
            }


            // 不可编辑
            if (!this.Editable) {
                this.SetReadonly(true);
                return;
            }

        },

        //渲染html内容
        HtmlRender: function () {
            if (!this.Editable) {
                //this.$Input = $("<pre>").css("border", "none");
                this.$Input = $('<pre style="border:none;white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;overflow:auto;word-break:break-all">');
            }
            else {
                this.$Input = $("<textarea name='" + this.DataField + "' rows='" + this.Rows + "' class='form-control' maxlength='2000' style='display:block; border: 1px solid #ddd; overflow-y: hidden; resize: none'>");//.attr("name", this.DataField).attr("rows", this.Rows).addClass("form-control").attr("maxlength", 2000).css({ "display": "block", "border": "1px solid #ddd", "overflow-y": "hidden", "resize": "none" });
            }
            this.$InputBody.append(this.$Input);
        },

        //绑定事件
        BindEvent: function () {
            //keyup事件会出现频繁提示验证信息，例如邮箱没输完的时候会一直提示
            //$(this.$Input).unbind("keyup.FormTextArea").bind("keyup.FormTextArea", this, function (e) {
            //    var that = e.data;
            //    that.ValChange();
            //});
            $(this.$Input).off("blur.FormTextArea").on("blur.FormTextArea", this, function (e) {
                var $this = $(this);
                var that = e.data;
                that.ValChange();
                that.Required && ($this.val() != "" && $this.removeAttr("style"));
            });
            //设置文本控件高度自动适应
            $(this.$Input).on('input', function () {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        },

        //值改变
        ValChange: function () {
            this.OnChange();
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (v == null) return;
            if (!this.Editable) {
                this.Value = (v + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if (this.Visible)
                    this.$Input.html(this.Value);
            }
            else {
                this.$Input.val(v);
            }
            this.ValChange();
        },

        //设置placeholder Add:20160408
        SetPlaceHolder: function (ph) {
            if (this.Editable && this.ResponseContext.IsCreateMode) {
                this.PlaceHolder = ph.toString();//.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },

        GetValue: function () {
            if (!this.Editable) {
                var v = this.Value;
                return v == null ? "" : v;
            }
            else {
                if (this.$Input != void 0)
                    return this.$Input.val().trim();
                else {
                    return this.Value || "";
                }
            }
        },

        GetText: function () {
            return this.GetValue();
        },

        //设置只读
        SetReadonly: function (v) {
            if (v) {
                this.$Input.prop("readonly", "readonly");
            }
            else {
                this.$Input.removeProp("readonly");
            }
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            //if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && val != null && val.trim() == "") {

                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            if (!$.isEmptyObject(val)) {

                if (val.trim().length > 2000) {
                    this.AddInvalidText(this.$Input, '字符长度超出限制2000个字');
                    return false;
                }
            }
            if (!$.isEmptyObject(val) && this.Expression && !this.Expression.test(val)) {
                this.AddInvalidText(this.$Input, this.ErrorAlert);
                return false;
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldresult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldresult) {
                return {};
            }

            if (("" + oldresult.Value) != this.GetValue()) {
                result[this.DataField] = this.GetValue().trim();
                return result;
            }

            return {};
        }
    });
})(jQuery);