var _Script_GlobalString = { "Script_Fold": "折叠", "Script_UnFold": "展开", "Script_PersonInfo": "个人信息" };
////获取本地化字符串
//$.get(_PORTALROOT_GLOBAL + "/Ajax/GlobalHandler.ashx", { "Code": "Script_Fold,Script_PersonInfo,Script_UnFold" }, function (data) {
//    if (data.IsSuccess) {
//        _Script_GlobalString = data.TextObj;
//    }
//}, "json");

//页面初始化
$(function () {
    //页面加载中效果
    //    loadBar(0);
    //设定母版页中内容块的高度，让footer置于最低端
    setContentHeight();
    //给th增加toggle效果
    //    setThToggle();
    //给GridView添加皮肤和事件效果
    // $(".mywork_list_table").tableUI();
    //给左侧菜单添加单击行即触发效果
    setTRFunctionClick();
    //提示消息样式
    SetMsgTip();
    //增加ie6样式处理
    SetIE6Css();
});

//判断是否是ie6
function IsIE6Version() {
    var flag = /msie 6/i.test(navigator.userAgent);
    return flag;
}

function SetIE6Css() {
    if (IsIE6Version()) {

        $("input[type='text'],input[type='password'],input[type='file']").addClass("input_text");
        $("input[type='submit']").addClass("submit");
        $("select").addClass("select");
    }
}

function BindGridRowData() { }

function RefreshGridView() {
    $(".mywork_list_table").tableUI();
    //给th增加toggle效果
    //    setThToggle();
    //提示消息样式
    SetMsgTip();
    SetIE6Css();
}

function SetMsgTip() {
    // 此处样式遮住了原有的输入框和内容，暂时屏蔽
    var spanMsg = $("span[id*='lblResult']");
    spanMsg.each(function () {
        if ($(this).html() != "") {
            var c = $(this).html();
            var p = $(this).parent();
            p.html("<div class='msgprint' style='clear:both;overflow:auto;'>" + c + "</div>");
            window.setTimeout(function () {
                $(".msgprint").fadeOut(500);
                //如果动画结束则删除节点
                if (!$(".msgprint").is(":animated")) {
                    $(".msgprint").remove();
                }
            }, 5000);
        }
    });
}

//页面加载效果
function loadBar(s) {
    var intervalID = 0;
    var i = parseInt(s);
    if (i == 0) {
        window.clearInterval(intervalID);
        var h = $(document).height();
        var w = $(document).width();
        $('#screen').css({ 'height': h });
        $("#screenContent").css({ "left": $(window).width() / 2 - 150, "top": $(window).height() / 2 - 50 });
        $('#screen').show();
        $('#screenContent').show();
        intervalID = window.setInterval("loadBar(1)", 500);
    }
    if (i == 1) {
        if (document.readyState == 'complete') {
            $('#screen').hide();
            $('#screenContent').hide();
            window.clearInterval(intervalID);
        }
    }
}

function loadFunction(functionID, visible) {
    if (visible) {
        var h = $(document).height();
        var w = $(document).width();
        $('#screen').css({
            'height': h
        });

        $("#" + functionID).css({
            'position': 'absolute',
            'border': '1px solid black',
            'background-color': 'white',
            'z-index': 101,
            'left': ($(window).width() - $("#" + functionID).width()) / 2,
            'top': ($(window).height() - $("#" + functionID).height()) / 2 + $(document).scrollTop()
        });
        $('#screen').show();
        $("#" + functionID).show();

    }
    else {
        $('#screen').hide();
        $("#" + functionID).hide();
    }
}

//设定内容块高度
function setContentHeight() {
    var winH = $(window).height();
    var topH = $("#tdHeader").height();
    var bottomH = $("#tdFooter").height();
    if ($("#tableMain").height() < winH) {
        var ch = winH - topH - bottomH;
        $("#tdMain").css("height", ch);
    }
}

