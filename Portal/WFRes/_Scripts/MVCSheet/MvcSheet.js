/// <reference path="MvcSheetUI.js" />

//JS框架,JS框架加载所有JS部件，提供与后台通讯方法

//属性定义
//定义MvcSheet命名控件
jQuery.extend({
    MvcSheet: {
        Version: "V1.0",
        AjaxUrl: window.location.href.replace("#", "&") + "&T=" + (Math.random() * 1000000).toString().substring(0, 6),
        LOADKEY: "load",    // 加载表单
        Actions: [],        // 执行事件:保存、提交...
        InitFunctions: [],  // 初始化之前的函数集合
        ReadyFunctions: [], // 加载完成需要执行事件集合
        //ActionKey
        Action_Save: "Save",
        Action_ViewInstance: "ViewInstance",
        Action_PreviewParticipant: "PreviewParticipant",
        Action_Print: "Print",
        Action_CancelInstance: "CancelInstance",
        Action_Reject: "Reject",
        Action_Submit: "Submit",
        Action_FinishInstance: "FinishInstance",
        Action_Forward: "Forward",
        Action_Assist: "Assist",
        Action_Consult: "Consult",
        Action_Circulate: "Circulate",
        Action_AdjustParticipant: "AdjustParticipant",
        Action_LockInstance: "LockInstance",
        Action_UnLockInstance: "UnLockInstance",
        Action_Close: "Close",
        Action_RetrieveInstance: "RetrieveInstance",
        Action_Viewed: "Viewed",//已阅
        Action_Urgen: "Urgen",//催办

        //默认Actions
        UrgenAction: { Action: "Urgen", Icon: "fa-bullhorn", Text: "催办", en_us: "Urge" },
        SaveAction: { Action: "Save", Icon: "fa-save", Text: "保存", en_us: "Save", OnActionPreDo: null, OnActionDone: null },
        PrintAction: { Action: "Print", Icon: "fa-print", Text: "打印", en_us: "Print", OnActionDone: function () { } },
        ViewedAction: { Action: "Viewed", Icon: "fa-check", Text: "已阅", en_us: "View", OnActionDone: function () { } },
        CancelInstanceAction: { Action: "CancelInstance", Icon: "fa-square-o", en_us: "Cancel", Text: "取消流程" },
        SubmitAction: { Action: "Submit", Icon: "fa-check", Text: "提交", en_us: "Submit", OnActionDone: function () { } },
        RejectAction: { Action: "Reject", Icon: "fa-mail-reply", Text: "驳回", en_us: "Reject", OnActionDone: function () { } },
        RetrieveInstanceAction: { Action: "RetrieveInstance", Icon: "fa-sign-in", en_us: "Retrieve", Text: "取回" },
        ViewInstanceAction: { Action: "ViewInstance", Icon: "fa-ellipsis-v", Text: "流程状态", en_us: "State" },
        PreviewParticipantAction: { Action: "PreviewParticipant", Icon: "fa-coumns", Text: "预览", en_us: "Preview" },
        FinishInstanceAction: { Action: "FinishInstance", Icon: "fa-square", Text: "结束流程", en_us: "Finish Instance" },
        ForwardAction: { Action: "Forward", Icon: "fa-mail-forward", Text: "转办", en_us: "Forward" },
        AssistAction: { Action: "Assist", Icon: "fa-qrcode", Text: "协办", en_us: "Assist" },
        ConsultAction: { Action: "Consult", Icon: "fa-phone", Text: "征询意见", en_us: "Consult" },
        CirculateAction: { Action: "Circulate", Icon: "fa-share-square-o", Text: "传阅", en_us: "Circulate" },
        AdjustParticipantAction: { Action: "AdjustParticipant", Icon: "fa-random", Text: "加签", en_us: "Plus" },
        LockInstanceAction: { Action: "LockInstance", Icon: "fa-unlock-alt", Text: "锁定", en_us: "Lock" },
        UnLockInstanceAction: { Action: "UnLockInstance", Icon: "fa-unlock-alt", Text: "解锁", en_us: "UnLock" },
        CloseAction: { Action: "Close", Icon: "fa-times", Text: "关闭", en_us: "Close" },
    }
});

if (!$.uuid) {
    $.uuid = function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };
}

