/* Este modulo se encarga del manejo del modal para crear o editar el ID.
 * Solo necesita ser llamado en un renderer cuyo html incluya un divider con el 
 * ID = "modal" y que contenga un divider con ID = "modal-body".
 */

import { setTranslations, translate } from "../utils/translate.js";

export function showIDModal(mode, superuser) {
    return new Promise(async (resolve, reject) => {
        // Constantes y variables auxiliares
        const translations = await window.electronAPI.getTranslations('id');
        const warningTranslations = await window.electronAPI.getTranslations('warning');
        setTranslations(translations);
        let isImporting = false;
        // Elementos HTML ya existentes que se usarán
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        // Insertar el esqueleto HTML
        modalBody.innerHTML = getModalHTML(translations);

        // Elementos HTML insertados en el esqueleto
        const subtitle = document.getElementById('subtitle');
        const information = document.getElementById('information');
        const userNameContainer = document.getElementById('name-container');
        const pass1Container = document.getElementById('pass1-container');
        const pass2Container = document.getElementById('pass2-container');
        const pass3Container = document.getElementById('pass3-container');
        const genderContainer = document.getElementById('gender-container');
        // Inputs
        const userName = document.getElementById('user-name');
        const userPass1 = document.getElementById('user-pass1');
        const userPass2 = document.getElementById('user-pass2');
        const userPass3 = document.getElementById('user-pass3');
        // Botones
        const idDoneBtn = document.getElementById('ID-done-btn');
        const importBtn = document.getElementById('import-btn');

        // Establecer valores dependiendo del modo
        modalContent.style.width = '320px'; // Establecer el ancho de modal a 320px
        modalTitle.textContent = translations['title'];
        if (mode === 'create') {
            subtitle.textContent = translations['hello'];
            information.textContent = translations['welcome'];
            pass1Container.style.display = 'none';
        }
        else if (mode === 'edit-data') {
            subtitle.textContent = translations['edit-data-subtitle'];
            information.textContent = translations['edit-data-info'];
            userName.value = superuser.name;
            pass1Container.style.display = 'none';
            pass2Container.style.display = 'none';
            pass3Container.style.display = 'none';
            // Seleccionar el genero del usuario
            document.querySelector(`input[name="gender"][value="${superuser.gender}"]`).checked = true;
            importBtn.style.display = 'none';
        }
        else if (mode === 'edit-password') {
            subtitle.textContent = translations['edit-password-subtitle'];
            information.textContent = translations['edit-password-info'];
            userNameContainer.style.display = 'none';
            genderContainer.style.display = 'none';
            importBtn.style.display = 'none';
        }

        // Funciones de botones e inputs
        const close = () => {
            cleanup();
            resolve({ success: false, })
        };
        // Al pulsar el boton de importar
        const importAction = async () => {
            const response = await window.electronAPI.getJSONFile();
            if (response.success) {
                isImporting = true;
                // Ajustar la interfaz
                subtitle.textContent = translate('welcome-back', { name: response.name });
                information.textContent = translations['welcome-back-info'];
                userNameContainer.style.display = 'none';
                pass3Container.style.display = 'none';
                genderContainer.style.display = 'none';
                importBtn.style.display = 'none';
            } else {
                window.electronAPI.showWarning(warningTranslations['title'], response.message);
            }
        }
        // Al pulsar el boton de done
        const doneAction = async () => {
            const name = userName.value.trim();
            const pass1 = userPass1.value;
            const pass2 = userPass2.value;
            const pass3 = userPass3.value;
            // Obtener el valor del radio de genero seleccionado
            const gender = document.querySelector('input[name="gender"]:checked')?.value || 'neutral';

            if (mode === 'create') {
                if (isImporting) {
                    idDoneBtn.disabled = true;
                    idDoneBtn.textContent = translations['importing'];
                    // Importar datos
                    const result = await window.electronAPI.importData(pass2);
                    if (result.success) {
                        cleanup();
                        resolve({ success: true, imported: true, });
                    }
                    else {
                        window.electronAPI.showWarning(warningTranslations['title'], result.message);
                        userPass2.value = '';
                        idDoneBtn.disabled = false;
                        idDoneBtn.textContent = translations['done'];
                        userPass2.focus();
                    }
                } else {
                    // Validar los datos
                    if (!name || name.length < 3) {
                        window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['invalid-name']);
                        return;
                    }
                    else if (!pass2 || pass2.length < 5) {
                        window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['short-password']);
                        userPass2.value = '';
                        userPass3.value = '';
                        userPass2.focus();
                        return;
                    }
                    else if (pass2 !== pass3) {
                        window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['password-mismatch']);
                        userPass2.value = '';
                        userPass3.value = '';
                        userPass2.focus();
                        return;
                    }
                    else {
                        // Datos correctos, crear el ID
                        const result = await window.electronAPI.createID(name, pass2, gender);
                        if (result.success) {
                            cleanup();
                            resolve({ success: true, imported: false, });
                        }
                        else {
                            window.electronAPI.showWarning(warningTranslations['title'], result.message);
                        }
                    }
                }
            }
            else if (mode === 'edit-data') {
                if (!name || name.length < 3) {
                    window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['invalid-name']);
                    return;
                } else {
                    // Datos correctos, actualizar el ID
                    const result = await window.electronAPI.updateID(name, gender);
                    if (result.success) {
                        cleanup();
                        resolve({ success: true, message: result.message });
                    } else {
                        cleanup();
                        resolve({ success: false, error: result.message });
                    }
                }
            }
        }

        // Creación de Listeners
        closeModal.addEventListener('click', close);
        idDoneBtn.addEventListener('click', doneAction);
        importBtn.addEventListener('click', importAction);

        // Mostrar el modal
        modal.style.display = 'block';

        // Limpiar Listeners y ocultar
        function cleanup() {
            closeModal.removeEventListener('click', close);
            idDoneBtn.removeEventListener('click', doneAction);
            importBtn.removeEventListener('click', importAction);
            // Resetear el ancho del modal
            modalContent.style.width = 'auto';
            modal.style.display = 'none';
        }
    });
}

