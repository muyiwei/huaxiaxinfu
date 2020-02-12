//当前打开的选择器
var _PORTALROOT_GLOBAL = window.localStorage.getItem("H3.PortalRoot");

(function ($) {

    var worflowSelectors = [];
    var CurrentWorkflowSelector;
    // 控件执行
    // 参数{AutoTrim:true,DefaultValue:datavalue,OnChange:""}
    //可以通过  $("#id").SheetTextBox(参数)  来渲染控件和获取控件对象
    $.fn.WorkflowSelector = function () {
        this.Config = {
            //文本控件
            TextObj: undefined,
            //值控件
            ValueObj: undefined,
            //当前用户ID
            UserID: "",
            //是否显示设计中的
            ContainDraft: arguments[0].ContainDraft || false,
            //是否多选
            IsMultiMode: false,
            //是否选择业务模型模式
            IsBizObjectMode: arguments[0].IsBizObjectMode || false,
            //是否禁用搜索
            ForbidSearch: false,
            //在名称后显示编码
            IsDisplayCode: false,
            //是否搜索
            IsSearch: arguments[0].IsSearch || false,
            //改变事件
            OnClientChange: eval($(this).attr("onchange"))
        };

        var wfSelector;
        //返回已有的实例
        var id = $(this).attr("data-workflowselector-id");
        if (id) {
            for (var i = 0; i < worflowSelectors.length; i++) {
                if (worflowSelectors[i]["key"] === id) {
                    wfSelector = worflowSelectors[i]["value"];
                }
            }
        }

        if (wfSelector == null) {
            //新增一个实例对象
            var id = Math.random().toString();
            $(this).attr("data-workflowselector-id", id);
            wfSelector = new WorkflowSelector(this.Config, this);
            worflowSelectors.push({ key: id, value: wfSelector });
        }

        this.click(function () {
            wfSelector.show();
        });

        return wfSelector;
    };

    var WorkflowSelector = function (config, textObj) {
        this.treediv;
        this._TextObj = textObj;//当前文本框
        this.Config = config;
    }


    WorkflowSelector.prototype.LoadData = function (searchkey) {
        CurrentWorkflowSelector = this;
        var _CurrentExpandNode = undefined;
        if (!searchkey) {
            var CurrentWorkflow = $(CurrentWorkflowSelector.treediv);
            searchkey = "";
        } else {
            var CurrentWorkflow = $(CurrentWorkflowSelector.SelectorPanel).find(".SelectorPanel");
        }
        CurrentWorkflow.ligerTree({
            //checkbox: false,
            checkbox: false,
            idFieldName: 'Code',
            textFieldName: 'Text',
            iconFieldName: "Icon",
            btnClickToToggleOnly: false,
            isExpand: true,
            nodeWidth: 300,
            url: _PORTALROOT_GLOBAL + "/WorkflowTree/CreateWorkflowTree?FunctionCode=ProcessModel&ContainDraft=" + this.Config.ContainDraft + "&IsBizObjectMode=" + this.Config.IsBizObjectMode + "&SearchKey=" + searchkey,
            isLeaf: function (data) {
                if (!data) return false;
                return data.IsLeaf;
            },
            delay: function (e) {
                var node = e.data;
                if (node == null) return false;
                if (node.IsLeaf == null) return false;
                if (node.LoadDataUrl == null) return false;
                if (!node.IsLeaf && node.children == null) {
                    return node.LoadDataUrl;
                }
                return false;
            },
            onCheck: function (_Node, _Checked) {
                //复选时添加到结果集
                if (CurrentWorkflowSelector.Config.IsMultiMode) {
                    var _SelectedValues = ($(CurrentWorkflowSelector.Config.ValueObj).val() || "").split(";") || [];
                    var _SelectedTexts = ($(CurrentWorkflowSelector.Config.TextObj).val() || "").split(";") || [];

                    //移除空项
                    for (var index = _SelectedValues.length - 1; index >= 0; index--) {
                        if (!_SelectedValues[index]) {
                            _SelectedValues.splice(index, 1);
                            _SelectedTexts.splice(index, 1);
                        }
                    }

                    //获取节点的所有叶子
                    var _GetSelectedLeavies = function (_Data) {
                        if (!_Data) {
                        }
                            //是叶子,添加到集合并返回
                        else if (_Data.IsLeaf) {
                            if (_Data.Code) {
                                if (_Checked) {
                                    if ($.inArray(_Data.Code, _SelectedValues) == -1) {
                                        _SelectedValues.push(_Data.Code);
                                        var text = _Data.Text;
                                        if (CurrentWorkflowSelector.Config.IsDisplayCode) {
                                            text += "[" + _Data.Code + "]";
                                        }
                                        _SelectedTexts.push(text);
                                    }
                                }
                                if (!_Checked) {
                                    var index = $.inArray(_Data.Code, _SelectedValues);
                                    if (index > -1) {
                                        _SelectedValues.splice(index, 1);
                                        _SelectedTexts.splice(index, 1);
                                    }
                                }
                            }
                        }
                            //非叶子,查找子集合
                        else {
                            $(_Data.children).each(function (index) {
                                _GetSelectedLeavies(this);
                            });
                        }
                    }
                    _GetSelectedLeavies(_Node.data);

                    $(CurrentWorkflowSelector.Config.ValueObj).val(_SelectedValues.join(";")).change();
                    $(CurrentWorkflowSelector.Config.TextObj).val(_SelectedTexts.join(";")).change();
                }
            },
            onSelect: function (node) {
                //单选时
                if (!CurrentWorkflowSelector.Config.IsMultiMode
                    && node && node.data && node.data.IsLeaf) {
                    //单选时设置值并关闭
                    var text = node.data.Text;
                    if (CurrentWorkflowSelector.Config.IsDisplayCode) {
                        text += "[" + node.data.Code + "]";
                    }
                    $(CurrentWorkflowSelector.Config.TextObj).val(text);
                    $(CurrentWorkflowSelector.Config.ValueObj).val(node.data.Code);
                    //选项改变时，调用OnClientChange方法
                    if (CurrentWorkflowSelector.Config.OnClientChange) {
                        CurrentWorkflowSelector.Config.OnClientChange.apply(this, [node.data.Code]);
                    }
                    //显示\值控件都更新后触发change
                    $(CurrentWorkflowSelector.Config.ValueObj).change();
                    $(CurrentWorkflowSelector.Config.TextObj).change();
                    CurrentWorkflowSelector.hiddenSelector();
                }
            },
            onBeforeExpand: function (_Node) {
                if (CurrentWorkflowSelector.Config.IsMultiMode) {
                    _CurrentExpandNode = _Node;
                    //判断叶子节点是否选中状态
                    if (_Node.data.IsLeaf
                        && _Node.data && _Node.data.Code
                        && $.inArray(_Node.data.Code, ($(CurrentWorkflowSelector.Config.ValueObj).val() || "").split(";")) > -1) {

                    }
                }
            },
            onSuccess: function (a, b) {
                if (CurrentWorkflowSelector.Config.IsMultiMode) {
                    var _SelectedValues = ($(CurrentWorkflowSelector.Config.ValueObj).val() || "").split(";");

                    $(CurrentWorkflowSelector.panel).find(".l-checkbox").each(function () {
                        if ($(this).next().is(".l-tree-icon-leaf")) {

                        }
                        else {
                            $(this).hide();
                        }
                    });

                    if (_CurrentExpandNode && _CurrentExpandNode.data && _CurrentExpandNode.data.children) {
                        //设置选中的节点为选中状态,
                        $(_CurrentExpandNode.data.children).each(function (index) {
                            if (this.IsLeaf && $.inArray(this.Code, _SelectedValues) > -1) {
                                $(_CurrentExpandNode.target)
                                    .children(".l-children").children("li:eq(" + 0 + ")").children(".l-body").children(".l-checkbox")
                                    .removeClass(".l-checkbox-unchecked").addClass("l-checkbox-checked")
                                    .prop("checked", true);
                            }
                        });
                    }
                }
                //第一次加载完成会隐藏
                if (CurrentWorkflowSelector.panel.is(":hidden")) { CurrentWorkflowSelector.panel.show(); }

                //打开时隐藏Panel
                if (CurrentWorkflowSelector._TextObj.attr("hidePanel")) {
                    CurrentWorkflowSelector.panel.hide();
                    CurrentWorkflowSelector._TextObj.removeAttr("hidePanel");
                }
            }
        });
    }

    WorkflowSelector.prototype.show = function () {
        //点击页面隐藏选择框
        $(document).one("click", function (e) {
            CurrentWorkflowSelector.hiddenSelector();
        });

        if ($(this._TextObj).attr("isnew")) {
            if (CurrentWorkflowSelector && CurrentWorkflowSelector.panel) {
                CurrentWorkflowSelector.panel.remove();
            }
        }
        else {
            //如果当前已打开,不做处理
            if (CurrentWorkflowSelector && CurrentWorkflowSelector.Config && CurrentWorkflowSelector.Config.TextObj == this._TextObj) {
                if (CurrentWorkflowSelector.panel) {
                    CurrentWorkflowSelector.panel.show();
                    return;
                }
            }
            else if (CurrentWorkflowSelector && CurrentWorkflowSelector.panel) {
                CurrentWorkflowSelector.panel.remove();
            }
        }


        ////初始化配置信息
        //this.Config = _Config || {};

        //文本控件
        if (!this._TextObj) {
            return;
        }
        //文本控件
        this.Config.TextObj = this._TextObj;
        $(this.Config.TextObj).css("resize", "none");

        //父容器必须是非静态定位的,
        var _Wrapper = $(this.Config.TextObj).parent();
        if (!_Wrapper.is(".WorkflowSelectorWapper")) {
            $(this.Config.TextObj).wrap("<div class='WorkflowSelectorWapper' style='position:relative;'></div>");
            _Wrapper = $(this.Config.TextObj).parent();
            $(_Wrapper).width($(this.Config.TextObj).outerWidth()).height($(this.Config.TextObj).outerHeight()).css("margin", "2px").css("float", "left");
            $(_Wrapper).append("<a class='btn-clean' id='btnClear' href='#' style='position:absolute;right:4px;z-index:2;width:14px;height:14px;margin-top:-8px;font-weight:bold;color:#4444444;cursor:pointer;top:50%;'>×</a>")
        }

        $(_Wrapper).after("<input type='hidden' id='" + $(this.Config.TextObj).attr("id") + "_value'></input>");//存储SchemaCode

        //值控件
        this.Config.ValueObj = $(_Wrapper).next();

        //添加选择框
        this.panel = $("<div id='__selectorPanel' style='position:absolute;z-index:999;overflow:auto;display:none;background-color:#FFFFFF;width:390px;height:280px;border:1px solid silver'>"
            + (this.Config.IsMultiMode ? '<img id="btnClear" style="z-index: 999;position: absolute;right: 10px;top: 10px;width: 16px;height: 16px;" src="' + _PORTALROOT_GLOBAL + "/WFRes/images/p_Clear.gif" + '" ></img>' : "")
            + "</div>");
        this.treediv = $("<div id='tree1'></div>");
        if (this.Config.IsSearch) {
            //搜索
            this.SearchKey = "";
            this.searchDiv = $('<label class="input-setworkflow form-control"></label>');
            this.SearchLogo = $("<i>").addClass("input-i-search").addClass("fa fa-search").css("top", "9px");
            this.SearchTxt = $("<input style='text'>").addClass("input-text").attr("style", "width:92% !important;");
            this.searchDiv.append(this.SearchLogo).append(this.SearchTxt);
            this.panel.append(this.searchDiv);
            //绑定搜索事件
            $(this.SearchTxt).unbind("keyup.SearchTxt").bind("keyup.SearchTxt", this, function (e) {
                e.data.KeyTime = new Date();
                var that = e.data;
                setTimeout(function () {
                    that.SearchWorkflow.apply(that, [that]);
                }, 500);
                e.stopPropagation();
            });
            //搜索结果列表
            this.SelectorPanel = $("<div id= 'SelectorPanel'></div>").css("display", "none");
            this.panel.append(this.SelectorPanel);
        }

        this.treediv.appendTo(this.panel);
        //定位
        this.panel.css("top", ($(this.Config.TextObj).outerHeight() + 4) + "px").show();
        this.panel.appendTo(_Wrapper);

        //清空
        $(_Wrapper).find("#btnClear").click(function (e) {
            CurrentWorkflowSelector.panel.find(".l-checkbox-checked").removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked").prop("checked", false);

            $(CurrentWorkflowSelector.Config.ValueObj).val("").change();
            $(CurrentWorkflowSelector.Config.TextObj).val("").change();

            e.preventDefault();
            e.stopPropagation();

            if (PropertyGuide != null && PropertyGuide != undefined) {
                PropertyGuide.SheetTextBoxSchemaChange();
                PropertyGuide.DropDownListSchemaChange();
            }

        })

        this.treediv = this.treediv[0];

        //加载数据
        this.LoadData();
        //容器内点击不作处理
        $(_Wrapper).unbind("click").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

    }
    // 搜索流程模板
    WorkflowSelector.prototype.SearchWorkflow = function (SheetWorkflowManager) {
        if (this.Config.IsSearch) {
            var searchkey = $(SheetWorkflowManager.SearchTxt).val().trim();
        }
        var currentTime = new Date();
        if ((currentTime - this.KeyTime) < 499) return;
        if (!SheetWorkflowManager.SearchKey && !searchkey) {
            return;
        }
        if (!searchkey) {
            SheetWorkflowManager.SelectorPanel.hide();
            $(SheetWorkflowManager.treediv).show();
            return;
        } else {
            SheetWorkflowManager.SelectorPanel.show();
            $(SheetWorkflowManager.treediv).hide();
        }
        SheetWorkflowManager.SearchMode = true;
        SheetWorkflowManager.SearchKey = searchkey;
        //清除上一次数据及其事件
        SheetWorkflowManager.SelectorPanel.find("*").remove();
        //搜索请求数据
        SheetWorkflowManager.SelectorPanel.append("<div class='SelectorPanel'></div>");
        SheetWorkflowManager.LoadData(searchkey);
    }
    WorkflowSelector.prototype.hiddenSelector = function () {
        if (CurrentWorkflowSelector && CurrentWorkflowSelector.panel) {
            if (CurrentWorkflowSelector.Config.IsSearch) {
                CurrentWorkflowSelector.SearchTxt.val("");
                CurrentWorkflowSelector.SearchKey = "";
                CurrentWorkflowSelector.SelectorPanel.hide();
                $(CurrentWorkflowSelector.treediv).show();
            }
            CurrentWorkflowSelector.panel.hide();
        }
    }

})($)
