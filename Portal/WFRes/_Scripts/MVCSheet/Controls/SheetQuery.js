(function ($) {
    // 控件实例执行方式
    $.fn.SheetQuery = function () {
        return $.MvcSheetUI.Run.call(this, "SheetQuery", arguments);
    };


    // 构造函数
    $.MvcSheetUI.Controls.SheetQuery = function (element, ptions, sheetInfo) {
        this.QueryCss = {
            List: "list",
            AfList: "orglist"
        };
        //传入参数配置
        this.InputMapJson = {};
        //传出参数配置
        this.OutputMapJson = {};
        //过滤设置的标示,避免重复添加
        this.FilterFlag = true;
        this.Columns = null;

        /// <summary>
        /// 控件类型
        /// </summary>
        this.ControlType =
        {
            /// <summary>
            /// 文本框类型
            /// </summary>
            TextBox: 0,
            /// <summary>
            /// 下拉框类型
            /// </summary>
            DropdownList: 1,
            /// <summary>
            /// 单选框类型
            /// </summary>
            RadioButtonList: 2,
            /// <summary>
            /// 复选框类型
            /// </summary>
            CheckBoxList: 3,
            /// <summary>
            /// 长文本框类型
            /// </summary>
            RichTextBox: 4
        }

        $.MvcSheetUI.Controls.SheetQuery.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetQuery.Inherit($.MvcSheetUI.IControl, {
        //SheetQuery本身不是输入控件,无需验证
        Validate: function () {
            return true;
        },

        RenderMobile: function () {
            var that = this;
            //处理映射配置
            this.MappingSetting();
            //初始化查询
            this.InitQuery();
        },

        //移动容器显示后
        AfterMobileEditShow: function () {
            //第一次加载，需要加载数据，第二次的话，如果没有传入参数，不需要刷新
            if (this.Scrllable == null || this.InputMappings.length > 0) {
                this.IsBindInputVlues = false;
                this.LoadQueryData();
            }
        },

        //处理映射配置
        MappingSetting: function () {
            var mapping = this.OutputMappings.split(',');
            for (var i = 0; i < mapping.length; i++) {
                var map = mapping[i].split(':');
                this.OutputMapJson[map[0]] = map[1];
            }

            this.InputMappingSetting();
        },

        //处理传入参数映射配置
        InputMappingSetting: function () {
            var mapping = this.InputMappings.split(',');
            for (var i = 0; i < mapping.length; i++) {
                var map = mapping[i].split(':');
                var targetDataField = map[0];
                var e = $.MvcSheetUI.GetElement(targetDataField, this.RowNum);
                if (e != null) {
                    this.InputMapJson[map[1]] = e.SheetUIManager();
                }
            }
        },

        //初始化查询
        InitQuery: function () {
            $(this.Element).append('<div class="scroll-wrapper"><div class="scroller"></div></div>');
            this.UlElementID = $.MvcSheetUI.NewGuid();
            //数据列表
            this.UlElement = $("<ul>").attr("id", this.UlElementID).addClass(this.QueryCss.AfList).addClass(this.QueryCss.List).appendTo($(this.Element).find("div.scroller"));
        },

        //从后台读取数据
        LoadQueryData: function () {
            var that = this;
            var params = {
                Action: "GetQuerySettingAndData",
                SchemaCode: this.SchemaCode,
                QueryCode: this.QueryCode,
                InputMapping: this.GetInputMappings()
            };

            if (that.FilterPanelID) {
                params["Action"] = "GetQueryData";

                //如何没绑定inputmapping的值，得绑定
                if (!that.IsBindInputVlues) {
                    that.BindFilterInputValues.apply(that);
                }

                params["Filters"] = that.GetFilters();
            }

            if (this.Scrllable) {
                this.UlElement.html("");
                this.Scrllable.UpdateLoadParams(params);
            }
            else {
                this.Scrllable = new ScrollableList({
                    url: $.MvcSheetUI.PortalRoot + "/BizQueryHandler/BizQueryHandler",
                    panelSelector: "#" + this.MobilePanelID,
                    ulSelector: "#" + this.UlElementID,
                    loadMoreAble: true,
                    loadParams: params,
                    //data:后台返回的数据包
                    //scrllable:当前ScrollableList对象
                    //loadMore:true 下一页，false 刷新
                    OnSucceed: function (data, scrllable, loadMore) {
                        that.QueryData = data.QueryData;
                        that.Columns = data.Columns;
                        if (!that.QuerySetting) {
                            that.QuerySetting = data.QuerySetting;
                            that.FilterItems = that.QuerySetting.QueryItems;

                            if (!that.FilterItems) {
                                that.FilterFlag = false;
                            }
                            that.BindFilter.apply(that);
                        }

                        if (!loadMore) {
                            that.UlElement.html("");
                        }

                        that.BindData.apply(that);
                    }
                });

                this.Scrllable.LoadItems();
            }
        },
        GetDisplayName: function (key) {
            if (!this.Columns) return key;
            return this.Columns[key] || key;
        },
        //绑定过滤
        BindFilter: function () {
            if (!this.FilterFlag) return;
            this.FilterFlag = false;

            //查询
            this.FilterBtn = $("<a  class='icon magnifier big'></a>")
                .css("position", "absolute")
                .css("bottom", "20px")
                .css("right", "50px")
                .css("z-index", "999")
                .css("cursor", "pointer").appendTo($(this.Element).find(".scroll-wrapper"));

            this.FilterPanelID = $.MvcSheetUI.NewGuid();
            this.FilterPanel = $("<div>").attr("id", this.FilterPanelID).hide().appendTo(this.Element);

            //添加过滤项
            var ulElement = $("<ul>").addClass("list").appendTo(this.FilterPanel);
            for (var i = 0; i < this.FilterItems.length; i++) {
                var filterItem = this.FilterItems[i];
                if (!filterItem.Visible) continue;//不可见
                if (filterItem.FilterType == 3) continue;//系统参数

                var defaultVal = filterItem.DefaultValue;
                if (this.InputMapJson[filterItem.PropertyName]) {
                    //传入参数
                }

                var liElement = $("<li>").appendTo(ulElement);
                var label = $("<label for='" + this.FilterPanelID + filterItem.PropertyName + "'>" + this.GetDisplayName(filterItem.PropertyName) + "</label>").css("text-align", "left");
                liElement.append(label);
                switch (filterItem.DisplayType) {
                    case this.ControlType.DropdownList:
                        var input = $("<select id='" + this.FilterPanelID + filterItem.PropertyName + "' data-property='" + filterItem.PropertyName + "'>");
                        input.append("<option value=''>" + SheetLanguages.Current.All + "</option>");
                        var vals = filterItem.SelectedValues.split(";");
                        for (var j = 0; j < vals.length; j++) {
                            if (vals[j] != "") {
                                input.append("<option value='" + vals[j] + "'>" + vals[j] + "</option>");
                            }
                        }
                        input.val(filterItem.DefaultValue);
                        liElement.append(input);
                        break;

                    case this.ControlType.RadioButtonList:
                        var vals = filterItem.SelectedValues.split(";");
                        for (var j = 0; j < vals.length; j++) {
                            if (vals[j] != "") {
                                var newid = $.MvcSheetUI.NewGuid();
                                liElement.append("<input id='" + newid + "' type='radio' name='" + filterItem.PropertyName + "' value='" + vals[j] + "'></input>");
                                liElement.append("<label for='" + newid + "'>" + vals[j] + "</label>");
                            }
                        }
                        $("input[name='" + filterItem.PropertyName + "'][value='" + filterItem.DefaultValue + "']").attr("checked", "checked")
                        liElement.append("<br style='clear: both;'></br>");
                        break;

                    case this.ControlType.CheckBoxList:
                        var vals = filterItem.SelectedValues.split(";");
                        for (var j = 0; j < vals.length; j++) {
                            if (vals[j] != "") {
                                var newid = $.MvcSheetUI.NewGuid();
                                liElement.append("<input id='" + newid + "' type='checkbox' name='" + filterItem.PropertyName + "' value='" + vals[j] + "'></input>");
                                liElement.append("<label for='" + newid + "'>" + vals[j] + "</label>");
                            }
                        }
                        $("input[name='" + filterItem.PropertyName + "'][value='" + filterItem.DefaultValue + "']").attr("checked", "checked")
                        liElement.append("<br style='clear: both;'></br>");
                        break;

                    default:
                        //Error:文本类型，需要判断FilterType 和 LogicType,日期、数字 范围
                        liElement.append("<input type='text' id='" + this.FilterPanelID + filterItem.PropertyName + "' data-property='" + filterItem.PropertyName + "'></input>");
                        $("#" + filterItem.PropertyName).val(filterItem.DefaultValue);
                        break;
                }
            }
            //添加容器
            $.ui.addContentDiv(this.FilterPanelID);

            //确定按钮
            this.FooterID = $.MvcSheetUI.NewGuid();
            var footerObj = $("<footer id=" + this.FooterID + " ><a class='icon magnifier big' >" + SheetLanguages.Current.OK + "</a><footer>");
            $("#afui").append(footerObj);
            $(footerObj).unbind("click.footerObj").bind("click.footerObj", this, function (f) {
                f.data.LoadQueryData();
                $.ui.goBack();
            });
            this.FilterPanel.attr("data-footer", this.FooterID);

            //点击事件
            this.FilterBtn.unbind("click.FilterBtn").bind("click.FilterBtn", this, function (e) {
                //显示
                $.ui.loadContent(e.data.FilterPanelID);
            });
        },

        //绑定过滤条件的传入数据
        BindFilterInputValues: function () {
            this.IsBindInputVlues = true;
            for (var i = 0; i < this.FilterItems.length; i++) {
                var filterItem = this.FilterItems[i];
                if (!filterItem.Visible) continue;//不可见
                if (filterItem.FilterType == 3) continue;//系统参数
                if (!this.InputMapJson[filterItem.PropertyName]) continue;
                switch (filterItem.DisplayType) {
                    case this.ControlType.RadioButtonList:
                    case this.ControlType.CheckBoxList:
                        this.FilterPanel.find("input[name='" + filterItem.PropertyName + "'][value='" + this.InputMapJson[filterItem.PropertyName].GetValue() + "']").attr("checked", "checked");
                        break;

                    default:
                        $("#" + this.FilterPanelID + filterItem.PropertyName).val(this.InputMapJson[filterItem.PropertyName].GetValue());
                        break;
                }
            }
        },

        //读取过滤数据
        GetFilters: function () {
            var filters = {};
            for (var i = 0; i < this.FilterItems.length; i++) {
                var filterItem = this.FilterItems[i];
                if (!filterItem.Visible) continue;//不可见
                if (filterItem.FilterType == 3) continue;//系统参数
                switch (filterItem.DisplayType) {
                    case this.ControlType.RadioButtonList:
                    case this.ControlType.CheckBoxList:
                        if (this.FilterPanel.find("input[name='" + filterItem.PropertyName + "']:checked").val()) {
                            filters[filterItem.PropertyName] = $("input[name='" + filterItem.PropertyName + "']:checked").val();
                        }
                        break;

                    default:
                        if ($("#" + this.FilterPanelID + filterItem.PropertyName).val()) {
                            filters[filterItem.PropertyName] = $("#" + this.FilterPanelID + filterItem.PropertyName).val();
                        }
                        break;
                }
            }

            return JSON.stringify(filters);
        },

        //读取inputmapping映射值
        GetInputMappings: function () {
            var inputJson = {};
            if (this.InputMapJson) {
                for (var key in this.InputMapJson) {
                    if (this.InputMapJson[key])
                        inputJson[key] = this.InputMapJson[key].GetValue();
                }
            }

            return JSON.stringify(inputJson);
        },
        getPropertyNameFromData: function (bizObject, propertyName) {
            for (var k in bizObject) {
                if (k.toLocaleLowerCase() == propertyName.toLocaleLowerCase()) {
                    return k;
                }
            }
        },
        //从后台读取数据后，绑定到前端
        BindData: function () {
            for (var i = 0; i < this.QueryData.length; i++) {
                var row = this.QueryData[i];
                var liElement = $("<li>").data("dataindex", i).data("v", JSON.stringify(row));
                var pElement = $("<p>");
                var datafield = $("#" + this.ElementID).attr("data-datafield");

                for (var j = 0; j < this.QuerySetting.Columns.length; j++) {
                    var PropertyName = this.QuerySetting.Columns[j].PropertyName;
                    PropertyName = this.getPropertyNameFromData(row, PropertyName);

                    if (PropertyName == this.OutputMapJson[datafield]) {
                        liElement.html("");
                        liElement.append("<h2>" + row[PropertyName] + "</h2>");
                    }
                    else if (j == 0) {
                        liElement.append("<h2>" + row[PropertyName] + "</h2>");
                    }
                    else if (this.QuerySetting.Columns[j].Visible == 1) {
                        pElement.append("<span style='font-style:italic'>" + this.GetDisplayName(PropertyName) + "</span>:" + row[PropertyName] + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                    }
                }

                liElement.append(pElement).appendTo(this.UlElement);

                liElement.unbind("click.liElement").bind("click.liElement", this, function (e) {
                    e.data.ItemClick.apply(e.data, [JSON.parse($(this).data("v"))]);
                });
            }
        },
        //点击事件
        ItemClick: function (rowdata) {
            // var rowdata = this.QueryData[dataindex];
            var datafield = $("#" + this.ElementID).attr("data-datafield");
            var rowIndex = $("#" + this.ElementID).attr("data-row");
            for (var key in this.OutputMapJson) {
                if (key == datafield) {
                    //当前控件，直接赋值
                    $("#" + this.ElementID).val(rowdata[this.OutputMapJson[key]]);
                    $(this.ElementMask).text(rowdata[this.OutputMapJson[key]]);

                    //赋值后自动验证
                    try {
                        $.MvcSheetUI.ControlManagers[$("#" + this.ElementID).data('sheetid')].Validate()
                    }
                    catch (e) { }

                }
                else {
                    var e = $.MvcSheetUI.GetElement(key, rowIndex);
                    if (e != null && e.data($.MvcSheetUI.SheetIDKey)) {
                        e.SheetUIManager().SetValue(rowdata[this.OutputMapJson[key]]);
                        if (e.SheetUIManager().Validate) {
                            e.SheetUIManager().Validate();
                        }
                    }
                }
            }
            $.ui.goBack(0);
        }
    });

})(jQuery);