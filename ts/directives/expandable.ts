class ExpandableDirective implements ng.IDirective {
  public restrict:string = 'C';

  public scope = {
    onExpandStart: '&',
    onCollapseStart: '&',
    onExpandEnd: '&',
    onCollapseEnd: '&'
  };

  constructor(private $timeout:ng.ITimeoutService,
              private $ionicScrollDelegate:ionic.scroll.IonicScrollDelegate) {

  }

  public link:ng.IDirectiveLinkFn = ($scope:ng.IScope,
                                     $element:ng.IAugmentedJQuery,
                                     $attrs:ng.IAttributes) => {
    var animationDuration = 300;
    if (typeof $attrs['duration'] !== 'undefined') {
      animationDuration = parseInt($attrs['duration']);
    }

    var self = this;

    var expandableHandle = $element[0].getElementsByClassName('expandable-handle');
    if (expandableHandle.length === 0) {
      throw new Error('.expandable has no .expandable-handle');
    }
    var expandableTargets = $element[0].getElementsByClassName('expandable-target');
    if (expandableTargets.length !== 1) {
      throw new Error('.expandable can have only one .expandable-target');
    }
    var expandableTarget = expandableTargets[0];

    $scope.$$postDigest(function () {
      // 정확한 계산 위해서 digest 후에 실행
      // $timeout으로 하면 처음에 깜빡거려서 $$postDigest 사용
      // http://blogs.microsoft.co.il/choroshin/2014/04/08/angularjs-postdigest-vs-timeout-when-dom-update-is-needed/

      var targetHeight = expandableTarget.getBoundingClientRect().height;
      if (!$element.hasClass('expanded')) {
        expandableTarget.style.height = '0';
      } else {
        expandableTarget.style.height = targetHeight + 'px';
      }
      expandableTarget.style.transitionDuration = (animationDuration / 1000) + 's';

      var calculateHeight = function () {
        if ($element.hasClass('expanded')) {
          var transition = window.getComputedStyle(expandableTarget).transition;
          expandableTarget.style.transition = 'initial';
          expandableTarget.style.height = 'auto';
          self.$timeout(function () {
            targetHeight = expandableTarget.getBoundingClientRect().height;
            expandableTarget.style.height = targetHeight + 'px';
            expandableTarget.style.transition = transition;
            self.$ionicScrollDelegate.resize();
          }, 100, false); // 0으로 하면 사파리에서 작동 안해서 100으로 바꿈
        }
      };

      var expand = function () {
        if ($element.hasClass('expanded')) {
          return;
        }
        expandableTarget.style.height = targetHeight + 'px';
        $scope.onExpandStart();
        $element.addClass('expanded');

        self.$timeout(function () {
          // 애니메이션 끝나기 전에 다시 누를 수 있으니 체크
          if ($element.hasClass('expanded')) {
            $scope.onExpandEnd();
          } else {
            $scope.onCollapseEnd();
          }
          self.$ionicScrollDelegate.resize();
        }, animationDuration);
      };

      var collapse = function () {
        if (!$element.hasClass('expanded')) {
          return;
        }
        expandableTarget.style.height = '0';
        $scope.onCollapseStart();

        $element.removeClass('expanded');

        self.$timeout(function () {
          // 애니메이션 끝나기 전에 다시 누를 수 있으니 체크
          if ($element.hasClass('expanded')) {
            $scope.onExpandEnd();
          } else {
            $scope.onCollapseEnd();
          }
          self.$ionicScrollDelegate.resize();
        }, animationDuration);
      };

      angular.element(expandableHandle).on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($element.hasClass('expanded')) {
          collapse();
        } else {
          expand();
        }
      });

      $scope.$on('expandable.update', calculateHeight);

      $scope.$on('expandable.expand', expand);

      $scope.$on('expandable.collapse', collapse);
    });
  }
}
app.directive('expandable', ['$timeout', '$ionicScrollDelegate',
  ($timeout, $ionicScrollDelegate) => new ExpandableDirective($timeout, $ionicScrollDelegate)]);
