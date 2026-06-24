use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum NativeErrorCode {
    Locked,
    InvalidRequest,
    ChallengeFailed,
    ForbiddenOrigin,
    EntryNotFound,
    UserGestureRequired,
    Internal,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct NativeEntrySummary {
    pub id: String,
    pub title: String,
    pub username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NativeResponse {
    Pong,
    Ack,
    Locked,
    Challenge {
        token: String,
        expires_in_seconds: u16,
    },
    Entries {
        entries: Vec<NativeEntrySummary>,
    },
    FillData {
        username: String,
        password: String,
    },
    Error {
        code: NativeErrorCode,
        message: String,
    },
}
