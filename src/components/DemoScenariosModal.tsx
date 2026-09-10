import React from 'react';
import { X, Play, Sliders, ShieldAlert, Radio, Trash2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (scenarioNumber: number) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  onClose,
  onRunScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      num: 1,
      title: 'Scenario 1: EO Sensor Detection + AIS Match',
      desc: 'Coastal camera PSS Madras (CAM-04) observes VSL-003. Live AIS telemetry matches optical fix within 486m.',
      expected: 'Status: CORRELATED (Black ship silhouette)',
      icon: <Radio className="w-4 h-4 text-sky-400" />,
      badge: 'CORRELATED',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    {
      num: 2,
      title: 'Scenario 2: EO Sensor Detection with No AIS',
      desc: 'Optical observation CAM-04 detects an unidentified trawler with no transponder response within 5 NM search radius.',
      expected: 'Status: DARK VESSEL (Red ship silhouette)',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      badge: 'DARK VESSEL',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      num: 3,
      title: 'Scenario 3: Dark Vessel Dynamically Correlated with New AIS',
      desc: 'New AIS transponder transmission arrives for previously dark vessel. Re-evaluates spatial match and updates correlation.',
      expected: 'Transition: DARK (Red) → CORRELATED (Black) dynamically',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      badge: 'DYNAMIC RE-CORRELATION',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      num: 4,
      title: 'Scenario 4: Vessel Enters Active Restricted Zone',
      desc: 'Container ship VSL-011 transits across the perimeter of RESTRICTED AREA 01.',
      expected: 'Turns ORANGE (Violation) + Generates Entry Alert once',
      icon: <ShieldAlert className="w-4 h-4 text-orange-600" />,
      badge: 'ENTRY VIOLATION',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    {
      num: 5,
      title: 'Scenario 5: Zone Deletion & Immediate Status Recovery',
      desc: 'Operator deletes the restricted zone. Map layer instantly clears and vessels revert to original Black / Red state.',
      expected: 'Zone deleted → Orange disappears → Underlying state restored',
      icon: <Trash2 className="w-4 h-4 text-rose-600" />,
      badge: 'ZONE DELETION FIX',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    {
      num: 6,
      title: 'Scenario 6: Automatic Zone Expiry Handling',
      desc: 'Sets a 5-second auto-expiry demonstration on Cautionary Anchorage. Zone expires without page reload.',
      expected: 'Countdown expires → Zone removed → Audit log: ZONE_EXPIRED',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      badge: 'AUTO-EXPIRY',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      num: 7,
      title: 'Scenario 7: Operator Alert Disposition Workflow',
      desc: 'Operator investigates an active alert and applies CONFIRM / DISMISS with mandatory Reason Code.',
      expected: 'Alert state updated + Written to append-only audit log',
      icon: <CheckCircle2 className="w-4 h-4 text-sky-600" />,
      badge: 'DISPOSITION',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    },
  ];

  return (
    <aside
      aria-label="Evaluation Demonstration Scenarios"
      className="absolute top-14 left-14 z-30 w-100 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl text-slate-800 overflow-hidden font-sans select-none animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-slate-900">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-600" />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            Surveillance Track Scenarios (1–7)
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close Scenarios"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-[10px] text-slate-600">
        Click any scenario below to execute and visibly demonstrate the expected solution:
      </div>

      {/* Scenarios List */}
      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
        {scenarios.map((s) => (
          <div
            key={s.num}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded shadow-xs transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {s.icon}
                <span className="text-[11px] font-bold text-slate-900">{s.title}</span>
              </div>
              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${s.badgeColor}`}>
                {s.badge}
              </span>
            </div>

            <p className="text-[10px] text-slate-600 leading-snug mb-1.5">{s.desc}</p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
              <span className="text-emerald-700 font-mono text-[9px] font-semibold">{s.expected}</span>
              <button
                onClick={() => {
                  onRunScenario(s.num);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] shadow-xs active:scale-95 transition-all"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>RUN DEMO</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
