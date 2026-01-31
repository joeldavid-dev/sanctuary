const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const { Worker } = require("worker_threads");
const path = require('node:path');
const os = require('os');
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
const showDevTools = (app.isPackaged) ? false : true;

// Carpetas
const imageCachePath = path.join(app.getPath('userData'), 'Image Cache');

// Configuraciones por defecto
const defaultSettingsPath = path.join(__dirname, 'config', 'defaultSettings.json');
const defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf8'));

// Variables
let mainWindow, superUser, masterKey, oldData;
let settings = null;
let translations = null;
let mainTranslations = null;
let logPath = null;
let preparedElements = null;

// Determinar la ruta del archivo de log
if (showDevTools) {
    logPath = path.join(__dirname, globalConfig.logPath);
} else {
    logPath = path.join(app.getPath('userData'), globalConfig.logPath);
}

writeLog("============== Iniciando aplicacion ==============");
// Creación de la ventana principal
const createMainWindow = () => {
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
        }
    });
}

app.whenReady().then(async () => {
    try {
        // Crea la ventana
        createMainWindow()
        // Crear una ventana si no hay una cuando se activa la aplicación
        // en MacOS
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
        })

        await startApp();

        // Comprobar si hay actualizaciones disponibles
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            writeLog('Error al comprobar actualizaciones:', err);
        });
    } catch (error) {
        writeLog('Error crítico al iniciar la app:', err)
    }
});

async function startApp() {
    // Cargar la pantalla de carga
    mainWindow.loadFile('src/views/splash-screen.html');

    // Cargar configuraciones
    await loadSettings();
    // Cargar correcciones de versiones antiguas
    runSettingFixes();
    // Cargar traducciones
    loadTranslations();
    // Generar colores si es necesario
    await genColors();

    // Verificar si existe un usuario creado
    const userExists = await getUserStatus();
    const ruta = userExists ? 'src/views/lock.html' : 'src/views/id.html';
    setTimeout(() => {
        mainWindow.loadFile(ruta);
    }, 3000);
}

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

// Exponer las rutas de carpetas importantes
ipcMain.handle('get-paths', (event, key) => {
    return { imageCachePath };
});

// Expone las constantes del programa
ipcMain.handle('get-constants', (event) => {
    return constants;
});

// Correcciones de configuración entre versiones
function runSettingFixes() {
    const wallpaper = getSetting('wallpaper');
    const customWallpaperPath = getSetting('customWallpaperPath');
    const customWallpaperName = getSetting('customWallpaperName');
    const customWallpaperType = getSetting('customWallpaperType');

    // Crear carpetas necesarias
    if (!fs.existsSync(imageCachePath)) {
        fs.mkdirSync(imageCachePath, { recursive: true });
        writeLog('Carpeta de caché de imágenes creada en: ' + imageCachePath);
    }

    // Versión 1.2.0: Si existe el wallpaper personalizado pero no uno de los datos necesarios, 
    // obtenerlos o reestablecer a valores por defecto.
    if (customWallpaperPath !== 'none' && fs.existsSync(customWallpaperPath)) {
        // Si no existe el nombre del wallpaper personalizado, obtenerlo de la ruta
        if (customWallpaperName === 'none') {
            const wallpaperBaseName = path.basename(customWallpaperPath, path.extname(customWallpaperPath));
            setSetting('customWallpaperName', wallpaperBaseName);
        }
        // Si no existe el tipo del wallpaper personalizado, detectarlo
        if (customWallpaperType === 'none') {
            if (constants.videoWallpapersSupported.some(ext => customWallpaperPath.endsWith(ext))) {
                setSetting('customWallpaperType', 'video');
            } else if (constants.imageWallpapersSupported.some(ext => customWallpaperPath.endsWith(ext))) {
                setSetting('customWallpaperType', 'image');
            }
        }
    } else if (wallpaper === 'custom') {
        writeLog("La ruta del wallpaper personalizado no existe, se reestablece el wallpaper por defecto.");
        setSetting('wallpaper', '');
        setSetting('customWallpaperPath', '');
        setSetting('customWallpaperName', '');
        setSetting('customWallpaperType', '');
    }
}

