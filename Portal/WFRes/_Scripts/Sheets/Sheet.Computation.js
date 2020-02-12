/*
表单计算规则解析函数
支持格式：2,表达式
表达式为：{A}*{B}-({C}+{D})/{SUM(数据项)}，函数支持:SUM,AVG,COUNT,MAX,MIN
Authine 2013-9
*/

var _Sheet_Computation_GlobalString = { "Sheet_Computation_Msg0": "计算规则设置错误：" };
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Sheet_Computation_Msg0" }, function (data) {
//    if (data.IsSuccess) {
//        _Sheet_Computation_GlobalString = data.TextObj;
//    }
//}, "json");

// 计算函数定义
var CompuationFun = [
    {
        Name: "",
        Accept: function (express) {
            return express.indexOf("(") == -1;
        },
        Compuator: function (obj, ctl, express) {
            var v = obj.sheet.getDataFieldValue(ctl, express);
            return v.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
        },
        Field: function (express) {
            return express;
        },
        IsFunc: true
    },
    {
        Name: "SUM",
        Accept: function (express) {
            return express.indexOf("SUM(") == 0;
        },
        Compuator: function (obj, ctl, express, round) {
            var field = this.Field(express);
            express = this.Express(express);
            var val = 0;
            $("input[datafield='" + field + "'],span[datafield='" + field + "']").each(function (obj, express, round) {
                var thisValue = 0;
                if (express) {
                    thisValue = obj.executeCompute(this.id, round, express);
                }
                else {
                    if (this.tagName.toLocaleLowerCase() == "input" || this.tagName.toLocaleLowerCase() == "select")
                        thisValue = this.value;
                    else
                        thisValue = this.innerText;
                }
                if ($(this).attr("formatrule")) thisValue = thisValue.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (thisValue && !isNaN(thisValue)) {
                    val += parseFloat(thisValue);
                }
            }, [obj, express, round]);
            return val;
        },
        Field: function (express) {
            var field = $.trim(express).replace("SUM(", "");

            if (field.indexOf(",") > -1) {
                return field.substring(0, field.indexOf(","));
            }
            else {
                return field.substring(0, field.length - 1);
            }
        },
        Express: function (express) {
            if (express.indexOf(",") == -1) return "";
            var str = express.substring(express.indexOf(",") + 1);
            return str.substring(0, str.length - 1);
        },
        IsFunc: true
    },
    {
        Name: "AVG",
        Accept: function (express) {
            return express.indexOf("AVG(") == 0;
        },
        Compuator: function (obj, ctl, express, round) {
            var field = this.Field(express);
            express = this.Express(express);
            var val = 0;
            var ctrls = $("input[datafield='" + field + "'],span[datafield='" + field + "']");
            $("input[datafield='" + field + "'],span[datafield='" + field + "']").each(function (obj, express, round) {
                var thisValue = 0;
                if (express) {
                    thisValue = obj.executeCompute(this.id, round, express);
                }
                else {
                    if (this.tagName.toLocaleLowerCase() == "input" || this.tagName.toLocaleLowerCase() == "select")
                        thisValue = this.value;
                    else
                        thisValue = this.innerText;
                }
                if ($(this).attr("formatrule")) thisValue = thisValue.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (thisValue && !isNaN(thisValue)) {
                    val += parseFloat(thisValue);
                }
            }, [obj, express, round]);
            return parseFloat(val / ctrls.length);
        },
        Field: function (express) {
            var field = $.trim(express).replace("AVG(", "");

            if (field.indexOf(",") > -1) {
                return field.substring(0, field.indexOf(","));
            }
            else {
                return field.substring(0, field.length - 1);
            }
        },
        Express: function (express) {
            if (express.indexOf(",") == -1) return "";
            var str = express.substring(express.indexOf(",") + 1);
            return str.substring(0, str.length - 1);
        },
        IsFunc: true
    },
    {
        Name: "COUNT",
        Accept: function (express) {
            return express.indexOf("COUNT(") == 0;
        },
        Compuator: function (obj, ctl, express, round) {
            var field = this.Field(express);
            var val = 0;
            var ctrls = $("input[datafield='" + field + "'],span[datafield='" + field + "']");
            return ctrls.length;
        },
        Field: function (express) {
            var field = $.trim(express).replace("COUNT(", "");

            if (field.indexOf(",") > -1) {
                return field.substring(0, field.indexOf(","));
            }
            else {
                return field.substring(0, field.length - 1);
            }
        },
        Express: function (express) {
            if (express.indexOf(",") == -1) return "";
            var str = express.substring(express.indexOf(",") + 1);
            return str.substring(0, str.length - 1);
        },
        IsFunc: true
    }
    ,
    {
        Name: "MAX",
        Accept: function (express) {
            return express.indexOf("MAX(") == 0;
        },
        Compuator: function (obj, ctl, express, round) {
            var field = this.Field(express);
            express = this.Express(express);
            var val = 0;
            $("input[datafield='" + field + "'],span[datafield='" + field + "']").each(function (obj, express, round) {
                var thisValue = 0;
                if (express) {
                    thisValue = obj.executeCompute(this.id, round, express);
                }
                else {
                    if (this.tagName.toLocaleLowerCase() == "input" || this.tagName.toLocaleLowerCase() == "select")
                        thisValue = this.value;
                    else
                        thisValue = this.innerText;
                }
                if ($(this).attr("formatrule")) thisValue = thisValue.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (thisValue && !isNaN(thisValue)) {
                    var v = parseFloat(thisValue);

                    if (!val) val = v;
                    else if (v > val) val = v;
                }
            }, [obj, express, round]);
            return val;
        },
        Field: function (express) {
            var field = $.trim(express).replace("MAX(", "");

            if (field.indexOf(",") > -1) {
                return field.substring(0, field.indexOf(","));
            }
            else {
                return field.substring(0, field.length - 1);
            }
        },
        Express: function (express) {
            if (express.indexOf(",") == -1) return "";
            var str = express.substring(express.indexOf(",") + 1);
            return str.substring(0, str.length - 1);
        },
        IsFunc: true
    }
     ,
    {
        Name: "MIN",
        Accept: function (express) {
            return express.indexOf("MIN(") == 0;
        },
        Compuator: function (obj, ctl, express, round) {
            var field = this.Field(express);
            express = this.Express(express);
            var val = 0;
            $("input[datafield='" + field + "'],span[datafield='" + field + "']").each(function (obj, express, round) {
                var thisValue = 0;
                if (express) {
                    thisValue = obj.executeCompute(this.id, round, express);
                }
                else {
                    if (this.tagName.toLocaleLowerCase() == "input" || this.tagName.toLocaleLowerCase() == "select")
                        thisValue = this.value;
                    else
                        thisValue = this.innerText;
                }
                if ($(this).attr("formatrule")) thisValue = thisValue.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (thisValue && !isNaN(thisValue)) {
                    var v = parseFloat(thisValue);

                    if (!val) val = v;
                    else if (v < val) val = v;
                }
            }, [obj, express, round]);
            return val;
        },
        Field: function (express) {
            var field = $.trim(express).replace("MIN(", "");

            if (field.indexOf(",") > -1) {
                return field.substring(0, field.indexOf(","));
            }
            else {
                return field.substring(0, field.length - 1);
            }
        },
        Express: function (express) {
            if (express.indexOf(",") == -1) return "";
            var str = express.substring(express.indexOf(",") + 1);
            return str.substring(0, str.length - 1);
        },
        IsFunc: true
    }
]

