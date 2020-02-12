module.controller("loginCtrl",
    function ($rootScope, $scope, $ionicPlatform, $state, $http, $ionicHistory, $interval, commonJS, focus) {
        commonJS.loadingShow();
        $scope.SignInTitle = "H3 BPM";
        $scope.loginError = false;

        $scope.$on("$ionicView.enter", function (scopes, states) {
        });

        $scope.validateUser = function (submitLogin) {
            // MobileToken不为空或者密码不为空
            if (submitLogin) {
                commonJS.loadingShow();
            }
            if (!$scope.user.Code) {
                focus("userCode");
                commonJS.loadingHide();
                commonJS.showShortTop("请输入账号！");
                return;
            }
            if (submitLogin && !$scope.user.Password) {
                focus("userPassword");
                commonJS.loadingHide();
                commonJS.showShortTop("请输入密码！");
                return;
            }
            var url = "";
            var params = null;
            if (window.cordova) {
                if ($scope.user.MobileToken || $scope.user.Password) {
                    //某些手机在启动时获取不到JPushID
                    if ($scope.clientInfo.JPushID == "") {
                        if (window.plugins && window.plugins.jPushPlugin) {
                            window.plugins.jPushPlugin.getRegistrationID(function (id) {
                                $scope.clientInfo.JPushID = id;
                            });
                        }
                    }
                    var pwd = $scope.user.Password.replace(/&/g, "_38;_");
                    url = $scope.setting.httpUrl + "/ValidateLogin?callback=JSON_CALLBACK";
                    url += "&userCode=" + $scope.user.Code;
                    url += "&password=" + encodeURIComponent(pwd);
                    url += "&uuid=" + $scope.clientInfo.UUID;
                    url += "&jpushId=" + $scope.clientInfo.JPushID;
                    url += "&mobileToken=" + $scope.user.MobileToken;
                    url += "&mobileType=" + $scope.clientInfo.Platform;
                    url += "&isAppLogin=true";
                }
            }
            else {//微信，钉钉登录
                if ($scope.user.Code && $scope.user.Password) {
                    commonJS.loadingShow();
                    url = $scope.setting.httpUrl + "/Organization/LoginIn";
                    params = {
                        userCode: $scope.user.Code,
                        password: $scope.user.Password,
                        rendom: new Date().getTime()
                    };
                };
            }
            commonJS.getHttpData(url, params)
            .success(function (result) {
                commonJS.loadingHide();
                if (result.Success) {
                    $ionicHistory.clearCache();
                    $ionicHistory.clearHistory();
                    config.portalroot = result.PortalRoot.toLocaleLowerCase();
                    $scope.user.ObjectID = result.User.ObjectID;
                    $scope.user.Code = result.User.Code;
                    $scope.user.Name = result.User.Name;
                    $scope.user.MobileToken = result.User.MobileToken;

                    if (result.User.ImageUrl.indexOf("/user") > -1) {
                        result.User.ImageUrl = "";
                    }

                    $scope.user.ImageUrl = result.User.ImageUrl == "" ? "" : $scope.setting.tempImageUrl + result.User.ImageUrl;
                    $scope.user.Email = result.User.Email;
                    $scope.user.DepartmentName = result.User.DepartmentName;
                    $scope.user.OfficePhone = result.User.OfficePhone;
                    $scope.user.Mobile = result.User.Mobile;
                    $scope.user.WeChat = result.User.WeChat;
                    $scope.user.Appellation = result.User.Appellation;
                    // 存储最近一次登录的用户信息
                    window.localStorage.setItem("OThinker.H3.Mobile.User", JSON.stringify($scope.user));
                    $scope.user.Password = "";
                    // 登录成功，转向主页面
                    $rootScope.$broadcast("LoginIn", "");
                    $state.go("home.index");
                } else {
                    if (submitLogin) {
                        $scope.user.Password = "";
                        focus("userPassword");
                        commonJS.loadingHide();
                        commonJS.showShortTop("账号或密码不对！");
                    }
                }
            })
            .error(function () {
                commonJS.loadingHide();
                if (commonJS.checkOnline()) {
                    commonJS.showShortTop("远程服务链接错误，请稍候再试！");
                }
                else {
                    commonJS.showShortTop("您处理离线状态，请先检查网络！");
                }
            })
        };
        $scope.doSetting = function () {
            $state.go("setting");
        };

        if (!$scope.isLoginOut && $scope.setting.autoLogin && $scope.user.MobileToken) {
            // 自动登录模式
            document.addEventListener("deviceready", function () {
                if (window.plugins) {
                    if (commonJS.checkOnline()) {
                        var logininterval = $interval(function () {
                            if ($scope.clientInfo.JPushID == "") {
                                if (window.plugins && window.plugins.jPushPlugin) {
                                    window.plugins.jPushPlugin.getRegistrationID(function (id) {
                                        $scope.clientInfo.JPushID = id;
                                    });
                                }
                            }
                            if ($scope.clientInfo.JPushID != "") {
                                $interval.cancel(logininterval);
                                $scope.validateUser(false);
                            }
                        }, 1000)
                    }
                }
            });
        }
        else {
            commonJS.loadingHide();
        }

        // 焦点定位于用户名框
        if (!$scope.user.Code) {
            focus("userCode");
        }
        else if ($scope.isLoginOut || !$scope.setting.autoLogin || !$scope.user.MobileToken) {
            focus("userPassword");
        }
    });
