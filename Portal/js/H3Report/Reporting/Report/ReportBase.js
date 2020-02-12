//qiancheng 20170418
//全局默认参数(主要是枚举),不能修改，只能克隆修改
var _DefaultOptions = {
    WidgetType: {
        /// 折线图
        Line: 0,
        /// 柱状图
        Bar: 1,
        /// 饼图
        Pie: 2,
        /// 面积图
        Area: 3,
        /// 雷达图
        Radar: 4,
        ///仪表盘
        Gauge: 5,
        //漏斗图
        Funnel: 6,
        //明细表
        Detail: 7,
        //汇总表
        Combined: 8,
        //简易看板
        SimpleBoard: 9
    },
    //字段类型
    ColumnType: {

        /// <summary>
        /// 数值
        /// </summary>
        Numeric: 0,
        /// <summary>
        /// 日期
        /// </summary>
        DateTime: 1,
        /// <summary>
        /// 字符
        /// </summary>
        String: 2,
        /// <summary>
        /// 参与者（单人）
        /// </summary>
        SingleParticipant: 3,
        /// <summary>
        /// 参与者（多人）
        /// </summary>
        MultiParticipant: 4,
        /// <summary>
        /// 逻辑型
        /// </summary>
        Boolean: 5,
        /// <summary>
        /// 关联
        /// </summary>
        Association: 6,
        /// <summary>
        /// 地址
        /// </summary>
        Address:7
    },
    //过滤类型
    FilterType: {
        /// 字符型
        String: 0,
        /// 数值型
        Numeric: 1,
        /// 时间型
        DateTime: 2,
        /// 机构型
        Organization: 3,
        /// 固定值
        FixedValue: 4,
        /// 数字字典
        MasterData: 5,
        //关联查询
        Association: 6,
        //布尔
        Boolean: 7,
        //流程模板
        WorkflowTemple:8
    },
    OrganizationType: {
        ///人员
        User: 0,
        ///部门
        Dept: 1,
        ///全部
        All: 2
    },

    //统计字段的汇总方式
    Function: {
        ///空值
        nullfs:-1,
        /// 统计
        Count: 0,
        /// 汇总
        Sum: 1,
        /// 平均
        Avg: 2,
        /// 最小值
        Min: 3,
        /// 最大值
        Max: 4,
        /// 日期：年
        YY:5,
        ///  日期：年季度月
        YYYYMM: 6,
        ///日期：年季度月日
        YYYYMMDD: 7,
        ///日期：年，季度
        JD:8
    },
    ReportLayout: {
        /// 一行一列
        OneColumn: 0,
        /// <summary>
        /// 一行两列
        /// </summary>
        TwoColumns: 1,
        /// <summary>
        /// 一行三列
        /// </summary>
        ThreeColumns: 2
    },
    AssociationMode: {
        Inner: 0,
        /// <summary>
        /// 左连接
        /// </summary>
        Left: 1,
        /// <summary>
        /// 右连接
        /// </summary>
        Right: 2
    },
    AssociationMethod: {
        /// <summary>
        /// 自动
        /// </summary>
        Auto: 0,
        /// <summary>
        /// 手动
        /// </summary>
        Manual: 1,
    },
    ResourceType: {
        //列表
        List: 0,
        //SQL
        SQL: 1,
        //适配器
        Adapter: 2
    },
    ReportSourceType: {
        ///表单
        Sheet: 0,
        //自定义sql
        Sql: 1,
        //适配器
        Adapter: 2
    },
    ReportFrozenHeaderType: {
        //不冻结
        FrozenNone: 0,
        //冻结行表头
        FrozenRowHeader: 1,
        //冻结列表头
        FrozenColumnHeader: 2,
        //冻结行表头和列表头
        FrozenRowAndColumnHeader: 3,
    },
    DataFormat: {
        //预定义
        PreDefined: 0,
        //自定义
        Custom:1
    }
};
//默认列
var DefaultColumn = {
    //默认列编码
    ColumnCode: "DefaultCountCode",
    //显示名称
    DisplayName: "计数",
    //类型
    ColumnType: _DefaultOptions.ColumnType.Numeric,
    //合计
    FunctionType: _DefaultOptions.Function.Count,
}
var DefaultColumnCode = "";
var DefaultColumnDisplayName = "";
//报表设计器模板
var ReportTemplates = {
    
    Detail: {
        Text: '明细表',
        Icon: 'iconReport-report-detail',
        Type: _DefaultOptions.WidgetType.Detail,
        DesignProperties: [
            { Name: "DisplayName", Text: "标题", DefaultValue: "" },
            { Name: "ReportSource", Text: "数据源", DefaultValue: "", ReportSource: {} },
        ]
    },
    Combined: {
        Text: '汇总表',
        Icon: 'iconReport-report-combined',
        Type: _DefaultOptions.WidgetType.Combined,
        DesignProperties: [
            { Name: "DisplayName", Text: "标题", DefaultValue: "" },
            { Name: "ReportSource", Text: "数据源", DefaultValue: "", ReportSource: {} },
        ]
    },
    Line: {
        Text: '折线图',
        Icon: 'iconReport-report-line',
        Type: _DefaultOptions.WidgetType.Line,
        DesignProperties: {}
    },
    Bar: {
        Text: '柱状图',
        Icon: 'iconReport-report-bar',
        Type: _DefaultOptions.WidgetType.Bar,
        DesignProperties: {}
    },
    Pie: {
        Text: '饼图',
        Icon: 'iconReport-report-pie',
        Type: _DefaultOptions.WidgetType.Pie,
        DesignProperties: {}
    },
    //Area: {
    //    Text: '面积图',
    //    Icon: 'iconReport-report-area',
    //    Type: _DefaultOptions.WidgetType.Area,
    //    DesignProperties: {}
    //},
    Radar: {
        Text: '雷达图',
        Icon: 'iconReport-report-radar',
        Type: _DefaultOptions.WidgetType.Radar,
        DesignProperties: {}
    },
    //Gauge: {
    //    Text: '仪表盘',
    //    Icon: '',
    //    Type: _DefaultOptions.WidgetType.Gauge,
    //    DesignProperties: {}
    //},
    Funnel: {
        Text: '漏斗图',
        Icon: 'iconReport-report-funnel',
        Type: _DefaultOptions.WidgetType.Funnel,
        DesignProperties: {}
    },
    SimpleBoard: {
        Text: '简易看板',
        Icon: 'iconReport-report-simpleboard',
        Type: _DefaultOptions.WidgetType.SimpleBoard,
        DesignProperties: {}
    }
};
//构造默认显示数据
var ReportDefaultData = {
    7: {
        data1: [
          {
              field: 'f1',
              title: '字段1'
          },
          {
              field: 'f2',
              title: '字段2'
          },
          {
              field: 'f3',
              title: '字段3'
          },
          {
              field: 'f4',
              title: '字段4'
          },
          {
              field: 'f5',
              title: '字段5'
          }

        ],
        data2: [
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            },
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            },
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            },
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            },
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            },
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            }
            ,
            {
                f1: '', f2: '', f3: '', f4: '', f5: ''
            }

        ]
    },
    8: {},
    0: {
        Categories: ['分类1', '分类2', '分类3'],
        Series: [{ 'Name': '系列1', 'Data': [90, 10, 71] }, { 'Name': '系列2', 'Data': [70, 50, 90] }, { 'Name': '系列3', 'Data': [46, 88, 28] }]
    },
    1: {
        Categories: ['分类1', '分类2', '分类3'],
        Series: [{ 'Name': '系列1', 'Data': [90, 10, 71] }, { 'Name': '系列2', 'Data': [70, 50, 90] }, { 'Name': '系列3', 'Data': [46, 88, 28] }]
    },
    2: {
        Categories: ['分类1'],
        Series: [{ 'Name': '系列1', 'Data': [90] }, { 'Name': '系列2', 'Data': [70] }, { 'Name': '系列3', 'Data': [46] }]
    },
    4: {
        Categories: ['类别1', '类别2', '类别3', '类别4', '类别5', '类别6', '类别7'],
        Series: [{
            'Name': '系列1',
            'Data': [90, 20, 60, 40, 80, 66, 45]
        }, {
            'Name': '系列2',
            'Data': [40, 80, 55, 76, 33, 45, 78]
        }, {
            'Name': '系列3',
            'Data': [10, 24, 33, 54, 58, 45, 66]
        }]
    },
    6: {
        Categories: ['分类1'],
        Series: [{
            'Name': '系列1',
            'Data': [10]
        }, {
            'Name': '系列2',
            'Data': [20]
        }, {
            'Name': '系列3',
            'Data': [40]
        }, {
            'Name': '系列4',
            'Data': [66]
        }, {
            'Name': '系列5',
            'Data': [75]
        }, {
            'Name': '系列6',
            'Data': [90]
        }]
    },
    9: {}
};
//报表页
var ReportPage = function (config) {
    this.Code = config.Code || "";
    this.DisplayName = "";
    this.ReportWidgets = config.ReportWidgets || [];
    this.Filters = config.Filters || [];
};

