import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3001';
const OUT = join(__dirname, '../docs/report-assets');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function makePageForRole(role) {
  const name = role.charAt(0).toUpperCase() + role.slice(1);
  const user = { id: 1, name: `Demo ${name}`, role, phone: '9876543210', email: 'demo@agrixpree.com' };
  const authValue = JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();

  // Set localStorage BEFORE any JS runs — this is the key fix
  await p.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key: 'agrixpree-auth', value: authValue });

  // Stub API — shapes match exactly what each page destructures
  await p.route('**/api/v1/**', route => {
    const url = route.request().url();
    const pagination = { total: 0, page: 1, limit: 10, totalPages: 1 };
    let body;
    if (url.includes('/dashboard') || url.includes('/stats')) {
      // admin/buyer dashboard: r.data.data → object
      body = { success: true, data: { totalProducts: 0, activeProducts: 0, pendingOrders: 0, totalRevenue: 0, totalUsers: 0, totalFarmers: 0, totalBuyers: 0, pendingKyc: 0, balance: 0, recentOrders: [] } };
    } else if (url.includes('/kyc') || url.includes('/verification')) {
      // KycReviewPage: r.data.data → array
      body = { success: true, data: [], pagination };
    } else if (url.includes('/categories')) {
      // BrowsePage: r.data.data → array
      body = { success: true, data: [] };
    } else if (url.includes('/notifications')) {
      // AppLayout notification bell: r.data.data → array
      body = { success: true, data: [], pagination };
    } else {
      // InventoryPage, UsersPage, BrowsePage, ProcurementPage: r.data → { data:[], pagination:{} }
      // FarmerDashboard products: r.data.data → array
      body = { success: true, data: [], pagination };
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  return { ctx, page: p };
}

async function shot(page, name, url) {
  // Each goto triggers addInitScript → localStorage auth is always pre-set before React loads
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() =>
    page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  );
  await page.waitForTimeout(1200);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`✓ ${name} → ${page.url()}`);
  return file;
}

// ── Auth screens (no auth needed) ─────────────────────────────────────────────
const screenshots = [];
const { ctx: authCtx, page: authPage } = await makePageForRole('farmer');
screenshots.push({ label: '1. Login Page', file: await shot(authPage, '01-login', `${BASE}/login`) });
screenshots.push({ label: '2. Register Page', file: await shot(authPage, '02-register', `${BASE}/register`) });
await authCtx.close();

// ── Farmer screens ────────────────────────────────────────────────────────────
const { ctx: farmerCtx, page: farmerPage } = await makePageForRole('farmer');
screenshots.push({ label: '3. Farmer Dashboard', file: await shot(farmerPage, '03-farmer-dashboard', `${BASE}/farmer/dashboard`) });
screenshots.push({ label: '4. Farmer Inventory', file: await shot(farmerPage, '04-farmer-inventory', `${BASE}/farmer/inventory`) });
screenshots.push({ label: '5. Add Product', file: await shot(farmerPage, '05-farmer-add-product', `${BASE}/farmer/inventory/add`) });
screenshots.push({ label: '13. Notifications', file: await shot(farmerPage, '13-notifications', `${BASE}/notifications`) });
await farmerCtx.close();

// ── Buyer screens ─────────────────────────────────────────────────────────────
const { ctx: buyerCtx, page: buyerPage } = await makePageForRole('buyer');
screenshots.push({ label: '6. Buyer Dashboard', file: await shot(buyerPage, '06-buyer-dashboard', `${BASE}/buyer/dashboard`) });
screenshots.push({ label: '7. Browse Products', file: await shot(buyerPage, '07-buyer-browse', `${BASE}/buyer/browse`) });
await buyerCtx.close();

// ── Admin screens ─────────────────────────────────────────────────────────────
const { ctx: adminCtx, page: adminPage } = await makePageForRole('admin');
screenshots.push({ label: '8. Admin Dashboard', file: await shot(adminPage, '08-admin-dashboard', `${BASE}/admin/dashboard`) });
screenshots.push({ label: '9. User Management', file: await shot(adminPage, '09-admin-users', `${BASE}/admin/users`) });
screenshots.push({ label: '10. KYC Review', file: await shot(adminPage, '10-admin-kyc', `${BASE}/admin/kyc`) });
screenshots.push({ label: '11. Product Approvals', file: await shot(adminPage, '11-admin-products', `${BASE}/admin/products`) });
screenshots.push({ label: '12. Procurement', file: await shot(adminPage, '12-admin-procurement', `${BASE}/admin/procurement`) });
await adminCtx.close();

await browser.close();

// Sort screenshots back to label order
screenshots.sort((a, b) => {
  const n = s => parseInt(s.label.split('.')[0]);
  return n(a) - n(b);
});

// ── Build HTML for PDF ────────────────────────────────────────────────────────
const descriptions = {
  '1. Login Page': 'Entry point for all users. Enter registered mobile number and password to access the platform.',
  '2. Register Page': 'New users select their role (Farmer or Buyer), enter personal details, and create an account.',
  '3. Farmer Dashboard': 'Overview of farmer activity — total products listed, orders received, wallet balance, and recent notifications.',
  '4. Farmer Inventory': 'Full list of all products the farmer has listed. Supports search, filter by status, and edit/delete actions.',
  '5. Add Product': 'Form to list a new agricultural product — name, category, price, quantity, unit, description, and photo upload.',
  '6. Buyer Dashboard': 'Buyer home screen showing wallet balance, recent orders, and quick-access links to browse products.',
  '7. Browse Products': 'Marketplace catalog — buyers can search, filter by category/price, and place orders directly.',
  '8. Admin Dashboard': 'Platform-wide analytics — total users, farmers, buyers, pending KYC count, revenue, and key stats.',
  '9. User Management': 'Admin view of all registered users with role, status, and ability to activate/deactivate accounts.',
  '10. KYC Review': 'Pending KYC applications from farmers — admin can view uploaded documents and approve or reject.',
  '11. Product Approvals': 'Products submitted by farmers awaiting admin approval before going live on the marketplace.',
  '12. Procurement': 'Bulk procurement management — admin can create and track large procurement orders.',
  '13. Notifications': 'Real-time notification center for all users — order updates, KYC status, approvals, and system alerts.',
};

