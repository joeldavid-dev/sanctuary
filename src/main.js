const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const cr = require('./utils/crypto.js');
const db = require('./utils/database.js');
const oldCr = require('./utils/oldCrypto.js');
const st = require('./utils/settings.js');
const fs = require('fs');

// Configuraciones globales
const globalConfigPath = path.join(__dirname, 'config', 'globalConfig.json');
const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));

// Configuraciones por defecto
const defaultSettingsPath = path.join(__dirname, 'config', 'defaultSettings.json');
const defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));

// Variables
let mainWindow, superUser, masterKey, oldData;
let settings = null;
let translations = null;
let mainTranslations = null;

// Creación de la ventana principal
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
            preload: path.join(__dirname, 'preload.js'),
            // La API path.join une varios segmentos de rutas,
            // creando una cadena de ruta combinada

            // Desactivar en producción
            devTools: globalConfig.debug, // Activa las herramientas de desarrollo si está en modo depuración
        }
    });
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

    // Comprobar si hay actualizaciones disponibles
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        printDebug('Error al comprobar actualizaciones: ' + err);
    });

    // Cargar configuraciones
    loadSettings();

    // Cargar traducciones
    loadTranslations();
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

// Obtener configuraciones
function loadSettings() {
    // Obteniendo las configuraciones. Si no existen, se guardan las default.
    settings = st.readSettings();
    if (!settings) {
        settings = {
            "customization": defaultSettings.customization,
            "language": defaultSettings.language
        }
        st.saveSetting(settings);
    }
};

// Obtiene traducciones según la configuración actual. 
function loadTranslations() {
    let language = 'en';

    if (settings.language === 'system') {
        language = app.getLocale().slice(0, 2);
        printDebug('Idioma del sistema: ' + language);
        if (!defaultSettings.languages.includes(language)) language = 'en';
    }
    else (defaultSettings.languages.includes(settings.language)) ? language = settings.language : language = 'en';

    printDebug('Idioma obtenido: ' + language);

    try {
        const filePath = path.join(__dirname, 'locales', `${language}.json`);
        const raw = fs.readFileSync(filePath, 'utf8');
        printDebug('Cargando traduccion: ' + filePath);
        translations = JSON.parse(raw);
        mainTranslations = translations[main];
    } catch (err) {
        printDebug('Error al cargar traduccion: ' + err);
    }
};

