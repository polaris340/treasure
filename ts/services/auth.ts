app.service('auth', ['$rootScope', 'api', 'storage', function($rootScope, api, storage) {
  $rootScope.user = storage.get('user', null);

  this.setUser = function (user) {
    $rootScope.user = user;
    storage.set('user', user);
  };

  this.isLogin = function() {
    return !!api._authToken;
  };



}]);
