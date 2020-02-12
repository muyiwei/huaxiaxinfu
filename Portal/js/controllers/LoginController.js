app.controller('LoginController', ['$rootScope', '$scope', '$translate', '$http', '$location', '$state', '$stateParams', '$timeout', '$interval', 'ControllerConfig',
function ($rootScope, $scope, $translate, $http, $location, $state, $stateParams, $timeout, $interval, Controller) {
    $scope.LoginSuccess = true;
    $scope.ConnectionFailed = true;
    $scope.EnginePasswordValid = true;//引擎密码错误
    $rootScope.$on('$viewContentLoaded', function () {
    });

    // 获取语言
    $rootScope.$on('$translateChangeEnd', function () {
        $scope.getLanguage();
        $state.go($state.$current.self.name, {}, { reload: true });
    });
    $scope.getLanguage = function () {
        $scope.LanJson = {
            Code: $translate.instant("LoginController.EnterName"),
            Password: $translate.instant("LoginController.EnterPassword")
        }
        if ($scope.LanJson.Code == "LoginController.EnterName") {
            $scope.LanJson = {
                Code: "请输入用户名",
                Password: "请输入密码"
            }
        }
    }
    $scope.getLanguage();


    //钉钉单点登录开始
    // 处理单点登录
    $scope.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    };

    var loginFrom = $scope.getUrlParam("loginfrom");
    var state = $scope.getUrlParam("state");
    var code = $scope.getUrlParam("code");
    var workItemID = $scope.getUrlParam("WorkItemID")
    //根据URL参数判断是否钉钉登录
    if (loginFrom == "dingtalk") { //TODO
        $scope.IsSSO = true;
        debugger;
        //commonJS.loadingHide();
        if (code && state && !workItemID) {
            $scope.LoginSuccess = true;
            $.ajax({
                url: "Organization/ValidateLoginForDingTalkPC",
                data: {
                    state: state,
                    code: code
                },
                async: false,
                success: function (result) {
                    $scope.$emit("LoginIn", result);
                    // 设置主界面
                    if (result.Success) {
                        var redirectUrl = window.localStorage.getItem("H3.redirectUrl");
                        if (redirectUrl && redirectUrl != "" && redirectUrl.indexOf("Redirect.html") != -1) {
                            window.localStorage.setItem("H3.PortalRoot", result.PortalRoot);
                            window.localStorage.setItem("H3.redirectUrl", "");
                            $timeout(function () {
                                window.location.href = redirectUrl;
                            }, 500)
                        } else {
                            //去掉参数,跳转到待办页面
                            var rUrl = window.location.href.replace(window.location.search, "")
                            var index = rUrl.indexOf("#/");
                            rUrl = rUrl.substring(0, index);
                            window.location.href = rUrl + "#/app/Workflow/MyUnfinishedWorkItem"
                        }
                        $scope.LoginSuccess = true;
                    }

                }
            });
        }
    }

    $scope.loginIn = function () {
        $scope.userCode = $("#txtUser").val();
        $scope.userPassword = $("#txtPassword").val();
        if ($scope.userCode == "" || $scope.userCode == undefined) {
            focus("userCode");
            return;
        }
        if ($scope.userPassword == "" || $scope.userPassword == undefined) {
            focus("userPassword");
            return;
        }

        $http({
            url: Controller.Organization.LoginIn,
            method:"post",
            data: {
                userCode: this.userCode,
                password: this.userPassword,
                rendom: new Date().getTime()
            }
        })
        .success(function (result, header, config, status) {
            $scope.$emit("LoginIn", result);
            // 设置主界面
            if (result.Success) {
                var redirectUrl = window.localStorage.getItem("H3.redirectUrl");
                if (redirectUrl && redirectUrl != "" && redirectUrl.indexOf("Redirect.html") != -1) {
                    window.localStorage.setItem("H3.PortalRoot", result.PortalRoot);
                    window.localStorage.setItem("H3.redirectUrl", "");
                    $timeout(function () {
                        window.location.href = redirectUrl;
                    }, 500)
                } else {
                    $state.go("app.MyUnfinishedWorkItem", { TopAppCode: "Workflow" });
                }
                $scope.LoginSuccess = true;
            }
            else {
                if (result.Message == "ConnectionFailed") {
                    $scope.ConnectionFailed = false;
                    if (!$scope.ConnectionFailed) {
                        $interval(function () {
                            $scope.ConnectionFailed = true;
                        }, 5000);
                    }
                }
                else if (result.Message == "EnginePasswordInvalid") {
                    $scope.EnginePasswordValid = false;//引擎密码错误
                    if (!$scope.EnginePasswordValid) {
                        $interval(function () {
                            $scope.EnginePasswordValid = true;
                        }, 5000);
                    }
                }
                else {
                    $scope.LoginSuccess = false;
                    if (!$scope.LoginSuccess) {
                        $interval(function () {
                            $scope.LoginSuccess = true;
                        }, 3000);
                    }
                }
            }
        })
        .error(function (data, header, config, status) {

        });
    }
}]);