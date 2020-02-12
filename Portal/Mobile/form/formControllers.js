var formModule = angular.module('formApp.controllers', [])
// 全局Controller
.controller("mainCtrl", function ($rootScope, $scope, $state, $compile, $http, $ionicPopup, $timeout, fcommonJS) {
    $rootScope.PortalRoot = $.MvcSheetUI.PortalRoot;//根目录

    $rootScope.dingMobile = {
        isDingMobile: false,                             //是否钉钉移动端，如果是钉钉移动端，需要隐藏当前header，重写钉钉APP Header
        dingHeaderClass: "has-header",                   //隐藏header后 subHeader ion-content需要修改相关样式
        dingSubHeaderClass: "has-header has-subheader",  //隐藏header后 subHeader ion-content需要修改相关样式
        hideHeader: false,                                //是否需要隐藏当前Header
        hideOther: true,//钉钉微信共同需要隐藏的
    }
    // ios上下拉将整个网页上下拉
    if (ionic.Platform.isIOS()) {
        $('body').on('touchmove', function (e) {
            e.preventDefault();
        });
    }
    //ios表单禁止底部按钮滚动
    if (ionic.Platform.isIOS()) {
        dd.ready(function () {
            dd.ui.webViewBounce.disable();
        })
    }

    stop_browser_behavior: false
    self.touchStart = function (e) {
        self.startCoordinates = getPointerCoordinates(e);
        if (ionic.tap.ignoreScrollStart(e)) {
            return;
        }
        if (ionic.tap.containsOrIsTextInput(e.target)) {
            // do not start if the target is a text input
            // if there is a touchmove on this input, then we can start the scroll
            self.__hasStarted = false;
            return;
        }
        self.__isSelectable = true;
        self.__enableScrollY = true;
        self.__hasStarted = true;
        self.doTouchStart(e.touches, e.timeStamp);
        e.preventDefault();
    };



    //判断是否钉钉移动端
    $scope.GetDingMobile = function () {
        var loginfrom = "";
        var source = "";
        var reg = new RegExp("(^|&)loginfrom=([^&]*)(&|$)");
        var r = top.window.location.search.substr(1).match(reg);
        if (r != null) loginfrom = unescape(r[2]);

        reg = new RegExp("(^|&)source=([^&]*)(&|$)");
        r = top.window.location.search.substr(1).match(reg);
        if (r != null) source = unescape(r[2]);
        $rootScope.source = source;
        if ($rootScope.source == "message" && loginfrom == "dingtalk" && dd && dd.version) {
            $rootScope.dingMobile.isDingMobile = true;
            $rootScope.dingMobile.dingHeaderClass = "";
            $rootScope.dingMobile.dingSubHeaderClass = "has-subheader";
            $rootScope.dingMobile.hideHeader = true;
            //钉钉打开消息返回 测试只对android有效
            document.addEventListener('backbutton', function () {
                if ($state.current.name == "form.detail" && loginfrom == "dingtalk" && dd) {
                    dd.biz.navigation.close({});
                }
            });
        }
        if (dd && dd.version) {
            //if (loginfrom == "dingtalk" && dd && dd.version) {
            $rootScope.dingMobile.isDingMobile = true;
            $rootScope.dingMobile.dingHeaderClass = "";
            $rootScope.dingMobile.dingSubHeaderClass = "has-subheader";
            $rootScope.dingMobile.hideHeader = true;
            $rootScope.loginfrom = "dingtalk";
        } else if (loginfrom == "app") {
            $rootScope.loginfrom = "app";
        } else if (loginfrom == "wechat") {
            $rootScope.loginfrom = "wechat";
        }
    }
    $scope.GetDingMobile();
    $scope.SetDingDingHeader = function (title) {
        //设置Header标题
        if (dd) {
            dd.biz.navigation.setTitle({
                title: title ? title : "",//控制标题文本，空字符串表示显示默认文本
                onSuccess: function (result) { },
                onFail: function (err) {
                    alert(err);
                }
            });
        }
    }

    // 移动端重写alert方法
    window.alert = function (msg, callback) {
        if (msg.length >= 256) {
            msg = msg.substr(0, 256) + "...";
        }
        if (!callback) {
            var myPopup = $ionicPopup.show({
                cssClass: 'bpm-sheet-alert',
                template: '<span class="">' + msg + '<span>'
            });

            $timeout(function () {
                myPopup.close();
            }, 1500);
        }
        else {
            $ionicPopup.show({
                cssClass: 'bpm-sheet-confirm',
                template: '<span class="bpm-sheet-confirm">' + msg + '<span>',
                buttons: [{
                    text: '确定',
                    type: 'button-clear',
                    onTap: function (e) {
                        callback();
                    }
                }]
            });
        }
    }
    //微信表单返回逻辑参数
    $rootScope.orgIndex = window.history.length;
})