// Leer las configuraciones y generar colores si esta configurado de esa manera.
async function loadSettings() {
    // Obteniendo las configuraciones.
    const result = st.readSettings();
    if (result.success)
        settings = result.data
    else {
        writeLog("Error al leer configuracion: " + result.error);
        settings = {};
    }
};

async function genColors() {
    // por problemas de compatibilidad de colorThief, solo se ejecuta en windows.
    if (process.platform !== 'win32') return;
    try {
        const colorStyle = getSetting('colorStyle');
        const wallpaper = getSetting('wallpaper');

        if (colorStyle === 'generate') {
            if (wallpaper === 'custom') {
                // Declaraciones dentro del if para evitar llamadas innecesarias y llenar
                // el log de mensajes.
                const customWallpaperPath = getSetting('customWallpaperPath');
                const customWallpaperName = getSetting('customWallpaperName');
                const customWallpaperType = getSetting('customWallpaperType');
                const genColors = await cg.generateColorPalette('custom', imageCachePath, customWallpaperPath, customWallpaperType, customWallpaperName);
                settings['appContrastLight'] = genColors.appContrastLight;
                settings['appContrastDark'] = genColors.appContrastDark;
            }
            else {
                const genColors = await cg.generateColorPalette(wallpaper, imageCachePath);
                settings['appContrastLight'] = genColors.appContrastLight;
                settings['appContrastDark'] = genColors.appContrastDark;
            }
        }
    }
    catch (error) {
        writeLog("Error al generar colores: " + error.message);
        return;
    }
}

// Verifica si existe la configuración, si existe, la retorna, si no, toma la configuración por defecto.
function getSetting(key) {
    const setting = settings[key];
    if (setting) {
        return setting;
    } else {
        writeLog(`Configuracion "${key}" no encontrada. Se escribe la configuracion por defecto`);
        settings[key] = defaultSettings[key];
        const result = st.writeSettings(settings);
        if (!result.success) writeLog("Error al guardar configuracion: " + result.error);
        return settings[key];
    }
}

// Guarda una configuración.
function setSetting(key, value) {
    settings[key] = value;
    writeLog(`Configuracion "${key}" actualizada a: ${value}`);
    return st.writeSettings(settings);
}

// Resetear las configuraciones a los valores por defecto
function resetSettings() {
    settings = {};
    const result = st.writeSettings(settings);
    if (!result.success) writeLog("Error al resetear configuracion: " + result.error);
}

// Exponer la función para obtener una configuración.
ipcMain.handle('get-setting', (event, key) => {
    return getSetting(key);
});

// Exponer la función para establecer una configuración.
ipcMain.handle('set-setting', async (event, key, value) => {
    // Guardar la configuración
    const result = setSetting(key, value);

    // Acciones posteriores a guardar la configuración
    if (result.success) {
        if (key === 'language') loadTranslations();
        else if (key === 'wallpaper') await genColors();
    } else {
        writeLog(`Error al actualizar la configuracion "${key}": ${result.error}`);
    }
    return result;
});

// Obtiene traducciones según la configuración actual. 
function loadTranslations() {
    let languageCode = getSetting('language');
    // Si el lenguaje está configurado como 'sistema'
    if (languageCode === 'system') {
        languageCode = app.getLocale().slice(0, 2);
        writeLog('Idioma del sistema: ' + languageCode);
        // Si el idioma detectado no está en la lista de idiomas soportados
        const supportedLanguages = constants.languages.map(lang => lang.code);
        if (!supportedLanguages.includes(languageCode)) {
            writeLog('Idioma no soportado, se usa inglés por defecto.');
            languageCode = 'en'; // Por defecto inglés
        }
    }

    writeLog('Idioma mostrado: ' + languageCode);

    try {
        const filePath = path.join(__dirname, 'locales', `${languageCode}.json`);
        const raw = fs.readFileSync(filePath, 'utf8');
        translations = JSON.parse(raw);
        mainTranslations = translations["main"];
    } catch (err) {
        writeLog('Error al cargar traduccion: ', err);
    }
};

