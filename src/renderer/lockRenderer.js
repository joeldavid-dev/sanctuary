import { showAboutModal } from './components/modalAbout.js';
import { replaceKeysInText } from './utils/translationsUtils.js';
const now = new Date();
const hours = now.getHours();

document.addEventListener("DOMContentLoaded", async () => {
    const visualWallpaper = document.getElementById('visual-wallpaper');
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

    // Insertar textos
    extraInfo.textContent = replaceKeysInText(translations['extra-info'], {
        'brand': constants.about.brand,
        'appName': constants.about.appName,
        'version': constants.about.version
    });

    // Obtener el saludo dependiendo de la hora
    if (hours >= 0 && hours < 7) {
        //Madrugada
        greeting.textContent = replaceKeysInText(translations['greeting-early-morning'], { name: superuser.name });
    } else if (hours >= 7 && hours < 12) {
        //Mañana
        greeting.textContent = replaceKeysInText(translations['greeting-morning'], { name: superuser.name });
    } else if (hours >= 12 && hours < 19) {
        //Tarde
        greeting.textContent = replaceKeysInText(translations['greeting-afternoon'], { name: superuser.name });
    } else {
        //Noche
        greeting.textContent = replaceKeysInText(translations['greeting-evening'], { name: superuser.name });
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
                        passLabel.textContent = translations['locked'];
                    }
                    else if (count == 1) {
                        passLabel.textContent = replaceKeysInText(translations['wrong-password-last'], { attempts: count });
                    }
                    else if (count <= 2) {
                        greeting.textContent = replaceKeysInText(translations['greeting-doubting'], { name: superuser.name });
                        passLabel.textContent = replaceKeysInText(translations['wrong-password'], { attempts: count });
                    }
                    else {
                        passLabel.textContent = replaceKeysInText(translations['wrong-password'], { attempts: count });
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
        const wallpaperMode = await window.electronAPI.getSetting('wallpaperMode');
        const wallpaper = await window.electronAPI.getSetting('wallpaper');
        const colorStyle = await window.electronAPI.getSetting('colorStyle');
        const customWallpaperPath = await window.electronAPI.getSetting('customWallpaperPath');
        const customWallpaperType = await window.electronAPI.getSetting('customWallpaperType');

        let finalWallpaper;

        if (wallpaper === 'custom') {
            finalWallpaper = customWallpaperPath;
        }
        else {
            if (wallpaperMode === 'image') {
                finalWallpaper = '../assets/img/' + wallpaper + '.jpg';
            } else {
                finalWallpaper = '../assets/vid/' + wallpaper + '.mp4';
            }
        }

        if ((wallpaperMode === "video" && wallpaper !== 'custom') || (wallpaper === 'custom' && customWallpaperType === 'video')) {
            visualWallpaper.innerHTML = `
            <video autoplay loop muted playsinline class="video-wallpaper">
                <source src="${finalWallpaper}" type="video/mp4">
            </video>`;
        } else if ((wallpaperMode === "image" && wallpaper !== 'custom') || (wallpaper === 'custom' && customWallpaperType === 'image')) {
            visualWallpaper.innerHTML = `<img class="img-wallpaper" src="${finalWallpaper}">`
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