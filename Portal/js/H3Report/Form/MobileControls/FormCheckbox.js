// 复选框
(function ($) {
    $.fn.FormCheckbox = function () {
        return $.ControlManager.Run.call(this, "FormCheckbox", arguments);
    };


    // 构造函数
    $.Controls.FormCheckbox = function (element, ptions, sheetInfo) {
        $.Controls.FormCheckbox.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormCheckbox.Inherit($.Controls.BaseControl, {
        Render: function () {
            if (!this.Visible) {
                $(this.Element).hide();
                return;
            }

            //渲染前端
            this.HtmlRender();

            //绑定事件
            this.BindEvent();
            //初始化默认值
            this.InitValue();
            ////添加到服务
            //this.AddSchema();
        },

        //AddSchema: function () {
        //    GlobalCheckboxList.addSchema(this.DataField, this);
        //},

        //获取值
        GetValue: function () {
            var inputs = this.$InputBody.find("input");
            if (inputs != void 0) {
                return $(inputs[0]).is(':checked') || $(inputs[0]).val() == '是';
            }
        },

        //设置控件的值
        SetValue: function (value) {
            if (value != void 0) {
                $(this.$InputBody.find("input")[0]).prop("checked", value);
                this.OnChange();
            }
        },

        GetText: function () {
            return $(this.$InputBody.find("input")[0]).text();
        },

        Reset: function () {
            $(this.$InputBody.find("input")[0]).prop("checked", false);
        },

        SetReadonly: function (flag) {
            if (flag) {
                //隐藏掉链接
                this.$InputBody.find("input").prop("disabled", true);
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                this.$InputBody.find("input").prop("disabled", false);
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },

        InitValue: function () {
            var valueLocal = this.Value == null ? this.DefaultValue : this.Value;
            if (this.Editable) {
                //设置默认值
                $(this.$InputBody).find("input").prop("checked", valueLocal);
            } else {
                valueLocal ? (this.$InputBody.find("input").val("是")): (this.$InputBody.find("input").val("否"));
            }
        },

        HtmlRender: function () {
            var that = this;
            // 组标示
            this.GropName = this.DataField;

            if (!this.Editable) {
                var text =
                this.$InputBody.addClass("readonly").append("<input readonly style='border:0;'>");
                return;
            }

            // 单选框渲染成toggle
            //替换title
            var defaultitems = $(this.Element).attr('data-defaultitems');
            if (defaultitems != void 0 && defaultitems != "") {
                defaultitems = eval('(' + defaultitems + ')');
                var $required = this.$Title.children("span").detach();
                this.$Title.html(this.$Title.text()).append($required);
            }

            var id = $.IGuid();
            var option = "<div style='text-align:right;'>";
            option += "<label class='toggle toggle-calm track' for='" + id + "'><input type='checkbox' id='" + id + "' />";
            option += "<div class='track'><div class='handle'></div></div>";
            option += "</label>";
            option += "</div>";
            this.$InputBody.append(option);

            //var option = $("<div></div>").css({ "text-align": "right" });
            //var id = $.IGuid();
            //var checkbox = $("<input type='checkbox' />").attr("id", id);
            //var label = $("<label class='toggle toggle-calm' for='" + id + "'></label>").addClass("track");
            //var div = $('<div class="track"><div class="handle"></div></div>');
            //option.append(label.append(checkbox).append(div));
            //this.$InputBody.append(option);

            if (!this.Editable) {//不可用
                this.$InputBody.find("#"+id).prop("disabled", true);
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                this.$InputBody.find("label.track").unbind("click").bind("click", function (event) {
                    // 阻止冒泡，不阻止toggle操作不了，原因未知
                    event.stopPropagation();
                });
                this.$InputBody.css('background-color', '#fff');
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },

        //绑定事件
        BindEvent: function () {
            var that = this;
            this.$InputBody.find("input").unbind('change').bind("change", this, function (e) {
                that.OnChange();
            });
        },

        //处理必填红色*号
        Validate: function () {
            var check = true;

            return check;
        },

        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (!this.Visible) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }
            if (oldResult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        }
    });
})(jQuery);