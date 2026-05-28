import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();
router.use(requireAuth);

const ENTREGA_CERTA_API_DIR = process.env.ENTREGA_CERTA_API_DIR || 'C:\\Projetos\\entrega-certa\\api';
const ENTREGA_CERTA_ENV_PATH = path.join(ENTREGA_CERTA_API_DIR, '.env');
const ENTREGA_CERTA_HEALTH_URL = process.env.ENTREGA_CERTA_HEALTH_URL || 'http://localhost:3003/health';

// GET /api/environments/entrega-certa
router.get('/entrega-certa', async (_req: Request, res: Response): Promise<void> => {
  try {
    let currentEnv = 'unknown';
    let database = 'unknown';

    // Parse .env
    if (fs.existsSync(ENTREGA_CERTA_ENV_PATH)) {
      const envContent = fs.readFileSync(ENTREGA_CERTA_ENV_PATH, 'utf-8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('APP_ENV=')) {
          currentEnv = line.split('=')[1].replace(/['"]/g, '').trim();
        } else if (line.startsWith('DATABASE_URL=')) {
          const dbUrl = line.substring('DATABASE_URL='.length).replace(/['"]/g, '').trim();
          // Mask credentials: postgresql://user:pass@host:5432/db -> ***@host:5432/db
          const regex = /(postgresql:\/\/[^:]+):[^@]+(@.*)/;
          database = dbUrl.replace(regex, '***$2');
        }
      }
    }

    // Health Check
    let healthStatus = 'unreachable';
    try {
      const response = await fetch(ENTREGA_CERTA_HEALTH_URL, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        healthStatus = 'healthy';
      } else {
        healthStatus = 'unhealthy';
      }
    } catch (err) {
      healthStatus = 'unreachable';
    }

    res.json({
      project: 'entrega-certa-api',
      currentEnv,
      database,
      health: healthStatus,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

// POST /api/environments/entrega-certa/switch
router.post('/entrega-certa/switch', async (req: Request, res: Response): Promise<void> => {
  const { target } = req.body;
  const ALLOWED_TARGETS = ['production', 'demo', 'testing'];

  if (!target || !ALLOWED_TARGETS.includes(target)) {
    res.status(400).json({ error: 'Ambiente alvo inválido ou não autorizado.' });
    return;
  }

  try {
    if (!fs.existsSync(ENTREGA_CERTA_API_DIR)) {
      res.status(500).json({ 
        error: 'Diretório da API não encontrado', 
        details: `O caminho configurado (${ENTREGA_CERTA_API_DIR}) não existe no servidor. Configure a variável ENTREGA_CERTA_API_DIR.`
      });
      return;
    }

    const scriptPath = path.join(ENTREGA_CERTA_API_DIR, 'scripts', 'switch-env.sh');
    const cmd = `bash "${scriptPath}" ${target}`;
    
    const { stdout, stderr } = await execAsync(cmd, { cwd: ENTREGA_CERTA_API_DIR });

    res.json({
      ok: true,
      logs: stdout + (stderr ? '\n[ERRORS]:\n' + stderr : ''),
    });
  } catch (e: any) {
    // child_process exec throws on non-zero exit
    const msg = e.message || String(e);
    const stdout = e.stdout || '';
    const stderr = e.stderr || '';
    res.status(500).json({ 
      error: 'Falha ao trocar de ambiente', 
      details: msg,
      logs: stdout + '\n' + stderr 
    });
  }
});

export default router;
