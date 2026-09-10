import React, { useState } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { MaritimeAlert, DispositionReasonCode } from '../types/maritime';
import { X, AlertTriangle, ShieldAlert, CheckCircle, Flame, Eye, Compass } from 'lucide-react';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: MaritimeAlert[];
  onDispositAlert: (
    alertId: string,
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
    reason: DispositionReasonCode,
    notes?: string
  ) => void;
  onSelectTarget: (targetId: string) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  isOpen,
  onClose,
  alerts,
  onDispositAlert,
  onSelectTarget,
}) => {
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<{
    alert: MaritimeAlert;
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE';
  } | null>(null);

  const [reasonCode, setReasonCode] = useState<DispositionReasonCode>('CONFIRMED_CONTACT');
  const [dispositionNotes, setDispositionNotes] = useState('');

  if (!isOpen) return null;

  const handleOpenDisposition = (alert: MaritimeAlert, action: 'CONFIRM' | 'DISMISS' | 'ESCALATE') => {
    setSelectedAlertForAction({ alert, action });
    if (action === 'DISMISS') setReasonCode('FALSE_POSITIVE');
    else if (action === 'ESCALATE') setReasonCode('INVESTIGATION_REQUIRED');
    else setReasonCode('CONFIRMED_CONTACT');
    setDispositionNotes('');
  };

  const handleConfirmDisposition = () => {
    if (!selectedAlertForAction) return;
    onDispositAlert(
      selectedAlertForAction.alert.alertId,
      selectedAlertForAction.action,
      reasonCode,
      dispositionNotes.trim() || undefined
    );
    setSelectedAlertForAction(null);
  };

  const activeAlerts = alerts.filter((a) => a.currentState === 'ACTIVE');

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Operational Alert Engine"
      badge={`${activeAlerts.length} ACTIVE`}
      icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
    >

      {/* Disposition Modal Overlay */}
      {selectedAlertForAction && (
        <div className="p-3 bg-slate-50 border-b border-rose-200 animate-in fade-in duration-150 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 uppercase text-[10px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
              Operator Disposition: {selectedAlertForAction.action}
            </span>
            <span className="text-[8.5px] font-mono text-slate-500">
              {selectedAlertForAction.alert.targetId}
            </span>
          </div>

          <div>
            <label className="text-[8.5px] uppercase font-semibold text-slate-500 block mb-1">
              Mandatory Disposition Reason Code
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as DispositionReasonCode)}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[10.5px] font-mono focus:border-rose-500"
            >
              <option value="CONFIRMED_CONTACT">CONFIRMED_CONTACT</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              <option value="AUTHORIZED_ACTIVITY">AUTHORIZED_ACTIVITY</option>
              <option value="DUPLICATE_DETECTION">DUPLICATE_DETECTION</option>
              <option value="INVESTIGATION_REQUIRED">INVESTIGATION_REQUIRED</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              value={dispositionNotes}
              onChange={(e) => setDispositionNotes(e.target.value)}
              placeholder="Operator notes (optional audit log evidence)..."
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[10.5px] placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={() => setSelectedAlertForAction(null)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDisposition}
              className={`px-3 py-1 rounded font-bold text-[10px] text-white shadow-xs ${
                selectedAlertForAction.action === 'CONFIRM'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : selectedAlertForAction.action === 'DISMISS'
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              SUBMIT DISPOSITION
            </button>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-slate-500 italic">
            No alerts generated. Surveillance perimeter clear.
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.priority === 'CRITICAL';
            const isHigh = alert.priority === 'HIGH';
            const isResolved = alert.currentState !== 'ACTIVE';

            return (
              <div
                key={alert.alertId}
                className={`p-2.5 rounded border transition-all ${
                  isResolved
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : isCritical
                    ? 'bg-rose-50/70 border-rose-200 shadow-xs'
                    : isHigh
                    ? 'bg-orange-50/70 border-orange-200'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isHigh
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {alert.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-900 uppercase">
                      {alert.status}
                    </span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-500">{alert.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-800 mb-1">
                  <span className="font-semibold text-slate-900">{alert.targetName}</span>
                  <span className="text-[9.5px] font-mono text-slate-500">{alert.targetId}</span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-0.5 mb-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500">Evidence:</span> {alert.evidence.source}
                    {alert.evidence.confidence && (
                      <span className="font-mono text-sky-700 font-semibold ml-1">({alert.evidence.confidence}% Conf)</span>
                    )}
                  </div>
                  {alert.evidence.zoneName && (
                    <div>
                      <span className="text-slate-500">Zone:</span>{' '}
                      <span className="text-orange-800 font-semibold">{alert.evidence.zoneName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-0.5 text-[9px]">
                    <span className="text-slate-500">Suggested Action:</span>
                    <span className="font-mono font-bold text-amber-800 uppercase">
                      {alert.suggestedAction}
                    </span>
                  </div>
                </div>

                {/* Disposition Status or Action Buttons */}
                {isResolved ? (
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                    <span>
                      State: <strong className="text-slate-800">{alert.currentState}</strong>
                    </span>
                    {alert.disposition && (
                      <span className="text-slate-500">
                        {alert.disposition.action} • {alert.disposition.reason}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                    <button
                      onClick={() => onSelectTarget(alert.targetId)}
                      className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-medium"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Locate</span>
                    </button>

                    <div className="flex items-center gap-1 font-bold text-[9px]">
                      <button
                        onClick={() => handleOpenDisposition(alert, 'CONFIRM')}
                        className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors"
                      >
                        CONFIRM
                      </button>
                      <button
                        onClick={() => handleOpenDisposition(alert, 'DISMISS')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors"
                      >
                        DISMISS
                      </button>
                      <button
                        onClick={() => handleOpenDisposition(alert, 'ESCALATE')}
                        className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 transition-colors"
                      >
                        ESCALATE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
