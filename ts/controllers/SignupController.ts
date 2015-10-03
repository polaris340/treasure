app.controller('SignupController', ['$scope', '$ionicLoading', 'message', 'auth', 'api', function($scope, $ionicLoading, message, auth, api) {
  $scope.signupParams = {
    username: "",
    password: "",
    passwordConfirm: ""
  };

  $scope.signup = function() {
    if ($scope.signupParams.username.length === 0) {
      message.show('아이디를 입력해주세요');
      return;
    }
    if ($scope.signupParams.password.length < 6) {
      message.show('비밀번호는 6자 이상으로 입력해주세요');
      return;
    }

    if ($scope.signupParams.password != $scope.signupParams.passwordConfirm) {
      message.show('비밀번호가 일치하지 않습니다');
      return;
    }

    $ionicLoading.show();
    api.request({
      url: '/sign-up',
      method: 'post',
      data: $scope.signupParams
    }, function(res, status) {
      message.show('가입되었습니다.');
      $scope.hideSignupModal();
    }, null, function(res, status) {
      $ionicLoading.hide();
    });
  };

  $scope.hideSignupModal = function() {
    $scope.$parent.signupModal.hide();
    $scope.$parent.signupModal.remove();
  }
}]);
