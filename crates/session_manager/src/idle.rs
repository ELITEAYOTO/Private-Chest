use std::time::{Duration, Instant};

pub fn idle_timeout_reached(last_activity: Option<Instant>, now: Instant, timeout: Duration) -> bool {
    match last_activity {
        Some(last) => now.saturating_duration_since(last) >= timeout,
        None => false,
    }
}