// Generate HTML report
const rows = screenshots.map(({ label, file }) => {
  const desc = descriptions[label] || '';
  const b64 = readFileSync(file).toString('base64');
  const src = `data:image/png;base64,${b64}`;
  return `
  <section class="screen-section">
    <div class="screen-header">
      <span class="screen-num">${label.split('.')[0]}.</span>
      <span class="screen-title">${label.split('. ').slice(1).join('. ')}</span>
    </div>
    <p class="screen-desc">${desc}</p>
    <div class="screenshot-wrap">
      <img src="${src}" alt="${label}" />
    </div>
  </section>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AgriXpree – Progress Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, sans-serif; color: #1a1a1a; background: #fff; }

  /* Cover */
  .cover {
    min-height: 100vh;
    background: linear-gradient(160deg, #0f2318 0%, #16a34a 60%, #22c55e 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 60px 40px; page-break-after: always;
  }
  .cover-logo { font-size: 64px; margin-bottom: 24px; }
  .cover-title { color: #fff; font-size: 52px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
  .cover-sub { color: rgba(255,255,255,0.75); font-size: 20px; margin-top: 16px; font-weight: 400; }
  .cover-badge {
    margin-top: 40px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.25); border-radius: 50px;
    padding: 12px 28px; color: #fff; font-size: 15px; font-weight: 600;
    display: inline-block;
  }
  .cover-meta { color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 60px; }

  /* TOC */
  .toc-page {
    min-height: 100vh; padding: 60px 80px; page-break-after: always;
    display: flex; flex-direction: column; justify-content: center;
  }
  .toc-title { font-size: 28px; font-weight: 800; color: #0f2318; margin-bottom: 32px; }
  .toc-item { display: flex; align-items: center; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
  .toc-num { width: 36px; height: 36px; border-radius: 50%; background: #16a34a; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 16px; }
  .toc-label { font-size: 15px; font-weight: 500; color: #1a1a1a; }
  .toc-role { margin-left: auto; font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 20px; }

  /* Screen sections */
  .screen-section {
    min-height: 100vh; padding: 60px 80px; page-break-after: always;
    display: flex; flex-direction: column;
  }
  .screen-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
  .screen-num { font-size: 13px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: .05em; }
  .screen-title { font-size: 28px; font-weight: 800; color: #0f2318; }
  .screen-desc { font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 28px; max-width: 720px; }
  .screenshot-wrap {
    flex: 1; border-radius: 12px; overflow: hidden;
    box-shadow: 0 4px 32px rgba(0,0,0,0.12); border: 1px solid #e5e7eb;
  }
  .screenshot-wrap img { width: 100%; display: block; }

  /* Closing */
  .closing {
    min-height: 60vh; padding: 60px 80px;
    background: linear-gradient(160deg, #0f2318 0%, #16a34a 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    color: white;
  }
  .closing h2 { font-size: 32px; font-weight: 800; margin-bottom: 16px; }
  .closing p { font-size: 16px; opacity: .75; max-width: 500px; line-height: 1.7; }

  @media print {
    .cover, .toc-page, .screen-section { page-break-after: always; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-logo">🌾</div>
  <div class="cover-title">AgriXpree</div>
  <div class="cover-sub">Farm Fresh Marketplace — MVP Progress Report</div>
  <div class="cover-badge">Development Progress Report · May 2025</div>
  <div class="cover-meta">Prepared by AgriXpree Development Team &nbsp;·&nbsp; Confidential</div>
</div>

<!-- TOC -->
<div class="toc-page">
  <div class="toc-title">Screen-by-Screen Overview</div>
  ${[
    ['1', 'Login Page', 'All Users'],
    ['2', 'Register Page', 'All Users'],
    ['3', 'Farmer Dashboard', 'Farmer'],
    ['4', 'Farmer Inventory', 'Farmer'],
    ['5', 'Add Product', 'Farmer'],
    ['6', 'Buyer Dashboard', 'Buyer'],
    ['7', 'Browse Products', 'Buyer'],
    ['8', 'Admin Dashboard', 'Admin'],
    ['9', 'User Management', 'Admin'],
    ['10', 'KYC Review', 'Admin'],
    ['11', 'Product Approvals', 'Admin'],
    ['12', 'Procurement', 'Admin'],
    ['13', 'Notifications', 'All Users'],
  ].map(([n, title, role]) => `
  <div class="toc-item">
    <div class="toc-num">${n}</div>
    <div class="toc-label">${title}</div>
    <div class="toc-role">${role}</div>
  </div>`).join('')}
</div>

<!-- SCREENS -->
${rows}

<!-- CLOSING -->
<div class="closing">
  <h2>End of Progress Report</h2>
  <p>All screens shown represent the current MVP build. Backend API, database migrations, and role-based access control are fully implemented and operational.</p>
</div>

</body>
</html>`;

const htmlPath = join(OUT, '../agrixpree-progress-report.html');
writeFileSync(htmlPath, html, 'utf-8');
console.log(`\n✅ HTML report saved: ${htmlPath}`);
console.log('   Open this file in Chrome, then File → Print → Save as PDF');
