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

  function addCommentSuccess (res) {
    $scope.comments.unshift(new Comment(res.comment));
    $scope.commentImageUri = '';

    $scope.newCommentData = {
      body: ""
    };
  }

}]);
