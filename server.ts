import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Simulation state
let isSimulatingLoad = false;
let simulationTimeout: NodeJS.Timeout | null = null;
let lastCpuUsage = os.cpus();
let lastCpuSampleTime = Date.now();
let cumulativeNetRx = 1024 * 1024 * 142; // Seeded initial bytes
let cumulativeNetTx = 1024 * 1024 * 84;

// Calculate accurate CPU % from os.cpus() deltas
function getCpuUsage(): { overall: number; cores: { core: number; usage: number }[]; user: number; system: number; idle: number } {
  const currentCpus = os.cpus();
  const currentTime = Date.now();
  const timeDelta = Math.max(1, currentTime - lastCpuSampleTime);

  let totalDiffAll = 0;
  let idleDiffAll = 0;
  let userDiffAll = 0;
  let sysDiffAll = 0;

  const cores = currentCpus.map((cpu, index) => {
    const prev = lastCpuUsage[index] || cpu;
    const prevTotal = Object.values(prev.times).reduce((a, b) => a + b, 0);
    const currTotal = Object.values(cpu.times).reduce((a, b) => a + b, 0);

    const totalDiff = currTotal - prevTotal;
    const idleDiff = cpu.times.idle - prev.times.idle;
    const userDiff = cpu.times.user - prev.times.user;
    const sysDiff = cpu.times.sys - prev.times.sys;

    totalDiffAll += totalDiff;
    idleDiffAll += idleDiff;
    userDiffAll += userDiff;
    sysDiffAll += sysDiff;

    const usage = totalDiff > 0 ? Math.max(0, Math.min(100, Math.round(((totalDiff - idleDiff) / totalDiff) * 1000) / 10)) : 5.0;
    return {
      core: index,
      usage: isSimulatingLoad ? Math.min(100, Math.round((usage + 65 + Math.random() * 25) * 10) / 10) : usage,
    };
  });

  lastCpuUsage = currentCpus;
  lastCpuSampleTime = currentTime;

  let overall = totalDiffAll > 0 ? Math.max(0, Math.min(100, Math.round(((totalDiffAll - idleDiffAll) / totalDiffAll) * 1000) / 10)) : 10.0;
  let userPct = totalDiffAll > 0 ? Math.round((userDiffAll / totalDiffAll) * 1000) / 10 : 7.0;
  let sysPct = totalDiffAll > 0 ? Math.round((sysDiffAll / totalDiffAll) * 1000) / 10 : 3.0;
  let idlePct = Math.max(0, Math.round((100 - overall) * 10) / 10);

  if (isSimulatingLoad) {
    overall = Math.min(99.4, Math.round((overall + 72 + Math.random() * 18) * 10) / 10);
    userPct = Math.round(overall * 0.75 * 10) / 10;
    sysPct = Math.round(overall * 0.25 * 10) / 10;
    idlePct = Math.max(0, Math.round((100 - overall) * 10) / 10);
  }

  return { overall, cores, user: userPct, system: sysPct, idle: idlePct };
}

