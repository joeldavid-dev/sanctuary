/* Este módulo se encarga del manejo de la vista de configuración.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el
 * ID = "main-content".
 */

import { replaceKeysInText } from '../utils/translationsUtils.js';

export async function createSettingsPage(superuser) {
    // Constantes y variables auxiliares
    const translations = await window.electronAPI.getTranslations('settings');
    const constants = await window.electronAPI.getConstants();
    const currentLanguage = await window.electronAPI.getTranslations('language-name');
    const wallpapers = constants.wallpapers;
    const currentWallpaper = await window.electronAPI.getSetting('wallpaper');
    const wallpaperMode = await window.electronAPI.getSetting('wallpaperMode');
    const customWallpaperPath = await window.electronAPI.getSetting('customWallpaperPath');
    const customWallpaperName = await window.electronAPI.getSetting('customWallpaperName');
    const customWallpaperType = await window.electronAPI.getSetting('customWallpaperType');
    const paths = (await window.electronAPI.getPaths());

    // Elementos HTML ya existentes que se usarán
    const settingsArea = document.getElementById('settings-area');

    // Insertar el esqueleto HTML
    settingsArea.innerHTML = getSettingsHTML(translations, constants, superuser);

    // Elementos insertados
    const profileInitial = document.getElementById('profile-initial');
    const profileName = document.getElementById('profile-name');
    const chooseLanguageBtn = document.getElementById('choose-language');
    const wallpaperOptionsArea = document.getElementById('wallpaper-options-area');
    const motionSwitch = document.getElementById('motion-toggle-input');
    const motionSwitchArea = document.getElementById('motion-switch-area');

    // Llenar los datos del perfil
    profileInitial.textContent = superuser.name.charAt(0).toUpperCase();
    profileName.textContent = superuser.name;

    // Llenar el botón de selección de idioma
    if (await window.electronAPI.getSetting('language') === 'system') {
        chooseLanguageBtn.insertAdjacentText('afterbegin', translations['system-default']);
    } else
        chooseLanguageBtn.insertAdjacentText('afterbegin', currentLanguage);

    // Llenar las opciones de fondo de pantalla
    wallpapers.forEach(element => {
        const wallpaperRadio = getWallpaperRadioHTML(element.name);
        if (element.name === currentWallpaper) {
            wallpaperRadio.querySelector('input').checked = true;
        }
        wallpaperOptionsArea.appendChild(wallpaperRadio);
    });

    // Opción de fondo de pantalla personalizado
    if (customWallpaperPath !== 'none' && customWallpaperName !== 'none' && customWallpaperType !== 'none') {
        const thumbnailPath = (customWallpaperType === 'image') ? customWallpaperPath : paths.imageCachePath + '/' + customWallpaperName + '.png';
        wallpaperOptionsArea.appendChild(getCustomWallpaperHTML(thumbnailPath));
        // Seleccionar si es el actual
        if (currentWallpaper === 'custom') {
            document.getElementById('custom-radio').checked = true;
        }
    }

    wallpaperOptionsArea.appendChild(getCustomWallpaperBtnHTML());


    // Configurar el estado inicial del switch de motion
    if (currentWallpaper !== 'custom') {
        const motionBackground = wallpaperMode === 'video' ? true : false;
        motionSwitch.checked = motionBackground;
    }
    else {
        motionSwitchArea.style.display = 'none';
    }
};

function getSettingsHTML(translations, constants) {
    return `
        <div class="vertical-flex big-spaced settings-width">
            <div class="vertical-elem-area centered">
                <div class="profile-pic-container">
                    <p id="profile-initial"></p>
                </div>
                <p id="profile-name" class="expresive-text"></p>
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
                    <div class="horizontal-flex centered spaced minimal-margin-left-right">
                        <p>${translations['app-language']}</p>
                        <div class="horizontal-elem-area centered">
                            <button id="choose-language" class="option-btn minimal-rounded left-text horizontal-elem-area centered">
                                <img src="../assets/ico/feather/chevron-down.svg" class="mini-icon">
                            </button>
                            <img src="../assets/ico/feather/globe.svg" class="mini-icon darkmode-invert">
                        </div>
                    </div>
                </div>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['customization']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <p class="minimal-margin-left-right">${translations['lock-wallpaper']}</p>
                    <div id="wallpaper-options-area" class="elements-container minimal-spaced"></div>
                    <div id="motion-switch-area" class="horizontal-flex centered spaced minimal-margin-left-right">
                        <p>${translations['background-motion']}</p>
                        <label class="switch">
                            <input type="checkbox" id="motion-toggle-input">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <p class="minimum-text centered-text">${translations['background-motion-info']}</p>
                </div>
            </div>

            <div class="vertical-elem-area">
                <p class="bold">${translations['about']}</p>
                <div class="div-options vertical-elem-area narrow-padding external-radius-2">
                    <button id="view-info-about" class="option-btn minimal-rounded left-text horizontal-flex centered spaced">
                        ${replaceKeysInText(translations['view-info-about'], { 'appName': constants.about.appName })}
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

function getWallpaperRadioHTML(img) {
    const wallpaperRadioBody = document.createElement('label');
    wallpaperRadioBody.classList.add('transparent-radio', 'external-radius-4', 'nano-padding');

    wallpaperRadioBody.innerHTML = `
        <img src="../assets/thumbnail/${img}.jpg" class="wallpaper-icon normal-rounded">
        <input type="radio" name="settings-wallpaper-option" id="${img}-radio" value="${img}">
    `;
    return wallpaperRadioBody;
}

function getCustomWallpaperHTML(imgPath) {
    const customWallpaperRadioBody = document.createElement('label');
    customWallpaperRadioBody.classList.add('transparent-radio', 'external-radius-4', 'nano-padding');

    customWallpaperRadioBody.innerHTML = `
        <img src="${imgPath}" class="wallpaper-icon normal-rounded">
        <input type="radio" name="settings-wallpaper-option" id="custom-radio" value="custom">
    `;
    return customWallpaperRadioBody;
}

function getCustomWallpaperBtnHTML() {
    const customWallpaperBody = document.createElement('button');
    customWallpaperBody.id = 'custom-wallpaper-btn';
    customWallpaperBody.classList.add('option-btn', 'external-radius-4', 'nano-margin', 'wallpaper-icon', 'normal-rounded');

    customWallpaperBody.innerHTML = `
        <img src="../assets/ico/feather/plus.svg" class="normal-icon">
    `;
    return customWallpaperBody;
}