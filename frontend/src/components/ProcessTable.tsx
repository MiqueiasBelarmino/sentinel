import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileText, AlertCircle } from 'lucide-react';
import { Process, formatBytes, formatUptime, restartProcess } from '../lib/api';

interface Props {
  processes: Process[];
  onRefresh: () => void;
}

const statusClassMap: Record<string, string> = {
  online: 'status-online',
  stopped: 'status-stopped',
  stopping: 'status-stopped',
  errored: 'status-errored',
  launching: 'status-default',
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusClassMap[status] ?? 'status-default';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default function ProcessTable({ processes, onRefresh }: Props) {
  const navigate = useNavigate();
  const [restarting, setRestarting] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleRestart = async (id: number, name: string) => {
    if (!confirm(`Reiniciar o processo "${name}"?`)) return;
    setError(null);
    setRestarting((prev) => new Set(prev).add(id));
    try {
      await restartProcess(id);
      setTimeout(onRefresh, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erro ao reiniciar "${name}": ${msg}`);
    } finally {
      setRestarting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (processes.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">Nenhum processo encontrado no PM2.</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Processo</th>
              <th>Status</th>
              <th>Uptime</th>
              <th>Reinícios</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>PID</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="process-name">{p.name}</span>
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="cell-muted">{formatUptime(p.uptime)}</td>
                <td className="cell-muted">{p.restarts}</td>
                <td className="cell-muted">{p.cpu}%</td>
                <td className="cell-muted">{formatBytes(p.memory)}</td>
                <td className="cell-mono">{p.pid}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/logs/${p.id}`)}
                      title="Ver logs"
                    >
                      <FileText size={13} />
                      Logs
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={restarting.has(p.id)}
                      onClick={() => handleRestart(p.id, p.name ?? 'processo')}
                      title="Reiniciar processo"
                    >
                      <RotateCcw
                        size={13}
                        className={restarting.has(p.id) ? 'spin-icon' : ''}
                      />
                      {restarting.has(p.id) ? 'Aguarde…' : 'Reiniciar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
