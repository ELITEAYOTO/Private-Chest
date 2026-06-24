use crypto_core::KdfParams;

pub const MAGIC: [u8; 4] = *b"SPV1";
pub const CURRENT_VERSION: u8 = 1;
pub const KDF_ID_ARGON2ID: u8 = 1;

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct VaultHeader {
    pub version: u8,
    pub kdf_id: u8,
    pub kdf_params: KdfParams,
    pub salt: [u8; 16],
    pub wrapped_vault_key_nonce: [u8; 12],
    pub wrapped_vault_key_len: u32,
    pub payload_nonce: [u8; 12],
    pub encrypted_payload_len: u64,
}
