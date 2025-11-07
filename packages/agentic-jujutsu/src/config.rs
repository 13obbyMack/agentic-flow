//! Configuration for agentic-jujutsu

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Configuration for JJWrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct JJConfig {
    /// Path to jj executable (default: "jj")
    pub jj_path: String,

    /// Repository path (default: current directory)
    pub repo_path: String,

    /// Timeout for operations in milliseconds
    pub timeout_ms: u64,

    /// Enable verbose logging
    pub verbose: bool,

    /// Maximum operation log entries to keep in memory
    pub max_log_entries: usize,

    /// Enable AgentDB sync
    pub enable_agentdb_sync: bool,
}

#[wasm_bindgen]
impl JJConfig {
    /// Create new configuration with defaults
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Create default configuration
    pub fn default_config() -> Self {
        Self::default()
    }

    /// Set jj executable path
    pub fn with_jj_path(mut self, path: String) -> Self {
        self.jj_path = path;
        self
    }

    /// Set repository path
    pub fn with_repo_path(mut self, path: String) -> Self {
        self.repo_path = path;
        self
    }

    /// Set operation timeout
    pub fn with_timeout(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    /// Enable verbose logging
    pub fn with_verbose(mut self, verbose: bool) -> Self {
        self.verbose = verbose;
        self
    }

    /// Set max log entries
    pub fn with_max_log_entries(mut self, max: usize) -> Self {
        self.max_log_entries = max;
        self
    }

    /// Enable AgentDB synchronization
    pub fn with_agentdb_sync(mut self, enable: bool) -> Self {
        self.enable_agentdb_sync = enable;
        self
    }
}

impl Default for JJConfig {
    fn default() -> Self {
        Self {
            jj_path: "jj".to_string(),
            repo_path: ".".to_string(),
            timeout_ms: 30000, // 30 seconds
            verbose: false,
            max_log_entries: 1000,
            enable_agentdb_sync: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = JJConfig::default();
        assert_eq!(config.jj_path, "jj");
        assert_eq!(config.timeout_ms, 30000);
        assert!(!config.verbose);
    }

    #[test]
    fn test_builder_pattern() {
        let config = JJConfig::default()
            .with_verbose(true)
            .with_timeout(60000)
            .with_max_log_entries(500);

        assert!(config.verbose);
        assert_eq!(config.timeout_ms, 60000);
        assert_eq!(config.max_log_entries, 500);
    }
}
