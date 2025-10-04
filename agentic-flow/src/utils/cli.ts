// CLI argument parsing and help utilities

export interface CliOptions {
  mode: 'agent' | 'parallel' | 'list' | 'mcp';
  agent?: string;
  task?: string;
  model?: string;
  provider?: string;
  stream?: boolean;
  help?: boolean;
  mcpCommand?: string; // start, stop, status, list
  mcpServer?: string; // claude-flow, flow-nexus, agentic-payments, all
}

export function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    mode: 'parallel'
  };

  // Check for MCP command first
  if (args[0] === 'mcp') {
    options.mode = 'mcp';
    options.mcpCommand = args[1] || 'start'; // default to start
    options.mcpServer = args[2] || 'all'; // default to all servers
    return options;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--agent':
      case '-a':
        options.mode = 'agent';
        options.agent = args[++i];
        break;

      case '--task':
      case '-t':
        options.task = args[++i];
        break;

      case '--model':
      case '-m':
        options.model = args[++i];
        break;

      case '--provider':
      case '-p':
        options.provider = args[++i];
        break;

      case '--stream':
      case '-s':
        options.stream = true;
        break;

      case '--list':
      case '-l':
        options.mode = 'list';
        break;
    }
  }

  return options;
}

export function printHelp(): void {
  console.log(`
🤖 Agentic Flow - AI Agent Orchestration CLI

USAGE:
  npx agentic-flow [COMMAND] [OPTIONS]

COMMANDS:
  mcp <command> [server]  Manage MCP servers (start, stop, status, list)
  --list, -l              List all available agents
  --agent, -a <name>      Run specific agent mode
  (default)               Run parallel mode (3 agents)

MCP COMMANDS:
  npx agentic-flow mcp start [server]    Start MCP server(s)
  npx agentic-flow mcp stop [server]     Stop MCP server(s)
  npx agentic-flow mcp status [server]   Check MCP server status
  npx agentic-flow mcp list              List all available MCP tools

  Available servers: claude-flow, flow-nexus, agentic-payments, all (default)

OPTIONS:
  --task, -t <task>       Task description for agent mode
  --model, -m <model>     Model to use (supports OpenRouter models)
  --provider, -p <name>   Provider to use (anthropic, openrouter, onnx)
  --stream, -s            Enable real-time streaming output
  --help, -h              Show this help message

EXAMPLES:
  # MCP Server Management
  npx agentic-flow mcp start              # Start all MCP servers
  npx agentic-flow mcp start claude-flow  # Start specific server
  npx agentic-flow mcp list               # List all 203+ MCP tools
  npx agentic-flow mcp status             # Check server status

  # Agent Execution
  npx agentic-flow --list                 # List all 150+ agents
  npx agentic-flow --agent researcher --task "Analyze AI trends"
  npx agentic-flow --agent coder --task "Build REST API" --model "meta-llama/llama-3.1-8b-instruct"
  npx agentic-flow --agent coder --task "Create hello world" --provider onnx
  npx agentic-flow --agent coder --task "Build REST API" --stream

  # Parallel Mode
  npx agentic-flow  # Run 3 agents in parallel (requires TOPIC, DIFF, DATASET)

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY       Anthropic API key (for Claude models)
  OPENROUTER_API_KEY      OpenRouter API key (for alternative models)
  USE_ONNX                Set to 'true' to force ONNX local inference
  AGENT                   Agent name for agent mode
  TASK                    Task description for agent mode
  MODEL                   Model override for agent mode
  PROVIDER                Provider to use (anthropic, openrouter, onnx)
  TOPIC                   Research topic for parallel mode
  DIFF                    Code diff for parallel mode
  DATASET                 Dataset hint for parallel mode
  ENABLE_STREAMING        Enable streaming (true/false)
  HEALTH_PORT             Health check port (default: 8080)

MCP TOOLS (203+ available):
  • claude-flow-sdk: 6 in-process tools (memory, swarm coordination)
  • claude-flow: 101 tools (neural networks, GitHub, workflows, DAA)
  • flow-nexus: 96 cloud tools (sandboxes, distributed swarms, templates)
  • agentic-payments: Payment authorization and multi-agent consensus

For more information, visit: https://github.com/ruvnet/agentic-flow
  `);
}

export function validateOptions(options: CliOptions): string | null {
  if (options.mode === 'agent') {
    if (!options.agent && !process.env.AGENT) {
      return 'Agent mode requires --agent <name> or AGENT env variable';
    }
    if (!options.task && !process.env.TASK) {
      return 'Agent mode requires --task <description> or TASK env variable';
    }
  }

  return null;
}
