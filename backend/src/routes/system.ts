import { Router, Request, Response } from 'express';
import si from 'systeminformation';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [load, mem, disks] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    const mainDisk = disks.find((d) => d.mount === '/') ?? disks[0];

    res.json({
      cpu: Math.round(load.currentLoad),
      memory: {
        used: mem.used,
        total: mem.total,
        percent: Math.round((mem.used / mem.total) * 100),
      },
      disk: mainDisk
        ? {
            used: mainDisk.used,
            size: mainDisk.size,
            percent: Math.round(mainDisk.use),
            mount: mainDisk.mount,
          }
        : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;
