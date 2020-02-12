//设计器类
var SheetDesigner = function (EngineCode, SheetCode) {
    this.EngineCode = EngineCode;
    this.SheetCode = SheetCode;
    this.HtmlModels = HtmlModels;             // 控件模型
    this.DesignerControls = DesignerControls; // 控件范围
    this.DataLogicTypes = DataLogicTypes;     // 数据类型
    this.ControlIndex = 0;           // 控件ID索引
    this.PropertyPanel = null;       // 属性面板
    this.ClipBoard = null;           // 剪切板
    this.SheetLayout = null;         // 表格逻辑
    this.DropContainer = null; // 基本属性窗口
    this.AspxEditor = null;          // ASPX编辑器
    this.CSharpEditor = null;        // C#编辑器
    this.Controls = null;
    this.PropertyArray = [];
    this.ControlClick = false;
    this.DefaultProperties = [];
    this.Layout = null;
    this.DesignerChanged = false;     // 设计区域是否有变更
    this.ASPXChanged = false;         // ASPX是否有变更
    this.Mode = DesignerMode.Designer;
};

SheetDesigner.prototype = {
    // 设计器初始化
    Initial: function (layout) {
        //debugger;
       this.Controls = {
            save: $(".save"),           // 保存
            preview: $(".preview"),     // 预览
            btnExport: $("#btnExport"), // 导出 ASPX
            txtAspx: $("#txtAspx"),                           // ASPX代码
            divSaving: $("#divSaving"),
            txtCsharp: $("#txtCsharp"),                       // C#代码
            backFirstState: $(".backFirstState"),             // 还原初次状态
            back: $(".return"),                               // 返回
            DesignerContent: $(".DesignerContent"),           // 设计区内容
            txtCSharpCode: $(".CSharpCode"),                  // C#代码内容
            txtRuntimeContent: $(".RuntimeContent"),          // ASPX代码
            chkCharpCode: ".EnabledCode",                     // 是否启用C#代码
            txtExportPageName: $("#txtExportPageName"),       // 设计区内容
            divTopBars: $("#divTopBars"),                     // SheetActionPanel容器
            hfdIDIndex: $("input[id$='hfdIDIndex']"),         // 控件ID
            hidCurrentUser: $("input[id$='hidCurrentUser']"), // 当前用户
            hidSheetCode: $("input[id$='hidSheetCode']"),     // 表单编码
            hidSchemaCode: $("input[id$='hidSchemaCode']"),   // 数据模型编码
            divExportAspx: $("#divExportAspx"),               // 导出弹出窗口
            lockScreen: $("#screen"),                         // 锁屏
            txtJavascript: $("#txtJavascript"),               // 表单属性Javascript
            txtPrint: $("#txtPrint"),                         // 表单打印模板
            txtSheetCode: $("#txtSheetCode"),                 // 表单编码
            txtSheetName: $("#txtSheetName"),                 // 表单名称

            DesignerControls: ".divContent,.DesignerContent,.panel-body,.DesignerContent > label,label,.row,.col-md-1,.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-7,.col-md-8,.col-md-9,.col-md-10,.col-md-11,.col-md-12,.DesignerContent > *[data-datafield]",
            DropContainerCell: ".DragContainer,td,.col-md-1,.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-7,.col-md-8,.col-md-9,.col-md-10,.col-md-11,.col-md-12"
        };
        // 初始化属性面板
        this.Layout = layout;
        this.PropertyPanel = new SheetDesigner.PropertyPanel(this.Controls.DesignerControls);
        this.DropContainer = new SheetDesigner.DropContainer(this, this.PropertyPanel, this.Controls.DropContainerCell);
        this.ClipBoard = new ClipBoard(this);
        this.SheetLayout = new SheetDesigner.Layout(this.DropContainer, this.PropertyPanel, this.ClipBoard, this.Controls.DropContainerCell);

        // 注册控件事件
        this.RegisterEvent();

        this.AspxEditor = CodeMirror.fromTextArea(this.Controls.txtRuntimeContent[0], {
            lineNumbers: true,
            mode: "application/x-ejs",
            indentUnit: 4,
            indentWithTabs: true,
            extraKeys: {
                "F11": function (cm) {
                    cm.setOption("fullScreen", !cm.getOption("fullScreen"));
                },
                "Esc": function (cm) {
                    if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
                }
            }
        });

        this.CSharpEditor = CodeMirror.fromTextArea(this.Controls.txtCSharpCode[0], {
            lineNumbers: true,
            matchBrackets: true,
            mode: "text/x-csharp"
        });
    },
    // 刷新
    refresh: function () {
        // 注册控件事件
        this.RegisterEvent();

        this.PropertyPanel = new SheetDesigner.PropertyPanel(this.Controls.DesignerControls);
        this.DropContainer = new SheetDesigner.DropContainer(this, this.PropertyPanel, this.Controls.DropContainerCell);
        this.SheetLayout = new SheetDesigner.Layout(this.DropContainer, this.PropertyPanel, this.ClipBoard, this.Controls.DropContainerCell);
    },
    setAspxValue: function (val) {
        this.AspxEditor.setValue(val);
    },
    getAspxValue: function (val) {
        this.AspxEditor.save();
        return this.AspxEditor.getValue();
    },
    getAspxChanged: function () {
        return this.AspxEditor.changeGeneration() > 1;
    },
    setCSharpValue: function (val) {
        this.CSharpEditor.setValue(val);
    },
    getCSharpValue: function (val) {
        this.CSharpEditor.save();
        return this.CSharpEditor.getValue();
    },
    AspxRefresh: function (val) {
        this.AspxEditor.refresh();
    },
    CSharpRefresh: function (val) {
        this.CSharpEditor.refresh();
    },
    // 注册全局删除事件
    RegisterEvent: function () {
        // 设置控件不允许输入
        this.Controls.DesignerContent.find("input,textarea").unbind("keydown.SheetDesigner").bind("keydown.SheetDesigner", [this], function (e) {
            return false;
        });
        this.Controls.DesignerContent.find(this.Controls.DropContainerCell).attr("tabindex", 0).unbind("keyup.DropContainer").bind("keyup.DropContainer", [this], function (e) {
            if (e.keyCode == 46) {
                var t = e.data[0].PropertyPanel.SelectedControl || $(e.target);
                if (!t.hasClass("DesignerContent")) {
                    e.data[0].ClipBoard.Remove(t);
                }
                e.data[0].PropertyPanel.SelectedControl = null;
            }
            if (e.ctrlKey == true && e.keyCode == 86) {
                if (!$(this).data("datafield")) {
                    e.data[0].ClipBoard.Paste($(this));
                }
            }
            else if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
                e.data[0].ClipBoard.Cancel();
            }
            e.stopPropagation();
        });
        this.Controls.DesignerContent.find("*[data-datafield]").unbind("keyup.DropContainer").bind("keyup.DropContainer",
            [this],
            function (e) {
                if (e.keyCode == 115) {// F4 显示属性界面
                    e.data[0].Layout.setRightCollapse(false);
                }
                else if (e.ctrlKey == true && e.keyCode == 67) {
                    e.data[0].ClipBoard.Copy($(this));
                }
                else if (e.ctrlKey == true && e.keyCode == 88) {
                    e.data[0].ClipBoard.Cut($(this));
                }
                else if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
                    e.data[0].ClipBoard.Cancel();
                }
            });
        //$(document).unbind("mousedown.SheetDesigner").bind("mousedown.SheetDesigner", [this], function (e) {
        //    if (event.button == 0 && event.keyCode == 8) {//Ctrl+Z
        //        debugger
        //        event.returnvalue = false;
        //        e.data[0].ClipBoard.Cancel();
        //    }
        //});

        $(document).unbind("keyup.SheetDesigner").bind("keyup.SheetDesigner", [this], function (e) {
            if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
                event.returnvalue = false;
                e.data[0].ClipBoard.Cancel();
            }
        });
    },
    //根据控件类别,获取控件模型
    GetDesignerControlModel: function (FullName) {
        for (var item in this.DesignerControls) {
            if (this.DesignerControls[item].FullName == FullName) {
                return this.DesignerControls[item].Model;
            }
        }
        return null;
    },
    //根据控件类别获取该控件的WorkSheetProperty属性
    GetDesignerControlWorkSheetProperty: function (ansy, FullName, func) {
        for (var item in this.DefaultProperties) {
            if (this.DefaultProperties[item].Name == FullName) {
                if (!func) {
                    func.call(this, this.DefaultProperties[item].Property);
                }
            }
        }
        var that = this;

        //$.ajax({
        //    type: "POST",
        //    async: ansy,
        //    url: "MvcDesignerService.ashx",
        //    data: { Command: "GetControlProperty", ControlFullName: FullName },
        //    dataType: "json",
        //    success: function (data) {
        //        that.DefaultProperties.push({ Name: FullName, Property: data });
        //        if (func != null) func.call(this, data);
        //    }
        //});
    },
    // 根据数据项类别获取对应的设计器控件类型
    GetControlRangeArray: function (type) {
        for (var item in this.DataLogicTypes) {
            if (this.DataLogicTypes[item].Type == parseInt(type)) {
                return this.DataLogicTypes[item].ControlRange;
            }
        }
        return null;
    },
    // 根据数据项类别获取类别详细实体
    GetDataLogicType: function (type) {
        for (var item in this.DataLogicTypes) {
            if (this.DataLogicTypes[item].Type == parseInt(type)) {
                return this.DataLogicTypes[item];
            }
        }
        return null;
    },
    // 将运行模式转为设计模式
    getDesignerFromAspx: function (aspx) {
        if (aspx.indexOf("<asp:Content") > -1) {
            aspx = aspx.substring(aspx.lastIndexOf("<asp:Content") + 1);
            aspx = aspx.substring(aspx.indexOf(">") + 1);
            if (aspx.indexOf("\n") == 0) aspx = aspx.substring(1);
            aspx = aspx.replace("</asp:content>", "").replace("</asp:Content>", "");
        }
        this.Controls.divSaving.html(aspx);
        this.Controls.divSaving.find(".template").removeClass("template").addClass("SheetGridViewTemplate");
        // 处理 Label
        this.Controls.divSaving.find("label[data-datafield]").each(function () {
            if (!$.trim($(this).html())) {
                $(this).html("<span class=\"OnlyDesigner\">" + $(this).attr("data-datafield") + "</span>");
            }
        });
        // 处理复合控件
        this.Controls.divSaving.find("div[data-datafield]").each(function () {
            var type = $(this).attr("data-type");
            if (!type) return;
            if (type == "SheetAttachment") {
                $(this).html("<span class=\"OnlyDesigner\"><input type=\"file\"></span>");
            }
            else if (type == "SheetComment") {
                $(this).html("<span class=\"OnlyDesigner\"><textarea style=\"height:80px;\"/></span>");
            }
            else if (type == "SheetUser") {
                $(this).html("<span class=\"OnlyDesigner\"><input type=\"text\"/></span>");
            }
            else if (type == "SheetCheckboxList") {
                if (!$.trim($(this).html())) {
                    $(this).html("<span class=\"OnlyDesigner\"><input type=\"checkbox\">选项一&nbsp;&nbsp;&nbsp;&nbsp;<input type=\"checkbox\">选项二</span>");
                }
            }
            else if (type == "SheetRadioButtonList") {
                if (!$.trim($(this).html())) {
                    $(this).html("<span class=\"OnlyDesigner\"><input type=\"radio\">选项一&nbsp;&nbsp;&nbsp;&nbsp;<input type=\"radio\">选项二</span>");
                }
            }
            else if (type == "SheetTimeSpan") {
                if (!$.trim($(this).html())) {
                    $(this).html("<span class=\"OnlyDesigner\"><input type=\text\"></span>");
                }
            }
            else if (type == "SheetDataTrackLink") {
                if (!$.trim($(this).html())) {
                    $(this).html("<a class=\"nav-icon fa fa-list-alt\" data-toggle=\"modal\"></a>");
                }
            }
            else if (type == "SheetOffice") {
                $(this).html("<span class=\"OnlyDesigner\">{文档控件}</span>");
            }
            else if (type == "SheetGridView") {
                $(this).html("<span class=\"OnlyDesigner\">{文档控件}</span>");
            }
        });
        // 处理子表
        this.Controls.divSaving.find("table[data-datafield]").each(function () {
            var datafield = $(this).attr("data-datafield");
            var colspan = $(this).find(".header>td").length;
            var designerRow = "<tr class=\"OnlyDesigner\"><td colspan=\"" + colspan + "\" class=\"OnlyDesigner\">";
            designerRow += "<label data-datafield=\"" + datafield + "\" data-for=\"" + this.id + "\" data-type=\"SheetGridView\" tabindex=\"0\" style=\"z-index: 101; cursor: move;\">" + datafield + "属性</label>";
            designerRow += "</td></tr>";
            $(designerRow).insertBefore($(this).find(".header"));
        });
        return this.Controls.divSaving.html();
    },
    // 将设计模式转为运行模式
    getRuntimeContent: function (designerContent, containsHeader) {
        this.Controls.divSaving.html(designerContent);
        this.Controls.divSaving.find(".OnlyDesigner").remove();
        this.Controls.divSaving.find("*")
            .removeClass("designer")
            .removeAttr("tabindex")
            .css("z-index", "")
            .css("cursor", "");
        this.Controls.divSaving.find(".SheetGridViewTemplate").removeClass("SheetGridViewTemplate").addClass("template");
        designerContent = this.Controls.divSaving.html();
        var scriptValue = this.Controls.txtJavascript.val();

        if (containsHeader) {
            var header = "<%@ Page Language=\"C#\" AutoEventWireup=\"true\" CodeFile=\"" + this.SheetCode + ".aspx.cs\"";
            header += " Inherits=\"OThinker.H3.Portal.Sheets." + this.EngineCode + "." + this.SheetCode + "\" EnableEventValidation=\"false\" MasterPageFile=\"~/MvcSheet.master\" %>\n";
            header += "<%@ OutputCache Duration=\"999999\" VaryByParam=\"T\" VaryByCustom=\"browser\" %>\n";
            // header += "<%@ Register Assembly=\"OThinker.H3.WorkSheet\" Namespace=\"OThinker.H3.WorkSheet\" TagPrefix=\"SheetControls\" %>\n";
            header += "<asp:Content ID=\"head\" ContentPlaceHolderID=\"headContent\" runat=\"Server\">\n";
            header += "\t<script type=\"text/javascript\">\n" + scriptValue + "\n</script>\n";
            header += "</asp:Content>\n";
            header += "<asp:Content ID=\"menu\" ContentPlaceHolderID=\"cphMenu\" runat=\"Server\">\n";
            header += "</asp:Content>\n";
            header += "<asp:Content ID=\"master\" ContentPlaceHolderID=\"masterContent\" runat=\"Server\">\n";
            return header + designerContent + "</asp:Content>";
        }
        else {
            return "<script type=\"text/javascript\">\n" + scriptValue + "\n</script>\n" + designerContent;
        }
    },
    getSapceValue: function (spaceCount) {
        var result = "";
        for (var i = 0; i < spaceCount; i++) {
            result += "\t";
        }
        return result;
    },
    getDesignerContent: function () {
        this.Controls.DesignerContent.find("*").removeClass("ControlSelected");
        var aspx = this.Controls.DesignerContent.html();
        if (aspx.indexOf("\n") == 0) {
            aspx = aspx.substring(2);
        }
        else {
            return aspx;
        }
        var spaceCount = 0;
        while (aspx.indexOf("\n                    ") > -1) {
            aspx = aspx.replace("\n                    ", "\n");
        }
        while (aspx.indexOf("\n ") > -1) {
            aspx = aspx.replace("\n ", "\n");
        }
        aspx = aspx.replace("\n", "");
        aspx = aspx.replace("\t", "");

        var result = "";
        var arrs = aspx.split("<");
        for (var i = 0; i < arrs.length; i++) {
            if (i == 0) {
                if ($.trim(arrs[i])) {
                    result += $.trim(arrs[i]);
                }
                continue;
            }

            if (arrs[i].indexOf("/") == 0 && spaceCount > 0) {
                spaceCount--;
            }
            if (i > 0 && (arrs[i - 1].indexOf("label") == 0 || arrs[i - 1].indexOf("span") == 0)) { }
            else {
                result += this.getSapceValue(spaceCount);
            }
            if (arrs[i].indexOf("\n") > -1
                || arrs[i].indexOf("label") == 0
                || arrs[i].indexOf("span") == 0) {
                result += "<" + arrs[i];
            } else {
                result += "<" + arrs[i].replace(">", ">\n");
            }
            if (arrs[i].indexOf("/>") > -1) {
            }
            else if (arrs[i].indexOf("/") != 0) {
                if (arrs[i].indexOf("br ") == 0
                    || arrs[i].indexOf("input") == 0
                    || arrs[i].indexOf("br>") == 0
                    || arrs[i].indexOf("br/>") == 0
                    || arrs[i].indexOf("hr ") == 0
                    || arrs[i].indexOf("hr>") == 0
                    || arrs[i].indexOf("hr/>") == 0) {
                }
                else {
                    spaceCount++;
                }
            }
        }
        return result;
    },
    //保存
    Save: function () {
        var sheetName = $.trim(this.Controls.txtSheetName.val());
        if (sheetName == "") {
            $.H3Dialog.Warn({ content: "表单名称不允许为空!" });
            return;
        }
        if (this.Mode == DesignerMode.ASPX) {
            var aspxValue = this.getAspxValue();
            aspxValue = this.getDesignerFromAspx(aspxValue);
            $(".DesignerContent").html(aspxValue);
            this.refresh();
        }

        var printModel = this.Controls.txtPrint.val();
        var javascript = this.Controls.txtJavascript.val();
        var sheetCode = this.Controls.hidSheetCode.val();
        var designModeContent = this.getDesignerContent();
        var enabledCode = $(this.Controls.chkCharpCode).is(":checked");
        var csharpCode = this.getCSharpValue(); // this.Controls.txtCSharpCode.val();
        var runtimeContent = this.getRuntimeContent(designModeContent, false);
        var editor = this.Controls.hidCurrentUser.val();
        var _data = {
            DesignModeContent: encodeURIComponent(designModeContent),
            RuntimeContent: encodeURIComponent(runtimeContent),
            EnabledCode: enabledCode,
            CSharpCode: csharpCode,
            Editor: encodeURI(editor),
            SheetCode: encodeURI(sheetCode),
            PrintModel: encodeURIComponent(printModel),
            Javascript: encodeURIComponent(javascript),
            SheetName: sheetName
        };

        this.LoadSaveDialog(true);
        var that = this;
        //1.保存
        $.ajax({
            type: "POST",
            url: PortalRoot + "/MVCDesigner/SaveSheet",
            data: _data,
            dataType: "json",
            async: true,
            success: function (data) {
                that.LoadSaveDialog(false);
                if (data.Success) {
                    $.H3Dialog.Success({ content: $.Lang(data.Message) });
                }
                else {
                    $.H3Dialog.Success({ content: $.Lang(data.Message) });
                }
            },
            error: function (e) {
                that.LoadSaveDialog(false);
                $.H3Dialog.Error({ content: "保存失败！" });
            }
        });
    },
    Restore: function () {
        if (this.Mode == DesignerMode.ASPX) {
            var aspxValue = this.getAspxValue();
            aspxValue = this.getDesignerFromAspx(aspxValue);
            $(".DesignerContent").html(aspxValue);
            this.refresh();
        }

        var sheetCode = this.Controls.hidSheetCode.val();
        var editor = this.Controls.hidCurrentUser.val();
        var sheetName = $.trim(this.Controls.txtSheetName.val()) || sheetCode;
        // var sheetName = encodeURI(sheetCode); //还原表单时，sheetname 默认为SheetCode
        var _data = {
            DesignModeContent: "",
            RuntimeContent: "",
            EnabledCode: false,
            CSharpCode: "",
            Editor: encodeURI(editor),
            SheetCode: encodeURI(sheetCode),
            PrintModel: "",
            Javascript: "",
            SheetName: sheetName
        };

        this.LoadSaveDialog(true);
        var that = this;
        //1.保存
        $.ajax({
            type: "POST",
            url: PortalRoot + "/MVCDesigner/SaveSheet",
            data: _data,
            dataType: "json",
            async: true,
            success: function (data) {
                that.LoadSaveDialog(false);
                if (data.Success) {
                    $.H3Dialog.Success({ content: "还原成功！" });
                    //刷新页面
                    top.workTab.reload(top.workTab.getSelectedTabItemID());
                }
                else {
                    $.H3Dialog.Success({ content: data.Message });
                }
            },
            error: function (e) {
                that.LoadSaveDialog(false);
                $.H3Dialog.Error({ content: "还原失败！" });
            }
        });
    },
    // 显示弹出窗口
    ShowExport: function () {
        var that = this;
        this.PopWindow({
            id: this.Controls.divExportAspx.attr("id"),
            sumbitfunc: function () {
                that.Export();
            },
            open: true
        });
        this.Export();
    },
    // 导出成 ASPX 文件
    Export: function () {
        var designerModeContent = this.getDesignerContent();
        var runtimeContent = this.getRuntimeContent(designerModeContent, true);
        var csharpCode = this.getCSharpValue();// this.Controls.txtCSharpCode.val();

        this.Controls.txtAspx.val(runtimeContent);
        this.Controls.txtCsharp.val(csharpCode);
        return true;
    },
    download: function (url) {
        var iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.style.display = "none";
        document.body.appendChild(iframe);
    },
    //预览
    Preview: function () {
        var SheetCode = encodeURI(this.Controls.hidSheetCode.val()); // 表单编码
        var SchemaCode = encodeURI(this.Controls.hidSchemaCode.val());  // 数据模型编码
        // TODO:待改成预览开发平台表单
        var src = PortalRoot + "/StartInstance.html?SchemaCode=" + SchemaCode + "&PageAction=Close&SheetCode=" + SheetCode + "&T=" + parseInt(Math.random() * 100000);
        window.open(src, "_blank");
    },
    //还原初次状态
    backFirstState: function () {
        window.location.reload();
    },
    //获取Url上参数值
    GetQueryString: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return unescape(r[2]);
        return null;
    },
    //显示保存对话框
    LoadSaveDialog: function (visible, msg) {
        if (!msg) msg = "正在保存...";
        if (visible) {
            this.PopWindow({
                id: "save"
            }).find(".message").html(msg);
        }
        else { //如果隐藏
            this.Controls.lockScreen.hide();
            $("#save").hide();
        }
    },
    PopWindow: function (options) {
        if (!options.id) return;
        var divPop = $("#" + options.id);
        this.Controls.lockScreen.show();
        if (options.initfunc) options.initfunc.call(this);
        var that = this;
        divPop.css({
            'position': 'absolute',
            'border': '2px solid #CAE8EA',
            'background-color': 'white',
            'z-index': 999,
            'left': ($(window).width() - divPop.width()) / 2,
            'top': ($(window).height() - divPop.height()) / 2
        }).show()
          .find(".close").unbind("click").click(function (e) {
              e.stopPropagation();
              //隐藏弹出窗口
              divPop.hide();
              that.Controls.lockScreen.hide();
          });
        divPop.find(".submit").unbind("click").click(function (e) {
            if (options.sumbitfunc) options.sumbitfunc.call(this);
            e.stopPropagation();
            if (options.open) return;
            divPop.hide();
            that.Controls.lockScreen.hide();
        });
        return divPop;
    },
    SetItemUsedStyle: function (itemName) {
        if (!itemName) return;

        $("span[class^='dragable']").each(function () {
            if ($(this).attr("dataitem") == itemName) {
                $(this).addClass("itemSelected");
                return false;
            }
        });
    }
};