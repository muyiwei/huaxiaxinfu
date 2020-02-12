ReportTemplates = {
    Detail: {
        Text: '明细表',
        Icon: '',
        DesignProperties: [
            { Name: "DisplayName", Text: "标题", DefaultValue: "" },
            { Name: "ReportSource", Text: "数据源", DefaultValue: "", ReportSource: {}},
        ]
    },
    Combined: {
        Text: '汇总表',
        Icon: '',
        DesignProperties: [
            { Name: "DisplayName", Text: "标题", DefaultValue: "" },
            { Name: "ReportSource", Text: "数据源", DefaultValue: "", ReportSource: {} },
        ]
    },
    Line: {
        Text: '折线图',
        Icon: '',
        DesignProperties: {}
    },
    Bar: {
        Text: '柱状图',
        Icon: '',
        DesignProperties: {}
    },
    Pie: {
        Text: '饼图',
        Icon: '',
        DesignProperties: {}
    },
    Area: {
        Text: '面积图',
        Icon: '',
        DesignProperties: {}
    },
    Radar: {
        Text: '雷达图',
        Icon: '',
        DesignProperties: {}
    },
    Gauge:{
        Text: '仪表盘',
        Icon: '',
        DesignProperties: {}
    },
    Funnel:{
        Text: '漏斗图',
        Icon: '',
        DesignProperties: {}
    }
};



Widget = function (config) {
    //在一个报表应用中的排序
    this.Index = config.Index || "";
    this.ObjectID = config.ObjectID || "";
    this.Code = config.Code || "";
    this.DisplayName = config.DisplayName || "";
    this.TemplateType = config.TemplateType;
    this.Width = config.Width||0;
    this.Height = config.Height||0;
    this.ReportSource = config.ReportSource||null;
    this.Properties = config.Properties || [];

}

ReportSource =function(config) {
    this.Code=config.Code;
    this.DisplayName=config.DisplayName;
    this.ReportSourceType=config.ReportSourceType;
    this.CommandText=config.CommandText||"";
    //当数据源类型为列表类型时的schemacode
    this.SchemaCode=config.SchemaCode;
    this.ReportSourceAssociations=config.ReportSourceAssociations||[];
};

ReportSourceAssociations = function(config){
    this.SchemaCode=config.SchemaCode;
    this.MasterField=config.MasterField;
    this.SubField=config.SubField;
    this.Mode=config.Mode;
};

