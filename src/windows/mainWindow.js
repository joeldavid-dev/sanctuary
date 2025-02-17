const { BrowserWindow } = require('electron')
const path = require('path')

const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 550,
        minHeight: 450,
        autoHideMenuBar: true,
        webPreferences: {
            // La cadena __dirname apunta a la ruta del script
            // actualmente en ejecución
            preload: path.join(__dirname, '../preload.js')
            // La API path.join une varios segmentos de rutas,
            // creando una cadena de ruto combinada
        }
    });
    // Desactivar en producción
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile('src/views/bloqueo.html')
    return mainWindow
};

module.exports = { createMainWindow };