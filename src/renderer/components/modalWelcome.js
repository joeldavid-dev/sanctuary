/* Este modulo se encarga del manejo del modal para mostrar el mensaje de bienvenida.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

import { setTranslations, translate } from "../utils/translate.js";

export function showWelcomeModal() {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('welcome');
        setTranslations(translations);
        const userInfo = await window.electronAPI.getUserInfo();
        const constants = await window.electronAPI.getConstants();

        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations, translate, constants);

        // Elementos HTML insertados en el esqueleto
        const modalWelcomeGreeting = document.getElementById('modalWelcomeGreeting');

        // Establecer valores iniciales
        modalContent.style.width = '300px'; // Establecer el ancho de modal
        modalTitle.textContent = constants['about'].appName;
        // Cambio del saludo dependiendo del género
        let greetingText = '';
        if (userInfo.gender === 'female') {
            greetingText = translate('greeting-female', { name: userInfo.name });
        } else if (userInfo.gender === 'male') {
            greetingText = translate('greeting-male', { name: userInfo.name });
        } else {
            greetingText = translate('greeting-neutro', { name: userInfo.name });
        }
        modalWelcomeGreeting.textContent = greetingText;
        modalWelcomeGreeting.style.marginBottom = '20px';

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve({ success: true });
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

function getModalHTML(translations, translate, constants) {
    return `
    <div class="vertical-elem-area normal-padding">
        <p id="modalWelcomeGreeting" class="expresive-text"></p>
        <p class="plain-text-font small-text">${translate('body-1', { appName: constants['about'].appName })}</p>
        <p class="plain-text-font small-text">${translations['body-2']}</p>
        <p class="plain-text-font small-text">${translations['closing']}</p>
        <div class="vertical-elem-area centered">
            <img src="../assets/illustrations/Welcome.svg" class="icon-40">
            <p class="plain-text-font minimum-text">${translations['signature']}</p>
        </div>
    </div>`;
}