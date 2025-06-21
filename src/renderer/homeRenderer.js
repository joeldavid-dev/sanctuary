import { setTranslations, translate } from './utils/translate.js';
import { createCardElement } from './components/card.js'; // Importar el módulo de tarjeta
import { createModalNewEditElement } from './components/modalNewEdit.js'; // Importar el módulo de modal para agregar o editar tarjetas

const minimize = document.getElementById('minimize');
const maximize = document.getElementById('maximize');
const close = document.getElementById('close');

const sidebar = document.getElementById('sidebar');
const cardsContainer = document.getElementById('cards-container');

const editCard = document.getElementById('edit-card');
const newCard = document.getElementById('new-card');
const deleteCardBody = document.getElementById('delete-card-body');
const deleteCard = document.getElementById('delete-card');

// Modal para agregar nueva contraseña
const modalNew = document.getElementById('modal-new');
const modalNewTitle = document.getElementById('modal-new-title');
const closeModalNew = document.getElementById('close-modal-new');
const modalBody = document.getElementById('modal-body');
//const newCardName = document.getElementById('new-card-name');
//const newCardUser = document.getElementById('new-card-user');
//const newCardPass = document.getElementById('new-card-pass');
//const newCardUrl = document.getElementById('new-card-url');
//const newFavoriteSwitch = document.getElementById('new-favorite-switch');

//const prewiewCard = document.getElementById('preview-card');
//const icoLove = document.getElementById('ico-love');
//const namePreview = document.getElementById('name-preview');
//const userPreviewSection = document.getElementById('user-preview-section');
//const userPreview = document.getElementById('user-preview');
//const passPreview = document.getElementById('pass-preview');
//const urlPreviewSection = document.getElementById('url-preview-section');
//const urlPreview = document.getElementById('url-preview');
//const openLinkPreview = document.getElementById('open-link-preview');
//const newCardDone = document.getElementById('new-card-done');

// Modal warning
const modalWarning = document.getElementById('modal-warning');
const closeModalWarning = document.getElementById('close-modal-warning');
const warningMessage = document.getElementById('warning-message');
const cancelWarningBtn = document.getElementById('cancel-warning-btn');
const confirmWarningBtn = document.getElementById('confirm-warning-btn');

let colorSelected = 'var(--color1)';
let newFavorite = 0;
let encryptedSelectedCard = null; // Variable para almacenar el ID de la tarjeta seleccionada
let selectedCardIndex = null; // Variable para almacenar el índice de la tarjeta seleccionada
let modalWarningAction = null; // Variable para almacenar la acción del modal de advertencia
let encryptedCards = null; // Variable para almacenar las tarjetas
let modalNewMode = 'create'; // Variable para almacenar el modo del modal (crear o editar)

