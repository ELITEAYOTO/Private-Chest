use std::time::Instant;

pub fn should_clear(expires_at: Option<Instant>, now: Instant) -> bool {
    match expires_at {
        Some(expiry) => now >= expiry,
        None => false,
    }
}
