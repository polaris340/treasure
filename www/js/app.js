var CONSTANTS = {
    API_URL: 'http://54.64.176.231:8080'
};
var app = angular.module('Treasure', ['ionic', 'ionic-toast', 'ngCordova'])
    .run(function ($ionicPlatform, $rootScope, $state, auth, db) {
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
        try {
            db.initialize();
        }
        catch (e) {
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
var Comment = (function () {
    function Comment(data) {
        for (var key in data) {
            this[key] = data[key];
        }
    }
    return Comment;
})();
/// <reference path="../models/Comment.ts" />
app.controller('CommentController', ['$scope', '$ionicLoading', 'api', 'modal', 'camera', function ($scope, $ionicLoading, api, modal, camera) {
        $scope.treasure = $scope.$parent.treasure;
        $scope.comments = [];
        $scope.newCommentData = {
            body: ""
        };
        $scope.commentImageUri = "";
        $scope.fullImage = false;
        $scope.imageUploadProgress = 0;
        $scope.fullImageUrl = "";
        $scope.end = false;
        $scope.addComment = function () {
            if ($scope.commentImageUri) {
                var options = new FileUploadOptions();
                options.fileKey = "image";
                options.fileName = $scope.commentImageUri.substr($scope.commentImageUri.lastIndexOf('/') + 1);
                var params = {};
                params.body = $scope.newCommentData.body;
                options.params = params;
                options.headers = {
                    'Authorization': 'Bearer ' + api._authToken
                };
                var ft = new FileTransfer();
                ft.onprogress = function (progressEvent) {
                    if (progressEvent.lengthComputable) {
                        $scope.imageUploadProgress = progressEvent.loaded / progressEvent.total;
                    }
                };
                $ionicLoading.show();
                ft.upload($scope.commentImageUri, encodeURI(CONSTANTS.API_URL + '/treasures/' + $scope.treasure.id + '/comments'), function (response) {
                    addCommentSuccess(JSON.parse(response.response));
                    $ionicLoading.hide();
                }, function (error) {
                    api.defaultErrorHandler(error.body, error.http_status);
                    $ionicLoading.hide();
                }, options);
            }
            else {
                var options = {
                    url: '/treasures/' + $scope.treasure.id + '/comments',
                    method: 'post',
                    data: $scope.newCommentData,
                    scope: $scope
                };
                $ionicLoading.show();
                api.request(options, addCommentSuccess, null, function () {
                    $ionicLoading.hide();
                });
            }
        };
        $scope.getPicture = function () {
            var options = {};
            camera.getPicture(options)
                .then(function (response) {
                $scope.commentImageUri = response;
            }, function (response) {
                console.log(response);
            });
        };
        $scope.showImage = function (imageUrl) {
            $scope.fullImageUrl = imageUrl;
        };
        $scope.loadData = function () {
            var options = {
                method: 'get',
                url: '/treasures/' + $scope.treasure.id + '/comments',
                scope: $scope
            };
            if ($scope.comments.length > 0) {
                var lastId = $scope.comments[$scope.comments.length - 1].id;
                options.params = {
                    lastId: lastId
                };
            }
            api.request(options, function (res) {
                res.comments.forEach(function (item) {
                    $scope.comments.push(new Comment(item));
                });
                if (res.comments.length === 0) {
                    $scope.end = true;
                }
            }, function () {
                $scope.end = true;
            }, function () {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };
        $scope.deleteComment = function (comment) {
            var options = {
                method: 'delete',
                url: '/treasures/' + comment.tid + '/comments/' + comment.id,
                scope: $scope
            };
            $ionicLoading.show();
            api.request(options, function (res) {
                $scope.comments.splice($scope.comments.indexOf(comment), 1);
            }, null, function () {
                $ionicLoading.hide();
            });
        };
        $scope.hideModal = function () {
            modal.hide('comment');
        };
        function addCommentSuccess(res) {
            $scope.comments.unshift(new Comment(res.comment));
            $scope.commentImageUri = '';
            $scope.newCommentData = {
                body: ""
            };
        }
    }]);
app.controller('ExploreModalController', ['$scope', '$rootScope', '$timeout', '$ionicLoading', 'api', 'modal', 'message', 'db', function ($scope, $rootScope, $timeout, $ionicLoading, api, modal, message, db) {
        $scope.treasure = $scope.$parent.treasure;
        $scope.exploreStatus = 'waiting';
        $scope.message = '인증중입니다';
        // 찾기 인증
        $scope.explore = function () {
            var currentPosition = $scope.$parent.$parent.currentPositionMarker.getPosition();
            var targetPosition = new google.maps.LatLng($scope.treasure.latitude, $scope.treasure.longitude);
            if (google.maps.geometry.spherical.computeDistanceBetween(currentPosition, targetPosition) > $scope.EXPLORE_DISTANCE) {
                $scope.message = '인증 실패! 보물 근처로 이동해주세요';
                $scope.exploreStatus = 'fail';
                $scope.hideModal(3000);
                return;
            }
            $ionicLoading.show();
            api.request({
                url: '/treasures/' + $scope.treasure.id + '/explored',
                method: 'post',
                scope: $scope
            }, function (response) {
                $ionicLoading.hide();
                $scope.exploreStatus = 'success';
                $scope.treasure.explored = true;
                $scope.treasure.setMarkerIcon(true);
                db.insert($scope.treasure);
                $rootScope.user.totalExplored++;
                $scope.message = '인증되었습니다';
                $scope.hideModal(3000);
            }, function () {
                $ionicLoading.hide();
                $scope.exploreStatus = 'fail';
                $scope.message = '오류가 발생했습니다. 잠시 후에 다시 시도해주세요';
                $scope.hideModal(3000);
            });
            //$scope.$parent.selectedTreasure.explored = true;
            //$scope.$parent.selectedTreasure.setMarkerIcon(true);
        };
        $scope.hideModal = function (delay) {
            delay = delay || 0;
            $timeout(function () {
                modal.hide('explore');
            }, delay);
        };
        $scope.explore();
    }]);
app.controller('LoginController', ['$scope', '$ionicLoading', '$ionicHistory', 'modal', '$state', 'api', 'auth', function ($scope, $ionicLoading, $ionicHistory, modal, $state, api, auth) {
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
            modal.show('signup', 'templates/modals/signup.html', $scope);
        };
    }]);
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
    function Treasure(treasureData) {
        for (var key in treasureData) {
            var val = treasureData[key];
            if (val === 'true') {
                val = true;
            }
            if (val === 'false') {
                val = false;
            }
            this[key] = val;
        }
    }
    Object.defineProperty(Treasure.prototype, "marker", {
        get: function () {
            if (!this._marker) {
                //var icon = 'img/icon/ic_marker_default.png';
                //if (this.explored) {
                //  icon = 'img/icon/ic_marker_found.png';
                //} else if (this.liked) {
                //  icon = 'img/icon/ic_marker_liked.png';
                //}
                var latLng = new google.maps.LatLng(this.latitude, this.longitude);
                this._marker = new google.maps.Marker({
                    position: latLng,
                    title: this.name
                });
                this.setMarkerIcon(false);
            }
            return this._marker;
        },
        enumerable: true,
        configurable: true
    });
    Treasure.prototype.setMarkerIcon = function (selected) {
        var icon = 'img/icon/ic_marker_';
        if (selected)
            icon += 'selected_';
        var suffix = 'default';
        if (this.explored)
            suffix = 'found';
        else if (this.liked)
            suffix = 'liked';
        icon += suffix + '.png';
        this.marker.setIcon(icon);
    };
    Treasure.prototype.update = function (data) {
        for (var key in data) {
            this[key] = data[key];
        }
    };
    return Treasure;
})();
/// <reference path="../models/Treasure.ts" />
app.controller('MapController', ['$scope', '$ionicHistory', '$q', '$timeout', '$http', '$ionicLoading', '$ionicSideMenuDelegate', 'modal', 'api', 'distance', 'db', 'storage', 'auth', function ($scope, $ionicHistory, $q, $timeout, $http, $ionicLoading, $ionicSideMenuDelegate, modal, api, distance, db, storage, auth) {
        $scope.MIN_ZOOM_LEVEL_FOR_MARKER = 12;
        $ionicHistory.clearHistory();
        $scope.currentPositionMarker = null;
        $scope.distanceToSelectedTreasure = '';
        $scope.angleToSelectedTreasure = 0;
        $scope.currentZoomLevel = 16;
        auth.requestUserData();
        var myLatlng = new google.maps.LatLng(37.5775345, 126.9765463);
        var mapOptions = {
            center: myLatlng,
            zoom: $scope.currentZoomLevel,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        navigator.geolocation.watchPosition(function (pos) {
            if ($scope.currentPositionMarker == null) {
                map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                $scope.currentPositionMarker = $scope.createCurrentPositionMarker();
                $scope.currentPositionMarker.setMap($scope.map);
                // 처음에 한번 불러옴
                $scope.getTreasures();
            }
            $scope.currentPositionMarker.setPosition(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            $scope.calculateDistance();
            $scope.$digest();
        });
        $scope.map = map;
        $scope.map.addListener('zoom_changed', function () {
            $scope.$apply(function () {
                $scope.currentZoomLevel = $scope.map.getZoom();
                if ($scope.currentZoomLevel < $scope.MIN_ZOOM_LEVEL_FOR_MARKER) {
                    $scope.hideAllMarkers();
                    $scope.selectTreasure(null);
                }
            });
        });
        map.addListener('dragend', function () {
            $scope.getTreasures();
        });
        // 여기부터.
        $scope.treasuresMap = {};
        $scope.currentTreasuresIdMap = {};
        $scope.selectedTreasure = null;
        //$scope.infoWindow = new google.maps.InfoWindow({
        //  content: ''
        //});
        $scope.getTreasures = function () {
            if ($scope.currentZoomLevel < $scope.MIN_ZOOM_LEVEL_FOR_MARKER) {
                return;
            }
            var center = $scope.map.getCenter();
            var ne = $scope.map.getBounds().getNorthEast();
            var sw = $scope.map.getBounds().getSouthWest();
            var where = "\n    where latitude between ? and ?\n    and longitude between ? and ?\n    ";
            if (db.initialized) {
                db.select(where, [sw.lat(), ne.lat(), sw.lng(), ne.lng()])
                    .then(function (res) {
                    for (var i = 0; i < res.rows.length; i++) {
                        var t = new Treasure(res.rows.item(i));
                        $scope.currentTreasuresIdMap[t.id] = true;
                        if (!$scope.treasuresMap[t.id]) {
                            $scope.treasuresMap[t.id] = t;
                            if (!$scope.searchMode) {
                                t.marker.setMap($scope.map);
                            }
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
            }
            else {
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
                        var t = new Treasure(treasureData);
                        $scope.currentTreasuresIdMap[t.id] = true;
                        if (!$scope.treasuresMap[t.id]) {
                            $scope.treasuresMap[t.id] = t;
                            if (!$scope.searchMode) {
                                t.marker.setMap($scope.map);
                            }
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
            }
        };
        $scope.selectTreasure = function (treasure) {
            if ($scope.selectedTreasure) {
                $scope.selectedTreasure.setMarkerIcon(false);
            }
            if (treasure === null ||
                ($scope.selectedTreasure && $scope.selectedTreasure.id === treasure.id)) {
                $scope.selectedTreasure = null;
                $scope.distanceToSelectedTreasure = "";
                $scope.angleToSelectedTreasure = 0;
                return;
            }
            api.request({
                scope: $scope,
                method: 'get',
                url: '/treasures/' + treasure.id,
                force: true
            }, function (res, status) {
                if ($scope.selectedTreasure) {
                    $scope.selectedTreasure.update(res.treasure);
                }
            });
            treasure.setMarkerIcon(true);
            $scope.selectedTreasure = treasure;
            //$scope.infoWindow.setContent(treasure.name);
            //$scope.infoWindow.open($scope.map, treasure.marker);
            $scope.calculateDistance();
            $scope.$digest();
        };
        // orientation sensor
        document.addEventListener("deviceready", function () {
            if (navigator && navigator.compass) {
                var options = { frequency: 500 }; // Update every 0.2 seconds
                var watchID = navigator.compass.watchHeading(function (heading) {
                    $scope.calculateAngle(heading.magneticHeading);
                    $scope.$digest();
                }, function () {
                    // error
                }, options);
            }
        }, false);
        $scope.showTreasureDetailModal = function () {
            if ($scope.selectedTreasure === null) {
                return;
            }
            modal.show('treasureDetail', 'templates/modals/treasure-detail.html', $scope);
        };
        $scope.calculateDistance = function () {
            if (!$scope.selectedTreasure || !$scope.currentPositionMarker) {
                return;
            }
            var currentPosition = $scope.currentPositionMarker.getPosition();
            var targetPosition = $scope.selectedTreasure.marker.getPosition();
            var meters = google.maps.geometry.spherical.computeDistanceBetween(currentPosition, targetPosition);
            $scope.distanceToSelectedTreasure = distance.toDisplayDistance(meters);
        };
        $scope.calculateAngle = function (magneticHeading) {
            if (!$scope.selectedTreasure && !$scope.currentPositionMarker) {
                return;
            }
            if ($scope.selectedTreasure) {
                var currentPosition = $scope.currentPositionMarker.getPosition();
                var targetPosition = $scope.selectedTreasure.marker.getPosition();
                var angle = google.maps.geometry.spherical.computeHeading(currentPosition, targetPosition);
                var nextAngle = angle - magneticHeading;
                if (nextAngle < -180) {
                    nextAngle += 360;
                }
                $scope.angleToSelectedTreasure = nextAngle;
            }
            if ($scope.arrowIcon) {
                $scope.arrowIcon.rotation = magneticHeading;
                $scope.currentPositionMarker.setOptions({ icon: $scope.arrowIcon });
            }
        };
        $scope.toCurrentLocation = function () {
            if (!$scope.currentPositionMarker) {
                return;
            }
            $scope.map.panTo($scope.currentPositionMarker.getPosition());
        };
        $scope.createCurrentPositionMarker = function () {
            $scope.arrowIcon = {
                path: 'M 0,-17 L 11,11 L 0,0 L -11,11 L 0,-17',
                strokeColor: 'rgba(0, 0, 0, 0.2)',
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: '#D83F2A',
                fillOpacity: 1,
                rotation: 0,
                scale: 1.0
            };
            var arrowOptions = {
                icon: $scope.arrowIcon,
                clickable: false,
                visible: true,
                animation: 0,
            };
            return new google.maps.Marker(arrowOptions);
        };
        // 검색
        $scope.searchParams = {
            keyword: ''
        };
        $scope.searchResults = [];
        $scope.searchMode = false;
        $scope.searchDefer = null;
        $scope.searchPromise = null;
        $scope.enterSearchMode = function () {
            $scope.searchMode = true;
            $scope.selectTreasure(null);
            $scope.hideAllMarkers();
        };
        $scope.$watch(function () {
            return $scope.searchParams.keyword;
        }, function (newVal, oldVal) {
            if (newVal) {
                if ($scope.searchPromise) {
                    $timeout.cancel($scope.searchPromise);
                    $scope.searchPromise = null;
                }
                if ($scope.searchDefer) {
                    $scope.searchDefer.resolve();
                    $scope.searchDefer = null;
                }
                $scope.searchPromise = $timeout($scope.search, 300);
            }
        });
        $scope.search = function () {
            $scope.searchDefer = $q.defer();
            var options = {
                url: CONSTANTS.API_URL + '/treasures',
                params: $scope.searchParams,
                method: 'get',
                timeout: $scope.searchDefer.promise
            };
            $http(options)
                .then(function (response) {
                for (var _i = 0, _a = $scope.searchResults; _i < _a.length; _i++) {
                    var t = _a[_i];
                    t.marker.setMap(null);
                }
                // http://stackoverflow.com/a/19304625 fitBounds
                $scope.searchResults = [];
                var bounds = new google.maps.LatLngBounds();
                for (var _b = 0, _c = response.data.treasures; _b < _c.length; _b++) {
                    var treasureData = _c[_b];
                    var t = new Treasure(treasureData);
                    $scope.searchResults.push(t);
                    t.marker.setMap($scope.map);
                    bounds.extend(t.marker.getPosition());
                    // add marker event listener
                    (function (treasure) {
                        google.maps.event.addListener(treasure.marker, 'click', function () {
                            $scope.selectTreasure(treasure);
                            $scope.$digest();
                        });
                    })(t);
                }
                $scope.map.fitBounds(bounds);
                $scope.searchDefer = null;
                $scope.searchPromise = null;
            }, function () {
                $scope.searchDefer = null;
                $scope.searchPromise = null;
            });
        };
        $scope.leaveSearchMode = function () {
            if (!$scope.searchMode)
                return;
            for (var _i = 0, _a = $scope.searchResults; _i < _a.length; _i++) {
                var t = _a[_i];
                t.marker.setMap(null);
            }
            $scope.searchResults = [];
            $scope.map.setZoom(16);
            $scope.toCurrentLocation();
            $scope.searchMode = false;
            $scope.searchParams = {
                keyword: ''
            };
            $scope.showAllMarkers();
        };
        $scope.hideAllMarkers = function () {
            for (var tid in $scope.treasuresMap) {
                $scope.treasuresMap[tid].marker.setMap(null);
            }
        };
        $scope.showAllMarkers = function () {
            for (var tid in $scope.treasuresMap) {
                $scope.treasuresMap[tid].marker.setMap($scope.map);
            }
        };
        $scope.toggleLeft = function () {
            $ionicSideMenuDelegate.toggleLeft();
        };
        $scope.openExploredTreasuresModal = function () {
            $ionicLoading.show();
            api.request({
                url: '/treasures/liked',
                method: 'get'
            }, function (res) {
                $ionicLoading.hide();
                modal.show('liked', '/templates/modals/treasure-list.html', $scope, {
                    treasures: res.treasures,
                    title: '찜한 보물'
                });
            }, function (res) {
                $ionicLoading.hide();
            });
        };
        $scope.openLikedTreasuresModal = function () {
            $ionicLoading.show();
            api.request({
                url: '/treasures/explored',
                method: 'get'
            }, function (res) {
                $ionicLoading.hide();
                modal.show('explored', '/templates/modals/treasure-list.html', $scope, {
                    treasures: res.treasures,
                    title: '찾은 보물'
                });
            }, function (res) {
                $ionicLoading.hide();
            });
        };
        // sync data from server
        var syncData = function () {
            var lastUpdated = storage.get('lastUpdated');
            var params = {};
            if (lastUpdated) {
                params.lastUpdated = lastUpdated;
            }
            var now = new Date().toISOString();
            $ionicLoading.show();
            api.request({
                url: '/treasures',
                method: 'get',
                params: params
            }, function (res) {
                db.bulkInsert(res.treasures)
                    .then(function (response) {
                    storage.set('lastUpdated', now);
                    $ionicLoading.hide();
                }, function (response) {
                    $ionicLoading.hide();
                });
            }, function () {
                $ionicLoading.hide();
            });
        };
        if (db.initialized) {
            syncData();
        }
        else {
            $scope.$on('db.initialized', function () {
                syncData();
            });
        }
    }]);
app.controller('QuizController', ['$scope', '$rootScope', '$ionicSlideBoxDelegate', '$ionicLoading', 'api', 'modal', 'message',
    function ($scope, $rootScope, $ionicSlideBoxDelegate, $ionicLoading, api, modal, message) {
        $scope.treasure = $scope.$parent.treasure;
        $scope.quizzes = [];
        $scope.currentPageIndex = 0;
        $scope.hideModal = function () {
            modal.hide('quiz');
        };
        api.request({
            url: '/treasures/' + $scope.treasure.id + '/quizzes',
            method: 'get',
            scope: $scope
        }, function (response) {
            $scope.quizzes = response.quizzes;
            $ionicSlideBoxDelegate.update();
        });
        $scope.checkAnswer = function (quiz) {
            $ionicLoading.show();
            api.request({
                url: '/treasures/' + $scope.treasure.id + '/quizzes/' + quiz.id,
                method: 'post',
                data: {
                    answer: quiz.userAnswer
                },
                scope: $scope
            }, function (response) {
                $ionicLoading.hide();
                var msg = '틀렸습니다';
                if (response.ok) {
                    quiz.soved = true;
                    msg = '맞았습니다';
                    $rootScope.user.currentPoinsts = response.currentPoints;
                }
                message.show(msg);
            }, function () {
                $ionicLoading.hide();
            });
        };
    }]);
app.controller('SignupController', ['$scope', '$ionicLoading', 'message', 'auth', 'api', 'modal', function ($scope, $ionicLoading, message, auth, api, modal) {
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
            modal.hide('signup');
        };
    }]);
app.controller('TreasureDetailController', ['$rootScope', '$scope', '$ionicPopup', '$ionicLoading', 'modal', 'api', 'message', 'db', function ($rootScope, $scope, $ionicPopup, $ionicLoading, modal, api, message, db) {
        $scope.EXPLORE_DISTANCE = 30;
        $scope.treasure = $scope.$parent.selectedTreasure;
        $scope.likeToggle = function () {
            $scope.treasure.liked = !$scope.treasure.liked;
            var options = {
                method: 'post',
                url: '/treasures/' + $scope.treasure.id + '/like',
                data: {
                    liked: $scope.treasure.liked
                },
                scope: $scope
            };
            // 성공하면 아무것도 안함
            api.request(options, function (res) {
                if ($scope.treasure.liked) {
                    message.show('찜했습니다');
                    $rootScope.user.totalLiked++;
                }
                else {
                    message.show('찜하기 취소');
                    $rootScope.user.totalLiked--;
                }
            }, function (res) {
                $scope.treasure.liked = !$scope.treasure.liked;
            });
        };
        $scope.hideModal = function () {
            modal.hide('treasureDetail');
        };
        $scope.showCommentModal = function () {
            modal.show('comment', 'templates/modals/comment.html', $scope);
        };
        $scope.showExploreModal = function () {
            modal.show('explore', 'templates/modals/explore.html', $scope);
        };
        $scope.showQuizModal = function () {
            if (!$scope.treasure.explored) {
                message.show('아직 찾지 못한 보물입니다.');
                return;
            }
            modal.show('quiz', 'templates/modals/quiz.html', $scope);
        };
        // 찾기 인증
        $scope.explore = function () {
            var currentPosition = $scope.$parent.currentPositionMarker.getPosition();
            var targetPosition = new google.maps.LatLng($scope.treasure.latitude, $scope.treasure.longitude);
            if (google.maps.geometry.spherical.computeDistanceBetween(currentPosition, targetPosition) > $scope.EXPLORE_DISTANCE) {
                message.show('보물 근처로 이동해주세요');
                return;
            }
            $ionicLoading.show();
            api.request({
                url: '/treasures/' + $scope.treasure.id + '/explored',
                method: 'post',
                scope: $scope
            }, function (response) {
                $ionicLoading.hide();
                $scope.treasure.explored = true;
                $scope.treasure.setMarkerIcon(true);
                db.insert($scope.treasure);
                $rootScope.user.totalExplored++;
            }, function () {
                $ionicLoading.hide();
            });
            //$scope.$parent.selectedTreasure.explored = true;
            //$scope.$parent.selectedTreasure.setMarkerIcon(true);
        };
    }]);
app.controller('TreasureListController', ['$scope', 'modal', function ($scope, modal) {
        $scope.hideModal = function () {
            modal.hide('liked');
            modal.hide('explored');
        };
    }]);
var iconTemplate = "\n<span class=\"icon-directive\"\nstyle=\"margin: {{padding}}px; width: {{width}}px; height: {{height}}px; background-image: url('{{src}}'); vertical-align: middle;\"\n></span>\n";
app.directive('icon', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: iconTemplate,
        controller: function ($scope, $element, $attrs) {
            $scope.padding = parseInt($attrs.padding || 0);
            $scope.width = parseInt($attrs.width || 0);
            $scope.height = parseInt($attrs.height || 0);
            $scope.width = $scope.width || $scope.height;
            $scope.height = $scope.height || $scope.width;
            $scope.src = $attrs.src;
            if ($scope.padding) {
                $scope.width -= $scope.padding * 2;
                $scope.height -= $scope.padding * 2;
            }
        }
    };
});
var snackbarTemplate = "\n  <div class=\"snackbar\">\n    <p>{{ message }}</p>\n  </div>\n";
app.directive('snackbar', function () {
    return {
        restrict: 'E',
        scope: {
            message: '=',
            buttonText: '=',
            action: '&'
        },
        template: snackbarTemplate
    };
});
app.service('api', ['$http', '$rootScope', '$state', '$q', 'ionicToast', 'storage', 'modal', function ($http, $rootScope, $state, $q, ionicToast, storage, modal) {
        var self = this;
        this._authToken = storage.get('authToken', null);
        if (this._authToken) {
            $http.defaults.headers.common.Authorization = 'Bearer ' + this._authToken;
        }
        this.request = function (options, success, error, complete) {
            var targetScope = options.scope || $rootScope;
            var lockUrl = options.lockUrl || options.url;
            options.url = CONSTANTS.API_URL + options.url;
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
            delete options.scope;
            $http(options)
                .then(function (response) {
                var res = response.data || {};
                var status = response.status;
                if (typeof success === 'function') {
                    success(res, status);
                }
                if (typeof complete === 'function') {
                    complete(res, status);
                }
                delete targetScope.lock[lockUrl];
            }, function (response) {
                var res = response.data || {};
                var status = response.status;
                if (typeof error === 'function') {
                    error(res, status);
                }
                if (typeof complete === 'function') {
                    complete(res, status);
                }
                delete targetScope.lock[lockUrl];
                self.defaultErrorHandler(res, status);
            });
        };
        this.setAuthToken = function (token) {
            self._authToken = token;
            if (token === null) {
                storage.remove('authToken');
            }
            else {
                storage.set('authToken', self._authToken);
                $http.defaults.headers.common.Authorization = 'Bearer ' + self._authToken;
            }
        };
        this.defaultErrorHandler = function (res, status) {
            var errorMessage = res.detail || '오류가 발생했습니다 잠시 후에 다시 시도해주세요';
            ionicToast.show(errorMessage, 'top', false, 1500);
            if (status === 401) {
                self.setAuthToken(null);
                modal.hideAll();
                $state.go('login');
            }
        };
    }]);
app.service('auth', ['$rootScope', '$state', '$ionicPopup', 'api', 'storage', 'db', function ($rootScope, $state, $ionicPopup, api, storage, db) {
        var self = this;
        $rootScope.user = storage.get('user', null);
        this.setUser = function (user) {
            $rootScope.user = user;
            storage.set('user', user);
        };
        this.isLogin = function () {
            return !!api._authToken;
        };
        this.requestUserData = function () {
            if (!this.isLogin()) {
                return;
            }
            var self = this;
            api.request({
                url: '/users/me',
                method: 'get'
            }, function (res) {
                self.setUser(res.user);
                api.setAuthToken(res.token);
            });
        };
        this.logout = function () {
            if (!self.isLogin())
                return;
            var confirmPopup = $ionicPopup.confirm({
                title: '로그아웃',
                template: '로그아웃 하시겠습니까?',
                okText: '로그아웃',
                cancelText: '취소'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    self.setUser(null);
                    api.setAuthToken(null);
                    $state.go('login');
                    db.deleteAll();
                }
            });
        };
        $rootScope.logout = this.logout;
    }]);
app.service('camera', ['$q', function ($q) {
        this.getPicture = function (options) {
            var q = $q.defer();
            if (navigator.camera) {
                navigator.camera.getPicture(function (result) {
                    // Do any magic you need
                    q.resolve(result);
                }, function (err) {
                    q.reject(err);
                }, options);
            }
            return q.promise;
        };
    }]);
app.service('db', ['$rootScope', '$cordovaSQLite', '$q', function ($rootScope, $cordovaSQLite, $q) {
        var self = this;
        this.initialized = false;
        this.columns = {
            id: {
                type: 'INTEGER',
                primary: true
            },
            name: {
                type: 'TEXT'
            },
            latitude: {
                type: 'REAL'
            },
            longitude: {
                type: 'REAL'
            },
            explored: {
                type: 'INTEGER'
            },
            liked: {
                type: 'INTEGER'
            },
            updated: {
                type: 'TEXT'
            },
            created: {
                type: 'TEXT'
            }
        };
        this.initialize = function () {
            self.db = $cordovaSQLite.openDB({ name: "treasure.db" });
            $cordovaSQLite.execute(self.db, "\n    CREATE TABLE IF NOT EXISTS treasure (\n    id integer primary key,\n    name text,\n    latitude real,\n    longitude real,\n    explored integer,\n    liked integer,\n    updated text,\n    created text\n    );");
            self.initialized = true;
            $rootScope.$broadcast('db.initialized');
        };
        this.insert = function (obj) {
            if (!self.initialized)
                return;
            var columnNames = [];
            var values = [];
            var params = [];
            for (var c in self.columns) {
                values.push('?');
                columnNames.push(c);
                params.push(obj[c]);
            }
            var query = "INSERT OR REPLACE INTO treasure (" + columnNames.join(',') + ') values (' + values.join(',') + ')';
            return $cordovaSQLite.execute(self.db, query, params);
        };
        this.bulkInsert = function (targets) {
            if (!self.initialized)
                return;
            var columnNames = [];
            for (var c in self.columns) {
                columnNames.push(c);
            }
            var promises = [];
            while (targets.length > 0) {
                var objs = targets.splice(0, 100);
                var values = [];
                var realValues = [];
                for (var _i = 0; _i < objs.length; _i++) {
                    var o = objs[_i];
                    var v = [];
                    for (var _a = 0; _a < columnNames.length; _a++) {
                        var k = columnNames[_a];
                        v.push('?');
                        realValues.push(o[k]);
                    }
                    values.push('(' + v.join(',') + ')');
                }
                var query = "INSERT OR REPLACE INTO treasure (" + columnNames.join(',') + ') VALUES '
                    + values.join(',');
                promises.push($cordovaSQLite.execute(self.db, query, realValues));
            }
            return $q.all(promises);
        };
        this.select = function (where, params) {
            if (!self.initialized)
                return;
            return $cordovaSQLite.execute(self.db, 'select * from treasure ' + where + ' limit 100', params);
        };
        this.deleteAll = function () {
            if (!self.initialized)
                return;
            return $cordovaSQLite.execute(self.db, 'delete from treasure');
        };
    }]);
app.service('distance', [function () {
        this.toDisplayDistance = function (meters) {
            var d = "";
            if (meters / 1000 > 0) {
                d += Math.round(meters / 1000) + "km";
            }
            else {
                d += Math.round(meters % 1000) + "m";
            }
            return d;
        };
    }]);
app.service('message', ['ionicToast', function (ionicToast) {
        this.show = function (message, duration) {
            duration = duration || 1500;
            ionicToast.show(message, 'top', false, duration);
        };
    }]);
app.service('modal', ['$ionicModal', function ($ionicModal) {
        var self = this;
        this.modals = {};
        this.show = function (name, url, scope, scopeValues, animation) {
            animation = animation || 'slide-in-up';
            $ionicModal.fromTemplateUrl(url, {
                scope: scope,
                animation: animation
            }).then(function (modal) {
                if (scopeValues) {
                    for (var key in scopeValues) {
                        modal.scope[key] = scopeValues[key];
                    }
                }
                self.modals[name] = modal;
                modal.show();
            });
        };
        this.hide = function (name) {
            if (!self.modals[name]) {
                return;
            }
            self.modals[name].hide();
            self.modals[name].remove();
            delete self.modals[name];
        };
        this.hideAll = function () {
            for (var name in self.modals) {
                self.hide(name);
            }
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
