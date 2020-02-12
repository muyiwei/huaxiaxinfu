//工具栏
//构造FormToolBar，需要根据表单数据，构造需要的按钮
(function () {
    $.FormToolBar = function (Options, SheetInfo) {
        this.ResponseContext = SheetInfo;
        this.Options = Options;
        this.Actions = null;
        this.ButtonManager = {};
        this.Actions = {
            buttons: [],
            cancelText: "取消",
            cancel: function () {
            },
            buttonClicked: function (index) {
                var Action = this.buttons[index];
                //此处判断转发
                if (Action.Action == "Forward") {
                    if (H3Config.GlobalState) {
                        //跳转到组织选择页面
                        H3Config.GlobalState.go('app.forward', {});
                    }
                    return false;
                } else if (Action.Action == "Submit") {
                    //判断是否是流程和发起环节
                    if (($.SmartForm.ResponseContext.InstanceId || $.SmartForm.ResponseContext.WorkItemId) && !$.SmartForm.ResponseContext.IsCreateMode && $.SmartForm.ResponseContext.WorkflowState != 4) {
                        if (H3Config.CurScope) {
                            H3Config.CurScope.IsApproval = true;
                            H3Config.CurScope.openApprovalModal();
                        }
                    } else {
                        Action.DoAction.apply(Action);
                    }
                    return true;
                } else if (Action.Action == "Reject") {
                    if (($.SmartForm.ResponseContext.InstanceId || $.SmartForm.ResponseContext.WorkItemId) && !$.SmartForm.ResponseContext.IsCreateMode) {
                        if (H3Config.CurScope) {
                            H3Config.CurScope.IsApproval = true;
                            H3Config.CurScope.openApprovalModal();
                        }
                    } else {
                        Action.DoAction.apply(Action);
                    }
                    return true;
                }
                else {

                    Action.DoAction.apply(Action);
                    return true;
                }
            }
        };
        return this.Init();
    };

    $.FormToolBar.prototype = {
        Init: function () {
            for (var i = 0; i < this.Options.length; i++) {
                //if ($.SmartForm.ResponseContext.IsCreateMode) {
                //    if (this.Options[i].Action == "ViewInstance")
                //        continue;
                //}
                this.AddButton(this.Options[i]);
            }
            for (var key in this.ButtonManager) {
                if (key == "Close" || key == "Print") continue;
                this.Actions.buttons.push(this.ButtonManager[key]);
            }
            return this.Actions;
        },
        AddButton: function (option) {
            if (option) {
                var Visible = true;// this.PermittedActions[option.Action] == undefined ? true : this.PermittedActions[option.Action];
                if (!Visible) { return; }
                var key = option.Action || option.Text;
                if (key == void 0) return;
                if (this.ButtonManager[key]) return this.ButtonManager[key];
                if ($.Buttons[option.Action]) {
                    this.ButtonManager[option.Action] = new $.Buttons[option.Action](option, this.ResponseContext);
                }
                else {
                    this.ButtonManager[key] = new $.Buttons.BaseButton(option, this.ResponseContext);
                }
            }
        }
    };

    //#region 按钮基类
    $.Buttons = {};
    $.Buttons.BaseButton = function (args, sheetInfo) {
        this.Text = args.Text;
        this.Icon = args.Icon;
        this.ResponseContext = sheetInfo;
        this.Action = args.Action;
        this.RepeatFlag = false;
        this.Render();
    };
    $.Buttons.BaseButton.prototype = {
        Render: function () {
            //移动端控件必须的
            this.text = '<i class="icon fa ' + this.Icon + '"></i>' + this.Text;
        },
        //执行
        DoAction: function () {
            //继承的按钮，如果需要掉基类的DoAction，用 this.constructor.Base.DoAction.apply(this);
            this.RepeatFlag = false;
            if (this.OnAction) {

                return this.OnAction.apply(this);
            } else {
                if (this.Action) {
                    var okFunction = function (t) {
                        $.SmartForm.OnAction(t);
                    };
                    //return $.SmartForm.OnAction(this);
                    //移动端，删除数据时提示功能
                    if (this.Action == "Remove") {
                        var that = this;

                        $.IConfirm('提示', '确定删除该条数据', function (e) {
                            if (e) {
                                okFunction(that);
                            } else {
                                this.RepeatFlag = true;
                                if (MobileCacheManager.ClickObj)
                                    $(MobileCacheManager.ClickObj).removeAttr('disabled');
                            }
                        });
                    }
                    else if (this.Action == "CancelInstance") {
                        var that = this;
                        $.IConfirm('提示', '确定取消流程', function (e) {
                            if (e) {
                                okFunction(that);
                            } else {
                                this.RepeatFlag = true;
                                if (MobileCacheManager.ClickObj)
                                    $(MobileCacheManager.ClickObj).removeAttr('disabled');
                            }
                        });
                    }
                    else {
                        return $.SmartForm.OnAction(this);
                    }
                }
            }
        }
    };
    //#endregion

    //#region 保存
    $.Buttons.Save = function (option, sheetInfo) {
        return $.Buttons.Save.Base.constructor.call(this, option, sheetInfo);
    };
    $.Buttons.Save.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            $.SmartForm.Save(this);
        }
    });
    //#endregion
    //#region 流程状态
    $.Buttons.ViewInstance = function (element, option, sheetInfo) {
        return $.Buttons.ViewInstance.Base.constructor.call(this, element, option, sheetInfo);
    };
    $.Buttons.ViewInstance.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            var url = "";
            url = "/app/instancestate/" + this.ResponseContext.SchemaCode + "/" + this.ResponseContext.InstanceId + "/" + this.ResponseContext.BizObjectId + "/" + this.ResponseContext.WorkflowVersion + "/";

            var host = window.location.href.substr(0, window.location.href.indexOf('#') + 1);
            window.location.href = host + url;
        }
    });

    //#region 提交
    $.Buttons.Submit = function (option, sheetInfo) {
        return $.Buttons.Submit.Base.constructor.call(this, option, sheetInfo);
    };
    $.Buttons.Submit.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            $.SmartForm.Submit(this, this.Text);
        }
    });
    //#endregion

    //#region 驳回
    //Error:驳回有好几种控制
    $.Buttons.Reject = function (element, option, sheetInfo) {
        return $.Buttons.Reject.Base.constructor.call(this, element, option, sheetInfo);
    };
    $.Buttons.Reject.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            $.SmartForm.Reject(this);
        }
    });
    //#endregion

    //#region 结束流程
    $.Buttons.FinishInstance = function (element, option, sheetInfo) {
        return $.Buttons.FinishInstance.Base.constructor.call(this, element, option, sheetInfo);
    };
    $.Buttons.FinishInstance.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            $.SmartForm.ConfirmAction("确定执行结束流程操作", function () {
                $.SmartForm.FinishInstance(this);
            });
        }
    });
    //#endregion

    //#region 取回流程 RetrieveInstance
    $.Buttons.RetrieveInstance = function (element, option, sheetInfo) {
        return $.Buttons.RetrieveInstance.Base.constructor.call(this, element, option, sheetInfo);
    };
    $.Buttons.RetrieveInstance.Inherit($.Buttons.BaseButton, {
        DoAction: function () {
            $.SmartForm.ConfirmAction("确定执行撤销流程操作", function () {
                $.SmartForm.RetrieveInstance(this);
            });
        }
    });
    //#endregion


})(jQuery);