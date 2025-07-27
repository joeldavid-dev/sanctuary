// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');
const { app } = require("electron");

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Configuraciones por defecto
const defaultSettingsPath = path.join(__dirname, '..', 'config', 'defaultSettings.json');
const defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));

// Variables
let settingsPath = null;
// Determinar la ruta del archivo de configuración
if (globalConfig.debug) {
    settingsPath = path.join(__dirname, globalConfig.settingsPath);
} else {
    settingsPath = path.join(app.getPath('userData'), globalConfig.settingsPath);
}

printDebug("Ruta del archivo de configuracion: " + settingsPath);

// Guardar datos en un archivo JSON
function saveSetting(data) {
    printDebug("configuracion guardada:", data);
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

// Leer datos de un archivo JSON
function readSettings() {
    if (!fs.existsSync(settingsPath)) {
        printDebug("No se encontro el archivo de configuracion. Se usan configuraciones por defecto.");
        saveSetting(defaultSettings);
        return defaultSettings;
    }
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    printDebug("Configuraciones obtenidas:", settings);
    return settings;
}

function printDebug(info, obj = null) {
    if (globalConfig.debug) {
        console.log(`(saveSettings) >> ${info}`);
        if (obj) console.log(obj);
    }
}

module.exports = { saveSetting, readSettings };
