import { Router, Request, Response } from 'express';
import fs from 'fs';
import { requireAuth } from '../middleware/requireAuth';
import { pm2Describe } from '../lib/pm2Client';

const router = Router();
router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const lineCount = Math.min(
    parseInt((req.query.lines as string) || '200', 10),
    500,
  );

  try {
    const descriptions = await pm2Describe(id);

    if (!descriptions || descriptions.length === 0) {
      res.status(404).json({ error: 'Processo não encontrado' });
      return;
    }

    const env = descriptions[0].pm2_env as Record<string, unknown> | undefined;
    const logFile = env?.pm_out_log_path as string | undefined;

    if (!logFile || !fs.existsSync(logFile)) {
      res.json({ lines: [], file: logFile ?? null });
      return;
    }

    try {
      // Read last ~80KB from end of file to avoid loading huge logs
      const CHUNK = 80 * 1024;
      const stats = fs.statSync(logFile);
      const fileSize = stats.size;
      const start = Math.max(0, fileSize - CHUNK);
      const length = fileSize - start;
      const buf = Buffer.alloc(length);
      const fd = fs.openSync(logFile, 'r');
      fs.readSync(fd, buf, 0, length, start);
      fs.closeSync(fd);

      const raw = buf.toString('utf-8');
      const allLines = raw.split('\n').filter((l) => l.trim() !== '');
      // First line may be incomplete if we didn't start at byte 0
      const lines = start > 0 ? allLines.slice(1) : allLines;

      res.json({ lines: lines.slice(-lineCount), file: logFile });
    } catch (readErr: unknown) {
      const msg = readErr instanceof Error ? readErr.message : String(readErr);
      res.status(500).json({ error: msg });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;
