//add by qc 2017-04-26
(function ($) {
    function DropDownList(opt) {
        this.Opt = opt || {};
        this.Width = opt.Width;
        this.Init();
    }
    DropDownList.prototype = {
        Init: function () {
            this.GetOptions();
            this.Render();
            this.BindEvent();
        },
        GetOptions: function () {
            this.Options = {};
            this.OptionAyy = [];
            var ops = this.Opt.Target.options;
            for (var i = 0, len = ops.length; i < len; i++) {
                var item = ops[i];
                this.OptionAyy.push(item.value);
                this.Options[item.value] = item.text;
            }
        },
        Render: function () {
            var that = this;
            var html = '<div class="dropdownlist">' +
                '<div class="drop-handle">' +
                '<div class="drop-text"></div>' +
                '<span class="drop-btn"></span>' +
                '</div>' +
                '</div>';
            that.Height = $(that.Opt.Target).outerHeight();
            that.Height = that.Height < 26 ? 26 : that.Height;
            var w = $(that.Opt.Target).outerWidth();

            var pec = parseInt($(that.Opt.Target).outerWidth()) * 100 / parseInt($(that.Opt.Target).parent().width());
            pec = pec > 100 ? 100 : pec;
            that.$DropDown = $(html).attr("style", $(that.Opt.Target).attr("style")).css("width", (that.Width || pec + "%"));
            that.$DropList = $('<ul class="drop-list drop-list_s"></ul>').appendTo($("body"));
            that.$DropDown.height(that.Height);
            that.$DropHandle = that.$DropDown.children('.drop-handle').css({
                "height": that.Height + 'px',
                "line-height": that.Height - 2 + 'px'
            });
            that.$DropText = that.$DropHandle.children('.drop-text');
            $(that.Opt.Target).before(that.$DropDown.css("display", "inline-block")).hide();
            that.RenderOptions();
        },
        RenderOptions: function () {
            var that = this;
            that.$DropList.html("");
            for (var i = 0, len = that.OptionAyy.length; i < len; i++) {
                var opt = that.OptionAyy[i];
                that.$DropList.append('<li class="dropdownlist-item ' + (that.Opt.Target.value == opt ? 'active' : null) + '" data-index="' + i + '" data-value="' + opt + '"><a class="drop-item-btn">' + that.Options[opt] + '</a></li>');
            }

            that.SetValue.apply(that, [that.Opt.Target.value]);
        },
        BindEvent: function () {
            var that = this;
            that.$DropHandle.bind('click', function (e) {
                var $Tar = that.$DropList;
                $("ul.drop-list").not($Tar).hide();
                that.$DropList.css("min-width", that.$DropDown.width());
                var w = 30 * that.OptionAyy.length;
                w = w > 300 ? 300 : w;
                var offset = that.$DropDown.offset();
                var left = 0;
                var $par = that.$DropDown.parent();
                while ($par.length > 1 && $par[0].tagName.toLowerCase() != "window") {
                    left += $par.scrollLeft();
                    $par = that.$DropDown.parent();
                }
                var top = $(window).height() - offset.top + $(window).scrollTop() - that.Height - 10;
                if (top < w) {
                    that.$DropList.css({ "top": offset.top - that.$DropList.outerHeight(), "left": offset.left - left });
                } else {
                    that.$DropList.css({ "top": offset.top + that.Height, "left": offset.left - left });
                }
                $Tar.toggle();
                return false;
            });
            that.$DropList.on("click", ".dropdownlist-item", function () {
                if ($(this).hasClass("active")) return;
                $(this).addClass("active").siblings(".dropdownlist-item").removeClass("active");
                that.SetValue.apply(that, [$(this).attr("data-value")]);
                $(this).parent().hide();
                $(that.Opt.Target).change();
                return false;
            })

            $(that.Opt.Target).unbind("change.dropdownlist-select").bind("change.dropdownlist-select", function () {
                that.$DropText.html(that.Options[this.value]);
                that.$DropList.children("li.dropdownlist-item").removeClass("active").end().children("li.dropdownlist-item[data-value='" + this.value + "']").addClass("active");
                return false;
            });

            $(document).unbind("click.dropdownlist-cl").bind("click.dropdownlist-cl", function () {
                $("ul.drop-list.drop-list_s").hide();
            })
        },
        SetValue: function (val, index) {
            this.$DropText.html(this.Options[val]);
            if (index) {
                this.Opt.Target.selectedIndex = index;
            }
            this.Opt.Target.value = val;
            this.$DropList.children("li.dropdownlist-item").removeClass("active").end().children("li.dropdownlist-item[data-value='" + val + "']").addClass("active");
        },
        Destroy: function () {
            var that = this;
            that.$DropDown.remove();
            that.$DropList.remove();
            $(that.Opt.Target).show().removeData("DropDownList");
        },
        Refresh: function (width) {
            this.GetOptions();
            this.RenderOptions();
            width && this.$DropDown.css("width", width);
            return this;
        },
        AddItem: function (value, text) {
            var that = this;
            that.OptionAyy = this.OptionAyy || [];
            that.Options = this.Options || {};
            that.OptionAyy.push(value);
            that.Options[value] = text;

            that.$DropList.append('<li class="dropdownlist-item" data-index="' + that.OptionAyy.length-1 + '" data-value="' + value + '"><a class="drop-item-btn">' + text + '</a></li>');
        },
        ClearItems: function () {
            this.$DropText.html("");
            this.$DropList.children("li.dropdownlist-item").removeClass("active")
        }
    }

    $.fn.DropDownList = function (param) {
        var args = Array.prototype.slice.call(arguments, 1);
        
        $(this).each(function () {
            var $this = $(this), DropDown = $this.data("DropDownList");

            if (DropDown && param && typeof param === "string") {
                DropDown[param].apply(DropDown, args);
            } else if (DropDown) {
                DropDown.Refresh.call(DropDown);
            } else {
                var opt = { Target: this };
                typeof param === "object" && (opt = $.extend(opt, param));
                $(this).data("DropDownList", new DropDownList(opt));
            }
        });
        return $(this);
    }

}(jQuery));


