const { query } = require('../db');

/**
 * Multi-Gateway Payment Gateway Service
 * Supports Direct bKash PGW, UddoktaPay, SSLCommerz, and Interactive Sandbox Simulator
 */

// Helper to get active PGW settings
async function getPgwSettings() {
    const rows = await query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'pgw_%' OR `key` LIKE 'bkash_%' OR `key` LIKE 'uddoktapay_%' OR `key` LIKE 'sslcommerz_%'");
    const settings = {
        pgw_enabled: '1',
        pgw_active_provider: 'simulator',
        pgw_sandbox_mode: '1',
        bkash_app_key: '',
        bkash_app_secret: '',
        bkash_username: '',
        bkash_password: '',
        bkash_base_url: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
        uddoktapay_api_key: '',
        uddoktapay_base_url: 'https://sandbox.uddoktapay.com/api/checkout-v2',
        sslcommerz_store_id: '',
        sslcommerz_store_passwd: '',
        sslcommerz_sandbox_mode: '1'
    };
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
}

// 1. Direct Official bKash Tokenized Checkout (Checkout API v1.2.0-beta)
async function createBkashPayment({ job, amount, customerPhone, originUrl, settings }) {
    const isSandbox = settings.pgw_sandbox_mode === '1' || settings.pgw_sandbox_mode === 'true';
    const defaultBase = isSandbox ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
    const baseUrl = (settings.bkash_base_url || defaultBase).replace(/\/$/, '');
    
    // Step 1: Grant Token from official bKash API
    const tokenRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'username': settings.bkash_username,
            'password': settings.bkash_password
        },
        body: JSON.stringify({
            app_key: settings.bkash_app_key,
            app_secret: settings.bkash_app_secret
        })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) {
        throw new Error(tokenData.statusMessage || 'bKash authentication failed');
    }

    const idToken = tokenData.id_token;
    const callbackUrl = `${originUrl}/api/payment/callback/bkash?job_id=${job.id}`;

    // Step 2: Create Payment
    const createRes = await fetch(`${baseUrl}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken,
            'X-APP-Key': settings.bkash_app_key
        },
        body: JSON.stringify({
            mode: '0011',
            payerReference: customerPhone || '01700000000',
            callbackURL: callbackUrl,
            amount: parseFloat(amount).toFixed(2),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: `PZ${job.job_code}_${Date.now()}`
        })
    });
    const createData = await createRes.json();

    if (createData.statusCode === '0000' && createData.bkashURL) {
        return {
            provider: 'bkash',
            paymentId: createData.paymentID,
            paymentUrl: createData.bkashURL,
            token: idToken,
            raw: createData
        };
    } else {
        throw new Error(createData.statusMessage || 'Failed to initialize bKash checkout');
    }
}

// 2. UddoktaPay Automated PGW (bKash, Nagad, Rocket)
async function createUddoktaPayPayment({ job, amount, customerName, customerPhone, originUrl, settings }) {
    const baseUrl = (settings.uddoktapay_base_url || 'https://sandbox.uddoktapay.com/api/checkout-v2').replace(/\/$/, '');
    
    const payload = {
        full_name: customerName || 'Customer',
        email: 'customer@prntez.com',
        amount: parseFloat(amount).toFixed(2),
        metadata: {
            job_id: job.id,
            job_code: job.job_code,
            shop_id: job.shop_id
        },
        redirect_url: `${originUrl}/api/payment/callback/uddoktapay?job_id=${job.id}`,
        cancel_url: `${originUrl}/track/${job.job_code}?payment=cancelled`,
        webhook_url: `${originUrl}/api/payment/webhook/uddoktapay`
    };

    const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'RT-UDDOKTAPAY-API-KEY': settings.uddoktapay_api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.status && data.payment_url) {
        return {
            provider: 'uddoktapay',
            paymentId: data.payment_id || `UP_${Date.now()}`,
            paymentUrl: data.payment_url,
            raw: data
        };
    } else {
        throw new Error(data.message || 'Failed to initialize UddoktaPay checkout');
    }
}

// 3. SSLCommerz Gateway
async function createSSLCommerzPayment({ job, amount, customerName, customerPhone, originUrl, settings }) {
    const isSandbox = settings.sslcommerz_sandbox_mode === '1';
    const baseUrl = isSandbox 
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

    const tranId = `PZ_${job.job_code}_${Date.now()}`;
    const params = new URLSearchParams({
        store_id: settings.sslcommerz_store_id,
        store_passwd: settings.sslcommerz_store_passwd,
        total_amount: parseFloat(amount).toFixed(2),
        currency: 'BDT',
        tran_id: tranId,
        success_url: `${originUrl}/api/payment/callback/sslcommerz?job_id=${job.id}&status=success`,
        fail_url: `${originUrl}/api/payment/callback/sslcommerz?job_id=${job.id}&status=fail`,
        cancel_url: `${originUrl}/track/${job.job_code}?payment=cancelled`,
        cus_name: customerName || 'Customer',
        cus_email: 'customer@prntez.com',
        cus_phone: customerPhone || '01700000000',
        cus_add1: 'Dhaka',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: `Print Order #${job.job_code}`,
        product_category: 'Printing',
        product_profile: 'general'
    });

    const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const data = await res.json();
    if (data.status === 'SUCCESS' && data.GatewayPageURL) {
        return {
            provider: 'sslcommerz',
            paymentId: tranId,
            paymentUrl: data.GatewayPageURL,
            raw: data
        };
    } else {
        throw new Error(data.failedreason || 'Failed to initialize SSLCommerz checkout');
    }
}

