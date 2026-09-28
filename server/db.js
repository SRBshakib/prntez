const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prntez',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Helper for single query execution
async function query(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
}

// Helper to safely add column on ANY MySQL/MariaDB version without error
async function ensureColumn(table, column, definition) {
    try {
        const [rows] = await pool.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            [table, column]
        );
        if (rows.length === 0) {
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    } catch (e) {
        // Fallback standard alter
        try { await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`${column}\` ${definition}`); } catch (_) {}
    }
}

// Run schema migrations for v2 compatibility
async function migrate() {
    // 1. Ensure columns on shops
    await ensureColumn('shops', 'price_bw', 'DECIMAL(10,2) DEFAULT 2.00');
    await ensureColumn('shops', 'price_color', 'DECIMAL(10,2) DEFAULT 10.00');
    await ensureColumn('shops', 'price_legal', 'DECIMAL(10,2) DEFAULT 3.00');
    await ensureColumn('shops', 'price_a3', 'DECIMAL(10,2) DEFAULT 15.00');
    await ensureColumn('shops', 'price_passport_4', 'DECIMAL(10,2) DEFAULT 30.00');
    await ensureColumn('shops', 'price_passport_8', 'DECIMAL(10,2) DEFAULT 50.00');
    await ensureColumn('shops', 'price_stamp_4', 'DECIMAL(10,2) DEFAULT 20.00');
    await ensureColumn('shops', 'price_photo_4r', 'DECIMAL(10,2) DEFAULT 20.00');
    await ensureColumn('shops', 'price_photo_a4', 'DECIMAL(10,2) DEFAULT 60.00');
    await ensureColumn('shops', 'price_bind_spiral', 'DECIMAL(10,2) DEFAULT 30.00');
    await ensureColumn('shops', 'price_bind_tape', 'DECIMAL(10,2) DEFAULT 20.00');
    await ensureColumn('shops', 'price_bind_hardcover', 'DECIMAL(10,2) DEFAULT 300.00');
    await ensureColumn('shops', 'price_edit', 'DECIMAL(10,2) DEFAULT 30.00');
    await ensureColumn('shops', 'counter_notice', "VARCHAR(255) DEFAULT 'High-quality laser printing & document services available.'");
    await ensureColumn('shops', 'password', 'VARCHAR(255) DEFAULT NULL');
    await ensureColumn('shops', 'opening_time', "VARCHAR(10) DEFAULT '08:00'");
    await ensureColumn('shops', 'closing_time', "VARCHAR(10) DEFAULT '22:00'");
    await ensureColumn('shops', 'is_closed', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('shops', 'bkash_number', "VARCHAR(20) DEFAULT ''");
    await ensureColumn('shops', 'bkash_type', "VARCHAR(20) DEFAULT 'merchant'");
    await ensureColumn('shops', 'bkash_qr_image', 'LONGTEXT DEFAULT NULL');
    await ensureColumn('shops', 'bkash_app_key', 'VARCHAR(255) DEFAULT NULL');
    await ensureColumn('shops', 'bkash_app_secret', 'VARCHAR(255) DEFAULT NULL');
    await ensureColumn('shops', 'bkash_username', 'VARCHAR(100) DEFAULT NULL');
    await ensureColumn('shops', 'bkash_password', 'VARCHAR(255) DEFAULT NULL');
    await ensureColumn('shops', 'nagad_number', "VARCHAR(20) DEFAULT ''");
    await ensureColumn('shops', 'nagad_type', "VARCHAR(20) DEFAULT 'merchant'");
    await ensureColumn('shops', 'nagad_qr_image', 'LONGTEXT DEFAULT NULL');
    await ensureColumn('shops', 'uddoktapay_api_key', 'VARCHAR(255) DEFAULT NULL');
    await ensureColumn('shops', 'discount_min_pages', 'INT DEFAULT 50');
    await ensureColumn('shops', 'discount_percent', 'DECIMAL(5,2) DEFAULT 10.00');
    await ensureColumn('shops', 'discount_tier2_pages', 'INT DEFAULT 100');
    await ensureColumn('shops', 'discount_tier2_percent', 'DECIMAL(5,2) DEFAULT 15.00');
    await ensureColumn('shops', 'trade_license', "VARCHAR(100) DEFAULT ''");
    await ensureColumn('shops', 'trade_license_image', 'LONGTEXT DEFAULT NULL');
    await ensureColumn('shops', 'shop_image', 'LONGTEXT DEFAULT NULL');
    await ensureColumn('shops', 'tagline', "VARCHAR(255) DEFAULT 'Fast & Reliable Document Printing'");
    await ensureColumn('shops', 'owner_name', "VARCHAR(100) DEFAULT ''");
    await ensureColumn('shops', 'alt_phone', "VARCHAR(30) DEFAULT ''");
    await ensureColumn('shops', 'nid_number', "VARCHAR(50) DEFAULT ''");
    await ensureColumn('shops', 'maps_url', 'TEXT DEFAULT NULL');
    await ensureColumn('shops', 'is_verified', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('shops', 'services_offered', "VARCHAR(255) DEFAULT 'Laser Print, Color Print, Photocopy, Spiral Binding, Laminating'");
    await ensureColumn('shops', 'points_balance', 'INT DEFAULT 0');
    await ensureColumn('shops', 'lifetime_points', 'INT DEFAULT 0');
    await ensureColumn('shops', 'latitude', 'DECIMAL(10,8) DEFAULT 23.81510000');
    await ensureColumn('shops', 'longitude', 'DECIMAL(11,8) DEFAULT 90.42550000');

    // 2. Ensure columns on print_jobs
    await ensureColumn('print_jobs', 'total_pages', 'INT DEFAULT 0');
    await ensureColumn('print_jobs', 'total_price', 'DECIMAL(10,2) DEFAULT 0.00');
    await ensureColumn('print_jobs', 'discount_applied', 'DECIMAL(10,2) DEFAULT 0.00');
    await ensureColumn('print_jobs', 'payment_status', "VARCHAR(30) DEFAULT 'unpaid'");
    await ensureColumn('print_jobs', 'payment_method', "VARCHAR(30) DEFAULT 'cash'");
    await ensureColumn('print_jobs', 'payment_trx_id', 'VARCHAR(100) DEFAULT NULL');
    await ensureColumn('print_jobs', 'payment_provider', 'VARCHAR(50) DEFAULT NULL');
    await ensureColumn('print_jobs', 'pgw_payment_id', 'VARCHAR(100) DEFAULT NULL');
    await ensureColumn('print_jobs', 'customer_email', 'VARCHAR(191) DEFAULT NULL');
    await ensureColumn('print_jobs', 'customer_ip', 'VARCHAR(45) DEFAULT NULL');
    await ensureColumn('print_jobs', 'customer_alias', 'VARCHAR(100) DEFAULT NULL');
    await ensureColumn('print_jobs', 'completed_at', 'DATETIME DEFAULT NULL');
    await ensureColumn('print_jobs', 'download_count', 'INT DEFAULT 0');

    // Direct guarantee: Ensure auth_code column exists on print_jobs
    try {
        await pool.query("ALTER TABLE `print_jobs` ADD COLUMN `auth_code` VARCHAR(20) DEFAULT NULL");
    } catch (_) {}
    try {
        await pool.query("CREATE INDEX `idx_print_jobs_auth_code` ON `print_jobs` (`auth_code`)");
    } catch (_) {}

    // Backfill any existing print_jobs without auth_code directly in 1 MySQL query
    try {
        await pool.query(`
            UPDATE print_jobs 
            SET auth_code = CONCAT('PZ-', UPPER(SUBSTRING(MD5(CONCAT(id, '-', job_code, '-prntez')), 1, 4)))
            WHERE auth_code IS NULL OR auth_code = '' OR auth_code = 'N/A'
        `);
    } catch (e) {
        console.error('[DB] Backfill auth_code error:', e.message);
    }

    // 3. Ensure columns on print_files
    await ensureColumn('print_files', 'file_price', 'DECIMAL(10,2) DEFAULT 0.00');
    await ensureColumn('print_files', 'page_count', 'INT DEFAULT 1');
    await ensureColumn('print_files', 'notes', 'TEXT DEFAULT NULL');

    // Ensure shop_points_ledger table exists
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS \`shop_points_ledger\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`shop_id\` INT NOT NULL,
                \`job_id\` INT DEFAULT NULL,
                \`points\` INT NOT NULL,
                \`type\` VARCHAR(50) DEFAULT 'job_completed',
                \`description\` VARCHAR(255) DEFAULT '',
                \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX \`idx_ledger_shop\` (\`shop_id\`),
                INDEX \`idx_ledger_job\` (\`job_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (e) {
        console.error('[DB] Error creating shop_points_ledger table:', e);
    }

    // Ensure payment_transactions table exists for Multi-Gateway audits
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS \`payment_transactions\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`job_id\` INT NOT NULL,
                \`job_code\` VARCHAR(20) NOT NULL,
                \`shop_id\` INT NOT NULL,
                \`provider\` VARCHAR(50) NOT NULL,
                \`payment_method\` VARCHAR(50) DEFAULT 'bkash',
                \`amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                \`payment_id\` VARCHAR(100) DEFAULT NULL,
                \`trx_id\` VARCHAR(100) DEFAULT NULL,
                \`status\` VARCHAR(50) DEFAULT 'pending',
                \`customer_name\` VARCHAR(100) DEFAULT '',
                \`customer_phone\` VARCHAR(50) DEFAULT '',
                \`raw_response\` LONGTEXT DEFAULT NULL,
                \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX \`idx_pt_job\` (\`job_id\`),
                INDEX \`idx_pt_shop\` (\`shop_id\`),
                INDEX \`idx_pt_payment_id\` (\`payment_id\`),
                INDEX \`idx_pt_trx_id\` (\`trx_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (e) {
        console.error('[DB] Error creating payment_transactions table:', e);
    }

    // For the v2 system, set known plaintext passwords for existing shops in the `password` column
    try {
        await pool.execute(`
            UPDATE shops SET password = 'TestPass123' 
            WHERE email = 'testshop@prntez.com' AND (password IS NULL OR password = '' OR LENGTH(password) > 20)
        `);
    } catch (_) {}

    // Ensure admin password & ad banner defaults in settings
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('admin_password', 'admin@printshare2026')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_badge', '🔥 PROMO')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_text', 'Need bulk prints? Special student & office discount packages available at the counter!')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_link', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_badge', '📢 SUPPLIES')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_text', 'Wholesale A4 Paper & Ink Cartridges at special partner rates. Contact prntez Network.')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_link', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_enabled', '1')");

    // File Storage Lifecycle & Timing Defaults (Admin Managed)
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('file_cleanup_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('file_cleanup_success_minutes', '30')"); // 30 min default after done
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('file_cleanup_unsuccess_minutes', '1440')"); // 24h default for abandoned

    // Google AdSense Defaults (Shop Top/Side/Bottom + Customer Upload/Bottom)
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_client_id', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_customer_bottom', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_customer_uploading', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_track', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_top', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_side', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_bottom', '')");

    // Payment Gateway Settings Defaults
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('pgw_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('pgw_active_provider', 'simulator')"); // 'simulator' | 'bkash' | 'uddoktapay' | 'sslcommerz'
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('pgw_sandbox_mode', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('bkash_app_key', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('bkash_app_secret', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('bkash_username', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('bkash_password', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('bkash_base_url', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('uddoktapay_api_key', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('uddoktapay_base_url', 'https://sandbox.uddoktapay.com/api/checkout-v2')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('sslcommerz_store_id', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('sslcommerz_store_passwd', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('sslcommerz_sandbox_mode', '1')");

    console.log('[DB] Schema migration v2 complete.');
}

migrate().catch(err => console.error('[DB] Migration error:', err));

module.exports = { pool, query };
