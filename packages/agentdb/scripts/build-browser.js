#!/usr/bin/env node

/**
 * Browser bundle builder for AgentDB
 * Creates v1.0.7 backward-compatible browser bundle
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function buildBrowser() {
  console.log('🏗️  Building v1.0.7 backward-compatible browser bundle...');

  try {
    const pkg = JSON.parse(fs.readFileSync(join(rootDir, 'package.json'), 'utf8'));

    // Download sql.js WASM bundle
    console.log('📥 Downloading sql.js...');
    const sqlJsUrl = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js';
    const sqlJs = await fetch(sqlJsUrl).then(r => r.text());

    // Create v1.0.7 compatible wrapper
    const browserBundle = `/*! AgentDB Browser Bundle v${pkg.version} | MIT License | https://agentdb.ruv.io */
/*! Backward compatible with v1.0.7 API | Uses sql.js WASM SQLite */
${sqlJs}

;(function(global) {
  'use strict';

  // AgentDB v${pkg.version} - v1.0.7 Compatible Browser Bundle
  var AgentDB = {
    version: '${pkg.version}',

    // Backward compatible Database class
    Database: function(data) {
      var db = null;
      var SQL = global.SQL || (typeof module !== 'undefined' && module.exports ? module.exports.SQL : null);

      if (!SQL) {
        throw new Error('sql.js not loaded. Include sql-wasm.js first.');
      }

      // Initialize database
      if (data) {
        db = new SQL.Database(data);
      } else {
        db = new SQL.Database();
      }

      // v1.0.7 compatible methods
      this.run = function(sql, params) {
        try {
          if (params) {
            var stmt = db.prepare(sql);
            stmt.bind(params);
            stmt.step();
            stmt.free();
          } else {
            db.run(sql);
          }
          return this;
        } catch(e) {
          throw new Error('SQL Error: ' + e.message);
        }
      };

      this.exec = function(sql) {
        try {
          return db.exec(sql);
        } catch(e) {
          throw new Error('SQL Error: ' + e.message);
        }
      };

      this.prepare = function(sql) {
        return db.prepare(sql);
      };

      this.export = function() {
        return db.export();
      };

      this.close = function() {
        db.close();
      };

      // Initialize with basic schema if new database
      if (!data) {
        this.run(\`
          CREATE TABLE IF NOT EXISTS vectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            embedding BLOB,
            metadata TEXT,
            text TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);
      }
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

  console.log('AgentDB v${pkg.version} loaded (v1.0.7 API compatible)');

})(typeof window !== 'undefined' ? window : this);
`;

    // Write bundle
    const outPath = join(rootDir, 'dist', 'agentdb.min.js');
    fs.writeFileSync(outPath, browserBundle);

    const stats = fs.statSync(outPath);
    console.log(`✅ Browser bundle created: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('📦 Output: dist/agentdb.min.js');
    console.log('✨ v1.0.7 API compatible with sql.js WASM');

  } catch (error) {
    console.error('❌ Browser build failed:', error);
    process.exit(1);
  }
}

buildBrowser();
