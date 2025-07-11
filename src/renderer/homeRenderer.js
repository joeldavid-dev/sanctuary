import { setTranslations, translate } from './utils/translate.js';
import { createCardElement } from './components/card.js'; // Importar el módulo de tarjeta
import { showNewEditModal } from './components/modalNewEdit.js'; // Importar el módulo de modal para agregar o editar tarjetas
import { showDeleteModal } from './components/modalDelete.js'; // Importar el módulo de modal para eliminar una tarjeta
import { showSettings } from './components/settings.js';
// Barra de título
const minimize = document.getElementById('minimize');
const maximize = document.getElementById('maximize');
const close = document.getElementById('close');
const title = document.getElementById('title');
const searchArea = document.getElementById('search-area');
const search = document.getElementById('search');
const searchClear = document.getElementById('search-clear');

// Sidebar
const sidebar = document.getElementById('sidebar');
const keysRadio = document.getElementById('keys-radio');
const notesRadio = document.getElementById('notes-radio');
const settingsRadio = document.getElementById('settings-radio');

// Contenedor principal
const mainContent = document.getElementById('main-content');
// Bottonbar
const bottonBar = document.getElementById('botton-bar');
const editCard = document.getElementById('edit-card');
const editCardBody = document.getElementById('edit-card-body');
const newCard = document.getElementById('new-card');
const deleteCard = document.getElementById('delete-card');
const deleteCardBody = document.getElementById('delete-card-body');

let mode = 'keys'; // Variable para controlar el modo actual de la vista (llaves, notas o configuración)
let searching = false; // Variable para controlar si se está buscando
let encryptedSelectedCard = null; // Variable para almacenar el ID de la tarjeta seleccionada
let selectedCardID = null; // Variable para almacenar el índice de la tarjeta seleccionada
let encryptedCards = []; // Variable para almacenar las tarjetas
let actualEncryptedCards = []; // Lista que almacena las tarjetas mostradas en la vista

