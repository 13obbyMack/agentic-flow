/**
 * Database System using sql.js (WASM SQLite)
 * Pure JavaScript implementation with NO build dependencies
 */

// Type-only for compatibility
type Database = any;

let sqlJsWrapper: any = null;

/**
 * Get sql.js database implementation (ONLY sql.js, no better-sqlite3)
 */
export async function getDatabaseImplementation(): Promise<any> {
  // Return cached wrapper
  if (sqlJsWrapper) {
    return sqlJsWrapper;
  }

  try {
    console.log('✅ Using sql.js (WASM SQLite, no build tools required)');

    // sql.js requires async initialization
    const mod = await import('sql.js');
    const SQL = await mod.default();

    // Create database wrapper
    sqlJsWrapper = createSqlJsWrapper(SQL);

    return sqlJsWrapper;
  } catch (error) {
    console.error('❌ Failed to initialize sql.js:', (error as Error).message);
    throw new Error(
      'Failed to initialize SQLite. Please ensure sql.js is installed:\n' +
      'npm install sql.js'
    );
  }
}

/**
 * Create a better-sqlite3 compatible wrapper around sql.js
 * This allows AgentDB to work (with reduced performance) without native compilation
 */
function createSqlJsWrapper(SQL: any) {
  return class SqlJsDatabase {
    private db: any;
    private filename: string;

    constructor(filename: string, options?: any) {
      this.filename = filename;

      // In-memory database
      if (filename === ':memory:') {
        this.db = new SQL.Database();
      } else {
        // File-based database - use dynamic import workaround
        try {
          // Try to read existing file
          const fs = eval('require')('fs');
          if (fs.existsSync(filename)) {
            const buffer = fs.readFileSync(filename);
            this.db = new SQL.Database(buffer);
          } else {
            this.db = new SQL.Database();
          }
        } catch {
          // If require fails (shouldn't happen in Node), create empty DB
          this.db = new SQL.Database();
        }
      }
    }

    prepare(sql: string) {
      const stmt = this.db.prepare(sql);

      return {
        run: (...params: any[]) => {
          stmt.bind(params);
          stmt.step();
          stmt.reset();

          return {
            changes: this.db.getRowsModified(),
            lastInsertRowid: this.db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0
          };
        },

        get: (...params: any[]) => {
          stmt.bind(params);
          const hasRow = stmt.step();

          if (!hasRow) {
            stmt.reset();
            return undefined;
          }

          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.reset();

          const result: any = {};
          columns.forEach((col: string, idx: number) => {
            result[col] = values[idx];
          });

          return result;
        },

        all: (...params: any[]) => {
          stmt.bind(params);
          const results: any[] = [];

          while (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();

            const result: any = {};
            columns.forEach((col: string, idx: number) => {
              result[col] = values[idx];
            });

            results.push(result);
          }

          stmt.reset();
          return results;
        },

        finalize: () => {
          stmt.free();
        }
      };
    }

    exec(sql: string) {
      return this.db.exec(sql);
    }

    close() {
      // Save to file if needed
      if (this.filename !== ':memory:') {
        try {
          const fs = eval('require')('fs');
          const data = this.db.export();
          fs.writeFileSync(this.filename, Buffer.from(data));
        } catch (error) {
          console.warn('⚠️  Could not save database to file:', (error as Error).message);
        }
      }

      this.db.close();
    }

    pragma(pragma: string, options?: any) {
      const result = this.db.exec(`PRAGMA ${pragma}`);
      return result[0]?.values[0]?.[0];
    }
  };
}

/**
 * Create a database instance using sql.js
 */
export async function createDatabase(filename: string, options?: any): Promise<any> {
  const DatabaseImpl = await getDatabaseImplementation();
  return new DatabaseImpl(filename, options);
}

/**
 * Get information about current database implementation
 */
export function getDatabaseInfo(): {
  implementation: string;
  isNative: boolean;
  performance: 'high' | 'medium' | 'low';
  requiresBuildTools: boolean;
} {
  return {
    implementation: 'sql.js (WASM)',
    isNative: false,
    performance: 'medium',
    requiresBuildTools: false
  };
}
