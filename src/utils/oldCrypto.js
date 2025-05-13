function encrypt(texto, llave) {
    let textoCif = '';
    let contLlave = 0;

    for (let i = 0; i < texto.length; i++) {
        const charCodeTexto = texto.charCodeAt(i);
        const charCodeLlave = llave.charCodeAt(contLlave);
        const cifrado = (charCodeTexto * llave.length * charCodeLlave) +
            Math.pow(charCodeLlave, 2) + Math.pow(i + 1, 2);
        textoCif += cifrado + '-';
        contLlave++;

        if (contLlave === llave.length) {
            contLlave = 0;
        }
    }

    return textoCif;
}

function decrypt(texto, llave) {
    let textoDes = '';
    let contLlave = 0;
    let j = 0;

    const numeros = texto.split('-').filter(n => n !== '');

    for (let numStr of numeros) {
        j++;
        const numCif = parseInt(numStr, 10);
        const charCodeLlave = llave.charCodeAt(contLlave);
        const originalCharCode = Math.trunc(
            (numCif - Math.pow(charCodeLlave, 2) - Math.pow(j, 2)) /
            (llave.length * charCodeLlave)
        );
        contLlave++;
        textoDes += String.fromCharCode(originalCharCode);

        if (contLlave === llave.length) {
            contLlave = 0;
        }
    }

    return textoDes;
}

// Funcion para adaptar el viejo ID a la nueva version
function adaptOldID(oldID) {
    // Adaptar datos para el nuevo usuario
    let gender = '';
    switch (oldID.gender) {
        case 0:
            gender = 'male';
            break;
        case 1:
            gender = 'female';
            break;
        case 2:
            gender = 'neutral';
            break;
        default:
            gender = 'neutral';
    }
    return {
        name: oldID.name,
        gender,
    }
}

function adaptOldCard(key, oldCard) {
    user = decrypt(oldCard.user, key);
    password = decrypt(oldCard.password, key);
    web = decrypt(oldCard.web, key);
    let color = '';
    let favorite = false;

    switch (oldCard.color) {
        case 1:
            color = 'var(--color1)';
            break;
        case 2:
            color = 'var(--color9)';
            break;
        case 3:
            color = 'var(--color2)';
            break;
        case 4:
            color = 'var(--color3)';
            break;
        case 5:
            color = 'var(--color5)';
            break;
        case 6:
            color = 'var(--color6)';
            break;
        case 7:
            color = 'var(--color7)';
            break;
        case 8:
            color = 'var(--color8)';
            break;
        case 9:
            color = 'var(--color4)';
            break;
        default:
            color = 'var(--color1)';
    }

    switch (oldCard.favorite) {
        case 0:
            favorite = false;
            break;
        case -1:
            favorite = true;
            break;
        default:
            favorite = false;
    }

    // Adaptar datos para la nueva tarjeta
    return {
        name: oldCard.name,
        user,
        password,
        web,
        color,
        favorite,
    }
}

module.exports = { encrypt, decrypt, adaptOldID, adaptOldCard };
