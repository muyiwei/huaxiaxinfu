var PropertyGuide = {
    // 下拉框的设置向导
    PopupHeight: 390,
    PopupWidth: 600,
    LigerDialogOpen: function (option) {
        //debugger;
        var h = option.height || PropertyGuide.PopupHeight;
        var w = option.width || PropertyGuide.PopupWidth;
        option.control.unbind("click.Property").bind("click.Property", function (e) {
            if (option.loadFun) {
                option.loadFun.call(this);
            }
            var ligerDialog = $.ligerDialog.open({
                title: option.description,
                target: $("." + option.popupName),
                height: h,
                isHidden: true,
                width: w,
                buttons: [
                   {
                       text: $.Lang("GlobalButton.Confirm"), onclick: function (item, dialog) {
                           // 点击确定事件，将值写回
                           option.submitFun.call();
                           dialog.close();
                       }
                   },
                   {
                       text: $.Lang("GlobalButton.Cancel"), onclick: function (item, dialog) {
                           dialog.close();
                       }
                   }]
            });
            //内容过长时，滚动显示
            ligerDialog.dialog.find(".l-dialog-content").css({ "overflow-y": "auto" });
        });
    },
    // 下拉框弹出绑定
    DropDownListSetting: function (control, popupName, description, height, width) {
        //debugger;
        PropertyGuide.LigerDialogOpen.call(this,
            {

                control: control,
                loadFun: function () { // 处理加载函数
                    var schemaCode = $(".PropertyTable input:text[data-property='SchemaCode']").val();

                    //数据模型值显示
                    $("#divDropDownListSetting input[data-property='SchemaCode']").attr("hidePanel", "1").click();

                    var $bizObjectText = $(".DropDownListSetting .WorkflowSelectorWapper").find(":text");
                    var $bizObjectHidden = $(".DropDownListSetting .WorkflowSelectorWapper").next("input[type='hidden']");

                    //TODO
                    // 从后台获取数据模型的显示名称
                    $.get(PortalRoot + "/MVCDesigner/GetBizObjectFullName", {
                        "SchemaCode": schemaCode,
                        "IsDisplayCode": $bizObjectText.attr("isdisplaycode")
                    }, function (data) {
                        $bizObjectText.val(data);
                    });

                    $bizObjectHidden.val(schemaCode);



                    // 将当前设置的控件id保存起来，用于后续判断是否为子表数据项
                    PropertyGuide.currentControlId = $(this).attr("id");

                    PropertyGuide.DropDownListSchemaChange(schemaCode);
                },
                submitFun: function () {
                    // 处理确定逻辑
                    var propertyTable = $(".PropertyTable"); //属性panel
                    //SchemaCode
                    var $bizObjectHidden = $(".DropDownListSetting .WorkflowSelectorWapper").next("input[type='hidden']");
                    var schemaCodeControl = propertyTable.find(":text[data-property='SchemaCode']");
                    schemaCodeControl.val($bizObjectHidden.val());
                    schemaCodeControl.trigger("change");
                    //QueryCode
                    var queryCodeControl = propertyTable.find(":text[data-property='QueryCode']");
                    queryCodeControl.val($("#selDropDownListQuery").val());
                    queryCodeControl.trigger("change");

                    //Filter
                    var trQueryItems = $("#tbQueryItem").find("tr[id!='trQueryItemHeader']"); //查询条件
                    var filter = "";
                    for (var trIndex = 0; trIndex < trQueryItems.length; trIndex++) {
                        var tdQueryItems = $(trQueryItems[trIndex]).find("td");
                        var propertyName = $(tdQueryItems[0]).attr("code");
                        var dataItemCode = $(tdQueryItems[1]).find("select").val();
                        if (dataItemCode) {
                            filter += dataItemCode + ":" + propertyName + ",";
                        }
                    }
                    if (filter) {
                        filter = filter.substr(0, filter.length - 1);
                    }
                    var filterControl = propertyTable.find(":text[data-property='Filter']");
                    filterControl.val(filter);
                    filterControl.trigger("change");

                    //DataValueField
                    var dataValueFieldControl = propertyTable.find(":text[data-property='DataValueField']");
                    dataValueFieldControl.val($("#selDropDownListValueProperty").val());
                    dataValueFieldControl.trigger("change");
                    //DataTextField
                    var dataTextFieldControl = propertyTable.find(":text[data-property='DataTextField']");
                    dataTextFieldControl.val($("#selDropDownListDisplayProperty").val());
                    dataTextFieldControl.trigger("change");
                },
                popupName: popupName,
                description: $("#divDropDownListSetting").attr("title"),
                height: height,
                width: width
            });
    },
    // 下拉框编码Change事件
    DropDownListSchemaChange: function (schemaCode) {
        var selQuery = $("#selDropDownListQuery"); //查询列表
        var tbQueryItem = $("#tbQueryItem"); //查询条件
        var selValueProperty = $("#selDropDownListValueProperty"); //值属性
        var selDisplayProperty = $("#selDropDownListDisplayProperty"); //显示属性
        //清空值
        selQuery.empty();
        selQuery.val('')
        tbQueryItem.find("tr[id!='trQueryItemHeader']").remove();
        selValueProperty.empty();
        selDisplayProperty.empty();

        if (!schemaCode) { return; }

        //datafieldSelect
        var datafieldSelect = PropertyGuide._getDatafieldSelect(PropertyGuide.currentControlId);

        //异步取数，初始化界面
        $.ajax({
            type: "POST",
            async: true,
            url: PortalRoot + "/MVCDesigner/GetBizObjectSchema",
            data: { SchemaCode: schemaCode },
            dataType: "json",
            success: function (data) {
                var propertyTable = $(".PropertyTable"); //属性panel

                if (data.BizQueries) {
                    for (var item in data.BizQueries) {
                        //查询编码
                        $("<option value=\"" + item + "\">" + data.BizQueries[item] + "[" + item + "]" + "</option>").appendTo(selQuery);
                    }
                    //查询
                    var queryCode = propertyTable.find(":text[data-property='QueryCode']").val();
                    selQuery.val(queryCode);
                    selQuery.unbind("change").bind("change", function () {
                        tbQueryItem.find("tr[id!='trQueryItemHeader']").remove();
                        var selQueryValue = $(this).val();
                        //查询条件
                        if (data.QueryItems && data.QueryItems[selQueryValue]) {
                            var queryItems = data.QueryItems[selQueryValue];
                            var filters = propertyTable.find(":text[data-property='Filter']").val().split(",");
                            var filterItems = {};
                            for (var filterIndex in filters) {
                                var filterItem = filters[filterIndex].split(":");
                                if (filterItem.length == 2) {
                                    var dataitem = filterItem[0];
                                    var property = filterItem[1];
                                    filterItems[property] = dataitem;
                                }
                            }

                            for (var propertyCode in queryItems) {
                                var tr = $("<tr></tr>");
                                tr.append("<td code='" + propertyCode + "'>" + queryItems[propertyCode] + "[" + propertyCode + "]" + "</td>");
                                tr.append("<td style='padding:1px;'>" + datafieldSelect + "</td>");
                                tr.find("select").val(filterItems[propertyCode] ? filterItems[propertyCode] : "");
                                tbQueryItem.append(tr);
                            }
                        }

                        //值属性、显示属性
                        selValueProperty.empty();
                        selDisplayProperty.empty();
                        if (data.Properties && data.Properties[selQueryValue]) {
                            var properties = data.Properties[selQueryValue];
                            for (var item in properties) {
                                //值属性
                                $("<option value=\"" + item + "\">" + properties[item] + "[" + item + "]" + "</option>").appendTo(selValueProperty);
                                //显示属性
                                $("<option value=\"" + item + "\">" + properties[item] + "[" + item + "]" + "</option>").appendTo(selDisplayProperty);
                            }
                            //值属性
                            var dataValueField = propertyTable.find(":text[data-property='DataValueField']").val();
                            selValueProperty.val(dataValueField);
                            //显示属性
                            var dataTextField = propertyTable.find(":text[data-property='DataTextField']").val();
                            selDisplayProperty.val(dataTextField);
                        }
                    });
                    selQuery.trigger("change");
                }
            }
        });
    },

    // 文本框正则表达式弹出绑定
    SheetTextBoxRegular: function (control, popupName, description, height, width) {
        PropertyGuide.LigerDialogOpen.call(this,
            {
                control: control,
                loadFun: function () {
                    // 处理加载函数
                    var propertyTable = $(".PropertyTable"); //属性panel

                    var tbSheetTextBoxRegular = $("#tbSheetTextBoxRegular");
                    var $Expression = $($(tbSheetTextBoxRegular).find("tr")[0]).find("input");
                    var $InvalidText = $($(tbSheetTextBoxRegular).find("tr")[1]).find("input");
                    //  $Expression.val($(this).val());
                    $Expression.val(propertyTable.find(":text[data-property='RegularExpression']").val());
                    $InvalidText.val(propertyTable.find(":text[data-property='RegularInvalidText']").val());
                    var selSheetTextBoxRegular = $("#selSheetTextBoxRegular"); //选择模板
                    selSheetTextBoxRegular.empty();

                    $("<option value=\"\">选择模板</option>").appendTo(selSheetTextBoxRegular);
                    //初始化界面
                    $.ajax({
                        type: "POST",
                        async: true,
                        url: PortalRoot + "/MVCDesigner/GetRegularExpression",
                        data: {},
                        dataType: "json",
                        success: function (data) {
                            for (var i = 0; i < data.length; i++) {
                                $("<option value=\"" + data[i].value + "\">" + data[i].text + "</option>").appendTo(selSheetTextBoxRegular);
                            }
                        }
                    });
                    //绑定选择事件
                    $(selSheetTextBoxRegular).unbind("change").bind("change", [this], function (e) {
                        PropertyGuide.SelBoxRegularChange();
                    });
                },
                submitFun: function () {
                    // 处理确定逻辑
                    var propertyTable = $(".PropertyTable"); //属性panel
                    var tbSheetTextBoxRegular = $("#tbSheetTextBoxRegular");
                    //RegularInvalidText
                    var $RegularInvalidText = $($(tbSheetTextBoxRegular).find("tr")[1]).find("input");
                    var invalidTextControl = propertyTable.find(":text[data-property='RegularInvalidText']");
                    var invalidText = $RegularInvalidText.val();
                    if (invalidText.length > 20) {
                        $.H3Dialog.Warn({ content: $.Lang("msgGlobalString.OnlyTwentyCharactersEntered") });
                        return false;
                    } else {
                        invalidTextControl.val(invalidText);
                    }
                    invalidTextControl.trigger("change");
                    //RegularExpression
                    var $RegularExpression = $($(tbSheetTextBoxRegular).find("tr")[0]).find("input");
                    var expressionControl = propertyTable.find(":text[data-property='RegularExpression']");
                    expressionControl.val($RegularExpression.val());
                    expressionControl.trigger("change");
                },
                popupName: popupName,
                description: description,
                height: height,
                width: width
            });
    },

    // 下拉框编码Change事件
    SelBoxRegularChange: function () {
        var tbSheetTextBoxRegular = $("#tbSheetTextBoxRegular");
        var $Expression = $($(tbSheetTextBoxRegular).find("tr")[0]).find("input");     //正则表达式
        var $InvalidText = $($(tbSheetTextBoxRegular).find("tr")[1]).find("input");    //错误提示语

        var selSheetTextBoxRegular = $("#selSheetTextBoxRegular"); //选择模板
        $Expression.val($(selSheetTextBoxRegular).find("option:selected").val());
        $InvalidText.val($(selSheetTextBoxRegular).find("option:selected").text());

    },

    // 配置向导中的数据项统一以下拉框的形式展现
    _getDatafieldSelect: function (controlId) {
        // 当前设置的是否为子表数据项
        var id = controlId.substring(0, controlId.lastIndexOf("_"));
        var isChild = $("#" + id).attr("data-datafield").indexOf(".") > -1;
        if ($("#" + id).attr("data-type")) var isChildGridView = $("#" + id).attr("data-type").indexOf("SheetGridView") > -1;

        //datafieldSelect
        var datafieldSelect = "<select class='datafieldSelect'>";
        // bizObjectFields是在MVCDesigner.aspx.cs中生成的变量
        for (i = 0, len = bizObjectFields.length; i < len ; i++) {
            var bizObjectField = bizObjectFields[i];

            // 非子表数据项不能与子表数据项映射
            if (!isChildGridView && !isChild && bizObjectField.IsChildField == "1") {
                continue;
            }
            // 子表数据项映射只展示子表字段
            if (isChildGridView && bizObjectField.Code.indexOf(".") == -1) {
                continue;
            }
            datafieldSelect += "<option value='" + bizObjectField.Code + "'>" +
                    bizObjectField.Name + "[" + bizObjectField.Code + "]</option>";
        }
        datafieldSelect += "</select>";

        return datafieldSelect;
    },

    SheetUserSetting: function (control, popupName, description, height, width) {
        PropertyGuide.LigerDialogOpen.call(this,
            {
                control: control,
                loadFun: function () {
                    var tbSheetUserSetting = $("#tbSheetUserSetting"),
                        i = 0,
                        len = 0;
                    //清空配置界面
                    tbSheetUserSetting.find("tr:gt(0)").remove();

                    //datafieldSelect
                    var datafieldSelect = PropertyGuide._getDatafieldSelect($(this).attr("id"));

                    //propertySelect
                    var propertyNames = $("#hfPropertyNames").val().split(",").sort();
                    var propertySelect = "<select style='width:90%;' class='propertySelect'>";
                    for (i = 0, len = propertyNames.length; i < len; i++) {
                        propertySelect += "<option>" + propertyNames[i] + "</option>";
                    }
                    propertySelect += "</select>";

                    var tr = "<tr><td style='padding:1px;'>" + datafieldSelect + "</td><td>" + propertySelect + "</td><td><a href='javascript:;'>删除</a></td></tr>"

                    var propertyTable = $(".PropertyTable"); //属性panel
                    var mappingControls = propertyTable.find(":text[data-property='MappingControls']").val().split(",");
                    //根据MappingControls设置的值初始化配置界面
                    for (i = 0, len = mappingControls.length; i < len; i++) {
                        var mappingControl = mappingControls[i].split(":");
                        if (mappingControl.length == 2) {
                            var dataItem = mappingControl[0];
                            var property = mappingControl[1];

                            var $tr = $(tr);
                            tbSheetUserSetting.append($tr);

                            $tr.find(".propertySelect").val(property);
                            $tr.find(".datafieldSelect").val(dataItem);
                            $tr.find("a").click(function () {
                                $(this).closest("tr").remove();
                            });
                        }
                    }

                    //给添加按钮绑定事件
                    var linkAddMapping = $("#linkAddMapping");
                    linkAddMapping.unbind("click").bind("click", function () {
                        var $tr = $(tr);
                        tbSheetUserSetting.append($tr);
                        $tr.find("a").click(function () {
                            $(this).closest("tr").remove();
                        });
                    });

                    //没有数据时，默认显示一条记录
                    if (mappingControls == 0) {
                        linkAddMapping.trigger("click");
                    }
                },
                submitFun: function () {
                    // 处理确定逻辑
                    var tbSheetUserSetting = $("#tbSheetUserSetting");
                    var $trs = tbSheetUserSetting.find("tr:gt(0)");
                    var mappingControls = "";
                    for (var i = 0, len = $trs.length; i < len; i++) {
                        var $tr = $($trs[i]);
                        var dataitem = $tr.find(".datafieldSelect").val();
                        var property = $tr.find(".propertySelect").val();
                        if (dataitem) {
                            mappingControls += dataitem + ":" + property + ",";
                        }
                    }
                    if (mappingControls) {
                        mappingControls = mappingControls.substr(0, mappingControls.length - 1);
                    }
                    var propertyControl = $(".PropertyTable").find(":text[data-property='MappingControls']");
                    propertyControl.val(mappingControls);
                    //需触发change事件，才能保存成功
                    propertyControl.trigger("change");
                },
                popupName: popupName,
                description: description,
                height: height,
                width: width
            });
    },

    SheetTextBoxSetting: function (control, popupName, description, height, width) {
        //debugger;
        PropertyGuide.LigerDialogOpen.call(this,
            {
                control: control,
                loadFun: function () { // 处理加载函数
                    var schemaCode = $(".PropertyTable input:text[data-property='SchemaCode']").val();
                    //数据模型值显示
                    //$("#divSheetTextBoxSetting input[data-property='SchemaCode']").val(schemaCode);
                    $("#divSheetTextBoxSetting input[data-property='SchemaCode']").attr("hidePanel", "1");
                    $("#divSheetTextBoxSetting input[data-property='SchemaCode']").click();

                    if (Designer.PropertyPanel.SelectedControl.attr("data-type") == "SheetAssociation") {
                        $("#trWorkflowSelector").hide();
                    } else {
                        $("#trWorkflowSelector").show();
                    }
                    //__selectorPanel

                    var workflowSelectorWapper = $("#tbSheetTextBoxSetting .WorkflowSelectorWapper");
                    var $bizObjectText = workflowSelectorWapper.find("input:text").eq(0);
                    var $bizObjectHidden = workflowSelectorWapper.next("input[type='hidden']");

                    // 从后台获取数据模型的显示名称
                    $.get(PortalRoot + "/MVCDesigner/GetBizObjectFullName", {
                        "SchemaCode": schemaCode,
                        "IsDisplayCode": $bizObjectText.attr("isdisplaycode")
                    }, function (data) {
                        $bizObjectText.val(data);
                    });

                    $bizObjectHidden.val(schemaCode);
                    // 将当前设置的控件id保存起来，用于后续判断是否为子表数据项
                    PropertyGuide.currentControlId = $(this).attr("id");
                    PropertyGuide.SheetTextBoxSchemaChange(schemaCode);
                },
                submitFun: function () {
                    // 处理确定逻辑
                    var propertyTable = $(".PropertyTable"); //属性panel
                    //SchemaCode
                    var $bizObjectHidden = $("#tbSheetTextBoxSetting .WorkflowSelectorWapper").next("input[type='hidden']");
                    var schemaCodeControl = propertyTable.find(":text[data-property='SchemaCode']");
                    schemaCodeControl.val($bizObjectHidden.val());
                    schemaCodeControl.trigger("change");
                    //QueryCode
                    var queryCodeControl = propertyTable.find(":text[data-property='QueryCode']");
                    queryCodeControl.val($("#selSheetTextBoxQuery").val());
                    queryCodeControl.trigger("change");

                    //InputMappings
                    var trInputMappings = $("#tbInputMappings").find("tr:gt(0)");
                    var inputMappings = PropertyGuide.SheetTextBoxGetMappingString(trInputMappings);
                    var inputMappingsControl = propertyTable.find(":text[data-property='InputMappings']");
                    inputMappingsControl.val(inputMappings);
                    inputMappingsControl.trigger("change");

                    //OutputMappings
                    var outputMappings = "";
                    var trOutputMappings = $("#tbOutputMappings").find("tr:gt(0)");
                    for (var i = 0, len = trOutputMappings.length; i < len; i++) {
                        $trOutputMapping = $(trOutputMappings[i]);
                        var dataItem = $trOutputMapping.find(".datafieldSelect").val();
                        if (dataItem) {
                            var property = $trOutputMapping.find(".propertySelect").val();
                            outputMappings += (dataItem + ":" + property + ",");
                        }
                    }
                    if (outputMappings) { outputMappings = outputMappings.substr(0, outputMappings.length - 1); }
                    var outputMappingsControl = propertyTable.find(":text[data-property='OutputMappings']");
                    outputMappingsControl.val(outputMappings);
                    outputMappingsControl.trigger("change");
                },
                popupName: popupName,
                description: $("#divSheetTextBoxSetting").attr("title"),
                height: height,
                width: width
            });
    },
    SheetTextBoxGetMappingString: function ($tr) {
        var mappings = "";
        for (var i = 0, len = $tr.length; i < len; i++) {
            var tds = $($tr[i]).find("td");
            var propertyName = $(tds[0]).attr("code");
            var dataItemCode = $(tds[1]).find("select").val();
            if (dataItemCode) {
                mappings += dataItemCode + ":" + propertyName + ",";
            }
        }
        if (mappings) {
            mappings = mappings.substr(0, mappings.length - 1);
        }
        return mappings;
    },
    SheetTextBoxSchemaChange: function (schemaCode) {
        //debugger;
        var selQuery = $("#selSheetTextBoxQuery"); //查询列表
        var tbInputMappings = $("#tbInputMappings"); //InputMappings
        var tbOutputMappings = $("#tbOutputMappings"); //InputMappings
        //清空值
        selQuery.empty();
        selQuery.val("");
        tbInputMappings.find("tr:gt(0)").remove();
        tbOutputMappings.find("tr:gt(0)").remove();

        //OutputMappings的添加按钮默认隐藏
        tbOutputMappings.find("tr:eq(0) a").hide();

        if (!schemaCode) { return; }

        //异步取数，初始化界面
        $.ajax({
            type: "POST",
            async: true,
            url: PortalRoot + "/MVCDesigner/GetBizObjectSchema",
            data: { SchemaCode: schemaCode },
            dataType: "json",
            success: function (data) {
                var propertyTable = $(".PropertyTable"); //属性panel
                if (data.BizQueries) {
                    //给查询select添加option
                    for (var item in data.BizQueries) {
                        $("<option value=\"" + item + "\">" + data.BizQueries[item] + "[" + item + "]" + "</option>").appendTo(selQuery);
                    }

                    var datafieldSelect = PropertyGuide._getDatafieldSelect(PropertyGuide.currentControlId);

                    //从属性panel中获取值赋值给查询select
                    var queryCode = propertyTable.find(":text[data-property='QueryCode']").val();
                    selQuery.val(queryCode);
                    //给查询select绑定change事件处理程序
                    selQuery.unbind("change").bind("change", function () {
                        //清空tbInputMappings
                        tbInputMappings.find("tr:gt(0)").remove();
                        var selQueryValue = $(this).val();
                        if (data.QueryItems && data.QueryItems[selQueryValue]) {
                            //InputMappings
                            var inputMappingString = propertyTable.find(":text[data-property='InputMappings']").val();
                            var inputMappingItems = PropertyGuide.SheetTextBoxGetMappingObj(inputMappingString);

                            var queryItems = data.QueryItems[selQueryValue];
                            var visible = data.Visible[selQueryValue];
                            for (var queryItemCode in queryItems) {
                                if (visible[queryItemCode]) {
                                    //InputMappings
                                    var $tr = $("<tr><td code='" + queryItemCode + "'>" + queryItems[queryItemCode] + "[" + queryItemCode + "]</td><td style='padding:1px;'>" +
                                        datafieldSelect + "</td></tr>");
                                    $tr.find("select").val(inputMappingItems[queryItemCode] ? inputMappingItems[queryItemCode] : "");

                                    tbInputMappings.append($tr);
                                }
                            }
                        }

                        //清空tbOutputMappings
                        tbOutputMappings.find("tr:gt(0)").remove();
                        //OutputMappings添加按钮
                        var linkAddMapping = tbOutputMappings.find("tr:eq(0) a");
                        linkAddMapping.hide();
                        //根据查询code从Properties中得到该查询的显示属性
                        if (data.Properties && data.Properties[selQueryValue]) {
                            //propertySelect
                            var propertyNames = data.Properties[selQueryValue];
                            var propertySelect = "<select style='width:90%;' class='propertySelect'>";
                            for (var item in propertyNames) {
                                propertySelect += "<option value='" + item + "'>" + propertyNames[item] +
                                    "[" + item + "]" + "</option>";
                            }
                            propertySelect += "</select>";

                            var tr = "<tr><td>" + propertySelect + "</td><td style='padding:1px;'>" +
                                datafieldSelect + "</td><td><a href='javascript:;'>" + $.Lang("GlobalButton.Delete") + "</a></td></tr>"

                            //OutputMappings
                            var outputMappingItems = propertyTable.find(":text[data-property='OutputMappings']").val().split(",");
                            //根据outputMappingItems的值初始化配置界面
                            for (var i = 0, len = outputMappingItems.length; i < len; i++) {
                                var outputMappingItem = outputMappingItems[i].split(":");
                                if (outputMappingItem.length == 2) {
                                    var dataItem = outputMappingItem[0];
                                    var property = outputMappingItem[1];

                                    var $tr = $(tr);
                                    tbOutputMappings.append($tr);
                                    $tr.find(".propertySelect").val(property);
                                    $tr.find(".datafieldSelect").val(dataItem);
                                    $tr.find("a").click(function () {
                                        $(this).closest("tr").remove();
                                    });
                                }
                            }

                            linkAddMapping.show();
                            //给添加按钮绑定事件
                            linkAddMapping.unbind("click").bind("click", function () {
                                var $tr = $(tr);
                                tbOutputMappings.append($tr);
                                $tr.find("a").click(function () {
                                    $(this).closest("tr").remove();
                                });
                            });

                            //没有数据时，默认显示一条记录
                            if (outputMappingItems == 0) {
                                linkAddMapping.trigger("click");
                            }
                        }
                    });
                    //触发查询的change事件
                    selQuery.trigger("change");
                }
            }
        });
    },
    SheetTextBoxGetMappingObj: function (mappingString) {
        var mappingItems = {};
        var mappings = mappingString.split(",");
        for (var i = 0, len = mappings.length; i < len; i++) {
            var mappingItem = mappings[i].split(":");
            if (mappingItem.length == 2) {
                var dataitem = mappingItem[0];
                var property = mappingItem[1];
                mappingItems[property] = dataitem;
            }
        }
        return mappingItems;
    },

    ComputationRule: function (control, popupName, description, height, width) {
        PropertyGuide.LigerDialogOpen.call(this,
            {
                control: control,
                loadFun: function () {
                    // 处理加载函数
                    var rule = $(this).val();

                    var place = parseInt(rule.substr(0, rule.indexOf(",")));
                    if (place) {
                        //将rule部分的小数位数截取掉
                        rule = rule.substring(rule.indexOf(",") + 1, rule.length);
                        //小数位数最大支持9位
                        if (place > 9) { place = 9; }
                        if (place < 1) { place = ""; }
                        $("#selectDecimalPlace").val(place);
                    }
                    else {
                        $("#selectDecimalPlace").val("");
                    }
                    $("#txtComputationRule").val(rule);
                },
                submitFun: function () {
                    var rule = $("#txtComputationRule").val();
                    var ruleplace = parseInt(rule.substr(0, rule.indexOf(",")));
                    var ruletext = "";
                    //在rule里输入了小数位数
                    if (ruleplace) {
                        if (ruleplace > 9) { ruletext += "9,"; }
                        else if (ruleplace > 0) { ruletext += ruleplace + ","; }
                        ruletext += rule.substring(rule.indexOf(",") + 1, rule.length);
                    }
                    else {
                        var place = $("#selectDecimalPlace").val();
                        if (place) {
                            ruletext += place + ",";
                        }
                        ruletext += rule;
                    }
                    var propertyTable = $(".PropertyTable"); //属性panel
                    var computationRule = propertyTable.find(":text[data-property='ComputationRule']");
                    computationRule.val(ruletext);
                    computationRule.trigger("change");
                },
                popupName: popupName,
                description: description,
                height: height,
                width: width
            });
    }
}