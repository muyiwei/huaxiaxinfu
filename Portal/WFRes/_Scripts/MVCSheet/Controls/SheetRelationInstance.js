// 关联流程实例控件
(function ($) {

    $.fn.SheetRelationInstance = function () {
        return $.MvcSheetUI.Run.call(this, "SheetRelationInstance", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetRelationInstance = function (element, ptions, sheetInfo) {
        this.RelationInstances = [];
        this.ModalId = "divModal_RelationInstance";
        this.LoadUrl = null;
        this.LinkUrl = null;
        this.InstanceTable = null;

        $.MvcSheetUI.Controls.SheetRelationInstance.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetRelationInstance.Inherit($.MvcSheetUI.IControl, {
        Render: function () {
            if (!this.Visiable) {
                $(this.Element).hide();
                return;
            }

            this.LoadUrl = this.PortalRoot + "/SelectInstance.aspx?InstanceId=" + this.SheetInfo.InstanceId + "&ID=" + this.Element.id;
            this.LinkUrl = this.PortalRoot + "/InstanceSheets.aspx";

            if (this.V) {
                this.GetInstancesFromValue();
            }

            this.RenderHistory();
            if (this.Editable) {
                this.RenderUpload();
            }
        },
        GetInstancesFromValue: function () {
            var instances = this.V.split("#,#");
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].indexOf("#_#") == -1) continue;
                var arr = instances[i].split("#_#");
                this.RelationInstances.push({ ObjectID: arr[0], InstanceId: arr[1], InstanceName: arr[2] });
            }
        },
        GetValueFromInstances: function () {
            var result = "";
            for (var i = 0; i < this.RelationInstances.length; i++) {
                if (i > 0) result += "#,#";
                result += this.RelationInstances[i].ObjectID + "#_#" + this.RelationInstances[i].InstanceId + "#_#" + this.RelationInstances[i].InstanceName;
            }
            return result;
        },
        RenderHistory: function () {
            // 初始化已经关联的文件
            if (this.InstanceTable == null) {
                var table = "<table class=\"table table-striped\" style=\"margin: 0px; min-height: 0px;\">";
                table += "<tbody>";
                table += "</tbody>";
                table += "</table>";
                this.InstanceTable = $(table);
                this.InstanceTable.appendTo($(this.Element));
            }
            this.InstanceTable.find("row").remove();
            // 增加行
            for (var i = 0; i < this.RelationInstances.length; i++) {
                this.AddItem(this.RelationInstances[i]);
            }
        },
        RenderUpload: function () {
            // 初始化上传按钮
            var id = this.Element.id || this.DataField;
            var html = "<div class=\"btn btn-outline btn-lg\" style=\"width: 100%; border: 1px dashed rgb(221, 221, 221);\" data-toggle=\"modal\" data-target=\"#" + this.ModalId + "\">";
            html += "点击绑定流程";
            html += "</div>";
            if ($("#" + this.ModalId).length == 0) {
                html += "<div id=\"" + this.ModalId + "\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" style=\"display: none;\" aria-hidden=\"true\">";
                html += "<div class=\"modal-dialog\" style=\"width:600px;height:452px;\">";
                html += "<div class=\"modal-content\" style=\"height:100%;\">";
                html += "<div class=\"modal-header\">";
                html += "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>";
                html += "<h4 class=\"modal-title\">请选择关联流程</h4>";
                html += "</div>";
                html += "<div class=\"modal-body\">";
                html += "<iframe id=\"frm_RelationInstance\" name=\"frm_RelationInstance\" scrolling=\"no\" frameborder=\"0\" style=\"width: 100%; height: 452px;\" src=\"" + this.LoadUrl + "\"></iframe>";
                html += "</div>";
                html += "</div>";
                html += "</div>";
                html += "</div>";
            }

            $(html).appendTo($(this.Element));
        },
        AddItem: function (instance) {
            var that = this;
            var linkUrl = this.LinkUrl + "?RelationID=" + encodeURI(instance.InstanceId);
            var row = "<tr id=\"" + instance.ObjectID + "\">";
            row += "<td>";
            row += "<a href=\"" + linkUrl + "\" target=\"_blank\"><i class=\"fa fa-angle-right\" style=\"padding-right:5px;\"></i>" + instance.InstanceName + "</a>";
            row += "</td>";
            if (this.Editable) {
                row += "<td class=\"printHidden\" style=\"text-align: center;width:60px;\">";
                row += "<a href=\"javascript:void(0);\" data-action=\"" + instance.ObjectID + "\" class=\"fa fa-minus\">删除</a>";
                row += "</td>";
            }
            row += "</tr>";
            $(row).appendTo(this.InstanceTable)
                  .find(".fa-minus").click(function () {
                      var id = $(this).data("action");
                      that.RemoveItem(id);
                  });
            // this.InstanceTable.append($(row));
        },
        AddNewItem: function (objectId, instanceId, instanceName) {
            var item = { ObjectID: objectId, InstanceId: instanceId, InstanceName: instanceName };
            this.RelationInstances.push(item);
            this.AddItem(item);
        },
        RemoveItem: function (objectId) {
            // 删除一项
            for (var i = 0; i < this.RelationInstances.length; i++) {
                if (this.RelationInstances[i].ObjectID == objectId) {
                    // 移除数组
                    this.RelationInstances.splice(i, 1);
                    // 移除行
                    this.InstanceTable.find("#" + objectId).remove();
                    break;
                }
            }
            if (window.frames["frm_RelationInstance"] && window.frames["frm_RelationInstance"].removeItemFromParent) {
                window.frames["frm_RelationInstance"].removeItemFromParent(objectId);
            }
        },
        RenderMobile: function () {
            this.Render();
            this.MoveToMobileContainer(this.Element);
        },
        // 数据验证
        Validate: function (effective, initValid) {
            if (!this.Editable) return true;
            if (initValid) {
                if (this.Required && this.RelationInstances < 1) {
                    this.AddInvalidText(this.Element, "*", false);
                    return false;
                }
            }
            if (!effective) {
                if (this.Required) {//必填的
                    if (this.RelationInstances < 1) {
                        this.AddInvalidText(this.Element, "*");
                        return false;
                    }
                }
            }

            this.RemoveInvalidText(this.Element);
            return true;
        },
        GetValue: function () {
            return this.RelationInstances;
        },
        SetValue: function (options) {
            $.extend(this.RelationInstances, options);
            this.RenderHistory();
        },
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;

            result[this.DataField] = this.DataItem;
            result[this.DataField].V = this.GetValueFromInstances();
            return result;
        }
    });
})(jQuery);