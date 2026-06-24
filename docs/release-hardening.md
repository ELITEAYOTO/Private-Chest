# Release Hardening Checklist

Date: 2026-03-07

## Completed controls
- [x] Threat model documented.
- [x] Binary opaque vault format (`SPV1`) with strict decode checks.
- [x] KEK (Argon2id) + wrapped random Vault Key architecture.
- [x] AEAD full payload encryption.
- [x] Atomic vault writes with temp file + rename.
- [x] Session auto-lock default 5 min.
- [x] Clipboard clear timer default 20 s.
- [x] Secret wrappers with redacted debug and zeroize.
- [x] Native Messaging protocol (no local HTTP/WebSocket).
- [x] Domain + protocol validation for autofill.
- [x] Brute-force throttle on unlock path.
- [x] Release build disables `PRIVATE_CHEST_MASTER_PASSWORD` auto-unlock.
- [x] Extension timeout hardened (default 8s, bounded).
- [x] Extension permissions reduced (no `activeTab`, no `scripting`).

## Operational release tasks
- [x] Native host manifest templates use release-safe placeholders.
- [x] Windows native host install script added.
- [x] Deployment guide updated (`docs/windows-deployment.md`).
- [ ] Manual penetration test on production build.