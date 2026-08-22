import React, { useState } from 'react';
import { FASTAPI_PROJECT_FILES } from '../fastapiProjectSource';
import { FileCode, Copy, Check, Download, ExternalLink, Terminal, Layers, ArrowRight, Play } from 'lucide-react';

export const FastApiExplorer: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState('main.py');
  const [copiedFile, setCopiedFile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'architecture' | 'quickstart'>('code');

  const selectedFile = FASTAPI_PROJECT_FILES.find((f) => f.name === selectedFileName) || FASTAPI_PROJECT_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate a single bundled README + files text file
    let fullBundle = `# Complete Python FastAPI System Metrics Monitor\n# Generated Project Package\n\n`;
    FASTAPI_PROJECT_FILES.forEach((f) => {
      fullBundle += `\n=======================================================\n`;
      fullBundle += `FILE: ${f.path}\n`;
      fullBundle += `DESCRIPTION: ${f.description}\n`;
      fullBundle += `=======================================================\n\n`;
      fullBundle += f.content;
      fullBundle += `\n\n`;
    });

    const blob = new Blob([fullBundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fastapi-metrics-monitor-package.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Header & Sub-tab navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2d333d]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
              Python 3.10+ • FastAPI • psutil
            </span>
            <h2 className="text-lg font-bold text-[#f0f2f5]">FastAPI Telemetry Project</h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Complete, runnable Python backend architecture streaming system metrics via WebSockets to Chart.js.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub Navigation */}
          <div className="inline-flex p-1 rounded-lg bg-[#0b0e14] border border-[#2d333d] text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeSubTab === 'code' ? 'bg-[#00f2ff] text-[#0b0e14] font-bold shadow-sm' : 'text-[#94a3b8] hover:text-[#f0f2f5]'
              }`}
            >
              Source Files ({FASTAPI_PROJECT_FILES.length})
            </button>
            <button
              onClick={() => setActiveSubTab('architecture')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeSubTab === 'architecture' ? 'bg-[#00f2ff] text-[#0b0e14] font-bold shadow-sm' : 'text-[#94a3b8] hover:text-[#f0f2f5]'
              }`}
            >
              Architecture & Flow
            </button>
            <button
              onClick={() => setActiveSubTab('quickstart')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeSubTab === 'quickstart' ? 'bg-[#00f2ff] text-[#0b0e14] font-bold shadow-sm' : 'text-[#94a3b8] hover:text-[#f0f2f5]'
              }`}
            >
              CLI Quickstart
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-[#252c3b] border border-[#2d333d] text-[#00f2ff] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Package
          </button>
        </div>
      </div>

      {/* Code Viewer View */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* File Tree Sidebar */}
          <div className="lg:col-span-1 bg-[#0b0e14] border border-[#2d333d] rounded-lg p-3 space-y-1">
            <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider px-2 py-1 mb-1">
              Project Structure
            </div>
            {FASTAPI_PROJECT_FILES.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileName(file.name)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFileName === file.name
                    ? 'bg-[#00f2ff]/15 text-[#00f2ff] font-semibold border border-[#00f2ff]/30'
                    : 'text-[#94a3b8] hover:text-[#f0f2f5] hover:bg-[#151921]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-[#00f2ff]" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-[10px] uppercase text-[#64748b]">{file.language}</span>
              </button>
            ))}
          </div>

          {/* Main Code Editor Box */}
          <div className="lg:col-span-3 bg-[#0b0e14] border border-[#2d333d] rounded-lg overflow-hidden flex flex-col">
            <div className="bg-[#151921] px-4 py-2.5 border-b border-[#2d333d] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#f0f2f5]">{selectedFile.path}</span>
                <p className="text-[11px] text-[#94a3b8]">{selectedFile.description}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-[#1a202c] hover:bg-[#252c3b] text-[#f0f2f5] text-xs font-mono flex items-center gap-1.5 border border-[#2d333d] transition-colors"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
                <span>{copiedFile ? 'Copied!' : 'Copy File'}</span>
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[520px] font-mono text-xs text-[#cbd5e1] leading-relaxed bg-[#0b0e14]">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Architecture & Flow View */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#2d333d]">
              <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 flex items-center justify-center font-bold mb-3 font-mono">
                1
              </div>
              <h4 className="text-sm font-semibold text-[#f0f2f5]">psutil Telemetry Sampling</h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Queries physical & logical CPU cores, RAM virtual memory percentages, swap memory, disk I/O delta, and active processes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#2d333d]">
              <div className="w-8 h-8 rounded-lg bg-[#bd00ff]/10 text-[#bd00ff] border border-[#bd00ff]/20 flex items-center justify-center font-bold mb-3 font-mono">
                2
              </div>
              <h4 className="text-sm font-semibold text-[#f0f2f5]">FastAPI Async Broadcast Loop</h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                An asynchronous worker (`asyncio.create_task`) pushes JSON frames to all connected WebSockets (`/ws/metrics`) without blocking HTTP routes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#2d333d]">
              <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 flex items-center justify-center font-bold mb-3 font-mono">
                3
              </div>
              <h4 className="text-sm font-semibold text-[#f0f2f5]">Chart.js Real-Time Rendering</h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Maintains rolling buffers for smooth Bézier curves, dynamic doughnut updates, and instant per-core responsiveness on mobile & desktop.
              </p>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="p-4 sm:p-6 rounded-xl bg-[#0b0e14] border border-[#2d333d] font-mono text-xs">
            <div className="text-[#94a3b8] mb-3 font-semibold text-xs uppercase tracking-wider">
              Data Pipeline & WebSocket Handshake Architecture:
            </div>
            <div className="p-4 bg-[#151921] rounded-lg border border-[#2d333d] text-[#00f2ff] leading-loose overflow-x-auto">
              <div>[OS Kernel / Hardware] ──(psutil C-bindings)──&gt; [MetricsCollector.get_all_metrics()]</div>
              <div className="text-[#64748b] pl-8">│ (1000ms async polling)</div>
              <div>[FastAPI Event Loop] ──────(JSON serialization)───&gt; [ConnectionManager.broadcast()]</div>
              <div className="text-[#64748b] pl-8">│ (WSS / WS socket)</div>
              <div>[Browser Client] ─────────(ws.onmessage)──────────&gt; [Chart.js line & doughnut updates]</div>
            </div>
          </div>
        </div>
      )}

      {/* CLI Quickstart View */}
      {activeSubTab === 'quickstart' && (
        <div className="space-y-4">
          <div className="bg-[#0b0e14] border border-[#2d333d] rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-[#00f2ff] font-bold">
              <Terminal className="w-4 h-4" />
              <span>Standard Python 3 Setup:</span>
            </div>
            <div className="p-3 bg-[#151921] rounded border border-[#2d333d] text-[#cbd5e1] overflow-x-auto">
              <p className="text-[#64748b]"># 1. Create and activate Python virtual environment</p>
              <p>python3 -m venv venv</p>
              <p>source venv/bin/activate  <span className="text-[#64748b]"># Windows: venv\Scripts\activate</span></p>
              <p className="text-[#64748b] mt-2"># 2. Install dependencies</p>
              <p>pip install fastapi uvicorn psutil websockets jinja2</p>
              <p className="text-[#64748b] mt-2"># 3. Launch FastAPI server with live reload</p>
              <p className="text-[#00ff88] font-bold">uvicorn main:app --reload --host 0.0.0.0 --port 8000</p>
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-[#2d333d] rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-[#bd00ff] font-bold">
              <Layers className="w-4 h-4" />
              <span>Docker One-Command Deployment:</span>
            </div>
            <div className="p-3 bg-[#151921] rounded border border-[#2d333d] text-[#cbd5e1] overflow-x-auto">
              <p className="text-[#64748b]"># Run container with host PID access for complete hardware monitoring</p>
              <p className="text-[#bd00ff]">docker-compose up --build -d</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