ipcMain.handle('get-translations', (event, view) => {
    loadTranslations()
    return translations[view];
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

// Obtener arvhivo JSON con datos a importar desde el explorador de archivos
ipcMain.handle('get-json-file', async () => {
    // Mostrar un cuadro de diálogo para seleccionar el archivo JSON
    const { canceled, filePaths } = await dialog.showOpenDialog({
        tittle: mainTranslations['json-dialog-title'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });
    // Si se cancela la selección o no se selecciona ningún archivo, salir
    if (canceled || filePaths.length === 0) {
        printDebug('Operacion "importar JSON" cancelada.');
        return {
            success: false,
            message: mainTranslations['json-dialog-cancelled']
        };
    }
    // Leer el contenido del archivo JSON seleccionado
    // y convertirlo a un objeto JavaScript
    const filePath = filePaths[0];
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(content);

        // Verificar que el archivo JSON tenga la estructura correcta
        const sanctuaryKey = '120065-331450-300009-276166-92029-265686-292000-249548-309477-85124-301972-320490-99250-292792-93249-102400-278873-306799-264395-300956-287091-255610-306710-102720-290446-174340-101850-218284-266491-291804-271861-297925-294223-290602-93449-310572-102490-155025-141492-42624-';
        const requiredKeys = ['name', 'password', 'gender', 'Sanctuary', 'cards'];
        const hasRequiredKeys = requiredKeys.every(key => key in jsonData);
        if (hasRequiredKeys && jsonData.Sanctuary === sanctuaryKey && Array.isArray(jsonData.cards)) {
            oldData = jsonData;
            return {
                success: true,
                message: mainTranslations['json-dialog-success'],
                name: jsonData.name,
            };
        }
        else {
            return {
                success: false,
                message: mainTranslations['json-dialog-invalid'],
            };
        }
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        return {
            success: false,
            message: mainTranslations['json-dialog-error'],
            error: error.message
        };
    }
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

// Retorna la información del usuario almacenado
ipcMain.handle('get-user-info', () => {
    if (superUser) {
        return {
            name: superUser.name,
            gender: superUser.gender
        }
    } else {
        return {
            name: '¿?',
            gender: '¿?'
        }
    }
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
            message: mainTranslations['createID-success'],
        };
    }
    // Hay errores
    catch (error) {
        return {
            success: false,
            message: mainTranslations['createID-error'],
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
async function verifyPassword(password) {
    const match = await cr.verifyPassword(password, superUser.hash);
    if (match) {
        masterKey = password;
        mainWindow.loadFile('src/views/home.html');
        return {
            verified: true,
            message: mainTranslations['verify-password-success'],
        }
    } else return {
        verified: false,
        message: mainTranslations['verify-password-fail'],
    }
}

ipcMain.handle('verify-password', (event, password) => {
    // Electron maneja "handle" como asíncrono por lo que no es necesario usar await.
    return verifyPassword(password);
});

// Crear una nueva tarjeta
ipcMain.handle('create-card', async (event, newCard) => {
    try {
        // Encriptar los datos de la tarjeta
        const encryptedCard = await cr.encryptCard(masterKey, newCard);
        const result = await db.createCard(encryptedCard);
        return {
            success: true,
            message: mainTranslations['create-card-success'],
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['create-card-error'],
            error: error.message,
        };
    }
});

// Actualizar una tarjeta
ipcMain.handle('update-card', async (event, id, updatedCard) => {
    try {
        // Encriptar los datos de la tarjeta actualizada
        const encryptedCard = await cr.encryptCard(masterKey, updatedCard);
        printDebug('Tarjeta a actualizar encriptada: ' + encryptedCard.name);
        const result = await db.updateCard(id, encryptedCard);
        return {
            success: true,
            message: mainTranslations['update-card-success'],
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['update-card-error'],
            error: error.message,
        };
    }
});

// Desencriptar una tarjeta
ipcMain.handle('decrypt-card', async (event, encryptedCard) => {
    try {
        const decryptedCard = await cr.decryptCard(masterKey, encryptedCard);
        return {
            success: true,
            message: mainTranslations['decrypt-card-success'],
            data: decryptedCard,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['decrypt-card-error'],
            error: error.message,
        };
    }
});

// Eliminar una tarjeta en la base de datos
ipcMain.handle('delete-card', async (event, id) => {
    try {
        const result = await db.deleteCard(id);
        if (result) {
            return {
                success: true,
                message: mainTranslations['delete-card-success'],
            };
        }
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['delete-card-error'],
            error: error.message,
        };
    }
});

// Obtener todas las tarjetas de la base de datos
ipcMain.handle('get-all-cards', async () => {
    try {
        const encryptedCards = await db.getAllCards();
        return { success: true, data: encryptedCards };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Importar datos de la version anterior
ipcMain.handle('import-data', async (event, key) => {
    const encryptedKey = oldCr.encrypt(key, key);
    if (encryptedKey === oldData.password) {
        const adaptedID = oldCr.adaptOldID(oldData);
        // Crear el usuario
        try {
            const hashPassword = await cr.hashPassword(key);
            const result = await db.addUser(
                adaptedID.name,
                adaptedID.gender,
                hashPassword,
            );
            // Todo salío bien
            superUser = result;
            printDebug('Usuario creado correctamente');
        }
        catch (error) {
            console.error('Error al importar el usuario:', error);
            return {
                success: false,
                message: mainTranslations['import-data-error'],
                error: error.message
            };
        }

        // Adaptar datos de las tarjetas una por una, para
        // garantizar el orden original
        printDebug('Adaptando e importando tarjetas desde Sanctuary 4.2...');
        for (const oldCard of oldData.cards) {
            printDebug('\nAdaptando tarjeta:' + oldCard.name);
            const adaptedCard = oldCr.adaptOldCard(key, oldCard);
            try {
                const encryptedCard = await cr.encryptCard(key, adaptedCard);
                const result = await db.createCard(encryptedCard);
            } catch (error) {
                return {
                    success: false,
                    message: mainTranslations['import-card-error'],
                    error: error.message,
                };
            }
        };

        // Proceso terminado de forma exitosa
        return {
            success: true,
            message: mainTranslations['import-data-success'],
        };
    } else {
        return {
            success: false,
            message: mainTranslations['import-data-wrong-password'],
        };
    }
});

// Configuraciones y comandos
ipcMain.handle('get-commands', () => {
    const commandsPath = path.join(__dirname, 'config', 'commands.json');
    if (fs.existsSync(commandsPath)) {
        return JSON.parse(fs.readFileSync(commandsPath, 'utf8')).commands;
    } else {
        return [];
    }
});

// Manejo de comandos
ipcMain.handle('execute-command', async (event, command) => {
    const [cmd, ...args] = command.split(':');
    switch (cmd) {
        case 'exit':
            app.quit();
            break;
        case 'reload':
            mainWindow.reload();
            break;
        case 'relaunch':
            app.relaunch();
            app.quit();
            break;
        case 'lock':
            mainWindow.loadFile('src/views/lock.html');
            break;
        default:
            // Comando no reconocido
            return { success: false, message: `${cmd}: ${mainTranslations['command-not-found']}` };
    }
});


function printDebug(info) {
    if (globalConfig.debug) console.log('(main) >> ' + info);
}