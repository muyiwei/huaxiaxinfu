//工具栏
//构造SheetToolBar，需要根据表单数据，构造需要的按钮
(function () {
    $.fn.SheetToolBar = function () {
        return $.MvcSheetUI.Run.call(this, "SheetToolBar", arguments);
    };

    $.MvcSheetUI.Controls.SheetToolBar = function (element, args, sheetInfo) {
        this.Element = element;
        this.SheetInfo = sheetInfo;
        this.ControlManagers = {};

        for (var i in args) {
            this.AddButton(args[i]);
        }
        return this;
    };

    $.MvcSheetUI.Controls.SheetToolBar.prototype = {
        AddButton: function (option) {
            if (option) {
                var key = option.Action || option.Text;
                if (key == undefined) return;
                if (this.ControlManagers[key]) return this.ControlManagers[key];
                if ($.MvcSheetToolbar[option.Action]) {
                    this.ControlManagers[option.Action] = new $.MvcSheetToolbar[option.Action](this.Element, option, this.SheetInfo);
                } else {
                    this.ControlManagers[key] = new $.MvcSheetToolbar.IButton(this.Element, option, this.SheetInfo);
                }
            }
        }
    };
})(jQuery);

//#region 按钮基类
$.MvcSheetToolbar = {};
$.MvcSheetToolbar.IButton = function (element, args, sheetInfo) {
    //this.Action = args.Action;
    //this.Icon = args.Icon;
    //this.Text = args.Text;
    for (var key in args) {
        this[key] = args[key];
    }
    this.ColumnCss = "> .col-md-1,> .col-md-2,> .col-md-3,> .col-md-4,> .col-md-5,> .col-md-6,> .col-md-7,> .col-md-8,> .col-md-9,> .col-md-10,> .col-md-11,> .col-md-12";
    this.CloseAfterAction = args.CloseAfterAction || false;//关闭
    this.PostSheetInfo = args.PostSheetInfo || false;
    //是否移动端
    this.IsMobile = sheetInfo.IsMobile || ($.MvcSheetUI.QueryString("ismobile") == "true");
    //执行后台通讯之前的事件
    this.OnActionPreDo = args.OnActionPreDo;
    this.OnAction = args.OnAction;
    //执行后台通讯之后的事件
    this.OnActionDone = args.OnActionDone;
    //设置文本样式
    this.CssClass = args.CssClass || "";

    this.Container = element;//按钮容器ul
    this.SheetInfo = sheetInfo;
    this.Element = null;//当前按钮元素 li
    //参数：[{数据项1},{数据项2},...]或["#ID1"，"#ID2",...]或["数据1","数据2"]或混合
    this.Datas = args.Datas;

    //绑定的参数
    this.Options = args.Options;

    this.PermittedActions = sheetInfo.PermittedActions;
    this.Visible = this.PermittedActions[this.Action] == undefined ? true : this.PermittedActions[this.Action];
    this.MobileVisible = args.MobileVisible === undefined ? this.Visible : args.MobileVisible;
    //执行事件
    this.PreRender();
    this.Render();
};
$.MvcSheetToolbar.IButton.prototype = {
    PreRender: function () {
        var txt = this.Text;
        if ($.MvcSheetUI.SheetInfo.Language) {
            txt = this[$.MvcSheetUI.SheetInfo.Language] || this.Text;
        }
        this.Text = txt;
    },
    Render: function () {
        var actionKey = this.Action || this.Text;
        if (!this.Visible) {
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }
        this.Element = $(this.Container).children("li[data-action='" + actionKey + "']");
        if (this.Element.length == 0) {
            this.Element = this._CreateButtonElement(this.Action, this.Icon, this.Text);
            if (!this.IsMobile) {
                $(this.Container).append(this.Element);
            }
        }
        this.BindClick();
    },
    BindClick: function () {
        var actionKey = this.Action || this.Text;
        this.Element.unbind("click." + actionKey).bind("click." + actionKey, this, function (e) {
            e.data.ActionClick.apply(e.data);
        });
    },
    _CreateButtonElement: function (action, icon, text) {
        var liElement = $("<li data-action='" + this.Action + "'></li>");
        var linkElement = $("<a href='javascript:void(0);'></a>");
        var imgElement = $("<i class='panel-title-icon fa " + this.Icon + " toolImage'></i>");
        var spanElement = $("<span class='toolText'>" + text + "</span>");
        if (this.CssClass) {
            spanElement.addClass(this.CssClass);
        }

        return liElement.append(linkElement.append(imgElement).append(spanElement));
        //return $("<li data-action='" + this.Action + "'><a href='javascript:void(0);'><i class='panel-title-icon fa " + this.Icon + " toolImage'></i><span class='toolText'>" + this.Text + "</span></a></li>");
    },
    ActionClick: function () {
        //doAction之前的事件
        var callResult = true;
        if ($.isFunction(this.OnActionPreDo)) {//javascript函数
            callResult = this.OnActionPreDo.apply(this);
        }
        else if (this.OnActionPreDo) {//javascript语句
            callResult = new Function(this.OnActionPreDo).apply(this);
        }
        //结果成功
        if (callResult == null || callResult == true) {
            //执行后台Action
            this.DoAction.apply(this);
        }

        if (this.OnActionDone) {
            this.OnActionDone.apply(this);
        }
    },
    //执行
    DoAction: function () {
        //继承的按钮，如果需要掉基类的DoAction，用 this.constructor.Base.DoAction.apply(this);
        if (this.OnAction) {
            this.OnAction.apply(this);
        } else {
            if (this.Action) {
                $.MvcSheet.Action(this);
            }
        }
    },
    //回调函数
    OnActionDone: function () { },
    //催办（只输入催办内容 无需选人）
    UrgenDiv: function () {
        var that = this;
        if (!this.SheetInfo.IsMobile) {

            var body = $("<div></div>");
            body.css({ "min-height": 365, "padding": "10px 20px" });
            var _commentTitle = "";
            var _commentVaule = "";
            _commentTitle = SheetLanguages.Current.UrgenContent; _commentVaule = SheetLanguages.Current.InputYourUrgenContent;
            body.append($("<div style='padding-bottom:6px;padding-top: 10px;'>" + _commentTitle + "</div>"));
            var _UserComment = $("<textarea id='popcomment' style='width: 86%;' placeholder='" + _commentVaule + "'> ");
            body.append($("<div style='padding-top:6px'></div>").append(_UserComment));
            body.append($("<div style='padding-bottom:6px;padding-top: 10px;'>" + SheetLanguages.Current.UrgenList + "</div>"));
            //显示历史催办列表
            var table = $(' <table class="table table-striped m-b-none"></table>');
            var tableBody = $("<tbody></tbody>");
            tableBody.append('<tr><td class="col-lg-4"><span>' + SheetLanguages.Current.UrgenTime + '</span></td><td class="col-lg-8"><span>' + _commentTitle + '</span></td></tr>');
            if (this.SheetInfo.UrgenList && this.SheetInfo.UrgenList.length > 0) {
                for (var i = 0; i < this.SheetInfo.UrgenList.length; i++) {
                    tableBody.append('<tr><th><label>' + this.SheetInfo.UrgenList[i].UrgeTime + '</label></th><th><label>' + this.SheetInfo.UrgenList[i].UrgeContent + '</label></th></tr>');
                }
            }
            table.append(tableBody);
            body.append(table);
            this.ModalManager = new $.SheetModal(
                this.Text,
                body,
                [{
                    Text: SheetLanguages.Current.OK,
                    DoAction: function () {
                        console.log(this);
                        this.SheetAction.Datas = [];
                        this.SheetAction.Datas.push(this.UserComment.val());
                        this.SheetAction.CloseAfterAction = true;
                        $.MvcSheet.Action(this.SheetAction);
                    },
                    UserComment: _UserComment,
                    SheetAction: that
                },
                {
                    Text: SheetLanguages.Current.Close,
                    DoAction: function () {
                        this.ModalManager.Hide();
                    }
                }]
                );
        } else {
            var _commentTitle = "";
            var _commentVaule = "";
            _commentTitle = SheetLanguages.Current.UrgenContent; _commentVaule = SheetLanguages.Current.InputYourUrgenContent;
            $.MvcSheetUI.actionSheetParam = {
                title: this.Text,//标题
                Action: that.Action,
                commentVaule: _commentVaule//**意见
            };
            $.MvcSheetUI.IonicFramework.$state.go("form.fetchuser");

        }
    },
    FetchUser: function (_Title, _IsMulti, _UserOptions, _CheckText, _Checked) {
        debugger
        var that = this;
        //var _Editable = false;
        if (!this.SheetUserInited && !this.SheetInfo.IsMobile) {
            this.SheetUserInited = true;
            //选人控件
            var DefaultOptions = {
                O: "VE",
                L: _IsMulti ? $.MvcSheetUI.LogicType.MultiParticipant : $.MvcSheetUI.LogicType.SingleParticipant,
                FrequentUserVisible: true,
                DepartmentUserVisible:true
            };
            if (_UserOptions) {
                $.extend(DefaultOptions, _UserOptions)
            }

            var _SheetUser = $("<div>").SheetUser(DefaultOptions);
            //复选框
            var chkListenConstancy = null;

            if (_CheckText && !this.SheetInfo.IsMobile) { // 只有PC端显示，移动端会遮住选人
                var ckid = $.MvcSheetUI.NewGuid();
                chkListenConstancy = $("<input type='checkbox' id='" + ckid + "' />");
                //默认选中
                chkListenConstancy.prop("checked", !!_Checked);
                var labelForCheckbox = $("<label for='" + ckid + "'>" + _CheckText + "</label>")
                this.CheckText = chkListenConstancy;
            }
            // 循环表单审批控件
            //var _sheetComment = $("*[data-type='SheetComment']");
            //for (var i = 0; i < _sheetComment.length; i++) { 
            //    if ($(_sheetComment[i]).SheetComment() && $(_sheetComment[i]).SheetComment().Editable) {
            //        _Editable = true;
            //        break;
            //    }
            //}
            if (!this.SheetInfo.IsMobile) {
                var body = $("<div><div style='padding-bottom:6px'>" + _Title + "<span style='color:red'>*</span></div></div>");
                body.css({ "min-height": 365, "padding": "10px 20px" }).append(_SheetUser.Element);
                var _commentTitle = "";
                var _commentVaule = "";
                var _textareaDefaultVaule = "";
                if (this.Action == "Urgen") { _commentTitle = SheetLanguages.Current.ForwardComment; _commentVaule = SheetLanguages.Current.InputYourForwardComment; }
                if (this.Action == "Forward") { _commentTitle = SheetLanguages.Current.ForwardComment; _commentVaule = SheetLanguages.Current.InputYourForwardComment; }
                if (this.Action == "Assist") { _commentTitle = SheetLanguages.Current.AssistComment; _commentVaule = SheetLanguages.Current.InputYourAssistComment; }
                if (this.Action == "Consult") { _commentTitle = SheetLanguages.Current.ConsultComment; _commentVaule = SheetLanguages.Current.InputYourConsultComment; }
                if ((this.Action == "Forward" || this.Action == "Assist" || this.Action == "Consult" || this.Action == "Urgen")) { //&& _Editable
                    body.append($("<div style='padding-bottom:6px;padding-top: 10px;'>" + _commentTitle + "</div>"));
                    if (window.localStorage.getItem("H3.SheetComment.CommentInput.Vaule")) {
                        _textareaDefaultVaule = window.localStorage.getItem("H3.SheetComment.CommentInput.Vaule");
                        var _UserComment = $("<textarea id='popcomment' style='width: 86%;' placeholder='" + _commentVaule + "(非必填)'> " + _textareaDefaultVaule + " </textarea>");
                    } else {
                        var _UserComment = $("<textarea id='popcomment' style='width: 86%;' placeholder='" + _commentVaule + "(非必填)'> ");
                    }
                    body.append($("<div style='padding-top:6px'></div>").append(_UserComment));
                }

                //if (chkListenConstancy) {
                //    $(_SheetUser.Element).after($("<div style='padding-top:6px'></div>").append(chkListenConstancy);.append(labelForCheckbox));
                //}

                this.ModalManager = new $.SheetModal(
                    this.Text,
                    body,
                    [{
                        Text: SheetLanguages.Current.OK,
                        DoAction: function () {
                            var userid = this.SheetUser.GetValue();
                            this.SheetAction.Datas = [];
                            // 参与者不能为空
                            if (userid) {
                                this.SheetAction.Datas.push(userid.toString());

                                if (this.ChecBoxOjb) {
                                    this.SheetAction.Datas.push(this.ChecBoxOjb.prop("checked"));
                                }
                                debugger;
                                if (this.SheetAction.Action == "Forward" || this.SheetAction.Action == "Assist" || this.SheetAction.Action == "Consult") {
                                    // 为空时默认赋值
                                    if (this.UserComment.val() == "")
                                        this.UserComment.val(SheetLanguages.Current.Approve)
                                    this.SheetAction.Datas.push(this.UserComment.val());
                                    this.SheetAction.CloseAfterAction = true;
                                }
                            } else {
                                // 请选择参与者
                                alert(SheetLanguages.Current.SelectUser);
                                return;
                            }
                            if (userid) {
                                this.SheetAction.Datas.push(userid.toString());

                                if (this.ChecBoxOjb) {
                                    this.SheetAction.Datas.push(this.ChecBoxOjb.prop("checked"));
                                }

                                $.MvcSheet.Action(this.SheetAction);
                                this.ModalManager.Hide();
                            }
                            else {
                                alert(SheetLanguages.Current.SelectUser);
                            }
                        },
                        SheetUser: _SheetUser,
                        ChecBoxOjb: chkListenConstancy,
                        UserComment: _UserComment,
                        SheetAction: that
                    },
                    {
                        Text: SheetLanguages.Current.Close,
                        DoAction: function () {
                            this.ModalManager.Hide();
                        }
                    }]
                    );
            }
        }
        if (window.localStorage.getItem("H3.SheetComment.CommentInput.Vaule")) { //&& _Editable
            console.log(window.localStorage.getItem("H3.SheetComment.CommentInput.Vaule"));
            _textareaDefaultVaule = window.localStorage.getItem("H3.SheetComment.CommentInput.Vaule");
            $("#popcomment").val(_textareaDefaultVaule);
        } else {  //if (_Editable) {
            $("#popcomment").val("");
        }

        if (this.SheetInfo.IsMobile) {
            //增加一个属性ActionType区分转办，协办等公共用一选人控件多次切换选中后数据不更新的问题
            var DefaultOptions = {
                O: "VE",
                L: _IsMulti ? $.MvcSheetUI.LogicType.MultiParticipant : $.MvcSheetUI.LogicType.SingleParticipant,
                ActionType: that.Action
            };
            if (_UserOptions) {
                $.extend(DefaultOptions, _UserOptions)
            }
            var _commentTitle = "";
            var _commentVaule = "";
            if (this.Action == "Forward") { _commentTitle = SheetLanguages.Current.ForwardComment; _commentVaule = SheetLanguages.Current.InputYourForwardComment; }
            if (this.Action == "Assist") { _commentTitle = SheetLanguages.Current.AssistComment; _commentVaule = SheetLanguages.Current.InputYourAssistComment; }
            if (this.Action == "Consult") { _commentTitle = SheetLanguages.Current.ConsultComment; _commentVaule = SheetLanguages.Current.InputYourConsultComment; }
            $.MvcSheetUI.actionSheetParam = {
                ueroptions: DefaultOptions,
                title: this.Text,//标题
                Action: that.Action,
                DisplayName: this.SheetInfo.DisplayName,
                UserName: this.SheetInfo.UserName,
                Text: _Title,//请选择**
                commentVaule: _commentVaule,//**意见
                FrequentUserVisible: true,
                DepartmentUserVisible: true
            };
            $.MvcSheetUI.IonicFramework.$state.go("form.fetchuser");
        }
        else {
            this.ModalManager.Show();
        }
    },
    GetMobileProxy: function (_thatAction) {
        return {
            text: _thatAction.Text,
            handler: function () {
                _thatAction.ActionClick();
            }
        }
    }
};
//#endregion

