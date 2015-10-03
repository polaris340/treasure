var CONSTANTS = {
  API_URL: 'http://54.64.176.231:8080'
};

var app = angular.module('Treasure', ['ionic', 'ionic-toast'])

  .run(function($ionicPlatform, $rootScope, $state, auth) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleLightContent();
      }
    });


    // 로그인 필요한 페이지인 경우 리다이렉트
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (!auth.isLogin() && toState.loginRequired) {
        event.preventDefault();
        $state.go('login');
      }
    });
  })
  .config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $stateProvider

      .state('map', {
        url: '/',
        controller: 'MapController',
        templateUrl: 'templates/treasure-map.html',
        loginRequired: true
      })
    .state('login', {
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'templates/login.html'
      });

    $urlRouterProvider.otherwise('/');

    if (!ionic.Platform.isIOS()) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
  });

