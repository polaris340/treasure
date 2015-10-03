app.controller('TreasureDetailController', ['$scope', 'api', function($scope, $api) {
  $scope.treasure = $scope.$parent.selectedTreasure;

  $scope.hideModal = function() {
    $scope.$parent.treasureDetailModal.hide();
    $scope.$parent.treasureDetailModal.remove();
  }
}]);
