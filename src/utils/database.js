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
    gender TEXT NOT NULL
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

// Verificar si hay mas de 0 registros en la tabla de usuario
function isIdCreated() {
    return new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) AS count FROM user", (err, result) => {
            if (err) {
                console.error("Error al contar registros:", err);
                resolve(false); // En caso de error, se asume que no hay registros
            }
            else {
                resolve(result.count > 0); // Devuelve true si hay registros, false si no
            }
        });
    });
}

// Función para crear un usuario
function addUser(name, password, gender) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO user (name, password, gender) VALUES (?, ?, ?)`, [name, password, gender], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve({ id: this.lastID, name, gender });
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
