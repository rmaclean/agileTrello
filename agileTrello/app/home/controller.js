/// <reference path="scripts/angular.js" />
(function () {
    'use strict';

    angular
        .module('agileTrello')
        .controller('homeController', ["$scope", "$http", "$trello", homeController]);

    function homeController($scope, $http, $trello) {
        $scope.boards = [];
        $scope.loadingBoards = false;
        $scope.lists = {};
        $scope.trello = $trello.info;
        $scope.selectedBoard = null;

        var config = {};
        var listInfos = [];
        var listCount = 0;
        var identifyEstimateRegEx = /\(([\d\.]+)\)/;
        var identifyUsedRegEx = /.\[([\d\.]+)\]/;
        var identifySprintTitles = /^Sprint\s(\d+)(\s\(planned\s(\d+)\))?/;
        var identifySprintTitlePlanned = /\(planned\s(\d+)\)/;
        var members = [];

        function onAuth() {
            $scope.loadingBoards = true;
            $trello.get("members/me/boards", gotBoards);
        };

        function gotBoards(boards) {
            $scope.boards = [];
            boards.forEach(function (board) {
                if (!board.closed) {
                    $scope.boards.push(board);
                }
            });
        }

        function setMembers(memberIds) {
            if (!memberIds) {
                return [];
            }

            var result = [];
            memberIds.forEach(function (memberId) {
                members.forEach(function (sourceMember) {
                    if (sourceMember.id === memberId) {
                        result.push(sourceMember);
                    }
                });
            });

            return result;
        }

        function gotSingleList(list) {
            var listInfo = {
                name: list.name,
                id: list.id,
                estimate: 0,
                used: 0,
                cards: [],
                difference: 0,
                position: list.pos,
                info: {
                    unexpectedCards: 0,
                    unexpectedWork: 0,
                }
            };

            var sprintTitleInfo = identifySprintTitles.exec(list.name);
            if (sprintTitleInfo) {
                listInfo.info.planned = sprintTitleInfo[3];
                listInfo.info.sprintNumber = sprintTitleInfo[1];
            }

            list.cards.forEach(function (card) {
                if (card.name === "agileTrello Config") {
                    config = JSON.parse(card.desc);
                    return;
                };

                var cardInfo = {
                    name: card.name,
                    estimate: 0,
                    used: 0,
                    position: card.pos,
                    url: card.url,
                    members: setMembers(card.idMembers)
                };

                var estimates = identifyEstimateRegEx.exec(card.name);
                if (estimates !== null) {
                    listInfo.estimate += +estimates[1];
                    cardInfo.estimate = +estimates[1];
                }

                var useds = identifyUsedRegEx.exec(card.name);
                if (useds !== null) {
                    listInfo.used += +useds[1];
                    cardInfo.used += +useds[1];
                }

                if (cardInfo.estimate === 0 && cardInfo.used > 0) {
                    listInfo.info.unexpectedCards++;
                    listInfo.info.unexpectedWork += cardInfo.used;
                }

                cardInfo.difference = card.used - card.estimate;
                listInfo.cards.push(cardInfo);
            });

            listInfo.cards.sort(function (a, b) {
                return a.position - b.position;
            });

            listInfo.info.cards = list.cards.length;
            listInfo.info.avgEstimate = listInfo.estimate / list.cards.length;
            listInfo.info.avgUsed = listInfo.used / list.cards.length;

            listInfo.difference = listInfo.used - listInfo.estimate;
            listInfos.push(listInfo);
            listsDone();
        };

        function listsDone() {
            listCount--;
            if (listCount !== 0) {
                return;
            }

            if (config.hideDoubleZero) {
                listInfos.forEach(function (list) {
                    if (list.estimate === 0 && list.used === 0) {
                        listInfos.splice(listInfos.indexOf(list), 1);
                    }
                });
            }

            if (config.cleanCardTitles) {
                listInfos.forEach(function (list) {
                    list.cards.forEach(function (card) {
                        card.name = card.name.replace(identifyEstimateRegEx, "").replace(identifyUsedRegEx, "");
                    });
                });
            }

            if (config.cleanListTitles) {
                listInfos.forEach(function (list) {
                    list.name = list.name.replace(identifySprintTitlePlanned, "");
                });
            }

            if (config.sprintLength) {
                listInfos.forEach(function (list) {
                    list.info.pointsPerDayUsed = list.used / config.sprintLength;
                    list.info.pointsPerDayEstimate = list.estimate / config.sprintLength;
                });

                if (config.startDate) {
                    listInfos.forEach(function (list) {
                        if (list.info.sprintNumber) {
                            var startDate = moment(config.startDate);
                            var sprintStartDate = startDate.add((list.info.sprintNumber - 1) * config.sprintLength, "d");
                            list.info.sprintStartDate = sprintStartDate.format("ddd, D MMM YYYY");
                            list.info.sprintEndDate = sprintStartDate.add(config.sprintLength - 1, "d").format("ddd, D MMM YYYY");
                        }
                    });
                }
            }

            listInfos.sort(function (a, b) {
                return a.position - b.position;
            });

            var max = 0;
            listInfos.forEach(function (list) {
                max = list.cards.length > max ? list.cards.length : max;
            });

            var rows = [];
            for (var i = 0; i < max; i++) {
                rows.push(i);
            }

            $scope.lists.lists = listInfos;
            $scope.lists.rows = rows;
        }

        function gotMembers(membersFromAPI) {
            members = membersFromAPI;
            $trello.get("boards/" + $scope.selectedBoard.id + "?lists=open", gotLists);
        }

        function gotLists(board) {
            listInfos = [];
            board.lists.forEach(function (list) {
                listCount++;
                $trello.get("list/" + list.id + "?cards=open", gotSingleList);
            });
        };

        $scope.logout = function () {
            $trello.logout();
        }

        $scope.loginToTrello = function () {
            $trello.login(onAuth);
        };

        $scope.$watch("selectedBoard", function () {
            if ($scope === null || $scope.selectedBoard === null) {
                return;
            }

            config = {};
            $trello.get("boards/" + $scope.selectedBoard.id + "/members?fields=fullName,avatarHash,url", gotMembers);
        });

        $trello.info.key = "bb052cd140194b3333e4661db7d4afe9";
        $trello.info.appName = "agileTrello";

        if ($trello.isAuthenticated()) {
            onAuth();
        }
    }
})();