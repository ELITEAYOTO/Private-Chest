# Threat Model - Private Chest V1

## Scope
Private Chest V1 protects a local encrypted vault on a single desktop device.

## Security Objectives
- Confidentiality of vault content at rest.
- Integrity of vault content against tampering/corruption.
- Resistance to offline brute force on the master password.
- Minimal secret exposure in memory and UI.
- No local network attack surface for desktop-extension communication.

## Protected Assets
- Master password (never persisted).
- KEK derived by Argon2id (memory only).
- Random vault key (memory only, wrapped at rest).
- Vault entries (credentials, notes, URLs, categories).
- Clipboard-copied secrets during their short lifetime.

## Trust Boundaries
- Rust backend (`crates/*`) is trusted for crypto and persistence.
- Frontend/UI is untrusted for long-lived secret storage.
- Browser extension is less trusted than desktop backend.
- Local filesystem is untrusted for plaintext secrecy.

## Main Attackers
- Offline attacker stealing `vault.bin`.
- Local user/process reading application files.
- Attacker tampering with vault bytes.
- Opportunistic observer of logs/clipboard.

## Out of Scope (Explicit)
- Fully compromised OS/kernel.
- Active keylogger and malware with process-memory access.
- Hardware-level attacks (DMA, firmware compromise).

## Threats and Mitigations
1. Vault theft and offline guessing
- Mitigation: Argon2id KDF with tunable memory/time cost, per-vault random salt.

2. Vault tampering/corruption
- Mitigation: AEAD (AES-256-GCM) authenticated encryption; decode validation and explicit corruption errors.

3. Secret leakage to disk
- Mitigation: opaque binary container; no plaintext JSON at rest.

4. Secret leakage to logs/errors
- Mitigation: redacted secret types; no debug output for sensitive values.

5. UI overexposure
- Mitigation: crypto in Rust backend only; reveal/copy operations explicit and short-lived.

6. Clipboard persistence
- Mitigation: backend timer-based clear policy (`20s` default).

7. Idle exposure
- Mitigation: auto-lock session (`5m` default).

8. Local service probing
- Mitigation: no local HTTP/WebSocket; extension integration reserved for Native Messaging.

## Security Invariants (Must Hold)
- No secret persisted in plaintext on disk.
- Master password never saved.
- Vault key is random and wrapped, never derived directly as payload key.
- All vault payload bytes are encrypted and authenticated.
- Backend remains authoritative for lock state and secret operations.

## Residual Risk
A compromised endpoint can still exfiltrate secrets while vault is unlocked. V1 prioritizes protection at rest and strict local attack-surface minimization.
