const { contextBridge, ipcRenderer } = require('electron');

// Para abrir links en el navegador externo en cualquier parte de la aplicación.
contextBridge.exposeInMainWorld('electron', {
    openExternal: (url) => ipcRenderer.send('open-external-link', url)
});

// Exponer a los renderizadores las funciones de encriptar y desencriptar.
contextBridge.exposeInMainWorld('cryptoAPI', {
    encrypt: (text, password) => ipcRenderer.invoke('encrypt-data', text, password),
    decrypt: (encryptedData, password, salt, iv) => ipcRenderer.invoke('decrypt-data', encryptedData, password, salt, iv),
})