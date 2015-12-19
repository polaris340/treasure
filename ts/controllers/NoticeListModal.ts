app.controller('NoticeListController', function($scope, api) {
  $scope.notices = [];

  api.request({
    url: '/notices',
    method: 'get',
    scope: $scope,
    showLoading: true
  }, function(res) {
    $scope.notices = res.notices;
  }, function() {
    $scope.$root.hideModal('noticeList');
  })
});
