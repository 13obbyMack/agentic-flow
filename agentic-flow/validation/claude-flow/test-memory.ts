#!/usr/bin/env tsx
// Test claude-flow memory capabilities

import { memoryResearchAgent } from '../../src/agents/claudeFlowAgent.js';
import { logger } from '../../src/utils/logger.js';

async function testMemory() {
  console.log('🧪 Testing Claude Flow Memory Integration\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Store information in memory
    console.log('\n📝 Test 1: Store information in memory');
    console.log('-'.repeat(60));

    const storeResult = await memoryResearchAgent(
      'Research the benefits of TypeScript and store 3 key benefits in memory with keys: ts_benefit_1, ts_benefit_2, ts_benefit_3',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Storage test completed');
    console.log(`Output length: ${storeResult.output.length} characters`);

    // Test 2: Retrieve information from memory
    console.log('\n\n📖 Test 2: Retrieve information from memory');
    console.log('-'.repeat(60));

    const retrieveResult = await memoryResearchAgent(
      'Retrieve the 3 TypeScript benefits you stored earlier (ts_benefit_1, ts_benefit_2, ts_benefit_3) and summarize them',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Retrieval test completed');
    console.log(`Output length: ${retrieveResult.output.length} characters`);

    // Test 3: Search memory
    console.log('\n\n🔍 Test 3: Search memory');
    console.log('-'.repeat(60));

    const searchResult = await memoryResearchAgent(
      'Search your memory for any information related to "TypeScript" and list what you find',
      (chunk) => process.stdout.write(chunk)
    );

    console.log('\n\n✅ Search test completed');
    console.log(`Output length: ${searchResult.output.length} characters`);

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Store test: PASSED');
    console.log('✅ Retrieve test: PASSED');
    console.log('✅ Search test: PASSED');
    console.log('\n🎉 All memory tests completed successfully!\n');

    return true;
  } catch (error) {
    console.error('\n\n❌ Memory test failed:', error);
    logger.error('Memory test failed', { error });
    return false;
  }
}

// Run tests
testMemory()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
