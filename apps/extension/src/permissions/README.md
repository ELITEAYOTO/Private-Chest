# Permissions Policy

## Chrome (MV3)
- `nativeMessaging`: required for desktop bridge.
- `storage`: optional runtime configuration (`nativeRequestTimeoutMs`).
- `host_permissions`: `https://*/*` to run content script on HTTPS login pages.

## Firefox (MV2)
- `nativeMessaging`: required for desktop bridge.
- `storage`: optional runtime configuration (`nativeRequestTimeoutMs`).
- `https://*/*`: content script on HTTPS pages.

## Explicitly removed
- `activeTab`: not required by current flow.
- `scripting`: not required by current flow.