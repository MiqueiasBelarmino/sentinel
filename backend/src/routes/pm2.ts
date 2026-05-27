import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { pm2List, pm2Restart } from '../lib/pm2Client';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await pm2List();
    const processes = list.map((p) => ({
      id: p.pm_id,
      name: p.name,
      status: p.pm2_env?.status ?? 'unknown',
      uptime: (p.pm2_env as Record<string, unknown>)?.pm_uptime ?? null,
      restarts: p.pm2_env?.restart_time ?? 0,
      memory: p.monit?.memory ?? 0,
      cpu: p.monit?.cpu ?? 0,
      pid: p.pid,
    }));
    res.json(processes);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

router.post('/:id/restart', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pm2Restart(id);
    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;
