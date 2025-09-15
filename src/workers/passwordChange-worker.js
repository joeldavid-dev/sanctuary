const { parentPort, workerData } = require("worker_threads");
const cr = require("../utils/crypto");

// Datos que llegaron del main
const { oldPassword, newPassword, encryptedCards, encryptedNotes } = workerData;
const total = encryptedCards.length + encryptedNotes.length;
let count = 0;
let newEncryptedCards = [];
let newEncryptedNotes = [];

(async () => {
    //Actualizar contraseña en las tarjetas  
    for (const element of encryptedCards) {
        const card = await cr.decryptCard(oldPassword, element);
        const encryptedCard = await cr.encryptCard(newPassword, card);
        newEncryptedCards.push(encryptedCard);
        count++;
        // Enviar progreso al main
        parentPort.postMessage({ type: "progress", progress: Math.round((count / total) * 100), phase: "card" });
    }
    // Actualizar contraseña en las notas
    for (const element of encryptedNotes) {
        const note = await cr.decryptNote(oldPassword, element);
        const encryptedNote = await cr.encryptNote(newPassword, note);
        newEncryptedNotes.push(encryptedNote);
        count++;
        // Enviar progreso al main
        parentPort.postMessage({ type: "progress", progress: Math.round((count / total) * 100), phase: "note" });
    }

    // Cuando termina, avisa al main
    parentPort.postMessage({ type: "done", newEncryptedCards, newEncryptedNotes });

    // salir del worker
    process.exit(0);
})();