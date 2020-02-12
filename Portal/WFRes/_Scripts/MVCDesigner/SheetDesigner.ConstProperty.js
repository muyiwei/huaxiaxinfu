var DesignerMode = { Designer: 0, ASPX: 1 };

// 控件的 HTML 模型 （备注：用div或span取代table元素）
var HtmlModels = {
    SheetLabel: "<label data-datafield=\"{datafield}\" data-type=\"SheetLabel\">{displayname}</label>",
    SheetHyperLink: "<a data-datafield=\"{datafield}\" data-type=\"SheetHyperLink\"><span class=\"OnlyDesigner\">{displayname}</span></a>",
    SheetTextBox: "<input type=\"text\"  data-datafield=\"{datafield}\" data-type=\"SheetTextBox\"/>",
    SheetDropDownList: "<select data-datafield=\"{datafield}\" data-type=\"SheetDropDownList\"/>",
    SheetInstancePrioritySelector: "<select data-datafield=\"{datafield}\" data-type=\"SheetInstancePrioritySelector\"/>",
    SheetCheckboxList: "<div data-datafield=\"{datafield}\" data-type=\"SheetCheckboxList\"><span class=\"OnlyDesigner\"><input type=\"checkbox\">选项一&nbsp;&nbsp;&nbsp;&nbsp;<input type=\"checkbox\">选项二</span></div>",
    SheetRadioButtonList: "<div data-datafield=\"{datafield}\" data-type=\"SheetRadioButtonList\"><span class=\"OnlyDesigner\"><input type=\"radio\">选项一&nbsp;&nbsp;&nbsp;&nbsp;<input type=\"radio\">选项二</span></div>",
    SheetCheckBox: "<input type=\"checkbox\" data-datafield=\"{datafield}\" data-type=\"SheetCheckBox\"/>",
    SheetAttachment: "<div data-datafield=\"{datafield}\" data-type=\"SheetAttachment\"><span class=\"OnlyDesigner\">未选择任何文件<input type=\"button\" value=\"浏览...\" /></span></div>",
    SheetTime: "<input type=\"text\" data-datafield=\"{datafield}\" data-type=\"SheetTime\"/>",
    SheetRichTextBox: "<textarea data-datafield=\"{datafield}\" style=\"height:60px;width:100%;\" data-type=\"SheetRichTextBox\"/>",
    SheetComment: "<div data-datafield=\"{datafield}\" data-type=\"SheetComment\"><span class=\"OnlyDesigner\"><textarea style=\"height:80px;\"/></span></div>",
    SheetGridView: "<div data-datafield=\"{datafield}\" data-type=\"SheetGridView\"></div>",
    SheetTimeSpan: "<div data-datafield=\"{datafield}\" data-type=\"SheetTimeSpan\"><span class=\"OnlyDesigner\"><input type=\text\"></span></div>",
    SheetUser: "<div data-datafield=\"{datafield}\" data-type=\"SheetUser\"><span class=\"OnlyDesigner\"><input type=\"text\"/></span></div>",
    SheetOffice: "<div data-datafield=\"{datafield}\" data-type=\"SheetOffice\"><span class=\"OnlyDesigner\">{文档控件}</span></div>",
    SheetAssociation: "<input type=\"text\"  data-datafield=\"{datafield}\" data-type=\"SheetAssociation\" />"
};

//设计器控件范围
var DesignerControls = {
    SheetLabel: {
        FullName: SheetControls.SheetLabel,
        DisplayName: "SheetLabel",
        Model: HtmlModels.SheetLabel
    },
    SheetTextBox: {
        FullName: SheetControls.SheetTextBox,
        DisplayName: "SheetTextBox",
        Model: HtmlModels.SheetTextBox,
        WorkSheetProperty: null
    },
    SheetTimeSpan: {
        FullName: SheetControls.SheetTimeSpan,
        DisplayName: "SheetTimeSpan",
        Model: HtmlModels.SheetTimeSpan
    },
    SheetHyperLink: {
        FullName: SheetControls.SheetHyperLink,
        DisplayName: "SheetHyperLink",
        Model: HtmlModels.SheetHyperLink,
        WorkSheetProperty: null
    },
    SheetInstancePrioritySelector: {
        FullName: SheetControls.SheetInstancePrioritySelector,
        DisplayName: "SheetInstancePrioritySelector",
        Model: HtmlModels.SheetInstancePrioritySelector,
        WorkSheetProperty: null
    },
    SheetDropDownList: {
        FullName: SheetControls.SheetDropDownList,
        DisplayName: "SheetDropDownList",
        Model: HtmlModels.SheetDropDownList,
        WorkSheetProperty: null
    },
    SheetRadioButtonList: {
        FullName: SheetControls.SheetRadioButtonList,
        DisplayName: "SheetRadioButtonList",
        Model: HtmlModels.SheetRadioButtonList,
        WorkSheetProperty: null
    },
    SheetCheckboxList: {
        FullName: SheetControls.SheetCheckboxList,
        DisplayName: "SheetCheckboxList",
        Model: HtmlModels.SheetRadioButtonList,
        WorkSheetProperty: null
    },
    SheetCheckBox: {
        FullName: SheetControls.SheetCheckBox,
        DisplayName: "SheetCheckBox",
        Model: HtmlModels.SheetCheckBox,
        WorkSheetProperty: null
    },
    SheetAttachment: {
        FullName: SheetControls.SheetAttachment,
        DisplayName: "SheetAttachment",
        Model: HtmlModels.SheetAttachment,
        WorkSheetProperty: null
    },
    SheetTime: {
        FullName: SheetControls.SheetTime,
        DisplayName: "SheetTime",
        Model: HtmlModels.SheetTime,
        WorkSheetProperty: null
    },
    SheetRichTextBox: {
        FullName: SheetControls.SheetRichTextBox,
        DisplayName: "SheetRichTextBox",
        Model: HtmlModels.SheetRichTextBox,
        WorkSheetProperty: null
    },
    SheetComment: {
        FullName: SheetControls.SheetComment,
        DisplayName: "SheetComment",
        Model: HtmlModels.SheetComment,
        WorkSheetProperty: null
    },
    SheetGridView: {
        FullName: SheetControls.SheetGridView,
        DisplayName: "SheetGridView",
        Model: HtmlModels.SheetGridView,
        WorkSheetProperty: null
    },
    SheetUser: {
        FullName: SheetControls.SheetUser,
        DisplayName: "SheetUser",
        Model: HtmlModels.SheetSingleUserSelector,
        WorkSheetProperty: null
    },
    SheetOffice: {
        FullName: SheetControls.SheetOffice,
        DisplayName: "SheetOffice",
        Model: HtmlModels.SheetOffice,
        WorkSheetProperty: null
    },
    SheetAssociation: {
        FullName: SheetControls.SheetAssociation,
        DisplayName: "SheetAssociation",
        Model: HtmlModels.SheetAssociation,
        WorkSheetProperty: null
    }
};

