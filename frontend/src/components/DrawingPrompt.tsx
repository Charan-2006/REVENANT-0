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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#0f172a]/95 backdrop-blur-md border border-amber-500/80 px-3.5 py-2 rounded shadow-2xl text-slate-200 text-[11px] font-sans select-none animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
          Drawing Geofence Polygon
        </span>
      </div>

      <div className="h-3 w-px bg-slate-700" />

      <span className="text-slate-300 font-medium">
        {pointCount < 3
          ? `Click map to place vertices (${pointCount} placed, min 3)`
          : `Click first point or double-click to close (${pointCount} vertices)`}
      </span>

      <div className="flex items-center gap-1.5 ml-1">
        {pointCount >= 3 && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10.5px] transition-colors shadow-xs"
            title="Complete and close polygon"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>CLOSE</span>
          </button>
        )}

        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-[10.5px] transition-colors"
          title="Cancel drawing"
        >
          <X className="w-3 h-3" />
          <span>CANCEL</span>
        </button>
      </div>
    </div>
  );
};
