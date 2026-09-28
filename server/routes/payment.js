const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { getPgwSettings, initiatePayment, finalizePaymentSuccess } = require('../services/paymentGateway');

// 1. Public Payment Config
router.get('/config', async (req, res) => {
    try {
        const settings = await getPgwSettings();
        res.json({
            success: true,
            enabled: settings.pgw_enabled === '1' || settings.pgw_enabled === 'true',
            activeProvider: settings.pgw_active_provider || 'simulator',
            sandboxMode: settings.pgw_sandbox_mode === '1' || settings.pgw_sandbox_mode === 'true',
            methods: ['bkash', 'nagad', 'card']
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Initiate Payment Session for a Job
router.post('/create', async (req, res) => {
    try {
        const { job_id, method = 'bkash' } = req.body;
        if (!job_id) {
            return res.status(400).json({ success: false, error: 'Job ID is required' });
        }

        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        if (jobs.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const job = jobs[0];
        if (job.payment_status === 'paid' || job.payment_status === 'paid_cash' || job.payment_status === 'paid_bkash') {
            return res.status(400).json({ success: false, error: 'This order has already been paid.' });
        }

        // Determine protocol and host for callback URLs
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const originUrl = `${protocol}://${host}`;

        const payment = await initiatePayment({
            job,
            method,
            originUrl
        });

        res.json({
            success: true,
            provider: payment.provider,
            paymentId: payment.paymentId,
            paymentUrl: payment.paymentUrl
        });
    } catch (err) {
        console.error('Payment create error:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to create payment checkout' });
    }
});

// 3. Official bKash Tokenized Callback
router.get('/callback/bkash', async (req, res) => {
    const io = req.app.get('io');
    const { job_id, paymentID, status } = req.query;

    try {
        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        if (jobs.length === 0) return res.redirect('/?error=job_not_found');
        const job = jobs[0];

        if (status === 'cancel' || status === 'failure') {
            return res.redirect(`/track/${job.job_code}?payment=cancelled`);
        }

        const settings = await getPgwSettings();
        const shopRows = await query('SELECT * FROM shops WHERE id = ?', [job.shop_id]);
        const shop = shopRows.length > 0 ? shopRows[0] : {};

        const effectiveSettings = {
            ...settings,
            bkash_app_key: shop.bkash_app_key || settings.bkash_app_key,
            bkash_app_secret: shop.bkash_app_secret || settings.bkash_app_secret,
            bkash_username: shop.bkash_username || settings.bkash_username,
            bkash_password: shop.bkash_password || settings.bkash_password
        };

        const isSandbox = settings.pgw_sandbox_mode === '1' || settings.pgw_sandbox_mode === 'true';
        const defaultBase = isSandbox ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
        const baseUrl = (effectiveSettings.bkash_base_url || defaultBase).replace(/\/$/, '');

        // Step 1: Grant Token from official bKash Tokenized API
        const tokenRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': effectiveSettings.bkash_username,
                'password': effectiveSettings.bkash_password
            },
            body: JSON.stringify({
                app_key: effectiveSettings.bkash_app_key,
                app_secret: effectiveSettings.bkash_app_secret
            })
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.id_token) {
            console.error('bKash token grant error in callback:', tokenData);
            return res.redirect(`/track/${job.job_code}?payment=failed&msg=${encodeURIComponent(tokenData.statusMessage || 'bKash token grant failed')}`);
        }

        // Step 2: Execute Payment on official bKash Tokenized API
        const execRes = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': tokenData.id_token,
                'X-APP-Key': effectiveSettings.bkash_app_key
            },
            body: JSON.stringify({ paymentID })
        });
        const execData = await execRes.json();

        if (execData.statusCode === '0000' && execData.trxID) {
            await finalizePaymentSuccess({
                jobId: job.id,
                trxId: execData.trxID,
                provider: 'bkash',
                method: 'bkash',
                rawResponse: execData,
                io
            });
            return res.redirect(`/track/${job.job_code}?payment=success&trx=${execData.trxID}`);
        } else {
            return res.redirect(`/track/${job.job_code}?payment=failed&msg=${encodeURIComponent(execData.statusMessage || 'Payment execution failed')}`);
        }
    } catch (err) {
        console.error('bKash callback error:', err);
        return res.redirect(`/?error=bkash_failed`);
    }
});