ipcMain.handle('get-translations', (event, view) => {
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
        writeLog('Error al leer el archivo JSON:' + error.message);
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
        // Datos que renderer puede conocer
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
        superUser = await db.addUser(name, gender, hashPassword);
        return {
            success: true,
            message: mainTranslations['createID-success'],
        };
    }
    // Hay errores
    catch (error) {
        writeLog('Error al crear el usuario:' + error.message);
        return {
            success: false,
            message: mainTranslations['createID-error'],
            error: error.message
        };
    }
});

async function updateID(name, gender) {
    try {
        superUser = await db.updateUser(superUser.userID, name, gender, superUser.hash);
        return {
            success: true,
            message: mainTranslations['updateID-success'],
        }
    }
    // Hay errores
    catch (error) {
        writeLog('Error al actualizar el usuario:' + error.message);
        return {
            success: false,
            message: mainTranslations['updateID-error'],
        };
    }
}

ipcMain.handle('updateID', async (event, name, gender) => {
    return await updateID(name, gender);
});

ipcMain.handle('deleteID', async (event, password) => {
    // Verificar la contraseña obtenida con la del usuario guardado.
    const passwordResult = await verifyPassword(password);
    if (passwordResult.verified) {
        try {
            const result = await db.deleteAll();
            if (result.success) {
                resetSettings();
                writeLog('Usuario eliminado. Reiniciando la aplicacion...');
                return { success: true, message: mainTranslations['deleteID-success'] };
            } else {
                return { success: false, message: mainTranslations['deleteID-error'] };
            }
        } catch (error) {
            writeLog('Error al eliminar el usuario:' + error.message);
            return { success: false, message: mainTranslations['deleteID-error'] };
        }
    } else {
        // La contraseña no es correcta
        return { success: false, message: passwordResult.message };
    }
});

// Funcion para cambiar la contraseña de cifrado de tarjetas y notas
async function changePassword(oldPassword, newPassword) {
    // Verrificar que oldPassword es correcta
    const passwordResult = await verifyPassword(oldPassword);
    if (passwordResult.verified) {
        try {
            // Obtener todas las tarjetas y notas encriptadas
            const encryptedCards = await db.getAllCards();
            const encryptedNotes = await db.getAllNotes();
            // Cambiar la contraseña de cifrado en las tarjetas y notas
            const result = await startPasswordChange(oldPassword, newPassword, encryptedCards, encryptedNotes);
            // Avisa que se estan guardando los datos
            mainWindow.webContents.send('password-change-progress', { phase: "save" });
            // Actualizar las tarjetas en la base de datos
            for (const card of result.newEncryptedCards) {
                await db.updateCard(card.id, card);
            }
            // Actualizar las notas en la base de datos
            for (const note of result.newEncryptedNotes) {
                await db.updateNote(note.id, note);
            }

            // Actualizar la contraseña del usuario
            const hashPassword = await cr.hashPassword(newPassword);
            masterKey = newPassword;
            superUser = await db.updateUser(superUser.userID, superUser.name, superUser.gender, hashPassword);
            // Limpiar la caché de elementos preparados
            preparedElements = null;
            return {
                success: true,
                message: mainTranslations['change-password-success'],
            }
        }
        catch (error) {
            writeLog('Error al cambiar la contraseña: ' + error.message);
            return {
                success: false,
                message: mainTranslations['change-password-error'],
            }
        }
    } else {
        // La contraseña antigua no es correcta
        return {
            success: false,
            message: passwordResult.message,
        }
    }
}

// Función para cambiar la contraseña de cifrado de tarjetas y notas usando un worker
function startPasswordChange(oldPassword, newPassword, encryptedCards, encryptedNotes) {
    return new Promise((resolve, reject) => {
        // Lanzamiento del worker
        writeLog('Iniciando worker para cambio de contraseña...');
        const workerPasswordChange = new Worker(path.join(__dirname, "workers", "passwordChange-worker.js"),
            { workerData: { oldPassword, newPassword, encryptedCards, encryptedNotes } });

        workerPasswordChange.on("message", (msg) => {
            if (msg.type === "progress") {
                mainWindow.webContents.send('password-change-progress', { progress: msg.progress, phase: msg.phase });
            } else if (msg.type === "done") {
                writeLog('Worker ha terminado de cambiar la contraseña en claves y notas.');
                resolve({ newEncryptedCards: msg.newEncryptedCards, newEncryptedNotes: msg.newEncryptedNotes });
                workerPasswordChange.terminate();
            }
        });
        // imprimir errores del worker
        workerPasswordChange.on("error", (error) => {
            writeLog('Error en el worker de paswordChange: ' + error.message);
            reject(error);
        });

        workerPasswordChange.on("exit", (code) => {
            if (code !== 0) reject(new Error(`El worker passwordChange se detuvo con codigo de salida: ${code}`));
        });
    });
}

