/**
* H3Portal的菜单组件

* @method H3PortalMenu
* @param {Object} menu 菜单列表{Url:,MenuName,MenuCode,ObjectID:,ParentObjectID:,Icon:,ParentIndex:}
* @param {Object} config 配置{ContainerId:,HideChildren:,MenuType:}
*/
function H3PortalMenu(menu, config)
{
    this.TempMenu = menu;
    this.Menu = null;
    this.Config = config;
    this.Container = null;
    this.FloatItems = [];
    this.TempLocation = [];
    this.Location = [];

    if (!config.ContainerId) return;
    if (typeof (config.ContainerId) == "string") this.Container = document.getElementById(config.ContainerId);
    if (typeof (this.Container) == "undefined" || !this.Container) return;
    this.Container = $(this.Container);
    this.Init();
}

/**
* Init 初始化菜单

* @method Init
*/
H3PortalMenu.prototype.Init = function ()
{
    this.OrganizeMenu();

    if (this.Config.MenuType == "Popup")
        this.CreatePopupMenu();
    else
        this.CreateListMenu();
    this.FindLocation();
    var self = this;
    $(document.body).bind("click", function () {
        self.RemoveFloatMenu();
    })
}

H3PortalMenu.prototype.RemoveFloatMenu = function (submenu)
{
    if (this.FloatItems.length == 0)
        return;
    if (typeof(submenu)!="undefined")
    {
        for (var i = 0; i < this.FloatItems.length; i++) {
            if (this.FloatItems[i] == submenu) {
                this.FloatItems[i].MenuElement.IsFloating = false;
                this.FloatItems[i].MenuElement.parentNode.FloatMenu = null;
                $(this.FloatItems[i]).remove();
                this.FloatItems.splice(i, 1);
                break;
            }
        }
    }
    else
    {
        for (var i = 0; i < this.FloatItems.length; i++) {
            this.FloatItems[i].MenuElement.IsFloating = false;
            this.FloatItems[i].MenuElement.parentNode.FloatMenu = null;
            $(this.FloatItems[i]).remove();
            this.FloatItems.splice(i, 1);
            i--;
        }
        this.FloatItems = [];
    }
}

