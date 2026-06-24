use crate::commands::CommandService;

pub struct AppState {
    pub commands: CommandService,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            commands: CommandService::new()?,
        })
    }
}
