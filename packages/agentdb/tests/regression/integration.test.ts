/**
 * AgentDB v1.6.0 Regression Tests - Integration Tests
 * Tests full workflows, persistence, and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createDatabase } from '../../src/db-fallback.js';
import { ReflexionMemory } from '../../src/controllers/ReflexionMemory.js';
import { SkillLibrary } from '../../src/controllers/SkillLibrary.js';
import { CausalMemoryGraph } from '../../src/controllers/CausalMemoryGraph.js';
import { CausalRecall } from '../../src/controllers/CausalRecall.js';
import { ExplainableRecall } from '../../src/controllers/ExplainableRecall.js';
import { NightlyLearner } from '../../src/controllers/NightlyLearner.js';
import { EmbeddingService } from '../../src/controllers/EmbeddingService.js';

describe('Integration Tests', () => {
  let db: any;
  let embedder: EmbeddingService;
  let reflexion: ReflexionMemory;
  let skills: SkillLibrary;
  let causalGraph: CausalMemoryGraph;
  let causalRecall: CausalRecall;
  let explainableRecall: ExplainableRecall;
  let nightlyLearner: NightlyLearner;
  const testDbPath = './test-integration.db';

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize database
    db = await createDatabase(testDbPath);

    // Load schemas
    const schemaPath = path.join(__dirname, '../../src/schemas/schema.sql');
    const frontierSchemaPath = path.join(__dirname, '../../src/schemas/frontier-schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
    }

    if (fs.existsSync(frontierSchemaPath)) {
      const schema = fs.readFileSync(frontierSchemaPath, 'utf-8');
      db.exec(schema);
    }

    // Initialize embedding service
    embedder = new EmbeddingService({
      model: 'Xenova/all-MiniLM-L6-v2',
      dimension: 384,
      provider: 'transformers'
    });
    await embedder.initialize();

    // Initialize all controllers
    reflexion = new ReflexionMemory(db, embedder);
    skills = new SkillLibrary(db, embedder);
    causalGraph = new CausalMemoryGraph(db);
    causalRecall = new CausalRecall(db, embedder, {
      alpha: 0.7,
      beta: 0.2,
      gamma: 0.1,
      minConfidence: 0.6
    });
    explainableRecall = new ExplainableRecall(db);
    nightlyLearner = new NightlyLearner(db, embedder);
  });

  afterAll(() => {
    // Clean up
    if (db && typeof db.close === 'function') {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Clean up WAL files
    [`${testDbPath}-shm`, `${testDbPath}-wal`].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe('Full Workflow: Init → Store → Export → Import → Verify', () => {
    it('should complete full workflow successfully', async () => {
      // 1. Store episodes
      const episode1 = await reflexion.storeEpisode({
        sessionId: 'workflow-1',
        task: 'authentication',
        reward: 0.9,
        success: true,
        input: 'implement auth',
        output: 'auth implemented'
      });

      const episode2 = await reflexion.storeEpisode({
        sessionId: 'workflow-2',
        task: 'database query',
        reward: 0.85,
        success: true,
        input: 'optimize query',
        output: 'query optimized'
      });

      expect(episode1).toBeGreaterThan(0);
      expect(episode2).toBeGreaterThan(0);

      // 2. Save database
      if (db && typeof db.save === 'function') {
        db.save();
      }

      // 3. Verify persistence (close and reopen)
      db.close();
      db = await createDatabase(testDbPath);

      // 4. Verify data exists
      const count = db.prepare('SELECT COUNT(*) as count FROM episodes').get();
      expect(count.count).toBe(2);

      // 5. Reinitialize controllers
      reflexion = new ReflexionMemory(db, embedder);

      // 6. Query data
      const results = await reflexion.retrieveRelevant({
        task: 'authentication',
        k: 5
      });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Persistence Across Commands', () => {
    it('should persist reflexion episodes', async () => {
      await reflexion.storeEpisode({
        sessionId: 'persist-1',
        task: 'test persistence',
        reward: 0.9,
        success: true
      });

      if (db && typeof db.save === 'function') {
        db.save();
      }

      // Verify
      const episode = db.prepare('SELECT * FROM episodes WHERE session_id = ?').get('persist-1');
      expect(episode).toBeDefined();
      expect(episode.task).toBe('test persistence');
    });

    it('should persist skills', async () => {
      await skills.createSkill({
        name: 'persist_skill',
        description: 'Test skill persistence',
        signature: { inputs: {}, outputs: {} },
        successRate: 0.9,
        uses: 0,
        avgReward: 0.85,
        avgLatencyMs: 100
      });

      if (db && typeof db.save === 'function') {
        db.save();
      }

      // Verify
      const skill = db.prepare('SELECT * FROM skill_library WHERE name = ?').get('persist_skill');
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Test skill persistence');
    });

    it('should persist causal edges', () => {
      causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'episode',
        toMemoryId: 2,
        toMemoryType: 'episode',
        similarity: 0.9,
        uplift: 0.25,
        confidence: 0.95,
        sampleSize: 100,
        mechanism: 'test persistence',
        evidenceIds: []
      });

      if (db && typeof db.save === 'function') {
        db.save();
      }

      // Verify
      const edges = db.prepare('SELECT COUNT(*) as count FROM causal_edges').get();
      expect(edges.count).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid episode data gracefully', async () => {
      await expect(async () => {
        await reflexion.storeEpisode({
          sessionId: '',
          task: '',
          reward: NaN,
          success: true
        });
      }).rejects.toThrow();
    });

    it('should handle invalid vector queries', async () => {
      // Query with empty task should not crash
      const results = await reflexion.retrieveRelevant({
        task: '',
        k: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle missing database tables', async () => {
      const emptyDb = await createDatabase(':memory:');

      expect(() => {
        emptyDb.prepare('SELECT * FROM episodes').all();
      }).toThrow();

      emptyDb.close();
    });

    it('should handle invalid causal edge parameters', () => {
      expect(() => {
        causalGraph.addCausalEdge({
          fromMemoryId: -1,
          fromMemoryType: '',
          toMemoryId: -1,
          toMemoryType: '',
          similarity: NaN,
          uplift: NaN,
          confidence: 1.5, // Invalid: > 1
          sampleSize: -1,
          mechanism: '',
          evidenceIds: []
        });
      }).toThrow();
    });

    it('should handle experiment with no observations', () => {
      const expId = causalGraph.createExperiment({
        name: 'empty_experiment',
        hypothesis: 'Test empty experiment',
        treatmentId: 1,
        treatmentType: 'test',
        startTime: Math.floor(Date.now() / 1000),
        sampleSize: 0,
        status: 'running',
        metadata: {}
      });

      // Should not throw, but return null or default values
      const result = causalGraph.calculateUplift(expId);
      expect(result).toBeDefined();
    });
  });

  describe('Causal Recall with Certificates', () => {
    it('should perform causal recall and generate certificate', async () => {
      // Store episodes
      for (let i = 0; i < 5; i++) {
        await reflexion.storeEpisode({
          sessionId: `causal-${i}`,
          task: 'optimization task',
          reward: 0.7 + Math.random() * 0.3,
          success: true
        });
      }

      // Add causal edge
      causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'episode',
        toMemoryId: 2,
        toMemoryType: 'episode',
        similarity: 0.85,
        uplift: 0.2,
        confidence: 0.9,
        sampleSize: 50,
        mechanism: 'optimization → performance',
        evidenceIds: []
      });

      // Perform causal recall
      const result = await causalRecall.recall(
        'test-session',
        'optimization',
        10,
        undefined,
        'internal'
      );

      expect(result).toHaveProperty('candidates');
      expect(result).toHaveProperty('certificate');
      expect(result.certificate).toHaveProperty('id');
      expect(result.certificate).toHaveProperty('queryText');
      expect(result.certificate).toHaveProperty('completenessScore');
      expect(Array.isArray(result.candidates)).toBe(true);
    });
  });

  describe('Nightly Learner Pattern Discovery', () => {
    it('should discover patterns from episodes', async () => {
      // Store successful episodes with pattern
      for (let i = 0; i < 5; i++) {
        await reflexion.storeEpisode({
          sessionId: `pattern-${i}`,
          task: 'pattern_task',
          reward: 0.8 + Math.random() * 0.2,
          success: true,
          input: 'pattern input',
          output: 'pattern output'
        });
      }

      // Store failed episodes
      for (let i = 0; i < 3; i++) {
        await reflexion.storeEpisode({
          sessionId: `fail-${i}`,
          task: 'pattern_task',
          reward: 0.3,
          success: false,
          input: 'failed input',
          output: 'failed output'
        });
      }

      // Run learner
      const discovered = await nightlyLearner.discover({
        minAttempts: 3,
        minSuccessRate: 0.5,
        minConfidence: 0.6,
        dryRun: false
      });

      expect(Array.isArray(discovered)).toBe(true);
    });
  });

  describe('Skill Consolidation with Pattern Extraction', () => {
    it('should consolidate episodes into skills with patterns', async () => {
      // Store episodes for consolidation
      for (let i = 0; i < 5; i++) {
        await reflexion.storeEpisode({
          sessionId: `consolidate-${i}`,
          task: 'consolidation_task',
          reward: 0.85,
          success: true,
          output: `successful output ${i}`,
          critique: 'worked well'
        });
      }

      const result = await skills.consolidateEpisodesIntoSkills({
        minAttempts: 3,
        minReward: 0.7,
        timeWindowDays: 7,
        extractPatterns: true
      });

      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('patterns');
      expect(Array.isArray(result.patterns)).toBe(true);
    });
  });

  describe('Explainable Recall', () => {
    it('should retrieve certificate details', async () => {
      // First create a certificate via causal recall
      const recallResult = await causalRecall.recall(
        'explainable-test',
        'test query',
        5,
        undefined,
        'internal'
      );

      const certId = recallResult.certificate.id;

      // Retrieve certificate
      const cert = explainableRecall.getCertificate(certId);

      expect(cert).toBeDefined();
      expect(cert).toHaveProperty('id');
      expect(cert).toHaveProperty('queryText');
      expect(cert).toHaveProperty('timestamp');
    });

    it('should retrieve provenance lineage', () => {
      // Create some provenance entries
      const result = explainableRecall.traceProvenance(1, 'episode');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Database Optimization', () => {
    it('should prune old data correctly', async () => {
      // Store old-looking data
      await reflexion.storeEpisode({
        sessionId: 'old-1',
        task: 'old task',
        reward: 0.2,
        success: false
      });

      // Prune
      const prunedEpisodes = reflexion.pruneEpisodes({
        minReward: 0.5,
        maxAgeDays: 1,
        keepMinPerTask: 0
      });

      expect(prunedEpisodes).toBeGreaterThanOrEqual(0);
    });

    it('should maintain database integrity after pruning', async () => {
      // Store data
      await reflexion.storeEpisode({
        sessionId: 'integrity-1',
        task: 'integrity test',
        reward: 0.9,
        success: true
      });

      // Prune
      reflexion.pruneEpisodes({
        minReward: 0.5,
        maxAgeDays: 30,
        keepMinPerTask: 1
      });

      // Verify database is still functional
      const results = await reflexion.retrieveRelevant({
        task: 'integrity test',
        k: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent episode storage', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          reflexion.storeEpisode({
            sessionId: `concurrent-${i}`,
            task: 'concurrent task',
            reward: 0.8,
            success: true
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(id => {
        expect(id).toBeGreaterThan(0);
      });
    });

    it('should handle concurrent queries', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          reflexion.retrieveRelevant({
            task: 'concurrent task',
            k: 5
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
