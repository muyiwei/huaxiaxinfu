app.controller('InstanceDetailController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$compile', '$modal', '$window', '$translate', '$timeout', 'ControllerConfig',
    function ($rootScope, $scope, $state, $stateParams, $http, $compile, $modal, $window, $translate, $timeout, ControllerConfig) {
        var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
        $scope.InstanceID = $stateParams.InstanceID;
        $scope.WorkItemID = $stateParams.WorkItemID;
        $scope.WorkflowCode = $stateParams.WorkflowCode;
        $scope.WorkflowVersion = $stateParams.WorkflowVersion;

        $scope.InstanceUserLogUrl = "InstanceUserLog({InstanceID:'" + $scope.InstanceID + "'})";
        $scope.$on('$viewContentLoaded', function (event) {
            $scope.init();
        });
        $scope.init = function () {
            $http({
                url: ControllerConfig.InstanceDetail.GetInstanceStateInfo,
                params: {
                    InstanceID: $stateParams.InstanceID,
                    WorkItemID: $scope.WorkItemID,
                    rendom: new Date().getTime()
                }
            })
            .success(function (result, header, config, status) {
                if (result.Success) {
                    //邮箱跳转清除localStorage
                    window.localStorage.setItem("H3.redirectUrl", "");
                    $scope.Exceptional = result.Extend.Exceptional;//流程是否异常
                    $scope.ToolBarAuthority = result.Extend.ToolBarAuthority;//工具栏权限
                    $scope.BaseInfo = result.Extend.BaseInfo;//流程基本信息
                    $scope.CurrentWorkInfo = result.Extend.CurrentWorkInfo;//流程实例当前活动
                    $scope.LogInfo = result.Extend.InstanceLogInfo;//流程日志
                    if ($scope.Exceptional) {
                        $scope.BaseInfo.State = "出现异常，请与管理员联系！";
                    }
                    //流程数据连接  
                    $scope.ViewInstanceData = "EditBizObjectSheets.html?BizObjectID=" + $scope.BaseInfo.BizObjectId + "&SchemaCode=" + $scope.BaseInfo.SchemaCode + "&Mode=Work" + "&EditInstanceData=true";
                    //流程表单连接 
                    $scope.ViewAllSheets = "InstanceSheets.html?InstanceId=" + $scope.BaseInfo.InstanceId;
                } else {
                    if (result.ExceptionCode == 1) {
                        var url = window.location.href;
                        window.localStorage.setItem("H3.redirectUrl", url);
                        $state.go("platform.login");
                    } else {
                        angular.element($("#InstanceDetail")).hide();

                        // 弹出模态框
                        var modalInstance = $modal.open({
                            templateUrl: 'template/ProcessCenter/ConfirmModal.html',
                            size: "sm",
                            backdrop: "static",
                            keyboard: false,
                            controller: function ($scope, $modalInstance) {
                                $scope.Title = $translate.instant("WarnOfNotMetCondition.Tips");
                                if (result.Message == "InstanceDetail_LackOfAuth") {
                                    $scope.Message = $translate.instant("NotEnoughAuth.InstanceDetail_LackOfAuth");
                                } else if (result.Message == "InstanceDetail_InstanceNotExist") {
                                    $scope.Message = $translate.instant("NotEnoughAuth.InstanceDetail_InstanceNotExist");
                                } else {
                                    $scope.Message = result.Message;
                                }
                                $scope.Button_OK = true;
                                $scope.Button_OK_Text = $translate.instant("QueryTableColumn.Button_OK");
                                $scope.ok = function () {
                                    $modalInstance.close();  // 点击确定按钮
                                };
                            }
                        });
                        //弹窗点击确定的回调事件
                        modalInstance.result.then(function () {
                            $window.close();
                        });
                    }
                }
            })
        }

        $scope.options = function () {
            var options = {
                InstanceID: $scope.InstanceID,
                WorkflowCode: $scope.WorkflowCode,
                WorkflowCode: $scope.WorkflowCode,
                PortalRoot: PortalRoot
            }
            return options;
        }

        //处理合并逻辑
        $scope.DoMerge = function () {
            var trs = angular.element($("#TokenGrid").find("tbody tr"));
            var rowspan = 1;
            angular.forEach(trs, function (data, index, full) {
                if (index > 1) {
                    if ($scope.LogInfo[index].No == $scope.LogInfo[index - 1].No) {
                        rowspan++;
                        $(data).find("#DoMerge").hide();
                    } else {
                        if (rowspan > 1) {
                            var DoMergeDom = angular.element($("#TokenGrid").find("tbody tr"))[index - rowspan];
                            $(DoMergeDom).find("#DoMerge").attr("rowspan", rowspan);
                            var paddingTop = $($(DoMergeDom).find("#DoMerge")[0]).height() / 2 - 5;
                            $(DoMergeDom).find("#DoMerge").find("div").css("padding-top", paddingTop + "px");
                        }
                        rowspan = 1;
                    }
                    if (index == trs.length - 1) {
                        if (rowspan > 1) {
                            var DoMergeDom = angular.element($("#TokenGrid").find("tbody tr"))[index - rowspan + 1];
                            $(DoMergeDom).find("#DoMerge").attr("rowspan", rowspan);
                            var paddingTop = $($(DoMergeDom).find("#DoMerge")[0]).height() / 2 - 5;
                            $(DoMergeDom).find("#DoMerge").find("div").css("padding-top", paddingTop + "px");
                        }
                    }
                }
            })
        }

        $scope.OpenParent = function () {
            window.open(PortalRoot + "/index.html#/InstanceDetail/" + $scope.BaseInfo.ParentflowLink + "/" + $scope.WorkItemID + "//", "_blank");
        }
        $scope.OpenChild = function (id) {
            window.open(PortalRoot + "/index.html#/InstanceDetail/" + id + "/" + $scope.WorkItemID + "//", "_blank");
        }
        // 打开催办界面
        $scope.showUrgeInstanceModal = function () {
            // 弹出模态框
            var modalInstance = $modal.open({
                templateUrl: 'UrgeInstance.html',    // 指向上面创建的视图
                controller: 'UrgeInstanceModalController',// 初始化模态范围
                size: "lg",
                resolve: {
                    params: function () {
                        return {
                            InstanceID: $stateParams.InstanceID
                        };
                    }
                }
            });
        }

        //打开调整活动界面
        $scope.showAdjustActivityModal = function (from) {
            angular.element("div[class='ActivitySummary']").hide();
            if (from == "Table" && typeof (ActivityInstaneDiv) !== "undefined" && ActivityInstaneDiv.data("Activity"))
                var _ActivityCode = ActivityInstaneDiv.data("Activity").ActivityCode;
            var modalInstance = $modal.open({
                templateUrl: 'AdjustActivity.html',
                controller: 'AdjustActivityController',
                size: "md",
                resolve: {
                    params: function () {
                        return {
                            InstanceID: $stateParams.InstanceID,
                            CurrentActivateCode: _ActivityCode || ""
                        };
                    },
                    deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            'WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-all.css',
                            'WFRes/assets/stylesheets/sheet.css',
                            //'WFRes/css/MvcSheet.css',
                            //'WFRes/assets/stylesheets/pixel-admin.min.css',
                            //'WFRes/assets/stylesheets/bootstrap.min.css',
                            'WFRes/assets/javascripts/bootstrap.min.js',
                            'WFRes/_Scripts/jquery/jquery.lang.js',
                            'WFRes/_Scripts/ligerUI/ligerui.all.js',
                            'WFRes/_Scripts/MvcSheet/SheetControls.js',
                            'WFRes/_Scripts/MvcSheet/MvcSheetUI.js',
                            'WFRes/_Scripts/MvcSheet/Controls/SheetWorkflow.js',
                            'WFRes/_Scripts/MvcSheet/Controls/SheetUser.js',
                            'vendor/jquery/select2/select2.min.js'
                        ]);
                    }]
                }
            });
        }

        //激活流程
        $scope.ActivateInstance = function () {
            if ($scope.InstanceID == undefined || $scope.InstanceID == "") return
            $http({
                url: ControllerConfig.InstanceDetail.ActivateInstance,
                params: {
                    InstanceID: $scope.InstanceID
                }
            }).success(function (result, header, config, status) {
                $state.go($state.$current.self.name, {}, { reload: true });
            }).error()
        }

        //取消流程
        $scope.CancelInstance = function () {
            if ($scope.InstanceID == undefined || $scope.InstanceID == "") return
            // 弹出模态框
            var modalInstance = $modal.open({
                templateUrl: 'template/ProcessCenter/ConfirmModal.html',
                size: "sm",
                controller: function ($scope, $modalInstance) {
                    $scope.Title = $translate.instant("WarnOfNotMetCondition.Tips");
                    $scope.Message = $translate.instant("WarnOfNotMetCondition.Confirm_Cancel");
                    $scope.Button_OK = true;
                    $scope.Button_OK_Text = $translate.instant("QueryTableColumn.Button_OK");
                    $scope.Button_Cancel = true;
                    $scope.Button_Cancel_Text = $translate.instant("QueryTableColumn.Button_Cancel");
                    $scope.ok = function () {
                        $modalInstance.close();  // 点击确定按钮
                    };
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel'); // 退出
                    }
                }
            });
            //弹窗点击确定的回调事件
            modalInstance.result.then(function () {
                $http({
                    url: ControllerConfig.InstanceDetail.CancelInstance,
                    params: {
                        InstanceID: $scope.InstanceID
                    }
                }).success(function (result, header, config, status) {
                    $state.go($state.$current.self.name, {}, { reload: true });
                })
            });
        }

        //删除流程
        $scope.RemoveInstance = function () {
            if ($scope.InstanceID == undefined || $scope.InstanceID == "") return;
            // 弹出模态框
            var modalInstance = $modal.open({
                templateUrl: 'template/ProcessCenter/ConfirmModal.html',
                size: "sm",
                controller: function ($scope, $modalInstance) {
                    $scope.Title = $translate.instant("WarnOfNotMetCondition.Tips");
                    $scope.Message = $translate.instant("WarnOfNotMetCondition.Confirm_Delete");
                    $scope.Button_OK = true;
                    $scope.Button_OK_Text = $translate.instant("QueryTableColumn.Button_OK");
                    $scope.Button_Cancel = true;
                    $scope.Button_Cancel_Text = $translate.instant("QueryTableColumn.Button_Cancel");
                    $scope.ok = function () {
                        $modalInstance.close();  // 点击确定按钮
                    };
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel'); // 退出
                    }
                }
            });
            //弹窗点击确定的回调事件
            modalInstance.result.then(function () {
                //删除
                $http({
                    url: ControllerConfig.InstanceDetail.RemoveInstance,
                    params: {
                        InstanceID: $scope.InstanceID
                    }
                }).success(function (result, header, config, status) {
                    if ($window.window.opener) {
                        $timeout(function () {
                            $window.close();
                            if ($window.window.opener.window.parent.location && $window.window.opener.window.parent.location.href.indexOf("Portal/index.html") > -1) {
                                $window.window.opener.window.parent.location.reload();
                            } else {
                                $window.window.opener.window.parent.close();
                            }
                        }, 1000 * 1)
                    } else {
                        $window.close();
                        top.postMessage("ParentReload", "*");
                    }
                });
            });
        }

        //关闭
        $scope.Close = function () {
            if ($(top.window.document).find("iframe").length > 0) {
                top.$(".app-aside-right").removeClass("show");
                //window.location.reload();
            } else {
                top.window.close();
            }
        }
    }]);

