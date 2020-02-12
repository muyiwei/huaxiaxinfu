module.controller('appCenterItemCtrl', function ($scope, $rootScope, $ionicHistory, $state, commonJS, appCenterService, focus, $stateParams, queryService) {

    $scope.init = function () {
        $scope.show = false;//控制标题栏是否显示
        $scope.transrate = 0;//控制标题栏透明度


        window.console.log($stateParams);
        $scope.AppCode = $stateParams.AppCode;
        $scope.DisplayName = $stateParams.DisplayName;

        ////缓存和获取缓存AppCode
        //if (!$scope.AppCode) {
        //    $scope.AppCode = window.localStorage.getItem("appCenter.AppCode");
        //    $scope.DisplayName = window.localStorage.getItem("appCenter.DisplayName");
        //} else {
        //    window.localStorage.setItem("appCenter.AppCode", $scope.AppCode);
        //    window.localStorage.setItem("appCenter.DisplayName", $scope.DisplayName);
        //} 

        //初次访问微应用的时候,定时检查登录状态，成功才开始执行进入微应用
        var timer = setInterval(function () {
            if ($rootScope.loginInfo.success) {
                $scope.getFunctions();
                clearInterval(timer);
            }
        }, 200);
  

    };
    //显示控制器
    $scope.$on('$ionicView.enter', function () {

        //每次更新都更新这两个缓存避免多个应用中心造成冲突 hxc
        window.localStorage.setItem("appCenter.AppCode", $scope.AppCode);
        window.localStorage.setItem("appCenter.DisplayName", $scope.DisplayName);

        $rootScope.hideTabs = false;
        console.log("ionicView.enter");
        //设置钉钉头部
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader($scope.DisplayName);
            dd.biz.navigation.setRight({
                show: false,
            });
            // 重新定义钉钉端左侧导航栏按钮会造成无法获取到上一页从而在ios端中点击返回无效，此段代码可屏蔽
            dd.biz.navigation.setLeft({
                show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                text: $rootScope.languages.back,//控制显示文本，空字符串表示显示默认文本
                onSuccess: function (result) {
                    var target = commonJS.getUrlParam("target");
                    if (target == "appCenterItem") {
                        dd.biz.navigation.close({});
                    } else {
                        $ionicHistory.goBack();
                    }
                },
                onFail: function (err) { }
            });
        }
    });

    $scope.goBack = function _goBack() {
        if (window.localStorage.getItem("OThinker.H3.Mobile.WeChat.WeChatUrl")) {
            var _num = window.localStorage.getItem("OThinker.H3.Mobile.WeChat.WeChatUrl").indexOf('?');
            var _lastNum = window.localStorage.getItem("OThinker.H3.Mobile.WeChat.WeChatUrl").lastIndexOf('#');
            var _href = window.localStorage.getItem("OThinker.H3.Mobile.WeChat.WeChatUrl").substring(_num, _lastNum);
            $rootScope.loginInfo.success = true;
            var href = window.location.origin + window.location.pathname + _href + "#/tab/appCenter";
            window.location.href = href;
        } else {
            $state.go("tab.appCenter");
        }
    }


    $scope.changeOtherContentShow = function () {
        $scope.otherContentShow = !$scope.otherContentShow;
    }
    $scope.changeContentShow = function (item) {
        item.contentShow = !item.contentShow;
    }

    $scope.getFunctions = function () {
       
        var url = $scope.setting.httpUrl + '/mobile/GetFunctions';
        var options = {
            AppCode: $scope.AppCode
        };
        $scope.data = [];
        if (window.cordova) {
            url = $scope.setting.appServiceUrl + '/GetFunctions?callback=JSON_CALLBACK';
            url += '&mobileToken=' + $scope.user.MobileToken;
            url += '&userCode=' + $scope.user.Code;
            url += '&AppCode=' + $scope.AppCode;
        }

        commonJS.loadingShow();
        appCenterService.getFunctions(url, options, window.cordova).then(function (result) {
            commonJS.loadingHide();
            $scope.data = result;
            //相关显示
            $scope.otherShow = false;
            $scope.otherNumber = 0;
            $scope.otherContentShow = true;
            for (var i = 0; i < $scope.data.length; i++) {
                if ($scope.data[i].Children.length == 0) {
                    $scope.otherShow = true;
                    $scope.otherNumber++;
                    $scope.data[i] = $scope.Workflowdata($scope.data[i]); //改变数据
                } else {
                    $scope.data[i].contentShow = true;
                    for (var j = 0; j < $scope.data[i].Children.length; j++) {
                        $scope.data[i].Children[j] = $scope.Workflowdata($scope.data[i].Children[j]); //改变数据
                    }
                }
            }
        }, function (reason) {
            commonJS.loadingHide();
            commonJS.showShortMsg("setcommon f15", reason, 2000);
        })
    }
    //改变数据
    /*autor;TLL  2018-2-26
    *为每一组数据增加Type(1为标准默认配置，2为发起流程链接，3为外部链接 ,4为打开表单);  data.Code作为发起流程链接提取WorkflowCode
    */
    $scope.Workflowdata = function (data) {
        var regex = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
        var reg = new RegExp("WorkflowCode=([^&]*)(&|$)");
        var WorkflowCode = '';
        if (data.Url && regex.test(data.Url)) {
            data.Type = 3;
        }
        else if (data.Url && data.Url.toLowerCase().indexOf(config.portalroot.toLowerCase()) != -1) {
            var r = data.Url.match(reg);
            if (r != null) WorkflowCode = unescape(r[1]);
            data.Type = 2;
            data.Code = WorkflowCode;
        } else {
            data.Type = 1;
            if (data.Url.indexOf('app.EditBizObject') > -1) {
                data.Type = 4;
                data.Url = $scope.ConvertBizObjectUrl(data.Url);
            }
        }
        return data;
    };

    //对打开表单的连接地址进行转化
    $scope.ConvertBizObjectUrl = function (Url) {
        var url = "";
        url = Url.slice(0, Url.length - 1).replace("app.EditBizObject(", "");
        return url;
    }
    // 发起流程
    $scope.startWorkflow = function (workflowCode) {
        $scope.worksheetUrl = $scope.setting.startInstanceUrl + workflowCode + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.OpenStartInstanceSheet($scope, $scope.worksheetUrl);
    };

    //打开连接
    $scope.openLink = function (url) {
        commonJS.openWorkItem($scope, url + "?t=" + Math.random());
    }
    //打开流程表单
    $scope.editBizObjet = function (obj) {
        var obj = eval("(" + obj + ")");
        //独立APP、移动端
        var url = $scope.setting.httpUrl + "/RunBizQuery/EditBizObjectSheet";
        var isJsonp = false;
        var param = null;
        if (window.cordova) {
            isJsonp = true;
            url = $scope.setting.appServiceUrl + '/EditBizObjectSheet?callback=JSON_CALLBACK';
            url += '&mobileToken=' + $scope.user.MobileToken;
            url += '&userCode=' + $scope.user.Code;
            url += '&BizObjectID=';
            url += '&SchemaCode=' + obj.SchemaCode;
            url += '&SheetCode=' + obj.SheetCode
            url += '&Mode=' + obj.Mode;
            url += '&IsMobile=true';
            url += '&EditInstanceData=';
            url += '&rendom=' + new Date().getTime();
        } else {
            param = {
                BizObjectID: "",
                SchemaCode: obj.SchemaCode,
                SheetCode: obj.SheetCode,
                Mode: obj.Mode,
                IsMobile: true,
                EditInstanceData: "",
                rendom: new Date().getTime()
            };
        }
        queryService.EditBizObjectSheet(url, param, isJsonp).then(function (data) {
            if (data.Success) {
                var setting = JSON.parse(window.localStorage.getItem('OThinker.H3.Mobile.Setting'));
                bizObjectUrl = setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0] + data.Message + "&loginfrom=" + $rootScope.loginfrom + "&T=" + new Date().getTime();
                commonJS.openWorkItem($scope, bizObjectUrl);
            } else {
                commonJS.showShortTop(data.Message);
            }
        })
    }
    $scope.init();
});