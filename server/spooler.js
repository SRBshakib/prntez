const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');

const SUMATRA_PATH = path.join(__dirname, '..', 'tools', 'SumatraPDF.exe');
const TEMP_DIR = path.join(os.tmpdir(), 'printez_spool');
const SPOOL_LOG_PATH = path.join(__dirname, '..', 'uploads', 'spool_log.json');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let cachedDefaultPrinter = null;
let cachedPrintersList = [];
let simulateMode = false; // Auto-set if no printers found

// ─────────────────────────────────────────────────────
// Printer Discovery
// ─────────────────────────────────────────────────────
function refreshPrinters(callback) {
    const psCmd = 'Get-CimInstance Win32_Printer | Select-Object Name, Default | ConvertTo-Json -Compress';
    exec(`powershell -NoProfile -Command "${psCmd}"`, (err, stdout) => {
        if (!err && stdout && stdout.trim().length > 2) {
            try {
                let parsed = JSON.parse(stdout.trim());
                if (!Array.isArray(parsed)) parsed = [parsed];
                cachedPrintersList = parsed.map(p => p.Name).filter(Boolean);
                const def = parsed.find(p => p.Default === true);
                if (def) cachedDefaultPrinter = def.Name;
                else if (cachedPrintersList.length > 0) cachedDefaultPrinter = cachedPrintersList[0];
            } catch (e) {}
        }

        // If no real printers found, switch to simulate mode
        if (cachedPrintersList.length === 0) {
            simulateMode = true;
            cachedPrintersList = ['🖥️ Simulate (No Printer Connected)'];
            cachedDefaultPrinter = '🖥️ Simulate (No Printer Connected)';
            console.log('[Spooler] No physical printer found — SIMULATE MODE active');
        } else {
            simulateMode = false;
            console.log(`[Spooler] Found ${cachedPrintersList.length} printer(s). Default: ${cachedDefaultPrinter}`);
        }

        if (callback) callback(cachedPrintersList, cachedDefaultPrinter);
    });
}

// Initialize on startup
refreshPrinters();

// ─────────────────────────────────────────────────────
// Log spool activity to JSON file (for simulate verification)
// ─────────────────────────────────────────────────────
function logSpoolEntry(entry) {
    let log = [];
    if (fs.existsSync(SPOOL_LOG_PATH)) {
        try { log = JSON.parse(fs.readFileSync(SPOOL_LOG_PATH, 'utf8')); } catch (_) {}
    }
    log.unshift({ ...entry, timestamp: new Date().toISOString() });
    if (log.length > 100) log = log.slice(0, 100); // Keep last 100
    try { fs.writeFileSync(SPOOL_LOG_PATH, JSON.stringify(log, null, 2)); } catch (_) {}
}

