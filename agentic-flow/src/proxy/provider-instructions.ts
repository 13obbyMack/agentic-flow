// Provider-specific and model-specific tool instructions
// Optimized for different LLM families to improve tool calling success rate

export interface ToolInstructions {
  format: string; // The instruction format style
  commands: {
    write: string;
    read: string;
    bash: string;
  };
  examples?: string; // Optional example usage
  emphasis?: string; // Additional emphasis/notes
}

// Base structured command format (works for most models)
export const BASE_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
Example: Create a file
<file_write path="hello.js">
function hello() {
  console.log("Hello!");
}
</file_write>
`,
  emphasis: 'IMPORTANT: Use these structured commands in your response. The system will automatically execute them.'
};

// Anthropic models - Native tool calling, minimal instructions needed
export const ANTHROPIC_INSTRUCTIONS: ToolInstructions = {
  format: 'native',
  commands: {
    write: 'Use Write tool with file_path and content parameters',
    read: 'Use Read tool with file_path parameter',
    bash: 'Use Bash tool with command parameter'
  },
  emphasis: 'You have native access to file system tools. Use them directly.'
};

// OpenAI/GPT models - Prefer function calling style
export const OPENAI_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
When you need to create a file, respond with:
<file_write path="example.txt">
File content here
</file_write>

The system will create the file for you.
`,
  emphasis: 'CRITICAL: You must use these exact XML tag formats. Do not just describe the file - actually use the tags.'
};

// Google/Gemini models - Detailed, explicit instructions
export const GOOGLE_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
Step-by-step file creation:
1. Determine the filename
2. Write the content
3. Use this exact format:

<file_write path="your_file.txt">
Your content here
</file_write>

The file will be automatically created.
`,
  emphasis: 'IMPORTANT: Always use the XML tags. Just writing code blocks will NOT create files. You MUST use <file_write> tags.'
};

// Meta/Llama models - Clear, concise instructions
export const META_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
To create files, use:
<file_write path="file.txt">content</file_write>

To read files, use:
<file_read path="file.txt"/>

To run commands, use:
<bash_command>ls -la</bash_command>
`,
  emphasis: 'Use these tags to perform actual file operations. Code blocks alone will not create files.'
};

// DeepSeek models - Technical, precise instructions
export const DEEPSEEK_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
File system operations use XML-like structured commands:

<file_write path="example.py">
def main():
    print("Hello")
</file_write>

These commands are parsed and executed by the system.
`,
  emphasis: 'Use structured commands for file I/O. Standard code blocks are for display only.'
};

// Mistral models - Direct, action-oriented
export const MISTRAL_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
ACTION REQUIRED: To create actual files, you must use these tags:

<file_write path="file.txt">
content
</file_write>

Do not just show code - use the tags to create real files.
`,
  emphasis: 'CRITICAL: File operations require XML tags. Code blocks alone will not create files on disk.'
};

// X.AI/Grok models - Balanced, clear instructions
export const XAI_INSTRUCTIONS: ToolInstructions = {
  format: 'xml',
  commands: {
    write: '<file_write path="filename.ext">\ncontent here\n</file_write>',
    read: '<file_read path="filename.ext"/>',
    bash: '<bash_command>\ncommand here\n</bash_command>'
  },
  examples: `
File system commands:
- Create: <file_write path="file.txt">content</file_write>
- Read: <file_read path="file.txt"/>
- Execute: <bash_command>command</bash_command>
`,
  emphasis: 'Use structured commands to interact with the file system.'
};

// Map provider/model patterns to instruction sets
export function getInstructionsForModel(modelId: string, provider?: string): ToolInstructions {
  const normalizedModel = modelId.toLowerCase();

  // Anthropic models - native tool calling
  if (normalizedModel.includes('claude') || provider === 'anthropic') {
    return ANTHROPIC_INSTRUCTIONS;
  }

  // OpenAI models
  if (normalizedModel.includes('gpt') || normalizedModel.includes('openai') || provider === 'openai') {
    return OPENAI_INSTRUCTIONS;
  }

  // Google/Gemini models
  if (normalizedModel.includes('gemini') || normalizedModel.includes('gemma') || provider === 'google') {
    return GOOGLE_INSTRUCTIONS;
  }

  // Meta/Llama models
  if (normalizedModel.includes('llama') || provider === 'meta-llama' || provider === 'meta') {
    return META_INSTRUCTIONS;
  }

  // DeepSeek models
  if (normalizedModel.includes('deepseek') || provider === 'deepseek') {
    return DEEPSEEK_INSTRUCTIONS;
  }

  // Mistral models
  if (normalizedModel.includes('mistral') || provider === 'mistralai') {
    return MISTRAL_INSTRUCTIONS;
  }

  // X.AI/Grok models
  if (normalizedModel.includes('grok') || provider === 'x-ai') {
    return XAI_INSTRUCTIONS;
  }

  // Qwen models
  if (normalizedModel.includes('qwen')) {
    return DEEPSEEK_INSTRUCTIONS; // Similar to DeepSeek
  }

  // Default to base instructions
  return BASE_INSTRUCTIONS;
}

// Generate formatted instruction string for injection
export function formatInstructions(instructions: ToolInstructions): string {
  if (instructions.format === 'native') {
    return `${instructions.emphasis}\n\n${instructions.commands.write}\n${instructions.commands.read}\n${instructions.commands.bash}`;
  }

  let formatted = `${instructions.emphasis}\n\n`;
  formatted += `Available commands:\n`;
  formatted += `${instructions.commands.write}\n`;
  formatted += `${instructions.commands.read}\n`;
  formatted += `${instructions.commands.bash}\n`;

  if (instructions.examples) {
    formatted += `\n${instructions.examples}`;
  }

  return formatted;
}
