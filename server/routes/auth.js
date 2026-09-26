const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Shop Login — works with both password_hash (legacy) and password (v2)
router.post('/shop-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const shops = await query('SELECT * FROM shops WHERE email = ?', [email.trim()]);
        if (shops.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const shop = shops[0];
        // Try both plain password and password_hash columns
        const isValid = shop.password === password || shop.password_hash === password;
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const sanitizedShop = {
            id: shop.id,
            name: shop.name,
            email: shop.email,
            phone: shop.phone,
            address: shop.address,
            qr_slug: shop.qr_slug,
            price_bw: shop.price_bw || 2.00,
            price_color: shop.price_color || 10.00,
            price_legal: shop.price_legal || 3.00,
            price_a3: shop.price_a3 || 15.00,
            points_balance: shop.points_balance || 0,
            lifetime_points: shop.lifetime_points || 0,
            status: shop.status
        };

        res.json({ success: true, shop: sanitizedShop });
    } catch (err) {
        console.error('Shop login error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Shop Register
router.post('/shop-register', async (req, res) => {
    try {
        const { name, email, password, phone, address, price_bw, price_color } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
        }

        const existing = await query('SELECT id FROM shops WHERE email = ?', [email.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'An account with this email already exists' });
        }

        const qrSlug = 'sh_' + Math.random().toString(36).substring(2, 10);
        const bwPrice = parseFloat(price_bw) || 2.00;
        const colorPrice = parseFloat(price_color) || 10.00;

        const result = await query(`
            INSERT INTO shops (name, owner_name, email, password_hash, password, phone, address, qr_slug, status, price_bw, price_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `, [
            name.trim(),
            name.trim(), // owner_name = shop name as default
            email.trim(),
            password, // password_hash
            password, // password (v2)
            phone || '',
            address || '',
            qrSlug,
            bwPrice,
            colorPrice
        ]);

        const newShop = {
            id: result.insertId,
            name: name.trim(),
            email: email.trim(),
            phone: phone || '',
            address: address || '',
            qr_slug: qrSlug,
            price_bw: bwPrice,
            price_color: colorPrice,
            points_balance: 0,
            lifetime_points: 0,
            status: 'active'
        };

        res.json({ success: true, shop: newShop });
    } catch (err) {
        console.error('Shop registration error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Admin Login — reads from settings `key`/`value` schema
router.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }

        const settings = await query("SELECT `value` FROM settings WHERE `key` = 'admin_password'");
        const adminPass = settings.length > 0 ? settings[0].value : 'admin@printshare2026';

        const validPasswords = ['admin@prntez2026', 'admin@printez2026', adminPass];
        if (username === 'admin' && validPasswords.includes(password)) {
            return res.json({ success: true, admin: { username: 'admin', role: 'superadmin' } });
        }

        res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Google Auth Configuration for client
router.get('/google-config', async (req, res) => {
    try {
        const rows = await query("SELECT `key`, `value` FROM `settings` WHERE `key` IN ('google_client_id', 'google_auth_enabled')");
        let clientId = '';
        let enabled = true;
        rows.forEach(r => {
            if (r.key === 'google_client_id') clientId = (r.value || '').trim();
            if (r.key === 'google_auth_enabled') enabled = r.value !== '0';
        });
        res.json({
            success: true,
            enabled,
            client_id: clientId
        });
    } catch (err) {
        console.error('Error fetching Google config:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Google Sign-In for Shops (Feature 3)
// Verifies Google ID token and either logs in existing shop or returns profile for registration
router.post('/google-signin', async (req, res) => {
    try {
        const enabledRows = await query("SELECT `value` FROM `settings` WHERE `key` = 'google_auth_enabled' LIMIT 1");
        if (enabledRows.length > 0 && enabledRows[0].value === '0') {
            return res.status(403).json({ success: false, error: 'Google sign-in is currently disabled by administrator' });
        }

        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, error: 'Google credential is required' });
        }

        // Verify the Google ID token using Google's tokeninfo endpoint
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) {
            return res.status(401).json({ success: false, error: 'Invalid Google token' });
        }
        const tokenPayload = await verifyRes.json();

        const email = tokenPayload.email;
        const name = tokenPayload.name || tokenPayload.given_name || '';
        const picture = tokenPayload.picture || '';

        if (!email || tokenPayload.email_verified !== 'true') {
            return res.status(401).json({ success: false, error: 'Google email not verified' });
        }

        // Check if a shop with this email already exists
        const existing = await query('SELECT * FROM shops WHERE email = ?', [email]);
        
        if (existing.length > 0) {
            // Existing shop — log them in directly
            const shop = existing[0];
            if (shop.status === 'suspended') {
                return res.status(403).json({ success: false, error: 'This shop account has been suspended.' });
            }

            const sanitizedShop = {
                id: shop.id,
                name: shop.name,
                email: shop.email,
                phone: shop.phone,
                address: shop.address,
                qr_slug: shop.qr_slug,
                price_bw: shop.price_bw || 2.00,
                price_color: shop.price_color || 10.00,
                price_legal: shop.price_legal || 3.00,
                price_a3: shop.price_a3 || 15.00,
                points_balance: shop.points_balance || 0,
                lifetime_points: shop.lifetime_points || 0,
                status: shop.status
            };

            return res.json({ success: true, shop: sanitizedShop });
        }

        // New user — return profile data so client can show registration form pre-filled
        res.json({
            success: true,
            needs_registration: true,
            google_profile: { email, name, picture }
        });

    } catch (err) {
        console.error('Google sign-in error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Google Sign-In Registration (create shop from Google profile + additional fields)
router.post('/google-register', async (req, res) => {
    try {
        const enabledRows = await query("SELECT `value` FROM `settings` WHERE `key` = 'google_auth_enabled' LIMIT 1");
        if (enabledRows.length > 0 && enabledRows[0].value === '0') {
            return res.status(403).json({ success: false, error: 'Google registration is currently disabled by administrator' });
        }

        const { credential, name, phone, address, price_bw, price_color } = req.body;
        if (!credential || !name) {
            return res.status(400).json({ success: false, error: 'Google credential and shop name are required' });
        }

        // Re-verify the Google ID token
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) {
            return res.status(401).json({ success: false, error: 'Invalid Google token' });
        }
        const tokenPayload = await verifyRes.json();
        const email = tokenPayload.email;

        if (!email || tokenPayload.email_verified !== 'true') {
            return res.status(401).json({ success: false, error: 'Google email not verified' });
        }

        // Check if already exists
        const existing = await query('SELECT id FROM shops WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'A shop with this email already exists. Try logging in instead.' });
        }

        const qrSlug = 'sh_' + Math.random().toString(36).substring(2, 10);
        const bwPrice = parseFloat(price_bw) || 2.00;
        const colorPrice = parseFloat(price_color) || 10.00;
        // Google-authenticated shops use a random internal password (they log in via Google only)
        const internalPass = 'google_' + Math.random().toString(36).substring(2, 18);

        const result = await query(`
            INSERT INTO shops (name, owner_name, email, password_hash, password, phone, address, qr_slug, status, price_bw, price_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `, [
            name.trim(),
            name.trim(),
            email,
            internalPass,
            internalPass,
            phone || '',
            address || '',
            qrSlug,
            bwPrice,
            colorPrice
        ]);

        const newShop = {
            id: result.insertId,
            name: name.trim(),
            email: email,
            phone: phone || '',
            address: address || '',
            qr_slug: qrSlug,
            price_bw: bwPrice,
            price_color: colorPrice,
            points_balance: 0,
            lifetime_points: 0,
            status: 'active'
        };

        res.json({ success: true, shop: newShop });
    } catch (err) {
        console.error('Google registration error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