//给th增加toggle效果
function setThToggle() {
    if ($(".edit_group th").find("b").length > 0)
        return;
    $(".edit_group th").append("<b class='thb1' title='" + _Script_GlobalString.Script_Fold + "'></b>");
    $(".edit_group th b").toggle(function () {
        $(this).attr({ "class": "thb2", "title": _Script_GlobalString.Script_UnFold });
        var curr = $(this).parents("tr");
        var others = curr.nextAll();
        others.each(function (index) {
            if ($(this).children().is("th")) {
                return false;
            }
            else {
                $(this).hide();
            }
        });
    }, function () {
        $(this).attr({ "class": "thb1", "title": _Script_GlobalString.Script_Fold });
        var curr = $(this).parent("th").parent("tr");
        var others = curr.nextAll();
        others.each(function (index) {
            if ($(this).children().is("th")) {
                return false;
            }
            else {
                $(this).show();
            }
        });
    });

    $(".edit_group th").css("cursor", "pointer").click(function () {
        $(this).children("b").click();
    });
}

//给gridView或表给添加插件效果
(function ($) {
    $.fn.tableUI = function (options) {
        var defaults = {
            titleRowClass: "titleRow",
            evenRowClass: "evenRow",
            oddRowClass: "oddRow",
            activeRowClass: "activeRow"
        }
        var options = $.extend(defaults, options);

        this.each(function () {
            var thisTable = $(this);


            thisTable.removeAttr("border");
            //添加奇偶行颜色
            thisTable.find("tr:even").addClass(options.evenRowClass);
            thisTable.find("tr:odd").addClass(options.oddRowClass);
            thisTable.find("tr:eq(0)").removeClass(options.evenRowClass).addClass(options.titleRowClass);
            thisTable.find("table").find("tr").removeAttr("class");
            //设置分页行样式
            thisTable.find("tr.pager_row").removeClass(options.evenRowClass).removeClass(options.oddRowClass);


            //添加活动行颜色
            thisTable.find("tr:gt(0)").hover(function () {
                $(this).siblings("tr").removeClass("activeRow");
                if (!$(this).hasClass("pager_row")) {

                    $(this).addClass("activeRow");
                    var alt = $(this).find("td[id='tdSummary']").html();
                    if (!alt && alt != "&nbsp;") {
                        $(this).attr("alt", alt);
                    }
                }
                $("tr.activeRow").find("tr.activeRow").removeClass("activeRow");

            }, function () {
                $(this).removeClass("activeRow");
            });


        });
    };
})(jQuery);

//给左侧菜单添加单击行即触发效果
function setTRFunctionClick() {
    $(".trFunction").click(function (e) {
        window.location.href = $(this).find("tr:eq(0)").children("td").children("a").attr("href");
        e.preventDefault();
    });
}

function CheckAll(gridViewID) {
    var GridView1 = document.getElementById(gridViewID);
    for (i = 1; i < GridView1.rows.length; i++) {
        GridView1.rows[i].cells[0].getElementsByTagName("INPUT")[0].checked =
        !GridView1.rows[i].cells[0].getElementsByTagName("INPUT")[0].checked;
    }
}

//全选
function SelectAll(gridViewID, chkAll, subCheck) {
    var gv = $("table[id*='" + gridViewID + "']");
    var subChecks = gv.find("input[id*='" + subCheck + "']");
    subChecks.prop("checked", chkAll.checked);

    subChecks.click(function () {
        $(chkAll).prop('checked', subChecks.length == subChecks.filter(':checked').length);
    });
}

function selChkAll(obj, subGroup) {
    $("input[id*='" + subGroup + "']").attr("checked", $(obj).attr("checked"));
}

var openProfile = function () {
    $.ligerDialog.open({
        title: _Script_GlobalString.Script_PersonInfo,
        url: _PORTALROOT_GLOBAL + "/EditProfile.aspx?Mode=Profile",
        height: 800,
        width: 730
    });
}