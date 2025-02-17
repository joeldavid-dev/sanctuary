const { app, BrowserWindow } = require('electron')
const { createMainWindow } = require('./windows/mainWindow')

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
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

