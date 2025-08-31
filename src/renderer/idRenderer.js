import { showIDModal } from './components/modalID.js';

document.addEventListener("DOMContentLoaded", async () => {
    const translations = await window.electronAPI.getTranslations('id');

    // Fondo animado
    document.body.addEventListener("pointermove", (e) => {
        const { currentTarget: el, clientX: x, clientY: y } = e;
        const { top: t, left: l, width: w, height: h } = el.getBoundingClientRect();
        el.style.setProperty('--posX', x - l - w / 2);
        el.style.setProperty('--posY', y - t - h / 2);
    })

    const confirm = await showIDModal('create', null);

    if (confirm.success) {
        const message = (confirm.imported) ? translations['import-success'] : translations['id-created-success'];
        window.electronAPI.showNotification(translations['success'], message);
        window.electronAPI.changeView('src/views/lock.html');
    } else {
        window.electron.close();
    }
});