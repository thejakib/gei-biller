const fs = require('fs');
const path = require('path');
const {
    dialog,
    shell,
    BrowserWindow
} = require('electron').remote;
const Mousetrap = require('mousetrap');
const Excel = require('exceljs');

//const XLSX = require('xlsx');

angular.module('geibiller', ['monospaced.elastic'])
    .controller('app-controller', appController)
    .controller('items-controller', itemsController);


function appController($scope) {
    // scope functions
    $scope.init = () => {
        $scope.companies = appSettings.getCompanies();
        $scope.selectedCompany = $scope.companies[0];
        $scope.clients = appSettings.getClients();
        $scope.selectedClient = {
            readableName: '',
            name: '',
            address: '',
            gst: ''
        };

        $scope.invoiceDate = new Date();
        $scope.challanNo = "";
        $scope.challanDate = "";
        $scope.orderNo = "";
        $scope.orderDate = "";

        $scope.items = [];

        $scope.$applyAsync();
    }
    $scope.getInvoiceNo = () => {
        let date = $scope.invoiceDate,
            company = $scope.selectedCompany,
            year = date.getFullYear() % 100,
            invoiceNo = "L/";

        invoiceNo += company.lastBillNo + "/";
        invoiceNo += year + "-" + (year + 1);
        return invoiceNo;
    }
    $scope.format = (num) => num.toFixed(2);
    $scope.save = function () {
        app.save();
    }
    $scope.openSettings = () => {
        let settingsWindow = new BrowserWindow({
            width: 400,
            height: 500
        });

        // and load the index.html of the app.
        settingsWindow.loadURL(`file://${__dirname}/settings.html`);

        // Emitted when the window is closed.
        settingsWindow.on('closed', () => {
            app.init();
        });
    }
    $scope.onClientSelect = () => {
        $scope.selectedClient = $scope.clients[$scope.selectedClientIndex];
    }

    const app = {
        filename: {
            template: path.join(__dirname, "../res/bill-template.xlsx")
        },
        workbook: null,
        postWriteFile: (filepath) => {
            shell.openItem(filepath);

            appSettings.addClient({
                name: $scope.selectedClient.name.trim(),
                address: $scope.selectedClient.address.trim(),
                gst: $scope.selectedClient.gst.trim()
            });
            appSettings.increaseBillNo($scope.selectedCompany);

            app.init();
        },
        getSavePathFromUser: () => {
            return new Promise((resolve, reject) => {
                let paths = dialog.showOpenDialog({
                    defaultPath: appSettings.getDefaultPath(),
                    title: 'Bill Save Folder',
                    properties: ['openDirectory']
                });
                if (paths) {
                    let savepath = paths[0];
                    appSettings.setDefaultPath(savepath);

                    resolve(savepath);
                }
            });
        },
        prepareSavePath: (savePath) => {
            return new Promise((resolve, reject) => {
                let date = $scope.invoiceDate,
                    isoDate = date.toISOString(),
                    saveFilepath = path.join(savePath, app.getSaveFilepath(isoDate, date)),
                    saveFileName = app.getSaveFilename(isoDate);

                utils.mkdirParent(saveFilepath, () => {
                    resolve(path.join(saveFilepath, saveFileName));
                });
            });
        },
        getSaveFilepath: (isoDate, date) => {
            let folder = isoDate.substr(0, 4), //company.split(/[ ,]+/)[0],
                monthName = date.toLocaleDateString('en-IN', {
                    month: 'long'
                }),
                subfolder = isoDate.substr(5, 2) + "-" + monthName;


            return path.join(folder, subfolder);
        },
        getSaveFilename: (isoDate) => {
            let invoiceNo = $scope.getInvoiceNo(),
                filename = $scope.selectedCompany.name.split(/[ ,]+/)[0];
            filename += "-" + isoDate.substr(0, 10);
            filename += "-" + invoiceNo.replace(/\//g, "-");
            filename += ".xlsx";

            return filename;
        },
        writeFile: () => {
            app.getSavePathFromUser()
                .then(app.prepareSavePath)
                .then((filepath) => {
                    app.workbook.xlsx
                        .writeFile(filepath)
                        .then(() => app.postWriteFile(filepath));
                });
        },
        removeOthersSheets: () => {
            app.workbook.eachSheet(function (worksheet, sheetId) {
                if (worksheet.name !== $scope.selectedCompany.name) {
                    app.workbook.removeWorksheet(sheetId);
                }
            });
        },
        processFile: () => {
            app.removeOthersSheets();
            var worksheet = app.workbook.getWorksheet($scope.selectedCompany.name);


            worksheet.getCell('C12').value = $scope.selectedClient.name;
            worksheet.getCell('C13').value = $scope.selectedClient.address;

            worksheet.getCell('H11').value = $scope.getInvoiceNo();
            worksheet.getCell('J11').value = utils.formatDate($scope.invoiceDate);
            worksheet.getCell('H12').value = $scope.challanNo;
            worksheet.getCell('J12').value = $scope.challanDate;
            worksheet.getCell('H13').value = $scope.orderNo;
            worksheet.getCell('J13').value = $scope.orderDate;
            worksheet.getCell('H14').value = $scope.selectedClient.gst;

            let rowNo = 21;
            $scope.items.forEach((item, index) => {
                if (rowNo >= 41) {
                    return;
                }

                let serialNoCol = 'B',
                    descCol = 'R',
                    qtyCol = 'H',
                    rateCol = 'I';

                worksheet.getCell(serialNoCol + rowNo).value = index + 1;
                worksheet.getCell(descCol + rowNo).value = item.desc;
                worksheet.getCell(qtyCol + rowNo).value = item.qty;
                worksheet.getCell(rateCol + rowNo).value = item.rate;

                worksheet.getCell('S' + rowNo).value = worksheet.getCell('S' + rowNo).value;
                rowNo += 2;
            });

            let grandTotal = $scope.getGrandTotal(),
                grandTotalInWords = utils.spellNumber(grandTotal).toUpperCase();
            worksheet.getCell('C48').value = grandTotalInWords;

            console.log(grandTotalInWords);
        },
        readFile: () => {
            app.workbook = new Excel.Workbook();
            return app.workbook.xlsx
                .readFile(app.filename.template)
        },
        areInputsValid: () => {
            console.log("checking inputs", $scope);
            if (!$scope.selectedClient.name) {
                alert("No Client");
                return false;
            }

            // no date selecte
            if (!$scope.invoiceDate) {
                alert("Select Invoice Date");
                return false;
            }

            // no items exist
            if (!$scope.items || !$scope.items.length) {
                alert("No Item");
                return false;
            }

            return true;
        },
        save: () => {
            if (app.areInputsValid()) {
                app.readFile()
                    .then(app.processFile)
                    .then(app.writeFile);
            }
        },
        initShortcut: () => {
            let inputs = document.querySelectorAll('input, textarea');
            inputs.forEach((input) => input.classList.add('mousetrap'));

            Mousetrap.bind('ctrl+s', app.save);
            Mousetrap.bind('ctrl+n', $scope.init);
        },
        init: () => {
            $scope.init();
            app.initShortcut();
        }
    }
    app.init();
}

function itemsController($scope) {
    $scope.qty = 0;
    $scope.rate = 0;

    $scope.getTotal = () => {
        return $scope.items.reduce((val, curr) => {
            return val + (curr.qty * curr.rate);
        }, 0);
    }
    $scope.getCGST = () => {
        return $scope.selectedCompany.cgst / 100 * $scope.getTotal();
    }
    $scope.getSGST = () => {
        return $scope.selectedCompany.sgst / 100 * $scope.getTotal();
    }
    $scope.getTotalAfterTax = () => {
        return $scope.getTotal() + $scope.getCGST() + $scope.getSGST();
    }
    $scope.getReduce = () => {
        let totalAfterTax = $scope.getTotalAfterTax();
        let decimal = totalAfterTax - parseInt(totalAfterTax);
        decimal = decimal >= 0.50 ? 1 - decimal : -decimal;
        return decimal;
    }
    $scope.$parent.getGrandTotal = () => {
        return $scope.getTotalAfterTax() + $scope.getReduce();
    }

    $scope.addItem = () => {
        let item = {
            desc: $scope.desc,
            qty: $scope.qty,
            rate: $scope.rate
        };
        console.log("item-added", item);
        $scope.items.push(item);
        $scope.rate = 0;
        $scope.qty = 0;
        $scope.desc = "";
        $scope.$digest();

        let descTextarea = document.querySelector(".content .item:last-child textarea");
        descTextarea.focus();
    }
    $scope.inWords = () => {
        return utils.spellNumber($scope.$parent.getGrandTotal())
            .toUpperCase();
    }

    Mousetrap.bind('ctrl+shift+a', $scope.addItem);
}

const utils = {
    tens: ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
    ones: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
                     "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
    spellTens: (num) => {
        let oneDigit = parseInt(num % 10),
            tenDigit = parseInt(num / 10);

        let word = "";

        if (tenDigit === 1) {
            word = utils.ones[num];
        } else {
            if (tenDigit) {
                word += utils.tens[tenDigit] + " ";
            }
            if (oneDigit) {
                word += utils.ones[oneDigit];
            }
        }

        return word.trim();
    },
    spellNumber: (n) => {
        let num = parseInt(n);
        let order = ["crore", "lakh", "thousand", "hundred and", ""];
        let values = {};

        values[""] = parseInt(num % 100);
        num = parseInt(num / 100);

        values["hundred and"] = parseInt(num % 10);
        num = parseInt(num / 10);

        values["thousand"] = parseInt(num % 100);
        num = parseInt(num / 100);

        values["lakh"] = parseInt(num % 100);
        num = parseInt(num / 100);

        values["crore"] = parseInt(num % 100);

        let word = "";
        order.forEach((ordinal) => {
            if (values[ordinal]) {
                word += utils.spellTens(values[ordinal]) + " " + ordinal + " ";
            }
        });

        if (word.endsWith("hundred and ")) {
            word = word.slice(0, word.lastIndexOf("and"));
        }

        return "rupees " + word.trim() + " only";
    },
    formatDate: (date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('/');
    },
    mkdirParent: (dirPath, callback) => {
        fs.mkdir(dirPath, function (err) {
            if (err && err.errno === -4058) {
                utils.mkdirParent(path.dirname(dirPath), () => {
                    utils.mkdirParent(dirPath, callback);
                });
            } else {
                console.log("created path...", dirPath);
                callback && callback(err);
            }
        });
    }
}