//#region 保存
$.MvcSheetToolbar.Save = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Save.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Save.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        $.MvcSheet.Save(this);
        top.postMessage("IsSave", "*")
    }
});
//#endregion

//#region 流程状态
$.MvcSheetToolbar.ViewInstance = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.ViewInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.ViewInstance.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        if (this.SheetInfo.IsMobile) {
            $.MvcSheetUI.IonicFramework.$state.go("form.instancestate", { Mode: this.SheetInfo.SheetMode, InstanceID: this.SheetInfo.InstanceId, WorkflowCode: this.SheetInfo.WorkflowCode, WorkflowVersion: this.SheetInfo.WorkflowVersion });
        }
        else {
            //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
            if (!this.SheetInfo.IsOriginateMode) {
                window.open(_PORTALROOT_GLOBAL + "/index.html#/InstanceDetail/" + this.SheetInfo.InstanceId + "/" + (this.SheetInfo.WorkItemId == null ? "" : this.SheetInfo.WorkItemId) + "//", "_blank");
            } else {
                window.open(_PORTALROOT_GLOBAL + "/index.html#/WorkflowInfo///" + this.SheetInfo.WorkflowCode + "/" + this.SheetInfo.WorkflowVersion, "_blank");
            }
        }
    }
});
//#endregion

