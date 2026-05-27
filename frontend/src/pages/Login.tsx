import { useState, FormEvent } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login } from '../lib/api';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(password);
      onLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Senha incorreta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shield size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="login-logo-text">Sentinel</div>
            <div className="login-logo-sub">Infrastructure Monitor</div>
          </div>
        </div>

        <h1 className="login-title">Acesso restrito</h1>
        <p className="login-desc">
          Painel exclusivo de administração. Digite sua senha para continuar.
        </p>

        {error && (
          <div className="login-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="sentinel-password">
              Senha
            </label>
            <div className="input-wrapper">
              <input
                id="sentinel-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-toggle"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading || !password}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
