var GetSelectedBizObjectId = function () {
    var selectedRows = $("input[name=selectRow][type=radio]").filter(function () { return $(this).prop("checked"); }).parents("tr:first");
    if (selectedRows.length > 0) {
        return selectedRows.find("input[name=selectRow][type=radio]:first").attr("bizObjectId");
    }
    else {
        return;
    }
}
var LangData = {
    CallFail: $.Lang("BizQuery.CallFail")
};
var DoInvokeMethod = function (methodName, displayName, bizObjectId) {
    $.ajax({
        type: "post",
        url: BizObjectHandlerUrl,
        cache: false,
        async: false,
        dataType: "json",
        data: {
            bizSchemaCode: SchemaCode,
            bizObjectID: bizObjectId,
            methodName: methodName
        },
        success: function (result) {
            if (result == "PortalSessionOut") {
                //显示或者打开登录对话框
                var loginWin = top.$.ligerui.get('LoginWinID');
                if (loginWin) {
                    loginWin.show();
                }
                else {
                    loginWin = top.$.ligerDialog.open({
                        id: 'LoginWinID',
                        url: LoginUrl,
                        isHidden: false,
                        width: top.$('body').outerWidth(true),
                        height: top.$('body').outerHeight(true) + 20,
                        onClosed: function () {
                            location.reload();
                        }
                    });
                }
                loginWin.hideTitle();
                return;
            }

            if (result.Result) {
                if (result.NeedRefresh) {
                    //方法执行成功后刷新页面
                    location.reload();
                }
                else {
                    $.H3Dialog.Success({ content: (displayName || methodName) + "执行完成" });
                }
            }
            else {
                var content = "[" + displayName + "]";
                content += LangData.CallFail;
                if (result.Errors) {
                    content += ":";
                    content += $.Lang(result.Errors[0]);
                }
                $.H3Dialog.Error({ content: content });
            }
        },
        error: function (msg) {
            var content = "调用失败:";
            if (msg.status == "500") {
                content += "服务器内部错误";
            }
            else {
                content += msg.statusText;
            }
            $.H3Dialog.Error({ content: content });
        }
    });
}

var InvokeMethod = function (methodName, displayName, ifConfirm) {
    var bizObjectId = GetSelectedBizObjectId();
    if (bizObjectId) {
        //调用方法业务对象(ID为bizObjectId)的方法(methodName)
        if (ifConfirm) {
            $.ligerDialog.confirm("将执行方法[" + displayName + "]?", function (result) {
                if (result) {
                    DoInvokeMethod(methodName, displayName, bizObjectId);
                }
            })
        }
        else {
            DoInvokeMethod(methodName, displayName, bizObjectId);
        }
    }
    else {
        //请选择
        $.H3Dialog.Warn({ content: "请选择一项" });
    }
}

var OpenSheet = function (sheetCode, ifWithID, afterSave) {
    if (ifWithID) {
        var bizObjectId = GetSelectedBizObjectId();
        if (bizObjectId) {
            //打开表单,参数包含BizObjectID
            window.open(EditBizObjectUrl + "?" + Param_BizObjectID + "=" + bizObjectId + "&" + Param_SchemaCode + "=" + SchemaCode + "&SheetCode=" + sheetCode + "&Mode=Work&AfterSave=" + (isNaN(afterSave) ? "" : afterSave));
        }
        else {
            $.H3Dialog.Warn({ content: "请选择一项" });
            return;
        }
    }
    else {
        //打开表单,参数不包含BizObjectID,即可新建
        window.open(EditBizObjectUrl + "?SheetCode=" + sheetCode + "&Mode=Originate&" + Param_SchemaCode + "=" + SchemaCode + "&AfterSave=" + (isNaN(afterSave) ? "" : afterSave));
    }
}

//行集合 : <ObjectID,Data>
var CurrentRows = {};
var OpenUrl = function (url, ifWithID) {
    var bizObjectId = GetSelectedBizObjectId();
    if (bizObjectId) {
        url = url.replace(/{BizObjectID}/g, bizObjectId).replace(/{BizObjectSchemaCode}/g, SchemaCode).replace(/{SchemaCode}/g, SchemaCode).replace(/{BizObjectID}/g, bizObjectId);
        //参数: 业务对象ID
        if (CurrentRows[bizObjectId] && url.match(/{[_A-z0-9]+}/g)) {
            $(url.match(/{[_A-z0-9]+}/g)).each(function () {
                var p = this.match(/[_A-z0-9]+/);
                url = url.replace(this, CurrentRows[bizObjectId][p] || "");
            });
        }
    }
    else if (url.indexOf("{") > -1 && url.indexOf("}") > -1 && url.indexOf("{") < url.indexOf("}")) {
        //请选择
        $.H3Dialog.Warn({ content: "请选择一项" });
        return;
    }
    else {
        window.open(url);
    }
}

