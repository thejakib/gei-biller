const Mousetrap = require('mousetrap');
const Excel = require('exceljs');
//const XLSX = require('xlsx');

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
    $scope.save = function () {
        app.startSave();
    }

    var app = {
        filename: {
            template: "dist/res/bill-template.xlsx",
            save: "./output.xlsx",
        },
        workbook: null,

        writeFile: () => {
            app.workbook.xlsx
                .writeFile(app.filename.save)
                .then(() => console.log("file saved", app.filename.save));
        },
        processFile: () => {
            var worksheet = app.workbook.getWorksheet(1);

            var clientNameCell = worksheet.getCell('C13');
            clientNameCell.value = 'Zen Enterprise';
        },
        readFile: () => {
            app.workbook = new Excel.Workbook();
            return app.workbook.xlsx
                .readFile(app.filename.template)
        },
        startSave: () => {
            app.readFile()
                .then(app.processFile)
                .then(app.writeFile);
        }
    }
}
