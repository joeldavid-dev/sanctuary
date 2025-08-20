const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const cr = require('./utils/crypto.js');
const db = require('./utils/database.js');
const oldCr = require('./utils/oldCrypto.js');
const st = require('./utils/settings.js');
const cg = require('./utils/colorGenerator.js');
const fs = require('fs');

// Configuraciones globales
const globalConfigPath = path.join(__dirname, 'config', 'globalConfig.json');
const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));

// Constantes
const constantsPath = path.join(__dirname, 'config', 'constants.json');
const constants = JSON.parse(fs.readFileSync(constantsPath, 'utf-8'));

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
    printDebug("Iniciando la creacion de ventana...");
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 580,
        minHeight: 360,
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

app.whenReady().then(async () => {
    // Cargar configuraciones
    await loadSettings();

    // Cargar traducciones
    loadTranslations();

    // Crea la ventana
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

// Leer las configuraciones y generar colores si esta configurado de esa manera.
async function loadSettings() {
    // Obteniendo las configuraciones.
    settings = st.readSettings();

    const colorStyle = getSetting('colorStyle');

    if (colorStyle === "generate") {
        const genColors = await cg.generateColorPalette(getSetting('background'));
        settings['appContrastLight'] = genColors.appContrastLight;
        settings['appContrastDark'] = genColors.appContrastDark;
    }
};

// Verifica si existe la configuración, si existe, la retorna, si no, toma la configuración por defecto.
function getSetting(key) {
    const setting = settings[key];
    if (setting) {
        return setting;
    } else {
        printDebug(`Configuracion "${key}" no encontrada. Se escribe la configuracion por defecto`);
        settings[key] = defaultSettings[key];
        st.writeSettings(settings);
        return settings[key];
    }
}

// Guarda una configuración.
function setSetting(key, value) {
    settings[key] = value;
    st.writeSettings(settings);
}

// Exponer la función para obtener una configuración.
ipcMain.handle('get-setting', (event, key) => {
    return getSetting(key);
});

// Expone las constantes del programa
ipcMain.handle('get-constants', (event) => {
    return constants;
});

// Obtiene traducciones según la configuración actual. 
function loadTranslations() {
    let language = getSetting('language');
    // Si el lenguaje está configurado como 'sistema'
    if (language === 'system') {
        language = app.getLocale().slice(0, 2);
        printDebug('Idioma del sistema: ' + language);
        if (!constants.languages.includes(language)) language = 'en';
    }

    printDebug('Idioma mostrado: ' + language);

    try {
        const filePath = path.join(__dirname, 'locales', `${language}.json`);
        const raw = fs.readFileSync(filePath, 'utf8');
        printDebug('Cargando traduccion: ' + filePath);
        translations = JSON.parse(raw);
        mainTranslations = translations["main"];
    } catch (err) {
        printDebug('Error al cargar traduccion: ' + err);
    }
};

ipcMain.on('load-translations', (event) => {
    printDebug('Se solicitó recargar las traducciones.');
    loadTranslations();
});

ipcMain.handle('get-translations', (event, view) => {
    printDebug('La vista "' + view + '" ha solicitado traducciones.');
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
        const oldSanctuaryKey = constants.oldSanctuaryKey;
        const requiredKeys = ['name', 'password', 'gender', 'Sanctuary', 'cards'];
        const hasRequiredKeys = requiredKeys.every(key => key in jsonData);
        if (hasRequiredKeys && jsonData.Sanctuary === oldSanctuaryKey && Array.isArray(jsonData.cards)) {
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

// Crear una nueva nota
ipcMain.handle('create-note', async (event, newNote) => {
    try {
        // Encriptar los datos de la nota
        const encryptedNote = await cr.encryptNote(masterKey, newNote);
        const result = await db.createNote(encryptedNote);
        return {
            success: true,
            message: mainTranslations['create-note-success'],
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['create-note-error'],
            error: error.message,
        };
    }
});

// Actualizar una nota
ipcMain.handle('update-note', async (event, id, updatedNote) => {
    try {
        // Encriptar los datos de la nota actualizada
        const encryptedNote = await cr.encryptNote(masterKey, updatedNote);
        printDebug('Nota a actualizar encriptada: ' + encryptedNote.name);
        const result = await db.updateNote(id, encryptedNote);
        return {
            success: true,
            message: mainTranslations['update-note-success'],
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['update-note-error'],
            error: error.message,
        };
    }
});

// Desencriptar una nota
ipcMain.handle('decrypt-note', async (event, encryptedNote) => {
    try {
        const decryptedNote = await cr.decryptNote(masterKey, encryptedNote);
        return {
            success: true,
            message: mainTranslations['decrypt-note-success'],
            data: decryptedNote,
        };
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['decrypt-note-error'],
            error: error.message,
        };
    }
});

// Eliminar una nota en la base de datos
ipcMain.handle('delete-note', async (event, id) => {
    try {
        const result = await db.deleteNote(id);
        if (result) {
            return {
                success: true,
                message: mainTranslations['delete-note-success'],
            };
        }
    } catch (error) {
        return {
            success: false,
            message: mainTranslations['delete-note-error'],
            error: error.message,
        };
    }
});

// Obtener todas las notas de la base de datos
ipcMain.handle('get-all-notes', async () => {
    try {
        const encryptedNotes = await db.getAllNotes();
        return { success: true, data: encryptedNotes };
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