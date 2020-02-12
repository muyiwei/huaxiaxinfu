//(function ($) {
    $.fn.Filter = function (options) {
        console.log(options);
        debugger;
        //  var reportViewManager = new ReportViewManager(options.ReportFiters, options.ReportPage, options.SourceCode, null, options.Ionic, options.PortalRoot);
        var FilterManager = new window.FilterManagers(options.Ionic, options.FilterContainer, options.Filters, options.CurrentUser, options.boolDic, function () {
          //  var that = this;
       //  that.ReLoadAllReport.apply(that);
            console.log(1);
        });
    }
var _defaultOptions = {
    DisplayType: {
        ///// 字符型
        //String: 0,
        ///// 数值型
        //Numeric: 1,
        ///// 时间型
        //DateTime: 2,
        ///// 机构型
        //Organization: 3,
        ///// 固定值
        //FixedValue: 4,
        ///// 数字字典
        //MasterData: 5,
        ////关联查询
        //Association: 6,
        ////布尔
        //Boolean: 7,
        ////流程模板
        //WorkflowTemple: 8

        /// <summary>
        /// 文本框类型
        /// </summary>
        TextBox :0,
    /// <summary>
    /// 下拉框类型
    /// </summary>
    DropdownList : 1,
    /// <summary>
    /// 单选框类型
    /// </summary>
    RadioButtonList : 2,
    /// <summary>
    /// 复选框类型
    /// </summary>
    CheckBoxList : 3,
    /// <summary>
    /// 长文本框类型
    /// </summary>
    RichTextBox : 4,
    /// <summary>
    /// 选人类型
    /// </summary>
    UserSelector : 5
    },
      OrganizationType: {
        ///只选人员
        User: 0,
        ///可选部门
        Dept: 1,
      },
      FilterType: {
          ///范围
          all: 0,
          ///非范围
          only: 1,
      },
   
}
var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];

    //********************************************   华丽分割线   ********************************************
    //********************************************   华丽分割线   ********************************************
    //过滤器管理器
