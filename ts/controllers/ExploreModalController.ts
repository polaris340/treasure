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
    $timeout(function() {
      modal.hide('explore');
    }, delay);
  };

  $scope.explore();
}]);
