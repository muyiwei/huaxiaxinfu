/*
表单展现规则
Authine 2013-9
*/
Sheet.Format = function () {
    this.AttrName = "data-formatrule";
    this.init(this);
}

/*
*/
Sheet.Format.prototype = {
    init: function (o) {
        if (!this.sheet.container) {
            this.sheet.container = $("input[" + this.AttrName + "],span[" + this.AttrName + "]");
        }
        else {
            this.sheet.container = $(this.sheet.container.context).find("input[" + this.AttrName + "],span[" + this.AttrName + "]");
        }

        this.sheet.container.each(function (e) {
            // 子表模板中的不做处理
            if ($(this).closest("tr").length > 0 && $(this).closest("tr").hasClass("template")) return;

            var formatrule = $(this).attr(e.AttrName);
            if (formatrule) {
                $(this).blur(function () {
                    var param = { cmd: "GetFormatValue", Format: formatrule, InputValue: this.value || this.innerText };
                    var returnValue;
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: _PORTALROOT_GLOBAL + "/AjaxServices.aspx",
                        data: param,
                        dataType: "html",
                        success: function (data) {
                            returnValue = data;
                        },
                        error: function (e) {
                            var msg = e.toString();
                            alert(msg);
                        }
                    });
                    if (returnValue) {
                        if (this.value)
                            this.value = returnValue;
                        else
                            this.innerText = returnValue;
                    }
                }).focus(function () {
                    this.value = this.value.replace(/,/g, "").replace(/$/g, "").replace(/¥/g, "");
                });
            }
        }, [this]);
    }
}
