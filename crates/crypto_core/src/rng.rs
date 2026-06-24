use rand::rngs::OsRng;
use rand::RngCore;

pub fn random_array<const N: usize>() -> [u8; N] {
    let mut out = [0_u8; N];
    OsRng.fill_bytes(&mut out);
    out
}
