import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { actionRoutes } from './routes/actions.js';
import { logRoutes } from './routes/logs.js';

const app = new Hono().basePath('/api');

app.use('*', async (c, next) => {
    console.log(`[BACKEND] ${c.req.method} ${c.req.url}`);
    await next();
});

app.use('*', logger());
app.use(
    '*',
    cors({
        origin: (origin) => origin, // Echo origin to allow dynamic Vercel previews/same-site
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        credentials: true,
    })
);

app.route('/auth', authRoutes);
app.route('/actions', actionRoutes);
app.route('/logs', logRoutes);

app.get('/health', (c) => c.json({ ok: true }));

export { app };
export default handle(app);
