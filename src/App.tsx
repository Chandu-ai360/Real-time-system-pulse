/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMetricsWebSocket } from './hooks/useMetricsWebSocket';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { CpuCharts } from './components/CpuCharts';
import { MemoryCharts } from './components/MemoryCharts';
import { NetworkDiskCharts } from './components/NetworkDiskCharts';
import { ProcessTable } from './components/ProcessTable';
import { FastApiExplorer } from './components/FastApiExplorer';
import { ApiDocsExplorer } from './components/ApiDocsExplorer';
import { SystemAlerts } from './components/SystemAlerts';
import {
  Cpu,
  Database,
  Network,
  Clock,
  Download,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const {
    currentMetrics,
    systemInfo,
    connectionStatus,
    latencyMs,
    history,
    isPaused,
    setIsPaused,
    isSimulatingLoad,
    triggerStressSimulation,
    stopStressSimulation,
    alerts,
    clearAlerts,
    alertConfig,
    setAlertConfig,
  } = useMetricsWebSocket();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'fastapi' | 'api-docs' | 'processes'>('dashboard');
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Format Uptime helper
  const formatUptime = (seconds?: number) => {
    if (!seconds) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      return `${days}d ${hrs % 24}h ${mins}m`;
    }
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportJson = () => {
    if (!currentMetrics) return;
    const exportData = {
      exportedAt: new Date().toISOString(),
      systemInfo,
      currentMetrics,
      telemetryHistory: history,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    let csv = 'Timestamp,CPU_Overall_Pct,Memory_Used_Pct,Net_Rx_Kbps,Net_Tx_Kbps,Disk_Read_Kbps,Disk_Write_Kbps\n';
    history.timestamps.forEach((time, i) => {
      if (!time) return;
      csv += `${time},${history.cpuOverall[i]},${history.memoryUsedPercent[i]},${history.netRxKbps[i]},${history.netTxKbps[i]},${history.diskReadKbps[i]},${history.diskWriteKbps[i]}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-stream-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const m = currentMetrics;
  const overallCpu = m?.cpu?.overall ?? 0;
  const usedMemPercent = m?.memory?.usedPercent ?? 0;
  const usedMemMb = m?.memory?.usedMb ?? 0;
  const totalMemMb = m?.memory?.totalMb ?? (systemInfo?.totalMemoryMb || 16384);
  const netRxKbps = m?.network ? Math.round((m.network.rxBytesPerSec / 1024) * 10) / 10 : 0;
  const netTxKbps = m?.network ? Math.round((m.network.txBytesPerSec / 1024) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#f0f2f5] flex flex-col font-sans selection:bg-[#00f2ff] selection:text-[#0b0e14] antialiased">
      {/* Top Application Header */}
      <Header
        connectionStatus={connectionStatus}
        latencyMs={latencyMs}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        isSimulatingLoad={isSimulatingLoad}
        onTriggerSimulation={() => triggerStressSimulation(10)}
        onStopSimulation={stopStressSimulation}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertCount={alerts.length}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        systemInfo={systemInfo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stress Spike Notification Banner */}
        {isSimulatingLoad && (
          <div
            id="stress-active-banner"
            className="p-3.5 rounded-xl bg-[#1c1117] border border-[#f43f5e]/40 text-xs text-[#fecdd3] flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-rose-950/40 animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-[#f59e0b] flex-shrink-0" />
              <span className="font-semibold">
                Simulated Stress Spike Active: CPU & Memory injection in progress to benchmark real-time Chart.js rendering & alarm thresholds.
              </span>
            </div>
            <button
              onClick={stopStressSimulation}
              className="px-3 py-1 rounded-md bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-[11px] uppercase tracking-wider transition-colors shadow-sm"
            >
              Stop Test
            </button>
          </div>
        )}

        {/* Top Metric Stat Cards (Always visible for quick glance) */}
        <section aria-label="System Metrics Overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            id="metric-card-cpu"
            title="CPU Usage"
            value={`${overallCpu}%`}
            subtitle={m?.loadAverage ? `Load: ${m.loadAverage[0].toFixed(2)}` : 'Load: 0.0'}
            badge={overallCpu > 80 ? 'HIGH' : 'NOMINAL'}
            badgeType={overallCpu > 85 ? 'rose' : overallCpu > 65 ? 'amber' : 'cyan'}
            progress={overallCpu}
            progressColor={overallCpu > 85 ? 'bg-[#f43f5e]' : overallCpu > 65 ? 'bg-[#f59e0b]' : 'bg-[#00f2ff]'}
            accentColor="#00f2ff"
            footerText={`Logical Cores: ${m?.cpu?.cores?.length || systemInfo?.cpuCount || 4} • ${m?.cpu?.user || 0}% user`}
          />

          <MetricCard
            id="metric-card-memory"
            title="Memory Usage"
            value={`${usedMemPercent}%`}
            subtitle={`${Math.round(usedMemMb)} / ${Math.round(totalMemMb)} MB`}
            badge={`${Math.round((totalMemMb - usedMemMb) / 1024)} GB Free`}
            badgeType="purple"
            progress={usedMemPercent}
            progressColor="bg-[#bd00ff]"
            accentColor="#bd00ff"
            footerText={`Swap: ${m?.memory?.swapUsedPercent || 0}% • Cache: ${m?.memory?.cachedMb || 0} MB`}
          />

          <MetricCard
            id="metric-card-network"
            title="Network IO"
            value={`${netRxKbps} KB/s`}
            subtitle={`↑ ${netTxKbps} KB/s`}
            badge="I/O Active"
            badgeType="emerald"
            progress={Math.min(100, (netRxKbps / 5000) * 100)}
            progressColor="bg-[#00ff88]"
            accentColor="#00ff88"
            footerText={`Total: ${m?.network?.totalRxMb || 0} MB in / ${m?.network?.totalTxMb || 0} MB out`}
          />

          <MetricCard
            id="metric-card-uptime"
            title="System Uptime"
            value={formatUptime(m?.uptimeSeconds)}
            subtitle={systemInfo?.platform ? `${systemInfo.platform} (${systemInfo.arch})` : 'Linux Node'}
            badge={systemInfo?.hostname || 'Host'}
            badgeType="cyan"
            accentColor="#00f2ff"
            footerText={`${systemInfo?.cpuModel || 'x86_64 Processor'}`}
          />
        </section>

        {/* Tab 1: Live Dashboard Visualizations */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Action Bar for Data Export & Telemetry Settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151921] p-3.5 rounded-xl border border-[#2d333d]">
              <div className="flex items-center space-x-2 text-xs text-[#94a3b8]">
                <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                <span className="font-medium text-[#f0f2f5]">Chart.js 4.x Canvas Render Engine</span>
                <span className="text-[#64748b] hidden sm:inline">• 30-second rolling sliding buffer</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="export-csv-btn"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-[#222938] text-[#94a3b8] hover:text-[#f0f2f5] text-xs font-mono flex items-center gap-1.5 border border-[#2d333d] transition-colors"
                  title="Export telemetry history as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#00f2ff]" />
                  Export CSV
                </button>
                <button
                  id="export-json-btn"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-[#222938] text-[#94a3b8] hover:text-[#f0f2f5] text-xs font-mono flex items-center gap-1.5 border border-[#2d333d] transition-colors"
                  title="Export metrics snapshot as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[#bd00ff]" />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Real-time CPU Charts (Line Chart & Per-Core Bar Chart) */}
            <CpuCharts
              timestamps={history.timestamps}
              cpuHistory={history.cpuOverall}
              cores={m?.cpu?.cores || []}
              overallCpu={overallCpu}
              userCpu={m?.cpu?.user || 0}
              sysCpu={m?.cpu?.system || 0}
              idleCpu={m?.cpu?.idle || 0}
            />

            {/* Real-time Memory & Swap Charts */}
            <MemoryCharts
              memory={
                m?.memory || {
                  totalMb: totalMemMb,
                  usedMb: usedMemMb,
                  freeMb: totalMemMb - usedMemMb,
                  cachedMb: 2048,
                  usedPercent: usedMemPercent,
                  swapTotalMb: 8192,
                  swapUsedMb: 1024,
                  swapUsedPercent: 12.5,
                }
              }
            />

            {/* Real-time Network Throughput & Disk I/O Charts */}
            <NetworkDiskCharts
              timestamps={history.timestamps}
              netRxKbps={history.netRxKbps}
              netTxKbps={history.netTxKbps}
              diskReadKbps={history.diskReadKbps}
              diskWriteKbps={history.diskWriteKbps}
              network={
                m?.network || {
                  rxBytesPerSec: 0,
                  txBytesPerSec: 0,
                  totalRxMb: 0,
                  totalTxMb: 0,
                }
              }
              disk={
                m?.disk || {
                  readBytesPerSec: 0,
                  writeBytesPerSec: 0,
                  totalUsedGb: 14.8,
                  totalSizeGb: 64.0,
                  usedPercent: 23.1,
                }
              }
            />

            {/* Quick Process Snapshot */}
            <div className="mt-8">
              <ProcessTable processes={m?.processes || []} />
            </div>
          </div>
        )}

        {/* Tab 2: Full Process Explorer */}
        {activeTab === 'processes' && (
          <div className="space-y-6">
            <ProcessTable processes={m?.processes || []} />
          </div>
        )}

        {/* Tab 3: Python FastAPI Architecture & Source Explorer */}
        {activeTab === 'fastapi' && (
          <div className="space-y-6">
            <FastApiExplorer />
          </div>
        )}

        {/* Tab 4: Interactive OpenAPI & WebSocket Tester */}
        {activeTab === 'api-docs' && (
          <div className="space-y-6">
            <ApiDocsExplorer />
          </div>
        )}
      </main>

      {/* Threshold Alerts Settings Modal */}
      <SystemAlerts
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onClearAlerts={clearAlerts}
        config={alertConfig}
        onChangeConfig={setAlertConfig}
      />

      {/* Footer */}
      <footer className="border-t border-[#2d333d] bg-[#0b0e14] py-4 px-6 text-center text-xs text-[#94a3b8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Real-Time System Metrics Monitor • Powered by Python FastAPI, psutil, WebSockets &amp; Chart.js
          </div>
          <div className="flex items-center space-x-2 font-mono text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]"></span>
              WebSocket Status: {connectionStatus === 'connected' ? 'Connected (1000ms)' : 'Connecting...'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
