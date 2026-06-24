use arboard::Clipboard;

pub trait ClipboardSink {
    fn set_text(&mut self, text: &str) -> Result<(), ClipboardError>;
    fn clear(&mut self) -> Result<(), ClipboardError>;

    fn peek_text(&self) -> Option<&str> {
        None
    }
}

#[derive(Debug)]
pub enum ClipboardError {
    Set,
    Clear,
}

pub struct SystemClipboard {
    inner: Clipboard,
}

impl SystemClipboard {
    pub fn new() -> Result<Self, ClipboardError> {
        let inner = Clipboard::new().map_err(|_| ClipboardError::Set)?;
        Ok(Self { inner })
    }
}

impl ClipboardSink for SystemClipboard {
    fn set_text(&mut self, text: &str) -> Result<(), ClipboardError> {
        self.inner
            .set_text(text.to_owned())
            .map_err(|_| ClipboardError::Set)
    }

    fn clear(&mut self) -> Result<(), ClipboardError> {
        self.inner
            .set_text(String::new())
            .map_err(|_| ClipboardError::Clear)
    }
}

#[derive(Debug, Default)]
pub struct InMemoryClipboard {
    value: Option<String>,
}

impl InMemoryClipboard {
    pub fn content(&self) -> Option<&str> {
        self.value.as_deref()
    }
}

impl ClipboardSink for InMemoryClipboard {
    fn set_text(&mut self, text: &str) -> Result<(), ClipboardError> {
        self.value = Some(text.to_owned());
        Ok(())
    }

    fn clear(&mut self) -> Result<(), ClipboardError> {
        self.value = None;
        Ok(())
    }

    fn peek_text(&self) -> Option<&str> {
        self.value.as_deref()
    }
}