//#region 预览
$.MvcSheetToolbar.PreviewParticipant = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.PreviewParticipant.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.PreviewParticipant.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        this.constructor.Base.DoAction(this);
    }
});
//#endregion

//#region 取消
$.MvcSheetToolbar.CancelInstance = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.CancelInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.CancelInstance.Inherit($.MvcSheetToolbar.IButton, {
    //PreRender: function () {
    //    this.constructor.Base.PreRender();

    //    //this.OnActionPreDo = function () {
    //    //    return confirm("确定执行取消流程操作?");
    //    //};
    //},
    DoAction: function () {
        var that = this;
        $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfirmCancelInstance, function () {
            $.MvcSheet.Action(that);
        });
    }
});
//#endregion

//#region 驳回
$.MvcSheetToolbar.Reject = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Reject.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Reject.Inherit($.MvcSheetToolbar.IButton, {
    Render: function () {
        if (!this.Visible) {
            var actionKey = this.Action || this.Text;
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }

        if (this.SheetInfo.ApprovalListVisible) {
            this.Text = SheetLanguages.Current.Disagree;
            this.DestActivity = "__RejectTo_Previous";//不同意时 符合否决出口的则跳转到前一个节点
        }

        var RejectActivities = [];
        if (this.SheetInfo.RejectActivities) {
            for (var i = 0; i < this.SheetInfo.RejectActivities.length; ++i) {
                RejectActivities.push(
                    {
                        Action: this.SheetInfo.RejectActivities[i].Code,
                        Icon: this.Icon,
                        Text: this.SheetInfo.RejectActivities[i].Name,
                        OnAction: function () {
                            $.MvcSheet.Reject(this, this.Action);
                        },
                        MobileVisible: false
                    });
            }
        }
        if (RejectActivities.length > 0) {
            if (RejectActivities.length == 1) {
                //只有一个的时候
                this.Text = RejectActivities[0].Text;
                this.DestActivity = RejectActivities[0].Action;
                this.constructor.Base.Render.apply(this);
            } else {
                this.constructor.Base.Render.apply(this);
                this.DropdownMenu = $("<ul class='dropdown-menu'></ul>");
                var Menus = this.DropdownMenu.SheetToolBar(RejectActivities);
                if (this.IsMobile) {
                    this.MobileActions = [];
                    for (_Action in Menus.ControlManagers) {
                        var that = Menus.ControlManagers[_Action];
                        this.MobileActions.push(this.GetMobileProxy(that));
                    };
                }

                this.Element.append(this.DropdownMenu);
                this.OnActionPreDo = null;
            }
        }
        else {
            this.constructor.Base.Render.apply(this);
        }
    },
    DoAction: function () {
        if (this.DropdownMenu) {
            if (this.IsMobile) {
                var buttons = this.MobileActions;
                var hideSheet = $.MvcSheetUI.IonicFramework.$ionicActionSheet.show({
                    buttons: buttons,
                    buttonClicked: function (index) {
                        buttons[index].handler();
                        return true;
                    }
                });
            }
            else {
                if (this.DropdownMenu.is(":hidden"))
                    this.DropdownMenu.show();
                else
                    this.DropdownMenu.hide();
            }
        }
        else if (this.DestActivity) {
            $.MvcSheet.Reject(this, this.DestActivity);
        }
        else {
            $.MvcSheet.Reject(this);
        }
    }
});
//#endregion

