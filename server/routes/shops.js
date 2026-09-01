const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get all active public shops (for dropdown / discovery)
router.get('/public', async (req, res) => {
    try {
        const shops = await query(`
            SELECT id, name, phone, address, qr_slug,
                   COALESCE(price_bw, 2.00) as price_bw,
                   COALESCE(price_color, 10.00) as price_color,
                   COALESCE(price_legal, 3.00) as price_legal,
                   COALESCE(price_a3, 15.00) as price_a3,
                   COALESCE(counter_notice, '') as counter_notice,
                   COALESCE(opening_time, '08:00') as opening_time,
                   COALESCE(closing_time, '22:00') as closing_time,
                   COALESCE(is_closed, 0) as is_closed,
                   COALESCE(bkash_number, '') as bkash_number,
                   COALESCE(nagad_number, '') as nagad_number,
                   COALESCE(discount_min_pages, 50) as discount_min_pages,
                   COALESCE(discount_percent, 10.00) as discount_percent,
                   COALESCE(discount_tier2_pages, 100) as discount_tier2_pages,
                   COALESCE(discount_tier2_percent, 15.00) as discount_tier2_percent
            FROM shops WHERE status = 'active'
            ORDER BY id ASC LIMIT 50
        `);
        res.json({ success: true, shops });
    } catch (err) {
        console.error('Fetch public shops error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get shop by QR Slug
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const shops = await query(`
            SELECT id, name, email, phone, address, qr_slug, 
                   COALESCE(price_bw, 2.00) as price_bw,
                   COALESCE(price_color, 10.00) as price_color,
                   COALESCE(price_legal, 3.00) as price_legal,
                   COALESCE(price_a3, 15.00) as price_a3,
                   COALESCE(counter_notice, '') as counter_notice,
                   COALESCE(opening_time, '08:00') as opening_time,
                   COALESCE(closing_time, '22:00') as closing_time,
                   COALESCE(is_closed, 0) as is_closed,
                   COALESCE(bkash_number, '') as bkash_number,
                   COALESCE(nagad_number, '') as nagad_number,
                   COALESCE(discount_min_pages, 50) as discount_min_pages,
                   COALESCE(discount_percent, 10.00) as discount_percent,
                   COALESCE(discount_tier2_pages, 100) as discount_tier2_pages,
                   COALESCE(discount_tier2_percent, 15.00) as discount_tier2_percent,
                   operating_hours, status
            FROM shops WHERE qr_slug = ? AND status = 'active'
        `, [slug]);

        if (shops.length === 0) {
            return res.status(404).json({ success: false, error: 'Shop not found or inactive' });
        }

        const shop = shops[0];
        try {
            if (typeof shop.operating_hours === 'string') {
                shop.operating_hours = JSON.parse(shop.operating_hours || '{}');
            }
        } catch (_) {}

        res.json({ success: true, shop });
    } catch (err) {
        console.error('Fetch shop by slug error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update Shop Pricing, Notice, Hours, Payment, Discounts & Advanced Profile
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, phone, address, price_bw, price_color, price_legal, price_a3,
            counter_notice, operating_hours,
            opening_time, closing_time, is_closed,
            bkash_number, nagad_number,
            discount_min_pages, discount_percent, discount_tier2_pages, discount_tier2_percent,
            trade_license, trade_license_image, shop_image, tagline, owner_name, alt_phone, nid_number, maps_url, services_offered
        } = req.body;

        await query(`
            UPDATE shops 
            SET name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                price_bw = COALESCE(?, price_bw),
                price_color = COALESCE(?, price_color),
                price_legal = COALESCE(?, price_legal),
                price_a3 = COALESCE(?, price_a3),
                counter_notice = COALESCE(?, counter_notice),
                operating_hours = COALESCE(?, operating_hours),
                opening_time = COALESCE(?, opening_time),
                closing_time = COALESCE(?, closing_time),
                is_closed = COALESCE(?, is_closed),
                bkash_number = COALESCE(?, bkash_number),
                nagad_number = COALESCE(?, nagad_number),
                discount_min_pages = COALESCE(?, discount_min_pages),
                discount_percent = COALESCE(?, discount_percent),
                discount_tier2_pages = COALESCE(?, discount_tier2_pages),
                discount_tier2_percent = COALESCE(?, discount_tier2_percent),
                trade_license = COALESCE(?, trade_license),
                trade_license_image = COALESCE(?, trade_license_image),
                shop_image = COALESCE(?, shop_image),
                tagline = COALESCE(?, tagline),
                owner_name = COALESCE(?, owner_name),
                alt_phone = COALESCE(?, alt_phone),
                nid_number = COALESCE(?, nid_number),
                maps_url = COALESCE(?, maps_url),
                services_offered = COALESCE(?, services_offered)
            WHERE id = ?
        `, [
            name || null, phone || null, address || null,
            price_bw ? parseFloat(price_bw) : null,
            price_color ? parseFloat(price_color) : null,
            price_legal ? parseFloat(price_legal) : null,
            price_a3 ? parseFloat(price_a3) : null,
            counter_notice !== undefined ? counter_notice : null,
            typeof operating_hours === 'object' ? JSON.stringify(operating_hours) : (operating_hours || null),
            opening_time !== undefined ? opening_time : null,
            closing_time !== undefined ? closing_time : null,
            is_closed !== undefined ? (is_closed ? 1 : 0) : null,
            bkash_number !== undefined ? bkash_number : null,
            nagad_number !== undefined ? nagad_number : null,
            discount_min_pages !== undefined ? parseInt(discount_min_pages, 10) : null,
            discount_percent !== undefined ? parseFloat(discount_percent) : null,
            discount_tier2_pages !== undefined ? parseInt(discount_tier2_pages, 10) : null,
            discount_tier2_percent !== undefined ? parseFloat(discount_tier2_percent) : null,
            trade_license !== undefined ? trade_license : null,
            trade_license_image !== undefined ? trade_license_image : null,
            shop_image !== undefined ? shop_image : null,
            tagline !== undefined ? tagline : null,
            owner_name !== undefined ? owner_name : null,
            alt_phone !== undefined ? alt_phone : null,
            nid_number !== undefined ? nid_number : null,
            maps_url !== undefined ? maps_url : null,
            services_offered !== undefined ? services_offered : null,
            id
        ]);

        const updated = await query('SELECT * FROM shops WHERE id = ?', [id]);
        res.json({ success: true, message: 'Shop updated successfully', shop: updated[0] });
    } catch (err) {
        console.error('Update shop error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Shop Analytics Endpoint
router.get('/:id/analytics', async (req, res) => {
    try {
        const shopId = parseInt(req.params.id, 10);
        
        // 1. Overall stats
        const [overall] = await query(`
            SELECT 
                COUNT(*) as total_jobs,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COALESCE(SUM(total_pages), 0) as total_pages,
                COALESCE(SUM(discount_applied), 0) as total_discounts
            FROM print_jobs WHERE shop_id = ?
        `, [shopId]);

        // 2. Today's stats
        const [today] = await query(`
            SELECT 
                COUNT(*) as today_jobs,
                COALESCE(SUM(total_price), 0) as today_revenue,
                COALESCE(SUM(total_pages), 0) as today_pages
            FROM print_jobs 
            WHERE shop_id = ? AND DATE(created_at) = CURDATE()
        `, [shopId]);

        // 3. Color vs B&W breakdown
        const modeBreakdown = await query(`
            SELECT 
                f.color_mode,
                COUNT(*) as file_count,
                COALESCE(SUM(f.page_count * f.copies), 0) as total_pages
            FROM print_files f
            JOIN print_jobs j ON f.job_id = j.id
            WHERE j.shop_id = ?
            GROUP BY f.color_mode
        `, [shopId]);

        // 4. Paper sizes breakdown
        const paperBreakdown = await query(`
            SELECT 
                f.paper_size,
                COUNT(*) as count
            FROM print_files f
            JOIN print_jobs j ON f.job_id = j.id
            WHERE j.shop_id = ?
            GROUP BY f.paper_size
        `, [shopId]);

        // 5. Hourly activity (Peak hours)
        const hourlyStats = await query(`
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as jobs_count
            FROM print_jobs
            WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY HOUR(created_at)
            ORDER BY hour ASC
        `, [shopId]);

        // 6. Payment breakdown
        const paymentStats = await query(`
            SELECT 
                COALESCE(payment_method, 'cash') as method,
                COALESCE(payment_status, 'unpaid') as status,
                COUNT(*) as count,
                COALESCE(SUM(total_price), 0) as amount
            FROM print_jobs
            WHERE shop_id = ?
            GROUP BY payment_method, payment_status
        `, [shopId]);

        res.json({
            success: true,
            analytics: {
                overall: overall || {},
                today: today || {},
                modeBreakdown: modeBreakdown || [],
                paperBreakdown: paperBreakdown || [],
                hourlyStats: hourlyStats || [],
                paymentStats: paymentStats || []
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ success: false, error: 'Failed to load analytics' });
    }
});

module.exports = router;