document.addEventListener("DOMContentLoaded", async () => {
    const translations = await window.electronAPI.getTranslations('home-view');
    const modalNewEditTranslations = await window.electronAPI.getTranslations('modal-new-edit');
    const cardTranslations = await window.electronAPI.getTranslations('card');

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
            console.error('Error al obtener las tarjetas:', error);
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

            // Evento de clic a cada tarjeta
            document.querySelectorAll('input[name="card"]').forEach((radio) => {
                radio.addEventListener('change', (event) => {
                    deselectAllCards(); // Deseleccionar todas las tarjetas

                    // Obtener card seleccionada
                    selectedCardIndex = event.target.value;
                    encryptedSelectedCard = encryptedCards.data[selectedCardIndex];
                    console.log(encryptedSelectedCard);
                    const cardBody = document.getElementById(encryptedSelectedCard.id);

                    // Establecer el color personalizado como una variable CSS
                    cardBody.style.setProperty('--card-color', cardBody.style.backgroundColor);

                    // Agregar la clase para aplicar la sombra
                    cardBody.classList.add('selected-card');

                    showEditDeleteButtons(); // Mostrar los botones de editar y eliminar
                });
            });

            // Activar botones de ver/ocultar
            document.querySelectorAll('.eye-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const index = button.getAttribute('data-index');
                    const userId = button.getAttribute('data-userId');
                    const userView = document.getElementById(userId);
                    const passId = button.getAttribute('data-passId');
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
                });
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
            editCard.classList.add('invisible'); // Ocultar el contenedor de edición
            editCard.classList.remove('vertical-flex');
            deleteCard.classList.add('invisible'); // Ocultar el botón de eliminar
            deleteCard.classList.remove('vertical-flex');
        });
    }

    function showEditDeleteButtons() {
        editCard.classList.remove('invisible'); // Mostrar el contenedor de edición
        editCard.classList.add('vertical-flex');
        deleteCard.classList.remove('invisible'); // Mostrar el botón de eliminar
        deleteCard.classList.add('vertical-flex');
    }

    //Funciones de los botones de la butonbar ================================================
    // Clic en el botón para crar una nueva tarjeta
    newCard.addEventListener('click', async () => {
        modalNewMode = 'create'; // Establecer el modo del modal a crear
        // Abrir modal
        modalNew.style.display = 'block';
        // Reiniciar el estado del modal
        modalNewTitle.textContent = modalNewEditTranslations['title-new'];
        // Insertar contenido
        modalBody.innerHTML = createModalNewEditElement(modalNewEditTranslations).innerHTML;
        //icoLove.style.display = 'none';
        //newFavoriteSwitch.checked = false;
        //userPreviewSection.style.display = 'none';
        //urlPreviewSection.style.display = 'none';
        //prewiewCard.style.backgroundColor = 'var(--color1)';
        //prewiewCard.style.color = 'white';
        //namePreview.textContent = 'Nueva contraseña';
        //passPreview.textContent = '';
        //openLinkPreview.style.display = 'none';
        colorSelected = 'var(--color1)';
        //document.querySelector('input[name="color"][value="var(--color1)"]').checked = true;
        //newFavoriteSwitch.checked = false;
        //newCardName.value = '';
        //newCardUser.value = '';
        //newCardPass.value = '';
        //newCardUrl.value = '';
    });

    // Clic en el botón para editar la tarjeta seleccionada
    editCard.addEventListener('click', async () => {
        if (encryptedSelectedCard) {
            modalNewMode = 'edit'; // Establecer el modo del modal a editar
            // Desencriptar la tarjeta seleccionada
            const selectedCard = await window.electronAPI.decryptCard(encryptedSelectedCard);
            if (selectedCard.success) {
                // Abrir modal
                modalNew.style.display = 'block';
                // Adaptar el estado del modal a la tarjeta seleccionada
                modalNewTitle.textContent = modalNewEditTranslations['title-edit'];
                //icoLove.style.display = (selectedCard.data.favorite == 1) ? 'block' : 'none';
                //newFavoriteSwitch.checked = (selectedCard.data.favorite == 1) ? true : false;
                //newCardName.value = selectedCard.data.name;
                //namePreview.textContent = selectedCard.data.name;
                //newCardUser.value = selectedCard.data.user || '';
                //userPreviewSection.style.display = (selectedCard.data.user) ? 'block' : 'none';
                //userPreview.textContent = selectedCard.data.user || '';
                //newCardPass.value = selectedCard.data.password;
                //passPreview.textContent = selectedCard.data.password;
                //newCardUrl.value = selectedCard.data.web || '';
                //urlPreviewSection.style.display = (selectedCard.data.web) ? 'block' : 'none';
                //openLinkPreview.style.display = (selectedCard.data.web) ? 'block' : 'none';
                //urlPreview.textContent = selectedCard.data.web || '';
                // Establecer el color de la tarjeta
                colorSelected = selectedCard.data.color;
                //prewiewCard.style.backgroundColor = colorSelected;
                document.querySelector(`input[name="color"][value="${colorSelected}"]`).checked = true;

                if (selectedCard.data.color == 'var(--color4)' || selectedCard.data.color == 'var(--color6)') {
                    //prewiewCard.style.color = 'black'; // Cambiar el color del texto
                } else {
                    //prewiewCard.style.color = 'white'; // Cambiar el color del texto
                }
            } else {
                console.error(card);
                showToast(card.message);
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

    // Modal para agregar o editar una contraseña ===================================================
    // Clic en el botón para cerrar el modal
    closeModalNew.addEventListener('click', () => {
        modalNew.style.display = 'none';
    });

    // Al escribir en los inputs de nueva tarjeta
    /*newCardName.addEventListener('input', () => {
        if (newCardName.value.length > 0) {
            namePreview.textContent = newCardName.value;
        } else {
            namePreview.textContent = 'Nueva contraseña';
        }
    });*/

    /*newCardUser.addEventListener('input', () => {
        if (newCardUser.value.length > 0) {
            userPreviewSection.style.display = 'block';
            userPreview.textContent = newCardUser.value;
        } else {
            userPreviewSection.style.display = 'none';
        }
    });*/

    /*newCardPass.addEventListener('input', () => {
        passPreview.textContent = newCardPass.value;
    });

    newCardUrl.addEventListener('input', () => {
        if (newCardUrl.value.length > 0) {
            urlPreviewSection.style.display = 'block';
            openLinkPreview.style.display = 'block';
            urlPreview.textContent = newCardUrl.value;
        } else {
            urlPreviewSection.style.display = 'none';
            openLinkPreview.style.display = 'none';
        }
    });

    // Al presionar un color
    document.querySelectorAll('input[name="color"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            colorSelected = event.target.value;
            // Cambiar color de la vista previa
            prewiewCard.style.backgroundColor = colorSelected;
            if (colorSelected == 'var(--color4)' || colorSelected == 'var(--color6)') {
                prewiewCard.style.color = 'black'; // Cambiar el color del texto
            } else {
                prewiewCard.style.color = 'white'; // Cambiar el color del texto
            }
        });
    });

    // Al presionar el toggle swith de favorito
    newFavoriteSwitch.addEventListener('change', (event) => {
        if (event.target.checked) {
            icoLove.style.display = 'block';
            newFavorite = 1;
        } else {
            icoLove.style.display = 'none';
            newFavorite = 0;
        }
    });

    // Al presionar el botón "listo" del modal para agregar una nueva tarjeta
    newCardDone.addEventListener('click', async () => {
        // Refinar datos
        const name = newCardName.value.trim();
        const user = newCardUser.value.trim();
        const password = newCardPass.value.trim();
        const web = newCardUrl.value.trim();

        // Verificar que los campos no estén vacíos
        if (name && password) {
            if (modalNewMode === 'create') {
                // Crear nueva tarjeta
                const result = await window.electronAPI.createCard({
                    name: name,
                    user: user,
                    password: password,
                    web: web,
                    color: colorSelected,
                    favorite: newFavorite,
                });
                console.log(result);
                // Cerrar modal
                if (result.success) {
                    modalNew.style.display = 'none';
                    // Agregar tarjeta a la lista de tarjetas encriptadas
                    encryptedCards.data.push(result.data);
                    showCards(encryptedCards); // Mostrar las tarjetas en la vista
                    showToast(result.message);
                }
                else {
                    showToast(result.message);
                }
            }
            else if (modalNewMode === 'edit') {
                const updatedCard = {
                    name: name,
                    user: user,
                    password: password,
                    web: web,
                    color: colorSelected,
                    favorite: newFavorite,
                };

                console.log('Nuevos datos de tarjeta:', updatedCard);
                // Editar tarjeta existente
                const result = await window.electronAPI.updateCard(encryptedSelectedCard.id, updatedCard);
                console.log(result);
                // Cerrar modal
                if (result.success) {
                    modalNew.style.display = 'none';
                    // Reemplazar tarjeta editada en la lista de tarjetas encriptadas
                    encryptedCards.data[selectedCardIndex] = result.data; // Reemplazar la tarjeta editada
                    showCards(encryptedCards); // Mostrar las tarjetas en la vista
                    showToast(result.message);
                }
                else {
                    showToast(result.message);
                }
            }
        } else {
            window.electronAPI.showWarning('Problema', 'Es necesario al menos un nombre y una contraseña para continuar.');
        }
    });*/

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
            console.log(result);
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
    // Sidebar...................................................
    sidebar.addEventListener('click', (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir
        console.log(buttonPressed.id);

        // Clic en botón bloquear
        if (buttonPressed.id === 'lock') {
            window.electronAPI.changeView('src/views/lock.html');
        }
    });

    // Cards container...........................................
    cardsContainer.addEventListener('click', (event) => {
        const buttonPressed = event.target.closest('button');
        if (!buttonPressed) return; // Si no se hizo clic en un botón, salir
        console.log(buttonPressed.id);

        // Si el botón es un botón de enlace externo de una tarjeta
        if (buttonPressed.classList.contains('external-link-btn')) {
            const url = buttonPressed.getAttribute('data-url');
            if (url) {
                window.electron.openExternal(url);
            }
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
