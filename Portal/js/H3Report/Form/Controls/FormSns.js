// SheetSns控件
; (function ($) {
    //控件执行
    $.fn.FormSns = function () {
        return $.ControlManager.Run.call(this, "FormSns", arguments);
    };

    // 构造函数
    $.Controls.FormSns = function (element, options, sheetInfo) {
        $.Controls.FormSns.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormSns.Inherit($.Controls.BaseControl, {
        // post发布成功后执行
        AfterPost: function () { },
        //控件渲染函数
        Render: function () {
            //渲染前端
            this.HtmlRender();
        },

        //渲染前端
        HtmlRender: function () {
            // Create模式时，不显示
            if (this.ResponseContext == null || this.ResponseContext.IsCreateMode) {
                $(this.Element).css({ "display": "none" });
                return false;
            }

            // 将控件的Title隐藏
            $(this.Element).find("." + this.Css.ControlTitle).hide();

            var that = this;

            this.$panel = $('<div class="panel panel-info"><div class="panel-heading"><span class="fa fa-comments"></span>动态</div></div>');
            this.$panelBody = $('<div class="panel-body"></div>');
            this.$panel.append(this.$panelBody);

            this.$addPost = $('<div class="row" style="margin-bottom:3px;"><div class="col-sm-12"><textarea class="form-control" rows="3" placeholder="内容"></textarea></div></div><div class="row" style="margin-bottom:10px;"><div class="col-sm-11 text-left" id="fileUploader"></div><div class="col-sm-1 text-right"><button type="button" class="btn btn-success btn-xs">&nbsp;发布&nbsp;</button></div></div>');

            this.$filePicker = $('<a href="javascript:;" id="filePicker"><span class="fa fa-paperclip"></span>文件(最多支持9个，单个大小不能超过5M)</a>');
            this.$fileList = $('<div id="fileList" class="uploader-list"></div>');
            this.$addPost.find("#fileUploader").append(this.$filePicker).append(this.$fileList);

            this.$panelBody.append(this.$addPost);

            this._initWebUploader();
            // 控件所属panel的id
            var panelid = this.$InputBody.closest(".tab-pane").attr("id");
            /* 
             * WebUploader按钮或者其父级被设置成display:none，flash会停止运行，导致失效
             * 在控件所属所属panel显示后，重新初始化WebUploader
             */
            $("#navTabs li[data-panelid='" + panelid + "'] a[data-toggle='tab']").on("shown.bs.tab", function () {
                that._initWebUploader();
            });

            // ctrl+enter快捷发布Post
            this.$postTextarea = this.$addPost.find("textarea");
            this.$postTextarea.keydown(function (e) {
                if (e.ctrlKey && e.which === 13) {
                    // 防止重复提交
                    if (!that.$btnPost.prop("disabled")) {
                        that.$btnPost.trigger("click");
                    }
                }
            });
            // 发布Post
            this.$btnPost = this.$addPost.find("button");
            this.$btnPost.click(function () {
                var $textarea = that.$postTextarea;
                var txt = $.trim($textarea.val());
                if (txt === "") {
                    $textarea.focus();
                    $.IShowWarn("提示", "请填写动态内容");
                }
                else {
                    // 设置发布按钮不可用
                    that.$btnPost.prop("disabled", true);

                    that.fileIds = "";
                    // 上传图片，文件
                    that.picUploader.upload();
                }
            });

            this._initPost();
            $(this.$InputBody).append(this.$panel);
        },

        _initPost: function () {
            var that = this;

            that.Ajax(
                    "/Sheet/GetSNSPost",
                    "GET",
                    { bizObjectId: $.SmartForm.ResponseContext.BizObjectId, flag: $.IGuid() },
                    function (data) {
                        that._initPostCallBack.apply(that, [data]);
                    });
        },

        _initPostCallBack: function (data) {
            var that = this;
            if (data) {
                that.$panelBody.find(".panel").remove();
                $.each(data, function (p, post) {
                    if (post.ItemType == 1) {//post
                        var $postPanel = $('<div class="panel panel-success"></div>');
                        var $postPanelHeader = $('<div class="panel-heading"></div>');
                        var $postPanelFooter = $('<div class="panel-footer"></div>');
                        //var $postPanelBody = $('<div class="panel-body"><div class="media"><div class="media-left"><img class="media-object img-circle" src="' + post.ProfilePhotoUrl + '" alt="" style="width: 40px;margin-top:10px;" /></div><div class="media-body" style="width:100%;"><h5><a href="javascript:;">' + post.Name + '</a>&nbsp;' + post.FormatCreatedTime + '</h5>' + that._changeTextareaValue(post.Text) + '</div></div><div class="row" style="margin-bottom:3px;"><div class="col-sm-12"><textarea class="form-control" rows="2" placeholder="快速回复"></textarea></div></div><div class="row"><div class="col-sm-12 text-right"><button type="button" class="btn btn-success btn-xs">&nbsp;回复&nbsp;</button></div></div></div>');
                        var $postPanelBody = $('<div class="panel-body"></div>');
                        var $postPanelBody_media = $('<div class="media"><div class="media-left"><img class="media-object img-circle" src="' + post.ProfilePhotoUrl + '" alt="" style="width: 40px;margin-top:10px;" /></div><div class="media-body" style="width:100%;"><h5><a href="javascript:;">' + post.Name + '</a>&nbsp;' + post.FormatCreatedTime + '</h5>' + that._changeTextareaValue(post) + '</div></div>');
                        var $postPanelBody_textarea = $('<div class="row" style="margin-bottom:3px;"><div class="col-sm-12"><textarea class="form-control" rows="2" placeholder="快速回复"></textarea></div></div>');
                        var $postPanelBody_button = $('<div class="row"><div class="col-sm-12 text-right"><button type="button" class="btn btn-success btn-xs">&nbsp;回复&nbsp;</button></div></div></div>');

                        var $postPanelBody_comment = $('<div style="margin-left:30px;margin-top:10px;">');
                        //加载回复
                        for (var i = 0; i < post.Comments.length; i++) {
                            var comment = post.Comments[i];
                            var $commentPanelBody = $('<div class="panel-body" style="padding:10px"></div>').attr('id',comment.ObjectId).attr('data-user',comment.UserID);
                         //   var $commentPanelBody_media = $('<div class="comment"><div class="media-left"><img class="media-object img-circle" src="' + comment.ProfilePhotoUrl + '" alt="" style="width: 40px;margin-top:10px;" /></div><div class="media-body" style="width:100%;"><h5><a href="javascript:;">' + comment.Name + '</a>&nbsp;回复了&nbsp;<a href="javascript:;">' + post.Name + '</a>&nbsp;' + comment.FormatCreatedTime + '</h5>' + that._changeTextareaValue(comment.Text) + '</div></div>');
                            var $commentPanelBody_media = $('<div class="comment"><div class="media-left"><img class="media-object img-circle" src="' + comment.ProfilePhotoUrl + '" alt="" style="width: 40px;margin-top:10px;" /></div><div class="media-body" style="width:100%;"><h5><a href="javascript:;">' + comment.Name + '</a>&nbsp;回复了&nbsp;<a href="javascript:;">' + post.Name + '</a>&nbsp;' + comment.FormatCreatedTime + '</h5>' + that._changeTextareaValue(comment) + '</div></div>');
                            $($commentPanelBody).append($commentPanelBody_media);
                            $($postPanelBody_comment).append($commentPanelBody);
                            if (comment.UserID == $.SmartForm.ResponseContext.Originator) {
                                var $remove = $("<div class='media-right'><button type='button' class='btn btn-link'>删除</button></div>");
                                $($commentPanelBody_media).append($remove);
                                $($remove).find('button').click(function () {
                                    var btn = this;
                                    var commentBox = $(this).parent().parent().parent();
                                    var commentId = $(commentBox).attr('id');
                                    var userId = $(commentBox).attr('data-user');
                                    that.Ajax(
                                        '/Sheet/DeleteComment',
                                        'POST',
                                        { commentId: commentId, userID:userId },
                                        function (data) {
                                            if (data.IsScuccess) {
                                                $('#' + commentId).remove();
                                                $.IShowSuccess("提示", "删除成功");
                                                return;
                                            }
                                            else {
                                                $.IShowError("提示", "删除失败");
                                            }
                                        }
                                        )
                                });
                            }
                        }

                        $($postPanelBody).append($postPanelBody_media).append($postPanelBody_textarea).append($postPanelBody_button).append($postPanelBody_comment);

                        if (post.IsMyItem && (typeof post.LinkContent == "undefined" || post.LinkContent == "")) {
                            var $btnContainer = $("<div class='media-right'><button type='button' class='btn btn-link'>删除</button></div>");
                            $postPanelBody.find(".media").append($btnContainer);
                            $btnContainer.find("button").click(function () {
                                that.Ajax(
                                  "/Sheet/DeletePost",
                                  "POST",
                                  { postId: post.ObjectId, createdBy: post.CreatedBy },
                                  function (data) {
                                      if (data.IsScuccess) {
                                          $postPanel.remove();
                                          $.IShowSuccess("提示", "删除成功");
                                          return;
                                      }
                                      else {
                                          $.IShowError("提示", "删除失败");
                                      }
                                  });
                            });

                        }

                        // 文件
                        if (post.Files) {
                            var $fileContainer = $("<div></div>");
                            $.each(post.Files, function (f, file) {
                                var fileUrl = "/Sheet/GetPostFile/?postId=" + file.PostId + "&fileId=" + file.ObjectId;
                                if (file.ContentType.indexOf("image") > -1 && file.ThumbnailUrl) {
                                    $fileContainer.append("<a target='_blank' style='cursor:pointer;' href='" + fileUrl + "'><div class='file-item thumbnail'><img src='" + file.ThumbnailUrl + "'><div class='info' title='" + file.FileName + "'>" + file.FileName + "</div></div></a>");
                                }
                                else {
                                    $fileContainer.append("<a target='_blank' style='cursor:pointer;' href='" + fileUrl + "'><div class='file-item thumbnail text-center'><span class='fa fa-file-text-o fa-4x' style='margin-top:5px;'></span><div class='info' title='" + file.FileName + "'>" + file.FileName + "</div></div></a>");
                                }
                            });
                            $postPanelBody.find(".media .media-body").append($fileContainer);
                        }

                        var $commentTextarea = $postPanelBody.find("textarea");
                        var $btnComment = $postPanelBody.find("button");
                        // ctrl+enter快速回复
                        $commentTextarea.keydown(function (e) {
                            if (e.ctrlKey && e.which === 13) {
                                // 防止重复提交
                                if (!$btnComment.prop("disabled")) {
                                    $btnComment.trigger("click");
                                }
                            }
                        });
                        //回复post
                        $btnComment.click(function () {
                            var txt = $.trim($commentTextarea.val());
                            if (txt === "") {
                                $commentTextarea.focus();
                                //$.IShowWarn("提示", "请填写回复内容");

                            }
                            else {
                                $btnComment.prop("disabled", true);
                                //$.post("/Sheet/AddSNSComment/", { text: txt, targetId: post.ObjectId }, function (data) {
                                //    $btnComment.prop("disabled", false);
                                //    if (data.IsScuccess) {
                                //        that._initPost();
                                //    }
                                //}, "json");

                                that.Ajax(
                                  "/Sheet/AddSNSComment/",
                                  "POST",
                                  { text: txt, targetId: post.ObjectId },
                                  function (data) {
                                      $btnComment.prop("disabled", false);
                                      if (data.IsScuccess) {
                                          that._initPost();
                                      }
                                  });
                            }
                        });

                        if (post.Comments) {
                            $.each(post.Comments, function (c, comment) {
                                var replyTo = comment.ReplyToUser ?
                                    ('@<a href="javascript:;">' + comment.ReplyToUser + '</a>&nbsp;') : '';

                            //    var $comment = $('<div class="media"><div class="media-left"><img class="media-object img-circle" src="' + comment.ProfilePhotoUrl + '" alt="" style="width:30px;margin-top:10px;" /></div><div class="media-body commentBody" style="width:100%;"><h5><a href="javascript:;">' + comment.Name + '</a>&nbsp;' + comment.FormatCreatedTime + '</h5>' + replyTo + that._changeTextareaValue(comment.Text) + '</div><div class="media-right"></div></div>');
                                var $comment = $('<div class="media"><div class="media-left"><img class="media-object img-circle" src="' + comment.ProfilePhotoUrl + '" alt="" style="width:30px;margin-top:10px;" /></div><div class="media-body commentBody" style="width:100%;"><h5><a href="javascript:;">' + comment.Name + '</a>&nbsp;' + comment.FormatCreatedTime + '</h5>' + replyTo + that._changeTextareaValue(comment) + '</div><div class="media-right"></div></div>');
                                if (comment.IsMyComment) {
                                    var $btnDelete = $('<button type="button" class="btn btn-link">删除</button>');
                                    $comment.find(".media-right").append($btnDelete);
                                    $btnDelete.click(function () {
                                        that.Ajax(
                                          "/Sheet/DeleteComment",
                                          "POST",
                                          { commentId: comment.ObjectId, userID: comment.UserID },
                                          function (data) {
                                              if (data.IsScuccess) {
                                                  $comment.remove();
                                                  $.IShowSuccess("提示", "删除成功");
                                              }
                                              else {
                                                  $.IShowError("提示", "删除失败");
                                              }
                                          });
                                    });
                                    return;
                                }

                                var $btnReply = $('<button type="button" class="btn btn-link">回复</button>');
                                $comment.find(".media-right").append($btnReply);

                                $postPanelFooter.append($comment);

                                //回复comment
                                $btnReply.click(function () {
                                    $comment.find(".commentBody > .commentReply").remove();
                                    var $commentReply = $('<div class="commentReply"><textarea class="form-control" rows="2"></textarea><div class="row" style="padding-top:3px;"><div class="col-sm-12 text-right"><div class="btn-group" role="group"><button type="button" class="btn btn-default btn-xs btnCancel">&nbsp;取消&nbsp;</button><button type="button" class="btn btn-success btn-xs btnReply">&nbsp;回复&nbsp;</button></div></div></div></div>');
                                    $comment.find(".commentBody").append($commentReply);

                                    var $textarea = $commentReply.find("textarea");
                                    $textarea.focus();

                                    $commentReply.find(".btnCancel").click(function () {
                                        $commentReply.remove();
                                    });

                                    var $btnReply = $commentReply.find(".btnReply");

                                    // ctrl+enter快捷回复comment
                                    $textarea.keydown(function (e) {
                                        if (e.ctrlKey && e.which === 13) {
                                            // 防止重复提交
                                            if (!$btnReply.prop("disabled")) {
                                                $btnReply.trigger("click");
                                            }
                                        }
                                    });
                                    $btnReply.click(function () {
                                        var txt = $.trim($textarea.val());
                                        if (txt === "") {
                                            $textarea.focus();
                                            $.IShowWarn("提示", "请填写评论内容");

                                        }
                                        else {
                                            $btnReply.prop("disabled", true);

                                            that.Ajax(
                                              "/Sheet/AddSNSComment/",
                                              "POST",
                                              {
                                                  replyTo: comment.ObjectId, replyToUserId: comment.UserID,
                                                  schemaCode: $.SmartForm.ResponseContext.SchemaCode,
                                                  bizObjectId: $.SmartForm.ResponseContext.BizObjectId,
                                                  targetId: post.ObjectId, text: $textarea.val()
                                              },
                                              function (data) {
                                                  $btnReply.prop("disabled", false);
                                                  if (data.IsScuccess) {
                                                      that._initPost();
                                                  }
                                              });
                                        }
                                    });
                                });
                            });
                        }
                        $postPanel.append($postPanelHeader).append($postPanelBody).append($postPanelFooter)
                            .appendTo(that.$panelBody);
                    }
                    else { //feed
                        var $feedPanel = $('<div class="panel panel-info"></div>');
                        var $feedPanelHeader = $('<div class="panel-heading"></div>');
                        var $feedPanelBody = $('<div class="panel-body"><div class="row"><div class="col-sm-2 text-center"><img class="media-object img-circle" src="' + post.ProfilePhotoUrl + '" alt="" style="width: 40px;" /></div><div class="col-sm-10"><a href="javascript:;">' + post.Name + '</a><div>' + post.FormatCreatedTime + '</div><p>' + post.Text + '</p></div></div></div>');
                        $feedPanel.append($feedPanelHeader).append($feedPanelBody).appendTo(that.$panelBody);
                    }
                });
            }
        },

        _initWebUploader: function () {
            var that = this;
            // 初始化WebUploader
            this.picUploader = WebUploader.create({
                pick: this.$filePicker,
                //runtimeOrder: "html5",
                swf: "/Scripts/webuploader/Uploader.swf",
                server: "/Sheet/UploadFile",
                fileNumLimit: 9,
                fileSizeLimit: 45 * 1024 * 1024, // 45M
                fileSingleSizeLimit: 5 * 1024 * 1024 // 5M
                //accept: {
                //    title: "Images",
                //    extensions: "gif,jpg,jpeg,bmp,png",
                //    mimeTypes: "image/*"
                //}
            });
            //限制文件数量和大小信息
            this.picUploader.on('error', function (handler) {
                if (handler=='Q_EXCEED_NUM_LIMIT') {
                    $.IShowWarn('最多只能上传9个文件');
                } else if (handler=='Q_EXCEED_SIZE_LIMIT') {
                    $.IShowWarn('单个附件最大支持5M');
                }
            });
            // 当一批文件被加入队列后触发
            this.picUploader.on("filesQueued", function (files) {
                $.each(files, function (f, file) {
                    var $picLi = $("<div id='" + file.id + "' class='file-item thumbnail text-center'><img><div class='info' title='" + file.name + "'>" + file.name + "</div></div>");

                    var $btns = $("<div class='remove'><span class='fa fa-trash-o'></span></div>").appendTo($picLi);
                    $btns.find("span").click(function () {
                        $picLi.remove();
                        // 将文件从队列中移除
                        that.picUploader.cancelFile(file);

                        // Textarea方便快捷添加
                        that.$postTextarea.focus();
                    });

                    var $img = $picLi.find("img");
                    that.$fileList.append($picLi);
                    that.picUploader.makeThumb(file, function (error, src) {
                        if (error) {
                            $img.replaceWith("<span class='fa fa-file-text-o fa-4x' style='margin-top:5px;'></span>");
                            return;
                        }
                        $img.attr("src", src);
                    }, 100, 100);
                });

                // focus到Textarea，方便快捷添加
                that.$postTextarea.focus();
            });

            // 文件上传过程中创建进度条实时显示
            this.picUploader.on("uploadProgress", function (file, percentage) {
                var $li = $("#" + file.id),
                    $percent = $li.find(".progress span");

                if (!$percent.length) {
                    $percent = $('<p class="progress"><span></span></p>').appendTo($li).find("span");
                }

                $percent.css("width", percentage * 100 + "%");
            });

            this.fileIds = ""; // 保存SNSPostFile的ObjectId

            // 文件一个一个上传到服务器
            this.picUploader.on("uploadSuccess", function (file, response) {
                if (response.success) {
                    that.fileIds += (response.fileid + ",");
                }
                that.picUploader.cancelFile(file);
            });

            // 非自动上传，发布post调用upload方法，所有文件上传结束时触发
            this.picUploader.on("uploadFinished", function () {
                var txt = $.trim(that.$addPost.find("textarea").val());
                // 发布分享内容
                that.Ajax(
                    "/Sheet/AddSNSPost/",
                    "POST",
                    {
                        text: txt, fileIds: that.fileIds, schemaCode: $.SmartForm.ResponseContext.SchemaCode,
                        bizObjectId: $.SmartForm.ResponseContext.BizObjectId
                    },
                    function (data) {
                        if (data.IsScuccess) {
                            that.$addPost.find("textarea").val("");
                            that.$fileList.empty();
                            that._initPost();

                            // 执行AfterPost方法
                            that.AfterPost.apply(that);
                        }

                        // 重置发布按钮状态
                        that.$btnPost.prop("disabled", false);
                    });
            });
        },

        _changeTextareaValue: function (post) {
            if (post.LinkContent == "" || post.LinkContent==null)
                return (post.Text || "").replace(/\n/g, "<br />");
            else
            {
                var text = (post.Text || "").replace(/\n/g, "<br />");
                var linkcontent = "";
                try
                {
                    linkcontent=JSON.parse(post.LinkContent);
                }
                catch (e) { return (post.Text || "").replace(/\n/g, "<br />"); };
                var html="";
                if(linkcontent.PostType==0)
                {
                    html+="<span>创建了</span>";
                }
                else
                {
                    html+="<span>更新了</span>";
                }
                var url = "/Sheet/DefaultSheet/{SchemaCode}?SchemaCode={SchemaCode}&BizObjectId={BizObjectId}";
                url = url.replace("{SchemaCode}", linkcontent.SchemaCode).replace("{SchemaCode}", linkcontent.SchemaCode).replace("{BizObjectId}", linkcontent.BizObjectId);
                html += "<a href=\"javascript: $.ISideModal.Show('" + url + "');\">" + linkcontent.DisplayName + ":" + linkcontent.Name + "</a>";
                return html;
            }
        },

        //校验
        Validate: function () {
            return true;
        },

        SaveDataField: function () {
            return {};
        },

        GetValue: function () {
            return "Sns";
        }
    });
})(jQuery);