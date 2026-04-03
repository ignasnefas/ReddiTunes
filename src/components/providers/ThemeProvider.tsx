'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  // Register a simple service worker in production for offline support
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('Service worker registered.', reg);

          if (reg.waiting) {
            console.log('New service worker is waiting to activate.');
          }

          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content available
                    console.log('New content available; please refresh.');
                  } else {
                    // Content cached for offline use
                    console.log('Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
