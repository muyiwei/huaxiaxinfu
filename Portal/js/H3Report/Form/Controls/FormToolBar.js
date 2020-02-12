/// <reference path="../../../plugins/qrCode/jquery.qrcode.min.js" />
/// <reference path="../../../plugins/qrCode/jquery.qrcode.min.js" />
/// <reference path="../../../plugins/qrCode/jquery.qrcode.min.js" />
/// <reference path="../../../jquery-1.11.1.min.js" />
/// <reference path="../../../jquery-1.11.1.min.js" />
/// <reference path="../../../jquery-1.11.1.min.js" />
/// <reference path="../../../jquery-1.11.1.min.js" />
//工具栏
//构造FormToolBar，需要根据表单数据，构造需要的按钮
(function () {
    $.fn.FormToolBar = function () {
        return $.ControlManager.Run.call(this, "FormToolBar", arguments);
    };

    $.Controls.FormToolBar = function (element, args, sheetInfo) {
        this.Element = element;
        this.ResponseContext = sheetInfo;
        this.ControlManagers = {};

        for (var i in args) {
            this.AddButton(args[i]);
        }

        $(this.Element).find("li").hover(function () {
            $(this).addClass("active");
        }, function () {
            $(this).removeClass("active");
        });
        return this;
    };

    $.Controls.FormToolBar.prototype = {
        AddButton: function (option) {
            if (option) {
                var key = option.Action || option.Text;
                if (key == void 0) return;
                if (this.ControlManagers[key]) return this.ControlManagers[key];
                if ($.Buttons[option.Action]) {
                    this.ControlManagers[option.Action] = new $.Buttons[option.Action](this.Element, option, this.ResponseContext);
                } else {
                    this.ControlManagers[key] = new $.Buttons.BaseButton(this.Element, option, this.ResponseContext);
                }
            }
        }
    };
})(jQuery);

//#region 按钮基类
$.Buttons = {};
$.Buttons.BaseButton = function (element, args, sheetInfo) {
    this.Action = args.Action;
    this.Icon = args.Icon;
    this.Text = args.Text;

    //设置文本样式
    this.CssClass = args.CssClass || "";

    this.Container = element;//按钮容器ul
    this.ResponseContext = sheetInfo;
    this.Element = null;//当前按钮元素 li

    //绑定的参数
    this.Options = args.Options;

    //this.PermittedActions = sheetInfo.PermittedActions;
    this.Visible = true;//this.PermittedActions[this.Action] == void 0 ? true : this.PermittedActions[this.Action];
    this.MobileVisible = true;//args.MobileVisible === void 0 ? this.Visible : args.MobileVisible;

    //自定义事件
    this.OnActionPreDo = args.OnActionPreDo;
    this.OnAction = args.OnAction;
    this.OnActionDone = args.OnActionDone;


    //执行事件
    this.PreRender();
    this.Render();
};
$.Buttons.BaseButton.prototype = {
    PreRender: function () {
    },
    Render: function () {
        var actionKey = this.Action || this.Text;
        if (!this.Visible) {
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }
        this.Element = $(this.Container).children("li[data-action='" + actionKey + "']");
        if (this.Element.length == 0) {
            if (this.Action == "Submit") {
                this.Icon = "icon-ok";
            }
            this.Element = this._CreateButtonElement(this.Action, this.Icon, this.Text);
            $(this.Container).append(this.Element);
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
        var spanElement = $("<span class='fa " + this.Icon + "'>  " + this.Text + "</span>");
        if (this.CssClass) {
            spanElement.addClass(this.CssClass);
        }

        return liElement.append(linkElement.append(spanElement));
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

        //回调里处理
        //if (this.OnActionDone) {
        //    this.OnActionDone.apply(this);
        //}
    },
    //执行
    DoAction: function () {
        //继承的按钮，如果需要掉基类的DoAction，用 this.constructor.Base.DoAction.apply(this);
        if (this.OnAction) {
            this.OnAction.apply(this);
        } else {
            if (this.Action) {
                $.SmartForm.OnAction(this);
            }
        }
    },
    //回调函数
    OnActionDone: function () { },

    FetchUser: function (_Title, _IsMulti, _UserOptions, _CheckText, _Checked) {
        var that = this;
        if (!this.SheetUserInited) {
            this.SheetUserInited = true;

            //选人控件
            var DefaultOptions = {
                O: "VE",
                L: _IsMulti ? $.SmartForm.LogicType.MultiParticipant : $.SmartForm.LogicType.SingleParticipant
            };
            if (_UserOptions) {
                $.extend(DefaultOptions, _UserOptions)
            }
            var _SheetUser = $("<div>").FormUser(DefaultOptions);
            //复选框
            var chkListenConstancy = null;

            if (_CheckText) {
                var ckid = $.IGuid();
                chkListenConstancy = $("<input type='checkbox' id='" + ckid + "' />");
                //默认选中
                chkListenConstancy.prop("checked", !!_Checked);
                var labelForCheckbox = $("<label for='" + ckid + "'>" + _CheckText + "</label>")
                this.CheckText = chkListenConstancy;
            }

            if (this.ResponseContext.IsMobile) {
                this.FetchUserPanelID = $.uuid();
                //标题
                var _HeaderId = $.uuid();
                var _Header = $("<header>").attr("id", _HeaderId);
                _Header.html('<h1>' + _Title + '</h1><a class="button icon close" onclick="$.ui.goBack();"></a>')
                _Header.appendTo("#afui");

                //确定
                var _Button = $("<div>").text("确定").addClass("button").css("float", "right");
                _Button.appendTo(_Header);

                //弹出窗口
                var _SelectPanel = $("<div>").addClass("panel").attr("id", this.FetchUserPanelID).attr("data-header", _HeaderId)
                    .attr("data-transition", "slideUp")
                    .attr("data-title", _Title);
                _SelectPanel.appendTo("#content");

                $(_SheetUser.Element).appendTo(_SelectPanel);
                if (chkListenConstancy) {
                    $(_SheetUser.Element).after(chkListenConstancy);
                    labelForCheckbox.width("90%");
                    chkListenConstancy.after(labelForCheckbox);
                }

                _Button.click(function () {
                    that.Datas = [];
                    if (_SheetUser.GetValue()) {
                        that.Datas.push(_SheetUser.GetValue().toString());
                        if (chkListenConstancy) {
                            that.Datas.push(chkListenConstancy.prop("checked"));
                        }

                        $.SmartForm.OnAction(that);

                        $.ui.goBack();

                        setTimeout(function () {
                            $("#" + _HeaderId).remove();
                            $("#" + this.FetchUserPanelID).remove();
                        }, 1000)
                    }
                    else {
                        alert("请选择参与者");
                    }
                });
            }
            else {
                var body = $("<div><div>" + _Title + "</div></div>");
                body.css("min-height", 350).append(_SheetUser.Element);
                if (chkListenConstancy) {
                    $(_SheetUser.Element).after($("<div></div>").append(chkListenConstancy).append(labelForCheckbox));
                }

                this.ModalManager = new $.SheetModal(
                    _Title,
                    body,
                    [{
                        Text: "确定",
                        DoAction: function () {
                            var userid = thisFormUser.GetValue();
                            this.SheetAction.Datas = [];
                            if (userid) {
                                this.SheetAction.Datas.push(userid.toString());

                                if (this.ChecBoxOjb) {
                                    this.SheetAction.Datas.push(this.ChecBoxOjb.prop("checked"));
                                }

                                $.SmartForm.OnAction(this.SheetAction);
                                this.ModalManager.Hide();
                            }
                            else {
                                alert("请选择参与者!");
                            }
                        },
                        SheetUser: _SheetUser,
                        ChecBoxOjb: chkListenConstancy,
                        SheetAction: that
                    },
                    {
                        Text: "关闭",
                        DoAction: function () {
                            this.ModalManager.Hide();
                        }
                    }]
                );
            }
        }

        if (this.ResponseContext.IsMobile) {
            $.ui.loadContent("#" + this.FetchUserPanelID);
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
$.Buttons.Save = function (element, option, sheetInfo) {
    return $.Buttons.Save.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Save.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        $.SmartForm.Save(this);
    }
});
//#endregion

//保存并添加
$.Buttons.SubmitAndAddAction = function (element, option, sheetInfo) {
    return $.Buttons.SubmitAndAddAction.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.SubmitAndAddAction.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        $.SmartForm.Submit(this);
    }
});


