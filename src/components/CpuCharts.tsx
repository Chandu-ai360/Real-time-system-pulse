import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { CpuCoreMetric } from '../types';
import { Cpu, Layers } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CpuChartsProps {
  timestamps: string[];
  cpuHistory: number[];
  cores: CpuCoreMetric[];
  overallCpu: number;
  userCpu: number;
  sysCpu: number;
  idleCpu: number;
}

export const CpuCharts: React.FC<CpuChartsProps> = ({
  timestamps,
  cpuHistory,
  cores,
  overallCpu,
  userCpu,
  sysCpu,
  idleCpu,
}) => {
  // Chart.js Configuration for Streaming CPU Line Chart
  const lineChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Overall CPU %',
        data: cpuHistory,
        fill: true,
        borderColor: '#00f2ff',
        backgroundColor: 'rgba(0, 242, 255, 0.10)',
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#00f2ff',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(45, 51, 61, 0.7)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'monospace', size: 11 },
          callback: (value: string | number) => `${value}%`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { family: 'monospace', size: 10 },
          maxTicksLimit: 6,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#151921',
        borderColor: '#2d333d',
        borderWidth: 1,
        titleColor: '#f0f2f5',
        bodyColor: '#00f2ff',
        callbacks: {
          label: (context: { raw: unknown }) => ` CPU Load: ${context.raw}%`,
        },
      },
    },
  };

  // Chart.js Configuration for Per-Core Bar Chart
  const barChartData = {
    labels: cores.length > 0 ? cores.map((c) => `Core ${c.core}`) : ['Core 0', 'Core 1'],
    datasets: [
      {
        label: 'Utilization %',
        data: cores.length > 0 ? cores.map((c) => c.usage) : [0, 0],
        backgroundColor: cores.map((c) => (c.usage > 85 ? '#f43f5e' : c.usage > 65 ? '#f59e0b' : '#00f2ff')),
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(45, 51, 61, 0.7)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'monospace', size: 11 },
          callback: (value: string | number) => `${value}%`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'monospace', size: 11 },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#151921',
        borderColor: '#2d333d',
        borderWidth: 1,
        titleColor: '#f0f2f5',
        bodyColor: '#00f2ff',
        callbacks: {
          label: (context: { raw: unknown }) => ` Utilization: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time CPU History Line Chart */}
      <div
        id="cpu-line-chart-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Live CPU Resource Stream</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00f2ff]"></span>
              User: <span className="text-[#f0f2f5]">{userCpu}%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#bd00ff]"></span>
              Sys: <span className="text-[#f0f2f5]">{sysCpu}%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
              Idle: <span className="text-[#f0f2f5]">{idleCpu}%</span>
            </span>
          </div>
        </div>

        <div className="relative w-full h-64">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Sliding Window: 30 data points (1s/sample)</span>
          <span className="font-mono font-semibold text-[#00f2ff]">Current: {overallCpu}%</span>
        </div>
      </div>

      {/* Per-Core Multi-Thread Bar Chart */}
      <div
        id="cpu-cores-chart-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Per-Core CPU Distribution</h3>
          </div>
          <span className="text-xs font-mono text-[#94a3b8]">{cores.length} Logical Cores</span>
        </div>

        <div className="relative w-full h-64">
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Individual core load telemetry</span>
          <span className="text-xs text-[#00ff88] font-mono">Status: Nominal</span>
        </div>
      </div>
    </div>
  );
};
