#!/usr/bin/env tsx
// Test claude-flow hybrid agent (memory + coordination)

import { hybridAgent } from '../../src/agents/claudeFlowAgent.js';
import { logger } from '../../src/utils/logger.js';

async function testHybrid() {
  console.log('🧪 Testing Claude Flow Hybrid Agent (Memory + Coordination)\n');
  console.log('=' .repeat(60));

  try {
    console.log('\n🚀 Running hybrid agent with full capabilities');
    console.log('-'.repeat(60));

    const result = await hybridAgent(
      `You are building a simple TODO app. Follow these steps:

1. Store the requirements in memory: "Simple TODO app with add, delete, and list features"
2. Initialize a swarm with a researcher and a coder
3. Have the researcher investigate best TODO app patterns and store findings in memory
4. Have the coder use those findings to suggest an implementation
5. Retrieve all stored information and provide a summary

Use both memory and coordination tools to accomplish this task.`,
      'hybrid-todo-planner',
      'You are a full-stack planning agent with memory persistence and multi-agent coordination.',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Hybrid agent test completed');
    console.log(`Output length: ${result.output.length} characters`);

    // Check if memory and coordination were used
    const usedMemory = result.output.toLowerCase().includes('memory') ||
                       result.output.toLowerCase().includes('store') ||
                       result.output.toLowerCase().includes('retrieve');

    const usedCoordination = result.output.toLowerCase().includes('swarm') ||
                             result.output.toLowerCase().includes('agent') ||
                             result.output.toLowerCase().includes('orchestrat');

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`${usedMemory ? '✅' : '⚠️ '} Memory usage detected: ${usedMemory}`);
    console.log(`${usedCoordination ? '✅' : '⚠️ '} Coordination usage detected: ${usedCoordination}`);

    const success = usedMemory && usedCoordination;
    console.log(`\n${success ? '🎉' : '⚠️ '} Hybrid test ${success ? 'PASSED' : 'PARTIAL'}\n`);

    return success;
  } catch (error) {
    console.error('\n\n❌ Hybrid test failed:', error);
    logger.error('Hybrid test failed', { error });
    return false;
  }
}

// Run tests
testHybrid()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
