module.controller('startworkflowCtrl', function ($scope, $rootScope, workflowService, $ionicSlideBoxDelegate, $ionicLoading, workflowService, commonJS,$ionicScrollDelegate,$timeout) {

    $scope.$on("$ionicView.enter", function (scopes, states) {
        //设置钉钉头部
        if ($rootScope.dingMobile.isDingMobile) {
            $scope.SetDingDingHeader($rootScope.languages.tabs.InitiateProcess);
            dd.biz.navigation.setRight({
                show: false,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                text: "",//控制显示文本，空字符串表示显示默认文本
                onSuccess: function (result) {
                },
                onFail: function (err) { }
            });
        }
        $scope.$on("$ionicView.beforeLeave", function (scopes, states) {
            $scope.searchMode = false;
            $scope.searchKey = "";
            $scope.blurOut();
        });

        
        if ($scope.frequentFlow.length == 0 && $scope.beforeLoadData==false) {
            $scope.activeSlide(1);
        }

    });

    $scope.slectIndex = 0;
    $scope.tabNames = $rootScope.languages.tabMyInstances.tab;
    $scope.sampleData = false;//是否存在样列数据
    $scope.tips = function (msg) {
        $ionicLoading.show({
            template: '<span class="setcommon f15">' + msg + '</span>',
            duration: 1.5 * 1000,
            animation: 'fade-in',
            showBackdrop: false,
        });
    };
    $scope.activeSlide = function (index) {
        $scope.slectIndex = index;
        $ionicSlideBoxDelegate.slide(index);
        $ionicScrollDelegate.$getByHandle("startWorkFlow").scrollTop();
    };
    //提示信息
    $scope.ShowTips = function (msg,time) {
        $ionicLoading.show({
            template: '<span class="setcommon f15">' + msg + '</span>',
            animation: 'fade-in',
            showBackdrop: false,
            duration: time ? time : (1.5 * 1000),
        })
    };

    $scope.beforeLoadData = true;//需求:如果常用流程没有，则自动跳到全部流程
    $scope.frequentFlow = [];
    $scope.listOfCategory = {
        'children':[]
    };//树
    //递归遍历树
    $scope.walkThrough = function (node, attr, value, callback) {
        if (node.children && node.children.length > 0) {
            for (var i = 0; i < node.children.length; i++) {
                if (node.children[i][attr] == value) {
                    if (typeof callback == "function") {
                        var token = callback(node.children[i]);
                        if (token !== undefined) { return token; }
                    }
                } else {
                    var token = $scope.walkThrough(node.children[i], attr, value, callback);
                    if (token !== undefined) { return token; }
                }
            }
        }
    };
    $scope.loadCategory = function (code) {
        commonJS.loadingShow();
        var url = "";
        var isJsonp = false;
        if (window.cordova) {
            isJsonp = true;
            url = $scope.setting.appServiceUrl + "/QueryWorkflowNodes?callback=JSON_CALLBACK";
            url += "&userCode=" + $scope.user.Code;
            url += "&Mode=" + "WorkflowTemplate";
            url += "&ShowFavorite=" + true;
            url += "&IsMobile=" + true;
            url += "&IsShared=" + false;
            url += "&IsAsync=" + true;
            url += "&SearchKey=" + "";
            url += "&Isbilingual=" + false;
            url += "&random=" + new Date().getTime();
            
            if (code) {
                url += "&ParentCode=" + code;
            } else {
                url += "&ParentCode=" + "";
            }
        } else {
            url = $scope.setting.httpUrl + "/Workflow/QueryWorkflowNodes";
        }

        var params = {
            IsAsync: true,
            IsMobile: true,
            random: new Date().getTime(),
            Mode : "WorkflowTemplate",
            ShowFavorite : true,
            IsShared : false,
            ParentCode : "",
            SearchKey : "",
            Isbilingual : false
        }
        if (code) {
            params['ParentCode'] = code;
        }
        workflowService.GetWorkflows(url, params, isJsonp).then(function (res) {
            if (typeof res == "string") return;//未登录
            $scope.beforeLoadData = false;
            if (!code) {
                //根目录
                for (var i = 0; i < res.length; i++) {
                    if (res[i].Code == "FrequentFlow") {
                        $scope.frequentFlow = res[i].children;
                    } else {
                        $scope.listOfCategory['children'].push(res[i]);
                    }
                }
                if ($scope.frequentFlow.length == 0) {
                    $scope.activeSlide(1);
                }
            } else {
                console.log("network!");
                $scope.walkThrough($scope.listOfCategory, 'Code', code, function (node) {
                    node.children = res;
                    node.showChildren = true;
                    if (!node.Title) {
                        node.Title = node.DisplayName;
                    }
                    for (var i = 0; i < res.length; i++) {
                        if (node.children[i].IsLeaf == false) {
                            node.children[i].Title = node.Title + ">" + node.children[i].DisplayName;
                        }
                    }

                    return true;
                });
            }
            $timeout(function () {
                $ionicScrollDelegate.resize();
            }, 0);
            commonJS.loadingHide();
        }, function (msg) {
            $scope.tips(msg);
            commonJS.loadingHide();
        });

    };
    $scope.ChangeFrequence = function (WorkflowCode,IsFrequence) {
        var url = "";
        var isJsonp = false;
        var params = {
            userId: $scope.user.ObjectID,
            userCode: $scope.user.Code,
            mobileToken: $scope.user.MobileToken,
            workflowCode: WorkflowCode,
            isFavorite: IsFrequence==1?false:true
        };
        if (window.cordova) {
            isJsonp = true;
            url = $scope.setting.appServiceUrl + "/SetFavorite?callback=JSON_CALLBACK";
            url += "&userId=" + $scope.user.ObjectID;
            url += "&mobileToken=" + $scope.user.MobileToken;
            url += "&workflowCode=" + WorkflowCode;
            url += "&isFavorite=" + (IsFrequence == 1 ? false : true);
        }
        else {
            url = $scope.setting.httpUrl + "/Mobile/SetFavorite";
        }
        
        workflowService.SetFavorite(url, params, isJsonp).then(function (res) {
            

            if (IsFrequence == 1) {
                $scope.ShowTips(config.languages.current.cancelFrequentSuc, 500);
            } else {
                $scope.ShowTips(config.languages.current.setFrequentSuc, 500);
            }

            

            if (IsFrequence == 1) {
                var index;
                for (var i = 0; i < $scope.frequentFlow.length; i++) {
                    if ($scope.frequentFlow[i].Code == WorkflowCode) {
                        index = i;
                        break;
                    }
                }
                $scope.frequentFlow.splice(index, 1);
            } 
            $scope.walkThrough($scope.listOfCategory, "Code", WorkflowCode, function (node) {
                if (node.Frequent == 1) {
                    node.Frequent = 0;
                } else {
                    node.Frequent = 1;
                    $scope.frequentFlow.push(node);
                }
            });

        }.bind({$scope:$scope}), function (msg) {
            $scope.tips(msg);
        });
    }
    $scope.startWorkflow = function (workflowCode) {
        var absurl = {
            state: 'tab.startworkflow',
            tab: $scope.slectIndex
        }
        window.localStorage.setItem("absurl", JSON.stringify(absurl));
        $scope.worksheetUrl = $scope.setting.startInstanceUrl + workflowCode + "&LoginName=" + encodeURI($scope.user.Code) + "&LoginSID=" + $scope.clientInfo.UUID + "&MobileToken=" + $scope.user.MobileToken;
        commonJS.OpenStartInstanceSheet($scope, $scope.worksheetUrl);
    };
    $scope.showMore = function (code) {
        var check = $scope.walkThrough($scope.listOfCategory, 'Code', code, function (node) {
            if (node.children instanceof Array) {
                node.showChildren = !node.showChildren;
                return true;
            } else {
                return false;
            }
        });
        if (!check) {
            $scope.loadCategory(code);
        }
    };
    

    


    //搜索相关
    $scope.searchKey = "";
    $scope.searchMode = false;
    $scope.searchResultList = {};//根据关键词保存搜索结果
    $scope.presentResults = [];//当前搜索结果
    $scope.searchResultHandler = function (searchResult) {
        //处理搜索结果数据
        var data = {
            "children":[]
        }
        //丢弃常用意见
        for (var i = 0; i < searchResult.length; i++) {
            if (searchResult[i].Code != "FrequentFlow") {
                data.children.push(searchResult[i]);
            }
        }
        var tmpData = [];
        $scope.walkThrough(data, "IsLeaf", true, function (node) {
            tmpData.push(node);
        });
        return tmpData;
    }
    $scope.CancelSearch = function () {
        $scope.searchMode = false;
        $scope.searchKey = "";
    }

    $scope.search = function () {
        //为空
        if ($scope.searchKey == "" || $scope.searchKey.trim()=="") {
            $scope.tips(config.languages.current.searcKeyCantBeEmpty);
            $scope.searchKey = "";
            return;
        }
        $scope.searchMode = true;
        //结果已经缓存
        if ($scope.searchResultList[$scope.searchKey]) {
            $scope.presentResults = $scope.searchResultList[$scope.searchKey];
            return;
        }
        commonJS.loadingShow();
        var url = "";
        var isJsonp = false;
        if (window.cordova) {
            isJsonp = true;
            url = $scope.setting.appServiceUrl + "/QueryWorkflowNodes?callback=JSON_CALLBACK";
            url += "&userCode=" + $scope.user.Code;
            url += "&IsAsync=" + true;
            url += "&IsMobile=" + true;
            url += "&random=" + new Date().getTime();
            url += "&search=" + $scope.searchKey;
            url += "&SearchKey=" + $scope.searchKey;
            url += "&ShowFavorite=" + false;
            url += "&Mode=" + "WorkflowTemplate";
            url += "&IsShared=" + false;
            url += "&ParentCode=" + "";
            url += "&Isbilingual=" + false;
        } else {
            url = $scope.setting.httpUrl + "/Workflow/QueryWorkflowNodes";
        }
        var params = {
            IsAsync: true,
            IsMobile: true,
            random: new Date().getTime(),
            //limit: 10,
            //offset: 0,
            //order: 'asc'
            search: $scope.searchKey,
            SearchKey: $scope.searchKey,
            ShowFavorite: false,
            Mode: "WorkflowTemplate"
        }
        workflowService.search(url, params, isJsonp).then(function (res) {
            var data = $scope.searchResultHandler(res);
            $scope.presentResults = data;
            $scope.searchResultList[$scope.searchKey] = data;//缓存
            commonJS.loadingHide();
        }, function (msg) {
            $scope.tips(msg);
            commonJS.loadingHide();
        })

    };
    $scope.focus = false;
    $scope.focusIn = function () {
        $scope.focus = true;
    };
    $scope.blurOut = function () {
        if ($scope.searchKey === '' || $scope.searchKey.trim()==='') {
            $scope.searchKey = '';
            $scope.focus = false;
        }else{
            $scope.focus = true;
        }
    }


    $scope.init = function () {
        /*处理微信的表单返回*/
        if ($rootScope.loginInfo.loginfrom == "wechat" && $scope.JumpParams.tab) {
            $scope.slectIndex = $scope.JumpParams.tab;
            $scope.renderJumpParams();
        }
        $scope.loadCategory();
    }
    $scope.init();

});