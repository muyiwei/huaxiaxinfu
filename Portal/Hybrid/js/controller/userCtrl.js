module.controller('userCtrl', function ($rootScope, $scope, $state, $http, $stateParams, $cordovaCamera, commonJS) {
    console.log("show user->" + $stateParams.id);
    commonJS.loadingShow();
    $scope.exception = false;
    $scope.userInfo = {};

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        if (!$rootScope.userIndex) $rootScope.userIndex = 0;
        if (!states.fromCache || $scope.exception) {
            $scope.init();
        }
    });

    $scope.init = function () {
        //if ($stateParams.id == $scope.user.ObjectID) {
        //    $scope.userInfo = $scope.user;
        //    console.log($scope.userInfo)
        //    commonJS.loadingHide();
        //}
        //else {// 从服务器读取用户信息
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/GetUserByObjectID?callback=JSON_CALLBACK&userCode=" + $scope.user.Code + "&mobileToken=" + $scope.user.MobileToken + "&targetUserId=" + $stateParams.id;
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
            $scope.userInfo.ObjectID = result.MobileUser.ObjectID;
            $scope.userInfo.Code = result.MobileUser.Code;
            $scope.userInfo.Name = result.MobileUser.Name;
            $scope.userInfo.MobileToken = result.MobileUser.MobileToken;
            $scope.userInfo.ImageUrl = result.MobileUser.ImageUrl ? $scope.setting.tempImageUrl + result.MobileUser.ImageUrl : "";
            $scope.userInfo.Email = result.MobileUser.Email;
            $scope.userInfo.DepartmentName = result.MobileUser.DepartmentName;
            $scope.userInfo.OfficePhone = result.MobileUser.OfficePhone;
            $scope.userInfo.WeChat = result.MobileUser.WeChat;
            $scope.userInfo.Mobile = result.MobileUser.Mobile;
            $scope.userInfo.Appellation = result.MobileUser.Appellation;
            $scope.exception = false;
            commonJS.loadingHide();
        })
        .error(function () {
            $scope.exception = true;
            commonJS.loadingHide();
            commonJS.showShortTop("获取用户信息失败，请稍候再试！");
        });
        //}
    }
    // 更改用户头像
    $scope.changeImage = function () {
        if ($scope.userInfo.ObjectID != $scope.user.ObjectID) return;
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
});