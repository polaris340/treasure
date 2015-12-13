app.controller('QuizController', ['$scope', '$rootScope', '$ionicSlideBoxDelegate', '$ionicLoading', 'api', 'modal', 'message',
  function ($scope, $rootScope, $ionicSlideBoxDelegate, $ionicLoading, api, modal, message) {
    $scope.treasure = $scope.$parent.treasure;
    $scope.quizzes = [];
    $scope.currentPageIndex = 0;


    $scope.hideModal = function () {
      modal.hide('quiz');
    };

    if ($scope.quizzes.length === 0 && $scope.treasure) {
      api.request({
        url: '/treasures/' + $scope.treasure.id + '/quizzes',
        method: 'get',
        scope: $scope
      }, function (response) {
        $scope.quizzes = response.quizzes;
        $ionicSlideBoxDelegate.update();
      });
    }

    $scope.checkAnswer = function (quiz) {
      $ionicLoading.show();
      api.request({
        url: '/treasures/' + quiz.tid + '/quizzes/' + quiz.id,
        method: 'post',
        data: {
          answer: quiz.userAnswer
        },
        scope: $scope
      }, function (response) {
        $ionicLoading.hide();
        var msg = '틀렸습니다';
        if (response.ok) {
          quiz.soved = true;
          msg = '맞았습니다';
          $rootScope.user.currentPoinsts = response.currentPoints;
        }
        message.show(msg);
      }, function () {
        $ionicLoading.hide();
      });
    };
  }]);
