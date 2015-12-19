/// <reference path="../models/Treasure.ts" />

app.controller('MapController', ['$scope', '$rootScope', '$ionicHistory', '$state', '$q', '$timeout', '$window', '$http', '$ionicLoading', '$ionicSideMenuDelegate', 'modal', 'api', 'distance', 'db', 'storage', 'auth', 'message', '$ionicPlatform', '$ionicPopup', function ($scope, $rootScope, $ionicHistory, $state, $q, $timeout, $window, $http, $ionicLoading, $ionicSideMenuDelegate, modal, api, distance, db, storage, auth, message, $ionicPlatform, $ionicPopup) {
  $scope.searchHistory = storage.get('searchHistory') || [];

  $scope.MIN_ZOOM_LEVEL_FOR_MARKER = 12;
  $ionicHistory.clearHistory();
  $scope.currentPositionMarker = null;
  $scope.distanceToSelectedTreasure = '';
  $scope.angleToSelectedTreasure = 0;
  $scope.currentZoomLevel = 16;
  $scope.exploringTreasure = null;
  $scope.locationTreasureMap = {};
  $scope.treasureListExpanded = false;
  $scope.treasuresMap = {};
  $scope.currentTreasuresIdMap = {};
  $scope.selectedTreasure = null;

  var initialize = function () {
    $scope.exploringTreasure = null;
    $scope.locationTreasureMap = {};
    $scope.treasureListExpanded = false;
    $scope.treasuresMap = {};
    $scope.currentTreasuresIdMap = {};
    $scope.selectedTreasure = null;
  };

  var lineSymbol = {
    path: 'M 0,-2 0,0',
    strokeOpacity: 1,
    scale: 4
  };
  $scope.lineToTarget = new google.maps.Polyline({
    path: [{lat: 36, lng: 127}, {lat: 36, lng: 127}],
    geodesic: true,
    strokeColor: '#D83F2A',
    strokeOpacity: 1,
    strokeWeight: 2
    //icons: [{
    //  icon: lineSymbol,
    //  offset: '0',
    //  repeat: '20px'
    //}]
  });

  if (auth.isLogin()) {
    auth.requestUserData();
  }


  var myLatlng = new google.maps.LatLng(37.5775345, 126.9765463);

  var mapOptions = {
    center: myLatlng,
    zoom: $scope.currentZoomLevel,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
  };
  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  var searchInput = null;
  var hideKeyboard = function () {
    if (!searchInput) {
      searchInput = document.getElementsByClassName('search-box')[0].getElementsByTagName('input')[0];
    }
    searchInput.blur();
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.close();
    }
  };

  map.addListener('mousedown', function () {
    if (!$scope.exploringTreasure)
      $scope.selectTreasure(null);
    $scope.$digest();
    hideKeyboard();
  });

  var watchPosition = function () {
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
      $scope.refreshPath();


      $scope.$digest();
    });
  };

  if (window.CheckGPS) {
    window.CheckGPS.check(function () {
      watchPosition();
    }, function () {
      alert('원활한 이용을 위해 GPS를 켜 주십시오');
      var intervalId = setInterval(function () {
        window.CheckGPS.check(function () {
          watchPosition();
          clearInterval(intervalId);
        });
      }, 1000);
    });
  } else {
    watchPosition();
  }


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
    hideKeyboard();
    $scope.getTreasures();
  });

  // 여기부터.


  //$scope.infoWindow = new google.maps.InfoWindow({
  //  content: ''
  //});

  $scope.getTreasures = function () {
    if ($scope.currentZoomLevel < $scope.MIN_ZOOM_LEVEL_FOR_MARKER) {
      return;
    }

    if ($scope.exploringTreasure) {
      return;
    }

    if ($scope.currentTour) {
      return;
    }

    var center = $scope.map.getCenter();
    var ne = $scope.map.getBounds().getNorthEast();
    var sw = $scope.map.getBounds().getSouthWest();
    var where = `
    where latitude between ? and ?
    and longitude between ? and ?
    `;

    var loadTreasureCallback = function (treasureDataArray) {
      $scope.currentTreasuresIdMap = {};
      $scope.locationTreasureMap = {};
      for (var td of treasureDataArray) {
        var t:Treasure = new Treasure(td);
        $scope.currentTreasuresIdMap[t.id] = true;
        if ($scope.locationTreasureMap[t.locationString]) {
          $scope.locationTreasureMap[t.locationString].push(t);
        } else {
          $scope.locationTreasureMap[t.locationString] = [t];
        }
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
    };

    //if (db.initialized && auth.isLogin()) {
    if (false) {
      db.select(where, [sw.lat(), ne.lat(), sw.lng(), ne.lng()])
        .then(function (res) {
          var treasureDataArray = [];
          for (var i = 0; i < res.rows.length; i++) {
            treasureDataArray.push(res.rows.item(i));
          }
          loadTreasureCallback(treasureDataArray);
        });
    } else {
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
        loadTreasureCallback(res.treasures);
      });
    }
  };

  $scope.refreshPath = function () {
    // redraw line to target

    if (!$scope.exploringTreasure || !$scope.currentPositionMarker) {
      $scope.lineToTarget.setMap(null);
      return;
    }


    if ($scope.exploringTreasure.explored) {
      $scope.lineToTarget.setMap(null);
      return;
    }
    $scope.lineToTarget.setMap($scope.map);

    var path = [{
      lat: $scope.exploringTreasure.latitude,
      lng: $scope.exploringTreasure.longitude
    }, {
      lat: $scope.currentPositionMarker.getPosition().lat(),
      lng: $scope.currentPositionMarker.getPosition().lng()
    }];

    $scope.lineToTarget.setPath(path);
  };

  $scope.selectTreasure = function (treasure, panTo) {
    $scope.treasureListExpanded = false;
    if ($scope.selectedTreasure) {
      $scope.selectedTreasure.setMarkerIcon(false);
      // $scope.infoWindow.close();
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

    if (panTo) {
      if ($scope.treasuresMap[treasure.id]) {
        treasure = $scope.treasuresMap[treasure.id];
      }
      treasure.marker.setMap($scope.map);
      $scope.map.panTo(treasure.marker.getPosition());
      $ionicSideMenuDelegate.toggleLeft(false);
    }


    treasure.setMarkerIcon(true);
    $scope.selectedTreasure = treasure;
    //$scope.infoWindow.setContent(treasure.name);
    //$scope.infoWindow.open($scope.map, treasure.marker);

    $scope.calculateDistance();
    $scope.refreshPath();

    try {
      $scope.$digest();
    } catch (e) {
    }
  };


  // orientation sensor
  document.addEventListener("deviceready", function () {
    if (navigator && navigator.compass) {
      var options = {frequency: 500};  // Update every 0.2 seconds
      var watchID = navigator.compass.watchHeading(function (heading) {
        $scope.calculateAngle(heading.magneticHeading);
        $scope.$digest();
      }, function () {
        // error
      }, options);
    }
  }, false);

  $scope.showNoticeListModal = function() {
    modal.show('noticeList', 'templates/modals/notice-list.html', $scope);
  };

  $scope.showSettingModal = function () {
    modal.show('setting', 'templates/modals/setting.html', $scope);
  };

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
    if (!$scope.selectedTreasure || !$scope.currentPositionMarker) {
      return;
    }

    if ($scope.currentPositionMarker && !$scope.currentPositionMarker.getPosition()) {
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
      $scope.currentPositionMarker.setOptions({icon: $scope.arrowIcon});
    }

  };


  $scope.toCurrentLocation = function () {
    if (!$scope.currentPositionMarker) {
      return;
    }
    var currentMarkerPosition = $scope.currentPositionMarker.getPosition();
    var currentMapCenterPosition = $scope.map.getCenter();

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
    if (!$scope.searchParams.keyword) {
      $scope.searchDefer = null;
      $scope.searchPromise = null;
      return;
    }
    var index = $scope.searchHistory.indexOf($scope.searchParams.keyword);
    if (index >= 0) {
      $scope.searchHistory.splice(index, 1);
    }
    $scope.searchHistory.unshift($scope.searchParams.keyword);
    if ($scope.searchHistory.length > 10) {
      $scope.searchHistory.pop();
    }
    storage.set('searchHistory', $scope.searchHistory);

    $http(options)
      .then(function (response) {
        $scope.searchDefer = null;
        $scope.searchPromise = null;

        for (var t of $scope.searchResults) {
          t.marker.setMap(null);
        }

        if (response.data.treasures.length === 0) {
          message.show('검색 결과가 없습니다.');
          return;
        }

        // http://stackoverflow.com/a/19304625 fitBounds
        $scope.searchResults = [];
        var bounds = new google.maps.LatLngBounds();
        for (var treasureData of response.data.treasures) {
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
      }, function () {
        $scope.searchDefer = null;
        $scope.searchPromise = null;
      });
  };

  $scope.leaveSearchMode = function () {
    if (!$scope.searchMode) return;

    for (var t of $scope.searchResults) {
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

    if ($scope.exploringTreasure) {
      $scope.exploringTreasure.marker.setMap($scope.map);
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

  $scope.openLikedTreasuresModal = function () {
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }
    if ($rootScope.user.totalLiked === 0) {
      message.show('아직 찜한 보물이 없습니다.');
      return;
    }
    $ionicLoading.show();
    api.request({
      url: '/treasures/liked',
      method: 'get'
    }, function (res) {
      $ionicLoading.hide();
      var treasures = res.treasures.map(function (item) {
        return new Treasure(item);
      });
      modal.show('liked', 'templates/modals/treasure-list.html', $scope, {
        treasures: treasures,
        title: '찜한 보물'
      });
    }, function (res) {
      $ionicLoading.hide();
    });
  };

  $scope.startExplore = function () {
    if (!$scope.currentPositionMarker
      || !$scope.currentPositionMarker.getPosition()) {
      message.show('현재 위치를 확인할 수 없습니다.');
      return;
    }
    $scope.exploringTreasure = $scope.selectedTreasure;
    $scope.hideAllMarkers();
    $scope.refreshPath();
  };

  $scope.stopExplore = function () {
    $scope.exploringTreasure = null;
    $scope.showAllMarkers();
    $scope.refreshPath();
    $scope.getTreasures();
  };

  $scope.openExploredTreasuresModal = function () {
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }
    if ($rootScope.user.totalExplored === 0) {
      message.show('아직 찾은 보물이 없습니다.');
      return;
    }
    $ionicLoading.show();
    api.request({
      url: '/treasures/explored',
      method: 'get'
    }, function (res) {
      $ionicLoading.hide();
      var treasures = res.treasures.map(function (item) {
        return new Treasure(item);
      });
      modal.show('explored', 'templates/modals/treasure-list.html', $scope, {
        treasures: treasures,
        title: '찾은 보물'
      });
    }, function (res) {
      $ionicLoading.hide();
    });
  };

  $scope.openSolvedQuizzesModal = function () {
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }
    if ($rootScope.user.totalSolved === 0) {
      message.show('아직 맞춘 퀴즈가 없습니다.');
      return;
    }
    $ionicLoading.show();
    api.request({
      url: '/users/me/quizzes',
      method: 'get'
    }, function (res) {
      $ionicLoading.hide();
      modal.show('quiz', 'templates/modals/quiz.html', $scope, {
        quizzes: res.quizzes
      });
    }, function (res) {
      $ionicLoading.hide();
    });
  };

  $scope.toggleTreasureListExpand = function () {
    $scope.treasureListExpanded = !$scope.treasureListExpanded;
  };


  /// tour
  $scope.currentTour = null;
  $scope.showTourTreasures = false;
  $scope.showTourTreasureList = function () {
    $scope.showTourTreasures = !$scope.showTourTreasures;
  };

  $scope.showTourListModal = function () {
    $scope.hideAllMarkers();
    modal.show('tourList', 'templates/modals/tour-list.html', $scope);
  };

  $scope.startTour = function (tour) {
    $scope.currentTour = tour;
    $ionicSideMenuDelegate.toggleLeft(false);
    $scope.hideAllMarkers();
    initialize();
    api.request({
      url: '/treasures/tours/' + tour.id,
      method: 'get',
      scope: $scope,
      showLoading: true
    }, function (res) {
      $scope.currentTour.treasures = [];
      for (var td of res.treasures) {
        var t = new Treasure(td);
        $scope.currentTour.treasures.push(t);
        t.marker.setMap($scope.map);
      }
      for (var t of $scope.currentTour.treasures) {
        if (!t.explored) {
          $scope.exploringTreasure = t;
          $scope.selectTreasure(t);

          // add marker event listener
          (function (treasure) {
            google.maps.event.addListener(treasure.marker, 'click', function () {
              $scope.selectTreasure(treasure);
              $scope.$digest();
            });
          })(t);
          break;
        }
      }
      if (!$scope.exploringTreasure) {
        message.show('모든 보물을 찾았습니다');
        $scope.endTour();
      }
    }, function () {
      $scope.endTour();
    });

  };

  $scope.endTour = function () {
    if (!$scope.currentTour) return;

    for (var t of $scope.currentTour.treasures) {
      t.marker.setMap(null);
      google.maps.event.clearInstanceListeners(t.marker);
    }
    $scope.currentTour = null;
    $scope.selectTreasure(null);
    $scope.stopExplore();
    $scope.getTreasures();
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


  $scope.$on('login.success', function () {
    $window.location.reload(true);
  });

  $scope.$on('explored', function (e, t) {
    t.explored = true;
    $scope.exploringTreasure = null;
    if ($scope.currentTour) {
      $scope.$root.hideModal('explore');
      $scope.$root.hideModal('treasureDetail');
      for (var t of $scope.currentTour.treasures) {
        if (!t.explored) {
          $scope.exploringTreasure = t;
          $scope.selectTreasure(t);
          break;
        }
      }
      if (!$scope.exploringTreasure) {
        message.show('모든 보물을 찾았습니다');
        $scope.endTour();
      }
    }

  });
  /*
   if (db.initialized && auth.isLogin()) {
   syncData();
   } else {
   $scope.$on('db.initialized', function () {
   if (auth.isLogin()) {
   syncData();
   }
   });
   }
   //*/

  var deregisterHardBack = $ionicPlatform.registerBackButtonAction(function () {
    $ionicPopup.confirm({
      title: "'문화유산 보물찾기'를 종료하시겠습니까?"
    }).then(function (res) {
      if (res) {
        ionic.Platform.exitApp();
      }
    });
  }, 100);
  $scope.$on('$destroy', function () {
    deregisterHardBack();
  });


  $scope.started = false;
  $scope.startApp = function () {
    $scope.getTreasures();
    $scope.started = true;
  };
}]);
