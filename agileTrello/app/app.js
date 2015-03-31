
(function () {
    'use strict';

    var app = angular.module("agileTrello", ["ngRoute", "LocalStorageModule", "atTrello", "atWITBadges", "atTriforce"]);

    app.config(['$routeProvider', function ($routeProvider) {
        var endOfController = window.location.hash.indexOf('/', 3);
        if (endOfController === -1) {
            endOfController = window.location.hash.length;
        };

        var controller = window.location.hash.substring(2, endOfController) + "Controller";

        $routeProvider
            .when("/:controller", {
                controller: controller,
                templateUrl: function (rp) {
                    return "/app/" + rp.controller + "/view.html";
                },
            })
            .otherwise({
                redirectTo: "/home"
            });
    }]);
})();