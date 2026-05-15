@echo off
REM Quick Setup Script for Development on Windows

echo ReddiTunes Production Setup
echo =============================
echo.

REM Install dependencies if not already done
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
) else (
    echo ✓ Dependencies already installed
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo.
echo For WEB development:
echo   npm run dev
echo   Then visit: http://localhost:3000
echo.
echo For DESKTOP (Electron) development:
echo   npm run dev:electron
echo.
echo For ANDROID development:
echo   npm run build:android
echo.
echo To BUILD for production:
echo   npm run build:web          # Web static export
echo   npm run build:electron     # Desktop app (current platform)
echo   npm run build:electron:win # Windows EXE + installer
echo.
echo For detailed info, see: PRODUCTION_SETUP.md
echo.
pause
