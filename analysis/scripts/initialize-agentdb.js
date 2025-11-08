#!/usr/bin/env node

/**
 * AgentDB Initialization for Maternal Life-History Trade-Off Analysis
 * Uses reasoning bank, vector search, and self-learning capabilities
 */

const { AgentDB } = require('agentdb');
const fs = require('fs');
const path = require('path');

async function initializeAgentDB() {
  console.log('🧠 Initializing AgentDB with Reasoning Bank...');

  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../config/agentdb-config.json'), 'utf8')
  );

  // Initialize database with vector and reasoning capabilities
  const db = new AgentDB({
    name: config.database.name,
    vector: {
      dimension: config.database.vectorDimension,
      quantization: config.database.quantization,
      indexType: config.database.indexType
    },
    learning: {
      enabled: true,
      algorithms: config.database.reasoningBank.algorithms,
      persistence: config.database.reasoningBank.sessionPersistence
    }
  });

  await db.connect();

  // Create collections for different data aspects
  await db.createCollection('maternal_health', {
    schema: {
      motherID: 'string',
      birthYear: 'number',
      offspringCount: 'number',
      longevity: 'number',
      environmentalStress: 'number',
      physiologicalMarkers: 'object',
      dataset: 'string'
    },
    indexes: ['motherID', 'birthYear', 'dataset']
  });

  await db.createCollection('causal_relationships', {
    schema: {
      factor1: 'string',
      factor2: 'string',
      correlationStrength: 'number',
      causalDirection: 'string',
      confidence: 'number',
      evidence: 'array'
    }
  });

  await db.createCollection('novel_patterns', {
    schema: {
      patternType: 'string',
      description: 'string',
      evidence: 'array',
      statisticalSignificance: 'number',
      discoveryMethod: 'string'
    }
  });

  // Initialize learning plugins
  console.log('🎓 Configuring learning algorithms...');
  await db.initializeLearning({
    algorithms: config.database.reasoningBank.algorithms,
    memoryPatterns: config.database.reasoningBank.memoryPatterns
  });

  console.log('✅ AgentDB initialized successfully');
  console.log(`📊 Collections: ${await db.listCollections()}`);

  return db;
}

// Export for use in analysis scripts
module.exports = { initializeAgentDB };

if (require.main === module) {
  initializeAgentDB()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Initialization failed:', err);
      process.exit(1);
    });
}
