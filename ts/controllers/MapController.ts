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
    } else {
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
      for (var treasureData:ITreasureData of res.treasures) {
        var t:Treasure = new Treasure(treasureData, $scope.map);
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
      $scope.selectedTreasure.marker.setIcon(
        $scope.selectedTreasure.explored ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      );
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
      var options = {frequency: 1000};  // Update every 1 seconds
      var watchID = navigator.compass.watchHeading(function (heading) {
        console.log(heading.magneticHeading);
      }, function () {
        console.log('error');
      }, options);
    }
  }, false);


  $scope.showTreasureDetailModal = function() {
    if ($scope.selectedTreasure === null) {
      return;
    }

    $ionicModal.fromTemplateUrl('templates/modals/treasure-detail.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.treasureDetailModal = modal;
      modal.show();
    });

  };
}]);
