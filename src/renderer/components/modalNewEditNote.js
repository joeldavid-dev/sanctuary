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
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations, noteTranslations);

        // Elementos HTML insertados en el esqueleto
        // Inputs y botones
        const notePreview = document.getElementById('note-preview');
        const contentTextarea = document.getElementById('content-textarea');
        const favoriteSwitch = document.getElementById('favorite-switch');
        const colorsSection = document.getElementById('colors-section');
        const newEditDone = document.getElementById('new-edit-done');

        // Establecer valores
        modalContent.style.width = 'max-content'; // Ajustar el ancho del modal
        //contentTextarea.style.height = '60dvh'; // Aumenta el tamaño inicial del textarea
        if (mode === 'create') {
            modalTitle.textContent = translations['title-new-note'];
            favoriteValue = false;
        }
        else if (mode === 'edit') {
            modalTitle.textContent = translations['title-edit-note'];
            // Actualizar los campos del formulario
            const totalContent = note.name + '\n\n' + (note.content || '');
            contentTextarea.value = totalContent;
            // Actualizar las variables de valores
            favoriteValue = note.favorite;
            colorSelected = note.color;
            // Marcar el color seleccionado
            document.querySelector(`input[name="color"][value="${colorSelected}"]`).checked = true;
            // Marcar el switch de favorito si es necesario
            favoriteSwitch.querySelector('input').checked = note.favorite || false;
            // Cambiar el color de la nota en la vista previa
            notePreview.style.backgroundColor = note.color;
        }
        // Cambiar el color del texto dependiendo del color de la nota para mantener la legibilidad
        if (colorSelected === 'var(--color4)' || colorSelected === 'var(--color6)') {
            notePreview.style.color = 'black'; // Cambiar el color del texto a negro
            contentTextarea.style.color = 'black'; // Cambiar el color del texto del textarea
        } else {
            notePreview.style.color = 'white'; // Cambiar el color del texto a blanco
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
            favoriteValue = event.target.checked;
        }
        const colorsAction = (event) => {
            colorSelected = event.target.value;
            // Cambiar color de la vista previa
            notePreview.style.backgroundColor = colorSelected;
            if (colorSelected === 'var(--color4)' || colorSelected === 'var(--color6)') {
                notePreview.style.color = 'black'; // Cambiar el color del texto
                contentTextarea.style.color = 'black'; // Cambiar el color del texto del textarea
            } else {
                notePreview.style.color = 'white'; // Cambiar el color del texto
                contentTextarea.style.color = 'white'; // Cambiar el color del texto del textarea
            }
        }
        const doneAction = async () => {
            // Obtener datos
            const totalContent = contentTextarea.value.trim();
            // Obtener la primer línea del contenido como nombre de la nota
            const name = totalContent.split('\n')[0].trim();
            // Quitar la primer línea del contenido para usar el resto como contenido
            const content = totalContent.split('\n').slice(1).join('\n').trim();

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
        contentTextarea.style.height = 'auto'; // reset para que calcule bien
        contentTextarea.style.height = contentTextarea.scrollHeight + 'px';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            contentTextarea.removeEventListener('input', contentAction);
            favoriteSwitch.removeEventListener('change', favoriteAction);
            colorsSection.removeEventListener('change', colorsAction);
            newEditDone.removeEventListener('click', doneAction);

            modal.style.display = 'none';
            // Reiniciar tamaño del modal
            modalContent.style.width = 'auto';
        }
    });
}

function getModalHTML(translations, noteTranslations) {
    return `
    <div class="vertical-flex">
        <div id="note-preview" class="note-preview color1 modal-margin">
            <textarea id="content-textarea" class="element-textarea transparent-input small-text" rows="1" placeholder="${noteTranslations["name"]}\n\n${noteTranslations["content"]}"></textarea>
        </div>
        <div class="modal-bottom normal-padding colored-blur normal-spaced elements-container">
            <div id="colors-section" class="horizontal-elem-area minimal-padding ultra-rounded div-options centered">
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
            
            <div class="horizontal-flex minimal-padding ultra-rounded div-options centered">
                <label class="minimal-margin-left-right">${translations['favorite']}</label>
                <label id="favorite-switch" class="switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                </label>
            </div>

            <button id="new-edit-done" class="action-btn big-btn-padding normal-rounded">${translations['done']}</button>
        </div>
    </div>`;
}