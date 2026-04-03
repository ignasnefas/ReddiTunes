/**
 * Android build script for Capacitor.
 * Next.js `output: 'export'` cannot export dynamic API route handlers.
 * This script temporarily copies src/app/api out of the routing tree,
 * runs the static export build, then restores the API folder.
 */
import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const apiDir = resolve(root, 'src/app/api');
// Backup outside src/ to avoid VS Code file-watcher locks
const apiBackup = resolve(root, '_api_backup_tmp');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

// Copy API routes out, then remove them from routing tree
if (existsSync(apiDir)) {
  console.log('Temporarily hiding API routes for static export...');
  cpSync(apiDir, apiBackup, { recursive: true });
  rmSync(apiDir, { recursive: true, force: true });
}

try {
  run('cross-env BUILD_TARGET=android next build');
} finally {
  // Always restore API routes
  if (existsSync(apiBackup)) {
    console.log('Restoring API routes...');
    cpSync(apiBackup, apiDir, { recursive: true });
    rmSync(apiBackup, { recursive: true, force: true });
  }
}

console.log('\n✓ Static export complete. Run "npx cap sync android" next.');
