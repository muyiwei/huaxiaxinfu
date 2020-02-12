//表格对话框的插件
; (function ($) {
    $.fn.TabDialog = function (options) {
        var defaults = {
            initalEvent: function () { }, //初始化事件
            submitEvent: function () { }, //点击确定后事件
            cancelEvent: function () { },  //点击取消后事件
        }
        var options = $.extend(defaults, options);

        this.each(function () {
            var _this = $(this);

            //关闭事件
            _this.find(".close").click(function (e) {
                e.stopPropagation();
                //隐藏弹出窗口
                _this.hide();
                $("#screen").hide();

                //外部取消事件
                if (options.cancelEvent) {
                    options.cancelEvent();
                }
            });
            //文本框回车事件
            _this.find("input[type='text']").keydown(function (e) {
                e.stopPropagation();
                if (e.keyCode == 13) {
                    _this.find(".submit").click();
                    e.returnValue = null;
                    window.returnValue = null;
                }
            });
            //确定事件
            _this.find(".submit").click(function (e) {
                e.stopPropagation();
                if (options.submitEvent) {
                    options.submitEvent();
                }
            });

            return _this;
        });
    };
})(jQuery);

var TableLogic = function () {

    this.SelectedTabCell = null;  //当前选中的单元格
    this.SelectedTab = null;  //保存要在下方插入的当前表格
    this.SelectedTabCellArray = []; //保存按照Ctrl键选择的单元格
    this.TabMenu = tabMenu;  //表格功能菜单 HTML

    this.Controls = {
        txtNo: $("#txtNo"), //表格编号
        txtRows: $("#txtRows"), //表格行数
        txtCloumns: $("#txtCloumns"), //表格列数
        txtTabStyle: $("#txtTabStyle"), //表格样式名称

        content_m1: $(".content_m1"), //设计区域
        f_tab_ID: "f_tab", //插入表格面板ID
        f_tab: $("#f_tab"), //插入表格面板
        tab: $(".tab"), //工具栏插入表格链接
        screen: $("#screen"), //全屏遮罩层
        f_splitTab: $("#f_splitTab"),  //拆分表格面板
        txtCellNum: $("#txtCellNum")  //拆分单元格数量文本框
    };

    //初始化
    this.Initial();
};

