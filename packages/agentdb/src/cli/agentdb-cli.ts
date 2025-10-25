#!/usr/bin/env node
/**
 * AgentDB CLI - Command-line interface for frontier memory features
 *
 * Provides commands for:
 * - Causal memory graph operations
 * - Explainable recall with certificates
 * - Nightly learner automation
 * - Database management
 */

import Database from 'better-sqlite3';
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph.js';
import { CausalRecall } from '../controllers/CausalRecall.js';
import { ExplainableRecall } from '../controllers/ExplainableRecall.js';
import { NightlyLearner } from '../controllers/NightlyLearner.js';
import { ReflexionMemory, Episode, ReflexionQuery } from '../controllers/ReflexionMemory.js';
import { SkillLibrary, Skill, SkillQuery } from '../controllers/SkillLibrary.js';
import { EmbeddingService } from '../controllers/EmbeddingService.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

class AgentDBCLI {
  private db?: Database.Database;
  private causalGraph?: CausalMemoryGraph;
  private causalRecall?: CausalRecall;
  private explainableRecall?: ExplainableRecall;
  private nightlyLearner?: NightlyLearner;
  private reflexion?: ReflexionMemory;
  private skills?: SkillLibrary;
  private embedder?: EmbeddingService;

  async initialize(dbPath: string = './agentdb.db'): Promise<void> {
    // Initialize database
    this.db = new Database(dbPath);

    // Configure for performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');

    // Load both schemas: main schema (episodes, skills) + frontier schema (causal)
    const schemaFiles = ['schema.sql', 'frontier-schema.sql'];
    const basePaths = [
      path.join(__dirname, '../schemas'),  // dist/cli/../schemas
      path.join(__dirname, '../../src/schemas'),  // dist/cli/../../src/schemas
      path.join(process.cwd(), 'dist/schemas'),  // current/dist/schemas
      path.join(process.cwd(), 'src/schemas'),  // current/src/schemas
      path.join(process.cwd(), 'node_modules/agentdb/dist/schemas')  // installed package
    ];

    let schemasLoaded = 0;
    for (const basePath of basePaths) {
      if (fs.existsSync(basePath)) {
        for (const schemaFile of schemaFiles) {
          const schemaPath = path.join(basePath, schemaFile);
          if (fs.existsSync(schemaPath)) {
            try {
              const schema = fs.readFileSync(schemaPath, 'utf-8');
              this.db.exec(schema);
              schemasLoaded++;
            } catch (error) {
              log.error(`Failed to load schema from ${schemaPath}: ${(error as Error).message}`);
            }
          }
        }
        // If we found at least one schema in this path, we're done
        if (schemasLoaded > 0) break;
      }
    }

    if (schemasLoaded === 0) {
      log.warning('Schema files not found, database may not be initialized properly');
      log.info('__dirname: ' + __dirname);
      log.info('process.cwd(): ' + process.cwd());
      log.info('Tried base paths:');
      basePaths.forEach(p => {
        log.info(`  - ${p} (exists: ${fs.existsSync(p)})`);
      });
    }

    // Initialize embedding service
    this.embedder = new EmbeddingService({
      model: 'all-MiniLM-L6-v2',
      dimension: 384,
      provider: 'transformers'
    });
    await this.embedder.initialize();

    // Initialize controllers
    this.causalGraph = new CausalMemoryGraph(this.db);
    this.explainableRecall = new ExplainableRecall(this.db);
    this.causalRecall = new CausalRecall(this.db, this.embedder, {
      alpha: 0.7,
      beta: 0.2,
      gamma: 0.1,
      minConfidence: 0.6
    });
    this.nightlyLearner = new NightlyLearner(this.db, this.embedder);
    this.reflexion = new ReflexionMemory(this.db, this.embedder);
    this.skills = new SkillLibrary(this.db, this.embedder);
  }

  // ============================================================================
  // Causal Commands
  // ============================================================================

  async causalAddEdge(params: {
    cause: string;
    effect: string;
    uplift: number;
    confidence?: number;
    sampleSize?: number;
  }): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    log.header('\n📊 Adding Causal Edge');
    log.info(`Cause: ${params.cause}`);
    log.info(`Effect: ${params.effect}`);
    log.info(`Uplift: ${params.uplift}`);

