let count = 5;

document.addEventListener("DOMContentLoaded", async () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');
    const modalAbout = document.getElementById('modal-about');
    const aboutBody = document.getElementById('about-body');
    const openModal = document.getElementById('open-about');
    const closeModal = document.getElementById('close-about');
    const greeting = document.getElementById('greeting');
    const passLabel = document.getElementById('pass-label');
    const inputPassword = document.getElementById('password');

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

    // Acciones al inicio de la pantalla
    greeting.textContent = await window.electronAPI.getGreeting();

    // Enter en el input de contraseña
    inputPassword.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            if (inputPassword.value != '') {
                const response = await window.electronAPI.verifyPassword(inputPassword.value);
                console.log(response);

                if (!response.verified) {
                    count--;
                    passLabel.textContent = 'Contraseña incorrecta, te quedan ' + count.toString() + ' intentos';
                    inputPassword.value = '';
                    if (count == 0) {
                        inputPassword.disabled = true;
                    }
                }
            }
        }
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