import { setTranslations, translate } from './utils/translate.js';
import { createCardElement } from './components/card.js'; // Importar el módulo de tarjeta
import { createNoteElement } from './components/note.js'; // Importar el módulo de nota
import { showNewEditCardModal } from './components/modalNewEditCard.js'; // Importar el módulo de modal para agregar o editar tarjetas
import { showNewEditNoteModal } from './components/modalNewEditNote.js'; // Importar el módulo de modal para agregar o editar notas
import { showDeleteModal } from './components/modalDelete.js'; // Importar el módulo de modal para eliminar una tarjeta
import { showIDModal } from './components/modalID.js';
import { createSettingsPage } from './components/settingsPage.js';
import { createCommandOption } from './components/commandOption.js';
import { showDeleteIDModal } from './components/modalDeleteID.js';
import { showLicenseModal } from './components/modalLicense.js';
import { showAboutModal } from './components/modalAbout.js';
import { showWelcomeModal } from './components/modalWelcome.js';
import { createPopupOption } from './components/popupOption.js';

// Barra de título
const minimize = document.getElementById('minimize');
const maximize = document.getElementById('maximize');
const close = document.getElementById('close');
const title = document.getElementById('title');
const searchArea = document.getElementById('search-area');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

// Sidebar
const sidebar = document.getElementById('sidebar');
const keysRadio = document.getElementById('keys-radio');
const notesRadio = document.getElementById('notes-radio');
const settingsRadio = document.getElementById('settings-radio');

// Barra de opciones
const commandOptionsBar = document.getElementById('command-options-bar');

// Contenedor principal
const mainSection = document.getElementById('main-section');
const mainContent = document.getElementById('main-content');
const settingsArea = document.getElementById('settings-area');

// Bottonbar
const bottonBar = document.getElementById('botton-bar');
const editElement = document.getElementById('edit-element');
const editElementBody = document.getElementById('edit-element-body');
const newElement = document.getElementById('new-element');
const deleteElement = document.getElementById('delete-element');
const deleteElementBody = document.getElementById('delete-element-body');

const placeholder = document.getElementById('placeholder');
const placeholderLoading = document.getElementById('placeholder-loading');

const toastContainer = document.getElementById('toast-container');
const popupList = document.getElementById('popup-list');

// Variable para controlar el modo actual de la vista (llaves, notas o configuración)
let mode = 'keys'; // keys || notes
let searchMode = 'none'; // Variable para controlar el modo de búsqueda
let searchTerm = ''; // Término de búsqueda actual

let selectedPreparedElement = null; // Variable para almacenar el elemento seleccionado
let selectedElementID = null; // Variable para almacenar el ID del elemento seleccionada
let actualPreparedElements = []; // Lista que almacena los elementos mostrados en la vista
let preparedCards = []; // Lista que almacena las tarjetas preparadas (nombre y web desencriptados)
let preparedNotes = []; // Lista que almacena las notas preparadas (contenido desencriptado)

