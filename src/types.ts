export interface CpuCoreMetric {
  core: number;
  usage: number;
}

export interface MemoryMetric {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  cachedMb?: number;
  usedPercent: number;
  swapTotalMb?: number;
  swapUsedMb?: number;
  swapUsedPercent?: number;
}

export interface NetworkMetric {
  rxBytesPerSec: number;
  txBytesPerSec: number;
  totalRxMb: number;
  totalTxMb: number;
}

export interface DiskMetric {
  readBytesPerSec: number;
  writeBytesPerSec: number;
  totalUsedGb?: number;
  totalSizeGb?: number;
  usedPercent?: number;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  memRssMb: number;
  status: 'running' | 'sleeping' | 'idle' | 'zombie';
  user: string;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  osRelease: string;
  cpuModel: string;
  cpuCount: number;
  cpuSpeedMhz: number;
  totalMemoryMb: number;
  nodeVersion: string;
  pythonFastApiCompatible: boolean;
}

export interface TelemetryPayload {
  timestamp: number;
  uptimeSeconds: number;
  loadAverage: [number, number, number];
  cpu: {
    overall: number;
    user: number;
    system: number;
    idle: number;
    cores: CpuCoreMetric[];
  };
  memory: MemoryMetric;
  network: NetworkMetric;
  disk: DiskMetric;
  processes: ProcessItem[];
  alertLevel: 'normal' | 'warning' | 'critical';
  simulatedLoadActive?: boolean;
}

export interface AlertConfig {
  cpuWarning: number;
  cpuCritical: number;
  memWarning: number;
  memCritical: number;
  soundEnabled: boolean;
}

export interface ProjectFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}
