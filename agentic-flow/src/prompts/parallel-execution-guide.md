# Concurrent Execution Guide for AI Agents

## Core Principles

### 1. CLI Subprocess Spawning (Native Pattern)

When you need parallel execution, spawn subagents via CLI:

```bash
# Spawn 5 parallel research agents
npx agentic-flow --agent researcher --task "Analyze security patterns"
npx agentic-flow --agent researcher --task "Analyze performance patterns"
npx agentic-flow --agent researcher --task "Analyze scalability patterns"
npx agentic-flow --agent coder --task "Implement core features"
npx agentic-flow --agent tester --task "Create comprehensive tests"
```

**In JavaScript/TypeScript:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Spawn 5 parallel subagents
const results = await Promise.all([
  execAsync('npx agentic-flow --agent researcher --task "domain1"'),
  execAsync('npx agentic-flow --agent researcher --task "domain2"'),
  execAsync('npx agentic-flow --agent researcher --task "domain3"'),
  execAsync('npx agentic-flow --agent coder --task "implement"'),
  execAsync('npx agentic-flow --agent tester --task "test"')
]);
```

### 2. ReasoningBank Coordination

Each subagent stores results in ReasoningBank for cross-process coordination:

```typescript
// Subagent stores its findings
await reasoningBank.storePattern({
  sessionId: 'swarm-task-123',
  task: 'Analyze security patterns',
  output: findings,
  reward: 0.95,
  success: true
});

// Parent agent retrieves all results
const allFindings = await reasoningBank.searchPatterns('swarm-task-123', { k: 10 });

// Synthesize final report
const report = synthesizeResults(allFindings);
```

**Memory namespace pattern:**
- `swarm/{TASK_ID}/{AGENT_ID}` - Individual agent results
- `swarm/{TASK_ID}/synthesis` - Combined report
- `swarm/{TASK_ID}/metadata` - Execution metrics

### 3. Think in Parallel First

Before executing tasks, ask:
- Which tasks have NO dependencies?
- Which operations can run concurrently?
- Can I spawn subagents via CLI?
- Should I use Promise.all?

### 4. Decision Tree

```
Task received
├─ Can be split into subtasks?
│  ├─ YES: Identify dependencies
│  │  ├─ No dependencies → Spawn ALL agents in parallel
│  │  │  └─ Use: Promise.all([exec(...), exec(...), ...])
│  │  └─ Has dependencies → Pipeline with parallel stages
│  │     └─ Use: Sequential Promise.all blocks
│  └─ NO: Single agent execution
│     └─ Use: npx agentic-flow --agent TYPE --task TASK
```

## Complete Examples

### Example 1: Parallel Code Review (1000 files)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function parallelCodeReview(files: string[]) {
  const BATCH_SIZE = 200;
  const batches = chunkArray(files, BATCH_SIZE);
  const taskId = 'code-review-' + Date.now();

  // Spawn 5 parallel reviewers
  console.log(`Spawning ${batches.length} parallel reviewers...`);

  const reviewPromises = batches.map((batch, i) =>
    execAsync(
      `npx agentic-flow --agent code-reviewer ` +
      `--task "Review batch ${i}: ${batch.join(',')}" ` +
      `--output reasoningbank:swarm/${taskId}/batch-${i}`
    )
  );

  await Promise.all(reviewPromises);

  // Retrieve all results
  const allReviews = await Promise.all(
    batches.map((_, i) =>
      reasoningBank.retrieve(`swarm/${taskId}/batch-${i}`)
    )
  );

  // Synthesize final report
  return {
    totalFiles: files.length,
    batchesReviewed: batches.length,
    criticalIssues: allReviews.flatMap(r => r.critical || []),
    warnings: allReviews.flatMap(r => r.warnings || []),
    suggestions: allReviews.flatMap(r => r.suggestions || []),
    executionTimeMs: Date.now() - startTime,
    speedup: (files.length * 100) / executionTimeMs
  };
}

// Helper function
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Example 2: Multi-Domain Research with Synthesis

```typescript
async function multiDomainResearch(domains: string[]) {
  const taskId = 'research-' + Date.now();

  // Phase 1: Parallel research across all domains
  const researchPromises = domains.map(domain =>
    execAsync(
      `npx agentic-flow --agent researcher ` +
      `--task "Research ${domain}" ` +
      `--output reasoningbank:swarm/${taskId}/research/${domain}`
    )
  );

  await Promise.all(researchPromises);

  // Phase 2: Retrieve all research results
  const allResearch = await Promise.all(
    domains.map(domain =>
      reasoningBank.retrieve(`swarm/${taskId}/research/${domain}`)
    )
  );

  // Phase 3: Parallel analysis of research findings
  const analysisPromises = domains.map(domain =>
    execAsync(
      `npx agentic-flow --agent analyst ` +
      `--task "Analyze findings for ${domain}" ` +
      `--output reasoningbank:swarm/${taskId}/analysis/${domain}`
    )
  );

  await Promise.all(analysisPromises);

  // Phase 4: Synthesize final report
  const synthesizerResult = await execAsync(
    `npx agentic-flow --agent researcher ` +
    `--task "Synthesize all research and analysis for domains: ${domains.join(', ')}" ` +
    `--output reasoningbank:swarm/${taskId}/synthesis`
  );

  return reasoningBank.retrieve(`swarm/${taskId}/synthesis`);
}
```

### Example 3: Hierarchical Swarm Deployment

```typescript
async function hierarchicalSwarmDeployment(task: string) {
  const taskId = 'swarm-' + Date.now();

  // Level 1: Coordinator analyzes and decomposes task
  const coordinatorResult = await execAsync(
    `npx agentic-flow --agent task-orchestrator ` +
    `--task "Decompose into subtasks: ${task}" ` +
    `--output reasoningbank:swarm/${taskId}/coordinator`
  );

  const subtasks = await reasoningBank.retrieve(`swarm/${taskId}/coordinator`);

  // Level 2: Spawn specialized workers for each subtask
  const workerPromises = subtasks.tasks.map((subtask, i) =>
    execAsync(
      `npx agentic-flow --agent ${subtask.agentType} ` +
      `--task "${subtask.description}" ` +
      `--output reasoningbank:swarm/${taskId}/workers/worker-${i}`
    )
  );

  await Promise.all(workerPromises);

  // Level 3: Reviewers validate all worker outputs in parallel
  const reviewPromises = subtasks.tasks.map((_, i) =>
    execAsync(
      `npx agentic-flow --agent reviewer ` +
      `--task "Review worker-${i} output" ` +
      `--output reasoningbank:swarm/${taskId}/reviews/worker-${i}`
    )
  );

  await Promise.all(reviewPromises);

  // Level 4: Coordinator synthesizes final result
  const finalResult = await execAsync(
    `npx agentic-flow --agent task-orchestrator ` +
    `--task "Synthesize all worker outputs and reviews" ` +
    `--output reasoningbank:swarm/${taskId}/final`
  );

  return reasoningBank.retrieve(`swarm/${taskId}/final`);
}
```

## Performance Patterns

### 1. QUIC Transport for Large-Scale Operations

```typescript
// Use QUIC transport for 50-70% performance improvement
const results = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    execAsync(
      `npx agentic-flow --agent worker ` +
      `--task "Process batch-${i}" ` +
      `--transport quic`
    )
  )
);
```

### 2. Dynamic Scaling

```typescript
// Monitor workload and scale dynamically
let activeAgents = 3;

