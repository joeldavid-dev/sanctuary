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
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
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
    updateID: (name, gender) => ipcRenderer.invoke('updateID', name, gender),
    deleteID: (password) => ipcRenderer.invoke('deleteID', password),
    changePassword: (oldPassword, newPassword) => ipcRenderer.invoke('change-password', oldPassword, newPassword),
    getUserInfo: () => ipcRenderer.invoke('get-user-info'),
    verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
    createCard: (newCard) => ipcRenderer.invoke('create-card', newCard),
    updateCard: (id, updatedCard) => ipcRenderer.invoke('update-card', id, updatedCard),
    decryptPreparedCard: (encryptedCard) => ipcRenderer.invoke('decrypt-prepared-card', encryptedCard),
    deleteCard: (id) => ipcRenderer.invoke('delete-card', id),
    createNote: (newNote) => ipcRenderer.invoke('create-note', newNote),
    updateNote: (id, updatedNote) => ipcRenderer.invoke('update-note', id, updatedNote),
    decryptPreparedNote: (encryptedNote) => ipcRenderer.invoke('decrypt-prepared-note', encryptedNote),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id),
    getPreparedElements: () => ipcRenderer.invoke('get-prepared-elements'),
    importData: (key) => ipcRenderer.invoke('import-data', key),
    // Paths
    getPaths: (key) => ipcRenderer.invoke('get-paths', key),
    // Exponer las funciones de configuración
    getSetting: (key) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    getConstants: () => ipcRenderer.invoke('get-constants'),
    getTranslations: (view) => ipcRenderer.invoke('get-translations', view),
    executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
    setCustomWallpaper: () => ipcRenderer.invoke('set-custom-wallpaper'),
    getLicense: () => ipcRenderer.invoke('get-license'),
    getLog: () => ipcRenderer.invoke('get-log'),
});