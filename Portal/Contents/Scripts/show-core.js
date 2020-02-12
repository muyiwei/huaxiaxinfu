$(document).ready(
    function () {
        var searchinputcss = {
            width: '140px',
            height: '23px',
            border: 'none',
            padding: '0px',
            margin: '0px',
            background: 'white'
        }
        //兼容IE不同版本浏览器
        $(".icon-search-input input").css(searchinputcss);
        //data-list类除标题列外其他列右对齐
        //$(".data-list").children('tbody').children("tr").children("td:gt(1)").css("text-align","right");
        $(".data-list").find("tr").each(function (i, value) {
            //判断dataicon是否存在
            var $tmp = $(this).find("td.data-icon");
            if ($tmp.length > 0)
                $(this).children("td:gt(1)").css("text-align", "right");
            else
                $(this).children("td:gt(0)").css("text-align", "right");
        })
        //$("form").append("<div style='text-align:center;'>TODO: 即将处理加载页面的widgets</div>");
        //直接从页面中隐藏的HTML中移到可见区域（支持服务器模式）
        var server_insts = $("#div_hidden_controls").find("div[ot_webpart_inst]");
        //alert(server_insts.length)
        if (server_insts && server_insts.length > 0) {
            for (var i = 0; i < server_insts.length; i++) {
                var pagepart = $(server_insts[i]).attr("ot_part_for");
                if (!pagepart)
                    continue;
                var partcontainer = $("div[part=" + pagepart + "]");
                if (!partcontainer)
                    continue;
                partcontainer.append(server_insts[i]);
            }
        }
        //根据部件实例的ID去Load（目前忽略这种方式）
        if (typeof (_PageWebPartInstArray) != "undefined") {
            for (var i = 0; i < _PageWebPartInstArray.length; i++) {
                AppendControl(_PageWebPartInstArray[i]["ObjectID"], $("div[part=" + _PageWebPartInstArray[i]["PagePart"] + "]"));
            }
        }

        //直接显示部件实例产生的HTML
        if (typeof (_PageWebPartInstObjectArray) != "undefined") {
            for (var i = 0; i < _PageWebPartInstObjectArray.length; i++) {
                AppendControlHTML(_PageWebPartInstObjectArray[i]["Html"], $("div[part=" + _PageWebPartInstObjectArray[i]["PagePart"] + "]"));
            }
        }

        $("tr.pager_row").hide();

        //顶部右侧的一些按钮，搜索的事件，有些模板可能没有
        //control panel
        if ($("#top_btn_control").length > 0) {
            $("#top_btn_control").bind("click", function (e) {
                //alert("PANEL");
                var target = e.delegateTarget;
                e.preventDefault();
                e.stopPropagation();
                ShowControlPanel(target);
            });
        }
        //search
        if ($("#top_btn_search").length > 0) {
            $("#top_btn_search").bind("click", function (e) {
                //alert($("#top_txt_key").val());
                var keyword = $.trim($("#top_txt_key").val());
                if (!keyword)
                    return;
                keyword = escape(keyword);
                //TODO: go to search page
                window.location = "QueryMyInstance.aspx?Keyword=" + keyword;
            });
        }
        if ($("#top_txt_key").length > 0) {
            $("#top_txt_key").bind("keydown", function (e) {
                if (event.keyCode == 13) {
                    event.keyCode = 9;
                    event.preventDefault();
                    var keyword = $.trim($("#top_txt_key").val());
                    if (!keyword)
                        return;
                    keyword = escape(keyword);
                    //TODO: go to search page
                    window.location = "QueryMyInstance.aspx?Keyword=" + keyword;
                }
            });
        }
        //profile
        if ($("#top_btn_profile").length > 0) {
            $("#top_btn_profile").bind("click", function (e) {
                //go to profile url
                //window.location = '';
                var divUserPanel = $(".divUserPanel");

                //用户面板
                var panelWidth = divUserPanel.width();
                var panelHeight = divUserPanel.height();
                //面板上边和下边
                var topP = $(".topP");
                var bottomP = $(".bottomP");

                //窗体
                var screenWidth = $(window).width();
                var screenHeight = $(window).height();

                if (divUserPanel.is(":visible")) {
                    divUserPanel.hide();
                    return;
                }
                ShowDetail(_CurrentUser);

                var x = $(this).offset().left;
                var y = $(this).offset().top;
                var linkWidth = $(this).width();
                var linkHeight = $(this).height();
                //上面显示
                if (y + panelHeight <= screenHeight) {
                    //显示边
                    topP.show();
                    bottomP.hide();
                    //左边显示
                    if (x + panelWidth < screenWidth) {
                        divUserPanel.css({
                            "left": x + "px",
                            "top": (y + linkHeight) + "px"
                        });
                        topP.css({
                            "text-align": "left",
                            "padding-left": linkWidth / 2 + "px"
                        });
                    }
                        //右边显示
                    else {
                        divUserPanel.css({
                            "left": (x + linkWidth - panelWidth) + "px",
                            "top": (y + linkHeight) + "px"
                        });
                        topP.css({
                            "text-align": "right",
                            "padding-right": linkWidth / 2 + "px"
                        });
                    }
                }
                    //下面显示
                else {
                    //显示下边
                    topP.hide();
                    bottomP.show();
                    //左边显示
                    if (x + panelWidth < screenWidth) {
                        divUserPanel.css({
                            "left": x + "px",
                            "top": (y - panelHeight) + "px"
                        });
                        bottomP.css({
                            "text-align": "left",
                            "padding-left": linkWidth / 2 + "px"
                        });
                    }
                        //右边显示
                    else {
                        divUserPanel.css({
                            "left": (x + linkWidth - panelWidth) + "px",
                            "top": (y - panelHeight) + "px"
                        });
                        bottomP.css({
                            "text-align": "right",
                            "padding-right": linkWidth / 2 + "px"
                        });
                    }
                }

                divUserPanel.show();
            });
        }
        //cancel
        if ($("#top_btn_exit").length > 0) {
            $("#top_btn_exit").bind("click", function (e) {
                if (!confirm(GetLanguageText("UI_PAGE_LOGOUTCONFIRM")))
                    return;
                window.location = 'Login.aspx?type=logout';
            });
        }
    }
);
function ShowDetail(result) {
    if (result && result.ObjectID) {
        //如果有头像
        if (result.FacePath) {
            $(".d_face").attr("src", result.FacePath);
        } else {
            $(".d_face").attr("src", "WFRes/images/person.gif");
        }
        $(".d_alias").text(result.UserName);
        if (result.Email) {
            var href = "<a href='mailto:" + result.Email + "' style='text-decoration:underline;color:blue;'>" + result.Email + "</a>";
            $(".d_email").html(href);
        }

        if (result.Code) {
            $(".d_alias").text(result.Code);
        }

        if (result.Mobile) {
            $(".d_mobile").text(result.Mobile + " (" + l_mobile + ")");
        }

        if (result.OfficePhone) {
            $(".d_offtel").text(result.OfficePhone + " (" + l_office + ")");
        }

        if (result.fax) {
            $(".d_fax").text(result.Fax + " (" + l_fax + ")");
        }
    }
}
window.document.onclick = function (e) {
    var target = event.srcElement == null ? event.target : event.srcElement;
    var profile = document.getElementById("top_btn_profile");
    if (target != profile) {
        if ($(".divUserPanel").is(":visible")) {
            $(".divUserPanel").hide();
        }
    }
}