function getModalHTML(translations) {
    return `
    <div class="vertical-flex big-spaced login-padding">
        <div class="vertical-elem-area">
            <h1 id="subtitle" class="centered-text"></h1>
            <p id="information" class="centered-text small-text"></p>

            <div id="name-container" class="vertical-elem-area">
                <label class="small-text">${translations['name']}</label>
                <input id="user-name" class="custom-input minimal-rounded" type="text" required>
            </div>
    
            <div id="pass1-container" class="vertical-elem-area">
                <label class="small-text">${translations['current-password']}</label>
                <input id="user-pass1" class="custom-input minimal-rounded" type="password" required>
            </div>
    
            <div id="pass2-container" class="vertical-elem-area">
                <label class="small-text">${translations['new-password']}</label>
                <input id="user-pass2" class="custom-input minimal-rounded" type="password" required>
            </div>

            <div id="pass3-container" class="vertical-elem-area">
                <label class="small-text">${translations['confirm-password']}</label>
                <input id="user-pass3" class="custom-input minimal-rounded" type="password" required>
            </div>
    
            <div id="gender-container" class="vertical-elem-area">
                <div class="horizontal-elem-area centered">
                    <label class="small-text">${translations['gender']}</label>
                    <img src="../assets/ico/feather/help-circle.svg" class="mini-icon" title="${translations['gender-help']}">
                </div>
                <div class="horizontal-flex spaced">
                    <label class="custom-radio minimal-rounded minimal-padding horizontal-elem-area">
                        <p class="small-text">${translations['gender-male']}</p>
                        <input id="gender1" type="radio" name="gender" value="male">
                        <div class="radio-ico"></div>
                    </label>
    
                    <label class="custom-radio minimal-rounded minimal-padding horizontal-elem-area">
                        <p class="small-text">${translations['gender-female']}</p>
                        <input id="gender2" type="radio" name="gender" value="female">
                        <div class="radio-ico"></div>
                    </label>
    
                    <label class="custom-radio minimal-rounded minimal-padding horizontal-elem-area">
                        <p class="small-text">${translations['gender-other']}</p>
                        <input id="gender3" type="radio" name="gender" value="neutral">
                        <div class="radio-ico"></div>
                    </label>
                </div>
            </div>
        </div>

        <button id="ID-done-btn" class="action-btn minimal-rounded big-btn-padding">${translations['done']}</button>
        <button id="import-btn" class="option-btn minimal-rounded small-text">${translations['import-data']}</button>
    </div>`;
}