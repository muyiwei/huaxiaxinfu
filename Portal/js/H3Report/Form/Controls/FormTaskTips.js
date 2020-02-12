// FormTaskTips控件 caojp
; (function ($) {
    //控件执行
    $.fn.FormTaskTips = function () {
        return $.ControlManager.Run.call(this, "FormTaskTips", arguments);
    };

    // 构造函数
    $.Controls.FormTaskTips = function (element, options, sheetInfo) {
        $.Controls.FormTaskTips.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormTaskTips.Inherit($.Controls.BaseControl, {
        // post发布成功后执行
        AfterPost: function () { },
        //控件渲染函数
        Render: function () {
            //渲染前端
            this.HtmlRender();
        },

        HtmlRender: function () {
            $(this.Element).attr("id", $.IGuid());
            this.InitTable();
        },
        InitTable: function () {
            var that = this;

            //table
            var ID = $.IGuid();
            this.$Table = $('<table id="' + ID + '" class="table table-bordered table-hover table-condensed" data-content-type="application/x-www-form-urlencoded"></table>');
            //this.$Table = $("<table>");
            this.$Table.attr({
                "data-cache": "false",
                "data-toggle": "table",
                "data-click-to-select": "false",
                "data-url": "/SheetTaskTips/DoAction?ActionName=GetTaskTipByCode&code=" + $.SmartForm.ResponseContext.BizObjectId,
                "data-side-pagination": "client",
                "data-pagination": "true",
                "data-page-list": "[10,50,100,150,200]",
                "data-sort-name": "",
                "data-sort-order": "",
                "data-method": "post",
                "data-align": "center",
                "data-sort-name": "AlertTime"
            });
            //this.$Table.attr("data-sort-order", "AlertTime");

            //this.$Table.attr("data-content-type", "application/x-www-form-urlencoded");
            //thead
            var theadStr = '<thead>' +
                                '<tr>' +
                                    '<th data-field="Sender" data-visible=false>Sender</th>' +
                                    '<th data-field="ObjectId" data-visible=false>ObjectId</th>' +
                                    '<th data-field="Name" data-formatter="OperateFormatter_TaskName' + this.Element.id + '">任务名称</th>' +
                                    '<th style="width:200px;" data-field="Summary" data-width=300>内容</th>' +
                                    '<th data-field="TaskState" data-formatter="OperateFormatter_TaskState' + this.Element.id + '">状态</th>' +
                                    '<th data-field="ReminderType" data-width=80 data-formatter="OperateFormatter_ReminderType' + this.Element.id + '">提醒类型</th>' +
                                    '<th data-field="AlertTime" data-width=150 data-formatter="OperateFormatter_AlertTime' + this.Element.id + '">提醒时间</th>' +
                                    '<th data-field="UserName" data-formatter="OperateFormatter_UserName' + this.Element.id + '">指派人员</th>' +
                                    '<th data-field="UserId" data-visible=false>UserId</th>' +
                                    '<th data-field="Action" data-formatter="OperateFormatter_Action' + this.Element.id + '" data-events="TaskTipActionEvents">操作</th>' +
                              '</tr>' +
                           '</thead>';
            //this.$TableHead = $('<thead>');
            //this.$Tr = $('<tr>');
            ////this.$Tr.append($('<th data-checkbox="true"></th>'));
            //this.$Tr.append($('<th data-field="Sender" data-visible=false>Sender</th>'));
            //this.$Tr.append($('<th data-field="ObjectId" data-visible=false>ObjectId</th>'));
            //this.$Tr.append($('<th data-field="Name">任务名称</th>').attr('data-formatter', 'OperateFormatter_TaskName' + this.Element.id));
            //this.$Tr.append($('<th style="width:200px;" data-field="Summary" data-width=300>内容</th>'));
            //this.$Tr.append($('<th data-field="TaskState">状态</th>').attr('data-formatter', 'OperateFormatter_TaskState' + this.Element.id));
            //this.$Tr.append($('<th data-field="ReminderType" data-width=80>提醒类型</th>').attr('data-formatter', 'OperateFormatter_ReminderType' + this.Element.id));
            //this.$Tr.append($('<th data-field="AlertTime" data-width=150>提醒时间</th>').attr('data-formatter', 'OperateFormatter_AlertTime' + this.Element.id));
            //this.$Tr.append($('<th data-field="UserName">指派人员</th>').attr('data-formatter', 'OperateFormatter_UserName' + this.Element.id));
            //this.$Tr.append($('<th data-field="UserId" data-visible=false>UserId</th>'));
            //this.$Tr.append($('<th data-field="Action">操作</th>').attr('data-formatter', 'OperateFormatter_Action' + this.Element.id).attr('data-events', 'TaskTipActionEvents'));
            //this.$TableHead.append(this.$Tr);
            //this.$Table.append(this.$TableHead);
            this.$Table.append(theadStr);

            //tbody
            this.$TableBody = $('<tbody>');
            this.$Table.append(this.$TableBody);
            $(this.Element).append(this.$Table);
            var pagerStr = '<div class="table-page" id="bar-' + ID + '">' +
                            '<div class="page-index">' +
                                '<input type="text" value="1" class="Page_Index" />/<label class="Page_Count">1</label>' +
                            '</div>' +
                            '<div class="btn-group table-page_ButtonGroup" style="width: 100px;">' +
                                '<button class="btn Page_Num_Pre"><i class="fa fa-chevron-left"></i></button>' +
                                '<button class="btn Page_Num_Next"><i class="fa fa-chevron-right"></i></button>' +
                            '</div>' +
                            '<div class="page-size dropup">' +
                                '<button class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                                    '<span class="Page_Per_Size">10</span>' +
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
            $(this.Element).append(pagerStr);
            //toolbar
            this.$Toolbar = $('<div class="btn-toolbar" role="toolbar" id="toolbar_tasktips">');
            this.$Btn = $('<div class="btn btn-default">新建</div>');
            this.$Toolbar.append(this.$Btn);
            this.$Btn.click(function () {
                $.ISideModal.Show('/SheetTaskTips/CreateTaskTip?SchemaCode=' + $.SmartForm.ResponseContext.SchemaCode + '&TargetId=' + $.SmartForm.ResponseContext.BizObjectId, '', function () {
                    that.$Table.bootstrapTable('refresh');
                });
            });
            $(this.Element).append(this.$Toolbar);
            this.$Table.attr('data-toolbar', '#toolbar_tasktips');
            this.$Table.bootstrapTable({
                TargetId: ID,
                responseHandler: that.ResponseHandler
            });
            //this.$Table.find('th').attr('data-formatter', 'OperateFormatter' + this.Element.id);
            //window["OperateFormatter" + this.Element.id] = function (value, row, index, field) { return that.OperateFormatter.apply(that, [value, row, index, field]); }
            window["OperateFormatter" + this.Element.id] = function (value, row, index) { return that.OperateFormatter(value, row, index); }
            window["OperateFormatter_TaskName" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_TaskName(value, row, index); }
            window["OperateFormatter_TaskState" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_TaskState(value, row, index); }
            window["OperateFormatter_ReminderType" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_ReminderType(value, row, index); }
            window["OperateFormatter_AlertTime" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_AlertTime(value, row, index); }
            window["OperateFormatter_UserName" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_UserName(value, row, index); }
            window["OperateFormatter_Action" + this.Element.id] = function (value, row, index) { return that.OperateFormatter_Action(value, row, index); }
            window["ResponseHandler" + this.Element.id] = function (params) { return that.ResponseHandler(params); }
            //OperateFormatter需要优化，之前传入field取不到数据
            window["TaskTipActionEvents"] = {
                'click .ExecuteTask': function (e, value, row, index) {
                    if (row.TaskState == 1) {
                        $.IShowSuccess('该提醒已完成，无需再次确认!');
                        return;
                    }
                    $.post('/SheetTaskTips/DoAction', { ObjectId: row.ObjectId, userId: row.UserId, ActionName: "ExecuteTask" }, function (data) {
                        if (data.Successful) {
                            row.TaskState = 1;
                            that.$Table.bootstrapTable('updateRow', { index: index, row: row });
                            that.$Table.bootstrapTable("refresh");
                        } else {
                            $.IShowError(data.info);
                        }
                    }, 'json');
                },
                'click .RemoveTask': function (e, value, row, index) {
                    $.IConfirm('提示', '确定要删除当前提醒吗?', function (data) {
                        if (data) {
                            $.post('/SheetTaskTips/DoAction', { ObjectId: row.ObjectId, ActionName: "RemoveTask" }, function (ret) {
                                if (ret.Successful) {
                                    //that.$Table.bootstrapTable('remove', { field: 'ObjectId', values: row.ObjectId });
                                    that.$Table.bootstrapTable('hideRow', { index: index });
                                    that.$Table.bootstrapTable("refresh");
                                }
                            });
                        }
                    });
                }
            };
        },

        ActionEvents: function () {

        },
        OperateFormatter_TaskName: function (value, row, index) {

            return "<a onclick='RenderPage.call(this,\"" + row.ObjectId + "\")'>" + value + "</a>";
        },
        OperateFormatter_TaskState: function (value, row, index) {
            if (row.ReminderType == 1) {
                if (value == 0) {
                    return "未结束";
                } else {
                    return '<span style="color:#ccc;">已结束</span>';
                }
            } else {
                if (value == 0) {
                    return "未终止";
                } else {
                    return '<span style="color:#ccc;">已终止</span>';
                }
            }
        },
        OperateFormatter_ReminderType: function (value, row, index) {
            if (value == 1) {
                return "定时";
            } else if (value == 2) {
                return "每日";
            } else if (value == 3) {
                return "每周";
            } else if (value == 4) {
                return "每月";
            } else if (value == 5) {
                return "每年";
            }
        },
        OperateFormatter_AlertTime: function (value, row, index) {
            var date = eval("new " + (value.replace(/\//g, "")));
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            var d = date.getDate();
            var h = date.getHours();
            var mm = date.getMinutes();
            var s = date.getSeconds();
            return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d) + ' ' + (h < 10 ? '0' + h : h) + ':' + (mm < 10 ? '0' + mm : mm) + ':' + (s < 10 ? '0' + s : s);
        },
        OperateFormatter_UserName: function (value, row, index) {
            return "<a  href=\"javascript: $.ISideModal.Show('/Account/Setting/" + row.UserId + "');\"' >" + value + "</a>";
        },
        OperateFormatter_Action: function (value, row, index) {
            var strAction = '';
            if (row.TaskState == 0) {
                if (row.UserId == $.SmartForm.ResponseContext.Originator) {
                    //if (row.TaskState == 1) { return; }
                    if (row.ReminderType == 1) {
                        //定时
                        strAction = '<a class="ExecuteTask fa fa-check">结束</a>';
                    } else {
                        //循环
                        strAction = '<a class="ExecuteTask fa fa-check" >终止</a>';
                    }
                }
                if (row.Sender == $.SmartForm.ResponseContext.Originator) {
                    strAction += '<a class="RemoveTask fa fa-times">删除</a>';
                }
            }
            return strAction;
        },
        OperateFormatter: function (value, row, index) {
            var taskState = '';
            var reminderType = '';
            var alertTime = '';
            var userName = '';
            var strAction = '';
            if (row.ReminderType == 1) {
                if (row.TaskState == 0) {
                    taskState = '未结束';
                } else {
                    taskState = '<span style="color:#ccc;">已结束</span>';
                }
            } else {
                if (row.TaskState == 0) {
                    taskState = '未终止';
                } else {
                    taskState = '<span style="color:#ccc;">已终止</span>';
                }
            }
            switch (row.ReminderType) {
                case 1:
                    reminderType = '定时';
                    break;
                case 2:
                    reminderType = '每日';
                    break;
                case 3:
                    reminderType = '每周';
                    break;
                case 4:
                    reminderType = '每月';
                    break;
                case 5:
                    reminderType = '每年';
                    break;
            }

            var date = eval("new " + (row.AlertTime.replace(/\//g, "")));
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            var d = date.getDate();
            var h = date.getHours();
            var mm = date.getMinutes();
            var s = date.getSeconds();
            alertTime = y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d) + ' ' + (h < 10 ? '0' + h : h) + ':' + (mm < 10 ? '0' + mm : mm) + ':' + (s < 10 ? '0' + s : s);
            userName = "<a  href=\"javascript: $.ISideModal.Show('/Account/Setting/" + row.UserId + "');\"' >" + value + "</a>";


            if (row.TaskState == 0) {
                if (row.UserId == $.SmartForm.ResponseContext.Originator) {
                    //if (row.TaskState == 1) { return; }
                    if (row.ReminderType == 1) {
                        //定时
                        strAction = '<a class="ExecuteTask fa fa-check">结束</a>';
                    } else {
                        //循环
                        strAction = '<a class="ExecuteTask fa fa-check" >终止</a>';
                    }
                }
                if (row.Sender == $.SmartForm.ResponseContext.Originator) {
                    strAction += '<a class="RemoveTask fa fa-times">删除</a>';
                }
            }

            row.TaskState = taskState;
            row.ReminderType = reminderType;
            row.AlertTime = alertTime;
            row.UserName = userName;
            row.Action = strAction;
        },
        ResponseHandler: function (data) {//add by xiechang
            var that = this;
            var $target = $("#" + that["TargetId"]);
            if (!$target) return;
            if (that.pageNumber > 1 && data && data.length == 0) {
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
            that.Count = Math.ceil(data.length / that.pageSize);
            that.$PageCount.html(that.Count);
            that.$PageTotal.html("共" + data.length + "条");
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

            return data;
        }
    });

})(jQuery);

function RenderPage(v) {
    $.ISideModal.Show('/SheetTaskTips/DetailTask?TaskId=' + v);
}