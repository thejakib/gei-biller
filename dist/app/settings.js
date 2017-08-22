const settings = require('electron-settings');

const appSettings = {
    defaultSettings: {
        initialized: true,
        selectedCompanyIndex: 0,
        companies: [
            {
                name: "Zen Enterprise",
                gst: "19AHBPB6782G1ZB",
                lastBillNo: 1,
                cgst: 2.5,
                sgst: 2.5,
                igst: 0                
            },
            {
                name: "Euro Enterprise",
                gst: "19AJIPS7696F2ZC",
                lastBillNo: 1,
                cgst: 2.5,
                sgst: 2.5,
                igst: 0
            },
            {
                name: "Global Exporters & Importers",
                gst: "19AJIPS7696F1ZD",
                lastBillNo: 1,
                cgst: 2.5,
                sgst: 2.5,
                igst: 0
            }
        ],
        clients: [
            {
                name:"Eco Jute (P) Limited",
                address: "6 Little Russel Street,\nKankaria Estate, 6th Floor, Kol - 71",
                gst: 'abc'
            }
        ]
    },
    setDefaultIfNotIntialized: () => {
        settings.deleteAll();
        let initialized = settings.get('initialized');

        if (!initialized) {
            settings.setAll(appSettings.defaultSettings);
        }
    },
    get: (setting) => {
        return settings.get(setting);
    },
    init: () => {
        appSettings.setDefaultIfNotIntialized();
        console.log(settings.getAll());
    }
}
appSettings.init();