//#region 提交
$.MvcSheetToolbar.Submit = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Submit.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Submit.Inherit($.MvcSheetToolbar.IButton, {
    Render: function () {
        var displayPost = false,
            displayGroup = false;

        if (!this.Visible) {
            var actionKey = this.Action || this.Text;
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }

        if (this.SheetInfo.ApprovalListVisible) {
            this.Text = SheetLanguages.Current.Agree;
        }

        this.SubmitActivities = [];
        if (this.SheetInfo.SubmitActivities == null
            || this.SheetInfo.SubmitActivities == undefined
            || this.SheetInfo.SubmitActivities.length == 0) {

            //根据岗位提交
            if (this.SheetInfo.Posts) {
                displayPost = this.SheetInfo.Posts.length > 1;
                for (var j = 0; j < this.SheetInfo.Posts.length; j++) {
                    this.SubmitActivities.push(
                    {
                        Action: this.Action + "&" + this.SheetInfo.Posts[j].Code,
                        Icon: this.Icon,
                        Text: this.Text + (displayPost ? ("-" + this.SheetInfo.Posts[j].Name) : ""),
                        OnAction: function () {
                            $.MvcSheet.Submit(this, this.Text, "", this.Action.split("&")[1]);
                        },
                        MobileVisible: false
                    });
                }
            }
        }
        else {
            for (var i = 0; i < this.SheetInfo.SubmitActivities.length; ++i) {
                //直接提交
                this.SubmitActivities.push(
                   {
                       Action: this.SheetInfo.SubmitActivities[i].Code,
                       Text: this.Text + "-" + this.SheetInfo.SubmitActivities[i].Name,
                       OnAction: function () {
                           $.MvcSheet.Submit(this, this.Text, this.Action);
                       },
                       MobileVisible: false
                   });
                //根据岗位提交
                if (this.SheetInfo.Posts) {
                    displayPost = this.SheetInfo.Posts.length > 1;
                    for (var j = 0; j < this.SheetInfo.Posts.length; j++) {
                        this.SubmitActivities.push(
                        {
                            Action: this.SheetInfo.SubmitActivities[i].Code + "&" + this.SheetInfo.Posts[j].Code,
                            Icon: this.Icon,
                            Text: this.Text + "-" + this.SheetInfo.SubmitActivities[i].Name +
                                (displayPost ? ("-" + this.SheetInfo.Posts[j].Name) : ""),
                            OnAction: function () {
                                $.MvcSheet.Submit(this, this.Text, this.Action.split("&")[0], this.Action.split("&")[1]);
                            },
                            MobileVisible: false
                        });
                    }
                }
                //根据组提交
                if (this.SheetInfo.Groups) {
                    displayGroup = this.SheetInfo.Groups.length > 1;
                    for (var j = 0; j < this.SheetInfo.Groups.length; j++) {
                        this.SubmitActivities.push(
                        {
                            Action: this.SheetInfo.SubmitActivities[i].Code + "&" + this.SheetInfo.Groups[j].Code,
                            Icon: this.Icon,
                            Text: this.Text + "-" + this.SheetInfo.SubmitActivities[i].Name +
                                (displayGroup ? ("-" + this.SheetInfo.Groups[j].Name) : ""),
                            OnAction: function () {
                                $.MvcSheet.Submit(this, this.Text, this.Action.split("&")[0], null, this.Action.split("&")[1]);
                            },
                            MobileVisible: false
                        });
                    }
                }
            }
        }

        if (this.SubmitActivities.length > 1) {
            this.constructor.Base.Render.apply(this);
            this.DropdownMenu = $("<ul class='dropdown-menu'></ul>");
            var Menus = this.DropdownMenu.SheetToolBar(this.SubmitActivities);

            if (this.IsMobile) {
                this.MobileActions = [];
                for (_Action in Menus.ControlManagers) {
                    var that = Menus.ControlManagers[_Action];
                    this.MobileActions.push(this.GetMobileProxy(that));
                };
            }

            $(this.Element).append(this.DropdownMenu);
            this.OnActionPreDo = null;
        }
        else if (this.SubmitActivities.length == 1) {
            this.Text = this.SubmitActivities[0].Text;
            this.constructor.Base.Render.apply(this);
        }
        else {
            this.constructor.Base.Render.apply(this);
        }
    },
    DoAction: function () {
        if (this.SubmitActivities.length == 1) {
            this.SubmitActivities[0].OnAction.apply(this.SubmitActivities[0]);
            return;
        }

        if (this.DropdownMenu) {
            if (this.IsMobile) {
                var buttons = this.MobileActions;
                var hideSheet = $.MvcSheetUI.IonicFramework.$ionicActionSheet.show({
                    buttons: buttons,
                    buttonClicked: function (index) {
                        buttons[index].handler();
                        return true;
                    }
                });
            }
            else {
                if (this.DropdownMenu.is(":hidden"))
                    this.DropdownMenu.show();
                else
                    this.DropdownMenu.hide();
            }
        }
        else {
            $.MvcSheet.Submit(this, this.Text);
        }
    }
});
//#endregion

