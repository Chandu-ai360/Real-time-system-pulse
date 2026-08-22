import React from 'react';
import { AlertConfig } from '../types';
import { ShieldAlert, Volume2, VolumeX, Trash2, X, AlertTriangle } from 'lucide-react';

interface SystemAlertsProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Array<{ id: string; time: string; message: string; type: 'warning' | 'critical' }>;
  onClearAlerts: () => void;
  config: AlertConfig;
  onChangeConfig: (newConfig: AlertConfig) => void;
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e14]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="alerts-modal"
        className="bg-[#151921] border border-[#2d333d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d333d] flex items-center justify-between bg-[#1a202c]">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-[#f59e0b]" />
            <h3 className="text-sm uppercase font-bold tracking-wider text-[#f0f2f5]">Alert Thresholds & History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#2d333d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Threshold Configurations */}
          <div className="space-y-4 bg-[#0b0e14] p-4 rounded-xl border border-[#2d333d]">
            <h4 className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
              Trigger Thresholds (%)
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#94a3b8] mb-1">CPU Warning Level (%)</label>
                <input
                  type="number"
                  min="30"
                  max="99"
                  value={config.cpuWarning}
                  onChange={(e) => onChangeConfig({ ...config, cpuWarning: Number(e.target.value) })}
                  className="w-full bg-[#151921] border border-[#2d333d] rounded px-2.5 py-1.5 text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1">CPU Critical Level (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={config.cpuCritical}
                  onChange={(e) => onChangeConfig({ ...config, cpuCritical: Number(e.target.value) })}
                  className="w-full bg-[#151921] border border-[#2d333d] rounded px-2.5 py-1.5 text-[#f43f5e] font-bold font-mono focus:outline-none focus:border-[#f43f5e]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1">RAM Warning Level (%)</label>
                <input
                  type="number"
                  min="30"
                  max="99"
                  value={config.memWarning}
                  onChange={(e) => onChangeConfig({ ...config, memWarning: Number(e.target.value) })}
                  className="w-full bg-[#151921] border border-[#2d333d] rounded px-2.5 py-1.5 text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1">RAM Critical Level (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={config.memCritical}
                  onChange={(e) => onChangeConfig({ ...config, memCritical: Number(e.target.value) })}
                  className="w-full bg-[#151921] border border-[#2d333d] rounded px-2.5 py-1.5 text-[#f43f5e] font-bold font-mono focus:outline-none focus:border-[#f43f5e]"
                />
              </div>
            </div>

            {/* Audio Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2d333d]">
              <span className="text-[#94a3b8]">Audible Alert Sound (Beep)</span>
              <button
                onClick={() => onChangeConfig({ ...config, soundEnabled: !config.soundEnabled })}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold ${
                  config.soundEnabled ? 'bg-[#00f2ff] text-[#0b0e14]' : 'bg-[#151921] text-[#94a3b8] border border-[#2d333d]'
                }`}
              >
                {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{config.soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* Triggered Alert History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                Triggered Alert Events ({alerts.length})
              </h4>
              {alerts.length > 0 && (
                <button
                  onClick={onClearAlerts}
                  className="text-[#94a3b8] hover:text-[#f43f5e] text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Log
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border flex items-start justify-between font-mono text-xs ${
                      item.type === 'critical'
                        ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'
                        : 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{item.message}</span>
                    </div>
                    <span className="text-[10px] opacity-75">{item.time}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[#64748b]">No active alerts recorded. System nominal.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d333d] bg-[#151921] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#00f2ff] text-[#0b0e14] font-bold text-xs hover:bg-[#00f2ff]/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
