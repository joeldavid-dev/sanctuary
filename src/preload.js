const { contextBridge, ipcRenderer } = require('electron');

// Expone manejo de ventana
contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),

    // Para abrir links en el navegador externo en cualquier parte de la aplicación.
    openExternal: (url) => ipcRenderer.send('open-external-link', url),
})

contextBridge.exposeInMainWorld('electronAPI', {
    // Expone el cambio de vista
    changeView: (newView) => ipcRenderer.send('change-view', newView),
    // Dialogos
    showWarning: (title, message) => ipcRenderer.invoke('show-warning', title, message),
    // Exponer las funciones de manejo de datos
    createID: (name, password, gender) => ipcRenderer.invoke('createID', name, password, gender),
    getUserStatus: () => ipcRenderer.invoke('get-user-status'),
});

// Exponer a los renderizadores las funciones de encriptar y desencriptar.
contextBridge.exposeInMainWorld('cryptoAPI', {
    encrypt: (text, password) => ipcRenderer.invoke('encrypt-data', text, password),
    decrypt: (encryptedData, password, salt, iv) => ipcRenderer.invoke('decrypt-data', encryptedData, password, salt, iv),
});