var settings = module.controller('settingsCtrl', function ($scope, $rootScope, $state, $ionicHistory, loginService, $ionicLoading, commonJS,$timeout) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $rootScope.hideTabs = true;
        //设置钉钉头部
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader($rootScope.languages.login.systemSetting);
            dd.biz.navigation.setRight({
                show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                text: $rootScope.languages.confirm,//控制显示文本，空字符串表示显示默认文本
                onSuccess: function (result) {
                    $scope.setIP();
                },
                onFail: function (err) { }
            });

            //这个方法可以保证ios和按卓下的钉钉的返回是ionic式的返回 hxc
            //TODO 封装成一个共有方法，在每一个view调用
            //钉钉ios返回键
            dd.biz.navigation.setLeft({
                show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                showIcon: true,//是否显示icon，true 显示， false 不显示，默认true； 注：具体UI以客户端为准
                text: '',//控制显示文本，空字符串表示显示默认文本
                onSuccess: function (result) {
                    $ionicHistory.goBack();
                },
                onFail: function (err) {
                }
            });
            //钉钉安卓返回
            if (ionic.Platform.isAndroid()) {
                $(document).unbind('backbutton').bind('backbutton', function (e) {
                    e.preventDefault();
                    $ionicHistory.goBack();
                });
            }
            //-----------end-------------
        }
        /*********设置ip***************/
        $scope.settingIP = window.localStorage.getItem('OThinker.H3.Mobile.setIP') || $scope.setting.appServiceUrl;
        window.localStorage.setItem('OThinker.H3.Mobile.setIP', $scope.settingIP);
        $scope.settingUser = $scope.$parent.user;
    });
    $scope.init = function () {
        $scope.ShowIPSetting = window.cordova;
        $scope.initSettings();//系统设置
        $scope.initIP();//设置IP
        $scope.hideOther = $rootScope.dingMobile.hideOther;//区别钉钉微信隐藏退出按钮
    };
    /*********系统设置***************/
    $scope.initSettings = function () {
        //设置页面 返回
        $scope.goback = function () {
            $ionicHistory.goBack();
        };
        $scope.logout = function () {
            $scope.$parent.setting.autoLogin = false;
            $scope.$parent.user.ObjectID = "";//不存在ObjectID，则不会出现头像
            window.localStorage.setItem('OThinker.H3.Mobile.Setting', JSON.stringify($scope.$parent.setting));
            // 清理页面缓存
            window.sessionStorage.clear();
            var url = $scope.setting.httpUrl + '/Organization/LoginOut';
            var isJsonp = false;
            if (window.cordova) {
                url = $scope.setting.httpUrl + '/Organization/LoginOutMobile?callback=JSON_CALLBACK';
                isJsonp = true;
            }
            loginService.logout(url, null, isJsonp).then(function (result) {
                $state.go("login");
            }, function (reanson) {
                commonJS.showShortTop(reanson);
                $state.go("login");
            });
        };
        //设置页面 进入语言选项
        $scope.goUserDetail = function () {
            $state.go("userDetail", { id: $scope.$parent.user.ObjectID });
        };
        //设置页面 进入用户详情页
        $scope.goLanguage = function () {
            $state.go("language");
        };
    }
    /*********设置ip***************/
    $scope.initIP = function () {
        $scope.settingIP = window.localStorage.getItem('OThinker.H3.Mobile.setIP') || $scope.setting.appServiceUrl;
        window.localStorage.setItem('OThinker.H3.Mobile.setIP', $scope.settingIP);
        $scope.validateIp = function () {
            var ip = $scope.settingIP;
            var tmp = ip.split('.');
            var flag = true;
            if (tmp.length != 4) { flag = false; }
            tmp.forEach(function (v, i) {
                if (v == '') {
                    flag = false;
                }
                if (isNaN(Number(v)) == true) {
                    flag = false;
                }
                if (Number(v) > 255 || Number(v) < 0) {
                    flag = false;
                }
            });
            return flag;
        };
    };
    $scope.setIP = function () {
        window.localStorage.setItem('OThinker.H3.Mobile.setIP', $scope.settingIP);
        $scope.setting.appServiceUrl = window.localStorage.getItem('OThinker.H3.Mobile.setIP') || '127.0.0.1';
        if (window.cordova) {
            $scope.getWorkItemUrl();//app重新更新存储路径
        }
        $ionicLoading.show({
            template: '<span class="setcommon f15">' + $rootScope.languages.setSuccess + '</span>',
            duration: 1 * 1000,
            animation: 'fade-in',
            showBackdrop: false,
        });
    };

    $scope.setIPAndGoBack = function () {
        $scope.setIP();
        $timeout(function () {
            $ionicHistory.goBack();
        }, 1500);
    }

    $scope.getWorkItemUrl = function () {
        var url = $scope.setting.appServiceUrl;
        if ($rootScope.loginInfo.loginfrom == "app") {
            url = $scope.setting.appServiceUrl.substring(0, $scope.setting.appServiceUrl.lastIndexOf("/"));
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
        $scope.setting.httpUrl = url;
        $scope.setting.serviceUrl = url;
        $scope.setLocalStorage();
    };

    $scope.CheckService = function () {
        window.open($scope.settingIP, "_system");
    };

    $scope.init();
});