.controller("formSheetCtrl", function ($rootScope, $scope, $state, $timeout, $compile, $http, $ionicPopup, $ionicPlatform, $ionicTabsDelegate, $cordovaDevice, $cordovaAppVersion, $cordovaNetwork, $ionicScrollDelegate, $ionicActionSheet, $ionicHistory, $ionicModal, fcommonJS, $ionicPopover, httpService, $stateParams) {

    //flowStatus下载完毕执行的函数
    $scope.flowStatusLoaded = function () {
        $(".flowDetails").appendTo($(".flowDetails").closest(".scroll"));
    }

    //PC端html内容
    var _ChildNodes = document.getElementById("content-wrapper").childNodes;
    //内容放置滚动div内，否则不能上下滚动
    $("#mobile-content").find("div.scroll").prepend(_ChildNodes);
    //支持移动端滚动
    $(_ChildNodes).css("overflow", "hidden");

    //移动端流程状态
    console.log(_PORTALROOT_GLOBAL);
    $scope.portalroot = _PORTALROOT_GLOBAL;
    $scope.instanceInfo = {};
    $scope.showMoreInfo = false;
    $scope.showHide = function () {
        $scope.showMoreInfo = !$scope.showMoreInfo;
        $ionicScrollDelegate.resize();
        if ($scope.showMoreInfo) {
            $ionicScrollDelegate.scrollBottom();
        }
    }
    $scope.showCirculate = true;
    $scope.showCirculateHide = function () {
        $scope.showCirculate = !$scope.showCirculate;

    }

    $scope.MbItemClick = function () {
        var _that = this;
        var fileUrl = this.achment == undefined ? undefined : this.achment.Url;
        var buttons = [
              { text: SheetLanguages.Current.Preview, code: 'Preview' }
        ];
        var hideSheet = $.MvcSheetUI.IonicFramework.$ionicActionSheet.show({
            buttons: buttons,
            titleText: SheetLanguages.Current.AttachmentAction,
            cancelText: SheetLanguages.Current.Cancel,
            buttonClicked: function (index, button) {
                if (button.code == "Preview") {
                    $.LoadingMask.Show(SheetLanguages.Current.Loading);
                    var url = window.location.href;
                    url = url.split(_PORTALROOT_GLOBAL)[0];
                    if ($.MvcSheetUI.IonicFramework.$rootScope.loginfrom == "dingtalk" && dd) {
                        dd.biz.util.openLink({
                            url: url + fileUrl,
                            onSuccess: function (result) { },
                            onFail: function (err) { }
                        });
                    } else {
                        //app,wechat,mobile
                        $.ajax({
                            type: "POST",
                            url: url + fileUrl + "&AppLogin=true",
                            success: function (data) {
                                //支持的格式
                                var SupportFileExtension = ".jpg,.gif,.jpeg,.png,.txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.xml";
                                if (SupportFileExtension.indexOf(data.Extension) > -1) {
                                    $.MvcSheetUI.IonicFramework.$rootScope.AttachmentUrl = data.Url;
                                    $.MvcSheetUI.IonicFramework.$state.go("form.downLoadFile", { extension: data.Extension })
                                } else {
                                    $.MvcSheetUI.IonicFramework.fcommonJS.loadingShow(SheetLanguages.Current.NotSupportExtension);
                                }
                            }
                        });
                    }
                }
                return true;
            }
        });
    }

    //随机头像颜色
    $scope.getRandom = function () {
        var num = Math.floor(Math.random() * 4);
        return num;
    };
    $scope.randomNumbers = [];
    for (var i = 0; i < 5; i++) {
        $scope.randomNumbers.push($scope.getRandom());
    }
    console.log($scope.randomNumbers[0]);

    //在移动端删除PC框架
    $("div[id*=sheetContent]:first").remove();

    //$("div.row").removeClass("row").addClass("list");
    //add by luwei : 将一行多列的全部转换成一行两列的
    //TODO 只能处理偶数列且必须按照label-value的顺序排列
    $("div.row").each(function () {
        //可能有合并单元格的操作 colspan可以是任何值[234]hxc
        if ($(this).find('[colspan]').length != 0) {
            var nodes = $(this).find('[data-type]');
            var filternodes = nodes.filter(function (index) {
                if ($(nodes[index]).parents('[data-type="SheetGridView"]').length != 0) {
                    return false;
                } else {
                    return true;
                }
            });
            $(this).empty();
            for (var i = 0; i < filternodes.length; i++) {
                var classString = '';
                if (i % 2 == 0) {
                    classString = 'col-md-2';
                } else {
                    classString = 'col-md-10';
                }
                $(this).append($("<div></div>").addClass(classString).append(nodes[i]));
            }
        }
        $(this).removeClass("row").addClass("list");

        var rowSelf = $(this);
        var childrenLen = $(this).children().length;

        var emptyRow = $(this).clone().empty();

        $(this).children().each(function (index, element) {
            var bootstrapClass = $(this).attr("class");
            var isFirstCol = index % 2 == 0;
            var indexOfLastDash = bootstrapClass.lastIndexOf("-");
            var prefix = bootstrapClass.substring(0, indexOfLastDash + 1);
            var newClass = isFirstCol ? prefix + "2" : prefix + "10";
            if (bootstrapClass.indexOf("col-") > -1) { //包含栅栏样式
                var classArray = bootstrapClass.split(" ");
                for (x in classArray) {
                    if (classArray[x].indexOf("col-") > -1) {
                        $(this).removeClass(classArray[x]);
                        break;
                    }
                }
                $(this).addClass(newClass);
                emptyRow.append($(this));
                if (!isFirstCol || $(this).find('[data-type]').attr('data-type') !== "SheetLabel") {
                    rowSelf.before(emptyRow);
                    emptyRow = emptyRow.clone().empty()
                } else if (isFirstCol && childrenLen - 1 == index) {
                    //FIXME 奇数列的处理
                    //rowSelf.after(emptyRow);
                    //emptyRow = emptyRow.clone().empty()
                }
            } else {
                return true;
            }
        });
        rowSelf.remove();
    });
    //传入ionic 服务
    $.MvcSheetUI.IonicFramework = {
        $rootScope: $rootScope,
        $scope: $scope,
        $state: $state,
        $timeout: $timeout,
        $compile: $compile,
        $ionicActionSheet: $ionicActionSheet,
        $ionicScrollDelegate: $ionicScrollDelegate,
        $compile: $compile,
        $ionicPopup: $ionicPopup,
        $ionicModal: $ionicModal,
        fcommonJS: fcommonJS,
        $ionicPopover: $ionicPopover//单选多选效果改为侧滑
    }
    //执行入口
    $.MvcSheet.Init(function () {
        try {
            //Header 标题
            var _InstanceTitle = "";
            if ($("#lblTitle").html()) {
                _InstanceTitle = $("#lblTitle").html();//表单设置标题
            } else {
                _InstanceTitle = $.MvcSheetUI.SheetInfo.BizObject.DataItems["Sheet__DisplayName"].V;
            }

            $rootScope.InstanceId = $.MvcSheetUI.SheetInfo.InstanceId;
            $rootScope.SheetMode = $.MvcSheetUI.SheetInfo.SheetMode;
            $rootScope.WorkflowCode = $.MvcSheetUI.SheetInfo.WorkflowCode;
            $rootScope.WorkflowVersion = $.MvcSheetUI.SheetInfo.WorkflowVersion;
            $rootScope.InstanceTitle = _InstanceTitle;

            //没有WorkflowCode为空，不显示流程图和流程详情还有审批意见
            if (!$.MvcSheetUI.SheetInfo.WorkflowCode) {
                $(".flowDetails").hide();
            }


            //异步 enter.view处罚时，InstanceTitle可能还没准备好
            if ($rootScope.dingMobile.isDingMobile && dd) {
                $scope.SetDingDingHeader($rootScope.InstanceTitle);
                //设置header 右边按钮
                dd.biz.navigation.setRight({
                    show: false
                });
            }

            //标签名中英文切换
            $rootScope.names = {
                Back: SheetLanguages.Current.Back,
                Spread: SheetLanguages.Current.Spread,
                Retract: SheetLanguages.Current.Retract,
                WorkflowCharts: SheetLanguages.Current.WorkflowCharts,
                Close: SheetLanguages.Current.Close,
                OK: SheetLanguages.Current.OK,
                Reset: SheetLanguages.Current.Reset,
                SelectAll: SheetLanguages.Current.SelectAll,
                UnselectAll: SheetLanguages.Current.UnselectAll,
                Search: SheetLanguages.Current.Search,
                Day: SheetLanguages.Current.Day,
                Hour: SheetLanguages.Current.Hour,
                Minute: SheetLanguages.Current.Minute,
                Second: SheetLanguages.Current.Second,
                State: SheetLanguages.Current.State,
                SheetUser: SheetLanguages.Current.SheetUser,
                Approve: SheetLanguages.Current.Approver,
                Waiting: SheetLanguages.Current.Waiting,
                Confirm: SheetLanguages.Current.Confirm,
                PleaseSelect: SheetLanguages.Current.PleaseSelect,
                Query: SheetLanguages.Current.Query,
                AssociatedSheet: SheetLanguages.Current.AssociatedSheet,
                States: SheetLanguages.Current.States,
                Cancel: SheetLanguages.Current.Cancel,
                userSelector: SheetLanguages.Current.SheetUser.userSelector,
                AppendixPreview: SheetLanguages.Current.AppendixPreview,
                noComment: SheetLanguages.Current.noComment,
                noSignatrue: SheetLanguages.Current.noSignatrue,
                ClickImageDelete: SheetLanguages.Current.ClickImageDelete
            };
            console.log($rootScope.names);


            //修改样式为每个item加上下划线
            $("#masterContent_divContent .list>div.item").addClass('hasBorderBottom');
            $(".attachment.item").removeClass("hasBorderBottom");
            $(".slider-slides .item").removeClass("hasBorderBottom");
            $(".SheetGridView").addClass('hasBorderBottom');
            $(".SignaturePanel").addClass("hasBorderBottom");
            $(".InputPanel").addClass("hasBorderBottom");
            $("label[data-type ='input-label']").addClass("selectable");//允许复制
            $("span[class='input-label']").addClass("selectable");//允许复制
            $(".selectable").bind("touchstart", function (e) { e.stopPropagation(); }).bind("touchmove", function (e) { e.stopPropagation(); })//允许复制



            //流程状态初始化
            console.log($rootScope.InstanceId);
            httpService.get(_PORTALROOT_GLOBAL + '/wechat/LoadInstanceState', { instanceID: $rootScope.InstanceId }).then(function (res) {
                console.log(res);
                if (res.SUCCESS == true) {
                    $scope.instanceInfo.BaseInfo = res.BaseInfo;
                    if (res.BaseInfo.Approvers.length > 2) {
                        $scope.instanceInfo.BaseInfo.Approvers = res.BaseInfo.Approvers.slice(0, 2).join(',') + '...';
                    }
                    else {
                        $scope.instanceInfo.BaseInfo.Approvers = res.BaseInfo.Approvers.join(',');
                    }
                    $scope.instanceInfo.InstanceLogInfo = res.InstanceLogInfo;

                } else {
                    $scope.instanceInfo = false;
                    //当用户没有访问权限的时候跳到首页
                    if (res.Message != undefined && res.Message != "" && res.Message != null) {
                        window.location.href = $.MvcSheetUI.PortalRoot + "/Mobile/index.html";
                    }
                }

            }, function (reason) {
                fcommonJS.showShortTop(reason);
            });
        } catch (e) { }
    });
    //打开流程图
    $scope.openFlowChart = function (e) {
        $state.go("form.instancestate", { Mode: $rootScope.SheetMode, InstanceID: $rootScope.InstanceId, WorkflowCode: $rootScope.WorkflowCode, WorkflowVersion: $rootScope.WorkflowVersion });
    }

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.fetchUserSelect) {
            $rootScope.fetchUserSelect.ClearChoices();
            $rootScope.fetchUserSelect.SetValue("");
        }
        if ($rootScope.dingMobile.isDingMobile && dd) {
            $scope.SetDingDingHeader($rootScope.InstanceTitle);
            //设置header 右边按钮
            dd.biz.navigation.setRight({
                show: false
            });
            //ios的消息返回
            dd.biz.navigation.setLeft({
                text: $rootScope.names.SheetUser.Back,
                control: true,
                onSuccess: function (result) {
                    if ($state.current.name == "form.detail") {
                        dd.biz.navigation.close({});
                    } else {
                        $ionicHistory.goBack();
                    }
                },
                onFail: function (err) { }
            });
        }
    });
    //SheetUser完成事件
    $rootScope.$on('sheetUserFinished', function (event, data) {
        if (data.dataField == "fetchUserSelect") {
            var ngmodel = data.dataField;
            var the = $scope[ngmodel];
            if (!the) return;
            the.ClearChoices();
            the.SetValue(data.obj);
            var tagName = ngmodel;
            if (tagName.indexOf('.') > -1) {
                tagName = tagName.replace('.', '_');
            }
            $scope["sheetUsers" + tagName] = data.SelectItems;
        } else {
            var ngmodel = data.dataField + data.rowNum;
            var the = $scope[ngmodel];
            the.ClearChoices();
            the.SetValue(data.obj);
        }
    });

    //表单上的返回按钮
    $scope.ClosePage = function () {
        if ($rootScope.dingMobile.isDingMobile) {
            //钉钉的已隐藏
        } else if (typeof (WeixinJSBridge) != "undefined") {
            //微信关闭
            if ($rootScope.source == "message") {
                WeixinJSBridge.call("closeWindow");
            } else {
                //var goIndex = $rootScope.orgIndex - window.history.length - 1;
                //window.history.go(goIndex);
                //处理微信附件返回无效，采用app返回方法
                var state = fcommonJS.getUrlParam("sourceUrl");
                var destUrl = $.MvcSheetUI.PortalRoot + "/Mobile/index.html?reloadData=true";
                if (state) {
                    destUrl += "#" + state;
                }
                window.location.href = destUrl;
            }
        } else {
            //app关闭
            var state = fcommonJS.getUrlParam("sourceUrl");
            var destUrl = $.MvcSheetUI.PortalRoot + "/Mobile/index.html?reloadData=true";
            if (state) {
                destUrl += "#" + state;
            }
            window.location.href = destUrl;
        }
    }
})
    //选人控件
    .controller('sheetUserCtrl', function ($http,$rootScope, $scope, $ionicActionSheet, $state, $stateParams, $ionicBackdrop, $timeout, $ionicModal, $ionicSideMenuDelegate, $ionicHistory, sheetUserService, $ionicScrollDelegate) {
        $scope.sheetUserHandler = "SheetUser/LoadOrgTreeNodes";
      //  $scope.SelectFormStructure = !($.MvcSheetUI.sheetUserParams.loadOptions.indexOf("RootUnitID") < 0 && $.MvcSheetUI.sheetUserParams.options.UserVisible && $.MvcSheetUI.sheetUserParams.loadOptions.indexOf("VisibleUnits") < 0);
        $scope.SelectFormStructure = true;
        $scope.init = function () {
            $scope.UserOUMembers = [];//所在部门人员
            $scope.Organizations = []; //部门成员
            $scope.deptNav = [];  //导航数据项  { id;"",name:"",index:""}
            $scope.showDeptID = "";//当前部门id
            $scope.CacheData = {};//缓存数据
            $scope.SelectItems = [];//已选
            $scope.checkedstetus = false;//全选
            //搜索相关
            $scope.searchKey = "";
            $scope.SearchMode = false;
            $scope.searchedKeys = [];
            $scope.searchItems = [];//搜索结果
            $scope.searchedItems = [];//搜索缓存数据
            //搜索展示人员还是部门
            $scope.SearchEmp = false;
            $scope.SearchDep = false;
            //是否进行过搜索标记
            $scope.searchOver = false;
            $scope.currentTab = "orgTab";
            $scope.perfectMatch = false;

        };
        $scope.$on("$ionicView.enter", function (scopes, states) {
            $scope.sheetUserParams = $.MvcSheetUI.sheetUserParams;
            // $scope.sheetUserParams.isMutiple = false;
            // console.log($scope.sheetUserParams, 'scope.sheetUserParams');
           // $scope.ShowCurrentDept = $scope.sheetUserParams.loadOptions.indexOf("RootUnitID") < 0 && $scope.sheetUserParams.options.UserVisible && $scope.sheetUserParams.loadOptions.indexOf("VisibleUnits") < 0;
            $scope.ShowCurrentDept = false;
            $scope.init();
            $scope.SelectItems = sheetUserService.initItems($scope.sheetUserParams.initUsers);
            //设置已选-从组织架构中选择
            $scope.selectedName = sheetUserService.getSelectedName($scope.SelectItems);
            $scope.initHistoryUser();
            $scope.frequentUserShow = true;
            $(".MvcPopover2 .title").css("left","59px")
           // $scope.InitOUMembers();
            
           // if (!$scope.ShowCurrentDept) {
                $scope.SelectStructure(true);
            // } else {
            //     $scope.SelectFormStructure = false;
            //     $scope.checkedpagestaue();//检测组织页面是否选中
            //     $scope.checkedstetus = true;
            // }
        });

        $scope.showFrequentUsers = function(){
            $scope.frequentUserShow = !$scope.frequentUserShow;
        }
        //初始化本部门人员
        $scope.InitOUMembers = function () {
            //if (!$.MvcSheetUI.SheetInfo.UserOUMembers && $scope.sheetUserParams.options.UserVisible) {
            $.MvcSheetUI.SheetInfo.UserOUMembers = [];
            var parentUnits = $.MvcSheetUI.SheetInfo.DirectParentUnits;
            //update by luxm
            //选人控件进入时设置了UserCodes的情况
            var querystr = $scope.sheetUserParams.loadOptions.replace("&VisibleUnits=", "&V=");
            var UserCodes = '';
            if (querystr) {
                var str = querystr.split('&');
                var strlist = null;
                for (var query in str) {
                    if (str[query].indexOf('UserCodes') != -1) {
                        strlist = str[query].split('=');
                        UserCodes = strlist[1];
                    }
                }
            }
            // console.log("查询字符串" + querystr);
            // console.log(parentUnits, 'parentUnits');
            for (var key in parentUnits) {
                sheetUserService.loadData($scope.sheetUserHandler + "?IsMobile=true&ParentID=" + key + "&o=U&UserCodes=" + UserCodes, null).then(function (res) {
                    //删除虚拟用户
                    for(var i = 0; i < res.length; ++i){
                        if (res[i].ExtendObject && res[i].ExtendObject.IsVirtualUser) {
                            res.splice(i, 1); // 将使后面的元素依次前移，数组长度减1
                            i--; // 如果不减，将漏掉一个元素
                        }
                    }
                    // console.log(res,'InitOUMembers')
                    var filterdata = $.grep(res, function (value) {
                        if (value.ExtendObject.UnitType == "U") {
                            return value;
                        }
                    });
                    $.MvcSheetUI.SheetInfo.UserOUMembers = $.MvcSheetUI.SheetInfo.UserOUMembers.concat(filterdata);
                    //获取所在部门人员
                    $scope.UserOUMembers = sheetUserService.sheetUserAdapter($.MvcSheetUI.SheetInfo.UserOUMembers, $scope.sheetUserParams.selecFlag);
                    //update by luxm
                    //钉钉有缓存会导致计数错误需要初始化
                    checkedUI = 0;
                    checkedNumber = 0;
                    //所在部门设置已选-所在部门
                    $scope.UserOUMembers = sheetUserService.checkItems($scope.UserOUMembers, $scope.SelectItems);
                    angular.forEach($scope.SelectItems, function (obj) {
                        if (obj.type == "G" || obj.type == "O") {
                            checkedUI++;
                        } else {
                            if (obj.type == "U") {
                                checkedNumber++;
                            }
                        }
                    })
                    $scope.countNumber();
                })
            }

        };
        $scope.initHistoryUser = function(){
            $scope.isHistoryList = true;
            var querystr = $scope.sheetUserParams.loadOptions.replace("&VisibleUnits=", "&V=");
            checkedUI = 0;
            checkedNumber = 0;
            $http({
                method: 'get',
                url: "/Portal/SheetUser/getHistoryUnits?"+querystr,
                timeout: 30000
            }).success(function (data) {
                if (data.code==200) {

                    $scope.historyMobileUserList = data.data.user;//历史选人

                    $($scope.historyMobileUserList).each(function(){
                        this.id=this.UnitId;
                        this.name = this.UnitName;
                        this.orgInfo = this.ParentFullName;
                        this.type = "U";

                    })
                    $scope.historyMobileUserList = sheetUserService.checkItems($scope.historyMobileUserList, $scope.SelectItems);


                    angular.forEach($scope.SelectItems, function (obj) {
                        if (obj.type == "G" || obj.type == "O") {
                            checkedUI++;
                        } else {
                            if (obj.type == "U") {
                                checkedNumber++;
                            }
                        }
                    })
                    $scope.countNumber();

                }
            })

        }

        $scope.saveHistoryList = function(item){
            var that = this;
            if(!this.selectChace){
                this.selectChace = [];
            }
            if(Object.prototype.toString.call(item)=="[object Array]"){
                this.selectChace= this.selectChace.concat(item);
            }else {
                this.selectChace.unshift(item);
            }

            clearTimeout(this.saveChaceTimes);
            this.saveChaceTimes = setTimeout(function(){
                var param = {
                    user:[],
                    org:[]
                }
                $(that.selectChace).each(function(){
                    if(this.type=="O"&&$scope.sheetUserParams.selecFlag.indexOf('O')!=-1){
                        param.org.push(this.id);
                    }
                    else if(this.type=="U"&&$scope.sheetUserParams.selecFlag.indexOf('U')!=-1){
                        param.user.push(this.id);
                    }
                })
                param.user = param.user.splice(0,10)
                param.org = param.org.splice(0,10)
                that.selectChace = null;
                $scope.saveHistoryInLocal(param)
            })



        }

        $scope.CancelSearch = function(){
            $scope.searchKey="";
            $scope.SearchMode=false;
        }
        $scope.searchBlur = function(){
            if($scope.searchKey==''){
                $scope.SearchMode=false;
                $scope.focus=false;
            }else{
                $scope.SearchMode=true;
                $scope.focus=true;
            }
        }
        $scope.saveHistoryInLocal = function(param){
            $.ajax({
                type: "post",
                url:"/Portal/SheetUser/saveHistoryUnits",
                contentType:'application/json',
                data: JSON.stringify(param),
                dataType: "json",
                success: function (data) {

                }
            });
        }
        //从组织架构中选择
        $scope.SelectStructure = function (SelectFormStructure) {
            $scope.SelectFormStructure = SelectFormStructure;
            //获取根节点信息
            var querystr = $scope.sheetUserParams.loadOptions.replace("&VisibleUnits=", "&V=");
            sheetUserService.loadData($scope.sheetUserHandler + "?LoadTree=true&Recursive=true&isMobile=true&" + querystr, null).then(function (res) {
                //update by luxm
                if (querystr.indexOf("UserCodes") < 0) {
                    name = res[0].Text;
                    if($scope.deptNav.length==0){
                        var name = "根目录";
                    }
                    $scope.showDeptID = res[0].ObjectID;
                    $scope.deptNav.push({
                        id: res[0].ObjectID,
                        // name: sheetUserService.decrypt(res[0].Text),
                        name: name,
                        pid: "",
                        index: "0"
                    });
                }
            });
            //加载数据
            if ($scope.CacheData[""]) {
                $scope.getCacheData("");
            } else {
                $scope.getData("");
            }
        };
        //
        $scope.itemClick = function (e, org) {

                $scope.addItem(e, org)
            
        };
        $scope.clickDepLine = function(e, org){
            var Percent = e.clientX / screen.availWidth * 100;
            if(org.canSelect&&Percent<30){

                $scope.itemClick(e,org);
            }
            else {
                $scope.clickDep(org);
            }

        }
        $scope.clickDep = function(org){
            if (org.type != "U" && org.root != true && !$scope.SearchMode ) {
                //展开部门
                $ionicScrollDelegate.scrollTop();
                org.checked = !org.checked;
                $scope.deptNav.push({
                    id: org.id,
                    name: org.name,
                    pid: $scope.showDeptID,
                    index: "1"
                });
                $scope.showDeptID = org.id;
                //加载数据
                if ($scope.CacheData[org.id]) {
                    $scope.getCacheData(org.id);
                } else {
                    $scope.getData(org.id)
                }
            } 
        }
        //添加
        $scope.addItem = function (e, item, type) {
            var i = item;
            if (e.target.tagName.toLowerCase() != "input") {
                item.checked = !item.checked;
            }
            if (item.checked) {
                if (!$scope.sheetUserParams.isMutiple) {
                    if (item.type == "U") {
                        checkedNumber++;
                    } else {
                        checkedUI++;
                    }
                    $scope.countNumber();
                    $scope.SelectItems = new Array();
                    $scope.SelectItems.push(i);
                    $scope.sheetUserFinished();
                } else {
                    if (item.type == "U") {
                        checkedNumber++;
                    } else {
                        checkedUI++;
                    }

                    $scope.countNumber(i, type);
                    if (!type) {
                        $scope.SelectItems.push(i);
                    }
                }
                $scope.saveHistoryList(item);
            } else {
                //删除已选
                if (item.type == "U") {
                    checkedNumber>0&&checkedNumber--;
                } else {
                    checkedUI>0&&checkedUI--;
                }
                $scope.countNumber();
                $scope.SelectItems = sheetUserService.removeItem($scope.SelectItems, item);


            }
            $scope.updateChecked(item);
            $scope.initcheckedStetus($scope.Organizations, $scope.SelectItems.length);//改变全选按钮状态
            $scope.selectedName = sheetUserService.getSelectedName($scope.SelectItems);
            if (!$scope.SelectFormStructure) {
                $scope.checkedpagestaue();
            }
            $scope.countNumber();
        };

        $scope.updateChecked = function(item){
            $($scope.Organizations).each(function(){
                if(item.id == this.id)
                {
                    this.checked = item.checked;
                }
            })
            $($scope.historyMobileUserList).each(function(){
                if(item.id == this.id)
                {
                    this.checked = item.checked;
                }
            })

        }
        //删除已选
        $scope.delItem = function (index) {
            var deleteItem = $scope.SelectItems[index];
            if (deleteItem.type == "U") {
                checkedNumber>0&&checkedNumber--;
            } else {
                checkedUI>0&&checkedUI--;
            }
            $scope.countNumber();
            $scope.SelectItems.splice(index, 1);
            //更新当前页面数据
            $scope.Organizations = sheetUserService.deleteSelectItem($scope.Organizations, $scope.SelectItems);
            $scope.UserOUMembers = sheetUserService.deleteSelectItem($scope.UserOUMembers, $scope.SelectItems);
            $scope.SelectItems = sheetUserService.removeItem($scope.SelectItems, deleteItem);
            $scope.selectedName = sheetUserService.getSelectedName($scope.SelectItems);
            $scope.initcheckedStetus($scope.Organizations, $scope.SelectItems.length);//改变全选按钮状态
        };
        //部门导航点击事件
        $scope.navClick = function (deptId, index) {
            $scope.deptNav = $scope.deptNav.slice(0, index + 1);
            //加载数据
            if ($scope.CacheData[deptId]) {
                $scope.getCacheData(deptId);
            } else {
                $scope.getData(deptId);
            }
            $scope.showDeptID = deptId;
        };
        //加载数据
        $scope.getData = function (parentid) {
            // console.log(parentid, 'parentid')
            var querystr = $scope.sheetUserParams.loadOptions.replace("&VisibleUnits=", "&V=");
            sheetUserService.loadData($scope.sheetUserHandler + "?ParentID=" + parentid + "&isMobile=true&" + querystr, null).then(function (res) {
                //删除虚拟用户
                for(var i = 0; i < res.length; ++i){
                    if (res[i].ExtendObject && res[i].ExtendObject.IsVirtualUser) {
                        res.splice(i, 1); // 将使后面的元素依次前移，数组长度减1
                        i--; // 如果不减，将漏掉一个元素
                    }
                }
                // console.log(res, 'getData')
                $scope.Organizations = sheetUserService.sheetUserAdapter(res, $scope.sheetUserParams.selecFlag);

                // console.log($scope.Organizations, '$scope.Organizations')
                //是否加根节点
                //update by luxm
                //如果设置了sheetusercode则不加载组织根节点
                if (parentid == "" && $scope.sheetUserParams.options.RootSelectable &&
                    $scope.sheetUserParams.options.OrgUnitVisible == "true" &&
                    !$scope.sheetUserParams.options.UserCodes) {
                    // console.log($scope.deptNav,'$scope.deptNav')
                    var root = {
                        Icon: "icon-zuzhitubiao",
                        canSelect: true,
                        checked: false,
                        code: $scope.deptNav.length?$scope.deptNav[0].id: '',
                        id: $scope.deptNav.length?$scope.deptNav[0].id: '',
                        name: $scope.deptNav.length?$scope.deptNav[0].name: '',
                        type: "O",
                        root: true
                    };
                  //  $scope.Organizations.unshift(root);
                }
                $scope.checkedstetus = true;//是否全选
                $scope.Organizations = sheetUserService.checkItems($scope.Organizations, $scope.SelectItems);
                $scope.initcheckedStetus($scope.Organizations, $scope.SelectItems.length);//改变全选按钮状态
                // console.log($scope.Organizations, '$scope.Organizations')
                if (parentid == "" && $scope.sheetUserParams.options.RootSelectable && $scope.sheetUserParams.options.OrgUnitVisible == "true") {
                    //update by luxm
                    if (!$scope.sheetUserParams.options.UserCodes) {
                        if($scope.deptNav.length) {
                            $scope.CacheData[$scope.deptNav[0].id] = $scope.Organizations;
                        }
                    }
                } else {
                    $scope.CacheData[parentid] = $scope.Organizations;
                }
                $scope.Orgs = [];
                $scope.Users = [];
                $($scope.Organizations).each(function(){
                    if(this.type=="U"){
                        $scope.Users.push(this)
                    }
                    else {
                        $scope.Orgs.push(this);
                    }
                })
            })
        };
        //加载缓存数据
        $scope.getCacheData = function (deptId) {
            $scope.Organizations = $scope.CacheData[deptId];
            $scope.Organizations = sheetUserService.checkItems($scope.Organizations, $scope.SelectItems);
            $scope.Organizations = sheetUserService.deleteSelectItem($scope.Organizations, $scope.SelectItems);

            $scope.Orgs = [];
            $scope.Users = [];
            $($scope.Organizations).each(function(){
                if(this.type=="U"){
                    $scope.Users.push(this)
                }
                else {
                    $scope.Orgs.push(this);
                }
            })


            $scope.initcheckedStetus($scope.Organizations, $scope.SelectItems.length);//改变全选按钮状态
        }


        //选择完成，回到表单页面
        $scope.sheetUserFinished = function () {

            var objs = sheetUserService.convertItems($scope.SelectItems);
            var rowNum = $scope.sheetUserParams.options.RowNum;
         //   $rootScope.$broadcast("sheetUserFinished", { dataField: $scope.sheetUserParams.dataField, obj: objs, rowNum: rowNum });
            $rootScope.$broadcast("sheetUserFinished", {
                dataField: $scope.sheetUserParams.dataField,
                obj: objs,
                rowNum: rowNum,
                SelectItems: $scope.SelectItems,
                scope: $scope
            });
            $scope.init();
            //update by ouyangsk 因为ionic控件goBack会导致后退循环，故此处改用history.back
            //$ionicHistory.goBack();
            window.history.back();
        };
        //搜索
        $scope.goToSeach = function () {
            $scope.SearchMode = true;
        };
        //清理缓存数据
        $scope.$watch('SearchMode', function (n, o) {
            if (n != true) {
                $scope.searchItems = [];
            }
        })
        //添加
        $scope.addSearchItem = function (e, item) {
            $scope.addItem(e, item);
            if (item.checked) {
                if (!$scope.sheetUserParams.isMutiple) {
                    $scope.closeSearchModal();
                }
            }
        };
        //清除
        $scope.resetSearchKey = function (e) {
            var Percent = e.clientX / screen.availWidth * 100;
            if ($scope.searchKey != "" && Percent > 90) {
                //清除搜索关键词
                $scope.searchKey = "";
            }
        };
        var timer = null;
        $scope.doSearch = function (key,perfectMatch) {
            perfectMatch = perfectMatch || false;
            $timeout.cancel(timer);
            //搜索展示人员还是部门
            $scope.SearchEmp = false;
            $scope.SearchDep = false;
            $scope.searchOver = false;
            if (!key)
                return;
            var cacheKey = key + ($scope.showDeptID || "")+perfectMatch;
            $scope.searchItems = [];
            //查询是否已经缓存
            var isSearched = $scope.searchedKeys.some(function (n) {
                return n === cacheKey;
            });
            //已经缓存，从缓存中获取
            if (isSearched) {
                $scope.searchedItems.forEach(function (currentItem) {
                    if (currentItem.key === cacheKey) {
                        if (currentItem.type == "U") {
                            $scope.SearchEmp = true;
                        }
                        if (currentItem.type == "O" || currentItem.type == "G") {
                            $scope.SearchDep = true;
                        }
                        var text = currentItem.name;
                        var regExp = new RegExp(cacheKey, 'g');
                        var result = text.replace(regExp, '<b class="userSearched">' + cacheKey + '</b>');
                        currentItem.names = result;
                        $scope.searchItems.push(currentItem);
                    }
                });
                $scope.searchItems = sheetUserService.checkItems($scope.searchItems, $scope.SelectItems);
                $scope.searchOver = true;
            } else { //从服务器端获取数据
                //延迟加载数据
                timer = $timeout(function () {
                    $scope.searchedKeys.push(cacheKey);
                    var querystr = $scope.sheetUserParams.loadOptions.replace("&VisibleUnits=", "&V=");
                    var loadUrl = $scope.sheetUserHandler + "?" + querystr+ "&perfectMatch="+perfectMatch;
                    var params = {
                        ParentID: $scope.showDeptID || "",
                        SearchKey: encodeURI(key),
                        IsMobile: true
                    };
                    sheetUserService.loadData(loadUrl, params).then(function (res) {
                        var users = sheetUserService.sheetUserAdapter(res);
                        users.forEach(function (currentItem) {
                            if (currentItem.type == "U") {
                                $scope.SearchEmp = true;
                                if(currentItem.IsVirtualUser == true){
                                    return;
                                }
                            } else if (currentItem.type == "O" || currentItem.type == "G") {
                                $scope.SearchDep = true;
                            }
                            currentItem.key = cacheKey;
                            var text = currentItem.name;
                            var regExp = new RegExp(cacheKey, 'g');
                            var result = text.replace(regExp, '<b class="userSearched">' + cacheKey + '</b>');
                            currentItem.names = result;
                            $scope.searchedItems.push(currentItem)
                            $scope.searchItems.push(currentItem);
                        });
                        $scope.searchItems = sheetUserService.checkItems($scope.searchItems, $scope.SelectItems);
                        $scope.searchOver = true;
                    });
                }, 500);
            }

        };
        //关闭
        $scope.cancel = function () {
            $scope.sheetUserFinished();
            //$(".detail").filter(".item-icon-right").children("span");
        };
        //全选按钮状态
        /*$scope.checkedstetus = true;标识全选按钮不选中
         *objs：当前能选的数据
         *stetus：已经选中的数组的长度
         */
        $scope.initcheckedStetus = function (objs, len) {//$scope.SelectItems.length
            // console.log(objs, len, 'objs----------')
            if ($scope.Organizations.length == 0 || !$scope.SelectFormStructure) {
                objs = $scope.UserOUMembers;
            }
            if (len == 0) {
                $scope.checkedstetus = true;
                return false;
            }
            var going = true;
            angular.forEach(objs, function (obj) {
                if (going) {
                    if (obj.canSelect && obj.checked) {//已经选中则跳过
                        $scope.checkedstetus = false;
                    } else if (obj.canSelect && !obj.checked) {//能选但是未选中则直接返回
                        $scope.checkedstetus = true;
                        going = false;
                    }
                }
            });
        };
        //用于检测组织结构页面的数据是否选中
        $scope.checkedpagestaue = function () {
            if (!$scope.SelectFormStructure && $scope.SelectItems.length != 0) {//组织结构的页面
                var i = 0;
                angular.forEach($scope.UserOUMembers, function (obj) {
                    var going = true;
                    angular.forEach($scope.SelectItems, function (SelectItem) {
                        if (going) {
                            if (obj.id == SelectItem.id) {//选中
                                i = i + 1;
                                obj.checked = true;
                                going = false;
                            } else {
                                obj.checked = false;
                            }
                        }
                    });
                });
                if (i == $scope.UserOUMembers.length) {
                    $scope.checkedstetus = false;//全选按钮选中
                } else {
                    $scope.checkedstetus = true;//全选按钮B部选中
                }
            } else if (!$scope.SelectFormStructure && $scope.SelectItems.length == 0) {//当没有选中的情况下，相当于要把当前部门取消全选
                $scope.checkedObj($scope.UserOUMembers, false);//取消选中
            }
        }
        //全选
        $scope.checkedObj = function (objs, stetus) {
            $timeout(function () {
                angular.forEach(objs, function (obj) {
                    if (obj.canSelect && stetus) {//选中
                        var i = obj;
                        if (!obj.checked) {//没有选中的要选中
                            obj.checked = true;
                            if (!$scope.sheetUserParams.isMutiple) {//单选
                                $scope.SelectItems = new Array();
                                $scope.SelectItems.push(i);
                                $scope.sheetUserFinished();
                            } else {
                                $scope.SelectItems.push(i);
                            }
                        }
                    } else if (obj.canSelect && !stetus) {
                        obj.checked = false;
                        $scope.SelectItems = sheetUserService.removeItem($scope.SelectItems, obj);
                    }
                });

                angular.forEach($scope.SelectItems, function (obj) {
                    if (obj.type == "G" || obj.type == "O") {
                        checkedUI++;
                    } else {
                        checkedNumber++;
                    }
                })
              //  $scope.checkAllHistory(stetus);


                $scope.countNumber();
            });
        }
        //前端展示已选人的数目
        var checkedNumber = 0;
        //前端展示已选组和部门数
        var checkedUI = 0;
        $scope.checkedAll = function ($event) {
            if ($scope.checkedstetus) {//全选
                if ($scope.Organizations.length == 0 || !$scope.SelectFormStructure) {
                    checkedNumber = 0;
                    checkedUI = 0;
                    $scope.checkedObj($scope.UserOUMembers, true);
                } else {
                    checkedNumber = 0;
                    checkedUI = 0;
                    $scope.checkedObj($scope.Organizations, true);

                    /*angular.forEach($scope.SelectItems,function(obj){
                     if(obj.type=="G" || obj.type=="O"){
                     checkedUI++ ;
                     }else {
                     checkedNumber++;
                     }
                     })
                     $scope.countNumber();*/
                }
                $scope.checkedstetus = false;
            }
            else {
                if ($scope.Organizations.length == 0 || !$scope.SelectFormStructure) {
                    checkedNumber = 0;
                    checkedUI = 0;
                    $scope.checkedObj($scope.UserOUMembers, false);
                    /*angular.forEach($scope.SelectItems,function(obj){
                     if(obj.type=="G" || obj.type=="O"){
                     checkedUI++ ;
                     }else {
                     checkedNumber++;
                     }
                     })
                     $scope.countNumber();*/
                } else {
                    checkedNumber = 0;
                    checkedUI = 0;
                    $scope.checkedObj($scope.Organizations, false);
                    /* angular.forEach($scope.SelectItems,function(obj){
                     if(obj.type=="G" || obj.type=="O"){
                     checkedUI++ ;
                     }else {
                     checkedNumber++;
                     }
                     })
                     $scope.countNumber();*/
                }
                $scope.checkedstetus = true;
            }

            $scope.countNumber();
        };
        $scope.checkAllHistory = function(checked){
            $($scope.historyMobileUserList).each(function(){
                this.checked = checked;
                var self = this;
                var flag = false;
                var index = 0;
                $($scope.SelectItems).each(function(i){
                    if(self.id == this.id){
                        flag = true;
                        index = i;
                    }
                })
                if(checked&&!flag){
                    $scope.SelectItems.push(self);
                }
                if(!checked&&flag){
                    $scope.SelectItems.splice(index,1);
                }
            })

        }
        //update by luxm前端展示选中数量
        $scope.countNumber = function (user, type) {
            var checkedNumber = 0,checkedUI=0;

            if (type) {
                $($scope.historyMobileUserList).each(function () {
                    if (this.type == "U" && this.checked) {
                        checkedNumber++;
                    } else if (this.type !== "U" && this.checked) {
                        checkedUI++;
                    }
                })
            }

            $($scope.SelectItems).each(function(){
                if(this.type == "U"){
                    checkedNumber++;
                }
                else if(this.type=="O")
                {
                    checkedUI++;
                }
            })
            angular.element($('#selectAll').children("span")).remove();
            //update by ouyangsk
            var lang = window.localStorage.getItem('H3.Language') || 'zh_cn';
            if (lang == 'en_us') {
                angular.element($('#selectAll')).append("<span>All(People" + checkedNumber + ",Dept" + checkedUI + ")</span>");
                angular.element($('#confirm')).empty();
                angular.element($('#confirm')).append("OK");
            } else {
                angular.element($('#selectAll')).append("<span>全选(已选" + checkedNumber + "人,部门" + checkedUI + ")</span>");
                angular.element($('#confirm')).empty();
                angular.element($('#confirm')).append("确定");
            }
            $scope.checkedNumber = checkedNumber;
            $scope.checkedUI = checkedUI;
            if (type) {
                $scope.SelectItems.push(user)
            }
        };
        //返回上级组织
        $scope.goBack = function () {
            $ionicScrollDelegate.scrollTop();
            if ($scope.SearchMode) {
                $("input[type='search']").blur();
                $scope.SearchMode = false;
                $scope.searchItems = [];
                $scope.searchKey = "";
                $scope.Organizations = sheetUserService.checkItems($scope.Organizations, $scope.SelectItems);
                $scope.UserOUMembers = sheetUserService.checkItems($scope.UserOUMembers, $scope.SelectItems);

                $scope.Organizations = sheetUserService.deleteSelectItem($scope.Organizations, $scope.SelectItems);
                $scope.UserOUMembers = sheetUserService.deleteSelectItem($scope.UserOUMembers, $scope.SelectItems);
                //update by luxm
                if ($scope.deptNav && $scope.deptNav.length > 0) {
                    var id = $scope.deptNav[$scope.deptNav.length - 1].id;
                    if ($scope.CacheData[id]) {
                        $scope.getCacheData(id);
                    } else {
                        $scope.getData(id);
                    }
                    $scope.showDeptID = id;
                }
                $scope.SearchMode = false;
                return;
            }
            if ($scope.deptNav.length == 0 || ($scope.deptNav.length == 1 && !$scope.ShowCurrentDept)) {
                $scope.sheetUserFinished();
                //update by ouyangsk
                //$ionicHistory.goBack();
            } else {
                $scope.deptNav = $scope.deptNav.slice(0, $scope.deptNav.length - 1);
                if ($scope.deptNav.length == 0) {
                    $scope.SelectFormStructure = false;
                    $scope.checkedpagestaue();//组织结构页面
                } else {
                    var id = $scope.deptNav[$scope.deptNav.length - 1].id;
                    if ($scope.CacheData[id]) {
                        //$scope.Organizations = $scope.CacheData[id];
                        $scope.getCacheData(id);
                    } else {
                        $scope.getData(id);
                    }
                    $scope.showDeptID = id;
                }
            }
            $scope.countNumber();
     };
     $scope.switchTab = function(tabName){
         $scope.currentTab = tabName;
         if(tabName=='advanceSearchTab'){
            $scope.SearchMode=true;
         }
         else
         {
            $scope.SearchMode=false;
         }
     }
 })
   //查询列表
