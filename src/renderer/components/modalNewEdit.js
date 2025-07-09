/* Este modulo se encarga del manejo del modal de crear o editar una tarjeta.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

export function showNewEditModal(mode, card) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        let colorSelected = 'var(--color1)';
        let favoriteValue = false;
        const translations = await window.electronAPI.getTranslations('new-edit');
        const cardTranslations = await window.electronAPI.getTranslations('card');
        const warningTranslations = await window.electronAPI.getTranslations('warning');
        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations, cardTranslations);
        // Elementos HTML insertados en el esqueleto
        // Inputs
        const nameInput = document.getElementById('name-input');
        const userInput = document.getElementById('user-input');
        const passInput = document.getElementById('pass-input');
        const urlInput = document.getElementById('url-input');
        const favoriteSwitch = document.getElementById('favorite-switch');
        const colorsSection = document.getElementById('colors-section');
        const newEditDone = document.getElementById('new-edit-done');
        // Vista previa
        const previewCard = document.getElementById('preview-card');
        const namePreview = document.getElementById('name-preview');
        const userPreviewSection = document.getElementById('user-preview-section');
        const userPreview = document.getElementById('user-preview');
        const passPreview = document.getElementById('pass-preview');
        const urlPreviewSection = document.getElementById('url-preview-section');
        const urlPreview = document.getElementById('url-preview');
        const openLinkPreview = document.getElementById('open-link-preview');
        const icoLove = document.getElementById('ico-love');

        // Establecer valores dependiendo del modo
        if (mode === 'create') {
            modalTitle.textContent = translations['title-new'];
            colorSelected = 'var(--color1)';
            favoriteValue = false;
            userPreviewSection.style.display = 'none';
            urlPreviewSection.style.display = 'none';
            icoLove.style.display = 'none';
            openLinkPreview.style.display = 'none';
        }
        else if (mode === 'edit') {
            modalTitle.textContent = translations['title-edit'];
            // Actualizar los campos del formulario
            nameInput.value = card.name;
            userInput.value = card.user || '';
            passInput.value = card.password;
            urlInput.value = card.web || '';
            // Actualizar las variables de valores
            favoriteValue = card.favorite;
            colorSelected = card.color;
            // Actualizar la vista previa
            namePreview.textContent = card.name;
            (card.user) ? userPreview.textContent = card.user : userPreviewSection.style.display = 'none';
            passPreview.textContent = card.password;
            if (card.web) {
                urlPreview.textContent = card.web;
            } else {
                urlPreviewSection.style.display = 'none';
                openLinkPreview.style.display = 'none';
            }
            // Marcar el color seleccionado
            document.querySelector(`input[name="color"][value="${colorSelected}"]`).checked = true;
            // Marcar el switch de favorito si es necesario
            favoriteSwitch.querySelector('input').checked = card.favorite || false;
            icoLove.style.display = favoriteSwitch.querySelector('input').checked ? 'block' : 'none';
            // Cambiar el color de la tarjeta en la vista previa
            previewCard.style.backgroundColor = card.color;
            // Cambiar el color del texto dependiendo del color de la tarjeta para mantener la legibilidad
            (card.color === 'var(--color4)' || card.color === 'var(--color6)') ? previewCard.style.color = 'black' : previewCard.style.color = 'white';
        }

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve({ success: false, })
        }
        const nameAction = () => {
            (nameInput.value.length > 0) ? namePreview.textContent = nameInput.value.trim() : namePreview.textContent = cardTranslations['new-card'];
        }
        const userAction = () => {
            if (userInput.value.length > 0) {
                userPreviewSection.style.display = 'block';
                userPreview.textContent = userInput.value.trim();
            }
            else userPreviewSection.style.display = 'none';
        }
        const passAction = () => {
            passPreview.textContent = passInput.value.trim();
        }
        const urlAction = () => {
            if (urlInput.value.length > 0) {
                urlPreview.textContent = urlInput.value.trim();
                urlPreviewSection.style.display = 'block';
                openLinkPreview.style.display = 'block';
            }
            else {
                urlPreviewSection.style.display = 'none';
                openLinkPreview.style.display = 'none';
            }
        }
        const favoriteAction = (event) => {
            if (event.target.checked) {
                icoLove.style.display = 'block';
                favoriteValue = true;
            } else {
                icoLove.style.display = 'none';
                favoriteValue = false;
            }
        }
        const colorsAction = (event) => {
            colorSelected = event.target.value;
            // Cambiar color de la vista previa
            previewCard.style.backgroundColor = colorSelected;
            if (colorSelected === 'var(--color4)' || colorSelected === 'var(--color6)') {
                previewCard.style.color = 'black'; // Cambiar el color del texto
            } else {
                previewCard.style.color = 'white'; // Cambiar el color del texto
            }
        }
        const doneAction = async () => {
            // Obtener datos
            const name = nameInput.value.trim();
            const user = userInput.value.trim();
            const password = passInput.value.trim();
            const web = urlInput.value.trim();

            const newEditCard = {
                name: name,
                user: user,
                password: password,
                web: web,
                color: colorSelected,
                favorite: favoriteValue
            }
            // Verificar que los campos no estén vacíos
            if (name && password) {
                if (mode === 'create') {
                    // Crear nueva tarjeta
                    const result = await window.electronAPI.createCard(newEditCard);
                    if (result.success) {
                        cleanup();
                        resolve({
                            success: true,
                            generatedCard: result.data,
                            message: result.message,
                        });
                    }
                    else {
                        cleanup();
                        reject({
                            success: false,
                            message: result.message,
                        });
                    }
                }
                else if (mode === 'edit') {
                    // Editar tarjeta existente
                    const result = await window.electronAPI.updateCard(card.id, newEditCard);
                    // Cerrar modal
                    if (result.success) {
                        cleanup();
                        resolve({
                            success: true,
                            editedCard: result.data,
                            message: result.message
                        });
                    }
                    else {
                        cleanup();
                        reject({
                            success: false,
                            message: result.message,
                        });
                    }
                }
            } else {
                window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['name-password-required']);
            }
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);
        nameInput.addEventListener('input', nameAction);
        userInput.addEventListener('input', userAction);
        passInput.addEventListener('input', passAction);
        urlInput.addEventListener('input', urlAction);
        favoriteSwitch.addEventListener('change', favoriteAction);
        colorsSection.addEventListener('change', colorsAction);
        newEditDone.addEventListener('click', doneAction);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            nameInput.removeEventListener('input', nameAction);
            userInput.removeEventListener('input', userAction);
            passInput.removeEventListener('input', passAction);
            urlInput.removeEventListener('input', urlAction);
            favoriteSwitch.removeEventListener('change', favoriteAction);
            colorsSection.removeEventListener('change', colorsAction);
            newEditDone.removeEventListener('click', doneAction);

            modal.style.display = 'none';
        }
    });
}

function getModalHTML(translations, cardTranslations) {
    return `
        <div class="horizontal-flex normal-margin">
            <div class="vertical-elem-area normal-padding normal-rounded div-options">
                <label>${translations['name']}</label>
                <input type="text" id="name-input" class="custom-input minimal-rounded" placeholder=${translations["name-placeholder"]}>
                <label>${translations['user']}</label>
                <input type="text" id="user-input" class="custom-input minimal-rounded"
                    placeholder=${translations['user-placeholder']}>
                <label>${translations['password']}</label>
                <input type="text" id="pass-input" class="custom-input minimal-rounded"
                    placeholder=${translations['password-placeholder']}>
                <label>${translations['url']}</label>
                <input type="text" inputmode="url" id="url-input" class="custom-input minimal-rounded"
                    placeholder=${translations['url-placeholder']}>

                <div class="horizontal-flex spaced centered">
                    <labe>${translations['favorite']}</labe>
                    <label id="favorite-switch" class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="preview-area vertical-flex distributed expanded">
                <label for="preview-card">${translations['preview']}</label>

                <div id="preview-card" class="card-body color1 contracted">
                    <div class="horizontal_elem-area spaced centered">
                        <p id="name-preview" class="bold">${cardTranslations['new-card']}</p>
                        <div id="ico-love">
                            <div class="card-static-icon">
                                <img src="../assets/ico/feather/heart.svg" class="card-icon">
                            </div>
                        </div>
                    </div>

                    <label id="user-preview-section" class="minimum-text vertical-flex">
                        ${cardTranslations['user']}
                        <p id="user-preview" class="small-text"></p>
                    </label>

                    <label class="minimum-text vertical-elem-area">
                        ${cardTranslations['password']}
                        <p id="pass-preview" class="small-text"></p>
                    </label>

                    <label id="url-preview-section" class="minimum-text vertical-elem-area">
                        ${cardTranslations['url']}
                        <p id="url-preview" class="small-text"></p>
                    </label>

                    <div class="horizontal-flex spaced centered">
                        <button id="open-link-preview" class="card-btn">
                            <img id="ico-link" src="../assets/ico/feather/external-link.svg" class="card-icon">
                        </button>

                        <p class="minimum-text">#</p>

                        <button id="view-preview" class="card-btn">
                            <img id="ico-eye" src="../assets/ico/feather/eye.svg" class="card-icon">
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div id="colors-section" class="horizontal-flex normal-margin">
            <div class="horizontal_elem-area minimal-padding normal-rounded div-options">
                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color1" type="radio" name="color" value="var(--color1)">
                    <div class="radio-color color1 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color2" type="radio" name="color" value="var(--color2)">
                    <div class="radio-color color2 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color3" type="radio" name="color" value="var(--color3)">
                    <div class="radio-color color3 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color4" type="radio" name="color" value="var(--color4)">
                    <div class="radio-color color4 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color5" type="radio" name="color" value="var(--color5)">
                    <div class="radio-color color5 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color6" type="radio" name="color" value="var(--color6)">
                    <div class="radio-color color6 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color7" type="radio" name="color" value="var(--color7)">
                    <div class="radio-color color7 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color8" type="radio" name="color" value="var(--color8)">
                    <div class="radio-color color8 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color9" type="radio" name="color" value="var(--color9)">
                    <div class="radio-color color9 minimal-rounded"></div>
                </label>

                <label class="custom-radio2 minimal-rounded minimal-padding">
                    <input id="color10" type="radio" name="color" value="var(--color10)">
                    <div class="radio-color color10 minimal-rounded"></div>
                </label>
            </div>

            <button id="new-edit-done" class="new-edit-done action-btn narrow-padding normal-rounded">${translations['done']}</button>
        </div>`;
}