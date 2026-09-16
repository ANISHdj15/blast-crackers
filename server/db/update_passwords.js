const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: 'postgresql://postgres.qdzmkxrtquovradsjkuh:Anishbosco%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const custHash = bcrypt.hashSync('Customer@123', 10);

  const res1 = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email', [adminHash, 'admin@blastcrackers.com']);
  console.log('Admin updated:', res1.rows);

  const res2 = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email', [custHash, 'customer@gmail.com']);
  console.log('Customer updated:', res2.rows);

  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
});
