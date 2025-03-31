document.addEventListener('DOMContentLoaded', async () => {
    (async () => {
        try {
            const hasRecords = await window.electronAPI.isIdCreated();
            console.log("¿Existen registros?:", hasRecords); // Depuración

            let ruta = hasRecords ? 'src/views/block.html' : 'src/views/id.html';
            console.log("Ruta seleccionada:", ruta); // Depuración

            setTimeout(() => {
                window.electronAPI.changeView(ruta);
            }, 3000);
        } catch (error) {
            console.error("Error al obtener el estado de la base de datos:", error);
        }
    })();
});