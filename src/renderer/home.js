document.addEventListener("DOMContentLoaded", () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');

    const lock = document.getElementById('lock');

    const newPass = document.getElementById('new-pass');

    // Modal para agregar nueva contraseña
    const modalNew = document.getElementById('modal-new');
    const closeModalNew = document.getElementById('close-modal-new');
    const newPassName = document.getElementById('new-pass-name');
    const newPassuser = document.getElementById('new-pass-user');
    const newPassPass = document.getElementById('new-pass-pass');
    const newPassUrl = document.getElementById('new-pass-url');
    const newFavoriteSwitch = document.getElementById('new-favorite-switch');

    const prewiewCard = document.getElementById('preview-card');
    const icoLove = document.getElementById('ico-love');
    const icoEye = document.getElementById('ico-eye');
    const namePreview = document.getElementById('name-preview');
    const userPreviewSection = document.getElementById('user-preview-section');
    const userPreview = document.getElementById('user-preview');
    const passPreview = document.getElementById('pass-preview');
    const urlPreviewSection = document.getElementById('url-preview-section');
    const urlPreview = document.getElementById('url-preview');
    const openLinkPreview = document.getElementById('open-link-preview');

    let colorSelected;

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

    // Clic en el botón para abrir el modal de nueva contraseña
    newPass.addEventListener('click', async () => {
        // Abrir modal
        modalNew.style.display = 'block';
        // Reiniciar el estado del modal
        icoLove.style.display = 'none';
        userPreviewSection.style.display = 'none';
        urlPreviewSection.style.display = 'none';
        prewiewCard.style.backgroundColor = 'var(--color1)';
        prewiewCard.style.color = 'white';
        namePreview.textContent = 'Nueva contraseña';
        passPreview.textContent = '';
        openLinkPreview.style.display = 'none';
        colorSelected = 'var(--color1)';
        document.querySelector('input[name="color"][value="var(--color1)"]').checked = true;
        newFavoriteSwitch.checked = false;
        newPassName.value = '';
        newPassuser.value = '';
        newPassPass.value = '';
        newPassUrl.value = '';
    });

    // Modal para agregar nueva contraseña ==============================
    // Clic en el botón para cerrar el modal
    closeModalNew.addEventListener('click', () => {
        modalNew.style.display = 'none';
    });

    // Al escribir en los inputs de nueva contraseña
    newPassName.addEventListener('input', () => {
        if (newPassName.value.length > 0) {
            namePreview.textContent = newPassName.value;
        } else {
            namePreview.textContent = 'Nueva contraseña';
        }
    });

    newPassuser.addEventListener('input', () => {
        if (newPassuser.value.length > 0) {
            userPreviewSection.style.display = 'block';
            userPreview.textContent = newPassuser.value;
        } else {
            userPreviewSection.style.display = 'none';
        }
    });

    newPassPass.addEventListener('input', () => {
        passPreview.textContent = newPassPass.value;
    });

    newPassUrl.addEventListener('input', () => {
        if (newPassUrl.value.length > 0) {
            urlPreviewSection.style.display = 'block';
            openLinkPreview.style.display = 'block';
            urlPreview.textContent = newPassUrl.value;
        } else {
            urlPreviewSection.style.display = 'none';
            openLinkPreview.style.display = 'none';
        }
    });

    // Al presionar un color
    document.querySelectorAll('input[name="color"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            colorSelected = event.target.value;
            // Cambiar color de la vista previa
            prewiewCard.style.backgroundColor = colorSelected;
            if (colorSelected == 'var(--color4)' || colorSelected == 'var(--color6)') {
                prewiewCard.style.color = 'black';
                icoLove.style.filter = 'invert(0)';
            } else {
                prewiewCard.style.color = 'white';
                icoLove.style.filter = 'invert(1)';
            }
        });
    });

    // Al presionar el toggle swith de favorito
    newFavoriteSwitch.addEventListener('change', (event) => {
        if (event.target.checked) {
            icoLove.style.display = 'block';
        } else {
            icoLove.style.display = 'none';
        }
    });
});