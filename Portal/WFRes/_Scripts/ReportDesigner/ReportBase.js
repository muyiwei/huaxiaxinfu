//  枚举
//#region 报表数据源类型
var EnumSorceType = {
    H3System: "H3System",
    DbConnection: "DbConnection"
};
//#endregion

//#region 数据库的数据源类型
var EnumDataSourceType = {
    Table: "Table",
    View: "View",
    SQL: "SQL"
};
//#endregion

//#region 报表数据源的列类型:表列、自定义列头、规则列
var EnumReportSourceColumnType = {
    TableColumn: 0,
    CustomColumn: 1,
    RuleColumn: 2
};
//#endregion

//#region 数据类型：日期、字符、数字
var EnumDataType = {
    Numeric: 0,
    DateTime: 1,
    String: 2
};
//#endregion

//#region 过滤参数类型
var EnumParameterType = {
    /// <summary>
    /// 字符型
    /// </summary>
    String: 0,

    /// <summary>
    /// 数值型
    /// </summary>
    Numeric: 1,

    /// <summary>
    /// 时间型
    /// </summary>
    DateTime: 2,

    /// <summary>
    /// 机构型
    /// </summary>
    Orgnization: 3,

    /// <summary>
    /// 流程编码
    /// </summary>
    WorkflowCode: 4,

    /// <summary>
    /// 系统类型
    /// </summary>
    System: 5,

    /// <summary>
    /// 数字字典
    /// </summary>
    MasterData: 6,

    /// <summary>
    /// 固定值
    /// </summary>
    FixedValue: 7
}

//#endregion

//#region 报表类型:汇总表、交叉分析
var EnumReportType = {
    //汇总表
    Summary: 0,
    //交叉分析
    Cross: 1
};
//#endregion

//#region 汇总方式
var EnumFunctionType = {
    //统计
    Count: 0,
    //汇总
    Sum: 1,
    //平均
    Avg: 2,
    //最小值
    Min: 3,
    //最大值
    Max: 4
}
//#endregion

//#region 图表类型
var EnumChartType = {
    Line: "Line",
    Bar: "Bar",
    Pie: "Pie",
    Area: "Area",
    Radar: "Radar"
};

//#endregion

//#region 坐标维度定义
var AxisDimension = {
    //列标题
    ColumnTitle: 0,
    //行标题
    RowTilte: 1
};
//#endregion

//类定义
//#region 数据源定义，与后台表结构一致
var ReportSourceSetting = function () {
    //是否编辑:true-编辑状态;false-新增状态
    this.IsEdit = false;
    //编码
    this.Code = "";
    //显示名称
    this.DisplayName = "";
    //数据源类型:H3系统或数据库连接
    this.ReportSourceType = EnumSorceType.H3System;
    //数据库连接池编码
    DbCode: "",
    //数据类型:表 、视图、SQL
    this.DataSourceType = EnumDataSourceType.Table;
    //表或可执行脚本
    this.TableNameOrCommandText = "";
    //数据模型编码
    this.SchemaCode = "";
    //列集合
    this.Columns = null;
    //描述
    this.Description = "";
};
//#endregion

//#region列定义
var ReportSourceColumnSetting = function () {
    //编码唯一
    this.ColumnCode = "";
    //表列名
    this.ColumnName = "";
    //显示名称
    this.DisplayName = "";
    //列类型
    this.ReportSourceColumnType = EnumReportSourceColumnType.TableColumn;
    //规则数据
    this.DataRuleText = "";
    //父级编码
    this.ParentColumnCode = null;
    //数据类型
    this.DataType = EnumDataType.String;
    //是否排序字段
    this.IsOrderColumn = false;
    //是否升序
    this.Ascending = false;
    //排序号，报表模板设计时，报表显示列的次序一致
    //ColIndex = 0;
    //汇总方式
    this.FunctionType = EnumFunctionType.Sum;
};
//#endregion

//#region钻取参数
var DrillParam = function () {
    this.Title = "";
    this.Code = "";
    this.Name = "";
};
//#endregion

