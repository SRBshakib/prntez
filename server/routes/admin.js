const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Admin Platform Analytics — uses settings `key`/`value` schema
router.get('/stats', async (req, res) => {
    try {
        const totalJobsRes = await query('SELECT COUNT(*) as total FROM print_jobs');
        const doneJobsRes = await query("SELECT COUNT(*) as done, SUM(COALESCE(total_price, 0)) as revenue FROM print_jobs WHERE status = 'done'");
        const totalShopsRes = await query("SELECT COUNT(*) as total FROM shops WHERE status = 'active'");
        const todayJobsRes = await query("SELECT COUNT(*) as today FROM print_jobs WHERE DATE(created_at) = CURDATE()");

        res.json({
            success: true,
            stats: {
                total_jobs: totalJobsRes[0]?.total || 0,
                done_jobs: doneJobsRes[0]?.done || 0,
                total_revenue: parseFloat(doneJobsRes[0]?.revenue || 0).toFixed(2),
                total_shops: totalShopsRes[0]?.total || 0,
                today_jobs: todayJobsRes[0]?.today || 0
            }
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// List All Shops
router.get('/shops', async (req, res) => {
    try {
        const shops = await query(`
            SELECT s.id, s.name, s.email, s.phone, s.qr_slug, s.status, 
                   s.price_bw, s.price_color, s.created_at,
                   COUNT(j.id) as job_count, 
                   COALESCE(SUM(j.total_price), 0) as total_revenue
            FROM shops s
            LEFT JOIN print_jobs j ON s.id = j.shop_id
            GROUP BY s.id
            ORDER BY s.id DESC
        `);
        res.json({ success: true, shops });
    } catch (err) {
        console.error('Admin shops error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Settings — uses `key`/`value` columns
router.get('/settings', async (req, res) => {
    try {
        const settings = await query("SELECT `key`, `value` FROM settings");
        const map = {};
        settings.forEach(s => { map[s.key] = s.value; });
        res.json({ success: true, settings: map });
    } catch (err) {
        console.error('Admin settings error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update Settings — uses `key`/`value` columns
router.put('/settings', async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, error: 'Settings object required' });
        }

        for (const [key, value] of Object.entries(settings)) {
            await query(
                "INSERT INTO `settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
                [key, value.toString(), value.toString()]
            );
        }

        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
