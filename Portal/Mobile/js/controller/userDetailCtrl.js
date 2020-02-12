module.controller('userDetailCtrl', function ($scope, $rootScope, $stateParams, $ionicHistory, $cordovaCamera, commonJS) {
    $scope.$on("$ionicView.enter", function (scopes, states) {
        console.log("show user->" + $stateParams.id);
        commonJS.loadingShow();
        $scope.init();
    });
    //设置页面 返回
    $scope.goback = function () {
        $ionicHistory.goBack();
    };
    //初始化获取用户信息
    $scope.init = function () {
        $scope.userInfo = {};
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.appServiceUrl + "/GetUserByObjectID?callback=JSON_CALLBACK&userCode=" + $scope.user.Code + "&mobileToken=" + $scope.user.MobileToken + "&targetUserId=" + $stateParams.id;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/GetUserByObjectID";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                targetUserId: $stateParams.id
            }
        }
        commonJS.getHttpData(url, params)
            .success(function (result) {
                console.log(result.MobileUser)
                $scope.userInfo = result.MobileUser;
                $scope.exception = false;
                commonJS.loadingHide();
            })
            .error(function () {
                $scope.exception = true;
                commonJS.loadingHide();
                commonJS.showShortTop("获取用户信息失败，请稍候再试！");
            });
    }
    // 更改用户头像
    $scope.changeImage = function () {
        if ($scope.userInfo.ObjectID != $scope.$parent.user.ObjectID) return;
        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 100,
            targetHeight: 100,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            correctOrientation: true
        };

        $cordovaCamera.getPicture(options)
            .then(function (result) {
                $scope.userInfo.ImageUrl = result;
                $scope.user.ImageUrl = result;
                $scope.uploadImage(result);
            },
            function (error) {
            });
    };
    // 异步上传图片
    $scope.uploadImage = function (fileUrl) {
        var options = new FileUploadOptions();
        options.fileKey = "userImage";
        options.fileName = fileUrl.substr(fileUrl.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.params = { UserID: $scope.user.ObjectID, MobileToken: $scope.user.MobileToken };
        var ft = new FileTransfer();
        ft.upload(
            fileUrl,
            $scope.setting.uploadImageUrl,
            function (result) { },
            function (error) { },
            options);
    };
    // 点击电话
    $scope.openTel = function () {
        event.stopPropagation();
    }
});