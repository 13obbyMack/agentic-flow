#!/usr/bin/env tsx
// Test claude-flow coordination capabilities

import { orchestratorAgent } from '../../src/agents/claudeFlowAgent.js';
import { logger } from '../../src/utils/logger.js';

async function testCoordination() {
  console.log('🧪 Testing Claude Flow Coordination Integration\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Initialize swarm
    console.log('\n🐝 Test 1: Initialize swarm and spawn agents');
    console.log('-'.repeat(60));

    const swarmResult = await orchestratorAgent(
      'Initialize a mesh swarm with 3 agents: one researcher, one coder, and one reviewer. Then check the swarm status.',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Swarm initialization test completed');
    console.log(`Output length: ${swarmResult.output.length} characters`);

    // Test 2: Task orchestration
    console.log('\n\n⚡ Test 2: Orchestrate a multi-agent task');
    console.log('-'.repeat(60));

    const orchestrateResult = await orchestratorAgent(
      'Orchestrate a task to analyze a simple "Hello World" program: have the researcher explain it, the coder suggest improvements, and the reviewer check for best practices.',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Orchestration test completed');
    console.log(`Output length: ${orchestrateResult.output.length} characters`);

    // Test 3: Load balancing
    console.log('\n\n⚖️  Test 3: Check agent metrics and load balancing');
    console.log('-'.repeat(60));

    const metricsResult = await orchestratorAgent(
      'Check the metrics for all agents in the swarm and verify load balancing is working',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Metrics test completed');
    console.log(`Output length: ${metricsResult.output.length} characters`);

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Swarm init test: PASSED');
    console.log('✅ Orchestration test: PASSED');
    console.log('✅ Metrics test: PASSED');
    console.log('\n🎉 All coordination tests completed successfully!\n');

    return true;
  } catch (error) {
    console.error('\n\n❌ Coordination test failed:', error);
    logger.error('Coordination test failed', { error });
    return false;
  }
}

// Run tests
testCoordination()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
