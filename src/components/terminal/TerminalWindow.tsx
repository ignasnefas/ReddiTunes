'use client';

import { forwardRef } from 'react';
import { WINDOW_CONTROLS } from '@/constants/ascii';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  tabIndex?: number;
  suppressHydrationWarning?: boolean;
}

export const TerminalWindow = forwardRef<HTMLDivElement, TerminalWindowProps>(({
  title,
  children,
  className = '',
  headerActions,
  onClose,
  onMinimize,
  onMaximize,
  tabIndex,
  suppressHydrationWarning,
}, ref) => {
  const showHeader = Boolean(title || onClose || onMinimize || onMaximize || headerActions);

  return (
    <div
      ref={ref}
      tabIndex={tabIndex}
      suppressHydrationWarning={suppressHydrationWarning}
      className={`border border-terminal-border bg-terminal-bg flex flex-col focus:outline-none focus:ring-1 focus:ring-terminal-accent ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-2 py-1 border-b border-terminal-border bg-terminal-header min-h-[28px] relative z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {(onClose || onMinimize || onMaximize) && (
              <div className="flex items-center gap-1 flex-shrink-0">
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-4 h-4 flex items-center justify-center text-red-400 hover:bg-red-400/20 text-xs"
                  aria-label="Close"
                >
                  {WINDOW_CONTROLS.close}
                </button>
              )}
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="w-4 h-4 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 text-xs"
                  aria-label="Minimize"
                >
                  {WINDOW_CONTROLS.minimize}
                </button>
              )}
              {onMaximize && (
                <button
                  onClick={onMaximize}
                  className="w-4 h-4 flex items-center justify-center text-green-400 hover:bg-green-400/20 text-xs"
                  aria-label="Maximize"
                >
                  {WINDOW_CONTROLS.maximize}
                </button>
              )}
            </div>
          )}
          <span className="font-mono text-xs text-terminal-muted truncate">{title}</span>
        </div>
        {headerActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>
      )}
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
});

TerminalWindow.displayName = 'TerminalWindow';
