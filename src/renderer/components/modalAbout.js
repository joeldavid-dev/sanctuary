/* Este modulo se encarga del manejo del modal para mostrar la informoación acerca de.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

import { setTranslations, translate } from "../utils/translate.js";

export function showAboutModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('about');
        const constants = await window.electronAPI.getConstants();
        setTranslations(translations);

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');

        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations, constants);

        // Elementos HTML insertados en el esqueleto
        const myLinkBtn = document.getElementById('my-link-btn');
        const iconsLinkBtn = document.getElementById('icons-link-btn');
        const illustrationsLinkBtn = document.getElementById('illustrations-link-btn');

        // Establecer valores iniciales
        modalTitle.textContent = translations['title'];

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve()
        }

        const myLinkBtnAction = () => {
            window.electron.openExternal(constants.about.myLink);
        }

        const iconsLinkBtnAction = () => {
            window.electron.openExternal(constants.icons.url);
        }

        const illustrationsLinkBtnAction = () => {
            window.electron.openExternal(constants.illustrations.url);
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);
        myLinkBtn.addEventListener('click', myLinkBtnAction);
        iconsLinkBtn.addEventListener('click', iconsLinkBtnAction);
        illustrationsLinkBtn.addEventListener('click', illustrationsLinkBtnAction);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            myLinkBtn.removeEventListener('click', myLinkBtnAction);
            iconsLinkBtn.removeEventListener('click', iconsLinkBtnAction);
            illustrationsLinkBtn.removeEventListener('click', illustrationsLinkBtnAction);
            // Resetear el ancho del modal
            //modalContent.style.width = 'auto';
            modal.style.display = 'none';
        }
    });
}

function getModalHTML(translations, constants) {
    return `
    <div class="vertical-elem-area normal-padding">
        <p class="medium-text">${translate('version', { 'version': constants.about.version, 'versionName': constants.about.versionName })}</p>
        <p class="medium-text">${translate('description', { 'appName': constants.about.appName })}</p>
        <p class="medium-text">${translations['made-in']}</p>
        
        <div class="vertical-flex">
            <p class="medium-text bold">${translations['about-me-title']}</p>
            <p class="medium-text">${translations['my-info']}</p>
        </div>
        <div class="horizontal-flex">
            <button id="my-link-btn" class="medium-text action-btn btn-padding minimal-rounded horizontal-elem-area centered">
                ${translations['my-link']}
                <img src="../assets/ico/feather/external-link.svg" class="mini-icon">
            </button>
        </div>

        <div class="vertical-flex">
            <p class="medium-text bold">${translations['icons-title']}</p>
            <p class="medium-text">${translate('icons-info', { 'author': constants.icons.author })}</p>
        </div>
        <div class="horizontal-flex">
            <button id="icons-link-btn" class="medium-text action-btn btn-padding minimal-rounded horizontal-elem-area centered">
                ${translate('icons-link', { 'author': constants.icons.author })}
                <img src="../assets/ico/feather/external-link.svg" class="mini-icon">
            </button>
        </div>

        <div class="vertical-flex">
            <p class="medium-text bold">${translations['wallpapers-title']}</p>
            <p class="medium-text">${translations['Wallpaper-info']}</p>
        </div>

        <div class="vertical-flex">
            <p class="medium-text bold">${translations['illustrations-title']}</p>
            <p class="medium-text">${translate('illustrations-info', { 'author': constants.illustrations.author })}</p>
        </div>
        <div class="horizontal-flex">
            <button id="illustrations-link-btn" class="medium-text action-btn btn-padding minimal-rounded horizontal-elem-area centered">
                ${translate('illustrations-link', { 'author': constants.illustrations.author })}
                <img src="../assets/ico/feather/external-link.svg" class="mini-icon">
            </button>
        </div>
            
        <p class="medium-text">${translations['fun-fact']}</p>

        <p class="medium-text bold">${translate('copyright', { 'appName': constants.about.appName })}</p>
    </div>`;
}