if (taskQueue.length > HIGH_THRESHOLD) {
  // Scale up
  const newAgents = 5;
  await Promise.all(
    Array.from({ length: newAgents }, (_, i) =>
      execAsync(`npx agentic-flow --agent worker --task "scale-up-${i}"`)
    )
  );
  activeAgents += newAgents;
}
```

### 3. Error Handling with Promise.allSettled

```typescript
// Graceful failure handling
const results = await Promise.allSettled([
  execAsync('npx agentic-flow --agent researcher --task "task1"'),
  execAsync('npx agentic-flow --agent coder --task "task2"'),
  execAsync('npx agentic-flow --agent tester --task "task3"')
]);

const successful = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

if (failed.length > 0) {
  console.log(`Partial completion: ${successful.length}/${results.length} succeeded`);
  // Retry failed tasks or proceed with partial results
}
```

## Best Practices

1. **Batch Size:** 5-10 concurrent agents for optimal performance
2. **Memory Namespaces:** Use hierarchical structure `swarm/{TASK_ID}/{CATEGORY}/{AGENT_ID}`
3. **QUIC Transport:** Use for 10+ concurrent agents (50-70% faster)
4. **Result Synthesis:** Always combine subprocess outputs into unified report
5. **Pattern Storage:** Store successful executions in ReasoningBank for learning
6. **Error Recovery:** Use `Promise.allSettled` for graceful failure handling
7. **Progress Tracking:** Log completion status for monitoring

## Common Pitfalls to Avoid

❌ **Sequential subprocess spawning:**
```typescript
// WRONG: Sequential execution
const result1 = await exec('npx agentic-flow --agent agent1 --task "task1"');
const result2 = await exec('npx agentic-flow --agent agent2 --task "task2"');
const result3 = await exec('npx agentic-flow --agent agent3 --task "task3"');
```

✅ **Correct: Parallel execution:**
```typescript
// CORRECT: Parallel execution
const results = await Promise.all([
  exec('npx agentic-flow --agent agent1 --task "task1"'),
  exec('npx agentic-flow --agent agent2 --task "task2"'),
  exec('npx agentic-flow --agent agent3 --task "task3"')
]);
```

❌ **Missing ReasoningBank coordination:**
```typescript
// WRONG: No persistent memory
const results = await Promise.all(subprocesses);
// Results lost when parent process ends
```

✅ **Correct: ReasoningBank persistence:**
```typescript
// CORRECT: Store in ReasoningBank
await Promise.all(
  subprocesses.map((_, i) =>
    exec(`npx agentic-flow --agent worker --task "task-${i}" --output reasoningbank:swarm/task-id/worker-${i}`)
  )
);
```

## Performance Expectations

| Operation | Sequential | Parallel | Speedup |
|-----------|-----------|----------|---------|
| Code review (1000 files) | 15-20 min | 3-5 min | 4-5x |
| Multi-domain research (5 domains) | 25-30 min | 6-8 min | 3-4x |
| Refactoring (50 modules) | 40-50 min | 10-12 min | 4-5x |
| Test generation (100 suites) | 30-40 min | 8-10 min | 3-4x |

**With QUIC transport:** Add 50-70% improvement on top of parallel speedup.