// ─────────────────────────────────────────────────────
// Main Print Function
// ─────────────────────────────────────────────────────
function printSilent(filePath, options = {}) {
    const startTime = Date.now();
    const printer = options.printer || cachedDefaultPrinter;
    const copies = parseInt(options.copies, 10) || 1;
    const color = options.color === 'color' ? 'color' : 'monochrome';
    const sides = options.sides === 'double' ? 'duplex' : 'simplex';
    const fileName = path.basename(filePath);
    const isSimulate = simulateMode || !printer || printer.startsWith('🖥️');

    // ── SIMULATE MODE (no printer connected) ─────────
    if (isSimulate) {
        return new Promise((resolve) => {
            // Mimic 1-2 second print delay
            const delay = 1000 + Math.random() * 1000;
            setTimeout(() => {
                const elapsed = Date.now() - startTime;
                const entry = {
                    mode: 'simulate',
                    file: fileName,
                    printer: 'SIMULATE',
                    copies, color, sides,
                    elapsedMs: elapsed,
                    fileExists: fs.existsSync(filePath),
                    fileSizeKB: fs.existsSync(filePath)
                        ? Math.round(fs.statSync(filePath).size / 1024)
                        : 0
                };
                logSpoolEntry(entry);
                console.log(`[Spooler] SIMULATED — ${fileName} (${copies}x, ${color}, ${sides}) in ${elapsed}ms`);
                resolve({
                    elapsed,
                    printer: 'SIMULATE',
                    simulated: true,
                    message: `Simulated print of ${fileName} (${copies} ${copies > 1 ? 'copies' : 'copy'}, ${color}, ${sides})`
                });
            }, delay);
        });
    }

    // ── REAL PRINT via SumatraPDF ──────────────────
    return new Promise((resolve, reject) => {
        const settings = `${copies}x,${color},${sides}`;
        let cmdArgs = [];
        if (printer) cmdArgs.push('-print-to', printer);
        else cmdArgs.push('-print-to-default');
        cmdArgs.push('-print-settings', settings);
        cmdArgs.push('-silent');
        cmdArgs.push(filePath);

        if (fs.existsSync(SUMATRA_PATH)) {
            const child = spawn(SUMATRA_PATH, cmdArgs, { windowsHide: true });

            // Watchdog: virtual printers (PDF to file) may hang waiting for filename
            const timer = setTimeout(() => {
                try { child.kill(); } catch (_) {}
                const elapsed = Date.now() - startTime;
                logSpoolEntry({ mode: 'real_timeout', file: fileName, printer, copies, color, sides, elapsedMs: elapsed });
                resolve({ elapsed, printer, timeout: true });
            }, 10000);

            child.on('close', (code) => {
                clearTimeout(timer);
                const elapsed = Date.now() - startTime;
                if (code === 0 || code === null) {
                    logSpoolEntry({ mode: 'real', file: fileName, printer, copies, color, sides, elapsedMs: elapsed });
                    resolve({ elapsed, printer });
                } else {
                    fallbackPrint(filePath, printer).then(resolve).catch(reject);
                }
            });

            child.on('error', () => {
                clearTimeout(timer);
                fallbackPrint(filePath, printer).then(resolve).catch(reject);
            });
        } else {
            // SumatraPDF.exe not found — fall back to Windows shell print
            fallbackPrint(filePath, printer).then(resolve).catch(reject);
        }
    });
}

// ─────────────────────────────────────────────────────
// Fallback: Windows Shell PrintTo verb
// ─────────────────────────────────────────────────────
function fallbackPrint(filePath, printer) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const printerArg = printer ? `-ArgumentList '"${printer}"'` : '';
        const ps = `Start-Process -FilePath "${filePath}" -Verb PrintTo ${printerArg} -WindowStyle Hidden`;
        exec(`powershell -NoProfile -Command "${ps}"`, (err) => {
            const elapsed = Date.now() - startTime;
            const fileName = path.basename(filePath);
            if (err) {
                logSpoolEntry({ mode: 'fallback_error', file: fileName, printer, elapsedMs: elapsed, error: err.message });
                reject(err);
            } else {
                logSpoolEntry({ mode: 'fallback', file: fileName, printer, elapsedMs: elapsed });
                resolve({ elapsed, printer: printer || 'Default' });
            }
        });
    });
}

// ─────────────────────────────────────────────────────
// Read Spool Log (for /api/jobs/spool-log endpoint)
// ─────────────────────────────────────────────────────
function getSpoolLog() {
    if (!fs.existsSync(SPOOL_LOG_PATH)) return [];
    try { return JSON.parse(fs.readFileSync(SPOOL_LOG_PATH, 'utf8')); } catch (_) { return []; }
}

function clearSpoolLog() {
    try {
        fs.writeFileSync(SPOOL_LOG_PATH, JSON.stringify([], null, 2));
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = {
    printSilent,
    refreshPrinters,
    getSpoolLog,
    clearSpoolLog,
    isSimulateMode: () => simulateMode,
    getPrinters: () => ({
        defaultPrinter: cachedDefaultPrinter,
        printers: cachedPrintersList,
        simulating: simulateMode
    })
};
