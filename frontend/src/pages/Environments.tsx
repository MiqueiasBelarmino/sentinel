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
      const res = await fetch('/api/environments/entrega-certa');
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
      const res = await fetch('/api/environments/entrega-certa/switch', {
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
    return <div className="page-loading">Carregando ambiente...</div>;
  }

  return (
    <div className="page-container environments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Environment Control</h1>
          <p className="page-sub">Gerencie os ambientes e rotinas seguras da aplicação.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* Status Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Layers size={16}/> Status Atual</h3>
          </div>
          <div className="card-body">
            {status ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div className="label" style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Projeto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    <Server size={14} color="#555" /> {status.project}
                  </div>
                </div>
                <div>
                  <div className="label" style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Ambiente Atual</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    <span className={`status-badge ${status.currentEnv === 'production' ? 'success' : 'warning'}`}>
                      {status.currentEnv}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="label" style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Health Check</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    <Activity size={14} color={status.health === 'healthy' ? '#10b981' : '#ef4444'} /> 
                    <span style={{ color: status.health === 'healthy' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }}>
                      {status.health}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="label" style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Database</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontFamily: 'monospace', fontSize: '13px' }}>
                    <Database size={14} color="#555" /> {status.database}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#888' }}>Não foi possível carregar o status.</div>
            )}
          </div>
        </div>

        {/* Switch Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Trocar Ambiente</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSwitch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Ambiente Alvo</label>
                <select 
                  className="input-field" 
                  value={targetEnv} 
                  onChange={(e) => {
                    setTargetEnv(e.target.value);
                    setConfirmation('');
                  }}
                  disabled={switching}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="production">Production</option>
                  <option value="demo">Demo</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fffbe1', border: '1px solid #fce883', borderRadius: '6px', fontSize: '13px', color: '#8a6d3b' }}>
                <strong>Atenção:</strong> Você está mudando a aplicação para o ambiente <strong>{targetEnv}</strong>. 
                Isso reiniciará a API imediatamente.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Digite <strong style={{ userSelect: 'none' }}>{expectedConfirmation}</strong> para confirmar:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={expectedConfirmation}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={switching}
                  autoComplete="off"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'monospace' }}
                />
              </div>

              <button 
                type="submit" 
                className={`btn ${targetEnv === 'production' ? 'danger' : 'primary'}`}
                disabled={!isConfirmed || switching}
                style={{
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: !isConfirmed || switching ? '#ccc' : (targetEnv === 'production' ? '#ef4444' : '#3b82f6'),
                  color: '#fff',
                  fontWeight: 600,
                  cursor: !isConfirmed || switching ? 'not-allowed' : 'pointer',
                  marginTop: '10px'
                }}
              >
                {switching ? 'Executando...' : 'Confirmar e Trocar'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Logs Output */}
      {logs && (
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid #333', backgroundColor: '#1e1e1e', color: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <h3 className="card-title" style={{ color: '#fff' }}><Terminal size={16}/> Logs Operacionais</h3>
          </div>
          <div className="card-body" style={{ backgroundColor: '#1e1e1e', color: '#a3be8c', padding: '15px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}>
              {logs}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
