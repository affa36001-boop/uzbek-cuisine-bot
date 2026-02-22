import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import productsRouter from './routes/products.js';
import usersRouter from './routes/users.js';
import ordersRouter from './routes/orders.js';
import routeRouter from './routes/route.js';
import { handleTelegramUpdate, startBotPolling } from './services/botHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

initDatabase();

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'ngrok-skip-browser-warning', 'X-Admin-Password']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'uzbek-cuisine-backend' });
});

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/route', routeRouter);

app.post('/api/bot/webhook', async (req, res) => {
  try { await handleTelegramUpdate(req.body); } catch (err) { console.error('Bot webhook error:', err); }
  res.sendStatus(200);
});

app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🍽️  Uzbek Cuisine Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('');
  startBotPolling();
});

export default app;
