use crypto_core::KdfParams;

use crate::header::{CURRENT_VERSION, KDF_ID_ARGON2ID, MAGIC, VaultHeader};
use crate::{VaultContainer, VaultFormatError};

fn read_array<const N: usize>(bytes: &[u8], offset: &mut usize) -> Result<[u8; N], VaultFormatError> {
    let end = offset.saturating_add(N);
    if end > bytes.len() {
        return Err(VaultFormatError::Truncated);
    }

    let mut out = [0_u8; N];
    out.copy_from_slice(&bytes[*offset..end]);
    *offset = end;
    Ok(out)
}

fn read_u32(bytes: &[u8], offset: &mut usize) -> Result<u32, VaultFormatError> {
    Ok(u32::from_le_bytes(read_array::<4>(bytes, offset)?))
}

fn read_u64(bytes: &[u8], offset: &mut usize) -> Result<u64, VaultFormatError> {
    Ok(u64::from_le_bytes(read_array::<8>(bytes, offset)?))
}

pub fn decode_container(bytes: &[u8]) -> Result<VaultContainer, VaultFormatError> {
    let mut offset = 0;

    let magic = read_array::<4>(bytes, &mut offset)?;
    if magic != MAGIC {
        return Err(VaultFormatError::InvalidMagic);
    }

    let version = read_array::<1>(bytes, &mut offset)?[0];
    if version != CURRENT_VERSION {
        return Err(VaultFormatError::UnsupportedVersion);
    }

    let kdf_id = read_array::<1>(bytes, &mut offset)?[0];
    if kdf_id != KDF_ID_ARGON2ID {
        return Err(VaultFormatError::UnsupportedKdf);
    }

    let kdf_params = KdfParams {
        memory_kib: read_u32(bytes, &mut offset)?,
        iterations: read_u32(bytes, &mut offset)?,
        parallelism: read_u32(bytes, &mut offset)?,
    }
    .validate()
    .map_err(|_| VaultFormatError::Decoding)?;

    let salt = read_array::<16>(bytes, &mut offset)?;
    let wrapped_vault_key_nonce = read_array::<12>(bytes, &mut offset)?;
    let wrapped_vault_key_len = read_u32(bytes, &mut offset)? as usize;
    let payload_nonce = read_array::<12>(bytes, &mut offset)?;
    let encrypted_payload_len = read_u64(bytes, &mut offset)? as usize;

    let end_wrapped = offset.saturating_add(wrapped_vault_key_len);
    if end_wrapped > bytes.len() {
        return Err(VaultFormatError::Truncated);
    }
    let wrapped_vault_key = bytes[offset..end_wrapped].to_vec();
    offset = end_wrapped;

    let end_payload = offset.saturating_add(encrypted_payload_len);
    if end_payload > bytes.len() {
        return Err(VaultFormatError::Truncated);
    }
    let encrypted_payload = bytes[offset..end_payload].to_vec();
    offset = end_payload;

    if offset != bytes.len() {
        return Err(VaultFormatError::InvalidLength);
    }

    Ok(VaultContainer {
        header: VaultHeader {
            version,
            kdf_id,
            kdf_params,
            salt,
            wrapped_vault_key_nonce,
            wrapped_vault_key_len: wrapped_vault_key_len as u32,
            payload_nonce,
            encrypted_payload_len: encrypted_payload_len as u64,
        },
        wrapped_vault_key,
        encrypted_payload,
    })
}

#[cfg(test)]
mod tests {
    use crate::decode_container;

    #[test]
    fn invalid_magic_is_rejected() {
        let bytes = b"BAD!".to_vec();
        let result = decode_container(bytes.as_slice());
        assert!(result.is_err());
    }

    #[test]
    fn truncated_header_is_rejected() {
        let bytes = b"SPV1".to_vec();
        let result = decode_container(bytes.as_slice());
        assert!(result.is_err());
    }
}
