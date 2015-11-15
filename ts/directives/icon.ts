var iconTemplate = `
<span class="icon-directive"
style="margin: {{padding}}px; width: {{width}}px; height: {{height}}px; background-image: url('{{src}}'); vertical-align: middle;"
></span>
`;

app.directive('icon', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: { // 빈 스코프라도 지정해줘야 자체 스코프가 생기는듯

    },
    template: iconTemplate,
    controller: function($scope, $element, $attrs) {
      $scope.padding = parseInt($attrs.padding || 0);
      $scope.width = parseInt($attrs.width || 0);
      $scope.height = parseInt($attrs.height || 0);
      $scope.width = $scope.width || $scope.height;
      $scope.height = $scope.height || $scope.width;
      $scope.src = $attrs.src;

      if ($scope.padding) {
        $scope.width -= $scope.padding * 2;
        $scope.height -= $scope.padding * 2;
      }

    }
  };
});
