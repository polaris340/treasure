/// <reference path="../models/Comment.ts" />

app.controller('CommentController', ['$scope', '$ionicLoading', '$ionicPopup', 'api', 'modal', 'camera', 'message', function ($scope, $ionicLoading, $ionicPopup, api, modal, camera, message) {
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

  $scope.currentTab = 'comment';

  var addCommentSuccess = function(res) {
    $scope.comments.unshift(new Comment(res.comment));
    $scope.commentImageUri = '';

    $scope.newCommentData = {
      body: ""
    };
  };

  $scope.addComment = function () {

    if (!$scope.treasure.explored) {
      message.show('아직 찾지 못한 보물입니다.');
      return;
    }
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
      ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          $scope.imageUploadProgress = progressEvent.loaded / progressEvent.total;
        }
      };
      $ionicLoading.show();
      ft.upload(
        $scope.commentImageUri,
        encodeURI(CONSTANTS.API_URL + '/treasures/' + $scope.treasure.id + '/comments'),
        function(response) {
          addCommentSuccess(JSON.parse(response.response));
          $ionicLoading.hide();
        }, function(error) {
          api.defaultErrorHandler(error.body, error.http_status);
          $ionicLoading.hide();
        }, options);

    } else {
      // 이미지 없이 등록 불가
      message.show('사진을 찍어주세요');
      return;
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

  $scope.showImage = function(imageUrl) {
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
    }, function() {
      $scope.end = true;
    }, function() {
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  };

  $scope.deleteComment = function(comment) {
    var options = {
      method: 'delete',
      url: '/treasures/' + comment.tid + '/comments/' + comment.id,
      scope: $scope
    };

    $ionicLoading.show();
    api.request(options, function(res) {
      $scope.comments.splice($scope.comments.indexOf(comment), 1);
    }, null, function() {
      $ionicLoading.hide();
    });
  };

  $scope.hideModal = function () {
    modal.hide('comment');
  };

  // 사연
  $scope.showSelectTabMenu = false;
  $scope.stories = [];
  $scope.selectTab = function(tab) {
    $scope.currentTab = tab;
    $scope.showSelectTabMenu = false;
  };

  $scope.loadStories = function() {
    api.request({
      url: '/treasures/' + $scope.treasure.id + '/stories',
      method: 'get',
      scope: $scope
    }, function(res) {
      for (var story of res.stories) {
        $scope.stories.push(story);
      }
    });
  };
  $scope.loadStories();

  $scope.showStoryModal = function(story) {
    modal.show('readStory', 'templates/modals/read-story.html', $scope, {
      story: story
    });
  };


  $scope.showWriteStoryModal = function() {
    modal.show('writeStory', 'templates/modals/write-story.html', $scope);
  };

  $scope.deleteStory = function(story) {
    if (confirm('사연을 삭제하시겠습니까?')) {
      $ionicLoading.show();
      api.request({
        url: '/treasures/' + $scope.treasure.id + '/stories/' + story.id,
        method: 'delete',
        scope: $scope
      }, function(res) {
        $ionicLoading.hide();
        $scope.stories.splice($scope.stories.indexOf(story), 1);
        modal.hide('readStory');
      }, function(res) {
        $ionicLoading.hide();
      });
    }
  };

  var deregisterHardBack = $ionicPlatform.registerBackButtonAction(function() {
    if ($scope.fullImageUrl) {
      $scope.fullImageUrl = '';
    } else {
      $scope.hideModal();
    }
  }, 100);
  $scope.$on('$destroy', function() {
    deregisterHardBack();
  });


}]);