/**
* CreatePopupMenu 创建弹出式菜单

* @method CreatePopupMenu
*/
H3PortalMenu.prototype.CreatePopupMenu = function () {
    var self = this;

    var ul = document.createElement("ul");
    ul.className = "popup-menu";
    this.Container.append(ul);

    for (var i = 0; i < this.Menu.length; i++) {
        CreateMenuItem(this.Menu[i], ul);

    }
    $(this.Container).append("<div class='popup-menu-clear' style='clear:both;'></div>");

    //绑定菜单事件
    function BindMenuEvent(ele) {
        var menu = ele.Menu;
        $(ele).bind("mouseover", function (e) {
            if (!menu.children || menu.children.length == 0 || self.Config.HideChildren == 1) return;

            if (ele.IsFloating && ele.IsFloating == true) return;
            ele.IsFloating = true;
            //e.preventDefault();
            //e.stopPropagation();
            var pos = $(ele).offset();
            
            var div = document.createElement("ul");
            div.className = "float-menu";
            div.MenuElement = ele;
            if (self.FloatItems.length == 0) {
                div.style.left = pos.left + "px";
                div.style.top = pos.top + $(ele).height() + "px";
            }
            else {
                div.style.left = pos.left + $(ele).width() + 1 + "px";
                div.style.top = pos.top + "px";
            }
            document.body.appendChild(div);
            self.FloatItems.push(div);
            //用来关联两者的关系
            ele.parentNode.FloatMenu = div;
            div.OriginParentMenu = ele.parentNode;

            BindFloatEvent(div);

            var list = menu.children;
            //var ul = document.createElement("ul")
            //div.appendChild(ul);
            for (var i = 0; i < list.length; i++) {
                CreateMenuItem(list[i], div);
            }

        });

        $(ele).bind("mouseout", function (e) {
            if (!ele.IsFloating) return;
            //e.stopPropagation();
            var target = e.relatedTarget;
            if ($.contains(ele, target)) return;
            var parentmenu = ele.parentNode.FloatMenu;
            if (!parentmenu)
                return;
            var parentnode = ele.parentNode;
            //if (parentnode.className && parentnode.className == "float-menu" && $.contains(parentnode, target))
            //{
            //}
            if (parentmenu && !$.contains(parentmenu, target) && target != parentmenu)
                self.RemoveFloatMenu(parentmenu);
            if(parentmenu && ($.contains(parentmenu, target) || target || parentmenu))
                e.stopPropagation();
        });

        function BindFloatEvent(ul)
        {
            $(ul).bind("mouseout", function (e) {
                e.stopPropagation();
                var target = e.relatedTarget;
                var menu = ul.MenuElement;
                var parentmenu = menu.parentNode;
                if ($.contains(ul, target) || $.contains(parentmenu, target) || target == parentmenu)
                    return;
                self.RemoveFloatMenu();
            });
        }
    }

    //创建菜单元素
    function CreateMenuItem(menu, ul) {
        var li = document.createElement("li");
        ul.appendChild(li);

        if (typeof (_CurrentMenuCode) != "undefined" && _CurrentMenuCode == menu.MenuCode)
            li.className = "current-menu";

        li.Menu = menu;
        var a = document.createElement("a");
        if (menu.Url) {
            var url = menu.Url;
            if (url.indexOf("?") > 0)
                url += "&";
            else
                url += "?"
            url += "menucode=" + menu.MenuCode;
            a.href = url;
        }
        li.appendChild(a);

        var span_icon = document.createElement("span");
        span_icon.className = "menu-icon";
        if (menu.Icon) {
            $(span_icon).append("<img src=\"" + menu.Icon + "\" />");
            a.appendChild(span_icon);
        }
        var span_text = document.createElement("span");
        span_text.className = "menu-text";
        span_text.innerHTML = menu.DisplayName;
        a.appendChild(span_text);

        if (menu.children && menu.children.length > 0 && self.Config.HideChildren == 0) {
            var span_more = document.createElement("span");
            span_more.className = "menu-more";
            a.appendChild(span_more);
        }
            BindMenuEvent(li);
        //}
    }
}

/**
* CreateListMenu 创建列表式菜单

* @method CreateListMenu
*/
H3PortalMenu.prototype.CreateListMenu = function () {
    var self = this;

    var ul = document.createElement("ul");
    ul.className = "list-menu";
    this.Container.append(ul);

    for (var i = 0; i < this.Menu.length; i++) {
        CreateMenuItem(this.Menu[i],ul);
    }
    $(this.Container).append("<div class='list-menu-clear' style='clear:both;'></div>");

    //递归创建子菜单
    function RescueCreateChild(menu, ele) {
        if (!menu.children || menu.children.length == 0 || self.Config.HideChildren == 1) return;
        var ul = document.createElement("ul");
        ul.className = "list-menu-sub";
        ele.appendChild(ul);
        var list = menu.children;
        for (var i = 0; i < list.length; i++)
        {
            CreateMenuItem(list[i], ul);
        }
        $(ele).append("<div style='clear:both;'></div>");
    }

    //绑定菜单事件
    function BindMenuEvent(ele) {
        $(ele).bind("click", function () {
            var ul = ele.parentNode;
            var lis = ul.childNodes;
            for (var i = 0; i < lis.length; i++)
            {
                $(lis[i]).find("ul").hide();
            }
            var menu = ele.Menu;
            if (menu.children && menu.children.length > 0 && self.Config.HideChildren == 0) {
                var arr = ele.getElementsByTagName("ul");
                if (arr.length > 0) arr[0].style.display = "block";
            }
        });
    }

    //创建菜单元素
    function CreateMenuItem(menu, ul)
    {
        var li = document.createElement("li");
        ul.appendChild(li);

        if (typeof (_CurrentMenuCode) != "undefined" && _CurrentMenuCode == menu.MenuCode)
            li.className = "current-menu";

        li.Menu = menu;
        var a = document.createElement("a");
        if (menu.Url) {
            var url = menu.Url;
            if (url.indexOf("?") > 0)
                url += "&";
            else
                url += "?"
            url += "menucode=" + menu.MenuCode;
            a.href = url;

            //alert([window.location.href.toLowerCase(), url.toLowerCase().replace(/\.\./g, ""), window.location.href.toLowerCase().indexOf(url.toLowerCase().replace(/\.\./g, ""))])
            //让匹配的菜单为当前选中状态
            if (window.location.href.toLowerCase().indexOf(url.toLowerCase().replace(/\.\./g, "")) > 0)
            {
                var p = li.parentNode;
                while (p.tagName.toLowerCase() == "ul" || p.tagName.toLowerCase() == "li")
                {
                    if (p.tagName.toLowerCase() == "ul")
                        p.style.display = "block";
                    p = p.parentNode;
                }
                li.className = "curr";
            }
        }
        li.appendChild(a);

        var span_icon = document.createElement("span");
        span_icon.className = "menu-icon";
        if (menu.IconUrl) 
            $(span_icon).append("<img src=\"" + menu.IconUrl + "\" />");
        a.appendChild(span_icon);

        var span_text = document.createElement("span");
        span_text.className = "menu-text";
        span_text.innerHTML = menu.DisplayName;
        a.appendChild(span_text);

        if (menu.children && menu.children.length > 0 && self.Config.HideChildren == 0) {
            var span_more = document.createElement("span");
            span_more.className = "menu-more";
            a.appendChild(span_more);

            RescueCreateChild(menu, li);

            BindMenuEvent(li);
        }
    }
}