ipcMain.handle('change-password', async (event, oldPassword, newPassword) => {
    return await changePassword(oldPassword, newPassword);
});

// Obtiene el primer registro de user, si es indefinido entonces no
// existe usuario. Si existe, se guarda en la variable local "superUser"
async function getUserStatus() {
    try {
        const result = await db.getUser();
        // Si no hay error pero la consulta da un valor indefinido
        // entonces no hay usuario creado.
        if (result) {
            superUser = result;
            return true;
        } else return false;
    }
    catch (error) {
        writeLog('Error al obtener el estatus del usuario:' + error.message);
        return false;
    }
}

// Verificar la contraseña obtenida con la del usuario guardado.
async function verifyPassword(password) {
    const match = await cr.verifyPassword(password, superUser.hash);
    if (match) {
        return {
            verified: true,
            message: mainTranslations['verify-password-success'],
        }
    } else return {
        verified: false,
        message: mainTranslations['verify-password-fail'],
    }
}

ipcMain.handle('verify-password', async (event, password) => {
    const result = await verifyPassword(password);

    if (result.verified) {
        masterKey = password;
        mainWindow.loadFile('src/views/home.html');
        return result;
    }
    else return result;
});

// Crear una nueva tarjeta
ipcMain.handle('create-card', async (event, newCard) => {
    try {
        // Encriptar los datos de la tarjeta
        const encryptedCard = await cr.encryptCard(masterKey, newCard);
        const result = await db.createCard(encryptedCard);
        const preparedCard = await cr.prepareCard(masterKey, result);
        // Crear la tarjeta en la caché de elementos preparados
        if (preparedElements) {
            preparedElements.cards.push(preparedCard);
        }
        return {
            success: true,
            message: mainTranslations['create-card-success'],
            data: preparedCard,
        };
    } catch (error) {
        writeLog('Error al crear la tarjeta:' + error.message);
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
        const result = await db.updateCard(id, encryptedCard);
        const preparedCard = await cr.prepareCard(masterKey, result);
        // Actualizar la tarjeta en la caché de elementos preparados
        if (preparedElements) {
            const cardIndex = preparedElements.cards.findIndex(card => card.id === id);
            if (cardIndex !== -1) {
                preparedElements.cards[cardIndex] = preparedCard;
            }
        }
        return {
            success: true,
            message: mainTranslations['update-card-success'],
            data: preparedCard,
        };
    } catch (error) {
        writeLog('Error al actualizar la tarjeta:' + error.message);
        return {
            success: false,
            message: mainTranslations['update-card-error'],
            error: error.message,
        };
    }
});

// Desencriptar una tarjeta
ipcMain.handle('decrypt-prepared-card', async (event, encryptedCard) => {
    try {
        const decryptedCard = await cr.decryptPreparedCard(masterKey, encryptedCard);
        return {
            success: true,
            message: mainTranslations['decrypt-card-success'],
            data: decryptedCard,
        };
    } catch (error) {
        writeLog('Error al desencriptar la tarjeta:' + error.message);
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
            // ELiminar la tarjeta de la caché de elementos preparados
            if (preparedElements) {
                preparedElements.cards = preparedElements.cards.filter(card => card.id !== id);
            }
            return {
                success: true,
                message: mainTranslations['delete-card-success'],
            };
        }
    } catch (error) {
        writeLog('Error al eliminar la tarjeta:' + error.message);
        return {
            success: false,
            message: mainTranslations['delete-card-error'],
            error: error.message,
        };
    }
});

