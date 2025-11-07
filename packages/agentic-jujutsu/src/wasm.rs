//! WASM implementation with simulated command execution

use crate::error::{JJError, Result};
use wasm_bindgen::prelude::*;

/// Execute a jj command in WASM environment (simulated)
#[cfg(target_arch = "wasm32")]
pub async fn execute_jj_command(args: &[&str]) -> Result<String> {
    // Log to browser console
    web_sys::console::log_1(&format!("WASM: Executing jj {}", args.join(" ")).into());

    // For now, return simulated responses based on command
    let response = match args.first() {
        Some(&"version") | Some(&"--version") => {
            "jj 0.12.0 (WASM simulation)".to_string()
        }
        Some(&"status") => {
            "The working copy is clean\nWorking copy : qpvuntsm 12345678 (empty) (no description set)\nParent commit: zzzzzzzz 00000000 (empty) (no description set)".to_string()
        }
        Some(&"log") => {
            "@  qpvuntsm test@example.com 2024-01-01 12:00:00.000 12345678\n│  (empty) (no description set)\n◉  zzzzzzzz root() 00000000".to_string()
        }
        Some(&"branch") => {
            if args.len() > 1 && args[1] == "list" {
                "main: abc123def456\nfeature: def789abc012".to_string()
            } else {
                "Branch operation simulated".to_string()
            }
        }
        Some(&"diff") => {
            "+++ b/file.txt\n--- a/file.txt\n+Added line\n-Removed line".to_string()
        }
        Some(&"resolve") => {
            if args.contains(&"--list") {
                "No conflicts found".to_string()
            } else {
                "Conflicts resolved".to_string()
            }
        }
        Some(&"describe") => {
            "Working copy now at: qpvuntsm 12345678 Updated description".to_string()
        }
        Some(&"new") => {
            "Working copy now at: abcdefgh 87654321 (empty) (no description set)".to_string()
        }
        Some(&"edit") => {
            "Working copy now at: requested commit".to_string()
        }
        Some(&"abandon") => {
            "Abandoned commit".to_string()
        }
        Some(&"squash") => {
            "Squashed commits".to_string()
        }
        Some(&"rebase") => {
            "Rebased commits".to_string()
        }
        Some(&"undo") => {
            "Undid operation".to_string()
        }
        Some(&"restore") => {
            "Restored files".to_string()
        }
        Some(&"git") => {
            if args.len() > 1 && args[1] == "fetch" {
                "Fetched from remote".to_string()
            } else if args.len() > 1 && args[1] == "push" {
                "Pushed to remote".to_string()
            } else {
                "Git operation simulated".to_string()
            }
        }
        _ => {
            return Err(JJError::CommandFailed(format!(
                "Unknown command in WASM simulation: {}",
                args.join(" ")
            )));
        }
    };

    Ok(response)
}

/// Stub for non-WASM builds
#[cfg(not(target_arch = "wasm32"))]
pub async fn execute_jj_command(_args: &[&str]) -> Result<String> {
    Err(JJError::CommandFailed(
        "WASM execution not available in this build".to_string(),
    ))
}

/// Initialize WASM module
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn wasm_init() {
    console_error_panic_hook::set_once();
    web_sys::console::log_1(&"agentic-jujutsu WASM module initialized".into());
}

#[cfg(all(test, target_arch = "wasm32"))]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_wasm_version() {
        let result = execute_jj_command(&["version"]).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("WASM simulation"));
    }

    #[wasm_bindgen_test]
    async fn test_wasm_status() {
        let result = execute_jj_command(&["status"]).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Working copy"));
    }

    #[wasm_bindgen_test]
    async fn test_wasm_unknown_command() {
        let result = execute_jj_command(&["unknown_command"]).await;
        assert!(result.is_err());
    }
}
