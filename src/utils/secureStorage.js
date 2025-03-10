// Almacena la contraseña de la aplicación en el sistema operativo.
const keytar = require('keytar');

const SERVICE_NAME = "MiAppElectron";
const ACCOUNT_NAME = "Usuario";

async function savePassword(password) {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, password);
}

async function getPassword() {
    return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
}

module.exports = { savePassword, getPassword };
