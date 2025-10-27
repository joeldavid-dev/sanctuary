/* Este módulo se encarga del manejo de la vista de configuración.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el
 * ID = "main-content".
 */

import { setTranslations, translate } from '../utils/translate.js';

export async function createSettingsPage(superuser) {
    // Constantes y variables auxiliares
    const currentLanguage = await window.electronAPI.getTranslations('language-name');
    const translations = await window.electronAPI.getTranslations('settings');
    const constants = await window.electronAPI.getConstants();
    setTranslations(translations);
    // Elementos HTML ya existentes que se usarán
    const settingsArea = document.getElementById('settings-area');
    // Insertar el esqueleto HTML
    settingsArea.innerHTML = getSettingsHTML(translations, constants, superuser);
    // Elementos insertados
    const chooseLanguageBtn = document.getElementById('choose-language');

    // Llenar el botón de selección de idioma
    if (await window.electronAPI.getSetting('language') === 'system') {
        chooseLanguageBtn.insertAdjacentText('afterbegin', translations['system-default']);
    } else
    chooseLanguageBtn.insertAdjacentText('afterbegin', currentLanguage);
};

function getSettingsHTML(translations, constants, superuser) {
    return `
        <div class="vertical-flex big-spaced settings-width">
            <div class="vertical-elem-area centered">
                <div class="profile-pic-container">
                    <p>${superuser.name.charAt(0).toUpperCase()}</p>
                </div>
                <p class="expresive-text">${superuser.name}</p>
            </div>

            <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                <button id="edit-ID" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                    ${translations['edit-ID']}
                    <img src="../assets/ico/feather/edit-2.svg" class="mini-icon">
                </button>
                <button id="edit-password" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                    ${translations['edit-password']}
                    <img src="../assets/ico/feather/edit-3.svg" class="mini-icon">
                </button>
                <!--
                <button id="export-keys" class="option-btn minimal-rounded left-text">${translations['export-keys']}</button>
                <button id="export-notes" class="option-btn minimal-rounded left-text">${translations['export-notes']}</button>
                -->
                <button id="delete-ID" class="option-btn-warning minimal-rounded left-text horizontal-flex centered spaced">
                    ${translations['delete-ID']}
                    <img src="../assets/ico/feather/trash-2.svg" class="mini-icon">
                </button>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['language']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <div class="horizontal-flex centered spaced">
                        <p>${translations['app-language']}</p>
                        <div class="horizontal-elem-area centered">
                            <button id="choose-language" class="option-btn minimal-rounded left-text horizontal-elem-area centered">
                                <img src="../assets/ico/feather/chevron-down.svg" class="mini-icon">
                            </button>
                            <img src="../assets/ico/feather/globe.svg" class="mini-icon">
                        </div>
                    </div>
                </div>
            </div>

            <!--
            <div class="vertical-elem-area">
                <p class="bold">${translations['customization']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['lock-background']}</button>
                    <p class="minimum-text centered-text">${translations['background-motion-info']}</p>
                </div>
            </div>
            -->

            <div class="vertical-elem-area">
                <p class="bold">${translations['about']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="view-info-about" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                        ${translate('view-info-about', { 'appName': constants.about.appName })}
                        <img src="../assets/ico/sanctuary.png" class="mini-icon">
                    </button>

                    <!--
                    <button id="app-language" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                        ${translations['view-version-info']}
                        <img src="../assets/ico/feather/info.svg" class="mini-icon">
                    </button>
                    -->
                    <button id="view-license" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                        ${translations['view-license']}
                        <img src="../assets/ico/feather/file-text.svg" class="mini-icon">
                    </button>
                </div>
            </div>
        </div>
    `;
}