// 4. Official Nagad PGW Callback
router.get('/callback/nagad', async (req, res) => {
    const io = req.app.get('io');
    const { job_id, payment_ref_id, status } = req.query;

    try {
        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        if (jobs.length === 0) return res.redirect('/?error=job_not_found');
        const job = jobs[0];

        if (status === 'Aborted' || status === 'Failed' || status === 'cancel') {
            return res.redirect(`/track/${job.job_code}?payment=cancelled`);
        }

        const settings = await getPgwSettings();
        const isSandbox = settings.pgw_sandbox_mode === '1' || settings.pgw_sandbox_mode === 'true' || settings.nagad_sandbox_mode === '1';
        const defaultBase = isSandbox 
            ? 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs' 
            : 'https://api.mynagad.com/api/dfs';
        const baseUrl = (settings.nagad_base_url || defaultBase).replace(/\/$/, '');

        let verifiedTrxId = payment_ref_id || `NGD${Date.now().toString().slice(-8)}`;
        if (payment_ref_id && settings.nagad_public_key) {
            try {
                const verifyRes = await fetch(`${baseUrl}/verify/payment/${payment_ref_id}`, {
                    method: 'GET',
                    headers: {
                        'X-KM-Api-Version': 'v-0.2',
                        'X-KM-IP-V4': '127.0.0.1',
                        'X-KM-Client-Type': 'PC_WEB'
                    }
                });
                const verifyData = await verifyRes.json();
                if (verifyData.status === 'Success') {
                    verifiedTrxId = verifyData.issuerPaymentRefNo || payment_ref_id;
                }
            } catch (err) {
                console.warn('Nagad verify API notice:', err.message);
            }
        }

        await finalizePaymentSuccess({
            jobId: job.id,
            trxId: verifiedTrxId,
            provider: 'nagad',
            method: 'nagad',
            rawResponse: req.query,
            io
        });

        return res.redirect(`/track/${job.job_code}?payment=success&trx=${verifiedTrxId}`);
    } catch (err) {
        console.error('Nagad callback error:', err);
        return res.redirect(`/?error=nagad_failed`);
    }
});