TableLogic.prototype = {

    //初始化
    Initial: function () {
        this._bindInsertNewTab();
        this._bindSaveTab();
        this._initialSysTab();
        this._bindSplitTabCell();
    },

    //绑定插入表格功能
    _bindInsertNewTab: function () {

        //在设计区域右键插入表格功能
        this.Controls.content_m1.contextMenu('newTabMenu', {
            bindings: {
                "tab": function (t) {
                    var _this = Designer.TabLogic; //获取当前设计器的表格逻辑对象
                    _this.SelectedTabCell = null;
                    _this.LoadFunction(_this.Controls.f_tab_ID, 1);
                    return;
                }
            }
        });

        //工具栏插入表格链接事件
        this.Controls.tab.click(function () {
            var _this = Designer.TabLogic; //获取当前设计器的表格逻辑对象
            _this.LoadFunction(_this.Controls.f_tab_ID, 1);
        });

    },

    //绑定保存表格功能
    _bindSaveTab: function () {
        this.Controls.f_tab.TabDialog({
            //保存按钮事件
            submitEvent: function () {

                var _this = Designer.TabLogic; //获取当前设计器的表格逻辑对象
                var tabId = _this.Controls.txtNo.val();
                var rows = _this.Controls.txtRows.val();
                var columns = _this.Controls.txtCloumns.val();
                var tabClass = _this.Controls.txtTabStyle.val();

                //验证是否是正整数
                var re = /^[1-9]+[0-9]*]*$/;
                if (!re.test(rows) || !re.test(columns)) {
                    alert("行数和列数请输入正整数！");
                    return;
                }

                //如果是新增
                if (!_this.Controls.txtNo.attr("disabled")) {
                    //插入生成的表格
                    var tab = _this._GenerateTab(tabId, rows, columns, tabClass);
                    //如果是插入子表
                    if (_this.SelectedTabCell) {  //当前选中的单元格不为空
                        if (!_this.SelectedTab) {  //单元格首次插入子表格
                            $(_this.SelectedTabCell).css("padding-left", "0px");
                            $(_this.SelectedTabCell).append($(tab));
                            //移除父拖拽功能；
                            // $(_this.SelectedTabCell).droppable({ disabled: true });
                            $(_this.SelectedTabCell).children("table").TabDroppable();
                        }
                        else {  //在单元格内表格下方插入表格
                            $(tab).insertAfter($(_this.SelectedTab));
                            $(_this.SelectedTab).next().TabDroppable();
                            _this.SelectedTab = null;
                        }
                    }
                    else {
                        //如果父对象不为空,表示在设计器区域内在下方插入表格
                        if (_this.SelectedTab) {
                            $(tab).insertAfter($(_this.SelectedTab));
                            $(_this.SelectedTab).next().TabDroppable();
                            _this.SelectedTab = null;
                        }
                        else {  //直接在设计区域内插入表格
                            _this.Controls.content_m1.append($(tab));
                            _this.Controls.content_m1.find("table[type='0']:last").TabDroppable();
                        }
                    }
                }
                    //如果是编辑
                else {
                    if (tabClass != null) {
                        $("#" + tabId).removeAttr("class");
                        $("#" + tabId).addClass(tabClass);
                    }
                }

                //赋值Tab属性
                var tabProperty = {
                    TabId: tabId,
                    Rows: rows,
                    Columns: columns,
                    TabClass: tabClass
                };
                $("#" + tabId).attr("tabproperty", JSON.stringify(tabProperty));

                //隐藏
                _this.Controls.screen.hide();
                _this.Controls.f_tab.hide();

                // 重新绑定可拖拽事件
                Designer.BasicPropertyWindow.ResetDragReceive();
            }
        });
    },

    //初始化默认表格
    _initialSysTab: function () {
        if ($("table[id$='tbTable']").next().attr("class") != "tabMenu") {  //编辑的时候默认后台就已经有了
            // $(this.TabMenu).insertAfter($(".tableStyle"));
            //赋值Tab属性
            var tabProperty = {
                TabId: 'tbTable',
                Rows: '',
                Columns: '',
                TabClass: 'tableStyle'
            };
            $("table[id$='tbTable']").attr("tabproperty", JSON.stringify(tabProperty));
            //赋值SheetTab属性
            var tabProperty1 = {
                TabId: 'SheetTable',
                Rows: '',
                Columns: '',
                TabClass: ''
            };
            $("table[id$='SheetTable']").attr("tabproperty", JSON.stringify(tabProperty1));
        }
    },

    //绑定分割单元格功能
    _bindSplitTabCell: function () {
        this.Controls.f_splitTab.TabDialog({
            submitEvent: function () {
                var _this = Designer.TabLogic;
                if (_this.SelectedTabCell == null) return;
                var val = _this.Controls.txtCellNum.val();

                if (val == "") {
                    alert("请输入拆分列数量！");
                    return;
                }

                //验证是否是正整数
                var re = /^[1-9]+[0-9]*]*$/;
                if (!re.test(val)) {
                    alert("请输入正整数！");
                    return;
                }

                //要拆分的单元格数量
                var num = parseInt(val);
                //目标单元格
                var _td = $(_this.SelectedTabCell);
                //目标单元格所在的行
                var _tr = _td.parent();
                //目标单元格所在的表格
                var _table = _td.parents("table").eq(0);
                //计算当前单元格所在的列号（包括colspan)
                var _tdIndexColspan = 0;
                //计算当前所在的行
                var _trIndex = _table.children("tbody").children("tr").index(_tr);
                //计算当前单元格所在的列号（不包括colspan)
                var _tdIndex = _tr.children().index(_td);
                var _colspan = _td.attr("colspan");

                //1.计算该行内所有单元格colspan,包括拆分的单元格
                var _tdTotalColspan = 0;
                _tr.children().each(function (i) {
                    var colspan = $(this).attr("colspan");
                    if (i != _tdIndex) {
                        _tdTotalColspan += colspan;
                    }
                });
                var b = 0;
                if (_colspan <= num) b = num;
                if (_colspan > num) b = _colspan;

                _tdTotalColspan += b; //添加拆分后的总数

                //2.计算该单元格在该行内的colspan
                _tr.children().each(function (i) {
                    var colspan = $(this).attr("colspan");
                    if (i < _tdIndex) {
                        _tdIndexColspan += colspan;
                    }
                });
                _tdIndexColspan = _tdIndexColspan + 1;

                //3.保存表格内相同列号的单元格数组
                var tempCells = [];
                _table.children("tbody").children("tr").each(function (se) {
                    if (se != _trIndex) {
                        var seq = 0;
                        $(this).children().each(function () {
                            var colspan = $(this).attr("colspan");
                            seq += colspan;
                            if (seq >= _tdIndexColspan) {
                                tempCells.push($(this));
                                return false;
                            }
                        });
                    }
                });

                //4.先拆分本地单元格
                var _splitHtml = "";
                for (var i = 0; i < num - 1; i++) {
                    _splitHtml += "<td class='tdData'></td>";
                }

                if (_colspan > 1) {
                    if (_colspan <= num) {
                        _td.attr("colspan", 1);
                    }
                    else {
                        _td.attr("colspan", _colspan - (num - 1));
                    }
                }

                //插入拆分单元格在该单元格后面
                $(_splitHtml).insertAfter(_td);

                for (var i = 0; i < tempCells.length; i++) {

                    var colspan = tempCells[i].attr("colspan");
                    var _totalSpan = 0;
                    tempCells[i].parent().children().each(function () {
                        var colspan = $(this).attr("colspan");
                        _totalSpan += colspan;
                    });

                    var result = _tdTotalColspan - _totalSpan + colspan;
                    tempCells[i].attr("colspan", result);
                }

                _tr.children().each(function () {
                    _BindCell($(this));
                });

                //隐藏
                $('#screen').hide();
                $("#f_splitTab").hide();

                // 重新绑定可拖拽事件
                Designer.BasicPropertyWindow.ResetDragReceive();
            }
        });
    },

    //生成表格 HTML
    _GenerateTab: function (tabId, rows, columns, tabClass) {
        if (rows <= 0 || columns <= 0)
            return;

        var _class = "";
        if (tabClass != "") {
            _class = "class=\"" + tabClass + "\"";
        }

        var html = "<table id=\"" + tabId + "\" " + _class + " cellspacing=\"0\" type=\"0\" cellpadding=\"0\" border=\"1\" style=\"border-collapse:collapse;width:100%;\">";
        //遍历
        for (var i = 0; i < rows; i++) {
            html += "<tr>";
            for (var j = 0; j < columns; j++) {
                var cssClass = j % 2 == 0 ? "tdTitle" : "tdData";
                html += "<td class=\"" + cssClass + "\"></td>";
            }
            html += "</tr>";
        }
        html += "</table>";
        html += tabMenu;
        return html;
    },

    //导入功能模块
    LoadFunction: function (functionID, visible) {

        //将控件状态变为Enabeld
        this.Controls.txtNo.removeAttr("disabled");
        this.Controls.txtCloumns.removeAttr("disabled");
        this.Controls.txtRows.removeAttr("disabled");

        var newID = Designer.GetControlID();
        this.Controls.txtNo.val(newID);

        // 如果显示
        if (visible) {
            $("#" + functionID).css({
                'position': 'absolute',
                'border': '2px solid #CAE8EA',
                'background-color': 'white',
                'z-index': 100,
                'left': ($(window).width() - $("#" + functionID).width()) / 2,
                'top': ($(window).height() - $("#" + functionID).height()) / 2 + $(document).scrollTop()
            });

            Designer.Controls.lockScreen.show();
            $("#" + functionID).show();
        }
        else { //如果隐藏
            Designer.Controls.lockScreen.hide();
            $("#" + functionID).hide();
        }
        //if (visible) {
        //    Designer.PopWindow({
        //        id: functionID
        //    });
        //}
        //else { //如果隐藏
        //    Designer.Controls.lockScreen.hide();
        //    $("#" + functionID).hide();
        //}
    },

};


