/*
 * Este modulo retorna un elemento HTML que representa una opción.
 */

export function createPopupOption(optionType, optionValue, optionText) {
    const optionElement = document.createElement('button');
    optionElement.classList.add('option-btn', 'minimal-rounded', 'left-text', 'small-text');
    optionElement.setAttribute('data-option-type', optionType);
    optionElement.setAttribute('data-option-value', optionValue);
    optionElement.textContent = optionText;

    return optionElement;
}