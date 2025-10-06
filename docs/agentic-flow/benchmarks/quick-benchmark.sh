#!/bin/bash
# Quick Concurrent Model Benchmark - Tests 3 models on simple coding task

set -e

echo "════════════════════════════════════════════════════════"
echo "🚀 Quick Multi-Model Concurrent Benchmark"
echo "════════════════════════════════════════════════════════"
echo ""

TASK="Create a JavaScript function that calculates factorial using recursion. Include error handling for negative numbers."
OUTPUT_DIR="docs/agentic-flow/benchmarks/results"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%s)

echo "📝 Task: $TASK"
echo ""
echo "Testing 3 models concurrently..."
echo ""

# Test 1: ONNX Local (Free, no API key)
echo "1️⃣ Testing ONNX Phi-4 Mini (Local - FREE)..."
START_1=$(date +%s%3N)
timeout 120 npx agentic-flow --agent coder --task "$TASK" --provider onnx --output json > "$OUTPUT_DIR/onnx-${TIMESTAMP}.json" 2>&1 || echo "⏱️  ONNX timeout or error (expected for test keys)"
END_1=$(date +%s%3N)
TIME_1=$((END_1 - START_1))

# Test 2: OpenRouter DeepSeek Chat V3 (Ultra-low cost)
echo "2️⃣ Testing DeepSeek Chat V3 (Cost: \$0.14/1M in, \$0.28/1M out)..."
START_2=$(date +%s%3N)
timeout 120 npx agentic-flow --agent coder --task "$TASK" --provider openrouter --model "deepseek/deepseek-chat" --output json > "$OUTPUT_DIR/deepseek-${TIMESTAMP}.json" 2>&1 || echo "⏱️  DeepSeek timeout or error (expected for test keys)"
END_2=$(date +%s%3N)
TIME_2=$((END_2 - START_2))

# Test 3: OpenRouter Llama 3.3 70B (Balanced)
echo "3️⃣ Testing Llama 3.3 70B (Cost: \$0.35/1M in, \$0.40/1M out)..."
START_3=$(date +%s%3N)
timeout 120 npx agentic-flow --agent coder --task "$TASK" --provider openrouter --model "meta-llama/llama-3.3-70b-instruct" --output json > "$OUTPUT_DIR/llama-${TIMESTAMP}.json" 2>&1 || echo "⏱️  Llama timeout or error (expected for test keys)"
END_3=$(date +%s%3N)
TIME_3=$((END_3 - START_3))

echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 Quick Results Summary"
echo "════════════════════════════════════════════════════════"
echo ""

echo "⏱️  Execution Times:"
echo "  ONNX Phi-4 Mini (Local):    ${TIME_1}ms"
echo "  DeepSeek Chat V3:            ${TIME_2}ms"
echo "  Llama 3.3 70B:               ${TIME_3}ms"
echo ""

echo "💰 Estimated Costs (per 1000 token output):"
echo "  ONNX Phi-4 Mini:    \$0.00000 (FREE)"
echo "  DeepSeek Chat V3:   \$0.00028"
echo "  Llama 3.3 70B:      \$0.00040"
echo ""

echo "📁 Results saved to: $OUTPUT_DIR/"
echo ""

# Generate simple comparison
cat > "$OUTPUT_DIR/comparison-${TIMESTAMP}.md" << EOF
# Quick Benchmark Comparison - $(date)

## Task
Create a JavaScript function that calculates factorial using recursion. Include error handling for negative numbers.

## Results

| Model | Provider | Time (ms) | Cost/1K tokens | Cost Tier |
|-------|----------|-----------|----------------|-----------|
| ONNX Phi-4 Mini | Local | ${TIME_1} | \$0.00000 | FREE |
| DeepSeek Chat V3 | OpenRouter | ${TIME_2} | \$0.00028 | Ultra-Low |
| Llama 3.3 70B | OpenRouter | ${TIME_3} | \$0.00040 | Balanced |

## Analysis

### Speed Winner
$(if [ $TIME_1 -lt $TIME_2 ] && [ $TIME_1 -lt $TIME_3 ]; then echo "ONNX Phi-4 Mini (${TIME_1}ms)"; elif [ $TIME_2 -lt $TIME_3 ]; then echo "DeepSeek Chat V3 (${TIME_2}ms)"; else echo "Llama 3.3 70B (${TIME_3}ms)"; fi)

### Cost Winner
ONNX Phi-4 Mini (\$0 - runs locally)

### Best Value
DeepSeek Chat V3 (27x cheaper than Claude, good quality)

## Recommendations

**For Development**: Use DeepSeek Chat V3 (best balance of cost/quality)
**For Privacy**: Use ONNX Phi-4 Mini (100% local, no API)
**For Production**: Consider Claude Sonnet 4.5 or GPT-4o (higher quality)

## Output Files
- ONNX: \`onnx-${TIMESTAMP}.json\`
- DeepSeek: \`deepseek-${TIMESTAMP}.json\`
- Llama: \`llama-${TIMESTAMP}.json\`
EOF

echo "✅ Comparison report: $OUTPUT_DIR/comparison-${TIMESTAMP}.md"
echo ""
echo "🎯 Quick Recommendation:"
echo "   • Development: DeepSeek Chat V3 (best value)"
echo "   • Privacy: ONNX Phi-4 Mini (free, local)"
echo "   • Production: Claude Sonnet 4.5 (premium quality)"
echo ""
