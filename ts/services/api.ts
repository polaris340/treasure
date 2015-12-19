app.service('api', ['$http', '$rootScope', '$state', '$q', 'message', 'storage', 'modal', '$ionicLoading', 'setting', function ($http, $rootScope, $state, $q, message, storage, modal, $ionicLoading, setting) {
  var self = this;
  if (setting.autoLogin) {
    this._authToken = storage.get('authToken', null);
  } else {
    this._authToken = null;
  }
  if (this._authToken) {
    $http.defaults.headers.common.Authorization = 'Bearer ' + this._authToken;
  }


  this.request = function (options, success, error, complete) {
    var targetScope = options.scope || $rootScope;
    var lockUrl = options.lockUrl || options.url;
    options.url = CONSTANTS.API_URL + options.url;

    if (typeof targetScope.lock === 'undefined') {
      targetScope.lock = {};
    }
    if (targetScope.lock[lockUrl]) {
      if (options.force) {
        targetScope.lock[lockUrl].resolve();
      } else {
        throw new Error('url endpoint locked');
      }
    }
    var canceler = $q.defer();
    targetScope.lock[lockUrl] = canceler;

    if (options.showLoading) $ionicLoading.show();
    delete options.scope;
    $http(options)
      .then(function (response) {
        if (options.showLoading) $ionicLoading.hide();
        var res = response.data || {};
        var status = response.status;
        if (typeof success === 'function') {
          success(res, status);
        }

        if (typeof complete === 'function') {
          complete(res, status);
        }
        delete targetScope.lock[lockUrl];

      }, function (response) {
        if (options.showLoading) $ionicLoading.hide();
        var res = response.data || {};
        var status = response.status;
        if (typeof error === 'function') {
          error(res, status);
        }

        if (typeof complete === 'function') {
          complete(res, status);
        }
        delete targetScope.lock[lockUrl];

        self.defaultErrorHandler(res, status);
      });

  };

  this.setAuthToken = function (token) {
    self._authToken = token;
    if (token === null) {
      storage.remove('authToken');
    } else {
      storage.set('authToken', self._authToken);
      $http.defaults.headers.common.Authorization = 'Bearer ' + self._authToken;

    }
  };

  this.defaultErrorHandler = function (res, status) {
    var errorMessage = res.detail || '오류가 발생했습니다 잠시 후에 다시 시도해주세요';
    message.show(errorMessage);
    if (status === 401) {
      message.show('로그인이 필요합니다');
      self.setAuthToken(null);
      $rootScope.showLoginModal();
    }
  };
}]);
