# Vault Binary Format - `SPV1`

## Goals
- Opaque container on disk.
- Versioned header for migrations.
- Strong validation on decode.
- No plaintext vault structure at rest.

## File Layout (Little Endian)
- `MAGIC[4]` = `SPV1`
- `VERSION[u8]` = `1`
- `KDF_ID[u8]` = `1` (`Argon2id`)
- `KDF_MEMORY_KIB[u32]`
- `KDF_ITERATIONS[u32]`
- `KDF_PARALLELISM[u32]`
- `SALT[16]`
- `WRAPPED_VAULT_KEY_NONCE[12]`
- `WRAPPED_VAULT_KEY_LEN[u32]`
- `PAYLOAD_NONCE[12]`
- `ENCRYPTED_PAYLOAD_LEN[u64]`
- `WRAPPED_VAULT_KEY[bytes]`
- `ENCRYPTED_PAYLOAD[bytes]`

## Cryptographic Meaning
- Master password -> Argon2id -> KEK.
- KEK -> HKDF split -> `vault_wrap_key`, `ipc_auth_key`, `export_key`.
- `vault_wrap_key` wraps random `vault_key`.
- `vault_key` encrypts entire serialized payload with AES-256-GCM.

## Payload Serialization
Payload is serialized with CBOR before encryption. The serialized format is never exposed on disk in plaintext.

## Migration Rules
- Unknown `MAGIC` => reject.
- Unsupported `VERSION` => reject and require migration path.
- Unknown `KDF_ID` => reject.
- Length mismatches/truncation => reject as corruption.

## Compatibility
Future versions must preserve strict decode behavior and add explicit migration routines.
