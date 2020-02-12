angular.module("formApp.directives", [])
    //文本框获取焦点时选中内容
.directive('selectLine', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('click', function (event) {//点击时，选中
                this.select();
            });
            element.bind('focus', function (event) {//获取焦点时，选中
                this.select();
            });
        }
    }
})
.directive('bpmSheetUserSelected', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            selectUsers: '=',
            cancelSelected: '=',
            portal: '='
        },
        templateUrl: $.MvcSheetUI.PortalRoot + '/Mobile/form/templates/sheetUserSelected.html?r=20180132b',
    }
})