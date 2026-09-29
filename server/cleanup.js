const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function purgeJobFiles(jobId) {
    try {
        const files = await query('SELECT id, stored_path FROM print_files WHERE job_id = ?', [jobId]);
        let jobDir = null;

        for (const f of files) {
            if (f.stored_path) {
                if (!jobDir) {
                    try { jobDir = path.dirname(f.stored_path); } catch (_) {}
                }
                if (fs.existsSync(f.stored_path)) {
                    try { fs.unlinkSync(f.stored_path); } catch (e) {
                        console.error(`[Cleanup] Error deleting file ${f.stored_path}:`, e.message);
                    }
                }
            }
        }

        if (jobDir && fs.existsSync(jobDir)) {
            try {
                fs.rmSync(jobDir, { recursive: true, force: true });
            } catch (e) {
                console.error(`[Cleanup] Error removing directory ${jobDir}:`, e.message);
            }
        }

        try {
            await query("UPDATE print_files SET stored_path = '' WHERE job_id = ?", [jobId]);
        } catch (_) {}
        await query('UPDATE print_jobs SET files_deleted = 1 WHERE id = ?', [jobId]);
        return true;
    } catch (err) {
        console.error(`[Cleanup] Failed to purge files for job #${jobId}:`, err.message);
        return false;
    }
}

async function runAutoCleanup(io) {
    try {
        const settingsRows = await query("SELECT `key`, `value` FROM settings WHERE `key` IN ('file_cleanup_enabled', 'file_cleanup_success_minutes', 'file_cleanup_unsuccess_minutes')");
        const settings = {};
        settingsRows.forEach(r => { settings[r.key] = r.value; });

        // If auto cleanup is disabled by admin, skip
        if (settings.file_cleanup_enabled === '0') {
            return;
        }

        const successMins = parseInt(settings.file_cleanup_success_minutes ?? '30', 10);
        const unsuccessMins = parseInt(settings.file_cleanup_unsuccess_minutes ?? '1440', 10);

        let totalPurged = 0;

        // 1. Clean completed jobs (status = 'done') past retention window
        if (!isNaN(successMins) && successMins >= 0) {
            const completedJobs = await query(`
                SELECT id, shop_id, job_code 
                FROM print_jobs 
                WHERE status = 'done' 
                  AND files_deleted = 0 
                  AND COALESCE(completed_at, updated_at, created_at) <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                LIMIT 50
            `, [successMins]);

            for (const j of completedJobs) {
                const ok = await purgeJobFiles(j.id);
                if (ok) {
                    totalPurged++;
                    if (io) {
                        io.to(`shop_${j.shop_id}`).emit('job_updated', { id: j.id, files_deleted: 1, files: [] });
                        io.to(`job_${j.job_code}`).emit('status_changed', { id: j.id, files_deleted: 1 });
                    }
                }
            }
        }

        // 2. Clean abandoned / unprinted jobs past retention window
        if (!isNaN(unsuccessMins) && unsuccessMins >= 0) {
            const abandonedJobs = await query(`
                SELECT id, shop_id, job_code 
                FROM print_jobs 
                WHERE status != 'done' 
                  AND files_deleted = 0 
                  AND created_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                LIMIT 50
            `, [unsuccessMins]);

            for (const j of abandonedJobs) {
                const ok = await purgeJobFiles(j.id);
                if (ok) {
                    totalPurged++;
                    if (io) {
                        io.to(`shop_${j.shop_id}`).emit('job_updated', { id: j.id, files_deleted: 1, files: [] });
                        io.to(`job_${j.job_code}`).emit('status_changed', { id: j.id, files_deleted: 1 });
                    }
                }
            }
        }

        if (totalPurged > 0) {
            console.log(`[AutoCleanup] Purged expired files for ${totalPurged} orders according to admin retention rules.`);
        }
    } catch (err) {
        console.error('[AutoCleanup] Periodic check error:', err.message);
    }
}

function startCleanupCron(io) {
    // Run 15 seconds after boot, then every 2 minutes
    setTimeout(() => runAutoCleanup(io), 15000);
    setInterval(() => runAutoCleanup(io), 2 * 60 * 1000);
    console.log('[AutoCleanup] Background file retention cleaner initialized.');
}

module.exports = { startCleanupCron, runAutoCleanup, purgeJobFiles };
