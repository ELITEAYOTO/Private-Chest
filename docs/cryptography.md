# Cryptography Decisions - V1

## Selected Primitives
- KDF: Argon2id
- AEAD: AES-256-GCM
- Key split: HKDF-SHA256
- RNG: OS CSPRNG

## Key Strategy
- Master password derives KEK (Argon2id).
- KEK does not directly encrypt payload.
- Random `vault_key` encrypts payload.
- `vault_key` is wrapped by `vault_wrap_key` from HKDF split.

## Defaults (Tunable)
- Memory: 64 MiB (65536 KiB)
- Iterations: 3
- Parallelism: 1

## Nonce Policy
- Distinct random nonces for wrapped key and payload encryption.
- Never reuse nonce+key pair.

## Secret Handling
- Zeroize secret buffers after use.
- Redacted `Debug` behavior for secret wrappers.
- No sensitive data in logs or errors.
