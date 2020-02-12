(function ($) {
    // 所有的控件，都可以通过这个接口选择
    $.fn.JControl = function () {
        var jControl;
        var args = arguments;
        $(this).each(function () {
            var $control = $(this);
            //数据项
            var datafield = $control.data($.ControlManager.DataFieldKey.toLocaleLowerCase());
            var controlkey = $control.data($.ControlManager.SheetControlKey.toLocaleLowerCase());
            if (!controlkey) {
                return jControl;
            }
            var dataitem = $.Controls.GetSheetDataItem(datafield, $control);

            if (args.length > 0) {
                dataitem = $.extend(dataitem, args[0]);
            }
            jControl = $.ControlManager.Run.call($control, controlkey, [dataitem]);
        });
        return jControl;
    };

    $.Controls = {};
    //控件属性
    $.Controls.GetDefaultOptions = function (controlKey) {
        var p = {};
        var options = FormControls[controlKey];
        if (options != null) {
            for (var key in options) {
                if (options[key].constructor == String
                    || options[key].constructor == Number
                    || options[key].constructor == Object) {
                    p[key] = options[key] || "";
                }
                else if (options[key].constructor == Array) {
                    for (var i = 0; i < options[key].length; ++i) {
                        p[options[key][i].Name] = options[key][i].DefaultValue || "";
                    }
                }
            }
        }
        return p;
    };

    // 读取表单数据
    $.Controls.GetSheetDataItem = function (datafield, $control) {
        if ($.SmartForm.ResponseContext == null) return null;
        if (datafield == "Comments") {
            //审批控件
            return $.IClone($.SmartForm.ResponseContext.Comments);
        }
        var DataItems = $.SmartForm.ResponseContext.ReturnData;
        if (datafield == void 0) return null;
        var dataitem = DataItems[datafield];

        if (dataitem == null && (datafield + "").indexOf(".") > -1) {
            var pDataField = datafield.split(".")[0];
            var pDataItem = DataItems[pDataField];
            var $trRow = $control.parent();
            var ObjectId = $trRow.attr("data-ObjectId");
            //从已存到数据库地方取数据
            if (ObjectId) {
                if (pDataItem != void 0 && pDataItem != null) {
                    var rows = pDataItem.Value.R;
                    for (var i = 0; i < rows.length; i++) {
                        var rowData = rows[i];
                        if (rowData[pDataField + ".ObjectId"].Value == ObjectId) {
                            dataitem = rowData[datafield];
                            break;
                        }
                    }
                }

            }
            else {
                ObjectId = $.IGuid();
                $trRow.attr("data-ObjectId", ObjectId);
            }

            if (dataitem == null && pDataItem) {
                dataitem = pDataItem.Value.T[datafield];
            }

            if (dataitem) {
                // 为区别子表里不同行的同一字段
                dataitem["ObjectId"] = ObjectId;
            }
        }

        return $.IClone(dataitem);
    };

})(jQuery);

