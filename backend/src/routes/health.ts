import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

interface HealthUrl {
  name: string;
  url: string;
}

const URLS_FILE = path.join(__dirname, '../../health-urls.json');

async function fetchWithTimeout(resource: string, options: { timeout?: number } = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    let urls: HealthUrl[] = [];
    if (fs.existsSync(URLS_FILE)) {
      const data = fs.readFileSync(URLS_FILE, 'utf-8');
      urls = JSON.parse(data);
    }

    const checks = await Promise.all(
      urls.map(async (service) => {
        const start = performance.now();
        try {
          const response = await fetchWithTimeout(service.url, { timeout: 8000 });
          const end = performance.now();
          return {
            name: service.name,
            url: service.url,
            status: response.ok ? 'online' : 'offline',
            latency: Math.round(end - start),
            statusCode: response.status
          };
        } catch (error) {
          const end = performance.now();
          return {
            name: service.name,
            url: service.url,
            status: 'offline',
            latency: Math.round(end - start),
            statusCode: null
          };
        }
      })
    );

    res.json(checks);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

router.post('/urls', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      res.status(400).json({ error: 'Name and URL are required' });
      return;
    }
    
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      res.status(400).json({ error: 'URL must start with http:// or https://' });
      return;
    }

    let urls: HealthUrl[] = [];
    if (fs.existsSync(URLS_FILE)) {
      const data = fs.readFileSync(URLS_FILE, 'utf-8');
      urls = JSON.parse(data);
    }

    if (urls.some(u => u.name === name)) {
      res.status(400).json({ error: 'A health check with this name already exists' });
      return;
    }

    urls.push({ name, url });
    fs.writeFileSync(URLS_FILE, JSON.stringify(urls, null, 2), 'utf-8');
    
    res.status(201).json({ ok: true, message: 'Health check added' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

router.delete('/urls/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    
    let urls: HealthUrl[] = [];
    if (fs.existsSync(URLS_FILE)) {
      const data = fs.readFileSync(URLS_FILE, 'utf-8');
      urls = JSON.parse(data);
    }

    const initialLength = urls.length;
    urls = urls.filter(u => u.name !== name);

    if (urls.length === initialLength) {
      res.status(404).json({ error: 'Health check not found' });
      return;
    }

    fs.writeFileSync(URLS_FILE, JSON.stringify(urls, null, 2), 'utf-8');
    
    res.json({ ok: true, message: 'Health check removed' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;
