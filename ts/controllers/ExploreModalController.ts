app.controller('ExploreModalController', ['$scope', '$rootScope', '$timeout', '$ionicLoading', 'api', 'modal', 'message', 'db', function ($scope, $rootScope, $timeout, $ionicLoading, api, modal, message, db) {
  $scope.treasure = $scope.$parent.treasure;
  $scope.exploreStatus = 'waiting';
  $scope.message = '인증중입니다';
  // 찾기 인증
  $scope.explore = function () {
    var currentPosition = $scope.$parent.$parent.currentPositionMarker.getPosition();
    var targetPosition = new google.maps.LatLng($scope.treasure.latitude, $scope.treasure.longitude);
    if (google.maps.geometry.spherical.computeDistanceBetween(currentPosition, targetPosition) > $scope.EXPLORE_DISTANCE) {
      $scope.message = `'찾기인증'은 보물에 30m 이내로 접근하거나\n안내판 등에 있는 QR코드를 찍어야 가능합니다.`;
      $scope.exploreStatus = 'fail';
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
      $scope.message = '축하합니다! 보물을 찾았습니다.\n이 보물에 대한 난이도와 별점을 매겨 주세요.\n또한 이 보물을 찾은 소감을 사연댓글과\n인증샷으로 남겨 역사로 기록하세요.';
      $scope.hideModal(3000);
      $scope.$emit('explored', $scope.treasure);
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

  $scope.readBarcode = function () {
    if (window.cordova && window.cordova.plugins.barcodeScanner) {
      window.cordova.plugins.barcodeScanner.scan(function (result) {
        if (!result.cancelled) {
          if (result.format == "QR_CODE") {
            var value = result.text;
            $ionicLoading.show();
            api.request({
              url: '/treasures/' + $scope.treasure.id + '/explored',
              method: 'post',
              scope: $scope,
              data: {
                qr: value
              }
            }, function (response) {
              $ionicLoading.hide();
              console.log(response);
              $scope.exploreStatus = 'success';
              $scope.treasure.explored = true;
              $scope.treasure.setMarkerIcon(true);
              db.insert($scope.treasure);
              $rootScope.user.totalExplored++;
              $scope.message = '축하합니다! 보물을 찾았습니다.\n이 보물에 대한 난이도와 별점을 매겨 주세요.\n또한 이 보물을 찾은 소감을 사연댓글과\n인증샷으로 남겨 역사로 기록하세요.';
              $scope.hideModal(5000);
              $scope.$emit('explored', $scope.treasure);
            }, function () {
              $ionicLoading.hide();
              $scope.exploreStatus = 'fail';
              $scope.message = 'QR코드가 일치하지 않습니다.';
            });
          }
        }
      }, function (error) {
        message.show('인증에 실패했습니다.');
      });
    }
  };

  $scope.explore();
}]);
