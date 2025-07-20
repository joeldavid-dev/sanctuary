import { setTranslations, translate } from './utils/translate.js';

document.addEventListener("DOMContentLoaded", async () => {
    const close = document.getElementById('close');
    const greeting = document.getElementById('greeting');
    const instructions = document.getElementById('instructions');
    const nameContainer = document.getElementById('name-container');
    const nameIn = document.getElementById('user-name');
    const pass1In = document.getElementById('user-pass1');
    const pass2Container = document.getElementById('pass2-container');
    const pass2In = document.getElementById('user-pass2');
    const genderContainer = document.getElementById('gender-container');
    const done = document.getElementById('done-btn');
    const importBtn = document.getElementById('import-btn');
    const translations = await window.electronAPI.getTranslations('id-view');
    const warningTranslations = await window.electronAPI.getTranslations('warning');

    let name, pass1, pass2, gender = '';
    let mode = 'create'; // Modo de creación de ID

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

    // Fondo animado
    document.body.addEventListener("pointermove", (e) => {
        const { currentTarget: el, clientX: x, clientY: y } = e;
        const { top: t, left: l, width: w, height: h } = el.getBoundingClientRect();
        el.style.setProperty('--posX', x - l - w / 2);
        el.style.setProperty('--posY', y - t - h / 2);
    })

    // Al editar el nombre
    nameIn.addEventListener('input', (event) => {
        name = event.target.value.trim();
    });

    // Al editar la contraseña 1
    pass1In.addEventListener('input', (event) => {
        pass1 = event.target.value.trim();
    });

    // Al editar la contraseña 2
    pass2In.addEventListener('input', (event) => {
        pass2 = event.target.value.trim();
    });

    // Al presionar un genero
    document.querySelectorAll('input[name="gender"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            gender = event.target.value;
        });
    });

    // Clic en botón "listo"
    done.addEventListener('click', async () => {
        if (mode == 'create') {

            // Verificar que todos los campos no esten vacíos
            if (name == '' || pass1 == '' || pass2 == '' || !name || !pass1 || !pass2 || !gender) {
                await window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['empty-fields']);
            }

            // Verificar que las contraseñas coincidan
            else if (pass1 != pass2) {
                await window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['passwords-dont-match']);
                pass1In.value = '';
                pass2In.value = '';
                pass1 = '';
                pass2 = '';
            }

            // Acciones cuando los datos son correctos
            else if (name != '' && pass1 != '' && pass1 == pass2 && gender) {
                const response = await window.electronAPI.createID(name, pass1, gender);

                if (response.success) {
                    window.electronAPI.showNotification(translations['success'], translations['success-info']);
                    window.electronAPI.changeView('src/views/lock.html');
                } else {
                    showToast(response.message);
                }
            }
        }
        else if (mode == 'import') {
            // Verificar que todos los campos no esten vacíos
            if (pass1 != '' && pass1) {
                done.textContent = translations['importing'];
                done.disabled = true; // Deshabilitar el botón "listo" para evitar múltiples clics
                const response = await window.electronAPI.importData(pass1);
                if (response.success) {
                    // Cuando la contraseña es correcta y la importación es exitosa
                    window.electronAPI.showNotification(translations['success'], translations['success-import-info']);
                    window.electronAPI.changeView('src/views/lock.html');
                } else {
                    // Cuando la contraseña es incorrecta o ocurrió un error
                    showToast(response.message);
                    pass1In.value = '';
                    pass1 = '';
                    done.textContent = translations['done'];
                    done.disabled = false; // Habilitar el botón "listo" nuevamente
                }
            }
            // Acciones cuando no se ingresa la contraseña
            else {
                await window.electronAPI.showWarning(warningTranslations['title'], warningTranslations['empty-fields']);
                done.textContent = translations['done'];
                done.disabled = false; // Habilitar el botón "listo" nuevamente
            }
        }
    });

    // Clic en botón "importar"
    importBtn.addEventListener('click', async () => {
        const response = await window.electronAPI.getJSONFile();
        if (response.success) {
            mode = 'import'; // Cambiar a modo de importación
            // Adaptar la interfaz para importar los datos
            greeting.textContent = translate('welcome-back', { name: response.name });
            instructions.textContent = translations['welcome-back-info'];
            nameContainer.style.display = 'none';
            pass2Container.style.display = 'none';
            genderContainer.style.display = 'none';
            importBtn.style.display = 'none';
        } else {
            showToast(response.message);
        }
    });

    // Función del toast notification ============================================================
    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.textContent = message;

        container.appendChild(toast);

        // Eliminarlo después de que desaparezca
        setTimeout(() => {
            toast.remove();
        }, 5000); // 5 segundos de duración total
    }
});