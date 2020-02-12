var rootpath = '/Portal';

var services = angular.module('starter.services', [])
  //任务服务
  .factory('workItemService', function (httpService) {
      return {
          //获取待办,待阅数量
          GetWorkItemCount: function (url, params, isJsonp) {
              return httpService.get(url, params, isJsonp);
          },
          //获取待办任务
          GetUnfinishedWorkItems: function (url, params, isJsonp) {
              return httpService.get(url, params, isJsonp);
          },
          //获取已办任务
          GetFinishedWorkItems: function (url, params, isJsonp) {
              return httpService.get(url, params, isJsonp);
          },
          //获取未读,已读任务
          GetUnReadWorkItems: function (url, params, isJsonp) {
              return httpService.get(url, params, isJsonp);
          },
          //移除待阅任务
          RemoveReadWorkItem: function (url, params, isJsonp) {
              return httpService.get(url, params, isJsonp);
          },
      };
  })
  //登录服务
    .factory('loginService', function (httpService) {
        return {
            //登录
            login: function (url, params, isJsonp) {
                if (isJsonp) {
                    return httpService.get(url, params, isJsonp);
                } else {
                    return httpService.post(url, params, isJsonp);
                }
            },
            //登出
            logout: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            },
            //更新jpushID
            UpdateJpushID: function (url) {
                return httpService.get(url, {}, true);
            }
        };
    })
    //流程服务
    .factory('workflowService', function (httpService) {
        return {
            //登录
            GetWorkflows: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            },
            //设置为常用
            SetFavorite: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            },
            //搜索
            search: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        };
    })
    //我的流程服务
    .factory('instanceService', function (httpService) {
        return {
            loadInstances: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
    //应用中心
    .factory('appCenterService', function (httpService) {
        return {
            //一级
            getAppList: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            },
            //二级
            getFunctions: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
    .factory('queryService', function (httpService) {
        return {
            EditBizObjectSheet: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
    //查询列表服务
    .factory("queryListService", function (httpService) {
        return {
            //获得查询列表的列和查询条件
            GetList: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
    //获取用户信息
    .factory("getUserInfo", function (httpService) {
        return {
            //获得查询列表的列和查询条件
            Get: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
  //通讯录
    .factory("OrgInfoService", function (httpService) {
        return {
            //获得组织架构信息
            GetOrgInfo: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })
    //设置
    .factory("SettingService", function (httpService) {
        return {
            //获得组织架构信息
            SetLanguage: function (url, params, isJsonp) {
                return httpService.get(url, params, isJsonp);
            }
        }
    })







