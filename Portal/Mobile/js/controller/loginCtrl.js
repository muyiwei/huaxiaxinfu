module.controller('loginCtrl', function ($scope, $rootScope, $ionicHistory, $state, commonJS, loginService, focus) {

    $scope.init = function () {
        //显示控制器
        $scope.$on('$ionicView.enter', function () {
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            $rootScope.hideTabs = false;
            console.log("ionicView.enter");
            $scope.autoLogin();
        });
        $scope.show = false;//控制标题栏是否显示
        $scope.transrate = 0;//控制标题栏透明度
    };
    //登录页面查看密码
    $scope.showPassword = false;
    $scope.togglePassword = function ($event) {
        $scope.showPassword = !$scope.showPassword;
    }
    //跳转settings
    $scope.goSettings = function () {
        $state.go('settings');
    }




    //自动登录
    $scope.changeAutoLogin = function () {
        window.localStorage.setItem('OThinker.H3.Mobile.Setting', JSON.stringify($scope.$parent.setting));
    }
    $scope.autoLogin = function () {
        if (!window.localStorage.getItem('OThinker.H3.Mobile.Setting')) {
            //用户清除缓存无法自动登录
            return;
        }
        var auto = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.Setting')).autoLogin;
        if (auto) {
            var user = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.User'));
            $scope.$parent.user.code = user.Code;
            $scope.$parent.user.password = user.Password;
            $scope.validateUser();
        }
    }

    //登录逻辑
    $scope.validateUser = function () {
        if (!$scope.$parent.user.Code) {
            focus("userCode");
            commonJS.showShortMsg("setcommon f15", $rootScope.languages.enterUserName, 2000);
            return;
        }
        if (!$scope.$parent.user.Password) {
            focus("userPassword");
            commonJS.showShortMsg("setcommon f15", $rootScope.languages.enterPassword, 2000);
            return;
        }
        var url = '';
        if (window.cordova) {
            if ($scope.user.MobileToken || $scope.user.Password) {
                //某些手机在启动时获取不到JPushID
                if ($scope.clientInfo.JPushID == '') {
                    if (window.plugins && window.plugins.jPushPlugin) {
                        window.plugins.jPushPlugin.getRegistrationID(function (id) {
                            $scope.clientInfo.JPushID = id;
                            url = $scope.setting.appServiceUrl + '/UpdateJpushID?callback=JSON_CALLBACK';
                            url += "&jpushId=" + $scope.clientInfo.JPushID;
                            url += "&jpushId=" + $scope.clientInfo.JPushID;
                            url += '&userCode=' + $scope.user.Code;
                            loginService.UpdateJpushID(url);
                        });
                    }
                }
                var pwd = $scope.user.Password.replace(/&/g, '_38;_');
                url = $scope.setting.appServiceUrl + '/ValidateLogin?callback=JSON_CALLBACK';
                url += '&userCode=' + $scope.user.Code;
                url += '&password=' + encodeURIComponent(pwd);
                url += '&uuid=' + $scope.clientInfo.UUID;
                url += '&jpushId=' + $scope.clientInfo.JPushID;
                url += '&mobileToken=' + $scope.user.MobileToken;
                url += '&mobileType=' + $scope.clientInfo.Platform;
                url += '&isAppLogin=true';
            }
        }
        else {//浏览器
            url = $scope.setting.httpUrl + '/Organization/LoginIn';
        }
        //浏览器
        commonJS.loadingShow();
        options = {
            userCode: $scope.$parent.user.Code,
            password: $scope.$parent.user.Password,
            rendom: new Date().getTime()
        };
        loginService.login(url, options, window.cordova).then(function (result) {
            commonJS.loadingHide();
            console.log(result);
            if (result.Success == true) {
                //登录成功
                $rootScope.loginInfo.success = true;
                $ionicHistory.clearCache();
                $ionicHistory.clearHistory();
                config.portalroot = result.PortalRoot.toLocaleLowerCase();
                $scope.$parent.user.ObjectID = result.User.ObjectID;
                $scope.$parent.user.ParentID = result.User.ParentID;
                $scope.$parent.user.DirectParentUnits = result.DirectoryUnits;
                $scope.$parent.user.Code = result.User.Code;
                $scope.$parent.user.Name = result.User.Name;
                $scope.$parent.user.Gender = result.User.Gender;
                $scope.$parent.user.MobileToken = result.User.MobileToken;
                if (result.User.ImageUrl.indexOf("/user") > -1) {
                    result.User.ImageUrl = "";
                }
                $scope.$parent.user.ImageUrl = result.User.ImageUrl == "" ? "" :  result.User.ImageUrl;
                $scope.$parent.user.Email = result.User.Email;
                $scope.$parent.user.DepartmentName = result.User.DepartmentName;
                $scope.$parent.user.OfficePhone = result.User.OfficePhone;
                $scope.$parent.user.Mobile = result.User.Mobile;
                $scope.$parent.user.WeChat = result.User.WeChat;
                $scope.$parent.user.Appellation = result.User.Appellation;

                //所在部门信息-报表筛选条件
                $rootScope.departmentInfo = {};
                $rootScope.departmentInfo.UserName = result.User.Name;
                $rootScope.departmentInfo.UserId = result.User.ObjectID;
                $rootScope.departmentInfo.DepartmentName = result.OUDepartName;
                $rootScope.departmentInfo.DepartmentId = result.User.ParentID;
                if (result.User.DefaultLanguage) {
                    window.localStorage.setItem('H3.Language', result.User.DefaultLanguage)
                    commonJS.setLanguages();
                };

                // 存储最近一次登录的用户信息
                window.localStorage.setItem("OThinker.H3.Mobile.User", JSON.stringify($scope.user));
                // 登录成功，转向主页面
                $state.go("tab.home");


            } else {
                //登录失败
                commonJS.showShortMsg("setcommon f15", $rootScope.languages.loginError, 2000);
            }
        }, function (reason) {
            commonJS.loadingHide();
            commonJS.showShortMsg("setcommon f15", reason, 2000);
        })
    };
    $scope.init();
});
