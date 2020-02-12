// Label控件
(function ($) {
    //控件执行
    $.fn.FormGridView = function () {
        return $.ControlManager.Run.call(this, "FormGridView", arguments);
    };

    $.Controls.FormGridView = function (element, options, sheetInfo) {
        $.Controls.FormGridView.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.Controls.FormGridView.Inherit($.Controls.BaseControl, {
        PreRender: function () {
            var that = this;
            that.ColMinWidth = 80;
            //this.fields = [];
            this.$Element = $(this.Element).addClass("SheetGridView").css({ "position": "relative", "overflow": "hidden" });
            this.Editable && this.$Element.addClass("editable");
            this.FirstAddRow = true;
            this.$Table = this.$Element.children("table");

            this.$TableWrap = $('<div class="GridViewWrap">');

            //this.$rcWrap = $('<div class="rc-wrap">').appendTo(this.$TableWrap);
            this.$rcHandle = $('<div class="rc-handle-container">').appendTo(this.$TableWrap);

            this.$TableSLide = $('<a class="bar_all bar_all_down" data-type="down" title="点击全部展开或收缩" style="display: inline;"><i class="chart-arrow"></i></a>');
            this.$TableSLide.appendTo(this.$TableWrap);
            this.$TableHead = $('<div class="table-head" style="height:34px;">').appendTo(this.$TableWrap);
            this.$TableHeadBody = $('<div class="head-body">').appendTo(this.$TableHead);
            //解决Mac safari兼容性问题
            this.$TableContainer = $("<div></div>").append(this.$Table);

            this.$TableConBody = $('<div class="table-body" style="overflow:auto;">').append(this.$TableContainer);
            this.$TableCon = $('<div class="table-content" style="max-height:'+$(window).height() * 0.6+'px">').append(this.$TableConBody).appendTo(this.$TableWrap);

            //this.Editable && (this.$TableFixed = $('<table class="table-gixed"></table>').appendTo(this.$TableWrap));

            that.$TableScrollWrap = $('<div class="table-scroll-wrap"></div>').appendTo(this.$TableWrap);
            this.$TableScroll = $('<div class="table-scroll">').appendTo(that.$TableScrollWrap);
            this.$TableScrollbar = $('<div class="table-scroll-bar">').appendTo(this.$TableScroll);


            if (this.Editable) {
                this.$TableHead.addClass("table-edit");
                this.$TableCon.addClass("table-edit");
                //that.$TableScrollWrap.css("margin-right", "100px");
            }

            this.$TableWrap.appendTo(this.Element);

            this.$Title = $("<span class='sheetName'>");
            //if (this.DisplayName != "") {
            this.$TableHeadBody.append(this.$Title.html(this.DisplayName));
            if (this.Required) {
                this.$Title.append("<span style='color:red;vertical-align:middle'>*<span>");
            }
            //}

            this.$Table.find("tr").find("th").each(function () {
                if ($(this).find('div[data-controlkey="SheetAttachment"]').length > 0) {
                    $(this).css("max-width", "300px");
                }
                else if ($(this).find('div[data-controlkey="SheetQuery"]').length > 0) {
                    $(this).css({ "min-width": "200px", "max-width": "none" });
                    //$(this).css("max-width", "none");
                }
            });
            //模板行内容
            this.$TemplateRow = this.$Table.find("tr").clone();

            this.$TemplateRow.find("th").each(function () {
                var $td = $("<td>").html($(this).html());
                if (that.Editable && $(this).find('div[data-controlkey="FormAreaSelect"]').length == 0) {

                    if ($(this).find('div[data-controlkey="FormNumber"]').length > 0 || $(this).find('div[data-controlkey="FormCheckbox"]').length > 0) {
                        $td.children("div.sheet-control").css({ "min-width": "100px" });
                    } else if ($(this).find('div[data-controlkey="FormAttachment"]').length > 0) {
                        $td.children("div.sheet-control").css("min-width", "200px");
                    } else {
                        $td.children("div.sheet-control").css("min-width", "160px");
                    }
                }

                if ($(this).find('div[data-controlkey="SheetAttachment"]').length > 0) {
                    $td.children("div.sheet-control").css("width", "300px");
                    $td.width(300);
                }
                //else if ($(this).find('div[data-controlkey="SheetQuery"]').length > 0) {
                //    $td.css("min-width", "200px");
                //    $td.css("max-width", "none");
                //}
                $td.find("div").removeClass("table_th").html("");
                $(this).before($td);
                $(this).remove();
            });

            if (this.Editable) {
                //添加编辑列
                //this.$BtnAddRow = $("<span>").addClass("SheetGridView_Btn").addClass("fa fa-plus");
                this.$BtnAddRow = $("<span class='SheetGridView_Btn fa fa-plus'>");
                //var tr = $("<tr style='height:31px' class='header'>").append($("<th class='SheetGridView_BtnCol'>").append(this.$BtnAddRow));

                this.$Table.find("tr").append($("<th class='SheetGridView_BtnCol fixed-btn'>").append(this.$BtnAddRow));
                //this.$TableFixed.append(tr);
            }

            this.TrHeight = 0;

            //表格体
            this.$TableBody = $("<tbody>");
            this.$Table.append(this.$TableBody);
        },

        Render: function () {
            if (!this.Visible) this.$Element.hide();
            //对于可见的字段，添加是否打印属性
            if (this.Visible) {
                if (this.Printable == void 0) {
                    //如果字段没有设置是否可打印则默认可打印
                    this.$Element.attr('data-printable', true);
                } else {
                    this.$Element.attr('data-printable', this.Printable);
                }
            }
            //绑定事件
            this.BindEvent();
            if (this.Value && this.Value.R && this.Value.R.length > 0) {
                var that = this;
                that.$loading = $('<div class="grid-loading">[' + that.DisplayName + ']数据加载中...</div>').appendTo(that.Element);
                setTimeout(function () {
                    that.SetValue(that.Value.R);
                    that.$loading.remove();
                }, 0);
            }
            else if (this.ResponseContext.IsCreateMode && this.Editable) {
                this.AddRow();

                //每次addrow后都要重新调整th的宽度
                this.Resize();
            }
        },

        SetValue: function (dataArray) {
            if ($.isEmptyObject(dataArray)) return;
            for (var i = 0; i < dataArray.length; i++) {
                this.AddRow(dataArray[i][this.DataField + ".ObjectId"].Value);
            }
            //每次addrow后都要重新调整th的宽度
            if (this.Editable) {
                this.Resize();
            } else {
                this.ResizeColumn(true);
            }
        },
        //首次加载表头重绘
        ResetHeader: function () {
            var that = this;
            that.$TableConBody.css("overflow", "hidden");
            that.$FixedHeader = $('<table class="gridFixedH">');
            that.$TableHead.removeAttr("style");
            var tr = $("<tr>");
            that.$Table.find("thead").show();
            //-----
            var totalWidth = 0;
            //------
            that.$Table.children("thead").find("th").each(function () {
                var html = $(this).children("div.table_th").html();
                //var th = $("<th>").html(html).width($(this).outerWidth()).css("border-right", "1px solid #ddd");
                var w = $(this).outerWidth();
                var th = $("<th>").html("<div style='width:" + (w - 1) + "px'>" + html + "</div>").css("border-right", "1px solid #ddd");
                //----
                if (!$(this).is(":visible")) {
                    th.hide();
                }
                else {
                    totalWidth += w;
                }
                if ($(this).hasClass("SheetGridView_BtnCol") && that.Editable) {
                    th = $(this).css({
                        "width": "100px"
                    });
                }
                var datafield = $(this).children("div.table_th").attr("data-datafield");
                th.attr('data-datafield', datafield);
                //that.fields.push(datafield);
                tr.append(th);
            });
            if (that.Editable) {
                tr.find("th:last").prev().css("border-right", 0);
            } else {
                tr.find("th:last").css("border-right", 0);
            }

            that.$FixedHeader.append(tr);

            that.$Table.find("thead").hide();
            that.$Title.after(that.$FixedHeader);
            //var w = that.$Table.outerWidth();
            //that.$FixedHeader.width(w);
            //that.$Title.width(w);

            //that.$TableScrollbar.width(w + 100);

            that.$FixedHeader.width(totalWidth);
            that.$Title.width(totalWidth);
            that.$TableContainer.width(totalWidth);
            that.$TableScrollbar.width(that.Editable ? (totalWidth + 100) : totalWidth);
        },
        //列重绘
        ResizeColumn: function (isFirst) {
            if (this.Editable) return;
            var that = this, totalWidth = 0, trindex = 1, maxH = $(window).height() * 0.6 + 34,
                $firstTr = that.$Table.children("tbody").children("tr").eq(0);

            that.$rcHandle.html("");

            //重新计算表头的宽度
            that.$FixedHeader.find("th").each(function () {
                var $that = $(this);
                if ($that.is(":visible")) {
                    
                    $that.attr("data-tar", "#rc_" + trindex).children("div").attr("id", "th_" + trindex);
                    var datafield = $that.attr("data-datafield");
                    if (datafield) {
                        var td = $firstTr.find("td>div[data-datafield='" + datafield + "']").parent().attr("id", "td_" + trindex);
                        if (td.length > 0) {
                            var w = td.outerWidth();
                            if (isFirst) {
                                w < that.ColMinWidth && (w = that.ColMinWidth);
                                td.outerWidth(w);
                            };
                            totalWidth += w;
                            $that.children("div").width(w -1);
                        }
                        that.$rcHandle.append('<div id="rc_' + trindex + '" class="rc-handle" data-index="' + trindex + '" style="left:' + (totalWidth - 3) + 'px;height:' + maxH + 'px;">');
                    }
                    trindex++;
                }
            });

            this.$FixedHeader.width(totalWidth);
            this.$Title.width(totalWidth);
            this.$TableContainer.width(totalWidth);
            this.$TableScrollbar.width(totalWidth);
        },

        //action:hide隐藏，否则显示
        SetColumnVisible: function (datafield, action) {
            var that = this;
            if (that.$FixedHeader) {
                var $fixedTh = that.$FixedHeader.find("th[data-datafield='" + datafield + "']");
                var $th = that.$Table.find("th div[data-datafield='" + datafield + "']").parent("th");
                var index = that.$Table.find("thead th").index($th);
                if ($fixedTh.length > 0 && $th.length > 0) {
                    if (action === "hide") {
                        $fixedTh.hide();
                        that.$Table.find("tr td:eq(" + index + ")").hide();
                        $th.hide();
                    } else {
                        $fixedTh.show();
                        that.$Table.find("tr td:eq(" + index + ")").show();
                        $th.show();
                    }
                    //重新计算滚动条
                    window.setTimeout(function () {
                        that.Resize();
                    }, 0);
                }
            } else {
                var $th = that.$Table.find("thead").find("th[data-datafield='" + datafield + "']");
                action === "hide" ? $th.hide() : $th.show();
                window.setTimeout(function () {
                    var w = that.$Table.outerWidth();
                    that.$Title.width(w);
                    that.$TableScrollbar.width(that.Editable ? (w + 100) : w);
                }, 0);
            }
        },
        //重置列宽
        Resize: function () {
            var that = this, totalWidth = 0;
            //重新计算表头的宽度
            that.$FixedHeader.find("th").each(function () {
                if ($(this).is(":visible")) {
                    var datafield = $(this).attr("data-datafield");
                    if (datafield) {
                        var td = that.$Table.find("td>div[data-datafield='" + datafield + "']").parent();
                        if (td.length > 0) {
                            var w = td.outerWidth();
                            totalWidth += w;
                            $(this).children("div").width(w - 1);
                        }
                    }
                }
            });

            //重新计算滚动条的宽度
            //var w = this.$Table.outerWidth();
            //this.$FixedHeader.width(w);
            //this.$Title.width(w);
            //this.$TableScrollbar.width(w + 100);

            this.$FixedHeader.width(totalWidth);
            this.$Title.width(totalWidth);
            this.$TableContainer.width(totalWidth);

            this.$TableScrollbar.width(that.Editable ? (totalWidth + 100) : totalWidth);
        },

        GetValue: function () {
            var valArray = new Array();
            var $trs = this.$TableBody.find("tr");
            for (var i = 0; i < $trs.length; i++) {
                var $tr = $($trs[i]);
                var rObjectId = $tr.attr("data-ObjectId");
                if ($.isEmptyObject(rObjectId)) continue;

                var rowVal = {
                    ObjectId: rObjectId
                };
                var isNullRow = true;
                $tr.find("div[data-controlkey]").each(function () {
                    var manager = $(this).JControl();
                    var datafield = manager.DataField.split(".")[1];

                    var controlVal;
                    if (manager instanceof $.Controls.FormUser
                        || manager instanceof $.Controls.FormMultiUser) {
                        controlVal = manager.GetUnitIDs();
                    }
                    else {
                        controlVal = manager.GetValue();
                    }

                    if (!$.isEmptyObject(controlVal) || controlVal != "" || controlVal == false) {
                        isNullRow = false;
                    }

                    rowVal[datafield] = controlVal;
                });
                if (!isNullRow) {
                    valArray.push(rowVal);
                }
            }
            return valArray;
        },

        BindEvent: function () {
            var that = this;
            if (this.Editable) {
                this.$BtnAddRow.unbind("click.BtnAddRow").bind("click.BtnAddRow", this, function (e) {
                    e.data.AddRow.apply(e.data);

                    //每次addrow后都要重新调整th的宽度
                    e.data.Resize.apply(e.data);
                });

            }
            that.BeforeScroll = that.$TableScroll.scrollLeft();
            that.rate = 0;

            that.$TableScroll.unbind("scroll.ytablescroll").bind("scroll.ytablescroll", function (e) {
                if (that.rate <= 0) {
                    if (!that.Editable) {
                        that.rate = 1;
                    } else {
                        that.rate = (that.$Table.outerWidth() - that.$TableConBody.outerWidth()) / (that.$TableScrollbar.outerWidth() - that.$TableScroll.outerWidth());
                    }
                }
                var left = $(this).scrollLeft();
                if (that.BeforeScroll != left) {
                    left = that.rate * left;
                    that.$TableHeadBody.scrollLeft(left);
                    that.$TableConBody.scrollLeft(left);
                    that.$rcHandle.scrollLeft(left);
                    that.BeforeScroll = left;
                    if (!that.Editable) {
                        that.$rcHandle.css("left", -left);
                    }
                }
            });

            that.$Table.off("click.trfocus").on("mousedown.trfocus", function (e) {
                var $tr = $(e.target).closest("tr");
                if ($tr && $tr.hasClass("focus")) return;
                that.$Table.children("tbody").find("tr").removeClass("focus");
                $tr && $tr.addClass("focus");
            });

            that.$TableSLide.unbind("click.showoff").bind("click.showoff", function () {
                if ($(this).attr("type") === "up") {
                    that.$TableCon.css("max-height", $(window).height() * 0.6);
                    $(this).attr("type", "down").addClass("bar_all_down").removeClass("bar_all_up");
                } else {
                    that.$TableCon.css("max-height", "");
                    $(this).attr("type", "up").addClass("bar_all_up").removeClass("bar_all_down");
                }
                that.$rcHandle.children("div.rc-handle").height(that.$TableWrap.height());
            });

            this.$Element.unbind("DomProChange.form").bind("DomProChange.form", function (e, datafield, action) {
                that.SetColumnVisible.call(that, datafield, action);
            });

            //表头拉伸

            if (!that.Editable) {
                that.$rcHandle.off("mousedown.resize").on("mousedown.resize", ".rc-handle", function (e) {
                    e.preventDefault();
                    var startX = e.pageX, x = 0,
                        $that = $(this),
                        pos = $that.offset().left - that.$rcHandle.offset().left,
                        tarIndex = parseInt($that.attr("data-index")),
                        $tarTh = $("#th_" + tarIndex),
                        $tarTd = $("#td_" + tarIndex),
                        startW = $tarTd.outerWidth(),
                        minW = that.ColMinWidth - startW,
                        totalWidth = that.$TableContainer.width(),
                        $nextTh = $("#th_" + (tarIndex + 1)),
                        $nextTd = $("#td_" + (tarIndex + 1)),
                        hasNext = false,nextW = 0;
                    $nextTh.length > 0 && (hasNext = true, nextW = $nextTd.outerWidth());
                        
                    $(document).off("mousemove.resize").on("mousemove.resize", function (e) {
                        x = e.pageX - startX;
                        if (x < minW) return;
                        $that.css("left", pos + x);
                        //to do resize table
                        $tarTd.width(startW + x);
                        $tarTh.width(startW + x);
                        if (x > 0) {
                            that.$TableContainer.outerWidth(totalWidth + x);
                        } else if (hasNext) {
                            $nextTh.width(nextW - x);
                            $nextTd.width(nextW - x);
                        }
                    });

                    $(document).off("mouseup.resize").on("mouseup.resize", function (e) {
                        $(this).off("mousemove.resize").off("mouseup.resize");
                        that.ResizeColumn.call(that);
                    });

                    that.$Element.off("mouseleave.resize").on("mouseleave.resize", function (e) {
                        $(document).off("mousemove.resize").off("mouseup.resize");
                        that.$Element.off("mouseleave.resize");
                        that.ResizeColumn.call(that);
                        return false;
                    });
                })
            }
        },

        AddRow: function (ObjectId, RowData, PreObjectId, $PreTr) {
            var that = this;
            var $newTr = this.$TemplateRow.clone().hide();
            if (ObjectId) {
                $newTr.attr("data-ObjectId", ObjectId);
            }

            if ($newTr.find("td").length > 0) {

                if (this.Editable) {
                    //删除
                    var $btnAddRow = $("<span class='SheetGridView_Btn fa fa-plus'>");//.addClass("SheetGridView_Btn fa fa-plus");
                    var $btnRemoveRow = $("<span class='SheetGridView_Btn fa fa-minus' style='margin-left:5px'>");/*.addClass("SheetGridView_Btn").addClass("fa fa-minus").css({
                        "margin-left": "5px"
                    });*/
                    var $btnCopyRow = $("<span class='SheetGridView_Btn fa fa-copy' style='margin-left:5px'>");/*.addClass("SheetGridView_Btn fa fa-copy").css({
                        "margin-left": "5px"
                    });*/
                    $newTr.append($("<td class='SheetGridView_BtnCol fixed-btn' style='width:90px; min-width:90px;'>").append($btnAddRow).append($btnRemoveRow).append($btnCopyRow));

                    //var tr = $("<tr>").css("height", that.TrHeight);
                    //that.$TableFixed.append(tr.append($("<td class='SheetGridView_BtnCol'>").append($btnAddRow).append($btnRemoveRow).append($btnCopyRow)));
                    //删除行
                    $btnRemoveRow.click($newTr, function (e) {
                        that.OnChange.apply(that, [e.data]);
                        // 在tbody上触发change事件，让设置了计算规则的字段重新计算值
                        // 要在detach行前触发事件，否则事件将捕获不到
                        //$(this).closest("tbody").trigger("change.cr");

                        // 将行中控件的ControlManager删除，避免验证不通过
                        var controlManagers = $.ControlManager.ControlManagers;
                        $newTr.find("div[data-controlkey]").each(function () {
                            for (var sheetId in controlManagers) {
                                if (sheetId == $(this).data($.ControlManager.SheetIDKey)) {
                                    delete controlManagers[sheetId];
                                    break;
                                }
                            }
                        });
                        e.data.detach();
                    });
                    //新增行
                    $btnAddRow.click($newTr, function () {
                        setTimeout(function () {
                            that.AddRow(null, null, $newTr.attr("data-ObjectId"));
                            //每次addrow后都要重新调整th的宽度
                            that.Resize();
                        }, 0);
                    });
                    //复制行
                    $btnCopyRow.click($newTr, function (e) {
                        setTimeout(function () {
                            that.AddRow(null, null, e.data.attr("data-ObjectId"), e.data);
                            //每次addrow后都要重新调整th的宽度
                            that.Resize();
                        }, 0);
                    });
                }
                if (PreObjectId) {
                    this.$TableBody.find("tr[data-ObjectId='" + PreObjectId + "']").after($newTr);
                }
                else {
                    this.$TableBody.append($newTr);
                }
                //如果td的display是none则$newTr的td也要设置display为none
                var $td = this.$TableBody.find('tr:eq(0)').find('td');
                for (var i = 0; i < $td.length; i++) {
                    if ($($td[i]).css('display') == 'none') {
                        $newTr.find('td').eq(i).css('display', 'none');
                    }
                }

                //初始化控件
                $newTr.find("div[data-controlkey]").each(function (i) {

                    var key = $(this).attr("data-controlkey")+"：";

                    var $Controlmanger = $(this).JControl();
                    $Controlmanger.BindChange($.IGuid(), function () {
                        that.OnChange.apply(that, [$Controlmanger]);
                    });

                    if (RowData != null) {

                        if (RowData[$Controlmanger.DataField] != null) {
                            $Controlmanger.SetValue(RowData[$Controlmanger.DataField]);
                        }
                    }
                    else if ($PreTr != null) {
                        var $PreManager = $PreTr.find("div[data-DataField='" + $Controlmanger.DataField + "']").JControl();
                        var controlKey = $(this).attr("data-controlkey");
                        if (controlKey == "FormUser" || controlKey == "FormMultiUser") {
                            $Controlmanger.SetValue($PreManager.GetUnitIDs());
                        }
                        else if (controlKey == "FormQuery") {
                            $Controlmanger.SetValue({
                                "ObjectId": $PreManager.GetValue(),
                                "Name": $PreManager.GetText()
                            });
                        }
                        else if (controlKey != "FormAttachment" && controlKey != "FormMap") { // 不复制附件,地图
                            $Controlmanger.SetValue($PreManager.GetValue());
                        }
                    }

                    if (!$Controlmanger.Visible) {
                        var DataField = $Controlmanger.DataField;
                        //原来是不可见的直接remove了，导致主表和子表不可见字段在参加计算规则时候不一致。20161129改成hide
                        //that.$TemplateRow.find("div[data-DataField='" + DataField + "']").parent().remove();
                        //that.$Table.find("tr").find("div[data-DataField='" + DataField + "']").parent().remove();
                        //$(this).parent().remove();
                        that.$TemplateRow.find("div[data-DataField='" + DataField + "']").parent().hide();
                        that.$Table.find("tr").find("div[data-DataField='" + DataField + "']").parent().hide();
                        $(this).parent().hide();
                    }

                    // 在子表的header里添加必填标识
                    if ($Controlmanger.Visible && $Controlmanger.Editable && $Controlmanger.Required) {
                        var $header = that.$Table.find(".table_th[data-datafield='" + $Controlmanger.DataField + "']");
                        if ($header.find(".required").length == 0) {
                            $header.append("<span class='required' style='color:red;vertical-align:middle'>*<span>");
                        }
                    }

                });

                this.OnChange.apply(this, [$newTr]);
                //控件全部渲染完成再插入页面
                //if (PreObjectId) {
                //    this.$TableBody.find("tr[data-ObjectId='" + PreObjectId + "']").after($newTr);
                //}
                //else {
                //    this.$TableBody.append($newTr);
                //}
                //add by xc
                var h = $newTr.height();
                $newTr.find("td.SheetGridView_BtnCol").css({ height: h, "line-height": h - 6 + "px" });

            }
            else {
                $(this.Element).remove();
            }

            $newTr.show();

            if (that.FirstAddRow) {
                that.ResetHeader();
                that.FirstAddRow = false;
            }
        },
        //
        GetCellManager: function (objectId, dataField) {
            if (objectId == null || $.isEmptyObject(dataField)) return;
            var $tr = this.$TableBody.find("tr[data-ObjectId='" + objectId + "']");
            if ($tr.length > 0) {
                return $tr.find("[data-DataField='" + dataField + "']").JControl();
            }
        },

        UpdateRow: function (objectId, rowData) {
            if (objectId == null || $.isEmptyObject(rowData)) return;
            var $tr = this.$TableBody.find("tr[data-ObjectId='" + objectId + "']");
            if ($tr.length > 0) {
                for (var key in rowData) {
                    var control = $tr.find("[data-DataField='" + key + "']").JControl();
                    if (control != null) {
                        control.SetValue(rowData[key]);
                    }
                }
            }
        },

        ClearRows: function () {
            this.$TableBody.find("tr[data-ObjectId]").remove();
            this.OnChange.apply(this, ["ClearRows"]);
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            // 子表必填时，必需填写一行数据
            if (this.Required && val.length == 0) {
                this.AddInvalidText(this.$Table, "必填");
                return false;
            }

            this.RemoveInvalidText(this.$Table);
            return true;
        },

        SaveDataField: function () {
            var result = {
            };
            if (!this.Visible) return result;
            var oldresult = $.extend({
            }, this.ResponseContext.ReturnData[this.DataField]);
            if (!oldresult) {
                return {
                };
            }
            var value = this.GetValue();
            if (oldresult.Value.R != value) {
                result[this.DataField] = value;
                return result;
            }
            return {
            };
        }
    });
})(jQuery);