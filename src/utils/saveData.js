// Almacena datos localmente en un archivo JSON. Útil para almacenar configuraciones.
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, 'data.json');

// Guardar datos encriptados en un archivo
function saveEncryptedData(data) {
    fs.writeFileSync(saveFilePath, JSON.stringify(data, null, 2));
}

// Leer datos encriptados de un archivo
function readEncryptedData() {
    if (!fs.existsSync(saveFilePath)) return null;
    return JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
}

module.exports = { saveEncryptedData, readEncryptedData };
