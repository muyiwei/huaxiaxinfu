formModule.factory("httpService", function ($http, $q, $rootScope) {
    var extend = function (o, n, override) {
        for (var p in n)
            if (n.hasOwnProperty(p) && (!o.hasOwnProperty(p) || override)) o[p] = n[p];
    };
    return {
        get: function (api, params) {
            // extend(params, { deskid: $rootScope.deskId, userid: $rootScope.userId });
            var deferred = $q.defer();
            $http({
                method: 'get',
                url: api,
                params: params,
                timeout: 30000
            }).success(function (res) {
                deferred.resolve(res);
            }).error(function (res, status) {
                if (status === 401 || status === 403) {
                    deferred.reject("请求超时");
                } else {
                    deferred.reject('网络连接出错！');
                }
            });
            return deferred.promise;
        },
        post: function (api, params) {
            extend(params, { deskid: $rootScope.deskId, userid: $rootScope.userId });
            var deferred = $q.defer();
            $http({
                method: 'post',
                url: api,
                params: params,
                timeout: 30000
            }).success(function (res) {
                deferred.resolve(res);
            }).error(function (res, status) {
                if (status === 401 || status === 403) {
                    deferred.reject("链接超时");
                } else {
                    deferred.reject('网络连接出错！');
                }
            });
            return deferred.promise;
        }
    };
})