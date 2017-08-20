const Mousetrap = require('mousetrap');
//const Excel = require('exceljs');
const XLSX = require('xlsx');

angular.module('geibiller', ['monospaced.elastic'])
    .controller('items-controller', ['$scope', itemsController])
    .controller('app-controller', appController);

function itemsController($scope) {
    var descTextarea = document.querySelector(".content .item:last-child textarea");

    $scope.items = [];
    $scope.qty = 0;
    $scope.rate = 0;

    function addItem() {
        var item = {
            desc: $scope.desc,
            qty: $scope.qty,
            rate: $scope.rate
        };
        console.log("item-added", item);
        $scope.items.push(item);
        $scope.rate = 0;
        $scope.qty = 0;
        $scope.desc = "";
        descTextarea.focus();
        $scope.$digest();
    }
    Mousetrap.bind('ctrl+shift+n', addItem);
}


function appController($scope) {
    var saveFilename = "./output.xlsx";

    $scope.save = function () {
        var templateFilename = "dist/res/bill-template.xlsx";
        var readOptions = {
            raw: true,
            cellStyles: true
        };
        var workbook = XLSX.readFile(templateFilename, readOptions);
        readWorkbook(workbook);
    }

    function readWorkbook(workbook) {
        var firstSheetName = workbook.SheetNames[0],
            worksheet = workbook.Sheets[firstSheetName];
        
        worksheet['C12'] = {
            v: 'Zen Enterprise'
        }
        
        XLSX.writeFile(workbook, saveFilename);
    }
}
