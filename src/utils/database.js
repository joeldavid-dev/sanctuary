const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión con la base de datos
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Creación de tablas
db.run(`CREATE TABLE IF NOT EXISTS user (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    gender INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS passData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user TEXT NOT NULL,
    password TEXT NOT NULL,
    web TEXT,
    favorite BOOLEAN,
    userID INTEGER
)`);


// Función para insertar un usuario
function addUser(name, password, gender) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (name, password, gender) VALUES (?, ?, ?)`, [name, password, gender], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve({ id: this.lastID, name, age });
            }
        });
    });
}

// Función para obtener todos los usuarios
function getUsers() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users`, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// Verificar si el ID esta creado, devolver true o false
// Verifica que el número de registros en la tabla sea >= 1.
function isIdCreated() {
    db.get("SELECT COUNT(*) AS total FROM user", (err, result) => {
        if (err) {
            console.error("Error al contar registros:", err);
            return false;
        } else {
            if (result.total == 1) {
                console.log(`La tabla tiene ${result.total} registros.`);
                return true;
            }
            else {
                return false;
            }
        }
    });
}

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

module.exports = { addUser, getUsers, isIdCreated, saveEncryptedData, getEncryptedData };
