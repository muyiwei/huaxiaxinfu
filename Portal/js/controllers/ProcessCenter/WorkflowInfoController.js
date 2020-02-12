//发起时的流程状态
app.controller('WorkflowInfoController', ['$scope', '$state', '$stateParams', '$http', 'ControllerConfig',
    function ($scope, $state, $stateParams, $http, ControllerConfig) {
        var PortalRoot = window.localStorage.getItem("H3.PortalRoot");
        $scope.InstanceID = $stateParams.InstanceID;
        $scope.WorkflowCode = $stateParams.WorkflowCode;
        $scope.WorkflowVersion = $stateParams.WorkflowVersion;

        $scope.$on('$viewContentLoaded', function (event) {
            $scope.init();
        });
        $scope.init = function () {
            $http({
                url: ControllerConfig.Workflow.GetWorkflowInfo,
                params: {
                    WorkflowCode: $stateParams.WorkflowCode,
                    WorkflowVersion: $stateParams.WorkflowVersion
                }
            })
            .success(function (result) {
                if (result.SUCCESS == true) {
                    $scope.ActivitySteps = result.ActivitySteps;
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
        $scope.HiddenContent = function (event) {
            var divContent = angular.element(event.currentTarget).next(".divContent");
            if (divContent.is(":hidden")) {
                divContent.show();
            } else {
                divContent.hide();
            }
        }
        //返回链接
        $scope.ReturnUrl = "StartInstance.html?WorkflowCode=" + encodeURI($stateParams.WorkflowCode);
    }]);
