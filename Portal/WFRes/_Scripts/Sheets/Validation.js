var validObject = [
    {// 验证控件不可以为空
        "name": "requiredfield",
        "func": function (value) { return $.trim(value) != ""; },
        "save": false,
        "init": true,
        "allowNull": false,
        "zh": "*",
        "en": "*"
    },
    {// 验证是否为整数(包含正负数)
        "name": "integer",
        "func": function (value) { return /^(-|\+)?(\d)*$/.test(value); },
        "save": true,
        "init": false,
        "allowNull": false,
        "zh": "请输入一个整数.",
        "en": "Please enter a valid digits."
    },
    {// 验证是否为数字
        "name": "number",
        "func": function (value) { return /^[\+\-]?\d*?\.?\d*?$/.test(value); },
        "save": true,
        "init": false,
        "allowNull": false,
        "zh": "请输入一个数字.",
        "en": "Please enter a valid number."
    },
    {// 验证是否为Email
        "name": "email",
        "func": function (value) { return /^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\w+)*$/.test(value); },
        "save": false,
        "init": false,
        "allowNull": true,
        "zh": "请输入一个有效的邮箱地址.",
        "en": "Please enter a valid email address."
    },
    {// 验证身份证
        "name": "card",
        "func": function (value) { return /^\d{15}(\d{2}[A-Za-z0-9])?$/.test(value); },
        "save": false,
        "init": false,
        "allowNull": true,
        "zh": "请输入一个有效的身份证.",
        "en": "Please enter a valid email credit card number."
    },
    {// 验证身份证
        "name": "mobile",
        "func": function (value) { return /^((\(\d{3}\))|(\d{3}\-))?13\d{9}$/.test(value); },
        "save": false,
        "init": false,
        "allowNull": true,
        "zh": "请输入一个有效的手机号码.",
        "en": "Please enter a valid mobile."
    },
    {// 验证时间段  HH:mm:ss
        "name": "timespan",
        "func": function (value) {
            if (value.indexOf(".") == -1)
                return /^((20|21|22|23|[0-1]\d)\:[0-5][0-9])(\:[0-5][0-9])?$/.test(value);
            else {
                var arr = value.split(".");
                return /^(\d)*$/.test(arr[0]) && /^((20|21|22|23|[0-1]\d)\:[0-5][0-9])(\:[0-5][0-9])?$/.test(arr[1]);
            }
        },
        "save": false,
        "init": false,
        "allowNull": false,
        "zh": "请输入一个有效的时间段.",
        "en": "Please enter a valid timespan."
    },
    {// 验证电话号码
        "name": "phone",
        "func": function (value) { return /^0\d{2,3}-?\d{7,8}$/.test(value); },
        "save": false,
        "init": false,
        "allowNull": true,
        "zh": "请输入一个有效的电话号码.",
        "en": "Please enter a valid phone."
    }
];

if (typeof (pageInfo) == undefined) {
    pageInfo = {};
};

