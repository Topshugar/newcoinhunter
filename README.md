# Coin Hunter Pro

[![Build](https://github.com/Topshugar/newcoinhunter/actions/workflows/main.yml/badge.svg)](https://github.com/Topshugar/newcoinhunter/actions)
![Platform](https://img.shields.io/badge/Platform-Android-green)
![Node](https://img.shields.io/badge/Node-20.x-43853D)
![License](https://img.shields.io/badge/License-MIT-blue)

**Coin Hunter Pro** is a real-time crypto market scanner that detects newly listed and trending tokens across decentralized exchanges.

It combines a lightweight Express backend with a fast WebView Android app, so you can track new opportunities from your phone without opening a browser.

Live Demo: **https://newcoinhunter.onrender.com**

---

## Features

- **Live New Token Scanner** - Monitors new pairs and listings in real time
- **Smart Filters** - Filter by liquidity, volume, age, and chain
- **Clean Dashboard** - Mobile-first UI optimized for fast scanning
- **Auto Refresh** - Data updates without manual reload
- **Android App** - Native WebView wrapper for a full app experience
- **Zero Config Deploy** - One-click deploy to Render + auto APK build via GitHub Actions

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| Mobile | Android WebView (Java) |
| Build | Gradle 8.0 + Android Gradle Plugin 8.1.4 |
| CI/CD | GitHub Actions |
| Hosting | Render |

## Project Structure

.
├── http://hunter.html                  # Main dashboard UI
├── http://server.js                    # Express server - serves http://hunter.html + API
├── http://package.json                 # Node dependencies & scripts
├── .github/
│   └── workflows/
│       └── http://main.yml             # GitHub Actions - builds Android APK
├── gradle/wrapper/              # Gradle wrapper config
└── http://README.md

## Getting Started

### 1. Run Locally

```bash
git clone https://github.com/Topshugar/newcoinhunter.git
cd newcoinhunter
npm install
npm start
Open in browser:
http://localhost:3000
### 2. Run in Development
npm run dev
### 3. Environment Variables

Create a `.env` file if you need custom config:
PORT=3000
NODE_ENV=production
## Android App

The Android app is a native WebView wrapper that loads the live web app.

No manual Android Studio setup is required. The APK is built automatically on every push to `main`.

### Build APK Automatically

1. Push any change to `main`
2. Go to *GitHub > Actions > Build APK*
3. Wait for green tick
4. Download artifact: *coin-hunter-apk*
5. Unzip and install `app-debug.apk` on your Android device

### Build APK Manually
./gradlew :app:assembleDebug
Output:
app/build/outputs/apk/debug/app-debug.apk
### Install on Device

1. Transfer `app-debug.apk` to your phone
2. Tap to install
3. Allow *Install unknown apps* if prompted
4. Open *Coin Hunter Pro*

> *Note:* First launch may take 20-30 seconds on Render free tier due to cold start. Subsequent launches are fast.

## Deployment

### Render (Backend)

1. Connect your GitHub repo to https://render.com
2. Create new *Web Service*
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Deploy

Live URL: `https://newcoinhunter.onrender.com`

Update the URL in `main.yml` if you change your Render domain:
webView.loadUrl("https://newcoinhunter.onrender.com");
### GitHub Actions (APK)

Workflow file: `.github/workflows/main.yml`

- Trigger: Push to `main` or manual dispatch
- Java: Temurin 17
- Android SDK: Preinstalled on `ubuntu-latest`
- Gradle: 8.0
- AGP: 8.1.4
- Output: `coin-hunter-apk` artifact

## API
Endpoint	Method	Description
`/`	`GET`	Serves main dashboard
`/api/health`	`GET`	Health check
## Roadmap

- [ ] Push notifications for new high-volume tokens
- [ ] Watchlist & favorites
- [ ] Multi-chain support (ETH, BSC, Solana)
- [ ] Dark mode
- [ ] Signed release APK for Play Store

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Open a Pull Request

## Security

- No private keys are stored in the app
- No wallet connection required
- Always DYOR before trading any token

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

Built by *Topshugar*

For issues, open an https://github.com/Topshugar/newcoinhunter/issues in this repo.
