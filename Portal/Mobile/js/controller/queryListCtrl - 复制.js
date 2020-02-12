// TODO:整体重构
module.controller('queryListCtrl', ['$scope', "$rootScope", "$ionicLoading", "$compile", "instanceService", "$ionicSlideBoxDelegate", "$ionicModal", "commonJS", "$ionicScrollDelegate", "$http", "$stateParams", "$state", "$ionicHistory",
    function ($scope, $rootScope, $ionicLoading, $compile, instanceService, $ionicSlideBoxDelegate, $ionicModal, commonJS, $ionicScrollDelegate, $http, $stateParams, $state, $ionicHistory) {
        //作为区分不同视图的class
        $scope.SchemaCode = $stateParams.SchemaCode;
        console.log($scope.SchemaCode);
        $scope.filters = [];
        $scope.Actions = [];
        $scope.filterFlag = false;//点击选人控件之后重新要打开筛选页
        $scope.currentSheetUserId = "";
        function addFilterClass() {
            $($scope.popover.$el[0]).find("ion-popover-view").addClass($scope.SchemaCode);
        }
        commonJS.sideSlip($scope, 'templates/queryListFilter.html', true, true).then(addFilterClass);
        $scope.$on("$ionicView.beforeLeave", function (scopes, states) {
            if ($scope.popover) {
                $scope.popover.hide();
            }
        });
        if (!window.sessionStorage.getItem("H3.queryListCtrl.decodeURI.hash")) window.sessionStorage.setItem("H3.queryListCtrl.decodeURI.hash", decodeURI(window.location.hash));

        document.addEventListener('visibilitychange', function () {
            var isHidden = document.hidden;
            if (!isHidden) { 
                if ($rootScope.dingMobile.isDingMobile && $rootScope.loginfrom == "dingtalk") { 
                    $scope.init();
                }
            }
        });

        $scope.$on('$ionicView.enter', function (scopes, states) {
            $scope.init();
        });

        //入口初始化程序，页面初次加载的事件
        $scope.init = function () {
            $scope.viewModel = [];
            if ($scope.filterFlag) {//已经点击选人控件，重新打开
                $scope.openPopover();
                if ($scope.currentSheetUserId != "") {
                    $scope.map($scope.currentSheetUserId, $rootScope.filterUsers);
                    var array = $scope.initItemsCode($rootScope.filterUsers);//选人控件传数据的特殊格式 
                    var arrayStr = "";
                    for (var i = 0; i < array.length; i++) {
                        arrayStr += array[i] + ";";
                    }
                    arrayStr = arrayStr.substring(0, arrayStr.length - 1);
                    var container = $(".sideSlip." + $scope.SchemaCode);
                    if ($rootScope.filterUsers && !angular.equals([], $rootScope.filterUsers)) {
                        if ($rootScope.filterUsers.constructor == Object) {
                            if ($rootScope.filterUsers.Name.length > 10) {
                                var chart = $rootScope.filterUsers.Name.slice(0, 10) + '...';
                            } else { var chart = $rootScope.filterUsers.Name; }
                            container.find("div#" + $scope.currentSheetUserId).find(".ion-chevron-right").prev("span").html(chart);
                        } else {
                            if ($rootScope.filterUsers[0].Name.length > 10) {
                                var chart = $rootScope.filterUsers[0].Name.slice(0, 10) + '...';
                            } else { var chart = $rootScope.filterUsers[0].Name; }

                            if (!$scope.LanJson.isShow) {
                                container.find("div#" + $scope.currentSheetUserId).find(".ion-chevron-right").prev("span").html(chart + "等" + array.length + $scope.LanJson.personTotal);
                            } else {
                                container.find("div#" + $scope.currentSheetUserId).find(".ion-chevron-right").prev("span").html(chart + array.length + $scope.LanJson.personTotal);
                            }
                        }
                    }
                    else {
                        container.find("div#" + $scope.currentSheetUserId).find(".ion-chevron-right").prev("span").html("");
                    }
                    container.find("div#" + $scope.currentSheetUserId).find('input[type="hidden"]').val(arrayStr);

                    container.find("div#" + $scope.currentSheetUserId).find('input[type="hidden"]').trigger("change");//手动触发hidden输入框的值得变化
                }
            } else {
                $("ion-nav-bar").addClass("hide");
                commonJS.loadingShow();

                $scope.loadAllData();
                //打开筛选页
            }

            //提示
            $scope.loadingShow = function (msg) {
                $ionicLoading.show({
                    template: '<span class="setcommon f15">' + msg + '</span>',
                    duration: 1.5 * 1000,
                    animation: 'fade-in',
                    showBackdrop: false,
                })
            }
            //设置钉钉头部
            //查询码 Code
            $scope.appCenterCode = $stateParams.SchemaCode;
            $scope.DisplayName = $stateParams.DisplayName;
            $scope.appCenterFlag = true;
            if ($rootScope.dingMobile.isDingMobile) {
                $scope.SetDingDingHeader($stateParams.DisplayName);
                dd.biz.navigation.setRight({
                    show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                    control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                    text: $rootScope.languages.filter,//控制显示文本，空字符串表示显示默认文本
                    onSuccess: function (result) {
                        $scope.openPopover();
                    },
                    onFail: function (err) { }
                });
            }
        };
        $scope.searchBefore = [];//存储初始数据
        var searchBeforefilters = {};//存储初始筛选条件数据
        //返回应用中心
        $scope.backToAppCenter = function () {
            // $ionicHistory.goBack();  
            window.location.href = window.location.href.substring(0, window.location.href.indexOf("#")) + window.sessionStorage.getItem("H3.queryListCtrl.decodeURI.hash")
        };
        //加载面板信息
        $scope.loadAllData = function (fn) {
            var url = "";
            var isJsonp = false;
            var params = {
                SchemaCode: $stateParams.SchemaCode,
                QueryCode: $stateParams.QueryCode,
                InputMapping: {},
                PageSize: 10,
                NextPageIndex: 0,
                Filters: {}
            };;
            url = $scope.setting.httpUrl + "/BizQueryHandler/BizQueryHandler";
            if (window.cordova) {
                isJsonp = true;
                url = $scope.setting.appServiceUrl + "/GetQuerySettingAndData?callback=JSON_CALLBACK";
                url += '&mobileToken=' + $scope.user.MobileToken;
                url += '&userCode=' + $scope.user.Code;
                url += '&SchemaCode=' + $stateParams.SchemaCode;
                url += '&QueryCode=' + $stateParams.QueryCode;
                url += '&InputMapping=';
                url += '&PageSize=' + params.PageSize;
                url += '&NextPageIndex=' + params.NextPageIndex;
                url += '&Filters=';
            } else {
                params.Action = "NewGetQuerySettingAndData";
                var r = Math.random();
                params.T = r;
            }
            instanceService.loadInstances(url, params, isJsonp).then(function (result) {
                console.log(result);
                $("#queryListFilter .scroll").html("");//清空筛选条件，不会重复渲染
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $scope.searchBefore = result;//存储第一次请求数据
                //$scope.BindData(result, true);//这次数据没有根据默认筛选条件查询
                $scope.filters = result.QuerySetting.QueryItems;
                $scope.Actions = result.QuerySetting.BizActions;
                $scope.HasSheet = result.HasSheet;

            }).finally(function () {
                commonJS.loadingHide();
                //$scope.openPopover();
                var ionic = {
                    $scope: $scope,
                    $compile: $compile,
                    $ionicScrollDelegate: $ionicScrollDelegate
                }
                var option = {
                    // SourceCode: $stateParams.ReportCode,
                    FilterContainer: $("#queryListFilter .scroll"),
                    Filters: $scope.filters,
                    CurrentUser: $scope.user.ObjectID,
                    boolDic: true,
                    Ionic: ionic
                }
                $("#queryListFilter").Filter(option);//渲染筛选条件
                searchBeforefilters = $scope.filterValues;//存储筛选条件，用于重置功能
                //获取完查询筛选条件再加载数据
                $scope.NextPageIndex = 0;
                $scope.LoadQueryData(true);
                console.log("存储筛选条件，用于重置功能");
                // console.log(searchBeforefilters);
            });
        };
        $scope.displayColumns = [];

        $scope.NextPageIndex = 1;
        $scope.LoadFinished = true;
        //从后台读取数据后，绑定到前端
        $scope.BindData = function (data, flag) {
            //列显示
            if (data) {
                //需要显示的列
                if (data.QuerySetting) {
                    for (var a in data.QuerySetting.Columns) {
                        if (data.QuerySetting.Columns[a].Visible == 1) {
                            $scope.displayColumns.push(data.QuerySetting.Columns[a].PropertyName);
                        }
                    }
                }
                //列编码和显示名称
                $scope.columnNames = data.Columns;
                var tmpArray = [];
                //系统保留字段变成中文
                var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
                //显示视图
                for (var index in data.QueryData) {
                    var itemName;
                    var d = data.QueryData[index];
                    var summary = [];
                    for (var key in d) {
                        //处理summary数据
                        //系统保留字段变成中文
                        if (array.indexOf(key) != -1) {
                            $scope.columnNames[key] = $scope.LanJson.ConditionColumns[key];
                        }
                        if ($scope.displayColumns.indexOf(key) > -1) {
                            var val = d[key] == null ? "" : d[key];
                            if (typeof (val) == "string" && val.match(/^\/Date\(\-*[0-9]+\)\/$/) != null) {
                                if (val.match(/\((\d+)\)/)) {
                                    val = val ? new Date(Number(val.match(/\((\d+)\)/)[1])).Format("yyyy-MM-dd HH:mm:ss") : "";
                                } else {
                                    val = "";
                                }
                            }
                            //取时间段的类型,并转化成“1天1时1分1秒”格式
                            for (var b in data.QuerySetting.Columns) {
                                if (data.QuerySetting.Columns[b].DisplayName == $scope.columnNames[key] && data.QuerySetting.Columns[b].Type == "TimeSpan") {//时间段格式
                                    val = val.Days + $scope.LanJson.Time.Day + val.Hours + $scope.LanJson.Time.Hour + val.Milliseconds + $scope.LanJson.Time.Minute + val.Minutes + $scope.LanJson.Time.Second;
                                }
                            }
                            summary.push({
                                DisplayName: $scope.columnNames[key],
                                Value: val
                            })
                        }
                    }
                    tmpArray.push({ itemName: d["Name"], ObjectID: d["ObjectID"], summary: summary, oldItem: d });
                }
                $scope.LoadFinished = data.LoadFinished;
                if (flag) {//从第一个数据开始
                    $scope.viewModel = tmpArray;
                } else {//数据连接
                    var arry = $scope.viewModel;
                    $scope.viewModel = arry.concat(tmpArray);
                }
            }
        };

        //加载面板信息
        $scope.LoadQueryData = function (fn) {
            var url = "";
            var isJsonp = false;
            var params = {
                SchemaCode: $stateParams.SchemaCode,
                QueryCode: $stateParams.QueryCode,
                InputMapping: {},
                PageSize: 10,
                NextPageIndex: $scope.NextPageIndex,
                Filters: $scope.filterValues
            };;
            url = $scope.setting.httpUrl + "/BizQueryHandler/BizQueryHandler";
            if (window.cordova) {
                url = $scope.setting.appServiceUrl + "/GetQuerySettingAndData?callback=JSON_CALLBACK";
                url += '&mobileToken=' + $scope.user.MobileToken;
                url += '&userCode=' + $scope.user.Code;
                url += '&SchemaCode=' + $stateParams.SchemaCode;
                url += '&QueryCode=' + $stateParams.QueryCode;
                url += '&InputMapping=';
                url += '&PageSize=' + params.PageSize;
                url += '&NextPageIndex=' + params.NextPageIndex;
                if (JSON.stringify(params.Filters) != undefined) {
                    url += '&Filters=' + JSON.stringify(params.Filters);
                } else {
                    url += '&Filters=';
                }
                isJsonp = true;
            } else {
                params.Action = "NewGetQuerySettingAndData";
                var r = Math.random();
                params.T = r;
            }
            instanceService.loadInstances(url, params, isJsonp).then(function (result) {
                console.log(result);
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $scope.BindData(result, false);
                $scope.NextPageIndex++;
            }).finally(function () {

            });
        };


        // 打开我的流程
        $scope.openBizObject = function (bizObjectId) {
            if (!bizObjectId) return;
            var eidtAction = $scope.GetAction("Edit");
            $scope.worksheetUrl = $scope.setting.openBizObjectUrl + "?BizObjectID=" + bizObjectId + "&SchemaCode=" + $scope.appCenterCode + "&SheetCode=" + eidtAction.BizSheetCode + "&Mode=Work&IsMobile=true";
            commonJS.OpenBizObjectUrl($scope, $scope.worksheetUrl);
        }

        //获取指定ActionCode的方法
        $scope.GetAction = function (ActionCode) {
            //if (Actions[ActionCode]) return Actions[ActionCode];
            var action = {};
            $scope.Actions.forEach(function (n, i) {
                if (ActionCode == n.ActionCode) {
                    action = n;
                }
            });
            return action;
        };
        // 发起流程(此处发起不同于流程表单发起，无需赋予提交权限)
        $scope.startWorkflow = function (BizSheetCode) {
            $scope.worksheetUrl = $scope.setting.openBizObjectUrl + "?SheetCode=" + BizSheetCode + "&Mode=Originate&SchemaCode=" + $scope.appCenterCode + "&IsMobile=true";
            commonJS.OpenBizObjectUrl($scope, $scope.worksheetUrl);
        };
        //设置语言
        $scope.getLanguage = function () {
            $scope.LanJson = {
                isShow: config.languages.current.isShow,
                personTotal: config.languages.current.personTotal,
                search: config.languages.current.report.search,
                ProcessName: config.languages.current.report.ProcessName,
                WorkFlow: config.languages.current.report.WorkFlow,
                Originator: config.languages.current.report.Originator,
                StartTime: config.languages.current.report.StartTime,
                EndTime: config.languages.current.report.EndTime,
                sLengthMenu: config.languages.current.report.sLengthMenu,
                sZeroRecords: config.languages.current.report.sZeroRecords_NoRecords,
                sInfo: config.languages.current.report.sInfo,
                sProcessing: config.languages.current.report.sProcessing,
                UnfinishedText: config.languages.current.report.Unfinished,
                FinishedText: config.languages.current.report.Finished,
                CanceledText: config.languages.current.report.Canceled,
                UnspecifiedText: config.languages.current.report.Unspecified,
                ConditionColumns: config.languages.current.ConditionColumns,
                areaError: config.languages.current.Filter.areaError,
                Time: config.languages.current.Time,
                //权限
                QueryInstanceByProperty_NotEnoughAuth1: config.languages.current.report.QueryInstanceByProperty_NotEnoughAuth1,
                QueryInstanceByProperty_NotEnoughAuth2: config.languages.current.report.QueryInstanceByProperty_NotEnoughAuth2,
                QueryInstanceByProperty_NotEnoughAuth3: config.languages.current.report.QueryInstanceByProperty_NotEnoughAuth3,
            }
        }
        $scope.getLanguage();
        //用户控件
        $scope.UserOptions = {
            Editable: true, Visiable: true, OrgUnitVisible: true, V: $scope.Originator, IsMultiple: true, PlaceHolder: $scope.LanJson.Originator
        }

        $scope.options = function () {
            // 设置信息
            $scope.setting = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.Setting')) ||
                {
                    autoLogin: config.defaultAutoLogin, // 是否自动登录
                    serviceUrl: config.defaultServiceUrl, // 服务地址
                    httpUrl: '', //http请求地址
                    workItemUrl: '', // 打开待办的URL地址
                    startInstanceUrl: '', // 发起流程的链接
                    instanceSheetUrl: '', // 打开在办流程的链接
                    uploadImageUrl: '', // 图片上传URL
                    tempImageUrl: '' // 图片存放路径
                };
            var ionic = {
                $scope: $scope,
                $compile: $compile
            }
            var option = {
                SourceCode: $stateParams.ReportCode,
                //PortalRoot: $scope.setting.httpUrl,
                //TableShowObj: $("#ReportView"),
                //dParamShowObj: $("#ParamContent"),
                ReportFiters: $scope.popover.$el.find("ion-content").find("div").eq(0),
                //ReportPage: $("#ReportPage"),
                Ionic: ionic

            }
            return option;
        }
        $scope.ReportstateUser = function (event) {
            window.console.log("ReportstateUser");
            $scope.currentSheetUserId = event.currentTarget.id;
            if ($scope.filters[event.currentTarget.id] == null) {
                $scope.filters[event.currentTarget.id] = [];
            }
            for (var a in $scope.filters) {
                if (a == event.currentTarget.id) {
                    $rootScope.filterUsers = $scope.filters[a];
                    break;
                }
            }

            var dataOrgUnitVisible = $('.' + $scope.SchemaCode + ' #queryListFilter').find('div#' + event.currentTarget.id).attr('data-OrgUnitVisible');
            var dataUserVisible = $('.' + $scope.SchemaCode + ' #queryListFilter').find('div#' + event.currentTarget.id).attr('data-UserVisible');
            $rootScope.queryListFilter = {};
            if (dataOrgUnitVisible == "true" && dataUserVisible == "false") {
                $rootScope.queryListFilter.selecFlag = "O";
                $rootScope.queryListFilter.loadOptions = "o=O";
                $rootScope.queryListFilter.OrgUnitVisible = true;
                $rootScope.queryListFilter.UserVisible = false;
            }
            if (dataOrgUnitVisible == "false" && dataUserVisible == "true") {
                $rootScope.queryListFilter.selecFlag = "U";
                $rootScope.queryListFilter.loadOptions = "o=U";
                $rootScope.queryListFilter.UserVisible = true;
                $rootScope.queryListFilter.OrgUnitVisible = false;
            }
            if (dataOrgUnitVisible == "true" && dataUserVisible == "true") {
                $rootScope.queryListFilter.selecFlag = "OU";
                $rootScope.queryListFilter.loadOptions = "o=OU";
                $rootScope.queryListFilter.OrgUnitVisible = true;
                $rootScope.queryListFilter.UserVisible = true;
            }
            $state.go("sheetUser", { displayName: $(event.target).find(".menu-bar-left").text(), isQueryList: true });//跳转带标题参数
            $scope.filterFlag = true;//判断是否点击过选人控件
            $scope.popover.hide();
        };

        $scope.initItemsCode = function (users) {
            var objs = [];
            if (users && !angular.equals({}, users)) {
                if (users.constructor == Object) {
                    var tempUser = users.Code;
                    objs.push(tempUser);
                } else {
                    users.forEach(function (n, i) {
                        var tempUser = n.Code;
                        objs.push(tempUser);
                    });
                }
            }
            return objs;
        };
        $scope.map = function (key, value) {
            $scope.filters[key] = value;
        }
        $scope.filterValues = {};
        $scope.checkBoxChange = function (event) {
            /*****
            **autor：tll 2018-0206
            *筛选的多选：样式切换和获取选中的值的转换
            *以点击事件切换和data-id索引,data-value为值，不然会报错
            ****/
            var PropertyCode = $(event.target).parents(".item-checkbox").data("id");
            var val = $(event.target).parents(".item-checkbox").data("value");
            var intCheck = $scope.filterValues[PropertyCode].indexOf(";") < 0 || $scope.filterValues[PropertyCode] == "" ? $scope.filterValues[PropertyCode] : $scope.filterValues[PropertyCode].split(";");
            if (event.target.checked) {//选中
                $(event.target).parent().next()
                    .css("background", '#e9f3fe')
                    .css("border", 'none')
                    .css("color", '#77BCFA');
                if (intCheck != "" && intCheck.length > 0 && angular.isArray(intCheck)) {//多数据
                    //数组去重
                    var attr = "";
                    for (var i = 0; i < intCheck.length; i++) {
                        // console.log(intCheck[i]);
                        if (intCheck[i] != val) {
                            attr = intCheck[i] + ";" + attr;
                        }
                    }
                    attr = val + ";" + attr;
                    attr = attr.substring(0, attr.length - 1);
                    $scope.filterValues[PropertyCode] = attr;

                }
                if (intCheck == "" && !angular.isArray(intCheck)) {//0数据
                    $scope.filterValues[PropertyCode] = val;
                }
                if (intCheck != "" && intCheck.length > 0 && !angular.isArray(intCheck)) {//1数据
                    $scope.filterValues[PropertyCode] = val + ";" + intCheck;
                }

            }
            else {//取消选中
                $(event.target).parent().next()
                    .css("background", '#fff')
                    .css("border", '1px solid #cccccc')
                    .css("color", '#797F89');
                if (intCheck != "" && intCheck.length > 0 && angular.isArray(intCheck)) {//多数据
                    var attr = "";
                    for (var i = 0; i < intCheck.length; i++) {
                        if (intCheck[i] != val) {
                            attr = intCheck[i] + ";" + attr;
                        }
                    }
                    attr = attr.substring(0, attr.length - 1);
                    $scope.filterValues[PropertyCode] = attr;
                }
                if (intCheck != "" && intCheck.length > 0 && !angular.isArray(intCheck)) {//1数据
                    $scope.filterValues[PropertyCode] = "";
                }
            }
        }
        //隐藏报表过滤条件页面
        $scope.hideFilterReport = function () {
            commonJS.loadingShow();
            //延时2秒，解决，有时候控件的change事件执行比确定按钮click事件时间慢
            setTimeout(function () {
                var url = "";
                var isJsonp = false;
                var params = {
                    SchemaCode: $stateParams.SchemaCode,
                    QueryCode: $stateParams.QueryCode,
                    InputMapping: {},
                    PageSize: 10,
                    NextPageIndex: 0,
                    Filters: $scope.filterValues
                };
                console.log("zuizhong....");
                console.log($scope.filterValues);
                url = $scope.setting.httpUrl + "/BizQueryHandler/BizQueryHandler";
                if (window.cordova) {
                    url = $scope.setting.appServiceUrl + "/GetQuerySettingAndData?callback=JSON_CALLBACK";
                    url += '&mobileToken=' + $scope.user.MobileToken;
                    url += '&userCode=' + $scope.user.Code;
                    url += '&SchemaCode=' + $stateParams.SchemaCode;
                    url += '&QueryCode=' + $stateParams.QueryCode;
                    url += '&InputMapping=';
                    url += '&PageSize=' + params.PageSize;
                    url += '&NextPageIndex=' + params.NextPageIndex;
                    if (JSON.stringify(params.Filters) != undefined) {
                        url += '&Filters=' + JSON.stringify(params.Filters);
                    } else {
                        url += '&Filters=';
                    }
                    isJsonp = true;
                } else {
                    params.Action = "NewGetQuerySettingAndData";
                }
                instanceService.loadInstances(url, params, isJsonp).then(function (result) {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $scope.BindData(result, true);
                }).finally(function () {
                    $scope.popover.hide();
                    if (typeof fn == "function") {
                        fn();//应用中心回调函数
                    }
                });
            }, 0)

        }
        $scope.resetReportSearch = function () {

            var container = $(".sideSlip." + $scope.SchemaCode);

            if (container.find('#queryListFilter').find('input')) {
                //input框全部清空
                container.find('#queryListFilter').find('input').val('');
                container.find('#queryListFilter').find('input').change();
            }
            //日期清空显示
            if (container.find('#queryListFilter').find('span.showdate')) {
                container.find('#queryListFilter').find('span.showdate').text('');
                container.find('#queryListFilter').find('span.showdate').trigger("DOMSubtreeModified");

            }
            if (container.find('#queryListFilter').find('input.mydatetimepicker')) {
                container.find('#queryListFilter').find('input.mydatetimepicker').val('');
                container.find('#queryListFilter').find('input.mydatetimepicker').change();
            }

            //单选
            if (container.find('#queryListFilter').find('input:radio')) {
                container.find('#queryListFilter').find('input:radio').removeAttr('checked');
                container.find('#queryListFilter').find('input:radio').change();
            }
            //多选
            if (container.find('#queryListFilter').find('input:checkbox')) {
                var len = container.find('#queryListFilter').find('input:checkbox').length;
                var target = container.find('#queryListFilter').find('input:checkbox');
                for (var i = 0; i < len; i++) {
                    if (target[i].checked) {
                        target[i].checked = false;
                        $(target[i]).parent().next()
                          .css("background", '#fff')
                          .css("border", '1px solid #cccccc')
                          .css("color", '#797F89');
                    }
                }
            }
            //选人清空显示
            container.find('#queryListFilter').find('.sheetuserflag').find(".ion-chevron-right").prev("span").html("");
            $scope.filterValues = searchBeforefilters;
            //强制制空，包括默认值
            for (var item in searchBeforefilters) {
                console.log(item);
                if ($scope.filterValues[item]) {
                    $scope.filterValues[item] = "";//制空
                    console.log($scope.filterValues[item]);
                }
                //制空选人控件数据
                if ($scope.filters[item]) { $scope.filters[item] = []; }
            }
            $scope.BindData($scope.searchBefore, true);;//清空则取存储第一次请求数据
        }
    }]);