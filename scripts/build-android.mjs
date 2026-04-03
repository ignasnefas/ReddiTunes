/**
 * Android build script for Capacitor.
 * Next.js `output: 'export'` cannot export dynamic API route handlers.
 * This script temporarily copies src/app/api out of the routing tree,
 * runs the static export build, then restores the API folder.
 */
import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
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

const nextDir = resolve(root, '.next');
const apkDebug = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apkRelease = resolve(root, 'android/app/build/outputs/apk/release/app-release.apk');
const apkOutputDir = resolve(root, 'apk');
const apkDestination = resolve(apkOutputDir, 'app-debug.apk');
const forceNext = process.env.FORCE_NEXT_BUILD === '1';
const forceApk = process.env.FORCE_ANDROID_APK_BUILD === '1';

// Copy API routes out, then remove them from routing tree
if (existsSync(apiDir)) {
  console.log('Temporarily hiding API routes for static export...');
  cpSync(apiDir, apiBackup, { recursive: true });
  rmSync(apiDir, { recursive: true, force: true });
}

try {
  if (existsSync(nextDir) && !forceNext) {
    console.log('.next build already exists; skipping Next.js build. Set FORCE_NEXT_BUILD=1 to rebuild.');
  } else {
    if (existsSync(nextDir)) {
      console.log('Removing stale .next build output...');
      rmSync(nextDir, { recursive: true, force: true });
    }
    run('cross-env BUILD_TARGET=android next build');
  }
} finally {
  // Always restore API routes
  if (existsSync(apiBackup)) {
    console.log('Restoring API routes...');
    cpSync(apiBackup, apiDir, { recursive: true });
    rmSync(apiBackup, { recursive: true, force: true });
  }
}

console.log('\n✓ Static export complete. Syncing Capacitor Android project...');
run('npx cap sync android');
run('npx cap copy android');

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('Building a fresh Android APK via Gradle (old APKs are ignored) ...');
run(`cd android && ${gradlew} clean assembleDebug`);

const builtApk = existsSync(apkDebug) ? apkDebug : existsSync(apkRelease) ? apkRelease : null;
if (builtApk) {
  console.log(`\n✓ Android APK built at ${builtApk}`);

  if (!existsSync(apkOutputDir)) {
    mkdirSync(apkOutputDir, { recursive: true });
  }

  console.log(`Copying APK to repository path: ${apkDestination}`);
  cpSync(builtApk, apkDestination, { recursive: true });

  try {
    run(`git add ${apkDestination}`);
    console.log('Staged APK for commit via git add.');
  } catch (err) {
    console.log('Warning: could not run git add automatically. You can manually run: git add apk/app-debug.apk');
  }
} else {
  console.log('\n⚠️  Unable to locate APK after Gradle assemble. Check Android build logs.');
}

console.log('\n✓ build-android script complete.');
