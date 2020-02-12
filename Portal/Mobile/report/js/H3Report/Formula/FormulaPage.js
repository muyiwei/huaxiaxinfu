/*ModifiedBy qiancheng 2017-05-17*/
/*报表计算函数规则编辑器页面部分*/
//采用新的方法构造树
function initAppTree() {
    var formulaParameter = FormulaParms;
    var formulaType = FormulaType;
    var schemaCode = SchemaCode;
    var formulaField = FormulaField;
    $.post('/Portal/FormRule/DoAction', {
        ActionName: 'InitAppTree',
        FormulaType: formulaType,
        FormulaParameter: formulaParameter,
        SchemaCode: schemaCode,
        FormulaField: formulaField
    }, function (data) {
        debugger
        var tree = data.Result.AppTree;
        var setting = {
            displayType: AppTree.DisplayType.Fixed,
            showSystem: tree.ShowSystem,  //是否显示系统字段
            showSystemEN: tree.ShowSystemEN,
            showSubSheet: tree.ShowSubSheet, //是否显示子表
            showAssociation: tree.ShowAssociation, //是否显示关联查询对象
            showAssociationField: tree.ShowAssociationField,
            showField: tree.ShowField, //是否显示字段
            showOrganization: tree.ShowOrganization, //是否显示组织机构
            showPost: tree.ShowPost, //是否显示角色
            showRules: tree.ShowRules,//是否显示规则
            showFunction: tree.ShowFunction, //是否显示函数公式
            showConst: tree.ShowConst,  //是否显示常量
            showSubSheetField: tree.ShowSubSheetField,
            showBizProperties: tree.ShowBizProperties,
            showSheetAssociation: tree.ShowSheetAssociation,
            showOnlyParticipant: tree.ShowOnlyParticipant,
            ShowWorkflow:false,//借用这个参数，作为判断报表计算函数规则设计器中数据源是否显示子集
            excludeFields: tree.ExcludeFields,
            curSheetCode: tree.CurSheetCode,
            customCodes: tree.CustomCodes,
            root: {
                appCode: tree.AppCode,
                display: tree.Display,
                icon: tree.Icon,
                expand: tree.Expand,
                nodeType: 'AppMenu'
            },
            events: {
                onClick: function (event, treeId, treeNode, clickFlag) {
                    if (treeNode.id == 'root' || treeNode.NodeType == 'AppPackage' || (treeNode.NodeType == 'Post' && treeNode.getParentNode() == null) || treeNode.NodeType == 'AppGroup') {
                        //应用对象,当前对象,AppPackage
                        return false;
                    }
                    var nodeType = treeNode.NodeType;
                    var name = '';
                    var id = '';
                    if (nodeType == 'Field') {
                        var parent = treeNode.getParentNode();
                        if (parent.id == SchemaCode && treeNode.level == 1) {//当前对象中的节点只显示字段
                            name = treeNode.name;
                            id = treeNode.id;
                            //如果是关联表单过滤的表单关联自己情况
                            if (FormulaType == 'AssociationFilter' && parent.mark == void 0) {
                                name = getNodeName(treeNode);
                                id = getNodeId(treeNode);
                            }
                        } else {
                            name = getNodeName(treeNode);
                            id = getNodeId(treeNode);
                        }
                    } else if (nodeType == 'AppMenu' && treeNode.id == SchemaCode) {
                        name = treeNode.name;
                        id = treeNode.id;
                    }
                    else if (nodeType == 'User' || nodeType == 'Post' || nodeType == 'OrganizationUnit' || nodeType == 'Company') {
                        //用户的话不需要前面的节点
                        name = treeNode.name;
                        id = treeNode.id;
                    } else {
                        name = getNodeName(treeNode);
                        id = getNodeId(treeNode);
                    }
                    if (nodeType == 'User' || nodeType == 'Post' || nodeType == 'OrganizationUnit' || nodeType == 'Company') {
                        FormulaSettings.InsertUser(name, id);
                    } else {
                        FormulaSettings.InsertVariable(name, id);
                    }
                }
            },
            target: $('#appTree')
        };
        AppTree.init(setting);
    });
};
//初始化编辑器
function initEditor(formula) {
    $.post('/Portal/FormRule/DoAction', {
        ActionName: 'LoadParameter',
        SchemaCode: SchemaCode,
        FormulaType: FormulaType,
        SchemaCodes: SchemaCodes,
        Formula: formula
    }, function (data) {
        IntelligentFunctions = data.Result.Parameter.IntelligentFunctions;
        BizDataTypes = data.Result.Parameter.BizDataTypes;
        var formulaText = data.Result.FormulaText;
        FormulaEditorLoaded();
        if (formula) {
            FormulaSettings.ResetAll(false, formulaText, '', true, true, formula);
        }
    }, 'json');
    if (FormulaType.toUpperCase() == 'DATASOURCE') {
        var titleText = TitleText;
        $('#txt_title').val(titleText).show();
        $('.formula-container .formula-editor').height(265);
    }
};
//初始化函数搜索功能
function initFunctionSearch() {
    $('#function_search').on('keyup', function () {
        var inputText = $(this).val().trim();
        if (inputText == '') {
            //恢复function列表
            $('.function-header').removeClass('fa-caret-down').addClass('fa-caret-right').show();
            $('.function-header').next('ul').hide();
            $('.function-item').show();
        } else {
            $('.function-header').hide();
            $('.function-header').next('ul').show();
            $('.function-item').each(function () {
                var functionName = $(this).text();
                if ((functionName.toLowerCase()).indexOf(inputText.toLowerCase()) == 0) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
    });
};
function initFunction() {
    $.post('/Portal/FormRule/DoAction', {
        ActionName: 'InitFunctionList',
        FormulaType: FormulaType
    }, function (data) {
        if (data) {
            var functions = data.Result.Functions;
            for (var category in functions) {
                var $li = $('<li></li>');
                var $header = $('<span class="function-header fa fa-caret-right"><a href="javascript:void(0)">' + category + '</a></span>');
                var $body = $('<ul style="display:none;"></ul>');
                for (var j = 0, len1 = functions[category].length; j < len1; j++) {
                    var functionName = functions[category][j].Name;
                    var $functionLi = $('<li class="function-item"><a href="javascript:FormulaSettings.InsertFunction(' + "'" + functionName + "'" + ')" onmouseover="FormulaSettings.ShowFunctionHelper(' + "'" + functionName + "'" + ')">' + functionName + '</a></li>');
                    $body.append($functionLi);
                }
                if (category == '逻辑函数') {
                    var $AND = $('<li class="function-item"><a href="javascript:FormulaSettings.InsertConstVariables(' + "'AND'" + ', false)" onmouseover="FormulaSettings.ShowFunctionHelper(' + "'AND'" + ')">AND</a></li>');
                    var $OR = $('<li class="function-item"><a href="javascript:FormulaSettings.InsertConstVariables(' + "'OR'" + ', false)" onmouseover="FormulaSettings.ShowFunctionHelper(' + "'OR'" + ')">OR</a></li>');
                    $body.append($AND).append($OR);
                }
                $li.append($header).append($body);
                $('.li-function>ul').append($li);
            }
        }
        initFunctionList();
    }, 'json');
}
//初始化函数
function initFunctionList() {
    $('.function-header').click(function () {
        $(this).next('ul').toggle();
        if ($(this).next('ul').is(':hidden')) {
            $(this).removeClass('fa-caret-down').addClass('fa-caret-right');
        } else {
            $(this).removeClass('fa-caret-right').addClass('fa-caret-down');
        }
    });
};

//获取模型名称
function getNodeName(treeNode) {
    if (treeNode == null || treeNode.NodeType == 'AppPackage' || (treeNode.id == SchemaCode && treeNode.level == 0 && !(FormulaType == 'AssociationFilter' && treeNode.mark == void 0)) || treeNode.NodeType == 'AppGroup') {
        return '';
    }
    var parentName = getNodeName(treeNode.getParentNode());
    if (parentName.length > 0) {
        return parentName + '.' + treeNode.name;
    }
    return treeNode.name;
};
//获取模型ID
function getNodeId(treeNode) {
    if (treeNode == null || treeNode.NodeType == 'AppPackage' || (treeNode.id == SchemaCode && treeNode.level == 0 && !(FormulaType == 'AssociationFilter' && treeNode.mark == void 0)) || treeNode.NodeType == 'AppGroup') {
        return '';
    }
    var parentId = getNodeId(treeNode.getParentNode());
    if (parentId.length > 0) {
        return parentId + '.' + treeNode.id;
    } return treeNode.id;
};
//保存
function save() {
    debugger
    if (FormulaType.toUpperCase() == 'DATASOURCE') {
        if ($('#txt_title').val().trim().length == 0) {
            $.IShowError('', '输入函数字段结果名称');
            return;
        }
        var formula = FormulaSettings.ReadExpression();
        var formulaText = FormulaSettings.ReadText();
        var titleCode = $('#txt_title').attr('title-code');
        var titleText = $('#txt_title').val();
        var expression = FormulaSettings.ReadExpression();

        if (FormulaSettings.Validate(expression)) {
            if (window.parent && window.parent.FormulaEditableStack && window.parent.FormulaEditableStack.SaveValue) {
                window.parent.FormulaEditableStack.SaveValue(formula, formulaText, titleCode, titleText);
            }
        }
        return;
    }
    var expression = FormulaSettings.ReadExpression();
    var ret = FormulaSettings.Validate(expression);
    if (!ret) {
        return;
    }
    if (window.parent && window.parent.FormulaEditableStack && window.parent.FormulaEditableStack.SaveValue) {
        window.parent.FormulaEditableStack.SaveValue(expression, FormulaSettings.ReadText());
    }

};
//取消
function cancel() {
    if (window.parent && window.parent.FormulaEditableStack && window.parent.FormulaEditableStack.ShowModal) {
        window.parent.FormulaEditableStack.ShowModal.hide();
    }
};

