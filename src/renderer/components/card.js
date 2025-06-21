/*
 * Este modulo retorna un elemento HTML que representa una tarjeta de una contraseña.
 * La tarjeta contiene un nombre, usuario, contraseña, URL y un icono de favorito. 
 */

export function createCardElement(card, index, translations) {
    const cardBody = document.createElement('label');
    cardBody.classList.add('card-body'); // clase para estilos
    cardBody.setAttribute('id', card.id); // id para el elemento
    cardBody.setAttribute('data-name', card.name);
    cardBody.style.backgroundColor = card.color; // Cambia el color de fondo de la tarjeta
    cardBody.style.boxShadow = '0px 0px 10px 0px' + card.color; // Cambia la sombra de la tarjeta
    if (card.color == 'var(--color4)' || card.color == 'var(--color6)') {
        cardBody.style.color = 'black'; // Cambia el color del texto
    }

    const heartVisible = (card.favorite == 1) ? 'visible' : 'invisible'; // Cambia la visibilidad del icono de favorito
    const userVisible = (card.user == null || card.user == '') ? 'invisible' : 'visible'; // Cambia la visibilidad del usuario
    const urlVisible = (card.web == null || card.web == '') ? 'invisible' : 'visible'; // Cambia la visibilidad de la url

    // Crea el contenido de la tarjeta
    const cardHTML = `
            <input type="radio" name="card" value="${index}">
            <div class="horizontal_elem-area spaced centered">
                <p class="bold">${card.name}</p>
                <div class="${heartVisible}">
                    <div class="card-static-icon">
                        <img src="../assets/ico/feather/heart.svg" class="card-icon">
                    </div>
                </div>
            </div>

            <div class="${userVisible}">
                <strong class="minimum-text">${translations['user']}</strong>
                <p id="user-${index}" class="small-text selectable-text">••••••••</p>
            </div>
            
            <div>
                <strong class="minimum-text">${translations['password']}</strong>
                <p id="pass-${index}" class="small-text selectable-text">••••••••</p>
            </div>

            <div class="${urlVisible}">
                <strong class="minimum-text">${translations['url']}</strong>
                <p class="small-text">${card.web}</p>
            </div>

            <div class="horizontal-flex spaced centered">
                <button class="external-link-btn card-btn ${urlVisible}" data-url="${card.web}"">
                    <img src="../assets/ico/feather/external-link.svg" class="card-icon">
                    </button>

                <strong class="minimum-text">${index + 1}</strong>

                <button class="eye-btn card-btn" data-index="${index}" data-userId="user-${index}" data-passId="pass-${index}">
                    <img src="../assets/ico/feather/eye.svg" class="card-icon">
                </button>
            </div>
        `;
    cardBody.innerHTML = cardHTML;
    return cardBody;
}