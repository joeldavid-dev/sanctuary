/*
 * Este modulo obtiene una imagen HTML y retorna el color predominante. Se encarga
 * de todo el procesamiento de colores de la aplicación.
 */
const fs = require('fs');
const { app } = require('electron');
const ColorThief = require('colorthief');
const path = require('path');

// Configuraciones globales
const globalConfigPath = path.join(__dirname, '..', 'config', 'globalConfig.json');
const globalConfig = JSON.parse(require('fs').readFileSync(globalConfigPath, 'utf8'));

async function generateColorPalette(imgName) {
    let appContrastLight, appContrastDark;

    // Detectar si la app está empaquetada
    const isPackaged = app.isPackaged;
    // Ruta original (dentro del asar si está empaquetado)
    const imgAsarPath = path.join(__dirname, '..', 'assets', 'img', imgName + '.jpg');
    // Ruta temporal (fuera del asar)
    const tempImgDir = path.join(app.getPath('userData'), 'temp-img');
    const tempImgPath = path.join(tempImgDir, imgName + '.jpg');
    // Si estamos empaquetados, copiamos la imagen al file system real
    if (isPackaged) {
        // Crear carpeta si no existe
        if (!fs.existsSync(tempImgDir)) {
            fs.mkdirSync(tempImgDir, { recursive: true });
        }
        // Copiar solo si no existe
        if (!fs.existsSync(tempImgPath)) {
            fs.copyFileSync(imgAsarPath, tempImgPath);
        }
    }

    const finalImgPath = isPackaged ? tempImgPath : imgAsarPath;
    printDebug("Imagen analizada: " + finalImgPath);
    const dominantColor = await ColorThief.getColor(finalImgPath);

    if (isLightColor(dominantColor)) {
        appContrastLight = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
        const adjustedColor = adjustLightness(dominantColor, -0.2);
        appContrastDark = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
    }
    else {
        appContrastDark = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
        const adjustedColor = adjustLightness(dominantColor, 0.3);
        appContrastLight = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
    }

    const result = {
        appContrastLight,
        appContrastDark
    }

    printDebug("Colores obtenidos:", result);
    return result;
};

function isLightColor(dominantColor) {
    // Cálculo de luminancia percibida
    const luminancia = (0.299 * dominantColor[0] + 0.587 * dominantColor[1] + 0.114 * dominantColor[2]) / 255;

    // Si la luminancia es mayor a 0.5, es un color claro
    return luminancia > 0.5;
}

function adjustLightness(rgb, percent) {
    let [r, g, b] = rgb;
    let [h, s, l] = rgbToHsl(r, g, b);

    l = Math.min(1, Math.max(0, l + percent)); // Asegura que esté entre 0 y 1

    return hslToRgb(h, s, l);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // Gris
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
            case g: h = ((b - r) / d + 2); break;
            case b: h = ((r - g) / d + 4); break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    if (s === 0) {
        r = g = b = l; // Gris
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

function printDebug(info, obj = null) {
    if (globalConfig.debug) {
        console.log(`(colorGenerator) >> ${info}`);
        if (obj) console.log(obj);
    }
}

module.exports = { generateColorPalette }; 