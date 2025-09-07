const { parentPort, workerData } = require("worker_threads");
const cr = require("../utils/crypto");
const preparedCards = [];

// Datos que llegaron del main
const { encryptedCards, masterKey } = workerData;
const total = encryptedCards.length;
let count = 0;
// Procesar cada tarjeta
(async () => {
  for (const element of encryptedCards) {
    // Ojo: si prepareCard es async usa await
    const card = await cr.prepareCard(masterKey, element);
    preparedCards.push(card);
    count++;
    // Enviar progreso al main
    parentPort.postMessage({ type: "progress", progress: Math.round((count / total) * 100) });
  }

  // Cuando termina, manda la respuesta al main
  parentPort.postMessage({ type: "done", preparedCards });

  // salir del worker
  process.exit(0);
})();