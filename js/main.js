(function(){

   var App = angular.module('appDota2', []);


   /**
    * Routes
    */
   App.config(['$routeProvider',
      function($routeProvider) {
         $routeProvider
            .when('/heroes/:heroGroup', {
               templateUrl: 'views/heroes.html',
               controller: 'HeroesController'
            })
            .when('/hero/:heroName', {
               templateUrl: 'views/hero.html',
               controller: 'HeroController'
            })
            .otherwise({redirectTo: '/heroes/0'});
      }
   ]);


   /**
    * HerosBuilder
    */

   App.factory('HeroesBuilder', function($http) {

      var count = 0, info, heroes, abilities, cbs = [], result, bySkillResult, myState = false;

      function counting() {
         if(++count === 3) {
            var res = build();
            cbs.forEach(function(cb){ cb(res); });
            myState = true;
         }
      }

      function build() {
         var heroNames = Object.keys(info),
             len = heroNames.length,
             heroAbilities = Object.keys(abilities),
             res = {};

         while(len--) {
            var hero = heroNames[len],
                heroAbiName = (hero === 'sand_king') ? 'sandking' : hero;

            res[hero] = info[hero];
            res[hero]['abilities'] = {};

            for(var l=heroAbilities.length-1; l--; l>=0) {
               if(heroAbilities[l].indexOf(heroAbiName) === 0)
                  res[hero]['abilities'][heroAbilities[l]] = abilities[heroAbilities[l]];
            }

            for(var key in heroes[hero]) {
               res[hero][key] = heroes[hero][key];
            }
         }

         return (result = res);
      }

      function bySkill () {
         if(bySkillResult) return bySkillResult;

         var res = [{},{},{}];

         for(var name in result) {
            switch(result[name]['pa']) {
               case 'str' : res[0][name] = result[name]; break;
               case 'agi' : res[1][name] = result[name]; break;
               case 'int' : res[2][name] = result[name]; break;
            }
         }

         return (bySkillResult = res);
      }

      window.callbackInfo = function (res) {
         info = res;
         counting();
      };

      window.callbackHeroes = function (res) {
         heroes = res.herodata;
         counting();
      };

      window.callbackAbilities = function (res) {
         abilities = res.abilitydata;
         counting();
      };

      return {
         load : function() {
            $http.jsonp('http://www.dota2.com/jsfeed/heropickerdata?l=en&callback=callbackInfo');
            $http.jsonp('http://www.dota2.com/jsfeed/heropediadata?l=en&feeds=herodata&callback=callbackHeroes');
            $http.jsonp('http://www.dota2.com/jsfeed/abilitydata?l=en&callback=callbackAbilities');
         },
         info : function(data) {
            info = data;
            counting();
         },

         onReady : function(cb) {
            cbs.push(cb);
         },

         getBySkill : function() {
            return bySkill();
         },

         getAll : function() {
            return result;
         },

         state : function () {
            return myState;
         }
      }
   });


   /**
    * HeroesController
    */
   App.controller('HeroesController',
      ['$scope', '$http', 'HeroesBuilder', '$routeParams', function($scope, $http, HeroesBuilder, $routeParams) {

         $scope.heroesGroup = {};
         $scope.group = $routeParams.heroGroup;

         if( ! HeroesBuilder.state()) {
            HeroesBuilder.load();
            HeroesBuilder.onReady(function() {
               $scope.heroesGroup = HeroesBuilder.getBySkill();
            });
         }
         else {
            $scope.heroesGroup = HeroesBuilder.getBySkill();
         }

         $scope.setGroup = function(group) {
            window.location = '#/heroes/' + group;
         };

         $scope.openHero = function (hero) {
            window.location = '#/hero/' + hero;
         };

      }]
   );

   /**
    * HeroController
    */
   App.controller('HeroController',
      ['$scope', '$routeParams', 'HeroesBuilder', function($scope, $routeParams, HeroesBuilder) {
         var heroes;

         if( ! HeroesBuilder.state()) {
            HeroesBuilder.load();
            HeroesBuilder.onReady(function() {
               heroes = HeroesBuilder.getAll();
               $scope.hero = heroes[$routeParams.heroName];
               console.log($scope.hero)
            });
         }
         else {
            heroes = HeroesBuilder.getAll();
            $scope.hero = heroes[$routeParams.heroName];
         }

         $scope.heroName = $routeParams.heroName;
         $scope.tab = 'info';
         $scope.back = history.back.bind(history);
      }]
   );


}());