// Crear una nueva nota
ipcMain.handle('create-note', async (event, newNote) => {
    try {
        // Encriptar los datos de la nota
        const encryptedNote = await cr.encryptNote(masterKey, newNote);
        const result = await db.createNote(encryptedNote);
        const preparedNote = await cr.prepareNote(masterKey, result);
        // Crear la nota en la caché de elementos preparados
        if (preparedElements) {
            preparedElements.notes.push(preparedNote);
        }
        return {
            success: true,
            message: mainTranslations['create-note-success'],
            data: preparedNote,
        };
    } catch (error) {
        writeLog('Error al crear la nota:' + error.message);
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
        const result = await db.updateNote(id, encryptedNote);
        const preparedNote = await cr.prepareNote(masterKey, result);
        // Actualizar la nota en la caché de elementos preparados
        if (preparedElements) {
            const noteIndex = preparedElements.notes.findIndex(note => note.id === id);
            if (noteIndex !== -1) {
                preparedElements.notes[noteIndex] = preparedNote;
            }
        }
        return {
            success: true,
            message: mainTranslations['update-note-success'],
            data: preparedNote,
        };
    } catch (error) {
        writeLog('Error al actualizar la nota:' + error.message);
        return {
            success: false,
            message: mainTranslations['update-note-error'],
            error: error.message,
        };
    }
});

// Desencriptar una nota preparada
ipcMain.handle('decrypt-prepared-note', async (event, encryptedNote) => {
    try {
        const decryptedNote = await cr.decryptPreparedNote(masterKey, encryptedNote);
        return {
            success: true,
            message: mainTranslations['decrypt-note-success'],
            data: decryptedNote,
        };
    } catch (error) {
        writeLog('Error al desencriptar la nota preparada:' + error.message);
        return {
            success: false,
            message: mainTranslations['decrypt-note-error'],
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
        writeLog('Error al desencriptar la nota:' + error.message);
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
            // ELiminar la nota de la caché de elementos preparados
            if (preparedElements) {
                preparedElements.notes = preparedElements.notes.filter(note => note.id !== id);
            }
            return {
                success: true,
                message: mainTranslations['delete-note-success'],
            };
        }
    } catch (error) {
        writeLog('Error al eliminar la nota:' + error.message);
        return {
            success: false,
            message: mainTranslations['delete-note-error'],
            error: error.message,
        };
    }
});

// Función para preparar elementos, calculando el número de workers necesarios.
function startPreparingElements(encryptedCards, encryptedNotes, masterKey) {
    return new Promise((resolve, reject) => {
        // Listas
        const results = [];
        let finished = 0;
        let processed = 0;

        // Cantidad de núcleos del CPU
        const totalCores = Math.max(1, os.cpus().length); // al menos 1 núcleo, máximo todos los núcleos disponibles
        // Cantidad de items por núcleo
        const totalItems = encryptedCards.length + encryptedNotes.length;
        if (totalItems === 0) {
            resolve({ cards: [], notes: [] });
            return;
        }
        const itemsPerCore = Math.ceil(totalItems / totalCores);
        const workersCount = Math.ceil(totalItems / itemsPerCore);
        writeLog(`Nucleos disponibles: ${totalCores}, Workers paralelos: ${workersCount}, Elementos por worker: ${itemsPerCore}`);

        // Dividir elementos en lotes
        const elementsChunks = chunkify(encryptedCards, encryptedNotes, workersCount);

        // Lanzamiento de workers paralelos
        elementsChunks.forEach((chunk, workerIndex) => {
            const worker = new Worker(
                path.join(__dirname, "workers/prepareElements-worker.js"),
                {
                    workerData: {
                        chunk,
                        masterKey,
                        workerIndex
                    }
                }
            );

            worker.on("message", (msg) => {
                if (msg.type === "progress") {
                    processed++;
                    const percent = Math.round((processed / totalItems) * 100);
                    mainWindow.webContents.send("prepare-elements-progress", percent);
                }

                if (msg.type === "done") {
                    results.push(...msg.results);
                    finished++;

                    worker.terminate();

                    if (finished === elementsChunks.length) {
                        // Ordenar por índice original
                        results.sort((a, b) => a.index - b.index);
                        // Separar tarjetas y notas
                        const preparedCards = results.filter(el => el.type === 'card').map(el => el.data);
                        const preparedNotes = results.filter(el => el.type === 'note').map(el => el.data);
                        resolve({ cards: preparedCards, notes: preparedNotes });
                    }
                }
            });

            // imprimir errores del worker
            worker.on("error", (error) => {
                writeLog('Error en el worker de preparar elementos:' + error.message);
                reject(error);
            });
        });
    });
}

