document.addEventListener('DOMContentLoaded', async () => {
    (async () => {
        try {
            const status = await window.electronAPI.getUserStatus();
            console.log("Datos obtenidos:", status); // Depuración

            let ruta = status ? 'src/views/block.html' : 'src/views/id.html';
            console.log("Ruta seleccionada:", ruta); // Depuración

            setTimeout(() => {
                window.electronAPI.changeView(ruta);
            }, 3000);
        } catch (error) {
            console.error("Error al obtener el estado de la base de datos:", error);
        }
    })();
});