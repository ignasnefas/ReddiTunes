# Release Checklist

Use this checklist when preparing a new release for GitHub.

## Pre-Release

- [ ] Test the app thoroughly on Windows
  - [ ] Test web version at localhost:3000
  - [ ] Test Electron app: `npm run dev:electron`
  - [ ] Test all genres and features
  - [ ] Test keyboard shortcuts
  - [ ] Test theme toggle
  - [ ] Test on offline mode

- [ ] Update version in `package.json`
  - [ ] Follow semantic versioning (major.minor.patch)
  - [ ] Update `"version"` field

- [ ] Update CHANGELOG.md with new features/fixes
  - [ ] Describe breaking changes
  - [ ] Thank contributors

- [ ] Commit changes
  ```bash
  git add .
  git commit -m "Release v1.x.x"
  ```

## Create Release

- [ ] Create git tag
  ```bash
  git tag v1.x.x
  git push origin v1.x.x
  ```

- [ ] Monitor GitHub Actions
  - [ ] Watch workflow: https://github.com/YOUR_USERNAME/ReddiTunes/actions
  - [ ] Confirm build succeeds
  - [ ] Check Windows installer created

- [ ] Verify Release on GitHub
  - [ ] Go to https://github.com/YOUR_USERNAME/ReddiTunes/releases
  - [ ] Check release notes are correct
  - [ ] Download and test both files:
    - [ ] Test installer (ReddiTunes-x.x.x.exe)
    - [ ] Test portable (ReddiTunes-x.x.x-portable.exe)

## Post-Release

- [ ] Announce release on social media
- [ ] Test web version deployment (if applicable)
  - [ ] Build: `npm run build:web`
  - [ ] Deploy to Vercel/hosting

- [ ] Monitor for bug reports

## Troubleshooting Failed Release

If GitHub Actions build fails:

1. Check build logs in Actions tab
2. Common issues:
   - Node version mismatch
   - Missing dependencies
   - Icon file missing (uses default if missing)

To manually build and upload:

```bash
# Build Windows installers
npm run build:electron:win

# Upload dist/ files to https://github.com/YOUR_USERNAME/ReddiTunes/releases/new
```

## Verifying Installer Quality

- [ ] Installer runs without admin prompt (unless needed)
- [ ] Creates Start Menu shortcut
- [ ] Creates Desktop shortcut (optional)
- [ ] App launches after installation
- [ ] Uninstall removes all files
- [ ] Portable version works without install
- [ ] File associations work (if configured)

## Version Numbering Guide

- **Major (X.0.0)** - Breaking changes
- **Minor (0.X.0)** - New features
- **Patch (0.0.X)** - Bug fixes

Example: `v1.2.3` = Release 1, 2 features added, 3 patches
