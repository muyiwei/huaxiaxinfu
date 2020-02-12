//属性
jQuery.extend({
    //设计器
    ReportDesigner: $.extend({
        Actions: {
            LoadReportData: "LoadReportData",
            SaveReportSetting: "SaveReportSetting",
            PublishReportSetting: "PublishReportSetting"
        },
        //报表配置:传入后台的js
        ReportSetting: {
            Code: "",
            DisplayName: "",
            ReportType: "",

            Parameters: {},//过滤条件
            Columns: [],//列源
            //以下属性是交叉分析表才有
            ColumnTitle: [],//行标题
            RowTitles: {},//列标题
            DefaultChart: "",//默认图表
            Charts: [],//可展示图表
            AxisDimension: "",//X轴展示
            XAxisUnit: "",//X轴单位
            YAxisUnit: ""//Y单位
        },
        SourceColumns: [],
        SourceData: []
    }, ReportBase)
});

//函数
jQuery.extend(
    $.ReportDesigner,
    {
        Init: function (ReportCode) {
            this.ReportCode = ReportCode;
            //this.$FiledZone = $("#FiledZone");
            //this.$DesignerParameter = $("#DesignerParameter");
            //明细汇总表
            this.$DesignerDataTable = $("#DesignerDataTable");
            //交叉分析表明细
            this.$DesignerCombinedTable = $("#DesignerCombinedTable");
            //过滤条件区
            this.$ParameterPropertys = $("#ParameterPropertys");

            this.LoadReportData();
            this.BindButtonEvent();
        },

        //加载报表数据
        LoadReportData: function () {
            var that = this;
            var Parameter = { ReportCode: this.ReportCode };
            this.PostAction(
                this.Actions.LoadReportData,
                Parameter,
                function (data) {
                    that.ReportSetting.Code = data.ReportSetting.Code;
                    that.ReportSetting.DisplayName = data.ReportSetting.DisplayName;
                    that.ReportSetting.ReportType = data.ReportSetting.ReportType;
                    that.ReportSetting.Parameters = data.ReportSetting.Parameters;
                    that.ReportSetting.Columns = data.ReportSetting.Columns;
                    that.ReportSetting.ColumnTitle = data.ReportSetting.ColumnTitle;
                    that.ReportSetting.RowTitles = data.ReportSetting.RowTitles;
                    that.ReportSetting.DefaultChart = data.ReportSetting.DefaultChart;
                    that.ReportSetting.Charts = data.ReportSetting.Charts;
                    that.ReportSetting.AxisDimension = data.ReportSetting.AxisDimension;
                    that.ReportSetting.XAxisUnit = data.ReportSetting.XAxisUnit;
                    that.ReportSetting.YAxisUnit = data.ReportSetting.YAxisUnit;

                    that.SourceColumns = data.SourceColumns;
                    // 这里可以判定如果没有数据的时候，需要模拟测试数据
                    that.SourceData = data.SourceData;

                    //初始化数据源字段
                    //that.RenderSourceColumn.apply(that);
                    //初始化拖拽
                    //that.InitDragEvent.apply(that);

                    //初始化报表
                    that.InitReportSetting.apply(that);
                });
        },

        //绑定按钮事件
        BindButtonEvent: function () {
            var that = this;
            $("#btn_Save").click(function () {
                that.SaveReportSetting.apply(that);
            });

            $("#btn_Public").click(function () {
                that.PublishReportSetting.apply(that);
            });

            $(".propertyTitle").click(function (e) {
                if ($(e.target).hasClass("fa-plus")) {
                    //添加字段
                    that.ShowSourceColumnsSelector.apply(that, [$(this).parent().attr("id"), $(e.target)]);
                }
                else {
                    var $propertyContent = $(this).next();
                    if ($propertyContent.hasClass("propertyContent")) {
                        if ($propertyContent.is(":visible")) {
                            $propertyContent.hide();
                            $(this).find("i.fa-chevron-right").removeClass("fa-chevron-right").addClass("fa-chevron-down");
                        }
                        else {
                            $propertyContent.show();
                            $(this).find("i.fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-right");
                        }
                    }
                }
            });
        },

        //保存
        SaveReportSetting: function () {
            if (!this.BindReportSetting(true)) {
                return;
            }

            this.PostAction(
                this.Actions.SaveReportSetting,
                { ReportSettingJson: JSON.stringify(this.ReportSetting) },
                function (data) {
                    if (data.Result) {
                        $.IShowSuccess(data.Msg);
                    }
                    else {
                        $.IShowError(data.Msg);
                    }
                }
            );
        },

        //发布
        PublishReportSetting: function () {
            if (!this.BindReportSetting(true)) {
                return;
            }

            this.PostAction(
                this.Actions.PublishReportSetting,
                { ReportSettingJson: JSON.stringify(this.ReportSetting) },
                function (data) {
                    if (data.Result) {
                        $.IShowSuccess(data.Msg);
                    }
                    else {
                        $.IShowError(data.Msg);
                    }
                }
            );
        },

        //绑定过滤条件
        BindParameter: function (validate) {
            var ColumnItems = this.$ParameterPropertys.find("li.ColumnItem");//每行数据
            this.ReportSetting.Parameters = [];
            for (var i = 0; i < ColumnItems.length; i++) {
                var Parameter = {
                    ColumnCode: $(ColumnItems[i]).attr("data-ColumnCode"),
                    ColumnName: $(ColumnItems[i]).attr("data-ColumnName"),
                    DisplayName: $(ColumnItems[i]).attr("data-DisplayName"),
                    ParameterType: $(ColumnItems[i]).attr("data-ParameterType"),
                    ParameterValue: $(ColumnItems[i]).attr("data-ParameterValue"),
                    DefaultValue: $(ColumnItems[i]).attr("data-DefaultValue"),
                    Visible: $(ColumnItems[i]).attr("data-Visible"),

                };

                if (validate && Parameter.DisplayName == "") {
                    $.IShowError("过滤条件的名称不能为空!");
                    return false;
                }

                this.ReportSetting.Parameters.push(Parameter);
            }
            return true;
        },

        //初始化过滤条件
        InitParameter: function () {
            for (var i = 0; this.ReportSetting.Parameters != null && i < this.ReportSetting.Parameters.length; i++) {
                this.RenderParameterColumnItem(this.ReportSetting.Parameters[i]);
            }
        },

        //初始化数据源字段
        //RenderSourceColumn: function () {
        //    this.$FiledZone.html("");
        //    for (var i = 0; i < this.SourceColumns.length; i++) {
        //        this.$FiledZone.append('<p class="drag ui-draggable" id="' + this.SourceColumns[i].ColumnCode + '"><a class="btn btn-default">' + this.SourceColumns[i].DisplayName + '</a></p>');
        //    }
        //},

        //显示数据源字段选择器
        //@targetId:对象Id，是过滤，列字段，行标题或列标题
        ShowSourceColumnsSelector: function (targetId, $Trigger) {
            var that = this;
            var $Content = $("<div>");//弹出框
            var $Ul = $("<ul class='nav nav-pills nav-stacked'>");
            for (var i = 0; i < that.SourceColumns.length; i++) {
                //判定是否存在
                if ($("#" + targetId).find("ul").find("li[data-ColumnCode='" + that.SourceColumns[i].ColumnCode + "']").length > 0) {
                    continue;
                }
                if (targetId == "CombinedColumnsPropertys" && that.SourceColumns[i].ColumnType != this.ColumnType.Numeric) {
                    continue;
                }

                var $Li = $('<li id="' + that.SourceColumns[i].ColumnCode + '"><a href="javascript:void(0);">' + that.SourceColumns[i].DisplayName + '</a></li>');
                $Li.click(function () {
                    switch (targetId) {
                        case "ParameterPropertys":
                            that.AddParameter.apply(that, [$(this).attr("id")]);
                            $(this).hide();
                            break;
                        case "DataTablePropertys":
                            that.AddColumn.apply(that, [$(this).attr("id")]);
                            $(this).hide();
                            break;
                        case "CombinedRowTitlePropertys":
                            that.AddRowTitle.apply(that, [$(this).attr("id")]);
                            $(this).hide();
                            break;
                        case "CombinedColumnTitlePropertys":
                            that.AddColumnTitle.apply(that, [$(this).attr("id")]);
                            $(this).hide();
                            break;
                        case "CombinedColumnsPropertys":
                            that.AddColumns.apply(that, [$(this).attr("id")]);
                            $(this).hide();
                            break;
                        default:
                            alert(targetId);
                    }
                    if ($Ul.find("li:visible").length == 0) {
                        $Ul.remove();
                    }
                });
                $Ul.append($Li);
            }
            if ($Ul.find("li").length == 0) {
                $.IShowWarn("没有可添加的数据项!");
                return;
            }
            $Content.append($Ul);
            this.ShowPopover($Content, $Trigger);
        },


        //添加过滤条件
        AddParameter: function (ColumnCode) {
            this.$ParameterPropertys.find("div.propertyContent").show();

            if (this.$ParameterPropertys.find("ul").find("li[data-ColumnCode='" + ColumnCode + "']").length > 0) {
                $.IShowWarn("已经有该列!");
                return;
            }

            var SourceColumn = this.GetSourceColumnByCode(ColumnCode);
            var Parameter = {
                ColumnCode: ColumnCode,
                ColumnName: SourceColumn.ColumnName,
                DisplayName: SourceColumn.DisplayName,
                ParameterType: this.ParameterType.String,//this.GetDefaultParameterType(SourceColumn.ColumnType),
                ParameterValue: "",
                DefaultValue: null,
                AllowNull: true,
                Visible: true,
                ColumnType: SourceColumn.ColumnType,
            };
            //修改类型
            this.SetParameterType(SourceColumn.ColumnType, Parameter);
            this.RenderParameterColumnItem(Parameter);
        },

        //过滤条件的类型
        SetParameterType: function (ColumnType, Parameter) {
            switch (ColumnType) {
                case this.ColumnType.Numeric:
                    Parameter.ParameterType = this.ParameterType.Numeric;
                    break;
                case this.ColumnType.DateTime:
                    Parameter.ParameterType = this.ParameterType.DateTime;
                    break;
                case this.ColumnType.String:
                    Parameter.ParameterType = this.ParameterType.String;
                    break;
                case this.ColumnType.SingleParticipant:
                case this.ColumnType.MultiParticipant:
                    Parameter.ParameterType = this.ParameterType.Organization;
                    break;
            }
        },

        //获取原始过滤条件类型
        GetOriParameterType: function (ColumnType) {
            switch (ColumnType) {
                case this.ColumnType.Numeric:
                    return this.ParameterType.Numeric;
                    break;
                case this.ColumnType.DateTime:
                    return this.ParameterType.DateTime;
                    break;
                case this.ColumnType.String:
                    return this.ParameterType.String;
                    break;
                case this.ColumnType.SingleParticipant:
                case this.ColumnType.MultiParticipant:
                    return this.ParameterType.Organization;
                    break;
            }
        },

        //渲染字段项 过滤条件的
        RenderParameterColumnItem: function (Parameter) {
            var that = this;
            var $columnItem = $("<li>").addClass("ColumnItem");
            $columnItem.attr("data-ColumnCode", Parameter.ColumnCode);//编码
            $columnItem.attr("data-ParameterType", Parameter.ParameterType);//参数类型
            $columnItem.attr("data-ParameterValue", Parameter.ParameterValue);//参数值
            $columnItem.attr("data-DefaultValue", Parameter.DefaultValue);//默认值
            $columnItem.attr("data-AllowNull", Parameter.AllowNull);//允许为空
            $columnItem.attr("data-Visible", Parameter.Visible);//
            $columnItem.attr("data-ColumnCode", Parameter.ColumnCode);//字段objectId
            $columnItem.attr("data-ColumnName", Parameter.ColumnName);//字段名
            $columnItem.attr("data-DisplayName", Parameter.DisplayName);//过滤项显示名称
            var ColumnType = this.GetColumnTypeByCode(Parameter.ColumnCode);
            $columnItem.attr("data-ColumnType", ColumnType);
            //

            $columnItem.append("<div class='ColumnName'>" + Parameter.DisplayName + "</div>");
            $columnItem.append("<div class='ColumnGroup'></div>");
            var $btnEdit = $("<i class='fa fa-pencil-square-o'></i>");
            var $btnRemove = $("<i class='fa fa-trash-o'></i>");

            $columnItem.find("div.ColumnGroup").append($btnEdit);
            $columnItem.find("div.ColumnGroup").append($btnRemove);
            this.$ParameterPropertys.find("ul").append($columnItem);

            $btnRemove.click(function () {
                $(this).closest("li").detach();
                that.$ColumnInfo.hide();
            });

            $btnEdit.click(function () {
                that.ShowEditParameter.apply(that, [Parameter.ColumnCode, Parameter.DisplayName, $(this)]);//第二个参数可能是$columnItem.attr("data-DisplayName");
            });

            //排序
            this.$ParameterPropertys.find("ul").sortable({
                forcePlaceholderSize: true,
                placeholder: "ColumnItem"
            });
        },

        //显示编辑过滤参数
        ShowEditParameter: function (ColumnCode, DisplayName, $el) {
            var that = this;
            var $ParameterItem = this.$ParameterPropertys.find("li[data-ColumnCode='" + ColumnCode + "']")//存配置信息的dom;
            var ColumnType = $ParameterItem.attr("data-ColumnType");
            var OriParameterType = this.GetOriParameterType(parseInt(ColumnType));
            var CurrentType = parseInt($ParameterItem.attr("data-ParameterType"));///当前过滤字段类型
            var $Content = $("<div>");//弹出框
            //显示名称
            var $NameItem = $("<div>").addClass("propertyItem");
            var $NameEdit = $("<input>").val(DisplayName);
            $NameItem.append("<div class='ItemName'>名称</div>");
            $NameItem.append($("<div class='ItemGroup'>").append($NameEdit));
            //参数类型 下拉框
            var $ParameterTypeItem = $("<div>").addClass("propertyItem");
            $ParameterTypeItem.append("<div class='ItemName'>参数类型</div>");
            var $ParameterTypeEdit = $("<select>");
            $ParameterTypeItem.append($("<div class='ItemGroup'>").append($ParameterTypeEdit));
            for (var key in this.ParameterType) {
                var ParameterTypeValue = this.ParameterType[key]
                if (OriParameterType == this.ParameterType.Numeric && ParameterTypeValue != this.ParameterType.Numeric && ParameterTypeValue != this.ParameterType.FixedValue) continue;
                if (OriParameterType == this.ParameterType.DateTime && ParameterTypeValue != this.ParameterType.DateTime) continue;
                if ((OriParameterType == this.ParameterType.String || OriParameterType == this.ParameterType.Organization)
                    && (ParameterTypeValue != this.ParameterType.String && ParameterTypeValue != this.ParameterType.Organization && ParameterTypeValue != this.ParameterType.FixedValue)) continue;

                var optionText = "";
                switch (ParameterTypeValue) {
                    case this.ParameterType.String:
                        optionText = "字符查询";
                        break;
                    case this.ParameterType.Numeric:
                        optionText = "数字范围";
                        break;
                    case this.ParameterType.DateTime:
                        optionText = "时间范围";
                        break;
                    case this.ParameterType.Organization:
                        optionText = "组织机构";
                        break;
                    case this.ParameterType.FixedValue:
                        optionText = "固定值";
                        break;
                }
                $ParameterTypeEdit.append("<option value='" + this.ParameterType[key] + "'>" + optionText + "</option>");
            }
            //修改
            $ParameterTypeEdit.change(function () {
                that.ParameterTypeEditChange.apply(that, [ColumnCode, $(this)]);
            });

            $NameEdit.keyup(function () {
                $ParameterItem.attr("data-DisplayName", $(this).val());
                $ParameterItem.find("div.ColumnName").text($(this).val());
            });
            //是否显示
            var $IsShow = $("<div>").addClass("propertyItem");
            var $IsShowEdit = $("<input>").attr("type", "checkbox").prop("checked", $ParameterItem.attr("data-Visible") == "false" ? false : true);
            $IsShow.append("<div class='ItemName'>显示</div>");
            $IsShow.append($("<div class='ItemGroup'>").append($IsShowEdit));
            $IsShowEdit.click(function () {
                if ($IsShowEdit.prop("checked") == true) {
                    $ParameterItem.attr("data-Visible", true);
                }
                else {
                    $ParameterItem.attr("data-Visible", false);
                }
            });

            $Content.append($NameItem);
            $Content.append($ParameterTypeItem);
            $Content.append($("<div>").addClass("propertyItem").attr("data-ParameterValueContent", "ParameterValueContent"));
            $Content.append($IsShow);
            //默认值
            this.ShowPopover($Content, $el);
            $ParameterTypeEdit.val($ParameterItem.attr("data-ParameterType"));
            $ParameterTypeEdit.change();
        },

        //显示编辑框
        //@$Content 显示的内容
        //@$Trigger 触发的按钮,为计算位置用
        ShowPopover: function ($Content, $Trigger) {
            var btnID = $.IGuid();// $(this).attr("id");
            $Trigger.attr("id", btnID);

            var $popover = $("#PropertysPopover");
            var $arrow = $popover.find("div.arrow");
            $popover.find("div.popover-content").html("").append($Content);;

            $arrow.css("top", "24px");
            $popover.css("top", $Trigger.position().top - 18);
            $popover.css("left", $Trigger.position().left - $popover.width() - 5);
            $popover.show();

            //点击屏幕的其他地方
            $(document).unbind("click.ReportsPopover").bind("click.ReportsPopover", this, function (e) {
                if ($(e.target).closest("div[id='PropertysPopover']").length == 0
                    && $(e.target).attr("id") != btnID) {
                    $("#PropertysPopover").hide();
                }
            });
        },

        //过来条件改变
        ParameterTypeEditChange: function (ColumnCode, $ParameterTypeEdit) {
            var $ParameterItem = this.$ParameterPropertys.find("li[data-ColumnCode='" + ColumnCode + "']");
            var $ParameterValueItem = $("#PropertysPopover").find("div[data-ParameterValueContent='ParameterValueContent']");
            var parameterType = $ParameterTypeEdit.val();
            $ParameterItem.attr("data-ParameterType", parameterType);
            var $ParameterValueEdit = $("<select>");
            $ParameterValueEdit.change(function () {
                $ParameterItem.attr("data-DefaultValue", $(this).val());
            });
            $ParameterValueItem.html("");

            switch (parseInt(parameterType)) {
                case this.ParameterType.DateTime:
                    $ParameterValueItem.append("<div class='ItemName'>默认值</div>");
                    $ParameterValueItem.append($("<div class='ItemGroup'>").append($ParameterValueEdit));
                    $ParameterValueEdit.append("<option value='1'>当天</option>");
                    $ParameterValueEdit.append("<option value='2'>本周</option>");
                    $ParameterValueEdit.append("<option value='3'>本月</option>");
                    $ParameterValueEdit.append("<option value='4'>本季度</option>");
                    $ParameterValueEdit.append("<option value='5'>本年度</option>");
                    $ParameterValueItem.append($ParameterValueItem);
                    $ParameterValueEdit.val($ParameterItem.attr("data-DefaultValue"));
                    $ParameterValueItem.slideDown();
                    break;
                case this.ParameterType.Organization:
                    $ParameterValueItem.append("<div class='ItemName'>默认值</div>");
                    $ParameterValueItem.append($("<div class='ItemGroup'>").append($ParameterValueEdit));
                    $ParameterValueEdit.append("<option value='1'>本人</option>");
                    $ParameterValueEdit.append("<option value='2'>本部门</option>");
                    $ParameterValueEdit.append("<option value='3'>所有</option>");
                    $ParameterValueItem.append($ParameterValueItem);
                    $ParameterValueEdit.val($ParameterItem.attr("data-DefaultValue"));
                    $ParameterValueItem.slideDown();
                    break;
                case this.ParameterType.FixedValue:
                    $ParameterValueItem.append("<div class='ItemName'>固定值选项</div>");
                    var $newParameterValueEdit = $ParameterItem.attr("data-ParameterValue") == "" || $ParameterItem.attr("data-ParameterValue") == null ? $("<input>").attr("type", "text").addClass("ItemGroup").attr("placeholder", "分隔符:';'") : $("<input>").attr("type", "text").addClass("ItemGroup").attr("placeholder", "分隔符:';'").val($ParameterItem.attr("data-ParameterValue"));
                    $newParameterValueEdit.change(function () {
                        $ParameterItem.attr("data-ParameterValue", $(this).val());
                    });
                    $ParameterValueItem.append($("<div class='ItemGroup'>").append($newParameterValueEdit));
                    $ParameterValueItem.append($ParameterValueItem);
                    $ParameterValueEdit.val($ParameterItem.attr("data-ParameterValue"));
                    $ParameterValueItem.slideDown();
                    break;
                default:
                    $ParameterValueItem.append("<div class='ItemName'>默认值</div>");
                    var $newParameterValueEdit;
                    if (this.ParameterType.Numeric == parseInt(parameterType)) {
                        $newParameterValueEdit = $ParameterItem.attr("data-DefaultValue") == "" || $ParameterItem.attr("data-DefaultValue") == null ? $("<input>").attr("type", "text").addClass("ItemGroup").attr("placeholder", "分隔符:';'") : $("<input>").attr("type", "text").addClass("ItemGroup").attr("placeholder", "分隔符:';'").val($ParameterItem.attr("data-DefaultValue"));
                    }
                    else {
                        $newParameterValueEdit = $ParameterItem.attr("data-DefaultValue") == "" || $ParameterItem.attr("data-DefaultValue") == null ? $("<input>").attr("type", "text").addClass("ItemGroup").val($ParameterItem.attr("data-DefaultValue")) : $("<input>").attr("type", "text").attr("placeholder", "分隔符:';'");
                    }
                    $newParameterValueEdit.change(function () {
                        $ParameterItem.attr("data-DefaultValue", $(this).val());
                    });
                    $ParameterValueItem.append($("<div class='ItemGroup'>").append($newParameterValueEdit));
                    $ParameterValueItem.append($ParameterValueItem);
                    $ParameterValueEdit.val($ParameterItem.attr("data-ParameterValue"));
                    $ParameterValueItem.slideDown();
                    break;
            }
        },

        //根据Code取到数据源字段
        GetSourceColumnByCode: function (ColumnCode) {
            for (var i = 0; i < this.SourceColumns.length; i++) {
                if (this.SourceColumns[i].ColumnCode == ColumnCode) {
                    return $.extend({}, this.SourceColumns[i], { ObjectID: $.IGuid(), DisplayName: this.SourceColumns[i].DisplayName.split('.')[1] });
                }
            }
            return null;
        },

        //根据Code取到ColumnType字段
        GetColumnTypeByCode: function (ColumnCode) {
            for (var i = 0; i < this.SourceColumns.length; i++) {
                if (this.SourceColumns[i].ColumnCode == ColumnCode) {
                    return this.SourceColumns[i].ColumnType;
                }
            }
            return null;
        },

        //提交数据接口
        PostAction: function (ActionName, Parameter, CallBack) {
            $.ajax({
                type: "POST",
                url: "/ReportDesigner/DoAction",
                data: $.extend({ Command: ActionName }, Parameter),
                dataType: "json",
                success: CallBack
            });
        }
    }
);