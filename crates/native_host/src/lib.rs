use std::io::{Read, Write};
use std::time::Instant;

use desktop_backend::{DesktopBackend, InMemoryClipboard};
use native_protocol::{NativeErrorCode, NativeRequest, NativeResponse};
use secret_types::SecretString;
use thiserror::Error;
use vault_store::VaultStore;

pub trait RequestHandler {
    fn handle_request(&mut self, request: NativeRequest) -> NativeResponse;
}

#[derive(Debug, Error)]
pub enum NativeHostError {
    #[error("io failure")]
    Io,
    #[error("invalid frame")]
    InvalidFrame,
    #[error("json decode failed")]
    Decode,
    #[error("json encode failed")]
    Encode,
    #[error("configuration failed")]
    Config,
}

impl From<std::io::Error> for NativeHostError {
    fn from(_: std::io::Error) -> Self {
        Self::Io
    }
}

pub fn read_frame(reader: &mut impl Read) -> Result<Option<Vec<u8>>, NativeHostError> {
    let mut len_buf = [0_u8; 4];
    let read = reader.read(&mut len_buf)?;
    if read == 0 {
        return Ok(None);
    }
    if read != 4 {
        return Err(NativeHostError::InvalidFrame);
    }

    let len = u32::from_le_bytes(len_buf) as usize;
    if len == 0 || len > 1024 * 1024 {
        return Err(NativeHostError::InvalidFrame);
    }

    let mut data = vec![0_u8; len];
    reader.read_exact(data.as_mut_slice())?;
    Ok(Some(data))
}

pub fn write_frame(writer: &mut impl Write, payload: &[u8]) -> Result<(), NativeHostError> {
    let len = payload.len();
    if len == 0 || len > 1024 * 1024 {
        return Err(NativeHostError::InvalidFrame);
    }

    writer.write_all(&(len as u32).to_le_bytes())?;
    writer.write_all(payload)?;
    writer.flush()?;
    Ok(())
}

pub fn run_loop(
    reader: &mut impl Read,
    writer: &mut impl Write,
    handler: &mut impl RequestHandler,
) -> Result<(), NativeHostError> {
    while let Some(frame) = read_frame(reader)? {
        let request: NativeRequest =
            serde_json::from_slice(frame.as_slice()).map_err(|_| NativeHostError::Decode)?;

        let response = handler.handle_request(request);
        let payload = serde_json::to_vec(&response).map_err(|_| NativeHostError::Encode)?;
        write_frame(writer, payload.as_slice())?;
    }

    Ok(())
}

#[derive(Default)]
pub struct LockedHandler;

impl RequestHandler for LockedHandler {
    fn handle_request(&mut self, request: NativeRequest) -> NativeResponse {
        match request {
            NativeRequest::Ping => NativeResponse::Pong,
            NativeRequest::Lock => NativeResponse::Ack,
            NativeRequest::GetChallenge
            | NativeRequest::ListEntries { .. }
            | NativeRequest::FillForOrigin { .. } => NativeResponse::Error {
                code: NativeErrorCode::Locked,
                message: "desktop vault locked".to_owned(),
            },
        }
    }
}

pub struct DesktopHandler {
    backend: DesktopBackend<InMemoryClipboard>,
}

impl DesktopHandler {
    pub fn from_default_store() -> Result<Self, NativeHostError> {
        let store = VaultStore::from_default_path().ok_or(NativeHostError::Config)?;
        let mut backend = DesktopBackend::new(store, InMemoryClipboard::default());
        try_dev_unsafe_auto_unlock(&mut backend);

        Ok(Self { backend })
    }
}

#[cfg(debug_assertions)]
fn try_dev_unsafe_auto_unlock(backend: &mut DesktopBackend<InMemoryClipboard>) {
    // Dev-only escape hatch. Explicitly unsafe and opt-in.
    if let Ok(master_password) = std::env::var("PRIVATE_CHEST_DEV_UNSAFE_AUTO_UNLOCK") {
        if !master_password.is_empty() {
            let secret = SecretString::from(master_password);
            let _ = backend.unlock(&secret, Instant::now());
        }
    }
}

#[cfg(not(debug_assertions))]
fn try_dev_unsafe_auto_unlock(_: &mut DesktopBackend<InMemoryClipboard>) {}

impl RequestHandler for DesktopHandler {
    fn handle_request(&mut self, request: NativeRequest) -> NativeResponse {
        self.backend.handle_native_request(request, Instant::now())
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use native_protocol::{NativeRequest, NativeResponse};

    use crate::{read_frame, run_loop, write_frame, LockedHandler};

    #[test]
    fn frame_roundtrip() {
        let payload = br#"{\"type\":\"ping\"}"#;
        let mut out = Vec::new();
        write_frame(&mut out, payload).unwrap();

        let mut cursor = Cursor::new(out);
        let decoded = read_frame(&mut cursor).unwrap().unwrap();
        assert_eq!(decoded, payload);
    }

    #[test]
    fn loop_processes_ping() {
        let request = serde_json::to_vec(&NativeRequest::Ping).unwrap();
        let mut input = Vec::new();
        write_frame(&mut input, request.as_slice()).unwrap();

        let mut reader = Cursor::new(input);
        let mut output = Cursor::new(Vec::<u8>::new());
        let mut handler = LockedHandler;

        run_loop(&mut reader, &mut output, &mut handler).unwrap();

        output.set_position(0);
        let frame = read_frame(&mut output).unwrap().unwrap();
        let response: NativeResponse = serde_json::from_slice(frame.as_slice()).unwrap();
        assert_eq!(response, NativeResponse::Pong);
    }
}
