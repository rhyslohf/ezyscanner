angular.module('ezyScannerApp', [])
  .run(function () {
  })
  .controller('ezyScannerCtrl', function ($scope, $http) {

    $scope.getPhoto = function (imageFile) {
      $scope.loading = true;

      var formData = new FormData();
      formData.append('file', imageFile);
      $http({
        "url": "/scan",
        "method": "POST",
        "data": formData,
        "headers": {
          'Content-Type' : undefined // important
        }
      }).then(function(response) {
        // result
        // $scope.car = response.data.car;
        $scope.plate = response.data;

        $scope.loading = false;
      }, function(response) {
        $scope.error = response.status + ': ' + response.data;
      });
    };

  });