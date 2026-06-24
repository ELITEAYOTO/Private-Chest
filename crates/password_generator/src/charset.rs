pub const LOWER: &str = "abcdefghijklmnopqrstuvwxyz";
pub const UPPER: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
pub const DIGITS: &str = "0123456789";
pub const SYMBOLS: &str = "!@#$%^&*()-_=+[]{};:,.?/";
pub const AMBIGUOUS: &str = "O0oIl1";

pub fn filtered(input: &str, remove_ambiguous: bool) -> Vec<u8> {
    if !remove_ambiguous {
        return input.as_bytes().to_vec();
    }

    input
        .bytes()
        .filter(|b| !AMBIGUOUS.as_bytes().contains(b))
        .collect()
}
