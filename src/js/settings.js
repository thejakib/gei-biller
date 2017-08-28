const settings = require('electron-settings');

const appSettings = {
    path: 'settings.json',
    defaultSettings: {
        initialized: true,
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
        ],
        defaultPath: ''
    },
    setDefaultIfNotIntialized: () => {
        //        settings.deleteAll();
        let initialized = settings.get('initialized');

        if (!initialized) {
            settings.setAll(appSettings.defaultSettings);
        }
    },
    addClient: (newClient) => {
        let clients = appSettings.getClients(),
            matched = clients.filter(client => client.name === newClient.name);

        if (matched.length === 0) {
            clients.push(newClient);
            console.log("client added", newClient);
        } else {
            let clientIndex = clients.indexOf(matched[0]);
            for (let prop in newClient) {
                clients[clientIndex][prop] = newClient[prop];
            }

            console.log("client modified", clients[clientIndex]);
        }

        appSettings.setClients(clients);
    },
    increaseBillNo: (company) => {
        let companies = appSettings.getCompanies(),
            foundCompany = companies.find(comp => comp.name === company.name);

        if (foundCompany) {
            foundCompany.lastBillNo += 1;
            appSettings.setCompanies(companies);

            console.log("increase bill no", foundCompany);
        }
    },
    getAll: () => {
        return settings.getAll();
    },
    setAll: (setting) => {
        settings.setAll(setting);
        console.log("settings saved", setting);
    },
    init: () => {
        settings.setPath(appSettings.path);
        appSettings.setDefaultIfNotIntialized();

        console.log(settings.getAll());
    }
}
appSettings.init();

const props = ['defaultPath', 'companies', 'clients'];
props.forEach((prop) => {
    let func = prop.charAt(0).toUpperCase() + prop.substr(1);
    let setter = 'set' + func;
    let getter = 'get' + func;
    appSettings[setter] = (val) => {
        settings.set(prop, val);
    }
    appSettings[getter] = () => {
        return settings.get(prop);
    }
})
