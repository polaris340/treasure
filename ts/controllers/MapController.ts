/// <reference path="../models/Treasure.ts" />

app.controller('MapController', ['$scope', '$rootScope', '$ionicHistory', '$state', '$q', '$timeout', '$http', '$ionicLoading', '$ionicSideMenuDelegate', 'modal', 'api', 'distance', 'db', 'storage', 'auth', function ($scope, $rootScope, $ionicHistory, $state, $q, $timeout, $http, $ionicLoading, $ionicSideMenuDelegate, modal, api, distance, db, storage, auth) {
  if (storage.get('firstLaunch') !== false) {
    $rootScope.showGuideModal();
  }

  $scope.MIN_ZOOM_LEVEL_FOR_MARKER = 12;
  $ionicHistory.clearHistory();
  $scope.currentPositionMarker = null;
  $scope.distanceToSelectedTreasure = '';
  $scope.angleToSelectedTreasure = 0;
  $scope.currentZoomLevel = 16;
  $scope.exploringTreasure = null;

  var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 4
  };
  $scope.lineToTarget = new google.maps.Polyline({
    path: [{lat: 36, lng: 127}, {lat: 36, lng: 127}],
    geodesic: true,
    strokeColor: '#D83F2A',
    strokeOpacity: 0,
    icons: [{
      icon: lineSymbol,
      offset: '0',
      repeat: '20px'
    }]
  });


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
    $scope.refreshPath();


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
    var where = `
    where latitude between ? and ?
    and longitude between ? and ?
    `;
    if (db.initialized) {

      db.select(where, [sw.lat(), ne.lat(), sw.lng(), ne.lng()])
        .then(function (res) {


          for (var i = 0; i < res.rows.length; i++) {
            var t:Treasure = new Treasure(res.rows.item(i));
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
        $scope.currentTreasuresIdMap = {};
        for (var treasureData:ITreasureData of res.treasures) {
          var t:Treasure = new Treasure(treasureData);
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

  $scope.selectTreasure = function (treasure) {
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
      $scope.currentPositionMarker.setOptions({icon: $scope.arrowIcon});
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
        for (var t of $scope.searchResults) {
          t.marker.setMap(null);
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

        $scope.searchDefer = null;
        $scope.searchPromise = null;
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
    $ionicLoading.show();
    api.request({
      url: '/treasures/liked',
      method: 'get'
    }, function (res) {
      $ionicLoading.hide();
      var treasures = res.treasures.map(function (item) {
        return new Treasure(item);
      });
      modal.show('liked', '/templates/modals/treasure-list.html', $scope, {
        treasures: treasures,
        title: '찜한 보물'
      });
    }, function (res) {
      $ionicLoading.hide();
    });
  };

  $scope.startExplore = function() {
    $scope.exploringTreasure = $scope.selectedTreasure;
    $scope.refreshPath();
  };

  $scope.openExploredTreasuresModal = function () {
    $ionicLoading.show();
    api.request({
      url: '/treasures/explored',
      method: 'get'
    }, function (res) {
      $ionicLoading.hide();
      var treasures = res.treasures.map(function (item) {
        return new Treasure(item);
      });
      modal.show('explored', '/templates/modals/treasure-list.html', $scope, {
        treasures: treasures,
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
  } else {
    $scope.$on('db.initialized', function () {
      syncData();
    });
  }
}]);
