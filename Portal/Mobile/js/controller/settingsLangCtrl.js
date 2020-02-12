var settingsLang = module.controller('settingsLangCtrl', function ($scope, $rootScope, $state, $ionicHistory, loginService, $ionicLoading, commonJS, SettingService) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $rootScope.hideTabs = false;
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
    });
    $scope.init = function () {
        $scope.initSettings();//系统设置
        $scope.initLanguages();//语言设置

    };
    /*********系统设置***************/
    $scope.initSettings = function () {
        //设置页面 返回
        $scope.goback = function () {
            $ionicHistory.goBack();
        };
    }
    /*********语言切换***************/
    $scope.initLanguages = function () {
        $scope.languages = [
               { text: "中文", value: "zh_cn" },
               { text: "English", value: "en_us" }
        ];

        //语言页面 完成  返回
        $scope.gobackSetting = function () {
            $scope.isLanguages = false;
            if (ionic.Platform.isAndroid() && $rootScope.dingMobile.isDingMobile) {
                $(document).trigger("backbutton");
            } else {
                $ionicHistory.goBack();
            }
        };
        $scope.changelanguages = function () {
            //改变语言并缓存
            window.localStorage.setItem('H3.Language', $scope.$parent.H3.language);
            if ($scope.$parent.H3.language == 'en_us') {
                config.languages.current = config.languages.en;
            } else if ($scope.$parent.H3.language == 'zh_cn') {
                config.languages.current = config.languages.zh;
            }

            if (window.cordova) {
                var url = $scope.setting.appServiceUrl + "/SetLanguage?callback=JSON_CALLBACK";
                url += "&userCode=" + $scope.user.Code;
                url += "&mobileToken=" + $scope.user.MobileToken;
                url += "&languageKey=" + $scope.$parent.H3.language;
                SettingService.SetLanguage(url, null, true).then(function (res) { });
            } else {
                var url = $scope.setting.httpUrl + '/mobile/SetLanguage';
                var params = {
                    languageKey: $scope.$parent.H3.language
                };
                SettingService.SetLanguage(url,params, false).then(function (res) { });
            }
            commonJS.setLanguages();
            $scope.gobackSetting();
        };
    }
    $scope.init();
});