// Funcion auxiliar para "chunkear" arrays
function chunkify(arrayCards, arrayNotes, chunks) {
    // Agregar un campo 'type' para distinguir entre tarjetas y notas
    arrayCards = arrayCards.map((item, index) => ({ index, item, type: 'card' }));
    arrayNotes = arrayNotes.map((item, index) => ({ index, item, type: 'note' }));
    // Concatenar ambos arrays
    const combinedArray = [...arrayCards, ...arrayNotes];

    const result = Array.from({ length: chunks }, () => []);
    combinedArray.forEach((item, index) => {
        result[index % chunks].push(item);
    });
    return result;
}

// Obtener todas las tarjetas y notas preparadas (desencriptar nombre y web)
ipcMain.handle('get-prepared-elements', async () => {
    try {
        if (!preparedElements) {
            const encryptedCards = await db.getAllCards();
            const encryptedNotes = await db.getAllNotes();
            // Preparar las tarjetas (desencriptar nombre y web) usando un worker
            preparedElements = await startPreparingElements(encryptedCards, encryptedNotes, masterKey);
        }
        return {
            success: true,
            preparedCards: preparedElements.cards,
            preparedNotes: preparedElements.notes
        };
    } catch (error) {
        writeLog('Error al obtener elementos preparados:' + error.message);
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
            superUser = await db.addUser(adaptedID.name, adaptedID.gender, hashPassword,);
        }
        catch (error) {
            writeLog('Error al importar el usuario:' + error.message);
            return {
                success: false,
                message: mainTranslations['import-data-error'],
                error: error.message
            };
        }

        // Adaptar datos de las tarjetas una por una, para
        // garantizar el orden original
        writeLog('Adaptando e importando tarjetas desde Sanctuary (Pascal Version)...');
        const totalCards = oldData.cards.length;
        let currentCard = 0;
        for (const oldCard of oldData.cards) {
            const adaptedCard = oldCr.adaptOldCard(key, oldCard);
            try {
                const encryptedCard = await cr.encryptCard(key, adaptedCard);
                const result = await db.createCard(encryptedCard);
                currentCard++;
                mainWindow.webContents.send('import-card-progress', { progress: Math.round((currentCard / totalCards) * 100) });
            } catch (error) {
                writeLog('Error al importar la tarjeta:' + error.message);
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

// Función para limpiar la caché de imagenes
async function clearImageCache() {
    fs.readdir(imageCachePath, (err, files) => {
        if (err) {
            writeLog('Error al leer la carpeta de caché de imágenes: ' + err.message);
            return { success: false, message: mainTranslations['image-cache-clear-error'] };
        }
        files.forEach(file => {
            const filePath = path.join(imageCachePath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    writeLog('Error al eliminar archivo de caché: ' + err.message);
                    return { success: false, message: mainTranslations['image-cache-clear-error'] };
                }
            });
        });
    });
    writeLog('Cache de imagenes limpiada.');
    return { success: true, message: mainTranslations['image-cache-cleared'] };
}

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
        case 'change-ID-gender':
            if (args.length === 1 && (args[0] === 'male' || args[0] === 'female' || args[0] === 'other')) {
                return await updateID(superUser.name, args[0]);
            } else {
                return { success: false, message: mainTranslations['command-invalid-args'] };
            }
        case 'change-ID-name':
            if (args.length === 1 && args[0].length > 3 && args[0].length <= 30) {
                return await updateID(args[0], superUser.gender);
            } else {
                return { success: false, message: mainTranslations['command-invalid-args'] };
            }
        case 'set-default-settings':
            resetSettings();
            mainWindow.reload();
            break;
        case 'set-theme':
            // Si el argumento es uno de los temas disponibles en constants
            if (args.length === 1 && constants.themes.includes(args[0])) {
                setSetting('colorStyle', args[0]);
                return { success: true, message: mainTranslations['theme-changed'] };
            } else {
                return { success: false, message: mainTranslations['command-invalid-args'] };
            }
        case 'clear-image-cache':
            return await clearImageCache();
        default:
            // Comando no reconocido
            return { success: false, message: `${cmd}: ${mainTranslations['command-not-found']}` };
    }
});

