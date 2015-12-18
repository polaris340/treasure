app.service('modal', ['$ionicModal', function($ionicModal) {
  var self = this;
  this.modals = {};

  this.show = function(name, url, scope, scopeValues, hardwareBackButtonClose, animation) {
    if (typeof hardwareBackButtonClose === 'undefined') hardwareBackButtonClose = true;
    animation = animation || 'slide-in-up';
    $ionicModal.fromTemplateUrl(url, {
      scope: scope,
      animation: animation,
      hardwareBackButtonClose: hardwareBackButtonClose
    }).then(function (modal) {
      if (scopeValues) {
        for (var key in scopeValues) {
          modal.scope[key] = scopeValues[key];
        }
      }

      self.modals[name] = modal;
      modal.show();
    });
  };

  this.hide = function(name) {
    if (!self.modals[name]) {
      return;
    }

    self.modals[name].hide();
    self.modals[name].remove();
    delete self.modals[name];
  };

  this.hideAll = function() {
    for(var name in self.modals) {
      self.hide(name);
    }
  };
}]);