//设计器数据类型
var DataLogicTypes = {
    //表单控件的类型  
    SheetActionPanel: {
        Type: -3,
        DisplayName: "SheetActionPanel",
        ControlRange: [
        DesignerControls.SheetActionPanel
        ]
    },
    Label: {
        Type: -2,
        DisplayName: "Label",
        ControlRange: [
        DesignerControls.Label
        ]
    },
    SheetLabel: {
        Type: -1,
        DisplayName: "SheetLabel",
        ControlRange: [
        DesignerControls.SheetLabel
        ]
    },
    //短文本
    ShortString: {
        Type: 14,
        DisplayName: '短文本',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetCheckboxList,
            DesignerControls.SheetRadioButtonList,
            DesignerControls.SheetInstancePrioritySelector,
            DesignerControls.SheetInstanceNameEditor
        ]
    },
    //长文本
    String: {
        Type: 13,
        DisplayName: '长文本',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetRichTextBox
        ]
    },
    //逻辑型
    Bool: {
        Type: 1,
        DisplayName: '逻辑型',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetCheckBox
        ]
    },
    //整数
    Int: {
        Type: 9,
        DisplayName: '整数',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetRadioButtonList
        ]
    },
    //长整数
    Long: {
        Type: 11,
        DisplayName: '长整数',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetRadioButtonList
        ]
    },
    //数值
    Double: {
        Type: 7,
        DisplayName: '数值',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetRadioButtonList
        ]
    },
    //货币
    Money: {
        Type: 18,
        DisplayName: '货币',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox,
            DesignerControls.SheetDropDownList,
            DesignerControls.SheetRadioButtonList
        ]
    },
    //日期
    DateTime: {
        Type: 5,
        DisplayName: '日期',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTime
        ]
    },
    //附件
    Attachment: {
        Type: 24,
        DisplayName: '附件',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetAttachment,
            DesignerControls.SheetOffice
        ]
    },
    //审批
    Discussion: {
        Type: 17,
        DisplayName: '审批',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetComment
        ]
    },
    //参与者（单人）
    SingleParticipant: {
        Type: 26,
        DisplayName: '参与者（单人）',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetUser
        ]
    },
    //参与者（多人）
    MultiParticipant: {
        Type: 27,
        DisplayName: '参与者（多人）',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetUser
        ]
    },
    //时间段
    TimeSpan: {
        Type: 25,
        DisplayName: '时间段',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTimeSpan
        ]
    },
    //Guid
    Guid: {
        Type: 33,
        DisplayName: 'Guid',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //Decimal
    Decimal: {
        Type: 35,
        DisplayName: 'Decimal',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //链接
    HyperLink: {
        Type: 16,
        DisplayName: '链接',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetHyperLink
        ]
    },
    //Html
    Html: {
        Type: 30,
        DisplayName: 'Html',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetRichTextBox
        ]
    },
    //子表
    SubTable: {
        Type: 29,
        DisplayName: '子表',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetGridView,
        ]
    },
    //XML
    Xml: {
        Type: 32,
        DisplayName: 'XML',
        ControlRange: [
            DesignerControls.SheetLabel,
            DesignerControls.SheetTextBox
        ]
    },
    //数据库表
    DataTable: {
        Type: 28,
        DisplayName: '数据库表',
        ControlRange: []
    },
    // 业务对象
    Object: {
        Type: 40,
        DisplayName: '业务对象',
        ControlRange: [DesignerControls.SheetLabel, DesignerControls.SheetGridView]
    },
    // 业务对象数组
    SubTable: {
        Type: 41,
        DisplayName: '业务对象数组',
        ControlRange: [DesignerControls.SheetLabel, DesignerControls.SheetGridView]
    },
    SheetAssociation: {
        Type: 45,
        DisplayName: '关联关系',
        ControlRange: [DesignerControls.SheetLabel,DesignerControls.SheetAssociation]
    }
};