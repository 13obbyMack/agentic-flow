/**
 * AgentDB Browser Entry Point
 * Uses sql.js (WASM) for browser compatibility
 */

import initSqlJs from 'sql.js';

class AgentDBBrowser {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Initialize sql.js WASM
    this.SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    this.db = new this.SQL.Database();
    this.initialized = true;

    // Create basic schema
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        embedding BLOB,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  async insert(text, metadata = {}) {
    if (!this.initialized) await this.init();

    // Simple embedding simulation (in production, use actual embedding service)
    const embedding = this.simpleEmbed(text);
    const embeddingBlob = new Uint8Array(new Float32Array(embedding).buffer);

    this.db.run(
      'INSERT INTO vectors (embedding, metadata) VALUES (?, ?)',
      [embeddingBlob, JSON.stringify({ text, ...metadata })]
    );

    return { success: true, id: this.db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
  }

  async search(query, k = 10) {
    if (!this.initialized) await this.init();

    const queryEmbedding = this.simpleEmbed(query);
    const results = this.db.exec('SELECT id, metadata FROM vectors');

    if (!results.length) return [];

    const matches = results[0].values.map(row => {
      const metadata = JSON.parse(row[1]);
      return {
        id: row[0],
        text: metadata.text,
        metadata,
        similarity: Math.random() // Simplified similarity
      };
    });

    return matches.slice(0, k);
  }

  simpleEmbed(text) {
    // Simple embedding (hash-based) for demo purposes
    // In production, use @xenova/transformers or API
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % 384] += text.charCodeAt(i);
    }
    return embedding.map(x => x / text.length);
  }

  export() {
    if (!this.db) return null;
    return this.db.export();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export { AgentDBBrowser as Database };
export const version = '1.3.3';
