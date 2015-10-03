var CONSTANTS = {
    API_URL: 'http://54.64.176.231:8080'
};
var app = angular.module('Treasure', ['ionic', 'ionic-toast'])
    .run(function ($ionicPlatform, $rootScope, $state, auth) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
    });
    // 로그인 필요한 페이지인 경우 리다이렉트
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (!auth.isLogin() && toState.loginRequired) {
            event.preventDefault();
            $state.go('login');
        }
    });
})
    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $stateProvider
        .state('map', {
        url: '/',
        controller: 'MapController',
        templateUrl: 'templates/treasure-map.html',
        loginRequired: true
    })
        .state('login', {
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'templates/login.html'
    });
    $urlRouterProvider.otherwise('/');
    if (!ionic.Platform.isIOS()) {
        $ionicConfigProvider.scrolling.jsScrolling(false);
    }
});
/*
 address: "서울 중구 세종대로 40 (남대문로4가)"
 description: "description"
 era: "조선시대"
 explored: true
 id: 1
 imageUrl: "http://cfs6.tistory.com/upload_control/download.blog?fhandle=YmxvZzEwNjMwQGZzNi50aXN0b3J5LmNvbTovYXR0YWNoLzEvMTE5LmpwZw%3D%3D"
 latitude: 37.615320754935965
 longitude: 126.57203069585375
 name: "숭례문"
 qrcodeUrl: "http://m.cha.go.kr/korea/heritage/search/Culresult_Db_View.jsp?mc=NS_04_03_01&VdkVgwKey=11,00010000,11&flag=Y#content"
 type: "국보 제1호"
 */
var Treasure = (function () {
    function Treasure(treasureData, map) {
        for (var key in treasureData) {
            this[key] = treasureData[key];
            this.map = map;
        }
    }
    Object.defineProperty(Treasure.prototype, "marker", {
        get: function () {
            if (!this._marker) {
                var latLng = new google.maps.LatLng(this.latitude, this.longitude);
                this._marker = new google.maps.Marker({
                    position: latLng,
                    title: this.name,
                    icon: this.explored ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                });
            }
            return this._marker;
        },
        enumerable: true,
        configurable: true
    });
    return Treasure;
})();
app.service('api', ['$http', '$rootScope', '$state', '$q', 'ionicToast', 'storage', function ($http, $rootScope, $state, $q, ionicToast, storage) {
        var self = this;
        this._authToken = storage.get('authToken', null);
        this.request = function (options, success, error, complete) {
            var targetScope = options.scope || $rootScope;
            options.url = CONSTANTS.API_URL + options.url;
            var lockUrl = options.lockUrl || options.url;
            if (self._authToken) {
                options.headers = {
                    'Authorization': 'Bearer ' + self._authToken
                };
            }
            if (typeof targetScope.lock === 'undefined') {
                targetScope.lock = {};
            }
            if (targetScope.lock[lockUrl]) {
                if (options.force) {
                    targetScope.lock[lockUrl].resolve();
                }
                else {
                    throw new Error('url endpoint locked');
                }
            }
            var canceler = $q.defer();
            targetScope.lock[lockUrl] = canceler;
            $http(options)
                .success(function (res, status) {
                if (typeof success === 'function') {
                    success(res, status);
                }
                if (typeof complete === 'function') {
                    complete(res, status);
                }
                delete targetScope.lock[lockUrl];
            }).error(function (res, status) {
                if (typeof error === 'function') {
                    error(res, status);
                }
                if (typeof complete === 'function') {
                    complete(res, status);
                }
                delete targetScope.lock[lockUrl];
                var errorMessage = res.detail || '오류가 발생했습니다 잠시 후에 다시 시도해주세요';
                ionicToast.show(errorMessage, 'top', false, 1500);
                if (status === 401) {
                    $state.go('login');
                }
            });
        };
        this.setAuthToken = function (token) {
            self._authToken = token;
            storage.set('authToken', self._authToken);
        };
    }]);
app.service('auth', ['$rootScope', 'api', 'storage', function ($rootScope, api, storage) {
        $rootScope.user = storage.get('user', null);
        this.setUser = function (user) {
            $rootScope.user = user;
            storage.set('user', user);
        };
        this.isLogin = function () {
            return !!api._authToken;
        };
    }]);
app.service('message', ['ionicToast', function (ionicToast) {
        this.show = function (message, duration) {
            duration = duration || 1500;
            ionicToast.show(message, 'top', false, duration);
        };
    }]);
app.service('storage', [function () {
        this.get = function (key, defaultValue) {
            var data = window.localStorage.getItem(key);
            if (!data) {
                data = defaultValue;
            }
            else {
                data = JSON.parse(data);
            }
            return data;
        };
        this.set = function (key, value) {
            var data = JSON.stringify(value);
            window.localStorage.setItem(key, data);
        };
        this.remove = function (key) {
            var data = this.get(key);
            window.localStorage.removeItem(key);
            return data;
        };
    }]);
app.controller('LoginController', ['$scope', '$ionicLoading', '$ionicHistory', '$ionicModal', '$state', 'api', 'auth', function ($scope, $ionicLoading, $ionicHistory, $ionicModal, $state, api, auth) {
        $ionicHistory.clearHistory();
        $scope.loginParams = {
            username: "",
            password: ""
        };
        $scope.login = function () {
            var options = {
                url: '/sign-in',
                method: 'post',
                data: $scope.loginParams
            };
            $ionicLoading.show();
            api.request(options, function (res, status) {
                api.setAuthToken(res.token);
                $state.go('map');
            }, null, function (res, status) {
                $ionicLoading.hide();
            });
        };
        $scope.showSignupModal = function () {
            $ionicModal.fromTemplateUrl('templates/modals/signup.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.signupModal = modal;
                modal.show();
            });
        };
    }]);
