app.controller('TourListController', function($scope, api) {
  $scope.tours = [];
  api.request({
    url: '/treasures/tours',
    method: 'get',
    scope: $scope,
    showLoading: true
  }, function(res) {
    $scope.tours = res.tours;
  }, function() {
    $scope.$root.hideModal('tourList');
  });
});
