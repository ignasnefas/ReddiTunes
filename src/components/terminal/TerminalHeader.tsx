'use client';

import { ThemeToggle } from '@/components/ui';
import { useEffect, useState } from 'react';
import { Radio, Globe, HelpCircle } from 'lucide-react';

interface TerminalHeaderProps {
  onOpenHelp?: () => void;
}

export function TerminalHeader({ onOpenHelp }: TerminalHeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header suppressHydrationWarning className="flex-shrink-0 border-b border-terminal-border bg-terminal-header px-3 py-1.5">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-terminal-accent" suppressHydrationWarning />
          <h1 className="font-mono text-sm text-terminal-accent font-bold">
            ReddiTunes
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-terminal-muted hidden sm:block">{time}</span>

          {/* APK Download */}
          <button
            onClick={() => {
              const apkUrl = process.env.NEXT_PUBLIC_APK_URL || 'https://github.com/ignasnefas/ReddiTunes/releases/download/v1.0.2/app-debug.apk';
              window.open(apkUrl, '_blank');
            }}
            className="px-2 py-1 font-mono text-[10px] rounded border border-terminal-border hover:bg-terminal-hover transition-colors"
            title="Download APK"
          >
            APK
          </button>

          {/* External site */}
          <button
            onClick={() => window.open('https://nefas.tv', '_blank')}
            className="p-2 rounded border border-terminal-border hover:bg-terminal-hover transition-colors"
            title="Visit nefas.tv"
          >
            <Globe className="w-4 h-4 text-terminal-accent" suppressHydrationWarning />
          </button>

          {/* Help (opens modal) */}
          <button
            onClick={() => onOpenHelp?.()}
            className="p-2 rounded border border-terminal-border hover:bg-terminal-hover transition-colors"
            title="Help"
          >
            <HelpCircle className="w-4 h-4 text-terminal-accent" suppressHydrationWarning />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
