import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import pm2Routes from './routes/pm2';
import logsRoutes from './routes/logs';
import systemRoutes from './routes/system';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3333', 10);

// Necessário para que o Express confie no proxy Nginx e cookies
// funcionem corretamente com HTTPS
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

// CORS config para permitir cookies no frontend
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://sentinel.entregahub.com.br'],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    },
  }),
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/processes', pm2Routes);
app.use('/api/logs', logsRoutes);

app.listen(PORT, () => {
  console.log(`[sentinel] backend rodando na porta ${PORT}`);
});
