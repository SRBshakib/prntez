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

// Run schema migrations for v2 compatibility
async function migrate() {
    const alterOps = [
        // Shops: add pricing, hours, payment & discount columns
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `price_bw` DECIMAL(10,2) DEFAULT 2.00",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `price_color` DECIMAL(10,2) DEFAULT 10.00",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `price_legal` DECIMAL(10,2) DEFAULT 3.00",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `price_a3` DECIMAL(10,2) DEFAULT 15.00",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `counter_notice` VARCHAR(255) DEFAULT 'High-quality laser printing & document services available.'",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `opening_time` VARCHAR(10) DEFAULT '08:00'",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `closing_time` VARCHAR(10) DEFAULT '22:00'",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `is_closed` TINYINT(1) DEFAULT 0",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `bkash_number` VARCHAR(20) DEFAULT ''",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `nagad_number` VARCHAR(20) DEFAULT ''",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `discount_min_pages` INT DEFAULT 50",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `discount_percent` DECIMAL(5,2) DEFAULT 10.00",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `discount_tier2_pages` INT DEFAULT 100",
        "ALTER TABLE `shops` ADD COLUMN IF NOT EXISTS `discount_tier2_percent` DECIMAL(5,2) DEFAULT 15.00",
        // print_jobs: add v2 columns
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `total_pages` INT DEFAULT 0",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `total_price` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `discount_applied` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `payment_status` VARCHAR(20) DEFAULT 'unpaid'",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(20) DEFAULT 'cash'",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `payment_trx_id` VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `customer_email` VARCHAR(191) DEFAULT NULL",
        "ALTER TABLE `print_jobs` ADD COLUMN IF NOT EXISTS `completed_at` DATETIME DEFAULT NULL",
        // print_files: add v2 columns
        "ALTER TABLE `print_files` ADD COLUMN IF NOT EXISTS `file_price` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `print_files` ADD COLUMN IF NOT EXISTS `page_count` INT DEFAULT 1",
        "ALTER TABLE `print_files` ADD COLUMN IF NOT EXISTS `notes` TEXT DEFAULT NULL",
    ];

    for (const sql of alterOps) {
        try { await pool.execute(sql); } catch (e) { /* column may already exist */ }
    }

    // For the v2 system, set known plaintext passwords for existing shops in the `password` column
    // This allows the new token-less auth to work alongside the old bcrypt system
    // In production, shops simply register via the new Register form
    await pool.execute(`
        UPDATE shops SET password = 'TestPass123' 
        WHERE email = 'testshop@prntez.com' AND (password IS NULL OR password = '' OR LENGTH(password) > 20)
    `);

    // Ensure admin password & ad banner defaults in settings
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('admin_password', 'admin@printshare2026')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_badge', '🔥 PROMO')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_text', 'Need bulk prints? Special student & office discount packages available at the counter!')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_link', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_customer_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_badge', '📢 SUPPLIES')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_text', 'Wholesale A4 Paper & Ink Cartridges at special partner rates. Contact Printez Network.')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_link', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ad_shop_enabled', '1')");

    // Google AdSense Defaults (Shop Top/Side/Bottom + Customer Upload/Bottom)
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_enabled', '1')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_client_id', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_customer_bottom', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_customer_uploading', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_track', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_top', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_side', '')");
    await pool.execute("INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('adsense_slot_shop_bottom', '')");

    console.log('[DB] Schema migration v2 complete.');
}

migrate().catch(err => console.error('[DB] Migration error:', err));

module.exports = { pool, query };
