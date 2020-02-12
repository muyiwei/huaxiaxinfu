angular.module('app')
  .directive('replaceNull', [function () {
      return {
          require: "ngModel",
          link: function (scope, el, attrs, ctrl) {
              ctrl.$formatters.push(function (value) {
                  if (value == "null") return "";
                  return value || "";
              });
          }
      };
  }]);