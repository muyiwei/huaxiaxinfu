var ParticipantType = {
    BizProperty: "bizproperty",
    Organization: "organization",
    Tag: "tag",
    Function: "function",
    Constant: "constant"
};

var FunctionName = {
    //ManagerOf: "ManagerOf",
    //RecursiveManagersOf: "RecursiveManagersOf",
    //SearchRole: "SearchRole",
    //GetRolesFunction: "GetRoles"
    ManagerOf: "MANAGEROF",
    RecursiveManagersOf: "RECURSIVEMANAGERSOF",
    SearchRole: "SEARCHROLE",
    ManagerByLevel: "MANAGERBYLEVEL"
    //GetRolesFunction: "GETROLES"
};

//编辑器模式
var EditeMode = {
    Participant: "Participant",
    Route: "Route"
}

//组织机构匹配
var Pattern = new RegExp("U\\((.| )+?\\)", "igm");

//初始化值
function InitFormula(formula) {
    var _Formula = formula;
    if (_Formula) {
        var unitIds = _Formula.match(Pattern);
        if (unitIds != null && unitIds.length > 0) {
            //有组织机构，需要从后台读取组织机构数据
            $.ajax({
                type: "POST",
                url: Action_Url,
                data: { ActionName: Action_LoadNamesByUnitIds, UnitIds: JSON.stringify(unitIds) },
                dataType: "json",
                success: function (data) {
                    InitFormulaItmes(_Formula, data);
                }
            });
        }
        else {
            InitFormulaItmes(_Formula);
        }
    }
}

function InitFormulaItmes(_formula, units) {
    var items = _formula.split("+");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var displayName = "";
        var iClass = "";
        var participantType
        if (item.indexOf("{") == 0) {
            //数据项
            $("#item-propertys").find("a[data-value='" + item + "']").click();
            participantType = ParticipantType.BizProperty;
            continue;
        }
        else if (item.toLowerCase().indexOf("u(") == 0) {
            //组织机构
            if (units == null || units[item] == null) continue;
            var unit = units[item];
            displayName = unit.Name;
            participantType = ParticipantType.Organization;
            if (unit.UnitType.toString() == UnitType.Company) {
                iClass = "fa-sitemap";
            }
            else if (unit.UnitType.toString() == UnitType.OrganizationUnit) {
                iClass = "fa-users";
            }
            else if (unit.UnitType.toString() == UnitType.User) {
                iClass = "fa-user";
            }
            else {
                participantType = ParticipantType.Role;
                iClass = "fa-tag";
            }
        }
        else {
            //函数
            //只有一个括号，里面是逗号分开的参数
            var paramStr = item.substring(item.indexOf("(") + 1, item.length - 1);
            var params = paramStr.split(',');
            //读取函数名
            displayName = item.substring(0, item.indexOf("(") + 1);
            participantType = item.replace(paramStr, "");
            for (var j = 0; j < params.length; j++) {
                var p = params[j];
                if (p.indexOf("{") == 0) {
                    displayName += $("#item-propertys").find("a[data-value='" + p + "']").text().trim();
                }
                else if (p.toLowerCase().indexOf("u(") == 0) {
                    if (units != null && units[p] != null) {
                        displayName += units[p].Name;
                    }
                }
                else {
                    displayName += p;
                }

                if (j < params.length - 1) {
                    displayName += ",";
                }
            }
            displayName += ")";
            iClass = "fa-facebook-square";
        }

        var $li = $("<li>").attr("data-type", participantType).attr("data-value", item);
        $li.append("<i class='fa " + iClass + "'></i>");
        $li.append(" " + displayName);
        $li.append("<i class=\"glyphicon glyphicon-remove\" onclick='RemoveLi(this)'></i>");
        $("#participantPanel").append($li);
    }
}

//绑定点击事件
function BindBtn_Click() {
    $(".cancel").click(Cancle_Click);
    $(".confirm").click(Confirm_Click);
}

//取消事件
function Cancle_Click() {
    if ($("#functionSelector").is(":visible")) {
        CloseFunctionSlector();
    }
    else {
        //if (window.parent && window.parent.H3DialogManger && window.parent.H3DialogManger.Cancel)
        //    window.parent.H3DialogManger.Cancel();
        if (window.parent && window.parent.FormulaEditableStack && window.parent.FormulaEditableStack.ShowModal) {
            window.parent.FormulaEditableStack.ShowModal.hide();
        }
    }
}

//确定事件
function Confirm_Click() {
    if ($("#functionSelector").is(":visible")) {
        AddFunctionItem();
    }
    else {
        //这里返回参与者
        SaveFormula();
    }
}

