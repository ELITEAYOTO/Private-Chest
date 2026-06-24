# Extension Security - V1

## Architecture
- Content script handles page context and quick-fill chooser.
- Background script enforces extension-side policy.
- Native Messaging host is the only desktop bridge.

## Mandatory controls
- HTTPS origin required.
- One-time challenge token for sensitive requests.
- Challenge expiry: 30 seconds.
- `user_gesture = true` required for fill operation.
- Domain/URL match enforced by backend before credential return.
- Backend returns minimal data required for current action.
- Native request timeout hardened (default 8000ms, bounded 3000-20000ms).

## Explicitly forbidden
- Localhost HTTP APIs.
- Localhost WebSocket bridges.
- Blind autofill without origin validation.

## Current files
- `apps/extension/src/background/index.js`
- `apps/extension/src/content/index.js`
- `crates/native_protocol/src/*`
- `crates/native_host/src/*`
- `crates/desktop_backend/src/backend.rs`