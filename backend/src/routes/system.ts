import { Router, Request, Response } from 'express';
import si from 'systeminformation';
import { exec } from 'child_process';
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

router.post('/deploy/:project', (req: Request, res: Response): void => {
  const { project } = req.params;

  let scriptPath = '';
  if (project === 'api') {
    scriptPath = 'bash /home/ubuntu/apps/entrega-hub/deploy-api.sh';
  } else if (project === 'web') {
    scriptPath = 'bash /home/ubuntu/apps/entrega-hub/deploy-web.sh';
  } else {
    res.status(400).json({ error: 'Projeto inválido. Use "api" ou "web".' });
    return;
  }

  // Executa o script de deploy em background (não bloqueia a requisição)
  exec(scriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar deploy de ${project}:`, error);
      return;
    }
    console.log(`Deploy ${project} stdout:`, stdout);
    if (stderr) console.error(`Deploy ${project} stderr:`, stderr);
  });

  res.status(202).json({ message: `Deploy de ${project} iniciado.` });
});

export default router;