//催办Controlller
app.controller('UrgeInstanceModalController', ['$scope', '$http', '$modalInstance', '$state', '$translate', 'ControllerConfig', 'params', function ($scope, $http, $modalInstance, $state, $translate, ControllerConfig, params) {
    $scope.InstanceID = params.InstanceID;
    //获取历史催办
    $http({
        url: ControllerConfig.InstanceDetail.GetUrgeInstanceInfo,
        params: {
            InstanceID: $scope.InstanceID,
            rendom: new Date().getTime()
        }
    })
    .success(function (result, header, config, status) {
        $scope.UrgeInstanceInfo = result;
    })
    .error(function (data, header, config, status) {
        return;
    });

    $scope.ok = function () {
        if ($scope.UrgeContent == null || $scope.UrgeContent == "")
            return;

        $http({
            url: ControllerConfig.InstanceDetail.AddUrgeInstance,
            params: {
                InstanceID: params.InstanceID,
                UrgeContent: $scope.UrgeContent
            }
        })
        .success(function (data, header, config, status) {
            $modalInstance.dismiss('cancel'); // 退出
            $.notify({ message: $translate.instant("InstanceDetail.UrgedSuccess"), status: "danger" });
        })
        .error(function (data, header, config, status) {
            $modalInstance.dismiss('cancel'); // 退出
        })
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    };
}]);

