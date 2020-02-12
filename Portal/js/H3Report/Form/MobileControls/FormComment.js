// SheetComment控件
(function ($) {
    //控件执行
    $.fn.FormComment = function () {
        return $.ControlManager.Run.call(this, "FormComment", arguments);
    };

    $.Controls.FormComment = function (element, options, sheetInfo) {
        $.Controls.FormComment.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.Controls.FormComment.Inherit($.Controls.BaseControl, {
        Render: function () {
            var that = this;
            that.Colors = ['#4DA9EB', '#00B25E', '#F19333', '#F06065', '#5C7197', "#9D88BF"];
            that.ColorLength = that.Colors.length;

            this.Value = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            //业务逻辑 如果是审批人则显示发起人图像并展示是谁在审批
            //如果是发起人则展示审批人图像（如果是多人，则图像叠加）并展示等候谁审批
            //如果已结束，则显示发起人图像并展示已完成
            $(this.Element).addClass("SheetComment").removeClass('sheet-control');
            $(this.$InputBody).addClass('bd-bot');
            //图标颜色处理 todo

            //获取所有的待办人
            this.TodoUsers = this.GetTodoUsers(this.ResponseContext.WorkItems);
            this.$ApproveHeader = $('<div class="approve-head "></div>');

            //左侧图像处理
            this.ApproveUserHead = $('<div class="approve-user-head"></div>');
            

            //中间发起人、审批人、等候谁审批信息处理
            this.$userInfoContanier = $('<div class="userinfo-container"></div>');

            this.$expandDiv = $('<div class="comment-expand">查看全部<i class="icon icon-arrow-down" style="margin-left:3px;"></i></div>');
            this.$collapseDiv = $('<div class="comment-collapse" style="display:none;">收起<i class="icon icon-arrow-up" style="margin-left:3px;"></i></div>');
            this.$ApprovalTimeLineBox = $('<div class="approval-tline-box" style="display:none;"></div>');
            this.$ApprovalTLine = $('<div class="approval-tline bd-top"></div>');
            this.$ApprovalTimeLineBox.append(this.$ApprovalTLine);

            this.$UserName = $('<p class="username"></p>');
            this.$Status = $('<p class="status"></p>');
            this.$userInfoContanier.append(this.$UserName);
            this.$userInfoContanier.append(this.$Status);

            this.$ApproveHeader.append(this.ApproveUserHead);
            this.$ApproveHeader.append(this.$userInfoContanier);
            this.$ApproveHeader.append(this.$expandDiv);
            this.$ApproveHeader.append(this.$collapseDiv);

            if (this.ResponseContext.BizObjectStatus && this.ResponseContext.BizObjectStatus == 1) {
                //流程已经结束
                if (this.ResponseContext.WorkItems && this.ResponseContext.WorkItems.length > 0) {
                    var dingTalkAccount = this.ResponseContext.WorkItems[0].DingTalkAccount;
                    var userName = this.ResponseContext.WorkItems[0].UserName;
                    //var avator = this.ResponseContext.WorkItems[0].UserProfilePhotoUrl;
                    //先统一显示名字 todo
                    this.ApproveUserHead.html(userName.substr(userName.length - 2)).css('background-color', '#4DA9EB');
                    this.$UserName.html(userName);
                    this.ApproveUserHead.attr('data-dingtalkaccount', dingTalkAccount);
                }

                this.$Status.html('已结束');
            } else {
                //如果是自己处理，已不显示钉
                var isHandler=$(this.TodoUsers).filter(function(index,obj){
                    return H3Config.userId == obj.UserId;
                });
                if (isHandler.length > 0) {
                    //本人处理
                    //var avator = this.ResponseContext.WorkItems[0].UserProfilePhotoUrl;
                    //先统一显示名字 显示发起人名字
                    var originator = this.ResponseContext.WorkItems[0].UserName;
                    var dingId = (this.ResponseContext.WorkItems[0].DingTalkAccount != "" && this.ResponseContext.WorkItems[0].DingTalkAccount != 'undefined') ? this.ResponseContext.WorkItems[0].DingTalkAccount.substr(0, this.ResponseContext.WorkItems[0].DingTalkAccount.indexOf('.')) : "";
                    this.ApproveUserHead.html(originator.substr(originator.length - 2)).css('background-color', '#4DA9EB');
                    this.$UserName.html(originator);
                    this.ApproveUserHead.attr('data-dingtalkaccount', dingId);
                    if (this.TodoUsers.length > 1) {
                        var approvalUsers = "我、";
                        for(var i=0,len=this.TodoUsers.length;i<len;i++){
                            if (this.TodoUsers[i].UserId != H3Config.userId) {
                                approvalUsers += this.TodoUsers[i].UserName;
                                break;
                            }
                        }
                        if (this.ResponseContext.WorkItemType == 2) {
                            this.$Status.html('等待' + approvalUsers + "等审批");
                        } else {
                            this.$Status.html('等待' + approvalUsers + "等处理");
                        }
                       
                    } else {
                        if (this.ResponseContext.WorkItemType == 2) {
                            this.$Status.html("等待我审批");
                        } else {
                            this.$Status.html("等待我处理");
                        }
                    }
                } else {
                    //非本人处理 加钉催办 左侧图标为组合图标 todo
                    // 先还是显示发起人图标
                    var originator = this.ResponseContext.WorkItems[0].UserName;
                    var dingId = (this.ResponseContext.WorkItems[0].DingTalkAccount != "" && this.ResponseContext.WorkItems[0].DingTalkAccount != 'undefined') ? this.ResponseContext.WorkItems[0].DingTalkAccount.substr(0, this.ResponseContext.WorkItems[0].DingTalkAccount.indexOf('.')) : "";
                    this.ApproveUserHead.html(originator.substr(originator.length - 2)).css('background-color', '#4DA9EB');
                    this.$UserName.html(originator);
                    this.ApproveUserHead.attr('data-dingtalkaccount', dingId);
                    if (this.TodoUsers.length > 1) {
                        if (this.ResponseContext.WorkItemType == 2) {
                            this.$Status.html('等待' + this.TodoUsers[0].UserName + '、' + this.TodoUsers[1].UserName + "等审批");
                        } else {
                            this.$Status.html('等待' + this.TodoUsers[0].UserName + '、' + this.TodoUsers[1].UserName + "等处理");
                        }
                    }
                    else {
                        if (this.TodoUsers.length == 1) {
                            if (this.ResponseContext.WorkItemType == 2) {
                                this.$Status.html('等待' + this.TodoUsers[0].UserName + '审批');
                            } else {
                                this.$Status.html('等待' + this.TodoUsers[0].UserName + '处理');
                            }
                            
                        } 
                        
                    }
                    //添加发钉图标 todo
                    if (H3Config.userId == this.ResponseContext.WorkItems[0].UserId) {
                        var $ding = $('<span class="icon icon-ding" style="color:#38adff;margin-left:25px;"></span>');
                        this.$UserName.append($ding);
                        //绑定事件
                        $ding.bind('click', function () {
                            var dingUsers = [];
                            for (var i = 0, len = that.TodoUsers.length; i < len; i++) {
                                dingUsers.push(that.TodoUsers[i].DingId);
                            }
                            var text = H3Config.userName + '催您审批他的' + $.SmartForm.ResponseContext.DisplayName + '流程';
                            var title = "待办任务通知";
                            var url = null;//打开流程的链接
                            if (H3Config.suiteKey) {
                                //ISV接入
                                url = H3Config.hostAddress + "/Mobile?corpid=" + H3Config.corpId + '&MessageType=Urge&suitekey=' + H3Config.suiteKey + '&SchemaCode=' + $.SmartForm.ResponseContext.SchemaCode + '&BizObjectId=' + $.SmartForm.ResponseContext.BizObjectId;
                            } else {
                                //企业接入
                                url = H3Config.hostAddress + "/Mobile?corpid=" + H3Config.corpId + '&MessageType=Urge&agentid=' + H3Config.agentId + '&SchemaCode=' + $.SmartForm.ResponseContext.SchemaCode + '&BizObjectId=' + $.SmartForm.ResponseContext.BizObjectId;
                            }
                            var subText = H3Config.userName + "的" + $.SmartForm.ResponseContext.DisplayName + '流程需要您审批，请点击查看详情';
                            var imageUrl = H3Config.hostAddress + "/Content/Images/Task.png";
                            $.IPostLinkDing(dingUsers, H3Config.corpId, text, title, url, imageUrl, subText, null, null);

                        });
                    }
                    
                }
            }

            this.ApproveUserHead.bind('click', function () {
                var dingId = $(this).attr('data-dingtalkaccount');
                if (dingId) {
                    if (dingId.indexOf('.') > -1) {
                        $.IShowUserInfo(dingId.substr(0, dingId.indexOf('.')), H3Config.corpId);
                    } else {
                        $.IShowUserInfo(dingId, H3Config.corpId);
                    }
                    
                }
            });

            this.$InputBody.append(this.$ApproveHeader);
            this.$InputBody.append(this.$ApprovalTimeLineBox);
            this.$expandDiv.bind('click', function () {
                that.$expandDiv.hide();
                that.$collapseDiv.show();
                that.$ApprovalTimeLineBox.show();
                var siblings = $(this).parent().siblings();
                if (siblings && siblings.length > 0) {
                    siblings.show();
                    if ($('.time-node').length <= 0) {
                        //添加历史,error这个操作可以考虑异步处理;
                        for (var i = 0, len = that.ResponseContext.WorkItems.length; i < len; i++) {
                            var workitem = that.ResponseContext.WorkItems[i];
                            var name = workitem.UserName;
                            var delegant = workitem.Delegant;
                            var avator = workitem.UserProfilePhotoUrl;
                            var displayName = workitem.ActivityDisplayName;
                            var activityCode = workitem.ActivityCode;
                            var itemType = workitem.ItemType;
                            var finishTime = workitem.FinishTime;
                            var dingAccount = workitem.DingTalkAccount;
                            var approval = workitem.Approval;
                            var tmpUser = workitem.UserId;
                            var state = workitem.State;
                            var tokenId = workitem.TokenId;
                            var $timeNode = $('<div class="time-node"></div>');
                            var $nodeStatus = $('<div class="node-status"></div>');
                            //判断状态 办理中  已同意  已驳回
                            var $imgStats =null;
                            if (state == 1 || state==0) {
                                $imgStats = $('<img class="action-icon" src="/Content/Images/daiban.png" />');
                            } else {
                                if(approval==0){
                                    //驳回
                                    $imgStats = $('<img class="action-icon" src="/Content/Images/bohui.png" />');
                                }else{
                                    $imgStats = $('<img class="action-icon" src="/Content/Images/submit.png" />');
                                }
                            }
                            $nodeStatus.append($imgStats);
                            $timeNode.append($nodeStatus);
                            
                            var $nodeBox = $('<div  class="nodebox"></div>');
                            var $arrow = $('<div class="arrow bw"></div>');
                            $nodeBox.append($arrow);//添加指示箭头

                            var $nodeBoxInner = $('<div class="nodebox-inner"></div>');
                            //添加处理人图像
                            var $handlerAvatar =null;
                            if (avator) {
                                $handlerAvatar = $('<div><img class="node-avatar" src="' + avator + '"/></div>').attr('data-dingid', dingAccount.substr(0, dingAccount.indexOf('.')));
                                
                            } else {
                                $handlerAvatar = $('<div><div class="node-avatar" style="background-color:' + that.Colors[i % that.ColorLength] + '">' + name.substr(name.length - 2) + '</div></div>').attr('data-dingid', dingAccount.substr(0, dingAccount.indexOf('.')));
                            }
                            $nodeBoxInner.append($handlerAvatar);
                            $($handlerAvatar).click(function () {
                                var account = $(this).attr('data-dingid');
                                if (account) {
                                    $.IShowUserInfo(account, H3Config.corpId);
                                }
                            });
                            //审批人 此处需要判断是否是本人，如果是本人则显示我 --此处再加上流程节点名称
                            var $username = null;
                            if (tmpUser == H3Config.userId) {
                                $username = $('<p class="username"><span>我</span><span maxLength=10 class="activity-name">-' + displayName + '</span></p>');
                                $nodeBoxInner.append($username);
                            } else {
                                $username = $('<p class="username"><span>' + name + '</span><span maxLength=10 class="activity-name">-' + displayName + '</span></p>');
                                $nodeBoxInner.append($username);
                            }
                            //审批结果
                            var $result = $('<p class="result-line"></p>');
                            //判断状态
                            var $status = null;
                            if (tokenId == 1) {
                                $status = $('<span></span>').html('发起申请');
                                $timeNode.addClass('submit');
                            } else {
                                //如果是转发，则显示已转发给**，请**审批
                                if (delegant) {
                                    var delegantName = that.GetDelegantName(delegant, that.ResponseContext.WorkItems);
                                    $status = $('<span></span>').html('已转发给' + delegantName);
                                    $timeNode.addClass('agree');
                                } else {
                                    //如果是审批环节
                                    if (itemType == 2) {
                                        if (state == 0 || state == 1) {
                                            $status = $('<span></span>').html('审核中');
                                            $timeNode.addClass('agree');
                                        } else {
                                            if (approval == 0) {
                                                //已驳回
                                                $status = $('<span></span>').html('已驳回');
                                                $timeNode.addClass('agree');
                                            } else if (approval == -1) {
                                                $status = $('<span></span>').html('已取消');
                                                $timeNode.addClass('agree');
                                            } else {
                                                $status = $('<span></span>').html('已同意');
                                                $timeNode.addClass('agree');
                                            }
                                        }

                                    } else {
                                        if (state == 0 || state == 1) {
                                            $status = $('<span></span>').html('处理中');
                                        } else {
                                            if (itemType == 3) {
                                                $status = $('<span></span>').html('已阅');
                                            } else {
                                                $status = $('<span></span>').html('已提交');
                                            }

                                        }
                                        $timeNode.addClass('submit');

                                    }
                                }
                                
                            }
                            $result.append($status);
                            
                            //审批原因，只有审批环节才存在
                            var $reason = null;
                            var comment = that.GetComment(tmpUser, activityCode, tokenId);
                            if (comment) {
                                $reason = $('<span class="reason"></span>').html('(' + comment + ')');
                            } else {
                                $reason = $('<span class="reason"></span>');
                            }
                            $result.append($reason);
                            $nodeBoxInner.append($result);
                            //处理时间
                            var $operateTime = null;
                            if (state != 1 && state!=0) {
                                $operateTime = $('<div class="operatetime">').html(finishTime);
                            } else {
                                $operateTime = $('<div class="operatetime"></div>');
                            }
                            $nodeBoxInner.append($operateTime);
                            //待办状态添加发钉标志
                            if (state == 1 || state==0) {
                                //是否当前待办人，如果不是添加钉
                                if (H3Config.userId != tmpUser && H3Config.userId == that.ResponseContext.WorkItems[0].UserId) {
                                    var $ding = $('<span class="icon icon-ding box-arrow-l" style="color:#38adff;margin-right:10px;"></span>');
                                    $nodeBoxInner.append($ding);
                                    if (dingAccount) {
                                        $nodeBox.attr('data-ding', 'true').attr('data-dingid', dingAccount.substr(0, dingAccount.indexOf('.')));
                                    }
                                } else {
                                    if (dingAccount) {
                                        $nodeBox.attr('data-ding', 'false').attr('data-dingid', dingAccount.substr(0, dingAccount.indexOf('.')));
                                    }
                                }
                            } else{
                                //绑定事件,已完成的人直接查看人员信息
                                if (dingAccount) {
                                    $nodeBox.attr('data-ding', 'false').attr('data-dingid', dingAccount.substr(0, dingAccount.indexOf('.')));
                                }
                                
                            }
                            $nodeBox.append($nodeBoxInner);
                            $timeNode.append($nodeBox);
                            that.$ApprovalTLine.append($timeNode);
                        }
                        //绑定ding事件
                        $('span.icon-ding').each(function () {
                            $(this).click(function (e) {
                                var dingUsers = [];
                                for (var i = 0, len = that.TodoUsers.length; i < len; i++) {
                                    dingUsers.push(that.TodoUsers[i].DingId);
                                }
                                var text = H3Config.userName + '催您审批他的' + $.SmartForm.ResponseContext.DisplayName + '流程';
                                var title = "待办任务通知";
                                var url = null;//打开流程的链接
                                if (H3Config.suiteKey) {
                                    //ISV接入
                                    url = H3Config.hostAddress + "/Mobile?corpid=" + H3Config.corpId + '&MessageType=Urge&suitekey=' + H3Config.suiteKey + '&SchemaCode=' + $.SmartForm.ResponseContext.SchemaCode + '&BizObjectId=' + $.SmartForm.ResponseContext.BizObjectId;
                                } else {
                                    //企业接入
                                    url = H3Config.hostAddress + "/Mobile?corpid=" + H3Config.corpId + '&MessageType=Urge&agentid=' + H3Config.agentId + '&SchemaCode=' + $.SmartForm.ResponseContext.SchemaCode + '&BizObjectId=' + $.SmartForm.ResponseContext.BizObjectId;
                                }
                                var subText = H3Config.userName + "的" + $.SmartForm.ResponseContext.DisplayName + '流程需要您审批，请点击查看详情';
                                var imageUrl = H3Config.hostAddress + "/Content/Images/Task.png";
                                $.IPostLinkDing(dingUsers, H3Config.corpId, text, title, url, imageUrl, subText, null, null);
                                e.stopPropagation();
                                
                            });
                        });
                    }
                }
                
            });
            this.$collapseDiv.bind('click', function () {
                that.$collapseDiv.hide();
                that.$expandDiv.show();
                that.$ApprovalTimeLineBox.hide();
            });
            
        },

        GetDelegantName:function(delegant,workitems){
            var l=workitems.length;
            for(var i=l-1;i>=0;i--){
                if(workitems[i].UserId==delegant){
                    return workitems[i].UserName;
                }
            }
            return null;
        },

        GetComment: function (userId, activityCode, tokenId) {
            if (this.Value && this.Value.length > 0) {
                for (var i = 0, len = this.Value.length; i < len; i++) {
                    var comment = this.Value[i];
                    if (comment.UserId == userId && comment.Activity == activityCode && comment.TokenId == tokenId) {
                        return comment.Text;
                    }
                }
            }
            return "";
        },

        GetTodoUsers: function (worksheets) {
            var users = [];
            if(worksheets){
                for (var i = 0, len = worksheets.length; i < len; i++) {
                    if (worksheets[i].State == 1 || worksheets[i].State == 0) {
                        var tmp=$(users).filter(function(index,obj){
                            return obj.UserId==worksheets[i].UserId;
                        });
                        if(tmp.length==0){
                            var user={
                                UserId:worksheets[i].UserId,
                                UserName:worksheets[i].UserName,
                                DingId: (worksheets[i].DingTalkAccount != "" && worksheets[i].DingTalkAccount != 'undefined') ? worksheets[i].DingTalkAccount.substr(0, worksheets[i].DingTalkAccount.indexOf('.')) : ""
                            };
                            users.push(user);
                        }
                        
                    }
                }
            }
            return users;
        },

        // 数据验证
        Validate: function (effective, initValid) {
            return true;
        },

        GetValue: function () {
            return $(this.CommentInput).val() == null ? "" : $(this.CommentInput).val();
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            result = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!result) {
                return {};
            }

            var IsNewComment = false;
            if (this.MyComment == void 0) {
                if (!this.GetValue()) return {};
                this.MyComment = {
                    CommentID: $.IGuid(),
                    UserName: "我的意见",
                    DateStr: new Date().toString(),
                    Text: this.GetValue(),
                    //  Avatar: "~/Content/Images/avator.jpg"
                };
                IsNewComment = true;
                this.AddCommentItem(this.MyComment);
            }
            else if (this.MyComment.Text == this.GetValue()) {
                return {};
            }
            else {
                $("#" + this.MyComment.CommentID).find("div.comment-text").html(this.GetValue());
            }

            //添加校验，如果值没变，就不会需要提交
            result = {
                CommentID: this.MyComment.CommentID,
                Text: this.GetValue(),
                IsNewComment: IsNewComment,
                SetFrequent: this.IsMobile ? false : $(this.SaveFrequentCk).is(":checked")
            };
            return result;
        },

        //历史评论
        InitHistoryComment: function () {
            if (this.Value != null && this.Value.length > 0) {
                for (var i = 0; i < this.Value.length; i++) {
                    if (this.LastestCommentOnly && i < this.Value.length - 1) continue;
                    var commentObject = this.Value[i];
                    if (commentObject.IsMyComment) {
                        this.MyComment = commentObject;
                        this.MyComment.UserName = "我的评论";
                    }
                    var isLast = i == this.Value.length - 1;
                    this.AddCommentItem(commentObject, isLast);
                }
            }
            else if (!this.Editable) {
                $(this.Element).hide();
            }
        },

        //添加评论
        AddCommentItem: function (commentObject, isLast) {
            if (this.PanelBody == void 0) {
                var CommentsPanel = $("<div class='widget-comments bordered' style='padding:10px; background:#f6f6f6; border-bottom:1px solid #e4e4e4;'></div>");
                this.PanelBody = $("<div class='panel-body'></div>");
                CommentsPanel.append(this.PanelBody);//历史审批容器
                $(this.$InputBody).prepend(CommentsPanel);
            }
            var commentItem;
            if (isLast) {
                commentItem = $("<div class='comment' style='overflow:hidden;margin-top: 0; padding: 5px 0;'></div>").attr("id", commentObject.CommentId);
            }
            else {
                commentItem = $("<div class='comment' style='overflow:hidden;margin-top: 0; padding: 5px 0; border-bottom: 1px solid #e4e4e4;'></div>").attr("id", commentObject.CommentId);
            }
            //var avatar = $("<img src='/Content/Images/avatar.jpg' class='img-circle'></img>").css("float", "left").css("border-radius","50%").width("50px");
            var commentBody = $("<div class='comment-body'></div>");//.css("margin-left", "60px");
            var userName = commentObject.UserName;
            if (commentObject.UserParentName) {
                userName = commentObject.UserParentName + "." + userName;
            }

            if (commentObject.DelegantName) {
                userName += "(" + commentObject.DelegantName + "委托)";
            }
            var commenby = $("<div class='comment-by'><a href='javascript:void(0)' style='color:#565656;'>" + userName + "</a> </div>")
            if (commentObject.ActivityDisplayName) {
                commenby.append("[<a href='javascript:void(0)' style='color:#565656;'>" + commentObject.ActivityDisplayName + "</a>]");
            }
            var commenttext = $("<div class='comment-text'></div>");
            if (commentObject.Text) {
                commenttext.append(commentObject.Text);
            }
            //审批时间
            var dateStr = "";
            if (!commentObject.ModifiedTime) return;
            var modifiedTime = commentObject.ModifiedTime.replace('T', ' ');
            var modifyData = convertStrToDate(modifiedTime);
            if (modifyData) {
                var today = new Date();
                if (modifyData.getFullYear() == today.getFullYear()
                    && modifyData.getMonth() == today.getMonth()
                    && modifyData.getDate() == today.getDate()) {
                    dateStr = "今天 " +  this.formatDate(modifyData.getHours()) + ":" + this.formatDate(modifyData.getMinutes());
                }
                else {
                    dateStr =this.formatDate(modifyData.getFullYear())+'-'+ this.formatDate(modifyData.getMonth()+1) + "-" + this.formatDate(modifyData.getDate()) + " " + this.formatDate(modifyData.getHours()) + ":" + this.formatDate(modifyData.getMinutes());
                }
            }

            commenby.append("<span style='font-size:12px;float:right;color:#cacaca;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>" + dateStr + "</span>");
            commentBody.append(commenby);
            commentBody.append(commenttext);
            commentItem.append(commentBody);
            commentItem.append("<div class='clear'>");

            this.PanelBody.append(commentItem);
        },
        formatDate:function(v){
            return v < 10 ? "0" + v : v;
        },

        //评论输入
        InitCommentInput: function () {
            if (!this.Editable) return;
            var InputPanel = $("<div style='border-bottom:1px solid #e4e4e4;'></div>");
            this.CommentInput = $("<textarea placeholder='请输入审批意见' style='padding:10px;'></textarea>").width(this.Width).css('border', '1px solid black');
            if (this.MyComment) {
                this.CommentInput.val(this.MyComment.Text);
            }
            else {//默认评论
                this.CommentInput.val(this.DefaultComment);
            }
            InputPanel.append(this.CommentInput);
            $(this.$InputBody).append(InputPanel);

            //值改变事件
            $(this.CommentInput).unbind("change.CommentInput").bind("change.CommentInput", this, function (e) {
                e.data.Validate.apply(e.data);
            });
        }

        //签名
        //InitFrequentlyUsedComments: function () {

        //    var LatestCommentPanel = $("<div></div>").width(this.Width);
        //    var LatestCommentSel = $("<select></select>").width("80%");

        //    if (this.IsMobile) {
        //        $(LatestCommentSel).width("100%");
        //    }
        //    else {
        //        var checkboxid = $.IGuid();
        //        var SettingPanel = $("<div class='pull-right'></div>");
        //        this.SaveFrequentCk = $("<input type='checkbox'/>").attr("id", checkboxid);
        //        var Spantxt = $("<label type='checkbox' for='" + checkboxid + "'>设为常用</label>")
        //        Spantxt.css("cursor", "pointer");
        //        SettingPanel.append(this.SaveFrequentCk);
        //        SettingPanel.append(Spantxt);
        //    }
        //    LatestCommentSel.append("<option value=''>--请选择常用意见--</option>");

        //    if (this.Value && this.Value.FrequentlyUsedComments) {
        //        for (var i = 0; i < this.Value.FrequentlyUsedComments.length; i++) {
        //            var text = this.Value.FrequentlyUsedComments[i];
        //            if (text.length > 18) {
        //                text = text.substring(0, 18) + "...";
        //            }
        //            var option = $("<option value='" + this.Value.FrequentlyUsedComments[i] + "'>" + text + "</option>");
        //            LatestCommentSel.append(option);
        //        }
        //    }
        //    $(LatestCommentSel).unbind("change.LatestCommentSel").bind("change.LatestCommentSel", this, function (e) {
        //        if ($(this).val().length > 0) {
        //            e.data.CommentInput.val($(this).val());
        //            e.data.Validate();
        //        }
        //    });
        //    if (this.FrequentCommentVisible) {
        //        LatestCommentPanel.append(LatestCommentSel);
        //    }
        //    if (this.FrequentSettingVisible) {
        //        LatestCommentPanel.append(SettingPanel);
        //    }
        //    else {
        //        LatestCommentSel.width("100%");
        //    }
        //    $(this.Element).append(LatestCommentPanel);
        //}
    });
})(jQuery);