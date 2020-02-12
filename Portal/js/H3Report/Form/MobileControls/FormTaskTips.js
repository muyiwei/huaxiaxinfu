// FormTaskTips控件
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
            this.InitTable();
        },

        InitTable: function () {
            var that = this;
            //table
            this.$Table = $('<table class="table table-bordered table-hover table-condensed"></table>');
            this.$Table.attr({
                "data-cache": "false",
                "data-toggle": "table",
                "data-click-to-select": "false",
                "data-side-pagination": "server",
                "data-pagination": "true",
                "data-page-list": "[50,100,150,200]",
                "data-sort-name": "CreatedTime",
                "data-sort-order": "desc",
                "data-method": "post",
                "data-boschema": "schema",
                "data-row-attributes": "GetRowAttributes" + this.Element.id,
                "data-query-params": "GetSheetBoListParams" + this.Element.id,
                "data-response-handler": "ResponseHandler" + this.Element.id,
                "data-content-type": "application/x-www-form-urlencoded"
            });
            //thead
            var tableHeaderStr = '<thead>' +
                                    '<tr>' +
                                        '<th data-formatter="OperateFormatter" data-field="Name">名称</th>' +
                                        '<th style="min-width:100px;">标题</th>' +
                                        '<th style="min-width:100px;">内容</th>' +
                                        '<th style="min-width:100px;">时间</th>' +
                                        '<th style="min-width:100px;">指派人员</th>' +
                                        '<th style="min-width:100px;">状态</th>' +
                                    '</tr>' +
                                 '</thead>';
            this.$Table.append(tableHeaderStr);
            //tbody
            this.$TableBody = $('<tbody></tbody>');
            this.$Table.append(this.$TableBody);
            $(this.Element).append(this.$Table);
            //toolbar
            this.$Toolbar = $('<div class="btn-toolbar" role="toolbar" id="toolbar_tasktips">');
            this.$Btn = $('<div class="btn btn-default">新建</div>');
            this.$Toolbar.append(this.$Btn);
            this.$Btn.click(function () {
                $.ISideModal.Show('/SheetTaskTips/CreateTaskTip?SchemaCode=' + $.FormManager.ResponseContext.SchemaCode, '', function () {

                });
            });
            //this.$Table
            $(this.Element).append(this.$Toolbar);
            this.$Table.attr('data-toolbar', '#toolbar_tasktips');
            this.$Table.bootstrapTable();
        },

        //校验
        Validate: function () {
            return true;
        },

        SaveDataField: function () {
            return {};
        },

        GetValue: function () {
            //return "Sns";
        }
    });
})(jQuery);