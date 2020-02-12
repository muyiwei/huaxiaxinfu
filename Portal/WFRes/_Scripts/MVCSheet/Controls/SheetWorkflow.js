//流程模板
(function ($) {
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.SheetWorkflow = function () {
        return $.MvcSheetUI.Run.call(this, "SheetWorkflow", arguments);
    };

    // 构造函数
    $.MvcSheetUI.Controls.SheetWorkflow = function (element, ptions, sheetInfo) {
        // 选择数据集合
        this.Choices = {};
        // 所有选择的元素
        this.ChoicesElement = null;
        // 搜索输入框元素
        this.SearchElement = null;
        this.SearchTxtElement = null;
        this.SearchButton = null;
        // 获取选中的值
        this.SelectedValue = null;
        // 获取当前搜索关键字
        this.SearchKey = null;
        // 获取是否是搜索模式
        this.SearchMode = false;
        this.KeyTime = null;
        // 搜索结果
        this.SearchResults = [];
        //正在搜索的集合
        this.DoingSearchList = [];
        // 下拉框容器
        this.SelectorPanel = null;
        // 只在 Enter 进行搜索
        this.EnterSearch = true;
        this.OrgTreePanel = null;
        this.OrgListPanel = null;
        this.IsOverSelectorPanel = false;
        this.SheetWorkflowHandler = $.MvcSheetUI.PortalRoot + "/Workflow/QueryWorkflowNodes";
        this.GetWorkflowsHandler = $.MvcSheetUI.PortalRoot + "/Workflow/GetWorkflows";
        this.ModelControl = null;
        this.FolderChoosed = null;

        $.MvcSheetUI.Controls.SheetWorkflow.Base.constructor.call(this, element, ptions, sheetInfo);
    };

    // 继承及控件实现
    $.MvcSheetUI.Controls.SheetWorkflow.Inherit($.MvcSheetUI.IControl, {
        //移动端
        RenderMobile: function () {
            //是否多选
            this.IsMultiple = this.LogicType == $.MvcSheetUI.LogicType.MultiParticipant;

            //不可用
            if (!this.Editable) {
                $(this.Element).prop("readonly", true);
                $(this.Element).addClass(this.Css.Readonly);
                $(this.Element).addClass("item-content");
            }
            else {
                this.MobileHtmlRender();
                this.MoveToMobileContainer();
            }
            //初始化默认值
            this.InitValue();

            if (!this.EditPanel) {
                this.EditPanel = $("<div>").attr("id", $.uuid()).attr("data-title", this.Title).attr("data-footer", "none").addClass("panel")
                    .appendTo("#content");
            }
            $(this.EditPanel).addClass('no-scroll')
            this.SetMobilePanelRefreshOnload($(this.EditPanel).attr('id'));
        },
        // PC端
        Render: function () {
            //是否多选

            //this.IsMultiple = this.LogicType == $.MvcSheetUI.LogicType.ShortString;
            if (!this.Visiable) {
                this.Element.style.display = "none";
                return;
            }
            // 查看痕迹
            if (this.TrackVisiable && !this.Originate && this.DataField.indexOf(".") == -1) { this.RenderDataTrackLink(); }

            //不可用
            if (!this.Editable) {
                $(this.Element).prop("readonly", true);
                $(this.Element).addClass(this.Css.Readonly);
                $(this.Element).css("padding-top", "6px");
            }
            else {
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

        //初始化值
        InitValue: function () {
            // 设置默认值
            if (this.Originate && !this.V && this.DefaultValue) {
                this.V = this.DefaultValue;
            }

            this.SetValue(this.V);
            if (this.IsMobile) {
                if (this.Editable) {
                    this.Mask.html(this.GetText());
                }
                else {
                    $(this.Elment).html(this.GetText());
                }
            }
        },
        // 设置组织机构的根目录，传组织编码
        SetRootUnit: function (unitId) {
            // 设置顶点 unit 
            // 重新加载树
            this.RootUnitID = RootUnitID;

            this.TreeManager.clear();
            this.TreeManager.loadData(null, this.SheetUserHandler + "?RootUnitID=" + this.RootUnitID);
        },
        // 设置值
        SetValue: function (Obj) {
            if (Obj == undefined || Obj == null || Obj == "") return;
            if (Obj.constructor == Object) {
                this.AddChoice({ Code: Obj.Code, DisplayName: Obj.DisplayName || Obj.Name });
            }
            else if (Obj.constructor == Array) {
                for (var i = 0; i < Obj.length; i++) {
                    if (Obj[i].constructor == Object) {
                        this.AddChoice({ Code: Obj[i].Code, DisplayName: Obj[i].DisplayName || Obj.Name });
                    }
                    else if (Obj[i].constructor == String) {
                        this.AddWorkflow(Obj[i]);
                        if (!this.IsMultiple) break;
                    }
                }
            }
            else if (Obj.constructor == String) {
                this.AddWorkflow(Obj);
            }
        },
        //用户ID
        GetValue: function () {
            var users;
            for (var ObjectID in this.Choices) {
                if (this.IsMultiple) {
                    if (users == undefined) users = new Array();
                    users.push(ObjectID);
                }
                else {
                    users = ObjectID;
                }
            }
            return users == undefined ? "" : users;
        },

        //获取显示
        GetText: function () {
            var userNames;
            for (var ObjectID in this.Choices) {
                if (this.IsMultiple) {
                    if (userNames == undefined) userNames = new Array();
                    userNames.push(this.Choices[ObjectID].DisplayName);
                }
                else {
                    userNames = this.Choices[ObjectID].DisplayName;
                }
            }
            return userNames == undefined ? "" : userNames.toString();
        },

        //保存数据
        SaveDataField: function () {
            var result = {};
            if (!this.Visiable || !this.Editable) return result;
            result[this.DataField] = this.DataItem;
            if (!result[this.DataField]) {
                if (this.DataField.indexOf(".") == -1) { alert(SheetLanguages.Current.DataItemNotExists + ":" + this.DataField); }
                return {};
            }

            var users = this.GetValue();
            //if (result[this.DataField].V != users)
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

            //设置输入框
            if (this.ChoicesElement == null) {
                if (!this.IsMultiple)
                    this.ChoicesElement = $("<ul>").addClass("select2-choices").css("overflow", "hidden");
                else
                    this.ChoicesElement = $("<ul>").addClass("select2-choices").css("overflow", "hidden").attr("style", "width: 98% !important; height: 28px !important;min-height: 27.6px !important;overflow-y: scroll;");

                this.SearchElement = $("<li>").addClass("select2-search-field");
                this.SearchTxtElement = $("<input>").addClass("form-control").addClass("no-padding");
                this.SearchTxtElement.width("1px");

                //添加输入框
                this.SearchElement.append(this.SearchTxtElement);
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
            if (this.SelectorPanel == null) {
                //组织机构选择Panel
                this.SelectorPanel = $("<div>").addClass("bordered").addClass("SelectorPanel")
                    .css("position", "absolute")
                    .css("z-index", "888")
                    .width("100%")
                    .css("min-width", "320px")
                    .css("height", "300px")
                    .css("display", "none")
                     .css("overflow", "")
                    .css("background-color", "#FFFFFF").css("left", "0").attr("data-SheetUserPanel", "SelectorPanel");
                if (!this.IsMultiple) {
                    this.OrgTreePanel = $("<div>").css("width", "100%").addClass("bordered").css("float", "left").height("100%").css("overflow", "scroll");
                }
                if (this.IsSearch || this.IsSearchTwo || this.IsSearchThree)
                    this.OrgTreePanel = $("<div>").attr("style", "margin-top: 5px;").css("width", "98%").addClass("bordered").css("float", "left").height("87%").css("overflow", "scroll");
                else
                    this.OrgTreePanel = $("<div>").attr("style", "margin-top: 5px;").css("width", "100%").addClass("bordered").css("float", "left").height("100%").css("overflow", "scroll");

                if (this.IsSearch || this.IsSearchThree) {
                    this.SearchLableElement1 = $("<label>").addClass("input-setworkflow").addClass("form-control");
                    this.SearchTxtElement1 = $("<i>").addClass("input-i-search").addClass("fa fa-search").css("top", "9px");
                    this.SearchTxtElement2 = $("<input>").addClass("input-text").attr("style", "width:92% !important;").css("height", "26px");
                    this.SearchLableElement1.append(this.SearchTxtElement1).append(this.SearchTxtElement2);
                    this.SelectorPanel.append(this.SearchLableElement1);
                }
                if (this.IsSearchTwo) {
                    this.SearchLableElement1 = $("<div>").attr("style", "width: auto;border: 1px solid #a8a8a8; ");
                    this.SearchTxtElement1 = $("<i>").addClass("input-i-search").addClass("fa fa-search").attr("style", " position: absolute;top: 12px;left: 11px;");
                    this.SearchTxtElement2 = $("<input>").addClass("input-text").attr("style", "width: 90% !important;border: 0;outline: white;margin-left: 29px;height: 28px; ");
                    this.SearchLableElement1.append(this.SearchTxtElement1).append(this.SearchTxtElement2);
                    this.SelectorPanel.append(this.SearchLableElement1);
                }
                this.SelectorPanel.append(this.OrgTreePanel);
                // 组织机构选择列表 
                if (this.IsSearchThree)
                    this.OrgListPanel = $("<div>").height("100%").width("96%").css("overflow", "auto");
                else if (!this.IsSearchTwo)
                    this.OrgListPanel = $("<div>").height("100%").attr("style", "margin-top:37px;width: 96%;");
                    // this.OrgListPanel = $("<div>").height("100%").attr("style", "margin-top:0px;width: 100%;");
                else
                    this.OrgListPanel = $("<div>").height("100%").css("overflow", "auto");
                this.SelectorPanel.append(this.OrgListPanel);
                // 添加组织机构
                $(this.Element).append(this.SelectorPanel);
            }

            if (this.WorkflowCodes) { // 显示固定的流程模板
                this.OrgTreePanel.hide();
                this.OrgListPanel.show();
                this.SelectorPanel.css("min-width", "0px");
            }
            else {
                this.OrgTreePanel.show();
                this.OrgListPanel.hide();
                this.SelectorPanel.css("min-width", "430px");
            }
        },
        //移动端渲染
        MobileHtmlRender: function () {
            this.Level = 0;
            this.ID = $.MvcSheetUI.NewGuid();
            $(this.Element).attr("ID", this.ID);
            //选中的用户
            this.ChoicesPanel = $("<div></div>")
                .addClass("select2-container").addClass('scroll-wrapper')
                .css({
                    'background-color': 'white',
                    position: 'relative',
                    //最小显示一行
                    'min-height': '37px',
                    //最多显示三行
                    'max-height': '110px',
                    width: '100%'
                });
            this.ChoicesElement = $("<ul>").addClass("select2-choices").addClass('scroller')
                .css({
                    width: '100%',
                    overflow: 'hidden',
                    'min-height': '35px'
                });
            this.ChoicesPanel.append(this.ChoicesElement);
            $(this.Element).append(this.ChoicesPanel);

            //搜索框
            this.SearchElement = $("<li>").addClass("select2-search-field").css({ width: '100%' });
            this.SearchTxtElement = $("<input>").attr('placeholder', '搜索')
                .css({
                    width: '85%',
                    height: '40px',
                    'padding-left': '10px',
                    'padding-right': '10px',
                    'font-size': '14px'
                });
            //添加搜索输入框
            this.SearchElement.append(this.SearchTxtElement);
            //限制了范围时，禁用搜索
            if (this.VisibleUnits) {
                this.SearchElement.hide();
            }
            //搜索按钮
            this.SearchButton = $("<a>").attr("data-ignore", "true").addClass("button icon magnifier big")
                .css({ border: 'none', margin: 0, padding: '12px', width: '15%' });
            this.SearchElement.append(this.SearchButton);
            $(this.Element).append($('<ul>').width('100%').append(this.SearchElement));

            //搜索结果列表
            this.OrgListPanel = $("<ul>").width("100%").addClass('list');
            this.SelectorPanel = $("<div>").attr("id", $.uuid()).addClass('list').addClass("scroll-wrapper").width("100%").css('position', 'relative');
            $(this.SelectorPanel).bind('touchstart', function () {
                thatSheetUser.SearchTxtElement.blur();
            });
            this.SelectorPanel.append(this.OrgListPanel);
            $(this.Element).append(this.SelectorPanel);

            //底部返回按钮
            this.FooterID = $.uuid();
            var footerObj = $("<footer id=" + this.FooterID + " ><a class='icon left'>返回</a><footer>");
            $("#afui").append(footerObj);
            $(footerObj).unbind("click.footerObj").bind("click.footerObj", this, function (e) {
                $.ui.goBack(e.data.Level);
                e.data.Level = 0;

                e.data.Validate();
            });

            var thatSheetUser = this;
            //如果设置了可见组织
            if (this.VisibleUnits && this.VisibleUnits.length) {
                this.OrgListPanel;

                var loadOptions = this.GetLoadTreeOption();
                if (this.VisibleUnits.split(';').length > 1) {
                    var loadUrl = this.SheetUserHandler + "?IsMobile=true&" + loadOptions;
                    //如果有多个可见组织，列出可见组织
                    $.ajax({
                        url: loadUrl,
                        dataType: "json",
                        //async: false,
                        success: function (data) {
                            thatSheetUser.AddMobileOptions(data, thatSheetUser.OrgListPanel)
                        },
                        error: function (e) {
                            console.log(e);
                        }
                    });
                }
                else {// 只有一个可见组织，直接加载成员列表
                    var loadUrl = this.SheetUserHandler + "?IsMobile=true&ParentID=" + this.VisibleUnits + "&" + loadOptions;
                    //如果有多个可见组织，列出可见组织
                    $.ajax({
                        url: loadUrl,
                        dataType: "json",
                        //async: false,
                        success: function (data) {
                            thatSheetUser.AddMobileOptions(data, thatSheetUser.OrgListPanel);
                        },
                        error: function (e) {
                            console.log(e);
                        }
                    });
                }
            }
            else {
                //组织机构列表按钮
                this.OrgListBtn = $("<li>").data("targetID", $.uuid()).text("从组织架构选择")//.addClass("icon user big")//.css("position", "absolute")
                    .addClass("selectFromOrg").css({
                        'border-top': '1px solid #ccc',
                        height: '40px',
                        top: '0px',
                        right: '0px',
                        padding: '10px',
                        cursor: 'pointer',
                        'border-bottom': '1px solid #eeeeee'
                    });

                this.OrgListBtn.insertAfter(this.SearchElement);

                //输入控件
                $(this.SearchTxtElement).unbind("keydown.SearchTxtElement").bind("keydown.SearchTxtElement", this, function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });

                //移动端搜索按钮
                $(this.SearchButton).unbind("click.SearchTxtElement").bind("click.SearchTxtElement", this, function (e) {
                    e.data.SearchWorkflow.apply(e.data.SearchTxtElement, [e.data]);
                });

                $(this.OrgListBtn).unbind("click.OrgListBtn").bind("click.OrgListBtn", this, function (e) {
                    var targetID = $(this).data("targetID");
                    e.data.AddMobilePanel.apply(e.data, [targetID, ""]);
                });
            }
        },
        //绑定事件
        BindEnvens: function () {
            if (!this.Editable) return;//不可用

            //点击到当前元素，设置input焦点
            $(this.ChoicesElement).unbind("click.SheetUser").bind("click.SheetUser", this, function (e) {
                e.data.SearchTxtElement.focus();
            });

            //得到焦点显示
            $(this.SearchTxtElement).unbind("focusin.SearchTxtElement").bind("focusin.SearchTxtElement", this, function (e) {
                e.data.FocusInput.apply(e.data);
            });

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
                        e.data.SearchWorkflow.apply(e.data, [e.data]);
                    }
                });
            }
            else {
                if (this.IsMultiple || this.IsSearch || this.IsSearchTwo || this.IsSearchThree) {
                    // 输入控件
                    $(this.SearchTxtElement2).unbind("keyup.SearchTxtElement2").bind("keyup.SearchTxtElement2", this, function (e) {
                        e.data.SetSearchTxtElementWidth.apply(e.data);
                        e.data.FocusInput.apply(e.data);
                        e.data.KeyTime = new Date();
                        var that = e.data;
                        if (that.AllowSearch) {
                            setTimeout(function () {
                                that.SearchWorkflow.apply(that, [that]);
                            }, 500)
                        }
                    });
                } else {
                    // 输入控件
                    $(this.SearchTxtElement).unbind("keyup.SearchTxtElement").bind("keyup.SearchTxtElement", this, function (e) {
                        e.data.SetSearchTxtElementWidth.apply(e.data);
                        e.data.FocusInput.apply(e.data);
                        e.data.KeyTime = new Date();
                        // setTimeout("e.data.SearchWorkflow.apply(e.data, [e.data])", 500);
                        var that = e.data;
                        if (that.AllowSearch) {
                            setTimeout(function () {
                                that.SearchWorkflow.apply(that, [that]);
                            }, 500)
                        }
                    });
                }
                $(this.SearchTxtElement).unbind("keydown.SearchTxtElement").bind("keydown.SearchTxtElement", this, function (e) {
                    if (e.keyCode == 8 && $(this).val() == "") {
                        e.data.RemoveChoice.apply(e.data, [$(this).parent().prev().attr("data-code")]);
                    }
                });
            }

            $(document).unbind("click." + this.ID).bind("click." + this.ID, this, function (e) {
                var _that = e.data.ID;
                if ($(e.target).closest("div[id='" + e.data.ID + "']").length == 0) {
                    var _width = 0;
                    var _clientWidth = 0;
                    for (var i = 1; i < e.data.ChoicesElement[0].childNodes.length; i++) {
                        _clientWidth += e.data.ChoicesElement[0].childNodes[i].clientWidth;
                    }
                    if (_clientWidth >= e.data.ChoicesElement[0].offsetWidth * 0.8) {
                        if ($("div[id='" + _that + "']").attr("style") != null && $("div[id='" + _that + "']").attr("style").indexOf("left") > -1) {
                            if ($("div[id='" + _that + "']").width())
                                _width = $("div[id='" + _that + "']").width();
                            $("div[id='" + _that + "']").attr("style", "width:" + _width + "px;left: -5px; z-index: inherit; min-width: 150px;");
                        }
                        else {
                            if ($("div[id='" + _that + "']").width())
                                _width = $("div[id='" + _that + "']").width();
                            $("div[id='" + _that + "']").attr("style", "width:" + _width + "px;min-height: 27.6px !important;");
                            //$("div[id='" + _that + "']").attr("style", "width:" + _width + "px;height: 48px !important;min-height: 27.6px !important;");
                        }
                        $("div[id='" + _that + "']").children("ul").attr("style", "width: 98% !important;height: 28px !important;min-height: 27.6px !important;overflow-y: scroll;");
                        //$("div[id='" + _that + "']").children("ul").attr("style", "width: 100% !important;height: 45px !important;min-height: 27.6px !important;overflow-y: scroll;");
                    } else {
                        if ($("div[id='" + _that + "']").attr("style") != null && $("div[id='" + _that + "']").attr("style").indexOf("left") > -1) {
                            if ($("div[id='" + _that + "']").width())
                                _width = $("div[id='" + _that + "']").width();
                            $("div[id='" + _that + "']").attr("style", "width:" + _width + "px;left: -5px; z-index: inherit; min-width: 150px;");
                        }
                        else {
                            if ($("div[id='" + _that + "']").width())
                                _width = $("div[id='" + _that + "']").width();
                            $("div[id='" + _that + "']").attr("style", "width:" + _width + "px;min-height: 27.6px !important;");
                        }
                        $("div[id='" + _that + "']").children("ul").attr("style", "width: 98% !important;height: 28px !important;min-height: 27.6px !important;overflow-y: scroll;");
                    }
                    e.data.FocusOutput.apply(e.data);
                }
            });
            if (this.IsMobile) {
                $(this.OrgListBtn).unbind("click.OrgListBtn").bind("click.OrgListBtn", this, function (e) {
                    var targetID = $(this).data("targetID");
                    e.data.AddMobilePanel.apply(e.data, [targetID, ""]);
                });
            }
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
                    if (parentObj.length == 0) parentObj = $("li[objectID='" + parentID + "']");
                    divObj.attr("data-title", parentObj.text());
                }
                else {
                    divObj.attr("data-title", $.ui.prevHeader.find("#pageTitle").text());
                }
                divObj.attr("data-footer", this.FooterID);
                divObj.data("parentid", parentID);
                var loadUrl = that.SheetUserHandler + "?IsMobile=true&" + that.GetLoadTreeOption();
                if (parentID) {
                    loadUrl = that.SheetUserHandler + "?IsMobile=true&ParentID=" + parentID;
                }

                $.ajax({
                    type: "GET",
                    url: loadUrl,
                    dataType: "json",
                    context: that,
                    async: false,//同步执行
                    success: function (data) {
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
                    }
                    else {
                        ulList.html('<li class="user-item">没有任何组织</li>');
                    }
                }
                else {
                    that._AddMobileOption(data, ulList, searchKey);
                }
            }
            else {
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
            var selectableFlag = this.GetSelectableFlag();
            var li = $("<li>").addClass('user-item');
            if (selectableFlag.indexOf(item.ExtendObject.UnitType) > -1) {
                var checkboxid = $.uuid();
                var checkbox = $("<input type='checkbox'  id='" + checkboxid + "' data-objectid='" + item.ObjectID + "'/>");
                checkbox.attr("checked", this.Choices && this.Choices[item.ObjectID] != undefined);
                li.append(checkbox);

                var displayText = item.Text;
                if (searchKey) {
                    displayText.replace(searchKey, "<span class='bg-info'>" + searchKey + "</span>")
                }

                li.append($("<label type='checkbox' label-for='" + checkboxid + "'>" + displayText + "</label>").css("float", "none").css("left", "25px"));
            }
            else {
                li.append(item.Text);
            }
            li.attr("objectID", item.ObjectID);
            var targetId = $.uuid();
            li.attr("targetID", targetId);

            if (!item.IsLeaf) {
                var linkelemnt = $("<a data-ignore=true>" + $(li).html() + "</a>");
                $(li).html("").append(linkelemnt);

                li.append($('<div>').addClass('org-expand').css({
                    width: '20%', height: '100%', 'z-index': 2, position: 'absolute', right: 0, top: 0
                }));
            }
            ulList.append(li);

            var node = {
                ObjectID: item.ObjectID, Name: item.Text
            }
            $(li).unbind("click.OrgListBtn").bind("click.OrgListBtn", [this, node], function (e) {
                var t = e.data[0];
                var n = e.data[1];
                if ($(e.target).is('.org-expand') || $(this).find('input[type=checkbox]').length == 0) {
                    var parentID = $(this).attr("objectID");
                    var targetID = $(this).attr("targetID");
                    $("#defaultHeader>.backButton").data("pannelid", targetId);
                    t.AddMobilePanel.apply(t, [targetID, parentID]);
                }
                else {
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
            }
            else if ($.isEmptyObject(this.Choices)) {
                w = "100%";
                this.SearchTxtElement.attr("PlaceHolder", this.PlaceHolder);
            }
            else {
                this.SearchTxtElement.removeAttr("PlaceHolder", this.PlaceHolder);
            }
            $(this.SearchTxtElement).width(w);

            if (this.IsMobile) {
                //$(this.SelectorPanel).css("top", ($(this.Element).height()+20)+"px");
            }
        },

        //获取焦点焦点
        FocusInput: function () {
            if (this.IsMobile) {
                return;
            }
            if (this.SelectorPanel.is(":visible")) return;

            $("div[data-SheetUserPanel='SelectorPanel']").hide();
            this.SelectorPanel.show();
            if (!this.IsMobile && !this.IsLoaded) {
                this.LoadOrgTree();
            }

            if (!this.IsMobile && this.OrgListPanel.find("input").length == 0) {
                if (this.FolderChoosed) return;
                this.TreeManager.selectNode(this.TreeManager.data[0]);
            }
        },

        //失去焦点
        FocusOutput: function () {
            if (this.IsMobile) {
                return;
            }
            if (this.SelectorPanel.is(":hidden")) return;
            if ($(this.SearchTxtElement).val().length > 0) {
                this.OrgListPanel.html("");
                $(this.SearchTxtElement).val("");

                //this.HtmlRender();
                this.SetSearchTxtElementWidth.apply(this);
                if (this.WorkflowCodes) { // 显示固定的流程模板
                    this.OrgTreePanel.hide();
                    this.OrgListPanel.show();
                    this.SelectorPanel.css("min-width", "0px");
                }
                else {
                    this.OrgTreePanel.show();
                    this.OrgListPanel.hide();
                    this.SelectorPanel.css("min-width", "430px");
                }
            }
            this.SelectorPanel.hide();
        },
        //添加选择:{ObjectID:"",Name:""}
        AddChoice: function (Object) {
            if (!Object) return;
            if (!Object.Code) return;
            if (this.Choices[Object.Code]) return;
            if (!this.IsMultiple) {// 清除其他所有选项
                this.ClearChoices();
            }
            this.Choices[Object.Code] = Object;
            for (var codeIndex in this.Choices.length) {
                this.Element.find(".SelectorPanel")
            }
            //只读
            if (!this.Editable) {
                $(this.Element).html(this.GetText());
                return;
            }

            var choiceID = $.MvcSheetUI.NewGuid();
            Object.ChoiceID = choiceID;
            var choice = $("<li class='select2-search-choice'></li>")

            var NameDiv = $("<div>" + Object.DisplayName + "</div>");
            choice.css("cursor", "pointer").css("margin-top", "2px").css('background-color', '#b0b0b0');
            choice.attr("id", choiceID).attr("data-code", Object.Code).append(NameDiv);

            if (this.IsMobile) {
                choice.css("margin-top", "10px")
                this.ChoicesElement.append(choice);

            }
            else {
                this.SearchElement.before(choice);
                this.SetSearchTxtElementWidth.apply(this);
                this.ChoicesElement.append(choice);
                if (this.IsMultiple)
                {
                    //所有相同Code都勾选上（常用流程会出现code一致的流程）
                    var nodes = this.TreeManager.getNodesByAttr("Code", Object.Code);
                    for (var j = 0; j < nodes.length; j++) {
                        $(nodes[j].target).find(".l-checkbox-unchecked").click();
                    }
                }
            }

            //关闭按钮
            var colseChoice = $("<a href='javascript:void(0)' class='select2-search-choice-close'></a>");
            choice.append(colseChoice);
            choice.unbind("click.choice").bind("click.choice", this, function (e) {
                e.data.RemoveChoice.apply(e.data, [$(this).attr("data-code")]);
            });
            //校验
            this.Validate();

            if (this.IsMobile) {
                this.OnMobileChange();
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
            if ($.ui.activeDiv.id == this.EditPanelID) {
                //选中项容器高度自增减
                this.ChoicesPanel.height($(this.ChoicesElement).outerHeight());

                if (this.SelectorPanel) {
                    //搜索框填充页面高度
                    this.SelectorPanel.outerHeight($('#afui').height() - $('header:visible').outerHeight() - $('#footer:visible').outerHeight() - this.ChoicesPanel.outerHeight() - this.SearchElement.parent().outerHeight())
                }
            }

            var that = this;
            //刷新页面中所有滚动条
            $($.ui.activeDiv).find(".scroll-wrapper").each(function () {
                if ($(this).parent().is(".panel")) {
                    $(this).height($("#afui").height() - ($("header:visible").height() || 0) - ($("footer:visible").height() || 0) + "px");
                }
                var scoller = that._GetScroller(this);
                if (scoller && scoller.refresh) {
                    scoller.refresh();
                }
            })
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
            return this.IScrollers[scrollerId];;
        },

        //Error:这里有时间，可以实现批量的效果
        //添加:UserID/UserCode
        AddWorkflow: function (WorkflowCodes) {
            var that = this;
            if (typeof (WorkflowCodes) == "string") {
                WorkflowCodes = [WorkflowCodes];
            }
            var param = { WorkflowCodes: WorkflowCodes };
            $.ajax({
                type: "POST",
                url: this.GetWorkflowsHandler,
                data: param,
                dataType: "json",
                traditional: true,
                async: false,//同步执行
                success: function (data) {
                    if (data) {
                        for (var i = 0; i < data.length; i++) {
                            that.AddChoice({ Code: data[i]["Value"], DisplayName: data[i]["Text"] });
                        }
                    }
                }
            });
        },

        //清除所有的选择
        ClearChoices: function () {
            for (var ObjectID in this.Choices) {
                this.RemoveChoice(ObjectID);
            }

            this.OnMobileChange();
        },

        //移除选择
        RemoveChoice: function (code) {
            if (this.Choices[code]) {
                this.OrgListPanel.find("input[ObjectID='" + code + "']").prop("checked", false);

                $("#" + this.Choices[code].ChoiceID).remove();
                delete this.Choices[code];
            }

            var checkedNodes = this.TreeManager.getChecked();
            if (checkedNodes == undefined) { }
            else {
                if (checkedNodes.length > 0) {
                    for (var index = 0; index < checkedNodes.length; index++) {
                        if (checkedNodes[index].data.Code == code) {
                            $(checkedNodes[index].target).find(".l-checkbox-checked").click();
                        }
                    }
                }
            }

            //this.OrgTreePanel.show();
            //this.OrgListPanel.hide();

            this.SetSearchTxtElementWidth.apply(this);
            this.Validate();

            this.OnMobileChange();

            if (this.OnChange) {
                this.RunScript(this, this.OnChange, [this]);
            }
        },

        //加载组织机构树
        LoadOrgTree: function () {
            //加载样式和脚本
            if (!this.OrgTreePanel) return;
            var that = this;
            var treeUl = $("<ul>").css("min-width", "180px");
            this.OrgTreePanel.append(treeUl);

            //加载LigerUI
            if (!treeUl.ligerTree) {
                $("body:first").append("<link rel='stylesheet' type='text/css' href='" + _PORTALROOT_GLOBAL + "/WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-tree.css' />");
                $.ajax({
                    url: _PORTALROOT_GLOBAL + "/WFRes/_Scripts/ligerUI/ligerui.all.js",
                    type: "GET",
                    dataType: "script",
                    async: false,//同步请求
                    global: false
                });
            }
            var that = this;
            this.IsLoaded = false;
            var paramOptions = this.GetLoadTreeOption();
            this.TreeManager = $(treeUl).ligerTree({
                checkbox: this.IsMultiple,
                idFieldName: 'Code',
                textFieldName: 'DisplayName',
                iconFieldName: "Icon",
                btnClickToToggleOnly: true,
                isExpand: function (e) {
                    if (that.IsFrequentFlow) {
                        var data = e.data;
                        return data.treedataindex == 0;
                    } else {
                        return 2;
                    }
                },
                isLeaf: function (data) {
                    return data.IsLeaf;
                },
                single: !this.IsMultiple,
                delay: function (e) {
                    var node = e.data;
                    if (node == null) return false;
                    if (node.IsLeaf == null) return false;
                    if (!that.IsAsync) return false;
                    if (!node.IsLeaf) {
                        return {
                            url: that.SheetWorkflowHandler + "?" + that.GetLoadTreeOption(node.Code),
                        }
                    }
                    return false;
                },
                url: this.SheetWorkflowHandler + "?" + paramOptions,
                onSelect: this.TreeNodeClick,
                // onCancelselect: this.TreeNodeClick,
                onCheck: this.TreeNodeCheck,
                SheetWorkflowManager: this,
                onSuccess: function () {
                    if (!this.options.SheetWorkflowManager.IsLoaded) {
                        if (this.data.length > 0) {
                            this.options.SheetWorkflowManager.TreeNodeClick.apply(this, [{ data: this.data[0] }]);
                        }
                        this.options.SheetWorkflowManager.IsLoaded = true;
                    }
                    if (that.IsAsync)
                    {
                        this.options.SheetWorkflowManager.ResetTree();
                    }
                }
            });
        },
        //获取加载组织机构的参数
        GetLoadTreeOption: function (parentCode) {
            var code = parentCode || this.RootCode;
            if (!this.IsFrequentFlow)
                var querystr = "Mode=" + this.Mode + "&ShowFavorite=false" + "&IsShared=" + this.IsShared;
            else
                var querystr = "Mode=" + this.Mode + "&ShowFavorite=true" + "&IsShared=" + this.IsShared + "&Isbilingual=" + "true";
            if (code) {
                querystr += "&ParentCode=" + code;
            }
            if (this.WorkflowCodes) {
                querystr += "&WorkflowCodes=" + this.WorkflowCodes;
            }
            if (this.IsAsync) {
                querystr += "&IsAsync=" + this.IsAsync;
            }
            return querystr;
        },
        TreeNodeClick: function (e) {
            //初始化展开树节点的时候
            if (e.target == undefined) { } else {
                //如果没有多选样式，则只能是单选
                if ($(e.target).find(".l-checkbox").attr("Class") == undefined) {
                    //如果当前DOM节点未被选中，则设置为选中样式
                    if ($(e.target).find(".l-selected").attr("Class") && $(e.target).find(".l-selected").attr("Class").indexOf("l-selected") > -1) {
                        $(e.target).find(".l-selected").attr("Class", "l-body l-selected");
                        if (e.data.IsLeaf || this.options.SheetWorkflowManager.FolderChoosed) {
                            this.options.SheetWorkflowManager.TreeNodeCheckRecursive(e.data, true);
                        }
                    }//如果已经选中，则设置为未选中，并删除该元素
                    else {
                        $(e.target).find(".l-selected").attr("Class", "l-body");
                        if (e.data.IsLeaf || this.options.SheetWorkflowManager.FolderChoosed) {
                            this.options.SheetWorkflowManager.TreeNodeCheckRecursive(e.data, false);
                        }
                    }
                }
                else {

                    //如果当前DOM节点未被选中，则设置为选中样式
                    if ($(e.target).find(".l-checkbox").attr("Class") && $(e.target).find(".l-checkbox").attr("Class").indexOf("l-checkbox-unchecked") > -1) {
                        $(e.target).find(".l-checkbox").attr("Class", "l-box l-checkbox l-checkbox-checked");
                        if (e.data.IsLeaf || this.options.SheetWorkflowManager.FolderChoosed) {
                            this.options.SheetWorkflowManager.TreeNodeCheckRecursive(e.data, true);
                        }
                    }//如果已经选中，则设置为未选中，并删除该元素
                    else {
                        $(e.target).find(".l-checkbox").attr("Class", "l-box l-checkbox l-checkbox-unchecked");
                        if (e.data.IsLeaf || this.options.SheetWorkflowManager.FolderChoosed) {
                            this.options.SheetWorkflowManager.TreeNodeCheckRecursive(e.data, false);
                        }
                    }
                }
            }
        },
        TreeNodeCheck: function (e, checked) {
            this.options.SheetWorkflowManager.TreeNodeCheckRecursive(e.data, checked);
        },
        TreeNodeCheckRecursive: function (node, checked) {
            if (node.IsLeaf || this.FolderChoosed) {
                // 设置当前节点为选中或未选中
                if (checked) {
                    if (!this.IsMultiple) {
                        this.ClearChoices();
                        if (this.IsMobile && this.Level > 0) {
                            $.ui.goBack(this.Level);
                            this.Level = 0;
                        }
                        this.FocusOutput();
                    }
                    this.AddChoice(node);
                }
                else {
                    if (this.IsMultiple)
                        this.RemoveChoice(node.Code);
                    else {
                        this.ClearChoices();
                    }
                }

                if (this.OnChange) {
                    this.RunScript(this, this.OnChange, [node]);
                }
            }
            else {
                for (var index in node.children) {
                    this.TreeNodeCheckRecursive(node.children[index], checked);
                }
            }
        },
        //重置树的选项
        ResetTree: function ()
        {
            if (this.IsMultiple) {
                var chooseNodes = new Array();
                for (var ObjectID in this.Choices) {
                    chooseNodes.push(this.Choices[ObjectID]);
                }
                for (var i = 0; i < chooseNodes.length; i++) {
                    var nodes = this.TreeManager.getNodesByAttr("Code", chooseNodes[i].Code);
                    for (var j = 0; j < nodes.length; j++) {
                        $(nodes[j].target).find(".l-checkbox-unchecked").click();
                    }
                }

            }
        },
        // 搜索流程模板
        SearchWorkflow: function (SheetWorkflowManager) {
            if (!this.IsMultiple && !this.IsSearch && !this.IsSearchTwo && !this.IsSearchThree)
                var searchkey = $(SheetWorkflowManager.SearchTxtElement).val().trim();
            else
                var searchkey = $(SheetWorkflowManager.SearchTxtElement2).val().trim();
            var currentTime = new Date();
            if ((currentTime - this.KeyTime) < 499) return;
            if (!SheetWorkflowManager.SearchKey && !searchkey) {
                return;
            }
            if (!searchkey) {
                if (!this.IsMobile) {
                    SheetWorkflowManager.SearchKey = searchkey;
                    SheetWorkflowManager.OrgListPanel.html("");
                    if (!this.FolderChoosed) {
                        SheetWorkflowManager.TreeManager.selectNode(SheetWorkflowManager.TreeManager.nodes[0]);
                    }
                }
                else {
                    SheetWorkflowManager.OrgListPanel.html("");
                }
                SheetWorkflowManager.OrgTreePanel.show();
                SheetWorkflowManager.OrgListPanel.hide();
                if (SheetWorkflowManager.IsMultiple && $('#SearchSelectAll').html() != null) {
                    $("#SearchSelectAll")[0].checked = SheetWorkflowManager.GetAllSelectStatus(SheetWorkflowManager.Choices);//更新全选按钮状态
                }
                this.ResetTree();
                return;
            }
            else {
                SheetWorkflowManager.OrgTreePanel.hide();
                SheetWorkflowManager.OrgListPanel.show();
            }
            SheetWorkflowManager.SearchMode = true;
            SheetWorkflowManager.SearchKey = searchkey;
            SheetWorkflowManager.OrgListPanel.html("");

            for (var k in SheetWorkflowManager.SearchResults) {
                if (SheetWorkflowManager.SearchResults[k].SearchKey == searchkey
                    && SheetWorkflowManager.SearchResults[k].ParentID == SheetWorkflowManager.SelectedValue) {
                    if (SheetWorkflowManager.SearchResults[k].Data && SheetWorkflowManager.SearchResults[k].Data.length) {
                        for (var i = 0; i < SheetWorkflowManager.SearchResults[k].Data.length; ++i) {
                            if (SheetWorkflowManager.SearchResults[k].Data[i].DisplayName != "常用流程")
                                SheetWorkflowManager.AddListItem.apply(SheetWorkflowManager, [SheetWorkflowManager.SearchResults[k].Data[i], searchkey, ""]);
                        }
                    }
                    else {
                        SheetWorkflowManager.OrgListPanel.html('<li class="user-item">没有流程模板</li>');
                    }
                    return;
                }
            }
            if (SheetWorkflowManager.DoingSearchList[searchkey]) {
                return;
            }
            SheetWorkflowManager.DoingSearchList[searchkey] = true;
            var param = SheetWorkflowManager.GetLoadTreeOption();
            var that = this;
            $.ajax({
                type: "GET",
                url: SheetWorkflowManager.SheetWorkflowHandler + "?" + param + "&SearchKey=" + encodeURI(searchkey),
                dataType: "json",
                //async: false,//同步执行
                success: function (data) {
                    SheetWorkflowManager.DoingSearchList[searchkey] = false;
                    if (!that.IsMultiple && !that.IsSearch && !that.IsSearchTwo && !that.IsSearchThree) {
                        if ($(SheetWorkflowManager.SearchTxtElement).val().trim() != searchkey) {
                            return;
                        }
                    }
                    else {
                        if ($(SheetWorkflowManager.SearchTxtElement2).val().trim() != searchkey) {
                            return;
                        }
                    }
                    if (SheetWorkflowManager.IsMobile) {
                        SheetWorkflowManager.AddMobileOptions(data, SheetWorkflowManager.OrgListPanel);

                        setTimeout(function () {
                            SheetWorkflowManager.RefreshMobilePage();
                        }, 550);
                    }
                    else {
                        if (data != null && data.length > 0) {
                            for (var i = 0; i < data.length; ++i) {
                                if (data[i].DisplayName != "常用流程") {
                                    SheetWorkflowManager.AddListItem.apply(SheetWorkflowManager, [data[i], searchkey, ""]);
                                }
                            }
                            if (SheetWorkflowManager.IsMultiple && $('#SearchSelectAll').html() != null) {
                                $("#SearchSelectAll")[0].checked = SheetWorkflowManager.GetAllSelectStatus(SheetWorkflowManager.Choices);//更新全选按钮状态
                            }
                        }
                        else {
                            SheetWorkflowManager.OrgListPanel.html("<li class='user-item'>没搜索到流程</li>");
                        }
                    }
                    SheetWorkflowManager.SearchResults.push({ SearchKey: searchkey, ParentID: SheetWorkflowManager.SelectedValue, Data: data });
                },
                error: function () {
                    SheetWorkflowManager.DoingSearchList[searchkey] = false;
                }
            });
        },

        // 添加组织机构选择列项
        AddListItem: function (node, searchkey, path) {
            //选择目录类型（不用判断是否是叶子节点）
            if (this.FolderChoosed) {
                var displayText = node.DisplayName;
                if (searchkey) {
                    if (displayText.indexOf(searchkey) > -1) {
                        this.AddSelectListItem(node, searchkey, path)
                    }
                    if (node.children.length > 0) {
                        path += node.DisplayName + "/";
                        for (var i = 0; i < node.children.length; i++) {
                            this.AddListItem(node.children[i], searchkey, path);
                        }
                    }
                }
            } else {
                var displayText = node.DisplayName;
                if (searchkey && node.IsLeaf) {
                    this.AddSelectListItem(node, searchkey, path)
                } else if (searchkey && !node.IsLeaf && node.children.length > 0) {
                    path += node.DisplayName + "/";
                    for (var i = 0; i < node.children.length; i++) {
                        this.AddListItem(node.children[i], searchkey, path);
                    }
                }
            }
        },

        AddSelectListItem: function (node, searchkey, nodepath) {
            var displayText = node.DisplayName;
            if (searchkey) {
                displayText = displayText.replace(searchkey, "<span class='bg-info'>" + searchkey + "</span>");
            }
            var pathlength = nodepath.split('/').length;
            if (pathlength > 3) {
                nodepath = nodepath.split('/')[0] + "/.../" + nodepath.split('/')[pathlength - 2] + '/';
                displayText = "<span style='color:lightgray;'>" + nodepath + "</span>" + displayText;
            } else {
                displayText = "<span style='color:lightgray;'>" + nodepath + "</span>" + displayText;
            }


            if (this.IsMobile) {
                var item = $("<div></div>");
                item.css("border-bottom", "1px solid #ccc");
                item.height("50px");
                item.css("clear", "both");
                var checkid = $.MvcSheetUI.NewGuid();
                var checkbox = $("<input type='checkbox' ObjectID='" + node.Code + "' id='" + checkid + "'/>");
                item.append(checkbox);
                item.append($("<label type='checkbox' label-for='" + checkid + "'>" + displayText + "</label>").css("float", "none").css("left", "25px"));
                this.OrgListPanel.append(item);

                var thatSheetUser = this;
                item.bind("touchstart", function () {
                    checkbox.click();

                    thatSheetUser.UnitCheckboxClick.apply(checkbox.get(0), [thatSheetUser, { Code: node.Code, DisplayName: node.DisplayName }]);
                });
            }
            else {
                var item = $("<div>").addClass("task").append("<i class='task-sort-icon fa  " + node.Icon + "'></i>").append("&nbsp;<span class='task-title' style='word-break: break-all;width: 85%;display: inline-table;'>" + displayText + "</span>");
                item.css("padding", "5px 10px 5px 10px").css("border", "1px solid #e4e4e4").css("cursor", "pointer");
                var checkid = $.MvcSheetUI.NewGuid();
                var checkbox = $("<input type='checkbox' ObjectID='" + node.Code + "' id='" + checkid + "'/>").css("height", "auto").css("margin", "0px").show();
                var checkItem = $("<div>").addClass("action-checkbox pull-right").append(checkbox);

                //全选按钮(多选才出现全选按钮)
                if ($('#SearchSelectAll').html() == null && this.IsMultiple) {
                    var Allselectitem = $("<div>").addClass("task").append("<span class='task-title'>全选</span>");
                    Allselectitem.css("padding", "5px 10px 5px 10px").css("cursor", "pointer");
                    this.OrgListPanel.append(Allselectitem.append('<div class="pull-right"><input type="checkbox" id="SearchSelectAll" style="height: auto; margin: 0px; display: inline-block;"></div>'));
                    Allselectitem.click(function (e) {
                        var obj = $(this).parent().find('div.action-checkbox').find('input[type="checkbox"]');
                        if ($("#SearchSelectAll").prop("checked") == true) {
                            obj.prop("checked", false);
                        } else {
                            obj.prop("checked", true);
                        }
                        obj.trigger('click');
                    });
                }

                item.click(function (e) {
                    if (e.target.tagName.toLowerCase() != "input") {
                        $(this).find("input").click();
                    }
                });
                this.OrgListPanel.append(item.append(checkItem));
                checkbox.attr("checked", this.Choices[node.Code] != undefined);

                checkbox.click({ that: this, option: { Code: node.Code, DisplayName: node.DisplayName } }, function (e) {
                    if ($(this).prop("checked") == true) {
                        e.data.that.UnitCheckboxClick.apply(this, [e.data.that, e.data.option]);
                    } else {
                        e.data.that.RemoveChoice([e.data.option.Code]);
                    }
                    $("#SearchSelectAll")[0].checked = e.data.that.GetAllSelectStatus(e.data.that.Choices);//更新全选按钮状态
                });
            }
        },
        //根据是否当前部门全部选中返回全选状态
        GetAllSelectStatus: function (jsonData) {
            var selectsAll = $("#SearchSelectAll").closest("div.task").siblings(".task").find("input");
            var len = 0;
            selectsAll.each(function () {
                var objID = $(this).attr("ObjectID");
                if (jsonData[objID] != undefined) {
                    len++;
                }
            })
            if (len == selectsAll.length) {
                return true;
            } else { return false; }
        },
        // 单元选人点击
        UnitCheckboxClick: function (that, node) {
            if (this.checked) {
                if (!that.IsMultiple) {
                    that.ClearChoices.apply(that);
                    that.OrgListPanel.find("input").attr("checked", false);
                    this.checked = true;
                    if (that.IsMobile && that.Level > 0) {
                        $.ui.goBack(that.Level);
                        that.Level = 0;
                    }
                    that.FocusOutput.apply(that);
                }
                that.AddChoice.apply(that, [node]);
            }
            else {
                if (that.IsMultiple)
                    that.RemoveChoice.apply(that, [node.ObjectID]);
                else
                    that.ClearChoices.apply(that);
            }

            if (that.OnChange) {
                that.RunScript(this, that.OnChange, [node]);
            }
        }
    });
})(jQuery);