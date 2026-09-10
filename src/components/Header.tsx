import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import { ActiveOverlay } from '../types/maritime';

export interface HeaderProps {
  activeAlertCount?: number;
  onOpenAlerts?: () => void;
  systemStatus?: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeOverlay?: ActiveOverlay;
  onToggleOverlay?: (overlay: ActiveOverlay) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertCount = 0,
  onOpenAlerts,
  systemStatus = 'ONLINE',
  activeOverlay = null,
  onToggleOverlay,
}) => {
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().slice(11, 19));
  const controlsRef = useRef<HTMLDivElement>(null);

  const isStatusOpen = activeOverlay === 'status';
  const isOperatorOpen = activeOverlay === 'operator';

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close active header dropdown in the centralized overlay manager
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        if (isStatusOpen || isOperatorOpen) {
          onToggleOverlay?.(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusOpen, isOperatorOpen, onToggleOverlay]);

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOverlay?.(isStatusOpen ? null : 'status');
  };

  const handleToggleOperator = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOverlay?.(isOperatorOpen ? null : 'operator');
  };

  const handleAlertsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOverlay?.(null);
    if (onOpenAlerts) {
      onOpenAlerts();
    }
  };

  return (
    <header className="relative z-30 h-10 w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 select-none shrink-0 font-sans">
      {/* Extreme Left: Product Brand */}
      <span className="text-[13px] font-bold tracking-wider text-slate-900 uppercase leading-none font-sans">
        REVENANT
      </span>

      {/* Extreme Right: Professional Operator Controls */}
      <div ref={controlsRef} className="relative flex items-center gap-1.5 font-sans">
        {/* 1. SYSTEM STATUS */}
        <div className="relative">
          <button
            onClick={handleToggleStatus}
            className={`h-7 px-2 flex items-center gap-1.5 rounded transition-all text-[11px] font-medium ${
              isStatusOpen
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="View system status & feed diagnostics"
            aria-expanded={isStatusOpen}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemStatus === 'ONLINE'
                  ? 'bg-emerald-500 animate-pulse'
                  : systemStatus === 'DEGRADED'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold">
              SYSTEM {systemStatus}
            </span>
          </button>

          {/* System Status Dropdown */}
          {isStatusOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl p-3 text-slate-800 select-none z-40 animate-in fade-in slide-in-from-top-1 duration-150 font-sans"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Subsystem Diagnostics
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {systemStatus}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">SIMULATED AIS</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600">ONLINE</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-600">DEMO EO</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600">ONLINE</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-600">MAP SERVICES</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600">ONLINE</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-600">ALERT ENGINE</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600">ONLINE</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-600">AUDIT LOG</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600">READY</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        {/* 2. ALERTS */}
        <button
          onClick={handleAlertsClick}
          className="h-7 px-2 flex items-center gap-1.5 rounded transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50 relative"
          title={activeAlertCount > 0 ? `${activeAlertCount} Active Maritime Alerts` : 'Alert Center (0 Alerts)'}
          aria-label="Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlertCount > 0 && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white leading-none">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        {/* 3. UTC OPERATIONAL CLOCK */}
        <div
          className="h-7 px-2 flex items-center font-mono text-[11px] text-slate-600 select-none tracking-tight font-medium"
          title="Operational Time (Coordinated Universal Time)"
        >
          {utcTime} UTC
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        {/* 4. OPERATOR */}
        <div className="relative">
          <button
            onClick={handleToggleOperator}
            className={`h-7 px-2 flex items-center gap-1.5 rounded transition-all text-[11px] font-sans ${
              isOperatorOpen
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Operator credentials and duty session"
            aria-expanded={isOperatorOpen}
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[10.5px] font-bold tracking-wide uppercase">
              OPERATOR-01
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Operator Dropdown */}
          {isOperatorOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 w-48 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl p-3 text-slate-800 select-none z-40 animate-in fade-in slide-in-from-top-1 duration-150 font-sans text-[11px]"
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[11px] font-mono shrink-0">
                  01
                </div>
                <div>
                  <div className="font-bold text-slate-900 leading-tight">Operator-01</div>
                  <div className="text-[10px] text-slate-500">Duty Officer</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 py-1">
                <span>Session:</span>
                <span className="font-mono font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Station:</span>
                <span className="font-mono">CONSOLE-01</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
