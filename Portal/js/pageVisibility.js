//标签页从后台运行到前台触发的事件，兼容到ie9以上
var pageVisibility = (function () {
    var prefixSupport, keyWithPrefix = function (prefix, key) {
        if (prefix !== "") {
            // 首字母大写
            return prefix + key.slice(0, 1).toUpperCase() + key.slice(1);
        }
        return key;
    };
    var isPageVisibilitySupport = (function () {
        var support = false;
        if (typeof window.screenX === "number") {
            ["webkit", "moz", "ms", "o", ""].forEach(function (prefix) {
                if (support == false && document[keyWithPrefix(prefix, "hidden")] != undefined) {
                    prefixSupport = prefix;
                    support = true;
                }
            });
        }
        return support;
    })();

    var isHidden = function () {
        if (isPageVisibilitySupport) {
            return document[keyWithPrefix(prefixSupport, "hidden")];
        }
        return undefined;
    };

    var visibilityState = function () {
        if (isPageVisibilitySupport) {
            return document[keyWithPrefix(prefixSupport, "visibilityState")];
        }
        return undefined;
    };

    return {
        hidden: isHidden(),
        visibilityState: visibilityState(),
        visibilitychange: function (fn, usecapture) {
            usecapture = undefined || false;
            if (isPageVisibilitySupport && typeof fn === "function") {
                return document.addEventListener(prefixSupport + "visibilitychange", function (evt) {
                    this.hidden = isHidden();
                    this.visibilityState = visibilityState();
                    fn(evt);
                }.bind(this), usecapture);
            }
            return undefined;
        }
    };
})(undefined);
