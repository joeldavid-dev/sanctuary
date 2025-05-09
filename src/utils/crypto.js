// Cifrado y descifrado de texto con AES-256 y PBKDF2
const crypto = require('crypto');
// bcrypt para hashing de la llave maestra
const bcrypt = require('bcrypt');

const saltRounds = 12; // Número de rondas para bcrypt

const algorithm = 'aes-256-cbc';
const saltLength = 16; // Tamaño del salt
const iterations = 100000; // Número de iteraciones para PBKDF2

// Hashear una contraseña
async function hashPassword(password) {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash.toString('hex'); // Devolvemos el hash como string
}

// Verificar una contraseña propuesta en login
async function verifyPassword(password, hashedPasswordHex) {
    const hashedPassword = Buffer.from(hashedPasswordHex, 'hex'); // Convertimos el hash de nuevo a binario
    const match = await bcrypt.compare(password, hashedPasswordHex);
    return match; // true si coincide, false si no
}

// Función para derivar una clave segura a partir de una contraseña
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
}

// Función para cifrar datos de la tarjeta usando una contraseña
function encryptCard(masterKey, user, password, web) {
    const salt = crypto.randomBytes(saltLength); // Generamos un salt aleatorio
    const iv = crypto.randomBytes(16); // Generamos un IV aleatorio
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Cifrado del usuario (si existe)
    let userEncrypted = null;
    if (user !== null && user !== '') {
        const cipherUser = crypto.createCipheriv(algorithm, key, iv);
        userEncrypted = cipherUser.update(user, 'utf8', 'hex');
        userEncrypted += cipherUser.final('hex');
    }

    // Cifrado de la contraseña
    const cipherPass = crypto.createCipheriv(algorithm, key, iv);
    let passwordEncrypted = cipherPass.update(password, 'utf8', 'hex');
    passwordEncrypted += cipherPass.final('hex');

    // Cifrado del enlace web (si existe)
    let webEncrypted = null;
    if (web !== null && web !== '') {
        const cipherWeb = crypto.createCipheriv(algorithm, key, iv);
        webEncrypted = cipherWeb.update(web, 'utf8', 'hex');
        webEncrypted += cipherWeb.final('hex');
    }

    return {
        salt: salt.toString('hex'), // Guardamos el salt
        iv: iv.toString('hex'), // Guardamos el IV
        userEncrypted,
        passwordEncrypted,
        webEncrypted,
    };
}

function decryptCard(masterKey, encryptedCard) {
    const salt = Buffer.from(encryptedCard.salt, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(encryptedCard.iv, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Descifrado del usuario (si existe)
    let userDecrypted = null;
    if (encryptedCard.user !== null && encryptedCard.user !== '') {
        const decipherUser = crypto.createDecipheriv(algorithm, key, iv);
        userDecrypted = decipherUser.update(encryptedCard.user, 'hex', 'utf8');
        userDecrypted += decipherUser.final('utf8');
    }

    // Descifrado de la contraseña
    const decipherPass = crypto.createDecipheriv(algorithm, key, iv);
    let passwordDecrypted = decipherPass.update(encryptedCard.password, 'hex', 'utf8');
    passwordDecrypted += decipherPass.final('utf8');

    // Descifrado del enlace web (si existe)
    let webDecrypted = null;
    if (encryptedCard.web !== null && encryptedCard.web !== '') {
        const decipherWeb = crypto.createDecipheriv(algorithm, key, iv);
        webDecrypted = decipherWeb.update(encryptedCard.web, 'hex', 'utf8');
        webDecrypted += decipherWeb.final('utf8');
    }

    return {
        id: encryptedCard.id,
        name: encryptedCard.name,
        user: userDecrypted,
        password: passwordDecrypted,
        web: webDecrypted,
        color: encryptedCard.color,
        favorite: encryptedCard.favorite,
    };
}

// Función para descifrar datos usando una contraseña
function decrypt(encryptedData, masterKey, saltHex, ivHex) {
    const salt = Buffer.from(saltHex, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(ivHex, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// Función para cifrar con un Salt y un IV dados
function encryptWithSaltIV(text, password, saltHex, ivHex) {
    const salt = Buffer.from(saltHex, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(ivHex, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(password, salt); // Derivamos la clave desde la contraseña

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { encryptedData: encrypted };
}

module.exports = { hashPassword, verifyPassword, encryptCard, decryptCard };