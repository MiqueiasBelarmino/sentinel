export interface SystemInfo {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: number; size: number; percent: number; mount: string } | null;
}

export interface Process {
  id: number;
  name: string;
  status: string;
  uptime: number | null;
  restarts: number;
  memory: number;
  cpu: number;
  pid: number;
}

export interface HealthCheck {
  name: string;
  url: string;
  status: 'online' | 'offline';
  latency: number;
  statusCode: number | null;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const checkAuth = (): Promise<{ authenticated: boolean }> =>
  apiFetch('/api/auth/me');

export const login = (password: string): Promise<{ ok: boolean }> =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

export const logout = (): Promise<{ ok: boolean }> =>
  apiFetch('/api/auth/logout', { method: 'POST' });

export const getSystem = (): Promise<SystemInfo> => apiFetch('/api/system');

export const getProcesses = (): Promise<Process[]> => apiFetch('/api/processes');

export const getHealthChecks = (): Promise<HealthCheck[]> => apiFetch('/api/health');

export const restartProcess = (id: number | string): Promise<{ ok: boolean }> =>
  apiFetch(`/api/processes/${id}/restart`, { method: 'POST' });

export const getLogs = (
  id: number | string,
  lines = 200,
): Promise<{ lines: string[]; file: string }> =>
  apiFetch(`/api/logs/${id}?lines=${lines}`);

export const triggerDeploy = (project: 'api' | 'web'): Promise<{ message: string }> =>
  apiFetch(`/api/system/deploy/${project}`, { method: 'POST' });

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatUptime(ms: number | null): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
