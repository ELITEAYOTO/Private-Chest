# Tauri Hardening - V1 Policy

## Security Posture
- Rust backend owns vault state, crypto, and session state.
- Frontend does not receive full vault dumps.
- Password reveal and copy are explicit backend actions.
- Clipboard clear and auto-lock are enforced by backend timers.

## Command Surface
Allowed command functions are intentionally small and explicit:
- `initialize_vault(master_password)`
- `unlock_vault(master_password)`
- `lock_vault()`
- `list_entries(query)`
- `get_entry_details(entry_id, reveal_password)`
- `create_entry(...)`
- `update_entry(...)`
- `delete_entry(entry_id)`
- `generate_password(length)`
- `copy_password(entry_id)`
- `tick()`

No shell command execution is exposed to frontend.

## Capability and CSP
- Single main window only.
- No broad filesystem access from frontend.
- No local network bridge for extension.
- Strict CSP configured in `apps/desktop/src-tauri/tauri.conf.json`.

## Lock Rules
- Start in locked state.
- Auto-lock default: 5 minutes.
- Lock clears in-memory session secrets and pending extension challenge.
- Panic lock follows the same secure clear path.
