/*
    应用中心-表单
*/

app.controller('EditBizObjectController', ['$rootScope', '$scope', '$http', '$location', '$stateParams',
   '$window', '$translate', '$state', 'ControllerConfig',
function ($rootScope, $scope, $http, $location, $stateParams, $window, $translate, $state, Controller) {
    $http({
        url: Controller.RunBizQuery.EditBizObjectSheet,
        params: {
            BizObjectID: "",
            SchemaCode: $stateParams.SchemaCode,
            SheetCode: $stateParams.SheetCode,
            Mode: $stateParams.Mode,
            IsMobile: false,
            EditInstanceData: "",
            rendom: new Date().getTime()
        }
    })
    .success(function (data) {
        if (data.Success) {
            var target = ".app-aside-right";
            var url = data.Message;
            if ($(target).length == 0) {
                window.location.href = url;
            } else {
                $(target).toggleClass("show");
                $(target).find("iframe").attr("src", url);
                if ($(target).hasClass("show")) {
                    $("body").addClass("noscroll");
                }
                else {
                    $("body").removeClass("noscroll");
                }
            }
        } else {
            //$rootScope.back();
            var message = $translate.instant("msgGlobalString.LackOfAuth");
            $.notify({ message: message, status: "danger" });
        }
    })
}]);