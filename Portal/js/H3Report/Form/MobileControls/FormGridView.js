// Label控件
(function ($) {
    //控件执行
    $.fn.FormGridView = function () {
        return $.ControlManager.Run.call(this, "FormGridView", arguments);
    };


    $.Controls.FormGridView = function (element, options, sheetInfo) {
        $.Controls.FormGridView.Base.constructor.call(this, element, options, sheetInfo);
    };

    $.Controls.FormGridView.Inherit($.Controls.BaseControl, {
        Render: function () {
            var that = this;

            if (!this.Visible) {
                $(this.Element).hide();
                return;
            }


            //var $btnArrow = $('<i class="icon my-icon my-icon-border my-icon-down"><i>');
            //$btnArrow.click(function () {
            //    $(this).toggleClass("my-icon-down").toggleClass("my-icon-up");
            //    var ishide = $(this).hasClass("my-icon-down");
            //    var $tar = $(that.Element);
            //    if (ishide) {
            //        $tar.find(".list").find(".sheet-control[data-defaultHide=true]").hide();
            //        $tar.find(".my-icon").not(this).removeClass("my-icon-up").addClass("my-icon-down");
            //        $tar.find(".hideBtn_text").text("更多");
            //    }
            //    else {
            //        $tar.find(".list").find(".sheet-control[data-defaultHide=true]").show();
            //        $tar.find(".my-icon").not(this).removeClass("my-icon-down").addClass("my-icon-up");
            //        $tar.find(".hideBtn_text").text("收缩");
            //    }
            //    GlobalScrollDelegate && GlobalScrollDelegate.resize();
            //    return false;
            //});
            this.$btnAddRow = null;
            if (this.Editable) {
                // 新增按钮
                this.$btnAddRow = $('<div style="position:relative;margin-top: -1px;"><button class="button button-full button-light add childitemadd bd-db" style="background-color:#fff;"><i class="icon icon-add"></i>添加' + $.trim(that.DisplayName) + '明细</button></div>');
                //this.$Title.after($btnAddRow.append($btnArrow));
                this.$Title.after(this.$btnAddRow);
                this.$btnAddRow.click(function () {
                    that.AddRow();
                });
            }
            else {
                this.$btnAddRow = $('<div style="position:relative;"><button class="button button-full button-light add childitemadd bd-bot">' + $.trim(that.DisplayName) + '</button></div>');
                //this.$Title.after($btnAddRow.append($btnArrow));
                this.$Title.after(this.$btnAddRow.hide());
                this.$btnAddRow.click(function () {
                    //$btnArrow.click();
                });
            }

            $(this.Element).addClass("SheetGridView");
            $(this.Element).find('table').hide();

            this.Index = 0;

            //获取所有的列
            this.$TemplateRow = $(this.Element).children('table').find('th>.sheet-control').clone();
            this.$TemplateRow.each(function () {
                $(this).removeClass("table_th").html("");
            });

            if (this.Value && this.Value.R && !$.isEmptyObject(this.Value.R)) {
                this.SetValue(this.Value.R);
                // 为了打开表单加速，但是影响了计算规则隐藏规则
                //var that = this;
                //that.$loading = $('<div class="grid-loading">[' + that.DisplayName + ']数据加载中...</div>').appendTo($(that.Element));
                //setTimeout(function () {
                //    that.SetValue(that.Value.R);
                //    that.$loading.remove();
                //}, 0);
            }

            if (this.Index === 0 && this.Editable) {
                this.AddRow();
            }
            this.$Title.hide();
        },

        SetValue: function (dataArray) {
            if ($.isEmptyObject(dataArray)) {
                return;
            }

            for (var i = 0; i < dataArray.length; i++) {
                this.AddRow(dataArray[i][this.DataField + ".ObjectId"].Value);
            }
        },

        AddRow: function (ObjectId, RowData, PreObjectId, $PreTr) {
            var that = this;

            that.Index++;
            //this.$Title.html(this.DisplayName + "(总计" + that.Index + "条记录)");

            var $new_tr = $("<div class='list'></div>");
            var $tar_tr = $("<div class='list-item'></div>");
            //$new_tr.append($tar_tr);
            if (ObjectId) {
                $new_tr.attr('data-ObjectId', ObjectId);
            }

            var $trTitle = $('<div class="item title trtitle bd-db">' + this.DisplayName + "明细(<span data-seq='" + that.Index + "'>" + that.Index + "</span>)" + '</div>');
            $new_tr.append($trTitle);

            $new_tr.append(this.$TemplateRow.clone());

            var defaultShowCount = 0;
            if (this.Editable) {
                //var $btnRow = $("<div class='button-bar''></div>");

                // 删除行
                var $btnRemoveRow = $("<button class='btn-sheet-del'>删除</button>");
                $btnRemoveRow.click(function () {
                    that.OnChange();
                    // 将行中控件的ControlManager删除，避免验证不通过
                    var controlManagers = $.ControlManager.ControlManagers;
                    $new_tr.find("div.sheet-control").each(function () {
                        for (var sheetId in controlManagers) {
                            if (sheetId == $(this).data($.ControlManager.SheetIDKey)) {
                                delete controlManagers[sheetId];
                                break;
                            }
                        }
                    });

                    $tar_tr.remove();
                    //$new_tr.remove();
                    that.Index--;
                    that.$Title.html(that.DisplayName + "(总计" + that.Index + "条记录)");

                    H3Config.GlobalScrollDelegate && H3Config.GlobalScrollDelegate.resize();
                    that.ReSetSeq();
                });
                $trTitle.append($btnRemoveRow);

                //复制行
                var $btnCopyRow = $("<button class='btn-sheet-del'>复制</button>");
                $btnCopyRow.click(function () {
                    that.AddRow(null, null, $new_tr.attr("data-ObjectId"), $new_tr);
                });
                $trTitle.append($btnCopyRow);

                // 添加行
                //var $btnAddRow = $("<button class='button button-light' style='border-top: 0;'><i class='icon ion-android-add'></i>添加</button>");
                //$btnAddRow.click(function () {
                //    that.AddRow(null, null, $new_tr.attr("data-ObjectId"));
                //});
                //$btnRow.append($btnAddRow);

                // 复制行
                //var $btnCopyRow = $("<button class='button button-light' style='color:#565656;border-top: 0;'><i class='icon ion-android-document'></i>复制</button>");
                //$btnCopyRow.click(function () {
                //    that.AddRow(null, null, $new_tr.attr("data-ObjectId"), $new_tr);
                //});
                //$btnRow.append($btnCopyRow);
                //$new_tr.append($btnRow);
            }

            if (PreObjectId) {
                $(this.Element).find("[data-ObjectId='" + PreObjectId + "']").parent(".list-item").after($tar_tr);
            }
            else {
                //$(this.Element).append($tar_tr);
                this.$btnAddRow.before($tar_tr);
            }

            $tar_tr.append($new_tr);
            $new_tr.find(".sheet-control").each(function (index) {
                var $controlManager = $(this).JControl();

                $controlManager.BindChange($.IGuid(), function () {
                    that.OnChange.apply(that, [$controlManager]);
                });
                if (RowData != null) {
                    if (RowData[$controlManager.DataField] != null) {
                        $controlManager.SetValue(RowData[$controlManager.DataField]);
                    }
                }
                else if ($PreTr != null) {
                    var $PreManager = $PreTr.find("div[data-DataField='" + $controlManager.DataField + "']").JControl();
                    var controlKey = $(this).attr("data-controlkey");
                    if (controlKey == "FormUser") {
                        $controlManager.SetValue($PreManager.GetUnitIDs());
                    }
                    else if (controlKey == "FormQuery") {
                        $controlManager.SetValue({
                            "ObjectId": $PreManager.GetValue(),
                            "Name": $PreManager.GetText()
                        });
                    }
                    else if (controlKey != "FormAttachment" && controlKey != "FormMap") { // 不复制附件,地图
                        $controlManager.SetValue($PreManager.GetValue());
                    }
                }

                if (index == 0) {
                    defaultShowCount = 0;
                }

                if (!$controlManager.Visible) {
                    $(this).hide();
                }
                else if ($(this).is(":visible")) {
                    if (!$controlManager.Required && defaultShowCount > 1) {
                        // 非必填
                        //$(this).hide();
                        $(this).attr("data-defaultHide", true);
                    }
                    else {
                        defaultShowCount++;
                        $(this).attr("data-defaultHide", false);
                    }
                }
            });

            //if ($new_tr.find(".sheet-control[data-defaultHide=true]").length > 0) {
            //    var $hide_tr = $('<div style="height:44px;position:relative;background-color: #fff;margin-top: -1px;border-top: 1px solid #e4e4e4;" class="bd-top"><div style="text-align: center;height: 44px;line-height: 44px;color:#cbd0d8;"><span class="hideBtn_text" >收缩</span><i class="icon toggleicon icon-arrow-up" style="margin-left: 2px;font-size: 16px;"></i></div></div>');
            //    $hide_tr.click(function (tar) {
            //        var that = $hide_tr;
            //        return function () {
            //            tar.find(".sheet-control[data-defaultHide=true]").slideToggle(function () {
            //                GlobalScrollDelegate && GlobalScrollDelegate.resize();
            //            });
            //            that.find(".toggleicon").toggleClass("icon-arrow-down").toggleClass("icon-arrow-up");

            //            if (that.find(".hideBtn_text").text() == "更多") {
            //                that.find(".hideBtn_text").text("收缩");
            //            }
            //            else {
            //                that.find(".hideBtn_text").text("更多");
            //            }
            //        }
            //    }($new_tr));
            //    $tar_tr.append($hide_tr);
            //}

            this.OnChange.apply(this, [$new_tr]);
            H3Config.GlobalScrollDelegate && H3Config.GlobalScrollDelegate.resize();
            this.ReSetSeq();
        },

        //重置序号
        ReSetSeq: function () {
            $(this.Element).find("span[data-seq]").each(function (i) {
                var index = i + 1;
                $(this).attr("data-seq", index).text(index);
            });
        },

        //
        GetCellManager: function (objectId, dataField) {
            if (objectId == null || !dataField) return;
            var $tr = $(this.Element).find("div.list[data-ObjectId='" + objectId + "']");
            if ($tr.length > 0) {
                return $tr.find("[data-DataField='" + dataField + "']").JControl();
            }
        },

        UpdateRow: function (objectId, rowData) {
            if (objectId == null || $.isEmptyObject(rowData)) return;
            var $tr = $(this.Element).find("div.list[data-ObjectId='" + objectId + "']");
            if ($tr.length > 0) {
                for (var key in rowData) {
                    var control = $tr.find("[data-DataField='" + key + "']").JControl();
                    if (control != null) {
                        control.SetValue(rowData[key]);
                    }
                }
            }
        },

        ClearRows: function () {
            $(this.Element).find("div[data-ObjectId]").parent('.list-item').remove();
            this.Index = 0;
        },

        GetValue: function () {
            var valArray = new Array();

            var $trs = $(this.Element).find(".list");
            for (var i = 0; i < $trs.length; i++) {
                var $tr = $($trs[i]);
                var rObjectId = $tr.attr("data-ObjectId");
                if (!rObjectId) continue;
                var rowVal = { ObjectId: rObjectId };
                var isNullRow = true;
                $tr.find("div[data-controlkey]").each(function () {
                    var manager = $(this).JControl();
                    var datafield = manager.DataField.split(".")[1];
                    var controlVal;

                    if (manager instanceof $.Controls.FormUser) {
                        controlVal = manager.GetUnitIDs();
                    }
                    else {
                        controlVal = manager.GetValue();
                    }

                    if (!$.isEmptyObject(controlVal) || controlVal != "" || controlVal == false) {
                        isNullRow = false;
                    }
                    rowVal[datafield] = controlVal;
                });
                if (!isNullRow) {
                    valArray.push(rowVal);
                }
            }
            return valArray;
        },

        // 数据验证
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            // 子表必填时，必需填写一行数据
            if (this.Required && val.length == 0) {
                this.AddInvalidText($(this.Element), "必填");
                return false;
            }

            this.RemoveInvalidText($(this.Element));
            return true;
        },

        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldresult = $.extend({}, this.ResponseContext.ReturnData[this.DataField]);
            if (!oldresult) {
                return {};
            }
            var value = this.GetValue();
            if (oldresult.Value.R != value) {
                result[this.DataField] = value;
                return result;
            }
            return {};
        }
    });
})(jQuery);