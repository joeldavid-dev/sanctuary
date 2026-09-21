/* Este modulo se encarga de mostrar un modal de advertencia genérico, pidiendo
 * confirmación al usuario antes de continuar con una acción.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el
 * ID = "modal-warning" y que contenga un divider con ID = "modal-warning-body".
 */

export function showWarningModal(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
        // Elementos HTML ya existentes que se usarán
        const modalWarning = document.getElementById('modal-warning');
        const modalWarningTitle = document.getElementById('modal-warning-title');
        const closeModalWarning = document.getElementById('close-modal-warning');
        const modalWarningBody = document.getElementById('modal-warning-body');
        // Insertar el esqueleto HTML
        modalWarningBody.innerHTML = getWarningModalHTML(message, confirmText, cancelText);
        // Elementos HTML insertados en el esqueleto
        const cancelWarningBtn = document.getElementById('cancel-warning-btn');
        const confirmWarningBtn = document.getElementById('confirm-warning-btn');

        // Establecer valores
        modalWarningTitle.textContent = title;

        // Funciones de botones
        const finish = (confirmed) => {
            cleanup();
            resolve(confirmed);
        };
        const cancelAction = () => finish(false);
        const confirmAction = () => finish(true);

        // Creación de Listeners
        closeModalWarning.addEventListener('click', cancelAction);
        cancelWarningBtn.addEventListener('click', cancelAction);
        confirmWarningBtn.addEventListener('click', confirmAction);

        // Mostrar el modal
        modalWarning.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModalWarning.removeEventListener('click', cancelAction);
            cancelWarningBtn.removeEventListener('click', cancelAction);
            confirmWarningBtn.removeEventListener('click', confirmAction);

            modalWarning.style.display = 'none';
        }
    });
}

function getWarningModalHTML(message, confirmText, cancelText) {
    return `
        <div class="vertical-elem-area normal-margin big-spaced">
            <label id="warning-message">${message}</label>
            <div class="horizontal-flex distributed">
                <button id="cancel-warning-btn" class="action-btn-warning btn-padding ultra-radius">${cancelText}</button>
                <button id="confirm-warning-btn" class="action-btn-warning btn-padding ultra-radius">${confirmText}</button>
            </div>
        </div>
        `;
}