//#region 结束流程
$.MvcSheetToolbar.FinishInstance = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.FinishInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.FinishInstance.Inherit($.MvcSheetToolbar.IButton, {
    //PreRender: function () {
    //    this.constructor.Base.PreRender();
    //    //this.OnActionPreDo = function () {
    //    //    return confirm("确定执行结束流程操作?");
    //    //}
    //},
    DoAction: function () {
        $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfirmFinishInstance, function () {
            $.MvcSheet.FinishInstance(this);
        });
    }
});
//#endregion

//#region 转发
$.MvcSheetToolbar.Forward = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Forward.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Forward.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        } else {
            var option = undefined;
            if (this.SheetInfo.OptionalRecipients) {
                option = this.SheetInfo.OptionalRecipients[this.Action];
            } else {
                option = {
                    OrgUnitVisible: false,
                    GroupVisible: false,
                    PostVisible: false,
                    FrequentUserVisible: true,
                    DepartmentUserVisible: true
                }
            }
            this.FetchUser.apply(this, [SheetLanguages.Current.SelectForwardUser, false, option]);
        }
    }
});
//#endregion

//#region 协办
$.MvcSheetToolbar.Assist = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Assist.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Assist.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        }
        else {
            var option = {
                OrgUnitVisible: false,
                GroupVisible: true,
                PostVisible: true,
                FrequentUserVisible: true,
                DepartmentUserVisible: true
            };
            if (this.SheetInfo.OptionalRecipients && this.SheetInfo.OptionalRecipients[this.Action]) {
                option = this.SheetInfo.OptionalRecipients[this.Action];
            }
            this.FetchUser.apply(this, [SheetLanguages.Current.SelectAssistUser, true, option, SheetLanguages.Current.AssistRemind]);
        }
    }
});
//#endregion

