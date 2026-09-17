import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, AlertCircle, Bell } from 'lucide-react';
import { getAlerts, Alert } from '../lib/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
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

  // Extrair opções únicas para os filtros
  const projects = useMemo(() => Array.from(new Set(alerts.map(a => a.projeto))), [alerts]);
  const types = useMemo(() => Array.from(new Set(alerts.map(a => a.tipo))), [alerts]);

  const filteredAlerts = alerts.filter(a => {
    const matchProject = projectFilter === 'all' || a.projeto === projectFilter;
    const matchType = typeFilter === 'all' || a.tipo === typeFilter;
    return matchProject && matchType;
  });

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Barramento de Alertas</div>
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

        {/* Filters */}
        {!loading && alerts.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="all">Todos os Projetos</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="all">Todos os Tipos</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {loading && alerts.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" />
            <span>Buscando alertas…</span>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Data/Hora</th>
                  <th style={{ width: '150px' }}>Projeto</th>
                  <th style={{ width: '150px' }}>Tipo</th>
                  <th>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => {
                  const date = new Date(alert.data);
                  const isCritical = alert.tipo.toLowerCase().includes('error') || alert.tipo.toLowerCase().includes('critico');
                  
                  return (
                    <tr key={alert.id} style={{ background: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR')}
                      </td>
                      <td>
                        <span style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px' 
                        }}>
                          {alert.projeto}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: isCritical ? 'var(--danger)' : 'var(--warning)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontWeight: 500
                        }}>
                          {isCritical ? <AlertTriangle size={14} /> : <AlertCircle size={14} />}
                          {alert.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: isCritical ? 'var(--danger)' : 'var(--text-main)', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-word' }}>
                        {alert.mensagem}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Bell size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <span>Nenhum alerta para exibir.</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Quando os serviços enviarem erros críticos, eles aparecerão aqui.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
