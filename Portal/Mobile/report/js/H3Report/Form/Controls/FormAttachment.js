//附件控件
(function ($) {

    $.fn.FormAttachment = function () {
        return $.ControlManager.Run.call(this, "FormAttachment", arguments);
    };

    // 构造函数
    $.Controls.FormAttachment = function (element, ptions, sheetInfo) {
        this.SheetAttachmentHandler = "/Sheet/SheetAttachmentAction/";
        //上传控件
        this.FileUpload = $("<input type='file' data-attachment='true' multiple='multiple' style='display:none;'/>");
        //文件数
        this.Files = 0;
        //新添加的
        this.AddAttachments = {};
        //删除数据库的
        this.RomveAttachments = [];
        //异步数据
        this.XHRJson = {};
        //数据模型编码
        this.SchemaCode = "";

        $.Controls.FormAttachment.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormAttachment.Inherit($.Controls.BaseControl, {
        Render: function () {
            //var date = new Date();
            if (!this.Visible) { $(this.Element).hide(); return; }

            if (this.MaxUploadSize == 0) {
                this.MaxUploadSize = 10;
            }

            var sharingKey = $.IQuery("SharingKey");
            var engineCode = $.IQuery("EngineCode");

            this.SheetAttachmentHandler += "?SchemaCode=" + encodeURI(this.SchemaCode) + "&SharingKey=" + sharingKey + "&EngineCode=" + engineCode + "&MaxSize=" + this.MaxUploadSize + "&FileID=";
            this.HtmlRender();
            //初始化数据
            this.InitValue();
            //console.log('xxxx', new Date() - date);
        },

        SetValue: function () {
            $.IShowError("附件不支持SetValue");
        },

        ClearValue: function () {
            this.ClearFiles();
        },

        //初始化已上传文件
        InitValue: function () {
            if (this.Value) {
                //子表编辑时
                if (this.BizObjectId == void 0) {
                    this.BizObjectId = this.ResponseContext.BizObjectId;
                }

                for (var i = 0; i < this.Value.length; ++i) {
                    this.CreateFileElement2(this.Value[i].Code, this.Value[i].Name, this.Value[i].Size, this.Value[i].Url, this.Value[i].ThumbnailUrl, this.Value[i].Description);
                }
            }
        },
        // 数据验证
        Validate: function (actionName) {
            if (!this.Editable) return true;

            if (actionName != $.SmartForm.Action_Save && this.Required && this.Files < 1) {
                this.AddInvalidText(this.$ActionPanel, "必填");
                return false;
            }

            //如果是支持Html5的话，得判断是否已经上传完整，需要等待
            for (var key in this.AddAttachments) {
                if (this.AddAttachments[key].state == 0) {
                    this.AddInvalidText(this.$ActionPanel, "未上传完!");
                    return false;
                }
            }

            this.RemoveInvalidText(this.$ActionPanel);
            return true;
        },

        SaveDataField: function () {
            var result = {};
            if (!this.Visible ) return result;
            result[this.DataField] = this.GetValue();
            return result;
        },

        GetValue: function () {
            var AttachmentIds = "";
            for (var key in this.AddAttachments) {
                if (this.AddAttachments[key].state == 1 && this.AddAttachments[key].AttachmentId) {
                    AttachmentIds += this.AddAttachments[key].AttachmentId + ";";
                }
            }

            var DelAttachmentIds = "";
            for (var i = 0; i < this.RomveAttachments.length; ++i) {
                DelAttachmentIds += this.RomveAttachments[i] + ";";
            }
            var result = {
                AttachmentIds: AttachmentIds,
                DelAttachmentIds: DelAttachmentIds
            };
            return result;
        },

        GetText: function () {
            return this.Files;
        },

        ClearFiles: function () {
            var that = this;
            this.UploadList.find("tr").each(function () {
                that.RemoveFile($(this).attr("id"));
            });
        },

        HtmlRender: function () {
            //设置宽度
            this.$Element = $(this.Element).addClass("SheetAttachment");
            
            //添加附件展示列表和按钮
            this.UploadList = $("<table class='table table-striped' style='margin:0;min-height:0;width:100%;'></table>");
            this.$InputBody.append(this.UploadList);

            if (!this.Editable) return;
            this.$ActionPanel = $("<div class='btn btn-outline btn-lg' style='width:100%;'><i class='attach-plus'></i>点击或拖拽文件上传</div>");
            //this.$ActionPanel.addClass("btn").addClass("btn-outline").addClass("btn-lg").css("width", "100%");
            this.$InputBody.append(this.$ActionPanel);
            
            //添加上传控件
            this.$Element.append(this.FileUpload);
            this.$ActionPanel.off("click.FormAttachment").on("click.FormAttachment", this, function (e) {
                $.extend(this, e.data);
                if (this.$Element.data($.ControlManager.DataFieldKey.toLowerCase()) != this.DataField) return;
                this.FileUpload.click();
            });

            this.FileUpload.off("change.FileUpload").on("change.FileUpload", this, function (e) {
                e.data.AddFiles.apply(e.data, [this.files]);
                $(this).val("");

                var that = e.data;
                that.Required && that.$ActionPanel.css("box-shadow", "none");
            });

            this.BindDrag();
        },

        //绑定拖拽上传事件
        BindDrag: function () {
            this.$ActionPanel.on({
                dragenter: function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                },
                dragleave: function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                },
                dragover: function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            var that = this;
            this.$ActionPanel[0].addEventListener("drop", function (e) {
                e.stopPropagation();
                e.preventDefault();//取消默认浏览器拖拽效果
                var files = e.dataTransfer.files;
                that.AddFiles.apply(that, [files]);
            }, false);
        },

        //添加文件
        AddFiles: function (files) {
            this.OnChange.apply(this, [files]);

            for (var i = 0; i < files.length; i++) {
                var fileid = $.IGuid();
                if (this.CreateFileElement2(fileid, files[i].name, files[i].size)) {
                    //需要添加的附件
                    this.AddAttachments[fileid] = {
                        fileid: fileid,
                        file: files[i],
                        xhr: new XMLHttpRequest(),
                        state: 0//0:未上传完，1:已上传完,100:失败
                    };
                    this.UploadFile(fileid);
                }
            }
        },

        CreateFileElement2: function (fileid, name, size, url, thumb, description) {
            if (description == null || description == void 0) {
                description = '';
            }
            //判断文件是否大小超限
            if (url == void 0) {
                var mbSize = Math.round(size * 100 / (1024 * 1024)) / 100;
                if (size > 1024 * 1024 && mbSize > this.MaxUploadSize) {
                    $.IShowWarn('提示', '超出限制文件上传的大小');
                    return;
                } if (size == 0) {
                    $.IShowWarn('提示', '文件大小不能为0');
                    return;
                }
            }
            var fileSizeStr = 0;
            if (size > 1024 * 1024)
                fileSizeStr = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
            else
                fileSizeStr = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
            var fileSize = $("<td style='border-top:1px solid #fff' data-filesize='" + fileid + "'><span data-filerate='" + fileid + "'>上传中,请稍候...</span> (" + fileSizeStr + ")</td>").addClass("text-info");

            var actionTd = $("<td style='border-top:1px solid #fff' data-action='" + fileid + "' class=\"printHidden\"></td>");

            var actionStr = $("<a href='javascript:void(0);' class='fa fa-minus'>删除</a>");
            if (this.Editable) {
                actionStr.unbind("click.fileDeleteBtn").bind("click.fileDeleteBtn", this, function (e) {
                    if (confirm("确定删除!")) {
                        e.data.OnChange.apply(e.data, [$(this).closest("tr").attr("id")]);
                        e.data.RemoveFile.apply(e.data, [$(this).closest("tr").attr("id")]);
                    }
                });
            }
            else {
                actionStr.hide();
            }

            //标志是否能上传
            var flag = true;
            var fileName = name;
            var fileType = "";
            var imgTypeArr = ['.jpeg', '.jpg', '.png', '.gif', '.bmp'];
            if (fileName.lastIndexOf(".") > 0) {
                fileName = name.substring(0, name.lastIndexOf("."));
                fileType = name.substring(name.lastIndexOf("."), name.length);
                if (fileType) {
                    fileType = fileType.toLowerCase();
                }
            }
            var isImg = imgTypeArr.indexOf(fileType) > -1;//判断是否是图片
            if (url == void 0) {
                //判断文件大小 
                var mbSize = Math.round(size * 100 / (1024 * 1024)) / 100;
                if (size > 1024 * 1024 && mbSize > this.MaxUploadSize) {
                    flag = false;
                    fileSize = $("<td data-filesize='" + fileid + "'><span data-filerate='" + fileid + "'  style='color:red;'>超出限制文件上传的大小</span> (" + fileSizeStr + ")</td>").addClass("text-info");
                }
            }
            else {
                actionTd.append($("<a href='" + url + "' class='fa fa-download' target='_blank' UC=true>下载</a>"));
                actionTd.append("&nbsp;&nbsp;");
                fileSize = $("<td data-filesize='" + fileid + "'>" + fileSizeStr + "</td>").addClass("text-info");
            }

            var trRow_description = $("<tr></tr>").attr("data-targetid", fileid);
            var trRow = $("<tr></tr>").attr("id", fileid);
            if (url == void 0) {
                if (description == null || description == void 0 || $.trim(description).length == 0) {
                    trRow.append("<td style='border-top:1px solid #fff'><div class='LongWord' title='" + name + "' id='" + fileid + "'>" + name + "</div></td>");
                    trRow_description.append("<td colspan='2' style='background-color:#f7f7f7'><input class='form-control' id='" + fileid + "' placeholder='请输入附件描述' type='text' maxlength='200' value=''/></td><td style='text-align:center;background-color:#f7f7f7'><a style='margin-top:8px;' class='fa fa-check saveDec'>保存</a></td>");
                } else {
                    trRow.append("<td style='border-top:1px solid #fff'><div class='LongWord' title='" + name + "' id='" + fileid + "'>" + name + "</div></td>");
                    trRow_description.append("<td colspan='2' style='background-color:#f7f7f7'><input class='form-control' id='" + fileid + "' placeholder='请输入附件描述' type='text' maxlength='200' value='" + description + "'/></td><td style='text-align:center;background-color:#f7f7f7'><a style='margin-top:8px;' class='fa fa-check saveDec'>保存</a></td>");
                }
            }
            if (url != void 0) {
                trRow.append("<td style='border-top:1px solid #fff'><a href='" + url + "' data-imgurl='" + thumb + "' target='_blank' UC=true><div class='LongWord'>" + name + "</div></a></td>");
                trRow_description.append("<td colspan='2' style='background-color:#f7f7f7'><div>" + description + "</div></td><td style='background-color:#f7f7f7'></td>");
                if (isImg && !this.Editable) { //如果是图片则展示缩略图                  
                    var td_thumb = trRow.find('a');
                    $.Ipreview($(td_thumb));
                }
            }
            trRow.append(fileSize.css("text-align", "right"));
            trRow.append(actionTd.append(actionStr).css("text-align", "center"));
            this.UploadList.append(trRow);
            //if (description != null && $.trim(description).length > 0) {
            this.UploadList.append(trRow_description);
            //}
            if (isImg && !this.Editable) { //如果是图片则展示缩略图              
                $(function () { $.Ipreview($("div[id=" + fileid + "]")); });
            }

            if (flag) {
                this.Files++;
            }

            if (this.$InputBody.hasClass("col-sm-10")) {
                trRow.find(".LongWord").css({ "max-width": "400px" });
            }
            else {
                trRow.find(".LongWord").css({ "max-width": "150px" });
            }
            if (!this.Editable) {
                //非编辑模式按照以下比例设置宽度
                //var cell = trRow.find('td');
                //for (var i = 0; i < cell.length; i++) {
                //if (i == 0) $(cell).eq(0).css('width', '30%');
                //if (i == 1) $(cell).eq(1).css('width', '40%');
                //if (i == 2) $(cell).eq(2).css('width', '20%');
                //if (i == 3) $(cell).eq(3).css('width', '10%');
                //}
                trRow_description.find('a.saveDec').remove();
                trRow_description.find('input').attr('readonly', 'readonly').css({ 'border': 'none', 'outline': 'none' });
            } else {
                //编辑模式附件名列宽度
                //var cell = trRow.find('td');
                //cell.eq(0).css('width', '200px');
                //cell.eq(2).css('width', '100px');
                //cell.eq(4).css('width', '100px');
            }
            //关联附件保存描述
            $("a.saveDec").unbind("click").bind("click", function () {
                $(this).hide();
                var $input = $(this).parent().parent().find("input");
                var FileDec = $input.val();
                if (FileDec.length > 200) { $.IShowError('描述长度不能超过200个字符!'); return; }
                if (FileDec.indexOf('<') > -1 && FileDec.indexOf('>') > -1) {
                    //FileDec=FileDec.replace()
                    FileDec = FileDec.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                if (FileDec == "") { $.IShowWarn("请输入描述"); $(this).show(); return; }
                var attachmentId = $(this).parent().parent().children(':first').find('div').attr('data-attachementid');
                if (attachmentId == void 0) {
                    //attachmentId = $(this).parent().parent().children(':first').find('div').attr('id');
                    attachmentId = $(this).parent().parent().children(':first').find('input').attr('id');
                }
                //alert(attachmentId);
                $.get("/Sheet/UpdateFileDesc/", { fileid: attachmentId, FileDec: FileDec }, function (data) {
                    if (data.IsSuccess) {
                        $.IShowSuccess("保存附件描述成功");
                        $input.parent().append("<div>" + FileDec + "</div>");
                        $input.remove();
                    } else {
                        $(this).show();
                        $.IShowError("更新文件描述失败");
                    }
                })
            });
            return flag;
        },
        /*
        创建上传元素
        有url就是已经上传的控件，不需要判断size 大小 
        */
        CreateFileElement: function (fileid, name, size, url, thumb, description) {
            if (description == null || description == void 0) {
                description = '';
            }
            if (url == void 0) {
                var mbSize = Math.round(size * 100 / (1024 * 1024)) / 100;
                if (size > 1024 * 1024 && mbSize > this.MaxUploadSize) {
                    $.IShowWarn('提示', '超出限制文件上传的大小');
                    return;
                } if (size == 0) {
                    $.IShowWarn('提示', '文件大小不能为0');
                    return;
                }
            }

            var fileSizeStr = 0;
            if (size > 1024 * 1024)
                fileSizeStr = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
            else
                fileSizeStr = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
            var fileSize = $("<td data-filesize='" + fileid + "'><span data-filerate='" + fileid + "'>上传中,请稍候...</span> (" + fileSizeStr + ")</td>").addClass("text-info");

            var actionTd = $("<td data-action='" + fileid + "' class=\"printHidden\"></td>");

            var actionStr = $("<a href='javascript:void(0);' class='fa fa-minus'>删除</a>");
            if (this.Editable) {
                actionStr.unbind("click.fileDeleteBtn").bind("click.fileDeleteBtn", this, function (e) {
                    if (confirm("确定删除!")) {
                        e.data.OnChange.apply(e.data, [$(this).closest("tr").attr("id")]);
                        e.data.RemoveFile.apply(e.data, [$(this).closest("tr").attr("id")]);
                    }
                });
            }
            else {
                actionStr.hide();
            }


            //标志是否能上传
            var flag = true;
            var fileName = name;
            var fileType = "";
            var imgTypeArr = ['.jpeg', '.jpg', '.png', '.gif', '.bmp'];
            if (fileName.lastIndexOf(".") > 0) {
                fileName = name.substring(0, name.lastIndexOf("."));
                fileType = name.substring(name.lastIndexOf("."), name.length);
                if (fileType) {
                    fileType = fileType.toLowerCase();
                }
            }
            var isImg = imgTypeArr.indexOf(fileType) > -1;//判断是否是图片
            if (url == void 0) {
                //判断文件大小 
                var mbSize = Math.round(size * 100 / (1024 * 1024)) / 100;
                if (size > 1024 * 1024 && mbSize > this.MaxUploadSize) {
                    flag = false;
                    fileSize = $("<td data-filesize='" + fileid + "'><span data-filerate='" + fileid + "'  style='color:red;'>超出限制文件上传的大小</span> (" + fileSizeStr + ")</td>").addClass("text-info");
                }
            }
            else {
                actionTd.append($("<a href='" + url + "' class='fa fa-download' target='_blank' UC=true>下载</a>"));
                actionTd.append("&nbsp;&nbsp;");
                fileSize = $("<td data-filesize='" + fileid + "'>" + fileSizeStr + "</td>").addClass("text-info");
            }

            var trRow = $("<tr></tr>").attr("id", fileid);
            if (url == void 0) {
                if (description == null || description == void 0 || $.trim(description).length == 0) {
                    trRow.append("<td ><div class='LongWord' title='" + name + "' id='" + fileid + "'>" + name + "</div></td><td><input class='form-control' id='" + fileid + "' placeholder='请输入附件描述' type='text' maxlength='200' value=''/></td><td><a style='margin-top:8px' class='fa saveDec'>保存</a></td>");
                } else {
                    trRow.append("<td ><div class='LongWord' title='" + name + "' id='" + fileid + "'>" + name + "</div></td><td><input class='form-control' id='" + fileid + "' placeholder='请输入附件描述' type='text' maxlength='200' value='" + description + "'/></td><td><a style='margin-top:8px' class='fa saveDec'>保存</a></td>");
                }
            }
            if (url != void 0) {
                trRow.append("<td ><a href='" + url + "' data-imgurl='" + thumb + "' target='_blank' UC=true><div class='LongWord'>" + name + "</div></a></td><td><div>" + description + "</div></td>");
                if (isImg && !this.Editable) { //如果是图片则展示缩略图                  
                    //$(function () { $.Ipreview($("a:has(div.LongWord)")); });   
                    var td_thumb = trRow.find('a');
                    $.Ipreview($(td_thumb));
                }
            }
            trRow.append(fileSize.css("text-align", "right"));
            trRow.append(actionTd.append(actionStr).css("text-align", "center"));
            this.UploadList.append(trRow);
            if (isImg && !this.Editable) { //如果是图片则展示缩略图              
                $(function () { $.Ipreview($("div[id=" + fileid + "]")); });
            }

            if (flag) {
                this.Files++;
            }

            if (this.$InputBody.hasClass("col-sm-10")) {
                trRow.find(".LongWord").css({ "max-width": "400px" });
            }
            else {
                trRow.find(".LongWord").css({ "max-width": "150px" });
            }
            if (!this.Editable) {
                //非编辑模式按照以下比例设置宽度
                var cell = trRow.find('td');
                for (var i = 0; i < cell.length; i++) {
                    if (i == 0) $(cell).eq(0).css('width', '30%');
                    if (i == 1) $(cell).eq(1).css('width', '40%');
                    if (i == 2) $(cell).eq(2).css('width', '20%');
                    if (i == 3) $(cell).eq(3).css('width', '10%');
                }
            } else {
                //编辑模式附件名列宽度
                var cell = trRow.find('td');
                cell.eq(0).css('width', '200px');
                cell.eq(2).css('width', '100px');
                cell.eq(4).css('width', '100px');
            }
            //关联附件保存描述
            $("a.saveDec").unbind("click").bind("click", function () {
                $(this).hide();
                var $input = $(this).parent().parent().find("input");
                var FileDec = $input.val();
                if (FileDec.length > 200) { $.IShowError('描述长度不能超过200个字符!'); return; }
                if (FileDec.indexOf('<') > -1 && FileDec.indexOf('>') > -1) {
                    //FileDec=FileDec.replace()
                    FileDec = FileDec.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                if (FileDec == "") { $.IShowWarn("请输入描述"); $(this).show(); return; }
                var attachmentId = $(this).parent().parent().children(':first').find('div').attr('data-attachementid');
                if (attachmentId == void 0) {
                    attachmentId = $(this).parent().parent().children(':first').find('div').attr('id');
                }
                $.get("/Sheet/UpdateFileDesc/", { fileid: attachmentId, FileDec: FileDec }, function (data) {
                    if (data.IsSuccess) {
                        $.IShowSuccess("保存附件描述成功");
                        $input.parent().append("<div>" + FileDec + "</div>");
                        $input.remove();
                    } else {
                        $(this).show();
                        $.IShowError("更新文件描述失败");
                    }
                })
            });
            return flag;
        },

        //上传
        UploadFile: function (fileid) {
            if (this.AddAttachments[fileid] == null && this.AddAttachments[fileid].state != 0) return;
            var fd = new FormData();
            fd.append('fileToUpload', this.AddAttachments[fileid].file);
            var xhr = this.AddAttachments[fileid].xhr;

            xhr.context = this;
            xhr.upload.fileid = fileid;
            xhr.abort.fileid = fileid;
            xhr.upload.addEventListener('progress', this.UploadProgress, false);
            xhr.fileid = fileid;
            xhr.addEventListener('load', this.UploadComplete, false);
            xhr.addEventListener('error', this.UploadFailed, false);
            xhr.addEventListener('abort', this.UploadCanceled, false);
            xhr.open('POST', this.SheetAttachmentHandler + fileid);
            xhr.send(fd);
        },

        UploadProgress: function (evt) {
            if (evt.lengthComputable) {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                /*
                 * 在上传大文件的时候，在后台处理的时间会比较久
                 * 先只将上传进度显示为99%，在UploadComplete里改为100%
                 */
                percentComplete = percentComplete === 100 ? 99 : percentComplete;
                $("span[data-filerate='" + evt.currentTarget.fileid + "']").html(percentComplete + "%");
            }
            else {
                this.context.AddAttachments[evt.currentTarget.fileid].state = 100;
                $("span[data-filerate='" + evt.currentTarget.fileid + "']").css("color", "red").html('上传失败');
            }
        },

        UploadComplete: function (evt) {
            if (evt.target.status == 200) {
                var resultObj = eval('(' + evt.target.responseText + ')');
                var fileid = resultObj.FileId;
                $("#describle").val("");
                this.context.AddAttachments[fileid].state = 1;
                this.context.AddAttachments[fileid].AttachmentId = resultObj.AttachmentId;
                $("div[id=" + fileid + "]").attr("data-imgurl", resultObj.ThumbnailUrl).attr('data-attachementId', resultObj.AttachmentId);
                $("td[data-action='" + fileid + "']").prepend("&nbsp;&nbsp;");
                /*
                 *在Complete事件里将上传进度赋值为100%
                 */
                $("span[data-filerate='" + fileid + "']").html("100%");
                $("a.saveDec").unbind("click").bind("click", function () {
                    $(this).hide();
                    var $input = $(this).parent().parent().find("input");
                    var FileDec = $input.val();
                    if (FileDec.length > 200) { $.IShowError('描述长度不能超过200个字符!'); return; }
                    if (FileDec.indexOf('<') > -1 && FileDec.indexOf('>') > -1) {
                        FileDec = FileDec.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    }
                    if (FileDec == "") { $.IShowWarn("请输入描述"); $(this).show(); return; }
                    //var attachmentId = $(this).parent().parent().children(':first').find('div').attr('data-attachementid');
                    var attachmentId = $(this).parent().parent().prev().find('div').attr('data-attachementid');
                    $.get("/Sheet/UpdateFileDesc/", { fileid: attachmentId, FileDec: FileDec }, function (data) {
                        if (data.IsSuccess) {
                            $.IShowSuccess("保存附件描述成功");
                            $input.parent().append("<div>" + FileDec + "</div>");
                            $input.remove();
                        } else {
                            $(this).show();
                            $.IShowError("更新文件描述失败");
                        }
                    })
                });
                //this.context.Validate();
            }
            else {
                this.context.UploadFailed(evt);
            }
            this.context.OnChange.apply(this.context, []);
        },

        UploadFailed: function (evt) {
            this.AddAttachments[evt.currentTarget.fileid].state = 100;
            $("span[data-filerate='" + evt.currentTarget.fileid + "']").html('上传失败');
        },

        UploadCanceled: function () {
        },

        RemoveFile: function (fileID) {
            $("#" + fileID).remove();
            $("[data-targetid='" + fileID + "']").remove();

            this.Files--;
            if (this.AddAttachments[fileID]) {
                if (this.AddAttachments[fileID].xhr) {
                    this.AddAttachments[fileID].xhr.abort();
                }
                delete this.AddAttachments[fileID];
            }
            else {
                this.RomveAttachments.push(fileID);
            }
            this.Validate();
            this.OnChange(this, []);
        },

        // 关联查询附加附件
        AppendFile: function (fileId, attachmentId, fileName, fileSize, thumb, description, url) {
            this.AddAttachments[fileId] = {
                fileid: fileId,
                state: 1,
                AttachmentId: attachmentId
            };
            this.CreateFileElement2(fileId, fileName, fileSize, url, thumb, description);
            $("span[data-filerate='" + fileId + "']").html("100%");
            //关联的附件控件隐藏了添加附件功能
            //this.$ActionPanel.remove();
        }
    });
})(jQuery);