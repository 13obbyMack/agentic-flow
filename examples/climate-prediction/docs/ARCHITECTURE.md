# Climate Prediction System Architecture

## Overview

This document describes the architecture of the modular climate prediction system built in Rust.

## System Design

### 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (CLI + REST API)        │
│  - climate-cli                              │
│  - climate-api                              │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Application Layer                          │
│  - Request handling                         │
│  - Workflow orchestration                   │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Domain Layer                               │
│  - climate-models (ML inference)            │
│  - climate-physics (constraints)            │
│  - climate-data (ingestion)                 │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Foundation Layer                           │
│  - climate-core (types, traits, errors)     │
└─────────────────────────────────────────────┘
```

### 2. Crate Responsibilities

#### climate-core
**Purpose**: Foundation layer with core abstractions

**Exports**:
- Types: `Location`, `Observation`, `Prediction`, `ClimateVariable`
- Traits: `DataSource`, `PredictionModel`, `PhysicsConstraint`
- Errors: `ClimateError`, `Result<T>`

**Dependencies**: Minimal (serde, chrono, thiserror)

#### climate-data
**Purpose**: Data ingestion from external APIs

**Responsibilities**:
- Fetch data from OpenWeather, NOAA, ERA5
- Parse and normalize different data formats
- Cache and rate limiting
- Data validation

**Key Types**:
- `OpenWeatherClient`
- `NoaaClient`
- `DataSourceRegistry`

#### climate-models
**Purpose**: ML model inference and management

**Responsibilities**:
- Load and run Candle models
- Model versioning and selection
- Batch inference optimization
- Model performance monitoring

**Key Types**:
- `ClimatePredictor`
- `ModelRegistry`
- `InferenceEngine`

#### climate-physics
**Purpose**: Physics-informed constraints

**Responsibilities**:
- Thermodynamic constraints
- Energy balance validation
- Physical bounds enforcement
- Atmospheric physics models

**Key Types**:
- `ThermodynamicConstraint`
- `EnergyBalanceValidator`
- `PhysicsEngine`

#### climate-api
**Purpose**: REST API server

**Responsibilities**:
- HTTP endpoint handlers
- Request validation
- Response formatting
- API documentation (OpenAPI)

**Endpoints**:
- `POST /predict` - Single prediction
- `POST /predict/batch` - Batch predictions
- `GET /models` - List available models
- `GET /health` - Health check

#### climate-cli
**Purpose**: Command-line interface

**Commands**:
- `climate predict --location <lat,lon> --variable temp`
- `climate batch --file locations.json`
- `climate models list`
- `climate serve` - Start API server

### 3. Data Flow

```
User Request
    │
    ▼
┌──────────────┐
│ CLI / API    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Validation   │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌─────────────┐
│ Data Fetch   │─────▶│ Data Source │
└──────┬───────┘      └─────────────┘
       │
       ▼
┌──────────────┐
│ Preprocessing│
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌─────────────┐
│ ML Inference │─────▶│ Candle      │
└──────┬───────┘      └─────────────┘
       │
       ▼
┌──────────────┐
│ Physics Check│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Response     │
└──────────────┘
```

### 4. Error Handling Strategy

**Hierarchical Error Types**:
- `ClimateError` - Top-level enum
- Domain-specific variants
- Error context preservation
- User-friendly messages

**Error Propagation**:
```rust
// Library code returns Result<T, ClimateError>
pub async fn predict(req: &PredictionRequest) -> Result<Vec<Prediction>> {
    let data = fetch_data(req).await?;
    let predictions = run_model(data)?;
    validate_physics(predictions)?;
    Ok(predictions)
}

// Application code converts to anyhow::Error
pub async fn handle_predict(req: PredictionRequest) -> anyhow::Result<Response> {
    let predictions = predictor.predict(&req).await
        .context("Failed to generate predictions")?;
    Ok(Response::from(predictions))
}
```

### 5. Configuration Management

**Config Hierarchy**:
1. Default values (compiled in)
2. Config file (`config/default.toml`)
3. Environment variables (`CLIMATE_*`)
4. Command-line arguments

**Config Structure**:
```toml
[api]
host = "127.0.0.1"
port = 8080

[data_sources]
openweather_api_key = "${OPENWEATHER_API_KEY}"
cache_ttl_seconds = 3600

[models]
default_model = "climate-v1"
model_dir = "./models"

[physics]
enable_constraints = true
strict_validation = false
```

### 6. Trait-Based Extensibility

**Adding New Data Sources**:
```rust
use climate_core::{DataSource, Result};

struct MyDataSource {
    api_key: String,
}

#[async_trait]
impl DataSource for MyDataSource {
    async fn fetch_observations(...) -> Result<Vec<Observation>> {
        // Implementation
    }

    fn name(&self) -> &str {
        "my-data-source"
    }
}
```

**Adding New Models**:
```rust
use climate_core::{PredictionModel, Result};

struct MyModel {
    weights: Vec<f32>,
}

#[async_trait]
impl PredictionModel for MyModel {
    async fn predict(...) -> Result<Vec<Prediction>> {
        // Implementation
    }
}
```

## Non-Functional Requirements

### Performance
- Target: <100ms p95 latency for single predictions
- Batch predictions: >1000 locations/second
- Model loading: <5 seconds cold start

### Scalability
- Horizontal scaling via stateless API
- Model serving via shared cache
- Database connection pooling

### Security
- API key validation
- Rate limiting per client
- Input sanitization
- HTTPS only in production

### Observability
- Structured logging (tracing)
- Prometheus metrics
- Health check endpoints
- Performance profiling hooks

## Technology Choices

### ML Framework: Candle
**Rationale**:
- Pure Rust implementation
- WASM support for browser
- Good performance
- Active development

**Trade-offs**:
- Smaller ecosystem than PyTorch
- Fewer pre-trained models
- Less mature tooling

### Web Framework: Axum
**Rationale**:
- Built on Tokio and Hyper
- Type-safe routing
- Excellent performance
- Good ergonomics

### Serialization: Serde
**Rationale**:
- Industry standard
- Zero-cost abstractions
- Excellent derive macros

## Deployment Architecture

```
┌─────────────────────────────────────┐
│  Load Balancer (nginx)              │
└───────────────┬─────────────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
┌─────▼─────┐     ┌───────▼──────┐
│ API Server│     │  API Server  │
│ Instance 1│     │  Instance 2  │
└─────┬─────┘     └───────┬──────┘
      │                   │
      └─────────┬─────────┘
                │
    ┌───────────▼──────────┐
    │  Shared Model Cache  │
    │  (Redis/Memcached)   │
    └──────────────────────┘
```

## Future Enhancements

1. **Distributed Training**: Support for training models across nodes
2. **Real-time Predictions**: WebSocket streaming
3. **Model Versioning**: A/B testing and gradual rollout
4. **Advanced Physics**: Fluid dynamics integration
5. **Ensemble Models**: Combine multiple models
6. **Geospatial Indexing**: R-tree for spatial queries

## References

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Candle Documentation](https://github.com/huggingface/candle)
- [Axum Documentation](https://docs.rs/axum/)
