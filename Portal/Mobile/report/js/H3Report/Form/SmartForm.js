// JS框架,JS框架加载所有JS部件，提供与后台通讯方法
// 属性定义
// 定义Form命名控件
jQuery.extend({
    SmartForm: {
        // 所有的请求入口
        AjaxUrl: "/Sheet/DoAction",
        // 表单编码
        FormCode: "",
        // 加载参数值,会根据各种信息，构造出是流程表单加载还是Bo开发平台加载,替换原来
        RequestParameters: {},

        // 所有跟后台交互，都通过Action_****
        // 加载
        Action_Load: "Load",
        // 加载表单标示
        LOADKEY: "Load",
        // 所有事件集合
        Actions: [],
        // 保存表单标示
        Action_Save: "Save",
        // 删除表单标示
        Aciton_Remove: "Remove",
        // 打印表单
        Action_Print: "Print",
        // 取消流程
        Action_CancelInstance: "CancelInstance",
        // 驳回
        Action_Reject: "Reject",
        // 提交
        Action_Submit: "Submit",
        // 取回流程
        Action_RetrieveInstance: "RetrieveInstance",
        // 结束流程
        Action_FinishInstance: "FinishInstance",
        // 查看流程实例
        Action_ViewInstance: "ViewInstance",
        // 转发
        Action_Forward: "Forward",
        // 关闭
        Action_Close: "Close",
        //提交中
        IsPosting: false,

        //表单是否加载完
        IsLoaded: false,

        // 审批节点类型
        WorkItemType: {
            // 普通工作项
            Fill: 0,
            // 审批节点
            Approve: 2
        },

        // 提交并添加
        SubmitAndAddAction: {
            Action: "SubmitAndAddAction", Icon: "icon-ok", Text: "提交并添加", OnActionDone: function (data) {
                if (data.Successful) {
                    if (window.parent.$.ListView != null && $.isFunction(window.parent.$.ListView.RefreshView)) {
                        window.parent.$.ListView.RefreshView();
                    }
                    var href = window.location.href;
                    href = href.replace("&mid=", "&mid=" + Math.round(Math.random() * 100, 0));
                    window.location.href = href;
                } else {
                    if (data.Errors != void 0 && data.Errors != null && data.Errors.length > 0) {
                        $.IShowError('错误', data.Errors[0]);
                    }
                }
                return false;
            }
        },

        // 表单数据类型
        SmartFormDataType: {
            /// 未指定
            Unspecified: 0,
            /// 流程数据
            Workflow: 1,
            /// 业务对象
            BizObject: 2
        },

        // 表单状态
        SmartFormMode: {
            // 未指定
            Unspecified: -1,
            // 编辑模式
            Edit: 0,
            // 查看模式
            View: 1,
            // 发起流程
            Create: 2,
            // 打印模式
            Print: 3
        },

        // 控件的逻辑类型
        SheetMode: {
            Unspecified: -1,
            Work: 1,
            View: 2,
            Originate: 3,
            Print: 4
        },

        //  表单状态
        BizObjectStatus: {
            /// 审批中
            Approving: 0,
            /// 审批通过
            Approved: 1,
            /// 审批不通过，这个类型不需要使用
            // Disapproved : 2,
            /// 被取消
            Canceled: 3
        }
    }
});