//保存公式
var SaveFormula = function () {
    var expression = "";
    var txt = "";

    var $lis = $("#participantPanel").children("li");
    for (var i = 0; i < $lis.length; i++) {
        expression += $($lis[i]).attr("data-value");
        txt += $($lis[i]).text().trim();
        if (i < $lis.length - 1) {
            expression += "+";
            txt += "+";
        }
    }

    if (Validate(expression)) {
        window.parent.FormulaEditableStack.SaveValue(expression, txt);
    }
}

//加载树
function TreeLoad() {
    //左侧树点击事件
    $(".h3-tree ul li i.fa-plus-square-o, .h3-tree ul li i.fa-minus-square-o").click(function () {
        TreeNode_Click(this);
    });
}

//树节点点击
function TreeNode_Click(el) {
    if ($(el).hasClass("fa-plus-square-o")) {
        $(el).removeClass("fa-plus-square-o").addClass("fa-minus-square-o");
        if ($(el).nextAll("ul").length > 0) {
            $(el).nextAll("ul").show();
        }
        else if ($(el).attr("data-type") == ParticipantType.Organization && $(el).attr("data-value")) {
            //组织机构没有子菜单，需要加载一次
            LoadOrganization($(el).closest("li"), $(el).attr("data-value"));
            $(el).removeAttr("data-type");//去掉后，下次不会再加载
            $(el).removeAttr("data-value");
        }
    }
    else if ($(el).hasClass("fa-minus-square-o")) {
        $(el).removeClass("fa-minus-square-o").addClass("fa-plus-square-o");
        $(el).nextAll("ul").hide();
    }
}

//加载组织机构
function LoadOrganization($parentEl, parentId) {
    $.ajax({
        type: "POST",
        url: Action_Url,
        data: { ActionName: Action_LoadOrganization, ParentId: parentId },
        dataType: "json",
        success: function (data) {
            $ul = $("<ul>");
            for (var key in data) {
                $li = $("<li>");
                $a = $("<a href='javascript:void(0)' onclick='InsertParticipant(this)' data-type='organization' data-value='" + data[key].UnitId + "'>");
                if (data[key].UnitType.toString() == UnitType.OrganizationUnit) {
                    $li.append(" <i onclick='TreeNode_Click(this)' class='fa fa-plus-square-o' data-type='organization' data-value='" + data[key].UnitId + "'></i>");
                    $a.append(" <i class='fa fa-users'></i>")
                }
                else {
                    $a.append(" <i class='fa fa-user'></i>")
                }
                $a.append(" " + data[key].Name);
                $ul.append($li.append($a));
            }
            $parentEl.append($ul);
        }
    });
}

//移除Li元素
function RemoveLi($el) {
    $($el).closest("li").remove();
}

function InsertParticipant(el) {
    $el = $(el);
    var participantType = $el.attr("data-type");
    switch (participantType) {
        case ParticipantType.BizProperty:
        case ParticipantType.Organization:
        case ParticipantType.Tag:
            //之间添加参与者
            AddParticipantItem($el);
            break;
        case ParticipantType.Function:
            //显示函数选择器
            var value = $el.attr("data-value");
            for (var i = 0; i < ParticipantFunctions.length; i++) {
                var fun = ParticipantFunctions[i];
                if (fun.FunctionName == value) {
                    ShowFunctionSelector(fun);
                    break;
                }
            }
            break;
        case ParticipantType.Constant:
            if ($el.attr("data-value").trim() == "inputconstant") {
                InputConstant();
            }
            else {
                AddParticipantItem($el);
            }
            break;
    }
}

//输入
function InputConstant() {
    var $input = $("#ParticipantSelector").data("targetinput");
    $input.removeAttr("readonly");
    $input.val("");
    $input.focus();
    $(".confirm").show();
}

//添加组织机构、数据线、标签 -- 参与者项
function AddParticipantItem($el) {
    var participantType = $el.attr("data-type");
    var value = $el.attr("data-value").trim();
    var displayName = $el.text().trim();

    if ($("#functionSelector").is(":visible")) {
        if (participantType == ParticipantType.Tag) {
            $("#txt-funitem-tag").val(displayName);
            $("#txt-funitem-tag").attr("data-value", value);
        }
        else {
            $("#txt-funitem-unit").val(displayName);
            $("#txt-funitem-unit").attr("data-value", value);
        }
    }
    else {
        if ($("#participantPanel").find("li[data-type='" + participantType + "'][data-value='" + value + "']").length > 0) {
            //已经添加
            return;
        }

        var $li = $("<li>").attr("data-type", participantType).attr("data-value", value);
        $li.append($el.find("i").clone());
        $li.append(" " + displayName);
        $li.append("<i class=\"glyphicon glyphicon-remove\" onclick='RemoveLi(this)'></i>");
        $("#participantPanel").append($li);
    }
}

