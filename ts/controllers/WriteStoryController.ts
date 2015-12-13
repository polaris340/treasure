app.controller('WriteStoryController', function($scope, $rootScope, api, $ionicLoading, message) {
  $scope.storyParams = {
    title: '',
    body: ''
  };

  $scope.submitStory = function() {
    if (!$scope.storyParams.title) {
      message.show('제목을 입력해주세요');
      return;
    }
    if (!$scope.storyParams.body) {
      message.show('내용을 입력해주세요');
      return;
    }

    api.request({
      url: '/treasures/' + $scope.treasure.id + '/stories',
      method: 'post',
      scope: $scope,
      data: $scope.storyParams
    }, function(res) {
      $ionicLoading.hide();
      message.show('등록되었습니다.');
      $rootScope.hideModal('writeStory');
      $scope.$parent.stories.unshift(res.story);
    }, function(res) {
      $ionicLoading.hide();
    });
  };

});
