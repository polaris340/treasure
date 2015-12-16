app.controller('ExploreModalController', ['$scope', '$rootScope', '$timeout', '$ionicLoading', 'api', 'modal', 'message', 'db', function ($scope, $rootScope, $timeout, $ionicLoading, api, modal, message, db) {
  $scope.treasure = $scope.$parent.treasure;
  $scope.exploreStatus = 'waiting';
  $scope.message = '인증중입니다';
  // 찾기 인증
  $scope.explore = function () {
    var currentPosition = $scope.$parent.$parent.currentPositionMarker.getPosition();
    var targetPosition = new google.maps.LatLng($scope.treasure.latitude, $scope.treasure.longitude);
    if (google.maps.geometry.spherical.computeDistanceBetween(currentPosition, targetPosition) > $scope.EXPLORE_DISTANCE) {
      $scope.message = "'찾기 인증'은 보물에 30m 이내로 접근해야 가능합니다.";
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
      $scope.message = '축하합니다! 보물을 찾았습니다.\n이 보물에 대한 난이도와 별점을 매겨 주세요.\n또한 이 보물을 찾은 소감을 사연댓글과\n인증샷으로 남겨 역사로 기록하세요.';
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
