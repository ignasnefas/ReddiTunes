# Quick Reference

## Common Commands

### Development
```bash
# Web development (localhost:3000)
npm run dev

# Electron development (with hot reload)
npm run dev:electron

# Linting
npm run lint
```

### Building
```bash
# Web version (static files)
npm run build:web

# Electron Windows (installer + portable)
npm run build:electron:win

# Electron all platforms
npm run build:electron:all

# Android
npm run build:android
```

### Release Process
```bash
# 1. Update version in package.json
# 2. Commit
git add .
git commit -m "Release v1.0.0"

# 3. Create tag (triggers GitHub Actions)
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions automatically:
#    - Builds app
#    - Creates installers
#    - Publishes GitHub Release
```

### Manual Build & Release (if GitHub Actions fails)
```bash
# Build
npm run build:electron:win

# Upload dist/ files to:
# GitHub Repo → Releases → New Release → Upload files
```

## File Locations

```
Production Setup:
- PRODUCTION_READY.md     ← Start here
- PRODUCTION_SETUP.md     ← Detailed guide
- RELEASE_CHECKLIST.md    ← Before each release

Code:
- electron/main.js        ← Electron main process
- next.config.ts          ← Build configuration
- package.json            ← Dependencies & version

Workflows:
- .github/workflows/release.yml  ← Auto-release
- .github/workflows/test.yml     ← Auto-test

Output:
- out/                    ← Web build
- dist/                   ← Electron build (.exe files)
```

## Ports & URLs

| Service | URL | Port |
|---------|-----|------|
| Web Dev | http://localhost:3000 | 3000 |
| Electron | Embedded | N/A |

## Version Format

Use Semantic Versioning: `v1.2.3`
- `1` = Major (breaking changes)
- `2` = Minor (new features)
- `3` = Patch (bug fixes)

## Platform Support Matrix

| Feature | Web | Windows | Android |
|---------|-----|---------|---------|
| Development | ✅ | ✅ | ✅ |
| Production | ✅ | ✅ | ✅ |
| Installer | ❌ | ✅ | ❌ |
| Updates | Manual | Via GitHub | Manual |

## Checklist Before Release

- [ ] Updated version in `package.json`
- [ ] Tested locally: `npm run dev:electron`
- [ ] Built locally: `npm run build:electron:win`
- [ ] Tested both installers manually
- [ ] Added entry to `CHANGELOG.md`
- [ ] All commits pushed
- [ ] Git tag created: `git tag v1.x.x`
- [ ] Tag pushed: `git push origin v1.x.x`
- [ ] GitHub Release created with binaries

## Debugging

### Enable Dev Tools in Electron
Already enabled in development mode. In production, modify:
```javascript
// electron/main.js - add this line:
mainWindow.webContents.openDevTools();
```

### Check App Logs
- Windows: `%APPDATA%/ReddiTunes/logs/`
- View console in DevTools

### Build Errors
```bash
# Clean and rebuild
rm -rf out/ dist/ node_modules/.next
npm install
npm run build:electron:win
```

## Related Docs

- Full Setup: [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
- Release Guide: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Changes: [CHANGELOG.md](CHANGELOG.md)
- Main Readme: [README.md](README.md)

---

**Quick Start:** `npm install && npm run dev`
