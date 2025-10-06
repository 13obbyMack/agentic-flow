#!/usr/bin/env node
/**
 * Claude Code Wrapper for Agentic Flow
 *
 * Automatically spawns Claude Code with the correct ANTHROPIC_BASE_URL
 * and environment variables based on the provider/args used.
 *
 * Usage:
 *   npx agentic-flow claude-code --provider openrouter "Write a function"
 *   npx agentic-flow claude-code --provider gemini "Create a REST API"
 *   npx agentic-flow claude-code --provider anthropic "Help me debug"
 *
 * Features:
 * - Auto-starts proxy server in background if not running
 * - Sets ANTHROPIC_BASE_URL to proxy endpoint
 * - Configures provider-specific API keys
 * - Supports all Claude Code native arguments
 * - Cleans up proxy on exit (optional)
 */

import { spawn, ChildProcess } from 'child_process';
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

interface ProxyConfig {
  provider: 'anthropic' | 'openrouter' | 'gemini' | 'onnx';
  port: number;
  baseUrl: string;
  model?: string;
  apiKey: string;
  requiresProxy: boolean;
}

/**
 * Get proxy configuration based on provider
 */
function getProxyConfig(provider: string, customPort?: number): ProxyConfig {
  const port = customPort || 3000;
  const baseUrl = `http://localhost:${port}`;

  switch (provider.toLowerCase()) {
    case 'openrouter':
      return {
        provider: 'openrouter',
        port,
        baseUrl,
        model: process.env.COMPLETION_MODEL || 'meta-llama/llama-3.1-8b-instruct',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        requiresProxy: true
      };

    case 'gemini':
      return {
        provider: 'gemini',
        port,
        baseUrl,
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        apiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
        requiresProxy: true
      };

    case 'onnx':
      return {
        provider: 'onnx',
        port,
        baseUrl,
        model: 'onnx-local',
        apiKey: 'dummy',
        requiresProxy: true
      };

    case 'anthropic':
    default:
      return {
        provider: 'anthropic',
        port: 0,
        baseUrl: 'https://api.anthropic.com',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        requiresProxy: false
      };
  }
}

/**
 * Check if proxy server is already running
 */
async function isProxyRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start the proxy server in background
 */
async function startProxyServer(config: ProxyConfig): Promise<ChildProcess | null> {
  if (!config.requiresProxy) {
    return null;
  }

  // Check if already running
  const running = await isProxyRunning(config.port);
  if (running) {
    logger.info(`Proxy already running on port ${config.port}`);
    return null;
  }

  logger.info(`Starting ${config.provider} proxy on port ${config.port}...`);

  // Determine which proxy to start
  let scriptPath: string;
  let env: Record<string, string>;

  if (config.provider === 'gemini') {
    scriptPath = 'dist/proxy/anthropic-to-gemini.js';
    env = {
      ...process.env,
      PORT: config.port.toString(),
      GOOGLE_GEMINI_API_KEY: config.apiKey,
      GEMINI_MODEL: config.model || 'gemini-2.0-flash-exp'
    };
  } else {
    // OpenRouter or ONNX
    scriptPath = 'dist/proxy/anthropic-to-openrouter.js';
    env = {
      ...process.env,
      PORT: config.port.toString(),
      OPENROUTER_API_KEY: config.apiKey,
      COMPLETION_MODEL: config.model || 'meta-llama/llama-3.1-8b-instruct'
    };
  }

  const proxyProcess = spawn('node', [scriptPath], {
    env: env as NodeJS.ProcessEnv,
    detached: false,
    stdio: 'pipe'
  });

  // Wait for proxy to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Proxy startup timeout'));
    }, 10000);

    const checkReady = setInterval(async () => {
      const ready = await isProxyRunning(config.port);
      if (ready) {
        clearInterval(checkReady);
        clearTimeout(timeout);
        logger.info(`✅ Proxy server ready on port ${config.port}`);
        resolve();
      }
    }, 500);

    proxyProcess.on('error', (err) => {
      clearInterval(checkReady);
      clearTimeout(timeout);
      reject(err);
    });
  });

  return proxyProcess;
}

/**
 * Spawn Claude Code with configured environment
 */
