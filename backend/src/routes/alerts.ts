import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/requireAuth';
import crypto from 'crypto';

const router = Router();

export interface Alert {
  id: string;
  projeto: string;
  tipo: string;
  mensagem: string;
  data: string;
}

const ALERTS_FILE = path.join(__dirname, '../../alerts.json');
const MAX_ALERTS = 500;

function readAlerts(): Alert[] {
  if (!fs.existsSync(ALERTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ALERTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeAlerts(alerts: Alert[]): void {
  // Mantém apenas os últimos MAX_ALERTS para não estourar o armazenamento
  if (alerts.length > MAX_ALERTS) {
    alerts = alerts.slice(alerts.length - MAX_ALERTS);
  }
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf-8');
}

// Rota GET: Requer que o usuário esteja logado no painel
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const alerts = readAlerts();
    // Inverte para enviar os mais recentes primeiro
    res.json(alerts.reverse());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

// Rota POST: Requer o Token da API
router.post('/', (req: Request, res: Response): void => {
  try {
    const apiKey = process.env.SENTINEL_API_KEY;
    const authHeader = req.headers.authorization;

    // Verificação super simples de token
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      res.status(401).json({ error: 'Token de API inválido ou ausente' });
      return;
    }

    const { projeto, tipo, mensagem } = req.body;
    
    if (!projeto || !tipo || !mensagem) {
      res.status(400).json({ error: 'Campos projeto, tipo e mensagem são obrigatórios' });
      return;
    }

    const newAlert: Alert = {
      id: crypto.randomUUID(),
      projeto,
      tipo,
      mensagem,
      data: new Date().toISOString()
    };

    const alerts = readAlerts();
    alerts.push(newAlert);
    writeAlerts(alerts);

    res.status(201).json({ ok: true, message: 'Alerta recebido com sucesso' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;
