app.controller('SettingController', function($scope, setting, message) {
  $scope.setting = setting;

  $scope.save = function() {
    message.show('저장되었습니다');
  };
});
