/**
 * Synchronous PostgreSQL Adapter for Blast Crackers
 * Allows existing route handlers to query Cloud PostgreSQL (Supabase / Render)
 * transparently with zero code modifications to business logic.
 */
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const os = require('os');

if (!isMainThread) {
  // Worker Thread: Executes async pg queries and signals main thread
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: workerData.connectionString,
    ssl: { rejectUnauthorized: false }
  });

  parentPort.on('message', async (task) => {
    const { type, sql, params, syncFile } = task;
    try {
      if (type === 'exec') {
        await pool.query(sql);
        fs.writeFileSync(syncFile, JSON.stringify({ success: true }));
      } else {
        const res = await pool.query(sql, params);
        fs.writeFileSync(syncFile, JSON.stringify({
          rows: res.rows || [],
          rowCount: res.rowCount || 0,
          command: res.command,
          lastInsertRowid: res.rows && res.rows[0] && (res.rows[0].id !== undefined) ? res.rows[0].id : 0
        }));
      }
    } catch (err) {
      fs.writeFileSync(syncFile, JSON.stringify({ error: err.message, detail: err.detail }));
    }
    Atomics.store(workerData.controlArray, 0, 1);
    Atomics.notify(workerData.controlArray, 0, 1);
  });
} else {
  // Main Thread: Provides better-sqlite3 compatible API over PostgreSQL
  function createPostgresBridge(connectionString) {
    const sab = new SharedArrayBuffer(4);
    const controlArray = new Int32Array(sab);
    const tempDir = os.tmpdir();
    const syncFile = path.join(tempDir, `pg_sync_${process.pid}_${Date.now()}.json`);

    const worker = new Worker(__filename, {
      workerData: {
        connectionString,
        controlArray
      }
    });
    worker.unref();

    // Clean up worker on process exit
    process.on('exit', () => {
      try { worker.terminate(); } catch(e) {}
      try { fs.unlinkSync(syncFile); } catch(e) {}
    });

    function convertSql(sql) {
      let paramIndex = 1;
      let inString = false;
      let quoteChar = null;
      let result = '';
      for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        if ((char === "'" || char === '"') && sql[i - 1] !== '\\') {
          if (!inString) {
            inString = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inString = false;
          }
          result += char;
        } else if (char === '?' && !inString) {
          result += '$' + (paramIndex++);
        } else {
          result += char;
        }
      }
      return result;
    }

    function execute(type, rawSql, params = []) {
      let sql = rawSql.trim();
      let pgSql = convertSql(sql);

      // Automatically append RETURNING id for INSERT queries if not already present
      if (type === 'run' && /^INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      Atomics.store(controlArray, 0, 0);
      worker.postMessage({ type, sql: pgSql, params, syncFile });
      Atomics.wait(controlArray, 0, 0, 15000);

      try {
        const data = fs.readFileSync(syncFile, 'utf8');
        const parsed = JSON.parse(data);
        if (parsed.error) {
          throw new Error(`[PostgreSQL Error] ${parsed.error} (Query: ${pgSql})`);
        }
        return parsed;
      } catch (e) {
        if (e.message.startsWith('[PostgreSQL Error]')) throw e;
        throw new Error(`PostgreSQL query failed or timed out: ${e.message}`);
      }
    }

    // better-sqlite3 API emulator
    const db = {
      isPostgres: true,
      prepare(sql) {
        return {
          get(...args) {
            const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
            const res = execute('get', sql, params);
            return res.rows[0];
          },
          all(...args) {
            const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
            const res = execute('all', sql, params);
            return res.rows;
          },
          run(...args) {
            const params = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
            const res = execute('run', sql, params);
            return {
              lastInsertRowid: res.lastInsertRowid,
              changes: res.rowCount
            };
          }
        };
      },
      exec(sql) {
        execute('exec', sql);
      },
      transaction(fn) {
        return function(...args) {
          execute('exec', 'BEGIN');
          try {
            const result = fn(...args);
            execute('exec', 'COMMIT');
            return result;
          } catch (err) {
            execute('exec', 'ROLLBACK');
            throw err;
          }
        };
      },
      pragma() {
        // no-op for postgres
      }
    };

    // Helper functions
    db.getSetting = function(key, defaultValue = null) {
      try {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? row.value : defaultValue;
      } catch (err) {
        return defaultValue;
      }
    };

    db.getAllSettings = function() {
      try {
        const rows = db.prepare('SELECT key, value, updated_at FROM settings').all();
        const result = {};
        for (const r of rows) {
          result[r.key] = r.value;
        }
        return result;
      } catch (err) {
        return {};
      }
    };

    db.setSetting = function(key, value) {
      const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(key, value);
    };

    db.addOrderTimelineEvent = function(orderId, status, title, description = '', createdBy = 'system') {
      try {
        const stmt = db.prepare(`
          INSERT INTO order_timeline (order_id, status, title, description, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(orderId, status, title, description, createdBy);
      } catch (err) {
        console.error('Failed to log order timeline event in PostgreSQL:', err.message);
      }
    };

    db.getOrderTimeline = function(orderId) {
      try {
        return db.prepare(`
          SELECT * FROM order_timeline 
          WHERE order_id = ? 
          ORDER BY created_at ASC, id ASC
        `).all(orderId);
      } catch (err) {
        return [];
      }
    };

    return db;
  }

  module.exports = { createPostgresBridge };
}