//#region 催办
$.MvcSheetToolbar.Urgen = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Urgen.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Urgen.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        debugger;
        //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        }
        else {
            this.UrgenDiv.apply(this);
        }
    }
});
//#endregion

//#region 征询意见
$.MvcSheetToolbar.Consult = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Consult.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Consult.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        } else {
            var option = {
                OrgUnitVisible: false,
                GroupVisible: true,
                PostVisible: true,
                FrequentUserVisible: true,
                DepartmentUserVisible: true
            };
            if (this.SheetInfo.OptionalRecipients && this.SheetInfo.OptionalRecipients[this.Action]) {
                option = this.SheetInfo.OptionalRecipients[this.Action];
            }
            this.FetchUser.apply(this, [SheetLanguages.Current.SelectConsultUser, true, option, SheetLanguages.Current.ConsultRemind]);
        }
    }
});
//#endregion

//#region 传阅
$.MvcSheetToolbar.Circulate = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Circulate.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Circulate.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        } else {
            var option = {
                SegmentVisible: true,
                OrgUnitVisible: true,
                GroupVisible: true,
                PostVisible: true,
                UserVisible: true,
                FrequentUserVisible: true,
                DepartmentUserVisible: true
            };
            if (this.SheetInfo.OptionalRecipients && this.SheetInfo.OptionalRecipients[this.Action]) {
                option = this.SheetInfo.OptionalRecipients[this.Action];
            }
            //this.FetchUser.apply(this, [SheetLanguages.Current.SelectCirculateUser, true, option]);
            this.SheetUserInited = false;
            this.FetchUser.apply(this, [SheetLanguages.Current.SelectCirculateUser, true, option, SheetLanguages.Current.AllowCirculate, false]);
        }
    }
});
//#endregion