//#region 报表模板
var ReportTemplateSetting = function () {
    //是否编辑:true-编辑状态;false-新增状态
    this.IsEdit = false;
    this.Code = "";
    this.DisplayName = "";
    this.ReportType = EnumReportType.Summary;
    this.SourceCode = "";
    this.Parameters = null;
    this.Columns = null;
    this.ColumnTitle = null;
    this.ColumnDrillParam = null;
    this.RowTitle = null;
    this.RowDrillParam = null;
    this.DrillCode = "";
    //图表配置
    this.Charts = new Array();
    this.DefaultChart = EnumChartType.Line;
    this.AxisDimension = AxisDimension.ColumnTitle;
    this.AxisUnit = "";
    this.FolderCode = "";
};
//#endregionk

//#region 过滤参数
var ReportTemplateParameterSetting = function () {
    this.ColumnCode = "";
    this.DisplayName = "";
    this.ParameterType = EnumParameterType.String;
    this.ParameterValue = "";
    this.DefaultValue = "";
    this.AllowNull = true;
    this.Visible = true;
};

//过滤参数的值分割标志
var ParameterDelimiter = ";";
//#endregion


//公共函数
//#region 异步取数
function PostAjax(url, parm, callBack) {
    $.ajax({
        url: url,
        dataType: "JSON",
        type: "POST",
        cache: false,
        async: false,//同步执行
        data: parm,
        success: callBack
    });
}
//#endregion

//#region 提示接口

//显示警告
function ShowWarn(txt) {
    $.H3Dialog.Warn({ content: txt });
}
//显示成功
function ShowSuccess(txt) {
    $.H3Dialog.Success({ content: txt });
}
//显示错误
function ShowMultiMsg(txts) {
    var contents = new Array();
    for (var i = 0, j = txts.length; i < j; i++) {
        contents.push({ status: "warn", text: txts[i] });
    }
    $.H3Dialog.AlertMultiMsg({ content: contents });
}

//#endregion

//#region 获取报表枚举类型的字符串
var getParameterType = function (type) {
    for (var key in EnumParameterType) {
        if (EnumParameterType[key] == type)
            return key;
    }
}
//#endregion

//#region 汇总方式
function GetFunctionType(FunctionType) {
    switch (FunctionType) {
        case 0:
        case "0":
            return "count";
            break;
        case 1:
        case "1":
            return "sum";
            break;
        case 2:
        case "2":
            return "avg";
            break;
        case 3:
        case "3":
            return "min";
            break;
        case 4:
        case "4":
            return "max";
            break;
    }
}
//#endregion

//#region 获取过滤参数
var QueryString = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = decodeURI(window.location.search.substr(1)).match(reg);
    if (r != null) return decodeURI(r[2]);//   decodeURIComponent(encodeURIComponent (unescape(r[2])));
    return null;
}
//#endregion

//#region 多语言取数接口
//多语言
function T(LangCode, Text) {
    return $.Lang("ReportTemplate." + LangCode);
}
//#endregion

/*
 对象克隆，不管是对象，还是数组都可用
*/
function ObjectClone(obj) {
    if (obj == null) return;
    var objClone;
    if (obj.constructor == Object
        || obj.constructor == Array) {
        objClone = new obj.constructor();
    }
    else {
        objClone = new obj.constructor(obj.valueOf());
    }
    jQuery.extend(true, objClone, obj);
    return objClone;
}


