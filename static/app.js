angular.module('ezyScannerApp', [])
  .run(function () {
  })
  .controller('ezyScannerCtrl', function ($scope, $http) {

    $scope.photos = [];

    

    $scope.getPhoto = function (photoPromise) {
      $scope.loading = true;

      photoPromise.then(function (imgSrc) {
        $scope.photo = {src: imgSrc};
        $http.post("/scan", data={"img_src":imgSrc}).then(function(response) {
          // result
          $scope.car = response.data.car;
          $scope.plate = response.data.plate;

          $scope.loading = false;
        });
      });
    };

  });