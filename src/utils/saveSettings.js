// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Variables
let settingsPath = null;
// Determinar la ruta de la base de datos
if (globalConfig.debug) {
    settingsPath = path.join(__dirname, globalConfig.settingsPath);
    console.log('Ruta del archivo de configuracion:', settingsPath);
} else {
    settingsPath = path.join(app.getPath('userData'), globalConfig.settingsPath);
}

// Guardar datos en un archivo JSON
function saveSetting(data) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

// Leer datos de un archivo JSON
function readSettings() {
    if (!fs.existsSync(settingsPath)) return null;
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

module.exports = { saveSetting, readSettings };
