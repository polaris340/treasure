app.service('storage', [function() {
  this.get = function(key, defaultValue) {
    var data = window.localStorage.getItem(key);
    if (!data) {
      data = defaultValue;
    } else {
      data = JSON.parse(data);
    }

    return data;
  };

  this.set = function(key, value) {
    var data = JSON.stringify(value);
    window.localStorage.setItem(key, data);
  };

  this.remove = function(key) {
    var data = this.get(key);
    window.localStorage.removeItem(key);
    return data;
  };
}]);
