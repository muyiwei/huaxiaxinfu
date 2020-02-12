/* qiancheng 20170524
功能说明：配置后台报表数据源
规范：独立的js模块与UI页面没有直接关系，不允许直接访问UI页面内容
      UI页面只能通过js模块提供的接口入口，访问JS模块的功能
*/

(function ($) {
    var defaults = {
        sorceType: "",//区分是否是sql类型，还是业务表对象类型
        lstDbConnection:"lstDbConnection",//数据连接池编码控件
        TableType: "Table",
        lstTables: "lstTables",
        lstSheet: "lstSheet",
    }
    var ReportSqlSource = function (options) {
        debugger
        this.options = $.extend(defaults, options);
        this.init();
    }
    //初始化方法
    ReportSqlSource.prototype.init = function () {
        debugger
        this.LoadDBConnetData();
        var that = this;
        //给选择数据连接池编码下拉框绑定读取数据的事件
        $(lstDbConnection).change(function () {
            var dbcode = $(lstDbConnection).val();
            that.loadData(dbcode,null);
        });
       
    }
    //该方法要判断是否选择的是视图，还是表
    ReportSqlSource.prototype.loadData = function (dbcode,expandRootCode) {
        //初始化应用树
        var events = {
            onNodeCreated: function (event, treeId, treeNode) {
       
                    if (treeNode.NodeType == "AppMenu") {
                        //表单
                        //if (treeNode.Code == that.EditingSource.SchemaCode) {
                        //    AppTree.getTreeObj().checkNode(treeNode, true, null, null);
                        //    return;
                        //} else {
                        //    //设置为不可选中状态
                        //    if (!treeNode.checked) {
                        //        AppTree.getTreeObj().setChkDisabled(treeNode, true, false, false);
                        //        return;
                        //    }
                        //}
                    } else if (treeNode.NodeType == "AppGroup") {
                        //分组
                        if (source.AppGroup != "" && source.AppGroup == treeNode.Code) {
                            //展开分组
                            AppTree.expandNode(treeNode);
                            return;
                        }
                    } else if (treeNode.NodeType == "AppPackage") {
                        //应用
                    }
           



            },
            onCheck: function (event, treeId, treeNode) {
                //选择遵循原则
                //1、同节点只能选择一个；
                //2、如果已经出现过一次，则不再出现；
                if (!treeNode.checked) {
                    //取消选中
                    debugger
                    AppTree.setSiblingsCheckEnabled(treeNode);
                    if (treeNode.NodeType == "AppMenu") {
                        AppTree.setRootSiblingsChildCheckEnabled(treeNode.getParentNode());
                        that.SchemaSelectPanel.find('input#source-display').val('');
                    }
                } else {
                    if (treeNode.NodeType == "AppMenu") {
                        source.SchemaCode = treeNode.Code;
                        if (!that.SchemaSelectPanel.find('input#source-display').val()) {
                            that.SchemaSelectPanel.find('input#source-display').val(treeNode.name + '数据源');
                        }
                        //设置父节点的同级节点隐藏
                        var parent = treeNode.getParentNode();
                        //AppTree.hideSiblings(parent);
                        AppTree.setRootSiblingsChildCheckDisabled(parent);
                        //设置同级节点禁用选中
                        AppTree.setSiblingsCheckDisabled(treeNode);
                    } else if (treeNode.NodeType == "SubSheet" || treeNode.NodeType == "Association") {
                        //设置同级节点禁用选中
                        AppTree.setSiblingsCheckDisabled(treeNode);
                        //选中同时，自动选中父节点
                        var parent = treeNode.getParentNode();
                        AppTree.checkNode(parent, true, false, true);
                        if (!that.SchemaSelectPanel.find('input#source-display').val() && parent.NodeType == "AppMenu") {
                            that.SchemaSelectPanel.find('input#source-display').val(parent.name + '数据源');
                        }

                    }
                }

            },
            onExpand: function (event, treeId, treeNode) {
                //恢复选中状态
            
                    var childNode = AppTree.getTreeNodeByCode(treeNode.Code);
                    if (childNode) {
                        AppTree.getTreeObj().setChkDisabled(childNode, false, false, false);
                        AppTree.getTreeObj().checkNode(childNode, true, null, null);
                        return;
                    }


             
            },
            onAsyncSuccess: function (event, treeId, treeNode, msg) {
                if (expandRootCode) {
                    var node = AppTree.getTreeNodeByCode(expandRootCode);
                    if (node) {
                        AppTree.expandNode(node);
                    }
                }
            },
            onClick: function (event, treeId, treeNode) {
                //注册树节点的点击事件，该方法拼接sql 数据字符串
                
                if (treeNode.pId == "DbTable" || treeNode.pId == "DbView"){
                    if (treeNode.children) {
                        var selects = "select "
                        for (var i = 0; i < treeNode.children.length; i++) {
                            selects = selects + treeNode.children[i].Code;
                            if (i < treeNode.children.length - 1) {
                                selects = selects + ","
                            }
                        }
                        selects = selects + " from " + treeNode.id;

                    }
                    else {
                        var selects = "select * "
                        selects = selects + " from " + treeNode.id;
                    }
                    $('div#custom_sql').find('textarea.sql').val(selects);
               
                }
            }
        };
        //初始化加载树形菜单，分别展示表格和视图窗口
        this.View_InitAppTree($(lstSheet).find('div#lstSheetTable'), dbcode, events);
      //  this.LoadTables(dbcode);//读取数据表
    
     //   this.LoadViews(dbcode); //读取视图
      
    }
    //读取数据连接池中数据编码
    ReportSqlSource.prototype.LoadDBConnetData = function () {
        debugger
        Tool_PostAction(window._PORTALROOT_GLOBAL+"/ReportSqlSourse/SorceTypeChange", this.options.sorceType, function (data) {
            debugger
            var objs = data;
            $(lstDbConnection).empty();
            for (var i = 0; i < objs.length;i++) {
                    $(lstDbConnection).append("<option value='" + objs[i].Value + "'>" + objs[i].Text + "</option>");
                }        
        });

    }
    //加载数据表列表
    ReportSqlSource.prototype.LoadTables = function (DbCode) {
        
        Tool_PostAction(window._PORTALROOT_GLOBAL+"/ReportSqlSourse/LoadTables",
            DbCode,
            function (data) {
                debugger
                $(lstTables).empty();
                if (data.length == 0) { } else {
                    for (var i = 0; i < data.length; i++) {
                        $(lstTables).append("<option value='" + data[i] + "'>" + data[i] + "</option>");
                    }
                }
               // $(lstTables).val(ReportSource.TableNameOrCommandText);
            });
    }

    //加载视图列表
    ReportSqlSource.prototype.LoadViews = function (DbCode) {
        Tool_PostAction(window._PORTALROOT_GLOBAL+"/ReportSqlSourse/LoadViews",
            DbCode,
            function (data) {
                debugger
                $(lstViews).empty();
                if (data.length == 0) { } else {
                    for (var i = 0; i < data.length; i++) {
                        $(lstViews).append("<option value='" + data[i] + "'>" + data[i] + "</option>");
                    }
                }
            });
    }

    //初始化数据源选择树
    /**
    *container 应用数容器
    *events 应用树操作事件数组
    */
    ReportSqlSource.prototype.View_InitAppTree= function (container,dbcode, events) {
        var that = this;
        var setting = {
            command:"LoadTableAndView",
            displayType: AppTree.DisplayType.Fixed,
            showSubSheet: true,
            showSubSheetField: false,
            showAssociation: true,
            showField: false,
            showSystem: false,
            showFunction: false,
            showBizProperties: false,
            showAssociationField: true,
            showOrganization: false,
            showCheckbox: true,
            chkStyle: 'checkbox',
            chkDisableInherit: true,
            canCheckTypes: [dbcode],
            showPost: false,
            events: events,
            target: container
        };
        AppTree.init(setting);
    }



    var Tool_PostAction = function (Url, Parameter, CallBack) {
        $.ajax({
            type: "POST",
            url: Url,
            data: { Parameter: Parameter },
            dataType: "json",
            success: CallBack
        });
    }
    $.ReportSqlSource = ReportSqlSource;

    if (typeof (define) != "undefined") {
        define("ReportSqlSource", [jQuery], function ($) {
            return ReportSqlSource;
        });
    }



})(jQuery);





