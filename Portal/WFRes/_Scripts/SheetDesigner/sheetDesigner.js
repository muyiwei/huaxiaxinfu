//设计器类
var Designer = function () {
    this.HtmlModels = HtmlModels;             // 控件模型
    this.DesignerControls = DesignerControls; // 控件范围
    this.DataLogicTypes = DataLogicTypes;     // 数据类型
    this.SelectedCtrlProperty = {};           // 当前选中的控件属性
    this.ControlIndex = 0;           // 控件ID索引
    this.PropertyPanel = null;       // 属性面板
    this.ClipBoard = null;           // 剪切板
    this.TabLogic = null;            // 表格逻辑
    this.BasicPropertyWindow = null; // 基本属性窗口
    this.AspxEditor = null;          // ASPX编辑器
    this.CSharpEditor = null;        // C#编辑器
    this.Controls = null;
    this.SaveSheetsFolderName = "H3Sheets";
    this.PropertyArray = [];
    this.ControlClick = false;
    this.DefaultProperties = [];
    this.Layout = null;
    this.DesignerChanged = false;     // 设计区域是否有变更
    this.ASPXChanged = false;         // ASPX是否有变更
    this.Mode = DesignerMode.Designer;
};

var DesignerMode = { Designer: 0, ASPX: 1 };