//添加函数 -- 参与者项
function AddFunctionItem() {
    var funItem = $("#functionSelector").data("funItem");

    var unitValue = $("#txt-funitem-unit").attr("data-value");
    if (unitValue == null || unitValue == "") {
        if (funItem.FunctionName == FunctionName.ManagerOf)
            $.IShowWarn("请选择指定组织");
        else
            $.IShowWarn("请选择指定角色");
        return;
    }
    var functionItem = funItem.FunctionName;
    var displayText = funItem.FunctionName;
    switch (functionItem) {
        case FunctionName.ManagerOf:
            //case FunctionName.GetRolesFunction:
            functionItem += "(" + unitValue + ")";
            displayText += "(" + $("#txt-funitem-unit").val() + ")";
            break;
        case FunctionName.ManagerByLevel:
        case FunctionName.RecursiveManagersOf:
            var levelValue = $("#txt-funitem-level").val();
            if (levelValue == "" || isNaN(levelValue)) {
                $.IShowWarn("层级数需要输入正确的数字");
                return;
            }
            functionItem += "(" + unitValue + "," + levelValue + ")";
            displayText += "(" + $("#txt-funitem-unit").val() + "," + levelValue + ")";
            break;

        case FunctionName.SearchRole:
            var tagValue = $("#txt-funitem-tag").attr("data-value");
            if (tagValue == null || tagValue == "") {
                $.IShowWarn("请选择标签");
                return;
            }
            functionItem += "(" + unitValue + "," + tagValue + ")";
            displayText += "(" + $("#txt-funitem-unit").val() + "," + $("#txt-funitem-tag").val() + ")";
            break;
    }

    AddFunctionItemLi(functionItem, displayText);

    CloseFunctionSlector();
}

function AddFunctionItemLi(value, text) {
    if ($("#participantPanel").find("li[data-type='" + ParticipantType.Function + "'][data-value='" + value + "']").length == 0) {
        var $li = $("<li>").attr("data-type", ParticipantType.Function).attr("data-value", value);
        $li.append("<i class='fa fa-facebook-square'></i>");
        $li.append(" " + text);
        $li.append("<i class=\"glyphicon glyphicon-remove\" onclick='RemoveLi(this)'></i>");
        $("#participantPanel").append($li);
    }
}

//关闭函数选择器
function CloseFunctionSlector() {
    //按钮
    $(".cancel").text("取消");
    $(".confirm").text("确定");

    $("#item-propertys").show();
    $("#item-company").show();
    $("#item-tags").show();
    $("#item-functions").show();
    $("#item-Constant").show();


    $("#item-propertys").find("a[data-valuetype!=\"Unit\"]").parent().show();

    $("#functionSelector").animate({ left: -$("#functionSelector").width() }, "slow", function () {
        $("#functionSelector").hide();
    });

    $("#functionSelector").next("div.col").animate({ left: "0px" }, "slow", function () {
        if (PageMode == EditeMode.Participant) {
            $(this).removeClass("floatCol");
            $("#participantPanel").closest("div.col").show();
        }
        //else {
        //    $(".confirm").hide();
        //}
    });
}

//显示函数选择器
function ShowFunctionSelector(funItem) {
    var helper = funItem.Helper;

    //按钮
    $(".cancel").text("取消添加函数");
    $(".confirm").show().text("确定添加函数");
    //函数名称
    $("#funitem-funname").text(/*helper.Name*/helper.DisplayName);
    //只显示选人
    $("#item-propertys").find("li:has(a[data-valuetype!=\"Unit\"])").hide();
    //常量隐藏
    $("#item-Constant").hide();
    //左侧选择的显示隐藏控制
    $("#item-functions").hide();
    switch (funItem.FunctionName) {
        case FunctionName.ManagerOf:
            //case FunctionName.GetRolesFunction:
            $("#item-tags").hide();

            $("#txt-funitem-unit").closest("div.form-group").show();
            $("#txt-funitem-level").closest("div.form-group").hide();
            $("#txt-funitem-tag").closest("div.form-group").hide();

            $("#txt-funitem-unit").closest("div.form-group").find("label").text('组织或人员');
            $("#txt-funitem-unit").removeAttr("data-value").val("").attr("placeholder", '组织或人员');
            break;
        case FunctionName.ManagerByLevel:
        case FunctionName.RecursiveManagersOf:
            $("#item-tags").hide();

            $("#txt-funitem-unit").closest("div.form-group").show();
            $("#txt-funitem-level").closest("div.form-group").show();
            $("#txt-funitem-tag").closest("div.form-group").hide();

            $("#txt-funitem-unit").closest("div.form-group").find("label").text('组织或人员');
            $("#txt-funitem-unit").removeAttr("data-value").val("").attr("placeholder", '组织或人员');

            $("#txt-funitem-level").closest("div.form-group").find("label").text('部门所在层级数');
            $("#txt-funitem-level").removeAttr("data-value").val("").attr("placeholder", '部门所在层级数');
            break;
        case FunctionName.SearchRole:
            $("#txt-funitem-unit").closest("div.form-group").show();
            $("#txt-funitem-level").closest("div.form-group").hide();
            $("#txt-funitem-tag").closest("div.form-group").show();

            $("#txt-funitem-unit").closest("div.form-group").find("label").text('组织或人员');
            $("#txt-funitem-unit").removeAttr("data-value").val("").attr("placeholder", '组织或人员');

            $("#txt-funitem-tag").closest("div.form-group").find("label").text('角色');
            $("#txt-funitem-tag").removeAttr("data-value").val("").attr("placeholder", '角色');
            break;
    }

    //右侧滑出
    $("#functionSelector").data("funItem", funItem).show().animate({ left: "0px" }, "slow");
    $("#functionSelector").next("div.col").addClass("floatCol").show().css("left", "0px").animate({ left: $("#functionSelector").width() }, "slow", function () {
        //if (PageMode == EditeMode.Route) {
        //    $(this).addClass("col-sm-6");
        //}
    });
    $("#participantPanel").closest("div.col").hide();
}

