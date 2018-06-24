angular.module('ezyScannerApp', [])
  .run(function () {
  })
  .controller('ezyScannerCtrl', function ($scope, $http) {

    function imageToDataUri(img, width, height, quality, callback) {
      // create an off-screen canvas
      var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

      // set its dimension to target size
      canvas.width = width;
      canvas.height = height;

      // draw source image into the off-screen canvas:
      var image = new Image();
      image.onload = function() {
        // encode image to data-uri with base64 version of compressed image
        ctx.drawImage(image, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", quality/100));
      };
      image.src = img;
    }

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