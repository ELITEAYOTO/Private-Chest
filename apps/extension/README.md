# Browser Extension - Implementation Status

Implemented:
- Background Native Messaging bridge (`src/background/index.js`).
- Content script quick-fill flow with entry chooser (`Ctrl+Shift+L`).
- Popup lock action (`src/popup/index.js`).
- HTTPS origin policy + challenge-per-request flow.

Security rules:
- Native Messaging only (no localhost HTTP/WebSocket bridge).
- `fill_for_origin` requires one-shot challenge + `user_gesture`.
- Backend validates HTTPS origin and domain match before returning credentials.
- Timeout hardened: default `8000ms`, clamped between `3000ms` and `20000ms`.

Permissions posture:
- `nativeMessaging`: required desktop bridge.
- `storage`: timeout tuning persistence.
- `https://*/*`: required for login-page content script.

Native host manifests:
- Templates: `native-messaging/io.privatechest.native.chrome.json`, `native-messaging/io.privatechest.native.firefox.json`.
- Windows install script: `native-messaging/install-native-host.ps1`.