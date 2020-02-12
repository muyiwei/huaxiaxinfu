angular.module("formApp.services")
.factory("$SheetQuery", ['$http', '$q', '$sce', '$ionicActionSheet', function ($http, $q, $sce, $ionicActionSheet) {
    return {
        QueryData: function (params) {
            var defered = $q.defer();
            $http({
                method: 'Get',
                url: $.MvcSheetUI.PortalRoot + "/BizQueryHandler/BizQueryHandler",
                params: params
            }).
                success(function (data, status, headers, config) {
                    defered.resolve(data);
                }).
                error(function (data, status, headers, config) {
                    defered.reject(data);
                })
            return defered.promise;
        }
    }
}])