document.addEventListener("DOMContentLoaded", async () => {
    const translations = await window.electronAPI.getTranslations('home-view');
    const cardTranslations = await window.electronAPI.getTranslations('card');

    // Cargar traducciones y mostrarlas en la interfaz estática
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
    search.placeholder = translations['search'];

    // Cargar las traducciones para el módulo de traducción
    setTranslations(translations);

    // Funciones del contenedor principal ====================================================
    // Traer los datos al iniciar la vista
    async function getAllCards() {
        const result = await window.electronAPI.getAllCards();
        if (result.success) {
            return result.data; // Retornar las tarjetas encriptadas
        } else {
            showToast(result.message);
            return []; // Retornar una lista vacía si falla
        }
    }

    async function showCards(cards) {
        // Limpiar el contenedor de tarjetas antes de agregar nuevas
        mainContent.innerHTML = '';
        deselectAllCards(); // Deseleccionar todas las tarjetas
        if (cards.length > 0) {
            // Crear y agregar cada tarjeta al contenedor
            cards.forEach((card, index) => {
                mainContent.appendChild(createCardElement(card, index, cardTranslations));
            });
        } else {
            mainContent.innerHTML = `
            <div class="vertical-flex centered">
                <img src="../assets/illustrations/FeelingLonely.svg" alt="No cards" class="empty-image">
                <p>${translations['empty']}</p>
            </div>`;
        }
        actualEncryptedCards = cards; // Actualizar la lista de tarjetas mostradas en la vista
    }

    // Funcion para deseleccionar todas las tarjetas
    function deselectAllCards() {
        /// Quitar la clase 'selected-card' de todas las tarjetas
        document.querySelectorAll('.card-body').forEach((card) => {
            card.classList.remove('selected-card');
        });
        editCardBody.classList.add('invisible'); // Ocultar el contenedor de edición
        editCardBody.classList.remove('vertical-flex');
        deleteCardBody.classList.add('invisible'); // Ocultar el botón de eliminar
        deleteCardBody.classList.remove('vertical-flex');

        selectedCardID = null;
        encryptedSelectedCard = null;

        // Deseleccionar todos los radio
        document.querySelectorAll('input[type="radio"][name="card"]').forEach((radio) => {
            radio.checked = false;
        });
    }

    function showEditDeleteButtons() {
        editCardBody.classList.remove('invisible'); // Mostrar el contenedor de edición
        editCardBody.classList.add('vertical-flex');
        deleteCardBody.classList.remove('invisible'); // Mostrar el botón de eliminar
        deleteCardBody.classList.add('vertical-flex');
    }

    // Funciones de estado de la vista ============================================================
    function showKeysView() {
        showCards(encryptedCards); // Mostrar las tarjetas en la vista
        title.textContent = translations['my-keys']; // Cambiar el título de la vista
        searchArea.style.display = 'flex'; // Mostrar la barra de búsqueda en la vista de llaves
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones en la vista de llaves
        mode = 'keys'; // Cambiar el modo a llaves
    }

    function showNotesView() {
        console.log('Mostrar vista de notas'); // Aquí se implementaría la lógica para mostrar las notas
        title.textContent = translations['my-notes']; // Cambiar el título de la vista
        searchArea.style.display = 'flex'; // Mostrar la barra de búsqueda en la vista de notas
        bottonBar.style.display = 'flex'; // Mostrar la barra de botones en la vista de notas
        mode = 'notes'; // Cambiar el modo a notas
    }

    function showSettingsView() {
        console.log('Mostrar vista de configuración'); // Aquí se implementaría la lógica para mostrar la configuración
        title.textContent = translations['settings']; // Cambiar el título de la vista
        searchArea.style.display = 'none'; // Ocultar la barra de búsqueda en la vista de configuración
        bottonBar.style.display = 'none'; // Ocultar la barra de botones en la vista de configuración
        mode = 'settings'; // Cambiar el modo a configuración
        showSettings(); // Llamar a la función para mostrar la vista de configuración
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
    search.addEventListener('input', async (event) => {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm.length > 0) {
            const filteredCards = encryptedCards.filter(card => card.name.toLowerCase().includes(searchTerm));
            showCards(filteredCards);
            if (!searching) {
                document.getElementById('search-clear-ico').src = '../assets/ico/feather/x.svg'; // Cambiar el icono de búsqueda a "x"
                searching = true; // Cambiar el estado de búsqueda a verdadero
            }
        } else {
            showCards(encryptedCards); // Mostrar todas las tarjetas si no hay término de búsqueda
            searching = false; // Cambiar el estado de búsqueda a falso
            document.getElementById('search-clear-ico').src = '../assets/ico/feather/search.svg'; // Cambiar el icono de búsqueda a "lupa"
        }
    });

    // Clic en el botón de limpiar búsqueda
    searchClear.addEventListener('click', () => {
        if (searching) {
            search.value = ''; // Limpiar el campo de búsqueda
            showCards(encryptedCards); // Mostrar todas las tarjetas
            searching = false; // Cambiar el estado de búsqueda a falso
            document.getElementById('search-clear-ico').src = '../assets/ico/feather/search.svg'; // Cambiar el icono de búsqueda a "lupa"
        }
    });

    //Funciones de los botones de la butonbar ====================================================
    // Clic en el botón para crar una nueva tarjeta
    newCard.addEventListener('click', async () => {
        const confirm = await showNewEditModal('create');
        if (confirm.success) {
            encryptedCards.push(confirm.generatedCard);
            showCards(encryptedCards);
        }
        if (confirm.message) showToast(confirm.message);
    });

    // Clic en el botón para editar la tarjeta seleccionada
    editCard.addEventListener('click', async () => {
        if (encryptedSelectedCard) {
            // Desencriptar la tarjeta seleccionada
            const selectedCard = await window.electronAPI.decryptCard(encryptedSelectedCard);
            if (selectedCard.success) {
                const confirm = await showNewEditModal('edit', selectedCard.data);
                if (confirm.success) {
                    // Actualizar la tarjeta en la lista de tarjetas encriptadas que se está mostrando
                    const actualIndex = actualEncryptedCards.findIndex(card => card.id == selectedCard.data.id);
                    actualEncryptedCards[actualIndex] = confirm.editedCard;

                    // Actualizar la tarjeta en la lista de tarjetas encriptadas
                    const index = encryptedCards.findIndex(card => card.id == selectedCard.data.id);
                    encryptedCards[index] = confirm.editedCard;

                    showCards(actualEncryptedCards);
                }
                if (confirm.message) showToast(confirm.message);
            } else {
                showToast(selectedCard.message);
            }
        }
    });

    // Clic en el botón para eliminar la tarjeta seleccionada
    deleteCard.addEventListener('click', async () => {
        if (encryptedSelectedCard) {
            const confirm = await showDeleteModal(encryptedSelectedCard);
            if (confirm.success) {
                // Eliminar la tarjeta en la lista de tarjetas encriptadas que se está mostrando
                const actualIndex = actualEncryptedCards.findIndex(card => card.id == encryptedSelectedCard.id);
                actualEncryptedCards.splice(actualIndex, 1);

                // Eliminar la tarjeta en la lista de tarjetas encriptadas
                const index = encryptedCards.findIndex(card => card.id == encryptedSelectedCard.id);
                encryptedCards.splice(index, 1);

                showCards(actualEncryptedCards); // Mostrar las tarjetas en la vista
            }
            if (confirm.message) showToast(confirm.message);
        }
    });

    // Acciones de elementos mediante delegación de eventos ======================================
    // Sidebar......................................................................
    sidebar.addEventListener('click', (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Clic en botón bloquear
        if (buttonPressed.id === 'lock-btn') {
            window.electronAPI.changeView('src/views/lock.html');
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

    // Main content ..............................................................
    mainContent.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (event.target.id === 'main-content') deselectAllCards();

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
            const cardID = buttonPressed.getAttribute('data-cardID');
            const userID = buttonPressed.getAttribute('data-userID');
            const userView = document.getElementById(userID);
            const passID = buttonPressed.getAttribute('data-passID');
            const passView = document.getElementById(passID);
            const mask = '••••••••';

            // Cambiar el texto del usuario y la contraseña al hacer clic en el botón
            if (passView.textContent === mask) {
                const encryptedCard = encryptedCards.find(card => card.id == cardID);
                const card = await window.electronAPI.decryptCard(encryptedCard);
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
                    console.error(card);
                    showToast(card.message);
                }
            }
            else {
                userView.textContent = mask;
                passView.textContent = mask;
            }
        }
    });

    // Escuchar cambios
    mainContent.addEventListener('change', (event) => {
        const cardPressed = event.target.closest('input[name="card"]');
        if (!cardPressed) return; // Si no se hizo clic en una tarjeta, salir

        // Si se selecciona una tarjeta, mostrar los botones de editar y eliminar
        if (cardPressed.checked) {
            deselectAllCards(); // Deseleccionar todas las tarjetas
            selectedCardID = cardPressed.value;
            encryptedSelectedCard = encryptedCards.find(card => card.id == selectedCardID);
            const cardBody = document.getElementById(selectedCardID);

            // Establecer el color personalizado como una variable CSS
            cardBody.style.setProperty('--card-color', cardBody.style.backgroundColor);

            // Agregar la clase para aplicar la sombra
            cardBody.classList.add('selected-card');

            showEditDeleteButtons(); // Mostrar los botones de editar y eliminar
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

    // Acciones iniciales ========================================================================
    encryptedCards = await getAllCards(); // Obtener todas las tarjetas y almacenarlas en la variable local
    showKeysView(); // Mostrar la vista de inicio
});
