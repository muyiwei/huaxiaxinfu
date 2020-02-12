// FormQuery控件
; (function ($) {
    // 控件实例执行方式
    $.fn.FormQuery = function () {
        return $.ControlManager.Run.call(this, "FormQuery", arguments);
    };

    $.FormQueryData = {
        PropertyQueryItems: {},
        PropertyQueryColumns: {},
        SchemaCodeAcl: {}
    };

    // 构造函数
    $.Controls.FormQuery = function (element, options, sheetInfo) {
        $.Controls.FormQuery.Base.constructor.call(this, element, options, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormQuery.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            var that = this;
            that.SheetData = {};//关联表单过滤用到的数据
            that.IsQueryControl = false;//标识该控件是表单中还是列表过滤
            that.LoadData = [];//关联表单的数据，表示加载出来的当前表单对应的关联的数据
            if ($.FormQueryData[that.BOSchemaCode]) {
                that.IsRunnable = $.FormQueryData[that.BOSchemaCode].IsRunnable;
                that.CanCreate = $.FormQueryData[that.BOSchemaCode].CanCreate;
                that._Render();
            }
            else {
                that.Ajax("/Sheet/LoadSchemaAcl", "GET", { schemaCode: that.BOSchemaCode }, function (data) {
                    $.FormQueryData[that.BOSchemaCode] = data;
                    that.IsRunnable = data.IsRunnable;
                    that.CanCreate = data.CanCreate;
                    that._Render();
                }, false);
            }
        },

        _Render: function () {
            //是否通过Url传值过来
            if ($.IQuery(this.BOSchemaCode)) {
                if ($.IQuery(this.BOSchemaCode + "_Name")) {
                    this.Value = { ObjectId: $.IQuery(this.BOSchemaCode), Name: $.IQuery(this.BOSchemaCode + "_Name") };
                }
                else {
                    this.Editable = false;
                    //2017-3-22注释，关联列表新增的表单打开时候修改过的携带的值会被还原。
                    //this.Value = $.IQuery(this.BOSchemaCode);
                }
            }

            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            //渲染前端
            this.HtmlRender();

            if ($.SmartForm != null && $.SmartForm.ResponseContext != null) {
                // 新增时，赋值需要处理改变事件，如携带之类的
                if ($.SmartForm.ResponseContext.IsCreateMode) {
                    this.BindChange("FormQueryChange", this.Change);
                    //初始化默认值
                    this.InitValue();
                }// 编辑时，赋值不需要携带，所有的值都是从已经存的结果读取
                else {
                    //初始化默认值
                    this.InitValue();
                    this.BindChange("FormQueryChange", this.Change);
                }
            }
            else {
                this.BindChange("FormQueryChange", this.Change);
                //初始化默认值
                this.InitValue();
            }

            this._toDetailLink();

            //不可用
            if (!this.Editable) {
                this.SetReadonly(true);
            }
        },

        //渲染前端
        HtmlRender: function () {
            var that = this;
            if (!this.Editable) {
                this.$Input = $("<pre>");
                this.$InputBody.append(this.$Input);
            }
            else {
                this.ID = "FormQuery_" + $.IGuid();
                this.$addModel = $("<a class='form-query-addModel'></a>").css({
                    'position': 'absolute',
                    'right': '0px',
                    'top': '0px',
                    'height': '32px',
                    'width': '40px',
                    'border': 'none',
                    'z-index': '10'
                });
                this.$Input = $("<div class='form-control form-query-add' style='height:auto;max-height:60px;overflow:auto;min-height:32px;'></div");
                this.$InputBody.css('position', 'relative');
                this.$InputBody.append(this.$Input).append(this.$addModel);

                setTimeout(that._renderDropDown(that), 0);//渲染下拉
                setTimeout(that._renderModal(that), 0);//渲染模态框
            }
        },
        // 获取元素相对屏幕的绝对位置
        _getAbsPosition: function (element) {
            var left = 0;
            if (window.screenLeft != void 0) {
                left = window.screenLeft;
            }
            else if (window.screenX != void 0) {
                left = window.screenX;
            }

            var abs = {
                x: 0, y: 0
            };
            if (document.documentElement.getBoundingClientRect) {
                abs.x = element.getBoundingClientRect().left;
                abs.y = element.getBoundingClientRect().top;
                abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.documentElement.scrollTop - document.documentElement.clientTop;
            } else {
                while (element != document.body) {
                    abs.x += element.offsetLeft;
                    abs.y += element.offsetTop;
                    element = element.offsetParent;
                }
                abs.x += left + document.body.clientLeft - document.body.scrollLeft;
                abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.body.clientTop - document.body.scrollTop;
            }
            return abs;
        },
        //加载下拉框数据
        _loadDropDownData: function (needClear) {
            var that = this;
            if (!that.IsQueryControl) {
                that._getAssociationFilterData();
            }
            if (needClear) {
                that.offset = 0;
            }
            var defaultParams = {
                Command: 'Load',
                QueryCode: that.BOSchemaCode,
                Status: 1,
                SheetQuery: 1,
                isFormControl: true,
                SheetCode: that.SchemaCode,
                DataField: that.DataField,
                SheetData: JSON.stringify(that.SheetData),
                scopeType: 3,
                offset: that.offset
            };
            var searchName = that.$dropDownInput.val().trim();
            var searchParams = {};
            var params = {};
            if (searchName) {
                if (that.associateChildSchema) {
                    params[that.BOSchemaCode + '.Name'] = [searchName];
                } else {
                    params['Name'] = [searchName];
                }
            }
            searchParams['searchParamsJson'] = JSON.stringify(params);
            $.extend(defaultParams, searchParams);
            that.Ajax('/App/DoAction', 'GET', defaultParams, function (data) {
                if (data.Successful) {
                    that.LoadData = data.ReturnData;
                    that._bindDataToDropDown(needClear, data.ReturnData);
                }
            }, true);
        },
        //绑定过滤的数据到下拉框
        _bindDataToDropDown: function (needClear, data) {
            var that = this;
            that.$dropDownItemContainer.hide();
            if (needClear) {
                that.$dropDownItemContainer.empty();
            }
            if (data && data.length > 0) {
                that.offset += data.length;
                //判断是关联主表还是子表
                //表单中的控件直接通过BOSchemaInfo判断关联的是否是子表；列表过滤条件要根据返回值判断
                if (that.associateChildSchema == undefined) {
                    that.associateChildSchema = false;
                    for (var key in data[0]) {
                        if (key.toLowerCase().indexOf('.objectid') > -1) {
                            that.associateChildSchema = true;
                            break;
                        }
                    }
                }

                //如果是过滤条件则需要提供用户一个空项让用户匹配未填写关联表单的记录
                if (needClear && that.IsQueryControl) {
                    var arr = [];
                    if (that.associateChildSchema) {
                        var noSelectValue = {
                        };
                        var objectId = that.BOSchemaCode + '.ObjectId';
                        var name = that.BOSchemaCode + '.Name';
                        noSelectValue[objectId] = undefined;
                        noSelectValue[name] = '--(空)';
                        arr.push(noSelectValue);
                    } else {
                        arr = [{
                            ObjectId: undefined, Name: '--(空)'
                        }];
                    }
                    data = arr.concat(data);
                }
                var existObjectIds = that.$Input.data('ObjectId');
                if (existObjectIds) {
                    existObjectIds = existObjectIds.split(';');
                }
                if (!existObjectIds) {
                    existObjectIds = [];
                }
                for (var i = 0, len = data.length; i < len; i++) {
                    var id = $.IGuid();
                    var itemId = data[i].ObjectId;
                    var itemName = data[i].Name;
                    if (that.associateChildSchema) {
                        itemId = data[i][that.BOSchemaCode + '.ObjectId'];
                        itemName = data[i][that.BOSchemaCode + '.Name'];
                    }
                    itemName = (itemName == null || itemName == void 0) ? '--' : (itemName.trim() == '' ? '--' : itemName);
                    var $dropDownItemRow = $('<div class="row form-query-itemrow"></div>');
                    var $dropDownItem = $('<input type="checkbox" data-itemid = "' + itemId + '"  id="' + id + '"  value="' + itemName + '" style="display:none;" />');
                    var $dropDownItemLabel = $('<label style="font-weight:normal;width:100%;height:30px;line-height:30px;padding:0 0 0 1.5em!important;margin:0;overflow:hidden;display:inline-block;float:left;position:relative;text-align:left;" for= "' + id + '" data-itemid="' + itemId + '" title="' + itemName + '">' + itemName + '</label>');
                    if (that.IsQueryControl) {
                        $dropDownItemLabel.css('margin-left', '10px');
                        $dropDownItemRow.append($dropDownItem).append($dropDownItemLabel);
                        //对于搜索出来的数据，如果之前已经选过则要勾中
                        if ($.inArray(itemId, existObjectIds) > -1) {
                            $dropDownItem.prop('checked', true);
                        }
                    } else {
                        $dropDownItemLabel.css('cssText', 'font-weight:normal;width:100%;height:30px;line-height:30px;padding:0 0 0 0.5em!important;margin:0;overflow:hidden;display:inline-block;float:left;position:relative;text-align:left;');
                        $dropDownItemRow.append($dropDownItemLabel);
                    }
                    that.$dropDownItemContainer.append($dropDownItemRow);
                    var eventName = 'click.';
                    if (that.DataField) {
                        eventName += that.DataField;
                    } else if (that.ID) {
                        eventName += that.ID;
                    }
                    $dropDownItem.off(eventName).on(eventName, function (e) {
                        //这里不能清空Input
                        var $links = '';
                        var objectIds = '';
                        var checkState = $(this).is(':checked');
                        if (checkState) {//选中
                            var objectId = $(this).data('itemid');
                            var link = '<a href="javascript:;" class="label label-info" style="margin-bottom:-3px;" title="' + $(this).val() + '">' + $(this).val() + '<i class="fa fa-times" style="margin-left:5px" data-objectId="' + objectId + '"></i></a>';
                            that.$Input.append(link);
                            objectIds = that.$Input.data('ObjectId') || '';
                            if (objectIds != '' && objectIds.charAt(objectIds.length - 1) != ';') {
                                objectIds += ';';
                            }
                            objectIds += (objectId + ';');
                            that.$Input.data('ObjectId', objectIds);
                        } else {//取消选中
                            var objectId = $(this).data('itemid');
                            that.$Input.find()
                            objectIds = that.$Input.data('ObjectId');
                            objectIds = objectIds.replace(objectId + ';', '');
                            that.$Input.data('ObjectId', objectIds);
                            that.$Input.find('i[data-objectId="' + objectId + '"]').parent().remove();
                        }

                        //that.$Input.data('ObjectId', objectIds);
                        that.$Input.find('i').on('click', function () {
                            var $this = $(this);
                            $this.closest('a').remove();
                            var objectIds = that.$Input.data('ObjectId');
                            var thisObjectId = $this.attr('data-ObjectId');
                            objectIds = objectIds.replace(thisObjectId + ';', '');
                            that.$Input.data('ObjectId', objectIds);
                            that.OnChange();
                            that.$dropDownItemContainer.find('input[type="checkbox"][data-itemid="' + thisObjectId + '"]').prop('checked', false);
                        });
                        that.OnChange();
                    });
                    $dropDownItemLabel.off(eventName).on(eventName, function (e) {
                        if (that.IsQueryControl) {
                            //过滤条件
                        } else {
                            //表单控件
                            var objectId = $(this).data('itemid');
                            var name = $(this).text();
                            that.$Input.data("ObjectId", objectId).text(name);
                            that.OnChange.apply(that, [{
                                ObjectId: objectId, Name: name
                            }]);
                            that._toDetailLink();
                            that.$dropdown.hide();

                            var gridView = that.$Input.closest("[data-controlkey='FormGridView']");
                            var fGridView = $(gridView).FormGridView();
                            fGridView && fGridView.Resize();
                        }
                        e.stopPropagation();
                    });
                }
            }
            that.$dropDownItemContainer.show();
        },
        //渲染FormQuery的下拉
        _renderDropDown: function (target) {
            this.offset = 0;
            var that = target;
            var h = that.$Input.outerHeight();
            var w = that.$Input.outerWidth();
            var position = that._getAbsPosition(that.$Input[0]);
            that.$dropdown = $('<div class="form-query-dropdown">').css({
                'position': 'absolute',
                'left': position.x,
                'top': position.y + h,
                'width': w,
                /*'height': '300px',*/
                'height': 'auto',
                'border': '1px solid #ddd',
                'border-top': 'none',
                'display': 'none',
                'background-color': '#fff',
                'z-index': '9999'
            });
            var $dropDownInputRow = $('<div class="row" style="margin-left:0;margin-right:0;"></div>');

            that.$dropDownInput = $('<input class="form-control form-input" placeholder="输入表单名称查找" style="border-left:0;border-right:0;" />');
            var settimout = null;
            that.$dropDownInput.off('keyup').on('keyup', function (event) {
                if (settimout) {
                    window.clearTimeout(settimout);
                    settimout = null;
                }
                settimout = setTimeout(that._loadDropDownData(true), 1000);
                event.stopPropagation();
            });

            $dropDownInputRow.append(that.$dropDownInput);
            that.$dropDownItemContainer = $('<div class="form-query-container">').css({
                'padding': '0 5px',
                'margin': '5px 0',
                'overflow-x': 'hidden',
                'overflow-y': 'scroll',
                'max-height': '250px'
                /*'min-height':'60px'*/
            });
            that.$dropdown.append($dropDownInputRow).append(that.$dropDownItemContainer);

            //绑定滚动事件
            that.$dropDownItemContainer.scroll(function () {
                var h_container = $(this).height();//窗口高度
                var h_scrollTop = $(this).scrollTop();//滚动条顶部
                if (0 + h_scrollTop >= $(this)[0].scrollHeight - h_container) {
                    that._loadDropDownData(false);
                }
            });
            //初始时候请求数据
            that._loadDropDownData(true);

            $('body').append(that.$dropdown);
            //点击文本狂显示
            that.$Input.on('click.addModel', function () {
                var searchText = that.$dropDownInput.val().trim();
                //如果有搜索记录则清空
                if (searchText != '') {
                    that.$dropDownInput.val('');

                }
                if (!that.IsQueryControl)
                    that._getAssociationFilterData();
                //每次打开下拉框都要重新加载数据
                //if (!$.isEmptyObject(that.SheetData))
                that._loadDropDownData(true);

                $('.form-query-dropdown').hide();
                var hh = '300px';
                if (that.IsQueryControl) {
                    hh = '200px';
                    that.$dropDownItemContainer.css('max-height', '150px');
                }
                //如果是列表过滤控件要重新获取坐标
                var h = that.$Input.outerHeight();
                var w = that.$Input.outerWidth();
                var position = that._getAbsPosition(that.$Input[0]);
                that.$dropdown.css({
                    'position': 'absolute',
                    'left': position.x,
                    'top': position.y + h,
                    'width': w
                    /*'height': hh*/
                });
                that.$dropdown.toggle();

                if (that.$dropdown.is(':hidden'))
                    return;
                //获取已经选中的item，在dropdown中设置勾中
                var selectedObjectIds = $(this).data('ObjectId');
                if (selectedObjectIds) {
                    var newSelectedObjectIds = [];
                    selectedObjectIds = selectedObjectIds.split(';');
                    for (var i = 0; i < selectedObjectIds.length; i++) {
                        if (selectedObjectIds[i] == 'undefined' || selectedObjectIds[i] == '') {
                            continue;
                        }
                        newSelectedObjectIds.push(selectedObjectIds[i]);
                    }
                    selectedObjectIds = newSelectedObjectIds;
                }
                if (selectedObjectIds && selectedObjectIds.length > 0) {
                    var checkboxItems = that.$dropDownItemContainer.find('input[type="checkbox"]');
                    for (var i = 0; i < checkboxItems.length; i++) {
                        $(checkboxItems[i]).prop('checked', false);
                        var itemObjectId = $(checkboxItems[i]).attr('data-itemid');
                        if ($.inArray(itemObjectId, selectedObjectIds) > -1) {
                            $(checkboxItems[i]).prop('checked', true);
                        }
                    }
                }
                //return false;
            });
            var eventName = 'click.';
            if (that.DataField) {
                if (that.DataField.indexOf('.') > 0) {
                    //在子表
                    var trObjectId = $(that.Element).closest('tr').attr('data-objectid');
                    eventName += trObjectId + '.' + that.DataField;
                } else {
                    eventName += that.DataField;
                }
            } else if (that.ID) {
                eventName += that.ID;
            }
            //点击DropDown以外区域隐藏
            //后续要改进，不要每个控件绑定document的click事件，能不能在一个click里面隐藏所有的。需要考虑到主表，子表，列表过滤，报表过滤，列表默认值等地方
            $(document).off(eventName).on(eventName, function (oEvent) {
                oEvent = oEvent || window.event;
                var position = that._getAbsPosition(that.$Input[0]);
                var w = that.$dropdown.outerWidth(false);
                var h = that.$dropdown.outerHeight(false) + that.$Input.outerHeight(false);
                var mouseLeft = oEvent.pageX || window.event.pageX;
                var mouseTop = oEvent.pageY || window.event.pageY;
                if (mouseLeft < position.x || mouseLeft > position.x + w || mouseTop < position.y || mouseTop > position.y + h) {
                    that.$dropdown.hide();
                }
            });
        },
        //渲染 FormQuery的Modal
        _renderModal: function (target) {
            var that = target;
            that.ID = "FormQuery_" + $.IGuid();
            that.$modal = $("<div id='" + that.ID + "' class='modal fade' tabindex='-1' role='dialog'>" +
                "<div class='modal-dialog modal-lg'>" +
                "<div class='modal-content'>" +
                "<div class='modal-header'><button type='button' class='close' data-dismiss='modal'><span aria-hidden='true'>&times;</span></button><h4 class='modal-title' style='height:auto;line-height:1.36;'>选择" + that.DisplayName + "</h4></div>" +
                "</div>" +
                "</div>" +
                "</div>");

            var $modalBody = $("<div class='modal-body'></div>");

            // 查询条件
            that.$searchForm = $("<div class='form-horizontal searchform myform-horizontal backgroundcolor'></div>");
            $modalBody.append(that.$searchForm);

            // 按钮
            that.$toolbar = $("<div class='toolbar text-center' style='margin-top:10px;'><div class='btn-group btn-group-sm' role='group'><button class='btn btn-default btn-sm btnSearch hide'><i class='fa fa-search'></i>查询</button><button class='btn btn-default btn-sm btnToggle hide'><i class='fa fa-angle-double-up'></i>收起</button><button class='btn btn-default btn-sm btnAdd hide'><i class='fa fa-plus'></i>新增</button></div></div>");
            $modalBody.append(that.$toolbar);

            // 表格
            that.Table_ID = "FormTable_" + $.IGuid();
            that.$table = $("<table id='" + that.Table_ID + "' style='border-top: 1px solid #f3ebd2;'></table>");

            var pagerStr = '<div class="table-page" id="bar-' + that.Table_ID + '">' +
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
                '<li><a>5</a></li>' +
                '<li><a>10</a></li>' +
                '<li><a>20</a></li>' +
                '<li><a>50</a></li>' +
                '</ul>' +
                '</div>' +
                '<div class="page-total">共0条</div>' +
                '</div>';
            var buttonStr = '<div class="btn-group btn-group-sm" role="group" style="width:100%;"><button class="btn btn-default btn-sm btnMultiSelect" style="float:right;">确定</button></div>';
            $modalBody.append(that.$table).append(pagerStr + buttonStr);
            //如果关联查询控件在子表中则允许批量选择，增加确定按钮
            //新增的时候出现按钮
            //$modalBody.append('<div class="btn-group btn-group-sm" role="group" style="width:100%;"><button class="btn btn-default btn-sm btnMultiSelect" style="float:right;">确定</button></div>')
            that.$modal.find(".modal-content").append($modalBody);
            $("body").append(that.$modal);

            //that.$Input = $("<div class='form-control form-query-add' style='height:32px;'></div");
            //that.$InputBody.append(that.$Input);
            that.SheetData = {
            };
            that.TableNeedRefresh = false;//为true的情况：关联查询过滤规则中配置了主表单的字段
            that.$addModel.off("click").on("click", function () {
                that.$dropdown.hide();
                //关联表单信息
                var associationSchemaInfo = $(that.Element).attr('data-boSchemaInfo');
                if (associationSchemaInfo != void 0 && associationSchemaInfo != '') {
                    var infoJson = $.parseJSON(associationSchemaInfo);
                    that.associateChildSchema = infoJson.IsChildSchema;
                } else {
                    that.associateChildSchema = undefined;
                }

                that._getAssociationFilterData();
                that.$modal.modal("show");
            });

            that.SearchInitialized = false; // 查询条件是否已初始化
            that.TableInitialized = false; // 表格是否已初始化
            that.CheckedRows = [];//点击“确定”按钮或者“查询”按钮将勾选的行存入CheckedRows
            // modal的show事件
            that.$modal.on("show.bs.modal", function (e) {
                if (that.IsQueryControl) {
                    that.SelectedItems = [];
                    var items = that.$Input.find('i');
                    for (var i = 0; i < items.length; i++) {
                        var $item = $(items[i]);
                        var objectId = $item.attr('data-objectid');
                        if (objectId == 'undefined') {
                            continue;
                        }
                        var name = $item.closest('a').text();
                        that.SelectedItems.push({
                            ObjectId: objectId, Name: name
                        });
                    }
                }

                that.$table.bootstrapTable('uncheckAll');
                //this.CheckedRows = [];
                var currModal = this;
                if (!$.FormQueryData.PropertyQueryItems[that.BOSchemaCode] || !$.FormQueryData.PropertyQueryColumns[that.BOSchemaCode]) {
                    that.Ajax("/Sheet/GetPropertyQueryColumnAndItem", "GET", {
                        schemaCode: that.BOSchemaCode,
                        flag: $.IGuid()
                    }, function (data) {
                        if (data.QueryColumns.length == 0 && data.QueryItems.length == 0) {
                            $(currModal).modal("hide");
                            $.IShowError("没有设置可用列！");
                            return;
                        }
                        $.FormQueryData.PropertyQueryColumns[that.BOSchemaCode] = data.QueryColumns;

                        //调整initSearchParams位置为initTable之前，原因是在关联列表中初始时候searchform是空
                        $.FormQueryData.PropertyQueryItems[that.BOSchemaCode] = data.QueryItems;
                        if (!that.SearchInitialized) {
                            that._initSearchParams(data.QueryItems);
                        }

                        if (!that.TableInitialized || that.TableNeedRefresh) {
                            that._initTable(data.QueryColumns);//合并表头
                        } else {
                            that._setRowChecked();
                        }
                    });
                }
                else {
                    if (!that.TableInitialized || that.TableNeedRefresh) {
                        that._initTable($.FormQueryData.PropertyQueryColumns[that.BOSchemaCode]);
                    } else {
                        that._setRowChecked();
                    }
                    if (!that.SearchInitialized) {
                        that._initSearchParams($.FormQueryData.PropertyQueryItems[that.BOSchemaCode]);
                    }
                }

                //如果是修改要隐藏“确定”按钮（确定按钮只有在关联查询字段在子表中且在新增时候显示）
                //if ((that.DataField != undefined && (that.DataField.indexOf('.') == -1 || that.$Input.find('a').attr('title') != '')) || !that.IsQueryControl) {
                //    //关联查询控件在主表
                //  that.$modal.find('.btnMultiSelect').addClass('hide');
                //    that.$table.bootstrapTable('hideColumn', 'checkcolumn');
                //} else {
                //    //关联查询控件在字表
                //    that.$modal.find('.btnMultiSelect').removeClass('hide');
                //    that.$table.bootstrapTable('showColumn', 'checkcolumn');
                //}
                if (that.DataField != undefined) {
                    //在表单中
                    if (that.DataField.indexOf('.') == -1 || that.$Input.find('a').attr('title') != '') {
                        //不是子表字段或者是修改值情况要隐藏checkbox和确定按钮
                        that.$modal.find('.btnMultiSelect').addClass('hide');
                        that.$table.bootstrapTable('hideColumn', 'checkcolumn');
                    } else {
                        //显示
                        that.$modal.find('.btnMultiSelect').removeClass('hide');
                        that.$table.bootstrapTable('showColumn', 'checkcolumn');
                    }
                } else {
                    //显示
                    that.$modal.find('.btnMultiSelect').removeClass('hide');
                    that.$table.bootstrapTable('showColumn', 'checkcolumn');
                }
                //判断是否要合并表头
                that._setColumnColspan(that.TableAllColumns);
            });

            var $btnAdd = that.$toolbar.find(".btnAdd");
            // 只有表单中的关联查询允许新增关联对象
            if (that.IsRunnable && that.CanCreate && $(that.Element).hasClass("sheet-control")) {
                // 新增关联对象
                $btnAdd.removeClass("hide");
                $btnAdd.off("click").on("click", function () {
                    that.Ajax("/Sheet/GetBizObjectSchemaDisplayName", "GET", {
                        schemaCode: that.BOSchemaCode,
                        flag: $.IGuid()
                    }, function (data) {
                        var url = "/Sheet/DefaultSheet/?ID=" + that.BOSchemaCode + "&SheetQueryField=" + that.DataField;
                        if (that.BizObjectId) {
                            url += "&SheetQueryRowId=" + that.BizObjectId;
                        }
                        that.$modal.modal("hide");
                        $.ISideModal.Show(url, data.DisplayName);
                    });
                });
            }
            else {
                $btnAdd.addClass("hide");
            }

            //子表批量选择功能
            var $btnMultiSelect = that.$modal.find('.btnMultiSelect');
            //批量选择确定
            $btnMultiSelect.off('click').on('click', function () {
                that.$modal.modal('hide');
                $('.table-tip').hide();
                //if (that.CheckedRows.length == 0) {
                //    return;
                //}
                if (that.IsQueryControl) {
                    if (that.associateChildSchema == undefined) {
                        that.associateChildSchema = false;
                        for (var key in that.CheckedRows[0]) {
                            if (key.toLowerCase().indexOf('.objectid') > -1) {
                                that.associateChildSchema = true;
                                break;
                            }
                        }
                    }
                    var objectIdStr = 'ObjectId';
                    var nameStr = 'Name';
                    if (that.associateChildSchema) {
                        objectIdStr = that.BOSchemaCode + '.ObjectId';
                        nameStr = that.BOSchemaCode + '.Name';
                    }
                    //用于列表过滤条件
                    that.$Input.empty();
                    that.$Input.data('ObjectId', '');
                    for (var i = 0; i < that.CheckedRows.length; i++) {
                        var objectId = that.CheckedRows[i][objectIdStr];
                        if (!objectId) {
                            continue;
                        }
                        var name = that.CheckedRows[i][nameStr];
                        var link = '<a href="javascript:;" class="label label-info" style="margin-bottom:-3px;">' + name + '<i class="fa fa-times" style="margin-left:5px" data-objectId="' + objectId + '"></i></a>';
                        that.$Input.append(link);
                        objectIds = that.$Input.data('ObjectId') || '';
                        objectIds += (objectId + ';');
                        that.$Input.data('ObjectId', objectIds);
                        //that.$dropDownItemContainer.find('input[type="checkbox"][data-itemid="' + thisObjectId + '"]').prop('checked', true);
                    }
                    that.$Input.find('i').on('click', function () {
                        var $this = $(this);
                        $this.closest('a').remove();
                        var objectIds = that.$Input.data('ObjectId');
                        var thisObjectId = $this.attr('data-ObjectId');
                        objectIds = objectIds.replace(thisObjectId + ';', '');
                        that.$Input.data('ObjectId', objectIds);
                        that.OnChange();
                        that.$dropDownItemContainer.find('input[type="checkbox"][data-itemid="' + thisObjectId + '"]').prop('checked', false);
                    });
                    that.OnChange();
                    return;
                }

                //获取check的行
                var datafield = that.DataField;
                //获取当前FormQuery所在行
                var gridView = that.$Input.closest("[data-controlkey='FormGridView']");
                var fGridView = $(gridView).FormGridView();
                var currTr = that.$Input.closest('tr');//当前行
                var nextTr = $(currTr).nextAll('tr');//后续行
                //先将当前行添加进去
                var currQuery = $(currTr).find('[data-datafield="' + datafield + '"][data-controlkey="FormQuery"]').FormQuery();
                var queryRows = [];
                queryRows.push(currQuery);
                if (nextTr.length == 0) {
                    //后续没有行，直接新增行
                    if (fGridView.Editable) {
                        for (var i = 0; i < that.CheckedRows.length - 1; i++) {
                            fGridView.AddRow();
                            var newTr = $(currTr).nextAll('tr').last();
                            var newQuery = $(newTr).find('[data-datafield="' + datafield + '"][data-controlkey="FormQuery"]').FormQuery();
                            queryRows.push(newQuery);
                        }
                    }
                } else {
                    //后续有行，需要判断行是否为空，取空行
                    var hasAddRow = false;//标记是否新增过行，如果新增过行则不需要便利已有行了
                    for (var i = 0; i < that.CheckedRows.length - 1; i++) {
                        var pushedOldRow = false;//标识是否将已有行加入queryRows
                        while ($(currTr).next('tr').length > 0 && !hasAddRow) {
                            var nextTr = $(currTr).next('tr');
                            var nextQuery = $(nextTr).find('[data-datafield="' + datafield + '"][data-controlkey="FormQuery"]').FormQuery();
                            var oldQueryValue = nextQuery.GetValue();
                            currTr = nextTr;
                            if (oldQueryValue != '' && oldQueryValue != void 0) {
                            } else {
                                queryRows.push(nextQuery);
                                pushedOldRow = true;
                                break;
                            }
                        }
                        //添加新行
                        if (!pushedOldRow) {
                            hasAddRow = true;
                            if (fGridView.Editable) {
                                fGridView.AddRow();
                                var newTr = $(currTr).nextAll('tr').last();
                                var newQuery = $(newTr).find('[data-datafield="' + datafield + '"][data-controlkey="FormQuery"]').FormQuery();
                                queryRows.push(newQuery);
                            }
                        }
                    }
                }

                //批量赋值
                setTimeout(function () {
                    for (var i = 0; i < that.CheckedRows.length; i++) {
                        var row = that.CheckedRows[i];
                        var objectId = row['ObjectId'];
                        var name = row['Name'];
                        if (that.associateChildSchema == true) {
                            objectId = row[that.BOSchemaCode + '.ObjectId'];
                            name = row[that.BOSchemaCode + '.Name'];
                        } else if (that.associateChildSchema == undefined) {//兼容旧的
                            for (var key in row) {
                                if (key.toLowerCase().indexOf('.objectid') > -1) {
                                    objectId = row[key];
                                }
                                if (key.toLowerCase().indexOf('.name') > -1) {
                                    name = row[key];
                                }
                            }
                        }
                        if (name == null || name.trim() == '') {
                            name = '--';
                        }
                        if (queryRows[i] == undefined) {
                            continue;
                        }
                        queryRows[i].$Input.data("ObjectId", objectId).text(name);
                        queryRows[i].OnChange.apply(queryRows[i], [row]);
                        queryRows[i]._toDetailLink();
                    }
                }, 0);
            });
        },

        //获取关联表单过滤条件中控件的值
        _getAssociationFilterData: function () {
            //判断关联查询是否配置了过滤规则
            //如果配置了过滤规则且规则中有当前主表单的字段
            //则要取主表单中的字段
            //兼容旧的bofilter
            var that = this;
            if (that.DataField == void 0) {
                return;
            }
            var bofilter = $(that.Element).attr('data-bofilter');
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
                        }
                        if (controlDataField == 'OwnerId') {
                            hasOwnerCtrl = true;
                        }
                        if (controlDataField == 'OwnerDeptId') {
                            hasOwnerDeptCtrl = true;
                        }
                        //rule.indexOf(controlDataField)<0这样不能判断rule中是否有controlDataField,例如rule:{D00001.helloworld}=="hi",controlDataField:hello
                        if (rule.indexOf(controlDataField + '}') < 0 || controlDataField == that.DataField) continue;
                        //如果rule中包含controlDataField，则应该是以如下形式存在
                        //{xx}或者{xxx.xx}形式，主表中的字段是{controlDataField}，子表中字段是{xxx.controlDataField}
                        var ctrlFieldIndex = rule.indexOf(controlDataField + '}');
                        var prefix = rule.slice(ctrlFieldIndex - 1, ctrlFieldIndex);
                        if (prefix != '{' && prefix != '.') {
                            continue;
                        }
                        //字表中的control不调用SaveDataField，由子表自己调用SaveDataField保存值
                        var controlValue = '';
                        if (controlDataField == 'CreatedBy') {
                            controlValue = $.SmartForm.ResponseContext.ReturnData.CreatedBy.Value[0].UnitId;
                        } else {
                            if (ctrl.DataField == void 0 || controlDataField == "Comments") continue;
                            //判断关联查询控件是否在子表中
                            if (controlDataField.indexOf('.') > 0 && ctrl.Type != 26 && ctrl.Type != 27) {
                                //规则中的字段在子表中
                                if (that.DataField.indexOf('.') > 0) {
                                    //获取与关联查询控件同一行的子表控件
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
                                } else if (ctrl.Type == 7) {
                                    controlValue = ctrl.GetNum();
                                } else {
                                    controlValue = ctrl.GetValue();
                                }
                            }
                        }
                        that.SheetData[controlDataField] = controlValue;
                        that.TableNeedRefresh = true;
                    }
                    if (!hasCreatedByCtrl) {
                        that.SheetData["CreatedBy"] = $.SmartForm.ResponseContext.ReturnData.CreatedBy.Value[0].UnitId;
                    }
                    if (!hasOwnerCtrl) {
                        that.SheetData["OwnerId"] = $.SmartForm.ResponseContext.ReturnData.OwnerId.Value[0].UnitId;
                    }
                    if (!hasOwnerDeptCtrl) {
                        that.SheetData["OwnerDeptId"] = $.SmartForm.ResponseContext.ReturnData.OwnerDeptId.Value[0].UnitId;
                    }
                    that.SheetData["CreatedTime"] = $.SmartForm.ResponseContext.ReturnData.CreatedTime.Value;
                }
            }
        },
        //判断是否要合并表头
        _setColumnColspan: function (columns) {
            if (columns == void 0 || columns.length == 0) {
                return;
            }
            var colspantr = this.$table.find('thead tr[class="tr-colspan"]');
            if (colspantr != void 0 && colspantr.length > 0) {
                return;
            }
            var parentColumnCount = 0;
            var childColumnCount = 0;
            for (var i = 0; i < columns.length; i++) {
                var field = columns[i].field;
                if (!columns[i].visible || field == undefined) {
                    continue;
                }
                if (field.indexOf('.') > -1) {
                    childColumnCount++;
                } else {
                    parentColumnCount++;
                }
            }
            if (childColumnCount > 0) {
                if (this.$table.find('th[data-field="checkcolumn"]').length == 0 && this.DataField.indexOf('.') > 0) {
                    //checkbox不可见
                    childColumnCount++;
                    parentColumnCount--;
                }
                var tr = $('<tr class="tr-colspan"></tr>').append('<th colspan="' + parentColumnCount + '" style="text-align:center;">主表</th>').append('<th colspan="' + childColumnCount + '" style="text-align:center;">子表</th>');
                //var thead = this.$table.find('thead');
                var oldtr = this.$table.find('thead tr');
                $(tr).insertBefore(oldtr);
            }
        },
        _checkRows: function (rows) {
            var that = this;
            var childObjectId = undefined;
            //先判断是check的是单行还是多行
            var tempRows = that.CheckedRows;
            if (that.associateChildSchema == true) {
                childObjectId = that.BOSchemaCode + '.ObjectId';
            }
            if ($.isArray(rows)) {
                if (that.associateChildSchema == undefined) {
                    //兼容旧的
                    for (var key in rows[0]) {
                        if (key.toLowerCase().indexOf('.objectid') > -1) {
                            childObjectId = key;
                            break;
                        }
                    }
                }
                for (var i = 0; i < rows.length; i++) {
                    var rowExist = false;
                    for (var j = 0; j < tempRows.length; j++) {
                        if (childObjectId != undefined) {
                            if (rows[i][childObjectId] == tempRows[j][childObjectId]) {
                                rowExist = true;
                                break;
                            }
                        } else {
                            if (rows[i]['ObjectId'] == that.CheckedRows[j]['ObjectId']) {
                                rowExist = true;
                                break;
                            }
                        }
                    }
                    if (!rowExist) {
                        that.CheckedRows.push(rows[i]);
                    }
                }
            } else {
                if (that.associateChildSchema == undefined) {//兼容旧的
                    for (var key in rows) {
                        if (key.toLowerCase().indexOf('.objectid') > -1) {
                            childObjectId = key;
                            break;
                        }
                    }
                }
                var rowExist = false;
                for (var i = 0; i < tempRows.length; i++) {
                    if (childObjectId != undefined) {
                        if (tempRows[i][childObjectId] == rows[childObjectId]) {
                            rowExist = true;
                            break;
                        }
                    } else {
                        if (tempRows[i]['ObjectId'] == rows['ObjectId']) {
                            rowExist = true;
                        }
                    }
                }
                if (!rowExist) {
                    that.CheckedRows.push(rows);
                }
            }
        },
        _unCheckRows: function (rows) {
            var that = this;
            var childObjectId = undefined;
            var tempRows = that.CheckedRows;
            if (that.associateChildSchema == true) {
                childObjectId = that.BOSchemaCode + '.ObjectId';
            }
            if ($.isArray(rows)) {//多行
                if (that.associateChildSchema == undefined) {//兼容旧的
                    for (var key in rows[0]) {
                        if (key.toLowerCase().indexOf('.objectid') > -1) {
                            childObjectId = key;
                            break;
                        }
                    }
                }
                for (var i = 0; i < rows.length; i++) {
                    for (var j = 0; j < tempRows.length; j++) {
                        if (childObjectId != undefined) {
                            that.CheckedRows = $.grep(that.CheckedRows, function (item, n) {
                                return item[childObjectId] == rows[i][childObjectId];
                            }, true);
                        } else {
                            that.CheckedRows = $.grep(that.CheckedRows, function (item, n) {
                                return item['ObjectId'] == rows[i]['ObjectId'];
                            }, true);
                        }
                    }
                }
            } else {//单行
                if (that.associateChildSchema == undefined) {//兼容旧的
                    for (var key in rows) {
                        if (key.toLowerCase().indexOf('.objectid') > -1) {
                            childObjectId = key;
                            break;
                        }
                    }
                }
                for (var i = 0; i < tempRows.length; i++) {
                    if (childObjectId != undefined) {
                        //if (tempRows[i][childObjectId] == rows[childObjectId]) {
                        //移除行
                        //that.CheckedRows.splice($.inArray(rows, that.CheckedRows), 1);
                        //}
                        that.CheckedRows = $.grep(that.CheckedRows, function (item, n) {
                            return item[childObjectId] == rows[childObjectId];
                        }, true);
                    } else {
                        that.CheckedRows = $.grep(that.CheckedRows, function (item, n) {
                            return item['ObjectId'] == rows['ObjectId'];
                        }, true);
                    }
                }
            }
        },
        _initSearchParams: function (queryItems) {
            var that = this;
            if (!queryItems || queryItems.length == 0) {
                this.$searchForm.hide();
                return;
            }
            var searchHtml = "";
            var showCount = 0;
            for (var i = 0, len = queryItems.length; i < len; i++) {
                var queryItem = queryItems[i];
                if (queryItem.Visible == false) {
                    continue;
                }
                searchHtml += (showCount % 2 == 0 ? "<div class='form-group form-group-sm myform-group mgb5' style='margin-bottom:0;'>" : "");
                switch (queryItem.DataType) {
                    case 1:
                        //searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><span class="mycheckbox" data-propertyname="' + queryItem.PropertyName + '"><label class="checkbox-inline"><input type="checkbox" class="myform-control" value="true" style="display:block;" /> 是</label><label class="checkbox-inline"><input type="checkbox" value="false" style="display:block;" /> 否</label></span></div>';
                        searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><span class="mycheckbox" data-propertyname="' + queryItem.PropertyName + '"><label class="checkbox-inline"><input type="checkbox" value="true" style="display:block;" /> 是</label><label class="checkbox-inline"><input type="checkbox" value="false" style="display:block;" /> 否</label></span></div>';
                        break;
                    case 14:
                        if (queryItem.SelectedValues && queryItem.SelectedValues !== "") {
                            var checkItemsHtml = "";
                            var checkItems = queryItem.SelectedValues.split(";");
                            searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5">';
                            searchHtml += "<select id='" + queryItem.PropertyName + "' multiple='multiple' class='mymultiselect'>";
                            for (var ci = 0, clen = checkItems.length; ci < clen; ci++) {
                                checkItemsHtml += "<option value='" + checkItems[ci] + "'> " + checkItems[ci] + "</option>";
                            }
                            searchHtml += checkItemsHtml;
                            searchHtml += "</select></div>";
                        }
                        else {
                            if (queryItem.PropertyName == "SeqNo") {
                                searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><input class="form-control mytext " type="text" data-propertyname="' + queryItem.PropertyName + '" /></div>';
                            }
                            else {
                                searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="mycombobox" data-dataField="' + queryItem.PropertyName + '" data-schemaCode="' + this.BOSchemaCode + '" data-width="100%" data-defalutvalue="' + queryItem.DefaultValue + '"> </div></div>';
                            }
                        }
                        break;

                    case 13:
                        searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><input class="form-control mytext " type="text" data-propertyname="' + queryItem.PropertyName + '" /></div>';
                        break;
                    case 7:
                    case 9:
                    case 11:
                    case 35:

                        if (queryItem.DisplayName == "Status") {
                            //关联查询中的的筛选,隐藏流程状态
                            //add by jnyf
                            continue;
                            //流程状态
                            searchHtml += '<label class="col-sm-2 control-label">流程状态</label><div class="col-sm-4 pdt5">';
                            searchHtml += '<select id="' + queryItem.DisplayName + '" multiple="multiple" class="mymultiselect">';
                            searchHtml += '<option value="进行中">进行中</option><option value="已结束">已结束</option><option value="已取消">已取消</option>';
                            searchHtml += '</select>';
                            searchHtml += '</div>';
                        } else {
                            searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="input-group mynum" data-propertyname="' + queryItem.PropertyName + '"><div class="input-group-addon">从</div><input type="text" class="form-control" /><div class="input-group-addon">至</div><input type="text" class="form-control" /></div></div>';
                        }
                        break;
                    case 5:
                        searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="input-group mydatetime" data-propertyname="' + queryItem.PropertyName + '"><div class="input-group-addon">从</div><input type="text" data-datetimemode="' + queryItem.DateTimeMode + '" class="form-control mydatetimepicker mytimestart" /><div class="input-group-addon">至</div><input type="text" data-datetimemode="' + queryItem.DateTimeMode + '" class="form-control mydatetimepicker mytimeend" /></div></div>';
                        break;
                    case 26:
                        var tempHtml = '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="myuserpicker" data-propertyname="' + queryItem.PropertyName + '" data-width="100%"></div></div>';
                        if (queryItem.PropertyName == 'OwnerId' || queryItem.PropertyName == 'CreatedBy') {
                            tempHtml = '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="myuserpicker" data-propertyname="' + queryItem.PropertyName + '" data-orgunitvisible="false" data-width="100%"></div></div>';
                        } else if (queryItem.PropertyName == 'OwnerDeptId') {
                            tempHtml = '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 pdt5"><div class="myuserpicker" data-propertyname="' + queryItem.PropertyName + '" data-orgunitvisible="true" data-uservisible="false" data-width="100%"></div></div>';
                        }
                        searchHtml += tempHtml;
                        break;
                    case 50:
                        searchHtml += '<label class="col-sm-2 control-label">' + queryItem.DisplayName + '</label><div class="col-sm-4 mydropdown pdt5" data-propertyname="' + queryItem.PropertyName + '" data-boschemacode="' + queryItem.AssociationSchemaCode + '"></div>';
                        break;
                }
                searchHtml += ((showCount % 2 || showCount === len - 1) != 0 ? "</div>" : "");
                showCount++;
            }
            this.$searchForm.append(searchHtml);

            $(".mycombobox").each(function () {
                var $combobox = $(this);
                var schemacode = $combobox.attr("data-schemaCode");
                var datafield = $combobox.attr("data-dataField");
                var defaultvalue = $combobox.attr("data-defalutvalue");
                var mycombobox = $combobox.FormComboBox({
                    SchemaCode: schemacode, DataField: datafield, DefaultValue: defaultvalue, Width: "50%",
                    OnChange: function () {
                        that._refreshTable();
                    },
                });
            });


            this.$searchForm.find(".mycombobox").removeClass("form-group");


            // 统一初始化datetimepicker
            this.$searchForm.find(".mydatetimepicker").each(function () {
                var $picker = $(this);
                var minView = 2;
                var startView = 2;
                var mode = $picker.attr("data-datetimemode");
                if (!mode) {
                    mode = "yyyy-mm-dd";
                }
                if (mode == "yyyy-mm-dd hh:ii") {
                    minView = 0;
                }
                $picker.datetimepicker({
                    language: 'zh-CN',
                    format: mode,
                    todayBtn: true,
                    container: $picker.closest(".modal-dialog"),
                    autoclose: true,
                    startView: startView, // 选择器打开后首先显示的视图
                    minView: minView// 选择器能够提供的最精确的视图
                }).on("changeDate", function () {
                    that._refreshTable();
                });;
            });
            // 统一初始化选人控件
            var $myuserpicker = this.$searchForm.find(".myuserpicker");

            if (!$.isEmptyObject($myuserpicker)) {
                for (var r = 0; r < $myuserpicker.length; r++) {
                    var tempSheetUser = $($myuserpicker[r]).FormUser();
                    tempSheetUser.OnChange = function () {
                        that._refreshTable();
                    }
                }
            }

            this.$searchForm.find(".myuserpicker").removeClass("form-group");
            this.$searchForm.find(".mymultiselect").each(function () {
                $(this).multiselect({
                    buttonText: function (options, select) {
                        if (options.length === 0) {
                            return "";
                        }
                        else {
                            var labels = [];
                            options.each(function () {
                                if ($(this).attr("label") !== void 0) {
                                    labels.push($(this).attr("label"));
                                }
                                else {
                                    labels.push($(this).html());
                                }
                            });
                            return labels.join(",") + "";
                        }
                    },
                    onChange: function () {
                        //that._refreshTable(); 
                    },
                    selectedClass: "multiselect-selected"
                });
            });
            // 统一初始化关联查询控件
            this.$searchForm.find(".mydropdown").each(function () {
                var myquery = $(this).FormQuery();
                myquery.IsQueryControl = true;
                myquery.OnChange = function () {
                    that._refreshTable();
                }
            });//.FormQuery();
            this.$searchForm.find(".mydropdown").removeClass("form-group");


            this.$searchForm.find("input[type='text']").blur(function () {
                //有下拉选项中在ValChange触发刷新数据
                if (!$(this).hasClass("comboboxtext")) {
                    that._refreshTable();
                }
            }).keydown(function (e) {
                if (e.which == 13) {
                    that._refreshTable();
                }
            });

            this.$searchForm.find("input[type='checkbox']").change(function () {
                that._refreshTable();
            });

            /***********************************关联查询默认查询 Begin***********************************/
            //格式化日期
            var formatDate = function (date) {
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                return year + '-' + (month < 10 ? ('0' + month) : month) + '-' + (day < 10 ? ('0' + day) : day);
            };
            //当天
            var thisDay = function () {
                var date = new Date();
                date = formatDate(date);
                return date + ';' + date;
            };
            //本周
            var thisWeek = function () {
                var date = new Date();
                var year = date.getFullYear();
                var month = date.getMonth();
                var day = date.getDate();
                var dayOfWeek = date.getDay();
                var start = new Date(year, month, day - dayOfWeek);
                start = formatDate(start);
                var end = new Date(year, month, day + (6 - dayOfWeek));
                end = formatDate(end);
                return start + ';' + end;
            };
            //本月
            var thisMonth = function () {
                var date = new Date();
                var year = date.getFullYear();
                var month = date.getMonth();
                var start = new Date(year, month, 1);
                start = formatDate(start);
                var end = new Date(year, month + 1, 0);
                end = formatDate(end);
                return start + ';' + end;
            };
            //本季度
            var thisQuarter = function () {
                var startMonth = 0;
                var date = new Date();
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                if (month < 3) {
                    startMonth = 0;
                } else if (month > 2 && month < 6) {
                    startMonth = 3;
                } else if (month > 5 && month < 9) {
                    startMonth = 6;
                } else if (month > 8) {
                    startMonth = 9;
                }
                var start = new Date(year, startMonth, 1);
                var end = new Date(year, startMonth + 3, 0);
                start = formatDate(start);
                end = formatDate(end);
                return start + ';' + end;
            };
            //本年度
            var thisYear = function () {
                var date = new Date();
                var year = date.getFullYear();
                var start = new Date(year, 0, 1);
                var end = new Date(year, 12, 0);
                start = formatDate(start);
                end = formatDate(end);
                return start + ';' + end;
            };
            //设置默认查询值
            //下面这段代码主要是用于关联查询中设置默认值的列表
            var searchParams = {
            };
            for (var i = 0; i < queryItems.length; i++) {
                var item = queryItems[i];
                if (item.DataType == 5) {
                    //datetime
                    var filterValue = parseInt(item.FilterValue);
                    switch (filterValue) {
                        case 1://当天
                            searchParams[item.PropertyName] = thisDay();
                            break;
                        case 2://本周
                            searchParams[item.PropertyName] = thisWeek();
                            break;
                        case 3://本月
                            searchParams[item.PropertyName] = thisMonth();
                            break;
                        case 4://本季度
                            searchParams[item.PropertyName] = thisQuarter();
                            break;
                        case 5://本年度
                            searchParams[item.PropertyName] = thisYear();
                            break;
                        default:
                            break;
                    }
                } else if (item.DataType == 26) {
                    var filterValue = parseInt(item.FilterValue);
                    var organizationType = parseInt(item.OrganizationType);
                    switch (filterValue) {
                        case 1://本人
                            searchParams[item.PropertyName] = item.DefaultValue + ";" + organizationType;
                            break;
                        case 2://本部门
                            searchParams[item.PropertyName] = item.DefaultValue + ";" + organizationType;
                            break;
                        default:
                            break;
                    }
                }
                else {
                    searchParams[queryItems[i].PropertyName] = queryItems[i].DefaultValue;
                }
            }
            var $divSearch = this.$searchForm;

            //单选、多选、下拉
            var myMultiSelect = $divSearch.find(".mymultiselect");
            for (var i = 0; i < myMultiSelect.length; i++) {
                var $property = $(myMultiSelect[i]);
                var propertyName = $property.attr("id");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    $property.multiselect("select", propertyVal.split(";"));
                }
            }
            //$divSearch.find(".mymultiselect").each(function () {
            //    var propertyName = $(this).attr("id");
            //    if (searchParams[propertyName]) {
            //        $(this).multiselect("select", searchParams[propertyName].split(";"));
            //    }
            //});
            // 文本
            var myText = $divSearch.find(".mytext");
            for (var i = 0; i < myText.length; i++) {
                var $property = $(myText[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    $property.val(propertyVal);
                }
            }
            //$divSearch.find(".mytext").each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName]) {
            //        $(this).val(searchParams[propertyName]);
            //}
            //});

            // 选人
            var myUserPicker = $divSearch.find(".myuserpicker");
            for (var i = 0; i < myUserPicker.length; i++) {
                var $property = $(myUserPicker[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    var arr = propertyVal.split(';');
                    var $ctrl = $property.FormUser();//.SetValue(arr[0]);
                    $ctrl.SetValue(arr[0]);
                    if (parseInt(arr[1]) == 0) {
                        //人员可选
                        $($ctrl.Element).find('li[data-tabtype="tab_Deps"]').remove();
                    } else if (parseInt(arr[1]) == 1) {
                        //部门可选
                        $($ctrl.Element).find('li[data-tabtype="tab_Users"]').remove();
                    }
                }
            }
            //$divSearch.find(".myuserpicker").each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName]) {
            //        var arr = searchParams[propertyName].split(';');
            //        var $ctrl = $(this).FormUser();//.SetValue(arr[0]);
            //        $ctrl.SetValue(arr[0]);
            //        if (parseInt(arr[1]) == 0) {
            //            //人员可选
            //            $($ctrl.Element).find('li[data-tabtype="tab_Deps"]').remove();
            //        } else if (parseInt(arr[1]) == 1) {
            //            //部门可选
            //            $($ctrl.Element).find('li[data-tabtype="tab_Users"]').remove();
            //        }
            //    }
            //});

            // 数字
            var myNum = $divSearch.find(".mynum");
            for (var i = 0; i < myNum.length; i++) {
                var $property = $(myNum[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    //var defaultValue = propertyVal;
                    var valArr = propertyVal.split(";");
                    for (var i = 0; i < valArr.length; i++) {
                        if (!$.isNumeric(valArr[i])) {
                            continue;
                        }
                        $property.find("input:text").eq(i).val(valArr[i]);
                    }
                }
            }
            //$divSearch.find(".mynum").each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName]) {
            //        var defaultValue = searchParams[propertyName];
            //        var valArr = defaultValue.split(";");
            //        for (var i = 0; i < valArr.length; i++) {
            //            if (!$.isNumeric(valArr[i])) {
            //                continue;
            //            }
            //            $(this).find("input:text").eq(i).val(valArr[i]);
            //        }
            //    }
            //});
            //是/否
            var myCheckBox = $divSearch.find('.mycheckbox');
            for (var i = 0; i < myCheckBox.length; i++) {
                var $property = $(myCheckBox[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal != undefined && propertyVal != null && propertyVal != "") {
                    if (propertyVal) {
                        $property.find("input[value='true']").prop("checked", "true");
                    }
                    else {
                        $property.find("input[value='false']").prop("checked", "true");
                    }
                }
            }
            //$divSearch.find('.mycheckbox').each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName] != undefined && searchParams[propertyName] != null && searchParams[propertyName] != "") {
            //        if (searchParams[propertyName]) {
            //            $(this).find("input[value='true']").prop("checked", "true");
            //        }
            //        else {
            //            $(this).find("input[value='false']").prop("checked", "true");
            //        }
            //    }
            //});
            //datetime
            var myDateTime = $divSearch.find(".mydatetime");
            for (var i = 0; i < myDateTime.length; i++) {
                var $property = $(myDateTime[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    var days = propertyVal.split(';');
                    var picker = $property.find(".mydatetimepicker");
                    for (var j = 0; j < picker.length; j++) {
                        $(picker[j]).val(days[j]);
                    }
                }
            }
            //$divSearch.find(".mydatetime").each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName]) {
            //        var days = searchParams[propertyName].split(';');
            //        var picker = $(this).find(".mydatetimepicker");
            //        for (var i = 0; i < picker.length; i++) {
            //            $(picker[i]).val(days[i]);
            //        }
            //    }
            //});
            // FormQuery
            var myDropDown = $divSearch.find(".mydropdown");
            for (var i = 0; i < myDropDown.length; i++) {
                var $property = $(myDropDown[i]);
                var propertyName = $property.attr("data-propertyname");
                var propertyVal = searchParams[propertyName];
                if (propertyVal) {
                    var formQuery = $property.FormQuery();
                    formQuery.SetValue(propertyVal);
                }
            }
            //$divSearch.find(".mydropdown").each(function () {
            //    var propertyName = $(this).attr("data-propertyname");
            //    if (searchParams[propertyName]) {
            //        $(this).FormQuery().SetValue(searchParams[propertyName]);
            //    }
            //});
            /***********************************关联查询默认查询 End***********************************/



            var $btnSearch = this.$toolbar.find(".btnSearch");
            $btnSearch.removeClass("hide");
            $btnSearch.click(function () {
                that._refreshTable();
                return false;
            });
            // 查询条件展开or收起
            var $btnToggle = this.$toolbar.find(".btnToggle");
            $btnToggle.removeClass("hide");
            $btnToggle.click(function () {
                if ($(this).text() === "收起") {
                    $(this).html("<i class='fa fa-angle-double-down'></i>展开");
                    that.$searchForm.find("div.form-group:gt(1)").hide();
                }
                else {
                    $(this).html("<i class='fa fa-angle-double-up'></i>收起");
                    that.$searchForm.find("div.form-group").show();
                }
                return false;
            });

            // 查询条件多于2行时默认触发收起
            var seachRowCount = this.$searchForm.find("div.form-group").length;
            if (seachRowCount > 2) {
                $btnToggle.trigger("click");
            }
            else { // 查询条件少于3行时，隐藏收起按钮
                $btnToggle.hide();

                // 没有查询条件时，隐藏查询按钮
                if (seachRowCount === 0) {
                    $btnSearch.hide();
                }
            }

            this.SearchInitialized = true;
        },

        _initTable: function (queryColumns) {
            var that = this;
            var columns = [];
            if (queryColumns) {
                for (var i = 0, len = queryColumns.length; i < len; i++) {
                    var queryColumn = queryColumns[i];
                    columns.push({
                        field: queryColumn["PropertyName"],
                        title: queryColumn["DisplayName"] == "名称" ? "表单名称" : queryColumn["DisplayName"],
                        visible: queryColumn["Visible"],
                        formatter: function (value, row, index, field) {
                            if (value != null && value.constructor == Object) {
                                if (value.IsCustom != null) {
                                    value = value.Value;
                                }
                                else if (value.Color != null) {
                                    return "<span style='padding: 5px 15px 5px 15px;border-radius:4px; color:#fff;background-color:" + value.Color.toString() + ";'>" + value.Value + "</span>";
                                }
                            }
                            if (value != null && value.constructor == String && (value.indexOf("<") || value.indexOf(">"))) {
                                value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            }
                            if (field == OwnerDeptId_Name) {
                                return value;
                            }
                            if (value == null || value.toString().trim() == "") value = "--";
                            return value;
                        }
                    });
                }
            }
            if (/*this.DataField == undefined || this.DataField.indexOf('.') > 0*/typeof (this.DataField) != "undefined" && this.DataField.indexOf('.') > 0 || this.IsQueryControl) {
                //当前关联查询控件在子表中,在column中增加一个checkbox列
                var checkColumn = [];
                var checkColumn = {
                    field: 'checkcolumn',
                    title: '',
                    visible: true,
                    checkbox: true,
                    clickToSelect: true
                };
                var tempColumns = columns;
                columns = [];
                columns.push(checkColumn);
                columns = columns.concat(tempColumns);
            }
            that.TableAllColumns = columns;
            // 关联查询只显示审批通过的记录
            this.$table.bootstrapTable('destroy');
            this.$table.bootstrapTable({
                method: "post",
                // 添加SheetQuery标识，让关联查询只以列表展现
                //这里传入scopeType为OwnAndOwnDept。如果不传入默认权限为own
                url: "/App/DoAction/?Command=Load&QueryCode=" + this.BOSchemaCode + "&Status=1&SheetQuery=1&isFormControl=true&SheetCode=" + this.SchemaCode + "&DataField=" + this.DataField + '&SheetData=' + JSON.stringify(this.SheetData) + '&scopeType=3',
                // clickToSelect:true,
                cache: false,
                striped: false,
                sidePagination: "server",
                pagination: true,
                pageSize: 10,
                contentType: "application/x-www-form-urlencoded",
                pageList: [10, 20, 50],
                columns: columns,
                idField: "ObjectId",
                sortName: "",
                sortOrder: "",
                TargetId: that.Table_ID,
                queryParams: function (params) {
                    return that._formatQueryParams(params);
                },
                onLoadSuccess: function (data) {
                    that.LoadData = data;
                    that.$table.find("tbody > tr").css({
                        "cursor": "pointer"
                    });
                    that.$table.find("th")
                    that.TableInitialized = true;
                    that.$table.closest('.fixed-table-body').css('height', '260px');

                    //设置选中行
                    that._setRowChecked();
                },
                onCheck: function (row, $element) {
                    that._checkRows(row);
                },
                onCheckAll: function (rows) {
                    that._checkRows(rows);
                },
                onUncheck: function (row, $element) {
                    that._unCheckRows(row);
                },
                onUncheckAll: function (rows) {
                    that._unCheckRows(rows);
                },
                onClickRow: function (row, $element) {
                    //点击行不执行操作的情况（显示勾选框情况）
                    //1.在表单中控件在子表
                    //2.列表、报表过滤
                    if ((that.DataField != void 0 && that.DataField.indexOf('.') > -1 && that.$Input.data('ObjectId') == undefined) || that.IsQueryControl) {
                        //如果关联查询控件在子表中则执行onCheck事件以批量选择，不执行ClickRow事件
                        return;
                    }
                    that.$modal.modal("hide");
                    $(".table-tip").hide();
                    //处理子表情况
                    var ObjectId = row["ObjectId"];
                    var name = row["Name"];
                    if (that.associateChildSchema == true) {
                        ObjectId = row[that.BOSchemaCode + '.ObjectId'];
                        name = row[that.BOSchemaCode + '.Name'];
                    } else if (that.associateChildSchema == undefined) {//兼容旧的
                        for (var key in row) {
                            if (key.toLowerCase().indexOf(".objectid") > -1) {
                                ObjectId = row[key];
                            }
                            if (key.toLowerCase().indexOf(".name") > -1) {
                                name = row[key];
                            }
                        }
                    }


                    if (name == null || name.trim() == "") {
                        name = "--";
                    }
                    that.$Input.data("ObjectId", ObjectId).text(name);
                    that.OnChange.apply(that, [row]);
                    that._toDetailLink();
                },
                responseHandler: function (params) {
                    if (params.ReturnData === null) params.ReturnData = new Array(); // added by jnyf 
                    that.RenderPage.call(this, params);// added by xiechang
                    return {
                        rows: params.ReturnData, total: params.DataCount
                    };
                },
                onAll: function () {
                }
            });
            that._setColumnColspan(columns);

            this.$table.off("mouseenter.list").on("mouseenter.list", 'td', function () {
                var $tableTip = $(".table-tip"), $TextLabel = $(".TextLabel");
                $tableTip.length == 0 && ($tableTip = $('<div class="table-tip" style="display: none;"></div>').appendTo($("body")));
                $TextLabel.length == 0 && ($TextLabel = $('<label class="TextLabel" style="display: none; opacity:0; position:fixed;"></label>').appendTo($("body")));
                var $that = $(this);
                $TextLabel.text($that.text());
                if ($TextLabel.width() > $that.width()) {
                    var offset = $that.offset();
                    $tableTip.text($that.text()).css({
                        left: offset.left + ($that.outerWidth() - $tableTip.outerWidth()) / 2 - $(window).scrollLeft(), bottom: $(window).height() - offset.top + 6 + $(window).scrollTop()
                    }).show();
                }
            });

            this.$table.off("mouseleave.list").on("mouseleave.list", 'td', function () {
                $(".table-tip").hide();
                return false;
            });
        },
        //设置行选中
        _setRowChecked: function () {
            var that = this;
            if (that.IsQueryControl) {
                if (that.SelectedItems.length == 0) {
                    return;
                }
                that.CheckedRows = that.CheckedRows.concat(that.SelectedItems);

                var data = that.$table.bootstrapTable('getData', true);
                if (that.associateChildSchema == undefined) {
                    that.associateChildSchema = false;
                    if (data && data.length > 0) {
                        for (var key in data[0]) {
                            if (key.indexOf('.ObjectId') > -1) {
                                that.associateChildSchema = true;
                                break;
                            }
                        }
                    }
                }
                var objectIdStr = 'ObjectId';
                if (that.associateChildSchema) {
                    objectIdStr = that.BOSchemaCode + '.ObjectId';
                }
                var childSchemaObjectId = undefined;
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < that.SelectedItems.length; j++) {
                        if (data[i][objectIdStr] == that.CheckedRows[j].ObjectId) {
                            that.$table.bootstrapTable('check', i);
                            break;
                        }
                    }
                }
            }

            //设置选中行
            if (that.CheckedRows.length == 0)
                return;
            var data = that.$table.bootstrapTable('getData', true);
            var childSchemaObjectId = undefined;
            if (data.length > 0) {
                if (that.associateChildSchema == true) {
                    childSchemaObjectId = that.BOSchemaCode + '.ObjectId';
                } else if (that.associateChildSchema == undefined) {
                    for (var key in data[0]) {
                        if (key.toLowerCase().indexOf(".objectid") > -1) {
                            childSchemaObjectId = key;
                            break;
                        }
                    }
                }
            }
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < that.CheckedRows.length; j++) {
                    if (childSchemaObjectId != undefined) {
                        if (data[i][childSchemaObjectId] == that.CheckedRows[j][childSchemaObjectId]) {
                            that.$table.bootstrapTable('check', i);
                            break;
                        }
                    } else {
                        if (data[i].ObjectId == that.CheckedRows[j].ObjectId) {
                            that.$table.bootstrapTable('check', i);
                            break;
                        }
                    }
                }
            }
        },
        _refreshTable: function () {
            this.$table.bootstrapTable("refresh");
        },

        // 添加查询条件
        _formatQueryParams: function (params) {
            var searchParams = {
            };
            var $divSearch = this.$searchForm;

            var myMultiSelect = $divSearch.find(".mymultiselect");
            for (var i = 0; i < myMultiSelect.length; i++) {
                var v = [];
                var $multiSelect = $(myMultiSelect[i]);
                var selectedText = $multiSelect.parent().find(".multiselect-selected-text").text();
                if (selectedText) {
                    v = selectedText.split(/,|，/); //支持中文逗号
                }
                if (v.length > 0) {
                    for (var j = 0; j < v.length; j++) {
                        v[j] = $.trim(v[j]);
                    }
                    searchParams[$multiSelect.attr("id")] = v;
                }
            }
            // 文本
            var myText = $divSearch.find(".mytext");
            for (var i = 0; i < myText.length; i++) {
                var $text = $(myText[i]);
                var v = $.trim($text.val());
                if (v !== "") {
                    if (v.indexOf(",") > -1 || v.indexOf("，") > -1) {
                        v = v.split(/,|，/);
                        if (v.length > 0) {
                            for (var j = 0; j < v.length; j++) {
                                v[j] = $.trim(v[j]);
                                if (v[j] == "--")//未填写，空白值项
                                {
                                    v[j] = "";
                                }
                            }
                            searchParams[$text.attr("data-propertyname")] = v;
                        }
                    }
                    else {
                        if ($.trim(v) == "--") {
                            searchParams[$text.attr("data-propertyname")] = [""];
                        }
                        else {
                            searchParams[$text.attr("data-propertyname")] = [v];
                        }

                    }
                }
            }
            // 选人
            var myUserPicker = $divSearch.find(".myuserpicker");
            for (var i = 0; i < myUserPicker.length; i++) {
                var $picker = $(myUserPicker[i]);
                var v = $picker.FormUser().GetUnitIDs();
                if (v && v.length > 0) {
                    searchParams[$picker.attr("data-propertyname")] = v;
                }
            }
            // 数字
            var myNum = $divSearch.find(".mynum");
            for (var i = 0; i < myNum.length; i++) {
                var $myNum = $(myNum[i]);
                var v = [];
                var num = $myNum.find(":text");
                for (var j = 0; j < num.length; j++) {
                    var $num = $(num[j]);
                    var val = $num.val();
                    if ($.isNumeric(val)) {
                        v.push(val);
                    } else {
                        v.push(null);
                    }
                }
                if (v.length > 0) {
                    searchParams[$myNum.attr("data-propertyname")] = v;
                }
            }
            //是/否
            var myCheckBox = $divSearch.find('.mycheckbox');
            for (var i = 0; i < myCheckBox.length; i++) {
                var $myCheckBox = $(myCheckBox[i]);
                var v = [];
                var val = $myCheckBox.find('input[type="checkbox"]:checked').val();
                v.push(val);
                searchParams[$myCheckBox.attr('data-propertyname')] = v;
            }
            // datetime
            var myDateTime = $divSearch.find(".mydatetime");
            for (var i = 0; i < myDateTime.length; i++) {
                var $myDateTime = $(myDateTime[i]);
                var v = [];
                var myDateTimePicker = $myDateTime.find(".mydatetimepicker");
                for (var j = 0; j < myDateTimePicker.length; j++) {
                    var $myDateTimePicker = $(myDateTimePicker[j]);
                    var val = $myDateTimePicker.val();
                    if ($.trim(val) !== "") {
                        v.push(val);
                    } else {
                        v.push(null);
                    }
                }
                if (v.length > 0) {
                    searchParams[$myDateTime.attr("data-propertyname")] = v;
                }
            }

            // FormQuery
            var myDropDown = $divSearch.find(".mydropdown");
            for (var i = 0; i < myDropDown.length; i++) {
                var $mydropdown = $(myDropDown[i]);
                var v = $mydropdown.FormQuery().GetValue();
                //多个关联表单中间用;隔开
                if (v && v.length > 0) {
                    var arr = [];
                    v = v.split(';');
                    for (var i = 0; i < v.length; i++) {
                        if (v[i] == undefined || v[i] == 'undefined') {
                            arr.push('');
                        } else if (v[i] != '') {
                            arr.push(v[i]);
                        }
                    }
                    searchParams[$mydropdown.attr("data-propertyname")] = arr;
                }
            }
            params["searchParamsJson"] = JSON.stringify(searchParams);
            return params;
        },

        _getQueryParams: function () {
            var queryParams = {
            };
            if (this.InputMappings) {
                for (var datafield in this.InputMappings) {
                    // 根据datafield，从页面上取值
                    var controlManager = this._getTargetElement(datafield).JControl();
                    if (controlManager) {
                        queryParams[this.InputMappings[datafield]] = controlManager.GetValue();
                    }
                }
            }
            return queryParams;
        },

        _getTargetElement: function (datafield) {
            var $targetElement;
            var dataFieldName = $.ControlManager.PreDataKey + $.ControlManager.DataFieldKey;
            // 子表字段，通过datafield在当前行中找
            if (datafield.indexOf(".") > -1) {
                $targetElement = this.$InputBody.closest("tr").find("[" + dataFieldName + "='" + datafield + "']")
            }
            else {
                $targetElement = $("[" + dataFieldName + "='" + datafield + "']");
            }
            return $targetElement;
        },

        _toDetailLink: function () {
            var that = this;
            var $link = "";
            if ($.trim(this.$Input.text()).length > 0) {
                $link = $("<a href='javascript:;' title='" + this.$Input.text() + "' class='label label-info' style='margin-bottom:-3px;'>" + this.$Input.text() + "<i class='fa fa-times' style='margin-left:5px' data-objectId='" + this.$Input.data("ObjectId") + "'></i></a>");

                var $btnClear = $($link).find('i').on('click', function (e) {
                    that.$Input.text("").data("ObjectId", "");
                    //that.$Input.data("ObjectId", "");
                    //这里要清除下拉框的数据
                    var thisObjectId = $(this).attr('data-objectid');
                    that.$dropDownItemContainer.find('input[type="checkbox"][data-itemid="' + thisObjectId + '"]').prop('checked', false);
                    that.OnChange.apply(that);
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    } else {
                        e.cancelBubble = true;
                    }
                });
            } else {
                $link = $("<a href='javascript:;' title='" + this.$Input.text() + "' class='label label-info' style='margin-bottom:-3px;'>" + this.$Input.text() + "</a>");
            }
            this.$Input.text("").append($link);
            if (!that.Editable) {//不可编辑
                $link.removeClass("label label-info").css({
                    "border": "none",
                    "white-space": "pre-wrap",
                    "white-space": "-moz-pre-wrap",
                    "white-space": "-pre-wrap",
                    "white-space": "-o-pre-wrap",
                    "word-wrap": "break-word",
                    "overflow": "auto",
                    "word-break": "break-all"
                }).find("i").remove();
                $link.off("click").on("click", function () {
                    var boId = that.GetValue();
                    if (boId) {
                        that.Ajax("/Sheet/GetBizObjectSchemaDisplayName", "GET", {
                            schemaCode: that.BOSchemaCode, flag: $.IGuid()
                        }, function (data) {
                            var url = "/Sheet/DefaultSheet/?ID=" + that.BOSchemaCode + "&BizObjectId=" + boId + "&Mode=View";
                            $.ISideModal.Show(url, data.DisplayName);
                        });
                    }
                });
            }
            else {
                //$link.off("click").on("click", function () {
                //    that.$modal.modal("show");
                //});
            }
        },

        RenderPage: function (data) {
            var that = this;
            var $target = $("#" + that["TargetId"]);
            if (!$target) return;
            if (that.pageNumber > 1 && data.ReturnData && data.ReturnData.length == 0) {
                $target.bootstrapTable("refreshOptions", {
                    pageNumber: that.pageNumber - 1
                });
            }
            if (!that.$PageNext) {
                var $pageBar = $("#bar-" + that["TargetId"]);
                that.$PageNext = $pageBar.find(".Page_Num_Next");
                that.$PagePre = $pageBar.find(".Page_Num_Pre");
                that.$PageIndex = $pageBar.find(".Page_Index");
                that.$PageCount = $pageBar.find(".Page_Count");
                that.$PageTotal = $pageBar.find(".page-total");
                that.$PageSize = $pageBar.find(".Page_Per_Size");
                that.$PageNext.bind('click', function () {
                    $target.bootstrapTable("nextPage");
                });
                that.$PagePre.bind('click', function () {
                    $target.bootstrapTable("prevPage");
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
                });
                $pageBar.on("click", "li>a", function () {
                    var size = parseInt($(this).text());
                    that.$PageSize.html(size);
                    $target.bootstrapTable("refreshOptions", {
                        pageSize: size
                    });

                })
            }
            if (!data.Successful) {
                that.$PageNext.addClass("disable").attr("disabled", true);
                that.$PagePre.addClass("disable").attr("disabled", true);
                that.$PageIndex.val(1).attr("disabled", true);
                that.$PageCount.html(1);
                that.$PageTotal.html("共0条");
            }
            else {
                that.$PageIndex.val(that.pageNumber);
                that.Count = Math.ceil(data.DataCount / that.pageSize);
                that.$PageCount.html(that.Count);
                that.$PageTotal.html("共" + data.DataCount + "条");
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
            }
        },

        //设置值
        InitValue: function () {
            var item = this.Value || this.DefaultValue;
            if (item != void 0) {
                //2017/2/21这里setvalue取消了异步。原因是如果异步的话有可能会覆盖掉mapping的控件的值，仍然存在的缺陷是如果先渲染mapping的控件再渲染formaquery还是会覆盖掉mapping控件的值
                this.SetValue(item, false);
            }
            //Error关联列表新增不会携带值
            //item只有objectId和Name 
        },

        //设置值
        SetValue: function (item, asy) {
            if (item == void 0 || item == null || item == "") {
                this.$Input.text("");
                this.$Input.data("ObjectId", "");
                return;
            }
            var that = this;
            if (item.constructor == String) {
                //#Error:如果不是从后台加载的，需要支持开发者SetValue(objectId)
                var name = "";
                if ($.SmartForm.ResponseContext && $.SmartForm.ResponseContext.AssociatedBoNames &&
                    $.SmartForm.ResponseContext.AssociatedBoNames[item]) {
                    name = $.SmartForm.ResponseContext.AssociatedBoNames[item].replace(/</g, "&lt;").replace(/>/g, "&gt;");
                }
                if ($.trim(name) == '') {
                    that.Ajax("/Sheet/GetFormatBizObject", "GET", {
                        schemaCode: that.BOSchemaCode, ObjectId: item
                    }, function (data) {
                        if (data.ListViewData != void 0 && data.ListViewData.length > 0) {
                            name = $.trim(data.ListViewData[0].Name);
                        }
                        if ($.trim(name) == '') {
                            name = '--';
                        }
                        that.$Input.text(name);
                        that.$Input.data("ObjectId", item);
                        that.OnChange({
                            ObjectId: item, Name: name
                        });
                        that._toDetailLink();
                    }, asy);
                } else {
                    //if ($.trim(name) == '') {
                    //    name = '--';
                    //}
                    that.$Input.text(name);
                    that.$Input.data("ObjectId", item);
                    that.OnChange({
                        ObjectId: item, Name: name
                    });
                    that._toDetailLink();
                }
            }
            else {
                if (item.Name == void 0) {
                    that.Ajax("/Sheet/GetFormatBizObject", "GET", {
                        schemaCode: that.BOSchemaCode, ObjectId: item.ObjectId
                    }, function (data) {
                        var itemData = null;
                        if (data.ListViewData != void 0 && data.ListViewData.length > 0) {
                            name = $.trim(data.ListViewData[0].Name);
                            itemData = data.ListViewData[0];
                            itemData['isQuery'] = true;
                        }
                        if ($.trim(name) == '') {
                            name = '--';
                        }
                        that.$Input.text(name);
                        that.$Input.data("ObjectId", item.ObjectId);
                        //that.OnChange({ ObjectId: item.ObjectId, Name: name });
                        if (itemData != null) {
                            that.OnChange(itemData);
                        } else {
                            that.OnChange({
                                ObjectId: item.ObjectId, Name: name
                            });
                        }
                        that._toDetailLink();
                    }, asy);
                } else {
                    that.$Input.data("ObjectId", item.ObjectId).text(item.Name);
                    if (that.BOSchemaCode && $.IQuery(this.BOSchemaCode + "_Name"))
                        that.OnChange();
                    else
                        that.OnChange(item);
                    that._toDetailLink();
                }
            }
        },

        //校验
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && $.isEmptyObject(val)) {
                if (this.SchemaCode != this.BOSchemaCode) {
                    this.AddInvalidText(this.$InputBody, "必填");
                    return false;
                } else {
                    //如果关联的是自己,且关联的数据是空的，则不要校验必填
                    if (this.LoadData != undefined && this.LoadData.length > 0) {
                        this.AddInvalidText(this.$InputBody, "必填");
                        return false;
                    }
                    //如果初始没有数据（this.LoadData.length==0）,在关联表单界面新增了也要校验
                    if (this.$Input.find('a').length == 0) {
                        this.AddInvalidText(this.$InputBody, "必填");
                        return false;
                    }
                }
            }
            this.RemoveInvalidText(this.$InputBody);
            return true;
        },

        SaveDataField: function () {
            var result = {
            };
            if (!this.ResponseContext.IsCreateMode && (!this.Visible)) return result;
            var oldresult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldresult) {
                return {
                };
            }
            if (oldresult.Value != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }
            return {
            };
        },

        GetValue: function () {
            if (!this.Visible) {
                if (this.Value == null) {
                    return "";
                }
                return this.Value;
            }
            return this.$Input.data("ObjectId");
        },

        GetText: function () {
            if (this.$Input) {
                return this.$Input.text();
            } else {
                return ""
            };
        },

        SetReadonly: function (flag) {
            if (flag) {
                this.$Input.prop("disabled", "disabled");
            }
            else {
                this.$Input.removeProp("disabled");
            }
        },

        Change: function (rowData) {
            if (this.MappingControls && !$.isEmptyObject(this.MappingControls)) {
                //关于关联配置数据携带，关联查询“新增”的时候不能将新增的数据携带出来。原因是返回的rowData中没有新增的数据。
                //修改后每次都要请求数据
                /*if (rowData && rowData.length > 0) {
                    if ($.isArray(rowData) || rowData.length > 0) {
                        rowData = rowData[0];
                    }
                    this.SetMappingValue(rowData);
                }
                else {*/
                var that = this;
                if (rowData[0] != void 0 && rowData[0].isQuery != void 0) {
                    that.SetMappingValue(rowData[0]);
                } else {
                    var ObjectId = this.GetValue();
                    if (ObjectId) {
                        this.Ajax("/Sheet/GetFormatBizObject", "GET", {
                            schemaCode: this.BOSchemaCode, ObjectId: ObjectId
                        }, function (data) {
                            if (data.ListViewData && data.ListViewData.length > 0) {
                                that.SetMappingValue(data.ListViewData[0]);
                            }
                        });
                    }
                }
                /* }*/
            }
            this.Required && (this.$Input.text() != "" && this.$Input.css({
                "border": "1px solid #ddd", "box-shadow": "none"
            }));
        },

        SetMappingValue: function (rowData) {
            var trId = this.$InputBody.closest("tr").attr("data-ObjectId");
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
            var mappingCtrl_schema = {
            };//主表关联配置
            var mappingCtrl_childSchema = {
            };//子表关联配置
            var targetChildSchema = {
            };//关联配置中涉及的子表


            for (var targetProperty in this.MappingControls) {
                if (!(targetProperty.indexOf('.') > -1 && this.MappingControls[targetProperty].indexOf('.') > -1)) {
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
            var MappingCtrls = {
            };
            if (flag) {
                MappingCtrls = mappingCtrl_schema;
            } else {
                MappingCtrls = this.MappingControls;
            }
            //if (!flag) {
            for (var targetProperty in MappingCtrls) {
                // 子表中的关联查询字段不能映射表单中非子表里的字段
                //if (this.DataField.toString().indexOf(".") > -1 && targetProperty.indexOf(".") < 0) {
                //    continue;
                //}

                var sourceProperty = MappingCtrls[targetProperty];
                var propertyName = sourceProperty;
                var potIndex = sourceProperty.indexOf('.');
                if (potIndex > 0) {
                    propertyName = sourceProperty.slice(potIndex + 1);
                }
                var propertyValue = rowData[propertyName] /*|| rowData[sourceProperty]*/;
                var controlManager = null;
                if (targetProperty.indexOf(".") > -1) {
                    // 子表中找同行
                    var $controls = $("[data-datafield='" + targetProperty + "']:not(.table_th)");
                    for (var ci = 0, clen = $controls.length; ci < clen; ci++) {
                        var $control = $($controls[ci]);
                        if (($control.closest("tr").attr("data-ObjectId") == trId && trId != void 0) || (trId == void 0 && $control.closest("tr").attr("data-ObjectId") != void 0)) {
                            controlManager = $control.JControl();
                            break;
                        }
                    }
                }
                else {
                    controlManager = $("[data-datafield='" + targetProperty + "']").JControl();
                }
                if (controlManager) {
                    if (controlManager.Type == 50) { // 关联查询
                        var that = this;
                        var rowSchemaCode = rowData[sourceProperty + "_SchemaCode"];
                        if (rowSchemaCode == undefined && sourceProperty.indexOf(".") > -1) {
                            var propertyName = sourceProperty.split('.');
                            propertyName = propertyName[propertyName.length - 1];
                            rowSchemaCode = rowData[propertyName + "_SchemaCode"];
                        }
                        if (rowSchemaCode == undefined && sourceProperty == targetProperty) {
                            rowSchemaCode = rowData[targetProperty + "_SchemaCode"];
                            if (rowSchemaCode == undefined&&target) {

                            }
                        }
                        if (controlManager.BOSchemaCode == rowSchemaCode) {
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
                                controlManager.SetValue({
                                    ObjectId: rowData[sourceProperty + "_Id"], Name: propertyValue
                                });
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
                            that.Ajax("/Sheet/GetMappingFiles", "GET", {
                                schemaCode: that.BOSchemaCode,
                                bizObjectId: objectId,
                                propertyName: sourceProperty
                            }, function (data) {
                                // 清空控件上的附件
                                ctrlMgr.ClearFiles();
                                if (data && data.length > 0) {
                                    for (var i = 0, len = data.length; i < len; i++) {
                                        var result = data[i];
                                        var url = '/Sheet/Download/?AttachmentID=' + result.AttachmentId;
                                        ctrlMgr.AppendFile(result.FileId, result.AttachmentId, result.FileName, result.Size, result.Thumb, result.Description, url);
                                    }
                                }
                            });
                        })(controlManager);
                    }
                    else {
                        if (controlManager.Type == 1) {
                            propertyValue = propertyValue == "是" ? true : false;
                        }
                        //多选人控件时，先清空再赋值
                        if (controlManager.Type == 27) {
                            controlManager.ClearValue();
                        }
                        controlManager.SetValue(propertyValue);
                        if (controlManager.Type == 27) {
                            //多人选人控件，只执行最后一次onchange事件
                            controlManager.FormMultiUserChange();
                        } else {
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
                this.Ajax("/Sheet/GetChildSchemaDataByObjectId", "POST", {
                    targetChild: targetChild,
                    schemaCode: this.BOSchemaCode,
                    bizObjectId: rowData.ObjectId,
                    propertyName: targetChildSchema[targetChild]
                }, function (data) {
                    if (data.Result.ListViewData && data.Result.ListViewData.length > 0) {
                        var gridView = $("[data-datafield='" + data.Result.TargetChild + "']").FormGridView();
                        gridView.ClearRows();
                        var listViewData = data.Result.ListViewData;
                        for (var i = 0; i < listViewData.length; i++) {
                            var newRowData = {
                            };
                            newRowData["ObjectId"] = $.IGuid();
                            for (var targetProperty in mappingCtrl_childSchema) {
                                var fieldValue = listViewData[i][mappingCtrl_childSchema[targetProperty]];
                                if (fieldValue == void 0) continue;
                                newRowData[targetProperty] = fieldValue;
                            }
                            gridView.AddRow($.IGuid(), newRowData);
                        }
                    }
                    var gridView = $("[data-datafield='" + data.Result.TargetChild + "']").FormGridView();
                    gridView.Resize();
                });
                //}
            }
        }
    });
})(jQuery);