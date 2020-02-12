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

            //初始化默认值
            this.InitValue();

        },

        //界面渲染
        HtmlRender: function () {
            this.$Input = $("<div style='font-size:16px;'>");
            this.$localMap = $("<i class='icon ion-location' style='float:right; margin-right:0px; font-size:18px;color:#ccc;'></i>");
            this.Editable && this.$Input.append(this.$localMap);
            this.$InputBody.append(this.$Input);

            if (this.Editable) {
                var that = this;
                //添加默认值
                if (!this.Value) {
                    if (typeof (dd) != "undefined" && typeof (dd.biz) != "undefined" & typeof (dd.biz.map) != "undefined") {
                        dd.device.geolocation.get({
                            targetAccurace: 200,
                            coordinate: 1,
                            withReGeocode: true,
                            onSuccess: function (result) {
                                var rowid = that.BizObjectId || "";
                                var datafield = that.DataField;
                                //子表字段
                                if (rowid != null && rowid != "") {
                                    $element = $("div.list[data-ObjectId='" + rowid + "']").find('div[data-datafield="' + datafield + '"]');
                                }
                                else {
                                    $element = $('div[data-datafield="' + datafield + '"][data-controlkey="FormMap"]');
                                }
                               
                                var poidata = {
                                    Address: result.address,
                                    Point: { lat: result.latitude, lng: result.longitude }
                                };
                                var sheetMap = $element.JControl();
                                sheetMap.SetValue(poidata);
                            }
                        });
                    }
                   
                }

                $(this.Element).unbind('click').bind('click', function () {
                    if (typeof (dd) != "undefined" && typeof (dd.biz) != "undefined" & typeof (dd.biz.map) != "undefined") {
                        dd.device.geolocation.get({
                            targetAccurace: 200,
                            coordinate: 1,
                            withReGeocode: false,
                            onSuccess: function (result) {
                                if (that.Range == '0') {
                                    dd.biz.map.search({
                                        latitude: result.latitude,
                                        longitude: result.longitude,
                                        scope: 500,
                                        onSuccess: function (poi) {

                                            var $element;
                                            var rowid = that.BizObjectId || "";
                                            var datafield = that.DataField;
                                            //子表字段
                                            if (rowid != null && rowid != "") {
                                                $element = $("div.list[data-ObjectId='" + rowid + "']").find('div[data-datafield="' + datafield + '"]');
                                            }
                                            else {
                                                $element = $('div[data-datafield="' + datafield + '"][data-controlkey="FormMap"]');
                                            }
                                            var street = poi.snippet == null ? '' : poi.snippet;
                                            var address = poi.city + poi.adName + street + poi.title;

                                            var poidata = {
                                                Address: address,
                                                Point: { lat: poi.latitude, lng: poi.longitude }
                                            };
                                            var sheetMap = $element.JControl();
                                            sheetMap.SetValue(poidata);
                                        },
                                        onFail: function () { }
                                    });
                                } else {
                                    dd.biz.map.locate({
                                        latitude: result.latitude,
                                        longitude: result.longitude,
                                        onSuccess: function (poi) {
                                            var $element;
                                            var rowid = that.BizObjectId || "";
                                            var datafield = that.DataField;
                                            //子表字段
                                            if (rowid != null && rowid != "") {
                                                $element = $("div.list[data-ObjectId='" + rowid + "']").find('div[data-datafield="' + datafield + '"]');
                                            }
                                            else {
                                                $element = $('div[data-datafield="' + datafield + '"][data-controlkey="FormMap"]');
                                            }
                                            var street = poi.snippet == null ? '' : poi.snippet;
                                            var address = poi.city + poi.adName + street + poi.title;

                                            var poidata = {
                                                Address: address,
                                                Point: { lat: poi.latitude, lng: poi.longitude }
                                            };
                                            var sheetMap = $element.JControl();
                                            sheetMap.SetValue(poidata);
                                        },
                                        onFail: function () { }
                                    });
                                }

                            },
                            onFail: function (err) {

                            }
                        });
                    } else {
                        if (H3Config.GlobalState) {
                            H3Config.GlobalState.go('app.map', { rowid: (that.BizObjectId || ""), datafiled: that.DataField });
                        }
                    }
                });
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
            } else {
                var $contnt = $(this.Element).find('div.ControlContent');
                this.$Input.addClass("ta-readonly");
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
        },

        InitValue: function () {
            if (this.Value) {
                this.SetValue(JSON.parse(this.Value));
            }
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

        SetValue: function (data) {
            this.Address = data.Address;
            this.Point = data.Point;
            this.$Input.html("");
            //手机显示，当超过16个字符时自动换行
            var newaddress = "<div style='text-align: left;'>";
            this.Editable && (newaddress = "<div style='text-align: left;'>");
            if (this.Address != void 0) {
                for (var i = 0; i < this.Address.length; i++) {
                    newaddress += this.Address[i];
                }
            }
            newaddress += "</div>"

            this.Editable && this.$Input.append(this.$localMap);
            this.$Input.addClass("ta-readonly"); //自动换行
            this.$Input.append(newaddress);
            this.OnChange();
        },

        GetValue: function () {
            var pointData = {
                Address: this.Address,
                Point: this.Point
            };

            return JSON.stringify(pointData);
        },

        // 数据验证
        Validate: function () {
            if (!this.Editable) return true;

            if (this.Required) {
                if (this.Address == null || this.Address == "") {
                    this.AddInvalidText(this.$Input, "必填");
                    return false;
                }
            }
            return true;
        },

        //返回数据值
        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (!this.Visible ) return result;
            oldResult = $.Controls.GetSheetDataItem(this.DataField, $(this.Element));
            if (!oldResult) {
                return {};
            }

            if (("" + oldResult.Value) != this.GetValue()) {
                result[this.DataField] = this.GetValue();
                return result;
            }

            return {};
        }
    });
})(jQuery);;