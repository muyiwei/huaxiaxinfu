/**
* 加载页面的css
* 读取客户端的theme设置[H3Portal_Theme]
*/
new function () {
    //load liger ui css
    AddCssInclude(_SitePath + "Contents/Themes/ligerUI/skins/Aqua/css/ligerui-all.css");
    AddCssInclude(_SitePath + "Contents/Themes/ligerUI/skins/Gray/css/all.css");
    AddCssInclude(_SitePath + "Contents/Themes/ligerUI/skins/ligerui-icons.css");
    //load jquery ui css
    //AddCssInclude(_SitePath + "Contents/Themes/jquery-ui/jquery-ui-1.10.0.custom.css");
    //if (/MSIE 6/.test(navigator.userAgent) || /MSIE 7/.test(navigator.userAgent) || /MSIE 8/.test(navigator.userAgent))
    //    AddCssInclude(_SitePath + "Contents/Themes/jquery-ui/jquery.ui.1.10.0.ie.css");

    var available_themes = H3Portal_Available_Themes;
    var theme = "default";
    //read local storage 
    var localtheme = GetLocalStorage("H3Portal_Theme") || "";
    if (localtheme && available_themes.indexOf("," + localtheme.toLowerCase() + ",") >= 0)
        theme = localtheme;
    //移动平台浏览器强制用移动风格
    if (H3Portal_Platform.IsMobile)
        theme = "_mobile";
    //load portal css with theme
    AddCssInclude(_SitePath + "Contents/Themes/" + theme + "/css/style.css", true);
    AddCssInclude(_SitePath + "Contents/Themes/" + theme + "/css/frm.css", true);
    AddCssInclude(_SitePath + "WFRes/css/PortalStyle0.css");
    /**
    * 引用css到页面
    */
    function AddCssInclude(link, istheme) {
        var $head = $("head");
        var $headlinklast = $head.find("link[rel='stylesheet']:last");
        var themeflag = istheme ? " theme='1'" : "";
        var linkElement = "<link rel='stylesheet' href='" + link + "' type='text/css' media='screen'" + themeflag + ">";
        if (!$head.length)
        {
            var $bodyinklast = $(document.body).find("link[rel='stylesheet']:last");
            if ($bodyinklast.length)
                $bodyinklast.after(linkElement);
            else if (document.body.childNodes.length == 0)
                $(document.body).append(linkElement);
            else
                $(document.body.childNodes[0]).before(linkElement);
        }
        else
        {
            if ($headlinklast.length) {
                $headlinklast.after(linkElement);
            }
            else {
                $head.append(linkElement);
            }
        }
    }
}();