var vidiator = {
    paretntClass: "divContent",
    errorMessageClass: "error",
    inputMouseEnter: "inputMouseEnter",  // 鼠标点击后样式
    inputMouseMove: "inputMouseMove",    // 鼠标移到控件时样式
    inputMouseOut: "inputMouseOut",      // 鼠标移除时样式
    inputError: "inputError",            // 验证错误时显示样式
    validErrorZH: "请将表单输入完整.",
    validErrorEN: "Please complete the form input.",
    requiredArrary: [],
    validateArrary: [],
    isMobile: undefined,
    arrayIndexOf: function (arr, v) {
        for (var i = arr.length - 1; i > -1; i--) {
            if (arr[i] == v) return true;
        }
        return false;
    },
    getElementValue: function (element) {
        if (element.type == "radio") {
            return $("input:checked[name='" + element.name + "']").length == 0 ? "" : "1";
        }
        else if (element.type == "select-one") {
            if (element.selectedIndex == -1) return "";
            return element.options[element.selectedIndex].value;
        }
        else if (element.type == "checkbox") {
            var n = element.name.substring(0, element.name.lastIndexOf("$"));
            return $("input:checked[name^='" + n + "']").length == 0 ? "" : "1";
        }
        else if (element.type == "textarea"
            && element.style.display == "none"
            && typeof (CKEDITOR) != "undefined"
            && CKEDITOR != null
            && CKEDITOR.instances[element.id] != null) {
            return CKEDITOR.instances[element.id].getData().replace("<br>", "");
        }
        else {
            return $.trim(element.value);
        }
    },
    getElementId: function (element) {
        if (element.type == "radio") {
            return element.name;
        }
        else if (element.type == "select-one") {
            return element.id;
        }
        else if (element.type == "checkbox") {
            return element.name.substring(0, element.name.lastIndexOf("$"));
        }
        else { // text 和 textarea
            return element.id;
        }
    },
    valideRegularExpression: function (element, val) { // 验证用户自定义表达式
        var regularexpression = $(element).attr("regularexpression");
        if (!regularexpression) return true;
        if (!eval(regularexpression).test(val)) {
            return false;
        }
        return true;
    },
    // 验证单个控件元素
    validateElement: function (element, isSave, isInit, isKeyEvent) {
        //移动参与者控件
        if ($(element).is("[data-type='user-selector']")) {
            var userValid = true;
            if ($(element).is("[Required=Required]")) {
                var users = $(element).find("input[data-target=UserIDs]").val();
                if (!users || users == "[]") {
                    userValid = false;
                }
            }

            if (userValid) {
                $(element).closest(".form-group").removeClass("error");
            }
            else {
                $(element).closest(".form-group").addClass("error");
            }
            return userValid;
        }

        var lang = "";
        if (element.type == "hidden" || element.type == "checkbox") return true;

        // 获取当前控件的值
        val = vidiator.getElementValue(element);
        if ($(element).attr("formatrule")) val = val.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");

        var regulareElement = element;
        // 获取系统默认验证规则
        if ($(element).attr("lang") != null) {
            lang = $(element).attr("lang");
            regulareElement = element;
        }
        if ($(element).parent().attr("lang")) {
            lang += "," + $(element).parent().attr("lang");
            regulareElement = $(element).parent()[0];
        }
        var message = "";
        var result = true;
        var k = this.getElementId(element);

        // 开始验证系统默认表达式
        if ($.trim(lang).replace(/,/g, "")) {
            if (isKeyEvent || !this.arrayIndexOf(this.validateArrary, k)) {
                $.each(validObject, function (index, v) {
                    if (isSave && !v.save) return true; // 是保存并且当前验证控件在保存时不做验证
                    if (isInit && !v.init) return true; // 初始化验证时，不适合初始化验证的方法返回
                    if (lang.indexOf(v.name) > -1) {
                        // 当为空时也表示认证通过
                        if ((val == "" || val == undefined || val == null) && v.allowNull) return true;
                        if (!v.func.call(this, val)) {              // 验证系统默认提供的表达式
                            result = false;
                            message += typeof (language) == "undefined" || language == "zh" ? v.zh : v.en;
                        }
                    }
                });
            }
        }

        // 开始验证用户自定义表达式
        if (!isInit && val && !this.valideRegularExpression(element, val)) {
            result = false;
            var regularexpressiontext = $(element).attr("regularexpressiontext");
            if (regularexpressiontext) message += regularexpressiontext;
        }

        if (vidiator.isMobile) {
            $(element).next(".error").remove();
            if (result) {
                // 控件验证成功，设置失败样式
                $(element).removeClass("error");
                $(element).trigger("MobileValidateSuccess");
            }
            else {
                //设置验证失败样式
                $(element).addClass("error");
                $(element).after("<label for=\"" + k + "\" class=\"error\">" + message + "</label>");
                $(element).trigger("MobileValidateFaild");
            }
            return result;
        }

        if (!result && !isInit) { // 注释该行，是否在验证不通过时改变输入框样式
            // if (!isInit) $(element).attr("class", vidiator.inputError);
        }
        else {
            if (!isInit) $(element).attr("class", vidiator.inputMouseOut);
        }

        if ($("label[for='" + k + "']").length > 0) {
            if (result) {
                $("label[for='" + k + "']").html("");
            }
            else {
                $("label[for='" + k + "']").html(message);
            }
        }
        else {
            if (!result) {
                this.insertMessage(regulareElement, "<label for=\"" + k + "\" class=\"error\">" + message + "</label>", k);
            }
        }

        if (!isInit) {
            if (result) {
                // 控件验证成功，设置失败样式
                $(element).attr("class", vidiator.inputMouseOut);
            }
            else {
                // 设置验证失败样式
                $(element).attr("class", vidiator.inputError);
            }
        }

        this.validateArrary.push(k);
        return result;
    },
    insertMessage: function (element, message, k) {
        if (element.type == "radio") {
            $(message).appendTo($("input:last[name='" + k + "']").parent());
        }
        else if (element.type == "select-one") {
            $(message).insertAfter($(element));
        }
        else if (element.type == "checkbox") {
            $(message).appendTo($("input:last[name^='" + k + "']").parent());
        }
        else { // text 和 textarea
            $(message).insertAfter($(element));
        }
    },
    validatorContainer: function () {
        if ($("." + vidiator.paretntClass).length > 0) return $("." + vidiator.paretntClass);
        else return $(".MobileStyle");
    },
    getElements: function () {
        if (vidiator.isMobile) {
            var elements = $("input[type=text][lang], select[lang], textarea[lang]");
            //添加移动参与者控件
            elements = elements.add($("[data-type='user-selector'][Required=Required]"));

            return elements;
        }
        else {
            var content = $("." + vidiator.paretntClass);
            if (content.length == 0) content = $("#content-wrapper");
            return $(content).find("input[type=text], select, textarea").not(":submit, :reset, :image, [disabled], :hidden");
        }
    },
    initValiate: function () {
        this.isMobile = typeof (IsMobile) != "undefined" && IsMobile;
        // 加载完成后，初始化方法
        var elements = this.getElements();
        vidiator.validateArrary.length = 0;
        // 给所有的必填项增加 * 号
        $.each(elements, function (index, obj) {
            if (vidiator.isMobile) {
                $(obj).change(function () {
                    vidiator.validateElement(this, false, false, true);
                })
            }
            else {
                $(obj).keyup(function () {
                    // vidiator.validateElement(this, false, false, true);
                }).click(function () {
                    $(this).attr("class", validation.inputMouseEnter);
                }).change(function () {
                    vidiator.validateElement(this, false, false, true);
                })
                .attr("class", validation.inputMouseOut);
            }
            vidiator.validateElement(obj, false, true);
        });
    }
    // -----------------------------------------------------------------------
};