//#region 加签
$.MvcSheetToolbar.AdjustParticipant = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.AdjustParticipant.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.AdjustParticipant.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        //打开新的页面，_PORTALROOT_GLOBAL是模板页定义
        if (this.SheetInfo.WorkItemType == -1) {
            return;
        } else {
            //var option = { V: this.SheetInfo.Participants };
            this.FetchUser.apply(this, [SheetLanguages.Current.SelectSignUser, true]);
        }
    }
});
//#endregion

//#region 关闭
$.MvcSheetToolbar.Close = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Close.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Close.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        //top.window != window && !this.SheetInfo.IsMobile移动端
        if ((top.window.location.href.indexOf("/app/") > -1 || top.window.location.href.indexOf("/home") > -1) && (top.window != window && !this.SheetInfo.IsMobile)) {
            //V10.0 关闭当前表单页面
            top.$(".app-aside-right").find("iframe").attr("src", "");
            top.$(".app-aside-right").removeClass("show");
        } else {
            $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfrimClose, function () {
                $.MvcSheet.ClosePage(this);
            });
        }

    }
});
//#endregion

//#region 打印
$.MvcSheetToolbar.Print = function (element, option, sheetInfo) {
    this.Printed = false;
    return $.MvcSheetToolbar.Print.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Print.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        // 如果有自定义打印表单URL，则转向自定义打印表单
        // 否则直接页面打印
        if (this.SheetInfo.PrintUrl) {
            window.open(this.SheetInfo.PrintUrl);
        }
        else {
            // 打印当前页面
            window.print();
        }
    }
});
//#endregion

//#region 取回流程 RetrieveInstance
$.MvcSheetToolbar.RetrieveInstance = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.RetrieveInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.RetrieveInstance.Inherit($.MvcSheetToolbar.IButton, {
    //PreRender: function () {
    //    this.constructor.Base.PreRender();
    //    //this.OnActionPreDo = function () {
    //    //    return confirm("确定执行取回流程操作?");
    //    //}
    //},
    DoAction: function () {
        $.MvcSheet.ConfirmAction(SheetLanguages.Current.ConfirmReterive, function () {
            $.MvcSheet.RetrieveInstance(this);
        });
    }
});
//#endregion

//#region 已阅
$.MvcSheetToolbar.Viewed = function (element, option, sheetInfo) {
    return $.MvcSheetToolbar.Viewed.Base.constructor.call(this, element, option, sheetInfo);
};
$.MvcSheetToolbar.Viewed.Inherit($.MvcSheetToolbar.IButton, {
    DoAction: function () {
        $.MvcSheet.Submit(this, this.Text);
    }
});
//#endregion