//Error 未完成
//过滤条件
var ReportFilter = function (config) {
    this.ColumnCode = config.ColumnCode || "";
    this.ColumnName = config.ColumnName || "";
    this.DisplayName = config.DisplayName || "";
    this.FilterType = config.FilterType;
    this.FilterValue = config.FilterValue || null;
    this.DefaultValue = config.DefaultValue || null;
    this.AllowNull =config.AllowNull==void 0?true:config.AllowNull && true;
    this.Visible = config.Visible || true;
    this.ColumnType = config.ColumnType ;
    this.OrganizationType = config.OrganizationType || _DefaultOptions.OrganizationType.All;
    this.AssociationType = config.AssociationType || 0,
   this.AssociationSchemaCode = config.AssociationSchemaCode || null
    this.IsSqlWhere = config.IsSqlWhere || false;
};

//数据源
var ReportSource = function (config) {
    this.ObjectId = config.ObjectId || "";
    this.DisplayName = config.DisplayName || "";
    this.IsUseSql = config.IsUseSql || false;
    this.DataSourceCoding = config.DataSourceCoding || "";
    this.CommandText = config.CommandText || "";
    this.SchemaCode = config.SchemaCode || "";
    this.ReportSourceAssociations = config.ReportSourceAssociations || [];
    this.IsSubSheet = config.IsSubSheet || false;
    this.SqlColumns = config.SqlColumns || [];
    this.FunctionColumns = config.FunctionColumns || [];
    this.SQLWhereColumns = config.SQLWhereColumns || [];
};
//报表页
var ReportWidgetColumn = function (config) {
    this.DefaultCountCode = "DefaultCountCode",
    this.DefaultCountDisplayName = "DefaultCountDisplayName",
    this.ObjectId = config.ObjectId || "";
    this.ColumnCode = config.ColumnCode || "";
    this.ColumnName = config.ColumnName || "";
    this.DisplayName = config.DisplayName || "";
    this.ColumnType = config.ColumnType;
    this.Sortable = config.Sortable || false;
    this.Ascending = config.Ascending || false;
    this.FunctionType = config.FunctionType || _DefaultOptions.Function.Sum;
    this.Formula = config.Formula || "";
    this.ColumnDataFormat = config.ColumnDataFormat || _DefaultOptions.DataFormat.PreDefined;
    this.Format = config.Format || "";
    this.AssociationType = config.AssociationType,
    this.AssociationSchemaCode = config.AssociationSchemaCode
}
//时间格式
var Format = {
    //自定义格式暂不开放
    // (yyyy-MM-dd,yy-MM-dd,yy-MM,yy)(%,‰),(dot;8)
    yyyyMMdd: "yyyy-MM-dd",
    yyMMdd: "yy-MM-dd",
    yyMM: "yy-MM",
    yy: "yy"
}
//报表关联属性
var ReportSourceAssociation = function () {
    this.RootSchemaCode = "";
    this.MasterField = "";
    this.SchemaCode = "";
    this.SubField = "";
    this.AssociationMode = null;
    this.IsSubSheet = false;
    this.AssociationMethod = _DefaultOptions.AssociationMethod.Auto;
}
//移除方法
Array.prototype.remove = function (obj) {
    for (var i = 0, len = this.length; i < len; i++) {
        var tmp = this[i];
        if (!isNaN(obj)) {
            tmp = i;
        }
        if (tmp == obj) {
            for (var j = i; j < this.length; j++) {
                this[j] = this[j + 1];
            }
            this.length = this.length - 1;
        }
    }
}
//包含方法
Array.prototype.contains = function (item) {
    return RegExp("\\b" + item + "\\b").test(this);
};

var isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
var SimpleBoardFiledLimitLength = 30;
var FiledLimitLength = 30;