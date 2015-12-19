app.controller('TreasureListController', ['$scope', 'modal', 'api', function ($scope, modal, api) {
  //$scope.treasures = [];

  $scope.editMode = false;

  $scope.editModeToggle = function () {
    $scope.editMode = !$scope.editMode;

    if (!$scope.editMode) {
      var liked = [];
      for (var t of $scope.treasures) {
        liked.push(t.id);
      }
      api.request({
        url: '/treasures/liked/swap',
        method: 'post',
        scope: $scope,
        data: {
          liked: liked
        },
        showLoading: true
      });
    }
  };

  $scope.moveItem = function (item, fromIndex, toIndex) {
    $scope.treasures.splice(fromIndex, 1);
    $scope.treasures.splice(toIndex, 0, item);
  };

  $scope.hideModal = function () {
    modal.hide('liked');
    modal.hide('explored');
  };
}]);