//操作日志Controlller
app.controller('InstanceUserLogController', ['$scope', '$stateParams', '$http', 'ControllerConfig',
    function ($scope, $stateParams, $http, ControllerConfig) {
        //获取用户日志
        $scope.InstanceID = $stateParams.InstanceID;
        $http({
            url: ControllerConfig.InstanceDetail.GetInstanceUserLog,
            params: {
                InstanceID: $scope.InstanceID
            }
        })
        .success(function (data, header, config, status) {
            if (data.SUCCESS == true) {
                $scope.UserLog = data.UserLogInfo;
            }
        })
        .error(function (data, header, config, status) {
        })
    }]);

//调整活动Controller
app.controller('AdjustActivityController', ['$scope', '$http', '$timeout', '$modalInstance', '$state', 'ControllerConfig', 'params', function ($scope, $http, $timeout, $modalInstance, $state, ControllerConfig, params) {
    $scope.InstanceID = params.InstanceID;
    $scope.init = function () {
        $http({
            url: ControllerConfig.InstanceDetail.GetAdjustActivityInfo,
            params: {
                InstanceID: params.InstanceID
            }
        })
        .success(function (result, header, config, status) {
            if (result.SUCCESS == true) {
                $scope.InstanceActivity = result.InstanceActivity;
                if (params.CurrentActivateCode) {
                    $scope.ActivityCode = params.CurrentActivateCode;
                }
                $scope.ActivityChange();
            }
        });
    }
    $scope.init();

    $scope.UserOptions = {
        Editable: true, Visiable: true, IsMultiple: false,
        OnChange: function (e) {
            $scope.Participants = $("#sheetUser").SheetUIManager().GetValue();
        }
    }

    $scope.MutilUserOptions = {
        Editable: true, Visiable: true, IsMultiple: true,
        OnChange: function (e) {
            $scope.MutilParticipants = $("#mutilsheetUser").SheetUIManager().GetValue();
        }
    }

    $scope.ActivityChange = function () {
        //1、操作按钮权限
        //2、参与者
        //$("#sheetUser").SheetUIManager().ClearChoices()||null;
        if ($scope.SelectType == "AdjustActivity") {
            if ($("#sheetUser").SheetUIManager()) {
                $("#sheetUser").SheetUIManager().ClearChoices();
            }
            if ($("#mutilsheetUser").SheetUIManager()) {
                $("#mutilsheetUser").SheetUIManager().ClearChoices();
            }
        }

        $http({
            url: ControllerConfig.InstanceDetail.GetActivityChangeInfo,
            params: {
                InstanceID: $scope.InstanceID,
                ActivityCode: $scope.ActivityCode
            }
        })
        .success(function (result, header, config, status) {
            $scope.AdjustActivityInfo = result;
            if ($scope.AdjustActivityInfo.btnAdjustEnabled) {
                $scope.SelectType = "AdjustActivity"
            } else if (!$scope.AdjustActivityInfo.btnAdjustEnabled && $scope.AdjustActivityInfo.btnActivateEnabled) {
                $scope.SelectType = "ActivateActivity";
            } else if (!$scope.AdjustActivityInfo.btnAdjustEnabled && $scope.AdjustActivityInfo.btnCancelEnabled) {
                $scope.SelectType = "CancelActivity"
            }

            if (result.UserEnabled == true && result.UserValue != null && result.UserValue.length > 0) {
                for (var i = 0; i < result.UserValue.length; i++) {
                    var participant = result.UserValue[i];
                    //手工节点选人控件只能单人
                    if ($("#sheetUser").SheetUIManager() && $scope.AdjustActivityInfo.ActivityType == 3) {
                        $("#sheetUser").SheetUIManager().SetValue(participant);
                        break;
                    }
                    //手工节点选人控件为多人
                    if ($("#mutilsheetUser").SheetUIManager() && $scope.AdjustActivityInfo.ActivityType == 4) {
                        $("#mutilsheetUser").SheetUIManager().SetValue(participant);
                    }
                }
            }
        })
        .error()
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    };
    $scope.Confirm = function () {
        switch ($scope.SelectType) {
            case "AdjustActivity":
                $scope.Adjust_Click();
                break;
            case "CancelActivity":
                $scope.Cancel_Click();
                break;
            case "ActivateActivity":
                $scope.Activate_Click();
                break;
                defatult:
                    alter("请选择类型");
        }
    }
    //激活
    $scope.Activate_Click = function () {
        //InstanceID,ActivityCode不为空 
        $http({
            url: ControllerConfig.InstanceDetail.ActivateActivity,
            params: {
                InstanceID: $scope.InstanceID,
                ActivityCode: $scope.ActivityCode,
                Participants: $scope.Participants || $scope.MutilParticipants
            }
        }).success(function (result, header, config, status) {
            $modalInstance.dismiss('cancel');
            $state.go($state.$current.self.name, {}, { reload: true });
        }).error()
    }

    //取消
    $scope.Cancel_Click = function () {
        //InstanceID,ActivityCode不为空
        if ($scope.InstanceID == "" || $scope.InstanceID == "") return
        $http({
            url: ControllerConfig.InstanceDetail.CancelActivity,
            params: {
                InstanceID: $scope.InstanceID,
                ActivityCode: $scope.ActivityCode
            }
        }).success(function (result, header, config, status) {
            $modalInstance.dismiss('cancel');
            $state.go($state.$current.self.name, {}, { reload: true });
        }).error()

    }

    //调整参与者
    $scope.Adjust_Click = function () {
        if ($scope.InstanceID == "" || $scope.InstanceID == "") return
        $http({
            url: ControllerConfig.InstanceDetail.AdjustActivity,
            params: {
                InstanceID: $scope.InstanceID,
                ActivityCode: $scope.ActivityCode,
                Participants: $scope.Participants || $scope.MutilParticipants
            }
        }).success(function (result, header, config, status) {
            $modalInstance.dismiss('cancel');
            $state.go($state.$current.self.name, {}, { reload: true });
        }).error()
    }

}])