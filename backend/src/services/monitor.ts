import fs from 'fs';
import path from 'path';
import { sendTelegramMessage } from './telegram';

interface HealthUrl {
  name: string;
  url: string;
}

interface ServiceState {
  consecutiveFailures: number;
  isDown: boolean;
}

const URLS_FILE = path.join(__dirname, '../../health-urls.json');
const stateMap = new Map<string, ServiceState>();

async function fetchWithTimeout(resource: string, options: { timeout?: number } = {}) {
  const { timeout = 8000 } = options;
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

async function checkServices() {
  let urls: HealthUrl[] = [];
  if (fs.existsSync(URLS_FILE)) {
    try {
      const data = fs.readFileSync(URLS_FILE, 'utf-8');
      urls = JSON.parse(data);
    } catch (e) {
      console.error('[sentinel] Erro ao ler health-urls.json no monitor:', e);
      return;
    }
  }

  for (const service of urls) {
    if (!stateMap.has(service.name)) {
      stateMap.set(service.name, { consecutiveFailures: 0, isDown: false });
    }
    const state = stateMap.get(service.name)!;

    try {
      const response = await fetchWithTimeout(service.url);
      
      if (response.ok) {
        // Serviço respondeu com sucesso
        if (state.isDown) {
          // Estava fora do ar e voltou!
          state.isDown = false;
          state.consecutiveFailures = 0;
          await sendTelegramMessage(
            `🟢 <b>Serviço Restaurado</b>\n\n` +
            `O projeto <b>${service.name}</b> voltou a responder normalmente.\n` +
            `🔗 ${service.url}`
          );
        } else {
          // Continua OK
          state.consecutiveFailures = 0;
        }
      } else {
        // Respondeu, mas com erro HTTP (ex: 500, 502)
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error: any) {
      // Serviço não respondeu ou deu erro HTTP
      state.consecutiveFailures += 1;

      if (state.consecutiveFailures >= 2 && !state.isDown) {
        // Caiu pela 2ª vez seguida e ainda não enviou notificação
        state.isDown = true;
        const msg = error.message || 'Timeout / Offline';
        await sendTelegramMessage(
          `🔴 <b>Serviço Fora do Ar!</b>\n\n` +
          `O projeto <b>${service.name}</b> falhou em 2 verificações consecutivas.\n` +
          `<b>Erro:</b> ${msg}\n` +
          `🔗 ${service.url}`
        );
      }
    }
  }
}

let intervalId: NodeJS.Timeout | null = null;

export const MonitorService = {
  start() {
    if (intervalId) return;
    console.log('[sentinel] Monitor de Alertas Ativos iniciado (1 min interval).');
    
    // Executa a primeira vez 10 segundos após o boot, e depois a cada 1 minuto
    setTimeout(() => {
      checkServices();
      intervalId = setInterval(checkServices, 60000);
    }, 10000);
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('[sentinel] Monitor de Alertas parado.');
    }
  }
};
