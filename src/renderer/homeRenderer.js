document.addEventListener("DOMContentLoaded", () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');

    const lock = document.getElementById('lock');

    const newCard = document.getElementById('new-card');

    // Modal para agregar nueva contraseña
    const modalNew = document.getElementById('modal-new');
    const closeModalNew = document.getElementById('close-modal-new');
    const newCardName = document.getElementById('new-card-name');
    const newCardUser = document.getElementById('new-card-user');
    const newCardPass = document.getElementById('new-card-pass');
    const newCardUrl = document.getElementById('new-card-url');
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
    const newCardDone = document.getElementById('new-card-done');

    let colorSelected = 'var(--color1)';
    let newFavorite = 0;

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
    newCard.addEventListener('click', async () => {
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
        newCardName.value = '';
        newCardUser.value = '';
        newCardPass.value = '';
        newCardUrl.value = '';
    });

    // Modal para agregar nueva contraseña ===================================================
    // Clic en el botón para cerrar el modal
    closeModalNew.addEventListener('click', () => {
        modalNew.style.display = 'none';
    });

    // Al escribir en los inputs de nueva tarjeta
    newCardName.addEventListener('input', () => {
        if (newCardName.value.length > 0) {
            namePreview.textContent = newCardName.value;
        } else {
            namePreview.textContent = 'Nueva contraseña';
        }
    });

    newCardUser.addEventListener('input', () => {
        if (newCardUser.value.length > 0) {
            userPreviewSection.style.display = 'block';
            userPreview.textContent = newCardUser.value;
        } else {
            userPreviewSection.style.display = 'none';
        }
    });

    newCardPass.addEventListener('input', () => {
        passPreview.textContent = newCardPass.value;
    });

    newCardUrl.addEventListener('input', () => {
        if (newCardUrl.value.length > 0) {
            urlPreviewSection.style.display = 'block';
            openLinkPreview.style.display = 'block';
            urlPreview.textContent = newCardUrl.value;
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
            newFavorite = 1;
        } else {
            icoLove.style.display = 'none';
            newFavorite = 0;
        }
    });

    // Al presionar el botón "listo" del modal para agregar una nueva tarjeta
    newCardDone.addEventListener('click', async () => {
        // Refinar datos
        const name = newCardName.value.trim();
        const user = newCardUser.value.trim();
        const password = newCardPass.value.trim();
        const web = newCardUrl.value.trim();

        console.log('datos', name, user, password, web, colorSelected, newFavorite);

        // Verificar que los campos no estén vacíos
        if (name && password) {
            // Crear la tarjeta
            const result = await window.electronAPI.createCard(name, user, password, web, colorSelected, newFavorite);
            console.log(result);
            // Cerrar modal
            if (result.success) {
                modalNew.style.display = 'none';
            }
        } else {
            window.electronAPI.showWarning('Problema', 'Es necesario al menos un nombre y una contraseña para continuar.');
        }
    });
});