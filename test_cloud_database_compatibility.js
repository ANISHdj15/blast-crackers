// test_cloud_database_compatibility.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('🧪 Running Cloud Database & Production Deployment Compatibility Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // Test 1: PostgreSQL Migration DDL File Exists and contains all 13 tables
  const ddlPath = path.resolve(__dirname, 'server/db/migrations/001_create_schema.sql');
  assert(fs.existsSync(ddlPath), '001_create_schema.sql migration file exists');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  const expectedTables = [
    'users', 'categories', 'products', 'product_images', 'cart',
    'cart_items', 'addresses', 'orders', 'order_items', 'payments',
    'order_timeline', 'coupons', 'settings'
  ];

  for (const table of expectedTables) {
    assert(
      ddlContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
      `DDL includes table definition for "${table}"`
    );
  }

  // Test 2: Migration Runner file exists
  const migrateRunnerPath = path.resolve(__dirname, 'server/db/migrate.js');
  assert(fs.existsSync(migrateRunnerPath), 'server/db/migrate.js exists');

  // Test 3: Dual-Engine Seed script exists
  const seedScriptPath = path.resolve(__dirname, 'server/db/seed.js');
  assert(fs.existsSync(seedScriptPath), 'server/db/seed.js exists');
  const seedContent = fs.readFileSync(seedScriptPath, 'utf8');
  assert(seedContent.includes('seedPostgres'), 'Seed script includes PostgreSQL engine');
  assert(seedContent.includes('seedSqlite'), 'Seed script includes SQLite engine');

  // Test 4: Storage Service exists
  const storageServicePath = path.resolve(__dirname, 'server/services/storageService.js');
  assert(fs.existsSync(storageServicePath), 'server/services/storageService.js exists');
  const storageService = require('./server/services/storageService');
  assert(typeof storageService.uploadImage === 'function', 'storageService exports uploadImage method');

  // Test 5: Storage service local fallback upload
  const testBuffer = Buffer.from('FAKE_IMAGE_DATA_123456');
  const uploadResult = await storageService.uploadImage({
    buffer: testBuffer,
    originalname: 'test_cracker_thumbnail.png',
    mimetype: 'image/png'
  });
  assert(!!uploadResult.url, `Storage upload returned valid URL: ${uploadResult.url}`);
  assert(uploadResult.provider === 'local' || uploadResult.provider === 'cloudinary' || uploadResult.provider === 'supabase', `Storage returned valid provider: ${uploadResult.provider}`);

  // Test 6: Environment files exist and contain required keys
  const envExamplePath = path.resolve(__dirname, '.env.example');
  assert(fs.existsSync(envExamplePath), '.env.example exists in root');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  assert(envExampleContent.includes('DATABASE_URL='), '.env.example defines DATABASE_URL');
  assert(envExampleContent.includes('JWT_SECRET='), '.env.example defines JWT_SECRET');
  assert(envExampleContent.includes('SHOP_UPI_ID='), '.env.example defines SHOP_UPI_ID');
  assert(envExampleContent.includes('CLOUDINARY_CLOUD_NAME='), '.env.example defines Cloudinary settings');
  assert(envExampleContent.includes('FRONTEND_URL='), '.env.example defines FRONTEND_URL');

  const clientEnvPath = path.resolve(__dirname, 'client/.env.example');
  assert(fs.existsSync(clientEnvPath), 'client/.env.example exists');
  const clientEnvContent = fs.readFileSync(clientEnvPath, 'utf8');
  assert(clientEnvContent.includes('VITE_API_URL='), 'client/.env.example defines VITE_API_URL');

  // Test 7: Gitignore exists and protects secrets and databases
  const gitignorePath = path.resolve(__dirname, '.gitignore');
  assert(fs.existsSync(gitignorePath), '.gitignore exists in root');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore protects .env files');
  assert(gitignoreContent.includes('data/*.db*'), '.gitignore protects local SQLite databases');

  // Test 8: Live API Health Check
  const healthRes = await fetch('http://localhost:5000/api/health');
  assert(healthRes.ok, 'GET /api/health responds with HTTP 200');
  const healthData = await healthRes.json();
  assert(healthData.status === 'ok', 'GET /api/health returns status "ok"');

  // Test 9: CORS Headers
  const corsRes = await fetch('http://localhost:5000/api/health', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://blast-crackers.vercel.app',
      'Access-Control-Request-Method': 'GET'
    }
  });
  assert(corsRes.headers.has('access-control-allow-origin'), 'CORS Access-Control-Allow-Origin header is present');

  // Test 10: Image upload endpoint authorization protection
  const unauthUpload = await fetch('http://localhost:5000/api/admin/upload-image', {
    method: 'POST'
  });
  assert(unauthUpload.status === 401 || unauthUpload.status === 403, 'POST /api/admin/upload-image denies unauthenticated requests');

  // Test 11: Image upload endpoint with Admin Token
  const { JWT_SECRET } = require('./server/middleware/auth');
  const adminToken = jwt.sign({ id: 1, email: 'admin@blastcrackers.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const postBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="image"; filename="sparkler_test.png"',
    'Content-Type: image/png',
    '',
    'PNG_IMAGE_SAMPLE_BYTES',
    `--${boundary}--`
  ].join('\r\n');

  const authUpload = await fetch('http://localhost:5000/api/admin/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: postBody
  });
  assert(authUpload.ok, `POST /api/admin/upload-image responds 200 OK for admin (status: ${authUpload.status})`);
  const authUploadData = await authUpload.json();
  assert(authUploadData.success === true, 'Upload endpoint returns success: true');
  assert(!!authUploadData.url, `Upload endpoint returns valid URL: ${authUploadData.url}`);

  // Test 12: Deployment Guide and Production Checklist files exist
  assert(fs.existsSync(path.resolve(__dirname, 'DEPLOYMENT_GUIDE.md')), 'DEPLOYMENT_GUIDE.md exists');
  assert(fs.existsSync(path.resolve(__dirname, 'PRODUCTION_CHECKLIST.md')), 'PRODUCTION_CHECKLIST.md exists');

  console.log(`\n📊 Cloud Database Compatibility Results: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
