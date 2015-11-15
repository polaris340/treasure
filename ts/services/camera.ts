app.service('camera', ['$q', function ($q) {
  this.getPicture = function (options) {
    var q = $q.defer();
    if (navigator.camera) {
      navigator.camera.getPicture(function (result) {
        // Do any magic you need
        q.resolve(result);
      }, function (err) {
        q.reject(err);
      }, options);
    }

    return q.promise;
  };

}]);
