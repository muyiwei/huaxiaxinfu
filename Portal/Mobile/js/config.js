var config = {
    // 默认的服务地址
    appServiceUrl: "http://localhost:8010/Portal/m.asmx",
    defaultAppName: "H3 BPM移动办公",
    // 默认的语言 zh_cn：中文 en_us：English
    defaultLanguage: 'zh_cn',
    // 默认是否自动登录
    defaultAutoLogin: true,
    // 是否允许修改服务器地址
    defaultAllowModifyService: true,
    // 待办是否显示排序
    defaultUnfinishedWorkItemSortable: false,
    // 默认的用户头像
    defaultImageUrl: "img/user.jpg",
    // 发起流程是否可见
    defaultStartworkflowDisplay: true,
    // 客户端类型
    platform: ["Android", "iOS"],
    //客户端平台:App,微信，钉钉
    loginfrom: "",
    portalroot: "portal",
    // 语言包
    languages: {
        current: {},
        zh: {
            isShow: false,
            inEnShow: false,
            search: '搜索',
            searcKeyCantBeEmpty: "搜索关键词不能为空！",
            allSearchResults: "所有搜索结果↓",
            back: '返回',
            close: '关闭',
            moreData: '数据加载中...',
            pullingtext: '松开刷新',
            refreshingtext: '努力加载中...',
            filter: '筛选',
            receiveTime: '接收时间：',
            handleTime: '处理时间：',
            cancelTime: '取消时间：',
            noMoreDatas: '没有更多的数据',
            sampleData: '样例数据',
            checkNetWork: '您处于离线状态，请检查网络',
            loginAgin: '登录超时，请重新登录',
            loginExit: '登录超时，即将退出',
            loginValidate: '您没有访问的权限，请联系管理员',
            loginFail: '登录失败，请联系管理员',
            serverError: '远程服务器连接错误，请稍后再试',
            personTotal: '人',
            setSuccess: '设置成功',
            setFailed: '设置失败',
            ipError: 'ip不合法',
            paramIllegal: '参数不合法',
            reset: '重置',
            confirm: '确定',
            loginOut: '退出',
            checkNewVersion: '检测到新版本',
            enterUserName: '请输入账号',
            enterPassword: '请输入密码',
            loginError: '账号或密码不对或没有访问权限！',
            noContent: '暂无内容',
            tabs: {
                home: '首页',
                InitiateProcess: '发起流程',
                myProcess: '我的流程',
                report: "报表",
                AppCenter: "应用",
                addressList: "通讯录",
            },
            tabHome: {
                tab: ['待办', '待阅', '已办', '已阅'],
                setting: '设置',
                batchReading: '批量阅读',
                cancelBatch: '取消批量',
                cancel: '取消',
                all: '全选',
                confirm: '确定',
                item: "条",
                batchReadingSuc: "批量阅读成功",
                NoSelectWorkItem: "您未选择任何任务！",
                readItem: '已阅',
            },
            tabMyInstances: {
                tab: ['常用', '全部'],
                setFrequent: '设置常用成功',
                cancelFrequent: '取消常用成功',
                searchProcessname: '搜索流程名称',
            },
            tabMyProcess: {
                tab: ['进行中', '已完成', '已取消'],
            },
            tabAddressList: {
                user: "用户",
                OU: "组织",
                search: '搜索',
                currentDep: "(所在部门)",
            },
            Filter: {
                processName: '流程名称',
                processNames: '请输入流程名称',
                originator: '发起人',
                createdTime: '创建日期',
                star: '初始时间',
                end: '结束时间',
                urgent: '是否加急',
                yes: '是',
                no: '否',
                all: '不限',
                areaError: ' 区间不合理',
            },
            setting: {
                currentVersion: '当前版本',
                IP: '服务地址',
                languageSetting: '切换语言',
                systemSetting: '系统设置',
                checkService: '检测'
            },
            login: {
                antoLoading: '自动登录',
                systemSetting: '系统设置',
                Loading: '登录',
                name: '请输入账号',
                password: '请输入密码',
            },
            sheetUser: {
                organnizationName: '发起人',
                organnization: '组织机构',
                departmentStaff: '本部门',
                frequentUsers: '常用联系人',
                search: '搜索',
                checkAll: '全选',
                user: '人员',
                result: '',
                users: "个用户，",
                dept: "个部门",
            },
            report: {
                ProcessName: "流程名称",
                WorkFlow: "流程模板",
                Originator: "发起人",
                StartTime: "开始时间",
                EndTime: "结束时间",
                Unfinished: "进行中",
                Finished: "已完成",
                Canceled: "已取消",
                Unspecified: "全部",
                sInfo: "当前从第 _START_ 到第 _END_ 项，总共有 _TOTAL_ 项",
                sProcessing: "正在努力加载...",
                search: "搜索...",
                sZeroRecords_NoRecords: "没有满足条件的记录",
                sLengthMenu: "每页显示 _MENU_ 条记录",
                QueryInstanceByProperty_NotEnoughAuth1: "权限不足：流程模板参数为空，表示要查询出指定组织结构发起的所有流程，在这种情况下，要求您具有查看该组织发起的所有流程的权限。",
                QueryInstanceByProperty_NotEnoughAuth2: "权限不足：您不具有查看该组织结构发起的该类型的流程",
                QueryInstanceByProperty_NotEnoughAuth3: "权限不足：审批人参数为空，表示要查询出所有组织发起的流程，在这种情况下，要求您具有查看所有组织发起的该流程的权限。",
            },
            ConditionColumns: {
                Name: "流程名",
                CreatedBy: "创建人",
                CreatedByParentId: "创建人部门",
                OwnerId: "所有人",
                OwnerParentId: "所有人部门",
                CreatedTime: "创建时间",
                ModifiedTime: "修改时间"
            },
            Time: {
                Day: "天",
                Hour: "小时",
                Minute: "分钟",
                Second: "秒",
            },
            userDetail: {
                BasicInformation: "基本信息",
                Account: "账号",
                Appellation: "称谓",
                Department: "部门",
                ContactWay: "联系方式",
                Email: "邮件",
                OfficePhone: "办公电话",
                MobilePhone: "移动电话",
            },
            queryList: {
                ViewDetails: "查看详情",
                SingleChoice: "单选",
                MultipleChoice: "多选",
                InvalidDateTime: "时间区间错误",
                InvalidNumber: "数值区间错误",
                PleaseSelect: "请选择",
                PleaseInput: "请输入",
                StartValue: "起始值",
                EndValue: "结束值"
            },
            setFrequentSuc:"设置常用成功",
            cancelFrequentSuc:'取消常用成功'
        },
        en: {
            isShow: true,
            inEnShow:true,
            search: 'search',
            searcKeyCantBeEmpty: "searchKey can't be empty!",
            allSearchResults:"all the seach results↓",
            back: 'Back',
            close: 'Close',
            moreData: 'Data loading…',
            pullingtext: 'Refresh after release',
            refreshingtext: 'Refreshing...',
            filter: 'Filter',
            receiveTime: 'ReceiveTime：',
            handleTime: 'HandleTime：',
            cancelTime: 'CancelTime：',
            noMoreDatas: 'No more datas',
            sampleData: 'sampleData',
            reset: 'Reset',
            paramIllegal: 'parameter illegal ',
            confirm: 'Confirm',
            loginOut: 'LogOut',
            setFailed: 'Set failed',
            setSuccess: 'Set successfully',
            ipError: 'Illegal IP',
            checkNetWork: 'You are offline，please check the network',
            loginAgin: 'Login timeout，Please login again',
            loginExit: 'Login timeout，exit',
            loginValidate: 'You have no right to access',
            personTotal: 'person in total',
            serverError: 'Remote server connection error，please try again later',
            loginFail: 'Login fail，please contact the administrator',
            enterUserName: 'Please enter the userName',
            enterPassword: 'Please enter the password',
            checkNewVersion: 'detect the new version',
            loginError: 'Incorrect username and password  or have no right to access',
            noContent: 'There is no data.',
            tabs: {
                home: 'HomePage',
                InitiateProcess: 'Start Process',
                myProcess: 'My process',
                report: "Reporting",
                AppCenter: "AppCenter",
                addressList: "Address List",
            },
            tabHome: {
                tab: ['To-do', 'To-read', 'Finished task', 'Finished read'],
                setting: 'Setting',
                batchReading: 'Batch',
                cancelBatch: 'Cancel',
                cancel: 'Cancel',
                all: 'All',
                confirm: 'Confirm',
                item: 'Items',
                batchReadingSuc: "Batch Reading Success",
                NoSelectWorkItem: "Please Select Tasks！",
                readItem: 'Read',
            },
            tabMyInstances: {
                tab: ['Frequent Flow', 'All'],
                setFrequent: 'Set up frequent flow succeed',
                cancelFrequent: 'Cancel frequent flow succeed',
                searchProcessname: 'Search processname',
            },
            tabMyProcess: {
                tab: ['Unfinished', 'Finished', 'Canceled'],
            },
            tabAddressList: {
                user: "Users",
                OU: "Department",
                search: 'Search',
                currentDep: "(currentDep)",
            },
            Filter: {
                processName: 'ProcessName',
                processNames: 'ProcessName please',
                originator: 'Originator',
                createdTime: 'CreatedTime',
                star: 'Initial Time',
                end: 'Endtime',
                urgent: 'Urgent',
                yes: 'Yes',
                no: 'No',
                all: 'All',
                areaError: ' Unreasonable interval',
            },
            setting: {
                currentVersion: 'Current version',
                IP: 'Server Address',
                languageSetting: 'Language setting',
                systemSetting: 'System setting',
                checkService: 'Check'
            },
            login: {
                antoLoading: 'Auto',
                systemSetting: 'System setting',
                Loading: 'Login',
                name: 'UserName',
                password: 'Password',
            },
            sheetUser: {
                organnization: 'Organnization',
                departmentStaff: 'Department Staff',
                frequentUsers: 'Frequent Users',
                search: 'Search',
                checkAll: 'Check all',
                user: 'Personnel',
                result: 'No results related to',
                organnizationName: 'Originator',
                users: " users,",
                dept: " dept",
            },
            report: {
                ProcessName: "ProcessName",
                WorkFlow: "WorkFlow",
                Originator: "Originator Scope",
                StartTime: "Start time",
                EndTime: "End time",
                Unfinished: "Unfinished",
                Finished: "Finished",
                Canceled: "Canceled",
                Unspecified: "Total",
                sInfo: "Showing _START_ to _END_ of _TOTAL_ entries",
                sProcessing: "Loading...",
                search: "search...",
                sZeroRecords_NoRecords: "No Found Records",
                sLengthMenu: "Show _MENU_ entries",
                QueryInstanceByProperty_NotEnoughAuth1: "Not enough authorization: please select one workflow scope.",
                QueryInstanceByProperty_NotEnoughAuth2: "Not enough authorization: you can not view the flows originated by the selected organization.",
                QueryInstanceByProperty_NotEnoughAuth3: "Not enough authorization: if you are the administrator of the selected workflow, please select one organization scope."
            },
            ConditionColumns: {
                Name: "Name",
                CreatedBy: "CreatedBy",
                CreatedByParentId: "CreatedByParentId",
                OwnerId: "OwnerId",
                OwnerParentId: "OwnerParentId",
                CreatedTime: "CreatedTime",
                ModifiedTime: "ModifiedTime"
            },
            Time: {
                Day: "Day",
                Hour: "Hour",
                Minute: "Minute",
                Second: "Second",
            },
            userDetail: {
                BasicInformation: "Basic Information",
                Account: "Account",
                Appellation: "Appellation",
                Department: "Department",
                ContactWay: "Contact Way",
                Email: "Email",
                OfficePhone: "Office Phone",
                MobilePhone: "Mobile Phone",
            },
            queryList: {
                ViewDetails: "details",
                SingleChoice: "Single Choice",
                MultipleChoice: "Multiple Choices",
                InvalidDateTime: "Invalid DateTime",
                InvalidNumber: "Invalid Number",
                PleaseSelect: "Please Select",
                PleaseInput: "Please Input",
                StartValue: "Start Value",
                EndValue:"End Value"
            },
            setFrequentSuc: "set Frequent Success",
            cancelFrequentSuc: 'cancel Frequent Success'
        }
    }

}