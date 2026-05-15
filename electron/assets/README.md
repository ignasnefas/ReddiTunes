# Electron Assets

Place your app icons and installer assets here.

## Required Files

### Windows Icon
- `icon.ico` - Application icon (256x256 minimum)
  - Used as taskbar, window, and system tray icon
  - Generate from PNG using: https://icoconvert.com/

### Installer Assets (optional)
- `installerIcon.ico` - Installer window icon
- `installerSidebar.bmp` - NSIS installer sidebar (164×314 pixels)
- `installerHeader.bmp` - NSIS installer header (150×57 pixels)

## Quick Start

1. Create a 256x256 PNG image of your logo
2. Convert to ICO format using https://icoconvert.com/
3. Save as `icon.ico` in this directory
4. Rebuild: `npm run build:electron:win`

## Icon Requirements

- **Format**: ICO or PNG
- **Size**: At least 256x256 pixels
- **Color**: 32-bit RGBA (with transparency support)
- **Format**: Compressed (optional but recommended)

If icon.ico is not found, electron-builder will use a default Electron icon.
