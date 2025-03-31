setTimeout(() => {
    if (window.electronAPI.isIdCreated() == true) {
        window.electronAPI.changeView('src/views/bloqueo.html'); 
    } else {
        window.electronAPI.changeView('src/views/id.html');
    }
}, 3000); // Espera 3 segundos y cambia de vista