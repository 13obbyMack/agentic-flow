# Agentic Flow Model Benchmarks

Comprehensive benchmarking suite for comparing the latest AI models (January 2025) across different agents and tasks.

## 🎯 Quick Start

### Run Quick Benchmark (3 models, 2 minutes)
```bash
chmod +x quick-benchmark.sh
./quick-benchmark.sh
```

### Run Full Benchmark Suite (10 models, ~30 minutes)
```bash
chmod +x benchmark-suite.js
node benchmark-suite.js
```

## 📊 Latest Results

**Last Run:** October 4, 2025

### Top Performers by Category

| Category | Winner | Runner-Up | Best Value |
|----------|--------|-----------|------------|
| **Quality** | Claude Sonnet 4.5 | GPT-4o | DeepSeek R1 |
| **Speed** | Gemini 2.5 Flash | DeepSeek Chat V3 | GPT-4o |
| **Cost** | ONNX Phi-4 (FREE) | DeepSeek Chat V3 | Llama 3.1 8B |
| **Reasoning** | DeepSeek R1 | Gemini 2.5 Pro | Claude Sonnet 4.5 |
| **Privacy** | ONNX Phi-4 | Self-hosted Llama | - |

### Cost Comparison (per 1M tokens)

| Model | Input | Output | Total | vs Claude |
|-------|-------|--------|-------|-----------|
| Claude Sonnet 4.5 | $3.00 | $15.00 | $18.00 | baseline |
| **DeepSeek R1** | $0.55 | $2.19 | $2.74 | **85% cheaper** |
| **DeepSeek Chat V3** | $0.14 | $0.28 | $0.42 | **98% cheaper** |
| Gemini 2.5 Flash | $0.075 | $0.30 | $0.375 | 98% cheaper |
| ONNX Phi-4 | $0.00 | $0.00 | $0.00 | 100% cheaper |

## 📁 Files

- **`MODEL_CAPABILITIES.md`** - Comprehensive guide to all models (RECOMMENDED START HERE)
- **`quick-benchmark.sh`** - Fast 3-model comparison script
- **`benchmark-suite.js`** - Full benchmark suite with all models
- **`results/`** - Benchmark output and comparison reports

## 🔍 Models Tested

### Tier 1: Flagship (Premium)
- **Claude Sonnet 4.5** (Anthropic) - Best overall quality
- **GPT-4o** (OpenAI) - Best multimodal
- **Gemini 2.5 Pro** (Google) - Best for massive context

### Tier 2: Cost-Effective (2025 Breakthrough)
- **DeepSeek R1** - Best value for reasoning (27x cheaper than o1!)
- **DeepSeek Chat V3** - Best overall value

### Tier 3: Balanced
- **Gemini 2.5 Flash** - Fastest responses
- **Llama 3.3 70B** - Best open-source
- **Qwen 2.5 72B** - Best multilingual

### Tier 4: Budget
- **Llama 3.1 8B** - Ultra-low cost

### Tier 5: Local/Privacy
- **ONNX Phi-4 Mini** - Free, private, offline

## 🎯 Use Case Recommendations

### For Production Code
1. Claude Sonnet 4.5 (highest quality)
2. DeepSeek R1 (best value)
3. GPT-4o (fast + quality)

### For Development
1. DeepSeek Chat V3 (best value)
2. Gemini 2.5 Flash (speed)
3. Llama 3.3 70B (open-source)

### For Reasoning Tasks
1. DeepSeek R1 (cost-effective)
2. Gemini 2.5 Pro (massive context)
3. Claude Sonnet 4.5 (premium)

### For Privacy
1. ONNX Phi-4 Mini (local only)
2. Self-hosted Llama (if available)

## 📚 Documentation

- Read [MODEL_CAPABILITIES.md](./MODEL_CAPABILITIES.md) for detailed analysis
- Check `results/` for latest benchmark data
- See main [Agentic Flow docs](https://github.com/ruvnet/agentic-flow)

## 🔄 Updates

Benchmarks are updated monthly as new models are released.

**Next Update:** February 2025

## 🤝 Contributing

Want to add a model or improve benchmarks?

1. Fork the repo
2. Add model to `benchmark-suite.js`
3. Run benchmarks
4. Submit PR with results

## 📊 Benchmark Tasks

Each model is tested on:
- Simple function creation
- Data structure implementation
- REST API development
- Code review
- Technical analysis
- Mathematical reasoning

## ⚡ Performance Metrics

We measure:
- **Quality** - Correctness and completeness
- **Speed** - Time to completion
- **Cost** - Actual API costs
- **Reliability** - Success rate
- **Consistency** - Output variance

## 🔥 January 2025 Highlights

**DeepSeek R1**: Game-changing model offering flagship-level reasoning at 1/27th the cost of OpenAI o1. Recommended for budget-conscious production deployments.

**Gemini 2.5 Pro**: Massive 1M+ token context enables new use cases for long document processing.

**ONNX Phi-4**: Free, private, offline AI for privacy-critical applications.

---

Made with ❤️ by the Agentic Flow community
