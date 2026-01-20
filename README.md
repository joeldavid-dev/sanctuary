# Sanctuary
Desktop application built with ElectronJS to store passwords and notes, secured using AES-256 symmetric encryption, with a focus on user privacy and a great user experience.

## Screenshots
<img width="400" alt="Captura de pantalla 2026-01-19 170412" src="https://github.com/user-attachments/assets/993296f7-a6c6-4d95-ba83-573a805ccc37" />
<img width="400" alt="Captura de pantalla 2026-01-19 170305" src="https://github.com/user-attachments/assets/2fb86570-3de8-45c3-b9e2-eb64f631647b" />
<img width="400" alt="Captura de pantalla 2026-01-19 170742" src="https://github.com/user-attachments/assets/f2f6d94b-6f35-468b-b1ee-312b00ddc332" />
<img width="400" alt="Captura de pantalla 2026-01-19 170836" src="https://github.com/user-attachments/assets/3558a276-41a5-4a46-a3b7-9bd2dce6c12a" />


## Estructura del proyecto
```
├── src/
│   ├── main.js                         # Main Electron app code (Main Process)
│   ├── preload.js                      # Code executed before loading the window (Preload Script)
│   ├── assets/ ...                     # Static assets like images, icons, videos, and fonts
│   ├── config/                         # Constant values used by the application
│   │   ├── constants.json
│   │   ├── defaultSettings.json
│   │   ├── globalConfig.json
│   ├── locales/ ...                    # Language/Localization files
│   ├── renderer/
│   │   ├── homeRenderer.js             # Renderer process for the main view
│   │   ├── idRenderer.js               # Renderer process for the login view
│   │   ├── lockRenderer.js             # Renderer process for the lock view
│   │   ├── splashRenderer.js           # Renderer process for the splash view
│   │   ├── components/ ...             # Interface components
│   │   ├── utils/ ...                  # Utilities for renderer processes
│   ├── styles/
│   │   ├── home.css                    # Specific styles for the main view
│   │   ├── id.css                      # Specific styles for the login view
│   │   ├── lock.css                    # Specific styles for the lock view
│   │   ├── splash.css                  # Specific styles for the splash view
│   │   ├── styles.css                  # General styles for the entire application
│   ├── utils/
│   │   ├── colorGenerator.js           # Predominant color calculation based on an image
│   │   ├── crypto.js                   # Data encryption
│   │   ├── database.js                 # Data storage with SQLite
│   │   ├── oldCrypto.js                # Encryption for legacy application data
│   │   ├── settings.js                 # Settings storage
│   ├── views/
│   │   ├── home.html                   # Main view
│   │   ├── id.html                     # Login view
│   │   ├── lock.html                   # Lock view
│   │   ├── splash-screen.html          # Splash/Initial view
│   ├── workers/
│   │   ├── passwordChange-worker.js    # Worker thread that changes the encryption password for all stored data
│   │   ├── prepareElements-worker.js   # Worker thread that decrypts data needed to display the main view
├── package.json
```

## Prerequisites
Before using this template, make sure you have:
- **Node.js**
- A code editor (VS Code recommended)

## Running the project
Clone the code:
```
git clone https://github.com/joeldavid-dev/sanctuary.git
```

Install Node dependencies:
```
cd sanctuary
npm install
```

Run in debug mode:
```
npm start
```

Build the installer:
```
npm run build
```

## Supported Languages
English, Spanish, German, French, Italian, Japanese, Korean, Norwegian, Portuguese, Russian, Finnish, Swedish, and Simplified Chinese.