//tab菜单功能：包括编辑表格，删除表格和在下方插入表格功能;
var tabMenu = "<div class=\"tabMenu\">" +
    "<ul style='list-style-type:none;'>" +
        "<li class='tabEdit' onclick='tabEdit(this)'><img src='" + _PORTALROOT_GLOBAL + "/WFRes/_Content/SheetDesigner/images/edit.png' align='absMiddle'/>&nbsp;编辑表格</li>" +
        "<li class='tabRemove' onclick='tabRemove(this)'><img src='" + _PORTALROOT_GLOBAL + "/WFRes/_Content/SheetDesigner/images/remove.png' align='absMiddle'/>&nbsp;删除表格</li>" +
        "<li class='tabInsert' onclick='tabInsert(this)'><img src='" + _PORTALROOT_GLOBAL + "/WFRes/_Content/SheetDesigner/images/add1.png' align='absMiddle'/>&nbsp;在下方插入表格</li>" +
    "</ul>" + "</div>";

//删除表格
function tabRemove(obj) {
    var menu = $(obj).parents("div").eq(0);
    //获取操作的表格
    var tab = menu.prev();
    if (tab) {
        //子表情况
        if (tab.parent().get(0).tagName == "TD") {
            var _td = tab.parent();
            //恢复可拖入功能
            //_td.droppable({ disabled: false });
        }
        RemoveTabElemProperty(tab);
        tab.remove();
        menu.remove();
    }
}

