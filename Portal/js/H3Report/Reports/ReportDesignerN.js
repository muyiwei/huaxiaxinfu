

//属性
jQuery.extend({
    //设计器
    ReportDesigner: {
        ReportCode: null,
        ReportRows: [],//设计出来表单的行，按次序存储, $.SheetDesigner.SheetRows[0]=[DataFieldKey1,DataFieldKey2]
        //SheetHtml: "",//由SheetRows最后生成的页面代码
        TemplatesZone: null,//模板区
        DesignZone: null,//设计区
        ParamsZone: null,//查询条件区
        PropertysZone: null,//属性区
        ReportTemplatesZone: null,//报表图形模板区
        FieldSelectZone:null,
        TemplateKey: "templatekey", //全局属性定义
        //TowColsKey: "layout_towcols", //一行两列控件
        PageHeader: "page-header", //标题栏
        GraphicKey: "DataField",//数据项属性
        //SheetButton: "SheetButton",
        //SheetLabelKey: "SheetLabel",
        //SheetUserKey: "SheetUser",
        CreatedBy: "CreatedBy.FullName",//发起人、创建人
        CreatedTime: "CreatedTime",//发起时间
        Owner: "OwnerId",//拥有者
        OwnerDept: "OwnerDeptId",//拥有者部门
        //SequenceNo: "SequenceNo",//序列号(只对流程)
        MaxInputLength: 18,//最长的输入长度
        Widgets:[],
        RemoveWidgets: [],
        Layout: null,
        Filters:'',
        ListDataSource: {
            apps: [],
            menus: [],
            properties: []
        }
    },
    GraphicType: {        
        Line: 0,
        /// 柱状图
        Bar: 1,
        /// 饼图
        Pie: 2,
        /// 面积图
        Area: 3,
        /// 雷达图
        Radar: 4,
        ///仪表盘
        Gauge: 5,
        ///明细表
        Detail:6,
    },
   
});

