const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const tempStageDir = path.join(rootDir, '.deploy_temp');
const zipOutput = path.join(rootDir, 'deploy.zip');

console.log('--- 1. Building Vite frontend client ---');
try {
  execSync('npm run build', { cwd: path.join(rootDir, 'client'), stdio: 'inherit' });
} catch (e) {
  console.error('Frontend build failed:', e);
  process.exit(1);
}

console.log('\n--- 2. Cleaning staging directory ---');
if (fs.existsSync(tempStageDir)) {
  fs.rmSync(tempStageDir, { recursive: true, force: true });
}
fs.mkdirSync(tempStageDir, { recursive: true });

function copyRecursive(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (ignoreList.includes(base)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (ignoreList.includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry), ignoreList);
    }
  } else {
    const base = path.basename(src);
    if (ignoreList.includes(base)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('--- 3. Staging backend server files ---');
copyRecursive(path.join(rootDir, 'server'), path.join(tempStageDir, 'server'), ['node_modules', '.env']);

console.log('--- 4. Staging client dist & package.json ---');
copyRecursive(path.join(rootDir, 'client', 'dist'), path.join(tempStageDir, 'client', 'dist'));
fs.copyFileSync(path.join(rootDir, 'client', 'package.json'), path.join(tempStageDir, 'client', 'package.json'));

console.log('--- 5. Staging root package & SQL ---');
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(tempStageDir, 'package.json'));
if (fs.existsSync(path.join(rootDir, 'setup.sql'))) {
  fs.copyFileSync(path.join(rootDir, 'setup.sql'), path.join(tempStageDir, 'setup.sql'));
}

console.log('--- 6. Generating fresh deploy.zip ---');
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

// Compress using PowerShell Compress-Archive
const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempStageDir}\\*' -DestinationPath '${zipOutput}' -Force"`;
execSync(psCmd, { stdio: 'inherit' });

// Cleanup temp staging directory
fs.rmSync(tempStageDir, { recursive: true, force: true });

const zipStat = fs.statSync(zipOutput);
console.log(`\n======================================================`);
console.log(`[SUCCESS] Fresh deploy.zip created: ${(zipStat.size / 1024).toFixed(1)} KB`);
console.log(`======================================================\n`);
