angular.module('app')
  .directive('filestyle', [function () {
      return {
          restrict: 'A',
          link: function (scope, element) {
              var options = element.data();
              options.classInput = element.data('classinput') || options.classInput;
              element.filestyle(options);
          }
      };
  }]);