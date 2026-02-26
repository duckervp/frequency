import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { actionRoutes } from './routes/actions';
import { logRoutes } from './routes/logs';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

app.use('*', logger());
app.use(
    '*',
    cors({
        origin: process.env.APP_URL ?? 'http://localhost:5173',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.route('/auth', authRoutes);
app.route('/actions', actionRoutes);
app.route('/logs', logRoutes);

app.get('/health', (c) => c.json({ ok: true }));

export { app };
export default handle(app);
