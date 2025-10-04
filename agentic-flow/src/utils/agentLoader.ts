// Agent loader for .claude/agents integration
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

// Get the package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '../..');
const defaultAgentsDir = join(packageRoot, '.claude/agents');

export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  color?: string;
  tools?: string[];
  filePath: string;
}

interface AgentFrontmatter {
  name: string;
  description: string;
  color?: string;
  tools?: string[];
}

/**
 * Parse agent markdown file with frontmatter
 */
function parseAgentFile(filePath: string): AgentDefinition | null {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Check for frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      logger.warn('Agent file missing frontmatter', { filePath });
      return null;
    }

    const [, frontmatter, systemPrompt] = frontmatterMatch;

    // Parse YAML-like frontmatter
    const meta: Partial<AgentFrontmatter> = {};
    frontmatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (key === 'tools') {
          meta[key] = cleanValue.split(',').map(t => t.trim());
        } else {
          (meta as any)[key] = cleanValue;
        }
      }
    });

    if (!meta.name || !meta.description) {
      logger.warn('Agent file missing required metadata', { filePath });
      return null;
    }

    return {
      name: meta.name,
      description: meta.description,
      systemPrompt: systemPrompt.trim(),
      color: meta.color,
      tools: meta.tools,
      filePath
    };
  } catch (error) {
    logger.error('Failed to parse agent file', { filePath, error });
    return null;
  }
}

/**
 * Recursively find all agent definition files
 */
function findAgentFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findAgentFiles(fullPath));
      } else if (extname(entry) === '.md' && entry !== 'README.md') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    logger.warn('Failed to read directory', { dir, error });
  }

  return files;
}

/**
 * Load all agents from .claude/agents directory
 */
export function loadAgents(agentsDir?: string): Map<string, AgentDefinition> {
  const agents = new Map<string, AgentDefinition>();

  // Priority: explicit parameter > env var > package default > current working directory
  const targetDir = agentsDir
    || process.env.AGENTS_DIR
    || (existsSync(defaultAgentsDir) ? defaultAgentsDir : join(process.cwd(), '.claude/agents'));

  logger.info('Loading agents from directory', { agentsDir: targetDir });

  const agentFiles = findAgentFiles(targetDir);
  logger.debug('Found agent files', { count: agentFiles.length });

  for (const filePath of agentFiles) {
    const agent = parseAgentFile(filePath);
    if (agent) {
      agents.set(agent.name, agent);
      logger.debug('Loaded agent', { name: agent.name, description: agent.description.substring(0, 100) });
    }
  }

  logger.info('Agents loaded successfully', { count: agents.size });
  return agents;
}

/**
 * Get a specific agent by name
 */
export function getAgent(name: string, agentsDir?: string): AgentDefinition | undefined {
  const agents = loadAgents(agentsDir);
  return agents.get(name);
}

/**
 * List all available agents
 */
export function listAgents(agentsDir?: string): AgentDefinition[] {
  const agents = loadAgents(agentsDir);
  return Array.from(agents.values());
}
