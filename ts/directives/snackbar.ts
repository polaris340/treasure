var snackbarTemplate = `
  <div class="snackbar">
    <p>{{ message }}</p>
  </div>
`;


app.directive('snackbar', function() {
  return {
    restrict: 'E',
    scope: {
      message: '=',
      buttonText: '=',
      action: '&'
    },
    template: snackbarTemplate
  };
});