var radioLoaded = false;
var checkLoaded = false;
function GetColumns() {
    debugger;
    var columns = GirdColumns || [];
    if (!radioLoaded && typeof (ActionVisible) != "undefined" && ActionVisible) {
        radioLoaded = true;
        if (window.location.href.toLowerCase().indexOf("listmasterdatamultiple.html") > -1) {
            checkLoaded = true;
        }
        if (window.location.href.toLowerCase().indexOf("listmasterdata.aspx") == -1 && !checkLoaded) {
            columns.splice(0, 0, {
                display: "选择",
                width: "40",
                render: function (row, rowindex, value) {
                    return "<div style='padding:5px;float:left;'><input type='radio' bizObjectId='" + row.ObjectID + "' name='selectRow' value='" + rowindex + "'></div>";
                }
            });
        }
    }
    if (typeof ("CustomColumns") != "undefined" && CustomColumns.length) {
        for (var i = 0; i < CustomColumns.length; i++) {
            columns.push(CustomColumns[i]);
        }
    }
    for (var i = 0; i < columns.length; i++) {
        columns[i].resizable = false;//禁止resize列
        if (columns[i].type == "HyperLink" || columns[i].type == "TimeSpan") {
            columns[i].isSort = false;
        }
    }
    return columns;
}

var BuildPage = function (forceToFresh) {
    if (forceToFresh) {
        DocumentReady(forceToFresh);
    } else {
        DocumentReady();
    }

    //$(".H3Panel").BuildPanel({ leftSpace: false, excludeIDs: ["excludePanel"] });
    $(".l-toolbar-item").css("width", "auto");
    //$(".l-toolbar-item:gt(0)").css("width", "auto");
    //$(".l-toolbar-item:eq(0)").css("width", "80px")
}

//重新加载LigerUI数据
var ReloadData = function () {
    masterDataGridManager.reload();
}

