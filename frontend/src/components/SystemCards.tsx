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
    <div className="metric-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      
      {/* Esquerda: Icone e Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: levelColor[level],
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '2px' }}>
            {label}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {detail}
          </div>
        </div>
      </div>

      {/* Direita: Valor e Barra de Progresso */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '80px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: levelColor[level], lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            className={`progress-fill level-${level}`}
            style={{ width: `${Math.max(percent, 0)}%`, height: '100%', transition: 'width 0.5s ease-in-out' }}
          />
        </div>
      </div>

    </div>
  );
}

export default function SystemCards({ system }: Props) {
  return (
    <div className="system-grid">
      <MetricCard
        label="Uso de CPU"
        icon={<Cpu size={20} />}
        value={`${system.cpu}%`}
        detail="Processamento Ativo"
        percent={system.cpu}
      />
      <MetricCard
        label="Memória RAM"
        icon={<MemoryStick size={20} />}
        value={`${system.memory.percent}%`}
        detail={`${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}`}
        percent={system.memory.percent}
      />
      <MetricCard
        label="Armazenamento"
        icon={<HardDrive size={20} />}
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
