import React, { useState } from 'react';
import { Play, Check, Server, Terminal, ArrowRight } from 'lucide-react';

export const ApiDocsExplorer: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/api/metrics/current');
  const [responseJson, setResponseJson] = useState<string>('Click "Execute Query" to inspect live response payload.');
  const [isLoading, setIsLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const endpoints = [
    {
      path: '/api/metrics/current',
      method: 'GET',
      summary: 'Fetch current system telemetry snapshot',
      description: 'Returns real-time CPU %, per-core breakdown, RAM/Swap metrics, disk I/O, and top processes.',
    },
    {
      path: '/api/system/info',
      method: 'GET',
      summary: 'Hardware & OS Specifications',
      description: 'Returns hostname, kernel version, processor model, logical core count, and total physical RAM.',
    },
    {
      path: '/api/health',
      method: 'GET',
      summary: 'Service Health Status',
      description: 'Returns status ok, timestamp, and server uptime in seconds.',
    },
    {
      path: '/ws/metrics',
      method: 'WEBSOCKET',
      summary: 'Real-Time Bi-Directional Streaming',
      description: 'Streams JSON telemetry at 1000ms intervals. Accepts { action: "ping" } and control payloads.',
    },
  ];

  const handleExecute = async (path: string) => {
    if (path.startsWith('/ws')) {
      setResponseJson(
        JSON.stringify(
          {
            protocol: 'WebSocket (RFC 6455)',
            status: 'ACTIVE_STREAM',
            url: `ws://${window.location.host}/ws/metrics`,
            sample_payload: {
              type: 'telemetry',
              timestamp: Date.now(),
              cpu: { overall: 14.2, cores: [{ core: 0, usage: 12.1 }] },
              memory: { used_percent: 42.5, total_mb: 16384 },
            },
          },
          null,
          2
        )
      );
      setStatusCode(101);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(path);
      setStatusCode(res.status);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err) {
      setStatusCode(500);
      setResponseJson(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
            OpenAPI 3.1 • Interactive Playground
          </span>
          <h2 className="text-lg font-bold text-[#f0f2f5]">FastAPI REST & WebSocket Schema</h2>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Explore and interact with live telemetry REST endpoints and WebSocket protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Available Endpoints</h3>
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              onClick={() => {
                setActiveEndpoint(ep.path);
                handleExecute(ep.path);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeEndpoint === ep.path
                  ? 'bg-[#1c222d] border-[#00f2ff] shadow-md shadow-[#00f2ff]/10'
                  : 'bg-[#0b0e14] border-[#2d333d] hover:border-[#3d4553]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      ep.method === 'GET'
                        ? 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30'
                        : 'bg-[#bd00ff]/15 text-[#bd00ff] border border-[#bd00ff]/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-[#f0f2f5] font-semibold">{ep.path}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveEndpoint(ep.path);
                    handleExecute(ep.path);
                  }}
                  className="px-2.5 py-1 rounded bg-[#151921] hover:bg-[#1f2530] text-[#00f2ff] text-xs font-mono flex items-center gap-1 border border-[#2d333d] transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
              <p className="text-xs text-[#94a3b8] mt-2">{ep.description}</p>
            </div>
          ))}
        </div>

        {/* Live Response Viewer */}
        <div className="bg-[#0b0e14] border border-[#2d333d] rounded-xl flex flex-col overflow-hidden">
          <div className="bg-[#151921] px-4 py-2.5 border-b border-[#2d333d] flex items-center justify-between text-xs font-mono">
            <span className="text-[#94a3b8]">Target: <span className="text-[#f0f2f5]">{activeEndpoint}</span></span>
            {statusCode !== null && (
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  statusCode >= 200 && statusCode < 300
                    ? 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30'
                    : 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                }`}
              >
                HTTP {statusCode}
              </span>
            )}
          </div>
          <div className="p-4 flex-1 overflow-x-auto max-h-[380px] font-mono text-xs text-[#00ff88] bg-[#0b0e14] leading-relaxed">
            {isLoading ? <div className="text-[#94a3b8] animate-pulse">Executing request...</div> : <pre>{responseJson}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
};
