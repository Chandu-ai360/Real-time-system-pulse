import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryPayload, SystemInfo, AlertConfig } from '../types';

const MAX_HISTORY_POINTS = 30;

export function useMetricsWebSocket() {
  const [currentMetrics, setCurrentMetrics] = useState<TelemetryPayload | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
  const [history, setHistory] = useState<{
    timestamps: string[];
    cpuOverall: number[];
    memoryUsedPercent: number[];
    netRxKbps: number[];
    netTxKbps: number[];
    diskReadKbps: number[];
    diskWriteKbps: number[];
  }>({
    timestamps: Array(MAX_HISTORY_POINTS).fill(''),
    cpuOverall: Array(MAX_HISTORY_POINTS).fill(0),
    memoryUsedPercent: Array(MAX_HISTORY_POINTS).fill(0),
    netRxKbps: Array(MAX_HISTORY_POINTS).fill(0),
    netTxKbps: Array(MAX_HISTORY_POINTS).fill(0),
    diskReadKbps: Array(MAX_HISTORY_POINTS).fill(0),
    diskWriteKbps: Array(MAX_HISTORY_POINTS).fill(0),
  });

  const [alerts, setAlerts] = useState<Array<{ id: string; time: string; message: string; type: 'warning' | 'critical' }>>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    cpuWarning: 75,
    cpuCritical: 90,
    memWarning: 80,
    memCritical: 90,
    soundEnabled: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimestampRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const playAlertSound = useCallback(() => {
    if (!alertConfig.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [alertConfig.soundEnabled]);

  const processIncomingMetrics = useCallback((payload: TelemetryPayload) => {
    if (isPausedRef.current) return;

    setCurrentMetrics(payload);
    setIsSimulatingLoad(!!payload.simulatedLoadActive);

    const now = new Date(payload.timestamp);
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Update historical sliding window
    setHistory((prev) => {
      const newTimestamps = [...prev.timestamps.slice(1), timeLabel];
      const newCpu = [...prev.cpuOverall.slice(1), payload.cpu.overall];
      const newMem = [...prev.memoryUsedPercent.slice(1), payload.memory.usedPercent];
      const newNetRx = [...prev.netRxKbps.slice(1), Math.round((payload.network.rxBytesPerSec / 1024) * 10) / 10];
      const newNetTx = [...prev.netTxKbps.slice(1), Math.round((payload.network.txBytesPerSec / 1024) * 10) / 10];
      const newDiskRead = [...prev.diskReadKbps.slice(1), Math.round((payload.disk.readBytesPerSec / 1024) * 10) / 10];
      const newDiskWrite = [...prev.diskWriteKbps.slice(1), Math.round((payload.disk.writeBytesPerSec / 1024) * 10) / 10];

      return {
        timestamps: newTimestamps,
        cpuOverall: newCpu,
        memoryUsedPercent: newMem,
        netRxKbps: newNetRx,
        netTxKbps: newNetTx,
        diskReadKbps: newDiskRead,
        diskWriteKbps: newDiskWrite,
      };
    });

    // Check alerts
    if (payload.cpu.overall >= alertConfig.cpuCritical) {
      const alertId = `cpu-crit-${payload.timestamp}`;
      setAlerts((prev) => [
        { id: alertId, time: timeLabel, message: `Critical CPU Utilization: ${payload.cpu.overall}% (Exceeds ${alertConfig.cpuCritical}%)`, type: 'critical' },
        ...prev.slice(0, 9),
      ]);
      playAlertSound();
    } else if (payload.cpu.overall >= alertConfig.cpuWarning) {
      const alertId = `cpu-warn-${payload.timestamp}`;
      setAlerts((prev) => [
        { id: alertId, time: timeLabel, message: `High CPU Load: ${payload.cpu.overall}% (Exceeds ${alertConfig.cpuWarning}%)`, type: 'warning' },
        ...prev.slice(0, 9),
      ]);
    }

    if (payload.memory.usedPercent >= alertConfig.memCritical) {
      const alertId = `mem-crit-${payload.timestamp}`;
      setAlerts((prev) => [
        { id: alertId, time: timeLabel, message: `Critical Memory Threshold: ${payload.memory.usedPercent}% (${payload.memory.usedMb} MB used)`, type: 'critical' },
        ...prev.slice(0, 9),
      ]);
      playAlertSound();
    }
  }, [alertConfig, playAlertSound]);

  // Connect WebSocket
  useEffect(() => {
    let isSubscribed = true;

    // Fetch initial hardware info via REST
    fetch('/api/system/info')
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (info && isSubscribed) setSystemInfo(info);
      })
      .catch(() => {});

    function connect() {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/metrics`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnectionStatus('connected');
          // Start ping cycle
          pingTimestampRef.current = Date.now();
          ws.send(JSON.stringify({ action: 'ping', timestamp: pingTimestampRef.current }));
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              const latency = Math.max(1, Date.now() - (data.timestamp || pingTimestampRef.current));
              setLatencyMs(latency);
            } else if (data.type === 'init') {
              if (data.systemInfo) setSystemInfo(data.systemInfo);
              if (data.metrics) processIncomingMetrics(data.metrics);
            } else if (data.type === 'telemetry') {
              processIncomingMetrics(data);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnectionStatus('disconnected');
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnectionStatus('disconnected');
          // Reconnect with backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) connect();
          }, 2500);
        };
      } catch {
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isSubscribed) connect();
        }, 3000);
      }
    }

    connect();

    // Periodic heartbeat ping every 4 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        pingTimestampRef.current = Date.now();
        wsRef.current.send(JSON.stringify({ action: 'ping', timestamp: pingTimestampRef.current }));
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [processIncomingMetrics]);

  // Stress load simulator trigger
  const triggerStressSimulation = async (duration = 10) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'simulate_spike', duration }));
      }
      const res = await fetch('/api/simulate-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      });
      if (res.ok) {
        setIsSimulatingLoad(true);
      }
    } catch (err) {
      console.error('Failed to trigger stress load:', err);
    }
  };

  const stopStressSimulation = async () => {
    try {
      await fetch('/api/simulate-load/stop', { method: 'POST' });
      setIsSimulatingLoad(false);
    } catch {
      setIsSimulatingLoad(false);
    }
  };

  const clearAlerts = () => setAlerts([]);

  return {
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
  };
}
