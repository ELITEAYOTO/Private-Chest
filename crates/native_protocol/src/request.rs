use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NativeRequest {
    Ping,
    GetChallenge,
    ListEntries {
        origin: String,
        challenge: String,
    },
    FillForOrigin {
        origin: String,
        entry_id: String,
        challenge: String,
        user_gesture: bool,
    },
    Lock,
}
