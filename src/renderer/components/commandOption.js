/*
 * Este modulo retorna un elemento HTML que representa una opción.
 */

export function createOptionElement(option) {
    // Si la opción inicia con 'change' o 'delete', se crea un botón con una clase específica
    if (option.startsWith('change') || option.startsWith('delete')) {
        const optionElement = document.createElement('button');
        optionElement.classList.add('option-btn2', 'minimal-rounded', 'left-text', 'small-text');
        // Establece el atributo 'data-option' con el primer valor de la opción, antes de los dos puntos
        const optionParts = option.split(':');
        optionElement.setAttribute('data-option', optionParts[0]);
        optionElement.textContent = option;

        return optionElement;
    }
    else {
        const optionElement = document.createElement('button');
        optionElement.classList.add('option-btn', 'minimal-rounded', 'left-text', 'small-text');
        optionElement.setAttribute('data-option', option);
        optionElement.textContent = option;

        return optionElement;
    }
}