var LoadData = function () {
    var _url = Controller;
    var pageSize = 10;
    if (document.getElementById("hfPageSize")) {
        pageSize = $("#hfPageSize").val();
    }
    debugger;
    masterDataGridManager = $("#masterDataGrid").ligerGrid({
        columns: GetColumns(),
        parms: GridParam,
        //data:GridData,
        width: "100%",
        pageSizeOptions: [5, 10, 15, 20, 50, 100],
        height: "100%",
        headerRowHeight: "30",
        url: _url,
        dataAction: 'server', //服务器排序
        usePager: true,       //服务器分页
        pageSize: pageSize,
        pageParmName: "PageIndex",
        pagesizeParmName: "PageSize",
        rownumbers: true,
        //sortname: "CreatedTime",
        //sortorder: "Asc", 
        //rownumbersColWidth: "40",
        columnWidth: "auto",
        mouseoverRowCssClass: isReturn ? "l-grid-row-over cursor-pointer" : "l-grid-row-over",
        onBeforeShowData: function (a, b, c) {
            if (a && a.Rows) {
                $(a.Rows).each(function (index) {
                    if (this) {
                        var row = this;
                        for (var p in this) {
                            if (row[p] === 0) {
                                row[p] = "0";
                            }
                            //时间格式
                            if (typeof (row[p]) == "string" && row[p].match(/^\/Date\(\-*[0-9]+\)\/$/)) {
                                var d = new Date();
                                var dateValue = parseFloat(row[p].match(/\-*[0-9]+/)[0]);
                                if (parseInt(dateValue) > 0) {
                                    d.setTime(dateValue);
                                    if (typeof (DisplayFormats) != "undefined" && DisplayFormats && DisplayFormats[p]) {
                                        row[p] = d.format(DisplayFormats[p]);
                                    } else {
                                        row[p] = d.format("yyyy/MM/dd hh:mm:ss");
                                    }
                                }
                                else {
                                    row[p] = "";
                                }
                            } //格式转换
                            else {
                                if (typeof (DisplayFormats) != "undefined" && DisplayFormats && DisplayFormats[p]) {
                                    var val = DisplayFormats[p];
                                    var matches = DisplayFormats[p].match(/{[A-z]+[A-z0-9]*}/g);
                                    if (matches) {
                                        $(matches).each(function () {
                                            var _propertyName = this.match(/[A-z]+/)[0];
                                            if (row[_propertyName]) {
                                                row[p] = val.replace(this, row[_propertyName]);
                                            }
                                            else {
                                                row[p] = val.replace(this, "");
                                            }
                                        });
                                    }
                                    //row[p] = val;
                                }
                            }
                        }
                        if (row.ObjectID) {
                            CurrentRows[row.ObjectID] = row;
                        }
                    }
                });
            }
        },
        onSelectRow: function (data, a, b) {
            $(b.children[0]).find("input[type=radio]").click();
        },
        onAfterShowData: function () {
            if (GirdColumns) {
                $(".l-grid2 .l-grid-body-table tr").each(function (k, v) {
                    $(this).children().each(function (k, v) {
                        $(v).children().css("margin", "0");
                        $(v).find("div:first").width(GirdColumns[k].width);
                    })
                });

                //ligergrid框架bug。当表项太少没有滚动条的时候，头部多一空行。
                var width1 = $("#masterDataGridgrid .l-grid2 .l-grid-body-inner").width();
                var width2 = $("#masterDataGridgrid .l-grid2 .l-grid-body-inner .l-grid-body-table").width();
                if ($(".l-grid-header-table td:last").html() == "" && width1 == width2) {
                    $(".l-grid-header-table td:last").remove();
                    masterDataGridManager.refreshSize();
                }

                $(".l-grid-header-table td").not(":first").not(":last").each(function (k, v) {
                    $(v).find("div:first").width(GirdColumns[k].width);
                });
            }
            $(".l-toolbar-item:eq(0)").css("width", "auto");
            var placeDiv=$("<div class='l-jplace'></div>")
            $(".l-grid1 .l-grid-body1").append(placeDiv);
            //nicescroll
            $("#masterDataGrid .l-grid-body.l-grid-body2.l-scroll").niceScroll({ cursorcolor: "#37ABFD", cursoropacitymax: 0.7, boxzoom: true, touchbehavior: false, boxzoom: false }).resize();

        },
        onDblClickRow: function (data, rowid, rowdata) {
            if (!isReturn) return;
            var maps = outputPropertyMappings.split("|");
            var resultItem = {};
            for (var i = 0; i < maps.length; i++) {
                if (maps[i].length == 0) continue;
                var itemName = maps[i].split(',')[0];
                var propertyName = maps[i].split(',')[1];
                var propertyArray = propertyName.split(';');//关联表单需要一个控件绑定两个值
                if (data[propertyName] && data[propertyName].toString().indexOf("EditUser.html&Mode=View&ID=") > -1) {
                    // 仅支持参与者单人情况
                    if (data[propertyName].toString().indexOf("EditUser.html&Mode=View&ID=") > -1) {
                        resultItem[itemName] = data[propertyName].split("EditUser.html&Mode=View&ID=")[1].split("'")[0];
                    }

                } else {
                    if (propertyArray.length > 0) {
                        var dataArry = [];
                        for (var j = 0; j < propertyArray.length; j++) {
                            var reg = /<[^>]+>/g;
                            //如果数据项含有html标签则只取其text()
                            if (data[propertyArray[j]] && reg.test(data[propertyArray[j]])) {
                                dataArry[j] = $(data[propertyArray[j]]).text();
                                reg.lastIndex = 0;
                            }
                            else {
                                dataArry[j] = data[propertyArray[j]];
                            }
                        }
                        resultItem[itemName] = dataArry;
                    } else {
                        resultItem[itemName] = data[propertyName];
                    }
                }
            }
            //新开窗查询模式
            if (sourceObj && p[sourceObj[0].id].ListMasterCallBack) {
                p[sourceObj[0].id].ListMasterCallBack(resultItem);
                if (p.ListMasterCallBack) p.ListMasterCallBack(sourceObj);
            }
            else {
                //兼容旧开窗查询模式
                $.each(resultItem, setParentControlValue);
                if (p.ListMasterCallBack) p.ListMasterCallBack(sourceObj);
                isFrame ? window.parent.$('#' + CtrlID + '_MasterData').hide() : window.close();
            }
        }
    });

    $(".tableList").css("table-layout", "fixed");

}

