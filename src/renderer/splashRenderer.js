document.addEventListener('DOMContentLoaded', async () => {
    (async () => {
        const status = await window.electronAPI.getUserStatus();
        let ruta = status ? 'src/views/lock.html' : 'src/views/id.html';

        setTimeout(() => {
            window.electronAPI.changeView(ruta);
        }, 3000);
    })();
});