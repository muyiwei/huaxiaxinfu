module.controller('instanceStateCtrl', function ($scope, $http, $ionicTabsDelegate, $stateParams, $timeout, $ionicActionSheet, $ionicScrollDelegate, commonJS, focus) {
    $scope.InstanceID = $stateParams.InstanceID;
    $scope.WorkflowCode = $stateParams.WorkflowCode;
    $scope.WorkflowVersion = $stateParams.WorkflowVersion;

    var url = document.location.href.toLocaleLowerCase();
    $scope.serviceUrl = url.split("/Hybrid/")[0] + "/WeChat/LoadInstanceState";

    var PortalRoot = $scope.serviceUrl.substring(0, $scope.serviceUrl.indexOf("/WeChat/"));
    PortalRoot = PortalRoot.substring(PortalRoot.lastIndexOf("/"), PortalRoot.length);

    $scope.init = function () {
        $scope.userId = $scope.user.ObjectID;
        $http({
            url: $scope.serviceUrl,
            params: {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                instanceId: $scope.InstanceID
            }
        })
        .success(function (result) {
            console.log(result);
            if (result.SUCCESS) {
                $scope.BaseInfo = result.BaseInfo;//流程基本信息
                $scope.LogInfo = result.InstanceLogInfo;//流程日志
            } else {
                $scope.IsOriginate = true;
            }
        }).then(function () {
            MobileLoader.ShowWorkflow($scope.InstanceID, $scope.WorkflowCode, $scope.WorkflowVersion, PortalRoot);
        });
    }
    if ($scope.InstanceID == "") {
        $scope.IsOriginate = true;
        $timeout(function () {
            MobileLoader.ShowWorkflow($scope.InstanceID, $scope.WorkflowCode, $scope.WorkflowVersion, PortalRoot);
        }, 500);
    } else {
        $scope.IsOriginate = false;
        $scope.init();
    }
    $scope.GoBack = function () {
        window.history.back();
    }
});