import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { password } = req.body as { password?: string };

  if (!password || password !== process.env.SENTINEL_PASSWORD) {
    res.status(401).json({ error: 'Senha incorreta' });
    return;
  }

  req.session.authenticated = true;
  res.json({ ok: true });
});

router.post('/logout', requireAuth, (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (_req: Request, res: Response): void => {
  res.json({ authenticated: true });
});

export default router;
