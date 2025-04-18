document.addEventListener("DOMContentLoaded", () => {
    const close = document.getElementById('close');
    const nameIn = document.getElementById('user-name');
    const pass1In = document.getElementById('user-pass1');
    const pass2In = document.getElementById('user-pass2');
    const done = document.getElementById('done-btn');

    let name, pass1, pass2, gender = '';

    // Fondo animado
    document.body.addEventListener("pointermove", (e) => {
        const { currentTarget: el, clientX: x, clientY: y } = e;
        const { top: t, left: l, width: w, height: h } = el.getBoundingClientRect();
        el.style.setProperty('--posX', x - l - w / 2);
        el.style.setProperty('--posY', y - t - h / 2);
    })

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
            const response = await window.electronAPI.createID(name, pass1, gender);

            if (response.success) {
                console.log(response.message);
                window.electronAPI.changeView('src/views/lock.html');
            } else {
                console.error(response.message, response.error);
            }
        }
    })
});