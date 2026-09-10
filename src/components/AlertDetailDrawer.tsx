import React, { useState } from 'react';
import { DetailDrawer } from './DetailDrawer';
import { MaritimeAlert, DispositionReasonCode } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { ShieldAlert, AlertTriangle, CheckCircle, Navigation, Radio, ExternalLink, ArrowRight } from 'lucide-react';

export interface AlertDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alert: MaritimeAlert | null;
  vessel: Vessel | null;
  onDispositAlert: (
    alertId: string,
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
    reason: DispositionReasonCode,
    notes?: string
  ) => void;
  onViewVesselTelemetry?: (vesselId: string) => void;
  onSimulateAisMatch?: (vesselId: string) => void;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  isOpen,
  onClose,
  alert,
  vessel,
  onDispositAlert,
  onViewVesselTelemetry,
  onSimulateAisMatch,
}) => {
  const [dispositionAction, setDispositionAction] = useState<'CONFIRM' | 'DISMISS' | 'ESCALATE'>('CONFIRM');
  const [reasonCode, setReasonCode] = useState<DispositionReasonCode>('CONFIRMED_CONTACT');
  const [dispositionNotes, setDispositionNotes] = useState('');

  if (!isOpen || !alert) return null;

  const isCritical = alert.priority === 'CRITICAL';
  const isResolved = alert.currentState !== 'ACTIVE';
  const isDark = vessel?.status === 'DARK' || alert.status === 'DARK_VESSEL';

  const handleActionChange = (action: 'CONFIRM' | 'DISMISS' | 'ESCALATE') => {
    setDispositionAction(action);
    if (action === 'DISMISS') setReasonCode('FALSE_POSITIVE');
    else if (action === 'ESCALATE') setReasonCode('INVESTIGATION_REQUIRED');
    else setReasonCode('CONFIRMED_CONTACT');
  };

  const handleConfirmDisposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDispositAlert(
      alert.alertId,
      dispositionAction,
      reasonCode,
      dispositionNotes.trim() || undefined
    );
  };

  const zoneName =
    alert.evidence.zoneName ||
    vessel?.restrictedAreaNames?.join(', ') ||
    'RESTRICTED AREA 01';

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={alert.status}
      badge={vessel?.id || alert.targetId}
      icon={<ShieldAlert className={`w-4 h-4 ${isCritical ? 'text-rose-600' : 'text-orange-600'}`} />}
      headerBg={isCritical ? 'bg-rose-50/80' : 'bg-orange-50/80'}
      headerBorder={isCritical ? 'border-rose-200' : 'border-orange-200'}
    >
      <div className="p-3 space-y-2.5 text-[11px] font-sans" onClick={(e) => e.stopPropagation()}>
        {/* Alert Priority & Status Banner */}
        <div className={`p-2.5 rounded border space-y-1 ${
          isCritical ? 'bg-rose-50 border-rose-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCritical ? 'text-rose-800' : 'text-orange-800'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${isCritical ? 'bg-rose-500' : 'bg-orange-500'}`} />
              {alert.status}
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-bold border ${
                isCritical
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-orange-100 text-orange-800 border-orange-300'
              }`}>
                {alert.priority}
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded font-bold bg-white text-slate-700 border border-slate-300">
                {alert.currentState}
              </span>
            </div>
          </div>
          <div className="text-[9.5px] text-slate-600 pt-1 border-t border-orange-200/60 flex justify-between">
            <span>Alert ID: <strong className="font-mono text-slate-800">{alert.alertId}</strong></span>
            <span>Source: <strong className="text-slate-800">{alert.evidence.source}</strong></span>
          </div>
        </div>

        {/* Vessel Identification Section */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] text-slate-500 uppercase font-bold">Vessel</span>
            <span className="text-[12px] font-bold text-slate-900">
              {vessel?.name || alert.targetName} ({vessel?.id || alert.targetId})
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">Status:</span>
            <span className="font-mono font-bold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded border border-orange-300 text-[9.5px]">
              RESTRICTED
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">Zone:</span>
            <span className="font-bold text-slate-800">{zoneName}</span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">Vessel Type:</span>
            <span className="font-medium text-slate-700">{vessel?.vesselType || 'Container Ship'}</span>
          </div>
        </div>

        {/* Event Time & Geolocation Section */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">Event Time:</span>
            <span className="font-mono font-semibold text-slate-800">{alert.timestamp}</span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">Location:</span>
            <span className="font-mono font-semibold text-slate-800">
              {vessel ? `${vessel.lat.toFixed(4)}° N, ${vessel.lon.toFixed(4)}° E` : 'Inshore Corridor'}
            </span>
          </div>
          {vessel && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[10px] text-slate-600">
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-slate-400" style={{ transform: `rotate(${vessel.heading}deg)` }} />
                <span>Heading: <strong className="font-mono text-slate-800">{vessel.heading}°</strong></span>
              </div>
              <div>
                <span>Speed: <strong className="font-mono text-slate-800">{vessel.speed} kn</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Action Recommendation */}
        <div className="p-2 rounded bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[8.5px] uppercase font-bold text-amber-800 block">Action Protocol</span>
            <span className="text-[10px] text-slate-600">INVESTIGATE / VERIFY / ESCALATE</span>
          </div>
          <span className="font-mono font-bold text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded border border-amber-300 uppercase">
            {alert.suggestedAction || 'INVESTIGATE'}
          </span>
        </div>

        {/* Operator Disposition Section */}
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
              Operator Disposition
            </span>
            {isResolved && (
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                RESOLVED
              </span>
            )}
          </div>

          {isResolved ? (
            <div className="p-2 bg-white rounded border border-slate-200 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Disposition:</span>
                <span className="font-mono font-bold text-emerald-700">{alert.disposition?.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason Code:</span>
                <span className="font-mono font-semibold text-slate-800">{alert.disposition?.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="font-mono text-slate-700">{alert.disposition?.operatorId || 'OPERATOR-01'}</span>
              </div>
              {alert.disposition?.notes && (
                <div className="pt-1 border-t border-slate-100 text-slate-600 italic">
                  "{alert.disposition.notes}"
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Action Selector: CONFIRM / DISMISS / ESCALATE */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('CONFIRM');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-all ${
                    dispositionAction === 'CONFIRM'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                  }`}
                >
                  CONFIRM
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('DISMISS');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-all ${
                    dispositionAction === 'DISMISS'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  DISMISS
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('ESCALATE');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-all ${
                    dispositionAction === 'ESCALATE'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-300'
                  }`}
                >
                  ESCALATE
                </button>
              </div>

              {/* Mandatory Reason Code */}
              <div>
                <label className="text-[8.5px] uppercase font-semibold text-slate-500 block mb-0.5">
                  Reason Code
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => {
                    e.stopPropagation();
                    setReasonCode(e.target.value as DispositionReasonCode);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[10px] font-mono focus:border-orange-500 focus:outline-none"
                >
                  <option value="CONFIRMED_CONTACT">CONFIRMED_CONTACT</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                  <option value="AUTHORIZED_ACTIVITY">AUTHORIZED_ACTIVITY</option>
                  <option value="DUPLICATE_DETECTION">DUPLICATE_DETECTION</option>
                  <option value="INVESTIGATION_REQUIRED">INVESTIGATION_REQUIRED</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Operational Notes */}
              <div>
                <input
                  type="text"
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Operator notes (audit log reference)..."
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[10px] placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Submit Disposition */}
              <button
                type="button"
                onClick={handleConfirmDisposition}
                className={`w-full py-1.5 px-2 rounded font-bold text-[10px] text-white shadow-xs transition-all active:scale-98 ${
                  dispositionAction === 'CONFIRM'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : dispositionAction === 'DISMISS'
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                SUBMIT DISPOSITION
              </button>
            </>
          )}
        </div>

        {/* Quick Link to Vessel Telemetry */}
        {vessel && onViewVesselTelemetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewVesselTelemetry(vessel.id);
            }}
            className="w-full py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Full Vessel Telemetry & Registry</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {/* Dynamic Dark Vessel Re-Correlation (Scenario 3) */}
        {isDark && onSimulateAisMatch && vessel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSimulateAisMatch(vessel.id);
            }}
            className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
            title="Ingest live AIS transponder message to correlate this contact"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>INGEST MATCHING AIS TELEMETRY</span>
          </button>
        )}

        {/* Attribution Footnote */}
        <div className="pt-1 text-[8.5px] text-slate-400 flex items-center justify-between border-t border-slate-200">
          <span>Feed: Turf.js Geofence Engine</span>
          <span className="text-sky-600 font-medium">REVENANT</span>
        </div>
      </div>
    </DetailDrawer>
  );
};
