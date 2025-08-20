/*
 * Este modulo retorna un elemento HTML que representa una nota.
 * La nota contiene un nombre, contenido y un icono de favorito. 
 */

export function createNoteElement(note, index, translations) {
    const noteBody = document.createElement('label');
    noteBody.classList.add('main-element-body'); // clase para estilos
    noteBody.setAttribute('id', note.id); // id para el elemento
    noteBody.setAttribute('data-name', note.name);
    noteBody.style.backgroundColor = note.color; // Cambia el color de fondo de la nota
    noteBody.style.boxShadow = '0px 0px 10px 0px' + note.color; // Cambia la sombra
    if (note.color == 'var(--color4)' || note.color == 'var(--color6)') {
        noteBody.style.color = 'black'; // Cambia el color del texto
    }

    const heartVisible = (note.favorite == 1) ? 'visible' : 'invisible'; // Cambia la visibilidad del icono de favorito

    // Crea el contenido de la nota
    const noteHTML = `
            <input type="radio" name="mainElement" value="${note.id}">
            <div class="horizontal-elem-area spaced centered">
                <p class="bold">${note.name}</p>
                <div class="${heartVisible}">
                    <div class="main-element-static-icon">
                        <img src="../assets/ico/feather/heart.svg" class="main-element-icon">
                    </div>
                </div>
            </div>

            <p id="content-${note.id}" class="small-text selectable-text">••••••••</p>            

            <div class="horizontal-flex spaced centered">
                <strong class="minimum-text">${index + 1}</strong>

                <button class="eye-btn main-element-btn" data-noteID="${note.id}" data-contentID="content-${note.id}">
                    <img src="../assets/ico/feather/eye.svg" class="main-element-icon">
                </button>
            </div>
        `;
    noteBody.innerHTML = noteHTML;
    return noteBody;
}