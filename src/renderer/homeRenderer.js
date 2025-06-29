import { setTranslations, translate } from './utils/translate.js';
import { createCardElement } from './components/card.js'; // Importar el módulo de tarjeta
import { showNewEditModal } from './components/modalNewEdit.js'; // Importar el módulo de modal para agregar o editar tarjetas

const minimize = document.getElementById('minimize');
const maximize = document.getElementById('maximize');
const close = document.getElementById('close');

const sidebar = document.getElementById('sidebar');
const cardsContainer = document.getElementById('cards-container');

const editCard = document.getElementById('edit-card');
const editCardBody = document.getElementById('edit-card-body');
const newCard = document.getElementById('new-card');
const deleteCard = document.getElementById('delete-card');
const deleteCardBody = document.getElementById('delete-card-body');

// Modal warning
const modalWarning = document.getElementById('modal-warning');
const closeModalWarning = document.getElementById('close-modal-warning');
const warningMessage = document.getElementById('warning-message');
const cancelWarningBtn = document.getElementById('cancel-warning-btn');
const confirmWarningBtn = document.getElementById('confirm-warning-btn');

let encryptedSelectedCard = null; // Variable para almacenar el ID de la tarjeta seleccionada
let selectedCardIndex = null; // Variable para almacenar el índice de la tarjeta seleccionada
let modalWarningAction = null; // Variable para almacenar la acción del modal de advertencia
let encryptedCards = null; // Variable para almacenar las tarjetas
let modalMode = 'create'; // Variable para almacenar el modo del modal (crear o editar)

