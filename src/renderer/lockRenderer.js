import { setTranslations, translate } from './utils/translate.js';
const now = new Date();
const hours = now.getHours();

document.addEventListener("DOMContentLoaded", async () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');
    const modalAbout = document.getElementById('modal-about');
    const aboutBody = document.getElementById('about-body');
    const openModal = document.getElementById('open-about');
    const closeModal = document.getElementById('close-about');
    const greeting = document.getElementById('greeting');
    const passLabel = document.getElementById('pass-label');
    const inputPassword = document.getElementById('password');
    const translations = await window.electronAPI.getTranslations('lock-view');
    const superuser = await window.electronAPI.getUserInfo();
    let count = 5;

    // Clic en botón minimizar
    minimize.addEventListener('click', () => {
        window.electron.minimize();
    });
    // Clic en botón maximizar
    maximize.addEventListener('click', () => {
        window.electron.maximize();
    });
    // Clic en botón cerrar
    close.addEventListener('click', () => {
        window.electron.close();
    });

    // Cargar traducciones y mostrarlas en la interfaz estática
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
    // Cargar las traducciones para el módulo de traducción
    setTranslations(translations);

    // Obtener el saludo dependiendo de la hora
    if (hours >= 0 && hours < 7) {
        //Madrugada
        greeting.textContent = translate('greeting-early-morning', { name: superuser.name });
    } else if (hours >= 7 && hours < 12) {
        //Mañana
        greeting.textContent = translate('greeting-morning', { name: superuser.name });
    } else if (hours >= 12 && hours < 19) {
        //Tarde
        greeting.textContent = translate('greeting-afternoon', { name: superuser.name });
    } else {
        //Noche
        greeting.textContent = translate('greeting-evening', { name: superuser.name });
    }

    // Enter en el input de contraseña
    inputPassword.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            if (inputPassword.value != '') {
                const response = await window.electronAPI.verifyPassword(inputPassword.value);
                console.log(response);

                if (!response.verified) {
                    count--;
                    if (count == 0) {
                        inputPassword.disabled = true;
                        passLabel.textContent = translate('locked');
                    }
                    else if (count == 1) {
                        passLabel.textContent = translate('wrong-password-last', { attempts: count });
                    }
                    else if (count <= 2) {
                        greeting.textContent = translate('greeting-doubting', { name: superuser.name });
                        passLabel.textContent = translate('wrong-password', { attempts: count });
                    }
                    else {
                        passLabel.textContent = translate('wrong-password', { attempts: count });
                    }
                    inputPassword.value = '';
                }
            }
        }
    });

    // Clic en el botón para abrir el modal de acerca de
    openModal.addEventListener('click', async () => {
        // Abrir modal
        modalAbout.style.display = 'block';
        // Cargar contenido externo con fetch()
        try {
            const response = await fetch('about.html');
            const html = await response.text();
            aboutBody.innerHTML = html;
        } catch (error) {
            aboutBody.innerHTML = '<p>//:)</p>';
        }
        //window.electron.openExternal('https://colebemis.com/');
    });

    // Clic en el botón para cerrar el modal de acerca de
    closeModal.addEventListener('click', () => {
        modalAbout.style.display = 'none';
    });
});