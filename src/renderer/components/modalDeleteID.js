/* Este modulo se encarga del manejo del modal para eliminar el ID.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal-warning" y que contenga un divider con ID = "modal-warning-body".
 */

export function showDeleteIDModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('deleteID');
        const warningTranslations = await window.electronAPI.getTranslations('warning');
        // Elementos HTML ya existentes que se usarán
        const modalWarning = document.getElementById('modal-warning');
        const modalWarningTitle = document.getElementById('modal-warning-title');
        const closeModalWarning = document.getElementById('close-modal-warning');
        const modalWarningBody = document.getElementById('modal-warning-body');
        // Insertar el esqueleto HTML
        modalWarningBody.innerHTML = getDeleteIDModalHTML(translations);
        // Elementos HTML insertados en el esqueleto
        const userPass = document.getElementById('deteteID-user-pass');
        const cancelDeleteIdBtn = document.getElementById('cancel-deleteID-btn');
        const confirmDeleteIdBtn = document.getElementById('confirm-deleteID-btn');

        // Establecer valores
        modalWarningTitle.textContent = translations['title'];

        // Funciones de botones
        const close = () => {
            cleanup();
            resolve({ success: false })
        };
        const deleteIDAction = async () => {
            const deleteIDpass = userPass.value;
            if (!deleteIDpass || deleteIDpass.length < 5) {
                window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['short-password']);
                userPass.value = '';
                return;
            }
            const result = await window.electronAPI.deleteID(deleteIDpass);
            (result.success) ? resolve({ success: true }) : resolve({ success: false, error: result.message });
            cleanup();
        };

        // Creación de Listeners
        closeModalWarning.addEventListener('click', close);
        cancelDeleteIdBtn.addEventListener('click', close);
        confirmDeleteIdBtn.addEventListener('click', deleteIDAction);

        // Mostrar el modal
        modalWarning.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModalWarning.removeEventListener('click', close);
            cancelDeleteIdBtn.removeEventListener('click', close);
            confirmDeleteIdBtn.removeEventListener('click', deleteIDAction);

            modalWarning.style.display = 'none';
        }
    });
}

function getDeleteIDModalHTML(translations) {
    return `
        <div class=" vertical-elem-area normal-margin big-spaced">
            <label id="warning-message">${translations['message']}</label>
            <div class="vertical-elem-area">
                <label class="small-text">${translations['password']}</label>
                <input id="deteteID-user-pass" class="input-warning minimal-rounded" type="password" required>
            </div>
            <div class="horizontal-flex distributed">
                <button id="cancel-deleteID-btn" class="action-btn-warning btn-padding minimal-rounded">${translations['cancel']}</button>
                <button id="confirm-deleteID-btn" class="action-btn-warning btn-padding minimal-rounded">${translations['delete-ID']}</button>
            </div>
        </div>
        `;
}