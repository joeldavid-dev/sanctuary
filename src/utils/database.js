const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// Crear la tabla
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS encrypted_data (id INTEGER PRIMARY KEY, data TEXT)");
});

// Guardar datos encriptados
function saveEncryptedData(encryptedText) {
    db.run("INSERT INTO encrypted_data (data) VALUES (?)", [encryptedText]);
}

// Leer el último dato encriptado
function getEncryptedData(callback) {
    db.get("SELECT data FROM encrypted_data ORDER BY id DESC LIMIT 1", [], (err, row) => {
        if (err) {
            console.error(err);
            callback(null);
        } else {
            callback(row ? row.data : null);
        }
    });
}

module.exports = { saveEncryptedData, getEncryptedData };
