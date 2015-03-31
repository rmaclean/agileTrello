(function () {
    'use strict';
    angular.module("atTriforce", [])
        .directive("triforce", function () {
            return {
                restrict: "ACE",
                scope:
                    {
                        triforceorder: "@",
                        triforcevalue: "@"
                    },
                link: function (scope, element, attributes) {
                    var positive = "green";
                    var negative = "red";
                    if (scope.triforceorder.toLocaleUpperCase() !== "POSITIVE") {
                        positive = "red";
                        negative = "green";
                    } 

                    if (+scope.triforceorder !== 0) {
                        if (+scope.triforcevalue > 0) {
                            element.addClass(positive);
                        } else {
                            element.addClass(negative);
                        }
                    }
                }
            };
        });
})();