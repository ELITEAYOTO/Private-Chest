use crate::header::{CURRENT_VERSION, KDF_ID_ARGON2ID, MAGIC};
use crate::{VaultContainer, VaultFormatError};

pub fn encode_container(container: &VaultContainer) -> Result<Vec<u8>, VaultFormatError> {
    if container.header.version != CURRENT_VERSION {
        return Err(VaultFormatError::UnsupportedVersion);
    }

    if container.header.kdf_id != KDF_ID_ARGON2ID {
        return Err(VaultFormatError::UnsupportedKdf);
    }

    if container.wrapped_vault_key.len() != container.header.wrapped_vault_key_len as usize {
        return Err(VaultFormatError::InvalidLength);
    }

    if container.encrypted_payload.len() != container.header.encrypted_payload_len as usize {
        return Err(VaultFormatError::InvalidLength);
    }

    let mut out = Vec::with_capacity(
        4 + 1 + 1 + 4 + 4 + 4 + 16 + 12 + 4 + 12 + 8 + container.wrapped_vault_key.len()
            + container.encrypted_payload.len(),
    );

    out.extend_from_slice(&MAGIC);
    out.push(container.header.version);
    out.push(container.header.kdf_id);

    out.extend_from_slice(&container.header.kdf_params.memory_kib.to_le_bytes());
    out.extend_from_slice(&container.header.kdf_params.iterations.to_le_bytes());
    out.extend_from_slice(&container.header.kdf_params.parallelism.to_le_bytes());

    out.extend_from_slice(&container.header.salt);
    out.extend_from_slice(&container.header.wrapped_vault_key_nonce);
    out.extend_from_slice(&container.header.wrapped_vault_key_len.to_le_bytes());
    out.extend_from_slice(&container.header.payload_nonce);
    out.extend_from_slice(&container.header.encrypted_payload_len.to_le_bytes());

    out.extend_from_slice(&container.wrapped_vault_key);
    out.extend_from_slice(&container.encrypted_payload);

    Ok(out)
}
