//1.重选初始化，搜索关闭
(function ($) {
    //选人控件
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.SheetUser = function () {
        return $.MvcSheetUI.Run.call(this, "SheetUser", arguments);
    };
    //update by luxm第一次加载表单的时候没有走MappingControlsHandler中的if方法导致联动失效
    var isInit = true;
    // 构造函数
    $.MvcSheetUI.Controls.SheetUser = function (element, ptions, sheetInfo) {
        //console.log("$.MvcSheetUI.PortalRoot="+ $.MvcSheetUI.PortalRoot);
        // console.log(element, ptions, sheetInfo, '--------');
        var localUser = window.localStorage.getItem("OThinker.H3.Mobile.User");
        //登陆后的用户信息
        this.userInfo = localUser? JSON.parse(localUser): null;
        // 选择数据集合
        this.Choices = {};
        // 所有选择的元素
        this.ChoicesElement = null;
        // 搜索输入框元素
        this.SearchElement = null;
        this.SearchTxtElement = null;
        this.SearchButton = null;
        // 获取选中的组织ID
        this.SelectedValue = null;
        // 获取当前搜索关键字
        this.SearchKey = null;
        this.SearchMode = false;
        this.KeyTime = null;
        // 搜索结果
        this.SearchResults = [];
        // 组织机构容器
        this.SelectorPanel = null;
        // 面包屑
        this.breadcrumb = [
            {
                name: '根目录',
                id: '00000'
            }
        ];
        // 选中用户
        this.slectUser = null;
        // 只在 Enter 进行搜索
        this.EnterSearch = true;
        this.OrgTreePanel = null;
        this.OrgListPanel = null;
        this.IsOverSelectorPanel = false;
        var url = $.MvcSheetUI.PortalRoot ? $.MvcSheetUI.PortalRoot: "/Portal";
        this.SheetUserHandler = $.MvcSheetUI.PortalRoot + "/SheetUser/LoadOrgTreeNodes";
        this.SheetUserHandlerPortal = $.MvcSheetUI.PortalRoot + "/SheetOtherUser/getDepsAndUsers";

        this.SheetGetUserProperty = $.MvcSheetUI.PortalRoot + "/SheetUser/GetUserProperty";
        this.SheetGetUserProperty =  url + "/SheetUser/GetUserProperty";
        this.executeServiceUrl = $.MvcSheetUI.PortalRoot + "/AjaxServices/executeServiceMethod";
        // this.executeServiceUrl = "http://bpmtest.cccgrealestate.com:8090/Portal/AjaxServices/executeServiceMethod";
        this.cacheData = {};//缓存ajax请求数据
        this.ModelControl = null;
        $.MvcSheetUI.Controls.SheetUser.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetUser.Inherit($.MvcSheetUI.IControl, {
        //移动端
        RenderMobile: function () {
            var that = this
            //baosc s
            // 初始展示当前用户OU人员  包括虚拟用户
            // console.log($.MvcSheetUI.SheetInfo)

            if ($.MvcSheetUI.SheetInfo.UserOUMembers || !this.UserVisible) {}
            else {
                $.MvcSheetUI.SheetInfo.UserOUMembers = [];

            }
            // console.log(this, '最初始化------')

            // 如果发起流程中有我的 `公司字段` 且没设值 则默认添加 我公司-中交定制
            // console.log(this.userInfo, 'this.userInfo')
            var OriginatorOU = $.MvcSheetUI.SheetInfo.OriginatorOU;

            var param = {
                // cmd: "ExecuteServiceMethod",
                // ServiceCode: "FindParentId",
                // MethodName: "findUpTwo",
                // ObjectID: OriginatorOU
                rootUnitID:"",                  //（如果不传值就查数据库根目录，如果传了就以传的作为根目录）；
                userVisible: true,             //是否查询用户；
                groupVisible: true,            //是否查询用户组；
                orgUnitVisible: true,          //是否查询组织单元；
                visibleUnits: ""                //允许显示的组织单元ID集合（以"；"隔开
            };
            //获取当前所在公司
            function getCurrentCom(param) {
                $.ajax({
                    type: "POST",
                    async: false,
                    url: that.executeServiceUrl,
                    data: param,
                    dataType: "json",
                    success: function (data) {
                        console.log(data, 'data');
                        PARENTID = data.ObjectID
                        name = data.name
                    },
                    error: function (e) {
                        // var msg = e.toString();
                        console.warn('error');
                    }
                });
            }
            // 添加申请人所在公司
            if(this.DataField == 'company' && !this.V){
                // console.log(this.DataField,'this.DataField')
                var PARENTID = "";
                var name = "";
                getCurrentCom(param);
                var company = {
                    Name: name ? name: null,
                    ContentType: "O",
                    Code: PARENTID ? PARENTID : null,
                    Size: 0
                };
                if(PARENTID && name) {
                    this.V = company;
                    this.DataItem.V = company;
                    this.Options.V = company;
                    this.Options.DataItem.V = company;
                }
            }

            //是否多选
            this.IsMultiple = this.LogicType == $.MvcSheetUI.LogicType.MultiParticipant;
            //不可用
            if (!this.Editable) {
                $(this.Element).prop("readonly", true);
                $(this.Element).addClass(this.Css.Readonly);
                $(this.Element).addClass("item-content");
            } else {
                this.MoveToMobileContainer();
                var that = this;
                //ionic初始化控件
                this.ionicInit(that, $.MvcSheetUI.IonicFramework);
            }
            //初始化默认值
            this.InitValue();
        },
        //Ionic初始化
        ionicInit: function (that, ionic) {
            //tll:传阅、征询、转发界面展示人员头像采用bpm-sheet-user-selected标签，保存之前表单设计
            if (that.DataField == "fetchUserSelect") {
                ionic.TempScope = ionic.$scope;
                ionic.$scope = $.MvcSheetUI.IonicFramework.$scopeFetchUser;
                var loadOptions = that.GetLoadTreeOption();
                var loadUrl = that.SheetUserHandler + "?IsMobile=true&Recursive=" + that.Recursive;
                var ngmodel = encodeURI(that.DataField).replace(/%/g, '_') + that.Options.RowNum;
                //  that.Mask.parent().addClass("item-icon-right").css("width", "0px");;
                // that.Mask.after('<i class="icon icon-rightadd"></i>');
                that.Mask.parent().addClass("item-icon-right");
                that.Mask.after('<i class="icon ion-ios-arrow-right"></i>');
                var tagName = ngmodel;
                if (tagName.indexOf('.') > -1) {
                    tagName = tagName.replace('.', '_');
                }
                ionic.$scope["sheetUsers" + tagName] = that.ConvertIonicItems(that.GetChoices());
                if (that.Editable) {
                    ionic.$scope["sheetShow"] = true;
                } else {
                    ionic.$scope["sheetShow"] = false;
                }
                //非编辑状态下展示**人*部门
                if (that.V && !that.Editable && that.IsMultiple) {
                    var user = [];
                    var dep = [];
                    that.V.forEach(function (n, i) {
                        if (n.ContentType == 'U') {
                            user.push(n);
                        } else {
                            dep.push(n);
                        }
                    });
                    var obj = $.format(SheetLanguages.Current.Record, user.length, dep.length);
                    that.Mask.parent().before('<span class="record">' + obj + '</span>');
                }

                that.Mask.closest(".item").after('<div class="line"></div>');
                if (that.DataField == "fetchUserSelect") {
                    that.Mask.closest(".item").after('<bpm-sheet-user-selected sheet-show="sheetShow" tag-name="' + tagName + '"  select-users="sheetUsers' + tagName + '" cancel-selected="delUserItem"></bpm-sheet-user-selected>');
                    // var add = $(' ')

                    // that.Mask.parent().parent().after(add);
                }
                that.Mask.closest(".item").attr("data-scopedata", ngmodel);
                that.Mask.closest(".item").attr("data-loadurl", loadUrl);
                that.Mask.closest(".item").attr("data-datafield", ngmodel);
                if (that.Editable) {
                    that.Mask.closest(".item").unbind("click.sheetUser").bind("click.sheetUser", function () {
                        var dataField = $(this).attr("data-scopedata");
                        var loadUrl = $(this).attr("data-loadurl");

                        if (that.DataField == "fetchUserSelect") {
                            ionic.$scope = $.MvcSheetUI.IonicFramework.$scopeFetchUser;
                        } else if (ionic.TempScope) {
                            ionic.$scope = ionic.TempScope;
                        }
                        var obj = ionic.$scope[ngmodel];
                        // console.log(obj, 'obj')
                        var options = {
                            options: obj.Options,
                            selecFlag: that.GetSelectableFlag(),
                            dataField: dataField,
                            ngmodel: ngmodel,
                            loadUrl: loadUrl,
                            loadOptions: obj.GetLoadTreeOption(),
                            initUsers: obj.GetChoices(),
                            isMutiple: obj.IsMultiple
                        };
                        $.MvcSheetUI.sheetUserParams = options;

                        ionic.$state.go("form.sheetuser", {index: 0, parentID: ""});
                    });
                } else {
                    that.Mask.parent().css("display", "none");
                }
                ionic.$compile(that.Mask.closest(".item").next())(ionic.$scope);
                ionic.$scope[ngmodel] = that;
            }
            else {
                // debugger
                var loadOptions = that.GetLoadTreeOption();
                var loadUrl = that.SheetUserHandler + "?IsMobile=true&Recursive=" + that.Recursive;
                var ngmodel = that.DataField + that.Options.RowNum;
                that.Mask.parent().addClass("item-icon-right");
                that.Mask.after('<i class="icon ion-ios-arrow-right"></i>');
                that.Mask.closest(".item").attr("data-scopedata", that.DataField);
                that.Mask.closest(".item").attr("data-loadurl", loadUrl);
                that.Mask.closest(".item").attr("data-datafield", that.DataField);
                that.Mask.closest(".item").unbind("click.sheetUser").bind("click.sheetUser", function () {
                    var dataField = $(this).attr("data-scopedata");
                    var loadUrl = $(this).attr("data-loadurl");
                    var obj = ionic.$scope[ngmodel];
                    // console.log(ionic.$scope[ngmodel], 'ionic.$scope');
                    // debugger
                    var options = {
                        options: obj.Options,
                        selecFlag: that.GetSelectableFlag(),
                        dataField: dataField,
                        ngmodel: ngmodel,
                        loadUrl: loadUrl,
                        loadOptions: obj.GetLoadTreeOption(),
                        initUsers: obj.GetChoices(),
                        isMutiple: obj.IsMultiple
                    };
                    $.MvcSheetUI.sheetUserParams = options;
                    // console.log(options, 'options---------');

                    ionic.$state.go("form.sheetuser", {index: 0, parentID: ""});
                });
            }
            ionic.$scope[ngmodel] = that;
        },

        //初始化值
        InitValue: function () {
            // 设置默认值
            // console.log(this.DefaultValue, 'this.DefaultValue');
            // console.log(this.Originate, 'this.Originate');
            if (this.Originate && !this.V && this.DefaultValue) {
                this.V = this.DefaultValue;
                if (this.V.constructor == String) {
                    if (this.V.toLowerCase() == "originator" || this.V.toLowerCase() == "{originator}") {
                        this.V = this.SheetInfo.Originator;
                    } else if (this.V.toLowerCase() == "{originator.ou}" || this.V.toLowerCase() == "originator.ou") {
                        this.V = this.SheetInfo.OriginatorOU;
                    }
                }
            }
            // console.log(this, '设置默认值')

            this.SetValue(this.V);
            //if (this.IsMobile) {
            //    if (this.Editable) {
            //        this.Mask.html(this.GetText());
            //    } else {
            //        $(this.Elment).html(this.GetText());
            //    }
            //}
        },

        //设置值
        SetValue: function (Obj) {
            // debugger
            if (Obj == undefined || Obj == null || Obj == "") {
                if (this.IsMobile) {
                    if (this.Editable) {
                        if (this.PlaceHolder) {
                            this.Mask.text(this.PlaceHolder);
                        } else {
                            this.Mask.text(SheetLanguages.Current.PleaseSelect);
                        }
                        this.Mask.css({'color': '#797f89'});
                    } else {
                        this.Mask.html(this.PlaceHolder);
                    }
                    return;
                } else {
                    return;
                }
            }
            // console.log(Obj.constructor,'Obj.constructor')
            // console.log(Obj, '设置值')
            if (Obj.constructor == Object) {
                this.initChoceOnInput({ObjectID: Obj.Code, Name: Obj.Name, type: Obj.ContentType, UserGender: Obj.UserGender, UserImageUrl: Obj.UserImageUrl});
            } else if (Obj.constructor == Array) {
                for (var i = 0; i < Obj.length; i++) {
                    if (Obj[i].constructor == Object) {
                        this.initChoceOnInput({ObjectID: Obj[i].Code, Name: Obj[i].Name, type: Obj[i].ContentType, UserGender: Obj[i].UserGender, UserImageUrl: Obj[i].UserImageUrl});
                    } else if (Obj[i].constructor == String) {
                        this.AddUserID(Obj[i]);
                        if (!this.IsMultiple)
                            break;
                    }
                }
            } else if (Obj.constructor == String) {
                if(Obj.indexOf("[")>-1){
                    var users = Obj.replace("[","").replace("]","").replace(" ","").split(",");
                    for (var i = 0; i < users.length; i++) {
                        this.AddUserID(users[i]);
                        if (!this.IsMultiple)
                            break;
                    }
                }else{
                    this.AddUserID(Obj);
                }
            }

            if (this.IsMobile) {
                if (this.Editable) {
                    this.Mask.html(this.GetText());
                    this.Mask.css({'color': '#2c3038'});
                } else {
                    //$(this.Element).html(this.GetText());
                    var txt = this.GetText();
                    var mask = $("<label>").html(this.GetText());
                    $($(this.Element).html("")).append(mask);
                }
            }
        },
        //转化成IONIC所需要的对象格式
        ConvertIonicItems: function (users) {
            var objs = [];
            if (users) {
                if (users.constructor == Object) {
                    var tempUser = {id: users.ObjectID, name: users.Name, type: users.type, UserGender: users.UserGender, UserImageUrl: users.UserImageUrl};
                    objs.push(tempUser);
                } else {
                    users.forEach(function (n, i) {
                        var tempUser = {id: n.ObjectID, name: n.Name, type: n.type, UserGender: n.UserGender, UserImageUrl: n.UserImageUrl};
                        objs.push(tempUser);
                    });
                }
            }
            return objs;
        },
        //清除所有的选择
        ClearChoices: function () {
            for (var ObjectID in this.Choices) {
                this.RemoveChoice(ObjectID);
            }
            this.OnMobileChange();
        },

        //PC端
        Render: function () {
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }
            // 查看痕迹
            if (this.TrackVisiable && !this.Originate && this.DataField.indexOf(".") == -1) {
                this.RenderDataTrackLink();
            }
            //是否多选
            this.IsMultiple = this.Options.IsMultiple || this.LogicType == $.MvcSheetUI.LogicType.MultiParticipant;

            //不可用
            if (!this.Editable) {
                $(this.Element).prop("readonly", true);
                $(this.Element).addClass(this.Css.Readonly);
                $(this.Element).css("padding-top", "6px");
            } else {
                this.ClearChoices();
                this.IsLoaded = false;
                this.SelectedValue = "";
                this.__QueryOptions = "";

                //渲染界面
                this.HtmlRender();
                //绑定事件
                this.BindEnvens();
            }

            //初始化默认值
            this.InitValue();
        },


        //设置组织机构的根目录，传组织编码
        SetRootUnit: function (unitId) {
            // 设置顶点 unit
            // 重新加载树
            this.RootUnitID = RootUnitID;
            this.TreeManager.clear();
            this.TreeManager.loadData(null, this.SheetUserHandler + "?RootUnitID=" + this.RootUnitID);
        },

        //用户ID
        GetValue: function () {
            var users;
            for (var ObjectID in this.Choices) {
                if (this.IsMultiple) {
                    if (users == undefined)
                        users = new Array();
                    users.push(ObjectID);
                } else {
                    users = ObjectID;
                }
            }
            return users == undefined ? "" : users;
        },
        //转化为对象
        GetChoices: function () {
            var choices;
            for (var ObjectID in this.Choices) {
                if (this.IsMultiple) {
                    if (choices == undefined)
                        choices = new Array();
                    choices.push(this.Choices[ObjectID]);
                } else {
                    choices = this.Choices[ObjectID];
                }
            }
            return choices == undefined ? [] : choices;
        },
        //获取显示
        GetText: function () {
            var userNames;
            for (var ObjectID in this.Choices) {
                if (this.IsMultiple) {
                    if (userNames == undefined)
                        userNames = new Array();
                    userNames.push(this.Choices[ObjectID].Name);
                } else {
                    userNames = this.Choices[ObjectID].Name;
                }
            }
            return userNames == undefined ? "" : userNames.toString();
        },

        //保存数据
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable)
                return result;
            result[this.DataField] = this.DataItem;
            if (!result[this.DataField]) {
                if (this.DataField.indexOf(".") == -1) {
                    alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField);
                }
                return {};
            }

            var users = this.GetValue();
            // if (result[this.DataField].V != users)
            {
                result[this.DataField].V = users;
                return result;
            }
            return {};
        },
        //渲染样式
        HtmlRender: function () {
            this.ID = $(this.Element).attr("ID") || $.MvcSheetUI.NewGuid();
            $(this.Element).attr("ID", this.ID);
            $(this.Element).css("z-index", "inherit");
            //设置页面元素的样式
            $(this.Element).addClass("select2-container select2-container-multi ").attr("data-sheetusercontrol", true);

            $(this.Element).css("min-width", "150px");
            // Validate
            // console.log(this.DataField,'DataField');
            //设置输入框
            if (this.ChoicesElement == null) {
                this.ChoicesElement = $("<ul>").addClass("select2-choices").css("overflow", "hidden");
                // 如果是表单使用的选人控件 则定位为fixed 防止子表overflow FixedBug
                if(this.DataField) {
                    $(this.ChoicesElement).addClass('has-data-field')
                }
                this.SearchElement = $("<li>").addClass("select2-search-field").css({"display": 'flex'});
                this.SearchTxtElement = $("<input placeholder='请选择'/>").addClass("form-control").addClass("no-padding").css({"flex": "1 0 auto"});
                // 如果是表单使用的选人控件 则定位为fixed 防止子表overflow FixedBug
                if(this.DataField) {
                    $(this.SearchTxtElement).addClass('has-data-field')
                }
                this.SearchTxtElement.attr("PlaceHolder", SheetLanguages.Current.PleaseSelect);
                this.SearchTxtElement.width("1px");
                this.icon = $("<span class='icon aufontAll h-icon-all-customer-o'></span>");
                this.icon.css({"color": "#D8D8D8","height": "30px", "margin": '0',"line-height": "30px"});
                //添加输入框

                this.SearchElement.append(this.SearchTxtElement);
                //this.SearchElement.append(this.icon);
                this.ChoicesElement.append(this.SearchElement);
                $(this.Element).append(this.ChoicesElement);
            }

            this.SetSearchTxtElementWidth.apply(this);

            //不可用
            if (!this.Editable) {
                $(this.SearchTxtElement).prop("readonly", true);
                $(this.SearchElement).width("100%");
                $(this.SearchElement).addClass(this.Css.Readonly);
                this.SearchTxtElement.closest("ul").css("border", "0px");
                this.SearchTxtElement.width("100%");
                return;
            }



            if (!this.Recursive ||
                this.RoleName ||
                this.OrgPostCode ||
                this.UserCodes) { // 只显示下拉框，不显示左侧菜单
                // this.OrgTreePanel.hide();
                // this.SelectorPanel.css("min-width", "0px");
            } else {
                // this.OrgTreePanel.show();
                // this.SelectorPanel.css("min-width", "360px");
            }
        },
        //绑定事件
        BindEnvens: function () {
            var that = this;
            // console.log(that, 'that')
            if (!this.Editable)
                return; //不可用

            //点击到当前元素，设置input焦点
            $(this.ChoicesElement).unbind("click.SheetUser").bind("click.SheetUser", this, function (e) {
                e.data.SearchTxtElement.focus();
            });

            //得到焦点显示
            $(this.SearchTxtElement).unbind("focusin.SearchTxtElement").bind("focusin.SearchTxtElement", this, function (e) {

                e.data.FocusInput.apply(e.data);

            });
            // 失去焦点事件
            $(this.SearchTxtElement).unbind("blur.SearchTxtElement").bind("blur.SearchTxtElement", [this], function (e) {
                // console.log(e.data[0],'e-------');
                if (e.data[0].FormatRule && e.data[0].GetValue() != "") {
                    e.data[0].GetFromatValue($(e.data[0].Element), e.data[0].GetValue());
                }
            });
            if (!this.Recursive) { //不递归的时候，直接显示内容
                var SheetUserManager = this;
                //读取控件上的属性
                $.ajax({
                    type: "GET",
                    url: this.SheetUserHandler + "?Recursive=false&" + this.GetLoadTreeOption(),
                    dataType: "json",
                    //async: false,//同步执行
                    success: function (data) {
                        for (var i = 0; i < data.length; ++i) {
                            SheetUserManager.AddListItem.apply(SheetUserManager, [data[i]]);
                        }
                    }
                });
                if (this.IsMobile) {
                    //this.FocusInput();
                } else {
                    $(document).unbind("click." + this.ID).bind("click." + this.ID, this, function (e) {
                        if ($(e.target).closest("div[id='" + e.data.ID + "']").length == 0) {
                            e.data.FocusOutput.apply(e.data);
                        }
                    });
                }
                $(this.SearchTxtElement).prop("readonly", "readonly");
                return;
            }

            if (this.IsMobile) {
                // 输入控件
                $(this.SearchTxtElement).unbind("keydown.SearchTxtElement").bind("keydown.SearchTxtElement", this, function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });

                // 移动端仅在Enter时执行搜索
                $(this.SearchTxtElement).unbind("keyup.SearchTxtElement").bind("keyup.SearchTxtElement", this, function (e) {
                    if (e.which == 13) {
                        e.data.SetSearchTxtElementWidth.apply(e.data);
                        e.data.FocusInput.apply(e.data);
                        e.data.SearchOrg.apply(e.data, [e.data]);
                    }
                });
            }
            else {
                // 输入控件
                $(this.SearchTxtElement).unbind("keyup.SearchTxtElement").bind("keyup.SearchTxtElement", this, function (e) {
                    e.data.SetSearchTxtElementWidth.apply(e.data);
                    e.data.FocusInput.apply(e.data);
                    e.data.KeyTime = new Date();
                    // setTimeout("e.data.SearchOrg.apply(e.data, [e.data])", 500);
                    var that = e.data;
                    setTimeout(function () {
                        that.SearchOrg.apply(that, [that]);
                    }, 500)
                });
                $(this.SearchTxtElement).unbind("keydown.SearchTxtElement").bind("keydown.SearchTxtElement", this, function (e) {
                    if (e.keyCode == 8 && $(this).val() == "") {
                        e.data.RemoveChoice.apply(e.data, [$(this).parent().prev().attr("data-code")]);
                    }
                });
            }

            $(that.Element).find('.cancel_btn').unbind("click." + this.ID).bind("click." + this.ID, this, function (e) {
                that.FocusOutput.apply(that);
            });

            if (this.IsMobile) {
                $(this.OrgListBtn).unbind("click.OrgListBtn").bind("click.OrgListBtn", this, function (e) {
                    var targetID = $(this).data("targetID");
                    e.data.AddMobilePanel.apply(e.data, [targetID, ""]);
                });
            }

            // 新版pc选人控件事件

            $(this.Element).on("click.nextorg",".next-org",function(e){
                var parent = $(e.currentTarget).parents(".h3-organization-tree-item")
                if($(this).hasClass("h3-organization-tree-item_child--selected")){
                    return;
                }
                var ParentID = parent.attr("data-id");
                if(!ParentID) {
                    return
                }
                var type =  parent.attr('type');
                var displayText = parent.attr('displayText');
                that.getNextOrg(displayText, ParentID)
            })
            $(this.Element).on("click.breadcrumb",".h3-organization-breadcrumb-item",function(e){

                var id = $(e.currentTarget).attr("bread-id");
                if(!id) {
                    return
                }
                var index = $(that.Element).find(".h3-organization-breadcrumb-item").index($(this));
                if(index == that.breadcrumb.length-1)
                    return;
                that.breadcrumb.splice(index+1,that.breadcrumb.length-1-index);
                that.showBreadcrumb();
                that.getUserOrgById(id)
            })

            $(this.Element).on("click.userCheckbox",".ant-checkbox-input",function(e){
                var parentItem = $(this).parents(".h3-organization-tree-item");
                var id = parentItem.attr("data-id");
                var displayText = parentItem.attr("displayText");
                var type = parentItem.attr("type");
                var checked = $(this).prop("checked");
                var isCheckAll = $(this).hasClass("checkall");
                if(checked){
                    if(isCheckAll){
                        that.selectAll();
                        return;
                    }
                    parentItem.find(".next-org").addClass("h3-organization-tree-item_child--selected");
                    that.selectChoice({ObjectID:id,Name:displayText,type:type});
                    $(this).parents(".ant-checkbox").addClass("ant-checkbox-checked");
                }
                else {
                    if(isCheckAll){
                        that.cancelSelectAll();
                        return;
                    }
                    that.RemoveChoice(id);
                    parentItem.find(".next-org").removeClass("h3-organization-tree-item_child--selected");
                    $(this).parents(".ant-checkbox").removeClass("ant-checkbox-checked")
                }
                that.checkSelectAllState();

            })
            $(this.Element).on("click",".h3-organization-selected  .h-icon-all-close",function(e){
                var id = $(this).parents(".h3-organization-selected").data("code");
                that.RemoveChoice(id);
                that.checkSelectAllState();

            })

            // 搜索设置
            that.canSearch=true;
            $(this.Element).on("compositionend",".h3-organization-body-search_input",function(e){
                that.canSearch=true;
            })
            $(this.Element).on("compositionstart",".h3-organization-body-search_input",function(e){
                that.canSearch=false;

            })
            $(this.Element).on("keyup",".h3-organization-body-search_input",function(e){
                var searchKey = $(this).val().trim();
                if(searchKey){
                    that.closeSearch.show();
                }
                else{
                    that.closeSearch.hide();
                }
                if(!that.canSearch){
                    return;
                }
                if(searchKey==that.oldSearKey)
                    return;
                if(!searchKey){
                    that.searchResult.hide();
                    return;
                }
                //函数节流
                clearTimeout(that.searchTimes);
                that.searchTimes = setTimeout(function(){
                    that.search(searchKey)
                },500);
                that.oldSearKey = searchKey;

            })
            $(this.Element).on("click",'.ant-btn-close', function (e) {
                that.SelectorPanel.hide();
                if($(this).data("action")=="ok"){
                    that.selectComplete();
                }

            });

            $(this.Element).on("click",function(e){
                if($(e.target).closest(".h3-organization-body-search-result").length==0&&$(e.target).closest(".h3-organization-body-search").length==0){
                    that.searchResult.hide();
                }
            })
            $(this.Element).on("click",'.close-search', function (e) {
                that.searchInput.val("");
                that.searchResult.hide();
                that.closeSearch.hide();
            });
            $(this.Element).on("click",'.sheetuser-tab li', function (e) {
                var tabPage=$(this).data("tab");
                if($(this).hasClass("active")){
                    return;
                }
                $(that.Element).find(".sheetuser-tab li.active").removeClass("active");
                $(this).addClass("active");
                if(tabPage=="orgPage"){

                    that.recentPage.hide();
                    that.orgPage.show();
                    that.showUserOrg();
                }
                else if(tabPage=="gropPage"){

                    that.recentPage.hide();
                    that.orgPage.show();
                    that.showfavioGroup();
                }
                else if(tabPage=="searchPage"){

                    that.recentPage.show();
                    that.orgPage.hide();
                    that.showAdvanceSearch();
                }
                else if(tabPage=="recentPage"){

                    that.recentPage.show();
                    that.orgPage.hide();
                    that.showRecent();
                }

            });

            //高级搜索
            $(this.Element).on("click",".search",function(){
                var searchKey = $(that.Element).find(".advanceSearchKey").val();
            
                var perfectMatch = $(that.Element).find(".precise").prop("checked");
               
                that.search(searchKey,perfectMatch,true);
            });


        },
        showDialog:function(){
            this.SelectorPanel.show();
            this.searchResult.hide();
            this.breadcrumb.splice(1,this.breadcrumb.length-1);
            $(".h3-organization-body-search_input").val("");
            this.getUserOrgById(this.breadcrumb[0].id);
        }
        ,
        // 创建一个对话框
        CreatedDialog: function() {
            var that = this;
            this.SelectorPanel = $('<div class="select-content-box"></div>');
            var boxInner = $('<div class="ant-modal"></div>');
            var boxInnerContent = $('<div class="ant-modal-content"></div>');
            var boxHeader = $('<div class="ant-modal-header"><div id="" class="ant-modal-title">地址本</div></div>');
            var boxtab = $('<div class="sheetuser-tab" style="overflow:hidden"><ul>'+
            '<li data-tab="recentPage"><i class="aufontAll h-icon-all-clock-circle-o"></i><span>最近</span></li>'+
            '<li data-tab="orgPage" class="active"><i class="aufontAll h-icon-all-process-o"></i><span>组织机构</span></li>'+
            '<li data-tab="gropPage"><i class="aufontAll h-icon-all-team-o"></i><span>常用群组</span></li>'+
            '<li data-tab="searchPage"><i class="aufontAll h-icon-all-search-o"></i><span>高级搜索</span></li>'+
            '</ul></div>');
            var advancedSearch = $('<div class="advanceSearchPanel" style="display:none"><input class="advanceSearchKey"><button type="button" class=" ant-btn ant-btn-default search"><span>搜索</span></button><input type="checkbox" class="precise">精确搜索</div>') 
            this.advancedSearch =advancedSearch;
            var boxClose = $('<span class="ant-modal-close"><span class="ant-btn-close ant-modal-close-x aufontAll h-icon-all-close"></span></span>');
            // 主体
            var boxBody = $('<div class="ant-modal-body"></div>');
            var boxBodyBox = $('<div class="h3-organization-body"></div>');

            // 左侧
            var boxLeft = $('<div class="h3-organization-body-left"></div>');
            this.boxLeft = boxLeft;
            that.selectedPanel = $('<div class="h3-organization-body-right"></div>');
            var boxLeftSearch = $(' <div class="h3-organization-body-search">'
                + '<i class=" aufontAll h-icon-all-search h3-organization-body-search_icon anticon anticon-search" ></i>'
                + '<input placeholder="搜索组织、姓名" class="h3-organization-body-search_input" /><i class=" aufontAll h-icon-all-close close-search" style="display:none"></i>'
                +'<div class="h3-organization-body-search-result " style="display:none"></div>'
                + '</div>');

            that.searchInput = boxLeftSearch.find(".h3-organization-body-search_input");
            that.searchResult = boxLeftSearch.find(".h3-organization-body-search-result");
            that.closeSearch = boxLeftSearch.find(".close-search");
            // 组织头部
            var boxLeftOrz = $('<div class="h3-organization-body-org"> </div>');
            // 面包屑
            var boxBreadcrumb = $(' <div class="h3-organization-body-org-breadcrumb"></div>');
            that.boxBreadcrumbBox = $(' <div class="ant-breadcrumb"></div>');
            var boxBreadList = '';

            that.boxLeftTree = $(' <div class="h3-organization-body-org-tree"></div>');

            var boxLeftList = '';

            // 面包屑
            $(boxBreadcrumb).append(that.boxBreadcrumbBox);
            $(boxLeftOrz).append(boxBreadcrumb);
            //     // 搜索
            this.orgPage = $("<div style='height:100%'></div>");
            this.recentPage=$("<div style='height:100%;display:none'></div>");
            this.groupPage=$("<div style='height:100%;display:none'></div>");
            this.searchPage=$("<div style='height:100%;display:none'></div>");
            this.orgPage.append(boxLeftSearch);
            //组织列表
            this.orgPage.append(boxLeftSearch);
            
            $(boxLeftOrz).append(that.boxLeftTree);
            this.orgPage.append(boxLeftOrz);//左侧
            //  $(boxRight).append(selectUser);//右侧
            boxLeft.append(this.orgPage);
            boxLeft.append(this.groupPage);
            boxLeft.append(this.searchPage);
            boxLeft.append(this.recentPage);
            $(boxBodyBox).append(boxLeft);
            $(boxBodyBox).append(that.selectedPanel);

            // 底部
            var boxFooter =  $('<div class="ant-modal-footer"><div class="h3-organization-footer">'
                + '<div><button type="button" class="ant-btn-close ant-btn ant-btn-default"><span>取 消</span></button>'
                + '<button type="button" data-action="ok" class="ant-btn-close  ant-btn ant-btn-primary"><span>确 定</span></button></div>'
                + '<div class="select-count-label">已选择： 0 个人</div></div></div>');

            $(boxBody).append(boxBodyBox);
            $(boxInner).append(boxInnerContent);
            $(boxInnerContent).append(boxClose);
            $(boxInnerContent).append(boxHeader);
            $(boxInnerContent).append(boxtab);
            $(boxInnerContent).append(advancedSearch);
            $(boxInnerContent).append(boxBody);
            $(boxInnerContent).append(boxFooter);
            this.selectCountEl = $(boxInnerContent).find(".select-count-label");
            $(this.SelectorPanel).append(boxInner);

            $(this.Element).append(this.SelectorPanel);
            // 加载根节点
            // 获取组织机构
            var paramOptions = this.GetLoadTreeOption();
           
            this.showUserOrg();
            this.initRightChoice();
            this.countSelect();


        },
        showUserOrg:function(){
            this.advancedSearch.hide();
            this.getUserOrgById();
        }
        ,
        showRecent:function(){
            var that = this;
            that.advancedSearch.hide();
           // that.recentData = JSON.parse(localStorage.getItem("recent"));
           
            if(that.recentData){
               that.recentPage.html(this.getUserOrOrgHtml(that.recentData).html);
            }
           
            that.recentAjax&&that.recentAjax.abort();
            that.recentAjax=$.ajax({
                url: '/Portal/SheetUser/getHistoryUnits',
                type: "GET",
                dataType: "json",
                async: true,
                completed: function () {},
                success: function (data) {
                    if (data.code==200) {
                        that.recentData = data.data.user;
                        that.recentPage.html(getUserOrOrgHtml(data).html);
                    }
                },
                error: function (err) {
                    console.log(err, 'data')
                }
            });
            
        }
        ,
        getUserOrOrgHtml:function(data)
        {
            var orgHtml="";
            var userHtml = "";
            var countU = 0;
            var countO = 0;
            var userImgHtml = '<span class="h3-organization-search-item-info_avatar">\n' +
                '                     <span class="ant-avatar ant-avatar-circle ant-avatar-image" style="width: 24px; height: 24px; line-height: 24px; font-size: 18px;">\n' +
                '                            <img src="/Portal/Mobile/img/userman.png">\n' +
                '                     </span>\n' +
                '              </span>\n' ;
            var userTempHtml = "";
            var tempHtml = "";
            for(var i = 0; i < data.length; i++){
                var checkedClass = "";
                var checked = "";
                if(this.Choices[data[i].objectId]){
                    checkedClass = "ant-checkbox-checked";
                    checked = "checked";
                }
                userTempHtml = "";
                if(data[i].unitType=="U"){
                    userTempHtml = userImgHtml;
                }
                tempHtml =          '<div class="h3-organization-search-content-item h3-organization-tree-item" data-id="'+data[i].objectId+'" displayText="'+data[i].name+'" type="' + data[i].unitType + '">\n' +
                    '                    <div class="h3-organization-search-content-item_checkbox">\n' +
                    '                        <label class="ant-checkbox-wrapper">\n' +
                    '                            <span class="ant-checkbox '+checkedClass+'">\n' +
                    '                                <input type="checkbox" class="ant-checkbox-input" '+checked+' value="">\n' +
                    '                                <span class="ant-checkbox-inner"></span>\n' +
                    '                            </span>\n' +
                    '                        </label>\n' +
                    '                    </div>\n' +
                    '                    <div class="h3-organization-search-item-info">\n' +userTempHtml+

                    '                        <div class="h3-organization-search-item-info-main">\n' +
                    '                            <span>'+data[i].name+'</span>\n' +
                    '                            <span>'+(data[i].depName||"")+'</span>\n' +
                    '                        </div>\n' +
                    '                    </div>\n' +
                    '                </div>\n' ;
                if(data[i].unitType=="U"){
                    userHtml += tempHtml;
                    countU++;
                }
                else
                {
                    orgHtml += tempHtml;
                    countO ++;
                }
            }
            return {
                html:'<div style="height:100%;overflow:auto">'+orgHtml+userHtml+'</div>',
                countO:countO,
                countU:countU
            }
        }
        ,
        showSearchResult:function(data){
            this.searchResult.removeClass("h3-organization-body-search-result--nodata");
            if(data.length==0){
                this.searchResult.addClass("h3-organization-body-search-result--nodata").html("没有匹配到相关信息").show();
                return;
            }

            var userInfoObj = this.getUserOrOrgHtml(data);
            var searchTitle = '<div class="h3-organization-search-title">\n' +
                '                <span>搜索结果: '+userInfoObj.countU+'个人，'+userInfoObj.countO+'个部门</span>\n' +
                '                <span>'+(userInfoObj.countU+userInfoObj.countO)+' 条结果</span>\n' +
                '            </div>\n';


            var searchHtml = searchTitle+'<div class="h3-organization-search-content">'+userInfoObj.html+'</div>';


            this.searchResult.html(searchHtml).show();
        }
        ,
        cancelSelectAll:function(){
            $(this.Element).find(".h3-organization-body-org-tree").find(".ant-checkbox").removeClass("ant-checkbox-checked");
            $(this.Element).find(".h3-organization-body-org-tree").find(".ant-checkbox-input").prop("checked",false);
            $(this.Element).find(".next-org").removeClass("h3-organization-tree-item_child--selected");
            var currentData = this.cacheData[this.breadcrumb[this.breadcrumb.length-1].id];
            for(var i = 0; i < currentData.length; i++){
                currentData[i].canSelect&&this.RemoveChoice(currentData[i].objectId);
            }
        },
        //全选
        selectAll:function(){
            $(this.Element).find(".h3-organization-body-org-tree").find(".ant-checkbox").addClass("ant-checkbox-checked");
            $(this.Element).find(".h3-organization-body-org-tree").find(".ant-checkbox-input").prop("checked",true);
            $(this.Element).find(".next-org").addClass("h3-organization-tree-item_child--selected");
            var currentData = this.cacheData[this.breadcrumb[this.breadcrumb.length-1].id];

            for(var i = 0; i < currentData.length; i++){
                if(currentData[i].canSelect){
                    this.selectChoice({
                        ObjectID:currentData[i].objectId,
                        type:currentData[i].unitType,
                        Name:currentData[i].name,
                    });
                }

            }

        },
        checkSelectAllState:function(){
            if(!this.IsMultiple){
                return;
            }
            var checkLength = $(this.Element).find(".checkbox-panel").find(".ant-checkbox").length;
            var checkedLength = $(this.Element).find(".checkbox-panel").find(".ant-checkbox-input:checked").length;
            var checkAllEl = $(this.Element).find(".h3-organization-body-org-tree").find(".checkall");
            if(checkLength==checkedLength){
                checkAllEl.prop("checked",true);
                checkAllEl.parent().addClass("ant-checkbox-checked");
            }
            else
            {
                checkAllEl.prop("checked",false);
                checkAllEl.parent().removeClass("ant-checkbox-checked");
            }
        }
        ,
        search:function(searchKey,perfectMatch,advance){
            perfectMatch = perfectMatch ||false;
            var o = "";
            if (this.OrgUnitVisible) {
                o += "O";
            }
            if (this.GroupVisible) {
                o += "G";
            }
            if (this.UserVisible) {
                o += "U";
            }
            var that = this;
            if(that.searchAjax)
            {
                that.searchAjax.abort();
            }
            that.searchAjax=$.ajax({
                url: this.SheetUserHandlerPortal + "?LoadTree=true&Recursive=" + this.Recursive + "&o="+o+"&SearchKey="+searchKey+"&perfectMatch="+perfectMatch,
                type: "GET",
                dataType: "json",
                async: true,
                completed: function () {},
                success: function (data) {
                    if(advance){
                        that.recentPage.html(that.getUserOrOrgHtml(data).html);
                    }
                    else
                    {
                        that.showSearchResult(data);
                    }

                },
                error: function (err) {
                    console.log(err, 'data')
                }
            });
        },
        // 获取下级
        getNextOrg:function(displayName,ParentID) {
            // 面包屑
            var that = this;
            // 防止多次点击
            if(that.getUserOrging){
                return;
            }
            that.breadcrumb.push({
                name: displayName,
                id: ParentID
            });

            that.getUserOrgById(ParentID);

        },

        showBreadcrumb:function(){
            var that = this;


            var breadHtml = '';
            if(that.breadcrumb.length>1){
                for(var i = 0;i <that.breadcrumb.length;i++) {
                    breadHtml += '<span class="h3-organization-breadcrumb-item" bread-id='+that.breadcrumb[i].id+'>'+
                        '<span class="ant-breadcrumb-link" >'+
                        '<i class="aufontAll h-icon-all-rollback-o"></i>'+that.breadcrumb[i].name+'</span>'+
                        '<span class="ant-breadcrumb-separator">/</span> </span>'
                }
            }

            that.boxBreadcrumbBox.html(breadHtml);
        }
        ,
        showAdvanceSearch:function(){
            this.advancedSearch.show();
            this.recentPage.html("");
        }
        ,

        showfavioGroup:function(){
            
            var that = this;
            that.advancedSearch.hide();
            return;
            if(that.faviogroupData){
               that.boxLeftTree.html(getUserOrgTreeHtml(faviogroupData));
            }
            that.recentAjax&&that.recentAjax.abort();
            that.recentAjax=$.ajax({
                url: this.SheetUserHandlerPortal + "?LoadTree=true&Recursive=" + this.Recursive + "&o="+o+"&SearchKey="+searchKey,
                type: "GET",
                dataType: "json",
                async: true,
                completed: function () {},
                success: function (data) {
                    that.faviogroupData = data;
                    that.boxLeftTree.html(getUserOrgTreeHtml(data));

                },
                error: function (err) {
                    console.log(err, 'data')
                }
            });
           
        }
        ,
        getUserOrgById:function(ParentID){



            var that = this;
            // that.showUserOrgList(JSON.parse(localStorage.getItem("org")))
            // return;

            if(that.cacheData[ParentID]){
                that.showUserOrgList(that.cacheData[ParentID])
                that.showBreadcrumb();
                return;
            }
            if(this.UserVisible){
                o = "OUG"
            }
            else
            {
                o = "OG";
            }
            var searStr = "?o="+o;
            if(ParentID){
                searStr+= "&ParentID=" + ParentID;
            }

            that.getUserOrging = true; // 获取下级组织请求发送状态
            $.ajax({
                url: that.SheetUserHandlerPortal + searStr,
                type: "GET",
                dataType: "json",
                async: true,
                complete: function () {
                    that.getUserOrging = false;
                },
                success: function (data) {
                    if(ParentID){
                        that.cacheData[ParentID] = data;
                    }
                    else
                    {
                        that.cacheData[that.breadcrumb[0].id] = data;
                    }
                    that.showBreadcrumb();
                    that.showUserOrgList(data)
                }
            })
        },
        getUserOrgTreeHtml:function(data){
            var that = this;
            var htmlUser = '';
            var htmlOrg = '';
            var htmlAll = '';
            var checkAll = "";
            var checkedCount = 0 ;
            var canCheckCount = 0;
            var checkAllClass = "";
            for(var i = 0;i <data.length;i++) {


                var checkBox = "";
                var checkedClass=""
                var checked=""
                var nextOrgClass="";

                if(that.GetLoadTreeOption().indexOf(data[i].unitType)!=-1){
                    if(that.Choices[data[i].objectId]){
                        checkedClass = "ant-checkbox-checked";
                        checked = "checked";
                        nextOrgClass = "h3-organization-tree-item_child--selected";
                        checkedCount++;
                    }
                    checkBox ='<span class="ant-checkbox '+checkedClass+'">' +
                        '<input type="checkbox" '+checked+' class="ant-checkbox-input" value="">' +
                        '<span class="ant-checkbox-inner"></span></span>';
                    canCheckCount++;
                    data[i].canSelect = true;
                }
                if(data[i].unitType == 'U') {
                    htmlUser += '<div class="h3-organization-tree-item" data-id="'+data[i].objectId+'" displayText="'+data[i].name+'" type="' + data[i].unitType + '">' +
                        '<div class="h3-organization-tree-item_checkbox">' +
                        '<label class="ant-checkbox-wrapper" >' +checkBox+

                        '<span><span class="ant-avatar ant-avatar-circle ant-avatar-image" style="width: 20px; height: 20px; line-height: 20px; font-size: 18px;margin-right:8px">'
                        +
                        '<img src="/Portal/Mobile/img/userman.png"/>'
                        +
                        '</span>' + data[i].name + '</span>' +
                        '</label>' +
                        '</div></div>';
                }
                if(data[i].unitType == 'G' || data[i].unitType == 'O') {
                    htmlOrg += '<div class="h3-organization-tree-item" displayText="'+data[i].name+'" data-id="' + data[i].objectId + '" type="' + data[i].unitType + '">' +
                        '<div class="h3-organization-tree-item_checkbox" >' +checkBox+
                        '<div style="display: inline-block;" >' + data[i].name + '</div></div>'+
                        '<div class=" next-org h3-organization-tree-item_child '+nextOrgClass+'" >'  +
                        '<i class=" aufontAll h-icon-all-subordinate-o"></i>下级</div></div>';
                }
            }
            //是否已经全选
            if(checkedCount == canCheckCount){
                checkAllClass = "ant-checkbox-checked"
            }
            //有可选的，添加全选按钮
            if(canCheckCount&&that.IsMultiple){
                checkAll = '<span class="ant-checkbox  '+checkAllClass+'">' +
                    '<input type="checkbox" '+checked+' class="ant-checkbox-input checkall" value="">' +
                    '<span class="ant-checkbox-inner"></span></span><span>全选</span>';
            }

            htmlAll =checkAll+ "<div class='checkbox-panel'>"+ htmlOrg + htmlUser + "</div>";
            return htmlAll;
        },
        showUserOrgList:function(data){

           
            this.boxLeftTree.html( this.getUserOrgTreeHtml(data));

        }   ,



        //加载组织机构树
        LoadOrz: function () {

        },
        //移动端:添加panel
        AddMobilePanel: function (id, parentID) {
            this.Level++;
            var that = this;
            var divObj = $("#" + id);
            if (divObj.length == 0) {
                //新pannel
                divObj = $("<div>").attr('id', id).addClass('panel').addClass('no-scroll').hide();
                if (parentID != "") {
                    var parentObj = $("li[objectID='" + parentID + "']>label");
                    if (parentObj.length == 0)
                        parentObj = $("li[objectID='" + parentID + "']");
                    divObj.attr("data-title", parentObj.text());
                } else {
                    divObj.attr("data-title", $.ui.prevHeader.find("#pageTitle").text());
                }
                divObj.attr("data-footer", this.FooterID);
                divObj.data("parentid", parentID);
                var loadUrl = that.SheetUserHandler + "?IsMobile=true&" + that.GetLoadTreeOption();
                if (parentID) {
                    loadUrl = that.SheetUserHandler + "?IsMobile=true&ParentID=" + parentID + "&" + that.GetLoadTreeOption();
                }

                $.ajax({
                    type: "GET",
                    url: loadUrl,
                    dataType: "json",
                    context: that,
                    async: false, //同步执行
                    success: function (data) {
                        // console.log(data, 'data')
                        var ul = $("<ul>").addClass('orglist').addClass('list');
                        that.AddMobileOptions(data, ul);

                        var wrapper = $("<div class='scroll-wrapper'>");
                        wrapper.append(ul);
                        divObj.append(wrapper);

                        $('#content').append(divObj);

                        that.SetMobilePanelRefreshOnload(id);
                    }
                });

                //添加
                //$.ui.addContentDiv(id);
            }

            //显示
            $.ui.loadContent(id);
            //检查是否选中
            this.MobileFindCheckbox(id);
        },

        MobilePreBack: function () {
            var id = "#" + $.ui.activeDiv.id;
            if (this.Level > 0) {
                this.Level--;
            }
            this.MobileFindCheckbox(id);
        },

        //设置页面加载时自动刷新滚动条
        SetMobilePanelRefreshOnload: function (panelId) {
            var that = this;
            //进入页面时自动刷新滚动条
            window.PanelLoadActions = window.PanelLoadActions || {};
            var that = this;
            var fnName = 'F' + this.EditPanel.attr('id').replace(/\-/g, '');

            $('#' + panelId).attr('data-load', 'window.PanelLoadActions.' + fnName)

            window.PanelLoadActions[fnName] = function () {
                setTimeout(function () {
                    that.RefreshMobilePage();
                }, 600);
            }
        },

        AddMobileOptions: function (data, ulList, searchKey) {
            if (data) {
                var that = this;
                if (data instanceof Array) {
                    if (data.length) {
                        $(data).each(function () {
                            that._AddMobileOption(this, ulList, searchKey);
                        })
                    } else {
                        ulList.html('<li class="user-item">没有任何组织</li>');
                    }
                } else {
                    that._AddMobileOption(data, ulList, searchKey);
                }
            } else {
                ulList.html('<li class="user-item">没有任何组织</li>');
            }
        },

        //获取是否允许选择组、OU、用户的标识
        GetSelectableFlag: function () {
            if (typeof (this.__SelectableOption) == 'undefined') {
                this.__SelectableOption = '';

                loadOptions = this.GetLoadTreeOption();
                var o = loadOptions.match(/o=[A-z]*/)
                if (o && o.length) {
                    this.__SelectableOption = o[0].replace('o=', '');
                }
            }
            return this.__SelectableOption;
        },

        //添加可选项
        _AddMobileOption: function (item, ulList, searchKey) {
            // debugger
            var selectableFlag = this.GetSelectableFlag();
            var li = $("<li>").addClass('user-item');
            if (selectableFlag.indexOf(item.ExtendObject.UnitType) > -1) {
                var checkboxid = $.uuid();
                var checkbox = $("<input type='checkbox'  id='" + checkboxid + "' data-objectid='" + item.ObjectID + "'/>");
                checkbox.attr("checked", this.Choices && this.Choices[item.ObjectID] != undefined);
                li.append(checkbox);

                var displayText = item.Text;
                if (searchKey) {
                    displayText = displayText.replace(searchKey, "<span class='bg-info'>" + searchKey + "</span>");
                    if (displayText.indexOf("[" + item.Code + "]") == -1) {
                        displayText += "[" + item.Code.replace(searchKey, "<span class='bg-info'>" + searchKey + "</span>") + "]";
                    }
                }

                li.append($("<label type='checkbox' label-for='" + checkboxid + "'>" + displayText + "</label>").css("float", "none").css("left", "25px"));
            } else {
                li.append(item.Text);
            }
            li.attr("objectID", item.ObjectID);
            var targetId = $.uuid();
            li.attr("targetID", targetId);

            if (!item.IsLeaf) {
                var linkelemnt = $("<a data-ignore=true>" + $(li).html() + "</a>");
                $(li).html("").append(linkelemnt);

                li.append($('<div>').addClass('org-expand').css({
                    width: '20%',
                    height: '100%',
                    'z-index': 2,
                    position: 'absolute',
                    right: 0,
                    top: 0
                }));
            }
            ulList.append(li);

            var node = {
                ObjectID: item.ObjectID,
                Name: item.Text
            };
            $(li).unbind("click.OrgListBtn").bind("click.OrgListBtn", [this, node], function (e) {
                var t = e.data[0];
                var n = e.data[1];
                if ($(e.target).is('.org-expand') || $(this).find('input[type=checkbox]').length == 0) {
                    var parentID = $(this).attr("objectID");
                    var targetID = $(this).attr("targetID");
                    $("#defaultHeader>.backButton").data("pannelid", targetId);
                    t.AddMobilePanel.apply(t, [targetID, parentID]);
                } else {
                    var chk = $(this).find("input[type=checkbox]")
                    chk.prop('checked', !chk.prop('checked'));

                    t.UnitCheckboxClick.apply($(this).find("input[type=checkbox]").get(0), e.data);
                }
            });
        },

        //检查是否选中
        MobileFindCheckbox: function (id) {
            if (id == undefined && $.ui.history) {
                id = $.ui.history[$.ui.history.length - 1].target
            }

            if (id.indexOf("#") < 0) {
                id = "#" + id;
            }

            var that = this;
            $(id).find("input:checkbox").each(function () {
                $(this).prop("checked", that.Choices[$(this).attr("data-objectid")] != undefined);
            });
        },

        //设置输入框的宽度
        SetSearchTxtElementWidth: function () {
            if (this.IsMobile) {
                return;
            }
            var w = "1px";
            var length = this.SearchTxtElement.val().length;
            if (length > 0) {
                w = length * 15 + "px";
                this.SearchTxtElement.removeAttr("PlaceHolder", this.PlaceHolder);
            } else if ($.isEmptyObject(this.Choices)) {
                w = "117px"; //update by zhangj
                this.SearchTxtElement.attr("PlaceHolder", this.PlaceHolder);
            } else {
                this.SearchTxtElement.removeAttr("PlaceHolder", this.PlaceHolder);
            }
            $(this.SearchTxtElement).width(w);
            // console.log(this.SearchTxtElement.parent().parent().width())
            // if (this.IsMobile) {
            //     $(this.SelectorPanel).css("top", ($(this.Element).height()+20)+"px");
            // }
        },



        FocusInput: function () {
            if (this.IsMobile) {
                return;
            }
            if(this.SelectorPanel == null) {
                this.CreatedDialog()
            } else {
                this.showDialog();
            }

        },
        //失去焦点
        FocusOutput: function () {
            if (this.IsMobile) {
                return;
            }
            if ($(this.SearchTxtElement).val().length > 0) {
                this.OrgListPanel.html("");
                $(this.SearchTxtElement).val("");
            }
            if (this.SelectorPanel.is(":hidden"))
                return;
            // $(this.SelectorPanel).css('left','')
            this.SelectorPanel.hide();
        },

        //处理映射关系
        MappingControlsHandler: function (Object) {
            if (!this.MappingControls)
                return;
            var Propertys = "";
            var MapJson = {};
            var mapping = this.MappingControls.split(',');
            for (var i = 0; i < mapping.length; i++) {
                var map = mapping[i].split(':');
                MapJson[map[0]] = map[1];
                Propertys += map[1] + ";";
            }

            var that = this;
            var param = {Command: "GetUserProperty", Param: JSON.stringify([Object.ObjectID, Propertys])};
            $.MvcSheet.GetSheet(param, function (data) {
                for (var p in data) {
                    for (var key in MapJson) {
                        if (MapJson[key] == p) {
                            //var e = $.MvcSheetUI.GetElement(key, that.RowNum);
                            var e = $.MvcSheetUI.GetElement(key, that.GetRowNumber());
                            //update by luxm 初始化时联动
                            if (e != null && e.data($.MvcSheetUI.SheetIDKey) || e != null && isInit) {
                                isInit = false;
                                e.SheetUIManager().SetValue(data[p]);
                            }
                        }
                    }
                }
            });
        },
        //保存选中的值
        saveChoice:function(Object){
            if (!Object)
                return;
            if (!Object.ObjectID)
                return;
            if (this.Choices[Object.ObjectID])
                return;
            if (!this.IsMultiple) { // 清除其他所有选项
                this.ClearChoices(true);
            }
            this.Choices[Object.ObjectID] = Object;

        }
        ,
        //点击选中
        selectChoice:function(Object){
            if(this.Choices[Object.ObjectID])
            {
                return;
            }
            this.saveChoice(Object);
            this.AddChoiceToRight(Object)
            this.countSelect();
        }
        ,
        countSelect:function(){
            var countU = 0, countO = 0;
            for(var i in this.Choices){
                if(this.Choices[i].type=="U"){
                    countU++;
                }else {
                    countO++;
                }

            }
            var selectStr = "已选择： "+countO+" 个部门, "+countU+" 个人";
            this.selectCountEl.text(selectStr);
        }
        //初始化左侧选中项
        ,
        initRightChoice:function(){
            for(var i in this.Choices){
                this.AddChoiceToRight(this.Choices[i])
            }
        },
        //初始化输入框选中的人
        initChoceOnInput:function(obj){
            if(this.Choices[obj.ObjectID])
                return;
            this.saveChoice(obj);
            //只读


            if (!this.Editable) {
                $(this.Element).html(this.GetText());
                return;
            }
            if (!this.IsMobile){
                this.addChoiceOnInput(obj);
            }

        }
        ,
        //添加选择到弹框右侧
        AddChoiceToRight: function (Object) {
            // console.log(Object, '添加已选')



            var choiceID = $.MvcSheetUI.NewGuid();
            var selecTypeClass = "h-icon-all-team-o";
            if(Object.type=="U"){
                selecTypeClass = "h-icon-all-user-o";
            }
            Object.ChoiceID = choiceID;
            var choice = $('<div class="h3-organization-selected" data-code="'+Object.ObjectID+'">'
                + '<i class="aufontAll '+selecTypeClass+'"></i>'
                + '<div class="h3-organization-selected-name" >'+Object.Name+'</div>'
                + '<i class="aufontAll h-icon-all-close"></i>'
                + '</div>');

            if (this.IsMobile) {
                choice.css("margin-top", "10px")
                // this.ChoicesElement.append(choice);
            } else {

                this.SetSearchTxtElementWidth.apply(this);
                // this.ChoicesElement.append(choice);
                this.selectedPanel.append(choice);
            }



        },
        selectComplete:function(){
            this.ChoicesElement.find("li:not(:last)").remove();
            for(var i in this.Choices) {
                this.addChoiceOnInput(this.Choices[i]);
            }

            this.saveHistoryInLocal();

        }

        ,
        saveHistoryInLocal:function(){
            var param = {
                user:[],
                org:[]
            }
            for(var i in this.Choices) {
                if(this.Choices[i].type=="O"){
                    param.org.push(this.Choices[i].ObjectID);
                }
                else if(this.Choices[i].type=="U"){
                    param.user.push(this.Choices[i].ObjectID);
                }
            }
            $.ajax({
                type: "post",
                url:"/Portal/SheetUser/saveHistoryUnits",
                contentType:'application/json',
                data: JSON.stringify(param),
                dataType: "json",
                success: function (data) {

                }
            });
        }
        ,
        //添加选中项到输入框中
        addChoiceOnInput:function(obj){



            var choiceID = $.MvcSheetUI.NewGuid();



            var choice = $("<li class='select2-search-choice'></li>");
            var NameDiv = $("<div>" + obj.Name + "</div>");
            choice.css("cursor", "pointer").css("margin-top", "5px").css('background-color', '#b0b0b0');
            choice.attr("id", choiceID).attr("code", obj.ObjectID).append(NameDiv);

            if (this.IsMobile) {
                choice.css("margin-top", "10px")
            } else {
                this.SearchElement.before(choice);
                this.SetSearchTxtElementWidth.apply(this);
                // this.ChoicesElement.append(choice);
                choice.insertBefore(this.ChoicesElement.find("li:last"));
            }

            //关闭按钮
            var colseChoice = $("<a href='javascript:void(0)' class='select2-search-choice-close'></a>");
            choice.append(colseChoice);
            choice.unbind("click.choice").bind("click.choice", this, function (e) {
                //移除当前筛选条件
                e.data.RemoveChoice.apply(e.data, [$(this).attr("code")]);
                //触发Input框的chagne事件
                $(e.data.Element).trigger("change");
                $(this).remove();
                e.stopPropagation()
            });

            //校验
            //校验
            this.Validate();

            if (this.IsMobile) {
                this.OnMobileChange();
            }

            if (this.OnChange) {
                this.RunScript(this, this.OnChange, [this]);
            }
            $(this.Element).trigger('change');
            //映射关系
            if (this.MappingControls) {
                this.MappingControlsHandler(obj);
            }

        },

        OnMobileChange: function () {
            if (this.IsMobile) {
                var that = this;
                setTimeout(function () {
                    that.RefreshMobilePage();
                }, 100)
            }
        },

        RefreshMobilePage: function () {
            //如果当前在选择的主界面里，重新计算高度
            // if ($.ui.activeDiv.id == this.EditPanelID) {
            if (this.EditPanelID) {
                //选中项容器高度自增减
                this.ChoicesPanel.height($(this.ChoicesElement).outerHeight());

                if (this.SelectorPanel) {
                    //搜索框填充页面高度
                    this.SelectorPanel.outerHeight($('#afui').height() - $('header:visible').outerHeight() - $('#footer:visible').outerHeight() - this.ChoicesPanel.outerHeight() - this.SearchElement.parent().outerHeight())
                }
            }

            var that = this;

        },

        _GetScroller: function (wrapperSelector) {
            this.IScrollers = this.IScrollers || {};
            var wrapper = $(wrapperSelector).first();
            var scrollerId = wrapper.data("scroller-id");
            if (!scrollerId) {
                scrollerId = $.uuid();
                wrapper.data("scroller-id", scrollerId);
                this.IScrollers[scrollerId] = new IScroll(wrapper.get(0));
            }
            return this.IScrollers[scrollerId];
        },

        //Error:这里有时间，可以实现批量的效果
        //添加:UserID/UserCode
        AddUserID: function (UserID) {
            var that = this;
            var param = {UserID: UserID, Propertystr: "Name;ObjectID"};
            $.ajax({
                type: "GET",
                url: this.SheetGetUserProperty,
                data: param,
                dataType: "json",
                async: false, //同步执行
                success: function (data) {
                    if (data) {

                        that.initChoceOnInput({ObjectID: data["ObjectID"], Name: data["Name"]});


                    }
                }
            });
        },
        //清除所有的选择
        ClearMobileChoices: function () {
            this.Choices={};
        },
        //清除所有的选择
        ClearChoices: function (AddNew) {
            for (var ObjectID in this.Choices) {
                this.RemoveChoice(ObjectID,AddNew);
            }
        },
        //添加选择:{ObjectID:"",Name:""}
        AddChoice: function (Object) {
            // console.log(Object, '添加已选')
            if (!Object)
                return;
            if (!Object.ObjectID)
                return;
            if (this.Choices[Object.ObjectID])
                return;
            if (!this.IsMultiple) { // 清除其他所有选项
                this.ClearChoices();
            }
            this.Choices[Object.ObjectID] = Object;

            //映射关系
            if (this.MappingControls) {
                this.MappingControlsHandler(Object);
            }

            //只读
            if (!this.Editable) {
                $(this.Element).html(this.GetText());
                return;
            }

            var choiceID = $.MvcSheetUI.NewGuid();
            Object.ChoiceID = choiceID;
            var choice = $("<li class='select2-search-choice'></li>");

            var NameDiv = $("<div>" + Object.Name + "</div>");
            choice.css("cursor", "pointer").css("margin-top", "5px").css('background-color', '#b0b0b0');
            choice.attr("id", choiceID).attr("data-code", Object.ObjectID).append(NameDiv);

            if (this.IsMobile) {
                choice.css("margin-top", "10px")
                // this.ChoicesElement.append(choice);
            } else {
                this.SearchElement.before(choice);
                this.SetSearchTxtElementWidth.apply(this);
                // this.ChoicesElement.append(choice);
                choice.insertBefore(this.ChoicesElement.find("li:last"));
            }

            //关闭按钮
            var colseChoice = $("<a href='javascript:void(0)' class='select2-search-choice-close'></a>");
            choice.append(colseChoice);
            choice.unbind("click.choice").bind("click.choice", this, function (e) {
                //移除当前筛选条件
                e.data.RemoveChoice.apply(e.data, [$(this).attr("data-code")]);
                //触发Input框的chagne事件
                $(e.data.Element).trigger("change");
            });
            //校验
            this.Validate();

            if (this.IsMobile) {
                this.OnMobileChange();
            }

            if (this.OnChange) {
                this.RunScript(this, this.OnChange, [this]);
            }
            $(this.Element).trigger('change');
        },
        //设置值
        SetMobileValue: function (Obj) {
            var that = this;
            if (Obj.constructor == Object) {
                if(!this.Choices[Obj.Code]){
                    this.Choices[Obj.Code] = {
                        ObjectID: Obj.Code,
                        Name: Obj.Name,
                        type: Obj.ContentType
                    }
                }
            }
            else if(Obj.constructor == Array)
            {
                for(var i = 0 ;i<Obj.length;i++){
                    if(!this.Choices[Obj[i].Code]){
                        that.Choices[Obj[i].Code] = {
                            ObjectID: Obj[i].Code,
                            Name: Obj[i].Name,
                            type: Obj[i].ContentType
                        }
                    }
                }
            }
            //不用延时无法滚动
            setTimeout(function(){
                that.Mask.html(that.GetText());
                that.Mask.css({'color': '#2c3038'});
            },1000)

            //映射关系
            if (this.MappingControls) {
                this.MappingControlsHandler({
                    ObjectID: Obj.Code,
                    Name: Obj.Name,
                    type: Obj.ContentType
                })
            }
            if (this.IsMobile) {
                this.OnMobileChange();
            }

            if (this.OnChange) {
                this.RunScript(this, this.OnChange, [this]);
            }
        },

        //移除选择
        RemoveChoice: function (ObjectID,AddNew) {
            if (this.Choices[ObjectID]) {

                $("[data-code='"+ObjectID+"']",$(this.Element)).remove();
                $("[data-id='"+ObjectID+"']",$(this.Element)).find(".ant-checkbox-input").prop("checked",false);
                $("[data-id='"+ObjectID+"']",$(this.Element)).find(".ant-checkbox").removeClass("ant-checkbox-checked");
                delete this.Choices[ObjectID];
            }
            this.SetSearchTxtElementWidth.apply(this);
            this.Validate();

            if (this.OnChange&&!AddNew) {
                this.RunScript(this, this.OnChange, [this]);
            }

            if (!this.IsMobile){
                this.countSelect();
            }

        },


        //获取加载组织机构的参数
        GetLoadTreeOption: function () {
            if (!this.__QueryOptions) {
                var querystr = "o=";
                var querystr = "o=";
                if (this.SegmentVisible) {
                    querystr += "S";
                }
                if (this.OrgUnitVisible) {
                    querystr += "O";
                }
                if (this.GroupVisible) {
                    querystr += "G";
                }
                if (this.PostVisible) {
                    querystr += "P";
                }
                if (this.UserVisible) {
                    querystr += "U";
                }
                if (this.VisibleUnits) {
                    querystr += "&VisibleUnits=" + this.VisibleUnits;
                }
                if (this.RootUnitID) {
                    querystr += "&RootUnitID=" + this.RootUnitID;
                }
                //if (this.RoleName) {
                //    querystr += "&RoleName=" + encodeURI(this.RoleName);
                //}
                if (this.OrgPostCode) {
                    querystr += "&OrgPostCode=" + encodeURI(this.OrgPostCode);
                }
                if (this.UserCodes) {
                    querystr += "&UserCodes=" + encodeURI(this.UserCodes);
                }
                //显示离职人员  liming 20180918
                if (this.ResignVisible)
                {
                    querystr += "&ResignVisible=" + this.ResignVisible;
                }

                this.__QueryOptions = querystr;
            }
            return this.__QueryOptions;
        }









    });
})(jQuery);