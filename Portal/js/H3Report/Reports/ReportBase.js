var ReportBase = {
    ChartType: {
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
        Gauge: 5

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
        MultiParticipant: 4
    },
    //过滤类型
    ParameterType: {
        /// 字符型
        String: 0,
        /// 数值型
        Numeric: 1,
        /// 时间型
        DateTime: 2,
        /// 机构型
        Organization: 3,
        /// 固定值
        FixedValue: 6
        ///// 数字字典
        //MasterData: 6,
    },

    //统计字段的汇总方式
    Function: {
        /// 统计
        Count: 0,
        /// 汇总
        Sum: 1,
        /// 平均
        Avg: 2,
        /// 最小值
        Min: 3,
        /// 最大值
        Max: 4
    },

    //行列类型
    AxisDimension: {
        /// 列标题
        ColumnTitle: 0,
        /// 行标题
        RowTilte: 1
    },

    ReportType: {
        /// 汇总表
        DataTable: 0,
        /// 交叉分析
        CombinedTable: 1
    }
};