var resultItemM = [];

// GridView批量ligerGrid
var LoadGridViewData = function () {
    var _url = Controller;
    var pageSize = 10;
    if (document.getElementById("hfPageSize")) {
        pageSize = $("#hfPageSize").val();
    }
    masterDataGridManager = $("#masterDataGrid").ligerGrid({
        columns: GetColumns(),
        parms: GridParam,
        //data:GridData,
        width: "100%",
        pageSizeOptions: [3, 5, 10, 15, 20, 50, 100],
        height: "98%",
        headerRowHeight: "30",
        url: _url,
        dataAction: 'server', //服务器排序
        usePager: true,       //服务器分页
        pageSize: pageSize,
        pageParmName: "PageIndex",
        pagesizeParmName: "PageSize",
        rownumbers: true,
        checkbox: true,
        //sortname: "CreatedTime",
        //sortorder: "Asc",
        rownumbersColWidth: "40",
        columnWidth: "auto",
        mouseoverRowCssClass: isReturn ? "l-grid-row-over cursor-pointer" : "l-grid-row-over",
        onBeforeShowData: function (a, b, c) {
            if (a && a.Rows) {
                $(a.Rows).each(function (index) {
                    if (this) {
                        var row = this;
                        for (var p in this) {
                            //时间格式
                            if (typeof (row[p]) == "string" && row[p].match(/^\/Date\(\-*[0-9]+\)\/$/)) {
                                var d = new Date();
                                var dateValue = parseFloat(row[p].match(/\-*[0-9]+/)[0]);
                                if (parseInt(dateValue) > 0) {
                                    d.setTime(dateValue);
                                    if (typeof (DisplayFormats) != "undefined" && DisplayFormats && DisplayFormats[p]) {
                                        row[p] = d.format(DisplayFormats[p]);
                                    } else {
                                        row[p] = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

                                    }
                                }
                                else {
                                    row[p] = "";
                                }
                            } //格式转换
                            else {
                                if (typeof (DisplayFormats) != "undefined" && DisplayFormats && DisplayFormats[p]) {
                                    var val = DisplayFormats[p];
                                    var matches = DisplayFormats[p].match(/{[A-z]+[A-z0-9]*}/g);
                                    if (matches) {
                                        $(matches).each(function () {
                                            var _propertyName = this.match(/[A-z]+/)[0];
                                            if (row[_propertyName]) {
                                                row[p] = val.replace(this, row[_propertyName]);
                                            }
                                            else {
                                                row[p] = val.replace(this, "");
                                            }
                                        });
                                    }
                                    //row[p] = val;
                                }
                            }
                        }
                    }
                });
            }
        },
        onBeforeCheckAllRow: function (checked, element) {
            // 数据清空
           resultItemM = [];
        },
        onAfterShowData: function () {
            $(".l-toolbar-item").css("width", "auto");
            var row = $(".l-grid1 .l-grid-header1 .l-grid-hd-row");
            if ($(".l-grid1 .l-grid-body1 .l-grid-row").length === $(".l-grid1 .l-grid-body1 .l-grid-row.l-selected").length) {
                var uncheck = row.hasClass("l-checked");
                if (!uncheck) {
                    row.addClass("l-checked");
                } 
            } else {
                row.removeClass("l-checked");
            }
            var placeDiv = $("<div class='l-jplace'></div>")
            $(".l-grid1 .l-grid-body1").append(placeDiv);
        },
        onSelectRow: function (data, a, b) {
            //$(b.children[0]).find("input[type=checkbox]").click();
            if (!isReturn) return;
            var maps = outputPropertyMappings.split("|");
            var resultItem = {};
            for (var i = 0; i < maps.length; i++) {
                if (maps[i].length == 0) continue;
                var itemName = maps[i].split(',')[0];
                resultItem[itemName] = GetResultItem(maps[i], data);
            }
            resultItemM.push(resultItem)
        },
        onUnSelectRow: function (data, a, b) {
            var maps = outputPropertyMappings.split("|");
            for (var j = 0; j < resultItemM.length; j++) {
                var isSelected = ItemIsSelected(maps, data, j);
                if (isSelected) {
                    resultItemM.splice(j, 1);
                    break;
                }
            }
        },
    });

    $(".tableList").css("table-layout", "fixed");
}

