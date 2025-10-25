/**
 * Quick HNSW Test and Benchmark
 */

import { HNSWIndex } from './dist/controllers/HNSWIndex.js';
import { WASMVectorSearch } from './dist/controllers/WASMVectorSearch.js';
import Database from 'better-sqlite3';

console.log('\n🚀 AgentDB HNSW Performance Test\n');
console.log('='.repeat(80));

// Generate random vector
function generateVector(dim = 1536) {
  const vector = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    vector[i] = Math.random() * 2 - 1;
  }
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return new Float32Array(vector.map(v => v / magnitude));
}

async function runTest() {
  const vectorCount = 10000;
  const searchCount = 100;

  console.log(`\n📊 Test Configuration:`);
  console.log(`   Vectors: ${vectorCount}`);
  console.log(`   Searches: ${searchCount}`);
  console.log(`   Dimension: 1536`);

  // Create database
  console.log(`\n📦 Creating test database...`);
  const db = new Database(':memory:');

  db.exec(`
    CREATE TABLE pattern_embeddings (
      pattern_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      metadata TEXT
    )
  `);

  // Insert vectors
  console.log(`   Inserting ${vectorCount} vectors...`);
  const insert = db.prepare(`
    INSERT INTO pattern_embeddings (pattern_id, embedding, metadata)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((vectors) => {
    for (const vec of vectors) {
      insert.run(vec.id, vec.embedding, vec.metadata);
    }
  });

  const vectors = [];
  for (let i = 0; i < vectorCount; i++) {
    const embedding = generateVector();
    vectors.push({
      id: i,
      embedding: Buffer.from(embedding.buffer),
      metadata: JSON.stringify({ index: i })
    });
  }

  insertMany(vectors);
  console.log(`   ✅ ${vectorCount} vectors inserted`);

  // Test HNSW
  console.log(`\n⚡ Testing HNSW Index...`);
  const hnswIndex = new HNSWIndex(db, {
    dimension: 1536,
    M: 16,
    efConstruction: 200,
    efSearch: 100,
    metric: 'cosine',
    persistIndex: false
  });

  const buildStart = Date.now();
  await hnswIndex.buildIndex();
  const buildTime = Date.now() - buildStart;
  console.log(`   Index built in ${buildTime}ms`);

  const queryVector = generateVector();
  const hnswStart = Date.now();

  for (let i = 0; i < searchCount; i++) {
    await hnswIndex.search(queryVector, 10);
  }

  const hnswDuration = Date.now() - hnswStart;
  const hnswAvg = hnswDuration / searchCount;

  console.log(`   Completed ${searchCount} searches in ${hnswDuration}ms`);
  console.log(`   Average: ${hnswAvg.toFixed(2)}ms per search`);

  // Test Brute-Force
  console.log(`\n🐌 Testing Brute-Force Search...`);
  const bruteForce = new WASMVectorSearch(db, {
    enableWASM: false,
    enableSIMD: false,
    batchSize: 100,
    indexThreshold: 999999
  });

  const bruteStart = Date.now();

  for (let i = 0; i < searchCount; i++) {
    await bruteForce.findKNN(queryVector, 10);
  }

  const bruteDuration = Date.now() - bruteStart;
  const bruteAvg = bruteDuration / searchCount;

  console.log(`   Completed ${searchCount} searches in ${bruteDuration}ms`);
  console.log(`   Average: ${bruteAvg.toFixed(2)}ms per search`);

  // Compare
  const speedup = bruteDuration / hnswDuration;
  const claimVerified = speedup >= 150;

  console.log(`\n📈 Performance Comparison:`);
  console.log('='.repeat(80));
  console.log(`   HNSW:        ${hnswAvg.toFixed(2)}ms per search`);
  console.log(`   Brute-Force: ${bruteAvg.toFixed(2)}ms per search`);
  console.log(`   Speedup:     ${speedup.toFixed(1)}x faster`);
  console.log(`   150x Claim:  ${claimVerified ? '✅ VERIFIED' : `⚠️  ${((speedup/150)*100).toFixed(1)}% of claim`}`);

  if (speedup >= 150) {
    console.log(`\n🎉 HNSW achieves ${speedup.toFixed(0)}x speedup - CLAIM VERIFIED!`);
  } else if (speedup >= 100) {
    console.log(`\n✅ HNSW achieves ${speedup.toFixed(0)}x speedup (excellent performance)`);
  } else if (speedup >= 50) {
    console.log(`\n✅ HNSW achieves ${speedup.toFixed(0)}x speedup (very good performance)`);
  } else {
    console.log(`\n⚠️  HNSW achieves ${speedup.toFixed(0)}x speedup (good, may need tuning)`);
  }

  db.close();

  console.log('\n='.repeat(80));
  console.log('✅ HNSW Test Complete!\n');
}

runTest().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
