//定义一个Gallery播放class
function H3Gallery(imgSrcArray, jsaConfig, containerOrId, callback) {
    this.platform();
    this.browser();
    this.screen();

    this.SetContainer(containerOrId);
    this.SetConfig(jsaConfig);
    this.SetImageArray(imgSrcArray);
    this._callback = callback;
    this._touchedindex = -1;
    this._hastouched = null;
}

/*--initalize plat and base--*/
H3Gallery.prototype.platform = function () {
    if (this._platform)
        return this._platform;
    this._platform = {};
    this._platform.mobile = false;
    this._platform.pc = false;
    if (/Mobile/.test(navigator.userAgent) || /Android/.test(navigator.userAgent) || /iPad/.test(navigator.userAgent) || /iPhone/.test(navigator.userAgent))
        this._platform.mobile = true;
    else
        this._platform.pc = true;
    return this._platform;
}

H3Gallery.prototype.browser = function () {
    if (this._browser)
        return this._browser;
    var obj = {};
    obj.msie = /MSIE/.test(navigator.userAgent);
    obj.msie6 = /MSIE 6/.test(navigator.userAgent);
    obj.msie7 = /MSIE 7/.test(navigator.userAgent);
    obj.msie8 = /MSIE 8/.test(navigator.userAgent);
    obj.msie9 = /MSIE 9/.test(navigator.userAgent);
    obj.msie10 = /MSIE 10/.test(navigator.userAgent);
    obj.firefox = /Firefox/.test(navigator.userAgent);
    obj.opera = /Opera/.test(navigator.userAgent);
    obj.chrome = /Chrome/.test(navigator.userAgent);
    obj.safari = !obj.chrome && /Safari/.test(navigator.userAgent);
    obj.webkit = /WebKit/.test(navigator.userAgent);
    obj.html5 = false;
    if (document.createElement("canvas").getContext)
        obj.html5 = true;
    //obj.msieDown = obj.msie && !obj.msie6 && !obj.msie7 && !obj.msie8 && !obj.msie9 && !obj.msie10;
    obj.msieDown = obj.msie && !obj.msie6 && !obj.msie7 && !obj.msie8 && !obj.html5;
    this._browser = obj;
    return obj;
}

H3Gallery.prototype.screen = function () {
    if (this._screen)
        return this._screen;
    var obj = { width: 0, height: 0, scrollWidth: 0, scrollHeight: 0, offsetWidth: 0, offsetHeight: 0 };
    obj.width = window.screen.availWidth || window.screen.width;
    obj.height = window.screen.availHeight || window.screen.height;
    obj.scrollWidth = document.body.scrollWidth;
    obj.scrollHeight = document.body.scrollHeight;
    obj.offsetWidth = document.body.offsetWidth;
    obj.offsetHeight = document.body.offsetHeight;
    this._screen = obj;
    return obj;
}

/*--set config--*/
H3Gallery.prototype.SetImageArray = function (imgSrcArray) {
    this._imagearray = new Array();
    if (!imgSrcArray || typeof (imgSrcArray) != "object" || imgSrcArray.length == 0)
        return;
    //Check Valid
    for (var i = 0; i < imgSrcArray.length; i++) {
        var imgobj = imgSrcArray[i];
        if (!imgobj || typeof (imgobj) != "object" || !imgobj.src) {
            imgSrcArray.splice(i, 1);
            i--;
            continue;
        }
    }
    this._imagearray = imgSrcArray;
    for (var i = 0; i < this._imagearray.length; i++) {
        this._imagearray[i].index = i;
        if (typeof (this._imagearray[i].timeout) == "undefined")
            this._imagearray[i].timeout = 1000;
        if (typeof (this._imagearray[i].animatetime) == "undefined")
            this._imagearray[i].animatetime = 1000;
    }
}
H3Gallery.prototype.SetConfig = function (jsaConfig) {
    //{ShowIndex:true,IndexPosition:'lb|rb|rt|lt',ShowTooltip:true,TooltipPosition:'',...}
    this._config = { Width: 0, Height: 0, ShowIndex: false, IndexPosition: "rb", ShowTooltip: false, TooltipPosition: "lb", "AutoRun": true, Scale:true };
    if (!jsaConfig)
        return;
    var confignames = ["Width", "Height", "ShowIndex", "IndexPosition", "ShowTooltip", "TooltipPosition", "ForceHtml4", "AutoRun"];
    confignames = "," + confignames.join(",") + ",";
    for (var name in jsaConfig) {
        if (confignames.indexOf("," + name + ",") == -1)
            continue;
        this._config[name] = jsaConfig[name];
    }
    //adjust the mobile client
    if (this._platform.mobile && this._config.Width > 0 && this._config.Width > this._screen.offsetWidth) {
        var scale = this._screen.offsetWidth / this._config.Width;
        this._config.Height = Math.floor(this._config.Height * scale);
    }
}
H3Gallery.prototype.SetContainer = function (containerOrId) {
    this._container = null;
    if (!containerOrId)
        return;
    var c;
    if (typeof (containerOrId) == "string")
        c = document.getElementById(containerOrId);
    else if (containerOrId.tagName)
        c = containerOrId;
    if (!c)
        return;
    this._container = c;
}

