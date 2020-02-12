// 查找参数
function getQueryString(name) {
    // 如果链接没有参数，或者链接中不存在我们要获取的参数，直接返回空     
    if (location.href.indexOf("?") == -1 || location.href.indexOf(name + '=') == -1) {
        return '';
    }
    // 获取链接中参数部分
    var queryString = location.href.substring(location.href.indexOf("?") + 1);
    // 分离参数对 ?key=value&key2=value2     
    var parameters = queryString.split("&");
    var pos, paraName, paraValue;
    for (var i = 0; i < parameters.length; i++) {
        // 获取等号位置         
        pos = parameters[i].indexOf('=');
        if (pos == -1) { continue; }
        // 获取name 和 value         
        paraName = parameters[i].substring(0, pos);
        paraValue = parameters[i].substring(pos + 1);
        // 如果查询的name等于当前name，就返回当前值，同时，将链接中的+号还原成空格         
        if (paraName == name) {
            return unescape(paraValue.replace(/\+/g, " "));
        }
    }
    return '';
}

// 为URL添加一个参数
function addUrlParam(currentUrl, name, value) {
    if (currentUrl.lastIndexOf('?') == -1) {
        // 不包括?
        return currentUrl + "?" + name + "=" + encodeURI(value);
    }
    else if (currentUrl.lastIndexOf('?') == currentUrl.length - 1) {
        // 以?结尾
        return currentUrl + name + "=" + encodeURI(value);
    }
    else if (currentUrl.lastIndexOf('&') == currentUrl.length - 1) {
        // 以&结尾
        return currentUrl + name + "=" + encodeURI(value);
    }
    else {
        return currentUrl + "&" + name + "=" + encodeURI(value);
    }
}

// 为页面添加返回参数
function addReturnParamToUrl() {
    // 首先从URL中检查是否已经有了参数q
    var preUrl = getQueryString("q");

    if (preUrl != null && preUrl != "") {
        // 已经存在，不需要添加
        return;
    }
    // 获得之前的URL
    preUrl = document.referrer;
    // 当前URL
    var newUrl = addUrlParam(window.location.href, "q", preUrl); ;
    // 跳转到新的URL
    window.location = newUrl;
}