.controller("sheetQueryCtrl", function ($rootScope, $scope, $state, $filter, $stateParams, $http, $ionicActionSheet, $ionicHistory, fcommonJS, $SheetQuery, $sce) {
    console.log($stateParams);
    $scope.choosedObjectId = $stateParams.objectid;
    $scope.inZnShow = $rootScope.names.SheetUser.isShow;
    //查询需要参数
    var sheetQuery = {
        controlManager: {}, //父控件实例
        dataField: "",
        rowNum: "",
        schemaCode: "",
        queryCode: "",
        filter: [],
        inputMappings: "",
        outputMappings: "",
    }
    $scope.OutputMapJson = {};
    $scope.InputMapJson = {};
    $scope.viewModel = [];
    $scope.displayColumns = [];
    $scope.displayFormat = [];
    $scope.columnNames = [];
    $scope.PageSize = 10; //分页数据
    $scope.NextPageIndex = 0; //当前页数，
    $scope.LoadFinished = false; //是否加载完成
    $scope.IsBindInputVlues = false;
    $scope.HasBindFilters = false;

    //初始化参数
    $scope.initParams = function () {
        sheetQuery.dataField = $stateParams.datafield;
        sheetQuery.rowNum = $stateParams.rownum;
        sheetQuery.controlManager = $.MvcSheetUI.GetElement(sheetQuery.dataField, sheetQuery.rowNum).SheetUIManager();
        if (sheetQuery.controlManager) {
            sheetQuery.schemaCode = sheetQuery.controlManager.SchemaCode;
            sheetQuery.queryCode = sheetQuery.controlManager.QueryCode;
            if (sheetQuery.controlManager.InputMappings) {
                sheetQuery.inputMappings = sheetQuery.controlManager.InputMappings;
            }
            if (sheetQuery.controlManager.OutputMappings) {
                sheetQuery.outputMappings = sheetQuery.controlManager.OutputMappings;
            }
        }
    }

    $scope.SetQueryValue = function (item) {
        console.log(item);
        //选中效果
        $scope.choosedObjectId = item.oldItem.ObjectID;
        sheetQuery.controlManager.Element.setAttribute("data-choosedid", $scope.choosedObjectId);
        console.log($scope.OutputMapJson);
        for (var key in $scope.OutputMapJson) {
            if (key == sheetQuery.dataField) {
                var objValue = $scope.OutputMapJson[key];
                var objArry = objValue.split(';');
                if (objArry && objArry.length > 0) {
                    var dataArry = [];
                    for (var j = 0; j < objArry.length; j++) {
                        dataArry[j] = item.oldItem[objArry[j]];
                    }
                    console.log(dataArry);
                    sheetQuery.controlManager.SetValue(dataArry);
                } else {
                    console.log(item.oldItem[$scope.OutputMapJson[key]]);
                    sheetQuery.controlManager.SetValue(item.oldItem[$scope.OutputMapJson[key]])
                }
                //当前控件，直接赋值
                //赋值后自动验证
                try {
                    sheetQuery.controlManager.Validate()
                } catch (e) { }
            } else {
                var e = $.MvcSheetUI.GetElement(key, sheetQuery.rowNum);
                if (e != null && e.data($.MvcSheetUI.SheetIDKey)) {
                    e.SheetUIManager().SetValue(item.oldItem[$scope.OutputMapJson[key]]);
                    if (e.SheetUIManager().Validate) {
                        e.SheetUIManager().Validate();
                    }
                }
            }
        }
        //$ionicHistory.goBack();
    }

    //读取inputmapping映射值
    $scope.GetInputMappings = function () {
        var inputJson = {};
        if ($scope.InputMapJson) {
            for (var key in $scope.InputMapJson) {
                if ($scope.InputMapJson[key])
                    if ($scope.InputMapJson[key].GetValue() !== "") {
                        inputJson[key] = $scope.InputMapJson[key].GetValue();
                    }
            }
        }
        return JSON.stringify(inputJson);
    }
    //处理传入参数映射配置，对应的值是控件的实例
    $scope.InputMappingSetting = function () {
        var mapping = sheetQuery.inputMappings.split(',');
        if (!mapping) { $scope.InputMapJson = null; }
        for (var i = 0; i < mapping.length; i++) {
            var map = mapping[i].split(':');
            var targetDataField = map[0];
            var e = $.MvcSheetUI.GetElement(targetDataField, sheetQuery.rowNum);
            if (e != null) {
                $scope.InputMapJson[map[1]] = e.SheetUIManager();
            }
        }
    }
    //处理映射配置
    $scope.MappingSetting = function () {
        var mapping = sheetQuery.outputMappings.split(',');

        for (var i = 0; i < mapping.length; i++) {
            var map = mapping[i].split(':');
            $scope.OutputMapJson[map[0]] = map[1];
        }
        $scope.InputMappingSetting();
    }

    //初始化参数
    $scope.initParams();
    $scope.MappingSetting();

    $scope.GetDisplayName = function (key) {
        if (!$scope.columnNames) return key;
        return $scope.columnNames[key] || key;
    }

    /// <summary>
    /// 控件类型
    /// </summary>
    $scope.ControlType = {
        /// <summary>
        /// 文本框类型
        /// </summary>
        TextBox: 0,
        /// <summary>
        /// 下拉框类型
        /// </summary>
        DropdownList: 1,
        /// <summary>
        /// 单选框类型
        /// </summary>
        RadioButtonList: 2,
        /// <summary>
        /// 复选框类型
        /// </summary>
        CheckBoxList: 3,
        /// <summary>
        /// 长文本框类型
        /// </summary>
        RichTextBox: 4
    }

    //绑定过滤条件控件
    $scope.BindFilter = function () {
        var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];//系统字段
        $scope.HasBindFilters = true;
        if (!sheetQuery.filter || sheetQuery.filter.length == 0) return;
        $scope.FilterPanelID = $.MvcSheetUI.NewGuid();
        this.FilterPanel = $("#divFilter");
        //添加过滤项
        var ulElement = $("<ul>").addClass("list").appendTo(this.FilterPanel);
        for (var i = 0; i < sheetQuery.filter.length; i++) {
            var filterItem = sheetQuery.filter[i];
            if (!filterItem.Visible) continue; //不可见
            if (filterItem.FilterType == 3) continue; //系统参数

            var defaultVal = filterItem.DefaultValue;
            if (this.InputMapJson[filterItem.PropertyName]) {
                //传入参数
            }
            var liElement = $("<li>").appendTo(ulElement).addClass("item item-input");
            var label = $("<label for='" + $scope.FilterPanelID + filterItem.PropertyName + "'>" + $scope.GetDisplayName(filterItem.PropertyName) + "</label>").addClass("input-label");
            liElement.append(label);
            switch (filterItem.DisplayType) {
                //单选
                case $scope.ControlType.DropdownList:
                case $scope.ControlType.RadioButtonList:
                    var vals = filterItem.SelectedValues.split(";");
                    var contentDiv = $("<div style='display: flex; flex-wrap: wrap;' data-property='" + filterItem.PropertyName + "'data-value='" + filterItem.DisplayType + "'data-ControlType='" + filterItem.DisplayType + "'></div>");
                    for (var j = 0; j < vals.length; j++) {
                        if (vals[j] != "") {
                            var content = $("<div class='cItem'></div>")
                            var newid = $.MvcSheetUI.NewGuid();
                            content.append("<span data-value='" + vals[j] + "'>" + vals[j] + "</span>");
                        }
                        content.unbind("click.jdskfs").bind("click.jdskfs", function ($event) {
                            var c = $($event.target).parent(".cItem");
                            c.siblings(".cItem").removeClass("selected");
                            if (c.hasClass("selected")) {
                                c.removeClass("selected");
                                $(c).parent("[data-property]").attr("data-value", '');
                            } else {
                                c.addClass("selected");
                                $(c).parent("[data-property]").attr("data-value", $.trim($(c).text()));
                            }
                        })
                        contentDiv.append(content);
                    }
                    liElement.append(contentDiv);
                    liElement.append("<br style='clear: both;'></br>");
                    break;

                case $scope.ControlType.CheckBoxList:
                    var vals = filterItem.SelectedValues.split(";");
                    var contentDiv = $("<div style='display: flex; flex-wrap: wrap;' data-property='" + filterItem.PropertyName + "'data-value='" + filterItem.PropertyName + "'data-ControlType='" + $scope.ControlType.CheckBoxList + "'></div>");
                    for (var j = 0; j < vals.length; j++) {
                        if (vals[j] != "") {
                            var content = $("<div class='cItem'></div>");
                            var newid = $.MvcSheetUI.NewGuid();
                            content.append("<span data-value='" + vals[j] + "'>" + vals[j] + "</span>");
                        }
                        content.unbind("click.jdskfs").bind("click.jdskfs", function ($event) {
                            var c = $($event.target).parent(".cItem");
                            if (c.hasClass("selected")) {
                                c.removeClass("selected");
                                $(c).parent("[data-property]").attr("data-value", '');
                            } else {
                                c.addClass("selected");
                                $(c).parent("[data-property]").attr("data-value", $.trim($(c).text()));
                            }
                        })
                        contentDiv.append(content);
                    }
                    liElement.append(contentDiv);
                    liElement.append("<br style='clear: both;'></br>");
                    break;
                default:
                    //Error:文本类型，需要判断FilterType 和 LogicType,日期、数字 范围
                    liElement.append("<input type='text' id='" + $scope.FilterPanelID + filterItem.PropertyName + "' data-property='" + filterItem.PropertyName + "' placeholder='" + $scope.GetDisplayName(filterItem.PropertyName) + "' autocomplete='off'></input>");
                    $("#" + filterItem.PropertyName).val(filterItem.DefaultValue);
                    break;
            }
        }
    }
    //绑定过滤条件的传入数据,显示时
    $scope.BindFilterInputValues = function () {
        $scope.IsBindInputVlues = true;
        for (var i = 0; i < sheetQuery.filter.length; i++) {
            var filterItem = sheetQuery.filter[i];
            if (!filterItem.Visible) continue; //不可见
            if (filterItem.FilterType == 3) continue; //系统参数
            if (!$scope.InputMapJson[filterItem.PropertyName]) continue;
            switch (filterItem.DisplayType) {
                case $scope.ControlType.RadioButtonList:
                case $scope.ControlType.CheckBoxList:
                    $scope.FilterPanel.find("input[name='" + filterItem.PropertyName + "'][value='" + $scope.InputMapJson[filterItem.PropertyName].GetValue() + "']").attr("checked", "checked");
                    break;
                default:
                    $("#" + $scope.FilterPanelID + filterItem.PropertyName).val($scope.InputMapJson[filterItem.PropertyName].GetValue());
                    break;
            }
        }
    }

    //读取过滤数据，查询时
    $scope.GetFilters = function () {
        var filters = {};
        for (var i = 0; i < sheetQuery.filter.length; i++) {
            var filterItem = sheetQuery.filter[i];
            if (!filterItem.Visible) continue; //不可见
            if (filterItem.FilterType == 3) continue; //系统参数
            switch (filterItem.DisplayType) {
                case $scope.ControlType.RadioButtonList:
                case $scope.ControlType.CheckBoxList:
                    if ($scope.FilterPanel.find("input[name='" + filterItem.PropertyName + "']:checked").val()) {
                        filters[filterItem.PropertyName] = $("input[name='" + filterItem.PropertyName + "']:checked").val();
                    }
                    break;
                default:
                    if ($("#" + $scope.FilterPanelID + filterItem.PropertyName).val()) {
                        filters[filterItem.PropertyName] = $("#" + this.FilterPanelID + filterItem.PropertyName).val();
                    }
                    break;
            }
        }
        return JSON.stringify(filters);
    }

    $scope.getPropertyNameFromData = function (bizObject, propertyName) {
        for (var k in bizObject) {
            if (k.toLocaleLowerCase() == propertyName.toLocaleLowerCase()) {
                return k;
            }
        }
    }

    //从后台读取数据后，绑定到前端
    $scope.BindData = function (data) {
        console.log(data);
        var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];//系统字段
        //列显示
        if (data) {
            //需要显示的列
            if (data.QuerySetting) {
                for (var index in data.QuerySetting.Columns) {
                    if (data.QuerySetting.Columns[index].Visible == 1) {
                        $scope.displayColumns.push(data.QuerySetting.Columns[index].PropertyName);
                        $scope.displayFormat.push(data.QuerySetting.Columns[index].DisplayFormat)
                    }
                }
            }
            //列编码和显示名称
            //设置成中文值
            angular.forEach(data.Columns, function (key, val) {
                if (array.indexOf(val) != -1) {
                    data.Columns[key] = SheetLanguages.Current.ConditionColumns[val];
                }
            })

            $scope.columnNames = data.Columns;
            //当前数据项需要显示的字段
            var NameKey = $scope.OutputMapJson[sheetQuery.dataField];
            var tmpArray = [];
            //显示视图
            for (var index in data.QueryData) {
                var itemName;
                var i = 0;
                var d = data.QueryData[index];
                var summary = "";
                for (var key in d) {
                    if ($scope.displayColumns.indexOf(key) > -1) {
                        //if (!NameKey && i == 0) {
                        //    itemName = d[key];
                        //    continue;
                        //} else if (key == NameKey) {
                        //    itemName = d[key];
                        //    continue;
                        //}
                        var val = d[key] == null ? "" : d[key];
                        if (typeof d[key] == "string" && d[key].match(/^\/Date\(\d+\)\/$/g)) {
                            //日期
                            var num = d[key].match(/\d+/)[0];
                            val = $filter("date")(num, "yyyy-MM-dd HH:mm:ss")
                            //  console.log(val);
                        }
                        //非日期格式
                        if ($scope.displayFormat[i].length > 0 && !(d[key].match(/^\/Date\(\d+\)\/$/g))) {
                            var format = $scope.displayFormat[i];
                            val = format.replace(/\{[a-zA-Z0-9]+\}/, val);
                        }
                        summary += $scope.columnNames[key] + ":" + val + "<br/>";
                        i++;

                    }
                }

                tmpArray.push({ itemName: itemName, summary: $sce.trustAsHtml(summary), oldItem: d });
            }
            $scope.LoadFinished = data.LoadFinished;
            //合并数组
            $scope.viewModel.splice($scope.NextPageIndex * 10, tmpArray.length);
            for (var i = $scope.NextPageIndex * 10, j = 0; i < $scope.NextPageIndex * 10 + tmpArray.length; i++, j++) {
                $scope.viewModel.splice(i, 0, tmpArray[j]);
            }
            //页数加1,改变NetWorkFlag的状态##
            if (!data.LoadFinished) {
                $scope.NextPageIndex += 1;
                $scope.NetWorkFlag.index = $scope.NextPageIndex;
                $scope.NetWorkFlag.status = false;
            }


            sheetQuery.filter = data.QuerySetting.QueryItems;
            if (!$scope.HasBindFilters) {
                $scope.BindFilter();
            }
            if (data.QuerySetting.JavaScriptExtend) {
                data.QuerySetting.JavaScriptExtend = data.QuerySetting.JavaScriptExtend.replace(/&amp;&amp;/g, '&&');
                var javaScriptTemp = $("<script type='text/javascript' id='JavaScriptExtend'>" + data.QuerySetting.JavaScriptExtend + " </script>");
                $('body').append(javaScriptTemp);
            }

            if (!$scope.IsBindInputVlues) {
                $scope.BindFilterInputValues();
            }
        }
    };
    //从后台读取数据
    $scope.NextPageIndex = 0;
    //防止发送重复的请求##
    $scope.NetWorkFlag = {
        index: 0,
        status: false
    };
    $scope.viewModel = [];
    $scope.LoadQueryData = function (isSearch, InputMapping) {
        var localInpuptMapping
        if (InputMapping) {
            localInpuptMapping = InputMapping;
        } else {
            localInpuptMapping = $scope.GetInputMappings();
        }
        if (!isSearch) { localInpuptMapping = {}; }
        var params = {
            Action: "GetQuerySettingAndData",
            SchemaCode: sheetQuery.schemaCode,
            QueryCode: sheetQuery.queryCode,
            InputMapping: localInpuptMapping,
            PageSize: $scope.PageSize,
            NextPageIndex: $scope.NextPageIndex
        };
        //筛选数据
        if (sheetQuery.filter.length > 0) {
            //params["Action"] = "GetQueryData";
            //如何没绑定inputmapping的值，得绑定 
            params["Filters"] = $scope.GetFilters();
        }

        if ($scope.NextPageIndex == $scope.NetWorkFlag.index && !$scope.NetWorkFlag.status) {
            //已经发送了请求不再重复发送请求##
            $scope.NetWorkFlag.status = true;
            var promise = $SheetQuery.QueryData(params);
            promise.then(function (data) {
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $scope.BindData(data)
            })
        } else {
            console.log("repeat network!");
        }
    };
    $scope.conditionLoadQueryData = function (isSearch) {
        $scope.ClearChoosedObjectId();
        $scope.NextPageIndex = 0;
        $scope.viewModel = [];
        $scope.NetWorkFlag = {
            index: 0,
            status: false
        };
        var InputMapping = {};
        $("[data-property]").each(function (i, v) {
            if ($(v).val() !== "") {
                InputMapping[$(v).data("property")] = $.trim($(v).val());
            } else if ($(v)[0].tagName == "DIV") {
                var DisplayType = $(v).data("controltype");
                if (DisplayType == 1 || DisplayType == 2) {
                    //下拉//单选
                    if ($(v).find(".cItem").hasClass("selected")) {
                        InputMapping[$(v).data("property")] = $.trim($(v).find(".cItem.selected").text());
                    }
                } else if (DisplayType == 3) {
                    //复选
                    var val = "";
                    if ($(v).find(".cItem").hasClass("selected")) {
                        $(v).find(".cItem.selected").each(function (o, i) {
                            val += $.trim($(i).text()) + ";";
                        });
                    }
                    InputMapping[$(v).data("property")] = val;
                }
            }
        })
        console.log(InputMapping);
        $scope.LoadQueryData(isSearch, InputMapping);
    }

    $scope.goBack = function () {
        window.history.back();
    }

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if ($rootScope.dingMobile.isDingMobile) {
            //设置header 右边按钮
            dd.biz.navigation.setMenu({
                items: [
                    {
                        "id": "1",//字符串
                        "text": "查询"
                    }
                ],
                onSuccess: function (data) {
                    $scope.conditionLoadQueryData(true);
                }
            });
        }
        $scope.LoadQueryData(true);
    });
    $scope.ClearChoosedObjectId = function () {
        $scope.choosedObjectId = "";
    }
})
    //传阅、转发。。。
    .controller('fetchUserCtrl', ['$rootScope', '$scope', '$ionicHistory', '$ionicPopup', '$state', 'fcommonJS', function ($rootScope, $scope, $ionicHistory, $ionicPopup, $state, fcommonJS) {
        // 每次进入View时触发
        $scope.$on("$ionicView.enter", function (scopes, states) {
            $.MvcSheetUI.IonicFramework.$scopeFetchUser = $scope;
            $scope.Params = $.MvcSheetUI.actionSheetParam;
            //设置钉钉头部
            if ($rootScope.dingMobile.isDingMobile) {
                $scope.SetDingDingHeader($scope.Params.title);
                dd.biz.navigation.setLeft({
                    show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                    control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                    text: $rootScope.names.Back,//控制显示文本，空字符串表示显示默认文本
                    onSuccess: function (result) {
                        $scope.goBack();
                    },
                    onFail: function (err) { }
                });
                dd.biz.navigation.setRight({
                    show: false
                });
            };
            $scope.ActionShow = true;
            $scope.NeedUser = true;
            $scope.NeedTip = true;
            if ($scope.Params.Action == "Circulate" || $scope.Params.Action == "AdjustParticipant") { //传阅加签不应该展示意见
                $scope.ActionShow = false;
            }

            if ($scope.Params.Action == "Urgen") { //催办不需要选择用户
                $scope.NeedUser = false;
                $scope.NeedTip = false;
            }
            if ($scope.NeedUser) {
                $("#fetchUserSelect").html();

                if (!$scope.SheetUser || ($scope.Params.Action != $scope.SheetUser.ActionType)) {
                    $("#fetchUserSelect").data("sheetid", "");
                    $scope.SheetUser = $("#fetchUserSelect").SheetUser($scope.Params.ueroptions);
                    if (!$scope.SheetUser && $rootScope.fetchUserSelect) {
                        $scope.SheetUser = $rootScope.fetchUserSelect;
                    }
                }
                $($(".fetchUserContainer")[0].children).after($(".divContentImg"));//将加减号移动到感应区

            }

        });
        $scope.$on("$ionicview.beforeleave", function (scopes, states) {
            if ($state.current.name == "form.detail" && $rootscope.dingmobile.isdingmobile && dd) {
                $scope["sheetusersfetchuserselect"] = [];
                $scope.sheetuser.clearchoices();
                $scope.fetchuserselectdata = [];
            }
        });
        //SelectUser完成事件
        $rootScope.$on('sheetUserFinished', function (event, data) {
            var ngmodel = data.dataField;
            var the = $scope[ngmodel];
            if (!the) return;
            the.ClearChoices();
            the.SetValue(data.obj);
            var tagName = ngmodel;
            $scope["sheetUsers" + tagName] = data.SelectItems;
            //$scope.fetchUserSelectData = data.obj;
            //debugger;
            $scope.fetchUserSelectData = data.obj;
            //$rootScope.fetchUserSelect = the;
            //tll:存在数据则需要把加减号移动到人员后面
            if ((angular.isArray(data.obj) && data.obj.length > 0) || !(angular.isArray($scope.fetchUserSelectData))) {
                console.log(1);
                $($(".breadcrumb-wrapper")[1]).append($(".fetchUserContainer"));
            }
        });
        $scope.goBack = function () {
            $scope["sheetUsersfetchUserSelect"] = [];
            if ($scope.Params.Action != "Urgen") {
                $scope.SheetUser.ClearChoices();//
            }
            if ($scope.ActionShow) {
                $("#commentVaule").val("");
            }
            $scope.fetchUserSelectData = [];
            window.history.back();
        }

        $scope.delUserItem = function (index) {
            var tagName = $scope.SheetUser.DataField;
            var deleteItem = $scope["sheetUsers" + tagName][index];
            $scope["sheetUsers" + tagName].splice(index, 1);
            //if (tagName.indexOf('_') > -1) {
            //    tagName = tagName.replace('_', '.').replace('_', '.').replace('.', '_');
            //}
            $scope[tagName].RemoveChoice(deleteItem.id);
            console.log($scope.fetchUserSelectData);
            //处理删空数据,
            if (angular.isArray($scope.fetchUserSelectData)) {
                angular.forEach($scope.fetchUserSelectData, function (data, index, full) {
                    if (data.Code == deleteItem.id) {
                        $scope.fetchUserSelectData.splice(index, 1);
                    }
                });
            } else {
                $scope.fetchUserSelectData = [];
            }
        }
        $scope.doAction = function () {
            var Datas = [];
            if ($scope.NeedUser) {
                if (angular.isUndefined($scope.fetchUserSelectData) || (angular.isArray($scope.fetchUserSelectData) && $scope.fetchUserSelectData.length == 0)) {
                    alert($scope.Params.Text);
                    return;
                }
                else if (angular.isArray($scope.fetchUserSelectData)) {
                    var datas = "";
                    angular.forEach($scope.fetchUserSelectData, function (data, index, full) {
                        if (datas == "") {
                            datas = data.Code;
                        } else {
                            datas = datas + "," + data.Code;
                        }
                    });
                    Datas.push(datas);
                } else {
                    var data = $scope.fetchUserSelectData.Code;
                    if (data != "")
                        Datas.push(data);
                }
            }
            if ($scope.Params.Action != $.MvcSheet.Action_Forward && $scope.Params.Action != $.MvcSheet.Action_Urgen) {
                Datas.push(false)
            }
            if ($scope.Params.Action == $.MvcSheet.Action_Forward || $scope.Params.Action == $.MvcSheet.Action_Assist || $scope.Params.Action == $.MvcSheet.Action_Consult || $scope.Params.Action == $.MvcSheet.Action_Urgen) {
                var commentVaule = $.trim($("#commentVaule").val()) ? $.trim($("#commentVaule").val()) : "同意";
                Datas.push(commentVaule);  // 转发/协助/征询意见，暂时用默认值替代
            }
            var action = {
                Action: $scope.Params.Action,
                Datas: Datas,
                Text: $scope.Params.title
            };
            $.MvcSheet.Action(action);
            //  $ionicHistory.goBack();
            window.history.back();
        }
    }])
    //流程状态
