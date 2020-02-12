//过滤参数管理器：构造界面、读取过滤数据

//Load:初始化数据，调用之前，必先调用这个接口
//     @parameters:过滤参数配置
//     @container:显示容器  $("#Id")
//     @portalRoot:H3 Portal 根路径

//ShowFilter:Load加载完，需要显示的时候，展示
//GetFilterData:获取过滤参数数据,返回数组

var FilterManager = {
    //过滤参数
    Parameters: null,
    //显示过滤条件的容器
    Container: null,
    Fields: null,
    //加载地址
    LoadUrl: $.Controller.ReportView.ReportParameterHandlerController,
    LoadUrlBase: $.Controller.ReportView.ReportParameterHandlerController,
    OrgLoadUrl: $.Controller.ReportView.PortalTreeHandlerController,
    OrgLoadUrlBase: $.Controller.ReportView.ReportParameterHandlerController,
    SourseUrl: $.Controller.ReportView.ReportSourceViewController,
    //表单
    LigerForm: null,
    //加载
    Load: function (parameters, container, portalRoot) {
        this.Parameters = ObjectClone(parameters);
        this.Container = container;
        this.PortalRoot = portalRoot == null ? "/Portal" : portalRoot;
        this.LoadUrl = this.PortalRoot + this.LoadUrlBase;
        this.OrgLoadUrl = this.PortalRoot + this.OrgLoadUrlBase;
    },
    //在容器里显示过滤条件
    ShowFilter: function () {
        this.LigerForm = this.Container.ligerForm({
            rightToken: "",
            fields: this._GetFilterFields()
        });
        this.LigerForm.setData(this._InitData);

        for (var key in this._InitText) {
            this.LigerForm.getEditor(key).inputText.val(this._InitText[key]);
        }
    },
    //获取过滤字段
    _GetFilterFields: function () {
        this._InitData = {};
        this._InitText = {};
        this.Fields = new Array();
        for (var i = 0, j = this.Parameters.length; i < j; i++) {
            this._CreateFilterField(this.Parameters[i], i);
        }
        return this.Fields;
    },
    _InitData: {},
    _InitText: {},
    //创建过滤字段
    _CreateFilterField: function (parameter, i) {
        var isnewline = (i % 2 == 0);
        if (this.Fields.length > 0) {
            isnewline = !this.Fields[this.Fields.length - 1].newline;
        }
        var field = { display: parameter.DisplayName, id: parameter.ColumnCode, name: parameter.ColumnCode, newline: isnewline, type: "hidden" };
        switch (parameter.ParameterType) {
            //#region字符串类型
            case EnumParameterType.String:
                if (parameter.Visible)
                    field.type = "text";
                this._InitData[field.name] = this.GetQueryString(field.name) == null ? parameter.DefaultValue : this.GetQueryString(field.name);
                break;
                //#endregion

                //#region 数值类型
            case EnumParameterType.Numeric://数值类型
                if (parameter.Visible) {
                    field.type = "number";
                    field.options = {
                        checkValue: function () {
                            var g = this, p = this.options;
                            var v = g.inputText.val() || "";
                            if (v == "") return;
                            if (p.currency) v = v.replace(/\$|\,/g, '');
                            var isFloat = p.number || p.currency, isDigits = p.digits;
                            if (isFloat && !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(v) || isDigits && !/^\d+$/.test(v)) {
                                //不符合,恢复到原来的值
                                g.inputText.val(g.value || 0);
                                p.currency && g.inputText.val(currencyFormatter(g.value));
                                return;
                            }
                            g.value = v;
                            p.currency && g.inputText.val(currencyFormatter(g.value));
                        }
                    };
                }
                this._InitData[field.name] = this.GetQueryString(field.name) == null ? parameter.DefaultValue : this.GetQueryString(field.name);
                break;
                //#endregion

                //#region 时间类型
            case EnumParameterType.DateTime:
                var beginfield, endfield;
                if (parameter.Visible) {
                    beginfield = { display: parameter.DisplayName, id: "begin_" + parameter.ColumnCode, name: "begin_" + parameter.ColumnCode, newline: true, type: "date" };
                    endfield = { display: "-", id: "end_" + parameter.ColumnCode, name: "end_" + parameter.ColumnCode, newline: false, type: "date" };
                }
                else {
                    beginfield = { display: parameter.DisplayName, id: "begin_" + parameter.ColumnCode, name: "begin_" + parameter.ColumnCode, newline: true, type: "hidden" };
                    endfield = { display: "-", id: "end_" + parameter.ColumnCode, name: "end_" + parameter.ColumnCode, newline: false, type: "hidden" };
                }
                this.Fields.push(beginfield);
                this.Fields.push(endfield);
                //默认时间，设置
                var currentDate = new Date();
                //一天的毫秒数
                var millsecond = 1000 * 60 * 60 * 24;
                //当前年份
                var currentYear = currentDate.getFullYear();
                switch (parameter.ParameterValue) {
                    case 0:
                    case "0"://当天
                        this._InitData[beginfield.name] = new Date();
                        this._InitData[endfield.name] = new Date();
                        break;
                    case 1:
                    case "1"://本周
                        //在一周的中的天数
                        var week = currentDate.getDay();
                        //减去的天数
                        var minusDay = week != 0 ? week - 1 : 6;
                        var monday = new Date(currentDate.getTime() - (minusDay * millsecond));
                        var sunday = new Date(monday.getTime() + (6 * millsecond));

                        this._InitData[beginfield.name] = monday;
                        this._InitData[endfield.name] = sunday;
                        break;
                    case 2:
                    case "2"://本月
                        var currentMonth = currentDate.getMonth();

                        var firstDay = new Date(currentYear, currentMonth, 1);
                        //当为12月份的时候，年份需要加1
                        if (currentMonth == 11) {
                            currentYear++;
                            currentMonth = 0;
                        }
                        else {
                            //否则只是月份增加,以便求以一个月的第一天
                            currentMonth++;
                        }
                        var nextMonthDatOne = new Date(currentYear, currentMonth, 1);
                        var lastDay = new Date(nextMonthDatOne.getTime() - millsecond);

                        this._InitData[beginfield.name] = firstDay;
                        this._InitData[endfield.name] = lastDay;
                        break;
                    case 3:
                    case "3"://本年
                        var firstDayOfYear = new Date(currentYear, 0, 1);
                        var lastDayOfYear = new Date(new Date(++currentYear, 0, 1).getTime() - millsecond);
                        this._InitData[beginfield.name] = firstDayOfYear;
                        this._InitData[endfield.name] = lastDayOfYear;
                        break;
                }
                return;
                //#endregion

                //#region 组织机构类型
            case EnumParameterType.Orgnization://组织机构类型
                if (parameter.Visible) {
                    field.type = "combobox";
                    //var treeDataUrl = this.LoadUrl + "?ParameterType=" + parameter.ParameterType + "&ParameterValue=" + parameter.ParameterValue;
                    var method = "OrganizationData";
                    var treeDataUrl = this.LoadUrl + method;
                    field.editor = {
                        selectBoxWidth: 300,
                        selectBoxHeight: 300,
                        valueField: 'ObjectID',
                        textField: 'Text',
                        isMultiSelect: true,
                        treeLeafOnly: false,
                        valueFieldID: parameter.ColumnCode,
                        tree: {
                            checkbox: false,
                            url: treeDataUrl,
                            data: { ParameterValueStr: parameter.ParameterValue },
                            idFieldName: 'ObjectID',
                            textFieldName: 'Text',
                            iconFieldName: "Icon",
                            isLeaf: function (data) {
                                if (!data) return false;
                                return data.IsLeaf;
                            },
                            delay: function (e) {
                                var node = e.data;
                                if (node == null) return false;
                                if (node.IsLeaf == null) return false;
                                if (node.LoadDataUrl == null) return false;
                                if (!node.IsLeaf && node.children == null) {
                                    return node.LoadDataUrl;
                                }
                                return false;
                            },
                            onAfterAppend: function (domnode, nodedata) {
                                var g = this, p = this.options;
                                if (!g.treeManager) return;
                                var value = null;
                                if (p.initValue) value = p.initValue;
                                else if (g.valueField.val() != "") value = g.valueField.val();
                                // g.selectValueByTree(value);
                            }
                        }
                    };
                }

                var orgText = "";
                var orgCode = "";//为空取当前用户所在组织
                if (this.GetQueryString(field.name) != null) {
                    //根据url传过来的组织
                    orgCode = this.GetQueryString(field.name);
                }
                //var PostUrl = this.LoadUrl + "?ParameterType=GetOrgText&ParameterValue=" + orgCode;
                var method = "GetOrgText";
                var PostUrl = this.LoadUrl + method;
                $.ajax({
                    url: PostUrl,
                    data: { ParameterValueStr: orgCode },
                    dataType: "json",
                    type: "POST",
                    cache: false,
                    async: false,//是否异步
                    success: function (data) {
                        orgText = data.Name;
                        orgCode = data.OrgID;
                    }
                });
                this._InitData[field.name] = orgCode;
                this._InitText[field.name] = orgText;
                break;
                //#endregion

                //#region 流程模板类型
            case EnumParameterType.WorkflowCode://流程模板类型
                if (parameter.Visible) {
                    field.type = "combobox";
                    var method = "WorkflowCodeData";
                    var treeDataUrl = this.LoadUrl + method//+ "?ParameterType=" + parameter.ParameterType + "&ParameterValue=" + parameter.ParameterValue;
                    field.editor = {
                        selectBoxWidth: 300,
                        selectBoxHeight: 300,
                        valueField: 'Code',
                        textField: 'DisplayName',
                        valueFieldID: field.name,
                        tree: {
                            checkbox: true,
                            url: treeDataUrl,
                            idFieldName: 'Code',
                            textFieldName: 'DisplayName',
                            iconFieldName: "Icon",
                            isLeaf: function (data) {
                                if (!data) return false;
                                return data.IsLeaf;
                            }
                        }
                    };
                }

                if (this.GetQueryString(field.name) != null) {
                    this._InitData[field.name] = this.GetQueryString(field.name);
                }
                break;
                //#endregion

                //#region 系统参数:前端隐藏 Error
            case EnumParameterType.System://系统参数
                field.type = "hidden";
                var SystemData = "";
                var method = "GetSystemData";
                var PostUrl = this.LoadUrl + method;
                $.ajax({
                    url: PostUrl,
                    dataType: "text",
                    data: { parameterValue: parameter.ParameterValue },
                    type: "POST",
                    cache: false,
                    async: false,//是否异步
                    success: function (data) {
                        SystemData = eval("(" + data + ")");
                    }
                });
                this._InitData[field.name] = SystemData;
                return;
                //#endregion

                //#region 数字字典
            case EnumParameterType.MasterData://数字字典
                if (parameter.Visible) {
                    var MasterData = new Array();
                    var values;
                    var method = "MasterDataData";
                    var PostUrl = this.LoadUrl + method;
                    $.ajax({
                        url: PostUrl,
                        dataType: "text",
                        data: { parameterValue: parameter.DefaultValue },
                        type: "POST",
                        cache: false,
                        async: false,//是否异步
                        success: function (data) {
                            if (data) {
                                var dataArray = $.parseJSON(data);
                                if (parameter.DefaultValue) {
                                    values = dataArray[0].children;
                                } else {
                                    values = dataArray;
                                }
                            }
                        }
                    });
                    MasterData.push({ id: '', text: '全部' });
                    if (values)
                        for (var i = 0; i < values.length; i++) {
                            MasterData.push({ id: values[i].Code, text: values[i].Text });
                        }
                    field.type = "select";
                    field.editor = {
                        selectBoxWidth: 300,
                        selectBoxHeight: 300,
                        data: MasterData
                    };
                }
                if (this.GetQueryString(field.name) != null)
                    this._InitData[field.name] = this.GetQueryString(field.name);
                break;
                //if (parameter.Visible) {
                //    field.type = "combobox";
                //    var treeDataUrl = this.LoadUrl + "?ParameterType=" + parameter.ParameterType;
                //    field.editor = {
                //        selectBoxWidth: 300,
                //        selectBoxHeight: 300,
                //        textField: 'Text',
                //        valeuField: 'Code',
                //        valueFieldID: parameter.ColumnCode,
                //        tree: {
                //            checkbox: false,
                //            url: treeDataUrl,// '../Ajax/TreeDataHandler/MasterDataTree.ashx',
                //            idFieldName: 'Code',
                //            textFieldName: 'Text',
                //            iconFieldName: "Icon",
                //            isLeaf: function (data) {
                //                if (!data) return false;
                //                return data.IsLeaf;
                //            }
                //        }
                //    }
                //    if (QueryString(field.name) != null)
                //        this._InitData[field.name] = QueryString(field.name);
                //}
                //break;
                //#endregion

                //#region 固定值
            case EnumParameterType.FixedValue://固定值
                if (parameter.Visible) {
                    var FixedValues = new Array();
                    var values = parameter.ParameterValue.split(';');
                    for (var i = 0; i < values.length; i++) {
                        FixedValues.push({ id: values[i], text: values[i] });
                    }
                    field.type = "select";
                    field.editor = {
                        selectBoxWidth: 300,
                        selectBoxHeight: 300,
                        data: FixedValues
                    };
                }
                this._InitData[field.name] = parameter.DefaultValue;
                break;
                //#endregion
        }
        this.Fields.push(field);
    },
    //获取过滤条件数据
    GetFilterData: function () {
        var FilterData = new Array();
        var formData = this.LigerForm.getData();
        for (var i = 0, j = this.Parameters.length; i < j; i++) {
            var newParam = ObjectClone(this.Parameters[i]);
            //if (this.Parameters[i].ParameterType == EnumParameterType.System) continue;
            //if (this.Parameters[i].ParameterType == EnumParameterType.FixedValue
            //    || this.Parameters[i].ParameterType == EnumParameterType.MasterData
            //    || this.Parameters[i].ParameterType == EnumParameterType.Orgnization
            //    || this.Parameters[i].ParameterType == EnumParameterType.Orgnization
            //    || this.Parameters[i].ParameterType == EnumParameterType.System) {
            //    newParam.DefaultValue = formData[this.Parameters[i].ColumnCode];
            //}
            //else
            if (this.Parameters[i].ParameterType == EnumParameterType.DateTime) {
                //时间是范围
                newParam.DefaultValue = $("input[name='begin_" + this.Parameters[i].ColumnCode + "']").val(); //formData["begin_" + this.Parameters[i].ColumnCode].format("yyyy-MM-dd");
                newParam.DefaultValue += ";" + $("input[name='end_" + this.Parameters[i].ColumnCode + "']").val();// formData["end_" + this.Parameters[i].ColumnCode].format("yyyy-MM-dd"); //
            }
            else {
                //newParam.DefaultValue = $("input[name='" + this.Parameters[i].ColumnCode + "']").val();
                newParam.DefaultValue = formData[this.Parameters[i].ColumnCode];
            }

            FilterData.push(newParam);
        }
        return FilterData;
    },
    //处理前后台url
    GetQueryString: function (key) {
        if (ReportViewManager.IsPortal) {
            var vars = {};
            var hashs = window.location.href.slice(window.location.href.lastIndexOf("/") + 1).split('&');
            for (var i = 0; i < hashs.length; i++) {
                hash = hashs[i].split('=');
                if (hash.length == 2)
                    vars[hash[0]] = hash[1];
            }
            return decodeURI(vars[key]) == "undefined" ? null : decodeURI(vars[key]);
        } else {
            return QueryString(key);
        }
    },
};
