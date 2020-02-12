app.controller('PortalTemplatesController', ['$scope', '$state', '$http', '$modal', '$translate', 'ControllerConfig',
    function ($scope, $state, $http, $modal, $translate, ControllerConfig) {
        $scope.init = function () {
            //所有模板
            $scope.Templates = [];
            //当前编辑的模板ID
            $scope.CurrentTemplateId = 0;
            $scope.Controls = {
                EditTemplateTitle: undefined,
                txtTemplateName: undefined,
                txtTemplateIcon: undefined,
                txtTemplateHtml: undefined
            };
            $scope.editor = undefined;
            $scope.LoadData();
        }

        $scope.LoadData = function () {
            $http({
                url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/LoadTemplates",
                params: {}
            })
            .success(function (data) {
                if (data.ExceptionCode == 1) {
                    //刷新页面转到登录
                } else if (data.Success == true) {
                    $scope.Templates = data.Extend || [];
                }
            })
        }

        $scope.init();

        $scope.AddTemplate = function () {
            $scope.OpenModal();
        }

        $scope.EditTemplate = function (TemplateId) {
            $scope.OpenModal(TemplateId)
        }

        $scope.PreView = function (TemplateId) {
            window.open("index.html#/home/" + TemplateId + "/", "_blank");
        }

        $scope.OpenModal = function (TemplateId) {
            var modalInstance = $modal.open({
                templateUrl: "EditPortalTemplates.html",// 指向上面创建的视图
                controller: 'EditPortalTemplatesController',// 初始化模态范围
                size: "lg",
                resolve: {
                    params: function () {
                        return {
                            TemplateId: TemplateId || 0,
                            Templates: $scope.Templates
                        };
                    },
                    deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            //在线代码编辑

                        ]);
                    }]
                }
            });
            // 弹窗点击确定的回调事件
            modalInstance.result.then(function (arg) {
                //reload
            });
        }
    }]);

app.controller('EditPortalTemplatesController', ['$scope', '$http', '$translate', '$filter', '$timeout', '$state', '$modalInstance', '$modal', 'params', function ($scope, $http, $translate, $filter, $timeout, $state, $modalInstance, $modal, params) {
    $scope.TemplateId = params.TemplateId;
    $scope.LanJson = {
        Name: $translate.instant("PortalTemplates.PortalTemplates_New")
    }
    $scope.init = function () {
        //新建
        if ($scope.TemplateId == 0) {
            $scope.Name = "新建";
            $scope.LanJson.Name = $translate.instant("PortalTemplates.PortalTemplates_New");
            $scope.Template = {
                TemplateName: "",
                Icon: "",
                HtmlContent: ""
            }
        } else {
            //编辑模式
            $scope.Name = "编辑";
            $scope.Pattern = "EditTemplate";
            $scope.LanJson.Name = $translate.instant("PortalTemplates.PortalTemplates_New")
            $scope.Template = $filter("filter")(params.Templates, { ObjectID: $scope.TemplateId })[0];
        }
        $timeout($scope.InitTextArea, 200);
    }
    $scope.InitTextArea = function () {
        var textarea = angular.element("#txt_html")[0];
        if ($(textarea).attr("data-init") == "true") {
            $scope.editor = CodeMirror.fromTextArea(textarea, {
                lineNumbers: true,
                mode: "application/x-ejs",
                indentUnit: 4,
                indentWithTabs: true,
                extraKeys: {
                    "F11": function (cm) {
                        cm.setOption("fullScreen", !cm.getOption("fullScreen"));
                    },
                    "Esc": function (cm) {
                        if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
                    }
                }
            });
            $(textarea).attr("data-init", false);
        }
        $(".CodeMirror").css("border", "1px solid #d6d6d6");
        $(".CodeMirror").css("border-left", "2px solid #d6d6d6");
        if ($scope.TemplateId) {
            $scope.Template = $filter("filter")(params.Templates, { ObjectID: $scope.TemplateId })[0];
            $scope.editor.setValue($scope.Template.HtmlContent);
        }
        else {
            $scope.editor.setValue("");
        }
    }

    $scope.init();
    $scope.canClick = false;
    $scope.ok = function () {
        $scope.Template.Icon = $("#txt_icon").val();
        $scope.Template.TemplateName = $("#txt_tempname").val();
        $scope.Validation_false = false;
        if ($scope.editor) {
            $scope.Template.HtmlContent = $scope.editor.getValue();
        }
        if (!$scope.Template.TemplateName || !$scope.Template.HtmlContent) {
            $scope.Validation_false = true;
            return;
        }
        $scope.canClick = true;
        $http({
            method: 'POST',
            url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/SaveTemplate",
            data: {
                tempId: $scope.TemplateId,
                tempName: $scope.Template.TemplateName,
                icon: $scope.Template.Icon,
                html: $scope.Template.HtmlContent
            }
        })
        .success(function (data) {
            $modalInstance.close();
            $state.go($state.$current.self.name, {}, { reload: true });
        })
        .error(function (data) {
            $scope.canClick = false;
        })
    }

    $scope.remove = function () {
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
                url: window.localStorage.getItem("H3.PortalRoot") + "/PortalAdminHandler/RemoveTemplate",
                params: {
                    tempId: $scope.TemplateId,
                }
            })
            .success(function (data) {
                $modalInstance.close();
                $state.go($state.$current.self.name, {}, { reload: true });
            })
        });
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel'); // 退出
    }
}])