//支持单选和多选下拉框（多选情况下多个Value值以分号隔开）
(function ($) {
    function SelectForm(opt) {
        this.Options = $.extend({}, DefaultOpt, opt);
        this.$Wrapper = $('<div ' + (this.Options.ID ? ('ID="' + this.Options.ID + '"') : '') + ' class="dropdownlist">' +
               '<div class="drop-handle">' +
               '<div class="drop-text"></div>' +
               '<span class="drop-btn"></span>' +
               '</div>' +
               '<ul class="drop-list"></ul>' +
               '</div>');
        this.$Items = this.$Wrapper.find(".drop-list");
        this.$Text = this.$Wrapper.find(".drop-text");
        this.$Btn = this.$Wrapper.find(".drop-btn");
        this.$DropHandle = this.$Wrapper.find(".drop-handle");
        this.LiHTML = this.Options.IsMultiple ? '<li class="dropdownlist-item" data-index="{{0}}" data-value="{{1}}" style="padding-left:1em;"><input type="checkbox" class="input-drop" id="{{2}}"><label for="{{2}}" class="drop-item-btn">{{3}}</label></li>' : '<li class="dropdownlist-item" data-index="{{0}}" data-value="{{1}}"><a class="drop-item-btn">{{2}}</a></li>';

        this._Init();
    }

    SelectForm.prototype = {
        _Init: function () {
            var that = this;
            that.ItemLength = that.Options.DropList.length
            var index = 0;
            this.ListItems = {};
            //全选
            if (that.Options.IsMultiple) {
                var ID = $.IGuid();
                this.$Items.append('<li class="dropdownlist-item" style="padding-left:1em;"><input type="checkbox" class="input-drop selectall" id="'+ID+'"><label for="'+ID+'" class="drop-item-btn">全选</label></li>');
            }

            for (var i = 0; i < that.ItemLength; i++) {
                var obj = this.Options.DropList[i];
                obj.Index = index;
                this.ListItems[obj.Value] = obj;
                if (that.Options.IsMultiple) {
                    var ID = $.IGuid();
                    this.$Items.append(that.LiHTML.replace(/\{{0\}}/g, index++).replace(/\{{1\}}/g, obj.Value).replace(/\{{2\}}/g, ID).replace(/\{{3\}}/g, obj.Text));
                }
                else {
                    this.$Items.append(that.LiHTML.replace(/\{{0\}}/g, index++).replace(/\{{1\}}/g, obj.Value).replace(/\{{2\}}/g, obj.Text));
                }
            }

            that.$DropHandle = that.$Wrapper.children('.drop-handle').css({
                "height": that.Options.Height + 'px',
                "line-height": that.Options.Height - 2 + 'px'
            });
            this.$Wrapper.width(this.Options.Width).height(this.Options.Height);
            that.$Items.css({ "left": 0, 'min-width': "100%" });
            this.SetValue(this.Options.DefaultValue);

            this._BindEvent();

            that.Options.Target && $(that.Options.Target).append(this.$Wrapper);
        },
        _BindEvent: function () {
            var that = this;
            that.$DropHandle.bind('click', function (e) {
                //var $Tar = that.$Items;
                $("ul.drop-list").not(that.$Items).hide();
                var w = 30 * that.ItemLength;
                w = w > 300 ? 300 : w;
                var offset = that.$Wrapper.offset();

                var top = $(window).height() - offset.top + $(window).scrollTop() - that.Options.Height - 1;
                if (top < w) {
                    that.$Items.css({ bottom: "100%", top: "auto" });
                } else {
                    that.$Items.css({ bottom: "auto", top: "100%" });
                }
                that.$Items.toggle();
                return false;
            });

            if (that.Options.IsMultiple) {
                that.$Items.on("click", "input[type=checkbox].input-drop", function (e) {
                    //全选
                    if ($(this).hasClass("selectall")) {
                        if (this.checked) {
                            var texts = [];
                            for(var key in that.ListItems){
                                texts.push(key);
                            }
                            that.SetValue.call(that, texts.join(";"));

                            that.$Items.find("input[type=checkbox].input-drop").prop("checked", true);
                        } else {
                            that.SetValue.call(that, "");
                            that.$Items.find("input[type=checkbox].input-drop:checked").prop("checked", false);
                        }
                    } else {
                        var value = "";
                        var len = 0;
                        that.$Items.find("input[type=checkbox].input-drop:checked").not(".selectall").each(function () {
                            len++;
                            value = value ? value + ";" + $(this).parent(".dropdownlist-item").attr("data-value") : $(this).parent(".dropdownlist-item").attr("data-value");
                        })
                        if (this.checked) {
                            len === that.ItemLength && that.$Items.find("input[type=checkbox].selectall").prop("checked", true);
                        } else {
                            that.$Items.find("input[type=checkbox].selectall").prop("checked",false);
                        }
                        that.SetValue.call(that, value);
                    }
                    e.stopPropagation();
                })


                that.$Items.on("click", "input[type=checkbox]+label", function (e) {
                    e.stopPropagation();
                })
            } else {
                that.$Items.on("click", ".dropdownlist-item", function () {
                    if ($(this).hasClass("active")) return;
                    $(this).addClass("active").siblings(".dropdownlist-item").removeClass("active");
                    that.SetValue.apply(that, [$(this).attr("data-value")]);
                })

                $(document).unbind("click.dropdownlist-cl").bind("click.dropdownlist-cl", function (e) {
                    $(".drop-handle > ul.drop-list").hide();
                });
            }
        },
        SetValue: function (val) {
            var that = this;
            if (val) {
                var items = val.split(';');
                var text = '';
                for (var i = 0, len = items.length; i < len; i++) {
                    var obj = this.ListItems[items[i]];
                    if (obj) {
                        text += obj.Text + (i == len - 1 ? "" : ';');
                        that.Options.IsMultiple == false ? this.$Items.children("li.dropdownlist-item[data-value='" + obj.Value + "']").addClass("active") : this.$Items.children("li.dropdownlist-item[data-value='" + obj.Value + "']").find("input[type=checkbox]").prop("checked", true);
                    }
                    else {
                        console.log("设置的值不存在");
                    }
                }
                this.$Text.text(text);
            }
            else {
                this.$Text.text(this.Options.DefaultText);
            }
            this.Value = val || "";
            this.$Wrapper.attr("data-value", val);
        },
        AddItem: function (obj, index) {
            var that = this;
            index = index || that.ItemLength;
            obj.Index = index;
            that.ListItems[obj.Value] = obj;
            that.Refresh();
            that.ItemLength++;
        },
        RemoveItem: function (val) {
            var that = this;
            var item = that.ListItems[val];
            for (var key in that.ListItems) {
                if (that.ListItems[key].Index > item.Index) that.ListItems[key].Index--;
            }
            that.ItemLength--;
            delete that.ListItems[val];
            this.Refresh();
        },
        RemoveAt: function (index) {
            //待新增
        },
        Refresh: function () {
            var that = this;
            var l = 0, html = "";
            while (l < that.ItemLength) {
                html += "{{" + i + "}}";
            }

            if (that.Options.IsMultiple) {
                var ID = $.IGuid();
                this.$Items.append('<li class="dropdownlist-item" style="padding-left:1em;"><input type="checkbox" class="input-drop selectall" id="' + ID + '"><label for="' + ID + '" class="drop-item-btn">全选</label></li>');
            }

            for (var key in that.ListItems) {
                var obj = that.ListItems[key];
                var reg = new RegExp("\\{" + obj.Index + "\\}", "g");

                var lihtml = "";
                if (that.Options.IsMultiple) {
                    var ID = $.IGuid();
                    lihtml = that.LiHTML.replace(/\{{0\}}/g, obj.Index).replace(/\{{1\}}/g, obj.Value).replace(/\{{2\}}/g, ID).replace(/\{{3\}}/g, obj.Text);
                }
                else {
                    lihtml = that.LiHTML.replace(/\{{0\}}/g, obj.Index).replace(/\{{1\}}/g, obj.Value).replace(/\{{2\}}/g, obj.Text);
                }
                html.replace(reg, lihtml);
            }
            that.$Items.append(html);
        },
        AppendTo: function ($tar) {
            var that = this;
            $tar && $tar.append(that.$Wrapper);
            return that;
        },
        AppendAftar: function ($tar) {
            var that = this;
            $tar && $tar.after(that.$Wrapper);
            return that;
        }

    }

    var DefaultOpt = {
        Height: 30,
        Width: '100%',
        DropList: [],//object 数组{Value:xxx,Text:xxx}
        DefaultValue: null,
        DefaultText: "--请选择--",
        IsMultiple: false,  //是否多选
        ID: null,
        Target:null
    }

    $.SelectForm = function (opt) {
        return new SelectForm(opt);
    }

    $.fn.SelectForm = function (opt) {
        var args = Array.prototype.slice.call(arguments, 1);
        $(this).each(function () {
            var $this = $(this), DropDown = $this.data("SelectForm");

            if (DropDown && typeof opt === 'string') {
                DropDown[opt].apply(DropDown, args);
            } else if (DropDown) {
                DropDown.Refresh.call(DropDown);
            } else {
                var option = $.extend({ Target: this }, opt);
                $(this).data("SelectForm", new SelectForm(opt));
            }
        })
        return $(this);
    }
}(jQuery));