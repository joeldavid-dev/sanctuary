const { parentPort, workerData } = require("worker_threads");
const cr = require("../utils/crypto");
const preparedCards = [];
const preparedNotes = [];

// Datos que llegaron del main
const { encryptedCards, encryptedNotes, masterKey } = workerData;
const total = encryptedCards.length + encryptedNotes.length;
let count = 0;
(async () => {
  // Procesar cada tarjeta
  for (const element of encryptedCards) {
    // Ojo: si prepareCard es async usa await
    const card = await cr.prepareCard(masterKey, element);
    preparedCards.push(card);
    count++;
    // Enviar progreso al main
    parentPort.postMessage({ type: "progress", progress: Math.round((count / total) * 100) });
  }

  // Procesar cada nota
  for (const element of encryptedNotes) {
    // Ojo: si prepareNote es async usa await
    const note = await cr.prepareNote(masterKey, element);
    preparedNotes.push(note);
    count++;
    // Enviar progreso al main
    parentPort.postMessage({ type: "progress", progress: Math.round((count / total) * 100) });
  }

  // Cuando termina, manda la respuesta al main
  parentPort.postMessage({
    type: "done",
    cards: preparedCards,
    notes: preparedNotes,
  });

  // salir del worker
  process.exit(0);
})();