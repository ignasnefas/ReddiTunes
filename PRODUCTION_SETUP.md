# Production Setup Guide for ReddiTunes

This guide covers the production-ready setup including Electron builds and GitHub releases.

## Environment Setup

1. **Install Dependencies**
```bash
npm install
```

## Development

### Web Development (Next.js)
```bash
npm run dev
```
Runs on `http://localhost:3000`

### Electron Development
```bash
npm run dev:electron
```
This runs both Next.js dev server and Electron app concurrently.

## Building for Production

### Web Version
```bash
npm run build:web
```
Outputs to `out/` directory - ready for deployment on Vercel, Netlify, or any static host.

### Electron Desktop App (Windows)

#### Build for Current Platform
```bash
npm run build:electron
```

#### Build for Windows Specifically
```bash
npm run build:electron:win
```

Outputs to `dist/` directory with:
- `ReddiTunes-1.0.0.exe` - Installer
- `ReddiTunes-1.0.0-portable.exe` - Portable version (no installation needed)

#### Build All Formats
```bash
npm run build:electron:all
```

## GitHub Releases

### Create a Release Automatically

1. **Bump Version** in `package.json`
2. **Create a Git Tag**
```bash
git tag v1.0.1
git push origin v1.0.1
```

The GitHub Actions workflow will automatically:
- Build the app
- Create a release on GitHub
- Upload Windows installer & portable exe

### Manual Release

If GitHub Actions doesn't work, build manually:

```bash
npm run build:electron:win
```

Then manually upload files from `dist/` to [GitHub Releases](https://github.com/YOUR_REPO/releases)

## Environment Variables

For GitHub Actions to work properly:
- Ensure `GITHUB_TOKEN` is available (automatically in GitHub Actions)
- Token needs `repo` scope permissions

## Files Changed for Production

- `package.json` - Added Electron dependencies and build scripts
- `next.config.ts` - Added static export support for Electron
- `electron/main.js` - Electron main process
- `electron/preload.js` - Security context bridge
- `.github/workflows/release.yml` - Automated release workflow
- `.github/workflows/test.yml` - PR/Push testing workflow

## Platform Support

Currently configured for:
- ✅ Windows (installer + portable)
- ✅ Web (static export)
- ✅ Android (Capacitor - existing setup)

### Adding macOS Support

In `package.json` build section, add to `build.files`:
```json
"mac": {
  "target": ["dmg", "zip"],
  "category": "public.app-category.music"
}
```

In GitHub Actions workflow, add `macos-latest` runner.

### Adding Linux Support

In `package.json` build section, add:
```json
"linux": {
  "target": ["AppImage", "deb"],
  "category": "Audio"
}
```

## Troubleshooting

### Electron app shows blank window
- Check that `out/` directory exists
- Ensure Next.js build completed successfully

### GitHub Actions build fails
- Check that `GITHUB_TOKEN` is available
- Verify Node.js version (18+)
- Check build logs in Actions tab

### Installer won't run
- Ensure antivirus isn't blocking it
- Run as Administrator if needed
- Check Windows version (Windows 7+)

## Web Deployment

Deploy the `out/` directory to:
- **Vercel** - `npm run build && vercel deploy out`
- **Netlify** - Drag & drop the `out/` folder
- **Any HTTP server** - Serve `out/index.html`

## Security Notes

- Context isolation enabled in Electron
- Sandbox enabled for renderer process
- No node integration
- Preload script used for safe API exposure
- Source maps disabled in production

## Next Steps

1. Create Windows icon: `electron/assets/icon.ico` (256x256 minimum)
2. Create Windows installer background: `electron/assets/installerIcon.ico`
3. Update app details in `package.json` author field
4. Test build locally before tagging release
5. Monitor GitHub Actions for build success
