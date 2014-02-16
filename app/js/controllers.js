'use strict';

/* Controllers */

angular.module('untild.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData', function($scope, syncData) {
      syncData('syncedValue').$bind($scope, 'syncedValue');
   }])

  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {     
      $scope.gameMessage = "";
      $scope.$on("flipGameCompletedEvent", function() {
        $scope.flipGameMessage = "Game over!";
      });


      $scope.flipGameRoomName = "";
      $scope.changeRoom = function() {
         if($scope.flipGameRoomName) {
            $scope.flipGameRoom = syncData('gameRooms/' + $scope.flipGameRoomName);

            $scope.flipGameRoom.$on("loaded", function() {
               console.log("Using game room: " + $scope.flipGameRoom.initialized);
               launchFlipGame(3,3);               
            });
         }
      };

      function launchFlipGame(width, height) {
         if(!$scope.flipGameRoom.initialized) {               
            initFlipGame(3, 3);
         }
         $scope.flipGameRoom.$child("lines").$bind($scope, "flipGameRoom.lines");        
         // constrain number of fetched messages to 20         
         $scope.messages = syncData('gameRooms/' + $scope.flipGameRoomName + "/messages", 20);         
      }

      function initFlipGame(width, height) {
         $scope.flipGameRoom.$remove();
         $scope.flipGameRoom.$set({ initialized: true, width: width, height: height});
         var lines = $scope.flipGameRoom.$child("lines");
         for(var i = 0; i < height; i++) {
            var newline = lines.$child("line" + i + "/tiles");
            for(var j = 0; j < width; j++) {
               newline.$child("tile" + j).$set({flipped: false, id: "tile"+i+"_"+j});
            }
         }
      }

      $scope.resetFlipGame = function() {
         $scope.flipGameRoom.initialized = false;

         initFlipGame(3,3);
      }


      $scope.openTile = function(tile) {
         console.log("Opening tile." + tile.id);
         if(tile.flipped == true) {
            console.log("Already opened.");
            return;
         }
         tile.flipped = true;

         var element = document.getElementById(tile.id);
         element.classList.add("myFlip");


         var isLastFlipped = $(".flipped").length + 1 == $(".flipcard").length;
         if(isLastFlipped) {
            $scope.$emit("flipGameCompletedEvent");
         }

      };


      $scope.newMessage = null;
      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };


   }])

   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);