use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy)]
pub struct UnlockThrottlePolicy {
    pub attempts_before_delay: u32,
    pub base_delay_seconds: u64,
    pub max_delay_seconds: u64,
}

impl Default for UnlockThrottlePolicy {
    fn default() -> Self {
        Self {
            attempts_before_delay: 5,
            base_delay_seconds: 2,
            max_delay_seconds: 300,
        }
    }
}

#[derive(Debug, Clone)]
pub struct UnlockThrottle {
    policy: UnlockThrottlePolicy,
    failed_attempts: u32,
    blocked_until: Option<Instant>,
}

impl UnlockThrottle {
    pub fn new(policy: UnlockThrottlePolicy) -> Self {
        Self {
            policy,
            failed_attempts: 0,
            blocked_until: None,
        }
    }

    pub fn remaining_block_duration(&self, now: Instant) -> Option<Duration> {
        let until = self.blocked_until?;
        if now >= until {
            return None;
        }

        Some(until - now)
    }

    pub fn register_failure(&mut self, now: Instant) {
        self.failed_attempts = self.failed_attempts.saturating_add(1);

        if self.failed_attempts < self.policy.attempts_before_delay {
            self.blocked_until = None;
            return;
        }

        let exponent = self.failed_attempts - self.policy.attempts_before_delay;
        let multiplier = 2_u64.saturating_pow(exponent);
        let delay = self
            .policy
            .base_delay_seconds
            .saturating_mul(multiplier)
            .min(self.policy.max_delay_seconds);

        self.blocked_until = Some(now + Duration::from_secs(delay));
    }

    pub fn reset(&mut self) {
        self.failed_attempts = 0;
        self.blocked_until = None;
    }
}

impl Default for UnlockThrottle {
    fn default() -> Self {
        Self::new(UnlockThrottlePolicy::default())
    }
}

#[cfg(test)]
mod tests {
    use std::time::{Duration, Instant};

    use crate::throttle::{UnlockThrottle, UnlockThrottlePolicy};

    #[test]
    fn throttle_applies_after_threshold() {
        let policy = UnlockThrottlePolicy {
            attempts_before_delay: 2,
            base_delay_seconds: 2,
            max_delay_seconds: 30,
        };

        let mut throttle = UnlockThrottle::new(policy);
        let now = Instant::now();

        throttle.register_failure(now);
        assert!(throttle.remaining_block_duration(now).is_none());

        throttle.register_failure(now);
        assert_eq!(
            throttle
                .remaining_block_duration(now)
                .unwrap_or(Duration::ZERO)
                .as_secs(),
            2
        );
    }

    #[test]
    fn reset_clears_block() {
        let mut throttle = UnlockThrottle::default();
        let now = Instant::now();

        for _ in 0..6 {
            throttle.register_failure(now);
        }

        assert!(throttle.remaining_block_duration(now).is_some());
        throttle.reset();
        assert!(throttle.remaining_block_duration(now).is_none());
    }
}
