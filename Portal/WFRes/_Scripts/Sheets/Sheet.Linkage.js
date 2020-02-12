/*
表单联动规则，由 SheetBizDropDownList 控件进行实现
Authine 2013-9
*/
Sheet.Linkage = function (sheet) {
    this.LoadedValue = [];
    this.sheet = sheet;
    this.name = "linkage";
    this.init(this);
}

/*
computerule
*/
Sheet.Linkage.prototype = {
    init: function () {
        $("select").each(function (o) {
            var linkage = $(this).attr(o.name);
            if (linkage) {
                linkage = eval("({" + linkage + "})");
                o.registerEvent(this.id, linkage);
            }
        }, [this]);
    },
    // 注册计算事件主方法
    registerEvent: function (id, linkage) {
        // 检查是否已经注册事件
        // SchemaCode:'{0}',FilterMethod:'{1}',QueryCode:'{2}',QueryPropertyName:'{3}',FilterDataField:'{4}',TextDataField:'{5}',ValueDataField:'{6}',DefaultValue:'{7}'
        if (!linkage.FilterDataField) return;

        var arr = linkage.FilterDataField.split(",");
        // 当前下拉框值改变时，记录到隐藏域控件中
        $("#" + id).change(function () {
            var hiddens = $(this).parent().find("input[type='hidden']");
            hiddens.eq(0).val(this.value);
            hiddens.eq(1).val(this.text);
        });

        $.each(arr, function (obj) {
            if (!this.toString()) return;
            var filterCtrl = obj.sheet.findControlByDataField($("#" + id), this.toString());
            if (!filterCtrl) return;

            filterCtrl.unbind("change." + id).bind("change." + id, [obj], function (e) {
                // 默认不允许对应到空值
                // if (this.value == "") return;
                var queryValue = arr.length == 1 ? this.value :
                    e.data[0].sheet.getDataFieldValue($("#" + id), arr[0]) + "," + e.data[0].sheet.getDataFieldValue($("#" + id), arr[1]);

                e.data[0].selectChanged(
                {
                    TargetID: id,
                    SchemaCode: linkage.SchemaCode,
                    FilterMethod: linkage.FilterMethod,
                    QueryCode: linkage.QueryCode,
                    QueryPropertyName: linkage.QueryPropertyName,
                    QueryPropertyValue: queryValue,
                    TextDataField: linkage.TextDataField,
                    ValueDataField: linkage.ValueDataField,
                    DefaultValue: linkage.DefaultValue
                });
                // 手动触发 Change 事件，支持多级联动
                $("#" + id).change();
            });

            if (this.toString() == arr[arr.length - 1].toString()) {
                filterCtrl.change();
            }
        }, [this]);
    },
    selectChanged: function (options) {
        var defaultOptions = { cmd: "GetLinkageData" };
        $.extend(defaultOptions, options);
        if (!defaultOptions.QueryPropertyValue) {
            // 父对象为空值时
            var target = $("#" + defaultOptions.TargetID);
            target.find("option").each(function () {
                if (this.value) $(this).remove();
            });
            return;
        }

        // 查找缓存数据
        for (var i = 0; i < this.LoadedValue.length; i++) {
            if (this.LoadedValue[i].Code.SchemaCode == options.SchemaCode
                && this.LoadedValue[i].Code.QueryCode == options.QueryCode
                && this.LoadedValue[i].Code.QueryPropertyName == options.QueryPropertyName
                && this.LoadedValue[i].Code.QueryPropertyValue == options.QueryPropertyValue) {
                var target = $("#" + defaultOptions.TargetID);
                target.find("option").each(function () { if (this.value) $(this).remove(); });
                this.bindDropDownList(this.LoadedValue[i].Value, defaultOptions.DefaultValue, target);
                return;
            }
        }

        var bindDropDownList = this.bindDropDownList;
        var LoadedValue = {};
        $.ajax({
            type: "POST",
            async: false,
            url: _PORTALROOT_GLOBAL + "/AjaxServices.aspx",
            data: defaultOptions,
            dataType: "json",
            success: function (data) {
                var target = $("#" + defaultOptions.TargetID);
                // target.empty();
                target.find("option").each(function () {
                    if (this.value) $(this).remove();
                });
                bindDropDownList(data, defaultOptions.DefaultValue, target);
                LoadedValue = data;
                //var selected;
                //$.each(data, function (text, val) {
                //    selected = (val == defaultOptions.DefaultValue) ? " selected" : "";
                //    $("<option value='" + val + "'" + selected + ">" + text + "</optin>").appendTo(target);
                //});
            },
            error: function (msg) {
            }
        });
        this.LoadedValue.push({ Code: options, Value: LoadedValue });
    },
    bindDropDownList: function (data, defaultValue, target) {
        var selected;
        $.each(data, function (val, text) {
            selected = ($.trim(val) == $.trim(defaultValue) || $.trim(text) == $.trim(defaultValue)) ? " selected" : "";
            $("<option value='" + val + "'" + selected + ">" + text + "</optin>").appendTo(target);
        });
    }
}