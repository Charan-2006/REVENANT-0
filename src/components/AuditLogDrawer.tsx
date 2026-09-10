import React, { useState } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { AuditLogEntry, AuditEventType } from '../types/maritime';
import { X, FileText, Download, Filter, ShieldCheck } from 'lucide-react';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ZONES' | 'ALERTS' | 'CORRELATION'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType === 'ZONES') {
      if (!log.eventType.startsWith('ZONE_') && !log.eventType.includes('ZONE')) return false;
    } else if (filterType === 'ALERTS') {
      if (!log.eventType.startsWith('ALERT_')) return false;
    } else if (filterType === 'CORRELATION') {
      if (!log.eventType.includes('CORRELATION')) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        log.eventId.toLowerCase().includes(term) ||
        log.targetId.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.reason.toLowerCase().includes(term) ||
        log.eventType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `coastal_surveillance_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Append-Only Audit Trail"
      badge={`${auditLogs.length} RECORDS`}
      icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
      headerAction={
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[9.5px] font-mono text-slate-700 transition-colors shadow-xs"
          title="Export full tamper-evident audit trail as JSON"
        >
          <Download className="w-2.5 h-2.5" />
          <span>EXPORT</span>
        </button>
      }
    >

      {/* Filter / Search Bar */}
      <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1 font-mono">
          {(['ALL', 'ZONES', 'ALERTS', 'CORRELATION'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2 py-0.5 rounded transition-all ${
                filterType === cat
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter audit records..."
          className="w-36 px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 text-[10px] placeholder:text-slate-400 font-mono"
        />
      </div>

      {/* Records Table / List */}
      <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto font-mono text-[10px]">
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic">
            No audit records matching current filter.
          </div>
        ) : (
          [...filteredLogs].reverse().map((log) => {
            const isAlert = log.eventType.startsWith('ALERT_');
            const isZone = log.eventType.startsWith('ZONE_');
            const isVessel = log.eventType.includes('VESSEL_');
            const isCorrelation = log.eventType.includes('CORRELATION');

            const eventColor = isAlert
              ? 'text-rose-700'
              : isZone
              ? 'text-orange-700'
              : isCorrelation
              ? 'text-sky-700'
              : isVessel
              ? 'text-amber-700'
              : 'text-slate-700';

            return (
              <div
                key={log.eventId}
                className="p-2 bg-white border border-slate-200 rounded hover:border-slate-300 shadow-xs transition-colors"
              >
                <div className="flex items-center justify-between mb-0.5 text-[9px]">
                  <span className={`font-bold ${eventColor}`}>{log.eventType}</span>
                  <span className="text-slate-400">{log.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-slate-800 text-[10px]">
                  <span>
                    Target: <strong className="text-slate-900">{log.targetId}</strong>
                  </span>
                  <span className="text-slate-500 text-[8.5px]">OP: {log.operatorId}</span>
                </div>

                <div className="text-slate-600 text-[9px] mt-0.5 flex items-center justify-between">
                  <span>Action: {log.action}</span>
                  {log.reason && <span className="text-amber-700 font-semibold">{log.reason}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
