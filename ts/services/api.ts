app.service('api', ['$http', '$rootScope', '$state', '$q', 'ionicToast', 'storage', function ($http, $rootScope, $state, $q, ionicToast, storage) {
  var self = this;
  this._authToken = storage.get('authToken', null);

  this.request = function (options, success, error, complete) {
    var targetScope = options.scope || $rootScope;
    options.url = CONSTANTS.API_URL + options.url;
    var lockUrl = options.lockUrl || options.url;

    if (self._authToken) {
      options.headers = {
        'Authorization': 'Bearer ' + self._authToken
      };
    }

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

    $http(options)
      .success(function (res, status) {
        if (typeof success === 'function') {
          success(res, status);
        }

        if (typeof complete === 'function') {
          complete(res, status);
        }
        delete targetScope.lock[lockUrl];

      }).error(function (res, status) {
        if (typeof error === 'function') {
          error(res, status);
        }

        if (typeof complete === 'function') {
          complete(res, status);
        }
        delete targetScope.lock[lockUrl];

        var errorMessage = res.detail || '오류가 발생했습니다 잠시 후에 다시 시도해주세요';
        ionicToast.show(errorMessage, 'top', false, 1500);
        if (status === 401) {
          $state.go('login');
        }
      });

  };

  this.setAuthToken = function (token) {
    self._authToken = token;
    storage.set('authToken', self._authToken);
  };
}]);