    const edgeId = this.causalGraph.addCausalEdge({
      fromMemoryId: 1,
      fromMemoryType: 'episode',
      toMemoryId: 2,
      toMemoryType: 'episode',
      similarity: 0.9,
      uplift: params.uplift,
      confidence: params.confidence || 0.95,
      sampleSize: params.sampleSize || 0,
      mechanism: `${params.cause} → ${params.effect}`,
      evidenceIds: []
    });

    log.success(`Added causal edge #${edgeId}`);
  }

  async causalExperimentCreate(params: {
    name: string;
    cause: string;
    effect: string;
  }): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    log.header('\n🧪 Creating A/B Experiment');
    log.info(`Name: ${params.name}`);
    log.info(`Cause: ${params.cause}`);
    log.info(`Effect: ${params.effect}`);

    const expId = this.causalGraph.createExperiment({
      name: params.name,
      hypothesis: `Does ${params.cause} causally affect ${params.effect}?`,
      treatmentId: 0,
      treatmentType: params.cause,
      controlId: undefined,
      startTime: Math.floor(Date.now() / 1000),
      sampleSize: 0,
      status: 'running',
      metadata: { effect: params.effect }
    });

    log.success(`Created experiment #${expId}`);
    log.info('Use `agentdb causal experiment add-observation` to record data');
  }

  async causalExperimentAddObservation(params: {
    experimentId: number;
    isTreatment: boolean;
    outcome: number;
    context?: string;
  }): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    // Create a dummy episode to get an episode ID
    const insertResult = this.db!.prepare('INSERT INTO episodes (session_id, task, reward, success, created_at) VALUES (?, ?, ?, ?, ?)').run('cli-session', 'experiment', params.outcome, 1, Math.floor(Date.now() / 1000));
    if (!insertResult || !insertResult.lastInsertRowid) {
      throw new Error('Failed to create episode');
    }
    const episodeId = Number(insertResult.lastInsertRowid);

    this.causalGraph.recordObservation({
      experimentId: params.experimentId,
      episodeId: episodeId,
      isTreatment: params.isTreatment,
      outcomeValue: params.outcome,
      outcomeType: 'reward',
      context: params.context ? JSON.parse(params.context) : undefined
    });

    log.success(`Recorded ${params.isTreatment ? 'treatment' : 'control'} observation: ${params.outcome}`);
  }

  async causalExperimentCalculate(experimentId: number): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    log.header('\n📈 Calculating Uplift');

    const result = this.causalGraph.calculateUplift(experimentId);

    // Fetch experiment details (now includes calculated means)
    const experiment = this.db!.prepare('SELECT * FROM causal_experiments WHERE id = ?').get(experimentId) as any;
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    log.info(`Experiment: ${experiment.hypothesis || 'Unknown'}`);
    log.info(`Treatment Mean: ${experiment.treatment_mean?.toFixed(3) || 'N/A'}`);
    log.info(`Control Mean: ${experiment.control_mean?.toFixed(3) || 'N/A'}`);
    log.success(`Uplift: ${result?.uplift?.toFixed(3) || 'N/A'}`);
    if (result?.confidenceInterval && result.confidenceInterval.length === 2) {
      log.info(`95% CI: [${result.confidenceInterval[0]?.toFixed(3) || 'N/A'}, ${result.confidenceInterval[1]?.toFixed(3) || 'N/A'}]`);
    }
    if (result?.pValue !== undefined) {
      log.info(`p-value: ${result.pValue.toFixed(4)}`);
    }

    // Get sample sizes from observations
    const counts = this.db!.prepare('SELECT COUNT(*) as total, SUM(is_treatment) as treatment FROM causal_observations WHERE experiment_id = ?').get(experimentId) as any;
    if (!counts) {
      throw new Error(`Failed to get observation counts for experiment ${experimentId}`);
    }
    log.info(`Sample Sizes: ${counts.treatment || 0} treatment, ${(counts.total || 0) - (counts.treatment || 0)} control`);

    if (result && result.pValue !== undefined && result.pValue < 0.05) {
      log.success('Result is statistically significant (p < 0.05)');
    } else {
      log.warning('Result is not statistically significant');
    }
  }

  async causalQuery(params: {
    cause?: string;
    effect?: string;
    minConfidence?: number;
    minUplift?: number;
    limit?: number;
  }): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    log.header('\n🔍 Querying Causal Edges');

    const edges = this.causalGraph.queryCausalEffects({
      interventionMemoryId: 0,
      interventionMemoryType: params.cause || '',
      outcomeMemoryId: params.effect ? 0 : undefined,
      minConfidence: params.minConfidence || 0.7,
      minUplift: params.minUplift || 0.1
    });

    if (edges.length === 0) {
      log.warning('No causal edges found');
      return;
    }

    console.log('\n' + '═'.repeat(80));
    edges.slice(0, params.limit || 10).forEach((edge, i) => {
      console.log(`${colors.bright}#${i + 1}: ${edge.fromMemoryType} → ${edge.toMemoryType}${colors.reset}`);
      console.log(`  Uplift: ${colors.green}${(edge.uplift || 0).toFixed(3)}${colors.reset}`);
      console.log(`  Confidence: ${edge.confidence.toFixed(2)} (n=${edge.sampleSize})`);
      console.log('─'.repeat(80));
    });

    log.success(`Found ${edges.length} causal edges`);
  }

  // ============================================================================
  // Recall Commands
  // ============================================================================

  async recallWithCertificate(params: {
    query: string;
    k?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  }): Promise<void> {
    if (!this.causalRecall) throw new Error('Not initialized');

    log.header('\n🔍 Causal Recall with Certificate');
    log.info(`Query: "${params.query}"`);
    log.info(`k: ${params.k || 12}`);

    const startTime = Date.now();

    const result = await this.causalRecall.recall(
      'cli-' + Date.now(),
      params.query,
      params.k || 12,
      undefined,
      'internal'
    );

    const duration = Date.now() - startTime;

    console.log('\n' + '═'.repeat(80));
    console.log(`${colors.bright}Results (${result.candidates.length})${colors.reset}`);
    console.log('═'.repeat(80));

    result.candidates.slice(0, 5).forEach((r, i) => {
      console.log(`\n${colors.bright}#${i + 1}: ${r.type} ${r.id}${colors.reset}`);
      console.log(`  Content: ${r.content.substring(0, 50)}...`);
      console.log(`  Similarity: ${colors.cyan}${r.similarity.toFixed(3)}${colors.reset}`);
      console.log(`  Uplift: ${colors.green}${r.uplift?.toFixed(3) || 'N/A'}${colors.reset}`);
      console.log(`  Utility: ${colors.yellow}${r.utilityScore.toFixed(3)}${colors.reset}`);
    });

    console.log('\n' + '═'.repeat(80));
    log.info(`Certificate ID: ${result.certificate.id}`);
    log.info(`Query: ${result.certificate.queryText}`);
    log.info(`Completeness: ${result.certificate.completenessScore.toFixed(2)}`);
    log.success(`Completed in ${duration}ms`);
  }

  // ============================================================================
  // Learner Commands
  // ============================================================================

  async learnerRun(params: {
    minAttempts?: number;
    minSuccessRate?: number;
    minConfidence?: number;
    dryRun?: boolean;
  }): Promise<void> {
    if (!this.nightlyLearner) throw new Error('Not initialized');

    log.header('\n🌙 Running Nightly Learner');
    log.info(`Min Attempts: ${params.minAttempts || 3}`);
    log.info(`Min Success Rate: ${params.minSuccessRate || 0.6}`);
    log.info(`Min Confidence: ${params.minConfidence || 0.7}`);

    const startTime = Date.now();

    const discovered = await this.nightlyLearner.discover({
      minAttempts: params.minAttempts || 3,
      minSuccessRate: params.minSuccessRate || 0.6,
      minConfidence: params.minConfidence || 0.7,
      dryRun: params.dryRun || false
    });

    const duration = Date.now() - startTime;

    log.success(`Discovered ${discovered.length} causal edges in ${(duration / 1000).toFixed(1)}s`);

    if (discovered.length > 0) {
      console.log('\n' + '═'.repeat(80));
      discovered.slice(0, 10).forEach((edge: any, i: number) => {
        console.log(`${colors.bright}#${i + 1}: ${edge.cause} → ${edge.effect}${colors.reset}`);
        console.log(`  Uplift: ${colors.green}${edge.uplift.toFixed(3)}${colors.reset} (CI: ${edge.confidence.toFixed(2)})`);
        console.log(`  Sample size: ${edge.sampleSize}`);
        console.log('─'.repeat(80));
      });
    }
  }

  async learnerPrune(params: {
    minConfidence?: number;
    minUplift?: number;
    maxAgeDays?: number;
  }): Promise<void> {
    if (!this.nightlyLearner) throw new Error('Not initialized');

    log.header('\n🧹 Pruning Low-Quality Edges');

    // Update config and run pruning
    this.nightlyLearner.updateConfig({
      confidenceThreshold: params.minConfidence || 0.6,
      upliftThreshold: params.minUplift || 0.05,
      edgeMaxAgeDays: params.maxAgeDays || 90
    });

    const report = await this.nightlyLearner.run();

    log.success(`Pruned ${report.edgesPruned} edges`);
  }

  // ============================================================================
  // Reflexion Commands
  // ============================================================================

  async reflexionStoreEpisode(params: {
    sessionId: string;
    task: string;
    input?: string;
    output?: string;
    critique?: string;
    reward: number;
    success: boolean;
    latencyMs?: number;
    tokensUsed?: number;
  }): Promise<void> {
    if (!this.reflexion) throw new Error('Not initialized');

    log.header('\n💭 Storing Episode');
    log.info(`Task: ${params.task}`);
    log.info(`Success: ${params.success ? 'Yes' : 'No'}`);
    log.info(`Reward: ${params.reward.toFixed(2)}`);

    const episodeId = await this.reflexion.storeEpisode(params as Episode);

    log.success(`Stored episode #${episodeId}`);
    if (params.critique) {
      log.info(`Critique: "${params.critique}"`);
    }
  }

  async reflexionRetrieve(params: {
    task: string;
    k?: number;
    onlyFailures?: boolean;
    onlySuccesses?: boolean;
    minReward?: number;
  }): Promise<void> {
    if (!this.reflexion) throw new Error('Not initialized');

    log.header('\n🔍 Retrieving Past Episodes');
    log.info(`Task: "${params.task}"`);
    log.info(`k: ${params.k || 5}`);
    if (params.onlyFailures) log.info('Filter: Failures only');
    if (params.onlySuccesses) log.info('Filter: Successes only');

    const episodes = await this.reflexion.retrieveRelevant({
      task: params.task,
      k: params.k || 5,
      onlyFailures: params.onlyFailures,
      onlySuccesses: params.onlySuccesses,
      minReward: params.minReward
    });

    if (episodes.length === 0) {
      log.warning('No episodes found');
      return;
    }

    console.log('\n' + '═'.repeat(80));
    episodes.forEach((ep, i) => {
      console.log(`${colors.bright}#${i + 1}: Episode ${ep.id}${colors.reset}`);
      console.log(`  Task: ${ep.task}`);
      console.log(`  Reward: ${colors.green}${ep.reward.toFixed(2)}${colors.reset}`);
      console.log(`  Success: ${ep.success ? colors.green + 'Yes' : colors.red + 'No'}${colors.reset}`);
      console.log(`  Similarity: ${colors.cyan}${ep.similarity?.toFixed(3) || 'N/A'}${colors.reset}`);
      if (ep.critique) {
        console.log(`  Critique: "${ep.critique}"`);
      }
      console.log('─'.repeat(80));
    });

    log.success(`Retrieved ${episodes.length} relevant episodes`);
  }

  async reflexionGetCritiqueSummary(params: {
    task: string;
    k?: number;
  }): Promise<void> {
    if (!this.reflexion) throw new Error('Not initialized');

    log.header('\n📋 Critique Summary');
    log.info(`Task: "${params.task}"`);

    const summary = await this.reflexion.getCritiqueSummary({
      task: params.task,
      k: params.k
    });

    console.log('\n' + '═'.repeat(80));
    console.log(colors.bright + 'Past Lessons:' + colors.reset);
    console.log(summary);
    console.log('═'.repeat(80));
  }

  async reflexionPrune(params: {
    minReward?: number;
    maxAgeDays?: number;
    keepMinPerTask?: number;
  }): Promise<void> {
    if (!this.reflexion) throw new Error('Not initialized');

    log.header('\n🧹 Pruning Episodes');

    const pruned = this.reflexion.pruneEpisodes({
      minReward: params.minReward || 0.3,
      maxAgeDays: params.maxAgeDays || 30,
      keepMinPerTask: params.keepMinPerTask || 5
    });

    log.success(`Pruned ${pruned} low-quality episodes`);
  }

  // ============================================================================
  // Skill Library Commands
  // ============================================================================

  async skillCreate(params: {
    name: string;
    description: string;
    code?: string;
    successRate?: number;
    episodeId?: number;
  }): Promise<void> {
    if (!this.skills) throw new Error('Not initialized');

    log.header('\n🎯 Creating Skill');
    log.info(`Name: ${params.name}`);
    log.info(`Description: ${params.description}`);

    const skillId = await this.skills.createSkill({
      name: params.name,
      description: params.description,
      signature: { inputs: {}, outputs: {} },
      code: params.code,
      successRate: params.successRate || 0.0,
      uses: 0,
      avgReward: 0.0,
      avgLatencyMs: 0.0,
      createdFromEpisode: params.episodeId
    });

    log.success(`Created skill #${skillId}`);
  }

  async skillSearch(params: {
    task: string;
    k?: number;
    minSuccessRate?: number;
  }): Promise<void> {
    if (!this.skills) throw new Error('Not initialized');

    log.header('\n🔍 Searching Skills');
    log.info(`Task: "${params.task}"`);
    log.info(`Min Success Rate: ${params.minSuccessRate || 0.0}`);

    const skills = await this.skills.searchSkills({
      task: params.task,
      k: params.k || 10,
      minSuccessRate: params.minSuccessRate || 0.0
    });

    if (skills.length === 0) {
      log.warning('No skills found');
      return;
    }

    console.log('\n' + '═'.repeat(80));
    skills.forEach((skill: any, i: number) => {
      console.log(`${colors.bright}#${i + 1}: ${skill.name}${colors.reset}`);
      console.log(`  Description: ${skill.description}`);
      console.log(`  Success Rate: ${colors.green}${(skill.successRate * 100).toFixed(1)}%${colors.reset}`);
      console.log(`  Uses: ${skill.uses}`);
      console.log(`  Avg Reward: ${skill.avgReward.toFixed(2)}`);
      console.log(`  Avg Latency: ${skill.avgLatencyMs.toFixed(0)}ms`);
      console.log('─'.repeat(80));
    });

    log.success(`Found ${skills.length} matching skills`);
  }

  async skillConsolidate(params: {
    minAttempts?: number;
    minReward?: number;
    timeWindowDays?: number;
    extractPatterns?: boolean;
  }): Promise<void> {
    if (!this.skills) throw new Error('Not initialized');

    log.header('\n🔄 Consolidating Episodes into Skills with Pattern Extraction');
    log.info(`Min Attempts: ${params.minAttempts || 3}`);
    log.info(`Min Reward: ${params.minReward || 0.7}`);
    log.info(`Time Window: ${params.timeWindowDays || 7} days`);
    log.info(`Pattern Extraction: ${params.extractPatterns !== false ? 'Enabled' : 'Disabled'}`);

    const startTime = Date.now();

    const result = await this.skills.consolidateEpisodesIntoSkills({
      minAttempts: params.minAttempts || 3,
      minReward: params.minReward || 0.7,
      timeWindowDays: params.timeWindowDays || 7,
      extractPatterns: params.extractPatterns !== false
    });

    const duration = Date.now() - startTime;

    log.success(`Created ${result.created} new skills, updated ${result.updated} existing skills in ${duration}ms`);

    // Display extracted patterns if available
    if (result.patterns.length > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log(`${colors.bright}${colors.cyan}Extracted Patterns:${colors.reset}`);
      console.log('═'.repeat(80));

      result.patterns.forEach((pattern, i) => {
        console.log(`\n${colors.bright}#${i + 1}: ${pattern.task}${colors.reset}`);
        console.log(`  Avg Reward: ${colors.green}${pattern.avgReward.toFixed(2)}${colors.reset}`);

        if (pattern.commonPatterns.length > 0) {
          console.log(`  ${colors.cyan}Common Patterns:${colors.reset}`);
          pattern.commonPatterns.forEach(p => console.log(`    • ${p}`));
        }

        if (pattern.successIndicators.length > 0) {
          console.log(`  ${colors.yellow}Success Indicators:${colors.reset}`);
          pattern.successIndicators.forEach(s => console.log(`    • ${s}`));
        }

        console.log('─'.repeat(80));
      });
    }

    if (result.created === 0 && result.updated === 0) {
      log.warning('No episodes met the criteria for skill consolidation');
      log.info('Try lowering minReward or increasing timeWindowDays');
    }
  }

  async skillPrune(params: {
    minUses?: number;
    minSuccessRate?: number;
    maxAgeDays?: number;
  }): Promise<void> {
    if (!this.skills) throw new Error('Not initialized');

    log.header('\n🧹 Pruning Skills');

    const pruned = this.skills.pruneSkills({
      minUses: params.minUses || 3,
      minSuccessRate: params.minSuccessRate || 0.4,
      maxAgeDays: params.maxAgeDays || 60
    });

    log.success(`Pruned ${pruned} underperforming skills`);
  }

  // ============================================================================
  // Database Commands
  // ============================================================================

  async dbStats(): Promise<void> {
    if (!this.db) throw new Error('Not initialized');

    log.header('\n📊 Database Statistics');

    const tables = ['causal_edges', 'causal_experiments', 'causal_observations',
                    'certificates', 'provenance_lineage', 'episodes'];

    console.log('\n' + '═'.repeat(80));
    tables.forEach(table => {
      try {
        const count = this.db!.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        console.log(`${colors.bright}${table}:${colors.reset} ${colors.cyan}${count.count}${colors.reset} records`);
      } catch (e) {
        console.log(`${colors.bright}${table}:${colors.reset} ${colors.yellow}N/A${colors.reset}`);
      }
    });
    console.log('═'.repeat(80));
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  // Handle MCP server command separately (doesn't need CLI initialization)
  if (command === 'mcp') {
    await handleMcpCommand(args.slice(1));
    return;
  }

  const cli = new AgentDBCLI();
  const dbPath = process.env.AGENTDB_PATH || './agentdb.db';

  try {
    await cli.initialize(dbPath);

    const subcommand = args[1];

    if (command === 'causal') {
      await handleCausalCommands(cli, subcommand, args.slice(2));
    } else if (command === 'recall') {
      await handleRecallCommands(cli, subcommand, args.slice(2));
    } else if (command === 'learner') {
      await handleLearnerCommands(cli, subcommand, args.slice(2));
    } else if (command === 'reflexion') {
      await handleReflexionCommands(cli, subcommand, args.slice(2));
    } else if (command === 'skill') {
      await handleSkillCommands(cli, subcommand, args.slice(2));
    } else if (command === 'db') {
      await handleDbCommands(cli, subcommand, args.slice(2));
    } else {
      log.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
    }
  } catch (error) {
    log.error((error as Error).message);
    process.exit(1);
  }
}

