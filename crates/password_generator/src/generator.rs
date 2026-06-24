use rand::rngs::OsRng;
use rand::RngCore;
use thiserror::Error;

use crate::charset;

#[derive(Debug, Clone, Copy)]
pub struct PasswordOptions {
    pub length: usize,
    pub lowercase: bool,
    pub uppercase: bool,
    pub digits: bool,
    pub symbols: bool,
    pub exclude_ambiguous: bool,
}

impl PasswordOptions {
    pub fn strong_default() -> Self {
        Self {
            length: 20,
            lowercase: true,
            uppercase: true,
            digits: true,
            symbols: true,
            exclude_ambiguous: false,
        }
    }
}

#[derive(Debug, Error)]
pub enum PasswordGenError {
    #[error("invalid options")]
    InvalidOptions,
}

fn unbiased_index(alphabet_len: usize) -> usize {
    let mut byte = [0_u8; 1];
    let threshold = 256_u16 - (256_u16 % alphabet_len as u16);

    loop {
        OsRng.fill_bytes(&mut byte);
        let v = byte[0] as u16;
        if v < threshold {
            return (v % alphabet_len as u16) as usize;
        }
    }
}

pub fn generate_password(options: PasswordOptions) -> Result<String, PasswordGenError> {
    if options.length == 0 {
        return Err(PasswordGenError::InvalidOptions);
    }

    let mut alphabet: Vec<u8> = Vec::new();

    if options.lowercase {
        alphabet.extend(charset::filtered(
            charset::LOWER,
            options.exclude_ambiguous,
        ));
    }
    if options.uppercase {
        alphabet.extend(charset::filtered(
            charset::UPPER,
            options.exclude_ambiguous,
        ));
    }
    if options.digits {
        alphabet.extend(charset::filtered(
            charset::DIGITS,
            options.exclude_ambiguous,
        ));
    }
    if options.symbols {
        alphabet.extend(charset::filtered(
            charset::SYMBOLS,
            options.exclude_ambiguous,
        ));
    }

    if alphabet.is_empty() {
        return Err(PasswordGenError::InvalidOptions);
    }

    let mut out = String::with_capacity(options.length);
    for _ in 0..options.length {
        let idx = unbiased_index(alphabet.len());
        out.push(alphabet[idx] as char);
    }

    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::{generate_password, PasswordOptions};

    #[test]
    fn generates_expected_length() {
        let options = PasswordOptions::strong_default();
        let password = generate_password(options).unwrap();
        assert_eq!(password.len(), options.length);
    }

    #[test]
    fn rejects_invalid_options() {
        let options = PasswordOptions {
            length: 16,
            lowercase: false,
            uppercase: false,
            digits: false,
            symbols: false,
            exclude_ambiguous: false,
        };

        let result = generate_password(options);
        assert!(result.is_err());
    }
}
