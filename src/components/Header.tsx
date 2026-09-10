import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="relative z-30 h-11 w-full bg-white border-b border-slate-200 flex items-center px-4 select-none shrink-0">
      {/* Brand & Coastal Sentinel Icon */}
      <div className="flex items-center gap-2.5">
        {/* Precise 22x22px Icon Container, perfectly centered */}
        <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-900"
          >
            {/* Outer radar/compass ring */}
            <circle cx="12" cy="12" r="9.5" className="stroke-slate-800" strokeWidth="1.5" />
            {/* Inner dashed range ring */}
            <circle cx="12" cy="12" r="5" className="stroke-slate-400" strokeWidth="1.2" strokeDasharray="2 2" />
            {/* Cardinal crosshairs */}
            <line x1="12" y1="2.5" x2="12" y2="6" className="stroke-slate-800" strokeWidth="1.5" />
            <line x1="12" y1="18" x2="12" y2="21.5" className="stroke-slate-800" strokeWidth="1.5" />
            <line x1="2.5" y1="12" x2="6" y2="12" className="stroke-slate-800" strokeWidth="1.5" />
            <line x1="18" y1="12" x2="21.5" y2="12" className="stroke-slate-800" strokeWidth="1.5" />
            {/* Center coastal sentinel beacon point */}
            <circle cx="12" cy="12" r="1.75" className="fill-sky-600 stroke-sky-600" />
          </svg>
        </div>

        {/* Wordmark sharing the exact visual center line */}
        <span className="text-[13px] font-bold tracking-wider text-slate-900 uppercase leading-none font-sans">
          COASTAL SENTINEL
        </span>
      </div>
    </header>
  );
};