// 表单验证
// 0:不做任何验证；1:只做数据有效性验证；2:做所有验证；
function validation(eventType) {
    var result = true;
    // 保存时不做必填验证
    if (typeof (eventType) == "undefined") eventType = "2";
    if (eventType != "2") return true; // 只有提交才做验证

    this.elements = vidiator.getElements();
    var first = true;
    var result = true;
    vidiator.validateArrary.length = 0;

    $.each(this.elements, function (index, obj) {
        if (!vidiator.validateElement(obj, eventType == "1", false)) result = false;
        if (!result && first) {
            first = false;
            obj.focus();

            $(obj).trigger("ValidateFalse");
        }
    });

    if (!result) {
        if (typeof (language) == "undefined" || language == "zh")
            alert(vidiator.validErrorZH);
        else
            alert(vidiator.validErrorEN);
    }
    if (result && typeof (pageValidate) != "undefined") { // 调用页面上的自定义验证方法
        result = pageValidate(eventType);
    }
    return result;
}

// 页面初始化设置信息
var pageInfo =
{
    // 锁屏时显示图片
    LockImage: '<%=ResolveUrl("~/WFRes/images/WaitProcess.gif")%>',
    // 各种状态的样式名称
    style: {
    },
    // 控制显示/隐藏的值键对，如  {clickControl:"divProcessInfo",displayControl:"tbTable"}
    displayControls: [
    ],
    // 需要进行验证的按钮 ID，如 {ID:"btnSubmit",Message:"正在提交···"}
    validationButtons: [],
    // 提交时需要锁屏的按钮，如 {ID:"btnSave",Message:"正在保存···"}
    lockButtons: []
};