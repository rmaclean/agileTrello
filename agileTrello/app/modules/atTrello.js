(function () {
    'use strict';
    angular.module("atTrello", ["LocalStorageModule"])
        .factory('$trello', ["$http", "localStorageService", function ($http, localStorageService) {
            var _version = 1;
            var _urlBase = "https://api.trello.com/";
            var _onAuth = null;

            var factory = {
                info: {
                    authenticated: false,
                    key: "",
                    token: "",
                    appName: ""
                }
            };

            function buildUrl(path, params) {
                if (path[0] !== '/') {
                    path = "/" + path;
                }

                var auth = "key=" + factory.info.key + "&token=" + factory.info.token;

                if (path.indexOf('?', 0) > 0) {
                    auth = "&" + auth;
                } else {
                    auth = "?" + auth;
                }

                if (params && params[0] !== "&") {
                    params = "&" + params;
                }

                return _urlBase + _version + path + auth + params;
            }

            function gotAuthWindowMessage(event) {
                if (!event.data) {
                    return;
                }

                localStorageService.set("trelloToken", event.data);
                factory.info.token = event.data;
                factory.info.authenticated = !!event.data;
                event.source.close();
                window.removeEventListener("message", gotAuthWindowMessage, false);
                _onAuth();
            }

            factory.login = function (onAuth) {
                if (this.isAuthenticated()) {
                    onAuth();
                    return;
                }

                _onAuth = onAuth;
                var width = 633;
                var height = 611;
                var left = window.screenX + (window.innerWidth - width) / 2;
                var top = window.screenY + (window.innerHeight - height) / 2;
                var url = "https://trello.com/" + _version + "/authorize?key=" + factory.info.key + "&response_type=token&name=" + factory.info.appName + "&expiration=30days&callback_method=postMessage&scope=read&return_url=" + window.location.origin;
                window.addEventListener("message", gotAuthWindowMessage, false);
                window.open(url, "trelloPopup", "location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
            };

            factory.logout = function () {
                localStorageService.remove("trelloToken");
                factory.info.token = "";
                factory.info.authenticated = false;
            };

            factory.get = function (path, params, data) {
                var url = buildUrl(path, params);
                $http.get(url).success(function (_data) {
                    data(_data);
                });
            };

            factory.isAuthenticated = function () {
                factory.info.token = localStorageService.get("trelloToken");
                factory.info.authenticated = !!factory.info.token;
                return factory.info.authenticated;
            };

            return factory;
        }]);
})();