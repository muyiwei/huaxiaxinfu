'use strict';

app.service('notify', ['$document', '$timeout', function ($document, $timeout) {
    var defaults = {
        classes: "",// "animated fadeInDown hide",
        styles: { top: 30, position: "absolute", "z-index": 99 },
        stay: 3000
    };
    var options = {};
    var timer = null;

    // 弹出消息框
    this.showMessage = function (elem, ops) {
        options = $.extend(defaults, ops);

        elem.addClass(options.classes);
        elem.css(options.styles);
        elem.css({ "margin-left": (elem.parent().width() - elem.width()) / 2 });
        elem.removeClass("fadeOut").addClass("show");

        if (timer != null) {
            $timeout.cancel(timer);
        }
        registerClose(elem);

        elem.off("mouseleave").off("mousemove")
            .on("mouseleave", function () {
                registerClose(elem);
            })
            .on("mousemove", function () {
                if (timer != null) {
                    $timeout.cancel(timer);
                }
            });

        elem.find(".close").off("click").on("click", function () {
            $timeout.cancel(timer);
            elem.removeClass("show");
        });
    }

    var registerClose = function (elem) {
        // 注册自动关闭
        timer = $timeout(function () {
            elem.addClass("fadeOut");
        }, options.stay);
    }

    // End Service
}]);