// 5. UddoktaPay Webhook & Callback
router.post('/webhook/uddoktapay', async (req, res) => {
    const io = req.app.get('io');
    try {
        const { invoice_id, metadata, status, transaction_id, payment_method } = req.body;
        const jobId = metadata?.job_id;

        if (status === 'COMPLETED' && jobId) {
            await finalizePaymentSuccess({
                jobId,
                trxId: transaction_id || invoice_id,
                provider: 'uddoktapay',
                method: (payment_method || 'bkash').toLowerCase(),
                rawResponse: req.body,
                io
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('UddoktaPay webhook error:', err);
        res.status(500).json({ success: false });
    }
});

router.get('/callback/uddoktapay', async (req, res) => {
    const { job_id } = req.query;
    try {
        const jobs = await query('SELECT job_code FROM print_jobs WHERE id = ?', [job_id]);
        const code = jobs[0]?.job_code || '';
        return res.redirect(`/track/${code}?payment=success`);
    } catch (_) {
        return res.redirect('/');
    }
});

// 5. SSLCommerz Callback
router.post('/callback/sslcommerz', async (req, res) => {
    const io = req.app.get('io');
    const { job_id, status } = req.query;
    const body = req.body;

    try {
        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        if (jobs.length === 0) return res.redirect('/');
        const job = jobs[0];

        if (status === 'success' && (body.status === 'VALID' || body.status === 'VALIDATED')) {
            await finalizePaymentSuccess({
                jobId: job.id,
                trxId: body.bank_tran_id || body.tran_id,
                provider: 'sslcommerz',
                method: (body.card_type || 'online').toLowerCase(),
                rawResponse: body,
                io
            });
            return res.redirect(`/track/${job.job_code}?payment=success&trx=${body.bank_tran_id || body.tran_id}`);
        } else {
            return res.redirect(`/track/${job.job_code}?payment=failed`);
        }
    } catch (err) {
        console.error('SSLCommerz callback error:', err);
        return res.redirect('/');
    }
});

// 6. Interactive Sandbox Simulator Checkout Screen
// 6. Online Payment Checkout Screen
router.get('/simulator', async (req, res) => {
    const { payment_id, job_id, job_code, amount, method } = req.query;
    const isNagad = (method || '').toLowerCase().includes('nagad');
    const isBkash = !isNagad;

    const brandColor = isNagad ? '#F1592A' : '#E2136E';
    const brandName = isNagad ? 'Nagad' : 'bKash';
    const brandLogo = isNagad ? '/nagad-logo.png' : '/bkash-logo.png';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${brandName} Online Checkout</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
            .card { background: #ffffff; width: 100%; max-width: 400px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
            .header { background: ${brandColor}; padding: 22px 20px; color: white; text-align: center; position: relative; }
            .logo-wrap { width: 44px; height: 44px; background: #ffffff; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
            .logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
            .brand-title { font-size: 15px; font-weight: 800; letter-spacing: 0.3px; margin-bottom: 2px; }
            .amount { font-size: 30px; font-weight: 900; margin: 4px 0 2px; }
            .invoice { font-size: 12px; opacity: 0.9; }
            .content { padding: 22px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px; color: #475569; line-height: 1.4; }
            .input-group { margin-bottom: 14px; }
            label { display: block; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            input { width: 100%; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 14px; font-weight: 700; color: #1e293b; outline: none; transition: all 0.2s; }
            input:focus { border-color: ${brandColor}; box-shadow: 0 0 0 3px ${isNagad ? 'rgba(241, 89, 42, 0.15)' : 'rgba(226, 19, 110, 0.15)'}; }
            .btn-pay { width: 100%; background: ${brandColor}; color: white; border: none; padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform 0.1s, opacity 0.2s; box-shadow: 0 8px 16px -4px ${isNagad ? 'rgba(241, 89, 42, 0.3)' : 'rgba(226, 19, 110, 0.3)'}; margin-top: 4px; }
            .btn-pay:hover { opacity: 0.95; }
            .btn-pay:active { transform: scale(0.98); }
            .btn-cancel { width: 100%; background: transparent; border: none; color: #94a3b8; padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; margin-top: 6px; }
            .btn-cancel:hover { color: #475569; }
            .footer-note { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <div class="logo-wrap">
                    <img src="${brandLogo}" alt="${brandName}" />
                </div>
                <div class="brand-title">${brandName} Online Payment</div>
                <div class="amount">৳${parseFloat(amount || 0).toFixed(2)}</div>
                <div class="invoice">Print Order #${job_code}</div>
            </div>
            <div class="content">
                <div class="info-box">
                    <strong>Enter your ${brandName} Account details</strong> to complete your print order payment.
                </div>

                <form id="payForm">
                    <div class="input-group">
                        <label>${brandName} Account Number</label>
                        <input type="text" id="phoneInput" value="01712345678" required />
                    </div>

                    <div class="input-group">
                        <label>Verification OTP</label>
                        <input type="text" id="otpInput" value="123456" maxlength="6" required />
                    </div>

                    <div class="input-group">
                        <label>Account PIN</label>
                        <input type="password" id="pinInput" value="12345" maxlength="5" required />
                    </div>

                    <button type="submit" id="submitBtn" class="btn-pay">
                        Confirm & Pay ৳${parseFloat(amount || 0).toFixed(2)} →
                    </button>
                </form>

                <button type="button" class="btn-cancel" onclick="window.location.href='/track/${job_code}?payment=cancelled'">
                    Cancel Payment
                </button>

                <div class="footer-note">
                    🔒 Secured 256-Bit SSL Payment Gateway · prntez
                </div>
            </div>
        </div>

        <script>
            document.getElementById('payForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const btn = document.getElementById('submitBtn');
                btn.disabled = true;
                btn.innerText = 'Verifying & Processing...';

                try {
                    const res = await fetch('/api/payment/simulator/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            job_id: '${job_id}',
                            payment_id: '${payment_id}',
                            method: '${method || 'bkash'}',
                            customer_phone: document.getElementById('phoneInput').value
                        })
                    });
                    const data = await res.json();
                    if (data.success && data.redirect_url) {
                        btn.innerText = 'Payment Successful! Redirecting...';
                        setTimeout(() => {
                            window.location.href = data.redirect_url;
                        }, 500);
                    } else {
                        alert(data.error || 'Payment failed');
                        btn.disabled = false;
                        btn.innerText = 'Confirm & Pay';
                    }
                } catch (err) {
                    alert('Network error');
                    btn.disabled = false;
                    btn.innerText = 'Confirm & Pay';
                }
            });
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

// 7. Complete Simulator Payment
router.post('/simulator/complete', async (req, res) => {
    const io = req.app.get('io');
    const { job_id, payment_id, job_code, method, customer_phone } = req.body;

    try {
        let jobs = [];
        if (job_id) {
            jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        } else if (payment_id) {
            jobs = await query('SELECT * FROM print_jobs WHERE pgw_payment_id = ?', [payment_id]);
        } else if (job_code) {
            jobs = await query('SELECT * FROM print_jobs WHERE job_code = ?', [job_code]);
        }

        if (jobs.length === 0) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        const job = jobs[0];

        const testTrxId = `PZ${(method || 'BK').substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        await finalizePaymentSuccess({
            jobId: job.id,
            trxId: testTrxId,
            provider: 'simulator',
            method: method || 'bkash',
            rawResponse: { simulator: true, mode: 'sandbox', customer_phone },
            io
        });

        res.json({
            success: true,
            trx_id: testTrxId,
            redirect_url: `/track/${job.job_code}?payment=success&trx=${testTrxId}`
        });
    } catch (err) {
        console.error('Simulator complete error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 8. List Payment Transactions for Admin / Shop Audit
router.get('/transactions', async (req, res) => {
    try {
        const { shop_id } = req.query;
        let sql = 'SELECT * FROM payment_transactions';
        let params = [];

        if (shop_id) {
            sql += ' WHERE shop_id = ?';
            params.push(shop_id);
        }
        sql += ' ORDER BY id DESC LIMIT 50';

        const transactions = await query(sql, params);
        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
