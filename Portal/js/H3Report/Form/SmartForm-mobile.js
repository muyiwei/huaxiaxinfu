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
                // Error:只是移动端吗？封装 $.IShowError???
                if (H3Config.messageType) {
                    var $myAlert = H3Config.GlobalIonicPopup.alert({
                        title: '提示',
                        template: '消息已处理或内容已被删除',
                        okText: "确认"
                    });
                    $myAlert.then(function (res) {
                        dd.biz.navigation.close({
                            onSuccess: function (result) { },
                            onFail: function (err) { }
                        });
                    });
                }

                // 提示错误信息
                for (var i = 0; i < ResponseContext.Errors.length; i++) {
                    $.IShowError('错误', ResponseContext.Errors[i]);
                    H3Config.GlobalHistory.goBack();
                }
                return;
            }
            // 输出Debug日志
            that.DebugLog(ResponseContext.DebugLogs);

            that.UpgradeHtml();

            
            
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
            if (!ResponseContext.SchemaCode) {
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
            $.ControlManager.ClearControls();
            this.ResponseContext.SheetView.find("div[data-controlkey]:not(.table_th)").each(function () {
                // 初始化控件
                $(this).JControl();
            });

            // 初始化工具栏
            this.InitToolBar();
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

            // 调用自定义加载事件
            $.JForm._OnLoad(this);
        },

        // 清空描述
        HideEmptyHeader: function () {
            //确定哪些describle显示
            //显示所有描述
            var $headerDescribles, $headerTitles;
            $headerDescribles = $(this.ResponseContext.SheetView).find(".page-header.page-describle");
            $headerTitles = $(this.ResponseContext.SheetView).find(".page-header").not(".page-describle");
            $headerDescribles.css({ "display": "block" });

            for (var i = 0; i < $headerTitles.length; i++) {
                var isEmpty = true;
                var $headerTitle = $($headerTitles[i]);
                var $nextControl = $headerTitle.next();
             
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
            var CommandParams = { Command: actionName };
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

        
        ConfirmAction: function (message, doneCallback) {
            $.IConfirm("", message, function (isTrue) {
                if (isTrue) {
                    doneCallback.call();
                }
            });
        },

        // 保存
        Save: function (actionControl) {
            //移动端标识，是否是提交类型的操作，不缓存当前表单
            if (typeof (MobileCacheManager) != 'undefined') {
                MobileCacheManager.CurMobileFormObj.IsSubmit = true;
            }
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
                    //不通过时候将IsSubmit重置，不然beforeLeave的时候不会缓存表单
                    MobileCacheManager.CurMobileFormObj.IsSubmit = false;
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
                  
                    that.ResultHandler.apply(that, [actionControl, data]);
                });

            return true;
        },

        // 驳回
        Reject: function (actionControl, destActivity,text) {
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
                if (this.ResponseContext.IsMobile) {
                    //钉钉埋点
                    H3Config.ddut("提交表单");
                    // 消息或单页面应用提交后关闭应用
                    if ((H3Config.messageType) || H3Config.menuCode) {
                        if (H3Config.GlobalHistory.$ionicHistory) {
                            var backView = H3Config.GlobalHistory.backView();
                            if (backView && backView.stateName == "app.sheetquery") {
                                H3Config.CurScope.$emit("SheetQuery:Change");
                                H3Config.GlobalHistory.goBack();
                                MobileCacheManager.CurMobileFormObj.Submitting = false;
                                $(MobileCacheManager.ClickObj).attr('disabled', false);
                                MobileCacheManager.ClickObj = null;
                                this.IsPosting = false;
                            }
                            else if (backView && (backView.stateName == "app.menus" || backView.stateName == "app.custommenus")) {
                                // 表单提交返回时刷新列表
                                H3Config.CurScope.$emit("AppMenuList:Change");
                                H3Config.CurScope.$emit("Changed:Workflow");
                                H3Config.CurScope.$emit("ChangedAppHome:Workflow");
                                H3Config.GlobalHistory.goBack();
                                MobileCacheManager.CurMobileFormObj.Submitting = false;
                                $(MobileCacheManager.ClickObj).attr('disabled', false);
                                MobileCacheManager.ClickObj = null;
                                this.IsPosting = false;
                            }
                            else {
                                dd.biz.navigation.close({
                                    onSuccess: function (result) {
                                        /*result结构 {} */
                                    },
                                    onFail: function (err) { }
                                });
                            }
                        } else {
                            dd.biz.navigation.close({
                                onSuccess: function (result) {
                                    /*result结构 {} */
                                },
                                onFail: function (err) { }
                            });
                        }
                    }
                    //正常表单提交
                    else {
                        //如果是多webview模式
                        if (H3Config.CurScope.Multiple) {
                            MobileCacheManager.CurMobileFormObj.Submitting = false;
                            $(MobileCacheManager.ClickObj).attr('disabled', false);
                            MobileCacheManager.ClickObj = null;
                            this.IsPosting = false;
                            $('ion-nav-view[name="menu-content"]').empty();
                            dd.ui.nav.close();
                            return;
                        }
                        if (H3Config.GlobalHistory) {
                            var backView = H3Config.GlobalHistory.backView();
                            var currentView = H3Config.GlobalHistory.currentView();
                            if (H3Config.CurScope.Level) {
                                H3Config.CurScope.$emit("AppMenu:listChanged");
                                H3Config.GlobalHistory.goBack(-2);
                            } else {
                                //
                                if (backView) {
                                    switch (backView.stateName)
                                    {
                                        case "app.menus":
                                        case "app.custommenus":
                                            // 表单提交返回时刷新列表
                                            H3Config.CurScope.$emit("AppMenuList:Change");
                                            H3Config.CurScope.$emit("Changed:Workflow");
                                            H3Config.CurScope.$emit("ChangedAppHome:Workflow");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.apphome":
                                            //单应用首页，更新待办任务总数
                                            H3Config.CurScope.$emit("ChangedAppHome:Workflow");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.applist":
                                        case "app.home":
                                            //直接打开表单
                                            H3Config.CurScope.$emit("ChangedAppList:Workflow");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.sheethome":
                                            H3Config.CurScope.$emit("SheetHomeList:Change", { stateName: 'app.sheethome', schemaCode: this.ResponseContext.SchemaCode });
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.myworkflow":
                                            //流程中心
                                            H3Config.CurScope.$emit("Changed:Workflow");
                                            H3Config.CurScope.$emit("ChangedAppHome:Workflow");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.sheetquery":
                                            H3Config.CurScope.$emit("SheetQuery:Change");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.sheetbolist":
                                            //关联列表新增后返回
                                            H3Config.CurScope.$emit("SheetBoList:Change");
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                        case "app.index":
                                            {
                                                //秒开返回的逻辑
                                            }
                                        default:
                                            H3Config.GlobalHistory.goBack();
                                            break;
                                    }
                                }
                            }
                            MobileCacheManager.CurMobileFormObj.Submitting = false;
                            $(MobileCacheManager.ClickObj).attr('disabled', false);
                            MobileCacheManager.ClickObj = null;
                            this.IsPosting = false;
                        }
                    }
                    return;
                }
               
            }
            else {
                //Error:错误提示方式需要修改
                if (data.Errors) {
                    for (var i = 0; i < data.Errors.length; i++) {
                        $.IShowError('提示', data.Errors[i]);
                    }
                }
                if (typeof (MobileCacheManager) != 'undefined') {
                    MobileCacheManager.CurMobileFormObj.Submitting = false;
                }
                this.IsPosting = false;
            }
        },

        // 关闭页面
        ClosePage: function () {
            //判断是否是移动端
            if (this.ResponseContext.IsMobile && H3Config.GlobalHistory) {
                //判断是否通过消息传过来的 
                if (H3Config.messageType) {
                    MessageProcessed();
                } else {
                    H3Config.GlobalHistory.goBack();
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