//#region 流程状态
$.Buttons.ViewInstance = function (element, option, sheetInfo) {
    if (!sheetInfo.IsCreateMode)
        return $.Buttons.Reject.Base.constructor.call(this, element, option, sheetInfo);
    else {
        option.Text = "流程预览";
        return $.Buttons.ViewInstance.Base.constructor.call(this, element, option, sheetInfo);
    }
};
$.Buttons.ViewInstance.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        var url = "";
        if (!this.ResponseContext.IsCreateMode) {
            url = "/WorkFlowCenter/WorkFlowState/?BizObjectId=" + this.ResponseContext.BizObjectId + "&WorkItemID=" + this.ResponseContext.WorkItemId + "&WorkflowCode=" + this.ResponseContext.SchemaCode + "&WorkflowVersion=" + this.ResponseContext.WorkflowVersion + "&mystate=1";
            $.ISideModal.Show(url, "流程状态");
        } else {
            url = "/WorkFlowCenter/WorkFlowState/?BizObjectId=" + this.ResponseContext.BizObjectId + "&WorkItemID=" + this.ResponseContext.WorkItemId + "&WorkflowCode=" + this.ResponseContext.SchemaCode + "&WorkflowVersion=" + this.ResponseContext.WorkflowVersion + "&mystate=1";
            $.ISideModal.Show(url, "流程预览");
            //$.IModal("流程预览", url); 
        }




        //window.location.href = url;
    }
});
//#endregion


