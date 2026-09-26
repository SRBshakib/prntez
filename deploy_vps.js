const { Client } = require('./server/node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const zipPath = path.join(__dirname, 'deploy.zip');

console.log('Connecting to VPS: 104.207.83.125...');

conn.on('ready', () => {
    console.log('[✓] SSH Connection established successfully!');
    
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('[X] SFTP Error:', err);
            conn.end();
            return;
        }

        console.log('[*] Uploading deploy.zip via SFTP to /var/www/deploy.zip...');
        const readStream = fs.createReadStream(zipPath);
        const writeStream = sftp.createWriteStream('/var/www/deploy.zip');

        writeStream.on('close', () => {
            console.log('[✓] deploy.zip uploaded successfully to /var/www/deploy.zip!');

            console.log('[*] Executing extraction and PM2 restart...');
            const remoteCommands = [
                'cd /var/www',
                'unzip -o deploy.zip -d /var/www/prntez',
                'cd /var/www/prntez',
                'npm --prefix server install --production',
                `mysql -u prntez_user -p'Prntez@2026!Secure' prntez -e "ALTER TABLE print_jobs ADD COLUMN auth_code VARCHAR(20) DEFAULT NULL; CREATE INDEX idx_print_jobs_auth_code ON print_jobs (auth_code); UPDATE print_jobs SET auth_code = CONCAT('PZ-', UPPER(SUBSTRING(MD5(CONCAT(id, '-', job_code, '-prntez')), 1, 4))) WHERE auth_code IS NULL OR auth_code = '' OR auth_code = 'N/A'; INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES ('google_auth_enabled', '1'), ('google_client_id', '');" || true`,
                'pm2 restart prntez',
                'pm2 status'
            ].join(' && ');

            conn.exec(remoteCommands, (err, stream) => {
                if (err) {
                    console.error('[X] Remote execution error:', err);
                    conn.end();
                    return;
                }

                stream.on('close', (code, signal) => {
                    console.log(`[✓] Remote commands completed with exit code: ${code}`);
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data.toString());
                }).stderr.on('data', (data) => {
                    process.stderr.write(data.toString());
                });
            });
        });

        readStream.pipe(writeStream);
    });
}).on('error', (err) => {
    console.error('[X] Connection error:', err.message);
}).connect({
    host: '104.207.83.125',
    port: 22,
    username: 'root',
    password: '9M98HmgxRlz3AKiB60'
});