// 4. Interactive Simulator Sandbox Checkout
function createSimulatorPayment({ job, amount, method, originUrl }) {
    const paymentId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const simulatorUrl = `${originUrl}/api/payment/simulator?payment_id=${paymentId}&job_id=${job.id}&job_code=${job.job_code}&amount=${parseFloat(amount).toFixed(2)}&method=${method || 'bkash'}`;
    
    return {
        provider: 'simulator',
        paymentId: paymentId,
        paymentUrl: simulatorUrl,
        raw: { simulator: true, mode: 'sandbox' }
    };
}

/**
 * Main Payment Dispatcher
 */
async function initiatePayment({ job, method = 'bkash', originUrl }) {
    const settings = await getPgwSettings();
    const amount = parseFloat(job.total_price || 0);

    if (amount <= 0) {
        throw new Error('Order amount must be greater than zero');
    }

    // Load the specific shop that owns this print order
    const shopRows = await query('SELECT * FROM shops WHERE id = ?', [job.shop_id]);
    const shop = shopRows.length > 0 ? shopRows[0] : {};

    // Combine platform settings with Shop's specific merchant credentials (Shop credentials take priority)
    const effectiveSettings = {
        ...settings,
        bkash_app_key: shop.bkash_app_key || settings.bkash_app_key,
        bkash_app_secret: shop.bkash_app_secret || settings.bkash_app_secret,
        bkash_username: shop.bkash_username || settings.bkash_username,
        bkash_password: shop.bkash_password || settings.bkash_password,
        uddoktapay_api_key: shop.uddoktapay_api_key || settings.uddoktapay_api_key,
        shop_name: shop.name,
        shop_bkash: shop.bkash_number,
        shop_nagad: shop.nagad_number
    };

    let activeProvider = settings.pgw_active_provider || 'simulator';

    // If shop has its own direct bKash credentials or UddoktaPay key, use it
    if (shop.bkash_app_key && shop.bkash_app_secret) {
        activeProvider = 'bkash';
    } else if (shop.uddoktapay_api_key) {
        activeProvider = 'uddoktapay';
    }

    // Fallback cleanly to Simulator if keys are missing
    if (activeProvider === 'bkash' && (!effectiveSettings.bkash_app_key || !effectiveSettings.bkash_app_secret)) {
        activeProvider = 'simulator';
    } else if (activeProvider === 'uddoktapay' && !effectiveSettings.uddoktapay_api_key) {
        activeProvider = 'simulator';
    } else if (activeProvider === 'sslcommerz' && (!effectiveSettings.sslcommerz_store_id || !effectiveSettings.sslcommerz_store_passwd)) {
        activeProvider = 'simulator';
    }

    let result = null;

    if (activeProvider === 'bkash') {
        result = await createBkashPayment({ job, amount, customerPhone: job.customer_phone, originUrl, settings: effectiveSettings });
    } else if (activeProvider === 'uddoktapay') {
        result = await createUddoktaPayPayment({ job, amount, customerName: job.customer_name, customerPhone: job.customer_phone, originUrl, settings: effectiveSettings });
    } else if (activeProvider === 'sslcommerz') {
        result = await createSSLCommerzPayment({ job, amount, customerName: job.customer_name, customerPhone: job.customer_phone, originUrl, settings: effectiveSettings });
    } else {
        result = createSimulatorPayment({ job, amount, method, originUrl, shop });
    }

    // Record transaction in payment_transactions table
    await query(`
        INSERT INTO payment_transactions 
        (job_id, job_code, shop_id, provider, payment_method, amount, payment_id, status, customer_name, customer_phone, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [
        job.id,
        job.job_code,
        job.shop_id,
        result.provider,
        method,
        amount,
        result.paymentId,
        job.customer_name || '',
        job.customer_phone || '',
        JSON.stringify(result.raw || {})
    ]);

    // Update job with payment reference
    await query(`
        UPDATE print_jobs 
        SET pgw_payment_id = ?, payment_provider = ?, payment_method = ?
        WHERE id = ?
    `, [result.paymentId, result.provider, method, job.id]);

    return result;
}

/**
 * Mark Job and Transaction as Paid & Notify Real-time Sockets
 */
async function finalizePaymentSuccess({ jobId, trxId, provider, method, rawResponse, io }) {
    const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) return null;
    const job = jobs[0];

    const finalMethod = method || (provider === 'bkash' ? 'bkash' : (provider === 'nagad' ? 'nagad' : 'online'));

    // 1. Update print_jobs table
    await query(`
        UPDATE print_jobs 
        SET payment_status = 'paid',
            payment_method = ?,
            payment_trx_id = ?,
            payment_provider = ?
        WHERE id = ?
    `, [finalMethod, trxId || `TXN${Date.now()}`, provider, jobId]);

    // 2. Update payment_transactions table
    await query(`
        UPDATE payment_transactions 
        SET status = 'completed',
            trx_id = ?,
            raw_response = ?
        WHERE job_id = ?
    `, [trxId || `TXN${Date.now()}`, JSON.stringify(rawResponse || {}), jobId]);

    // 3. Emit Real-time Socket.io events
    if (io) {
        // Notify shop room
        io.to(`shop_${job.shop_id}`).emit('job_updated', {
            id: job.id,
            payment_status: 'paid',
            payment_method: finalMethod,
            payment_trx_id: trxId
        });
        io.to(`shop_${job.shop_id}`).emit('payment_received', {
            job_id: job.id,
            job_code: job.job_code,
            amount: job.total_price,
            method: finalMethod,
            trx_id: trxId
        });

        // Notify customer tracking room
        io.to(`job_${job.job_code}`).emit('status_changed', {
            id: job.id,
            payment_status: 'paid',
            payment_method: finalMethod,
            payment_trx_id: trxId
        });
    }

    return job;
}

module.exports = {
    getPgwSettings,
    initiatePayment,
    finalizePaymentSuccess
};
