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
    hash TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS passwordsData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user TEXT,
    password TEXT NOT NULL,
    web TEXT,
    color TEXT,
    favorite BOOLEAN,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL
    )`);

// Función para crear un usuario
function addUser(name, gender, hash) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO user (name, gender, hash) VALUES (?, ?, ?)`, [name, gender, hash], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ name, gender, hash });
            }
        });
    });
}

// Función para obtener el usuario
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

// Función para crear una contraseña
function addPassword(name, user, password, web, color, favorite, salt, iv) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO passwordsData (name, user, password, web, color, favorite, salt, iv) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [name, user, password, web, color, favorite, salt, iv], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
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

module.exports = { addUser, getUser, addPassword };