/*--run--*/
H3Gallery.prototype.run = function (autorun) {
    if (!this._container)
        return;
    if (!this._imagearray || this._imagearray.length == 0) {
        this._container.style.display = "none";
        return;
    }
    if (!this._container.mainbox) {
        var div = document.createElement("div");
        div.style.width = this._config.Width + "px";
        div.style.height = this._config.Height + "px";
        this._container.appendChild(div);
        this._container.mainbox = div;
    }
    //this._autorun = autorun;
    this.play(0, !autorun);
}
H3Gallery.prototype.play = function (ix, showonly) {
    if (this._imagearray.length == 0 || this._config.Width == 0 || this._config.Height == 0)
        return;
    if (this._suspend)
        return;
    if (ix >= this._imagearray.length)
        ix = 0;
    var imgobj = this._imagearray[ix];
    var html5 = this._browser.html5 && !this._config["ForceHtml4"];
    var self = this;
    function _show() {
        if (!imgobj) return;
        if (imgobj.img)
            _deal(imgobj.img);
        var img = new Image();
        img.onload = function () {
            imgobj.img = img;
            _deal(img);
        }
        img.src = imgobj.src;
    }
    function _deal(img) {
        self._container.mainbox.innerHTML = "";
        if (html5) {
            var canvas = document.createElement("canvas");
            if (!self._config.Scale) {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.style.marginLeft = Math.floor((self._config.Width - img.width) / 2) + "px";
                canvas.style.marginTop = Math.floor((self._config.Height - img.height) / 2) + "px";
                var ctx = canvas.getContext("2d");
                ctx.save();
                ctx.drawImage(img, 0, 0);
                ctx.restore();
            }
            else {
                canvas.width = self._config.Width;
                canvas.height = self._config.Height;
                var scalex = canvas.width / img.width;
                var scaley = canvas.height / img.height;
                var ctx = canvas.getContext("2d");
                ctx.save();
                if (scalex >= 1 && scaley >= 1) {
                    ctx.drawImage(img, (canvas.width-img.width)/2,  (canvas.height-img.height)/2);
                }
                else {
                    if (scalex < scaley) {
                        ctx.scale(scalex, scalex);
                        ctx.drawImage(img, 0, (canvas.height - img.height * scalex));
                    }
                    else {
                        ctx.scale(scaley, scaley);
                        ctx.drawImage(img, (canvas.width - img.width * scaley), 0);
                    }
                }
                ctx.restore();
            }
            self.html5AnimateRoute(imgobj.animation, canvas, imgobj.animatetime);
        }
        else {
            //img.style.width = self._config.Width + "px";
            //img.style.height = self._config.Height + "px";
            if (!self._config.Scale) {
                img.style.width = img.width + "px";
                img.style.height = img.height + "px";
                img.style.marginLeft = Math.floor((self._config.Width - img.width) / 2) + "px";
                img.style.marginTop = Math.floor((self._config.Height - img.height) / 2) + "px";
            }
            else {
                var scalex = self._config.Width / img.width;
                var scaley = self._config.Height / img.height;
                if (scalex >= 1 && scaley >= 1) {
                    img.style.width = img.width + "px";
                    img.style.height = img.height + "px";
                    img.style.marginLeft = Math.floor((self._config.Width - img.width) / 2) + "px";
                    img.style.marginTop = Math.floor((self._config.Height - img.height) / 2) + "px";
                }
                else {
                    if (scalex < scaley) {
                        img.style.width = self._config.Width + "px";
                        img.style.height = self._config.Width * img.height / img.width + "px";
                        img.style.marginTop = Math.floor((self._config.Height - self._config.Width * img.height / img.width) / 2) + "px";
                    }
                    else {
                        img.style.width = self._config.Height * img.width / img.height + "px";
                        img.style.height = self._config.Height + "px";
                        img.style.marginLeft = Math.floor((self._config.Width - self._config.Height * img.width / img.height) / 2) + "px";
                    }
                }
            }
            self.html4AnimateRoute(imgobj.animation, img, imgobj.animatetime);
        }
        self.openurl(imgobj.linkto);
        self.showAttributes(imgobj);
    }
    _show();
    this._currindex = ix;
    if (!imgobj || imgobj.timeout <= 0 || this._imagearray.length == 1) {
        return;
    }
    if (showonly || this._suspend || !this._config.AutoRun)
        return;
    ix++;
    if (ix >= this._imagearray.length)
        ix = 0;
    this._playtimeout = setTimeout(function () {
        self.play(ix);
    }, imgobj.timeout);
}

