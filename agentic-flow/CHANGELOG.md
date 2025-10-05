# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2025-10-05

### Fixed
- Google Gemini API key validation and execution flow
- OpenRouter API key validation and execution flow
- Automatic .env file loading from parent directories
- Router configuration now auto-creates from environment variables

### Changed
- Integrated ModelRouter into directApiAgent.ts for multi-provider support
- Added recursive .env search in cli-proxy.ts
- Router now suppresses verbose logging by default (use ROUTER_VERBOSE=true to enable)
- Message format conversion between Anthropic and router formats

### Added
- Docker test configuration for API key validation
- Package verification script
- Package structure documentation
- Support for multiple AI providers (Anthropic, OpenRouter, Gemini, ONNX)

### Verified
- Package includes .claude/ directory with 76 agent files
- npm pack creates valid 601KB package
- npm install works correctly in clean directories
- Agents load correctly from installed package
- Build succeeds without errors

## [1.1.2] - 2025-10-04

### Initial Release
- Production-ready AI agent orchestration platform
- 66 specialized agents
- 111 MCP tools
- Autonomous multi-agent swarms
- Neural networks and memory persistence
- GitHub integration
- Distributed consensus protocols
