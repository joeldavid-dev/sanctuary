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
    gender TEXT NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL
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

// Función para crear un usuario
function addUser(name, gender, password, salt, iv) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO user (name, gender, password, salt, iv) VALUES (?, ?, ?, ?, ?)`, [name, gender, password, salt, iv], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ name, gender, password, salt, iv });
            }
        });
    });
}

// Función para obtener el usuario
// Verificar si hay mas de 0 registros en la tabla de usuario
function getUser() {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM user ORDER BY ROWID ASC LIMIT 1", (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
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

module.exports = { addUser, getUser };