Designer.prototype = {
    //设计器初始化
    Initial: function (layout) {
        //初始化属性面板
        this.PropertyPanel = new PropertyPanel();
        this.ClipBoard = new ClipBoard();
        this.TabLogic = new TableLogic();
        this.Layout = layout;
        this.BasicPropertyWindow = new BasicPropertyWindow();  //初始化基本属性窗口控件

        this.Controls = {
            save: $(".save"),           // 保存
            preview: $(".preview"),     // 预览
            btnExport: $("#btnExport"), // 导出 ASPX
            txtAspx: $("#txtAspx"),                           // ASPX代码
            txtCsharp: $("#txtCsharp"),                       // C#代码
            backFirstState: $(".backFirstState"),             // 还原初次状态
            back: $(".return"),                               // 返回
            content_m1: $(".content_m1"),                     // 设计区内容
            txtCSharpCode: $(".CSharpCode"),                  // C#代码内容
            txtRuntimeContent: $(".RuntimeContent"),          // ASPX代码
            chkCharpCode: $(".EnabledCode"),                  // 是否启用C#代码
            txtExportPageName: $("#txtExportPageName"),       // 设计区内容
            divTopBars: $("#divTopBars"),                     // SheetActionPanel容器
            hfdIDIndex: $("input[id$='hfdIDIndex']"),         // 控件ID
            hidCurrentUser: $("input[id$='hidCurrentUser']"), // 当前用户
            hidSheetCode: $("input[id$='hidSheetCode']"),     // 表单编码
            hidSchemaCode: $("input[id$='hidSchemaCode']"),   // 数据模型编码
            divExportAspx: $("#divExportAspx"),               // 导出弹出窗口
            divSheetProperty: $("#divSheetProperty"),         // 表单属性
            tbSheetProperty: $("#tbSheetProperty"),           // 表单属性
            divBasic: $("#divBasic"),
            divTDTitle: $("#divTDTitle"),
            tabProperty: $("#tabProperty"),
            tdProperty: $("#tdProperty"),
            div_WorkSheet: $("#div_WorkSheet"),
            tabProperty_WorkSheet: $("#tabProperty_WorkSheet"), // Worksheet属性
            lockScreen: $("#screen"),                           // 锁屏
            designElem: $(".designElem"),                       // 可设计的数据项
            txtJavascript: $("#txtJavascript"),                 // 表单属性Javascript
            txtPrint: $("#txtPrint"),                           // 表单打印模板
            txtSheetCode: $("#txtSheetCode"),                   // 表单编码
            txtSheetName: $("#txtSheetName")                    // 表单名称
        };

        // this.ControlIndex = parseInt(this.Controls.hfdIDIndex.val());
        // 注册 Document 删除事件
        this._RegisterDeleteEvent(this.Layout);
        // 注册所有元素的设计事件
        this.Controls.designElem.Designable();
        this.Controls.chkCharpCode.find("input").change(function () {
            if (this.checked) {
                $(".CSharpCode").removeAttr("disabled");
            }
            else {
                $(".CSharpCode").attr("disabled", "disabled");
            }
        }).change();
        this.Controls.txtRuntimeContent.change(function () {
            Designer.ASPXChanged = true;
        });
        this.Controls.txtJavascript.RichTextBind("设置页面加载时执行的Javascript");
        this.Controls.txtPrint.RichTextBind("设置表单打印的HTML模板");

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
        // this.Controls.save.click(function () { Designer.Save(); });
        // this.Controls.back.click(function () { history.go(-1); }); //返回
        // this.Controls.preview.click(function () { Designer.Preview(); });  //预览
        // this.Controls.btnExport.click(function () { Designer.ShowExport(); });  //导出事件
        // this.Controls.backFirstState.click(function () { Designer.backFirstState(); });  //还原
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
    //注册全局删除事件
    _RegisterDeleteEvent: function (layout) {
        $("select").filter(".dragable").unbind("keyup.designer").bind("keyup.designer", function (e) {
            //增加del删除键功能
            if (e.keyCode == 46) {
                Designer.RemovePropertyToArray($(this));
                Designer.ClipBoard.Remove($(this));
            }
            else if (e.keyCode == 115) {// F4 显示属性界面
                layout.setRightCollapse(false);
            }
                //增加复制粘贴功能
            else if (e.ctrlKey == true && e.keyCode == 67) {
                Designer.ClipBoard.Copy($(this));
            }
            else if (e.ctrlKey == true && e.keyCode == 88) {
                Designer.ClipBoard.Cut($(this));
            }
            else if (e.ctrlKey == true && e.keyCode == 86) {
                Designer.ClipBoard.Plaste($(this));
            }
        });
        $(document).unbind("keyup.designer").bind("keyup.designer", function (e) {
            //增加del删除键功能
            if (e.keyCode == 46) {
                // if (e.target.id.indexOf("p_") == 0 || e.target.id.indexOf("pWorkSheet_") == 0) return;
                Designer.RemovePropertyToArray($("#" + Designer.SelectedCtrlProperty.Id));
                Designer.ClipBoard.Remove($("#" + Designer.SelectedCtrlProperty.Id));
            }
            else if (e.keyCode == 115) {// F4 显示属性界面
                layout.setRightCollapse(false);
            }
                //增加复制粘贴功能
            else if (e.ctrlKey == true && e.keyCode == 67) {
                Designer.ClipBoard.Copy($("#" + Designer.SelectedCtrlProperty.Id));
            }
            else if (e.ctrlKey == true && e.keyCode == 88) {
                Designer.ClipBoard.Cut($("#" + Designer.SelectedCtrlProperty.Id));
            }
            else if (e.ctrlKey == true && e.keyCode == 86) {
                var elem = $(Designer.ClipBoard.Elem);
                //禁止将SheetActionPanel放入表格单元格中
                if (elem.is("span") && elem.attr("class").indexOf("designElem") > -1) {
                    alert("当前单元格不支持所拖拽类型！");
                    $("*").removeClass("focus");
                    return;
                }
                elem.removeClass("selected");
                var ParentControl = Designer.TabLogic.SelectedTabCell;
                Designer.ClipBoard.Plaste(ParentControl);
                Designer.AddPropertyToArray(elem);
            }
        });
        $(document).unbind("keydown.designer").bind("keydown.designer", function (e) {
            if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
                event.returnvalue = false;
                Designer.ClipBoard.Cancel();
            }
        });
        $(".content_m1").unbind("click.designer").bind("click.designer", function (e) {
            if (!Designer.ControlClick) {
                Designer.Controls.divSheetProperty.show();
                Designer.Controls.tbSheetProperty.show();
                Designer.Controls.divBasic.hide();
                Designer.Controls.divTDTitle.hide();
                Designer.Controls.tabProperty.hide();
                Designer.Controls.tdProperty.hide();
                Designer.Controls.div_WorkSheet.hide();
                Designer.Controls.tabProperty_WorkSheet.hide();
            }
            else
                Designer.ControlClick = false;
        });
    },
    //获取临时生成的控件ID
    GetControlID: function () {
        // this.ControlIndex++;
        // this.Controls.hfdIDIndex.val(this.ControlIndex);  //保存最新的Index值
        var id = "ctl" + Math.round(Math.random() * 1000000, 0);
        if ($("#" + id).length > 0) id = "ctl" + Math.round(Math.random() * 1000000, 0);
        return id;
        // return "SheetControl" + this.ControlIndex;
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

        $.ajax({
            type: "POST",
            async: ansy,
            url: "SheetDesignerService.ashx",
            data: { Command: "GetControlProperty", ControlFullName: FullName },
            dataType: "json",
            success: function (data) {
                Designer.DefaultProperties.push({ Name: FullName, Property: data });
                if (func != null) func.call(this, data);
            }
        });
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
    // 获取设置后的 Worksheet 属性值
    GetWorksheetProperty: function () {
        var PropertysArray = [];
        $("*[property^='{']").each(function (index) {
            var o = $(this);
            var p = o.attr("property");
            p = JSON.parse(p);
            if (o.hasClass("_subTab")) {
                var headers, columns;
                headers = o.find("tr").eq(0).find("*[property^='{']");
                p.Headers = [];
                for (var i = 0; i < headers.length; i++) {
                    p.Headers.push(JSON.parse($(headers[i]).attr("property")));
                }
                columns = o.find("tr").eq(1).find("*[property^='{']");
                p.Columns = [];
                for (var i = 0; i < columns.length; i++) {
                    p.Columns.push(JSON.parse($(columns[i]).attr("property")));
                }
            }

            PropertysArray.push(p);
        });

        //div元素 当使用 *[property^='{'] 搜索时找不到??  用此方法替代
        $("div").each(function () {
            if ($(this).attr("property")) {
                var p = JSON.parse($(this).attr("property"));
                var flag = false;
                for (var i = 0, j = PropertysArray.length; i < j; i++) {
                    if (PropertysArray[i] == p) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    PropertysArray.push(p);
                }
            }
        });

        $("span[class^='_subTab']").each(function () {
            if ($(this).attr("property")) {
                var p = JSON.parse($(this).attr("property"));
                var flag = false;
                for (var i = 0, j = PropertysArray.length; i < j; i++) {
                    if (PropertysArray[i] == p) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    PropertysArray.push(p);
                }
            }
        });

        return JSON.stringify(PropertysArray);
    },
    //保存
    Save: function () {
        //if (this.Controls.divTopBars.find("table").length <= 0) {
        //    alert("H3表单必须包含SheetActionPanel控件,请拖入到该设计区域内！");
        //    return;
        //}
        var sheetJson = this.GetWorksheetProperty();
        var sheetName = $.trim(this.Controls.txtSheetName.val());
        if (sheetName == "") {
            //如果表单名称为空，取表单编码
            sheetName == this.Controls.hidSheetCode.val();
            //alert("表单名称不允许为空!");
            //return;
        }
        var printModel = this.Controls.txtPrint.val();
        var javascript = this.Controls.txtJavascript.val();
        var sheetCode = this.Controls.hidSheetCode.val();
        var designerContent = this.Controls.content_m1.clone();
        designerContent.find(".tabMenu").remove();
        designerContent.find("table").removeAttr("tabproperty"); //.removeAttr("property");
        var sheetHtml = designerContent.html();  //Html
        var enabledCode = this.Controls.chkCharpCode.find("input").is(":checked");
        var csharpCode = this.getCSharpValue(); // this.Controls.txtCSharpCode.val();
        var runtimeContent = this.getAspxValue();// this.Controls.txtRuntimeContent.val();
        var editor = this.Controls.hidCurrentUser.val();

        var _data = {
            Command: "SaveSheet",
            SheetHtml: sheetHtml,
            SheetRuntimeContent: runtimeContent,
            SheetJson: sheetJson,
            EnabledCode: enabledCode,
            CSharpCode: csharpCode,
            Editor: encodeURI(editor),
            SheetCode: encodeURI(sheetCode),
            ASPXChanged: this.getAspxChanged(),// this.ASPXChanged,
            PrintModel: printModel,
            Javascript: javascript,
            SheetName: sheetName
        };

        Designer.LoadSaveDialog(true);

        //1.保存
        $.ajax({
            type: "POST",
            url: "SheetDesignerService.ashx",
            data: _data,
            dataType: "json",
            async: true,
            success: function (data) {
                Designer.LoadSaveDialog(false);
                if (parseInt(data) == 0) {
                    alert("保存成功！");
                }
                else {
                    alert(data);
                }
            },
            error: function (e) {
                Designer.LoadSaveDialog(false);
                alert("保存失败！");
            }
        });
    },
    // 显示弹出窗口
    ShowExport: function () {
        this.PopWindow({
            id: this.Controls.divExportAspx.attr("id"),
            sumbitfunc: function () {
                Designer.Export();
            },
            open: true
        });
        this.Export();
    },
    // 导出成 ASPX 文件
    Export: function () {
        //var PageName = $.trim(this.Controls.txtExportPageName.val());
        //if (PageName == "") {
        //    alert("必须设置导出的文件名!");
        //    return false;
        //}
        var sheetJson = this.GetWorksheetProperty();
        var sheetCode = this.Controls.hidSheetCode.val();
        var designerContent = this.Controls.content_m1.clone();
        designerContent.find(".tabMenu").remove();
        designerContent.find("table").removeAttr("tabproperty"); //.removeAttr("property");
        var sheetHtml = designerContent.html();  //Html
        var editor = this.Controls.hidCurrentUser.val();
        var pageName = this.Controls.txtExportPageName.val();
        var csharpCode = this.getCSharpValue();// this.Controls.txtCSharpCode.val();
        var scriptValue = this.Controls.txtJavascript.val();

        var _data = {
            Command: "ExportSheet",
            SheetHtml: sheetHtml,
            SheetJson: sheetJson,
            Script: encodeURI(scriptValue),
            Editor: encodeURI(editor),
            SheetCode: encodeURI(sheetCode),
            PageName: pageName
        };

        //1.导出操作
        $.ajax({
            type: "POST",
            url: "SheetDesignerService.ashx",
            data: _data,
            dataType: "json",
            async: false,
            success: function (data) {
                if (data.ASPX) {
                    Designer.Controls.txtAspx.val(data.ASPX);
                    Designer.Controls.txtCsharp.val(csharpCode);
                }
                else {
                    alert(data);
                }
            },
            error: function (e) {
                alert("导出失败！");
            }
        });
        return true;
    },
    // 获取到设计的ASPX内容
    GetDesignerASPX: function () {
        // if (!this.DesignerChanged &&  Designer.Controls.txtRuntimeContent.val()) return;
        if (!this.DesignerChanged && this.getAspxValue()) return;
        var sheetJson = this.GetWorksheetProperty();
        var sheetCode = this.Controls.hidSheetCode.val();
        var designerContent = this.Controls.content_m1.clone();
        designerContent.find(".tabMenu").remove();
        designerContent.find("table").removeAttr("tabproperty"); //.removeAttr("property");
        var sheetHtml = designerContent.html();  //Html
        var editor = this.Controls.hidCurrentUser.val();
        var pageName = this.Controls.txtExportPageName.val();
        // var csharpCode = this.getCSharpValue();// this.Controls.txtCSharpCode.val();

        this.LoadSaveDialog(true, "正在加载ASPX");
        var _data = {
            Command: "GetDesignerASPX",
            SheetHtml: sheetHtml,
            SheetJson: sheetJson,
            Editor: encodeURI(editor),
            SheetCode: encodeURI(sheetCode),
            PageName: pageName
        };

        //1.导出操作
        $.ajax({
            type: "POST",
            url: "SheetDesignerService.ashx",
            data: _data,
            dataType: "json",
            async: false,
            success: function (data) {
                Designer.LoadSaveDialog(false);
                if (data.ASPX) {
                    // Designer.Controls.txtRuntimeContent.val(data.ASPX);
                    Designer.setAspxValue(data.ASPX);
                    this.DesignerChanged = false;
                }
                else {
                    alert(data);
                }
            },
            error: function (e) {
                this.LoadSaveDialog(false);
                alert("获取ASPX失败！");
            }
        });
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
        var src = "../../StartInstance.aspx?SchemaCode=" + SchemaCode + "&PageAction=Close&SheetCode=" + SheetCode + "&T=" + parseInt(Math.random() * 100000);
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
            Designer.Controls.lockScreen.hide();
            $("#save").hide();
        }
    },
    PopWindow: function (options) {
        if (!options.id) return;
        var divPop = $("#" + options.id);
        Designer.Controls.lockScreen.show();
        if (options.initfunc) options.initfunc.call(this);
        divPop.css({
            'position': 'absolute',
            'border': '2px solid #CAE8EA',
            'background-color': 'white',
            'z-index': 100,
            'left': ($(window).width() - divPop.width()) / 2,
            'top': ($(window).height() - divPop.height()) / 2
        }).show()
          .find(".close").unbind("click").click(function (e) {
              e.stopPropagation();
              //隐藏弹出窗口
              divPop.hide();
              Designer.Controls.lockScreen.hide();
          });
        divPop.find(".submit").unbind("click").click(function (e) {
            if (options.sumbitfunc) options.sumbitfunc.call(this);
            e.stopPropagation();
            if (options.open) return;
            divPop.hide();
            Designer.Controls.lockScreen.hide();
        });
        return divPop;
    },
    //移除属性从数组中
    RemovePropertyToArray: function (elem) {
        //检测当前Propertys数组中是否还存在该数据项
        var p = $(elem).attr("property");
        if (p == null) return;

        var formatProperty = JSON.parse(p);
        var index = -1;
        for (var i = 0, j = Designer.PropertyArray.length; i < j; i++) {
            if (Designer.PropertyArray[i].Id == formatProperty.Id) {
                index = i;
                break;
            }
        }
        if (index == -1) return;
        //删除该元素
        Designer.PropertyArray.splice(index, 1);

        if (formatProperty.FullName == Designer.DesignerControls.SheetLabel.FullName ||
                formatProperty.FullName == Designer.DesignerControls.Label.FullName) {
            return;
        }
        var itemName = formatProperty.ItemName;
        if (itemName == null) return;

        $("span[class^='dragable']").each(function () {
            if ($(this).attr("dataitem") == itemName) {
                // 检测当前ItemName的控件是否还存在
                var flag = false;
                for (var i = 0, j = Designer.PropertyArray.length; i < j; i++) {
                    var _p = Designer.PropertyArray[i];
                    if (_p.ItemName == itemName &&
                            (_p.FullName != Designer.DesignerControls.SheetLabel.FullName ||
                            _p.FullName == Designer.DesignerControls.Label.FullName)
                        ) {
                        flag = true;
                        break;
                    }
                }
                // 如果没找到
                if (!flag) {
                    $(this).removeClass("itemSelected");
                }
                return false;
            }
        });
    },
    // 增加属性到数组中
    AddPropertyToArray: function (elem) {
        // 检测当前Propertys数组中是否还存在该数据项
        var p = $(elem).attr("property");
        if (p == null) return;

        var formatProperty = JSON.parse(p);
        Designer.PropertyArray.push(formatProperty);
        if (formatProperty.FullName == Designer.DesignerControls.SheetLabel.FullName ||
                formatProperty.FullName == Designer.DesignerControls.Label.FullName) {
            return;
        }
        this.SetItemUsedStyle(formatProperty.ItemName);
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
    //....
};


/*
 -------------------------------------------------------------------------
 可设计的控件类型定义
 -------------------------------------------------------------------------
*/
// 控件的 HTML 模型 （备注：用div或span取代table元素）
var HtmlModels = {
    Label: "<span class=\"designElem dragable\" style=\"z-index:101\">Label</span>",
    SheetActionPanel: "<table type=\"-3\" class=\"flow_info_menu designElem dragable\""
            + " style=\"height:30px;width:100%;line-height:30px;font-weight:bold;z-index:101;\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
            + "<tr><td style=\"text-align:left;padding-left:10px;\">SheetActionPanel</td></tr>"
            + "</table>",
    SheetLabel: "<span class=\"designElem dragable\" style=\"z-index:101\">SheetLabel</span>",
    SheetHyperLink: "<span class=\"designElem dragable\" style=\"z-index:101\">SheetHyperLink</span>",
    SheetTextBox: "<input type=\"text\" m_width=\"80\" style=\"z-index:101;\" class=\"inputMouseOut dragable\"/>",
    SheetInstanceNameEditor: "<input type=\"text\" m_width=\"80\" style=\"z-index:101;\" class=\"inputMouseOut dragable\"/>",
    SheetBizTextBox: "<input type=\"text\" m_width=\"80\" style=\"z-index:101;\" class=\"inputMouseOut dragable\"/>",
    SheetDropDownList: "<select m_width=\"80\"  style=\"z-index:101\" class='dragable'/>",
    SheetInstancePrioritySelector: "<select m_width=\"80\"  style=\"z-index:101\" class='dragable'/>",
    SheetCheckBoxList: "<span style='padding-top:5px;z-index:101;' m_width=\"80\" class=\"dragable\"><input type='checkbox'>Item1<input type='checkbox'>Item2<input type='checkbox'>Item...</span>",
    SheetRadioButtonList: "<span style='padding-top:5px;z-index:101;' m_width=\"80\" class=\"dragable\"><input type='radio'>Item1<input type='radio'>Item2<input type='radio'>Item...</span>",
    SheetBizDropDownList: "<select m_width=\"80\" class=\"dragable\"  style=\"z-index:101\"/>",
    SheetCheckBox: "<input type=\"checkbox\" class=\"dragable\"  style=\"z-index:101\"/>",
    SheetAttachment: "<a style='text-decoration:underline;color:blue;z-index:101;' m_width=\"80\" class=\"dragable\">添加</a>",
    SheetTime: "<input type=\"text\" maxlength=\"10\" value='yyyy-MM-dd' m_width=\"80\" style=\"width:130px;z-index:101;\" class=\"dragable\"/>",
    SheetRichTextBox: "<textarea rows=\"2\" colos=\"20\" class=\"inputMouseOut dragable\" m_width=\"80\" m_height=\"500\" style=\"height:60px;width:80%;z-index:101;\"/>",
    SheetComment: "<div style=\"width:80%;height:190px;z-index:101;\" class=\"dragable\" m_width=\"80\" m_height=\"180\">" +
                            "<textarea rows=\"2\" cols=\"20\" class=\"inputMouseOut\" style=\"height:130px;width:100%;\">" +
                            "</textarea>" + "<select style=\"width:100%;\">" +
	                        "<option value=\"--请选择常用意见--\">--请选择常用意见--</option>" +
                            "</select>" +
                            "<div class=\"approval\"><input type=\"radio\" value=\"true\" checked=\"checked\" /><label>同意</label><input type=\"radio\" value=\"false\" /><label>不同意</label></div>" +
                    "</div>",
    SheetDetail: "<span class='_subTab dragable' style=\"z-index:101\" m_width='100'></span>",
    SheetGridView: "<span class='_subTab dragable' style=\"z-index:101\" m_width='100'></span>",
    SheetBizDetail: "<span class='_subTab dragable' style=\"z-index:101\" m_width='100'></span>",
    SheetSingleUserSelector: "<div style=\"width:80%;z-index:101;\" class=\"dragable\" m_width=\"80\">" +
                "<input type=\"text\" class=\"inputMouseOut\" readonly=\"readonly\" style=\"width:90%;\" />" +
                "<IMG style=\"cursor:pointer\" height=\"16\" border=\"0\" src=\"" + _PORTALROOT_GLOBAL + "/WFRes/images/p_add.gif\" Title=\"添加\">" +
                "<IMG height=\"16\" style=\"cursor:pointer\" src=\"" + _PORTALROOT_GLOBAL + "/WFRes/images/p_del.gif\" border=0 style=\"CURSOR: hand\" title=\"清除\"></a>" +
                "</div>",
    SheetMultiUserSelector: "<div style=\"width:80%;z-index:101;\" class=\"dragable\" m_width=\"80\" m_height=\"60\" >" +
                "<input type=\"text\" class=\"inputMouseOut\" readonly=\"readonly\" style=\"width:90%;height:60px;margin-right:5px;\" />" +
                "<IMG style=\"cursor:pointer\" height=\"16\" valign='absMiddle' border=\"0\" src=\"" + _PORTALROOT_GLOBAL + "/WFRes/images/p_add.gif\" Title=\"添加\">" +
                "<IMG height=\"16\" style=\"cursor:pointer\" valign='absMiddle' src=\"" + _PORTALROOT_GLOBAL + "/WFRes/images/p_del.gif\" border=0 style=\"CURSOR: hand\" title=\"清除\"></a>" +
                "</div>",
    SheetUserList: "<span style='padding-top:5px;padding-bottom:5px;z-index:101;' class=\"dragable\" m_width=\"80\">" +
                "<input type=\"text\" class=\"inputMouseOut\"/>" +
                "<img src=\"" + _PORTALROOT_GLOBAL + "/WFRes/images/p_add.gif\" align='absMiddle' border=0 style=\"CURSOR: hand;margin-left:5px;\"/>" +
                "</span>",
    SheetOffice: "<a style='text-decoration:underline;color:blue;z-index:101;' m_width=\"80\" class=\"dragable\">NTKO文档控件</a>"
};

//设计器控件范围
var DesignerControls = {
    SheetActionPanel: {
        FullName: "OThinker.H3.WorkSheet.SheetActionPane",
        DisplayName: "SheetActionPanel",
        Model: HtmlModels.SheetActionPanel,
        WorkSheetProperty: null
    },
    Label: {
        FullName: "System.Web.UI.WebControls",
        DisplayName: "Label",
        Model: HtmlModels.Label,
        WorkSheetProperty: null
    },
    SheetLabel: {
        FullName: "OThinker.H3.WorkSheet.SheetLabel",
        DisplayName: "SheetLabel",
        Model: HtmlModels.SheetLabel,
        WorkSheetProperty: null
    },
    SheetTextBox: {
        FullName: "OThinker.H3.WorkSheet.SheetTextBox",
        DisplayName: "SheetTextBox",
        Model: HtmlModels.SheetTextBox,
        WorkSheetProperty: null
    },
    SheetHyperLink: {
        FullName: "OThinker.H3.WorkSheet.SheetHyperLink",
        DisplayName: "SheetHyperLink",
        Model: HtmlModels.SheetHyperLink,
        WorkSheetProperty: null
    },
    SheetInstanceNameEditor: {
        FullName: "OThinker.H3.WorkSheet.SheetInstanceNameEditor",
        DisplayName: "SheetInstanceNameEditor",
        Model: HtmlModels.SheetInstanceNameEditor,
        WorkSheetProperty: null
    },
    SheetInstancePrioritySelector: {
        FullName: "OThinker.H3.WorkSheet.SheetInstancePrioritySelector",
        DisplayName: "SheetInstancePrioritySelector",
        Model: HtmlModels.SheetInstancePrioritySelector,
        WorkSheetProperty: null
    },
    SheetBizTextBox: {
        FullName: "OThinker.H3.WorkSheet.SheetBizTextBox",
        DisplayName: "SheetBizTextBox",
        Model: HtmlModels.SheetBizTextBox,
        WorkSheetProperty: null
    },
    SheetDropDownList: {
        FullName: "OThinker.H3.WorkSheet.SheetDropDownList",
        DisplayName: "SheetDropDownList",
        Model: HtmlModels.SheetDropDownList,
        WorkSheetProperty: null
    },
    SheetRadioButtonList: {
        FullName: "OThinker.H3.WorkSheet.SheetRadioButtonList",
        DisplayName: "SheetRadioButtonList",
        Model: HtmlModels.SheetRadioButtonList,
        WorkSheetProperty: null
    },
    SheetCheckBoxList: {
        FullName: "OThinker.H3.WorkSheet.SheetCheckBoxList",
        DisplayName: "SheetCheckBoxList",
        Model: HtmlModels.SheetRadioButtonList,
        WorkSheetProperty: null
    },
    SheetBizDropDownList: {
        FullName: "OThinker.H3.WorkSheet.SheetBizDropDownList",
        DisplayName: "SheetBizDropDownList",
        Model: HtmlModels.SheetBizDropDownList,
        WorkSheetProperty: null
    },
    SheetCheckBox: {
        FullName: "OThinker.H3.WorkSheet.SheetCheckBox",
        DisplayName: "SheetCheckBox",
        Model: HtmlModels.SheetCheckBox,
        WorkSheetProperty: null
    },
    SheetAttachment: {
        FullName: "OThinker.H3.WorkSheet.SheetAttachment",
        DisplayName: "SheetAttachment",
        Model: HtmlModels.SheetAttachment,
        WorkSheetProperty: null
    },
    SheetTime: {
        FullName: "OThinker.H3.WorkSheet.SheetTime",
        DisplayName: "SheetTime",
        Model: HtmlModels.SheetTime,
        WorkSheetProperty: null
    },
    SheetRichTextBox: {
        FullName: "OThinker.H3.WorkSheet.SheetRichTextBox",
        DisplayName: "SheetRichTextBox",
        Model: HtmlModels.SheetRichTextBox,
        WorkSheetProperty: null
    },
    SheetComment: {
        FullName: "OThinker.H3.WorkSheet.SheetComment",
        DisplayName: "SheetComment",
        Model: HtmlModels.SheetComment,
        WorkSheetProperty: null
    },
    SheetDetail: {
        FullName: "OThinker.H3.WorkSheet.SheetDetail",
        DisplayName: "SheetDetail",
        Model: HtmlModels.SheetDetail,
        WorkSheetProperty: null
    },
    SheetGridView: {
        FullName: "OThinker.H3.WorkSheet.SheetGridView",
        DisplayName: "SheetGridView",
        Model: HtmlModels.SheetGridView,
        WorkSheetProperty: null
    },
    SheetBizDetail: {
        FullName: "OThinker.H3.WorkSheet.SheetBizDetail",
        DisplayName: "SheetBizDetail",
        Model: HtmlModels.SheetBizDetail,
        WorkSheetProperty: null
    },
    SheetSingleUserSelector: {
        FullName: "OThinker.H3.WorkSheet.SheetUserSelector",
        DisplayName: "SheetUserSelector",
        Model: HtmlModels.SheetSingleUserSelector,
        WorkSheetProperty: null
    },
    SheetMultiUserSelector: {
        FullName: "OThinker.H3.WorkSheet.SheetUserSelector",
        DisplayName: "SheetUserSelector",
        Model: HtmlModels.SheetMultiUserSelector,
        WorkSheetProperty: null
    },
    SheetUserList: {
        FullName: "OThinker.H3.WorkSheet.SheetUserList",
        DisplayName: "SheetUserList",
        Model: HtmlModels.SheetUserList,
        WorkSheetProperty: null
    },
    SheetOffice: {
        FullName: "OThinker.H3.WorkSheet.SheetOffice",
        DisplayName: "SheetOffice",
        Model: HtmlModels.SheetOffice,
        WorkSheetProperty: null
    }
};

//设计器数据类型
var DataLogicTypes = {
    //表单控件的类型  
    SheetActionPanel: {
        Type: -3,
        DisplayName: "SheetActionPanel",
        ControlRange: [
        DesignerControls.SheetActionPanel
        ]
    },
    Label: {
        Type: -2,
        DisplayName: "Label",
        ControlRange: [
        DesignerControls.Label
        ]
    },
    SheetLabel: {
        Type: -1,
        DisplayName: "SheetLabel",
        ControlRange: [
        DesignerControls.SheetLabel
        ]
    },
    //短文本
    ShortString: {
        Type: 14,
        DisplayName: '短文本',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetCheckBoxList,
            DesignerControls.SheetRadioButtonList,
            DesignerControls.SheetBizTextBox,
            DesignerControls.SheetBizDropDownList,
            DesignerControls.SheetInstancePrioritySelector,
            DesignerControls.SheetInstanceNameEditor,
        ]
    },
    //长文本
    String: {
        Type: 13,
        DisplayName: '长文本',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetBizTextBox,
            DesignerControls.SheetRichTextBox
        ]
    },
    //逻辑型
    Bool: {
        Type: 1,
        DisplayName: '逻辑型',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetCheckBox
        ]
    },
    //整数
    Int: {
        Type: 9,
        DisplayName: '整数',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetBizTextBox,
            DesignerControls.SheetDropDownList
        ]
    },
    //长整数
    Long: {
        Type: 11,
        DisplayName: '长整数',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetBizTextBox
        ]
    },
    //数值
    Double: {
        Type: 7,
        DisplayName: '数值',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetBizTextBox,
            DesignerControls.SheetDropDownList
        ]
    },
    //货币
    Money: {
        Type: 18,
        DisplayName: '货币',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetBizTextBox
        ]
    },
    //日期
    DateTime: {
        Type: 5,
        DisplayName: '日期',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTime
        ]
    },
    //附件
    Attachment: {
        Type: 24,
        DisplayName: '附件',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetAttachment,
            DesignerControls.SheetOffice
        ]
    },
    //审批
    Discussion: {
        Type: 17,
        DisplayName: '审批',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetComment
        ]
    },
    //参与者（单人）
    SingleParticipant: {
        Type: 26,
        DisplayName: '参与者（单人）',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetSingleUserSelector,
            DesignerControls.SheetUserList
        ]
    },
    //参与者（多人）
    MultiParticipant: {
        Type: 27,
        DisplayName: '参与者（多人）',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetMultiUserSelector,
            DesignerControls.SheetUserList
        ]
    },
    //时间段
    TimeSpan: {
        Type: 25,
        DisplayName: '时间段',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //Guid
    Guid: {
        Type: 33,
        DisplayName: 'Guid',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //Decimal
    Decimal: {
        Type: 35,
        DisplayName: 'Decimal',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //链接
    HyperLink: {
        Type: 16,
        DisplayName: '链接',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetHyperLink
        ]
    },
    //Html
    Html: {
        Type: 30,
        DisplayName: 'Html',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetRichTextBox
        ]
    },
    //子表
    SubTable: {
        Type: 29,
        DisplayName: '子表',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetDetail,
            DesignerControls.SheetGridView,
            DesignerControls.SheetBizDetail
        ]
    },
    //XML
    Xml: {
        Type: 32,
        DisplayName: 'XML',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //数据库表
    DataTable: {
        Type: 28,
        DisplayName: '数据库表',
        ControlRange: []
    },
    // 业务对象
    Object: {
        Type: 40,
        DisplayName: '业务对象',
        ControlRange: [DesignerControls.SheetLabel, DesignerControls.SheetBizDetail]
    },
    // 业务对象数组
    SubTable: {
        Type: 41,
        DisplayName: '业务对象数组',
        ControlRange: [DesignerControls.SheetLabel, DesignerControls.SheetBizDetail]
    }
};

//定义全局设计器对象 Designer
var Designer = new Designer();

// 父文本框绑定
$.fn.RichTextBind = function (title) {
    $(this).unbind("click").click(function () {
        var o = this;
        $("#divRichText .richTextTitle").html(title);
        $("#divRichText textarea").val(o.value);
        $.ligerDialog.open({
            title: $(this).parents("td:first").prev().text(),
            target: $("#divRichText"),
            height: 390,
            width: 600,
            buttons: [
               {
                   text: '确定', onclick: function (item, dialog) {
                       o.value = $("#divRichText textarea").val();
                       $(o).change();
                       dialog.close();
                   }
               },
               {
                   text: '取消', onclick: function (item, dialog) {
                       dialog.close();
                   }
               }]
        });

        $("#divRichText textarea").focus();
    });

    return $(this);
}