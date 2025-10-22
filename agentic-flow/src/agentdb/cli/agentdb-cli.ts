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
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph';
import { CausalRecall } from '../controllers/CausalRecall';
import { ExplainableRecall } from '../controllers/ExplainableRecall';
import { NightlyLearner } from '../controllers/NightlyLearner';
import { EmbeddingService } from '../controllers/EmbeddingService';
import * as fs from 'fs';
import * as path from 'path';

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
  private embedder?: EmbeddingService;

  async initialize(dbPath: string = './agentdb.db'): Promise<void> {
    // Initialize database
    this.db = new Database(dbPath);

    // Configure for performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');

    // Load schema if needed
    const schemaPath = path.join(__dirname, '../schemas/frontier-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
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
    this.causalRecall = new CausalRecall(this.db, this.embedder, this.causalGraph, this.explainableRecall);
    this.nightlyLearner = new NightlyLearner(this.db, this.embedder, this.causalGraph);
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

    const edgeId = this.causalGraph.addEdge({
      cause: params.cause,
      effect: params.effect,
      uplift: params.uplift,
      confidence: params.confidence || 0.95,
      sampleSize: params.sampleSize || 0,
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
      cause: params.cause,
      effect: params.effect
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

    this.causalGraph.recordObservation({
      experimentId: params.experimentId,
      isTreatment: params.isTreatment,
      outcome: params.outcome,
      context: params.context || '{}'
    });

    log.success(`Recorded ${params.isTreatment ? 'treatment' : 'control'} observation: ${params.outcome}`);
  }

  async causalExperimentCalculate(experimentId: number): Promise<void> {
    if (!this.causalGraph) throw new Error('Not initialized');

    log.header('\n📈 Calculating Uplift');

    const result = this.causalGraph.calculateUplift(experimentId);

    log.info(`Treatment Mean: ${result.treatmentMean.toFixed(3)}`);
    log.info(`Control Mean: ${result.controlMean.toFixed(3)}`);
    log.success(`Uplift: ${result.uplift.toFixed(3)}`);
    log.info(`95% CI: [${result.confidenceLower.toFixed(3)}, ${result.confidenceUpper.toFixed(3)}]`);
    log.info(`p-value: ${result.pValue.toFixed(4)}`);
    log.info(`Sample Sizes: ${result.treatmentN} treatment, ${result.controlN} control`);

    if (result.pValue < 0.05) {
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

    const edges = this.causalGraph.getCausalEffects({
      cause: params.cause,
      effect: params.effect,
      minConfidence: params.minConfidence || 0.7,
      minUplift: params.minUplift || 0.1
    });

    if (edges.length === 0) {
      log.warning('No causal edges found');
      return;
    }

    console.log('\n' + '═'.repeat(80));
    edges.slice(0, params.limit || 10).forEach((edge, i) => {
      console.log(`${colors.bright}#${i + 1}: ${edge.cause} → ${edge.effect}${colors.reset}`);
      console.log(`  Uplift: ${colors.green}${edge.uplift.toFixed(3)}${colors.reset}`);
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

    const result = await this.causalRecall.recall({
      qid: 'cli-' + Date.now(),
      query: params.query,
      k: params.k || 12,
      weights: {
        alpha: params.alpha || 0.7,
        beta: params.beta || 0.2,
        gamma: params.gamma || 0.1
      }
    });

    const duration = Date.now() - startTime;

    console.log('\n' + '═'.repeat(80));
    console.log(`${colors.bright}Results (${result.results.length})${colors.reset}`);
    console.log('═'.repeat(80));

    result.results.slice(0, 5).forEach((r, i) => {
      console.log(`\n${colors.bright}#${i + 1}: Episode ${r.episode.id}${colors.reset}`);
      console.log(`  Task: ${r.episode.task}`);
      console.log(`  Similarity: ${colors.cyan}${r.similarity.toFixed(3)}${colors.reset}`);
      console.log(`  Uplift: ${colors.green}${r.uplift?.toFixed(3) || 'N/A'}${colors.reset}`);
      console.log(`  Utility: ${colors.yellow}${r.utility.toFixed(3)}${colors.reset}`);
      console.log(`  Reward: ${r.episode.reward.toFixed(2)}`);
    });

    console.log('\n' + '═'.repeat(80));
    log.info(`Certificate ID: ${result.certificate.certificateId}`);
    log.info(`Provenance Hash: ${result.certificate.provenanceHash.substring(0, 16)}...`);
    log.info(`Retrieved at: ${new Date(result.certificate.retrievedAt).toISOString()}`);
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
      discovered.slice(0, 10).forEach((edge, i) => {
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

    const pruned = await this.nightlyLearner.pruneEdges({
      minConfidence: params.minConfidence || 0.5,
      minUplift: params.minUplift || 0.05,
      maxAgeDays: params.maxAgeDays || 90
    });

    log.success(`Pruned ${pruned} edges`);
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

  const cli = new AgentDBCLI();
  const dbPath = process.env.AGENTDB_PATH || './agentdb.db';

  try {
    await cli.initialize(dbPath);

    const command = args[0];
    const subcommand = args[1];

    if (command === 'causal') {
      await handleCausalCommands(cli, subcommand, args.slice(2));
    } else if (command === 'recall') {
      await handleRecallCommands(cli, subcommand, args.slice(2));
    } else if (command === 'learner') {
      await handleLearnerCommands(cli, subcommand, args.slice(2));
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
${colors.bright}${colors.cyan}AgentDB CLI - Frontier Memory Features${colors.reset}

${colors.bright}USAGE:${colors.reset}
  agentdb <command> <subcommand> [options]

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

${colors.bright}DATABASE COMMANDS:${colors.reset}
  agentdb db stats
    Show database statistics

${colors.bright}ENVIRONMENT:${colors.reset}
  AGENTDB_PATH    Database file path (default: ./agentdb.db)

${colors.bright}EXAMPLES:${colors.reset}
  # Add a causal edge
  agentdb causal add-edge "add_tests" "code_quality" 0.25 0.95 100

  # Create and run an experiment
  agentdb causal experiment create "test-coverage-quality" "test_coverage" "bug_rate"
  agentdb causal experiment add-observation 1 true 0.15
  agentdb causal experiment add-observation 1 false 0.35
  agentdb causal experiment calculate 1

  # Retrieve with causal utility
  agentdb recall with-certificate "implement authentication" 10

  # Discover patterns automatically
  agentdb learner run 3 0.6 0.7

  # Get database stats
  agentdb db stats
`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { AgentDBCLI };
