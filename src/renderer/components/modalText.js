/* Este modulo se encarga del manejo del modal para mostrar texto.
 * Tipo de texto soportado: 'license', 'log'
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

export function showTextModal(mode) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('text-modal');
        let textContent = '';

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');

        // Establecer valores iniciales
        modalContent.style.width = 'max-content';
        if (mode === 'license') {
            modalTitle.textContent = translations['license-title'];
            textContent = await window.electronAPI.getLicense();
        } else if (mode === 'log') {
            modalTitle.textContent = translations['log-title'];
            textContent = await window.electronAPI.getLog();
        } else {
            reject('Modo de modal desconocido: ' + mode);
            return;
        }

        modalBody.innerHTML = getModalHTML(textContent);

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve()
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);

        // Mostrar el modal
        modal.style.display = 'block';
        // Ir al inicio del modal
        modalContent.scrollTo({ top: 0, behavior: 'smooth' });

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            // Resetear el ancho del modal
            modalContent.style.width = 'auto';
            modal.style.display = 'none';
        }
    });
}

function getModalHTML(textContent) {
    return `
    <div class="normal-padding">
        <p class="plain-text-font small-text selectable-text preserve">${textContent}</p>
    </div>`;
}