//删除表格里面元素功能
function RemoveTabElemProperty(tab) {
    $(tab).find("td").each(function () {
        $(this).children().each(function () {
            Designer.RemovePropertyToArray($(this));
        });
    });
}

//编辑表格
function tabEdit(obj) {
    var menu = $(obj).parents("div").eq(0);
    //获取操作的表格
    var tab = menu.prev();
    if (tab) {

        var _this = Designer.TabLogic;
        //显示表格对话框
        _this.LoadFunction("f_tab", 1);

        //填充属性
        var _property = tab.attr("tabproperty");
        if (_property) {
            var Property = JSON.parse(_property);

            _this.Controls.txtNo.val(Property.TabId).attr("disabled", "disabled");
            _this.Controls.txtRows.val(Property.Rows).attr("disabled", "disabled");
            _this.Controls.txtCloumns.val(Property.Columns).attr("disabled", "disabled");
            _this.Controls.txtTabStyle.val(Property.TabClass);
        }
    }
}

// 插入行
function tabInsert(obj) {
    var menu = $(obj).parents("div").eq(0);
    //获取操作的表格
    var tab = menu.prev();
    if (tab) {
        var _this = Designer.TabLogic;
        _this.SelectedTab = menu;
        //显示表格对话框
        _this.LoadFunction(_this.Controls.f_tab_ID, 1);
    }
}

//表格单元格容器插件
; (function ($) {
    $.fn.TabDroppable = function (options) {

        var defaults = {}
        var options = $.extend(defaults, options);

        this.each(function () {
            //所在表
            var _table = $(this);
            //所有单元格
            var _tds = $(this).find("td");
            _tds.each(function () {
                //单元格
                var _td = $(this);
                _BindCell(_td);
                //end
            });
        });
    };
})(jQuery);

