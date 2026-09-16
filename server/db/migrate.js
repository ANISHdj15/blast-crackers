/**
 * Database Migration Runner for Blast Crackers
 * Supports both Cloud PostgreSQL (Supabase / Render / Neon) and Local SQLite
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const isPostgres = databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

  console.log('====================================================');
  console.log('🚀 BLAST CRACKERS - DATABASE MIGRATION ENGINE');
  console.log(`Target Engine: ${isPostgres ? 'Cloud PostgreSQL (Supabase / Render)' : 'Local SQLite'}`);
  console.log('====================================================\n');

  if (isPostgres) {
    const { Client } = require('pg');
    // Ensure SSL enabled for cloud hosted PostgreSQL (Supabase / Neon / Render)
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      console.log('🔌 Connecting to Cloud PostgreSQL database...');
      await client.connect();
      console.log('✅ Connected successfully to Cloud PostgreSQL!');

      const sqlPath = path.join(__dirname, 'migrations', '001_create_schema.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      console.log('📜 Executing PostgreSQL DDL migrations...');
      await client.query(sqlContent);
      console.log('✅ Schema migration executed successfully!');

      // Verify created tables
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const tableNames = res.rows.map(r => r.table_name);
      console.log('\n📊 Verified Public Tables in Cloud Database:');
      tableNames.forEach(t => console.log(`   - ${t}`));

      const requiredTables = [
        'users', 'categories', 'products', 'product_images', 'cart',
        'cart_items', 'addresses', 'orders', 'order_items', 'payments',
        'order_timeline', 'coupons', 'settings'
      ];

      const missing = requiredTables.filter(t => !tableNames.includes(t));
      if (missing.length > 0) {
        throw new Error(`Missing expected tables: ${missing.join(', ')}`);
      }

      console.log('\n🎉 ALL PRODUCTION DATABASE TABLES SUCCESSFULLY VERIFIED IN CLOUD POSTGRESQL!\n');
    } catch (err) {
      console.error('❌ Cloud PostgreSQL Migration Failed:', err.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  } else {
    // Local SQLite migration
    try {
      console.log('📂 Running local SQLite database schema initialization...');
      const db = require('./database');
      
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
      console.log('\n📊 Verified Tables in SQLite Database:');
      tables.forEach(t => console.log(`   - ${t.name}`));

      console.log('\n🎉 LOCAL SQLITE DATABASE SCHEMA SUCCESSFULLY INITIALIZED AND READY!\n');
    } catch (err) {
      console.error('❌ Local SQLite Migration Failed:', err.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
