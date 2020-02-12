var module = angular.module('starter.controllers', [])
    // 全局Controller
    .controller("mainCtrl", function ($rootScope, $scope, $state, $http, $ionicPopup, $ionicLoading, $ionicSideMenuDelegate, $cordovaDevice, $cordovaAppVersion, $cordovaNetwork, $ionicScrollDelegate, $cordovaToast, $cordovaBadge, $ionicHistory, $timeout, commonJS) {
        //window.cordova = true;

        if (window.cordova) {
            $rootScope.appShow = true;//app通讯录影藏
        } else {
            $rootScope.appShow = false;
        }
        //add by hxc 键盘问题
        if (window.cordova && ionic.Platform.isAndroid()) {
            window.addEventListener('native.keyboardshow', keyboardShowHandler);
            function keyboardShowHandler(e) {
                $rootScope.$broadcast('keyboardshow', e.keyboardHeight);
            }
            window.addEventListener('native.keyboardhide', keyboardHideHandler);
            function keyboardHideHandler(e) {
                $rootScope.$broadcast('keyboardhide', e.keyboardHeight);
            }
        }

        //Tab选中事件
        $scope.tabOnSelect = function (index) {
            //当前选中的Tab的值
            $scope.SelectedTab = index;
            $scope._filterArray = [];//PopOver缓存筛选条件
            $rootScope.filterUsers = null;

        }
        //设置popup的样式
        function setPopupStyle() {
            var dpr = document.documentElement.getAttribute('data-dpr');
            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.innerHTML = '.ion-datetime-picker-popup{pointer-events: auto;}.ion-datetime-picker-popup .popup{zoom:' + dpr + ' !important;transform:scale(' + dpr + ') !important;width: min-content; min-width: 300px; } ';
            head.appendChild(style);
        }
        setPopupStyle();

        $rootScope.loginInfo = {
            success: false,
            loginfrom: commonJS.getUrlParam('loginfrom')
        }
        console.log("主程序启动....");
        $scope.UrlSplitStr = "mobile";
        //重置钉钉，微信头部样式
        $rootScope.dingMobile = {
            isDingMobile: false,                              //是否钉钉移动端，如果是钉钉移动端，需要隐藏当前header，重写钉钉APP Header
            dingHeaderClass: "menu-tittle",                   //隐藏header后 subHeader ion-content需要修改相关样式
            dingSubHeaderClass: "has-header has-subheader",  //隐藏header后 subHeader ion-content需要修改相关样式
            dingContentClass: "scroll-content ionic-scroll  has-tabs",
            hideHeader: false,                                //是否需要隐藏当前Header
            hideOther: true,//钉钉微信共同需要隐藏的
        };
        //设置钉钉header
        $scope.SetDingDingHeader = function (title) {
            //设置Header标题
            dd.biz.navigation.setTitle({
                title: title,//控制标题文本，空字符串表示显示默认文本
                onSuccess: function (result) { },
                onFail: function (err) {
                    console.log(err);
                }
            });
        };
        //设置钉钉header右侧
        $scope.SetDingDingHeaderRight = function (title) {
            //设置Header右侧标题
            dd.biz.navigation.setRight({
                show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                text: title,//控制显示文本，空字符串表示显示默认文本
                onSuccess: function (result) {
                    console.log(result);
                },
                onFail: function (err) { }
            });
        };
        //判断登陆平台：App,微信，钉钉
        $scope.GetLoginFrom = function () {
            var loginfrom = commonJS.getUrlParam('loginfrom');
            console.log("loginfrom..." + loginfrom);
            if (loginfrom == 'dingtalk' && dd.version) {
                $rootScope.loginInfo.loginfrom = 'dingtalk';
                $rootScope.dingMobile.isDingMobile = true;
                $rootScope.dingMobile.dingHeaderClass = 'dingtalk-menu';
                $rootScope.dingMobile.dingSubHeaderClass = 'has-header';
                $rootScope.dingMobile.dingContentClass = 'dingtalk-menu-scroll-content scroll-content';
                $rootScope.dingMobile.hideHeader = true;
                $rootScope.dingMobile.hideOther = false;
            } else if (window.cordova) {
                $rootScope.loginInfo.loginfrom = 'app';
                $rootScope.dingMobile.hideOther = true;
            } else if (window.localStorage.getItem("loginInfo.loginFrom") == "wechat") {
                $rootScope.dingMobile.hideOther = false;
            } else {//其他（pc）
                $rootScope.dingMobile.hideOther = true;
            }
        };
        $scope.GetLoginFrom();
        $scope.IsSSO = false;


        // 当前系统设置信息
        $scope.jpushWorkItemId = "";
        $scope.startworkflowDisplay = config.defaultStartworkflowDisplay;
        $scope.unfinishedWorkItemSortable = config.defaultUnfinishedWorkItemSortable;
        $scope.defaultImageUrl = config.defaultImageUrl;
        // 客户端信息
        $scope.clientInfo = {
            AppVersion: "",                 // 版本号
            UUID: "",                       // UUID
            JPushID: "",                    // JPUSHID
            Platform: "",                   // 客户端类型
            isOffline: false                // 是否在线状态
        };
        // 设置信息
        $scope.setting = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.Setting')) ||
           {
               autoLogin: config.defaultAutoLogin, // 是否自动登录
               serviceUrl: config.defaultServiceUrl, // 服务地址
               appServiceUrl: config.appServiceUrl,
               httpUrl: '', //http请求地址
               workItemUrl: '', // 打开待办的URL地址
               startInstanceUrl: '', // 发起流程的链接
               instanceSheetUrl: '', // 打开在办流程的链接
               uploadImageUrl: '', // 图片上传URL
               tempImageUrl: '' // 图片存放路径
           };
        //设置语言
        $scope.H3 = {};
        $scope.H3.language = window.localStorage.getItem('H3.Language') || config.defaultLanguage;
        if ($scope.H3.language == 'en_us') {
            config.languages.current = config.languages.en;
        } else if ($scope.H3.language == 'zh_cn') {
            config.languages.current = config.languages.zh;
        }

        //微信表单跳出，回到进入页
        $scope.JumpParams = JSON.parse(window.localStorage.getItem('absurl')) || {
            state: '',
            tab: 0
        };
        window.localStorage.removeItem("absurl");

        $scope.renderJumpParams = function () {
            $scope.JumpParams = {
                state: '',
                tab: 0
            };
        }

        if (!window.cordova) {
            $scope.setting.httpUrl = document.location.href.toLocaleLowerCase().split("/" + $scope.UrlSplitStr + "/")[0];
        } else {
            $scope.setting.appServiceUrl = window.localStorage.getItem('OThinker.H3.Mobile.setIP') || config.appServiceUrl;
            $scope.setting.httpUrl = $scope.setting.appServiceUrl.substring(0, $scope.setting.appServiceUrl.lastIndexOf("/") + 1);;
        }
        // 微信单点登录开始
        var code = commonJS.getUrlParam("code");
        var state = commonJS.getUrlParam("state");
        if (code && state) {// 微信单点登录
            if (window.localStorage.getItem("OThinker.H3.Mobile.WeChat.WeChatUrl")) window.localStorage.removeItem("OThinker.H3.Mobile.WeChat.WeChatUrl")
            $scope.IsSSO = true;
            commonJS.loadingShow();
            var url = document.location.href.toLocaleLowerCase();
            $scope.serviceUrl = url.split("/" + $scope.UrlSplitStr + "/")[0] + "/WeChat/ValidateLoginForWeChat";
            $http({
                url: $scope.serviceUrl,
                params: {
                    state: state,
                    code: code
                }
            })
            .success(function (result) {
                $scope.IsSSO = false;
                commonJS.loadingHide();
                if (result.Success) {
                    $ionicHistory.clearCache();
                    $ionicHistory.clearHistory();
                    $rootScope.loginInfo.loginfrom = "wechat";
                    window.localStorage.setItem("OThinker.H3.Mobile.WeChat.WeChatUrl", window.location.href);

                    $rootScope.loginInfo.success = true;
                    config.portalroot = result.PortalRoot;
                    $scope.user.ObjectID = result.MobileUser.ObjectID;
                    $scope.user.DirectParentUnits = result.DirectoryUnits;
                    $scope.user.Code = result.MobileUser.Code;
                    $scope.user.Name = result.MobileUser.Name;
                    $scope.user.MobileToken = result.MobileUser.MobileToken;
                    $scope.user.ImageUrl = result.MobileUser.ImageUrl == "" ? "" : $scope.setting.tempImageUrl + result.MobileUser.ImageUrl;
                    $scope.user.Email = result.MobileUser.Email;
                    $scope.user.DepartmentName = result.MobileUser.DepartmentName;
                    $scope.user.OfficePhone = result.MobileUser.OfficePhone;
                    $scope.user.Mobile = result.MobileUser.Mobile;
                    $scope.user.WeChat = result.MobileUser.WeChat;
                    $scope.user.Appellation = result.MobileUser.Appellation;
                    if (result.MobileUser.Language) {
                        window.localStorage.setItem('H3.Language', result.MobileUser.Language)
                    };
                    //  $scope.GetBadge();
                    $scope.setLocalStorage();//存储最近一次登录，解决首页报objectID为空
                    $rootScope.$broadcast("LoginIn", "");
                    window.localStorage.setItem("loginInfo.loginFrom", "wechat");
                    $rootScope.dingMobile.hideOther = false;//登陆成功隐藏退出按钮
                    //TODO:此处为默认路由，微信在表单返回时也会经过这里
                    //这里如果有跳转路由，会导致表单关闭后跳转到此路由
                    // $state.go("home.index");
                    if ($scope.JumpParams.state != "") {
                        $state.go($scope.JumpParams.state);
                    }
                } else {
                    //提示信息
                    commonJS.MsgErrorHandler("登录失败，请联系管理员！");
                    if (typeof (WeixinJSBridge) != "undefined") {
                        //登陆失败,关闭页面
                        WeixinJSBridge.call("closeWindow");
                    }
                }
            })
            .error(function () {
                $scope.IsSSO = false;
                commonJS.loadingHide();

                if (commonJS.checkOnline()) {
                    commonJS.MsgErrorHandler("远程服务链接错误，请稍候再试！");
                    //commonJS.showShortTop("远程服务链接错误，请稍候再试！");
                }
                else {
                    commonJS.MsgErrorHandler("您处理离线状态，请先检查网络！！");
                    // commonJS.showShortTop("您处理离线状态，请先检查网络！");
                }
            });
        }
        // 当前登录的用户信息
        $scope.user = JSON.parse(window.localStorage.getItem("OThinker.H3.Mobile.User")) ||
            {
                ObjectID: "",
                Code: "",
                Password: "",
                Image: "",
                Name: "",
                MobileToken: "" // 服务器端返回的Token
            };
        //钉钉单点登录开始
        if (dd && dd.version) {
            $scope.dingLog = '登陆开始：' + new Date().Format('yyyy-MM-dd HH:mm:ss');
            $scope.IsSSO = true;
            commonJS.loadingHide();
            var _config = {};
            var sourceUrl = document.location.href;
            var url = sourceUrl.toLocaleLowerCase();
            $scope.serviceUrl = url.split('/' + $scope.UrlSplitStr + '/')[0];

            $http({
                url: $scope.serviceUrl + '/DingTalk/GetSignConfig',
                params: { url: sourceUrl, t: Math.random() }
            })
                .success(function (res) {
                    //获取签名信息成功
                    _config = res;
                    //执行签名信息验证和登录操作
                    $scope.dingLog = $scope.dingLog + "||获取签名完成：" + new Date().Format("yyyy-MM-dd HH:mm:ss");
                    $scope.ddReady();
                }).error(function (err) {
                    //提示信息
                    commonJS.MsgErrorHandler("登录失败，请联系管理员！");
                    console.log('Error:' + err);
                });
        }
        //End 钉钉单点登录结束
        //钉钉免登签名信息校验及登录
        $scope.ddReady = function () {
            $scope.dingLog = $scope.dingLog + '||开始登陆：' + new Date().Format('yyyy-MM-dd HH:mm:ss');


            dd.ready(function () {

                // 配置jsAPI
                dd.config({
                    agentId: _config.agentId,
                    corpId: _config.corpId,
                    timeStamp: _config.timeStamp,
                    nonceStr: _config.nonce,
                    signature: _config.signature,
                    jsApiList: [
                        'runtime.info',
                        'biz.contact.choose',
                        'device.notification.confirm',
                        'device.notification.alert',
                        'device.notification.prompt',
                        'biz.ding.post',
                        'runtime.permission.requestAuthCode',
                        'device.geolocation.get',
                        'biz.ding.post',
                        'biz.contact.complexChoose'
                    ]
                });

                $scope.IsSSO = false;
                commonJS.loadingHide();
                //获取免登授权码 -- 注销获取免登服务，可以测试jsapi的一些方法
                dd.runtime.permission.requestAuthCode({
                    corpId: _config.corpId,
                    onSuccess: function (result) {
                        var code = result['code'];
                        var state = commonJS.getUrlParam('state');
                        var target = commonJS.getUrlParam('target');
                        var params = commonJS.getUrlParam('params');
                        //WorkItemID 参数要和后台配置打开URL中的参数一致
                        var WorkItemID = commonJS.getUrlParam('WorkItemID');
                        $http({
                            url: $scope.setting.httpUrl + '/DingTalk/ValidateLoginForDingTalk',
                            params: {
                                state: state,
                                code: code
                            }
                        })
                            .success(function (result) {
                                debugger
                                console.log(result);
                                $scope.dingLog = $scope.dingLog + '||登陆完成：' + new Date().Format('yyyy-MM-dd HH:mm:ss');
                                $ionicHistory.clearCache();
                                $ionicHistory.clearHistory();
                                $rootScope.loginInfo.loginfrom = 'dingtalk';
                                $rootScope.loginInfo.success = true;
                                config.portalroot = result.PortalRoot;
                                $scope.user.ObjectID = result.MobileUser.ObjectID;
                                $scope.user.DirectParentUnits = result.DirectoryUnits;
                                $scope.user.Code = result.MobileUser.Code;
                                $scope.user.Name = result.MobileUser.Name;
                                $scope.user.MobileToken = result.MobileUser.MobileToken;
                                $scope.user.ImageUrl = result.MobileUser.ImageUrl == '' ? '' : $scope.setting.tempImageUrl + result.MobileUser.ImageUrl;
                                $scope.user.OfficePhone = result.MobileUser.OfficePhone;
                                $scope.user.Mobile = result.MobileUser.Mobile;
                                $scope.user.Appellation = result.MobileUser.Appellation;
                    
                                //  $scope.GetBadge();
                                //所在部门信息-报表
                                $rootScope.departmentInfo = {};
                                $rootScope.departmentInfo.UserName = result.MobileUser.Name;
                                $rootScope.departmentInfo.UserId = result.MobileUser.ObjectID;
                                for (var p in result.DirectoryUnits) {
                                    $rootScope.departmentInfo.DepartmentName = result.DirectoryUnits[p];
                                    $rootScope.departmentInfo.DepartmentId = p;
                                }
                                if (result.MobileUser.Language) {
                                    window.localStorage.setItem('H3.Language', result.MobileUser.Language)
                                };
                                console.log("钉钉登陆成功");
                                $scope.setLocalStorage();//存储最近一次登录，解决首页报objectID为空
                                $rootScope.$broadcast("LoginIn", "");
                                $state.go(target || 'tab.home', JSON.parse(params));
                            });
                    },
                    onFail: function (err) {
                        //提示信息
                        commonJS.MsgErrorHandler("登录失败，请联系管理员！");
                        console.log('error fail:' + err);
                    }
                });
            });
            dd.error(function (err) {
                $scope.IsSSO = false;
                //提示信息
                commonJS.MsgErrorHandler("登录失败，请联系管理员！");
                //钉钉验证出错
                console.log(err);
            });
        };


        // 计算待办打开的 URL
        $scope.getWorkItemUrl = function () {
            var url = document.location.href.toLocaleLowerCase();
            console.log(url);
            if ($rootScope.loginInfo.loginfrom == "app") {
                url = $scope.setting.httpUrl.substring(0, $scope.setting.httpUrl.lastIndexOf("/"));
                console.log(url);
            } else {
                url = url.split("/" + $scope.UrlSplitStr + "/")[0];
                console.log(url);
            }

            $scope.setting.workItemUrl = url + "/WorkItemSheets.html?IsMobile=true&WorkItemID=";

            $scope.setting.startInstanceUrl = url + "/StartInstance.html?IsMobile=true&WorkflowCode=";

            $scope.setting.instanceSheetUrl = url + "/InstanceSheets.html?IsMobile=true&InstanceId=";

            $scope.setting.uploadImageUrl = url + "/OrgUser/UploadUserImage";

            $scope.setting.tempImageUrl = url.replace("portal", "Portal") + "/TempImages/";

            $scope.setting.openBizObjectUrl = url + "/RunBizQuery/EditBizObject";

            $scope.setting.serviceUrl = url;
            $scope.setLocalStorage();
        };
        // 本地存储
        $scope.setLocalStorage = function () {
            // 存储设置信息
            window.localStorage.setItem("OThinker.H3.Mobile.Setting", JSON.stringify($scope.setting));
            window.localStorage.setItem("OThinker.H3.Mobile.User", JSON.stringify($scope.user));
            window.localStorage.setItem("H3.Language", $scope.H3.language);
        };
        // 计算打开待办的表单URL
        $scope.getWorkItemUrl();

        // 推送回调事件
        $scope.jpushCallback = function (data) {
            $state.go('tab.home', { reload: true, selectIndex: 0 });
            var pushId = window.localStorage.getItem("OThinker.H3.Mobile.WorkItemID");
            if (pushId != data.extras["cn.jpush.android.EXTRA"].workItemId) {
                $scope.jpushWorkItemId = data.extras["cn.jpush.android.EXTRA"].workItemId;
                window.localStorage.setItem("OThinker.H3.Mobile.WorkItemID", $scope.jpushWorkItemId);
            }
            //app已经打开时，点击直接打开表单，否则先登陆再打开
            if ($state && $state.current && $state.current.name != "" && $state.current.name != "login") {
                if ($scope.jpushWorkItemId != "") {

                    $scope.worksheetUrl = $scope.setting.workItemUrl + $scope.jpushWorkItemId + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
                    commonJS.GetWorkItemSheetUrl($scope, $scope.worksheetUrl, $scope.jpushWorkItemId);
                    $scope.jpushWorkItemId == "";
                }
            }
        }
        document.addEventListener("deviceready", function () {
            if (window.plugins) {

                var permissions = window.cordova.plugins.permissions;
                if (permissions) {
                    var list = [
                        permissions.CAMERA,
                        permissions.WRITE_EXTERNAL_STORAGE
                    ];
                    //检查摄像头和存储权限
                    permissions.hasPermission(list, function (status) {
                        if (!status.hasPermission) {
                            permissions.requestPermissions(list, null, null);
                        }
                    });
                }

                $scope.clientInfo.Platform = $cordovaDevice.getPlatform();
                $scope.clientInfo.UUID = $cordovaDevice.getUUID();

                if (parseFloat(window.device.version) < 11 &&
                   window.device.platform == "iOS"
                   ) {
                    //document.body.className+=" iOS7";
                    console.log("iOS7")
                    $scope.iOS7 = true;
                }

                if (window.plugins.jPushPlugin) {
                    // 获取JPushID
                    window.plugins.jPushPlugin.getRegistrationID(function (id) {
                        $scope.clientInfo.JPushID = id;
                        console.log("get jpubsh id:" + id);
                    });

                    // Android注册消息推送内容点击事件
                    window.plugins.jPushPlugin.openNotificationInAndroidCallback = $scope.jpushCallback;

                    //IOS注册消息推送内容点击事件
                    window.plugins.jPushPlugin.receiveNotificationIniOSCallback = $scope.jpushCallback;
                }

                if ($cordovaDevice.getPlatform().toLocaleLowerCase().indexOf("android") > -1) {
                    $scope.layout.noSearchTop = $scope.android.noSearchTop;
                    $scope.layout.hasSearchTop = $scope.android.hasSearchTop;
                    $scope.layout.bannerImageTop = $scope.android.bannerImageTop;
                } else {
                    $scope.layout.noSearchTop = $scope.ios.noSearchTop;
                    $scope.layout.hasSearchTop = $scope.ios.hasSearchTop;
                    $scope.layout.bannerImageTop = $scope.ios.bannerImageTop;
                }
            }

            // 离线检测
            if (!commonJS.checkOnline()) {
                $scope.clientInfo.isOffline = true;
            }

            // 版本与升级检测
            $cordovaAppVersion.getVersionNumber().then(function (version) {
                $scope.clientInfo.AppVersion = version;
                if (!$scope.clientInfo.isOffline) {
                    commonJS.checkVersion($scope.setting.httpUrl, $cordovaDevice.getPlatform(), version);
                }
            });

            // 隐藏Splash画面
            if (navigator.splashscreen) navigator.splashscreen.hide();
        });

        // 打开通知事件，Android测试无反应，iOS可以，待继续验证
        document.addEventListener("jush.openNotification", function (data) {
            if (data && data.workItemId) {
                $scope.jpushWorkItemId = data.workItemId;
            }
        });

        // Jpush 接收新通知事件，实际测试只有App在前台有效
        document.addEventListener("jush.receiveNotification", function (data) {

        });

        $rootScope.loginfrom = $rootScope.loginInfo.loginfrom;//赋值，以防改版后还用到$rootScope.loginfrom
        //重写alert，confirm方法
        window.alert = function (msg) {
            var myPopup = $ionicPopup.show({
                popupclass: 'bpm-sheet-alert',
                template: '<span>' + msg + '<span>',
            });

            $timeout(function () {
                myPopup.close();
            }, 1500);
        }
        window.confirm = function (message, doneCallback) {
            var myPopup = $ionicPopup.show({
                popupclass: 'bpm-sheet-confirm',
                template: '<span>' + message + '<span>',
                buttons: [
                       {
                           text: '取消',
                           type: 'button-clear',
                       },
                       {
                           text: '确定',
                           type: 'button-clear',
                           onTap: function (e) {
                               doneCallback();
                           }
                       },
                ]
            });
        }
        commonJS.setLanguages();
    });