/*H3 公共提示方法 by CHC*/
jQuery.extend({ H3Dialog: {} });//定义H3Dialog命名控件
jQuery.extend(
    $.H3Dialog,
    {
        ShowDiallog: function (msg, type) {
            switch (type) {
                case "Success":
                case "SUCCESS":
                case "success":
                    this.Success({ content: msg });
                    break;
                case "Warn":
                case "WARN":
                case "warn":
                    this.Warn({ content: msg });
                    break;
                case "Error":
                case "ERROR":
                case "error":
                    this.Error({ content: msg });
                    break;
                default:
                    if (type == null || type == "")
                        type = warn;
                    this.AlertMultiMsg({ content: [{ status: type, text: msg }] });
                    break;
            }
        },
        Success: function (option) {//添加提示成功！默认显示2s后自动关闭
            option = $.extend(false, { title: "H3 温馨提示!", content: "欢迎使用H3 BPM软件！" }, option);
            var H3DialogId = "H3DialogId_" + Guid();// new Date().toISOString().replace(/:|-|\./g, "");
            var H3DialogObj = $("<div id='" + H3DialogId + "' class='h3-dialog h3-dialog-success'></div>");
            var IconObj = $("<div class='h3-dialog-t-icon h3-dialog-t-success'></div>");
            var maxWidth = 400;
            var maxHeight = 300;
            //计算文本宽度
            var preObject = $("<pre>").addClass("h3-dialog-success").hide().html(option.content).appendTo(document.body);
            var contentLength = preObject.width();
            var contentHeight = preObject.height();
            preObject.remove();

            var objWidth = (contentLength < maxWidth ? contentLength : maxWidth) + 50;
            var objHeight = (contentHeight > maxHeight ? maxHeight : contentHeight) + 10;
            H3DialogObj.css("width", objWidth);
            //H3DialogObj.css("height", objHeight);
            H3DialogObj.css("line-height", objHeight + "px");
            H3DialogObj.css("top", $(window).height() - objHeight);
            H3DialogObj.css("left", ($("body").width() - objWidth) / 2);
            IconObj.css("margin-top", 5);

            H3DialogObj.append(IconObj);
            H3DialogObj.append('<span>' + option.content + '</span>');
            $("body").append(H3DialogObj.append(H3DialogObj));

            H3DialogObj.animate({ "top": ($(window).height() - objHeight) / 2 - 100 }, function () {
                $("body").bind("click", function (e) {
                    var e = e ? e : window.event;
                    var tar = e.srcElement || e.target;
                    if (tar != null
                        && tar.id != H3DialogId
                        && tar.offsetParent != null
                        && tar.offsetParent.id != H3DialogId)
                        H3DialogObj.remove();
                });;
            });
        },
        Warn: function (option) {//提示警告!标示可修复错误
            option = $.extend(false, { title: "H3 温馨提示!", content: "欢迎使用H3 BPM软件！" }, option);
            var H3DialogId = "H3DialogId_" + Guid();//new Date().toISOString().replace(/:|-|\./g, "");
            var H3DialogObj = $("<div id='" + H3DialogId + "' class='h3-dialog h3-dialog-warn'></div>");
            var IconObj = $("<div class='h3-dialog-t-icon h3-dialog-t-warn'></div>");
            var maxWidth = 400;
            var maxHeight = 300;
            //计算文本宽度
            var preObject = $("<pre>").addClass("h3-dialog-warn").hide().html(option.content).appendTo(document.body);
            var contentLength = preObject.width();
            var contentHeight = preObject.height();
            preObject.remove();

            var objWidth = (contentLength < maxWidth ? contentLength : maxWidth) + 50;
            var objHeight = (contentHeight > maxHeight ? maxHeight : contentHeight) + 10;
            H3DialogObj.css("width", objWidth);
            //H3DialogObj.css("height", objHeight);
            H3DialogObj.css("line-height", objHeight + "px");
            H3DialogObj.css("top", $(window).height() - objHeight);
            H3DialogObj.css("left", ($("body").width() - objWidth) / 2);
            IconObj.css("margin-top", 5);

            H3DialogObj.append(IconObj);
            H3DialogObj.append('<span>' + option.content + '</span>');
            $("body").append(H3DialogObj);

            H3DialogObj.animate({ "top": ($(window).height() - objHeight) / 2 - 100 }, function () {
                $("body").bind("click", function (e) {
                    var e = e ? e : window.event;
                    var tar = e.srcElement || e.target;
                    if (tar != null
                        && tar.id != H3DialogId
                        && tar.offsetParent != null
                        && tar.offsetParent.id != H3DialogId)
                        H3DialogObj.remove();
                });
            });
        },
        Error: function (option) {//提示错误！标示不可修复的错误
            option = $.extend(false, { title: "H3 温馨提示!", content: "欢迎使用H3 BPM软件！" }, option);
            var H3DialogId = "H3DialogId_" + Guid();// new Date().toISOString().replace(/:|-|\./g, "");
            var H3DialogObj = $("<div id='" + H3DialogId + "' class='h3-dialog h3-dialog-error'></div>");
            var IconObj = $("<div class='h3-dialog-t-icon h3-dialog-t-error'></div>");
            var maxWidth = 400;
            var maxHeight = 300;
            //计算文本宽度
            var preObject = $("<pre>").addClass("h3-dialog-error").hide().html(option.content).appendTo(document.body);
            var contentLength = preObject.width();
            var contentHeight = preObject.height();
            preObject.remove();

            var objWidth = (contentLength < maxWidth ? contentLength : maxWidth) + 50;
            var objHeight = (contentHeight > maxHeight ? maxHeight : contentHeight) + 10;
            H3DialogObj.css("width", objWidth);
            // H3DialogObj.css("height", objHeight);
            H3DialogObj.css("line-height", objHeight + "px");
            H3DialogObj.css("top", $(window).height() - objHeight);
            H3DialogObj.css("left", ($("body").width() - objWidth) / 2);
            IconObj.css("margin-top", 5);

            H3DialogObj.append(IconObj);
            H3DialogObj.append('<span>' + option.content + '</span>');
            $("body").append(H3DialogObj);

            H3DialogObj.animate({ "top": ($(window).height() - objHeight) / 2 - 100 }, function () {
                $("body").bind("click", function (e) {
                    var e = e ? e : window.event;
                    var tar = e.srcElement || e.target;
                    if (tar != null
                        && tar.id != H3DialogId
                        && tar.offsetParent != null
                        && tar.offsetParent.id != H3DialogId)
                        H3DialogObj.remove();
                });;
            });
        },
        AlertMultiMsg: function (option) {
            /*参数：{title:"",content:[{status:"success", text:"成功"},{status:"warn", text:"警告"},{status:"error", text:"错误"}]}*/
            var defaults = {
                title: "H3 温馨提示!",
                content: [{ status: "success", text: "成功" },
                        { status: "warn", text: "警告" },
                        { status: "error", text: "错误" }]
            };
            option = $.extend(false, defaults, option);
            var H3DialogId = "H3DialogId_" + Guid();
            var H3DialogObj = $("<div id='" + H3DialogId + "' class='h3-dialog h3-dialog-MutilMsg'></div>");
            var maxWidth = 800;
            var minWidth = 300;
            var contentLength = 0;

            for (var i = 0, j = option.content.length; i < j; i++) {
                var rowObj = $("<div class='h3-dialog-" + option.content[i].status + "' style='width:100%;clear: both;float: none;border: none;padding-top:5px;padding-bottom:5px;margin-top:2px;margin-bottom:2px'></div>");
                var IconObj = $("<div class='h3-dialog-t-icon h3-dialog-t-" + option.content[i].status + "'></div>");
                //计算文本宽度
                var preObject = $("<pre>").addClass("h3-dialog-" + option.content[i].status).hide().html(option.content[i].text).appendTo(document.body);
                contentLength = contentLength < preObject.width() ? preObject.width() : contentLength;
                //rowObj.css("height", preObject.height() + 10);
                //rowObj.css("line-height", (preObject.height() + 10) + "px");
                preObject.remove();
                IconObj.css("padding", "2px");
                rowObj.append(IconObj);
                rowObj.append('<span>' + option.content[i].text + '</span>');
                H3DialogObj.append(rowObj);
            }
            contentLength = (contentLength < maxWidth ? (contentLength < minWidth ? minWidth : contentLength) : maxWidth) + 30;
            H3DialogObj.css("width", contentLength);
            H3DialogObj.css("top", $(window).height() - H3DialogObj.height());
            H3DialogObj.css("left", ($("body").width() - H3DialogObj.width()) / 2);
            $("body").append(H3DialogObj);
            H3DialogObj.animate({ "top": ($(window).height() - H3DialogObj.height()) / 2 - 100 }, function () {
                $("body").bind("click", function (e) {
                    var e = e ? e : window.event;
                    var tar = e.srcElement || e.target;
                    if (tar != null
                        && tar.id != H3DialogId
                        && tar.offsetParent != null
                        && tar.offsetParent.id != H3DialogId)
                        H3DialogObj.remove();
                });;
            });
        }
    }
    );


//Guid类
Guid = function () {
    var getStr = function (len) {
        if (len > 12) len = 12;
        return Math.floor(Math.random() * 100000000000000).toString("16").substring(0, len);
    };
    return getStr(8) + "-" + getStr(4) + "-4" + getStr(3) + "-" + getStr(4) + "-" + getStr(12);
}