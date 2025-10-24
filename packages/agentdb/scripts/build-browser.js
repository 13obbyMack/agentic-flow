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

  var sqlReady = false;
  var SQL = null;

  // Initialize sql.js asynchronously
  if (typeof initSqlJs !== 'undefined') {
    initSqlJs({
      locateFile: function(file) {
        return 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/' + file;
      }
    }).then(function(sql) {
      SQL = sql;
      sqlReady = true;
      console.log('sql.js initialized');
    }).catch(function(err) {
      console.error('Failed to initialize sql.js:', err);
    });
  }

  // Backward compatible Database class (v1.0.7 API)
  function Database(data) {
      var db = null;

      if (!sqlReady || !SQL) {
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

      // Async initialization support (for newer demos)
      this.initializeAsync = function() {
        var self = this;
        return new Promise(function(resolve) {
          // Ensure all tables are created
          try {
            // Core vectors table
            self.run(\`
              CREATE TABLE IF NOT EXISTS vectors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                embedding BLOB,
                metadata TEXT,
                text TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            \`);

            // Patterns table (for SkillLibrary)
            self.run(\`
              CREATE TABLE IF NOT EXISTS patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT NOT NULL,
                metadata TEXT,
                embedding BLOB,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            \`);

            // Episodes table (for ReflexionMemory)
            self.run(\`
              CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trajectory TEXT NOT NULL,
                self_reflection TEXT,
                verdict TEXT,
                metadata TEXT,
                embedding BLOB,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            \`);

            // Causal edges table (for CausalMemoryGraph)
            self.run(\`
              CREATE TABLE IF NOT EXISTS causal_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cause TEXT NOT NULL,
                effect TEXT NOT NULL,
                strength REAL DEFAULT 0.5,
                metadata TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            \`);

            // Skills table
            self.run(\`
              CREATE TABLE IF NOT EXISTS skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                skill_name TEXT NOT NULL,
                code TEXT,
                metadata TEXT,
                embedding BLOB,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            \`);

            console.log('AgentDB: All tables initialized');
            resolve(self);
          } catch (error) {
            console.error('AgentDB initialization error:', error);
            resolve(self); // Still resolve to maintain compatibility
          }
        });
      };

      // Higher-level insert method (supports both signatures)
      this.insert = function(textOrTable, metadataOrData) {
        // Detect which signature is being used
        if (typeof textOrTable === 'string' && typeof metadataOrData === 'object') {
          // Check if this looks like insert(text, metadata) or insert(table, data)
          if (arguments.length === 2 && metadataOrData && Object.keys(metadataOrData).length > 0) {
            var firstKey = Object.keys(metadataOrData)[0];

            // If metadataOrData has SQL column names, treat as insert(table, data)
            if (['id', 'pattern', 'trajectory', 'cause', 'effect', 'skill_name', 'code'].indexOf(firstKey) !== -1) {
              // insert(table, data) signature
              var table = textOrTable;
              var data = metadataOrData;

              var columns = Object.keys(data);
              var values = Object.values(data);
              var placeholders = columns.map(function() { return '?'; }).join(', ');
              var sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ')';

              this.run(sql, values);

              var result = this.exec('SELECT last_insert_rowid() as id');
              return {
                lastID: result[0].values[0][0],
                changes: 1
              };
            }
          }

          // insert(text, metadata) signature - insert into vectors table
          var text = textOrTable;
          var metadata = metadataOrData || {};

          this.run(
            'INSERT INTO vectors (text, metadata) VALUES (?, ?)',
            [text, JSON.stringify(metadata)]
          );

          var result = this.exec('SELECT last_insert_rowid() as id');
          return {
            lastID: result[0].values[0][0],
            changes: 1
          };
        }

        throw new Error('Invalid insert arguments');
      };

      // Higher-level search method (for newer demos)
      this.search = function(query, options) {
        options = options || {};
        var limit = options.limit || 10;

        // Simple vector search simulation
        var sql = 'SELECT * FROM vectors LIMIT ' + limit;
        var results = this.exec(sql);

        if (!results.length || !results[0].values.length) {
          return [];
        }

        return results[0].values.map(function(row) {
          return {
            id: row[0],
            text: row[3],
            metadata: row[2] ? JSON.parse(row[2]) : {},
            similarity: Math.random() * 0.5 + 0.5 // Simulated similarity
          };
        });
      };

      // Higher-level delete method (for newer demos)
      this.delete = function(table, condition) {
        if (!table) {
          throw new Error('Table name is required');
        }

        var sql = 'DELETE FROM ' + table;
        if (condition) {
          sql += ' WHERE ' + condition;
        }

        this.run(sql);
        return { changes: 1 };
      };

      // Controller-style methods for frontier features
      this.storePattern = function(patternData) {
        var data = {
          pattern: patternData.pattern || JSON.stringify(patternData),
          metadata: JSON.stringify(patternData.metadata || {})
        };
        return this.insert('patterns', data);
      };

      this.storeEpisode = function(episodeData) {
        var data = {
          trajectory: episodeData.trajectory || JSON.stringify(episodeData),
          self_reflection: episodeData.self_reflection || episodeData.reflection || '',
          verdict: episodeData.verdict || 'unknown',
          metadata: JSON.stringify(episodeData.metadata || {})
        };
        return this.insert('episodes', data);
      };

      this.addCausalEdge = function(edgeData) {
        var data = {
          cause: edgeData.cause || '',
          effect: edgeData.effect || '',
          strength: edgeData.strength || 0.5,
          metadata: JSON.stringify(edgeData.metadata || {})
        };
        return this.insert('causal_edges', data);
      };

      this.storeSkill = function(skillData) {
        var data = {
          skill_name: skillData.skill_name || skillData.name || '',
          code: skillData.code || '',
          metadata: JSON.stringify(skillData.metadata || {})
        };
        return this.insert('skills', data);
      };

      // Initialize with comprehensive schema if new database
      if (!data) {
        // Core vectors table
        this.run(\`
          CREATE TABLE IF NOT EXISTS vectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            embedding BLOB,
            metadata TEXT,
            text TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);

        // Patterns table (for SkillLibrary)
        this.run(\`
          CREATE TABLE IF NOT EXISTS patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern TEXT NOT NULL,
            metadata TEXT,
            embedding BLOB,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);

        // Episodes table (for ReflexionMemory)
        this.run(\`
          CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trajectory TEXT NOT NULL,
            self_reflection TEXT,
            verdict TEXT,
            metadata TEXT,
            embedding BLOB,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);

        // Causal edges table (for CausalMemoryGraph)
        this.run(\`
          CREATE TABLE IF NOT EXISTS causal_edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cause TEXT NOT NULL,
            effect TEXT NOT NULL,
            strength REAL DEFAULT 0.5,
            metadata TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);

        // Skills table
        this.run(\`
          CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT NOT NULL,
            code TEXT,
            metadata TEXT,
            embedding BLOB,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        \`);
      }
  }

  // Helper to wait for sql.js to be ready
  function waitForReady(callback) {
    if (sqlReady) {
      callback();
    } else {
      setTimeout(function() {
        waitForReady(callback);
      }, 50);
    }
  }

  // Create AgentDB namespace with all exports
  var AgentDB = {
    version: '${pkg.version}',
    Database: Database,
    ready: false,

    // Wait for initialization
    onReady: function(callback) {
      waitForReady(function() {
        AgentDB.ready = true;
        callback();
      });
    },

    // Additional exports for compatibility
    SQLiteVectorDB: Database,  // Alias for newer demos
    createVectorDB: function(config) {
      return new Database(config?.data);
    }
  };

  // Auto-set ready flag when sql.js loads
  waitForReady(function() {
    AgentDB.ready = true;
  });

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentDB;
    module.exports.Database = Database;
    module.exports.SQLiteVectorDB = Database;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return AgentDB; });
  } else {
    global.AgentDB = AgentDB;
    // Also export directly for ES6 imports
    global.Database = Database;
    global.SQLiteVectorDB = Database;
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
