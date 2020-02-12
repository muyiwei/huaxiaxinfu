//选人控件
(function ($) {
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.FormUser = function (opt) {
        return $.ControlManager.Run.call(this, "FormUser", arguments);
    };

    //选人控件数据,单个页面所有数据库共用
    //原来没有对选人控件设定选择范围，所有控件加载出来unit相同，控件共用一个缓存，增加选择范围后控件各自缓存
    //20161130注释FormUserData，用this.UserData替代
    //$.FormUserData = {
    //    //部门
    //    OrgUnitItems: {},
    //    //标签
    //    //OrgTagItems: [],
    //    //部门用户:{部门ID:[]}
    //    DepUserItems: {},
    //    //用户
    //    UserItems: {},
    //};

    // 构造函数
    $.Controls.FormUser = function (element, ptions, sheetInfo) {
        //原来是$.FormUserData,修改为每个控件各自缓存
        this.UserData = {
            //部门
            OrgUnitItems: {},
            //标签
            //OrgTagItems: [],
            //部门用户:{部门ID:[]}
            DepUserItems: {},
            //用户
            UserItems: {},
        };
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
        this.IsOverSelectorPanel = false;
        this.FormUserHandler = "/Sheet/SheetUserAction";
        this.Options = ptions;
        this.CpLock = false;
        $.Controls.FormUser.Base.constructor.call(this, element, ptions, sheetInfo);
        this.FromNum = 0;
        this.ToNum = 10;

    };

    // 继承及控件实现
    $.Controls.FormUser.Inherit($.Controls.BaseControl, {
        //控件渲染函数
        Render: function () {
            //是否在子表里面子表
            this.IsInGridView = !$.isEmptyObject(this.ObjectId);

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
        },

        //初始化值
        InitValue: function () {
            if (this.Value) {
                this.SetValue(this.Value);
                if ($.SmartForm.ResponseContext.IsCreateMode) {
                    var val = this.Value.constructor == Array ? this.Value[0] : this.Value;
                    this.MappingControlsHandler(val);
                }
            }
        },
        //判断默认只是否在给定选人范围内
        CheckUnitValidate: function (Obj) {
            var that = this;
            var newObj = [];
            if ($.isEmptyObject(that.UserData.OrgUnitItems)) {
                //if ($.SmartForm.ResponseContext && !$.SmartForm.ResponseContext.IsCreateMode) {
                //如果不是创建模式则不执行check，因为非创建模式的数据已经check过
                //if (Obj.constructor == String || Obj.constructor == Object) {
                //    newObj.push(Obj);
                //}
                //else if (Obj.constructor == Array) {
                //    newObj = Obj;
                //}
                //return newObj;
                //}
                var UnitIds = [];
                if (Obj.constructor == Object) {
                    UnitIds.push(Obj.UnitID || Obj.UnitId);
                } else if (Obj.constructor == Array) {
                    for (var i = 0; i < Obj.length; i++) {
                        if (Obj[i].constructor == Object) {
                            UnitIds.push(Obj[i].UnitID || Obj[i].UnitId);
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
            //对于设置默认值的情况，开始时候没有LoadUnitsTree
            //需要考虑到值是否在选人范围内以及是否显示离职人员
            //这里要加载所有的unit，判断值是否在给定unit内
            //加载树

            var that = this;
            if (Obj == void 0 || Obj == null || Obj == "" || Obj.length == 0) {
                this.ClearChoices();
                return;
            }

            //if (!that.SelectorPanel) {
            //    that.RenderNext();
            //    $(that.$InputBody).unbind("click.UserOnce");
            //}

            //要校验的情况
            //1.创建模式
            //2.修改模式可写且没有值
            if (this.UnitSelectionRange) {
                //有设置选人范围
                if ($.SmartForm && $.SmartForm.ResponseContext && $.SmartForm.ResponseContext.IsCreateMode) {
                    //创建模式
                    Obj = that.CheckUnitValidate(Obj);
                } else {
                    //修改模式
                    if (this.Editable && (Obj == void 0 || Obj == null || Obj == "" || Obj.length == 0)) {
                        //可编辑
                        Obj = that.CheckUnitValidate(Obj);
                    }
                }
            }

            //if (this.UnitSelectionRange && this.Editable)
            //    Obj = that.CheckUnitValidate(Obj);

            if (Obj.constructor == Object) {
                this.AddChoice(Obj);
            }
            else if (Obj.constructor == Array) {
                for (var i = 0; i < Obj.length; i++) {
                    if (Obj[i].constructor == Object) {
                        this.AddChoice(Obj[i]);
                    }
                    else if (Obj[i].constructor == String) {
                        this.AddUserID(Obj);
                        break;
                    }
                }
            }
            else if (Obj.constructor == String) {
                date = new Date();
                this.AddUserID(Obj);
            }
            //this.OnChange();
        },

        //返回 {UnitID1:{UnitID: , Code:, DisplayName:Type, Icon ,ParentId},UnitID1:{UnitID: , Code:, DisplayName: }}对象
        GetValue: function () {
            return $.IClone(this.Units);
        },

        GetUnitIDs: function () {
            return this.GetUnitIds();
        },

        //读取选中的UnitID
        GetUnitIds: function () {
            var ValObjs = this.GetValue();
            var UintIDs = new Array();
            for (var key in ValObjs) {
                UintIDs.push(key);
            }
            return UintIDs;
        },

        //获取显示
        GetText: function () {
            var userNames;
            for (var ObjectId in this.Units) {
                if (this.IsMultiple) {
                    if (userNames == void 0) userNames = new Array();
                    userNames.push(this.Units[ObjectId].DisplayName);
                }
                else {
                    userNames = this.Units[ObjectId].DisplayName;
                }
            }
            return userNames == void 0 ? "" : userNames.toString();
        },

        //保存数据
        SaveDataField: function () {
            var result = {
            };
            if (!this.Visible) return result;
            var oldresult = this.DataItem;
            if (!oldresult) {
                return {
                };
            }

            var UnitIDs = this.GetUnitIDs();
            if (oldresult.Value != UnitIDs) {
                result[this.DataField] = UnitIDs;
                return result;
            }
            return {
            };
        },

        //根据ChoiceID，获取已经选择的组织
        GetSelectUnitByChoiceID: function (choiceID) {
            if (this.Units == null || this.Units.length == 0) return null;
            for (var key in this.Units) {
                if (this.Units[key].ChoiceID == choiceID) {
                    return this.Units[key];
                }
            }
            return null;
        },

        //渲染样式
        HtmlRender: function () {
            var $Element = $(this.Element);
            $Element.addClass("SheetUser");
            if (!this.IsInGridView) {
                //不在子表里面
                $Element.css("position", "relative")
            }
            if (!this.Editable) {
                this.$Input = $("<pre>").css("border", "none");
                this.$InputBody.append(this.$Input);
                return;
            }
            //设置当前控件的ID
            this.ID = $.IGuid();

            //this.$InputBody.attr("ID", this.ID);

            //this.UnitsElement = $("<div>").attr("data-targetid", this.ID).attr("name", this.DataField).addClass("form-control form-query-add").css("overflow", "auto").css("width", "100%").css("min-height", "30px").css("max-height", "100px");//.width(this.Width);
            this.UnitsElement = $('<div data-targetid="' + this.ID + '" name="' + this.DataField + '" class="form-control form-query-add" style="overflow:auto; width:100%; min-height:30px; max-height：100px;"></div>')
            //this.$Input = $("<input>").addClass("SheetUser-Input");
            this.$Input = $("<input class='SheetUser-Input' style='width:1px;'>");
            var that = this;
            this.$Input.on("compositionstart", function () {
                that.CpLock = true;
            });
            this.$Input.on("compositionend", function () {
                that.CpLock = false;
            });
            //this.UnitsElement.append(this.$Input);
            this.$InputBody.attr("ID", this.ID).css({ "min-width": "100px" }).append(this.UnitsElement.append(this.$Input));

            //Error:暂不支持搜索
            //this.$Input.width("1px");

            //this.$InputBody.css({ "min-width": "100px" });

            ////搜索面板
            //that.$SearchPanel = $("<div>").attr("data-targetid", that.ID).addClass("SheetUser-SelectorPanel").attr("data-FormUserPanel", "SearchPanel");

            ////组织机构选择面板
            //that.SelectorPanel = $("<div>").attr("data-targetid", that.ID).addClass("SheetUser-SelectorPanel").attr("data-FormUserPanel", "SelectorPanel");//.width(this.Width);

            ////组织标签
            //that.SelectorTabs = $("<ul>").addClass("nav").addClass("nav-tabs user-tabs");
            //if (that.UserVisible) {
            //    that.SelectorTabs.append($("<li>").append("<a>用户</a>").attr("data-tabtype", "tab_Users").css("cursor", "pointer"));
            //}
            //if (that.OrgUnitVisible) {
            //    that.SelectorTabs.append($("<li>").append("<a>部门</a>").attr("data-tabtype", "tab_Deps").css("cursor", "pointer"));
            //}
            //that.SelectorPanel.append(that.SelectorTabs);

            ////用户面板
            //that.UsersDataPanel = $("<div>").addClass("SheetUser_DataPanel").addClass("row").addClass("SheetUser_tab_Users");
            ////部门面板
            //that.DepsDataPanel = $("<div>").addClass("SheetUser_DataPanel").addClass("row").addClass("SheetUser_tab_Deps");

            //that.SelectorPanel.append(that.DepsDataPanel);
            //that.SelectorPanel.append(that.UsersDataPanel);

            //that.$UserPanel = $("<div class='userpanel'>");
            //that.$UserPanel.append(that.SelectorPanel).append(that.$SearchPanel);
            //that.$UserPanel.appendTo("body");
        },

        RenderNext: function () {
            var that = this;

            //搜索面板
            //that.$SearchPanel = $("<div>").attr("data-targetid", that.ID).addClass("SheetUser-SelectorPanel").attr("data-FormUserPanel", "SearchPanel");
            that.$SearchPanel = $("<div data-targetid='" + that.ID + "' class='SheetUser-SelectorPanel' data-FormUserPanel='SearchPanel'>");
            $(that.$SearchPanel).on('scroll', 'ul', function () { alert('xxx') });

            //组织机构选择面板
            //that.SelectorPanel = $("<div>").attr("data-targetid", that.ID).addClass("SheetUser-SelectorPanel").attr("data-FormUserPanel", "SelectorPanel");//.width(this.Width);
            that.SelectorPanel = $("<div data-targetid='" + that.ID + "' class='SheetUser-SelectorPanel' data-FormUserPanel='SelectorPanel'>");

            //组织标签
            //that.SelectorTabs = $("<ul>").addClass("nav").addClass("nav-tabs user-tabs");
            that.SelectorTabs = $("<ul class='nav nav-tabs user-tabs'>");
            if (that.UserVisible) {
                //that.SelectorTabs.append($("<li>").append("<a>用户</a>").attr("data-tabtype", "tab_Users").css("cursor", "pointer"));
                that.SelectorTabs.append($("<li data-tabtype='tab_Users' style='cursor:pointer;'><a>用户</a></li>"));
            }
            if (that.OrgUnitVisible) {
                //that.SelectorTabs.append($("<li>").append("<a>部门</a>").attr("data-tabtype", "tab_Deps").css("cursor", "pointer"));
                that.SelectorTabs.append($("<li data-tabtype='tab_Deps' style='cursor:pointer;'><a>部门</a></li>"));
            }
            that.SelectorPanel.append(that.SelectorTabs);

            //用户面板
            //that.UsersDataPanel = $("<div>").addClass("SheetUser_DataPanel").addClass("row").addClass("SheetUser_tab_Users");
            that.UsersDataPanel = $("<div class='SheetUser_DataPanel row SheetUser_tab_Users'>");
            //部门面板
            //that.DepsDataPanel = $("<div>").addClass("SheetUser_DataPanel").addClass("row").addClass("SheetUser_tab_Deps");
            that.DepsDataPanel = $("<div class='SheetUser_DataPanel row SheetUser_tab_Deps'>");

            that.SelectorPanel.append(that.DepsDataPanel);
            that.SelectorPanel.append(that.UsersDataPanel);

            that.$UserPanel = $("<div class='userpanel'>");
            that.$UserPanel.append(that.SelectorPanel).append(that.$SearchPanel);
            that.$UserPanel.appendTo("body");

            //绑定对应事件
            //页签切换
            that.SelectorTabs.find("li").unbind("click.SelectorTabs").bind("click.SelectorTabs", that, function (e) {
                if ($(this).hasClass("active")) return;
                var that = e.data;
                var $parent = $(this).parent();
                $parent.find("li").removeClass("active");
                $(this).addClass("active");

                var tabType = $(this).attr("data-tabtype");
                that.SelectorPanel.find(".SheetUser_DataPanel").hide();
                that.SelectorPanel.find(".SheetUser_" + tabType).show();
                that.LoadOrgByTabType(tabType);
            });

            //点击到当前元素，设置input焦点
            $(that.$InputBody).children("div").unbind("click.FormUser").bind("click.FormUser", that, function (e) {
                var $target = $(e.target);
                if (!$target.closest("li").hasClass("SheetUser-LiItem")) {
                    e.data.$Input.focus();
                    // 停止冒泡，防止与SheetQuery冲突而添加
                    e.stopPropagation();
                }
            });

            that.$UserPanel.children("div").unbind("click.FormUser").bind("click.FormUser", that, function (e) {
                var $target = $(e.target);
                if (!$target.closest("li").hasClass("SheetUser-LiItem")) {
                    e.data.$Input.focus();
                    // 停止冒泡，防止与SheetQuery冲突而添加
                    e.stopPropagation();
                }
            });

            //得到焦点显示
            $(that.$Input).unbind("focusin.Input").bind("focusin.Input", that, function (e) {
                e.data.FocusInput.apply(e.data);
            });

            //控件输入
            $(that.$Input).unbind("keyup.SearchTxtElement").bind("keyup.SearchTxtElement", that, function (e) {
                e.data.SetSearchTxtElementWidth.apply(e.data);

                var that = e.data;
                that.TimeOut && window.clearTimeout(that.TimeOut);
                that.TimeOut = setTimeout(function () {
                    that.SearchOrg.apply(that, [that]);
                }, 500);
            });

            $(that.$Input).unbind("keydown.SearchTxtElement").bind("keydown.SearchTxtElement", that, function (e) {
                if (e.keyCode == 8 && $(this).val() == "" && $(this).prev().length > 0) {
                    var unit = e.data.GetSelectUnitByChoiceID.apply(e.data, [$(this).prev().attr("id")]);
                    e.data.RemoveChoice.apply(e.data, [unit.UnitID]);
                }
            });

            //点击屏幕的其他地方
            $(document).unbind("mousedown." + that.ID).bind("mousedown." + that.ID, that, function (e) {
                //edit by xc 特殊情况处理
                if ($(e.target).hasClass("row") && $(e.target).children(".col-md-6").children("div[data-controlkey='FormUser']").length > 0) {
                    return false;
                }
                else if ($(e.target).closest("div[data-targetid='" + e.data.ID + "']").length == 0) {
                    e.data.FocusOutput.apply(e.data);
                    e.stopPropagation();
                }
            });
        },

        //绑定事件
        BindEnvens: function () {
            var that = this;
            //不可用
            if (!this.Editable) {
                return;
            }

            //点击选人控件再渲染
            $(this.$InputBody).bind("click.UserOnce", function () {
                that.RenderNext.apply(that);
                that.FocusInput();

                $(this.$InputBody).unbind("click.UserOnce");
            });

            //映射关系
            if (!$.isEmptyObject(this.MappingControls)) {
                this.BindChange("sys_MappingControlsHandler", function () {
                    var val = that.GetValue();
                    if (val != null) {
                        for (var key in val) {
                            that.MappingControlsHandler.apply(that, [val[key]]);
                            break;
                        }
                    }
                });
            }

        },

        //设置输入框的宽度
        SetSearchTxtElementWidth: function () {
            var w = "1px";
            var length = this.$Input.val().length;
            if (length > 0) {
                w = length * 15 + "px";
                this.$Input.removeAttr("PlaceHolder", this.PlaceHolder);
            }
            $(this.$Input).width(w);
        },

        //获取焦点焦点
        FocusInput: function () {
            //if (this.IsInGridView) {
            //    var position = this.$InputBody.offset();
            //    this.SelectorPanel.css("top", position.top + this.$InputBody.height());
            //    this.SelectorPanel.css("left", position.left);
            //    this.SelectorPanel.width(this.UnitsElement.width());
            //}
            // edit by xiechang
            var padding = this.$InputBody.css("padding-left");
            padding = padding ? parseInt(padding) : 0;
            var position = this.$InputBody.offset();
            var WindowW = $(window).outerWidth();
            if (this.IsInGridView) {
                if (WindowW - position.left < 610) {
                    this.SelectorPanel.css("right", WindowW - position.left - this.$InputBody.outerWidth());
                    this.$SearchPanel.css("right", WindowW - position.left - this.$InputBody.outerWidth());
                } else {
                    this.SelectorPanel.css("left", position.left);
                    this.$SearchPanel.css("left", position.left);
                }
                //this.SelectorPanel.css("top", position.top + this.$InputBody.height());
                //this.SelectorPanel.width(this.UnitsElement.width());
            }
            else {
                if (WindowW - position.left < 610) {
                    this.SelectorPanel.css("right", this.$InputBody.css("paddingRight"));
                    this.$SearchPanel.css("right", this.$InputBody.css("paddingRight"));
                } else {
                    this.SelectorPanel.css("left", position.left + padding);
                    this.$SearchPanel.css("left", position.left + padding);
                }
            }
            this.SelectorPanel.css("top", position.top + this.$InputBody.height());
            this.$SearchPanel.css("top", position.top + this.$InputBody.height());

            if (this.SelectorPanel.is(":visible")) return;

            //其他的选人控件都隐藏(包括单人和多人 edit by xc)
            //$("div[data-FormUserPanel='SelectorPanel']").hide();
            $("div[data-FormMultiUserPanel='SelectorPanel'],div[data-FormUserPanel='SelectorPanel']").hide();
            if (this.SelectorTabs.find("li.active").length == 0) {
                this.SelectorTabs.find("li:first").click();
            }
            this.SelectorPanel.show();
        },

        //失去焦点
        FocusOutput: function () {
            if (this.SelectorPanel) {
                this.SelectorPanel.hide();
                this.$SearchPanel.hide();
                this.$Input.val("");
                this.Required && (this.UnitsElement.text() != "" && this.UnitsElement.css({ "border": "1px solid #ddd", "box-shadow": "none" }));
            }
        },

        //添加:UserID/UserCode
        AddUserID: function (UserID) {
            var that = this;
            //需要后台取数的id
            var ids = [];
            var cacheItems = [];
            if (UserID.constructor == Array) {
                for (var i = 0; i < UserID.length; i++) {
                    var id = UserID[i];
                    if (!that.UserData.UserItems[id]) {
                        ids.push(id);
                    }
                    else {
                        cacheItems.push(that.UserData.UserItems[id]);
                    }
                }
            }
            else {
                if (!that.UserData.UserItems[UserID]) {
                    ids.push(UserID);
                }
            }

            if (ids.length > 0) {
                var param = {
                    Command: "GetUserProperty", UnitID: JSON.stringify(ids)
                };
                //添加已经存在缓存中的对象
                if (cacheItems && cacheItems.length > 0) {
                    for (var item in cacheItems) {
                        that.AddChoice.apply(that, item);
                    }
                }

                //  从后台添加没在缓存中的对象
                this.Ajax(
                    that.FormUserHandler,
                    "POST",
                    param,
                    function (data) {
                        if (data) {
                            that.AddUserData.apply(that, [data]);
                            that.AddChoice.apply(that, data);
                        }
                    },
                    true);
            }
            else if (UserID.constructor == Array) {
                for (var i = 0; i < UserID.length; i++) {
                    var id = UserID[i];
                    if (that.UserData.UserItems[id]) {
                        that.AddChoice(that.UserData.UserItems[id]);
                    }
                }
            } else if (that.UserData.UserItems[UserID]) {
                that.AddChoice(that.UserData.UserItems[UserID]);
            }
        },

        //添加用户数据到缓存中
        AddUserData: function (UnitItems) {
            for (var i = 0; i < UnitItems.length; i++) {
                this.UserData.UserItems[UnitItems[i].UnitID] = UnitItems[i];
            }
        },

        //添加选择
        AddChoice: function (UnitObject) {
            if (!UnitObject) return;
            if (UnitObject.ObjectId && !UnitObject.UnitID)
                UnitObject.UnitID = UnitObject.ObjectId;
            if (UnitObject.Name && !UnitObject.DisplayName)
                UnitObject.DisplayName = UnitObject.Name;
            if (!UnitObject.UnitID) return;
            if (this.Units[UnitObject.UnitID]) return;

            if (!this.IsMultiple) {
                this.ClearChoices(true);
            }
            var NewUnitObject = $.extend(true, {}, UnitObject);

            this.Units[NewUnitObject.UnitID] = NewUnitObject;


            this.OnChange(NewUnitObject);
            this.Validate();
            if (!this.Editable) {
                if (this.Visible)
                    this.$Input.text(this.$Input.text() + NewUnitObject.DisplayName + ";");
                return;
            }

            var choiceID = $.IGuid();
            NewUnitObject.ChoiceID = choiceID;
            var choice = $("<span class='SheetUser-Item label label-info'></span>");

            var icon = "";
            switch (NewUnitObject.Type) {
                case 1:
                    icon = "icon-company";
                    break;
                case 2:
                    icon = "icon-department";
                    break;
                case 4:
                    icon = "glyphicon glyphicon-user";
                    break;
            }
            choice.append($("<i>").addClass(icon));
            choice.append(NewUnitObject.DisplayName);
            choice.attr("id", choiceID).data("UnitID", NewUnitObject.UnitID);
            this.$Input.before(choice);

            var that = this;
            //可用
            if (this.Editable) {
                choice.unbind("click.choice").bind("click.choice", this, function (e) {
                    e.data.RemoveChoice.apply(e.data, [$(this).data("UnitID")]);
                    // add by xiechang
                    that.Options.HideCallBack && that.Options.HideCallBack(null, that.$InputBody.parent("div").attr("data-type"));
                });

                // 放到onchage事件里面， 映射关系
                //if (!$.isEmptyObject(this.MappingControls)) {
                //    this.MappingControlsHandler(NewUnitObject);
                //}
            }

            if (!this.IsMultiple) {
                this.FocusOutput();
            }
        },

        //清楚所有的选择
        ClearChoices: function (notApplyOnChange) {
            for (var UnitID in this.Units) {
                this.RemoveChoice(UnitID, notApplyOnChange);
            }
            //清空的时候，清空缓存
            if (!this.UseDataCache) {
                //不用缓存，每次都清空
                this.UserData = {
                    //部门
                    OrgUnitItems: {
                    },
                    //标签
                    //OrgTagItems: [],
                    //部门用户:{部门ID:[]}
                    DepUserItems: {
                    },
                    //用户
                    UserItems: {},
                };
                if (this.DepsDataPanel) {
                    this.DepsDataPanel.data("IsLoad", false);
                    this.UsersDataPanel.data("IsLoad", false);
                    this.SelectorTabs.find("li.active").removeClass("active");
                }
            }
        },

        //移除选择
        RemoveChoice: function (UnitID, notApplyOnChange) {
            if (!UnitID) return;
            if (this.Units[UnitID]) {
                if (this.Editable) {
                    $("#" + this.Units[UnitID].ChoiceID).remove();
                }
                else {
                    this.$Input.text("");
                }
                //$(this.Element).find("i[data-UnitID='" + UnitID + "'][data-Type='" + this.Units[UnitID].Type + "']").removeClass("glyphicon-ok").parent().data("Exist", false);
                $(this.$UserPanel).find("i[data-UnitID='" + UnitID + "'][data-Type='" + this.Units[UnitID].Type + "']").removeClass("glyphicon-ok").parent().data("Exist", false);
                delete this.Units[UnitID];
            }
            this.Validate();
            if (!notApplyOnChange)
                this.OnChange(this.Units[UnitID]);
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
                case "tab_Users":
                    this.LoadUsersData();
                    break;
            }
        },

        //加载组织机构树
        LoadDepsData: function ($el, UnitID) {
            if (this.DepsDataPanel.data("IsLoad")) return;
            this.DepsDataPanel.data("IsLoad", true)
            this.DepsDataPanel.html("");
            this.LoadUnitsTree(this.DepsDataPanel, "tab_Deps");
        },

        //加载部门树
        LoadUnitsTree: function ($panel, tabType) {
            var that = this;
            var isDeps = false;
            //是部门页签，可以选择部门
            if (tabType && tabType == "tab_Deps") {
                isDeps = true;
            }

            if (!$.isEmptyObject(that.UserData.OrgUnitItems)) {
                var $ul = $("<ul>").addClass("nav");
                var root = that.GetUnitsByParentId("");
                //$ul.append(that.CreateUnitsItem(root[0], isDeps));
                for (var i = 0; i < root.length; i++) {
                    $ul.append(that.CreateUnitsItem(root[i], isDeps));
                }
                $panel.append($ul);
                //设置树的展开关闭
                if ($ul.metisMenu)
                    $ul.metisMenu();
                $ul.find("a:first,a:first>span.fa-arrow").data("IsSystem", true).click();
            }
            else {
                var actionCommand = "LoadUnit";
                if (that.UnitSelectionRange) {
                    //如果设置了选人范围则调用下面
                    actionCommand = "LoadOwnAndChildUnit";//如果设置了选人范围则加载制定组织和其下级
                }
                this.Ajax(
                    that.FormUserHandler,
                    "POST",
                    {
                        Command: actionCommand, UnitIDs: that.UnitSelectionRange
                    },
                    function (UnitItems) {
                        that.UserData.OrgUnitItems = UnitItems;
                        if (UnitItems.length == 0) {
                            return;
                        }
                        that.LoadUnitsTree($panel, tabType);
                    });
            }
        },

        //校验
        Validate: function () {
            //不可编辑
            if (!this.Editable) return true;

            var val = this.GetValue();

            if (this.Required && $.isEmptyObject(val)) {
                this.AddInvalidText(this.UnitsElement, "必填");
                return false;
            }

            this.RemoveInvalidText(this.UnitsElement);
            return true;
        },

        //创建部门的<li>对象
        CreateUnitsItem: function (UnitItem, isDeps) {
            var that = this;

            var $li = $("<li>");
            var $a = $("<a>").append("<span class='fa fa-arrow sheet-angel'></span>").append("<i class='" + (UnitItem.Type == 1 ? "icon-company" : "icon-department") + "'></i>").append(UnitItem.DisplayName).data("UnitItem", UnitItem);
            if (isDeps) {
                $li.addClass("SheetUser-LiItem");

                //如果是部门tab的话，炫耀可选
                var $stateIcon = $("<i class='glyphicon'></i>").attr("data-UnitID", UnitItem.UnitID).attr("data-Type", UnitItem.Type);
                $a.append($stateIcon);
                $a.click(function (e) {
                    if (e.target.tagName.toLowerCase() == "span") return;
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
                        $(this).data("Exist", true);
                        that.AddChoice.apply(that, [UnitObject]);
                    }
                    //add by xiechang
                    that.Options.HideCallBack && that.Options.HideCallBack(null, that.$InputBody.parent("div").attr("data-type"));
                });
            }
            else {
                $a.click(function (e) {
                    //if (e.target.tagName.toLowerCase() == "span") return;
                    var UnitObject = $(this).data("UnitItem");
                    that.LoadUsersByParenID.apply(that, [UnitObject.UnitID], that.ShowUnActive);
                });
            }

            $li.append($a);
            $a.children(".fa-arrow").click(function (e) {
                if ($(this).closest("li").hasClass("active")) {
                    $(this).closest("li").removeClass("active");
                    $(this).closest("li").find("ul").hide();
                }
                else {
                    $(this).closest("li").find("ul").remove();
                    var children = that.GetUnitsByParentId(UnitItem.UnitID);
                    if (children.length > 0) {
                        var $ul = $("<ul>").addClass("nav").addClass("SheetUser_SubTreePanel");
                        for (var i = 0; i < children.length; i++) {
                            $ul.append(that.CreateUnitsItem(children[i], isDeps));
                        }
                        $(this).closest("li").append($ul);
                        if ($ul.metisMenu)
                            $ul.metisMenu();
                    }
                }
            });

            return $li;
        },

        //根据父ID获取子部门
        GetUnitsByParentId: function (ParentId) {
            var that = this;
            var units = [];
            for (var i = 0; i < this.UserData.OrgUnitItems.length; i++) {
                if (this.UserData.OrgUnitItems[i].ParentId == ParentId) {
                    units.push(this.UserData.OrgUnitItems[i]);
                }
            }

            // 从后台读取下级部门
            if (units.length == 0) {
                var actionCommand = "LoadUnit";
                //if (that.UnitSelectionRange) {
                //    //如果设置了选人范围则调用下面
                //    actionCommand = "LoadOwnAndChildUnit";//如果设置了选人范围则加载制定组织和其下级
                //}
                this.Ajax(
                    that.FormUserHandler,
                    "POST",
                    {
                        Command: actionCommand, UnitID: ParentId
                    },
                    function (UnitItems) {
                        if (UnitItems.length > 0) {
                            for (var i = 0; i < UnitItems.length; i++) {
                                that.UserData.OrgUnitItems.push(UnitItems[i]);
                                units.push(UnitItems[i]);
                            }
                        }
                    }, false);
            }
            return units;
        },

        //加载用户数据
        LoadUsersData: function () {
            var that = this;
            if (that.UsersDataPanel.data("IsLoad")) return;
            that.UsersDataPanel.data("IsLoad", true).css("overflow", "hidden");
            var leftPanel = $("<div>").addClass("SheetUser_TreePanel").addClass("col-sm-7").height("100%");
            that.UserListPanel = $("<div>").addClass("col-sm-5").height("100%").css("overflow", "auto");

            that.UsersDataPanel.html("");
            that.UsersDataPanel.append(leftPanel);
            that.UsersDataPanel.append(that.UserListPanel);
            that.LoadUnitsTree(leftPanel);
        },
        // 
        LoadUsersByParenID: function (ParentId) {
            var that = this;
            if (!that.UserData.DepUserItems[ParentId]) {
                var showUnActive = this.ShowUnActive;//是否显示离职人员
                this.Ajax(
                    that.FormUserHandler,
                    "POST",
                    {
                        Command: "LoadUsers", UnitID: ParentId, ShowUnActive: showUnActive
                    },
                    function (UnitItems) {
                        that.UserData.DepUserItems[ParentId] = UnitItems
                        that.LoadUsersByParenID.apply(that, [ParentId]);

                        //异步添加用户数据
                        setTimeout(function () {
                            that.AddUserData(UnitItems);
                        }, 0);
                    });
            }
            else {
                var $ul = $("<ul>").addClass("nav");
                for (var i = 0; i < that.UserData.DepUserItems[ParentId].length; i++) {
                    var UnitItem = that.UserData.DepUserItems[ParentId][i];
                    var $li = $("<li>").addClass("SheetUser-LiItem");
                    var $a = $("<a>").append("<i class='glyphicon " + UnitItem.Icon + "'></i>").data("UnitItem", UnitItem);
                    var checkboxID = $.IGuid();
                    //var $label = $("<label>").text(UnitItem.DisplayName);
                    var $stateIcon = $("<i class='glyphicon'></i>").attr("data-UnitID", UnitItem.UnitID).attr("data-Type", UnitItem.Type);
                    //$a.append($label);
                    $a.append(UnitItem.DisplayName);
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
                        //add by xiechang
                        that.Options.HideCallBack && that.Options.HideCallBack(null, that.$InputBody.parent("div").attr("data-type"));
                    });

                    $li.append($a);
                    $ul.append($li);
                }
                that.UserListPanel.html("").append($ul);
            }
        },
        ScrollLoad: function () {
            var that = this;
            if (that.IsPosting)
                return;
            var searchkey = $(that.$Input).val().trim();
            that.IsPosting = true;
            that.Ajax(
                that.FormUserHandler,
                'POST', {
                    Command: 'SearchOrg',
                    SearchKey: searchkey,
                    OrgUnitVisible: that.OrgUnitVisible,
                    UserVisible: that.UserVisible,
                    ShowUnActive: that.ShowUnActive,
                    UnitSelectionRange: that.UnitSelectionRange,
                    FromNum: that.FromNum,
                    ToNum: that.ToNum
                }, function (data) {
                    if (data != null && data.length > 0) {
                        that.FromNum = that.ToNum;
                        that.ToNum += data.length;
                        var $ul = that.$SearchPanel.find('ul');
                        for (var i = 0; i < data.length; i++) {
                            var UnitItem = data[i];
                            var $li = $("<li>");
                            var icon = UnitItem.Type == 1 ? "icon-company" : (UnitItem.Type == 2 ? "icon-department" : UnitItem.Icon);
                            var displayName = UnitItem.DisplayName;
                            if (UnitItem.Type == 4) {
                                displayName += "-" + UnitItem.DepartmentName;
                            }
                            var $a = $("<a>").append("<i class='glyphicon " + icon + "'></i>").append(displayName).data("UnitItem", UnitItem);
                            $a.click(function (e) {
                                var UnitObject = $(this).data("UnitItem");
                                that.AddChoice.apply(that, [UnitObject]);
                                that.Options.HideCallBack && that.Options.HideCallBack(null, that.$InputBody.parent("div").attr("data-type"));
                            });
                            $ul.append($li.append($a));
                        }
                    }
                    that.IsPosting = false;
                });
        },
        //搜索用户
        SearchOrg: function () {
            this.FromNum = 0;
            this.ToNum = 10;
            this.$SearchPanel.html("");
            if (this.CpLock)
                return;
            var searchkey = $(this.$Input).val().trim();
            if (searchkey == "") {
                this.SelectorPanel.show();
                this.$SearchPanel.hide();
                return;
            }
            this.SelectorPanel.hide();
            this.$SearchPanel.show();
            //this.$SearchPanel.html("");
            var that = this;
            that.IsPosting = false;
            this.Ajax(
                that.FormUserHandler,
                "POST",
                {
                    Command: "SearchOrg", SearchKey: searchkey, OrgUnitVisible: this.OrgUnitVisible, UserVisible: this.UserVisible, ShowUnActive: this.ShowUnActive, UnitSelectionRange: this.UnitSelectionRange
                },
                function (data) {
                    that.$SearchPanel.html("");
                    if (data != null && data.length > 0) {
                        that.FromNum = that.ToNum + 1;
                        that.ToNum += data.length;
                        var $ul = $("<ul>").addClass("nav").addClass("SheetUser_SubTreePanel");
                        for (var i = 0; i < data.length; i++) {
                            var UnitItem = data[i];
                            var $li = $("<li>");
                            var icon = UnitItem.Type == 1 ? "icon-company" : (UnitItem.Type == 2 ? "icon-department" : UnitItem.Icon);
                            var displayName = UnitItem.DisplayName;
                            if (UnitItem.Type == 4) {
                                displayName += "-" + UnitItem.DepartmentName;
                            }
                            var $a = $("<a>").append("<i class='glyphicon " + icon + "'></i>").append(displayName).data("UnitItem", UnitItem);
                            $a.click(function (e) {
                                var UnitObject = $(this).data("UnitItem");
                                that.AddChoice.apply(that, [UnitObject]);
                                that.Options.HideCallBack && that.Options.HideCallBack(null, that.$InputBody.parent("div").attr("data-type"));
                            });
                            $ul.append($li.append($a));
                        }
                        that.$SearchPanel.append($ul);
                        //滚动加载
                        $($ul).scroll(function () {
                            //底部基本距离+滚动高度>=文档高度-窗体高度
                            var h_ul = $(this).height();//窗口高度
                            var h_scrollTop = $(this).scrollTop();//滚动条顶部
                            if (50 + h_scrollTop >= $(this)[0].scrollHeight - h_ul) {
                                that.ScrollLoad();
                            }
                        });
                    }
                    else {
                        that.$SearchPanel.html("没搜索到组织");
                    }
                });
        },

        //处理映射关系
        MappingControlsHandler: function (UnitObject) {
            if ($.isEmptyObject(UnitObject)) return;
            if ($.isEmptyObject(this.MappingControls)) return;
            if (this.IsMultiple) return;

            for (var property in this.MappingControls) {
                if (this.MappingControls.hasOwnProperty(property)) {
                    var targetFiled = this.MappingControls[property];
                    if (property.toLocaleLowerCase() == "parentid") {
                        property = "ParentId";
                    }
                    var MapValue = UnitObject[property] == void 0 ? "" : UnitObject[property];
                    if (property.toLowerCase() == 'gender' && !isNaN(MapValue)) {
                        MapValue = MapValue == 0 ? "未知" : (MapValue == 1 ? "男" : "女");
                    }

                    // 由于Mvc的JsonResult的Date Format为 "\/Date()\/"
                    if ((MapValue + '').indexOf("/Date(") > -1) {
                        MapValue = new Date(parseInt((MapValue + '').replace("/Date(", "").replace(")/", ""), 10));
                        MapValue = MapValue.toLocaleDateString();
                    }
                    $.ControlManager.SetControlValue(targetFiled, MapValue, this.ObjectId);
                }
            }
        }
    });
})(jQuery);