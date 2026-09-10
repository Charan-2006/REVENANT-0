import React from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';

interface DrawingPromptProps {
  isDrawing: boolean;
  pointCount: number;
  onFinish: () => void;
  onCancel: () => void;
}

export const DrawingPrompt: React.FC<DrawingPromptProps> = ({
  isDrawing,
  pointCount,
  onFinish,
  onCancel,
}) => {
  if (!isDrawing) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-orange-400 px-3.5 py-2 rounded-lg shadow-2xl text-slate-800 text-[11px] font-sans select-none animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
        <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
        <span className="font-bold text-orange-700 uppercase tracking-wider">
          Drawing Restricted Area
        </span>
      </div>

      <div className="h-3 w-px bg-slate-300" />

      <span className="text-slate-700 font-medium">
        {pointCount < 3
          ? `Click map to place points (${pointCount} placed, min 3)`
          : `Click start or double-click to close (${pointCount} points)`}
      </span>

      <div className="flex items-center gap-1.5 ml-1">
        {pointCount >= 3 && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10.5px] transition-all shadow-xs active:scale-95"
            title="Complete and close polygon"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>CLOSE</span>
          </button>
        )}

        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-[10.5px] transition-all active:scale-95"
          title="Cancel drawing"
        >
          <X className="w-3 h-3" />
          <span>CANCEL</span>
        </button>
      </div>
    </div>
  );
};
