/* Este módulo se encarga del manejo de la vista de configuración.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el
 * ID = "main-content".
 */

export async function createSettingsPage(superuser) {
    // Constantes y variables auxiliares
    const translations = await window.electronAPI.getTranslations('settings');
    // Elementos HTML ya existentes que se usarán
    const settingsArea = document.getElementById('settings-area');
    // Insertar el esqueleto HTML
    settingsArea.innerHTML = getSettingsHTML(translations, superuser);
    settingsArea.style.display = 'none'; // Oculto al inicio
};

function getSettingsHTML(translations, superuser) {
    return `
        <div class="vertical-flex big-spaced with-70">
            <div class="vertical-elem-area centered">
                <div class="profile-pic-container">
                    <p>${superuser.name.charAt(0).toUpperCase()}</p>
                </div>
                <p class="expresive-text">${superuser.name}</p>
            </div>

            <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                <button id="edit-ID" class="option-btn minimal-rounded left-text">${translations['edit-ID']}</button>
                <button id="edit-password" class="option-btn minimal-rounded left-text">${translations['edit-password']}</button>
                <button id="export-keys" class="option-btn minimal-rounded left-text">${translations['export-keys']}</button>
                <button id="export-notes" class="option-btn minimal-rounded left-text">${translations['export-notes']}</button>
                <button id="delete-ID" class="option-btn-warning minimal-rounded left-text">${translations['delete-ID']}</button>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['language']}</p>
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