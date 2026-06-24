use std::path::Path;

use crypto_core::KdfParams;
use vault_domain::VaultPayload;

use crate::{atomic_write, VaultStoreError};

pub fn save_to_path(
    path: &Path,
    payload: &VaultPayload,
    master_password: &[u8],
    kdf_params: KdfParams,
) -> Result<(), VaultStoreError> {
    let bytes = vault_format::seal_vault(payload, master_password, kdf_params)?;
    atomic_write::write_atomic(path, bytes.as_slice())?;
    Ok(())
}
