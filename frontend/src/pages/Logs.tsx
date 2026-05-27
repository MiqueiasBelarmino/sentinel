import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getLogs, getProcesses } from '../lib/api';

export default function Logs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lines, setLines] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string>('');
  const [processName, setProcessName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve process name from id
  useEffect(() => {
    if (!id) return;
    getProcesses()
      .then((procs) => {
        const p = procs.find((proc) => String(proc.id) === id);
        if (p?.name) setProcessName(p.name);
      })
      .catch(() => {});
  }, [id]);

  const fetchLogs = useCallback(
    async (isManual = false) => {
      if (!id) return;
      if (isManual) setRefreshing(true);
      try {
        const data = await getLogs(id);
        setLines(data.lines);
        setFilePath(data.file ?? '');
        setError(null);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
          80,
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <>
      <div className="main-header">
        <div>
          <div className="main-title">
            Logs{processName ? ` — ${processName}` : ''}
          </div>
          {filePath && (
            <div className="main-subtitle log-file-path">{filePath}</div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <ArrowLeft size={13} />
            Voltar
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchLogs(true)}
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

        <div className="section-header">
          <span className="section-title">
            {loading ? 'Carregando…' : `${lines.length} linhas`}
          </span>
        </div>

        {loading && lines.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" />
            <span>Lendo arquivo de log…</span>
          </div>
        ) : (
          <div className="log-output">
            {lines.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)' }}>
                Sem linhas de log disponíveis para este processo.
              </span>
            ) : (
              lines.map((line, i) => (
                <span key={i} className="log-line">
                  <span className="log-line-num">{i + 1}</span>
                  {line}
                </span>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </>
  );
}
