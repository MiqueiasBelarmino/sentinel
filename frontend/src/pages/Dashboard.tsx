import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Rocket } from 'lucide-react';
import { getSystem, getProcesses, getHealthChecks, triggerDeploy, SystemInfo, Process, HealthCheck, formatBytes } from '../lib/api';
import { toast } from 'sonner';
import SystemCards from '../components/SystemCards';
import ProcessTable from '../components/ProcessTable';

export default function Dashboard() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
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
      const [sys, procs, healths] = await Promise.all([getSystem(), getProcesses(), getHealthChecks()]);
      setSystem(sys);
      setProcesses(procs);
      setHealthChecks(healths);
      setLastUpdated(new Date());
      setError(null);

      // Verificações Globais da VPS
      if (sys.cpu > 90) {
        toast.warning(`Atenção: CPU da VPS está muito alta (${sys.cpu}%)`, { id: 'vps-cpu' });
      } else {
        toast.dismiss('vps-cpu');
      }

      if (sys.memory.percent > 90) {
        toast.warning(`Atenção: RAM da VPS quase esgotada (${sys.memory.percent}%)`, { id: 'vps-ram' });
      } else {
        toast.dismiss('vps-ram');
      }

      if (sys.disk && sys.disk.percent > 90) {
        toast.warning(`Atenção: Disco da VPS quase cheio (${sys.disk.percent}%)`, { id: 'vps-disk' });
      } else {
        toast.dismiss('vps-disk');
      }

      // Verificações de limites de recursos (Processos PM2)
      procs.forEach((p) => {
        if (p.status !== 'online') return;

        // Limite de CPU: 80%
        if (p.cpu > 80) {
          toast.warning(`Alto uso de CPU (${p.cpu}%) no processo: ${p.name}`, { id: `cpu-${p.id}` });
        } else {
          toast.dismiss(`cpu-${p.id}`);
        }

        // Limite de Memória RAM: 500MB (500 * 1024 * 1024)
        if (p.memory > 524288000) {
          toast.warning(`Alto uso de RAM (${formatBytes(p.memory)}) no processo: ${p.name}`, { id: `ram-${p.id}` });
        } else {
          toast.dismiss(`ram-${p.id}`);
        }
      });

      // Verificações de Health Checks (APIs Indisponíveis)
      healths.forEach((h) => {
        if (h.status === 'offline') {
          toast.error(`Serviço Indisponível: ${h.name}`, { id: `health-${h.url}`, duration: 10000 });
        } else {
          toast.dismiss(`health-${h.url}`);
        }
      });
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
        {healthChecks.some(h => h.status === 'offline') && (
          <div className="alert" style={{ marginBottom: '24px', backgroundColor: 'var(--error)', color: '#fff', border: 'none', fontWeight: 500 }}>
            <AlertCircle size={18} />
            🚨 Atenção: Os seguintes serviços estão offline — {healthChecks.filter(h => h.status === 'offline').map(h => h.name).join(', ')}
          </div>
        )}

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
