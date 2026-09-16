/**
 * Automated Responsive Design & Mobile-Readiness Verification Suite
 * Blast Crackers Sivakasi E-Commerce Platform
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runResponsiveTestSuite() {
  console.log('🚀 Running Complete Responsive Readiness Verification Suite...\n');

  // 1. Viewport Meta & PWA Web App Manifest
  console.log('--- 1. Viewport & PWA Configuration ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'client', 'index.html'), 'utf8');
  assert(indexHtml.includes('width=device-width, initial-scale=1.0, maximum-scale=5.0'), 'Viewport tag includes responsive scaling and accessibility limits');
  assert(indexHtml.includes('name="theme-color" content="#064e3b"'), 'Theme color meta tag is set to emerald theme (#064e3b)');
  assert(indexHtml.includes('rel="manifest" href="/manifest.json"'), 'Web App Manifest link present');
  assert(indexHtml.includes('name="apple-mobile-web-app-capable" content="yes"'), 'iOS standalone capability meta tag present');

  const manifestPath = path.join(__dirname, 'client', 'public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json exists in public directory');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.name === 'Blast Crackers Sivakasi', 'Manifest name is Blast Crackers Sivakasi');
  assert(manifest.display === 'standalone', 'Manifest display mode is standalone');
  assert(manifest.theme_color === '#064e3b', 'Manifest theme_color is #064e3b');

  // 2. Responsive CSS Media Queries & Classes
  console.log('\n--- 2. CSS Breakpoints & Fluid Design Tokens ---');
  const indexCss = fs.readFileSync(path.join(__dirname, 'client', 'src', 'index.css'), 'utf8');
  assert(indexCss.includes('@media (max-width: 360px)'), 'Ultra-small phone breakpoint (360px) defined');
  assert(indexCss.includes('@media (max-width: 480px)'), 'Phone breakpoint (480px) defined');
  assert(indexCss.includes('@media (max-width: 768px)'), 'Tablet/Mobile breakpoint (768px) defined');
  assert(indexCss.includes('@media (min-width: 769px) and (max-width: 1024px)'), 'Tablet/iPad breakpoint (769px-1024px) defined');
  assert(indexCss.includes('@media (min-width: 1025px) and (max-width: 1440px)'), 'Desktop breakpoint (1025px-1440px) defined');
  assert(indexCss.includes('@media (min-width: 1441px)'), 'Ultra-wide 4K breakpoint (1441px+) defined');
  assert(indexCss.includes('clamp('), 'Fluid typography clamp() rules defined');
  assert(indexCss.includes('overflow-x: hidden'), 'Zero horizontal overflow rule enforced');

  // 3. Responsive Component Classes
  console.log('\n--- 3. Responsive Component System Classes ---');
  assert(indexCss.includes('.checkout-stepper-desktop'), '.checkout-stepper-desktop class defined');
  assert(indexCss.includes('.checkout-stepper-mobile'), '.checkout-stepper-mobile class defined');
  assert(indexCss.includes('.form-grid-2'), '.form-grid-2 responsive class defined');
  assert(indexCss.includes('.form-grid-3'), '.form-grid-3 responsive class defined');
  assert(indexCss.includes('.checkout-review-header'), '.checkout-review-header class defined');
  assert(indexCss.includes('.checkout-review-row'), '.checkout-review-row class defined');
  assert(indexCss.includes('.checkout-row-pricing'), '.checkout-row-pricing class defined');
  assert(indexCss.includes('.checkout-bill-grid'), '.checkout-bill-grid class defined');
  assert(indexCss.includes('.payment-options-list'), '.payment-options-list class defined');
  assert(indexCss.includes('.payment-option-card'), '.payment-option-card class defined');
  assert(indexCss.includes('.tab-nav'), '.tab-nav horizontal touch scrolling class defined');
  assert(indexCss.includes('.table-responsive-wrapper'), '.table-responsive-wrapper class defined');
  assert(indexCss.includes('.admin-charts-grid'), '.admin-charts-grid responsive class defined');
  assert(indexCss.includes('.upi-qr-container'), '.upi-qr-container responsive class defined');
  assert(indexCss.includes('.mobile-filter-sheet'), '.mobile-filter-sheet bottom drawer defined');
  assert(indexCss.includes('.mobile-nav-drawer'), '.mobile-nav-drawer side drawer defined');

  // 4. Component Implementation Verification
  console.log('\n--- 4. Component Source Audit ---');
  const headerCode = fs.readFileSync(path.join(__dirname, 'client', 'src', 'components', 'Header.jsx'), 'utf8');
  assert(headerCode.includes('mobile-nav-drawer'), 'Header includes mobile-nav-drawer');
  assert(headerCode.includes('mobile-nav-backdrop'), 'Header includes backdrop click dismissal');
  assert(headerCode.includes('mobile-search-toggle'), 'Header includes quick mobile search toggle');
  assert(headerCode.includes('mobile-cart-btn'), 'Header includes quick direct cart button');

  const storeViewCode = fs.readFileSync(path.join(__dirname, 'client', 'src', 'components', 'StoreView.jsx'), 'utf8');
  assert(storeViewCode.includes('mobile-filter-sheet'), 'StoreView includes bottom mobile-filter-sheet');
  assert(storeViewCode.includes('isMobileFilterOpen'), 'StoreView manages mobile filter sheet visibility');
  assert(storeViewCode.includes('filter-count-badge'), 'StoreView provides active filter count badge');

  const checkoutCode = fs.readFileSync(path.join(__dirname, 'client', 'src', 'components', 'CheckoutModal.jsx'), 'utf8');
  assert(checkoutCode.includes('checkout-stepper-desktop'), 'CheckoutModal uses checkout-stepper-desktop');
  assert(checkoutCode.includes('checkout-stepper-mobile'), 'CheckoutModal uses checkout-stepper-mobile');
  assert(checkoutCode.includes('form-grid-2'), 'CheckoutModal uses form-grid-2');
  assert(checkoutCode.includes('form-grid-3'), 'CheckoutModal uses form-grid-3');
  assert(checkoutCode.includes('checkout-review-row'), 'CheckoutModal uses checkout-review-row');
  assert(checkoutCode.includes('checkout-row-pricing'), 'CheckoutModal uses checkout-row-pricing');

  const upiCode = fs.readFileSync(path.join(__dirname, 'client', 'src', 'components', 'UpiPaymentModal.jsx'), 'utf8');
  assert(upiCode.includes('upi-qr-container'), 'UpiPaymentModal uses responsive upi-qr-container');

  const adminCode = fs.readFileSync(path.join(__dirname, 'client', 'src', 'components', 'AdminDashboardModal.jsx'), 'utf8');
  assert(adminCode.includes('admin-charts-grid'), 'AdminDashboardModal uses responsive admin-charts-grid');
  assert(adminCode.includes('table-responsive-wrapper'), 'AdminDashboardModal uses table-responsive-wrapper');

  // 5. Production Build Verification
  console.log('\n--- 5. Production Dist Build Output ---');
  const distHtmlPath = path.join(__dirname, 'client', 'dist', 'index.html');
  assert(fs.existsSync(distHtmlPath), 'Production build client/dist/index.html exists');
  const distAssets = fs.readdirSync(path.join(__dirname, 'client', 'dist', 'assets'));
  assert(distAssets.some(f => f.endsWith('.js')), 'Production JS bundle generated');
  assert(distAssets.some(f => f.endsWith('.css')), 'Production CSS stylesheet generated');

  // 6. Live Server Health Check
  console.log('\n--- 6. Backend API Health Check ---');
  await new Promise((resolve) => {
    http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          assert(res.statusCode === 200, 'Server responds with status 200');
          assert(json.status === 'ok', 'Server health status is ok');
          assert(json.store && json.store.includes('Blast Crackers'), 'Server store identity verified');
        } catch (e) {
          assert(false, 'Failed to parse health response');
        }
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `Health check network error: ${err.message}`);
      resolve();
    });
  });

  console.log('\n==========================================');
  console.log(`Responsive Readiness Results: ${passed} Passed, ${failed} Failed`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runResponsiveTestSuite();
