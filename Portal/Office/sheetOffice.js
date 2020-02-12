/// <reference path="ntkoOffice.js" />
var sheetOfficeInfo = {
    instanceID: null,
    currentUser: null,
    templateDoc: null,
    rootURI: null,
    dataField: null,
    pdfID: null,
    pdfField: null,
    attachmentID: null,
    allowEdit: null,
    isStartUp: null,
    instanceName: null,
    WorkflowPackage: null,
    WorkflowName: null,
    PortalRoot:null
};
var sheetOffice = null;
if (typeof (wordObject) == "undefined") {
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
};

$(function () {
    sheetOffice = new sheetOffice();
    sheetOffice.PortalRoot = window.localStorage.getItem("H3.PortalRoot");//PortalRoot
});

var confirmSave = function () {
    sheetOffice.saveDocument();
}

var sheetOffice = function () {
    this.ntkoOffice = new ntkoOffice(wordObject, sheetOfficeInfo);
    this.ntkoOffice.init();
    this.createNewDocument = false;

    this.toolbar = document.getElementById("trFunctions");
    this.controls = {
        btnHandSign: null,
        btnTemplate: null,
        btnStamp: null,
        btnPDF: null,
        btnPrintDoc: null
    };
    if (typeof (onPreInitOffice) != "undefined") {
        onPreInitOffice(this);
    }
    this.init();
};

