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
async function encryptCard(masterKey, newCard) {
    const salt = crypto.randomBytes(saltLength); // Generamos un salt aleatorio
    const iv = crypto.randomBytes(16); // Generamos un IV aleatorio
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Cifrado del nombre
    const cipherName = crypto.createCipheriv(algorithm, key, iv);
    let nameEncrypted = cipherName.update(newCard.name, 'utf8', 'hex');
    nameEncrypted += cipherName.final('hex');

    // Cifrado del usuario (si existe)
    let userEncrypted = null;
    if (newCard.user !== null && newCard.user !== '') {
        const cipherUser = crypto.createCipheriv(algorithm, key, iv);
        userEncrypted = cipherUser.update(newCard.user, 'utf8', 'hex');
        userEncrypted += cipherUser.final('hex');
    }

    // Cifrado de la contraseña
    const cipherPass = crypto.createCipheriv(algorithm, key, iv);
    let passwordEncrypted = cipherPass.update(newCard.password, 'utf8', 'hex');
    passwordEncrypted += cipherPass.final('hex');

    // Cifrado del sitio web (si existe)
    let webEncrypted = null;
    if (newCard.web !== null && newCard.web !== '') {
        const cipherWeb = crypto.createCipheriv(algorithm, key, iv);
        webEncrypted = cipherWeb.update(newCard.web, 'utf8', 'hex');
        webEncrypted += cipherWeb.final('hex');
    }
    // Retornar la tarjeta cifrada
    return {
        id: newCard.id,
        name: nameEncrypted,
        user: userEncrypted,
        password: passwordEncrypted,
        web: webEncrypted,
        color: newCard.color,
        favorite: newCard.favorite,
        salt: salt.toString('hex'), // Guardamos el salt
        iv: iv.toString('hex'), // Guardamos el IV
    };
}

// Función para preparar una tarjeta. Paso intermedio para mostrar los objetos en la UI
async function prepareCard(masterKey, encryptedCard) {
    const salt = Buffer.from(encryptedCard.salt, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(encryptedCard.iv, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Descifrado del nombre
    const decipherName = crypto.createDecipheriv(algorithm, key, iv);
    let nameDecrypted = decipherName.update(encryptedCard.name, 'hex', 'utf8');
    nameDecrypted += decipherName.final('utf8');

    // Descifrado del sitio web (si existe)
    let webDecrypted = null;
    if (encryptedCard.web !== null && encryptedCard.web !== '') {
        const decipherWeb = crypto.createDecipheriv(algorithm, key, iv);
        webDecrypted = decipherWeb.update(encryptedCard.web, 'hex', 'utf8');
        webDecrypted += decipherWeb.final('utf8');
    }
    // Retornar la tarjeta preparada, solo el nombre y el sitio web descifrados
    return {
        id: encryptedCard.id,
        name: nameDecrypted,
        user: encryptedCard.user, // Mantenemos el usuario cifrado
        password: encryptedCard.password, // Mantenemos la contraseña cifrada
        web: webDecrypted,
        color: encryptedCard.color,
        favorite: encryptedCard.favorite,
        salt: encryptedCard.salt,
        iv: encryptedCard.iv,
    };
}

async function decryptPreparedCard(masterKey, encryptedCard) {
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

    return {
        id: encryptedCard.id,
        name: encryptedCard.name,
        user: userDecrypted,
        password: passwordDecrypted,
        web: encryptedCard.web,
        color: encryptedCard.color,
        favorite: encryptedCard.favorite,
    };
}

async function decryptCard(masterKey, encryptedCard) {
    const salt = Buffer.from(encryptedCard.salt, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(encryptedCard.iv, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Descifrado del nombre
    const decipherName = crypto.createDecipheriv(algorithm, key, iv);
    let nameDecrypted = decipherName.update(encryptedCard.name, 'hex', 'utf8');
    nameDecrypted += decipherName.final('utf8');

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

    // Descifrado del sitio web (si existe)
    let webDecrypted = null;
    if (encryptedCard.web !== null && encryptedCard.web !== '') {
        const decipherWeb = crypto.createDecipheriv(algorithm, key, iv);
        webDecrypted = decipherWeb.update(encryptedCard.web, 'hex', 'utf8');
        webDecrypted += decipherWeb.final('utf8');
    }
    // Retornar la tarjeta descifrada
    return {
        id: encryptedCard.id,
        name: nameDecrypted,
        user: userDecrypted,
        password: passwordDecrypted,
        web: webDecrypted,
        color: encryptedCard.color,
        favorite: encryptedCard.favorite,
    };
}

// Función para cifrar datos de la nota usando una contraseña
async function encryptNote(masterKey, newNote) {
    const salt = crypto.randomBytes(saltLength); // Generamos un salt aleatorio
    const iv = crypto.randomBytes(16); // Generamos un IV aleatorio
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Cifrado del contenido (si existe)
    let contentEncrypted = null;
    if (newNote.content !== null && newNote.content !== '') {
        const cipherContent = crypto.createCipheriv(algorithm, key, iv);
        contentEncrypted = cipherContent.update(newNote.content, 'utf8', 'hex');
        contentEncrypted += cipherContent.final('hex');
    }

    return {
        id: newNote.id,
        name: newNote.name,
        content: contentEncrypted,
        color: newNote.color,
        favorite: newNote.favorite,
        salt: salt.toString('hex'), // Guardamos el salt
        iv: iv.toString('hex'), // Guardamos el IV
    };
}

async function decryptNote(masterKey, encryptedNote) {
    const salt = Buffer.from(encryptedNote.salt, 'hex'); // Convertimos el salt de nuevo a binario
    const iv = Buffer.from(encryptedNote.iv, 'hex'); // Convertimos el IV de nuevo a binario
    const key = deriveKey(masterKey, salt); // Derivamos la clave desde la contraseña

    // Descifrado del contenido (si existe)
    let contentDecrypted = null;
    if (encryptedNote.user !== null && encryptedNote.content !== null && encryptedNote.content !== '') {
        const decipherContent = crypto.createDecipheriv(algorithm, key, iv);
        contentDecrypted = decipherContent.update(encryptedNote.content, 'hex', 'utf8');
        contentDecrypted += decipherContent.final('utf8');
    }

    return {
        id: encryptedNote.id,
        name: encryptedNote.name,
        content: contentDecrypted,
        color: encryptedNote.color,
        favorite: encryptedNote.favorite,
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

module.exports = { hashPassword, verifyPassword, encryptCard, prepareCard, decryptPreparedCard, decryptCard, encryptNote, decryptNote };