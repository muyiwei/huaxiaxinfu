// FormSns控件
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
                return false;
            }

            // 将控件的Title隐藏
            $(this.Element).find("." + this.Css.ControlTitle).hide();
            var that = this;

            this.$panel = $('<div class="panel panel-info" style="margin-bottom:0;"><div class="panel-heading"><span class="fa fa-comments"></span>动态</div></div>');
            this.$panelBody = $('<div class="panel-body snscontent"></div>');
            this.$panel.append(this.$panelBody);

            this.$addPost = $('<div style="border:0px;" class="item item-input postcontent"><textarea class="form-control topic" rows="3" placeholder="内容"></textarea><input type="file" class="input-file" style="display:none;"/></div><div class="item postbtn"><a class="upload" href="javascript:void(0)"><i class="icon ion-folder"></i></a><a class="post" href="javascript:void(0)"><i class="icon ion-share"></i></a></div>');

            this.$fileList = $('<div class="item item-input display" style="border:0px;" id="fileList"></div>');

            this.$panelBody.append(this.$addPost);
            this.$panelBody.append(this.$fileList);

            //初始化上传图片控件
            var _input = this.$addPost.find('.input-file').get(0);
            var _display = this.$fileList.get(0);
            this._initUpload(_input, _display);

            //this._initWebUploader();
            // 控件所属panel的id
            var panelid = this.$InputBody.closest(".tab-pane").attr("id");

            this.$addPost.find('a.upload').click(function () {

                that.$addPost.find('.input-file').click();
            });

            // 发布Post
            this.$addPost.find("a.post").click(function () {
                var obj = this;
                var $textarea = $(that.Element).find('textarea.topic');
                var txt = $.trim($textarea.val());
                if (txt === "") {
                    $textarea.focus();
                    $.IShowWarn('警告', '请填写动态内容');
                    

                }
                else {
                    // 设置发布按钮不可用
                    $(obj).prop("disabled", true);

                    that.fileIds = "";
                    var images = that.$fileList.find('img');
                    for (var i = 0; i < images.length; i++) {
                        that.fileIds += $(images[i]).attr('id');
                    }
                    //// 上传图片，文件
                    //that.picUploader.upload();

                    that.Ajax(
                    "/Sheet/AddSNSPost/",
                    "POST",
                    {
                        text: txt, fileIds: that.fileIds, schemaCode: $.FormManager.ResponseContext.SchemaCode,
                        bizObjectId: $.FormManager.ResponseContext.BizObjectId
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
                        $(obj).prop("disabled", false);
                    });
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
                    { bizObjectId: $.FormManager.ResponseContext.BizObjectId, flag: $.IGuid() },
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
                        var $postPanel = $('<div class="panel panel-success" style="margin-bottom:10px;"></div>');
                        var $postPanelFooter = $('<div class="panel-footer" style="padding:0;"></div>');
                        var $postPanelBody = $('<div class="panel-body" style="padding:0;"><div class="list" style="margin-bottom:0;"><div style="border:0px;" class="item item-avatar item-icon-right"><img  src="' + post.ProfilePhotoUrl + '"  /><p><span style="font-size:16px;">' + post.Name + '</span>&nbsp;&nbsp;' + post.FormatCreatedTime + '</p><p>' + that._changeTextareaValue(post.Text) + '</p></div></div>');
                        var comment = $('<div style="border:0px;margin-bottom:0;" class="item item-input"><textarea class="form-control" placeholder="快捷回复" rows="2"></textarea></div><div  style="border:0px;" class="item post-comment item-icon-right" style="margin-bottom:10px;"><a class="comment-reply" href="javascript:void(0)"><i style="color:#11c1f3;font-size:20px;" class="icon ion-reply"></i></a></div>');
                        $postPanelBody.find('div.list').append(comment);
                        if (post.IsMyItem) {
                            var $del = $('<a href="javascript:void(0)" style="color:#11c1f3;"><i style="font-size:20px;" class="icon ion-minus-round"></i></a>');
                            $postPanelBody.find(".item-avatar").append($del);
                            $del.click(function () {
                                that.Ajax(
                                  "/Sheet/DeletePost",
                                  "POST",
                                  { postId: post.ObjectId, createdBy: post.CreatedBy },
                                  function (data) {
                                      if (data.IsScuccess) {
                                          $postPanel.remove();
                                          $.IShowSuccess('确认', '删除成功');
                                      }
                                      else {
                                          $.IShowError('错误', '删除失败');
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
                                    $fileContainer.append("<a target='_blank' style='cursor:pointer;' href='javascript:;'><div class='file-item thumbnail'><img src='" + file.ThumbnailUrl + "'><div class='info' title='" + file.FileName + "'>" + file.FileName + "</div></div></a>");
                                    $fileContainer.click(function () {
                                        showImage(fileUrl);
                                    });
                                }
                                else {
                                    $fileContainer.append("<a target='_blank' style='cursor:pointer;' href='javascript:;'><div class='file-item thumbnail'><span>不能预览</span><div class='info' title='" + file.FileName + "'>" + file.FileName + "</div></div></a>");
                                }
                            });
                            $postPanelBody.append($fileContainer);
                        }

                        var $commentTextarea = $postPanelBody.find("textarea");
                        //回复post
                        $postPanelBody.find('div.post-comment').find('a').click(function () {
                            var obj = this;
                            var txt = $.trim($commentTextarea.val());
                            if (txt === "") {
                                $commentTextarea.focus();
                                //MobileObjArray.$ionicPopup.alert({
                                //    title: "提示",
                                //    template: '请填写回复内容',
                                //    okText: "确认"
                                //});
                            }
                            else {
                                $(obj).prop("disabled", true);
                                that.Ajax(
                                  "/Sheet/AddSNSComment/",
                                  "POST",
                                  { text: txt, targetId: post.ObjectId },
                                  function (data) {
                                      $(obj).prop("disabled", false);
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

                                var $comment = $('<div class="list commentBody" style="margin-bottom:0;"><div style="border:0px;" class="item  item-avatar item-icon-right"><img  src="' + comment.ProfilePhotoUrl + '" alt=""  /><p><span style="font-size:16px;">' + comment.Name + '</span>&nbsp;&nbsp;' + comment.FormatCreatedTime + '</p><p>' + replyTo + that._changeTextareaValue(comment.Text) + '</p></div></div></div>');

                                $postPanelFooter.append($comment);
                                if (comment.IsMyComment) {
                                    var $del = $('<a class="comment-del" href="javascript:void(0)" style="color:#11c1f3;"><i style="margin-right:20px;font-size:20px;" class="icon ion-close"></i></a>');
                                    var $reply = $('<a class="comment-reply" href="javascript:void(0)" style="color:#11c1f3;"><i style="font-size:20px;" class="icon ion-reply "></i></a>');
                                    $comment.find(".item-avatar").append($del);
                                    $comment.find(".item-avatar").append($reply);
                                    $comment.find('a.comment-del').click(function () {
                                        that.Ajax(
                                          "/Sheet/DeleteComment",
                                          "POST",
                                          { commentId: comment.ObjectId, userID: comment.UserID },
                                          function (data) {
                                              if (data.IsScuccess) {
                                                  $comment.remove();
                                                  $.IShowError('确认', '删除成功');
                                              }
                                              else {
                                                  $.IShowError('错误', '删除失败');
                                              }
                                          });
                                    });
                                }
                                //回复comment
                                $comment.find('a.comment-reply').click(function () {
                                    $comment.find(".commentBody > .commentReply").remove();
                                    var $commentReply = $('<div style="border:0px;border-top:1px solid #e4e4e4;margin-bottom:0;" class="item item-input commentReply"><textarea class="form-control" rows="2"></textarea></div><div class="item" style="border-top:0;"><a class="comment-close" href="javascript:void(0)" style="color:#11c1f3;float:left"><i style="font-size:20px;" class="icon ion-close"></i></a><a class="comment-reply" href="javascript:void(0)" style="color:#11c1f3;float:right"><i style="font-size:20px;" class="icon ion-reply"></i></a></div>');
                                    //$comment.find(".commentBody").append($commentReply);
                                    $comment.append($commentReply);

                                    var $textarea = $commentReply.find("textarea");
                                    $textarea.focus();

                                    $commentReply.find("a.comment-close").click(function () {
                                        $commentReply.remove();
                                    });



                                    $commentReply.find("a.comment-reply").click(function () {
                                        var obj = this;
                                        var txt = $.trim($textarea.val());
                                        if (txt === "") {
                                            $textarea.focus();
                                            $.IShowWarn('警告', '请填写回复内容');
                                        }
                                        else {
                                            $(obj).prop("disabled", true);

                                            that.Ajax(
                                              "/Sheet/AddSNSComment/",
                                              "POST",
                                              {
                                                  replyTo: comment.ObjectId, replyToUserId: comment.UserID,
                                                  schemaCode: $.FormManager.ResponseContext.SchemaCode,
                                                  bizObjectId: $.FormManager.ResponseContext.BizObjectId,
                                                  targetId: post.ObjectId, text: $textarea.val()
                                              },
                                              function (data) {
                                                  $(obj).prop("disabled", false);
                                                  if (data.IsScuccess) {
                                                      that._initPost();
                                                  }
                                              });
                                        }
                                    });
                                });
                            });
                        }
                        $postPanel.append($postPanelBody).append($postPanelFooter)
                            .appendTo(that.$panelBody);
                    }
                    else { //feed
                        var $feedPanel = $('<div class="panel panel-info"></div>');
                        var $feedPanelHeader = $('<div class="panel-heading"></div>');
                        var $feedPanelBody = $('<div class="panel-body"><div class="list"><div style="border:0px;" class="item item-avatar item-icon-right"><img  src="' + post.ProfilePhotoUrl + '"  /><p><span style="font-size:16px;">' + post.Name + '</span>&nbsp;&nbsp;' + post.FormatCreatedTime + '</p><p>' + that._changeTextareaValue(post.Text) + '</p></div></div>');
                        $feedPanel.append($feedPanelHeader).append($feedPanelBody).appendTo(that.$panelBody);
                    }
                });
            }
        },

        _initUpload: function (input, display) {
            var u = new UploadPic();
            u.init({
                input: input,
                display: display,
                callback: function (base64) {
                    var fileid = this.fileId;
                    var fileType = this.fileType;
                    var fileName = this.fileName;
                    $.ajax({
                        url: "/SNS/UploadBase64File",
                        data: { image: base64, type: fileType, fileId: fileid, name: fileName },
                        type: 'post',
                        dataType: 'json',
                        success: function (data) {
                            console.log(data.success);
                            ////alert(i.info);
                            //if (data.success == true) {
                            //    $scope.images.push(data.fileid);
                            //}
                        }
                    })
                },
                loading: function () {

                }
            });
        },

        _changeTextareaValue: function (text) {
            return (text || "").replace(/\n/g, "<br />");
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