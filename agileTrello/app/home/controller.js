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
        $scope.language = {
            planned: "Planned"
        };

        $scope.charts = [];
        $scope.sprintUsageData = [];
        $scope.sprintAvgData = [];
        $scope.sprintPerDayData = [];
        $scope.sprintUnexpectedData = [];
        $scope.sprintDiffData = [];
     
        var config = {};
        var identifyEstimateRegEx = /\(([\d\.]+)\)/;
        var identifyUsedRegEx = /.\[([\d\.]+)\]/;
        var identifySprintTitles = /^Sprint\s(\d+)(\s\(planned\s(\d+)\))?/;
        var identifySprintTitlePlanned = /\(planned\s(\d+)\)/;
        var members = [];
        var listInfos = [];
        var actionsCount = 0;

        $scope.refresh = function () {
            loadBoard();
        }

        function onAuth() {
            $scope.loadingBoards = true;
            $trello.get("members/me/boards", "", gotBoards);
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
            if (config.languagePlanned) {
                $scope.language.planned = config.languagePlanned;
            }

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
                list.info.difference = list.estimate - list.used;
                list.info.avgDifference = list.info.avgEstimate - list.info.avgUsed;

                max = list.cards.length > max ? list.cards.length : max;

                if (list.info.isSprintList) {
                    $scope.sprintUsageData.push({
                        x: $scope.sprintUsageData.length,
                        val_0: list.used,
                        val_1: list.estimate
                    });

                    $scope.sprintUnexpectedData.push({
                        x: $scope.sprintUsageData.length,
                        val_0: list.info.unexpectedWork,
                    });

                    $scope.sprintDiffData.push({
                        x: $scope.sprintUsageData.length,
                        val_0: list.info.difference,
                    });

                    $scope.sprintAvgData.push({
                        x: $scope.sprintAvgData.length,
                        val_0: list.info.avgUsed,
                        val_1: list.info.avgEstimate
                    });
                }

                //$scope.sprintUsageOptions.axes.x.ticks = $scope.sprintUsageData.length;

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
                    list.info.plannedPerDay = list.info.planned / config.sprintLength;
                    list.info.sprintLength = config.sprintLength;
                    list.info.pointsPerDayUsed = list.used / config.sprintLength;
                    list.info.pointsPerDayEstimate = list.estimate / config.sprintLength;
                    list.info.differencePerDay = list.info.pointsPerDayEstimate - list.info.pointsPerDayUsed;

                    if (list.info.isSprintList) {
                        $scope.sprintPerDayData.push({
                            x: $scope.sprintPerDayData.length,
                            val_0: list.info.pointsPerDayUsed,
                            val_1: list.info.pointsPerDayEstimate
                        });
                    }
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
            homeCharts.charts($scope);
        }

        function processList(list) {
            var listInfo = {
                name: list.name,
                id: list.id,
                estimate: 0,
                used: 0,
                cards: [],
                position: list.pos,
                info: {
                    unexpectedCards: 0,
                    unexpectedWork: 0,
                    isSprintList: false
                },
                hide: {
                    planned: false,
                    unexpected: false
                },
                dailyBreakdown: {},

            };

            var sprintTitleInfo = identifySprintTitles.exec(list.name);
            if (sprintTitleInfo) {
                if (sprintTitleInfo[3] === undefined) {
                    listInfo.hide.planned = true;
                } else {
                    listInfo.info.planned = sprintTitleInfo[3];
                }

                if (sprintTitleInfo[1] !== undefined) {

                    listInfo.info.sprintNumber = sprintTitleInfo[1];
                    listInfo.info.isSprintList = true;
                }
            }

            if (list.name.toLocaleUpperCase() == "BACKLOG") {
                listInfo.hide.planned = true;
                listInfo.hide.unexpected = true;
            }

            if (list.name.toLocaleUpperCase() == "SPRINT BACKLOG") {
                listInfo.hide.planned = true;
            }

            if (list.name.toLocaleUpperCase() == "IN PROGRESS") {
                listInfo.hide.planned = true;
            }

            return listInfo;
        }

        function getList(lists, id) {
            var list = null;
            lists.forEach(function (_list) {
                if (_list.id === id) {
                    list = _list;
                    return;
                }
            });

            return list;
        }

        function getPoints(card) {
            var points = {
                validUsed: false,
                validEstimate: false,
                used: 0,
                estimated: 0
            };

            var estimates = identifyEstimateRegEx.exec(card.name);
            if (estimates !== null) {
                points.validEstimate = true;
                points.estimated = +estimates[1];
            }

            var useds = identifyUsedRegEx.exec(card.name);
            if (useds !== null) {
                points.validUsed = true;
                points.used = +useds[1];
            }

            return points;
        }

        function processCard(lists, card) {
            var list = getList(lists, card.idList);

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

            var points = getPoints(card);

            if (points.validEstimate) {
                list.estimate += points.estimated;
                cardInfo.estimate = points.estimated;
            }

            if (points.validUsed) {
                list.used += points.used;
                cardInfo.used = points.used;
            }

            if (cardInfo.estimate === 0 && cardInfo.used > 0) {
                list.info.unexpectedCards++;
                list.info.unexpectedWork += cardInfo.used;
            }

            cardInfo.difference = card.used - card.estimate;
            list.cards.push(cardInfo);
        }

        function getBreakdown(list, date) {
            var breakDown = null;
            for (var name in list.dailyBreakdown) {
                if (list.dailyBreakdown.hasOwnProperty(name)) {
                    if (name === date) {
                        breakDown = list.dailyBreakdown[name];
                        break;
                    }
                }
            }

            if (breakDown === null) {
                breakDown = {
                    used: 0,
                    estimates: 0
                };
            }

            return breakDown;
        }

        function processActions(lists, actions) {
            actions.forEach(function (action) {
                if (action.type === "createCard") {
                    var points = getPoints(action.data.card);
                    if (points.validEstimate || points.validUsed) {
                        var list = getList(lists, action.data.list.id);
                        if (list) {
                            var date = (+moment(action.date).startOf("day")).toString();
                            var breakDown = getBreakdown(list, date);
                            if (points.validEstimate) {
                                breakDown.estimates += points.estimated;
                            }

                            if (points.validUsed) {
                                breakDown.used += points.used;
                            }

                            list.dailyBreakdown[date] = breakDown;
                        }
                    }
                }
            });
        }

        function getActions(actions) {
            if (actions.length === 0) {
                return;
            }

            actionsCount++;
            $trello.get("/batch", "urls=" + actions, gotActions);
        }

        function gotBoard(board) {
            members = board.members;
            listInfos = [];
            board.lists.forEach(function (list) {
                listInfos.push(processList(list));
            });

            actionsCount = 0;
            var actions = "";
            board.cards.forEach(function (card) {
                processCard(listInfos, card);

                if (actions.length > 0) {
                    actions += ",";
                }

                actions += "/cards/" + card.id + "/actions?filter=createCard%26limit=1000,/cards/" + card.id + "/actions?filter=updateCard%26limit=1000";
                if (actions.length > 1800) {
                    getActions(actions);
                    actions = "";
                }
            });

            getActions(actions);
        }

        function gotActions(batchActions) {
            actionsCount--;
            if (actionsCount !== 0) {
                return;
            }

            for (var cardIndex = 0; cardIndex < batchActions.length; cardIndex++) {
                var actions = batchActions[cardIndex][200];
                processActions(listInfos, actions);
            }

            listsDone(listInfos);
        }

        $scope.logout = function () {
            $trello.logout();
        }

        $scope.loginToTrello = function () {
            $trello.login(onAuth);
        };

        function loadBoard() {
            if ($scope === null || $scope.selectedBoard === null) {
                return;
            }

            $scope.loadingBoards = true;
            $scope.lists = {};
            config = {};
            $scope.sprintUsageData = [];
            $scope.sprintAvgData = [];
            $scope.sprintPerDayData = [];
            $scope.sprintUnexpectedData = [];
            $scope.sprintDiffData = [];

            $trello.get("/boards/" + $scope.selectedBoard.id, "fields=name&cards=open&card_fields=idList,url,pos,name,idMembers,desc&members=all&member_fields=fullName,url&lists=open&list_fields=name,pos", gotBoard);
        }

        $scope.$watch("selectedBoard", function () {
            loadBoard();
        });

        $trello.info.key = "bb052cd140194b3333e4661db7d4afe9";
        $trello.info.appName = "agileTrello";

        if ($trello.isAuthenticated()) {
            onAuth();
        }
    }
})();