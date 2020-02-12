(function ($) {
    $.fn.FormMap = function () {
        return $.ControlManager.Run.call(this, "FormMap", arguments);
    };

    // 构造函数
    $.Controls.FormMap = function (element, ptions, sheetInfo) {
        $.Controls.FormMap.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.Controls.FormMap.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }

            this.Address = "";
            this.Point = { lat: 0, lng: 0 };

            
            //渲染界面
            this.HtmlRender();
            ////初始化默认值
            this.InitValue();
            //绑定事件
            this.BindEvent();
            
        },

        //界面渲染
        HtmlRender: function () {
            if (!this.Editable) {
                this.$Input = $("<pre>").css("border", "none");
                this.$InputBody.append(this.$Input);
            } else {
                this.$Input = $("<div>").css({ "padding-top": "5px", "padding-bottom": "5px", "border": "1px solid #ddd", "height": "30px", "border-bottom": 0, "border-radius": "3px 3px 0 0" });
                this.$InputBody.append(this.$Input);
                if (this.Value) {
                    var loc = JSON.parse(this.Value);
                    this.Address = loc.address;
                }
                this.$Input.append(" " + this.Address);
            }

            if (this.Editable) {
                // 悬浮 iframe
                this.$IframePanel = $("<div style='border:1px solid #ddd;'>").height("280px");
                this.$Iframe = $("<iframe >").height("100%").width("100%").attr("frameborder", 0);
                this.$Iframe.attr("src", "/Content/Mobile/Template/LocationMap.html?ismobile=false&rowid=" + (this.BizObjectId || "") + "&datafield=" + this.DataField + "&Range=" + this.Range + "&Address=" + this.Address);
                this.$IframePanel.append(this.$Iframe);
                this.$InputBody.append(this.$IframePanel);
            }
        },

        BindEvent: function () {
            var that = this;
            $(this.$Input).change(function () {
                that.Validate();
            });
        },
        InitValue: function () {
            if (this.Value) {
                try {
                    this.SetValue(JSON.parse(this.Value));
                } catch (ex) { }
            } else {
                this.$Input.append("pc端定位不准确，请到移动端进行定位！");
            }
        },

        SetValue: function (data) {
            this.Address = data.Address;
            this.Point = data.Point;
            this.$Input.html("");
            this.$Input.append(" " + this.Address);
            this.OnChange();
        },

        GetValue: function () {
            var pointData = {
                Address: this.Address,
                Point: this.Point
            };
            return JSON.stringify(pointData);
        },
        Validate: function () {
            var val = this.GetValue();
            var address = $.parseJSON(val).Address;
            if (this.Required && address.trim() == "") {
                this.AddInvalidText(this.$Input, "必填");
                return false;
            }
            this.RemoveInvalidText(this.$Input);
            return true;
        },
        //返回数据值
        SaveDataField: function () {
            if (this.Validate()) {
                var result = {};
                if (!this.Visible ) return result;
                var oldresult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
                if (!oldresult) {
                    return {};
                }

                if (("" + oldresult.Value) != this.GetValue()) {
                    result[this.DataField] = this.GetValue();
                    return result;
                }

                return {};
            }
        }
    });
})(jQuery);;