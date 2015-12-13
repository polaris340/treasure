app.service('distance', [function () {
  this.toDisplayDistance = function (meters) {

    var d = "";
    if (meters > 1000) {
      d += Math.round(meters / 1000) + "km";
    } else {
      d += Math.round(meters % 1000) + "m";
    }

    return d;
  }
}]);