.controller('instanceStateCtrl', ['$rootScope', '$scope', '$stateParams', '$http', '$ionicScrollDelegate', '$ionicHistory', 'fcommonJS', function ($rootScope, $scope, $stateParams, $http, $ionicScrollDelegate, $ionicHistory, fcommonJS) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
    });

    if ($rootScope.dingMobile.isDingMobile) {
        $scope.SetDingDingHeader($rootScope.names.State);
    }
    //保证上下滑动
    if (document.body.scrollHeight)
        $scope.scrollHeight = { 'height': document.body.scrollHeight + "px" };

    console.log($stateParams);
    $scope.Mode = $stateParams.Mode;
    $scope.InstanceID = $stateParams.InstanceID;
    $scope.WorkflowCode = $stateParams.WorkflowCode;
    $scope.WorkflowVersion = $stateParams.WorkflowVersion;
    $scope.closePage = function () {
        window.history.back();
        // $ionicHistory.goBack();
    }
    if ($scope.Mode == 3) {
        $scope.IsOriginate = true;
    } else {
        $scope.IsOriginate = false;
    }

    $scope.init = function () {
        $scope.type = "base";
        if ($scope.IsOriginate) {
            MobileLoader.ShowWorkflow($scope.InstanceID, $scope.WorkflowCode, $scope.WorkflowVersion, _PORTALROOT_GLOBAL);
        } else {
            MobileLoader.ShowWorkflow($scope.InstanceID, "", -1, _PORTALROOT_GLOBAL);
        }
        fcommonJS.loadingHide();
    }
    $scope.init();
}])
    //
