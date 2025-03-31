const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('node:path')
const { encrypt, decrypt } = require('./utils/crypto.js');
const db = require('./utils/database.js');

let mainWindow;

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
ipcMain.handle('isIdCreated', async (event) => {
    return await db.isIdCreated();
});

// Manejar solicitudes desde el renderer
ipcMain.handle('add-user', async (event, name, age) => {
    return await db.addUser(name, age);
});

ipcMain.handle('get-users', async () => {
    return await db.getUsers();
});


// Manejar el cifrado con una contraseña proporcionada por el usuario
ipcMain.handle('encrypt-data', (event, text, password) => {
    return encrypt(text, password);
});

// Manejar el descifrado con la misma contraseña
ipcMain.handle('decrypt-data', (event, encryptedData, password, salt, iv) => {
    return decrypt(encryptedData, password, salt, iv);
});
