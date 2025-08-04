// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');
const { app } = require("electron");

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Variables
let settingsPath = null;
// Detectar si la app está empaquetada
const isPackaged = app.isPackaged;
// Determinar la ruta del archivo de configuración
if (!isPackaged) {
    settingsPath = path.join(__dirname, globalConfig.settingsPath);
} else {
    settingsPath = path.join(app.getPath('userData'), globalConfig.settingsPath);
}

printDebug("Ruta del archivo de configuracion: " + settingsPath);

// Guardar datos en un archivo JSON
function writeSettings(data) {
    try {
        printDebug("configuracion guardada:", data);
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        printDebug("Error al guardar la configuracion:", error);
        return false;
    }
}

// Leer datos de un archivo JSON
function readSettings() {
    if (!fs.existsSync(settingsPath)) {
        printDebug("No se encontro el archivo de configuracion. Se inicializa archivo JSON vacio.");
        saveSettings({});
        return {};
    }

    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        printDebug("Configuraciones obtenidas:", settings);
        return settings;
    } catch (err) {
        printDebug("Error al leer el archivo de configuracion:", err);
        return {};
    }
}

function printDebug(info, obj = null) {
    if (globalConfig.debug) {
        console.log(`(saveSettings) >> ${info}`);
        if (obj) console.log(obj);
    }
}

module.exports = { writeSettings, readSettings };
