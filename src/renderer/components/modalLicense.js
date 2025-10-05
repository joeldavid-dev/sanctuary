/* Este modulo se encarga del manejo del modal para mostrar la licencia.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

export function showLicenseModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('license');
        const license = await window.electronAPI.getLicense();

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(license);

        // Elementos HTML insertados en el esqueleto

        // Establecer valores iniciales
        modalContent.style.width = '600px'; // Establecer el ancho de modal a 320px
        modalTitle.textContent = translations['title'];

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve()
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            // Resetear el ancho del modal
            modalContent.style.width = 'auto';
            modal.style.display = 'none';
        }
    });
}

function getModalHTML(license) {
    return `
    <div class="normal-padding">
        <p class="plain-text-font small-text selectable-text preserve">${license}</p>
    </div>`;
}