/**
* OrganizeMenu 将列表形式的菜单组织成有主子关系的

* @method OrganizeMenu
*/
H3PortalMenu.prototype.OrganizeMenu = function ()
{
    var redata = [];
    if (this.TempMenu) {
        for (var i = 0; i < this.TempMenu.length; i++) {
            if (!this.TempMenu[i].ParentObjectID) {
                var tempobj = {};
                for (var n in this.TempMenu[i])
                    tempobj[n] = this.TempMenu[i][n];
                redata.push(tempobj);
                this.FindChildren(tempobj, this.TempMenu);
            }
        }
    }
    this.Menu = redata;
}

/**
* FindChildren 将列表形式的菜单组织成有主子关系的

* @method FindChildren
*/
H3PortalMenu.prototype.FindChildren = function (obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].ParentObjectID && obj.ObjectID == list[i].ParentObjectID) {
            if (!obj.children)
                obj.children = [];
            var tempobj = {};
            for (var n in list[i])
                tempobj[n] = list[i][n];
            obj.children.push(tempobj);
            this.FindChildren(tempobj, list);
            continue;
        }
    }
}

/**
* FindLocation 查找级联菜单路径

* @method FindLocation
*/
H3PortalMenu.prototype.FindLocation = function ()
{
    var self = this;

    for (var i = 0; i < this.Menu.length; i++)
    {
        this.TempLocation = [];
        CreateMenuItem(this.Menu[i]);
    }

    //递归创建子菜单
    function RescueCreateChild(menu) {
        if (!menu.children || menu.children.length == 0 || self.Config.HideChildren == 1) return;        
        var list = menu.children;
        for (var i = 0; i < list.length; i++) {
            if (i > 0)
                self.TempLocation.splice(self.TempLocation.length - 1, 1);
            CreateMenuItem(list[i]);
        }
    }
    //创建菜单元素
    function CreateMenuItem(menu) {
        self.TempLocation.push(menu);
        if (menu.Url) {
            var url = menu.Url;
            if (url.indexOf("?") > 0)
                url += "&";
            else
                url += "?"
            url += "menucode=" + menu.MenuCode;
            //让匹配的菜单为当前选中状态
            if (window.location.href.toLowerCase().indexOf(url.toLowerCase().replace(/\.\./g, "")) > 0) {
                self.Location = self.TempLocation.concat();
            }
        }
        if (menu.children && menu.children.length > 0 && self.Config.HideChildren == 0) {
            RescueCreateChild(menu);
        }
    }
}