// 函数定义
jQuery.extend(
    $.SmartForm,
    {
        // 初始化
        // Error: 移动端参数需要打包传递
        Init: function (ResponseContext) {
            this.IsLoaded = false;

            // 是否调试状态
            if (ResponseContext.DebugTrack != null && ResponseContext.DebugTrack.DebugState == 0) {
                parent.$.IPushDebugTrack(ResponseContext, this, this.Run);
            }
            else {
                // 运行表单
                this.Run(ResponseContext);
            }
            this.IsLoaded = true;
        },

        // 运行
        Run: function (ResponseContext) {
            var that = this;
            that.ResponseContext = ResponseContext;
            that.RequestParameters = ResponseContext.RequestParameters;
            // 失败
            if (!ResponseContext.Successful) {

                // 提示错误信息
                for (var i = 0; i < ResponseContext.Errors.length; i++) {
                    $.IShowError('错误', ResponseContext.Errors[i]);

                }
                return;
            }
            // 输出Debug日志
            that.DebugLog(ResponseContext.DebugLogs);

            that.UpgradeHtml();

            // 渲染表单属性：动态、关联列表、任务
            that.RenderFormProperty(ResponseContext);
            that.IsPosting = false;

            // 移动端处理
            if (that.ResponseContext.IsMobile) {
                if (ResponseContext != null && ResponseContext.Actions != void 0) {
                    // 初始化Action集合
                    that.Actions = [];
                    for (var action in ResponseContext.Actions) {
                        that.Actions.push(ResponseContext.Actions[action]);
                    }
                }

                // 移动端去掉一行两列布局
                var $layouts = [];
                var $colsm6;
                if (ResponseContext.SheetView) {
                    $colsm6 = $(ResponseContext.SheetView).find(".col-sm-6");
                }
                else {
                    $colsm6 = $(".col-sm-6");
                }
                $colsm6.each(function () {
                    var $control = $(this).children(".sheet-control");
                    var $parent = $(this).parent();
                    $parent.before($control);
                    $layouts.push($parent);
                });
                for (var i = 0; i < $layouts.length; i++) {
                    $layouts[i].remove();
                }
            }
            // 加载所有的控件
            that.Load(ResponseContext);

            // 清空描述
            that.HideEmptyHeader();

            // 隐藏空的tab页签
            that.HideEmptyTab(ResponseContext);
        },

        // Html 升级
        UpgradeHtml: function () {
            // 1. 读取所有控件
            // 2. 控件标示修改：Sheet =》 Form
            // 3. 多行文本 =》 换控件
            // 4. 多人参与者 =》 多人控件

            var $sheet = "";
            if (this.ResponseContext.IsMobile) {
                $sheet = this.ResponseContext.SheetView;
            }
            else {
                $sheet = $("#SheetContent");
            }
            $sheet.find('.col-sm-6').addClass('col-xs-6 col-md-6');//兼容其他屏幕尺寸
            var rows = $sheet.find("div.sheet-control[data-controlkey^='Sheet']");
            for (var i = 0; i < rows.length; i++) {
                var $row = $(rows[i]);
                var controlkey = $row.attr("data-controlkey");
                controlkey = "Form" + controlkey.substring("sheet".length, controlkey.length);
                if (controlkey.toLocaleLowerCase() == "formtextbox") {
                    var isMultiple = $row.attr("data-IsMultiple");
                    if (isMultiple != null && (isMultiple.toLocaleLowerCase() == "true" || isMultiple == true)) {
                        controlkey = "FormTextArea";
                    }
                }
                else if (controlkey.toLocaleLowerCase() == "formuser") {
                    var isMultiple = $row.attr("data-IsMultiple");
                    if (isMultiple != null && (isMultiple.toLocaleLowerCase() == "true" || isMultiple == true)) {
                        controlkey = "FormMultiUser";
                    }
                }
                else if (controlkey.toLocaleLowerCase() == "formuser") {
                    var isCheckbox = $row.attr("data-isCheckbox");
                    if (isCheckbox != null && (isCheckbox.toLocaleLowerCase() == "true" || isCheckbox == true)) {
                        controlkey = "FormCheckbox";
                    }
                }
                $row.attr("data-controlkey", controlkey);
            }
        },

        // 绑定数据
        Load: function (ResponseContext) {
            var that = this;
            // 编码不存在
            if ($.isEmptyObject(ResponseContext.SchemaCode)) {
                $.IShowError(ResponseContext.Message);
                // Error: 调用this.Close();
                if (ResponseContext.IsMobile && H3Config.GlobalHistory) {
                    H3Config.GlobalHistory.goBack();
                }
                return;
            }

            // 设置从后台加载过来的数据
            this.ResponseContext = ResponseContext;

            // 判断元素类型，渲染成MvcControl
            if (this.ResponseContext.IsMobile) {
                $.ControlManager.ClearControls();
                this.ResponseContext.SheetView.find("div[data-controlkey]:not(.table_th)").each(function () {
                    // 初始化控件
                    $(this).JControl();
                });
            }
            else {
                // PC端
                $("div[data-controlkey]:not(.table_th)").each(function () {
                    //初始化控件
                    $(this).JControl();
                });
            }

            // 初始化工具栏
            this.InitToolBar();

            if (this.ResponseContext.IsMobile) {
                // 审批控件且有审批意见
                if (!this.ResponseContext.IsCreateMode && this.ResponseContext.InstanceId) {
                    //审批环节,需要添加审批控件  
                    var $CommentControl = $("<div class='row sheet-control form-group'>").attr({
                        "data-DataField": "Comments",
                        "data-controlkey": "FormComment",
                        "data-DisplayName": "审批"
                    });//.addClass("row sheet-control form-group");
                    if (this.ResponseContext.SheetView) {
                        $(this.ResponseContext.SheetView).find(".sheetcontentdiv").prepend($CommentControl);
                    }
                    else {
                        $(".sheetcontentdiv:last").prepend($CommentControl);
                    }
                    this.CommentManager = $CommentControl.FormComment(this.ResponseContext.Comments);
                }
            } else {
                // 审批控件且有审批意见
                if (this.ResponseContext.WorkItemType == 2 || (!$.isEmptyObject(this.ResponseContext.Comments) && this.ResponseContext.Comments.length > 0)) {
                    //审批环节,需要添加审批控件  
                    var $CommentControl = $("<div class='row sheet-control form-group'>").attr({
                        "data-DataField": "Comments",
                        "data-controlkey": "FormComment",
                        "data-DisplayName": "审批"
                    });//.addClass("row sheet-control form-group");
                    $("#SheetContent").append($CommentControl);
                    this.CommentManager = $CommentControl.FormComment(this.ResponseContext.Comments);
                }
            }


            // 调用自定义加载事件
            $.JForm._OnLoad(this);
        },

        // 渲染表单属性，动态，任务，关联列表
        RenderFormProperty: function (ResponseContext) {
            if (this.ResponseContext.IsMobile || ResponseContext.IsCreateMode || ResponseContext.BizObjectStatus == this.BizObjectStatus.Approving) return;

            var $newTabs = [];
            var tabNames = [];
            if (ResponseContext.EnableFormSns) {
                var $snsTab = $("<div class='tab-pane'>")/*.addClass("tab-pane")*/.append($("<div data-controlkey='FormSns' class='row sheet-control SheetSns'>")/*.addClass("row sheet-control SheetSns")*/);
                $newTabs.push($snsTab);
                tabNames.push("动态");
            }
            if (ResponseContext.EnableTask) {
                var $taskTab = $('<div class="tab-pane">').append($('<div data-controlkey="FormTaskTips" class="row sheet-control SheetTaskTips">'));
                $newTabs.push($taskTab);
                tabNames.push("任务提醒 ");
            }

            if (!$.isEmptyObject(ResponseContext.AssociationLists)) {
                for (var code in ResponseContext.AssociationLists) {
                    var $boListTab = $("<div class='tab-pane'>");//.addClass("tab-pane");
                    var $boList = $("<div data-controlkey='FormBoList' class='row sheet-control SheetBoList'>")/*.addClass("row sheet-control SheetBoList")*/.attr("data-BOSchemaCode", code);
                    $boListTab.append($boList);
                    $newTabs.push($boListTab);
                    tabNames.push(ResponseContext.AssociationLists[code]);
                }
            }


            if ($newTabs.length > 0 && !this.ResponseContext.IsMobile) {
                var $tabs = $("<ul class='nav nav-tabs'>");//.addClass("nav nav-tabs");
                var $tabcontent = $("<div class='tab-content'>");//.addClass("tab-content");

                var tabId = $.IGuid();
                var $li = $("<li class='active'>");
                var $a = $('<a href="#' + tabId + '" data-toggle="tab" aria-expanded="true"><strong>' + ResponseContext.DisplayName + '信息</strong></a>')
                var $sheetTab = $("<div id='" + tabId + "' class='tab-pane active'>")/*.addClass("tab-pane active")*/.html($("#SheetContent").html());

                $tabs.append($li.append($a));
                $tabcontent.append($sheetTab);

                for (var i = 0; i < $newTabs.length; i++) {
                    var tabId = $.IGuid();
                    var $li = $("<li>");
                    var $a = $('<a href="#' + tabId + '" data-toggle="tab" aria-expanded="true"><strong>' + tabNames[i] + '</strong></a>')
                    $tabs.append($li.append($a));
                    $tabcontent.append($newTabs[i].attr("id", tabId));
                }

                $("#SheetContent").html("").append($("<div class='nav-tabs-wrap'></div>").append($tabs)).append($tabcontent);//edit by xc
            }
        },

        // 隐藏空的tab页签
        HideEmptyTab: function (ResponseContext) {
            var that = this;
            var isCreateMode = ResponseContext.IsCreateMode;
            var isApproving = ResponseContext.BizObjectStatus == this.BizObjectStatus.Approving;
            if (isCreateMode || isApproving) {
                var tabpanels;
                if (ResponseContext.SheetView) {
                    tabpanels = $(ResponseContext.SheetView).find("#tabContent>.tab-pane");
                }
                else {
                    tabpanels = $("#tabContent>.tab-pane");
                }

                if (tabpanels == null || tabpanels.length == 0) return;

                var $sheetTabpanel;
                for (var ti = 0, tlen = tabpanels.length; ti < tlen; ti++) {
                    var $tabpanel = $(tabpanels[ti]);
                    var controls = $tabpanel.children();
                    var needHide = true;
                    for (var ci = 0, clen = controls.length; ci < clen; ci++) {
                        var $control = $(controls[ci]);
                        var controlKey = $control.attr("data-controlkey");
                        var visiable = false;
                        // 一行两列布局控件
                        if (!controlKey) {
                            $control.find(".sheet-control").each(function () {
                                if ($(this).css("display") != "none") {
                                    visiable = true;
                                }
                            });
                        }
                        else {
                            visiable = $control.css("display") != "none";
                        }

                        // 审批中时，把只含关联列表、隐藏控件的标签隐藏起来
                        if (isCreateMode && controlKey != "SheetBoList" && controlKey != "SheetSns" && visiable
                            || !isCreateMode && isApproving && controlKey != "SheetBoList" && visiable) {
                            needHide = false;
                            break;
                        }
                    }
                    if (needHide) {
                        $tabpanel.hide();
                        if (ResponseContext.SheetView) {
                            $(ResponseContext.SheetView).find("#navTabs").find("li[data-panelid='" + $tabpanel.attr("id") + "']").hide();
                        }
                        else {
                            $("#navTabs").find("li[data-panelid='" + $tabpanel.attr("id") + "']").hide();
                        }
                    }
                    else {
                        if (!$sheetTabpanel) {
                            $sheetTabpanel = $tabpanel;
                        }
                    }
                }
            }
            // 只有一个可见的navTab时，将其隐藏
            var $visibleTabs;
            if (ResponseContext.SheetView) {
                $visibleTabs = $(ResponseContext.SheetView).find("#navTabs>li:visible");
            }
            else {
                $visibleTabs = $("#navTabs>li:visible");
            }
            if ($visibleTabs.length == 1) {
                $visibleTabs.hide();
            }

            // Panel都不显示时，将包含表单内容的Panel显示出来
            var $visiblePanel;
            if (ResponseContext.SheetView) {
                $visiblePanel = $(ResponseContext.SheetView).find("#tabContent>.tab-pane:visible");
            }
            else {
                $visiblePanel = $("#tabContent>.tab-pane:visible");
            }
            if ($visiblePanel.length == 0) {
            }
        },

        // 清空描述
        HideEmptyHeader: function () {
            //确定哪些describle显示
            //显示所有描述
            var $headerDescribles, $headerTitles;
            if (this.ResponseContext.SheetView) {//移动端
                $headerDescribles = $(this.ResponseContext.SheetView).find(".page-header.page-describle");
                $headerTitles = $(this.ResponseContext.SheetView).find(".page-header").not(".page-describle");
            } else {//pc端
                $headerDescribles = $(".page-header.page-describle");
                $headerTitles = $(".page-header").not(".page-describle");

            }
            $headerDescribles.css({ "display": "block" });

            for (var i = 0; i < $headerTitles.length; i++) {
                var isEmpty = true;
                var $headerTitle = $($headerTitles[i]);
                var $nextControl = $headerTitle.next();
                //var $nextControlIsDescrible = $nextControl.hasClass("page-header") && $nextControl.hasClass("page-describle");
                //var $nextControlIsTitle = $nextControl.hasClass("page-header") && !$nextControl.hasClass("page-describle");
                var $nextControlIsDescrible = false;
                var $nextControlIsTitle = false
                var $nextControlIsDisplay = $nextControl.css("display") != "none";

                //如果当前标题后面的控件不显示则直接隐藏当前标题
                if (!$nextControlIsDisplay) {
                    $headerTitle.css({ "display": "none" });
                    continue;
                }
                while ($nextControl.length > 0) {
                    $nextControlIsDescrible = $nextControl.hasClass("page-header") && $nextControl.hasClass("page-describle");
                    $nextControlIsTitle = $nextControl.hasClass("page-header") && !$nextControl.hasClass("page-describle");
                    $nextControlIsDisplay = $nextControl.css("display") != "none";

                    if ($nextControlIsDescrible && $nextControlIsDisplay) {
                        isEmpty = false;
                        break;
                    }
                    if ($nextControlIsTitle) break;
                    var controlKey = $nextControl.attr("data-controlKey");
                    if (!controlKey) {
                        $nextControl.find(".sheet-control").each(function () {
                            if ($(this).css("display") != "none") {
                                isEmpty = false;
                                return false;
                            }
                        });
                    } else {
                        if (controlKey != "FormComment") {
                            //isEmpty = $nextControl.css("display") == "none";
                            if ($nextControl.css("display") != "none") {
                                isEmpty = false;
                                break;
                            }
                        }
                    }
                    $nextControl = $nextControl.next();
                }
                if (isEmpty) {
                    $headerTitle.css({ "display": "none" });
                }
            }
        },

        // 开放给开发者的接口:校验
        ValidateAction: function (ActionControl) {
            if ($.JForm._OnValidate(this, ActionControl)) {
                return $.ControlManager.Validate(ActionControl);
            }
            else {
                return false;
            }
        },

        // 初始化工具栏  
        InitToolBar: function () {
            //添加默认的操作
            if (this.Actions && this.Actions.length == 0) {
                this.AddDefaultActions();
            }

            // 调用自定义按钮
            $.JForm._OnLoadActions(this, this.Actions);

            // 移动端不直接显示工具栏
            if (this.ResponseContext && !this.ResponseContext.IsMobile) {
                $("ul[data-sheettoolbar='true']").FormToolBar(this.Actions);
            } else {
                //显示更多按钮逻辑
            }
        },

        // 执行动作: {Action:"方法名称",Datas:[{数据项1},{数据项2}]}
        OnAction: function (actionControl) {
            //执行动作标示
            var actionName = actionControl.Action;
            //参数：[{数据项1},{数据项2},...]或["#ID1"，"#ID2",...]或["数据1","数据2"]或混合
            var datas = actionControl.Datas;
            if (actionName != "Remove") {
                if (!$.JForm._OnValidate(this, actionControl)) {
                    return false;
                }
            }
            //构造数据项的值
            var CommandParams = {
                Command: actionName
            };
            var params = [];
            if (typeof (actionControl.LoadControlValue) == "undefined" || actionControl.LoadControlValue) {
                if (datas) {
                    for (var i = 0; i < datas.length; i++) {
                        if (datas[i].toString().indexOf("{") == 0) {
                            var key = datas[i].replace("{", "").replace("}", "");
                            params.push($.ControlManager.GetControlValue(key));
                        }
                        else if (datas[i].toString().indexOf("#") == 0) {
                            var key = datas[i].replace("#");
                            params.push($.ControlManager.GetControlValue(datas[i]));
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
            CommandParams["PostValue"] = JSON.stringify(this.GetPostValue(this.actionName));

            var that = this;
            //提交到后台执行
            this.PostForm(actionName,
                    CommandParams,
                    function (data) {
                        that.ResultHandler.apply(that, [actionControl, data]);
                        if (actionControl.CloseAfterAction) {
                            this.ClosePage();
                        }
                    }
            );
        },

        // Error: 交互提示
        ConfirmAction: function (message, doneCallback) {

            // 判断是否移动端
            if (this.ResponseContext.IsMobile) {
                if (H3Config.GlobalIonicPopup) {
                    var confirmPopup = H3Config.GlobalIonicPopup.confirm({
                        template: message,
                        title: '操作',
                        cancelText: '取消',
                        okText: '确定'
                    });
                    confirmPopup.then(function (res) {
                        if (res) {
                            doneCallback();
                        }
                    });
                }
            }

            else {
                $.IConfirm("", message, function (isTrue) {
                    if (isTrue) {
                        doneCallback.call();
                    }
                });
            }
        },

        // 保存
        Save: function (actionControl) {
            if (!this.ValidateAction(actionControl)) return false;
            var SheetPostValue = this.GetPostValue(this.Action_Save);
            var that = this;
            if (that.IsPosting) return;
            this.IsPosting = true;

            $.IShowPreLoader('提交中');
            this.PostForm(this.Action_Save,
                { PostValue: JSON.stringify(SheetPostValue) },
                function (data) {
                    $.IHidePreLoader();
                    that.ResultHandler.apply(that, [actionControl, data]);
                });
        },

        // 删除
        Remove: function (actionControl) {
            //移动端标识，是否是提交类型的操作，不缓存当前表单
            if (typeof (MobileCacheManager) != 'undefined') {
                MobileCacheManager.CurMobileFormObj.IsSubmit = true;
            }
            var that = this;
            $.IConfirm("确定删除?", "", function (isConfirm) {
                if (isConfirm) {
                    $.IShowPreLoader('提交中');
                    var SheetPostValue = that.GetPostValue(that.Aciton_Remove);
                    that.PostForm(that.Aciton_Remove,
                    { PostValue: JSON.stringify(SheetPostValue) },
                    function (data) {
                        $.IHidePreLoader();
                        that.ResultHandler.apply(that, [actionControl, data]);
                    });
                }
            });
        },

        // 转发
        Forward: function (actionControl) {
            if (!this.ForwardModal) {
                var $divForward = $("#divForward").show();
                var $participant = $divForward.find("#forwardParticipant");
                var $comment = $divForward.find('#forwardComment');
                var sheetUserMgr = $participant.FormUser();
                $participant.removeClass("form-group");

                var that = this;
                var Actions = [{
                    Key: "btn_Ok",
                    Text: "确定",
                    Theme: 'btn_ok',
                    CallBack: function () {
                        var participants = sheetUserMgr.GetUnitIDs();
                        if (!participants || participants.length == 0) {
                            $.IShowError("提示", "请选择转发人");
                            return;
                        }
                        var comment = $comment.val();
                        

                        var SheetPostValue = that.GetPostValue(that.Action_Forward);
                        SheetPostValue.ForwardTo = participants[0];
                        if (comment) {
                            SheetPostValue.Comment = {
                                CommentId: $.IGuid(),
                                Text: comment,
                                IsNewComment:true
                            };
                        }
                        that.PostForm(that.Action_Forward,
                        { PostValue: JSON.stringify(SheetPostValue) },
                        function (data) {
                            that.ResultHandler.apply(that, [actionControl, data]);
                        });
                    }
                },
             {
                 Text: '取消',
                 Theme: 'btn_cancel',
                 CallBack: function () {
                     that.ForwardModal.hide();

                 }
             }];

                this.ForwardModal = $.IModal({
                    Title: '转发',
                    Width: 500,
                    Height: 200,
                    ShowBack: true,
                    HasIframe: false,
                    Content: $divForward,
                    ToolButtons: Actions,
                    ContentUrl: ''
                });
            }
            else {
                this.ForwardModal.show();
            }
        },

        // 提交
        Submit: function (actionControl, text, destActivity, postValue, groupValue) {
            var that = this;
            //if (that.IsPosting) return;
            if (that.IsPosting) {
                //$.IShowWarn('','正在努力提交中...');
                return;
            }
            //移动端标识，是否是提交类型的操作，不缓存当前表单
            if (typeof (MobileCacheManager) != 'undefined') {
                MobileCacheManager.CurMobileFormObj.IsSubmit = true;
            }
            if (actionControl.Text != "已阅" && !this.ValidateAction(actionControl)) {
                if (this.ResponseContext.IsMobile) {
                    MobileCacheManager.CurMobileFormObj.Submitting = false;
                }
                return false;
            }
            $.IShowPreLoader('提交中');
            this.IsPosting = true;
            var SheetPostValue = that.GetPostValue(that.Action_Submit, destActivity, postValue, groupValue);
            if (this.ResponseContext.IsMobile) {
                if (text) {
                    var result = {
                        CommentId: $.IGuid(),
                        Text: text,
                        IsNewComment: true
                    };
                    SheetPostValue.Comment = result;
                } else {
                    var result = {
                        CommentId: $.IGuid(),
                        Text: '',
                        IsNewComment: true
                    };
                    SheetPostValue.Comment = result;
                }
            }

            that.PostForm(that.Action_Submit,
                { PostValue: JSON.stringify(SheetPostValue) },
                function (data) {
                    $.IHidePreLoader();
                    // 从关联查询跳转到非流程表单中新增关联对象，在提交后，将值反写回去
                    var sheetQueryField = $.IQuery("SheetQueryField");
                    if (sheetQueryField && that.ResponseContext.FormDataType == that.SmartFormDataType.BizObject) {
                        var rowId = $.IQuery("SheetQueryRowId");
                        if (window.parent != window && window.parent.$.SmartForm) {
                            window.parent.$.SmartForm.WritebackSheetQuery(rowId, sheetQueryField, data.BizObjectId, data.InstanceName);
                        }
                    }
                    that.ResultHandler.apply(that, [actionControl, data]);
                });

            return true;
        },

        // 关联查询新增，返写回界面
        WritebackSheetQuery: function (rowId, fieldName, ObjectId, displayName) {
            var $element;
            if (rowId) {
                $element = $("tr[data-ObjectId='" + rowId + "']").find("[data-datafield='" + fieldName + "']").not('.table_th');
            }
            else {
                $element = $("[data-datafield='" + fieldName + "']").not('.table_th');
            }
            if ($element.length > 0) {
                var controlManager = $element.JControl();
                if (controlManager) {
                    controlManager.SetValue({ ObjectId: ObjectId, Name: displayName });
                    controlManager._refreshTable();
                }
            }
        },

        // 驳回
        Reject: function (actionControl, destActivity, text) {
            if (!$.JForm._OnValidate(this, actionControl)) {
                return false;
            }

            var SheetPostValue = this.GetPostValue(this.Action_Reject, destActivity);
            if (this.ResponseContext.IsMobile) {
                if (text) {
                    var result = {
                        CommentId: $.IGuid(),
                        Text: text,
                        IsNewComment: true
                    };
                    SheetPostValue.Comment = result;
                } else {
                    var result = {
                        CommentId: $.IGuid(),
                        Text: '',
                        IsNewComment: true
                    };
                    SheetPostValue.Comment = result;
                }
            }
            var that = this;
            this.PostForm(that.Action_Reject,
                { PostValue: JSON.stringify(SheetPostValue) },
                function (data) {
                    that.ResultHandler.apply(that, [actionControl, data]);
                });
        },

        //结束流程
        FinishInstance: function (actionControl) {
            IsSubmit = true;
            var SheetPostValue = this.GetPostValue(this.Action_FinishInstance);
            var that = this;
            this.PostForm(that.Action_FinishInstance,
            { PostValue: JSON.stringify(SheetPostValue) },
            function (data) {
                that.ResultHandler.apply(that, [actionControl, data]);
            });
        },

        // 取回流程
        RetrieveInstance: function (actionControl) {
            var that = this;
            this.PostForm(this.Action_RetrieveInstance,
                {},
                function (data) {
                    that.ResultHandler.apply(that, [actionControl, data]);
                });
        },

        // 获取Mvc表单传给后台的数据
        GetPostValue: function (actionName, destActivity, postValue, groupValue) {
            var SheetPostValue = {
                Command: actionName,
                DestActivityCode: destActivity,
                InstanceName: "",
                Data: {},//当前表单的数据项集合值
                Comment: {}
            };

            if (actionName == this.Aciton_Remove || actionName == this.Action_Forward) {
                return SheetPostValue;
            }
            SheetPostValue.Data = $.ControlManager.SaveSheetData();
            //区分移动端和pc端
            if (this.ResponseContext.IsMobile) { }
            else {
                if (this.CommentManager) {
                    SheetPostValue.Comment = this.CommentManager.SaveDataField();
                    if (SheetPostValue.Comment.Text == null || SheetPostValue.Comment.Text == "") {
                        if (actionName == "Submit") {
                            var result = {
                                CommentId: $.IGuid(),
                                Text: "同意",
                                IsNewComment: true
                            };
                            SheetPostValue.Comment = result;
                        } else if (actionName == "Reject") {
                            var result = {
                                CommentId: $.IGuid(),
                                Text: "不同意",
                                IsNewComment: true
                            };
                            SheetPostValue.Comment = result;
                        }
                    }
                }
            }

            SheetPostValue.Priority = $.ControlManager.Priority;
            SheetPostValue.HiddenFields = $.ControlManager.HiddenFields;
            return SheetPostValue;
        },

        // 回调函数处理
        ResultHandler: function (actionControl, data) {
            if (actionControl.OnActionDone) {
                if (!actionControl.OnActionDone.apply(actionControl, [data])) {
                    return;
                }
            }
            if (data.Successful) {

                if (data.ClosePage) {
                    // TODO:关闭当前页面，并且刷新父页面
                    this.ClosePage();
                }
                else if (data.Url) {
                    if (window.parent.$.ListView != null && $.isFunction(window.parent.$.ListView.RefreshView)) {
                        window.parent.$.ListView.RefreshView();
                    }
                    window.location.href = data.Url;
                }
                else if (data.Refresh) {
                    if (data.Message) {
                        $.IShowSuccess(data.Message);
                    }
                    var href = window.location.href;
                    href = href.replace("&mid=", "&mid=" + Math.round(Math.random() * 100, 0));
                    window.location.href = href;
                }
            }
            else {
                //Error:错误提示方式需要修改
                if (data.Errors) {
                    for (var i = 0; i < data.Errors.length; i++) {
                        $.IShowError('提示', data.Errors[i]);
                    }
                }

                this.IsPosting = false;
            }
        },

        // 关闭页面
        ClosePage: function (data) {
            //判断是否是移动端
            if (this.ResponseContext.IsMobile && H3Config.GlobalHistory) {
                //判断是否通过消息传过来的 
                if (H3Config.messageType) {
                    MessageProcessed();
                } else {
                    H3Config.GlobalHistory.goBack();
                }
            } else {
                if (window.parent.frames.length > 0) {
                    window.opener = null;
                    if (data != void 0 && data != null && data.Action == "Close") {
                    }
                    else {
                        if (window.parent.$.ListView != null && $.isFunction(window.parent.$.ListView.RefreshView)) {
                            window.parent.$.ListView.RefreshView();
                        }
                        else if ($.isFunction(window.parent.RefreshView)) {
                            window.parent.RefreshView.call();
                        }
                    }
                    window.parent.$.ISideModal.Close();
                    //top.location.reload(true);
                    return;

                }
                if (navigator.userAgent.indexOf("MSIE") > 0) {
                    if (navigator.userAgent.indexOf("MSIE 6.0") > 0) {
                        window.opener = null; window.close();
                    }
                    else {
                        window.open('', '_top'); window.top.close();
                    }
                }
                else if (navigator.userAgent.indexOf("Firefox") > 0) {
                    window.location.href = 'about:blank ';
                    //window.history.go(-2);  
                }
                else {
                    window.opener = null;
                    window.open('', '_self', '');
                    window.close();
                }
            }

        },

        // 添加默认的事件
        AddDefaultActions: function () {
            if (!this.ResponseContext || $.isEmptyObject(this.ResponseContext.Actions)) return;

            for (var key in this.ResponseContext.Actions) {
                //新建流程不应该有查看流程按钮
                if (this.ResponseContext.IsCreateMode
                    && this.ResponseContext.Actions[this.Action_Submit]) {
                    if (this.ResponseContext.Actions[key].Action == "ViewInstance") {
                        continue;
                    }
                }

                this.Actions.push(this.ResponseContext.Actions[key]);

                if (key == this.Action_Submit
                    && this.ResponseContext.IsCreateMode
                    && !this.ResponseContext.IsMobile
                    && $.isEmptyObject(this.ResponseContext.WorkflowCode)) {
                    this.Actions.push(this.SubmitAndAddAction);
                }
            }
        },

        // 显示调试信息
        DebugLog: function (logs) {
            if (logs != null) {
                for (var i = 0; i < logs.length; i++) {
                    console.log(logs[i]);
                }
            }
        },

        //当使用POST方式时，浏览器把各表单字段元素及其数据作为HTTP消息的实体内容发送给Web服务器，
        //而不是作为URL地址的参数进行传递，使用POST方式传递的数据量要比使用GET方式传送的数据量大的多
        PostForm: function (action, data, callback, errorhandler, async) {
            var that = this;
            if (data.PostValue) {
                var PostValue = JSON.parse(data.PostValue);
                var beforSubmitResult = $.JForm._BeforeSubmit(this, action, PostValue);
                if (typeof (beforSubmitResult) != "undefined" && !beforSubmitResult) {
                    return;
                }
                data.PostValue = JSON.stringify(PostValue);
            }

            var paramData = $.extend({ Command: action }, data, this.RequestParameters);
            $.ajax({
                type: "POST",
                url: this.AjaxUrl,
                data: paramData,
                dataType: "json",
                async: async == null ? true : async,
                success: function (data) {
                    that.DebugLog(data.DebugLogs);
                    var handle = function (data) {
                        $.JForm._AfterSubmit(that, action, data);
                        if ($.isFunction(callback))
                            callback.apply(this, [data]);
                    };

                    if (data.DebugTrack != null && data.DebugTrack.DebugState == 0) {
                        parent.$.IPushDebugTrack(data, that, handle);
                    }
                    else {

                        handle(data);
                    }
                },
                error: errorhandler,
                complete: function () {
                    // that.IsPosting = false;//重置提交状态

                }
            });
        }
    });


//封装自定义代码扩展接口
jQuery.extend({
    JForm: {
        // 已经初始化
        _isInitialization: false,
        _Init: function (form) {
            if (this._isInitialization) return;
            // 把所有控件转为 this.DataField的模式,如  this.F****.SetValue();
            for (var key in $.ControlManager.Controls) {
                if ($.ControlManager.Controls[key].DataField != null && $.ControlManager.Controls[key].DataField.toString().indexOf(".") < 0) {
                    this[$.ControlManager.Controls[key].DataField] = $.ControlManager.Controls[key];
                }
            }
            this._isInitialization = true;
            //var inp = null;
            //var inputs = $('input[type="text"]');
            //for (var i = 0, len = inputs.length; i < len; i++) {
            //    inputs[i].addEventListener('focus', function () {
            //        inp = this;
            //    }, false);
            //}
            //window.onresize = function () {
            //    var inpPos = inp.getBoundingClientRect();
            //    if (inpPos.bottom > window.innerHeight) {
            //        inp.scrollIntoView();
            //    }
            //};
        },

        // 表单加载
        _OnLoad: function (form) {
            if ($.isFunction($.JForm.OnLoad)) {
                this._Init(form);
                $.JForm.OnLoad();
            }
        },

        // 加载菜单
        _OnLoadActions: function (form, actions) {
            if ($.isFunction($.JForm.OnLoadActions)) {
                this._Init(form);
                $.JForm.OnLoadActions(actions);
            }
        },

        // 表单校验
        _OnValidate: function (Form, ActionControl) {
            if ($.isFunction($.JForm.OnValidate)) {
                this._Init(Form);
                return $.JForm.OnValidate(ActionControl);
            }
            return true;
        },

        // 提交前事件
        _BeforeSubmit: function (Form, action, postValue) {
            if ($.isFunction($.JForm.BeforeSubmit)) {
                this._Init(Form);
                return $.JForm.BeforeSubmit(action, postValue);
            }
        },

        // 提交后事件
        _AfterSubmit: function (Form, action, postValue) {
            if ($.isFunction($.JForm.AfterSubmit)) {
                this._Init(Form);
                return $.JForm.AfterSubmit(action, postValue);
            }
        },

        // 清理所有自定义事件
        CleanEvents: function () {
            this.OnLoad = null;
            this.OnLoadActions = null;
            this.OnValidate = null;
            this._isInitialization = false;
        }
    }
});