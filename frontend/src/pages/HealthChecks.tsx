import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Activity, Globe, Wifi, WifiOff } from 'lucide-react';
import { getHealthChecks, HealthCheck } from '../lib/api';

export default function HealthChecks() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getHealthChecks();
      setChecks(data);
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

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Health Checks</div>
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

        {loading && checks.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" />
            <span>Verificando serviços…</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {checks.map((check, idx) => {
              const isOnline = check.status === 'online';
              return (
                <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <Activity size={18} color="var(--primary)" />
                      {check.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: isOnline ? 'var(--success)' : 'var(--danger)',
                      background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all' }}>
                    <Globe size={14} />
                    {check.url}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Latência
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: isOnline ? (check.latency > 1000 ? 'var(--warning)' : 'var(--text-main)') : 'var(--danger)' }}>
                      {isOnline ? `${check.latency} ms` : '—'}
                    </div>
                  </div>
                  
                  {check.statusCode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Status HTTP
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {check.statusCode}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {!loading && checks.length === 0 && !error && (
          <div className="empty-state">
            <Activity size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <span>Nenhum health check configurado.</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Edite o arquivo backend/health-urls.json para adicionar URLs.</span>
          </div>
        )}
      </div>
    </>
  );
}