Sheet.Computation = function (sheet) {
    this.RegisterEventRules = [];
    this.RegisterEventOnLoad = [];
    this.sheet = sheet;
    this.init(this);
}

/*
computerule,小数点最多允许9位
*/
Sheet.Computation.prototype = {
    init: function (o) {
        $(":input,span,textarea").each(function () {
            var computerule = $.trim($(this).attr("computationrule"));

            if (computerule) {
                var round, express;
                if (computerule.indexOf(",") == 1) {
                    round = o.getRoundFromCompute(computerule);
                    express = o.getExpressFromCompute(computerule);
                }
                else {
                    round = 2;
                    express = computerule;
                }
                o.registerEvent(o, this.id, round, express, express);
                // 设置控件只读
                this.onkeydown = function () { return false; };
                this.onpasete = function () { return false; };
            }
        });
    },
    // 注册计算事件主方法
    registerEvent: function (o, id, round, eventExpress, funcExpress) {
        /*
        o:Computation对象实例
        id:计算规则结果控件ID
        round:结果保留小数位
        eventExpress:计算规则中涉及控件的表达式
        funcExpress:计算规则结果值的计算公式
        */
        // 检查是否已经注册事件
        for (var i = 0; i < o.RegisterEventRules.length; i++) {
            if (o.RegisterEventRules[i].Express == funcExpress
                && o.RegisterEventRules[i].ID == id) return;
        }
        var fieldArray = [];
        if (eventExpress.indexOf(",") > -1) {
            fieldArray.push("");
            fieldArray.push(eventExpress.substring(1, eventExpress.length - 2));
        }
        else {
            fieldArray = eventExpress.split("{");
        }
        var dataField, isfunc;
        var isCount = false;
        for (var i = 1; i < fieldArray.length; i++) {
            dataField = null;
            var index = fieldArray[i].indexOf("}");
            if (index == -1) {
                alert(_Sheet_Computation_GlobalString.Sheet_Computation_Msg0 + eventExpress); return;
            }
            // 获取公式中的数据项名称
            var field = fieldArray[i].substring(0, index);
            for (var j = 0; j < CompuationFun.length; j++) {
                if (CompuationFun[j].Accept(field)) {
                    dataField = CompuationFun[j].Field.call(this, field);
                    isCount = CompuationFun[j].Name == "COUNT";
                    isfunc = CompuationFun[j].IsFunc;

                    if (isCount) {// 开始计算
                        $("#" + id).val(CompuationFun[j].Compuator(this, $("#" + id), field));
                    }
                    break;
                }
            }
            if (!dataField) {
                alert(_Sheet_Computation_GlobalString.Sheet_Computation_Msg0 + dataField); return;
            }

            if (isCount && fieldArray.length == 2) {
                break;
            }

            if (eventExpress.indexOf(",") > -1) {
                var changeField = eventExpress.substring(eventExpress.indexOf(","));
                if (changeField.indexOf("{") > -1 && changeField.indexOf("}") > -1) {
                    changeField = changeField.split("{")[1];
                    changeField = changeField.substring(0, changeField.indexOf("}"));
                }

                var dataFieldObject = $("input[datafield='" + dataField + "'],span[datafield='" + dataField + "'],select[datafield='" + dataField + "'],input[datafield='" + changeField + "'],select[datafield='" + changeField + "']");
            }
            else {
                var dataFieldObject = isfunc ? $("input[datafield='" + dataField + "'],span[datafield='" + dataField + "']")
                                                    : this.sheet.findControlByDataField($("#" + id), dataField);
            }

            // 事件注册
            if (dataFieldObject) {
                var first = true;
                if (isfunc) {// 如果是函数，则注册所有的 DataField 控件
                    dataFieldObject.each(function () {
                        o.registerControlEvent(o, id, round, $(this), funcExpress);
                    });

                    o.registerOnLoadEvent(o, id, round, funcExpress);
                }
                else {// 如果是非函数，则注册最近的 DataField 控件
                    o.registerControlEvent(o, id, round, dataFieldObject, funcExpress);
                }
            }
        }
        o.RegisterEventRules.push({ ID: id, Express: funcExpress });
    },
    // 注册控件的事件
    registerControlEvent: function (o, id, round, dataFieldObject, funcExpress) {
        var newComputerule = dataFieldObject.attr("computationrule");
        if (!newComputerule) {
            dataFieldObject.change(function () {
                o.computator(id, round, funcExpress);
            });
        }
        else {
            // 先注册子函数的事件
            var newEventExpress = o.getExpressFromCompute(newComputerule);
            var newRound = o.getRoundFromCompute(newComputerule);
            o.registerOnLoadEvent(o, dataFieldObject[0].id, newRound, newEventExpress);
            $("input[computationrule='" + newComputerule + "']").each(function () {
                o.registerEvent(o, this.id, newRound, newEventExpress, newEventExpress);
            });
            // 再注册父事件
            o.registerEvent(o, id, round, newEventExpress, funcExpress);
        }
    },
    registerOnLoadEvent: function (o, id, round, funcExpress) {
        for (var i = 0; i < o.RegisterEventOnLoad.length; i++) {
            if (o.RegisterEventOnLoad[i] == id) return;
        }
        // 汇总函数页面加载完成后，执行计算
        if (window.attachEvent) {
            window.attachEvent("onload", function () {
                o.computator(id, round, funcExpress);
            });
        } else if (window.addEventListener) {
            window.addEventListener("load", function () {
                o.computator(id, round, funcExpress);
            }, false);
        }
        o.RegisterEventOnLoad.push(id);
    },
    // 获取计算规则中保留的小数位
    getRoundFromCompute: function (compute) {
        if (compute.indexOf(",") == -1) return 2;
        return parseInt(compute.substring(0, compute.indexOf(",")));
    },
    // 获取计算规则中的函数表达式
    getExpressFromCompute: function (compute) {
        if (compute.indexOf(",") == -1) return compute;
        return compute.substring(compute.indexOf(",") + 1);
    },
    // 获取计算的结果值
    executeCompute: function (id, round, express) {
        var fieldArray = [];
        if (express.indexOf(",") > -1) {
            fieldArray.push("");
            fieldArray.push(express.substring(1, express.length - 1));
        }
        else {
            fieldArray = express.split("{");
        }
        var dataField, isfunc;
        var value = 0;
        var result = fieldArray[0];
        for (var i = 1; i < fieldArray.length; i++) {
            dataField = null;
            var field = null;
            if (express.indexOf(",") > -1) {
                field = fieldArray[i];
            }
            else
                field = fieldArray[i].substring(0, fieldArray[i].indexOf("}"));

            for (var j = 0; j < CompuationFun.length; j++) {
                if (CompuationFun[j].Accept(field)) {
                    //dataField = CompuationFun[j].Field.call(this, field);
                    //isfunc = CompuationFun[j].IsFunc;
                    //if (!isfunc) {// 非函数，计算最近的 ID
                    //    value = this.sheetObj.getDataFieldValue($("#" + id), dataField);
                    //}
                    //else {
                    value = CompuationFun[j].Compuator(this, $("#" + id), field, round);
                    if (express.indexOf(",") > -1) {
                        return value;
                    }
                    if (!value || isNaN(value)) value = "'" + value + "'";
                    // }
                    break;
                }
            }
            result += value.toString();
            result += fieldArray[i].substring(fieldArray[i].indexOf("}") + 1);
        }
        var v = this.sheet.getResultValue(result);
        return v;
    },
    // 执行计算主方法
    computator: function (id, round, express) {
        var v = this.executeCompute(id, round, express);
        // 结果四舍五入取小数位
        if (isFinite(v)) {
            v = Math.round(v * Math.pow(10, round)) / Math.pow(10, round);
            var target = $("#" + id);
            if (target.is("input,textarea")) {
                var oldV = target.val().replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (oldV != v) {
                    target.val(v);
                    target.blur();
                }
            }
            else if (target.is("div,span")) {
                var oldV = target.html().replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                if (oldV != v) {
                    target.html(v);
                    target.blur();
                }
            }
        }
    }
}