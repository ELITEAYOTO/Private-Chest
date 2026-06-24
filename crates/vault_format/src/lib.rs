pub mod decode;
pub mod encode;
pub mod header;
pub mod migration;
pub mod payload;

use crypto_core::{decrypt_vault, encrypt_vault, CryptoError, EncryptedVaultBlob, KdfParams};
use thiserror::Error;
use vault_domain::VaultPayload;
use zeroize::Zeroizing;

pub use decode::decode_container;
pub use encode::encode_container;
pub use header::{VaultHeader, CURRENT_VERSION, KDF_ID_ARGON2ID, MAGIC};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct VaultContainer {
    pub header: VaultHeader,
    pub wrapped_vault_key: Vec<u8>,
    pub encrypted_payload: Vec<u8>,
}

impl VaultContainer {
    pub fn from_encrypted_blob(blob: EncryptedVaultBlob) -> Self {
        let header = VaultHeader {
            version: CURRENT_VERSION,
            kdf_id: KDF_ID_ARGON2ID,
            kdf_params: blob.kdf_params,
            salt: blob.kdf_salt,
            wrapped_vault_key_nonce: blob.wrapped_vault_key_nonce,
            wrapped_vault_key_len: blob.wrapped_vault_key.len() as u32,
            payload_nonce: blob.payload_nonce,
            encrypted_payload_len: blob.encrypted_payload.len() as u64,
        };

        Self {
            header,
            wrapped_vault_key: blob.wrapped_vault_key,
            encrypted_payload: blob.encrypted_payload,
        }
    }

    pub fn to_encrypted_blob(&self) -> EncryptedVaultBlob {
        EncryptedVaultBlob {
            kdf_salt: self.header.salt,
            kdf_params: self.header.kdf_params,
            wrapped_vault_key_nonce: self.header.wrapped_vault_key_nonce,
            wrapped_vault_key: self.wrapped_vault_key.clone(),
            payload_nonce: self.header.payload_nonce,
            encrypted_payload: self.encrypted_payload.clone(),
        }
    }
}

#[derive(Debug, Error)]
pub enum VaultFormatError {
    #[error("invalid vault magic")]
    InvalidMagic,
    #[error("unsupported vault version")]
    UnsupportedVersion,
    #[error("unsupported kdf")]
    UnsupportedKdf,
    #[error("invalid length fields")]
    InvalidLength,
    #[error("truncated data")]
    Truncated,
    #[error("encoding failed")]
    Encoding,
    #[error("decoding failed")]
    Decoding,
    #[error("crypto failed")]
    Crypto,
}

impl From<CryptoError> for VaultFormatError {
    fn from(_: CryptoError) -> Self {
        Self::Crypto
    }
}

pub fn seal_vault(
    payload: &VaultPayload,
    master_password: &[u8],
    kdf_params: KdfParams,
) -> Result<Vec<u8>, VaultFormatError> {
    let payload_bytes = Zeroizing::new(payload::serialize_payload(payload)?);
    let blob = encrypt_vault(payload_bytes.as_slice(), master_password, kdf_params)?;
    let container = VaultContainer::from_encrypted_blob(blob);
    encode::encode_container(&container)
}

pub fn unseal_vault(
    file_bytes: &[u8],
    master_password: &[u8],
) -> Result<VaultPayload, VaultFormatError> {
    let container = decode::decode_container(file_bytes)?;
    migration::assert_supported_version(container.header.version)?;

    let blob = container.to_encrypted_blob();
    let payload_bytes = Zeroizing::new(decrypt_vault(&blob, master_password)?);
    payload::deserialize_payload(payload_bytes.as_slice())
}

#[cfg(test)]
mod tests {
    use crypto_core::KdfParams;
    use vault_domain::{Category, EntryKind, VaultEntry, VaultPayload, VaultSettings};

    use crate::{decode_container, encode_container, seal_vault, unseal_vault};

    fn sample_payload() -> VaultPayload {
        VaultPayload {
            vault_uuid: "vault-1".to_string(),
            version: 1,
            created_at: "2026-03-06T10:00:00Z".to_string(),
            updated_at: "2026-03-06T10:00:00Z".to_string(),
            entries: vec![VaultEntry {
                id: "entry-1".to_string(),
                kind: EntryKind::Login,
                title: "Discord".to_string(),
                username: "alice@example.com".to_string(),
                password: "secret-pass".to_string(),
                urls: vec!["https://discord.com".to_string()],
                notes: String::new(),
                category_id: "social".to_string(),
                tags: vec![],
                created_at: "2026-03-06T10:00:00Z".to_string(),
                updated_at: "2026-03-06T10:00:00Z".to_string(),
                last_used_at: None,
                favorite: false,
                deleted: false,
                totp_secret: None,
            }],
            categories: vec![Category {
                id: "social".to_string(),
                label: "Social".to_string(),
            }],
            settings: VaultSettings::default(),
            documents: Vec::new(),
            file_root_salt: Vec::new(),
        }
    }

    #[test]
    fn format_roundtrip() {
        let payload = sample_payload();
        let bytes = seal_vault(
            &payload,
            b"correct horse battery staple",
            KdfParams::secure_default(),
        )
        .unwrap();

        let decoded = decode_container(bytes.as_slice()).unwrap();
        let reencoded = encode_container(&decoded).unwrap();
        assert_eq!(bytes, reencoded);

        let unsealed = unseal_vault(bytes.as_slice(), b"correct horse battery staple").unwrap();
        assert_eq!(unsealed, payload);
    }

    #[test]
    fn wrong_password_fails() {
        let payload = sample_payload();
        let bytes = seal_vault(&payload, b"correct-password", KdfParams::secure_default()).unwrap();
        let result = unseal_vault(bytes.as_slice(), b"wrong-password");
        assert!(result.is_err());
    }
}