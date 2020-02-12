module.controller('queryListCtrl', ['$scope', "$rootScope", "$ionicLoading", "$compile", "$ionicSlideBoxDelegate", "$ionicModal", "commonJS", "$ionicScrollDelegate", "$http", "$stateParams", "$state", "$ionicHistory", "queryListService", "$interval", "getUserInfo", "$q", "$timeout", "$sce",
    function ($scope, $rootScope, $ionicLoading, $compile, $ionicSlideBoxDelegate, $ionicModal, commonJS, $ionicScrollDelegate, $http, $stateParams, $state, $ionicHistory, queryListService, $interval, getUserInfo, $q, $timeout, $sce) {

        $scope.DisplayName = $stateParams.DisplayName;
        $scope.FunctionCode = $stateParams.FunctionCode;//该查询列表的编码
        $scope.QueryCode = $stateParams.QueryCode;//流程数据或主数据配置的查询列表编码
        $scope.TopAppCode = $stateParams.TopAppCode;//所属应用编码
        $scope.SchemaCode = $stateParams.SchemaCode;//涉及到的流程数据或主数据的编码



        $scope.uniqueCode = $scope.FunctionCode;
        commonJS.sideSlip($scope, 'templates/queryListFilterNew.html', true, true).then(function () {
            $($scope.popover.$el[0]).find("ion-popover-view").addClass($scope.uniqueCode);
            $scope.finterContainer = $($scope.popover.$el[0]).find("ion-content .scroll");
        });



        //标记是否从选人页面返回
        $scope.choosingFlag = false;
        $rootScope.$on("chooseOU", function (e, data) {
            $scope.choosingFlag = true;
        });
        //根据id存储所选的人或部门
        $scope.choosedUO = {};
        $scope.goSheetUser = function (id, type) {
            //type==1 选人 type==2 选部门
            $scope.popover.hide();
            $scope.choosedId = id;
            if ($scope.choosedUO[id]) {
                $rootScope.filterUsers = $scope.choosedUO[id];
            } else {
                $rootScope.filterUsers = null;
            }
            $state.go("sheetUser", { 'isQueryList': true, 'queryListType': type });
        }

        $scope.$on('$ionicView.enter', function (scopes, states) {
            //window.sessionStorage.setItem("H3.queryListCtrl.decodeURI.hash", decodeURI(window.location.hash));
            if ($scope.choosingFlag) {
                $scope.popover.show();
                if ($rootScope.filterUsers instanceof Array) {//无值
                    $scope.choosedUO[$scope.choosedId] = null;
                    $scope.finterContainer.find("#" + $scope.choosedId).html(config.languages.current.queryList.PleaseSelect);
                } else {//有值
                    $scope.choosedUO[$scope.choosedId] = angular.copy($rootScope.filterUsers);
                    $scope.finterContainer.find("#" + $scope.choosedId).html($rootScope.filterUsers.Name);
                }
            }


            //设置钉钉头部
            if ($rootScope.dingMobile.isDingMobile) {
                $scope.SetDingDingHeader($scope.DisplayName);
                dd.biz.navigation.setRight({
                    show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                    control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                    text: $rootScope.languages.filter,//控制显示文本，空字符串表示显示默认文本
                    onSuccess: function (result) {
                        $scope.openPopover();
                    },
                    onFail: function (err) { }
                });
                dd.biz.navigation.setLeft({
                    show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                    control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                    text: $rootScope.languages.back,//控制显示文本，空字符串表示显示默认文本
                    onSuccess: function (result) {
                        $scope.backToAppCenter();
                    },
                    onFail: function (err) { }
                });
            }

        });
        $scope.$on('$ionicView.beforeLeave', function (scopes, states) {
            $scope.popover.hide();
            $scope.choosingFlag = false;
        }); 




        //返回应用中心
        $scope.backToAppCenter = function () {
            //应用中心有表单，从表单返回$ionicHistory失效
            //$ionicHistory.goBack();  
            //window.location.href = window.location.href.substring(0, window.location.href.indexOf("#")) + window.sessionStorage.getItem("H3.queryListCtrl.decodeURI.hash")
            var appDisplayName = window.localStorage.getItem("appCenter.DisplayName");
            $state.go("appCenterItem", { 'AppCode': $scope.TopAppCode, 'DisplayName': appDisplayName });
        };
        //提示信息
        $scope.ShowTips = function (msg) {
            $ionicLoading.show({
                template: '<span class="setcommon f15">' + msg + '</span>',
                animation: 'fade-in',
                showBackdrop: false,
                duration: 1.5 * 1000,
            })
        };



        // 打开流程表单
        $scope.openBizObject = function (bizObjectId) {
            if (!bizObjectId) return;
            var eidtAction = $scope.GetAction("Edit");
            $scope.worksheetUrl = $scope.setting.openBizObjectUrl + "?BizObjectID=" + bizObjectId + "&SchemaCode=" + $scope.SchemaCode + "&SheetCode=" + eidtAction.BizSheetCode + "&Mode=Work&IsMobile=true";
            commonJS.OpenBizObjectUrl($scope, $scope.worksheetUrl);
        };
        //获取指定ActionCode的方法
        $scope.GetAction = function (ActionCode) {
            var action = {};
            $scope.pageModel.BizQueryActions.forEach(function (n, i) {
                if (ActionCode == n.ActionCode) {
                    action = n;
                }
            });
            return action;
        };
        // 增加一条数据
        $scope.startWorkflow = function (BizSheetCode) {
            $scope.worksheetUrl = $scope.setting.openBizObjectUrl + "?SheetCode=" + BizSheetCode + "&Mode=Originate&SchemaCode=" + $scope.SchemaCode + "&IsMobile=true";
            commonJS.OpenBizObjectUrl($scope, $scope.worksheetUrl);
        };




        //筛选条件第一次加载（ng-repeat执行完执行）
        $scope.FinishedFunc = function () {
            var promise = $scope.SetDefaultSearchValue();//需要请求数据，由id或code取得用户的全部信息
            if (promise.length == 0) {
                //无请求
                $timeout(function () {
                    $scope.pageModel.params.filterStr = $scope.GetSearchConditions();
                }, 0);
            } else {
                commonJS.loadingShow();
                $q.all(promise).then(function () {
                    $scope.pageModel.params.filterStr = $scope.GetSearchConditions();
                    commonJS.loadingHide();
                });
            }

        };
        //获得用户的基本信息UserID/Code
        $scope.getUserInfo = function (UserID, callback) {
            var that = this;
            var param = { UserID: UserID, Propertystr: "Name;Gender;ObjectID;UnitType;ImageUrl" };
            var promise = getUserInfo.Get("/Portal/SheetUser/GetUserProperty", param, false).then(function (res) {
                if (!res) { return; }
                if (typeof callback == "function") {
                    callback(res);
                }
            }, function (msg) {
                $scope.ShowTips(msg);
            });
            return promise;
        }
        //设置查询条件默认值/重置
        $scope.SetDefaultSearchValue = function () {
            $scope.choosedUO = {}; //清空选人控件的值
            var promiseArray = [];//选人控件有默认值会请求数据
            var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
            angular.forEach($scope.pageModel.FilterData, function (data, index, full) {
                //设置成中文值
                if (array.indexOf(data.PropertyName) != -1) {
                    data.PropertyName = config.languages.current.ConditionColumns[data.PropertyName];
                }
                //范围查询不设置默认值
                if (!(data.FilterType == 2 && (data.LogicType == 'DateTime' || data.LogicType == 'Int' || data.LogicType == 'Double'))) {
                    //文本，时间
                    if (data.DisplayType == 0) {
                        $scope.finterContainer.find("#" + data.PropertyCode + "").val(data.DefaultValue);
                    }
                        //下拉框
                    else if (data.DisplayType == 1) {
                        $scope.finterContainer.find("." + data.PropertyCode).parent(".cItem").removeClass("selected");
                        $scope.finterContainer.find("." + data.PropertyCode + "[data-value='" + data.DefaultValue + "']").parent(".cItem").addClass("selected");
                    }
                        //单选按钮
                    else if (data.DisplayType == 2) {
                        $scope.finterContainer.find("." + data.PropertyCode).parent(".cItem").removeClass("selected");
                        $scope.finterContainer.find("." + data.PropertyCode + "[data-value='" + data.DefaultValue + "']").parent(".cItem").addClass("selected");
                    }
                        //复选按钮
                    else if (data.DisplayType == 3) {
                        $scope.finterContainer.find("." + data.PropertyCode).parent(".cItem").removeClass("selected");
                        var a = data.DefaultValue.split(";");
                        angular.forEach(a, function (value, index, full) {
                            if (value != null && value != "") {
                                $scope.finterContainer.find("." + data.PropertyCode + "[data-value='" + value + "']").parent(".cItem").addClass("selected");
                            }
                        })
                    }
                        //选人控件
                    else if (data.DisplayType == 5) {
                        if (data.DefaultValue != "") {
                            var promise = $scope.getUserInfo(data.DefaultValue, function (res) {
                                var obj = {};
                                obj.Code = res.ObjectID;
                                obj.Name = res.Name;
                                if (res.UnitType == 4) {
                                    obj.ContentType = "U";
                                } else if (res.UnitType == 1) {
                                    obj.ContentType = "O"
                                }
                                obj.UserGender = res.Gender;
                                obj.UserImageUrl = res.ImageUrl;
                                $scope.finterContainer.find("#" + data.PropertyCode + "").html(obj.Name);
                                $scope.choosedUO[data.PropertyCode] = obj;
                            });
                            promiseArray.push(promise);
                        } else {
                            $scope.finterContainer.find("#" + data.PropertyCode + "").html(config.languages.current.queryList.PleaseSelect);
                        }

                    }
                } else {
                    //范围查询需要清空值
                    if (data.LogicType == 'DateTime') {
                        angular.element($scope.finterContainer.find("#" + data.PropertyCode)).scope().startTime = "";
                        angular.element($scope.finterContainer.find("#" + data.PropertyCode + "1")).scope().endTime = "";
                    } else {
                        $scope.finterContainer.find("#" + data.PropertyCode).val("");
                        $scope.finterContainer.find("#" + data.PropertyCode + "1").val("");
                    }
                }



            })
            return promiseArray;
        };
        //获取查询条件值
        $scope.GetSearchConditions = function () {
            var condition = {};
            angular.forEach($scope.pageModel.FilterData, function (data, index, full) {
                if (data.DisplayType == 0) {
                    if (data.FilterType == 2 && (data.LogicType == 'DateTime' || data.LogicType == 'Int' || data.LogicType == 'Long' || data.LogicType == 'Double')) {
                        //范围查询
                        if (data.LogicType == 'DateTime') {
                            var start = $scope.finterContainer.find("#" + data.PropertyCode + "").html();
                            var end = $scope.finterContainer.find("#" + data.PropertyCode + "1").html();
                        } else {
                            var start = $scope.finterContainer.find("#" + data.PropertyCode + "").val();
                            var end = $scope.finterContainer.find("#" + data.PropertyCode + "1").val();
                        }
                        if (data.LogicType == 'DateTime' && start != "" && end != "") {

                            if (new Date(start).getTime() > new Date(end).getTime()) {
                                $scope.ShowTips(config.languages.current.queryList.InvalidDateTime);
                                $scope.finterContainer.find("#" + data.PropertyCode + "1").css("color", "red");
                                return false;
                            } else {
                                $scope.finterContainer.find("#" + data.PropertyCode + "1").css("color", "#555");
                            }

                        } else {
                            if (parseFloat(start) > parseFloat(end)) {
                                $scope.ShowTips(config.languages.current.queryList.InvalidNumber);
                                $scope.finterContainer.find("#" + data.PropertyCode + "1").css("color", "red");
                                return false;
                            } else {
                                $scope.finterContainer.find("#" + data.PropertyCode + "1").css("color", "#555");
                            }
                        }
                        condition[data.PropertyCode] = { start: start, end: end };

                    } else {
                        condition[data.PropertyCode] = $scope.finterContainer.find("#" + data.PropertyCode + "").val();
                    }
                } else if (data.DisplayType == 1) {
                    //下拉
                    $scope.finterContainer.find("." + data.PropertyCode + "").each(function (i, v) {
                        if ($(v).parent(".cItem").hasClass("selected")) {
                            condition[data.PropertyCode] = $(v).data('value');
                            return;
                        }
                    });
                    if (condition[data.PropertyCode] == undefined) {
                        condition[data.PropertyCode] = "";
                    }
                }
                else if (data.DisplayType == 2) {
                    //单选
                    $scope.finterContainer.find("." + data.PropertyCode + "").each(function (i, v) {
                        if ($(v).parent(".cItem").hasClass("selected")) {
                            condition[data.PropertyCode] = $(v).data('value');
                            return;
                        }
                    });
                    if (condition[data.PropertyCode] == undefined) {
                        condition[data.PropertyCode] = "";
                    }
                } else if (data.DisplayType == 3) {
                    //复选
                    condition[data.PropertyCode] = "";
                    $scope.finterContainer.find("." + data.PropertyCode + "").each(function (i, v) {
                        if ($(v).parent(".cItem").hasClass("selected")) {
                            condition[data.PropertyCode] += $(v).data('value') + ";";
                        }
                    });
                } else if (data.DisplayType == 5) {
                    //选人
                    if ($scope.choosedUO[data.PropertyCode]) {
                        condition[data.PropertyCode] = $scope.choosedUO[data.PropertyCode].Code;
                    } else {
                        condition[data.PropertyCode] = "";
                    }
                }
            })
            condition = JSON.stringify(condition);
            console.log(condition);
            return condition;
        };
        //重置查询条件
        $scope.ResetFilter = function () {
            var promises = $scope.SetDefaultSearchValue();
            if (promises.length == 0) {
                //无请求
                $ionicScrollDelegate.scrollTop(false);
                $timeout(function () {
                    $scope.pageModel.params.filterStr = $scope.GetSearchConditions();
                    $scope.pageModel.refresh();
                    $scope.popover.hide();
                }, 10);
            } else {
                $q.all(promises).then(function () {
                    $ionicScrollDelegate.scrollTop(false);
                    $timeout(function () {
                        $scope.pageModel.params.filterStr = $scope.GetSearchConditions();
                        $scope.pageModel.refresh();
                        $scope.popover.hide();
                    }, 10);
                    
                });
            }

        }
        //确认查询
        $scope.confirmFilter = function () {
            $ionicScrollDelegate.scrollTop(false);
            $timeout(function () {
                $scope.pageModel.params.filterStr = $scope.GetSearchConditions();
                $scope.pageModel.refresh();
                $scope.popover.hide();
            }, 10);
            
        }
        //筛选条件中的单选的下拉点击事件
        $scope.RadioClick = function ($event) {
            var c = $($event.target).parent(".cItem");
            c.siblings(".cItem").removeClass("selected");
            if (c.hasClass("selected")) {
                c.removeClass("selected");
            } else {
                c.addClass("selected");
            }
        }
        //筛选条件中的多选点击事件
        $scope.CheckboxClick = function ($event) {
            var c = $($event.target).parent(".cItem");
            if (c.hasClass("selected")) {
                c.removeClass("selected");
            } else {
                c.addClass("selected");
            }
        }

        //数据加载：下拉刷新，加载更多
        $scope.pageModel = {
            params: {
                sEcho: 1,//第几次查询
                iDisplayLength: 10,
                iDisplayStart: 0,
                schemaCode: $scope.SchemaCode,
                queryCode: $scope.QueryCode,
                isMobile: true,
                InputMapping: '',
                filterStr: "{}"//查询条件
            },
            pageIndex: 1,
            url: $scope.setting.httpUrl + "/RunBizQuery/GetGridDataForPortal",
            isJsonp: false,
            GirdColumns: null,//要显示的列 只需要第一次返回并保存
            FilterData: null,//后台返回的筛选条件 只需要第一次返回并保存
            BizQueryActions: null,//可以执行的操作添加删除编辑
            DisplayFormats: null,//显示列的格式化
            HasSheet: false,//主数据无法添加
            filterRows: function (item) {//根据要显示的列过滤同时格式化 
                var filter = [];
                for (var f in this.GirdColumns) {
                    if (!this.GirdColumns.hasOwnProperty(f)) { continue; }
                    filter.push(this.GirdColumns[f].name);
                }
                var array = ["Name", "CreatedBy", "CreatedByParentId", "OwnerId", "OwnerParentId", "CreatedTime", "ModifiedTime"];
                var tmp = {};
                tmp.required = {};//name和id为必须项
                tmp.configed = {};
                for (var a in item) {
                    if (!item.hasOwnProperty(a)) { continue; }
                    var originValue = angular.copy(item[a]);
                    if (filter.indexOf(a) != -1) {


                        if (typeof item[a] == "string" && item[a].match(/^\/Date\(\d+\)\/$/g)) {
                            //日期
                            var num = item[a].match(/\d+/)[0];
                            if (Object.keys(this.DisplayFormats).indexOf(a) != -1) {
                                item[a] = new Date(parseInt(num)).Format(this.DisplayFormats[a]);
                            } else {
                                item[a] = new Date(parseInt(num)).Format("yyyy-MM-dd");
                            }
                        } else if (Object.keys(this.DisplayFormats).indexOf(a) != -1) {
                            var format = this.DisplayFormats[a];
                            format = format.replace(/\{[a-zA-Z0-9]+\}/, item[a]);
                            item[a] = format;
                        }


                        if (typeof item[a] == "string") {
                            item[a] = $sce.trustAsHtml(item[a]);
                        }


                        if (array.indexOf(a) != -1) {
                            tmp.configed[config.languages.current.ConditionColumns[a]] = item[a];
                        } else {
                            for (var i = 0; i < this.GirdColumns.length; i++) {
                                if (this.GirdColumns[i].name == a) {
                                    tmp.configed[this.GirdColumns[i].display] = item[a];
                                }
                            }
                        }

                    }
                    if (a == 'ObjectID' || a == "Name") {//无论查询怎么设置，必须有id和name
                        tmp.required[a] = originValue;
                    }
                }
                return tmp;
            },
            items: [],//所有数据项
            isRequest: false,
            isMore: true,
            refresh: function () {
                var that = this;
                this.pageIndex = 1;
                this.params.iDisplayStart = 0;
                this.items = [];
                this.isMore = true;
                this.loadData(function (res, self) {
                    that.loadCallback(res, self);
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            loadMore: function () {
                var that = this;
                this.loadData(function (res, self) {
                    that.loadCallback(res, self);
                    $scope.$broadcast('scroll.infiniteScrollComplete');//是否有在来不及渲染筛选条件之前渲染请求第二次数据？hxc
                });
            },
            loadData: function (sucCallback) {
                var that = this;
                if (this.isRequest == true) {
                    console.log("repeat network!");
                    return;
                }
                if (this.isMore == false) {
                    console.log("no more data!");
                    return;
                }
                this.isRequest = true;
                if (window.cordova) {
                    this.isJsonp = true;
                    this.url = $scope.setting.appServiceUrl + "/GetQuerySettingAndData?callback=JSON_CALLBACK";
                    this.url += '&mobileToken=' + $scope.user.MobileToken;
                    this.url += '&userCode=' + $scope.user.Code;
                    this.url += '&sEcho=' + $scope.pageModel.params.sEcho;
                    this.url += '&iDisplayLength=' + $scope.pageModel.params.iDisplayLength;
                    this.url += '&iDisplayStart=' + $scope.pageModel.params.iDisplayStart;
                    this.url += '&schemaCode=' + $scope.pageModel.params.schemaCode;
                    this.url += '&queryCode=' + $scope.pageModel.params.queryCode;
                    this.url += '&isMobile=' + $scope.pageModel.params.isMobile;
                    this.url += '&InputMapping=' + $scope.pageModel.params.InputMapping;
                    this.url += '&filterStr=' + $scope.pageModel.params.filterStr;
                }
                queryListService.GetList(this.url, this.params, this.isJsonp).then(function (res) {
                    if (typeof sucCallback == "function") {
                        sucCallback(res, that);
                    }
                    that.isRequest = false;
                }, function (msg) {
                    $scope.ShowTips(msg);
                    that.isRequest = false;
                });
               
            },
            loadCallback: function (res, self) {
                console.log(self.params.sEcho);
                console.log(self.pageIndex);
                console.log(self.params.iDisplayStart);
                if (self.params.sEcho == 1) {
                    self.FilterData = res.Extend.ActionFilter.Data.Extend.FilterData;
                    self.GirdColumns = res.Extend.ActionFilter.Data.Extend.GirdColumns;
                    self.BizQueryActions = res.Extend.ActionFilter.Data.Extend.BizQueryActions;
                    self.DisplayFormats = res.Extend.ActionFilter.Data.Extend.DisplayFormats;
                    self.HasSheet = res.Extend.HasSheet;
                }
                self.params.sEcho++;
                for (var k in res.Rows) {
                    if (!res.Rows.hasOwnProperty(k)) { continue; }
                    self.items.push(self.filterRows(res.Rows[k]));
                }
                if (res.Total <= self.params.iDisplayStart + 1 + self.params.iDisplayLength) {
                    self.isMore = false;
                }

                if (self.isMore) {
                    self.pageIndex++;
                    self.params.iDisplayStart = (self.pageIndex - 1) * self.params.iDisplayLength;
                }
                setTimeout(function () {
                    if (res.JavaScriptExtend) {
                        res.JavaScriptExtend = res.JavaScriptExtend.replace(/&amp;&amp;/g, '&&');
                        var javaScriptTemp = $("<script type='text/javascript' id='JavaScriptExtend'>" + res.JavaScriptExtend + " </script>");
                        $('body').append(javaScriptTemp);
                    }
                }, 0);
            }
        };

    }]);