/* Este modulo se encarga de mostrar un modal para exportar los datos del usuario. */

import { replaceKeysInText } from "../utils/translationsUtils.js";

export function showExportDataModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.sanctuaryAPI.getTranslations('export-data');
        const warningTranslations = await window.sanctuaryAPI.getTranslations('warning');
        const constants = await window.sanctuaryAPI.getConstants();

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');

        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations);

        // Elementos HTML insertados en el esqueleto

        // Inputs
        const exportKeysCheckbox = document.getElementById('export-keys');
        const exportNotesCheckbox = document.getElementById('export-notes');

        // Botones
        const exportBtn = document.getElementById('export-btn');

        // Establecer valores iniciales
        modalTitle.textContent = replaceKeysInText(translations['title'], { appName: constants.about.appName });

        // Funciones auxiliares
        const close = () => {
            cleanup();
            resolve({ success: false });
        };

        const exportData = async () => {
            const exportCards = exportKeysCheckbox.checked;
            const exportNotes = exportNotesCheckbox.checked;
            const formatInput = modalBody.querySelector('input[name="export-format"]:checked');

            // Validar que se haya seleccionado al menos un tipo de dato
            if (!exportCards && !exportNotes) {
                window.sanctuaryAPI.showWarning(warningTranslations['title'], translations['select-data-required']);
                return;
            }
            // Validar que se haya seleccionado un formato
            if (!formatInput) {
                window.sanctuaryAPI.showWarning(warningTranslations['title'], translations['select-format-required']);
                return;
            }
            // Escuchar el progreso de importación de tarjetas
            window.sanctuaryAPI.on('decrypt-elements-progress', (progress) => {
                exportBtn.textContent = `${progress}%`;
            });
            exportBtn.disabled = true;
            const result = await window.sanctuaryAPI.exportData({
                cards: exportCards,
                notes: exportNotes,
                format: formatInput.value,
            });
            exportBtn.disabled = false;

            // El usuario canceló el cuadro de diálogo para guardar el archivo
            if (result.canceled) return;

            if (result.success) {
                resolve({ success: true, message: translations['export-success'] });
            } else {
                resolve({ success: false, error: translations['export-error'] });
            }
            cleanup();
        };

        // Creación de Listeners
        closeModal.addEventListener('click', close);
        exportBtn.addEventListener('click', exportData);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y cerrar el modal
        function cleanup() {
            closeModal.removeEventListener('click', close);
            exportBtn.removeEventListener('click', exportData);
            //Resetear el estado del modal
            modalContent.style.width = 'auto';
            modal.style.display = 'none';
        }
    });
}

function getModalHTML(translations) {
    return `
        <div class="vertical-flex big-spaced login-padding">
            <div class="vertical-elem-area">
                <h1 class="centered-text">${translations['export-data']}</h1>
                <p class="small-text centered-text">${translations['warning']}</p>
            </div>
            <div class="vertical-elem-area">
                <p class="small-text">${translations['which-data-export']}</p>
                <div class="horizontal-flex distributed">
                    <label class="option-checkbox radius-1 narrow-padding horizontal-elem-area">
                        <input id="export-keys" type="checkbox" name="export-type" value="keys">
                        <div class="checkbox-ico"></div>
                        <p>${translations['export-keys']}</p>
                    </label>

                    <label class="option-checkbox radius-1 narrow-padding horizontal-elem-area">
                        <input id="export-notes" type="checkbox" name="export-type" value="notes">
                        <div class="checkbox-ico"></div>
                        <p>${translations['export-notes']}</p>
                    </label>
                </div>
            </div>
            <div class="vertical-elem-area">
                <p class="small-text">${translations['format-export']}</p>
                <div class="horizontal-elem-area">
                    <label class="option-radio radius-1 narrow-padding vertical-elem-area">
                        <input id="export-json" type="radio" name="export-format" value="json">
                        <div class="radio-ico"></div>
                        <p class="no-wrapped-text">${translations['json-format']}</p>
                        <p class="small-text">${translations['json-format-info']}</p>
                    </label>

                    <label class="option-radio radius-1 narrow-padding vertical-elem-area">
                        <input id="export-txt" type="radio" name="export-format" value="txt">
                        <div class="radio-ico"></div>
                        <p class="no-wrapped-text">${translations['txt-format']}</p>
                        <p class="small-text">${translations['txt-format-info']}</p>
                    </label>
                </div>
            </div>
            <button id="export-btn" class="action-btn ultra-radius big-btn-padding">${translations['export']}</button>
        </div>
    `
}