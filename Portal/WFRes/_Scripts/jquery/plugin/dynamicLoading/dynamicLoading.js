(function ($) {
    var load = {
        css: function (path, callback) {
            if (!path || path.length === 0) {
                throw new Error('argument "path" is required !');
            }
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = path;
            if (callback) {
                link.onload = callback;
            }
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        },
        js: function (path, callback) {
            if (!path || path.length === 0) {
                throw new Error('argument "path" is required !');
            }
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.src = path;
            if (callback) {
                script.onload = callback;
            }
            script.type = 'text/javascript';
            head.appendChild(script);
        }
    }

    var loadedFiles = [];

    $.dynamicLoading = function (files, callback) {
        if (!files) return;
        if (typeof (files) == "string") {
            files = [files];
        }

        var last = false;
        for (var index in files) {
            last = parseInt(index) == files.length - 1;
            if (loadedFiles.indexOf(files[index]) > -1) {
                if (last) {
                    callback.apply(this);
                }
                continue;
            }
            loadedFiles.push(files[index]);
            console.log("loading " + files[index]);
            var extension = files[index].substring(files[index].lastIndexOf(".") + 1);
            if (extension.toLowerCase() == "js") {
                load.js(files[index], last ? callback : null);
            }
            else if (extension.toLowerCase() == "css") {
                load.css(files[index], last ? callback : null);
            }
        }
    };
})($);