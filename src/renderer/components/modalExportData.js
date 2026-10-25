/* Este modulo se encarga de mostrar un modal para exportar los datos del usuario.
 * Funciona como un asistente de 2 pasos: primero se eligen los datos a exportar
 * (claves y/o notas) y despues el formato de exportación.
 */

import { replaceKeysInText } from "../utils/translationsUtils.js";
import { showWarningModal } from "./modalWarning.js";

export function showExportDataModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.sanctuaryAPI.getTranslations('export-data');
        const constants = await window.sanctuaryAPI.getConstants();

        // Estado del asistente, persiste al avanzar o retroceder entre pasos
        const state = { exportCards: false, exportNotes: false, format: null };
        let currentStep = 1;
        let isAnimating = false;

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');

        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations);

        // Elementos HTML insertados en el esqueleto
        const stepContent = document.getElementById('step-content');

        // Establecer valores iniciales
        modalTitle.textContent = replaceKeysInText(translations['title'], { appName: constants.about.appName });

        // Funciones auxiliares
        const close = () => {
            cleanup();
            resolve({ success: false });
        };

        // Dibuja el paso actual y conecta sus listeners
        function renderStep() {
            if (currentStep === 1) {
                stepContent.innerHTML = getDataStepHTML(translations, state);
                attachDataStepListeners();
            } else {
                stepContent.innerHTML = getFormatStepHTML(translations, state);
                attachFormatStepListeners();
            }
        }

        // Cambia de paso animando la salida del paso actual y la entrada del nuevo
        function goToStep(step, direction) {
            if (isAnimating) return;
            isAnimating = true;

            const exitClass = direction === 'forward' ? 'exit-forward' : 'exit-backward';
            const enterClass = direction === 'forward' ? 'enter-forward' : 'enter-backward';

            stepContent.classList.add(exitClass);
            stepContent.addEventListener('animationend', function onExit() {
                stepContent.removeEventListener('animationend', onExit);
                stepContent.classList.remove(exitClass);

                currentStep = step;
                renderStep();

                stepContent.classList.add(enterClass);
                stepContent.addEventListener('animationend', function onEnter() {
                    stepContent.removeEventListener('animationend', onEnter);
                    stepContent.classList.remove(enterClass);
                    isAnimating = false;
                }, { once: true });
            }, { once: true });
        }

        // Paso 1: selección de los datos a exportar
        function attachDataStepListeners() {
            const exportKeysCheckbox = document.getElementById('export-keys');
            const exportNotesCheckbox = document.getElementById('export-notes');
            const nextBtn = document.getElementById('next-btn');

            const onCheckboxChange = () => {
                state.exportCards = exportKeysCheckbox.checked;
                state.exportNotes = exportNotesCheckbox.checked;
                nextBtn.disabled = !(state.exportCards || state.exportNotes);
            };

            exportKeysCheckbox.addEventListener('change', onCheckboxChange);
            exportNotesCheckbox.addEventListener('change', onCheckboxChange);
            nextBtn.addEventListener('click', () => goToStep(2, 'forward'));
        }

        // Paso 2: selección del formato de exportación
        function attachFormatStepListeners() {
            const formatInputs = stepContent.querySelectorAll('input[name="export-format"]');
            const unencryptedBanner = document.getElementById('unencrypted-banner');
            const backBtn = document.getElementById('back-btn');
            const exportBtn = document.getElementById('export-btn');

            formatInputs.forEach(input => {
                input.addEventListener('change', () => {
                    state.format = input.value;
                    exportBtn.disabled = false;
                    unencryptedBanner.classList.toggle('visible', state.format !== 'json');
                });
            });

            backBtn.addEventListener('click', () => goToStep(1, 'backward'));
            exportBtn.addEventListener('click', exportData);
        }

        const exportData = async () => {
            const exportBtn = document.getElementById('export-btn');

            // CSV y TXT exportan los datos sin cifrar: pedir confirmación antes de continuar
            if (state.format === 'csv' || state.format === 'txt') {
                const confirmed = await showWarningModal(
                    translations['unencrypted-warning-title'],
                    translations['unencrypted-warning-message'],
                    translations['confirm-export'],
                    translations['cancel'],
                );
                if (!confirmed) return;
            }

            // Escuchar el progreso de importación de tarjetas. Se elimina cualquier
            // listener previo (de un intento anterior en este mismo modal) para no
            // acumular callbacks duplicados en el canal.
            window.sanctuaryAPI.removeAllListeners('decrypt-elements-progress');
            window.sanctuaryAPI.on('decrypt-elements-progress', (progress) => {
                exportBtn.textContent = `${progress}%`;
            });
            exportBtn.disabled = true;
            exportBtn.classList.add('disabled-progressing');
            const result = await window.sanctuaryAPI.exportData({
                cards: state.exportCards,
                notes: state.exportNotes,
                format: state.format,
            });
            exportBtn.disabled = false;
            exportBtn.classList.remove('disabled-progressing');
            exportBtn.textContent = translations['export'];

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

        // Mostrar el modal y el primer paso
        modal.style.display = 'block';
        renderStep();

        // Limpiar Listeners y cerrar el modal
        function cleanup() {
            closeModal.removeEventListener('click', close);
            window.sanctuaryAPI.removeAllListeners('decrypt-elements-progress');
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
            </div>

            <div id="step-content" class="step-content vertical-flex big-spaced"></div>
        </div>
    `
}

function getDataStepHTML(translations, state) {
    const hasSelection = state.exportCards || state.exportNotes;
    return `
        <div class="vertical-elem-area">
            <p class="small-text">${translations['which-data-export']}</p>
            <div class="horizontal-elem-area">
                <label class="option-checkbox radius-1 narrow-padding horizontal-elem-area centered">
                    <input id="export-keys" type="checkbox" name="export-type" value="keys" ${state.exportCards ? 'checked' : ''}>
                    <img src="../assets/ico/feather/key.svg" class="mini-icon darkmode-invert">
                    <p>${translations['export-keys']}</p>
                </label>

                <label class="option-checkbox radius-1 narrow-padding horizontal-elem-area centered">
                    <input id="export-notes" type="checkbox" name="export-type" value="notes" ${state.exportNotes ? 'checked' : ''}>
                    <img src="../assets/ico/feather/file-text.svg" class="mini-icon darkmode-invert">
                    <p>${translations['export-notes']}</p>
                </label>
            </div>
        </div>

        <div class="horizontal-flex reverse">
            <button id="next-btn" class="action-btn ultra-radius big-btn-padding horizontal-elem-area centered" ${!hasSelection ? 'disabled' : ''}>${translations['next']}</button>
        </div>
    `;
}

function getFormatStepHTML(translations, state) {
    return `
        <div class="vertical-elem-area">
            <p class="small-text">${translations['format-export']}</p>
            <div class="horizontal-elem-area">
                <label class="option-radio radius-1 narrow-padding vertical-elem-area">
                    <input id="export-json" type="radio" name="export-format" value="json" ${state.format === 'json' ? 'checked' : ''}>
                    <img src="../assets/ico/feather/code.svg" class="normal-icon darkmode-invert">
                    <p class="no-wrapped-text">${translations['json-format']}</p>
                    <p class="small-text">${translations['json-format-info']}</p>
                </label>

                <label class="option-radio radius-1 narrow-padding vertical-elem-area">
                    <input id="export-csv" type="radio" name="export-format" value="csv" ${state.format === 'csv' ? 'checked' : ''}>
                    <img src="../assets/ico/feather/table.svg" class="normal-icon darkmode-invert">
                    <p class="no-wrapped-text">${translations['csv-format']}</p>
                    <p class="small-text">${translations['csv-format-info']}</p>
                </label>

                <label class="option-radio radius-1 narrow-padding vertical-elem-area">
                    <input id="export-txt" type="radio" name="export-format" value="txt" ${state.format === 'txt' ? 'checked' : ''}>
                    <img src="../assets/ico/feather/file-text.svg" class="normal-icon darkmode-invert">
                    <p class="no-wrapped-text">${translations['txt-format']}</p>
                    <p class="small-text">${translations['txt-format-info']}</p>
                </label>
            </div>
        </div>

        <div id="unencrypted-banner" class="inline-banner horizontal-elem-area centered ${state.format && state.format !== 'json' ? 'visible' : ''}">
            <img src="../assets/ico/feather/unlock.svg" class="mini-icon">
            <p class="small-text">${translations['warning']}</p>
        </div>

        <div class="horizontal-flex spaced">
            <button id="back-btn" class="option-btn radius-1 btn-padding horizontal-elem-area centered">
                <img src="../assets/ico/feather/arrow-left.svg" class="mini-icon">
                ${translations['back']}
            </button>
            <button id="export-btn" class="action-btn ultra-radius big-btn-padding" ${!state.format ? 'disabled' : ''}>${translations['export']}</button>
        </div>
    `;
}
