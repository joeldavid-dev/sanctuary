document.addEventListener("DOMContentLoaded", () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');
    const modalAbout = document.getElementById('modal-about');
    const aboutBody = document.getElementById('about-body');
    const openModal = document.getElementById('open-about');
    const closeModal = document.getElementById('close-about');

    // Clic en botón minimizar
    minimize.addEventListener('click', () => {
        window.electron.minimize();
    });
    // Clic en botón maximizar
    maximize.addEventListener('click', () => {
        window.electron.maximize();
    });
    // Clic en botón cerrar
    close.addEventListener('click', () => {
        window.electron.close();
    });

    // Clic en el botón para abrir el modal de acerca de
    openModal.addEventListener('click', async () => {
        // Abrir modal
        modalAbout.style.display = 'block';
        // Cargar contenido externo con fetch()
        try {
            const response = await fetch('about.html');
            const html = await response.text();
            aboutBody.innerHTML = html;
        } catch (error) {
            aboutBody.innerHTML = '<p>Error al cargar el contenido.</p>';
        }
        //window.electron.openExternal('https://colebemis.com/');
    });

    // Clic en el botón para cerrar el modal de acerca de
    closeModal.addEventListener('click', () => {
        modalAbout.style.display = 'none';
    });
});