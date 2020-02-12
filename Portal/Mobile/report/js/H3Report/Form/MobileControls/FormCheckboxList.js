// 复选框
(function ($) {
    $.fn.FormCheckboxList = function () {
        return $.ControlManager.Run.call(this, "FormCheckboxList", arguments);
    };


    // 构造函数
    $.Controls.FormCheckboxList = function (element, ptions, sheetInfo) {
        $.Controls.FormCheckboxList.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormCheckboxList.Inherit($.Controls.BaseControl, {
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
            //添加到服务
            this.AddSchema();
        },

        AddSchema: function () {
            H3Config.GlobalCheckboxList.addSchema(this.DataField, this);
        },

        //获取值
        GetValue: function () {
            if (this.isCheckbox) {
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
            if (!value) {
                this.Reset();
                return;
            }
            if (this.isCheckbox) {
                if (value != void 0) {
                    $(this.$InputBody.find("input")[0]).prop("checked", value);
                }
            } else {
                this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-myval', value).attr('data-val', value).val(value).hide();
                //todo  显示名称更改
                var tmp = [];
                if (toString.apply(value) === '[object Array]') {
                    tmp = value;
                } else {
                    tmp = value.split(';');
                }
                var displayName = "";
                if (tmp != null && tmp.length > 0) {
                    for (var i = 0; i < this.DefaultItems.length; i++) {
                        if (this.DefaultItems[i].constructor == String) {
                            if ($.inArray(this.DefaultItems[i], tmp) > -1) {
                                displayName += this.DefaultItems[i] + ";";
                            }
                        } else {
                            if ($.inArray(this.DefaultItems[i].Value, tmp) > -1) {
                                displayName += this.DefaultItems[i].Text + ";";
                            }
                        }

                    }
                    this.$InputBody.find('input[datafield="' + this.DataField + '_Display"]').attr('data-val', displayName).val(displayName).show();
                }

            }
            this.OnChange();
        },

        GetText: function () {
            if (this.isCheckbox) {
                return $(this.$InputBody.find("input")[0]).text();
            }
            return this.$InputBody.find('inpt[datafield="' + this.DataField + '"]').val();
        },

        Reset: function () {
            if (this.isCheckbox) {
                $(this.$InputBody.find("input")[0]).prop("checked", false);
            } else {
                this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-myval', '').attr('data-val', '').val('').hide();
                this.$InputBody.find('input[datafield="' + this.DataField + '_Display"]').attr('data-val', '').val('').show();
            }

        },

        SetReadonly: function (flag) {
            if (flag) {
                //隐藏掉链接
                if (this.isCheckbox) {
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
                if (this.isCheckbox) {
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
            if (this.isCheckbox) {
                if (this.Value != void 0 && this.Value != "") {
                    $(this.$InputBody).find("input").prop("checked", this.Value);
                }
            } else {
                if (this.Value != void 0 && this.Value != "") {
                    this.$InputBody.find('input[datafield="' + this.DataField + '"]').attr('data-val', this.Value).val(this.Value);
                    //此处看数据源 todo
                    this.$InputBody.find('input[datafield="' + this.DataField + '_Display"]').attr('data-val', this.Value).val(this.Value).show();

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
                var defaultitems = $(this.Element).attr('data-defaultitems');
                if (defaultitems != void 0 && defaultitems != "") {
                    defaultitems = eval('(' + defaultitems + ')');
                    var $required = this.$Title.children("span").detach();
                    this.$Title.html(this.$Title.text()).append($required);
                }

                var id = $.IGuid();
                var option = "<div style='text-align:right'>";
                option += "<label class='toggle toggle-calm track' for='" + id + "'><input type='checkbox' id='" + id + "' /></label>";
                option += "<div class='track'><div class='handle' ></div></div>";
                option += "</div>";
                this.$InputBody.append(option);

                //var option = $("<div style='text-align:right'></div>");
                //var id = $.IGuid();
                //var checkbox = $("<input type='checkbox' />").attr("id", id);
                //var label = $("<label class='toggle toggle-calm' for='" + id + "'></label>").addClass("track");
                //var div = $('<div class="track"><div class="handle"></div></div>');
                //option.append(label.append(checkbox).append(div));
                //this.$InputBody.append(option);

                var $contnt = $(this.Element).find('div.ControlContent').addClass("RightArrow");
                if (!this.Editable) {//不可用
                    this.$InputBody.find("#" + id).prop("disabled", true);
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
                    //var $contnt = $(this.Element).find('div.ControlContent');
                    if ($contnt.length > 0) {
                        $contnt.removeClass('readonly');
                    }
                }
            } else {
                $(this.Element).addClass("SheetCheckboxList");

                //选中值
                this.$InputValue = $('<input style="display:inline-block; padding-right:8px;display:none;" type="text" readonly datafield="' + this.DataField + '"></input>');
                //增加一个额外的显示文本框
                //this.$Display = $('<input style="display:inline-block; padding-right:8px;" type="text" readonly datafield="' + this.DataField + '_Display"></input>');

                var text = this.Required ? "请选择(必填)" : "请选择";
                this.$Display = null;
                if (this.Editable) {
                    this.$Display = $('<input style="display:inline-block;" class="bold" placeholder="' + text + '" type="text" readonly datafield="' + this.DataField + '_Display"></input>');
                } else {
                    this.$Display = $('<input style="display:inline-block;" class="bold" type="text" readonly datafield="' + this.DataField + '_Display"></input>');
                }
                $(this.$InputBody).append(this.$InputValue);
                $(this.$InputBody).append(this.$Display);
                //this.$flat = $('<i class="icon ion-ios-arrow-right m-sheet-arrow"></i>');
                this.$flat = $('<i class="icon icon-arrow-right"></i>');
                this.$InputBody.append(this.$flat);
                var $contnt = $(this.Element).find('div.ControlContent').addClass("RightArrow");
                if (this.Editable) {
                    $(this.$flat).show();
                    this.$InputBody.css('background-color', '#fff');
                    if ($contnt.length > 0) {
                        $contnt.removeClass('readonly');
                    }
                } else {
                    $(this.$flat).hide();
                    //this.$InputBody.css('background-color', '#fff');
                    //var $contnt = $(this.Element).find('div.ControlContent');
                    if ($contnt.length > 0) {
                        $contnt.addClass('readonly');
                    }
                }
                //初始化数据源
                var tmp = [];
                for (var i = 0; i < this.DefaultItems.length; i++) {
                    if (!this.DefaultItems[i].Value) {
                        var val = this.DefaultItems[i];
                        tmp.push({ Value: val, Text: val });
                    } else {
                        tmp.push(this.DefaultItems[i]);
                    }
                }
                this.DefaultItems = tmp;
            }
        },

        //绑定事件
        BindEvent: function () {
            var that = this;
            this.$InputBody.find("input[datafield='" + this.DataField + "']").unbind('change').bind("change", this, function (e) {
                that.OnChange();
            });
        },

        //处理必填红色*号
        Validate: function () {
            var check = true;
            if (this.Editable && this.Required && !this.isCheckbox) {
                check = false;
                if ($(this.$InputValue).attr('data-val') != "" && $(this.$InputValue).attr('data-val') != void 0) {
                    check = true;
                }
                if (check) {
                    this.RemoveInvalidText(this.$InputBody, "必填");
                }
                else {
                    this.AddInvalidText(this.$InputBody, "必填");
                }
            }
            return check;
        },

        AddItem: function (value, text) {
            if (!this.isCheckbox && (text || value)) {
                var txt = "";
                if (text) {
                    txt = text;
                } else {
                    txt = value;
                }
                this.DefaultItems.push({ Value: value, Text: txt });
            }
        },

        ClearItems: function () {
            if (!this.isCheckbox) {
                this.DefaultItems = [];
            }
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