import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { NetworkMetric, DiskMetric } from '../types';
import { ArrowDownCircle, ArrowUpCircle, HardDrive, Network } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface NetworkDiskChartsProps {
  timestamps: string[];
  netRxKbps: number[];
  netTxKbps: number[];
  diskReadKbps: number[];
  diskWriteKbps: number[];
  network: NetworkMetric;
  disk: DiskMetric;
}

export const NetworkDiskCharts: React.FC<NetworkDiskChartsProps> = ({
  timestamps,
  netRxKbps,
  netTxKbps,
  diskReadKbps,
  diskWriteKbps,
  network,
  disk,
}) => {
  // Chart.js Network Line Chart
  const networkChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Rx (Download KB/s)',
        data: netRxKbps,
        fill: true,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.10)',
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'Tx (Upload KB/s)',
        data: netTxKbps,
        fill: true,
        borderColor: '#00f2ff',
        backgroundColor: 'rgba(0, 242, 255, 0.10)',
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(45, 51, 61, 0.7)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'monospace', size: 10 },
          callback: (value: string | number) => `${value} KB/s`,
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
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#151921',
        borderColor: '#2d333d',
        borderWidth: 1,
        titleColor: '#f0f2f5',
      },
    },
  };

  // Disk I/O Line Chart
  const diskChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Disk Read (KB/s)',
        data: diskReadKbps,
        borderColor: '#00f2ff',
        backgroundColor: 'rgba(0, 242, 255, 0.10)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'Disk Write (KB/s)',
        data: diskWriteKbps,
        borderColor: '#bd00ff',
        backgroundColor: 'rgba(189, 0, 255, 0.10)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Bandwidth Chart */}
      <div
        id="network-chart-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-[#00ff88]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Network Bandwidth I/O</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-[#00ff88]">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              {(network.rxBytesPerSec / 1024).toFixed(1)} KB/s
            </span>
            <span className="flex items-center gap-1 text-[#00f2ff]">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              {(network.txBytesPerSec / 1024).toFixed(1)} KB/s
            </span>
          </div>
        </div>

        <div className="relative w-full h-60">
          <Line data={networkChartData} options={chartOptions} />
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Cumulative: {network.totalRxMb} MB in • {network.totalTxMb} MB out</span>
          <span className="font-mono text-[#00ff88]">Active NIC</span>
        </div>
      </div>

      {/* Disk I/O Activity Chart */}
      <div
        id="disk-io-chart-container"
        className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Disk Storage & I/O Rates</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#00f2ff]">
              R: {(disk.readBytesPerSec / 1024).toFixed(1)} KB/s
            </span>
            <span className="text-[#bd00ff]">
              W: {(disk.writeBytesPerSec / 1024).toFixed(1)} KB/s
            </span>
          </div>
        </div>

        <div className="relative w-full h-60">
          <Line data={diskChartData} options={chartOptions} />
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d333d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Root Partition: {disk.totalUsedGb || 14.8} / {disk.totalSizeGb || 64.0} GB ({disk.usedPercent || 23}%)</span>
          <span className="font-mono text-[#00f2ff]">NVMe/SSD</span>
        </div>
      </div>
    </div>
  );
};