H3Gallery.prototype.openurl = function (url) {
    var self = this;
    this._container.onclick = function () {
        if (!url) {
            return;
        }
        if (self._browser.firefox) {
            window.open(url);
            return;
        }
        var a = document.getElementById("jsa_click_helper");
        if (!a) {
            a = document.createElement("a");
            a.style.display = "none";
            a.innerHTML = "go";
            document.body.insertBefore(a, document.body.firstChild);
            //document.body.appendChild(a);
        }
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        if (self._browser.msie) {
            a.click();
        }
        else {
            //'opera,safari,google'
            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", false, true);
            a.dispatchEvent(evt);
        }
    }
}

H3Gallery.prototype.firstLoadAttributes = function () {
    if (this._hasloadattributes)
        return;
    var self = this;
    if (this._config.ShowTooltip) {
        var div = document.createElement("div");
        div.className = "tooltipbox";
        div.style.position = "absolute";
        div.style.width = this._config.Width + "px";
        div.style.height = "25px";
        div.style.top = "9px";
        switch (this._config.TooltipPosition) {
            case "lt":
                div.style.textAlign = "left";
                break;
            case "ct":
                div.style.textAlign = "center";
                break;
            case "rt":
                div.style.textAlign = "right";
                break;
            case "lb":
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "left";
                div.style.lineHeight = "25px";
                break;
            case "cb":
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "center";
                div.style.lineHeight = "25px";
                break;
            case "rb":
            default:
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "right";
                div.style.lineHeight = "25px";
                break;
        }
        var span = document.createElement("span");
        div.appendChild(span);
        div.textfield = span;
        div.fillText = function (text) {
            this.textfield.innerHTML = text;
        }
        this._container.appendChild(div);
        this._container.tooltipbox = div;
    }
    if (this._config.ShowIndex) {
        var div = document.createElement("div");
        div.className = "indexbox";
        div.style.position = "absolute";
        div.style.width = this._config.Width + "px";
        div.style.height = "25px";
        div.style.top = "9px";
        switch (this._config.IndexPosition) {
            case "lt":
                div.style.textAlign = "left";
                break;
            case "ct":
                div.style.textAlign = "center";
                break;
            case "rt":
                div.style.textAlign = "right";
                break;
            case "lb":
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "left";
                break;
            case "cb":
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "center";
                break;
            case "rb":
            default:
                div.style.top = (this._browser.msie7 ? (this._config.Height - 25) : (this._config.Height - 25)) + "px";
                div.style.textAlign = "right";
                break;
        }

        //加上播放与暂停
        var span = document.createElement("a");
        span.innerHTML = "&nbsp;"
        span.className = this._config.AutoRun ? "indexitem pause" : "indexitem play";
        span.onclick = function () {
            if (self._config.AutoRun) {
                self._config.AutoRun = !self._config.AutoRun;
                if (self._playtimeout) clearTimeout(self._playtimeout);
                this.className = "indexitem play";
                this.title = "播放";
                this._suspend = true;
            }
            else {
                self._config.AutoRun = !self._config.AutoRun;
                var ix = self._currindex;
                if (!ix && ix !== 0) ix = 0;
                else ix++;
                this._suspend = false;
                self.play(ix);
                this.className = "indexitem pause";
                this.title = "暂停";
            }
        }
        div.appendChild(span);

        this._indexitems = [];
        for (var i = 0; i < this._imagearray.length; i++) {
            var span = document.createElement("a");
            span.innerHTML = i + 1 + "";
            span.itemIndex = i;
            span.className = "indexitem";
            _attachitemevent(span);
            div.appendChild(span);
            this._indexitems.push(span);
        }

        div.onclick = function (e) {
            self.cancelBubble(e);
            return false;
        }

        this._container.appendChild(div);
        this._container.indexbox = div;
    }
    function _attachitemevent(span) {
        var ix = span.itemIndex;
        if (self._platform.pc) {
            //span.onmouseover = overORstart;
            span.onclick = overORstart;
            span.onmouseout = outORend;

        }
        else if (self._browser.webkit || self._browser.opera) {
            //mobile
            span.addEventListener("touchstart", function (evt) {
                if (self._hastouched) {
                    if (self._touchedindex == ix) {
                        outORend(evt);
                        self._hastouched = null;
                        self._touchedindex = -1;
                    }
                    else {
                        var tix = ix;
                        ix = self._touchedindex;
                        outORend(evt);
                        ix = tix;
                        overORstart(evt);
                        self._hastouched = true
                        self._touchedindex = ix;
                    }
                }
                else {
                    overORstart(evt);
                    self._hastouched = true
                    self._touchedindex = ix;
                }
            }, false);
        }

        function overORstart(evt) {
            if (evt && evt.preventDefault) evt.preventDefault();
            if (self._suspendtimeout)
                clearTimeout(self._suspendtimeout);
            if (self._playtimeout)
                clearTimeout(self._playtimeout);
            self._suspendtimeout = null;
            self._manualy = true;
            self.play(ix, true);
            self._suspend = true;
        }
        function outORend(evt) {
            if (!self._manualy)
                return;
            self._manualy = false;
            if (evt && evt.preventDefault) evt.preventDefault();
            if (self._suspendtimeout)
                clearTimeout(self._suspendtimeout);
            if (self._playtimeout)
                clearTimeout(self._playtimeout);
            self._suspend = false;
            var goix = self._currindex;
            if (!goix && goix !== 0) goix = 0;
            else goix++;
            self._suspendtimeout = setTimeout(function () {
                self.play(goix, !self._config.AutoRun);
            }, 1000);
        }
    }
    this._hasloadattributes = true;
}

