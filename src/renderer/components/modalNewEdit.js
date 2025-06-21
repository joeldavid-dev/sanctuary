// Este modulo retorna un elemento HTML que representa un modal para editar una tarjeta de contraseña.

export function createModalNewEditElement(translations) {
    const modalBody = document.createElement('div');
    modalBody.classList.add('horizontal-flex');

    modalBody.innerHTML = `
    <div class="horizontal-flex normal-margin">
        <div class="vertical-elem-area normal-padding normal-rounded preview-options">
            <label>${translations['name']}</label>
            <input type="text" id="new-card-name" class="custom-input minimal-rounded" placeholder=${translations["name-placeholder"]}>
            <label>${translations['user']}</label>
            <input type="text" id="new-card-user" class="custom-input minimal-rounded"
                placeholder=${translations['user-placeholder']}>
            <label>${translations['password']}</label>
            <input type="text" id="new-card-pass" class="custom-input minimal-rounded"
                placeholder=${translations['password-placeholder']}>
            <label>${translations['url']}</label>
            <input type="text" id="new-card-url" class="custom-input minimal-rounded"
                placeholder=${translations['url-placeholder']}>

            <div class="horizontal-flex spaced centered">
                <labe>${translations['favorite']}</labe>
                <label id="new-favorite-switch" class="switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <div class="preview-area vertical-flex distributed expanded">
            <label for="preview-card">${translations['preview']}</label>

            <div id="preview-card" class="card-body color1 contracted">
                <div class="horizontal_elem-area spaced centered">
                    <p id="name-preview" class="bold">Nueva contraseña</p>
                    <div id="ico-love">
                        <div class="card-static-icon">
                            <img src="../assets/ico/feather/heart.svg" class="card-icon">
                        </div>
                    </div>
                </div>

                <label id="user-preview-section" class="minimum-text vertical-flex">
                    Usuario:
                    <p id="user-preview" class="small-text"></p>
                </label>

                <label class="minimum-text vertical-elem-area">
                    Contraseña:
                    <p id="pass-preview" class="small-text"></p>
                </label>

                <label id="url-preview-section" class="minimum-text vertical-elem-area">
                    URL:
                    <p id="url-preview" class="small-text"></p>
                </label>

                <div class="horizontal-flex spaced centered">
                    <button id="open-link-preview" class="card-btn">
                        <img id="ico-link" src="../assets/ico/feather/external-link.svg" class="card-icon">
                    </button>

                    <p class="minimum-text">1 de 1</p>

                    <button id="view-preview" class="card-btn">
                        <img id="ico-eye" src="../assets/ico/feather/eye.svg" class="card-icon">
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="horizontal-flex normal-margin">
        <div class="horizontal_elem-area minimal-padding normal-rounded preview-options">
            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color1" type="radio" name="color" value="var(--color1)">
                <div class="radio-color color1 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color2" type="radio" name="color" value="var(--color2)">
                <div class="radio-color color2 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color3" type="radio" name="color" value="var(--color3)">
                <div class="radio-color color3 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color4" type="radio" name="color" value="var(--color4)">
                <div class="radio-color color4 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color5" type="radio" name="color" value="var(--color5)">
                <div class="radio-color color5 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color6" type="radio" name="color" value="var(--color6)">
                <div class="radio-color color6 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color7" type="radio" name="color" value="var(--color7)">
                <div class="radio-color color7 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color8" type="radio" name="color" value="var(--color8)">
                <div class="radio-color color8 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color9" type="radio" name="color" value="var(--color9)">
                <div class="radio-color color9 minimal-rounded"></div>
            </label>

            <label class="custom-radio2 minimal-rounded minimal-padding">
                <input id="color10" type="radio" name="color" value="var(--color10)">
                <div class="radio-color color10 minimal-rounded"></div>
            </label>
        </div>

        <button id="new-card-done" class="new-card-done action-btn narrow-padding normal-rounded">${translations['done']}</button>
    </div>

    
    `;
    return modalBody;
}