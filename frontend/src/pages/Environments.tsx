import { useState, useEffect } from 'react';
import { Layers, Server, Activity, Database, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface EnvStatus {
  project: string;
  currentEnv: string;
  database: string;
  health: string;
}

export default function Environments() {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetEnv, setTargetEnv] = useState('demo');
  const [confirmation, setConfirmation] = useState('');
  const [switching, setSwitching] = useState(false);
  const [logs, setLogs] = useState<string>('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/environments/entrega-hub');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      toast.error('Erro ao buscar status do ambiente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmation !== `SWITCH TO ${targetEnv.toUpperCase()}`) return;

    setSwitching(true);
    setLogs('Iniciando troca de ambiente...\n');

    try {
      const res = await fetch('/api/environments/entrega-hub/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetEnv })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Ambiente trocado para ${targetEnv}`);
        setLogs((prev) => prev + data.logs + '\n\nAtualizando status...');
        await fetchStatus();
      } else {
        toast.error('Falha na troca de ambiente');
        setLogs((prev) => prev + '\n[ERRO] ' + (data.error || 'Erro desconhecido') + '\n' + (data.details || '') + '\n' + (data.logs || ''));
      }
    } catch (err) {
      toast.error('Erro de rede');
      setLogs((prev) => prev + '\n[ERRO FATAL] Falha de comunicação com o servidor.');
    } finally {
      setSwitching(false);
      setConfirmation('');
    }
  };

  const expectedConfirmation = `SWITCH TO ${targetEnv.toUpperCase()}`;
  const isConfirmed = confirmation === expectedConfirmation;

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <span>Carregando ambiente...</span>
      </div>
    );
  }

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">Environment Control</div>
          <div className="main-subtitle">Gerencie os ambientes e rotinas seguras da aplicação.</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>

          {/* Status Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div className="section-header">
              <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} /> Status Atual
              </span>
            </div>

            {status ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Projeto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <Server size={14} style={{ color: 'var(--text-secondary)' }} /> {status.project}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Ambiente Atual</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge ${status.currentEnv === 'production' ? 'status-online' : 'status-stopped'}`}>
                      {status.currentEnv}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Health Check</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge ${status.health === 'healthy' ? 'status-online' : 'status-errored'}`}>
                      {status.health}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Database</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    <Database size={14} style={{ color: 'var(--text-secondary)' }} /> {status.database}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                Não foi possível carregar o status.
              </div>
            )}
          </div>

          {/* Switch Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div className="section-header">
              <span className="section-title">Trocar Ambiente</span>
            </div>

            <form onSubmit={handleSwitch} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

              <div>
                <label className="form-label">Ambiente Alvo</label>
                <div className="input-wrapper">
                  <select
                    className="form-input"
                    value={targetEnv}
                    onChange={(e) => {
                      setTargetEnv(e.target.value);
                      setConfirmation('');
                    }}
                    disabled={switching}
                  >
                    <option value="production">Production</option>
                    <option value="demo">Demo</option>
                    <option value="testing">Testing</option>
                  </select>
                </div>
              </div>

              <div className="alert" style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--warning)', margin: 0 }}>
                <Activity size={16} style={{ flexShrink: 0 }} />
                <span>Você está mudando para <strong>{targetEnv}</strong>. Isso reiniciará a API imediatamente.</span>
              </div>

              <div>
                <label className="form-label" style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-primary)' }}>
                  Digite <strong style={{ userSelect: 'none', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{expectedConfirmation}</strong> para confirmar:
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={expectedConfirmation}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    disabled={switching}
                    autoComplete="off"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`btn ${targetEnv === 'production' ? 'btn-danger-ghost' : 'btn-primary'}`}
                disabled={!isConfirmed || switching}
                style={{ justifyContent: 'center', marginTop: '8px', width: '100%' }}
              >
                {switching ? 'Executando...' : 'Confirmar e Trocar'}
              </button>
            </form>
          </div>
        </div>

        {/* Logs Output */}
        {logs && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logs Operacionais</span>
            </div>
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a3be8c', lineHeight: '1.6' }}>
                {logs}
              </pre>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
