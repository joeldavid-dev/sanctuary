/* Este módulo se encarga del manejo de la vista de configuración.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el
 * ID = "main-content".
 */

export async function showSettings() {
    // Constantes y variables auxiliares
    const superuser = await window.electronAPI.getUserInfo();
    const translations = await window.electronAPI.getTranslations('settings');
    // Elementos HTML ya existentes que se usarán
    const mainContent = document.getElementById('main-content');
    // Insertar el esqueleto HTML
    mainContent.innerHTML = getSettingsHTML(translations, superuser);
    // Elementos HTML insertados en el esqueleto
    // Establecer valores
    // Funciones de botones
    // Creación de Listeners
    // Limpiar Listeners
};

function getSettingsHTML(translations, superuser) {
    return `
        <div class="vertical-flex expanded big-spaced">
            <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                <p class="expresive-text centered-text">${superuser.name}</p>
                <button id="edit-ID" class="option-btn minimal-rounded left-text">${translations['edit-ID']}</button>
                <button id="export-keys" class="option-btn minimal-rounded left-text">${translations['export-keys']}</button>
                <button id="export-notes" class="option-btn minimal-rounded left-text">${translations['export-notes']}</button>
                <button id="delete-ID" class="option-btn minimal-rounded left-text">${translations['delete-ID']}</button>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['languaje']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['app-language']}</button>
                </div>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['customization']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['lock-background']}</button>
                    <p class="minimum-text centered-text">${translations['background-motion-info']}</p>
                </div>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['about']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['view-info-about']}</button>
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['view-version-info']}</button>
                    <button id="app-language" class="option-btn minimal-rounded left-text">${translations['view-license']}</button>
                </div>
            </div>
        </div>
    `;
}