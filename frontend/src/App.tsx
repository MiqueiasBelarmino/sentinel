import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { checkAuth } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import HealthChecks from './pages/HealthChecks';
import Environments from './pages/Environments';
import { Toaster } from 'sonner';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    checkAuth()
      .then(() => setAuthState('authenticated'))
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  if (authState === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Conectando…</span>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={<Login onLogin={() => setAuthState('authenticated')} />}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Layout onLogout={() => setAuthState('unauthenticated')}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health" element={<HealthChecks />} />
            <Route path="/environments" element={<Environments />} />
            <Route path="/logs/:id" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}
