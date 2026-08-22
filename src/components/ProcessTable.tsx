import React, { useState } from 'react';
import { ProcessItem } from '../types';
import { Terminal, Search, ArrowUpDown, RefreshCw, Cpu, Database } from 'lucide-react';

interface ProcessTableProps {
  processes: ProcessItem[];
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'cpuPercent' | 'memPercent' | 'pid'>('cpuPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'cpuPercent' | 'memPercent' | 'pid') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filtered = processes
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.pid.toString().includes(searchTerm))
    .sort((a, b) => {
      const mult = sortOrder === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

  return (
    <div className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#00f2ff]" />
          <div>
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#94a3b8]">Top System Processes</h3>
            <p className="text-xs text-[#64748b]">Live telemetry snapshot via psutil daemon</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="process-search-input"
            type="text"
            placeholder="Search process name or PID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#2d333d] text-xs text-[#f0f2f5] placeholder-[#64748b] focus:outline-none focus:border-[#00f2ff] font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#2d333d]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1a202c] text-[#94a3b8] font-mono uppercase text-[11px] border-b border-[#2d333d]">
            <tr>
              <th
                onClick={() => handleSort('pid')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-[#f0f2f5] transition-colors"
              >
                <div className="flex items-center gap-1">
                  PID
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 sm:px-4">Process Name</th>
              <th className="py-2.5 px-3 sm:px-4">User</th>
              <th className="py-2.5 px-3 sm:px-4">Status</th>
              <th
                onClick={() => handleSort('cpuPercent')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-[#f0f2f5] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#00f2ff]" />
                  CPU %
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('memPercent')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-[#f0f2f5] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#bd00ff]" />
                  RAM % (RSS)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d333d] font-mono">
            {filtered.length > 0 ? (
              filtered.map((proc) => (
                <tr key={proc.pid} className="hover:bg-[#1c222d] transition-colors">
                  <td className="py-2.5 px-3 sm:px-4 font-bold text-[#94a3b8]">#{proc.pid}</td>
                  <td className="py-2.5 px-3 sm:px-4 font-sans font-medium text-[#f0f2f5] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]"></span>
                    {proc.name}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 text-[#94a3b8]">{proc.user}</td>
                  <td className="py-2.5 px-3 sm:px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        proc.status === 'running'
                          ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30'
                          : 'bg-[#2d333d] text-[#94a3b8]'
                      }`}
                    >
                      {proc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 sm:px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold font-mono ${
                          proc.cpuPercent > 30
                            ? 'text-[#f43f5e]'
                            : proc.cpuPercent > 10
                            ? 'text-[#f59e0b]'
                            : 'text-[#00f2ff]'
                        }`}
                      >
                        {proc.cpuPercent}%
                      </span>
                      <div className="w-16 bg-[#0b0e14] rounded-full h-1 hidden sm:block overflow-hidden border border-[#2d333d]/50">
                        <div
                          className="bg-[#00f2ff] h-1 rounded-full"
                          style={{ width: `${Math.min(100, proc.cpuPercent * 2)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 text-[#bd00ff]">
                    {proc.memPercent}% <span className="text-[#64748b] text-[10px]">({proc.memRssMb} MB)</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[#64748b]">
                  No processes matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