/// <reference path="../models/Treasure.ts" />
app.controller('MapController', ['$scope', '$ionicHistory', '$ionicModal', 'api', function ($scope, $ionicHistory, $ionicModal, api) {
        $ionicHistory.clearHistory();
        $scope.currentPositionMarker = null;
        var myLatlng = new google.maps.LatLng(37.5775345, 126.9765463);
        var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        navigator.geolocation.watchPosition(function (pos) {
            if ($scope.currentPositionMarker == null) {
                map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                $scope.currentPositionMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
                    map: map,
                    title: "내 위치"
                });
            }
            else {
                $scope.currentPositionMarker.setPosition(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            }
        });
        $scope.map = map;
        map.addListener('dragend', function () {
            $scope.getTreasures();
        });
        // 여기부터.
        $scope.treasuresMap = {};
        $scope.currentTreasuresIdMap = {};
        $scope.selectedTreasure = null;
        $scope.infoWindow = new google.maps.InfoWindow({
            content: ''
        });
        $scope.getTreasures = function () {
            var center = $scope.map.getCenter();
            var ne = $scope.map.getBounds().getNorthEast();
            var params = {
                latitude: center.lat(),
                longitude: center.lng(),
                distance: ne.lat() - center.lat()
            };
            var options = {
                url: '/treasures',
                method: 'get',
                params: params,
                scope: $scope,
                force: true
            };
            api.request(options, function (res, status) {
                $scope.currentTreasuresIdMap = {};
                for (var _i = 0, _a = res.treasures; _i < _a.length; _i++) {
                    var treasureData = _a[_i];
                    var t = new Treasure(treasureData, $scope.map);
                    $scope.currentTreasuresIdMap[t.id] = true;
                    if (!$scope.treasuresMap[t.id]) {
                        $scope.treasuresMap[t.id] = t;
                        t.marker.setMap($scope.map);
                        // add marker event listener
                        (function (treasure) {
                            google.maps.event.addListener(treasure.marker, 'click', function () {
                                $scope.selectTreasure(treasure);
                                $scope.$digest();
                            });
                        })(t);
                    }
                    for (var tid in $scope.treasuresMap) {
                        if (!$scope.currentTreasuresIdMap[tid]) {
                            var marker = $scope.treasuresMap[tid].marker;
                            marker.setMap(null);
                            google.maps.event.clearInstanceListeners(marker);
                            delete $scope.treasuresMap[tid];
                        }
                    }
                }
            });
        };
        $scope.selectTreasure = function (treasure) {
            if ($scope.selectedTreasure) {
                $scope.selectedTreasure.marker.setIcon($scope.selectedTreasure.explored ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png');
                $scope.infoWindow.close();
                if ($scope.selectedTreasure.id === treasure.id) {
                    $scope.selectedTreasure = null;
                    return;
                }
            }
            treasure.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
            $scope.selectedTreasure = treasure;
            $scope.infoWindow.setContent(treasure.name);
            $scope.infoWindow.open($scope.map, treasure.marker);
        };
        // orientation sensor
        document.addEventListener("deviceready", function () {
            if (navigator && navigator.compass) {
                var options = { frequency: 1000 }; // Update every 1 seconds
                var watchID = navigator.compass.watchHeading(function (heading) {
                    console.log(heading.magneticHeading);
                }, function () {
                    console.log('error');
                }, options);
            }
        }, false);
        $scope.showTreasureDetailModal = function () {
            if ($scope.selectedTreasure === null) {
                return;
            }
            $ionicModal.fromTemplateUrl('templates/modals/treasure-detail.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.treasureDetailModal = modal;
                modal.show();
            });
        };
    }]);
app.controller('SignupController', ['$scope', '$ionicLoading', 'message', 'auth', 'api', function ($scope, $ionicLoading, message, auth, api) {
        $scope.signupParams = {
            username: "",
            password: "",
            passwordConfirm: ""
        };
        $scope.signup = function () {
            if ($scope.signupParams.username.length === 0) {
                message.show('아이디를 입력해주세요');
                return;
            }
            if ($scope.signupParams.password.length < 6) {
                message.show('비밀번호는 6자 이상으로 입력해주세요');
                return;
            }
            if ($scope.signupParams.password != $scope.signupParams.passwordConfirm) {
                message.show('비밀번호가 일치하지 않습니다');
                return;
            }
            $ionicLoading.show();
            api.request({
                url: '/sign-up',
                method: 'post',
                data: $scope.signupParams
            }, function (res, status) {
                message.show('가입되었습니다.');
                $scope.hideSignupModal();
            }, null, function (res, status) {
                $ionicLoading.hide();
            });
        };
        $scope.hideSignupModal = function () {
            $scope.$parent.signupModal.hide();
            $scope.$parent.signupModal.remove();
        };
    }]);
app.controller('TreasureDetailController', ['$scope', 'api', function ($scope, $api) {
        $scope.treasure = $scope.$parent.selectedTreasure;
        $scope.hideModal = function () {
            $scope.$parent.treasureDetailModal.hide();
            $scope.$parent.treasureDetailModal.remove();
        };
    }]);
