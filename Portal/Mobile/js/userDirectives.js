angular.module("starter.directives", [])
.directive('bpmSheetUserSelected', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            selectUsers: '=',
            cancelSelected: '='
        },
        templateUrl: '/Portal/Mobile/templates/sheetUserSelected.html?r=20180223c',
    }
}).directive('mykeyboard', ['$ionicScrollDelegate', '$timeout', function ($ionicScrollDelegate, $timeout) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {

            if (!(window.cordova && ionic.Platform.isAndroid())) return;

            scope.$on("keyboardshow", function (e, m) {
                //filter键盘聚焦和不能滑倒最底部的bug
                if ($(element).find("ion-footer-bar").length != 0) {
                    $(element).find("ion-footer-bar").css({ "bottom": m + "px" });
                    $(element).find("ion-content").css({ "bottom": 0 + m + 44 + "px" });
                    var input = $(element).find("input:focus");
                    var offset = input.offset().top - $(element).find(".scroll").offset().top;
                    var handle = $(element).find("ion-content").attr("delegate-handle");
                    if (handle) {
                        $ionicScrollDelegate.$getByHandle(handle).scrollTo(0, offset - 30, true);
                        $ionicScrollDelegate.$getByHandle(handle).resize();
                    }
                } else {

                }
            });



            scope.$on("keyboardhide", function (e, m) {
                if ($(element).find("ion-footer-bar").length != 0) {
                    $(element).find("ion-footer-bar").removeAttr("style");
                    $(element).find("ion-content").removeAttr("style");
                    var handle = $(element).find("ion-content").attr("delegate-handle");
                    if (handle) {
                        $ionicScrollDelegate.$getByHandle(handle).resize();
                    }
                } else {

                }
            });
        },
    }
}])
    //ng-repeat渲染完成执行函数
.directive('uiFinshedRender', ['$timeout', '$interval', function ($timeout, $interval) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var interval = $interval(function () {
                if (scope.$last === true) {
                    var linkFunc = scope.$eval('[' + attrs.uiFinshedRender + ']')[0];
                    $interval.cancel(interval);
                    linkFunc();
                }
            }, 100);
        }
    }
}]);