document.addEventListener("DOMContentLoaded", () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');

    const lock = document.getElementById('lock');
    
    const newPass = document.getElementById('new-pass');

    const modalNew = document.getElementById('modal-new');
    const closeModalNew = document.getElementById('close-modal-new');

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

    // Clic en botón bloquear
    lock.addEventListener('click', () => {
        window.electronAPI.changeView('src/views/lock.html');
    });

    // Clic en el botón para abrir el modal de acerca de
    newPass.addEventListener('click', async () => {
        // Abrir modal
        modalNew.style.display = 'block';
    });

    // Clic en el botón para cerrar el modal de acerca de
    closeModalNew.addEventListener('click', () => {
        modalNew.style.display = 'none';
    });
});