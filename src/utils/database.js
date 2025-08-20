const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require("electron");

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

// Variables
let dbPath = null;
// Detectar si la app está empaquetada
const isPackaged = app.isPackaged;
// Determinar la ruta de la base de datos
if (!isPackaged) {
    dbPath = path.join(__dirname, globalConfig.dbPath);
} else {
    dbPath = path.join(app.getPath('userData'), globalConfig.dbPath);
}

printDebug('Ruta de la base de datos: ' + dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        printDebug('Error al conectar con SQLite: ' + err.message);
    } else {
        printDebug('Conectado a la base de datos SQLite');
    }
});

// Creación de tablas si no existen
db.run(`CREATE TABLE IF NOT EXISTS user (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS cardsData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user TEXT,
    password TEXT NOT NULL,
    web TEXT,
    color TEXT NOT NULL,
    favorite BOOLEAN NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

db.run(`CREATE TABLE IF NOT EXISTS notesData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT,
    color TEXT NOT NULL,
    favorite BOOLEAN NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

// Función para crear una tarjeta
function createCard(card) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO cardsData 
        (name, user, password, web, color, favorite, salt, iv) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(query, [card.name, card.user, card.password, card.web,
        card.color, card.favorite, card.salt, card.iv], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    name: card.name,
                    user: card.user,
                    password: card.password,
                    web: card.web,
                    color: card.color,
                    favorite: card.favorite,
                    salt: card.salt,
                    iv: card.iv,
                });
            }
        });
    });
}

// Función para eliminar una tarjeta
function deleteCard(id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM cardsData WHERE id = ?`;
        db.run(query, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ deletedId: id });
            }
        });
    });
}

// Función para actualizar una tarjeta
function updateCard(id, card) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE cardsData SET 
        name = ?, user = ?, password = ?, web = ?, color = ?, favorite = ?, salt = ?, iv = ? 
        WHERE id = ?`;

        db.run(query, [card.name, card.user, card.password, card.web,
        card.color, card.favorite, card.salt, card.iv, id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: id,
                    name: card.name,
                    user: card.user,
                    password: card.password,
                    web: card.web,
                    color: card.color,
                    favorite: card.favorite,
                    salt: card.salt,
                    iv: card.iv,
                });
            }
        });
    });
}

// Función para obtener todas las tarjetas
function getAllCards() {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM cardsData`;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Función para crear una nota
function createNote(note) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO notesData 
        (name, content, color, favorite, salt, iv) 
        VALUES (?, ?, ?, ?, ?, ?)`;

        db.run(query, [note.name, note.content, note.color, note.favorite,
        note.salt, note.iv], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    name: note.name,
                    content: note.content,
                    color: note.color,
                    favorite: note.favorite,
                    salt: note.salt,
                    iv: note.iv,
                });
            }
        });
    });
}

// Función para eliminar una nota
function deleteNote(id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM notesData WHERE id = ?`;
        db.run(query, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ deletedId: id });
            }
        });
    });
}

// Función para actualizar una nota
function updateNote(id, note) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE notesData SET 
        name = ?, content = ?, color = ?, favorite = ?, salt = ?, iv = ? 
        WHERE id = ?`;

        db.run(query, [note.name, note.content,
        note.color, note.favorite, note.salt, note.iv, id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: id,
                    name: note.name,
                    content: note.content,
                    color: note.color,
                    favorite: note.favorite,
                    salt: note.salt,
                    iv: note.iv,
                });
            }
        });
    });
}

// Función para obtener todas las notas
function getAllNotes() {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM notesData`;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function printDebug(info) {
    if (globalConfig.debug) console.log(`(database) >> ${info}`);
}

module.exports = { addUser, getUser, createCard, deleteCard, updateCard, getAllCards, createNote, deleteNote, updateNote, getAllNotes };
