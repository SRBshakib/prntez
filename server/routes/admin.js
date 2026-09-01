const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Admin Platform Analytics & Comprehensive Charts
router.get('/stats', async (req, res) => {
    try {
        const totalJobsRes = await query('SELECT COUNT(*) as total FROM print_jobs');
        const doneJobsRes = await query("SELECT COUNT(*) as done, SUM(COALESCE(total_price, 0)) as revenue FROM print_jobs WHERE status = 'done'");
        const totalShopsRes = await query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM shops");
        const todayJobsRes = await query("SELECT COUNT(*) as today, SUM(COALESCE(total_price, 0)) as today_revenue FROM print_jobs WHERE DATE(created_at) = CURDATE()");

        // 1. Daily 7-day trend (Revenue & Orders) for Bar/Area Charts
        const dailyTrend = await query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                DATE_FORMAT(created_at, '%a (%d %b)') as label,
                COUNT(*) as jobs_count,
                COALESCE(SUM(total_price), 0) as revenue,
                COALESCE(SUM(total_pages), 0) as pages
            FROM print_jobs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at), label
            ORDER BY DATE(created_at) ASC
        `);

        // 2. Status Breakdown
        const statusBreakdown = await query(`
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total_price), 0) as total_amount
            FROM print_jobs
            GROUP BY status
        `);

        // 3. Mode Breakdown (B&W vs Color)
        const modeBreakdown = await query(`
            SELECT 
                f.color_mode,
                COUNT(*) as files_count,
                COALESCE(SUM(f.page_count * f.copies), 0) as total_pages,
                COALESCE(SUM(f.file_price), 0) as revenue
            FROM print_files f
            GROUP BY f.color_mode
        `);

        // 4. Top Performing Shops Leaderboard
        const topShops = await query(`
            SELECT 
                s.id, s.name, s.qr_slug, s.status, s.phone,
                COUNT(j.id) as jobs_count,
                COALESCE(SUM(j.total_price), 0) as total_revenue,
                COALESCE(SUM(j.total_pages), 0) as total_pages
            FROM shops s
            LEFT JOIN print_jobs j ON s.id = j.shop_id
            GROUP BY s.id
            ORDER BY total_revenue DESC
            LIMIT 6
        `);

        // 5. Hourly Peak Activity (0-23h)
        const hourlyStats = await query(`
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as jobs_count
            FROM print_jobs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
            GROUP BY HOUR(created_at)
            ORDER BY hour ASC
        `);

        res.json({
            success: true,
            stats: {
                total_jobs: totalJobsRes[0]?.total || 0,
                done_jobs: doneJobsRes[0]?.done || 0,
                total_revenue: parseFloat(doneJobsRes[0]?.revenue || 0).toFixed(2),
                total_shops: totalShopsRes[0]?.total || 0,
                active_shops: totalShopsRes[0]?.active || 0,
                today_jobs: todayJobsRes[0]?.today || 0,
                today_revenue: parseFloat(todayJobsRes[0]?.today_revenue || 0).toFixed(2),
                dailyTrend: dailyTrend || [],
                statusBreakdown: statusBreakdown || [],
                modeBreakdown: modeBreakdown || [],
                topShops: topShops || [],
                hourlyStats: hourlyStats || []
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
            SELECT s.id, s.name, s.email, s.phone, s.address, s.qr_slug, s.status, 
                   s.price_bw, s.price_color, s.price_legal, s.price_a3,
                   s.opening_time, s.closing_time, s.is_closed,
                   s.bkash_number, s.nagad_number,
                   s.created_at,
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

// Update Shop Status (Activate / Suspend)
router.put('/shops/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' | 'suspended' | 'pending'
        if (!['active', 'suspended', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        await query('UPDATE shops SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: `Shop status updated to ${status}` });
    } catch (err) {
        console.error('Admin update shop status error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete Shop
router.delete('/shops/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM shops WHERE id = ?', [id]);
        res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (err) {
        console.error('Admin delete shop error:', err);
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
                [key, (value ?? '').toString(), (value ?? '').toString()]
            );
        }

        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
