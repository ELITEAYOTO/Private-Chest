use std::time::{Duration, Instant};

use crate::clipboard_clear;
use crate::idle;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum LockState {
    Locked,
    Unlocked,
}

#[derive(Debug)]
pub struct SessionManager {
    lock_state: LockState,
    auto_lock_after: Duration,
    clipboard_clear_after: Duration,
    last_activity: Option<Instant>,
    clipboard_expires_at: Option<Instant>,
}

impl SessionManager {
    pub fn new(auto_lock_after: Duration, clipboard_clear_after: Duration) -> Self {
        Self {
            lock_state: LockState::Locked,
            auto_lock_after,
            clipboard_clear_after,
            last_activity: None,
            clipboard_expires_at: None,
        }
    }

    pub fn with_secure_defaults() -> Self {
        Self::new(Duration::from_secs(5 * 60), Duration::from_secs(20))
    }

    pub fn lock_state(&self) -> LockState {
        self.lock_state
    }

    pub fn is_unlocked(&self) -> bool {
        self.lock_state == LockState::Unlocked
    }

    pub fn unlock(&mut self, now: Instant) {
        self.lock_state = LockState::Unlocked;
        self.last_activity = Some(now);
    }

    pub fn lock(&mut self) {
        self.lock_state = LockState::Locked;
        self.last_activity = None;
        self.clipboard_expires_at = None;
    }

    pub fn touch_activity(&mut self, now: Instant) {
        if self.is_unlocked() {
            self.last_activity = Some(now);
        }
    }

    pub fn check_auto_lock(&mut self, now: Instant) -> bool {
        if self.is_unlocked() && idle::idle_timeout_reached(self.last_activity, now, self.auto_lock_after) {
            self.lock();
            return true;
        }

        false
    }

    pub fn mark_secret_copied(&mut self, now: Instant) {
        self.clipboard_expires_at = Some(now + self.clipboard_clear_after);
    }

    pub fn should_clear_clipboard(&self, now: Instant) -> bool {
        clipboard_clear::should_clear(self.clipboard_expires_at, now)
    }

    pub fn consume_clipboard_clear(&mut self, now: Instant) -> bool {
        if self.should_clear_clipboard(now) {
            self.clipboard_expires_at = None;
            return true;
        }

        false
    }

    pub fn update_timeouts(&mut self, auto_lock_after: Duration, clipboard_clear_after: Duration) {
        self.auto_lock_after = auto_lock_after;
        self.clipboard_clear_after = clipboard_clear_after;
    }

    pub fn seconds_until_lock(&self, now: Instant) -> Option<u64> {
        if !self.is_unlocked() {
            return None;
        }
        let last = self.last_activity?;
        let elapsed = now.saturating_duration_since(last);
        let remaining = self.auto_lock_after.checked_sub(elapsed)?;
        Some(remaining.as_secs())
    }
}

#[cfg(test)]
mod tests {
    use std::time::{Duration, Instant};

    use crate::{LockState, SessionManager};

    #[test]
    fn auto_lock_triggers_after_timeout() {
        let mut session = SessionManager::new(Duration::from_secs(5), Duration::from_secs(2));
        let start = Instant::now();

        session.unlock(start);
        assert_eq!(session.lock_state(), LockState::Unlocked);

        let did_lock = session.check_auto_lock(start + Duration::from_secs(6));
        assert!(did_lock);
        assert_eq!(session.lock_state(), LockState::Locked);
    }

    #[test]
    fn clipboard_timer_expires() {
        let mut session = SessionManager::new(Duration::from_secs(5), Duration::from_secs(3));
        let start = Instant::now();

        session.mark_secret_copied(start);
        assert!(!session.should_clear_clipboard(start + Duration::from_secs(2)));
        assert!(session.should_clear_clipboard(start + Duration::from_secs(3)));
        assert!(session.consume_clipboard_clear(start + Duration::from_secs(3)));
        assert!(!session.consume_clipboard_clear(start + Duration::from_secs(4)));
    }
}
