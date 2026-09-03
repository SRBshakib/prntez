const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { query } = require('../db');
const { printSilent } = require('../spooler');

// ─────────────────────────────────────────────────────
// List Jobs for a Shop (all or filtered by status)
// ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const shopId = parseInt(req.query.shop_id, 10);
        const status = req.query.status || 'all';

        if (!shopId) {
            return res.status(400).json({ success: false, error: 'shop_id parameter is required' });
        }

        let sql = `
            SELECT id, job_code, shop_id, customer_name, customer_phone,
                   COALESCE(total_pages, 0) as total_pages,
                   total_files,
                   COALESCE(total_price, 0.00) as total_price,
                   COALESCE(discount_applied, 0.00) as discount_applied,
                   COALESCE(payment_status, 'unpaid') as payment_status,
                   COALESCE(payment_method, 'cash') as payment_method,
                   payment_trx_id,
                   status, global_notes, files_deleted, created_at, completed_at
            FROM print_jobs WHERE shop_id = ?
        `;
        const params = [shopId];

        if (status !== 'all') {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY id DESC LIMIT 100';

        const jobs = await query(sql, params);

        // Batch fetch all files for non-deleted jobs in a single query (fixes N+1)
        const activeJobIds = jobs.filter(j => !j.files_deleted).map(j => j.id);

        let filesMap = {};
        if (activeJobIds.length > 0) {
            const placeholders = activeJobIds.map(() => '?').join(',');
            const allFiles = await query(`
                SELECT id, job_id, original_name, stored_path, file_type, file_size,
                       copies, color_mode, paper_size, sides,
                       COALESCE(file_price, 0) as file_price,
                       COALESCE(page_count, 1) as page_count,
                       notes, upload_status
                FROM print_files WHERE job_id IN (${placeholders})
            `, activeJobIds);

            for (const f of allFiles) {
                if (!filesMap[f.job_id]) filesMap[f.job_id] = [];
                filesMap[f.job_id].push(f);
            }
        }

        for (const job of jobs) {
            job.files = filesMap[job.id] || [];
        }

        res.json({ success: true, data: jobs });
    } catch (err) {
        console.error('List jobs error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────
// Customer Track Job by Code
// ─────────────────────────────────────────────────────
router.get('/track/:jobCode', async (req, res) => {
    try {
        const { jobCode } = req.params;
        const jobs = await query(`
            SELECT j.id, j.job_code, j.shop_id, j.customer_name, j.customer_phone,
                   j.total_files, COALESCE(j.total_price, 0.00) as total_price,
                   COALESCE(j.total_pages, 0) as total_pages,
                   COALESCE(j.discount_applied, 0.00) as discount_applied,
                   COALESCE(j.payment_status, 'unpaid') as payment_status,
                   COALESCE(j.payment_method, 'cash') as payment_method,
                   j.payment_trx_id,
                   j.status, j.global_notes, j.files_deleted, j.created_at, j.completed_at,
                   s.name as shop_name, s.phone as shop_phone, s.address as shop_address,
                   s.bkash_number as shop_bkash, s.nagad_number as shop_nagad
            FROM print_jobs j
            JOIN shops s ON j.shop_id = s.id
            WHERE j.job_code = ?
            ORDER BY j.id DESC LIMIT 1
        `, [jobCode]);

        if (jobs.length === 0) {
            return res.status(404).json({ success: false, error: 'Print job not found' });
        }

        const job = jobs[0];
        const files = await query(`
            SELECT id, original_name, file_size, file_type, copies, color_mode, paper_size, sides,
                   COALESCE(file_price, 0) as file_price,
                   COALESCE(page_count, 1) as page_count
            FROM print_files WHERE job_id = ?
        `, [job.id]);
        job.files = files;

        res.json({ success: true, job });
    } catch (err) {
        console.error('Track job error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────
// Update Payment Status (Shopkeeper action)
// ─────────────────────────────────────────────────────
router.post('/payment-status', async (req, res) => {
    try {
        const { job_id, payment_status, payment_method, payment_trx_id } = req.body;
        if (!job_id) {
            return res.status(400).json({ success: false, error: 'job_id is required' });
        }

        await query(`
            UPDATE print_jobs
            SET payment_status = COALESCE(?, payment_status),
                payment_method = COALESCE(?, payment_method),
                payment_trx_id = COALESCE(?, payment_trx_id),
                updated_at = NOW()
            WHERE id = ?
        `, [payment_status || null, payment_method || null, payment_trx_id || null, job_id]);

        const [job] = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);

        const io = req.app.get('io');
        if (io && job) {
            io.to(`shop_${job.shop_id}`).emit('job_updated', {
                id: job.id,
                job_code: job.job_code,
                payment_status: job.payment_status,
                payment_method: job.payment_method,
                payment_trx_id: job.payment_trx_id
            });
            io.to(`job_${job.job_code}`).emit('status_changed', {
                id: job.id,
                payment_status: job.payment_status,
                payment_method: job.payment_method
            });
        }

        res.json({ success: true, payment_status: job?.payment_status });
    } catch (err) {
        console.error('Update payment error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────
// Update Job Status + Real-Time WebSocket Broadcast
// ─────────────────────────────────────────────────────
router.post('/status', async (req, res) => {
    try {
        const { job_id, status } = req.body;
        if (!job_id || !status) {
            return res.status(400).json({ success: false, error: 'job_id and status are required' });
        }

        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [job_id]);
        if (jobs.length === 0) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        const job = jobs[0];

        let filesDeleted = job.files_deleted;

        // Auto-delete files immediately from disk when done
        if (status === 'done' && !job.files_deleted) {
            const files = await query('SELECT id, stored_path FROM print_files WHERE job_id = ?', [job_id]);
            let jobDir = null;
            for (const f of files) {
                if (f.stored_path) {
                    if (!jobDir) {
                        try { jobDir = path.dirname(f.stored_path); } catch (_) {}
                    }
                    if (fs.existsSync(f.stored_path)) {
                        try { fs.unlinkSync(f.stored_path); } catch (e) {
                            console.error(`[Jobs] Failed to delete file ${f.stored_path}:`, e.message);
                        }
                    }
                }
            }
            // Recursively wipe the job folder completely
            if (jobDir && fs.existsSync(jobDir)) {
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {
                    console.error(`[Jobs] Failed to remove job directory ${jobDir}:`, e.message);
                }
            }
            // Null out stored_path in DB so file is completely dereferenced
            await query('UPDATE print_files SET stored_path = NULL WHERE job_id = ?', [job_id]);
            filesDeleted = 1;
        }

        const completedAt = status === 'done' ? new Date() : null;
        await query(`
            UPDATE print_jobs 
            SET status = ?, files_deleted = ?, completed_at = COALESCE(?, completed_at),
                updated_at = NOW()
            WHERE id = ?
        `, [status, filesDeleted, completedAt, job_id]);

        // Points System: Award points to the shop when an order is completed
        let pointsAwarded = 0;
        let freshPointsBalance = 0;
        let freshLifetimePoints = 0;

        if (status === 'done' && job.status !== 'done') {
            const pages = parseInt(job.total_pages || 1, 10);
            // 10 base points + 1 bonus point per 5 pages
            pointsAwarded = 10 + Math.floor(Math.max(0, pages - 1) / 5);

            try {
                await query(`
                    UPDATE shops 
                    SET points_balance = COALESCE(points_balance, 0) + ?,
                        lifetime_points = COALESCE(lifetime_points, 0) + ?
                    WHERE id = ?
                `, [pointsAwarded, pointsAwarded, job.shop_id]);

                const desc = `Completed Order #${job.job_code} (${pages} page${pages > 1 ? 's' : ''})`;
                await query(`
                    INSERT INTO shop_points_ledger (shop_id, job_id, points, type, description)
                    VALUES (?, ?, ?, 'job_completed', ?)
                `, [job.shop_id, job.id, pointsAwarded, desc]);

                const shopRows = await query('SELECT points_balance, lifetime_points FROM shops WHERE id = ?', [job.shop_id]);
                if (shopRows.length > 0) {
                    freshPointsBalance = shopRows[0].points_balance || 0;
                    freshLifetimePoints = shopRows[0].lifetime_points || 0;
                }
            } catch (pErr) {
                console.error('[Points] Error awarding points on job completion:', pErr);
            }
        }

        // Real-Time Push via WebSocket
        const io = req.app.get('io');
        if (io) {
            const updatePayload = {
                id: job.id,
                job_code: job.job_code,
                status,
                files_deleted: filesDeleted,
                completed_at: completedAt
            };
            io.to(`shop_${job.shop_id}`).emit('job_updated', updatePayload);
            io.to(`job_${job.job_code}`).emit('status_changed', updatePayload);

            if (pointsAwarded > 0) {
                io.to(`shop_${job.shop_id}`).emit('points_awarded', {
                    points: pointsAwarded,
                    points_balance: freshPointsBalance,
                    lifetime_points: freshLifetimePoints,
                    job_code: job.job_code
                });
            }
        }

        res.json({
            success: true,
            status,
            files_deleted: filesDeleted,
            points_awarded: pointsAwarded,
            points_balance: freshPointsBalance
        });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────
// Download All Files as ZIP
// ─────────────────────────────────────────────────────
router.get('/:id/download-zip', async (req, res) => {
    try {
        const jobId = parseInt(req.params.id, 10);
        const jobs = await query('SELECT * FROM print_jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) return res.status(404).send('Job not found');

        const job = jobs[0];
        if (job.files_deleted) return res.status(410).send('Files have been purged from storage.');

        const files = await query('SELECT * FROM print_files WHERE job_id = ?', [jobId]);
        if (files.length === 0) return res.status(404).send('No files attached to this job.');

        const zipFilename = `Job_${job.job_code}_Files.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.pipe(res);

        for (const f of files) {
            if (f.stored_path && fs.existsSync(f.stored_path)) {
                const cleanName = `[${f.copies}x_${f.color_mode.toUpperCase()}_${f.paper_size}]_${f.original_name}`;
                archive.file(f.stored_path, { name: cleanName });
            }
        }
        await archive.finalize();
    } catch (err) {
        console.error('ZIP download error:', err);
        res.status(500).send('Failed to generate ZIP archive');
    }
});

// ─────────────────────────────────────────────────────
// Delete Server Files for a Job
// ─────────────────────────────────────────────────────
router.delete('/:id/files', async (req, res) => {
    try {
        const jobId = parseInt(req.params.id, 10);
        const files = await query('SELECT id, stored_path FROM print_files WHERE job_id = ?', [jobId]);
        let jobDir = null;

        for (const f of files) {
            if (f.stored_path) {
                if (!jobDir) {
                    try { jobDir = path.dirname(f.stored_path); } catch (_) {}
                }
                if (fs.existsSync(f.stored_path)) {
                    try { fs.unlinkSync(f.stored_path); } catch (_) {}
                }
            }
        }
        if (jobDir && fs.existsSync(jobDir)) {
            try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch (_) {}
        }

        await query('UPDATE print_files SET stored_path = NULL WHERE job_id = ?', [jobId]);
        await query('UPDATE print_jobs SET files_deleted = 1, updated_at = NOW() WHERE id = ?', [jobId]);

        const io = req.app.get('io');
        if (io) {
            const [j] = await query('SELECT id, shop_id, job_code FROM print_jobs WHERE id = ?', [jobId]);
            if (j) {
                io.to(`shop_${j.shop_id}`).emit('job_updated', { id: j.id, files_deleted: 1, files: [] });
                io.to(`job_${j.job_code}`).emit('status_changed', { id: j.id, files_deleted: 1 });
            }
        }

        res.json({ success: true, message: 'Files purged from server immediately.' });
    } catch (err) {
        console.error('Delete files error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────
// Direct Hardware Spooling
// ─────────────────────────────────────────────────────
router.post('/spool', async (req, res) => {
    try {
        const { file_id, printer, copies, color, sides } = req.body;

        if (!file_id) {
            return res.status(400).json({ success: false, error: 'file_id is required' });
        }

        const files = await query('SELECT id, job_id, stored_path, original_name FROM print_files WHERE id = ?', [file_id]);
        if (files.length === 0 || !files[0].stored_path || !fs.existsSync(files[0].stored_path)) {
            return res.status(404).json({ success: false, error: 'File not found or already deleted from server' });
        }

        const targetFile = files[0];
        const filePath = targetFile.stored_path;

        const result = await printSilent(filePath, {
            printer,
            copies: parseInt(copies, 10) || 1,
            color: color || 'bw',
            sides: sides || 'single'
        });

        // Delete the file immediately from disk upon successful print spooling
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (delErr) {
                console.error(`[Spooler] Failed to delete spooled file ${filePath}:`, delErr.message);
            }
        }
        await query('UPDATE print_files SET stored_path = NULL WHERE id = ?', [file_id]);

        // Check if all files for this job have been printed
        const remaining = await query(
            'SELECT id FROM print_files WHERE job_id = ? AND stored_path IS NOT NULL',
            [targetFile.job_id]
        );

        let jobCompleted = false;
        if (remaining.length === 0) {
            // All files printed! Clean directory completely
            const jobDir = path.dirname(filePath);
            if (fs.existsSync(jobDir)) {
                try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch (_) {}
            }

            // Mark job as done
            await query(
                'UPDATE print_jobs SET status = "done", files_deleted = 1, completed_at = NOW(), updated_at = NOW() WHERE id = ?',
                [targetFile.job_id]
            );
            jobCompleted = true;

            const io = req.app.get('io');
            if (io) {
                const [j] = await query('SELECT * FROM print_jobs WHERE id = ?', [targetFile.job_id]);
                if (j) {
                    io.to(`shop_${j.shop_id}`).emit('job_updated', {
                        id: j.id,
                        status: 'done',
                        files_deleted: 1,
                        files: []
                    });
                    io.to(`job_${j.job_code}`).emit('status_changed', {
                        id: j.id,
                        status: 'done',
                        files_deleted: 1
                    });
                }
            }
        }

        res.json({
            success: true,
            message: `Spooled to ${result.printer} & file deleted immediately`,
            spoolTimeMs: result.elapsed,
            printer: result.printer,
            file_deleted: true,
            job_completed: jobCompleted
        });
    } catch (err) {
        console.error('Spool error:', err);
        res.status(500).json({ success: false, error: 'Spooling failed: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────
// Serve File Stream (for preview & iframe print)
// ─────────────────────────────────────────────────────
router.get('/serve/:fileId', async (req, res) => {
    try {
        const fileId = parseInt(req.params.fileId, 10);
        const files = await query('SELECT * FROM print_files WHERE id = ?', [fileId]);

        if (files.length === 0) return res.status(404).send('File not found');
        const file = files[0];

        if (!file.stored_path || !fs.existsSync(file.stored_path)) {
            return res.status(404).send('File missing from disk storage');
        }

        const ext = path.extname(file.original_name).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const mime = mimeTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
        res.setHeader('Cache-Control', 'private, max-age=300');

        fs.createReadStream(file.stored_path).pipe(res);
    } catch (err) {
        console.error('Serve file error:', err);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
