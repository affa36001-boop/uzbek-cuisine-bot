import express from 'express';
import { userQueries } from '../config/database.js';
import { verifyTelegramWebApp } from '../middleware/auth.js';

const router = express.Router();

router.post('/auth', verifyTelegramWebApp, (req, res) => {
  try {
    const { id, first_name, last_name, username, language_code } = req.user;
    let user = userQueries.findByTelegramId.get(id.toString());
    if (!user) {
      userQueries.create.run(id.toString(), first_name || '', last_name || '', username || '', language_code || 'ru');
      user = userQueries.findByTelegramId.get(id.toString());
    }
    res.json({ user: { id: user.id, telegram_id: user.telegram_id, first_name: user.first_name, last_name: user.last_name, username: user.username } });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/me', verifyTelegramWebApp, (req, res) => {
  try {
    const user = userQueries.findByTelegramId.get(req.user.id.toString());
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, telegram_id: user.telegram_id, first_name: user.first_name, last_name: user.last_name, username: user.username } });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

export default router;
