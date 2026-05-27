import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Rocket } from 'lucide-react';
import { getSystem, getProcesses, triggerDeploy, SystemInfo, Process } from '../lib/api';
import SystemCards from '../components/SystemCards';
import ProcessTable from '../components/ProcessTable';

export default function Dashboard() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deploying, setDeploying] = useState<'api' | 'web' | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  const handleDeploy = async (project: 'api' | 'web') => {
    if (deploying) return;
    setDeploying(project);
    setError(null);
    try {
      await triggerDeploy(project);
      setTimeout(() => fetchData(true), 3000); // refresh procs in 3s
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erro no deploy (${project}): ${msg}`);
    } finally {
      setTimeout(() => setDeploying(null), 1500);
    }
  };

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

  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchData();
      }, autoRefreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [autoRefreshInterval, fetchData]);

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
        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={autoRefreshInterval} 
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            style={{
              padding: '0 8px',
              height: '32px',
              fontSize: '12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={0}>Auto: Desativado</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={20000}>20s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
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

            <div className="section-label" style={{ marginTop: '24px' }}>Ações de Deploy</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleDeploy('api')}
                disabled={deploying !== null}
              >
                {deploying === 'api' ? (
                  <RefreshCw size={15} className="spin-icon" />
                ) : (
                  <Rocket size={15} />
                )}
                Deploy API
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleDeploy('web')}
                disabled={deploying !== null}
              >
                {deploying === 'web' ? (
                  <RefreshCw size={15} className="spin-icon" />
                ) : (
                  <Rocket size={15} />
                )}
                Deploy Web
              </button>
            </div>

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
