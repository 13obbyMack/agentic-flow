#!/usr/bin/env node

/**
 * Browser bundle builder for AgentDB
 * Creates a minified UMD bundle for CDN usage
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function buildBrowser() {
  console.log('🏗️  Building browser bundle...');

  try {
    const pkg = JSON.parse(fs.readFileSync(join(rootDir, 'package.json'), 'utf8'));

    // Create minimal browser bundle
    const browserBundle = `/*! AgentDB Browser Bundle v${pkg.version} | MIT License | https://agentdb.ruv.io */
(function(global) {
  'use strict';

  var AgentDB = {
    version: '${pkg.version}',

    // Note: Full AgentDB functionality requires Node.js environment
    // This browser bundle provides version information and compatibility layer

    info: function() {
      return {
        name: 'AgentDB',
        version: '${pkg.version}',
        description: 'Frontier Memory Features with MCP Integration',
        homepage: 'https://agentdb.ruv.io',
        docs: 'https://github.com/ruvnet/agentic-flow/tree/main/packages/agentdb',
        note: 'Full database features require Node.js environment. Use npm install agentdb or npx agentdb.'
      };
    },

    getInstallCommand: function() {
      return 'npm install agentdb';
    },

    getMCPCommand: function() {
      return 'npx agentdb@latest mcp start';
    }
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentDB;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return AgentDB; });
  } else {
    global.AgentDB = AgentDB;
  }

  console.log('AgentDB v${pkg.version} loaded. Note: Full database features require Node.js. Run: npm install agentdb');

})(typeof window !== 'undefined' ? window : this);
`;

    // Write minified bundle
    const outPath = join(rootDir, 'dist', 'agentdb.min.js');
    fs.writeFileSync(outPath, browserBundle);

    const stats = fs.statSync(outPath);
    console.log(`✅ Browser bundle created: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('📦 Output: dist/agentdb.min.js');
    console.log('ℹ️  Note: This is a minimal browser compatibility layer.');
    console.log('   Full AgentDB features require Node.js environment.');

  } catch (error) {
    console.error('❌ Browser build failed:', error);
    process.exit(1);
  }
}

buildBrowser();