//绑定单元格属性
function _BindCell(_td) {
    //所在行
    var _tr = _td.parent();
    //所在表格
    var _table = _td.parents("table").eq(0);

    //单元格内的元素都可以设计
    _td.children().each(function () {
        if ($(this).get(0).tagName != "TABLE") {
            $(this).Designable();
        }
        else {
            //_td.droppable({ disabled: true });
            $(this).find("td").each(function () {
                _BindCell($(this));
            });
        }
    });

    //页面初始化将客户端ID转换成服务器控件ID
    _td.children().each(function () {
        var property = $(this).attr("property");
        if (property) {
            $(this).attr("id", JSON.parse(property).Id);
        }
    });

    //恢复单元格可拖放功能
    if (_td.find("table").length <= 0) {
        // _td.droppable({ disabled: false });
    }

    //增加可拖入容器功能，禁止单元格内拖放 SheetActionPanel
    //_td.DropContainerable({
    //   "notAllowType": DesignerControls.SheetActionPanel.Type
    //});

    //增加鼠标右键功能
    _td.unbind("contextMenu").contextMenu('tabMenu', {
        bindings: {
            //粘贴
            "plaste": function (ParentControl) {
                var elem = $(Designer.ClipBoard.Elem);
                //禁止将SheetActionPanel放入表格单元格中
                if (elem.is("span") && elem.attr("class").indexOf("designElem") > -1) {
                    alert("当前单元格不支持所拖拽类型！");
                    $("*").removeClass("focus");
                    return;
                }
                elem.removeClass("selected");
                Designer.ClipBoard.Plaste(ParentControl);
                Designer.AddPropertyToArray(elem);
                return;
            },
            //插入子表
            "subtab": function (t) {
                Designer.TabLogic.SelectedTabCell = t;
                Designer.TabLogic.LoadFunction("f_tab", 1);
                return;
            },
            //清空单元格
            //"clear": function (t) {
            //	_td.html("");
            //},
            //新增行
            "newLine": function (t) {
                //复制上一行结构,清空里面的数据
                var html = _tr.clone();
                $(html).children().each(function () {
                    $(this).html("");
                });
                //在该行后添加
                $(html).insertAfter(_tr);
                _tr.next().children().each(function () {
                    _BindCell($(this));
                });

                //清空合并行
                Designer.TabLogic.SelectedTabCellArray = [];
                $("*").removeClass("selected");
                // 重新绑定可拖拽事件
                Designer.BasicPropertyWindow.ResetDragReceive();
                return;
            },
            //在上方插入行
            "newLineBefore": function (t) {
                //复制上一行结构,清空里面的数据
                var html = _tr.clone();
                $(html).children().each(function () {
                    $(this).html("");
                });
                //在该行后添加
                $(html).insertBefore(_tr);
                _tr.prev().children().each(function () {
                    _BindCell($(this));
                });

                //清空合并行
                Designer.TabLogic.SelectedTabCellArray = [];
                $("*").removeClass("selected");
                // 重新绑定可拖拽事件
                Designer.BasicPropertyWindow.ResetDragReceive();
                return;
            },
            //合并整行
            "mergeAllLine": function (t) {
                //合并列数目
                var maxColumnsCount = 0;
                //合并选择单元格中的元素
                var mergeHtml = "";

                _tr.children("td").each(function () {
                    var colspan = $(this).attr("colspan");
                    if (colspan == null) {
                        maxColumnsCount += 1;
                    }
                    else {
                        maxColumnsCount += parseInt(colspan);
                    }
                    mergeHtml += $(this).html();
                });

                var firstTD = _tr.children("td").eq(0);
                firstTD.attr("colspan", maxColumnsCount).html(mergeHtml);
                firstTD.siblings().remove();
                //重新绑定单元格行为
                _BindCell(firstTD);
            },
            //合并行
            "mergeLine": function (t) {
                if (Designer.TabLogic.SelectedTabCellArray.length == 0) {
                    alert("合并单元格时需注意:\r\n" +
                        "------------------------------------\r\n" +
                        "1.按下Ctrl键选择要合并的单元格！\r\n" +
                        "2.从左到右选择该行内相邻的单元格！\r\n");
                    $("*").removeClass("focus");
                    return;
                }
                //合并列数目
                var maxColumnsCount = 0;
                //合并选定的单元格中的元素
                var objectArray = [];
                var mergeHtml = "";

                //获取该行中最小的列号,获取该单元格的样式,同时保存单元格里面的Html
                var minCellNum = 100000;
                $.each(Designer.TabLogic.SelectedTabCellArray, function (k, v) {
                    if (v.cellNum < minCellNum) {
                        minCellNum = v.cellNum;
                    }
                    if (v.colSpan == undefined) {

                        maxColumnsCount = parseInt(maxColumnsCount) + 1;
                    }
                    else {
                        maxColumnsCount = parseInt(maxColumnsCount) + parseInt(v.colSpan);
                    }
                    mergeHtml += _tr.children().eq(v.cellNum).html();
                });

                var i = 0;
                $.each(Designer.TabLogic.SelectedTabCellArray, function (k, v) {
                    if (v.cellNum != minCellNum) {
                        _tr.children().eq(v.cellNum - i).remove();
                        i++;
                    }
                });
                _tr.children().eq(minCellNum).html("").html(mergeHtml).
                    attr("colspan", maxColumnsCount).removeClass("selected");

                //重新绑定单元格行为
                _BindCell(_tr.children().eq(minCellNum));
                //清空合并后的数组
                Designer.TabLogic.SelectedTabCellArray = [];
                return;
            },
            //拆分单元格
            "splitCell": function (t) {
                Designer.TabLogic.LoadFunction("f_splitTab", 1);
                Designer.TabLogic.SelectedTabCell = _td;
            },
            //重新选择
            "redoMergeLine": function (t) {
                $("*").removeClass("selected");
                Designer.TabLogic.SelectedTabCellArray = [];
            },
            //删除行
            "removeLine": function (t) {
                var table = $(t).parents("table").eq(0);
                if (table.children().children().length == 1) {
                    alert("表格至少要保留一行！");
                    return;
                }
                var parent = $(t).parent();
                parent.remove();
                parent.children().each(function () {  //td
                    $(this).children().each(function () {  //elem
                        Designer.RemovePropertyToArray($(this));
                    });
                });
            },
            //删除表格
            "removeTable": function (t) {
                var table = $(t).parents("table").eq(0);
                if (table) {
                    $(table).children().each(function () {  //td
                        $(this).children().each(function () {  //elem
                            Designer.RemovePropertyToArray($(this));
                        });
                    });
                    $(table).remove();
                }
            }
        }
    });


    //增加单击单元格
    _td.click(function (e) {
        var obj = $(e.target);
        if (obj.get(0).tagName == "TD") {
            $("#divBasic").hide();
            $("table[id$='tdProperty']").show();
            $("#divTDTitle").show();
            $("#divSheetProperty").hide();
            $("table[id$='tbSheetProperty']").hide();
            $("table[id$='tabProperty']").hide();
            $("div[id$='div_WorkSheet']").hide();
            $("table[id$='tabProperty_WorkSheet']").hide();

            var width = $(obj).attr("width");
            var height = $(obj).attr("height");
            var _class = $(obj).attr("class");

            if (width) {
                $("#td_Width").val(width);
            }
            else {
                $("#td_Width").val("");
            }

            if (height) {
                $("#td_Height").val(height);
            }
            else {
                $("#td_Height").val("");
            }

            if (_class) {
                $("#td_Style").val(_class);
            }
            else {
                $("#td_Style").val("");
            }

            Designer.TabLogic.SelectedTabCell = obj;

            if (e.ctrlKey == true) {

                if ($(this).find("table").length > 0)  //当有子表情况下，选择子表内单元格时,不选择父单元格
                    return;

                //该单元格所在的行号
                var rowNum = _table.find("tr").index(_tr);
                //该单元格所在的列号
                var cellNum = _tr.find("td").index($(this)[0]);
                //该单元格合并的行数目
                var colSpan = $(this).attr("colspan");

                //如果数组为空
                if (Designer.TabLogic.SelectedTabCellArray.length == 0) {
                    Designer.TabLogic.SelectedTabCellArray.push({
                        rowNum: rowNum,
                        cellNum: cellNum,
                        colSpan: colSpan
                    });
                }

                //判断当前合并单元格是否是同一行，否则清空该数组
                if (Designer.TabLogic.SelectedTabCellArray.length > 0) {
                    var _rowNum = Designer.TabLogic.SelectedTabCellArray[0].rowNum;
                    //如果行号不匹配,清空该数组,同时取消该行选定的元素
                    if (_rowNum != rowNum) {
                        $.each(Designer.TabLogic.SelectedTabCellArray, function (k, v) {
                            _td.parents("table").eq(0).find("tr").eq(v.rowNum)
                                .children().eq(v.cellNum).removeClass("selected");
                        });
                        Designer.TabLogic.SelectedTabCellArray = [];
                        Designer.TabLogic.SelectedTabCellArray.push({
                            rowNum: rowNum,
                            cellNum: cellNum,
                            colSpan: colSpan
                        });
                    }
                    else {
                        //过滤重复项
                        var flag = 0;
                        $.each(Designer.TabLogic.SelectedTabCellArray, function (k, v) {
                            if (v.rowNum == rowNum && v.cellNum == cellNum) {

                                flag = 1;
                                return false;
                            }
                        });
                        if (!flag) {
                            //判断列号是否当前数组最后一个元素的左边和右边位置
                            if (cellNum != Designer.TabLogic.SelectedTabCellArray[Designer.TabLogic.SelectedTabCellArray.length - 1].cellNum + 1) {
                                alert("合并单元格时需注意:\r\n" +
                                  "------------------------------------\r\n" +
                                  "1.按下Ctrl键选择要合并的单元格！\r\n" +
                                  "2.从左到右选择该行内相邻的单元格！\r\n");
                                $("*").removeClass("focus");
                                return;
                            }
                            Designer.TabLogic.SelectedTabCellArray.push({
                                rowNum: rowNum,
                                cellNum: cellNum,
                                colSpan: colSpan
                            });
                        }
                    }
                }

                //增加选择焦点
                $(this).addClass("selected");
            }
        }
        else {
            $("table[id$='tdProperty']").hide();
            $("table[id$='tabProperty']").show();
            $("div[id$='pt_WorkSheet']").show();
            $("table[id$='tabProperty_WorkSheet']").show();
        }

        event.stopPropagation();
    });

}