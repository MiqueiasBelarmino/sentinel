import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { getSystem, getProcesses, SystemInfo, Process } from '../lib/api';
import SystemCards from '../components/SystemCards';
import ProcessTable from '../components/ProcessTable';

export default function Dashboard() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sys, procs] = await Promise.all([getSystem(), getProcesses()]);
      setSystem(sys);
      setProcesses(procs);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

  const onlineCount = processes.filter((p) => p.status === 'online').length;

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Dashboard</div>
          <div className="main-subtitle">
            {lastUpdated ? `Atualizado às ${timeStr}` : 'Carregando…'}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {loading && !system ? (
          <div className="empty-state">
            <div className="spinner" />
            <span>Carregando dados da VPS…</span>
          </div>
        ) : system ? (
          <>
            <div className="section-label">Status da VPS</div>
            <SystemCards system={system} />

            <div className="section-header">
              <span className="section-title">Processos PM2</span>
              <span className="section-count">
                {onlineCount}/{processes.length} online
              </span>
            </div>
            <ProcessTable processes={processes} onRefresh={() => fetchData()} />
          </>
        ) : null}
      </div>
    </>
  );
}
