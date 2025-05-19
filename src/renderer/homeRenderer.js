document.addEventListener("DOMContentLoaded", async () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');

    const lock = document.getElementById('lock');

    const cardsContainer = document.getElementById('cards-container');

    const editCardBody = document.getElementById('edit-card-body');
    const newCard = document.getElementById('new-card');
    const deleteCardBody = document.getElementById('delete-card-body');
    const deleteCard = document.getElementById('delete-card');

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
    const namePreview = document.getElementById('name-preview');
    const userPreviewSection = document.getElementById('user-preview-section');
    const userPreview = document.getElementById('user-preview');
    const passPreview = document.getElementById('pass-preview');
    const urlPreviewSection = document.getElementById('url-preview-section');
    const urlPreview = document.getElementById('url-preview');
    const openLinkPreview = document.getElementById('open-link-preview');
    const newCardDone = document.getElementById('new-card-done');

    // Modal warning
    const modalWarning = document.getElementById('modal-warning');
    const closeModalWarning = document.getElementById('close-modal-warning');
    const warningMessage = document.getElementById('warning-message');
    const cancelWarningBtn = document.getElementById('cancel-warning-btn');
    const confirmWarningBtn = document.getElementById('confirm-warning-btn');

    let colorSelected = 'var(--color1)';
    let newFavorite = 0;
    let selectedCard = null; // Variable para almacenar el ID de la tarjeta seleccionada
    let modalWarningAction = null; // Variable para almacenar la acción del modal de advertencia
    let cards = null; // Variable para almacenar las tarjetas


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

    // Funciones del contenedor principal ====================================================
    // Traer los datos al iniciar la vista
    async function getAllCards() {
        try {
            return await window.electronAPI.getAllCards();
        } catch (error) {
            console.error('Error al obtener las tarjetas:', error);
        }
    }

    function createCardElement(card, index) {
        const cardBody = document.createElement('label');
        cardBody.classList.add('card-body'); // clase para estilos
        cardBody.setAttribute('id', card.id); // id para el elemento
        cardBody.setAttribute('data-name', card.name);
        cardBody.style.backgroundColor = card.color; // Cambia el color de fondo de la tarjeta
        cardBody.style.boxShadow = '0px 0px 10px 0px' + card.color; // Cambia la sombra de la tarjeta
        if (card.color == 'var(--color4)' || card.color == 'var(--color6)') {
            cardBody.style.color = 'black'; // Cambia el color del texto
        }

        heartVisible = (card.favorite == 1) ? 'visible' : 'invisible'; // Cambia la visibilidad del icono de favorito
        userVisible = (card.user == null || card.user == '') ? 'invisible' : 'visible'; // Cambia la visibilidad del usuario
        urlVisible = (card.web == null || card.web == '') ? 'invisible' : 'visible'; // Cambia la visibilidad de la url

        // Crea el contenido de la tarjeta
        cardHTML = `
            <input type="radio" name="card" value="${card.id}">
            <div class="horizontal_elem-area spaced centered">
                <p class="normal-text">${card.name}</p>
                <div class="${heartVisible}">
                    <div class="card-static-icon">
                        <img src="../assets/ico/feather/heart.svg" class="card-icon">
                    </div>
                </div>
            </div>

            <div class="${userVisible}">
                <strong class="minimum-text">Usuario:</strong>
                <p id="user-${card.id}" class="small-text">••••••••</p>
            </div>
            
            <div>
                <strong class="minimum-text">Contraseña:</strong>
                <p id="pass-${card.id}" class="small-text">••••••••</p>
            </div>

            <div class="${urlVisible}">
                <strong class="minimum-text">URL:</strong>
                <p class="small-text">${card.web}</p>
            </div>

            <div class="horizontal-flex spaced centered">
                <button class="external-link-btn card-btn ${urlVisible}" data-url="${card.web}"">
                    <img src="../assets/ico/feather/external-link.svg" class="card-icon">
                    </button>

                <strong class="minimum-text">${index + 1}</strong>

                <button class="eye-btn card-btn" data-user="${card.user}" data-userId="user-${card.id}" data-pass="${card.password}" data-passId="pass-${card.id}">
                    <img src="../assets/ico/feather/eye.svg" class="card-icon">
                </button>
            </div>
        `;
        cardBody.innerHTML = cardHTML;
        return cardBody;
    }

    async function showCards(cards) {
        // Limpiar el contenedor de tarjetas antes de agregar nuevas
        cardsContainer.innerHTML = '';
        if (cards.success) {
            cards.data.forEach((card, index) => {
                cardsContainer.appendChild(createCardElement(card, index));
            });

            // Evento de clic a cada tarjeta
            document.querySelectorAll('input[name="card"]').forEach((radio) => {
                radio.addEventListener('change', (event) => {
                    deselectAllCards(); // Deseleccionar todas las tarjetas

                    // Luego agregar la clase 'selected-card' a la tarjeta seleccionada
                    const selectedCardId = event.target.value;
                    const cardBody = document.getElementById(selectedCardId);
                    selectedCard = {
                        id: cardBody.getAttribute('id'),
                        name: cardBody.getAttribute('data-name'),
                    }
                    console.log(selectedCard);

                    // Establecer el color personalizado como una variable CSS
                    const cardColor = cardBody.style.backgroundColor;
                    cardBody.style.setProperty('--card-color', cardColor);

                    // Agregar la clase para aplicar la sombra
                    cardBody.classList.add('selected-card');

                    showEditDeleteButtons(); // Mostrar los botones de editar y eliminar
                });
            });

            // Activar botones de ver/ocultar
            document.querySelectorAll('.eye-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const user = button.getAttribute('data-user');
                    const userId = button.getAttribute('data-userId');
                    const userView = document.getElementById(userId);

                    const pass = button.getAttribute('data-pass');
                    const passId = button.getAttribute('data-passId');
                    const passView = document.getElementById(passId);

                    const mask = '••••••••';

                    // Cambiar el texto del usuario y la contraseña al hacer clic en el botón
                    if (userView.textContent === mask) {
                        userView.textContent = user;
                    } else {
                        userView.textContent = mask;
                    }

                    if (passView.textContent === mask) {
                        passView.textContent = pass;
                        // 🔥 Copiamos al portapapeles
                        navigator.clipboard.writeText(pass)
                            .then(() => {
                                // Mostrar una notificación visual
                                //window.electronAPI.showNotification('Contraseña copiada', 'La contraseña ha sido copiada al portapapeles.');
                                showToast('Contraseña copiada al portapapeles'); // Mostrar el toast
                            })
                            .catch(err => {
                                console.error('Error al copiar', err);
                            });
                    } else {
                        passView.textContent = mask;
                    }
                });
            });

            // Activar botones de abrir enlace externo
            document.querySelectorAll('.external-link-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const url = button.getAttribute('data-url');
                    if (url) {
                        window.electron.openExternal(url);
                    }
                });
            });

        } else {
            cardsContainer.textContent = 'No se pudieron cargar las tarjetas 😕';
        }
    }

    // Funcion para deseleccionar todas las tarjetas
    function deselectAllCards() {
        /// Quitar la clase 'selected-card' de todas las tarjetas
        document.querySelectorAll('.card-body').forEach((card) => {
            card.classList.remove('selected-card');
            editCardBody.classList.remove('vertical-flex'); // Ocultar el contenedor de edición
            editCardBody.classList.add('invisible'); // Ocultar el contenedor de edición
            deleteCardBody.classList.remove('vertical-flex'); // Ocultar el botón de eliminar
            deleteCardBody.classList.add('invisible'); // Ocultar el botón de eliminar
        });
    }

    function showEditDeleteButtons() {
        editCardBody.classList.remove('invisible'); // Mostrar el contenedor de edición
        editCardBody.classList.add('vertical-flex'); // Mostrar el contenedor de edición
        deleteCardBody.classList.remove('invisible'); // Mostrar el botón de eliminar
        deleteCardBody.classList.add('vertical-flex'); // Mostrar el botón de eliminar
    }

    // Funciones de los botones del sidebar ==================================================
    // Clic en botón bloquear
    lock.addEventListener('click', () => {
        window.electronAPI.changeView('src/views/lock.html');
    });

    //Funciones de los botones de la butonbar ================================================
    // Clic en el botón para abrir el modal de nueva contraseña
    newCard.addEventListener('click', async () => {
        // Abrir modal
        modalNew.style.display = 'block';
        // Reiniciar el estado del modal
        icoLove.style.display = 'none';
        newFavoriteSwitch.checked = false;
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

    // Clic en el botón para eliminar la tarjeta seleccionada
    deleteCard.addEventListener('click', async () => {
        modalWarning.style.display = 'block';
        modalWarningAction = 'delete'; // Establecer la acción del modal de advertencia
        const message =
            warningMessage.textContent = `¿Realmente quieres eliminar la tarjeta "${selectedCard.name}"? Ten cuidado, ¡esta acción es irreversible!`;
        confirmWarningBtn.textContent = 'Eliminar tarjeta';
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

        // Verificar que los campos no estén vacíos
        if (name && password) {
            // Enviar la tarjeta al proceso principal
            const result = await window.electronAPI.createCard({
                name: name,
                user: user,
                password: password,
                web: web,
                color: colorSelected,
                favorite: newFavorite,
            });
            console.log(result);
            // Cerrar modal
            if (result.success) {
                modalNew.style.display = 'none';
                showAllCard(); // Actualizar la vista de tarjetas
            }
        } else {
            window.electronAPI.showWarning('Problema', 'Es necesario al menos un nombre y una contraseña para continuar.');
        }
    });

    // Modal warning =============================================================================
    // Clic en el botón para cerrar el modal de advertencia
    closeModalWarning.addEventListener('click', () => {
        modalWarning.style.display = 'none';
    });

    // Clic en el botón para cancelar la advertencia
    cancelWarningBtn.addEventListener('click', () => {
        modalWarning.style.display = 'none';
    });

    // Clic en el botón para confirmar la advertencia
    confirmWarningBtn.addEventListener('click', async () => {
        // Eliminar la tarjeta seleccionada
        if (modalWarningAction === 'delete') {
            const result = await window.electronAPI.deleteCard(selectedCard.id);
            console.log(result);
            if (result.success) {
                modalWarning.style.display = 'none';
                //showAllCard(); // Actualizar la vista de tarjetas

            }
        }
    });

    // Función del toast notification ============================================================
    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.textContent = message;

        container.appendChild(toast);

        // Eliminarlo después de que desaparezca
        setTimeout(() => {
            toast.remove();
        }, 5000); // 5 segundos de duración total
    }

    // Acciones iniciales ========================================================================
    cards = await getAllCards(); // Obtener todas las tarjetas y almacenarlas en la variable local
    showCards(cards); // Mostrar las tarjetas en la vista
});
