app.service('setting', function(storage) {
  this.autoLogin = storage.get('settings/autoLogin', true);
  this.push = storage.get('settings/push', true);
  this.fontSize = storage.get('settings/fontSize', '3');


  this.setAutoLogin = function(value) {
    this.autoLogin = value;
    storage.set('settings/autoLogin', value);
  };

  this.setPush = function(value) {
    this.push = value;
    storage.set('settings/push', value);
  };

  this.setFontSize = function(value) {
    this.fontSize = value;
    storage.set('settings/fontSize', value);
  };

  this.save = function() {
    storage.set('settings/autoLogin', this.autoLogin);
    storage.set('settings/push', this.push);
    storage.set('settings/fontSize', this.fontSize);
  };
});
