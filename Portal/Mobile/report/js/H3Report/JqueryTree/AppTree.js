/*
    CopyRight chuanyun
    Function:应用树
    Stage:规则编辑器、参与者、报表数据源等
*/
//封装apptree
var AppTree = (function ($) {
    //应用树节点类型
    var AppTreeNodeType = {
        AppPackage: 1,//应用包
        AppMenu: 2, //应用菜单
        SubSheet: 3,//子表
        Field: 4,// 字段
        Association: 5,//关联查询对象
        Company: 6,//公司
        OrganizationUnit: 7,//部门
        User: 8,//用户
        Post: 9,//职位
        Function: 10,//函数公式
        Rules: 11,//业务规则,
        SubSheetField: 12,
        Const: 13
    };
    //应用树展示方式
    var DisplayType = {
        Fixed: 0,
        Popup: 1
    };
    var AppTreeObj = null;
    ///初始化参数定义
    var config = {
        treeId: undefined,//树Id
        url: '/Portal/TreeSourse/DoAction', //异步取树url地址
        command: 'LoadAppTreeNodes',
        showUnitSelectionRange: false,//只加载组织机构，用于选人控件设置选人范围
        showSystem: false,  //是否显示系统字段
        showSystemEN: false,//是否显示系统字段中英文
        showSubSheet: true, //是否显示子表
        showAssociation: false, //是否显示关联查询对象
        showField: false, //是否显示字段
        showOrganization: false, //是否显示组织机构
        showPost: false, //是否显示角色
        showRules: false,//是否显示规则
        showFunction: false, //是否显示函数公式  
        showConst: false,  //是否显示常量
        showSubSheetField: false,//是否显示子表字段
        showBizProperties: false,//是否显示业务属性字段
        showAssociationField: false,//是否显示关联对象字段
        showOnlyParticipant: false, //是否只显示参与者类型字段
        showCheckbox: false,//是否默认显示checkbox
        showSheetAssociation: false,//是否显示当前表单的关联对象,
        showWorkflow: false, //是否显示流程
        curSheetCode: '', //当前表单Code
        customCodes: [], //自定义code集合
        chkStyle: 'checkbox',//chk的风格
        chkDisableInherit: true,
        canCheckTypes: [],//显示复选框的节点类型
        Codes:[],
        root: {
            appCode: null,
            display: null,
            icon: null,
            expand: true,
            nodeType: 'AppPackage'
        }, //根节点设置，默认根节点为root，获取系统内的全部应用程序，不包括通讯录
        excludeCodes: [], // 不显示的节点编码
        excludeFields: [],//不显示的字段编码
        canSelectType: [],  //可以选中的类型
        events: {
            onClick: null,//点击节点事件
            onDrag: null,  //function(event,treeId,treeNode)
            onDragMove: null, //function(event,treeId,treeNode)  event.target当前拖曳到的目标dom
            onDrop: null, //function(event,treeId,treeNodes,targetNode,moveType) targetNode用于应用树内部节点之间拖曳
            beforeDrag: null,//拖曳前事件，如果返回false，可以阻止拖曳动作
            beforeDrop: null,//function(treeId,treeNodes,targetNode,moveType,iscopy) 如果返回false，可以阻止拖曳动作
            beforeDragOpen: null, //拖曳结束前事件，如果返回false，可以阻止拖曳
            onCheck: null, //checkbox存在时的check事件回调函数,
            onNodeCreated: null,
            onExpand: null,
            onAsyncSuccess: null
        },
        target: null,
        containerHeight: '0px',
        displayType: 0,
        trees: []
    };
    //重置config
    var ResetConfig = function () {
        config.treeId = undefined,
        config.url = '/Portal/TreeSourse/DoAction';
        config.command = 'LoadAppTreeNodes';
        config.showUnitSelectionRange = false;
        config.showSystem = false;
        config.showSystemEN = false;
        config.showSubSheet = true;
        config.showAssociation = false;
        config.showField = false;
        config.showOrganization = false;
        config.showPost = false;
        config.showRules = false;
        config.showFunction = false;
        config.showConst = false;
        config.showSubSheetField = false;
        config.showBizProperties = false;
        config.showAssociationField = false;
        config.showOnlyParticipant = false;
        config.showCheckbox = false;
        config.showSheetAssociation = false;
        config.showWorkflow = false;
        config.curSheetCode = '';
        config.customCodes = [];
        config.chkStyle = 'checkbox';
        config.chkDisableInherit = true;
        config.canCheckTypes = [];
        config.root = {
            appCode: null,
            display: null,
            icon: null,
            expand: true,
            nodeType: 'AppPackage'
        };
        config.excludeCodes = [];
        config.excludeFields = [];
        config.canSelectType = [];
        config.events = {
            onClick: null,
            onDrag: null,
            onDragMove: null,
            onDrop: null,
            beforeDrag: null,
            beforeDrop: null,
            beforeDragOpen: null,
            onCheck: null,
            onNodeCreated: null,
            onExpand: null,
            onAsyncSuccess: null
        };
        config.target = null;
        config.containerHeight = '0px';
        config.displayType = 0;
        config.trees = [];
    };
    /// 获取元素相对屏幕的绝对位置
    var GetAbsPosition = function (element) {
        var left = 0;
        if (window.screenLeft != void 0) {
            left = window.screenLeft;
        }
        else if (window.screenX != void 0) {
            left = window.screenX;
        }

        var abs = {
            x: 0, y: 0
        };
        if (document.documentElement.getBoundingClientRect) {
            abs.x = element.getBoundingClientRect().left;
            abs.y = element.getBoundingClientRect().top;

            //abs.x += left + document.documentElement.scrollLeft - document.documentElement.clientLeft;
            abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.documentElement.scrollTop - document.documentElement.clientTop;
        } else {
            while (element != document.body) {
                abs.x += element.offsetLeft;
                abs.y += element.offsetTop;
                element = element.offsetParent;
            }

            abs.x += left + document.body.clientLeft - document.body.scrollLeft;
            abs.y += document.body.scrollTop | document.documentElement.scrollTop + document.body.clientTop - document.body.scrollTop;
        }
        return abs;
    };
    ///点击屏幕非弹出树范围隐藏树
    var removeTree = function () {
        $(document).unbind('click.AppTree').bind('click.AppTree', function (oEvent) {
            //判断范围
            oEvent = oEvent || window.event;
            if (config.trees.length > 0) {
                for (var i = 0, len = config.trees.length; i < len; i++) {
                    var target = $(config.trees[i]).get(0);
                    var position = GetAbsPosition(target);
                    var width = target.offsetWidth;
                    var heidth = target.offsetHeight;
                    var mouseleft = oEvent.pageX || window.event.pageX;
                    var mousetop = oEvent.pageY || window.event.pageY;
                    if (position.x > mouseleft
                        || mouseleft > (position.x + width)
                        || mousetop < position.y - 50
                        || mousetop > (position.y + heidth + 30)) {
                        $(target).remove();
                    }
                }
            }
        });
    };
    ///固定位置展示
    var fixedPresent = function (target, setting, nodes) {
        //预处理
        $(target).addClass('ztree');
        AppTreeObj = $.fn.zTree.init(target, setting, nodes);
    };
    //应用树在下拉容器展开
    var popUpPresent = function (target, setting, nodes) {
        this.removeTree();
        var position = GetAbsPosition($(target).get(0));
        var containerHeight = parseInt(setting.containerHeight);
        var windowHeight = $(window).height();
        var objHeight = $(target).get(0).offsetHeight;
        var objWidht = $(target).get(0).offsetWidth;
        var treeId = config.treeId;
        if ((containerHeight + position.y + objHeight) > windowHeight) {
            //先判断是否存在
            //在控件上方显示
            var contanier = $('<div class="ztree"></div>').css({
                'position': "absolute",
                'width': objWidht,
                'height': containerHeight,
                'left': position.x,
                'top': position.y - containerHeight,
                'overflow-y': 'auto',
                'border': '1px solid silver',
                'z-index': '9999',
                'background-color': '#fff',
                'opacity': '1'
            });
            if (treeId != void 0) {
                contanier.attr('id', treeId);
            }
            $(document.body).append(contanier);
            contanier.show();
            //添加到popup集合中
            config.trees.push(contanier);
            AppTreeObj = $.fn.zTree.init(contanier, setting, nodes);
        } else {
            var contanier = $('<div  class="ztree"></div>').css({
                'position': "absolute",
                'width': objWidht,
                'height': containerHeight,
                'left': position.x,
                'top': position.y + objHeight,
                'overflow-y': 'auto',
                'border': '1px solid silver',
                'z-index': '9999',
                'background-color': '#fff',
                'opacity': '1'
            });
            if (treeId != void 0) {
                contanier.attr('id', treeId);
            }
            $(document.body).append(contanier);
            config.trees.push(contanier);
            AppTreeObj = $.fn.zTree.init(contanier, setting, nodes);
        }
    };

    ///初始化应用树
    var init = function (setting) {
        debugger
        //重置参数
        ResetConfig();
        //初始化参数赋值
        $.each(setting, function (i, val) {
            //判断val类型
            if (val != null && val !== "") {
                config[i] = setting[i];
            }
        });
       
        var zsetting = {
            async: {
                enable: true,
                url: config.url,
                autoParam: ["id", "NodeType", "Code"],//固定写死，id为当前节点编码，NodeType为当前节点类型
                otherParam: {
                    "TreeId": config.treeId,
                    "Command": config.command,
                    "ShowUnitSelectionRange": config.showUnitSelectionRange,
                    "ShowSystem": config.showSystem,
                    "ShowSystemEN": config.showSystemEN,
                    "ShowSubSheet": config.showSubSheet,
                    "ShowAssociation": config.showAssociation,
                    'ShowField': config.showField,
                    'ShowOrganization': config.showOrganization,
                    'ShowPost': config.showPost,
                    'ShowRules': config.showRules,
                    'ShowFunctions': config.showFunction,
                    'ShowConst': config.showConst,
                    'ShowBizProperties': config.showBizProperties,//暂定需要根据根节点设置来判断是否显示
                    'ShowSubSheetField': config.showSubSheetField,
                    'ShowAssociationField': config.showAssociationField,
                    'ShowOnlyParticipant': config.showOnlyParticipant,
                    'ShowSheetAssociation': config.showSheetAssociation,
                    'ShowWorkflow': config.showWorkflow,
                    'ExcludeCodes': config.excludeCodes.join(','),
                    'ExcludeFields': config.excludeFields.join(','),
                    'CurSheetCode': config.curSheetCode,
                    'CustomeCodes': config.customCodes,
                    'ShowCheckBox': config.showCheckbox,
                    'CanCheckTypes': config.canCheckTypes.join(','),
                    'SelectTypes': config.canSelectType, // 0 流程包（应用） 1 应用菜单 2 子表 3 字段 4 关联对象 5 公司 6 部门 7 用户
                    'Codes': config.Codes,
                    'SchemeCode': setting.SchemeCode
                },

                dataFilter: null
            },
            callback: {
                onClick: config.events.onClick,
                onCheck: config.events.onCheck,
                beforeCheck: config.events.beforeCheck,
                onExpand: config.events.onExpand,
                onNodeCreated: config.events.onNodeCreated,
                onAsyncSuccess: config.events.onAsyncSuccess

            },
            check: {
                enable: config.showCheckbox,
                chkStyle: config.chkStyle,
                //autoCheckTrigger: false,
                chkboxType: {
                    "Y": "", "N": ""
                },
                chkDisableInherit: config.chkDisableInherit
            },
            data: {
                simpleData: {
                    enable: true,
                    idKey: 'id',
                    pIdKey: 'pId',
                    rootPId: null
                }
            },
            containerHeight: config.containerHeight
        };

        if (config.root.appCode != null && config.root.appCode != "") {
            var znodes = [];
            if (config.curSheetCode != null && config.curSheetCode != "") {
                //添加并行根节点
                znodes.push({
                    id: config.curSheetCode,
                    pId: 'Root',
                    name: "当前对象",
                    Code: config.curSheetCode,
                    open: false,
                    NodeType: 'AppMenu',
                    iconSkin: config.root.icon,
                    isParent: true,
                    nocheck: true
                })
            }
            znodes.push({
                id: config.root.appCode,
                pId: 'Root',
                name: config.root.display,
                Code: config.root.appCode,
                open: true,
                NodeType: config.root.nodeType,
                iconSkin: config.root.icon,
                isParent: true,
                nocheck: true
            });

            if (config.root.expand) {
                //初始展开需先异步加载
                var that = this;
                $.ajax({
                    url: config.url,
                    dataType: 'json',
                    data: {
                        "id": config.root.appCode,
                        'NodeType': config.root.nodeType,
                        "Command": config.command,
                        "ShowUnitSelectionRange": config.showUnitSelectionRange,
                        "ShowSystem": config.showSystem,
                        "ShowSystemEN": config.showSystemEN,
                        "ShowSubSheet": config.showSubSheet,
                        "ShowAssociation": config.showAssociation,
                        'ShowField': config.showField,
                        'ShowOrganization': config.showOrganization,
                        'ShowPost': config.showPost,
                        'ShowRules': config.showRules,
                        'ShowFunctions': config.showFunction,
                        'ShowConst': config.showConst,
                        'ShowBizProperties': config.showBizProperties,//暂定需要根据根节点设置来判断是否显示
                        'ShowSubSheetField': config.showSubSheetField,
                        'ShowAssociationField': config.showAssociationField,
                        'ShowOnlyParticipant': config.showOnlyParticipant,
                        'ShowSheetAssociation': config.showSheetAssociation,
                        'ShowWorkflow': config.showWorkflow,
                        'CurSheetCode': config.curSheetCode,
                        'ShowCheckBox': config.showCheckbox,
                        'CanCheckTypes': config.canCheckTypes.join(','),
                        "FirstLoad": true,
                        'ExcludeCodes': config.excludeCodes.join(','),
                        'ExcludeFields': config.excludeFields.join(','),
                        'Codes': config.Codes
                    },
                    type: 'POST',
                    success: function (data) {
                        debugger;
                        if (data != null) {
                            for (var i = 0, len = data.length; i < len; i++) {
                                var node = {
                                    id: data[i].id,
                                    pId: data[i].pId,
                                    name: data[i].name,
                                    open: false,
                                    Code: data[i].Code,
                                    NodeType: data[i].NodeType,
                                    iconSkin: data[i].iconSkin,
                                    isParent: data[i].isParent,
                                    nocheck: data[i].nocheck
                                };
                                znodes.push(node);
                            }
                            if (config.displayType == DisplayType.Fixed) {
                                debugger
                                that.fixedPresent(config.target, zsetting, znodes);
                            } else {
                                debugger
                                that.popUpPresent(config.target, zsetting, znodes);
                            }

                        }
                    }
                })
                return;
            }
        } else if (config.customCodes.length > 0) {
            debugger
            //处理报表选中后的展示，并行展示
            var znodes = [];
            var that = this;
            //获取显示名称和编码
            var Parameter = {
                'Codes': config.customCodes.join(';').trim(';')
            };
            zsetting.async.otherParam.Command = "GetSheetDisplayNames";
            zsetting.async.otherParam.Codes = config.customCodes.join(';').trim(';');
            $.ajax({
                type: "POST",
                url: "/Portal/TreeSourse/DoAction",
                data: $.extend({
                    ActionName: "GetSheetDisplayNames"
                }, Parameter),
                dataType: "json",
                success: function (data) {
                    debugger;
                    if (data.Results) {
                        for (var i = 0, len = data.Results.length; i < len; i++) {
                            var node = data.Results[i];
                            znodes.push({
                                id: node.SchemaCode,
                                pId: 'Root',
                                name: node.DisplayName,
                                Code: node.SchemaCode,
                                open: false,
                                NodeType: 'AppMenu',
                                iconSkin: '',
                                isParent: true,
                                nocheck: true
                            })
                        }
                        if (config.displayType == DisplayType.Fixed) {
                            zsetting.async.otherParam.Command = "GetSheetDisplayNames";
                            that.fixedPresent(config.target, zsetting, znodes);
                        } else {
                            that.popUpPresent(config.target, zsetting, znodes);
                        }
                    }
                }
            });

            //if (config.displayType == DisplayType.Fixed) {
            //    that.fixedPresent(config.target, zsetting, znodes);
            //} else {
            //    that.popUpPresent(config.target, zsetting, znodes);
            //}
        }
        if (config.displayType == DisplayType.Fixed) {
            this.fixedPresent(config.target, zsetting, null);
        } else {
            this.popUpPresent(config.target, zsetting, null);
        }
    };

    var hideAll = function () {

    };
    ///隐藏组织机构
    var hideOrg = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", "Company");
            tree.hideNodes(nodes);
        }
    };
    ///隐藏函数
    var hideFunc = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", "Function");
            tree.hideNodes(nodes);
        }
    };
    ///隐藏角色
    var hidePost = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", "Post");
            tree.hideNodes(nodes);
        }
    };
    ///隐藏常量
    var hideConst = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", "Const");
            tree.hideNodes(nodes);
        }
    };
    ///隐藏同级同类型节点
    ///treeNode当前节点
    var hideSiblings = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", treeNode.NodeType);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            tree.hideNodes(tmpNodes);
        }
    };
    //显示同级同类型节点
    var showSiblings = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam("NodeType", treeNode.NodeType);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            tree.showNodes(tmpNodes);
        }
    };
    //显示节点数据
    var showNodes = function (nodes) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            tree.showNodes(nodes);
        }
    };
    var getTreeObj = function () {
        return AppTreeObj;
    };
    var getTreeNodeByCode = function (code) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam('Code', code);
            if (nodes != null && nodes.length > 0) {
                return nodes[0];
            }
        }
        return null;
    };
    //获取所有选中节点的值
    var getCheckedAll = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            return tree.getCheckedNodes(true);
        }
        return null;
    };
    //取消选中节点
    var checkNode = function (treeNode, check, checkTypeFlag, callbackFlag) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            tree.checkNode(treeNode, check, false, callbackFlag);
        }
    };
    //全选
    var checkAllNodes = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            tree.checkAllNodes(true);
        }
    };
    //全取消
    var cancelAllNodes = function () {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            tree.checkAllNodes(false);
        }
    };
    //隐藏同级节点
    var hideSiblingsNodes = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam('pId', treeNode.pId);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            tree.hideNodes(tmpNodes);
        }
    };

    //设置同级根目录下的子节点不可选中
    var setRootSiblingsChildCheckDisabled = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam('pId', treeNode.pId);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            for (var i = 0, len = tmpNodes.length; i < len; i++) {
                var nodes = tree.getNodesByParam('pId', tmpNodes[i].Code);
                for (var i = 0, len = nodes.length; i < len; i++) {
                    tree.setChkDisabled(nodes[i], true, false, true);
                }
            }
        }
    };
    //设置父级兄弟节点可以选中
    var setRootSiblingsChildCheckEnabled = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam('pId', treeNode.pId);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            for (var i = 0, len = tmpNodes.length; i < len; i++) {
                var nodes = tree.getNodesByParam('pId', tmpNodes[i].Code);
                for (var i = 0, len = nodes.length; i < len; i++) {
                    tree.setChkDisabled(nodes[i], false, false, true);
                }
            }
        }
    };
    //获取同级兄弟节点
    var getSiblingsNodes = function (treeNode) {
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            var nodes = tree.getNodesByParam('pId', treeNode.pId);
            var tmpNodes = [];
            for (var i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i].id != treeNode.id) {
                    tmpNodes.push(nodes[i]);
                }
            }
            return tmpNodes;
        }
    };
    //设置兄弟节点都不可以选中
    var setSiblingsCheckDisabled = function (treeNode) {
        var nodes = this.getSiblingsNodes(treeNode);
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            if (nodes.length > 0) {
                for (var i = 0, len = nodes.length; i < len; i++) {
                    tree.setChkDisabled(nodes[i], true, false, true);
                }
            }
        }
    };

    //设置兄弟节点都可以选中
    var setSiblingsCheckEnabled = function (treeNode) {
        var nodes = this.getSiblingsNodes(treeNode);
        var tree = AppTree.getTreeObj();
        if (tree != null) {
            if (nodes.length > 0) {
                for (var i = 0, len = nodes.length; i < len; i++) {
                    tree.setChkDisabled(nodes[i], false, false, true);
                }
            }
        }
    };

    var expandNode = function (treeNode) {
        var tree = AppTree.getTreeObj();
        tree.expandNode(treeNode, true, false, true, true);
    };

    //根据指定关键字获取节点集合
    var destroyTree = function () {
        for (var i = config.trees.length - 1; i >= 0; i--) {
            $(config.trees[i]).remove();
        }
        config.trees = [];
    };

    return {
        GetAbsPosition: GetAbsPosition,
        init: init,
        AppTreeNodeType: AppTreeNodeType,
        DisplayType: DisplayType,
        fixedPresent: fixedPresent,
        popUpPresent: popUpPresent,
        removeTree: removeTree,
        getTreeObj: getTreeObj,
        hideOrg: hideOrg,
        hideFunc: hideFunc,
        hidePost: hidePost,
        hideConst: hideConst,
        hideSiblings: hideSiblings,
        showSiblings: showSiblings,
        showNodes: showNodes,
        getCheckedAll: getCheckedAll,
        checkAllNodes: checkAllNodes,
        cancelAllNodes: cancelAllNodes,
        hideSiblingsNodes: hideSiblingsNodes,
        getSiblingsNodes: getSiblingsNodes,
        setSiblingsCheckEnabled: setSiblingsCheckEnabled,
        setSiblingsCheckDisabled: setSiblingsCheckDisabled,
        setRootSiblingsChildCheckDisabled: setRootSiblingsChildCheckDisabled,
        setRootSiblingsChildCheckEnabled: setRootSiblingsChildCheckEnabled,
        expandNode: expandNode,
        getTreeNodeByCode: getTreeNodeByCode,
        checkNode: checkNode,
        destroyTree: destroyTree
    }
})(jQuery);
