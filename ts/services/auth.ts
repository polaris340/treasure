app.service('auth', ['$rootScope', '$state', '$ionicPopup', 'api', 'storage', 'db', 'modal', 'setting', function ($rootScope, $state, $ionicPopup, api, storage, db, modal, setting) {
  var self = this;
  if (setting.autoLogin) {
    $rootScope.user = storage.get('user', null);
  } else {
    $rootScope.user = null;
  }

  this.setUser = function (user) {
    $rootScope.user = user;
    setting.autoLogin = true;
    setting.save();
    storage.set('user', user);
  };

  this.isLogin = function () {
    return !!api._authToken;
  };

  this.requestUserData = function () {
    if (!this.isLogin()) {
      return;
    }
    var self = this;

    api.request({
      url: '/users/me',
      method: 'get'
    }, function (res) {
      self.setUser(res.user);
      api.setAuthToken(res.token);
    });
  };

  this.logout = function () {
    if (!self.isLogin()) return;
    var confirmPopup = $ionicPopup.confirm({
      title: '로그아웃',
      template: '로그아웃 하시겠습니까?',
      okText: '로그아웃',
      cancelText: '취소'
    });
    confirmPopup.then(function (res) {
      if (res) {
        self.setUser(null);
        api.setAuthToken(null);
        db.deleteAll();
      }
    });
  };

  $rootScope.logout = this.logout;

  $rootScope.showLoginModal = function() {
    modal.show('login', 'templates/login.html', $rootScope);
  }
}]);
