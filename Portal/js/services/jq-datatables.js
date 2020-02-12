'use strict';
app.service('jq.datables', [function () {
    this.trcss = function () {
        var rows = angular.element(document.querySelectorAll("tbody")).find(".odd,.even");
        angular.forEach(rows, function (row, index, sources) {
            angular.element(row).on("mousemove", function () {
                angular.element(this).addClass("selectedRow");
            })
            .on("mouseleave", function () {
                angular.element(this).removeClass("selectedRow");
            });
        });
    }

}]);