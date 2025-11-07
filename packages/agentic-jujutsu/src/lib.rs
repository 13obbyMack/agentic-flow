//! # Agentic-Jujutsu
//!
//! WASM-enabled Jujutsu VCS wrapper for AI agent collaboration and learning.
//!
//! ## Features
//!
//! - Zero-copy jj CLI operations
//! - Operation log parsing and tracking
//! - Conflict detection and resolution
//! - WASM bindings for JavaScript/TypeScript
//! - AgentDB integration

#![warn(missing_docs)]
#![deny(unsafe_code)]

use wasm_bindgen::prelude::*;

pub mod config;
pub mod error;
pub mod operations;
pub mod types;
pub mod wrapper;
pub mod hooks;
pub mod agentdb_sync;

#[cfg(feature = "native")]
pub mod native;

#[cfg(target_arch = "wasm32")]
pub mod wasm;

// Re-exports
pub use config::JJConfig;
pub use error::{JJError, Result};
pub use operations::{JJOperation, JJOperationLog, OperationType};
pub use types::{JJConflict, JJResult, JJCommit, JJBranch};
pub use wrapper::JJWrapper;
pub use hooks::{HookContext, HookEventType, JJHookEvent, JJHooksIntegration};
pub use agentdb_sync::{AgentDBSync, AgentDBEpisode, TaskStatistics};

/// Initialize panic hook for better error messages in WASM
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Version of the agentic-jujutsu crate
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}
