angular.module('geibiller', [])
.controller('items-controller', ['$scope', itemsController]);

function itemsController($scope) {
    $scope.items = [];
    $scope.qty = 0;
    $scope.rate = 0;

    /*var item={
        desc:"Nat. Jute Pouch Bags",
        qty:5000,
        rate:1.25,
    };
      
    var item1={
        desc:"Nat. Jute Sack",
        qty:2000,
        rate:3,
    }
      
    $scope.items.push(item);
    $scope.items.push(item1);*/
}
