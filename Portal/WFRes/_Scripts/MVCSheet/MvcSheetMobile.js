var InitMobileInput = function (I) { return; if (!I.is("input,textarea,select")) { return } var B = $(I).parent("div"); B.addClass("editable"); var A = $(I).parent().prev("div"); if ($(I).is("input[data-type='date']")) { if ($.os.ios) { I.attr("type", "date") } else { I.attr("onfocus", "WdatePicker()") } } if ($.os.ios && I.is("input[data-type='number']")) { I.attr("type", "number") } var F = "TmpAttrName"; $(I).attr(F, F); var E = $(A).text(); var C = $.uuid(); var D = $('<label class="input-mask"></label>').text(I.val()); D.insertAfter(I); $.ui.addContentDiv(C, $("<div>").append(I).html(), E); I = $("#" + C).find("[" + F + "]"); var G = 0; var H = function (J) { if (J.timeStamp - G < 2000) { return } G = J.timeStamp; var K = $("#header").children("header").find("h1").text().trim(); $.ui.loadContent(C); $.ui.setBackButtonVisibility(true); $.ui.setBackButtonText(K); setTimeout(function () { $(I).focus() }, 300) }; $(B).unbind("tap.editable").bind("tap.editable", function (J) { H(J) }); $(A).unbind("tap.editable").bind("tap.editable", function (J) { H(J) }); $("#" + C).attr("data-footer", "none"); I.unbind("change.editable").bind("change.editable", function () { if ($(this).is("select")) { var J = $(this).find("option").filter(function () { return $(this).prop("selected") }).text() || $(this).find("option").filter(function () { return $(this).prop("selected") }).val() || $(this).find("option:first").text() || $(this).find("option:first").val(); $(D).text(J) } else { $(D).text($(this).val()) } }).unbind("ValidateFalse").bind("ValidateFalse", function () { $(D).parent().addClass("mobile-error") }).removeAttr(F) }; var BeforeLaunch = function () { return; $("[data-type='checkbox']").each(function () { $(this).css("width", "auto").css("float", "right"); var B = $(this).find("input[type=checkbox]"); var A = B.attr("id"); B.addClass("toggle"); $(B).after('<label for="' + A + '" style="margin-top: -4px;margin-right: 10px;"> <span></span> </label>') }); $("[data-type='user-selector']").each(function () { $(this).parent().addClass("editable").unbind("tap.user-selector").bind("tap.user-selector", function () { SelectUser(this) }) }) };
var AfterLaunch = function () {
    var over2Lines = function (el) { return ($(el).height() >= numOnly($(el).css("line-height")) * 2) || ((p = $(el).children("p:first")) && p.length && (p.height() >= numOnly($(p).css("line-height")))); };
    //Span过长时,靠左显示
    $(".col-md-10,.col-md-4").children("label:visible,span:visible").each(function () {
        if (!$(this).is(".input-mask") && over2Lines(this)) {
            $(this).attr("style", "text-align: left !important");
        }
    });

    //修复iphone点击输入框时,header偏移的问题
    var _adjustHeader = function () {
        if (document.body.scrollTop != numOnly($.getCssMatrix($('#afui').get(0)).f)) {
            $('#afui').css3Animate({ y: document.body.scrollTop, time: $.ui.transitionTime });
        }
    }
    //$.bind($.touchLayer, 'enter-edit-reshape', function () {
    //    _adjustHeader();
    //});
    $.bind($.touchLayer, 'exit-edit-reshape', function () {
        _adjustHeader();
    });

    var A = 0;
    return;
    $("[data-type='CheckBoxList']").each(function () { InitCheckBoxList(this) }); $("[data-type='RadioButtonList']").each(function () { InitRadioButtonList(this) }); $("#mainList").find(".form-group").each(function (B) { var C = $(this).find("input[type!=file]:visible,select:visible,textarea:visible"); if (C.length == 1) { InitMobileInput(C) } }); $("[data-target='DetailSummary']").each(function () { $(this).parent().addClass("editable"); var F = $(this).attr("data-field"); var G = $(this).children("[data-target='Detail-View']"); var D = $(this).children("[data-target='Detail-View']"); var B = $(this).prev().text(); var E = $.uuid(); $.ui.addContentDiv(E, $(G).html(), B); $("#" + E).find(".form-group").each(function (H) { var I = $(this).find("input[type!=file],select,textarea"); if (I.length == 1) { InitMobileInput(I) } }); $("#" + E).attr("data-footer", "none").attr("data-field", F).attr("data-target", "Detail-Items"); var C = 0; $(this).parent().unbind("tap.editable").bind("tap.editable", function (H) { if (H.timeStamp - C < 2000) { return } C = H.timeStamp; console.log("tap"); $.ui.loadContent(E); $.ui.setBackButtonVisibility(true) }) })
}; var ShowActions = function () {
    var A = []; $(".SheetToolBar:first>li>a").each(function () { $(this).attr("data-ignore", "true"); var B = this; A.push({ text: $(this).text(), handler: function () { var D = $(B).next().find("a"); if (D.length == 0) { $(B).click() } else { var C = []; $(D).each(function () { $(this).attr("data-ignore", "true"); var E = this; C.push({ text: $(this).text(), handler: function () { $(E).click() } }) }); $.ui.actionsheet(C) } } }) }); $.ui.actionsheet(A);
};