// FormQuery控件
; (function ($) {
    // 控件实例执行方式
    $.fn.FormQuery = function () {
        return $.ControlManager.Run.call(this, "FormQuery", arguments);
    };

    $.FormQueryData = {
        PropertyQueryItems: {},
        PropertyQueryColumns: {}
    };

    // 构造函数
    $.Controls.FormQuery = function (element, options, sheetInfo) {
        $.Controls.FormQuery.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormQuery.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //标记是否是第一次打开关联表单，主要用于批量选择子表时候判断是新增还是修改
            this.IsFirstQuery = true;
            //是否在子表里面子表
            this.IsInGridView = (this.BizObjectId != null && this.BizObjectId != "");

            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            //渲染前端
            this.HtmlRender();

            //初始化默认值
            this.InitValue();

            //不可用
            this.SetReadonly(!this.Editable);
        },

        //渲染前端
        HtmlRender: function () {
            if (!this.Editable) {
                this.$Input = $('<input type="hidden" id="val_' + this.DataField + '" datafield="' + this.DataField + '"></input>');
                $(this.$InputBody).addClass("RightArrow").append(this.$Input);

                this.$Display = $('<div style="width:100%;position:relative;float:left;margin:0px auto;text-align:left;text-overflow:ellipsis;overflow:hidden;"><a class="SheetQueryItem"  href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '"></a></div>');
                this.$InputBody.append(this.$Display);
            }
            else {
                this.ID = $.IGuid();
                var that = this;
                $(this.Element).addClass("SheetQuery");

                //选中值
                this.$Input = $('<input type="hidden" id="val_' + this.DataField + '" datafield="' + this.DataField + '"></input>');
                $(this.$InputBody).append(this.$Input);
                var text = this.Required ? "请选择(必填)" : "请选择";

                // this.$Display = $('<a class="SheetQueryItem" href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '"></a>');
                //this.$Display = $('<div style="width:100%;position:relative;float:left;padding-right:14px; top:4px; text-align:right;text-overflow:ellipsis;overflow:hidden;"><a class="SheetQueryItem"  href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '"></a></div>');
                this.$Display = $('<div style="width:100%;padding-right: 14px;text-align:right;text-overflow:ellipsis;overflow:hidden;height: 32px;line-height: 30px;"><a class="SheetQueryItem"  href="javascript:;" id="text_' + this.DataField + '" datafield="' + this.DataField + '">' + text + '</a></div>');

                this.$InputBody.append(this.$Display);

                this.$link = $('<i class="icon icon-arrow-right m-arrow-right" href="javascript:void(0)"></i>');
                this.$InputBody.append(this.$link);
            }
        },

        //绑定事件
        BindEvent: function () {
        },

        //设置值
        InitValue: function () {
            if ($.SmartForm.RequestParameters[this.DataField] != void 0) {
                this.Value = $.SmartForm.RequestParameters[this.DataField];

                this.SetReadonly(true);
            }
            var item = this.Value || this.DefaultValue;
            if (item != void 0) {
                this.SetValue(item, undefined, true);
            }
        },

        //设置值,isInit标识是否是InitValue
        SetValue: function (item, rowData, isInit) {
            this.IsFirstQuery = false;//只要控件赋值过，再次打开就算是修改
            if (item == void 0 || item == null || item == "") {
                this.$Display.children('a').html("").unbind('click');
                this.$Input.val("").data("ObjectId", "");
                return;
            }
            var schema = this.BOSchemaCode;
            if (item.constructor == String) {
                var name = "";
                if ($.SmartForm &&
                    $.SmartForm.ResponseContext &&
                    $.SmartForm.ResponseContext.AssociatedBoNames &&
                    $.SmartForm.ResponseContext.AssociatedBoNames[item]) {
                    name = $.SmartForm.ResponseContext.AssociatedBoNames[item];
                }
                var that = this;
                if ($.trim(name) == '') {
                    this.Ajax("/Sheet/GetFormatBizObject", "GET",
                        { schemaCode: that.BOSchemaCode, ObjectId: item },
                        function (data) {
                            if (data.ListViewData != void 0 && data.ListViewData.length > 0) {
                                name = $.trim(data.ListViewData[0].Name);
                            }
                            if ($.trim(name) == '') {
                                name = '--';
                            }
                            that.$Display.children('a').html(name ? name : '--');
                            that.$Display.children('a').unbind('click').bind('click', function (e) {
                                if (that.BOSchemaName.indexOf('.') <= 0) {
                                    LinkBoSheet(schema, item);
                                } else {
                                    $.IShowWarn('暂不支持打开子表表单');
                                }
                                e.stopPropagation();
                            });
                            that.$Input.val(item).data("ObjectId", item);
                            if (that.MappingControls && !$.isEmptyObject(that.MappingControls)) {
                                if (data.ListViewData && data.ListViewData.length > 0 && isInit == void 0) {
                                    that.SetMappingValue(data.ListViewData[0]);
                                }
                            }
                            that.OnChange();
                        });
                } else {
                    this.$Display.children('a').html(name ? name : '--');
                    this.$Display.children('a').unbind('click').bind('click', function (e) {
                        //因为稳定性问题暂时不允许在编辑状态下打开关联的表单 20161014
                        //if (that.Editable) {
                        //    return false;
                        //}
                        if (that.BOSchemaName.indexOf('.') <= 0) {
                            LinkBoSheet(schema, item);
                        } else {
                            $.IShowWarn('暂不支持打开子表表单');
                        }
                        e.stopPropagation();
                    });
                    this.$Input.val(item).data("ObjectId", item);
                    this.OnChange();
                }
            }
            else {
                var that = this;
                if (item.Name == null) {
                    this.$Display.children('a').html('--');
                } else {
                    this.$Display.children('a').html(item.Name.trim() != '' ? item.Name : '--');
                }
                this.$Display.children('a').unbind('click').bind('click', function (e) {
                    //因为稳定性问题暂时不允许在编辑状态下打开关联的表单 20161014
                    //if (that.Editable) {
                    //    return false;
                    //}
                    if (that.BOSchemaName.indexOf('.') <= 0) {
                        LinkBoSheet(schema, item.ObjectId);
                    } else {
                        $.IShowWarn('暂不支持打开子表表单');
                    }

                    //LinkBoSheet(schema, item.ObjectId);
                    e.stopPropagation();
                });
                this.$Input.data("ObjectId", item.ObjectId).val(item.ObjectId);

                //找到关联字段
                if (this.MappingControls && !$.isEmptyObject(this.MappingControls)) {
                    if (rowData) {
                        this.SetMappingValue(rowData);
                        this.OnChange();
                    }
                    else {
                        var that = this;
                        this.Ajax("/Sheet/GetFormatBizObject", "GET",
                            { schemaCode: this.BOSchemaCode, ObjectId: item.ObjectId },
                            function (data) {
                                if (data.ListViewData && data.ListViewData.length > 0) {
                                    that.SetMappingValue(data.ListViewData[0]);
                                }
                                that.OnChange();
                            });
                    }
                } else {
                    this.OnChange();
                }
            }

        },

        SetMappingValue: function (rowData) {
            //如果关联查询控件在主表且关联配置是将关联表单子表字段带到当前表单子表字段
            //则要执行如下操作
            //清除当前子表的行，将关联表单子表的行添加到当前表单的子表
            var flag = false;
            if (this.DataField.indexOf(".") == -1) {
                //关联查询控件在主表
                for (var targetProperty in this.MappingControls) {
                    if (targetProperty.indexOf(".") > -1 && this.MappingControls[targetProperty].indexOf(".") > -1) {
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
                if (!(targetProperty.indexOf('.') > -1 && this.MappingControls[targetProperty].indexOf('.') > -1)) {
                    //if (targetProperty.indexOf('.') == -1) {
                    mappingCtrl_schema[targetProperty] = this.MappingControls[targetProperty];
                } else {
                    mappingCtrl_childSchema[targetProperty] = this.MappingControls[targetProperty];
                    var targetChild = targetProperty.slice(0, targetProperty.indexOf('.'));
                    var sourceChild = this.MappingControls[targetProperty].slice(0, this.MappingControls[targetProperty].indexOf('.'));
                    var existInTargetChildSchema = false;
                    for (var target in targetChildSchema) {
                        if (target == targetChild) {
                            existInTargetChildSchema = true;
                            break;
                        }
                    }
                    if (!existInTargetChildSchema) {
                        targetChildSchema[targetChild] = sourceChild;
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
                //2016-12-30
                //sourceProperty是子表字段时候格式为“主表.子表”,rowData中为“子表”
                if (sourceProperty.indexOf(".") > 0) {
                    //子表字段
                    var index = sourceProperty.indexOf(".");
                    var childProperty = sourceProperty.slice(index + 1);
                    if (rowData[childProperty]) {
                        rel_val = rowData[childProperty];
                    }
                }

                var $element = $(this.Element).parent().find('div[data-datafield="' + i + '"]');
                if (i.indexOf('.') > -1 && $element.length > 0) {
                    //判断是否是子表字段，如果是子表字段判断是否有行，没有先addrow
                    var $gridView = $element.closest('.SheetGridView');
                    $element = $(this.Element).parent().find('div[data-datafield="' + i + '"]').not('.table_th');
                    if ($element == void 0 || $element.length == 0) {
                        $gridView.JControl().AddRow();
                    }
                }
                $element = $(this.Element).parent().find('div[data-datafield="' + i + '"]').not('.table_th');
                if ($element == void 0 || $element.length == 0) {
                    $element = $(this.Element).closest('.sheetcontentdiv').find('div[data-datafield="' + i + '"]').not('.table_th');
                }

                var controlManager = $element.JControl();
                if (controlManager) {
                    if (controlManager.Type == 50) { // 关联查询
                        var that = this;
                        if (controlManager.BOSchemaCode == rowData[sourceProperty + "_SchemaCode"]) {
                            //有关联配置
                            if (controlManager.MappingControls && !$.isEmptyObject(controlManager.MappingControls)) {
                                (function (ctrlManager) {
                                    that.Ajax("/Sheet/GetFormatBizObject", "GET", {
                                        schemaCode: ctrlManager.BOSchemaCode,
                                        ObjectId: rowData[sourceProperty + "_Id"]
                                    }, function (data) {
                                        if (data.ListViewData && data.ListViewData.length > 0) {
                                            ctrlManager.SetValue(data.ListViewData[0]);
                                        }
                                    });
                                })(controlManager);
                            } else {
                                //无关联配置
                                controlManager.SetValue({ ObjectId: rowData[sourceProperty + "_Id"], Name: rowData[sourceProperty] });
                            }
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
                                        ctrlMgr.ClearFiles();
                                        ctrlMgr.AppendFile(result.FileId, result.AttachmentId, result.FileName, result.Size);
                                    }
                                }
                            });
                        })(controlManager);
                    }
                    else {
                        if (controlManager.Type == 1) {
                            rel_val = rel_val == "是" ? true : false;
                        }
                        controlManager.SetValue(rel_val);
                        controlManager.OnChange();
                    }
                }
            }

            //1.查看关联配置中是否配置target为主表单的字段

            //2.将关联表单子表行添加到当前表单子表
            //2.1清除主表子表行并将关联子表的行添加到当前子表
            var listViewData = [];
            for (var targetChild in targetChildSchema) {
                //请求关联的子表数据
                this.Ajax("/Sheet/GetChildSchemaDataByObjectId", "POST", {
                    targetChild: targetChild, schemaCode: this.BOSchemaCode, bizObjectId: rowData.ObjectId, propertyName: targetChildSchema[targetChild]
                }, function (data) {
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
            var text = "";
            if (this.Editable) {
                text = this.Required ? "请选择(必填)" : "请选择";
                this.$Display.children('a').unbind('click');
            }
            $(this.Element).find('a[datafield="' + this.DataField + '"]').html(text);
            $(this.Element).find('input[datafield="' + this.DataField + '"]').val('');
        },

        //校验
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && $.isEmptyObject(val)) {
                this.AddInvalidText($(this.Element), "必填");
                return false;
            }

            this.RemoveInvalidText($(this.Element));
            return true;
        },

        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (!this.ResponseContext.IsCreateMode && (!this.Visible)) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }
            if (oldResult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {};
        },

        GetValue: function () {
            if (!this.Visible) {
                if (this.Value == null) {
                    return "";
                }
                return this.Value;
            }

            return this.$Input.val();
        },

        GetText: function () {
            return this.$Display.html();
        },
        GetAssociationFilterData: function () {
            var that = this;
            var sheetData = {};
            var bofilter = $(that.Element).attr('data-bofilter');//兼容旧的bofilter
            if (that.AssociationFilter || bofilter) {
                var rule = that.AssociationFilter.Rule || $.parseJSON(bofilter).Rule;
                if (rule && rule.length > 0) {
                    var controls = $.ControlManager.Controls;
                    var hasCreatedByCtrl = false;//是否有创建者控件
                    var hasOwnerCtrl = false;//是否有拥有者控件
                    var hasOwnerDeptCtrl = false;//是否有所属部门控件
                    for (var control in controls) {
                        var ctrl = controls[control];
                        var controlDataField = ctrl.DataField;
                        if (controlDataField == 'CreatedBy.FullName') {
                            controlDataField = controlDataField.split('.')[0];
                            hasCreatedByCtrl = true;
                        } if (controlDataField == 'OwnerId') {
                            hasOwnerCtrl = true;
                        }
                        if (controlDataField == 'OwnerDeptId') {
                            hasOwnerDeptCtrl = true;
                        }
                        if (rule.indexOf(controlDataField + '}') < 0 || controlDataField == that.DataField) continue;
                        var ctrlFieldIndex = rule.indexOf(controlDataField + '}');
                        var prefix = rule.slice(ctrlFieldIndex - 1, ctrlFieldIndex);
                        if (prefix != '{' && prefix != '.') {
                            continue;
                        }
                        var controlValue = '';
                        if (controlDataField == 'CreatedBy') {
                            controlValue = $.SmartForm.ResponseContext.ReturnData.CreatedBy.Value[0].UnitId;
                        } else {

                            if (ctrl.DataField == void 0 || controlDataField == 'Comments') continue;
                            if (ctrl.DataField.indexOf('.') > 0 && ctrl.Type != 26 && ctrl.Type != 27) {
                                if (that.DataField.indexOf('.') > 0) {
                                    var $tr = $(that.Element).closest('tr');
                                    var thisRowCtrl = $tr.find('div[data-datafield="' + controlDataField + '"]');
                                    if (thisRowCtrl.length > 0) {
                                        controlValue = $(thisRowCtrl[0]).JControl().GetValue();
                                    }
                                } else {
                                    var $ctrl = $('div[data-datafield="' + controlDataField + '"]').not('.table_th');
                                    if ($ctrl != undefined) {
                                        controlValue = [];
                                        for (var i = 0; i < $ctrl.length; i++) {
                                            controlValue.push($($ctrl[i]).JControl().GetValue());
                                        }
                                    }
                                }
                            } else {
                                if (ctrl.Type == 26 || ctrl.Type == 27) {
                                    //单人
                                    controlValue = ctrl.GetUnitIDs();
                                } else {
                                    controlValue = ctrl.GetValue();
                                }
                            }
                            //if (ctrl.Type == 26 || ctrl.Type == 27) {
                            //    //单人
                            //    controlValue = ctrl.GetUnitIDs();
                            //} else {
                            //    controlValue = ctrl.GetValue();
                            //}
                        }
                        sheetData[controlDataField] = controlValue;
                    }
                    if (!hasCreatedByCtrl) {
                        sheetData["CreatedBy"] = $.SmartForm.ResponseContext.ReturnData.CreatedBy.Value[0].UnitId;
                    }
                    if (!hasOwnerCtrl) {
                        sheetData["OwnerId"] = $.SmartForm.ResponseContext.ReturnData.OwnerId.Value[0].UnitId;
                    }
                }
            }
            return sheetData;
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
                //判断是否子表中
                if (this.DataField.toString().indexOf(".") > -1) {
                    $(this.Element).unbind("click").bind("click", function () {
                        //var val = that.GetValue();
                        //var isFirstLoad = val == "";
                        var isFirstLoad = that.IsFirstQuery;
                        //这里要加缓存,用户恢复表单的内容；
                        //LinkFormQuery(that.DataField, that.BOSchemaCode, that.BizObjectId);
                        var sheetData = that.GetAssociationFilterData();
                        LinkFormQuery(that.SchemaCode, that.BOSchemaCode, that.DataField, JSON.stringify(sheetData), that.ObjectId, isFirstLoad);
                    });
                } else {
                    $(this.Element).unbind("click").bind("click", function () {
                        // LinkFormQuery(that.DataField, that.BOSchemaCode);
                        var sheetData = that.GetAssociationFilterData();
                        LinkFormQuery(that.SchemaCode, that.BOSchemaCode, that.DataField, JSON.stringify(sheetData));
                    });
                }
            }
        }
    });
})(jQuery);