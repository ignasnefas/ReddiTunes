'use client';

import { GenreSelector, Playlist, PlaylistHistory, Favorites } from '@/components/playlist';
import { TerminalHeader } from '@/components/terminal';
import { useHelpModal } from '@/components/ui';
import dynamic from 'next/dynamic';
import { KeyboardShortcutsProvider } from '@/hooks';
import { useState } from 'react';
import { List, Star, History, Music } from 'lucide-react';
import { Loading } from '@/components/ui';

const Player = dynamic(() => import('@/components/player').then((m) => m.Player), {
  ssr: false,
  loading: () => <div className="p-4"><Loading text="Loading player" /></div>,
});

const HelpModal = dynamic(() => import('@/components/ui').then((m) => m.HelpModal), { ssr: false });


type MobileTab = 'genres' | 'queue' | 'history' | 'favorites';

export function MainLayout() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('genres');
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('backgroundPlaybackTipDismissed') === 'true';
  });
  const helpModal = useHelpModal();

  const isAndroidFirefox =
    typeof navigator !== 'undefined' &&
    /Android/i.test(navigator.userAgent) &&
    /Firefox/i.test(navigator.userAgent);

  const tabs: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
    { id: 'genres', icon: <Music className="w-4 h-4" />, label: 'Genres' },
    { id: 'queue', icon: <List className="w-4 h-4" />, label: 'Queue' },
    { id: 'history', icon: <History className="w-4 h-4" />, label: 'History' },
    { id: 'favorites', icon: <Star className="w-4 h-4" />, label: 'Favorites' },
  ];

  const [activeLayout] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');

  const handleDismissHint = () => {
    setHintDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('backgroundPlaybackTipDismissed', 'true');
    }
  };

  return (
    <KeyboardShortcutsProvider>
      <div suppressHydrationWarning className="h-[100svh] flex flex-col overflow-hidden bg-terminal-bg pt-[max(env(safe-area-inset-top),0.5rem)]">
        <TerminalHeader onOpenHelp={helpModal.open} />

        {isAndroidFirefox && !hintDismissed && (
          <div className="mx-3 mb-2 rounded border border-terminal-border bg-terminal-bg-secondary p-2 text-terminal-text text-[11px] leading-tight">
            <div className="flex items-start justify-between gap-2">
              <span>
                Background play tip: Android Firefox works best. Open browser menu, toggle
                &quot;Desktop site&quot;, start playback, then switch apps/lock screen.
              </span>
              <button
                className="text-terminal-accent hover:text-terminal-text ml-2"
                onClick={handleDismissHint}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Desktop Layout (lg+) */}
        <main className="hidden grid flex-1 min-h-0 grid-cols-[280px_1fr_280px]">
          {/* Left sidebar */}
          <div className="border-r border-terminal-border flex flex-col min-h-0">
            <div className="flex-1 p-3 overflow-auto">
              <GenreSelector />
            </div>
            <div className="border-t border-terminal-border p-3 h-48 overflow-auto flex flex-col gap-2">
              <PlaylistHistory />
              <Favorites />
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col min-h-0 p-3 gap-3">
            <div className="flex-1 min-h-0">
              {/* Center: Player for desktop/tablet */}
              {activeLayout !== 'mobile' && <Player />}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="border-l border-terminal-border p-3 overflow-auto">
            <Playlist />
          </div>
        </main>

        {/* Tablet Layout (md to lg) */}
        <main className="hidden grid flex-1 min-h-0 grid-cols-[1fr_280px]">
          {/* Left - Player */}
          <div className="flex flex-col min-h-0 p-3 gap-3">
            <div className="flex-1 min-h-0">
              {/* Tablet: show Player */}
              {activeLayout === 'tablet' && <Player />}
            </div>
          </div>

          {/* Right - Genres and Playlist */}
          <div className="border-l border-terminal-border flex flex-col min-h-0">
            <div className="flex-1 p-3 overflow-auto">
              <GenreSelector />
            </div>
            <div className="flex-1 border-t border-terminal-border p-3 overflow-auto">
              <Playlist />
            </div>
          </div>
        </main>

        {/* Mobile Layout */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-3 overflow-hidden min-h-0">
            <div className={`flex flex-col gap-3 h-full`}>
              {/* Player at the top on mobile, visible across tabs */}
              <div className="max-h-[220px] min-h-0">
                {activeLayout === 'mobile' && <Player />}
              </div>

              {/* Render the tab content (only one will show) */}
              <div className="flex-1 overflow-auto">
                {mobileTab === 'genres' && <GenreSelector />}
                {mobileTab === 'queue' && <Playlist />}
                {mobileTab === 'history' && <PlaylistHistory />}
                {mobileTab === 'favorites' && <Favorites />}
              </div>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <nav className="flex-shrink-0 border-t border-terminal-border bg-terminal-header pb-[max(env(safe-area-inset-bottom),1rem)]">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={`flex-1 py-2 flex flex-col items-center gap-0.5 ${
                    mobileTab === tab.id
                      ? 'text-terminal-accent'
                      : 'text-terminal-muted'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-mono">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </main>

        <HelpModal isOpen={helpModal.isOpen} onClose={helpModal.close} />
      </div>

    </KeyboardShortcutsProvider>
  );
}