//函数
jQuery.extend(
    $.ReportDesigner,
    {
        //初始化：可选控件，加载已经有的表单数据
        Init: function (ReportCode) {
            var that = this;
            //控制是否加载完
            this.IsLoaded = false;

            //界面布局控件
            this.TemplatesZone = $("#TemplatesZone");
            this.DesignerZone = $("#reportDesigner");
            this.ParamsZone = $("#reportParameter");
            this.PropertysZone = $("#PropertysZone");
            this.PropertySettingZone = $("#WidgetPropertys");            
            this.ReportTemplatesZone = $("#ReportTemplatesZone");
            this.TemplateTitlePanel = $("#title-panel");
            this.TemplateDataSourcePanel = $("#datasource-panel");
            this.TemplateFieldPanel = $("#field-panel");
            this.AssociationPanel = $("#association-panel");
            this.Layout = $("#layout-panel");
            this.FieldSelectZone = $("div.field-select-pane");

            this.LayoutValue = '0';

            this.GetAppsUrl = "/Admin/ReportSource/GetPublishApps";
            this.GetMenusUrl = "/Admin/ReportSource/GetPublishAppMenus?ID=";
            this.GetPropertiesUrl = "/Admin/ReportSource/GetSchemas?ID=";

            this.Widgets = [];

            // 是否启用数据权限
            // this.$enableDataAcl = $("#enableDataAcl");
            // 权限继承
            //this.$inheritAclRow = $("#inheritAclRow");
            //this.$inheritObject = $("#inheritObject");

            

            // 在设置完DesignerZone的Html后，查找DesignerZone里的tab元素
            this.$navTabs = this.DesignerZone.find("#navTabs");
            this.$tabContent = this.DesignerZone.find("#tabContent");

            //加载表单数据
            //this.LoadReport(ReportCode);

            //绑定按钮事件
            //this.BindButtonEvent();

            //加载控件
            this.LoadReportTemplates();

            //绑定拖拽事件
            this.BindDragEvent();

            //报表应用属性设置

            this.Layout.find('select').change(function () {
                var oldValue=that.LayoutValue;
                that.LayoutValue = $(this).val();
                var newClass = that.LayoutValue == '0' ? 'col-lg-12 col-xs-12 col-ms-12 col-12' : that.LayoutValue == '1' ? 'col-lg-6 col-xs-6 col-ms-6 col-6' : 'col-lg-4 col-xs-4 col-ms-4 col-4';
                //如果已经存在相关图形，则设置其布局值
                if (that.Widgets.length > 0) {
                    switch(oldValue){
                        case "0":
                            that.DesignerZone.children('div').removeClass('col-lg-12 col-xs-12 col-ms-12 col-12').addClass(newClass);
                            break;
                        case "1":
                            that.DesignerZone.children('div').removeClass('col-lg-6 col-xs-6 col-ms-6 col-6').addClass(newClass);
                            break;
                        case "2":
                            that.DesignerZone.children('div').removeClass('col-lg-4 col-xs-4 col-ms-4 col-4').addClass(newClass);
                            break;
                    }
                   
                }
            });
            this.Layout.show();
        },

        

        //加载表单
        LoadReport: function (ReportCode) {
            if (ReportCode == null || ReportCode == undefined || ReportCode == "") {
                $.IShowError("", "报表不存在");
                setTimeout(function () { window.close(); }, 500);//提示后关闭
                return;
            }
            var that = this;
            that.ReportCode = ReportCode;
            //$.BizSheet.SheetCode = sheetCode;

            $.ajax({
                cache: false,
                url: "/ReportDesigner/LoadReportData",
                data: { ReportCode: ReportCode },
                dataType: "json",
                success: function (data) {
                    if (data.State == 100) {
                        $.IShowError("", "加载失败");
                        window.close();
                    }
                    if ($.isEmptyObject(data.DesignModeContent) && !$.isEmptyObject(data.PreProperys)) {
                        for (var preDataFiled in data.PreProperys) {
                            that.AddDataFieldFromData.apply(that, [preDataFiled, data.PreProperys[preDataFiled]]);
                        }
                    }
                    else {
                        that.SheetDisplayName.val(data.DisplayName);
                        if (data.DesignModeContent) {
                            // 处理历史数据
                            if (data.DesignModeContent.indexOf("navTabs") === -1) {
                                that.DesignerZone.find("#sheetContent").html(data.DesignModeContent);
                            }
                            else {
                                that.DesignerZone.html(data.DesignModeContent);
                            }

                            // 在设置完DesignerZone的Html后，查找DesignerZone里的tab元素
                            that.$navTabs = that.DesignerZone.find("#navTabs");
                            that.$tabContent = that.DesignerZone.find("#tabContent");
                        }

                        if (data.Javascript) {
                            $("#jsText").val(data.Javascript);
                            $.BizSheet.Javascript = data.Javascript;
                        }

                        if (data.BehindCode) {
                            $("#csText").val(data.BehindCode);
                            $.BizSheet.BehindCode = data.BehindCode;
                        }

                        that.DesignerZone.find("div.sheet-control:not(.SheetGridView),div." + that.PageHeader).click(function () {
                            that.ControlElementSelected($(this));
                        });
                        $("button.editcontrol").click(function () {
                            that.ControlElementSelected.apply(that, [$(this).parent()]);
                        });

                        $("button.addtd").click(function () {
                            $(this).parent().find("tr").append($("<td class='SheetGridView_td'>"));
                            that.BindDragEvent();
                        });

                        that.DesignerZone.find("div.sheet-control:not(.SheetGridView),div." + that.PageHeader).hover(function () { $(this).css("border", "1px dashed").css("background-color", "#eff9f8"); }, function () { $(this).css("border", "").css("background-color", ""); });

                        that.DesignerZone.find("button[data-buttontype='remomvecontrol']").click(function () {
                            that.RemoveControl($(this).parent());
                        });

                        that.DesignerZone.find("[data-buttontype='changecontrol'] ul.dropdown-menu").click(function (e) {
                            var $target = $(e.target);
                            if ($target.is("a")) {
                                var $el = $(this).closest(".sheet-control");
                                var $next = $el.next();
                                var $parent = $el.parent();
                                var displayName = $el.attr("data-displayname");
                                var datafield = that.GetDataField($el);
                                $el.remove();
                                that.AddDataFieldFromData(datafield, { DataType: $.BizDataType.String, DisplayName: displayName, TemplateKey: $target.attr("data-TemplateKey") }, { $next: $next, $parent: $parent });
                            }
                        });

                        //Error:兼容原来的模式
                        that.DesignerZone.find("div[data-datafield*='.']").each(function () {
                            $(this).attr("id", $(this).attr("data-datafield").replace(/\./g, "-"));
                        });;

                        //摘要
                        that.SummarySchema = data.SummarySchema;
                        that.NameSchema = data.NameSchema;
                        that.LoadSummary.apply(that, [that.SummarySchema, that.$SummaryItems]);
                        that.LoadSummary.apply(that, [that.NameSchema, that.$NameItems]);

                        //所有已发布的BO
                        that.PublishedSchemas = data.PublishedSchemas;

                        //数据字典的名称集合
                        that.DataDictItemNames = data.DataDictItemNames;

                        // 是否启用数据权限
                        //that.$enableDataAcl.prop("checked", data.EnableDataAcl);
                        that.EnableDataAcl = data.EnableDataAcl;
                        that.DataAclInheritedFrom = data.DataAclInheritedFrom;
                        that._initInheritObjectSelect();
                        //that.$enableDataAcl.trigger("change");

                        // 是否支持标签页
                        that.$supportTab.prop("checked", that.$navTabs.attr("data-supporttab") == "true");
                        that.$supportTab.change();

                        // 表单是否已有数据录入
                        that.PublishedUserProperties = data.PublishedUserProperties;
                        //表单是否已有数据录入 checkbox
                        that.PublishedCheckboxProperties = data.PublishedCheckboxProperties;
                        //绑定拖拽事件
                        that.BindDragEvent();
                    }
                    //初始化编码编辑器
                    that.InitCodeEdit.apply(that);

                    that.IsLoaded = true;
                },
                error: function (data) {
                    $.IShowError("", $(data.responseText).text());
                }
            });
        },

        

        //添加从后台数据，加载过来的字段
        AddDataFieldFromData: function (DataFiled, DataFiledObject, target) {
            var that = this;
            if (that.GetControlElement(DataFiled).length > 0) return;
            //添加控件
            var $el = null;
            var $item = null;
            switch (DataFiledObject.DataType) {
                case $.BizDataType.Attachment:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetAttachment']");
                    break;
                case $.BizDataType.BizObjectArray:
                    //Error:子表
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetGridView']");
                    break;
                case $.BizDataType.DateTime:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetDateTime']");
                    break;
                case $.BizDataType.Decimal:
                case $.BizDataType.Double:
                case $.BizDataType.Int:
                case $.BizDataType.Long:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetNumber']");
                    break;
                case $.BizDataType.String:
                case $.BizDataType.ShortString:
                    $item = that.ControlsZone.find("p[data-TemplateKey='" + (DataFiledObject.TemplateKey || "SheetTextBox") + "']");
                    break;
                case $.BizDataType.SingleParticipant:
                case $.BizDataType.MultiParticipant:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetUser']");
                    break;
                case $.BizDataType.Association:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetQuery']");
                    break;
                case $.BizDataType.Bool:
                    $item = that.ControlsZone.find("p[data-TemplateKey='SheetCheckboxList']"); break;
            }
            if ($item) {
                $item = $item.clone();
                if (DataFiledObject.DisplayName)
                    $item.find("a").text(DataFiledObject.DisplayName);
                that.SetDataFieldValue($item, DataFiled);
                var $el = that.RenderControl($item, 2);
                if ($el) {
                    if (DataFiledObject.DataType == $.BizDataType.SingleParticipant) {
                        $el.attr("data-IsMultiple", false);
                    }
                    else if (DataFiledObject.DataType == $.BizDataType.Bool) {
                        $el.attr("data-ischeckbox", true);
                        $el.attr("data-defaultitems", "[\"选项1\"]");

                    }

                    if (target) {
                        if (target.$next && target.$next.length > 0) {
                            target.$next.before($el);
                        }
                        else if (target.$parent && target.$parent.length > 0) {
                            target.$parent.append($el);
                        }
                    }
                    else {
                        if (DataFiled.indexOf('.') == -1) {
                            that.DesignerZone.find(".tab-pane:eq(0)").append($el);
                        }
                        else {
                            //Error:子表数据项
                            var tds = that.GetControlElement(DataFiled.split('.')[0]).find("td.SheetGridView_td");
                            var isAddToGridView = false;
                            for (var i = 0; i < tds.length; i++) {
                                if ($(tds[i]).children("div").length == 0) {
                                    isAddToGridView = true;
                                    $(tds[i]).append($el);
                                    break;
                                }
                            }
                            if (!isAddToGridView) {
                                //没添加
                                that.GetControlElement(DataFiled.split('.')[0]).find("tr.SheetGridView_tr").append($("<td class='SheetGridView_td'>").append($el));
                            }
                        }
                    }
                }
            }
        },

        _setAssociationMappings: function () {
            var that = this;
            $.Schema.AssociationMappings = {};
            this.DesignerZone.find("[data-TemplateKey='SheetQuery']").each(function (index) {
                var $control = $(this);
                var dataMappingControls = $control.attr("data-mappingcontrols");
                if (dataMappingControls) {
                    var mapping = JSON.parse(dataMappingControls);
                    if (mapping && !$.isEmptyObject(mapping)) {
                        $.Schema.AssociationMappings[$control.attr("data-" + that.DataFieldKey.toLowerCase())] = mapping;
                    }
                }
            });
        },

        //保存表单
        SaveSheet: function () {
            var that = this;
            if (!that.IsLoaded) return;
            if (!this.BuildData(true)) return;
            this._setAssociationMappings();
            $.ajax({
                type: "POST",
                url: "/SheetDesigner/SaveSheet",
                data: { BizSheetStr: JSON.stringify($.BizSheet), SchemaStr: JSON.stringify($.Schema) },
                dataType: "json",
                success: function (data) {
                    //$.IShowSuccess("自动保存草稿!");
                },
                error: function (data) {
                    //$.IShowError(data.ErrorMsg);
                    console.log("访问不到SaveSheet地址！");
                }
            });
        },

        //发布
        Public: function () {
            var that = this;
            if (!that.IsLoaded) return;
            if (!this.BuildData()) return;
            this._setAssociationMappings();
            $.post("/SheetDesigner/PublicApplication",
                    { SheetCode: that.SheetCode, BizSheetStr: JSON.stringify($.BizSheet), SchemaStr: JSON.stringify($.Schema) },
                    function (data) {
                        if (data.State == 100) {
                            $.IShowError("", data.ErrorMsg);
                        }
                        else {
                            // 重新加载表单数据
                            that.LoadSheet(that.SheetCode);
                            // 隐藏控件属性
                            $("#SheetControlPropertys").collapse("hide");
                            $("#SheetControlPropertysPanel").hide();

                            $.IShowSuccess("", "保存成功!");
                        }
                    });
        },

        //绑定表单数据
        BuildData: function (unValidate) {
            //解析控件
            var rows = this.DesignerZone.find("#tabContent>.tab-pane").children("div.row");
            if (rows.length == 0 && !unValidate) {
                $.IShowError("", "没有设置字段");
                return false;
            }
            //绑定摘要
            $.Schema.SummarySchema = "";
            this.$SummaryItems.find("label[data-value]").each(function () {
                $.Schema.SummarySchema += "{" + $(this).attr("data-value") + "}";
            });

            $.Schema.NameSchema = "";
            this.$NameItems.find("label[data-value]").each(function () {
                $.Schema.NameSchema += "{" + $(this).attr("data-value") + "}";
            });

            // 绑定是否启用数据权限
            if (this.$inheritObject.val() == "false") {
                $.Schema.EnableDataAcl = false;
                $.Schema.DataAclInheritedFrom = "";
            }
            else {
                $.Schema.EnableDataAcl = true;
                $.Schema.DataAclInheritedFrom = this.$inheritObject.val();
            }

            if (!unValidate && ($.isEmptyObject($.Schema.SummarySchema) || $.isEmptyObject($.Schema.NameSchema))) {
                $.IShowError("", "没有设置名称或摘要");
                $("#SheetPropertys").collapse("show");
                return false;
            }

            $.BizSheet.RuntimeContent = "";
            if (this.IsDevMode && this.JSEditor.getValue().replace(/\s+/g, "") != $("#jsText").val().replace(/\s+/g, "")) {
                $.BizSheet.Javascript = this.JSEditor.getValue();
            }
            //else {
            //    $.BizSheet.Javascript = "";
            //}
            if (this.IsDevMode && this.CSEditor.getValue().replace(/\s+/g, "") != $("#csText").val().replace(/\s+/g, "")) {
                $.BizSheet.BehindCode = this.CSEditor.getValue();
            }
            //else {
            //    $.BizSheet.BehindCode = "";
            //}

            // 剔除空白页签
            var that = this;
            //if (this.$tabContent) {
            this.$tabContent.find("div.tab-pane").each(function (index) {
                var $tabPanel = $(this);
                if (!$tabPanel.html()) {
                    var panelid = $tabPanel.attr("id");
                    $tabPanel.remove();
                    that.$navTabs.find("[data-panelid='" + panelid + "']").remove();
                    that.$tabItems.find("[data-panelid='" + panelid + "']").remove();
                }
            });

            // 默认第一个tab选中
            this.$navTabs.find("li").removeClass("active");
            var $firstTab = this.$navTabs.find("li:eq(0)");
            $firstTab.addClass("active");
            this.$tabContent.find("div.tab-pane").removeClass("active in");
            this.$tabContent.find("div.tab-pane#" + $firstTab.attr("data-panelid")).addClass("active in");
            //}
            //移除设计器的选中
            this.DesignerZone.find(".drop-item").find("button[data-buttontype='remomvecontrol']").hide();
            this.DesignerZone.find(".drop-item").find("[data-buttontype='changecontrol']").hide();
            this.DesignerZone.find(".drop-item").removeClass("drop-item");
            $.BizSheet.DesignModeContent = this.DesignerZone.html();

            var $tabPanels = this.DesignerZone.find("#tabContent>.tab-pane");
            var tabPanelsHtml = "";
            // 清空Schema的Properties
            $.Schema.Properties = {};
            // 遍历每个TabPanel，获取其中的字段控件的html
            for (var pi = 0, plen = $tabPanels.length; pi < plen; pi++) {
                var tabPanelHtml = "";
                var $tabPanelRows = $($tabPanels[pi]).children("div.row");
                for (var i = 0; i < $tabPanelRows.length; ++i) {
                    var $row = $($tabPanelRows[i]);
                    if ($row.hasClass(this.PageHeader)) {
                        var $header = $row.clone().removeClass("row");
                        tabPanelHtml += this.JqObjectToHtml($header);
                    }
                    else if ($row.hasClass(this.SheetButton)) {
                        var $header = $row.clone().removeClass("row");
                        tabPanelHtml += this.JqObjectToHtml($header);
                    }
                    else if ($row.hasClass("SheetBoList")) {
                        //关联列表
                        tabPanelHtml += this.JqObjectToHtml($row.clone().html(""));
                    }
                    else if ($row.hasClass("SheetSns")) {
                        tabPanelHtml += this.JqObjectToHtml($row.clone().empty());
                    }
                    else if ($row.hasClass("sheet-control")) {
                        //控件
                        if ($row.hasClass("SheetGridView")) {
                            //子表控件
                            var $gridView = this.BuildRuntimeControl($row);
                            var $tr = $("<tr>");
                            var $table = $("<table>").addClass("table table-bordered table-hover table-condensed").append($("<thead>").append($tr));
                            var cols = $row.clone().find("table").find("td").children("div.row");
                            if (cols.length > 0) {//子表里没配置字段的时候，不需要添加
                                for (var j = 0; j < cols.length; ++j) {
                                    var $col = this.BuildRuntimeControl($(cols[j]));
                                    $col.removeClass("row").addClass("table_th");
                                    $col.text($col.data("displayname")).removeAttr("data-displayname");
                                    $tr.append($("<th>").append($col));
                                }
                                $gridView.append($table);
                                tabPanelHtml += this.JqObjectToHtml($gridView);
                            }
                        }

                        else //if ($row.attr("data-TemplateKey")!=this.SheetButton) 
                        {
                            tabPanelHtml += this.JqObjectToHtml(this.BuildRuntimeControl($row));
                        }
                    }
                    else if ($row.hasClass("layoutrow")) {
                        //布局控件
                        var $layoutRow = this.BuildLayoutRow();
                        var $leftControl = $row.children("div[data-layoutitem='Left']").children("div.sheet-control");
                        var $rightControl = $row.children("div[data-layoutitem='Right']").children("div.sheet-control");
                        var needAddRow = false;
                        if ($leftControl.length > 0) {
                            $layoutRow.find("div:first").append(this.BuildRuntimeControl($leftControl));
                            needAddRow = true;
                        }
                        if ($rightControl.length > 0) {
                            $layoutRow.find("div:last").append(this.BuildRuntimeControl($rightControl));
                            needAddRow = true;
                        }
                        if (needAddRow) {
                            tabPanelHtml += this.JqObjectToHtml($layoutRow);
                        }
                    }
                }

                // 克隆一个TabPanel，清除其中的字段控件，再填充处理后的字段控件html
                var $myTabPanel = $($tabPanels[pi]).clone().empty().css("min-height", "0px");
                $myTabPanel.html(tabPanelHtml);
                tabPanelsHtml += $("<div>").append($myTabPanel).remove().html();
            }

            // 克隆一个DesignerZone，清除tabContent中内容，再向tabContent中填充处理后的tabPanels
            var $myDesignerZone = this.DesignerZone.clone().find("#tabContent").height("auto").empty().parent();
            $myDesignerZone.find("#tabContent").html(tabPanelsHtml);
            $.BizSheet.RuntimeContent = $myDesignerZone.html();
            return true;
        },

        //创建运行时控件
        BuildRuntimeControl: function ($row) {
            var dataField = this.GetDataField($row);
            var Settings = this.GetSettings(dataField);
            var $el = $("<div>").addClass("row").addClass("sheet-control").attr("data-" + this.DataFieldKey, dataField);
            for (var key in Settings) {
                $el.attr("data-" + key, Settings[key]);
            }

            if (dataField != null
                && dataField != this.SequenceNo
                ) {
                if ($row.attr("data-TemplateKey") != this.SheetButton)
                    this.BuildPropertie(dataField, Settings);
            }

            return $el;
        },

        //创建数据模型数据项
        BuildPropertie: function (dataField, Settings) {
            var parentDataField = "";
            var schemaCode = "";
            var TemplateKey = "";
            var IsRelatedMember = false;
            var dataDictItemName = "";
            var optionalValues = "";
            var datetimemode = "";
            var computationRule = "";
            switch (Settings.TemplateKey.toLowerCase()) {
                case "sheetmap":
                    TemplateKey = $.BizDataType.Map;
                    break;
                case "sheettextbox":
                    if (Settings.IsMultiple) {
                        TemplateKey = $.BizDataType.String;
                    }
                    else {
                        TemplateKey = $.BizDataType.ShortString;
                    }
                    break;
                case "sheetuser":
                    if (Settings.IsMultiple === "true") {
                        TemplateKey = $.BizDataType.MultiParticipant;
                    }
                    else {
                        TemplateKey = $.BizDataType.SingleParticipant;
                    }
                    IsRelatedMember = Settings.IsRelatedMember;
                    break;
                case "sheetgridview":
                    TemplateKey = $.BizDataType.BizObjectArray;
                    break;
                case "sheetdatetime":
                    TemplateKey = $.BizDataType.DateTime;
                    datetimemode = Settings.DateTimeMode;
                    break;
                case "sheetattachment":
                    TemplateKey = $.BizDataType.Attachment;
                    break;
                case "sheetnumber":
                    TemplateKey = $.BizDataType.Double;
                    if (Settings.ComputationRule) {
                        computationRule = JSON.parse(Settings.ComputationRule).Rule;
                    }
                    break;
                case "sheetquery":
                    TemplateKey = $.BizDataType.Association;
                    schemaCode = (Settings.BOSchemaCode || "");
                    break;
                case "sheetcheckboxlist":
                    if (Settings.isCheckbox == "true") {
                        TemplateKey = $.BizDataType.Bool;
                    }
                    else {
                        TemplateKey = $.BizDataType.ShortString;
                    }
                    dataDictItemName = Settings.DataDictItemName;
                    optionalValues = Settings.DefaultItems;
                    break;
                case "sheetradiobuttonlist":
                case "sheetdropdownlist":
                    TemplateKey = $.BizDataType.ShortString;
                    dataDictItemName = Settings.DataDictItemName;
                    optionalValues = Settings.DefaultItems;
                    break;
                default:
                    TemplateKey = $.BizDataType.ShortString;
                    break;
            }

            if (dataField == this.CreatedBy) {
                dataField = "CreatedBy";
            }
            if (dataField.indexOf(".") > -1) {
                var id = dataField.split(".");
                parentDataField = id[0];
                $.Schema.Properties[dataField] = {
                    TemplateKey: TemplateKey, DisplayName: Settings.DisplayName, ParentKey: parentDataField,
                    AssociationSchemaCode: schemaCode,
                    IsRelatedMember: IsRelatedMember,
                    DataDictItemName: dataDictItemName,
                    OptionalValues: optionalValues,
                    DateTimeMode: datetimemode,
                    ComputationRule: computationRule
                };
            } else {
                $.Schema.Properties[dataField] = {
                    TemplateKey: TemplateKey, DisplayName: Settings.DisplayName,
                    AssociationSchemaCode: schemaCode,
                    IsRelatedMember: IsRelatedMember,
                    DataDictItemName: dataDictItemName,
                    OptionalValues: optionalValues,
                    DateTimeMode: datetimemode,
                    ComputationRule: computationRule
                };
            }
        },

        //创建布局行
        BuildLayoutRow: function () {
            var $el = $("<div>").addClass("row");
            $el.append($("<div>").addClass("col-sm-6"));
            $el.append($("<div>").addClass("col-sm-6"));
            return $el;
        },

        //Json转为Html
        JqObjectToHtml: function ($el) {
            return $("<div>").append($el.clone()).remove().html();
        },

        //加载控件
        LoadReportTemplates: function () {                      
            //加载报表模板
            for (var key in ReportTemplates) {               
                var template = $('<p class="drag drag-template" ><a class="btn btn-default"><i class="fa ' + ReportTemplates[key].Icon + '"></i>' + (ReportTemplates[key].Text || key) + '</a></p>').attr("data-" + this.TemplateKey, key);                
                this.ReportTemplatesZone.append(template);
            }
        },

        //绑定拖拽控件事件
        BindDragEvent: function () {
            var that = this;
            var sortable = $("#reportDesigner");

            //设置控件可拖拽
            this.TemplatesZone.find(".drag").draggable({
                appendTo: "#reportDesigner",
                helper: "clone",
                containment: '#reportDesigner',
                scroll: true,
                scrollSensitivity: 100,
                connectToSortable: "#reportDesigner",//拖拽目标，且自动排序
                start: function (e, ui) {
                    that.CurrentDrag = $(this);//记录当前拖拽的对象
                },
                stop: function (e, ui) {
                    //console.log(ui);
                }
            });

            //排序
            $("#reportDesigner").sortable({
                connectWith: sortable,
                forcePlaceholderSize: true,
                //placeholder: "drop-item",//拖拽位置显示值
                scroll: true,
                scrollSensitivity: 100,
                over: function (e, ui) {
                    //$(this).find(".drop-item").show();
                },
                stop: function (e, ui) {
                    return that.SortableStop(ui.item);
                },
                out: function (e, ui) { }
            });

        },

        //拖拽停止事件
        SortableStop: function (item) {
            var that = this;
            var $el = null;
            var $parent = $(item).parent();          

            if (this.CurrentDrag == null) {              
                return true;
            }
            else {
                var widget_id = $.IGuid();
                //添加控件
                $el = this.RenderControl(item,widget_id);
                if ($el != null) {
                    $(item).after($el);
                    $(item).remove();
                    this.BindDragEvent();
                    this.CurrentDrag = null;
                    //设置控件选择
                    this.ControlElementSelected($el);
                    //添加一个widget实例
                    var config = {
                        ObjectID: widget_id,
                        DisplayName: ReportTemplates[item.data(this.TemplateKey)].Text,
                        TemplateType: item.data(this.TemplateKey),
                        Width: $($el).width(),
                        Height: $($el).height(),
                        ReportSource: {},
                        Properties: {}
                    };
                    var widget = new Widget(config);
                    this.Widgets.push(widget);
                    
                }
                this.CurrentDrag = null;
                return true;
            }
        },

        //开发者修改编码
        ChangeDataFieldValueByDev: function () {
            if (!this.IsDevMode) return;
            if (this.CurrentSettingKey == this.CreatedBy
                || this.CurrentSettingKey == this.CreatedTime
                || this.CurrentSettingKey == this.Owner
                || this.CurrentSettingKey == this.SequenceNo)
                return;
            var that = this;
            var oldDataField = that.CurrentSettingKey;
            var Settings = that.GetSettings(oldDataField);
            if (oldDataField.indexOf('.') > -1) {
                oldDataField = oldDataField.split('.')[1];
            }
            if (that.DataFieldModel) {
                that.$DataFieldEditor.find("input").val(oldDataField);

                //子表的话，需要以开发编码起步
                that.$DataFieldEditor.find("input").unbind("keyup.SheetGridView");
                if (Settings.TemplateKey == "SheetGridView") {
                    that.$DataFieldEditor.find("input").bind("keyup.SheetGridView", function () {
                        var val = $(this).val();
                        if (val.indexOf(that.DevCode) != 0) {
                            $(this).val(that.DevCode + val);
                        }
                    });
                }

                that.DataFieldModel.Show();
            }
            else {
                that.$DataFieldEditor = $("<div>").append($("<input>").val(oldDataField).css("width", "80%"));
                //子表的话，需要以开发编码起步
                that.$DataFieldEditor.find("input").unbind("keyup.SheetGridView");
                if (Settings.TemplateKey == "SheetGridView") {
                    that.$DataFieldEditor.find("input").bind("keyup.SheetGridView", function () {
                        var val = $(this).val();
                        if (val.indexOf(that.DevCode) != 0) {
                            $(this).val(that.DevCode + val);
                        }
                    });
                }
                var Actions = [{
                    Text: "确定", DoAction: function () {
                        var newDataField = that.$DataFieldEditor.find("input").val();
                        if ($.isEmptyObject(newDataField)
                            || newDataField == that.DevCode) {
                            $.IShowError("编码不能为空！");
                            return;
                        }
                        if (that.CheckSchemaCodeDuplicated.apply(that, [that.CurrentSettingKey, newDataField])) {
                            that.DataFieldModel.Hide();
                        }
                    }
                }];

                ////回车事件
                //$(document).keydown(function (event) {
                //    if (event.keyCode == 13) {
                //        Actions[0].DoAction();
                //    }
                //});

                if (Settings.TemplateKey != this.SheetButton)
                    this.DataFieldModel = new $.IModal("设置字段编码", this.$DataFieldEditor, Actions);
                else
                    this.DataFieldModel = new $.IModal("方法名", this.$DataFieldEditor, Actions);
                this.DataFieldModel.ModalHeader.find("button").remove();
            }
        },

        //检查编码是否重复
        CheckSchemaCodeDuplicated: function (oldDataField, newDataField) {
            //字段编码：检验重复
            var Settings = this.GetSettings(oldDataField);
            var $control = this.GetControlElement(oldDataField);

            //元素里记录的datafield
            var elementDatafield = $control.attr("data-datafield");
            if (elementDatafield.indexOf(".") > -1) {
                newDataField = elementDatafield.split('.')[0] + "." + newDataField;
            }
            if (oldDataField.toLowerCase() == newDataField.toLowerCase()) return true;

            var isFound = false;
            var allControls = elementDatafield.indexOf(".") < 0 ? this.DesignerZone.find("div[data-datafield]:not([data-datafield*='.'])") : $control.closest(".SheetGridView_tr").find("div[data-datafield]");

            for (var i = 0; i < allControls.length; i++) {
                if ($(allControls[i]).attr("data-datafield").toLowerCase() == newDataField.toLowerCase()) {
                    isFound = true;
                    break;
                }
            }

            var msg = "已经存在编码";
            if (!isFound) {
                $.ajax({
                    type: "GET",
                    url: "/SheetDesigner/CheckSchemaCodeDuplicated",
                    data: { SchemaCode: newDataField },
                    success: function (data) {
                        msg = data.Message;
                        isFound = data.State;
                        //if (!isFound) {
                        //    //更新所有子表:
                        //    $control.find("div[data-datafield^='" + datafield + "']").each(function () {
                        //        var cdatafield = that.GetDataField($(this));
                        //        cdatafield = newDataField + "." + cdatafield.split(".")[1];
                        //        that.SetDataFieldValue($(this), cdatafield);
                        //    });
                        //}
                    },
                    async: false
                });
            }

            if (isFound) {
                $.IShowError(msg);
                return false;
            }
            else {
                this.SetDataFieldValue($control, newDataField);
                this.CurrentSettingKey = newDataField;
                this.$SummaryItems.find("label[data-value='" + oldDataField + "']").attr("data-value", newDataField);
                this.$NameItems.find("label[data-value='" + oldDataField + "']").attr("data-value", newDataField);
                return true;
            }
        },

        //设置DataField的值 
        SetDataFieldValue: function ($el, datafield) {
            $el.attr("data-" + this.DataFieldKey, datafield);
            var id = datafield.replace(/\./g, "-");
            $el.attr("id", id);
        },

        //获取DataField的值
        GetDataField: function ($el) {
            return $el.attr("data-" + this.DataFieldKey);
        },

        //获取数据项的限制名称
        GetDataFieldDisplayName: function ($el) {
            return $el.attr("data-DisplayName");
        },

        //根据DataFiled 的值，获取控件
        GetControlElement: function (datafield) {
            var id = (datafield || "").replace(/\./g, "-");
            return $("#" + id);
        },

        FindWidget:function(widget_id){
            for (var i = 0, len = this.Widgets.length; i < len; i++) {
                if (this.Widgets[i].ObjectID == widget_id) {
                    return this.Widgets[i];
                }
            }
            return null;
        },
        //渲染控件
        RenderControl: function (item, widget_id) {
            var that = this;
            var newClass = that.LayoutValue == '0' ? 'col-lg-12 col-xs-12 col-ms-12 col-12' : that.LayoutValue == '1' ? 'col-lg-6 col-xs-6 col-ms-6 col-6' : 'col-lg-4 col-xs-4 col-ms-4 col-4';
            var TemplateKey = item.data(this.TemplateKey);           
            var $parent = $(item).parent();
            var $el = $('<div class="col '+newClass+'">');
            var $head = $('<div class="panel-heading">');
            var $title = $('<h3 class="panel-title">').text(item.text());
            $head.append($title);
            //添加删除按钮
            var $del = $("<span style='font-size:16px;top:-20px;float:right;position:relative;'>删除</span>");
            $head.append($del);
            $del.click(function () {
                $(this).closest('.col').remove();
                //属性也删掉
                $('div.config-panel[data-widgetid="' + widget_id + '"]').remove();
                var index = -1;
                for (var i = 0, len = that.Widgets.length; i < len; i++) {
                    if (that.Widgets[i].ObjectID == widget_id) {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    that.Widgets.splice(index,1);
                }
            });
            var $panel = $('<div class="panel panel-primary widget"></div>').attr("data-" + this.TemplateKey, TemplateKey).attr("data-DisplayName", item.text()).attr('data-widgetid', widget_id);
            $panel.append($head);
            var $body = $('<div class="panel-body">123</div>');
            $panel.append($body);
            $el.append($panel);

            $el.click(function () { that.ControlElementSelected.apply(that, [$(this)]); });
            return $el;
        },

        ControlElementSelected: function ($el) {
            //this.Layout.hide();
            //首先添加选中样式
            var that = this;
            var widget = $el.find('div.widget');
            $('.widget-selected').removeClass('widget-selected');
            $(widget).addClass('widget-selected');
            var widget_id = $(widget).attr('data-widgetid');
            var widget_type = $(widget).attr('data-' + that.TemplateKey);
            //首先判断是否已经存在该widget的属性框了，如果存在，则显示，不存在，则新增
            if ($('div.config-panel[data-widgetid="' + widget_id + '"]').length > 0) {
                $('div.config-panel[data-widgetid="' + widget_id + '"]').show();
                
            } else {
                //添加属性
                //首先是标题
                var title = this.TemplateTitlePanel.clone();
                $(title).attr('data-widgetid', widget_id).show();
                $(title).find('input').val(ReportTemplates[widget_type].Text);
                //绑定输入框的事件
                $(title).find('input').change(function () {
                    var displayName = $(this).val();
                    var tmp_widget = $('div.widget[data-widgetid="' + widget_id + '"]');
                    if (tmp_widget != null) {
                        tmp_widget.find('.panel-title').html(displayName);
                    }
                    var tmp_widget_model = that.FindWidget(widget_id);
                    if (tmp_widget_model != null) {
                        tmp_widget_model.DisplayName = displayName;
                    }
                });
                //this.PropertySettingZone.empty();
                this.PropertySettingZone.append($(title));

                //数据源选择
                var datasource = this.TemplateDataSourcePanel.clone();
                $(datasource).attr('data-widgetid', widget_id).show();
                this.PropertySettingZone.append($(datasource));
                //绑定下拉框事件
                $(datasource).find('select').change(function () {
                    if ($(this).val() == "0") {
                        var asso = that.PropertySettingZone.find('#association-panel[data-widgetid="' + widget_id + '"]');
                        if (asso.length > 0) {
                            asso.show();
                        }
                    } else {
                        var asso = that.PropertySettingZone.find('#association-panel[data-widgetid="' + widget_id + '"]');
                        if (asso.length > 0) {
                            asso.hide();
                        }
                    }
                });
                //当数据源类型为列表时显示多表关联设置
                var association = this.AssociationPanel.clone();
                $(association).attr('data-widgetid', widget_id);
                this.PropertySettingZone.append($(association));
                //绑定事件
                $(association).find('input').bind('click', function () {
                    //弹出关联表选择框
                    ShowAssociationTableModal(widget_id);
                });
                //加载字段
                var fields = this.TemplateFieldPanel.clone();
                $(fields).attr('data-widgetid', widget_id).show();
                this.PropertySettingZone.append($(fields));
                //添加事件
                $(fields).find('div.edit-group').find('i.fa-plus').unbind('click').bind('click', function () {
                    //先获取所有的应用并缓存
                    if (that.ListDataSource.apps.length<=0) {
                        $.getJSON(that.GetAppsUrl, {}, function (data, status, xhr) {
                            that.ListDataSource.apps = data.result;
                            //填充界面
                            var $applist = $('<ul class="app-list">');
                            var app=null;
                            for (var i = 0, len = that.ListDataSource.apps.length; i < len; i++) {
                                app = that.ListDataSource.apps[i];
                                var $app = $('<li class="app" code="' +app.Code+ '"><a class="app-item"><i class="fa '+app.IconCss+'"><span>'+app.DisplayName+'</span></a></li>');
                                $applist.append($app);
                            }
                            that.FieldSelectZone.append($applist);
                            ShowFieldSelectModal();
                        });
                    } else {
                        ShowFieldSelectModal();
                    }
                    
                });


                $(datasource).find('select').change();
            }
            $('div.config-panel[data-widgetid!="' + widget_id + '"]').hide();
        },

        //读取控件的配置
        GetSettings: function (datafield) {
            var $el = this.GetControlElement(datafield);
            if ($el.length == 0) return {};
            var TemplateKey = $el.attr("data-" + this.TemplateKey);
            var settings = { TemplateKey: TemplateKey };
            var designProperties = SheetControls[TemplateKey].DesignProperties;
            for (var i = 0; i < designProperties.length; i++) {
                if ($el.attr("data-" + designProperties[i].Name)) {
                    settings[designProperties[i].Name] = $el.attr("data-" + designProperties[i].Name);
                }
                else {
                    settings[designProperties[i].Name] = designProperties[i].DefaultValue;
                }
            }
            return settings;
        },

        //删除的控件
        RemoveControl: function ($el) {
            var that = this;
            if ($el.hasClass("layoutrow")) {
                //布局控件
                $el.find("div.sheet-control").each(function () {
                    var dataField = that.GetDataField($(this));
                    that.RemoveFields[dataField] = that.GetSettings(dataField);
                });
            }
            else if (!$el.hasClass(this.PageHeader)) {
                var $parent = $el.parent();
                //控件
                var dataField = this.GetDataField($el);
                if (dataField) {
                    //CreateBy.FullName-》CreateBy
                    var iDataField = dataField;
                    if (iDataField == this.CreatedBy) {
                        iDataField = "CreatedBy";
                    }
                    this.RemoveFields[dataField] = that.GetSettings(dataField);
                    if ($parent.hasClass("SheetGridView_td") && $parent.parent().find(".SheetGridView_td").length > 1) { $parent.remove(); }
                    this.$SummaryItems.find("label[data-value='" + iDataField + "']").remove();
                    this.$NameItems.find("label[data-value='" + iDataField + "']").remove();
                }
            }

            //删除元素
            $el.detach();

            this.DesignerZone.click();
        },

        //Error:这个功能暂时没实现
        //从删除里找是不是有一样名字和控件类型(BizDataType)的
        FindFromRemove: function (displayName, TemplateKey) {
            for (var key in this.RemoveFields) {
                if (this.RemoveFields[key].DisplayName == displayName
                    && this.RemoveFields[key].TemplateKey == TemplateKey) {
                    delete this.RemoveFields[key];
                    return key;
                }
            }
            return null;
        },

        //加载控件属性
        LoadPropertySetting: function (datafield) {
            $("#SheetPropertys").collapse("hide");
            $("#SheetControlPropertysPanel").show();
            $("#SheetControlPropertys").collapse("show");
            if (!datafield) return;
            var that = this;
            if (!this.CurrentSettingKey && this.CurrentSettingKey == datafield) return;
            this.PropertySettingZone.html("");

            //加载配置
            var Settings = this.GetSettings(datafield);
            if ($.isEmptyObject(Settings))
                return;

            //记录当前设置的控件
            this.CurrentSettingKey = datafield;
            var TemplateKey = Settings.TemplateKey;
            var designProperties = SheetControls[TemplateKey].DesignProperties;

            var $control = this.GetControlElement(datafield);
            for (var i = 0; i < designProperties.length; ++i) {
                if (designProperties[i].Visiable === false) continue;
                //是否开发者才能设置的属性
                if (designProperties[i].IsDevMode && !this.IsDevMode) continue;

                //拥有者只能单选
                if (datafield == this.Owner && designProperties[i].Name == "IsMultiple") {
                    $control.attr("data-" + designProperties[i].Name, false);
                    Settings[designProperties[i].Name] = false;
                    continue;
                }
                if (datafield == this.Owner && designProperties[i].Name == "IsRelatedMember") {
                    continue;
                }
                var defaultValue = Settings[designProperties[i].Name] || designProperties[i].DefaultValue;
                var $groupDiv = $("<div></div>").addClass("form-group").addClass("clearfix").attr("data-Property", designProperties[i].Name);
                $groupDiv.append($("<label>" + designProperties[i].Text + "</label>"));
                var $valInput = $("<div class='controls'><input id='" + designProperties[i].Name + "' name='" + designProperties[i].Name + "' maxlength='" + this.MaxInputLength + "'/></div>");

                //映射对象
                if (designProperties[i].Name == "BOSchemaCode") {
                    // 关联查询的关联表单
                    $valInput = $("<div class='controls'></div>");
                    var $schemaSelect = $("<select id='" + designProperties[i].Name + "' name='" + designProperties[i].Name + "' style='width:80%;'></select>");
                    if (this.PublishedSchemas && this.PublishedSchemas.length > 0) {
                        for (var pindex = 0, plen = this.PublishedSchemas.length; pindex < plen; pindex++) {
                            // 关联查询字段不可以关联自己所属的表单
                            if (this.SheetCode == this.PublishedSchemas[pindex].SchemaCode) {
                                continue;
                            }
                            $schemaSelect.append("<option value='" + this.PublishedSchemas[pindex].SchemaCode + "'>" +
                                this.PublishedSchemas[pindex].DisplayName + "</option>");
                        }
                    }
                    $valInput.append($schemaSelect);

                    var that = this;
                    $schemaSelect.change(function () {
                        var boSchemaCode = $(this).val();
                        var $curControl = that.GetControlElement(that.CurrentSettingKey);
                        $curControl.attr("data-BOSchemaCode", boSchemaCode);
                        Settings["BOSchemaCode"] = boSchemaCode;

                        var $mappingControls = $("#mappingControls");
                        if ($mappingControls.length > 0) {
                            that.InitSheetQueryMappingControls($mappingControls, boSchemaCode, "MappingControls");
                        }

                        // 重新构造权限继承自下拉框
                        that._initInheritObjectSelect();
                    });

                    if (Settings[designProperties[i].Name]) {
                        $schemaSelect.val(Settings[designProperties[i].Name]);
                    }
                    // 确保designer控件的data-BOSchemaCode属性有值
                    $schemaSelect.trigger("change");
                }
                else if (designProperties[i].Name == "DataField") {
                    if (!this.IsDevMode) continue;
                    var $valInput = $("<div class='controls'><label id='" + designProperties[i].Name + "' name='" + designProperties[i].Name + "' maxlength='" + this.MaxInputLength + "'>" + defaultValue + "</label></div>");
                    $valInput.find("label").css("width", "80%").css("word-break", "break-all");
                }
                else if (designProperties[i].Name == "MappingControls") {
                    if (TemplateKey == "SheetQuery") {
                        $valInput = $("<div class='controls' id='mappingControls" + "'></div>");
                        this.InitSheetQueryMappingControls($valInput, Settings["BOSchemaCode"], designProperties[i].Name,
                            Settings[designProperties[i].Name]);
                    }
                    else { // SheetUser
                        $valInput = this.RandMapping(designProperties[i].Name, TemplateKey, Settings);
                        if (TemplateKey == "SheetUser" && (Settings.IsMultiple == null || Settings.IsMultiple == "true")) {
                            $groupDiv.hide();
                        }
                    }
                }
                else if (designProperties[i].Name == "ComputationRule") {
                    $valInput = $("<div class='controls'><input id='" + designProperties[i].Name + "' name='" + designProperties[i].Name + "' readonly='readonly' /></div>");
                    this.InitComputationRuleControls($valInput, Settings["ComputationRule"]);
                }
                else if (designProperties[i].Name == "DisplayRule") {
                    $valInput = $("<div class='controls'><input id='" + designProperties[i].Name + "' name='" + designProperties[i].Name + "' readonly='readonly' /></div>");
                    this.InitDisplayRuleControls($valInput.find("input"), Settings);
                }
                else if (designProperties[i].Name == "DataDictItemName") { // 绑定数据字典
                    var designPropertyName = designProperties[i].Name;
                    $valInput = $("<div class='controls'></div>");
                    var $itemSelect = $("<select id='" + designPropertyName + "' name='" + designPropertyName + "' style='width:80%;'></select>");
                    $itemSelect.append("<option value=''></option>");
                    if (this.DataDictItemNames && this.DataDictItemNames.length > 0) {
                        for (var dindex = 0, dlen = this.DataDictItemNames.length; dindex < dlen; dindex++) {
                            $itemSelect.append("<option value='" + this.DataDictItemNames[dindex] + "'>" +
                                this.DataDictItemNames[dindex] + "</option>");
                        }
                    }
                    $valInput.append($itemSelect);

                    var that = this;
                    $itemSelect.change(function () {
                        var itemName = $(this).val();
                        var $curControl = that.GetControlElement(that.CurrentSettingKey);
                        $curControl.attr("data-" + designPropertyName, itemName);
                        Settings[designPropertyName] = itemName;

                        // 设置选项设置是否显示
                        var $defaultItems = that.PropertySettingZone.find('[data-property="DefaultItems"]');
                        if (itemName == "") {
                            $defaultItems.show();
                        }
                        else {
                            $defaultItems.hide();
                        }
                    });

                    if (Settings[designPropertyName]) {
                        $itemSelect.val(Settings[designPropertyName]);
                    }

                    if (Settings["isCheckbox"] == "true") {
                        $groupDiv.hide();
                    }
                }
                else if (designProperties[i].Name == "DefaultItems") {
                    $valInput = this.RandDefaultItems(designProperties[i].Name, TemplateKey, Settings);
                    // 有绑定到数据字典时，不显示选项设置
                    if (Settings["DataDictItemName"]) {
                        $groupDiv.hide();
                    }
                }
                else if (designProperties[i].ValueRange != null) {
                    $valInput = $("<div></div>").addClass("controls");
                    // 表单有数据录入后，选人控件的模式不可以修改
                    if (TemplateKey == "SheetUser" && designProperties[i].Name == "IsMultiple" &&
                       $.inArray(datafield, this.PublishedUserProperties) > -1) {
                        for (var vi = 0, vlen = designProperties[i].ValueRange.length; vi < vlen; vi++) {
                            if (designProperties[i].ValueRange[vi].Val.toString().toLocaleLowerCase() === defaultValue.toString().toLowerCase()) {
                                $valInput.text(designProperties[i].ValueRange[vi].Text);
                                break;
                            }
                        }
                    }
                    else if (TemplateKey == "SheetCheckboxList" && designProperties[i].Name == "isCheckbox" &&
                       $.inArray(datafield, this.PublishedCheckboxProperties) > -1) {
                        if (Settings[designProperties[i].Name] == "true")
                            $valInput.text(designProperties[i].ValueRange[0].Text)
                        else
                            $valInput.text(designProperties[i].ValueRange[1].Text)
                    }
                    else {
                        for (var j = 0; j < designProperties[i].ValueRange.length; ++j) {
                            var tid = $.IGuid();
                            var $select = $("<input id='" + tid + "' name='" + designProperties[i].Name + "' type='radio' value='" + designProperties[i].ValueRange[j].Val + "' />");
                            var $label = $("<label for='" + tid + "'></label>").addClass("radio-inline").text(designProperties[i].ValueRange[j].Text);
                            $valInput.append($select).append($label);
                        }
                        $valInput.find("input[value='" + defaultValue + "']").attr("checked", "checked");
                    }
                }
                else {
                    $valInput.find("input").val(defaultValue);
                }

                if (designProperties[i].Name == "DisplayName") {
                    $valInput.find("input").keyup(function () {
                        that.PropertyChange.apply(that, [that.CurrentSettingKey, $(this)]);
                    });
                }
                else {
                    $valInput.find("input").change(function () {
                        that.PropertyChange.apply(that, [that.CurrentSettingKey, $(this)]);
                    });
                }

                this.PropertySettingZone.append($groupDiv.append($valInput));
            }
        },

        //显示规则
        InitDisplayRuleControls: function ($el, settings) {
            var that = this;
            var propertyName = $el.attr("name");
            var displayJson = settings[propertyName] ? JSON.parse(settings[propertyName]) : "";
            if (!$.isEmptyObject(displayJson)) {
                var ruleDataField = displayJson.RuleDataField;
                var ruleValue = displayJson.RuleValue;
                var ruelSettings = this.GetSettings(ruleDataField);
                $el.val(ruelSettings["DisplayName"] + " = " + ruleValue);
            }

            $el.click(function () {
                var $el = $(this);
                //构造下拉框选择
                var $displayRuleDataField = $("#DisplayRuleDataField").html("");
                var $displayRuleValue = $("#DisplayRuleValue").val("");
                var $controls = that.DesignerZone.find(".sheet-control");

                $displayRuleDataField.append("<option></option>");
                for (var i = 0; i < $controls.length; i++) {
                    var $control = $($controls[i]);
                    var datafield = $control.attr("data-datafield");
                    var TemplateKey = $control.attr("data-TemplateKey");
                    var displayname = $control.attr("data-displayname");
                    if (displayname == "") displayname = "--";
                    if (datafield == null || datafield == "" || datafield == undefined) continue;
                    if (that.CurrentSettingKey == datafield) continue;

                    if (that.CurrentSettingKey.indexOf(".") > -1) {
                        //子表
                        //主表不添加
                        if (datafield.indexOf(".") == -1) continue;
                        //不是同个子表的不添加
                        if (datafield.split(".")[0] != that.CurrentSettingKey.split(".")[0]) continue;
                    }
                    else if (datafield.indexOf(".") > -1 || TemplateKey == "SheetGridView") {
                        //主表
                        continue;
                    }
                    var option = $("<option>").val(datafield).text(displayname);
                    $displayRuleDataField.append(option);
                }
                if (ruleDataField) {
                    $displayRuleDataField.val(ruleDataField);
                    $displayRuleValue.val(ruleValue);
                }
                //默认值
                var settings = that.GetSettings(that.CurrentSettingKey);
                var displayJson = settings[propertyName] ? JSON.parse(settings[propertyName]) : "";
                if (!$.isEmptyObject(displayJson)) {
                    var ruleDataField = displayJson.RuleDataField;
                    var ruleValue = displayJson.RuleValue;
                    $displayRuleDataField.val(ruleDataField);
                    $displayRuleValue.val(ruleValue);
                }

                if (that.DisplayRuleModal) {
                    that.DisplayRuleModal.Show();
                }
                else {
                    that.DisplayRuleModal = new $.IModal("显示规则",
                        $("#divDisplayRule"),
                        [{
                            Text: "清除",
                            DoAction: function () {
                                $displayRuleDataField.val("");
                                $displayRuleValue.val("");
                            }
                        },
                        {
                            Text: "确定",
                            DoAction: function () {
                                var ruleDataField = $displayRuleDataField.val();
                                var ruleDataFieldtxt = $displayRuleDataField.find(":selected").text();
                                var settings = that.GetSettings(that.CurrentSettingKey);
                                var ruleValue = $displayRuleValue.val();
                                var $control = that.GetControlElement(that.CurrentSettingKey);
                                if (ruleDataField != "") {
                                    if (ruleValue == "") {
                                        $.IShowWarn("请填值");
                                        return;
                                    }
                                    var propertyVal = JSON.stringify({ RuleDataField: ruleDataField, RuleValue: ruleValue });
                                    $control.attr("data-" + propertyName, propertyVal);
                                    settings[propertyName] = propertyVal;
                                    $("#" + propertyName).val(ruleDataFieldtxt + " = " + ruleValue);
                                }
                                else {
                                    $control.attr("data-" + propertyName, "");
                                    settings[propertyName] = "";
                                    $("#" + propertyName).val("");
                                }
                                that.DisplayRuleModal.Hide();
                            }
                        }]);
                }
            });
        },

        InitSheetQueryMappingControls: function ($el, boSchemaCode, propertyKey, propertyValue) {
            // 清空配置项
            $el.empty();

            // 关联表单的属性数组
            var ValueRange = [];
            var schema = null;
            if (this.PublishedSchemas) {
                for (var si = 0, slen = this.PublishedSchemas.length; si < slen; si++) {
                    if (this.PublishedSchemas[si].SchemaCode == boSchemaCode) {
                        schema = this.PublishedSchemas[si];
                        break;
                    }
                }
            }
            if (schema && schema.Properties) {
                for (var pi = 0, plen = schema.Properties.length; pi < plen; pi++) {
                    var property = schema.Properties[pi];
                    ValueRange.push({ Val: property.Name, Text: property.DisplayName });
                }
            }
            if (ValueRange.length == 0) { return; }

            // 关联配置的值
            var mappings = {};
            if (propertyValue) {
                var mappingsObj = JSON.parse(propertyValue);
                if (mappingsObj && !$.isEmptyObject(mappingsObj)) {
                    mappings = mappingsObj;
                }
            }

            // 关联表单的属性
            var $propertys = $("<select>").attr("data-MappingType", "Source").addClass("form-control").css("width", "30%").css("float", "left");
            for (var i = 0; i < ValueRange.length; i++) {
                var $option = $("<option>");
                $option.val(ValueRange[i].Val);
                $option.text(ValueRange[i].Text);
                $propertys.append($option);
            }
            // 本表单的属性
            var $sheetControls = this.DesignerZone.find(".sheet-control[data-TemplateKey!='SheetLabel'][data-TemplateKey!='SheetGridView'][data-TemplateKey!='SheetSns'][data-TemplateKey!='SheetBoList']");
            var $fields = $("<select>").attr("data-MappingType", "Target").addClass("form-control").css("width", "30%").css("float", "left").css("margin-left", "10px");
            $fields.append("<option value=''></option>");
            for (var ci = 0, clen = $sheetControls.length; ci < clen; ci++) {
                var $sheetControl = $($sheetControls[ci]);
                var $option = $("<option>");
                var dataField = this.GetDataField($sheetControl);
                // 不能关联到当前设置的字段上
                if (dataField == this.CurrentSettingKey) {
                    continue;
                }
                // 非子表中的关联查询字段不可关联子表中的数据项
                if (this.CurrentSettingKey.indexOf(".") < 0 && dataField.indexOf(".") > -1) {
                    continue;
                }
                // 子表中的字段只能与子表中字段关联
                if (this.CurrentSettingKey.indexOf(".") > -1 && dataField.indexOf(".") < 0) {
                    continue;
                }
                // 子表中的字段不能关联到别的子表
                if (this.CurrentSettingKey.indexOf(".") > -1
                    && this.CurrentSettingKey.slice(0, this.CurrentSettingKey.indexOf(".")) != dataField.slice(0, dataField.indexOf("."))) {
                    continue;
                }
                $option.val(dataField);
                $option.text(this.GetDataFieldDisplayName($sheetControl));
                $fields.append($option);
            }
            // 按钮
            var $actions = $("<div>").css("width", "30%").css("float", "left").css("margin-left", "5px").css("height", "34px").css("line-height", "34px");
            var $btnRemove = $('<i class="fa fa-minus-circle"></i>').css("cursor", "pointer");
            var $btnAdd = $('<i class="fa fa-plus-circle"></i>').css("cursor", "pointer").css("margin-left", "5px");
            $actions.append($btnRemove).append($btnAdd);
            // 配置模板行
            var $tempRow = $("<div>").attr("data-MappingType", "Row").addClass("row");
            $tempRow.append($propertys).append($fields).append($actions);

            var that = this;
            //移除
            $btnRemove.click(function () {
                //只剩下一个时，不允许删除
                if ($el.find("div[data-MappingType='Row']").length == 1) {
                    return;
                }

                $(this).closest("div[data-MappingType='Row']").remove();
                that.SetMappingAttr($el, propertyKey);
            });

            $btnAdd.click(this, function (e) {
                $el.append($tempRow.clone(true));
            });

            $tempRow.find("select").change(this, function (e) {
                that.SetMappingAttr($el, propertyKey);
            });

            // 添加配置行
            var $row;
            if ($.isEmptyObject(mappings)) {
                $row = $tempRow.clone(true);
                $row.find("select[data-MappingType='Source']").val(ValueRange[0].Val);
                $row.find("select[data-MappingType='Target']").val("");
                $el.append($row);
            }
            for (var key in mappings) {
                $row = $tempRow.clone(true);
                $row.find("select[data-MappingType='Source']").val(mappings[key]);
                $row.find("select[data-MappingType='Target']").val(key);
                $el.append($row);
            }

            this.SetMappingAttr($el, propertyKey);
        },

        SetMappingAttr: function ($el, PropertyKey) {
            var $control = this.GetControlElement(this.CurrentSettingKey);
            var rows = $el.find("div[data-MappingType='Row']");
            var mappingJson = {};
            for (var i = 0; i < rows.length; ++i) {
                var $row = $(rows[i]);
                var source = $row.find("select[data-MappingType='Source']").val();
                var target = $row.find("select[data-MappingType='Target']").val();

                if (target) {
                    mappingJson[target] = source;
                }
            }
            $control.attr("data-" + PropertyKey, JSON.stringify(mappingJson));
        },

        InitComputationRuleControls: function ($el, ruleValue) {
            var that = this;

            var rule = "";
            var ruleText = "";
            var ruleFieldIds = [];
            if (ruleValue) {
                var ruleObj = JSON.parse(ruleValue);
                rule = ruleObj.Rule;
                ruleText = ruleObj.Text;
                ruleFieldIds = ruleObj.FieldIds;
            }

            //重新计算显示名称
            ruleText = rule;
            var ruleFieldSetting = null;
            for (var i = 0; i < ruleFieldIds.length; i++) {
                var ruleDataField = ruleFieldIds[i].DataField;
                if (ruleDataField.indexOf(".") > -1) {
                    var parentDataField = ruleDataField.split(".")[0];
                    var parentSetting = that.GetSettings(parentDataField);
                    ruleFieldSetting = that.GetSettings(ruleObj.FieldIds[i].DataField);
                    ruleText = ruleText.replace(eval("/{" + ruleObj.FieldIds[i].DataField + "}/g"), "{" + parentSetting.DisplayName + "." + ruleFieldSetting.DisplayName + "}");
                }
                else {
                    ruleFieldSetting = that.GetSettings(ruleObj.FieldIds[i].DataField);
                    ruleText = ruleText.replace(eval("/{" + ruleObj.FieldIds[i].DataField + "}/g"), "{" + ruleFieldSetting.DisplayName + "}");
                }
            }

            $el.find("input").val(ruleText);

            var $divComputationRule = $("#divComputationRule"); // 计算规则Modal内容
            var $txtComputationRule = $("#txtComputationRule"); // 显示规则的文本框
            var $ddlDataItem = $("#ddlDataItem"); // 插入字段的下拉框
            var $txtComputationNum = $("#txtComputationNum"); // 插入数字的文本框

            var $curControl = that.GetControlElement(that.CurrentSettingKey); // 设计器中当前设置的字段

            // 点击控件属性中的计算规则
            $el.click(function () {
                // 初始化显示规则的文本框
                $txtComputationRule.val(ruleText);

                // 存储规则文本中按字段顺序排列的字段Id对象数组 [{Position:1, DataField:""},...]
                $txtComputationRule.attr("data-ComputationRuleDataFields", JSON.stringify(ruleFieldIds));

                // 将本表单中数字类型的字段添加到插入字段中
                var $numControls = that.DesignerZone.find(".sheet-control[data-TemplateKey='SheetNumber']");
                var $fields = $divComputationRule.find("#ddlDataItem");
                $fields.empty();
                for (var ci = 0, clen = $numControls.length; ci < clen; ci++) {
                    var $numControl = $($numControls[ci]);
                    var dataField = that.GetDataField($numControl);
                    if (dataField == that.CurrentSettingKey) {
                        continue;
                    }
                    var $option = $("<option>");
                    $option.val(dataField);
                    var text = "";
                    if (dataField.indexOf(".") > -1) {
                        var $grid = that.DesignerZone.find(".SheetGridView[data-datafield='" + dataField.slice(0, dataField.indexOf(".")) + "']");
                        text = that.GetDataFieldDisplayName($grid) + ".";
                    }
                    $option.text(text + that.GetDataFieldDisplayName($numControl));
                    $fields.append($option);
                }

                if (that.ComputationRuleModal) {
                    that.ComputationRuleModal.Show();
                }
                else {
                    // 设置控件只读
                    $txtComputationRule.keydown(function (e) {
                        if (e.which < 37 || e.which > 40) {
                            return false;
                        }
                    });
                    $txtComputationRule.on("paste", function () { return false; });

                    // 清空规则
                    $divComputationRule.find("#clearRule").click(function () {
                        $txtComputationRule.val("").attr("data-ComputationRuleDataFields", "");
                    });

                    // 插入字段
                    $divComputationRule.find("#btnInsertDataItem").click(function () {
                        // 按规则文本中的字段顺序，把字段Id保存在另外的属性中
                        var caretPos = that.getCaretPos($txtComputationRule[0]);
                        var ruleDataField = { Position: caretPos, DataField: $ddlDataItem.val() };

                        var ruleDataFieldsArray = []; // [{Position:1, DataField:""},...]
                        var ruleDataFields = $txtComputationRule.attr("data-ComputationRuleDataFields");
                        if (ruleDataFields) {
                            ruleDataFieldsArray = JSON.parse(ruleDataFields);
                        }
                        if (ruleDataFieldsArray.length == 0) {
                            ruleDataFieldsArray.push(ruleDataField);
                        }
                        else {
                            for (var i = 0, len = ruleDataFieldsArray.length; i < len; i++) {
                                var pos = ruleDataFieldsArray[i].Position;
                                if (caretPos <= pos) {
                                    ruleDataFieldsArray.splice(i, 0, ruleDataField);
                                    break;
                                }
                                else {
                                    if (i == len - 1) {
                                        ruleDataFieldsArray.push(ruleDataField);
                                    }
                                }
                            }
                        }
                        $txtComputationRule.attr("data-ComputationRuleDataFields", JSON.stringify(ruleDataFieldsArray));

                        var text = "{" + $ddlDataItem.find("option:selected").text() + "}";
                        that.insertAtCaret($txtComputationRule[0], text);
                    });

                    // 插入数字
                    $divComputationRule.find("#btnInsertNum").click(function () {
                        var num = $txtComputationNum.val();
                        if ($.isNumeric(num)) {
                            that.insertAtCaret($txtComputationRule[0], num);
                            $txtComputationNum.val("");
                        }
                    });

                    // 插入运算符
                    $divComputationRule.find("#btnPlus,#btnMinus,#btnMultiply,#btnDivision,#btnLeftParenthesis,#btnRightParenthesis").click(function () {
                        that.insertAtCaret($txtComputationRule[0], $(this).text());
                    });

                    // 插入函数
                    $divComputationRule.find("#btnSum,#btnAvg,#btnMax,#btnMin").click(function () {
                        var input = $txtComputationRule[0];
                        var text = $(this).text() + "()";
                        var pos = that.getCaretPos(input);
                        that.insertAtCaret(input, text);
                        that.setCaretToPos(input, pos + text.length - 1);
                    });

                    that.ComputationRuleModal = new $.IModal("计算规则",
                        $("#divComputationRule"),
                        [{
                            Text: "确定",
                            DoAction: function () {
                                var $computationRule = $("#txtComputationRule");
                                ruleText = $computationRule.val();
                                rule = ruleText;
                                ruleFieldIds = [];
                                var ruleDataFieldsJson = $computationRule.attr("data-ComputationRuleDataFields");
                                if (ruleDataFieldsJson) {
                                    ruleFieldIds = JSON.parse(ruleDataFieldsJson);
                                }

                                if (rule) {
                                    // 将规则文本中的字段名替换成字段Id保存起来
                                    var startIndex = rule.indexOf("{", 0);
                                    var endIndex = rule.indexOf("}", 0);
                                    var fieldIndex = 0;
                                    while (startIndex > -1 && endIndex > -1) {
                                        rule = rule.slice(0, startIndex + 1) + ruleFieldIds[fieldIndex].DataField + rule.slice(endIndex);

                                        startIndex = rule.indexOf("{", endIndex);
                                        endIndex = rule.indexOf("}", startIndex);
                                        fieldIndex++;
                                    }
                                }

                                that.GetControlElement(that.CurrentSettingKey)
                                    .attr("data-ComputationRule", JSON.stringify({ Rule: rule, Text: ruleText, FieldIds: ruleFieldIds }));

                                // 控件属性中的计算规则文本框
                                $("#SheetControlPropertysPanel #ComputationRule").val(ruleText);
                                that.ComputationRuleModal.Hide();
                            }
                        }]);
                }
            });
        },

        setSelectionRange: function (input, selectionStart, selectionEnd) {
            if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(selectionStart, selectionEnd);
            }
            else if (input.createTextRange) { //ie
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd("character", selectionEnd);
                range.moveStart("character", selectionStart);
                range.select();
            }
        },

        //设置光标的位置
        setCaretToPos: function (input, pos) {
            this.setSelectionRange(input, pos, pos);
        },

        //获取光标位置
        getCaretPos: function (input) {
            var pos = 0;
            if (input.setSelectionRange) {
                pos = input.selectionStart;
            }
            else if (input.createTextRange) {//ie
                var range = input.createTextRange();
                range.moveStart("character", -input.value.length);
                pos = range.text.length;
            }
            return pos;
        },

        //在光标处插入文本，并将光标定位到插入文本的末尾
        insertAtCaret: function (input, text) {
            var strPos = this.getCaretPos(input);
            var front = input.value.substring(0, strPos);
            var back = input.value.substring(strPos, input.value.length);
            input.value = front + text + back;
            strPos = strPos + text.length;
            this.setCaretToPos(input, strPos);
        },

        //配置映射关系
        RandMapping: function (PropertyKey, TemplateKey, Settings) {
            switch (TemplateKey) {
                case "SheetUser":
                    var ValueRange = [];
                    //这里需要从后台读取用户属性配置列表
                    ValueRange.push({ Val: "ParentID", Text: "部门", TemplateKey: "SheetUser" });
                    ValueRange.push({ Val: "Birthday", Text: "生日", TemplateKey: "SheetDateTime" });
                    ValueRange.push({ Val: "Gender", Text: "性别", TemplateKey: "SheetTextBox" });
                    ValueRange.push({ Val: "Email", Text: "邮件", TemplateKey: "SheetTextBox" });
                    ValueRange.push({ Val: "Mobile", Text: "手机", TemplateKey: "SheetTextBox" });
                    var $el = $("<div>").attr("data-MappingType", "MapptingList").addClass("clearfix");
                    var Mappings = eval("(" + Settings[PropertyKey] + ")");

                    for (var i = 0; i < ValueRange.length; i++) {
                        var mapping = Mappings != null && Mappings[ValueRange[i].Val] ? Mappings[ValueRange[i].Val] : "";
                        this.AddSheetUserProperty(ValueRange[i], PropertyKey, $el, mapping);
                    }

                    //if (Mappings != null && !$.isEmptyObject(Mappings)) {
                    //    for (var key in Mappings) {
                    //        this.AddSheetUserProperty(ValueRange, PropertyKey, $el, { Property: key, Val: Mappings[key] });
                    //    }
                    //}
                    //else {
                    //    this.AddSheetUserProperty(ValueRange, PropertyKey, $el);
                    //}
                    return $el;
                    break;
            }
        },

        //添加用户属性
        AddSheetUserProperty: function (range, PropertyKey, $el, mapping) {

            var $row = $("<div>").attr("data-MappingType", "Row").addClass("row");
            var $propertys = $("<label>").attr("data-MappingType", range.Val).css("width", "30%").css("float", "left").text(range.Text);

            var $fields = $("<select>").attr("data-MappingType", "Value").addClass("form-control").css("width", "30%").css("float", "left").css("margin-left", "10px");
            var rows = this.DesignerZone.find("div.row[data-" + this.TemplateKey + "='" + range.TemplateKey + "'][data-datafield!='" + this.CurrentSettingKey + "']");
            $fields.append("<option value=''></option>");
            for (var i = 0; i < rows.length; i++) {
                var $control = $(rows[i]);
                var $option = $("<option>");
                $option.val(this.GetDataField($control));
                $option.text(this.GetDataFieldDisplayName($control));
                $fields.append($option);
            }


            $el.append($row.append($propertys).append($fields));

            if (mapping) {
                $fields.val(mapping);
            }

            //绑定事件------------------
            var RebindMapping = function (that, PropertyKey, $MapptingList) {
                //控件
                var $control = that.GetControlElement(that.CurrentSettingKey);
                var rows = $MapptingList.find("div[data-MappingType='Row']");
                var mappingJson = {};
                for (var i = 0; i < rows.length; ++i) {
                    var $row = $(rows[i]);
                    var key = $row.find("label").attr("data-MappingType");
                    var value = $row.find("select[data-MappingType='Value']").val();

                    if (value) {
                        mappingJson[key] = value;
                    }
                }

                $control.attr("data-" + PropertyKey, JSON.stringify(mappingJson));
            };

            $row.find("select").change(this, function (e) {
                var $parent = $(this).closest("div[data-MappingType='MapptingList']");
                RebindMapping(e.data, PropertyKey, $parent);
            });
        },

        //单选框、复选框、下拉框
        RandDefaultItems: function (PropertyKey, TemplateKey, Settings) {
            var that = this;
            var DefaultValues = eval(Settings["DefaultValue"]) || [];
            var inputType = "radio";
            if (TemplateKey == "SheetCheckboxList") {
                inputType = "checkbox";
            }
            var AddSelectItem = function ($el, item) {
                var $row = $("<div>").attr("data-ItemType", "DataItem").addClass("row");
                var id = $.IGuid();
                var $select;
                if (Settings.isCheckbox == "true") {
                    var value = false;
                    if (Settings["DefaultValue"] == "true")
                        value = true;
                    else
                        value = false;
                    $select = $("<input id='" + id + "' type='" + inputType + "' />").attr("name", TemplateKey + PropertyKey).addClass(inputType).css("margin-left", "5px").css("float", "left").prop("checked", value);
                }
                else
                    $select = $("<input id='" + id + "' type='" + inputType + "' />").attr("name", TemplateKey + PropertyKey).addClass(inputType).css("margin-left", "5px").css("float", "left").prop("checked", DefaultValues.indexOf(item) > -1);
                var $lable = $("<label for='" + id + "' ></label>");
                var $valInput = $("<input type='text' maxlength='" + that.MaxInputLength + "' />").addClass("form-control").css("width", "30%").css("margin-left", "5px").css("height", "34px").css("float", "left");
                $valInput.val(item);
                $row.append($select);
                $row.append($lable);
                $row.append($valInput);

                var $actions = $("<div>").css("width", "30%").css("float", "left").css("margin-left", "5px").css("height", "34px").css("line-height", "34px");
                var $btnRemove = $('<i class="fa fa-minus-circle"></i>').css("cursor", "pointer");
                var $btnAdd = $('<i class="fa fa-plus-circle"></i>').css("cursor", "pointer").css("margin-left", "5px");
                $actions.append($btnRemove).append($btnAdd);
                if (Settings.isCheckbox == "true") {
                    $el.append($row);
                }
                else
                    $el.append($row.append($actions));

                //删除
                $btnRemove.click(that, function (e) {
                    var that = e.data;
                    var $parent = $(this).closest("div[data-ItemType='DefaultItems']");
                    //只剩下一个时，不允许删除
                    if ($parent.find("div[data-ItemType='DataItem']").length == 1) {
                        return;
                    }
                    var $row = $(this).closest("div[data-ItemType='DataItem']");
                    $row.detach();
                    //if (TemplateKey == "SheetCheckboxList") {
                    //    if ($parent.find("div[data-ItemType='DataItem']").length == 1) {
                    //        Settings["isCheckbox"] = "true";
                    //    }
                    //    else {
                    //        Settings["isCheckbox"] = "false";
                    //    }
                    //    SetIsCheckbox(e.data, Settings["isCheckbox"]);
                    //}
                    RebindValue(that, $parent);
                    SetDefaultItems(e.data, PropertyKey, $parent);
                });

                //增加
                $btnAdd.click(that, function (e) {
                    var $contol = e.data.GetControlElement(e.data.CurrentSettingKey);
                    if ($contol.attr("data-ischeckbox") == "true")
                        return;
                    var $parent = $(this).closest("div[data-ItemType='DefaultItems']");
                    var rows = $parent.find("div[data-ItemType='DataItem']").find("input:last");
                    AddSelectItem($parent, "选项" + (rows.length + 1));
                    //if (TemplateKey == "SheetCheckboxList") {
                    //    if ($parent.find("div[data-ItemType='DataItem']").length == 1) {
                    //        Settings["isCheckbox"] = "true";
                    //    }
                    //    else {
                    //        Settings["isCheckbox"] = "false";
                    //    }
                    //    SetIsCheckbox(e.data, Settings["isCheckbox"]);
                    //}
                    SetDefaultItems(e.data, PropertyKey, $parent);
                });

                //选择默认
                $select.click(that, function (e) {
                    var that = e.data;
                    var $parent = $(this).closest("div[data-ItemType='DefaultItems']");
                    RebindValue(that, $parent);

                });

                $valInput.blur(that, function (e) {
                    var $parent = $(this).closest("div[data-ItemType='DefaultItems']");
                    SetDefaultItems(e.data, PropertyKey, $parent);
                });
            };

            var $el = $("<div>").attr("data-ItemType", "DefaultItems").addClass("clearfix");
            var items = eval("(" + Settings[PropertyKey] + ")");
            for (var i = 0; i < items.length; i++) {
                AddSelectItem($el, items[i]);
            }

            var RebindValue = function (that, $parent) {
                //控件
                var $control = that.GetControlElement(that.CurrentSettingKey);
                if ($control.attr("data-ischeckbox") != "true") {
                    var rows = $parent.find("div[data-ItemType='DataItem']").find("input:first");
                    var Vals = [];
                    for (var i = 0; i < rows.length; ++i) {
                        var $row = $(rows[i]);
                        if ($row.prop("checked")) {
                            Vals.push($row.nextAll("input").val());
                        }
                    }
                    $control.attr("data-DefaultValue", JSON.stringify(Vals));
                }
                else {
                    var rows = $parent.find("div[data-ItemType='DataItem']").find("input:first");
                    var result = rows.prop("checked");
                    if (result) {
                        $control.attr("data-DefaultValue", "true");
                    }
                    else {
                        $control.attr("data-DefaultValue", "false");
                    }
                }
            };

            var SetDefaultItems = function (that, PropertyKey, $parent) {
                //控件
                var $control = that.GetControlElement(that.CurrentSettingKey);

                var rows = $parent.find("div[data-ItemType='DataItem']").find("input:last");
                var Vals = [];
                for (var i = 0; i < rows.length; ++i) {
                    Vals.push($(rows[i]).val());
                }
                $control.attr("data-" + PropertyKey, JSON.stringify(Vals));
            };
            var SetIsCheckbox = function (that, value) {
                var $control = that.GetControlElement(that.CurrentSettingKey);
                $control.attr("data-isCheckbox", value);
            }
            return $el;
        },

        //属性改变
        PropertyChange: function (datafield, $valInput) {
            if ($valInput.attr("name") == undefined) { return; }
            var propertyName = $valInput.attr("name");
            var propertyVal = $valInput.val().trim();
            var Settings = this.GetSettings(datafield);
            var $control = this.GetControlElement(datafield);
            var isLayoutItem = $control.parent().hasClass("layoutrow-item");
            var that = this;

            switch (propertyName.toLowerCase()) {
                case "displayname":
                    if (Settings.TemplateKey != this.SheetButton) {
                        $control.find("span:first").text(propertyVal);
                    }
                    else {
                        $control.find("button:first").text(propertyVal);
                    }
                    //CreateBy.FullName-》CreateBy
                    var iDataField = datafield;
                    if (iDataField == this.CreatedBy) {
                        iDataField = "CreatedBy";
                    }
                    this.$SummaryItems.find("label[data-value='" + iDataField + "']").text(propertyVal);
                    this.$NameItems.find("label[data-value='" + iDataField + "']").text(propertyVal);
                    break;
                case this.DataFieldKey.toLowerCase():
                    //字段编码：检验重复
                    if (propertyVal.toLowerCase() == datafield.toLowerCase()) return;
                    //元素里记录的datafield
                    var elementDatafield = $control.attr("data-datafield");
                    if (elementDatafield.indexOf(".") > -1) {
                        propertyVal = elementDatafield.split('.')[0] + "." + propertyVal;
                    }

                    var isFound = false;
                    var allControls = elementDatafield.indexOf(".") < 0 ? this.DesignerZone.find("#tabContent>.tab-pane").children("div[data-datafield]") : $control.closest(".SheetGridView_tr").find("div[data-datafield]");
                    for (var i = 0; i < allControls.length; i++) {
                        if ($(allControls[i]).attr("data-datafield").toLowerCase() == propertyVal.toLowerCase()) {
                            isFound = true;
                            break;
                        }
                    }
                    var msg = "已经存在编码";
                    if (!isFound && Settings.TemplateKey == "SheetGridView") {
                        $.ajax({
                            type: "GET",
                            url: "/SheetDesigner/CheckSchemaCodeDuplicated",
                            data: { SchemaCode: propertyVal },
                            success: function (data) {
                                msg = data.Message;
                                isFound = data.State;
                                if (!isFound) {
                                    //更新所有子表
                                    $control.find("div[data-datafield^='" + datafield + "']").each(function () {
                                        var cdatafield = that.GetDataField($(this));
                                        cdatafield = propertyVal + "." + cdatafield.split(".")[1];
                                        that.SetDataFieldValue($(this), cdatafield);
                                    });
                                }
                            },
                            async: false
                        });
                    }

                    if (isFound) {
                        $valInput.val(datafield);
                        $.IShowError("", msg);
                        return;
                    }
                    else {
                        this.SetDataFieldValue($control, propertyVal);
                        this.CurrentSettingKey = propertyVal;
                        this.$SummaryItems.find("label[data-value='" + datafield + "']").attr("data-value", propertyVal);
                        this.$NameItems.find("label[data-value='" + datafield + "']").attr("data-value", propertyVal);
                    }
                    break;
                case "titledirection":
                    var spanRemoveCss = isLayoutItem ? "col-sm-4" : "col-sm-2";
                    var spanAddCss = "col-sm-12";

                    var divRemoveCss = isLayoutItem ? "col-sm-8" : "col-sm-10";
                    var divAddCss = "col-sm-12";

                    if (propertyVal == "Horizontal") {
                        spanRemoveCss = "col-sm-12";
                        spanAddCss = isLayoutItem ? "col-sm-4" : "col-sm-2";
                        divRemoveCss = "col-sm-12";
                        divAddCss = isLayoutItem ? "col-sm-8" : "col-sm-10";
                    }

                    $control.find("span:first").removeClass(spanRemoveCss).addClass(spanAddCss);
                    $control.find("div:first").removeClass(divRemoveCss).addClass(divAddCss);
                    break;
                case "ischeckbox":
                    {
                        if ($valInput.val() == "true") {
                            //保留第一项
                            var $DefaultItems = this.PropertysZone.find("[data-property='DefaultItems']").find("[data-itemtype='DefaultItems']");
                            $DefaultItems.html("");
                            //设置$control;
                            var val = [];
                            val.push(JSON.parse($control.attr("data-defaultitems"))[0]);
                            var newvalue = JSON.stringify(val);
                            Settings["DefaultItems"] = newvalue;
                            $control.attr("data-defaultitems", newvalue);
                            //setting   
                            Settings["isCheckbox"] = "true";
                            $control.attr("data-isCheckbox", "true");
                            var $checkresult = this.RandDefaultItems("DefaultItems", "SheetCheckboxList", Settings);
                            $("[data-itemtype='DefaultItems']").append($checkresult.children("div[data-itemtype='DataItem']"));
                            //不可以绑定数字字典
                            $('div[data-property="DataDictItemName"]').hide();
                        }
                        else {
                            var $DefaultItems = this.PropertysZone.find("[data-property='DefaultItems']").find("[data-itemtype='DefaultItems']");
                            $DefaultItems.html("");
                            //设置$control;
                            var val = [];
                            val.push(JSON.parse($control.attr("data-defaultitems"))[0]);
                            val.push("选项2");
                            val.push("选项3");
                            var newvalue = JSON.stringify(val);
                            $control.attr("data-defaultitems", newvalue);
                            Settings["isCheckbox"] = "false";
                            Settings["DefaultItems"] = newvalue;
                            var $checkresult = this.RandDefaultItems("DefaultItems", "SheetCheckboxList", Settings);
                            $("[data-itemtype='DefaultItems']").append($checkresult.children("div[data-itemtype='DataItem']"));
                            $control.attr("data-isCheckbox", "false");
                            //可以绑定数字字典
                            $('div[data-property="DataDictItemName"]').show();
                        }
                    }; break;
                case "mode":
                    if (propertyVal == "") {
                        $("#DefaultValue").parent().show();
                    }
                    else {
                        $("#DefaultValue").parent().hide();
                    }
                    break;
                    //case "width":
                    //    //Error:由于边框是2，需要减去4%
                    //    var w = Settings.TemplateKey == "SheetDropDownList" ? ((parseFloat(propertyVal) - 22) + "%") : ((parseFloat(propertyVal) - 24) + "%");
                    //    $control.find("input,select").width(w);
                    //    break;
                case "defaultvalue":
                    $control.find("input").val(propertyVal);
                    break;
                case "ismultiple":
                    if ($valInput.val() == "true") {
                        //多选
                        this.PropertysZone.find("div[data-property='MappingControls']").hide();
                    }
                    else {
                        //单选
                        this.PropertysZone.find("div[data-property='MappingControls']").show();
                    }
                    break;
            }

            $control.attr("data-" + propertyName, propertyVal);
            Settings[propertyName] = propertyVal;
        },

        //提交Action
        PostAction: function (actionName, jsonData, successCall, errorCall) {
            $.ajax({
                type: "POST",
                url: actionName,
                data: jsonData,
                dataType: "json",
                success: successCall,
                error: errorCall
            });
        }
    }
);