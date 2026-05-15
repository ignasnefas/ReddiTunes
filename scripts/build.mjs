#!/usr/bin/env node

/**
 * Build script for creating production builds
 * Supports web, electron, and android builds
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const buildType = args[0] || 'help';

const commands = {
  web: () => {
    console.log('Building web version...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error('Build failed:', error);
        process.exit(1);
      }
      console.log('✓ Web build complete. Output: .next/');
    });
  },
  
  electron: () => {
    console.log('Building Electron app...');
    process.env.ELECTRON_BUILD = 'true';
    exec('npm run build:electron', (error, stdout, stderr) => {
      if (error) {
        console.error('Electron build failed:', error);
        process.exit(1);
      }
      console.log('✓ Electron build complete. Output: dist/');
    });
  },
  
  'electron-win': () => {
    console.log('Building Electron for Windows...');
    process.env.ELECTRON_BUILD = 'true';
    exec('npm run build:electron:win', (error, stdout, stderr) => {
      if (error) {
        console.error('Windows build failed:', error);
        process.exit(1);
      }
      console.log('✓ Windows build complete. Output: dist/');
    });
  },

  android: () => {
    console.log('Building Android app...');
    process.env.BUILD_TARGET = 'android';
    exec('npm run build:android', (error, stdout, stderr) => {
      if (error) {
        console.error('Android build failed:', error);
        process.exit(1);
      }
      console.log('✓ Android build complete.');
    });
  },

  all: () => {
    console.log('Building all versions...');
    commands.web();
    setTimeout(() => commands.electron(), 5000);
    setTimeout(() => commands.android(), 10000);
  },

  help: () => {
    console.log(`
ReddiTunes Build Script

Usage: node scripts/build.mjs [type]

Types:
  web           - Build Next.js web version
  electron      - Build for all electron platforms
  electron-win  - Build Windows Electron app only
  android       - Build Android app
  all           - Build all versions
  help          - Show this message
    `);
  },
};

const cmd = commands[buildType];
if (cmd) {
  cmd();
} else {
  console.error(`Unknown build type: ${buildType}`);
  commands.help();
  process.exit(1);
}
