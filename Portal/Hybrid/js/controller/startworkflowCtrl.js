module.controller('startworkflowCtrl', function ($rootScope, $scope, $http, $state, $ionicSideMenuDelegate,
    $ionicLoading, $ionicModal, $window, $ionicListDelegate, $ionicSlideBoxDelegate, $ionicHistory, commonJS, focus) {
    commonJS.loadingShow();

    //是否是常用标签页 slectIndex==0 是
    $scope.tabNames = ['常用', '全部'];
    $scope.slectIndex = 0;
    $scope.activeSlide = function (index) {//点击时候触发
        $scope.slectIndex = index;
        $ionicSlideBoxDelegate.slide(index);
    };
    $scope.slideChanged = function (index) {//滑动时候触发
        $scope.slectIndex = index;
    };

    // 全部流程集合
    $scope.categories = [];
    // 常用流程数量
    $scope.FavoriteNum = 0;
    $scope.FavoriteNumBeforeSearch = 0;
    $scope.sourceCategories = null;
    $scope.userId = $scope.user.ObjectID;
    $scope.searchKey = "";
    $scope.SearchMode = false;
    $scope.loadCompleted = false;
    $scope.initCompleted = false;
    $scope.exception = false;
    $scope.lastLoadTime = new Date();

    // 每次进入View时触发
    $scope.$on("$ionicView.enter", function (scopes, states) {
        $scope.activeSlide(0);
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader("发起流程");
        }
        if ($scope.userId != $scope.user.ObjectID) {
            $scope.categories = [];
            $scope.loadWorkflows();
        }
        else {
            var dateNow = new Date();    //结束时间
            var times = dateNow.getTime() - $scope.lastLoadTime.getTime();  //时间差的毫秒数
            if (times > 1000 * 60 * 10 || $scope.exception) {// 超过10分钟，重新刷新一次
                $scope.lastLoadTime = new Date();
                $scope.loadWorkflows();
            }
        }
        //无常用流程自动切换到全部
        if ($scope.FavoriteNum == 0) {
            $scope.activeSlide(1);
        }
    });

    $scope.loadWorkflows = function () {
        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/LoadWorkflows?callback=JSON_CALLBACK&userCode=" + encodeURI($scope.user.Code) + "&mobileToken=" + $scope.user.MobileToken;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/LoadWorkflows";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) {
            $scope.url = $scope.setting.httpUrl.toLocaleLowerCase().split(config.portalroot.toLocaleLowerCase())[0];
            $scope.exception = false;
            $scope.categories = [];
            var FavoriteCategories = [];
            if (result.Workflows) {
                angular.forEach(result.Workflows, function (data, index, full) {
                    if (data.DisplayName == "FrequentFlow") {
                        angular.forEach(data.Workflows, function (Workflow) {
                            $scope.FavoriteNum++;
                            $scope.FavoriteNumBeforeSearch++;
                        })
                    } else {
                        $scope.categories.push(data);
                    }
                })
                if ($scope.FavoriteNum == 0) {
                    $scope.activeSlide(1);
                } else {
                    $scope.activeSlide(0);
                }
            }
            $scope.sourceCategories = JSON.stringify($scope.categories);
            $scope.initCompleted = true;
            commonJS.loadingHide();
        })
        .error(function () {
            console.log("加载发起出现异常");
            $scope.loadCompleted = true;
            $scope.exception = true;
            commonJS.loadingHide();
        })
    };

    // 设置流程是否常用
    $scope.changeFavorite = function (workflowCode, category) {
        $ionicListDelegate.closeOptionButtons();
        if (category == undefined) {
            angular.forEach($scope.categories, function (data, i, full) {
                angular.forEach(data.Workflows, function (Workflow, j, full) {
                    if (Workflow.WorkflowCode == workflowCode) {
                        Workflow.IsFavorite = false;
                        $scope.categories[i].Workflows[j].IsFavorite = false;
                        $scope.setFavorite(Workflow);
                    }
                })
            })
        }
        else {
            angular.forEach($scope.categories, function (data, i, full) {
                if (data.DisplayName == category) {
                    angular.forEach(data.Workflows, function (Workflow, j, full) {
                        if (Workflow.WorkflowCode == workflowCode) {
                            Workflow.IsFavorite = !Workflow.IsFavorite;
                            $scope.categories[i].Workflows[j].IsFavorite = Workflow.IsFavorite;
                            $scope.setFavorite(Workflow);
                        }
                    })
                }
            })
        }
        $scope.sourceCategories = JSON.stringify($scope.categories);
        event.stopPropagation();
    },
    $scope.setFavorite = function (workflow) {
        if (workflow.IsFavorite) {
            $scope.FavoriteNum++;
            $scope.FavoriteNumBeforeSearch++;
        }
        else {
            $scope.FavoriteNum--;
            $scope.FavoriteNumBeforeSearch--;
        }

        var url = "";
        var params = null;
        if (window.cordova) {
            url = $scope.setting.httpUrl + "/SetFavorite?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&workflowCode=" + workflow.WorkflowCode;
            url += "&isFavorite=" + workflow.IsFavorite;
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/SetFavorite";
            params = {
                userId: $scope.user.ObjectID,
                userCode: $scope.user.Code,
                mobileToken: $scope.user.MobileToken,
                workflowCode: workflow.WorkflowCode,
                isFavorite: workflow.IsFavorite
            }
        }
        commonJS.getHttpData(url, params)
        .success(function (result) { }).error(function () { });
        event.stopPropagation();
    },

    // 发起流程
    $scope.startWorkflow = function (workflowCode) {
        $scope.worksheetUrl = $scope.setting.startInstanceUrl + workflowCode + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.OpenStartInstanceSheet($scope, $scope.worksheetUrl);
    };

    // 搜索流程
    $scope.doSearch = function () {
        $scope.categories = JSON.parse($scope.sourceCategories);
        $scope.FavoriteNum = $scope.FavoriteNumBeforeSearch;
        $scope.SearchMode = false;
        if ($scope.searchKey) {
            $scope.SearchMode = true;
            for (var i = 0; i < $scope.categories.length; i++) {
                for (var j = 0; j < $scope.categories[i].Workflows.length; j++) {
                    if ($scope.categories[i].Workflows[j].DisplayName.indexOf($scope.searchKey) == -1) {
                        if ($scope.categories[i].Workflows[j].IsFavorite) {
                            $scope.FavoriteNum--;
                        }
                        $scope.categories[i].Workflows.splice(j, 1);
                        j--;
                    }
                }
                if ($scope.categories[i].Workflows.length == 0) {
                    $scope.categories.splice(i, 1);
                    i--;
                }
            }
        }
    };

    $scope.goBack = function () {
        $scope.CancelSearch();
        $state.go("home.index");
    }
    $scope.CancelSearch = function (event) {
        $scope.categories = JSON.parse($scope.sourceCategories);
        $scope.searchKey = "";
        $scope.SearchMode = false;
        $scope.FavoriteNum = $scope.FavoriteNumBeforeSearch;
    }
    $scope.loadWorkflows();
});