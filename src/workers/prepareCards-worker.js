const { parentPort, workerData } = require("worker_threads");
const cr = require("../utils/crypto");
const preparedCards = [];

// Datos que llegaron del main
const { encryptedCards, masterKey } = workerData;

(async () => {
  for (const element of encryptedCards) {
    // Ojo: si prepareCard es async usa await
    const card = await cr.prepareCard(masterKey, element);
    preparedCards.push(card);
  }

  // Cuando termina, manda la respuesta al main
  parentPort.postMessage(preparedCards);

  // salir del worker
  process.exit(0);
})();