var ItemIsSelected = function (maps, data, index) {
    var count = 0;
    for (var i = 0; i < maps.length; i++) {
        if (maps[i].length == 0) continue;
        var itemName = maps[i].split(',')[0];
        var propertyData = GetResultItem(maps[i], data);
        if (resultItemM[index] && resultItemM[index][itemName].toString() === propertyData.toString()) {
            count++;
        }
    }
    if (count == maps.length) {
        return true;
    }
    return false;
}
var GetResultItem = function (map, data) {
    var itemName = map.split(',')[0];
    var propertyName = map.split(',')[1];
    var propertyArray = propertyName.split(';');//关联表单需要一个控件绑定两个值
    if (data[propertyName] && data[propertyName].toString().indexOf("EditUser.html&Mode=View&ID=") > -1) {
        // 仅支持参与者单人情况
        return data[propertyName].split("EditUser.html&Mode=View&ID=")[1].split("'")[0];
    } else {
        if (propertyArray.length > 0) {
            var dataArry = [];
            for (var j = 0; j < propertyArray.length; j++) {
                var reg = /<[^>]+>/g;
                if (data[propertyArray[j]] && reg.test(data[propertyArray[j]])) {
                    dataArry[j] = $(data[propertyArray[j]]).text();
                    reg.lastIndex = 0;
                }
                else {
                    dataArry[j] = data[propertyArray[j]];
                }
            }
            return dataArry;
        } else {
            return data[propertyName];
        }
    }
}

// 设置控件的值
var setParentControlValue = function (k, v) {
    if (!sourceObj.find) sourceObj = $(sourceObj);
    if (sourceObj.length > 0) {
        if (Object.prototype.toString.call(sourceObj) == "[Object Array]")
            setControlValueByDataField(sourceObj[0], k, v);
        else
            setControlValueByDataField(sourceObj, k, v);
    }
}

// 查找离源控件最近的DataField控件
var setControlValueByDataField = function (startObj, dataField, value) {
    var ctl = $(startObj).find("input[datafield='" + dataField + "'],textarea[datafield='" + dataField + "'],select[datafield='" + dataField + "']");
    if (ctl.length > 0) {
        if (ctl.attr("type") == "checkbox") {
            ctl.attr("checked", value);
        }
        else {
            ctl.val(value);
        }
        return;
    }
    var ctl = $(startObj).find("input[id='" + dataField + "'],textarea[id='" + dataField + "'],select[id='" + dataField + "']");
    if (ctl.length > 0) {
        if (ctl.attr("type") == "checkbox") {
            ctl.attr("checked", value);
        }
        else {
            ctl.val(value);
        }
        return;
    }
    ctl = $(startObj).find("span[datafield='" + dataField + "'],span[id='" + dataField + "']");
    if (ctl.length > 0) {
        ctl.html(value);
        return;
    }
    ctl = $(startObj).find("table[datafield='" + dataField + "'],table[id='" + dataField + "']");
    if (ctl.length > 0) {
        ctl.find("input[value='" + value + "']").attr("checked", "checked");
        return;
    }
    startObj = $(startObj).parent();
    if ($(startObj).is("body")) return null;
    return setControlValueByDataField(startObj, dataField, value);
};

