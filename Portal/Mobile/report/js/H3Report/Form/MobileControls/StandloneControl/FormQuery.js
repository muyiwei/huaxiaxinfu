// FormQuery控件
; (function ($) {

    $.FormQueryData = {
        PropertyQueryItems: {},
        PropertyQueryColumns: {}
    };

    // 构造函数
    $.MobileControls.FormQuery = function (element, options, sheetInfo) {
        $.MobileControls.FormQuery.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.MobileControls.FormQuery.Inherit($.MobileControls.BaseClass, {
        //控件渲染函数
        Render: function () {

            //渲染前端
            this.HtmlRender();

            //绑定事件
            //this.BindEvent();

            //初始化默认值
            this.InitValue();

            this.SetReadonly(false);

        },

        //渲染前端
        HtmlRender: function () {
            this.ID = $.IGuid();
            var that = this;
            $(this.Element).addClass("SheetQuery");

            //选中值
            this.$Input = $('<input type="hidden" id="val_' + this.DataField + '" datafield="' + this.DataField + '"></input>');
            $(this.$InputBody).append(this.$Input);

            // this.$Display = $('<a class="SheetQueryItem" href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '"></a>');
            this.$Display = $('<div style="width:100%;position:relative;float:left;margin:0px auto;text-align:right;text-overflow:ellipsis;overflow:hidden;"><a class="SheetQueryItem" style="position: relative;padding-left: 24px;max-width: 100%;display: inline-block;line-height: 18px;text-overflow: ellipsis;overflow:hidden;"  href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '"></a></div>');

            this.$InputBody.append(this.$Display);
            this.$InputBody.css({ 'width': '70%', 'padding-right': '20px' });
            this.$link = $('<i class="icon icon-arrow-right m-sheet-arrow" href="javascript:void(0)"></i>');
            $(this.Element).append(this.$link);
        },

        //绑定事件
        BindEvent: function () {
        },

        //设置值
        InitValue: function () {
            var item = this.Value || this.DefaultValue;
            if (item != void 0) {
                this.SetValue(item);
            }
        },

        //设置值
        SetValue: function (item, rowData) {
            var that = this;
            if (item == void 0 || item == null) return;
            var schemaCode = this.BOSchemaCode;
            if (item.constructor == String) {
                var name = null;

                $.ajax({
                    method: "GET",
                    url: "/Sheet/GetFormatBizObject",
                    data: { schemaCode: schemaCode, objectId: item },
                    dataType: "json",
                    cache: false,
                    success: function (data) {
                        if (data.ListViewData != void 0 && data.ListViewData.length > 0) {
                            name = $.trim(data.ListViewData[0].Name);
                        }
                        if ($.trim(name) == '') {
                            name = '--';
                        }
                        that.$Display.children('a').html(name ? name : '--');
                        that.$Display.children('a').unbind('click').bind('click', function (e) {
                            //因为稳定性问题暂时不允许在编辑状态下打开关联的表单 20161014
                            //if (that.Editable) {
                            //    return false;
                            //}
                            LinkBoSheet(schemaCode, item);
                            e.stopPropagation();
                        });
                        that.$Input.val(item).data("ObjectId", item);
                        //添加删除标签
                        var $del = $('<i class="icon icon-close" style="color:#929292;font-size: 14px;position:absolute;left:0;width: 18px;height: 18px;border-radius: 50%;border: 1px solid #929292;"></i>');
                        that.$Display.find("a.SheetQueryItem").prepend($del);
                        //$(that.$Display).prepend($del);
                        $($del).unbind('click').bind('click', function (e) {

                            that.Reset();
                            this.remove();
                            e.stopPropagation();
                        });
                    }
                })
                return;
            }
            var objectId = item.ObjectId;
            if (item.constructor == Object && item[schemaCode + ".ObjectId"] != undefined) {
                objectId = item[schemaCode + ".ObjectId"];
            }
            this.$Display.children('a').html(item.Name.trim() == '' ? '--' : item.Name);
            this.$Display.children('a').unbind('click').bind('click', function (e) {
                LinkBoSheet(schemaCode, objectId);
                e.stopPropagation();
            });
            this.$Input.data("ObjectId", objectId).val(objectId);
            var $del = $('<i class="icon icon-close" style="color:#929292;font-size:20px;position:absolute;left:0;width:24px;"></i>');
            that.$Display.find("a.SheetQueryItem").prepend($del);
            //$(this.$Display).prepend($del);
            $($del).unbind('click').bind('click', function (e) {

                that.Reset();
                this.remove();
                e.stopPropagation();
            });
        },

        SetMappingValue: function (rowData) {
            //如果关联查询控件在主表且关联配置是将关联表单子表字段带到当前表单子表字段
            //则要执行如下操作
            //清除当前子表的行，将关联表单子表的行添加到当前表单的子表
            var flag = false;
            if (this.DataField.indexOf(".") == -1) {
                //关联查询控件在主表
                for (var targetProperty in this.MappingControls) {
                    if (targetProperty.indexOf(".") > -1) {
                        flag = true;
                        break;
                    }
                }
            }

            //将主表和子表的mappingcontrol分开
            var mappingCtrl_schema = {};//主表关联配置
            var mappingCtrl_childSchema = {};//子表关联配置
            var targetChildSchema = {};//关联配置中涉及的子表

            for (var targetProperty in this.MappingControls) {
                if (targetProperty.indexOf('.') == -1) {
                    $.extend(mappingCtrl_schema, $.parseJSON('{"' + targetProperty + '":"' + this.MappingControls[targetProperty] + '"}'));
                } else {
                    $.extend(mappingCtrl_childSchema, $.parseJSON('{"' + targetProperty + '":"' + this.MappingControls[targetProperty] + '"}'));
                    var targetChild = targetProperty.slice(0, targetProperty.indexOf('.'));
                    var sourceChild = this.MappingControls[targetProperty].slice(0, this.MappingControls[targetProperty].indexOf('.'));
                    var flag = false;
                    for (var target in targetChildSchema) {
                        if (target == targetChild) {
                            flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        $.extend(targetChildSchema, $.parseJSON('{"' + targetChild + '":"' + sourceChild + '"}'));
                    }
                }
            }
            var MappingCtrls = {};
            if (flag) {
                MappingCtrls = mappingCtrl_schema;
            } else {
                MappingCtrls = this.MappingControls;
            }

            for (var i in MappingCtrls) {
                var sourceProperty = MappingCtrls[i];
                var rel_val = rowData[sourceProperty];

                var $element = $(this.Element).parent().find('div[data-datafield="' + i + '"]');
                if ($element == void 0 || $element.length)
                    $element = $(this.Element).closest('.sheetcontentdiv').find('div[data-datafield="' + i + '"]');
                var controlManager = $element.JControl();
                if (controlManager) {
                    if (controlManager.Type == 50) { // 关联查询
                        if (controlManager.BOSchemaCode == rowData[sourceProperty + "_SchemaCode"]) {
                            controlManager.SetValue({ ObjectId: rowData[sourceProperty + "_Id"], Name: rel_val });
                        }
                    }
                    else if (controlManager.Type == 24) { // 附件
                        var that = this;
                        var objectId = rowData.ObjectId;
                        for (var key in rowData) {
                            if (key.toLowerCase().indexOf(".objectid") > -1) {
                                objectId = rowData[key];
                                break;
                            }
                        }
                        (function (ctrlMgr) {
                            $.ajax({
                                method: "GET",
                                url: "/Sheet/GetMappingFiles",
                                data: { schemaCode: that.BOSchemaCode, bizObjectId: objectId, propertyName: sourceProperty },
                                dataType: "json",
                                cache: false
                            }).done(function (data) {
                                // 清空控件上的附件
                                ctrlMgr.ClearFiles();
                                if (data && data.length > 0) {
                                    for (var i = 0, len = data.length; i < len; i++) {
                                        var result = data[i];
                                        ctrlMgr.AppendFile(result.FileId, result.AttachmentId, result.FileName, result.Size);
                                    }
                                }
                            });
                        })(controlManager);
                    }
                    else {
                        if (rel_val) {
                            controlManager.SetValue(rel_val);
                            controlManager.OnChange();
                        }
                    }
                }
            }
            //1.查看关联配置中是否配置target为主表单的字段

            //2.将关联表单子表行添加到当前表单子表
            //2.1清除主表子表行并将关联子表的行添加到当前子表
            var listViewData = [];
            for (var targetChild in targetChildSchema) {
                //请求关联的子表数据
                this.Ajax("/Sheet/GetChildSchemaDataByObjectId", "POST", { targetChild: targetChild, schemaCode: this.BOSchemaCode, bizObjectId: rowData.ObjectId, propertyName: targetChildSchema[targetChild] },
                    function (data) {
                        if (data.Result.ListViewData && data.Result.ListViewData.length > 0) {
                            var gridView = $("[data-datafield='" + data.Result.TargetChild + "']").FormGridView();
                            gridView.ClearRows();
                            var listViewData = data.Result.ListViewData;
                            for (var i = 0; i < listViewData.length; i++) {
                                var newRowData = {};
                                newRowData["ObjectId"] = $.IGuid();
                                for (var targetProperty in mappingCtrl_childSchema) {
                                    var fieldValue = listViewData[i][mappingCtrl_childSchema[targetProperty]];
                                    if (fieldValue == void 0) continue;
                                    newRowData[targetProperty] = fieldValue;
                                }
                                gridView.AddRow($.IGuid(), newRowData);
                            }
                        }
                    });
            }
        },

        Reset: function () {
            $(this.Element).find('a[datafield="' + this.DataField + '"]').html('');
            $(this.Element).find('input[datafield="' + this.DataField + '"]').val('');
        },

        //校验
        Validate: function () {
            //不可编辑

            return true;
        },
        GetValue: function () {
            return this.$Input.val();
        },

        GetText: function () {
            return this.$Display.html();
        },

        SetReadonly: function (flag) {
            if (flag) {
                if (this.$link) {
                    this.$link.hide();
                }
                $(this.Element).unbind("click");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                if (this.$link) {
                    this.$link.show();
                }
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
                var that = this;
                $(this.Element).unbind("click").bind("click", function () {
                    // LinkFormQuery(that.DataField, that.BOSchemaCode);
                    if (window.H3Config.GlobalState) {
                        window.H3Config.GlobalState.go('app.sheetquery', { field: that.DataField, boschemacode: that.BOSchemaCode, IsQuery: true });
                    }
                });
            }
        }
    });
})(jQuery);