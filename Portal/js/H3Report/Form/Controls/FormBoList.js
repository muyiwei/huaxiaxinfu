(function ($) {
    $.fn.FormBoList = function () {
        return $.ControlManager.Run.call(this, "FormBoList", arguments);
    };

    // 构造函数
    $.Controls.FormBoList = function (element, options, sheetInfo) {
        $.Controls.FormBoList.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormBoList.Inherit($.Controls.BaseControl, {
        Render: function () {
            if (this.ResponseContext == null || this.ResponseContext.IsCreateMode || this.ResponseContext.BizObjectStatus == $.SmartForm.BizObjectStatus.Approving) {
                $(this.Element).remove();
                return;
            }
            if (this.ResponseContext.IsCreateMode || $.isEmptyObject(this.BOSchemaCode)) {
                this.ShowEmptyList();
                return;
            }

            this.BizObjectStatus =
                {
                    /// 草稿，对于表单来说，用户点保存，表示是草稿状态；对于流程来说，审批完成前，都是草稿状态
                    Draft: 0,
                    /// 审批通过
                    Effective: 1,
                    /// 被取消
                    Canceled: 3
                };
            this.SheetUrl = "/Sheet/DefaultSheet/";
            this.HtmlRender();
        },

        HtmlRender: function () {
            var that = this;
            $(this.Element).attr("id", $.IGuid()).css({ "width": "100%", "overflow-x": "auto" });
            //$(this.Element).css("width", "100%");
            //$(this.Element).css("overflow-x", "auto");

            //this.$Title = $("<span>");

            this.Table_ID = "FormTable_" + $.IGuid();
            this.$Table = $("<table id='" + this.Table_ID + "' class='table table-bordered table-hover table-condensed'>");//.addClass("table table-bordered table-hover table-condensed");
            //表格体
            this.$TableBody = $("<tbody>");
            this.$Table.append(this.$TableBody);
            var pagerStr = '<div class="table-page" id="bar-' + this.Table_ID + '">' +
                               '<div class="page-index">' +
                                   '<input type="text" value="1" class="Page_Index" />/<label class="Page_Count">1</label>' +
                               '</div>' +
                               '<div class="btn-group table-page_ButtonGroup" style="width: 100px;">' +
                                   '<button class="btn Page_Num_Pre"><i class="fa fa-chevron-left"></i></button>' +
                                   '<button class="btn Page_Num_Next"><i class="fa fa-chevron-right"></i></button>' +
                               '</div>' +
                               '<div class="page-size dropup">' +
                                   '<button class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                                       '<span class="Page_Per_Size">' + 10 + '</span>' +
                                       '<i class="fa fa-chevron-down"></i>' +
                                   '</button>' +
                                   '<ul class="dropdown-menu">' +
                                       '<li><a>10</a></li>' +
                                       '<li><a>50</a></li>' +
                                       '<li><a>100</a></li>' +
                                       '<li><a>150</a></li>' +
                                       '<li><a>200</a></li>' +
                                   '</ul>' +
                               '</div>' +
                               '<div class="page-total">共0条</div>' +
                           '</div>';

            $(this.Element).append(this.$Table).append(pagerStr);
            //if (this.DisplayName != "") {
            //    this.$Table.before(this.$Title.html(this.DisplayName));
            //}

            //this.$Table.attr("data-cache", "false");
            //this.$Table.attr("data-toggle", "table");
            //this.$Table.attr("data-click-to-select", "false");
            //this.$Table.attr("data-url", $.SmartForm.AjaxUrl);
            //this.$Table.attr("data-side-pagination", "server");
            //this.$Table.attr("data-pagination", "true");
            //this.$Table.attr("data-page-list", "[10,50,100,150,200]");
            ////this.$Table.attr("data-show-columns", "true");
            //this.$Table.attr("data-sort-name", "CreatedTime");
            //this.$Table.attr("data-sort-order", "desc");
            //this.$Table.attr("data-method", "post");
            //this.$Table.attr("data-boschema", "schema");
            //this.$Table.attr("data-row-attributes", "GetRowAttributes" + this.Element.id);
            //this.$Table.attr("data-query-params", "GetSheetBoListParams" + this.Element.id);
            //this.$Table.attr("data-response-handler", "ResponseHandler" + this.Element.id);
            //this.$Table.attr("data-content-type", "application/x-www-form-urlencoded");

            this.$Table.attr({
                "data-cache": "false",
                "data-toggle": "table",
                "data-click-to-select": "false",
                "data-url": $.SmartForm.AjaxUrl,
                "data-side-pagination": "server",
                "data-pagination": "true",
                "data-page-list": "[10,50,100,150,200]",
                "data-sort-name": "CreatedTime",
                "data-sort-order": "desc",
                "data-method": "post",
                "data-boschema": "schema",
                "data-row-attributes": "GetRowAttributes" + this.Element.id,
                "data-query-params": "GetSheetBoListParams" + this.Element.id,
                "data-response-handler": "ResponseHandler" + this.Element.id,
                "data-content-type": "application/x-www-form-urlencoded"
            });




            window["GetRowAttributes" + this.Element.id] = function (row, index) { return that.GetRowAttributes.apply(that, [row, index]) };
            window["GetSheetBoListParams" + this.Element.id] = function (params) { return that.GetSheetBoListParams.apply(that, [params, this]) };
            window["ResponseHandler" + this.Element.id] = function (params) { return that.ResponseHandler.apply(this, [params]) };
            window["OperateFormatter" + this.Element.id] = function (value, row, index) { return that.OperateFormatter.apply(that, [value, row, index]); }
            this.InitServer();


            this.$Table.off("mouseenter.BoList BoList.list").on("mouseenter.BoList mouseleave.BoList", 'td', function () {
                var $tableTip = $(".table-tip"), $TextLabel = $(".TextLabel");
                $tableTip.length == 0 && ($tableTip = $('<div class="table-tip" style="display: none;"></div>').appendTo($("body")));
                $TextLabel.length == 0 && ($TextLabel = $('<label class="TextLabel" style="display: none; opacity:0; position:fixed;"></label>').appendTo($("body")));
                var $that = $(this);
                $TextLabel.text($that.text());

                if ($TextLabel.width() > $that.width()) {
                    var offset = $that.offset();
                    $tableTip.text($that.text());
                    var left = offset.left + ($that.outerWidth() - $tableTip.outerWidth()) / 2 - $(window).scrollLeft();
                    left = left < 0 ? 1 : left;
                    $tableTip.css({ left: left, bottom: $(window).height() - offset.top + 6 + $(window).scrollTop() }).toggle();
                }
            });
        },
        GetRowAttributes: function (row, index) {
            var that = this;
            if (row.Status == that.BizObjectStatus.Draft) {
                return { "class": "Draft-Row" };
            }
            else if (row.Status == that.BizObjectStatus.Canceled) {
                return { "class": "Canceled-Row" };
            }
            else {
                return {};
            }
        },

        GetSheetBoListParams: function (params) {
            //params["Command"] = "LoadBOListData";
            //params["BOSchemaCode"] = this.BOSchemaCode;
            //params["MappingDataField"] = this.MappingDataField;
            $.extend(params, {
                Command: "LoadBoListData",
                BOSchemaCode: this.BOSchemaCode,
                AssociationCode: this.SchemaCode,
            }, $.SmartForm.RequestParameters);
            return params;
        },

        ResponseHandler: function (Res) {
            // added by xiechang
            if (Res == void 0) return;
            var that = this;
            var $target = $("#" + that["TargetId"]);
            if (!$target) return;
            if (that.pageNumber > 1 && Res.ReturnData.BOListData && Res.ReturnData.BOListData.total == 0) {
                $target.bootstrapTable("refreshOptions", { pageNumber: that.pageNumber - 1 });
            }
            if (!that.$PageNext) {
                var $pageBar = $("#bar-" + that["TargetId"]);
                that.$PageNext = $pageBar.find(".Page_Num_Next");
                that.$PagePre = $pageBar.find(".Page_Num_Pre");
                that.$PageIndex = $pageBar.find(".Page_Index");
                that.$PageCount = $pageBar.find(".Page_Count");
                that.$PageTotal = $pageBar.find(".page-total");
                that.$PageSize = $pageBar.find(".Page_Per_Size");
                that.$PageNext.bind('click', function (e) {
                    $target.bootstrapTable("nextPage");
                    $target.bootstrapTable("refresh");
                    return false;
                });
                that.$PagePre.bind('click', function () {
                    $target.bootstrapTable("prevPage");
                    $target.bootstrapTable("refresh");
                    return false;
                });

                var PageTimeout;
                that.$PageIndex.bind("keyup", function (e) {
                    PageTimeout && clearTimeout(PageTimeout);
                    PageTimeout = null;
                    var v = $(this).val().replace(/[^\d]/g, '');
                    v = v == "" ? 0 : parseInt(v);
                    v = v >= that.Count ? that.Count : v;
                    if (v == 0) return;
                    $(this).val(v);
                    PageTimeout = setTimeout(function () {
                        v != that.pageNumber && $target.bootstrapTable("selectPage", v);
                        $target.bootstrapTable("refresh");
                        PageTimeout = null;
                    }, 600);
                });
                that.$PageIndex.bind("blur", function (e) {
                    PageTimeout && clearTimeout(PageTimeout);
                    PageTimeout = null;
                    var v = $(this).val();
                    v = v == "" || v == "0" ? 1 : parseInt(v);
                    $(this).val(v);
                    v != that.pageNumber && $target.bootstrapTable("selectPage", v);
                    $target.bootstrapTable("refresh");
                });
                $pageBar.on("click", "li>a", function () {
                    var size = parseInt($(this).text());
                    that.$PageSize.html(size);
                    $target.bootstrapTable("refreshOptions", { pageSize: size });
                })
            }
            that.$PageIndex.val(that.pageNumber);
            that.Count = Math.ceil(Res.ReturnData.BOListData.total / that.pageSize);
            that.$PageCount.html(that.Count);
            that.$PageTotal.html("共" + Res.ReturnData.BOListData.total + "条");
            if (that.pageNumber <= 1) {
                that.$PagePre.addClass("disable").attr("disabled", true);
            }
            else {
                that.$PagePre.removeClass("disable").attr("disabled", false);
            }

            if (that.pageNumber == that.Count) {
                that.$PageNext.addClass("disable").attr("disabled", true);
            }
            else {
                that.$PageNext.removeClass("disable").attr("disabled", false);
            }
            //end
            return Res.ReturnData.BOListData;
        },

        InitServer: function () {
            var that = this;
            $.SmartForm.PostForm("LoadBoListHeader",
                { BOSchemaCode: that.BOSchemaCode },
                function (SmartFormResult) {
                    if (SmartFormResult.Successful) {
                        that.InitHeader.apply(that, [SmartFormResult.ReturnData.Columns]);
                        that.InitAction.apply(that, [SmartFormResult.ReturnData.Actions]);
                        that.$Table.bootstrapTable({ TargetId: that.Table_ID });
                    }
                    else {
                        that.ShowEmptyList.apply(that, [SmartFormResult.Errors]);
                    }
                });
        },

        InitHeader: function (Headers) {
            if (!Headers) return;
            var $Tr = $('<tr><th data-formatter="OperateFormatter' + this.Element.id + '" data-field="Name">名称</th></tr>');
            //$Tr.append($('<th data-checkbox="true"></th>'));
            //$Tr.append($('<th data-formatter="OperateFormatter' + this.Element.id + '" data-field="Name">名称</th>'));
            var trStr = '<tr><th data-formatter="OperateFormatter' + this.Element.id + '" data-field="Name">名称</th>';
            for (var key in Headers) {
                trStr += "<th style='min-width:100px;' data-switchable='true' data-field='" + key + "' data-visible='" + Headers[key].Visible + "' data-sortable='" + Headers[key].Sortable + "'>" + Headers[key].DisplayName + "</th>";
                //$Tr.append($("<th style='min-width:100px;'>" + Headers[key].DisplayName + "</th>").attr({
                //    "data-switchable": true,
                //    "data-field": key,
                //    "data-visible": Headers[key].Visible,
                //    "data-sortable": Headers[key].Sortable
                //}).text(Headers[key].DisplayName));
            }
            //$Tr.append(trStr);
            trStr += '</tr>';
            this.$Table.append($("<thead>").append(trStr));
        },

        InitAction: function (Actions) {
            if (!Actions) return;
            var ActionPanelId = $.IGuid();
            this.$ActionPanel = $("<div id='" + ActionPanelId + "' class='btn-toolbar' role='toolbar'>");//.attr("id", ActionPanelId).addClass("btn-toolbar").attr("role", "toolbar");
            for (var key in Actions) {
                // 暂时屏蔽掉导入导出删除按钮
                if (key == "Import" || key == "Export" || key == "Remove") {
                    continue;
                }
                var $Button = $("<div class='btn btn-default' id='" + key + "'><i class='fa " + Actions[key].Icon + "'></i>" + Actions[key].DisplayName + "</div>");//.addClass("btn btn-default").attr("id", key).append("<i class='fa " + Actions[key].Icon + "'></i>" + Actions[key].DisplayName);
                this.$ActionPanel.append($("<div class='btn-group' role='group'>").append($Button));
                $Button.click(this, function (e) {
                    e.data.DoAction.apply(e.data, [$(this).attr("id")]);
                });
            }
            this.$Table.attr("data-toolbar", "#" + ActionPanelId);
            $(this.Element).append(this.$ActionPanel);
        },

        DoAction: function (ActionName) {
            var that = this;
            switch (ActionName) {
                case "Create":
                    that.CreateBO.apply(that);
                    break;
                case "Remove":
                    that.RemoveBOs.apply(that);
                    break;
            }
        },

        CreateBO: function () {
            var that = this;
            $.ISideModal.Show(that.SheetUrl + that.BOSchemaCode + "?" + this.SchemaCode + "=" + this.ResponseContext.BizObjectId + "&" + this.SchemaCode + "_Name=" + this.ResponseContext.Name, "", function () {
                that.ReloadList.apply(that);
            });
        },

        OperateFormatter: function (value, row, index) {
            var that = this;
            window.EditBORow = function (SchemaCode, ObjectId, InstanceId, AssociationCode, TargetObjectId) {
                $.ISideModal.Show(that.SheetUrl + SchemaCode + "?BizObjectId=" + ObjectId + "&" + AssociationCode + "=" + TargetObjectId, "", function () {
                    that.ReloadList.apply(that);
                });
            };
            if (value == null || value.trim() == "") value = "--";
            return "<a class='edit ml10' href=\"javascript:EditBORow(\'" + that.BOSchemaCode + "\',\'" + row.ObjectId + "\',\'" + row.WorkflowInstanceId + "\',\'" + that.SchemaCode + "\',\'" + that.ResponseContext.BizObjectId + "\')\"' >" + value.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</a>";
        },

        RemoveBOs: function () {
            var that = this;
            var rows = that.$Table.bootstrapTable("getSelections");
            if (rows.length == 0) {
                $.IShowWarn("提示", "没有选中任何行");
                return;
            }

            if (confirm("确定删除" + rows.length + "行数据")) {
                var ObjectIds = {};
                var ids = Array();
                for (var i = 0; i < rows.length; i++) {
                    ObjectIds[rows[i].ObjectId] = rows[i].ObjectId;
                    ids.push(rows[i].ObjectId);
                }
                $.ajax({
                    type: "GET",
                    url: "/Home/RemoveAppData",
                    data: { SchemaCode: that.BOSchemaCode, ObjectIds: ObjectIds },
                    //async: false,//同步执行
                    dataType: "json",
                    success: function (result) {
                        if (result) {
                            //$("#tb_Applist").bootstrapTable("remove", { field: "ObjectId", values: ids });
                            that.ReloadList.apply(that);
                        }
                    },
                    error: function (e) {
                        $.IshowError("错误", e.responseText);
                    }
                });
            }
        },

        ReloadList: function () {
            this.$Table.bootstrapTable("refresh");
        },

        ShowEmptyList: function (Errors) {
            $(this.Element).html("");
            if (Errors) {
                var errorStr = '';
                for (var i = 0; i < Errors.length; i++) {
                    errorStr += "<span>" + Errors[i] + "</span>";
                    //$(this.Element).append("<span>" + Errors[i] + "</span>");
                }
                $(this.Element).append(errorStr);
            }
            else {
                $(this.Element).append("<span>当前列表为空!</span>");
            }
            $(this.Element).css({
                "text-align": "center",
                "color": "gainsboro",
                "border": "1px dotted",
                "padding-top": "10px",
                "padding-bottom": "10px"
            });
        }
    });
})(jQuery);