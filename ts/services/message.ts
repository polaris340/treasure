app.service('message', ['ionicToast', function(ionicToast) {
  this.show = function(message, duration) {
    duration = duration || 1500;
    ionicToast.show(message, 'top', false, duration);
  }
}]);
