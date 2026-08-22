import { ProjectFile } from './types';

export const FASTAPI_PROJECT_FILES: ProjectFile[] = [
  {
    name: 'main.py',
    path: 'main.py',
    language: 'python',
    description: 'FastAPI core application entry point, WebSocket broadcast loop, and route handlers.',
    content: `"""
Real-Time System Metrics Monitor
Backend: Python 3.10+ with FastAPI, WebSockets, and psutil
"""
import asyncio
import json
import logging
from typing import List, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from metrics_collector import MetricsCollector

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("system_monitor")

app = FastAPI(
    title="Real-Time System Metrics Monitor",
    description="Stream real-time CPU, Memory, Disk, and Network telemetry via WebSockets to Chart.js dashboard.",
    version="1.0.0",
)

# CORS middleware for cross-origin dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize metrics collector
collector = MetricsCollector()


class ConnectionManager:
    """Manages active WebSocket client connections and broadcasting."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as exc:
                logger.warning(f"Error sending message to client: {exc}")
                dead_connections.add(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()
broadcast_interval_seconds: float = 1.0


@app.on_event("startup")
async def startup_event():
    """Starts the background telemetry gathering and broadcast loop."""
    logger.info("Starting background system telemetry broadcast worker...")
    asyncio.create_task(telemetry_worker())


async def telemetry_worker():
    """Background async worker that queries psutil and broadcasts to all WebSocket clients."""
    while True:
        try:
            if manager.active_connections:
                metrics = collector.get_all_metrics()
                await manager.broadcast(metrics)
        except Exception as e:
            logger.error(f"Error in telemetry broadcast worker: {e}")
        await asyncio.sleep(broadcast_interval_seconds)


@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    """Serves the responsive Chart.js real-time monitoring dashboard."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/metrics", response_class=JSONResponse)
async def get_metrics_snapshot():
    """REST API endpoint to fetch a single current telemetry snapshot."""
    return collector.get_all_metrics()


@app.get("/api/system-info", response_class=JSONResponse)
async def get_system_info():
    """REST API endpoint to retrieve static hardware & OS metadata."""
    return collector.get_system_info()


@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming.
    Clients can send JSON commands to adjust sample rates or request immediate bursts.
    """
    await manager.connect(websocket)
    # Send initial system metadata & snapshot immediately
    try:
        init_payload = {
            "type": "init",
            "system_info": collector.get_system_info(),
            "metrics": collector.get_all_metrics(),
        }
        await websocket.send_text(json.dumps(init_payload))
        
        while True:
            # Listen for client control messages (e.g. rate changes or ping)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                if action == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "timestamp": msg.get("timestamp")}))
                elif action == "set_interval":
                    new_rate = max(0.2, min(10.0, float(msg.get("interval", 1.0))))
                    logger.info(f"Client requested broadcast rate change: {new_rate}s")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`
  },
  {
    name: 'metrics_collector.py',
    path: 'metrics_collector.py',
    language: 'python',
    description: 'System telemetry extraction using Python psutil library for CPU, Memory, Disk, and Network.',
    content: `"""
Telemetry Collector Module
Extracts hardware metrics using psutil and standard library modules.
"""
import time
import platform
import psutil
from typing import Dict, Any, List


class MetricsCollector:
    def __init__(self):
        # Prime psutil CPU calculation
        psutil.cpu_percent(interval=None, percpu=True)
        self.last_disk_io = psutil.disk_io_counters()
        self.last_net_io = psutil.net_io_counters()
        self.last_time = time.time()
        self.boot_time = psutil.boot_time()

    def get_system_info(self) -> Dict[str, Any]:
        """Returns static hardware and OS specifications."""
        uname = platform.uname()
        mem = psutil.virtual_memory()
        return {
            "hostname": uname.node,
            "os": f"{uname.system} {uname.release}",
            "architecture": uname.machine,
            "processor": uname.processor or "Generic CPU",
            "cpu_physical_cores": psutil.cpu_count(logical=False) or 1,
            "cpu_logical_cores": psutil.cpu_count(logical=True) or 1,
            "total_memory_mb": round(mem.total / (1024 * 1024), 2),
            "boot_time": self.boot_time,
        }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Collects dynamic metrics across CPU, RAM, Disk, Network, and Top Processes."""
        current_time = time.time()
        time_delta = max(0.001, current_time - self.last_time)

        # 1. CPU Usage
        per_cpu = psutil.cpu_percent(interval=None, percpu=True)
        overall_cpu = round(sum(per_cpu) / len(per_cpu), 1) if per_cpu else 0.0
        cpu_times_percent = psutil.cpu_times_percent(interval=None)

        # 2. Virtual & Swap Memory
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()

        # 3. Disk I/O Rates
        disk_io = psutil.disk_io_counters()
        read_bytes_sec = 0.0
        write_bytes_sec = 0.0
        if disk_io and self.last_disk_io:
            read_bytes_sec = max(0.0, (disk_io.read_bytes - self.last_disk_io.read_bytes) / time_delta)
            write_bytes_sec = max(0.0, (disk_io.write_bytes - self.last_disk_io.write_bytes) / time_delta)
        self.last_disk_io = disk_io

        # 4. Network I/O Rates
        net_io = psutil.net_io_counters()
        rx_bytes_sec = 0.0
        tx_bytes_sec = 0.0
        if net_io and self.last_net_io:
            rx_bytes_sec = max(0.0, (net_io.bytes_recv - self.last_net_io.bytes_recv) / time_delta)
            tx_bytes_sec = max(0.0, (net_io.bytes_sent - self.last_net_io.bytes_sent) / time_delta)
        self.last_net_io = net_io
        self.last_time = current_time

        # 5. Top 5 CPU Processes
        processes: List[Dict[str, Any]] = []
        try:
            for p in sorted(
                psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info', 'status', 'username']),
                key=lambda x: (x.info.get('cpu_percent') or 0),
                reverse=True
            )[:6]:
                info = p.info
                mem_rss = info.get('memory_info')
                processes.append({
                    "pid": info.get('pid', 0),
                    "name": info.get('name', 'unknown') or 'unknown',
                    "cpu_percent": round(info.get('cpu_percent') or 0.0, 1),
                    "mem_percent": round(info.get('memory_percent') or 0.0, 1),
                    "mem_rss_mb": round((mem_rss.rss / (1024 * 1024)) if mem_rss else 0.0, 1),
                    "status": str(info.get('status', 'running')),
                    "user": str(info.get('username', 'system')),
                })
        except Exception:
            pass

        # Alert level determination
        alert_level = "normal"
        if overall_cpu > 90 or mem.percent > 90:
            alert_level = "critical"
        elif overall_cpu > 75 or mem.percent > 80:
            alert_level = "warning"

        return {
            "type": "telemetry",
            "timestamp": int(current_time * 1000),
            "uptime_seconds": int(current_time - self.boot_time),
            "load_average": list(psutil.getloadavg()) if hasattr(psutil, "getloadavg") else [0.0, 0.0, 0.0],
            "cpu": {
                "overall": overall_cpu,
                "user": round(getattr(cpu_times_percent, 'user', 0.0), 1),
                "system": round(getattr(cpu_times_percent, 'system', 0.0), 1),
                "idle": round(getattr(cpu_times_percent, 'idle', 0.0), 1),
                "cores": [{"core": idx, "usage": val} for idx, val in enumerate(per_cpu)],
            },
            "memory": {
                "total_mb": round(mem.total / (1024 * 1024), 1),
                "used_mb": round(mem.used / (1024 * 1024), 1),
                "free_mb": round(mem.available / (1024 * 1024), 1),
                "cached_mb": round((getattr(mem, 'cached', 0) or 0) / (1024 * 1024), 1),
                "used_percent": round(mem.percent, 1),
                "swap_total_mb": round(swap.total / (1024 * 1024), 1),
                "swap_used_mb": round(swap.used / (1024 * 1024), 1),
                "swap_used_percent": round(swap.percent, 1),
            },
            "network": {
                "rx_bytes_per_sec": round(rx_bytes_sec, 1),
                "tx_bytes_per_sec": round(tx_bytes_sec, 1),
                "total_rx_mb": round(net_io.bytes_recv / (1024 * 1024), 2) if net_io else 0.0,
                "total_tx_mb": round(net_io.bytes_sent / (1024 * 1024), 2) if net_io else 0.0,
            },
            "disk": {
                "read_bytes_per_sec": round(read_bytes_sec, 1),
                "write_bytes_per_sec": round(write_bytes_sec, 1),
            },
            "processes": processes,
            "alert_level": alert_level,
        }
`
  },
  {
    name: 'templates/index.html',
    path: 'templates/index.html',
    language: 'html',
    description: 'FastAPI Jinja2 HTML5 responsive dashboard with Chart.js 4.x CDN and WebSocket client script.',
    content: `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>System Metrics Monitor - FastAPI & Chart.js</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body class="min-h-full font-sans antialiased bg-slate-950 text-slate-100 flex flex-col">
  <!-- Top Navigation Header -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          ⚡
        </div>
        <div>
          <h1 class="text-base font-semibold text-white tracking-tight">FastAPI System Telemetry</h1>
          <p class="text-xs text-slate-400">WebSocket Live Stream &bull; Chart.js Render</p>
        </div>
      </div>
      
      <!-- Connection Status Badge -->
      <div class="flex items-center space-x-3">
        <div id="statusBadge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span id="statusText">Connecting...</span>
        </div>
        <span id="latencyText" class="text-xs text-slate-400 font-mono">-- ms</span>
      </div>
    </div>
  </header>

  <!-- Main Content Grid -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
    <!-- Quick Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="flex justify-between items-start">
          <span class="text-xs font-medium text-slate-400">CPU Usage</span>
          <span class="text-xs font-mono text-cyan-400" id="cpuLoadAvg">Avg: 0.0</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-bold tracking-tight text-cyan-400" id="cpuVal">0%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
          <div id="cpuBar" class="bg-cyan-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="flex justify-between items-start">
          <span class="text-xs font-medium text-slate-400">Memory RAM</span>
          <span class="text-xs font-mono text-purple-400" id="memDetails">0 / 0 MB</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-bold tracking-tight text-purple-400" id="memVal">0%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
          <div id="memBar" class="bg-purple-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="flex justify-between items-start">
          <span class="text-xs font-medium text-slate-400">Network Throughput</span>
          <span class="text-xs font-mono text-emerald-400">I/O</span>
        </div>
        <div class="mt-2">
          <div class="text-sm font-semibold text-emerald-400 flex items-center gap-1">
            ↓ <span id="netRx">0 KB/s</span>
          </div>
          <div class="text-sm font-semibold text-emerald-500/80 flex items-center gap-1">
            ↑ <span id="netTx">0 KB/s</span>
          </div>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="flex justify-between items-start">
          <span class="text-xs font-medium text-slate-400">System Uptime</span>
          <span class="text-xs font-mono text-amber-400" id="hostnameBadge">Host</span>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold tracking-tight text-amber-400 font-mono" id="uptimeVal">00:00:00</div>
          <div class="text-xs text-slate-500 mt-1" id="osBadge">Linux</div>
        </div>
      </div>
    </div>

    <!-- Charts Section (Responsive 2-Col) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CPU Realtime History Line Chart -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-slate-200">CPU Usage Over Time (%)</h2>
          <span class="text-xs text-slate-500">Live 30s Buffer</span>
        </div>
        <div class="relative flex-1 min-h-[260px]">
          <canvas id="cpuLineChart"></canvas>
        </div>
      </div>

      <!-- Memory Allocation Breakdown Doughnut & Swap -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-slate-200">Memory Allocation (RAM & Swap)</h2>
          <span class="text-xs text-slate-500">Current Split</span>
        </div>
        <div class="relative flex-1 min-h-[260px] flex items-center justify-center">
          <canvas id="memoryDoughnutChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Network & Per-Core Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Per-Core Utilization Bar Chart -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-slate-200">Per-Core CPU Load</h2>
          <span class="text-xs text-slate-500">Multi-Core Bar</span>
        </div>
        <div class="relative flex-1 min-h-[240px]">
          <canvas id="coresBarChart"></canvas>
        </div>
      </div>

      <!-- Network Streaming Chart -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-slate-200">Network Traffic (KB/s)</h2>
          <span class="text-xs text-slate-500">Rx / Tx Rates</span>
        </div>
        <div class="relative flex-1 min-h-[240px]">
          <canvas id="networkLineChart"></canvas>
        </div>
      </div>
    </div>
  </main>

  <script src="/static/app.js"></script>
</body>
</html>
`
  },
  {
    name: 'static/app.js',
    path: 'static/app.js',
    language: 'javascript',
    description: 'Chart.js streaming charts setup and WebSocket auto-reconnecting client.',
    content: `// Chart.js Configuration & WebSocket Client for FastAPI Monitor
let cpuChart, memoryChart, coresChart, networkChart;
const MAX_DATA_POINTS = 30;

const labels = Array.from({ length: MAX_DATA_POINTS }, () => '');
const cpuHistory = Array(MAX_DATA_POINTS).fill(0);
const netRxHistory = Array(MAX_DATA_POINTS).fill(0);
const netTxHistory = Array(MAX_DATA_POINTS).fill(0);

// Initialize Chart.js Instances
function initCharts() {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#1e293b';

  // 1. CPU History Line Chart
  const cpuCtx = document.getElementById('cpuLineChart').getContext('2d');
  cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'CPU %',
        data: cpuHistory,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { callback: v => v + '%' } },
        x: { display: false }
      },
      plugins: { legend: { display: false } },
      animation: { duration: 300 }
    }
  });

  // 2. Memory Allocation Doughnut Chart
  const memCtx = document.getElementById('memoryDoughnutChart').getContext('2d');
  memoryChart = new Chart(memCtx, {
    type: 'doughnut',
    data: {
      labels: ['Used RAM', 'Cached', 'Free RAM'],
      datasets: [{
        data: [0, 0, 100],
        backgroundColor: ['#a855f7', '#6366f1', '#1e293b'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } }
      }
    }
  });

  // 3. Per Core Bar Chart
  const coresCtx = document.getElementById('coresBarChart').getContext('2d');
  coresChart = new Chart(coresCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Core Load %',
        data: [],
        backgroundColor: '#38bdf8',
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 4. Network Rate Chart
  const netCtx = document.getElementById('networkLineChart').getContext('2d');
  networkChart = new Chart(netCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rx (Download)',
          data: netRxHistory,
          borderColor: '#10b981',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Tx (Upload)',
          data: netTxHistory,
          borderColor: '#f59e0b',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => v + ' KB/s' } },
        x: { display: false }
      },
      plugins: { legend: { position: 'top' } }
    }
  });
}

// WebSocket Connection Management
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = \`\${protocol}//\${window.location.host}/ws/metrics\`;
  const ws = new WebSocket(wsUrl);

  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const latencyText = document.getElementById('latencyText');

  let pingTimestamp = 0;

  ws.onopen = () => {
    statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    statusText.innerText = 'Connected';
    
    // Heartbeat ping every 5s
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        pingTimestamp = Date.now();
        ws.send(JSON.stringify({ action: 'ping', timestamp: pingTimestamp }));
      }
    }, 5000);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'pong') {
      const latency = Date.now() - data.timestamp;
      latencyText.innerText = \`\${latency} ms\`;
      return;
    }

    if (data.type === 'init') {
      document.getElementById('hostnameBadge').innerText = data.system_info.hostname;
      document.getElementById('osBadge').innerText = data.system_info.os;
    }

    if (data.type === 'telemetry') {
      updateDashboard(data);
    }
  };

  ws.onclose = () => {
    statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20';
    statusText.innerText = 'Disconnected - Retrying...';
    setTimeout(connectWebSocket, 3000);
  };
}

function updateDashboard(m) {
  // Update Top Metric Numbers
  document.getElementById('cpuVal').innerText = \`\${m.cpu.overall}%\`;
  document.getElementById('cpuBar').style.width = \`\${m.cpu.overall}%\`;
  document.getElementById('cpuLoadAvg').innerText = \`Avg: \${m.load_average[0].toFixed(2)}\`;

  document.getElementById('memVal').innerText = \`\${m.memory.used_percent}%\`;
  document.getElementById('memBar').style.width = \`\${m.memory.used_percent}%\`;
  document.getElementById('memDetails').innerText = \`\${Math.round(m.memory.used_mb)} / \${Math.round(m.memory.total_mb)} MB\`;

  document.getElementById('netRx').innerText = \`\${(m.network.rx_bytes_per_sec / 1024).toFixed(1)} KB/s\`;
  document.getElementById('netTx').innerText = \`\${(m.network.tx_bytes_per_sec / 1024).toFixed(1)} KB/s\`;

  // Format Uptime
  const s = m.uptime_seconds;
  const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
  const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(s % 60).toString().padStart(2, '0');
  document.getElementById('uptimeVal').innerText = \`\${hrs}:\${mins}:\${secs}\`;

  // Update Charts
  // 1. CPU Line Chart
  cpuHistory.shift();
  cpuHistory.push(m.cpu.overall);
  cpuChart.update();

  // 2. Memory Doughnut
  memoryChart.data.datasets[0].data = [m.memory.used_mb, m.memory.cached_mb, m.memory.free_mb];
  memoryChart.update();

  // 3. Cores Bar Chart
  coresChart.data.labels = m.cpu.cores.map(c => \`Core \${c.core}\`);
  coresChart.data.datasets[0].data = m.cpu.cores.map(c => c.usage);
  coresChart.update();

  // 4. Network Line Chart
  netRxHistory.shift();
  netRxHistory.push((m.network.rx_bytes_per_sec / 1024).toFixed(1));
  netTxHistory.shift();
  netTxHistory.push((m.network.tx_bytes_per_sec / 1024).toFixed(1));
  networkChart.update();
}

window.addEventListener('DOMContentLoaded', () => {
  initCharts();
  connectWebSocket();
});
`
  },
  {
    name: 'requirements.txt',
    path: 'requirements.txt',
    language: 'text',
    description: 'Python package dependencies for FastAPI, Uvicorn, and psutil telemetry.',
    content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
psutil>=5.9.8
websockets>=12.0
jinja2>=3.1.3
`
  },
  {
    name: 'Dockerfile',
    path: 'Dockerfile',
    language: 'dockerfile',
    description: 'Multi-stage lightweight container deployment for the FastAPI real-time monitor.',
    content: `FROM python:3.11-slim

WORKDIR /app

# Install system utilities needed for psutil build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`
  },
  {
    name: 'docker-compose.yml',
    path: 'docker-compose.yml',
    language: 'yaml',
    description: 'Docker Compose orchestration file with host PID sharing for true host telemetry.',
    content: `version: '3.8'

services:
  system-monitor:
    build: .
    container_name: fastapi-metrics-monitor
    ports:
      - "8000:8000"
    pid: "host" # Allows monitoring host OS processes and CPU usage
    restart: unless-stopped
    environment:
      - PYTHONUNBUFFERED=1
`
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Complete documentation, quickstart commands, and architectural diagram.',
    content: `# Real-Time System Metrics Monitor (FastAPI + WebSockets + Chart.js)

A high-performance real-time telemetry monitoring project built with **Python FastAPI**, **psutil**, **WebSockets**, and a responsive **Chart.js** dashboard.

## Features
- ⚡ **Asynchronous WebSocket Streaming**: High-frequency, low-latency push notifications of system hardware stats.
- 📊 **Chart.js Responsive Visualizations**: Live CPU history, memory allocations (RAM + Swap), per-core breakdown, and network I/O.
- 📱 **Mobile & Desktop Responsive**: Fluid responsive grid designed with modern Tailwind CSS.
- 🖥️ **psutil Telemetry**: Accurate CPU times, load averages, memory buffers/cache, network throughput, and top active processes.

## Quickstart

\`\`\`bash
# 1. Clone or extract project
cd fastapi-system-monitor

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Launch FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

Open your browser at [http://localhost:8000](http://localhost:8000) to view the live dashboard!
`
  }
];
