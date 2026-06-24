# Windows Deployment Guide (V1)

## 1) Build artifacts

From repository root:

```powershell
& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --workspace
& "$env:USERPROFILE\.cargo\bin\cargo.exe" check --workspace
& "$env:USERPROFILE\.cargo\bin\cargo.exe" build --release -p native_host
```

Build desktop app bundles:

```powershell
cd apps\desktop\src-tauri
& "$env:USERPROFILE\.cargo\bin\cargo.exe" tauri build
```

Generated outputs:
- Desktop app: `apps/desktop/src-tauri/target/release/bundle/*`
- Native host: `target/release/native_host.exe`

## 2) Register Native Messaging manifests

Use the installer script (writes manifests and registry keys in HKCU):

```powershell
cd apps\extension\native-messaging
.\install-native-host.ps1 `
  -Browser All `
  -NativeHostExePath "C:\Users\<you>\Desktop\Projet-PrivateChest\target\release\native_host.exe" `
  -ChromeExtensionId "<chrome_extension_id>" `
  -FirefoxExtensionId "<firefox_extension_id@example.com>"
```

Registry keys created:
- `HKCU\Software\Google\Chrome\NativeMessagingHosts\io.privatechest.native`
- `HKCU\Software\Mozilla\NativeMessagingHosts\io.privatechest.native`

Manifest output directory:
- `%LOCALAPPDATA%\PrivateChest\native-messaging`

## 3) Install extension (dev side-load)

- Chrome: load unpacked `apps/extension`.
- Firefox: load temporary add-on from `apps/extension/manifest.firefox.json`.

Then copy extension IDs into the install script command above.

## 4) End-to-end validation

1. Launch desktop app and unlock vault.
2. Open HTTPS login page.
3. Trigger quick fill (`Ctrl+Shift+L`).
4. Verify chooser appears when multiple entries match.
5. Verify fill succeeds only after explicit selection.
6. Verify lock from popup locks desktop session.

## 5) Security release notes

- No auto-unlock by `PRIVATE_CHEST_MASTER_PASSWORD` in release builds.
- Dev-only unsafe override exists only in debug builds via `PRIVATE_CHEST_DEV_UNSAFE_AUTO_UNLOCK`.
- Native Messaging remains the only browser bridge (no local HTTP/WebSocket).