// Command handlers
async function handleMcpCommand(args: string[]) {
  const subcommand = args[0];

  if (subcommand === 'start' || !subcommand) {
    log.info('Starting AgentDB MCP Server...');

    // Dynamically import and run the MCP server
    const mcpServerPath = path.join(__dirname, '../mcp/agentdb-mcp-server.js');

    if (!fs.existsSync(mcpServerPath)) {
      log.error('MCP server not found. Please rebuild the package: npm run build');
      process.exit(1);
    }

    // Import and execute the MCP server module
    try {
      await import(mcpServerPath);
      // The MCP server will run indefinitely, so we don't exit here
    } catch (error) {
      log.error(`Failed to start MCP server: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    log.error(`Unknown mcp subcommand: ${subcommand}`);
    log.info('Usage: agentdb mcp start');
    process.exit(1);
  }
}

async function handleCausalCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'add-edge') {
    await cli.causalAddEdge({
      cause: args[0],
      effect: args[1],
      uplift: parseFloat(args[2]),
      confidence: args[3] ? parseFloat(args[3]) : undefined,
      sampleSize: args[4] ? parseInt(args[4]) : undefined
    });
  } else if (subcommand === 'experiment' && args[0] === 'create') {
    await cli.causalExperimentCreate({
      name: args[1],
      cause: args[2],
      effect: args[3]
    });
  } else if (subcommand === 'experiment' && args[0] === 'add-observation') {
    await cli.causalExperimentAddObservation({
      experimentId: parseInt(args[1]),
      isTreatment: args[2] === 'true',
      outcome: parseFloat(args[3]),
      context: args[4]
    });
  } else if (subcommand === 'experiment' && args[0] === 'calculate') {
    await cli.causalExperimentCalculate(parseInt(args[1]));
  } else if (subcommand === 'query') {
    await cli.causalQuery({
      cause: args[0],
      effect: args[1],
      minConfidence: args[2] ? parseFloat(args[2]) : undefined,
      minUplift: args[3] ? parseFloat(args[3]) : undefined,
      limit: args[4] ? parseInt(args[4]) : undefined
    });
  } else {
    log.error(`Unknown causal subcommand: ${subcommand}`);
    printHelp();
  }
}

async function handleRecallCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'with-certificate') {
    await cli.recallWithCertificate({
      query: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
      alpha: args[2] ? parseFloat(args[2]) : undefined,
      beta: args[3] ? parseFloat(args[3]) : undefined,
      gamma: args[4] ? parseFloat(args[4]) : undefined
    });
  } else {
    log.error(`Unknown recall subcommand: ${subcommand}`);
    printHelp();
  }
}

async function handleLearnerCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'run') {
    await cli.learnerRun({
      minAttempts: args[0] ? parseInt(args[0]) : undefined,
      minSuccessRate: args[1] ? parseFloat(args[1]) : undefined,
      minConfidence: args[2] ? parseFloat(args[2]) : undefined,
      dryRun: args[3] === 'true'
    });
  } else if (subcommand === 'prune') {
    await cli.learnerPrune({
      minConfidence: args[0] ? parseFloat(args[0]) : undefined,
      minUplift: args[1] ? parseFloat(args[1]) : undefined,
      maxAgeDays: args[2] ? parseInt(args[2]) : undefined
    });
  } else {
    log.error(`Unknown learner subcommand: ${subcommand}`);
    printHelp();
  }
}

async function handleReflexionCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'store') {
    await cli.reflexionStoreEpisode({
      sessionId: args[0],
      task: args[1],
      reward: parseFloat(args[2]),
      success: args[3] === 'true',
      critique: args[4],
      input: args[5],
      output: args[6],
      latencyMs: args[7] ? parseInt(args[7]) : undefined,
      tokensUsed: args[8] ? parseInt(args[8]) : undefined
    });
  } else if (subcommand === 'retrieve') {
    await cli.reflexionRetrieve({
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
      minReward: args[2] ? parseFloat(args[2]) : undefined,
      onlyFailures: args[3] === 'true' ? true : undefined,
      onlySuccesses: args[4] === 'true' ? true : undefined
    });
  } else if (subcommand === 'critique-summary') {
    await cli.reflexionGetCritiqueSummary({
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined
    });
  } else if (subcommand === 'prune') {
    await cli.reflexionPrune({
      maxAgeDays: args[0] ? parseInt(args[0]) : undefined,
      minReward: args[1] ? parseFloat(args[1]) : undefined
    });
  } else {
    log.error(`Unknown reflexion subcommand: ${subcommand}`);
    printHelp();
  }
}

async function handleSkillCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'create') {
    await cli.skillCreate({
      name: args[0],
      description: args[1],
      code: args[2]
    });
  } else if (subcommand === 'search') {
    await cli.skillSearch({
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined
    });
  } else if (subcommand === 'consolidate') {
    await cli.skillConsolidate({
      minAttempts: args[0] ? parseInt(args[0]) : undefined,
      minReward: args[1] ? parseFloat(args[1]) : undefined,
      timeWindowDays: args[2] ? parseInt(args[2]) : undefined,
      extractPatterns: args[3] !== 'false' // Default true, set to false if explicitly passed
    });
  } else if (subcommand === 'prune') {
    await cli.skillPrune({
      minUses: args[0] ? parseInt(args[0]) : undefined,
      minSuccessRate: args[1] ? parseFloat(args[1]) : undefined,
      maxAgeDays: args[2] ? parseInt(args[2]) : undefined
    });
  } else {
    log.error(`Unknown skill subcommand: ${subcommand}`);
    printHelp();
  }
}

async function handleDbCommands(cli: AgentDBCLI, subcommand: string, args: string[]) {
  if (subcommand === 'stats') {
    await cli.dbStats();
  } else {
    log.error(`Unknown db subcommand: ${subcommand}`);
    printHelp();
  }
}

function printHelp() {
  console.log(`
${colors.bright}${colors.cyan}█▀█ █▀▀ █▀▀ █▄░█ ▀█▀ █▀▄ █▄▄
█▀█ █▄█ ██▄ █░▀█ ░█░ █▄▀ █▄█${colors.reset}

${colors.bright}${colors.cyan}AgentDB CLI - Frontier Memory Features${colors.reset}

${colors.bright}USAGE:${colors.reset}
  agentdb <command> <subcommand> [options]

${colors.bright}MCP COMMANDS:${colors.reset}
  agentdb mcp start
    Start the MCP server for Claude Desktop integration

${colors.bright}CAUSAL COMMANDS:${colors.reset}
  agentdb causal add-edge <cause> <effect> <uplift> [confidence] [sample-size]
    Add a causal edge manually

  agentdb causal experiment create <name> <cause> <effect>
    Create a new A/B experiment

  agentdb causal experiment add-observation <experiment-id> <is-treatment> <outcome> [context]
    Record an observation (is-treatment: true/false)

  agentdb causal experiment calculate <experiment-id>
    Calculate uplift and statistical significance

  agentdb causal query [cause] [effect] [min-confidence] [min-uplift] [limit]
    Query causal edges with filters

${colors.bright}RECALL COMMANDS:${colors.reset}
  agentdb recall with-certificate <query> [k] [alpha] [beta] [gamma]
    Retrieve episodes with causal utility and provenance certificate
    Defaults: k=12, alpha=0.7, beta=0.2, gamma=0.1

${colors.bright}LEARNER COMMANDS:${colors.reset}
  agentdb learner run [min-attempts] [min-success-rate] [min-confidence] [dry-run]
    Discover causal edges from episode patterns
    Defaults: min-attempts=3, min-success-rate=0.6, min-confidence=0.7

  agentdb learner prune [min-confidence] [min-uplift] [max-age-days]
    Remove low-quality or old causal edges
    Defaults: min-confidence=0.5, min-uplift=0.05, max-age-days=90

${colors.bright}REFLEXION COMMANDS:${colors.reset}
  agentdb reflexion store <session-id> <task> <reward> <success> [critique] [input] [output] [latency-ms] [tokens]
    Store episode with self-critique

  agentdb reflexion retrieve <task> [k] [min-reward] [only-failures] [only-successes]
    Retrieve relevant past episodes

  agentdb reflexion critique-summary <task> [only-failures]
    Get aggregated critique lessons

  agentdb reflexion prune [max-age-days] [max-reward]
    Clean up old or low-value episodes

${colors.bright}SKILL COMMANDS:${colors.reset}
  agentdb skill create <name> <description> [code]
    Create a reusable skill

  agentdb skill search <query> [k]
    Find applicable skills by similarity

  agentdb skill consolidate [min-attempts] [min-reward] [time-window-days] [extract-patterns]
    Auto-create skills from successful episodes with ML pattern extraction
    Defaults: min-attempts=3, min-reward=0.7, time-window-days=7, extract-patterns=true
    Analyzes: keyword frequency, critique patterns, reward distribution, metadata, learning curves

  agentdb skill prune [min-uses] [min-success-rate] [max-age-days]
    Remove underperforming skills (defaults: 3, 0.4, 60)

${colors.bright}DATABASE COMMANDS:${colors.reset}
  agentdb db stats
    Show database statistics

${colors.bright}ENVIRONMENT:${colors.reset}
  AGENTDB_PATH    Database file path (default: ./agentdb.db)

${colors.bright}EXAMPLES:${colors.reset}
  # Reflexion: Store and retrieve episodes
  agentdb reflexion store "session-1" "implement_auth" 0.95 true "Used OAuth2"
  agentdb reflexion retrieve "authentication" 10 0.8
  agentdb reflexion critique-summary "bug_fix" true

  # Skills: Create and search
  agentdb skill create "jwt_auth" "Generate JWT tokens" "code here..."
  agentdb skill search "authentication" 5
  agentdb skill consolidate 3 0.7 7 true  # With pattern extraction
  agentdb skill consolidate 5 0.8 14      # Higher thresholds, longer window

  # Causal: Add edges and run experiments
  agentdb causal add-edge "add_tests" "code_quality" 0.25 0.95 100
  agentdb causal experiment create "test-coverage-quality" "test_coverage" "bug_rate"
  agentdb causal experiment add-observation 1 true 0.15
  agentdb causal experiment calculate 1

  # Retrieve with causal utility
  agentdb recall with-certificate "implement authentication" 10

  # Discover patterns automatically
  agentdb learner run 3 0.6 0.7

  # Get database stats
  agentdb db stats
`);
}

// ESM entry point check - run if this is the main module
// Handle both direct execution and npx/symlink scenarios
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     import.meta.url.endsWith('/agentdb-cli.js');

if (isMainModule && process.argv.length > 2) {
  main()
    .then(() => {
      // Force immediate exit to avoid onnxruntime cleanup crash
      process.exit(0);
    })
    .catch((error) => {
      console.error('AgentDB CLI Error:', error);
      process.exit(1);
    });
}

export { AgentDBCLI };
