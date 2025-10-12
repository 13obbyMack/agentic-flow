//! # Data Models
//!
//! Shared data structures for the CRISPR-Cas13 bioinformatics pipeline.
//! This crate provides common types used across all pipeline components.

pub mod error;
pub mod expression;
pub mod metadata;
pub mod sequencing;
pub mod targets;

pub use error::{DataModelError, Result};
