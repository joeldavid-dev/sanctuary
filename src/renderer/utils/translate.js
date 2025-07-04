/*
 * Este modulo obtiene un objeto con las traducciones, una llave y variables opcionales.
 * Retorna la traducción correspondiente a la llave, reemplazando las variables si están presentes.
 */

let translations = {};

export function setTranslations(newTranslations) {
    translations = newTranslations;
}

export function translate(key, vars = {}) {
    let translation = translations[key] || key;
    Object.keys(vars).forEach(varKey => {
        translation = translation.replace(`{${varKey}}`, vars[varKey]);
    });
    return translation;
}