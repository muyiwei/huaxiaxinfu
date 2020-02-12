//附件控件
(function ($) {

    $.fn.FormAttachment = function () {
        return $.ControlManager.Run.call(this, "FormAttachment", arguments);
    };

    // 构造函数
    $.Controls.FormAttachment = function (element, ptions, sheetInfo) {
        this.JAttachmentHandler = "/Sheet/MobileSheetAttachmentAction/";
        this.AttachmentUrlHandler = "/Sheet/DownloadAttachments/";
        //上传控件
        //this.FileUpload = $("<input type='file' accept='image/*;capture=camera' class='input' />").attr("data-attachment", true).attr("multiple", "multiple").hide();
        this.FileUpload = $("<input type='file' accept='image/*;capture=camera' class='input' data-attachment='true' multiple='multiple' style='display:none;'/>");
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

        this.Canvas = document.createElement("canvas");
        this.Ctx = this.Canvas.getContext('2d');
        //瓦片cancas
        this.TCanvas = document.createElement("canvas");
        this.TCtx = this.TCanvas.getContext('2d');

        $.Controls.FormAttachment.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormAttachment.Inherit($.Controls.BaseControl, {
        Render: function () {
            if (!this.Visible) { $(this.Element).hide(); return; }

            this.JAttachmentHandler += "?SchemaCode=" + encodeURI(this.SchemaCode) + "&FileID=";
            this.ImageArray = [];
            this.AttachmentUrlHandler += "?AttachmentIdStr=";
            this.HtmlRender();
            //初始化数据
            this.InitValue();
        },

        //初始化已上传文件
        InitValue: function () {
            if (this.Value) {
                //子表编辑时
                if (this.BizObjectId == void 0) {
                    this.BizObjectId = this.ResponseContext.BizObjectId;
                }

                for (var i = 0; i < this.Value.length; ++i) {
                    this.CreateFileElement(this.Value[i].Code, this.Value[i].Name, this.Value[i].Size, this.Value[i].Url);
                }
            }
        },

        // 数据验证
        Validate: function (actionName) {
            if (!this.Editable) return true;
            if (actionName != $.SmartForm.Action_Save && this.Required && $.isEmptyObject(this.AddAttachments) && this.Files < 1) {
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
            if (!this.Visible) return result;

            //result[this.DataField] = this.DataItem;
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
            $(this.Element).find(".fileBox").each(function () {
                that.RemoveFile($(this).attr("id"));
            });
        },

        HtmlRender: function () {
            //设置宽度
            var that = this;
            var $body = $(this.Element);
            $body.addClass("SheetAttachment").css({ "flex-wrap": "wrap", "padding-right": 0, "position": "relative" });

            //添加上传控件
            $body.append(this.FileUpload);
            //$body.css({ position: "relative" });
            //$body.children("span.ControlTitle");
            this.$InputBody.addClass('attachHolder');
            if (!this.Editable) return;

            //上传按钮
            if (this.Value.length > 0) {
                //this.$ActionPanel = $("<div class='fileBox' ><div class='fileUpload fileMain'><i class='icon-add'></i></div></div>");
                this.$ActionPanel = $("<div class='upload-icon'><i class='icon-paperclip'></i></div>");
            } else {
                //this.$ActionPanel = $("<div class='fileBox' style='display:none;'><div class='fileUpload fileMain'><i class='icon-add'></i></div></div>");
                this.$ActionPanel = $("<div class='upload-icon'><i class='icon-paperclip'></i></div>");
            }
            this.$InputBody.append(this.$ActionPanel);

            this.$ActionPanel.unbind("click.JAttachment").bind("click.JAttachment", this, function (e) {
                $.extend(this, e.data);
                if ($(this.Element).data($.ControlManager.DataFieldKey.toLowerCase()) != this.DataField) return;
                return this.FileUpload.click();
            });

            //$(this.$ActionPanelT).unbind("click.JAttachment").bind("click.JAttachment", this, function (e) {
            //    $.extend(this, e.data);
            //    if ($(this.Element).data($.ControlManager.DataFieldKey.toLowerCase()) != this.DataField) return;
            //    return this.FileUpload.click();
            //});

            this.FileUpload.unbind("change.FileUpload").bind("change.FileUpload", this, function (e) {
                e.data.AddFiles.apply(e.data, [this.files]);
                $(this).val("");
                //that.$ActionPanelT.hide();
                //that.$ActionPanel.show();
            });

        },

        readAsDataURL: function (file) {
            var $fileBox = $('#' + file.fileid);
            var $fileMain;
            if ($fileBox.length == 0) {
                $fileBox = $("<div class='fileBox bd-bot' id=" + fileid + "></div>");
                $fileMain = $("<div class='fileMain'></div>");
                $fileBox.append($fileMain);
            }
            else {
                $fileMain = $fileBox.find(".fileMain");
            }
            var reader = new FileReader();
            //将文件以Data URL形式读入页面  
            reader.readAsDataURL(file);
            reader.onload = function (e) {
                $fileMain.append('<img style="max-width:60px" src="' + this.result + '" alt="" />');
            }
        },

        //添加文件
        AddFiles: function (files) {

            for (var i = 0; i < files.length; i++) {

                var fileid = $.IGuid();
                files[i].fileid = fileid;

                this.CreateFileElement(fileid, files[i].name, files[i].size, null, files[i]);
            }
        },

        ClearValue: function () {
            this.ClearFiles();
        },

        //创建上传元素
        //有url就是已经上传的控件，不需要判断size 大小
        CreateFileElement: function (fileid, name, size, url, file) {
            var that = this;
            var $fileBox = $('#' + fileid);
            var $fileMain;
            if ($fileBox.length == 0) {
                $fileBox = $("<div class='fileBox bd-bot' id=" + fileid + "></div>");
                $fileMain = $("<div class='fileMain' data-id='" + fileid + "'></div>");
                $fileBox.append($fileMain);
            }
            else {
                $fileMain = $fileBox.find(".fileMain");
            }
            var $fileMess = $('<div class="fileMess">').appendTo($fileBox);
            var $fileSize;
            var fileSizeStr = 0;
            if (size > 1024 * 1024) {
                fileSizeStr = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
            } else {
                fileSizeStr = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
            }
            var $fileprocess = $("<div class='processwrap' data-filesize='" + fileid + "'><span class='processback' data-filerper='" + fileid + "'></span><span class='processper' data-filerate='" + fileid + "'>0%</span></div>").addClass("text-info");
            var actionStr = $("<a href='javascript:void(0);' class='fileClose' data-fileid=" + fileid + " ><i class='icon-close'></i></a>");
            if (this.Editable) {
                //绑定删除图片
                actionStr.unbind("click.fileDeleteBtn").bind("click.fileDeleteBtn", this, function (e) {
                    e.data.RemoveFile.apply(e.data, [$(this).attr("data-fileid")]);
                });
            }
            else {
                actionStr.hide();
            }
            $fileBox.append(actionStr);

            //标志是否能上传
            var flag = true;
            var fileName = name;
            var fileType = "";
            if (fileName.lastIndexOf(".") > 0) {
                fileName = name.substring(0, name.lastIndexOf("."));
                if (fileName.toLowerCase() == "image") {
                    fileName = "image" + (that.Files + 1);
                }
                fileType = name.substring(name.lastIndexOf("."), name.length).toLowerCase()
            }
            //没有上传过
            if (url == void 0) {
                //判断文件大小 
                var mbSize = Math.round(size * 100 / (1024 * 1024)) / 100;
                if (size > 1024 * 1024 && mbSize > this.MaxUploadSize) {
                    flag = false;
                    $.IShowWarn("提示", "最大上传" + this.MaxUploadSize + "M大小的文件!");
                    return flag;
                } else {
                    if (imageFileExtension.indexOf(fileType.toLowerCase()) > -1) {
                        if (file != void 0) {
                            var reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = function (e) {

                                var result = this.result;
                                var img = new Image();
                                img.src = result;

                                $fileMain.append('<img style="max-width:60px" src="' + this.result + '" alt="CY" />');


                                //如果图片大小小于100kb，则直接上传
                                if (result.length <= 100 * 1024) {
                                    img = null;
                                    that.AddAttachments[fileid] = {
                                        fileid: fileid,
                                        file: result,
                                        xhr: new XMLHttpRequest(),
                                        state: 0//0:未上传完，1:已上传完,100:失败
                                    };
                                    if (result.length > 1024 * 1024) {
                                        fileSizeStr = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
                                    } else {
                                        fileSizeStr = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
                                    }
                                    $fileSize = $("<div class='fileSize'>" + fileSizeStr + "</div>");
                                    $fileMess.append($fileSize);
                                    $fileMess.append($fileprocess);
                                    that.UploadFile(fileid, fileType, name);
                                    return;
                                }

                                $fileMess.append($fileprocess);

                                //图片加载完毕之后进行压缩，然后上传
                                if (img.complete) {
                                    callback();
                                } else {
                                    img.onload = callback;
                                }

                                function callback() {
                                    var data = that.Compress(img, 0.4);
                                    //上传
                                    that.AddAttachments[fileid] = {
                                        fileid: fileid,
                                        file: data,
                                        xhr: new XMLHttpRequest(),
                                        state: 0//0:未上传完，1:已上传完,100:失败
                                    };
                                    if (data.length > 1024 * 1024) {
                                        fileSizeStr = (Math.round(data.length * 100 / (1024 * 1024)) / 100).toString() + 'MB';
                                    } else {
                                        fileSizeStr = (Math.round(data.length * 100 / 1024) / 100).toString() + 'KB';
                                    }
                                    $fileSize = $("<div class='fileSize'>" + fileSizeStr + "</div>");
                                    $fileMess.append($fileSize);
                                    //$fileMess.append($fileprocess);
                                    //$fileMess.find(".processwrap").remove();
                                    that.UploadFile(fileid, fileType, name);
                                    img = null;
                                }


                            }
                        }
                    }
                    else {
                        $fileMain.append("<div class='fileBg icon icon-document'></div>");
                        if (file == void 0) {
                            $fileMess.prepend("<div class='fileName'>" + name + "</div>");
                            $(this.Element).append($fileBox);
                            return;
                        }
                        //上传
                        that.AddAttachments[fileid] = {
                            fileid: fileid,
                            file: file,
                            xhr: new XMLHttpRequest(),
                            state: 0//0:未上传完，1:已上传完,100:失败
                        };
                        if (file.size > 1024 * 1024) {
                            fileSizeStr = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
                        } else {
                            fileSizeStr = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
                        }
                        $fileSize = $("<div class='fileSize'>" + fileSizeStr + "</div>");
                        $fileMess.append($fileSize);
                        $fileMess.append($fileprocess);
                        that.UploadFile(fileid, fileType, name);

                    }

                }
            }
            else {
                //已经上传过了，判断是否允许下载
                if (imageFileExtension.indexOf(fileType.toLowerCase()) > -1) {
                    that.ImageArray.push(url.substring(url.lastIndexOf("=") + 1, url.length));
                    $fileMain.unbind("click.showFile").bind("click.showFile", function () {
                        //showImage(url);
                        var urls = that.AttachmentUrlHandler + that.ImageArray.join(";");
                        var curID = $(this).attr("data-id");
                        $.ajax({
                            type: "GET",
                            url: urls,
                            success: function (data) {
                                if ($ && $.IPreViewImage && data && typeof data === 'object') {
                                    var baseurl = location.origin + "/sheet/DownloadFileByUUID?uid=";
                                    var preUrls = [];
                                    for (var key in data) {
                                        if (data.hasOwnProperty(key)) {
                                            preUrls.push(baseurl + data[key]);
                                        }
                                    }
                                    var curUrl = baseurl + data[curID];
                                    $.IPreViewImage(preUrls, curUrl);
                                }
                            }
                        });
                        return false;
                    });
                    $fileMain.append("<img style='max-width:60px' src='" + url + "'>");
                }
                else {
                    $fileMain.append("<div class='fileBg icon icon-document'></div>");
                }
                $fileSize = $("<div class='fileSize'>" + fileSizeStr + "</div>");
            }
            $fileMess.prepend("<div class='fileName'>" + name + "</div>");
            if (url != void 0) {
                $fileMess.append($fileSize);
                if (!that.Editable) {
                    $fileBox.off("click.DownloadFile").on("click.DownloadFile", function () {
                        var handleUrl = that.AttachmentUrlHandler + this.id;
                        $.ajax({
                            type: "GET",
                            url: handleUrl,
                            success: function (data) {
                                if ($ && $.ISaveFile && data && typeof data === 'object') {
                                    var baseurl = location.origin + "/sheet/DownloadFileByUUID?corpid="+H3Config.corpId+"&uid=";
                                    for (var key in data) {
                                        if (data.hasOwnProperty(key)) {
                                            baseurl += data[key];
                                            break;
                                        }
                                    }
                                    $.ISaveFile(baseurl, name, true);
                                }
                            }
                        });

                    });
                }
            }


            //if (this.$ActionPanel) {
            //    this.$ActionPanel.before($fileBox);
            //}
            //else {
            //    this.$InputBody.append($fileBox);
            //}

            $(this.Element).append($fileBox);

            if (flag) {
                this.Files++;
            }
            return flag;
        },

        //scale 压缩比例
        Compress: function (img, scale) {
            var initSize = img.src.length;
            var width = img.width;
            var height = img.height;

            if ((ratio = width * height / 4000000) > 1) {
                ratio = Math.sqrt(ratio);
                width /= ratio;
                height /= ratio;
            } else {
                ratio = 1;
            }

            this.Canvas.width = width;
            this.Canvas.height = height;
            //铺底色
            this.Ctx.fillStyle = "#fff";
            this.Ctx.fillRect(0, 0, this.Canvas.width, this.Canvas.height);
            //如果图片像素大于100万则使用瓦片绘制
            var count;
            if ((count = width * height / 1000000) > 1) {
                count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片
                //            计算每块瓦片的宽和高
                var nw = ~~(width / count);
                var nh = ~~(height / count);
                this.TCanvas.width = nw;
                this.TCanvas.height = nh;
                for (var i = 0; i < count; i++) {
                    for (var j = 0; j < count; j++) {
                        this.TCtx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                        this.Ctx.drawImage(this.TCanvas, i * nw, j * nh, nw, nh);
                    }
                }
            } else {
                this.Ctx.drawImage(img, 0, 0, width, height);
            }

            //进行最小压缩
            var ndata = this.Canvas.toDataURL('image/jpeg', scale);

            this.TCanvas.width = this.TCanvas.height = this.Canvas.width = this.Canvas.height = 0;
            return ndata;
        },

        //上传
        UploadFile: function (fileid, type, fileName) {
            if (this.AddAttachments[fileid] == null && this.AddAttachments[fileid].state != 0) return;

            if (imageFileExtension.indexOf(type.toLowerCase()) > -1) {
                var basestr = this.AddAttachments[fileid].file;
                var text = window.atob(basestr.split(",")[1]);
                var buffer = new Uint8Array(text.length);
                var pecent = 0,
                  loop = null;
                for (var i = 0; i < text.length; i++) {
                    buffer[i] = text.charCodeAt(i);
                }
                //将type从.png转成image/png,不然后台无法判断文件是否是图片。（判断根据是type是否已image开头）
                var typeTemp = type;
                if (typeTemp.indexOf('.') == 0) {
                    typeTemp = typeTemp.substring(1, typeTemp.length);
                }
                typeTemp = 'image/' + typeTemp;
                var blob = this.GetBlob([buffer], typeTemp);
            }

            var formdata = this.GetFormData();

            if (imageFileExtension.indexOf(type.toLowerCase()) > -1) {
                formdata.append('imagefile', blob);
            }
            else {
                formdata.append('fileToUpload', this.AddAttachments[fileid].file);
            }
            var xhr = this.AddAttachments[fileid].xhr;
            xhr.context = this;
            xhr.upload.fileid = fileid;
            xhr.abort.fileid = fileid;
            xhr.open('post', this.JAttachmentHandler + fileid + "&FileName=" + encodeURI(fileName) + "&FileType=" + encodeURI(type));
            xhr.upload.addEventListener('progress', this.UploadProgress, false);
            xhr.addEventListener('load', this.UploadComplete, false);
            xhr.addEventListener('error', this.UploadFailed, false);
            xhr.addEventListener('abort', this.UploadCanceled, false);
            xhr.send(formdata);
            //var fd = new FormData();
            //fd.append('fileToUpload', this.AddAttachments[fileid].file);
            //var xhr = this.AddAttachments[fileid].xhr;

            //xhr.context = this;
            //xhr.upload.fileid = fileid;
            //xhr.abort.fileid = fileid;
            //xhr.upload.addEventListener('progress', this.UploadProgress, false);
            //xhr.addEventListener('load', this.UploadComplete, false);
            //xhr.addEventListener('error', this.UploadFailed, false);
            //xhr.addEventListener('abort', this.UploadCanceled, false);
            //xhr.open('POST', this.JAttachmentHandler + fileid);
            //xhr.send(fd);
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
                $("span[data-filerper='" + evt.currentTarget.fileid + "']").css("width", percentComplete + "%");
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
                this.context.AddAttachments[fileid].state = 1;
                this.context.AddAttachments[fileid].AttachmentId = resultObj.AttachmentId;
                //ERROR 上传成功后再显示
                //this.context.readAsDataURL(this.context.AddAttachments[fileid].file);
                $('tr[id="' + fileid + '"]').attr('data-attachmentid', resultObj.AttachmentId);
                $("td[data-action='" + fileid + "']").prepend("&nbsp;&nbsp;");
                if (this.context.IsMobile) {
                    var fileName = $($("#" + fileid + ">td:first").html()).text();
                    var fileType = fileName.substr(fileName.indexOf('.'));
                    if (imageFileExtension.indexOf(fileType.toLowerCase()) > -1) {
                        $("#" + fileid + ">td:first").html($("<a href='javascript:;' class='fa fa-download'  UC=true>" + $("#" + fileid + ">td:first").html() + "</a>"));
                    } else {
                        $("#" + fileid + ">td:first").html($("<a href='javascript:;' >" + $("#" + fileid + ">td:first").html() + "</a>"));
                    }

                }
                else {
                    $("td[data-action='" + fileid + "']").prepend($("<a href='" + resultObj.Url + "' class='fa fa-download' target='_blank' UC=true>下载</a>"));
                }

                /*
                 *android对upload的progress事件支持不完善
                 *在Complete事件里将上传进度赋值为100%
                 */
                $("span[data-filerate='" + fileid + "']").html("100%");
                $("span[data-filerper='" + fileid + "']").css("width", "100%");

                $("span[data-filerate='" + fileid + "']").parent(".processwrap").remove();
                this.context.Validate();
                this.context.OnChange.apply(this.context, []);
            }
            else {
                this.context.UploadFailed(evt);
            }
        },

        UploadFailed: function (evt) {
            this.context.AddAttachments[evt.currentTarget.fileid].state = 100;
            $("span[data-filerate='" + evt.currentTarget.fileid + "']").html('上传失败');
        },

        UploadCanceled: function () {
        },

        RemoveFile: function (fileID) {
            $("#" + fileID).remove();
            if ($("#img_" + fileID) != null && $("#img_" + fileID) != void 0) {
                $("#img_" + fileID).remove();
            }

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
        AppendFile: function (fileId, attachmentId, fileName, fileSize) {
            this.AddAttachments[fileId] = {
                fileid: fileId,
                state: 1,
                AttachmentId: attachmentId
            };
            this.CreateFileElement(fileId, fileName, fileSize);
            $("span[data-filerate='" + fileId + "']").html("100%");
        },
        /**
        * 获取blob对象的兼容性写法
        * @param buffer
        * @param format
        * @returns {*}
        */
        GetBlob: function (buffer, format) {
            try {
                return new Blob(buffer, {
                    type: format
                });
            } catch (e) {
                var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
                buffer.forEach(function (buf) {
                    bb.append(buf);
                });
                return bb.getBlob(format);
            }
        },
        /**
         * 获取formdata
        */
        GetFormData: function () {
            var isNeedShim = ~navigator.userAgent.indexOf('Android')
            && ~navigator.vendor.indexOf('Google')
            && !~navigator.userAgent.indexOf('Chrome')
            && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 354;
            return isNeedShim ? new FormDataShim() : new FormData();
        },

    });
})(jQuery);

/**
  * formdata 补丁, 给不支持formdata上传blob的android机打补丁
  * @constructor
  */
function FormDataShim() {
    console.log('using formdata shim');
    var o = this,
      parts = [],
      boundary = Array(21).join('-') + (+new Date() * (1e16 * Math.random())).toString(36),
      oldSend = XMLHttpRequest.prototype.send;
    this.append = function (name, value, filename) {
        parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"');
        if (value instanceof Blob) {
            parts.push('; filename="' + (filename || 'blob') + '"\r\nContent-Type: ' + value.type + '\r\n\r\n');
            parts.push(value);
        } else {
            parts.push('\r\n\r\n' + value);
        }
        parts.push('\r\n');
    };
    // Override XHR send()
    XMLHttpRequest.prototype.send = function (val) {
        var fr,
          data,
          oXHR = this;
        if (val === o) {
            // Append the final boundary string
            parts.push('--' + boundary + '--\r\n');
            // Create the blob
            data = getBlob(parts);
            // Set up and read the blob into an array to be sent
            fr = new FileReader();
            fr.onload = function () {
                oldSend.call(oXHR, fr.result);
            };
            fr.onerror = function (err) {
                throw err;
            };
            fr.readAsArrayBuffer(data);
            // Set the multipart content type and boudary
            this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
            XMLHttpRequest.prototype.send = oldSend;
        } else {
            oldSend.call(this, val);
        }
    };
}