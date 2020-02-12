//选人控件
(function ($) {
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.FormUser = function () {
        return $.ControlManager.Run.call(this, "FormUser", arguments);
    };


    //选人控件数据,单个页面所有数据库共用
    //$.FormUserData = {
    //    //部门
    //    OrgUnitItems: {},
    //    //标签
    //    OrgTagItems: [],
    //    //部门用户:{部门ID:[]}
    //    DepUserItems: {},
    //    //用户
    //    UserItems: {},
    //};

    // 构造函数
    $.Controls.FormUser = function (element, ptions, sheetInfo) {
        //选择数据集合
        this.Units = {};
        //所有选择的元素
        this.UnitsElement = null;
        //搜索输入框元素
        this.SearchElement = null;
        this.SearchTxtElement = null;

        //组织机构容器
        this.SelectorPanel = null;
        this.OrgTreePanel = null;
        this.OrgListPanel = null;
        this.FormUserHandler = "/Sheet/SheetUserAction";
        $.Controls.FormUser.Base.constructor.call(this, element, ptions, sheetInfo);

    };

    // 继承及控件实现
    $.Controls.FormUser.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {

            // 当前选择的对象
            this.CurrentUnitOjbects = [];

            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            // 拥有者不能选部门
            if (this.DataField == "OwnerId") {
                this.OrgUnitVisible = false;
                $(this.Element).attr("data-OrgUnitVisible", false);
            }

            //拥有者，所属部门必填写
            if (this.DataField == "OwnerId" || this.DataField == "OwnerDeptId") {
                this.Required = true;
            }

            //渲染界面
            this.HtmlRender();

            //初始化默认值
            this.InitValue();

            //绑定事件
            this.BindEnvens();

            //添加业务服务对象
            this.AddSchema();
        },

        AddSchema: function () {
            if (this.DataField.toString().indexOf(".") > -1) {
                H3Config.GlobalSheetUser.addSchema(this.ObjectId + "." + this.DataField, this);
            }
            else {
                H3Config.GlobalSheetUser.addSchema(this.DataField, this);
            }
        },

        //初始化值
        InitValue: function () {
            if (this.Value) {
                if ($.isArray(this.Value) && this.Value.length == 0) {
                    return;
                }
                this.SetValue(this.Value);
                //执行关联配置
                if ($.SmartForm.ResponseContext.IsCreateMode) {
                    var val = this.Value.constructor == Array ? this.Value[0] : this.Value;
                    this.MappingControlsHandler(val);
                }
            }
        },

        CheckUnitValidate: function (Obj) {
            var newObj = Obj;
            var that = this;
            if ($.SmartForm.ResponseContext.IsCreateMode && this.UnitSelectRegion != "") {
                var UnitIds = [];
                if (Obj.constructor == Object) {
                    UnitIds.push(Obj.UnitId);
                } else if (Obj.constructor == Array) {
                    for (var i = 0; i < Obj.length; i++) {
                        if (Obj[i].constructor == Object) {
                            UnitIds.push(Obj[i].UnitId || Obj[i].ObjectId);
                        }
                        else if (Obj[i].constructor == String) {
                            UnitIds.push(Obj[i]);
                        }
                    }
                } else if (Obj.constructor == String) {
                    UnitIds.push(Obj);
                }
                //请求后台，判断Obj是否在给定范围内，如果在给定范围内则返回Unit对象，后续调用AddChoice
                var unitTemp = '';
                for (var i = 0; i < UnitIds.length; i++) {
                    unitTemp += UnitIds[i] + ';';
                }
                this.Ajax(
                   that.FormUserHandler,
                   "POST",
                   {
                       Command: "CheckUnitValidate",
                       UnitSelectionRange: that.UnitSelectionRange,
                       UnitIds: unitTemp
                   },
                   function (data) {
                       newObj = data.Result.UnitItems;
                   }, false);
            }
            return newObj;
        },
        //设置值
        SetValue: function (Obj) {
            if (Obj == void 0 || Obj == null || Obj == "") {
                this.ClearValue();
                return;
            }
            if (this.UnitSelectionRange)
                Obj = this.CheckUnitValidate(Obj);
            if (Obj.length == 0) {
                return;
            }
            //if (this.DataField == "OwnerId") {
            //    this.AddValue(Obj[0].ObjectId || Obj[0].UnitID);
            //} else
                if (Obj.constructor == Array || Obj.constructor == String) {
                this.AddValue(Obj);
            } else if (Obj.constructor == Object) {
                this.AddValue(Obj.ObjectId || Obj.UnitID);
            }
            this.OnChange();
        },

        //没有选中人时清空
        ClearValue: function () {
            var that = this;
            that.$Value.val('').attr('data-val', '');
            that.$SingleEditPanel.val('').attr('data-val', '');
            $(that.Element).find('p.user-dir').remove();
            that.CurrentUnitOjbects = [];
            this.OnChange();
        },

        AddValue: function (obj) {
            var that = this;
            that.CurrentUnitOjbects = [];

            if (obj == void 0) {
                return;
            }
            var ids = []
            if (obj.constructor == Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i].hasOwnProperty('ObjectId')) {
                        ids.push(obj[i].ObjectId);
                    } else if (obj[i].hasOwnProperty('UnitID')) {
                        ids.push(obj[i].UnitID);
                    } else {
                        ids.push(obj[i]);
                    }
                }
            }
            else {
                ids.push(obj);
            }
            if (ids.length > 0) {
                var param = { Command: "GetUserProperty", UnitID: JSON.stringify(ids) };
                that.Ajax(
                    that.FormUserHandler,
                    "POST",
                    param,
                    function (data) {
                        var dataUser = { Users: [], Departs: [], ShowUserTitle: false, ShowDepTitle: false };
                        var counts = { U: 0, D: 0, C: 0 };
                        for (var i = 0, len = data.length; i < len; i++) {
                            var d = data[i];
                            if (d.Type == 4) {
                                dataUser.Users.push(d);
                                counts.U++;
                            } else {
                                dataUser.Departs.push(d);
                                d.Type == 2 ? counts.D++ : counts.C++;
                            }
                        }
                        var text = counts.U > 0 ? counts.U + "人" : "";
                        text += counts.D > 0 ? counts.D + "部门" : "";
                        text += counts.C > 0 ? counts.C + "公司" : "";

                        SelectedUsers[that.DataField] = dataUser;
                        if (data && data.length>0) {
                            that.CurrentUnitOjbects = data;
                            $(that.Element).find('li.unit').remove();
                            $(that.Element).find('p.user-dir').remove();
                            if (that.Editable) {
                                var displayName = data[0].DisplayName;
                                var unitId = data[0].UnitID;
                                that.$SingleEditPanel.val(displayName).data('data-val', unitId);
                                that.$Value.val(unitId).data('data-val', unitId);
                            } else {
                                //that.$DisplayPanel.css("padding", 0);
                                //that.RenderUnit.apply(that, [data[0]]);
                                $(that.Element).css({ "flex-wrap": "wrap" }).find('li.unit').remove();
                                that.$DisplayPanel.css("padding", 0);
                                that.RenderUnit.apply(that, [data[0]]);
                                that.$InputBody.addClass("readonly");
                                //that.$description = $('<p class="user-dir">' + text + '<i class="icon-arrow-right"></i></p>');
                                //that.$DisplayPanel.before(that.$description);
                                //$(that.Element).find('div.ControlContent').prepend(that.$description);
                                //that.$DisplayPanel.parent(".ControlContent").after(that.$DisplayPanel);

                                ////绑定事件
                                //that.$description.unbind("click.description").bind('click.description', function () {
                                //    $.SmartForm.IonicFrameFormObj.$state.go('app.sheetuser', {
                                //        field: that.DataField, rowid: that.ObjectId, unitSelectionRange: that.UnitSelectionRange, showunactive: that.ShowUnActive, showDetail: true
                                //    });
                                //});

                                that.$Value.val(data[0].UnitID).data('data-val', data[0].UnitID);
                            }
                            //绑定事件
                            $(that.Element).find('li.unit').each(function () {
                                $(this).bind('click', function () {
                                    var dingId = $(this).attr('data-dingid');
                                    if (dingId) {
                                        $.IShowUserInfo(dingId.substr(0, dingId.indexOf('.')), H3Config.corpId);
                                    }
                                });
                            });
                           
                        }
                    },
                false//同步执行
                    );


            }

        },

        RenderUnit: function (unit) {
            var that = this;
            //判断unit类型
            if (unit.Type == 4) {
                //用户
                var dingId = unit.DingTalkAccount;
                var userName = unit.DisplayName;
                var userId = unit.UnitID;
                var avatar = unit.Avatar;
                //var $nodeli = $('<li class="node-unit unit" ></li>').attr('data-unitid', userId).attr('data-dingid', dingId);
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + userId + '" data-dingid="' + dingId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = null;
                if (avatar) {
                    $nodeAvatar = $('<img class="unit-avatar" src="' + avatar + '" />');
                } else {
                    $nodeAvatar = $('<div class="unit-avatar" style="background-color:#ff943e;">' + userName.substr(userName.length - 2) + '</div>');
                }
                var $name = $('<div class="node-name">' + userName + '</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                //判断状态
                that.$DisplayPanel.append($nodeli);
            } else if (unit.Type == 1) {
                //公司
                var displayName = unit.DisplayName;
                var unitId = unit.UnitID;
                //var $nodeli = $('<li class="node-unit unit"></li>').attr('data-unitid', unitId);
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + unitId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = $('<div class="unit-avatar" style="background-color:#ff943e;"><i class="icon icon-company"></i></div>');
                var $name = $('<div class="node-name">' + displayName + '</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                //判断状态
                that.$DisplayPanel.append($nodeli);
            } else if (unit.Type == 2) {
                //部门
                var displayName = unit.DisplayName;
                var unitId = unit.UnitID;
                var deptId=unit.DeptId;
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + unitId + '" data-deptid="' + deptId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = $('<div class="unit-avatar" style="background-color:#ff943e;"><i class="icon icon-department"></i></div>');
                var $name = $('<div class="node-name">' + displayName + '</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                that.$DisplayPanel.append($nodeli);
            }
        },

        //返回 {UnitID1:{UnitID: , Code:, DisplayName:Type, Icon ,ParentId},UnitID1:{UnitID: , Code:, DisplayName: }}对象
        GetValue: function () {
            return this.CurrentUnitOjbects;
        },

        GetUnitIDs: function () {
            return this.GetUnitIds();
        },

        //读取选中的UnitID
        GetUnitIds: function () {
            // var val = $(this.Element).find('input[id*="val_"]').attr('data-val');
            var val = $(this.$Value).val();
            if (val != null && val != void 0 && val.length > 0) {
                return val.replace(/(\;*$)/g, "").split(';');
            } 
            return [];
        },

        //获取显示
        GetText: function () {
            //if ($(this.Element).find('input[id*="val_"]').length > 0) {
            //    return $(this.Element).find('input[id*="val_"]').val();
            //} else {
            //    return $(this.Element).find('textarea[id*="val_"]').val();
            //}
            return $(this.$Value).val();

        },

        //保存数据
        SaveDataField: function () {
            var result = {};
            var oldResult = {};
            if (!this.Visible) return result;
            oldResult = this.DataItem;
            if (!oldResult) {
                return {};
            }

            var UnitIDs = this.GetUnitIDs();
            if (oldResult.Value != UnitIDs) {
                result[this.DataField] = UnitIDs;
                return result;
            }
            return {};
        },

        //渲染样式
        HtmlRender: function () {
            var text = this.Required ? "请选择(必填)" : "请选择";
            
            //if (this.IsMultiple) {
            //    this.$Value = $('<textarea class="bold"  placeholder="' + text + '" style="width:80%;float:left;" rows="3" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '" />');
            //} else {
            //    this.$Value = $('<input type="text" class="bold" placeholder="' + text + '" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '" />');
            //}
            //两种展示状态 编辑态 展示态
            this.$SingleEditPanel = $('<input type="text" class="bold" placeholder="' + text + '" readonly datafield="' + this.DataField + '" />');
            //this.$MultiEditPanel = $('<ul class="unit-edit-panel"></ul>');
            
            //隐藏的值存储框
            this.$Value = $('<textarea  style="display:none;"  readonly datafield="' + this.DataField + '"  />');
            //非编辑状态下的展示框
            this.$DisplayPanel = $('<ul class="unit-display-panel" ></ul>');
            this.$InputBody.append(this.$SingleEditPanel);
            //this.$InputBody.append(this.$MultiEditPanel);
            this.$InputBody.append(this.$DisplayPanel);
            this.$InputBody.append(this.$Value);

            !this.Editable && this.$InputBody.siblings(".ControlTitle").css({ "align-self": "flex-start", "padding": "5px 0" });
            if (this.Editable) {
                this.$DisplayPanel.hide();
            } else {
                this.$DisplayPanel.show();
                this.$SingleEditPanel.hide();
                //this.$MultiEditPanel.hide();
            }
            //编辑状态添加一个增加的图标
            this.$Flat = $('<i class=" icon icon-arrow-right" style="float:right;"></i>');
            this.$InputBody.append(this.$Flat);
            if (this.Editable) {
                this.$Flat.show();
                this.$InputBody.addClass('RightArrow');
            } else {
                this.$Flat.hide();
            }
            

            //this.$InputBody.addClass("RightArrow").append(this.$Value);

            //this.$flat = $('<i class=" icon ion-ios-arrow-right" style="float:right;"></i>');
            //if (this.IsMultiple) {
            //    this.$flat = $('<i class=" icon ion-ios-arrow-right" style="position: absolute; top: 50%; right: 15px; margin-top: -8px; font-size: 20px;"></i>');
            //    $(this.Element).find("span.ControlTitle").css({ "padding-top": "20px" });
            //}
            //this.$InputBody.append(this.$flat);
            //if (this.Editable) {
            //    $(this.$flat).show();
            //    this.$Value.css('background-color', '#fff');
            //    var $contnt = $(this.Element).find('div.ControlContent');
            //    if ($contnt.length > 0) {
            //        $contnt.removeClass('readonly');
            //    }
            //} else {
            //    $(this.$flat).hide();
            //    var $contnt = $(this.Element).find('div.ControlContent');
            //    if ($contnt.length > 0) {
            //        $contnt.addClass('readonly');
            //    }
            //}

        },

        //绑定事件
        BindEnvens: function () {
            var that = this;
            if (that.Editable) {
                if (!$.isEmptyObject(that.MappingControls) && !that.IsMultiple) {
                    that.BindChange("Sys_MappingControlsHandler", function () {
                        var val = that.GetValue();
                        if (val != null) {
                            for (var key in val) {
                                that.MappingControlsHandler.apply(that, [val[key]]);
                                break;
                            }
                        }
                    });
                }
            }
        },

        SetReadonly: function (flag) {
            
            if (flag) {
                ////隐藏掉链接
                //$(this.$link).hide();
                ////$(this.Element).find("input").attr("readonly", "readonly");
                //var $contnt = $(this.Element).find('div.ControlContent');
                //if ($contnt.length > 0) {
                //    $contnt.addClass('readonly');
                //}
                this.$EditPanel.hide();
                this.$DisplayPanel.show();
            }
            else {
                //$(this.$link).show();
                //var $contnt = $(this.Element).find('div.ControlContent');
                //if ($contnt.length > 0) {
                //    $contnt.removeClass('readonly');
                //}
                this.$EditPanel.hide();
                this.$DisplayPanel.show();
            }
        },

        ShowShelector: function () {
            if (this.$Modal) {
                this.$Modal.show();
                return;
            }
            this.$Modal = $("<div class='modal-backdrop'>");
            this.$Selector = $('<div class="nav-bar-block"></div>').css("height", "100%");

            this.$ionbar = $("<ion-header-bar class='bar-positive bar bar-header disable-user-behavior' align-title='center'></ion-header-bar>");
            this.$BtnBack = $("<button class='button back-button buttons  button-clear header-item'><i class='icon icon-back'></i></button>");
            this.$BtnDone = $("<button class='buttons buttons-right button button-icon icon ion-android-done buttons-right'></button>");
            this.$SelectorTitle = $('<div class="title title-center header-item" style="left: 100px; right: 100px;"></div>').text(this.DisplayName);

            this.$ionbar.append(this.$BtnBack);
            this.$ionbar.append(this.$SelectorTitle);
            this.$ionbar.append(this.$BtnDone);

            var $footer = $("<div class='bar bar-footer'>");
            var $ftbuttons = $('<div class="button-bar">');
            var $BtnShowDeps = $('<a class="button button-stable button-clear"  ><i class="ion-person-stalker" style="font-size:xx-large"></i></a>');
            var $BtnShowTags = $('<a class="button button-stable button-clear" ><i class="ion-android-contacts" style="font-size:xx-large"></i></a>');
            $footer.append($ftbuttons);
            $ftbuttons.append($BtnShowDeps);
            $ftbuttons.append($BtnShowTags);

            this.DepsDataPanel = $("<div>").addClass(" pane scroll list").css("margin-top", "45px").css("overflow-y", "auto").hide();
            this.UsersDataPanel = $("<div>").addClass(" pane scroll list").css("margin-top", "45px").css("overflow-y", "auto").hide();
            this.TagsDataPanel = $("<div>").addClass(" pane scroll list").css("margin-top", "45px").css("overflow-y", "auto").hide();

            this.$Selector.append(this.$ionbar);
            this.$Selector.append(this.DepsDataPanel);
            this.$Selector.append(this.UsersDataPanel);
            this.$Selector.append(this.TagsDataPanel);
            this.$Selector.append($footer);

            this.$Modal.append(this.$Selector);
            this.$Modal.appendTo("body");
            this.LoadDepsData();

            this.$BtnBack.unbind("click.SheetBack").bind("click.SheetBack", this, function (e) {
                var that = e.data;
                if (that.UsersDataPanel.is(":visible")) {
                    that.LoadDepsData();
                }
                else {
                    that.$Modal.hide();
                }
            });

            this.$BtnDone.unbind("click.SheetBack").bind("click.SheetBack", this, function (e) {
                var that = e.data;
                if (that.UsersDataPanel.is(":visible")) {
                    that.LoadDepsData();
                }
                else {
                    that.$Modal.hide();
                }
            });

            $BtnShowDeps.unbind("click.ShowDeps").bind("click.ShowDeps", this, function (e) {
                var that = e.data;
                that.LoadDepsData();
            });

            $BtnShowTags.unbind("click.ShowTags").bind("click.ShowTags", this, function (e) {
                var that = e.data;
                that.LoadTagsData();
            });
        },


        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && ($.isEmptyObject(val) || val.length == 0)) {
                this.AddInvalidText(this.$InputBody, "必填");
                return false;
            }

            this.RemoveInvalidText(this.$InputBody);
            return true;
        },

        //处理映射关系
        MappingControlsHandler: function (UnitObject) {
            if ($.isEmptyObject(this.MappingControls) || this.MappingControls == "") return;

            for (var property in this.MappingControls) {
                var targetFiled = this.MappingControls[property];
                var propertyVal = UnitObject[property] == void 0 ? "" : UnitObject[property];
                if (property.toLowerCase() == 'gender' && !isNaN(propertyVal)) {
                    propertyVal = propertyVal == 0 ? "未知" : (propertyVal == 1 ? "男" : "女");
                }
                $.ControlManager.SetControlValue(targetFiled, propertyVal);
            }
        }
    });
})(jQuery);