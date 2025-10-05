#!/usr/bin/env node
/**
 * Agentic Flow Multi-Model Concurrent Benchmark Suite
 * Tests different models across various agent types and tasks
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Benchmark configuration - Latest January 2025 Models
const MODELS = {
  // Tier 1: Flagship Models (Highest Quality, Highest Cost)
  anthropic_sonnet: {
    name: 'Claude Sonnet 4.5 (2025)',
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    cost_per_1m_input: 3.00,
    cost_per_1m_output: 15.00,
    requires_api_key: true,
    tier: 'flagship',
    strengths: ['reasoning', 'coding', 'analysis'],
    release_date: '2025-01'
  },

  // Tier 2: Advanced OpenRouter Models (2025)
  openrouter_gpt4o: {
    name: 'GPT-4o (2025)',
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    cost_per_1m_input: 2.50,
    cost_per_1m_output: 10.00,
    requires_api_key: true,
    tier: 'flagship',
    strengths: ['multimodal', 'speed', 'general-purpose'],
    release_date: '2024-11'
  },

  openrouter_gemini_pro: {
    name: 'Gemini 2.5 Pro (Deep Think)',
    provider: 'openrouter',
    model: 'google/gemini-2.5-pro',
    cost_per_1m_input: 1.25,
    cost_per_1m_output: 5.00,
    requires_api_key: true,
    tier: 'flagship',
    strengths: ['reasoning', 'large-context', 'multimodal'],
    release_date: '2025-01'
  },

  // Tier 3: DeepSeek Models (Cost-Effective, High Performance)
  openrouter_deepseek_r1: {
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1',
    cost_per_1m_input: 0.55,
    cost_per_1m_output: 2.19,
    requires_api_key: true,
    tier: 'cost-effective',
    strengths: ['reasoning', 'math', 'coding'],
    release_date: '2025-01',
    notes: '27x cheaper than OpenAI o1, comparable performance'
  },

  openrouter_deepseek_v3: {
    name: 'DeepSeek Chat V3',
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat',
    cost_per_1m_input: 0.14,
    cost_per_1m_output: 0.28,
    requires_api_key: true,
    tier: 'cost-effective',
    strengths: ['coding', 'cost', 'speed'],
    release_date: '2024-12'
  },

  // Tier 4: Mid-Range Performance Models
  openrouter_gemini_flash: {
    name: 'Gemini 2.5 Flash',
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash',
    cost_per_1m_input: 0.075,
    cost_per_1m_output: 0.30,
    requires_api_key: true,
    tier: 'balanced',
    strengths: ['speed', 'cost', 'general-purpose'],
    release_date: '2025-01'
  },

  openrouter_llama_3_3: {
    name: 'Llama 3.3 70B Instruct',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    cost_per_1m_input: 0.35,
    cost_per_1m_output: 0.40,
    requires_api_key: true,
    tier: 'balanced',
    strengths: ['open-source', 'versatile', 'coding'],
    release_date: '2024-12'
  },

  openrouter_qwen_2_5: {
    name: 'Qwen 2.5 72B Instruct',
    provider: 'openrouter',
    model: 'qwen/qwen-2.5-72b-instruct',
    cost_per_1m_input: 0.35,
    cost_per_1m_output: 0.40,
    requires_api_key: true,
    tier: 'balanced',
    strengths: ['multilingual', 'coding', 'reasoning'],
    release_date: '2024-11'
  },

  // Tier 5: Budget Models
  openrouter_llama_3_1: {
    name: 'Llama 3.1 8B Instruct',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.1-8b-instruct',
    cost_per_1m_input: 0.06,
    cost_per_1m_output: 0.06,
    requires_api_key: true,
    tier: 'budget',
    strengths: ['ultra-low-cost', 'simple-tasks'],
    release_date: '2024-07'
  },

  // Tier 6: Local/Free Models
  onnx_local: {
    name: 'ONNX Phi-4 Mini (Local)',
    provider: 'onnx',
    model: 'phi-4-mini',
    cost_per_1m_input: 0.00,
    cost_per_1m_output: 0.00,
    requires_api_key: false,
    tier: 'local',
    strengths: ['privacy', 'offline', 'zero-cost'],
    release_date: '2024-12',
    notes: 'Runs locally, no API required'
  }
};

const AGENTS = [
  {
    name: 'coder',
    tasks: [
      {
        name: 'simple_function',
        description: 'Create a simple JavaScript function',
        task: 'Create a JavaScript function that calculates the factorial of a number using recursion. Include error handling for negative numbers.',
        expected_features: ['function', 'recursion', 'error handling', 'edge cases']
      },
      {
        name: 'data_structure',
        description: 'Implement a data structure',
        task: 'Implement a binary search tree in Python with insert, search, and delete methods. Include proper documentation.',
        expected_features: ['class', 'methods', 'documentation', 'tree structure']
      },
      {
        name: 'api_endpoint',
        description: 'Create REST API endpoint',
        task: 'Create a REST API endpoint in Express.js that handles user authentication with JWT tokens. Include input validation.',
        expected_features: ['express', 'jwt', 'validation', 'security']
      }
    ]
  },
  {
    name: 'researcher',
    tasks: [
      {
        name: 'technical_analysis',
        description: 'Analyze technical concept',
        task: 'Explain the differences between REST and GraphQL APIs, including pros, cons, and use cases for each.',
        expected_features: ['comparison', 'pros/cons', 'use cases', 'technical depth']
      },
      {
        name: 'architecture_review',
        description: 'Review architecture patterns',
        task: 'Describe microservices architecture patterns and when to use them versus monolithic architecture.',
        expected_features: ['patterns', 'trade-offs', 'examples', 'recommendations']
      }
    ]
  },
  {
    name: 'reviewer',
    tasks: [
      {
        name: 'code_review',
        description: 'Review code quality',
        task: 'Review this code and suggest improvements: function getData(url){fetch(url).then(r=>r.json()).then(d=>console.log(d))}',
        expected_features: ['error handling', 'best practices', 'async/await', 'naming']
      }
    ]
  },
  {
    name: 'planner',
    tasks: [
      {
        name: 'project_plan',
        description: 'Create project implementation plan',
        task: 'Create a step-by-step plan for building a real-time chat application with React and Socket.io.',
        expected_features: ['phases', 'milestones', 'dependencies', 'timeline']
      }
    ]
  }
];

const METRICS = {
  execution_time: 0,
  tokens_estimated: 0,
  cost_estimated: 0,
  output_length: 0,
  success: false,
  error: null
};

// Quality scoring criteria
const QUALITY_CRITERIA = {
  completeness: { weight: 0.25, description: 'Does it address all task requirements?' },
  accuracy: { weight: 0.25, description: 'Is the information/code correct?' },
  depth: { weight: 0.20, description: 'How thorough is the response?' },
  structure: { weight: 0.15, description: 'Is it well-organized and readable?' },
  practicality: { weight: 0.15, description: 'Is it usable/actionable?' }
};

class BenchmarkRunner {
  constructor() {
    this.results = [];
    this.outputDir = join(process.cwd(), 'docs/agentic-flow/benchmarks/results');
    mkdirSync(this.outputDir, { recursive: true });
  }

  async runBenchmark(model, modelConfig, agent, task) {
    console.log(`\n🧪 Testing: ${modelConfig.name} on ${agent.name} - ${task.name}`);

    const startTime = Date.now();
    const metrics = { ...METRICS };
    let output = '';

    try {
      // Build command
      let cmd = `npx agentic-flow --agent ${agent.name} --task "${task.task}" --output json`;

      if (modelConfig.provider !== 'anthropic') {
        cmd += ` --provider ${modelConfig.provider}`;
      }

      if (modelConfig.model) {
        cmd += ` --model "${modelConfig.model}"`;
      }

      // Add timeout to prevent hanging
      cmd += ` --timeout 60000`;

      console.log(`   Command: ${cmd.substring(0, 100)}...`);

      // Execute with timeout
      output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 65000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });

      metrics.execution_time = Date.now() - startTime;
      metrics.output_length = output.length;
      metrics.success = true;

      // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const inputTokens = Math.ceil(task.task.length / 4);
      const outputTokens = Math.ceil(output.length / 4);
      metrics.tokens_estimated = inputTokens + outputTokens;

      // Calculate cost
      const inputCost = (inputTokens / 1000000) * modelConfig.cost_per_1m_input;
      const outputCost = (outputTokens / 1000000) * modelConfig.cost_per_1m_output;
      metrics.cost_estimated = inputCost + outputCost;

      console.log(`   ✅ Success in ${metrics.execution_time}ms`);
      console.log(`   📊 Output: ${metrics.output_length} chars, ~${metrics.tokens_estimated} tokens`);
      console.log(`   💰 Cost: $${metrics.cost_estimated.toFixed(6)}`);

    } catch (error) {
      metrics.execution_time = Date.now() - startTime;
      metrics.success = false;
      metrics.error = error.message;
      console.log(`   ❌ Failed: ${error.message.substring(0, 100)}`);
    }

    return {
      model: model,
      model_name: modelConfig.name,
      provider: modelConfig.provider,
      agent: agent.name,
      task_name: task.name,
      task_description: task.description,
      task: task.task,
      expected_features: task.expected_features,
      output: output,
      metrics: metrics,
      timestamp: new Date().toISOString()
    };
  }

  async runConcurrentBenchmarks() {
    console.log('🚀 Starting Concurrent Multi-Model Benchmark Suite\n');
    console.log('═'.repeat(80));

    const allTests = [];

    // Generate all test combinations
    for (const [modelKey, modelConfig] of Object.entries(MODELS)) {
      // Skip models that require API keys if not available
      if (modelConfig.requires_api_key) {
        if (modelConfig.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
          console.log(`⚠️  Skipping ${modelConfig.name} - no ANTHROPIC_API_KEY`);
          continue;
        }
        if (modelConfig.provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
          console.log(`⚠️  Skipping ${modelConfig.name} - no OPENROUTER_API_KEY`);
          continue;
        }
      }

      for (const agent of AGENTS) {
        for (const task of agent.tasks) {
          allTests.push({ modelKey, modelConfig, agent, task });
        }
      }
    }

    console.log(`\n📋 Total tests to run: ${allTests.length}`);
    console.log('═'.repeat(80));

    // Run tests sequentially (concurrent execution would overwhelm API rate limits)
    for (const test of allTests) {
      const result = await this.runBenchmark(
        test.modelKey,
        test.modelConfig,
        test.agent,
        test.task
      );
      this.results.push(result);

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this.results;
  }

  generateReport() {
    console.log('\n\n📊 Generating Comprehensive Report...\n');

    // Group results by model
    const byModel = {};
    for (const result of this.results) {
      if (!byModel[result.model]) {
        byModel[result.model] = [];
      }
      byModel[result.model].push(result);
    }

    // Calculate aggregate statistics
    const modelStats = {};
    for (const [model, results] of Object.entries(byModel)) {
      const successful = results.filter(r => r.metrics.success);
      const failed = results.filter(r => !r.metrics.success);

      modelStats[model] = {
        model_name: results[0].model_name,
        provider: results[0].provider,
        total_tests: results.length,
        successful: successful.length,
        failed: failed.length,
        success_rate: (successful.length / results.length) * 100,
        avg_execution_time: successful.reduce((sum, r) => sum + r.metrics.execution_time, 0) / successful.length || 0,
        avg_output_length: successful.reduce((sum, r) => sum + r.metrics.output_length, 0) / successful.length || 0,
        total_cost: successful.reduce((sum, r) => sum + r.metrics.cost_estimated, 0),
        avg_cost_per_task: successful.reduce((sum, r) => sum + r.metrics.cost_estimated, 0) / successful.length || 0
      };
    }

    // Generate markdown report
    const report = this.generateMarkdownReport(modelStats, byModel);

    // Save report
    const reportPath = join(this.outputDir, `benchmark-report-${Date.now()}.md`);
    writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Report saved to: ${reportPath}`);

    // Save raw JSON data
    const jsonPath = join(this.outputDir, `benchmark-data-${Date.now()}.json`);
    writeFileSync(jsonPath, JSON.stringify({
      summary: modelStats,
      detailed_results: this.results,
      metadata: {
        timestamp: new Date().toISOString(),
        total_tests: this.results.length,
        models_tested: Object.keys(byModel).length
      }
    }, null, 2), 'utf8');
    console.log(`✅ Raw data saved to: ${jsonPath}`);

    return { reportPath, jsonPath, modelStats };
  }

  generateMarkdownReport(modelStats, byModel) {
    let md = `# Agentic Flow Multi-Model Benchmark Report\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    md += `## Executive Summary\n\n`;

    // Summary table
    md += `### Performance Overview\n\n`;
    md += `| Model | Provider | Success Rate | Avg Time (ms) | Avg Cost/Task | Total Cost |\n`;
    md += `|-------|----------|--------------|---------------|---------------|------------|\n`;

    for (const [model, stats] of Object.entries(modelStats)) {
      md += `| ${stats.model_name} | ${stats.provider} | `;
      md += `${stats.success_rate.toFixed(1)}% | `;
      md += `${Math.round(stats.avg_execution_time)} | `;
      md += `$${stats.avg_cost_per_task.toFixed(6)} | `;
      md += `$${stats.total_cost.toFixed(6)} |\n`;
    }

    // Detailed results by model
    md += `\n## Detailed Results by Model\n\n`;

    for (const [model, results] of Object.entries(byModel)) {
      const stats = modelStats[model];
      md += `### ${stats.model_name} (${stats.provider})\n\n`;
      md += `**Statistics:**\n`;
      md += `- Tests Run: ${stats.total_tests}\n`;
      md += `- Successful: ${stats.successful} (${stats.success_rate.toFixed(1)}%)\n`;
      md += `- Failed: ${stats.failed}\n`;
      md += `- Average Execution Time: ${Math.round(stats.avg_execution_time)}ms\n`;
      md += `- Average Output Length: ${Math.round(stats.avg_output_length)} characters\n`;
      md += `- Total Cost: $${stats.total_cost.toFixed(6)}\n`;
      md += `- Cost per Task: $${stats.avg_cost_per_task.toFixed(6)}\n\n`;

      // Task breakdown
      md += `**Task Results:**\n\n`;
      for (const result of results) {
        const icon = result.metrics.success ? '✅' : '❌';
        md += `${icon} **${result.agent}** - ${result.task_description}\n`;
        if (result.metrics.success) {
          md += `   - Time: ${result.metrics.execution_time}ms\n`;
          md += `   - Output: ${result.metrics.output_length} chars\n`;
          md += `   - Cost: $${result.metrics.cost_estimated.toFixed(6)}\n`;
        } else {
          md += `   - Error: ${result.metrics.error}\n`;
        }
        md += `\n`;
      }
    }

    // Recommendations
    md += `\n## Recommendations\n\n`;

    // Find best for different criteria
    const bestSpeed = Object.entries(modelStats)
      .filter(([_, s]) => s.successful > 0)
      .sort((a, b) => a[1].avg_execution_time - b[1].avg_execution_time)[0];

    const bestCost = Object.entries(modelStats)
      .filter(([_, s]) => s.successful > 0)
      .sort((a, b) => a[1].avg_cost_per_task - b[1].avg_cost_per_task)[0];

    const bestReliability = Object.entries(modelStats)
      .sort((a, b) => b[1].success_rate - a[1].success_rate)[0];

    if (bestSpeed) {
      md += `### 🚀 Fastest Model\n`;
      md += `**${bestSpeed[1].model_name}** - ${Math.round(bestSpeed[1].avg_execution_time)}ms average\n\n`;
    }

    if (bestCost) {
      md += `### 💰 Most Cost-Effective\n`;
      md += `**${bestCost[1].model_name}** - $${bestCost[1].avg_cost_per_task.toFixed(6)} per task\n\n`;
    }

    if (bestReliability) {
      md += `### 🎯 Most Reliable\n`;
      md += `**${bestReliability[1].model_name}** - ${bestReliability[1].success_rate.toFixed(1)}% success rate\n\n`;
    }

    md += `## Model Selection Guide (January 2025)\n\n`;
    md += `### Tier 1: Flagship Models (Premium Quality)\n\n`;

    md += `**Claude Sonnet 4.5 (Anthropic) - Best Overall**\n`;
    md += `- 🎯 Best for: Complex reasoning, production code, critical analysis\n`;
    md += `- 💰 Cost: $3/1M input, $15/1M output\n`;
    md += `- ⚡ Strengths: Superior reasoning, coding excellence, detailed responses\n`;
    md += `- 📊 Use when: Quality > cost, production deployments, mission-critical tasks\n\n`;

    md += `**GPT-4o (OpenRouter) - Best Multimodal**\n`;
    md += `- 🎯 Best for: Multimodal tasks, fast responses, general-purpose\n`;
    md += `- 💰 Cost: $2.50/1M input, $10/1M output\n`;
    md += `- ⚡ Strengths: Speed, versatility, image understanding\n`;
    md += `- 📊 Use when: Need vision capabilities, fast turnaround, broad use cases\n\n`;

    md += `**Gemini 2.5 Pro with Deep Think (OpenRouter) - Best for Reasoning**\n`;
    md += `- 🎯 Best for: Complex reasoning, massive context, deep analysis\n`;
    md += `- 💰 Cost: $1.25/1M input, $5/1M output\n`;
    md += `- ⚡ Strengths: 1M+ token context, advanced reasoning, cost-effective premium\n`;
    md += `- 📊 Use when: Need large context, mathematical reasoning, analysis tasks\n\n`;

    md += `### Tier 2: Cost-Effective Champions (2025 Breakthrough)\n\n`;

    md += `**DeepSeek R1 (OpenRouter) - Best Value for Reasoning**\n`;
    md += `- 🎯 Best for: Math, coding, reasoning tasks at fraction of cost\n`;
    md += `- 💰 Cost: $0.55/1M input, $2.19/1M output (27x cheaper than OpenAI o1!)\n`;
    md += `- ⚡ Strengths: Exceptional reasoning, coding, competitive with top models\n`;
    md += `- 📊 Use when: Budget-conscious but need quality, coding tasks, reasoning\n`;
    md += `- 🔥 **2025 Game Changer**: Flagship performance at 1/27th the cost\n\n`;

    md += `**DeepSeek Chat V3 (OpenRouter) - Best Overall Value**\n`;
    md += `- 🎯 Best for: General coding, development, high-volume applications\n`;
    md += `- 💰 Cost: $0.14/1M input, $0.28/1M output\n`;
    md += `- ⚡ Strengths: Strong coding, fast, ultra-low cost\n`;
    md += `- 📊 Use when: High-volume usage, development tools, cost is priority\n\n`;

    md += `### Tier 3: Balanced Performance\n\n`;

    md += `**Gemini 2.5 Flash (OpenRouter) - Best for Speed**\n`;
    md += `- 🎯 Best for: Fast responses, interactive apps, real-time\n`;
    md += `- 💰 Cost: $0.075/1M input, $0.30/1M output\n`;
    md += `- ⚡ Strengths: Ultra-fast, capable, good balance\n`;
    md += `- 📊 Use when: Latency matters, chatbots, interactive applications\n\n`;

    md += `**Llama 3.3 70B (OpenRouter) - Best Open Source**\n`;
    md += `- 🎯 Best for: Open-source preference, customization, versatility\n`;
    md += `- 💰 Cost: $0.35/1M input, $0.40/1M output\n`;
    md += `- ⚡ Strengths: Open weights, good coding, community support\n`;
    md += `- 📊 Use when: Want open-source, fine-tuning, transparency\n\n`;

    md += `**Qwen 2.5 72B (OpenRouter) - Best Multilingual**\n`;
    md += `- 🎯 Best for: Multilingual tasks, international applications\n`;
    md += `- 💰 Cost: $0.35/1M input, $0.40/1M output\n`;
    md += `- ⚡ Strengths: Multilingual excellence, coding, reasoning\n`;
    md += `- 📊 Use when: Non-English languages, global applications\n\n`;

    md += `### Tier 4: Budget Options\n\n`;

    md += `**Llama 3.1 8B (OpenRouter) - Ultra Budget**\n`;
    md += `- 🎯 Best for: Simple tasks, experimentation, prototyping\n`;
    md += `- 💰 Cost: $0.06/1M input, $0.06/1M output\n`;
    md += `- ⚡ Strengths: Ultra-low cost, good for simple tasks\n`;
    md += `- 📊 Use when: Testing, simple automation, tight budgets\n\n`;

    md += `### Tier 5: Local/Privacy\n\n`;

    md += `**ONNX Phi-4 Mini (Local) - Best for Privacy**\n`;
    md += `- 🎯 Best for: Privacy, offline, zero costs, air-gapped\n`;
    md += `- 💰 Cost: FREE (runs locally)\n`;
    md += `- ⚡ Strengths: No API required, private, offline capable\n`;
    md += `- 📊 Use when: Privacy critical, no internet, sensitive data\n\n`;

    md += `## 2025 Recommendations by Use Case\n\n`;
    md += `### Production Code Generation\n`;
    md += `1. Claude Sonnet 4.5 (highest quality)\n`;
    md += `2. DeepSeek R1 (best value)\n`;
    md += `3. GPT-4o (fast + quality)\n\n`;

    md += `### Budget-Conscious Development\n`;
    md += `1. DeepSeek Chat V3 (best overall value)\n`;
    md += `2. DeepSeek R1 (reasoning tasks)\n`;
    md += `3. Gemini 2.5 Flash (speed)\n\n`;

    md += `### Complex Reasoning\n`;
    md += `1. Gemini 2.5 Pro (massive context)\n`;
    md += `2. DeepSeek R1 (cost-effective)\n`;
    md += `3. Claude Sonnet 4.5 (premium)\n\n`;

    md += `### Real-Time/Interactive\n`;
    md += `1. Gemini 2.5 Flash (fastest)\n`;
    md += `2. GPT-4o (balanced)\n`;
    md += `3. DeepSeek Chat V3 (low cost)\n\n`;

    md += `### Privacy/Offline\n`;
    md += `1. ONNX Phi-4 Mini (local only)\n`;
    md += `2. Self-hosted Llama 3.3 (if available)\n\n`;

    return md;
  }
}

// Run benchmark
const runner = new BenchmarkRunner();
runner.runConcurrentBenchmarks()
  .then(() => {
    const { reportPath, modelStats } = runner.generateReport();

    console.log('\n\n' + '═'.repeat(80));
    console.log('🎉 Benchmark Complete!');
    console.log('═'.repeat(80));

    console.log('\n📊 Quick Summary:\n');
    for (const [model, stats] of Object.entries(modelStats)) {
      console.log(`${stats.model_name}:`);
      console.log(`  Success Rate: ${stats.success_rate.toFixed(1)}%`);
      console.log(`  Avg Time: ${Math.round(stats.avg_execution_time)}ms`);
      console.log(`  Avg Cost: $${stats.avg_cost_per_task.toFixed(6)}`);
      console.log('');
    }
  })
  .catch(error => {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  });
