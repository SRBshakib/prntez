const { query } = require('./server/db');

(async () => {
  try {
    await query("ALTER TABLE print_jobs ADD COLUMN service_type VARCHAR(20) DEFAULT 'print'");
    console.log('Added service_type column');
  } catch (e) {
    console.log('service_type:', e.message);
  }

  try {
    await query("ALTER TABLE print_jobs ADD COLUMN service_detail VARCHAR(100) DEFAULT NULL");
    console.log('Added service_detail column');
  } catch (e) {
    console.log('service_detail:', e.message);
  }

  console.log('Done.');
  process.exit(0);
})();