.controller('downLoadFileCtrl', ['$rootScope', '$scope', '$location', '$http', '$stateParams', '$ionicHistory', '$window', '$sce', function ($rootScope, $scope, $location, $http, $stateParams, $ionicHistory, $window, $sce) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $scope.url = $rootScope.AttachmentUrl;
        $scope.extension = $stateParams.extension;
        $scope.xmldoc = "";

        var pic_extension = ".jpg,.gif,.jpeg,.png";
        var txt_extension = ".txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.ini,.html.htm,.xml,.js,.css,.java,.sql";
        var mp3_extension = ".mp3";
        var xml_extension = ".xml";

        $scope.isImg = pic_extension.indexOf($scope.extension) > -1 ? true : false;
        $scope.isTxt = txt_extension.indexOf($scope.extension) > -1 ? true : false;
        $scope.isMp3 = mp3_extension.indexOf($scope.extension) > -1 ? true : false;
        $scope.isXML = xml_extension.indexOf($scope.extension) > -1 ? true : false;

        $scope.xmlConvertToHtml = function () {
            $http({
                url: $scope.url,
            }).success(function (data, header, config, status) {
                if (data) {
                    var div = $("<div></div>");
                    var divstyle = $("<div style='word-wrap:break-word;word-break:normal;'></div>");
                    data = data.replace(/</g, "&lt").replace(/>/g, "&gt");
                    divstyle.html(data);
                    div.append(divstyle);
                    $scope.xmldoc = $sce.trustAsHtml(div.html());
                    $.LoadingMask.Hide();
                }
                else {
                    $.LoadingMask.Hide();
                }
            }).error(function (result) {
                $.LoadingMask.Hide();
            })
        }

        if ($scope.isXML) {
            $scope.xmlConvertToHtml();
        } else {
            $.LoadingMask.Hide();
        }
    });
}])