# Sanctuary
Desktop application built with ElectronJS to store passwords and notes, secured using AES-256 symmetric encryption, with a focus on user privacy and a great user experience.

## Preview
![Sanctuary Github README](https://github.com/user-attachments/assets/8545e5c9-9c6e-4c60-8b6a-1594dc2019e2)

## Features
- AES-256 symmetric encryption.
- Password verification using hashes.
- HTML configuration to prevent XSS attacks.
- Configuration storage.
- Event logging to a log file.
- Multi-language support.
- One-command packaging configuration.
- One-command publishing configuration.
- Automatic updates.
- Color generation using images or videos.

## Project Structure
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
Before running this project, make sure you have:
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