function Validate(_Expression) {
    //空,直接通过
    if (!_Expression || _Expression.length == 0) {
        return true;
    }
    //将"xxx"替换为""进行检验
    _Expression = _Expression.replace(/"[^"]+"/g, "\"\"");

    //暂时禁用,测试后台验证
    //验证 ""
    if (_Expression.match(/"/g) && _Expression.match(/"/g).length % 2 == 1) {
        var _e = _Expression;
        _e = _e.replace(/"[^"]+"/g, "\"\"");
        if (_e.match(/"/g) && _e.match(/"/g).length % 2 == 1) {
            window.parent.$.H3Dialog.AlertMultiMsg({ content: [{ status: "error", text: _Formula_GlobalString.Formula_NoClosed + "\"" }] });
            return;
        }
    }

    //验证()
    if (_Expression.match(/\(/g) || _Expression.match(/\)/g)) {
        var _LeftCount = 0;
        if (_Expression.match(/\(/)) {
            _LeftCount = _Expression.match(/\(/g).length;
        }
        var _RightCount = 0;
        if (_Expression.match(/\)/)) {
            _RightCount = _Expression.match(/\)/g).length;
        }
        if (_LeftCount > _RightCount) {
            top.$.IShowWarn("存在未关闭的(");
            return;
        }
        else if (_LeftCount < _RightCount) {
            window.parent.$.H3Dialog.AlertMultiMsg({ content: [{ status: "error", text: "存在多余的)" }] });
            top.$.IShowWarn("存在多余的)");
            return;
        }
    }
    //验证{}
    if (_Expression.match(/\{/g) || _Expression.match(/\}/g)) {
        var _LeftCount = 0;
        if (_Expression.match(/\{/)) {
            _LeftCount = _Expression.match(/\{/g).length;
        }
        var _RightCount = 0;
        if (_Expression.match(/\}/)) {
            _RightCount = _Expression.match(/\}/g).length;
        }
        if (_LeftCount > _RightCount) {
            top.$.IShowWarn("存在未关闭的{");
            return;
        }
        else if (_LeftCount < _RightCount) {
            top.$.IShowWarn("存在多余的}");
            return;
        }
    }
    //验证是否存在空{}
    if (_Expression.match(/{}/g)) {
        top.$.IShowWarn("存在空变量表达式{}");
        return;
    }
    var _Valid = false;
    var _Errors = [];
    //服务器检验
    $.ajax({
        type: "POST",
        url: Action_Url,
        cache: false,
        async: false,
        dataType: "json",
        data: {
            ActionName: Action_Validate,
            Formula: _Expression,
            SchemaCode: SchemaCode
        },
        success: function (result) {
            if (result == "LoginFaild") {
                //跳转到登录
                top.location.href = window.location.href;
                return;
            }
            if (result.Result) {
                _Valid = true;
            }
            else {
                _Errors = result.Errors;
            }
        },
        error: function (msg) {

        }
    });

    if (_Valid) {
        return true;
    }
    else if (window.parent && window.parent.$ && window.parent.$.H3Dialog && window.parent.$.H3Dialog.AlertMultiMsg) {
        var _Content = [];
        if (!_Errors || _Errors.length == 0) {
            _Content.push({ status: "error", text: "检验失败" });
        }
        else {
            $(_Errors).each(function (index) {
                _Content.push({ status: "error", text: this });
            });
        }
        for (var i = 0; i < _Content.length; i++) {
            top.$.IShowWarn(_Content[i].text);
        }
    }
}