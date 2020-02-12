//table 加 标题的 样式构造，有隐藏功能,需要排除构造的用excludeIDs排除{excludeIDs:["id"]}
(function ($) {
    $.fn.BuildPanel = function (option) {
        var count = 0;
        return $(this).each(function () {
            var id = new Date().toISOString().replace(/:|-|\./g, "") + (count++);
            var h3Pannel = $(this);
            var spanObj = $("span:first", h3Pannel);
            var tableObj = $("table:first", h3Pannel);
            var formObj = $('<div class="l-form"></div>');
            var groupOjb = $("<div class='l-group' style='cursor:pointer;'></div>");
            var btnObj = $("<div class='togglebtn'></div>");

            var excludeObj;
            if (option != null && option.excludeIDs != null) {
                for (var i = 0; i < option.excludeIDs.length; i++) {
                    excludeObj = h3Pannel.children("#" + option.excludeIDs[i]);
                    if (excludeObj.length > 0) {
                        break;
                    }
                }
            }

            //var excludeObj = option == null ? null : option.excludeID == null ? null : $("div[id=" + option.excludeID + "]", h3Pannel);

            var controlDiv = $("<div H3PanelId='Control_" + id + "'></div>");
            groupOjb.attr("H3PanelId", id);
            btnObj.attr("H3PanelId", "togglebtn_" + id);

            if (excludeObj != null && excludeObj.length > 0) {
                controlDiv.append(excludeObj);
            }
            else {
                controlDiv.append(tableObj);
                //如果是控件过来的table，那么就设置样式,例如添加群组功能的组织关系
                if (!tableObj.hasClass("tableList")) {
                    tableObj.addClass("tableList");
                }
                var trList = tableObj.find("tr");
                for (var i = 0; i < trList.length; i++) {
                    var tr = $(trList[i]);
                    var td = $("td:first", tr);
                    if (td.hasClass("tableLeft")) break;//主要有一个有，基本上都会有
                    td.removeAttr("width");
                    td.removeAttr("align");
                    td.addClass("tableLeft");//没有的添加
                }
            }
            groupOjb.bind("click", function () {
                var pannelId = $(this).attr("H3PanelId");
                var controlDiv = $("div[H3PanelId='Control_" + pannelId + "']");// $("#table_" + $(this).attr("id"));
                var togglebtn = $("div[H3PanelId='togglebtn_" + pannelId + "']");// $("#togglebtn_" + $(this).attr("id"));
                if (controlDiv.is(":hidden")) {
                    togglebtn.removeClass("togglebtn-down");
                    controlDiv.show();
                }
                else {
                    togglebtn.addClass("togglebtn-down");
                    controlDiv.hide();
                }
            });

            if (spanObj != null && spanObj.length > 0) {
                spanObj.css("padding-left", "30px");
                spanObj.css("width", "100%");
                groupOjb.append(spanObj);
                groupOjb.append(btnObj);
                formObj.append(groupOjb);
            }
            formObj.append(controlDiv);
            h3Pannel.html("");
            return h3Pannel.append(formObj);
        });
    };

    $.fn.CloseAllPanel = function (option) {
        $(this).find(".l-group").each(function () {
            var pannelId = $(this).attr("H3PanelId");
            var controlTb = $("div[H3PanelId='Control_" + pannelId + "']");
            var togglebtn = $("div[H3PanelId='togglebtn_" + pannelId + "']");
            if (controlTb.is(":hidden")) {
            }
            else {
                togglebtn.addClass("togglebtn-down");
                controlTb.hide();
            }
        });

        if (option) {
            if (option.excludeIDs) {
                for (var i = 0, j = option.excludeIDs.length; i < j; i++) {
                    $("#" + option.excludeIDs[i]).parent().parent().find(".l-group").each(function () {
                        var pannelId = $(this).attr("H3PanelId");
                        var controlTb = $("div[H3PanelId='Control_" + pannelId + "']");
                        var togglebtn = $("div[H3PanelId='togglebtn_" + pannelId + "']");
                        togglebtn.removeClass("togglebtn-down");
                        controlTb.show();
                    });
                }
            }
        }
    };
})(jQuery);