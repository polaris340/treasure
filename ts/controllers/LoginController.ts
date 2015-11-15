app.controller('LoginController', ['$scope', '$ionicLoading', '$ionicHistory', 'modal', '$state', 'api', 'auth', function ($scope, $ionicLoading, $ionicHistory, modal, $state, api, auth) {
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
        $state.go('map');
      },
      null,
      function (res, status) {
        $ionicLoading.hide();
      });
  };

  $scope.showSignupModal = function() {
    modal.show('signup', 'templates/modals/signup.html', $scope);
  };
}]);
