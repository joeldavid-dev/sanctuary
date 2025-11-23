/* Este modulo se encarga del manejo del modal de crear o editar una nota.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

export function showNewEditNoteModal(mode, note) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        let colorSelected = 'var(--color1)';
        let favoriteValue = false;
        const translations = await window.electronAPI.getTranslations('new-edit');
        const noteTranslations = await window.electronAPI.getTranslations('note');
        const warningTranslations = await window.electronAPI.getTranslations('warning');
        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations, noteTranslations);

        // Elementos HTML insertados en el esqueleto
        // Inputs
        const nameInput = document.getElementById('name-input');
        const contentTextarea = document.getElementById('content-textarea');
        const favoriteSwitch = document.getElementById('favorite-switch');
        const colorsSection = document.getElementById('colors-section');
        const newEditDone = document.getElementById('new-edit-done');
        // Vista previa
        const previewNote = document.getElementById('preview-note');
        const icoLove = document.getElementById('ico-love');

        // Establecer valores dependiendo del modo
        if (mode === 'create') {
            modalTitle.textContent = translations['title-new-note'];
            favoriteValue = false;
            icoLove.style.display = 'none';
        }
        else if (mode === 'edit') {
            modalTitle.textContent = translations['title-edit-note'];
            // Actualizar los campos del formulario
            nameInput.value = note.name;
            contentTextarea.value = note.content || '';
            contentTextarea.style.height = '30vh'; // Aumenta el tamaño inicial del textarea
            console.log(contentTextarea.scrollHeight);
            // Actualizar las variables de valores
            favoriteValue = note.favorite;
            colorSelected = note.color;
            // Marcar el color seleccionado
            document.querySelector(`input[name="color"][value="${colorSelected}"]`).checked = true;
            // Marcar el switch de favorito si es necesario
            favoriteSwitch.querySelector('input').checked = note.favorite || false;
            icoLove.style.display = favoriteSwitch.querySelector('input').checked ? 'block' : 'none';
            // Cambiar el color de la nota en la vista previa
            previewNote.style.backgroundColor = note.color;
        }
        // Cambiar el color del texto dependiendo del color de la nota para mantener la legibilidad
        if (colorSelected === 'var(--color4)' || colorSelected === 'var(--color6)') {
            previewNote.style.color = 'black'; // Cambiar el color del texto a negro
            nameInput.style.color = 'black'; // Cambiar el color del texto del input
            contentTextarea.style.color = 'black'; // Cambiar el color del texto del textarea
        } else {
            previewNote.style.color = 'white'; // Cambiar el color del texto a blanco
            nameInput.style.color = 'white'; // Cambiar el color del texto del input
            contentTextarea.style.color = 'white'; // Cambiar el color del texto del textarea
        }

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve({ success: false, })
        }

        const contentAction = () => {
            contentTextarea.style.height = 'auto'; // reset para que calcule bien
            contentTextarea.style.height = contentTextarea.scrollHeight + 'px';
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
            previewNote.style.backgroundColor = colorSelected;
            if (colorSelected === 'var(--color4)' || colorSelected === 'var(--color6)') {
                previewNote.style.color = 'black'; // Cambiar el color del texto
                nameInput.style.color = 'black'; // Cambiar el color del texto del input
                contentTextarea.style.color = 'black'; // Cambiar el color del texto del textarea
            } else {
                previewNote.style.color = 'white'; // Cambiar el color del texto
                nameInput.style.color = 'white'; // Cambiar el color del texto del input
                contentTextarea.style.color = 'white'; // Cambiar el color del texto del textarea
            }
        }
        const doneAction = async () => {
            // Obtener datos
            const name = nameInput.value.trim();
            const content = contentTextarea.value.trim();

            const newEditnote = {
                name: name,
                content: content,
                color: colorSelected,
                favorite: favoriteValue
            }
            // Verificar que el nombre no esté vacío
            if (name) {
                if (mode === 'create') {
                    // Crear nueva nota
                    const result = await window.electronAPI.createNote(newEditnote);
                    if (result.success) {
                        cleanup();
                        resolve({
                            success: true,
                            generated: result.data,
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
                    // Editar nota existente
                    const result = await window.electronAPI.updateNote(note.id, newEditnote);
                    // Cerrar modal
                    if (result.success) {
                        cleanup();
                        resolve({
                            success: true,
                            edited: result.data,
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
                window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['title-required']);
            }
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);
        contentTextarea.addEventListener('input', contentAction);
        favoriteSwitch.addEventListener('change', favoriteAction);
        colorsSection.addEventListener('change', colorsAction);
        newEditDone.addEventListener('click', doneAction);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            contentTextarea.removeEventListener('input', contentAction);
            favoriteSwitch.removeEventListener('change', favoriteAction);
            colorsSection.removeEventListener('change', colorsAction);
            newEditDone.removeEventListener('click', doneAction);

            modal.style.display = 'none';
        }
    });
}

function getModalHTML(translations, noteTranslations) {
    return `
    <div class="vertical-elem-area normal-padding">
        <div class="vertical-flex">
            <div id="preview-note" class="element-preview color1">
                <div class="horizontal-elem-area spaced centered">
                    <input type="text" id="name-input" class="bold expanded transparent-input" placeholder=${noteTranslations["name"]}>
                    <div id="ico-love">
                        <div class="main-element-static-icon">
                            <img src="../assets/ico/feather/heart.svg" class="main-element-icon">
                        </div>
                    </div>
                </div>

                <textarea id="content-textarea" class="element-textarea transparent-input small-text" rows="1" placeholder=${noteTranslations["content"]}></textarea>

                <div class="horizontal-flex spaced centered">
                    <p class="minimum-text">#</p>

                    <button id="view-preview" class="main-element-btn">
                        <img id="ico-eye" src="../assets/ico/feather/eye.svg" class="main-element-icon">
                    </button>
                </div>
            </div>
        </div>

        <div id="colors-section" class="horizontal-elem-area minimal-padding ultra-rounded div-options">
            <label class="option-radio2 circular nano-padding">
                    <input id="color1" type="radio" name="color" value="var(--color1)">
                    <div class="radio-color color1 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color2" type="radio" name="color" value="var(--color2)">
                    <div class="radio-color color2 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color3" type="radio" name="color" value="var(--color3)">
                    <div class="radio-color color3 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color4" type="radio" name="color" value="var(--color4)">
                    <div class="radio-color color4 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color5" type="radio" name="color" value="var(--color5)">
                    <div class="radio-color color5 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color6" type="radio" name="color" value="var(--color6)">
                    <div class="radio-color color6 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color7" type="radio" name="color" value="var(--color7)">
                    <div class="radio-color color7 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color8" type="radio" name="color" value="var(--color8)">
                    <div class="radio-color color8 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color9" type="radio" name="color" value="var(--color9)">
                    <div class="radio-color color9 circular"></div>
                </label>

                <label class="option-radio2 circular nano-padding">
                    <input id="color10" type="radio" name="color" value="var(--color10)">
                    <div class="radio-color color10 circular"></div>
                </label>
        </div>

        <div class="horizontal-elem-area centered">
            <div class="horizontal-flex minimal-padding ultra-rounded div-options expanded spaced">
                <label class="minimal-margin-left-right">${translations['favorite']}</label>
                <label id="favorite-switch" class="switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                </label>
            </div>

            <button id="new-edit-done" class="action-btn big-btn-padding normal-rounded colored-blur">${translations['done']}</button>
        </div>
    </div>`;
}