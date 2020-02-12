//选人控件
(function ($) {
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.FormMultiUser = function () {
        return $.ControlManager.Run.call(this, "FormMultiUser", arguments);
    };


    //选人控件数据,单个页面所有数据库共用
    //$.FormMultiUserData = {
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
    $.Controls.FormMultiUser = function (element, ptions, sheetInfo) {
        this.MultiUserData = {
            //部门
            OrgUnitItems: {},
            //标签
            OrgTagItems: [],
            //部门用户:{部门ID:[]}
            DepUserItems: {},
            //用户
            UserItems: {},
        };

        this.Colors = ['#17C295', '#4DA9EB', '#F7B55E', '#F2725E', '#568AAD', '#B38979', '#8A8A8A'];
        this.ColorLength = this.Colors.length;
        this.UserIndex = 0;
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
        this.FormMultiUserHandler = "/Sheet/SheetUserAction";
        $.Controls.FormMultiUser.Base.constructor.call(this, element, ptions, sheetInfo);

    };

    // 继承及控件实现
    $.Controls.FormMultiUser.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否可见
            if (!this.Visible) { $(this.Element).hide(); return; }
            //渲染界面
            this.HtmlRender();

            //绑定事件
            this.BindEnvens();

            //初始化默认值
            this.InitValue();

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
                this.SetValue(this.Value);
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
                            UnitIds.push(Obj[i].UnitId);
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
            this.UserIndex = 0;

            if (Obj == undefined || Obj == null || Obj == "" || Obj.length == 0) {
                this.ClearValue();
                return;
            }
            if (this.UnitSelectionRange)
                Obj = this.CheckUnitValidate(Obj);

            if (this.DataField == "OwnerId") {
                this.AddValue(Obj[0].ObjectId || Obj[0].UnitID);
            }
            else if (Obj.constructor == Array || Obj.constructor == String) {

                this.AddValue(Obj);
            }
            else if (Obj.constructor == Object) {
                this.AddValue(Obj.ObjectId || Obj.UnitID);
            }
            this.OnChange();
        },
        //没有选中人时清空
        ClearValue: function () {
            this.UserIndex = 0;
            var that = this;
            $(this.$Value).attr('data-val', '').val('');
            if (that.Editbale) {
                $(that.$MultiEditPanel).find('li.unit').remove();
            } else {
                $(that.$DisplayPanel).find('li.unit').remove();
            }
        },

        //返回 {UnitID1:{UnitID: , Code:, DisplayName:Type, Icon ,ParentId},UnitID1:{UnitID: , Code:, DisplayName: }}对象
        GetValue: function () {
            var val = $(this.$Value).val();
            if (val != null && val != void 0 && val.length > 0) {
                return val.replace(/(\;*$)/g, "").split(';');
            } 
            return [];
        },

        AddValue: function (obj) {
            var that = this;
            if (obj == void 0) {
                return;
            }
            var ids = []
            if (obj.constructor == Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i].hasOwnProperty('ObjectId')) {
                        ids.push(obj[i].ObjectId);
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
                this.Ajax(
                    that.FormMultiUserHandler,
                    "POST",
                    param,
                    function (data) {
                        if (data) {
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
                            var text = counts.U > 0 ? counts.U + "人、" : "";
                            text += counts.D > 0 ? counts.D + "部门、" : "";
                            text += counts.C > 0 ? counts.C + "公司" : "";
                            text = text.replace(/(^、*)|(、*$)/g, "");

                            if (dataUser.Departs.length > 0 && dataUser.Users.length > 0) {
                                dataUser.ShowDepTitle = true;
                                dataUser.ShowUserTitle = true;
                            }

                            SelectedUsers[that.DataField] = dataUser;
                            //that.AddUserData.apply(that, [data]);
                            //that.AddUserID.apply(that, [UserID]);
                            //var display = "", value = "";
                            //if (data != null && data != void 0 && data.length > 0) {
                            //    for (var i = 0; i < data.length; i++) {
                            //        display += data[i].DisplayName + ";"
                            //        value += data[i].UnitID + ";"
                            //    }
                            //}
                            //if (display != "") {
                            //    display = display.substr(0, display.length - 1);
                            //    value = value.substr(0, value.length - 1);
                            //}

                            ////$(that.Element).find('span[id*="text_"]').html(display);
                            //$(that.Element).find('input[id*="val_"]').attr('data-val', value).val(display).show();
                            //$(that.Element).find('textarea[id*="val_"]').attr('data-val', value).css({ 'display': "inline-block", "border": "1px solid #fff" }).val(display).show();
                            //if (!$.isEmptyObject(that.MappingControls) && !that.IsMultiple) {
                            //    that.MappingControlsHandler(data[0]);
                            //}
                            var value = "";
                            if (that.Editable) {
                                $(that.Element).find('li.unit').remove();
                                for (var i = 0, len = data.length; i < len; i++) {
                                    that.RenderUnit.apply(that, [data[i]]);
                                    value += data[i].UnitID + ";"
                                }
                            } else {
                                $(that.Element).css({ "flex-wrap": "wrap" }).find('li.unit').remove();
                                that.$DisplayPanel.css("padding", 0);
                                //if (data.length > 3) {
                                //    var count = 0;
                                //    //非编辑状态最多只显示三个（aa等多少个人）
                                //    for (var i = 0, len = data.length; i < len; i++) {
                                //        count++;
                                //        if (count <= 3) {
                                //            that.RenderUnit.apply(that, [data[i]]);
                                //        }
                                //        value += data[i].UnitID + ";"
                                //    }
                                //} else {
                                
                                var max = Math.floor($(that.Element).width() / 60);
                                max = Math.max(max, 5);

                                for (var i = 0, len = data.length; i < len; i++) {
                                    value += data[i].UnitID + ";"
                                    if (i < max) {
                                        that.RenderUnit.apply(that, [data[i]]);
                                    }
                                }
                                //}
                                if (data.length > 4) {
                                    if (data.length > max) {
                                        if (that.$description) {
                                            that.$description.unbind("click.description").html(text + '<i class="icon-arrow-right"></i>');
                                        } else {
                                            that.$description = $('<p class="user-dir">' + text + '<i class="icon-arrow-right"></i></p>');
                                            that.$DisplayPanel.before(that.$description);
                                        }
                                        //绑定事件
                                        that.$description.unbind("click.description").bind('click.description', function () {
                                            H3Config.GlobalState.go('app.sheetuser', {
                                                field: that.DataField, rowid: that.ObjectId, unitSelectionRange: that.UnitSelectionRange, showunactive: that.ShowUnActive, showDetail: true
                                            });
                                        });
                                    }
                                    var $parCon = that.$DisplayPanel.parent(".ControlContent");
                                    $parCon.length > 0 && $parCon.after(that.$DisplayPanel);

                                } else {
                                    that.$DisplayPanel.removeClass("unit-display-panel").addClass("clearfix").addClass("ulrow");
                                    that.$InputBody.addClass("readonly");
                                }

                            } 
                            
                            if (value) {
                                value = value.substr(0, value.length - 1);
                            }
                            that.$Value.val(value).attr('data-val', value);
                            //绑定事件
                            $(that.Element).find('li.unit').each(function () {
                                $(this).click(function () {
                                    //是否可编辑状态
                                    if (that.Editable) {
                                        //点击移除
                                        var unitId = $(this).attr('data-unitid');
                                        if (unitId) {
                                            var value = $(that.$Value).val();
                                            value = value.replace(unitId, '');
                                            $(that.$Value).val(value).attr('data-val', value);
                                            $(this).remove();
                                        }

                                    } else {
                                        var dingId = $(this).attr('data-dingid');
                                        if (dingId) {
                                            $.IShowUserInfo(dingId.substr(0, dingId.indexOf('.')), H3Config.corpId);
                                        }
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
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + userId + '" data-dingid="' + dingId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = null;
                if (avatar) {
                    $nodeAvatar = $('<img class="unit-avatar" src="' + avatar + '" />');
                } else {
                    $nodeAvatar = $('<div class="unit-avatar" style="background-color:' + that.Colors[that.UserIndex % that.ColorLength] + '">' + userName.substr(userName.length - 2) + '</div>');
                }
                var $name = $('<div class="node-name">'+userName+'</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                //判断状态
                if (that.Editable) {
                    $nodeli.insertBefore(that.$plus);
                } else {
                    that.$DisplayPanel.append($nodeli);
                }
            } else if (unit.Type == 1) {
                //公司
                var displayName = unit.DisplayName;
                var unitId = unit.UnitID;
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + unitId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = $('<div class="unit-avatar" style="background-color:' + that.Colors[that.UserIndex % that.ColorLength] + '"><i class="icon icon-company"></i></div>');
                var $name = $('<div class="node-name">' + displayName + '</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                if (that.Editable) {
                    $nodeli.insertBefore(that.$plus);
                } else {
                    that.$DisplayPanel.append($nodeli);
                }
            } else if (unit.Type == 2) {
                //部门
                var displayName = unit.DisplayName;
                var unitId = unit.UnitID;
                var deptId = unit.DeptId;
                var $nodeli = $('<li class="node-unit unit" data-unitid="' + unitId + '" data-deptid="' + deptId + '"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head"></div>');
                var $nodeAvatar = $('<div class="unit-avatar" style="background-color:' + that.Colors[that.UserIndex % that.ColorLength] + '"><i class="icon icon-department"></i></div>');
                var $name = $('<div class="node-name">' + displayName + '</div>');
                $entity.append($head);
                $head.append($nodeAvatar);
                $entity.append($name);
                $nodeli.append($entity);
                if (that.Editable) {
                    $nodeli.insertBefore(that.$plus);
                } else {
                    that.$DisplayPanel.append($nodeli);
                }
            }

            that.UserIndex++;
        },

        //读取选中的UnitID
        GetUnitIDs: function () {
            //return this.GetValue();
            var ValObjs = this.GetValue();
            var UintIDs = new Array();
            //for (var i in ValObjs) {
            //    UintIDs.push(ValObjs[i]);
            //}
            return UintIDs.concat(ValObjs);
        },

        //获取显示
        GetText: function () {
            if ($(this.Element).find('input[id*="val_"]').length > 0) {
                return $(this.Element).find('input[id*="val_"]').val();
            } else {
                return $(this.Element).find('textarea[id*="val_"]').val();
            }

        },

        //保存数据
        SaveDataField: function () {
            var result = {};
            if (!this.Visible) return result;
            var oldresult = this.DataItem;
            if (!oldresult) {
                return {};
            }

            var UnitIDs = this.GetUnitIDs();
            if (oldresult.Value != UnitIDs && UnitIDs != null && UnitIDs.length > 0) {
                result[this.DataField] = UnitIDs;
                return result;
            }
            return {};
        },

        //渲染样式
        HtmlRender: function () {
            var text = this.Required ? "请选择(必填)" : "请选择";
            //if (this.IsMultiple) {
            //    this.$Value = $('<textarea class="bold" style="width:100%;float:left; text-align:right;min-height:20px;" placeholder="' + text + '" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '" />');
            //}
            var that=this;
            this.$Value = $('<textarea class="bold" style="display:none;" placeholder="' + text + '" readonly datafield="' + this.DataField + '" id="val_' + this.DataField + '" />');
            this.$MultiEditPanel = $('<ul class="unit-edit-panel"></ul>');
            this.$DisplayPanel = $('<ul class="unit-display-panel" ></ul>');
            if (this.Editable) {
                this.$MultiEditPanel.show();
                $(this.Element).css('flex-wrap', 'wrap').find("span.has-input").css('font-size', '16px').removeClass('ControlTitle').append("<i class='title-dir'>(点击头像可删除)</i>");
               
                //$(this.Element).find("span.has-input").css('font-size', '16px').removeClass('ControlTitle').append("<i class='title-dir'>(点击头像可删除)</i>");
                this.$InputBody.css({ 'width': '100%' });

                //添加+号
                this.$plus = $('<li class="node-plus node-unit"></li>');
                var $entity = $('<div class="node-entity"></div>');
                var $head = $('<div class="node-head node-empty"><div class="unit-avatar"><i class="icon icon-add"></i></div></div>');
                this.$plus.append($entity);
                $entity.append($head).append('<div class="node-name">添加</div>');
                this.$MultiEditPanel.append(this.$plus);
                //绑定事件
                this.$plus.bind('click', function () {
                    H3Config.GlobalState.go('app.sheetuser', { field:that.DataField , rowid: that.ObjectId, unitSelectionRange: that.UnitSelectionRange, showunactive: that.ShowUnActive });
                });
            } else {
                this.$DisplayPanel.show();
                this.$MultiEditPanel.hide();
            }
            this.$InputBody.append(this.$Value).append(this.$MultiEditPanel).append(this.$DisplayPanel);

            //this.$InputBody.addClass("RightArrow").append(this.$Value);
            //this.Editable && this.$Value.css("padding-right", '12px');
            //this.$flat = $('<i class=" icon ion-ios-arrow-right" style="float:right;"></i>');
            //if (this.IsMultiple) {
            //    this.$flat = $('<i class=" icon ion-ios-arrow-right m-arrow-right"></i>');
            //    $(this.Element).find("span.ControlTitle").css({ "padding-top": "8px" });
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
            if (this.Editable) {

                //this.$Toogle.unbind("click.FormUser").bind("click.FormUser", this, function (e) {
                //    var that = e.data;
                //    that.ShowShelector.apply(that);
                //});

            }
        },

        Reset: function () {
            $(this.Element).find('input[datafield="' + this.DataField + '"]').attr('data-val', '').val('').hide();
            $(this.Element).find('textarea[datafield="' + this.DataField + '"]').attr('data-val', '').val('').hide();
        },

        SetReadonly: function (flag) {
            if (flag) {
                //隐藏掉链接
                $(this.$link).hide();
                //$(this.Element).find("input").attr("readonly", "readonly");
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.addClass('readonly');
                }
            }
            else {
                $(this.$link).show();
                var $contnt = $(this.Element).find('div.ControlContent');
                if ($contnt.length > 0) {
                    $contnt.removeClass('readonly');
                }
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


        //添加:UserID/UserCode
        AddUserID: function (UserID) {
            var that = this;

            var ids = []
            if (UserID.constructor == Array) {
                for (var i = 0; i < UserID.length; i++) {
                    var id = UserID[i];
                    if (!that.MultiUserData.UserItems[id]) {
                        ids.push(id);
                    }
                }
            }
            else {
                if (!that.MultiUserData.UserItems[UserID]) {
                    ids.push(UserID);
                }
                else {
                    that.AddChoice(that.MultiUserData.UserItems[UserID]);
                }
            }
            if (ids.length > 0) {
                var param = { Command: "GetUserProperty", UnitID: JSON.stringify(ids) };
                this.Ajax(
                    that.FormMultiUserHandler,
                    "POST",
                    param,
                    function (data) {
                        if (data) {
                            that.AddUserData.apply(that, [data]);
                            that.AddUserID.apply(that, [UserID]);
                        }
                    },
                    false//同步执行
                    );
            }
            else if (UserID.constructor == Array) {
                for (var i = 0; i < UserID.length; i++) {
                    var id = UserID[i];
                    if (that.MultiUserData.UserItems[id]) {
                        that.AddChoice(that.MultiUserData.UserItems[id]);
                    }
                }
            }
        },

        //添加用户数据
        AddUserData: function (UnitItems) {
            for (var i = 0; i < UnitItems.length; i++) {
                this.MultiUserData.UserItems[UnitItems[i].UnitID] = UnitItems[i];
            }
        },

        //添加选择:UnitObject = {UnitID: , Code:, DisplayName: ,Type ：};
        AddChoice: function (UnitObject) {
            if (!UnitObject) return;
            if (UnitObject.ObjectId && !UnitObject.UnitID)
                UnitObject.UnitID = UnitObject.ObjectId;
            if (UnitObject.Name && !UnitObject.DisplayName)
                UnitObject.DisplayName = UnitObject.Name;
            if (!UnitObject.UnitID) return;
            if (this.Units[UnitObject.UnitID]) return;

            if (!this.IsMultiple) {
                this.ClearChoices();
            }

            this.Units[UnitObject.UnitID] = UnitObject;
            this.$Display.text(this.GetText());

            this.Validate();

            if (!this.IsMultiple && this.$Modal) {
                this.$Modal.hide();
            }

        },

        //清楚所有的选择
        ClearChoices: function () {
            for (var UnitID in this.Units) {
                this.RemoveChoice(UnitID);
            }
        },

        //移除选择
        RemoveChoice: function (UnitID) {
            if (!UnitID) return;
            if (this.Units[UnitID]) {
                $("#" + this.Units[UnitID].ChoiceID).remove();
                this.$Modal.find("i[data-UnitID='" + UnitID + "'][data-Type='" + this.Units[UnitID].Type + "']").removeClass("glyphicon-ok").parent().data("Exist", false);
                delete this.Units[UnitID];
            }
            this.$Display.text(this.GetText());
            this.Validate();
        },

        //判断是存在选项
        ExistChoice: function (UnitID) {
            if (this.Units[UnitID])
                return true;
            else
                return false;
        },

        //加载类型
        LoadOrgByTabType: function (tabType) {
            switch (tabType) {
                case "tab_Deps":
                    this.LoadDepsData();
                    break;
                case "tab_Tags":
                    this.LoadTagsData();
                    break;
                case "tab_Users":
                    this.LoadUsersData();
                    break;
            }
        },

        //加载组织机构树
        LoadDepsData: function () {
            var that = this;
            if (that.TagsDataPanel.is(":visible")) {
                that.TagsDataPanel.slideUp();
            }
            if (that.UsersDataPanel.is(":visible")) {
                that.UsersDataPanel.slideUp();
            }
            that.DepsDataPanel.slideDown();

            if (this.DepsDataPanel.data("IsLoad")) return;
            this.DepsDataPanel.data("IsLoad", true);
            this.LoadUnitsTree(this.DepsDataPanel);
        },

        //加载标签
        LoadTagsData: function ($el, UnitID) {
            var that = this;
            if (that.DepsDataPanel.is(":visible")) {
                that.DepsDataPanel.slideUp();
            }
            if (that.UsersDataPanel.is(":visible")) {
                that.UsersDataPanel.slideUp();
            }
            that.TagsDataPanel.slideDown();

            if (that.TagsDataPanel.data("IsLoad")) return;
            that.TagsDataPanel.data("IsLoad", true);

            this.Ajax(
                    that.FormMultiUserHandler,
                    "POST",
                    { Command: "LoadTags" },
                    function (UnitItems) {
                        that.MultiUserData.OrgTagItems = UnitItems;
                        that.CreateTagItems.apply(that);
                    });
        },

        //创建标签项
        CreateTagItems: function () {
            var that = this;
            if ($.isEmptyObject(that.MultiUserData.OrgTagItems)) return;

            var $ul = $("<ul>").addClass("nav");
            that.TagsDataPanel.append($ul);
            for (var i = 0; i < that.MultiUserData.OrgTagItems.length; i++) {
                var UnitItem = that.MultiUserData.OrgTagItems[i];
                var $li = $("<li>");
                var $a = $("<a>").append("<i class='glyphicon " + UnitItem.Icon + "'></i>").append(UnitItem.DisplayName).data("UnitItem", UnitItem);
                var $stateIcon = $("<i class='glyphicon'></i>").attr("data-UnitID", UnitItem.UnitID).attr("data-Type", UnitItem.Type);
                $a.append($stateIcon);
                $a.click(function () {
                    if ($(this).data("IsSystem")) {
                        $(this).data("IsSystem", false)
                        return;
                    }
                    var UnitObject = $(this).data("UnitItem");
                    if ($(this).data("Exist")) {
                        that.RemoveChoice.apply(that, [UnitObject.UnitID]);
                        $(this).find("i:last").removeClass("glyphicon-ok");
                        $(this).data("Exist", false);
                    }
                    else {
                        $(this).find("i:last").addClass("glyphicon-ok");
                        that.AddChoice.apply(that, [UnitObject]);;
                        $(this).data("Exist", true);
                    }
                });


                $li.append($a);
                $ul.append($li);
            }
        },

        //加载部门树
        LoadUnitsTree: function ($panel) {
            var that = this;
            var isDeps = true;
            if (!$.isEmptyObject(that.MultiUserData.OrgUnitItems)) {
                var $ul = $("<ul>").addClass("nav");
                var root = that.GetUnitsByParentId("");
                for (var i = 0; i < root.length; i++) {
                    $ul.append(that.CreateUnitsItem(root[i], isDeps));
                }
                $panel.append($ul);
            }
            else {
                this.Ajax(
                    that.FormMultiUserHandler,
                    "POST",
                    { Command: "LoadUnit" },
                    function (UnitItems) {
                        that.MultiUserData.OrgUnitItems = UnitItems;
                        that.LoadUnitsTree.apply(that, [$panel]);
                    });
            }
        },

        //创建部门的<li>对象
        CreateUnitsItem: function (UnitItem, isDeps) {
            var that = this;
            var $li = $("<li>");
            var $a = $("<a>").css("float", "left").width("60%");
            var $stateIcon = $("<i class='glyphicon'></i>").attr("data-UnitID", UnitItem.UnitID).attr("data-Type", UnitItem.Type);
            $a.append("<i class='glyphicon " + UnitItem.Icon + "'></i>").append(UnitItem.DisplayName).data("UnitItem", UnitItem).append($stateIcon);
            var $toggleUser = $("<a>").data("UnitItem", UnitItem).addClass("ion-chevron-right").attr("data-pack", "default").attr("data-tags", "arrow,right").css("padding-top", "10px").css("float", "right");

            $a.click(function () {
                if ($(this).data("IsSystem")) {
                    $(this).data("IsSystem", false)
                    return;
                }
                var UnitObject = $(this).data("UnitItem");
                if ($(this).data("Exist")) {
                    that.RemoveChoice.apply(that, [UnitObject.UnitID]);
                    $(this).find("i:last").removeClass("glyphicon-ok");
                    $(this).data("Exist", false);
                }
                else {
                    $(this).find("i:last").addClass("glyphicon-ok");
                    that.AddChoice.apply(that, [UnitObject]);;
                    $(this).data("Exist", true);
                }
            });

            $toggleUser.click(function () {
                var UnitObject = $(this).data("UnitItem");
                that.LoadUsersData.apply(that, [UnitObject.UnitID]);
            });

            $li.append($a);
            $li.append($toggleUser);
            var children = that.GetUnitsByParentId(UnitItem.UnitID);
            if (children.length > 0) {
                var $ul = $("<ul>").addClass("nav").addClass("SheetUser_SubTreePanel");
                for (var i = 0; i < children.length; i++) {
                    $ul.append(that.CreateUnitsItem(children[i], isDeps));
                }

                $li.append($ul);
            }

            return $li;
        },

        //根据父ID获取子部门
        GetUnitsByParentId: function (parentID) {
            var that = this;
            var units = [];
            for (var i = 0; i < that.MultiUserData.OrgUnitItems.length; i++) {
                if (that.MultiUserData.OrgUnitItems[i].ParentId == parentID) {
                    units.push(that.MultiUserData.OrgUnitItems[i]);
                }
            }
            return units;
        },

        //加载用户数据
        LoadUsersData: function (parentID) {
            var that = this;
            if (that.DepsDataPanel.is(":visible")) {
                that.DepsDataPanel.slideUp();
            }
            if (that.TagsDataPanel.is(":visible")) {
                that.TagsDataPanel.slideUp();
            }
            that.UsersDataPanel.slideDown();

            if (that.UsersDataPanel.data("IsLoad") == parentID) {
                return;
            }

            that.UsersDataPanel.data("IsLoad", parentID);
            that.LoadUsersByParenID(parentID);
        },
        // 
        LoadUsersByParenID: function (parentID) {
            var that = this;
            if (!that.MultiUserData.DepUserItems[parentID]) {

                this.Ajax(
                    that.FormMultiUserHandler,
                    "POST",
                    { Command: "LoadUsers", UnitID: parentID },
                    function (UnitItems) {
                        that.MultiUserData.DepUserItems[parentID] = UnitItems
                        that.LoadUsersByParenID.apply(that, [parentID]);
                        //异步添加用户数据
                        setTimeout(function () {
                            that.AddUserData(UnitItems);
                        }, 0);
                    });
            }
            else {
                var $ul = $("<ul>").addClass("nav");
                for (var i = 0; i < that.MultiUserData.DepUserItems[parentID].length; i++) {
                    var UnitItem = that.MultiUserData.DepUserItems[parentID][i];
                    var $li = $("<li>").addClass("SheetUser-LiItem");
                    var $a = $("<a>").append("<i class='glyphicon " + UnitItem.Icon + "'></i>").data("UnitItem", UnitItem);
                    //.data("UnitID", UnitItem.ID).data("Code", UnitItem.Code).data("DisplayName", UnitItem.DisplayName);
                    var checkboxID = $.IGuid();
                    var $label = $("<label>").text(UnitItem.DisplayName);
                    var $stateIcon = $("<i class='glyphicon'></i>").attr("data-UnitID", UnitItem.UnitID).attr("data-Type", UnitItem.Type);
                    $a.append($label);
                    $a.append($stateIcon);
                    if (that.ExistChoice(UnitItem.UnitID)) {
                        $stateIcon.addClass("glyphicon-ok");
                        $a.data("Exist", true);
                    }

                    $a.click(function () {
                        var UnitObject = $(this).data("UnitItem");
                        if ($(this).data("Exist")) {
                            that.RemoveChoice.apply(that, [UnitObject.UnitID]);
                            $(this).find("i:last").removeClass("glyphicon-ok");
                            $(this).data("Exist", false);
                        }
                        else {
                            $(this).find("i:last").addClass("glyphicon-ok");
                            that.AddChoice.apply(that, [UnitObject]);;
                            $(this).data("Exist", true);
                        }
                    });

                    $li.append($a);
                    $ul.append($li);
                }
                that.UsersDataPanel.html("").append($ul);
            }
        },

        //校验
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

        //搜索用户
        SearchOrg: function () {
            var searchkey = $(this).val().trim();
            if (searchkey == "") {
                if (!this.IsMobile) {
                    if (FormMultiUserManager.OrgListPanel.html() == "")
                        FormMultiUserManager.TreeManager.selectNode(0);
                }
                else {
                    FormMultiUserManager.OrgListPanel.html("");
                }
                return;
            }
            FormMultiUserManager.OrgListPanel.html("");
            $.ajax({
                type: "GET",
                url: FormMultiUserManager.FormMultiUserHandler + "?SearchKey=" + searchkey + "&" + FormMultiUserManager.GetLoadTreeOption(),
                dataType: "json",
                async: false,//同步执行
                success: function (data) {
                    if (data != null && data.length > 0) {
                        for (var i = 0; i < data.length; ++i) {
                            FormMultiUserManager.AddListItem.apply(FormMultiUserManager, [data[i], searchkey]);
                        }
                    }
                    else {
                        FormMultiUserManager.OrgListPanel.html("没搜索到组织");
                    }
                }
            });
        },

        //处理映射关系
        MappingControlsHandler: function (UnitObject) {
            if ($.isEmptyObject(this.MappingControls) || this.MappingControls == "") return;

            for (var property in this.MappingControls) {
                var targetFiled = this.MappingControls[property];
                $.FormManager.SetControlValue(targetFiled, UnitObject[property]);
            }
        }
    });
})(jQuery);