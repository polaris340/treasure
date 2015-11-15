app.controller('TreasureListController', ['$scope', 'modal', function($scope, modal) {

  $scope.hideModal = function() {
    modal.hide('liked');
    modal.hide('explored');
  };
}]);
