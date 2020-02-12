/*
    factory
*/
var app =
angular.module('app')
    //注册http响应超时拦截器
   .factory('httpInterceptor', ['$q', '$injector', function ($q, $injector) {
       var httpInterceptor = {
           'response': function (response) {
               //if (response.data && response.data.ExceptionCode == 1) {
               //    debugger;
               //    var url = window.location.href;
               //    var rootScope = $injector.get('$rootScope');
               //    window.localStorage.setItem("H3.redirectUrl", url);
               //    rootScope.$state.go("platform.login");
               //    return $q.reject(response);
               //}
               return response;
           }
       }
       return httpInterceptor;
   }]);