var _IsDocumentReady = false;
function DocumentReady(forceToFresh) {
    console.log('DocumentReady');
    if (_IsDocumentReady && !forceToFresh) {
        return;
    }
    _IsDocumentReady = true;
    //是否在前台母版页中 ,  // #query-btn-group是前台母版页中的工具栏ID
    var _IsInMasterPage = $("#query-btn-group").length > 0;
    //初始化按钮
    if (typeof (BizQueryActions) != "undefined" && BizQueryActions) {
        console.log("BizQueryActions");
        $("#RunQueryToolBar").empty();
        var actions = "";

        //系统默认按钮特殊处理
        for (var i in BizQueryActions) {
            if (BizQueryActions[i].DisplayName == "GlobalButton.Edit") {
                BizQueryActions[i].DisplayName = $.Languages.GlobalButton.Edit;
            } else if (BizQueryActions[i].DisplayName == "GlobalButton.Remove") {
                BizQueryActions[i].DisplayName = $.Languages.GlobalButton.Remove;
            } else if (BizQueryActions[i].DisplayName == "GlobalButton.Add") {
                BizQueryActions[i].DisplayName = $.Languages.GlobalButton.Add;
            }
        }

        if (_IsInMasterPage) {
            $(BizQueryActions).each(function () {
                if (this.Visible == 0) {
                    return;
                }
                var action = "";
                //执行动作
                if (this.ActionType == "0") {
                    actions += "<a href='javascript:void(0);' data-icon='" + this.Icon + "' class='btn btn-default' onclick='InvokeMethod(\"" + this.BizMethodName + "\",\"" + this.DisplayName + "\"," + (this.Confirm == "1" ? true : false) + ")'>" + this.DisplayName + "</a>";
                }
                    //打开表单
                else if (this.ActionType == "1") {
                    actions += "<a href='javascript:void(0);' data-icon='" + this.Icon + "' class='btn btn-default' onclick='OpenSheet(\"" + this.BizSheetCode + "\"," + (this.WithID == "1" ? true : false) + "," + this.AfterSave + ")'>" + this.DisplayName + "</a>";
                }
                    //打开链接
                else {
                    actions += "<a href='javascript:void(0);' data-icon='" + this.Icon + "' class='btn btn-default' onclick='OpenUrl(\"" + this.Url + "\"," + (this.WithID == "1" ? true : false) + ")'>" + this.DisplayName + "</a>";
                };
            });
            $("#query-btn-group").append(actions);
        }
        else {
            console.log(BizQueryActions);
            $(BizQueryActions).each(function () {
                debugger
                if (this.Visible == 0) {
                    return;
                }
                var action = "";
                //执行动作
                if (this.ActionType == "0") {
                    actions += "<div><a href='javascript:void(0);' data-icon='" + this.Icon + "' style='text-align:left;' onclick='InvokeMethod(\"" + this.BizMethodName + "\",\"" + this.DisplayName + "\"," + (this.Confirm == "1" ? true : false) + ")' >" + this.DisplayName + "</a></div>";
                }
                    //打开表单
                else if (this.ActionType == "1") {
                    actions += "<div><a href='javascript:void(0);' data-icon='" + this.Icon + "' style='text-align:left;' onclick='OpenSheet(\"" + this.BizSheetCode + "\"," + (this.WithID == "1" ? true : false) + "," + this.AfterSave + ")'>" + this.DisplayName + "</a></div>";
                }
                    //打开链接
                else {
                    actions += "<div><a href='javascript:void(0);' data-icon='" + this.Icon + "' style='text-align:left;' onclick='OpenUrl(\"" + this.Url + "\"," + (this.WithID == "1" ? true : false) + ")'>" + this.DisplayName + "</a></div>";
                };
            });
            $("#RunQueryToolBar").append(actions);
            //$("#H3ToolBar").append(actions);
            //$("#H3ToolBar").AspLinkToolBar();
        }
    };
}
//获取Grid查询参数
function GetGridParam() {
    //TODO 获取查询条件以及查询条件的值
    var filter = GetFilterData();
    if (filter)
        GridParam['FilterStr'] = JSON.stringify(filter);
    return GridParam;
}

//渲染查询条件
function BuildFilter(isFrame) {
    var inputParams = {};
    if (inputMappings) {
        var inputs = inputMappings.split("|");
        if (inputs && inputs.length > 0) {
            for (var i = 0; i < inputs.length; i++) {
                var key = inputs[i].split(",")[0];
                var value = inputs[i].split(",")[1];
                inputParams[key] = value;
            }

            for (var key in inputParams) {
                for (var i = 0; i < FilterData.length; i++) {
                    if (FilterData[i].PropertyCode == key) {
                        FilterData[i].DefaultValue = inputParams[key];
                    }
                }
            }
        }
    }
    var tableSearchHtml = '';
    if (FilterData && FilterData.length > 0) {
        for (var i = 0; i < FilterData.length; i++) {
            if (FilterData[i].PropertyName == "") {
                break;//当数据项被删除并且发布以后，里面仍然把该数据存在
            }

            if (i % 2 == 0 || isFrame) {

                tableSearchHtml += AddFilterItem(FilterData[i]);
                if (i > FilterData.length) {
                    tableSearchHtml += '</div>';
                }
            } else {
                tableSearchHtml += AddFilterItem(FilterData[i]);

            }
        }
    }
    $("#tableSearch").html(tableSearchHtml);
    BuildDivUser();
    ValidateRange();
}

