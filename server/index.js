const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { getPrinters, getSpoolLog, clearSpoolLog, refreshPrinters, isSimulateMode } = require('./spooler');

const app = express();
const server = http.createServer(app);

// Socket.io for Real-Time (< 10ms) Updates
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
});

// Attach io to app so route handlers can broadcast events
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving (protected by serve endpoint or direct)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Public Announcements & Brand Collab Ads (for customer, track, & shop headers)
app.get('/api/announcements', async (req, res) => {
    try {
        const { query } = require('./db');
        const rows = await query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'ad_%' OR `key` LIKE 'adsense_%' OR `key` LIKE 'brand_%'");
        const ads = {};
        rows.forEach(r => { ads[r.key] = r.value; });
        res.json({
            success: true,
            customerAd: {
                enabled: ads.ad_customer_enabled === '1' || ads.ad_customer_enabled === 'true',
                badge: ads.ad_customer_badge || '🔥 PROMO',
                text: ads.ad_customer_text || '',
                link: ads.ad_customer_link || ''
            },
            shopAd: {
                enabled: ads.ad_shop_enabled === '1' || ads.ad_shop_enabled === 'true',
                badge: ads.ad_shop_badge || '📢 PARTNER',
                text: ads.ad_shop_text || '',
                link: ads.ad_shop_link || ''
            },
            brandSponsor: {
                enabled: ads.brand_sponsor_enabled === '1' || ads.brand_sponsor_enabled === 'true',
                brandName: ads.brand_name || 'Brand Partner',
                badge: ads.brand_badge || '⭐ SPONSOR',
                headline: ads.brand_headline || 'Special Student & Customer Discount',
                description: ads.brand_description || 'Exclusive offer for Printez users.',
                couponCode: ads.brand_coupon_code || '',
                imageUrl: ads.brand_image_url || '',
                ctaText: ads.brand_cta_text || 'Claim Offer →',
                targetUrl: ads.brand_target_url || '',
                totalClicks: parseInt(ads.brand_sponsor_clicks || '0', 10)
            },
            adsense: {
                enabled: ads.adsense_enabled === '1' || ads.adsense_enabled === 'true',
                clientId: ads.adsense_client_id || '',
                slotCustomerBottom: ads.adsense_slot_customer_bottom || '',
                slotCustomerUploading: ads.adsense_slot_customer_uploading || '',
                slotTrack: ads.adsense_slot_track || '',
                slotShopTop: ads.adsense_slot_shop_top || '',
                slotShopSide: ads.adsense_slot_shop_side || '',
                slotShopBottom: ads.adsense_slot_shop_bottom || ''
            }
        });
    } catch (err) {
        res.json({ success: false, customerAd: { enabled: false }, shopAd: { enabled: false }, brandSponsor: { enabled: false }, adsense: { enabled: false } });
    }
});

// Brand Collab Sponsor Click Tracker (Proof of performance for brand sponsors)
app.post('/api/announcements/click', async (req, res) => {
    try {
        const { query } = require('./db');
        await query("INSERT INTO settings (`key`, `value`) VALUES ('brand_sponsor_clicks', '1') ON DUPLICATE KEY UPDATE `value` = CAST(`value` AS UNSIGNED) + 1");
        res.json({ success: true });
    } catch (_) {
        res.json({ success: false });
    }
});

// Printers API — lists installed printers and simulate mode status
app.get('/api/printers', (req, res) => {
    res.json({ success: true, ...getPrinters() });
});

// Refresh printer list on demand
app.post('/api/printers/refresh', (req, res) => {
    refreshPrinters((printers, def) => {
        res.json({ success: true, printers, defaultPrinter: def, simulating: isSimulateMode() });
    });
});

// Spool Log — see all print jobs sent to spooler (real + simulated)
app.get('/api/spool-log', (req, res) => {
    res.json({ success: true, log: getSpoolLog() });
});

// Clear Spool Log
app.delete('/api/spool-log', (req, res) => {
    const cleared = clearSpoolLog();
    res.json({ success: cleared });
});

// Socket.io Connection & Room Management
io.on('connection', (socket) => {
    // Shop joins its dedicated real-time room
    socket.on('join_shop', (shopId) => {
        if (shopId) {
            socket.join(`shop_${shopId}`);
            console.log(`[Socket] Shop #${shopId} joined room shop_${shopId}`);
        }
    });

    // Customer joins order tracking room
    socket.on('join_job', (jobCode) => {
        if (jobCode) {
            socket.join(`job_${jobCode}`);
            console.log(`[Socket] Customer joined tracking room job_${jobCode}`);
        }
    });

    socket.on('disconnect', () => {
        // cleaned automatically
    });
});

// Serve Frontend Production Build (SPA Fallback)
const fs = require('fs');
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled rejection:', reason);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================================');
    console.log('            PRINTEZ 2.0 REAL-TIME SERVER RUNNING               ');
    console.log('===============================================================');
    console.log(`[✓] REST API & WebSocket Server: http://localhost:${PORT}`);
    console.log(`[✓] Real-Time Engine           : Socket.io Active (< 10ms)`);
    console.log(`[✓] High-Speed DB Pool         : MySQL prntez`);
    if (fs.existsSync(clientDistPath)) {
        console.log(`[✓] Unified Frontend Client    : Serving client/dist on port ${PORT}`);
    }
    console.log('===============================================================');
});
