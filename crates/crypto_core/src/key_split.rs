use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::Zeroize;

use crate::{CryptoError, KEY_LEN};

#[derive(Zeroize)]
#[zeroize(drop)]
pub struct SplitKeys {
    pub vault_wrap_key: [u8; KEY_LEN],
    pub ipc_auth_key: [u8; KEY_LEN],
    pub export_key: [u8; KEY_LEN],
}

pub fn derive_subkeys(kek: &[u8; KEY_LEN]) -> Result<SplitKeys, CryptoError> {
    let hkdf = Hkdf::<Sha256>::new(None, kek);

    let mut vault_wrap_key = [0_u8; KEY_LEN];
    let mut ipc_auth_key = [0_u8; KEY_LEN];
    let mut export_key = [0_u8; KEY_LEN];

    hkdf.expand(b"private-chest:v1:vault-wrap-key", &mut vault_wrap_key)
        .map_err(|_| CryptoError::KeySplit)?;
    hkdf.expand(b"private-chest:v1:ipc-auth-key", &mut ipc_auth_key)
        .map_err(|_| CryptoError::KeySplit)?;
    hkdf.expand(b"private-chest:v1:export-key", &mut export_key)
        .map_err(|_| CryptoError::KeySplit)?;

    Ok(SplitKeys {
        vault_wrap_key,
        ipc_auth_key,
        export_key,
    })
}