//生成查询条件添加至查询条件表格
function AddFilterItem(obj) {
    var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
    if (array.indexOf(obj.PropertyName) != -1) {
        obj.PropertyName = $.Lang("BizQuery.Propertys." + obj.PropertyName);
    }
    var filterItem = '<div class="conditionRow"><label  class="tableLeft">' + obj.PropertyName + '</label>';
    switch (obj.DisplayType) {
        case 0://文本框
            filterItem += GetFilterInputText(obj.LogicType, obj.PropertyCode, obj.FilterType, obj.DefaultValue);
            break;
        case 5://选人控件
            filterItem += GetFilterUser(obj.PropertyCode, obj.DefaultValue);
            break;
        default://其他
            filterItem += GetFilterInput(obj.SelectedValues, obj.PropertyCode, obj.DisplayType, obj.DefaultValue);
            break;

    }
    filterItem += '</div>';
    return filterItem;
}

//生成checkBox,select,radio控件
function GetFilterInput(valuesArray, code, type, defaultValue) {
    var filterInput = '<td>';
    if (type === 1) {
        filterInput += '<select name="' + code + '">';
    }
    if (valuesArray) {
        var defaultValueArray = [];
        if (defaultValue) {
            defaultValueArray = defaultValue.split(';');
        }
        for (var i = 0; i < valuesArray.length; i++) {
            var checked = "";
            switch (type) {
                case 1://下拉框
                    if (valuesArray[i].Value == defaultValue) {
                        checked = "selected";
                    }
                    filterInput += '<option value="' + valuesArray[i].Value + '" ' + checked + '>' + valuesArray[i].Text + '</option>'
                    break;
                case 2://单选框
                    if (valuesArray[i].Value == defaultValue) {
                        checked = "checked";
                    }
                    filterInput += '<label><input name="' + code + '" type="radio" value="' + valuesArray[i].Value + '"  ' + checked + ' /> ' + valuesArray[i].Value + '</label>';
                    break;
                case 3://复选框
                    $.each(defaultValueArray, function (j, v) {
                        if (valuesArray[i].Value == v) {
                            checked = "checked";
                        }
                    })
                    filterInput += '<label><input name="' + code + '" type="checkbox" value="' + valuesArray[i].Value + '" ' + checked + '/> ' + valuesArray[i].Value + '</label>';
                    break;
            }
        }
    }
    if (type === 1) {
        filterInput += '</select>';
    }
    filterInput += '</td>';
    return filterInput;
}

//生成普通文本,时间控件
function GetFilterInputText(logicType, code, filterType, defaultValue) {
    var filterInput = '<td>';
    switch (logicType) {
        case "DateTime":
            if (filterType === 2) {
                filterInput += '<input name="' + code + '" type="text" data-range="0" onclick="InitWdatePicker(this)" style="width:110px;" data-type="start"><b class="seperate" style="">~</b><input name="' + code + '" type="text" data-range="1" onclick="InitWdatePicker(this)" style="width:110px;" data-type="end">';
            } else {
                filterInput += '<input name="' + code + '" type="text"  onclick="InitWdatePicker(this)"  value="' + defaultValue + '">';
            }
            break;
        case "Int":
        case "Long":
            if (filterType === 2) {
                filterInput += '<input name="' + code + '" type="text" data-type="start" data-range="0" style="width:110px;" onkeyup="clearNoNum(this,false)"/><b style="" class="seperate">~</b><input name="' + code + '" type="text" data-type="end" data-range="1"   onkeyup="clearNoNum(this,false)" style="width:110px;"/>';
            } else {
                filterInput += '<input name="' + code + '" type="text" onkeyup="clearNoNum(this,false)" value="' + defaultValue + '"/>';
            }
            break;
        case "Double":
        case "Decimal":
            if (filterType === 2) {
                filterInput += '<input name="' + code + '" type="text" data-type="start" data-range="0" onkeyup="clearNoNum(this,true)" style="width:110px;"/><b style="" class="seperate">~</b><input name="' + code + '" type="text" data-type="end" data-range="1" onkeyup="clearNoNum(this,true)" style="width:110px;"/>';
            } else {
                filterInput += '<input name="' + code + '" type="text"  onkeyup="clearNoNum(this,true)" value="' + defaultValue + '"/>';
            }
            break;
        default:
            filterInput += '<input name="' + code + '" type="text" value="' + defaultValue + '"/>';
            break;
    }
    filterInput += '</td>'
    return filterInput;
}