function spawnClaudeCode(config: ProxyConfig, claudeArgs: string[]): ChildProcess {
  logger.info('Starting Claude Code...');
  logger.info(`Provider: ${config.provider}`);
  logger.info(`Base URL: ${config.baseUrl}`);
  if (config.model) {
    logger.info(`Model: ${config.model}`);
  }

  // Build environment variables
  const env: Record<string, string> = {
    ...process.env
  } as Record<string, string>;

  if (config.requiresProxy) {
    // Using proxy - set base URL and dummy key
    env.ANTHROPIC_BASE_URL = config.baseUrl;
    env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy';

    // Set provider-specific keys
    if (config.provider === 'openrouter') {
      env.OPENROUTER_API_KEY = config.apiKey;
    } else if (config.provider === 'gemini') {
      env.GOOGLE_GEMINI_API_KEY = config.apiKey;
    }
  } else {
    // Direct Anthropic
    env.ANTHROPIC_API_KEY = config.apiKey;
    if (env.ANTHROPIC_BASE_URL) {
      delete env.ANTHROPIC_BASE_URL;
    }
  }

  logger.debug('Environment variables:', {
    ANTHROPIC_BASE_URL: env.ANTHROPIC_BASE_URL || '(default)',
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY?.substring(0, 10) + '...',
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY ? '(set)' : '(not set)',
    GOOGLE_GEMINI_API_KEY: env.GOOGLE_GEMINI_API_KEY ? '(set)' : '(not set)'
  });

  // Spawn Claude Code
  const claudeProcess = spawn('claude', claudeArgs, {
    env: env as NodeJS.ProcessEnv,
    stdio: 'inherit'
  });

  return claudeProcess;
}

/**
 * Main CLI function
 */
async function main() {
  const program = new Command();

  program
    .name('agentic-flow claude-code')
    .description('Spawn Claude Code with automatic proxy configuration')
    .option('--provider <provider>', 'Provider to use (anthropic, openrouter, gemini, onnx)', 'anthropic')
    .option('--port <port>', 'Proxy port (default: 3000)', '3000')
    .option('--model <model>', 'Model to use (overrides env vars)')
    .option('--keep-proxy', 'Keep proxy running after Claude Code exits', false)
    .option('--no-auto-start', 'Do not auto-start proxy (assumes already running)', false)
    .allowUnknownOption(true)
    .allowExcessArguments(true);

  program.parse(process.argv);
  const options = program.opts();

  // Get provider configuration
  const config = getProxyConfig(options.provider, parseInt(options.port));

  // Override model if specified
  if (options.model) {
    config.model = options.model;
  }

  // Validate API keys
  if (config.requiresProxy && !config.apiKey) {
    console.error(`❌ Error: Missing API key for ${config.provider}`);
    console.error(`   Please set ${config.provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'GOOGLE_GEMINI_API_KEY'}`);
    process.exit(1);
  }

  if (!config.requiresProxy && !config.apiKey) {
    console.error('❌ Error: Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }

  // Get Claude Code arguments (everything after our custom flags)
  const claudeArgs = process.argv.slice(2).filter(arg => {
    return !arg.startsWith('--provider') &&
           !arg.startsWith('--port') &&
           !arg.startsWith('--model') &&
           !arg.startsWith('--keep-proxy') &&
           !arg.startsWith('--no-auto-start') &&
           arg !== options.provider &&
           arg !== options.port &&
           arg !== options.model;
  });

  let proxyProcess: ChildProcess | null = null;

  try {
    // Start proxy if needed and auto-start is enabled
    if (options.autoStart) {
      proxyProcess = await startProxyServer(config);
    }

    // Spawn Claude Code
    const claudeProcess = spawnClaudeCode(config, claudeArgs);

    // Handle cleanup on exit
    const cleanup = () => {
      if (proxyProcess && !options.keepProxy) {
        logger.info('Stopping proxy server...');
        proxyProcess.kill();
      }
    };

    claudeProcess.on('exit', (code) => {
      cleanup();
      process.exit(code || 0);
    });

    process.on('SIGINT', () => {
      claudeProcess.kill('SIGINT');
      cleanup();
    });

    process.on('SIGTERM', () => {
      claudeProcess.kill('SIGTERM');
      cleanup();
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (proxyProcess) {
      proxyProcess.kill();
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
