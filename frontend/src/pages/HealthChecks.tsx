import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Activity, Globe, Wifi, WifiOff, Plus, Trash2, X } from 'lucide-react';
import { getHealthChecks, HealthCheck, addHealthCheck, deleteHealthCheck } from '../lib/api';

export default function HealthChecks() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;
    setIsSubmitting(true);
    try {
      await addHealthCheck(newName, newUrl);
      setNewName('');
      setNewUrl('');
      setIsModalOpen(false);
      fetchData(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto ${name}?`)) return;
    try {
      await deleteHealthCheck(name);
      fetchData(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  };

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
            className="select-input"
            value={autoRefreshInterval} 
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
          >
            <option value={0}>Auto: Desativado</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={20000}>20s</option>
            <option value={60000}>1m</option>
          </select>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} />
            Adicionar Projeto
          </button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {checks.map((check, idx) => {
              const isOnline = check.status === 'online';
              return (
                <div key={idx} className="metric-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                  {/* Top Section */}
                  <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: isOnline ? 'var(--success-bg)' : 'var(--error-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isOnline ? 'var(--success)' : 'var(--error)',
                        flexShrink: 0
                      }}>
                        {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {check.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {isOnline ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: check.latency > 1000 ? 'var(--warning)' : 'var(--text-primary)', lineHeight: 1 }}>
                            {check.latency} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>ms</span>
                          </div>
                          {check.statusCode && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>
                              HTTP {check.statusCode}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--error)', padding: '4px 8px', background: 'var(--error-bg)', borderRadius: '6px' }}>
                          OFFLINE
                        </div>
                      )}
                      
                      <div style={{ width: '1px', height: '32px', background: 'var(--border)', margin: '0 4px' }} />
                      
                      <button 
                        onClick={() => handleDelete(check.name)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-muted)', 
                          cursor: 'pointer', 
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Remover Projeto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Footer Section (URL) */}
                  <div style={{ 
                    padding: '8px 16px', 
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderTop: '1px solid var(--border)',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <Globe size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <a 
                      href={check.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={check.url}
                      style={{ 
                        color: 'inherit', 
                        textDecoration: 'none', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      {check.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!loading && checks.length === 0 && !error && (
          <div className="empty-state">
            <Activity size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <span>Nenhum health check configurado.</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clique em "Adicionar Projeto" para começar a monitorar.</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--primary)" />
                Novo Projeto
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Nome do Projeto</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: API Principal"
                  required
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>URL Base</label>
                <input 
                  type="url" 
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://meuprojeto.com.br"
                  required
                  pattern="https?://.*"
                  title="A URL deve começar com http:// ou https://"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
