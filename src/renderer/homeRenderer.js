import { createCardElement } from './components/card.js'; // Importar el módulo de tarjeta
import { createNoteElement } from './components/note.js'; // Importar el módulo de nota
import { showNewEditCardModal } from './components/modalNewEditCard.js'; // Importar el módulo de modal para agregar o editar tarjetas
import { showNewEditNoteModal } from './components/modalNewEditNote.js'; // Importar el módulo de modal para agregar o editar notas
import { showDeleteModal } from './components/modalDelete.js'; // Importar el módulo de modal para eliminar una tarjeta
import { showIDModal } from './components/modalID.js';
import { createSettingsPage } from './components/settingsPage.js';
import { createCommandOption } from './components/commandOption.js';
import { showDeleteIDModal } from './components/modalDeleteID.js';
import { showTextModal } from './components/modalText.js';
import { showAboutModal } from './components/modalAbout.js';
import { showWelcomeModal } from './components/modalWelcome.js';
import { createPopupOption } from './components/popupOption.js';
import { replaceKeysInText } from "./utils/translationsUtils.js";

// Barra de título
const titleBar = document.getElementById('title-bar');
const title = document.getElementById('title');
const searchArea = document.getElementById('search-area');
const searchInput = document.getElementById('search-input');
const orderArea = document.getElementById('order-area');
const orderLabel = document.getElementById('order-label');
const sortToggleIco = document.getElementById('sort-toggle-ico');
const friendlyReminder = document.getElementById('friendly-reminder');

// Sidebar
const sidebar = document.getElementById('sidebar');
const keysRadio = document.getElementById('keys-radio');
const notesRadio = document.getElementById('notes-radio');
const settingsRadio = document.getElementById('settings-radio');
const updateImg = document.getElementById('update-img');
const updateContainer = document.getElementById('update-container');
const appIcon = document.getElementById('app-icon');

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
let actualPage = '';
let searchMode = 'none'; // Variable para controlar el modo de búsqueda
let searchTerm = ''; // Término de búsqueda actual
let orderDirection = 'asc'; // Variable para controlar la dirección del ordenamiento
let orderBy = 'date'; // Variable para controlar el criterio de ordenamiento

let selectedPreparedElement = null; // Variable para almacenar el elemento seleccionado
let selectedElementID = null; // Variable para almacenar el ID del elemento seleccionada
let actualPreparedElements = []; // Lista que almacena los elementos mostrados en la vista
let preparedCards = []; // Lista que almacena las tarjetas preparadas (nombre y web desencriptados)
let preparedNotes = []; // Lista que almacena las notas preparadas (contenido desencriptado)

