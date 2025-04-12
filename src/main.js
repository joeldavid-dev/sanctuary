const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('node:path')
const { encrypt, decrypt, encryptWithSaltIV } = require('./utils/crypto.js');
const db = require('./utils/database.js');
const now = new Date();
const hours = now.getHours();

let mainWindow, superUser, masterKey;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 550,
        minHeight: 450,
        autoHideMenuBar: true, // Oculta el menú de opciones de electrón
        //frame: false,
        titleBarStyle: 'hidden', // oculta la barra de título
        // expose window controlls in Windows/Linux
        //...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),

        webPreferences: {
            nodeIntegration: false, // Desactiva integración directa por seguridad
            enableRemoteModule: false, // Evita el uso de remote module
            contextIsolation: true, // Necesario para usar preload. Aísla el contexto de ejecución
            sandbox: true, // Asegura la ejecución en un entorno aislado
            experimentalFeatures: false, // Desactiva funciones experimentales

            // La cadena __dirname apunta a la ruta del script
            // actualmente en ejecución
            preload: path.join(__dirname, 'preload.js')
            // La API path.join une varios segmentos de rutas,
            // creando una cadena de ruta combinada
        }
    });
    // Desactivar en producción
    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile('src/views/splash-screen.html');
    //mainWindow.loadFile('src/views/id.html');
}

app.whenReady().then(() => {
    createMainWindow()
    // Crear una ventana si no hay una cuando se activa la aplicación
    // en MacOS
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
});

// Implementa el cierre de toda la aplicación al cerrar
// todas las ventanas, excepto en MacOS
app.on('window-all-closed', (event) => {
    if (process.platform !== 'darwin') app.quit()
});

// Escuchar los eventos de manejo de ventana
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});
ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.on('close-window', () => {
    mainWindow.close();
});

// Escucha el evento de cambio de vista
ipcMain.on('change-view', (event, newView) => {
    mainWindow.loadFile(newView);
});

// Mostrar dialogo de advertencia del sistema
ipcMain.handle('show-warning', async (event, title, message) => {
    await dialog.showMessageBox({
        type: 'warning',
        title: title,
        message: message,
        buttons: ['OK']
    });
});

// Abrir enlaces en navegador externo
ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
});

// BASE DE DATOS
// Encripta la contraseña del usuario y almacena en la base de datos
// toda la información obtenida. Almacena el usuario en la variable local
// "superUser".
ipcMain.handle('createID', async (event, name, password, gender) => {
    try {
        const encryptPass = encrypt(password, password)
        const result = await db.addUser(
            name,
            gender,
            encryptPass.encryptedData,
            encryptPass.salt,
            encryptPass.iv
        );
        // Todo salío bien
        superUser = result;
        return {
            success: true,
            message: 'Usuario creado correctamente'
        };
    }
    // Hay errores
    catch (error) {
        return {
            success: false,
            message: 'No se pudo crear el usuario',
            error: error.message
        };
    }
});

// Obtiene el primer registro de user, si es indefinido entonces no
// existe usuario. Si existe, se guarda en la variable local "superUser"
ipcMain.handle('get-user-status', async () => {
    try {
        const result = await db.getUser();
        if (result) {
            superUser = result;
            return true;
        } else return false;
    }
    catch (error) {
        return false;
    }
});

// Verificar la contraseña obtenida con la del usuario guardado.
ipcMain.handle('verify-password', (event, password) => {
    const result = encryptWithSaltIV(password, password, superUser.salt, superUser.iv);
    if (result.encryptedData == superUser.password) {
        masterKey = password;
        mainWindow.loadFile('src/views/cryptoTest.html');
        return {
            verified: true,
            message: 'La contraseña es autentica',
        }
    } else return {
        verified: false,
        message: 'La contraseña no es autentica',
    }
});

// Obtener saludo
ipcMain.handle('get-greeting', () => {
    if (hours >= 0 && hours < 7) {
        // Madrugada
        return 'Es hora de descansar, ' + superUser.name;
    } else if (hours >= 7 && hours < 12) {
        // Dia
        return '¡Buenos días, ' + superUser.name + '!';
    } else if (hours >= 12 && hours < 19) {
        // Tarde
        return '¡Buenas tardes, ' + superUser.name + '!';
    } else {
        // Noche
        return '¡Buenas noches, ' + superUser.name + '!';
    }
});

// Manejar el cifrado con una contraseña proporcionada por el usuario
ipcMain.handle('encrypt-data', (event, text, password) => {
    return encrypt(text, password);
});

// Manejar el descifrado con la misma contraseña
ipcMain.handle('decrypt-data', (event, encryptedData, password, salt, iv) => {
    return decrypt(encryptedData, password, salt, iv);
});
