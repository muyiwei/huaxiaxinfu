services.factory('httpService', function ($http, $q, commonJS) {
    var extend = function (o, n, override) {
        for (var p in n)
            if (n.hasOwnProperty(p) && (!o.hasOwnProperty(p) || override)) o[p] = n[p];
    };
    return {
        get: function (api, params, isJsonp) {
            // extend(params, { deskid: $rootScope.deskId, userid: $rootScope.userId });
            var deferred = $q.defer();
            if (!isJsonp) {
                $http({
                    method: 'get',
                    url: api,
                    params: params,
                    timeout: 30000
                }).success(function (res) {
                    //检测用户操作权限
                    if (res.hasOwnProperty("ExceptionCode") && res.ExceptionCode == 1) {
                        commonJS.TimeoutHandler(res);
                    }
                    deferred.resolve(res);
                }).error(function (res, status) {
                    if (status === 401 || status === 403) {
                        deferred.reject('请求超时');
                    } else {
                        deferred.reject('网络连接出错！');
                    }
                });
            } else {
                $http.jsonp(api).success(function (res) {
                    if (res.hasOwnProperty("ExceptionCode") && res.ExceptionCode == 1) {
                        commonJS.TimeoutHandler(res);
                    }
                    deferred.resolve(res);
                }).error(function (res, status) {
                    if (status === 401 || status === 403) {
                        deferred.reject('请求超时');
                    } else {
                        deferred.reject('网络连接出错！');
                    }
                });
            }
            return deferred.promise;
        },
        post: function (api, params) {
            var deferred = $q.defer();
            $http({
                method: 'post',
                url: api,
                data: params,
                timeout: 30000
            }).success(function (res) {
                //检测用户操作权限
                if (res.hasOwnProperty("ExceptionCode") && res.ExceptionCode == 1) {
                    commonJS.TimeoutHandler(res);
                }
                deferred.resolve(res);
            }).error(function (res, status) {
                if (status === 401 || status === 403) {
                    deferred.reject('链接超时');
                } else {
                    deferred.reject('网络连接出错！');
                }
            });
            return deferred.promise;
        }
    };
});