//函数定义
jQuery.extend(
    $.MvcSheet,
    {
        //初始化
        Init: function (_AfterMvcInit) {
            this.LoadData(_AfterMvcInit);
        },
        //初始化工具栏
        InitToolBar: function () {
            //工具栏
            if ($.MvcSheet.Actions.length == 0) {
                $.MvcSheet.AddDefaultActions();
            }

            //新版移动端移从toolbar移除流程状态
            if ($.MvcSheetUI.SheetInfo.IsMobile) {
                $.MvcSheet.Actions.forEach(function (v, i) {
                    if (v.Action == 'ViewInstance') {
                        $.MvcSheet.Actions.splice(i, 1);
                        return;
                    }
                })
            }

            var manager = $(".SheetToolBar").SheetToolBar($.MvcSheet.Actions);

            if ($.MvcSheetUI.SheetInfo.IsMobile) {
                //区分待办保存的表单和审批的流程
                if ($.MvcSheetUI.SheetInfo.ActivityCode == "Activity2" && ($.MvcSheetUI.QueryString("Mode").toLowerCase() == "work" || $.MvcSheetUI.QueryString("Mode").toLowerCase() == "originate")) {
                    $.MvcSheetUI.SheetInfo.IsOriginateMode = true;
                }
                var _Actions = [];
                var _GetProxy = function (_thatAction, _actionKey) {
                    return {
                        text: _thatAction.Text,
                        handler: function () {
                            _thatAction.ActionClick();
                            console.log(_thatAction);
                            console.log(_thatAction.ActionClick);
                        },
                        actionKey: _actionKey
                    }
                }
                for (_Action in manager.ControlManagers) {
                    var that = manager.ControlManagers[_Action];
                    if (that.MobileVisible) {
                        _Actions.push(_GetProxy(that, _Action));
                    }
                };

                //修改成IONIC
                var _ActionButton = $("#dvmButtons");//$("#btnShowActions");
                //无按钮
                if (_Actions.length == 0) {
                    _ActionButton.hide();
                    _ActionButton.parents('ion-footer-bar').siblings('ion-content').removeClass('has-footer').end().remove();
                }
                else if (_Actions.length < 4) {
                    _Actions.forEach(function (e) {
                        var strClass = "icon-left";
                        if (e.actionKey == "Reject") {
                            e.Text = SheetLanguages.Current.Reject;
                        }
                        if (e.actionKey == "Submit" && !$.MvcSheetUI.SheetInfo.IsOriginateMode) {
                            e.text = SheetLanguages.Current.Approve;
                            manager.ControlManagers[e.actionKey].Text = SheetLanguages.Current.Approve;
                        }
                        var button = $("<button class=\"button foot-button " + strClass + " button-clear \"></button>")
                        button.text(e.text);
                        button.unbind("click." + e.actionKey).bind("click." + e.actionKey, function () { manager.ControlManagers[e.actionKey].ActionClick(); })
                        _ActionButton.append(button);
                    })
                }
                    //多个按钮
                else {
                    var moreActions = [];
                    _Actions.forEach(function (e) {
                        if (e.actionKey == "Reject" || e.actionKey == "Submit") {
                            var strClass = "icon-left";
                            if (e.actionKey == "Reject") {
                                e.text = SheetLanguages.Current.Reject;
                            }
                            if (e.actionKey == "Submit" && !$.MvcSheetUI.SheetInfo.IsOriginateMode) {
                                e.text = SheetLanguages.Current.Approve;
                                manager.ControlManagers[e.actionKey].Text = SheetLanguages.Current.Approve;
                            }
                            var button = $("<button class=\"button foot-button " + strClass + " button-clear \"></button>")
                            button.text(e.text);
                            button.unbind("click." + e.actionKey).bind("click." + e.actionKey, function () { manager.ControlManagers[e.actionKey].ActionClick(); })
                            _ActionButton.append(button);
                        } else {
                            moreActions.push(e);
                        }
                    })

                    if (moreActions.length > 0) {
                        var btnMore = $("<button class=\"button foot-button icon-left button-clear\">" + SheetLanguages.Current.More + "</button>")
                        var buttonsA = [];
                        moreActions.forEach(function (action) {
                            buttonsA.push({ text: action.text });
                        });

                        btnMore.unbind("click.moreaction").bind("click.moreaction", function () {
                            var hideSheet = $.MvcSheetUI.IonicFramework.$ionicActionSheet.show({
                                buttons: buttonsA,
                                cancelText: SheetLanguages.Current.Cancel,
                                cancel: function () {
                                    return false;
                                },
                                buttonClicked: function (index) {
                                    moreActions[index].handler();
                                    return true;
                                }
                            });
                            //$timeout(function () {
                            //    hideSheet();
                            //}, 10000);
                        });
                        _ActionButton.append(btnMore);
                    }
                }
            }
        },
        //初始化HiddenFields
        InitHiddenFields: function () {
            $("input:hidden").each(function () {
                if ($(this).data("type") == "SheetHiddenField") {
                    $(this).SheetHiddenField();
                }
            });
        },
        //加载数据
        LoadData: function (_AfterMvcInit) {
            var loadText = "正在努力加载...";
            $.MvcSheetUI.Loading = true;
            if (this.AjaxUrl.toLowerCase().indexOf("ismobile") > -1)
                loadText = "";
            $.LoadingMask.Show(loadText, false);
            this.GetSheet(
                {
                    "Command": this.LOADKEY,
                    "Lang": window.localStorage.getItem("H3.Language")
                },
                function (data) {
                    var performance_start = performance.now();
                    console.log('data loaded');
                    $.MvcSheetUI.SheetInfo = data;
                    if (!$.MvcSheetUI.SheetInfo.IsMobile) {
                        $.MvcSheetUI.SheetInfo.Language = window.localStorage.getItem("H3.Language");
                    }
                    //处理表单锁 
                    if (data.Message) {
                        $.LoadingMask.Hide();
                        if ($.MvcSheetUI.IonicFramework.$rootScope && $.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "dingtalk") {
                            alert(data.Message)
                            if (data.Close) {
                                setTimeout(function () {
                                    dd.biz.navigation.close({
                                        onSuccess: function (result) { },
                                        onFail: function (err) { }
                                    });
                                }, 1000)
                            }
                        }
                        else {
                            alert(data.Message)
                            if (data.Close) {
                                setTimeout(function () {
                                    $.MvcSheet.ClosePage();
                                }, 1000)
                            }
                        }
                        //return;
                    }

                    //添加自定义javascript扩展的输出
                    if ($.MvcSheetUI.SheetInfo.PageScript) {
                        var pagescript = $('<script type="text/javascript">' + $.MvcSheetUI.SheetInfo.PageScript + '</script>');
                        $('body').append(pagescript);
                    }

                    // 添加征询意见DOM元素，与数据项Sheet__ConsultComment关联
                    if ($.MvcSheetUI.SheetInfo.IsMobile) {
                        $(".divContent:last").append('<div class="list"><div class="item item-input"><span data-type="SheetLabel" class="input-label" data-datafield="Sheet__ConsultComment">征询意见</span><div class="detail"><div data-datafield="Sheet__ConsultComment" data-type="SheetComment"></div></div></div></div>');
                        $(".divContent:last").append('<div class="list"><div class="item item-input"><span data-type="SheetLabel" class="input-label" data-datafield="Sheet__Assist">协办意见</span><div class="detail"><div data-datafield="Sheet__Assist" data-type="SheetComment"></div></div></div></div>');
                        $(".divContent:last").append('<div class="list"><div class="item item-input"><span data-type="SheetLabel" class="input-label" data-datafield="Sheet__Forward">转办意见</span><div class="detail"><div data-datafield="Sheet__Forward" data-type="SheetComment"></div></div></div></div>');
                    }
                    else {
                        $(".divContent:last").append('<div class="row tableContent"><div class="col-md-2"><span data-type="SheetLabel" data-datafield="Sheet__ConsultComment">征询意见</span></div><div class="col-md-10"><div data-datafield="Sheet__ConsultComment" data-type="SheetComment"></div></div></div>');
                        $(".divContent:last").append('<div class="row tableContent"><div class="col-md-2"><span data-type="SheetLabel" data-datafield="Sheet__Assist">协办意见</span></div><div class="col-md-10"><div data-datafield="Sheet__Assist" data-type="SheetComment"></div></div></div>');
                        $(".divContent:last").append('<div class="row tableContent"><div class="col-md-2"><span data-type="SheetLabel" data-datafield="Sheet__Forward">转办意见</span></div><div class="col-md-10"><div data-datafield="Sheet__Forward" data-type="SheetComment"></div></div></div>');
                    }

                    $.MvcSheet.PreInit.apply(this, [$.MvcSheetUI.SheetInfo]);

                    // 初始化事件
                    if ($.MvcSheet.InitFunctions.length > 0) {
                        for (var i = 0; i < $.MvcSheet.InitFunctions.length; i++) {
                            $.MvcSheet.InitFunctions[i].call(this, $.MvcSheetUI.SheetInfo);
                        }
                    }

                    // 初始化语言
                    $.MvcSheet.PreInitLanguage();
                    //工具栏
                    $.MvcSheet.InitToolBar();

                    //判断元素类型，渲染成MvcControl
                    var datafields = $("[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() + "]");
                    // 子表中的控件会在子表中进行初始化，故过滤掉子表模板行中的控件
                    var filterDataFields = []; // 正常顺序加载的控件
                    var delayDataFields = [];  // 需要延迟加载的控件
                    for (var i = 0, len = datafields.length; i < len; i++) {
                        var datafield = datafields[i];
                        if (datafield.tagName.toLowerCase() == "table") {
                            delayDataFields.push(datafield);
                        }
                        else if ($(datafield).parents("tr.template").length == 0) {
                            filterDataFields.push(datafield);
                        }
                    }
                    for (i = 0, len = filterDataFields.length; i < len; i++) {
                        $(filterDataFields[i]).SheetUIManager();
                    }
                    for (i = 0, len = delayDataFields.length; i < len; i++) {
                        $(delayDataFields[i]).SheetUIManager();
                    }
                    //$("[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() + "]").each(function () {
                    //    //初始化控件
                    //    $(this).SheetUIManager();
                    //});

                    //HiddenFields
                    $.MvcSheet.InitHiddenFields();

                    //移动端布局
                    if ($.MvcSheetUI.SheetInfo.IsMobile) {
                        ////是否找到默认审批控件
                        //var _DefaultCommentFound = false;
                        ////将第一个可编辑的审批控件及其标题移到最首位
                        //for (c in $.MvcSheetUI.ControlManagers) {
                        //    if ($.MvcSheetUI.ControlManagers[c] instanceof $.MvcSheetUI.Controls.SheetComment) {
                        //        var parent = $($.MvcSheetUI.ControlManagers[c].Element).closest("div.item");
                        //        var title = $($.MvcSheetUI.ControlManagers[c].Element).closest("div.item").prev(".item");
                        //        $(title).removeClass("item").addClass("bannerTitle");
                        //        $(title).find(".input-label").removeClass("input-label").addClass("divBasicInfo");

                        //        var _Element = $.MvcSheetUI.ControlManagers[c].Element;
                        //        //主容器 .panel-body
                        //        var panelBody = $(_Element).parents("div.panel-body");
                        //        $(_Element).addClass("sheet-comment");
                        //        if ($.MvcSheetUI.ControlManagers[c].Editable && !_DefaultCommentFound) {
                        //            $(_Element).addClass("topBannerTitle");
                        //            $(_Element).parent().prependTo(panelBody);
                        //            $(title).prependTo(panelBody);
                        //            _DefaultCommentFound = true;
                        //        }
                        //        else {
                        //            //非默认审批控件移到主体表单后
                        //            $(panelBody).append(title);
                        //            $(title).after($(_Element).parent());
                        //        }
                        //        $(title).show();
                        //        parent.hide();
                        //    }
                        //}

                        //$(".col-md-2,.col-md-4,col-md-10").filter(function () {
                        //    return $(this).children().length == 0 && (!$(this).text() || $(this).text().trim() == "")
                        //}).hide();

                        //ng-cloak
                        $("ion-content").removeClass("ng-cloak");
                    }
                    else {
                        //处理不可见布局
                        $("div[class^='col-md-']").each(function () {
                            var needHide = true;
                            if ($(this).text()) {
                                needHide = false;
                            }
                            else {
                                var DataFieldElements = $(this).find("[" + $.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase() + "]");
                                for (var i = 0; i < DataFieldElements.length; i++) {
                                    var manager = $(DataFieldElements).SheetUIManager();
                                    if (!manager) {
                                        var datafield = $(DataFieldElements).attr($.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey.toLowerCase());
                                        alert("数据项:{" + datafield + "}不存在");
                                        return;
                                    }
                                    if (manager.Visiable) {
                                        needHide = false;
                                        break;
                                    }
                                }
                            }
                            if (needHide) {
                                $(this).hide();
                            }
                        });

                        //处理不可见布局
                        $("div[class='row']").each(function () {
                            if ($(this).find("div:visible[class^='col-md-']").length == 0) {
                                $(this).hide();
                            }
                        });
                    }
                    if (typeof (_AfterMvcInit) == "function") {
                        _AfterMvcInit();
                    }
                    $.MvcSheet.RenderLanguage();// 多语言初始化
                    $.MvcSheet.Rendered.apply(this, [$.MvcSheetUI.SheetInfo]);
                    $.MvcSheetUI.Loading = false;
                    $.LoadingMask.Hide();
                    $.MvcSheet.Loaded.apply(this, [$.MvcSheetUI.SheetInfo]);

                    if ($.MvcSheet.ReadyFunctions.length > 0) {
                        for (var i = 0; i < $.MvcSheet.ReadyFunctions.length; i++) {
                            $.MvcSheet.ReadyFunctions[i].call(this, $.MvcSheetUI.SheetInfo);
                        }
                    }

                    var performance_end = performance.now();
                    console.log("render:" + (performance_end - performance_start));
                },
                function (e) {
                    alert("表单数据加载失败，请稍候再试!");
                }),
                false//同步加载数据
        },
        //MvcSheet完成事件 
        Ready: function (fn) {
            $.MvcSheet.ReadyFunctions.push(fn);
        },
        PreInitLanguage: function () {
            var language = $.MvcSheetUI.SheetInfo.Language;
            if (typeof (SheetLanguages[language]) == "undefined" || SheetLanguages[language] == null) {
                language = "zh_cn";
            }
            $.extend(SheetLanguages.Current, SheetLanguages[language]);
        },
        RenderLanguage: function () {
            // 多语言初始化
            var language = $.MvcSheetUI.SheetInfo.Language;
            if (language) {
                language = $.MvcSheetUI.PreDataKey + language.replace("-", "_");
                $("span[" + language + "],label[" + language + "]").each(function () {
                    $(this).html($(this).attr(language));
                });
            }
            //手机端基本信息特殊处理
            if ($.MvcSheetUI.SheetInfo.IsMobile == true) {
                //发起人
                $("#divFullName .input-label").text(SheetLanguages.Current.BasicInfo.divFullName);
                //发起时间
                $("#divOriginateDate .input-label").text(SheetLanguages.Current.BasicInfo.divOriginateDate);
                //所属组织
                $($("#divOriginateOUName .input-label")[0]).text(SheetLanguages.Current.BasicInfo.divOriginateOUName);
                //流水号
                $("#divSequenceNo .input-label").text(SheetLanguages.Current.BasicInfo.divSequenceNo);
            }
        },
        PreInit: function () { },
        PreLoad: function (fn) {
            $.MvcSheet.InitFunctions.push(fn);
        },
        Loaded: function () { },
        Rendered: function () {
            // 注册输入框鼠标样式
            $("input,textarea,select").addClass($.MvcSheetUI.Css.inputMouseOut).unbind("mouseover.style").bind("mouseover.style",
                function () {
                    var target = $(this);
                    if (target.parent().is("li") && target.parent().parent().parent().is("div")) {
                        target = target.parent().parent().parent();
                    }
                    target.removeClass($.MvcSheetUI.Css.inputMouseOut).addClass($.MvcSheetUI.Css.inputMouseMove);
                })
                .unbind("mouseenter.style").bind("mouseenter.style",
                function () {
                    var target = $(this);
                    if (target.parent().is("li") && target.parent().parent().parent().is("div")) {
                        target = target.parent().parent().parent();
                    }
                    target.removeClass($.MvcSheetUI.Css.inputMouseMove).addClass($.MvcSheetUI.Css.inputMouseEnter);
                })
                .unbind("mouseout.style").bind("mouseout.style",
                function () {
                    var target = $(this);
                    if (target.parent().is("li") && target.parent().parent().parent().is("div")) {
                        target = target.parent().parent().parent();
                    }
                    target.removeClass($.MvcSheetUI.Css.inputMouseEnter).removeClass($.MvcSheetUI.Css.inputMouseMove).addClass($.MvcSheetUI.Css.inputMouseOut);
                });

            if ($.MvcSheetUI.SheetInfo.IsMobile) {
                var selects = $("select[data-datafield]");
                if (selects && selects.length > 0) {
                    for (var i = 0; i < selects.length; i++) {
                        var manager = $(selects[i]).SheetUIManager();
                        if ($(selects[i]).attr("data-datafield").indexOf('.') > -1) {
                            manager = $(selects[i]).SheetUIManager($(selects[i]).parent().parent().attr("data-row"));
                        }
                        if (manager && !manager.Editable) {
                            if ($.MvcSheetUI.SheetInfo.IsOriginateMode && $(selects[i]).attr("data-datafield") == "Originator.OUName" && $(selects[i]).find("option").length > 1) break;
                            $(selects[i]).siblings(".afFakeSelect").hide();
                        }
                    }
                }
            } else {
                $("#content-wrapper").css("padding-top", $("#main-navbar").height() + 10);//处理很多按钮折行挡住表单标题问题
            }

            // 原表单运行对象-待合并之后完全删除
            $.MvcSheetUI.MvcRuntime = new Sheet();
        },
        //执行动作: {Action:"方法名称",Datas:[{数据项1},{数据项2}]}
        Action: function (actionControl) {
            if (typeof (actionControl.Mask) == "undefined" || actionControl.Mask) {
                $.LoadingMask.Show((actionControl.Text || SheetLanguages.Current.Doing) + "...");
            }

            //执行动作标示
            var actionName = actionControl.Action;
            //参数：[{数据项1},{数据项2},...]或["#ID1"，"#ID2",...]或["数据1","数据2"]或混合
            var datas = actionControl.Datas;
            //console.log(actionName + "：Do...");

            //构造数据项的值
            var CommandParams = { Command: actionName };
            var params = [];
            if (typeof (actionControl.LoadControlValue) == "undefined" || actionControl.LoadControlValue) {
                if (datas) {
                    for (var i = 0; i < datas.length; i++) {
                        if (datas[i].toString().indexOf("{") == 0) {
                            var key = datas[i].replace("{", "").replace("}", "");
                            params.push($.MvcSheetUI.GetControlValue(key));
                        }
                        else if (datas[i].toString().indexOf("#") == 0) {
                            var key = datas[i].replace("#");
                            params.push($.MvcSheetUI.GetControlValue(datas[i]));
                        }
                        else {
                            params.push(datas[i]);
                        }
                    }
                }
            }
            else {
                params = datas;
            }
            CommandParams["Param"] = JSON.stringify(params);
            if (actionControl.PostSheetInfo) {
                CommandParams["MvcPostValue"] = JSON.stringify(this.GetMvcPostValue(this.actionName));
            }
            var that = this;
            //提交到后台执行
            this.PostSheet(
                    CommandParams,
                    function (data) {
                        if (actionControl.Text && (actionControl.Text == SheetLanguages.Current.Forward
                                    || actionControl.Text == SheetLanguages.Current.Assist
                                    || actionControl.Text.indexOf(SheetLanguages.Current.Consult) > -1
                                    || actionControl.Text == SheetLanguages.Current.Circulate
                                    || actionControl.Text == SheetLanguages.Current.Urgen)) {
                            if (data.Successful) {
                                var _text = actionControl.Text + SheetLanguages.Current.Success + "!";
                                if (data.Message && (actionControl.Text == $.MvcSheet.AssistAction.Text || actionControl.Text == $.MvcSheet.ConsultAction.Text)) {
                                    _text = $.format(SheetLanguages.Current.AssistError3, data.Message, actionControl.Text) + "," + $.format(SheetLanguages.Current.AssistError4, actionControl.Text);
                                    if ($.MvcSheetUI.IonicFramework.$ionicPopup) {
                                        var myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.alert({
                                            title: '',
                                            template: _text,
                                            buttons: [{
                                                text: SheetLanguages.Current.OK,
                                                type: 'button-clear',
                                                onTap: function (e) {
                                                    if (actionControl.OnActionDone) {
                                                        actionControl.OnActionDone.apply(actionControl, [data]);
                                                    }
                                                    that.ResultHandler.apply(that, [actionControl, data]);
                                                    if (actionControl.CloseAfterAction) {
                                                        $.MvcSheet.ClosePage();
                                                    }
                                                }
                                            }
                                            ]
                                        });
                                    } else {
                                        if ($.MvcSheetUI.SheetInfo.IsMobile)
                                            $.MvcSheet.Show(_text);
                                        else
                                            $.MvcSheet.showAlert(_text);
                                        if (actionControl.OnActionDone) {
                                            actionControl.OnActionDone.apply(actionControl, [data]);
                                        }
                                        that.ResultHandler.apply(that, [actionControl, data]);
                                        if (actionControl.CloseAfterAction) {
                                            $.MvcSheet.ClosePage();
                                        }
                                    }
                                } else {
                                    if ($.MvcSheetUI.SheetInfo.IsMobile)
                                        $.MvcSheet.Show(_text);
                                    else
                                        $.MvcSheet.showAlert(_text);
                                    if (actionControl.OnActionDone) {
                                        actionControl.OnActionDone.apply(actionControl, [data]);
                                    }
                                    that.ResultHandler.apply(that, [actionControl, data, "true"]);
                                    if (actionControl.CloseAfterAction) {
                                        $.MvcSheet.ClosePage();
                                    }
                                }
                                $.LoadingMask.Hide();
                            } else if (data.Errors) {
                                var _text = actionControl.Text + SheetLanguages.Current.Failed + "!" + " ";
                                $.each(data.Errors, function (n, i) {
                                    _text = _text.replace("!", ",");
                                    _text += eval(i);
                                });
                                if (data.Message && (actionControl.Text == $.MvcSheet.AssistAction.Text || actionControl.Text == $.MvcSheet.ConsultAction.Text)) {
                                    _text = $.format(SheetLanguages.Current.AssistError3, data.Message, actionControl.Text) + "！";
                                }
                                $.MvcSheet.showAlert(_text);
                                if (actionControl.CloseAfterAction) {
                                    $.MvcSheet.ClosePage();
                                }
                                $.LoadingMask.Hide();
                                return;
                            }
                            else {
                                var _text = actionControl.Text + SheetLanguages.Current.Failed + "!";
                                $.MvcSheet.showAlert(_text);
                                if (actionControl.CloseAfterAction) {
                                    $.MvcSheet.ClosePage();
                                }
                                $.LoadingMask.Hide();
                                return;

                            }
                        } else {
                            if (actionControl.OnActionDone) {
                                actionControl.OnActionDone.apply(actionControl, [data]);
                            }
                            that.ResultHandler.apply(that, [actionControl, data]);
                            if (actionControl.CloseAfterAction) {
                                $.MvcSheet.ClosePage();
                            }
                            $.LoadingMask.Hide();
                        }
                    },
                        undefined,
                        actionControl.Async
                );
        },

        // 弹出消息确认框
        showAlert: function (message, doneCallback) {
            if ($.MvcSheetUI.IonicFramework.$ionicPopup) {
                var myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.alert({
                    title: '',
                    template: message,
                    buttons: [{ text: SheetLanguages.Current.OK }]
                });
            }
            else if (alert(message)) {
                doneCallback();
            }
        },
        // 弹出消息框
        Show: function (message, doneCallback) {
            if ($.MvcSheetUI.IonicFramework.$ionicPopup) {
                var myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.show({
                    title: '',
                    template: message
                });
            }
            else if (alert(message)) {
                doneCallback();
            }
        },
        // 弹出消息确认框
        AlertAction: function (message, doneCallback) {
            if ($.MvcSheetUI.IonicFramework.$ionicPopup) {
                var myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.show({
                    cssClass: 'bpm-sheet-AlertAction',
                    template: '<span>' + message + '<span>',
                    buttons: [{
                        text: SheetLanguages.Current.Confirm,
                        type: 'button-clear',
                        onTap: function (e) {
                            doneCallback();
                        }
                    }
                    ]
                });
            }
            else if (alert(message)) {
                doneCallback();
            }
        },
        // 弹出消息确认/取消框
        ConfirmAction: function (message, doneCallback) {
            if ($.MvcSheetUI.IonicFramework.$ionicPopup) {
                var myPopup = $.MvcSheetUI.IonicFramework.$ionicPopup.show({
                    cssClass: 'bpm-sheet-ConfirmAction',
                    template: '<span>' + message + '<span>',
                    buttons: [
                           {
                               text: SheetLanguages.Current.Cancel,
                               type: 'button-clear',
                           },
                           {
                               text: SheetLanguages.Current.Confirm,
                               type: 'button-clear',
                               onTap: function (e) {
                                   doneCallback();
                               }
                           },
                    ]
                });
            }
            else if (confirm(message)) {
                doneCallback();
            }
        },

        //校验
        ActionValidata: function (actionControl, effective) {

            var result = true;
            if (this.Validate) {
                result = this.Validate.apply(actionControl);
            }

            if (result || result == undefined) {
                return $.MvcSheetUI.Validate(actionControl, effective);
            }
            else
                return false;
        },

        //保存
        Save: function (actionControl) {
            //业务表单 保存做必填 验证，流程表单不做必填验证
            var IsWorkflow = $.MvcSheetUI.SheetInfo.SheetDataType == 1;
            if (!$.MvcSheet.ActionValidata(actionControl, IsWorkflow)) return false;
            $.LoadingMask.Show(SheetLanguages.Current.Saving);
            var SheetPostValue = this.GetMvcPostValue(this.Action_Save);
            var that = this;
            this.PostSheet(
                    { Command: this.Action_Save, MvcPostValue: JSON.stringify(SheetPostValue) },
                    function (data) {
                        that.ResultHandler.apply(that, [actionControl, data]);
                    }
                );
        },
        //提交
        Submit: function (actionControl, text, destActivity, postValue) {
            if ($.MvcSheetUI.SheetInfo.IsMobile) {
                var controls = $("#divSheet input[data-type='SheetTextBox']");
                controls.each(function () {
                    $(this).trigger("change");
                });
            }
            if (!$.MvcSheet.ActionValidata(actionControl)) return false;

            var that = this;
            $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfirmDo + "【" + text + "】" + SheetLanguages.Current.Operation + "?", function () {
                $.LoadingMask.Show(SheetLanguages.Current.Sumiting);
                debugger;
                var SheetPostValue = that.GetMvcPostValue(that.Action_Submit, destActivity, postValue);
                that.PostSheet(
                    {
                        Command: that.Action_Submit,
                        MvcPostValue: JSON.stringify(SheetPostValue)
                    },
                    function (data) {
                        that.ResultHandler.apply(that, [actionControl, data]);
                    });
            })
        },
        // 控件初始化事件
        ControlInit: function () { },
        // 控件初始化之前函数
        ControlPreRender: function () { },
        // 控件加载完成事件
        ControlRendered: function () { },
        //驳回
        Reject: function (actionControl, destActivity) {
            actionControl.IsReject = true;
            if (!$.MvcSheet.ActionValidata(actionControl)) return false;
            var that = this;
            $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfirmDo + "【" + SheetLanguages.Current.Reject + "】" + SheetLanguages.Current.Operation + "?", function () {
                $.LoadingMask.Show(SheetLanguages.Current.Rejecting);
                var SheetPostValue = that.GetMvcPostValue(that.Action_Reject, destActivity);
                that.PostSheet(
                    {
                        Command: that.Action_Reject,
                        MvcPostValue: JSON.stringify(SheetPostValue)
                    },
                    function (data) {
                        that.ResultHandler.apply(that, [actionControl, data]);
                    });
            })
        },
        //结束流程
        FinishInstance: function (actionControl) {
            $.LoadingMask.Show(SheetLanguages.Current.Finishing);
            var SheetPostValue = this.GetMvcPostValue(this.Action_FinishInstance);
            var that = this;
            this.PostSheet(
                { Command: this.Action_FinishInstance, MvcPostValue: JSON.stringify(SheetPostValue) },
                function (data) {
                    that.ResultHandler.apply(that, [actionControl, data]);
                });
        },
        //取回流程
        RetrieveInstance: function (actionControl) {
            $.LoadingMask.Show(SheetLanguages.Current.Retrieving);
            var that = this;
            this.GetSheet(
                { Command: this.Action_RetrieveInstance },
                function (data) {
                    that.ResultHandler.apply(that, [actionControl, data]);
                });
        },
        //获取Mvc表单传给后台的数据
        GetMvcPostValue: function (actionName, destActivity, postValue) {
            var SheetPostValue = {
                Command: actionName,
                DestActivityCode: destActivity,
                PostValue: postValue,
                BizObjectId: $.MvcSheetUI.SheetInfo.BizObjectID,
                InstanceId: $.MvcSheetUI.SheetInfo.InstanceId,
                BizObject: {}//当前表单的数据项集合值
            };
            SheetPostValue.BizObject.DataItems = $.MvcSheetUI.SaveSheetData(actionName);
            SheetPostValue.Priority = $.MvcSheetUI.Priority;
            SheetPostValue.HiddenFields = $.MvcSheetUI.HiddenFields;
            // TODO:需要获取当前提交人所选择的发起组织
            SheetPostValue.ParentUnitID = $.MvcSheetUI.ParentUnitID;
            if ($.MvcSheetUI.SheetInfo.WorkItemType == 5) {
                SheetPostValue.WorkItemType = $.MvcSheetUI.SheetInfo.WorkItemType;
                SheetPostValue.WorkItemId = $.MvcSheetUI.SheetInfo.WorkItemId;
            }
            //if($.MvcSheetUI.PrioritySelector!=null)
            //   ***= $.MvcSheetUI.PrioritySelector.GetVale();
            return SheetPostValue;
        },
        //回调函数处理
        //回调函数处理
        ResultHandler: function (actionControl, data, State) {
            if ($.MvcSheet.ActionDone) {
                $.MvcSheet.ActionDone.apply(actionControl, [data])
            }
            if (data == "undefined" || data == null) return;
            if (data.Successful) {
                //执行操作后获取任务数量
                top.postMessage("TotalCount", "*");
                if ($.MvcSheetUI.SheetInfo.IsMobile) {
                    switch (actionControl.Action) {
                        case "Save":
                            if (!data.Url && data.Refresh) {
                                $.LoadingMask.Hide();
                                var href = window.location.href;
                                href = href.replace("&T=", "&T=" + Math.round(Math.random() * 100, 0));
                                window.location.href = href;
                                return;
                            } else if (data.Url && data.Url.indexOf("EditBizObject") > -1 && data.Url.indexOf("BizObjectID") > -1 && data.Refresh) {
                                //钉钉关闭表单
                                if ($.MvcSheetUI.IonicFramework.$rootScope.dingMobile.isDingMobile && $.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "dingtalk") {
                                    dd.biz.navigation.close({
                                        onSuccess: function (result) { },
                                        onFail: function (err) { }
                                    });
                                } else {
                                    // 应用中心保存回调事件
                                    $.LoadingMask.Hide();
                                    //跳转到相关页面
                                    var indexOf = window.location.href.indexOf("sourceUrl");
                                    if (indexOf == -1) {
                                        window.open('/Portal/Mobile/index.html', '_self');
                                    } else {
                                        var substr = window.location.href.substr(indexOf);
                                        var indexOf2 = substr.indexOf("&");
                                        var str = substr.substr(10, indexOf2 - 10);
                                        href = window.location.origin + '/Portal/Mobile/index.html#' + str, '_self';
                                        window.location.href = href;
                                    }
                                }
                                return;
                            }
                            break;
                            //case "Urgen":
                            //    if (!$.MvcSheetUI.SheetInfo.IsOriginateMode) {
                            //        $.LoadingMask.Hide();
                            //        setTimeout(function () {
                            //            var href = window.location.href;
                            //            href = href.replace("&T=", "&T=" + Math.round(Math.random() * 100, 0));
                            //            window.location.href = href;
                            //        },500);
                            //        return;
                            //    }
                            //    break;

                    }
                    //钉钉关闭表单
                    if ($.MvcSheetUI.IonicFramework.$rootScope.dingMobile.isDingMobile && $.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "dingtalk") {
                        // 协办/征询/传阅存在消息提示层，延时一秒以供展示
                        if (State) {
                            setTimeout(function () {
                                dd.biz.navigation.close({
                                    onSuccess: function (result) { },
                                    onFail: function (err) { }
                                });
                            }, 1000)
                        } else {
                            dd.biz.navigation.close({
                                onSuccess: function (result) { },
                                onFail: function (err) { }
                            });
                        }
                    } else {
                        if (typeof (WeixinJSBridge) != "undefined" && $.MvcSheetUI.IonicFramework.$rootScope.source == "message") {
                            // 协办/征询/传阅存在消息提示层，延时一秒以供展示
                            if (State) {
                                setTimeout(function () {
                                    //微信打开消息关闭表单
                                    WeixinJSBridge.call("closeWindow");
                                }, 1000)
                            } else {
                                //微信打开消息关闭表单
                                WeixinJSBridge.call("closeWindow");
                            }
                        } else if ($.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "wechat") {
                            // 协办/征询/传阅存在消息提示层，延时一秒以供展示
                            if (State) {
                                setTimeout(function () {
                                    //微信关闭表单
                                    //var goIndex = $.MvcSheetUI.IonicFramework.$rootScope.orgIndex - window.history.length - 1;
                                    //window.history.go(goIndex);
                                    window.history.go(-1);
                                }, 1000)
                            } else {
                                //微信关闭表单
                                //var goIndex = $.MvcSheetUI.IonicFramework.$rootScope.orgIndex - window.history.length - 1;
                                //window.history.go(goIndex);
                                window.history.go(-1);
                            }
                        } else {
                            // 协办/征询/传阅存在消息提示层，延时一秒以供展示
                            if (State) {
                                setTimeout(function () {
                                    //app关闭表单
                                    window.location.href = data.MobileReturnUrl;
                                }, 1000)
                            } else {
                                //app关闭表单
                                window.location.href = data.MobileReturnUrl;
                            }
                        }
                    }
                }
                else {
                    if (data.ClosePage) {
                        $.MvcSheet.ClosePage();
                    }
                    else if (data.Url) {
                        //流程表单保存后没有编辑权限则不跳转编辑页面
                        if (actionControl.Action == "Save" && data.Extend && data.Extend.CanEdit == false) {
                            alert(SheetLanguages.Current.SuccessSave);
                            var href = window.location.href;
                            href = href.replace("&T=", "&T=" + Math.round(Math.random() * 100, 0));
                            window.location.href = href;
                        } else {
                            window.location.href = data.Url;
                        }
                    }
                    else if (data.Message) {
                        alert(data.Message);
                        if (data.Refresh) {
                            var href = window.location.href;
                            href = href.replace("&T=", "&T=" + Math.round(Math.random() * 100, 0));
                            window.location.href = href;
                        }
                    }
                    else {
                        // 不需要 Reload
                        // window.location.reload();
                    }
                }
            }
            else {
                //Error:错误提示方式需要修改
                if (data.Errors) {
                    if (data.Errors[0] != "") var name = data.Errors[0];
                    for (var i = 0; i < data.Errors.length; i++) {
                        var errorMsg = "";
                        try {
                            errorMsg = eval("SheetLanguages.Current." + data.Errors[i] + "");
                        } catch (ex) {
                            errorMsg = data.Errors[i]
                        }
                        alert(errorMsg || name);
                    }
                }
            }
            $.LoadingMask.Hide();
        },
        //关闭页面
        ClosePage: function () {
            try {
                if (window.opener != null
                    && window.opener.location != null
                    && window.opener.location.href != window.location.href
                    && ($.MvcSheetUI.QueryString("Mode").toLowerCase() != "originate"
                        || $.MvcSheetUI.QueryString("AfterSave") == "1")
                    )
                {
                    if ($.MvcSheetUI.QueryString("AfterSave") == "0") {
                        //设置了只关闭
                        window.close();
                    } else {
                        window.opener.location.reload();
                        window.close();
                    }


                } else {
                    window.close();
                    //钉钉pc表单
                    window.open("about:blank", "_self");
                }
                //iframe 关闭当前表单页面
                top.window.postMessage("ClosePage", "*");
                if (!this.IsPC()) {
                    //钉钉关闭表单
                    if ($.MvcSheetUI.IonicFramework.$rootScope.dingMobile.isDingMobile && $.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "dingtalk") {
                        dd.biz.navigation.close({
                            onSuccess: function (result) { },
                            onFail: function (err) { }
                        });
                    } else {
                        //跳转到相关页面
                        var indexOf = window.location.href.indexOf("sourceUrl");
                        if (indexOf == -1) {
                            window.open('/Portal/Mobile/index.html', '_self');
                        } else {
                            var substr = window.location.href.substr(indexOf);
                            var indexOf2 = substr.indexOf("&");
                            var str = substr.substr(10, indexOf2 - 10);
                            window.open('/Portal/Mobile/index.html#' + str, '_self');
                        }
                    }

                }
            } catch (e) {
                window.close();
            }
        },

        IsPC: function () {
            var userAgentInfo = navigator.userAgent;
            var Agents = ["Android", "iPhone",
                        "SymbianOS", "Windows Phone",
                        "iPad", "iPod"];
            var flag = true;
            for (var v = 0; v < Agents.length; v++) {
                if (userAgentInfo.indexOf(Agents[v]) > 0) {
                    flag = false;
                    break;
                }
            }
            return flag;
        },

        //添加默认的事件
        AddDefaultActions: function () {
            this.Actions.splice(0, this.Actions.length,
                    this.UrgenAction,
                    this.RetrieveInstanceAction,
                    this.SaveAction,
                    this.ViewInstanceAction,
                    this.PreviewParticipantAction,
                    this.PrintAction,
                    this.ViewedAction,
                    this.CancelInstanceAction,
                    this.SubmitAction,
                    this.RejectAction,
                    this.FinishInstanceAction,
                    this.ForwardAction,
                    this.AssistAction,
                    this.ConsultAction,
                    this.CirculateAction,
                    this.AdjustParticipantAction,
                    this.LockInstanceAction,
                    this.UnLockInstanceAction,
                    this.CloseAction
                );
        },

        //添加自定义事件
        AddAction: function (option) {
            // Actions.length为0时，说明Load的异步返回数据还没返回，添加到Actions里面就可以了，系统Load回来会执行
            if ($.MvcSheetToolbar.AddButton) {
                $.MvcSheetToolbar.AddButton(option);
            }
            else {
                if (this.Actions.length == 0) {
                    this.AddDefaultActions();
                }
            }
            if (option.PreAction) {
                for (var i in this.Actions) {
                    if (this.Actions[i].Action == option.PreAction) {
                        if (i < this.Actions.length - 1) i++;
                        this.Actions.splice(i, 0, option);
                        break;
                    }
                }
            }
            else {
                this.Actions.push(option);
            }
        },

        //用get方式可传送简单数据，但大小一般限制在1KB下，数据追加到url中发送（http的header传送），
        //也就是说，浏览器将各个表单字段元素及其数据按照URL参数的格式附加在请求行中的资源路径后面。
        //另外最重要的一点是，它会被客户端的浏览器缓存起来，那么，别人就可以从浏览器的历史记录中，读取到此客户的数据，比如帐号和密码等。
        //因此，在某些情况下，get方法会带来严重的安全性问题;GET方式传送数据量小，处理效率高，安全性低，会被缓存，而POST反之
        GetSheet: function (data, callback, errorhandler, async) {
            $.ajax({
                type: "GET",
                url: this.AjaxUrl,
                data: data,
                dataType: "json",
                async: async != null ? async : true,
                success: callback,
                error: errorhandler
            });
        },
        //当使用POST方式时，浏览器把各表单字段元素及其数据作为HTTP消息的实体内容发送给Web服务器，
        //而不是作为URL地址的参数进行传递，使用POST方式传递的数据量要比使用GET方式传送的数据量大的多
        PostSheet: function (data, callback, errorhandler, async) {
            debugger
            var ajaxUrl = this.AjaxUrl;
            if (ajaxUrl.toLowerCase().indexOf("&bizobjectid=") == -1) {
                ajaxUrl = this.AjaxUrl + "&BizObjectID=" + $.MvcSheetUI.SheetInfo.BizObjectID;
            }
            if (typeof (async) == "undefined")
                async = true;
            if (typeof (errorhandler) == "undefined") {
                errorhandler = function (e) {
                    alert("系统出现异常!");
                    $.LoadingMask.Hide();
                };
            }
            $.ajax({
                type: "POST",
                url: ajaxUrl,
                data: data,
                dataType: "json",
                async: async,
                success: callback,
                error: errorhandler
            });
        }
    });