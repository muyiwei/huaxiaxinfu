var MvcSheetUIGlobalString = {
    "RegularExpression_errorMessage": "绑定的正则表达式不合法:"
};

//// 同步方式获取本地化字符串
//$.ajax({
//    type: "GET",
//    url: _PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx?Code=RegularExpression_errorMessage",
//    async: false,
//    dataType: "json",
//    success: function (data) {
//        if (data.IsSuccess) {
//            MvcSheetUIGlobalString = data.TextObj;
//        }
//    }
//});


//组件基类
(function ($) {
    //继承函数:所有的类继承关系，通过这个函数实现
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

    // 获取字符串类
    String.prototype = {
        trim: function () {
            return this.replace(/[ ]/g, "");
        }
    }
    Date.prototype.format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "S": this.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? o[k] : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    },
    /*
    *中英文翻译格式转换，如：**{0}**{1}*；替换其中特定数值
    */
      $.TranslationFormat = function (source, params) {
          if (arguments.length == 1)
              return function () {
                  var args = $.makeArray(arguments);
                  args.unshift(source);
                  return $.TranslationFormat.apply(this, args);
              };
          if (arguments.length > 2 && params.constructor != Array) {
              params = $.makeArray(arguments).slice(1);
          }
          if (params.constructor != Array) {
              params = [params];
          }
          $.each(params, function (i, n) {
              source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
          });
          return source;
      },
    //获取SheetUi控件管理器
    $.fn.SheetUIManager = function (rowNum) {
        var manager;
        if ($(this).data($.MvcSheetUI.SheetIDKey)) {
            return $.MvcSheetUI.ControlManagers[$(this).data($.MvcSheetUI.SheetIDKey)]
        }

        //数据项
        var datafield = $(this).data($.MvcSheetUI.DataFieldKey.toLowerCase());
        if (datafield == undefined) return manager;

        var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, rowNum);
        if (dataitem == undefined)
            return manager;

        //控件名称:如 SheetTextBox,可以直接 $(this).SheetTextBox(),也可以通过 $.MvcSheetUI.Run.call(this,"SheetTextBox",{参数});
        //var controlName = $(this).attr($.MvcSheetUI.PreDataKey + $.MvcSheetUI.SheetControlKey.toLowerCase());
        //$.MvcSheetUI.Run.call($(this), controlName, DataItems[datafield] || {});
        $(this).each(function () {
            if (manager != null) {
                return;
            }
            switch (this.tagName.toLowerCase()) {
                case "label":
                case "span":
                    manager = $(this).SheetLabel(dataitem);
                    break;
                case "input":
                    switch (this.type) {
                        case "text":
                            if (dataitem.L == $.MvcSheetUI.LogicType.DateTime) {
                                manager = $(this).SheetTime(dataitem);
                            } else if (dataitem.L == $.MvcSheetUI.LogicType.SheetAssociation) {
                                manager = $(this).SheetAssociation(dataitem);
                            } else {
                                manager = $(this).SheetTextBox(dataitem);
                            }
                            break;
                        case "checkbox":
                            $(this).SheetCheckbox(dataitem);
                            break;
                        case "radio":
                            manager = $(this).SheetRadioButtonList(dataitem);
                            break;
                        default:
                            break;
                    }
                case "textarea":
                    manager = $(this).SheetRichTextBox(dataitem);
                    break;
                case "div":
                    var controlType = $(this).data("type");
                    if (controlType) {
                        if (controlType.toLowerCase() == "sheetoffice" && !(!!window.ActiveXObject || "ActiveXObject" in window)) {
                            controlType = "SheetAttachment";
                        }
                        manager = $.MvcSheetUI.Run.call($(this), controlType, [dataitem]);
                        //if (controlType.toLowerCase() == "sheetcheckboxlist")
                        //    manager = $(this).SheetCheckboxList(dataitem);
                        //else if (controlType.toLowerCase() == "sheetradiobuttonlist")
                        //    manager = $(this).SheetRadioButtonList(dataitem);
                        //else if (controlType.toLowerCase() == "sheetuser") {
                        //    manager = $(this).SheetUser(dataitem);
                        //}
                        //else if (controlType.toLowerCase() == "sheetattachment") {
                        //    manager = $(this).SheetAttachment(dataitem);
                        //}
                        //else if (controlType.toLowerCase() == "sheetcomment") {
                        //    manager = $(this).SheetComment(dataitem);
                        //}
                    } else if (dataitem) {
                        if (dataitem.L == $.MvcSheetUI.LogicType.SingleParticipant ||
                            dataitem.L == $.MvcSheetUI.LogicType.MultiParticipant) {
                            //参与者
                            manager = $(this).SheetUser(dataitem);
                        } else if (dataitem.L == $.MvcSheetUI.LogicType.Attachment) {
                            manager = $(this).SheetAttachment(dataitem);
                        } else if (dataitem.L == $.MvcSheetUI.LogicType.Comment) {
                            manager = $(this).SheetComment(dataitem);
                        } else if (dataitem.L == $.MvcSheetUI.LogicType.TimeSpan) {
                            manager = $(this).SheetTimeSpan(dataitem);
                        }
                    }
                    break;
                case "table":
                    if (dataitem.L == $.MvcSheetUI.LogicType.BizObjectArray || dataitem.L == $.MvcSheetUI.LogicType.BizObject) {
                        manager = $(this).SheetGridView(dataitem);
                    }
                    break;
                case "select":
                    if ($(this).data("type") == "SheetInstancePrioritySelector") {
                        manager = $(this).SheetInstancePrioritySelector(dataitem);
                    } else if ($(this).data("type") == "SheetOriginatorUnit") {
                        manager = $(this).SheetOriginatorUnit(dataitem);
                    } else {
                        manager = $(this).SheetDropDownList(dataitem);
                    }
                    break;
                case "a":
                    manager = $(this).SheetHyperLink(dataitem);
                    break;
                    //default:
                    //    manager = $(this).SheetTextBox(dataitem);
            }

        });
        return manager;
    },

    //核心属性
        $.MvcSheetUI = {
            //版本信息
            Version: "V1.0",
            //已经渲染过后的标示前缀
            SheetIDKey: "sheetid",
            //页面参数属性、事件的属性
            PreDataKey: "data-",
            //数据项属性
            DataFieldKey: "DataField",
            //数据项属性
            ComputationRule: "ComputationRule",
            //控件名称
            SheetControlKey: "SheetControl",
            Type: "Type",
            PortalRoot: typeof (_PORTALROOT_GLOBAL) == "undefined" ? window.localStorage.getItem("H3.PortalRoot") : _PORTALROOT_GLOBAL, // 这是一个全局变量，获取Portal的根目录路径
            // Mvc后台传递给表单的信息
            SheetInfo: null,
            // 这个对象是之前版本的JS，待合并之前的MvcRuntime后可以去除
            MvcRuntime: null,
            //优先级
            Priority: "Unspecified",
            ParentUnitID: "", //存储发起部门
            //HiddenFields
            HiddenFields: {},
            // 是否正在加载中
            Loading: false,
            //控件池
            Controls: {},
            //数量
            ManagerCount: 0,
            //管理器
            ControlManagers: {},
            IonicFramework: {},
            // Css 定义
            Css: {
                inputMouseOut: "inputMouseOut", // 鼠标离开时样式
                inputMouseMove: "inputMouseMove", // 鼠标移动到上面时样式
                inputMouseEnter: "", //inputMouseEnter 鼠标进入控件时样式
                inputError: "inputError", // 输入错误时显示样式
                InvalidText: "InvalidText", // 错误字体时样式
                Readonly: "Readonly" // 只读样式
            },
            ValidateText: "表单验证不通过!",
            //$.fn.Sheet{control}
            //会调用这个方法,并传入作用域(this)
            //control [control]  空间名
            //parm [args] 参数(数组)
            Run: function (control, args) {
                //属性
                var p = $.ControlsOptions.GetDefaultOptions(control);
                if (args.length > 0) {
                    $.extend(p, { DataItem: args[0] });
                    $.extend(p, args[0]);
                }
                var currentSheetIDKey = 0;
                var isOneControl = 0;
                //循环页面上的控件
                this.each(function () {
                    if (!$(this).data($.MvcSheetUI.SheetIDKey)) {
                        isOneControl++;
                        $.MvcSheetUI.ManagerCount++;
                        currentSheetIDKey = $.MvcSheetUI.SheetIDKey + "-" + $.MvcSheetUI.ManagerCount.toString();
                        p[$.MvcSheetUI.DataFieldKey] = $(this).data($.MvcSheetUI.DataFieldKey.toLowerCase());
                        p[$.MvcSheetUI.Type] = control;
                        $(this).data($.MvcSheetUI.SheetIDKey, currentSheetIDKey);
                        $.MvcSheetUI.ControlManagers[$(this).data($.MvcSheetUI.SheetIDKey)] = new $.MvcSheetUI.Controls[control](this, p, $.MvcSheetUI.SheetInfo);
                    } else {
                        isOneControl = 1;
                        return;
                    }
                });
                //如果是一个的话，返回当前控件管理器
                if (isOneControl == 1) {
                    return $.MvcSheetUI.ControlManagers[$(this).data($.MvcSheetUI.SheetIDKey)];
                }
            },
            //读取表单数据
            GetSheetDataItem: function (datafield, rowNum) {
                var DataItems = $.MvcSheetUI.SheetInfo.BizObject.DataItems;
                if (datafield == undefined) return null;
                var dataitem = null;
                //处理子表
                if (datafield.indexOf(".") > -1 && DataItems[datafield.split(".")[0]] && DataItems[datafield.split(".")[0]].L == $.MvcSheetUI.LogicType.BizObject) {
                    if (DataItems[datafield.split(".")[0]].V.DataItems) {
                        dataitem = DataItems[datafield.split(".")[0]].V.DataItems[datafield];
                        $.extend(dataitem, { BizObjectID: DataItems[datafield.split(".")[0]].V.DataItems[datafield.split(".")[0] + ".ObjectID"].V })
                        $.extend(dataitem, { RowNum: 1 })
                        return DataItems[datafield.split(".")[0]].V.DataItems[datafield];
                    }
                } else if (rowNum != undefined && rowNum > 0 &&
                    datafield.indexOf(".") > -1) {
                    rowNum = rowNum - 1;
                    var parentdatafield = datafield.split(".")[0];
                    var DetailVale = DataItems[parentdatafield].V;
                    if (DetailVale.R && DetailVale.R.length > rowNum) {
                        //改行有数据，默认加载数据
                        dataitem = DetailVale.R[rowNum].DataItems[datafield];
                        $.extend(dataitem, { BizObjectID: DetailVale.R[rowNum].DataItems[parentdatafield + ".ObjectID"].V })
                    } else { //该行无数据，默认数据渲染
                        var DefaultRow = DetailVale.T;
                        if (!DefaultRow) {
                            DefaultRow = this.GetElement(parentdatafield).SheetUIManager().DefaultRow;
                        }
                        if (DefaultRow)
                            dataitem = DefaultRow.DataItems[datafield];
                    }
                    $.extend(dataitem, { RowNum: rowNum + 1 })
                } else {
                    dataitem = DataItems[datafield];
                    $.extend(dataitem, { RowNum: 0 })
                }
                if (datafield == "OriginateTime") {
                    dataitem.V = (new Date(dataitem.V.replace(/-/g, '/'))).format("yyyy-MM-dd hh:mm");
                }
                return dataitem;
            },
            //保存事件，获取所有控件的保存后返回的值
            SaveSheetData: function (actionName) {
                var SheetData = {};
                for (var control in this.ControlManagers) {
                    var controlManager = this.ControlManagers[control];
                    //字表中的control不调用SaveDataField，由子表自己调用SaveDataField保存值
                    if (controlManager.Type && controlManager.Type == "SheetHiddenField") {
                        $.extend(SheetData, controlManager.SaveDataField(actionName));
                    } else {
                        if (!$.isFunction(controlManager.SaveDataField) ||
                            controlManager.DataField == undefined ||
                            (controlManager.DataField.indexOf(".") != -1 && controlManager.DataField != "Originator.OUName")) { continue; }
                        if (controlManager.Type && controlManager.Type == "SheetComment") {
                            $.extend(SheetData, controlManager.SaveDataField(actionName, SheetData));
                        } else {
                            $.extend(SheetData, controlManager.SaveDataField(actionName));
                        }

                    }
                }
                return SheetData;
            },
            //获取控件Dom元素(JQuery对象)，参数可以是数据项名称，也可以是#id
            GetElement: function (datafiled, rownum) {
                var element;
                var row = rownum == undefined ? 0 : rownum;
                if (datafiled.indexOf("#") == 0) {
                    element = $(datafiled);
                } else {
                    if (datafiled.indexOf('.') > -1) {
                        //子表
                        if (rownum == undefined) {
                            row = 1; //默认第一行
                        }

                        //element = $("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "'][data-row=" + row + "]");
                        element = $("tr[data-row='" + row + "']").find("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "']");
                        if ($.MvcSheetUI.QueryString("ismobile") == "true" || element.length == 0) {
                            element = $("div[data-row='" + row + "']").find("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "']");
                        }
                    }
                    else {
                        $("[" + this.PreDataKey + this.DataFieldKey.toLowerCase() + "='" + datafiled + "']").each(function () {
                            var flag = true;
                            if (this.tagName.toLowerCase() == "td") {
                                flag = false;
                            }
                            else if (this.tagName.toLowerCase() == "div") {
                                if ($("table[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() + "='" + datafiled + "']").length > 0) {
                                    flag = false;
                                }
                            }
                            if (flag) {
                                if ((this.tagName.toLowerCase() == "label" || this.tagName.toLowerCase() == "span") &&
                                    $(this).attr("BindType") == "All") {
                                    element = $(this);
                                }
                                else {
                                    element = $(this);
                                }
                            }
                        });
                    }
                }
                return element;
            },
            //读取数据，参数可以是数据项名称，也可以是#id
            GetControlValue: function (datafiled, rownum) {
                var control = this.GetElement(datafiled, rownum);
                if (control) {
                    var manager = $(control).SheetUIManager();
                    if (manager) {
                        return manager.GetValue();
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            },
            // 设置数据项前端控件的值
            // 参数1：数据项名称，参数2：数据项的值，参数3：行号(对子表有效)
            SetControlValue: function (datafiled, val, rownum) {
                var control = this.GetElement(datafiled, rownum);
                if (control) {
                    var manager = $(control).SheetUIManager();
                    if (manager) {
                        //选人控件数值单独处理
                        if (manager.LogicType == 26) {
                            if (val && val[0].indexOf("</a>") > -1) {
                                var aTag = $(val[0]);
                                var userObjectID = aTag.attr("href").substr(aTag.attr("href").length - 36);
                                val = { Code: userObjectID, Name: aTag.text() };
                            }
                        }
                        manager.SetValue(val);

                    }
                }
            },
            // 函数：控件校验
            // 参数1：effective是否做有效校验，在Save时，只做数据有效校验，不做必填校验
            Validate: function (actionControl, effective) {
                var flag = true;
                if (!effective) effective = false;
                if (actionControl.IsReject) { // 驳回只做有效性校验
                    effective = true;
                }
                var validErrorTotal = 0;//用来计算所有类型的不合法（包括未填写或填写错误）
                var validInputErrorTotal = 0;//用来计算所有类型的填写错误
                var unfilledTotal = 0;//所有未填写总数
                for (var control in this.ControlManagers) {
                    var controlManager = this.ControlManagers[control];
                    if (!$.isFunction(controlManager.Validate)) continue;
                    if (controlManager instanceof $.MvcSheetUI.Controls.SheetComment &&
                        actionControl.IsReject) {
                        if (!controlManager.Validate(false) && flag) {
                            if (!$.MvcSheetUI.SheetInfo.IsMobile) {
                                controlManager.SetFocus();
                            }
                            flag = false;
                        }
                    } else if (!controlManager.Validate(effective) && flag) {
                        if (!$.MvcSheetUI.SheetInfo.IsMobile) {
                            controlManager.SetFocus();
                        }
                        flag = false;
                    }
                    if (typeof (controlManager.Element.InputValidateState) != "undefined" && !controlManager.Element.InputValidateState) {
                        validInputErrorTotal++
                    }
                    if (typeof (controlManager.Element.ValidateState) != "undefined" && !controlManager.Element.ValidateState) {
                        validErrorTotal++
                    }
                }
                if (!flag) {
                    //console.log("当前错误项有。。。" + validErrorTotal)
                    //console.log("当前输入错误的有。。。" + validInputErrorTotal)
                    clearTimeout(validTimer);
                    $("#validTotal").remove();
                    if (!$.MvcSheetUI.SheetInfo.IsMobile) {//pc计算
                        $(".inputError").eq(0).focus();
                        var unfilledTotal = validErrorTotal - validInputErrorTotal;
                    } else {
                        //移动端校验表单提示
                        $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.scrollTop();
                        var unfilledTotal = validErrorTotal - validInputErrorTotal;
                        //子表折叠模式时，展开对应的操作
                        if ($(".inputError").eq(0).data("datafield") && $(".inputError").eq(0).data("datafield").indexOf(".") > -1) {
                            var parent = $(".inputError").eq(0).closest(".SheetGridView");
                            var index = $(".inputError").eq(0).attr("data-row");
                            parent.find(".tab-mode").find(".scroll button").eq(index).trigger("click");//
                        }
                        var scrollTop = $(".inputError").closest(".list")[0].offsetTop; //第一个错误项离浏览器顶端距离
                        var scrollCur = $(".inputError").closest(".list")[0].offsetParent; //第一个错误的定位父级元素
                        while (scrollCur != null) {
                            scrollTop += scrollCur.offsetTop;
                            scrollCur = scrollCur.offsetParent;
                        };
                    }
                    if (actionControl.IsReject) {
                        $.ValidationTips.Show(unfilledTotal, validInputErrorTotal, false);//驳回只对审批意见做必填校验提示
                    } else {
                        $.ValidationTips.Show(unfilledTotal, validInputErrorTotal, effective);
                    }
                    var validTimer = setTimeout(function () {
                        $.ValidationTips.Hide();
                        if ($.MvcSheetUI.SheetInfo.IsMobile) {
                            $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.scrollTo(0, scrollTop - 80);
                        }
                    }, 3000);
                }
                return flag;
            },
        };

    //控件属性
    $.ControlsOptions = {
        GetDefaultOptions: function (control) {
            var p = {};
            var options = SheetControls[control] || this[control];
            for (var key in options) {
                if (options[key].constructor == String ||
                    options[key].constructor == Number ||
                    options[key].constructor == Object) {
                    p[key] = options[key] || "";
                } else if (options[key].constructor == Array) {
                    for (var i = 0; i < options[key].length; ++i) {
                        p[options[key][i].Name] = options[key][i].DefaultValue || "";
                    }
                }
            }
            return p;
        }
    };

    // 控件的逻辑类型
    $.MvcSheetUI.SheetMode = {
        Unspecified: -1,
        Work: 1,
        View: 2,
        Originate: 3,
        Print: 4
    },

    // 控件的逻辑类型
        $.MvcSheetUI.LogicType = {
            /// 空值
            Unspecified: -1,
            /// 逻辑数组型
            BoolArray: 0,
            /// 逻辑型
            Bool: 1,
            /// 时间数组型
            DateTimeArray: 4,
            /// 日期型
            DateTime: 5,
            /// 双精度数组型
            DoubleArray: 6,
            /// 双精度数值型
            Double: 7,
            /// 整数数组型
            IntArray: 8,
            /// 整数
            Int: 9,
            /// 长整型数组型
            LongArray: 10,
            /// 长整数
            Long: 11,
            /// 字符串数组型
            StringArray: 12,
            /// 长文本
            String: 13,
            /// 短文本
            ShortString: 14,
            /// 签名
            // Sign : 15,
            /// 链接
            HyperLink: 16,
            /// 审批
            Comment: 17,
            /// 二进制流
            ByteArray: 20,
            /// 未指定类型的附件
            Attachment: 24,
            /// 时间段型
            TimeSpan: 25,
            /// 参与者（单人）
            SingleParticipant: 26,
            /// 参与者（多人）
            MultiParticipant: 27,
            /// Html
            Html: 30,
            /// 对象类型
            Object: 31,
            /// Xml
            Xml: 32,
            /// Guid  
            Guid: 33,
            /// Guid数组
            GuidArray: 34,
            /// Decimal
            Decimal: 35,
            /// Decimal数组
            DecimalArray: 36,
            /// 业务对象
            BizObject: 40,
            /// 业务对象数组
            BizObjectArray: 41,
            /// 业务结构
            BizStructure: 42,
            /// 业务结构数组
            BizStructureArray: 43,
            //关联表单
            SheetAssociation: 45
        },

    //用户类型
        $.MvcSheetUI.UnitType = {
            /// 未指定
            Unspecified: 0x01 | 0x10 | 0x02 | 0x04 | 0x08 | 0x20 | 0x40,
            /// 公司
            Company: 0x01,
            /// 组织单元
            OrganizationUnit: 0x02,
            /// 组
            Group: 0x04,
            /// 用户
            User: 0x08,
            /// 类别组
            Segment: 0x10,
            /// 岗位
            Post: 0x20,
            /// 编制
            Staff: 0x40
        };

    //读取url的参数值
    $.MvcSheetUI.QueryString = function (name) {
        var reg = new RegExp("(^|&)" + name.toLowerCase() + "=([^&]*)(&|$)", "i");
        var r = decodeURI(window.location.search.toLowerCase().substr(1)).match(reg);
        if (r != null) return decodeURI(r[2]); //   decodeURIComponent(encodeURIComponent (unescape(r[2])));
        return null;
    };

    //创建Guid
    $.MvcSheetUI.NewGuid = function () {
        var getStr = function (len) {
            if (len > 12) len = 12;
            return Math.floor(Math.random() * 100000000000000).toString("16").substring(0, len);
        };
        return (getStr(8) + "-" + getStr(4) + "-4" + getStr(3) + "-" + getStr(4) + "-" + getStr(12)).trim();
    };

    //使用bootstrap的模态框
    //@title:标题
    //@target:内容，可以是<div></div>
    //@actions:工具栏，可不传；[{Text:"test",DoAction:function,其他想要的参数},{Text:"test",DoAction:function,其他想要的参数}]
    $.SheetModal = function (title, target, actions) {
        this.IsShow = false;
        this.ShowModal(title, target, actions);
    };
    $.SheetModal.prototype = {

        ShowModal: function (title, target, actions) {
            this.ID = $.MvcSheetUI.NewGuid();
            this.Modal = $('<div class="modal fade" id="' + this.ID + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"></div>');
            var modalDialog = $('<div class="modal-dialog"></div>');
            var modalContent = $('<div class="modal-content"></div>');
            var modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');

            //以下三个主要才是需要填充的
            this.ModalTitle = $('<h4 class="modal-title" id="myModalLabel"></h4>');
            this.ModalBody = $('<div class="modal-body"></div>');
            this.ModalFooter = $('<div class="modal-footer"></div>');

            this.Modal.append(modalDialog);
            modalDialog.append(modalContent);
            modalContent.append(modalHeader);
            modalHeader.append(this.ModalTitle);
            modalContent.append(this.ModalBody);
            modalContent.append(this.ModalFooter);

            this.SetTile(title);
            this.SetBody(target);
            //操作
            if (actions) {
                for (var i = 0; i < actions.length; i++) {
                    var btnJson = actions[i];
                    this.AddAction(btnJson);
                }
            }
            //显示
            this.Show();

            //绑定关闭事件
            this.Modal.on("hidden.bs.modal", this, function (e) {
                e.data.IsShow = false;
            });

            return this;
        },
        SetTile: function (title) {
            this.ModalTitle.html(title);
        },
        SetBody: function (target) {
            this.ModalBody.append($(target));
        },
        AddAction: function (actionObject) {
            $.extend(actionObject, { ModalManager: this })
            var btn = $('<button type="button" class="btn">' + actionObject.Text + '</button>');
            // 绑定修改事件
            if (actionObject.DoAction) {
                btn.unbind("click").bind("click", actionObject, function (e) {
                    e.data.DoAction.apply(e.data);
                });
            }
            this.ModalFooter.append(btn);
        },
        Show: function () {
            if (this.IsShow) return;
            this.IsShow = true;
            this.Modal.modal("show");

        },
        Hide: function () {
            if (!this.IsShow) return;
            this.IsShow = false;
            this.Modal.modal("hide");
        }
    };

    //添加Jquery 的公共接口
    $.extend({
        //提交验证提示
        ValidationTips: {
            Show: function (validTotal, validError, effective) {
                var ValidateTipsNum = "";
                this.TipsDiv = $("<div></div>").attr("id", "validTotal");
                this.TipsDiv.append($("<img src='" + $.MvcSheetUI.PortalRoot + "/Mobile/img/details/unchoose2.svg' />"));
                var bodyFont = $("<font></font>")
                var removeSpan = $("<span>&times<span>").css("margin-left", "15px");
                this.TipsDiv.append(bodyFont).append(removeSpan);
                removeSpan.on("click", function () {
                    $(this).parent().remove();
                    if ($.MvcSheetUI.SheetInfo.IsMobile) {
                        $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.scrollTo(0, scrollTop - 80);
                    }
                })
                if (effective) {//保存提示填写错误个数即可
                    ValidateTipsNum = $.TranslationFormat(SheetLanguages.Current.ErrorInput, validError);
                } else {//提交提示填写详情
                    if (validTotal == 0 && validError > 0) {
                        ValidateTipsNum = $.TranslationFormat(SheetLanguages.Current.ErrorInput, validError);
                    } else if (validTotal > 0 && validError == 0) {
                        ValidateTipsNum = $.TranslationFormat(SheetLanguages.Current.MistakeInput, validTotal);
                    } else {
                        ValidateTipsNum = $.TranslationFormat(SheetLanguages.Current.ValidInput, validTotal, validError);
                        this.TipsDiv.css("margin-left", "-177px");
                    }
                }
                this.TipsDiv.children("font").html(ValidateTipsNum);
                this.TipsDiv.appendTo($("body"));
            },
            Hide: function () {
                this.TipsDiv.remove();
            },
        },
        //加载提示
        LoadingMask: {
            Show: function (msg, isAlpha) {
                if ($.MvcSheetUI.QueryString("ismobile")
                    && $.MvcSheetUI.QueryString("ismobile").toLowerCase() == "true") {
                    $.MvcSheetUI.IonicFramework.fcommonJS.loadingShow("");
                } else {
                    if ($.SheetMask.IsShow) return;
                    $.SheetMask.Show(isAlpha);
                    //添加消息
                    this.MsgDiv = $("<div></div>");
                    this.MsgDiv.append($("<img src='" + $.MvcSheetUI.PortalRoot + "/WFRes/_Content/themes/ligerUI/Aqua/images/common/bigloading.gif' />"));
                    this.MsgDiv.append($("<span style=\"font-size: 18px;font-weight: bold;padding-left: 10px;\">" + msg + "</span>"));
                    this.MsgDiv.css("position", "fixed");
                    this.MsgDiv.css("top", "42%");
                    this.MsgDiv.css("left", "43%");
                    this.MsgDiv.css("z-index", "9999");
                    this.MsgDiv.appendTo($("body"));
                }
            },
            Hide: function () {
                if ($.MvcSheetUI.QueryString("ismobile")
                    && $.MvcSheetUI.QueryString("ismobile").toLowerCase() == "true") {
                    $.MvcSheetUI.IonicFramework.fcommonJS.loadingHide();
                } else {
                    if ($.SheetMask.IsShow) {
                        $.SheetMask.Hide();
                        this.MsgDiv.remove();
                    }
                }
            }
        },
        //遮盖
        SheetMask: {
            IsShow: false,
            Show: function (isAlpha) {
                var opacity = 0.6;
                if (isAlpha != undefined && isAlpha == false) {
                    opacity = 1;
                }
                if (this.IsShow) return;
                this.IsShow = true;
                this.ID = $.MvcSheetUI.NewGuid();
                this.Mask = $("<div></div>").attr("id", "SheetMask_" + this.ID);
                this.Mask.appendTo($("body"));

                //添加样式
                this.Mask.css("position", "absolute");
                this.Mask.css("top", "0px");
                this.Mask.css("left", "0px");
                this.Mask.css("width", "100%");
                this.Mask.css("height", $("body").height() + 60);
                this.Mask.css("text-align", "center");
                this.Mask.css("z-index", "9999");
                this.Mask.css("background-color", "#ffffff");
                this.Mask.css("filter", "Alpha (opacity=1)");
                this.Mask.css("opacity", opacity);
                $("body").css("overflow", "hidden");
            },
            Hide: function () {
                if (this.IsShow) {
                    this.IsShow = false;
                    this.Mask.remove();
                    $("body").css("overflow", "");
                }
            }
        }
    });

    //控件基类
    //1,完成界面初始化:设置组件id并存入组件管理器池,初始化参数
    //2,渲染的工作,细节交给子类实现
    //parm [element] 组件对应的dom element对象
    //parm [options] 组件的参数
    $.MvcSheetUI.IControl = function (element, options, sheetInfo) {
        //是否支持Html5
        this.IsHtml5 = typeof (Worker) !== "undefined";
        this.SchemaCode = sheetInfo ? sheetInfo.SchemaCode : "";
        this.PortalRoot = $.MvcSheetUI.PortalRoot; // 这是一个全局变量，获取Portal的根目录路径
        //页面元素，可以通过$(this.Element)得到jquery对象
        this.Element = element;
        //是否移动端
        if ((sheetInfo && sheetInfo.IsMobile) || ($.MvcSheetUI.QueryString("ismobile") == "true")) {
            this.IsMobile = true;
        }
        //是否发起模式
        var mode = $.MvcSheetUI.QueryString("Mode");
        this.Originate = mode && mode.toLowerCase() == "originate";
        this.Originate = options.Originate || this.Originate;

        this.Css = {
            inputMouseOut: $.MvcSheetUI.Css.inputMouseOut,
            inputMouseMove: $.MvcSheetUI.Css.inputMouseMove,
            inputMouseEnter: $.MvcSheetUI.Css.inputMouseEnter,
            inputError: $.MvcSheetUI.Css.inputError,
            InvalidText: $.MvcSheetUI.Css.InvalidText
        };
        // 记录当前控件是否验证通过
        this.ValidateResult = true;
        //配置参数,包含属性和事件
        this.Options = options || {};
        // 表单信息
        this.SheetInfo = sheetInfo;
        //是否显示在新容器中显示编辑，只对移动端有效
        this.ViewInNewContainer = true;
        //初始化参数
        this.Init();

        // 逻辑类型
        this.LogicType = this.L || $.MvcSheetUI.LogicType.ShortString;
        // 是否可见
        this.Visiable = this.IsMobile ? (this.O && this.O.indexOf("M") != -1) : (this.O && this.O.indexOf("V") != -1);
        this.Visiable = this.Options.Visiable || this.Visiable;
        // 是否可编辑
        this.Editable = this.O && this.O.indexOf("E") != -1;
        this.Editable = this.Options.Editable || this.Editable;
        if (mode && mode.toLowerCase() == "print") {
            this.Editable = false;
        }

        //移动端的容器
        this.MobileContainer = null;
        this.FormatAction = "GetFormatValue";
        // 是否必填
        this.Required = this.O && this.O.indexOf("R") != -1;
        // 是否可查看痕迹
        this.TrackVisiable = this.O && this.O.indexOf("T") != -1;

        //在div上设置控件标题,他被用于css:  :before{content:attr(data-title)};
        $(this.Element).parent().attr("data-title", ($(this.Element).parent().prev().text() || "").trim());

        // 初始化之前函数
        this.PreRender();

        if (this.IsMobile) {
            //创建一个span用于展现
            this.Mask = $("<span class='input-label'></span>");

            if (!this.Visiable) {
                $(this.Element).parent().hide();
                $(this.Element).parent().prev().hide();
            }

            //修改样式到Mobile
            var itemClass = " item-input";
            var controlType = $(this.Element).data("type");
            if (controlType == "SheetTextBox") {
                $(this.Element).attr("autocomplete", "off");
            } else if (controlType == "SheetDropDownList") {
                itemClass = "item-input"; // item-select
                if (!this.Editable) { itemClass = " item-input " }
            } else if (controlType == "SheetCheckbox") {
                itemClass = "item-input item-toggle"; //逻辑型需要做处理
            }
            if ($(this.Element).parent().length != 0 && ($(this.Element).parent().attr("class").indexOf("col-md-4") > -1 || $(this.Element).parent().attr("class").indexOf("col-md-10") > -1)) {
                //保留除 col-md-4/col-md-10 以外的class
                var eleClass = $(this.Element).parent().attr("class");
                var addClass = "";
                if (eleClass.indexOf("col-md-4") > -1) {
                    for (var i = 0; i < eleClass.split("col-md-4").length; i++) {
                        var c = eleClass.split("col-md-4")[i];
                        if (c != "" && c.trim() != "col-md-10") {
                            addClass = addClass + " " + c;
                        }
                    }
                } else if (eleClass.indexOf("col-md-10") > -1) {
                    for (var i = 0; i < eleClass.split("col-md-10").length; i++) {
                        var c = eleClass.split("col-md-10")[i];
                        if (c != "" && c.trim() != "col-md-4") {
                            addClass = addClass + " " + c;
                        }
                    }
                }
                var div = $("<div class='detail " + addClass + "'></div>")
                if (controlType == "SheetCheckbox") {
                    div = $("<label class='toggle toggle-positive'></label>");
                }


                var parent = $(this.Element).parent();
                div.append(parent.children());

                //
                if (controlType == "SheetCheckbox") {
                    div.append("<div class=\"track\"><div class=\"handle\"></div></div>")
                }
                parent.empty().append(div);
                //
                parent.attr("class", "").addClass("item " + itemClass);

                var dom = $("<span class='input-label'>" + parent.data("title") + "</span>");
                if (parent.prev().attr("class")) {
                    if (parent.prev().attr("class").indexOf("col-md-2") > -1) {
                        if (parent.prev().find("span").length > 0) {
                            dom = parent.prev().find("span").addClass("input-label");
                        }
                        parent.prev().remove();
                    }
                }
                else if (parent.parent().prev().children().attr("class")) {
                    var children=parent.parent().prev().children();
                    if (children.attr("class").indexOf("col-md-2") > -1) {
                        dom.text(children.text());
                    }
                }
                
                div.before(dom);

            }

            if (this.RenderMobile) {
                this.RenderMobile();
            }
        } else {
            this.Render();
        }

        // 加载完成后事件
        this.Rendered();

        if (this.IsMobile) {
            if (!($(this.Element).is("label,span") && ($(this.Element).attr("bindtype") || "").toLowerCase() != "all") &&
                this.Editable) {
                if (this.Validate(true, true)) {
                    $(this.Element).trigger("MobileValidateSucceed");
                } else {
                    $(this.Element).trigger("MobileValidateFaild");
                }
            }
        }
        else if (this.Editable) {
            // 做初始化校验
            this.Validate(true, true);
        }
    };
    //基础属性
    $.MvcSheetUI.IControl.prototype = {
        // 从页面读取参数,将页面上 data-***的设置读取到Options里面
        //初始化参数，转为容易用的方式this.***
        //循环所有默认属性事件,构造成 this.***的格式
        //如:AutoTrim，在页面是 data-autotrim，这里可以通过this.AutoTrim读取，也可以通过 this.Properties["AutoTrim"]读取
        Init: function () {
            var g = this,
                p = this.Options;
            for (var key in p) {
                var elementkey = key.toLowerCase();

                if ($(g.Element).data(elementkey) != undefined) {
                    if (p[key].constructor == Boolean) {
                        p[key] = $(g.Element).data(elementkey).constructor == Boolean ?
                            $(g.Element).data(elementkey) :
                            ($(g.Element).data(elementkey).toString().toLowerCase() == "true" ||
                                $(g.Element).data(elementkey).toString().toLowerCase() == "1");
                    } else if (p[key].constructor == Number) {
                        p[key] = parseFloat($(g.Element).data(elementkey));
                    } else {
                        p[key] = $(g.Element).data(elementkey).toString();
                    }
                }
            }

            var p = this.Options;
            for (var key in p) {
                this[key] = p[key];
            }
            if ($.MvcSheet) $.MvcSheet.ControlInit.apply(this, [this.DataItem, this.SheetInfo]);
        },
        // 增加验证消息显示
        AddInvalidText: function (element, invalidText, cssChange) {
            var id = element.id || "";
            if (cssChange == null || cssChange) {
                //PC必填需要边框
                if ($(element).hasClass("select2-container") && $(element).attr("data-type") == "SheetUser") {
                    $(element).children("ul").addClass(this.Css.inputError);
                } else if ($(element).attr("data-type") == "SheetRadioButtonList" || $(element).attr("data-type") == "SheetCheckboxList") {
                    $(element).addClass(this.Css.inputError);
                } else if ($(element).siblings("div").hasClass("ke-container-default")) {
                    $(element).siblings(".ke-container-default").addClass(this.Css.inputError);
                } else {
                    $(element).addClass(this.Css.inputError);
                }
                element.ValidateState = false;//验证不通过
            };

            if ($.MvcSheetUI.SheetInfo.IsMobile == false) {
                if (!$(element).next().hasClass(this.Css.InvalidText)) {
                    $("<label class=\"" + this.Css.InvalidText + "\">" + invalidText + "</label>").insertAfter($(element));
                }
            } else {
                //移动端comment
                $(".inputError").closest(".list").addClass("bgColor");
                if (element.dataset && element.dataset['type'] == 'SheetComment') {
                    if ($(element).prev().find('.' + this.Css.InvalidText).length == 0) {
                        var InvalidTextLabel = $("<label class=\"" + this.Css.InvalidText + "\">" + invalidText + "</label>");
                        InvalidTextLabel.appendTo($(element).prev());
                    }
                    return;
                }
                //移动端其他
                if ($(element).closest('.item.item-input').find(".input-label").find('.' + this.Css.InvalidText).length == 0) {
                    var input_label = $(element).closest('.item.item-input').find(".input-label")[0];
                    var input_label_text = $(input_label).text();
                    $(input_label).empty();
                    $("<span>" + input_label_text + "</span>").appendTo($(input_label));
                    var InvalidTextLabel = $("<label class=\"" + this.Css.InvalidText + "\">" + invalidText + "</label>");
                    if (invalidText !== "*") {
                        InvalidTextLabel.addClass('plentyWords');
                    }
                    InvalidTextLabel.appendTo($(element).closest('.item.item-input').find(".input-label")[0]);
                }
            }
        },
        // 移除验证显示信息
        RemoveInvalidText: function (element) {
            $(element).removeClass(this.Css.inputError);
            $(element).children("ul.inputError").removeClass(this.Css.inputError);
            element.ValidateState = true;//验证通过
            $(element).siblings(".ke-container-default.inputError").removeClass(this.Css.inputError);
            if ($(element).attr("data-type") == "SheetRadioButtonList" || $(element).attr("data-type") == "SheetCheckboxList") {
                $(element).removeClass(this.Css.inputError);
            }
            if ($.MvcSheetUI.SheetInfo.IsMobile == false) {
                if ($(element).next().hasClass(this.Css.InvalidText)) $(element).next().remove();
            } else {
                //移动端comment
                $(element).closest(".list").removeClass("bgColor");
                if (element.dataset && element.dataset['type'] == 'SheetComment') {
                    $(element).prev().find("." + this.Css.InvalidText).remove();
                    return;
                }
                //移动端其他
                $(element).closest('.item.item-input').find("." + this.Css.InvalidText).remove();
            }
        },
        PreRender: function () {
            if ($.MvcSheet) $.MvcSheet.ControlPreRender.apply(this, [this.DataItem, this.SheetInfo]);
        },
        //控件渲染
        Render: function () { },
        // 执行脚本
        RunScript: function (obj, script, args) {
            if (!script) return;
            if ($.isFunction(script)) {
                script.apply(obj, args);
            } else {
                (new Function(script)).apply(obj, args);
            }
        },
        GetRowNumber: function () {
            //this.RowNum>0
            //重新计算RowNum
            if (this.RowNum <= 0) return this.RowNum;
            if (!this.IsMobile) {
                return $(this.Element).closest("tr[class='rows']").attr("data-row");
            } else {
                return $(this.Element).attr("data-row");
            }
        },
        //显示到移动端
        RenderMobile: function () {
            this.Render();
            if (!this.Editable ||
                !this.Visiable ||
                ($(this.Element).is("label,span") && ($(this.Element).attr("bindtype") || "").toLowerCase() != "all")) {
                return;
            }

            //if (false) {
            if (this.ViewInNewContainer) {
                this.MoveToMobileContainer(this.Element);
            } else {
                //SELECT 控件如果显示在当前界面,靠右
                if ($(this.Element).is("select")) {
                    $(this.Element).attr("dir", "rtl");
                }
            }
        },
        //Error:这个逻辑需要改一下
        //移动到移动端Panel

        MoveToMobileContainer: function (_Editor) {
            _Element = _Editor || this.Element;
            var _Mask = this.Mask.text(this.GetText());

            _Mask.insertAfter(_Element);

            if (this instanceof $.MvcSheetUI.Controls.SheetTimeSpan) {
                $(_Element).hide();
            } else {
                //Error:这个逻辑需要改一下
                //$(_Element).before('<div class="bannerTitle"></div>');
            }

            //文本框设置最小高度
            if ($(_Element).is("textarea")) {
                $(_Element).css("min-height", "120px");
            }

            var thatSheetControl = this;
            $(_Element).unbind("change.MobileEditable").bind("change.MobileEditable", function (e) {
                _Mask.text(thatSheetControl.GetText());
            });

            //校验失败
            $(_Element).unbind("MobileValidateFaild").bind("MobileValidateFaild", function (e) {
                $(_Mask).addClass("error");
            });

            //校验成功
            $(_Element).unbind("MobileValidateSucceed").bind("MobileValidateSucceed", function (e) {
                $(_Mask).removeClass("error");
            });

            ////Error:有两个地方绑定这个事件，因为之前的事件，这个按钮不一定有
            //$("#defaultHeader").find(".backButton").unbind("click.EditCompleted").bind("click.EditCompleted",
            //    thatSheetControl, function (e) {
            //        e.data.MobilePreBack.apply(e.data);
            //        if ($.ui.activeDiv.id != _EditPanelID) return;
            //        _Mask.text(thatSheetControl.GetText());

            ////防止多次快速点击
            //var _LastTopTimeStamp = 0;
            //var _thatElement = _Element;
            //var _MobileEdit = function (et) {
            //    if (et.timeStamp - _LastTopTimeStamp < 2000) {
            //        return;
            //    }

            //    _LastTopTimeStamp = et.timeStamp;

            //    var _PrevTitle = $("#header").children("header").find("h1").text().trim();
            //    //
            //    //$.ui.loadContent(_EditPanelID);
            //    //显示返回
            //    //$.ui.setBackButtonVisibility(true);
            //    //Error:有两个地方绑定这个事件，因为之前的事件，这个按钮不一定有
            //    //$("#defaultHeader").find(".backButton").unbind("click.EditCompleted").bind("click.EditCompleted",
            //    //thatSheetControl, function (e) {
            //    //    e.data.MobilePreBack.apply(e.data);
            //    //    if ($.ui.activeDiv.id != _EditPanelID) return;
            //    //    _Mask.text(thatSheetControl.GetText());

            //    //    if (thatSheetControl.Validate()) {
            //    //        $(thatSheetControl.Element).trigger("MobileValidateSucceed");
            //    //    }
            //    //    else {
            //    //        $(thatSheetControl.Element).trigger("MobileValidateFaild");
            //    //    }
            //    //});

            //    //$.ui.setBackButtonText(_PrevTitle);
            //    //$.ui.setBackButtonText("返回");

            //    setTimeout(function () {
            //        //ios7下date类型的SheetTime500ms后自动focus，无法弹出时间控件
            //        if (!($(_thatElement).data("type") == "SheetTime" && $.os.isios7)) {
            //            $(_thatElement).focus();
            //        }
            //        thatSheetControl.AfterMobileEditShow.apply(thatSheetControl);
            //    }, 500);
            //}

            ////在设置了VaildationRule时，移动端给元素绑定一个change事件，用于MobileValidate的显示隐藏
            //if (this.VaildationRule) {
            //    $(_Element).unbind("change.MobileValidate").bind("change.MobileValidate", function () {
            //        if (thatSheetControl.Validate()) {
            //            $(thatSheetControl.Element).trigger("MobileValidateSucceed");
            //        }
            //        else {
            //            $(thatSheetControl.Element).trigger("MobileValidateFaild");
            //        }
            //    });
            //}

            ////Error:我觉得不需要通过change事件来改变Text，直接用this.Mask.Text("")改变就行
            ////在设置了ComputationRule时，移动端给元素绑定一个change事件，用于MaskText的显示改变
            //if (this.ComputationRule) {
            //    $(_Element).unbind("change.MobileMaskText").bind("change.MobileMaskText", function (e) {
            //        _Mask.text(thatSheetControl.GetText());
            //    });
            //}

            ////SheetDropDownList异步构建option，异步回调方法通过change事件改变MaskText
            //if ($(this.Element).data("type") == "SheetDropDownList") {
            //    $(_Element).unbind("change.DropDownList").bind("change.DropDownList", function (e) {
            //        _Mask.text(thatSheetControl.GetText());
            //    });
            //}

            //var viewable = true;
            ////附件、子表只读且只有0项时,不可点击查看.
            //if ((this instanceof $.MvcSheetUI.Controls.SheetAttachment
            //    //|| this instanceof $.MvcSheetUI.Controls.SheetGridView
            //    )
            //    && !this.Editable && this.V && this.V.length == 0) {
            //    viewable = false;
            //    $(_Mask).removeClass("input-mask");
            //}

            //附件处理
            if ((this instanceof $.MvcSheetUI.Controls.SheetAttachment) &&
                !this.Editable && this.V && this.V.length == 0) {
                viewable = false;
                $(_Mask).removeClass("input-mask");
            }



            //if (viewable) {
            //    //点击进入编辑
            //    $(_Parent).unbind("click.MobileEditable").bind("click.MobileEditable", function (et) {
            //        _MobileEdit(et);
            //    }).unbind("click.MobileEditable").bind("click.MobileEditable", function (et) {
            //        _MobileEdit(et);
            //    });
            //    //点击标题进入编辑
            //    $(_Title).unbind("click.MobileEditable").bind("click.MobileEditable", function (et) {
            //        _MobileEdit(et);
            //    }).unbind("click.MobileEditable").bind("click.MobileEditable", function (et) {
            //        _MobileEdit(et);
            //    });
            //}
            //return _EditPanelID;
        },
        // 控件完成事件
        Rendered: function () {
            if ($.MvcSheet) $.MvcSheet.ControlRendered.apply(this, [this.DataItem, this.SheetInfo]);
        },
        //控件的保存函数
        SaveDataField: function () {
            return {};
        },
        //移动容器返回
        MobilePreBack: function () {
            return true;
        },
        //移动容器显示后
        AfterMobileEditShow: function () {

        },
        //获取值
        GetValue: function () {
            var v = null;
            if ($(this.Element).is("label,span")) {
                v = $(this.Element).html();
            } else {
                v = $(this.Element).val();
            }
            if (this.FormatRule) {
                v = v.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (v) {
                    //{0:C2}验证规则下并且会自动加占位符0
                    if (v.indexOf('%') > 1) {
                        v = (v.replace(/%/g, '') * 1) / 100;
                    } else {
                        v = parseFloat(v);//去除占位符
                    }
                } else {
                    v = v.replace(/%/g, "");
                }
            }
            return v;
        },

        //设置值:复杂控件必须重写该接口
        SetValue: function (obj) {
            $(this.Element).val(obj);
            //移动
            if (this.IsMobile) {
                this.Mask.html(this.GetText());
            }
        },

        GetText: function () {
            return $(this.Element).val();
        },

        //设置是否可编辑
        SetReadonly: function (flag) {

        },
        //设置是否可见
        SetVisiable: function (flag) {
            if (flag) {
                $(this.Element).show();
            } else {
                $(this.Element).hide();
            }
        },
        // 控件校验:这里可以把校验错误信息，直接输出到控件后面显示
        // 参数1：effective是否只做数据有效性校验，如果保存，则只做有效校验
        // 参数2：initValid是否页面初始化时校验，只显示*号
        Validate: function (effective, initValid) {
            if (!this.Editable) return true;
            if (initValid) {
                if (this.Required && !this.GetValue()) {
                    this.AddInvalidText(this.Element, "*", false);
                    return false;
                } else {
                    return true;
                }
            }
            if (!effective) { // 数据有效性不做必填验证
                if (this.Required) { //必填的
                    if (!this.GetValue()) {
                        this.AddInvalidText(this.Element, "*");
                        return false;
                    } else {
                        this.RemoveInvalidText(this.Element);
                    }
                }
            }

            return true;
        },
        // 执行函数验证
        DoValidate: function (f, arg, message) {
            if (!f) {
                return true;
            }
            if (!f.apply(this, arg)) {
                this.AddInvalidText(this.Element, message);
                if (arg && arg[0]) {
                    this.Element.InputValidateState = false;//输入验证不通过
                } else {
                    this.Element.InputValidateState = true;
                }
                return false;
            } else {
                this.RemoveInvalidText(this.Element);
                this.Element.InputValidateState = true;//输入验证通过
                return true;
            }
        },
        Valid: {
            // 验证表达式
            RegularExpression: function (val, expression) {
                try {
                    return eval(expression).test(val);
                } catch (e) {
                    //alert("RegularExpression is valid:" + expression);
                    alert(MvcSheetUIGlobalString.RegularExpression_errorMessage + expression);
                    return true;
                }
            },
            // 验证是否为空
            Required: function (val) {
                if (!val) return false;
                return val.trim();
            },
            // 验证整数
            Integer: function (val) {
                return /^(-|\+)?(\d)*$/.test(val);
            },
            //验证整数长度
            IntegerLength: function (val, length) {
                return val.toString().length <= length;
            },
            // 验证数值
            Number: function (val) {
                return /^[\+\-]?\d*?\.?\d*?$/.test(val);
            },
            //验证数值的有效数字是不是15位，因为double类型支持15位有效数字，超出则补0丢失精度
            NumberLength: function (val) {
                if (val.toString().indexOf('.') != -1) {
                    return val.toString().length <= 16;
                } else {
                    return val.toString().length <= 15;
                }
            },
            // 验证时间段
            TimeSpan: function (val) {
                return /^((20|21|22|23|[0-1]\d)\:[0-5][0-9])(\:[0-5][0-9])?$/.test(val);
            }
        },
        // 设置为焦点
        SetFocus: function () {
            $(this.Element).focus();
        },
        //修改痕迹
        RenderDataTrackLink: function () {
            if (this.SheetInfo && this.SheetInfo.IsMobile) return;
            var popupWindowId = (this.Element.id || "") + "_PopWindow";
            var html = "<a class=\"nav-icon fa fa-list-alt\" style=\"padding-left:5px\" data-toggle=\"modal\" data-target='#" + popupWindowId + "'></a>";
            $(html).insertAfter($(this.Element));

            var url = $.MvcSheetUI.PortalRoot + "/InstanceDataTrack.html?";
            url += "InstanceId=" + $.MvcSheetUI.SheetInfo.InstanceId + "&WorkItemId=" + $.MvcSheetUI.SheetInfo.WorkItemId + "&ItemName=" + this.DataField + "&F=frm_" + popupWindowId;
            this.CreatePopupDiv(popupWindowId, "修改痕迹", url, "500px");
        },
        RefreshDataTrackLink: function () {
            var controlId = (this.Element.id || "") + "_PopWindow";
            var frm = document.getElementById("frm_" + controlId);
            if (frm && frm.src) {
                frm.src = frm.src;
            }
        },
        // 开窗
        CreatePopupDiv: function (controlId, displayText, url, height) {
            var popupDiv = "<div id='" + controlId + "' class='modal fade' tabindex='-1' role='dialog' aria-hidden='true'>"
            popupDiv += "<div class='modal-dialog'>";
            popupDiv += "<div class='modal-content'>";
            popupDiv += "<div class='modal-header'>";
            popupDiv += "<button type='button' class='close' data-dismiss='modal'>";
            popupDiv += "<span aria-hidden='true'>&times;</span></button>";
            popupDiv += "<h4 class='modal-title'>" + displayText + "</h4>";
            popupDiv += "</div><div class='modal-body' >";
            popupDiv += "<iframe id=\"frm_" + controlId + "\" src='" + url + "' scrolling='no' frameborder='0' width='100%' height='" + height + "'></iframe>";
            popupDiv += "</div></div></div></div>";
            popupDiv = $(popupDiv);
            // 在Element后添加弹窗元素
            $(this.Element).after(popupDiv);
        },
        toThousands: function (num) {
            if (num) {
                num = num.toString().replace(/,/g, "").replace(/¥/g, "").replace(/$/g, "");
            }
            var num = (num || 0).toString(), result = '';
            var point = "";
            if (num.indexOf(".") > -1) {
                point = num.substring(num.indexOf(".") + 1);
                num = num.substring(0, num.indexOf("."));
            }
            while (num.length > 3) {
                result = ',' + num.slice(-3) + result;
                num = num.slice(0, num.length - 3);
            }
            if (num) { result = num + result; }
            if (point) { result += "." + point; }
            result = result.replace(/,,/g, ",").replace(/-,/g, "-");
            return result;
        },
        paddingRight: function (v, length) {
            if (!v) return v;
            v = v.toString();
            if (v.indexOf(".") == -1) {
                v += ".";
                for (var i = 0; i < length; i++) {
                    v += "0";
                }
            }
            else {
                var pointLength = v.substring(v.indexOf(".") + 1).length;
                if (pointLength < length) {
                    for (var i = v.substring(v.indexOf(".") + 1).length; i < length; i++) {
                        v += "0";
                    }
                }
                else if (pointLength > length) {
                    v = parseFloat(v).toFixed(length);
                }
            }
            return v;
        },
        // 获取格式化字符串的值
        GetFromatValue: function (element, value) {
            if (!this.FormatRule) return "";
            if (value == null) return "";
            if (this.FormatRule == "{0:N2}") {
                v = this.paddingRight(value, 2);
                v = this.toThousands(v);
                if (element.is("label,span")) {
                    element.html(v);
                }
                else if (element.is("input")) {
                    element.val(v);
                }
            }
            else if (this.FormatRule == "{0:N0}") {
                v = this.toThousands(value);
                if (element.is("label,span")) {
                    element.html(v);
                }
                else if (element.is("input")) {
                    element.val(v);
                }
            }
            else if (this.FormatRule == "{0:N4}") {
                v = this.paddingRight(value, 4);
                v = this.toThousands(v);
                if (element.is("label,span")) {
                    element.html(v);
                }
                else if (element.is("input")) {
                    element.val(v);
                }
            }
            else if (this.FormatRule == "{0:C2}") {
                v = this.paddingRight(value, 2);
                v = "¥" + this.toThousands(v);
                if (element.is("label,span")) {
                    element.html(v);
                }
                else if (element.is("input")) {
                    element.val(v);
                }
            }
            else {
                $.MvcSheet.Action(
					{
					    Action: this.FormatAction,
					    Datas: [this.FormatRule, value ? value.toString() : ""],
					    Mask: false,
					    LoadControlValue: false,
					    OnActionDone: function (e) {
					        if (element.is("label,span")) {
					            element.html(e);
					        }
					        else if (element.is("input")) {
					            element.val(e);
					        }
					    }
					});
            }
        }
    }
})(jQuery);