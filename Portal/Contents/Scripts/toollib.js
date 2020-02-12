//设置Cookie
function SetCookie(name, value, day) {
    var Days = day || 30;
    var exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
}

//取cookie函数 
function GetCookie(name) {
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null)
        return unescape(arr[2]);
    return null;
}

//获取本地存储
function GetLocalStorage(name) {
    if (typeof (window.localStorage) == "undefined")
        return GetCookie(name);
    return window.localStorage.getItem(name);
}

//设置本地存储[优先使用localStorage,不支持则用cookie]
function SetLocalStorage(name, value) {
    if (typeof (window.localStorage) == "undefined")
        SetCookie(name, value);
    else
        window.localStorage.setItem(name, value);
}

/**
* 绑定鼠标滚动的事件

* @method BindMouseWheel
* @param {Object} ele 元素
* @param {Function} callbackDown 向下滚动响应的回调方法
* @param {Function} callbackUp 向上滚动响应的回调方法
*/
function BindMouseWheel(ele, callbackDown, callbackUp) {
    //Firefox
    $(ele).bind('DOMMouseScroll', function (e) {
        if (e.originalEvent.detail > 0) {
            //scroll down
            if (callbackDown)
                callbackDown();
        } else {
            //scroll up
            if (callbackUp)
                callbackUp();
        }

        //prevent page fom scrolling
        return false;
    });

    //IE, Opera, Safari
    $(ele).bind('mousewheel', function (e) {
        if (e.originalEvent.wheelDelta < 0) {
            //scroll down
            if (callbackDown)
                callbackDown();
        } else {
            //scroll up
            if (callbackUp)
                callbackUp();
        }

        //prevent page fom scrolling
        return false;
    });
}

/**
* 获取Url的参数值

* @method GetURLParameter
* @param {String} name 参数名
*/
function GetURLParameter(name, win) {
    if(!win)
        return decodeURI(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
        );
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(win.location.search) || [, null])[1]
    );
}

/**
* 设置Url的参数值

* @method GetURLParameter
* @param {String} url 要设置的Url
* @param {String} name 参数名
* @param {String} v 参数值
*/
function SetURLParameter(url, name, v)
{
    if (!url)
        return "";
    if (url.indexOf("?") == -1)
        return url += "?" + name + "=" + encodeURI(v);
    var absurl = url.split("?")[0];
    var query = url.split("?")[1];
    var vars = query.split("&");
    var isfound = false;
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == name) {
            vars[i] = pair[0] + "=" + encodeURI(v);
            isfound = true;
        }
    }
    if (!isfound)
        url += "&" + name + "=" + encodeURI(v);
    else
        url = absurl + "?" + vars.join("&");
    return url;
}