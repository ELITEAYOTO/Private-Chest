pub mod aead;
pub mod kdf;
pub mod key_split;
pub mod rng;

use thiserror::Error;
use zeroize::Zeroizing;

pub use kdf::KdfParams;

pub const SALT_LEN: usize = 16;
pub const NONCE_LEN: usize = 12;
pub const KEY_LEN: usize = 32;

const WRAP_KEY_AAD: &[u8] = b"private-chest:v1:wrap";
const PAYLOAD_AAD: &[u8] = b"private-chest:v1:payload";
pub const FILE_AAD: &[u8] = b"private-chest:v1:file";

#[derive(Debug, Clone)]
pub struct EncryptedVaultBlob {
    pub kdf_salt: [u8; SALT_LEN],
    pub kdf_params: KdfParams,
    pub wrapped_vault_key_nonce: [u8; NONCE_LEN],
    pub wrapped_vault_key: Vec<u8>,
    pub payload_nonce: [u8; NONCE_LEN],
    pub encrypted_payload: Vec<u8>,
}

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("invalid input")]
    InvalidInput,
    #[error("kdf failed")]
    Kdf,
    #[error("key split failed")]
    KeySplit,
    #[error("encryption failed")]
    Encrypt,
    #[error("decryption failed")]
    Decrypt,
}

pub fn encrypt_vault(
    payload: &[u8],
    master_password: &[u8],
    kdf_params: KdfParams,
) -> Result<EncryptedVaultBlob, CryptoError> {
    if master_password.is_empty() || payload.is_empty() {
        return Err(CryptoError::InvalidInput);
    }

    let kdf_salt = rng::random_array::<SALT_LEN>();
    let kek = Zeroizing::new(kdf::derive_kek(master_password, &kdf_salt, kdf_params)?);
    let split = Zeroizing::new(key_split::derive_subkeys(&kek)?);
    let vault_key = Zeroizing::new(rng::random_array::<KEY_LEN>());

    let wrapped_vault_key_nonce = rng::random_array::<NONCE_LEN>();
    let wrapped_vault_key = aead::encrypt(
        &split.vault_wrap_key,
        &wrapped_vault_key_nonce,
        WRAP_KEY_AAD,
        vault_key.as_ref(),
    )?;

    let payload_nonce = rng::random_array::<NONCE_LEN>();
    let encrypted_payload = aead::encrypt(&vault_key, &payload_nonce, PAYLOAD_AAD, payload)?;

    Ok(EncryptedVaultBlob {
        kdf_salt,
        kdf_params,
        wrapped_vault_key_nonce,
        wrapped_vault_key,
        payload_nonce,
        encrypted_payload,
    })
}

pub fn decrypt_vault(
    blob: &EncryptedVaultBlob,
    master_password: &[u8],
) -> Result<Vec<u8>, CryptoError> {
    if master_password.is_empty() {
        return Err(CryptoError::InvalidInput);
    }

    let kek = Zeroizing::new(kdf::derive_kek(master_password, &blob.kdf_salt, blob.kdf_params)?);
    let split = Zeroizing::new(key_split::derive_subkeys(&kek)?);

    let unwrapped_vault_key = Zeroizing::new(aead::decrypt(
        &split.vault_wrap_key,
        &blob.wrapped_vault_key_nonce,
        WRAP_KEY_AAD,
        &blob.wrapped_vault_key,
    )?);

    if unwrapped_vault_key.len() != KEY_LEN {
        return Err(CryptoError::Decrypt);
    }

    let mut vault_key = [0_u8; KEY_LEN];
    vault_key.copy_from_slice(unwrapped_vault_key.as_ref());
    let vault_key = Zeroizing::new(vault_key);

    aead::decrypt(
        &vault_key,
        &blob.payload_nonce,
        PAYLOAD_AAD,
        &blob.encrypted_payload,
    )
}

pub fn derive_file_key(
    master_password: &[u8],
    file_root_salt: &[u8],
    doc_id: &str,
) -> Result<[u8; KEY_LEN], CryptoError> {
    use hkdf::Hkdf;
    use sha2::Sha256;

    let hk = Hkdf::<Sha256>::new(Some(file_root_salt), master_password);
    let mut okm = [0u8; KEY_LEN];
    let info: Vec<u8> = [b"pc:v1:file:".as_slice(), doc_id.as_bytes()].concat();
    hk.expand(&info, &mut okm).map_err(|_| CryptoError::Kdf)?;
    Ok(okm)
}

#[cfg(test)]
mod tests {
    use crate::{decrypt_vault, encrypt_vault, KdfParams};

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let payload = b"serialized-vault-payload";
        let password = b"correct horse battery staple";

        let encrypted = encrypt_vault(payload, password, KdfParams::secure_default()).unwrap();
        let decrypted = decrypt_vault(&encrypted, password).unwrap();

        assert_eq!(payload.as_slice(), decrypted.as_slice());
    }

    #[test]
    fn decrypt_fails_with_wrong_password() {
        let payload = b"payload";
        let password = b"good-password";

        let encrypted = encrypt_vault(payload, password, KdfParams::secure_default()).unwrap();
        let result = decrypt_vault(&encrypted, b"bad-password");

        assert!(result.is_err());
    }
}

