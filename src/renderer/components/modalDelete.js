/* Este modulo se encarga del manejo del modal para eliminar una tarjeta.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal-warning" y que contenga un divider con ID = "modal-warning-body".
 */

import { replaceKeysInText } from '../utils/translationsUtils.js';

export function showDeleteModal(element, mode) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('delete-element');
        // Elementos HTML ya existentes que se usarán
        const modalWarning = document.getElementById('modal-warning');
        const modalWarningTitle = document.getElementById('modal-warning-title');
        const closeModalWarning = document.getElementById('close-modal-warning');
        const modalWarningBody = document.getElementById('modal-warning-body');
        // Insertar el esqueleto HTML
        modalWarningBody.innerHTML = getDeleteModalHTML();
        // Elementos HTML insertados en el esqueleto
        const warningMessage = document.getElementById('warning-message');
        const cancelWarningBtn = document.getElementById('cancel-warning-btn');
        const confirmWarningBtn = document.getElementById('confirm-warning-btn');

        // Establecer valores
        if (mode === 'keys') {
            modalWarningTitle.textContent = translations['title-mode-key'];
            warningMessage.textContent = replaceKeysInText(translations['message-mode-key'], { name: element.name });
            cancelWarningBtn.textContent = translations['cancel'];
            confirmWarningBtn.textContent = translations['delete-key'];
        }
        else if (mode === 'notes') {
            modalWarningTitle.textContent = translations['title-mode-note'];
            warningMessage.textContent = replaceKeysInText(translations['message-mode-note'], { name: element.name });
            cancelWarningBtn.textContent = translations['cancel'];
            confirmWarningBtn.textContent = translations['delete-note'];
        }

        // Funciones de botones
        const close = () => {
            cleanup();
            resolve({ success: false })
        };
        const deleteElementAction = async () => {
            let result = null;
            if (mode === 'keys') {
                result = await window.electronAPI.deleteCard(element.id);
            }
            else if (mode === 'notes') {
                result = await window.electronAPI.deleteNote(element.id);
            }

            console.log(mode);
            if (result.success) {
                cleanup();
                resolve({
                    success: true,
                    message: result.message
                });
            } else {
                cleanup();
                reject({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
        };

        // Creación de Listeners
        closeModalWarning.addEventListener('click', close);
        cancelWarningBtn.addEventListener('click', close);
        confirmWarningBtn.addEventListener('click', deleteElementAction);

        // Mostrar el modal
        modalWarning.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModalWarning.removeEventListener('click', close);
            cancelWarningBtn.removeEventListener('click', close);
            confirmWarningBtn.removeEventListener('click', deleteElementAction);

            modalWarning.style.display = 'none';
        }
    });
}

function getDeleteModalHTML() {
    return `
        <div class=" vertical-elem-area normal-margin big-spaced">
            <label id="warning-message"></label>
            <div class="horizontal-flex distributed">
                <button id="cancel-warning-btn" class="action-btn-warning btn-padding minimal-rounded"></button>
                <button id="confirm-warning-btn" class="action-btn-warning btn-padding minimal-rounded"></button>
            </div>
        </div>
        `;
}