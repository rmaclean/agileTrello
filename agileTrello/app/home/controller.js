/// <reference path="scripts/angular.js" />
(function () {
    'use strict';

    angular
        .module('agileTrello')
        .controller('homeController', ["$scope", "$http", "localStorageService", homeController]);

    function homeController($scope, $http, localStorageService) {
        $scope.boards = [];
        $scope.loadingBoards = false;
        $scope.lists = [];
        $scope.authenticated = false;

        var key = "bb052cd140194b3333e4661db7d4afe9";

        var identifyEstimateRegEx = /\(([\d\.]+)\)/;
        var identifyUsedRegEx = /.\[([\d\.]+)\]/;

        function onAuth() {
            $scope.loadingBoards = true;
            var token = localStorageService.get("trelloToken");
            $http.get("https://api.trello.com/1/members/me/boards?key=" + key + "&token=" + token).success(function (data) {
                gotBoards(data);
            });
        };

        function gotBoards(boards) {
            $scope.boards = [];
            angular.forEach(boards, function (board) {
                if (!board.closed) {
                    $scope.boards.push(board);
                }
            });
        }

        function gotSingleList(list) {
            var listInfo = {
                name: list.name,
                id: list.id,
                estimate: 0,
                used: 0
            };

            angular.forEach(list.cards, function (card) {
                var estimates = identifyEstimateRegEx.exec(card.name);
                if (estimates !== null) {
                    listInfo.estimate += +estimates[1];
                }

                var useds = identifyUsedRegEx.exec(card.name);
                if (useds !== null) {
                    listInfo.used += +useds[1];
                }
            });

            $scope.lists.push(listInfo);
        };

        function gotLists(board) {
            var token = localStorageService.get("trelloToken");
            $scope.lists = [];
            angular.forEach(board.lists, function (list) {
                $http.get("https://api.trello.com/1/lists/" + list.id + "?cards=open&key=" + key + "&token=" + token).success(function (data) {
                    gotSingleList(data);
                });
            });
        };

        $scope.loadBoard = function (id) {
            var token = localStorageService.get("trelloToken");
            $http.get("https://api.trello.com/1/boards/" + id + "?lists=open&key=" + key + "&token=" + token).success(function (data) {
                gotLists(data);
            });
        };

        function gotAuthWindowMessage(event) {
            if (!event.data) {
                return;
            }

            localStorageService.set("trelloToken", event.data);
            $scope.authenticated = !event.data;
            event.source.close();
            onAuth();
        }

        $scope.loginToTrello = function () {
            var width = 633;
            var height = 611;
            var left = window.screenX + (window.innerWidth - width) / 2;
            var top = window.screenY + (window.innerHeight - height) / 2;
            var url = "https://trello.com/1/authorize?key=" + key + "&response_type=token&name=agileTrello&expiration=30days&callback_method=postMessage&scope=read&return_url=" + window.location.origin;
            window.addEventListener("message", gotAuthWindowMessage, false);
            window.open(url, "trelloPopup", "location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
        };

        $scope.authenticated = !localStorageService.get("trelloToken");
        if ($scope.authenticated) {
            onAuth();
        }
    }
})();