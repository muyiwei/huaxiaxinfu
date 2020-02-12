var module = angular.module('starter.controllers', [])
    // 全局Controller
    .controller("mainCtrl", function ($rootScope, $scope, $state, $http, $ionicPopup, $ionicSideMenuDelegate, $cordovaDevice, $cordovaAppVersion, $cordovaNetwork, $ionicScrollDelegate, $cordovaToast, $cordovaBadge, $ionicHistory, $timeout, commonJS) {
        console.log("主程序启动....");
        $scope.userId = "";
        //Tab栏待办待阅数
        $rootScope.badge = {
            unfinishedworkitem: 0,
            unreadworkitem: 0
        };

        $scope.UrlSplitStr = "hybrid";

        $rootScope.dingMobile = {
            isDingMobile: false,                              //是否钉钉移动端，如果是钉钉移动端，需要隐藏当前header，重写钉钉APP Header
            dingHeaderClass: "has-header",                   //隐藏header后 subHeader ion-content需要修改相关样式
            dingSubHeaderClass: "has-header has-subheader",  //隐藏header后 subHeader ion-content需要修改相关样式
            hideHeader: false                                 //是否需要隐藏当前Header
        }

        //判断登陆平台：App,微信，钉钉
        $scope.GetLoginFrom = function () {
            var loginfrom = commonJS.getUrlParam("loginfrom");
            if (loginfrom == "dingtalk" && dd.version) {
                $rootScope.loginfrom = "dingtalk";
                $rootScope.dingMobile.isDingMobile = true;
                $rootScope.dingMobile.dingHeaderClass = "";
                $rootScope.dingMobile.dingSubHeaderClass = "has-header";
                $rootScope.dingMobile.hideHeader = true;
            } else if (window.cordova) {
                $rootScope.loginfrom = "app";
            } else {
                //微信在做单点登录处判断
                //$rootScope.loginfrom = "wechat";
            }
        }
        $scope.GetLoginFrom();

        // 每次进入View时触发
        $scope.$on("$ionicView.enter", function (scopes, states) {
            // 如果是从IONIC过来，则关闭当前窗体(流程状态除外)
            if (window.location.href.indexOf("instanceState") > -1) return;
            if (window.parent && window.parent._scope && window.parent._scope.modalForm) {
                if (window.parent._scope.modalForm.isShown()) {
                    window.parent._scope.modalForm.hide();
                    if (window.parent._scope.hasOwnProperty("refreshUnfinishedWorkItem")) {
                        window.parent._scope.refreshUnfinishedWorkItem();
                    } else if (window.parent._scope.hasOwnProperty("RefreshCirculateItem")) {
                        window.parent._scope.RefreshCirculateItem();
                    }
                }
            }
        });

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
        $scope.setting = JSON.parse(window.localStorage.getItem("OThinker.H3.Mobile.Setting")) ||
            {
                autoLogin: config.defaultAutoLogin,            // 是否自动登录
                serviceUrl: config.defaultServiceUrl,          // 服务地址
                httpUrl: "",                            //http请求地址                                        
                workItemUrl: "",                        // 打开待办的URL地址
                startInstanceUrl: "",                   // 发起流程的链接
                instanceSheetUrl: "",                   // 打开在办流程的链接
                uploadImageUrl: "",                     // 图片上传URL
                tempImageUrl: "",                       // 图片存放路径
                language: config.defaultLanguage        // 语言
            };

        if (window.cordova) {
            if ($scope.setting.httpUrl.indexOf("http") > -1 && $scope.setting.httpUrl.indexOf("m.asmx") > -1) {
            } else {
                $scope.setting.httpUrl = $scope.setting.serviceUrl.toLocaleLowerCase();
            }
        } else {
            $scope.setting.httpUrl = document.location.href.toLocaleLowerCase().split("/" + $scope.UrlSplitStr + "/")[0];
        }

        // 当前登录的用户信息
        if (window.cordova) {
            $scope.user = JSON.parse(window.localStorage.getItem("OThinker.H3.Mobile.User")) ||
            {
                ObjectID: "",
                Code: "",
                Password: "",
                Image: "",
                Name: "",
                MobileToken: "" // 服务器端返回的Token
            };
        } else {
            $scope.user = {
                ObjectID: "",
                Code: "",
                Password: "",
                Image: "",
                Name: "",
                MobileToken: "" // 服务器端返回的Token
            };
        }

        $scope.isLoginOut = false;

        $scope.toggleLeft = function () {
            $ionicSideMenuDelegate.toggleLeft();
        };
        $scope.android = {
            noSearchTop: "44px",
            hasSearchTop: "85px",
            bannerImageTop: "3px"
        };
        $scope.ios = {
            noSearchTop: "64px",
            hasSearchTop: "105px",
            bannerImageTop: "23px"
        };
        $scope.layout = {
            noSearchTop: "44px",
            hasSearchTop: "85px",
            bannerImageTop: "3px"
        };
        // 计算待办打开的 URL
        $scope.getWorkItemUrl = function () {
            var url = document.location.href.toLocaleLowerCase();
            if ($rootScope.loginfrom == "app") {
                url = $scope.setting.httpUrl.substring(0, $scope.setting.httpUrl.lastIndexOf("/"));
            } else {
                url = url.split("/" + $scope.UrlSplitStr + "/")[0];
            }

            $scope.setting.workItemUrl = url + "/WorkItemSheets.html?IsMobile=true&WorkItemID=";

            $scope.setting.startInstanceUrl = url + "/StartInstance.html?IsMobile=true&WorkflowCode=";

            $scope.setting.instanceSheetUrl = url + "/InstanceSheets.html?IsMobile=true&InstanceId=";

            $scope.setting.uploadImageUrl = url + "/OrgUser/UploadUserImage";

            $scope.setting.tempImageUrl = url.replace("portal","Portal") + "/TempImages/";

            $scope.setting.serviceUrl = url;
            $scope.setLocalStorage();
        };
        // 本地存储
        $scope.setLocalStorage = function () {
            // 存储设置信息
            window.localStorage.setItem("OThinker.H3.Mobile.Setting", JSON.stringify($scope.setting));
        };
        // 计算打开待办的表单URL
        $scope.getWorkItemUrl();

        //计算待办 待阅显示数量
        $scope.GetBadge = function () {
            if (!$scope.user.ObjectID) return;
            var url = "";
            var params = null;
            if (window.cordova) {
                url = $scope.setting.httpUrl + "/GetWorkItemCount?callback=JSON_CALLBACK";
                url += "&userId=" + $scope.user.ObjectID;
                url += "&mobileToken=" + $scope.user.MobileToken;
            }
            else {
                url = $scope.setting.httpUrl + "/Mobile/GetWorkItemCount";
                params = {}
            }
            commonJS.getHttpData(url, params)
            .success(function (result) {
                //待办数量
                if (result.Success) {
                    $rootScope.badge.unfinishedworkitem = result.Extend.UnfinishedWorkItemCount > 99 ? "99+" : result.Extend.UnfinishedWorkItemCount;
                    $rootScope.badge.unreadworkitem = result.Extend.UnreadWorkItemCount > 99 ? "99+" : result.Extend.UnreadWorkItemCount;
                }
            })
        }

        $scope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
            $scope.GetBadge();
        });


        //钉钉免登签名信息校验及登录
        $scope.ddReady = function () {
            $scope.dingLog = $scope.dingLog + "||开始登陆：" + new Date().Format("yyyy-MM-dd HH:mm:ss");
            dd.ready(function () {
                $scope.IsSSO = false;
                commonJS.loadingHide();
                //获取免登授权码 -- 注销获取免登服务，可以测试jsapi的一些方法
                dd.runtime.permission.requestAuthCode({
                    corpId: _config.corpId,
                    onSuccess: function (result) {
                        var code = result["code"];
                        var state = commonJS.getUrlParam("state");
                        var tartget = commonJS.getUrlParam("target");
                        //WorkItemID 参数要和后台配置打开URL中的参数一致
                        var WorkItemID = commonJS.getUrlParam("WorkItemID");
                        $http({
                            url: $scope.setting.httpUrl + "/DingTalk/ValidateLoginForDingTalk",
                            params: {
                                state: state,
                                code: code
                            }
                        })
                        .success(function (result) {
                            $scope.dingLog = $scope.dingLog + "||登陆完成：" + new Date().Format("yyyy-MM-dd HH:mm:ss");
                            $ionicHistory.clearCache();
                            $ionicHistory.clearHistory();
                            $rootScope.loginfrom = "dingtalk";
                            config.portalroot = result.PortalRoot;
                            $scope.user.ObjectID = result.MobileUser.ObjectID;
                            $scope.user.Code = result.MobileUser.Code;
                            $scope.user.Name = result.MobileUser.Name;
                            $scope.user.MobileToken = result.MobileUser.MobileToken;
                            $scope.user.ImageUrl = result.MobileUser.ImageUrl == "" ? "" : $scope.setting.tempImageUrl + result.MobileUser.ImageUrl;
                            $scope.user.OfficePhone = result.MobileUser.OfficePhone;
                            $scope.user.Mobile = result.MobileUser.Mobile;
                            $scope.user.Appellation = result.MobileUser.Appellation;
                            $scope.GetBadge();
                            $state.go("home.index");
                        })
                    },
                    onFail: function (err) {
                        console.log("error fail:" + err)
                    }
                });
            })
            dd.error(function (err) {
                $scope.IsSSO = false;
                //钉钉验证出错
                console.log(err);
            })
        }
        document.addEventListener("deviceready", function () {
            if (window.plugins) {
                $scope.clientInfo.Platform = $cordovaDevice.getPlatform();
                $scope.clientInfo.UUID = $cordovaDevice.getUUID();

                if (window.plugins.jPushPlugin) {
                    // 获取JPushID
                    window.plugins.jPushPlugin.getRegistrationID(function (id) {
                        $scope.clientInfo.JPushID = id;
                        console.log("get jpubsh id:" + id);
                    });

                    // 注册消息推送内容点击事件
                    window.plugins.jPushPlugin.openNotificationInAndroidCallback = function (data) {
                        //data = JSON.parse(data);
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
        $scope.IsSSO = false;
        // 微信单点登录开始
        var code = commonJS.getUrlParam("code");
        var state = commonJS.getUrlParam("state");
        if (code && state) {// 微信单点登录
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
                    $rootScope.loginfrom = "wechat";
                    config.portalroot = result.PortalRoot;
                    $scope.user.ObjectID = result.MobileUser.ObjectID;
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
                    $scope.GetBadge();
                    //TODO:此处为默认路由，微信在表单返回时也会经过这里
                    //这里如果有跳转路由，会导致表单关闭后跳转到此路由
                    //$state.go("home.index");
                } else {
                    alert("登陆失败，请联系管理员！");
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
                    commonJS.showShortTop("远程服务链接错误，请稍候再试！");
                }
                else {
                    commonJS.showShortTop("您处理离线状态，请先检查网络！");
                }
            });
        }
        // End 微信单点登录结束
        //钉钉单点登录开始
        if (dd && dd.version) {
            $scope.dingLog = "登陆开始：" + new Date().Format("yyyy-MM-dd HH:mm:ss");
            $scope.IsSSO = true;
            commonJS.loadingHide();
            var _config = {}
            var sourceUrl = document.location.href;
            var url = sourceUrl.toLocaleLowerCase();
            $scope.serviceUrl = url.split("/" + $scope.UrlSplitStr + "/")[0];
            $http({
                url: $scope.serviceUrl + "/DingTalk/GetSignConfig",
                params: { url: sourceUrl }
            })
            .success(function (res) {
                console.log(res)
                //获取签名信息成功
                _config = res;
                // 配置jsAPI
                dd.config({
                    agentId: _config.agentId,
                    corpId: _config.corpId,
                    timeStamp: _config.timeStamp,
                    nonceStr: _config.nonce,
                    signature: _config.signature,
                    jsApiList: ['runtime.info',
                        'biz.contact.choose',
                        'device.notification.confirm',
                        'device.notification.alert',
                        'device.notification.prompt',
                        'biz.ding.post',
                    'runtime.permission.requestAuthCode',
                    'device.geolocation.get',
                    'biz.ding.post',
                    'biz.contact.complexChoose']
                })
                //alert("success end----------------")
                //执行签名信息验证和登录操作
                $scope.dingLog = $scope.dingLog + "||获取签名完成：" + new Date().Format("yyyy-MM-dd HH:mm:ss");
                $scope.ddReady();
            }).error(function (err) {
                console.log("Error:" + err)
            })
        }
        //End 钉钉单点登录结束

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
        }

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
    });