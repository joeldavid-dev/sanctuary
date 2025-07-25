// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');
const { app } = require("electron");

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Variables
let settingsPath = null;
// Determinar la ruta del archivo de configuración
if (globalConfig.debug) {
    settingsPath = path.join(__dirname, globalConfig.settingsPath);
} else {
    settingsPath = path.join(app.getPath('userData'), globalConfig.settingsPath);
}

printDebug('Ruta del archivo de configuracion: ' + settingsPath);

// Guardar datos en un archivo JSON
function saveSetting(data) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

// Leer datos de un archivo JSON
function readSettings() {
    if (!fs.existsSync(settingsPath)) return null;
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

function printDebug(info){
    if (globalConfig.debug) console.log(`(saveSettings) >> ${info}`);
}

module.exports = { saveSetting, readSettings };