document.addEventListener("DOMContentLoaded", async () => {
    let translations = null;
    let cardTranslations = null;
    let updateTranslations = null;

    const constants = await window.sanctuaryAPI.getConstants();

    // Superusuario
    let superuser = null;

    // Carga los comandos disponibles
    const commands = constants['available_commands'];

    // Escuchar el progreso de preparación de tarjetas
    window.sanctuaryAPI.on('prepare-elements-progress', (progress) => {
        placeholderLoading.textContent = `${translations['placeholder-loading']} ${progress}%`;
    });

    // Escuchar el progreso de descarga de la actualización
    window.sanctuaryAPI.on('download-progress', (progressInfo) => {
        showUpdateInfo(); // Mostrar la información de actualización disponible
        updateImg.classList.add('up-down-animation');
        const percent = Math.round(progressInfo.percent);
        friendlyReminder.textContent = replaceKeysInText(updateTranslations['update-downloading'], { percent: percent });
    });

    // Escuchar si la actualización se descargó completamente
    window.sanctuaryAPI.on('update-downloaded', () => {
        updateImg.classList.remove('up-down-animation');
        friendlyReminder.textContent = updateTranslations['update-downloaded'];
    });

    // Funciones del contenedor principal ========================================================
    // Traer los datos al iniciar la vista
    async function getPreparedElements() {
        const result = await window.sanctuaryAPI.getPreparedElements();
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
        // Aplicar configuración
        orderLabel.textContent = translations[`order-by-${orderBy}`];

        // Limpiar el contenedor de elementos antes de agregar nuevos
        mainContent.innerHTML = '';
        deselectAllElements(); // Deseleccionar todos los elementos

        // Ordenar el contenido según el criterio seleccionado
        if (orderBy === 'date') {
            content.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        else if (orderBy === 'name') {
            content.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (orderBy === 'color') {
            content.sort((a, b) => a.color.localeCompare(b.color));
        }
        else if (orderBy === 'only-favorites') {
            content = content.filter(element => element.favorite);
        }

        // Dirección del ordenamiento
        if (orderDirection === 'desc') {
            // Invertir el orden de content
            content = content.slice().reverse();
        }

        if (content && content.length > 0) {
            // Crear y agregar cada elemento al contenedor
            if (actualPage === 'keys') {
                content.forEach((element, index) => {
                    mainContent.appendChild(createCardElement(element, index, cardTranslations));
                    // Agregar el nombre después de crear el elemento para evitar inyección de código malicioso
                    document.getElementById(`card-name-${element.id}`).textContent = element.name;
                    // Agregar la ruta web después de crear el elemento para evitar inyección de código malicioso
                    document.getElementById(`card-web-${element.id}`).textContent = element.web;
                });
            }
            else if (actualPage === 'notes') {
                content.forEach((element, index) => {
                    mainContent.appendChild(createNoteElement(element, index, translations));
                    // Agregar el nombre después de crear el elemento para evitar inyección de código malicioso
                    document.getElementById(`note-name-${element.id}`).textContent = element.name;
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
        document.querySelectorAll('.main-element').forEach((element) => {
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

        if (actualPage === 'keys') {
            showKeysView(); // Mostrar la vista de inicio
            keysRadio.querySelector('input[type="radio"]').checked = true;
        } else if (actualPage === 'notes') {
            showNotesView(); // Mostrar la vista de notas
            notesRadio.querySelector('input[type="radio"]').checked = true;
        }
    }

    function showKeysView() {
        clearSearch(); // Limpiar las búsquedas
        orderArea.style.display = 'flex'; // Mostrar el área de ordenamiento en la vista de llaves
        actualPage = 'keys'; // Cambiar el modo a llaves
        actualPreparedElements = preparedCards; // Obtener todas las tarjetas y almacenarlas en la lista de elementos mostrados
        showContent(actualPreparedElements); // Mostrar las tarjetas en la vista
        title.textContent = translations['my-keys']; // Cambiar el título de la vista
        searchArea.style.display = 'flex'; // Mostrar la barra de búsqueda en la vista de llaves
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones en la vista de llaves
        settingsArea.style.display = 'none'; // Ocultar el área de configuración
        mainContent.style.display = 'flex'; // Mostrar el contenedor principal
    }

    function showNotesView() {
        clearSearch(); // Limpiar las búsquedas
        orderArea.style.display = 'flex'; // Mostrar el área de ordenamiento en la vista de notas
        actualPage = 'notes'; // Cambiar el modo a notas
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
        orderArea.style.display = 'none'; // Ocultar el área de ordenamiento en la vista de configuración
        title.textContent = translations['settings']; // Cambiar el título de la vista
        searchArea.style.display = 'none'; // Ocultar la barra de búsqueda en la vista de configuración
        bottonBar.style.display = 'none'; // Ocultar la barra de botones en la vista de configuración
        settingsArea.style.display = 'flex'; // Mostrar el área de configuración
        mainContent.style.display = 'none'; // Ocultar el contenedor principal de tarjetas
        // Ir al inicio del área de configuración
        mainSection.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Función para mostrar información de actualización disponible
    function showUpdateInfo() {
        appIcon.classList.add('invisible'); // Ocultar el ícono de la aplicación
        updateContainer.classList.add('active');
        friendlyReminder.classList.remove('invisible'); // Mostrar el porcentaje de descarga
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
            top = viewportHeight - popupRect.height - 10;
        }

        popupList.style.left = `${left}px`;
        popupList.style.top = `${top}px`;
    }

    // Acciones de la titlebar ============================================================
    titleBar.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Clic en el botón de limpiar búsqueda
        if (buttonPressed.id === 'search-clear') {
            clearSearch();
        }

        // Clic en el botón de ordenamiento
        if (buttonPressed.id === 'order-btn') {
            // Limpiar el popup list
            popupList.innerHTML = '';
            popupList.appendChild(createPopupOption('orderBy', 'date', translations['order-by-date']));
            popupList.appendChild(createPopupOption('orderBy', 'name', translations['order-by-name']));
            popupList.appendChild(createPopupOption('orderBy', 'color', translations['order-by-color']));
            popupList.appendChild(createPopupOption('orderBy', 'only-favorites', translations['order-by-only-favorites']));
            showPopupList(event);
        }

        // Clic en el toggle de ordenamiento
        if (buttonPressed.id === 'sort-toggle') {
            orderDirection = orderDirection === 'asc' ? 'desc' : 'asc';
            sortToggleIco.src = orderDirection === 'asc' ? '../assets/ico/feather/arrow-up.svg' : '../assets/ico/feather/arrow-down.svg';
            if (searchMode === 'searching') {
                showContent(search(searchTerm));
            } else if (searchMode === 'none') {
                showContent(actualPreparedElements);
            }
        }

        // Clic en botón de minimizar
        if (buttonPressed.id === 'minimize') {
            window.electron.minimize();
        }

        // Clic en botón de maximizar
        if (buttonPressed.id === 'maximize') {
            window.electron.maximize();
        }

        // Clic en botón de cerrar
        if (buttonPressed.id === 'close') {
            // Guardar configuraciones de la vista
            await window.sanctuaryAPI.setSetting('lastPage', actualPage);
            await window.sanctuaryAPI.setSetting('orderDirection', orderDirection);
            await window.sanctuaryAPI.setSetting('orderBy', orderBy);
            window.electron.close();
        }
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

    // Escuchar cada pulsación de tecla en el input de búsqueda
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
            clearSearch(); // Limpiar la búsqueda
            if (command === '') {
                showToast(translations['empty-command'], true); // Mostrar mensaje si no hay comando
            }
            else {
                await executeCommand(command); // Ejecutar el comando correspondiente
            }
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

    //Funciones de los botones de la bottonbar ===================================================
    // Clic en el botón para crar un nuevo elemento
    newElement.addEventListener('click', async () => {
        let confirm;
        // Si estamos en la vista de llaves, mostrar el modal para crear una tarjeta
        if (actualPage === 'keys') {
            confirm = await showNewEditCardModal('create');
        }
        else if (actualPage === 'notes') {
            // Si estamos en la vista de notas, mostrar el modal para crear una nota
            confirm = await showNewEditNoteModal('create');
        }

        if (confirm.success) {
            actualPreparedElements.push(confirm.generated);
            if (searchMode === 'searching') {
                showContent(search(searchTerm));
            } else if (searchMode === 'none') {
                showContent(actualPreparedElements);
            }
        }
        if (confirm.message) showToast(confirm.message);
    });

    // Clic en el botón para editar un elemento seleccionado
    editElement.addEventListener('click', async () => {
        if (selectedPreparedElement) {
            let selectedElement;
            if (actualPage === 'keys') {
                selectedElement = await window.sanctuaryAPI.decryptPreparedCard(selectedPreparedElement);
            }
            else if (actualPage === 'notes') {
                selectedElement = await window.sanctuaryAPI.decryptPreparedNote(selectedPreparedElement);
            }

            // Si el elemento se descifró correctamente, mostrar el modal de edición
            if (selectedElement.success) {
                let confirm;
                if (actualPage === 'keys') {
                    confirm = await showNewEditCardModal('edit', selectedElement.data);
                } else if (actualPage === 'notes') {
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
            const confirm = await showDeleteModal(selectedPreparedElement, actualPage);
            if (confirm.success) {
                // Eliminar el elemento de la lista de elementos mostrados
                const actualIndex = actualPreparedElements.findIndex(element => element.id == selectedPreparedElement.id);
                actualPreparedElements.splice(actualIndex, 1);

                if (searchMode === 'searching') {
                    showContent(search(searchTerm));
                } else if (searchMode === 'none') {
                    showContent(actualPreparedElements);
                }
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
            // Guardar configuraciones de la vista
            await window.sanctuaryAPI.setSetting('lastPage', actualPage);
            await window.sanctuaryAPI.setSetting('orderDirection', orderDirection);
            await window.sanctuaryAPI.setSetting('orderBy', orderBy);
            window.sanctuaryAPI.lock();
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
    // Escuchar clics en la barra de opciones de comando
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
                clearSearch(); // Limpiar la búsqueda
                const option = buttonPressed.getAttribute('data-option');
                await executeCommand(option); // Ejecutar el comando correspondiente
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

            if (actualPage === 'keys') {
                // Obtener el ID de la tarjeta y los elementos de usuario y contraseña
                const cardID = buttonPressed.getAttribute('data-cardID');
                const userID = buttonPressed.getAttribute('data-userID');
                const userView = document.getElementById(userID);
                const passID = buttonPressed.getAttribute('data-passID');
                const passView = document.getElementById(passID);

                // Cambiar el texto del usuario y la contraseña al hacer clic en el botón
                if (passView.textContent === mask) {
                    const preparedCard = actualPreparedElements.find(card => card.id == cardID);
                    const card = await window.sanctuaryAPI.decryptPreparedCard(preparedCard);
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
                        buttonPressed.firstElementChild.src = '../assets/ico/feather/eye-off.svg';
                    } else {
                        showToast(card.message);
                    }
                }
                else {
                    userView.textContent = mask;
                    passView.textContent = mask;
                    buttonPressed.firstElementChild.src = '../assets/ico/feather/eye.svg';
                }
            }
            else if (actualPage === 'notes') {
                // Obtener el ID de la nota y del contenido
                const noteID = buttonPressed.getAttribute('data-noteID');
                const contentID = buttonPressed.getAttribute('data-contentID');
                const contentView = document.getElementById(contentID);

                // Cambiar el texto del contenido al hacer clic en el botón
                if (contentView.textContent === mask) {
                    const preparedNote = actualPreparedElements.find(note => note.id == noteID);
                    const note = await window.sanctuaryAPI.decryptPreparedNote(preparedNote);
                    if (note.success) {
                        contentView.textContent = note.data.content;
                        buttonPressed.firstElementChild.src = '../assets/ico/feather/eye-off.svg';
                    } else {
                        showToast(note.message);
                    }
                }
                else {
                    contentView.textContent = mask;
                    buttonPressed.firstElementChild.src = '../assets/ico/feather/eye.svg';
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
                window.sanctuaryAPI.executeCommand('relaunch');
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
            const result = await window.sanctuaryAPI.setCustomWallpaper();
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
            await showTextModal('license');
        }
    });

    // Escuchar cambios en los wallpaper options
    settingsArea.addEventListener('change', async (event) => {
        const radioPressed = event.target.closest('input[name="settings-wallpaper-option"]');
        if (!radioPressed) return; // Si no se hizo clic en un radio, salir

        const selectedOption = radioPressed.value;
        // Guardar la opción seleccionada
        const result = await window.sanctuaryAPI.setSetting('wallpaper', selectedOption);
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
            const result = await window.sanctuaryAPI.setSetting('wallpaperMode', isEnabled ? 'video' : 'image');
            if (!result.success) {
                showToast(result.error, true);
            }
        }
    });

    // Clic fuera de los popups para cerrarlos
    document.addEventListener('click', (event) => {
        if (!popupList.contains(event.target)
            && event.target.id !== 'choose-language'
            && event.target.id !== 'order-label'
            && event.target.id !== 'order-btn'
            && event.target.id !== 'order-ico') {
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
            const result = await window.sanctuaryAPI.setSetting('language', optionValue);
            if (result.success) {
                await applySettings(); // Aplicar las nuevas configuraciones
                title.textContent = translations['settings']; // Cambiar el título de la vista
                showToast(translations['language-changed']);
            }
        }

        // Si se selecciona una opción de ordenamiento
        if (optionType === 'orderBy') {
            orderBy = optionValue;
            if (searchMode === 'searching') {
                showContent(search(searchTerm));
            } else if (searchMode === 'none') {
                showContent(actualPreparedElements);
            }
        }

        // Ocultar la lista de opciones
        popupList.style.display = 'none';
    });

    // Función para ejecutar comandos ============================================================
    async function executeCommand(command) {
        // Comandos a nivel de interfaz
        if (command === 'show-log') {
            await showTextModal('log');
        } else {
            // Comandos a nivel de aplicación
            const result = await window.sanctuaryAPI.executeCommand(command);
            if (result.success) {
                showToast(result.message);
                await applySettings(); // Aplicar las nuevas configuraciones si las hay
                createSettingsPage(superuser); // Recrear la página de configuración si las hay
            } else showToast(result.message, true);
        }
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
        superuser = await window.sanctuaryAPI.getUserInfo();
        translations = await window.sanctuaryAPI.getTranslations('home-view');
        cardTranslations = await window.sanctuaryAPI.getTranslations('card');
        updateTranslations = await window.sanctuaryAPI.getTranslations('update');

        // Cargar traducciones y mostrarlas en la interfaz estática
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                el.textContent = translations[key];
            }
        });
        searchInput.placeholder = translations['search'];

        // Obtener configuraciones a utilizar
        const colorStyle = await window.sanctuaryAPI.getSetting('colorStyle');

        // Aplicar tema si es estático o generado
        if (colorStyle === "generate") {
            const appContrastLight = await window.sanctuaryAPI.getSetting('appContrastLight');
            const appContrastDark = await window.sanctuaryAPI.getSetting('appContrastDark');
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
        const welcomeMessageDisplayed = await window.sanctuaryAPI.getSetting('welcomeMessageDisplayed');
        if (!welcomeMessageDisplayed) {
            const confirm = await showWelcomeModal();
            if (confirm.success) {
                // Marcar que el mensaje de bienvenida ya fue mostrado
                await window.sanctuaryAPI.setSetting('welcomeMessageDisplayed', true);
            }
        }
        // Configuraciones en la vista principal
        actualPage = await window.sanctuaryAPI.getSetting('lastPage');
        orderDirection = await window.sanctuaryAPI.getSetting('orderDirection');
        orderBy = await window.sanctuaryAPI.getSetting('orderBy');
        sortToggleIco.src = orderDirection === 'asc' ? '../assets/ico/feather/arrow-up.svg' : '../assets/ico/feather/arrow-down.svg';
        createSettingsPage(superuser); // Crear la página de configuración
    }

    // Consultas iniciales =======================================================================
    function checkUpdateStatus() {
        window.sanctuaryAPI.isUpdateDownloaded().then(isDownloaded => {
            if (isDownloaded) {
                showUpdateInfo(); // Mostrar la información de actualización si ya fue descargada
                friendlyReminder.textContent = updateTranslations['update-downloaded'];
            }
        });
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
    checkUpdateStatus();
    checkHollydays();
    await loadContent(); // Cargar el contenido inicial
});