// Establecer un fondo de pantalla personalizado desde un archivo
ipcMain.handle('set-custom-wallpaper', async () => {
    // pendientes: , 'mov', 'avi', 'mkv'
    // Concatenar las extensiones soportadas en una sola lista
    const imageExtensions = constants.imageWallpapersSupported;
    const videoExtensions = constants.videoWallpapersSupported;
    const extensions = [...imageExtensions, ...videoExtensions];

    // Mostrar un cuadro de diálogo para seleccionar el archivo de imagen o video
    const { canceled, filePaths } = await dialog.showOpenDialog({
        tittle: mainTranslations['wallpaper-dialog-title'],
        filters: [
            { name: 'Images and Videos', extensions: extensions }],
        properties: ['openFile']
    });
    // Si se cancela la selección o no se selecciona ningún archivo, salir
    if (canceled || filePaths.length === 0) {
        return {
            success: false,
            error: mainTranslations['wallpaper-dialog-cancelled']
        };
    }
    // Verificar que el archivo seleccionado sea válido
    const filePath = filePaths[0];
    try {
        const fileStat = await fs.promises.stat(filePath);
        if (!fileStat.isFile()) {
            return {
                success: false,
                error: mainTranslations['wallpaper-dialog-invalid']
            };
        }

        // Establecer el valor como la ruta del archivo personalizado
        setSetting('customWallpaperPath', filePath);
        // Guardar el nombre base del archivo
        const fileBaseName = path.parse(filePath).name;
        setSetting('customWallpaperName', fileBaseName);

        // Obtener la extensión del archivo
        const fileExtension = path.extname(filePath).toLowerCase().slice(1); // Quitar el punto inicial
        if (imageExtensions.includes(fileExtension)) {
            setSetting('customWallpaperType', 'image');
        } else if (videoExtensions.includes(fileExtension)) {
            setSetting('customWallpaperType', 'video');
        }

        // Guardar el tipo de wallpaper como 'custom'
        setSetting('wallpaper', 'custom');

        // Regenerar colores
        await genColors();

        return {
            success: true,
            message: mainTranslations['wallpaper-dialog-success']
        };

    } catch (error) {
        writeLog('Error al leer el wallpaper personalizado:' + error.message);
        // Reestablecer las configuraciones relacionadas al wallpaper personalizado
        setSetting('customWallpaperPath', '');
        setSetting('customWallpaperName', '');
        setSetting('customWallpaperType', '');
        setSetting('wallpaper', '');
        return {
            success: false,
            error: mainTranslations['wallpaper-dialog-error']
        };
    }
});

// Solicitar licencia
ipcMain.handle('get-license', (event) => {
    const licensePath = path.join(__dirname, 'assets', 'LICENSE');
    if (fs.existsSync(licensePath)) {
        const licenseText = fs.readFileSync(licensePath, 'utf-8');
        return licenseText;
    } else {
        writeLog('Error al obtener la licencia: LICENSE no existe.');
        return null;
    }
});

// Obtener el archivo de log de la aplicacion
ipcMain.handle('get-log', () => {
    try {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        return logContent;
    } catch (error) {
        writeLog('Error al leer el archivo de log: ' + error.message);
        return null;
    }
});

// Cachar errores silenciosos
process.on('unhandledRejection', err => {
    writeLog('UnhandledPromiseRejection:', err)
})

process.on('uncaughtException', err => {
    writeLog('UncaughtException:', err)
})

// Funcion que genera un archivo log con informacion de debug
function writeLog(info) {
    const timeStamp = new Date().toISOString();
    const logMessage = `[${timeStamp}] ${info}\n`;
    fs.appendFileSync(logPath, logMessage);

    if (showDevTools) console.log(`(log) >> ${info}`);
}