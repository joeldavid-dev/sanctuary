/*
 * Este modulo obtiene una imagen HTML y retorna el color predominante. Se encarga
 * de todo el procesamiento de colores de la aplicación.
 */
const fs = require('fs');
const ffmpeg = require("fluent-ffmpeg");
const path = require('path');
const { app } = require('electron');
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

const isDev = !app.isPackaged;
const ffmpegStaticPath = require('ffmpeg-static');
let ffmpegPathFinal = ffmpegStaticPath;

if (!isDev) {
    // En producción, ajustar la ruta de ffmpeg
    const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    ffmpegPathFinal = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', exe);
}
ffmpeg.setFfmpegPath(ffmpegPathFinal);

async function generateColorPalette(fileName, imageCachePath, filePath = null, fileType = 'image', customName = null) {
    let appContrastLight, appContrastDark, finalImgPath;

    if (fileName === 'custom') {
        if (fileType === 'image') {
            // Si es una imagen persolanizada, utiliza la fuente original.
            finalImgPath = filePath;
        } else {
            // Si es un video personalizado, obtiene un frame del video y lo guarda
            // en la carpeta de imagenes temporales.
            finalImgPath = path.join(imageCachePath, customName + '.png');

            // Si no existe, extraer el primer frame
            if (!fs.existsSync(finalImgPath)) {
                await extractFirstFrame(filePath, finalImgPath);
            }
        }
    }
    else {
        // Si la imagen es parte del asar, copiarla a una carpeta temporal
        const imgAsarPath = path.join(__dirname, '..', 'assets', 'img', fileName + '.jpg');
        finalImgPath = path.join(imageCachePath, fileName + '.jpg');
        copyImageToCache(imgAsarPath, finalImgPath);
    }

    // Extracción del color dominante
    const dominantColor = getDominantColor(finalImgPath);
    const colorluminance = perceivedLuminance(dominantColor);
    const isLight = colorluminance > 0.5; // true = light, false = dark
    //console.log("Dominant color: " + dominantColor + " Type: " + (isLight ? "light" : "dark"));
    //console.log("Perceived luminance: " + colorluminance);

    let adjustedColor;
    if (isLight) {
        appContrastLight = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
        adjustedColor = adjustLightness(dominantColor, 0.45 - colorluminance);
        appContrastDark = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
    }
    else {
        appContrastDark = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
        adjustedColor = adjustLightness(dominantColor, 0.55 - colorluminance);
        appContrastLight = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
    }

    //console.log("Adjusted color luminance: " + perceivedLuminance(adjustedColor) + " type: " + (perceivedLuminance(adjustedColor) > 0.5 ? "light" : "dark"));
    const result = {
        appContrastLight,
        appContrastDark
    }
    return result;
};

function copyImageToCache(imgAsarPath, finalImgPath) {
    // Copiamos la imagen al file system real
    // Copiar solo si no existe
    if (!fs.existsSync(finalImgPath)) {
        fs.copyFileSync(imgAsarPath, finalImgPath);
    }
}

function extractFirstFrame(videoPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .screenshots({
                count: 1,
                folder: path.dirname(outputPath),
                filename: path.basename(outputPath),
                timemarks: ['0'] // primer frame
            });
    });
}

function getPixels(imagePath) {
    const buffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();

    if (ext === ".png") {
        const png = PNG.sync.read(buffer);
        return { data: png.data, width: png.width, height: png.height };
    }

    if (ext === ".jpg" || ext === ".jpeg") {
        const jpg = jpeg.decode(buffer, { useTArray: true });
        return { data: jpg.data, width: jpg.width, height: jpg.height };
    }

    throw new Error("Formato no soportado");
}

function getDominantColor(imagePath) {
    const { data } = getPixels(imagePath);
    const colorMap = new Map();

    for (let i = 0; i < data.length; i += 512) { // saltar algunos pixeles para mejorar performance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        //const a = data[i + 3];

        //if (a < 128) continue; // ignora transparencia

        // cuantización para agrupar colores
        const key = `${r >> 4 << 4},${g >> 4 << 4},${b >> 4 << 4}`;
        if (key !== "0,0,0" && key !== "255,255,255") // ignorar blanco y negro
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    let selectedColor = 0;
    let dominant = null;

    // Ordenar el colorMap por colores más frecuentes
    const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
    for (const [color, count] of sortedColors) {
        // Encontrar el color dominante que cumpla con la luminancia
        const rgb = color.split(',').map(Number);
        const luminance = perceivedLuminance(rgb);
        if (luminance > 0.2 && luminance < 0.8) {
            dominant = rgb;
            break;
        }
        selectedColor++;
    }

    //console.log(`Selected color index: ${selectedColor} out of ${sortedColors.length}`);

    // Si no se encontró ningún color adecuado, usar el más frecuente
    if (!dominant) {
        const [color] = sortedColors[0];
        dominant = color.split(',').map(Number);
    }

    return dominant;
}

function perceivedLuminance(rgb) {
    // Cálculo de luminancia percibida, fórmula ITU-R BT.601
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
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

module.exports = { generateColorPalette };