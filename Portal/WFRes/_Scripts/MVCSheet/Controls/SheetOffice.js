// SheetOffice控件
(function ($) {
    //控件执行
    $.fn.SheetOffice = function () {
        return $.MvcSheetUI.Run.call(this, "SheetOffice", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetOffice = function (element, options, sheetInfo) {
        this.NTKO = null; // NTKO控件对象
        $.MvcSheetUI.Controls.SheetOffice.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetOffice.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            // <div id="xxx" SheetType="SheetOffice" DataField=""/>
            // TODO:构造 NTKO 的控件输出
            // TODO:如果是发起模式，那么加载Template模板
            // TODO:如果是非发起模式，那么从  URL 加载模板，URL地址为  Office/WordOpen.aspx
            // TODO:根据配置功能，显示不同的按钮
            /*
            // wordObject 是配置在活动节点的属性上的，读到这个属性，设置不同的按钮权限
            var wordObject = {
                ReadOnly: false,   // 是否只读
                Print: false,      // 是否允许打印
                Sign: false,       // 是否允许手写签名
                Stamp: false,      // 是否允许盖章
                Template: false,   // 是否允许套用模板
                Mark: false,       // 打开文档时是否处于修订状态
                Accept: false,     // 是否接受修订状态
                PDF: false         // 是否允许保存PDF
            };
            // 例如：设置 Mark:true,那么设置文档是修订痕迹状态,如果
            */
            if (typeof (wordObject) == "undefined") {
                this.wordObject = {
                    ReadOnly: false,   // 是否只读
                    Print: false,      // 是否允许打印
                    Sign: false,       // 是否允许手写签名
                    Stamp: false,      // 是否允许盖章
                    Template: false,   // 是否允许套用模板
                    Mark: false,       // 打开文档时是否处于修订状态
                    Accept: false,     // 是否接受修订状态
                    PDF: false         // 是否允许保存PDF
                };
            }
            else {
                this.wordObject = wordObject;
            }
            //if (typeof (bookmarks) != undefined)
            //    this.bookmarks = bookmarks;
            var table = $("<table border='0' style='text-align: center; width: 100%'></table>");
            var objectNtko = $("<object id='TANGER_OCX' classid='clsid:" + this.ClassID + "' codebase='" + this.CABPath + "#version=" + this.ProductVersion + "' width='" + this.OfficeWidth + "' height='" + this.OfficeHeight + "'><param name='ProductCaption' value='" + this.ProductCaption + "'><param name='ProductKey' value='" + this.ProductKey + "'></object>");
            $(table).append($("<tr></tr>").append($("<td style='height: " + this.OfficeHeight + ";'></td>").append(objectNtko)));
            $(this.Element).append(table);

            var actionTr = $("<tr></tr>");
            var pdfPrint = $("<td><input type='button' value='" + SheetLanguages.Current.CreatePDF + "' ></td>");
            var viewPDF = $("<td><input type='button' value='" + SheetLanguages.Current.ViewPDF + "' ></td>");
            var addSign = $("<td><input type='button' value='" + SheetLanguages.Current.AddESP + "' ></td>");
            var addTemplate = $("<td><input type='button' value='" + SheetLanguages.Current.AddTemplate + "' ></td>");
            $(actionTr).append($(pdfPrint)).append($(viewPDF)).append($(addSign)).append($(addTemplate));

            if (!this.wordObject.PDF) {
                $(pdfPrint).hide();
                $(viewPDF).hide();
            }
            if (!this.wordObject.Stamp) {
                $(addSign).hide();
            }
            if (!this.wordObject.Template) {
                $(addTemplate).hide();
            }

            $(this.Element).before($(actionTr));
            $(pdfPrint).unbind("click").bind("click", [this], function (e) {
                e.data[0].SavePDF();
            });
            $(viewPDF).unbind("click").bind("click", [this], function (e) {
                e.data[0].ViewPDF();
            });
            $(addSign).unbind("click").bind("click", [this], function (e) {
                e.data[0].AddSign();
            });
            $(addTemplate).unbind("click").bind("click", [this], function (e) {
                e.data[0].AddTemplate();
            });

            var that = this;
            setTimeout(function () {
                that.InitOffice();
            }, 1000)
        },
        InitOffice: function () {
            //debugger;
            this.NTKO = document.getElementById($(this.Element).find("object").attr("id"));
            var right = true;
            try {
                if (this.Originate) {
                    //this.NTKO.OpenFromURL(this.Template);
                    //this.NTKO.BeginOpenFromURL("http://localhost:8020/portal/office/template.doc");
                    this.NTKO.OpenFromURL(this.Template);
                }
                else {
                    try {
                        var strurl = _PORTALROOT_GLOBAL + "/Office/WordOpen.aspx?SchemaCode=" + $.MvcSheetUI.SheetInfo.SchemaCode + "&BizObjectID=" + $.MvcSheetUI.SheetInfo.BizObjectID + "&InstanceID=" + $.MvcSheetUI.SheetInfo.InstanceId + "&dataField=" + this.DataField;
                        this.NTKO.OpenFromURL(strurl);
                    }
                    catch (e) {
                        this.NTKO.OpenFromURL(this.Template);
                    }
                }
            }
            catch (e) {
                right = false;
                alert(SheetLanguages.Current.IE);
            }

            if (right) {
                //
                if (!this.wordObject.ReadOnly) {
                    this.SetReadOnly(!this.Editable);
                }
                else {
                    this.SetReadOnly(this.wordObject.ReadOnly);
                }
                
                this.NTKO.fileprint = this.wordObject.Print;
                this.NTKO.fileprintPreview = this.wordObject.Print;
                this.NTKO.IsNoCopy = false;
            }
        },
        // 查看 PDF 文档
        ViewPDF: function () {
            // TODO:转向查看PDF的URL，当没有保存PDF时，这个URL弹出保存PDF信息、点击确定后自动关闭
            // BizObjectID,PDFDataField
            var strurl = _PORTALROOT_GLOBAL + "/Office/WordOpen.aspx?SchemaCode=" + $.MvcSheetUI.SheetInfo.SchemaCode + "&BizObjectID=" + $.MvcSheetUI.SheetInfo.BizObjectID + "&dataField=" + this.PDFDataField;
            window.open(strurl);
        },
        SetReadOnly: function (readonly) {
            // TODO:设置文档是否为只读模式
            this.NTKO.SetReadOnly(readonly);
        },
        SaveOffice: function () {
            //debugger;
            // TODO:保存 WORD 文档保存的文件名称为 [流程实例名称].doc，如果流程实例名称为空，那么保存为 BizObjectID.doc,后台实现
            if (!this.NTKO.ActiveDocument.Saved) {
                // 文档被更改才进入保存方法
                // TODO:NTKO使用独立的方法进行保存，调用 ntkoOffice.js 的 saveDocument 方法
                if (this.wordObject.ReadOnly == null || this.wordObject.ReadOnly) return;

                var retHTML = this.NTKO.SaveToURL
                (
                    _PORTALROOT_GLOBAL + "/Office/OfficeService.aspx",  // 保存的文件地址
                    //_PORTALROOT_GLOBAL + "/OfficeService/SaveOfficeAttachment",
                    "UploadFile",  // 设置文件输入域名称,可任选,不与其他<input type=file name=..>的name部分重复即可
                    "Command=SaveDocument&InstanceID=" + $.MvcSheetUI.SheetInfo.InstanceId + "&dataField=" + this.DataField + "&SchemaCode=" + $.MvcSheetUI.SheetInfo.SchemaCode + "&BizObjectID=" + $.MvcSheetUI.SheetInfo.BizObjectID + "&SaveType=Doc",
                    "dd.doc",                                        // 文件名,此处从表单输入获取，也可自定义
                    document.forms[0].id,                                    // 控件的智能提交功能可以允许同时提交选定的表单的所有数据.此处可使用id或者序号
                    false
                ); //此函数会读取从服务器上返回的信息并保存到返回值中。
            }
        },
        SavePDF: function () {
            // TODO:保存PDF
            // NTKO使用独立的方法进行保存，调用 ntkoOffice.js 的 saveAsPDF 方法
            var download = 1;
            var fileName = "fileName" + ".pdf";
            var isPrint, isCopy;
            isPrint = isCopy = (download == "1");
            if (this.NTKO.fileOpen && this.NTKO.IsPDFCreatorInstalled()) {
                this.setSingPrint(true); // 设置印章可以打印
                var result = this.NTKO.PublishAsPDFToURL(_PORTALROOT_GLOBAL + "/Office/OfficeService.aspx", //提交到的url地址
                    "SavePDF", //文件域的id，类似<input type=file id=upLoadFile 中的id
                    "DataField=" + this.PDFDataField + "&Download=" + download + "&FileName=" + encodeURI(fileName) + "&SchemaCode=" + $.MvcSheetUI.SheetInfo.SchemaCode + "&BizObjectID=" + $.MvcSheetUI.SheetInfo.BizObjectID + "&InstanceID=" + $.MvcSheetUI.SheetInfo.InstanceId + "&SaveType=PDF",
                    "abc.pdf",      // 上传文件的名称，类似<input type=file 的value
                    0,              // 与控件一起提交的表单id，也可以是form的序列号，这里应该是0.
                    null,           // sheetname,保存excel的哪个表格
                    false,          // IsShowUI,是否显示保存界面
                    true,           // IsShowMsg,是否显示保存成功信息
                    true,           // IsUseSecurity,是否使用安全特性   false
                    "123",          // OwnerPass,安全密码.可直接传值
                    isPrint,        // IsPermitPrint,是否允许打印
                    isCopy          // IsPermitCopy,是否允许拷贝
                );
                this.setSingPrint(false); // 设置印章不可以打印
                return true;
            }
            else {
                alert(SheetLanguages.Current.PdfNotSave);
                return false;
            }
        },
        AddSign: function () {
            // TODO:加盖印章
            if (this.wordObject.ReadOnly == null || this.wordObject.ReadOnly) {// 只读状态下，先撤销只读，再进行盖章操作
                this.NTKO.SetReadOnly(false);
                this.addServerSign(this.SignUrl, this.SignBookmark, this.SignTop, this.SignLeft, "", this.SignType);
                this.NTKO.SetReadOnly(true);
                this.wordObject.ReadOnly = false;
            }
            else {
                this.addServerSign(this.SignUrl, this.SignBookmark, this.SignTop, this.SignLeft, "", this.SignType);
            }
        },

        setSingPrint: function (printAble) {
            var shapes = this.NTKO.ActiveDocument.shapes;
            for (i = 1; i <= shapes.Count; i++) {
                if (12 == shapes(i).Type) //如果是控件,判断控件类型  			
                {
                    if ("NTKO.SecSignControl".toUpperCase() == shapes(i).OLEFormat.ClassType.toUpperCase()) {
                        // 如果你要删除印章，首先要明确满足什么条件的印章，应该被删除。示例中判断印章序列号满足一定条件，就删除该印章。 					
                        // 其它用于判断的条件可以有：signer，signname，signcomment，signtime等等 					
                        // shapes(i).OLEFormat.object为印章控件对象                                                                               
                        // shapes(i).OLEFormat.object.SetPrintMode(2);//设置印章打印模式
                        if (printAble) {
                            shapes(i).OLEFormat.object.SetPrintMode(2); // 设置印章可以打印
                        }
                        else {
                            shapes(i).OLEFormat.object.SetPrintMode(0); // 设置印章不可以打印
                        }
                    }
                }
            }
        },

        addServerSign: function (signUrl, bookmark, top, left, signDate, type) {
            if (this.NTKO.fileOpen) {
                try {
                    // 设置文档为可写
                    this.NTKO.SetReadOnly(false);
                    // signDate  2010年9月15日
                    // var dayLength = signDate.substring(signDate.indexOf("月") + 1);
                    // if (dayLength.length == 2) left = parseInt(left) + 30;
                    // else if (dayLength.length == 3) left = parseInt(left) + 15;
                    if (this.NTKO.ActiveDocument.BookMarks != null) {
                        if (this.NTKO.ActiveDocument.BookMarks.Exists(bookmark)) {
                            // 存在签发日期时的印章处理
                            this.NTKO.ActiveDocument.BookMarks(bookmark).Select();
                        }
                        else {// 不存在签发日期书签时的印章处理
                            left = 100;
                            top = 200;
                        }
                    }
                    //var url = document.location.href.toLowerCase();
                    //signUrl = url.split("/portal")[0] + this.SignUrl;
                    if (type == "Server") { // 从服务器加载印章
                        // addSignFromURL(signUrl, this.sheetOfficeInfo.currentUser, parseInt(left), parseInt(top)); // 普通印章
                        this.addSecSignFromURL(this.SignUrl, $.MvcSheetUI.SheetInfo.currentUser, parseInt(left), parseInt(top)); // 安全印章
                    }
                    else if (type == "EKEY") { // 从 E-KEY 加载印章
                        this.addSecSignFromEkey($.MvcSheetUI.SheetInfo.currentUser, parseInt(left), parseInt(top));
                    }
                    else if (type == "2") { // 从 本机 加载印章
                        this.addLocalSign($.MvcSheetUI.SheetInfo.currentUser, parseInt(left), parseInt(top), "");
                    }
                }
                catch (error) {
                    // 设置文档为只读
                    if (this.wordObject.ReadOnly == null || this.wordObject.ReadOnly) {
                        this.NTKO.SetReadOnly(true);
                    }
                    return false;
                }
            }
            return true;
        },
        // 从服务器加盖普通签章
        addSignFromURL: function (signUrl, userName, left, top) {
            this.NTKO.AddSignFromURL(
                                userName,   // 印章的用户名
                                signUrl,    // 印章所在服务器相对url
                                left,       // 左边距
                                top,        // top,上边距 根据Relative的设定选择不同参照对象
                                userName,   // 调用DoCheckSign函数签名印章信息,用来验证印章的字符串
                                3,          // Relative,取值1-4。设置左边距和上边距相对以下对象所在的位置 1：光标位置；2：页边距；3：页面距离 4：默认设置栏，段落
                                100,        // 缩放印章,默认100%
                                1);         // 0印章位于文字下方,1位于上方
        },
        // 从服务器加盖安全印章
        addSecSignFromURL: function (signUrl, userName, left, top) {
            this.NTKO.AddSecSignFromURL(
                                userName, // 印章使用者名称
                                signUrl,  // 印章路径
                                left,     // 左位移
                                top,      // 上位移
                                1,        // 设置印章相对值， 1：光标位置；2：页边距；3：页面距离 4：默认设置栏，段落
                                0,        // 是否允许打印
                                false,    // 签章是否使用数字证书
                                false,    // 签章是否锁定
                                true,     // 检查文档是否改变
                                false,    // 指定签章是否显示以上设定的对话框
                                "",       // 签章口令，如果正确，将不弹出输入口令密码
                                false,    // 是否允许用户输入批注
                                true      // 签章是否在文字下方
                            );
        },
        //从EKEY加盖电子印章
        addSecSignFromEkey: function (userName, left, top) {
            this.NTKO.AddSecSignFromEkey(
                        userName,  // 当前用户名,
                        left,      // 印章左位移
                        top,       // 印章上位移
                        1,         // 设置印章相对值， 1：光标位置；2：页边距；3：页面距离 4：默认设置栏，段落
                        0,         // 设置不打印  1是打印灰色  2是打印原始
                        false,     // 签章是否使用数字证书
                        false,     // 签章是否锁定
                        true,      // 检查文档是否改变
                        false,     // 指定签章是否显示以上设定的对话框
                        "",        // 签章口令，如果正确，将不弹出输入口令密码
                        -1,        // 需要加盖的在 EKEY 的印章索引，如果传递 -1 表示让用户选择
                        false,     // 是否允许用户输入批注
                        true       // 签章是否在文字下方
                    );
        },
        // 从本地加盖印章
        addSignFromLocal: function (userName, left, top, fileName) {
            this.NTKO.AddSignFromLocal(
                userName,     // 印章的用户名
                fileName,     // 缺省文件名，必须是 .esp 类型文件
                true,         // 是否允许用户选择文件
                left,         // 左边距
                top,          // 上边距 根据Relative的设定选择不同参照对象
                userName,     // 调用 DoCheckSign 函数签名印章信息,用来验证印章的字符串
                1,            // Relative,取值1-4。设置左边距和上边距相对以下对象所在的位置 1：光标位置；2：页边距；3：页面距离 4：默认设置栏，段落
                100,          // 缩放印章,默认100%
                1);           // 0印章位于文字下方,1位于上方
        },

        AddTemplate: function () {
            // TODO:套用模板
            // 读取 BookmartMapping  属性  {书签名1:数据项名1,书签名2:数据项名2}
            // 将数据项的值替换到书签名
            // 注册KeyUp事件
            if (this.OnTemplate) {
                this.RunScript(this, this.OnTemplate);
            }
            else {
                //this.NTKO.AddTemplateFromURL(this.RedTemplate);
                try {
                    var doc, curSel;
                    var message = SheetLanguages.Current.BookmarkNotExists;
                    // 选择对象当前文档的所有内容
                    doc = this.NTKO.ActiveDocument;

                    curSel = doc.Application.Selection;
                    // 复制当前文档内容
                    /*
                    curSel.WholeStory();
                    curSel.Cut();
                    */
                    //插入模板
                    //var url = document.location.href.toLowerCase();
                    //var templateDoc = url.split("/portal")[0] + this.RedTemplate;
                    this.NTKO.AddTemplateFromURL(this.RedTemplate);

                    this.bookmarks = [];
                    if (this.BookmartMapping) {
                        var mappings = this.BookmartMapping.split(";");
                        if (mappings && mappings.length > 0) {
                            for (i = 0; i < mappings.length; i++) {
                                var mapDetail = mappings[i].split(":");
                                this.bookmarks.push({ Name: mapDetail[0], Value: mapDetail[1] });
                            }
                        }
                    }

                    // 处理其他书签
                    for (var i = 0; i < this.bookmarks.length; i++) {
                        if (this.bookmarks[i] == null) continue;
                        if (!doc.BookMarks.Exists(this.bookmarks[i].Name)) {
                            continue;
                        }
                        var data = $.MvcSheetUI.GetControlValue(this.bookmarks[i].Value);
                        doc.BookMarks(this.bookmarks[i].Name).Range.Text = data;
                    }
                    // 删除后面的回车键
                    curSel.EndKey(6, 1);
                    curSel.Delete();
                }
                catch (err) {
                    alert("ERROR：" + err.number + ":" + err.description);
                };
            }
            // 注意套用模板的时候，原文档内容移动到 body 中
        },
        // 返回数据值
        SaveDataField: function () {
            this.SaveOffice();
            return {};
        }
    });
})(jQuery);