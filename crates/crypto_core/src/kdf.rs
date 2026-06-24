use argon2::{Algorithm, Argon2, Params, Version};

use crate::{CryptoError, KEY_LEN, SALT_LEN};

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct KdfParams {
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

impl KdfParams {
    pub const fn secure_default() -> Self {
        Self {
            memory_kib: 65_536,
            iterations: 3,
            parallelism: 1,
        }
    }

    pub fn validate(self) -> Result<Self, CryptoError> {
        if self.memory_kib < 19 * 1024 || self.iterations < 2 || self.parallelism == 0 {
            return Err(CryptoError::Kdf);
        }

        Ok(self)
    }
}

pub fn derive_kek(
    master_password: &[u8],
    salt: &[u8; SALT_LEN],
    params: KdfParams,
) -> Result<[u8; KEY_LEN], CryptoError> {
    let params = params.validate()?;

    let argon2_params = Params::new(
        params.memory_kib,
        params.iterations,
        params.parallelism,
        Some(KEY_LEN),
    )
    .map_err(|_| CryptoError::Kdf)?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon2_params);
    let mut out = [0_u8; KEY_LEN];

    argon2
        .hash_password_into(master_password, salt, &mut out)
        .map_err(|_| CryptoError::Kdf)?;

    Ok(out)
}
