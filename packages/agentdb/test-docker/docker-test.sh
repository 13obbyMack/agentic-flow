#!/bin/bash
# Docker-based comprehensive test runner for AgentDB v1.1.0

set -e

echo "🐳 Building AgentDB Docker test image..."
echo ""

cd /workspaces/agentic-flow/packages/agentdb

# Build Docker image
docker build -f test-docker/Dockerfile -t agentdb-test:1.1.0 .

echo ""
echo "🧪 Running comprehensive feature tests in Docker..."
echo ""

# Run all tests in container
docker run --rm \
  -v "$(pwd)/test-docker/test-all-features.sh:/test-all-features.sh:ro" \
  agentdb-test:1.1.0 \
  sh /test-all-features.sh

echo ""
echo "✅ Docker tests completed successfully!"
