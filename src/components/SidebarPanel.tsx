import React from 'react';
import { X } from 'lucide-react';

export interface SidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string | number | React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  icon,
  headerAction,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label={title}
      className={`absolute left-[54px] top-3.5 z-30 w-96 max-w-[calc(100vw-72px)] max-h-[calc(100vh-68px)] flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl text-slate-800 overflow-hidden font-sans select-none animate-in fade-in slide-in-from-left-2 duration-150 ${className}`}
    >
      {/* Standardized Header */}
      <div className="h-11 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0 text-slate-600">{icon}</span>}
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-900 font-sans truncate">
            {title}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerAction}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close Panel"
            aria-label="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Standardized Content Container */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {children}
      </div>
    </aside>
  );
};
