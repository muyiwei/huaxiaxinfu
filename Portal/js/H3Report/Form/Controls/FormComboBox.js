//组合框(FormComboBox)
(function ($) {
    $.fn.FormComboBox = function (opt) {
        return $.ControlManager.Run.call(this, "FormComboBox", arguments);
    };

    // 构造函数
    $.Controls.FormComboBox = function (element, options, sheetInfo) {
        this.FormComboBoxHandler = "/App/LoadSchemaPropertyValues";
        $.Controls.FormComboBox.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormComboBox.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            this.PerNum = 10;
             
            //是否在子表里面
            //this.IsInGridView = !$.isEmptyObject(this.ObjectId);
            //渲染Html页面
            this.HtmlRender();
            
            //渲染校验模式
            //this.ModeRender();
            //绑定事件
            this.BindEvent();

            //Error:新建的话，可以制作默认值 ，非新建设置值加载的值
            if (this.Value) {
                this.SetValue(this.Value);
                this.SelectedValue = this.Vaule.split(',');
            } else {
                this.SelectedValue = [];
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
                this.$Input = $('<pre style="border:none;white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;overflow:auto;word-break:break-all">');
                this.$InputBody.append(this.$Input);
            }
            else {
                if (this.$InputBody.children("input").length == 0) {
                    this.$Input = $("<input type='text'  id='" + this.DataField + "'  data-propertyname='" + this.DataField + "'    value='" + this.DefaultValue + "' class='form-control myform-control mytext comboboxtext' style='width: 100%; padding-right:22px;'>").attr("name", this.DataField).addClass("form-control");//.attr("maxlength", 200).width(this.Width)
                  
                }
                this.$DropList = $('<ul class="drop-list drop-combox"></ul>');
                var blankID = $.IGuid();
                var blank = $('<li class="dropdownlist-item" "><label for="' + blankID + '" data-val="--" class="drop-item-btn">--(空值)</label></li>');
                this.$DropList.append(blank);
                //var searchID = $.IGuid();
                //this.$Search = $('<li class="dropdownlist-item" style="padding-left:0;"><input type="text" placeholder="输入查找" class="input-drop search form-control form-input" id="' + searchID + ' style="width: 100%;"></li>');
                //this.$DropList.append(this.$Search);
                this.$InputBody.append(this.$Input).append(this.$DropList);
            }
           
        },

        //渲染模式：邮件、电话、身份证
        ModeRender: function () {
            switch (this.Mode) {
                case "Email":
                    this.Expression = /^\w+([-+.]\w+)*@\w+([-+.]\w+)*\.\w+([-.]\w+)*$/;
                    this.ErrorAlert = "错误的邮箱格式!";
                    break;
                case "Mobile":
                    this.Expression = /^1[3-8]\d{9}$/;
                    this.ErrorAlert = "错误的手机格式!";
                    break;
                case "Telephone":
                    this.Expression = /^(0\d{2,3}-)?\d{7,8}(-\d{1,4})?$/;
                    this.ErrorAlert = "错误的电话格式!";
                    break;
                case "Card":
                    this.Expression = /^\d{15}(\d{2}[A-Za-z0-9])?$/
                    this.ErrorAlert = "错误的身份证格式!";
                    break;
            }

        },

        //绑定事件
        BindEvent: function () { 
            $(this.$Input).off("blur.FormComboBox").on("blur.FormComboBox", this, function (e) {
                var $this = $(this); 
                var that = e.data; 
                that.ValChange(); 
                that.Required && ($this.val() != "" && $this.removeAttr("style"));
                that.$DropList.hide();
            });

            var timeout;
            $(this.$Input).bind("input propertychange", this, function (e) { 
                var that = e.data;
                var searchvalues = $(this).val().split(/,|，/);
                var key = (searchvalues != null && searchvalues.length > 0) ? searchvalues[searchvalues.length - 1] : "";
                timeout && (clearTimeout(timeout), timeout = null);
                timeout = setTimeout(function () { that.LoadData(that.SchemaCode, that.DataField, key); }, 400);
               
            });

      
            var that = this;

            $(this.$Input).bind("focus", this, function (e) { 
                var searchvalues = that.$Input.val().split(/,|，/);
                var key = (searchvalues != null && searchvalues.length > 0) ? searchvalues[searchvalues.length - 1] : "";
                that.LoadData(that.SchemaCode, that.DataField, key); 
                that.$DropList.show(); 
            });

            that.$DropList.off("mousedown.formcombox").on("mousedown.formcombox", ".drop-item-btn", function (e) {
                that.AddSelectedValue.call(that, this.getAttribute("data-val")); 
                if (!that.$Input.is(":focus"))
                { 
                    that.ValChange(); 
                }
            });

            that.$DropList.off("click.formcombox").on("click.formcombox", ".drop-item-btn", function (e) {  
                that.$DropList.hide(); 
                return false;
            });

            that.$DropList.scroll(function () { 
                var scrollTop = this.scrollTop,
                    scrollHeight = this.scrollHeight,
                    clientHeight = this.clientHeight;
                if (scrollTop + clientHeight >= scrollHeight && that.HasMore) {
                    var searchvalues = that.$Input.val().split(/,|，/);
                    var key = (searchvalues != null && searchvalues.length > 0) ? searchvalues[searchvalues.length - 1] : "";
                    that.LoadData(that.SchemaCode, that.DataField, key, that.StopIndex, that.StopIndex + that.PerNum);
               }
            });

            //$(this.$Input).off("click.combox").on("click.combox", function (e) {
            //    e.stopPropagation();
            //});


            //$(document).off("click.combox").on("click.combox", function () {
            //    that.$DropList.hide();
            //});

             $(this.$Input).off("keydown.combox").on("keydown.combox", function (event) {
                var e = event || window.event || arguments.cllee.caller.agrguments[0];
                if (e && e.keyCode == 38) {
                    if (!that.$DropList.is(":hidden")) { 
                            var $li = that.$DropList.children("li.active").removeClass("active");
                            var $prevli = $li.prev();
                            $prevli.addClass("active");
                            that.AddSelectedValue.call(that, $prevli.children("label").attr("data-val"));
                            that.ValChange(); 
                          
                    }
                }
                if (e && e.keyCode == 40) {
                    if (!that.$DropList.is(":hidden")) {
                        if (that.$DropList.children("li.active").length > 0) { 
                            var $li = that.$DropList.children("li.active").removeClass("active");
                            var $nextli = $li.next();
                            $nextli.addClass("active");
                            that.AddSelectedValue.call(that, $nextli.children("label").attr("data-val"));
                            that.ValChange(); 
                        }
                        else {
                            that.$DropList.children("li:first").addClass("active");
                            that.AddSelectedValue.call(that, that.$DropList.children("li:first").children("label").attr("data-val"));
                             that.ValChange(); 
                        }
                       
                    }
                }
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
                this.Value = v;
            }
            this.ValChange();
        },

        AddSelectedValue: function (v) { 
            if (v == null) return;
            if (!this.Editable) {
                this.Value = (v + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if (this.Visible)
                    this.$Input.html(this.Value);
            }
            else {
                var val = this.$Input.val();  
                var index = val.lastIndexOf(",") > val.lastIndexOf("，") ? val.lastIndexOf(",") : val.lastIndexOf("，");
                if (index > 0) {
                    val = val.substring(0, index+1) + v;
                }
                else {
                    val = v;
                }
                this.$Input.val(val);
                this.Value = val;
            } 
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
                return this.$Input.val().trim();
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
            //不可编辑，不可编辑状态为什么还要校验？
            //if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && val != null && val.trim() == "") {

                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            if (!$.isEmptyObject(val)) {
                if (!this.IsMultiple) {
                    //200字符长度
                    if (val.trim().length > 200) {
                        this.AddInvalidText(this.$Input, '字符长度超出限制200个字');
                        return false;
                    }
                } else {
                    if (val.trim().length > 2000) {
                        this.AddInvalidText(this.$Input, '字符长度超出限制2000个字');
                        return false;
                    }
                }
            }
            //if (!$.isEmptyObject(val) && this.Expression && !this.Expression.test(val)) {
            //    this.AddInvalidText(this.$Input, this.ErrorAlert);
            //    return false;
            //}
            //格式验证
            if (!$.isEmptyObject(val) && this.Mode) {
                var exp1 = '';
                var exp2 = '';
                var err = '';
                switch (this.Mode) {
                    case "Email":
                        exp1 = /^\w+([-+.]\w+)*@\w+([-+.]\w+)*\.\w+([-.]\w+)*$/;
                        err = "错误的邮箱格式!";
                        break;
                    case "Mobile":
                    case "Telephone":
                        exp1 = /^1[3-8]\d{9}$/;
                        exp2 = /^(0\d{2,3}-)?\d{7,8}(-\d{1,4})?$/;
                        //exp2 = /^[0-9-()（）]{7,18}$/;
                        err = "错误的电话或手机号码格式!";
                        break;
                    case "Card":
                        exp1 = /^\d{15}(\d{2}[X0-9])?$/
                        err = "错误的身份证格式!";
                        break;
                    default:
                }
                var isValid1 = true;
                var isValid2 = true;
                if (exp1) {
                    isValid1 = exp1.test(val);
                }
                if (exp2) {
                    isValid2 = exp2.test(val);
                }
                if (this.Mode == "Mobile" || this.Mode == "Telephone") {
                    if (!isValid1 && !isValid2) {
                        if (this.invalidText != err)
                            this.AddInvalidText(this.$Input, err);
                        return false;
                    }
                } else {
                    if (!isValid1) {
                        if (this.invalidText != err)
                            this.AddInvalidText(this.$Input, err);
                        return false;
                    }
                }
            }

            this.RemoveInvalidText(this.$Input);
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {
            };
            var oldResult = {
            };
            if (this.ComputationRule == null && !this.Visible) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }

            if (("" + oldResult.Value) != this.GetValue()) {
                result[this.DataField] = this.GetValue().trim();
                return result;
            }

            return {
            };
        },

        LoadData: function (schemacode, propertyname, value, from, to) {
            var that = this;
            if (value == "")
            {
                that.$DropList.children("li:not(:first)").remove();
                return;
            } 
            to = to || that.PerNum;
            that.HasMore = false;
            var scopetype = $("#scopeType").length > 0 ? $("#scopeType").val() : ""; //过滤权限
            that.$loadMore && that.$loadMore.hide();
            var param = {
                SchemaCode: schemacode, PropertyName: propertyname, SearchKey: value, FromRowNum: from || 0, ToRowNum: to, scopeType: scopetype
            };
            this.Ajax(
                    that.FormComboBoxHandler,
                    "POST",
                    param,
                    function (data) { 
                        that.StopIndex = to;
                        if (to == that.PerNum) {
                            that.$DropList.children("li:not(:first)").remove();
                            for (var i = 0; i < data.length; i++) {
                                var ID = $.IGuid(); 
                                var v = data[i],checked = that.SelectedValue.indexOf(v)>-1 ? true : false;
                                if (v != "") {
                                    var item = $('<li class="dropdownlist-item" ><label for="' + ID + '" data-val="' + (v || "--") + '" class="drop-item-btn">' + (v || "--(空值)") + '</label></li>');
                                    that.$DropList.append(item);
                                }
                            }
                            if (data.length === that.PerNum) {
                                that.HasMore = true;
                                that.$loadMore = $('<li style="width:100%; height:20px; line-height:20px; text-align:center;">加载更多......</li>').appendTo(that.$DropList);
                            }
                        }
                        else {
                            var htmls = "";
                            for (var i = 0; i < data.length; i++) {
                                var ID = $.IGuid();
                                var v = data[i], checked = that.SelectedValue.indexOf(v) > -1 ? true : false;
                                if (v != "") {
                                    htmls += '<li class="dropdownlist-item" ><label for="' + ID + '" data-val="' + (v || "--") + '" class="drop-item-btn">' + (v || "--(空值)") + '</label></li>';
                                }
                            }
                            that.$loadMore.before(htmls);
                            if (data.length === that.PerNum) {
                                that.HasMore = true;
                                that.$loadMore.show();
                            }
                        } 
                    },
                    true);
        },
    });
})(jQuery);