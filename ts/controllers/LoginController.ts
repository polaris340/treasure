app.controller('LoginController', ['$scope', '$rootScope', '$ionicLoading', '$ionicHistory', 'modal', '$state', 'api', 'auth', function ($scope, $rootScope, $ionicLoading, $ionicHistory, modal, $state, api, auth) {
  $ionicHistory.clearHistory();

  $scope.loginParams = {
    username: "",
    password: ""
  };

  $scope.login = function () {
    var options = {
      url: '/sign-in',
      method: 'post',
      data: $scope.loginParams
    };
    $ionicLoading.show();
    api.request(options, function (res, status) {
        api.setAuthToken(res.token);
        $scope.hideLoginModal();
        $rootScope.$broadcast('login.success');
      },
      null,
      function (res, status) {
        $ionicLoading.hide();
      });
  };

  $scope.hideLoginModal = function () {
    modal.hide('login');
  };

  $scope.showSignupModal = function () {
    modal.show('signup', 'templates/modals/signup.html', $scope);
  };
}]);
