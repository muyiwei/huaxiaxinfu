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
            $(this.Element).css("align-items", "flex-start");

            if (this.Editable) {
                if (this.Required) {
                    this.$Input = $("<textarea style='border:none;'name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + '(必填)' + "'>");//.attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + '(必填)');
                } else {
                    this.$Input = $("<textarea style='border:none;'name='" + this.DataField + "' placeholder='请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, "") + "'>");//.attr("name", this.DataField).attr("placeholder", "请输入" + this.DisplayName.replace(/(^\s*)|(\s*$)/g, ""));
                    //if (!this.Editable) {
                    //    this.$Input.removeAttr('placeholder');
                    //}
                }
            } else {
                this.$Input = $('<div class="ta-readonly"></div>');
            }
            this.$InputBody.append(this.$Input);
        },

        //绑定事件
        BindEvent: function () {
            this.DefaultHeight = this.$Input.css("height");
            //keyup 计算高度
            this.$Input.unbind("input.FormTextArea1 input.FormTextArea1").bind("input.FormTextArea1 input.FormTextArea1", this, function (e) {
                var $this = $(this);
                var that = e.data;
                var currentHeight = $this.css("height");
                $this.css("height", that.DefaultHeight);
                if (this.scrollHeight < 264) {
                    $this.css({ "height": this.scrollHeight, "overflow-y": "auto" });
                }
                else {
                    $this.css({ "height": currentHeight, "overflow-y": "visible" });
                }
                that.ValChange();
            });


            //this.$Input.unbind("blur.FormTextArea").bind("blur.FormTextArea", this, function (e) {
            //    var that = e.data;
            //    that.ValChange();
            //});
        },

        //值改变
        ValChange: function () {
            this.OnChange();
            this.Validate();
        },

        //设置值
        SetValue: function (v) {
            if (!this.Editable) {
                this.Value = (v + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
                this.PlaceHolder = ph.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
                this.$Input.attr("placeholder", this.PlaceHolder);
            }
        },

        GetValue: function () {
            if (!this.Editable) {
                var v = this.Value;
                return v == null ? "" : v;
            }
            else {
                var v = '';
                if (this.$Input != void 0)
                    v = this.$Input.val();
                if (v) {
                    return v.trim();
                } else {
                    return v;
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
                var $contnt = this.$Input.parent('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
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
                var v = this.GetValue();
                if (v) {
                    result[this.DataField] = v.trim();
                } else {
                    result[this.DataField] = v;
                }
                //result[this.DataField] = this.GetValue().trim();
                return result;
            }

            return {};
        }
    });
})(jQuery);