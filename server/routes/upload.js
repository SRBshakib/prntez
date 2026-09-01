const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');

// Ensure uploads root directory exists
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads', 'temp');
if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(UPLOADS_ROOT, 'incoming_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Upload & Create Print Job
router.post('/', upload.array('files', 20), async (req, res) => {
    try {
        const {
            shop_id, shop_slug,
            customer_name, customer_phone, customer_email,
            global_notes,
            payment_method, payment_trx_id,
            file_configs // JSON: array of per-file specs
        } = req.body;

        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: 'Please select at least one file to upload.' });
        }

        // Resolve Shop
        let targetShopId = parseInt(shop_id, 10) || null;
        let shopRow = null;

        if (targetShopId) {
            const shops = await query('SELECT * FROM shops WHERE id = ?', [targetShopId]);
            if (shops.length > 0) shopRow = shops[0];
        } else if (shop_slug) {
            const shops = await query('SELECT * FROM shops WHERE qr_slug = ?', [shop_slug]);
            if (shops.length > 0) { shopRow = shops[0]; targetShopId = shopRow.id; }
        }

        if (!shopRow) {
            return res.status(404).json({ success: false, error: 'Shop not found. Please scan a valid shop QR code.' });
        }

        // Parse per-file configurations
        let configs = [];
        try { configs = JSON.parse(file_configs || '[]'); } catch (_) { configs = []; }

        // Generate Job Code using daily sequence table
        const today = new Date().toISOString().slice(0, 10);
        let lastSeq = 0;
        try {
            const seqRows = await query(
                'SELECT last_seq FROM job_daily_sequence WHERE shop_id = ? AND date = ? FOR UPDATE',
                [targetShopId, today]
            );
            if (seqRows.length > 0) {
                lastSeq = seqRows[0].last_seq;
                await query('UPDATE job_daily_sequence SET last_seq = last_seq + 1 WHERE shop_id = ? AND date = ?', [targetShopId, today]);
            } else {
                await query('INSERT INTO job_daily_sequence (shop_id, date, last_seq) VALUES (?, ?, 1)', [targetShopId, today]);
                lastSeq = 0;
            }
        } catch (_) {
            // Fallback: count existing jobs
            const countRes = await query('SELECT COUNT(*) as total FROM print_jobs WHERE shop_id = ?', [targetShopId]);
            lastSeq = (countRes[0]?.total || 0);
        }
        const jobCode = (lastSeq + 1).toString().padStart(4, '0');

        // Calculate pricing
        const bwRate = parseFloat(shopRow.price_bw) || 2.00;
        const colorRate = parseFloat(shopRow.price_color) || 10.00;
        const legalExtra = parseFloat(shopRow.price_legal) || 0.00;
        const a3Extra = parseFloat(shopRow.price_a3) || 5.00;

        let grandTotal = 0;
        let totalPages = 0;
        const processedFiles = [];

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const cfg = configs[i] || {};
            const copies = Math.max(1, parseInt(cfg.copies, 10) || 1);
            const colorMode = cfg.color_mode === 'color' ? 'color' : 'bw';
            const paperSize = ['A4', 'A3', 'Letter', 'Legal'].includes(cfg.paper_size) ? cfg.paper_size : 'A4';
            const sides = cfg.sides === 'double' ? 'double' : 'single';
            const pageCount = Math.max(1, parseInt(cfg.page_count, 10) || 1);
            const notes = cfg.notes || '';

            let pageRate = colorMode === 'color' ? colorRate : bwRate;
            if (paperSize === 'Legal') pageRate += legalExtra;
            if (paperSize === 'A3') pageRate += a3Extra;

            const filePrice = pageRate * pageCount * copies;
            grandTotal += filePrice;
            totalPages += pageCount * copies;

            processedFiles.push({
                file: f,
                original_name: f.originalname,
                stored_path: f.path,
                file_size: f.size,
                file_type: path.extname(f.originalname).replace('.', '').toLowerCase(),
                page_count: pageCount,
                copies, colorMode, paperSize, sides, notes, filePrice
            });
        }

        // Apply Bulk Discount (Feature 7)
        let discountApplied = 0;
        const minPages1 = parseInt(shopRow.discount_min_pages, 10) || 50;
        const pct1 = parseFloat(shopRow.discount_percent) || 10;
        const minPages2 = parseInt(shopRow.discount_tier2_pages, 10) || 100;
        const pct2 = parseFloat(shopRow.discount_tier2_percent) || 15;

        if (totalPages >= minPages2 && pct2 > 0) {
            discountApplied = (grandTotal * pct2) / 100.0;
        } else if (totalPages >= minPages1 && pct1 > 0) {
            discountApplied = (grandTotal * pct1) / 100.0;
        }
        grandTotal = Math.max(0, grandTotal - discountApplied);

        // Payment status based on method & trx
        let payStatus = 'unpaid';
        const method = (payment_method || 'cash').toLowerCase();
        if (method === 'bkash' || method === 'nagad') {
            payStatus = payment_trx_id && payment_trx_id.trim() ? 'paid_online_pending_verify' : 'unpaid';
        }

        // Set expiry: 30 minutes from now
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        // Insert print_job
        const jobInsert = await query(`
            INSERT INTO print_jobs (
                job_code, shop_id, customer_name, customer_phone,
                total_files, total_pages, total_price, discount_applied,
                payment_status, payment_method, payment_trx_id,
                status, global_notes, files_deleted, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?)
        `, [
            jobCode, targetShopId,
            (customer_name || 'Guest Customer').trim(),
            (customer_phone || '').trim(),
            processedFiles.length,
            totalPages,
            grandTotal,
            discountApplied,
            payStatus,
            method,
            payment_trx_id ? payment_trx_id.trim() : null,
            global_notes || '',
            expiresAt
        ]);

        const jobId = jobInsert.insertId;

        // Move files to permanent job folder
        const finalJobDir = path.join(UPLOADS_ROOT, jobId.toString());
        if (!fs.existsSync(finalJobDir)) fs.mkdirSync(finalJobDir, { recursive: true });

        const dbFiles = [];
        for (const item of processedFiles) {
            const finalPath = path.join(finalJobDir, path.basename(item.file.path));
            try { fs.renameSync(item.file.path, finalPath); } catch (_) {}

            const fileInsert = await query(`
                INSERT INTO print_files (
                    job_id, original_name, stored_path, file_size, file_type,
                    page_count, copies, color_mode, paper_size, sides, notes, file_price, upload_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'done')
            `, [
                jobId, item.original_name, finalPath, item.file_size, item.file_type,
                item.page_count, item.copies, item.colorMode, item.paperSize,
                item.sides, item.notes, item.filePrice
            ]);

            dbFiles.push({
                id: fileInsert.insertId,
                job_id: jobId,
                original_name: item.original_name,
                file_size: item.file_size,
                file_type: item.file_type,
                page_count: item.page_count,
                copies: item.copies,
                color_mode: item.colorMode,
                paper_size: item.paperSize,
                sides: item.sides,
                notes: item.notes,
                file_price: item.filePrice
            });

            // Clean up temp incoming dir
            try { fs.rmdirSync(path.dirname(item.file.path)); } catch (_) {}
        }

        // Build full job payload for WebSocket broadcast
        const fullJob = {
            id: jobId,
            job_code: jobCode,
            shop_id: targetShopId,
            customer_name: customer_name || 'Guest Customer',
            customer_phone: customer_phone || '',
            total_pages: totalPages,
            total_files: dbFiles.length,
            total_price: grandTotal,
            status: 'pending',
            global_notes: global_notes || '',
            files_deleted: 0,
            created_at: new Date().toISOString(),
            files: dbFiles
        };

        // Real-Time push to shop dashboard room
        const io = req.app.get('io');
        if (io) {
            io.to(`shop_${targetShopId}`).emit('new_job', fullJob);
        }

        res.json({
            success: true,
            job_id: jobId,
            job_code: jobCode,
            shop_name: shopRow.name,
            total_files: dbFiles.length,
            total_price: grandTotal,
            status: 'pending'
        });

    } catch (err) {
        console.error('Upload error:', err);
        // Clean up any uploaded temp files
        if (req.files) {
            req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
        }
        res.status(500).json({ success: false, error: 'Failed to process print job: ' + err.message });
    }
});

module.exports = router;