H3Gallery.prototype.showAttributes = function (imgobj) {
    this.firstLoadAttributes();
    if (this._config.ShowIndex) {
        for (var i = 0; i < this._indexitems.length; i++) {
            this._indexitems[i].className = "indexitem";
        }
        this._indexitems[imgobj.index].className = "indexitem indexitemnow";
    }
    if (this._config.ShowTooltip) {
        this._container.tooltipbox.fillText(imgobj.tooltip || "");
    }
}

H3Gallery.prototype.html5AnimateRoute = function (animation, canvas, timeout) {
    if (!animation) {
        this._container.mainbox.appendChild(canvas);
        return;
    }
    switch (animation) {
        case "l2r":
            this.html5AnimateL2R(canvas, timeout);
            break;
        case "r2l":
            this.html5AnimateR2L(canvas, timeout);
            break;
        case "t2b":
            this.html5AnimateT2B(canvas, timeout);
            break;
        case "b2t":
            this.html5AnimateB2T(canvas, timeout);
            break;
        default:
            this._container.mainbox.appendChild(canvas);
            break;
    }
}
H3Gallery.prototype.html5AnimateL2R = function (canvas, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    function _doAnimate() {
        if (ix > 10)
            return;
        var _canvas;
        if (ix == 1)
            _canvas = document.createElement("canvas");
        else
            _canvas = c.firstChild;
        _canvas.width = canvas.width;
        _canvas.height = canvas.height;
        //new
        _canvas.style.marginLeft = canvas.style.marginLeft;
        _canvas.style.marginTop = canvas.style.marginTop;
        var _ctx = _canvas.getContext("2d");
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        var dh = canvas.height;
        var dw = canvas.width * ix / 10;
        _ctx.drawImage(canvas, 0, 0, dw, dh);
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(_canvas);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html5AnimateR2L = function (canvas, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    function _doAnimate() {
        if (ix > 10)
            return;
        var _canvas;
        if (ix == 1)
            _canvas = document.createElement("canvas");
        else
            _canvas = c.firstChild;
        _canvas.width = canvas.width;
        _canvas.height = canvas.height;
        //new
        _canvas.style.marginLeft = canvas.style.marginLeft;
        _canvas.style.marginTop = canvas.style.marginTop;
        var _ctx = _canvas.getContext("2d");
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        var dh = canvas.height;
        var dw = canvas.width * ix / 10;
        _ctx.drawImage(canvas, canvas.width - dw, 0, dw, dh);
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(_canvas);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html5AnimateT2B = function (canvas, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    function _doAnimate() {
        if (ix > 10)
            return;
        var _canvas;
        if (ix == 1)
            _canvas = document.createElement("canvas");
        else
            _canvas = c.firstChild;
        _canvas.width = canvas.width;
        _canvas.height = canvas.height;
        //new
        _canvas.style.marginLeft = canvas.style.marginLeft;
        _canvas.style.marginTop = canvas.style.marginTop;
        var _ctx = _canvas.getContext("2d");
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        var dh = canvas.height * ix / 10;
        var dw = canvas.width;
        _ctx.drawImage(canvas, 0, 0, dw, dh);
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(_canvas);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html5AnimateB2T = function (canvas, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    function _doAnimate() {
        if (ix > 10)
            return;
        var _canvas;
        if (ix == 1)
            _canvas = document.createElement("canvas");
        else
            _canvas = c.firstChild;
        _canvas.width = canvas.width;
        _canvas.height = canvas.height;
        //new
        _canvas.style.marginLeft = canvas.style.marginLeft;
        _canvas.style.marginTop = canvas.style.marginTop;
        var _ctx = _canvas.getContext("2d");
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        var dh = canvas.height * ix / 10;
        var dw = canvas.width;
        _ctx.drawImage(canvas, 0, _canvas.height - dh, dw, dh);
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(_canvas);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}

H3Gallery.prototype.html4AnimateRoute = function (animation, img, timeout) {
    if (!animation) {
        this._container.mainbox.appendChild(img);
        return;
    }
    switch (animation) {
        case "l2r":
            this.html4AnimateL2R(img, timeout);
            break;
        case "r2l":
            this.html4AnimateR2L(img, timeout);
            break;
        case "t2b":
            this.html4AnimateT2B(img, timeout);
            break;
        case "b2t":
            this.html4AnimateB2T(img, timeout);
            break;
        default:
            this._container.mainbox.appendChild(img);
            break;
    }
}
H3Gallery.prototype.html4AnimateL2R = function (img, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    var width = parseInt(img.style.width);
    var height = parseInt(img.style.height);
    function _doAnimate() {
        if (ix > 10)
            return;
        var dh = height;
        var dw = width * ix / 10;
        img.style.width = Math.floor(dw) + "px";
        //img.style.height = dh + "px";
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(img);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html4AnimateR2L = function (img, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    var width = parseInt(img.style.width);
    var height = parseInt(img.style.height);
    function _doAnimate() {
        if (ix > 10)
            return;
        var dh = height;
        var dw = width * ix / 10;
        img.style.width = Math.floor(dw) + "px";
        img.style.marginLeft = Math.ceil((self._config.Width - width) / 2) + width - Math.floor(dw) + "px";
        //if (ix == 10)
        //    img.style.marginLeft = Math.ceil((self._config.Width - width) / 2) + "px";
        //img.style.height = dh + "px";
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(img);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html4AnimateT2B = function (img, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    var width = parseInt(img.style.width);
    var height = parseInt(img.style.height);
    function _doAnimate() {
        if (ix > 10)
            return;
        var dh = height * ix / 10;
        var dw = width;
        //img.style.width = Math.floor(dw) + "px";
        img.style.height = Math.floor(dh) + "px";
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(img);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}
H3Gallery.prototype.html4AnimateB2T = function (img, timeout) {
    var time = 1000;
    if (timeout)
        time = timeout;
    var ts = time / 10;
    var ix = 1;
    var c = this._container.mainbox;
    if (this._animatetimeout) {
        clearTimeout(this._animatetimeout);
        this._animatetimeout = null;
    }
    var self = this;
    var width = parseInt(img.style.width);
    var height = parseInt(img.style.height);
    function _doAnimate() {
        if (ix > 10)
            return;
        var dh = height * ix / 10;
        var dw = width;
        //img.style.width = Math.floor(dw) + "px";
        img.style.height = Math.floor(dh) + "px";
        img.style.marginTop = Math.ceil((self._config.Height - height) / 2) + height - Math.floor(dh) + "px";
        //if (ix == 10)
        //    img.style.marginTop = "";
        if (ix == 1) {
            c.innerHTML = "";
            c.appendChild(img);
        }
        ix++;
        self._animatetimeout = setTimeout(_doAnimate, ts);
    }
    self._animatetimeout = setTimeout(_doAnimate, 1);
}

H3Gallery.prototype.cancelBubble = function (evt) {
    evt = window.event || evt;
    if (evt.stopPropagation)
        evt.stopPropagation();
    else
        evt.cancelBubble = true;
    if (evt.preventDefault)
        evt.preventDefault();
    evt.returnValue = false;
}