document.addEventListener("DOMContentLoaded", async () => {
    const translations = await window.electronAPI.getTranslations('home-view');
    const cardTranslations = await window.electronAPI.getTranslations('card');
    const warningTranslations = await window.electronAPI.getTranslations('warning');

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

    // Funciones del contenedor principal ====================================================
    // Traer los datos al iniciar la vista
    async function getAllCards() {
        try {
            return await window.electronAPI.getAllCards();
        } catch (error) {
            console.error(error);
        }
    }

    async function showCards(cards) {
        // Limpiar el contenedor de tarjetas antes de agregar nuevas
        cardsContainer.innerHTML = '';
        deselectAllCards(); // Deseleccionar todas las tarjetas
        if (cards.success) {
            // Crear y agregar cada tarjeta al contenedor
            cards.data.forEach((card, index) => {
                cardsContainer.appendChild(createCardElement(card, index, cardTranslations));
            });
        } else {
            cardsContainer.textContent = 'No se pudieron cargar las tarjetas 😕';
        }
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

        selectedCardIndex = null;
        encryptedSelectedCard = null;
    }

    function showEditDeleteButtons() {
        editCardBody.classList.remove('invisible'); // Mostrar el contenedor de edición
        editCardBody.classList.add('vertical-flex');
        deleteCardBody.classList.remove('invisible'); // Mostrar el botón de eliminar
        deleteCardBody.classList.add('vertical-flex');
    }

    //Funciones de los botones de la butonbar ================================================
    // Clic en el botón para crar una nueva tarjeta
    newCard.addEventListener('click', async () => {
        modalMode = 'create'; // Establecer el modo del modal a crear
        const confirm = await showNewEditModal(modalMode);
        if (confirm.success){
            encryptedCards.data.push(confirm.generatedCard);
            showCards(encryptedCards);
        }
        showToast(confirm.message);
    });

    // Clic en el botón para editar la tarjeta seleccionada
    editCard.addEventListener('click', async () => {
        if (encryptedSelectedCard) {
            // Desencriptar la tarjeta seleccionada
            const selectedCard = await window.electronAPI.decryptCard(encryptedSelectedCard);
            if (selectedCard.success) {
                modalMode = 'edit'; // Establecer el modo del modal a editar
                const confirm = await showNewEditModal(modalMode, selectedCard.data);
                if (confirm.success){
                    encryptedCards.data[selectedCardIndex] = confirm.editedCard;
                    showCards(encryptedCards);
                }
                showToast(confirm.message);
            } else {
                showToast(selectedCard.message);
            }
        }
    });

    // Clic en el botón para eliminar la tarjeta seleccionada
    deleteCard.addEventListener('click', async () => {
        modalWarning.style.display = 'block';
        modalWarningAction = 'delete'; // Establecer la acción del modal de advertencia
        const message =
            warningMessage.textContent = `¿Realmente quieres eliminar la tarjeta "${encryptedSelectedCard.name}"? Ten cuidado, ¡esta acción es irreversible!`;
        confirmWarningBtn.textContent = 'Eliminar tarjeta';
    });

    // Modal warning =============================================================================
    // Clic en el botón para cerrar el modal de advertencia
    closeModalWarning.addEventListener('click', () => {
        modalWarning.style.display = 'none';
    });

    // Clic en el botón para cancelar la advertencia
    cancelWarningBtn.addEventListener('click', () => {
        modalWarning.style.display = 'none';
    });

    // Clic en el botón para confirmar la advertencia
    confirmWarningBtn.addEventListener('click', async () => {
        // Eliminar la tarjeta seleccionada
        if (modalWarningAction === 'delete') {
            const result = await window.electronAPI.deleteCard(encryptedSelectedCard.id);
            if (result.success) {
                // Mostrar notificación de éxito
                showToast(result.message);
                modalWarning.style.display = 'none';
                deselectAllCards();
                // Eliminar la tarjeta de la lista de tarjetas encriptadas usando el índice
                encryptedCards.data.splice(selectedCardIndex, 1);
                showCards(encryptedCards); // Mostrar las tarjetas en la vista
            }
            else {
                showToast(result.message);
            }
        }
    });

    // Acciones de elementos mediante delegación de eventos ======================================
    // Sidebar......................................................................
    sidebar.addEventListener('click', (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir

        // Clic en botón bloquear
        if (buttonPressed.id === 'lock') {
            window.electronAPI.changeView('src/views/lock.html');
        }
    });

    // Cards container..............................................................
    cardsContainer.addEventListener('click', async (event) => {
        const buttonPressed = event.target.closest('button');
        if (event.target.id === 'cards-container') deselectAllCards();

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
            const index = buttonPressed.getAttribute('data-index');
            const userId = buttonPressed.getAttribute('data-userId');
            const userView = document.getElementById(userId);
            const passId = buttonPressed.getAttribute('data-passId');
            const passView = document.getElementById(passId);
            const mask = '••••••••';

            // Cambiar el texto del usuario y la contraseña al hacer clic en el botón
            if (passView.textContent === mask) {
                const card = await window.electronAPI.decryptCard(encryptedCards.data[index]);
                if (card.success) {
                    userView.textContent = card.data.user;
                    passView.textContent = card.data.password;
                    // 🔥 Copiamos al portapapeles
                    navigator.clipboard.writeText(card.data.password).then(() => {
                        // Mostrar una notificación visual
                        showToast('Contraseña copiada al portapapeles');
                    }).catch(err => {
                        console.error(err);
                        showToast('Error al copiar al portapapeles');
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
    cardsContainer.addEventListener('change', (event) => {
        const cardPressed = event.target.closest('input[name="card"]');
        if (!cardPressed) return; // Si no se hizo clic en una tarjeta, salir

        // Si se selecciona una tarjeta, mostrar los botones de editar y eliminar
        if (cardPressed.checked) {
            deselectAllCards(); // Deseleccionar todas las tarjetas
            selectedCardIndex = cardPressed.value;
            encryptedSelectedCard = encryptedCards.data[selectedCardIndex];
            const cardBody = document.getElementById(encryptedSelectedCard.id);

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
    showCards(encryptedCards); // Mostrar las tarjetas en la vista
});
