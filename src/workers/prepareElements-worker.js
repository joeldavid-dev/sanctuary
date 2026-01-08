const { parentPort, workerData } = require("worker_threads");
const cr = require("../utils/crypto");

(async () => {
  const results = [];

  for (const { index, item, type } of workerData.chunk) {
    let data;
    if (type === 'card') {
      data = await cr.prepareCard(workerData.masterKey, item);
    } else if (type === 'note') {
      data = await cr.prepareNote(workerData.masterKey, item);
    }
    results.push({ index, data, type });
    parentPort.postMessage({ type: "progress" });
  }

  parentPort.postMessage({
    type: "done",
    results
  });
})();