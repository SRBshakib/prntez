// End-to-End Test Suite for Printez Platform
const BASE = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('       PRINTEZ 2.0 AUTOMATED END-TO-END AUDIT       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health & Server Info
  await test('Server Health Check (GET /api/health)', async () => {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
  });

  // 2. Public Shops List
  let testShop = null;
  await test('Public Shops Directory (GET /api/shops/public)', async () => {
    const res = await fetch(`${BASE}/api/shops/public`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.shops) || data.shops.length === 0) {
      throw new Error('No shops returned or success is false');
    }
    testShop = data.shops[0];
  });

  // 3. Shop by QR Slug
  await test(`Lookup Shop by QR Slug (GET /api/shops/by-slug/${testShop?.qr_slug})`, async () => {
    const res = await fetch(`${BASE}/api/shops/by-slug/${testShop.qr_slug}`);
    const data = await res.json();
    if (!data.success || data.shop.id !== testShop.id) {
      throw new Error('Could not fetch shop by slug');
    }
  });

  // 4. Shop Analytics
  await test(`Shop 24h & 7D Analytics (GET /api/shops/${testShop?.id}/analytics)`, async () => {
    const res = await fetch(`${BASE}/api/shops/${testShop.id}/analytics`);
    const data = await res.json();
    if (!data.success || !data.analytics) {
      throw new Error('Shop analytics failed');
    }
    if (data.analytics.overall?.total_jobs === undefined) {
      throw new Error('Missing analytics.overall');
    }
  });

  // 5. Update Shop Profile & Rates
  await test(`Update Shop Profile & Pricing (PUT /api/shops/${testShop?.id})`, async () => {
    const res = await fetch(`${BASE}/api/shops/${testShop.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagline: 'Fastest Laser Printing in Town',
        price_bw: 2.00,
        price_color: 10.00,
        bkash_number: '01711223344',
        nagad_number: '01811223344',
        discount_min_pages: 50,
        discount_percent: 10
      })
    });
    const data = await res.json();
    if (!data.success || !data.shop) throw new Error(data.error || 'Update failed');
  });

  // 6. Job Upload Simulation (Multipart Form-Data)
  let createdJob = null;
  await test('Customer Print Job Upload (POST /api/upload)', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakePdfContent = '%PDF-1.4 1 0 obj << /Title (TestDoc.pdf) >> endobj trailer << >> %%EOF';

    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="shop_id"',
      '',
      testShop.id.toString(),
      `--${boundary}`,
      'Content-Disposition: form-data; name="customer_name"',
      '',
      'E2E Tester',
      `--${boundary}`,
      'Content-Disposition: form-data; name="customer_phone"',
      '',
      '01700000000',
      `--${boundary}`,
      'Content-Disposition: form-data; name="payment_method"',
      '',
      'bkash',
      `--${boundary}`,
      'Content-Disposition: form-data; name="payment_trx_id"',
      '',
      'TRX_E2E_TEST_999',
      `--${boundary}`,
      'Content-Disposition: form-data; name="configs"',
      '',
      JSON.stringify([{
        color_mode: 'bw',
        copies: 2,
        paper_size: 'a4',
        page_range: '1-5',
        sides: 'double',
        binding: 'none',
        gsm: '70',
        page_count: 5
      }]),
      `--${boundary}`,
      'Content-Disposition: form-data; name="files"; filename="Lecture_Notes.pdf"',
      'Content-Type: application/pdf',
      '',
      fakePdfContent,
      `--${boundary}--`
    ];

    const bodyBuffer = Buffer.from(bodyParts.join('\r\n'), 'utf-8');

    const res = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length.toString()
      },
      body: bodyBuffer
    });

    const data = await res.json();
    if (!data.success || !data.job_code) {
      throw new Error(data.error || 'Job creation failed');
    }
    createdJob = data;
  });

  // 7. Track Created Job Code
  await test(`Customer Order Tracking (GET /api/jobs/track/${createdJob?.job_code})`, async () => {
    const res = await fetch(`${BASE}/api/jobs/track/${createdJob.job_code}`);
    const data = await res.json();
    if (!data.success || !data.job || data.job.job_code !== createdJob.job_code) {
      throw new Error('Tracking job lookup failed');
    }
    if (data.job.payment_trx_id !== 'TRX_E2E_TEST_999') {
      throw new Error('Payment TrxID not persisted');
    }
  });

  // 8. Shop Payment Status Update
  await test(`Shop 1-Click Payment Confirmation (POST /api/jobs/payment-status)`, async () => {
    const res = await fetch(`${BASE}/api/jobs/payment-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: createdJob.job_id,
        payment_status: 'paid',
        payment_method: 'bkash'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error('Payment status update failed');
  });

  // 9. Hardware Printers & Virtual Spooling
  await test('Printer Hardware & Spooler Test (GET /api/printers & POST /api/jobs/spool)', async () => {
    const pRes = await fetch(`${BASE}/api/printers`);
    const pData = await pRes.json();
    if (!pData.success) throw new Error('Failed to list printers');

    // Get file id of created job
    const jobRes = await fetch(`${BASE}/api/jobs?shop_id=${testShop.id}&status=all`);
    const jobData = await jobRes.json();
    const targetJob = jobData.data.find(j => j.id === createdJob.job_id);
    if (!targetJob || !targetJob.files || targetJob.files.length === 0) {
      throw new Error('Could not find uploaded files for spooling');
    }

    const fileId = targetJob.files[0].id;

    // Spool file
    const sRes = await fetch(`${BASE}/api/jobs/spool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId,
        printer: null, // null triggers simulate/default
        copies: 1,
        color: 'bw',
        sides: 'single'
      })
    });
    const sData = await sRes.json();
    if (!sData.success) throw new Error('Spooling simulation failed');
  });

  // 10. Dual Monetization Engine (AdSense & Sponsor Telemetry)
  await test('Dual Monetization Engine (GET /api/announcements & POST /api/announcements/click)', async () => {
    const aRes = await fetch(`${BASE}/api/announcements`);
    const aData = await aRes.json();
    if (!aData.success || !aData.brandSponsor) {
      throw new Error('Brand sponsor config missing in announcements');
    }

    // Telemetry click
    const cRes = await fetch(`${BASE}/api/announcements/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: aData.brandSponsor.id || 'brand_1' })
    });
    const cData = await cRes.json();
    if (!cData.success) {
      throw new Error('Click telemetry failed');
    }
  });

  // 11. Admin Global Analytics & Charts
  await test('Admin Global Platform Analytics (GET /api/admin/stats)', async () => {
    const res = await fetch(`${BASE}/api/admin/stats`);
    const data = await res.json();
    if (!data.success || !data.stats) throw new Error('Admin stats failed');
    if (!Array.isArray(data.stats.dailyTrend) || !Array.isArray(data.stats.topShops)) {
      throw new Error('Missing daily trend or top shops trend charts');
    }
  });

  // 12. Admin Shop Management
  await test('Admin Shop Governance & Statuses (GET /api/admin/shops)', async () => {
    const res = await fetch(`${BASE}/api/admin/shops`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.shops)) {
      throw new Error('Admin shops list failed');
    }
  });

  console.log('\n====================================================');
  console.log(`  RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
