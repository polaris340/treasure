var CONSTANTS = {
  API_URL: 'http://54.64.176.231:8080'
};

var app = angular.module('Treasure', ['ionic', 'ionic-toast', 'ngCordova'])

  .run(function ($ionicPlatform, $rootScope, $state, auth, db, modal) {
    $ionicPlatform.ready(function () {
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

      try {
        db.initialize();
      } catch (e) {

      }
    });

    $rootScope.showGuideModal = function() {
      modal.show('guide', 'templates/guide.html');
    };

    $rootScope.showStartPageModal = function() {
      modal.show('startPage', 'templates/modals/start-page.html');
    };
    // $rootScope.showStartPageModal();

    $rootScope.hideModal = function(name) {
      modal.hide(name);
    };
  })
  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $stateProvider
      .state('guide', {
        url: '/guide',
        controller: 'GuideController',
        templateUrl: 'templates/guide.html'
      })
      .state('map', {
        url: '/map',
        controller: 'MapController',
        templateUrl: 'templates/treasure-map.html',
        loginRequired: true
      })
      .state('login', {
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'templates/login.html'
      });

    $urlRouterProvider.otherwise('/map');

    if (!ionic.Platform.isIOS()) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
  });

