import { showAboutModal } from './components/modalAbout.js';
import { setTranslations, translate } from './utils/translate.js';
const now = new Date();
const hours = now.getHours();

document.addEventListener("DOMContentLoaded", async () => {
    const visualBackground = document.getElementById('visual-background');
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');
    const aboutBtn = document.getElementById('open-about');
    const greeting = document.getElementById('greeting');
    const passLabel = document.getElementById('pass-label');
    const inputPassword = document.getElementById('password');
    const extraInfo = document.getElementById('extra-info');
    const translations = await window.electronAPI.getTranslations('lock-view');
    const superuser = await window.electronAPI.getUserInfo();
    const constants = await window.electronAPI.getConstants();
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

    // Insertar textos
    extraInfo.textContent = translate('extra-info', {
        'brand': constants.about.brand,
        'appName': constants.about.appName,
        'version': constants.about.version
    });

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
    aboutBtn.addEventListener('click', async () => {
        await showAboutModal();
    });

    async function applySettings() {
        // Obtener configuraciones a utilizar
        const backgroundMode = await window.electronAPI.getSetting('backgroundMode');
        const background = await window.electronAPI.getSetting('background');
        const colorStyle = await window.electronAPI.getSetting('colorStyle');

        if (backgroundMode === "video") {
            visualBackground.innerHTML = `
            <video autoplay loop muted playsinline class="video-background">
                <source src="../assets/vid/${background}.mp4" type="video/mp4">
            </video>`;
        } else if (backgroundMode === "static") {
            visualBackground.innerHTML = `<img class="img-background" src="../assets/img/${background}.jpg">`
        }

        // Aplicar tema si es estático o generado
        if (colorStyle === "generate") {
            const appContrastLight = await window.electronAPI.getSetting('appContrastLight');
            const appContrastDark = await window.electronAPI.getSetting('appContrastDark');
            // Cambiar el color de contraste
            document.documentElement.style.setProperty('--app_contrast_light', appContrastLight);
            document.documentElement.style.setProperty('--app_contrast_dark', appContrastDark);
        } else {
            document.documentElement.style.setProperty('--app_light', constants[colorStyle].app_light);
            document.documentElement.style.setProperty('--app_light_transparent', constants[colorStyle].app_light_transparent);
            document.documentElement.style.setProperty('--app_dark', constants[colorStyle].app_dark);
            document.documentElement.style.setProperty('--app_dark_transparent', constants[colorStyle].app_dark_transparent);
            document.documentElement.style.setProperty('--app_contrast_light', constants[colorStyle].app_contrast_light);
            document.documentElement.style.setProperty('--app_contrast_dark', constants[colorStyle].app_contrast_dark);
        }
    }

    // Acciones iniciales ========================================================================
    await applySettings();
});