// Generate active system metrics snapshot
function collectSystemMetrics() {
  const cpuMetrics = getCpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  let usedMem = totalMem - freeMem;

  if (isSimulatingLoad) {
    usedMem = Math.min(totalMem * 0.94, usedMem + totalMem * 0.45);
  }

  const totalMb = Math.round(totalMem / (1024 * 1024));
  const usedMb = Math.round(usedMem / (1024 * 1024));
  const freeMb = Math.max(0, totalMb - usedMb);
  const cachedMb = Math.round(totalMb * 0.18);
  const usedPercent = Math.round((usedMb / totalMb) * 1000) / 10;

  // Swap calculations
  const swapTotalMb = Math.round(totalMb * 0.5);
  const swapUsedMb = Math.round(isSimulatingLoad ? swapTotalMb * 0.62 : swapTotalMb * 0.12);
  const swapUsedPercent = Math.round((swapUsedMb / swapTotalMb) * 1000) / 10;

  // Network jitter simulation based on container activity
  const baseRx = isSimulatingLoad ? 2800000 : 450000;
  const baseTx = isSimulatingLoad ? 1600000 : 180000;
  const rxRate = Math.round(baseRx + (Math.random() * 200000 - 100000));
  const txRate = Math.round(baseTx + (Math.random() * 120000 - 60000));
  cumulativeNetRx += rxRate;
  cumulativeNetTx += txRate;

  // Disk I/O simulation
  const diskRead = isSimulatingLoad ? 4200000 + Math.random() * 1000000 : 150000 + Math.random() * 60000;
  const diskWrite = isSimulatingLoad ? 8500000 + Math.random() * 2000000 : 320000 + Math.random() * 90000;

  // Processes snapshot
  const processes = [
    {
      pid: 1042,
      name: 'uvicorn (FastAPI Worker)',
      cpuPercent: isSimulatingLoad ? 48.6 : 3.2,
      memPercent: 4.8,
      memRssMb: 142.5,
      status: 'running' as const,
      user: 'appuser',
    },
    {
      pid: 891,
      name: 'node (Telemetry Bridge)',
      cpuPercent: isSimulatingLoad ? 22.4 : 1.8,
      memPercent: 3.5,
      memRssMb: 108.2,
      status: 'running' as const,
      user: 'appuser',
    },
    {
      pid: 412,
      name: 'python (psutil daemon)',
      cpuPercent: isSimulatingLoad ? 18.2 : 0.9,
      memPercent: 2.1,
      memRssMb: 64.0,
      status: 'sleeping' as const,
      user: 'root',
    },
    {
      pid: 1,
      name: 'systemd / init',
      cpuPercent: 0.1,
      memPercent: 0.8,
      memRssMb: 24.3,
      status: 'sleeping' as const,
      user: 'root',
    },
    {
      pid: 580,
      name: 'containerd-shim',
      cpuPercent: isSimulatingLoad ? 6.5 : 0.2,
      memPercent: 1.4,
      memRssMb: 42.1,
      status: 'sleeping' as const,
      user: 'root',
    },
    {
      pid: 924,
      name: 'kworker/u16:2',
      cpuPercent: 0.0,
      memPercent: 0.0,
      memRssMb: 0.0,
      status: 'idle' as const,
      user: 'root',
    },
  ];

  let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (cpuMetrics.overall > 90 || usedPercent > 90) {
    alertLevel = 'critical';
  } else if (cpuMetrics.overall > 75 || usedPercent > 80) {
    alertLevel = 'warning';
  }

  return {
    type: 'telemetry',
    timestamp: Date.now(),
    uptimeSeconds: Math.round(os.uptime()),
    loadAverage: os.loadavg() as [number, number, number],
    cpu: cpuMetrics,
    memory: {
      totalMb,
      usedMb,
      freeMb,
      cachedMb,
      usedPercent,
      swapTotalMb,
      swapUsedMb,
      swapUsedPercent,
    },
    network: {
      rxBytesPerSec: Math.max(0, rxRate),
      txBytesPerSec: Math.max(0, txRate),
      totalRxMb: Math.round((cumulativeNetRx / (1024 * 1024)) * 100) / 100,
      totalTxMb: Math.round((cumulativeNetTx / (1024 * 1024)) * 100) / 100,
    },
    disk: {
      readBytesPerSec: Math.round(diskRead),
      writeBytesPerSec: Math.round(diskWrite),
      totalUsedGb: 14.8,
      totalSizeGb: 64.0,
      usedPercent: 23.1,
    },
    processes,
    alertLevel,
    simulatedLoadActive: isSimulatingLoad,
  };
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

app.get('/api/system/info', (req, res) => {
  const cpus = os.cpus();
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    osRelease: os.release(),
    cpuModel: cpus[0]?.model || 'Generic x86_64 Processor',
    cpuCount: cpus.length || 1,
    cpuSpeedMhz: cpus[0]?.speed || 2400,
    totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    nodeVersion: process.version,
    pythonFastApiCompatible: true,
  });
});

app.get('/api/metrics/current', (req, res) => {
  res.json(collectSystemMetrics());
});

app.post('/api/simulate-load', (req, res) => {
  const durationSeconds = req.body?.duration || 10;
  isSimulatingLoad = true;

  if (simulationTimeout) {
    clearTimeout(simulationTimeout);
  }

  simulationTimeout = setTimeout(() => {
    isSimulatingLoad = false;
    simulationTimeout = null;
  }, durationSeconds * 1000);

  res.json({
    success: true,
    message: `Stress simulation active for ${durationSeconds} seconds`,
    active: true,
  });
});

app.post('/api/simulate-load/stop', (req, res) => {
  isSimulatingLoad = false;
  if (simulationTimeout) {
    clearTimeout(simulationTimeout);
    simulationTimeout = null;
  }
  res.json({ success: true, active: false });
});

// WebSocket Server Integration
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected to telemetry stream.');

  // Send initial hardware info & metrics
  const cpus = os.cpus();
  const initPayload = {
    type: 'init',
    systemInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      osRelease: os.release(),
      cpuModel: cpus[0]?.model || 'Generic Processor',
      cpuCount: cpus.length,
      cpuSpeedMhz: cpus[0]?.speed || 2400,
      totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    },
    metrics: collectSystemMetrics(),
  };
  ws.send(JSON.stringify(initPayload));

  // Handle incoming control messages from client
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
      } else if (data.action === 'simulate_spike') {
        isSimulatingLoad = true;
        setTimeout(() => {
          isSimulatingLoad = false;
        }, (data.duration || 8) * 1000);
      }
    } catch {
      // Ignored malformed message
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected.');
  });
});

// Broadcast metrics to all connected clients every 1000ms
setInterval(() => {
  if (wss.clients.size > 0) {
    const payload = JSON.stringify(collectSystemMetrics());
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}, 1000);

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Real-Time Telemetry Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