sheetOffice.prototype = {
    // 文档控件初始化
    init: function () {
        this.controls.btnHandSign = $(".addHandSign");
        this.controls.btnTemplate = $(".addTemplate");
        this.controls.btnStamp = $(".addSign");
        this.controls.btnPDF = $(".savePdf");
        this.controls.btnPrintDoc = $(".printDoc");
        this.ntkoOffice.setDocumentUser(sheetOfficeInfo.currentUser);
        var ntko = this.ntkoOffice;
        this.m = this.ntkoOffice;
        // 手写签名
        this.controls.btnHandSign.bind("click", [this.ntkoOffice], function (e) {
            e.data[0].addSecHandSign();
        });
        // 套模板
        this.controls.btnTemplate.bind("click", [this], function (e) {
            e.data[0].addTemplate();
        });
        // 盖签章
        this.controls.btnStamp.bind("click", [this], function (e) {
            e.data[0].addSign();
        });
        // 保存PDF
        this.controls.btnPDF.bind("click", [this.ntkoOffice], function (e) {
            if (e.data[0].saveAsPDF(1)) {
                if ($("#hidSavePDF").length > 0) {
                    $("#hidSavePDF").val("1");
                }
            }
        });
        // 打印
        this.controls.btnPrintDoc.bind("click", [this.ntkoOffice], function (e) {
            e.data[0].printDocument(false);
        });
        
        try {
            if ((window.location.href.toLowerCase().indexOf("workitemid") == -1
                    && window.location.href.toLowerCase().indexOf("instanceid") == -1)
                || this.createNewDocument) {
                // 首次创建时打开模板文档
                this.ntkoOffice.isNewDocument = true;
                this.ntkoOffice.TANGER_OCX_OBJ.openFromUrl(sheetOfficeInfo.templateDoc);
            }
            else {
                try {
                    // 第二次创建时打开保存在服务器中的文档
                    this.openDocumentFromUrl();
                    this.ntkoOffice.isNewDocument = false;
                } catch (e) {
                    // 加载文档失败时，重新创建文档
                    this.ntkoOffice.isNewDocument = true;
                    this.ntkoOffice.TANGER_OCX_OBJ.openFromUrl(sheetOfficeInfo.templateDoc);
                    hasOpenedError = true;
                }
            }
            // 设置文档是否打开
            this.ntkoOffice.setFileOpenedOrClosed(true);

            // 设置文档可编辑性和可操作性
            if (sheetOfficeInfo.allowEdit == "0") {// 当前状态不允许编辑，一般发生在已经提交
                this.toolbar.style.display = "none";
                this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(true);
                this.ntkoOffice.TANGER_OCX_OBJ.ToolBars = false;
            }
            else {
                // 从流程设计器的 javascript 获取或设置文档的功能
                if (wordObject != null) {
                    if (wordObject.ReadOnly == null || wordObject.ReadOnly) { // 只读
                        this.ntkoOffice.setOfficeStatus(true);
                    }
                    else {
                        this.ntkoOffice.setOfficeStatus(false);
                    }
                    // 控制打印，当前不可用，待从 SheetOfficeWord 开放 Print 按钮
                    if (wordObject.Print == null || wordObject.Print) {
                        this.ntkoOffice.setAllowPrint(true);
                    }
                    else {
                        this.ntkoOffice.setAllowPrint(false);
                    }
                }
                else {
                    this.toolbar.style.display = "none";
                    this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(true);
                    this.ntkoOffice.TANGER_OCX_OBJ.ToolBars = false;
                }
            }
        } catch (e) {
            this.toolbar.style.display = "none";
        }

        // 模板加载完成后执行事件
        if (typeof (officeInitComplete) != "undefined") {
            officeInitComplete();
        }
        // 去除滚动条
        if (this.ntkoOffice.TANGER_OCX_OBJ.ActiveDocument.Application.ActiveWindow.ActivePane.View != null) {
            this.ntkoOffice.TANGER_OCX_OBJ.ActiveDocument.Application.ActiveWindow.ActivePane.View.Zoom.Percentage = 100;
        }
    },
    // 从 URL 路径打开 WORD 文档
    openDocumentFromUrl: function () {
        //var strurl = sheetOfficeInfo.rootURI + "/Office/WordOpen.aspx?SchemaCode=" + encodeURI(sheetOfficeInfo.SchemaCode) + "&BizObjectID=" + sheetOfficeInfo.BizObjectID + "&dataField=" + encodeURI(sheetOfficeInfo.dataField);
        
        var strurl = sheetOffice.PortalRoot + "/OfficeService/OpenOfficeAttachment?SchemaCode=" + encodeURI(sheetOfficeInfo.SchemaCode) + "&BizObjectID=" + sheetOfficeInfo.BizObjectID + "&dataField=" + encodeURI(sheetOfficeInfo.dataField);
        this.ntkoOffice.TANGER_OCX_OBJ.OpenFromURL(strurl);
    },
    // 检测文档是否已经套用模板
    isAddedTemplate: function () {
        var BodyBookMark = "Body";
        if (this.ntkoOffice.TANGER_OCX_OBJ.ActiveDocument != null
                && this.ntkoOffice.TANGER_OCX_OBJ.ActiveDocument.BookMarks.Exists(BodyBookMark)) {
            return true;
        }
        return false;
    },
    // 保存文档
    saveDocument: function () {
        this.ntkoOffice.saveDocument();
    },
    // 套用模板方法，调用页面中的 TANGER_OCX_Template 方法
    addTemplate: function () {
        if (this.isAddedTemplate()) {
            alert("该文档已经套用模板，请勿重复操作！");
            return;
        }
        if (wordObject.ReadOnly == null || wordObject.ReadOnly) {// 只读状态下，先撤销只读，再进行套红操作
            this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(false);
        }

        try {
            // 调用页面中的方法*该方法需要在页面中实现
            TANGER_OCX_Template();
            // 插入版记
            if (this.ntkoOffice.TANGER_OCX_OBJ.ActiveDocument.BookMarks.Exists("banji")) {
                addBanJi();
            }
        }
        catch (e) { }

        if (wordObject.ReadOnly == null || wordObject.ReadOnly) {
            this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(true);
        }
    },
    // 添加印章方法，最终可以调用页面中的 doSign 方法
    addSign: function () {
        if (wordObject.ReadOnly == null || wordObject.ReadOnly) {// 只读状态下，先撤销只读，再进行盖章操作
            this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(false);
            if (typeof (doSign) != "undefined") {
                // 调用页面中的盖章方法,*该方法需要在页面中实现
                success = doSign();
            }
            this.ntkoOffice.TANGER_OCX_OBJ.SetReadOnly(true);
            wordObject.ReadOnly = false;
        }
        else {
            if (typeof (doSign) != "undefined") {
                success = doSign();
            }
        }
    },
    TANGER_OCX_DoPaiBan: function (templateFile, bookmarks) {
        this.ntkoOffice.TANGER_OCX_DoPaiBan(templateFile, bookmarks);
    },
    // 功能：Word 文档套用模板，不复制原文
    // 参数：templateFile，模板文件地址，可以是相对路径或者绝对路径
    // 参数：bookmarks，书签和值JOSN格式，如 var bookmarks = {mark:[{Name:"Title",Value:"标题"},{Name:"Body",Value:"内容"}]}
    // 注：参数 bookmarks 不包含正文书签，默认所有模板都包含名为 Body 的正文书签
    TANGER_OCX_PrintTemplate: function (templateFile, bookmarks) {
        this.ntkoOffice.TANGER_OCX_PrintTemplate(templateFile, bookmarks);
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
        this.ntkoOffice.addServerSign(signUrl, bookmark, left, top, signDate, type);
    },
    // 从服务器加盖普通签章
    addSignFromURL: function (signUrl, userName, left, top) {
        this.ntkoOffice.addSignFromURL(signUrl, userName, left, top);
    },
    // 从服务器加盖安全印章
    addSecSignFromURL: function (signUrl, userName, left, top) {
        this.ntkoOffice.addSecSignFromURL(signUrl, userName, left, top);
    },
    //从EKEY加盖电子印章
    addSecSignFromEkey: function (userName, left, top) {
        this.ntkoOffice.addSecSignFromEkey(userName, left, top);
    },
    // 从本地加盖印章
    addSignFromLocal: function (userName, left, top, fileName) {
        this.ntkoOffice.addSignFromLocal(userName, left, top, fileName);
    },
    // 从URL中增加图片
    // URL:图片URL
    // zoom
    AddPictureFromURL: function (url, zoom, left, top) {
        this.ntkoOffice.AddPictureFromURL(url, zoom, left, top);
    }
}