/* Este modulo se encarga del manejo del modal para eliminar una tarjeta.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal-warning" y que contenga un divider con ID = "modal-warning-body".
 */

import { setTranslations, translate } from '../utils/translate.js';

export function showDeleteModal(card) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('delete');
        setTranslations(translations);
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
        modalWarningTitle.textContent = translations['title'];
        warningMessage.textContent = translate('message', { name: card.name });
        cancelWarningBtn.textContent = translations['cancel'];
        confirmWarningBtn.textContent = translations['delete-key'];

        // Funciones de botones
        const close = () => {
            cleanup();
            resolve({ success: false })
        };
        const deleteCardAction = async () => {
            const result = await window.electronAPI.deleteCard(card.id);
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
        confirmWarningBtn.addEventListener('click', deleteCardAction);

        // Mostrar el modal
        modalWarning.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModalWarning.removeEventListener('click', close);
            cancelWarningBtn.removeEventListener('click', close);
            confirmWarningBtn.removeEventListener('click', deleteCardAction);

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