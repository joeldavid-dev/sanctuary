document.addEventListener('DOMContentLoaded', () => {
    const encryptButton = document.getElementById('encryptButton');
    const decryptButton = document.getElementById('decryptButton');
    const inputText = document.getElementById('inputText');
    const passwordInput = document.getElementById('passwordInput');
    const encryptedText = document.getElementById('encryptedText');
    const decryptedText = document.getElementById('decryptedText');

    let storedEncryptedData = null;
    let storedSalt = null;
    let storedIv = null;

    encryptButton.addEventListener('click', async () => {
        const text = inputText.value;
        const password = passwordInput.value;

        if (!text || !password) {
            alert("Por favor, ingresa un texto y una contraseña.");
            return;
        }

        const result = await window.cryptoAPI.encrypt(text, password);
        storedEncryptedData = result.encryptedData;
        storedSalt = result.salt;
        storedIv = result.iv;

        encryptedText.textContent = `Cifrado: ${storedEncryptedData}`;
    });

    decryptButton.addEventListener('click', async () => {
        const password = passwordInput.value;

        if (!storedEncryptedData || !password) {
            alert("No hay datos cifrados o la contraseña está vacía.");
            return;
        }

        try {
            const decrypted = await window.cryptoAPI.decrypt(storedEncryptedData, password, storedSalt, storedIv);
            decryptedText.textContent = `Descifrado: ${decrypted}`;
        } catch (error) {
            alert("Contraseña incorrecta o datos corruptos.");
        }
    });
});
