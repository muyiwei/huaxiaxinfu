var None = "None";

// Label控件
(function ($) {
    //控件执行
    $.fn.SheetGridView = function () {
        $(this).find(".template>*[data-datafield]").children().each(function () {
            var datafiled = $(this).attr("data-datafield");
            $(this).removeAttr("data-datafield").attr("data-field", datafiled);
        });

        $(this).find("td[data-datafield]").each(function () {
            $(this).attr("data-field", $(this).attr("data-datafield"));
            $(this).removeAttr("data-datafield");
        });

        return $.MvcSheetUI.Run.call(this, "SheetGridView", arguments);
    };

    $.MvcSheetUI.Controls.SheetGridView = function (element, options, sheetInfo) {
        this.pageIndex = 0;
        this.loadNum = 10;//每次分页加载数据量
        this.dataContainerDivHeight = 0;
        this.originateValue = null;
        $.MvcSheetUI.Controls.SheetGridView.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.MvcSheetUI.Controls.SheetGridView.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            this.loadNum = this.VirtualPageNum;
            //不可见返回
            if (!this.Visiable) {
                if (this.VirtualPaging) {
                    $(this.Element).parent().hide();
                } else {
                    $(this.Element).hide();
                }
                return;
            };
            // 渲染前端
            this.HtmlRender();
            // 绑定事件
            this._BindEvents();
            // 初始化数据源
            this.SetValue();
            // 设置按钮可见
            this.SetVisible();
            // 子表展现完成后事件
            if (this.OnRendered) {
                this.RunScript(this, this.OnRendered, arguments);
            }
            if (this.IsMobile) {
                //移动端的开窗查询
                this._mobilePopup();
            } else {
                this._createPopup();
            }
        },
        _BindEvents: function () {
            //绑定增加事件
            $(this.addbtn).unbind("click").bind("click", [this], function (e) {
                if (e.data[0]._AddRow() != undefined) {
                    e.data[0]._AddRow().apply(this, true);
                }
            });
            //绑定清除事件
            $(this.clearbtn).unbind("click").bind("click", [this], function (e) {
                if (e.data[0]._Clear() != undefined) {
                    e.data[0]._Clear().apply(this, arguments);
                }
            });
            //绑定导出事件
            $(this.exportbtn).unbind("click").bind("click", [this], function (e) {
                //if (e.data[0]._Export() != undefined) {
                e.data[0]._Export.apply(e.data[0], arguments);
                //}
            });
            //绑定导入事件
            $(this.importbtn).find("a").unbind("click").bind("click", [this], function (e) {
                //if (e.data[0]._Import() != undefined) {
                $.LoadingMask.Show(SheetLanguages.Current.GridImporting);
                e.data[0]._Import.apply(e.data[0], arguments);
            });
        },
        //移动端开窗
        _mobilePopup: function () {
            if (this.PopupWindow == "None") return;

            //1.隐藏当前输入框
            //2.增加显示返回值 a
            //3.增加图标提示点击事件
            //4.item 添加样式 item-icon-right
            //this.ViewInNewContainer = $(this.Element).parent();
            this.ID = $(this.Element).attr("Id");
            $(this.Element).hide();
            $(this.Element).parent().find("[id*=mask]").remove();
            $(this.Element).parent().find("i.icon").remove();
            this.Mask = $("<span></span>").insertAfter(this.Element).attr("id", "mask_" + this.ID);
            this.Mask.text(this.GetText());
            this.Mask.insertAfter(this.Element).attr("id", "mask_" + this.ID);
            var _that = this;
            if (_that.Editable) {
                this.pupIcon = $("<i class='icon ion-ios-arrow-right'></i>").insertAfter(this.Mask);
                $(this.Element).closest("div.item").addClass("item-icon-right");
                $(this.Element).parent().parent().unbind("click.query").bind("click.query", function () {
                    //跳转到查询页面
                    $.MvcSheetUI.IonicFramework.$state.go("form.sheetquery", { datafield: _that.DataField, rownum: $(this).find("[data-datafield='" + _that.DataField + "']").attr("data-row") });
                })
            }

        },
        _createPopup: function () {
            var that = this;
            //开窗查询(DisplayText SchemaCode QueryCode InputMappings OutputMappings)
            if (this.PopupWindow == "PopupWindow") { //弹窗模式
                var displayText = this.DisplayText == "" ? "&nbsp;" : this.DisplayText;
                var popupDivId = "popupLink" + (new Date()).getTime();
                var outputParams = "";
                if (this.OutputMappings != "") {
                    outputParams = "&OutputParams=" + encodeURI(this.OutputMappings.replace(/,/g, "|").replace(/:/g, ","));
                }
                var w = that.PopupWidth ? that.PopupWidth : "600px";
                var h = that.PopupHeight ? that.PopupHeight : "400px";
                //弹窗div
                var popupDiv = "<div id='" + popupDivId + "' class='modal fade' tabindex='-1' role='dialog' aria-hidden='true'>"
                popupDiv += "<div class='modal-dialog'>";
                popupDiv += "<div class='modal-content' style='width:" + w + ";'>";
                popupDiv += "<div class='modal-header'>";
                popupDiv += "<button type='button' class='close' data-dismiss='modal'>";
                popupDiv += "<span aria-hidden='true'>&times;</span></button>";
                popupDiv += "<h4 class='modal-title'>" + displayText + "</h4>";
                popupDiv += "</div><div class='modal-body'>";
                popupDiv += "<iframe scrolling='no' frameborder='0' width='100%' height='" + h + "'></iframe>";
                popupDiv += "</div></div></div></div>";
                popupDiv = $(popupDiv);
                //开窗点击事件
                $(this.batchInputbtn).click(function () {
                    var src = that.PortalRoot + "/admin/TabMaster.html?url=ListMasterDataMultiple.html&OpenType=1&IsPopup=1&SchemaCode=" + that.SchemaCode +
                        "&QueryCode=" + that.QueryCode + "&CtrlID=" + popupDivId + outputParams + that._getInputParam();
                    popupDiv.find("iframe").attr("src", src);
                    popupDiv.modal("show");
                });
                //弹窗页面回调函数(\Portal\WFRes\_Scripts\bizquery.js)
                window[popupDivId] = {};
                window[popupDivId].ListMasterCallBack = function (data) {
                    //debugger;
                    //将选择的记录值，赋值到界面元素
                    if (data) {
                        // debugger;
                        for (var field in data) {
                            var ligerGridVaule;
                            for (var r in data[0]) {
                                if ($.MvcSheetUI.GetControlValue(r)) ligerGridVaule = $.MvcSheetUI.GetControlValue(r);
                            }
                            if (ligerGridVaule || that.RowNum != 1) { that._AddRow() }
                            for (var dfilId in data[field]) {
                                $.MvcSheetUI.SetControlValue(dfilId, data[field][dfilId], that.RowCount);
                            }
                        }
                    }
                    //关闭弹窗
                    popupDiv.modal("hide");
                };
            } else if (this.PopupWindow == "Dropdown") { //浮动层模式
                var popupDivId = "popupLink" + (new Date()).getTime();
                var outputParams = "";
                if (this.OutputMappings != "") {
                    outputParams = "&OutputParams=" + encodeURI(this.OutputMappings.replace(/,/g, "|").replace(/:/g, ","));
                }
                //浮动层div
                var popupDiv = $("<div style='display:none;z-index:9999;position:absolute;background-color:#f8f8f8;' id='" + popupDivId + "'><iframe scrolling='no' frameborder='0' width='550px' height='300px'></iframe></div>");
                //在Element后添加弹窗元素
                $(this.Element).after(popupDiv);
                //给focus事件绑定浮动层方法
                // $(this.batchInputbtn).unbind("focus.Popup").bind("focus.Popup", function () {
                $(this.batchInputbtn).click(function () {
                    var src = that.PortalRoot + "/admin/TabMaster.html?url=ListMasterDataMultiple.html&OpenType=1&IsPopup=1&SchemaCode=" + that.SchemaCode +
                        "&QueryCode=" + that.QueryCode + "&CtrlID=" + popupDivId + outputParams + that._getInputParam();
                    popupDiv.find("iframe").attr("src", src);
                    popupDiv.show();
                    var offset = $(that.Element).offset();
                    popupDiv.offset({ top: offset.top + $(that.Element).outerHeight() + 3, left: offset.left });
                });
                //浮动层双击回调函数(\Portal\WFRes\_Scripts\bizquery.js)
                window[popupDivId] = {};
                window[popupDivId].ListMasterCallBack = function (data) {
                    //将选择的记录值，赋值到界面元素
                    if (data) {
                        for (var field in data) {
                            var ligerGridVaule;
                            for (var r in data[0]) {
                                if ($.MvcSheetUI.GetControlValue(r)) ligerGridVaule = $.MvcSheetUI.GetControlValue(r);
                            }
                            if (ligerGridVaule || that.RowNum != 1) { that._AddRow() }
                            for (var dfilId in data[field]) {
                                $.MvcSheetUI.SetControlValue(dfilId, data[field][dfilId], that.RowCount);
                            }
                        }
                    }
                    //隐藏浮动层
                    popupDiv.hide();
                };
                //点击界面上的其它元素时，隐藏浮动层（浮动层为iframe，点击不会触发该事件）
                $(document).unbind("click." + popupDivId).bind("click." + popupDivId, function (e) {
                    if ($(e.target)[0].tagName.toLowerCase() != "a") {
                        popupDiv.hide();
                    }
                });
            }
        },
        _getInputParam: function () {
            var inputParam = "";
            if (this.InputMappings) {
                var items = this.InputMappings.split(",");
                for (var i = 0; i < items.length; i++) {
                    var fields = items[i].split(":");
                    if (fields && fields.length == 2) {
                        if (fields[0] && $.MvcSheetUI.GetSheetDataItem(fields[0], this.GetRowNumber())) {
                            inputParam += fields[1] + "," + $.MvcSheetUI.GetControlValue(fields[0], this.GetRowNumber()) + "|";
                        }
                    }
                }
                if (inputParam) {
                    inputParam = "&InputParam=" + encodeURI(inputParam.substring(0, inputParam.length - 1));
                }
            }
            return inputParam;
        },
        // 设置相关按钮是否可见
        SetVisible: function () {

            //移动端按钮设置只有三个有效DisplayAdd（增加一个新） DisplayDelete（删除一个）有效
            //移动端自己（rendermobile）管理子表的其他属性配置和权限，这里只负责这三个按钮是否显示
            if (this.IsMobile) {
                if (!this.DisplayAdd) {
                    this.Element.find(".addbtn").hide();
                }
                if (!this.DisplayDelete) {
                    this.Element.find(".delete").hide();
                }
                return;
            }



            if (this.VirtualPaging) {
                var dataTableHeight = $(this.Element).height();
                var divDataTable = $(this.Element).parent().parent().height();
                if (dataTableHeight < divDataTable) {
                    $(this.Element).parent().css("height", dataTableHeight + 60 + "px");
                    $(this.Element).parent().parent().css("height", dataTableHeight + 150 + "px");
                }
            }
            if (this.V.R) {
                if (this.V.R.length == 1 && (this.IsEmptyRow($(this.Element).find("tr.rows:first")) || this.Originate))
                    if (this.DefaultRowCount > 0) {                           //添加默认行
                        for (var i = 0; i < this.DefaultRowCount - 1; i++) {
                            this._AddRow();
                        }
                    }
            }
            if (!this.DisplayAdd || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {    //添加按钮
                $(this.addbtn).css("display", "none");
            }
            if (!this.DisplayExport || this.L == $.MvcSheetUI.LogicType.BizObject) { //导出按钮
                $(this.exportbtn).css("display", "none");
            }
            if (!this.DisplayImport || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) { //导入按钮
                $(this.importbtn).css("display", "none");
            }
            if (!this.DisplayClear || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {  //清除按钮
                $(this.clearbtn).css("display", "none");
            }
            if (this.PopupWindow == None || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {    //批量录入数据按钮
                $(this.batchInputbtn).css("display", "none");
            }
            if (!this.DisplayInsertRow || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable || this.VirtualPaging) { //插入行按钮
                $(this.Element).find("a.insert").css("display", "none");
            }
            if (!this.DisplayDelete || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {    //删除按钮
                $(this.Element).find("a.delete").css("display", "none");
            }
            if (((!this.DisplayInsertRow && !this.DisplayDelete) || !this.Editable) && this.L != $.MvcSheetUI.LogicType.BizObject) {
                if ($(this.template).length > 1) {
                    var tdsnum = $($(this.template)[0]).find("td").length;
                    $(this.Element).find("tr").each(function (e) {
                        if ($(this).find("td").length == tdsnum) {
                            if ($(this).find("td:last").find("a.delete").length > 0)
                                $(this).find("td:last").css("display", "none");
                        }
                    });
                }
                else {
                    $(this.Element).find("tr[data-row]").each(function (e) {
                        $(this).find("td:last").css("display", "none");
                    });
                }
                $(this.Element).find("tr:first").find("td:last").css("display", "none");
                $(this.Element).find("tr.footer").find("td:last").css("display", "none");

                if (this.VirtualPaging)
                    $($(this.Element).parent().parent().find("tr.header")).find("td.rowOption").hide();
            }
            if (!this.DisplaySequenceNo) {                 //序号列
                if ($(this.template).length > 1) {
                    var tdsnum = $($(this.template)[0]).find("td").length;
                    $(this.Element).find("tr").each(function (e) {
                        if ($(this).find("td").length == tdsnum)
                            $(this).find("td:first").css("display", "none");
                    });
                }
                else {
                    $(this.Element).find("tr").each(function (e) {
                        $(this).find("td:first").css("display", "none");
                    });
                }

                if (this.VirtualPaging)
                    $($(this.Element).parent().parent().find("tr.header")).find("td:first").hide()
            }
            if (!this.DisplaySummary || this.L == $.MvcSheetUI.LogicType.BizObject) {       //汇总行
                $(this.Summary).css("display", "none");
            }
            else {
                var tds = $(this.template).find("td");
                var doSummary = false;
                for (var i = 0; i < tds.length; i++) {
                    if (this.GetSummaryTd(tds[i])) {
                        this._Summary($(tds[i]).children());
                        doSummary = true;
                    }
                }
                if (!doSummary) { $(this.Summary).css("display", "none"); }
            }

            var tds = $(this.Element).find("td");
            if (this.VirtualPaging) {
                tds = $(this.Element).parent().parent().find("td");
            }
            for (var i = 0; i < tds.length; i++) {
                var datafield = $(tds[i]).attr("data-field");
                if (datafield) {
                    var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, 1);
                    if (dataitem && dataitem.O.indexOf("V") < 0) {
                        $(tds[i]).css("display", "none");

                    }
                }
            }
            if (this.VirtualPaging)
                this._SetVirtualPagingContainerHeight();
        },
        GetSummaryTd: function (td) {           //判断单元格中是否包含数值类型
            var datafield = $(td).attr("data-field");
            if (datafield) {
                var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, 1);
                if (dataitem && (dataitem.L == $.MvcSheetUI.LogicType.Int
                    || dataitem.L == $.MvcSheetUI.LogicType.Double
                    || dataitem.L == $.MvcSheetUI.LogicType.Long)) {
                    return true;
                }
            }
            return false;
        },
        _Summary: function (input) {            //汇总计算
            var datafield = $(input).closest("td").attr("data-field");
            var countControl;
            var countLabels = $(this.Summary).find("label");
            for (var i = 0; i < countLabels.length; i++) {
                if ($(countLabels[i]).attr("data-datafield") == datafield) {
                    countControl = $(countLabels[i]);
                }
            }

            var count = 0;
            var sum = 0;
            var valueArray = new Array();
            var tds = $(this.Element).find("tr.rows").find("td");
            for (var i = 0; i < tds.length; i++) {
                if ($(tds[i]).attr("data-field") == datafield) {
                    var v = $(tds[i]).children().text() || $(tds[i]).children().val() || "0";
                    var value = v == "*" ? 0 : v;
                    if (isNaN(value)) {
                        value = parseFloat(value.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, ""));
                    }
                    sum += parseFloat(value);
                    count++;
                    valueArray.push(value)
                }
            }
            var max = Math.max.apply(Math, valueArray)
            var min = Math.min.apply(Math, valueArray)

            var manager = $(countControl).SheetCountLabel();
            if (manager && manager.StatType) {
                switch (manager.StatType) {
                    case "SUM":
                        manager.Render(sum);
                        break;
                    case "AVG":
                        manager.Render((sum / count).toFixed(2));
                        break;
                    case "MAX":
                        manager.Render(max);
                        break;
                    case "MIN":
                        manager.Render(min);
                        break;
                    default:
                        break;
                }
            }
            // this._SummaryOTher(input);
        },
        _SummaryOTher: function (input) { // 计算汇总字段
            var datafield = $(input).attr($.MvcSheetUI.PreDataKey + $.MvcSheetUI.DataFieldKey);
            if (!datafield) return;
            var parent = $(input).parent();
            var i = 0;
            while (!parent.is("tr")) {
                parent = parent.parent();
                i++; if (i > 10) break;
            }
            var ctl = parent.find("input[data-computationrule*='{" + datafield + "}'],label[data-computationrule*='{" + datafield + "}'],span[data-computationrule*='{" + datafield + "}']");
            if (ctl.length > 0) {
                for (var i = 0; i < ctl.length; i++) {
                    this._Summary(ctl[i]);
                }
            }
        },
        GetText: function () {
            var num = 0;
            if (this.IsMobile)
                num = $(this.Element).find("ul.list").length - 1;
            else
                num = $(this.Element).find("tr.rows").length
            return num + SheetLanguages.Current.Records;
        },
        GetValue: function () {
            var value = new Array();
            var trvalue = {};

            if (this.IsMobile) {
                var gridview = this.MobileRows;
                if (gridview) {
                    for (var i = 0; i < gridview.length; i++) {
                        var row = gridview[i];
                        row.id = row.RowControl.attr('id');
                        if (row) {
                            var controls = row.Editors;
                            for (var j = 0; j < controls.length; j++) {
                                var control = controls[j];
                                if (control) {
                                    var datafield = control.DataField;
                                    if (datafield) {
                                        if (control.Type == "SheetTimeSpan") {
                                            var tmpStr = control.GetValue();
                                            tmpStr = tmpStr.replace("$", ".");
                                            trvalue[datafield.split(".")[1]] = tmpStr;
                                        } else {
                                            trvalue[datafield.split(".")[1]] = control.GetValue();
                                        }
                                    }

                                }
                            }
                            if (row.id) {
                                trvalue["ObjectID"] = row.id;
                            }

                            value.push(trvalue);
                            trvalue = {};
                        }
                    }
                }
            }
            else {
                var trs = $(this.Element).find("tr.rows");
                var tableid = $(this.Element).attr("id");
                var parentDatafield = $(this.Element).attr("data-datafield");
                if (this.template.length > 1) {
                    for (var i = 0; i < trs.length; i = i + this.template.length) {
                        var row = trs[i];
                        var datarow = $(row).attr("data-row");
                        var rows = $("#" + tableid + " tr[data-row='" + datarow + "']");
                        for (var k = 0; k < rows.length; k++) {
                            if (arguments && arguments[0])
                                trvalue = this.GetRowValue(rows[k], trvalue, arguments[0]);
                            else
                                trvalue = this.GetRowValue(rows[k], trvalue);
                        }
                        // 调用外部委托事件
                        if (this.OnEditorSaving != null) {
                            // trvalue = this.EditorSaving.apply(this, [rows, trvalue]);
                            this.RunScript(this, this.OnEditorSaving, [rows, trvalue]);
                        }
                        value.push(trvalue);
                        trvalue = {};
                    }
                }
                else {
                    for (var i = 0; i < trs.length; i++) {
                        var row = trs[i];
                        if (arguments && arguments[0])
                            trvalue = this.GetRowValue(row, trvalue, arguments[0]);
                        else
                            trvalue = this.GetRowValue(row, trvalue);
                        // 调用外部委托事件
                        if (this.OnEditorSaving != null) {
                            // trvalue = this.EditorSaving.apply(this, [$(row), trvalue]);
                            this.RunScript(this, this.OnEditorSaving, [$(row), trvalue]);
                        }
                        value.push(trvalue);
                        trvalue = {};
                    }
                }
            }
            return value;
        },
        //// 子表行保存委托事件
        //EditorSaving: function (row, trValue) {
        //    return trValue;
        //},
        GetRowValue: function (row, trvalue, isexport) {
            if (!this.IsEmptyRow(row) || (this.V && this.V.R && this.V.R.length > 0) || this.L == $.MvcSheetUI.LogicType.BizObject) {
                var tds = $(row).find("td");
                for (var j = 0; j < tds.length; j++) {
                    var td = tds[j];
                    var datafiledElement = $(td).find("[data-datafield]");
                    var datafield = datafiledElement.attr("data-datafield");
                    if (datafield != undefined) {
                        if (isexport) {
                            var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, 1);
                            if (dataitem && dataitem.L == $.MvcSheetUI.LogicType.Attachment) {
                                var fjtrs = datafiledElement.find("table").find("tr");
                                var fjvalue = "";
                                for (var k = 0; k < fjtrs.length; k++) {
                                    fjvalue += $(fjtrs[k]).find("td:first").find("div").html() + ";";
                                }
                                trvalue[datafield.split(".")[1]] = fjvalue;
                            } else {
                                trvalue[datafield.split(".")[1]] = datafiledElement.SheetUIManager($(row).attr("data-row")).GetValue();
                            }
                        }
                        else {
                            if (datafiledElement.SheetUIManager($(row).attr("data-row")))
                                trvalue[datafield.split(".")[1]] = datafiledElement.SheetUIManager($(row).attr("data-row")).GetValue();
                        }
                    }
                }
                if ($(row).attr("id") != undefined) {
                    trvalue["ObjectID"] = $(row).attr("id");
                }
            }
            return trvalue;
        },
        IsEmptyRow: function (tr) {
            var value = "";
            var num = $(tr).attr("data-row");
            $(tr).find("td").each(function () {
                if ($(this).children().SheetUIManager(num)) {
                    if ($(this).children().attr("class") == "SheetAttachment") {
                        var attachment = $(this).children().SheetUIManager(num).GetValue();
                        if (attachment.AttachmentIds != "" || attachment.DelAttachmentIds != "") {
                            value += "1";
                        }
                    }
                    else
                        value += $(this).children().SheetUIManager(num).GetValue();
                }
            })
            if (value == "" || value.replace("0", "") == "") {
                return true;
            }
            return false;
        },

        //分页加载数据
        //endIndex==-1:非分页加载；
        //dataGridview: 加载数据
        SetValue: function (dataSource) {
            // 初始化默认值 是否分页加载数据

            //移动端暂未支持VirtualPaging属性
            if (this.VirtualPaging && !this.IsMobile) {
                this._SetValueByPage(0, this.loadNum, null);//分页加载

                $(this.Element.parentElement).unbind("scroll.horizontal").bind("scroll.horizontal", [this], function (e) {
                    var left = $(this).scrollLeft();
                    $(this.parentElement).find(".SheetGridViewTitle").scrollLeft(left);
                });

                $(this.Element.parentElement).unbind("scroll.PageShow").bind("scroll.PageShow", [this], function (e) {
                    //判断是否加载
                    var IsLoad = false;
                    var divHeight = $(this).height();//显示子表table 的div高度
                    var tableHeight = $(this).find("table[data-type='SheetGridView']").height();//子表table高度
                    var ShowHeight = $(this).scrollTop();

                    var pageNum = Math.ceil(tableHeight / divHeight);//页数
                    var precent = ShowHeight / Number(tableHeight);
                    var relative = (pageNum - 2) / pageNum;
                    if (precent > relative) {
                        IsLoad = true;
                        var pageIndex = e.data[0].pageIndex;
                        var loadNum = e.data[0].loadNum;
                        var startIndex = pageIndex * loadNum;
                        var endIndex = (pageIndex + 1) * loadNum;
                        // e.data[0].SetValueByPage(startIndex, endIndex, e);// HuangJie，对应到后面也有注释，这里不能传递e过去，只能传指定的数据源
                        e.data[0]._SetValueByPage(startIndex, endIndex, dataSource);
                    }
                });
            }
            else {
                this._SetValueByPage(0, -1, dataSource);
            }
        },

        _SetValueByPage: function (startIndex, endIndex, dataSource) {
            // 初始化,若不传参数,则使用this.V,否则用设置的数据源,格式为MvcBizObjectList
            if (this.V.T) this.DefaultRow = this.V.T;
            var value = dataSource;
            if (this.L == $.MvcSheetUI.LogicType.BizObjectArray) {
                value = value || this.V.R;   // 如果指定的数据源为空，那么使用系统默认的数据源
            } else if (this.L == $.MvcSheetUI.LogicType.BizObject) {
                value = value || this.V;
            }
            if (!value) return;  // 数据源为空，不做处理

            // 加载方式：一次、分页
            if (endIndex == -1) {
                endIndex = value.length;
            }

            if (this.Originate && this.DefaultRowCount < 1) {
                return;
            }

            if (this.L == $.MvcSheetUI.LogicType.BizObjectArray) {
                if (startIndex < value.length) {
                    for (var i = startIndex; i < endIndex; i++) {
                        var row = value[i];
                        if (row != undefined) {
                            var objectid = $(this.Element).attr("data-datafield") + ".ObjectID";
                            if (this.IsMobile) {
                                this._AddMobileRow(row.DataItems[objectid].V);   //移动端
                            }
                            else {
                                this._AddRow(row.DataItems[objectid].V);
                            }
                        }
                    }
                    this.pageIndex += 1;
                }
                if (endIndex >= value.length) {
                    if (this.IsMobile) {
                        return true;
                    } else {
                        this.Element.parentElement.removeAttribute("scroll");
                        $(this.Element.parentElement).unbind("scroll.PageShow");
                    }

                }
            }
            else if (this.L == $.MvcSheetUI.LogicType.BizObject) {
                if (this.IsMobile) {
                    this._AddMobileRow();
                }
                else {
                    //this._AddRow();
                    this.newRow = $(this.Element).find("tr.template").removeClass("template").addClass("rows").attr("data-row", "1");
                    var objectid = this.V.DataItems[$(this.Element).attr("data-datafield") + ".ObjectID"].V;
                    $(this.newRow).attr("id", objectid);
                    $(this.newRow).find("td").each(function () {
                        var control = $(this).find("[data-field]");
                        var datafield = $(control).attr("data-field");
                        $(control).removeAttr("data-field").attr("data-datafield", datafield)
                            .attr("data-row", "1"); // 业务对象也给control加上data-row，方便通过datafield查找
                        $(control).SheetUIManager(1);
                    })
                }
                //this.EditorLoading.apply(this, [this.V]);
            }
        },
        HtmlRender: function () {
            if (this.VirtualPaging) {
                this._RenderVirtualPagingContainer();
            }
            var displayText = this.DisplayText == "" ? "&nbsp;" : this.DisplayText;
            this.ButtonId = this.DataField + "_" + Math.floor(Math.random() * 1000);//设置按钮ID
            this.RowCount = 0;
            this.RowNum = 0;
            this.template = $(this.Element).find("tr.template");
            // $(this.Element).css("width", "100%");
            $(this.Element).parent().css("overflow", "auto");//超出边界增加滑动
            var tds = this.template.find("td");
            this.Summary = $(this.Element).find("tr.footer");
            var tooldiv = $("<div></div>").css("width", "100%");
            this.addbtn = $("<div><a id='Add_" + this.ButtonId + "'>" + SheetLanguages.Current.Add + "</a></div>").css("width", "8%").css("float", "left").css("padding-top", "3px");
            this.clearbtn = $("<div><a id='Clear_" + this.ButtonId + "'>" + SheetLanguages.Current.Clear + "</a></div>").css("width", "8%").css("float", "left").css("padding-top", "3px");
            this.importbtn = $("<div><input id='importExcel_" + this.ButtonId + "' name='importExcel' type='file' style='width:60%' /><a id='Import_" + this.ButtonId + "'>" + SheetLanguages.Current.Import + "</a></div>").css("float", "left");
            this.exportbtn = $("<div><a id='Export_" + this.ButtonId + "'>" + SheetLanguages.Current.Export + "</a></div>").css("width", "8%").css("float", "left").css("padding-top", "3px");
            this.batchInputbtn = $("<div><a id='BatchInput_" + this.ButtonId + "'>" + displayText + "</a></div>").css("width", "8%").css("float", "left").css("padding-top", "3px");
            tooldiv.append(this.addbtn).append(this.clearbtn).append(this.batchInputbtn).append(this.exportbtn).append(this.importbtn);
            if (this.VirtualPaging) {
                $(this.Element).parent().after(tooldiv);
            } else {
                $(this.Element).after(tooldiv);
            }

        },
        _RenderVirtualPagingContainer: function () {
            //this.dataContainerDivHeight = $(this.Element).parent().height() - 70;  // 去掉表头的高度
            // this.dataContainerDivHeight = this.dataContainerDivHeight < 80 ? 80 : this.dataContainerDivHeight;
            this.dataContainerDivHeight = 500;//最大10行标准高度
            $("table").css("max-width", "none");
            // 表头div
            var divTitleTableContainer = $("<div class='SheetGridView SheetGridViewTitle' data-datafield='" + this.DataField + "' style='overflow:hidden;width:100%;'></div>");
            // 主体div
            var divDataTableContainer = $("<div class='SheetGridView SheetGridViewData' data-datafield='" + this.DataField + "' data-type='SheetGridView' style='overflow:auto;width:100%;max-height:" + this.dataContainerDivHeight + "px;' scroll='scroll'></div>");
            $(this.Element).parent().append(divTitleTableContainer);
            $(this.Element).parent().append(divDataTableContainer);

            //填充主体
            divDataTableContainer.append($(this.Element));//针对当前div.SheetGridViewData 对象
            divDataTableContainer.niceScroll({ cursorcolor: "#CCC", cursoropacitymax: 0.8, autohidemode: false, cursorwidth: "10px", cursorminheight: "40" }).resize();
            // 填充表头 
            var dataTableWidth = $(this.Element).width();
            var tableTitleDom = $("<table class='SheetGridView'></table>").css("max-width", "none").css({ "width": dataTableWidth, "table-layout": "fixed" });
            $(this.Element).css("width", $(this.Element).width());
            var tbody = $("<tbody class=''></tbody>");
            var header = $(this.Element).find("tr.header");
            tbody.append(header);
            tableTitleDom.append(tbody);
            divTitleTableContainer.append(tableTitleDom);//同上
            //divDataTableContainer.css("overflow", "inherit");
        },


        RenderMobile: function () {
            // debugger
            //不可见返回
            if (!this.Visiable) {
                $(this.Element).hide();
                return;
            }
            //移到表单最下方
            $(this.Element).closest("div[class=tableContent list]").hide();
            //关联关系
            $(this.Element).closest("div[class=list]").hide();

            var parentDatafield = $(this.Element).data($.MvcSheetUI.DataFieldKey.toLowerCase());//数据项编码
            var sheetid = $(this.Element).data($.MvcSheetUI.SheetIDKey);
            this.template = $(this.Element).find(".template");
            $(this.Element).find("table").remove();
            $(this.Element).data($.MvcSheetUI.SheetIDKey, sheetid);
            //主容器 
            var panelContainer = $(this.Element).closest("div[class=tableContent list]");

            if ($(this.Element.parentElement).hasClass("hidden")) {
                this.Element = $("<div>").attr("data-datafield", parentDatafield).addClass("SheetGridView hidden");
            }
            else {
                this.Element = $("<div>").attr("data-datafield", parentDatafield).addClass("SheetGridView");
            }
            //debugger
            if (panelContainer.attr("data-displayrule") && panelContainer.attr("id")) {

                this.Element.attr("data-displayrule", panelContainer.attr("data-displayrule")).attr("id", panelContainer.attr("id"));
                panelContainer.removeAttr("data-displayrule").removeAttr("id");
            }
            panelContainer.after(this.Element);

            //var titleText = $(this.Element).parent().attr("data-title") || this.DataItem.N;
            var titleText = SheetLanguages.Current.ChildSchemaInfo1;
            //区分关联关系
            var length = 0;
            if (this.V.DataItems != undefined) {
                this.IsAssociation = true;
                length = 1;
            } else {
                this.IsAssociation = false;
                length = this.V.R.length;
            }
            if (this.DataItem.N && this.DataItem.N.length > 7) {
                this.DataItem.N = this.DataItem.N.substr(0, 7) + '...';
            }
            txt = this.DataItem.N + SheetLanguages.Current.ChildSchemaInfo2 + length + SheetLanguages.Current.ChildSchemaInfo3;
            this.title = $("<div>").addClass("item item-title").append("<span>" + txt + "</span>");
            this.title.appendTo(this.Element);
            var content = $("<div>").addClass("item-content").addClass("tab-mode");//子表默认显示模式tab-mode
            content.appendTo(this.Element);

            this.modal =
                '<div class="item-index">' +
                    '<div class="buttons-left">' +
                        '<ion-scroll class="scroll" direction="x" scrollbar-x="false" delegate-handle="' + this.DataField + '_1" style="display:none;">' +
                            '<button class="button button-small" type="button" ng-click="test()">1</button>' +
                        '</ion-scroll>' +
                        '<ion-scroll class="scroll" direction="x" scrollbar-x="false" delegate-handle="' + this.DataField + '" style="display:block;">' +
                        '</ion-scroll>' +
                    '</div>' +
                    '<div class="buttons-right">' +
                        '<span style="font-size:35px;" class="addrow">+</span>' +
                    '</div>' +
                '</div>' +
                '<div class="item-content" style="height:100%;border-top:1px solid rgb(221, 221, 221);border-bottom:1px solid rgb(221, 221, 221);">' +
                    '<div class="slider-slides">' +
                    '</div>' +
                '</div>';
            $(this.modal).appendTo(content);
            if (this.IsAssociation) {
                $(this.Element).find("div[class='buttons-right']").addClass("hide");
            }
            //初始化索引
            this.InitMobileIndex();
            $.MvcSheetUI.IonicFramework.$compile($($(this.Element).find("ion-scroll")))($.MvcSheetUI.IonicFramework.$scope);

            //this.copybtn = $('<div></div>').addClass("button-fun").attr("align", "center").append($('<a>').addClass("button button-small button-blue").text("复制"));
            //this.addbtn = $('<div></div>').addClass("button-fun").attr("align", "center").append($('<a>').addClass("button button-small  button-blue").text("添加"));
            //this.delebtn = $('<div></div>').addClass("button-fun").attr("align", "center").append($('<a>').addClass("button button-small button-red").text("删除"));
            this.changeSchemeShowMode = $('<div></div>').addClass("button-fun").attr("align", "center").append($('<a>').addClass("button button-small button-red").text(SheetLanguages.Current.ChangeMode));
            this.title.append(this.changeSchemeShowMode);


            //不可编辑时，子表数目为零，隐藏切换模式按钮
            if (!this.Editable) {
                if (length == 0) {
                    content.addClass('list-mode');
                    $(this.changeSchemeShowMode).hide();
                }
            }

            this.addbtnBottom = $('<div class="addbtn"><span>+</span>' + SheetLanguages.Current.AddChildSchema + '</div>');
            if (this.V.R) {
                content.append(this.addbtnBottom);
                //content.append(this.copybtn).append(this.addbtn).append(this.delebtn);
            }

            this.RowCount = 0;
            this.RowNum = 0;
            this.MobileRow = $("<div>").addClass("slider-slide").attr("style", "display:none;");
            var tt = $('<div></div>').addClass('list-title');
            var ttl = $('<div></div>').addClass('list-title-left');
            ttl.text(titleText);
            var ttr = $('<div></div>').addClass('list-title-right');
            ttr.append($("<div></div>").addClass('copy').text(SheetLanguages.Current.Copy)).append($("<div></div>").addClass('delete').text(SheetLanguages.Current.Delete));
            tt.append(ttl).append(ttr);
            this.MobileRow.append(tt);
            var tds = $(this.template).find("td");
            if (this.L == $.MvcSheetUI.LogicType.BizObjectArray) {
                for (var i = 1; i < tds.length - 1; i++) {
                    this.GetChildrenTd(tds[i]);
                }
            }
            else {
                for (var i = 0; i < tds.length; i++) {
                    this.GetChildrenTd(tds[i]);
                }
            }
            this.SetValue();
            this.currentIndex = 0;
            this.ShowMobileData(0);
            this.childSchemaShowMode = 'tabMode';
            var that = this;
            //绑定添加事件——add模式 添加到末尾
            this.bindAddLast = function (ele) {
                ele.unbind('click.add').bind('click.add', [this], function (e) {
                    console.log(that.currentIndex);
                    e.data[0]._AddMobileRow();
                    MobileIndexChange(that.currentIndex, 'add');
                    RebindChildSchemaEvents();
                    $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.resize();
                    that.SetVisible();
                });
            };
            //绑定添加事件——insert模式 添加到项的后面
            this.bindAddAfter = function (ele) {
                ele.unbind('click.add').bind('click.add', [this], function (e) {
                    e.data[0]._InsertMobileRow.apply(e.data[0], [$(this), false]);
                    MobileIndexChange(that.currentIndex, 'insert');
                    RebindChildSchemaEvents();
                });
            }
            //绑定切换子表模式事件list-mode、tab-mode
            $(this.changeSchemeShowMode.find("a")).unbind('click.changeMode').bind('click.changeMode', [this], function (e) {
                console.log("change mode");
                if (that.childSchemaShowMode == 'listMode') {
                    content.removeClass("list-mode").addClass("tab-mode");
                    that.childSchemaShowMode = 'tabMode';
                    var items = that.Element.find('.slider-slide').hide();
                    that.Element.find(".item-index").find('button').each(function (i, v) {
                        if (v.getAttribute('index') == that.currentIndex) {
                            that.MobileIndexButtonClick(v);
                        }
                    });
                } else {
                    content.removeClass("tab-mode").addClass("list-mode");
                    that.childSchemaShowMode = 'listMode';
                }
                $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.resize();

            });
            //绑定复制事件——insert模式
            this.bindCopy = function (ele) {
                ele.unbind('click.copy').bind('click.copy', [this], function (e) {
                    var index = $(e.target).parents(".slider-slide")[0].getAttribute('data-row') - 1;
                    that.currentIndex = index;
                    var ele = $(e.data[0].Element).find("div[class='slider-slide']");
                    if (ele.length == 0) return;
                    e.data[0]._InsertMobileRow.apply(e.data[0], [$(this), true]);
                    MobileIndexChange(that.currentIndex, 'insert');
                    RebindChildSchemaEvents();
                    that.SetVisible();
                });
            }
            //绑定删除事件
            this.bindDelete = function (ele) {
                ele.unbind('click.delete').bind('click.delete', [this], function (e) {
                    that.currentIndex = $(e.target).parents(".slider-slide")[0].getAttribute('data-row') - 1;
                    var index = that.currentIndex;
                    //删除表单元素
                    var Rows = $(this).closest('div[data-datafield="' + that.DataField + '"]').find('div[class="slider-slide"]');
                    if (Rows.length == 0) return;
                    if (that.OnPreRemove) {
                        that.RunScript($(Rows[index]), that.OnPreRemove);
                    }
                    if (that.OnRemoved) {
                        that.RunScript($(Rows[index]), that.OnRemoved);
                    }
                    for (var i = 0; i < that.V.R.length; i++) {
                        var id = that.V.R[i].DataItems[that.DataField + ".ObjectID"].V;
                        if (id == $(Rows[index]).attr("id")) {
                            that.V.R.splice(i, 1); break;
                        }
                    }

                    var thisMobileRow = that.MobileRows[index];
                    for (var k in thisMobileRow.Editors) {
                        var id = $(thisMobileRow.Editors[k].Element).data($.MvcSheetUI.SheetIDKey);
                        if (id && $.MvcSheetUI.ControlManagers[id]) {
                            delete $.MvcSheetUI.ControlManagers[id];
                        }
                    };
                    $(Rows[index]).remove();
                    that.MobileRows.splice(index, 1);
                    //重新排序
                    if (index == that.MobileRows.length && index != 0) {
                        index--;
                    }
                    --that.RowCount;
                    that.ShowMobileData(index);
                    MobileIndexChange(that.currentIndex, 'delete');
                    if (this.OnRemoved) {
                        this.RunScript($(deleterow), this.OnRemoved);
                    }
                    RebindChildSchemaEvents();
                    that.SetVisible();
                    //删除行的时候，重新初始化Rule
                    if ($.MvcSheetUI.MvcRuntime && !$.MvcSheetUI.Loading) {
                        $.MvcSheetUI.MvcRuntime.init();
                    }
                });
            }
            //绑定事件
            this.bindAddLast(this.Element.find('.addrow'));
            this.bindAddLast(this.addbtnBottom);
            var RebindChildSchemaEvents = function () {
                var copys = that.Element.find('.copy');
                var deletes = that.Element.find('.delete');
                copys.each(function (i, v) {
                    that.bindCopy($(v));
                });
                deletes.each(function (i, v) {
                    that.bindDelete($(v));
                });
                //显示子表序号
                that.Element.find(".list-title").each(function (i, v) {
                    var ltl = $(v).find('.list-title-left')[0];
                    var index = $(ltl).parents('.slider-slide')[0].getAttribute('data-row');
                    $(ltl).text(SheetLanguages.Current.ChildSchema + "(" + index + ")");
                });
            };
            RebindChildSchemaEvents();

            var MobileIndexChange = function (index, type) {
                var indexEle = $(that.Element).find("ion-scroll");
                if (type == "delete") {
                    var button = $(indexEle[1]).find("button");
                    button[index].remove();
                    button = $(indexEle[1]).find("button");
                    for (var i = 0; i < button.length; i++) {
                        $(button[i]).attr("id", that.DataField + (i + 1)).attr("index", i).text(i + 1);
                    }
                    var rows = $(that.Element).find("div.slider-slide");
                    for (var i = 0; i < rows.length; i++) {
                        $(rows[i]).attr("data-row", i + 1);
                    }
                    $(button[index]).addClass("button-blue");
                }
                else {
                    var button = $(indexEle[0]).find("button").clone(true);
                    if ($(indexEle[1]).find("button").length == 0) {
                        $($(indexEle[1]).find("div.scroll")).append(button);
                        $(button).addClass("button-blue");
                        that.ShowMobileData(0)
                    } else {
                        $($(indexEle[1]).find("button:last")).after(button);
                        if (type == "add") {
                            that.ShowMobileData(that.RowCount - 1);
                        } else {
                            that.ShowMobileData(index + 1);
                        }
                    }
                    $(button).attr('index', that.RowCount - 1).attr('id', that.DataField).text(that.RowCount);
                    $(button).unbind("click.switch").bind("click.switch", [that], function (e) {
                        e.data[0].MobileIndexButtonClick(this);
                    })
                }

                //var txt = $(that.Element).parent().attr("data-title") || that.DataItem.N;
                //txt = txt + "(共 " + $(indexEle[1]).find("button").length + " 条纪录)";
                var txt = that.DataItem.N + SheetLanguages.Current.ChildSchemaInfo2 + $(indexEle[1]).find("button").length + SheetLanguages.Current.ChildSchemaInfo3;
                that.title.find('span').text(txt);
                $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.$getByHandle(that.DataField).resize();
            }
            if (!this.DisplayAdd || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {    //添加按钮
                $(this.Element).find("div[class='buttons-right']").css("display", "none");
                //$(this.copybtn).css("display", "none");
                //$(this.addbtn).css("display", "none");
                $(this.Element).find('.copy').css('display', "none");
                $(this.Element).find('.addbtn').css('display', 'none');
                //删除复制按钮被子表的复制删除按钮代替
                console.log(this.Element);
            }
            if (!this.DisplayDelete || this.L == $.MvcSheetUI.LogicType.BizObject || !this.Editable) {    //删除按钮
                //$(this.delebtn).css("display", "none");
                $(this.Element).find('.delete').css('display', "none");
            }
            // 子表展现完成后事件
            if (this.OnRendered) {
                this.RunScript(this, this.OnRendered, arguments);
            }

            //添加默认行
            if ($.MvcSheetUI.SheetInfo.IsOriginateMode) {
                for (var i = 1; i < this.DefaultRowCount; i++) {
                    this._AddMobileRow();
                    RebindChildSchemaEvents();
                    MobileIndexChange(this.currentIndex, "add");
                }
                //初始化导航
                this.ShowMobileData(0);
            }

            //设置移动端2种按钮是否显示
            this.SetVisible();
        },
        //初始化索引
        InitMobileIndex: function (currentIndex) {
            var that = this;
            this.currentIndex = currentIndex || 0;
            var indexEle = $(this.Element).find("ion-scroll");
            var value = this.V.R;
            //区分关联关系
            var length = 0;
            if (this.IsAssociation) {
                length = 1;
            } else {
                length = this.V.R.length;
            }
            if (this.Originate && this.DefaultRowCount < 1) {
                return;
            }
            for (var i = 1; i < length + 1; i++) {
                var button = $("<button>").addClass("button button-small").attr("id", (this.DataField + "-" + i)).attr("type", "button").attr('index', (i - 1)).text(i);
                $(indexEle[1]).append(button);
                $(button).unbind("click.switch").bind("click.switch", [this], function (e) {
                    e.data[0].MobileIndexButtonClick(this);
                })
            }
            $($(indexEle[1]).find("button")[this.currentIndex]).addClass("button-blue");
        },
        //绑定导航点击事件
        MobileIndexButtonClick: function (element) {
            var index = Number($(element).attr('index'));
            var indexEle = $(element).closest("ion-scroll");
            //$($(indexEle[1]).find("button")[this.currentIndex]).removeClass("button-blue");
            $($(indexEle[0]).find("button")).removeClass("button-blue");
            $($(indexEle[0]).find("button")[index]).addClass("button-blue");
            this.ShowMobileData(index);
        },
        ShowMobileData: function (showIndex) {
            var dataEle = $(this.Element).find("div[class='slider-slide']");
            if (dataEle.length == 0) return;
            var indexEle = $(this.Element).find("ion-scroll");
            var delegate = $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.$getByHandle(this.DataField);
            $($(indexEle[1]).find("button")[this.currentIndex]).removeClass("button-blue");
            $($(indexEle[1]).find("button")[showIndex]).addClass("button-blue");
            //数据显示
            $(dataEle[this.currentIndex]).hide();
            $(dataEle[showIndex]).show();
            this.currentIndex = showIndex;
            //导航栏偏移量
            var ele = $(indexEle[1]).find("button")[showIndex];
            this.SetNavPosition(ele)
        },
        //设置导航位置
        SetNavPosition: function (ele) {
            var delegate = $.MvcSheetUI.IonicFramework.$ionicScrollDelegate.$getByHandle(this.DataField);
            var delegateLeft = delegate.getScrollPosition().left;
            var left = $(ele).offset().left;
            delegate.scrollTo(delegateLeft - 120 + left, 0, true);
        },
        _AddMobileRow: function (e) {
            //移动端添加行：三种情况
            /*   参数：无参/1个（id）/2个（插入行，是否复制）
            1、直接添加：添加在最后一行
            2、复制插入：插入有数据的行
            2、直接插入：插入空白行
            */
            var that = this;
            if (!this.MobileRows) {
                this.MobileRows = [];
            }

            var thisGridView = this;
            if (this.OnPreAdd) {
                this.RunScript($(this.Element), this.OnPreAdd, arguments);
            }

            getTrValue = function (rowIndex) {
                var trvalue = {};
                var row = thisGridView.MobileRows[rowIndex];
                var controls = row.Editors;
                for (var j = 0; j < controls.length; j++) {
                    var control = controls[j];
                    if (control) {
                        var datafield = control.DataField;
                        if (datafield)
                            trvalue[datafield.split(".")[1]] = control.GetValue();
                    }
                }
                if (row.id) {
                    trvalue["ObjectID"] = row.id;
                }
                return trvalue;
            }

            //移动端添加行事件
            MobileRowCtor = function (_RowTemplate, _RowIndex, _RowNum, _Element, _id, _copy) {
                this.RowControl = $(_RowTemplate).clone().attr("data-row", _RowIndex).attr("id", _id);
                this.RowControl.find("[data-datafield]").attr("data-row", _RowIndex);
                if (_RowIndex != _RowNum && $(_Element).find("div[class='slider-slide']").length > 0) {
                    //插入
                    $($(_Element).find("div[class='slider-slide']")[_RowIndex - 2]).after(this.RowControl);
                } else {
                    $(_Element).find("div[class='slider-slides']").append(this.RowControl);
                }
                $.MvcSheetUI.IonicFramework.$compile($(this.RowControl))($.MvcSheetUI.IonicFramework.$scope);
                var _Editors = [];


                //计算规则需要hxc
                this.RowControl.attr("data-rownum", that.RowNum);
                this.RowControl.find("div.list").each(function () {
                    var control = $(this).children(":last").children();
                    if ($(control).attr("id")) {
                        var id = $(control).attr("id");
                        id = id + "_Row" + that.RowNum;
                        $(control).attr("id", id);
                        $(control).attr("data-rownum", that.RowNum);
                    }
                    if (_copy) {
                        var trValue = getTrValue(_RowIndex - 2);
                        var c = $(control).SheetUIManager(_RowNum);
                        var value = trValue[c.DataField.split(".")[1]];
                        c.SetValue(value);
                    }
                    _Editors.push($(control).SheetUIManager(_RowNum));
                });
                this.Editors = _Editors;
                return this;
            }


            var id;
            var newRow;
            var RowIndex;
            if (arguments && arguments.length == 1) {
                var guid = arguments[0]; id = guid;
                RowIndex = this.RowCount + 1;
                newRow = new MobileRowCtor(this.MobileRow, RowIndex, ++this.RowNum, this.Element, id, false);
            } else if (arguments && arguments.length == 2) {
                //插入（复制/添加）
                id = $.uuid();
                RowIndex = this.currentIndex + 2;
                newRow = new MobileRowCtor(this.MobileRow, RowIndex, ++this.RowNum, this.Element, id, arguments[1]);
            }
            else {
                //末尾添加新行
                id = $.uuid();
                RowIndex = this.RowCount + 1;
                newRow = new MobileRowCtor(this.MobileRow, RowIndex, ++this.RowNum, this.Element, id, false);
            }

            if (this.OnAdded) {
                this.RunScript($(this.Element), this.OnAdded, [this, this.V.R[this.RowCount]]);
            }


            ++this.RowCount;
            var num = this.RowCount;

            this.MobileRows.splice(RowIndex - 1, 0, newRow);

            //添加行的时候，重新初始化Rule
            if ($.MvcSheetUI.MvcRuntime && !$.MvcSheetUI.Loading) {
                // debugger
                $.MvcSheetUI.MvcRuntime.Run($("body"));
            }

        },
        _InsertMobileRow: function (e) {
            var insertIndex = this.currentIndex + 1;
            var rows = $(this.Element).find("div.slider-slide");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var rownum = parseInt($(row).attr("data-row"));
                if (rownum > insertIndex) {
                    rownum = rownum - 1 + 2;
                    $(row).attr("data-row", rownum);
                    $(row).find("[data-row]").attr("data-row", rownum);
                    if ($(row).find("td:first").html() == rownum - 1)
                        $(row).find("td:first").html(rownum);
                }
            };
            this._AddMobileRow(arguments[0], arguments[1]);
        },
        GetChildrenTd: function (tds) {
            var control = $(tds).find("[data-field]");
            //qiancheng 修改移动端能够显示PC端已经隐藏的字段
            var td;
            if ($(tds).attr("class")) {
                if ($(tds).attr("class").indexOf("hidden") != -1) {
                    td = $("<div></div>").addClass("list hidden").attr("type", "item-text-wrap");
                } else {
                    td = $("<div></div>").addClass("list").attr("type", "item-text-wrap");
                }

            } else {
                td = $("<div></div>").addClass("list").attr("type", "item-text-wrap");
            }


            var datafield = $(control).attr("data-field");
            $(control).removeAttr("data-field").attr("data-datafield", datafield);
            $(td).attr("data-field", datafield);
            var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, 1);
            if (dataitem)
                $(td).append($("<div></div>").addClass("col-md-2").append($("<label>" + dataitem.N + "</label>")));
            $(td).append($("<div></div>").addClass("col-md-4").append($(control)));
            $(this.MobileRow).append(td);
        },

        // 设置行只读
        SetRowReadOnly: function (rowIndex) {
            if (rowIndex < this.V.R.length) {
                for (var k in this.V.R[rowIndex].DataItems) {
                    this.V.R[rowIndex].DataItems[k].O = this.V.R[rowIndex].DataItems[k].O.replace("E", "");
                }
            }
        },
        _AddRow: function (e) {
            // debugger
            if (!this.SheetInfo.BizObject.DataItems[this.DataField].V.R) {
                this.TransferValue();
            }

            var rowIndex = this.RowCount;
            if (this.OnPreAdd) {
                this.RunScript($(this.Element), this.OnPreAdd, [this, rowIndex]);
            }
            //执行绑定事件            
            this.newRow = this.template.clone(true).attr("class", "rows").attr("data-row", this.RowCount + 1).removeAttr("style", "display:none");
            $(this.newRow).find("td").each(function () {
                var childrenElement = $(this).find("[data-field]");
                var field = childrenElement.attr("data-field");
                childrenElement.removeAttr("data-field").attr("data-datafield", field);
                childrenElement.attr("data-row", $(this).closest("tr").attr("data-row"));
            });
            if (this.L == $.MvcSheetUI.LogicType.BizObjectArray) {
                if (this.newRow.length > 1) {
                    $($(this.newRow)[0]).find("td:first").html(++this.RowCount);
                }
                else {
                    $(this.newRow).find("td:first").html(++this.RowCount);
                }
            }


            if (arguments && arguments.length == 1) {
                var guid = arguments[0];
                $(this.newRow).attr("id", guid);
            }

            if (arguments.length > 1) {
                var rownums = $(arguments[1]).attr("data-row") - 1 + 2;
                this.newRow.attr("data-row", rownums);
                if (this.newRow.length > 1) {
                    $($(this.newRow)[0]).find("td:first").html(rownums);
                    var insertr;
                    for (var i = 0; i < this.newRow.length; i++) {
                        insertr = $(arguments[1]).next("tr");
                    }
                    $(insertr).after(this.newRow);
                }
                else {
                    $(this.newRow).find("td:first").html(rownums);
                    $(arguments[1]).after(this.newRow);
                }
            }
            else {
                if ($(this.Element).find("tr.rows").length == 0) {
                    if (this.template.length > 1) {
                        $($(this.template)[this.template.length - 1]).after(this.newRow);
                    }
                    else {
                        $(this.template).after(this.newRow);
                    }
                }
                else {
                    $(this.Element).find("tr.rows:last").after(this.newRow);
                }
            }

            ++this.RowNum;
            var num = this.RowCount;
            var that = this;
            $(this.newRow).find("td").each(function () {
                var control = $(this).children();
                if ($(control).attr("id")) {
                    var id = $(control).attr("id");
                    id = id + "_Row" + that.RowNum;
                    $(control).attr("id", id);
                }
                var cmanager = $(control).SheetUIManager(that.RowCount);
            });

            //计算规则有用 hxc
            $(this.newRow).attr("data-rownum", that.RowNum);
            $(this.newRow).find("td").each(function () {
                var childrenElement = $(this).find("[data-datafield]");
                childrenElement.attr("data-rownum", that.RowNum);
                //console.log(that.RowNum);
            });



            if (this.AlternatingRowStyle && num % 2 == 0) {
                $(this.newRow).attr("style", this.AlternatingRowStyle);
            }

            var tds = $(this.newRow).find("td");
            for (var i = 0; i < tds.length; i++) {
                var td = tds[i];
                if (this.GetSummaryTd(td)) {
                    $(td).children().unbind("change.Summary").bind("change.Summary", [this], function (e) {
                        e.data[0]._Summary(this);
                    });
                }
            }


            if ($.MvcSheetUI.MvcRuntime && !$.MvcSheetUI.Loading) {
                $.MvcSheetUI.MvcRuntime.Run($("body"));
            }


            //绑定删除事件
            var delbtn = $(this.newRow).find("a.delete");
            $(delbtn).unbind("click").bind("click", [this], function (e) {
                e.data[0]._Deleterow($(this).closest("tr"));
            });
            //绑定插入事件
            var insertbtn = $(this.newRow).find("a.insert");
            $(insertbtn).unbind("click").bind("click", [this], function (e) {
                e.data[0]._Insertrow($(this).closest("tr"));
            });
            if (this.OnAdded) {
                this.RunScript($(this.newRow), this.OnAdded, [this, this.V.R[rowIndex], rowIndex]);
            }
            if (this.VirtualPaging) {
                this._SetVirtualPagingContainerHeight();

                var tdHead = $(this.Element).parent(".SheetGridViewData").siblings(".SheetGridViewTitle").find("tr.header td");
                $(this.Element).find("tr.rows").eq(0).find("td").each(function (i, e) {
                    if ($(e).children().attr("data-displayrule")) {
                        $(e).children().addClass("block");
                    }
                    tdHead.eq(i).css("width", $(e).outerWidth(true));
                })
                if (this.Element.parentElement.getAttribute("scroll") == "scroll") {
                } else {
                    //$(this.Element).find("tr[class='rows']:last").find("td input:first").focus();
                    var a = $(this.Element).find("tr[class='rows']:last").find("td:first").next();
                    if (a.find("input").length > 0) {
                        a.find("input").each(function () {
                            if ($(this).closest("div").data("type") != "SheetUser") {
                                a.find("input").focus();
                            }
                        });
                    } else if (a.find("textarea").length > 0) {
                        a.find("textarea").focus();
                    } else if (a.find("select").length > 0) {
                        a.find("select").focus();
                    }
                }
            }

        },
        _Deleterow: function (deleterow, isRemoveAll) {
            var delnum = parseInt($(deleterow).attr("data-row"));

            if (this.OnPreRemove) {
                this.RunScript($(deleterow), this.OnPreRemove);
            }
            // 清除 ControlManagers 的内容
            $(deleterow).find("[data-datafield]").each(function (index, control) {
                var id = $(this).data($.MvcSheetUI.SheetIDKey);
                if (id && $.MvcSheetUI.ControlManagers[id]) {
                    delete $.MvcSheetUI.ControlManagers[id];
                }
            });
            $(deleterow).remove();
            var rows = $(this.Element).find("tr.rows");
            // 重新计算行
            if (typeof (isRemoveAll) == "undefined" || !isRemoveAll) {
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    if ($(row).attr("data-row") == delnum) {
                        $(row).remove();
                    }

                    var rownum = parseInt($(row).attr("data-row"));
                    if (rownum > delnum) {
                        if (this.AlternatingRowStyle) {
                            if (rownum % 2 == 1) {
                                $(row).attr("style", this.AlternatingRowStyle);
                            } else {
                                $(row).attr("style", "");
                            }
                        }

                        $(row).attr("data-row", rownum - 1);

                        if ($(row).find("td:first").html() == rownum)
                            $(row).find("td:first").html(rownum - 1);

                        $(row).find("td").each(function () {
                            if ($(this).attr("data-title"))
                                $(this).attr("data-title", rownum - 1);
                            if ($(this).children() && $(this).find("[data-datafield]"))
                                $(this).find("[data-datafield]").attr("data-row", rownum - 1);
                        });
                    }
                }

                var tds = $(this.template).find("td");
                for (var i = 0; i < tds.length; i++) {
                    if (this.GetSummaryTd(tds[i])) {
                        this._Summary($(tds[i]).children());
                    }
                }
            }

            this.RowCount = this.RowCount - 1;

            if (this.OnRemoved) {
                this.RunScript($(deleterow), this.OnRemoved);
            }
            if (typeof (isRemoveAll) == "undefined" || !isRemoveAll) {
                //删除行的时候，重新初始化Rule
                if ($.MvcSheetUI.MvcRuntime && !$.MvcSheetUI.Loading) {
                    $.MvcSheetUI.MvcRuntime.init();
                }
            }

            if (this.VirtualPaging) {
                this._SetVirtualPagingContainerHeight();
                //虚拟分页，删除行重新设置表头宽度对齐
                if (!$(this.Element).find("tr.rows").length && !$(this.Element).find("tr.footer").is(":hidden")) {
                    var tdHead = $(this.Element).parent(".SheetGridViewData").siblings(".SheetGridViewTitle").find("tr.header td");
                    $(this.Element).find("tr.footer").eq(0).find("td").each(function (i, e) {
                        tdHead.eq(i).css("width", $(e).outerWidth(true));
                    });
                }
            }
        },

        _Insertrow: function (nowrow) {
            var insertnum = parseInt($(nowrow).attr("data-row"));
            var rows = $(this.Element).find("tr.rows");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var rownum = parseInt($(row).attr("data-row"));
                if (rownum > insertnum) {
                    rownum = rownum - 1 + 2;
                    $(row).attr("data-row", rownum);
                    if ($(row).find("td:first").html() == rownum - 1)
                        $(row).find("td:first").html(rownum);
                }
            };
            this._AddRow(true, nowrow);
        },

        _Clear: function (e) {
            var that = this;
            $(this.Element).find("tr.rows").each(function (e) {
                that._Deleterow.apply(that, [$(this), true]);
            });
            this.RowCount = 0;
            // 重新计算统计
            var tds = $(this.template).find("td");
            for (var i = 0; i < tds.length; i++) {
                if (this.GetSummaryTd(tds[i])) {
                    this._Summary($(tds[i]).children());
                }
            }

            if (this.VirtualPaging)
                this._SetVirtualPagingContainerHeight();
        },

        //虚拟分页 删除，添加行divDataTableContainer高度重新计算
        _SetVirtualPagingContainerHeight: function () {
            $(this.Element).parent(".SheetGridViewData").niceScroll({ cursorcolor: "#CCC", cursoropacitymax: 0.8, autohidemode: false, cursorwidth: "10px", cursorminheight: "40" }).resize();
            var dataTable = this.Element;//主体table
            var dataContainerDiv = this.Element.parentElement;//主体Div,每个子表都是设置的

            var dataTableHeight = $(dataTable).height();
            var dataContainerDivHeight = this.dataContainerDivHeight;
            dataContainerDivHeight = dataTableHeight > dataContainerDivHeight ? dataContainerDivHeight : dataTableHeight;

            $(dataContainerDiv).css("height", dataContainerDivHeight + 25);
            $(dataContainerDiv.parentElement).css("height", 130 + dataContainerDivHeight);//100是给表头预留的位置
        },

        _Export: function (e) {
            var columnNames = {};
            if (this.VirtualPaging) {
                var tds = $(this.Element).parent().parent().find("tr.header").find("td");
            } else {
                var tds = $(this.Element).find("tr.header").find("td");
            }
            //var tds = $(this.Element).find("tr.header").find("td");
            for (var i = 0; i < tds.length; i++) {
                var datafield = $(tds[i]).attr("data-field");
                if (datafield) {
                    var dataitem = $.MvcSheetUI.GetSheetDataItem(datafield, 1);
                    if (dataitem) {
                        columnNames[datafield.split(".")[1]] = dataitem.N;
                    }
                }
            }
            var datatab = this.GetValue(true);

            if (this.VirtualPaging) {
                var LoadData = this.pageIndex * this.loadNum;
                var AllValue = this.V.R;
                if (LoadData < AllValue.length && LoadData != 0) {
                    var notShowData = this.GetNotShowData(LoadData, "Export");
                    if (notShowData.length > 0) {
                        for (var i = 0; i < notShowData.length; i++) {
                            datatab.push(notShowData[i]);
                        }
                    }
                }
            }

            $.MvcSheet.PostSheet({ "Command": "Exportexcel", "Param": JSON.stringify([datatab, columnNames]) },
                        function (data) {
                            if (data)
                                window.location.href = data;
                        }, null, true);
        },

        _Import: function (e) {

            var thisElement = this;
            $.ajaxFileUpload({
                url: $.MvcSheetUI.PortalRoot + "/ImportHandler/ImportHandler",
                secureuri: false,
                fileElementId: "importExcel_" + this.ButtonId,
                dataType: "json",
                async: true,
                success: function (data, status) {
                    if (data.length > 0) {

                        //导入后重新计算pageIndex，防止在加载数据
                        if (this.VirtualPaging) {
                            this.pageIndex = Math.ceil(data.length / this.loadNum);
                        }
                        var _measure_start = performance.now();
                        thisElement._ImportInit.apply(thisElement, [data]);
                        var _measure_end = performance.now();
                        console.log(" load time : " + (_measure_end - _measure_start) + "ms");
                        $.LoadingMask.Hide();
                    } else {
                        switch (data.Message) {
                            case "SelectFile":
                                alert(SheetLanguages.Current.Uploading);
                                break;
                            case "Import_InvilidateFile":
                                alert(SheetLanguages.Current.FileExtError);
                                break
                        }
                        $.LoadingMask.Hide();
                    }
                },
                error: function (e) {
                    $.LoadingMask.Hide();
                }
            });
        },

        _ImportInit: function (data) {
            $.MvcSheetUI.Loading = true;
            var rowdata;
            var tds;
            var i;
            var y;
            var tdsTemp;
            var TempValue;
            var k;
            var row;
            for (i = 0; i < data.length; i++) {
                row = data[i];
                this._AddRow();
                rowdata = row.split('|');
                tds = $(this.newRow).find("td");
                k = 0;
                for (y = 0; y < tds.length; y++) {
                    tdsTemp = $(tds[y]).find("[data-datafield]");
                    //debugger
                    if (tdsTemp && tdsTemp.length > 0 && $(tds[y]).is(':visible')) {
                        if (rowdata[k] != undefined) {
                            TempValue = rowdata[k];
                            if (rowdata[k].indexOf("[") != -1 && rowdata[k].indexOf("]") != -1) {
                                TempValue = JSON.parse(rowdata[k]);
                            }

                            var manager = tdsTemp.SheetUIManager(i + 1);
                            if (manager instanceof $.MvcSheetUI.Controls.SheetTimeSpan) {
                                //时间段格式有误
                                var matches = TempValue.match(/(\d+)/g);
                                TempValue = matches[0] + "." + matches[1] + ":" + matches[2] + ":" + matches[3];
                            }
                            manager.SetValue(TempValue);
                            //if (this.GetSummaryTd(tds[y])) {
                            //    this._Summary(tdsTemp);
                            //} 
                            k++;
                        }
                    }
                }
            }
            $.MvcSheetUI.Loading = false;
            $.MvcSheetUI.MvcRuntime.Run($("body"));
        },

        GetDefaultRow: function (trvalue) {
            var tds = $(this.Element).parent().parent().find("tr.header").find("td");
            trvalue.push("ObjectID");
            for (var j = 0; j < tds.length; j++) {
                var datafield = $(tds[j]).attr("data-field");
                if (datafield) {
                    var tdName = datafield.split(".")[1];
                    trvalue.push(tdName);
                }
            }
            return trvalue;
        },

        GetNotShowData: function (LoadData, callmode) {
            //debugger
            var value = [];
            var AllValue = this.V.R;
            if (LoadData < AllValue.length) {
                var parentDatafield = $(this.Element).attr("data-datafield");
                var tdTitle = [];
                tdTitle = this.GetDefaultRow(tdTitle);
                //循环行
                for (var i = LoadData; i < AllValue.length; i++) {
                    var rowvalue = {};
                    var data = AllValue[i].DataItems;
                    //循环列
                    for (var item in tdTitle) {
                        var itemkey = tdTitle[item];
                        if (data[parentDatafield + "." + itemkey] == undefined) continue;
                        if (data[parentDatafield + "." + itemkey].L == 24) {//附件
                            if (callmode == "save") {
                                var attach = data[parentDatafield + "." + itemkey].V;
                                var rowAttachment = {};
                                var AttachmentIds = "";
                                var DelAttachmentIds = "";
                                if (attach.length > 0) {
                                    for (var j = 0; j < attach.length; j++) {
                                        AttachmentIds = AttachmentIds + attach[j].Code + ";";
                                    }
                                }
                                rowAttachment["AttachmentIds"] = AttachmentIds;
                                rowAttachment["DelAttachmentIds"] = DelAttachmentIds;

                                rowvalue[itemkey] = rowAttachment;
                            }
                            else {
                                rowvalue[itemkey] = "";
                            }

                        }
                        else if (data[parentDatafield + "." + itemkey].L == 26) {//单人参与者
                            var itemvalue;
                            itemvalue = data[parentDatafield + "." + itemkey].V == null ? "" : data[parentDatafield + "." + itemkey].V;//.Code;
                            rowvalue[itemkey] = itemvalue;
                        }
                        else if (data[parentDatafield + "." + itemkey].L == 27) {//多人参与者
                            var itemvalue = new Array();
                            var users = data[parentDatafield + "." + itemkey].V;
                            if (users == "" || users == null) {
                                rowvalue[itemkey] = "";
                            }
                            else if (users.length > 0) {
                                for (var j = 0; j < users.length; j++) {
                                    var code = users[j].Code;
                                    itemvalue.push(code);
                                }
                                rowvalue[itemkey] = itemvalue;
                            }

                        }
                        else {
                            var itemvalue;
                            itemvalue = data[parentDatafield + "." + itemkey].V == null ? "" : data[parentDatafield + "." + itemkey].V;
                            rowvalue[itemkey] = itemvalue;
                        }
                    }
                    value.push(rowvalue);
                }
            }
            return value;
        },

        TransferValue: function () {
            if (this.originateValue == null) return;
            //TODO:将this.SheetInfo.BizObject.DataItems[this.DataFiled].V转为this.originateValue
            var sheetDataValue = this.SheetInfo.BizObject.DataItems[this.DataField].V;
            var originateValue = this.originateValue;

            var transferRowValue = [];
            for (var i = 0; i < sheetDataValue.length; i++) {
                transferRowValue.push(JSON.parse(JSON.stringify(this.originateValue.R[0])));
            }

            for (var i = 0; i < sheetDataValue.length; i++) {
                var oldRoeValue = sheetDataValue[i];
                for (var column in transferRowValue[0].DataItems) {
                    var shortColumn = column.split(".")[1];
                    transferRowValue[i].DataItems[column].V = oldRoeValue[shortColumn];
                    delete transferRowValue[i].DataItems[column].BizObjectID;
                    delete transferRowValue[i].DataItems[column].RoeNum;
                }
            }
            var newStructure = {};
            newStructure["R"] = transferRowValue;
            newStructure["T"] = originateValue.T;
            this.SheetInfo.BizObject.DataItems[this.DataField].V = newStructure;
        },

        SaveDataField: function () {
            if (this.originateValue == null)
                this.originateValue = this.SheetInfo.BizObject.DataItems[this.DataField].V;

            var result = {};
            if (!this.Visiable || !this.Editable) return result;
            result[this.DataField] = this.SheetInfo.BizObject.DataItems[this.DataField];
            if (!result[this.DataField]) {
                alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField);
                return {};
            }
            var value = this.GetValue();

            if (this.VirtualPaging) {
                var LoadData = this.pageIndex * this.loadNum;
                var AllValue = this.V.R;
                if (LoadData < AllValue.length && LoadData != 0) {
                    var notShowData = this.GetNotShowData(LoadData, "save");
                    if (notShowData.length > 0) {
                        for (var i = 0; i < notShowData.length; i++) {
                            value.push(notShowData[i]);
                        }
                    }
                }
            }
            if (result[this.DataField].V != value) {
                var T = result[this.DataField].V.T;
                result[this.DataField].V = value;

                result[this.DataField].V.T = T;
                return result;
            }
            return {};
        }

    });
})(jQuery);