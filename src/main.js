const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron')
const path = require('node:path')
const cr = require('./utils/crypto.js');
const db = require('./utils/database.js');
const now = new Date();
const hours = now.getHours();

let mainWindow, superUser, masterKey;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 580,
        minHeight: 400,
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

// Mostrar notificación del sistema
ipcMain.handle('show-notification', (event, title, body) => {
    const notification = new Notification({
        title: title,
        body: body,
    });
    notification.show();
});

// BASE DE DATOS
// Encripta la contraseña del usuario y almacena en la base de datos
// toda la información obtenida. Almacena el usuario en la variable local
// "superUser".
ipcMain.handle('createID', async (event, name, password, gender) => {
    try {
        const hashPassword = await cr.hashPassword(password);
        const result = await db.addUser(
            name,
            gender,
            hashPassword,
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
ipcMain.handle('verify-password', async (event, password) => {
    const match = await cr.verifyPassword(password, superUser.hash);
    if (match) {
        masterKey = password;
        mainWindow.loadFile('src/views/home.html');
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
        return 'Buenos días, ' + superUser.name;
    } else if (hours >= 12 && hours < 19) {
        // Tarde
        return 'Buenas tardes, ' + superUser.name;
    } else {
        // Noche
        return 'Buenas noches, ' + superUser.name;
    }
});

// Crear una nueva tarjeta
ipcMain.handle('create-card', async (event, name, user, password, web, color, favorite) => {
    try {
        const encryptedCard = cr.encryptCard(masterKey, user, password, web);
        const result = await db.addCard(
            name,
            encryptedCard.userEncrypted,
            encryptedCard.passwordEncrypted,
            encryptedCard.webEncrypted,
            color,
            favorite,
            encryptedCard.salt,
            encryptedCard.iv,
        );
        return {
            success: true,
            ID: result.id,
        };
    } catch (error) {
        return {
            success: false,
            message: 'No se pudo crear la tarjeta',
            error: error.message,
        };
    }
});

ipcMain.handle('get-all-cards', async () => {
    try {
        const encryptedCards = await db.getAllCards();
        
        let cards = [];
        // Desencriptar cada tarjeta y agregarla a la lista de tarjetas
        encryptedCards.forEach(encryptedCard => {
            // Desencriptar los datos de la tarjeta
            const card = cr.decryptCard(masterKey, encryptedCard);

            // Agregar la tarjeta desencriptada a la lista
            cards.push(card);
        });

        return { success: true, data: cards };
    } catch (error) {
        return { success: false, error: error.message };
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