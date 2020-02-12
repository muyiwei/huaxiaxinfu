// 系统属性扩张函数 \ 元素扩张插件
(function ($) {
    // 获取字符串类看，所有的字符串添加Trim()函数
    String.prototype = {
        Trim: function () {
            return this.replace(/[ ]/g, "");
        }
    };

    //继承:所有的类继承关系，通过这个函数实现
    //用法:
    //var parentClass=function(){};
    //var subClass=function(){};
    //subClass.Inherit(parentClass,{subFun:function(){}});
    Function.prototype.Inherit = function (parent, overrides) {
        if (typeof parent != 'function') return this;
        // 保存对父类的引用
        this.Base = parent.prototype;
        this.Base.constructor = parent;
        // 继承
        var f = function () { };
        f.prototype = parent.prototype;
        this.prototype = new f();
        this.prototype.constructor = this;
        //附加属性方法
        if (overrides) $.extend(this.prototype, overrides);
    };

    // 对Date的扩展，将 Date 转化为指定格式的String   
    // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
    // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
    // 例子：   
    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
    // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18   
    Date.prototype.Format = function (fmt) { //author: meizz   
        var o = {
            "M+": this.getMonth() + 1,                 //月份   
            "d+": this.getDate(),                    //日   
            "h+": this.getHours(),                   //小时   
            "m+": this.getMinutes(),                 //分   
            "s+": this.getSeconds(),                 //秒   
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度   
            "S": this.getMilliseconds()             //毫秒   
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    //浮动弹出框
    $.fn.FloatBox = function (opt) {
        var _Default = {
            width: 200,
            height: 250,
            offsetLeft: 20,
            offsetHeight: 30,
            base_x: 'innerright',//相对基目标的显示方向  left、innerright、innerLeft、right
            base_y: 'bottom',//target对齐方式目标底部  bottom 、top
            target: null,
            source: this,
            shownCallback: null,
            hiddenCallback: null,
            actions: [],//[title,callback]
            baseDom: null,  //基准对象 如右侧对齐，上侧对齐
            documentClickVisible: true,//点击其他位置隐藏
            topbox: false
        };
        opt = $.extend({}, _Default, opt);
        var container = opt.target;
        return {
            opt: opt,
            getAbsPosition: function (element) {
                var left = 0;
                if (window.parent != window) {
                    if (window.screenLeft != void 0) {
                        left = window.screenLeft;
                    }
                    else if (window.screenX != void 0) {
                        left = window.screenX;
                    }
                }
                var abs = { x: 0, y: 0 };
                if (document.documentElement.getBoundingClientRect) {
                    abs.x = element.getBoundingClientRect().left;
                    abs.y = element.getBoundingClientRect().top;

                    abs.x += left + document.documentElement.scrollLeft - document.documentElement.clientLeft;
                    abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.documentElement.scrollTop - document.documentElement.clientTop;
                } else {
                    while (element != document.body) {
                        abs.x += element.offsetLeft;
                        abs.y += element.offsetTop;
                        element = element.offsetParent;
                    }

                    abs.x += left + document.body.clientLeft - document.body.scrollLeft;
                    abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.body.clientTop - document.body.scrollTop;
                }
                return abs;
            },
            show: function () {
                var right_dis = null, bottom_dis = null, position = this.getAbsPosition(opt.source.get(0));
                if (opt.baseDom) {
                    if (opt.base_x == 'innerright') {
                        var pos = this.getAbsPosition($(opt.baseDom).get(0));
                        var width = $(opt.baseDom).outerWidth();
                        right_dis = pos.x + width;
                    } else if (opt.base_x == 'innerleft' || opt.base_x == 'right') {
                        right_dis = 1000;//取无穷大
                    } else if (opt.base_x == 'left') {
                        var pos = this.getAbsPosition(opt.baseDom);
                        right_dis = pos.x;
                    }

                    //高度不限制
                    bottom_dis = $(window).height();
                } else {
                    right_dis = $(window).width();
                    bottom_dis = $(window).height();
                }

                //判断是否超出区域
                var top = 0, left = 0, selfHeight = $(opt.source).height();
                if ((position.y + selfHeight + opt.offsetHeight + opt.height) > bottom_dis) {
                    //超出屏幕高度，就在上面显示
                    top = position.y - opt.height - opt.offsetHeight;
                } else {
                    if (opt.base_y == 'top') {
                        top = position.y + opt.offsetHeight;
                    } else {
                        top = position.y + selfHeight + opt.offsetHeight;
                    }

                }
                if (position.x + opt.width > right_dis) {
                    left = right_dis - opt.width;
                } else {
                    left = position.x + opt.width;
                }
                container.css({
                    'position': 'absolute', 'top': top,
                    'left': left, 'width': opt.width + 'px',
                    'height': opt.height + 'px',
                    'border': '1px solid #ddd',
                    'box-shadow': '0 0 8px #ddd',
                    'z-index': 888, 'background-color': '#fff',
                    'overflow-y': 'auto'
                });
                container.show();
                if (opt.shownCallback) {
                    opt.shownCallback();
                }

                document.onclick = function (event) {

                    if ($.ReportDesigner.FloatPanels.length == 0) {
                        return;
                    }
                    //如果编辑框显示也不处理
                    if ($('div#field-edit-panel').is(':visible')) {
                        return;
                    }
                    var curFloatPanel = $.ReportDesigner.FloatPanels[$.ReportDesigner.FloatPanels.length - 1];
                    if ($.ReportDesigner.FloatPanels.length - 2 >= 0) {
                        if ($.ReportDesigner.FloatPanels[$.ReportDesigner.FloatPanels.length - 1].opt.target.attr("id") && $.ReportDesigner.FloatPanels[$.ReportDesigner.FloatPanels.length - 1].opt.target.attr("id") == $.ReportDesigner.FloatPanels[$.ReportDesigner.FloatPanels.length - 2].opt.target.attr("id")) {
                            $.ReportDesigner.FloatPanels.pop();
                            $.ReportDesigner.FloatPanels.pop();
                            $.ReportDesigner.FloatPanels.push(curFloatPanel);

                        }
                        //
                    }
                    //if (!opt.documentClickVisible) {
                    //    curFloatPanel.onlyhide();
                    //    return;
                    //}
                    var target = curFloatPanel.opt.target;
                    if (!$(target).is(':visible')) {
                        debugger
                        return;
                    }
                    //判断点击范围
                    var x = event.pageX == 0 ? Math.abs(event.offsetX) : event.pageX;
                    var y = event.pageY == 0 ? Math.abs(event.offsetY) : event.pageY;
                    if (y > ($(target).position().top + $(target).height() + 30) ||
                        y < $(target).position().top - 30 ||
                        x > $(target).position().left + $(target).width() ||
                        x < $(target).position().left - 30
                        ) {

                         
                        if (opt.topbox) { } else {
                            if (!opt.documentClickVisible) {
                                curFloatPanel.onlyhide();
                            }
                            else {
                                curFloatPanel.hide();
                            }
                        }

                       


                    }
                };
            },
            hide: function () {
                //if ($(this.opt.target).is(':visible')) {
                if (this.opt.hiddenCallback) {
                    this.opt.hiddenCallback();
                }
                $(this.opt.target).hide();
                $.ReportDesigner.FloatPanels.pop();
                //}
            },
            onlyhide: function () {
                //if ($(this.opt.target).is(':visible')) {

                $(this.opt.target).hide();
                $.ReportDesigner.FloatPanels.pop();
                //}
            }
        };
    }
})(jQuery);


// JQ 扩张插件
jQuery.extend({
    //创建Guid，用法:$.IGuid()
    IGuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // 读取url的参数值
    IQuery: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = decodeURI(window.location.search.substr(1)).match(reg);
        if (r != null) return decodeURI(r[2]);
        return "";
    },

    IShowSuccess: function (title, msg) {
        if ($.isEmptyObject(title)) {
            title = "提示";
        }
        if ($.isEmptyObject(msg)) {
            msg = "";
        }
        jQuery.gritter.add({
            title: title,
            text: msg,
            class_name: 'growl-success',
            sticky: false,
            time: ''
        });
        $("#gritter-notice-wrapper").css({ "left": ($("body").width() - 300) / 2 + "px" });
    },

    IShowError: function (title, msg) {
        if ($.isEmptyObject(title)) {
            title = "提示";
        }
        if ($.isEmptyObject(msg)) {
            msg = "";
        }
        jQuery.gritter.add({
            title: title,
            text: msg && String(msg),
            class_name: 'growl-danger',
            sticky: false,
            time: ''
        });
        $("#gritter-notice-wrapper").css({ "left": ($("body").width() - 300) / 2 + "px" });
    },

    IShowWarn: function (title, msg) {
        if ($.isEmptyObject(title)) {
            title = "提示";
        }
        if ($.isEmptyObject(msg)) {
            msg = "";
        }
        jQuery.gritter.add({
            title: title,
            text: msg,
            class_name: 'growl-warning',
            sticky: false,
            time: ''
        });
        $("#gritter-notice-wrapper").css({ "left": ($("body").width() - 300) / 2 + "px" });
    },

    //使用bootstrap扩展插件pnotify弹出确认框
    //@title:对话框标题，可以为空
    //@text:对话框弹出消息
    //@callBack:回调函数，传回true/false
    IConfirm: function (title, text, callBack) {
        var that = this;
        $.confirm({
            title: $.isEmptyObject(title) ? "提示" : title,
            content: $.isEmptyObject(text) ? title : text,
            confirmButton: "确定",
            confirmButtonClass: "btn-danger",
            cancelButton: "取消",
            cancelButtonClass: "btn-info",
            cancel: function () {
                if ($.isFunction(callBack)) {
                    callBack.apply(that, [false]);
                }
            },
            confirm: function () {
                this.$confirmButton.attr("disabled", "disabled").text("处理中");
                if ($.isFunction(callBack)) {
                    callBack.apply(that, [true]);
                }
            }
        })
    },

    //使用bootstrap的模态框，用法:$.SheetModal("",$("div"),[]);
    //@title:标题
    //@target:内容，可以是$("<div>") ,也可以是 url地址
    //@actions:工具栏，可不传；[{Text:"test",CallBack:function,Theme:btn-ok其他想要的参数},{Text:"test",DoAction:function,其他想要的参数}],btn-ok,btn-cancel,btn-normal
    //@callback:modal显示后的回调函数
    //@hiddenCallback隐藏后的回调函数
    //@type 内容类型Dom:0,html:1,url:2
    IModal: function (opt) {
        //title, Content, ToolButtons, OnShowCallback, OnHiddenCallback
        var iModal = new Object;
        var DefaultOption = {
            Title: "",
            Content: "",
            ToolButtons: [],
            OnShowCallback: null,
            OnHiddenCallback: null,
            ShowHeader: true,
            ShowFooter: true,
            Type: 0,
            Height: "auto",
            Width: "80%",
            Firstload: null,
            Params: {}
        }
        opt = $.extend({}, DefaultOption, opt);
        iModal.Container = $("<div>");
        iModal.ActionObjects = [];
        iModal.Target = opt.Content;
        iModal.IsUrl = opt.Type == 2;
        iModal.ShowModal = function (title, Content, ToolButtons) {
            localStorage.setItem('DialogArguments', JSON.stringify(opt.Params));
            var that = this;
            this.IsShow = false;
            this.ID = $.IGuid();
            $("body").append(this.Container);
            this.Modal = $('<div class="modal fade" id="' + this.ID + '" tabindex="-1" role="dialog" data-backdrop="static" ></div>').css("overflow", "hidden");
            this.Container.append(this.Modal);
            var modalDialog = $('<div class="modal-dialog" style="-webkit-transition: margin ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;-webkit-transition: margin ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;-webkit-transition: margin ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;"></div>').css("height", opt.Height).css("width", opt.Width);
            this.ModalContent = $('<div class="modal-content"></div>').css("border-radius", "0px").css("width", "100%").css("height", "100%");
            this.ModalHeader = $('<div class="modal-header"><div type="button" class="close" data-dismiss="modal" style="margin:3px 5px;" aria-label="Close">×</div></div>');

            //以下三个主要才是需要填充的
            this.ModalTitle = $('<h4 class="modal-title" id="myModalLabel"></h4>');
            this.Content = $('<div class="modal-body"></div>').css("background-color", "#fff").css("width", "100%").css("height", "100%");
            this.ModalFooter = $('<div class="modal-footer"></div>').css("background-color", "#fff");

            this.Modal.append(modalDialog);
            modalDialog.append(this.ModalContent);
            if (opt.ShowHeader) {
                this.ModalContent.append(this.ModalHeader);
                this.ModalHeader.append(this.ModalTitle);
            }
            this.ModalContent.append(this.Content);
            if (opt.ShowFooter) {
                this.ModalContent.append(this.ModalFooter);
                //操作
                this.SetFooter(ToolButtons);
            }


            this.FooterHeiht = 100;

            this.SetTile(opt.Title);
            this.SetBody(opt.Content);

            if (typeof opt.Firstload === "function")
                opt.Firstload();
            //显示
            this.show();
            var findparentmodal = false;
            if (window.parent != window) {
                $(window.parent.document).find(".modal").each(function () {
                    if (findparentmodal) return;
                    var iframe = $(this).find("iframe");
                    if (!$.isEmptyObject(iframe)) {
                        if (iframe[0])
                            if (!$.isEmptyObject($(iframe[0].contentDocument).find("#" + that.ID))) {
                                that.ParentModal = $(this);
                                $(this).find(".modal-header").attr("style", "background-color: #000;opacity: 0.5;border-bottom:none;")
                                $(this).find(".modal-body").css("box-shadow", "0 5px 15px rgba(0,0,0,.5)");
                                findparentmodal = true;
                            }
                    }
                });
            }
            //绑定关闭事件
            this.Modal.on("hidden.bs.modal", this, function (e) {
                e.data.IsShow = false;
            });

            this.Modal.on("shown.bs.modal", this, function (e) {
                // edited by xc
                //var margintop = ($("body").css("height").replace("px", "") - (modalDialog.height())) / 3 + "px";
                var margintop = ($(window).height() - (modalDialog.height())) / 2 + "px";
                modalDialog.css("margin-top", margintop);
                if (typeof opt.OnShowCallback === "function")
                    opt.OnShowCallback();
            });

            this.Modal.on("hidden.bs.modal", this, function (e) {
                if (window.parent != window) {
                    $(window.parent.document).find('.modal-header').css('background-color', '#f1f1f1');
                }
                if (typeof opt.OnHiddenCallback === "function")
                    opt.OnHiddenCallback();
            });

        },

        iModal.SetTile = function (title) {
            this.ModalTitle.html(title || " ");
        };

        iModal.SetBody = function (Content) {
            if (this.IsUrl) {
                this.Modal.find(".modal-dialog").css("height", opt.Height).css("width", opt.Width).css("margin", "0 auto 0 auto");
                this.Modal.find(".modal-content").width("100%").height("100%");
                if (opt.ShowFooter) {
                    this.Content.css("margin", "0px").css("padding", "0px").height($(window).height() - this.FooterHeiht);
                }
                else {
                    this.Content.css("margin", "0px").css("padding", "0px").css("height", "100%");//
                }
                //兼容firefox
                var iframe = $("<iframe height='100%' width='100%'>")/*.height("100%").width("100%")*/.attr("frameborder", 0).attr("src", Content).attr("id", "iframe_" + this.ID);
                this.Content.append(iframe);
            }
            else {
                $(Content).show();
                if (opt.type == 0)
                    this.Content.append($(Content));
                else (opt.type == 1)
                this.Content.html(Content)
            }
        };
        iModal.SetFooter = function (ToolButtons) {
            this.ModalFooter.html("");
            if (ToolButtons) {
                this.FooterHeiht = 120;
                for (var i = 0; i < ToolButtons.length; i++) {
                    var btnJson = ToolButtons[i];
                    this.AddAction(btnJson);
                }
            }
        }
        iModal.AddAction = function (actionObject) {

            var btn = $('<button type="button" class="masBox-btn ' + actionObject.Theme + '">' + actionObject.Text + '</button>');
            if (actionObject.position && actionObject.position == 'left') {
                btn.css('float', 'left').removeClass('masBox-btn');
            }
            $.extend(actionObject, { ModalManager: this, Element: btn })
            // 绑定修改事件
            if (actionObject.CallBack) {
                btn.unbind("click").bind("click", actionObject, function (e) {
                    e.data.CallBack.apply(e.data);
                });
            }
            this.ActionObjects.push(actionObject);
            this.ModalFooter.append(btn);
        };

        iModal.TrrigeFrameFun = function (action) {
            var frame = window.frames["iframe_" + this.ID];
            if (frame != null) {
                if ($.isFunction(frame.BoxCall)) {
                    frame.BoxCall.apply(this, [action]);
                } else if ($.isFunction(frame.contentWindow.BoxCall)) {
                    frame.contentWindow.BoxCall.apply(this, [action]);
                }
            }
        };

        iModal.show = function (src) {
            if (this.IsShow) return;
            this.IsShow = true;
            var that = this;

            if (typeof opt.OnShowBeforeCallback === "function")
                opt.OnShowBeforeCallback();

            this.Modal.modal("show");
            if (this.IsUrl) {
                var iframeSrc = src || this.Content.find("iframe").attr("src");
                this.Content.find("iframe").attr("src", iframeSrc);

            }
            if (this.ParentModal) {
                this.ParentModal.find(".modal-header").attr("style", "background-color: #000;opacity: 0.5;border-bottom:none;")
            }
        };

        iModal.destroy = function () {
            iModal.Container.remove();
        }

        iModal.hide = function () {
            if (!this.IsShow) return;
            this.IsShow = false;
            $(this.Modal).closest("modal-header").attr("style", "");
            this.Modal.modal("hide");
            if (this.ParentModal) {
                this.ParentModal.find(".modal-header").attr("style", "")
            }
        };

        iModal.SetButtonLoading = function () {
            for (var i = 0; i < this.ActionObjects.length; i++) {
                this.ActionObjects[i].Element.attr("data-loading-text", "loading");
                this.ActionObjects[i].Element.button("loading");
            }
        };

        iModal.ResetButton = function () {
            for (var i = 0; i < this.ActionObjects.length; i++) {
                this.ActionObjects[i].Element.button("reset");
            }
        };

        iModal.ShowModal(opt.title, opt.Content, opt.ToolButtons);

        return iModal;
    },

    //对象克隆,只对对象有效,用法:$.IClone(Obj)
    IClone: function (obj) {
        if (obj == null) return;
        var objClone;
        if (obj.constructor == Object
            || obj.constructor == Array) {
            objClone = new obj.constructor();
        }
        else {
            objClone = new obj.constructor(obj.valueOf());
        }
        jQuery.extend(true, objClone, obj);
        return objClone;

    },

    //数字格式
    //@num:数值
    //@保留小数后几位
    //@separator 千分位分割
    IFormatNumber: function (num, precision, separator) {
        var parts;
        // 判断是否为数字
        if (!isNaN(parseFloat(num)) && isFinite(num)) {
            // 把类似 .5, 5. 之类的数据转化成0.5, 5, 为数据精度处理做准, 至于为什么
            // 不在判断中直接写 if (!isNaN(num = parseFloat(num)) && isFinite(num))
            // 是因为parseFloat有一个奇怪的精度问题, 比如 parseFloat(12312312.1234567119)
            // 的值变成了 12312312.123456713
            num = Number(num);
            // 处理小数点位数
            num = (typeof precision !== 'undefined' ? num.toFixed(precision) : num).toString();
            // 分离数字的小数部分和整数部分
            parts = num.split('.');
            // 整数部分加[separator]分隔, 借用一个著名的正则表达式
            parts[0] = parts[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + (separator || ','));

            return parts.join('.');
        }
        return NaN;
    },

    //读取url的参数值
    IQuery: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = decodeURI(window.location.search.substr(1)).match(reg);
        if (r != null) return decodeURI(r[2]);
        return "";
    },

    //右侧划出的表单
    ISideModal: {
        ModalIdArray: [],
        CallBackArray: {},
        ModalBody: {},
        IsChanged: false,
        CustomParams: {},
        CheckIsChange: true,//检查改变
        Show: function (target, title, hiddenCallback, parentId, checkIsChange, params) {
            if (this.IsChanged) return;
            if (checkIsChange == void 0) {
                this.CheckIsChange = true;
            }
            else {
                this.CheckIsChange = checkIsChange;
            }

            var topValue = -1;
            var width = "70%";
            if (self != top) {
                //this.HideLastModal();
                var $curentModal = top.$("#" + top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1]);
                topValue = -1;
                width = "100%";// $curentModal.width();
            }
            else {
                this.CloseAllModal();
            }

            var $Modal = null;
            var id = $.IGuid();
            $Modal = $('<div></div>');
            $Modal.css("left", "auto");

            $Modal.css("margin-top", top.$.ISideModal.ModalIdArray.length > 0 ? "37px" : "61px");
            $Modal.css("width", width);
            $Modal.css("z-index", "1001");
            $Modal.css("position", "fixed");
            $Modal.css("top", topValue + "px");
            $Modal.css("bottom", "-1px");
            $Modal.css("padding", "0");
            $Modal.css("background-color", "#fff");
            $Modal.css("background-clip", "padding-box");
            $Modal.css("border", "1px solid #adadad");
            $Modal.css("box-shadow", "0 6px 12px rgba(0, 0, 0, .175)");
            if (!title) {
                title = "&nbsp;&nbsp;";
            }
            var $titlePanel = $('<div class="panel" style="margin-bottom:0px;"><div class="panel-heading"><span id="tile_' + id + '">' + title + '<span></div></div>');
            $titlePanel.children("div.panel-heading").append('<button type="button" class="close" data-dismiss="modal"><i aria-hidden="true" class="fa fa-times"></i></button>');
            $Modal.append($titlePanel.hide());
            $Modal.appendTo("body");
            if (target.indexOf("?") > -1) {
                target += "&SideModal=true&mid=" + id;
            }
            else {
                target += "?SideModal=true&mid=" + id;
            }

            //var iframe = $("<iframe name='frame_" + id + "'>").height($(window).height() - $titlePanel.height() - 50).css("width", "100%").attr("frameborder", 0).attr("src", target);
            var iframe = $("<iframe name='frame_" + id + "'>").css("margin", "0").css("margin-left", "-1px").css("padding", "0").css("height", "100%").css("width", "100%").attr("frameborder", 0).attr("src", target);
            $Modal.append(iframe);


            $Modal.css("right", $("body").width() * -1);
            $Modal.children("div.panel:first").find("button.close").click(this, function (e) {
                e.data.AutoClose.apply(e.data, [id]);
            });

            $Modal.attr("id", id);
            $Modal.animate({ right: 0 }, function () {
                //if (self != top) {
                $("body").css("overflow-y", "hidden");
                $("body").addClass("modal-back");
                //}
            });

            //iframe 加载完后读取内容，判断内容是否改变
            var that = this;
            iframe.load(function () {
                var $frameBody = $(window.frames["frame_" + id].document.body);
                that.ModalBody[id] = $frameBody.clone();

                var oldInputs = $(that.ModalBody[id]).find("input,select,area,radio");
                var currentInputs = $frameBody.find("input,select,area,radio");
                for (var i = 0; i < oldInputs.length; i++) {
                    $(oldInputs[i]).val($(currentInputs[i]).val());
                }

                if (/msie/.test(navigator.userAgent.toLowerCase()) && !/opera/.test(navigator.userAgent.toLowerCase())) {
                    // 兼容ie关掉iframe后文本框不能输入值的问题
                    var $ie11focus = $frameBody.find("#ie11focus");
                    if ($ie11focus.length == 0) {
                        $ie11focus = $("<input type='text' id='ie11focus' style='width:0;height:0;padding:0;margin:0;border:0;' />");
                        $frameBody.find(".sheet_container").prepend($ie11focus);
                    }
                    $ie11focus.focus();
                }

                //点击其他地方，关闭
                that.ClickDocumentToClose.apply(that, [id]);
            });

            top.$.ISideModal.ModalIdArray.push(id);

            if (typeof (params) != "undefined") {
                top.$.ISideModal.CustomParams[id] = params;
            }

            if ($.isFunction(hiddenCallback)) {
                this.CallBackArray[id] = hiddenCallback;
            }
        },

        SetTile: function (Text, ModalId) {
            if (ModalId) {
                $("#tile_" + ModalId).text(Text);
            }
            else {
                ModalId = top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1];
                if (ModalId) {
                    this.SetTile(Text, ModalId);
                }
            }
        },

        GetParamValue: function (name) {
            var modalId = top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1];
            if (top.$.ISideModal.CustomParams[modalId] == null || (top.$.ISideModal.CustomParams[modalId][name]) == "undefined") {
                return null;
            }
            else {
                return top.$.ISideModal.CustomParams[modalId][name];
            }
        },

        ClickDocumentToClose: function (ModalId) {
            var objEvents = $(document).data("events");
            if (objEvents && objEvents["click"]) {
                var evts = objEvents["click"];
                for (var i = 0; i < evts.length; i++) {
                    if (evts[i].namespace == "Close_" + ModalId) {
                        return;
                    }
                }
            }
            //为什么one绑定的事件执行不止一次？
            $(document).one("click.Close_" + ModalId, [ModalId, this], function (e) {
                var tid = e.data[0];
                if ($(e.target).closest("#" + tid).length == 0 &&
                    $(e.target).closest("div.jconfirm").length == 0 &&
                    $(e.target).closest(".DeveloperTool").length == 0 &&
                    $(e.target).closest(".DeveloperMask").length == 0) {
                    $.ISideModal.AutoClose(tid, true);
                }
                else {
                    e.data[1].ClickDocumentToClose.apply(e.data[1], [ModalId]);
                }
            });
        },

        //检查是否改变
        CheckBodyIsChange: function (ModalId) {
            var oldBody = this.ModalBody[ModalId];
            if (oldBody == null) return false;
            if (window.frames["frame_" + ModalId] == null) return false;
            var currentBody = $(window.frames["frame_" + ModalId].document.body);
            //if (oldBody[0].outerHTML != currentBody[0].outerHTML) {
            //    return true;
            //}

            var oldInputs = oldBody.find("input:not([type='file']),select,area,radio");
            var currentInputs = currentBody.find("input:not([type='file']),select,area,radio");
            for (var i = 0; i < oldInputs.length; i++) {
                if ($(oldInputs[i]).val() != $(currentInputs[i]).val()) {
                    return true;
                }
            }

            //判断选人控件
            var oldUsers = oldBody.find("div.SheetUser[data-datafield][data-controlkey='SheetUser']");
            var currentUsers = currentBody.find("div.SheetUser[data-datafield][data-controlkey='SheetUser']");
            for (var i = 0; i < oldUsers.length; i++) {
                if ($(oldUsers[i]).find("span").length != $(currentUsers[i]).find("span").length) {
                    return true;
                }
            }
            //判断关联查询
            var oldQuery = oldBody.find("div[data-datafield][data-controlkey='SheetQuery']");
            var currentQuery = currentBody.find("div[data-datafield][data-controlkey='SheetQuery']");
            for (var i = 0; i < oldQuery.length; i++) {
                if ($(oldQuery[i]).find("pre").html() != $(currentQuery[i]).find("pre").html()) {
                    return true;
                }
            }

            return false;
        },

        HideLastModal: function () {
            if (top.$.ISideModal.ModalIdArray.length > 0) {
                $("#" + top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1]).animate({ right: $("body").width() * -0.75 });
            }
        },

        CloseAllModal: function () {
            for (var i = 0; i < top.$.ISideModal.ModalIdArray.length; i++) {
                this.Close(top.$.ISideModal.ModalIdArray[i]);
            }
            top.$.ISideModal.ModalIdArray = [];
        },

        //自动关闭
        AutoClose: function (ModalId, isDocuemnt) {
            var that = this;
            //判断是否改变
            if (this.CheckIsChange && this.CheckBodyIsChange(ModalId)) {
                this.IsChanged = true;
                $.IConfirm("", "确定放弃保存?放弃后数据不会被保存！", function (isTrue) {
                    that.IsChanged = false;
                    if (isTrue) {
                        delete that.ModalBody[ModalId];
                        that.Close.apply(that, [ModalId]);
                    }
                    else if (isDocuemnt) {
                        that.ClickDocumentToClose.apply(that, [ModalId]);
                    }
                });
                return;
            }
            this.Close(ModalId);
        },

        //手工关闭
        Close: function (ModalId) {
            if (ModalId) {
                //移除
                $("#" + ModalId).animate({ right: $("body").width() * -0.75 }, function () {
                    $("#" + ModalId).remove();
                    $("body").css("overflow-y", "auto");
                    $("body").removeClass("modal-back");
                });

                var index = $.inArray(ModalId, top.$.ISideModal.ModalIdArray);
                if (index > -1) {
                    top.$.ISideModal.ModalIdArray.splice(index, 1);
                }

                if (this.CallBackArray[ModalId] && $.isFunction(this.CallBackArray[ModalId])) {
                    this.CallBackArray[ModalId].call();
                }

                //移除后，还有的话，显示最后一个
                //this.ShowLastModal();
            }
            else if (self == top) {
                this.CloseAllModal();
            }
            else {
                this.CloseLastModal();
            }
        },

        CloseLastModal: function () {
            if (top.$.ISideModal.ModalIdArray.length > 0) {
                this.Close(top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1]);
            }
        },

        ShowLastModal: function () {
            if (top.$.ISideModal.ModalIdArray.length > 0) {
                var id = top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 1];
                $("#" + id).animate({ right: 0 });
                //点击其他地方，关闭
                this.ClickDocumentToClose.apply(this, [id]);
            }
        },

        GetPreModalBody: function () {
            if (top.$.ISideModal.ModalIdArray && top.$.ISideModal.ModalIdArray.length > 1) {
                return window.frames["frame_" + top.$.ISideModal.ModalIdArray[top.$.ISideModal.ModalIdArray.length - 2]].document.body;
            }
            else {
                return null;
            }
        }
    },

    //打开表单模态窗口
    ISheetModal: {
        SheetMoal: null,
        //url:地址,title：模态窗口标题，可为空
        Show: function (url, title, hiddenCallback) {
            url = url.indexOf("?") > -1 ? url + "&t=" + $.IGuid() : url + "?t=" + $.IGuid();
            if (this.SheetMoal) {
                this.SheetMoal.Show(url);
            }
            else {
                this.SheetMoal = new $.IModal(title, url, null, null, hiddenCallback);
            }
        },
        Hide: function () {
            this.SheetMoal.Hide();
        }
    },

    //获取日期时间字符串，格式yyyy-MM-dd HH:mm:ss
    IGetDateString: function (datetime) {
        var Year = datetime.getFullYear();
        var Month = datetime.getMonth() + 1;
        var Day = datetime.getDate();
        var Hour = datetime.getHours();
        var Minutes = datetime.getMinutes();
        var Seconds = datetime.getSeconds();
        var DateStr = "";

        DateStr = Year + "-";
        if (Month > 10) {
            DateStr = DateStr + Month + "-";
        } else {
            DateStr = DateStr + "0" + Month + "-";
        }
        if (Day > 10) {
            DateStr = DateStr + Day + " ";
        } else {
            DateStr = DateStr + "0" + Day + " ";
        }
        if (Hour > 10) {
            DateStr = DateStr + Hour + ":";
        } else {
            DateStr = DateStr + "0" + Hour + ":";
        }
        if (Minutes > 10) {
            DateStr = DateStr + Minutes + ":";
        } else {
            DateStr = DateStr + "0" + Minutes + ":";
        }
        if (Seconds > 10) {
            DateStr = DateStr + Seconds;
        } else {
            DateStr = DateStr + "0" + Seconds;
        }
        return DateStr;
    },

    //查询数组里对象跟指定对象的某个属性相等的第一个位置
    IGetIndex: function (obj, array, attr) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][attr] == obj[attr]) {
                return i;
            }
        }
        return -1;
    },

    //判断浏览器设备类型
    IIfMobile: function () {
        var MobileUA = (function () {
            var ua = navigator.userAgent.toLowerCase();

            var mua = {
                IOS: /ipod|iphone|ipad/.test(ua), //iOS
                IPHONE: /iphone/.test(ua), //iPhone
                IPAD: /ipad/.test(ua), //iPad
                ANDROID: /android/.test(ua), //Android Device
                WINDOWS: /windows/.test(ua), //Windows Device
                TOUCH_DEVICE: ('ontouchstart' in window) || /touch/.test(ua), //Touch Device
                MOBILE: /mobile/.test(ua), //Mobile Device (iPad)
                ANDROID_TABLET: false, //Android Tablet
                WINDOWS_TABLET: false, //Windows Tablet
                TABLET: false, //Tablet (iPad, Android, Windows)
                SMART_PHONE: false //Smart Phone (iPhone, Android)
            };

            mua.ANDROID_TABLET = mua.ANDROID && !mua.MOBILE;
            mua.WINDOWS_TABLET = mua.WINDOWS && /tablet/.test(ua);
            mua.TABLET = mua.IPAD || mua.ANDROID_TABLET || mua.WINDOWS_TABLET;
            mua.SMART_PHONE = mua.MOBILE && !mua.TABLET;

            return mua;
        }());
        if (MobileUA.SMART_PHONE) {
            return true;
        }
        return false;
    },

    //检查是否是严格的文本:非空，不含有特殊字符 `!@#$%^&*()-_+=[{]}\\|;:\'\",<.>/? ~！￥…（）【】、：；‘“”，。《》？
    //IgnoreChars 可不传，数组，排除的类
    IValidateStrictText: function (str, IgnoreChars) {
        if (str == null || str.trim() == "") {
            return false;
        }
        var SpecialChars = ['`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', '{', ']', '}', '\\', '|', ';', ':', '\'', '\"', ',', '<', '.', '>', '/?', ' ', '~', '！', '￥', '…', '（', '）', '【', '】', '、', '：', '；', '‘', '“', '”', '，', '。', '《', '》', '？'];
        if (!$.isEmptyObject(IgnoreChars)) {
            for (var i = 0; i < IgnoreChars.length; i++) {
                var index = SpecialChars.indexOf(IgnoreChars[i]);
                if (index > -1)
                    SpecialChars.splice(index, 1);
            }
        }
        for (var i = 0; i < str.length; i++) {
            if (SpecialChars.indexOf(str.charAt(i)) > -1) {
                return false;
            }
        }
        return true;
    },

    //检查是否是严格的文本:非空，不含有特殊字符 `!@#$%^&*()-_+=[{]}\\|;:\'\",<.>/? ~！￥…（）【】、：；‘“”，。《》？
    //IgnoreChars 可不传，数组，排除的类
    IValidatePassword: function (str) {
        if (str == null || str.trim() == "") {
            return false;
        }
        var match = /^[a-zA-Z0-9,.'"~!@@#$%^&*()_+{}[]|\/:;<>?`-=·！￥…（）—【】、，。《》？]*$/;
        var match1 = /\s/;
        if (str.length < 6 || str.length > 20) {
            return false;
        }
        for (var ooo = 0; ooo < str.length; ooo++) {
            if (!match.test(str.charAt(ooo)) || match1.test(str.charAt(ooo)))
                return false;
        }
        //密码强度
        var match2 = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/;
        if (!match2.test(str))
            return false;
        return true;
    },

    //校验电话号码
    IValidateMobile: function (str) {
        if (str == null || str.trim() == "") {
            return false;
        }
        var expression = /^1[3-8]\d{9}$/;
        return expression.test(str);
    },

    //校验邮箱
    IValidateEmail: function (str) {
        if (str == null || str.trim() == "") {
            return false;
        }
        var expression = /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$/;
        return expression.test(str);
    },

    //校验微信号
    IValidateChat: function (str) {

    },
    /*
    鼠标滑过元素时在页面上生成缩略图
    selector：元素选择器
    imgPath：图片的路径
    */
    Ipreview: function (selector) {
        var imgPath = selector.attr("data-imgurl");
        if (imgPath == "null" || imgPath == null || imgPath == void 0) {
            return;
        }
        var $preImgHtml = $('<div class="preimg"><img src="' + imgPath + '"  class="pcimg" /></div>');

        selector.mouseover(function (e) {
            selector.after($preImgHtml);
            $(".preimg").css({ top: e.clientY + 3, left: e.clientX + 10 });
        }).mousemove(function (e) {
            $(".preimg").css({ top: e.clientY + 3, left: e.clientX + 10 });
        }).mouseout(function () {
            $(".preimg").remove();
        });
    },

    //设置Cookie
    ISetCookie: function (name, value) {
        var str = name + "=" + escape(value);
        document.cookie = str;
    },

    //读取Cookie
    IGetCookie: function (name) {
        var arr = document.cookie.split(";");
        if (!name)
            return null;
        var name = name.trim();
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i].split("=")[0].trim();
            if (key == name) {
                return arr[i].split("=")[1];
            }
        }
        return null;
    },

    //删除Cookie
    IRemoveCookie: function (name) {
        document.cookie = name + "=;expires=" + (new Date(0)).toGMTString();
    },

    // 字符图标选择器
    IFontPicker: function () {
        var source = [];
        var fontPickerCollection = [];
        var init = function () {
            var path = document.location.href;
            var pathName = document.location.pathname;
            var localPath = path.substr(0, path.indexOf(pathName));
            $.ajaxSettings.async = false;
            $.getJSON(localPath + '/Content/H3-Icon/selection.json', function (data) {
                var icons = [];
                for (var i = 0, len = data.icons.length; i < len; i++) {
                    icons.push('icon-' + data.icons[i].properties.name);
                }
                source = icons;
            });
        };
        init();

        this.AddFontPicker = function (selecter) {
            if (source.length > 0) {
                var fontPicker = $(selecter).fontIconPicker({
                    source: source,
                    emptyIcon: false,
                    hasSearch: false
                });
                fontPickerCollection.push({ 'selecter': selecter.selecter, 'picker': fontPicker });
            }
        };
        var getFontPicker = function (selecter) {
            if (selecter) {
                if (fontPickerCollection.length == 1) return fontPickerCollection[0].picker;
                for (var i = 0, len = fontPickerCollection.length; i < len; i++) {
                    if (fontPickerCollection[i].picker && fontPickerCollection[i].picker.selector == selecter.selector) {
                        return fontPickerCollection[i].picker;
                    }
                }
                return null;
            }
        };
        //动态参数
        this.SetIcon = function (icon, selecter) {
            var fontPicker = null;
            if (!selecter) {
                fontPicker = fontPickerCollection[0].picker;
            } else {
                fontPicker = getFontPicker(selecter);
            }
            if (fontPicker) {
                fontPicker.refreshPicker({
                    source: source,
                    emptyIcon: true,
                    emptyIconValue: icon,
                    hasSearch: false
                });
            }

        };
        return this;
    },
    isArray: function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    },
    IShowLoading: function (text) {
        var text = text || "处理中，请稍等...";
        var $loading = $(".loading-back");
        if ($loading.length > 0) {
            $loading.find("load-title").text(text).end().show();
        } else {
            $loading = $('<div class="loading-back">' +
                            '<div class="loading">' +
                                '<i class="fa fa-spinner fa-4x fa-pulse"></i>' +
                                '<span class="load-title">' + text + '</span>' +
                            '</div>' +
                        '</div>');
            $("body").append($loading.show());
        }
    },
    IHideLoading: function () {
        $(".loading-back").hide();
    },
    //只允许输入中英文数字符号，目的是过滤表情
    IFilterCharacter: function (str) {
        var newStr = str;
        var range = /[\u4e00-\u9fa5a-zA-Z0-9\~\!\@\#\$\%\&\*\(\)\_\+\|\:\"\<\>\?\/\-\=\[\]\;\,\.\！\￥\……]/g;
        var arr = str.match(range);
        if (arr == null)
            newStr = "";
        else
            newStr = arr.join('');
        return newStr
    },
    //数字转成千分位(对小数位没有做限制)
    IToKbit: function (num) {
        var num = (num || 0).toString(), result = '';
        if (isNaN(num)) return 0;
        var numStr = num + '';
        var potIndex = numStr.indexOf('.');
        var decimal = '';
        if (potIndex > -1) {
            num = numStr.slice(0, potIndex);
            decimal = numStr.slice(potIndex);
        }
        num = parseInt(num);
        var negative = false;//负数
        if (num < 0) {
            negative = true;
            num = Math.abs(num) + '';
        }
        num += '';
        while (num.length > 3) {
            result = ',' + num.slice(-3) + result;
            num = num.slice(0, num.length - 3);
        }
        if (num) { result = num + result; }
        if (potIndex > -1) {
            result += decimal;
        } else {
            //result += '.00';
        }
        if (negative) {
            result = '-' + result;
        }
        return result;
    }
});

