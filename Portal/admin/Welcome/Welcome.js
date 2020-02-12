var openUrl = function (text, url) {
    top.f_addTab(
        {
            tabid: new Date().getTime(),
            text: text,
            url: url
        });
}

$(function () {
    var model = new Vue({
        el: "#content",
        data: $.Languages
    });

    $.each($(".activityBody"), function (n, obj) {
        if (!$.trim($(obj).text())) {
            $(obj).hide();
        }
    });
});