import React from 'react';
import { Activity, Pause, Play, Zap, Flame, ShieldAlert, Code2, Server, Download } from 'lucide-react';
import { SystemInfo } from '../types';

interface HeaderProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  latencyMs: number | null;
  isPaused: boolean;
  onTogglePause: () => void;
  isSimulatingLoad: boolean;
  onTriggerSimulation: () => void;
  onStopSimulation: () => void;
  activeTab: 'dashboard' | 'fastapi' | 'api-docs' | 'processes';
  onTabChange: (tab: 'dashboard' | 'fastapi' | 'api-docs' | 'processes') => void;
  alertCount: number;
  onOpenAlerts: () => void;
  systemInfo: SystemInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  latencyMs,
  isPaused,
  onTogglePause,
  isSimulatingLoad,
  onTriggerSimulation,
  onStopSimulation,
  activeTab,
  onTabChange,
  alertCount,
  onOpenAlerts,
  systemInfo,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2d333d] bg-[#151921]/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Project Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.15)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#f0f2f5] tracking-tight">
                ChanduPulse <span className="text-[#94a3b8] font-normal text-xs opacity-60">v2.4</span>
              </h1>
              <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20">
                FastAPI • WebSocket
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] hidden sm:block font-mono">
              Live telemetry stream {systemInfo ? `• ${systemInfo.hostname} (${systemInfo.platform} ${systemInfo.arch})` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Navigation Tabs */}
          <div className="inline-flex p-1 rounded-lg bg-[#0b0e14] border border-[#2d333d] text-xs font-medium">
            <button
              id="tab-dashboard-btn"
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#00f2ff]/15 text-[#00f2ff] font-semibold border border-[#00f2ff]/30 shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                  : 'text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#151921]'
              }`}
            >
              Dashboard
            </button>
            <button
              id="tab-processes-btn"
              onClick={() => onTabChange('processes')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'processes'
                  ? 'bg-[#00f2ff]/15 text-[#00f2ff] font-semibold border border-[#00f2ff]/30 shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                  : 'text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#151921]'
              }`}
            >
              Processes
            </button>
            <button
              id="tab-fastapi-btn"
              onClick={() => onTabChange('fastapi')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'fastapi'
                  ? 'bg-[#00f2ff]/15 text-[#00f2ff] font-semibold border border-[#00f2ff]/30 shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                  : 'text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#151921]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              FastAPI Source
            </button>
            <button
              id="tab-docs-btn"
              onClick={() => onTabChange('api-docs')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'api-docs'
                  ? 'bg-[#00f2ff]/15 text-[#00f2ff] font-semibold border border-[#00f2ff]/30 shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                  : 'text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#151921]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              API Docs
            </button>
          </div>

          {/* Stress Spike Simulation */}
          <button
            id="stress-spike-btn"
            onClick={isSimulatingLoad ? onStopSimulation : onTriggerSimulation}
            title="Simulate CPU/Memory load spike to test chart reactivity and alarms"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSimulatingLoad
                ? 'bg-[#f43f5e] text-white animate-pulse border border-[#f43f5e] shadow-lg shadow-rose-600/30'
                : 'bg-[#151921] hover:bg-[#1c222d] text-[#f59e0b] border border-[#2d333d]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{isSimulatingLoad ? 'Stop Spike' : 'Simulate Spike'}</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            id="pause-resume-stream-btn"
            onClick={onTogglePause}
            title={isPaused ? 'Resume live WebSocket rendering' : 'Pause live rendering'}
            className="p-1.5 rounded-lg bg-[#151921] hover:bg-[#1c222d] border border-[#2d333d] text-[#94a3b8] hover:text-[#f0f2f5] transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 text-[#00ff88]" /> : <Pause className="w-4 h-4 text-[#94a3b8]" />}
          </button>

          {/* Alerts Counter */}
          <button
            id="alerts-toggle-btn"
            onClick={onOpenAlerts}
            className="relative p-1.5 rounded-lg bg-[#151921] hover:bg-[#1c222d] border border-[#2d333d] text-[#94a3b8] hover:text-[#f0f2f5] transition-colors"
            title="Threshold Alert Settings"
          >
            <ShieldAlert className="w-4 h-4 text-[#94a3b8]" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f43f5e] text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Connection Status Badge with glowing pulse dot */}
          <div
            id="ws-status-badge"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase border transition-all ${
              connectionStatus === 'connected'
                ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 shadow-[0_0_10px_rgba(0,255,136,0.1)]'
                : connectionStatus === 'connecting'
                ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88] sleek-pulse-dot'
                  : connectionStatus === 'connecting'
                  ? 'bg-[#f59e0b] animate-ping'
                  : 'bg-[#f43f5e]'
              }`}
            />
            <span>{connectionStatus === 'connected' ? 'WS Live' : connectionStatus}</span>
            {latencyMs !== null && connectionStatus === 'connected' && (
              <span className="text-[10px] text-[#94a3b8] font-normal lowercase">({latencyMs}ms)</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
