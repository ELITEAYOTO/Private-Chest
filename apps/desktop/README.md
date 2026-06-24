# Desktop App (Tauri) - Implementation Status

Implemented in this repository:
- Secure backend command service in `src-tauri/src/commands.rs`.
- Lock/unlock, CRUD, generation, copy, and timer tick command paths.
- CSP and single-window baseline in `tauri.conf.json`.
- Minimal capability file in `src-tauri/capabilities/main.json`.

Notes:
- Runtime invoke registration is a packaging step.
- Core security logic lives in `crates/desktop_backend`.
