var ntkoOffice = function (wordObject, sheetOfficeInfo) {
    this.fileOpen = false;  // 文档是否已经打开
    this.fileName = "";     // 文档名称
    this.fileType = 1;      // 打开的文档类型
    this.TANGER_OCX_OBJ = null;  // 文档对象
    this.wordObject = wordObject;
    this.sheetOfficeInfo = sheetOfficeInfo;
    this.isNewDocument = false;  // 获取或设置是否是新的文档
};

ntkoOffice.prototype = {
    init: function () {
        this.TANGER_OCX_OBJ = document.getElementById("TANGER_OCX");
        // 设置文档允许拷贝
        this.TANGER_OCX_OBJ.IsNoCopy = false;
        // 设置菜单不可见
        this.TANGER_OCX_OBJ.Titlebar = false;
        // 禁止文件中的菜单
        this.TANGER_OCX_OBJ.FileNew = false;           // 新建文档
        this.TANGER_OCX_OBJ.FileOpen = false;          // 打开文档
        this.TANGER_OCX_OBJ.FileClose = false;         // 关闭文档
        // TANGER_OCX_OBJ.FileSave = false;            // 文档保存
        this.TANGER_OCX_OBJ.FileSaveAs = false;        // 文件另存为
        this.TANGER_OCX_OBJ.FilePrint = true;          // 文件打印
        this.TANGER_OCX_OBJ.FilePrintPreview = true;   // 打印预览
        // 设置水平滚动条不可见
        // TANGER_OCX_OBJ.ActiveDocument.ActiveWindow.DisplayHorizontalScrollBar = false;
        // 设置垂直滚动条不可见
        // TANGER_OCX_OBJ.ActiveDocument.ActiveWindow.DisplayVerticalScrollBar = false;
    },
    // 设置 Office 控件状态
    // readOnly : 是否只读
    setOfficeStatus: function (readOnly) {
        try {
            if (this.wordObject.Accept != null && this.wordObject.Accept) {// 是否接受所有修订
                try {
                    this.acceptAllRevisions(true);           // 接受所有修订
                } catch (e) { }
            }
            if (this.wordObject.Mark == null || !this.wordObject.Mark) {
                if (this.sheetOfficeInfo.isStartUp == "0") {// 第一个节点，不做接受修订操作
                    // 设置不保留痕迹，并且接受所有修订
                    try {
                        this.setReviewModel(false);                // 取消留痕
                        this.acceptAllRevisions(true);       // 接受所有修订
                    }
                    catch (e) {
                        this.TANGER_OCX_OBJ.SetReadOnly(false);
                        this.setReviewModel(false);                // 取消留痕
                        this.acceptAllRevisions(true);       // 接受所有修订
                        this.TANGER_OCX_OBJ.SetReadOnly(true);
                    }
                }
            }
            else {
                // 设置保留痕迹
                this.setReviewModel(true);            // 设置留痕
            }
        }
        catch (e) { }
        if (typeof (this.wordObject.Sign) != "undefined" && this.wordObject.Sign) {   // 手写签名
            document.getElementById("btnHandSign").style.display = "";
        }
        if (typeof (this.wordObject.Stamp) != "undefined" && this.wordObject.Stamp && document.getElementById("btnStamp").disabled == false) {   // 盖章
            document.getElementById("btnStamp").style.display = "";
        }
        if (typeof (this.wordObject.Template) != "undefined" && this.wordObject.Template) {   // 模板套用
            document.getElementById("btnTemplate").style.display = "";
        }
        if (typeof (this.wordObject.PDF) != "undefined" && this.wordObject.PDF) {  // 保存 PDF 文档 
            document.getElementById("btnPDF").style.display = "";
        }
        if (typeof (this.wordObject.Print) != "undefined" && this.wordObject.Print) { // 打印 Word 文档
            document.getElementById("btnPrintDoc").style.display = "";
        }
        if (typeof (this.wordObject.MenuSign) != "undefined" && this.wordObject.MenuSign) {   // 手写签名
            this.TANGER_OCX_OBJ.AddCustomMenuItem("手写签名", false, false, 1);
        }
        if (typeof (this.wordObject.MenuTemplate) != "undefined" && this.wordObject.MenuTemplate) {   // 套用模板
            this.TANGER_OCX_OBJ.AddCustomMenuItem("套用模板", false, false, 2);
        }
        if (typeof (this.wordObject.MenuStamp) != "undefined" && this.wordObject.MenuStamp) {   // 盖章
            this.TANGER_OCX_OBJ.AddCustomMenuItem("盖章", false, false, 3);
        }
        if (typeof (this.wordObject.MenuPDF) != "undefined" && this.wordObject.MenuPDF) {   // 保存 PDF
            this.TANGER_OCX_OBJ.AddCustomMenuItem("保存PDF", false, false, 4);
        }

        this.TANGER_OCX_OBJ.SetReadOnly(readOnly);
        this.TANGER_OCX_OBJ.ToolBars = !readOnly;
    },
    // 设置文档控件编辑状态
    setDisabled: function (boo) {
        this.TANGER_OCX_OBJ.TitleBar = !boo;
        this.TANGER_OCX_OBJ.Statusbar = !boo;
        this.TANGER_OCX_OBJ.ToolBars = !boo;
        this.TANGER_OCX_OBJ.Menubar = !boo;
    },
    onPageClose: function () {
        if (this.fileOpen) {
            if (!this.TANGER_OCX_OBJ.ActiveDocument.Saved) {
                if (confirm("文档修改过,还没有保存,是否需要保存?")) {
                    saveFileToUrl();
                }
            }
        }
    },
    // 保存文档至服务器
    saveDocument: function (title) {
        // 当文档是只读时，不作保存
        if (this.wordObject.ReadOnly == null || this.wordObject.ReadOnly) return;
        if (!title) title = this.sheetOfficeInfo.fileName;

        var retHTML = this.TANGER_OCX_OBJ.SaveToURL
        (
            this.sheetOfficeInfo.rootURI + "/Office/OfficeService.aspx",  // 保存的文件地址
            "UploadFile",                                            // 设置文件输入域名称,可任选,不与其他<input type=file name=..>的name部分重复即可
            "Command=SaveDocument&InstanceID=" + this.sheetOfficeInfo.instanceID + "&ID=" + this.sheetOfficeInfo.attachmentID + "&dataField=" + encodeURI(this.sheetOfficeInfo.dataField) + "&SchemaCode=" + encodeURI(this.sheetOfficeInfo.SchemaCode),
            encodeURI(title),                                        // 文件名,此处从表单输入获取，也可自定义
            document.forms[0].id,                                    // 控件的智能提交功能可以允许同时提交选定的表单的所有数据.此处可使用id或者序号
            false
        ); //此函数会读取从服务器上返回的信息并保存到返回值中。
    },
    // 保存为 PDF 文档格式
    // fileName : 保存的 PDF 文档名称
    // saveform : 保存PDF文档的页面
    saveAsPDF: function (download) {
        var fileName = this.sheetOfficeInfo.fileName + ".pdf";
        var isPrint, isCopy;
        isPrint = isCopy = (download == "1");
        if (this.fileOpen && this.TANGER_OCX_OBJ.IsPDFCreatorInstalled()) {
            this.setSingPrint(true); // 设置印章可以打印
            var result = this.TANGER_OCX_OBJ.PublishAsPDFToURL(this.sheetOfficeInfo.rootURI + "/Office/OfficeService.aspx", //提交到的url地址
                "SavePDF", //文件域的id，类似<input type=file id=upLoadFile 中的id
                "ID=" + this.sheetOfficeInfo.pdfID + "&DataField=" + encodeURI(this.sheetOfficeInfo.pdfField) + "&Download=" + download + "&FileName=" + encodeURI(fileName) + "&SchemaCode=" + encodeURI(this.sheetOfficeInfo.SchemaCode),
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
            alert("不能执行保存,没有编辑文档或者没有安装PDF虚拟打印机!");
            return false;
        }
    },
    // 从远程URL打开文档路径
    openDocumentFromUrl: function (url) {
        if (url) {
            this.TANGER_OCX_OBJ.BeginOpenFromURL(fileUrl);
        }
    },
    // 设置文档是否打开或者关闭
    setFileOpenedOrClosed: function (boo) {
        this.fileOpen = boo;
        fileType = this.TANGER_OCX_OBJ.DocType;
    },
    // 设置文档显示的用户
    setDocumentUser: function (user) {
        try {
            with (this.TANGER_OCX_OBJ.ActiveDocument.Application) {
                UserName = user;
                UserInitials = user;
            };
        }
        catch (e) { };
    },
    // 从模板打开文档
    openDocumentFromTemplate: function (template) {
        this.TANGER_OCX_OBJ.openFromUrl(template);
    },
    //  增加安全手写签章
    addSecHandSign: function () {
        if (this.TANGER_OCX_OBJ.doctype == 1 || this.TANGER_OCX_OBJ.doctype == 2) {
            this.TANGER_OCX_OBJ.AddSecHandSign(
                this.sheetOfficeInfo.currentUser,
                0,
                0,
                4,
                0,      // 0=不打印，1=打印灰色，2=打印原始
                false,  // 是否使用证书，true或者false，默认值是false
                false,  // 是否锁定印章，true或者false，默认值是false
                true,   // 是否检查文档改变，一般应该传true
                true,   // 指明签章时是否显示以上签章设定对话框选项，默认值是true
                false,  // 指明键盘批注的口令。如果指明了此参数，将不提示用户输入保护手写签名的口令
                true,   // 指明签章时是否允许用户输入批注。默认值是true
                true    // 指明签章是否防止在文字下方。默认值是true
            );
        }
    },
    // 设置是否保留痕迹
    setReviewMode: function (boo) {
        if (this.TANGER_OCX_OBJ.doctype == 1) {
            this.TANGER_OCX_OBJ.ActiveDocument.TrackRevisions = boo;
        }
    },
    // 设置是否显示痕迹
    setShowRevisions: function (boo) {
        if (this.TANGER_OCX_OBJ.doctype == 1) {
            this.TANGER_OCX_OBJ.ActiveDocument.ShowRevisions = boo;
        }
    },
    // 接受/拒绝所有修订
    acceptAllRevisions: function (boo) {
        if (boo) {
            this.TANGER_OCX_OBJ.ActiveDocument.AcceptAllRevisions(); //接受所有的痕迹修订
        }
        else {
            this.TANGER_OCX_OBJ.ActiveDocument.Application.WordBasic.RejectAllChangesInDoc(); //拒绝所有的痕迹修订
        }
    },
    // 是否允许打印
    setAllowPrint: function (boo) {
        this.TANGER_OCX_OBJ.fileprint = boo;
    },
    // 是否允许新建
    setAllowCreateDocument: function (boo) {
        this.TANGER_OCX_OBJ.FileNew = boo;
    },
    // 是否允许另存为
    setAllowSaveAs: function (boo) {
        this.TANGER_OCX_OBJ.FileSaveAs = boo;
    },
    // 是否允许复制
    setAllowCopy: function (boo) {
        this.TANGER_OCX_OBJ.IsNoCopy = boo;
    },
    // 工具栏是否可见
    setToolBar: function (boo) {
        this.TANGER_OCX_OBJ.ToolBars = boo;
    },
    // 菜单栏是否可见
    setMenubar: function (boo) {
        this.TANGER_OCX_OBJ.Menubar = boo;
    },
    // 文档打印   true:后台打印   false:前台打印
    printDocument: function (isBackground) {
        var oldOption;
        try {
            var objOptions = this.TANGER_OCX_OBJ.ActiveDocument.Application.Options;
            oldOption = objOptions.PrintBackground;
            objOptions.PrintBackground = isBackground;
        }
        catch (err) { };
        try {
            TANGER_OCX_OBJ.printout(true);
        } catch (e) { }
        try {
            var objOptions = this.TANGER_OCX_OBJ.ActiveDocument.Application.Options;
            objOptions.PrintBackground = oldOption;
        }
        catch (err) { };
    },
    // 功能：Word 文档套用模板，复制原文
    // 参数：templateFile，模板文件地址，可以是相对路径或者绝对路径
    // 参数：bookmarks，书签和值JOSN格式，如 var bookmarks = {mark:[{Name:"Title",Value:"标题"},{Name:"Body",Value:"内容"}]}
    // 注：参数 bookmarks 不包含正文书签，默认所有模板都包含名为 Body 的正文书签
    TANGER_OCX_DoPaiBan: function (templateFile, bookmarks) {
        try {
            var doc, curSel;
            var BodyBookMark = "Body";
            var message = "Word 模板中不存在名称为 {{0}} 的书签!";
            // 选择对象当前文档的所有内容
            doc = this.TANGER_OCX_OBJ.ActiveDocument;
            curSel = doc.Application.Selection;
            // TANGER_OCX_SetMarkModify(false); //退出痕迹保留状态
            // 复制当前文档内容
            curSel.WholeStory();
            curSel.Cut();

            //插入模板
            this.TANGER_OCX_OBJ.AddTemplateFromURL(templateFile);

            // 处理正文
            if (!doc.BookMarks.Exists(BodyBookMark)) {
                alert("Word 模板中不存在名称为 {" + BodyBookMark + "} 的书签!");
                return;
            }
            // hidWordContent
            var bkmkObj = doc.BookMarks(BodyBookMark);
            var saverange = bkmkObj.Range;
            // 设置为 仿宋_GB2312 字体
            // bkmkObj.text.Font.Name = "仿宋_GB2312";
            saverange.Paste();
            doc.Bookmarks.Add(BodyBookMark, saverange);

            // 处理其他书签
            for (var i = 0; i < bookmarks.mark.length; i++) {
                if (bookmarks.mark[i] == null) continue;
                if (!doc.BookMarks.Exists(bookmarks.mark[i].Name)) {
                    continue;
                }
                doc.BookMarks(bookmarks.mark[i].Name).Range.Text = bookmarks.mark[i].Value;
            }
            // 删除后面的回车键
            curSel.EndKey(6, 1);
            curSel.Delete();
        }
        catch (err) {
            alert("错误：" + err.number + ":" + err.description);
        };
    },
    // 功能：Word 文档套用模板，不复制原文
    // 参数：templateFile，模板文件地址，可以是相对路径或者绝对路径
    // 参数：bookmarks，书签和值JOSN格式，如 var bookmarks = {mark:[{Name:"Title",Value:"标题"},{Name:"Body",Value:"内容"}]}
    // 注：参数 bookmarks 不包含正文书签，默认所有模板都包含名为 Body 的正文书签
    TANGER_OCX_PrintTemplate: function (templateFile, bookmarks) {
        try {
            var doc, curSel;
            var message = "Word 模板中不存在名称为 {{0}} 的书签!";
            // 选择对象当前文档的所有内容
            doc = this.TANGER_OCX_OBJ.ActiveDocument;

            curSel = doc.Application.Selection;
            // 复制当前文档内容
            /*
            curSel.WholeStory();
            curSel.Cut();
            */
            //插入模板
            this.TANGER_OCX_OBJ.AddTemplateFromURL(templateFile);

            // 处理其他书签
            for (var i = 0; i < bookmarks.mark.length; i++) {
                if (bookmarks.mark[i] == null) continue;
                if (!doc.BookMarks.Exists(bookmarks.mark[i].Name)) {
                    continue;
                }
                doc.BookMarks(bookmarks.mark[i].Name).Range.Text = bookmarks.mark[i].Value;
            }
            // 删除后面的回车键
            curSel.EndKey(6, 1);
            curSel.Delete();
        }
        catch (err) {
            alert("错误：" + err.number + ":" + err.description);
        };
    },
    // 从服务器盖章
    /*
    参数说明：
    signUrl:  印章保存路径
    bookmark: 确定印章所在位置的书签
    top:      印章相对 bookmark 位置的垂直位移
    left:     印章相对 bookmark 位置的水平位移
    type:     印章加盖方式 0 从服务器盖章，1 从 E-KEY 盖章,2从本机加盖印章
    */
    addServerSign: function (signUrl, bookmark, top, left, signDate, type) {
        if (this.fileOpen) {
            try {
                // 设置文档为可写
                this.TANGER_OCX_OBJ.SetReadOnly(false);
                // signDate  2010年9月15日
                // var dayLength = signDate.substring(signDate.indexOf("月") + 1);
                // if (dayLength.length == 2) left = parseInt(left) + 30;
                // else if (dayLength.length == 3) left = parseInt(left) + 15;
                if (this.TANGER_OCX_OBJ.ActiveDocument.BookMarks != null) {
                    if (this.TANGER_OCX_OBJ.ActiveDocument.BookMarks.Exists(bookmark)) {
                        // 存在签发日期时的印章处理
                        this.TANGER_OCX_OBJ.ActiveDocument.BookMarks(bookmark).Select();
                    }
                    else {// 不存在签发日期书签时的印章处理
                        left = 100;
                        top = 200;
                    }
                }
                var url = document.location.href.toLowerCase();
                signUrl = url.split("/portal")[0] + signUrl;
                if (type == "0") { // 从服务器加载印章
                    // addSignFromURL(signUrl, this.sheetOfficeInfo.currentUser, parseInt(left), parseInt(top)); // 普通印章
                    this.addSecSignFromURL(signUrl, this.sheetOfficeInfo.currentUser, parseInt(left), parseInt(top)); // 安全印章
                }
                else if (type == "1") { // 从 E-KEY 加载印章
                    this.addSecSignFromEkey(this.sheetOfficeInfo.currentUser, parseInt(left), parseInt(top));
                }
                else if (type == "2") { // 从 本机 加载印章
                    this.addLocalSign(this.sheetOfficeInfo.currentUser, parseInt(left), parseInt(top), "");
                }
            }
            catch (error) {
                // 设置文档为只读
                if (this.wordObject.ReadOnly == null || this.wordObject.ReadOnly) {
                    this.TANGER_OCX_OBJ.SetReadOnly(true);
                }
                return false;
            }
        }
        return true;
    },
    // 从服务器加盖普通签章
    addSignFromURL: function (signUrl, userName, left, top) {
        this.TANGER_OCX_OBJ.AddSignFromURL(
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
        this.TANGER_OCX_OBJ.AddSecSignFromURL(
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
        this.TANGER_OCX_OBJ.AddSecSignFromEkey(
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
        this.TANGER_OCX_OBJ.AddSignFromLocal(
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
    // 设置印章是否可以打印
    setSingPrint: function (printAble) {
        var shapes = this.TANGER_OCX_OBJ.ActiveDocument.shapes;
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
    // 从URL中增加图片
    // URL:图片URL
    // zoom
    AddPictureFromURL: function (url, zoom, left, top) {
        var leftValue, topValue;
        if (!url) return;
        leftValue = typeof (left) == "undefined" ? 0 : left;
        topValue = typeof (left) == "undefined" ? 0 : top;
        if (typeof (zoom) == "undefined") zoom = 100;

        try {
            this.TANGER_OCX_OBJ.AddPicFromURL
            (
                url,        // URL 注意；URL必须返回Word支持的图片类型。
                true,       // 是否浮动图片
                leftValue,  // 相对当前光标的水平位移
                topValue,   // 相对当前光标的垂直位移
                1,          // 当前光标处
                zoom,       // 无缩放
                1           // 文字上方
             );
        } catch (e) { }
    },
    // 插入版记，并去除空白页和版记页的页码，发文时使用，版记一定要在双数页
    // bookmark:标示版计的书签名称
    addNoteAndRemoveBlank: function (bookmark) {
        var countpage = this.TANGER_OCX_OBJ.ActiveDocument.Application.Selection.Information(4);
        var sel = this.TANGER_OCX_OBJ.ActiveDocument.Application.Selection;
        var count = this.TANGER_OCX_OBJ.ActiveDocument.Tables.Count;  // 获取表格数
        var pane = this.TANGER_OCX_OBJ.ActiveDocument.Application.ActiveWindow.ActivePane;

        this.TANGER_OCX_OBJ.ActiveDocument.Tables(count).range.cut();
        //正文加版记为双数页的时候
        if (countpage % 2 == 0) {
            //去掉版记为双数页
            if (sel.Information(4) == countpage) {
                sel.GoTo(-1, 0, 0, bookmark);    // 转到版记书签
                sel.Paste();
            }
            else {
                sel.TypeParagraph();
                //插入分节符
                sel.InsertBreak(2);
                sel.Paste();
                //切换到当前页面的页眉页脚模式
                pane.View.SeekView = 9;
                sel.ClearFormatting();
                pane.View.SeekView = 10;
                sel.HeaderFooter.LinkToPrevious = false;
                pane.View.SeekView = 0;
                sel.GoTo(1, -1);
                pane.View.SeekView = 10;
                sel.WholeStory();
                sel.TypeBackspace();
                pane.View.SeekView = 0;
            }
            //正文加版记为单数页的时候 
        }
        else {
            //去掉版记为单数页
            if (sel.Information(4) == countpage) {
                sel.TypeParagraph();
                sel.InsertBreak(2);
                sel.Paste();
                //切换到当前页面的页眉页脚模式
                pane.View.SeekView = 9;
                sel.ClearFormatting();
                pane.View.SeekView = 10;
                sel.HeaderFooter.LinkToPrevious = false;
                pane.View.SeekView = 0;
                sel.GoTo(1, -1);
            }
            else {
                sel.InsertBreak(2);
                sel.InsertBreak(2);
                sel.Paste();
                //切换到当前页面的页眉页脚模式
                pane.View.SeekView = 9;
                sel.ClearFormatting();
                pane.View.SeekView = 10;
                sel.HeaderFooter.LinkToPrevious = false;
                pane.View.SeekView = 0;
                sel.GoTo(1, -1);
                pane.View.SeekView = 10;
                sel.WholeStory();
                sel.TypeBackspace();
                pane.View.SeekView = 0;
                sel.GoTo(1, 3);
                //切换到当前页面的页眉页脚模式
                pane.View.SeekView = 9;
                sel.ClearFormatting();
                pane.View.SeekView = 10;
                sel.HeaderFooter.LinkToPrevious = false;
                pane.View.SeekView = 0;
                sel.GoTo(1, -1);
                sel.GoTo(1, 3);
            }
            pane.View.SeekView = 10;
            sel.WholeStory();
            sel.TypeBackspace();
            pane.View.SeekView = 0;
        }

        this.TANGER_OCX_OBJ.ActiveDocument.Tables(count).Rows.VerticalPosition = -999997;
        this.TANGER_OCX_OBJ.ActiveDocument.Tables(count).Rows.RelativeVerticalPosition = 0;
    }
};