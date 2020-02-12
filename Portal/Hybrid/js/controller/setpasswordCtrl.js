module.controller('setpasswordCtrl', function ($scope, $ionicPlatform, $ionicPopup, $state, $http, $ionicSideMenuDelegate, commonJS) {
    $scope.sendData = {
        oldpassword: '',
        newpassword: '',
        confirmpassword: ''
    }

    $scope.save = function () {
        console.log($scope.sendData)
        if ($scope.sendData.newpassword != $scope.sendData.confirmpassword) {
            $scope.showAlert("提示", "输入的密码不匹配");
            return;
        }

        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/SetPassword?callback=JSON_CALLBACK&userId=" + $scope.user.ObjectID +
            "&userCode=" + $scope.user.Code +
            "&mobileToken=" + $scope.user.MobileToken +
            "&oldPassword=" + encodeURIComponent($scope.sendData.oldpassword) +
            "&newPassword=" + encodeURIComponent($scope.sendData.newpassword);
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/SetPassword";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                oldPassword: encodeURIComponent($scope.sendData.oldpassword),
                newPassword: encodeURIComponent($scope.sendData.newpassword)
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            console.log(result)
            if (result.Success) {
                $scope.showAlert("提示", result.Message, function (e) {
                    $scope.sendData = {
                        oldpassword: '',
                        newpassword: '',
                        confirmpassword: ''
                    }
                    $scope.goback();
                })
            } else {
                $scope.showAlert("提示", result.Message)
            }
        })
        .error(function (ex) {
            console.log(ex)
        })
    }


    $scope.goback = function () {
        $state.go("home.index");
    }

    // 一个确认对话框
    $scope.showConfirm = function (title, msg) {
        var confirmPopup = $ionicPopup.confirm({
            title: title,
            template: msg
        });
        confirmPopup.then(function (res) {
            if (res) {
                console.log('You are sure');
            } else {
                console.log('You are not sure');
            }
        });
    };
    // 一个提示对话框
    $scope.showAlert = function (title, msg, callbackfunction) {
        var alertPopup = $ionicPopup.alert({
            title: title,
            template: msg
        });
        alertPopup.then(callbackfunction);
    };
});
