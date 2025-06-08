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
    // Obtener traducciones
    getTranslations: (view) => ipcRenderer.invoke('get-translations', view),
    // Expone el cambio de vista
    changeView: (newView) => ipcRenderer.send('change-view', newView),
    // Dialogos
    showWarning: (title, message) => ipcRenderer.invoke('show-warning', title, message),
    // Notificaciones
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    // Obtener archivo JSON
    getJSONFile: () => ipcRenderer.invoke('get-json-file'),
    // Exponer las funciones de manejo de datos
    createID: (name, password, gender) => ipcRenderer.invoke('createID', name, password, gender),
    getUserStatus: () => ipcRenderer.invoke('get-user-status'),
    getUserInfo: () => ipcRenderer.invoke('get-user-info'),
    verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
    createCard: (newCard) => ipcRenderer.invoke('create-card', newCard),
    updateCard: (id, updatedCard) => ipcRenderer.invoke('update-card', id, updatedCard),
    decryptCard: (encryptedCard) => ipcRenderer.invoke('decrypt-card', encryptedCard),
    deleteCard: (id) => ipcRenderer.invoke('delete-card', id),
    getAllCards: () => ipcRenderer.invoke('get-all-cards'),
    importData: (key) => ipcRenderer.invoke('import-data', key),
});