var FilterManagers = function (ionic, filterContainer, filters, currentUser, boolDic, bindFun) {
    var that = this;
    debugger
    if (filters == null || filters.length == 0) {
        if (filterContainer) {
            //filterContainer.remove();
            filterContainer.append("<div class='menu-bar' style='justify-content: center;    font-size: 18px;'>未配置筛选条件!</div>");
        }
        return;
    }
   
        this.Filters = filters;
        this.filterValues = {};
        this.CurrentUser = currentUser;
        this.filterContainer = filterContainer;
        this.boolDic = boolDic;
        this.BindFun = bindFun;
        this.Ionic = ionic;
        this.Init();
    };
    FilterManagers.prototype = {
        Init: function () {
            // TODO:构造Dom对象，并注册Dom对象的事件
            var $row = null;
            var filterCount = 0;
            if (this.filterContainer) {

                for (var k = 0; k < this.Filters.length; k++) {
                    if (!this.Filters[k].Visible) {
                        var $filterControl = $(this.GetControl(this.Filters[k]));
                        if ($.isArray(this.Filters[k].FilterValue)) {
                            this.filterValues[this.Filters[k].PropertyCode.toLowerCase()] = this.Filters[k].FilterValue;
                        }
                        else {
                            this.filterValues[this.Filters[k].PropertyCode.toLowerCase()] = [this.Filters[k].FilterValue];
                        }
                        continue;
                    }

                    $row = $("<div class='menu-bar'></div>");
                    this.filterContainer.append($row);

                    var Keys = "";
                    if (this.Filters[k].AllowNull != undefined && !this.Filters[k].AllowNull) {
                        Keys = "*";
                    }
                    if (Keys != "") {

                        var $colTitle = $("<div class=\"menu-bar-left f15\">" + this.Filters[k].PropertyName + "</div><div class=\"menu-bar-right\"></div>");
                        $row.append($colTitle);
                    }
                    else {
                        //系统保留字段变成中文
                        if (this.Ionic.$scope.LanJson.ConditionColumns.hasOwnProperty(this.Filters[k].PropertyName)) {
                            var $colTitle = $("<div class=\"menu-bar-left f15\">" + this.Ionic.$scope.LanJson.ConditionColumns[this.Filters[k].PropertyName] + "</div><div class=\"menu-bar-right\"></div>");
                            this.Filters[k].PropertyName = this.Ionic.$scope.LanJson.ConditionColumns[this.Filters[k].PropertyName];
                        } else {
                            var $colTitle = $("<div class=\"menu-bar-left f15\">" + this.Filters[k].PropertyName + "</div><div class=\"menu-bar-right\"></div>");
                        }
                        $row.append($colTitle);
                    }

                    var $colControl = $("<div class=\"input-container\"></div>");
                    //选人控件_defaultOptions.DisplayType.UserSelector
                    if (this.Filters[k].DisplayType == _defaultOptions.DisplayType.UserSelector) {
                        $colControl = $("<div></div>").css("margin-top", "0.4rem");
                    }


                    var $filterControl = $(this.GetControl(this.Filters[k]));

                    $colControl.append($filterControl);
                    //$row.append($colControl);
                    $row.after($colControl);
                    //选人控件_defaultOptions.DisplayType.UserSelector
                    if (this.Filters[k].DisplayType == _defaultOptions.DisplayType.UserSelector) {
                        $row.css("display", "none");
                    }
                    var childScope = this.Ionic.$scope.$new(false);
                    childScope.UserOptions = angular.copy(this.Ionic.$scope.UserOptions);
                    //如果是选人控件，则设置初始值
                    if (this.Filters[k].DisplayType == _defaultOptions.DisplayType.UserSelector) {
                        if (this.Filters[k].FilterValue == 2) {
                            childScope.UserOptions.V = this.Ionic.$scope.user.ParentID;
                        } else if (this.Filters[k].FilterValue == 1) {
                            childScope.UserOptions.V = this.Ionic.$scope.user.ObjectID;
                        } else {
                            childScope.UserOptions.V = "";
                        }
                        var OrgID = childScope.UserOptions.V ? (childScope.UserOptions.V + ";" ): "";
                        this.filterValues[this.Filters[k].PropertyCode.toLowerCase()] = [OrgID];
                    }
                    this.Ionic.$compile($colControl.contents())(childScope);//手动编译angular指令 
                    //autor:tll，多选编译之后默认选中的要把样式选中样式，用data-default来代理input：checked的状态
                    if (this.Filters[k].DisplayType == _defaultOptions.DisplayType.CheckBoxList && this.Filters[k].DefaultValue) {
                        var len = $("[data-id='" + this.Filters[k].PropertyCode + "']");
                        if (len.length>0) { 
                            for (var i = 0; i <len.length; i++) {
                                console.log($(len[i]).data("default"));
                                if ($(len[i]).data("default")) {
                                    $(len[i]).children(".item-content")
                                  .css("background", '#e9f3fe')
                                  .css("border", 'none')
                                  .css("color", '#77BCFA');
                                }
                              
                            }
                        }
                    }
                    filterCount++;
                    this.RegisterChangeEvent(this.Filters[k], $filterControl);
                }


            }
        },
        // 设置选人控件的值
        SetSheetUserValue: function (UnitID, PlaceHolderName, $Control) {
            var ObjManager = {
                Editable: true, Visiable: true, OrgUnitVisible: true, V: UnitID, PlaceHolder: PlaceHolderName
            };
            $Control.SetValue(ObjManager);
        },
        //值改变事件
        OnChange: function () {
            //触发外部的改变事件
            if ($.isFunction(this.BindFun)) {
                this.BindFun.apply();
            }
        },
    
        //绑定事件
        RegisterChangeEvent: function (filter, $filterControl) {
            debugger
            // 绑定 Change 事件
            var that = this;
            //区间
            if ($filterControl && filter.FilterType == 2) {
                //文本区间change事件（时间，数值，文本）
                if (filter.DisplayType == _defaultOptions.DisplayType.TextBox) {
                    switch (filter.LogicType) {
                        case "ShortString":
                        case "String":
                        case "Int":
                        case "Long":
                        case "Double":
                            {
                                console.log(filter);
                                $("[id='" + filter.PropertyCode + "']").find('input[data-controlkey="Numeric"]').bind("change", [this, filter.PropertyCode], function (e) {
                                    //var inputs = e.data[0].filterContainer.find("[id='" + e.data[1] + "'] >input");

                                    var inputs = $(e.data[0].filterContainer).find("[id='" + e.data[1] + "'] input[data-controlkey='Numeric']");
                                    if (isNaN(inputs[0].value) || isNaN(inputs[1].value)) {
                                        inputs[0].value = inputs[0].value.replace(/[^\d\.]/g, '');
                                        inputs[1].value = inputs[1].value.replace(/[^\d\.]/g, '');
                                        e.data[0].Ionic.$scope.loadingShow("输入不合法");
                                       // return false;
                                    }
                                    if (parseFloat(inputs[0].value) > parseFloat(inputs[1].value)) {
                                        var text = $(inputs[0]).parents(".input-group").parent().prev().text() + e.data[0].Ionic.$scope.LanJson.areaError;
                                        e.data[0].Ionic.$scope.loadingShow(text);
                                        inputs[1].value = "";
                                        // return false;
                                    }
                                    e.data[0].Ionic.$scope.filterValues[e.data[1]] = {
                                      "start":  inputs[0].value ? parseFloat(inputs[0].value.trim()) : null,
                                      "end": inputs[1].value ? parseFloat(inputs[1].value.trim()) : null
                                    };
                                    if (that.ValidateFilter())
                                        e.data[0].OnChange.apply(e.data[0]);
                                });
                            } break;
                        case "DateTime":
                            {
                                $("[id='" + filter.PropertyCode + "']").find('span.showdate').bind("DOMSubtreeModified", [this, filter.PropertyCode], function (e) {
                                    var inputs = $(e.data[0].filterContainer).find("[id='" + e.data[1] + "'] span.showdate");
                                    if (new Date($(inputs[0]).text().trim()).getTime() > new Date($(inputs[1]).text().trim()).getTime()) {
                                        var text =$(inputs[0]).parents(".input-group").parent().prev().text() + e.data[0].Ionic.$scope.LanJson.areaError;
                                        e.data[0].Ionic.$scope.loadingShow(text);
                                        $(inputs[1]).text("");
                                    }
                                    e.data[0].Ionic.$scope.filterValues[e.data[1]] = {
                                        "start": $(inputs[0]).text() ? $(inputs[0]).text().trim() : null,
                                        "end": $(inputs[1]).text() ? $(inputs[1]).text().trim() : null
                                    };
                                  
                                });

                            } break;
                    }
                };
                
            } else {//非区间
                //文本区间change事件（时间，数值，文本）
                if (filter.DisplayType == _defaultOptions.DisplayType.TextBox) {
                    switch (filter.LogicType) {
                        case "Int":
                        case "Long":
                        case "Double":
                            {
                                console.log(filter);
                                $("[id='" + filter.PropertyCode + "']").find('input[data-controlkey="Numeric"]').bind("change", [this, filter.PropertyCode], function (e) {
                                    //var inputs = e.data[0].filterContainer.find("[id='" + e.data[1] + "'] >input");

                                    var inputs = $(e.data[0].filterContainer).find("[id='" + e.data[1] + "'] input[data-controlkey='Numeric']");
                                    if (isNaN(inputs[0].value)) {
                                        inputs[0].value = inputs[0].value.replace(/[^\d\.]/g, '');
                                        // $.IShowWarn("提示", "输入不合法");
                                        // commonJS.showShortMsg("setcommon f15", "输入不合法", 2000);
                                        return false;
                                    }
                                    e.data[0].Ionic.$scope.filterValues[e.data[1]] = inputs[0].value ? parseFloat(inputs[0].value.trim()) : null;
                                    if (that.ValidateFilter())
                                        e.data[0].OnChange.apply(e.data[0]);
                                });
                            } break;
                        case "DateTime":
                            {
                                $("[id='" + filter.PropertyCode + "']").find('span.showdate').bind("DOMSubtreeModified", [this, filter.PropertyCode], function (e) {
                                    var inputs = $(e.data[0].filterContainer).find("[id='" + e.data[1] + "'] span.showdate");
                                    e.data[0].Ionic.$scope.filterValues[e.data[1]] = $(inputs[0]).text() ? $(inputs[0]).text().trim() : null;
                                    if (that.ValidateFilter())
                                        e.data[0].OnChange.apply(e.data[0]);
                                });

                            } break;
                        default: {
                            $filterControl.bind("change", [this, filter.PropertyCode], function (e) {
                                e.data[0].Ionic.$scope.filterValues[e.data[1]] = $.trim(this.value);
                                if (that.ValidateFilter())
                                    e.data[0].OnChange.apply(e.data[0]);
                            });
                        } break;
                    } 
                };
                if (filter.DisplayType == _defaultOptions.DisplayType.CheckBoxList) {
                    $filterControl.bind("change", [this, filter.PropertyCode], function (e) {    
                        e.data[0].Ionic.$scope.filterValues[e.data[1]] = this.value.trim();
                        if (that.ValidateFilter())
                            e.data[0].OnChange.apply(e.data[0]);
                    });
                }
                if (filter.DisplayType == _defaultOptions.DisplayType.DropdownList) {
                    $filterControl.bind("change", [this, filter.PropertyCode], function (e) {
                        e.data[0].Ionic.$scope.filterValues[e.data[1]] = this.value.trim();
                        if (that.ValidateFilter())
                            e.data[0].OnChange.apply(e.data[0]);
                    });
                }
                if (filter.DisplayType == _defaultOptions.DisplayType.RadioButtonList) {
                    $filterControl.bind("change", [this, filter.PropertyCode], function (e) {
                        e.data[0].Ionic.$scope.filterValues[e.data[1]] = this.value.trim();
                        if (that.ValidateFilter())
                            e.data[0].OnChange.apply(e.data[0]);
                    });
                };
                if (filter.DisplayType == _defaultOptions.DisplayType.UserSelector) {//组织 
                    $("[id='" + filter.PropertyCode + "']").find('input[type="hidden"]').bind("change", function (e) {
                        var datas = [];
                        var dastr = $("[id='" + filter.PropertyCode + "']").find('input[type="hidden"]').val();
                        that.Ionic.$scope.filterValues[filter.PropertyCode] = dastr;
                        //var da = [];
                        //if (dastr != "") {
                        //    da = dastr.split(',');
                        //}
                        //if (da.length > 1) {
                        //    for (var ia = 0; ia < da.length; ia++) {
                        //        datas.push(da[ia]);
                        //    }
                        //    that.Ionic.$scope.filterValues[filter.PropertyCode] = datas;
                        //} else {
                        //    if (da == "") {
                        //        var ds = [];
                        //        that.Ionic.$scope.filterValues[filter.PropertyCode] = ds;
                        //    } else {
                        //        that.Ionic.$scope.filterValues[filter.PropertyCode] = da;
                        //    }

                        //}
                        if (that.ValidateFilter())
                            that.OnChange.apply(that);
                    });
                };
             
            }
        },
        // 获取非区间控件
        GetControl: function (filter) {

            var that = this;
            if (filter.FilterType == 2) {//区间不取默认值
                this.Ionic.$scope.filterValues[filter.PropertyCode] = "";//存储筛选字段
            } else {
                this.Ionic.$scope.filterValues[filter.PropertyCode] = filter.DefaultValue || "";//存储筛选字段
            };
         
            if (filter.FilterType != 2 && filter.DisplayType == _defaultOptions.DisplayType.TextBox) {//单个文本类型 
                switch (filter.LogicType) {
                    case "Int":
                    case "Long": 
                    case "Double":
                        var DefaultValue = filter.DefaultValue == null ? "" : filter.DefaultValue;
                        $input = $("<div>").addClass("input-group").attr("id", filter.PropertyCode);
                        var $begin = $("<input class='form-control myform-control'>").attr("data-controlkey", "Numeric").val(DefaultValue);
                        //限制输入内容只能为数字
                        $begin.keyup(function () {
                            if (this.value.length == 1) {
                                this.value = this.value.replace(/[^0-9]/g, '');
                            } else {
                                this.value = this.value.replace(/[^\d\.]/g, '');
                                this.value = this.value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
                            }
                        });
                        $input.append($begin);
                        return $input;

                        break;
                    case "DateTime":
                        var beginvalue, endvalue;
                        $input = $("<div>").addClass("input-group input-container").attr("id", filter.PropertyCode).css("flex-wrap", "nowrap").css("padding", "0px");

                        ////移动端时间插件
                        var $begindiv = $("<div class=' datepicker' ion-datetime-picker date style='' ng-model='beginvalue'>").attr("data-controlkey", "DateTime");
                        var $begintime = '<span class="showdate f14" ng-bind-html="beginvalue| date:\'yyyy-MM-dd\'"></span >';
                       $input.append($begindiv.append($begintime));
                         filter.FilterValue = [beginvalue, endvalue];
                        return $input;
                        break;
                    default:
                        var $input = $('<input type="text" class="f14" >');
                        if (filter.DefaultValue) {
                            $input.val(filter.DefaultValue);
                        }
                        return $input;
                        break;
                }    
            }
            if (filter.FilterType == 2 && filter.DisplayType == _defaultOptions.DisplayType.TextBox) {//区间文本类型 
                switch (filter.LogicType) {
                            case "ShortString":
                            case "String":
                            case "Int":
                            case "Long": 
                            case "Double": 
                           var DefaultValue = filter.FilterValue == null ? "" : filter.FilterValue.split(";");
                           $input = $("<div>").addClass("input-group").attr("id", filter.PropertyCode);
                        $input.append($("<div class='input-group-addon' style='padding: 6px 8px;'>从</div>"));
                        var beginval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 0 ? DefaultValue[0] : "";
                        var $begin = $("<input class='form-control myform-control'>").attr("data-controlkey", "Numeric").val(beginval);
                        //限制输入内容只能为数字
                        $begin.keyup(function () {
                            if (this.value.length == 1) {
                                this.value = this.value.replace(/[^0-9]/g, '');
                            } else {
                                this.value = this.value.replace(/[^\d\.]/g, '');
                                this.value = this.value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
                            }
                        });

                        $input.append($begin);
                        $input.append($("<div class='input-group-addon' style='padding: 6px 8px;'>至</div>"));
                        var endval = DefaultValue != null && DefaultValue != "" && DefaultValue.length > 1 ? DefaultValue[1] : "";
                        var $end = $("<input class='form-control myform-control'>").attr("data-controlkey", "Numeric").val(endval);
                        //限制输入内容只能为数字
                        $end.keyup(function () {
                            if (this.value.length == 1) {
                                this.value = this.value.replace(/[^0-9]/g, '');
                            } else {
                                this.value = this.value.replace(/[^\d\.]/g, '');
                                this.value = this.value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');

                            }
                        });
                        $input.append($end);
                        return $input;
                        break;
                    case "DateTime":
                        var beginvalue, endvalue;
                        $input = $("<div>").addClass("input-group input-container").attr("id", filter.PropertyCode).css("flex-wrap", "nowrap").css("padding", "0px");
                        ////移动端时间插件
                        var $begindiv = $("<div class=' datepicker' ion-datetime-picker date style='' ng-model='beginvalue'>").attr("data-controlkey", "DateTime");
                        var $begintime = '<span class="showdate f14" ng-bind-html="beginvalue| date:\'yyyy-MM-dd\'"></span >';
                        //  var $beginInput = $("<input type='hidden'  style='display:none'  ng-value='beginvalue'>").attr("data-controlkey", "DateTime").val(beginvalue);
                        $input.append($begindiv.append($begintime));
                        $input.append('<div class="shortline"></div>');
                        var $enddiv = $("<div class=' datepicker' ion-datetime-picker date style='' ng-model='endvalue'>").attr("data-controlkey", "DateTime");
                        var $endttime = '<span class="showdate f14"  ng-bind-html="endvalue| date:\'yyyy-MM-dd\'"></span >';
                       $input.append($enddiv.append($endttime));
                        filter.FilterValue = [beginvalue, endvalue];
                        return $input;
                break;
               }
            } else if (filter.DisplayType == _defaultOptions.DisplayType.UserSelector) {// 组织类型
                switch (filter.PropertyCode) {
                    case "OwnerParentId":
                    case "CreatedByParentId":
                        var dataOrgUnitVisible = 'data-OrgUnitVisible="true"';
                        var dataUserVisible = 'data-UserVisible="true"';
                        break;
                    default:
                        var dataOrgUnitVisible = 'data-OrgUnitVisible="false"';
                        var dataUserVisible = 'data-UserVisible="true"';
                        break;
                }
                var $input = '<div class="sheetuserflag menu-bar"  id="' + filter.PropertyCode + '" ng-click="ReportstateUser($event)" ng-model="filters" ' + dataOrgUnitVisible + ' ' + dataUserVisible + '  data-scopedata="' + filter.PropertyCode + '" data-datafield="' + filter.PropertyCode + '">' +
                    '<div class="menu-bar-left f15">' + filter.PropertyName + '</div>' +
                    '<div class="menu-bar-right f14">' +
                    '<span></span><i class="ion-chevron-right f14 ml10"></i>' +
                    '</div>' +
                    '<input type="hidden" value=""/>' +
                    '</div>';

                return $input;
            } 
            else if (filter.DisplayType == _defaultOptions.DisplayType.CheckBoxList) {//多选
                var itemValue = filter.SelectedValues;// 
                var select = "";
                if (itemValue.length > 0) {
                    for (var i = 0; i < itemValue.length; i++) {
                        console.log();
                        select += "<ion-checkbox  ng-checked=\"" + itemValue[i].Extend.IsDefault + "\"  data-default=\"" + itemValue[i].Extend.IsDefault + "\" data-id=\"" + filter.PropertyCode + "\" data-value=\"" + itemValue[i].Value + "\" ng-click=\"checkBoxChange($event)\" ng-value-bind=\"" + itemValue[i].Text + "\"  >" + itemValue[i].Text + "</ion-checkbox>";
                    }
                }
                select += "";
                return select;
            }
            else if (filter.DisplayType == _defaultOptions.DisplayType.RadioButtonList || filter.DisplayType == _defaultOptions.DisplayType.DropdownList) {//单选

                var itemValue = filter.SelectedValues;// 
                var select = "";
                if (itemValue.length > 0) {
                    for (var i = 0; i < itemValue.length; i++) {
                        //ng-value中文值会报错!
                        select += "<ion-radio   ng-model=\"filterValues." + filter.PropertyCode + "\"  data-id=\"" + filter.PropertyCode + "\" data-value=\"" + itemValue[i].Value + "\"  data-name=\"" + filter.PropertyCode + "\"  >" + itemValue[i].Text + "</ion-radio>";
                        //select += "<option value=\"" + itemValue[i].Value + "\">" + itemValue[i].Text + "</option>";
                    }
                }
                select += "";
                return select;
            }
            else if (filter.DisplayType == _defaultOptions.DisplayType.FixedValue) {
                var options = filter.FilterValue == null || filter.FilterValue == "" ? "" : filter.FilterValue.split(";");
                if (this.boolDic && this.boolDic[filter.PropertyCode]) {
                    $input = $("<div>").attr("id", filter.PropertyCode);
                    if (options != "" && options.length > 0) {
                        for (var j = 0; j < options.length; j++) {
                            var $label;
                            if (this.boolDic && this.boolDic[filter.PropertyCode]) {
                                if (options[j] == "是")
                                    $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="1" > ' + options[j]);
                                else
                                    $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px;padding-top:5px;">').append('<input type="checkbox" value="0"  > ' + options[j]);
                                $input.append($label);
                            }
                            else {

                                $label = $('<label class="checkbox-inline" style="margin-left:0px;margin-right:10px">').append('<input type="checkbox" value="' + options[j] + '"  checked> ' + options[j]);;
                            }
                        }
                    }
                    return $input;
                }
                else {
                    var select = "<select class=\"form-control mydropdown\" multiple=\"multiple\">";
                    for (var j = 0; j < options.length; j++) {
                        var value = options[j];
                        var key = options[j];
                        select += "<option value=\"" + key + "\">" + value + "</option>";
                    }
                    select += "</select>";
                    return select;
                }
            }
            else if (filter.DisplayType == _defaultOptions.DisplayType.Boolean) {//布尔型
                var options = filter.FilterValue == null || filter.FilterValue == "" ? "" : filter.FilterValue.split(";");
                $input = $("<div>").attr("id", filter.PropertyCode).css("padding", "0px").css("display", "flex");

                if (options != "" && options.length > 0) {
                    for (var j = 0; j < options.length; j++) {
                        var $label;
                        if (options[j] == "是")
                            $label = $('<ion-radio value="1">{{languages.Filter.yes}}</ion-radio>');
                        else
                            $label = $('<ion-radio  value="0">{{languages.Filter.no}}</ion-radio>');
                        $input.append($label);
                    }
                }
                $input.append($('<ion-radio value="">{{languages.Filter.all}}</ion-radio>'));
                return $input;
            }
            else if (filter.DisplayType == _defaultOptions.DisplayType.Association) {

                var $input = $("<span class='mydropdown' id='" + filter.PropertyCode + "' data-boschemacode='" + filter.AssociationSchemaCode + "'></span>");
                $input.FormQuery();
                return $input;
            }
        },
        SetValue: function (filterValues) {
            this.filterValues = filterValues;
        },
        GetValue: function () {
            return this.filterValues;
        },
        ValidateFilter: function () {
            var $ReportFilters = this.filterContainer;
            if (this.Filters && $ReportFilters && $ReportFilters.length > 0) {
                var checkerror = false;
                var errorresult = "";
                for (var i = 0; i < this.Filters.length; i++) {
                    var filter = this.Filters[i];

                    if (!filter.Visible || filter.AllowNull) continue;
                    var $filterControl = $ReportFilters.find("[id='" + filter.PropertyCode + "']");
                    switch (filter.FilterType) {
                        case _defaultOptions.FilterType.Numeric:
                        case _defaultOptions.FilterType.DateTime:
                            {
                                var inputs = $filterControl.find("input");
                                if (!inputs[0].value && !inputs[1].value) {
                                    checktrue = true;
                                    errorresult += filter.DisplayName + "必填" + ";";
                                }
                            } break;
                        case _defaultOptions.FilterType.Organization:
                            {

                                var value = $filterControl.SelectedValue;
                                if (!value) {
                                    checktrue = true;
                                    errorresult += filter.DisplayName + "必填" + ";";
                                }
                            }; break;
                        case _defaultOptions.FilterType.FixedValue:
                        case _defaultOptions.FilterType.MasterData:
                            {
                                var value = $filterControl.val();
                                if (!value || value.length == 0) {
                                    checktrue = true;
                                    errorresult += filter.DisplayName + "必填" + ";";
                                }
                            } break;

                        case _defaultOptions.FilterType.Association:
                            {
                                if (!$filterControl.FormQuery().GetValue()) {
                                    checktrue = true;
                                    errorresult += filter.DisplayName + "必填" + ";";
                                }
                            } break;
                        default:
                            {
                                var value = $filterControl.value;
                                if (!value) {
                                    checktrue = true;
                                    errorresult += filter.DisplayName + "必填" + ";";
                                }

                            } break;
                    }
                }
                if (checkerror) {
                    $.IShowWarn("提示", errorresult);
                    return false;
                }
                return true;
            }
            if (!filter.AllowNull) {
                if (filter.IsSqlWhere) {
                    if (values[0]) {
                        $.IShowWarn("提示", filter.DisplayName + "必填");
                        $(inputs[0]).focus();
                        return false
                    }
                }
                else {
                    if (values.length == 1) {
                        if (values[0]) {
                            $.IShowWarn("提示", filter.DisplayName + "必填");
                            $(inputs[0]).focus();
                            return false
                        }
                    }
                    else {
                        if (values[0] && values[1]) {
                            $.IShowWarn("提示", filter.DisplayName + "必填");
                            $(inputs[0]).focus();
                            return false
                        }
                    }
                }
                return true;
            }
        },
        //获取当月最后一天日期  
        getFirstAndLastMonthDay: function (year, month) {
            var firstdate = year + '-' + month + '-01';
            var day = new Date(year, month, 0);
            var lastdate = year + '-' + month + '-' + day.getDate();
            return lastdate;
        },
        //获取本周的第一天和最后一天
        getFirstAndLastdayweek: function () {
            var time = new Date();
            if (time.getDay() != 0) {
                time.setDate(time.getDate() - time.getDay() + 1);
            }
            else {
                time.setDate(time.getDate() - 6);
            }
            weekfirstday = time.getFullYear() + "-" + (time.getMonth() - 0 + 1) + "-" + time.getDate();
            time.setDate(time.getDate() + 6);
            weekdayLast = time.getFullYear() + "-" + (time.getMonth() - 0 + 1) + "-" + time.getDate();
            return [weekfirstday, weekdayLast];
        },
        //获取本季第一天，最后一天
        GetFirstAndLastDayQuarter: function () {
            var mydate = new Date();
            var month = mydate.getMonth() - 0 + 1;
            var year = mydate.getFullYear();
            if (month >= 1 && month <= 3) {
                var firstdate = year + '-' + 01 + '-01';
                var day = new Date(year, 3, 0);
                var lastdate = year + '-' + 03 + '-' + day.getDate();//获取第一季度最后一天日期
                return [firstdate, lastdate];
            } else if (month >= 4 && month <= 6) {
                var firstdate = year + '-' + 04 + '-01';
                var day = new Date(year, 6, 0);
                var lastdate = year + '-' + 06 + '-' + day.getDate();//获取第二季度最后一天日期    
                return [firstdate, lastdate];
            } else if (month >= 7 && month <= 9) {
                var firstdate = year + '-07-01';
                var day = new Date(year, 9, 0);
                var lastdate = year + '-09-' + day.getDate();//获取第三季度最后一天日期
                return [firstdate, lastdate];
            } else if (month >= 10 && month <= 12) {
                var firstdate = year + '-' + 10 + '-01';
                var day = new Date(year, 12, 0);
                var lastdate = year + '-' + 12 + '-' + day.getDate();//获取第四季度最后一天日期
                return [firstdate, lastdate];
            }

        }
    };
    //********************************************   华丽分割线   ********************************************
    //********************************************   华丽分割线   ********************************************
//})