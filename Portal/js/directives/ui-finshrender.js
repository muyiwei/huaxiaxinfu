angular.module('app')
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