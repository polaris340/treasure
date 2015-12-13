app.controller('TreasureDetailController', ['$rootScope', '$scope', '$ionicPopup', '$ionicLoading', 'modal', 'api', 'message', 'db', 'auth', function ($rootScope, $scope, $ionicPopup, $ionicLoading, modal, api, message, db, auth) {
  $scope.EXPLORE_DISTANCE = 30;
  $scope.treasure = $scope.$parent.selectedTreasure;


  $scope.likeToggle = function () {
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }
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
      } else {
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
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }
    if (!$scope.treasure.explored) {
      message.show('아직 찾지 못한 보물입니다.');
      return;
    }
    modal.show('comment', 'templates/modals/comment.html', $scope);
  };

  $scope.showExploreModal = function () {
    if (!auth.isLogin()) {
      message.show('로그인이 필요합니다');
      return;
    }

    if (!$scope.$parent.currentPositionMarker
      || !$scope.$parent.currentPositionMarker.getPosition()) {
      message.show('현재 위치를 확인할 수 없습니다.');
      return;
    }

    modal.show('explore', 'templates/modals/explore.html', $scope);
  };

  $scope.showQuizModal = function () {
    if ($scope.treasure.totalQuizzes === 0) {
      message.show('아직 등록된 퀴즈가 없습니다');
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
