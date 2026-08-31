CREATE DATABASE IF NOT EXISTS `printez` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `printez`;

CREATE TABLE IF NOT EXISTS `shops` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `address` TEXT,
  `area` VARCHAR(100),
  `city` VARCHAR(100) DEFAULT 'Dhaka',
  `logo_path` VARCHAR(255),
  `qr_slug` VARCHAR(20) UNIQUE NOT NULL,
  `status` ENUM('pending','active','suspended') DEFAULT 'active',
  `operating_hours` VARCHAR(100),
  `out_of_service` TINYINT(1) DEFAULT 0,
  `accepted_types` VARCHAR(100) DEFAULT 'pdf,jpg,png,docx',
  `max_file_size` INT DEFAULT 51200,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `profile_photo` VARCHAR(255),
  `storage_used` BIGINT DEFAULT 0,
  `storage_limit` BIGINT DEFAULT 524288000,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `print_jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_code` CHAR(4) NOT NULL,
  `shop_id` INT UNSIGNED,
  `customer_id` INT UNSIGNED NULL,
  `customer_name` VARCHAR(100),
  `customer_phone` VARCHAR(20),
  `global_notes` TEXT,
  `status` ENUM('pending','printing','done','cancelled') DEFAULT 'pending',
  `total_files` INT DEFAULT 0,
  `files_deleted` TINYINT(1) DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  INDEX `idx_shop_created` (`shop_id`, `created_at`),
  INDEX `idx_code_shop` (`job_code`, `shop_id`),
  INDEX `idx_expires` (`expires_at`),
  INDEX `idx_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `print_files` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(20) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `copies` TINYINT UNSIGNED DEFAULT 1,
  `color_mode` ENUM('color','bw') DEFAULT 'bw',
  `paper_size` ENUM('A4','A3','Letter','Legal') DEFAULT 'A4',
  `sides` ENUM('single','double') DEFAULT 'single',
  `upload_status` ENUM('uploading','done','failed') DEFAULT 'uploading',
  `is_saved_to_library` TINYINT(1) DEFAULT 0,
  `library_file_id` INT UNSIGNED DEFAULT NULL,
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`job_id`) REFERENCES `print_jobs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `library_files` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(20) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `code` CHAR(6) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ip` VARCHAR(45) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `attempts` INT DEFAULT 1,
  `window_start` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ip_action` (`ip`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_daily_sequence` (
  `shop_id` INT UNSIGNED,
  `date` DATE,
  `last_seq` SMALLINT UNSIGNED DEFAULT 0,
  PRIMARY KEY (`shop_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
('platform_name', 'Printez'),
('file_expiry_minutes', '30'),
('max_file_size_mb', '50'),
('max_files_per_job', '10'),
('allowed_types', 'pdf,jpg,png,docx'),
('delete_on_print', '1'),
('adsense_code', ''),
('ads_enabled', '1'),
('admin_password', 'admin@printez2026'),
('maintenance_mode', '0'),
('shop_approval', 'auto');

CREATE TABLE IF NOT EXISTS `upload_chunks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `upload_id` VARCHAR(64) NOT NULL UNIQUE,
  `job_id` INT UNSIGNED,
  `file_index` INT DEFAULT 0,
  `original_name` VARCHAR(255),
  `total_chunks` INT NOT NULL,
  `received_chunks` INT DEFAULT 0,
  `stored_path` VARCHAR(500),
  `file_settings` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_upload_id` (`upload_id`),
  FOREIGN KEY (`job_id`) REFERENCES `print_jobs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
