# ReddiTunes - Terminal YouTube Player

A retro terminal/ASCII/Winamp-inspired YouTube player that generates playlists dynamically from music subreddits.

## Features

- 🎵 **Reddit-Powered Playlists**: Automatically fetch YouTube music from genre-specific subreddits
- 🎨 **Terminal Aesthetic**: Retro terminal/ASCII/Winamp inspired design
- 🌓 **Light/Dark Themes**: Toggle between themes for comfortable viewing
- 📱 **Responsive Design**: Fully mobile-friendly with adaptive layouts
- ⌨️ **Keyboard Shortcuts**: Control playback without touching the mouse
- 🔀 **Queue Management**: Shuffle, repeat, and manage your queue
- 📜 **Playlist History**: Access previously generated playlists
- 🎛️ **Full Playback Control**: Progress bar, volume slider, visualizer

## Supported Genres

- Vaporwave (r/Vaporwave)
- Synthwave (r/synthwave)
- Lo-Fi Hip Hop (r/LofiHipHop)
- Chillwave (r/chillwave)
- Electronic (r/electronicmusic)
- Future Beats (r/futurebeats)
- Listen To This (r/listentothis)
- Indie (r/indieheads)
- Metal (r/Metal)
- Hip Hop (r/hiphopheads)
- Jazz (r/Jazz)
- Ambient (r/ambientmusic)
- Drum & Bass (r/DnB)
- Techno (r/Techno)
- Post-Rock (r/postrock)
- Punk (r/punk)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Seek back 10s |
| `→` | Seek forward 10s |
| `Shift + ←` | Previous track |
| `Shift + →` | Next track |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Toggle mute |
| `R` | Cycle repeat mode |
| `S` | Toggle shuffle |
| `N` | Next track |
| `P` | Previous track |
| `?` | Show help |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **YouTube Integration**: react-youtube
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles & theme variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── layout/            # Layout components
│   ├── player/            # Player components
│   │   ├── Player.tsx     # YouTube player wrapper
│   │   ├── PlayerControls.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── VolumeSlider.tsx
│   │   └── Visualizer.tsx
│   ├── playlist/          # Playlist components
│   │   ├── GenreSelector.tsx
│   │   ├── Playlist.tsx
│   │   ├── PlaylistItem.tsx
│   │   └── PlaylistHistory.tsx
│   ├── terminal/          # Terminal UI components
│   │   ├── TerminalHeader.tsx
│   │   ├── TerminalWindow.tsx
│   │   └── AsciiArt.tsx
│   ├── providers/         # React providers
│   └── ui/                # Reusable UI components
├── constants/             # Constants & configuration
│   ├── ascii.ts          # ASCII art characters
│   └── genres.ts         # Genre/subreddit mappings
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── reddit.ts         # Reddit API helpers
│   ├── youtube.ts        # YouTube helpers
│   └── utils.ts          # General utilities
├── stores/               # Zustand stores
│   ├── playerStore.ts    # Player state
│   ├── playlistStore.ts  # Playlist state
│   └── themeStore.ts     # Theme state
└── types/                # TypeScript types
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## License

MIT License

---

## Progressive Web App (PWA)

- This project includes basic PWA support: `manifest.json`, icons, an offline fallback page, and a simple `service-worker.js` which is registered in production.
- To test the PWA locally:
  1. Build: `npm run build`
  2. Start: `npm start` (or deploy to a secure host)
  3. Open DevTools → Application to inspect the manifest and Service Worker.
- Notes:
  - Service workers require HTTPS in production (or `localhost` for testing).
  - The provided service worker performs simple cache-first behavior for cached assets and falls back to `/offline.html` when the network is unavailable.
  - If you want richer caching strategies, consider integrating `next-pwa` or `Workbox` during build.

---

**Note**: This application uses Reddit's public API to fetch posts containing YouTube links.