//数字合理化
function clearNoNum(num, mh) {
    if (mh) {
        num.value = num.value.replace(/[^\d.]/g, "");
        num.value = num.value.replace(/^\./g, "");
        num.value = num.value.replace(/\.{2,}/g, ".");
        num.value = num.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
    } else {
        num.value = num.value.replace(/[^\d]/g, "");
    }
}

//生成选人控件
function GetFilterUser(code, defaultValue) {
    return '<td><div name="' + code + '" style="width: 250px;" data-type="user" defaultvalue="' + defaultValue + '"></div></td>';
}

//构造MVCSheet控件
function BuildDivUser() {
    $("div[data-type=user]").each(function (n, k) {
        if ($(this).attr("name") == "CreatedByParentId" || $(this).attr("name") == "OwnerParentId") {
            $(this).SheetUser({ Editable: true, Visiable: true, UserVisible: false, OrgUnitVisible: true, IsMultiple: false, V: $(this).attr("defaultvalue") });
        } else {
            $(this).SheetUser({ Editable: true, Visiable: true, GroupVisible: false, IsMultiple: false, V: $(this).attr("defaultvalue") });
        }
    })
}

//获取提交的查询条件的值
function GetFilterData() {
    var param = new Object();
    if (FilterData && FilterData.length > 0) {
        for (var i = 0; i < FilterData.length; i++) {
            if (FilterData[i].DisplayType === 1) {//下拉框取值
                param[FilterData[i].PropertyCode] = $("select[name=" + FilterData[i].PropertyCode + "] option:selected").val();
            }
            else if (FilterData[i].DisplayType === 2) {//单选框取值
                if ($("input[name=" + FilterData[i].PropertyCode + "]"))
                    param[FilterData[i].PropertyCode] = $("input[name=" + FilterData[i].PropertyCode + "]:checked").val();
            }
            else if (FilterData[i].DisplayType === 3) {//复选框取值
                var checkboxArr = $("input[name=" + FilterData[i].PropertyCode + "]:checked");
                var checkboxStr = "";
                $(checkboxArr).each(function (n, k) {
                    checkboxStr += $(this).val() + ";";
                });
                param[FilterData[i].PropertyCode] = checkboxStr;
            }
            else if (FilterData[i].DisplayType === 5) {//MvcSheet控件取值
                param[FilterData[i].PropertyCode] = $("div[name=" + FilterData[i].PropertyCode + "]").SheetUIManager().GetValue();
            }
            else {
                if (FilterData[i].FilterType === 2) {//FilterType为范围选择
                    var valueArr = $("input[name=" + FilterData[i].PropertyCode + "]");
                    var startValue = "";
                    var endValue = "";
                    param[FilterData[i].PropertyCode] = {};
                    $(valueArr).each(function (n, k) {
                        param[FilterData[i].PropertyCode][$(this).attr("data-type")] = $(this).val();
                    });
                } else {
                    if ($("input[name=" + FilterData[i].PropertyCode + "]").val() === "") {
                        param[FilterData[i].PropertyCode] = " ";
                    } else {
                        param[FilterData[i].PropertyCode] = $("input[name=" + FilterData[i].PropertyCode + "]").val();
                    }
                }
            }
        }
        return param;
    } else {
        return null;
    }
}

function ValidateRange() {
    $("[data-range]").each(function (i, v) {
        $(this).bind("blur", function () {
            var val = $.trim($(this).val());
            var siblingsVal = $.trim($(this).siblings("[data-range]").val());
            var type = $(this).data("range");


            if (val == "" || siblingsVal == "") {
                return;
            }

            if (val.indexOf("-") == -1) {
                //数字类型
                val = window.parseFloat(val);
                siblingsVal = window.parseFloat(siblingsVal);
            } //timespan类型

            if ((type == 0 && val > siblingsVal) || (type == 1 && val < siblingsVal)) {
                $.H3Dialog.Warn({ content: "请选择正确的范围" });
                $(this).val("");
            }

        })
    })
}