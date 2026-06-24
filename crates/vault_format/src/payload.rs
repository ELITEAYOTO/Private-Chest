use vault_domain::VaultPayload;

use crate::VaultFormatError;

pub fn serialize_payload(payload: &VaultPayload) -> Result<Vec<u8>, VaultFormatError> {
    serde_cbor::to_vec(payload).map_err(|_| VaultFormatError::Encoding)
}

pub fn deserialize_payload(bytes: &[u8]) -> Result<VaultPayload, VaultFormatError> {
    serde_cbor::from_slice(bytes).map_err(|_| VaultFormatError::Decoding)
}
