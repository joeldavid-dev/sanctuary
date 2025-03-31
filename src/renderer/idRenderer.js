document.addEventListener("DOMContentLoaded", () => {
    const minimize = document.getElementById('minimize');
    const maximize = document.getElementById('maximize');
    const close = document.getElementById('close');
    const nameIn = document.getElementById('user-name');
    const pass1In = document.getElementById('user-pass1');
    const pass2In = document.getElementById('user-pass2');
    const done = document.getElementById('done-btn');

    let name, pass1, pass2, gender = '';

    // Clic en botón minimizar
    minimize.addEventListener('click', () => {
        window.electron.minimize();
    });
    // Clic en botón maximizar
    maximize.addEventListener('click', () => {
        window.electron.maximize();
    });
    // Clic en botón cerrar
    close.addEventListener('click', () => {
        window.electron.close();
    });

    // Al editar el nombre
    nameIn.addEventListener('input', (event) => {
        name = event.target.value.trim();
    });

    // Al editar la contraseña 1
    pass1In.addEventListener('input', (event) => {
        pass1 = event.target.value.trim();
    });

    // Al editar la contraseña 2
    pass2In.addEventListener('input', (event) => {
        pass2 = event.target.value.trim();
    });

    // Al presionar un genero
    document.querySelectorAll('input[name="gender"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            gender = event.target.value;
        });
    });

    // Clic en botón "listo"
    done.addEventListener('click', async () => {
        // Verificar que todos los campos no esten vacíos
        if (name == '' || pass1 == '' || pass2 == '' || !name || !pass1 || !pass2 || !gender) {
            await window.electronAPI.showWarning('Advertencia', 'No puede haber campos vacíos.');
        }

        // Verificar que las contraseñas coincidan
        else if (pass1 != pass2) {
            await window.electronAPI.showWarning('Advertencia', 'Las contraseñas no coinciden.');
            pass1In.value = '';
            pass2In.value = '';
            pass1 = '';
            pass2 = '';
        }

        // Acciones cuando los datos son correctos
        else if (name != '' && pass1 != '' && pass1 == pass2 && gender) {
            const result = await window.electronAPI.createID(name, pass1, gender);
            console.log(result);
            window.electronAPI.changeView('src/views/block.html');
        }
    })
});