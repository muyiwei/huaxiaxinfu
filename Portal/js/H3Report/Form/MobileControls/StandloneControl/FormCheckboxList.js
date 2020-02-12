// 复选框
(function ($) {
    // 构造函数
    $.MobileControls.FormCheckboxList = function (element, ptions, sheetInfo) {
        $.MobileControls.FormCheckboxList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormCheckboxList.Inherit($.MobileControls.BaseClass, {
        Render: function () {
            //渲染前端
            this.HtmlRender();

            //绑定事件
            //this.BindEvent();
            //初始化默认值
            this.InitValue();
            //添加到服务
            this.AddSchema();
        },

        AddSchema: function () {
            H3Config.GlobalCheckboxList.addSchema(this.DataField, this);
        },

        //获取值
        GetValue: function () {
            if (this.isCheckbox && this.isCheckbox!='false') {
                var inputs = this.$InputBody.find("input");
                if (inputs != void 0) {
                    return $(inputs[0]).is(':checked');
                }
            } else {
                return this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-val');
            }
        },

        //设置控件的值
        SetValue: function (value) {
            if (this.isCheckbox && this.isCheckbox!='false') {
                if (value != void 0) {
                    $(this.$InputBody.find("input")[0]).prop("checked", value);
                }
            } else {
                this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-val', value).val(value).show();
            }
        },

        GetText: function () {
            if (this.isCheckbox && this.isCheckbox != 'false') {
                return $(this.$InputBody.find("input")[0]).text();
            }
            return this.$InputBody.find('inpt[datafield="' + this.DataField + '"]').val();
        },

        Reset: function () {
            if (this.isCheckbox && this.isCheckbox != 'false') {
                $(this.$InputBody.find("input")[0]).prop("checked", false);
            } else {
                this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-val', '').val('').hide();
            }

        },

        SetReadonly: function (flag) {
            if (flag) {
                //隐藏掉链接
                if (this.isCheckbox && this.isCheckbox != 'false') {
                    this.$InputBody.find("input").prop("disabled", true);
                } else {
                    $(this.$link).hide();
                }
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                if (this.isCheckbox && this.isCheckbox != 'false') {
                    this.$InputBody.find("input").prop("disabled", false);
                } else {
                    $(this.$link).show();
                }
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            }
        },

        InitValue: function () {
            //设置默认值
            if (this.isCheckbox && this.isCheckbox != 'false') {
                if (this.Value != void 0 && this.Value != "") {
                    $(this.$InputBody).find("input").prop("checked", this.Value);
                }
            } else {
                if (this.Value != void 0 && this.Value != "") {
                    this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-val', this.Value).val(this.Value).show();
                }
            }
        },

        HtmlRender: function () {
            var that = this;
            // 组标示
            this.GropName = this.DataField;

            // 单选框渲染成toggle
            if (this.isCheckbox == "true" || this.isCheckbox == true) {
                //替换title
                var defaultitems = $(this.Element).attr('data-DefaultItems');
                if (defaultitems != void 0 && defaultitems != "") {
                    defaultitems = eval('(' + defaultitems + ')');
                    var $required = this.$Title.children("span").detach();
                    this.$Title.html(this.$Title.text()).append($required);
                }

                var option = $("<div></div>").css({ "text-align": "right" });
                var id = $.IGuid();
                var checkbox = $("<input type='checkbox' />").attr("id", id);
                var label = $("<label class='toggle toggle-calm' for='" + id + "'></label>").addClass("track");
                var div = $('<div class="track"><div class="handle"></div></div>');
                option.append(label.append(checkbox).append(div));
                this.$InputBody.append(option);

                label.unbind("click").bind("click", function (event) {
                    // 阻止冒泡，不阻止toggle操作不了，原因未知
                    event.stopPropagation();
                });
                this.$InputBody.css('background-color', '#fff');
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            } else {
                $(this.Element).addClass("SheetCheckboxList");

                //选中值
                this.$InputValue = $('<input style="display:inline-block;padding-right:24px;" type="text" readonly datafield="' + this.DataField + '"></input>');
                $(this.$InputBody).append(this.$InputValue);

                this.$flat = $('<i class="icon icon-arrow-right m-sheet-arrow"></i>');
                this.$InputBody.append(this.$flat);
                $(this.$flat).show();
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
            //if (!this.isCheckbox) {
            //    check = false;
            //    if ($(this.$InputValue).attr('data-val') != "" && $(this.$InputValue).attr('data-val') != void 0) {
            //        check = true;
            //    }
            //    if (check) {
            //        this.RemoveInvalidText(this.$InputBody, "必填");
            //    }
            //    else {
            //        this.AddInvalidText(this.$InputBody, "必填");
            //    }
            //}
            return check;
        },

        AddItem: function (value, text) {
            if (!this.isCheckbox && (text || value)) {
                this.DefaultItems.push(text || value);
            }
        },

        CleanItems: function () {
            if (!this.isCheckbox) {
                this.DefaultItems = [];
            }
        }
    });
})(jQuery);