(function ($) {
    //控件基类
    //1,完成界面初始化:设置组件id并存入组件管理器池,初始化参数
    //2,渲染的工作,细节交给子类实现
    //parm [element] 组件对应的dom element对象
    //parm [options] 组件的参数
    $.Controls.BaseControl = function (element, options, ResponseContext) {
        // 表单信息
        this.ResponseContext = ResponseContext;
        //是否支持Html5
        this.IsSupportHtml5 = window.applicationCache != undefined;
        this.SchemaCode = ResponseContext == null ? "" : ResponseContext.SchemaCode;
        this.IsMobile = true;
        //页面元素，可以通过$(this.Element)得到jquery对象
        this.Element = element;

        //是否发起模式
        this.Originate = $.IQuery("Mode").toLowerCase() == "originate";

        // 记录当前控件是否验证通过
        this.ValidateResult = true;
        //配置参数,包含属性和事件
        this.Options = options || {};

        //样式列表
        this.Css = {
            ControlTitle: "ControlTitle",
            ControlContent: "ControlContent"
        };

        this.ChangeEvents = {};

        //var key = $(this.Element).attr("data-controlkey");

        //var date = new Date();

        //初始化参数
        this.Init();

        // 是否可见
        if (this.Visible == null) {
            this.Visible = true;
        }

        // 是否可编辑
        if (this.Editable == null) {
            this.Editable = true;
        }
        //渲染控件前函数
        this.PreRender();
        //渲染控件
        this.Render();
        //渲染后函数
        //this.Rendered();
        //隐藏规则
        this.InitHideRule();
        //计算规则
        this.InitComputationRule();

        //console.log(key, "-end：", new Date() - date);
    };

    //基础属性
    $.Controls.BaseControl.prototype = {
        // 从页面读取参数,将页面上 data-***的设置读取到Options里面
        // 初始化参数，转为容易用的方式this.***
        // 循环所有默认属性事件,构造成 this.***的格式
        Init: function () {
            var g = this, p = this.Options;
            for (var key in p) {
                var elementkey = key.toLowerCase();

                if ($(g.Element).data(elementkey) != void 0) {
                    if (p[key] == null) {
                        p[key] = $(g.Element).data(elementkey);
                    }
                    else if (p[key].constructor == Boolean) {
                        p[key] = $(g.Element).data(elementkey).constructor == Boolean ?
                           $(g.Element).data(elementkey) :
                            ($(g.Element).data(elementkey).toString().toLowerCase() == "true"
                            || $(g.Element).data(elementkey).toString().toLowerCase() == "1");
                    }
                    else if (p[key].constructor == Number) {
                        p[key] = parseInt($(g.Element).data(elementkey));
                    }
                    else if (key.toLocaleLowerCase() != "displayname" || p[key] == "" || p[key] == "CreatedBy.FullName") {
                        p[key] = $(g.Element).data(elementkey);
                    }
                }
            }

            for (var key in this.Options) {
                this[key] = this.Options[key];
            }
        },

        // 控件渲染前函数
        PreRender: function () {
            var controlkey = $(this.Element).attr('data-controlkey');

            if (controlkey == "FormGridView") {
                $(this.Element).removeClass("row  form-group").addClass("list childitems");
                this.$Title = $("<div class='childitemtilte'><span>" + this.DisplayName + "(共" + this.Value.R.length + "条明细)</span></div>");

            } else if (controlkey == "FormUser" || controlkey == "FormCheckboxList") {
                $(this.Element).removeClass("row  form-group").addClass("item item-input");
                //根据是否可以编辑,此处添加点击事件
                if (this.Editable) {
                    var that = this;
                    $(this.Element).unbind('click').bind('click', function () {
                        var path = "";
                        var datafield = $(this).attr('data-datafield');
                        switch (controlkey) {
                            case "FormUser":
                            case "FormMultiUser":
                                H3Config.GlobalState.go('app.sheetuser', { field: datafield, rowid: that.ObjectId, unitSelectionRange: that.UnitSelectionRange, showunactive: that.ShowUnActive });
                                break;
                            case "FormCheckboxList":
                                if (that.isCheckbox == "false" || that.isCheckbox == false) {
                                    H3Config.GlobalState.go('app.checkboxlist', { field: datafield, rowid: that.ObjectId });
                                }
                                break;
                        }
                    });
                } else {
                    $(this.Element).unbind('click');
                }

                this.$Title = $("<span class='has-input " + this.Css.ControlTitle + "'>" + this.DisplayName + "</span>");//.addClass("has-input").addClass(this.Css.ControlTitle);

                $(this.Element).append(this.$Title);

            } else if (controlkey == "FormDropDownList" || controlkey == "FormRadioButtonList") {
                $(this.Element).removeClass("row  form-group").addClass("item item-input item-select");
                this.$Title = $("<span class='has-input " + this.Css.ControlTitle + "'>" + this.DisplayName + "</span>");//.addClass("has-input").addClass(this.Css.ControlTitle);

            }
            else if (controlkey == "FormAttachment" || controlkey == "FormQuery") {
                $(this.Element).removeClass("row  form-group").addClass("item item-input item-floating-label");
                this.$Title = $("<span class='has-input " + this.Css.ControlTitle + "'>" + this.DisplayName + "</span>");//.addClass("input-label").addClass("has-input").addClass(this.Css.ControlTitle);

                $(this.Element).append(this.$Title);

            } else if (controlkey == "FormButton") {
                $(this.Element).removeClass("row  form-group");
            } else if (controlkey == "FormComment") {

            }
            else {
                if (controlkey == "FormNumber") {
                    $(this.Element).empty();
                }
                $(this.Element).removeClass("row  form-group").addClass("item item-input");
                this.$Title = $("<span class='input-label has-input " + this.Css.ControlTitle + "'>" + (this.DisplayName || "") + "</span>");//.addClass("input-label").addClass("has-input").addClass(this.Css.ControlTitle);

                $(this.Element).append(this.$Title);

            }

            var controlkey = $(this.Element).attr("data-controlkey");
            //if (controlkey != "SheetButton") {
            if (this.IsMobile) {
                if (controlkey == "FormUser") {
                    this.$InputBody = $("<div class='ControlContent'>");//.addClass("ControlContent");
                }
                else if (controlkey == "FormQuery") {
                    this.$InputBody = $("<div class='ControlContent'>");//.addClass("ControlContent");
                } else if (controlkey == "FormComment") {
                    this.$InputBody = $("<div style='width:100%;text-align:left'>");//.css("width", "100%").css({ "text-align": "left" });
                }
                else if (controlkey == "FormAttachment" || controlkey == "FormButton" || controlkey == "FormSns" || controlkey == "FormTaskTips") {
                    this.$InputBody = $("<div style='width:100%'>");//.css("width", "100%");
                }
                else if (controlkey == "FormDropDownList" || controlkey == "FormRadioButtonList") {
                    this.$InputBody = $('<select class="ControlContent"></select>');
                    if (!this.Editable) {
                        this.$InputBody = $("<div class='ControlContent'></div>");

                        //this.$InputBody.css({ "background-color": "#f8f8f8" });
                    } else {
                        this.$InputBody = $('<select class="ControlContent"></select>');
                    }
                } else if (controlkey == "FormCheckboxList") {
                    this.$InputBody = $("<div class='ControlContent'>");//.addClass("ControlContent");

                    if (this.isCheckbox && !this.Editable) {
                        //this.$InputBody.css({ "background-color": "#f8f8f8" });
                    }
                }
                else {
                    this.$InputBody = $("<div class='ControlContent'>");//.addClass("ControlContent");
                }
            }

            //添加样式    
            if (($.isEmptyObject(this.Options.DataField)
                    || this.Options.DataField.indexOf('.') == -1
            || this.Options.DataField == "CreatedBy.FullName")
                && (this.DisplayName || this.DataField)) {
                if (controlkey != "FormButton") {
                    $(this.Element).append(this.$Title);
                    if (controlkey == "FormCheckBoxList" && !this.isCheckbox) {
                        this.$display = $("<sapn class='display'></span>");
                        $(this.Element).append(this.$display);
                    }
                }

                //this.$InputBody.addClass(inputCss);
            } else {
                $(this.Element).append(this.$Title);
            }

            $(this.Element).append(this.$InputBody);
        },

        // 控件渲染
        Render: function () { },
        //计算规则
        InitComputationRule: function () {
            //try {
            if (this.DataItem == null || this.DataItem.ComputationRule == null) { return; }
            var computationRule = this.DataItem.ComputationRule;//计算规则
            var computationRuleFields = this.DataItem.ComputationRuleFields;//计算规则使用的字段
            //原来是如果规则没有控件字段则直接执行，修改后只有新建表单时候执行
            if (this.ResponseContext.IsCreateMode) {
                this.SetComputationResult(computationRule, computationRuleFields);
            }
            var that = this;
            var eventName = "change.cr." + this.DataField;
            for (var fi = 0, flen = computationRuleFields.length; fi < flen; fi++) {
                var field = computationRuleFields[fi];
                if (field == 'CreatedBy') {
                    field += '.FullName';
                }
                if (field.indexOf(".") > -1) {//规则中字段在子表中
                    if (this.DataField.indexOf(".") > -1) {//配置规则的字段在子表
                        eventName = "change.cr." + this.ObjectId + "." + this.DataField;
                        //判断是否跨子表
                        var childSchemaName1 = this.DataField.slice(0, this.DataField.indexOf("."));
                        var childSchemaName2 = field.slice(0, field.indexOf("."));
                        if (childSchemaName1 == childSchemaName2) {//同一个子表
                            var $ctrl = $(this.Element).closest(".list").find("[data-controlkey][data-datafield='" + field + "']");
                            if ($ctrl && $ctrl.length > 0) {
                                var controlMgr = $ctrl.JControl();
                                controlMgr.BindChange(eventName, function () {
                                    that.SetComputationResult(computationRule, computationRuleFields);
                                });
                                if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                    controlMgr.ChangeEvents[eventName].apply(this);
                                }
                            }
                        } else {//跨字表
                            var $ctrl = $("[data-controlkey][data-datafield='" + field + "']").not(".table_th");
                            for (var i = 0; i < $ctrl.length; i++) {
                                var controlMgr = $ctrl.JControl();
                                controlMgr.BindChange(eventName, function () {
                                    that.SetComputationResult(computationRule, computationRuleFields);
                                });
                                if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                    // 被绑定的值，已经有可能已经渲染
                                    controlMgr.ChangeEvents[eventName].apply(this);
                                }
                            }
                            eventName = "change.cr." + field.slice(0, field.indexOf("."))+this.DataField.slice(this.DataField.indexOf("."));
                            var gridMgr = $("[data-datafield='" + field.slice(0, field.indexOf(".")) + "']").JControl();
                            if (gridMgr) {
                                //gridMgr.UnbindChange(eventName);
                                if (gridMgr.ChangeEvents[eventName] == undefined) {
                                    gridMgr.BindChange(eventName, function (args) {
                                        if (window[eventName]) {
                                            window.clearTimeout(window[eventName]);
                                            window[eventName] = null;
                                        }
                                        window[eventName] = setTimeout(function () {
                                            var targetCtrls = $("[data-controlkey][data-datafield='" + that.DataField + "']").not(".table_th");
                                            for (var i = 0; i < targetCtrls.length; i++) {
                                                $(targetCtrls[i]).JControl().SetComputationResult(computationRule, computationRuleFields);
                                            }
                                            //that.SetComputationResult(computationRule, computationRuleFields);
                                        }, 600);
                                    });
                                }
                            }
                        }
                    } else {//配置规则的字段在主表
                        eventName = "change.cr." + this.DataField;
                        var gridMgr = $("[data-datafield='" + field.slice(0, field.indexOf(".")) + "']").JControl();//子表
                        var tdCtrl = $("[data-controlkey][data-datafield='" + field + "']:not('.table_th')");
                        for (var i = 0; i < tdCtrl.length; i++) {
                            var controlMgr = $(tdCtrl[i]).JControl();
                            if (controlMgr) {
                                controlMgr.UnbindChange(eventName);
                                controlMgr.BindChange(eventName, function () {
                                    that.SetComputationResult(computationRule, computationRuleFields);
                                });
                                if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                    controlMgr.ChangeEvents[eventName].apply($(tdCtrl[i]));
                                }
                            }
                        }
                        //给子表绑定事件
                        if (gridMgr) {
                            gridMgr.UnbindChange(eventName);
                            gridMgr.BindChange(eventName, function (args) {
                                if (window[eventName]) {
                                    window.clearTimeout(window[eventName]);
                                    window[eventName] = null;
                                }
                                window[eventName] = setTimeout(function () {
                                    that.SetComputationResult(computationRule, computationRuleFields);
                                }, 600);
                            });
                            if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                gridMgr.ChangeEvents[eventName].apply(this);
                            }
                        }
                    }
                } else {//规则中字段在主表
                    eventName = "change.cr." + this.DataField;
                    var changeControl = $("[data-datafield='" + field + "']").JControl();
                    if (!changeControl) {
                        continue;
                    }
                    changeControl.BindChange(eventName, function () {
                        var targetCtrls = $("[data-controlkey][data-datafield='" + that.DataField + "']:not('.table_th')");
                        for (var i = 0; i < targetCtrls.length; i++) {
                            var targetCtrl = $(targetCtrls[i]).JControl();
                            if (targetCtrl != null) {
                                var ruleResult = targetCtrl.GetComputationResult(computationRule, computationRuleFields);
                                var fun = new Function('return ' + ruleResult)();
                                targetCtrl.SetValue(fun);
                            }
                        }
                    });
                    if (that.ResponseContext.IsCreateMode || that.Value == null) {
                        changeControl.ChangeEvents[eventName].apply(this);
                    }
                }
            }
        },
        SetComputationResult: function (computationRule, computationRuleFields) {
            //设置计算规则时候先判断控件是否是隐藏的，如果控件是隐藏的则不执行计算规则
            try {
                var computationResult = this.GetComputationResult(computationRule, computationRuleFields);
                var fun = new Function('return ' + computationResult)();
                this.SetValue(fun);
            } catch (ex) {
            }
        },
        GetComputationResult: function (rule, fields) {
            var ruleTemp = rule;
            for (var j = 0, len = fields.length; j < len; j++) {
                //需要考虑字段是子表情况
                var ctrlField = fields[j];
                var val = [];
                if (ctrlField.indexOf('.') > -1) {
                    if (this.DataField.indexOf(".") == -1) {
                        //配置规则的字段在主表，规则中的字段在子表
                        var ctrls = $('[data-controlkey][data-datafield="' + ctrlField + '"]:not(".table_th")');
                        var ctrlKey = ctrls.attr('data-controlkey');
                        for (var subFieldIndex = 0; subFieldIndex < ctrls.length; subFieldIndex++) {
                            var ctrl = $(ctrls[subFieldIndex]).JControl();
                            if (ctrlKey == 'FormNumber') {
                                val.push(ctrl.GetNum());
                            } else if (ctrlKey == 'FormTextBox' || ctrlKey == 'FormTextArea') {
                                val.push('"' + ctrl.GetValue() + '"');
                            } else {
                                var ctrlVal = ctrl.GetValue();
                                if ($.isNumeric(ctrlVal)) {
                                    val.push(ctrlVal);
                                } else {
                                    val.push('"' + ctrlVal + '"');
                                }
                            }
                        }
                    } else {
                        //配置规则的字段在子表，规则中的字段在子表
                        //要判断是否跨子表
                        var childSchemaName1 = this.DataField.slice(0, this.DataField.indexOf("."));//当前子表
                        var childSchemaName2 = ctrlField.slice(0, ctrlField.indexOf("."));//规则字段子表
                        if (childSchemaName1 == childSchemaName2) {
                            //同一个子表
                            var ctrl = $(this.Element).closest(".list").find("[data-controlkey][data-datafield='" + ctrlField + "']");
                            if (ctrl.length == 0) {
                                continue;
                            }
                            var ctrlKey = ctrl.attr("data-controlkey");
                            var ctrl = ctrl.JControl();
                            if (ctrlKey == "FormNumber") {
                                val.push(ctrl.GetNum());
                            } else if (ctrlKey == "FormTextBox" || ctrlKey == "FormTextArea") {
                                val.push('"' + ctrl.GetValue() + '"');
                            } else {
                                var ctrlVal = ctrl.GetValue();
                                if ($.isNumeric(ctrlVal)) {
                                    val.push(ctrlVal);
                                } else {
                                    val.push('"' + ctrlVal + '"');
                                }
                            }
                        } else {
                            //跨子表
                            var ctrls = $("[data-controlkey][data-datafield='" + ctrlField + "']").not(".table_th");
                            for (var i = 0; i < ctrls.length; i++) {
                                var ctrlKey = $(ctrls[i]).attr("data-controlkey");
                                var ctrl = $(ctrls[i]).JControl();
                                if (ctrlKey == "FormNumber") {
                                    val.push(ctrl.GetNum());
                                } else if (ctrlKey == "FormTextBox" || ctrlKey == "FormTextArea") {
                                    val.push('"' + ctrl.GetValue() + '"');
                                } else {
                                    var ctrlVal = ctrl.GetValue();
                                    if ($.isNumeric(ctrlVal)) {
                                        val.push(ctrlVal);
                                    } else {
                                        val.push('"' + ctrlVal + '"');
                                    }
                                }
                            }
                        }
                    }
                } else {
                    //非子表字段
                    var ctrl = $('[data-datafield="' + ctrlField + '"]');
                    var ctrlKey = ctrl.attr('data-controlkey');

                    if (ctrlKey == 'FormNumber') {
                        val.push(ctrl.JControl().GetNum());
                    } else if (ctrlKey == 'FormTextBox' || ctrlKey == 'FormTextArea') {
                        val.push('"' + ctrl.JControl().GetValue() + '"');
                    } else if (ctrlKey == void 0) {
                        if (ctrlField == 'CreatedBy') {
                            val.push('"' + $.SmartForm.ResponseContext.Originator + '"');
                        } else if (ctrlField == 'CreatedTime') {
                            val.push('"' + $.SmartForm.ResponseContext.ReturnData.CreatedTime.Value + '"');
                        }
                    } else if (ctrlKey == 'FormLabel') {
                        if (ctrlField == 'CreatedTime')
                            val.push('"' + $.SmartForm.ResponseContext.ReturnData.CreatedTime.Value + '"');
                    } else if (ctrlKey == 'OwnerId') {
                        val.push('"' + $.SmartForm.ResponseContext.ReturnData.OwnerId.Value[0].UnitId + '"');
                    } else if (ctrlKey == 'FormAreaSelect') {
                        val.push("'" + ctrl.JControl().GetValue() + "'");
                    } else {
                        //其他类型控件，取值后判断是否是输入，不是数字则转成字符串
                        for (var subFieldIndex = 0, subFieldLen = ctrl.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var ctrlVal = $(ctrl[subFieldIndex]).JControl().GetValue();
                            if ($.isNumeric(ctrlVal)) {
                                val.push(ctrlVal);
                            } else {
                                val.push('"' + ctrlVal + '"');
                            }
                        }
                    }
                }
                var replaceField = '{' + ctrlField + '}';
                var reg = new RegExp(replaceField, 'g');
                ruleTemp = ruleTemp.replace(reg, val);
            }
            return ruleTemp;
        },
        // 计算隐藏规则表达式结果
        GetHideRuleResult: function (rule, fields) {
            //如果字段权限设置了不可见，则隐藏规则不生效
            if (this.Visible == false) {
                return true;
            }
            if (rule == null) {
                return false;
            }
            var ruleTemp = rule;
            for (var j = 0, len = fields.length; j < len; j++) {
                //需要考虑字段是子表情况
                var ctrlField = fields[j];
                var val = [];
                if (ctrlField.indexOf('.') > -1) {
                    //子表字段
                    var ctrls = [];
                    if (this.DataField.indexOf('.') > -1) {
                        //当前字段也是子表字段
                        //ctrls = $(this.Element.closest('tr')).find('[data-datafield="' + ctrlField + '"]');
                        ctrls = $($(this.Element).closest('.list')).find('[data-datafield="' + ctrlField + '"]');
                    } else {
                        ctrls = $('[data-controlkey][data-datafield="' + ctrlField + '"]:not(".table_th")');
                    }
                    var ctrlKey = ctrls.attr('data-controlkey');
                    if (ctrlKey == 'FormNumber') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            val.push($(ctrls[subFieldIndex]).JControl().GetNum());
                        }
                    } else if (ctrlKey == 'FormTextBox' || ctrlKey == 'FormTextArea') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {

                            var v = $(ctrls[subFieldIndex]).JControl().GetValue();
                            if (v == "") {
                                val.push("''");
                            } else {
                                val.push("'" + v + "'");
                            }
                        }
                    } else if (ctrlKey == 'FormUser' || ctrlKey == 'FormMultiUser') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var units = $(ctrls[subFieldIndex]).JControl().GetUnitIDs();
                            if (units != null && units != void 0 && units != '') {
                                for (var i = 0; i < units.length; i++) {
                                    val.push('"' + units[i] + '"')
                                }
                            } else {
                                val.push('""');
                            }
                        }
                    } else if (ctrlKey == 'FormAreaSelect') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var area = $(ctrls[subFieldIndex]).JControl().GetValue();
                            if (area == '') {
                                val.push('""');
                            } else {
                                val.push("'" + area + "'");
                            }
                        }
                    } else if (ctrlKey == 'FormAttachment') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var attach = $(ctrls[subFieldIndex]).JControl().GetValue();
                            if (attach.AttachmentIds == '') {
                                val.push('');
                            } else {
                                val.push('"' + attach.AttachmentIds + '"');
                            }
                        }
                    } else if (ctrlKey == 'FormCheckbox') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var c = $(ctrls[subFieldIndex]).JControl().GetValue();
                            val.push(c);
                        }
                    } else if (ctrlKey == 'FormDropDownList') {
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var dropDown = $(ctrls[subFieldIndex]).JControl().GetValue();
                            if (dropDown == null) {
                                val.push('""');
                            } else {
                                val.push('"' + dropDown + '"');
                            }
                        }
                    } else {
                        //其他类型控件，取值后判断是否是输入，不是数字则转成字符串
                        for (var subFieldIndex = 0, subFieldLen = ctrls.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                            var ctrlVal = $(ctrls[subFieldIndex]).JControl().GetValue();
                            if ($.isNumeric(ctrlVal)) {
                                val.push(ctrlVal);
                            } else {
                                if (ctrlVal == null || ctrlVal == void 0 || ctrlVal == '') {
                                    val.push('""');
                                } else {
                                    val.push('"' + ctrlVal + '"');
                                }
                            }
                        }
                    }
                } else {
                    //非子表字段
                    var ctrl = $('[data-datafield="' + ctrlField + '"]');
                    var ctrlKey = ctrl.attr('data-controlkey');

                    if (ctrlKey == 'FormNumber') {
                        val.push(ctrl.JControl().GetNum());
                    } else if (ctrlKey == 'FormTextBox' || ctrlKey == 'FormTextArea') {
                        var v = ctrl.JControl().GetValue();
                        if (v != '') {
                            val.push('"' + v + '"');
                        } else {
                            val.push("''");
                        }
                    } else if (ctrlKey == 'FormUser' || ctrlKey == 'FormMultiUser') {
                        var units = ctrl.JControl().GetUnitIDs();
                        if (units != null && units != void 0 && units != "") {
                            for (var i = 0; i < units.length; i++) {
                                val.push('"' + units[i] + '"');
                            }
                        }
                        if (val.length == 0) {
                            val.push('""');
                        }
                    } else if (ctrlKey == 'FormAreaSelect') {
                        var area = ctrl.JControl().GetValue();
                        if (area == '') {
                            val.push('""');
                        } else {
                            val.push("'" + area + "'");
                        }
                    } else if (ctrlKey == 'FormAttachment') {
                        var attach = ctrl.JControl().GetValue();
                        if (attach.AttachmentIds == '') {
                            val.push('');
                        } else {
                            val.push('"' + attach.AttachmentIds + '"');
                        }
                    } else if (ctrlKey == 'FormCheckbox') {
                        var c = ctrl.JControl().GetValue();
                        val.push(c);
                    } else if (ctrlKey == 'FormDropDownList') {
                        var dropDown = ctrl.JControl().GetValue();
                        if (dropDown == null) {
                            val.push('""');
                        } else {
                            val.push('"' + dropDown + '"');
                        }
                    } else if (ctrlKey == 'FormLabel') {
                        if (ctrlField == 'CreatedTime') {
                            val.push('"' + $.SmartForm.ResponseContext.ReturnData.CreatedTime.Value + '"');
                        }
                    } else {
                        //createdby
                        if (ctrlKey == void 0) {
                            if (ctrlField == 'CreatedBy')
                                val.push('"' + $.SmartForm.ResponseContext.Originator + '"');
                            else if (ctrlField == 'OwnerId') {
                                val.push('"' + $.SmartForm.ResponseContext.ReturnData.OwnerId.Value[0].UnitId + '"');
                            } else if (ctrlField == 'OwnerDeptId') {
                                val.push('"' + $.SmartForm.ResponseContext.ReturnData.OwnerDeptId.Value[0].UnitId + '"');
                            }
                        } else {
                            //其他类型控件，取值后判断是否是数字，不是数字则转成字符串
                            for (var subFieldIndex = 0, subFieldLen = ctrl.length; subFieldIndex < subFieldLen; subFieldIndex++) {
                                var ctrlVal = $(ctrl[subFieldIndex]).JControl().GetValue();
                                if ($.isNumeric(ctrlVal)) {
                                    val.push(ctrlVal);
                                } else {
                                    if (ctrlVal == null || ctrlVal == void 0 || ctrlVal == '')
                                        val.push('""');
                                    else
                                        val.push('"' + ctrlVal + '"');
                                }
                            }
                        }
                    }
                }
                var replaceField = '{' + ctrlField + '}';
                var reg = new RegExp(replaceField, 'g');
                ruleTemp = ruleTemp.replace(reg, val);
            }
            return ruleTemp;
        },
        SetHideResult: function (rule, fields, canHideColumn) {
            var ruleTemp = this.GetHideRuleResult(rule, fields);
            var fun = new Function('return ' + ruleTemp)();
            if (!fun) {
                this.SetVisible(true);
            } else {
                this.SetVisible(false);
                if (canHideColumn)
                    this.HideColumn(true);
                this.HidePreHeaderTitle();
            }
        },
        //只用于主表字段隐藏子表列使用
        //子表字段隐藏规则配置了主表字段，当条件满足时候隐藏子表列
        HideColumn: function (hide) {
            //Error 这里逻辑要重新整理
            if (!hide && !this.Visible) {
                return;
            }
            var dataField = this.DataField;
            var thatCtrl = $('[data-controlkey][data-datafield="' + dataField + '"]');
            //var table = thatCtrl.closest('.SheetGridView').children('table');
            var table = thatCtrl.closest('.SheetGridView').find('table[class="table table-bordered table-hover table-condensed"]');
            if (table != void 0 && table.length > 0) {
                var th = table.find('div[data-datafield="' + dataField + '"][class*="table_th"]').parent();
                var td = $('[data-controlkey][data-datafield="' + dataField + '"]').parent();
                if (!hide) {
                    thatCtrl.show()
                } else {
                    thatCtrl.hide();
                }
            }
        },
        InitHideRule: function () {
            //如果有新的规则则使用新的，否则判断是否有旧规则
            var that = this;
            if (this.DataItem != null && this.DataItem.DisplayRule) {
                var rule = this.DataItem.DisplayRule;//规则表达式
                var fields = this.DataItem.DisplayRuleFields;//规则中引用的字段

                //如果规则中没有子表字段且当前字段是子表字段则为true
                //1.先要确定当前控件是否是子表控件
                //2.判断规则中的控件是否都是主表控件
                var canHideColumn = (that.DataField.indexOf('.') > -1) && that.DataField != 'CreatedBy.FullName';
                if (canHideColumn) {
                    for (var i = 0; i < fields.length; i++) {
                        var field = fields[i];
                        if (field.indexOf('.') > -1) {
                            //规则中字段是子表字段，不隐藏该列
                            canHideColumn = false;
                            break;
                        }
                    }
                }
                //如果that是子表控件，且fields里面全是主表字段或者常量，则当子表控件不可见的时候隐藏该列
                if (fields.length == 0) {
                    //规则中没有字段，直接执行
                    that.SetHideResult(rule, fields, canHideColumn);
                    return;
                }

                //给规则中引用到的字段绑定change事件
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (field == 'CreatedBy') {
                        field += '.FullName';
                    }
                    var ctrl = $('[data-datafield="' + field + '"]');
                    if (field.indexOf(".") > -1) {//规则中字段在子表
                        if (this.DataField.indexOf(".") > -1) {//配置规则的字段在子表中
                            var eventName = "change.hr." + this.ObjectId + "." + this.DataField;
                            var $ctrl = $(this.Element).closest(".list").find("[data-controlkey][data-datafield='" + field + "']");
                            if ($ctrl && $ctrl.length > 0) {
                                var controlMgr = $ctrl.JControl();
                                controlMgr.BindChange(eventName, function () {
                                    that.SetHideResult(rule, fields);
                                });
                                if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                    controlMgr.ChangeEvents[eventName].apply(this);
                                }
                            }
                        } else {//配置规则的字段在主表中，规则中的字段在子表中
                            var eventName = "change.hr." + this.DataField;
                            var gridMgr = $("[data-datafield='" + field.slice(0, field.indexOf(".")) + "']").JControl();
                            var tdCtrl = $("[data-controlkey][data-datafield='" + field + "']:not('.table_th')");
                            for (var j = 0; j < tdCtrl.length; j++) {
                                var controlMgr = $(tdCtrl[j]).JControl();
                                if (controlMgr) {
                                    controlMgr.UnbindChange(eventName);
                                    controlMgr.BindChange(eventName, function () {
                                        that.SetHideResult(rule, fields);
                                    });
                                    if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                        controlMgr.ChangeEvents[eventName].apply($(tdCtrl[j]));
                                    }
                                }
                            }
                            if (gridMgr) {
                                gridMgr.UnbindChange(eventName);
                                gridMgr.BindChange(eventName, function (args) {
                                    if (window[eventName]) {
                                        window.clearTimeout(window[eventName]);
                                        window[eventName] = null;
                                    }
                                    window[eventName] = setTimeout(function () {
                                        that.SetHideResult(rule, fields);
                                    }, 600);
                                });
                                if (that.ResponseContext.IsCreateMode || that.Value == null) {
                                    gridMgr.ChangeEvents[eventName].apply(this);
                                }
                            }
                        }
                    } else {
                        var ruleCtrl = ctrl.JControl();
                        if (ruleCtrl) {
                            ruleCtrl.BindChange("change.hr." + this.DataField, function () {
                                var ruleTemp = that.GetHideRuleResult(rule, fields);
                                var fun = new Function('return ' + ruleTemp)();
                                var thatCtrl = $("div[data-datafield='" + that.DataField + "']:not('.table_th')");
                                for (var m = 0; m < thatCtrl.length; m++) {
                                    $(thatCtrl[m]).JControl().SetVisible(!fun);
                                }
                                if (!fun) {
                                    if (canHideColumn) {
                                        that.HideColumn(false);
                                    }
                                } else {
                                    that.HidePreHeaderTitle();
                                    if (canHideColumn) {
                                        that.HideColumn(true);
                                    }
                                }
                            });
                        }
                    }
                }
                //setTimeout(function () {
                var ruleTemp = that.GetHideRuleResult(rule, fields);
                var func = new Function('return ' + ruleTemp)();
                if (!func) {
                    that.SetVisible(true);
                    if (canHideColumn) {
                        that.HideColumn(false);
                    }
                } else {
                    that.SetVisible(false);
                    if (canHideColumn) {
                        that.HideColumn(true);
                    }
                }
                // }, 0);
            } else if (this.DisplayRule) {//兼容旧的规则
                if (this.DisplayRule.RuleDataField != void 0) {
                    //旧的
                    var $controls = $('[data-datafield="' + this.DisplayRule.RuleDataField + '"]');
                    if (this.DataField.toString().indexOf('.') > -1) {
                        $controls = $(this.Element).closest('div.item').find('[data-datafield="]' + this.DisplayRule.RuleDataField + '"]');
                    }
                    var ruleControl = $controls.JControl();
                    if (ruleControl) {
                        ruleControl.BindChange('OnChange.' + this.DataField, function () {
                            if (this.GetValue() + '' == that.DisplayRule.RuleValue) {
                                that.SetVisible(true);
                            } else {
                                that.SetVisible(false);
                            }
                        });
                        ruleControl.OnChange();
                    }
                }
            }
        },
        //如果控件设置了不可见，且控件后面没有可见控件，则隐藏控件前面的标题栏
        HidePreHeaderTitle: function () {
            $.SmartForm.HideEmptyHeader();
        },

        // 增加验证消息显示
        AddInvalidText: function ($el, invalidText) {
            $el = $el || $(this.Element);
            this.invalidText = invalidText;
            return;
        },

        // 移除验证显示信息
        RemoveInvalidText: function ($el) {

        },

        // 控件的保存函数
        SaveDataField: function () {
            return {
            };
        },

        // 获取值
        GetValue: function () {
            return this.$InputBody.val();
        },

        //设置值:复杂控件必须重写该接口
        SetValue: function (obj) {
            this.$InputBody.val(obj);
        },

        // 对应复杂控件，Value可能是ID或Code，但是Text是显示名称
        GetText: function () {
            return this.$InputBody.text();
        },

        //设置是否可编辑
        SetReadonly: function (flag) {
        },

        //设置是否可见
        SetVisible: function (flag) {
            var lastVisible = this.Visible;
            if (flag) {
                //Error:如果原来是隐藏的话，有可能控件就没渲染，需要渲染后在显示
                //}//如果权限控制了visible则不执行隐藏规则的结果
                $(this.Element).show();
                //end
                if (($(this.Element).attr('data-controlkey') == 'FormTextBox' || $(this.Element).attr('data-controlkey') == 'FormTextArea') && !this.Editable) {
                    $(this.Element).find('pre').css('border', 'none');
                }
                //如果控件有计算规则，要重新计算
                if (this.DataItem.ComputationRule && lastVisible == false) {
                    var rule = this.DataItem.ComputationRule;
                    var fields = this.DataItem.ComputationRuleFields;
                    var tmp = this.GetComputationResult(rule, fields);
                    var fun = new Function('return ' + tmp)();
                    this.SetValue(fun);
                }
            }
            else {
                $(this.Element).hide();
                //end
                if (($.SmartForm.IsLoaded || this.ResponseContext.IsCreateMode) && this.Editable) {
                    // 表单加载完，才隐藏清空值
                    this.ClearValue();
                }
            }
            ////add by xc
            //$(this.Element).trigger('DomProChange.form', this.DataField);
        },

        ClearValue: function () {
            if (this.Visible) {
                this.SetValue("");
            }
        },

        // 设置为焦点
        SetFocus: function () {
            if (this.$InputBody) {
                if (this.$InputBody.is("div")) {
                    this.$InputBody.find("input,select").focus();
                } else {
                    this.$InputBody.focus();
                }
            }
        },

        //值改变事件
        OnChange: function () {
            if (this.ChangeEvents == null) return;
            if ($.isEmptyObject(this.ChangeEvents)) return;
            for (var key in this.ChangeEvents) {
                if ($.isFunction(this.ChangeEvents[key])) {
                    this.ChangeEvents[key].apply(this, [arguments]);
                }
            }
        },

        //绑定改变值事件
        BindChange: function (key, fn) {
            this.ChangeEvents[key] = fn;
        },

        ///解除绑定
        UnbindChange: function (key) {
            delete this.ChangeEvents[key];
        },


        //
        // Error : 这里需要去掉，统一从 $.SmartForm.PostForm 入口
        //异步取数
        //@url:地址
        //@type:类型，post、get
        //@dataParam:传入的json数据
        //@successCallBack:回调，可不传
        //@isAsync:是否异步，可不传
        //@errorCallBack:回调，可不传
        Ajax: function (url, type, dataParam, successCallBack, isAsync, errorCallBack) {
            console.log("Ajax 这个接口后续将移除，请关注!");
            var sharingKey = $.IQuery("SharingKey");
            var engineCode = $.IQuery("EngineCode");
            var data = $.extend({
                SharingKey: sharingKey, EngineCode: engineCode
            }, dataParam);

            $.ajax({
                type: type,
                url: url,
                data: data,
                dataType: "json",
                async: isAsync == null ? true : isAsync,
                success: function (data) {
                    if ($.isFunction(successCallBack))
                        successCallBack.apply(this, [data]);
                },
                error: function (data) {
                    if ($.isFunction(errorCallBack))
                        errorCallBack.apply(this, [data]);
                }
            });
        }
    }
})(jQuery);