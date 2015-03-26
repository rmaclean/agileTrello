(function () {
    'use strict';
    angular.module("atWITBadges", [])
        .directive("atWitbadge", function () {
            return {
                templateUrl: "/app/directives/agileBadges.html",
                restrict: "E",
                scope: {
                    item: "=info"
                },
            };
        });
})();