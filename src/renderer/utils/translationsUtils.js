/*
 * Este modulo provee funciones de utilidad para manejar traducciones de textos
 * con variables dinámicas.
 */

export function replaceKeysInText(text, vars = {}) {
    if (text === undefined || text === null) return undefined;
    Object.keys(vars).forEach(varKey => {
        text = text.replace(`{${varKey}}`, vars[varKey]);
    });
    return text;
}