import { Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { SystemInfo, formatBytes } from '../lib/api';

interface Props {
  system: SystemInfo;
}

function getLevel(percent: number): 'low' | 'medium' | 'high' {
  if (percent < 60) return 'low';
  if (percent < 85) return 'medium';
  return 'high';
}

const levelColor: Record<string, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--error)',
};

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  percent: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, detail, percent, icon }: MetricCardProps) {
  const level = getLevel(percent);
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value" style={{ color: levelColor[level] }}>
        {value}
      </div>
      <div className="metric-detail">{detail}</div>
      <div className="progress-bar">
        <div
          className={`progress-fill level-${level}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function SystemCards({ system }: Props) {
  return (
    <div className="system-grid">
      <MetricCard
        label="CPU"
        icon={<Cpu size={16} />}
        value={`${system.cpu}%`}
        detail="Carga atual do processador"
        percent={system.cpu}
      />
      <MetricCard
        label="Memória RAM"
        icon={<MemoryStick size={16} />}
        value={`${system.memory.percent}%`}
        detail={`${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}`}
        percent={system.memory.percent}
      />
      <MetricCard
        label="Disco"
        icon={<HardDrive size={16} />}
        value={system.disk ? `${system.disk.percent}%` : '—'}
        detail={
          system.disk
            ? `${formatBytes(system.disk.used)} / ${formatBytes(system.disk.size)}`
            : 'Sem dados'
        }
        percent={system.disk?.percent ?? 0}
      />
    </div>
  );
}
