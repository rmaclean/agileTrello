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

        function listsDone(listInfos) {
            if (config.hideDoubleZero) {
                listInfos.forEach(function (list) {
                    if (list.estimate === 0 && list.used === 0) {
                        listInfos.splice(listInfos.indexOf(list), 1);
                    }
                });
            }

            var max = 0;
            listInfos.forEach(function (list) {
                list.cards.sort(function (a, b) {
                    return a.position - b.position;
                });

                list.info.cards = list.cards.length;
                list.info.avgEstimate = list.estimate / list.cards.length;
                list.info.avgUsed = list.used / list.cards.length;

                max = list.cards.length > max ? list.cards.length : max;
            });

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

            var rows = [];
            for (var i = 0; i < max; i++) {
                rows.push(i);
            } 

            $scope.lists.lists = listInfos;
            $scope.lists.rows = rows;
        }

        function processList(list) {
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

            listInfo.difference = listInfo.used - listInfo.estimate;
            return listInfo;
        }

        function processCard(lists, card) {
            var list = null;
            lists.forEach(function (_list) {
                if (_list.id === card.idList) {
                    list = _list;
                    return;
                }
            });

            if (list === null) {
                return;
            }

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
                list.estimate += +estimates[1];
                cardInfo.estimate = +estimates[1];
            }

            var useds = identifyUsedRegEx.exec(card.name);
            if (useds !== null) {
                list.used += +useds[1];
                cardInfo.used += +useds[1];
            }

            if (cardInfo.estimate === 0 && cardInfo.used > 0) {
                list.info.unexpectedCards++;
                list.info.unexpectedWork += cardInfo.used;
            }

            cardInfo.difference = card.used - card.estimate;
            list.cards.push(cardInfo);
        }

        function gotBoard(board) {
            members = board.members;

            var listInfos = [];
            board.lists.forEach(function (list) {
                listInfos.push(processList(list));
            });

            board.cards.forEach(function (card) {
                processCard(listInfos, card);
            });

            listsDone(listInfos);
        }

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
            $trello.get("/boards/" + $scope.selectedBoard.id + "?fields=name&cards=open&card_fields=idList,url,pos,name,idMembers,desc&members=all&member_fields=fullName,url&lists=open&actions=updateCard&list_fields=name,pos", gotBoard);
        });

        $trello.info.key = "bb052cd140194b3333e4661db7d4afe9";
        $trello.info.appName = "agileTrello";

        if ($trello.isAuthenticated()) {
            onAuth();
        }
    }
})();