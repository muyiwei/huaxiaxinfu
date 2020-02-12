// 所有控件的定义
// Error:这里改名字
FormControls = {
    FormSeqNo: {
        Text: "流水号",
        Icon: "fa-barcode",
        Designable: true,
        DesignProperties: [
           { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "流水号", Description: "" },
           { Name: "Prefix", Text: "前置字符(字母或数字)", DefaultValue: "", MaxLength: 4 },
           { Name: "DateTimeMode", Text: "日期格式", DefaultValue: "YYYY", ValueRange: [{ Val: "None", Text: "无" }, { Val: "YYYY", Text: "年" }, { Val: "YYYYMM", Text: "年月" }, { Val: "YYYYMMDD", Text: "年月日" }] }
        ]
    },
    FormTextArea: {
        Text: "多行文本",
        Icon: "fa-bars",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录文本信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "Rows", Text: "可见行数", DefaultValue: 3 },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
            { Name: "PlaceHolder", Text: "描述", DefaultValue: "", Description: "普通字段,记录文本信息" }
        ]
    },

    FormTextBox: {
        Text: "单行文本",
        Icon: "fa-tag",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录文本信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
            { Name: "NoRepeat", Text: "不允许重复值", DefaultValue: false },
            { Name: "TransferItems", Text: "控件转换", DefaultValue: "FormTextBox", ValueRange: [{ Val: "FormTextBox", Text: "文本框" }, { Val: "FormDropDownList", Text: "下拉框" }, { Val: "FormRadioButtonList", Text: "单选框" }, { Val: "FormCheckboxList", Text: "复选框" }] },
            { Name: "Mode", Text: "校验模式", DefaultValue: "Normal", ValueRange: [{ Val: "Normal", Text: "普通文本" }, { Val: "Email", Text: "邮箱" }, { Val: "Card", Text: "身份证" }, /*{ Val: "Mobile", Text: "手机" },*/ { Val: "Telephone", Text: "固话/手机" }] },
            //{ Name: "IsMultiple", Text: "模式", DefaultValue: false, ValueRange: [{ Val: false, Text: "单行" }, { Val: true, Text: "多行" }] },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
            { Name: "PlaceHolder", Text: "描述", DefaultValue: "", Description: "普通字段,记录文本信息" }
        ]
    },

    FormDateTime: {
        Text: "日期",
        Icon: "fa-bell-o",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,存储日期、时间信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
           { Name: "DateTimeMode", Text: "日期格式", DefaultValue: "yyyy-mm-dd", ValueRange: [{ Val: "yyyy-mm-dd", Text: "-年-月-日" }, { Val: "yyyy-mm-dd hh:ii", Text: "-年-月-日 时:分" }, { Val: "hh:ii", Text: "时:分" }] }
        ]
    },
    FormDateTimeStamp: {
        Text: "日期区间",
        Icon: "fa-bell-o",
        Designable: false,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,存储日期、时间信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "DateTimeMode", Text: "日期格式", DefaultValue: "yyyy-mm-dd", ValueRange: [{ Val: "yyyy-mm-dd", Text: "-年-月-日" }, { Val: "yyyy-mm-dd hh:ii", Text: "-年-月-日 时:分" }] }
        ]
    },

    FormNumber: {
        Text: "数值",
        Icon: "fa-sort-numeric-asc",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录数值信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
            { Name: "DecimalPlaces", Text: "小数位数", DefaultValue: "0", ValueRange: [{ Val: "0", Text: "整数" }, { Val: "2", Text: "两位小数" }, { Val: "3", Text: "三位小数" }, { Val: "4", Text: "四位小数" }] },
            //{ Name: "Kbit", Text: "千位分割符", DefaultValue: false },
            { Name: "ShowMode", Text: "显示模式", DefaultValue: "0", ValueRange: [{ Val: "0", Text: "正常" }, { Val: "1", Text: "显示千位分隔符" }] },
            { Name: "PlaceHolder", Text: "描述", DefaultValue: "", Description: "普通字段,记录数值信息" }
        ]
    },
    FormNumberStamp: {
        Text: '数值区间',
        Icon: "fa-sort-numeric-asc",
        Designable: false,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录数值信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
            { Name: "DecimalPlaces", Text: "小数位数", DefaultValue: "0", ValueRange: [{ Val: "0", Text: "整数" }, { Val: "2", Text: "两位小数" }, { Val: "3", Text: "三位小数" }, { Val: "4", Text: "四位小数" }] },
            { Name: "PlaceHolder", Text: "描述", DefaultValue: "", Description: "普通字段,记录数值信息" }
        ]
    },

    FormRadioButtonList: {
        Text: "单选框",
        Icon: "fa-bullseye",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
             { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,可与数据字典关联,存储选择项" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "TransferItems", Text: "控件转换", DefaultValue: "FormRadioButtonList", ValueRange: [{ Val: "FormTextBox", Text: "文本框" }, { Val: "FormDropDownList", Text: "下拉框" }, { Val: "FormRadioButtonList", Text: "单选框" }, { Val: "FormCheckboxList", Text: "复选框" }] },
            { Name: "DataDictItemName", Text: "绑定数据字典", DefaultValue: "" },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
            { Name: "DefaultValue", Text: "默认值", Visiable: false }
        ]
    },

    FormCheckboxList: {
        Text: "复选框",
        Icon: "fa-check-square-o",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,可与数据字典关联,存储选择项" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "TransferItems", Text: "控件转换", DefaultValue: "FormCheckboxList", ValueRange: [{ Val: "FormTextBox", Text: "文本框" }, { Val: "FormDropDownList", Text: "下拉框" }, { Val: "FormRadioButtonList", Text: "单选框" }, { Val: "FormCheckboxList", Text: "复选框" }] },
            { Name: "DataDictItemName", Text: "绑定数据字典", DefaultValue: "" },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
            { Name: "DefaultValue", Text: "默认值", Visiable: false },
            { Name: "isCheckbox", Text: "模式", DefaultValue: "false", ValueRange: [{ Val: "false", Text: "复选框" }] }
        //{ Name: "isCheckbox", Text: "模式", DefaultValue: "false", ValueRange: [{ Val: "true", Text: "单选框" }, { Val: "false", Text: "复选框" }] }
        ]
    },

    FormCheckbox: {//是/否控件
        Text: "是/否",
        Icon: "fa-check-circle-o",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,可与数据字典关联,存储选择项" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["是/否"] },
            { Name: "DefaultValue", Text: "默认值", Visiable: false }//,
        ]
    },

    FormDropDownList: {
        Text: "下拉框",
        Icon: "fa-tasks",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,可与数据字典关联,存储选择项" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "TransferItems", Text: "控件转换", DefaultValue: "FormDropDownList", ValueRange: [{ Val: "FormTextBox", Text: "文本框" }, { Val: "FormDropDownList", Text: "下拉框" }, { Val: "FormRadioButtonList", Text: "单选框" }, { Val: "FormCheckboxList", Text: "复选框" }] },
            { Name: "DataDictItemName", Text: "绑定数据字典", DefaultValue: "" },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
            { Name: "DefaultValue", Text: "默认值", Visiable: false }
        ],
    },

    FormMultiUser: {
        Text: "多人/部门",
        Icon: "fa-sitemap",
        Designable: true,
        //可设计属性
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "从组织机构中选择部门或者人员" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "IsMultiple", Text: "模式", Visiable: false, DefaultValue: true, ValueRange: [{ Val: false, Text: "单选" }, { Val: true, Text: "多选" }] },
            { Name: "UnitSelectionRange", Text: "选人范围", DefaultValue: "" },
            { Name: "OrgUnitVisible", Text: "部门可见", DefaultValue: true, ValueRange: [{ Val: true, Text: "可选" }, { Val: false, Text: "不可选" }] },
            { Name: "UserVisible", Text: "用户可见", DefaultValue: true, ValueRange: [{ Val: true, Text: "可选" }, { Val: false, Text: "不可选" }] },
            { Name: "IsRelatedMember", Text: "启动表单相关权限控制", DefaultValue: false, ValueRange: [{ Val: false, Text: "不启动" }, { Val: true, Text: "启动" }] },
            //{ Name: "MappingControls", Text: "关联配置" },
            { Name: "UseDataCache", Text: "是否缓存", DefaultValue: true, Visiable: false, ValueRange: [{ Val: true, Text: "是" }, { Val: false, Text: "否" }] },
            { Name: "DefaultValue", Text: "默认值", Visiable: false },
            { Name: "ShowUnActive", Text: "显示离职人员", Visiable: true, DefaultValue: false, ValueRange: [{ Val: false, Text: "不显示" }, { Val: true, Text: "显示" }] }
        ],
    },

    FormUser: {
        Text: "单人/部门",
        Icon: "fa-user",
        Designable: true,
        //可设计属性
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "从组织机构中选择部门或者人员" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "IsMultiple", Text: "模式", Visiable: false, DefaultValue: false, ValueRange: [{ Val: false, Text: "单选" }, { Val: true, Text: "多选" }] },
            { Name: "UnitSelectionRange", Text: "选人范围", DefaultValue: "" },
            { Name: "OrgUnitVisible", Text: "部门可见", DefaultValue: true, ValueRange: [{ Val: true, Text: "可选" }, { Val: false, Text: "不可选" }] },
            { Name: "UserVisible", Text: "用户可见", DefaultValue: true, ValueRange: [{ Val: true, Text: "可选" }, { Val: false, Text: "不可选" }] },
            { Name: "IsRelatedMember", Text: "启动表单相关权限控制", DefaultValue: false, ValueRange: [{ Val: false, Text: "不启动" }, { Val: true, Text: "启动" }] },
            { Name: "MappingControls", Text: "关联配置" },
            { Name: "ShowUnActive", Text: "显示离职人员", Visiable: true, DefaultValue: false, ValueRange: [{ Val: false, Text: "不显示" }, { Val: true, Text: "显示" }] },
           { Name: "UseDataCache", Text: "是否缓存", DefaultValue: true, Visiable: false, ValueRange: [{ Val: true, Text: "是" }, { Val: false, Text: "否" }] }
        ],
    },

    FormAttachment: {
        Text: "附件",
        Icon: "fa-chain-broken",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,存储文件信息" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "MaxUploadSize", Text: "文件限制", DefaultValue: 10, ValueRange: [{ Val: "1", Text: "1Mb" }, { Val: "5", Text: "5Mb" }, { Val: "10", Text: "10Mb" }] }
        ]
    },

    FormQuery: {
        Text: "关联表单",
        Icon: "fa-search",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "表单引用另一个表单时使用，比如：项目汇报需要先输入项目，这个“项目”就是关联查询类型" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "BOSchemaCode", Text: "关联表单", DefaultValue: "" },
            { Name: "AssociationFilter", Text: "表单过滤条件", DefaultValue: "" },
            { Name: "BOSchemaName", Text: "关联表单名称", DefaultValue: "", Visiable: false },//针对应用树类型选择添加的属性，还原选择的表单名称
            { Name: "IsListView", Text: "是否列表视图", Visiable: false, DefaultValue: false },
            { Name: "MappingControls", Text: "关联配置" },
            { Name: "BOSchemaInfo", Text: "关联表单信息", Visiable: false, DefaultValue: "" }//关联表单的信息，{AppPackage：xxx，AppGroup：xxx，AppMenu:xxx,IsChildSchema:xxx}
        ]
    },

    FormAreaSelect: {
        Text: "地址",
        Icon: "fa-flag",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录文本信息" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "AreaMode", Text: "显示项", DefaultValue: "P-C-T", ValueRange: [{ Val: "P-C-T", Text: "省-市-县" }, { Val: "P-C", Text: "省-市" }, { Val: "P", Text: "省" }] },
            { Name: "ShowDetailAddr", Text: "显示详细地址", DefaultValue: "true" }
        ]
    },

    FormMap: {
        Text: "位置",
        Icon: "fa-map-marker",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,存储地理位置" },
            { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
            { Name: "Range", Text: "位置范围", DefaultValue: "0", ValueRange: [{ Val: "0", Text: "限定附近位置" }, { Val: "1", Text: "允许任意位置" }] }
        ],
    },

    //关联列表控件
    FormBoList: {
        Text: "关联列表",
        Icon: "fa-align-justify",
        Designable: false,
        DesignProperties: [
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "自动列出关联的表单，无实质保存字段，而是方便查阅" },
            { Name: "BOSchemaCode", Text: "关联对象" },
            { Name: "MappingDataField", Text: "关联字段" }
        ]
    },

    FormGridView: {
        Text: "子表",
        Icon: "fa-table",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            //{ Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "表单中的多行重复数据录入" },
             { Name: "NameItems", Text: "名称", DefaultValue: "", Description: "" },
            { Name: "DisplayName", Text: "标题", DefaultValue: "", Description: "" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" }
        ]
    },

    FormLabel: {
        Text: "",
        Icon: "fa-italic",
        Designable: false,
        DesignProperties: [
             { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "" },
            { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" }
        ]
    },

    FormButton: {
        Text: "按钮",
        Icon: "fa-hand-o-up",
        Designable: true,
        DesignProperties: [
            { Name: "DataField", Text: "方法名", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "" },
        ]
    },

    FormSns: {
        Text: "动态",
        Icon: "fa-comments",
        Designable: false,
        DesignProperties: []
    },

    FormTaskTips: {
        Text: "任务提醒",
        Icon: "fa-comments",
        Designable: false,
        DesignProperties: []
    },

    FormComment: {
        Text: "审批",
        Designable: false,
        DesignProperties: [
                   { Name: "DisplayName", Text: "显示名称", DefaultValue: "审批" },
                   { Name: "TitleDirection", Text: "标题布局", DefaultValue: "Vertical", ValueRange: [{ Val: "Horizontal", Text: "横" }, { Val: "Vertical", Text: "列" }] },
                   { Name: "Width", Text: "控件大小", DefaultValue: "100%", ValueRange: [{ Val: "100%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] }
        ]
    },
    FormAclScope: {
        Text: '查询范围',
        Designable: false,
        DesignProperties: [
            { Name: "DataField", Text: "编码", DefaultValue: "" },
            { Name: "DisplayName", Text: "显示名称", DefaultValue: "查询范围" },
            { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
            { Name: "Width", Text: "控件大小", DefaultValue: "100%", ValueRange: [{ Val: "100%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] }
        ]
    },

    FormComboBox: {
        Text: "组合框", 
        Designable: false,
        //可设计属性
        DesignProperties: [
           { Name: "DataField", Text: "编码", DefaultValue: "" },
           { Name: "DisplayName", Text: "显示名称", DefaultValue: "", Description: "普通字段,记录文本信息" },
           { Name: "Width", Text: "控件大小", Visiable: false, DefaultValue: "100%", ValueRange: [{ Val: "25%", Text: "小尺寸" }, { Val: "75%", Text: "标准尺寸" }, { Val: "100%", Text: "大尺寸" }] },
           { Name: "DisplayRule", Text: "隐藏规则", DefaultValue: "" },
           { Name: "ComputationRule", Text: "计算规则", DefaultValue: "" },
           { Name: "TransferItems", Text: "控件转换", DefaultValue: "FormTextBox", ValueRange: [{ Val: "FormTextBox", Text: "文本框" }, { Val: "FormDropDownList", Text: "下拉框" }, { Val: "FormRadioButtonList", Text: "单选框" }, { Val: "FormCheckboxList", Text: "复选框" }] },
           { Name: "Mode", Text: "校验模式", DefaultValue: "Normal", ValueRange: [{ Val: "Normal", Text: "普通文本" }, { Val: "Email", Text: "邮箱" }, { Val: "Card", Text: "身份证" }, /*{ Val: "Mobile", Text: "手机" },*/ { Val: "Telephone", Text: "固话/手机" }] },
           //{ Name: "IsMultiple", Text: "模式", DefaultValue: false, ValueRange: [{ Val: false, Text: "单行" }, { Val: true, Text: "多行" }] },
           { Name: "DefaultItems", Text: "选项设置", DefaultValue: ["选项1", "选项2", "选项3"] },
           { Name: "PlaceHolder", Text: "描述", DefaultValue: "", Description: "普通字段,记录文本信息" }
        ]
    }
};

// 所有控件对开发者开放的API
FormControlAPI = {
    FormSeqNo: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormTextArea: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormTextBox: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormDateTime: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormNumber: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormRadioButtonList: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange", "AddItem", "CleanItems"],

    FormCheckboxList: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange", "AddItem", "CleanItems"],

    FormCheckbox: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormDropDownList: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange", "AddItem", "CleanItems"],

    FormMultiUser: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormUser: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormAttachment: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormQuery: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormAreaSelect: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormMap: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    FormGridView: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange", "AddRow", "ClearRows", "UpdateRow"],

    FormLabel: ["GetValue", "SetValue", "SetVisible", "BindChange", "UnBindChange"],

    $extend: ["IGuid", "IClone", "IQuery", "IShowForm", "IGetParams", "ILocation", "IShowGraph", "IShowList", "IReloadForm", "IShowSuccess", "IShowError", "IShowWarn", "IConfirm", "IDownloadAttachments", "IShowPreLoader", "IHidePreLoader", "IScanBarCode", "IScanQrCode", "IScanCard", "IShowUserInfo", "IShowChatPage", "IShowFreeCall", "IPostImageDing", "IPostLinkDing", "SmartForm"],
    SmartForm: ["ResponseContext","PostForm"],

    ControlAPIDetails: {
        "ResponseContext": { Type: "property", Demo: "（property）$.SmartForm.ResponseContext", Summary: "" },
        "SmartForm": { Type: "property", Demo: "（property）$.SmartForm", Summary: "表单操作对象" },
        "PostForm": { Type: "function", Demo: "（method）$.SmartForm.PostForm(actionName,data,callBack,errorBack,async)", Summary: "表单提交，参数说明：actionName:提交的ActionName;data:提交后台的数据;callback:回调函数;errorBack:错误回调函数;async:是否异步;" },
        "GetValue": { Type: "function", Demo: "（method）this.DataFieldID.GetValue()", Summary: "读取控件的值" },
        "SetValue": { Type: "function", Demo: "（method）this.DataFieldID.SetValue(value)", Summary: "给控件赋值，参数说明：value:控件的值" },
        "SetVisible": { Type: "function", Demo: "（method）this.DataFieldID.SetVisible(true/false)", Summary: "显示/隐藏控件，参数说明：bool，true显示，false隐藏" },
        "BindChange": { Type: "function", Demo: "（method）this.DataFieldID.BindChange(key, callback)", Summary: "给控件绑定一个变更事件，当控件值变化执行自定义函数，参数说明：key:事件标识，callback：回调函数" },
        "UnBindChange": { Type: "function", Demo: "（method）this.DataFieldID.UnBindChange(key)", Summary: "解除控件值变化事件，参数说明：" },
        "AddItem": { Type: "function", Demo: "（method）$.DataFieldID.AddItem(value,text)", Summary: "给控件添加选项，参数说明：" },
        "CleanItems": { Type: "function", Demo: "（method）$.DataFieldID.CleanItems()", Summary: "清除控件选项，参数说明：" },
        "AddRow": { Type: "function", Demo: "（method）this.SubTable.AddRow(subObjectId,{“SubTable.ColumnName”:Value})", Summary: "新建子表行，并给子表字段赋值，参数说明：" },
        "ClearRows": { Type: "function", Demo: "（method）this.SubTable.ClearRows()", Summary: "清除子表的所有数据，参数说明：" },
        "UpdateRow": { Type: "function", Demo: "（method）this.SubTable.UpdateRow(subObjectId,{“SubTable.ColumnName”:Value})", Summary: "更新子表行记录，参数说明：" },
        "IGuid": { Type: "function", Demo: "$.IGuid()", Summary: "创建Guid" },
        "IClone": { Type: "function", Demo: "$.IClone(Obj)", Summary: "对象克隆,只对对象有效，参数说明：obj:被克隆对象" },
        "IQuery": { Type: "function", Demo: "$.IQuery", Summary: "" },
        "IShowForm": { Type: "function", Demo: "$.IShowForm", Summary: "显示表单" },
        "IGetParams": { Type: "function", Demo: "$.IGetParams", Summary: "获取参数值" },
        "ILocation": { Type: "function", Demo: "$.ILocation", Summary: "定位" },
        "IShowGraph": { Type: "function", Demo: "$.IShowGraph", Summary: "显示地图" },
        "IShowList": { Type: "function", Demo: "$.IShowList", Summary: "" },
        "IReloadForm": { Type: "function", Demo: "$.IReloadForm", Summary: "重新加载表单" },
        "IShowSuccess": { Type: "function", Demo: "$.IShowSuccess(title,message)", Summary: "成功弹出框，参数说明：title：消息框标题，message：消息体" },
        "IShowError": { Type: "function", Demo: "$.IShowError(title,message)", Summary: "失败弹出框，参数说明：title：消息框标题，message：消息体" },
        "IShowWarn": { Type: "function", Demo: "$.IShowWarn(title,message)", Summary: "警告弹出框，参数说明：title：消息框标题，message：消息体" },
        "IConfirm": { Type: "function", Demo: "$.IConfirm(title,message,callback)", Summary: "使用bootstrap扩展插件pnotify弹出确认框，参数说明：title:消息标题，message:消息体，callback:回调函数" },
        "IDownloadAttachments": { Type: "function", Demo: "$.IDownloadAttachments(attachmentIds)", Summary: "批量下载附件,移动端不支持，参数说明：attachmentIds：array 附件ID数组" },
        "IShowPreLoader": { Type: "function", Demo: "$.IShowPreLoader(text)", Summary: "显示加载提示框，参数说明：text:弹出信息" },
        "IHidePreLoader": { Type: "function", Demo: "$.IHidePreLoader()", Summary: "隐藏加载提示框" },
        "IScanBarCode": { Type: "function", Demo: "$.IScanBarCode(callback)", Summary: "(移动端)扫描条形码，参数说明：callback:回调函数" },
        "IScanQrCode": { Type: "function", Demo: "$.IScanQrCode(callback)", Summary: "(移动端)扫描二位码，参数说明：callback:回调函数" },
        "IScanCard": { Type: "function", Demo: "$.IScanCard(callback)", Summary: "(移动端)扫描名片，参数说明：callback：回调函数" },
        "IShowUserInfo": { Type: "function", Demo: "$.IShowUserInfo(userId,corpId)", Summary: "(移动端)显示钉钉个人资料页，参数说明：userId:用户ID，corpId：企业ID" },
        "IShowChatPage": { Type: "function", Demo: "$.IShowChatPage(sers, corpId)", Summary: "(移动端)显示钉钉聊天页面，参数说明：userId:用户ID，corpId：企业ID" },
        "IShowFreeCall": { Type: "function", Demo: "$.IShowFreeCall()", Summary: "(移动端)拨打免费电话" },
        "IPostImageDing": { Type: "function", Demo: "$.IPostImageDing(users, corpId, text, success, fail)", Summary: "(移动端)图片类型钉消息，参数说明：userId:用户ID，corpId：企业ID，text:消息体，success：成功回调，fail:失败回调" },
        "IPostLinkDing": { Type: "function", Demo: "$.IPostLinkDing(users, corpId, text, title, url, imageUrl, subText, success, fail)", Summary: "(移动端)Link类型钉消息，参数说明：userId:用户ID，corpId：企业ID，text:消息体，title:标题，url:链接地址，imageUrl:图片地址，subText:描述，success：成功回调，fail:失败回调" }
    }
};

