app.service('db', ['$rootScope', '$cordovaSQLite', '$q', function ($rootScope, $cordovaSQLite, $q) {
  var self = this;
  this.initialized = false;
  this.columns = {
    id: {
      type: 'INTEGER',
      primary: true
    },
    name: {
      type: 'TEXT'
    },
    latitude: {
      type: 'REAL'
    },
    longitude: {
      type: 'REAL'
    },
    explored: {
      type: 'INTEGER'
    },
    liked: {
      type: 'INTEGER'
    },
    updated: {
      type: 'TEXT'
    },
    created: {
      type: 'TEXT'
    }
  };

  this.initialize = function () {

    self.db = $cordovaSQLite.openDB({ name: "treasure.db" });

    $cordovaSQLite.execute(self.db, `
    CREATE TABLE IF NOT EXISTS treasure (
    id integer primary key,
    name text,
    latitude real,
    longitude real,
    explored integer,
    liked integer,
    updated text,
    created text
    );`);
    self.initialized = true;
    $rootScope.$broadcast('db.initialized');
  };


  this.insert = function (obj) {
    if (!self.initialized) return;
    var columnNames = [];
    var values = [];
    var params = [];
    for (var c in self.columns) {
      values.push('?');
      columnNames.push(c);
      params.push(obj[c]);
    }
    var query = "INSERT OR REPLACE INTO treasure (" + columnNames.join(',') + ') values (' + values.join(',') + ')';

    return $cordovaSQLite.execute(self.db, query, params);

  };

  this.bulkInsert = function (targets) {
    if (!self.initialized) return;
    var columnNames = [];

    for (var c in self.columns) {
      columnNames.push(c);
    }

    var promises = [];

    while(targets.length > 0) {
      var objs = targets.splice(0, 100);
      var values = [];
      var realValues = [];
      for (var o of objs) {
        var v = [];
        for (var k of columnNames) {
          v.push('?');
          realValues.push(o[k]);
        }
        values.push('(' + v.join(',') + ')');
      }
      var query = "INSERT OR REPLACE INTO treasure (" + columnNames.join(',') + ') VALUES '
        + values.join(',');
      promises.push($cordovaSQLite.execute(self.db, query, realValues));

    }
    return $q.all(promises);
  };

  this.select = function (where, params) {
    if (!self.initialized) return;
    return $cordovaSQLite.execute(self.db, 'select * from treasure ' + where + ' limit 100', params);
  };

  this.deleteAll = function() {
    if (!self.initialized) return;
    return $cordovaSQLite.execute(self.db, 'delete from treasure');
  }
}])
;
