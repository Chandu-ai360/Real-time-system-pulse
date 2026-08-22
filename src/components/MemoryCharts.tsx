import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MemoryMetric } from '../types';
import { HardDrive, Database } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MemoryChartsProps {
  memory: MemoryMetric;
}

export const MemoryCharts: React.FC<MemoryChartsProps> = ({ memory }) => {
  const usedMb = memory.usedMb || 0;
  const freeMb = memory.freeMb || 0;
  const cachedMb = memory.cachedMb || 0;
  const totalMb = memory.totalMb || 1;

  const doughnutData = {
    labels: ['Used RAM', 'Cached Buffers', 'Available Free'],
    datasets: [
      {
        data: [usedMb, cachedMb, freeMb],
        backgroundColor: ['#bd00ff', '#00f2ff', '#1a202c'],
        borderColor: ['#bd00ff', '#00f2ff', '#2d333d'],
        borderWidth: 1.5,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'sans-serif', size: 12 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#151921',
        borderColor: '#2d333d',
        borderWidth: 1,
        titleColor: '#f0f2f5',
        bodyColor: '#bd00ff',
        callbacks: {
          label: (context: { label: string; raw: unknown }) => ` ${context.label}: ${context.raw} MB`,
        },
      },
    },
  };

  const swapTotal = memory.swapTotalMb || 1;
  const swapUsed = memory.swapUsedMb || 0;
  const swapPercent = memory.swapUsedPercent || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Memory Allocation Doughnut Chart */}
      <div
        id="memory-doughnut-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#bd00ff]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Memory Allocation Breakdown</h3>
          </div>
          <span className="text-xs font-mono text-[#bd00ff] font-semibold">{memory.usedPercent}% Used</span>
        </div>

        <div className="relative w-full h-60 flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          {/* Centered Percentage Dial */}
          <div className="absolute flex flex-col items-center pointer-events-none mb-6">
            <span className="text-2xl font-bold font-mono text-[#f0f2f5]">{memory.usedPercent}%</span>
            <span className="text-[10px] uppercase font-semibold text-[#94a3b8]">Total {Math.round(totalMb / 1024)} GB</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[#94a3b8] block">Used</span>
            <span className="font-mono font-semibold text-[#bd00ff]">{usedMb} MB</span>
          </div>
          <div>
            <span className="text-[#94a3b8] block">Cached</span>
            <span className="font-mono font-semibold text-[#00f2ff]">{cachedMb} MB</span>
          </div>
          <div>
            <span className="text-[#94a3b8] block">Free</span>
            <span className="font-mono font-semibold text-[#00ff88]">{freeMb} MB</span>
          </div>
        </div>
      </div>

      {/* Virtual Memory & Swap Statistics */}
      <div
        id="swap-memory-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Swap & Memory Health</h3>
          </div>
          <span className="text-xs font-mono text-[#94a3b8]">Linux Pagefile</span>
        </div>

        <div className="space-y-5 my-auto py-2">
          {/* Virtual RAM Progress */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#f0f2f5]">Physical RAM ({usedMb} / {totalMb} MB)</span>
              <span className="text-[#bd00ff] font-semibold">{memory.usedPercent}%</span>
            </div>
            <div className="w-full bg-[#1a202c] rounded-full h-2 overflow-hidden border border-[#2d333d]/40">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#bd00ff] to-[#00f2ff] transition-all duration-500"
                style={{ width: `${memory.usedPercent}%` }}
              />
            </div>
          </div>

          {/* Swap Memory Progress */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-[#f0f2f5]">Swap Allocation ({swapUsed} / {swapTotal} MB)</span>
              <span className="text-[#00f2ff] font-semibold">{swapPercent}%</span>
            </div>
            <div className="w-full bg-[#1a202c] rounded-full h-2 overflow-hidden border border-[#2d333d]/40">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#00f2ff] to-[#00ff88] transition-all duration-500"
                style={{ width: `${swapPercent}%` }}
              />
            </div>
          </div>

          {/* Key Memory Insights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#1a202c]/70 rounded-lg border border-[#2d333d]">
              <span className="text-[11px] text-[#94a3b8] block font-medium uppercase tracking-wider">Available Headroom</span>
              <span className="text-sm font-mono font-bold text-[#00ff88] mt-1 block">
                {Math.round(freeMb + cachedMb)} MB
              </span>
            </div>
            <div className="p-3 bg-[#1a202c]/70 rounded-lg border border-[#2d333d]">
              <span className="text-[11px] text-[#94a3b8] block font-medium uppercase tracking-wider">Memory Pressure</span>
              <span className="text-sm font-mono font-bold text-[#f0f2f5] mt-1 block">
                {memory.usedPercent > 85 ? 'High Load' : 'Nominal'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>FastAPI psutil.virtual_memory()</span>
          <span className="font-mono text-[#00ff88]">RAM: OK</span>
        </div>
      </div>
    </div>
  );
};