//#region 取消
$.Buttons.CancelInstance = function (element, option, sheetInfo) {
    return $.Buttons.CancelInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.CancelInstance.Inherit($.Buttons.BaseButton, {
    PreRender: function () {
        this.constructor.Base.PreRender();

        //this.OnActionPreDo = function () {
        //    return confirm("确定执行取消流程操作?");
        //};
    },
    DoAction: function () {
        var that = this;
        $.SmartForm.ConfirmAction("确定执行取消流程操作", function () {
            $.SmartForm.OnAction(that);
            $.SmartForm.ClosePage(this);
        });
    }
});
//#endregion

//#region 驳回
$.Buttons.Reject = function (element, option, sheetInfo) {

    return $.Buttons.Reject.Base.constructor.call(this, element, option, sheetInfo);

};
$.Buttons.Reject.Inherit($.Buttons.BaseButton, {
    Render: function () {
        if (!this.Visible) {
            var actionKey = this.Action || this.Text;
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }

        if (this.ResponseContext.ApprovalListVisible) {
            this.Text = "不同意";
        }

        var RejectActivities = [];
        if (this.ResponseContext.RejectActivities) {
            for (var i = 0; i < this.ResponseContext.RejectActivities.length; ++i) {
                RejectActivities.push(
                    {
                        Action: this.ResponseContext.RejectActivities[i].Code,
                        Icon: this.Icon,
                        Text: this.ResponseContext.RejectActivities[i].Name,
                        OnAction: function () {
                            $.SmartForm.Reject(this, this.Action);
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
            if (this.DropdownMenu.is(":hidden"))
                this.DropdownMenu.show();
            else
                this.DropdownMenu.hide();
        }
        else if (this.DestActivity) {
            $.SmartForm.Reject(this, this.DestActivity);
        }
        else {
            $.SmartForm.Reject(this);
        }
    }
});
//#endregion

//#region 提交
$.Buttons.Submit = function (element, option, sheetInfo) {
    return $.Buttons.Submit.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Submit.Inherit($.Buttons.BaseButton, {
    Render: function () {
        if ($.SmartForm.ResponseContext.WorkItemType == $.SmartForm.WorkItemType.Fill)
            this.Text = "提交";
        else if ($.SmartForm.ResponseContext.WorkItemType == $.SmartForm.WorkItemType.Approve)
            this.Text = "同意";
        if (!this.Visible) {
            var actionKey = this.Action || this.Text;
            $(this.Container).children("li[data-action='" + actionKey + "']").hide();
            return;
        }

        if (this.ResponseContext.ApprovalListVisible) {
            this.Text = "同意";
        }

        this.SubmitActivities = [];
        if (this.ResponseContext.SubmitActivities == null
            || this.ResponseContext.SubmitActivities == void 0
            || this.ResponseContext.SubmitActivities.length == 0) {

            //根据岗位提交
            if (this.ResponseContext.Posts) {
                for (var j = 0; j < this.ResponseContext.Posts.length; j++) {
                    this.SubmitActivities.push(
                        {
                            Action: this.Action + "&" + this.ResponseContext.Posts[j].Code,
                            Icon: this.Icon,
                            Text: this.Text + "-" + this.ResponseContext.Posts[j].Name,
                            OnAction: function () {
                                $.SmartForm.Submit(this, this.Text, "", this.Action.split("&")[1]);
                            },
                            MobileVisible: false
                        });
                }
            }
            //根据组提交
            if (this.ResponseContext.Groups) {
                for (var j = 0; j < this.ResponseContext.Groups.length; j++) {
                    this.SubmitActivities.push(
                        {
                            Action: this.Action + "&" + this.ResponseContext.Groups[j].Code,
                            Icon: this.Icon,
                            Text: this.Text + "-" + this.ResponseContext.Groups[j].Name,
                            OnAction: function () {
                                $.SmartForm.Submit(this, this.Text, "", null, this.Action.split("&")[1]);
                            },
                            MobileVisible: false
                        });
                }
            }
        }
        else {
            for (var i = 0; i < this.ResponseContext.SubmitActivities.length; ++i) {
                //直接提交
                this.SubmitActivities.push(
                    {
                        Action: this.ResponseContext.SubmitActivities[i].Code,
                        Text: this.Text + "-" + this.ResponseContext.SubmitActivities[i].Name,
                        OnAction: function () {
                            $.SmartForm.Submit(this, this.Text, this.Action);
                        },
                        MobileVisible: false
                    });
                //根据岗位提交
                if (this.ResponseContext.Posts) {
                    for (var j = 0; j < this.ResponseContext.Posts.length; j++) {
                        this.SubmitActivities.push(
                            {
                                Action: this.ResponseContext.SubmitActivities[i].Code + "&" + this.ResponseContext.Posts[j].Code,
                                Icon: this.Icon,
                                Text: this.Text + "-" + this.ResponseContext.SubmitActivities[i].Name + "-" + this.ResponseContext.Posts[j].Name,
                                OnAction: function () {
                                    $.SmartForm.Submit(this, this.Text, this.Action.split("&")[0], this.Action.split("&")[1]);
                                },
                                MobileVisible: false
                            });
                    }
                }
                //根据组提交
                if (this.ResponseContext.Groups) {
                    for (var j = 0; j < this.ResponseContext.Groups.length; j++) {
                        this.SubmitActivities.push(
                            {
                                Action: this.ResponseContext.SubmitActivities[i].Code + "&" + this.ResponseContext.Groups[j].Code,
                                Icon: this.Icon,
                                Text: this.Text + "-" + this.ResponseContext.SubmitActivities[i].Name + "-" + this.ResponseContext.Groups[j].Name,
                                OnAction: function () {
                                    $.SmartForm.Submit(this, this.Text, this.Action.split("&")[0], null, this.Action.split("&")[1]);
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
                $.ui.actionsheet(this.MobileActions);
            }
            else {
                if (this.DropdownMenu.is(":hidden"))
                    this.DropdownMenu.show();
                else
                    this.DropdownMenu.hide();
            }
        }
        else {
            $.SmartForm.Submit(this, this.Text);
        }
    }
});
//#endregion

//#region 结束流程
$.Buttons.FinishInstance = function (element, option, sheetInfo) {
    return $.Buttons.FinishInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.FinishInstance.Inherit($.Buttons.BaseButton, {
    PreRender: function () {
        this.constructor.Base.PreRender();
        //this.OnActionPreDo = function () {
        //    return confirm("确定执行结束流程操作?");
        //}
    },
    DoAction: function () {
        $.SmartForm.ConfirmAction("确定执行结束流程操作", function () {
            $.SmartForm.FinishInstance(this);
        });
    }
});
//#endregion

//#region 关闭
$.Buttons.Close = function (element, option, sheetInfo) {
    return $.Buttons.Close.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Close.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        // View模式下，直接关闭表单
        if (this.ResponseContext.FormMode == $.SmartForm.SmartFormMode.View) {
            $.SmartForm.ClosePage(this);
        }
        else {
            $.SmartForm.ClosePage(this);
        }
    }
});
//#endregion

//#region 删除
$.Buttons.Remove = function (element, option, sheetInfo) {
    return $.Buttons.Remove.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Remove.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        $.SmartForm.Remove(this);
    }
});
//#endregion

//#region 打印
$.Buttons.Print = function (element, option, sheetInfo) {
    this.Printed = false;
    return $.Buttons.Print.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Print.Inherit($.Buttons.BaseButton, {
    DoAction: function () {
        // 如果有自定义打印表单URL，则转向自定义打印表单
        // 否则直接页面打印
        if (this.ResponseContext.PrintUrl) {
            window.open(this.ResponseContext.PrintUrl);
        }
        else {
            //文本转图片
            var wordToImage = function (text) {
                $('body').append('<canvas id="waterCanvas" width="200" height="100"></canvas>');
                var c = document.getElementById('waterCanvas');
                var ctx = c.getContext('2d');
                ctx.font = '20px Verdana';
                ctx.fillStyle = 'green';
                ctx.fillText(text, 100, 50);
                var image = c.toDataURL('image/png', 1);
                $('#waterCanvas').remove();
                return image;
            };
            //判断附件类型是否是图片
            var isImg = function (name) {
                var fileName = name;
                var fileType = "";
                var imgTypeArr = ['.jpeg', '.jpg', '.png', '.gif', '.bmp'];
                if (fileName.lastIndexOf(".") > 0) {
                    fileName = name.substring(0, name.lastIndexOf("."));
                    fileType = name.substring(name.lastIndexOf("."), name.length);
                    if (fileType)
                        fileType = fileType.toLowerCase();
                }
                return imgTypeArr.indexOf(fileType) > -1;//判断是否是图片
            };
            //重绘附件
            var redrawAttachment = function ($attachment) {
                var attachments = [];
                var $attachmentCtrl = $($attachment).FormAttachment();
                var $attachmentValue = $attachmentCtrl.Value;
                var attachmentCount = $attachmentValue.length;//附件数量
                for (var j = 0; j < attachmentCount; j++) {
                    var attachmentName = $attachmentValue[j].Name;
                    var thumbnailUrl = $attachmentValue[j].ThumbnailUrl;
                    var $newAttachment = $('<div class="print-attachment"></div>');
                    if (isImg(attachmentName)) {
                        //是图片
                        if (thumbnailUrl == null) {
                            thumbnailUrl = src = "../../../../Content/Images/ImgFailed.png";
                        }
                        var $newImg = $('<img src="' + thumbnailUrl + '" height="100" />');
                        var indexOfPot = attachmentName.lastIndexOf('.');
                        attachmentName = attachmentName.slice(0, indexOfPot);
                        var $newImgTitle = $('<span>' + attachmentName + '</span>');
                        $newAttachment.append($newImg);
                        $newAttachment.append($newImgTitle);
                    } else {
                        var $newFile = $('<div>' + attachmentName + '</div>');
                        $newAttachment.append($newFile);
                    }
                    attachments.push($newAttachment);
                }
                return attachments;
            };
            //获取控件值
            var getControlValue = function (obj) {
                var controlKey = $(obj).attr('data-controlkey');
                var $control = $(obj).JControl();
                var controlVal = $control.GetValue();
                var tempVal = controlVal;
                switch (controlKey) {
                    case 'FormSeqNo':
                        controlVal = $control.Value;
                        break;
                    case 'FormLabel':
                        controlVal = $control.Value;
                        break;
                    case 'FormUser':
                        controlVal = '';
                        for (var key in tempVal) {
                            //controlVal += tempVal[key].Name;
                            controlVal = tempVal[key].DisplayName;
                        }
                        break;
                    case 'FormCheckbox':
                        controlVal = controlVal ? '是' : '否';
                        break;
                    case 'FormDropDownList':
                        if (!controlVal) {
                            controlVal = '';
                        }
                        break;
                    case 'FormMultiUser':
                        controlVal = '';
                        for (var key in tempVal) {
                            //controlVal += tempVal[key].Name + ';';
                            controlVal += tempVal[key].DisplayName + ';';
                        }
                        break;
                    case 'FormMap':
                        controlVal = '';
                        var address = $.parseJSON(tempVal).Address;
                        controlVal = address;
                        break;
                    case 'FormQuery':
                        controlVal = $control.GetText();
                        break;
                    case 'FormAreaSelect':
                        controlVal = $control.Value;
                        if (controlVal) {
                            var area = $.parseJSON(controlVal);
                            controlVal = area.Province + ' ' + area.City + ' ' + area.Town + ' ' + area.Detail;
                        } else {
                            controlVal = '';
                        }
                        break;
                    case 'FormAttachment':
                        controlVal = $('<div>');
                        var $newAttachments = redrawAttachment(obj);
                        for (var mm = 0; mm < $newAttachments.length; mm++) {
                            controlVal.append($newAttachments[mm]);
                        }
                        controlVal = $('<div>').append(controlVal);
                        controlVal = controlVal.html();
                        break;
                    //controlVal = $('<div>').append(controlVal);
                    //return $('<div>').append(controlVal).html();
                    default:
                        if (controlVal == void 0 || controlVal == null) {
                            controlVal = '';
                        }
                        break;
                }
                return controlVal;
            };
            //重绘子表
            var getGridViewTable = function (obj) {
                var gridViewTable = '';
                var columnCount = 6;//每行最多展示列数，如果超过此数则将余下列折行
                var datafield = $(obj).attr('data-datafield');
                //var gridViewTitle = $('[data-datafield="' + datafield + '"]>span').text();//标题
                var gridViewTitle = $('[data-datafield="' + datafield + '"]').attr('data-displayname');//标题
                //var $gridViewTb = $('[data-datafield="' + datafield + '"]>table');//table
                var $gridViewTbTemp = $('[data-datafield="' + datafield + '"]').find('table[class="table table-bordered table-hover table-condensed"]');//table
                var $newTablePanel = $('<div></div>');//newTable的容器
                //去掉隐藏的列
                var $gridViewTb = $($gridViewTbTemp).clone();
                $gridViewTb.find('thead th').each(function (index, n) {
                    if ($(this).css('display') == 'none') {
                        $(this).remove();
                    } else {
                        //判断是否有不打印的列
                        var tdCtrl = $gridViewTb.find('tbody td').eq(index).find('div[class="sheet-control form-group"]');
                        if (tdCtrl != void 0) {
                            if ($(tdCtrl).attr('data-printable') != void 0 && $(tdCtrl).attr('data-printable') == 'false') {
                                $(this).remove();
                            }
                        }
                    }
                });
                var $gridViewThead = $gridViewTb.find('thead');
                //暂存状态移除子表最后按钮列
                $gridViewThead.find('th').each(function () {
                    if ($(this).hasClass('SheetGridView_BtnCol')) {
                        $(this).remove();
                    }
                });
                var $gridViewTh = $gridViewTb.find('thead th');//子表列标题
                var $gridViewTr = $gridViewTb.find('tbody>tr[data-objectid]');//子表行
                //移除子表中不显示的列
                $gridViewTr.find('td').each(function () {
                    if ($(this).css('display') == 'none') {
                        $(this).remove();
                    }
                    else {
                        var tdCtrl = $(this).find('div[class="sheet-control form-group"]');
                        if (tdCtrl != void 0) {
                            if ($(tdCtrl).attr('data-printable') != void 0 && $(tdCtrl).attr('data-printable') == 'false') {
                                $(this).remove();
                            }
                        }
                    }
                });
                var gridViewColumnCount = $gridViewTh.length;//子表列数
                var newTableCount = Math.ceil(gridViewColumnCount / columnCount);//单个子表拆分的table个数
                for (var t = 0; t < newTableCount; t++) {
                    var $newTable = $('<table style="width:100%;background-color:#f6f6f6" class="print-childTable">');
                    //table标题行，先取到合并的列数
                    var colspan = 1;
                    if (t == newTableCount - 1) {
                        //最后一个子表
                        colspan = gridViewColumnCount % columnCount == 0 ? columnCount : gridViewColumnCount % columnCount;
                    } else {
                        //非最后一个子表，列数为columnCount
                        colspan = columnCount;
                    }
                    //标题行
                    var $newTableTitle = $('<tr><td style="border:none" colspan="' + colspan + '" class="print-childTable-title" >' + gridViewTitle + '</td></tr>');
                    $newTable.append($newTableTitle);


                    //列头
                    var $newTableTh = $('<tr></tr>');
                    var width = 100 / colspan;
                    for (var j = 0; j < colspan; j++) {
                        $newTableTh.append($('<td style="border-left:none;width:' + width + '%"></td>').append($gridViewTh.eq(j + t * columnCount).find('div').text()));
                    }
                    $newTable.append($newTableTh);
                    //单元格
                    var startTdIndex = t * columnCount;//开始单元格
                    var endTdIndex = startTdIndex + colspan;//结束单元格
                    for (var k = 0; k < $gridViewTr.length; k++) {
                        //每一行
                        var $tr = $gridViewTr.eq(k);
                        var tr_objectId = $tr.attr('data-objectid');
                        var $newTableTr = $('<tr></tr>');
                        for (var l = startTdIndex; l < endTdIndex; l++) {
                            var $newTableTd = $('<td></td>');
                            if (l == startTdIndex) {
                                $newTableTd.css('border-left', 'none');
                            }
                            //var $tdSheetCtrl = $('tr[data-objectid="' + tr_objectId + '"]>td').eq(l).find('.sheet-control');
                            //var $tdSheetCtrl = $tr.find('td').eq(l).find('.sheet-control');
                            var $tdSheetCtrl = $tr.children('td').eq(l).find('.sheet-control');
                            if ($tdSheetCtrl.length > 0) {
                                $newTableTd.append(getControlValue($tdSheetCtrl));
                                $newTableTr.append($newTableTd);
                            }
                        }
                        $newTable.append($newTableTr);
                    }
                    $newTablePanel.append($newTable);
                }
                gridViewTable = $newTablePanel.find('table');
                return gridViewTable;
            };
            var agree = true;
            //获取审批记录
            var water = '';
            var getComment = function (obj) {
                var commentInfo = [];
                var $comment = $(obj);
                if ($comment && $comment.length > 0) {
                    //var agree = true;
                    var $newCommentTable = $('<table  style="width:100%;table-layout:fixed">');
                    $comment.each(function () {
                        var $commentCtrl = $(this).FormComment();
                        var comments = $commentCtrl.GetCommentValue();
                        $newCommentTable.append('<tr><td rowspan="' + comments.length + 1 + '" style="text-align:center;" class="col-md-2 col-sm-2 col-xs-2">审批记录</td><td class="print-table-th">审批人</td><td class="print-table-th">审批节点</td><td class="print-table-th">审批结果</td><td class="print-table-th">审批意见</td><td class="print-table-th">审批时间</td></tr>');

                        for (var i = 0; i < comments.length; i++) {
                            if (i == comments.length - 1) {
                                agree = comments[i].Approval;
                            }
                            var $newCommentTr = $('<tr>');
                            var date = comments[i].ModifiedTime;//审批时间
                            var newDate = new Date(date);
                            var t = newDate.getTime() - 8 * 60 * 60 * 1000;
                            newDate = new Date(t);
                            var y = newDate.getFullYear();
                            var m = newDate.getMonth() + 1;
                            var d = newDate.getDate();
                            var h = newDate.getHours();
                            var mm = newDate.getMinutes();
                            var s = newDate.getSeconds();
                            newDate = y + '-' + (m < 10 ? ('0' + m) : m) + '-' + (d < 10 ? ('0' + d) : d) + ' ' + (h < 10 ? ('0' + h) : h) + ':' + (mm < 10 ? ('0' + mm) : mm);

                            var commentTd = '';

                            commentTd += '<td style="border-left:none;padding-left:6px" class="col-md-1 col-sm-1 col-xs-2"><span>' + comments[i].UserName + '</span></td>';
                            commentTd += '<td style="border-left:none;font-weight:bold" class="col-md-1 col-sm-1 col-xs-2">' + comments[i].ActivityDisplayName + '</td>';
                            commentTd += '<td style="border-left:none" class="col-md-1 col-sm-1 col-xs-1"><span>' + (comments[i].Approval ? "同意" : "不同意") + '</span></td>';
                            commentTd += '<td style="border-left:none" class="col-md-4 col-sm-4 col-xs-4"><span>' + comments[i].Text + '</span></td>';
                            commentTd += '<td style="border-left:none" class="col-md-2 col-sm-2 col-xs-2"><span>' + newDate + '</span></td>';
                            $newCommentTr.append(commentTd);
                            $newCommentTable.append($newCommentTr);
                        }
                    });
                    var $commentPanel = $('<div>').append($newCommentTable);
                }
                return $commentPanel.html();
            };
            //取页面内容
            var content = $('<div>').append($(window.document.body).children().clone());
            //移除页签
            content.find('nav').remove();
            content.find('.nav').remove();
            content.find('.nav-tabs-wrap').remove();
            content.find('script').remove();
            //移除drop-list
            content.find('.drop-list').remove();
            //页面标题
            //页面table
            var $newContent = $('<div>');//新的容器
            var $contentTable = $('<table class="print-table" style="table-layout:fixed">');
            //先判断是否有页签
            var rows = [];
            var tab = content.find('#SheetContent>.tab-content')
            if (tab && tab.length) {
                //有页签
                rows = tab.find('.tab-pane.active>div');
                var comments = content.find('#SheetContent >[data-datafield="Comments"]');
                rows.push(comments);
            } else {
                rows = content.find('#SheetContent>div');
            }
            //后台打印配置 
            var printConfig = $.SmartForm.ResponseContext.PrintConfig;
            var printCompanyName = true;
            var printComment = true;
            var printPrinter = true
            var printPrintTime = true;
            var printQrCode = true;
            if (printConfig != undefined) {
                printCompanyName = printConfig.PrintCompanyName;
                printComment = printConfig.PrintComment;
                printPrinter = printConfig.Printer;
                printPrintTime = printConfig.PrintTime;
                printQrCode = printConfig.PrintQrCode;
            }

            for (var i = 0; i < rows.length; i++) {
                var $row = $(rows[i]);
                if ($row.css('display') == 'none') {
                    continue;
                }
                if ($row.attr('data-printable') != void 0 && $row.attr('data-printable') == "false") {
                    continue;
                }
                var $contentTableTr = $('<tr>');
                if ($row.hasClass('sheet-control')) {
                    //控件
                    var controlKey = $row.attr('data-controlkey');
                    if (controlKey == 'FormGridView') {
                        //子表
                        var $contentTableTd = $('<td colspan="4" style="padding:0;height:auto!important;border-top:none;border-bottom:1px solid #fff;background-color:#f6f6f6!important;"></td>');
                        var $gridViewTable = getGridViewTable($row);
                        $contentTableTd.append($gridViewTable);
                        $contentTableTr.append($contentTableTd);
                    } else if (controlKey == 'FormComment') {
                        //审批
                        if (!printComment)
                            continue;
                        var commentInfo = getComment($row);
                        $contentTableTr.append('<td colspan="4" style="padding:0;" >' + commentInfo + '</td>');
                    } else {
                        //主表字段
                        var controlTitle = $row.find('.ControlTitle').text();
                        var controlValue = getControlValue($row);
                        $contentTableTr.append('<td class="col-sm-2 col-xs-2">' + controlTitle + '</td><td class="col-sm-10 col-xs-10" colspan="3">' + controlValue + '</td>');
                    }
                } else if ($row.hasClass('page-header')) {
                    //标题、描述
                    //如果后续没有printable的控件则不要显示标题(描述要显示)
                    if (!$row.hasClass('page-describle')) {
                        var printableControl = 0;//可打印控件数量
                        for (var j = i + 1; j < rows.length; j++) {
                            var laterRow = $(rows[j]);
                            if (laterRow.hasClass('sheet-control')) {
                                if (laterRow.attr('data-controlkey') == 'FormComment')
                                    continue;
                                if (laterRow.attr('data-printable') != void 0 && laterRow.attr('data-printable') == 'false')
                                    continue;
                            }
                            //if ($(rows[j]).attr('data-printable') != void 0 && $(rows[j]).attr('data-printable') == "false") {
                            //    continue;
                            //}
                            printableControl++;
                        }
                        //如果后续没有要打印的控件则不打印标题
                        if (printableControl == 0) {
                            continue;
                        }
                    }
                    var controlValue = $row.find('strong');
                    var align = $row.css('text-align');
                    //$contentTableTr.append('<td colspan="4" style="font-size:10px;color:#999">' + controlValue.html() + '</td>');
                    if ($row.hasClass('page-describle')) {
                        //描述
                        $contentTableTr.append('<td colspan = "4" style="font-size:10px;color:#999;text-align:' + align + '">' + controlValue.html() + '</td>');
                    } else {
                        //标题
                        $contentTableTr.append('<td colspan = "4" style="font-size:14px;color:#999;background-color:#f6f6f6!important;text-align:' + align + '">' + controlValue.html() + '</td>');
                    }
                } else {
                    //一行两列
                    var emptyCtrlCount = 0;//记录不可见和不打印字段数量,如果两个字段都是不可见或不打印则不显示一行两列
                    $row.find('.col-sm-6').each(function () {
                        var controlTitle = $(this).find('.ControlTitle').text();
                        var $control = $(this).find('.row.sheet-control.form-group');
                        if ($control.css('display') == 'none' || $control.attr('visible') == 'false') {
                            //如果一行两列内字段不可见则增加一个空的td
                            emptyCtrlCount++;
                            $contentTableTr.append('<td class="col-sm-6 col-xs-6" colspan="2"></td>');
                            return true;
                        } else {
                            if ($control.attr('data-printable') != void 0 && $control.attr('data-printable') == "false") {
                                emptyCtrlCount++;
                                $contentTableTr.append('<td class="col-sm-6 col-xs-6" colspan="2"></td>');
                                return true;
                            }
                        }
                        var controlValue = '';
                        if ($control && $control.length > 0) {
                            controlValue = getControlValue($control);
                        }
                        $contentTableTr.append('<td class="col-sm-2 col-xs-2">' + controlTitle + '</td><td class="col-sm-4 col-xs-4">' + controlValue + '</td>');
                    });
                    if (emptyCtrlCount == 2) {
                        continue;
                    }
                }
                $contentTable.append($contentTableTr);
            }

            //判断是不是流程表单,增加审批水印
            var $waterMark = '';
            var isWorkflow = this.ResponseContext.ReturnData.WorkflowInstanceId.Value;
            if (isWorkflow) {
                switch ($.SmartForm.ResponseContext.WorkflowState) {
                    case 0:
                        break;
                    case 1:
                        break;
                    case 2://正在运行
                        //审批中
                        $waterMark = $('<div class="print-watermark"><img src="../../../../Content/Images/approve/runing.png" width="120" height="120"></div>');
                        break;
                    case 3://正在结束
                        break;
                    case 4://已完成
                        if (!agree) {
                            //审批不通过
                            $waterMark = $('<div class="print-watermark"><img src="../../../../Content/Images/approve/disagree.png" width="120" height="120"></div>');
                        } else {
                            //审批通过
                            $waterMark = $('<div class="print-watermark"><img src="../../../../Content/Images/approve/agree.png" width="120" height="120"></div>');
                        }
                        break;
                    case 5://已取消
                        //流程取消
                        $waterMark = $('<div class="print-watermark"><img src="../../../../Content/Images/approve/cancel.png" width="120" height="120"></div>');
                        break;
                    default:

                }
            }
            $newContent.append($waterMark);
            var printer = '';//打印人
            var companyName = '';//企业名称
            var qrCodeUrl = '';//二维码地址
            if (printCompanyName || printPrinter || printQrCode) {
                //获取打印的相关信息，包括打印人，企业名称，打印二维码需要的数据
                var getQueryString = function (paramName) {
                    var reg = new RegExp("(^|&)" + paramName + "=([^&]*)(&|$)");
                    var r = window.location.search.substr(1).match(reg);
                    if (r != null) {
                        return unescape(r[2]);
                    }
                    return null;
                };
                var schemaCode = getQueryString("SchemaCode");
                var bizObjectId = getQueryString("BizObjectId");
                var appCode = '';//应用编码
                var agentId = '';
                var corpId = '';
                var suiteKey = '';
                var isTest = false;//是否是测试环境
                var scanUrl = '';//考虑用于生成二维码的短地址，暂时没有使用
                //取当前用户
                $.ajax({
                    type: 'POST',
                    url: '/Sheet/GetPrintInfo',
                    data: {
                        SchemaCode: schemaCode,
                        BizObjectId: bizObjectId
                    },
                    success: function (data) {
                        if (data.Successful) {
                            printer = data.Result.UserName;
                            companyName = data.Result.CompanyName;
                            appCode = data.Result.AppCode;
                            agentId = data.Result.AgentId;
                            corpId = data.Result.CorpId;
                            suiteKey = data.Result.SuiteKey;
                            isTest = data.Result.IsTest;
                            //scanUrl = data.Result.URL;
                        }
                    },
                    dataType: 'json',
                    async: false
                });
                var sheetUrl = 'https://www.h3yun.com/mobile/?appid=';
                if (isTest) {
                    sheetUrl = 'https://test.h3yun.com/mobile/?appid=';
                }
                sheetUrl += appCode + '&CorpId=' + corpId + '&SchemaCode=' + schemaCode + '&BizObjectId=' + bizObjectId + '&MessageType=InstanceFinished';
                if (agentId) {
                    sheetUrl += '&AgentId=' + agentId;
                } else {
                    if (suiteKey) {
                        sheetUrl += '&IsIsv=1&SuitKey=' + suiteKey;
                    }
                    sheetUrl += '&AgentId=';
                }
                qrCodeUrl = sheetUrl;
            }
            if (printCompanyName) {
                //插入企业名称
                $newContent.append('<div class="print-schema-title">' + companyName + '</div>');
            }
            //插入表单名称
            var schemaDisplayName = $.SmartForm.ResponseContext.DisplayName;
            var $displayName = $('<div class="print-schema-title">' + schemaDisplayName + '</div>');
            $newContent.append($displayName);
            //全局水印
            if (water) {
                var $marker = $('<div id="mymasker" style="background-image:url(' + water + ')!important;"></div>');
            }
            //插入整体表格
            $newContent.append($contentTable);
            //插入打印信息
            //打印人/打印时间
            if (printPrinter || printPrintTime || printQrCode) {
                var printTime = '';
                if (printPrintTime) {
                    //取打印时间
                    var date = new Date();
                    printTime = date.toLocaleString();
                }
                //获取等分格
                var showCount = 3;
                if (!printPrinter) {
                    showCount--;
                }
                if (!printPrintTime) {
                    showCount--;
                }
                if (!printQrCode) {
                    showCount--;
                }
                var gridCol = 12 / showCount;

                var printInfo = $('<div class="print-info container-fluid sheet_container" style="padding-left:0;padding-right:0;"></div>');
                var printInfoRow = $('<div class="row sheet-control form-group"></div>');
                if (printPrinter) {
                    printInfoRow.append('<div class="col-sm-' + gridCol + ' col-xs-' + gridCol + ' col-md-' + gridCol + '">打印人:' + printer + '</div>');
                }
                if (printTime) {
                    printInfoRow.append('<div class="col-sm-' + gridCol + ' col-xs-' + gridCol + ' col-md-' + gridCol + '">打印时间:' + printTime + '</div>');
                }
                if (printQrCode) {
                    printInfoRow.append('<div class="col-sm-' + gridCol + ' col-xs-' + gridCol + ' col-md-' + gridCol + '"><div id="printQrCode" style="text-align:right"></div><div style="text-align:right"><div style="position:absolute;right:15px;width:160px;text-align:center">请使用钉钉扫码</div></div></div>');
                }
                printInfo.append(printInfoRow);

                //if (printPrinter && printPrintTime) {
                //    printInfo = $('<div class="print-info container-fluid sheet_container" style="padding-left:0;padding-right:0;"><div class="row sheet-control form-group"><div class="col-sm-3 col-xs-3 col-md-3">打印人:' + printer + '</div><div class="col-sm-4 col-xs-4 col-md-4">打印时间:' + printTime + '</div><div class="col-sm-5 col-xs-5 col-md-5"><div id="printQrCode" style="text-align:right"></div><div style="text-align:right"><div style="position:absolute;right:15px;width:160px;text-align:center">请使用钉钉扫码</div></div></div></div></div>');
                //} else if (!printPrinter) {
                //    printInfo = $('<div class="print-info container-fluid sheet_container" style="padding-left:0;padding-right:0;"><div class="row sheet-control form-group"><div class="col-sm-3 col-xs-3 col-md-3">打印时间:' + printTime + '</div><div class="col-sm-4 col-xs-4 col-md-4"></div></div></div>');
                //}
                $newContent.append(printInfo);
            }

            var printWindow = window.parent.open('/Sheet/Print/');
            printWindow.document.write('<link href="/Content/bootstrap.min.css" rel="stylesheet">');
            printWindow.document.write('<link href="/Content/print.css" rel="stylesheet">');
            //printWindow.document.write('<style>@page{@bottom-left:{margin:10pt 0 30pt 0;border:.25pt solid;background-color:red}}</style>');
            printWindow.document.write('<script src="../../Scripts/jquery-1.11.1.min.js"></script>');
            printWindow.document.write('<script src="../../Scripts/plugins/qrCode/jquery.qrcode.min.js"></script>');
            printWindow.document.write($newContent.html());
            printWindow.document.write('<body  scroll="no" style="font-size:12px"></body>');
            printWindow.document.write('<div></div>');
            printWindow.document.write('<title>打印</title>');
            //如果二维码参数不对不要生成二维码？
            if (printQrCode)
                printWindow.document.write('<script>$("#printQrCode").qrcode({width:160,height:160,text:"' + qrCodeUrl + '"});</script>');

            printWindow.document.write('<script>setTimeout(function(){window.print()},50)</script>');

            //printWindow.print();
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf('Firefox') > -1) {
                printWindow.print();
            }
            //关闭打印页面（不管是点击“打印”还是“取消”，点击后2s自动关闭打印页面）
            //需要注意页面关闭后打印是否继续？如果window关闭了仍然可以打印则可以将关闭页面时间缩短
            var close = '<script>setTimeout("window.close()",100)</script>';
            printWindow.document.write(close);
            return;
        }
    }
});
//#endregion

//#region 取回流程 RetrieveInstance
$.Buttons.RetrieveInstance = function (element, option, sheetInfo) {
    return $.Buttons.RetrieveInstance.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.RetrieveInstance.Inherit($.Buttons.BaseButton, {
    PreRender: function () {
        this.constructor.Base.PreRender();
        //this.OnActionPreDo = function () {
        //    return confirm("确定执行取回流程操作?");
        //}
    },
    DoAction: function () {
        $.SmartForm.ConfirmAction("确定执行撤销流程操作", function () {
            $.SmartForm.RetrieveInstance(this);
        });
    }
});
//#endregion

//#region 转发 Forward
$.Buttons.Forward = function (element, option, sheetInfo) {
    return $.Buttons.Forward.Base.constructor.call(this, element, option, sheetInfo);
};
$.Buttons.Forward.Inherit($.Buttons.BaseButton, {
    PreRender: function () {
        this.constructor.Base.PreRender();
    },
    DoAction: function () {
        $.SmartForm.Forward(this);
    }
});
//#endregion

