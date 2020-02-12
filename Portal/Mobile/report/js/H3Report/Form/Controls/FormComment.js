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
            this.Value = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            this.CommentValue = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            //非结束状态
            this.Editable = this.ResponseContext.WorkItemType == 2 && this.ResponseContext.FormMode == 0;
            //if(this.ResponseContext.WorkItemId)
            if (this.ResponseContext.WorkItems && this.ResponseContext.WorkItemId) {
                var id = this.ResponseContext.WorkItemId;
                var workitem = this.ResponseContext.WorkItems.filter(function (item) { return item.WorkItemId == id; });
                if (workitem && workitem.length>0) {
                    this.Editable = (workitem[0].State == 0 || workitem[0].State == 1);
                }
            }
            $(this.Element).addClass("SheetComment");
            // 设置固定标题栏
            this.$Title.html("<div style='border-bottom:2px solid #eee;'>审批记录</div>");
            //历史评论
            this.InitHistoryComment();
            //评论输入
            this.InitCommentInput();
        },

        // 数据验证
        Validate: function (effective, initValid) {
            return true;
        },

        GetValue: function () {
            return $(this.CommentInput).val() == null ? "" : $(this.CommentInput).val();
        },
        //返回原始的comment数据
        GetCommentValue: function () {
            return this.CommentValue;
        },
        //返回数据值
        SaveDataField: function () {
            var result = {};
            var oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }

            var IsNewComment = false;
            if (this.MyComment == void 0) {
                if (this.GetValue() == null || this.GetValue().trim().length == 0)//解决每次点击暂存/同意/不同意时候审批意见闪现的"不同意"
                    return {};
                this.MyComment = {
                    CommentId: $.IGuid(),
                    UserName: "我的意见",
                    DateStr: new Date().toString(),
                    Text: this.GetValue(),
                    Avatar: "/Content/img/a0.jpg"
                };
                IsNewComment = true;
            }
            else if (this.MyComment.Text == this.GetValue()) {
                return {};
            }
            else {
                $("#" + this.MyComment.CommentId).find("div.comment-text").html(this.GetValue());
            }

            //添加校验，如果值没变，就不会需要提交
            result = {
                CommentId: this.MyComment.CommentId,
                Text: this.GetValue(),
                IsNewComment: IsNewComment
            };
            return result;
        },

        //历史评论
        InitHistoryComment: function () {
            if (this.Value != null && this.Value != null) {
                for (var i = 0; i < this.Value.length; i++) {
                    if (this.LastestCommentOnly && i < this.Value.length - 1) continue;
                    var commentObject = this.Value[i];
                    if (commentObject.IsMyComment) {
                        this.MyComment = commentObject;
                        this.MyComment.UserName = "我的评论";
                    }
                    if (commentObject != void 0)
                        this.AddCommentItem(commentObject);
                }
            }
            else if (!this.Editable) {
                $(this.Element).hide();
            }
        },

        //添加评论
        AddCommentItem: function (commentObject) {
            if (this.PanelBody == void 0) {
                var CommentsPanel = $("<div class='widget-comments bordered'></div>");
                this.PanelBody = $("<div class='panel-body' style='padding:5px 5px;'></div>");
                CommentsPanel.append(this.PanelBody);//历史审批容器
                $(this.$InputBody).prepend(CommentsPanel);
            }
            var commentItem = $("<div class='comment' style='display:flex;align-items:flex-start;' id='"+commentObject.CommentId+"'></div>");
            //TODO 替换图标
            var avatar = null;
            if (commentObject.Approval) {
                avatar = $("<img src='/Content/Images/approve.png' class='img-circle'></img>");
            } else {
                avatar = $("<img src='/Content/Images/disapprove.png' class='img-circle'></img>");
            }
            var commentBody = $("<div class='comment-body'></div>")
            var userName = commentObject.UserName;
            if (this.OUNameVisible && commentObject.UserParentName != void 0) {
                userName = commentObject.OUName + "." + userName;
            }

            if (commentObject.DelegantName) {
                userName += "(委托" + commentObject.DelegantName + ")";
            }
            var commenby = $("<div class='comment-by'><a href='javascript:void(0)'>" + userName + "</a> </div>")
            if (commentObject.Activity) {
                commenby.append("[<a href='javascript:void(0)'>" + commentObject.ActivityDisplayName + "</a>]");
            }
            var commenttext = $("<div class='comment-text'></div>");
            var text = commentObject.Text || "";
            if (text == "") {
                if (commentObject.Approval) {
                    text = "同意";
                }
                else {
                    text = "不同意";
                }
            }
            commenttext.append(text);

            //审批时间
            var dateStr = "";
            var modifiedTime = commentObject.ModifiedTime.replace('T', ' ');

            var modifyData = modifiedTime.indexOf("/Date(") > -1 ? eval("new " + modifiedTime.replace(/\//g, "")) : new Date(modifiedTime);
            var today = new Date();
            if (modifyData.getYear() == today.getYear()
                && modifyData.getMonth() == today.getMonth()
                && modifyData.getDate() == today.getDate()) {
                dateStr = "今天 " + this.formatDate(modifyData.getHours()) + ":" + this.formatDate(modifyData.getMinutes());
            }
            else {
                dateStr = modifiedTime;
            }
            commenby.append("<span style='padding-left:20px;'>" + dateStr + "</span>");

            commentBody.append(commenby);
            commentBody.append(commenttext);
            commentItem.append(avatar);
            commentItem.append(commentBody);
            commentItem.append("<div class='clear'>");

            this.PanelBody.append(commentItem);
        },
        formatDate: function (v) {
            return v < 10 ? "0" + v : v;
        },

        //评论输入
        InitCommentInput: function () {
            if (!this.Editable) return;
            var InputPanel = $("<div></div>");
            this.CommentInput = $("<textarea/ style='width: 100%; padding:6px'></textarea>");//.css({ "width": "100%", "padding": "6px" });
            if (this.MyComment) {
                this.CommentInput.val("");
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
    });
})(jQuery);