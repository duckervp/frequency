import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { actionRoutes } from './routes/actions.js';
import { logRoutes } from './routes/logs.js';
import { users } from './db/schema.js';
import { db } from './lib/db.js';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

app.use('*', async (c, next) => {
    console.log(`[BACKEND] ${c.req.method} ${c.req.url}`);
    await next();
});

app.use('*', logger());
app.use(
    '*',
    cors({
        origin: (origin) => origin || '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        credentials: true,
    })
);

app.get('/test-ping', (c) => c.text('pong'));
app.get('/test-db', async (c) => {
    try {
        await db.select().from(users).limit(1);
        return c.json({ status: 'connected to turso' });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 500);
    }
});

app.route('/auth', authRoutes);
app.route('/actions', actionRoutes);
app.route('/logs', logRoutes);

app.get('/health', (c) => c.json({ ok: true }));

export { app };
export default handle(app);