document.addEventListener("DOMContentLoaded", async () => {
    let translations = null;
    let cardTranslations = null;
    const constants = await window.electronAPI.getConstants();

    // Superusuario
    let superuser = null;

    // Carga los comandos disponibles
    const commands = constants['available_commands'];

    // Escuchar el progreso de preparación de tarjetas
    window.electronAPI.on('prepare-elements-progress', (progress) => {
        placeholderLoading.textContent = `${translations['placeholder-loading']} ${progress}%`;
    });

    // Funciones del contenedor principal ========================================================
    // Traer los datos al iniciar la vista
    async function getPreparedElements() {
        const result = await window.electronAPI.getPreparedElements();
        if (result.success) {
            preparedCards = result.preparedCards; // Actualizar la lista de tarjetas preparadas
            preparedNotes = result.preparedNotes; // Actualizar la lista de notas preparadas
        } else {
            showToast(result.message, true);
            preparedCards = []; // Lista vacía si falla
            preparedNotes = []; // Lista vacía si falla
        }
    }

    async function showContent(content) {
        // Limpiar el contenedor de elementos antes de agregar nuevos
        mainContent.innerHTML = '';
        deselectAllElements(); // Deseleccionar todos los elementos
        if (content && content.length > 0) {
            // Crear y agregar cada elemento al contenedor
            if (mode === 'keys') {
                content.forEach((element, index) => {
                    mainContent.appendChild(createCardElement(element, index, cardTranslations));
                });
            }
            else if (mode === 'notes') {
                content.forEach((element, index) => {
                    mainContent.appendChild(createNoteElement(element, index, translations));
                });
            }
        } else {
            mainContent.innerHTML = `
            <div class="vertical-elem-area centered">
                <img src="../assets/illustrations/FolderEmpty.svg" class="empty-image">
                <p>${translations['empty']}</p>
            </div>`;
        }
    }

    async function showCommands(commands) {
        // Muestra la ilustración de comandos
        mainContent.innerHTML = `
            <div class="vertical-elem-area centered">
                <img src="../assets/illustrations/Coding.svg" alt="Command mode" class="empty-image">
                <p>${translations['command-mode']}</p>
            </div>`;

        // Mostrar la barra de opciones y ocultar la barra de botones
        commandOptionsBar.style.display = 'flex';
        bottonBar.style.display = 'none';
        // Limpiar la barra de opciones antes de agregar nuevas
        commandOptionsBar.innerHTML = '';

        if (commands.length > 0) {
            // Crear y agregar cada comando a la barra de opciones
            commands.forEach(command => {
                commandOptionsBar.appendChild(createCommandOption(command));
            });
        }
        else {
            commandOptionsBar.innerHTML = `
            <p class="small-text centered-text">${translations['no-commands']}</p>`;
        }
    }

    // Funcion para deseleccionar todos los elementos
    function deselectAllElements() {
        /// Quitar la clase 'selected-element' de todas los elementos
        document.querySelectorAll('.main-element-body').forEach((element) => {
            element.classList.remove('selected-element');
        });
        editElementBody.classList.add('invisible'); // Ocultar el contenedor de edición
        editElementBody.classList.remove('vertical-flex');
        deleteElementBody.classList.add('invisible'); // Ocultar el botón de eliminar
        deleteElementBody.classList.remove('vertical-flex');

        selectedElementID = null;
        selectedPreparedElement = null;

        // Deseleccionar todos los radio
        document.querySelectorAll('input[type="radio"][name="mainElement"]').forEach((radio) => {
            radio.checked = false;
        });
    }

    function showEditDeleteButtons() {
        editElementBody.classList.remove('invisible'); // Mostrar el contenedor de edición
        editElementBody.classList.add('vertical-flex');
        deleteElementBody.classList.remove('invisible'); // Mostrar el botón de eliminar
        deleteElementBody.classList.add('vertical-flex');
    }

    // Funciones de estado de la vista ===========================================================
    function showPlaceholderSpinner() {
        bottonBar.style.display = 'none'; // Ocultar la barra de botones
        placeholder.style.display = 'flex'; // Mostrar el spinner de carga
    }

    function hidePlaceholderSpinner() {
        placeholder.style.display = 'none'; // Ocultar el spinner de carga
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones
    }

    async function loadContent() {
        showPlaceholderSpinner(); // Mostrar spinner de carga
        await getPreparedElements(); // Cargar los elementos preparados
        hidePlaceholderSpinner(); // Ocultar spinner de carga
        showKeysView(); // Mostrar la vista de inicio
        // Seleccionar el radioboton de llaves
        keysRadio.querySelector('input[type="radio"]').checked = true;
    }

    function showKeysView() {
        clearSearch(); // Limpiar las búsquedas
        mode = 'keys'; // Cambiar el modo a llaves
        actualPreparedElements = preparedCards; // Obtener todas las tarjetas y almacenarlas en la lista de elementos mostrados
        showContent(actualPreparedElements); // Mostrar las tarjetas en la vista
        title.textContent = translations['my-keys']; // Cambiar el título de la vista
        searchArea.style.display = 'flex'; // Mostrar la barra de búsqueda en la vista de llaves
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones en la vista de llaves
        settingsArea.style.display = 'none'; // Ocultar el área de configuración
        mainContent.style.display = 'flex'; // Mostrar el contenedor principal
    }

    async function showNotesView() {
        clearSearch(); // Limpiar las búsquedas
        mode = 'notes'; // Cambiar el modo a notas
        actualPreparedElements = preparedNotes; // Obtener todas las notas y almacenarlas en la lista de elementos mostrados
        showContent(actualPreparedElements); // Mostrar las notas en la vista
        title.textContent = translations['my-notes']; // Cambiar el título de la vista
        searchArea.style.display = 'flex'; // Mostrar la barra de búsqueda en la vista de notas
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones en la vista de notas
        settingsArea.style.display = 'none'; // Ocultar el área de configuración
        mainContent.style.display = 'flex'; // Mostrar el contenedor principal
    }

    function showSettingsView() {
        clearSearch(); // Limpiar la búsquedas
        title.textContent = translations['settings']; // Cambiar el título de la vista
        searchArea.style.display = 'none'; // Ocultar la barra de búsqueda en la vista de configuración
        bottonBar.style.display = 'none'; // Ocultar la barra de botones en la vista de configuración
        mode = 'settings'; // Cambiar el modo a configuración
        settingsArea.style.display = 'flex'; // Mostrar el área de configuración
        mainContent.style.display = 'none'; // Ocultar el contenedor principal de tarjetas
        // Ir al inicio del área de configuración
        mainSection.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Función para mostrar el popup list
    function showPopupList(event) {
        popupList.style.display = 'flex';

        const popupRect = popupList.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Posición base al lado del cursor
        let left = event.clientX + 10;
        let top = event.clientY + 10;

        // Ajuste si se sale por la derecha
        if (left + popupRect.width > viewportWidth) {
            left = event.clientX - popupRect.width - 10;
        }

        // Ajuste si se sale por abajo
        if (top + popupRect.height > viewportHeight) {
            top = event.clientY - popupRect.height - 10;
        }

        popupList.style.left = `${left}px`;
        popupList.style.top = `${top}px`;
    }

    // Acciones de la barra de título ============================================================
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

    // Barra de busqueda
    function search(searchTerm) {
        return actualPreparedElements.filter(element => element.name.toLowerCase().includes(searchTerm));
    }

    searchInput.addEventListener('input', async (event) => {
        searchTerm = event.target.value.toLowerCase();
        if (searchTerm.length > 0) {
            // Cambiar el icono de búsqueda a "x"
            if (searchMode === 'none') document.getElementById('search-clear-ico').src = '../assets/ico/feather/x.svg';
            // Si el término de búsqueda comienza con '>>', se interpreta como un comando
            if (searchTerm.startsWith('>>')) {
                searchMode = 'command'; // Cambiar el modo de búsqueda a "comando"
                const filteredCommands = commands.filter(command => command.toLowerCase().includes(searchTerm.slice(2).trim()));
                showCommands(filteredCommands);
            }
            else {
                commandOptionsBar.style.display = 'none'; // Ocultar la barra de opciones
                bottonBar.style.display = 'flex'; // Mostrar la barra de botones
                showContent(search(searchTerm)); // Mostrar los elementos filtrados
                searchMode = 'searching'; // Cambiar el modo de búsqueda a "buscando"
            }
        } else {
            showContent(actualPreparedElements); // Mostrar todos los elementos si no hay término de búsqueda
            searchMode = 'none'; // Cambiar el modo de búsqueda a "ninguno"
            document.getElementById('search-clear-ico').src = '../assets/ico/feather/search.svg'; // Cambiar el icono de búsqueda a "lupa"
        }
    });

    searchInput.addEventListener('keydown', async (event) => {
        // Si se presiona tabulador, se enfoca el primer botón de la barra de opciones
        if (event.key === 'Tab' && commandOptionsBar.style.display === 'flex') {
            // Enfocar el primer botón de la barra de opciones
            event.preventDefault(); // Evitar el comportamiento por defecto de tabulador
            const firstButton = commandOptionsBar.querySelector('button');
            if (firstButton) firstButton.focus();
        }
        else if (event.key === 'Escape') {
            clearSearch(); // Limpiar la búsqueda si se presiona Escape
        }
        else if (event.key === 'Enter' && searchMode === 'command') {
            const command = searchInput.value.slice(2).trim(); // Obtener el comando ingresado
            if (command === '') {
                showToast(translations['empty-command'], true); // Mostrar mensaje si no hay comando
            }
            else {
                await executeCommand(command); // Ejecutar el comando correspondiente
            }
            clearSearch(); // Limpiar la búsqueda
        }
    });

    // Función para limpiar la búsqueda y mostrar todos los elementos
    function clearSearch() {
        if (searchMode !== 'none') {
            searchInput.value = ''; // Limpiar el campo de búsqueda
            showContent(actualPreparedElements); // Mostrar todos los elementos
            document.getElementById('search-clear-ico').src = '../assets/ico/feather/search.svg'; // Cambiar el icono de búsqueda a "lupa"
            if (searchMode === 'command') {
                commandOptionsBar.style.display = 'none'; // Ocultar la barra de opciones
                bottonBar.style.display = 'flex'; // Mostrar la barra de botones
            }
            searchMode = 'none'; // Cambiar el modo de búsqueda a "ninguno"
        }
    }

    // Clic en el botón de limpiar búsqueda
    searchClear.addEventListener('click', () => {
        clearSearch();
    });

    //Funciones de los botones de la bottonbar ===================================================
    // Clic en el botón para crar un nuevo elemento
    newElement.addEventListener('click', async () => {
        let confirm;
        // Si estamos en la vista de llaves, mostrar el modal para crear una tarjeta
        if (mode === 'keys') {
            confirm = await showNewEditCardModal('create');
        }
        else if (mode === 'notes') {
            // Si estamos en la vista de notas, mostrar el modal para crear una nota
            confirm = await showNewEditNoteModal('create');
        }

        if (confirm.success) {
            actualPreparedElements.push(confirm.generated);
            showContent(actualPreparedElements); // Mostrar los elementos actualizados en la vista
        }
        if (confirm.message) showToast(confirm.message);
    });

    // Clic en el botón para editar un elemento seleccionado
    editElement.addEventListener('click', async () => {
        if (selectedPreparedElement) {
            let selectedElement;
            if (mode === 'keys') {
                selectedElement = await window.electronAPI.decryptPreparedCard(selectedPreparedElement);
            }
            else if (mode === 'notes') {
                selectedElement = await window.electronAPI.decryptPreparedNote(selectedPreparedElement);
            }

            // Si el elemento se descifró correctamente, mostrar el modal de edición
            if (selectedElement.success) {
                let confirm;
                if (mode === 'keys') {
                    confirm = await showNewEditCardModal('edit', selectedElement.data);
                } else if (mode === 'notes') {
                    confirm = await showNewEditNoteModal('edit', selectedElement.data);
                }

                if (confirm.success) {
                    const actualIndex = actualPreparedElements.findIndex(element => element.id == selectedElement.data.id);
                    // Actualizar el elemento en la lista de elementos preparados que se está mostrando
                    actualPreparedElements[actualIndex] = confirm.edited;
                    if (searchMode === 'searching') {
                        showContent(search(searchTerm));
                    } else if (searchMode === 'none') {
                        showContent(actualPreparedElements);
                    }
                }
                if (confirm.message) showToast(confirm.message);
            } else {
                showToast(selectedElement.message);
            }
        }
    });

    // Clic en el botón para eliminar el elemento seleccionado
    deleteElement.addEventListener('click', async () => {
        if (selectedPreparedElement) {
            const confirm = await showDeleteModal(selectedPreparedElement, mode);
            if (confirm.success) {
                // Eliminar el elemento de la lista de elementos mostrados
                const actualIndex = actualPreparedElements.findIndex(element => element.id == selectedPreparedElement.id);
                actualPreparedElements.splice(actualIndex, 1);

                showContent(actualPreparedElements); // Mostrar los elementos actualizados en la vista
            }
            if (confirm.message) showToast(confirm.message);
        }
    });

    // Acciones de elementos mediante delegación de eventos ======================================
    // Sidebar......................................................................
    sidebar.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Clic en botón bloquear
        if (buttonPressed.id === 'lock-btn') {
            window.electronAPI.changeView('src/views/lock.html');
        }

        // Clic en botón Acerca de
        if (buttonPressed.id === 'app-btn') {
            await showAboutModal();
        }
    });

    // Clic en los radios de la sidebar
    keysRadio.addEventListener('click', () => {
        if (keysRadio.querySelector('input[type="radio"]').checked) {
            showKeysView(); // Mostrar la vista de llaves
        }
    });

    notesRadio.addEventListener('click', () => {
        if (notesRadio.querySelector('input[type="radio"]').checked) {
            showNotesView(); // Mostrar la vista de notas
        }
    });

    settingsRadio.addEventListener('click', () => {
        if (settingsRadio.querySelector('input[type="radio"]').checked) {
            showSettingsView(); // Mostrar la vista de configuración
        }
    });

    // Main content ==============================================================================
    commandOptionsBar.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir
        else {
            // Si se presiona un botón de opción 2
            if (buttonPressed.classList.contains('option-btn2')) {
                const option = buttonPressed.getAttribute('data-option');
                searchInput.value = `>>${option}:`; // Establecer el valor del campo de búsqueda
                // enfocar el campo de búsqueda
                searchInput.focus();
            }
            else {
                const option = buttonPressed.getAttribute('data-option');
                await executeCommand(option); // Ejecutar el comando correspondiente
                clearSearch(); // Limpiar la búsqueda
            }
        }
    });

    mainContent.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (event.target.id === 'main-content') deselectAllElements();

        else if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Si el botón es un botón de enlace externo de una tarjeta
        else if (buttonPressed.classList.contains('external-link-btn')) {
            const url = buttonPressed.getAttribute('data-url');
            if (url) {
                window.electron.openExternal(url);
            }
        }
        // Si el botón es un botón de ojo para mostrar/ocultar contraseña
        else if (buttonPressed.classList.contains('eye-btn')) {
            const mask = '••••••••';

            if (mode === 'keys') {
                // Obtener el ID de la tarjeta y los elementos de usuario y contraseña
                const cardID = buttonPressed.getAttribute('data-cardID');
                const userID = buttonPressed.getAttribute('data-userID');
                const userView = document.getElementById(userID);
                const passID = buttonPressed.getAttribute('data-passID');
                const passView = document.getElementById(passID);

                // Cambiar el texto del usuario y la contraseña al hacer clic en el botón
                if (passView.textContent === mask) {
                    const preparedCard = actualPreparedElements.find(card => card.id == cardID);
                    const card = await window.electronAPI.decryptPreparedCard(preparedCard);
                    if (card.success) {
                        userView.textContent = card.data.user;
                        passView.textContent = card.data.password;
                        // 🔥 Copiamos al portapapeles
                        navigator.clipboard.writeText(card.data.password).then(() => {
                            // Mostrar una notificación visual
                            showToast(translations['copied']);
                        }).catch(err => {
                            console.error(err);
                            showToast(translations['copied-error']);
                        });
                    } else {
                        showToast(card.message);
                    }
                }
                else {
                    userView.textContent = mask;
                    passView.textContent = mask;
                }
            }
            else if (mode === 'notes') {
                // Obtener el ID de la nota y del contenido
                const noteID = buttonPressed.getAttribute('data-noteID');
                const contentID = buttonPressed.getAttribute('data-contentID');
                const contentView = document.getElementById(contentID);

                // Cambiar el texto del contenido al hacer clic en el botón
                if (contentView.textContent === mask) {
                    const preparedNote = actualPreparedElements.find(note => note.id == noteID);
                    const note = await window.electronAPI.decryptPreparedNote(preparedNote);
                    if (note.success) {
                        contentView.textContent = note.data.content;
                    } else {
                        showToast(note.message);
                    }
                }
                else {
                    contentView.textContent = mask;
                    contentView.textContent = mask;
                }
            }
        }
    });

    // Escuchar cambios
    mainContent.addEventListener('change', (event) => {
        const elementPressed = event.target.closest('input[name="mainElement"]');
        if (!elementPressed) return; // Si no se hizo clic en un elemento, salir

        // Si se selecciona un elemento, mostrar los botones de editar y eliminar
        if (elementPressed.checked) {
            deselectAllElements(); // Deseleccionar todos los elementos
            selectedElementID = elementPressed.value;
            selectedPreparedElement = actualPreparedElements.find(element => element.id == selectedElementID);
            const elementBody = document.getElementById(selectedElementID);

            // Establecer el color personalizado como una variable CSS
            elementBody.style.setProperty('--element-color', elementBody.style.backgroundColor);

            // Agregar la clase para aplicar la sombra
            elementBody.classList.add('selected-element');

            showEditDeleteButtons(); // Mostrar los botones de editar y eliminar
        }
    });

    // Página de configuraciones =================================================================
    settingsArea.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Clic en botón editar ID
        if (buttonPressed.id === 'edit-ID') {
            const confirm = await showIDModal('edit-data', superuser);
            if (confirm.success) {
                showToast(confirm.message);
                await applySettings(); // Aplicar las nuevas configuraciones
                createSettingsPage(superuser);
            } else if (confirm.error) {
                showToast(confirm.error, true);
            }
        }
        // Clic en botón cambiar contraseña
        else if (buttonPressed.id === 'edit-password') {
            const confirm = await showIDModal('edit-password', superuser);
            if (confirm.success) {
                loadContent(); // Recargar el contenido
                showToast(confirm.message);
            } else if (confirm.error) {
                showToast(confirm.error, true);
            }
        }
        // Clic en botón exportar llaves
        else if (buttonPressed.id === 'export-keys') {
        }

        // Clic en botón eliminar ID
        else if (buttonPressed.id === 'delete-ID') {
            const confirm = await showDeleteIDModal();
            if (confirm.success) {
                window.electronAPI.executeCommand('relaunch');
            } else if (confirm.error) showToast(confirm.error, true);
        }

        // Clic en el botón para elegir idioma
        else if (buttonPressed.id === 'choose-language') {
            popupList.innerHTML = ''; // Limpiar la lista de idiomas
            const availableLanguages = constants['languages'];
            availableLanguages.forEach(lang => {
                popupList.appendChild(createPopupOption('language', lang.code, lang.name));
            });
            // Mostrar la lista
            showPopupList(event);
        }

        // Clic en el botón para elegir un wallpaper personalizado
        else if (buttonPressed.id === 'custom-wallpaper-btn') {
            const result = await window.electronAPI.setCustomWallpaper();
            if (result.success) {
                showToast(result.message);
                await applySettings(); // Aplicar las nuevas configuraciones
            } else {
                showToast(result.error, true);
            }
        }

        // Clic en botón acerca de
        else if (buttonPressed.id === 'view-info-about') {
            await showAboutModal();
        }

        // Clic en botón ver licencia
        else if (buttonPressed.id === 'view-license') {
            await showLicenseModal();
        }
    });

    // Escuchar cambios en los wallpaper options
    settingsArea.addEventListener('change', async (event) => {
        const radioPressed = event.target.closest('input[name="settings-wallpaper-option"]');
        if (!radioPressed) return; // Si no se hizo clic en un radio, salir

        const selectedOption = radioPressed.value;
        // Guardar la opción seleccionada
        const result = await window.electronAPI.setSetting('wallpaper', selectedOption);
        if (result.success) {
            await applySettings(); // Aplicar las nuevas configuraciones
        } else {
            showToast(result.error, true);
        }
    });

    // Escuchar cambios en el switch de motion background
    settingsArea.addEventListener('change', async (event) => {
        const switchPressed = event.target.closest('input[type="checkbox"]');
        if (!switchPressed) return; // Si no se hizo clic en el switch, salir
        if (switchPressed.id === 'motion-toggle-input') {
            const isEnabled = switchPressed.checked;
            // Guardar la opción seleccionada
            const result = await window.electronAPI.setSetting('wallpaperMode', isEnabled ? 'video' : 'image');
            if (!result.success) {
                showToast(result.error, true);
            }
        }
    });

    // Clic fuera del popup para cerrarlo
    document.addEventListener('click', (event) => {
        if (!popupList.contains(event.target) && event.target.id !== 'choose-language') {
            popupList.style.display = 'none';
        }
    });

    // Selección de opción en el popup list
    popupList.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir
        const optionType = buttonPressed.getAttribute('data-option-type');;
        const optionValue = buttonPressed.getAttribute('data-option-value');

        // Si se selecciona un idioma
        if (optionType === 'language') {
            const result = await window.electronAPI.setSetting('language', optionValue);
            if (result.success) {
                await applySettings(); // Aplicar las nuevas configuraciones
                title.textContent = translations['settings']; // Cambiar el título de la vista
                showToast(translations['language-changed']);
            }
        }

        // Ocultar la lista de opciones
        popupList.style.display = 'none';
    });

    // Función para ejecutar comandos ============================================================
    async function executeCommand(command) {
        // ejecutar el comando correspondiente
        const result = await window.electronAPI.executeCommand(command);
        if (result.success) {
            showToast(result.message);
            await applySettings(); // Aplicar las nuevas configuraciones si las hay
            createSettingsPage(superuser); // Recrear la página de configuración si las hay
        } else showToast(result.message, true);
        clearSearch(); // Limpiar la búsqueda
    }

    // Función del toast notification ============================================================
    function showToast(message, error = false) {
        const toast = document.createElement('div');
        error ? toast.classList.add('toast-warning') : toast.classList.add('toast');
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Eliminarlo después de que desaparezca
        setTimeout(() => {
            toast.remove();
        }, 5000); // 5 segundos de duración total
    }
    // Aplicar configuraciones ===================================================================
    async function applySettings() {
        // Actualizar la información del superusuario e idiomas
        superuser = await window.electronAPI.getUserInfo();
        translations = await window.electronAPI.getTranslations('home-view');
        cardTranslations = await window.electronAPI.getTranslations('card');

        // Cargar traducciones y mostrarlas en la interfaz estática
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                el.textContent = translations[key];
            }
        });
        searchInput.placeholder = translations['search'];

        // Cargar las traducciones para el módulo de traducción
        setTranslations(translations);

        // Obtener configuraciones a utilizar
        const colorStyle = await window.electronAPI.getSetting('colorStyle');

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

        // Mostrar mensaje de bienvenida si es la primera vez que se abre la aplicación
        const welcomeMessageDisplayed = await window.electronAPI.getSetting('welcomeMessageDisplayed');
        if (!welcomeMessageDisplayed) {
            const confirm = await showWelcomeModal();
            if (confirm.success) {
                // Marcar que el mensaje de bienvenida ya fue mostrado
                await window.electronAPI.setSetting('welcomeMessageDisplayed', true);
            }
        }
        createSettingsPage(superuser); // Crear la página de configuración
    }

    // Hollydays =================================================================================
    function checkHollydays() {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Los meses van de 0 a 11

        // Icono navideño todo el mes de diciembre
        if (month === 12) {
            document.getElementById('app-icon').src = '../assets/ico/sanctuary-christmas.png';
        }
    }

    // Acciones iniciales ========================================================================
    await applySettings();
    checkHollydays();
    await loadContent(); // Cargar el contenido inicial
});
